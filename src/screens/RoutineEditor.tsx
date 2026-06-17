import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  CalendarPlus,
  ChevronDown,
  Copy,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import Screen from '../components/Screen'
import Segmented from '../components/Segmented'
import Stepper from '../components/Stepper'
import ExerciseImage from '../components/ExerciseImage'
import { useExercises, useRoutine, useSettings } from '../data/hooks'
import { deleteRoutine, duplicateRoutine, saveRoutine, setDayRoutine } from '../data/repo'
import { formatLong, todayISO } from '../lib/date'
import { uid } from '../data/seed'
import type {
  Exercise,
  ProgressionType,
  Routine,
  RoutineExercise,
  RoutineType,
} from '../data/types'
import { TYPE_COLORS, TYPE_LABEL, formatReps } from '../lib/ui'

const ROUTINE_TYPES: RoutineType[] = ['push', 'pull', 'legs', 'upper', 'lower', 'custom']

export default function RoutineEditor() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const stored = useRoutine(id)
  const exercises = useExercises()
  const settings = useSettings()

  const [draft, setDraft] = useState<Routine | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)
  const dateRef = useRef<HTMLInputElement>(null)

  // Load (or reload) the working copy whenever the routine id changes. Editing
  // persists immediately, so the live `stored` keeps the same id — only a real
  // id switch (open another routine / duplicate) resets the draft.
  useEffect(() => {
    if (stored && stored.id !== draft?.id) setDraft(structuredClone(stored))
  }, [stored, draft?.id])

  if (!draft || !exercises || !settings) return <Screen back>{null}</Screen>
  const units = settings.units
  const exMap = new Map(exercises.map((e) => [e.id, e]))

  const persist = (next: Routine) => {
    setDraft(next)
    void saveRoutine(next)
  }

  const updateRex = (rexId: string, patch: Partial<RoutineExercise>) => {
    persist({
      ...draft,
      exercises: draft.exercises.map((r) => (r.id === rexId ? { ...r, ...patch } : r)),
    })
  }

  const move = (idx: number, dir: -1 | 1) => {
    const arr = [...draft.exercises].sort((a, b) => a.order - b.order)
    const target = idx + dir
    if (target < 0 || target >= arr.length) return
    ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
    persist({ ...draft, exercises: arr.map((r, i) => ({ ...r, order: i })) })
  }

  const remove = (rexId: string) => {
    persist({
      ...draft,
      exercises: draft.exercises
        .filter((r) => r.id !== rexId)
        .map((r, i) => ({ ...r, order: i })),
    })
  }

  const addExercise = (ex: Exercise) => {
    const newRex: RoutineExercise = {
      id: uid(),
      exerciseId: ex.id,
      order: draft.exercises.length,
      targetSets: 3,
      targetRepsMin: ex.category === 'compound' ? 6 : 10,
      targetRepsMax: ex.category === 'compound' ? 8 : 12,
      targetWeight: 0,
      restSeconds: settings.defaultRestSeconds,
      progression: {
        type: ex.category === 'compound' ? 'linear' : 'double',
        incrementWeight: ex.primaryMuscle === 'quads' || ex.primaryMuscle === 'hamstrings' ? 10 : 5,
        repRangeMin: ex.category === 'compound' ? 6 : 10,
        repRangeMax: ex.category === 'compound' ? 8 : 12,
        deloadPercent: 10,
        failureThreshold: 2,
      },
    }
    persist({ ...draft, exercises: [...draft.exercises, newRex] })
    setPicking(false)
    setExpanded(newRex.id)
  }

  const onDelete = async () => {
    if (!confirm(`Delete "${draft.name}"? This removes the routine from your schedule.`)) return
    await deleteRoutine(draft.id)
    navigate(-1)
  }

  const onDuplicate = async () => {
    const newId = await duplicateRoutine(draft.id)
    if (newId) navigate(`/routine/${newId}`, { replace: true })
  }

  const showFlash = (m: string) => {
    setFlash(m)
    setTimeout(() => setFlash(null), 3000)
  }

  const onScheduleDate = async (iso: string) => {
    if (!iso) return
    await setDayRoutine(iso, draft.id)
    showFlash(`Scheduled “${draft.name}” for ${formatLong(iso)}.`)
  }

  const sorted = [...draft.exercises].sort((a, b) => a.order - b.order)

  return (
    <>
      <Screen
        title="Edit Routine"
        back
        right={
          <button onClick={onDelete} className="tap" aria-label="delete routine" style={iconBtn}>
            <Trash2 size={18} color="var(--danger)" />
          </button>
        }
      >
        {/* Name + type */}
        <div className="card" style={{ padding: 14, marginBottom: 16 }}>
          <label style={fieldLabel}>Routine name</label>
          <input
            value={draft.name}
            onChange={(e) => persist({ ...draft, name: e.target.value })}
            style={textInput}
            placeholder="e.g. Push Day"
          />
          <label style={{ ...fieldLabel, marginTop: 14 }}>Type (calendar color)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ROUTINE_TYPES.map((t) => (
              <button
                key={t}
                className="tap"
                onClick={() => persist({ ...draft, type: t })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: `1px solid ${draft.type === t ? 'var(--accent)' : 'var(--border)'}`,
                  background: draft.type === t ? 'var(--accent-soft)' : 'transparent',
                  color: draft.type === t ? 'var(--accent)' : 'var(--text)',
                  fontWeight: 600,
                  fontSize: 13,
                  minHeight: 40,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 999, background: TYPE_COLORS[t] }} />
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Copy / Schedule actions */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={onDuplicate} className="tap" style={actionBtn}>
            <Copy size={16} /> Duplicate
          </button>
          <button onClick={() => dateRef.current?.showPicker?.() ?? dateRef.current?.click()} className="tap" style={actionBtn}>
            <CalendarPlus size={16} /> Schedule
          </button>
          <input
            ref={dateRef}
            type="date"
            min={todayISO()}
            onChange={(e) => onScheduleDate(e.target.value)}
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
            aria-hidden
          />
        </div>
        {flash && (
          <div
            style={{
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              padding: '10px 14px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            {flash}
          </div>
        )}

        {/* Exercises */}
        <h3 style={sectionTitle}>Exercises ({sorted.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {sorted.map((rex, idx) => {
            const ex = exMap.get(rex.exerciseId)
            if (!ex) return null
            const open = expanded === rex.id
            return (
              <div key={rex.id} className="card" style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12 }}>
                  <div style={{ width: 40, height: 40, flexShrink: 0 }}>
                    <ExerciseImage images={ex.images} alt={ex.name} variant="thumb" />
                  </div>
                  <button
                    onClick={() => setExpanded(open ? null : rex.id)}
                    className="tap"
                    style={{ flex: 1, textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--text)' }}
                  >
                    <div style={{ fontWeight: 700 }}>{ex.name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>
                      {rex.targetSets} × {formatReps(rex.targetRepsMin, rex.targetRepsMax)} ·{' '}
                      {rex.targetWeight === 0 ? 'BW' : `${rex.targetWeight} ${units}`} ·{' '}
                      <span style={{ color: 'var(--accent)' }}>{progLabel(rex.progression.type)}</span>
                    </div>
                  </button>
                  <ChevronDown
                    size={20}
                    color="var(--muted)"
                    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                  />
                </div>

                {open && (
                  <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
                      <Field label="Sets">
                        <Stepper value={rex.targetSets} step={1} min={1} max={10} onChange={(v) => updateRex(rex.id, { targetSets: v })} width={110} />
                      </Field>
                      <Field label={`Weight (${units})`}>
                        <Stepper value={rex.targetWeight} step={units === 'lbs' ? 5 : 2.5} onChange={(v) => updateRex(rex.id, { targetWeight: v })} width={120} />
                      </Field>
                      <Field label="Reps min">
                        <Stepper value={rex.targetRepsMin} step={1} min={1} max={rex.targetRepsMax} onChange={(v) => updateRex(rex.id, { targetRepsMin: v })} width={104} />
                      </Field>
                      <Field label="Reps max">
                        <Stepper value={rex.targetRepsMax} step={1} min={rex.targetRepsMin} max={50} onChange={(v) => updateRex(rex.id, { targetRepsMax: v })} width={104} />
                      </Field>
                      <Field label="Rest (sec)">
                        <Stepper value={rex.restSeconds} step={15} min={0} max={600} onChange={(v) => updateRex(rex.id, { restSeconds: v })} width={120} />
                      </Field>
                    </div>

                    {/* Progression */}
                    <label style={{ ...fieldLabel, marginTop: 16 }}>Progression rule</label>
                    <Segmented
                      size="sm"
                      options={[
                        { value: 'linear', label: 'Linear' },
                        { value: 'double', label: 'Double' },
                        { value: 'manual', label: 'Manual' },
                      ]}
                      value={rex.progression.type}
                      onChange={(v: ProgressionType) =>
                        updateRex(rex.id, { progression: { ...rex.progression, type: v } })
                      }
                    />
                    <p style={{ color: 'var(--muted)', fontSize: 12, margin: '8px 0 0' }}>{progHelp(rex.progression.type)}</p>

                    {rex.progression.type !== 'manual' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                        <Field label={`Increment (${units})`}>
                          <Stepper
                            value={rex.progression.incrementWeight}
                            step={units === 'lbs' ? 5 : 2.5}
                            min={0}
                            onChange={(v) => updateRex(rex.id, { progression: { ...rex.progression, incrementWeight: v } })}
                            width={120}
                          />
                        </Field>
                        {rex.progression.type === 'linear' && (
                          <>
                            <Field label="Deload %">
                              <Stepper
                                value={rex.progression.deloadPercent}
                                step={5}
                                min={0}
                                max={50}
                                onChange={(v) => updateRex(rex.id, { progression: { ...rex.progression, deloadPercent: v } })}
                                width={104}
                              />
                            </Field>
                            <Field label="Fail threshold">
                              <Stepper
                                value={rex.progression.failureThreshold}
                                step={1}
                                min={1}
                                max={5}
                                onChange={(v) => updateRex(rex.id, { progression: { ...rex.progression, failureThreshold: v } })}
                                width={104}
                              />
                            </Field>
                          </>
                        )}
                      </div>
                    )}

                    {/* row actions */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                      <button className="tap" onClick={() => move(idx, -1)} disabled={idx === 0} style={smallBtn(idx === 0)}>
                        <ArrowUp size={16} /> Up
                      </button>
                      <button className="tap" onClick={() => move(idx, 1)} disabled={idx === sorted.length - 1} style={smallBtn(idx === sorted.length - 1)}>
                        <ArrowDown size={16} /> Down
                      </button>
                      <button className="tap" onClick={() => remove(rex.id)} style={{ ...smallBtn(false), color: 'var(--danger)', marginLeft: 'auto' }}>
                        <Trash2 size={16} /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <button className="tap" onClick={() => setPicking(true)} style={addBtn}>
          <Plus size={20} /> Add exercise
        </button>
      </Screen>

      {picking && (
        <ExercisePicker
          exercises={exercises}
          onPick={addExercise}
          onClose={() => setPicking(false)}
        />
      )}
    </>
  )
}

function ExercisePicker({
  exercises,
  onPick,
  onClose,
}: {
  exercises: Exercise[]
  onPick: (e: Exercise) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const filtered = exercises
    .filter((e) => e.name.toLowerCase().includes(q.toLowerCase()) || e.primaryMuscle.includes(q.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))
  return (
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
          padding: 16,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Add exercise</h2>
          <button onClick={onClose} className="tap" style={iconBtn} aria-label="close"><X size={20} /></button>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search exercises…"
          style={{ ...textInput, marginBottom: 12 }}
          autoFocus
        />
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
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
          {filtered.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>No matches.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function progLabel(t: ProgressionType) {
  return t === 'linear' ? 'Linear' : t === 'double' ? 'Double' : 'Manual'
}
function progHelp(t: ProgressionType) {
  if (t === 'linear') return 'Hit all sets → add weight. Repeated misses → auto-deload.'
  if (t === 'double') return 'Push reps to the top of the range, then add weight and reset reps.'
  return 'No auto-suggestions — you set targets yourself.'
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={fieldLabel}>{label}</div>
      {children}
    </div>
  )
}

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--muted)',
  marginBottom: 6,
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

const sectionTitle: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
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

const addBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  width: '100%',
  height: 52,
  borderRadius: 14,
  border: '1px dashed var(--border)',
  background: 'transparent',
  color: 'var(--accent)',
  fontWeight: 700,
  fontSize: 15,
}

const actionBtn: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  height: 44,
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontWeight: 700,
  fontSize: 14,
}

function smallBtn(disabled: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '8px 12px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--surface-2)',
    color: 'var(--text)',
    fontWeight: 600,
    fontSize: 13,
    opacity: disabled ? 0.4 : 1,
    minHeight: 38,
  }
}
