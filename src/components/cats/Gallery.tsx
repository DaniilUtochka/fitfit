import { CatArt, type CatName } from './index'

// Dev-галерея маскотов: открывается только в dev на /mascots — смотеть всех котов
// в статике и анимации, проверять арт после правок. В прод-сборку рендер не попадает.
const CATS: { name: CatName; title: string; role: string }[] = [
  { name: 'band', title: 'Повязка', role: 'старт, приветствие, всё выполнено' },
  { name: 'mat', title: 'Коврик', role: 'утро, потягивание, «с возвращением»' },
  { name: 'loaf', title: 'Лежебока', role: 'таймер отдыха, дефолт на кнопке старта' },
  { name: 'sleepy', title: 'Соня', role: 'вечер, загрузка, пустая история' },
  { name: 'dumbbell', title: 'Гантелька', role: 'усилие, меню профиля, пустой справочник' },
  { name: 'wrecked', title: 'Выжатый', role: 'после тренировки, неполный план' },
  { name: 'joy', title: 'Праздник', role: 'рекорды, обновления, конфетти' },
]

export function MascotGallery() {
  return (
    <div className="min-h-dvh bg-bg px-6 py-10">
      <h1 className="font-display text-3xl font-extrabold text-ink-strong">Коты FitFit</h1>
      <p className="mt-1 text-sm text-muted">слайс 15 — dev-галерея, в проде не собирается в рендер</p>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {CATS.map((c) => (
          <div key={c.name} className="card-shadow rounded-2xl bg-surface p-4">
            <p className="font-display font-extrabold text-ink-strong">{c.title}</p>
            <p className="mb-3 text-xs text-muted">{c.role}</p>
            <div className="grid grid-cols-2 items-end gap-2">
              <div className="flex flex-col items-center gap-1">
                <CatArt name={c.name} size={90} animated={false} />
                <span className="text-[10px] text-muted">статика</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <CatArt name={c.name} size={90} />
                <span className="text-[10px] text-muted">анимация</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="font-display mt-10 text-xl font-extrabold text-ink-strong">Слоты</h2>
      <div className="mt-4 flex flex-wrap gap-6">
        {/* Кот на кнопке старта — как на Прогрессе */}
        {(['loaf', 'mat', 'sleepy', 'wrecked'] as CatName[]).map((name) => (
          <div key={name} className="relative pt-8">
            <span className="pointer-events-none absolute left-4 top-0 z-10">
              <CatArt name={name} size={64} />
            </span>
            <div className="flex min-h-[56px] items-center justify-center gap-2 rounded-xl bg-brand px-6 text-lg font-extrabold text-white">
              Начать тренировку
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-start gap-6">
        {/* Панель отдыха с котом */}
        <div className="flex items-center gap-3 rounded-2xl bg-butter p-3">
          <CatArt name="loaf" size={46} />
          <span className="font-display text-2xl font-extrabold text-ink-strong">1:12</span>
          <span className="text-sm font-bold text-ink">Отдых</span>
        </div>
        {/* Меню профиля с выглядывающим котом */}
        <div className="relative w-[280px] rounded-2xl bg-surface p-2 card-shadow">
          <span className="pointer-events-none absolute -top-5 left-3 -rotate-[10deg]">
            <CatArt name="dumbbell" size={34} />
          </span>
          <p className="px-3 py-2 text-sm text-muted">dan@gmail.com</p>
          <p className="px-3 py-2 font-bold text-ink-strong">Прогресс</p>
        </div>
      </div>
    </div>
  )
}
