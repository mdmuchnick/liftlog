import { db, resetAll } from './db'
import { uid } from './seed'
import type {
  BodyMetric,
  Exercise,
  ProgressionSuggestion,
  Routine,
  RoutineExercise,
  ScheduledWorkout,
  SetLog,
  Settings,
  WeeklySchedule,
  WorkoutSession,
} from './types'
import { todayISO, weekday } from '../lib/date'
import { sessionVolume } from '../lib/metrics'
import { evaluateSession } from '../engine/progression'

// ---------- Settings ----------
export async function getSettings(): Promise<Settings | undefined> {
  return db.settings.get('settings')
}
export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const cur = await db.settings.get('settings')
  if (cur) await db.settings.put({ ...cur, ...patch })
}

// ---------- Schedule resolution ----------
export async function getSchedule(): Promise<WeeklySchedule | undefined> {
  return db.schedule.get('weekly')
}

/**
 * Resolve the routine assigned to a date: an explicit ScheduledWorkout override
 * wins; otherwise fall back to the recurring weekly schedule.
 */
export async function resolveRoutineForDate(
  date: string,
): Promise<{ routineId: string | null; override?: ScheduledWorkout }> {
  const override = await db.scheduledWorkouts.where('date').equals(date).first()
  if (override) return { routineId: override.routineId, override }
  const schedule = await db.schedule.get('weekly')
  const assignment = schedule?.assignments.find((a) => a.weekday === weekday(date))
  return { routineId: assignment?.routineId ?? null }
}

// ---------- Sessions ----------
export async function getSessionForDate(date: string): Promise<WorkoutSession | undefined> {
  return db.sessions.where('date').equals(date).first()
}

function buildSetLogs(sessionId: string, routine: Routine): SetLog[] {
  const logs: SetLog[] = []
  for (const rex of [...routine.exercises].sort((a, b) => a.order - b.order)) {
    for (let i = 1; i <= rex.targetSets; i++) {
      logs.push({
        id: uid(),
        sessionId,
        exerciseId: rex.exerciseId,
        routineExerciseId: rex.id,
        setNumber: i,
        targetReps: rex.targetRepsMax,
        targetWeight: rex.targetWeight,
        targetDuration: rex.targetDuration,
        completed: false,
      })
    }
  }
  return logs
}

/** Get the existing session for a date, or create an in_progress one from the routine. */
export async function startOrGetSession(date: string, routine: Routine): Promise<WorkoutSession> {
  const existing = await db.sessions.where('date').equals(date).first()
  if (existing) return existing
  const id = uid()
  const session: WorkoutSession = {
    id,
    date,
    routineId: routine.id,
    routineName: routine.name,
    routineType: routine.type,
    startedAt: Date.now(),
    status: 'in_progress',
    setLogs: buildSetLogs(id, routine),
  }
  await db.sessions.put(session)
  return session
}

export async function saveSession(session: WorkoutSession): Promise<void> {
  await db.sessions.put(session)
}

/** Toggle a single set's completion and persist. Returns the updated session. */
export async function toggleSet(sessionId: string, setLogId: string): Promise<WorkoutSession | undefined> {
  const session = await db.sessions.get(sessionId)
  if (!session) return
  session.setLogs = session.setLogs.map((sl) =>
    sl.id === setLogId ? { ...sl, completed: !sl.completed } : sl,
  )
  if (!session.startedAt) session.startedAt = Date.now()
  await db.sessions.put(session)
  return session
}

export async function updateSetLog(
  sessionId: string,
  setLogId: string,
  patch: Partial<SetLog>,
): Promise<WorkoutSession | undefined> {
  const session = await db.sessions.get(sessionId)
  if (!session) return
  session.setLogs = session.setLogs.map((sl) => (sl.id === setLogId ? { ...sl, ...patch } : sl))
  await db.sessions.put(session)
  return session
}

/** Append one more set to an exercise mid-session, copying the last set's targets. */
export async function addSet(
  sessionId: string,
  routineExerciseId: string,
): Promise<WorkoutSession | undefined> {
  const session = await db.sessions.get(sessionId)
  if (!session) return
  const logs = session.setLogs.filter((s) => s.routineExerciseId === routineExerciseId)
  const last = logs[logs.length - 1]
  if (!last) return session
  const newLog: SetLog = {
    id: uid(),
    sessionId,
    exerciseId: last.exerciseId,
    routineExerciseId,
    setNumber: logs.length + 1,
    targetReps: last.actualReps ?? last.targetReps,
    targetWeight: last.actualWeight ?? last.targetWeight,
    targetDuration: last.actualDuration ?? last.targetDuration,
    completed: false,
  }
  // Insert right after the exercise's existing logs to keep order tidy.
  const lastIdx = session.setLogs.lastIndexOf(last)
  session.setLogs = [
    ...session.setLogs.slice(0, lastIdx + 1),
    newLog,
    ...session.setLogs.slice(lastIdx + 1),
  ]
  await db.sessions.put(session)
  return session
}

