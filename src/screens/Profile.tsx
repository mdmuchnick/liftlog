import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Download, Plus, RotateCcw, Upload } from 'lucide-react'
import Screen from '../components/Screen'
import Segmented from '../components/Segmented'
import Stepper from '../components/Stepper'
import { useRoutines, useSchedule, useSettings } from '../data/hooks'
import {
  createRoutine as createRoutineRepo,
  exportData,
  importData,
  saveWeeklySchedule,
  updateSettings,
} from '../data/repo'
import { ensureSeeded, resetAll } from '../data/db'
import { TYPE_COLORS } from '../lib/ui'

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Profile() {
  const navigate = useNavigate()
  const settings = useSettings()
  const routines = useRoutines()
  const schedule = useSchedule()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)

  if (!settings || !routines || !schedule) return <Screen title="Profile">{null}</Screen>

  const flash = (m: string) => {
    setMsg(m)
    setTimeout(() => setMsg(null), 2500)
  }

  const onExport = async () => {
    const bundle = await exportData()
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `liftlog-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    flash('Backup downloaded.')
  }

  const onImport = async (file: File) => {
    try {
      const text = await file.text()
      await importData(JSON.parse(text))
      flash('Data imported successfully.')
    } catch (e) {
      flash(`Import failed: ${(e as Error).message}`)
    }
  }

  const onReset = async () => {
    if (!confirm('Erase all data and restore the default routines? This cannot be undone.')) return
    await resetAll()
    await ensureSeeded()
    flash('Reset to defaults.')
  }

  const buildWorkout = async () => {
    const r = await createRoutineRepo()
    navigate(`/routine/${r.id}`)
  }

  const assignmentFor = (wd: number) =>
    schedule.assignments.find((a) => a.weekday === wd)?.routineId ?? null

  const setAssignment = async (wd: number, routineId: string | null) => {
    const next = WD.map((_, i) => ({
      weekday: i,
      routineId: i === wd ? routineId : assignmentFor(i),
    }))
    await saveWeeklySchedule(next)
  }

  return (
    <Screen title="Profile" subtitle={settings.userName ? `Hi, ${settings.userName}` : undefined}>
      {msg && (
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
          {msg}
        </div>
      )}

      {/* Appearance */}
      <Section title="Appearance">
        <Row label="Theme">
          <div style={{ width: 220 }}>
            <Segmented
              size="sm"
              options={[
                { value: 'dark', label: 'Dark' },
                { value: 'light', label: 'Light' },
                { value: 'minimal', label: 'Minimal' },
              ]}
              value={settings.theme}
              onChange={(v) => updateSettings({ theme: v })}
            />
          </div>
        </Row>
      </Section>

      {/* Preferences */}
      <Section title="Preferences">
        <Row label="Units">
          <div style={{ width: 130 }}>
            <Segmented
              size="sm"
              options={[
                { value: 'lbs', label: 'lbs' },
                { value: 'kg', label: 'kg' },
              ]}
              value={settings.units}
              onChange={(v) => updateSettings({ units: v })}
            />
          </div>
        </Row>
        <Row label="Default rest">
          <Stepper
            value={settings.defaultRestSeconds}
            onChange={(v) => updateSettings({ defaultRestSeconds: v })}
            step={15}
            min={15}
            max={600}
            suffix="s"
            width={130}
          />
        </Row>
        <Row label="Week starts">
          <div style={{ width: 160 }}>
            <Segmented
              size="sm"
              options={[
                { value: 'monday', label: 'Monday' },
                { value: 'sunday', label: 'Sunday' },
              ]}
              value={settings.weekStart}
              onChange={(v) => updateSettings({ weekStart: v })}
            />
          </div>
        </Row>
        <Row label="Auto rest timer">
          <div style={{ width: 120 }}>
            <Segmented
              size="sm"
              options={[
                { value: 'on', label: 'On' },
                { value: 'off', label: 'Off' },
              ]}
              value={settings.autoRest === false ? 'off' : 'on'}
              onChange={(v) => updateSettings({ autoRest: v === 'on' })}
            />
          </div>
        </Row>
      </Section>

      {/* Weekly schedule — one dropdown per day (handles long workout names) */}
      <Section title="Weekly Schedule">
        <div className="card" style={{ padding: 6 }}>
          {WD.map((label, wd) => {
            const rid = assignmentFor(wd)
            const r = routines.find((x) => x.id === rid)
            const dot = r ? TYPE_COLORS[r.type] : 'var(--muted)'
            return (
              <div
                key={wd}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 10px',
                  borderTop: wd === 0 ? 'none' : '1px solid var(--border)',
                }}
              >
                <span style={{ width: 40, fontWeight: 700, fontSize: 14 }}>{label}</span>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: 12,
                      width: 9,
                      height: 9,
                      borderRadius: 999,
                      background: dot,
                      pointerEvents: 'none',
                    }}
                  />
                  <select
                    value={rid ?? 'rest'}
                    onChange={(e) => setAssignment(wd, e.target.value === 'rest' ? null : e.target.value)}
                    style={daySelect}
                  >
                    {routines
                      .filter((x) => x.type !== 'rest')
                      .map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name}
                        </option>
                      ))}
                    <option value="rest">Rest</option>
                  </select>
                  <ChevronDown
                    size={16}
                    color="var(--muted)"
                    style={{ position: 'absolute', right: 12, pointerEvents: 'none' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* Routines */}
      <Section title="Workouts">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            className="tap"
            onClick={buildWorkout}
            style={{
              ...listBtn,
              justifyContent: 'center',
              background: 'var(--accent)',
              border: 'none',
              color: '#fff',
              fontWeight: 800,
            }}
          >
            <Plus size={18} /> Build a workout
          </button>
          {routines
            .filter((r) => r.type !== 'rest')
            .map((r) => (
              <button
                key={r.id}
                className="tap"
                onClick={() => navigate(`/routine/${r.id}`)}
                style={listBtn}
              >
                <span style={{ width: 10, height: 10, borderRadius: 999, background: TYPE_COLORS[r.type] }} />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700 }}>{r.name}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>{r.exercises.length} exercises</div>
                </div>
                <ChevronRight size={20} color="var(--muted)" />
              </button>
            ))}
        </div>
      </Section>

      {/* Data */}
      <Section title="Data & Backup">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="tap" onClick={onExport} style={listBtn}>
            <Download size={18} color="var(--accent)" />
            <span style={{ flex: 1, textAlign: 'left', fontWeight: 600 }}>Export data (JSON)</span>
          </button>
          <button className="tap" onClick={() => fileRef.current?.click()} style={listBtn}>
            <Upload size={18} color="var(--accent)" />
            <span style={{ flex: 1, textAlign: 'left', fontWeight: 600 }}>Import data</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onImport(f)
              e.target.value = ''
            }}
          />
          <button className="tap" onClick={onReset} style={{ ...listBtn, color: 'var(--danger)' }}>
            <RotateCcw size={18} />
            <span style={{ flex: 1, textAlign: 'left', fontWeight: 600 }}>Reset to defaults</span>
          </button>
        </div>
      </Section>

      <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, marginTop: 8 }}>
        LiftLog v1.0 · Local-first · Works offline
      </p>
    </Screen>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h3
        style={{
          margin: '0 0 12px',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        marginBottom: 8,
        gap: 12,
      }}
    >
      <span style={{ fontWeight: 600 }}>{label}</span>
      {children}
    </div>
  )
}

const listBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '14px',
  borderRadius: 14,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  minHeight: 52,
}

const daySelect: React.CSSProperties = {
  flex: 1,
  height: 44,
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: 'var(--surface-2)',
  color: 'var(--text)',
  fontWeight: 600,
  fontSize: 14,
  padding: '0 36px 0 30px',
  appearance: 'none',
  WebkitAppearance: 'none',
  width: '100%',
}
