import { Check } from 'lucide-react'
import { fromISODate, weekDates } from '../lib/date'

interface Props {
  today: string
  weekStart: 'monday' | 'sunday'
  completedDates: Set<string>
}

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/**
 * A 7-tile strip for the current week. Completed-session days get an accent-soft
 * tile with an accent check; today is a solid accent tile showing the day number;
 * the rest are muted.
 */
export default function WeekStrip({ today, weekStart, completedDates }: Props) {
  const dates = weekDates(today, weekStart)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
      {dates.map((iso) => {
        const d = fromISODate(iso)
        const isToday = iso === today
        const done = completedDates.has(iso)
        const letter = LETTERS[d.getDay()]

        let bg = 'var(--surface-2)'
        let fg = 'var(--muted)'
        if (isToday) {
          bg = 'var(--accent)'
          fg = 'var(--on-accent)'
        } else if (done) {
          bg = 'var(--accent-soft)'
          fg = 'var(--accent)'
        }

        return (
          <div
            key={iso}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span
              className="disp"
              style={{
                fontSize: 10,
                letterSpacing: '0.14em',
                color: isToday ? 'var(--accent)' : 'var(--muted)',
              }}
            >
              {letter}
            </span>
            <div
              style={{
                width: '100%',
                aspectRatio: '1 / 1.15',
                borderRadius: 12,
                background: bg,
                color: fg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {done && !isToday ? (
                <Check size={16} color="var(--accent)" strokeWidth={3} />
              ) : (
                <span
                  className="disp"
                  style={{ fontSize: 16, lineHeight: 1 }}
                >
                  {d.getDate()}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
