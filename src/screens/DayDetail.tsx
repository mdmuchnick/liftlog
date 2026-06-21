import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, Pencil } from 'lucide-react'
import Screen from '../components/Screen'
import {
  useExerciseMap,
  useRoutines,
  useSchedule,
  useScheduledWorkouts,
  useSessionForDate,
  useSettings,
} from '../data/hooks'
import { setDayRoutine } from '../data/repo'
import { formatLong, todayISO, weekday } from '../lib/date'
import { DEFAULT_DURATION, formatDuration, formatReps, formatWeight, TYPE_COLORS, TYPE_LABEL } from '../lib/ui'

export default function DayDetail() {
  const { date = todayISO() } = useParams()
  const navigate = useNavigate()
  const settings = useSettings()
  const routines = useRoutines()
  const schedule = useSchedule()
  const overrides = useScheduledWorkouts()
  const exMap = useExerciseMap()
  const session = useSessionForDate(date)

  const routineId = useMemo(() => {
    const ov = overrides?.find((o) => o.date === date)
    if (ov) return ov.routineId
    const a = schedule?.assignments.find((x) => x.weekday === weekday(date))
    return a?.routineId ?? null
  }, [overrides, schedule, date])

  if (!settings || !routines || !exMap || !schedule) return <Screen back>{null}</Screen>

  const routine = routines.find((r) => r.id === routineId) ?? null
  const units = settings.units
  const isToday = date === todayISO()
  const completed = session?.status === 'completed'

  return (
    <Screen title={formatLong(date)} subtitle={isToday ? 'Today' : undefined} back>
      {routine ? (
        <>
          <div className="card" style={{ padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 12, height: 12, borderRadius: 999, background: TYPE_COLORS[routine.type] }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{routine.name}</div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                {TYPE_LABEL[routine.type]} · {routine.exercises.length} exercises
                {completed && <span style={{ color: 'var(--success)', marginLeft: 6 }}>✓ Completed</span>}
              </div>
            </div>
            <button
              onClick={() => navigate(`/routine/${routine.id}`)}
              className="tap"
              aria-label="edit routine"
              style={iconBtn}
            >
              <Pencil size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {[...routine.exercises]
              .sort((a, b) => a.order - b.order)
              .map((rex) => {
                const ex = exMap.get(rex.exerciseId)
                if (!ex) return null
                const setsDone =
                  session?.setLogs.filter((s) => s.routineExerciseId === rex.id && s.completed).length ?? 0
                return (
                  <div key={rex.id} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    {setsDone >= rex.targetSets && rex.targetSets > 0 ? (
                      <span style={{ color: 'var(--success)' }}><Check size={18} /></span>
                    ) : (
                      <span style={{ width: 18 }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{ex.name}</div>
                      <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                        {rex.targetSets} × {formatReps(rex.targetRepsMin, rex.targetRepsMax)} ·{' '}
                        {ex.tracking === 'duration'
                          ? `${formatDuration(rex.targetDuration ?? DEFAULT_DURATION)} hold`
                          : formatWeight(rex.targetWeight, units)}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {isToday && (
              <button onClick={() => navigate('/')} className="tap" style={primaryBtn}>
                {completed ? 'View today' : 'Open in Today'}
              </button>
            )}
            <ChangeRoutine date={date} routines={routines} currentId={routineId} />
          </div>
        </>
      ) : (
        <>
          <div className="card" style={{ padding: 24, textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 38, marginBottom: 8 }}>🌙</div>
            <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>Rest day</h2>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: 14 }}>No workout scheduled.</p>
          </div>
          <ChangeRoutine date={date} routines={routines} currentId={routineId} />
        </>
      )}
    </Screen>
  )
}

function ChangeRoutine({
  date,
  routines,
  currentId,
}: {
  date: string
  routines: { id: string; name: string; type: keyof typeof TYPE_COLORS }[]
  currentId: string | null
}) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>
        Assign routine to this day
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {routines
          .filter((r) => r.type !== 'rest')
          .map((r) => (
            <button
              key={r.id}
              className="tap"
              onClick={() => setDayRoutine(date, r.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 999,
                border: `1px solid ${currentId === r.id ? 'var(--accent)' : 'var(--border)'}`,
                background: currentId === r.id ? 'var(--accent-soft)' : 'transparent',
                color: currentId === r.id ? 'var(--accent)' : 'var(--text)',
                fontWeight: 600,
                fontSize: 13,
                minHeight: 40,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 999, background: TYPE_COLORS[r.type] }} />
              {r.name}
            </button>
          ))}
        <button
          className="tap"
          onClick={() => setDayRoutine(date, null)}
          style={{
            padding: '8px 12px',
            borderRadius: 999,
            border: `1px solid ${currentId === null ? 'var(--accent)' : 'var(--border)'}`,
            background: currentId === null ? 'var(--accent-soft)' : 'transparent',
            color: currentId === null ? 'var(--accent)' : 'var(--muted)',
            fontWeight: 600,
            fontSize: 13,
            minHeight: 40,
          }}
        >
          Rest
        </button>
      </div>
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  width: 40,
  height: 40,
  minWidth: 40,
  borderRadius: 999,
  border: '1px solid var(--border)',
  background: 'var(--surface-2)',
  color: 'var(--text)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const primaryBtn: React.CSSProperties = {
  height: 50,
  borderRadius: 14,
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  fontWeight: 800,
  fontSize: 16,
}
