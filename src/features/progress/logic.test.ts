import { describe, it, expect } from 'vitest'
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
  lifeGainDays,
  maxWeightByExercise,
  pluralRu,
  riskReduction,
  sessionMinutes,
  topGroupsWithRest,
  topMaxWeights,
  tonnageByGroup,
  totalMinutes,
  totalTonnage,
  weekStart,
  weeklyDoseMinutes,
  weeklyTonnageBars,
  type ProgressSession,
  type ProgressSet,
} from './logic'

// ── Фабрики ────────────────────────────────────────────────────────────────────────────

// ISO без Z парсится как локальное время — и сессии, и now в тестах в одной зоне.
const NOW = new Date('2026-10-29T12:00:00')

function sess(id: string, startedAtLocal: Date, durationMin: number, dayName = 'Push'): ProgressSession {
  return {
    id,
    started_at: startedAtLocal.toISOString(),
    finished_at: new Date(startedAtLocal.getTime() + durationMin * 60_000).toISOString(),
    dayName,
  }
}

function daysFromWeekStart(n: number): Date {
  const d = new Date(weekStart(NOW))
  d.setDate(d.getDate() + n)
  return d
}

function set(session_id: string, weight: number | null, reps: number, exercise_id = 'ex-1'): ProgressSet {
  return { session_id, exercise_id, weight, reps }
}

// ── sessionMinutes: cap 4 ч ────────────────────────────────────────────────────────────

describe('sessionMinutes', () => {
  it('обычная сессия — длительность в минутах', () => {
    expect(sessionMinutes(sess('s1', daysFromWeekStart(1), 90))).toBe(90)
  })

  it('забытая сессия с завершением > 4 ч режется по cap 240', () => {
    expect(sessionMinutes(sess('s1', daysFromWeekStart(1), 360))).toBe(240)
    expect(sessionMinutes(sess('s1', daysFromWeekStart(1), 3000))).toBe(240)
  })

  it('страховка от отрицательной длительности (кривые часы) — 0', () => {
    expect(sessionMinutes(sess('s1', daysFromWeekStart(1), -5))).toBe(0)
  })
})

// ── Тоннаж и время ─────────────────────────────────────────────────────────────────────

describe('totalTonnage / totalMinutes', () => {
  it('0 подходов → 0', () => {
    expect(totalTonnage([])).toBe(0)
    expect(totalMinutes([])).toBe(0)
  })

  it('bodyweight (weight null) вне тоннажа', () => {
    const sets = [set('s1', 60, 10), set('s1', null, 12), set('s1', 60, 8)]
    expect(totalTonnage(sets)).toBe(1080)
  })

  it('гребной «в минутах» (импорт из Sheets) считается как есть — weight×reps, искажение задокументировано', () => {
    const sets = [set('s1', 15, 10, 'rowing'), set('s1', 60, 10, 'bench')]
    expect(totalTonnage(sets)).toBe(150 + 600)
  })

  it('время = сумма capped-длительностей', () => {
    const sessions = [sess('s1', daysFromWeekStart(1), 90), sess('s2', daysFromWeekStart(-3), 360)]
    expect(totalMinutes(sessions)).toBe(90 + 240)
  })
})

// ── «+дни жизни»: доза, RR, Gompertz ───────────────────────────────────────────────────

describe('weeklyDoseMinutes', () => {
  it('0 сессий → 0', () => {
    expect(weeklyDoseMinutes([], NOW)).toBe(0)
  })

  it('сессии старше 28 дней не входят в окно', () => {
    const sessions = [sess('old', daysFromWeekStart(-35), 90)]
    expect(weeklyDoseMinutes(sessions, NOW)).toBe(0)
  })

  it('окно 28 дней сглаживает пропуск недели, cap 4 ч на сессию, деление на 4', () => {
    const sessions = [
      sess('a', daysFromWeekStart(-10), 60), // в окне
      sess('b', daysFromWeekStart(-5), 300), // в окне, cap → 240
      sess('c', daysFromWeekStart(-40), 90), // вне окна
    ]
    expect(weeklyDoseMinutes(sessions, NOW)).toBe((60 + 240) / 4)
  })
})

