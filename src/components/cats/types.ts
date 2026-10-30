export type CatProps = {
  /** Ширина в px; высота считается из аспекта спрайта (см. catAspect). */
  size?: number
  /** false — статичный кадр (для снимков, тестов и prefers-reduced-motion вручную). */
  animated?: boolean
  className?: string
}
