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
