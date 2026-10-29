import {
  defineConfig,
  minimal2023Preset as preset,
} from '@vite-pwa/assets-generator/config'

// Фон иконки (lilac) совпадает с фоном логотипа, чтобы паддинг maskable
// не давал белого канта под системной маской iOS/Android.
// Apple-touch-icon — full-bleed без паддинга: скругление делает сама iOS.
export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: {
    ...preset,
    maskable: {
      ...preset.maskable,
      resizeOptions: { fit: 'contain', background: '#ede4ff' },
    },
    apple: {
      ...preset.apple,
      padding: 0,
      resizeOptions: { fit: 'contain', background: '#ede4ff' },
    },
  },
  images: ['public/logo.svg'],
})
