import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'

// Мок supabase c переключаемой сессией: без неё — экран логина, с ней — Layout с табами.
// Цепочка-заглушка под supabase-js query builder: все методы возвращают себя,
// await цепочки резолвится пустым результатом (пустые данные = пустое состояние).
const mocks = vi.hoisted(() => {
  function chainResult(data: unknown[] = []): Promise<{ data: unknown[]; error: null }> {
    // Методы builder'а навешаны прямо на промис: каждый возвращает тот же
    // объект, await всей цепочки резолвится пустым результатом.
    const api = Promise.resolve({ data, error: null }) as Promise<{
      data: unknown[]
      error: null
    }> & { single: () => Promise<{ data: null; error: null }> } & Record<
      string,
      () => unknown
    >
    for (const method of ['select', 'not', 'eq', 'in', 'order', 'limit']) {
      api[method] = () => api
    }
    api.single = () => Promise.resolve({ data: null, error: null })
    return api
  }
  return { chainResult, session: { current: null as { user: { email: string } } | null } }
})

vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: mocks.session.current } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => mocks.chainResult(),
  },
}))

import App from './App'

// vitest без globals — авто-cleanup @testing-library не регистрируется сам.
afterEach(cleanup)

function renderApp(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('App', () => {
  beforeEach(() => {
    mocks.session.current = null
  })

  it('рендерит экран логина «FitFit» без падения', async () => {
    render(<App />)
    expect(await screen.findByText('FitFit')).toBeTruthy()
  })
})

describe('App: навигация слайса 13', () => {
  beforeEach(() => {
    mocks.session.current = { user: { email: 'dan@gmail.com' } }
  })

  it('«/» — главный экран Прогресс: редирект index-роута на /progress', async () => {
    renderApp('/')
    expect(await screen.findByText('Тут появятся твои цифры')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Прогресс' })).toBeTruthy()
  })

  it('нижнее меню: Тренировка / Прогресс / Ещё, таба «Дни» больше нет', async () => {
    renderApp('/progress')
    expect(await screen.findByRole('link', { name: 'Прогресс' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Дни' })).toBeNull()
    // /progress с пустыми данными — пустое состояние §5
    expect(await screen.findByText('Тут появятся твои цифры')).toBeTruthy()
    // Кнопка старта одна: фиксированная к низу, inline-CTA из пустого состояния убран
    expect(screen.getAllByRole('link', { name: 'Начать тренировку' })).toHaveLength(1)
  })

  it('«Ещё»: секции Тренировки (Дни, История) и Справочник', async () => {
    renderApp('/more')
    expect(await screen.findByRole('link', { name: /Дни/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /История/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Справочник упражнений/ })).toBeTruthy()
    expect(screen.getByText('Тренировки')).toBeTruthy()
    expect(screen.getByText('Справочник')).toBeTruthy()
  })
})
