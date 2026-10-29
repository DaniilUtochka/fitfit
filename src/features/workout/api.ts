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

// Отмена тренировки (слайс 12): удаление незавершённой сессии. Подходы уходят
// каскадом (FK sets.session_id on delete cascade) — история такой сессии чистая.
// Ratchet write-back от отменённых подходов план не откатываем.
export function useCancelWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.from('sessions').delete().eq('id', sessionId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['active_session'] }),
  })
}

export type LogSetInput = {
  sessionId: string
  exerciseId: string
  weight: number | null // рабочий вес; null для bodyweight
  reps: number // рабочие повторы
  // Ссылка на план — для ratchet write-back. Нет для внепланового упражнения.
  templateId?: string
  templateExerciseId?: string
  isBodyweight?: boolean
}

// Тап «+» = подход по текущему рабочему значению. set_number считаем от текущего
// максимума этого упражнения в сессии (устойчиво к отменам). Пишем сразу — при
// ошибке она всплывёт. После вставки — ratchet write-back в план (только вверх).
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

      // Ratchet (правило 4): план двигается только вверх. Условие проверяет БД
      // фильтром .lt(...) — атомарно, без гонки от кэша; при снижении строк не
      // затронуто ни одной. Внеплановое упражнение (нет templateExerciseId)
      // план не трогает.
      if (input.templateExerciseId === undefined) return

      if (input.isBodyweight) {
        const { error: upErr } = await supabase
          .from('template_exercises')
          .update({ reps_planned: input.reps })
          .eq('id', input.templateExerciseId)
          .lt('reps_planned', input.reps)
        if (upErr) throw upErr
      } else if (input.weight !== null) {
        const { error: upErr } = await supabase
          .from('template_exercises')
          .update({ weight: input.weight })
          .eq('id', input.templateExerciseId)
          .lt('weight', input.weight)
        if (upErr) throw upErr
      }
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ['sets', input.sessionId] })
      if (input.templateId !== undefined) {
        qc.invalidateQueries({ queryKey: ['day_template', input.templateId] })
      }
    },
  })
}

export type UpdateSetInput = {
  sessionId: string
  setId: string
  weight?: number | null
  reps?: number
}

// Точечная коррекция подхода: UPDATE одной строки sets (правка факта, план не
// двигает — правило 3). Инвалидируем sets сессии.
export function useUpdateSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateSetInput) => {
      const update: Database['public']['Tables']['sets']['Update'] = {}
      if (input.weight !== undefined) update.weight = input.weight
      if (input.reps !== undefined) update.reps = input.reps
      const { error } = await supabase.from('sets').update(update).eq('id', input.setId)
      if (error) throw error
    },
    onSuccess: (_data, input) => qc.invalidateQueries({ queryKey: ['sets', input.sessionId] }),
  })
}

export type PrevSetsMap = Record<string, SetRow[]>

// «Что было в прошлый раз» (DATA-MODEL мех. 2): последняя завершённая сессия того
// же дня до текущей + её подходы, сгруппированные по exercise_id (по set_number).
export function usePreviousSessionSets(templateId: string, currentSessionId: string) {
  return useQuery({
    queryKey: ['prev_sets', templateId],
    queryFn: async (): Promise<PrevSetsMap> => {
      const { data: prevSession, error: sErr } = await supabase
        .from('sessions')
        .select('id')
        .eq('template_id', templateId)
        .not('finished_at', 'is', null)
        .neq('id', currentSessionId)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (sErr) throw sErr
      if (!prevSession) return {}

      const { data: prevSets, error: setsErr } = await supabase
        .from('sets')
        .select('*')
        .eq('session_id', prevSession.id)
        .order('set_number', { ascending: true })
      if (setsErr) throw setsErr

      const map: PrevSetsMap = {}
      for (const s of prevSets) {
        ;(map[s.exercise_id] ??= []).push(s)
      }
      return map
    },
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
