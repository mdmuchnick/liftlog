import type { WorkoutSession, SetLog } from '../data/types'
import { fromISODate, todayISO } from './date'

export type Period = 'week' | 'month' | 'all'

export function sessionVolume(s: WorkoutSession): number {
  return s.setLogs.reduce((sum, sl) => {
    if (!sl.completed) return sum
    const reps = sl.actualReps ?? sl.targetReps
    const weight = sl.actualWeight ?? sl.targetWeight
    return sum + reps * weight
  }, 0)
}

function periodStart(period: Period): Date | null {
  if (period === 'all') return null
  const now = fromISODate(todayISO())
  if (period === 'week') {
    const d = new Date(now)
    d.setDate(d.getDate() - 6)
    return d
  }
  const d = new Date(now)
  d.setDate(d.getDate() - 29)
  return d
}

export function filterByPeriod(sessions: WorkoutSession[], period: Period): WorkoutSession[] {
  const start = periodStart(period)
  return sessions.filter((s) => {
    if (s.status !== 'completed') return false
    if (!start) return true
    return fromISODate(s.date) >= start
  })
}

export interface Overview {
  workouts: number
  totalVolume: number
  totalSeconds: number
  avgSeconds: number
  avgVolume: number
}

export function computeOverview(sessions: WorkoutSession[], period: Period): Overview {
  const inPeriod = filterByPeriod(sessions, period)
  const workouts = inPeriod.length
  const totalVolume = inPeriod.reduce((s, x) => s + (x.totalVolume ?? sessionVolume(x)), 0)
  const totalSeconds = inPeriod.reduce((s, x) => s + (x.durationSeconds ?? 0), 0)
  return {
    workouts,
    totalVolume,
    totalSeconds,
    avgSeconds: workouts ? Math.round(totalSeconds / workouts) : 0,
    avgVolume: workouts ? Math.round(totalVolume / workouts) : 0,
  }
}

/** Top set (heaviest completed set; ties broken by reps) for one exercise in a session. */
export function topSet(setLogs: SetLog[]): { weight: number; reps: number } | null {
  let best: { weight: number; reps: number } | null = null
  for (const sl of setLogs) {
    if (!sl.completed) continue
    const weight = sl.actualWeight ?? sl.targetWeight
    const reps = sl.actualReps ?? sl.targetReps
    if (!best || weight > best.weight || (weight === best.weight && reps > best.reps)) {
      best = { weight, reps }
    }
  }
  return best
}

export interface SeriesPoint {
  date: string
  value: number
  reps?: number
}

/** Top-set weight over time for a given exercise. */
export function exerciseSeries(sessions: WorkoutSession[], exerciseId: string): SeriesPoint[] {
  const points: SeriesPoint[] = []
  for (const s of sessions) {
    if (s.status !== 'completed') continue
    const logs = s.setLogs.filter((sl) => sl.exerciseId === exerciseId)
    const ts = topSet(logs)
    if (ts) points.push({ date: s.date, value: ts.weight, reps: ts.reps })
  }
  return points.sort((a, b) => a.date.localeCompare(b.date))
}

/** Distinct exercise ids that appear in any completed session. */
export function loggedExerciseIds(sessions: WorkoutSession[]): string[] {
  const set = new Set<string>()
  for (const s of sessions) {
    if (s.status !== 'completed') continue
    for (const sl of s.setLogs) set.add(sl.exerciseId)
  }
  return [...set]
}

export function currentStreak(sessions: WorkoutSession[]): number {
  const done = new Set(
    sessions.filter((s) => s.status === 'completed').map((s) => s.date),
  )
  let streak = 0
  const cursor = fromISODate(todayISO())
  // Allow today to be missing without breaking the streak (rest day tolerance).
  let allowSkip = !done.has(todayISO())
  for (;;) {
    const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(
      cursor.getDate(),
    ).padStart(2, '0')}`
    if (done.has(iso)) {
      streak++
      allowSkip = true
    } else if (allowSkip) {
      allowSkip = false
    } else {
      break
    }
    cursor.setDate(cursor.getDate() - 1)
    if (streak > 365) break
  }
  return streak
}
