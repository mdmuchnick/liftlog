// Core domain types — mirrors PRD §8 data model.

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'calves'

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'band'
  | 'bodyweight'
  | 'other'

export type ExerciseCategory = 'compound' | 'isolation'

export type ProgressionType = 'linear' | 'double' | 'manual'

export type RoutineType = 'push' | 'pull' | 'upper' | 'lower' | 'legs' | 'rest' | 'custom'

export type WorkoutStatus = 'planned' | 'in_progress' | 'completed' | 'skipped'

export interface Exercise {
  id: string
  name: string
  primaryMuscle: MuscleGroup
  secondaryMuscles: MuscleGroup[]
  equipment: Equipment
  category: ExerciseCategory
  instructions: string[]
  /** Bundled demo images (start/end frames), public-domain free-exercise-db. */
  images: string[]
  userAdded?: boolean
}

export interface ProgressionRule {
  type: ProgressionType
  incrementWeight: number
  repRangeMin?: number
  repRangeMax?: number
  deloadPercent: number
  failureThreshold: number
}

export interface RoutineExercise {
  id: string
  exerciseId: string
  order: number
  targetSets: number
  targetRepsMin: number
  targetRepsMax: number
  targetWeight: number
  restSeconds: number
  progression: ProgressionRule
  notes?: string
}

export interface Routine {
  id: string
  name: string
  type: RoutineType
  exercises: RoutineExercise[]
}

export interface WeeklySchedule {
  id: string // singleton 'weekly'
  // weekday 0 = Sunday ... 6 = Saturday; null = rest day
  assignments: { weekday: number; routineId: string | null }[]
}

export interface ScheduledWorkout {
  id: string
  date: string // ISO yyyy-mm-dd
  routineId: string | null
  status: WorkoutStatus
}

export interface SetLog {
  id: string
  sessionId: string
  exerciseId: string
  routineExerciseId: string
  setNumber: number
  targetReps: number
  targetWeight: number
  actualReps?: number
  actualWeight?: number
  completed: boolean
  rpe?: number
}

export interface WorkoutSession {
  id: string
  date: string // ISO yyyy-mm-dd
  routineId: string
  routineName: string
  routineType: RoutineType
  startedAt: number
  completedAt?: number
  durationSeconds?: number
  totalVolume?: number
  status: WorkoutStatus
  notes?: string
  setLogs: SetLog[]
}

export interface BodyMetric {
  id: string
  date: string // ISO yyyy-mm-dd
  weight: number
}

export interface Settings {
  id: string // singleton 'settings'
  units: 'lbs' | 'kg'
  theme: 'dark' | 'light' | 'minimal'
  defaultRestSeconds: number
  weekStart: 'monday' | 'sunday'
  userName?: string
}

export interface ProgressionSuggestion {
  exerciseId: string
  routineExerciseId: string
  exerciseName: string
  currentWeight: number
  suggestedWeight: number
  currentRepsMin: number
  currentRepsMax: number
  suggestedRepsMin: number
  suggestedRepsMax: number
  reason: string
}
