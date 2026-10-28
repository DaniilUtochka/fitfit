// Kawaii-маскот: кот в трёх настроениях (docs/DESIGN.md).
// Кот никогда не кнопка и не в боевых строках — только пустые состояния,
// логин, загрузка и резюме.

type Mood = 'hello' | 'happy' | 'sleepy'

export function Cat({ mood, size = 96 }: { mood: Mood; size?: number }) {
  return (
    <svg
      width={size}
      height={size * 0.86}
      viewBox="0 0 120 103"
      fill="none"
      aria-hidden="true"
      className="mx-auto"
    >
      {/* уши */}
      <path d="M22 40 18 12l24 14Z" fill="#ede4ff" />
      <path d="M98 40 102 12 78 26Z" fill="#ede4ff" />
      <path d="M25 33 23 20l12 7Z" fill="#ffe3ec" />
      <path d="M95 33 97 20 85 27Z" fill="#ffe3ec" />

      {/* голова */}
      <ellipse cx="60" cy="60" rx="40" ry="34" fill="#ede4ff" />

      {/* щёчки */}
      <circle cx="36" cy="68" r="6" fill="#ffe3ec" />
      <circle cx="84" cy="68" r="6" fill="#ffe3ec" />

      {mood === 'happy' ? (
        // довольные глаза-дуги
        <path
          d="M40 58c2.5-3 7.5-3 10 0M70 58c2.5-3 7.5-3 10 0"
          stroke="#2a2f5a"
          strokeWidth="3"
          strokeLinecap="round"
        />
      ) : mood === 'sleepy' ? (
        // спящие закрытые глаза
        <path
          d="M40 58c2.5 3 7.5 3 10 0M70 58c2.5 3 7.5 3 10 0"
          stroke="#2a2f5a"
          strokeWidth="3"
          strokeLinecap="round"
        />
      ) : (
        // открытые глаза
        <>
          <circle cx="45" cy="57" r="3.4" fill="#2a2f5a" />
          <circle cx="75" cy="57" r="3.4" fill="#2a2f5a" />
          <circle cx="46.2" cy="55.8" r="1.1" fill="#ffffff" />
          <circle cx="76.2" cy="55.8" r="1.1" fill="#ffffff" />
        </>
      )}

      {/* нос и рот */}
      <path d="M57.5 65h5l-2.5 3Z" fill="#c93468" />
      {mood === 'happy' ? (
        <path
          d="M55 69c1.8 2.5 8.2 2.5 10 0"
          stroke="#2a2f5a"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M55 69.5h4M61 69.5h4"
          stroke="#2a2f5a"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      )}

      {/* усы */}
      <path
        d="M20 62h12M20 70l12-2M100 62H88M100 70l-12-2"
        stroke="#d9cdb8"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* лапка: приветствие поднята, иначе спрятана */}
      {mood === 'hello' && (
        <>
          <ellipse cx="14" cy="86" rx="9" ry="12" fill="#ede4ff" transform="rotate(-18 14 86)" />
          <path
            d="M10 78v-4M15 77v-4M20 78v-3"
            stroke="#c93468"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
      {mood === 'sleepy' && <Zzz />}
    </svg>
  )
}

function Zzz() {
  return (
    <g fill="#62678c" font-family="'Nunito',sans-serif" font-weight="800">
      <text x="88" y="30" fontSize="14">
        z
      </text>
      <text x="99" y="18" fontSize="10">
        z
      </text>
    </g>
  )
}

/** Лапка-маркер: выполненный подход, «Готово». */
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
