import { useParams } from 'react-router-dom'
import { Check, Clock, Dumbbell, ListChecks } from 'lucide-react'
import Screen from '../components/Screen'
import ExerciseImage from '../components/ExerciseImage'
import { useExerciseMap, useSessionForDate, useSettings } from '../data/hooks'
import { formatDuration, formatLong } from '../lib/date'
import { sessionVolume, topSet } from '../lib/metrics'
import { DEFAULT_DURATION, formatDuration as formatHold, formatReps, formatWeight } from '../lib/ui'
import type { SetLog } from '../data/types'

export default function WorkoutSummary() {
  const { date = '' } = useParams()
  const settings = useSettings()
  const exMap = useExerciseMap()
  const session = useSessionForDate(date)

  if (!settings || !exMap) return <Screen back>{null}</Screen>
  const units = settings.units

  if (!session) {
    return (
      <Screen title="Summary" back>
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

  return (
    <Screen title={session.routineName} subtitle={formatLong(session.date)} back>
      {/* Headline stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <Stat icon={<Clock size={16} />} label="Time" value={formatDuration(session.durationSeconds ?? 0)} />
        <Stat icon={<Dumbbell size={16} />} label="Volume" value={`${volume.toLocaleString()} ${units}`} />
        <Stat icon={<ListChecks size={16} />} label="Sets" value={`${doneSets}/${totalSets}`} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                <div style={{ width: 44, height: 44, flexShrink: 0 }}>
                  <ExerciseImage images={ex.images} alt={ex.name} variant="thumb" />
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
                        opacity: l.completed ? 1 : 0.5,
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
                        {l.completed && <Check size={13} color="#fff" strokeWidth={3} />}
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
    </Screen>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card" style={{ flex: 1, padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--muted)', fontSize: 11 }}>
        {icon}
        {label}
      </div>
      <div style={{ fontWeight: 800, fontSize: 15, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  )
}
