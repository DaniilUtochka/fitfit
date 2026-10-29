import { describe, it, expect } from 'vitest'
import { recentResultsByExercise, formatSetShort, formatDateShort } from './logic'
import type { DatedSessionSets } from './logic'

function session(startedAt: string, sets: DatedSessionSets['sets']): DatedSessionSets {
  return { started_at: startedAt, sets }
}

describe('formatSetShort', () => {
  it('с весом — «60×10»', () => {
    expect(formatSetShort({ exercise_id: 'e', set_number: 1, weight: 60, reps: 10 })).toBe('60×10')
  })

  it('bodyweight (weight null) — «×12»', () => {
    expect(formatSetShort({ exercise_id: 'e', set_number: 1, weight: null, reps: 12 })).toBe('×12')
  })
})

describe('recentResultsByExercise', () => {
  it('последний подход каждой сессии, свежие тренировки первыми', () => {
    const result = recentResultsByExercise([
      session('2026-10-01T10:00:00Z', [
        { exercise_id: 'ex-1', set_number: 1, weight: 60, reps: 8 },
        { exercise_id: 'ex-1', set_number: 2, weight: 60, reps: 9 },
      ]),
      session('2026-10-05T10:00:00Z', [
        { exercise_id: 'ex-1', set_number: 1, weight: 62.5, reps: 8 },
      ]),
    ])
    expect(result['ex-1']).toEqual(['62.5×8', '60×9'])
  })

  it('не больше 3 тренировок назад', () => {
    const result = recentResultsByExercise([
      session('2026-09-01T10:00:00Z', [{ exercise_id: 'ex-1', set_number: 1, weight: 50, reps: 10 }]),
      session('2026-09-08T10:00:00Z', [{ exercise_id: 'ex-1', set_number: 1, weight: 52.5, reps: 10 }]),
      session('2026-09-15T10:00:00Z', [{ exercise_id: 'ex-1', set_number: 1, weight: 55, reps: 10 }]),
      session('2026-09-22T10:00:00Z', [{ exercise_id: 'ex-1', set_number: 1, weight: 57.5, reps: 10 }]),
    ])
    // Самая старая сессия (01.09) выпадает
    expect(result['ex-1']).toEqual(['57.5×10', '55×10', '52.5×10'])
  })

  it('дата сортирует, а не порядок входа', () => {
    const result = recentResultsByExercise([
      session('2026-10-05T10:00:00Z', [{ exercise_id: 'ex-1', set_number: 1, weight: 60, reps: 8 }]),
      session('2026-10-12T10:00:00Z', [{ exercise_id: 'ex-1', set_number: 1, weight: 65, reps: 8 }]),
    ])
    expect(result['ex-1']).toEqual(['65×8', '60×8'])
  })

  it('упражнения нет в какой-то из сессий — элемент просто не добавляется', () => {
    const result = recentResultsByExercise([
      session('2026-10-12T10:00:00Z', [{ exercise_id: 'ex-1', set_number: 1, weight: 60, reps: 8 }]),
      session('2026-10-05T10:00:00Z', [{ exercise_id: 'ex-2', set_number: 1, weight: 30, reps: 12 }]),
    ])
    expect(result['ex-1']).toEqual(['60×8'])
    expect(result['ex-2']).toEqual(['30×12'])
  })

  it('внутри сессии берёт максимум set_number, а не порядок строк', () => {
    const result = recentResultsByExercise([
      session('2026-10-12T10:00:00Z', [
        { exercise_id: 'ex-1', set_number: 2, weight: 60, reps: 7 },
        { exercise_id: 'ex-1', set_number: 1, weight: 60, reps: 10 },
      ]),
    ])
    expect(result['ex-1']).toEqual(['60×7'])
  })

  it('пустой вход — пустая карта', () => {
    expect(recentResultsByExercise([])).toEqual({})
  })
})

describe('formatDateShort', () => {
  const now = new Date(2026, 9, 29) // 29.10.2026, локальное время

  it('текущий год — без года: «29 окт»', () => {
    expect(formatDateShort('2026-10-29T10:00:00Z', now)).toBe('29 окт')
  })

  it('прошлый год — с годом: «14 мар 2025»', () => {
    // Локальная дата, чтобы тест не зависел от таймзоны машины
    expect(formatDateShort(new Date(2025, 2, 14).toISOString(), now)).toBe('14 мар 2025')
  })
})
