import type { CatProps } from './types'
import { Confetti, Tube, type ConfettiPiece } from './shared'
import { ink } from './types'

const BODY = '#f6c28b' // мандарин

const CONFETTI: ConfettiPiece[] = [
  { x: 24, y: 22, color: '#f5b73e', kind: 'star' },
  { x: 110, y: 18, color: '#c93468', delay: 0.2 },
  { x: 16, y: 52, color: '#6aaef5', delay: 0.35 },
  { x: 124, y: 48, color: '#57c896', kind: 'star', delay: 0.5 },
  { x: 34, y: 8, color: '#57c896', delay: 0.65 },
  { x: 96, y: 34, color: '#f5b73e', delay: 0.8 },
  { x: 8, y: 32, color: '#c93468', kind: 'star', delay: 0.95 },
  { x: 130, y: 8, color: '#6aaef5', delay: 1.1 },
]

/** Праздничный кот: подпрыгивает, вокруг конфетти. Рекорды, стрики, обновления. */
export function JoyCat({ size = 96, animated = true, className }: CatProps) {
  const a = (cls?: string) => (animated ? cls : undefined)
  return (
    <svg width={size} height={size * (134 / 140)} viewBox="0 0 140 134" fill="none" aria-hidden="true" className={className}>
      <Confetti pieces={CONFETTI} animated={animated} />

      <g className={a('cat-jump')}>
        {/* хвост за телом */}
        <Tube d="M100 108 Q120 106 118 88" color={BODY} animated={animated} />

        {/* лапки-тумбочки */}
        <ellipse cx="56" cy="116" rx="9" ry="7" fill={BODY} {...ink()} />
        <ellipse cx="84" cy="116" rx="9" ry="7" fill={BODY} {...ink()} />

        {/* тело с животиком */}
        <ellipse cx="70" cy="88" rx="31" ry="29" fill={BODY} {...ink()} />
        <ellipse cx="70" cy="96" rx="16" ry="14" fill="#ffe9c9" />

        {/* руки вверх */}
        <ellipse cx="36" cy="62" rx="8" ry="16" fill={BODY} {...ink()} transform="rotate(-35 36 62)" />
        <ellipse cx="104" cy="62" rx="8" ry="16" fill={BODY} {...ink()} transform="rotate(35 104 62)" />

        {/* уши и голова */}
        <path d="M44 28 38 6l24 12Z" fill={BODY} {...ink()} />
        <path d="M96 28 102 6 78 18Z" fill={BODY} {...ink()} />
        <path d="M46 24 43 12l13 7Z" fill="#ffd9b0" />
        <path d="M94 24 97 12 84 19Z" fill="#ffd9b0" />
        <circle cx="70" cy="48" r="30" fill={BODY} {...ink()} />

        {/* полоски тэбби */}
        <path d="M62 22v8M70 20v9M78 22v8M44 40l7 3M96 40l-7 3" stroke="#e59a55" strokeWidth="3" strokeLinecap="round" />

        {/* глаза моргают, рот открыт от радости */}
        <g className={a('cat-blink')}>
          <circle cx="58" cy="46" r="4" fill="#2a2f5a" />
          <circle cx="82" cy="46" r="4" fill="#2a2f5a" />
          <circle cx="59.5" cy="44.5" r="1.3" fill="#ffffff" />
          <circle cx="83.5" cy="44.5" r="1.3" fill="#ffffff" />
        </g>
        <path d="M61 58q9 12 18 0Z" fill="#c93468" {...ink(2)} />
        <circle cx="48" cy="56" r="5" fill="#ffe3ec" />
        <circle cx="92" cy="56" r="5" fill="#ffe3ec" />
      </g>
    </svg>
  )
}
