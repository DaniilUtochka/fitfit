export type MuscleGroupLink = {
  exercise_id: string
  muscle_group_id: number
  is_primary: boolean
}

// Собирает строки для exercise_muscle_groups: одна primary + secondary без дублей primary.
// Дубль primary в secondary отфильтровывается — иначе ловим unique index
// exercise_muscle_groups_one_primary_idx (одна primary-группа на упражнение).
export function buildMuscleGroupLinks(
  exerciseId: string,
  primaryGroupId: number,
  secondaryGroupIds: number[],
): MuscleGroupLink[] {
  return [
    { exercise_id: exerciseId, muscle_group_id: primaryGroupId, is_primary: true },
    ...secondaryGroupIds
      .filter((id) => id !== primaryGroupId)
      .map((id) => ({ exercise_id: exerciseId, muscle_group_id: id, is_primary: false })),
  ]
}
