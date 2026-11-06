import { describe, it, expect } from 'vitest'
import { BackButtonStack, BACK_BUTTON_PRIORITY } from '../src/runtime/core/stack'

describe('BackButtonStack', () => {
  it('registers handlers and executes in descending priority order', async () => {
    const stack = new BackButtonStack()
    const executionOrder: string[] = []

    stack.register(() => {
      executionOrder.push('low')
      return true
    }, { priority: 10, label: 'low-modal' })

    stack.register(() => {
      executionOrder.push('high')
      return true
    }, { priority: 90, label: 'high-dialog' })

    const consumed = await stack.executeTopHandler()
    expect(consumed).toBe(true)
    expect(executionOrder).toEqual(['high'])
  })

  it('falls through to lower priority handler if top handler returns false', async () => {
    const stack = new BackButtonStack()
    const executionOrder: string[] = []

    stack.register(() => {
      executionOrder.push('top-not-consumed')
      return false
    }, { priority: 100 })

    stack.register(() => {
      executionOrder.push('second-consumed')
      return true
    }, { priority: 50 })

    const consumed = await stack.executeTopHandler()
    expect(consumed).toBe(true)
    expect(executionOrder).toEqual(['top-not-consumed', 'second-consumed'])
  })

  it('prevents concurrent executions while an async handler is in flight', async () => {
    const stack = new BackButtonStack()
    let executionCount = 0

    stack.register(async () => {
      executionCount++
      await new Promise(r => setTimeout(r, 50))
      return true
    }, { priority: 50 })

    // Simulate rapid concurrent back button taps
    const [res1, res2] = await Promise.all([
      stack.executeTopHandler(),
      stack.executeTopHandler(),
    ])

    expect(res1).toBe(true)
    expect(res2).toBe(true)
    expect(executionCount).toBe(1)
  })

  it('updates handler priority dynamically', async () => {
    const stack = new BackButtonStack()
    const id = stack.register(() => true, { priority: 10 })

    stack.update(id, { priority: 80 })
    expect(stack.sortedHandlers[0]?.priority).toBe(80)
  })

  it('unregisters handlers correctly', async () => {
    const stack = new BackButtonStack()
    const id = stack.register(() => true, { priority: 50 })
    expect(stack.count).toBe(1)

    stack.unregister(id)
    expect(stack.count).toBe(0)

    const consumed = await stack.executeTopHandler()
    expect(consumed).toBe(false)
  })

  it('exports canonical priority constants', () => {
    expect(BACK_BUTTON_PRIORITY.CONFIRMATION).toBe(100)
    expect(BACK_BUTTON_PRIORITY.MODAL).toBe(50)
    expect(BACK_BUTTON_PRIORITY.SLIDEOVER).toBe(40)
  })
})
