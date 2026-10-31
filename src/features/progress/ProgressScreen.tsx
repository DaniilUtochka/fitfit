import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Paw } from '../../components/cat'
import { CatArt, catAspect, type CatName } from '../../components/cats'
import { consumeAppUpdated, pickCtaCat, readFinishedAt } from '../../lib/mascot'
import { useProgressData, type ProgressData } from './api'
import { formatDateShort } from '../history/logic'
import {
  bestStreakWeeks,
  computeLifeGain,
  currentStreakWeeks,
  formatHours,
  formatLifeDays,
  formatLifeYears,
  formatNumberRu,
  formatTonnage,
  formatWeeks,
  formatWorkouts,
  heaviestSession,
  maxWeightByExercise,
  SESSION_CAP_MINUTES,
  topGroupsWithRest,
  topMaxWeights,
  tonnageByGroup,
  totalMinutes,
  totalTonnage,
  weekStart,
  weeklyTonnageBars,
} from './logic'

// Прогресс (слайс 13): мотивирующие цифры по docs/PROGRESS-UX.md.
// Экран read-only: TanStack Query отдаёт кэш офлайн, ничего дополнительно не придумываем.
// Прогресс — главный экран: снизу всегда прибита кнопка «Начать тренировку»,
// контент подстраивается паддингом, чтобы кнопка ничего не перекрывала.
export function ProgressScreen() {
  const query = useProgressData()

  // Кот на кнопке — единственный постоянный маскот экрана (правило DESIGN.md):
  // утром тянется, вечером спит, после свежей тренировки выжат, вернулся после
  // перерыва — «с возвращением» на коврике.
  const ctaCat = useMemo(
    () =>
      pickCtaCat({
        now: Date.now(),
        hour: new Date().getHours(),
        lastSessionAt: lastSessionEnd(query.data?.sessions),
        finishedAt: readFinishedAt(),
      }),
    [query.data],
  )

  let body: React.ReactNode
  if (query.isPending) {
    body = (
      <StatePanel>
        <CatArt name="sleepy" size={148} />
        <p className="font-bold text-muted">Считаю твой прогресс…</p>
      </StatePanel>
    )
  } else if (query.isError) {
    body = (
      <StatePanel>
        <CatArt name="wrecked" size={108} />
        <p className="font-bold text-ink">Не смог посчитать прогресс</p>
        <button
          onClick={() => void query.refetch()}
          className="mt-1 inline-flex min-h-[44px] items-center text-sm font-extrabold text-brand underline"
        >
          Обновить
        </button>
      </StatePanel>
    )
  } else if (query.data.sessions.length === 0) {
    body = <EmptyState />
  } else {
    body = <FullProgress data={query.data} now={new Date()} />
  }

  return (
    <>
      {/* 56px кнопка + воздух: паддинг живёт на контенте, кнопка фиксирована на safe-area */}
      <div className="pb-[calc(env(safe-area-inset-bottom)+4.5rem)]">{body}</div>
      <StartWorkoutButton cat={ctaCat} />
      <UpdateJoy />
    </>
  )
}

// Конец последней тренировки: max finished_at. Без тренировок — null.
function lastSessionEnd(sessions: ProgressData['sessions'] | undefined): number | null {
  if (!sessions || sessions.length === 0) return null
  return Math.max(...sessions.map((s) => new Date(s.finished_at).getTime()))
}

// Большая кнопка старта: fixed к низу, поверх контента, тап ведёт на /workout —
// там уже решается «выбор дня или активная тренировка». Кот лежит на верхнем
// краю кнопки: pointer-events-none, тап-таргет не меняет, котом не является.
// Верх считаем из аспекта спрайта, чтобы низ кота всегда был на 14px внутри кнопки.
function StartWorkoutButton({ cat }: { cat: CatName }) {
  const size = 80
  return (
    <Link
      to="/workout"
      className="card-shadow fixed inset-x-0 bottom-[env(safe-area-inset-bottom)] z-40 mx-auto flex min-h-[56px] w-[min(calc(100%-2rem),27.5rem)] items-center justify-center gap-2 rounded-xl bg-brand text-lg font-extrabold text-white transition-transform active:scale-[0.98]"
    >
      <span
        className="pointer-events-none absolute left-4"
        style={{ top: 14 - size * catAspect(cat) }}
      >
        <CatArt name={cat} size={size} />
      </span>
      <Paw size={22} />
      Начать тренировку
    </Link>
  )
}

