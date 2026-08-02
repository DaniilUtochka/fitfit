import { useState } from 'react'
import { useDayTemplate, useDayTemplates } from '../days/api'
import type { TemplateExerciseWithExercise } from '../days/api'
import {
  useActiveSession,
  useFinishWorkout,
  useLogSet,
  useSessionSets,
  useStartWorkout,
  useUndoSet,
  type ActiveSession,
} from './api'
import { progressFor } from './logic'

export function WorkoutScreen() {
  const active = useActiveSession()

  if (active.isPending) return <CenterMsg text="Загрузка…" />
  if (active.isError) return <CenterMsg text={`Ошибка: ${(active.error as Error).message}`} danger />

  return active.data ? <ActiveWorkout session={active.data} /> : <DayChooser />
}

function CenterMsg({ text, danger }: { text: string; danger?: boolean }) {
  return <p className={danger ? 'text-danger' : 'text-muted'}>{text}</p>
}

// ── Нет активной тренировки: выбор дня ────────────────────────────────────────────────
function DayChooser() {
  const days = useDayTemplates(false)
  const start = useStartWorkout()

  return (
    <div className="flex flex-col">
      <h1 className="mb-4 text-2xl font-bold tracking-tight text-ink-strong">Тренировка</h1>
      <h2 className="mt-2 mb-2 text-sm font-semibold text-muted uppercase">Выбери день</h2>

      {days.isPending ? (
        <p className="text-muted">Загрузка…</p>
      ) : days.isError ? (
        <p className="text-danger">Ошибка: {(days.error as Error).message}</p>
      ) : days.data.length === 0 ? (
        <p className="text-muted">Нет дней. Собери день во вкладке «Дни».</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {days.data.map((day) => (
            <li key={day.id}>
              <button
                onClick={() => start.mutate(day.id)}
                disabled={start.isPending}
                className="flex min-h-[56px] w-full items-center justify-between rounded-2xl border border-border bg-surface px-4 text-left disabled:opacity-50"
              >
                <span className="font-semibold text-ink-strong">{day.name}</span>
                <span className="text-sm text-brand">Начать →</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {start.isError && <p className="mt-3 text-sm text-danger">{(start.error as Error).message}</p>}
    </div>
  )
}

// ── Активная тренировка ───────────────────────────────────────────────────────────────
function ActiveWorkout({ session }: { session: ActiveSession }) {
  const plan = useDayTemplate(session.template_id)
  const sets = useSessionSets(session.id)
  const finish = useFinishWorkout()
  const [confirming, setConfirming] = useState(false)

  const dayName = session.day_templates?.name ?? 'Тренировка'

  return (
    <div className="flex flex-col">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h1 className="min-w-0 truncate text-2xl font-bold tracking-tight text-ink-strong">
          {dayName}
        </h1>
        {confirming ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => finish.mutate(session.id)}
              disabled={finish.isPending}
              className="min-h-[44px] rounded-xl bg-brand px-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Точно завершить?
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="min-h-[44px] px-2 text-sm text-muted underline"
            >
              Нет
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="min-h-[44px] shrink-0 rounded-xl border border-border px-3 text-sm text-ink"
          >
            Завершить
          </button>
        )}
      </header>

      {finish.isError && (
        <p className="mb-3 text-sm text-danger">{(finish.error as Error).message}</p>
      )}

      {plan.isPending || sets.isPending ? (
        <p className="text-muted">Загрузка…</p>
      ) : plan.isError ? (
        <p className="text-danger">Ошибка: {(plan.error as Error).message}</p>
      ) : sets.isError ? (
        <p className="text-danger">Ошибка: {(sets.error as Error).message}</p>
      ) : plan.data.template_exercises.length === 0 ? (
        <p className="text-muted">В этом дне нет упражнений.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {plan.data.template_exercises.map((te) => (
            <ExerciseCard
              key={te.id}
              sessionId={session.id}
              te={te}
              done={progressFor(sets.data, te.exercise_id).doneCount}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function ExerciseCard({
  sessionId,
  te,
  done,
}: {
  sessionId: string
  te: TemplateExerciseWithExercise
  done: number
}) {
  const logSet = useLogSet()
  const undoSet = useUndoSet()
  const busy = logSet.isPending || undoSet.isPending

  const planText = te.weight !== null ? `${te.weight}кг × ${te.reps_planned}` : `× ${te.reps_planned}`

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate font-semibold text-ink-strong">
          {te.exercises?.name ?? 'Упражнение'}
        </span>
        <span className="shrink-0 text-sm text-muted">{planText}</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-lg tracking-widest text-brand" aria-hidden="true">
          {'●'.repeat(done)}
          {'○'.repeat(Math.max(0, te.sets_planned - done))}
        </span>
        <span className="text-sm text-muted">
          {done}/{te.sets_planned}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          aria-label="Отменить подход"
          onClick={() => undoSet.mutate({ sessionId, exerciseId: te.exercise_id })}
          disabled={busy || done === 0}
          className="grid min-h-[44px] flex-1 place-items-center rounded-xl border border-border text-2xl text-ink disabled:opacity-30"
        >
          −
        </button>
        <button
          aria-label="Отметить подход"
          onClick={() =>
            logSet.mutate({
              sessionId,
              exerciseId: te.exercise_id,
              weight: te.weight,
              reps: te.reps_planned,
            })
          }
          disabled={busy}
          className="grid min-h-[44px] flex-1 place-items-center rounded-xl bg-brand text-2xl font-semibold text-white disabled:opacity-50"
        >
          +
        </button>
      </div>

      {logSet.isError && <p className="text-sm text-danger">{(logSet.error as Error).message}</p>}
      {undoSet.isError && <p className="text-sm text-danger">{(undoSet.error as Error).message}</p>}
    </li>
  )
}
