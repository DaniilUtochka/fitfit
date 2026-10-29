import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../lib/database.types'
import type { TemplateExerciseWithExercise } from '../days/api'
import { computeSummary, type WorkoutSummary } from '../workout/logic'
import { recentResultsByExercise, type ResultSetsLike } from './logic'

type SetRow = Database['public']['Tables']['sets']['Row']

export type HistorySetRow = SetRow & {
  exercises: { name: string } | null
}

// ── Список завершённых сессий (/history) ──────────────────────────────────────────────
export type HistorySessionRow = {
  id: string
  startedAt: string
  dayName: string
  summary: WorkoutSummary
}

// Только завершённые сессии (finished_at not null): активная сессия в истории не
// участвует, отменённая (слайс 12) удалена из базы и просто не вернётся.
// «Выполнено из плана» — computeSummary по плану дня сессии и её подходам.
export function useHistorySessions() {
  return useQuery({
    queryKey: ['history_sessions'],
    queryFn: async (): Promise<HistorySessionRow[]> => {
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('id, started_at, template_id, day_templates(name)')
        .not('finished_at', 'is', null)
        .order('started_at', { ascending: false })
      if (error) throw error
      if (sessions.length === 0) return []

      const sessionIds = sessions.map((s) => s.id)
      const templateIds = [...new Set(sessions.map((s) => s.template_id))]

      const { data: allSets, error: setsErr } = await supabase
        .from('sets')
        .select('*')
        .in('session_id', sessionIds)
      if (setsErr) throw setsErr

      const { data: plan, error: planErr } = await supabase
        .from('template_exercises')
        .select('template_id, exercise_id, sets_planned')
        .in('template_id', templateIds)
      if (planErr) throw planErr

      return sessions.map((s) => ({
        id: s.id,
        startedAt: s.started_at,
        dayName: s.day_templates?.name ?? 'Тренировка',
        summary: computeSummary(
          plan.filter((p) => p.template_id === s.template_id),
          allSets.filter((x) => x.session_id === s.id),
        ),
      }))
    },
  })
}

// ── Детали сессии (/history/:sessionId) ───────────────────────────────────────────────
export type HistoryDetail = {
  id: string
  startedAt: string
  dayName: string
  // План дня на момент просмотра (текущий, не исторический) — нужен для
  // «выполнено из плана» в computeSummary и порядка плановых упражнений.
  plan: TemplateExerciseWithExercise[]
  sets: HistorySetRow[]
}

export function useHistorySession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['history_session', sessionId],
    enabled: sessionId !== undefined,
    queryFn: async (): Promise<HistoryDetail> => {
      const { data: session, error } = await supabase
        .from('sessions')
        .select('id, started_at, template_id, day_templates(name)')
        .eq('id', sessionId!)
        .single()
      if (error) throw error

      const { data: plan, error: planErr } = await supabase
        .from('template_exercises')
        .select('*, exercises(id, name, is_bodyweight)')
        .eq('template_id', session.template_id)
        .order('position', { ascending: true })
      if (planErr) throw planErr

      const { data: sets, error: setsErr } = await supabase
        .from('sets')
        .select('*, exercises(name)')
        .eq('session_id', sessionId!)
        .order('set_number', { ascending: true })
      if (setsErr) throw setsErr

      return {
        id: session.id,
        startedAt: session.started_at,
        dayName: session.day_templates?.name ?? 'Тренировка',
        plan,
        sets: sets as HistorySetRow[],
      }
    },
  })
}

// ── Последние результаты по упражнению в дне (строка «Последние» в редакторе) ──────────
export type RecentResultsMap = Record<string, string[]>

// До 3 последних завершённых сессий этого дня; результат по каждому упражнению —
// последний подход каждой сессии (см. recentResultsByExercise). Активная сессия
// не попадает (finished_at not null), поэтому «Последние» не подглядывает в текущую.
export function useRecentResults(templateId: string) {
  return useQuery({
    queryKey: ['recent_results', templateId],
    enabled: templateId.length > 0,
    queryFn: async (): Promise<RecentResultsMap> => {
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('id, started_at')
        .eq('template_id', templateId)
        .not('finished_at', 'is', null)
        .order('started_at', { ascending: false })
        .limit(3)
      if (error) throw error
      if (sessions.length === 0) return {}

      const { data: sets, error: setsErr } = await supabase
        .from('sets')
        .select('session_id, exercise_id, set_number, weight, reps')
        .in(
          'session_id',
          sessions.map((s) => s.id),
        )
      if (setsErr) throw setsErr

      return recentResultsByExercise(
        sessions.map((s) => ({
          started_at: s.started_at,
          sets: sets.filter((x) => x.session_id === s.id) as ResultSetsLike[],
        })),
      )
    },
  })
}
