import { NavLink } from 'react-router'
import { Cat } from '../../components/cat'

// Раздел «Ещё» (слайс 13): «Дни» переехали сюда из нижнего меню
// (теперь там Тренировка / Прогресс / Ещё). Секции по §1 UX-спеки.
export function MoreScreen() {
  return (
    <div className="flex flex-col">
      <h1 className="font-display mb-4 text-3xl font-extrabold tracking-tight text-ink-strong">
        Ещё
      </h1>

      <h2 className="mb-2 text-sm font-bold text-muted uppercase">Тренировки</h2>
      <ul className="flex flex-col gap-2.5">
        <Row to="/days" label="Дни" />
        <Row to="/history" label="История" />
      </ul>

      <h2 className="mt-6 mb-2 text-sm font-bold text-muted uppercase">Справочник</h2>
      <ul className="flex flex-col gap-2.5">
        <Row to="/exercises" label="Справочник упражнений" />
      </ul>

      <div className="mt-8 flex flex-col items-center gap-1 opacity-80">
        <Cat mood="hello" size={72} />
        <p className="text-xs font-bold text-muted">Здесь будет ещё что-то</p>
      </div>
    </div>
  )
}

function Row({ to, label }: { to: string; label: string }) {
  return (
    <li>
      <NavLink
        to={to}
        className="card-shadow flex min-h-[60px] w-full items-center justify-between rounded-2xl bg-surface px-4 transition-transform active:scale-[0.98]"
      >
        <span className="font-bold text-ink-strong">{label}</span>
        <span className="text-sm font-extrabold text-brand">Открыть →</span>
      </NavLink>
    </li>
  )
}
