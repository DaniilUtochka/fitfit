// Чистая логика «Прогресса» (слайс 13): формулы из docs/PROGRESS.md.
// Никаких запросов — только вычисления над уже загруженными данными.
// Время везде в минутах, тоннаж в кг (форматирование — отдельные функции ниже).

export const SESSION_CAP_MINUTES = 240 // «одна тренировка считается до 4 ч» (О5)
export const DOSE_WINDOW_DAYS = 28 // окно недельной дозы, сглаживает пропуск недели
export const DOSE_CAP_MINUTES_PER_WEEK = 60 // плато пользы по Momma 2022

export type ProgressSession = {
  id: string
  started_at: string
  finished_at: string
  dayName: string
}

export type ProgressSet = {
  session_id: string
  exercise_id: string
  weight: number | null
  reps: number
}

const MIN = 60_000
const DAY_MS = 86_400_000

// ── Тоннаж и время ─────────────────────────────────────────────────────────────────────

// Длительность сессии в минутах, cap 4 ч: забытая «на весь день» сессия
// не должна раздувать ни «время в зале», ни недельную дозу.
export function sessionMinutes(s: ProgressSession): number {
  const ms = new Date(s.finished_at).getTime() - new Date(s.started_at).getTime()
  return Math.max(0, Math.min(ms / MIN, SESSION_CAP_MINUTES))
}

// Тоннаж = Σ weight·reps; bodyweight (weight null) вне счёта, иначе цифра врёт.
export function totalTonnage(sets: ProgressSet[]): number {
  return sets.reduce((sum, s) => (s.weight !== null ? sum + s.weight * s.reps : sum), 0)
}

// Время в зале = Σ capped-длительностей завершённых сессий.
export function totalMinutes(sessions: ProgressSession[]): number {
  return sessions.reduce((sum, s) => sum + sessionMinutes(s), 0)
}

// ── «+дни жизни»: Momma 2022 + Gompertz-эвристика ──────────────────────────────────────

// Недельная доза силовой (мин/нед): capped-минуты сессий, начатых за последние
// 28 дней, делённые на 4. Атрибуция по started_at.
export function weeklyDoseMinutes(sessions: ProgressSession[], now: Date): number {
  const cutoff = now.getTime() - DOSE_WINDOW_DAYS * DAY_MS
  const minutes = sessions
    .filter((s) => new Date(s.started_at).getTime() >= cutoff)
    .reduce((sum, s) => sum + sessionMinutes(s), 0)
  return minutes / 4
}

// Снижение риска: 15% на дозе 60 мин/нед (середина диапазона Momma), выше — плато.
export function riskReduction(weeklyMinutes: number): number {
  return 0.15 * (Math.min(weeklyMinutes, DOSE_CAP_MINUTES_PER_WEEK) / DOSE_CAP_MINUTES_PER_WEEK)
}

// Gompertz-эвристика: смертность удваивается каждые 8 лет, поэтому постоянный
// сдвиг риска RR ≈ +8·log₂(1/RR) лет. Дни = 365·годы. При D=0 → 0 дней.
export function lifeGainDays(weeklyMinutes: number): number {
  const rr = 1 - riskReduction(weeklyMinutes)
  return 365 * 8 * Math.log2(1 / rr)
}

export type LifeGain = {
  weeklyMinutes: number
  reductionPct: number // снижение риска в процентах, 0…15
  years: number
  days: number
}

// Всё для героя одним расчётом.
export function computeLifeGain(sessions: ProgressSession[], now: Date): LifeGain {
  const weeklyMinutes = weeklyDoseMinutes(sessions, now)
  const days = lifeGainDays(weeklyMinutes)
  return {
    weeklyMinutes,
    reductionPct: riskReduction(weeklyMinutes) * 100,
    years: days / 365,
    days,
  }
}

// ── Недели (пн-вс, локальная зона устройства) ──────────────────────────────────────────

