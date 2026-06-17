import { useMemo, useState } from 'react'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Dumbbell, Clock, Activity, BarChart3, Plus } from 'lucide-react'
import Screen from '../components/Screen'
import Segmented from '../components/Segmented'
import Stepper from '../components/Stepper'
import { useBodyMetrics, useExerciseMap, useSessions, useSettings } from '../data/hooks'
import { addBodyMetric } from '../data/repo'
import {
  computeOverview,
  currentStreak,
  exerciseSeries,
  loggedExerciseIds,
  type Period,
} from '../lib/metrics'
import { formatDuration, formatShort, todayISO } from '../lib/date'

export default function Progress() {
  const settings = useSettings()
  const sessions = useSessions()
  const exMap = useExerciseMap()
  const bodyMetrics = useBodyMetrics()

  const [period, setPeriod] = useState<Period>('week')
  const [exerciseId, setExerciseId] = useState<string | null>(null)
  const [bw, setBw] = useState(180)

  const overview = useMemo(
    () => computeOverview(sessions ?? [], period),
    [sessions, period],
  )
  const streak = useMemo(() => currentStreak(sessions ?? []), [sessions])

  const exerciseIds = useMemo(() => loggedExerciseIds(sessions ?? []), [sessions])
  const activeExerciseId = exerciseId ?? exerciseIds[0] ?? null
  const series = useMemo(
    () => (activeExerciseId ? exerciseSeries(sessions ?? [], activeExerciseId) : []),
    [sessions, activeExerciseId],
  )

  if (!settings || !exMap) return <Screen title="Progress">{null}</Screen>
  const units = settings.units

  const cards = [
    { label: 'Workouts', value: String(overview.workouts), Icon: Dumbbell },
    { label: `Volume (${units})`, value: Math.round(overview.totalVolume).toLocaleString(), Icon: BarChart3 },
    { label: 'Total Time', value: formatDuration(overview.totalSeconds), Icon: Clock },
    { label: 'Avg / Workout', value: formatDuration(overview.avgSeconds), Icon: Activity },
  ]

  const bodySeries = (bodyMetrics ?? []).map((m) => ({ date: m.date, value: m.weight }))

  return (
    <Screen title="Progress" subtitle={`🔥 ${streak}-day streak`}>
      <div style={{ marginBottom: 16 }}>
        <Segmented
          options={[
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
            { value: 'all', label: 'All Time' },
          ]}
          value={period}
          onChange={setPeriod}
        />
      </div>

      {/* Overview cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {cards.map(({ label, value, Icon }) => (
          <div key={label} className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 12 }}>
              <Icon size={15} />
              {label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Exercise progress */}
      <section style={{ marginBottom: 26 }}>
        <h3 style={sectionTitle}>Exercise Progress</h3>
        {exerciseIds.length === 0 ? (
          <EmptyChart text="Log a workout to see your strength curve." />
        ) : (
          <div className="card" style={{ padding: 14 }}>
            <div style={{ marginBottom: 12, overflowX: 'auto' }} className="no-scrollbar">
              <div style={{ display: 'flex', gap: 8 }}>
                {exerciseIds.map((id) => {
                  const name = exMap.get(id)?.name ?? 'Exercise'
                  const active = id === activeExerciseId
                  return (
                    <button
                      key={id}
                      className="tap"
                      onClick={() => setExerciseId(id)}
                      style={{
                        whiteSpace: 'nowrap',
                        padding: '7px 12px',
                        borderRadius: 999,
                        border: '1px solid var(--border)',
                        background: active ? 'var(--accent)' : 'transparent',
                        color: active ? '#fff' : 'var(--muted)',
                        fontWeight: 600,
                        fontSize: 13,
                        minHeight: 36,
                      }}
                    >
                      {name}
                    </button>
                  )
                })}
              </div>
            </div>
            <ProgressChart data={series} units={units} suffix={units} />
          </div>
        )}
      </section>

      {/* Bodyweight */}
      <section>
        <h3 style={sectionTitle}>Weight Progress</h3>
        <div className="card" style={{ padding: 14, marginBottom: 12 }}>
          {bodySeries.length === 0 ? (
            <EmptyChart text="Log your bodyweight to start tracking." inline />
          ) : (
            <ProgressChart data={bodySeries} units={units} suffix={units} />
          )}
        </div>
        <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Log today's weight</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{formatShort(todayISO())}</div>
          </div>
          <Stepper value={bw} onChange={setBw} step={1} suffix={units} width={130} />
          <button
            onClick={() => addBodyMetric(todayISO(), bw)}
            className="tap"
            aria-label="save bodyweight"
            style={{
              width: 44,
              height: 44,
              minWidth: 44,
              borderRadius: 12,
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={22} />
          </button>
        </div>
      </section>
    </Screen>
  )
}

function ProgressChart({
  data,
  suffix,
}: {
  data: { date: string; value: number; reps?: number }[]
  units: 'lbs' | 'kg'
  suffix: string
}) {
  if (data.length === 0) return <EmptyChart text="No data yet." inline />
  const chartData = data.map((d) => ({ ...d, label: formatShort(d.date) }))
  return (
    <div style={{ height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--muted)' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--muted)' }}
            axisLine={false}
            tickLine={false}
            width={44}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              color: 'var(--text)',
              fontSize: 12,
            }}
            labelStyle={{ color: 'var(--muted)' }}
            formatter={(v: number, _n, p: { payload?: { reps?: number } }) => {
              const reps = p?.payload?.reps
              return [`${v} ${suffix}${reps ? ` × ${reps}` : ''}`, 'Top set']
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--accent)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: 'var(--accent)' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function EmptyChart({ text, inline }: { text: string; inline?: boolean }) {
  const inner = (
    <div
      style={{
        height: inline ? 140 : 160,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--muted)',
        fontSize: 14,
        textAlign: 'center',
        padding: 16,
      }}
    >
      {text}
    </div>
  )
  return inline ? inner : <div className="card">{inner}</div>
}

const sectionTitle: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
}
