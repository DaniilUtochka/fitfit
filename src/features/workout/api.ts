import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../lib/database.types'

export type SessionRow = Database['public']['Tables']['sessions']['Row']
export type SetRow = Database['public']['Tables']['sets']['Row']

export type ActiveSession = SessionRow & {
  day_templates: { name: string } | null
}

// Восстановление активной сессии при перезаходе: единственная незавершённая
// сессия пользователя (гарантия — партиал-unique в миграции). null = активной нет.
export function useActiveSession() {
  return useQuery({
    queryKey: ['active_session'],
    queryFn: async (): Promise<ActiveSession | null> => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*, day_templates(name)')
        .is('finished_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export function useSessionSets(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['sets', sessionId],
    enabled: sessionId !== undefined,
    queryFn: async (): Promise<SetRow[]> => {
      const { data, error } = await supabase
        .from('sets')
        .select('*')
        .eq('session_id', sessionId!)
        .order('set_number', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useStartWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (templateId: string) => {
      // user_id проставит дефолт auth.uid() в БД (см. миграцию).
      const { error } = await supabase.from('sessions').insert({ template_id: templateId })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['active_session'] }),
  })
}

export function useFinishWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('sessions')
        .update({ finished_at: new Date().toISOString() })
        .eq('id', sessionId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['active_session'] }),
  })
}

export type LogSetInput = {
  sessionId: string
  exerciseId: string
  weight: number | null // = template_exercises.weight; null для bodyweight
  reps: number // = template_exercises.reps_planned
}

// Тап «+» = подход по плану. set_number считаем от текущего максимума этого
// упражнения в сессии (устойчиво к отменам). Пишем сразу — при ошибке она всплывёт.
export function useLogSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: LogSetInput) => {
      const { data: last, error: readError } = await supabase
        .from('sets')
        .select('set_number')
        .eq('session_id', input.sessionId)
        .eq('exercise_id', input.exerciseId)
        .order('set_number', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (readError) throw readError

      const nextNumber = (last?.set_number ?? 0) + 1
      const { error } = await supabase.from('sets').insert({
        session_id: input.sessionId,
        exercise_id: input.exerciseId,
        set_number: nextNumber,
        weight: input.weight,
        reps: input.reps,
      })
      if (error) throw error
    },
    onSuccess: (_data, input) =>
      qc.invalidateQueries({ queryKey: ['sets', input.sessionId] }),
  })
}

export type UndoSetInput = {
  sessionId: string
  exerciseId: string
}

// Тап «−» = отмена последнего подхода этого упражнения (макс set_number).
export function useUndoSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: UndoSetInput) => {
      const { data: last, error: readError } = await supabase
        .from('sets')
        .select('id, set_number')
        .eq('session_id', input.sessionId)
        .eq('exercise_id', input.exerciseId)
        .order('set_number', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (readError) throw readError
      if (!last) return // нечего отменять

      const { error } = await supabase.from('sets').delete().eq('id', last.id)
      if (error) throw error
    },
    onSuccess: (_data, input) =>
      qc.invalidateQueries({ queryKey: ['sets', input.sessionId] }),
  })
}
