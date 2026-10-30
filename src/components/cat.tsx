// Лапка-маркер: выполненный подход, «Готово», кружок профиля.
// Сами коты-маскоты живут в src/components/cats/ (слайс 15).
export function Paw({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <ellipse cx="12" cy="15.5" rx="5.4" ry="4.6" fill="currentColor" />
      <circle cx="5.4" cy="9.4" r="2.3" fill="currentColor" />
      <circle cx="9.8" cy="6.4" r="2.4" fill="currentColor" />
      <circle cx="14.6" cy="6.4" r="2.4" fill="currentColor" />
      <circle cx="18.8" cy="9.4" r="2.3" fill="currentColor" />
    </svg>
  )
}
