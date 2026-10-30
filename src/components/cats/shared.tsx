// Компонентные части котов: «трубки» (хвосты/лапы), zzz, конфетти.
// Контур (INK, ink) — в ./types, чтобы этот файл оставался только с компонентами.
import { INK } from './types'

/**
 * Хвост или лапа-«трубка»: тот же путь рисуется дважды — толстым контуром
 * и чуть тоньше цветом тела. Дешёвый способ получить обводку вокруг линии.
 */
export function Tube({
  d,
  color,
  width = 9,
  animated = true,
}: {
  d: string
  color: string
  width?: number
  /** Подвешивает класс .cat-tail — качание хвоста. */
  animated?: boolean
}) {
  return (
    <g className={animated ? 'cat-tail' : undefined}>
      <path d={d} fill="none" stroke={INK} strokeWidth={width} strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={width - 4} strokeLinecap="round" />
    </g>
  )
}

/** Два плывущих «z» — сон. Позиция задаётся translate'ом родителя. */
export function Zzz({ animated = true }: { animated?: boolean }) {
  const a = (extra?: string) => (animated ? ['cat-zzz', extra].filter(Boolean).join(' ') : undefined)
  return (
    <g fill="#62678c" fontFamily="'Nunito',sans-serif" fontWeight={800}>
      <text x={0} y={26} fontSize={15} className={a()}>
        z
      </text>
      <text x={14} y={12} fontSize={11} className={a('cat-zzz-2')}>
        z
      </text>
    </g>
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
      d="M0 -5 L1.4 -1.4 L5 0 L1.4 1.4 L0 5 L-1.4 1.4 L-5 0 L-1.4 -1.4 Z"
      fill={color}
      transform={`translate(${x} ${y})`}
    />
  )
}

/** Россыпь конфетти: играет дважды и растворяется (animation forwards). */
export function Confetti({ pieces, animated = true }: { pieces: ConfettiPiece[]; animated?: boolean }) {
  return (
    <g>
      {pieces.map((p, i) => (
        <g
          key={i}
          className={animated ? 'cat-confetti' : undefined}
          style={animated && p.delay ? { animationDelay: `${p.delay}s` } : undefined}
        >
          {p.kind === 'star' ? <Star x={p.x} y={p.y} color={p.color} /> : <circle cx={p.x} cy={p.y} r={3.2} fill={p.color} />}
        </g>
      ))}
    </g>
  )
}
