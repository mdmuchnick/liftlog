interface Props {
  value: number
  total: number
  size?: number
  stroke?: number
  label?: string
}

export default function ProgressRing({ value, total, size = 56, stroke = 6, label }: Props) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = total > 0 ? value / total : 0
  const offset = c * (1 - pct)
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.35s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size > 70 ? 15 : 12,
          fontWeight: 700,
        }}
      >
        <span>{label ?? `${value}/${total}`}</span>
      </div>
    </div>
  )
}
