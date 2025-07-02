/**
 * MultiUnitStateService Test Suite
 * 
 * Comprehensive tests for multi-unit tab management, persistence, and state recovery.
 * Tests localStorage operations, legacy migration, and complete state serialization.
 * 
 * Phase 5: Validation & Testing - Day 21
 */

import { MultiUnitStateService, TabUnit, MultiUnitState } from '../../services/MultiUnitStateService'
import { UnitConfiguration } from '../../utils/criticalSlots/UnitCriticalManager'

// Mock localStorage
const createMockLocalStorage = () => {
  let store: Record<string, string> = {}
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    get length() { return Object.keys(store).length },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }),
    get store() { return { ...store } }
  }
}

// Mock UnitStateManager and UnitCriticalManager
jest.mock('../../utils/criticalSlots/UnitStateManager', () => ({
  UnitStateManager: jest.fn().mockImplementation((config) => ({
    getCurrentUnit: jest.fn().mockReturnValue({
      getConfiguration: jest.fn().mockReturnValue(config),
      updateConfiguration: jest.fn(),
      deserializeCompleteState: jest.fn().mockReturnValue(true),
      serializeCompleteState: jest.fn().mockReturnValue({
        configuration: config,
        equipment: [],
        version: '2.0.0'
      })
    }),
    getUnitSummary: jest.fn().mockReturnValue({
      validation: { isValid: true },
      summary: { tonnage: 50 }
    })
  }))
}))

