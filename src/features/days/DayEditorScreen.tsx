import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { Cat } from '../../components/cat'
import { useExercises } from '../exercises/api'
import {
  useAddTemplateExercise,
  useDayTemplate,
  useRemoveTemplateExercise,
  useReorderTemplateExercise,
  useUpdateTemplateExercisePlan,
  type TemplateExerciseWithExercise,
} from './api'
import { useRecentResults } from '../history/api'

export function DayEditorScreen() {
  const { id } = useParams<{ id: string }>()
  const day = useDayTemplate(id ?? '')
  // «Последние результаты» по каждому упражнению (слайс 9): до 3 завершённых
  // сессий этого дня. Активная сессия не считается (finished_at not null).
  const recent = useRecentResults(day.data?.id ?? '')

  return (
    <div className="flex flex-col">
      <Link to="/days" className="mb-2 inline-flex min-h-[44px] items-center text-sm text-muted">
        ← Дни
      </Link>

      {day.isPending ? (
        <p className="text-muted">Загрузка…</p>
      ) : day.isError ? (
        <p className="text-danger">Ошибка: {(day.error as Error).message}</p>
      ) : (
        <>
          <h1 className="font-display mb-4 text-2xl font-extrabold tracking-tight text-ink-strong">
            {day.data.name}
          </h1>

          {day.data.template_exercises.length === 0 ? (
            <div className="mb-4 flex flex-col items-center gap-2 rounded-2xl bg-sky p-6 text-center">
              <Cat mood="hello" size={80} />
              <p className="font-bold text-ink">Пока пусто</p>
              <p className="text-sm text-muted">Добавь упражнение в форме ниже</p>
            </div>
          ) : (
            <ul className="mb-6 flex flex-col gap-2.5">
              {day.data.template_exercises.map((te, i) => (
                <PlanRow
                  key={te.id}
                  te={te}
                  templateId={day.data.id}
                  recentResults={recent.data?.[te.exercise_id]}
                  isFirst={i === 0}
                  isLast={i === day.data.template_exercises.length - 1}
                  prev={day.data.template_exercises[i - 1]}
                  next={day.data.template_exercises[i + 1]}
                />
              ))}
            </ul>
          )}

          <AddExerciseBlock
            templateId={day.data.id}
            existingExerciseIds={day.data.template_exercises.map((te) => te.exercise_id)}
            nextPosition={
              day.data.template_exercises.reduce((max, te) => Math.max(max, te.position), 0) + 1
            }
          />
        </>
      )}
    </div>
  )
}

