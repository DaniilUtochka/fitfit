import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { NavLink, Navigate, Outlet, Route, Routes } from 'react-router'
import { supabase } from './lib/supabase'
import { ExercisesScreen } from './features/exercises/ExercisesScreen'
import { DaysScreen } from './features/days/DaysScreen'
import { DayEditorScreen } from './features/days/DayEditorScreen'
import { WorkoutScreen } from './features/workout/WorkoutScreen'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Первый кадр до восстановления сессии — не мигаем экраном логина.
  if (loading) return null

  if (!session) return <Login />

  return (
    <Routes>
      <Route element={<Layout email={session.user.email ?? ''} />}>
        <Route index element={<Navigate to="/workout" replace />} />
        <Route path="workout" element={<WorkoutScreen />} />
        <Route path="days" element={<DaysScreen />} />
        <Route path="days/:id" element={<DayEditorScreen />} />
        <Route path="exercises" element={<ExercisesScreen />} />
        <Route path="*" element={<Navigate to="/workout" replace />} />
      </Route>
    </Routes>
  )
}

function Layout({ email }: { email: string }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
      <header className="flex items-center justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2">
        <p className="min-w-0 truncate text-xs text-muted">{email}</p>
        <button
          onClick={() => void supabase.auth.signOut()}
          className="min-h-[44px] shrink-0 px-2 text-sm text-muted underline"
        >
          Выйти
        </button>
      </header>

      <main className="flex-1 px-4 pb-4">
        <Outlet />
      </main>

      <nav className="sticky bottom-0 flex border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <TabLink to="/workout" label="Тренировка" />
        <TabLink to="/days" label="Дни" />
        <TabLink to="/exercises" label="Упражнения" />
      </nav>
    </div>
  )
}

function TabLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        'flex min-h-[52px] flex-1 items-center justify-center text-sm font-semibold ' +
        (isActive ? 'text-brand' : 'text-muted')
      }
    >
      {label}
    </NavLink>
  )
}

function Login() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signIn() {
    setPending(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    // При успехе браузер уходит на Google — код ниже отработает только при ошибке.
    if (error) {
      setError(error.message)
      setPending(false)
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2 px-4 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center">
      <BrandMark />
      <h1 className="text-4xl font-bold tracking-tight text-ink-strong">FitFit</h1>
      <p className="text-muted">Трекер тренировок</p>
      <button
        onClick={signIn}
        disabled={pending}
        className="mt-6 inline-flex min-h-[52px] items-center gap-3 rounded-2xl bg-white px-6 text-[17px] font-semibold text-[#1f2430] shadow-lg disabled:opacity-60"
      >
        <GoogleIcon />
        {pending ? 'Открываю Google…' : 'Войти через Google'}
      </button>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </main>
  )
}

function BrandMark() {
  return (
    <div
      className="mb-4 grid size-[88px] place-items-center rounded-[22px] bg-gradient-to-br from-brand-hi to-brand text-[52px] font-extrabold text-white shadow-[0_10px_30px_-8px_rgba(79,70,229,0.6)]"
      aria-hidden="true"
    >
      F
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.1 29.6 2 24 2 12.9 2 4 10.9 4 22s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.1 29.6 2 24 2 16.3 2 9.7 6.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 42c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5C29.5 32.6 26.9 34 24 34c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.6 37.6 16.2 42 24 42z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.5 5.5C39.9 36.4 44 30.9 44 22c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  )
}

export default App
