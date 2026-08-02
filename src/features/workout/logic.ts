// Чистая логика тренировки: агрегация подходов (sets) по упражнению.
// Никаких запросов — только вычисления над уже загруженными данными.

export type SetLike = {
  exercise_id: string
  set_number: number
}

export type ExerciseProgress = {
  doneCount: number
  nextSetNumber: number
}

// Сколько подходов уже сделано по упражнению и какой set_number у следующего.
// nextSetNumber = max(set_number) + 1 (устойчиво к отменам из середины), 1 если пусто.
export function progressFor(sets: SetLike[], exerciseId: string): ExerciseProgress {
  const own = sets.filter((s) => s.exercise_id === exerciseId)
  if (own.length === 0) return { doneCount: 0, nextSetNumber: 1 }
  const maxNumber = own.reduce((max, s) => Math.max(max, s.set_number), 0)
  return { doneCount: own.length, nextSetNumber: maxNumber + 1 }
}
