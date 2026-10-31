import bandUrl from './assets/band.webp'
import sleepyUrl from './assets/sleepy.webp'
import dumbbellUrl from './assets/dumbbell.webp'
import matUrl from './assets/mat.webp'
import loafUrl from './assets/loaf.webp'
import wreckedUrl from './assets/wrecked.webp'
import joyUrl from './assets/joy.webp'

/** Каст маскотов FitFit (слайс 15). Роли — docs/DESIGN.md, «Каст котов». */
export type CatName = 'band' | 'sleepy' | 'dumbbell' | 'mat' | 'loaf' | 'wrecked' | 'joy'

// Спрайты вырезаны из референса пользователя скриптом scripts/extract-cats.py.
// Анимация — целым спрайтом через CSS-классы .cat-*; zzz и конфетти —
// SVG-оверлеи поверх картинки (их рисовать в растре не нужно).
export const registry: Record<
  CatName,
  { src: string; aspect: number; anim: string; overlay?: 'zzz' | 'confetti' }
> = {
  band: { src: bandUrl, aspect: 1.098, anim: 'cat-float' },
  sleepy: { src: sleepyUrl, aspect: 0.6672, anim: 'cat-breathe', overlay: 'zzz' },
  dumbbell: { src: dumbbellUrl, aspect: 0.9592, anim: 'cat-sway' },
  mat: { src: matUrl, aspect: 0.8259, anim: 'cat-stretch' },
  loaf: { src: loafUrl, aspect: 0.8067, anim: 'cat-breathe' },
  wrecked: { src: wreckedUrl, aspect: 0.8431, anim: 'cat-breathe' },
  joy: { src: joyUrl, aspect: 1.2078, anim: 'cat-jump', overlay: 'confetti' },
}

/** Высота/ширина спрайта — для точного позиционирования (слот на кнопке). */
export function catAspect(name: CatName): number {
  return registry[name].aspect
}
