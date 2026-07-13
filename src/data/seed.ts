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
// Exercise catalog — Plan v2 library, tuned for Marc's home gym and
// shoulder-friendly programming (Push & Hinge / Pull & Squat / Unilateral
// & Stabilizer split). The catalog JSON is the source of truth; this array
// mirrors it verbatim. Each exercise carries two bundled demo photos
// (start/end) under /public/exercises/<slug>/ via img().
//   • Speediance GymMonster 2  → modeled as `cable`
//   • Adjustable bench + loadable bar → `barbell`
//   • Dumbbells                → `dumbbell`
//   • Selectorized machines    → `machine`
//   • Resistance bands         → `band`
//   • Floor / bodyweight       → `bodyweight`
// ============================================================
export const SEED_EXERCISES: Exercise[] = [
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
      'Keep elbows tucked to roughly 45° from the torso to protect the shoulder joint.',
      'Press the dumbbells up and slightly together until the arms are extended.',
      'Lower under control to the sides of the upper chest, wrists stacked over elbows.',
    ],
  },
  {
    id: 'ex_db_scaption',
    name: 'Dumbbell Scaption Raise',
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['back'],
    equipment: 'dumbbell',
    category: 'isolation',
    images: img('Dumbbell_Scaption'),
    instructions: [
      'Stand tall, dumbbells at your sides, thumbs-up grip (neutral).',
      'Raise the arms diagonally in the scapular plane, about 30-45° in front of the body.',
      'Lift to shoulder height only — no higher, to keep the joint in a safe range.',
      'Lower slowly under control; avoid shrugging the traps.',
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
      'Keep a flat spine throughout; stop when you feel a strong hamstring stretch (bar around mid-shin).',
      'Drive the hips forward to stand tall; squeeze the glutes.',
    ],
  },
  {
    id: 'ex_cable_woodchop',
    name: 'Cable Woodchop',
    primaryMuscle: 'core',
    secondaryMuscles: ['shoulders'],
    equipment: 'cable',
    category: 'isolation',
    images: img('Standing_Cable_Wood_Chop'),
    instructions: [
      'Set a single handle at chest height; stand sideways to the cable, arms extended.',
      'Rotate through the core to pull the handle across the body at chest height.',
      'Keep the arms relatively straight and let the torso, not the shoulders, drive the motion.',
      'Return under control and repeat all reps, then switch sides.',
    ],
  },
  {
    id: 'ex_chest_supported_row',
    name: 'Chest-Supported Row',
    primaryMuscle: 'back',
    secondaryMuscles: ['biceps', 'shoulders'],
    equipment: 'dumbbell',
    category: 'compound',
    images: img('Dumbbell_Incline_Row'),
    instructions: [
      'Lie chest-down on an incline bench, a dumbbell in each hand hanging straight down.',
      'Keeping the chest pinned to the pad removes momentum and spares the lower back and shoulders.',
      'Row the dumbbells to the lower ribs, squeezing the shoulder blades together.',
      'Lower under control to a full stretch without the shoulders rounding forward.',
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
    id: 'ex_cable_ext_rotation',
    name: 'Standing Cable External Rotation',
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['back'],
    equipment: 'cable',
    category: 'isolation',
    images: img('External_Rotation_with_Cable'),
    instructions: [
      'Set the cable low; stand sideways, elbow pinned to the ribs at 90°, forearm across the body.',
      'Use light resistance — this targets the small infraspinatus/teres minor rotator-cuff muscles.',
      'Rotate the forearm outward away from the body, keeping the elbow glued to the side.',
      'Return slowly under tension; avoid letting the shoulder shrug or the elbow drift.',
    ],
  },
  {
    id: 'ex_db_reverse_lunge',
    name: 'Dumbbell Reverse Lunge',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: 'dumbbell',
    category: 'compound',
    images: img('Dumbbell_Rear_Lunge'),
    instructions: [
      'Hold a dumbbell in each hand at your sides, stand tall.',
      'Step backward with one leg, lowering until the front knee reaches ~90°.',
      'Drive through the front heel to return to standing.',
      'Keep the torso upright; alternate legs or complete all reps on one side first.',
    ],
  },
  {
    id: 'ex_cable_high_low_press',
    name: 'High-to-Low Cable Press',
    primaryMuscle: 'chest',
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: 'cable',
    category: 'compound',
    images: img('Incline_Cable_Chest_Press'),
    instructions: [
      'Set both pulleys high and take a handle in each hand, split stance for stability.',
      'Press forward and down toward the hips — this downward path is more shoulder-friendly than a horizontal press.',
      'Squeeze the chest at full extension without locking the elbows aggressively.',
      'Return slowly under cable tension to the start position.',
    ],
  },
  {
    id: 'ex_db_seated_ext_rotation',
    name: 'Seated Dumbbell External Rotation',
    primaryMuscle: 'shoulders',
    secondaryMuscles: [],
    equipment: 'dumbbell',
    category: 'isolation',
    images: img('External_Rotation'),
    instructions: [
      'Sit with a light dumbbell in one hand, elbow braced on the same-side knee at ~90°.',
      'Keep the elbow fixed and rotate the forearm upward and outward.',
      'Pause briefly at the top, feeling the rotator cuff engage, not the shoulder cap.',
      'Lower slowly under control; keep the weight light — this is a stability drill, not a strength lift.',
    ],
  },
  {
    id: 'ex_prone_superman',
    name: 'Prone Superman',
    primaryMuscle: 'back',
    secondaryMuscles: ['shoulders', 'glutes', 'core'],
    equipment: 'bodyweight',
    category: 'isolation',
    tracking: 'duration',
    images: img('Superman'),
    instructions: [
      'Lie face down, arms extended overhead in a wide Y position, legs straight.',
      'Gently lift the chest and arms off the floor while drawing the shoulder blades back and down.',
      'Keep the lift small and controlled — this is about scapular control, not height.',
      'Hold for 3 seconds at the top, then lower slowly.',
    ],
  },
  {
    id: 'ex_db_neutral_bench',
    name: 'Neutral-Grip DB Bench Press',
    primaryMuscle: 'chest',
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: 'dumbbell',
    category: 'compound',
    images: img('Dumbbell_Bench_Press_with_Neutral_Grip'),
    instructions: [
      'Lie on a flat bench, dumbbells held with palms facing each other (neutral grip).',
      'The neutral grip keeps the shoulders in a more natural rotation than a barbell.',
      'Press the dumbbells up until the arms are extended, without letting the elbows flare.',
      'Lower under control to chest level, feeling a light stretch.',
    ],
  },
  {
    id: 'ex_machine_chest_press',
    name: 'Machine Chest Press',
    primaryMuscle: 'chest',
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: 'machine',
    category: 'compound',
    images: img('Leverage_Chest_Press'),
    instructions: [
      'Adjust the seat so the handles line up with mid-chest.',
      'The fixed path removes shoulder instability, making this a safe press option.',
      'Press the handles forward until the arms are extended without locking out hard.',
      'Return slowly to the start, keeping the shoulder blades pinned to the pad.',
    ],
  },
  {
    id: 'ex_machine_shoulder_press',
    name: 'Machine Shoulder Press',
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['triceps'],
    equipment: 'machine',
    category: 'compound',
    images: img('Machine_Shoulder_Military_Press'),
    instructions: [
      'Sit with back flat against the pad, handles at shoulder height.',
      'The guided path reduces shoulder-joint stress compared to a free press.',
      'Press upward until the arms are extended, avoiding a full aggressive lockout.',
      'Lower under control back to shoulder height.',
    ],
  },
  {
    id: 'ex_arnold_press',
    name: 'Arnold Dumbbell Press',
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['triceps'],
    equipment: 'dumbbell',
    category: 'compound',
    images: img('Arnold_Dumbbell_Press'),
    instructions: [
      'Start seated with dumbbells in front of the shoulders, palms facing you.',
      'Press up while rotating the palms to face forward at the top.',
      'The rotation warms up the rotator cuff through a fuller range — keep it slow and controlled.',
      'Reverse the rotation on the way down to the start.',
    ],
  },
  {
    id: 'ex_pushup',
    name: 'Push-Up',
    primaryMuscle: 'chest',
    secondaryMuscles: ['shoulders', 'triceps', 'core'],
    equipment: 'bodyweight',
    category: 'compound',
    images: img('Pushups'),
    instructions: [
      'Hands slightly wider than shoulders, body in a straight line from head to heels.',
      'Keep elbows at ~45° from the torso, not flared to 90°, to protect the shoulders.',
      'Lower the chest toward the floor under control.',
      'Press back up, squeezing the chest at the top.',
    ],
  },
  {
    id: 'ex_barbell_rear_delt_row',
    name: 'Barbell Rear Delt Row',
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['back', 'biceps'],
    equipment: 'barbell',
    category: 'isolation',
    images: img('Barbell_Rear_Delt_Row'),
    instructions: [
      "Hinge forward at the hips with a flat back, bar hanging at arm's length.",
      'Pull the bar up toward the upper abdomen with elbows flared wide.',
      'Focus on squeezing the rear delts and upper back at the top.',
      'Lower under control without rounding the lower back.',
    ],
  },
  {
    id: 'ex_one_arm_lat_pulldown',
    name: 'One-Arm Lat Pulldown',
    primaryMuscle: 'back',
    secondaryMuscles: ['biceps'],
    equipment: 'cable',
    category: 'compound',
    images: img('One_Arm_Lat_Pulldown'),
    instructions: [
      'Grip a single handle attached to a high cable, seated or half-kneeling.',
      'Pull the handle down and back toward the hip, driving the elbow down.',
      'The single-arm path lets each shoulder move through its own natural groove.',
      'Return to a full stretch under control, then switch arms.',
    ],
  },
  {
    id: 'ex_barbell_curl',
    name: 'Barbell Curl',
    primaryMuscle: 'biceps',
    secondaryMuscles: [],
    equipment: 'barbell',
    category: 'isolation',
    images: img('Barbell_Curl'),
    instructions: [
      'Stand tall holding a barbell at a shoulder-width, underhand grip, elbows close to the torso.',
      'Keeping the upper arms stationary, curl the bar up by contracting the biceps.',
      'Continue until the biceps are fully contracted and the bar is at shoulder level.',
      'Lower slowly back to the start, keeping the elbows pinned to your sides.',
    ],
  },
  {
    id: 'ex_cable_curl',
    name: 'Cable Bicep Curl',
    primaryMuscle: 'biceps',
    secondaryMuscles: [],
    equipment: 'cable',
    category: 'isolation',
    images: img('Cable_Curl'),
    instructions: [
      'Stand facing a low pulley, gripping a straight bar at shoulder width, palms up, elbows close to the torso.',
      'Keeping the upper arms stationary, curl the bar up by contracting the biceps.',
      'Hold briefly at the top, squeezing the biceps, once the bar reaches shoulder level.',
      'Lower slowly back to the start under constant cable tension.',
    ],
  },
  {
    id: 'ex_cable_rear_delt_fly',
    name: 'Cable Rear Delt Fly',
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['back'],
    equipment: 'cable',
    category: 'isolation',
    images: img('Cable_Rear_Delt_Fly'),
    instructions: [
      'Set two cables at chest height, crossed, and grab the opposite handles.',
      'With a soft bend in the elbows, sweep the arms out and back.',
      'Squeeze the rear delts and upper back at the end range.',
      'Return slowly under control, resisting the cable pull.',
    ],
  },
  {
    id: 'ex_reverse_flyes',
    name: 'Dumbbell Reverse Fly',
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['back'],
    equipment: 'dumbbell',
    category: 'isolation',
    images: img('Reverse_Flyes'),
    instructions: [
      'Hinge forward at the hips, flat back, a light dumbbell in each hand.',
      'With a soft bend in the elbows, raise the arms out to the sides.',
      'Squeeze the shoulder blades together at the top — keep the weight light.',
      'Lower slowly under control back to the start.',
    ],
  },
  {
    id: 'ex_band_assisted_pullup',
    name: 'Band-Assisted Pull-Up',
    primaryMuscle: 'back',
    secondaryMuscles: ['biceps', 'core'],
    equipment: 'band',
    category: 'compound',
    images: img('Band_Assisted_Pull-Up'),
    instructions: [
      'Loop a resistance band over the pull-up bar and place a knee or foot in the loop.',
      'Grip the bar shoulder-width, palms facing away, shoulders set down and back.',
      'Pull up until the chin clears the bar, driving the elbows down.',
      'Lower under control to a full stretch at the bottom.',
    ],
  },
  {
    id: 'ex_good_morning',
    name: 'Good Morning',
    primaryMuscle: 'hamstrings',
    secondaryMuscles: ['glutes', 'core'],
    equipment: 'barbell',
    category: 'compound',
    images: img('Good_Morning'),
    instructions: [
      'Bar on the upper back as in a squat, feet shoulder-width, soft knees.',
      'Hinge at the hips, pushing them back while keeping the spine flat.',
      'Lower the torso until you feel a strong hamstring stretch.',
      'Drive the hips forward to return to standing.',
    ],
  },
  {
    id: 'ex_band_good_morning',
    name: 'Band Good Morning',
    primaryMuscle: 'hamstrings',
    secondaryMuscles: ['glutes', 'back'],
    equipment: 'band',
    category: 'compound',
    images: img('Band_Good_Morning'),
    instructions: [
      'Stand on the band with feet shoulder-width, loop over the shoulders/upper back.',
      'Hinge at the hips with a flat spine, pushing the hips back.',
      'Lower until you feel a hamstring stretch, keeping soft knees.',
      'Drive the hips forward to stand tall, squeezing the glutes.',
    ],
  },
  {
    id: 'ex_barbell_hip_thrust',
    name: 'Barbell Hip Thrust',
    primaryMuscle: 'glutes',
    secondaryMuscles: ['hamstrings'],
    equipment: 'barbell',
    category: 'compound',
    images: img('Barbell_Hip_Thrust'),
    instructions: [
      'Sit on the floor with upper back against a bench, bar across the hips (padded).',
      'Plant feet flat, knees bent; drive through the heels to lift the hips up.',
      'Squeeze the glutes hard at the top, ribs down, no lower-back arching.',
      'Lower under control back to the start.',
    ],
  },
  {
    id: 'ex_single_leg_glute_bridge',
    name: 'Single-Leg Glute Bridge',
    primaryMuscle: 'glutes',
    secondaryMuscles: ['hamstrings', 'core'],
    equipment: 'bodyweight',
    category: 'isolation',
    images: img('Single_Leg_Glute_Bridge'),
    instructions: [
      'Lie on your back, one foot planted, the other leg extended straight.',
      'Drive through the planted heel to lift the hips off the floor.',
      'Squeeze the glute at the top, keeping the hips level.',
      'Lower under control and repeat all reps, then switch legs.',
    ],
  },
  {
    id: 'ex_cable_deadlift',
    name: 'Cable Deadlift',
    primaryMuscle: 'hamstrings',
    secondaryMuscles: ['glutes', 'back'],
    equipment: 'cable',
    category: 'compound',
    images: img('Cable_Deadlifts'),
    instructions: [
      'Stand facing a low cable with a straight bar attachment, feet shoulder-width.',
      'Hinge at the hips and bend the knees slightly to grip the bar.',
      'Drive through the floor, extending the hips and knees to stand tall.',
      'The constant cable tension is easier on the shoulders/grip than a loaded barbell.',
    ],
  },
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
    id: 'ex_bodyweight_squat',
    name: 'Bodyweight Squat',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: 'bodyweight',
    category: 'compound',
    images: img('Bodyweight_Squat'),
    instructions: [
      'Stand with feet shoulder-width, arms extended forward for balance.',
      'Brace the core and squat down, hips back and knees tracking over toes.',
      'Descend until the hips are at least parallel to the knees.',
      'Drive through mid-foot back to standing — no shoulder loading at all.',
    ],
  },
  {
    id: 'ex_leg_press',
    name: 'Leg Press',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: 'machine',
    category: 'compound',
    images: img('Leg_Press'),
    instructions: [
      'Sit in the machine, feet shoulder-width on the platform, back flat against the pad.',
      'Lower the platform by bending the knees toward the chest under control.',
      'Descend until the knees reach about 90°, avoiding rounding the lower back.',
      'Press through mid-foot to extend the legs, without locking the knees hard.',
    ],
  },
  {
    id: 'ex_bodyweight_walking_lunge',
    name: 'Bodyweight Walking Lunge',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: 'bodyweight',
    category: 'compound',
    images: img('Bodyweight_Walking_Lunge'),
    instructions: [
      'Stand tall, hands on hips or extended for balance.',
      'Step forward and lower until both knees reach about 90°.',
      'Drive through the front heel to bring the back leg through into the next step.',
      'Keep the torso upright throughout, no external load.',
    ],
  },
  {
    id: 'ex_db_step_up',
    name: 'Dumbbell Step-Up',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: 'dumbbell',
    category: 'compound',
    images: img('Dumbbell_Step_Ups'),
    instructions: [
      'Hold a dumbbell in each hand, stand facing a sturdy bench or box.',
      'Step up fully onto the box, driving through the lead heel.',
      'Stand tall at the top without leaning on the trail leg.',
      'Step back down under control and repeat, then switch lead legs.',
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
  {
    id: 'ex_band_ext_rotation',
    name: 'Band External Rotation',
    primaryMuscle: 'shoulders',
    secondaryMuscles: [],
    equipment: 'band',
    category: 'isolation',
    images: img('External_Rotation_with_Band'),
    instructions: [
      'Anchor a light band at elbow height, elbow pinned to the ribs at 90°.',
      'Keeping the elbow fixed, rotate the forearm outward away from the body.',
      'This isolates the rotator cuff — keep resistance light and reps controlled.',
      'Return slowly under tension to the start.',
    ],
  },
  {
    id: 'ex_reverse_fly_ext_rotation',
    name: 'Reverse Fly with External Rotation',
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['back'],
    equipment: 'dumbbell',
    category: 'isolation',
    images: img('Reverse_Flyes_With_External_Rotation'),
    instructions: [
      'Hinge forward with a flat back, light dumbbells in each hand, elbows bent 90°.',
      'Raise the elbows out to the sides (reverse fly), then rotate the forearms up toward the ceiling.',
      'This combo hits the rear delts and rotator cuff in one controlled movement.',
      'Reverse the sequence slowly back to the start.',
    ],
  },
  {
    id: 'ex_cuban_press',
    name: 'Cuban Press',
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['back'],
    equipment: 'dumbbell',
    category: 'isolation',
    images: img('Cuban_Press'),
    instructions: [
      'Start with light dumbbells at your sides, then curl up to the upright-row position.',
      'Rotate the arms so the elbows stay high and the forearms point forward (external rotation).',
      'Press overhead from that position, then reverse the whole sequence.',
      'Keep the weight light — this is a rotator-cuff and shoulder-health warm-up movement.',
    ],
  },
  {
    id: 'ex_seated_rear_delt_raise',
    name: 'Seated Bent-Over Rear Delt Raise',
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['back'],
    equipment: 'dumbbell',
    category: 'isolation',
    images: img('Seated_Bent-Over_Rear_Delt_Raise'),
    instructions: [
      'Sit on the edge of a bench, hinge forward so the chest nears the thighs.',
      'With a soft elbow bend, raise light dumbbells out to the sides.',
      'The seated, supported position removes momentum and spares the lower back.',
      'Squeeze the rear delts at the top, then lower slowly.',
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
      'Kneel facing a high cable with a rope held by the head.',
      'Crunch down by flexing the spine, driving the elbows toward the thighs.',
      'Squeeze the abs hard at the bottom.',
      'Return under control, resisting the cable on the way up.',
    ],
  },
  {
    id: 'ex_dead_bug',
    name: 'Dead Bug',
    primaryMuscle: 'core',
    secondaryMuscles: [],
    equipment: 'bodyweight',
    category: 'isolation',
    images: img('Dead_Bug'),
    instructions: [
      'Lie on your back, arms reaching straight up, knees bent 90° over the hips.',
      'Press the lower back flat into the floor and brace the core.',
      'Slowly lower one arm overhead and the opposite leg toward the floor.',
      'Return to center and switch sides, keeping the lower back pinned down throughout.',
    ],
  },
  {
    id: 'ex_pallof_press',
    name: 'Pallof Press',
    primaryMuscle: 'core',
    secondaryMuscles: ['shoulders'],
    equipment: 'cable',
    category: 'isolation',
    images: img('Pallof_Press'),
    instructions: [
      'Stand sideways to a cable set at chest height, handle held at the sternum.',
      'Brace the core and press the handle straight out in front of you.',
      "Resist the cable's pull to rotate you — that anti-rotation tension is the exercise.",
      'Hold briefly, then return the handle to the chest under control.',
    ],
  },
  {
    id: 'ex_side_bridge',
    name: 'Side Bridge',
    primaryMuscle: 'core',
    secondaryMuscles: ['shoulders'],
    equipment: 'bodyweight',
    category: 'isolation',
    tracking: 'duration',
    images: img('Side_Bridge'),
    instructions: [
      'Lie on your side, propped on the forearm, elbow stacked under the shoulder.',
      'Lift the hips so the body forms a straight line from ankles to head.',
      'Keep the supporting shoulder packed down, not shrugged toward the ear.',
      'Hold for the target time, then switch sides.',
    ],
  },
  {
    id: 'ex_db_side_bend',
    name: 'Dumbbell Side Bend',
    primaryMuscle: 'core',
    secondaryMuscles: [],
    equipment: 'dumbbell',
    category: 'isolation',
    images: img('Dumbbell_Side_Bend'),
    instructions: [
      'Stand tall holding one light dumbbell at your side.',
      'Bend directly sideways at the waist, lowering the dumbbell toward the knee.',
      'Keep the torso facing forward — no twisting.',
      'Return to upright, squeezing the oblique on the working side.',
    ],
  },
]

// Helper to build a routine exercise from a catalog id. Ids are stable
// (`re_<exerciseId>`) since no exercise repeats across the seed routines.
const rex = (
  exerciseId: string,
  order: number,
  sets: number,
  repsMin: number,
  repsMax: number,
  weight: number,
  rest: number,
  progression: ProgressionRule,
  opts?: { duration?: number; notes?: string },
): RoutineExercise => ({
  id: `re_${exerciseId}`,
  exerciseId,
  order,
  targetSets: sets,
  targetRepsMin: repsMin,
  targetRepsMax: repsMax,
  targetWeight: weight,
  ...(opts?.duration !== undefined ? { targetDuration: opts.duration } : {}),
  restSeconds: rest,
  progression,
  ...(opts?.notes ? { notes: opts.notes } : {}),
})

// Stable id of the Push & Hinge routine — used by the PLAN_V2 migration guard.
export const PUSH_ROUTINE_ID = 'rt_push_hinge'

// ----- Plan v2 routines: Push & Hinge / Pull & Squat / Unilateral & Stabilizer -----
// Barbell compounds progress linearly (+5 lb); dumbbell/cable work uses double
// progression (+2.5 lb once the top of the rep range is hit); bodyweight holds
// are logged manually.
export function buildSeedRoutines(): Routine[] {
  const pushHinge: Routine = {
    id: PUSH_ROUTINE_ID,
    name: 'Push & Hinge',
    type: 'push',
    exercises: [
      rex('ex_incline_db', 0, 3, 8, 10, 25, 120, double(8, 10, 2.5), {
        notes: '30° incline; elbows tucked ~45°',
      }),
      rex('ex_db_scaption', 1, 3, 12, 12, 10, 90, double(12, 12, 2.5), {
        notes: 'thumbs-up grip, scapular plane',
      }),
      rex('ex_rdl', 2, 3, 10, 10, 75, 120, linear(5)),
      rex('ex_cable_woodchop', 3, 2, 12, 12, 20, 90, double(12, 12, 2.5), {
        notes: 'per side',
      }),
    ],
  }

  const pullSquat: Routine = {
    id: 'rt_pull_squat',
    name: 'Pull & Squat',
    type: 'pull',
    exercises: [
      rex('ex_chest_supported_row', 0, 3, 10, 10, 25, 90, double(10, 10, 2.5), {
        notes: 'chest pinned to pad',
      }),
      rex('ex_squat', 1, 3, 10, 10, 85, 120, linear(5), { notes: 'brace core' }),
      rex('ex_cable_ext_rotation', 2, 3, 12, 12, 10, 90, double(12, 12, 2.5), {
        notes: 'light resistance, 2 warm-up reps first',
      }),
    ],
  }

  const unilateral: Routine = {
    id: 'rt_unilateral',
    name: 'Unilateral & Stabilizer',
    type: 'custom',
    exercises: [
      rex('ex_db_reverse_lunge', 0, 3, 10, 10, 20, 90, double(10, 10, 2.5), {
        notes: 'per leg',
      }),
      rex('ex_cable_high_low_press', 1, 3, 10, 10, 30, 90, double(10, 10, 2.5), {
        notes: 'pulleys high, press forward/down',
      }),
      rex('ex_db_seated_ext_rotation', 2, 3, 12, 12, 5, 60, double(12, 12, 2.5), {
        notes: 'elbow on knee at 90°',
      }),
      rex('ex_prone_superman', 3, 2, 10, 10, 0, 60, manual, {
        duration: 3,
        notes: 'wide-Y arms, 3s holds',
      }),
    ],
  }

  return [pushHinge, pullSquat, unilateral]
}

// ----- Weekly schedule: Mon Push & Hinge, Thu Pull & Squat, Sat Unilateral, rest otherwise -----
export function buildSeedSchedule(): WeeklySchedule {
  return {
    id: 'weekly',
    assignments: [
      { weekday: 0, routineId: null }, // Sun rest
      { weekday: 1, routineId: PUSH_ROUTINE_ID }, // Mon Push & Hinge
      { weekday: 2, routineId: null }, // Tue rest
      { weekday: 3, routineId: null }, // Wed rest
      { weekday: 4, routineId: 'rt_pull_squat' }, // Thu Pull & Squat
      { weekday: 5, routineId: null }, // Fri rest
      { weekday: 6, routineId: 'rt_unilateral' }, // Sat Unilateral & Stabilizer
    ],
  }
}

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  units: 'lbs',
  theme: 'volt',
  defaultRestSeconds: 90,
  weekStart: 'monday',
  autoRest: true,
  userName: 'Marc',
}
