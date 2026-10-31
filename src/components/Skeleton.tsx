// Скелетоны загрузки (cats-polish): вместо кота «грузится» — блоки той же
// геометрии, что и реальный контент, чтобы интерфейс не «прыгал» при подмене.
// Пульс глушится на prefers-reduced-motion (см. .skeleton в index.css).

/** Блок-заглушка: размеры/скругления задаёт className вызова. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />
}

/** Список карточек-заглушек под row-контент: история, дни, упражнения. */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-[60px] w-full rounded-2xl" />
      ))}
    </div>
  )
}
