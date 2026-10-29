import { NavLink } from 'react-router'
import { Cat } from '../../components/cat'

// Раздел «Ещё»: всё, что не нужно в процессе тренировки.
// Пока здесь только справочник упражнений, позже - настройки.
export function MoreScreen() {
  return (
    <div className="flex flex-col">
      <h1 className="font-display mb-4 text-3xl font-extrabold tracking-tight text-ink-strong">
        Ещё
      </h1>
      <ul className="flex flex-col gap-2.5">
        <li>
          <NavLink
            to="/history"
            className="card-shadow flex min-h-[60px] w-full items-center justify-between rounded-2xl bg-surface px-4 transition-transform active:scale-[0.98]"
          >
            <span className="font-bold text-ink-strong">История</span>
            <span className="text-sm font-extrabold text-brand">Открыть →</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/exercises"
            className="card-shadow flex min-h-[60px] w-full items-center justify-between rounded-2xl bg-surface px-4 transition-transform active:scale-[0.98]"
          >
            <span className="font-bold text-ink-strong">Справочник упражнений</span>
            <span className="text-sm font-extrabold text-brand">Открыть →</span>
          </NavLink>
        </li>
      </ul>
      <div className="mt-8 flex flex-col items-center gap-1 opacity-80">
        <Cat mood="hello" size={72} />
        <p className="text-xs font-bold text-muted">Здесь будет ещё что-то</p>
      </div>
    </div>
  )
}
