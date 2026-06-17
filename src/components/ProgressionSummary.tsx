import { ArrowRight, TrendingUp } from 'lucide-react'
import type { ProgressionSuggestion } from '../data/types'
import { formatReps, formatWeight } from '../lib/ui'

interface Props {
  suggestions: ProgressionSuggestion[]
  units: 'lbs' | 'kg'
  onClose: () => void
}

/** Shown at session end — the "Next time" progression summary (PRD §7.2). */
export default function ProgressionSummary({ suggestions, units, onClose }: Props) {
  const changed = suggestions.filter(
    (s) => s.suggestedWeight !== s.currentWeight || s.suggestedRepsMax !== s.currentRepsMax,
  )
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="pb-safe"
        style={{
          width: '100%',
          maxWidth: 600,
          background: 'var(--surface)',
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          padding: 20,
          maxHeight: '82vh',
          overflowY: 'auto',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--border)', margin: '0 auto 16px' }} />
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              background: 'var(--accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
            }}
          >
            <TrendingUp size={28} color="var(--accent)" />
          </div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Workout complete!</h2>
          <p style={{ color: 'var(--muted)', margin: '6px 0 18px', fontSize: 14 }}>
            {changed.length > 0
              ? `${changed.length} target${changed.length > 1 ? 's' : ''} updated for next time.`
              : 'Targets held steady — keep pushing next session.'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {suggestions.map((s) => {
            const up = s.suggestedWeight > s.currentWeight
            const repsChanged = s.suggestedRepsMax !== s.currentRepsMax
            return (
              <div
                key={s.routineExerciseId}
                className="card"
                style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{s.exerciseName}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{s.reason}</div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 700,
                    fontSize: 13,
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ color: 'var(--muted)' }}>{formatWeight(s.currentWeight, units)}</span>
                  <ArrowRight size={14} color={up ? 'var(--success)' : 'var(--muted)'} />
                  <span style={{ color: up ? 'var(--success)' : 'var(--text)' }}>
                    {formatWeight(s.suggestedWeight, units)}
                  </span>
                  {repsChanged && (
                    <span style={{ color: 'var(--muted)', marginLeft: 2 }}>
                      @{formatReps(s.suggestedRepsMin, s.suggestedRepsMax)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <button
          onClick={onClose}
          className="tap"
          style={{
            width: '100%',
            height: 50,
            borderRadius: 14,
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            fontWeight: 800,
            fontSize: 16,
          }}
        >
          Done
        </button>
      </div>
    </div>
  )
}
