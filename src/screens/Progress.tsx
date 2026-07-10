import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Dumbbell, Clock, Activity, BarChart3, ChevronDown, Plus, TrendingUp, TrendingDown } from 'lucide-react'
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

  const latest = series.length > 0 ? series[series.length - 1] : null
  const prev = series.length > 1 ? series[series.length - 2] : null
  const delta = latest && prev ? latest.value - prev.value : null

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

      {/* Overview stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {cards.map(({ label, value, Icon }) => (
          <div key={label} className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <Icon size={14} />
              {label}
            </div>
            <div
              className="disp"
              style={{
                fontSize: 26,
                marginTop: 6,
                color: label === 'Workouts' ? 'var(--effort)' : 'var(--accent)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
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
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <select
                value={activeExerciseId ?? ''}
                onChange={(e) => setExerciseId(e.target.value)}
                style={{
                  width: '100%',
                  height: 40,
                  borderRadius: 999,
                  border: 'none',
                  background: 'var(--surface-2)',
                  color: 'var(--text)',
                  fontWeight: 700,
                  fontSize: 13,
                  padding: '0 38px 0 16px',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  cursor: 'pointer',
                }}
              >
                {exerciseIds.map((id) => (
                  <option key={id} value={id}>
                    {exMap.get(id)?.name ?? 'Exercise'}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                color="var(--muted)"
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
            </div>

            {latest && (
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.14em',
                      color: 'var(--muted)',
                      marginBottom: 2,
                    }}
                  >
                    Working Weight
                  </div>
                  <div className="disp" style={{ fontSize: 34, color: 'var(--accent)' }}>
                    {latest.value}
                    <span style={{ fontSize: 15, marginLeft: 4, color: 'var(--muted)', fontFamily: 'inherit', textTransform: 'none', letterSpacing: 0 }}>{units}</span>
                  </div>
                </div>
                {delta !== null && delta !== 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--accent-soft)',
                      color: 'var(--accent)',
                      fontSize: 12,
                      fontWeight: 800,
                      borderRadius: 999,
                      padding: '6px 10px',
                    }}
                  >
                    {delta > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {delta > 0 ? '+' : ''}
                    {delta} {units}
                  </div>
                )}
              </div>
            )}

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
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Log today's weight</div>
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
              color: 'var(--on-accent)',
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
        <AreaChart data={chartData} margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
          <defs>
            <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 4" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--muted)' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--muted)' }}
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
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--accent)"
            strokeWidth={2.5}
            fill="url(#progressFill)"
            dot={{ r: 3, fill: 'var(--accent)', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
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
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
}