// Начало календарной недели (понедельник, 00:00 локального времени).
export function weekStart(d: Date): Date {
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dow = day.getDay() // 0 = воскресенье
  day.setDate(day.getDate() + (dow === 0 ? -6 : 1 - dow))
  return day
}

function addWeeks(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + 7 * n)
  return r
}

function sessionWeekStarts(sessions: ProgressSession[]): Set<number> {
  return new Set(sessions.map((s) => weekStart(new Date(s.started_at)).getTime()))
}

// Текущий стрик в неделях: недели подряд с ≥1 завершённой сессией.
// Текущая (ещё не закончившаяся) неделя без тренировки стрик не рвёт.
export function currentStreakWeeks(sessions: ProgressSession[], now: Date): number {
  const weeks = sessionWeekStarts(sessions)
  let w = weekStart(now)
  if (!weeks.has(w.getTime())) w = addWeeks(w, -1)
  let n = 0
  while (weeks.has(w.getTime())) {
    n += 1
    w = addWeeks(w, -1)
  }
  return n
}

// Лучший стрик за всю историю — для «Рекордов».
export function bestStreakWeeks(sessions: ProgressSession[]): number {
  const starts = [...sessionWeekStarts(sessions)].map((t) => new Date(t))
  starts.sort((a, b) => a.getTime() - b.getTime())
  let best = 0
  let run = 0
  let prev: Date | null = null
  for (const d of starts) {
    run = prev !== null && addWeeks(prev, 1).getTime() === d.getTime() ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return best
}

export type WeekBar = { start: Date; tonnage: number }

// Тоннаж по календарным неделям: `count` недель, последняя — текущая (растущая).
// Недели без тренировок — нулевые столбики.
export function weeklyTonnageBars(
  sessions: ProgressSession[],
  sets: ProgressSet[],
  now: Date,
  count = 8,
): WeekBar[] {
  const startBySession = new Map(
    sessions.map((s) => [s.id, weekStart(new Date(s.started_at)).getTime()]),
  )
  const bars: WeekBar[] = []
  for (let i = count - 1; i >= 0; i--) bars.push({ start: addWeeks(weekStart(now), -i), tonnage: 0 })

  for (const s of sets) {
    const ws = startBySession.get(s.session_id)
    if (ws === undefined || s.weight === null) continue
    const bar = bars.find((b) => b.start.getTime() === ws)
    if (bar) bar.tonnage += s.weight * s.reps
  }
  return bars
}

// ── Группы мышц (только основная группа, О7) ───────────────────────────────────────────

// Тоннаж подхода аттрибуируется основной группе упражнения. Подходы упражнений
// без основной группы не считаются (некуда аттрибуировать).
export function tonnageByGroup(
  sets: ProgressSet[],
  primaryGroup: Record<string, string>,
): { name: string; tonnage: number }[] {
  const acc = new Map<string, number>()
  for (const s of sets) {
    const group = primaryGroup[s.exercise_id]
    if (!group || s.weight === null) continue
    acc.set(group, (acc.get(group) ?? 0) + s.weight * s.reps)
  }
  return [...acc.entries()]
    .map(([name, tonnage]) => ({ name, tonnage }))
    .sort((a, b) => b.tonnage - a.tonnage)
}

// Top-N + «Прочее» (rest = null, если групп не больше N).
export function topGroupsWithRest(
  groups: { name: string; tonnage: number }[],
  n = 5,
): { top: { name: string; tonnage: number }[]; rest: number | null } {
  if (groups.length <= n) return { top: groups, rest: null }
  const rest = groups.slice(n).reduce((sum, g) => sum + g.tonnage, 0)
  return { top: groups.slice(0, n), rest }
}

// ── Рекорды ────────────────────────────────────────────────────────────────────────────

// Самый тяжёлый день: максимальный тоннаж одной завершённой сессии.
export function heaviestSession(
  sessions: ProgressSession[],
  sets: ProgressSet[],
): { session: ProgressSession; tonnage: number } | null {
  if (sessions.length === 0) return null
  const tonnageBySession = new Map<string, number>()
  for (const s of sets) {
    if (s.weight === null) continue
    tonnageBySession.set(s.session_id, (tonnageBySession.get(s.session_id) ?? 0) + s.weight * s.reps)
  }
  let best: ProgressSession | null = null
  let bestTonnage = 0
  for (const s of sessions) {
    const t = tonnageBySession.get(s.id) ?? 0
    if (best === null || t > bestTonnage) {
      best = s
      bestTonnage = t
    }
  }
  return best === null ? null : { session: best, tonnage: bestTonnage }
}

// Максимум веса по упражнению (замена «личных рекордов» без новых таблиц).
// Только подходы завершённых сессий — активная сессия ни в одной метрике не участвует.
export function maxWeightByExercise(sets: ProgressSet[]): Record<string, number> {
  const max: Record<string, number> = {}
  for (const s of sets) {
    if (s.weight === null) continue
    const cur = max[s.exercise_id]
    if (cur === undefined || s.weight > cur) max[s.exercise_id] = s.weight
  }
  return max
}

// Топ упражнений по максимуму веса, для карточки «Рекорды».
export function topMaxWeights(
  maxByExercise: Record<string, number>,
  names: Record<string, string>,
  n = 3,
): { name: string; weight: number }[] {
  return Object.entries(maxByExercise)
    .map(([exerciseId, weight]) => ({ name: names[exerciseId] ?? 'Упражнение', weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, n)
}

// ── Форматы чисел (§6): Rubik/tabular, запятая, неразрывный пробел ─────────────────────

const NBSP = ' '

// Русское число: запятая-десятичная, тысячи через неразрывный пробел.
export function formatNumberRu(value: number, decimals: number): string {
  const [int, frac] = value.toFixed(decimals).split('.')
  const grouped = int!.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
  return frac ? `${grouped},${frac}` : grouped!
}

// Тоннаж: «12,4 т» при > 1000 кг, иначе «1 240 кг» / «0 кг».
export function formatTonnage(kg: number): string {
  return kg > 1000 ? `${formatNumberRu(kg / 1000, 1)} т` : `${formatNumberRu(kg, 0)} кг`
}

// Часы в зале: «38,5 ч».
export function formatHours(minutes: number): string {
  return `${formatNumberRu(minutes / 60, 1)} ч`
}

// Русское склонение: pluralRu(690, ['день','дня','дней']) → 'дней'.
export function pluralRu(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(Math.round(n)) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return forms[2]!
  if (last > 1 && last < 5) return forms[1]!
  if (last === 1) return forms[0]!
  return forms[2]!
}

// Герой: «+690 дней».
export function formatLifeDays(days: number): string {
  const n = Math.round(days)
  return `+${formatNumberRu(n, 0)} ${pluralRu(n, ['день', 'дня', 'дней'])}`
}

// Годы в caption/раскрытии: «≈ +1,9 года».
export function formatLifeYears(years: number): string {
  const rounded = Math.round(years * 10) / 10
  const isInteger = Math.abs(rounded - Math.round(rounded)) < 1e-9
  const word = isInteger ? pluralRu(rounded, ['год', 'года', 'лет']) : 'года'
  return `≈ +${formatNumberRu(rounded, 1)} ${word}`
}

// Стрик: «12 недель».
export function formatWeeks(n: number): string {
  return `${formatNumberRu(n, 0)} ${pluralRu(n, ['неделя', 'недели', 'недель'])}`
}

// Тренировки: «38 тренировок».
export function formatWorkouts(n: number): string {
  return `${formatNumberRu(n, 0)} ${pluralRu(n, ['тренировка', 'тренировки', 'тренировок'])}`
}
