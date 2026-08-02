import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Только anon key на фронте (правило 6). Падаем явно, если окружение не настроено,
// чтобы не ловить непонятные ошибки в рантайме.
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Не задана переменная окружения ${name} (см. .env / Vercel)`)
  }
  return value
}

const url = required('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL)
const anonKey = required('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY)

// persistSession + autoRefreshToken включены по умолчанию — сессия переживает
// перезапуск вкладки и добавление на главный экран (долгоживущая сессия, Слайс 1).
export const supabase = createClient<Database>(url, anonKey)
