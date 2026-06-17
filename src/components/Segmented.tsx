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
        background: 'var(--surface-2)',
        borderRadius: 999,
        padding: 3,
        gap: 2,
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
              padding: size === 'sm' ? '6px 8px' : '9px 10px',
              minHeight: size === 'sm' ? 32 : 40,
              background: active ? 'var(--accent)' : 'transparent',
              color: active ? '#fff' : 'var(--muted)',
              fontWeight: 600,
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
