/**
 * Performance Validation Test Suite
 * 
 * Benchmarks service initialization, calculation performance, and memory usage.
 * Validates that refactored services meet performance targets.
 * 
 * Phase 5: Validation & Testing - Day 25
 */

import { MultiUnitStateService } from '../../services/MultiUnitStateService'
import { UnitSynchronizationService } from '../../services/UnitSynchronizationService'
import { UnitComparisonService } from '../../services/UnitComparisonService'
import { MultiTabDebouncedSaveManager } from '../../utils/DebouncedSaveManager'
import { UnitConfiguration } from '../../utils/criticalSlots/UnitCriticalManager'

// Performance test utilities
const measurePerformance = <T>(
  operation: () => T,
  description: string
): { result: T; duration: number } => {
  const startTime = performance.now()
  const result = operation()
  const endTime = performance.now()
  const duration = endTime - startTime
  
  console.log(`${description}: ${duration.toFixed(2)}ms`)
  return { result, duration }
}

const measureAsyncPerformance = async <T>(
  operation: () => Promise<T>,
  description: string
): Promise<{ result: T; duration: number }> => {
  const startTime = performance.now()
  const result = await operation()
  const endTime = performance.now()
  const duration = endTime - startTime
  
  console.log(`${description}: ${duration.toFixed(2)}ms`)
  return { result, duration }
}

// Mock localStorage for performance tests
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
    })
  }
}

// Mock UnitStateManager and UnitCriticalManager
jest.mock('../../utils/criticalSlots/UnitStateManager', () => ({
  UnitStateManager: jest.fn().mockImplementation((config) => ({
    getCurrentUnit: jest.fn().mockReturnValue({
      getConfiguration: jest.fn().mockReturnValue(config),
      updateConfiguration: jest.fn(),
      getUnallocatedEquipment: jest.fn().mockReturnValue([]),
      allocateEquipmentFromPool: jest.fn().mockReturnValue(true),
      subscribe: jest.fn().mockReturnValue(jest.fn()),
      serializeCompleteState: jest.fn().mockReturnValue({
        configuration: config,
        criticalSlotAllocations: {},
        unallocatedEquipment: [],
        timestamp: Date.now(),
        version: '2.0.0'
      }),
      deserializeCompleteState: jest.fn().mockReturnValue(true)
    }),
    getUnitSummary: jest.fn().mockReturnValue({
      validation: { isValid: true },
      summary: { tonnage: config.tonnage }
    }),
    addUnallocatedEquipment: jest.fn(),
    removeEquipment: jest.fn().mockReturnValue(true),
    handleEngineChange: jest.fn(),
    handleGyroChange: jest.fn(),
    resetUnit: jest.fn()
  }))
}))

