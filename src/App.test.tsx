import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// Мок supabase: сессии нет → App показывает экран логина, react-router не задействован.
vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  },
}))

import App from './App'

describe('App', () => {
  it('рендерит экран логина «FitFit» без падения', async () => {
    render(<App />)
    expect(await screen.findByText('FitFit')).toBeTruthy()
  })
})
