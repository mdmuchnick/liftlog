import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Dumbbell, Moon } from 'lucide-react'
import Screen from '../components/Screen'
import ProgressRing from '../components/ProgressRing'
import ExerciseCard from '../components/ExerciseCard'
import Segmented from '../components/Segmented'
import ProgressionSummary from '../components/ProgressionSummary'
import RestTimer from '../components/RestTimer'
import {
  useExerciseMap,
  useRoutines,
  useSchedule,
  useScheduledWorkouts,
  useSessionForDate,
  useSettings,
  useSessions,
} from '../data/hooks'
import {
  completeSession,
  createRoutine,
  setDayRoutine,
  startOrGetSession,
  toggleSet,
} from '../data/repo'
import { formatDuration, formatLong, todayISO, weekday } from '../lib/date'
import { sessionVolume } from '../lib/metrics'
import type { ProgressionSuggestion, Routine, WorkoutSession } from '../data/types'
import { TYPE_COLORS } from '../lib/ui'

export default function Today() {
  const navigate = useNavigate()
  const today = todayISO()
  const settings = useSettings()
  const routines = useRoutines()
  const schedule = useSchedule()
  const overrides = useScheduledWorkouts()
  const exMap = useExerciseMap()
  const session = useSessionForDate(today)
  const allSessions = useSessions()

  const [tab, setTab] = useState<'today' | 'history'>('today')
  const [elapsed, setElapsed] = useState(0)
  const [suggestions, setSuggestions] = useState<ProgressionSuggestion[] | null>(null)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [restSecs, setRestSecs] = useState<number | null>(null)

  // Resolve today's routine: explicit override wins over the weekly schedule.
  const routineId = useMemo(() => {
    const ov = overrides?.find((o) => o.date === today)
    if (ov) return ov.routineId
    const a = schedule?.assignments.find((x) => x.weekday === weekday(today))
    return a?.routineId ?? null
  }, [overrides, schedule, today])

  const routine = routines?.find((r) => r.id === routineId) ?? null
  const isCompleted = session?.status === 'completed'

  // Live session timer
  useEffect(() => {
    if (!session?.startedAt || session.status === 'completed') {
      setElapsed(session?.durationSeconds ?? 0)
      return
    }
    const tick = () => setElapsed(Math.round((Date.now() - session.startedAt) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [session?.startedAt, session?.status, session?.durationSeconds])

  if (!settings || !routines || !schedule || !exMap) {
    return <Screen title="Today">{null}</Screen>
  }

  const units = settings.units

  // ---------- helpers ----------
  const ensureSession = async (r: Routine): Promise<WorkoutSession> =>
    startOrGetSession(today, r)

  const completedSetsFor = (routineExerciseId: string) =>
    session?.setLogs.filter((s) => s.routineExerciseId === routineExerciseId && s.completed).length ?? 0

  const toggleAllForExercise = async (routineExerciseId: string, targetSets: number) => {
    if (!routine) return
    const s = await ensureSession(routine)
    const logs = s.setLogs.filter((l) => l.routineExerciseId === routineExerciseId)
    const wasAllDone = logs.every((l) => l.completed) && logs.length >= targetSets
    let cur: WorkoutSession | undefined = s
    for (const l of logs) {
      if (wasAllDone === l.completed) {
        cur = await toggleSet(s.id, l.id)
      }
    }
    void cur
    // Auto-start the rest timer when an exercise is just checked complete.
    if (!wasAllDone && settings?.autoRest !== false) {
      const rex = routine.exercises.find((e) => e.id === routineExerciseId)
      setRestSecs(rex?.restSeconds || settings?.defaultRestSeconds || 90)
    }
  }

  // Once a session exists its set logs are the source of truth (they reflect any
  // sets added/removed mid-workout); otherwise fall back to the routine targets.
  const totalSets = session
    ? session.setLogs.length
    : (routine?.exercises.reduce((n, r) => n + r.targetSets, 0) ?? 0)
  const doneSets = session?.setLogs.filter((s) => s.completed).length ?? 0
  const allDone = totalSets > 0 && doneSets >= totalSets

  const setCountFor = (routineExerciseId: string, fallback: number) =>
    session
      ? session.setLogs.filter((s) => s.routineExerciseId === routineExerciseId).length
      : fallback

  const onComplete = async () => {
    if (!session) return
    setRestSecs(null)
    const { suggestions: sug } = await completeSession(session.id)
    setSuggestions(sug)
    setSummaryOpen(true)
  }

  // ---------- HISTORY ----------
  if (tab === 'history') {
    const completed = (allSessions ?? [])
      .filter((s) => s.status === 'completed')
      .sort((a, b) => b.date.localeCompare(a.date))
    return (
      <Screen
        title="Workouts"
        subtitle={formatLong(today)}
        right={<ProgressRing value={doneSets} total={totalSets || 1} size={48} />}
      >
        <div style={{ marginBottom: 16 }}>
          <Segmented
            options={[
              { value: 'today', label: 'Today' },
              { value: 'history', label: 'History' },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>
        {completed.length === 0 ? (
          <EmptyHint icon={<Dumbbell size={28} />} text="No completed workouts yet. Finish a session to see it here." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {completed.map((s) => (
              <div key={s.id} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: TYPE_COLORS[s.routineType] ?? 'var(--accent)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{s.routineName}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>{formatLong(s.date)}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 13 }}>
                  <div style={{ fontWeight: 700 }}>
                    {Math.round(s.totalVolume ?? sessionVolume(s)).toLocaleString()} {units}
                  </div>
                  <div style={{ color: 'var(--muted)' }}>{formatDuration(s.durationSeconds ?? 0)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Screen>
    )
  }

  // ---------- REST / EMPTY STATE ----------
  if (!routine) {
    const trainingRoutines = routines.filter((r) => r.type !== 'rest')
    return (
      <Screen title="Today" subtitle={formatLong(today)}>
        <div style={{ marginBottom: 16 }}>
          <Segmented
            options={[
              { value: 'today', label: 'Today' },
              { value: 'history', label: 'History' },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>
        <div className="card" style={{ padding: 28, textAlign: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              background: 'var(--surface-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}
          >
            <Moon size={30} color="var(--accent)" />
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: 20 }}>Rest day</h2>
          <p style={{ color: 'var(--muted)', margin: '0 0 18px', fontSize: 14 }}>
            Nothing scheduled today. Start a workout ad-hoc if you're feeling it.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {trainingRoutines.map((r) => (
              <button
                key={r.id}
                className="tap"
                onClick={async () => {
                  await setDayRoutine(today, r.id)
                }}
                style={adhocBtn}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: TYPE_COLORS[r.type],
                  }}
                />
                Start {r.name}
              </button>
            ))}
            <button
              className="tap"
              onClick={async () => {
                const r = await createRoutine()
                navigate(`/routine/${r.id}`)
              }}
              style={{ ...adhocBtn, color: 'var(--accent)', borderStyle: 'dashed' }}
            >
              + Build a new workout
            </button>
          </div>
        </div>
      </Screen>
    )
  }

  // ---------- ACTIVE WORKOUT ----------
  const sorted = [...routine.exercises].sort((a, b) => a.order - b.order)

  return (
    <>
      <Screen
        title={routine.name}
        subtitle={formatLong(today)}
        right={
          <ProgressRing value={doneSets} total={totalSets} size={52} label={`${doneSets}/${totalSets}`} />
        }
      >
        <div style={{ marginBottom: 14 }}>
          <Segmented
            options={[
              { value: 'today', label: 'Today' },
              { value: 'history', label: 'History' },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>

        {/* status row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <Stat icon={<Clock size={16} />} label="Time" value={formatDuration(elapsed)} />
          <Stat
            icon={<Dumbbell size={16} />}
            label="Volume"
            value={`${Math.round(session ? sessionVolume(session) : 0).toLocaleString()} ${units}`}
          />
          <Stat label="Done" value={`${doneSets}/${totalSets}`} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sorted.map((rex) => {
            const ex = exMap.get(rex.exerciseId)
            if (!ex) return null
            const exSets = setCountFor(rex.id, rex.targetSets)
            return (
              <ExerciseCard
                key={rex.id}
                exercise={ex}
                sets={exSets}
                repsMin={rex.targetRepsMin}
                repsMax={rex.targetRepsMax}
                weight={rex.targetWeight}
                units={units}
                completedSets={completedSetsFor(rex.id)}
                onToggleAll={() => toggleAllForExercise(rex.id, exSets)}
                onOpen={() => navigate(`/exercise/${today}/${rex.id}`)}
              />
            )
          })}
        </div>

        {/* Sticky finish bar — stays above the tab bar, scrolls with content */}
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            marginTop: 16,
            paddingTop: 10,
            paddingBottom: 6,
            background: 'linear-gradient(to top, var(--bg) 72%, transparent)',
          }}
        >
          {!isCompleted ? (
            <button
              onClick={onComplete}
              className="tap"
              disabled={doneSets === 0}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 14,
                border: 'none',
                background: doneSets === 0 ? 'var(--surface-2)' : 'var(--accent)',
                color: doneSets === 0 ? 'var(--muted)' : '#fff',
                fontWeight: 800,
                fontSize: 16,
                boxShadow: allDone ? '0 6px 20px var(--accent-soft)' : 'none',
              }}
            >
              {allDone ? 'Finish Workout 💪' : `Complete Workout (${doneSets}/${totalSets})`}
            </button>
          ) : (
            <div
              className="card"
              style={{ padding: 14, borderColor: 'var(--success)', display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--success)', fontWeight: 800 }}>✓ Workout complete</div>
                <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>
                  {formatDuration(session?.durationSeconds ?? 0)} ·{' '}
                  {Math.round(session?.totalVolume ?? 0).toLocaleString()} {units}
                </div>
              </div>
              <button
                onClick={() => setSummaryOpen(true)}
                className="tap"
                style={{
                  height: 40,
                  padding: '0 16px',
                  borderRadius: 999,
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Summary
              </button>
            </div>
          )}
        </div>
      </Screen>

      {summaryOpen && suggestions && (
        <ProgressionSummary
          suggestions={suggestions}
          units={units}
          onClose={() => setSummaryOpen(false)}
        />
      )}

      {restSecs != null && (
        <RestTimer defaultSeconds={restSecs} onClose={() => setRestSecs(null)} />
      )}
    </>
  )
}

function Stat({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
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

function EmptyHint({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="card" style={{ padding: 28, textAlign: 'center', color: 'var(--muted)' }}>
      <div style={{ marginBottom: 10, color: 'var(--accent)' }}>{icon}</div>
      <p style={{ margin: 0, fontSize: 14 }}>{text}</p>
    </div>
  )
}

const adhocBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  height: 48,
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: 'var(--surface-2)',
  color: 'var(--text)',
  fontWeight: 700,
  fontSize: 15,
}