describe('riskReduction / lifeGainDays', () => {
  it('D = 0 → снижение 0 и +0 дней', () => {
    expect(riskReduction(0)).toBe(0)
    expect(lifeGainDays(0)).toBe(0)
  })

  it('15% на дозе 60 мин/нед', () => {
    expect(riskReduction(60)).toBeCloseTo(0.15, 10)
  })

  it('плато после 60 мин/нед: 120 и 300 дают одно и то же', () => {
    expect(riskReduction(120)).toBe(0.15)
    expect(lifeGainDays(120)).toBe(lifeGainDays(300))
  })

  it('120 мин/нед → RR 0,85 → ≈ 685 дней (пример из PROGRESS.md)', () => {
    expect(lifeGainDays(120)).toBeCloseTo(685, 0)
  })

  it('45 мин/нед — ровно по формуле 365·8·log₂(1/RR)', () => {
    const rr = 1 - 0.15 * (45 / 60)
    expect(lifeGainDays(45)).toBeCloseTo(365 * 8 * Math.log2(1 / rr), 6)
  })

  it('доза растёт — дни растут (до плато)', () => {
    expect(lifeGainDays(10)).toBeLessThan(lifeGainDays(30))
    expect(lifeGainDays(30)).toBeLessThan(lifeGainDays(60))
  })
})

describe('computeLifeGain', () => {
  it('0 сессий → 0 дней, 0% риска', () => {
    const life = computeLifeGain([], NOW)
    expect(life.days).toBe(0)
    expect(life.reductionPct).toBe(0)
    expect(life.years).toBe(0)
  })

  it('28 дней тишины (сессии были, но все вне окна) → +0 дней — особый случай героя', () => {
    const sessions = [sess('old', daysFromWeekStart(-35), 120)]
    const life = computeLifeGain(sessions, NOW)
    expect(life.weeklyMinutes).toBe(0)
    expect(life.days).toBe(0)
  })

  it('живой пример: 45 мин/нед → ≈ 503 дня ≈ 1,4 года', () => {
    const sessions = [sess('a', daysFromWeekStart(-7), 90), sess('b', daysFromWeekStart(-14), 90)]
    const life = computeLifeGain(sessions, NOW)
    expect(life.weeklyMinutes).toBe(45)
    expect(life.days).toBeCloseTo(365 * 8 * Math.log2(1 / 0.8875), 0)
    expect(life.reductionPct).toBeCloseTo(11.25, 6)
  })
})

// ── Недели и стрик ─────────────────────────────────────────────────────────────────────

describe('weekStart', () => {
  it('четверг → понедельник той же недели', () => {
    const ws = weekStart(NOW)
    expect(ws.getDay()).toBe(1)
    expect(ws.getHours()).toBe(0)
  })

  it('воскресенье → понедельник предыдущего дня', () => {
    const sunday = new Date('2026-11-01T20:00:00') // вс, следующая неделя относительно NOW
    const ws = weekStart(sunday)
    expect(ws.getDay()).toBe(1)
    expect(ws.getTime()).toBeLessThan(sunday.getTime())
  })

  it('нормализация времени: weekStart(d) одинакова в любой момент недели', () => {
    const monday = new Date('2026-10-26T09:30:00')
    const thursday = new Date('2026-10-29T22:15:00')
    expect(weekStart(monday).getTime()).toBe(weekStart(thursday).getTime())
  })
})

describe('currentStreakWeeks', () => {
  it('0 сессий → 0', () => {
    expect(currentStreakWeeks([], NOW)).toBe(0)
  })

  it('считает недели пн-вс подряд: эта + прошлая + позапрошлая → 3', () => {
    const sessions = [
      sess('a', daysFromWeekStart(1), 60), // текущая неделя
      sess('b', daysFromWeekStart(-3), 60), // прошлая
      sess('c', daysFromWeekStart(-10), 60), // позапрошлая
    ]
    expect(currentStreakWeeks(sessions, NOW)).toBe(3)
  })

  it('текущая неделя без тренировки стрик не рвёт', () => {
    const sessions = [
      sess('b', daysFromWeekStart(-3), 60),
      sess('c', daysFromWeekStart(-10), 60),
    ]
    expect(currentStreakWeeks(sessions, NOW)).toBe(2)
  })

  it('пропущенная неделя рвёт стрик', () => {
    const sessions = [
      sess('a', daysFromWeekStart(1), 60),
      sess('c', daysFromWeekStart(-10), 60), // прошлая неделя пустая
    ]
    expect(currentStreakWeeks(sessions, NOW)).toBe(1)
  })

  it('две сессии в одной неделе считаются одной неделей', () => {
    const sessions = [sess('a', daysFromWeekStart(1), 60), sess('b', daysFromWeekStart(2), 60)]
    expect(currentStreakWeeks(sessions, NOW)).toBe(1)
  })
})

