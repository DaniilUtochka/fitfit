import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../lib/database.types'

export type MuscleGroup = Database['public']['Tables']['muscle_groups']['Row']

export type ExerciseWithGroups = Database['public']['Tables']['exercises']['Row'] & {
  exercise_muscle_groups: {
    muscle_group_id: number
    is_primary: boolean
    muscle_groups: MuscleGroup | null
  }[]
}

export function useMuscleGroups() {
  return useQuery({
    queryKey: ['muscle_groups'],
    queryFn: async (): Promise<MuscleGroup[]> => {
      const { data, error } = await supabase.from('muscle_groups').select('*').order('id')
      if (error) throw error
      return data
    },
    staleTime: Infinity, // справочник не меняется в рамках сессии
  })
}

export function useExercises(includeArchived: boolean) {
  return useQuery({
    queryKey: ['exercises', { includeArchived }],
    queryFn: async (): Promise<ExerciseWithGroups[]> => {
      let query = supabase
        .from('exercises')
        .select('*, exercise_muscle_groups(muscle_group_id, is_primary, muscle_groups(id, name))')
        .order('created_at', { ascending: false })

      if (!includeArchived) {
        query = query.eq('is_archived', false)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export type NewExercise = {
  name: string
  isBodyweight: boolean
  note: string | null
  videoUrl: string | null
  primaryGroupId: number
  secondaryGroupIds: number[]
}

export function useCreateExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewExercise) => {
      // user_id проставит дефолт auth.uid() в БД (см. миграцию).
      const { data: exercise, error } = await supabase
        .from('exercises')
        .insert({
          name: input.name,
          is_bodyweight: input.isBodyweight,
          note: input.note,
          video_url: input.videoUrl,
        })
        .select('id')
        .single()
      if (error) throw error

      const links = [
        { exercise_id: exercise.id, muscle_group_id: input.primaryGroupId, is_primary: true },
        ...input.secondaryGroupIds
          .filter((id) => id !== input.primaryGroupId)
          .map((id) => ({ exercise_id: exercise.id, muscle_group_id: id, is_primary: false })),
      ]

      const { error: linkError } = await supabase.from('exercise_muscle_groups').insert(links)
      if (linkError) {
        // Не оставляем упражнение без групп — откатываем вставку.
        await supabase.from('exercises').delete().eq('id', exercise.id)
        throw linkError
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
  })
}

export function useArchiveExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exercises').update({ is_archived: true }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
  })
}
