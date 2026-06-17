import type {
  ProgressionSuggestion,
  Routine,
  RoutineExercise,
  SetLog,
  WorkoutSession,
} from '../data/types'

/** Round to the nearest sensible plate increment for the unit. */
function roundWeight(w: number, units: 'lbs' | 'kg'): number {
  const step = units === 'lbs' ? 5 : 2.5
  return Math.round(w / step) * step
}

interface ExerciseResult {
  hitAllSets: boolean // completed every prescribed set
  hitTopOfRange: boolean // every completed set reached repsMax
  belowMin: boolean // any completed set fell below repsMin
}

function evaluate(setLogs: SetLog[], rex: RoutineExercise): ExerciseResult {
  const logs = setLogs.filter((s) => s.routineExerciseId === rex.id)
  const completed = logs.filter((s) => s.completed)
  const hitAllSets = completed.length >= rex.targetSets
  let hitTopOfRange = completed.length > 0
  let belowMin = false
  for (const s of completed) {
    const reps = s.actualReps ?? s.targetReps
    if (reps < rex.targetRepsMax) hitTopOfRange = false
    if (reps < rex.targetRepsMin) belowMin = true
  }
  return { hitAllSets, hitTopOfRange, belowMin }
}

/**
 * Count consecutive most-recent prior sessions of this routine in which the
 * exercise fell below the minimum reps (used to trigger a deload).
 */
function consecutiveFailures(
  history: WorkoutSession[],
  routineId: string,
  rex: RoutineExercise,
): number {
  const prior = history
    .filter((s) => s.routineId === routineId && s.status === 'completed')
    .sort((a, b) => b.date.localeCompare(a.date))
  let count = 0
  for (const sess of prior) {
    const r = evaluate(sess.setLogs, rex)
    if (r.belowMin) count++
    else break
  }
  return count
}

/**
 * Evaluate one completed session and produce a per-exercise suggestion for the
 * NEXT occurrence. `history` should include the just-completed session.
 */
export function evaluateSession(
  session: WorkoutSession,
  routine: Routine,
  history: WorkoutSession[],
  units: 'lbs' | 'kg',
): ProgressionSuggestion[] {
  const out: ProgressionSuggestion[] = []

  for (const rex of routine.exercises) {
    const rule = rex.progression
    const res = evaluate(session.setLogs, rex)
    const current = rex.targetWeight

    let suggestedWeight = current
    let suggestedMin = rex.targetRepsMin
    let suggestedMax = rex.targetRepsMax
    let reason = 'Hold — keep the same target.'

    // Skip exercises that weren't worked at all this session.
    const worked = session.setLogs.some(
      (s) => s.routineExerciseId === rex.id && s.completed,
    )
    if (!worked) continue

    if (rule.type === 'manual') {
      reason = 'Manual progression — set your own target.'
    } else if (rule.type === 'linear') {
      const fails = consecutiveFailures(history, routine.id, rex)
      if (res.belowMin && fails >= rule.failureThreshold) {
        suggestedWeight = roundWeight(current * (1 - rule.deloadPercent / 100), units)
        reason = `Deload ${rule.deloadPercent}% after ${fails} short sessions.`
      } else if (res.hitAllSets && !res.belowMin) {
        suggestedWeight = roundWeight(current + rule.incrementWeight, units)
        reason = `Hit all sets → +${rule.incrementWeight} ${units}.`
      } else {
        reason = 'Repeat — short of all reps, no change.'
      }
    } else if (rule.type === 'double') {
      if (res.hitAllSets && res.hitTopOfRange) {
        suggestedWeight = roundWeight(current + rule.incrementWeight, units)
        suggestedMin = rule.repRangeMin ?? rex.targetRepsMin
        suggestedMax = rule.repRangeMax ?? rex.targetRepsMax
        reason = `Topped the rep range → +${rule.incrementWeight} ${units}, reset reps.`
      } else if (res.hitAllSets) {
        reason = 'Same weight — push for more reps next time.'
      } else {
        reason = 'Repeat — finish all sets next time.'
      }
    }

    out.push({
      exerciseId: rex.exerciseId,
      routineExerciseId: rex.id,
      exerciseName: '', // filled by caller (needs exercise catalog)
      currentWeight: current,
      suggestedWeight,
      currentRepsMin: rex.targetRepsMin,
      currentRepsMax: rex.targetRepsMax,
      suggestedRepsMin: suggestedMin,
      suggestedRepsMax: suggestedMax,
      reason,
    })
  }

  return out
}
