import { NavLink } from 'react-router'

// Раздел «Ещё»: всё, что не нужно в процессе тренировки.
// Пока здесь только справочник упражнений, позже - настройки.
export function MoreScreen() {
  return (
    <div className="flex flex-col">
      <h1 className="mb-4 text-2xl font-bold tracking-tight text-ink-strong">Ещё</h1>
      <ul className="flex flex-col gap-2">
        <li>
          <NavLink
            to="/exercises"
            className="flex min-h-[56px] w-full items-center justify-between rounded-2xl border border-border bg-surface px-4"
          >
            <span className="font-semibold text-ink-strong">Справочник упражнений</span>
            <span className="text-sm text-brand">Открыть →</span>
          </NavLink>
        </li>
      </ul>
    </div>
  )
}
