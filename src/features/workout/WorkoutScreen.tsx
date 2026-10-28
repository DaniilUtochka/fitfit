import { useMemo, useState } from 'react'
import { useDayTemplate, useDayTemplates } from '../days/api'
import { useExercises } from '../exercises/api'
import { Cat, Paw } from '../../components/cat'
import {
  useActiveSession,
  useFinishWorkout,
  useLogSet,
  usePreviousSessionSets,
  useSessionSets,
  useStartWorkout,
  useUndoSet,
  useUpdateSet,
  type ActiveSession,
  type SetRow,
} from './api'
import { computeSummary, workingRepsFor, workingWeightFor, type WorkoutSummary } from './logic'

export function WorkoutScreen() {
  const active = useActiveSession()
  // Резюме держим здесь: после финиша active_session станет null и ActiveWorkout
  // размонтируется — стейт резюме должен пережить этот переход.
  const [summary, setSummary] = useState<WorkoutSummary | null>(null)

  if (summary) return <SummaryScreen summary={summary} onDone={() => setSummary(null)} />
  if (active.isPending) return <CenterMsg text="Загрузка…" />
  if (active.isError) return <CenterMsg text={`Ошибка: ${(active.error as Error).message}`} danger />

  return active.data ? (
    <ActiveWorkout session={active.data} onFinished={setSummary} />
  ) : (
    <DayChooser />
  )
}

function CenterMsg({ text, danger }: { text: string; danger?: boolean }) {
  return danger ? (
    <p className="text-danger">{text}</p>
  ) : (
    <div className="flex flex-col items-center gap-2 py-8">
      <Cat mood="sleepy" size={72} />
      <p className="font-bold text-muted">{text}</p>
    </div>
  )
}

