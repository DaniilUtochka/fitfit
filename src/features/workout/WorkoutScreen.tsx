import { useEffect, useMemo, useRef, useState } from 'react'
import { useDayTemplate, useDayTemplates } from '../days/api'
import { useExercises } from '../exercises/api'
import { Paw } from '../../components/cat'
import { CatArt } from '../../components/cats'
import { markWorkoutFinished } from '../../lib/mascot'
import { catHaptic } from '../../lib/haptics'
import { Skeleton, SkeletonList } from '../../components/Skeleton'
import {
  useActiveSession,
  useCancelWorkout,
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
import {
  cancelAllowed,
  computeSummary,
  countPrs,
  workingRepsFor,
  workingWeightFor,
  type WorkoutSummary,
} from './logic'

export function WorkoutScreen() {
  const active = useActiveSession()
  // Резюме держим здесь: после финиша active_session станет null и ActiveWorkout
  // размонтируется — стейт резюме должен пережить этот переход. Рядом — число
  // личных рекордов сессии (слайс 15): кот на резюме празднует или устало лежит.
  const [result, setResult] = useState<{ summary: WorkoutSummary; prs: number } | null>(null)

  if (result) return <SummaryScreen result={result} onDone={() => setResult(null)} />
  if (active.isPending) return <SkeletonList rows={4} />
  if (active.isError) return <CenterMsg text={`Ошибка: ${(active.error as Error).message}`} danger />

  return active.data ? (
    <ActiveWorkout session={active.data} onFinished={setResult} />
  ) : (
    <DayChooser />
  )
}

function CenterMsg({ text, danger }: { text: string; danger?: boolean }) {
  // Кот-«грузится» ушёл в скелетоны; CenterMsg остался только для ошибок.
  return <p className={danger ? 'text-danger' : 'text-muted'}>{text}</p>
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
        <SkeletonList rows={3} />
      ) : days.isError ? (
        <p className="text-danger">Ошибка: {(days.error as Error).message}</p>
      ) : days.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-sky p-6 text-center">
          <CatArt name="dumbbell" size={108} pop wiggle />
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
// Кот по результату (слайс 15): рекорды — праздник с конфетти, план выполнен —
// довольный, меньше плана — выжатый с полотенцем. «Готово» запоминает финиш —
// кот на кнопке старта Прогресса тоже будет выжатым.
function SummaryScreen({
  result,
  onDone,
}: {
  result: { summary: WorkoutSummary; prs: number }
  onDone: () => void
}) {
  const { summary, prs } = result
  const allDone = summary.doneSets >= summary.plannedSets
  const cat = prs > 0 ? 'joy' : allDone ? 'band' : 'wrecked'
  // Тактильный отклик при показе резюме (cats v2): паттерн — от характера кота.
  // На iOS vibrate нет — тихий no-op (src/lib/haptics.ts).
  useEffect(() => {
    catHaptic(cat === 'joy' ? 'pr' : cat === 'band' ? 'done' : 'wrecked')
  }, [cat])
  return (
    <div className="flex flex-col">
      {/* joy вытянутый вверх — берём меньше, чтобы резюме не расползалось */}
      <CatArt name={cat} size={cat === 'joy' ? 118 : 156} pop parallax={0.12} wiggle />
      {prs > 0 && (
        <p className="text-center text-sm font-extrabold text-brand">
          Личных рекордов: {prs} — план перезапишется сам
        </p>
      )}
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
        onClick={() => {
          markWorkoutFinished()
          onDone()
        }}
        className="mt-6 min-h-[48px] rounded-xl bg-brand px-4 text-[17px] font-extrabold text-white transition-transform active:scale-[0.98]"
      >
        Готово
      </button>
    </div>
  )
}

// ── Активная тренировка (слайс 12: фокус-режим — пейджер + таймер отдыха) ─────────────
type Slide = {
  key: string
  exerciseId: string
  templateExerciseId?: string
  name: string
  isBodyweight: boolean
  planWeight: number | null
  planReps: number
  setsPlanned: number | null
  planText: string
}

function ActiveWorkout({
  session,
  onFinished,
}: {
  session: ActiveSession
  onFinished: (result: { summary: WorkoutSummary; prs: number }) => void
}) {
  const plan = useDayTemplate(session.template_id)
  const sets = useSessionSets(session.id)
  const prev = usePreviousSessionSets(session.template_id, session.id)
  const finish = useFinishWorkout()
  const cancel = useCancelWorkout()
  const [confirmingFinish, setConfirmingFinish] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [extraIds, setExtraIds] = useState<string[]>([])
  const [slide, setSlide] = useState(0)
  const rest = useRestTimer()

  const dayName = session.day_templates?.name ?? 'Тренировка'

  const handleFinish = () => {
    if (!plan.data || !sets.data) return
    // Резюме и рекорды считаем из загруженных plan+sets+prev ДО сброса активной сессии.
    const summary = computeSummary(plan.data.template_exercises, sets.data)
    const prs = countPrs(plan.data.template_exercises, sets.data, prev.data)
    finish.mutate(session.id, { onSuccess: () => onFinished({ summary, prs }) })
  }

  if (plan.isPending || sets.isPending) return <SkeletonList rows={4} />
  if (plan.isError) return <p className="text-danger">Ошибка: {(plan.error as Error).message}</p>
  if (sets.isError) return <p className="text-danger">Ошибка: {(sets.error as Error).message}</p>

  const allSets = sets.data

  // Слайды пейджера: плановые упражнения по порядку, за ними внеплановые.
  const slides: Slide[] = [
    ...plan.data.template_exercises.map((te) => ({
      key: te.id,
      exerciseId: te.exercise_id,
      templateExerciseId: te.id,
      name: te.exercises?.name ?? 'Упражнение',
      isBodyweight: te.weight === null,
      planWeight: te.weight,
      planReps: te.reps_planned,
      setsPlanned: te.sets_planned,
      planText: te.weight === null ? `× ${te.reps_planned}` : `${te.weight}кг × ${te.reps_planned}`,
    })),
    ...extraIds.map((exId) => ({
      key: exId,
      exerciseId: exId,
      name: '',
      isBodyweight: false,
      planWeight: null,
      planReps: 10,
      setsPlanned: null,
      planText: 'вне плана',
    })),
  ]
  const idx = Math.min(slide, slides.length - 1)
  const current = slides[idx]

  const doneOf = (exId: string) => allSets.filter((s) => s.exercise_id === exId).length
  const planDoneOf = (s: Slide) =>
    s.setsPlanned !== null && doneOf(s.exerciseId) >= s.setsPlanned

  const summaryNow = computeSummary(plan.data.template_exercises, allSets)
  const canCancel = cancelAllowed(summaryNow.doneSets, summaryNow.plannedSets)

  return (
    <div className={`flex flex-col ${rest.endsAt !== null ? 'pb-24' : 'pb-2'}`}>
      <header className="mb-3 flex flex-col gap-1.5">
        {/* pr-14: не заезжать под плавающий кружок профиля в правом верхнем углу */}
        <div className="flex items-center justify-between gap-3 pr-14">
          <h1 className="font-display min-w-0 truncate text-2xl font-extrabold tracking-tight text-ink-strong">
            {dayName}
          </h1>
          {confirmingFinish ? (
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={handleFinish}
                disabled={finish.isPending}
                className="min-h-[44px] rounded-xl bg-brand px-3 text-sm font-extrabold text-white disabled:opacity-50"
              >
                Точно завершить?
              </button>
              <button
                onClick={() => setConfirmingFinish(false)}
                className="min-h-[44px] px-2 text-sm text-muted underline"
              >
                Нет
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingFinish(true)}
              className="min-h-[44px] shrink-0 rounded-xl border-2 border-border bg-surface px-3 text-sm font-bold text-ink"
            >
              Завершить
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* Точки прогресса: тап — прыжок к упражнению */}
          <div className="flex min-w-0 items-center gap-1.5">
            <div className="flex flex-wrap items-center gap-0.5">
              {slides.map((sl, i) => (
                <button
                  key={sl.key}
                  aria-label={`Упражнение ${i + 1}`}
                  onClick={() => setSlide(i)}
                  className="grid size-6 place-items-center"
                >
                  <span
                    className={`block size-2.5 rounded-full ${
                      i === idx ? 'bg-brand' : planDoneOf(sl) ? 'bg-success' : 'bg-border'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="tabular shrink-0 text-xs font-bold text-muted">
              {idx + 1}/{slides.length}
            </span>
          </div>

          {/* Отмена видна только пока сделано < 20% плана */}
          {canCancel &&
            (confirmingCancel ? (
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => cancel.mutate(session.id)}
                  disabled={cancel.isPending}
                  className="min-h-[44px] rounded-xl bg-brand px-3 text-xs font-extrabold text-white disabled:opacity-50"
                >
                  Удалить тренировку?
                </button>
                <button
                  onClick={() => setConfirmingCancel(false)}
                  className="min-h-[44px] px-2 text-sm text-muted underline"
                >
                  Нет
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingCancel(true)}
                className="min-h-[44px] shrink-0 px-2 text-xs text-muted underline"
              >
                Отменить
              </button>
            ))}
        </div>
      </header>

      {finish.isError && (
        <p className="mb-3 text-sm text-danger">{(finish.error as Error).message}</p>
      )}
      {cancel.isError && (
        <p className="mb-3 text-sm text-danger">{(cancel.error as Error).message}</p>
      )}

      {slides.length === 0 ? (
        <p className="text-muted">В этом дне нет упражнений.</p>
      ) : (
        <>
          {/* Слайд: одно упражнение на экран */}
          {current.templateExerciseId !== undefined ? (
            <ExerciseCard
              key={current.key}
              sessionId={session.id}
              templateId={session.template_id}
              templateExerciseId={current.templateExerciseId}
              exerciseId={current.exerciseId}
              name={current.name}
              isBodyweight={current.isBodyweight}
              planWeight={current.planWeight}
              planReps={current.planReps}
              setsPlanned={current.setsPlanned}
              ownSets={allSets.filter((x) => x.exercise_id === current.exerciseId)}
              prevSets={prev.data?.[current.exerciseId]}
              onGesture={rest.unlock}
              onLogged={rest.start}
            />
          ) : (
            <ExtraExerciseCard
              key={current.key}
              sessionId={session.id}
              templateId={session.template_id}
              exerciseId={current.exerciseId}
              ownSets={allSets.filter((x) => x.exercise_id === current.exerciseId)}
              prevSets={prev.data?.[current.exerciseId]}
              onGesture={rest.unlock}
              onLogged={rest.start}
            />
          )}

          {/* Навигация пейджера */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              onClick={() => setSlide(Math.max(0, idx - 1))}
              disabled={idx === 0}
              className="card-shadow min-h-[48px] rounded-xl bg-surface px-4 text-sm font-bold text-ink transition-transform active:scale-[0.98] disabled:opacity-30"
            >
              ← Назад
            </button>
            <button
              onClick={() => setSlide(Math.min(slides.length - 1, idx + 1))}
              disabled={idx === slides.length - 1}
              className="card-shadow min-h-[48px] rounded-xl bg-surface px-4 text-sm font-bold text-ink transition-transform active:scale-[0.98] disabled:opacity-30"
            >
              Далее →
            </button>
          </div>

          {/* Добавление внепланового — только на последнем слайде */}
          {idx === slides.length - 1 && (
            <AddExerciseSection
              hiddenIds={[
                ...plan.data.template_exercises.map((te) => te.exercise_id),
                ...extraIds,
              ]}
              onAdd={(exId) => {
                setExtraIds((ids) => [...ids, exId])
                setSlide(slides.length) // сразу к новому слайду
              }}
            />
          )}
        </>
      )}

      {rest.endsAt !== null && (
        <RestBar
          endsAt={rest.endsAt}
          audio={rest.audioRef.audio}
          onAdd={() => rest.add(30)}
          onStop={rest.stop}
        />
      )}
    </div>
  )
}

// ── Таймер отдыха ─────────────────────────────────────────────────────────────────────
const REST_SECONDS = 90

// Состояние таймера — модульный синглтон: переживает смену таба
// (WorkoutScreen размонтируется, отсчёт продолжает идти от timestamp).
const restState: { endsAt: number | null; audio: AudioContext | null } = {
  endsAt: null,
  audio: null,
}

function useRestTimer() {
  const [endsAt, setEndsAt] = useState<number | null>(restState.endsAt)
  useEffect(() => {
    restState.endsAt = endsAt
  }, [endsAt])

  // AudioContext создаём/резюмим синхронно в обработчике тапа «подход» —
  // иначе iOS не разблокирует звук (нужен пользовательский жест).
  const unlock = () => {
    if (!restState.audio) {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (Ctx) restState.audio = new Ctx()
    }
    void restState.audio?.resume()
  }

  const start = () => setEndsAt(Date.now() + REST_SECONDS * 1000)
  const add = (sec: number) => setEndsAt((e) => (e === null ? e : e + sec * 1000))
  const stop = () => setEndsAt(null)

  return { endsAt, unlock, start, add, stop, audioRef: restState }
}

// Липкая панель отдыха: отсчёт, +30с, пропуск. По нулях — бип и надпись
// «Отдых закончен», панель висит до тапа (не исчезает незамеченной).
// Кот отдыхает вместе с атлетом (слайс 15): лежит и дышит, по готовности —
// повязка «поехали». Единственное место анимации в боевом флоу.
function RestBar({
  endsAt,
  audio,
  onAdd,
  onStop,
}: {
  endsAt: number
  audio: AudioContext | null
  onAdd: () => void
  onStop: () => void
}) {
  const [leftMs, setLeftMs] = useState(() => Math.max(0, endsAt - Date.now()))
  const beepedRef = useRef(false)

  useEffect(() => {
    const tick = () => setLeftMs(Math.max(0, endsAt - Date.now()))
    tick()
    const t = setInterval(tick, 250)
    return () => clearInterval(t)
  }, [endsAt])

  useEffect(() => {
    if (leftMs <= 0 && !beepedRef.current) {
      beepedRef.current = true
      beep(audio)
    }
  }, [leftMs, audio])

  const done = leftMs <= 0
  const totalSec = Math.floor((leftMs + 999) / 1000) // округление вверх: полные 1:30
  const mm = Math.floor(totalSec / 60)
  const ss = String(totalSec % 60).padStart(2, '0')

  return (
    <div className="fixed inset-x-0 bottom-[calc(53px+env(safe-area-inset-bottom))] z-20 px-4">
      <div className="card-shadow mx-auto flex max-w-[448px] items-center gap-3 rounded-2xl bg-butter p-3">
        {/* Кот по высоте ~48px: лежебока широкая, повязка вертикальная. Тап — wiggle */}
        <span className="flex w-[48px] shrink-0 items-center justify-center">
          <CatArt name={done ? 'band' : 'loaf'} size={done ? 44 : 60} wiggle />
        </span>
        <span
          className={`font-display tabular text-2xl font-extrabold ${
            done ? 'text-success' : 'text-ink-strong'
          }`}
        >
          {done ? <Paw size={22} /> : `${mm}:${ss}`}
        </span>
        <span className="min-w-0 text-sm font-bold text-ink">
          {done ? 'Отдых закончен' : 'Отдых'}
        </span>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {!done && (
            <button
              onClick={onAdd}
              className="min-h-[44px] rounded-xl border-2 border-ink-strong px-3 text-sm font-extrabold text-ink-strong active:bg-paper"
            >
              +30с
            </button>
          )}
          <button
            onClick={onStop}
            className="min-h-[44px] rounded-xl bg-ink-strong px-3 text-sm font-extrabold text-white"
          >
            {done ? 'Готово' : 'Пропустить'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Короткий бип через WebAudio. Контекст разблокирован тапом «подход»; если
// звука нет (тихий режим iOS, запрет автозвука) — остаётся визуальный сигнал.
// Вибрации на iOS PWA нет (navigator.vibrate не поддерживается).
function beep(ctx: AudioContext | null) {
  if (!ctx) return
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.value = 880
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7)
  osc.start(t)
  osc.stop(t + 0.75)
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
  setsPlanned: number | null
  ownSets: SetRow[]
  prevSets: SetRow[] | undefined
  onGesture?: () => void
  onLogged?: () => void
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
  onGesture?: () => void
  onLogged?: () => void
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
      onGesture={props.onGesture}
      onLogged={props.onLogged}
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
  onGesture?: () => void
  onLogged?: () => void
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
    props.onGesture?.() // синхронно в жесте: разблокировать звук для бипа таймера
    const onSuccess = () => props.onLogged?.() // автостарт таймера отдыха
    if (props.isBodyweight) {
      logSet.mutate(
        {
          sessionId: props.sessionId,
          exerciseId: props.exerciseId,
          weight: null,
          reps: workReps,
          templateId: props.templateId,
          templateExerciseId: props.templateExerciseId,
          isBodyweight: true,
        },
        { onSuccess },
      )
    } else {
      logSet.mutate(
        {
          sessionId: props.sessionId,
          exerciseId: props.exerciseId,
          weight: workWeight,
          reps: props.planReps,
          templateId: props.templateId,
          templateExerciseId: props.templateExerciseId,
          isBodyweight: false,
        },
        { onSuccess },
      )
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
        <Skeleton className="h-[44px] w-full rounded-xl" />
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
