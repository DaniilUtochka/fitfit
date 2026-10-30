import type { CatProps } from './types'
import { Tube } from './shared'
import { ink } from './types'

const BODY = '#ffffff'

/** Белый кот с повязкой: собран и доволен, лапки сложены. Старт, приветствие. */
export function BandCat({ size = 96, animated = true, className }: CatProps) {
  return (
    <svg width={size} height={size * (112 / 120)} viewBox="0 0 120 112" fill="none" aria-hidden="true" className={className}>
      {/* хвост за телом */}
      <Tube d="M88 94 C102 96 112 88 110 76 C109 69 102 66 97 70" color={BODY} animated={animated} />

      {/* тело и сложенные лапки */}
      <ellipse cx="60" cy="88" rx="32" ry="20" fill={BODY} {...ink()} />
      <ellipse cx="60" cy="84" rx="11" ry="8" fill={BODY} {...ink()} />
      <path d="M60 77v14" {...ink(2)} />

      {/* уши */}
      <path d="M34 24 28 2l24 12Z" fill={BODY} {...ink()} />
      <path d="M86 24 92 2 68 14Z" fill={BODY} {...ink()} />
      <path d="M36 20 33 8l13 7Z" fill="#ffe3ec" />
      <path d="M84 20 87 8 74 15Z" fill="#ffe3ec" />

      {/* голова */}
      <circle cx="60" cy="44" r="32" fill={BODY} {...ink()} />

      {/* повязка */}
      <path d="M31 34 Q60 24 89 34 L87 45 Q60 36 33 45 Z" fill="#c93468" {...ink(2.5)} />

      {/* довольные закрытые глаза, щёчки, нос */}
      <path d="M42 55q5-6 10 0M68 55q5-6 10 0" {...ink()} />
      <circle cx="36" cy="63" r="5.5" fill="#ffe3ec" />
      <circle cx="84" cy="63" r="5.5" fill="#ffe3ec" />
      <path d="M57.5 60h5l-2.5 3.5Z" fill="#c93468" />
      <path d="M60 63.5q-1.5 3.5-5 3M60 63.5q1.5 3.5 5 3" {...ink(2.2)} />
    </svg>
  )
}