describe('MultiUnitStateService', () => {
  let service: MultiUnitStateService
  let mockLocalStorage: ReturnType<typeof createMockLocalStorage>
  
  beforeEach(() => {
    // Setup localStorage mock
    mockLocalStorage = createMockLocalStorage()
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })
    
    service = new MultiUnitStateService()
  })
  
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createDefaultConfiguration', () => {
    it('should create a valid default configuration', () => {
      const config = service.createDefaultConfiguration()
      
      expect(config).toMatchObject({
        chassis: 'Custom',
        model: 'New Design',
        tonnage: 50,
        unitType: 'BattleMech',
        techBase: 'Inner Sphere',
        walkMP: 4,
        engineRating: 200,
        runMP: 6
      })
      
      expect(config.armorAllocation).toBeDefined()
      expect(config.armorAllocation.HD).toEqual({ front: 9, rear: 0 })
      expect(config.armorTonnage).toBe(8.0)
      expect(config.totalHeatSinks).toBe(10)
    })

    it('should create a configuration with valid armor allocation', () => {
      const config = service.createDefaultConfiguration()
      
      // Check all armor locations are present
      const expectedLocations = ['HD', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'] as const
      expectedLocations.forEach(location => {
        expect(config.armorAllocation[location]).toBeDefined()
        expect(typeof config.armorAllocation[location].front).toBe('number')
        expect(typeof config.armorAllocation[location].rear).toBe('number')
      })
    })
  })

  describe('initializeTabs', () => {
    it('should create default tab when no storage exists', async () => {
      const state = await service.initializeTabs()
      
      expect(state.tabs).toHaveLength(1)
      expect(state.tabs[0]).toMatchObject({
        id: 'tab-1',
        name: 'New Mech',
        isModified: false
      })
      expect(state.activeTabId).toBe('tab-1')
      expect(state.nextTabNumber).toBe(2)
    })

    it('should load existing tabs from metadata', async () => {
      // Setup existing tabs metadata
      const metadata = {
        activeTabId: 'tab-2',
        nextTabNumber: 3,
        tabOrder: ['tab-1', 'tab-2'],
        tabNames: { 'tab-1': 'Atlas', 'tab-2': 'Locust' }
      }
      mockLocalStorage.setItem('battletech-tabs-metadata', JSON.stringify(metadata))
      
      // Setup tab data
      const tabData1 = {
        config: { ...service.createDefaultConfiguration(), chassis: 'Atlas' },
        modified: new Date().toISOString(),
        version: '1.0.0'
      }
      const tabData2 = {
        config: { ...service.createDefaultConfiguration(), chassis: 'Locust' },
        modified: new Date().toISOString(),
        version: '1.0.0'
      }
      mockLocalStorage.setItem('battletech-unit-tab-tab-1', JSON.stringify(tabData1))
      mockLocalStorage.setItem('battletech-unit-tab-tab-2', JSON.stringify(tabData2))
      
      const state = await service.initializeTabs()
      
      expect(state.tabs).toHaveLength(2)
      expect(state.tabs[0].name).toBe('Atlas')
      expect(state.tabs[1].name).toBe('Locust')
      expect(state.activeTabId).toBe('tab-2')
      expect(state.nextTabNumber).toBe(3)
    })

    it('should migrate legacy configuration', async () => {
      const legacyConfig = {
        chassis: 'Centurion',
        tonnage: 50,
        engineRating: 200
      }
      mockLocalStorage.setItem('battletech-unit-configuration', JSON.stringify(legacyConfig))
      
      const state = await service.initializeTabs()
      
      expect(state.tabs).toHaveLength(1)
      expect(state.tabs[0].name).toBe('50t Mech')
      expect(state.tabs[0].unitManager.getConfiguration().chassis).toBe('Centurion')
      
      // Legacy config should be removed
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('battletech-unit-configuration')
    })

    it('should handle initialization errors gracefully', async () => {
      // Corrupt metadata
      mockLocalStorage.setItem('battletech-tabs-metadata', 'invalid-json')
      
      const state = await service.initializeTabs()
      
      // Should fallback to default state
      expect(state.tabs).toHaveLength(1)
      expect(state.tabs[0].name).toBe('New Mech')
    })
  })

  describe('createTab', () => {
    let currentState: MultiUnitState

    beforeEach(() => {
      currentState = {
        tabs: [],
        activeTabId: null,
        nextTabNumber: 1
      }
    })

    it('should create a new tab with default configuration', () => {
      const result = service.createTab(currentState)
      
      expect(result.newState.tabs).toHaveLength(1)
      expect(result.newState.tabs[0]).toMatchObject({
        id: 'tab-1',
        name: 'New Mech',
        isModified: false
      })
      expect(result.newState.activeTabId).toBe('tab-1')
      expect(result.newState.nextTabNumber).toBe(2)
      expect(result.tabId).toBe('tab-1')
    })

    it('should create a tab with custom name and configuration', () => {
      const customConfig = {
        ...service.createDefaultConfiguration(),
        chassis: 'Atlas',
        tonnage: 100
      }
      
      const result = service.createTab(currentState, 'Heavy Assault', customConfig)
      
      expect(result.newState.tabs[0]).toMatchObject({
        id: 'tab-1',
        name: 'Heavy Assault'
      })
      expect(result.newState.tabs[0].unitManager.getConfiguration().chassis).toBe('Atlas')
    })

    it('should increment tab numbers correctly', () => {
      const stateWithExistingTab: MultiUnitState = {
        tabs: [service.createTabFromData('tab-1', 'Existing', service.createDefaultConfiguration())],
        activeTabId: 'tab-1',
        nextTabNumber: 2
      }
      
      const result = service.createTab(stateWithExistingTab)
      
      expect(result.newState.tabs).toHaveLength(2)
      expect(result.newState.tabs[1]).toMatchObject({
        id: 'tab-2',
        name: 'New Mech 2'
      })
      expect(result.newState.nextTabNumber).toBe(3)
    })

    it('should save tab metadata and data to localStorage', () => {
      service.createTab(currentState, 'Test Tab')
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'battletech-tabs-metadata',
        expect.stringContaining('"tabNames":{"tab-1":"Test Tab"}')
      )
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'battletech-unit-tab-tab-1',
        expect.stringContaining('"version":"1.0.0"')
      )
    })
  })

  describe('closeTab', () => {
    let stateWithMultipleTabs: MultiUnitState

    beforeEach(() => {
      stateWithMultipleTabs = {
        tabs: [
          service.createTabFromData('tab-1', 'Atlas', service.createDefaultConfiguration()),
          service.createTabFromData('tab-2', 'Locust', service.createDefaultConfiguration())
        ],
        activeTabId: 'tab-1',
        nextTabNumber: 3
      }
    })

    it('should close a non-active tab', () => {
      const result = service.closeTab(stateWithMultipleTabs, 'tab-2')
      
      expect(result.tabs).toHaveLength(1)
      expect(result.tabs[0].id).toBe('tab-1')
      expect(result.activeTabId).toBe('tab-1') // Should remain unchanged
    })

    it('should close active tab and switch to first remaining', () => {
      const result = service.closeTab(stateWithMultipleTabs, 'tab-1')
      
      expect(result.tabs).toHaveLength(1)
      expect(result.tabs[0].id).toBe('tab-2')
      expect(result.activeTabId).toBe('tab-2') // Should switch to remaining tab
    })

    it('should reset last tab instead of closing it', () => {
      const stateWithOneTab: MultiUnitState = {
        tabs: [service.createTabFromData('tab-1', 'OnlyTab', service.createDefaultConfiguration())],
        activeTabId: 'tab-1',
        nextTabNumber: 2
      }
      
      const result = service.closeTab(stateWithOneTab, 'tab-1')
      
      expect(result.tabs).toHaveLength(1)
      expect(result.tabs[0]).toMatchObject({
        id: 'tab-1',
        name: 'New Mech',
        isModified: false
      })
    })

    it('should remove tab data from localStorage', () => {
      service.closeTab(stateWithMultipleTabs, 'tab-2')
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('battletech-unit-tab-tab-2')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('battletech-complete-state-tab-2')
    })
  })

  describe('setActiveTab', () => {
    let state: MultiUnitState

    beforeEach(() => {
      state = {
        tabs: [
          service.createTabFromData('tab-1', 'Tab1', service.createDefaultConfiguration()),
          service.createTabFromData('tab-2', 'Tab2', service.createDefaultConfiguration())
        ],
        activeTabId: 'tab-1',
        nextTabNumber: 3
      }
    })

    it('should change active tab', () => {
      const result = service.setActiveTab(state, 'tab-2')
      
      expect(result.activeTabId).toBe('tab-2')
      expect(result.tabs).toEqual(state.tabs) // Tabs should remain unchanged
    })

    it('should do nothing if tab is already active', () => {
      const result = service.setActiveTab(state, 'tab-1')
      
      expect(result).toEqual(state) // Should return same state object
    })

    it('should save metadata to localStorage', () => {
      service.setActiveTab(state, 'tab-2')
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'battletech-tabs-metadata',
        expect.stringContaining('"activeTabId":"tab-2"')
      )
    })
  })

  describe('renameTab', () => {
    let state: MultiUnitState

    beforeEach(() => {
      state = {
        tabs: [
          service.createTabFromData('tab-1', 'OldName', service.createDefaultConfiguration())
        ],
        activeTabId: 'tab-1',
        nextTabNumber: 2
      }
    })

    it('should rename a tab', () => {
      const result = service.renameTab(state, 'tab-1', 'NewName')
      
      expect(result.tabs[0]).toMatchObject({
        id: 'tab-1',
        name: 'NewName',
        isModified: true
      })
      expect(result.tabs[0].modified).toBeInstanceOf(Date)
    })

    it('should not affect other tabs', () => {
      const stateWithMultipleTabs: MultiUnitState = {
        tabs: [
          service.createTabFromData('tab-1', 'Tab1', service.createDefaultConfiguration()),
          service.createTabFromData('tab-2', 'Tab2', service.createDefaultConfiguration())
        ],
        activeTabId: 'tab-1',
        nextTabNumber: 3
      }
      
      const result = service.renameTab(stateWithMultipleTabs, 'tab-1', 'RenamedTab1')
      
      expect(result.tabs[0].name).toBe('RenamedTab1')
      expect(result.tabs[1].name).toBe('Tab2') // Should remain unchanged
    })
  })

  describe('duplicateTab', () => {
    let state: MultiUnitState

    beforeEach(() => {
      const customConfig = {
        ...service.createDefaultConfiguration(),
        chassis: 'Atlas',
        tonnage: 100
      }
      state = {
        tabs: [
          service.createTabFromData('tab-1', 'Original Atlas', customConfig)
        ],
        activeTabId: 'tab-1',
        nextTabNumber: 2
      }
    })

    it('should duplicate a tab with copy suffix', () => {
      const result = service.duplicateTab(state, 'tab-1')
      
      expect(result.newState.tabs).toHaveLength(2)
      expect(result.newState.tabs[1]).toMatchObject({
        id: 'tab-2',
        name: 'Original Atlas Copy'
      })
      expect(result.newTabId).toBe('tab-2')
    })

    it('should copy the configuration', () => {
      const result = service.duplicateTab(state, 'tab-1')
      
      const originalConfig = result.newState.tabs[0].unitManager.getConfiguration()
      const duplicatedConfig = result.newState.tabs[1].unitManager.getConfiguration()
      
      expect(duplicatedConfig.chassis).toBe(originalConfig.chassis)
      expect(duplicatedConfig.tonnage).toBe(originalConfig.tonnage)
    })

    it('should return empty string for non-existent tab', () => {
      const result = service.duplicateTab(state, 'non-existent')
      
      expect(result.newState).toEqual(state)
      expect(result.newTabId).toBe('')
    })
  })

  describe('storage operations', () => {
    it('should save and load complete state', () => {
      const tabId = 'test-tab'
      const completeState = {
        configuration: service.createDefaultConfiguration(),
        criticalSlotAllocations: {},
        unallocatedEquipment: [],
        timestamp: Date.now(),
        version: '2.0.0'
      }
      
      service.saveCompleteState(tabId, completeState)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'battletech-complete-state-test-tab',
        expect.stringContaining('"version":"2.0.0"')
      )
    })

    it('should load tab data with complete state priority', () => {
      const tabId = 'test-tab'
      const completeState = {
        configuration: { ...service.createDefaultConfiguration(), chassis: 'CompleteState' },
        equipment: [],
        version: '2.0.0'
      }
      const legacyConfig = { ...service.createDefaultConfiguration(), chassis: 'Legacy' }
      
      // Set both complete state and legacy data
      mockLocalStorage.setItem(`battletech-complete-state-${tabId}`, JSON.stringify({
        completeState,
        modified: new Date().toISOString(),
        version: '2.0.0'
      }))
      mockLocalStorage.setItem(`battletech-unit-tab-${tabId}`, JSON.stringify({
        config: legacyConfig,
        modified: new Date().toISOString(),
        version: '1.0.0'
      }))
      
      const result = service.loadTabData(tabId)
      
      // Should prefer complete state over legacy
      expect(result.config.chassis).toBe('CompleteState')
      expect(result.hasCompleteState).toBe(true)
    })

    it('should fallback to legacy config when complete state unavailable', () => {
      const tabId = 'test-tab'
      const legacyConfig = { ...service.createDefaultConfiguration(), chassis: 'Legacy' }
      
      mockLocalStorage.setItem(`battletech-unit-tab-${tabId}`, JSON.stringify({
        config: legacyConfig,
        modified: new Date().toISOString(),
        version: '1.0.0'
      }))
      
      const result = service.loadTabData(tabId)
      
      expect(result.config.chassis).toBe('Legacy')
      expect(result.hasCompleteState).toBe(false)
    })
  })

  describe('storage statistics', () => {
    it('should calculate storage statistics', () => {
      // Setup some test data
      mockLocalStorage.setItem('battletech-tabs-metadata', '{"test": "data"}')
      mockLocalStorage.setItem('battletech-unit-tab-1', '{"config": {}}')
      mockLocalStorage.setItem('battletech-complete-state-1', '{"state": {}}')
      mockLocalStorage.setItem('battletech-unit-configuration', '{"legacy": true}')
      
      const stats = service.getStorageStats()
      
      expect(stats.totalTabs).toBe(1) // Should count tab pairs
      expect(stats.storageUsed).toBeGreaterThan(0)
      expect(stats.hasLegacyData).toBe(true)
    })

    it('should handle empty storage', () => {
      const stats = service.getStorageStats()
      
      expect(stats.totalTabs).toBe(0)
      expect(stats.storageUsed).toBe(0)
      expect(stats.hasLegacyData).toBe(false)
    })
  })

  describe('clearAllData', () => {
    it('should clear all battletech-related storage', () => {
      // Setup test data
      mockLocalStorage.setItem('battletech-tabs-metadata', '{}')
      mockLocalStorage.setItem('battletech-unit-tab-1', '{}')
      mockLocalStorage.setItem('other-app-data', '{}')
      
      service.clearAllData()
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('battletech-tabs-metadata')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('battletech-unit-tab-1')
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('other-app-data')
    })
  })

  describe('event subscription', () => {
    it('should notify subscribers of state changes', () => {
      const listener = jest.fn()
      const unsubscribe = service.subscribe(listener)
      
      // Create a tab to trigger notification
      service.createTab({
        tabs: [],
        activeTabId: null,
        nextTabNumber: 1
      })
      
      expect(listener).toHaveBeenCalled()
      
      // Test unsubscribe
      unsubscribe()
      listener.mockClear()
      
      service.createTab({
        tabs: [],
        activeTabId: null,
        nextTabNumber: 2
      })
      
      expect(listener).not.toHaveBeenCalled()
    })
  })
})
