# LiftLog — Personal Workout Tracker

A mobile-first, offline-capable PWA for planning, performing, and tracking
strength workouts, with an automatic progressive-overload engine. Built per the
attached PRD (Phases 0–4).

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into /dist
npm run preview  # serve the production build (PWA/service worker active)
```

## Install on your iPhone

1. Run `npm run dev -- --host` (or deploy `/dist` to Netlify/Vercel) so your
   phone can reach it on the same network / a public URL.
2. Open the URL in **Safari** → Share → **Add to Home Screen**.
3. Launch from the home-screen icon: full-screen, standalone, works offline.

> The service worker is only active in a production build (`build`/`preview`) or
> on a deployed host — not in `npm run dev`.

## What's built

- **Today** — auto-resolves the scheduled routine, set check-off, live timer +
  volume, progress ring, pinned Complete button, ad-hoc/rest empty state,
  in-app **History**.
- **Exercise Detail** — owned SVG technique diagram, instruction steps, target
  muscles/equipment, per-set logging with steppers, rest timer (survives
  backgrounding), recent history.
- **Calendar** — month grid with type-dots + legend, week strip, tap a day to
  view/assign its routine.
- **Progress** — Workouts / Volume / Total Time / Avg cards (week/month/all),
  exercise top-set chart with picker, bodyweight chart + logging, streak.
- **Routines** — full editor: name, type, add/remove/reorder exercises,
  per-exercise targets, rest, and progression config.
- **Progressive Overload Engine** — linear (auto-deload), double progression,
  and manual; runs on Finish and writes next targets back to the routine, with
  a "Next time" summary.
- **Profile** — 3 themes (Dark/Light/Minimal), units (lbs/kg), default rest,
  week start, weekly schedule editor, JSON export/import, reset.

## Stack

React + TypeScript (Vite) · Tailwind (CSS-variable theming) · IndexedDB via
Dexie · Recharts · React Router · vite-plugin-pwa · lucide-react. Data is
**local-first** — everything is stored on-device in IndexedDB.

## Structure

```
src/
  components/   ExerciseCard, ProgressRing, Stepper, RestTimer, TabBar,
                Segmented, Screen, ExerciseImage (photo demos), ProgressionSummary
  screens/      Today, ExerciseDetail, CalendarScreen, DayDetail, Progress,
                RoutineEditor, Profile
  data/         db (Dexie schema + seed), repo (operations), hooks (live
                queries), seed (exercise library + default routines), types
  engine/       progression (linear / double / manual)
  lib/          date, metrics, ui helpers
```

Backup/restore lives under **Profile → Data & Backup** (JSON export/import) for
device migration.

## Exercise images / credits

Each exercise shows two bundled demo photos (start + finish position) from the
[free-exercise-db](https://github.com/yuhonas/free-exercise-db), released under
**The Unlicense (public domain)**. The 36 images live in `public/exercises/<slug>/`
so they work fully offline. To add or swap an exercise, drop its two frames in a
new folder there and point the seed entry's `images: [...]` at them.
