import type { Equipment, Exercise, ExerciseCategory, MuscleGroup } from './types'

// Looks up exercise details (instructions + demo images) on demand from the
// public-domain free-exercise-db. Used for user-added exercises typed as free
// text. Images are remote CDN URLs (need a connection the first time).

const CATALOG_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'
const IMG_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

interface RawExercise {
  id: string
  name: string
  primaryMuscles?: string[]
  secondaryMuscles?: string[]
  equipment?: string | null
  mechanic?: string | null
  instructions?: string[]
  images?: string[]
}

let catalogPromise: Promise<RawExercise[]> | null = null

function loadCatalog(): Promise<RawExercise[]> {
  if (!catalogPromise) {
    catalogPromise = fetch(CATALOG_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`catalog ${r.status}`)
        return r.json()
      })
      .catch((e) => {
        catalogPromise = null // allow retry on next attempt
        throw e
      })
  }
  return catalogPromise
}

const MUSCLE_MAP: Record<string, MuscleGroup> = {
  chest: 'chest',
  lats: 'back',
  'middle back': 'back',
  'lower back': 'back',
  traps: 'back',
  neck: 'back',
  biceps: 'biceps',
  forearms: 'biceps',
  triceps: 'triceps',
  shoulders: 'shoulders',
  quadriceps: 'quads',
  hamstrings: 'hamstrings',
  glutes: 'glutes',
  adductors: 'glutes',
  abductors: 'glutes',
  calves: 'calves',
  abdominals: 'core',
}

const EQUIP_MAP: Record<string, Equipment> = {
  barbell: 'barbell',
  dumbbell: 'dumbbell',
  cable: 'cable',
  machine: 'machine',
  'body only': 'bodyweight',
  bands: 'band',
  kettlebells: 'dumbbell',
  'e-z curl bar': 'barbell',
  'medicine ball': 'other',
  'exercise ball': 'other',
  'foam roll': 'other',
  other: 'other',
}

const mapMuscle = (m?: string): MuscleGroup => (m && MUSCLE_MAP[m]) || 'core'
const mapEquip = (e?: string | null): Equipment => (e && EQUIP_MAP[e]) || 'other'

function score(name: string, q: string): number {
  const n = name.toLowerCase()
  if (n === q) return 100
  if (n.startsWith(q)) return 80
  if (n.includes(q)) return 60
  // token overlap
  const qt = q.split(/\s+/).filter(Boolean)
  const hits = qt.filter((t) => n.includes(t)).length
  return hits / Math.max(1, qt.length) * 40
}

export type FetchedDetails = Pick<
  Exercise,
  'instructions' | 'images' | 'primaryMuscle' | 'secondaryMuscles' | 'equipment' | 'category'
> & { matchedName: string }

/**
 * Find the best free-exercise-db match for a typed name and return its
 * instructions + remote image URLs + muscle/equipment. Returns null if nothing
 * reasonable matches.
 */
export async function fetchExerciseDetails(query: string): Promise<FetchedDetails | null> {
  const q = query.trim().toLowerCase()
  if (!q) return null
  const catalog = await loadCatalog()

  let best: RawExercise | null = null
  let bestScore = 0
  for (const ex of catalog) {
    let s = score(ex.name, q)
    if (ex.images && ex.images.length) s += 5 // prefer entries that have images
    if (s > bestScore) {
      bestScore = s
      best = ex
    }
  }
  if (!best || bestScore < 30) return null

  return {
    matchedName: best.name,
    instructions: best.instructions ?? [],
    images: (best.images ?? []).map((p) => IMG_BASE + p),
    primaryMuscle: mapMuscle(best.primaryMuscles?.[0]),
    secondaryMuscles: (best.secondaryMuscles ?? []).map(mapMuscle),
    equipment: mapEquip(best.equipment),
    category: (best.mechanic as ExerciseCategory) === 'compound' ? 'compound' : 'isolation',
  }
}
