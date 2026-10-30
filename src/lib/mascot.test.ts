import { describe, expect, it } from 'vitest'
import { pickCtaCat, timeOfDay } from './mascot'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

describe('timeOfDay', () => {
  it.each([
    [5, 'morning'],
    [11, 'morning'],
    [12, 'day'],
    [20, 'day'],
    [21, 'evening'],
    [23, 'evening'],
    [0, 'night'],
    [4, 'night'],
  ] as const)('%i ч → %s', (hour, expected) => {
    expect(timeOfDay(hour)).toBe(expected)
  })
})

describe('pickCtaCat', () => {
  const now = Date.parse('2026-10-30T15:00:00')

  it('свежая тренировка перекрывает всё, даже утро', () => {
    expect(
      pickCtaCat({ now, hour: 8, lastSessionAt: now - DAY, finishedAt: now - HOUR }),
    ).toBe('wrecked')
  })

  it('тренировка старше 3 часов — уже не «выжатый», обычный день', () => {
    expect(
      pickCtaCat({ now, hour: 15, lastSessionAt: now - DAY, finishedAt: now - 4 * HOUR }),
    ).toBe('loaf')
  })

  it('ни одной тренировки — кот тянется на коврике', () => {
    expect(pickCtaCat({ now, hour: 15, lastSessionAt: null, finishedAt: null })).toBe('mat')
  })

  it('перерыв больше недели — «с возвращением», коврик', () => {
    expect(
      pickCtaCat({ now, hour: 15, lastSessionAt: now - 8 * DAY, finishedAt: null }),
    ).toBe('mat')
  })

  it('ровно неделя — ещё не возвращение', () => {
    expect(
      pickCtaCat({ now, hour: 15, lastSessionAt: now - 7 * DAY, finishedAt: null }),
    ).toBe('loaf')
  })

  it('утро — потягивается', () => {
    expect(
      pickCtaCat({ now: now - 3 * HOUR, hour: 8, lastSessionAt: now - DAY, finishedAt: null }),
    ).toBe('mat')
  })

  it('вечер — спит', () => {
    expect(
      pickCtaCat({ now: now + 7 * HOUR, hour: 22, lastSessionAt: now - DAY, finishedAt: null }),
    ).toBe('sleepy')
  })

  it('ночь — спит', () => {
    expect(
      pickCtaCat({ now: now + 10 * HOUR, hour: 2, lastSessionAt: now - DAY, finishedAt: null }),
    ).toBe('sleepy')
  })

  it('день — лежебока с хвостиком', () => {
    expect(
      pickCtaCat({ now, hour: 15, lastSessionAt: now - DAY, finishedAt: null }),
    ).toBe('loaf')
  })
})
