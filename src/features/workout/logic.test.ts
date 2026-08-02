import { describe, it, expect } from 'vitest'
import {
  progressFor,
  ratchetUp,
  computeSummary,
  workingWeightFor,
  workingRepsFor,
} from './logic'

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
