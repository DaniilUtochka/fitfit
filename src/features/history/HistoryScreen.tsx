import { Link, NavLink } from 'react-router'
import { Paw } from '../../components/cat'
import { CatArt } from '../../components/cats'
import { useHistorySessions, type HistorySessionRow } from './api'
import { formatDateShort } from './logic'

// История (слайс 9): список завершённых сессий, новые сверху.
export function HistoryScreen() {
  const sessions = useHistorySessions()

  return (
    <div className="flex flex-col">
      <Link to="/progress" className="mb-2 inline-flex min-h-[44px] items-center text-sm text-muted">
        ← Прогресс
      </Link>
      <h1 className="font-display mb-4 text-2xl font-extrabold tracking-tight text-ink-strong">
        История
      </h1>

      {sessions.isPending ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <CatArt name="sleepy" size={148} />
          <p className="font-bold text-muted">Загрузка…</p>
        </div>
      ) : sessions.isError ? (
        <p className="text-danger">Ошибка: {(sessions.error as Error).message}</p>
      ) : sessions.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-sky p-6 text-center">
          <CatArt name="sleepy" size={148} />
          <p className="font-bold text-ink">Пока пусто, проведи первую тренировку</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {sessions.data.map((s) => (
            <li key={s.id}>
              <SessionRow row={s} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SessionRow({ row }: { row: HistorySessionRow }) {
  const allDone = row.summary.doneSets >= row.summary.plannedSets
  return (
    <NavLink
      to={`/history/${row.id}`}
      className="card-shadow flex min-h-[60px] w-full items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-2.5 transition-transform active:scale-[0.98]"
    >
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-bold text-ink-strong">{row.dayName}</span>
        <span className="tabular text-xs font-bold text-muted">{formatDateShort(row.startedAt)}</span>
      </span>
      <span
        className={`tabular flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold ${
          allDone ? 'bg-mint text-success' : 'bg-lilac text-ink'
        }`}
      >
        {allDone && <Paw size={13} />}
        {row.summary.doneSets}/{row.summary.plannedSets}
      </span>
    </NavLink>
  )
}