describe('bestStreakWeeks', () => {
  it('0 сессий → 0', () => {
    expect(bestStreakWeeks([])).toBe(0)
  })

  it('берёт максимум по всем отрезкам, разрывы не склеиваются', () => {
    const sessions = [
      sess('a', daysFromWeekStart(-35), 60),
      sess('b', daysFromWeekStart(-28), 60),
      sess('c', daysFromWeekStart(-21), 60), // отрезок из 3 недель
      sess('d', daysFromWeekStart(1), 60), // текущая
      sess('e', daysFromWeekStart(-7), 60), // отрезок из 2 недель
    ]
    expect(bestStreakWeeks(sessions)).toBe(3)
  })
})

describe('weeklyTonnageBars', () => {
  it('8 недель, последняя — текущая, пустые недели = 0', () => {
    const bars = weeklyTonnageBars([], [], NOW, 8)
    expect(bars).toHaveLength(8)
    expect(bars.every((b) => b.tonnage === 0)).toBe(true)
    expect(bars[7]!.start.getTime()).toBe(weekStart(NOW).getTime())
    const lastWeek = new Date(NOW)
    lastWeek.setDate(lastWeek.getDate() - 7)
    expect(bars[6]!.start.getTime()).toBe(weekStart(lastWeek).getTime())
  })

  it('тоннаж попадает в свою неделю, bodyweight вне', () => {
    const sessions = [sess('a', daysFromWeekStart(1), 60), sess('b', daysFromWeekStart(-8), 60)]
    const sets = [set('a', 100, 5), set('a', null, 10), set('b', 40, 10)]
    const bars = weeklyTonnageBars(sessions, sets, NOW, 8)
    expect(bars[7]!.tonnage).toBe(500) // текущая
    expect(bars[6]!.tonnage).toBe(0)
    expect(bars[5]!.tonnage).toBe(400) // неделя, начавшаяся 8 дней назад → bars[5]
  })

  it('подходы сессий вне окна 8 недель не падают', () => {
    const sessions = [sess('a', daysFromWeekStart(-70), 60)]
    const sets = [set('a', 500, 10)]
    const bars = weeklyTonnageBars(sessions, sets, NOW, 8)
    expect(bars.reduce((s, b) => s + b.tonnage, 0)).toBe(0)
  })
})

// ── Группы мышц ────────────────────────────────────────────────────────────────────────

describe('tonnageByGroup / topGroupsWithRest', () => {
  const groups = { bench: 'Грудь', row: 'Спина' }

  it('аттрибуция по основной группе, сортировка по убыванию', () => {
    const sets = [set('s1', 60, 10, 'bench'), set('s1', 40, 10, 'row'), set('s1', 40, 10, 'row')]
    const result = tonnageByGroup(sets, groups)
    expect(result).toEqual([
      { name: 'Спина', tonnage: 800 },
      { name: 'Грудь', tonnage: 600 },
    ])
  })

  it('bodyweight и упражнения без основной группы пропускаются', () => {
    const sets = [set('s1', null, 12, 'bench'), set('s1', 30, 10, 'no-group')]
    expect(tonnageByGroup(sets, groups)).toEqual([])
  })

  it('≤ 5 групп — без «Прочее»', () => {
    const g = [
      { name: 'Грудь', tonnage: 4800 },
      { name: 'Спина', tonnage: 4100 },
    ]
    expect(topGroupsWithRest(g, 5)).toEqual({ top: g, rest: null })
  })

  it('> 5 групп — top-5 + «Прочее» суммой', () => {
    const g = [
      { name: 'Грудь', tonnage: 4800 },
      { name: 'Спина', tonnage: 4100 },
      { name: 'Ноги', tonnage: 2100 },
      { name: 'Плечи', tonnage: 900 },
      { name: 'Руки', tonnage: 500 },
      { name: 'Пресс', tonnage: 300 },
      { name: 'Ягодицы', tonnage: 200 },
    ]
    const result = topGroupsWithRest(g, 5)
    expect(result.top).toHaveLength(5)
    expect(result.rest).toBe(500)
  })
})

// ── Рекорды ────────────────────────────────────────────────────────────────────────────

