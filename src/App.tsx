import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import './App.css'

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

  return session ? <Home session={session} /> : <Login />
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
    <main className="screen">
      <div className="mark" aria-hidden="true">
        F
      </div>
      <h1>FitFit</h1>
      <p className="muted">Трекер тренировок</p>
      <button className="btn btn-google" onClick={signIn} disabled={pending}>
        <GoogleIcon />
        {pending ? 'Открываю Google…' : 'Войти через Google'}
      </button>
      {error && <p className="error">{error}</p>}
    </main>
  )
}

function Home({ session }: { session: Session }) {
  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <main className="screen">
      <div className="mark" aria-hidden="true">
        F
      </div>
      <h1>FitFit</h1>
      <p className="lead">Вы вошли.</p>
      <p className="muted">{session.user.email}</p>
      <p className="muted">Тренировки — скоро.</p>
      <button className="link-btn" onClick={signOut}>
        Выйти
      </button>
    </main>
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
