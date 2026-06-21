import type {
  Exercise,
  ProgressionRule,
  Routine,
  RoutineExercise,
  Settings,
  WeeklySchedule,
} from './types'

export const uid = () =>
  (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`)

// Bundled demo images (start/end frames) from the public-domain free-exercise-db,
// stored locally under /public/exercises/<slug>/ so they work fully offline.
const img = (slug: string) => [`/exercises/${slug}/0.jpg`, `/exercises/${slug}/1.jpg`]

// ----- Progression rule presets -----
const linear = (increment: number): ProgressionRule => ({
  type: 'linear',
  incrementWeight: increment,
  deloadPercent: 10,
  failureThreshold: 2,
})

const double = (min: number, max: number, increment: number): ProgressionRule => ({
  type: 'double',
  incrementWeight: increment,
  repRangeMin: min,
  repRangeMax: max,
  deloadPercent: 10,
  failureThreshold: 2,
})

const manual: ProgressionRule = {
  type: 'manual',
  incrementWeight: 0,
  deloadPercent: 10,
  failureThreshold: 2,
}

// ============================================================
// Exercise catalog — tuned for Marc's home gym:
//   • Speediance GymMonster 2  → modeled as `cable` (dual digital resistance)
//   • Adjustable bench + loadable bench-press bar → `barbell`
//   • Dumbbells 5–35 lb        → `dumbbell`
//   • Resistance bands         → `band`
//   • Floor / bodyweight       → `bodyweight`
// Each exercise carries two bundled demo photos (start/end) via img().
// ============================================================
export const SEED_EXERCISES: Exercise[] = [
  // ---------- PUSH: chest / shoulders / triceps ----------
  {
    id: 'ex_cable_chest_press',
    name: 'Cable Chest Press',
    primaryMuscle: 'chest',
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: 'cable',
    category: 'compound',
    images: img('Standing_Cable_Chest_Press'),
    instructions: [
      'Set the GymMonster handles to chest height; stand in a split stance, core braced.',
      'Press both handles forward until the arms are extended, hands meeting in front.',
      'Squeeze the chest at the end of the press.',
      'Return under control to a stretch without letting the cables yank you back.',
    ],
  },
  {
    id: 'ex_bench',
    name: 'Barbell Bench Press',
    primaryMuscle: 'chest',
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: 'barbell',
    category: 'compound',
    images: img('Barbell_Bench_Press_-_Medium_Grip'),
    instructions: [
      'Lie flat on the bench, eyes under the bar, feet planted, slight arch in the lower back.',
      'Grip slightly wider than shoulder width; unrack and hold over the chest.',
      'Lower the bar to mid-chest with elbows ~45°, touching lightly.',
      'Press back up and slightly back, locking out over the shoulders.',
    ],
  },
  {
    id: 'ex_cable_fly',
    name: 'Cable Crossover Fly',
    primaryMuscle: 'chest',
    secondaryMuscles: ['shoulders'],
    equipment: 'cable',
    category: 'isolation',
    images: img('Cable_Fly_GM'),
    instructions: [
      'Set both GymMonster cables high; take a handle in each hand, slight forward lean.',
      'With a soft elbow bend, sweep the handles down and together in front of you.',
      'Squeeze the chest at the midpoint for a beat.',
      'Return slowly until you feel a stretch across the chest.',
    ],
  },
  {
    id: 'ex_incline_db',
    name: 'Incline DB Press',
    primaryMuscle: 'chest',
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: 'dumbbell',
    category: 'compound',
    images: img('Incline_Dumbbell_Press'),
    instructions: [
      'Set the bench to ~30°. Sit back with a dumbbell in each hand at shoulder level.',
      'Press the dumbbells up and slightly together until the arms are extended.',
      'Lower under control to the sides of the upper chest.',
      'Keep wrists stacked over elbows throughout.',
    ],
  },
  {
    id: 'ex_shoulder_press',
    name: 'DB Shoulder Press',
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['triceps'],
    equipment: 'dumbbell',
    category: 'compound',
    images: img('Dumbbell_Shoulder_Press'),
    instructions: [
      'Sit tall on the upright bench, dumbbells at shoulder height, palms forward.',
      'Brace the core and press overhead until the arms lock out.',
      'Avoid flaring the ribs; keep the path slightly back over the head.',
      'Lower under control to the start.',
    ],
  },
  {
    id: 'ex_cable_lateral',
    name: 'Cable Lateral Raise',
    primaryMuscle: 'shoulders',
    secondaryMuscles: [],
    equipment: 'cable',
    category: 'isolation',
    images: img('Cable_Seated_Lateral_Raise'),
    instructions: [
      'Set a GymMonster cable low; grab the handle with the opposite hand across the body.',
      'Raise the arm out to the side up to shoulder height, leading with the elbow.',
      'Pause briefly at the top.',
      'Lower slowly under cable tension; avoid swinging.',
    ],
  },
  {
    id: 'ex_lateral_raise',
    name: 'DB Lateral Raise',
    primaryMuscle: 'shoulders',
    secondaryMuscles: [],
    equipment: 'dumbbell',
    category: 'isolation',
    images: img('Side_Lateral_Raise'),
    instructions: [
      'Stand with a dumbbell in each hand, slight bend in the elbows.',
      'Raise the arms out to the sides to shoulder height, leading with the elbows.',
      'Pause briefly — pinkies slightly higher than thumbs.',
      'Lower slowly; avoid using momentum.',
    ],
  },
  {
    id: 'ex_tricep_pushdown',
    name: 'Cable Tricep Pushdown',
    primaryMuscle: 'triceps',
    secondaryMuscles: [],
    equipment: 'cable',
    category: 'isolation',
    images: img('Triceps_Pushdown'),
    instructions: [
      'Set a GymMonster cable high with a bar or rope, elbows tucked at your sides.',
      'Extend the elbows fully, driving the attachment down.',
      'Squeeze the triceps at lockout.',
      'Return under control without letting the elbows drift forward.',
    ],
  },
  {
    id: 'ex_oh_tricep',
    name: 'Overhead Tricep Ext',
    primaryMuscle: 'triceps',
    secondaryMuscles: [],
    equipment: 'cable',
    category: 'isolation',
    images: img('Cable_Rope_Overhead_Triceps_Extension'),
    instructions: [
      'Face away from a low GymMonster cable with a rope, elbows up beside the head.',
      'Extend the elbows overhead until the arms are straight.',
      'Squeeze the triceps at the top.',
      'Lower under control to a deep stretch behind the head.',
    ],
  },

  // ---------- PULL: back / biceps / rear delts ----------
  {
    id: 'ex_lat_pulldown',
    name: 'Cable Lat Pulldown',
    primaryMuscle: 'back',
    secondaryMuscles: ['biceps'],
    equipment: 'cable',
    category: 'compound',
    images: img('Wide-Grip_Lat_Pulldown'),
    instructions: [
      'Set the GymMonster cable high with a bar; grip wider than shoulders, sit anchored.',
      'Pull the bar to the upper chest, driving the elbows down and back.',
      'Squeeze the lats at the bottom.',
      'Return to a full stretch under control.',
    ],
  },
  {
    id: 'ex_cable_row',
    name: 'Seated Cable Row',
    primaryMuscle: 'back',
    secondaryMuscles: ['biceps'],
    equipment: 'cable',
    category: 'compound',
    images: img('Seated_Cable_Rows'),
    instructions: [
      'Sit facing the GymMonster, low cable, knees soft, chest tall.',
      'Row the handle to the lower ribs, driving the elbows straight back.',
      'Squeeze the shoulder blades together.',
      'Extend the arms under control; keep the torso still.',
    ],
  },
  {
    id: 'ex_db_row',
    name: 'One-Arm DB Row',
    primaryMuscle: 'back',
    secondaryMuscles: ['biceps'],
    equipment: 'dumbbell',
    category: 'compound',
    images: img('One-Arm_Dumbbell_Row'),
    instructions: [
      'Brace a knee and hand on the bench, dumbbell hanging in the other hand.',
      'Row the dumbbell to the hip, driving the elbow back.',
      'Squeeze the lat at the top.',
      'Lower under control to a full stretch; keep the back flat.',
    ],
  },
  {
    id: 'ex_facepull',
    name: 'Cable Face Pull',
    primaryMuscle: 'back',
    secondaryMuscles: ['shoulders'],
    equipment: 'cable',
    category: 'isolation',
    images: img('Face_Pull'),
    instructions: [
      'Set a GymMonster cable at upper-chest height with a rope; palms facing in.',
      'Pull toward the face, splitting the rope and flaring the elbows high.',
      'Squeeze the rear delts and upper back.',
      'Return under control.',
    ],
  },
  {
    id: 'ex_cable_curl',
    name: 'Cable Bicep Curl',
    primaryMuscle: 'biceps',
    secondaryMuscles: [],
    equipment: 'cable',
    category: 'isolation',
    images: img('Standing_Biceps_Cable_Curl'),
    instructions: [
      'Stand facing a low GymMonster cable with a bar, elbows pinned at your sides.',
      'Curl the bar up while keeping the elbows fixed.',
      'Squeeze the biceps at the top.',
      'Lower slowly under cable tension to full extension.',
    ],
  },
  {
    id: 'ex_curl',
    name: 'DB Bicep Curl',
    primaryMuscle: 'biceps',
    secondaryMuscles: [],
    equipment: 'dumbbell',
    category: 'isolation',
    images: img('Dumbbell_Bicep_Curl'),
    instructions: [
      'Stand with a dumbbell in each hand, palms forward, elbows at your sides.',
      'Curl the weights up while keeping the elbows pinned.',
      'Squeeze the biceps at the top.',
      'Lower slowly to full extension.',
    ],
  },
  {
    id: 'ex_band_pull_apart',
    name: 'Band Pull-Apart',
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['back'],
    equipment: 'band',
    category: 'isolation',
    images: img('Band_Pull_Apart'),
    instructions: [
      'Hold a resistance band at shoulder height with arms extended in front.',
      'Pull the band apart, squeezing the shoulder blades together.',
      'Keep the arms straight and lead with the upper back.',
      'Return slowly, controlling the band back to the start.',
    ],
  },

  // ---------- LEGS: quads / hamstrings / glutes / calves ----------
  {
    id: 'ex_goblet_squat',
    name: 'Goblet Squat',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes', 'core'],
    equipment: 'dumbbell',
    category: 'compound',
    images: img('Goblet_Squat'),
    instructions: [
      'Hold one dumbbell vertically against the chest, feet shoulder-width.',
      'Brace the core and squat down between the knees, chest tall.',
      'Descend until the hips are at least parallel.',
      'Drive through mid-foot back to standing.',
    ],
  },
  {
    id: 'ex_squat',
    name: 'Barbell Back Squat',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings', 'core'],
    equipment: 'barbell',
    category: 'compound',
    images: img('Barbell_Squat'),
    instructions: [
      'Bar on the upper back, feet shoulder-width, toes slightly out.',
      'Brace the core and break at the hips and knees together.',
      'Descend until the hips are at least parallel, knees tracking over toes.',
      'Drive through mid-foot back to standing.',
    ],
  },
  {
    id: 'ex_rdl',
    name: 'Romanian Deadlift',
    primaryMuscle: 'hamstrings',
    secondaryMuscles: ['glutes', 'back'],
    equipment: 'barbell',
    category: 'compound',
    images: img('Romanian_Deadlift'),
    instructions: [
      'Hold the bar at hip height, soft knees, shoulders back.',
      'Hinge at the hips, pushing them back and sliding the bar down the thighs.',
      'Stop when you feel a strong hamstring stretch (bar around mid-shin).',
      'Drive the hips forward to stand tall; squeeze the glutes.',
    ],
  },
  {
    id: 'ex_split_squat',
    name: 'Bulgarian Split Squat',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: 'dumbbell',
    category: 'compound',
    images: img('Split_Squat_with_Dumbbells'),
    instructions: [
      'Rest the back foot on the bench, a dumbbell in each hand, front foot forward.',
      'Lower straight down until the front thigh is about parallel.',
      'Keep the front knee tracking over the foot, torso tall.',
      'Drive through the front heel to stand; finish all reps, then switch legs.',
    ],
  },
  {
    id: 'ex_lunge',
    name: 'DB Walking Lunge',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: 'dumbbell',
    category: 'compound',
    images: img('Dumbbell_Lunges'),
    instructions: [
      'Hold dumbbells at your sides, stand tall.',
      'Step forward and lower until both knees reach ~90°.',
      'Drive through the front heel to bring the back leg through.',
      'Alternate legs each step, keeping the torso upright.',
    ],
  },
  {
    id: 'ex_pull_through',
    name: 'Cable Pull-Through',
    primaryMuscle: 'glutes',
    secondaryMuscles: ['hamstrings', 'back'],
    equipment: 'cable',
    category: 'compound',
    images: img('Pull_Through'),
    instructions: [
      'Face away from a low GymMonster cable, rope between the legs, hinge at the hips.',
      'Let the hips drift back into a hamstring stretch, soft knees.',
      'Drive the hips forward to stand tall, squeezing the glutes hard.',
      'Control the return; keep the back flat throughout.',
    ],
  },
  {
    id: 'ex_calf_raise',
    name: 'Standing DB Calf Raise',
    primaryMuscle: 'calves',
    secondaryMuscles: [],
    equipment: 'dumbbell',
    category: 'isolation',
    images: img('Standing_Dumbbell_Calf_Raise'),
    instructions: [
      'Stand with the balls of the feet on a plate or step, a dumbbell in each hand.',
      'Rise as high as possible onto the toes.',
      'Pause and squeeze the calves at the top.',
      'Lower below level for a full stretch.',
    ],
  },

  // ---------- CORE / FLOOR ----------
  {
    id: 'ex_plank',
    name: 'Plank',
    primaryMuscle: 'core',
    secondaryMuscles: ['shoulders'],
    equipment: 'bodyweight',
    category: 'isolation',
    tracking: 'duration',
    images: img('Plank'),
    instructions: [
      'Forearms on the floor under the shoulders, body in a straight line.',
      'Brace the abs and squeeze the glutes; avoid letting the hips sag.',
      'Breathe steadily and hold for the target time, logging the seconds held.',
      'Keep the neck neutral, gaze just ahead of the hands.',
    ],
  },
  {
    id: 'ex_cable_crunch',
    name: 'Cable Crunch',
    primaryMuscle: 'core',
    secondaryMuscles: [],
    equipment: 'cable',
    category: 'isolation',
    images: img('Cable_Crunch'),
    instructions: [
      'Kneel facing a high GymMonster cable with a rope held by the head.',
      'Crunch down by flexing the spine, driving the elbows toward the thighs.',
      'Squeeze the abs hard at the bottom.',
      'Return under control, resisting the cable on the way up.',
    ],
  },
  {
    id: 'ex_leg_raise',
    name: 'Lying Leg Raise',
    primaryMuscle: 'core',
    secondaryMuscles: [],
    equipment: 'bodyweight',
    category: 'isolation',
    images: img('Flat_Bench_Lying_Leg_Raise'),
    instructions: [
      'Lie on the floor or bench, hands by the hips, legs extended.',
      'Keep the legs fairly straight and raise them to vertical.',
      'Lift the hips slightly at the top for full contraction.',
      'Lower slowly without letting the feet touch down.',
    ],
  },
]

// Helper to build a routine exercise from a catalog id
const rex = (
  exerciseId: string,
  order: number,
  sets: number,
  repsMin: number,
  repsMax: number,
  weight: number,
  rest: number,
  progression: ProgressionRule,
): RoutineExercise => ({
  id: uid(),
  exerciseId,
  order,
  targetSets: sets,
  targetRepsMin: repsMin,
  targetRepsMax: repsMax,
  targetWeight: weight,
  restSeconds: rest,
  progression,
})

// ----- Default routines (Push / Pull / Legs), GymMonster-first -----
export function buildSeedRoutines(): Routine[] {
  const push: Routine = {
    id: 'rt_push',
    name: 'Push Day',
    type: 'push',
    exercises: [
      rex('ex_cable_chest_press', 0, 4, 8, 10, 50, 120, double(8, 10, 5)),
      rex('ex_bench', 1, 3, 6, 8, 95, 150, linear(5)),
      rex('ex_shoulder_press', 2, 3, 8, 10, 25, 120, double(8, 10, 5)),
      rex('ex_cable_fly', 3, 3, 12, 15, 25, 75, double(12, 15, 5)),
      rex('ex_cable_lateral', 4, 3, 12, 15, 15, 60, double(12, 15, 5)),
      rex('ex_tricep_pushdown', 5, 3, 10, 12, 40, 60, double(10, 12, 5)),
    ],
  }

  const pull: Routine = {
    id: 'rt_pull',
    name: 'Pull Day',
    type: 'pull',
    exercises: [
      rex('ex_lat_pulldown', 0, 4, 8, 10, 70, 120, double(8, 10, 5)),
      rex('ex_cable_row', 1, 4, 8, 10, 70, 120, double(8, 10, 5)),
      rex('ex_db_row', 2, 3, 10, 12, 35, 90, double(10, 12, 5)),
      rex('ex_facepull', 3, 3, 15, 20, 30, 60, double(15, 20, 5)),
      rex('ex_cable_curl', 4, 3, 10, 12, 30, 60, double(10, 12, 5)),
      rex('ex_band_pull_apart', 5, 3, 15, 20, 0, 45, manual),
    ],
  }

  const legs: Routine = {
    id: 'rt_legs',
    name: 'Leg Day',
    type: 'legs',
    exercises: [
      rex('ex_goblet_squat', 0, 4, 8, 10, 35, 150, double(8, 10, 5)),
      rex('ex_rdl', 1, 3, 8, 10, 95, 150, linear(10)),
      rex('ex_split_squat', 2, 3, 10, 12, 25, 90, double(10, 12, 5)),
      rex('ex_pull_through', 3, 3, 12, 15, 50, 75, double(12, 15, 5)),
      rex('ex_calf_raise', 4, 4, 12, 15, 35, 60, double(12, 15, 5)),
      rex('ex_cable_crunch', 5, 3, 12, 15, 30, 60, double(12, 15, 5)),
    ],
  }

  return [push, pull, legs]
}

// ----- Default weekly schedule: Mon Push, Tue Pull, Wed Legs, Thu Push, Fri Pull, weekend rest -----
export function buildSeedSchedule(): WeeklySchedule {
  return {
    id: 'weekly',
    assignments: [
      { weekday: 0, routineId: null }, // Sun rest
      { weekday: 1, routineId: 'rt_push' },
      { weekday: 2, routineId: 'rt_pull' },
      { weekday: 3, routineId: 'rt_legs' },
      { weekday: 4, routineId: 'rt_push' },
      { weekday: 5, routineId: 'rt_pull' },
      { weekday: 6, routineId: null }, // Sat rest
    ],
  }
}

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  units: 'lbs',
  theme: 'dark',
  defaultRestSeconds: 90,
  weekStart: 'monday',
  autoRest: true,
  userName: 'Marc',
}
