import { describe, it, expect } from 'vitest'
import {
  progressFor,
  ratchetUp,
  computeSummary,
  cancelAllowed,
  countPrs,
  workingWeightFor,
  workingRepsFor,
} from './logic'

describe('countPrs', () => {
  const plan = [
    { exercise_id: 'bench', sets_planned: 3 },
    { exercise_id: 'rows', sets_planned: 3 },
    { exercise_id: 'plank', sets_planned: 2 }, // bodyweight
  ]
  const prev = {
    bench: [{ exercise_id: 'bench', weight: 40, reps: 8 }],
    rows: [{ exercise_id: 'rows', weight: 50, reps: 8 }],
    plank: [{ exercise_id: 'plank', weight: null, reps: 40 }],
  }

  it('нет прошлой сессии — рекордов нет (не с чем сравнивать)', () => {
    const sets = [{ exercise_id: 'bench', weight: 60, reps: 8 }]
    expect(countPrs(plan, sets, undefined)).toBe(0)
  })

  it('максимум выше прошлого — рекорд', () => {
    const sets = [{ exercise_id: 'bench', weight: 42.5, reps: 8 }]
    expect(countPrs([plan[0]], sets, prev)).toBe(1)
  })

  it('берёт максимум за сессию, не первый подход', () => {
    const sets = [
      { exercise_id: 'bench', weight: 30, reps: 8 },
      { exercise_id: 'bench', weight: 42.5, reps: 6 },
    ]
    expect(countPrs([plan[0]], sets, prev)).toBe(1)
  })

  it('ровно тот же вес — не рекорд; ниже — тем более', () => {
    const equal = [{ exercise_id: 'bench', weight: 40, reps: 10 }]
    const lower = [{ exercise_id: 'bench', weight: 35, reps: 10 }]
    expect(countPrs([plan[0]], equal, prev)).toBe(0)
    expect(countPrs([plan[0]], lower, prev)).toBe(0)
  })

  it('bodyweight и внеплановые не в счёт', () => {
    const sets = [
      { exercise_id: 'plank', weight: null, reps: 60 },
      { exercise_id: 'curls', weight: 15, reps: 10 }, // нет в плане
    ]
    expect(countPrs(plan, sets, prev)).toBe(0)
  })

  it('несколько рекордов складываются', () => {
    const sets = [
      { exercise_id: 'bench', weight: 45, reps: 8 },
      { exercise_id: 'rows', weight: 52.5, reps: 8 },
    ]
    expect(countPrs(plan, sets, prev)).toBe(2)
  })
})

describe('cancelAllowed', () => {
  it('0 подходов — отменить можно', () => {
    expect(cancelAllowed(0, 21)).toBe(true)
  })

  it('меньше 20% — можно (1 из 6 ≈ 17%)', () => {
    expect(cancelAllowed(1, 6)).toBe(true)
  })

  it('ровно 20% — нельзя (1 из 5)', () => {
    expect(cancelAllowed(1, 5)).toBe(false)
  })

  it('больше 20% — нельзя', () => {
    expect(cancelAllowed(5, 21)).toBe(false)
    expect(cancelAllowed(21, 21)).toBe(false)
  })

  it('пустой план — отменить можно всегда', () => {
    expect(cancelAllowed(0, 0)).toBe(true)
    expect(cancelAllowed(3, 0)).toBe(true)
  })
})

describe('progressFor', () => {
  it('пустой список → 0 сделано, следующий подход №1', () => {
    expect(progressFor([], 'ex-1')).toEqual({ doneCount: 0, nextSetNumber: 1 })
  })

  it('считает только подходы своего упражнения', () => {
    const sets = [
      { exercise_id: 'ex-1', set_number: 1 },
      { exercise_id: 'ex-1', set_number: 2 },
      { exercise_id: 'ex-2', set_number: 1 },
    ]
    expect(progressFor(sets, 'ex-1')).toEqual({ doneCount: 2, nextSetNumber: 3 })
    expect(progressFor(sets, 'ex-2')).toEqual({ doneCount: 1, nextSetNumber: 2 })
  })

  it('nextSetNumber = max + 1 (устойчиво к дыре в нумерации)', () => {
    const sets = [
      { exercise_id: 'ex-1', set_number: 1 },
      { exercise_id: 'ex-1', set_number: 3 },
    ]
    expect(progressFor(sets, 'ex-1')).toEqual({ doneCount: 2, nextSetNumber: 4 })
  })
})

describe('ratchetUp', () => {
  it('поднимает план вверх', () => {
    expect(ratchetUp(60, 62.5)).toBe(62.5)
  })

  it('не двигает план вниз (снижение — только руками)', () => {
    expect(ratchetUp(60, 57.5)).toBe(60)
    expect(ratchetUp(60, 60)).toBe(60)
  })
})

describe('computeSummary', () => {
  it('тоннаж = Σ weight·reps, bodyweight (weight null) исключён', () => {
    const plan = [
      { exercise_id: 'ex-1', sets_planned: 3 },
      { exercise_id: 'bw', sets_planned: 3 },
    ]
    const sets = [
      { exercise_id: 'ex-1', weight: 60, reps: 10 }, // 600
      { exercise_id: 'ex-1', weight: 60, reps: 8 }, //  480
      { exercise_id: 'bw', weight: null, reps: 12 }, // bodyweight — вне тоннажа
    ]
    expect(computeSummary(plan, sets)).toEqual({ tonnage: 1080, doneSets: 3, plannedSets: 6 })
  })

  it('сверхплановые подходы не завышают «из плана», внеплановое не считается', () => {
    const plan = [{ exercise_id: 'ex-1', sets_planned: 3 }]
    const sets = [
      { exercise_id: 'ex-1', weight: 40, reps: 10 },
      { exercise_id: 'ex-1', weight: 40, reps: 10 },
      { exercise_id: 'ex-1', weight: 40, reps: 10 },
      { exercise_id: 'ex-1', weight: 40, reps: 10 }, // 4-й — сверх плана, капается до 3
      { exercise_id: 'extra', weight: 20, reps: 12 }, // внеплановое — не в «из плана»
    ]
    const s = computeSummary(plan, sets)
    expect(s.doneSets).toBe(3)
    expect(s.plannedSets).toBe(3)
  })
})

describe('workingWeightFor / workingRepsFor', () => {
  const sets = [
    { exercise_id: 'ex-1', set_number: 1, weight: 60, reps: 10 },
    { exercise_id: 'ex-1', set_number: 2, weight: 62.5, reps: 9 },
    { exercise_id: 'bw', set_number: 1, weight: null, reps: 12 },
  ]

  it('вес = последний подход упражнения', () => {
    expect(workingWeightFor(sets, 'ex-1', 55)).toBe(62.5)
  })

  it('нет подходов → план', () => {
    expect(workingWeightFor(sets, 'ex-2', 50)).toBe(50)
    expect(workingRepsFor(sets, 'ex-2', 10)).toBe(10)
  })

  it('bodyweight: повторы последнего подхода', () => {
    expect(workingRepsFor(sets, 'bw', 8)).toBe(12)
  })
})
