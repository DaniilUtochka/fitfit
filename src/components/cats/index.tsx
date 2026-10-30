import { Confetti, Zzz, type ConfettiPiece } from './shared'
import { registry, type CatName } from './registry'
import type { CatProps } from './types'

export type { CatProps } from './types'
export type { CatName } from './registry'
export { catAspect } from './registry'

// Конфетти в пространстве оверлея 200×200, кот в центре.
const CONFETTI: ConfettiPiece[] = [
  { x: 30, y: 42, color: '#f5b73e', kind: 'star' },
  { x: 162, y: 26, color: '#c93468', delay: 0.2 },
  { x: 14, y: 112, color: '#6aaef5', delay: 0.35 },
  { x: 176, y: 96, color: '#57c896', kind: 'star', delay: 0.5 },
  { x: 44, y: 10, color: '#57c896', delay: 0.65 },
  { x: 150, y: 62, color: '#f5b73e', delay: 0.8 },
  { x: 8, y: 70, color: '#c93468', kind: 'star', delay: 0.95 },
  { x: 186, y: 14, color: '#6aaef5', delay: 1.1 },
]

export function CatArt({ name, size = 96, animated = true, className }: CatProps & { name: CatName }) {
  const cat = registry[name]
  const height = Math.round(size * cat.aspect)
  return (
    <span
      className={className}
      style={{ position: 'relative', display: 'inline-block', width: size, height }}
      aria-hidden="true"
    >
      <img
        src={cat.src}
        alt=""
        draggable={false}
        width={size}
        height={height}
        style={{ display: 'block', width: '100%', height: '100%' }}
        className={animated ? cat.anim : undefined}
      />
      {animated && cat.overlay === 'zzz' && (
        <span style={{ position: 'absolute', top: -size * 0.06, right: -size * 0.08 }}>
          <Zzz animated />
        </span>
      )}
      {animated && cat.overlay === 'confetti' && (
        <span style={{ position: 'absolute', inset: -size * 0.2 }}>
          <Confetti pieces={CONFETTI} animated />
        </span>
      )}
    </span>
  )
}
