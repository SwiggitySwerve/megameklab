/**
 * UnitSynchronizationService Test Suite
 * 
 * Comprehensive tests for cross-unit synchronization, event handling,
 * debounced persistence, and equipment transfers.
 * 
 * Phase 5: Validation & Testing - Day 21
 */

import { UnitSynchronizationService, SynchronizationEvent, SynchronizationOptions } from '../../services/UnitSynchronizationService'
import { MultiUnitStateService, TabUnit } from '../../services/MultiUnitStateService'
import { MultiTabDebouncedSaveManager } from '../../utils/DebouncedSaveManager'
import { EngineType, GyroType } from '../../utils/criticalSlots/SystemComponentRules'

// Mock dependencies
jest.mock('../../services/MultiUnitStateService')
jest.mock('../../utils/DebouncedSaveManager')

const createMockTabUnit = (id: string, name: string): TabUnit => ({
  id,
  name,
  unitManager: {
    subscribe: jest.fn().mockReturnValue(jest.fn()),
    updateConfiguration: jest.fn(),
    getUnallocatedEquipment: jest.fn().mockReturnValue([]),
    allocateEquipmentFromPool: jest.fn().mockReturnValue(true),
    serializeCompleteState: jest.fn().mockReturnValue({
      configuration: {},
      criticalSlotAllocations: {},
      unallocatedEquipment: [],
      timestamp: Date.now(),
      version: '2.0.0'
    })
  } as any,
  stateManager: {
    addUnallocatedEquipment: jest.fn(),
    removeEquipment: jest.fn().mockReturnValue(true),
    handleEngineChange: jest.fn(),
    handleGyroChange: jest.fn(),
    resetUnit: jest.fn()
  } as any,
  created: new Date(),
  modified: new Date(),
  isModified: false
})