// ── Нет активной тренировки: выбор дня ────────────────────────────────────────────────
function DayChooser() {
  const days = useDayTemplates(false)
  const start = useStartWorkout()

  return (
    <div className="flex flex-col">
      <h1 className="font-display mb-4 text-3xl font-extrabold tracking-tight text-ink-strong">
        Тренировка
      </h1>
      <h2 className="mt-2 mb-2 text-sm font-bold text-muted uppercase">Выбери день</h2>

      {days.isPending ? (
        <CenterMsg text="Загрузка…" />
      ) : days.isError ? (
        <p className="text-danger">Ошибка: {(days.error as Error).message}</p>
      ) : days.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-sky p-6 text-center">
          <Cat mood="sleepy" size={80} />
          <p className="font-bold text-ink">Дней пока нет</p>
          <p className="text-sm text-muted">Собери первый день в разделе «Дни»</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {days.data.map((day) => (
            <li key={day.id}>
              <button
                onClick={() => start.mutate(day.id)}
                disabled={start.isPending}
                className="card-shadow flex min-h-[60px] w-full items-center justify-between rounded-2xl bg-surface px-4 text-left transition-transform active:scale-[0.98] disabled:opacity-50"
              >
                <span className="font-bold text-ink-strong">{day.name}</span>
                <span className="text-sm font-extrabold text-brand">Начать →</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {start.isError && <p className="mt-3 text-sm text-danger">{(start.error as Error).message}</p>}
    </div>
  )
}

// ── Экран резюме ──────────────────────────────────────────────────────────────────────
function SummaryScreen({ summary, onDone }: { summary: WorkoutSummary; onDone: () => void }) {
  const allDone = summary.doneSets >= summary.plannedSets
  return (
    <div className="flex flex-col">
      <Cat mood="happy" size={120} />
      <h1 className="font-display mt-1 mb-4 text-center text-2xl font-extrabold tracking-tight text-ink-strong">
        Тренировка завершена
      </h1>
      <div className="flex flex-col gap-3">
        {/* «Паспарту»: белая карточка + цветная панель внутри (docs/DESIGN.md) */}
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
      <button
        onClick={onDone}
        className="mt-6 min-h-[48px] rounded-xl bg-brand px-4 text-[17px] font-extrabold text-white transition-transform active:scale-[0.98]"
      >
        Готово
      </button>
    </div>
  )
}

// ── Активная тренировка ───────────────────────────────────────────────────────────────
function ActiveWorkout({
  session,
  onFinished,
}: {
  session: ActiveSession
  onFinished: (summary: WorkoutSummary) => void
}) {
  const plan = useDayTemplate(session.template_id)
  const sets = useSessionSets(session.id)
  const prev = usePreviousSessionSets(session.template_id, session.id)
  const finish = useFinishWorkout()
  const [confirming, setConfirming] = useState(false)
  const [extraIds, setExtraIds] = useState<string[]>([])

  const dayName = session.day_templates?.name ?? 'Тренировка'

  const handleFinish = () => {
    if (!plan.data || !sets.data) return
    // Резюме считаем из загруженных plan+sets ДО сброса активной сессии.
    const summary = computeSummary(plan.data.template_exercises, sets.data)
    finish.mutate(session.id, { onSuccess: () => onFinished(summary) })
  }

  return (
    <div className="flex flex-col">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-display min-w-0 truncate text-2xl font-extrabold tracking-tight text-ink-strong">
          {dayName}
        </h1>
        {confirming ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={handleFinish}
              disabled={finish.isPending}
              className="min-h-[44px] rounded-xl bg-brand px-3 text-sm font-extrabold text-white disabled:opacity-50"
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
            className="min-h-[44px] shrink-0 rounded-xl border-2 border-border bg-surface px-3 text-sm font-bold text-ink"
          >
            Завершить
          </button>
        )}
      </header>

      {finish.isError && (
        <p className="mb-3 text-sm text-danger">{(finish.error as Error).message}</p>
      )}

      {plan.isPending || sets.isPending ? (
        <CenterMsg text="Загрузка…" />
      ) : plan.isError ? (
        <p className="text-danger">Ошибка: {(plan.error as Error).message}</p>
      ) : sets.isError ? (
        <p className="text-danger">Ошибка: {(sets.error as Error).message}</p>
      ) : plan.data.template_exercises.length === 0 ? (
        <p className="text-muted">В этом дне нет упражнений.</p>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {plan.data.template_exercises.map((te) => (
              <ExerciseCard
                key={te.id}
                sessionId={session.id}
                templateId={session.template_id}
                templateExerciseId={te.id}
                exerciseId={te.exercise_id}
                name={te.exercises?.name ?? 'Упражнение'}
                isBodyweight={te.weight === null}
                planWeight={te.weight}
                planReps={te.reps_planned}
                setsPlanned={te.sets_planned}
                ownSets={sets.data.filter((s) => s.exercise_id === te.exercise_id)}
                prevSets={prev.data?.[te.exercise_id]}
              />
            ))}
            {extraIds.map((exId) => (
              <ExtraExerciseCard
                key={exId}
                sessionId={session.id}
                templateId={session.template_id}
                exerciseId={exId}
                ownSets={sets.data.filter((s) => s.exercise_id === exId)}
                prevSets={prev.data?.[exId]}
              />
            ))}
          </ul>

          <AddExerciseSection
            hiddenIds={[
              ...plan.data.template_exercises.map((te) => te.exercise_id),
              ...extraIds,
            ]}
            onAdd={(exId) => setExtraIds((prev) => [...prev, exId])}
          />
        </>
      )}
    </div>
  )
}

// ── Карточка упражнения (плановое) ────────────────────────────────────────────────────
function ExerciseCard(props: {
  sessionId: string
  templateId: string
  templateExerciseId: string
  exerciseId: string
  name: string
  isBodyweight: boolean
  planWeight: number | null
  planReps: number
  setsPlanned: number
  ownSets: SetRow[]
  prevSets: SetRow[] | undefined
}) {
  const planText = props.isBodyweight
    ? `× ${props.planReps}`
    : `${props.planWeight}кг × ${props.planReps}`
  return <ExerciseCardBody {...props} planText={planText} />
}

// ── Карточка внепланового упражнения (нет плана, нет ratchet) ──────────────────────────
function ExtraExerciseCard(props: {
  sessionId: string
  templateId: string
  exerciseId: string
  ownSets: SetRow[]
  prevSets: SetRow[] | undefined
}) {
  const ex = useExercises(false)
  const found = ex.data?.find((e) => e.id === props.exerciseId)
  const isBodyweight = found?.is_bodyweight ?? false
  return (
    <ExerciseCardBody
      sessionId={props.sessionId}
      templateId={props.templateId}
      exerciseId={props.exerciseId}
      name={found?.name ?? 'Упражнение'}
      isBodyweight={isBodyweight}
      planWeight={null}
      planReps={10}
      setsPlanned={null}
      ownSets={props.ownSets}
      prevSets={props.prevSets}
      planText="вне плана"
    />
  )
}

// ── Общее тело карточки ───────────────────────────────────────────────────────────────
function ExerciseCardBody(props: {
  sessionId: string
  templateId: string
  templateExerciseId?: string
  exerciseId: string
  name: string
  isBodyweight: boolean
  planWeight: number | null
  planReps: number
  setsPlanned: number | null
  ownSets: SetRow[]
  prevSets: SetRow[] | undefined
  planText: string
}) {
  const logSet = useLogSet()
  const undoSet = useUndoSet()
  const busy = logSet.isPending || undoSet.isPending

  // Реконструкция рабочего значения при перезаходе: последний подход, иначе план.
  // Ключом фиксируем начальное значение по загруженным подходам (см. render key).
  const [workWeight, setWorkWeight] = useState(
    () => workingWeightFor(props.ownSets, props.exerciseId, props.planWeight) ?? 20,
  )
  const [workReps, setWorkReps] = useState(() =>
    workingRepsFor(props.ownSets, props.exerciseId, props.planReps),
  )
  const [skipped, setSkipped] = useState(false)

  const done = props.ownSets.length
  const orderedSets = useMemo(
    () => [...props.ownSets].sort((a, b) => a.set_number - b.set_number),
    [props.ownSets],
  )

  const prevText =
    props.prevSets && props.prevSets.length > 0
      ? props.prevSets
          .map((s) => (s.weight !== null ? `${s.weight}×${s.reps}` : `×${s.reps}`))
          .join(', ')
      : '—'

  const logWorking = () => {
    if (props.isBodyweight) {
      logSet.mutate({
        sessionId: props.sessionId,
        exerciseId: props.exerciseId,
        weight: null,
        reps: workReps,
        templateId: props.templateId,
        templateExerciseId: props.templateExerciseId,
        isBodyweight: true,
      })
    } else {
      logSet.mutate({
        sessionId: props.sessionId,
        exerciseId: props.exerciseId,
        weight: workWeight,
        reps: props.planReps,
        templateId: props.templateId,
        templateExerciseId: props.templateExerciseId,
        isBodyweight: false,
      })
    }
  }

  const planDone = props.setsPlanned !== null && done >= props.setsPlanned

  return (
    <li
      className={`card-shadow flex flex-col gap-3 rounded-2xl bg-surface p-4 ${
        skipped ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate font-bold text-ink-strong">{props.name}</span>
        <span className="tabular shrink-0 rounded-full bg-lilac px-2.5 py-1 text-xs font-extrabold text-ink">
          {props.planText}
        </span>
      </div>

      <p className="border-t-2 border-dashed border-line-2 pt-2 text-xs text-muted">
        Прошлый раз: {prevText}
      </p>

      {/* Рабочее значение: степпер. Правка не пишет в базу — влияет на следующий «+». */}
      <div className="flex items-center gap-2">
        <button
          aria-label={props.isBodyweight ? 'Меньше повторов' : 'Меньше веса'}
          onClick={() =>
            props.isBodyweight
              ? setWorkReps((r) => Math.max(1, r - 1))
              : setWorkWeight((w) => Math.max(2.5, w - 2.5))
          }
          className="grid min-h-[44px] w-12 place-items-center rounded-xl border-2 border-border bg-surface text-xl text-ink active:bg-paper"
        >
          −
        </button>
        <span className="font-display tabular flex-1 text-center text-lg font-extrabold text-ink-strong">
          {props.isBodyweight ? `${workReps} повт.` : `${workWeight} кг`}
        </span>
        <button
          aria-label={props.isBodyweight ? 'Больше повторов' : 'Больше веса'}
          onClick={() =>
            props.isBodyweight
              ? setWorkReps((r) => r + 1)
              : setWorkWeight((w) => w + 2.5)
          }
          className="grid min-h-[44px] w-12 place-items-center rounded-xl border-2 border-border bg-surface text-xl text-ink active:bg-paper"
        >
          +
        </button>
      </div>

      {/* Подходы списком: тап по строке → inline-правка, сохранение на blur. */}
      {orderedSets.length > 0 && (
        <ul className="flex flex-col gap-1">
          {orderedSets.map((s) => (
            <SetRowEditable
              key={s.id}
              sessionId={props.sessionId}
              set={s}
              isBodyweight={props.isBodyweight}
            />
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-2">
        <span
          className={`tabular flex items-center gap-1 text-sm font-bold ${
            planDone ? 'text-success' : 'text-muted'
          }`}
        >
          {planDone && <Paw size={13} />}
          {props.setsPlanned !== null ? `${done}/${props.setsPlanned}` : `${done} подх.`}
        </span>
        <button
          onClick={() => setSkipped((v) => !v)}
          className="min-h-[44px] px-2 text-xs text-muted underline"
        >
          {skipped ? 'Вернуть' : 'Пропустить'}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          aria-label="Отменить подход"
          onClick={() => undoSet.mutate({ sessionId: props.sessionId, exerciseId: props.exerciseId })}
          disabled={busy || done === 0}
          className="grid min-h-[48px] flex-1 place-items-center rounded-xl border-2 border-border bg-surface text-2xl text-ink disabled:opacity-30"
        >
          −
        </button>
        <button
          aria-label="Отметить подход"
          onClick={logWorking}
          disabled={busy}
          className="flex min-h-[48px] flex-[2] items-center justify-center gap-2 rounded-xl bg-brand text-lg font-extrabold text-white transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          <Paw size={18} className="text-white" />
          подход
        </button>
      </div>

      {logSet.isError && <p className="text-sm text-danger">{(logSet.error as Error).message}</p>}
      {undoSet.isError && <p className="text-sm text-danger">{(undoSet.error as Error).message}</p>}
    </li>
  )
}

// ── Строка подхода с inline-правкой ───────────────────────────────────────────────────
function SetRowEditable({
  sessionId,
  set,
  isBodyweight,
}: {
  sessionId: string
  set: SetRow
  isBodyweight: boolean
}) {
  const update = useUpdateSet()
  const [editing, setEditing] = useState(false)

  const label = set.weight !== null ? `${set.weight}×${set.reps}` : `×${set.reps}`

  if (!editing) {
    return (
      <li>
        <button
          onClick={() => setEditing(true)}
          className="tabular flex min-h-[44px] w-full items-center justify-between rounded-xl bg-paper px-3 text-left"
        >
          <span className="text-xs text-muted">№{set.set_number}</span>
          <span className="font-bold text-ink-strong">{label}</span>
        </button>
        {update.isError && (
          <p className="text-xs text-danger">{(update.error as Error).message}</p>
        )}
      </li>
    )
  }

  const saveWeight = (raw: string) => {
    const v = Number(raw.replace(',', '.'))
    if (Number.isFinite(v) && v > 0 && v !== set.weight) {
      update.mutate({ sessionId, setId: set.id, weight: v })
    }
  }
  const saveReps = (raw: string) => {
    const v = Number.parseInt(raw, 10)
    if (Number.isFinite(v) && v > 0 && v !== set.reps) {
      update.mutate({ sessionId, setId: set.id, reps: v })
    }
  }

  return (
    <li>
      <div
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setEditing(false)
        }}
        className="tabular flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-brand bg-paper px-3"
      >
        <span className="text-xs text-muted">№{set.set_number}</span>
        {!isBodyweight && (
          <input
            type="number"
            inputMode="decimal"
            step="2.5"
            defaultValue={set.weight ?? ''}
            onBlur={(e) => saveWeight(e.target.value)}
            aria-label="Вес"
            className="min-h-[44px] w-16 rounded-lg border border-border bg-surface px-2 text-center font-bold text-ink-strong"
          />
        )}
        <span className="text-muted">×</span>
        <input
          type="number"
          inputMode="numeric"
          step="1"
          defaultValue={set.reps}
          onBlur={(e) => saveReps(e.target.value)}
          aria-label="Повторы"
          className="min-h-[44px] w-14 rounded-lg border border-border bg-surface px-2 text-center font-bold text-ink-strong"
        />
      </div>
    </li>
  )
}

// ── Добавить внеплановое упражнение ───────────────────────────────────────────────────
function AddExerciseSection({
  hiddenIds,
  onAdd,
}: {
  hiddenIds: string[]
  onAdd: (exerciseId: string) => void
}) {
  const ex = useExercises(false)
  const [picked, setPicked] = useState('')

  const options = (ex.data ?? []).filter((e) => !hiddenIds.includes(e.id))

  return (
    <section className="mt-4">
      <h2 className="mb-2 text-sm font-bold text-muted uppercase">Добавить упражнение</h2>
      {ex.isPending ? (
        <p className="text-muted">Загрузка…</p>
      ) : ex.isError ? (
        <p className="text-danger">Ошибка: {(ex.error as Error).message}</p>
      ) : options.length === 0 ? (
        <p className="text-sm text-muted">Все упражнения уже в списке.</p>
      ) : (
        <div className="flex items-center gap-2">
          <select
            value={picked}
            onChange={(e) => setPicked(e.target.value)}
            className="min-h-[44px] flex-1 rounded-xl border-2 border-border bg-surface px-3 text-ink-strong"
          >
            <option value="">Выбери упражнение…</option>
            {options.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              if (!picked) return
              onAdd(picked)
              setPicked('')
            }}
            disabled={!picked}
            className="min-h-[44px] rounded-xl bg-brand px-4 font-extrabold text-white disabled:opacity-40"
          >
            +
          </button>
        </div>
      )}
    </section>
  )
}