/**
 * Ensure a session has set logs for the given routine exercise, creating them
 * if missing (used when an exercise is added to the routine mid-workout).
 * Idempotent — no-op if the exercise already has logs. Returns the session.
 */
export async function addExerciseToSession(
  sessionId: string,
  rex: RoutineExercise,
): Promise<WorkoutSession | undefined> {
  const session = await db.sessions.get(sessionId)
  if (!session) return
  const hasLogs = session.setLogs.some((sl) => sl.routineExerciseId === rex.id)
  if (hasLogs) return session
  const newLogs: SetLog[] = []
  for (let i = 1; i <= rex.targetSets; i++) {
    newLogs.push({
      id: uid(),
      sessionId,
      exerciseId: rex.exerciseId,
      routineExerciseId: rex.id,
      setNumber: i,
      targetReps: rex.targetRepsMax,
      targetWeight: rex.targetWeight,
      targetDuration: rex.targetDuration,
      completed: false,
    })
  }
  session.setLogs = [...session.setLogs, ...newLogs]
  await db.sessions.put(session)
  return session
}

/** Remove a set and renumber the remaining sets of that exercise. */
export async function removeSet(
  sessionId: string,
  setLogId: string,
): Promise<WorkoutSession | undefined> {
  const session = await db.sessions.get(sessionId)
  if (!session) return
  const target = session.setLogs.find((s) => s.id === setLogId)
  if (!target) return session
  const rexId = target.routineExerciseId
  let n = 0
  session.setLogs = session.setLogs
    .filter((s) => s.id !== setLogId)
    .map((s) => (s.routineExerciseId === rexId ? { ...s, setNumber: ++n } : s))
  await db.sessions.put(session)
  return session
}

/** Set the working weight for every not-yet-completed set of an exercise. */
export async function setExerciseWeight(
  sessionId: string,
  routineExerciseId: string,
  weight: number,
): Promise<WorkoutSession | undefined> {
  const session = await db.sessions.get(sessionId)
  if (!session) return
  session.setLogs = session.setLogs.map((s) =>
    s.routineExerciseId === routineExerciseId && !s.completed
      ? { ...s, actualWeight: weight }
      : s,
  )
  await db.sessions.put(session)
  return session
}

/** Set the working hold time (seconds) for every not-yet-completed set. */
export async function setExerciseDuration(
  sessionId: string,
  routineExerciseId: string,
  seconds: number,
): Promise<WorkoutSession | undefined> {
  const session = await db.sessions.get(sessionId)
  if (!session) return
  session.setLogs = session.setLogs.map((s) =>
    s.routineExerciseId === routineExerciseId && !s.completed
      ? { ...s, actualDuration: seconds }
      : s,
  )
  await db.sessions.put(session)
  return session
}

/**
 * Finalize a session: stamp duration + volume, mark completed, run the
 * progression engine, and write suggested targets back to the routine.
 */
export async function completeSession(
  sessionId: string,
): Promise<{ session: WorkoutSession; suggestions: ProgressionSuggestion[] }> {
  const session = await db.sessions.get(sessionId)
  if (!session) throw new Error('Session not found')

  session.completedAt = Date.now()
  session.durationSeconds = Math.max(
    0,
    Math.round((session.completedAt - session.startedAt) / 1000),
  )
  session.totalVolume = sessionVolume(session)
  session.status = 'completed'
  await db.sessions.put(session)

  // Mark the scheduled day completed (override entry).
  await upsertScheduledStatus(session.date, session.routineId, 'completed')

  const routine = await db.routines.get(session.routineId)
  const settings = await db.settings.get('settings')
  let suggestions: ProgressionSuggestion[] = []
  if (routine && settings) {
    const history = await db.sessions.toArray()
    suggestions = evaluateSession(session, routine, history, settings.units)
    // attach names
    const exMap = new Map((await db.exercises.toArray()).map((e) => [e.id, e.name]))
    suggestions = suggestions.map((s) => ({
      ...s,
      exerciseName: exMap.get(s.exerciseId) ?? 'Exercise',
    }))
    // Apply suggested targets back onto the routine for next time.
    routine.exercises = routine.exercises.map((rex) => {
      const sug = suggestions.find((s) => s.routineExerciseId === rex.id)
      if (!sug) return rex
      return {
        ...rex,
        targetWeight: sug.suggestedWeight,
        targetRepsMin: sug.suggestedRepsMin,
        targetRepsMax: sug.suggestedRepsMax,
      }
    })
    await db.routines.put(routine)
  }

  return { session, suggestions }
}