// Разовый праздник после принудительного обновления PWA (слайс 15): pwa.ts
// ставит флаг перед релоадом, тут кот с конфетти показывается один раз.
function UpdateJoy() {
  const [show, setShow] = useState(consumeAppUpdated)

  useEffect(() => {
    if (!show) return
    const t = setTimeout(() => setShow(false), 3400)
    return () => clearTimeout(t)
  }, [show])

  if (!show) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(4.75rem+env(safe-area-inset-top))] z-30 flex flex-col items-center">
      <CatArt name="joy" size={86} />
      <p className="card-shadow -mt-1 rounded-full bg-butter px-3 py-1 text-xs font-extrabold text-ink-strong">
        FitFit обновился
      </p>
    </div>
  )
}

function StatePanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <h1 className="font-display mb-4 text-3xl font-extrabold tracking-tight text-ink-strong">
        Прогресс
      </h1>
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-sky p-6 text-center">
        {children}
      </div>
    </div>
  )
}

// Пустое состояние (§5): нули не показываем — приглашение начать.
// CTA не дублируем: большая кнопка «Начать тренировку» уже прибита к низу экрана.
function EmptyState() {
  return (
    <div className="flex flex-col">
      <h1 className="font-display mb-4 text-3xl font-extrabold tracking-tight text-ink-strong">
        Прогресс
      </h1>
      <div className="flex flex-col items-center gap-1 rounded-2xl bg-sky p-6 text-center">
        <CatArt name="band" size={130} />
        <p className="mt-2 text-[17px] font-bold text-ink-strong">Тут появятся твои цифры</p>
        <p className="text-sm text-muted">
          Тонны, часы и даже «+дни жизни».
          <br />
          Для начала — одна тренировка.
        </p>
      </div>
    </div>
  )
}

function FullProgress({ data, now }: { data: ProgressData; now: Date }) {
  const life = computeLifeGain(data.sessions, now)
  const tonnage = totalTonnage(data.sets)
  const minutes = totalMinutes(data.sessions)
  const streak = currentStreakWeeks(data.sessions, now)
  const best = bestStreakWeeks(data.sessions)
  const bars = weeklyTonnageBars(data.sessions, data.sets, now, 8)
  const groups = topGroupsWithRest(tonnageByGroup(data.sets, data.primaryGroups), 5)
  const heaviest = heaviestSession(data.sessions, data.sets)
  const maxWeights = topMaxWeights(maxWeightByExercise(data.sets), data.exerciseNames, 3)
  const thisWeekStart = weekStart(now).getTime()
  const thisWeekHasWorkout = data.sessions.some(
    (s) => weekStart(new Date(s.started_at)).getTime() === thisWeekStart,
  )

  return (
    <div className="flex flex-col gap-3.5">
      <h1 className="font-display mb-1 text-3xl font-extrabold tracking-tight text-ink-strong">
        Прогресс
      </h1>

      <LifeGainHero life={life} totalWorkouts={data.sessions.length} />

      {/* Факты: тоннаж + время, две sky-панели в одном паспарту (§4.2) */}
      <div className="card-shadow rounded-2xl bg-surface p-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col rounded-[16px] bg-sky p-4">
            <p className="text-sm font-bold text-ink-2">Тоннаж</p>
            <p className="font-display tabular mt-2 text-[28px] leading-none font-extrabold text-ink-strong">
              {formatTonnage(tonnage)}
            </p>
            {tonnage === 0 && (
              <p className="mt-2 text-xs text-muted">bodyweight-упражнения вне тоннажа</p>
            )}
          </div>
          <div className="flex flex-col rounded-[16px] bg-sky p-4">
            <p className="text-sm font-bold text-ink-2">Время в зале</p>
            <p className="font-display tabular mt-2 text-[28px] leading-none font-extrabold text-ink-strong">
              {formatHours(minutes)}
            </p>
            <p className="mt-2 text-xs text-muted">одна тренировка считается до 4 ч</p>
          </div>
        </div>
      </div>

      {/* Тренировки и стрик — mint, единственный блок про серию успеха (§4.3) */}
      <div className="card-shadow rounded-2xl bg-surface p-2.5">
        <div className="rounded-[16px] bg-mint p-4">
          <p className="tabular flex items-center gap-2 text-[17px] font-extrabold text-ink-strong">
            <Paw size={18} className="shrink-0 text-success" />
            <span>
              {formatWorkouts(data.sessions.length)} · стрик {formatWeeks(streak)}
            </span>
          </p>
          {!thisWeekHasWorkout && (
            <p className="mt-2 text-xs text-muted">
              эта неделя пока без тренировки — стрик не сгорит до воскресенья
            </p>
          )}
        </div>
      </div>

      {/* Бары 8 недель — мотивационная картинка, не интерактив (§4.4) */}
      <WeeklyBarsCard bars={bars} />

      {/* Группы мышц: основная группа, top-5 + «Прочее» (§4.5, О7) */}
      {groups.top.length > 0 && <GroupsCard groups={groups} />}

      {/* Рекорды — белая карточка, факты (§4.6) */}
      <RecordsCard
        heaviest={heaviest}
        bestStreak={best}
        maxWeights={maxWeights}
        hiddenMaxWeights={Math.max(0, Object.keys(maxWeightByExercise(data.sets)).length - 3)}
      />

      {/* Про Паркинсон — подвал, другой регистр: без пастели и без кота (§4.7, О4) */}
      <section className="card-shadow rounded-2xl bg-surface p-4">
        <h2 className="text-[17px] font-bold text-ink-strong">Про Паркинсон</h2>
        <p className="mt-1 text-sm text-ink-2">
          Про силовую наука пока не отвечает. Про активность в целом: у самых активных людей
          Паркинсон встречался на четверть реже. Это ассоциация на популяции, не прогноз для тебя.
        </p>
      </section>
    </div>
  )
}

