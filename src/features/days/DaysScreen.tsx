import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  useArchiveDayTemplate,
  useCreateDayTemplate,
  useDayTemplates,
  type DayTemplate,
} from './api'

export function DaysScreen() {
  const [showArchived, setShowArchived] = useState(false)
  const days = useDayTemplates(showArchived)

  return (
    <div className="flex flex-col">
      <h1 className="mb-4 text-2xl font-bold tracking-tight text-ink-strong">Дни</h1>

      <AddDayForm />

      <div className="mt-6 mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted uppercase">Список</h2>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="size-4"
          />
          Показать архив
        </label>
      </div>

      {days.isPending ? (
        <p className="text-muted">Загрузка…</p>
      ) : days.isError ? (
        <p className="text-danger">Ошибка: {(days.error as Error).message}</p>
      ) : days.data.length === 0 ? (
        <p className="text-muted">Пока пусто. Создай первый день выше.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {days.data.map((day) => (
            <DayCard key={day.id} day={day} />
          ))}
        </ul>
      )}
    </div>
  )
}

function AddDayForm() {
  const create = useCreateDayTemplate()
  const [name, setName] = useState('')

  const canSubmit = name.trim() !== '' && !create.isPending

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim() === '') return
    await create.mutateAsync(name.trim())
    setName('')
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Название дня (Push / Pull / Legs)"
        className="min-h-[44px] rounded-xl border border-border bg-bg px-3 text-ink placeholder:text-muted"
      />
      {create.isError && <p className="text-sm text-danger">{(create.error as Error).message}</p>}
      <button
        type="submit"
        disabled={!canSubmit}
        className="min-h-[48px] rounded-xl bg-brand font-semibold text-white disabled:opacity-50"
      >
        {create.isPending ? 'Создаю…' : 'Создать день'}
      </button>
    </form>
  )
}

function DayCard({ day }: { day: DayTemplate }) {
  const navigate = useNavigate()
  const archive = useArchiveDayTemplate()

  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
      <button
        onClick={() => navigate(`/days/${day.id}`)}
        className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span className="font-semibold text-ink-strong">{day.name}</span>
        {day.is_archived && (
          <span className="rounded-full bg-bg px-2 py-0.5 text-xs text-muted">в архиве</span>
        )}
      </button>

      {!day.is_archived && (
        <button
          onClick={() => archive.mutate(day.id)}
          disabled={archive.isPending}
          className="shrink-0 min-h-[44px] px-2 text-sm text-muted underline disabled:opacity-50"
        >
          В архив
        </button>
      )}
    </li>
  )
}
