import { defineNuxtPlugin, useRuntimeConfig, useRouter } from '#app'
import { BackButtonStack } from '../core/stack'
import type { ModuleOptions } from '../../types'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const options = (config.public.backButton || {}) as ModuleOptions

  const debug = Boolean(options.debug)
  const stack = new BackButtonStack({ debug })
  const router = useRouter()

  const rootPaths = new Set(options.rootPaths || ['/', '/home'])
  const exitConfig = options.exitConfirmation || {}
  const exitEnabled = exitConfig.enabled !== false
  const exitWindowMs = exitConfig.windowMs ?? 2000

  let lastBackPress = 0

  const win = window as any
  const capacitorApp = win?.Capacitor?.Plugins?.App
  let listenerPromise: Promise<any> | null = null

  if (capacitorApp && typeof capacitorApp.addListener === 'function') {
    listenerPromise = capacitorApp.addListener('backButton', async () => {
      // 1. Try to execute top priority handler in stack (modals, drawers, steps)
      const consumed = await stack.executeTopHandler()
      if (consumed) return

      // 2. If no handler consumed, check if on root route
      const currentPath = router.currentRoute.value.path
      const isRoot = rootPaths.has(currentPath)

      if (!isRoot) {
        router.back()
        return
      }

      // 3. On root route: handle double-tap exit confirmation
      if (exitEnabled) {
        const now = Date.now()
        const isWithinWindow = now - lastBackPress < exitWindowMs

        if (isWithinWindow) {
          // Second tap: trigger exit callback and close app
          try {
            if (typeof exitConfig.onExit === 'function') {
              await exitConfig.onExit()
            }
          }
          catch (err) {
            if (debug) console.warn('[BackButton] Error in onExit hook:', err)
          }

          if (typeof capacitorApp.exitApp === 'function') {
            capacitorApp.exitApp()
          }
        }
        else {
          // First tap: notify user via callback
          lastBackPress = now
          if (typeof exitConfig.onFirstPress === 'function') {
            exitConfig.onFirstPress()
          }
          else if (debug) {
            console.info('[BackButton] First back press on root route. Press again to exit.')
          }
        }
      }
      else {
        // Double-tap disabled: exit immediately
        if (typeof capacitorApp.exitApp === 'function') {
          capacitorApp.exitApp()
        }
      }
    })
  }

  // Cleanup specifically this listener on HMR without wiping out other plugin listeners
  if (import.meta.hot && listenerPromise) {
    import.meta.hot.dispose(async () => {
      try {
        const handle = await listenerPromise
        await handle?.remove?.()
      }
      catch (err) {
        if (debug) console.warn('[BackButton] Failed to remove listener on HMR dispose:', err)
      }
    })
  }

  return {
    provide: {
      backButtonStack: stack,
    },
  }
})
