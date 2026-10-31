export type CatProps = {
  /** Ширина в px; высота считается из аспекта спрайта (см. catAspect). */
  size?: number
  /** false — статичный кадр (для снимков, тестов и prefers-reduced-motion вручную). */
  animated?: boolean
  className?: string
  /** Пружинящее появление при монтировании: пустые состояния, резюме, праздники. */
  pop?: boolean
  /** Лёгкий параллакс по скроллу: 0 — выкл; 0.1–0.15 — едва заметный дрейф. */
  parallax?: number
  /** Реакция на тап: wiggle + короткий haptic. Только для декоративных котов вне кнопок. */
  wiggle?: boolean
}
