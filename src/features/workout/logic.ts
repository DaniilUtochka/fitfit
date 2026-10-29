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

// ── Прогрессия (Слайс 5) ──────────────────────────────────────────────────────────────

// Ratchet (правило 4): план двигается только вверх. Общая для веса и повторов.
export function ratchetUp(planValue: number, factValue: number): number {
  return Math.max(planValue, factValue)
}

export type SummarySetLike = {
  exercise_id: string
  weight: number | null
  reps: number
}

export type SummaryPlanLike = {
  exercise_id: string
  sets_planned: number
}

export type WorkoutSummary = {
  tonnage: number
  doneSets: number
  plannedSets: number
}

// Резюме тренировки.
// - tonnage = Σ weight·reps по всем подходам с весом (bodyweight/weight null не в счёт).
// - plannedSets = Σ sets_planned по плановым упражнениям дня.
// - doneSets = «выполнено из плана»: по каждому плановому упражнению не больше
//   его плана (сверхплановые подходы не завышают), внеплановые упражнения не в счёт.
export function computeSummary(
  planExercises: SummaryPlanLike[],
  sets: SummarySetLike[],
): WorkoutSummary {
  const tonnage = sets.reduce((sum, s) => (s.weight !== null ? sum + s.weight * s.reps : sum), 0)
  const plannedSets = planExercises.reduce((sum, e) => sum + e.sets_planned, 0)
  const doneSets = planExercises.reduce((sum, e) => {
    const done = sets.filter((s) => s.exercise_id === e.exercise_id).length
    return sum + Math.min(done, e.sets_planned)
  }, 0)
  return { tonnage, doneSets, plannedSets }
}

// Отмена тренировки (слайс 12): разрешена, пока выполнено < 20% плана.
// Пустой план (plannedSets = 0) — отменить можно всегда: делать нечего, сессия пустая.
// Граница 20% ровно = отмена запрещена (например, 1 подход из 5).
export function cancelAllowed(doneSets: number, plannedSets: number): boolean {
  if (plannedSets === 0) return true
  return doneSets / plannedSets < 0.2
}

export type SetValueLike = {
  exercise_id: string
  set_number: number
  weight: number | null
  reps: number
}

// Последний (по set_number) подход упражнения — для реконструкции рабочего
// значения при перезаходе. null, если подходов ещё нет.
function lastSetOf(sets: SetValueLike[], exerciseId: string): SetValueLike | null {
  let last: SetValueLike | null = null
  for (const s of sets) {
    if (s.exercise_id !== exerciseId) continue
    if (last === null || s.set_number > last.set_number) last = s
  }
  return last
}

// Рабочий вес = вес последнего подхода упражнения, иначе план.
export function workingWeightFor(
  sets: SetValueLike[],
  exerciseId: string,
  planWeight: number | null,
): number | null {
  const last = lastSetOf(sets, exerciseId)
  return last ? last.weight : planWeight
}

// Рабочие повторы (bodyweight) = повторы последнего подхода, иначе план.
export function workingRepsFor(
  sets: SetValueLike[],
  exerciseId: string,
  planReps: number,
): number {
  const last = lastSetOf(sets, exerciseId)
  return last ? last.reps : planReps
}
