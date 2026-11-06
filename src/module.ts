import { defineNuxtModule, addPlugin, addImportsDir, createResolver } from '@nuxt/kit'
import { defu } from 'defu'
import type { ModuleOptions } from './types'

export type * from './types'
export { BACK_BUTTON_PRIORITY } from './runtime/core/stack'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@laylalabs/nuxt-back-button',
    configKey: 'backButton',
    compatibility: {
      nuxt: '>=3.0.0 || >=4.0.0',
    },
  },
  defaults: {
    rootPaths: ['/', '/home'],
    exitConfirmation: {
      enabled: true,
      windowMs: 2000,
    },
    debug: false,
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Expose module options to runtime
    nuxt.options.runtimeConfig.public.backButton = defu(
      nuxt.options.runtimeConfig.public.backButton,
      options,
    )

    // Register client-side Capacitor back button listener plugin
    addPlugin({
      src: resolver.resolve('./runtime/plugins/back-button.client'),
      mode: 'client',
    })

    // Register auto-imported composables (useBackButton)
    addImportsDir(resolver.resolve('./runtime/composables'))
  },
})

declare module '@nuxt/schema' {
  interface NuxtConfig {
    backButton?: Partial<ModuleOptions>
  }
  interface NuxtOptions {
    backButton?: ModuleOptions
  }
}

