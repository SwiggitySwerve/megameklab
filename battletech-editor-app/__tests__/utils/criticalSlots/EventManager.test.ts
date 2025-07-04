/**
 * EventManager Tests
 * Tests for event subscription, notification, and unsubscription
 */

import { EventManager } from '../../../utils/criticalSlots/EventManager'

describe('EventManager', () => {
  let eventManager: EventManager

  beforeEach(() => {
    eventManager = new EventManager()
  })

  describe('subscribe', () => {
    test('should add a subscriber and return unsubscribe function', () => {
      const handler = jest.fn()
      const unsubscribe = eventManager.subscribe(handler)
      expect(typeof unsubscribe).toBe('function')
      eventManager.notifyStateChange()
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('notifyStateChange', () => {
    test('should notify all subscribers', () => {
      const handler1 = jest.fn()
      const handler2 = jest.fn()
      eventManager.subscribe(handler1)
      eventManager.subscribe(handler2)
      eventManager.notifyStateChange()
      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })
  })

  describe('unsubscribe', () => {
    test('should remove a subscriber', () => {
      const handler = jest.fn()
      const unsubscribe = eventManager.subscribe(handler)
      unsubscribe()
      eventManager.notifyStateChange()
      expect(handler).not.toHaveBeenCalled()
    })

    test('should not affect other subscribers', () => {
      const handler1 = jest.fn()
      const handler2 = jest.fn()
      const unsubscribe1 = eventManager.subscribe(handler1)
      eventManager.subscribe(handler2)
      unsubscribe1()
      eventManager.notifyStateChange()
      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })
  })
}) 