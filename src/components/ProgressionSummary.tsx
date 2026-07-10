import { ArrowRight } from 'lucide-react'
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
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              color: 'var(--accent)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            Session logged
          </div>
          <h2 className="disp" style={{ fontSize: 34, margin: '6px 0 0' }}>
            Workout <span style={{ color: 'var(--accent)' }}>Complete</span>
          </h2>
          <p style={{ color: 'var(--muted)', margin: '8px 0 0', fontSize: 13 }}>
            {changed.length > 0
              ? `${changed.length} target${changed.length > 1 ? 's' : ''} updated for next time.`
              : 'Targets held steady — keep pushing next session.'}
          </p>
        </div>

        <div
          style={{
            color: 'var(--muted)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          Progression for next time
        </div>
        <div className="card" style={{ padding: '0 14px', marginBottom: 18 }}>
          {suggestions.map((s, i) => {
            const up = s.suggestedWeight > s.currentWeight
            const repsChanged = s.suggestedRepsMax !== s.currentRepsMax
            const isChanged = up || repsChanged
            return (
              <div
                key={s.routineExerciseId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{s.exerciseName}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{s.reason}</div>
                </div>
                {isChanged ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontWeight: 700,
                      fontSize: 13,
                      color: 'var(--accent)',
                      fontVariantNumeric: 'tabular-nums',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span style={{ color: 'var(--muted)' }}>{formatWeight(s.currentWeight, units)}</span>
                    <ArrowRight size={14} color="var(--accent)" />
                    <span>{formatWeight(s.suggestedWeight, units)}</span>
                    {repsChanged && (
                      <span style={{ color: 'var(--muted)', marginLeft: 2 }}>
                        @{formatReps(s.suggestedRepsMin, s.suggestedRepsMax)}
                      </span>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--muted)',
                      fontVariantNumeric: 'tabular-nums',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    hold &middot; {formatWeight(s.currentWeight, units)}
                  </div>
                )}
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
            borderRadius: 999,
            border: 'none',
            background: 'var(--accent)',
            color: 'var(--on-accent)',
            fontWeight: 800,
            fontSize: 14,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Done
        </button>
      </div>
    </div>
  )
}
