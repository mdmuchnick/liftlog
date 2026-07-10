import { Play } from 'lucide-react'

interface Props {
  kicker: string
  routineName: string
  chips: string[]
  estTotalLabel: string
  activeLabel: string
  onStart: () => void
}

/**
 * Pre-workout hero card: kicker + routine name in the display face, quick-facts
 * chips, a stats row (est. total / active time), and the primary Start CTA.
 */
export default function TodayHero({
  kicker,
  routineName,
  chips,
  estTotalLabel,
  activeLabel,
  onStart,
}: Props) {
  return (
    <div
      className="card"
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 22,
        padding: 20,
        // Subtle accent radial glow, top-right.
        background:
          'radial-gradient(120% 90% at 100% 0%, var(--accent-soft), transparent 60%), var(--surface)',
      }}
    >
      <div
        className="disp"
        style={{
          fontSize: 10,
          letterSpacing: '0.16em',
          color: 'var(--accent)',
        }}
      >
        {kicker}
      </div>

      <h2
        className="disp"
        style={{
          margin: '10px 0 0',
          fontSize: 42,
          lineHeight: 0.95,
          color: 'var(--text)',
        }}
      >
        {routineName}
      </h2>

      <div
        className="no-scrollbar"
        style={{
          display: 'flex',
          gap: 8,
          marginTop: 16,
          overflowX: 'auto',
        }}
      >
        {chips.map((c, i) => (
          <span
            key={i}
            style={{
              flexShrink: 0,
              whiteSpace: 'nowrap',
              background: 'var(--surface-2)',
              color: 'var(--muted)',
              borderRadius: 999,
              padding: '7px 12px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {c}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 24, margin: '20px 0 18px' }}>
        <Stat label="Est. total" value={estTotalLabel} accent={false} />
        <Stat label="Active time" value={activeLabel} accent />
      </div>

      <button
        onClick={onStart}
        className="tap"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          border: 'none',
          borderRadius: 999,
          background: 'var(--accent)',
          color: 'var(--on-accent)',
          padding: '15px 0',
          textTransform: 'uppercase',
          fontWeight: 800,
          fontSize: 14,
          letterSpacing: '0.06em',
        }}
      >
        <Play size={16} fill="var(--on-accent)" strokeWidth={0} />
        Start Workout
      </button>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent: boolean }) {
  return (
    <div>
      <div
        className="disp"
        style={{
          fontSize: 24,
          color: accent ? 'var(--accent)' : 'var(--text)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      <div
        className="disp"
        style={{
          fontSize: 10,
          letterSpacing: '0.14em',
          color: 'var(--muted)',
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  )
}
