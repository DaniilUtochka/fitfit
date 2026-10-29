import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'

// Мок supabase c переключаемой сессией: без неё — экран логина, с ней — Layout
// с плавающей кнопкой профиля. Цепочка-заглушка под supabase-js query builder:
// все методы возвращают себя, await цепочки резолвится пустым результатом.
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
    for (const method of ['select', 'not', 'eq', 'neq', 'in', 'is', 'order', 'limit']) {
      api[method] = () => api
    }
    api.single = () => Promise.resolve({ data: null, error: null })
    api.maybeSingle = () => Promise.resolve({ data: null, error: null })
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

describe('App: навигация (панель профиля вместо табов)', () => {
  beforeEach(() => {
    mocks.session.current = { user: { email: 'dan@gmail.com' } }
  })

  it('«/» — главный экран Прогресс: редирект index-роута на /progress', async () => {
    renderApp('/')
    // /progress с пустыми данными — пустое состояние §5
    expect(await screen.findByText('Тут появятся твои цифры')).toBeTruthy()
    // Кнопка старта одна: фиксированная к низу, inline-CTA из пустого состояния убран
    expect(screen.getAllByRole('link', { name: 'Начать тренировку' })).toHaveLength(1)
    // Кружок профиля виден всегда, панель пока закрыта
    expect(screen.getByRole('button', { name: 'Профиль' })).toBeTruthy()
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('неизвестный роут редиректит на выбор дня (catch-all жив)', async () => {
    renderApp('/nonsense')
    expect(await screen.findByText('Выбери день')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Профиль' })).toBeTruthy()
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('удалённый роут /more тоже уходит на catch-all', async () => {
    renderApp('/more')
    expect(await screen.findByText('Выбери день')).toBeTruthy()
  })

  it('панель профиля: email, пункты меню, «Выйти»; закрывается повторным тапом', async () => {
    renderApp('/progress')
    fireEvent.click(await screen.findByRole('button', { name: 'Профиль' }))

    expect(screen.getByRole('menu')).toBeTruthy()
    expect(screen.getByText('dan@gmail.com')).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Тренировка' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Дни' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'История' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Справочник упражнений' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Выйти' })).toBeTruthy()

    // Повторный тап по кружку закрывает панель
    fireEvent.click(screen.getByRole('button', { name: 'Профиль' }))
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('тап мимо панели закрывает её', async () => {
    renderApp('/progress')
    fireEvent.click(await screen.findByRole('button', { name: 'Профиль' }))
    expect(screen.getByRole('menu')).toBeTruthy()

    const outside = document.createElement('div')
    document.body.appendChild(outside)
    fireEvent.pointerDown(outside)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('переход по ссылке из панели: навигация и закрытие', async () => {
    renderApp('/progress')
    fireEvent.click(await screen.findByRole('button', { name: 'Профиль' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Дни' }))

    // Панель закрылась, попали на экран «Дни»
    expect(await screen.findByRole('heading', { name: 'Дни' })).toBeTruthy()
    expect(screen.queryByRole('menu')).toBeNull()
  })
})