function PlanRow({
  te,
  templateId,
  recentResults,
  isFirst,
  isLast,
  prev,
  next,
}: {
  te: TemplateExerciseWithExercise
  templateId: string
  // Строки «Последние» для этого упражнения; undefined = истории нет — строку не рисуем.
  recentResults?: string[]
  isFirst: boolean
  isLast: boolean
  prev?: TemplateExerciseWithExercise
  next?: TemplateExerciseWithExercise
}) {
  const update = useUpdateTemplateExercisePlan()
  const remove = useRemoveTemplateExercise()
  const reorder = useReorderTemplateExercise()
  const isBodyweight = te.exercises?.is_bodyweight ?? te.weight === null

  return (
    <li className="card-shadow flex flex-col gap-3 rounded-2xl bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="font-bold text-ink-strong">
            {te.exercises?.name ?? 'Упражнение'}
          </span>
          {isBodyweight && (
            <span className="rounded-full bg-sky px-2 py-0.5 text-xs font-bold text-muted">
              bodyweight
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            aria-label="Вверх"
            disabled={isFirst || reorder.isPending}
            onClick={() =>
              prev &&
              reorder.mutate({
                templateId,
                a: { id: te.id, position: te.position },
                b: { id: prev.id, position: prev.position },
              })
            }
            className="grid size-11 place-items-center rounded-xl border-2 border-border bg-surface text-ink disabled:opacity-30"
          >
            ↑
          </button>
          <button
            aria-label="Вниз"
            disabled={isLast || reorder.isPending}
            onClick={() =>
              next &&
              reorder.mutate({
                templateId,
                a: { id: te.id, position: te.position },
                b: { id: next.id, position: next.position },
              })
            }
            className="grid size-11 place-items-center rounded-xl border-2 border-border bg-surface text-ink disabled:opacity-30"
          >
            ↓
          </button>
        </div>
      </div>

      {recentResults && recentResults.length > 0 && (
        <p className="border-t-2 border-dashed border-line-2 pt-2 text-xs font-bold text-muted">
          Последние:{' '}
          <span className="tabular text-ink">{recentResults.join(', ')}</span>
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <PlanField
          label="Подходы"
          value={te.sets_planned}
          onCommit={(n) => update.mutate({ id: te.id, templateId, setsPlanned: n })}
        />
        <PlanField
          label="Повторы"
          value={te.reps_planned}
          onCommit={(n) => update.mutate({ id: te.id, templateId, repsPlanned: n })}
        />
        {!isBodyweight && (
          <PlanField
            label="Вес, кг"
            value={te.weight ?? 0}
            step={2.5}
            onCommit={(n) => update.mutate({ id: te.id, templateId, weight: n })}
          />
        )}
      </div>

      {update.isError && <p className="text-sm text-danger">{(update.error as Error).message}</p>}
      {reorder.isError && <p className="text-sm text-danger">{(reorder.error as Error).message}</p>}
      {remove.isError && <p className="text-sm text-danger">{(remove.error as Error).message}</p>}

      <button
        onClick={() => remove.mutate({ id: te.id, templateId })}
        disabled={remove.isPending}
        className="self-start min-h-[44px] text-sm text-muted underline disabled:opacity-50"
      >
        Убрать
      </button>
    </li>
  )
}

// Числовое поле плана с автосейвом на blur. Пустое/невалидное (<= 0) откатывается.
function PlanField({
  label,
  value,
  step,
  onCommit,
}: {
  label: string
  value: number
  step?: number
  onCommit: (n: number) => void
}) {
  const [text, setText] = useState(String(value))

  function commit() {
    const n = Number(text)
    if (Number.isFinite(n) && n > 0 && n !== value) {
      onCommit(n)
    } else {
      setText(String(value)) // откат к сохранённому
    }
  }

  return (
    <label className="flex w-20 flex-col gap-1 text-xs font-bold text-muted">
      {label}
      <input
        type="number"
        inputMode="decimal"
        step={step ?? 1}
        min={0}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        className="tabular min-h-[44px] rounded-xl border-2 border-border bg-paper px-3 text-center font-bold text-ink"
      />
    </label>
  )
}

function AddExerciseBlock({
  templateId,
  existingExerciseIds,
  nextPosition,
}: {
  templateId: string
  existingExerciseIds: string[]
  nextPosition: number
}) {
  const exercises = useExercises(false)
  const add = useAddTemplateExercise()

  const [exerciseId, setExerciseId] = useState('')
  const [sets, setSets] = useState('3')
  const [reps, setReps] = useState('10')
  const [weight, setWeight] = useState('20')

  const available = (exercises.data ?? []).filter((e) => !existingExerciseIds.includes(e.id))
  const selected = available.find((e) => e.id === exerciseId)
  const isBodyweight = selected?.is_bodyweight ?? false

  const setsN = Number(sets)
  const repsN = Number(reps)
  const weightN = Number(weight)
  const canSubmit =
    exerciseId !== '' &&
    setsN > 0 &&
    repsN > 0 &&
    (isBodyweight || weightN > 0) &&
    !add.isPending

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    await add.mutateAsync({
      templateId,
      exerciseId,
      isBodyweight,
      position: nextPosition,
      setsPlanned: setsN,
      repsPlanned: repsN,
      weight: isBodyweight ? null : weightN,
    })
    setExerciseId('')
    setSets('3')
    setReps('10')
    setWeight('20')
  }

  return (
    <form
      onSubmit={submit}
      className="card-shadow flex flex-col gap-3 rounded-2xl bg-surface p-4"
    >
      <h2 className="text-sm font-bold text-muted uppercase">Добавить упражнение</h2>

      <select
        value={exerciseId}
        onChange={(e) => setExerciseId(e.target.value)}
        className="min-h-[44px] rounded-xl border-2 border-border bg-paper px-3 text-ink"
      >
        <option value="">— выбери упражнение —</option>
        {available.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
            {e.is_bodyweight ? ' (bodyweight)' : ''}
          </option>
        ))}
      </select>

      {available.length === 0 && !exercises.isPending && (
        <p className="text-xs text-muted">
          Все упражнения уже в дне или справочник пуст — заведи новые в разделе «Ещё».
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex w-20 flex-col gap-1 text-xs font-bold text-muted">
          Подходы
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            className="tabular min-h-[44px] rounded-xl border-2 border-border bg-paper px-3 text-center font-bold text-ink"
          />
        </label>
        <label className="flex w-20 flex-col gap-1 text-xs font-bold text-muted">
          Повторы
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="tabular min-h-[44px] rounded-xl border-2 border-border bg-paper px-3 text-center font-bold text-ink"
          />
        </label>
        {!isBodyweight && (
          <label className="flex w-20 flex-col gap-1 text-xs font-bold text-muted">
            Вес, кг
            <input
              type="number"
              inputMode="decimal"
              step={2.5}
              min={0}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="tabular min-h-[44px] rounded-xl border-2 border-border bg-paper px-3 text-center font-bold text-ink"
            />
          </label>
        )}
      </div>

      {add.isError && <p className="text-sm text-danger">{(add.error as Error).message}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="min-h-[48px] rounded-xl bg-brand font-extrabold text-white transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        {add.isPending ? 'Добавляю…' : 'Добавить в день'}
      </button>
    </form>
  )
}
