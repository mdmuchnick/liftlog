import { Minus, Plus } from 'lucide-react'

interface Props {
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
  suffix?: string
  width?: number
}

export default function Stepper({
  value,
  onChange,
  step = 5,
  min = 0,
  max = 9999,
  suffix,
  width = 120,
}: Props) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  return (
    <div
      className="input-stepper"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 44,
        width,
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
    >
      <button
        className="tap"
        aria-label="decrease"
        onClick={() => onChange(clamp(value - step))}
        style={{ height: 44, width: 40, background: 'transparent', border: 'none', color: 'var(--text)' }}
      >
        <Minus size={18} style={{ margin: '0 auto' }} />
      </button>
      <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: 16 }}>
        {value}
        {suffix ? <span style={{ color: 'var(--muted)', fontSize: 12 }}> {suffix}</span> : null}
      </span>
      <button
        className="tap"
        aria-label="increase"
        onClick={() => onChange(clamp(value + step))}
        style={{ height: 44, width: 40, background: 'transparent', border: 'none', color: 'var(--text)' }}
      >
        <Plus size={18} style={{ margin: '0 auto' }} />
      </button>
    </div>
  )
}