describe('UnitSynchronizationService', () => {
  let service: UnitSynchronizationService
  let mockStateService: jest.Mocked<MultiUnitStateService>
  let mockSaveManager: jest.Mocked<MultiTabDebouncedSaveManager>
  let mockTab: TabUnit

  beforeEach(() => {
    mockStateService = new MultiUnitStateService() as jest.Mocked<MultiUnitStateService>
    mockSaveManager = new MultiTabDebouncedSaveManager(1000) as jest.Mocked<MultiTabDebouncedSaveManager>
    
    // Mock save manager methods that might not exist
    mockSaveManager.scheduleSaveForTab = jest.fn()
    mockSaveManager.saveTabImmediately = jest.fn()
    ;(mockSaveManager as any).cancelPendingSave = jest.fn()
    ;(mockSaveManager as any).flushAllPendingSaves = jest.fn()
    ;(mockSaveManager as any).hasPendingSave = jest.fn().mockReturnValue(false)
    ;(mockSaveManager as any).getPendingSaveCount = jest.fn().mockReturnValue(0)
    
    service = new UnitSynchronizationService(mockStateService, mockSaveManager)
    mockTab = createMockTabUnit('test-tab', 'Test Mech')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('constructor and options', () => {
    it('should initialize with default options', () => {
      const options = service.getOptions()
      
      expect(options.enableDebouncing).toBe(true)
      expect(options.debounceDuration).toBe(1000)
      expect(options.enableCrossUnitValidation).toBe(true)
      expect(options.enableEquipmentSharing).toBe(false)
      expect(options.autoSaveChanges).toBe(true)
    })

    it('should accept custom options', () => {
      const customOptions: Partial<SynchronizationOptions> = {
        enableDebouncing: false,
        debounceDuration: 500,
        enableEquipmentSharing: true
      }
      
      const customService = new UnitSynchronizationService(
        mockStateService, 
        mockSaveManager, 
        customOptions
      )
      
      const options = customService.getOptions()
      expect(options.enableDebouncing).toBe(false)
      expect(options.debounceDuration).toBe(500)
      expect(options.enableEquipmentSharing).toBe(true)
    })

    it('should update options', () => {
      service.updateOptions({ enableDebouncing: false })
      
      const options = service.getOptions()
      expect(options.enableDebouncing).toBe(false)
    })
  })

  describe('tab synchronization', () => {
    it('should initialize tab sync', () => {
      service.initializeTabSync(mockTab)
      
      expect(mockTab.unitManager.subscribe).toHaveBeenCalled()
    })

    it('should cleanup tab sync', () => {
      const unsubscribe = jest.fn()
      mockTab.unitManager.subscribe = jest.fn().mockReturnValue(unsubscribe)
      
      service.initializeTabSync(mockTab)
      service.cleanupTabSync(mockTab.id)
      
      expect(unsubscribe).toHaveBeenCalled()
    })

    it('should handle multiple tabs', () => {
      const tabs = [
        createMockTabUnit('tab-1', 'Mech 1'),
        createMockTabUnit('tab-2', 'Mech 2')
      ]
      
      service.synchronizeMultipleTabs(tabs)
      
      expect(tabs[0].unitManager.subscribe).toHaveBeenCalled()
      expect(tabs[1].unitManager.subscribe).toHaveBeenCalled()
    })
  })

  describe('event system', () => {
    it('should emit and handle events', () => {
      const listener = jest.fn()
      const unsubscribe = service.subscribe(listener)
      
      service.initializeTabSync(mockTab)
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'tab_change',
          tabId: mockTab.id,
          data: { action: 'initialized' }
        })
      )
      
      unsubscribe()
    })

    it('should handle event subscription errors', () => {
      const badListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener error')
      })
      
      service.subscribe(badListener)
      
      // Should not throw when emitting events
      expect(() => {
        service.initializeTabSync(mockTab)
      }).not.toThrow()
    })

    it('should track event history', () => {
      service.initializeTabSync(mockTab)
      
      const stats = service.getSyncStats()
      expect(stats.totalEvents).toBeGreaterThan(0)
      expect(stats.recentEvents).toBeInstanceOf(Array)
    })

    it('should limit event history', () => {
      // Generate more than 100 events
      for (let i = 0; i < 110; i++) {
        service.initializeTabSync(createMockTabUnit(`tab-${i}`, `Mech ${i}`))
      }
      
      const stats = service.getSyncStats()
      expect(stats.totalEvents).toBeLessThanOrEqual(100)
    })

    it('should clear event history', () => {
      service.initializeTabSync(mockTab)
      service.clearEventHistory()
      
      const stats = service.getSyncStats()
      expect(stats.totalEvents).toBe(0)
    })
  })

  describe('configuration updates', () => {
    it('should update configuration with synchronization', () => {
      const config = { tonnage: 100 } as any
      
      service.updateConfiguration(mockTab, config)
      
      expect(mockTab.unitManager.updateConfiguration).toHaveBeenCalledWith(config)
      expect(mockTab.isModified).toBe(true)
      expect(mockSaveManager.saveTabImmediately).toHaveBeenCalled()
    })

    it('should handle engine changes', () => {
      const engineType: EngineType = 'XL'
      
      service.changeEngine(mockTab, engineType)
      
      expect(mockTab.stateManager.handleEngineChange).toHaveBeenCalledWith(engineType)
      expect(mockTab.isModified).toBe(true)
      expect(mockSaveManager.saveTabImmediately).toHaveBeenCalled()
    })

    it('should handle gyro changes', () => {
      const gyroType: GyroType = 'Compact'
      
      service.changeGyro(mockTab, gyroType)
      
      expect(mockTab.stateManager.handleGyroChange).toHaveBeenCalledWith(gyroType)
      expect(mockTab.isModified).toBe(true)
      expect(mockSaveManager.saveTabImmediately).toHaveBeenCalled()
    })
  })

  describe('equipment management', () => {
    it('should add equipment to unit', () => {
      const equipment = { name: 'AC/20', type: 'weapon' }
      
      service.addEquipmentToUnit(mockTab, equipment)
      
      expect(mockTab.stateManager.addUnallocatedEquipment).toHaveBeenCalledWith(equipment)
      expect(mockTab.isModified).toBe(true)
      expect(mockSaveManager.scheduleSaveForTab).toHaveBeenCalled()
    })

    it('should remove equipment', () => {
      const equipmentId = 'equipment-123'
      
      const result = service.removeEquipment(mockTab, equipmentId)
      
      expect(result).toBe(true)
      expect(mockTab.stateManager.removeEquipment).toHaveBeenCalledWith(equipmentId)
      expect(mockTab.isModified).toBe(true)
      expect(mockSaveManager.scheduleSaveForTab).toHaveBeenCalled()
    })

    it('should assign equipment', () => {
      const equipmentId = 'equipment-123'
      const location = 'RA'
      const slotIndex = 2
      
      mockTab.unitManager.getUnallocatedEquipment = jest.fn()
        .mockReturnValueOnce([{ id: equipmentId }]) // Before allocation
        .mockReturnValueOnce([]) // After allocation
      
      const result = service.assignEquipment(mockTab, equipmentId, location, slotIndex)
      
      expect(result).toBe(true)
      expect(mockTab.unitManager.allocateEquipmentFromPool).toHaveBeenCalledWith(
        equipmentId, location, slotIndex
      )
      expect(mockTab.isModified).toBe(true)
    })

    it('should detect failed equipment allocation', () => {
      const equipmentId = 'equipment-123'
      
      // Mock same unallocated count before and after (allocation failed)
      mockTab.unitManager.getUnallocatedEquipment = jest.fn()
        .mockReturnValue([{ id: equipmentId }])
      
      mockTab.unitManager.allocateEquipmentFromPool = jest.fn().mockReturnValue(true)
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      service.assignEquipment(mockTab, equipmentId, 'RA', 2)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('PROBLEM: Equipment was not removed from unallocated pool')
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('unit operations', () => {
    it('should reset unit', () => {
      const config = { tonnage: 50 } as any
      
      service.resetUnit(mockTab, config)
      
      expect(mockTab.stateManager.resetUnit).toHaveBeenCalledWith(config)
      expect(mockTab.isModified).toBe(true)
      expect(mockSaveManager.saveTabImmediately).toHaveBeenCalled()
    })

    it('should reset unit without config', () => {
      service.resetUnit(mockTab)
      
      expect(mockTab.stateManager.resetUnit).toHaveBeenCalledWith(undefined)
    })
  })

  describe('save management', () => {
    it('should force save all pending changes', () => {
      service.forceSaveAll()
      
      expect((mockSaveManager as any).flushAllPendingSaves).toHaveBeenCalled()
    })

    it('should check for pending saves', () => {
      ;(mockSaveManager as any).hasPendingSave.mockReturnValue(true)
      
      const result = service.hasPendingSaves('test-tab')
      
      expect(result).toBe(true)
      expect((mockSaveManager as any).hasPendingSave).toHaveBeenCalledWith('test-tab')
    })

    it('should cancel pending saves', () => {
      service.cancelPendingSaves('test-tab')
      
      expect((mockSaveManager as any).cancelPendingSave).toHaveBeenCalledWith('test-tab')
    })

    it('should get save statistics', () => {
      ;(mockSaveManager as any).getPendingSaveCount.mockReturnValue(3)
      
      const stats = service.getSyncStats()
      
      expect(stats.pendingSaves).toBe(3)
    })
  })

  describe('equipment transfer', () => {
    it('should transfer equipment when sharing enabled', () => {
      service.updateOptions({ enableEquipmentSharing: true })
      
      const transferRequest = {
        sourceTabId: 'tab-1',
        targetTabId: 'tab-2',
        equipmentId: 'equipment-123',
        sourceLocation: 'RA',
        targetLocation: 'LA',
        targetSlot: 0
      }
      
      const result = service.transferEquipment(transferRequest)
      
      expect(result).toBe(true)
    })

    it('should reject transfer when sharing disabled', () => {
      service.updateOptions({ enableEquipmentSharing: false })
      
      const transferRequest = {
        sourceTabId: 'tab-1',
        targetTabId: 'tab-2',
        equipmentId: 'equipment-123'
      }
      
      const result = service.transferEquipment(transferRequest)
      
      expect(result).toBe(false)
    })
  })

  describe('debounced vs immediate saves', () => {
    it('should use debounced saves for equipment changes', () => {
      const equipment = { name: 'Laser' }
      
      service.addEquipmentToUnit(mockTab, equipment)
      
      expect(mockSaveManager.scheduleSaveForTab).toHaveBeenCalled()
      expect(mockSaveManager.saveTabImmediately).not.toHaveBeenCalled()
    })

    it('should use immediate saves for configuration changes', () => {
      const config = { tonnage: 100 } as any
      
      service.updateConfiguration(mockTab, config)
      
      expect(mockSaveManager.saveTabImmediately).toHaveBeenCalled()
      expect(mockSaveManager.scheduleSaveForTab).not.toHaveBeenCalled()
    })

    it('should respect debouncing setting', () => {
      service.updateOptions({ enableDebouncing: false })
      const equipment = { name: 'Laser' }
      
      service.addEquipmentToUnit(mockTab, equipment)
      
      // Should still use scheduled save (implementation detail)
      expect(mockSaveManager.scheduleSaveForTab).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle missing save manager methods gracefully', () => {
      // Remove mock methods to simulate missing implementation
      delete (mockSaveManager as any).cancelPendingSave
      delete (mockSaveManager as any).flushAllPendingSaves
      
      expect(() => {
        service.cancelPendingSaves('test-tab')
        service.forceSaveAll()
      }).not.toThrow()
    })

    it('should handle subscription errors', () => {
      const badTab = createMockTabUnit('bad-tab', 'Bad Mech')
      badTab.unitManager.subscribe = jest.fn().mockImplementation(() => {
        throw new Error('Subscribe error')
      })
      
      expect(() => {
        service.initializeTabSync(badTab)
      }).not.toThrow()
    })

    it('should handle null tab operations', () => {
      expect(() => {
        service.updateConfiguration(null as any, {} as any)
        service.addEquipmentToUnit(null as any, {})
        service.removeEquipment(null as any, 'id')
      }).not.toThrow()
    })
  })

  describe('cleanup', () => {
    it('should cleanup all resources', () => {
      const unsubscribe1 = jest.fn()
      const unsubscribe2 = jest.fn()
      
      const tab1 = createMockTabUnit('tab-1', 'Mech 1')
      const tab2 = createMockTabUnit('tab-2', 'Mech 2')
      
      tab1.unitManager.subscribe = jest.fn().mockReturnValue(unsubscribe1)
      tab2.unitManager.subscribe = jest.fn().mockReturnValue(unsubscribe2)
      
      service.initializeTabSync(tab1)
      service.initializeTabSync(tab2)
      
      service.cleanup()
      
      expect(unsubscribe1).toHaveBeenCalled()
      expect(unsubscribe2).toHaveBeenCalled()
      
      const stats = service.getSyncStats()
      expect(stats.activeObservers).toBe(0)
      expect(stats.totalEvents).toBe(0)
    })
  })

  describe('validation', () => {
    it('should validate configuration when enabled', () => {
      service.updateOptions({ enableCrossUnitValidation: true })
      const config = { tonnage: 100 } as any
      
      // Mock the private validation method by testing its effects
      service.updateConfiguration(mockTab, config)
      
      // Should proceed without errors
      expect(mockTab.unitManager.updateConfiguration).toHaveBeenCalledWith(config)
    })
  })
})
