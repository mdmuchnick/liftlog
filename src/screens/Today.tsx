import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Clock, Dumbbell, Flame, Moon, Plus } from 'lucide-react'
import Screen from '../components/Screen'
import ProgressRing from '../components/ProgressRing'
import ExerciseCard from '../components/ExerciseCard'
import ExerciseImage from '../components/ExerciseImage'
import ExercisePicker, { buildRoutineExercise } from '../components/ExercisePicker'
import Segmented from '../components/Segmented'
import ProgressionSummary from '../components/ProgressionSummary'
import RestTimer from '../components/RestTimer'
import WeekStrip from '../components/WeekStrip'
import TodayHero from '../components/TodayHero'
import {
  useExerciseMap,
  useExercises,
  useRoutines,
  useSchedule,
  useScheduledWorkouts,
  useSessionForDate,
  useSettings,
  useSessions,
} from '../data/hooks'
import {
  addExerciseToSession,
  completeSession,
  createCustomExercise,
  createRoutine,
  saveRoutine,
  setDayRoutine,
  startOrGetSession,
  toggleSet,
  updateExercise,
} from '../data/repo'
import { fetchExerciseDetails } from '../data/exerciseSearch'
import { formatDuration, formatLong, todayISO, weekday } from '../lib/date'
import { currentStreak, exerciseSeries, sessionVolume } from '../lib/metrics'
import type { Equipment, Exercise, ProgressionSuggestion, Routine, WorkoutSession } from '../data/types'
import { DEFAULT_DURATION, formatReps, formatWeight, TYPE_COLORS } from '../lib/ui'

const EQUIP_LABEL: Record<Equipment, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  machine: 'Machine',
  cable: 'Cable',
  band: 'Band',
  bodyweight: 'Bodyweight',
  other: 'Other',
}

// Approx active work time per weight-tracked set (seconds), used only to size
// the pre-workout time estimates. Duration-tracked sets use their hold time.
const WORK_PER_SET = 40

function estMinutes(seconds: number): string {
  return `${Math.max(1, Math.round(seconds / 60))} min`
}

