import { describe, it, expect } from 'vitest'
import { progressFor } from './logic'

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
