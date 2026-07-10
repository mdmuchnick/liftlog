import { NavLink } from 'react-router-dom'
import { Home, Calendar, TrendingUp, User } from 'lucide-react'

const tabs = [
  { to: '/', label: 'Today', Icon: Home, end: true },
  { to: '/calendar', label: 'Calendar', Icon: Calendar, end: false },
  { to: '/progress', label: 'Progress', Icon: TrendingUp, end: false },
  { to: '/profile', label: 'Profile', Icon: User, end: false },
]

export default function TabBar() {
  return (
    <nav
      className="pb-safe"
      style={{
        flexShrink: 0,
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        zIndex: 40,
      }}
    >
      <div style={{ display: 'flex', maxWidth: 600, margin: '0 auto' }}>
        {tabs.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="tap"
            style={({ isActive }) => ({
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '9px 0 6px',
              textDecoration: 'none',
              color: isActive ? 'var(--accent)' : 'var(--muted)',
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.75 : 2} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
