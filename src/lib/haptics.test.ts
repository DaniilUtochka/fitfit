import { describe, expect, it } from 'vitest'
import { catHaptic } from './haptics'

describe('catHaptic', () => {
  it('не падает без поддержки navigator.vibrate (jsdom)', () => {
    expect(() => catHaptic('pr')).not.toThrow()
    expect(() => catHaptic('done')).not.toThrow()
    expect(() => catHaptic('wrecked')).not.toThrow()
    expect(() => catHaptic('tap')).not.toThrow()
  })
})