describe('heaviestSession / maxWeightByExercise / topMaxWeights', () => {
  const sessions = [
    sess('s1', daysFromWeekStart(-7), 60, 'Push'),
    sess('s2', daysFromWeekStart(1), 60, 'Pull'),
  ]

  it('самый тяжёлый день — максимум тоннажа одной сессии', () => {
    const sets = [set('s1', 60, 10), set('s2', 80, 10)]
    const rec = heaviestSession(sessions, sets)
    expect(rec?.session.id).toBe('s2')
    expect(rec?.tonnage).toBe(800)
  })

  it('0 сессий → null', () => {
    expect(heaviestSession([], [])).toBeNull()
  })

  it('максимум веса по упражнениям, только подходы с весом', () => {
    const sets = [
      set('s1', 80, 8, 'bench'),
      set('s2', 82.5, 6, 'bench'),
      set('s1', null, 12, 'bw'),
      set('s1', 50, 10, 'row'),
    ]
    expect(maxWeightByExercise(sets)).toEqual({ bench: 82.5, row: 50 })
  })

  it('топ-3 по весу с именами', () => {
    const maxBy = { bench: 82.5, row: 50, squat: 100, curl: 20 }
    const names = { bench: 'Жим лёжа', row: 'Тяга', squat: 'Присед', curl: 'Подъём' }
    expect(topMaxWeights(maxBy, names, 3)).toEqual([
      { name: 'Присед', weight: 100 },
      { name: 'Жим лёжа', weight: 82.5 },
      { name: 'Тяга', weight: 50 },
    ])
  })
})

// ── Форматы чисел (§6) ─────────────────────────────────────────────────────────────────

describe('formatNumberRu', () => {
  it('запятая-десятичная', () => {
    expect(formatNumberRu(12.4, 1)).toBe('12,4')
    expect(formatNumberRu(0, 1)).toBe('0,0')
  })

  it('тысячи через неразрывный пробел', () => {
    expect(formatNumberRu(1240, 0)).toBe('1 240')
    expect(formatNumberRu(690, 0)).toBe('690')
    expect(formatNumberRu(1234567, 0)).toBe('1 234 567')
  })
})

describe('formatTonnage / formatHours', () => {
  it('кг до 1000 включительно', () => {
    expect(formatTonnage(0)).toBe('0 кг')
    expect(formatTonnage(1000)).toBe('1 000 кг')
  })

  it('тонны с одним знаком после 1000', () => {
    expect(formatTonnage(1001)).toBe('1,0 т')
    expect(formatTonnage(12400)).toBe('12,4 т')
  })

  it('часы с одним знаком', () => {
    expect(formatHours(2310)).toBe('38,5 ч')
    expect(formatHours(0)).toBe('0,0 ч')
  })
})

describe('pluralRu', () => {
  it('день/дня/дней', () => {
    expect(pluralRu(21, ['день', 'дня', 'дней'])).toBe('день')
    expect(pluralRu(22, ['день', 'дня', 'дней'])).toBe('дня')
    expect(pluralRu(690, ['день', 'дня', 'дней'])).toBe('дней')
    expect(pluralRu(11, ['день', 'дня', 'дней'])).toBe('дней')
    expect(pluralRu(111, ['день', 'дня', 'дней'])).toBe('дней')
  })
})

describe('formatLifeDays / formatLifeYears / formatWeeks / formatWorkouts', () => {
  it('+690 дней', () => {
    expect(formatLifeDays(684.6)).toBe('+685 дней')
  })

  it('+0 дней и одиночные формы', () => {
    expect(formatLifeDays(0)).toBe('+0 дней')
    expect(formatLifeDays(21)).toBe('+21 день')
    expect(formatLifeDays(92)).toBe('+92 дня')
  })

  it('годы: дробные — «года», целые — по склонению', () => {
    expect(formatLifeYears(1.9)).toBe('≈ +1,9 года')
    expect(formatLifeYears(0.5)).toBe('≈ +0,5 года')
    expect(formatLifeYears(1)).toBe('≈ +1,0 год')
    expect(formatLifeYears(2)).toBe('≈ +2,0 года')
    expect(formatLifeYears(5)).toBe('≈ +5,0 лет')
  })

  it('недели и тренировки', () => {
    expect(formatWeeks(1)).toBe('1 неделя')
    expect(formatWeeks(2)).toBe('2 недели')
    expect(formatWeeks(12)).toBe('12 недель')
    expect(formatWorkouts(38)).toBe('38 тренировок')
    expect(formatWorkouts(1)).toBe('1 тренировка')
    expect(formatWorkouts(2)).toBe('2 тренировки')
  })
})
