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

// След за пальцем/мышью: кот слегка тянется к точке ввода. Слушаем window,
// поэтому работает и на pointer-events-none котах (кнопка старта), и на
// экранах без скролла — там чистый scroll-параллакс не виден вовсе.
function usePointerDrift(
  ref: React.RefObject<HTMLSpanElement | null>,
  factor: number,
  enabled: boolean,
): { x: number; y: number } {
  const [drift, setDrift] = useState({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!factor || !enabled) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      if (raf) return
      const { clientX, clientY } = e
      raf = requestAnimationFrame(() => {
        raf = 0
        const el = ref.current
        if (!el) return
        const r = el.getBoundingClientRect()
        // центр минус текущий дрейф — иначе getBoundingClientRect даёт обратную связь
        const cx = r.left + r.width / 2 - current.current.x
        const cy = r.top + r.height / 2 - current.current.y
        const clamp = (v: number) => Math.max(-10, Math.min(10, v))
        const nx = clamp(-(clientX - cx) * factor)
        const ny = clamp(-(clientY - cy) * factor)
        setDrift((prev) =>
          Math.abs(prev.x - nx) < 0.5 && Math.abs(prev.y - ny) < 0.5 ? prev : { x: nx, y: ny },
        )
      })
    }
    const onLeave = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      setDrift({ x: 0, y: 0 })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ref, factor, enabled])

  useEffect(() => {
    current.current = drift
  }, [drift])

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
  const wiggleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ref = useRef<HTMLSpanElement | null>(null)
  const scrollDrift = useParallax(ref, parallax, animated)
  const pointer = usePointerDrift(ref, parallax, animated)

  useEffect(
    () => () => {
      if (wiggleTimer.current !== null) clearTimeout(wiggleTimer.current)
    },
    [],
  )

  // Сброс двойной страховкой: onAnimationEnd (реальные браузеры) + таймер
  // на случай, когда animationend не долетел (некоторые окружения тестов).
  const startWiggle = () => {
    setWiggling(false)
    requestAnimationFrame(() => {
      setWiggling(true)
      catHaptic('tap')
      if (wiggleTimer.current !== null) clearTimeout(wiggleTimer.current)
      wiggleTimer.current = setTimeout(() => setWiggling(false), 550)
    })
  }
  const translateY = Math.round(scrollDrift + pointer.y)
  const imgClasses = [animated ? cat.anim : undefined, pop && animated ? 'cat-pop' : undefined]
    .filter(Boolean)
    .join(' ')
  // ВАЖНО: всегда строка (не undefined) — иначе React пропустит обновление
  // className и класс cat-wiggle останется навсегда, ломая повторные тапы
  const wrapperClasses = [className, wiggling ? 'cat-wiggle' : ''].filter(Boolean).join(' ')
  return (
    <span
      ref={ref}
      className={wrapperClasses}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: size,
        height,
        transform: `translate3d(${Math.round(pointer.x)}px, ${translateY}px, 0)`,
        transition: 'transform 150ms ease-out',
      }}
      aria-hidden="true"
      onPointerDown={wiggle && animated ? startWiggle : undefined}
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
