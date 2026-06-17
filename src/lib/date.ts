// Lightweight date helpers — local time, ISO yyyy-mm-dd keys (no external deps).

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: string, n: number): string {
  const d = fromISODate(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

/** 0 = Sunday ... 6 = Saturday */
export function weekday(iso: string): number {
  return fromISODate(iso).getDay()
}

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const weekdayShort = (iso: string) => WEEKDAY_SHORT[weekday(iso)]
export const weekdayLetter = (wd: number) => WEEKDAY_LETTER[wd]
export const monthName = (monthIndex: number) => MONTHS[monthIndex]

export function formatLong(iso: string): string {
  const d = fromISODate(iso)
  return `${WEEKDAY_SHORT[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export function formatShort(iso: string): string {
  const d = fromISODate(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/** Returns the 7 ISO dates of the week containing `iso`. */
export function weekDates(iso: string, weekStart: 'monday' | 'sunday'): string[] {
  const d = fromISODate(iso)
  const dow = d.getDay() // 0..6 Sun..Sat
  const offset = weekStart === 'monday' ? (dow + 6) % 7 : dow
  const start = addDays(iso, -offset)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

/** Grid of ISO dates (rows of 7) covering the month of `iso`, padded to weeks. */
export function monthGrid(year: number, month: number, weekStart: 'monday' | 'sunday'): string[] {
  const first = new Date(year, month, 1)
  const firstDow = first.getDay()
  const lead = weekStart === 'monday' ? (firstDow + 6) % 7 : firstDow
  const gridStart = new Date(year, month, 1 - lead)
  const cells: string[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    cells.push(toISODate(d))
  }
  // Trim trailing all-next-month week if unused
  while (cells.length > 35 && fromISODate(cells[cells.length - 7]).getMonth() !== month) {
    cells.length -= 7
  }
  return cells
}

export function weekdayHeaders(weekStart: 'monday' | 'sunday'): string[] {
  const base = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  return weekStart === 'monday' ? [...base.slice(1), base[0]] : base
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
