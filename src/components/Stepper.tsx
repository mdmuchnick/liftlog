import { useEffect, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'

interface Props {
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
  suffix?: string
  width?: number
  /** Allow tapping the number to type an exact value (default true). */
  editable?: boolean
}

export default function Stepper({
  value,
  onChange,
  step = 5,
  min = 0,
  max = 9999,
  suffix,
  width = 120,
  editable = true,
}: Props) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  const round = (v: number) => Math.round(v * 100) / 100
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const commit = () => {
    const parsed = parseFloat(draft)
    if (!Number.isNaN(parsed)) onChange(clamp(round(parsed)))
    setEditing(false)
  }

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
        onClick={() => onChange(clamp(round(value - step)))}
        style={{ height: 44, width: 38, flexShrink: 0, background: 'transparent', border: 'none', color: 'var(--text)' }}
      >
        <Minus size={18} style={{ margin: '0 auto' }} />
      </button>

      {editing ? (
        <input
          ref={inputRef}
          type="number"
          inputMode="decimal"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') setEditing(false)
          }}
          style={{
            flex: 1,
            minWidth: 0,
            textAlign: 'center',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text)',
            fontWeight: 700,
            fontSize: 16,
            fontVariantNumeric: 'tabular-nums',
            padding: 0,
          }}
        />
      ) : (
        <button
          className="tap"
          disabled={!editable}
          onClick={() => {
            if (!editable) return
            setDraft(String(value))
            setEditing(true)
          }}
          style={{
            flex: 1,
            minWidth: 0,
            height: 44,
            background: 'transparent',
            border: 'none',
            color: 'var(--text)',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            fontSize: 16,
            whiteSpace: 'nowrap',
            cursor: editable ? 'text' : 'default',
          }}
        >
          {value}
          {suffix ? <span style={{ color: 'var(--muted)', fontSize: 12 }}> {suffix}</span> : null}
        </button>
      )}

      <button
        className="tap"
        aria-label="increase"
        onClick={() => onChange(clamp(round(value + step)))}
        style={{ height: 44, width: 38, flexShrink: 0, background: 'transparent', border: 'none', color: 'var(--text)' }}
      >
        <Plus size={18} style={{ margin: '0 auto' }} />
      </button>
    </div>
  )
}
