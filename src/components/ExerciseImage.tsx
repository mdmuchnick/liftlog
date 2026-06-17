import { useState } from 'react'
import { Dumbbell } from 'lucide-react'

interface Props {
  images: string[]
  /** thumb = single cropped frame for cards; detail = both start/end frames. */
  variant?: 'thumb' | 'detail'
  alt?: string
  className?: string
}

/**
 * Renders bundled exercise demo photos (public-domain free-exercise-db).
 * `thumb` fills a small square (cover); `detail` shows the start + end frames
 * side by side, like a two-panel technique diagram.
 */
export default function ExerciseImage({ images, variant = 'thumb', alt = '', className }: Props) {
  const imgs = images ?? []
  if (variant === 'detail') {
    const frames = imgs.length ? imgs : ['']
    return (
      <div className={className} style={{ display: 'flex', gap: 8, height: '100%' }}>
        {frames.slice(0, 2).map((src, i) => (
          <Frame key={i} src={src} alt={`${alt} ${i === 0 ? 'start' : 'finish'}`.trim()} fit="contain" />
        ))}
      </div>
    )
  }
  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <Frame src={imgs[0] ?? ''} alt={alt} fit="cover" radius={12} />
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
