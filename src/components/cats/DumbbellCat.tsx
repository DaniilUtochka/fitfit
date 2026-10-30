import type { CatProps } from './types'
import { Tube } from './shared'
import { ink } from './types'

const BODY = '#d9cbf5' // сирень

/** Сиреневый кот с гантелькой: старается изо всех сил. Работа, усилие, справочник. */
export function DumbbellCat({ size = 96, animated = true, className }: CatProps) {
  const a = (cls?: string) => (animated ? cls : undefined)
  return (
    <svg width={size} height={size * (116 / 128)} viewBox="0 0 128 116" fill="none" aria-hidden="true" className={className}>
      {/* хвост за телом */}
      <Tube d="M30 94 Q12 90 16 72" color={BODY} animated={animated} />

      {/* тело и лапки */}
      <ellipse cx="62" cy="90" rx="31" ry="22" fill={BODY} {...ink()} />
      <ellipse cx="50" cy="108" rx="9" ry="6" fill={BODY} {...ink()} />
      <ellipse cx="76" cy="108" rx="9" ry="6" fill={BODY} {...ink()} />
      <ellipse cx="34" cy="72" rx="7" ry="12" fill={BODY} {...ink()} transform="rotate(20 34 72)" />

      {/* поднятая лапа с гантелькой: качает «с усилием» */}
      <g className={a('cat-pump')}>
        <Tube d="M88 62 Q100 50 106 36" color={BODY} width={8} animated={false} />
        <circle cx="107" cy="33" r="6" fill={BODY} {...ink()} />
        <rect x="92" y="24" width="26" height="6" rx="3" fill="#aeb6d8" {...ink(2)} />
        <rect x="88" y="18" width="8" height="18" rx="3" fill="#c6cdea" {...ink(2)} />
        <rect x="114" y="18" width="8" height="18" rx="3" fill="#c6cdea" {...ink(2)} />
      </g>

      {/* уши и голова */}
      <path d="M36 26 30 4l24 12Z" fill={BODY} {...ink()} />
      <path d="M88 26 94 4 70 16Z" fill={BODY} {...ink()} />
      <path d="M38 22 35 10l13 7Z" fill="#ffe3ec" />
      <path d="M86 22 89 10 76 17Z" fill="#ffe3ec" />
      <circle cx="62" cy="46" r="31" fill={BODY} {...ink()} />

      {/* глаза-«усилия», язык, щёчки */}
      <path d="M40 46l9 4.5-9 4.5M84 46l-9 4.5 9 4.5" {...ink()} />
      <path d="M54 62q8 9 16 0" {...ink()} />
      <ellipse cx="62" cy="69" rx="5" ry="6" fill="#ff9db8" {...ink(2)} />
      <circle cx="38" cy="58" r="5.5" fill="#ffe3ec" />
      <circle cx="86" cy="58" r="5.5" fill="#ffe3ec" />
    </svg>
  )
}
