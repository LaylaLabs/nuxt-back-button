import { ref } from 'vue'
import type { BackButtonHandler, BackButtonOptions } from '../../types'

export const BACK_BUTTON_PRIORITY = {
  CONFIRMATION: 100, // Critical confirmation dialogs
  STEP: 90, // Navigation between steps/wizard within a modal
  POPOVER: 60, // Dropdown menus, tooltips
  MODAL: 50, // Standard modals (UModal)
  NESTED_SLIDEOVER: 45, // Slideover opened on top of another slideover
  SLIDEOVER: 40, // Standard drawers/slideovers (UDrawer, USlideover)
  FULLSCREEN: 30, // Fullscreen image / media viewers
  TAB: 20, // Internal tab navigation
  DEFAULT: 0, // Default page back navigation
} as const

export class BackButtonStack {
  private handlers = ref<BackButtonHandler[]>([])
  private debug = false
  private isExecuting = false

  constructor(options: { debug?: boolean } = {}) {
    this.debug = Boolean(options.debug)
  }

  public get sortedHandlers(): BackButtonHandler[] {
    return [...this.handlers.value].sort((a, b) => b.priority - a.priority)
  }

  public get count(): number {
    return this.handlers.value.length
  }

  public register(
    handler: () => boolean | Promise<boolean>,
    options: BackButtonOptions = {},
  ): string {
    const id = `back_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const record: BackButtonHandler = {
      id,
      priority: options.priority ?? 0,
      label: options.label,
      handler,
    }

    this.handlers.value.push(record)

    if (this.debug) {
      // eslint-disable-next-line no-console
      console.info(`[BackButton] Registered handler: ${options.label || id} (priority: ${record.priority}, total: ${this.handlers.value.length})`)
    }

    return id
  }

  public update(id: string, options: Partial<BackButtonOptions>): void {
    const record = this.handlers.value.find(h => h.id === id)
    if (!record) return

    if (options.priority !== undefined) {
      record.priority = options.priority
    }
    if (options.label !== undefined) {
      record.label = options.label
    }

    if (this.debug) {
      // eslint-disable-next-line no-console
      console.info(`[BackButton] Updated handler: ${record.label || id} (priority: ${record.priority})`)
    }
  }

  public unregister(id: string): void {
    const index = this.handlers.value.findIndex(h => h.id === id)
    if (index !== -1) {
      const removed = this.handlers.value.splice(index, 1)[0]
      if (this.debug && removed) {
        // eslint-disable-next-line no-console
        console.info(`[BackButton] Unregistered handler: ${removed.label || id} (remaining: ${this.handlers.value.length})`)
      }
    }
  }

  public async executeTopHandler(): Promise<boolean> {
    if (this.isExecuting) {
      if (this.debug) {
        // eslint-disable-next-line no-console
        console.warn('[BackButton] executeTopHandler is already executing, ignoring concurrent back press.')
      }
      return true
    }

    this.isExecuting = true
    try {
      const sorted = this.sortedHandlers

      for (const record of sorted) {
        try {
          const consumed = await record.handler()
          if (consumed) {
            if (this.debug) {
              // eslint-disable-next-line no-console
              console.info(`[BackButton] Event consumed by: ${record.label || record.id}`)
            }
            return true
          }
        }
        catch (error) {
          // eslint-disable-next-line no-console
          console.error(`[BackButton] Error in handler ${record.label || record.id}:`, error)
        }
      }

      return false
    }
    finally {
      this.isExecuting = false
    }
  }

  public clear(): void {
    this.handlers.value = []
    this.isExecuting = false
  }
}