// ---------- Scheduled overrides ----------
export async function upsertScheduledStatus(
  date: string,
  routineId: string | null,
  status: ScheduledWorkout['status'],
): Promise<void> {
  const existing = await db.scheduledWorkouts.where('date').equals(date).first()
  if (existing) {
    await db.scheduledWorkouts.put({ ...existing, routineId, status })
  } else {
    await db.scheduledWorkouts.put({ id: uid(), date, routineId, status })
  }
}

export async function setDayRoutine(date: string, routineId: string | null): Promise<void> {
  await upsertScheduledStatus(date, routineId, routineId ? 'planned' : 'skipped')
}

// ---------- Exercises (catalog) ----------
export async function createCustomExercise(name: string): Promise<Exercise> {
  const ex: Exercise = {
    id: `ux_${uid()}`,
    name: name.trim() || 'New Exercise',
    primaryMuscle: 'core',
    secondaryMuscles: [],
    equipment: 'other',
    category: 'isolation',
    instructions: [],
    images: [],
    userAdded: true,
  }
  await db.exercises.put(ex)
  return ex
}

export async function updateExercise(id: string, patch: Partial<Exercise>): Promise<void> {
  const cur = await db.exercises.get(id)
  if (cur) await db.exercises.put({ ...cur, ...patch })
}

// ---------- Routines ----------
export async function getRoutine(id: string): Promise<Routine | undefined> {
  return db.routines.get(id)
}
export async function getRoutines(): Promise<Routine[]> {
  return db.routines.toArray()
}
export async function saveRoutine(routine: Routine): Promise<void> {
  await db.routines.put(routine)
}
export async function deleteRoutine(id: string): Promise<void> {
  await db.routines.delete(id)
}

/** Duplicate a routine (fresh ids) so it can be tweaked independently. */
export async function duplicateRoutine(id: string): Promise<string | undefined> {
  const src = await db.routines.get(id)
  if (!src) return
  const newId = uid()
  const copy: Routine = {
    ...src,
    id: newId,
    name: `${src.name} Copy`,
    exercises: src.exercises.map((rex) => ({ ...rex, id: uid() })),
  }
  await db.routines.put(copy)
  return newId
}

/** Create a new empty routine and return it (used by the Build Workout flow). */
export async function createRoutine(name = 'New Workout'): Promise<Routine> {
  const routine: Routine = { id: uid(), name, type: 'custom', exercises: [] }
  await db.routines.put(routine)
  return routine
}

export async function saveWeeklySchedule(assignments: WeeklySchedule['assignments']): Promise<void> {
  await db.schedule.put({ id: 'weekly', assignments })
}

// ---------- Body metrics ----------
export async function addBodyMetric(date: string, weight: number): Promise<void> {
  const existing = await db.bodyMetrics.where('date').equals(date).first()
  if (existing) await db.bodyMetrics.put({ ...existing, weight })
  else await db.bodyMetrics.put({ id: uid(), date, weight })
}
export async function deleteBodyMetric(id: string): Promise<void> {
  await db.bodyMetrics.delete(id)
}

// ---------- Export / Import ----------
export interface ExportBundle {
  app: 'liftlog'
  version: 1
  exportedAt: string
  exercises: unknown[]
  routines: unknown[]
  schedule: unknown[]
  scheduledWorkouts: unknown[]
  sessions: unknown[]
  bodyMetrics: unknown[]
  settings: unknown[]
}

export async function exportData(): Promise<ExportBundle> {
  const [exercises, routines, schedule, scheduledWorkouts, sessions, bodyMetrics, settings] =
    await Promise.all([
      db.exercises.toArray(),
      db.routines.toArray(),
      db.schedule.toArray(),
      db.scheduledWorkouts.toArray(),
      db.sessions.toArray(),
      db.bodyMetrics.toArray(),
      db.settings.toArray(),
    ])
  return {
    app: 'liftlog',
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises,
    routines,
    schedule,
    scheduledWorkouts,
    sessions,
    bodyMetrics,
    settings,
  }
}

export async function importData(bundle: ExportBundle): Promise<void> {
  if (bundle.app !== 'liftlog') throw new Error('Not a LiftLog backup file.')
  await resetAll()
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
      await db.exercises.bulkPut(bundle.exercises as never)
      await db.routines.bulkPut(bundle.routines as never)
      await db.schedule.bulkPut(bundle.schedule as never)
      await db.scheduledWorkouts.bulkPut(bundle.scheduledWorkouts as never)
      await db.sessions.bulkPut(bundle.sessions as never)
      await db.bodyMetrics.bulkPut(bundle.bodyMetrics as never)
      await db.settings.bulkPut(bundle.settings as never)
    },
  )
}

export { todayISO }
