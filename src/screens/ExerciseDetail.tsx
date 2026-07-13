import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Plus, RefreshCw, Timer, X } from 'lucide-react'
import Screen from '../components/Screen'
import ExerciseImage from '../components/ExerciseImage'
import Stepper from '../components/Stepper'
import RestTimer from '../components/RestTimer'
import {
  useExerciseMap,
  useScheduledWorkouts,
  useSchedule,
  useSessionForDate,
  useSessions,
  useSettings,
} from '../data/hooks'
import { db } from '../data/db'
import {
  addExerciseToSession,
  addSet,
  removeSet,
  setExerciseDuration,
  setExerciseWeight,
  startOrGetSession,
  toggleSet,
  updateExercise,
  updateSetLog,
} from '../data/repo'
import { fetchExerciseDetails } from '../data/exerciseSearch'
import type { Routine, SetLog } from '../data/types'
import { DEFAULT_DURATION, formatDuration, formatReps, formatWeight } from '../lib/ui'
import { formatShort, weekday } from '../lib/date'
import { topSet } from '../lib/metrics'

export default function ExerciseDetail() {
  const { date = '', rexId = '' } = useParams()
  const navigate = useNavigate()
  const settings = useSettings()
  const exMap = useExerciseMap()
  const session = useSessionForDate(date)
  const schedule = useSchedule()
  const overrides = useScheduledWorkouts()
  const allSessions = useSessions()
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [showTimer, setShowTimer] = useState(false)
  const [restTick, setRestTick] = useState(0)
  const [fetching, setFetching] = useState(false)
  const [fetchMsg, setFetchMsg] = useState<string | null>(null)

  // Resolve the routine for this date: a started session pins it; otherwise
  // fall back to the override / weekly schedule so detail works pre-session.
  useEffect(() => {
    let active = true
    ;(async () => {
      let routineId: string | null | undefined = session?.routineId
      if (!routineId) {
        const ov = overrides?.find((o) => o.date === date)
        routineId = ov
          ? ov.routineId
          : schedule?.assignments.find((x) => x.weekday === weekday(date))?.routineId ?? null
      }
      const r = routineId ? await db.routines.get(routineId) : null
      if (active) setRoutine(r ?? null)
    })()
    return () => {
      active = false
    }
  }, [session?.routineId, overrides, schedule, date])

  if (!settings || !exMap) return <Screen back>{null}</Screen>

  const rex = routine?.exercises.find((e) => e.id === rexId)
  const exerciseId = rex?.exerciseId ?? session?.setLogs.find((s) => s.routineExerciseId === rexId)?.exerciseId
  const ex = exerciseId ? exMap.get(exerciseId) : undefined
  const units = settings.units

  if (!ex) {
    return (
      <Screen title="Exercise" back>
        <div className="card" style={{ padding: 20, color: 'var(--muted)' }}>Exercise not found.</div>
      </Screen>
    )
  }

  const logs = (session?.setLogs ?? [])
    .filter((s) => s.routineExerciseId === rexId)
    .sort((a, b) => a.setNumber - b.setNumber)

  const ensureSessionLogs = async (): Promise<SetLog[]> => {
    if (logs.length > 0) return logs
    if (!routine) return []
    const s = await startOrGetSession(date, routine)
    let current = s.setLogs.filter((x) => x.routineExerciseId === rexId)
    // Exercise added to the routine after the session started has no set logs —
    // create them so its sets are checkable.
    if (current.length === 0 && rex) {
      const updated = await addExerciseToSession(s.id, rex)
      if (updated) current = updated.setLogs.filter((x) => x.routineExerciseId === rexId)
    }
    return current
  }

  const openRest = () => {
    setRestTick((t) => t + 1)
    setShowTimer(true)
  }

  const onToggle = async (log: SetLog) => {
    const current = await ensureSessionLogs()
    const target = current.find((l) => l.id === log.id) ?? log
    const s = session ?? (routine ? await startOrGetSession(date, routine) : undefined)
    if (s) await toggleSet(s.id, target.id)
    // Auto-start rest when a set is checked complete (not when un-checking).
    if (!log.completed && settings?.autoRest !== false) openRest()
  }

  const onChangeField = async (log: SetLog, patch: Partial<SetLog>) => {
    await ensureSessionLogs()
    if (session) await updateSetLog(session.id, log.id, patch)
  }

  const onAddSet = async () => {
    if (!routine) return
    const s = session ?? (await startOrGetSession(date, routine))
    await addSet(s.id, rexId)
  }

  const onRemoveLastSet = async () => {
    if (!session) return
    const exLogs = session.setLogs.filter((l) => l.routineExerciseId === rexId)
    const last = exLogs[exLogs.length - 1]
    if (last && exLogs.length > 1) await removeSet(session.id, last.id)
  }

  const onSetWorkingWeight = async (weight: number) => {
    if (!routine) return
    const s = session ?? (await startOrGetSession(date, routine))
    await setExerciseWeight(s.id, rexId, weight)
  }

  const onSetWorkingDuration = async (seconds: number) => {
    if (!routine) return
    const s = session ?? (await startOrGetSession(date, routine))
    await setExerciseDuration(s.id, rexId, seconds)
  }

  const onFindDetails = async () => {
    if (!ex) return
    setFetching(true)
    setFetchMsg(null)
    try {
      const d = await fetchExerciseDetails(ex.name)
      if (d) {
        await updateExercise(ex.id, {
          instructions: d.instructions,
          images: d.images,
          primaryMuscle: d.primaryMuscle,
          secondaryMuscles: d.secondaryMuscles,
          equipment: d.equipment,
          category: d.category,
        })
        setFetchMsg(`Updated from “${d.matchedName}”.`)
      } else {
        setFetchMsg('No close match found — try a more common name.')
      }
    } catch {
      setFetchMsg('Could not fetch — check your connection.')
    }
    setFetching(false)
  }

  const isDuration = ex.tracking === 'duration'

  // Working value = what's shown on the first not-yet-done set (what you'll do next).
  const nextSet = logs.find((l) => !l.completed)
  const workingWeight = nextSet?.actualWeight ?? nextSet?.targetWeight ?? rex?.targetWeight ?? 0
  const workingDuration =
    nextSet?.actualDuration ?? nextSet?.targetDuration ?? rex?.targetDuration ?? DEFAULT_DURATION

  // Recent history: last few completed sessions containing this exercise.
  const history = (allSessions ?? [])
    .filter((s) => s.status === 'completed' && s.date !== date)
    .filter((s) => s.setLogs.some((l) => l.exerciseId === ex.id))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map((s) => {
      const exLogs = s.setLogs.filter((l) => l.exerciseId === ex.id && l.completed)
      const top = topSet(s.setLogs.filter((l) => l.exerciseId === ex.id))
      const bestHold = exLogs.reduce(
        (m, l) => Math.max(m, l.actualDuration ?? l.targetDuration ?? 0),
        0,
      )
      return { date: s.date, top, bestHold }
    })

  return (
    <>
      <Screen
        title={ex.name}
        back
        right={
          rex ? (
            <button
              onClick={openRest}
              className="tap"
              aria-label="rest timer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                height: 38,
                padding: '0 12px',
                borderRadius: 999,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--accent)',
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              <Timer size={16} />
              Rest
            </button>
          ) : null
        }
      >
        {/* Demo photos: start + finish */}
        <div style={{ height: 200, marginBottom: 14 }}>
          <ExerciseImage images={ex.images} alt={ex.name} variant="detail" />
        </div>

        {/* User-added exercise: fetch instructions + images on demand */}
        {ex.userAdded && (
          <div style={{ marginBottom: 14 }}>
            <button
              onClick={onFindDetails}
              className="tap"
              disabled={fetching}
              style={{
                width: '100%',
                height: 46,
                borderRadius: 12,
                border: '1px solid var(--accent)',
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <RefreshCw size={16} style={fetching ? { animation: 'spin 1s linear infinite' } : undefined} />
              {fetching
                ? 'Searching…'
                : ex.images.length
                  ? 'Refresh instructions & images'
                  : 'Find instructions & images'}
            </button>
            {fetchMsg && (
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
                {fetchMsg}
              </div>
            )}
          </div>
        )}

        {/* Meta chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
          <Chip>{ex.primaryMuscle}</Chip>
          {ex.secondaryMuscles.map((m) => (
            <Chip key={m} dim>
              {m}
            </Chip>
          ))}
          <Chip dim>{ex.equipment}</Chip>
          <Chip dim>{ex.category}</Chip>
        </div>

        {/* Set logging */}
        {rex && (
          <section style={{ marginBottom: 22 }}>
            <SectionTitle>
              Sets · target {rex.targetSets} × {formatReps(rex.targetRepsMin, rex.targetRepsMax)} ·{' '}
              {isDuration
                ? `${formatDuration(rex.targetDuration ?? DEFAULT_DURATION)} hold`
                : formatWeight(rex.targetWeight, units)}
            </SectionTitle>

            {/* Working-weight quick set: applies to every set you haven't logged yet */}
            <div
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                marginBottom: 10,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {isDuration ? 'Working time' : 'Working weight'}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>Sets all unlogged sets</div>
              </div>
              {isDuration ? (
                <Stepper
                  value={workingDuration}
                  onChange={onSetWorkingDuration}
                  step={5}
                  min={5}
                  max={600}
                  suffix="sec"
                  width={150}
                />
              ) : (
                <Stepper
                  value={workingWeight}
                  onChange={onSetWorkingWeight}
                  step={units === 'lbs' ? 1 : 0.5}
                  suffix={units}
                  width={150}
                />
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, padding: '0 4px', color: 'var(--muted)', fontSize: 11, fontWeight: 600 }}>
                <span style={{ width: 28 }}>SET</span>
                <span style={{ flex: 1, textAlign: 'center' }}>{isDuration ? 'TIME (sec)' : `WEIGHT (${units})`}</span>
                <span style={{ flex: 1, textAlign: 'center' }}>REPS</span>
                <span style={{ width: 44, textAlign: 'center' }}>✓</span>
              </div>
              {logs.map((log) => (
                <SetRow
                  key={log.id}
                  log={log}
                  units={units}
                  isDuration={isDuration}
                  onToggle={() => onToggle(log)}
                  onWeight={(v) => onChangeField(log, { actualWeight: v })}
                  onDuration={(v) => onChangeField(log, { actualDuration: v })}
                  onReps={(v) => onChangeField(log, { actualReps: v })}
                />
              ))}

              {logs.length === 0 ? (
                <button
                  onClick={() => ensureSessionLogs()}
                  className="tap"
                  style={{
                    height: 48,
                    borderRadius: 12,
                    border: '1px dashed var(--border)',
                    background: 'transparent',
                    color: 'var(--accent)',
                    fontWeight: 700,
                  }}
                >
                  Tap to start logging sets
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={onAddSet} className="tap" style={setBtn}>
                    <Plus size={18} /> Add set
                  </button>
                  <button
                    onClick={onRemoveLastSet}
                    className="tap"
                    disabled={logs.length <= 1}
                    style={{ ...setBtn, opacity: logs.length <= 1 ? 0.4 : 1 }}
                  >
                    <X size={18} /> Remove set
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Instructions */}
        <section style={{ marginBottom: 22 }}>
          <SectionTitle>How to perform</SectionTitle>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ex.instructions.map((step, i) => (
              <li key={i} style={{ display: 'flex', gap: 12 }}>
                <span
                  style={{
                    flexShrink: 0,
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    background: 'var(--accent-soft)',
                    color: 'var(--accent)',
                    fontSize: 13,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ fontSize: 14, lineHeight: 1.5, paddingTop: 2 }}>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* History */}
        <section>
          <SectionTitle>Recent history</SectionTitle>
          {history.length === 0 ? (
            <div className="card" style={{ padding: 16, color: 'var(--muted)', fontSize: 14 }}>
              No previous sessions logged for this exercise yet.
            </div>
          ) : (
            <div className="card" style={{ padding: 4 }}>
              {history.map((h, i) => (
                <div
                  key={h.date}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                    fontSize: 14,
                  }}
                >
                  <span style={{ color: 'var(--muted)' }}>{formatShort(h.date)}</span>
                  <span style={{ fontWeight: 700 }}>
                    {isDuration
                      ? h.bestHold
                        ? `${formatDuration(h.bestHold)} hold`
                        : '—'
                      : h.top
                        ? `${formatWeight(h.top.weight, units)} × ${h.top.reps}`
                        : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Clear exit back to the workout list */}
        <button
          onClick={() => navigate(-1)}
          className="tap"
          style={{
            width: '100%',
            height: 50,
            marginTop: 24,
            borderRadius: 14,
            border: 'none',
            background: 'var(--accent)',
            color: 'var(--on-accent)',
            fontWeight: 800,
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <ArrowLeft size={18} /> Done — back to workout
        </button>
      </Screen>

      {showTimer && rex && (
        <RestTimer
          key={restTick}
          defaultSeconds={rex.restSeconds || settings.defaultRestSeconds}
          onClose={() => setShowTimer(false)}
        />
      )}
    </>
  )
}

function SetRow({
  log,
  units,
  isDuration,
  onToggle,
  onWeight,
  onDuration,
  onReps,
}: {
  log: SetLog
  units: 'lbs' | 'kg'
  isDuration: boolean
  onToggle: () => void
  onWeight: (v: number) => void
  onDuration: (v: number) => void
  onReps: (v: number) => void
}) {
  const weight = log.actualWeight ?? log.targetWeight
  const duration = log.actualDuration ?? log.targetDuration ?? DEFAULT_DURATION
  const reps = log.actualReps ?? log.targetReps
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: 8,
        background: log.completed ? 'var(--accent-soft)' : 'var(--surface)',
        borderColor: log.completed ? 'var(--accent)' : 'var(--border)',
      }}
    >
      <span style={{ width: 28, textAlign: 'center', fontWeight: 800, color: 'var(--muted)' }}>
        {log.setNumber}
      </span>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        {isDuration ? (
          <Stepper value={duration} onChange={onDuration} step={5} min={5} max={600} width={118} />
        ) : (
          <Stepper value={weight} onChange={onWeight} step={units === 'lbs' ? 1 : 0.5} width={118} />
        )}
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <Stepper value={reps} onChange={onReps} step={1} width={104} min={0} />
      </div>
      <button
        onClick={onToggle}
        className="tap"
        aria-label={log.completed ? 'mark set incomplete' : 'mark set complete'}
        style={{
          width: 40,
          height: 40,
          minWidth: 40,
          borderRadius: 999,
          border: `2px solid ${log.completed ? 'var(--accent)' : 'var(--border)'}`,
          background: log.completed ? 'var(--accent)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {log.completed && <Check size={20} color="var(--on-accent)" strokeWidth={3} />}
      </button>
    </div>
  )
}

function Chip({ children, dim }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <span
      style={{
        textTransform: 'capitalize',
        fontSize: 12,
        fontWeight: 700,
        padding: '5px 11px',
        borderRadius: 999,
        background: dim ? 'var(--surface-2)' : 'var(--accent-soft)',
        color: dim ? 'var(--muted)' : 'var(--accent)',
      }}
    >
      {children}
    </span>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
      {children}
    </h3>
  )
}

const setBtn: React.CSSProperties = {
  flex: 1,
  height: 44,
  borderRadius: 12,
  border: '1px dashed var(--border)',
  background: 'transparent',
  color: 'var(--accent)',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
}
