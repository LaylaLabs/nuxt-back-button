import { useNuxtApp } from '#app'
import { onUnmounted, watch, getCurrentInstance, type Ref } from 'vue'
import { BACK_BUTTON_PRIORITY, type BackButtonStack } from '../core/stack'
import type { BackButtonCallback, BackButtonOptions } from '../../types'

export { BACK_BUTTON_PRIORITY }

export function useBackButton() {
  const nuxtApp = useNuxtApp()
  const stack = nuxtApp.$backButtonStack as BackButtonStack | undefined
  const localRegisteredIds: string[] = []

  /**
   * Registers a back button handler. Returns handler ID.
   */
  function onBackButton(
    handler: BackButtonCallback,
    options: BackButtonOptions = {},
  ): string {
    if (!stack) return ''
    const id = stack.register(handler, options)
    localRegisteredIds.push(id)
    return id
  }

  /**
   * Updates options (priority or label) of an existing handler.
   */
  function updatePriority(id: string, priority: number): void {
    if (!stack) return
    stack.update(id, { priority })
  }

  /**
   * Unregisters a specific handler by ID.
   */
  function off(id: string): void {
    if (!stack) return
    stack.unregister(id)
    const index = localRegisteredIds.indexOf(id)
    if (index !== -1) {
      localRegisteredIds.splice(index, 1)
    }
  }

  /**
   * Automatically binds a boolean Ref (e.g. isModalOpen, isDrawerOpen) to the back button stack.
   * When the ref is true, the back button sets it to false and consumes the event.
   */
  function bindToModel(
    modelRef: Ref<boolean>,
    options: BackButtonOptions = {},
  ): void {
    let handlerId: string | null = null

    watch(
      modelRef,
      (isOpen) => {
        if (isOpen && !handlerId) {
          handlerId = onBackButton(() => {
            if (modelRef.value) {
              modelRef.value = false
              return true
            }
            return false
          }, options)
        }
        else if (!isOpen && handlerId) {
          off(handlerId)
          handlerId = null
        }
      },
      { immediate: true },
    )

    if (getCurrentInstance()) {
      onUnmounted(() => {
        if (handlerId) {
          off(handlerId)
          handlerId = null
        }
      })
    }
  }

  /**
   * Manually executes the highest priority handler.
   */
  async function executeTopHandler(): Promise<boolean> {
    if (!stack) return false
    return stack.executeTopHandler()
  }

  // Automatic cleanup of handlers registered within this component lifecycle (if within Vue component)
  if (getCurrentInstance()) {
    onUnmounted(() => {
      if (!stack) return
      for (const id of localRegisteredIds) {
        stack.unregister(id)
      }
    })
  }

  return {
    onBackButton,
    updatePriority,
    off,
    bindToModel,
    executeTopHandler,
    handlersCount: stack?.count ?? 0,
    stack,
  }
}
