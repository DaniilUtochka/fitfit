import { describe, it, expect } from 'vitest'
import { supabase } from './supabase'

describe('supabase client', () => {
  it('собирается без ошибок', () => {
    expect(typeof supabase.from).toBe('function')
    expect(typeof supabase.auth).toBe('object')
  })
})
