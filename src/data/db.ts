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
const DURATION_EXERCISE_IDS = ['ex_plank']

/**
 * Idempotent patches for installs seeded before a feature shipped. Runs on every
 * boot (cheap) so existing local data picks up new fields without a full reset.
 */
export async function runMigrations(): Promise<void> {
  for (const id of DURATION_EXERCISE_IDS) {
    const ex = await db.exercises.get(id)
    if (ex && ex.tracking !== 'duration') {
      await db.exercises.put({ ...ex, tracking: 'duration' })
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
