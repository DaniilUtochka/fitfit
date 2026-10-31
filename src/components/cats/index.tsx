import { useEffect, useRef, useState } from 'react'
import { Confetti, Zzz, type ConfettiPiece } from './shared'
import { registry, type CatName } from './registry'
import type { CatProps } from './types'
import { catHaptic } from '../../lib/haptics'

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

// Дрейф кота при скролле: чем дальше кот от центра вьюпорта, тем сильнее
// смещение (clamped, rAF-троттлинг). reduced-motion и animated=false — выкл.
function useParallax(ref: React.RefObject<HTMLSpanElement | null>, factor: number, enabled: boolean): number {
  const [drift, setDrift] = useState(0)

  useEffect(() => {
    if (!factor || !enabled) return
    // jsdom (тесты) не реализует matchMedia — optional chaining на весь вызов
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return
    let raf = 0
    const update = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const delta = (window.innerHeight / 2 - (r.top + r.height / 2)) * factor
      const clamped = Math.max(-12, Math.min(12, delta))
      setDrift((prev) => (Math.abs(prev - clamped) < 0.5 ? prev : clamped))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ref, factor, enabled])

  return drift
}

export function CatArt({
  name,
  size = 96,
  animated = true,
  className,
  pop = false,
  parallax = 0,
  wiggle = false,
}: CatProps & { name: CatName }) {
  const cat = registry[name]
  const height = Math.round(size * cat.aspect)
  const [wiggling, setWiggling] = useState(false)
  const ref = useRef<HTMLSpanElement | null>(null)
  const drift = useParallax(ref, parallax, animated)
  const imgClasses = [animated ? cat.anim : undefined, pop && animated ? 'cat-pop' : undefined]
    .filter(Boolean)
    .join(' ')
  return (
    <span
      ref={ref}
      className={[className, wiggling ? 'cat-wiggle' : undefined].filter(Boolean).join(' ') || undefined}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: size,
        height,
        transform: drift ? `translateY(${Math.round(drift)}px)` : undefined,
        transition: 'transform 150ms ease-out',
      }}
      aria-hidden="true"
      onPointerDown={
        wiggle && animated
          ? () => {
              // перезапуск анимации, если прошлый wiggle ещё не закончился
              setWiggling(false)
              requestAnimationFrame(() => {
                setWiggling(true)
                catHaptic('tap')
              })
            }
          : undefined
      }
      onAnimationEnd={() => setWiggling(false)}
    >
      <img
        src={cat.src}
        alt=""
        draggable={false}
        width={size}
        height={height}
        style={{ display: 'block', width: '100%', height: '100%' }}
        className={imgClasses || undefined}
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