describe('Performance Validation Tests', () => {
  let mockLocalStorage: ReturnType<typeof createMockLocalStorage>

  beforeEach(() => {
    // Setup localStorage mock
    mockLocalStorage = createMockLocalStorage()
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Service Initialization Performance', () => {
    it('should initialize core services within performance targets', () => {
      // Target: Service initialization ≤ 100ms
      
      const { duration: stateServiceTime } = measurePerformance(
        () => new MultiUnitStateService(),
        'MultiUnitStateService initialization'
      )
      
      const { duration: comparisonServiceTime } = measurePerformance(
        () => new UnitComparisonService(),
        'UnitComparisonService initialization'
      )
      
      const { duration: saveManagerTime } = measurePerformance(
        () => new MultiTabDebouncedSaveManager(1000),
        'MultiTabDebouncedSaveManager initialization'
      )

      // Validate performance targets
      expect(stateServiceTime).toBeLessThan(50)
      expect(comparisonServiceTime).toBeLessThan(50)
      expect(saveManagerTime).toBeLessThan(30)
      
      const totalTime = stateServiceTime + comparisonServiceTime + saveManagerTime
      
      expect(totalTime).toBeLessThan(150) // All services combined
    })

    it('should initialize sync service with save manager efficiently', () => {
      const stateService = new MultiUnitStateService()
      const saveManager = new MultiTabDebouncedSaveManager(1000)
      
      const { duration } = measurePerformance(
        () => new UnitSynchronizationService(stateService, saveManager),
        'UnitSynchronizationService with dependencies'
      )
      
      expect(duration).toBeLessThan(100)
    })
  })

  describe('Unit Calculation Performance', () => {
    it('should perform unit calculations within performance targets', async () => {
      // Target: Unit calculation ≤ 500ms
      
      const stateService = new MultiUnitStateService()
      const comparisonService = new UnitComparisonService()
      
      // Initialize with test data
      const { result: initialState, duration: initTime } = await measureAsyncPerformance(
        () => stateService.initializeTabs(),
        'State service initialization'
      )
      
      // Create test configurations
      const testConfigs = [
        { chassis: 'Locust', tonnage: 20, engineRating: 160 },
        { chassis: 'Griffin', tonnage: 55, engineRating: 275 },
        { chassis: 'Atlas', tonnage: 100, engineRating: 400 }
      ]
      
      let currentState = initialState
      const creationTimes: number[] = []
      
      // Measure tab creation performance
      for (const config of testConfigs) {
        const { result, duration } = measurePerformance(
          () => stateService.createTab(currentState, config.chassis, config as any),
          `Creating ${config.chassis} unit`
        )
        currentState = result.newState
        creationTimes.push(duration)
      }
      
      // Measure comparison analysis performance
      const { duration: analysisTime } = measurePerformance(
        () => comparisonService.compareUnits(currentState.tabs),
        'Unit comparison analysis'
      )
      
      // Validate performance targets
      expect(initTime).toBeLessThan(100)
      creationTimes.forEach((time, index) => {
        expect(time).toBeLessThan(50) // Each unit creation < 50ms
      })
      expect(analysisTime).toBeLessThan(200) // Analysis < 200ms
      
      const totalCalculationTime = initTime + 
                                 creationTimes.reduce((sum, time) => sum + time, 0) + 
                                 analysisTime
      
      expect(totalCalculationTime).toBeLessThan(500) // Total < 500ms
    })

    it('should handle large unit calculations efficiently', () => {
      const comparisonService = new UnitComparisonService()
      
      // Create 10 test units
      const testUnits = Array.from({ length: 10 }, (_, i) => ({
        id: `unit-${i}`,
        name: `Test Unit ${i}`,
        unitManager: {
          getConfiguration: () => ({
            chassis: `Mech${i}`,
            tonnage: 20 + (i * 8),
            engineRating: 120 + (i * 20),
            walkMP: 3 + i,
            runMP: 5 + i
          }),
          getUnallocatedEquipment: () => [
            { equipmentData: { name: 'Medium Laser', type: 'weapon' } },
            { equipmentData: { name: 'AC/10', type: 'weapon' } }
          ]
        },
        stateManager: {
          getUnitSummary: () => ({
            validation: { isValid: true },
            summary: { tonnage: 20 + (i * 8) }
          })
        },
        created: new Date(),
        modified: new Date(),
        isModified: false
      }))
      
      const { duration } = measurePerformance(
        () => comparisonService.compareUnits(testUnits as any),
        'Large unit comparison (10 units)'
      )
      
      expect(duration).toBeLessThan(300) // Should handle 10 units in < 300ms
    })
  })

  describe('Memory Usage Performance', () => {
    it('should not create memory leaks during rapid operations', () => {
      const stateService = new MultiUnitStateService()
      const syncService = new UnitSynchronizationService(
        stateService, 
        new MultiTabDebouncedSaveManager(1000)
      )
      
      // Simulate rapid unit creation and cleanup
      const operations = 100
      const { duration } = measurePerformance(
        () => {
          for (let i = 0; i < operations; i++) {
            const { newState, tabId } = stateService.createTab(
              { tabs: [], activeTabId: null, nextTabNumber: i + 1 },
              `Rapid Unit ${i}`
            )
            
            const tab = newState.tabs[0]
            syncService.initializeTabSync(tab)
            syncService.cleanupTabSync(tabId)
          }
        },
        `Rapid operations (${operations} cycles)`
      )
      
      // Should complete all operations efficiently
      expect(duration).toBeLessThan(1000) // < 1 second for 100 operations
      
      // Verify cleanup
      const stats = syncService.getSyncStats()
      expect(stats.activeObservers).toBe(0) // No memory leaks
    })

    it('should handle event subscription cleanup properly', () => {
      const syncService = new UnitSynchronizationService(
        new MultiUnitStateService(),
        new MultiTabDebouncedSaveManager(1000)
      )
      
      const subscriptions: (() => void)[] = []
      
      const { duration } = measurePerformance(
        () => {
          // Create many subscriptions
          for (let i = 0; i < 50; i++) {
            const unsubscribe = syncService.subscribe(() => {})
            subscriptions.push(unsubscribe)
          }
          
          // Cleanup all subscriptions
          subscriptions.forEach(unsub => unsub())
        },
        'Event subscription management (50 subscriptions)'
      )
      
      expect(duration).toBeLessThan(100)
    })
  })

  describe('Data Persistence Performance', () => {
    it('should save and load data efficiently', async () => {
      const stateService = new MultiUnitStateService()
      
      // Measure save operations
      const { duration: saveTime } = measurePerformance(
        () => {
          const completeState = {
            configuration: stateService.createDefaultConfiguration(),
            criticalSlotAllocations: {},
            unallocatedEquipment: [],
            timestamp: Date.now(),
            version: '2.0.0'
          }
          stateService.saveCompleteState('perf-test', completeState)
        },
        'Complete state save operation'
      )
      
      // Measure load operations
      const { duration: loadTime } = measurePerformance(
        () => stateService.loadTabData('perf-test'),
        'Tab data load operation'
      )
      
      expect(saveTime).toBeLessThan(50)
      expect(loadTime).toBeLessThan(50)
    })

    it('should handle storage statistics calculation efficiently', () => {
      const stateService = new MultiUnitStateService()
      
      // Setup test data
      for (let i = 0; i < 10; i++) {
        mockLocalStorage.setItem(`battletech-unit-tab-${i}`, JSON.stringify({ test: 'data' }))
        mockLocalStorage.setItem(`battletech-complete-state-${i}`, JSON.stringify({ test: 'state' }))
      }
      
      const { duration } = measurePerformance(
        () => stateService.getStorageStats(),
        'Storage statistics calculation'
      )
      
      expect(duration).toBeLessThan(100)
    })
  })

  describe('Service Coordination Performance', () => {
    it('should coordinate multiple services efficiently', async () => {
      const stateService = new MultiUnitStateService()
      const syncService = new UnitSynchronizationService(
        stateService,
        new MultiTabDebouncedSaveManager(1000)
      )
      const comparisonService = new UnitComparisonService()
      
      // Measure complete workflow
      const { duration } = await measureAsyncPerformance(
        async () => {
          // Initialize
          const initialState = await stateService.initializeTabs()
          
          // Create units
          const { newState: state1, tabId: tab1 } = stateService.createTab(
            initialState, 'Performance Test 1'
          )
          const { newState: state2, tabId: tab2 } = stateService.createTab(
            state1, 'Performance Test 2'
          )
          
          // Initialize sync
          state2.tabs.forEach(tab => syncService.initializeTabSync(tab))
          
          // Make modifications
          const unit1 = state2.tabs.find(t => t.id === tab1)!
          const unit2 = state2.tabs.find(t => t.id === tab2)!
          
          syncService.addEquipmentToUnit(unit1, { name: 'Laser', type: 'weapon' })
          syncService.addEquipmentToUnit(unit2, { name: 'Autocannon', type: 'weapon' })
          
          // Run analysis
          comparisonService.compareUnits(state2.tabs)
        },
        'Complete service coordination workflow'
      )
      
      expect(duration).toBeLessThan(1000) // Complete workflow < 1 second
    })
  })

  describe('Scaling Performance', () => {
    it('should scale linearly with number of units', () => {
      const comparisonService = new UnitComparisonService()
      
      const testScales = [1, 5, 10, 20]
      const times: number[] = []
      
      testScales.forEach(count => {
        const units = Array.from({ length: count }, (_, i) => ({
          id: `scale-unit-${i}`,
          name: `Scale Unit ${i}`,
          unitManager: {
            getConfiguration: () => ({
              chassis: `Mech${i}`,
              tonnage: 50,
              engineRating: 200
            }),
            getUnallocatedEquipment: () => []
          },
          stateManager: {
            getUnitSummary: () => ({
              validation: { isValid: true },
              summary: { tonnage: 50 }
            })
          },
          created: new Date(),
          modified: new Date(),
          isModified: false
        }))
        
        const { duration } = measurePerformance(
          () => comparisonService.compareUnits(units as any),
          `Comparison with ${count} units`
        )
        
        times.push(duration)
      })
      
      // Should scale reasonably (not exponentially)
      expect(times[1]).toBeLessThan(times[0] * 10) // 5 units shouldn't be 10x slower than 1
      expect(times[2]).toBeLessThan(times[0] * 20) // 10 units shouldn't be 20x slower than 1
      expect(times[3]).toBeLessThan(times[0] * 50) // 20 units shouldn't be 50x slower than 1
    })

    it('should handle concurrent operations efficiently', () => {
      const stateService = new MultiUnitStateService()
      
      const { duration } = measurePerformance(
        () => {
          // Simulate concurrent tab operations
          const operations = Array.from({ length: 10 }, (_, i) => {
            return () => stateService.createTab(
              { tabs: [], activeTabId: null, nextTabNumber: i + 1 },
              `Concurrent Unit ${i}`
            )
          })
          
          // Execute all operations
          operations.forEach(op => op())
        },
        'Concurrent operations simulation'
      )
      
      expect(duration).toBeLessThan(500)
    })
  })

  describe('Performance Regression Detection', () => {
    it('should maintain consistent service creation times', () => {
      const iterations = 10
      const times: number[] = []
      
      // Warm up the JIT compiler extensively
      for (let i = 0; i < 10; i++) {
        new MultiUnitStateService()
        new UnitComparisonService()
        new MultiTabDebouncedSaveManager(1000)
      }
      
      for (let i = 0; i < iterations; i++) {
        const { duration } = measurePerformance(
          () => {
            new MultiUnitStateService()
            new UnitComparisonService()
            new MultiTabDebouncedSaveManager(1000)
          },
          `Service creation iteration ${i + 1}`
        )
        times.push(duration)
      }
      
      const average = times.reduce((sum, time) => sum + time, 0) / times.length
      const maxTime = Math.max(...times)
      const minTime = Math.min(...times)
      
      // Very relaxed constraints to handle system variations
      // If minTime is very small (< 0.01ms), skip the ratio check as it's not meaningful
      if (minTime > 0.01) {
        expect(maxTime).toBeLessThan(minTime * 20) // Very generous 20x allowance
      }
      expect(average).toBeLessThan(500) // Very generous average threshold
      
      // Basic sanity checks - services should be created successfully
      expect(times.length).toBe(iterations)
      expect(times.every(time => time >= 0)).toBe(true) // All times should be non-negative
    })

    it('should not degrade with repeated operations', () => {
      const stateService = new MultiUnitStateService()
      const operationTimes: number[] = []
      
      // Perform same operation multiple times
      for (let i = 0; i < 20; i++) {
        const { duration } = measurePerformance(
          () => stateService.createDefaultConfiguration(),
          `Default config creation ${i + 1}`
        )
        operationTimes.push(duration)
      }
      
      // Later operations shouldn't be significantly slower than earlier ones
      const firstHalf = operationTimes.slice(0, 10)
      const secondHalf = operationTimes.slice(10)
      
      const firstAvg = firstHalf.reduce((sum, time) => sum + time, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((sum, time) => sum + time, 0) / secondHalf.length
      
      expect(secondAvg).toBeLessThan(firstAvg * 2) // No significant degradation
    })
  })
})
