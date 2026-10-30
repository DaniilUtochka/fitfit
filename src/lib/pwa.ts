import { registerSW } from 'virtual:pwa-register'
import { markAppUpdated } from './mascot'

// Насильное обновление PWA (боль слайса 14: новые изменения не видны на айфоне
// подолгу). Схема: registerType 'autoUpdate' — новый service worker активируется
// сразу (skipWaiting + clientsClaim); мы ловим controllerchange и перезагружаем
// страницу, чтобы работал свежий код. Состояние не теряется: каждый тап пишется
// в базу сразу, перезагрузка восстанавливает активную сессию.

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000 // час

export function setupPwaUpdate(): void {
  let reloading = false

  // Если страница загрузилась уже под контролем старого SW — появление нового
  // контроллера = вышла новая версия, перезагружаемся. Если контроллера не было
  // вовсе (первый визит, SW только установился) — релоад не нужен: страница и
  // так свежая, а лишний перезаход только мешает.
  const hadController = navigator.serviceWorker.controller !== null

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return
    reloading = true
    // Флаг для маскота: после релоада кот с конфетти празднует обновление.
    markAppUpdated()
    window.location.reload()
  })

  const checkForUpdate = () => {
    void navigator.serviceWorker.getRegistration().then((r) => void r?.update())
  }

  registerSW({ immediate: true, onRegisteredSW: () => checkForUpdate() })

  // iOS держит PWA в памяти днями: при возврате в приложение страницу никто
  // не перезагружал и load-проверка не срабатывала. Проверяем на каждое
  // «окно снова видно» и раз в час на всякий случай.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate()
  })
  window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS)
}
