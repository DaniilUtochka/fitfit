// Генерация iOS сплешей: кремовый фон #fff6e8 + логотип-кот по центру.
// Кот берётся из public/logo.svg (внутренности <g>), чтобы рисунок жил в одном месте.
// Запуск: node scripts/generate-splash.mjs (или npm run generate:splash)
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BG = '#fff6e8'
const OUT_DIR = path.join(ROOT, 'public', 'splash')
// Пропорции кота из viewBox logo.svg (внутренняя группа рисуется в координатах 120x103)
const CAT_W = 120
const CAT_H = 103
// Основные размеры iPhone: [портрет WxH, CSS-поинты WxH, dpr]
const DEVICES = [
  [1290, 2796, 430, 932, 3], // 16/15/14 Pro Max
  [1284, 2778, 428, 926, 3], // 13/12 Pro Max, 14 Plus
  [1179, 2556, 393, 852, 3], // 16/15/14 Pro
  [1170, 2532, 390, 844, 3], // 14/13/12
  [1125, 2436, 375, 812, 3], // X/XS/11 Pro
  [828, 1792, 414, 896, 2], // XR/11
]

const logo = await readFile(path.join(ROOT, 'public', 'logo.svg'), 'utf8')
const catMatch = logo.match(/<g[^>]*>([\s\S]*?)<\/g>/)
if (!catMatch) {
  throw new Error('Не нашёл <g> с котом в public/logo.svg')
}
const cat = catMatch[1]

function splashSvg(w, h) {
  // Кот ~26% короткой стороны, по центру
  const catW = Math.round(Math.min(w, h) * 0.26)
  const scale = catW / CAT_W
  const catH = Math.round(CAT_H * scale)
  const tx = Math.round((w - catW) / 2)
  const ty = Math.round((h - catH) / 2)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">` +
    `<rect width="${w}" height="${h}" fill="${BG}"/>` +
    `<g transform="translate(${tx} ${ty}) scale(${scale})" fill="none">${cat}</g>` +
    `</svg>`
  )
}

await mkdir(OUT_DIR, { recursive: true })
for (const [w, h] of DEVICES) {
  for (const [tw, th] of [
    [w, h],
    [h, w],
  ]) {
    const file = path.join(OUT_DIR, `apple-splash-${tw}x${th}.png`)
    await sharp(Buffer.from(splashSvg(tw, th)))
      .png({ compressionLevel: 9 })
      .toFile(file)
    console.log(`ok ${path.relative(ROOT, file)}`)
  }
}
