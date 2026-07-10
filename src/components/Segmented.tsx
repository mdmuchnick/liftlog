interface Option<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (v: T) => void
  size?: 'sm' | 'md'
}

export default function Segmented<T extends string>({ options, value, onChange, size = 'md' }: Props<T>) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
      }}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            className="tap"
            onClick={() => onChange(o.value)}
            style={{
              flex: 1,
              border: 'none',
              borderRadius: 999,
              padding: size === 'sm' ? '6px 12px' : '9px 16px',
              minHeight: size === 'sm' ? 32 : 40,
              background: active ? 'var(--accent)' : 'var(--surface-2)',
              color: active ? 'var(--on-accent)' : 'var(--muted)',
              fontWeight: 700,
              fontSize: size === 'sm' ? 12 : 13,
              whiteSpace: 'nowrap',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
