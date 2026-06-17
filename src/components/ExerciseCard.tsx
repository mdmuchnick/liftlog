import { Check, ChevronRight } from 'lucide-react'
import type { Exercise } from '../data/types'
import { formatReps, formatWeight } from '../lib/ui'
import ExerciseImage from './ExerciseImage'

interface Props {
  exercise: Exercise
  sets: number
  repsMin: number
  repsMax: number
  weight: number
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
        {done && <Check size={18} color="#fff" strokeWidth={3} />}
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
        <div style={{ width: 52, height: 52, flexShrink: 0 }}>
          <ExerciseImage images={exercise.images} alt={exercise.name} variant="thumb" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 16,
              textDecoration: done ? 'line-through' : 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {exercise.name}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>
            {sets} × {formatReps(repsMin, repsMax)} · {formatWeight(weight, units)}
            <span style={{ color: 'var(--accent)', marginLeft: 8 }}>
              {completedSets}/{sets}
            </span>
          </div>
        </div>
        <ChevronRight size={20} color="var(--muted)" style={{ flexShrink: 0 }} />
      </button>
    </div>
  )
}
