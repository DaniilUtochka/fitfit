import { useState } from 'react'
import { useNavigate } from 'react-router'
import { CatArt } from '../../components/cats'
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
      <h1 className="font-display mb-4 text-3xl font-extrabold tracking-tight text-ink-strong">
        Дни
      </h1>

      <AddDayForm />

      <div className="mt-6 mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold text-muted uppercase">Список</h2>
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
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-sky p-6 text-center">
          <CatArt name="mat" size={108} />
          <p className="font-bold text-ink">Пока пусто</p>
          <p className="text-sm text-muted">Создай первый день в форме выше</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
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
      className="card-shadow flex flex-col gap-3 rounded-2xl bg-surface p-4"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Название дня (Push / Pull / Legs)"
        className="min-h-[44px] rounded-xl border-2 border-border bg-paper px-3 text-ink placeholder:text-muted"
      />
      {create.isError && <p className="text-sm text-danger">{(create.error as Error).message}</p>}
      <button
        type="submit"
        disabled={!canSubmit}
        className="min-h-[48px] rounded-xl bg-brand font-extrabold text-white transition-transform active:scale-[0.98] disabled:opacity-50"
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
    <li className="card-shadow flex items-center justify-between gap-3 rounded-2xl bg-surface p-4">
      <button
        onClick={() => navigate(`/days/${day.id}`)}
        className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span className="font-bold text-ink-strong">{day.name}</span>
        {day.is_archived && (
          <span className="rounded-full bg-paper px-2 py-0.5 text-xs text-muted">в архиве</span>
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

      {archive.isError && <p className="text-sm text-danger">{(archive.error as Error).message}</p>}
    </li>
  )
}
