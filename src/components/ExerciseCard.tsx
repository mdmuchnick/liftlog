import { Check, ChevronRight } from 'lucide-react'
import type { Exercise } from '../data/types'
import { DEFAULT_DURATION, formatDuration, formatReps, formatWeight } from '../lib/ui'
import ExerciseImage from './ExerciseImage'

interface Props {
  exercise: Exercise
  sets: number
  repsMin: number
  repsMax: number
  weight: number
  duration?: number
  units: 'lbs' | 'kg'
  completedSets: number
  onToggleAll: () => void
  onOpen: () => void
}

export default function ExerciseCard({
  exercise,
  sets,
  repsMin,
  repsMax,
  weight,
  duration,
  units,
  completedSets,
  onToggleAll,
  onOpen,
}: Props) {
  const done = completedSets >= sets && sets > 0
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        opacity: done ? 0.72 : 1,
      }}
    >
      {/* completion checkbox (left edge) */}
      <button
        className="tap"
        aria-label={done ? 'mark incomplete' : 'mark all sets complete'}
        onClick={onToggleAll}
        style={{
          flexShrink: 0,
          width: 30,
          height: 30,
          borderRadius: 999,
          border: `2px solid ${done ? 'var(--accent)' : 'var(--border)'}`,
          background: done ? 'var(--accent)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 30,
          minHeight: 30,
        }}
      >
        {done && <Check size={18} color="var(--on-accent)" strokeWidth={3} />}
      </button>

      <button
        onClick={onOpen}
        className="tap"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'transparent',
          border: 'none',
          textAlign: 'left',
          color: 'var(--text)',
          padding: 0,
          minHeight: 56,
        }}
      >
        <div style={{ width: 56, height: 56, flexShrink: 0 }}>
          <ExerciseImage images={exercise.images} alt={exercise.name} variant="thumb" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span
              style={{
                fontWeight: 700,
                fontSize: 15,
                textDecoration: done ? 'line-through' : 'none',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: 0,
              }}
            >
              {exercise.name}
            </span>
            {exercise.equipment && (
              <span
                style={{
                  flexShrink: 0,
                  padding: '3px 9px',
                  borderRadius: 999,
                  background: 'var(--surface-2)',
                  color: 'var(--muted)',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  whiteSpace: 'nowrap',
                }}
              >
                {exercise.equipment}
              </span>
            )}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 3 }}>
            {sets} × {formatReps(repsMin, repsMax)} ·{' '}
            {exercise.tracking === 'duration'
              ? `${formatDuration(duration ?? DEFAULT_DURATION)} hold`
              : formatWeight(weight, units)}
            <span style={{ color: 'var(--accent)', marginLeft: 8, fontWeight: 700 }}>
              {completedSets}/{sets}
            </span>
          </div>
        </div>
        <ChevronRight size={20} color="var(--muted)" style={{ flexShrink: 0 }} />
      </button>
    </div>
  )
}
