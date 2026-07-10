import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import Screen from '../components/Screen'
import ExerciseImage from '../components/ExerciseImage'
import { useExerciseMap, useSessionForDate, useSessions, useSettings } from '../data/hooks'
import { formatDuration, formatLong } from '../lib/date'
import { currentStreak, sessionVolume, topSet } from '../lib/metrics'
import { DEFAULT_DURATION, formatDuration as formatHold, formatReps, formatWeight } from '../lib/ui'
import type { ProgressionSuggestion, SetLog } from '../data/types'

export default function WorkoutSummary() {
  const { date = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const settings = useSettings()
  const exMap = useExerciseMap()
  const session = useSessionForDate(date)
  const allSessions = useSessions()

  if (!settings || !exMap) return <Screen back>{null}</Screen>
  const units = settings.units

  if (!session) {
    return (
      <Screen back>
        <div className="card" style={{ padding: 20, color: 'var(--muted)' }}>No workout logged for this day.</div>
      </Screen>
    )
  }

  // Group set logs by exercise, preserving routine order.
  const groups: { rexId: string; exerciseId: string; logs: SetLog[] }[] = []
  for (const log of session.setLogs) {
    let g = groups.find((x) => x.rexId === log.routineExerciseId)
    if (!g) {
      g = { rexId: log.routineExerciseId, exerciseId: log.exerciseId, logs: [] }
      groups.push(g)
    }
    g.logs.push(log)
  }

  const doneSets = session.setLogs.filter((s) => s.completed).length
  const totalSets = session.setLogs.length
  const volume = Math.round(session.totalVolume ?? sessionVolume(session))
  const streak = allSessions ? currentStreak(allSessions) : 0

  // PRs: an exercise whose best completed set (weight, or hold for duration exercises)
  // this session beats every prior session's best for the same exercise.
  let prCount = 0
  if (allSessions) {
    for (const g of groups) {
      const ex = exMap.get(g.exerciseId)
      if (!ex) continue
      const isDuration = ex.tracking === 'duration'
      const completed = g.logs.filter((l) => l.completed)
      if (completed.length === 0) continue
      const currentBest = completed.reduce(
        (m, l) => Math.max(m, isDuration ? (l.actualDuration ?? l.targetDuration ?? 0) : (l.actualWeight ?? l.targetWeight)),
        0,
      )
      if (currentBest <= 0) continue
      let prevBest = 0
      for (const s of allSessions) {
        if (s.id === session.id || s.date >= session.date) continue
        for (const l of s.setLogs) {
          if (!l.completed || l.exerciseId !== g.exerciseId) continue
          const val = isDuration ? (l.actualDuration ?? l.targetDuration ?? 0) : (l.actualWeight ?? l.targetWeight)
          if (val > prevBest) prevBest = val
        }
      }
      if (currentBest > prevBest) prCount++
    }
  }

  // Optional: caller (Today.tsx, right after finishing a workout) may pass the
  // freshly computed progression suggestions via navigation state.
  const suggestions = (location.state as { suggestions?: ProgressionSuggestion[] } | null)?.suggestions ?? null

  return (
    <Screen back>
      {/* Poster header */}
      <div style={{ textAlign: 'center', padding: '10px 8px 26px' }}>
        <div
          style={{
            color: 'var(--accent)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          {formatLong(session.date)}
        </div>
        <h1 className="disp" style={{ fontSize: 48, margin: '8px 0 0', letterSpacing: '0.01em' }}>
          WORKOUT <span style={{ color: 'var(--accent)' }}>COMPLETE</span>
        </h1>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 10 }}>
          {session.routineName}
          {streak > 1 ? ` · ${streak} day streak` : ''}
        </div>
      </div>

      {/* Stat tile grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <StatTile label="Duration" value={formatDuration(session.durationSeconds ?? 0)} />
        <StatTile label="Volume" value={`${volume.toLocaleString()} ${units}`} />
        <StatTile label="Sets done" value={`${doneSets}/${totalSets}`} />
        <StatTile label="PRs" value={String(prCount)} tone="effort" />
      </div>

      {/* Progression suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 20 }}>
          <div
            style={{
              color: 'var(--muted)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            Progression for next time
          </div>
          <div>
            {suggestions.map((s, i) => {
              const up = s.suggestedWeight > s.currentWeight
              const repsChanged = s.suggestedRepsMax !== s.currentRepsMax
              const changed = up || repsChanged
              return (
                <div
                  key={s.routineExerciseId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '11px 0',
                    borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 14, minWidth: 0, flex: 1 }}>{s.exerciseName}</div>
                  {changed ? (
                    <div
                      style={{
                        color: 'var(--accent)',
                        fontWeight: 700,
                        fontSize: 13,
                        whiteSpace: 'nowrap',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formatWeight(s.currentWeight, units)} &rarr; {formatWeight(s.suggestedWeight, units)}
                      {repsChanged ? ` @${formatReps(s.suggestedRepsMin, s.suggestedRepsMax)}` : ''} &uarr;
                    </div>
                  ) : (
                    <div
                      style={{
                        color: 'var(--muted)',
                        fontSize: 13,
                        whiteSpace: 'nowrap',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      hold &middot; {formatWeight(s.currentWeight, units)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Set-by-set breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
        {groups.map((g) => {
          const ex = exMap.get(g.exerciseId)
          if (!ex) return null
          const isDuration = ex.tracking === 'duration'
          const completed = g.logs.filter((l) => l.completed)
          const top = topSet(g.logs)
          const bestHold = completed.reduce(
            (m, l) => Math.max(m, l.actualDuration ?? l.targetDuration ?? 0),
            0,
          )
          const exVolume = completed.reduce(
            (sum, l) => sum + (l.actualReps ?? l.targetReps) * (l.actualWeight ?? l.targetWeight),
            0,
          )
          return (
            <div key={g.rexId} className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 56, height: 56, flexShrink: 0, position: 'relative', borderRadius: 10, overflow: 'hidden' }}>
                  <ExerciseImage images={ex.images} alt={ex.name} variant="thumb" />
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: 3,
                      background: 'var(--accent)',
                      opacity: 0.65,
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{ex.name}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>
                    {completed.length}/{g.logs.length} sets ·{' '}
                    {isDuration
                      ? bestHold
                        ? `best ${formatHold(bestHold)}`
                        : '—'
                      : top
                        ? `top ${formatWeight(top.weight, units)} × ${top.reps}`
                        : '—'}
                  </div>
                </div>
              </div>

              {/* Set-by-set breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {g.logs.map((l) => {
                  const reps = l.actualReps ?? l.targetReps
                  const weight = l.actualWeight ?? l.targetWeight
                  const hold = l.actualDuration ?? l.targetDuration ?? DEFAULT_DURATION
                  return (
                    <div
                      key={l.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '7px 10px',
                        borderRadius: 10,
                        background: 'var(--surface-2)',
                        opacity: l.completed ? 0.55 : 1,
                        fontSize: 14,
                      }}
                    >
                      <span style={{ width: 30, color: 'var(--muted)', fontWeight: 700 }}>{l.setNumber}</span>
                      <span style={{ flex: 1, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                        {isDuration
                          ? `${formatHold(hold)} × ${reps} reps`
                          : `${formatWeight(weight, units)} × ${reps}`}
                      </span>
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 999,
                          flexShrink: 0,
                          border: `2px solid ${l.completed ? 'var(--accent)' : 'var(--border)'}`,
                          background: l.completed ? 'var(--accent)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {l.completed && <Check size={13} color="var(--on-accent)" strokeWidth={3} />}
                      </span>
                    </div>
                  )
                })}
              </div>

              {!isDuration && exVolume > 0 && (
                <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 12, textAlign: 'right' }}>
                  Volume {Math.round(exVolume).toLocaleString()} {units}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={() => navigate('/')}
          className="tap"
          style={{
            width: '100%',
            height: 50,
            borderRadius: 999,
            border: 'none',
            background: 'var(--accent)',
            color: 'var(--on-accent)',
            fontWeight: 800,
            fontSize: 14,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Done
        </button>
        <button
          onClick={() => navigate('/progress')}
          className="tap"
          style={{
            width: '100%',
            height: 44,
            borderRadius: 999,
            border: 'none',
            background: 'transparent',
            color: 'var(--muted)',
            fontWeight: 700,
            fontSize: 13,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          View Progress
        </button>
      </div>
    </Screen>
  )
}

function StatTile({ label, value, tone }: { label: string; value: string; tone?: 'accent' | 'effort' }) {
  return (
    <div className="card" style={{ padding: '14px 14px 12px' }}>
      <div
        style={{
          color: 'var(--muted)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        className="disp"
        style={{
          fontSize: 30,
          marginTop: 4,
          color: tone === 'effort' ? 'var(--effort)' : 'var(--accent)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  )
}
