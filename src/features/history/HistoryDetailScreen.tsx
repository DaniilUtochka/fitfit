import { Link, useParams } from 'react-router'
import { Paw } from '../../components/cat'
import { CatArt } from '../../components/cats'
import { useHistorySession, type HistorySetRow } from './api'
import type { TemplateExerciseWithExercise } from '../days/api'
import { formatDateShort } from './logic'
import { computeSummary } from '../workout/logic'

// Детали сессии (слайс 9): подходы по упражнениям + резюме (computeSummary).
export function HistoryDetailScreen() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const session = useHistorySession(sessionId)

  return (
    <div className="flex flex-col">
      <Link to="/history" className="mb-2 inline-flex min-h-[44px] items-center text-sm text-muted">
        ← История
      </Link>

      {session.isPending ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <CatArt name="sleepy" size={72} />
          <p className="font-bold text-muted">Загрузка…</p>
        </div>
      ) : session.isError ? (
        <p className="text-danger">Ошибка: {(session.error as Error).message}</p>
      ) : (
        <DetailBody
          dayName={session.data.dayName}
          startedAt={session.data.startedAt}
          plan={session.data.plan}
          sets={session.data.sets}
        />
      )}
    </div>
  )
}

function DetailBody({
  dayName,
  startedAt,
  plan,
  sets,
}: {
  dayName: string
  startedAt: string
  plan: TemplateExerciseWithExercise[]
  sets: HistorySetRow[]
}) {
  const summary = computeSummary(plan, sets)
  const allDone = summary.doneSets >= summary.plannedSets

  // Плановые упражнения в порядке позиции дня, затем внеплановые (в порядке
  // появления подходов). У плановых без подходов строк не будет — покажем прочерк.
  const setsByExercise = new Map<string, HistorySetRow[]>()
  for (const s of sets) {
    let list = setsByExercise.get(s.exercise_id)
    if (list === undefined) {
      list = []
      setsByExercise.set(s.exercise_id, list)
    }
    list.push(s)
  }
  const planIds = new Set(plan.map((p) => p.exercise_id))
  const extraIds = [...new Set(sets.map((s) => s.exercise_id))].filter((id) => !planIds.has(id))

  return (
    <div className="flex flex-col">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-strong">
        {dayName}
      </h1>
      <p className="tabular mb-4 text-sm font-bold text-muted">{formatDateShort(startedAt)}</p>

      <ul className="mb-6 flex flex-col gap-2.5">
        {plan.map((te) => (
          <ExerciseBlock
            key={te.id}
            name={te.exercises?.name ?? 'Упражнение'}
            sets={setsByExercise.get(te.exercise_id) ?? []}
          />
        ))}
        {extraIds.map((exId) => {
          const name = sets.find((s) => s.exercise_id === exId)?.exercises?.name ?? 'Упражнение'
          return (
            <ExerciseBlock key={exId} name={name} sets={setsByExercise.get(exId) ?? []} extra />
          )
        })}
      </ul>

      {/* Резюме: «паспарту» как на экране завершения тренировки (docs/DESIGN.md);
          за полностью выполненный день — довольный кот (слайс 15) */}
      <h2 className="mb-2 flex min-h-[44px] items-center justify-between text-sm font-bold text-muted uppercase">
        Резюме
        {allDone && <CatArt name="band" size={44} animated={false} />}
      </h2>
      <div className="mb-4 flex flex-col gap-3">
        <div className="card-shadow rounded-2xl bg-surface p-2.5">
          <div className="flex items-baseline justify-between rounded-[16px] bg-lilac p-4">
            <span className="font-bold text-ink-2">Тоннаж</span>
            <span className="font-display tabular text-xl font-extrabold text-ink-strong">
              {summary.tonnage} кг
            </span>
          </div>
        </div>
        <div className="card-shadow rounded-2xl bg-surface p-2.5">
          <div className="flex items-baseline justify-between rounded-[16px] bg-mint p-4">
            <span className="font-bold text-ink-2">Выполнено из плана</span>
            <span
              className={`font-display tabular flex items-center gap-1.5 text-xl font-extrabold ${
                allDone ? 'text-success' : 'text-ink-strong'
              }`}
            >
              {allDone && <Paw size={18} className="text-success" />}
              {summary.doneSets} / {summary.plannedSets}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ExerciseBlock({
  name,
  sets,
  extra,
}: {
  name: string
  sets: HistorySetRow[]
  extra?: boolean
}) {
  return (
    <li className="card-shadow flex flex-col gap-2 rounded-2xl bg-surface p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate font-bold text-ink-strong">{name}</span>
        {extra && (
          <span className="shrink-0 rounded-full bg-sky px-2 py-0.5 text-xs font-bold text-muted">
            вне плана
          </span>
        )}
      </div>

      {sets.length === 0 ? (
        <p className="text-xs text-muted">Подходов нет</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {sets.map((s) => (
            <li
              key={s.id}
              className="tabular flex min-h-[44px] items-center justify-between rounded-xl bg-paper px-3"
            >
              <span className="text-xs text-muted">№{s.set_number}</span>
              <span className="font-bold text-ink-strong">
                {s.weight !== null ? `${s.weight}×${s.reps}` : `×${s.reps}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
