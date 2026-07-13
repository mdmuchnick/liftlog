import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import ExerciseImage from './ExerciseImage'
import { uid } from '../data/seed'
import { DEFAULT_DURATION } from '../lib/ui'
import type { Exercise, RoutineExercise, Settings } from '../data/types'

/**
 * Build a RoutineExercise with the app's default targets/progression for a given
 * library exercise. Shared by RoutineEditor and the active-workout "add exercise"
 * flow so both produce identical defaults.
 */
export function buildRoutineExercise(ex: Exercise, settings: Settings, order: number): RoutineExercise {
  const isDuration = ex.tracking === 'duration'
  return {
    id: uid(),
    exerciseId: ex.id,
    order,
    targetSets: 3,
    targetRepsMin: ex.category === 'compound' ? 6 : 10,
    targetRepsMax: ex.category === 'compound' ? 8 : 12,
    targetWeight: 0,
    ...(isDuration ? { targetDuration: DEFAULT_DURATION } : {}),
    restSeconds: settings.defaultRestSeconds,
    progression: {
      type: isDuration ? 'manual' : ex.category === 'compound' ? 'linear' : 'double',
      incrementWeight: ex.primaryMuscle === 'quads' || ex.primaryMuscle === 'hamstrings' ? 10 : 5,
      repRangeMin: ex.category === 'compound' ? 6 : 10,
      repRangeMax: ex.category === 'compound' ? 8 : 12,
      deloadPercent: 10,
      failureThreshold: 2,
    },
  }
}

interface Props {
  exercises: Exercise[]
  onPick: (e: Exercise) => void
  onAddCustom: (name: string) => void
  onClose: () => void
}

/** Bottom-sheet exercise picker with search + "add custom" fallback. */
export default function ExercisePicker({ exercises, onPick, onAddCustom, onClose }: Props) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  const [q, setQ] = useState('')
  const query = q.trim()
  const filtered = exercises
    .filter((e) => e.name.toLowerCase().includes(q.toLowerCase()) || e.primaryMuscle.includes(q.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))
  const exactExists = exercises.some((e) => e.name.toLowerCase() === query.toLowerCase())

  return createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
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
          borderTop: '1px solid var(--border)',
          padding: 16,
          maxHeight: '80dvh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Add exercise</h2>
          <button onClick={onClose} className="tap" style={iconBtn} aria-label="close"><X size={20} /></button>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search exercises…"
          style={{ ...textInput, marginBottom: 12, flexShrink: 0 }}
          autoFocus
        />
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {filtered.map((ex) => (
            <button
              key={ex.id}
              className="tap"
              onClick={() => onPick(ex)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 10,
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text)',
                textAlign: 'left',
              }}
            >
              <div style={{ width: 40, height: 40, flexShrink: 0 }}>
                <ExerciseImage images={ex.images} alt={ex.name} variant="thumb" />
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{ex.name}</div>
                <div style={{ color: 'var(--muted)', fontSize: 12, textTransform: 'capitalize' }}>
                  {ex.primaryMuscle} · {ex.equipment}
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && !query && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>No matches.</div>
          )}

          {/* Add a typed exercise that isn't in the library yet */}
          {query.length > 1 && !exactExists && (
            <button
              className="tap"
              onClick={() => onAddCustom(query)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                borderRadius: 12,
                border: '1px dashed var(--accent)',
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  borderRadius: 10,
                  background: 'var(--surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  fontWeight: 800,
                }}
              >
                +
              </div>
              <div>
                <div style={{ fontWeight: 800 }}>Add “{query}”</div>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                  Creates a custom exercise &amp; fetches instructions + images
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

const textInput: React.CSSProperties = {
  width: '100%',
  height: 46,
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: 'var(--surface-2)',
  color: 'var(--text)',
  padding: '0 14px',
  boxSizing: 'border-box',
}

const iconBtn: React.CSSProperties = {
  width: 40,
  height: 40,
  minWidth: 40,
  borderRadius: 999,
  border: '1px solid var(--border)',
  background: 'var(--surface-2)',
  color: 'var(--text)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
