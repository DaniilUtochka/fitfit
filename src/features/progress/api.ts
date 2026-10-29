import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { ProgressSession, ProgressSet } from './logic'

export type ProgressData = {
  sessions: ProgressSession[]
  sets: ProgressSet[]
  // exercise_id → имя основной группы мышц (is_primary = true)
  primaryGroups: Record<string, string>
  // exercise_id → имя упражнения (для «Максимум веса» в рекордах)
  exerciseNames: Record<string, string>
}

// Все метрики v1 считаются на клиенте из существующих таблиц (docs/PROGRESS.md):
// один запрос завершённых сессий, один по их подходам (сразу с именами
// упражнений), один по основным группам. Только завершённые сессии
// (finished_at not null) — активная и отменённая (слайс 12) в прогресс не попадают.
export function useProgressData() {
  return useQuery({
    queryKey: ['progress'],
    queryFn: async (): Promise<ProgressData> => {
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('id, started_at, finished_at, day_templates(name)')
        .not('finished_at', 'is', null)
        .order('started_at', { ascending: false })
      if (error) throw error

      if (sessions.length === 0) {
        return { sessions: [], sets: [], primaryGroups: {}, exerciseNames: {} }
      }

      const sessionIds = sessions.map((s) => s.id)
      const { data: setRows, error: setsErr } = await supabase
        .from('sets')
        .select('session_id, exercise_id, weight, reps, exercises(name)')
        .in('session_id', sessionIds)
      if (setsErr) throw setsErr

      const exerciseIds = [...new Set(setRows.map((s) => s.exercise_id))]
      const primaryGroups: Record<string, string> = {}
      const exerciseNames: Record<string, string> = {}
      if (exerciseIds.length > 0) {
        const { data: groups, error: groupsErr } = await supabase
          .from('exercise_muscle_groups')
          .select('exercise_id, muscle_groups(name)')
          .eq('is_primary', true)
          .in('exercise_id', exerciseIds)
        if (groupsErr) throw groupsErr
        for (const g of groups) {
          primaryGroups[g.exercise_id] = g.muscle_groups?.name ?? ''
        }
      }
      for (const s of setRows) {
        exerciseNames[s.exercise_id] ??= s.exercises?.name ?? 'Упражнение'
      }

      return {
        sessions: sessions.map((s) => ({
          id: s.id,
          started_at: s.started_at,
          finished_at: s.finished_at!, // отфильтровано .not('finished_at', 'is', null)
          dayName: s.day_templates?.name ?? 'Тренировка',
        })),
        sets: setRows.map((s) => ({
          session_id: s.session_id,
          exercise_id: s.exercise_id,
          weight: s.weight,
          reps: s.reps,
        })),
        primaryGroups,
        exerciseNames,
      }
    },
  })
}