// Герой «+дни жизни» (§4.1): lilac, кот happy «вручает» цифру, дисклеймер-сноска.
function LifeGainHero({ life, totalWorkouts }: { life: ReturnType<typeof computeLifeGain>; totalWorkouts: number }) {
  const [open, setOpen] = useState(false)
  const days = Math.round(life.days)
  const zeroed = days <= 0 // тренировки были, но за 28 дней тишина — D = 0
  const fewData = totalWorkouts <= 3

  return (
    <div className="card-shadow rounded-2xl bg-surface p-2.5">
      <div className="rounded-[16px] bg-lilac p-4">
        <p className="text-sm font-bold text-ink-2">Железо уже подарило тебе</p>
        <div className="mt-1 flex items-end justify-between gap-2">
          <p className="tabular">
            <span className="font-display text-[44px] leading-none font-extrabold text-ink-strong">
              {formatLifeDays(life.days)}
            </span>
          </p>
        </div>
        <p className="mt-1.5 text-sm text-ink-2">
          {zeroed
            ? 'в последние 4 недели тишина — цифра обнулилась, вернись и отними её обратно'
            : formatLifeYears(life.years) + ' жизни'}
        </p>
        {fewData && !zeroed && (
          <p className="mt-1 text-xs text-muted">цифра живая — считается по последним 4 неделям</p>
        )}
        <p className="mt-2 text-xs text-muted">
          Игривая оценка из популяционных исследований, не медицина. Не учитывает кардио, питание,
          генетику.
        </p>

        <div className="mt-3 border-t-2 border-dashed border-line-2" />
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="mt-1 flex min-h-[44px] w-full items-center justify-between gap-2 text-left"
        >
          <span className="text-sm font-bold text-ink-2">Почему такая цифра?</span>
          <span className="text-sm font-bold text-muted">{open ? '▴' : '▾'}</span>
        </button>
        {open && (
          <div className="pb-2 text-sm text-ink-2">
            <p>
              Считаю по последним 4 неделям: ~{Math.round(life.weeklyMinutes)} мин силовой в
              неделю. По мета-анализу Momma 2022 это ~ −{Math.round(life.reductionPct)}% риска →{' '}
              {formatLifeYears(life.years)}.
            </p>
            <p className="mt-2">
              После 60 мин/нед прирост останавливается — поэтому одна лишняя тренировка почти не
              двигает цифру. Это честная экстраполяция популяционных данных, не твой прогноз.
            </p>
            <p className="mt-2 text-xs text-muted">
              «учитываем до {Math.round(SESSION_CAP_MINUTES / 60)} ч» на сессию
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Бары 8 недель (§4.4): без осей и тапов, текущая неделя dashed — она неполная.
function WeeklyBarsCard({ bars }: { bars: ReturnType<typeof weeklyTonnageBars> }) {
  const maxTonnage = Math.max(...bars.map((b) => b.tonnage), 1)

  return (
    <section className="card-shadow rounded-2xl bg-surface p-4">
      <h2 className="text-[17px] font-bold text-ink-strong">Тоннаж по неделям</h2>
      <div className="mt-3 flex items-end justify-between gap-1.5">
        {bars.map((b, i) => {
          const isCurrent = i === bars.length - 1
          const height = Math.max(6, Math.round((b.tonnage / maxTonnage) * 64))
          return (
            <div key={b.start.getTime()} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="flex h-[64px] w-full items-end justify-center">
                {b.tonnage > 0 ? (
                  <div
                    className={
                      'w-full rounded-t-[6px] bg-lilac' +
                      (isCurrent ? ' border-2 border-dashed border-line-2' : '')
                    }
                    style={{ height }}
                  />
                ) : isCurrent ? (
                  <div className="size-[8px] rounded-[2px] border-2 border-dashed border-line-2" />
                ) : (
                  <div className="size-1 rounded-full bg-lilac" />
                )}
              </div>
              <span className="tabular text-xs text-muted">{b.start.getDate()}</span>
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-xs text-muted">текущая неделя — последняя, ещё растёт</p>
    </section>
  )
}

// Группы мышц (§4.5): lilac-бары на paper, длина — доля от максимума группы.
function GroupsCard({
  groups,
}: {
  groups: ReturnType<typeof topGroupsWithRest>
}) {
  const maxTonnage = Math.max(...groups.top.map((g) => g.tonnage), 1)

  return (
    <section className="card-shadow rounded-2xl bg-surface p-4">
      <h2 className="text-[17px] font-bold text-ink-strong">Тоннаж по группам</h2>
      <ul className="mt-3 flex flex-col gap-2.5">
        {groups.top.map((g) => (
          <li key={g.name} className="flex items-center gap-2.5">
            <span className="w-[88px] min-w-0 shrink-0 truncate text-sm font-bold text-ink-2">
              {g.name}
            </span>
            <span className="h-[10px] min-w-0 flex-1 overflow-hidden rounded-full bg-paper">
              <span
                className="block h-full rounded-full bg-lilac"
                style={{ width: `${Math.max(4, Math.round((g.tonnage / maxTonnage) * 100))}%` }}
              />
            </span>
            <span className="font-display tabular w-[56px] shrink-0 text-right text-sm font-bold text-ink-strong">
              {formatTonnage(g.tonnage)}
            </span>
          </li>
        ))}
        {groups.rest !== null && (
          <li className="flex items-center justify-between border-t-2 border-dashed border-line-2 pt-2.5">
            <span className="text-sm font-bold text-ink-2">Прочее</span>
            <span className="font-display tabular text-sm font-bold text-ink-strong">
              {formatTonnage(groups.rest)}
            </span>
          </li>
        )}
      </ul>
    </section>
  )
}

// Рекорды (§4.6): три факта, строки через dashed. Если упражнений с максимумом
// веса больше 3 — топ-3 и ссылка «и ещё N — в истории».
function RecordsCard({
  heaviest,
  bestStreak,
  maxWeights,
  hiddenMaxWeights,
}: {
  heaviest: ReturnType<typeof heaviestSession>
  bestStreak: number
  maxWeights: ReturnType<typeof topMaxWeights>
  hiddenMaxWeights: number
}) {
  return (
    <section className="card-shadow rounded-2xl bg-surface p-4">
      <h2 className="text-[17px] font-bold text-ink-strong">Рекорды</h2>
      <div className="mt-2">
        <div className="py-2">
          <p className="text-sm text-muted">Самый тяжёлый день</p>
          <p className="tabular mt-0.5 text-sm font-bold text-ink-strong">
            {heaviest
              ? `${formatTonnage(heaviest.tonnage)} · ${heaviest.session.dayName} · ${formatDateShort(heaviest.session.started_at)}`
              : '—'}
          </p>
        </div>
        <div className="border-t-2 border-dashed border-line-2 py-2">
          <p className="text-sm text-muted">Лучший стрик</p>
          <p className="tabular mt-0.5 text-sm font-bold text-ink-strong">
            {bestStreak > 0 ? `${formatWeeks(bestStreak)} подряд` : '—'}
          </p>
        </div>
        {maxWeights.map((m, i) => (
          <div
            key={m.name}
            className={
              'py-2' +
              (i === 0 && maxWeights.length > 0 ? ' border-t-2 border-dashed border-line-2' : '')
            }
          >
            <p className="truncate text-sm text-muted">{m.name} — максимум веса</p>
            <p className="tabular mt-0.5 text-sm font-bold text-ink-strong">
              {formatNumberRu(m.weight, m.weight % 1 === 0 ? 0 : 1)} кг
            </p>
          </div>
        ))}
        {hiddenMaxWeights > 0 && (
          <Link
            to="/history"
            className="inline-flex min-h-[44px] items-center border-t-2 border-dashed border-line-2 text-sm font-bold text-brand"
          >
            и ещё {formatNumberRu(hiddenMaxWeights, 0)} — в истории
          </Link>
        )}
      </div>
    </section>
  )
}
