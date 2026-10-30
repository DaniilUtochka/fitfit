import type { CatProps } from './types'
import { Tube } from './shared'
import { ink } from './types'

const BODY = '#dcc8ec' // розово-лиловый

/** Лежебока: пластом, блаженно, хвост лениво колышется. Отдых, таймер отдыха. */
export function LoafCat({ size = 96, animated = true, className }: CatProps) {
  return (
    <svg width={size} height={size * (84 / 140)} viewBox="0 0 140 84" fill="none" aria-hidden="true" className={className}>
      {/* хвост за телом */}
      <Tube d="M118 62 Q136 58 132 42" color={BODY} animated={animated} />

      {/* дышит всей тушкой */}
      <g className={animated ? 'cat-breathe' : undefined}>
        <ellipse cx="70" cy="58" rx="56" ry="22" fill={BODY} {...ink()} />

        {/* уши и голова */}
        <path d="M24 30 18 8l26 12Z" fill={BODY} {...ink()} />
        <path d="M64 30 70 8 44 20Z" fill={BODY} {...ink()} />
        <path d="M27 25 24 14l14 7Z" fill="#eab8d8" />
        <path d="M61 25 64 14 50 21Z" fill="#eab8d8" />
        <circle cx="44" cy="48" r="26" fill={BODY} {...ink()} />

        {/* блаженные закрытые глаза, щёчки, ротик-омега */}
        <path d="M30 50q5 4 10 0M54 50q5 4 10 0" {...ink()} />
        <circle cx="28" cy="58" r="5" fill="#ffe3ec" />
        <circle cx="60" cy="58" r="5" fill="#ffe3ec" />
        <path d="M41 61q2 2.5 4 0M46 61q2 2.5 4 0" {...ink(2.2)} />

        {/* лапка из-под бока */}
        <ellipse cx="72" cy="72" rx="9" ry="6" fill={BODY} {...ink()} />
      </g>
    </svg>
  )
}
