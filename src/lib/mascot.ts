import type { CatName } from '../components/cats'

// Маскот-слоты (слайс 15). Правило DESIGN.md: один постоянный кот на экран.
// Кнопка «Начать тренировку» — единственный постоянный слот Прогресса, её кот
// меняет настроение: утро — потягивается, вечер — спит, после тренировки — выжат.

export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night'

export function timeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 21) return 'day'
  if (hour >= 21) return 'evening'
  return 'night' // 0–4
}

/** Считаем тренировку «свежей» 3 часа: хватит на душ и дорогу домой. */
const FRESH_WORKOUT_MS = 3 * 60 * 60 * 1000
/** Неделя без тренировок — «с возвращением»: кот тянется на коврике. */
const RETURN_GAP_MS = 7 * 24 * 60 * 60 * 1000

export type CtaCatInput = {
  now: number
  hour: number
  /** Конец последней завершённой тренировки (finished_at), null если их ещё не было. */
  lastSessionAt: number | null
  /** Когда в этой сессии приложения завершилась тренировка (sessionStorage). */
  finishedAt: number | null
}

// Приоритет: свежая тренировка → возвращение после перерыва → утро → вечер → дефолт.
export function pickCtaCat({ now, hour, lastSessionAt, finishedAt }: CtaCatInput): CatName {
  if (finishedAt !== null && now - finishedAt < FRESH_WORKOUT_MS) return 'wrecked'
  if (lastSessionAt === null || now - lastSessionAt > RETURN_GAP_MS) return 'mat'
  const t = timeOfDay(hour)
  if (t === 'morning') return 'mat'
  if (t === 'evening' || t === 'night') return 'sleepy'
  return 'loaf'
}

// ── Флаги sessionStorage: переживают принудительный релоад PWA, умирают с вкладкой ──

const FINISHED_KEY = 'fitfit.finishedAt'
const UPDATED_KEY = 'fitfit.justUpdated'

function readNumber(key: string): number | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (raw === null) return null
    const v = Number(raw)
    return Number.isFinite(v) ? v : null
  } catch {
    return null // приватный режим без хранилища
  }
}

function write(key: string, value: number): void {
  try {
    sessionStorage.setItem(key, String(value))
  } catch {
    // молча: маскот не стоит ошибки
  }
}

/** Резюме тренировки закрыто — кот на кнопке устал. */
export function markWorkoutFinished(): void {
  write(FINISHED_KEY, Date.now())
}

export function readFinishedAt(): number | null {
  return readNumber(FINISHED_KEY)
}

/** Пришёл новый service worker — при следующем заходе на Прогресс кот празднует. */
export function markAppUpdated(): void {
  write(UPDATED_KEY, Date.now())
}

export function consumeAppUpdated(): boolean {
  try {
    if (sessionStorage.getItem(UPDATED_KEY) === null) return false
    sessionStorage.removeItem(UPDATED_KEY)
    return true
  } catch {
    return false
  }
}
