// Чистая логика истории (слайс 9): агрегация «последних результатов» и формат дат.
// Никаких запросов — только вычисления над уже загруженными данными.

export type ResultSetsLike = {
  exercise_id: string
  set_number: number
  weight: number | null
  reps: number
}

export type DatedSessionSets = {
  started_at: string
  sets: ResultSetsLike[]
}

// Короткая запись подхода: «60×10» для веса, «×12» для bodyweight (weight null).
export function formatSetShort(s: ResultSetsLike): string {
  return s.weight !== null ? `${s.weight}×${s.reps}` : `×${s.reps}`
}

// Последние результаты по упражнениям дня: до 3 последних сессий (свежие первее),
// в каждой сессии — последний подход упражнения (по set_number).
// Возврат: exercise_id → строки от свежей тренировки к более старым. Упражнение,
// которого в сессии не было, элемент не получает — пустых значений в строках нет.
export function recentResultsByExercise(
  sessions: DatedSessionSets[],
): Record<string, string[]> {
  const sorted = [...sessions].sort((a, b) => (a.started_at < b.started_at ? 1 : -1))
  const recent = sorted.slice(0, 3)

  const result: Record<string, string[]> = {}
  for (const session of recent) {
    const lastByExercise = new Map<string, ResultSetsLike>()
    for (const s of session.sets) {
      const cur = lastByExercise.get(s.exercise_id)
      if (cur === undefined || s.set_number > cur.set_number) lastByExercise.set(s.exercise_id, s)
    }
    for (const [exerciseId, s] of lastByExercise) {
      ;(result[exerciseId] ??= []).push(formatSetShort(s))
    }
  }
  return result
}

const MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
]

// Короткая русская дата по местному времени: «29 окт», прошлые годы — с годом:
// «14 мар 2025». now — точка отсчёта для решения «показывать ли год».
export function formatDateShort(iso: string, now: Date = new Date()): string {
  const d = new Date(iso)
  const base = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]!}`
  return d.getFullYear() === now.getFullYear() ? base : `${base} ${d.getFullYear()}`
}
