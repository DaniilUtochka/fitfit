// Оверлеи поверх спрайтов котов: zzz и конфетти. Рисуются SVG-ом — их не нужно
// запекать в растр. Позиционирует родитель (CatArt).

/** Два плывущих «z» — сон. */
export function Zzz({ animated = true }: { animated?: boolean }) {
  const a = (extra?: string) => (animated ? ['cat-zzz', extra].filter(Boolean).join(' ') : undefined)
  return (
    <svg width="34" height="32" viewBox="0 0 34 32" fill="none" aria-hidden="true">
      <g fill="#62678c" fontFamily="'Nunito',sans-serif" fontWeight={800}>
        <text x={0} y={28} fontSize={15} className={a()}>
          z
        </text>
        <text x={16} y={13} fontSize={11} className={a('cat-zzz-2')}>
          z
        </text>
      </g>
    </svg>
  )
}

export type ConfettiPiece = {
  x: number
  y: number
  color: string
  kind?: 'dot' | 'star'
  /** Задержка старта, с — конфетти сыпятся не строем. */
  delay?: number
}

function Star({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <path
      d="M0 -6 L1.7 -1.7 L6 0 L1.7 1.7 L0 6 L-1.7 1.7 L-6 0 L-1.7 -1.7 Z"
      fill={color}
      transform={`translate(${x} ${y})`}
    />
  )
}

/** Россыпь конфетти: играет дважды и растворяется (animation forwards). */
export function Confetti({ pieces, animated = true }: { pieces: ConfettiPiece[]; animated?: boolean }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" aria-hidden="true">
      {pieces.map((p, i) => (
        <g
          key={i}
          className={animated ? 'cat-confetti' : undefined}
          style={animated && p.delay ? { animationDelay: `${p.delay}s` } : undefined}
        >
          {p.kind === 'star' ? <Star x={p.x} y={p.y} color={p.color} /> : <circle cx={p.x} cy={p.y} r={4} fill={p.color} />}
        </g>
      ))}
    </svg>
  )
}
