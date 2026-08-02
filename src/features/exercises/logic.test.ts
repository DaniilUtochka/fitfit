import { describe, it, expect } from 'vitest'
import { buildMuscleGroupLinks } from './logic'

describe('buildMuscleGroupLinks', () => {
  it('primary всегда попадает с is_primary: true', () => {
    const links = buildMuscleGroupLinks('ex-1', 10, [20, 30])
    expect(links[0]).toEqual({ exercise_id: 'ex-1', muscle_group_id: 10, is_primary: true })
    expect(links.filter((l) => l.is_primary)).toHaveLength(1)
  })

  it('primary, продублированный в secondary, не даёт вторую строку', () => {
    const links = buildMuscleGroupLinks('ex-1', 10, [10, 20])
    expect(links).toHaveLength(2)
    expect(links.filter((l) => l.muscle_group_id === 10)).toHaveLength(1)
    expect(links.filter((l) => l.is_primary)).toHaveLength(1)
  })

  it('пустой secondary даёт одну строку', () => {
    const links = buildMuscleGroupLinks('ex-1', 10, [])
    expect(links).toEqual([{ exercise_id: 'ex-1', muscle_group_id: 10, is_primary: true }])
  })
})
