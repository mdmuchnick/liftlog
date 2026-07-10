import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, X } from 'lucide-react'
import { formatClock } from '../lib/date'

interface Props {
  defaultSeconds: number
  onClose: () => void
}

/**
 * Rest timer. Uses absolute timestamps so it stays accurate when the tab is
 * backgrounded (PRD Epic 2 acceptance) — on return it recomputes elapsed.
 */
export default function RestTimer({ defaultSeconds, onClose }: Props) {
  const [duration, setDuration] = useState(defaultSeconds)
  const [remaining, setRemaining] = useState(defaultSeconds)
  const [running, setRunning] = useState(true)
  const endRef = useRef<number>(Date.now() + defaultSeconds * 1000)
  const beeped = useRef(false)

  useEffect(() => {
    if (!running) return
    const tick = () => {
      const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0 && !beeped.current) {
        beeped.current = true
        try {
          navigator.vibrate?.(200)
        } catch {
          /* no-op */
        }
        setRunning(false)
      }
    }
    tick()
    const id = setInterval(tick, 250)
    const onVis = () => tick()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [running])

  const reset = (secs: number) => {
    setDuration(secs)
    setRemaining(secs)
    endRef.current = Date.now() + secs * 1000
    beeped.current = false
    setRunning(true)
  }

  const toggle = () => {
    if (running) {
      setRunning(false)
    } else {
      endRef.current = Date.now() + remaining * 1000
      beeped.current = false
      setRunning(true)
    }
  }

  const pct = duration > 0 ? remaining / duration : 0
  const done = remaining === 0

  return (
    <div
      className="pb-safe"
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 76,
        zIndex: 50,
        background: 'var(--surface)',
        border: `1px solid ${done ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 16,
        padding: 14,
        boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
        maxWidth: 576,
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            {done ? 'Rest complete' : 'Rest timer'}
          </div>
          <div
            className="disp"
            style={{
              fontSize: 30,
              fontVariantNumeric: 'tabular-nums',
              color: done ? 'var(--accent)' : 'var(--text)',
            }}
          >
            {formatClock(remaining)}
          </div>
        </div>
        <button onClick={toggle} className="tap" style={iconBtn}>
          {running ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button onClick={() => reset(duration)} className="tap" style={iconBtn}>
          <RotateCcw size={18} />
        </button>
        <button
          onClick={onClose}
          className="tap"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            height: 44,
            minHeight: 44,
            padding: '0 16px',
            borderRadius: 999,
            border: 'none',
            background: 'var(--accent)',
            color: 'var(--on-accent)',
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: '0.04em',
          }}
        >
          <X size={16} strokeWidth={3} />
          Skip
        </button>
      </div>
      <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 999, marginTop: 12 }}>
        <div
          style={{
            height: '100%',
            width: `${pct * 100}%`,
            background: 'var(--accent)',
            borderRadius: 999,
            transition: 'width 0.25s linear',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {[60, 90, 120, 180].map((s) => (
          <button
            key={s}
            className="tap"
            onClick={() => reset(s)}
            style={{
              flex: 1,
              height: 36,
              minHeight: 36,
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: duration === s ? 'var(--accent-soft)' : 'transparent',
              color: duration === s ? 'var(--accent)' : 'var(--muted)',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {s < 60 ? `${s}s` : `${s / 60}m`}
          </button>
        ))}
      </div>
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  width: 44,
  height: 44,
  minWidth: 44,
  borderRadius: 999,
  border: '1px solid var(--border)',
  background: 'var(--surface-2)',
  color: 'var(--text)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
