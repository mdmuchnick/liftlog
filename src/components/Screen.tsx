import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface Props {
  title?: string
  subtitle?: string
  right?: React.ReactNode
  back?: boolean
  children: React.ReactNode
  noPadBottom?: boolean
}

/** Standard screen shell with a safe-area-aware sticky header. */
export default function Screen({ title, subtitle, right, back, children, noPadBottom }: Props) {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100%' }}>
      {(title || back) && (
        <header
          className="pt-safe"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            background: 'var(--bg)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 16px',
              maxWidth: 600,
              margin: '0 auto',
            }}
          >
            {back && (
              <button
                onClick={() => navigate(-1)}
                className="tap"
                aria-label="back"
                style={{
                  width: 36,
                  height: 36,
                  minWidth: 36,
                  marginLeft: -6,
                  borderRadius: 999,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronLeft size={26} />
              </button>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              {title && (
                <h1 className="disp" style={{ margin: 0, fontSize: 28 }}>{title}</h1>
              )}
              {subtitle && (
                <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>{subtitle}</div>
              )}
            </div>
            {right}
          </div>
        </header>
      )}
      <main
        style={{
          maxWidth: 600,
          margin: '0 auto',
          padding: `16px 16px ${noPadBottom ? 16 : 28}px`,
        }}
      >
        {children}
      </main>
    </div>
  )
}
