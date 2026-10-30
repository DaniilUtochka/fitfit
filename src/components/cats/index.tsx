import type { ComponentType } from 'react'
import { BandCat } from './BandCat'
import { SleepyCat } from './SleepyCat'
import { DumbbellCat } from './DumbbellCat'
import { MatCat } from './MatCat'
import { LoafCat } from './LoafCat'
import { WreckedCat } from './WreckedCat'
import { JoyCat } from './JoyCat'
import type { CatProps } from './types'

export type { CatProps } from './types'

/** Каст маскотов FitFit (слайс 15). Роли — docs/DESIGN.md, «Каст котов». */
export type CatName = 'band' | 'sleepy' | 'dumbbell' | 'mat' | 'loaf' | 'wrecked' | 'joy'

const registry: Record<CatName, ComponentType<CatProps>> = {
  band: BandCat,
  sleepy: SleepyCat,
  dumbbell: DumbbellCat,
  mat: MatCat,
  loaf: LoafCat,
  wrecked: WreckedCat,
  joy: JoyCat,
}

export function CatArt({ name, size = 96, animated = true, className }: CatProps & { name: CatName }) {
  const Cat = registry[name]
  return <Cat size={size} animated={animated} className={className} />
}
