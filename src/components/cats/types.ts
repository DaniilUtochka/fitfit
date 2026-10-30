export type CatProps = {
  /** Ширина в px; высота считается из viewBox конкретного кота. */
  size?: number
  /** false — статичный кадр (для снимков, тестов и prefers-reduced-motion вручную). */
  animated?: boolean
  className?: string
}

// Общие арт-константы котов. Живут здесь же (не в компонентном файле), чтобы
// не мешать react-fast-refresh. Палитра маскотов — арт-цвета персонажей,
// не токены интерфейса (docs/DESIGN.md, «Каст котов»).
export const INK = '#2a2f5a'

/** Контур в стиле kawaii: тёмный round-stroke. */
export function ink(w = 3) {
  return {
    stroke: INK,
    strokeWidth: w,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const
}
