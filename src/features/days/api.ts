import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../lib/database.types'

export type DayTemplate = Database['public']['Tables']['day_templates']['Row']

export type TemplateExerciseRow = Database['public']['Tables']['template_exercises']['Row']

export type TemplateExerciseWithExercise = TemplateExerciseRow & {
  exercises: {
    id: string
    name: string
    is_bodyweight: boolean
  } | null
}

export type DayTemplateWithExercises = DayTemplate & {
  template_exercises: TemplateExerciseWithExercise[]
}

export function useDayTemplates(includeArchived: boolean) {
  return useQuery({
    queryKey: ['day_templates', { includeArchived }],
    queryFn: async (): Promise<DayTemplate[]> => {
      let query = supabase
        .from('day_templates')
        .select('*')
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

export function useDayTemplate(id: string) {
  return useQuery({
    queryKey: ['day_template', id],
    queryFn: async (): Promise<DayTemplateWithExercises> => {
      const { data, error } = await supabase
        .from('day_templates')
        .select('*, template_exercises(*, exercises(id, name, is_bodyweight))')
        .eq('id', id)
        .single()
      if (error) throw error
      // Порядок в дне — по position (PostgREST не сортирует вложенное по умолчанию).
      data.template_exercises.sort((a, b) => a.position - b.position)
      return data
    },
  })
}

export function useCreateDayTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      // user_id проставит дефолт auth.uid() в БД (см. миграцию).
      const { error } = await supabase.from('day_templates').insert({ name })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['day_templates'] }),
  })
}

export function useArchiveDayTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('day_templates')
        .update({ is_archived: true })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['day_templates'] }),
  })
}

export type NewTemplateExercise = {
  templateId: string
  exerciseId: string
  isBodyweight: boolean
  position: number
  setsPlanned: number
  repsPlanned: number
  weight: number | null
}

export function useAddTemplateExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewTemplateExercise) => {
      const { error } = await supabase.from('template_exercises').insert({
        template_id: input.templateId,
        exercise_id: input.exerciseId,
        position: input.position,
        sets_planned: input.setsPlanned,
        reps_planned: input.repsPlanned,
        // Инвариант «bodyweight ↔ weight is null» держим во фронте (DATA-MODEL).
        weight: input.isBodyweight ? null : input.weight,
      })
      if (error) throw error
    },
    onSuccess: (_data, input) =>
      qc.invalidateQueries({ queryKey: ['day_template', input.templateId] }),
  })
}

export type PlanPatch = {
  id: string
  templateId: string
  setsPlanned?: number
  repsPlanned?: number
  weight?: number | null
}

export function useUpdateTemplateExercisePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: PlanPatch) => {
      const update: Database['public']['Tables']['template_exercises']['Update'] = {}
      if (patch.setsPlanned !== undefined) update.sets_planned = patch.setsPlanned
      if (patch.repsPlanned !== undefined) update.reps_planned = patch.repsPlanned
      if (patch.weight !== undefined) update.weight = patch.weight
      const { error } = await supabase
        .from('template_exercises')
        .update(update)
        .eq('id', patch.id)
      if (error) throw error
    },
    onSuccess: (_data, patch) =>
      qc.invalidateQueries({ queryKey: ['day_template', patch.templateId] }),
  })
}

export function useRemoveTemplateExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; templateId: string }) => {
      // template_exercises — план, не история: удаление разрешено (правило 3).
      const { error } = await supabase.from('template_exercises').delete().eq('id', args.id)
      if (error) throw error
    },
    onSuccess: (_data, args) =>
      qc.invalidateQueries({ queryKey: ['day_template', args.templateId] }),
  })
}

export function useReorderTemplateExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      templateId: string
      a: { id: string; position: number }
      b: { id: string; position: number }
    }) => {
      // Своп позиций двух соседних строк. Unique на position нет — конфликта нет.
      const { error: e1 } = await supabase
        .from('template_exercises')
        .update({ position: args.b.position })
        .eq('id', args.a.id)
      if (e1) throw e1
      const { error: e2 } = await supabase
        .from('template_exercises')
        .update({ position: args.a.position })
        .eq('id', args.b.id)
      if (e2) throw e2
    },
    onSuccess: (_data, args) =>
      qc.invalidateQueries({ queryKey: ['day_template', args.templateId] }),
  })
}
