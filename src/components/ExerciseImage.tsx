import { useState } from 'react'
import { Dumbbell, Maximize2 } from 'lucide-react'
import ImageLightbox from './ImageLightbox'

interface Props {
  images: string[]
  /** thumb = single cropped frame for cards; detail = both start/finish frames. */
  variant?: 'thumb' | 'detail'
  alt?: string
  className?: string
  /** Exercise name shown in the lightbox header; falls back to `alt`. */
  exerciseName?: string
  /** Disable the tap-to-expand lightbox affordance (defaults to enabled). */
  expandable?: boolean
}

/**
 * Renders bundled exercise demo photos (public-domain free-exercise-db).
 * `thumb` fills a small square (cover) with a flush accent edge-bar; `detail`
 * shows the start + finish frames side by side as a two-panel form demo with
 * a subtle auto-alternating emphasis between the two frames.
 * Tapping either variant opens a fullscreen lightbox to inspect form.
 */
export default function ExerciseImage({
  images,
  variant = 'thumb',
  alt = '',
  className,
  exerciseName,
  expandable = true,
}: Props) {
  const imgs = images ?? []
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const openLightbox = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    if (expandable) setLightboxOpen(true)
  }
  const lightbox =
    expandable && lightboxOpen ? (
      <ImageLightbox images={imgs} name={exerciseName || alt || 'Exercise'} onClose={() => setLightboxOpen(false)} />
    ) : null

  if (variant === 'detail') {
    const frames = imgs.length ? imgs.slice(0, 2) : ['']
    // Pad to two panels so the START/FINISH strip layout stays stable.
    while (frames.length < 2) frames.push(frames[0] ?? '')
    return (
      <div
        className={className}
        onClick={expandable ? openLightbox : undefined}
        onKeyDown={
          expandable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') openLightbox(e)
              }
            : undefined
        }
        role={expandable ? 'button' : undefined}
        tabIndex={expandable ? 0 : undefined}
        aria-label={expandable ? `expand ${alt || 'exercise'} photos` : undefined}
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          height: '100%',
          cursor: expandable ? 'pointer' : undefined,
        }}
      >
        <style>{FORM_DEMO_KEYFRAMES}</style>
        {frames.map((src, i) => (
          <FormFrame
            key={i}
            src={src}
            alt={`${alt} ${i === 0 ? 'start' : 'finish'}`.trim()}
            caption={i === 0 ? 'Start' : 'Finish'}
            phase={i === 0 ? 'start' : 'finish'}
          />
        ))}
        {expandable && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 30,
              height: 30,
              borderRadius: 999,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text)',
              pointerEvents: 'none',
            }}
          >
            <Maximize2 size={14} />
          </div>
        )}
        {lightbox}
      </div>
    )
  }
  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%', cursor: expandable ? 'pointer' : undefined }}
      className={className}
      onClick={expandable ? openLightbox : undefined}
      onKeyDown={
        expandable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') openLightbox(e)
            }
          : undefined
      }
      role={expandable ? 'button' : undefined}
      tabIndex={expandable ? 0 : undefined}
      aria-label={expandable ? `expand ${alt || 'exercise'} photo` : undefined}
    >
      <Frame src={imgs[0] ?? ''} alt={alt} fit="cover" radius={10} />
      {/* accent edge-bar flush at the bottom of the thumbnail */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 3,
          background: 'var(--accent)',
          opacity: 0.65,
          borderBottomLeftRadius: 10,
          borderBottomRightRadius: 10,
        }}
      />
      {lightbox}
    </div>
  )
}

const FORM_DEMO_KEYFRAMES = `
@keyframes formDemoStart {
  0%, 45% { opacity: 1; }
  55%, 100% { opacity: 0.42; }
}
@keyframes formDemoFinish {
  0%, 45% { opacity: 0.42; }
  55%, 100% { opacity: 1; }
}`

function FormFrame({
  src,
  alt,
  caption,
  phase,
}: {
  src: string
  alt: string
  caption: string
  phase: 'start' | 'finish'
}) {
  const [failed, setFailed] = useState(false)
  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        minWidth: 0,
        background: 'var(--surface-2)',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: `${phase === 'start' ? 'formDemoStart' : 'formDemoFinish'} 2s ease-in-out infinite`,
      }}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <Dumbbell size={36} color="var(--muted)" />
      )}
      <span
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          padding: '3px 7px',
          borderRadius: 999,
          background: 'var(--accent)',
          color: 'var(--on-accent)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}
      >
        {caption}
      </span>
    </div>
  )
}

function Frame({
  src,
  alt,
  fit,
  radius = 12,
}: {
  src: string
  alt: string
  fit: 'cover' | 'contain'
  radius?: number
}) {
  const [failed, setFailed] = useState(false)
  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        minWidth: 0,
        background: 'var(--surface-2)',
        borderRadius: radius,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: fit, display: 'block' }}
        />
      ) : (
        <Dumbbell size={fit === 'cover' ? 20 : 36} color="var(--muted)" />
      )}
    </div>
  )
}
