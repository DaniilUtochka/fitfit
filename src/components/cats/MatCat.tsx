import type { CatProps } from './types'
import { Tube } from './shared'
import { ink } from './types'

const BODY = '#ffffff'

/** Белый кот на коврике: потягивается, хвост торчит вверх. Утро, растяжка, «с возвращением». */
export function MatCat({ size = 96, animated = true, className }: CatProps) {
  return (
    <svg width={size} height={size * (104 / 150)} viewBox="0 0 150 104" fill="none" aria-hidden="true" className={className}>
      {/* коврик */}
      <rect x="12" y="80" width="126" height="16" rx="8" fill="#cfeeda" {...ink(2.5)} />

      {/* кот: потягивается пару раз и замирает */}
      <g className={animated ? 'cat-stretch' : undefined}>
        {/* хвост за телом */}
        <Tube d="M124 52 Q132 34 126 20" color={BODY} animated={animated} />

        {/* тело и передние лапки */}
        <ellipse cx="82" cy="66" rx="44" ry="20" fill={BODY} {...ink()} />
        <ellipse cx="34" cy="80" rx="7" ry="5" fill={BODY} {...ink()} />
        <ellipse cx="48" cy="80" rx="7" ry="5" fill={BODY} {...ink()} />

        {/* уши и голова */}
        <path d="M26 40 22 22l20 9Z" fill={BODY} {...ink()} />
        <path d="M54 40 58 22l-20 9Z" fill={BODY} {...ink()} />
        <path d="M28 36 26 27l11 5Z" fill="#ffe3ec" />
        <path d="M52 36 54 27 43 32Z" fill="#ffe3ec" />
        <circle cx="40" cy="56" r="21" fill={BODY} {...ink()} />

        {/* довольные закрытые глаза, щёчки, нос */}
        <path d="M28 54q4-5 8 0M46 54q4-5 8 0" {...ink()} />
        <circle cx="27" cy="61" r="4" fill="#ffe3ec" />
        <circle cx="53" cy="61" r="4" fill="#ffe3ec" />
        <path d="M38.5 60h3l-1.5 2.5Z" fill="#c93468" />
      </g>
    </svg>
  )
}
