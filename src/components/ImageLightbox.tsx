import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Dumbbell, ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  images: string[]
  name: string
  onClose: () => void
}

/**
 * Fullscreen portal lightbox for inspecting exercise form photos.
 * Shows one frame (START/FINISH) at a time via a segmented toggle, with
 * swipe/arrow support and both frames preloaded.
 */
export default function ImageLightbox({ images, name, onClose }: Props) {
  const frames = (images ?? []).slice(0, 2)
  while (frames.length < 2) frames.push(frames[0] ?? '')
  const hasTwo = frames[0] !== frames[1] && !!frames[1]

  const [phase, setPhase] = useState<0 | 1>(0)
  const closeRef = useRef<HTMLButtonElement>(null)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setPhase(0)
      if (e.key === 'ArrowRight') setPhase(hasTwo ? 1 : 0)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose, hasTwo])

  // Preload both frames.
  useEffect(() => {
    frames.forEach((src) => {
      if (!src) return
      const img = new Image()
      img.src = src
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || !hasTwo) return
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current
    if (Math.abs(dx) > 40) {
      if (dx < 0) setPhase(1)
      else setPhase(0)
    }
    touchStartX.current = null
  }

  const src = frames[phase]

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${name} form photos`}
      onClick={onClose}
      className="liftlog-lightbox-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'color-mix(in srgb, var(--bg) 96%, transparent)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        .liftlog-lightbox-backdrop {
          animation: liftlog-lightbox-fade 0.15s ease-out;
        }
        @keyframes liftlog-lightbox-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .liftlog-lightbox-backdrop { animation: none !important; }
        }
      `}</style>

      {/* Header */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 14px 8px',
          flexShrink: 0,
        }}
      >
        <div className="disp" style={{ fontSize: 18, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </div>
        <button
          ref={closeRef}
          onClick={onClose}
          className="tap"
          aria-label="close"
          style={{
            width: 44,
            height: 44,
            flexShrink: 0,
            borderRadius: 999,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text)',
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Image stage */}
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          minHeight: 0,
          padding: '0 8px',
        }}
      >
        {hasTwo && (
          <button
            onClick={() => setPhase(0)}
            className="tap"
            aria-label="previous frame"
            style={{
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: phase === 0 ? 'var(--muted)' : 'var(--text)',
              opacity: phase === 0 ? 0.4 : 1,
            }}
            disabled={phase === 0}
          >
            <ChevronLeft size={20} />
          </button>
        )}

        <div
          style={{
            flex: 1,
            height: '100%',
            maxWidth: '90vw',
            maxHeight: '70vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {src ? (
            <img
              src={src}
              alt={`${name} ${phase === 0 ? 'start' : 'finish'}`}
              style={{
                maxWidth: '90vw',
                maxHeight: '70vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: 12,
                background: 'var(--surface-2)',
              }}
            />
          ) : (
            <div
              style={{
                width: '80vw',
                maxWidth: 420,
                height: '50vh',
                maxHeight: 420,
                borderRadius: 12,
                background: 'var(--surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Dumbbell size={48} color="var(--muted)" />
            </div>
          )}
        </div>

        {hasTwo && (
          <button
            onClick={() => setPhase(1)}
            className="tap"
            aria-label="next frame"
            style={{
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: phase === 1 ? 'var(--muted)' : 'var(--text)',
              opacity: phase === 1 ? 0.4 : 1,
            }}
            disabled={phase === 1}
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* Segmented START | FINISH toggle */}
      {hasTwo && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '10px 14px calc(env(safe-area-inset-bottom, 0px) + 18px)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              padding: 4,
              borderRadius: 999,
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
            }}
          >
            {(['Start', 'Finish'] as const).map((label, i) => (
              <button
                key={label}
                onClick={() => setPhase(i as 0 | 1)}
                className="tap"
                style={{
                  minWidth: 84,
                  height: 40,
                  padding: '0 16px',
                  borderRadius: 999,
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  background: phase === i ? 'var(--accent)' : 'transparent',
                  color: phase === i ? 'var(--on-accent)' : 'var(--muted)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}
