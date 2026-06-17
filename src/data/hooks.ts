import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'

export function useSettings() {
  return useLiveQuery(() => db.settings.get('settings'), [])
}

export function useRoutines() {
  return useLiveQuery(() => db.routines.toArray(), [])
}

export function useRoutine(id: string | null | undefined) {
  return useLiveQuery(() => (id ? db.routines.get(id) : undefined), [id])
}

export function useExercises() {
  return useLiveQuery(() => db.exercises.toArray(), [])
}

export function useExerciseMap() {
  return useLiveQuery(async () => {
    const all = await db.exercises.toArray()
    return new Map(all.map((e) => [e.id, e]))
  }, [])
}

export function useSessions() {
  return useLiveQuery(() => db.sessions.toArray(), [])
}

export function useSessionForDate(date: string) {
  return useLiveQuery(() => db.sessions.where('date').equals(date).first(), [date])
}

export function useSchedule() {
  return useLiveQuery(() => db.schedule.get('weekly'), [])
}

export function useScheduledWorkouts() {
  return useLiveQuery(() => db.scheduledWorkouts.toArray(), [])
}

export function useBodyMetrics() {
  return useLiveQuery(
    () => db.bodyMetrics.orderBy('date').toArray(),
    [],
  )
}
