// Тактильный отклик на событийных котах (cats v2).
// iOS Safari/PWA не поддерживает navigator.vibrate — на айфоне тихий no-op,
// на Android-браузерах даёт короткий отклик. Паттерн — от характера кота.
type CatHapticKind = 'pr' | 'done' | 'wrecked' | 'tap'

const PATTERNS: Record<CatHapticKind, number | number[]> = {
  pr: [30, 50, 30, 50, 80], // joy с рекордами — «ура-ура»
  done: [40, 40, 40], // план закрыт — спокойный ритм
  wrecked: [70], // выжатый кот — один глухой
  tap: [12], // тап по декоративному коту
}

export function catHaptic(kind: CatHapticKind): void {
  if (typeof navigator === 'undefined') return
  const vibrate = navigator.vibrate?.bind(navigator)
  if (typeof vibrate !== 'function') return
  try {
    vibrate(PATTERNS[kind])
  } catch {
    // vibrate может кинуть в экзотичных окружениях — молча игнорируем
  }
}
