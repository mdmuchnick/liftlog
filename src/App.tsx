import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import TabBar from './components/TabBar'
import Today from './screens/Today'
import ExerciseDetail from './screens/ExerciseDetail'
import CalendarScreen from './screens/CalendarScreen'
import DayDetail from './screens/DayDetail'
import Progress from './screens/Progress'
import Profile from './screens/Profile'
import RoutineEditor from './screens/RoutineEditor'
import WorkoutSummary from './screens/WorkoutSummary'
import { ensureSeeded, runMigrations } from './data/db'
import { useSettings } from './data/hooks'

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const settings = useSettings()
  useEffect(() => {
    const theme = settings?.theme ?? 'dark'
    document.documentElement.setAttribute('data-theme', theme)
    const meta = document.querySelector('meta[name="theme-color"]')
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
    if (meta && bg) meta.setAttribute('content', bg)
  }, [settings?.theme])
  return <>{children}</>
}

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ensureSeeded()
      .then(runMigrations)
      .then(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted)',
        }}
      >
        Loading…
      </div>
    )
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="app-shell">
          <div className="app-scroll" id="app-scroll">
            <Routes>
              <Route path="/" element={<Today />} />
              <Route path="/exercise/:date/:rexId" element={<ExerciseDetail />} />
              <Route path="/calendar" element={<CalendarScreen />} />
              <Route path="/day/:date" element={<DayDetail />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/routine/:id" element={<RoutineEditor />} />
              <Route path="/summary/:date" element={<WorkoutSummary />} />
            </Routes>
          </div>
          <TabBar />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  )
}
