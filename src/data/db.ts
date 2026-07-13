import Dexie, { type Table } from 'dexie'
import type {
  BodyMetric,
  Exercise,
  Routine,
  ScheduledWorkout,
  Settings,
  WeeklySchedule,
  WorkoutSession,
} from './types'
import {
  DEFAULT_SETTINGS,
  PUSH_ROUTINE_ID,
  SEED_EXERCISES,
  buildSeedRoutines,
  buildSeedSchedule,
} from './seed'

class LiftLogDB extends Dexie {
  exercises!: Table<Exercise, string>
  routines!: Table<Routine, string>
  schedule!: Table<WeeklySchedule, string>
  scheduledWorkouts!: Table<ScheduledWorkout, string>
  sessions!: Table<WorkoutSession, string>
  bodyMetrics!: Table<BodyMetric, string>
  settings!: Table<Settings, string>

  constructor() {
    super('liftlog')
    this.version(1).stores({
      exercises: 'id, name, primaryMuscle, equipment',
      routines: 'id, type',
      schedule: 'id',
      scheduledWorkouts: 'id, date, routineId, status',
      sessions: 'id, date, routineId, status, completedAt',
      bodyMetrics: 'id, date',
      settings: 'id',
    })
  }
}

export const db = new LiftLogDB()

/** Seed first-run data exactly once. Safe to call on every boot. */
export async function ensureSeeded(): Promise<void> {
  const settingsCount = await db.settings.count()
  if (settingsCount > 0) return

  await db.transaction(
    'rw',
    db.exercises,
    db.routines,
    db.schedule,
    db.settings,
    async () => {
      await db.exercises.bulkPut(SEED_EXERCISES)
      await db.routines.bulkPut(buildSeedRoutines())
      await db.schedule.put(buildSeedSchedule())
      await db.settings.put(DEFAULT_SETTINGS)
    },
  )
}

/** Catalog ids that should be measured by time, not load. */
const DURATION_EXERCISE_IDS = ['ex_prone_superman', 'ex_side_bridge']

/** Local yyyy-mm-dd for "today", matching how scheduledWorkouts store dates. */
function todayISO(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * PLAN_V2: swap existing installs over to the new exercise library, the three
 * catalog routines, and the Mon/Thu/Sat schedule. Idempotent — the presence of
 * the new Push & Hinge routine means it has already run, so it does nothing on
 * subsequent boots (and no-ops for fresh installs, which ensureSeeded already
 * seeded with the same data). Exercise rows are only upserted, never deleted,
 * because past session set-logs reference their exerciseIds.
 */
async function migratePlanV2(): Promise<void> {
  const alreadyMigrated = await db.routines.get(PUSH_ROUTINE_ID)
  if (alreadyMigrated) return

  const routines = buildSeedRoutines()
  const schedule = buildSeedSchedule()
  const cutoff = todayISO()

  await db.transaction(
    'rw',
    db.exercises,
    db.routines,
    db.schedule,
    db.scheduledWorkouts,
    db.sessions,
    async () => {
      // (a) Upsert the full catalog — updates existing ids in place, adds new,
      // never deletes (old exercises stay for historical session references).
      await db.exercises.bulkPut(SEED_EXERCISES)
      // (b) Replace all routines with the three new ones.
      await db.routines.clear()
      await db.routines.bulkPut(routines)
      // (c) Replace the weekly schedule.
      await db.schedule.put(schedule)
      // (d) Drop future-dated overrides (they point at now-deleted routine ids);
      // keep today and past entries so history stays intact.
      await db.scheduledWorkouts.where('date').above(cutoff).delete()
      // (e) Drop an untouched in-progress session for today: its routineId is
      // now dead, and startOrGetSession would otherwise pair its empty set logs
      // with whichever new routine the user starts. Any logged work is kept.
      const todays = await db.sessions.where('date').equals(cutoff).toArray()
      for (const s of todays) {
        const hasWork = s.setLogs.some((l) => l.completed)
        if (s.status === 'in_progress' && !hasWork) {
          await db.sessions.delete(s.id)
        }
      }
    },
  )
}

/**
 * Idempotent patches for installs seeded before a feature shipped. Runs on every
 * boot (cheap) so existing local data picks up new fields without a full reset.
 */
export async function runMigrations(): Promise<void> {
  await migratePlanV2()

  for (const id of DURATION_EXERCISE_IDS) {
    const ex = await db.exercises.get(id)
    if (ex && ex.tracking !== 'duration') {
      await db.exercises.put({ ...ex, tracking: 'duration' })
    }
  }

  // Exercises added after PLAN_V2 shipped — upsert for existing installs.
  const NEW_EXERCISE_IDS = ['ex_barbell_curl', 'ex_cable_curl']
  for (const id of NEW_EXERCISE_IDS) {
    if (!(await db.exercises.get(id))) {
      const ex = SEED_EXERCISES.find((e) => e.id === id)
      if (ex) await db.exercises.put(ex)
    }
  }
}

/** Wipe everything and re-seed. Used by Settings → reset and by import. */
export async function resetAll(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.exercises,
      db.routines,
      db.schedule,
      db.scheduledWorkouts,
      db.sessions,
      db.bodyMetrics,
      db.settings,
    ],
    async () => {
      await Promise.all([
        db.exercises.clear(),
        db.routines.clear(),
        db.schedule.clear(),
        db.scheduledWorkouts.clear(),
        db.sessions.clear(),
        db.bodyMetrics.clear(),
        db.settings.clear(),
      ])
    },
  )
}
