import type { CatProps } from './types'
import { Tube, Zzz } from './shared'
import { ink } from './types'

const BODY = '#ffe3c2' // персик

/** Персиковый кот спит: дышит боком, zzz плывут. Ночь, загрузка, восстановление. */
export function SleepyCat({ size = 96, animated = true, className }: CatProps) {
  return (
    <svg width={size} height={size * (96 / 150)} viewBox="0 0 150 96" fill="none" aria-hidden="true" className={className}>
      <g transform="translate(102 -4)">
        <Zzz animated={animated} />
      </g>

      {/* хвост за телом */}
      <Tube d="M132 72 Q148 68 144 52" color={BODY} animated={animated} />

      {/* тело: дышит */}
      <g className={animated ? 'cat-breathe' : undefined}>
        <ellipse cx="82" cy="64" rx="58" ry="24" fill={BODY} {...ink()} />
        <ellipse cx="95" cy="48" rx="9" ry="6" fill="#f2c496" />
        <ellipse cx="114" cy="58" rx="7" ry="5" fill="#f2c496" />

        {/* голова слева */}
        <circle cx="40" cy="52" r="25" fill={BODY} {...ink()} />
        <path d="M22 34 16 12l24 12Z" fill={BODY} {...ink()} />
        <path d="M24 30 21 18l13 7Z" fill="#f0b98e" />
        <path d="M30 52q5 4 10 0" {...ink()} />
        <circle cx="28" cy="60" r="4.5" fill="#ffe3ec" />
        <path d="M44 60q2 2 4 0" {...ink(2.2)} />
      </g>
    </svg>
  )
}