export default function Today() {
  const navigate = useNavigate()
  const today = todayISO()
  const settings = useSettings()
  const routines = useRoutines()
  const schedule = useSchedule()
  const overrides = useScheduledWorkouts()
  const exMap = useExerciseMap()
  const exercises = useExercises()
  const session = useSessionForDate(today)
  const allSessions = useSessions()

  const [tab, setTab] = useState<'today' | 'history'>('today')
  const [elapsed, setElapsed] = useState(0)
  const [suggestions, setSuggestions] = useState<ProgressionSuggestion[] | null>(null)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [restSecs, setRestSecs] = useState<number | null>(null)
  const [picking, setPicking] = useState(false)

  // Resolve today's routine: explicit override wins over the weekly schedule.
  const routineId = useMemo(() => {
    const ov = overrides?.find((o) => o.date === today)
    if (ov) return ov.routineId
    const a = schedule?.assignments.find((x) => x.weekday === weekday(today))
    return a?.routineId ?? null
  }, [overrides, schedule, today])

  const routine = routines?.find((r) => r.id === routineId) ?? null
  const isCompleted = session?.status === 'completed'

  // Days with a completed session (for the week strip) + the current streak.
  const completedDates = useMemo(
    () => new Set((allSessions ?? []).filter((s) => s.status === 'completed').map((s) => s.date)),
    [allSessions],
  )
  const streak = useMemo(() => currentStreak(allSessions ?? []), [allSessions])

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
    let s = await ensureSession(routine)
    let logs = s.setLogs.filter((l) => l.routineExerciseId === routineExerciseId)
    // Exercise added to the routine mid-session has no set logs yet — create them
    // before toggling so its sets are actually checkable.
    if (logs.length === 0) {
      const rex = routine.exercises.find((e) => e.id === routineExerciseId)
      if (rex) {
        const updated = await addExerciseToSession(s.id, rex)
        if (updated) {
          s = updated
          logs = s.setLogs.filter((l) => l.routineExerciseId === routineExerciseId)
        }
      }
    }
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

  const setCountFor = (routineExerciseId: string, fallback: number) => {
    if (!session) return fallback
    const n = session.setLogs.filter((s) => s.routineExerciseId === routineExerciseId).length
    // An exercise added mid-session may have no logs yet — show its target count
    // so the card renders its sets (logs are created on first toggle).
    return n > 0 ? n : fallback
  }

  // Add an exercise to the live routine + session mid-workout so its sets are
  // immediately checkable (mirrors RoutineEditor.addExercise defaults).
  const addExerciseToActive = async (ex: Exercise) => {
    if (!routine || !session || !settings) return
    const newRex = buildRoutineExercise(ex, settings, routine.exercises.length)
    await saveRoutine({ ...routine, exercises: [...routine.exercises, newRex] })
    await addExerciseToSession(session.id, newRex)
    setPicking(false)
  }

  // Free-typed exercise: create it, add to routine + session, then enrich in the
  // background (mirrors RoutineEditor.addCustomExercise).
  const addCustomToActive = async (name: string) => {
    if (!routine || !session || !settings) return
    const ex = await createCustomExercise(name)
    const newRex = buildRoutineExercise(ex, settings, routine.exercises.length)
    await saveRoutine({ ...routine, exercises: [...routine.exercises, newRex] })
    await addExerciseToSession(session.id, newRex)
    setPicking(false)
    fetchExerciseDetails(name)
      .then((d) => {
        if (d) {
          updateExercise(ex.id, {
            instructions: d.instructions,
            images: d.images,
            primaryMuscle: d.primaryMuscle,
            secondaryMuscles: d.secondaryMuscles,
            equipment: d.equipment,
            category: d.category,
          })
        }
      })
      .catch(() => {
        /* offline or no match — exercise still usable, can refresh later */
      })
  }

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
              <button
                key={s.id}
                className="tap card"
                onClick={() => navigate(`/summary/${s.date}`)}
                style={{
                  padding: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  textAlign: 'left',
                  color: 'var(--text)',
                  cursor: 'pointer',
                }}
              >
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
                <ChevronRight size={18} color="var(--muted)" style={{ flexShrink: 0 }} />
              </button>
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

  const sorted = [...routine.exercises].sort((a, b) => a.order - b.order)

  // ---------- PRE-WORKOUT (no session started yet) ----------
  if (!session) {
    const equip = Array.from(
      new Set(
        sorted
          .map((r) => exMap.get(r.exerciseId)?.equipment)
          .filter((e): e is Equipment => Boolean(e)),
      ),
    )
    const chips = [
      ...equip.map((e) => EQUIP_LABEL[e]),
      `${sorted.length} exercise${sorted.length === 1 ? '' : 's'}`,
      `${totalSets} sets`,
    ]

    let activeSec = 0
    let totalSec = 0
    for (const rex of sorted) {
      const ex = exMap.get(rex.exerciseId)
      const work =
        ex?.tracking === 'duration' ? (rex.targetDuration ?? DEFAULT_DURATION) : WORK_PER_SET
      activeSec += rex.targetSets * work
      totalSec += rex.targetSets * (work + rex.restSeconds)
    }

    return (
      <Screen>
        {/* wordmark + streak */}
        <div
          className="pt-safe"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <span className="disp" style={{ fontSize: 26, color: 'var(--text)' }}>
            LiftLog
          </span>
          {streak > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                borderRadius: 999,
                padding: '6px 11px',
                fontSize: 13,
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              <Flame size={14} />
              {streak} day{streak === 1 ? '' : 's'}
            </span>
          )}
        </div>

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

        <div style={{ marginBottom: 18 }}>
          <WeekStrip today={today} weekStart={settings.weekStart} completedDates={completedDates} />
        </div>

        <TodayHero
          kicker={`${formatLong(today)} · Scheduled`}
          routineName={routine.name}
          chips={chips}
          estTotalLabel={estMinutes(totalSec)}
          activeLabel={estMinutes(activeSec)}
          onStart={() => {
            void ensureSession(routine)
          }}
        />

        <div
          className="disp"
          style={{
            fontSize: 10,
            letterSpacing: '0.16em',
            color: 'var(--muted)',
            margin: '24px 0 12px',
          }}
        >
          Up first
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sorted.map((rex, i) => {
            const ex = exMap.get(rex.exerciseId)
            if (!ex) return null
            const series = exerciseSeries(allSessions ?? [], rex.exerciseId)
            const last = series.length ? series[series.length - 1] : null
            const target =
              ex.tracking === 'duration'
                ? `${formatDuration(rex.targetDuration ?? DEFAULT_DURATION)} hold`
                : formatWeight(rex.targetWeight, units)
            return (
              <button
                key={rex.id}
                className="tap card"
                onClick={() => navigate(`/exercise/${today}/${rex.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  width: '100%',
                  textAlign: 'left',
                  color: 'var(--text)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ width: 56, height: 56, flexShrink: 0 }}>
                  <ExerciseImage images={ex.images} alt={ex.name} variant="thumb" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14.5,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {ex.name}
                  </div>
                  <div
                    style={{
                      color: 'var(--muted)',
                      fontSize: 12,
                      marginTop: 3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {rex.targetSets} × {formatReps(rex.targetRepsMin, rex.targetRepsMax)} · {target}
                    {last ? ` · Last ${last.value}×${last.reps ?? ''}` : ''}
                  </div>
                </div>
                <span
                  className="disp"
                  style={{ fontSize: 18, color: 'var(--muted)', flexShrink: 0 }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
              </button>
            )
          })}
        </div>
      </Screen>
    )
  }

  // ---------- ACTIVE WORKOUT ----------

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
                duration={rex.targetDuration}
                units={units}
                completedSets={completedSetsFor(rex.id)}
                onToggleAll={() => toggleAllForExercise(rex.id, exSets)}
                onOpen={() => navigate(`/exercise/${today}/${rex.id}`)}
              />
            )
          })}
        </div>

        {!isCompleted && (
          <button className="tap" onClick={() => setPicking(true)} style={addExerciseBtn}>
            <Plus size={20} /> Add exercise
          </button>
        )}

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
                color: doneSets === 0 ? 'var(--muted)' : 'var(--on-accent)',
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
                onClick={() => navigate(`/summary/${today}`, { state: { suggestions } })}
                className="tap"
                style={{
                  height: 40,
                  padding: '0 16px',
                  borderRadius: 999,
                  border: 'none',
                  background: 'var(--accent)',
                  color: 'var(--on-accent)',
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

      {picking && exercises && (
        <ExercisePicker
          exercises={exercises}
          onPick={addExerciseToActive}
          onAddCustom={addCustomToActive}
          onClose={() => setPicking(false)}
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

const addExerciseBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  width: '100%',
  height: 52,
  marginTop: 12,
  borderRadius: 14,
  border: '1px dashed var(--border)',
  background: 'transparent',
  color: 'var(--accent)',
  fontWeight: 700,
  fontSize: 15,
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
