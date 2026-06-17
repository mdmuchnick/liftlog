import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Screen from '../components/Screen'
import Segmented from '../components/Segmented'
import {
  useRoutines,
  useSchedule,
  useScheduledWorkouts,
  useSessions,
  useSettings,
} from '../data/hooks'
import {
  fromISODate,
  monthGrid,
  monthName,
  todayISO,
  weekDates,
  weekdayHeaders,
  weekday,
  formatLong,
} from '../lib/date'
import type { RoutineType } from '../data/types'
import { TYPE_COLORS, TYPE_LABEL } from '../lib/ui'

export default function CalendarScreen() {
  const navigate = useNavigate()
  const settings = useSettings()
  const schedule = useSchedule()
  const routines = useRoutines()
  const overrides = useScheduledWorkouts()
  const sessions = useSessions()
  const today = todayISO()

  const [view, setView] = useState<'month' | 'week'>('month')
  const [cursor, setCursor] = useState(() => {
    const d = fromISODate(today)
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [weekAnchor, setWeekAnchor] = useState(today)

  const weekStart = settings?.weekStart ?? 'monday'

  // Resolve routine type for a given date.
  const typeForDate = useMemo(() => {
    const ovMap = new Map(overrides?.map((o) => [o.date, o]) ?? [])
    const routineMap = new Map(routines?.map((r) => [r.id, r]) ?? [])
    const completedDates = new Set(
      sessions?.filter((s) => s.status === 'completed').map((s) => s.date) ?? [],
    )
    return (iso: string): { type: RoutineType | null; completed: boolean } => {
      const completed = completedDates.has(iso)
      const ov = ovMap.get(iso)
      if (ov) {
        const r = ov.routineId ? routineMap.get(ov.routineId) : null
        return { type: r?.type ?? null, completed }
      }
      const a = schedule?.assignments.find((x) => x.weekday === weekday(iso))
      const r = a?.routineId ? routineMap.get(a.routineId) : null
      return { type: r?.type ?? null, completed }
    }
  }, [overrides, routines, schedule, sessions])

  if (!settings || !schedule || !routines) return <Screen title="Calendar">{null}</Screen>

  const headers = weekdayHeaders(weekStart)
  const grid = monthGrid(cursor.year, cursor.month, weekStart)
  const legendTypes: RoutineType[] = ['push', 'pull', 'legs', 'upper', 'lower', 'rest']

  const shiftMonth = (delta: number) => {
    setCursor((c) => {
      const m = c.month + delta
      const year = c.year + Math.floor(m / 12)
      const month = ((m % 12) + 12) % 12
      return { year, month }
    })
  }

  return (
    <Screen title="Calendar">
      <div style={{ marginBottom: 16 }}>
        <Segmented
          options={[
            { value: 'month', label: 'Month' },
            { value: 'week', label: 'Week' },
          ]}
          value={view}
          onChange={setView}
        />
      </div>

      {view === 'month' ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <button onClick={() => shiftMonth(-1)} className="tap" style={navBtn} aria-label="previous month">
              <ChevronLeft size={22} />
            </button>
            <div style={{ fontWeight: 800, fontSize: 17 }}>
              {monthName(cursor.month)} {cursor.year}
            </div>
            <button onClick={() => shiftMonth(1)} className="tap" style={navBtn} aria-label="next month">
              <ChevronRight size={22} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
            {headers.map((h, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>
                {h}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {grid.map((iso) => {
              const d = fromISODate(iso)
              const inMonth = d.getMonth() === cursor.month
              const isToday = iso === today
              const { type, completed } = typeForDate(iso)
              const color = type ? TYPE_COLORS[type] : null
              return (
                <button
                  key={iso}
                  className="tap"
                  onClick={() => navigate(`/day/${iso}`)}
                  style={{
                    aspectRatio: '1',
                    minHeight: 44,
                    borderRadius: 12,
                    border: isToday ? '2px solid var(--accent)' : '1px solid transparent',
                    background: completed ? 'var(--accent-soft)' : 'var(--surface)',
                    color: inMonth ? 'var(--text)' : 'var(--muted)',
                    opacity: inMonth ? 1 : 0.4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    fontWeight: isToday ? 800 : 600,
                    fontSize: 14,
                    position: 'relative',
                  }}
                >
                  {d.getDate()}
                  {color && type !== 'rest' && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        background: color,
                        position: 'absolute',
                        bottom: 6,
                      }}
                    />
                  )}
                  {completed && (
                    <span style={{ position: 'absolute', top: 4, right: 5, fontSize: 9, color: 'var(--success)' }}>✓</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* legend */}
          <div className="card" style={{ marginTop: 18, padding: 14, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {legendTypes.map((t) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                <span style={{ width: 9, height: 9, borderRadius: 999, background: TYPE_COLORS[t] }} />
                {TYPE_LABEL[t]}
              </div>
            ))}
          </div>
        </>
      ) : (
        <WeekView
          anchor={weekAnchor}
          weekStart={weekStart}
          typeForDate={typeForDate}
          today={today}
          onPick={(iso) => navigate(`/day/${iso}`)}
        />
      )}
    </Screen>
  )
}

function WeekView({
  anchor,
  weekStart,
  typeForDate,
  today,
  onPick,
}: {
  anchor: string
  weekStart: 'monday' | 'sunday'
  typeForDate: (iso: string) => { type: RoutineType | null; completed: boolean }
  today: string
  onPick: (iso: string) => void
}) {
  const [a, setA] = useState(anchor)
  const dates = weekDates(a, weekStart)
  const shift = (delta: number) => {
    const d = fromISODate(a)
    d.setDate(d.getDate() + delta * 7)
    setA(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }
  const headers = weekdayHeaders(weekStart)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={() => shift(-1)} className="tap" style={navBtn} aria-label="previous week">
          <ChevronLeft size={22} />
        </button>
        <div style={{ fontWeight: 800, fontSize: 15 }}>{formatLong(dates[0])} – {formatLong(dates[6]).replace(/^\w+, /, '')}</div>
        <button onClick={() => shift(1)} className="tap" style={navBtn} aria-label="next week">
          <ChevronRight size={22} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {dates.map((iso, i) => {
          const d = fromISODate(iso)
          const isToday = iso === today
          const { type, completed } = typeForDate(iso)
          return (
            <button
              key={iso}
              className="tap"
              onClick={() => onPick(iso)}
              style={{
                borderRadius: 14,
                border: isToday ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: completed ? 'var(--accent-soft)' : 'var(--surface)',
                padding: '10px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                minHeight: 76,
              }}
            >
              <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700 }}>{headers[i]}</span>
              <span style={{ fontWeight: 800, fontSize: 16 }}>{d.getDate()}</span>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: type && type !== 'rest' ? TYPE_COLORS[type] : 'transparent',
                }}
              />
            </button>
          )
        })}
      </div>
    </>
  )
}

const navBtn: React.CSSProperties = {
  width: 40,
  height: 40,
  minWidth: 40,
  borderRadius: 999,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
