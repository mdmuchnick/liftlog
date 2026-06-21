import type { RoutineType } from '../data/types'

// Calendar/type dot colors per PRD §5 legend. Fixed hues (not theme-driven) so
// the legend reads consistently across themes.
export const TYPE_COLORS: Record<RoutineType, string> = {
  push: '#8b5cf6',
  pull: '#3b82f6',
  upper: '#06b6d4',
  lower: '#f59e0b',
  legs: '#f97316',
  custom: '#64748b',
  rest: '#475569',
}

export const TYPE_LABEL: Record<RoutineType, string> = {
  push: 'Push',
  pull: 'Pull',
  upper: 'Upper',
  lower: 'Lower',
  legs: 'Legs',
  custom: 'Custom',
  rest: 'Rest',
}

export function formatWeight(weight: number, units: 'lbs' | 'kg'): string {
  if (weight === 0) return 'BW'
  return `${weight} ${units}`
}

export function formatReps(min: number, max: number): string {
  return min === max ? `${min}` : `${min}–${max}`
}

/** Default hold time (seconds) for a duration-tracked exercise with no target set. */
export const DEFAULT_DURATION = 30

/** Format seconds as a compact hold time, e.g. 45 → "45s", 90 → "1:30". */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
