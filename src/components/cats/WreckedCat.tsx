import type { CatProps } from './types'
import { Tube } from './shared'
import { ink } from './types'

const BODY = '#dfe3ee' // серый
const TOWEL = '#a8d4ef'

/** Выжатый кот: полотенце на голове, Х-глаза, бутылка рядом. После тяжёлой тренировки, отмена. */
export function WreckedCat({ size = 96, animated = true, className }: CatProps) {
  return (
    <svg width={size} height={size * (92 / 158)} viewBox="0 0 158 92" fill="none" aria-hidden="true" className={className}>
      {/* бутылка справа */}
      <rect x="140" y="44" width="14" height="34" rx="6" fill="#cfe7f8" {...ink(2.5)} />
      <rect x="143" y="38" width="8" height="6" rx="2" fill={TOWEL} {...ink(2)} />

      {/* хвост едва колышется */}
      <Tube d="M136 70 Q150 66 148 54" color={BODY} animated={animated} />

      {/* дышит медленно и устало */}
      <g className={animated ? 'cat-breathe' : undefined}>
        <ellipse cx="88" cy="66" rx="56" ry="20" fill={BODY} {...ink()} />

        {/* распластанная лапа */}
        <ellipse cx="80" cy="82" rx="8" ry="5" fill={BODY} {...ink()} />

        {/* уши и голова */}
        <path d="M26 38 20 18l22 10Z" fill={BODY} {...ink()} />
        <path d="M60 38 66 18 44 28Z" fill={BODY} {...ink()} />
        <circle cx="42" cy="56" r="24" fill={BODY} {...ink()} />

        {/* полотенце на голове */}
        <path d="M20 44 Q42 26 64 44 L60 53 Q42 38 24 53 Z" fill={TOWEL} {...ink(2.5)} />
        <path d="M20 44l-4 13 10-2Z" fill={TOWEL} {...ink(2.5)} />
        <path d="M64 44l4 13-10-2Z" fill={TOWEL} {...ink(2.5)} />

        {/* Х-глаза, язык, щёчки */}
        <path d="M30 57l8 8M38 57l-8 8M48 57l8 8M56 57l-8 8" {...ink()} />
        <ellipse cx="43" cy="72" rx="4" ry="5" fill="#ff9db8" {...ink(2)} />
        <circle cx="27" cy="66" r="4.5" fill="#ffe3ec" />
        <circle cx="59" cy="66" r="4.5" fill="#ffe3ec" />
      </g>
    </svg>
  )
}
