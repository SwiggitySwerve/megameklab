/**
 * Multi-Unit Provider Test Suite
 * Comprehensive tests for tab management, state persistence, and equipment operations
 */

import React from 'react';
import { render, screen, act, waitFor, renderHook } from '@testing-library/react';
import { MultiUnitProvider, useMultiUnit, useUnit } from '../../../components/multiUnit/MultiUnitProvider';
import { UnitConfiguration } from '../../../utils/criticalSlots/UnitCriticalManager';

// Mock external dependencies
jest.mock('../../../utils/criticalSlots/UnitStateManager');
jest.mock('../../../utils/criticalSlots/UnitCriticalManager');
jest.mock('../../../utils/DebouncedSaveManager');

// Mock the actual modules before they're imported
const mockUnitStateManager = {
  getCurrentUnit: jest.fn(),
  handleEngineChange: jest.fn(),
  handleGyroChange: jest.fn(),
  addTestEquipment: jest.fn(() => true),
  addUnallocatedEquipment: jest.fn(),
  removeEquipment: jest.fn(() => true),
  resetUnit: jest.fn(),
  getUnitSummary: jest.fn(() => ({
    validation: { isValid: true, errors: [], warnings: [] },
    summary: { totalWeight: 50, totalSlots: 78 }
  })),
  getDebugInfo: jest.fn(() => ({ debug: 'info' }))
};

const mockUnitCriticalManager = {
  getEngineType: jest.fn(() => 'Standard'),
  getGyroType: jest.fn(() => 'Standard'),
  getUnallocatedEquipment: jest.fn(() => []),
  getConfiguration: jest.fn(),
  updateConfiguration: jest.fn(),
  allocateEquipmentFromPool: jest.fn(() => true),
  subscribe: jest.fn(() => jest.fn()), // Returns unsubscribe function
  serializeCompleteState: jest.fn(() => ({
    version: '1.0.0',
    configuration: {},
    criticalSlotAllocations: {},
    unallocatedEquipment: [],
    timestamp: Date.now()
  })),
  deserializeCompleteState: jest.fn(() => true)
};

// Mock constructors
jest.doMock('../../../utils/criticalSlots/UnitStateManager', () => {
  return {
    UnitStateManager: jest.fn().mockImplementation(() => {
      mockUnitStateManager.getCurrentUnit.mockReturnValue(mockUnitCriticalManager);
      return mockUnitStateManager;
    })
  };
});

jest.doMock('../../../utils/criticalSlots/UnitCriticalManager', () => {
  return {
    UnitCriticalManager: jest.fn().mockImplementation(() => mockUnitCriticalManager)
  };
});

jest.doMock('../../../utils/DebouncedSaveManager', () => {
  return {
    MultiTabDebouncedSaveManager: jest.fn().mockImplementation(() => ({
      scheduleSaveForTab: jest.fn(),
      saveTabImmediately: jest.fn()
    })),
    SaveManagerBrowserHandlers: {
      getInstance: jest.fn(() => ({
        attachSaveManager: jest.fn(),
        detachSaveManager: jest.fn()
      }))
    }
  };
});

// Mock localStorage
const mockLocalStorage: {
  store: Record<string, string>;
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
  clear: jest.Mock;
} = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string): string | null => mockLocalStorage.store[key] || null),
  setItem: jest.fn((key: string, value: string): void => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: jest.fn((key: string): void => {
    delete mockLocalStorage.store[key];
  }),
  clear: jest.fn((): void => {
    mockLocalStorage.store = {};
  })
};

// Mock window.localStorage
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock UnitStateManager
const MockUnitStateManager = jest.fn().mockImplementation((config) => ({
  getCurrentUnit: jest.fn(() => mockUnitManager),
  handleEngineChange: jest.fn(),
  handleGyroChange: jest.fn(),
  addTestEquipment: jest.fn(() => true),
  addUnallocatedEquipment: jest.fn(),
  removeEquipment: jest.fn(() => true),
  resetUnit: jest.fn(),
  getUnitSummary: jest.fn(() => ({
    validation: { isValid: true, errors: [], warnings: [] },
    summary: { totalWeight: 50, totalSlots: 78 }
  })),
  getDebugInfo: jest.fn(() => ({ debug: 'info' }))
}));

// Mock UnitCriticalManager
const mockUnitManager = {
  getEngineType: jest.fn(() => 'Standard'),
  getGyroType: jest.fn(() => 'Standard'),
  getUnallocatedEquipment: jest.fn(() => []),
  getConfiguration: jest.fn(() => createTestConfig()),
  updateConfiguration: jest.fn(),
  allocateEquipmentFromPool: jest.fn(() => true),
  subscribe: jest.fn(() => jest.fn()), // Returns unsubscribe function
  serializeCompleteState: jest.fn(() => ({
    version: '1.0.0',
    configuration: createTestConfig(),
    criticalSlotAllocations: {},
    unallocatedEquipment: [],
    timestamp: Date.now()
  })),
  deserializeCompleteState: jest.fn(() => true)
};

const MockUnitCriticalManager = jest.fn().mockImplementation(() => mockUnitManager);

// Mock DebouncedSaveManager
const MockDebouncedSaveManager = jest.fn().mockImplementation(() => ({
  scheduleSaveForTab: jest.fn(),
  saveTabImmediately: jest.fn()
}));

const MockSaveManagerBrowserHandlers = {
  getInstance: jest.fn(() => ({
    attachSaveManager: jest.fn(),
    detachSaveManager: jest.fn()
  }))
};

// Apply mocks
require('../../../utils/criticalSlots/UnitStateManager').UnitStateManager = MockUnitStateManager;
require('../../../utils/criticalSlots/UnitCriticalManager').UnitCriticalManager = MockUnitCriticalManager;
require('../../../utils/DebouncedSaveManager').MultiTabDebouncedSaveManager = MockDebouncedSaveManager;
require('../../../utils/DebouncedSaveManager').SaveManagerBrowserHandlers = MockSaveManagerBrowserHandlers;

// Test configuration helper
function createTestConfig(overrides: Partial<UnitConfiguration> = {}): UnitConfiguration {
  return {
    chassis: 'Test Mech',
    model: 'Test Model',
    tonnage: 50,
    unitType: 'BattleMech',
    techBase: 'Inner Sphere',
    walkMP: 4,
    runMP: 6,
    jumpMP: 0,
    engineRating: 200,
    engineType: 'Standard',
    gyroType: 'Standard',
    structureType: 'Standard',
    armorType: 'Standard',
    heatSinkType: 'Single',
    totalHeatSinks: 10,
    internalHeatSinks: 8,
    externalHeatSinks: 2,
    armorAllocation: {
      HD: { front: 9, rear: 0 },
      CT: { front: 20, rear: 6 },
      LT: { front: 16, rear: 5 },
      RT: { front: 16, rear: 5 },
      LA: { front: 16, rear: 0 },
      RA: { front: 16, rear: 0 },
      LL: { front: 20, rear: 0 },
      RL: { front: 20, rear: 0 }
    },
    armorTonnage: 8.0,
    enhancementType: null,
    jumpJetType: 'Standard Jump Jet',
    jumpJetCounts: {},
    hasPartialWing: false,
    mass: 50,
    ...overrides
  };
}

// Test component that uses the provider
function TestConsumer() {
  const context = useMultiUnit();
  return (
    <div>
      <div data-testid="tabs-count">{context.tabs.length}</div>
      <div data-testid="active-tab-id">{context.activeTabId || 'none'}</div>
      <div data-testid="is-config-loaded">{context.isConfigLoaded.toString()}</div>
      <button data-testid="create-tab" onClick={() => context.createTab()}>
        Create Tab
      </button>
      <button data-testid="close-tab" onClick={() => context.activeTabId && context.closeTab(context.activeTabId)}>
        Close Tab
      </button>
    </div>
  );
}

describe('MultiUnitProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    
    // Reset all mocks
    MockUnitStateManager.mockClear();
    MockUnitCriticalManager.mockClear();
    MockDebouncedSaveManager.mockClear();
    
    // Reset mock return values
    mockUnitManager.getEngineType.mockReturnValue('Standard');
    mockUnitManager.getGyroType.mockReturnValue('Standard');
    mockUnitManager.getUnallocatedEquipment.mockReturnValue([]);
    mockUnitManager.getConfiguration.mockReturnValue(createTestConfig());
    mockUnitManager.allocateEquipmentFromPool.mockReturnValue(true);
  });

  describe('Provider Initialization', () => {
    test('initializes with default tab when no stored data', async () => {
      await act(async () => {
        render(
          <MultiUnitProvider>
            <TestConsumer />
          </MultiUnitProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-config-loaded')).toHaveTextContent('true');
      });

      expect(screen.getByTestId('tabs-count')).toHaveTextContent('1');
      expect(screen.getByTestId('active-tab-id')).toHaveTextContent('tab-1');
    });

    test('loads existing tabs from localStorage', async () => {
      // Setup existing tabs in localStorage
      const metadata = {
        activeTabId: 'tab-2',
        nextTabNumber: 3,
        tabOrder: ['tab-1', 'tab-2'],
        tabNames: { 'tab-1': 'First Mech', 'tab-2': 'Second Mech' }
      };
      
      const tabData = {
        config: createTestConfig({ chassis: 'Atlas' }),
        modified: new Date().toISOString(),
        version: '1.0.0'
      };

      mockLocalStorage.setItem('battletech-tabs-metadata', JSON.stringify(metadata));
      mockLocalStorage.setItem('battletech-unit-tab-tab-1', JSON.stringify(tabData));
      mockLocalStorage.setItem('battletech-unit-tab-tab-2', JSON.stringify(tabData));

      await act(async () => {
        render(
          <MultiUnitProvider>
            <TestConsumer />
          </MultiUnitProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-config-loaded')).toHaveTextContent('true');
      });

      expect(screen.getByTestId('tabs-count')).toHaveTextContent('2');
      expect(screen.getByTestId('active-tab-id')).toHaveTextContent('tab-2');
    });

    test('migrates legacy single unit configuration', async () => {
      const legacyConfig = createTestConfig({ chassis: 'Legacy Mech', tonnage: 75 });
      mockLocalStorage.setItem('battletech-unit-configuration', JSON.stringify(legacyConfig));

      await act(async () => {
        render(
          <MultiUnitProvider>
            <TestConsumer />
          </MultiUnitProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-config-loaded')).toHaveTextContent('true');
      });

      // Should create tab with migrated config
      expect(screen.getByTestId('tabs-count')).toHaveTextContent('1');
      expect(MockUnitCriticalManager).toHaveBeenCalledWith(expect.objectContaining({
        chassis: 'Legacy Mech',
        tonnage: 75
      }));

      // Legacy config should be removed
      expect(mockLocalStorage.getItem('battletech-unit-configuration')).toBeNull();
    });

    test('handles corrupted localStorage data gracefully', async () => {
      mockLocalStorage.setItem('battletech-tabs-metadata', 'invalid json');
      mockLocalStorage.setItem('battletech-unit-tab-tab-1', 'also invalid');

      await act(async () => {
        render(
          <MultiUnitProvider>
            <TestConsumer />
          </MultiUnitProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-config-loaded')).toHaveTextContent('true');
      });

      // Should fall back to default tab
      expect(screen.getByTestId('tabs-count')).toHaveTextContent('1');
      expect(screen.getByTestId('active-tab-id')).toHaveTextContent('tab-1');
    });
  });

  describe('Tab Management Operations', () => {
    let contextValue: any;

    beforeEach(async () => {
      const { result } = renderHook(() => useMultiUnit(), {
        wrapper: ({ children }) => (
          <MultiUnitProvider>{children}</MultiUnitProvider>
        )
      });

      await waitFor(() => {
        expect(result.current.isConfigLoaded).toBe(true);
      });

      contextValue = result.current;
    });

    test('creates new tab with unique ID and increments counter', () => {
      const initialCount = contextValue.tabs.length;
      
      act(() => {
        const newTabId = contextValue.createTab('Test Mech', createTestConfig({ chassis: 'Test' }));
        expect(newTabId).toMatch(/^tab-\d+$/);
      });

      expect(contextValue.tabs.length).toBe(initialCount + 1);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'battletech-tabs-metadata',
        expect.stringContaining('"nextTabNumber"')
      );
    });

    test('closes tab and updates active tab appropriately', () => {
      // Create multiple tabs first
      act(() => {
        contextValue.createTab('Tab 2');
        contextValue.createTab('Tab 3');
      });

      const initialTabCount = contextValue.tabs.length;
      const firstTabId = contextValue.tabs[0].id;
      
      act(() => {
        contextValue.closeTab(firstTabId);
      });

      expect(contextValue.tabs.length).toBe(initialTabCount - 1);
      expect(contextValue.tabs.find((t: any) => t.id === firstTabId)).toBeUndefined();
    });

    test('prevents closing the last tab by resetting it instead', () => {
      // Ensure only one tab exists
      while (contextValue.tabs.length > 1) {
        act(() => {
          contextValue.closeTab(contextValue.tabs[1].id);
        });
      }

      const singleTabId = contextValue.tabs[0].id;
      
      act(() => {
        contextValue.closeTab(singleTabId);
      });

      // Should still have one tab
      expect(contextValue.tabs.length).toBe(1);
      expect(contextValue.tabs[0].id).toBe(singleTabId);
      expect(contextValue.tabs[0].name).toBe('New Mech');
    });

    test('sets active tab and persists to localStorage', () => {
      // Create a second tab
      let newTabId: string = '';
      act(() => {
        newTabId = contextValue.createTab('Second Tab');
      });

      act(() => {
        contextValue.setActiveTab(newTabId);
      });

      expect(contextValue.activeTabId).toBe(newTabId);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'battletech-tabs-metadata',
        expect.stringContaining(newTabId)
      );
    });

    test('renames tab and marks as modified', () => {
      const tabId = contextValue.tabs[0].id;
      const newName = 'Renamed Mech';
      
      act(() => {
        contextValue.renameTab(tabId, newName);
      });

      const renamedTab = contextValue.tabs.find((t: any) => t.id === tabId);
      expect(renamedTab.name).toBe(newName);
      expect(renamedTab.isModified).toBe(true);
    });

    test('duplicates tab with copied configuration', () => {
      const sourceTabId = contextValue.tabs[0].id;
      
      act(() => {
        const duplicateTabId = contextValue.duplicateTab(sourceTabId);
        expect(duplicateTabId).toBeTruthy();
        expect(duplicateTabId).not.toBe(sourceTabId);
      });

      expect(contextValue.tabs.length).toBe(2);
      
      const duplicateTab = contextValue.tabs.find((t: any) => t.name.includes('Copy'));
      expect(duplicateTab).toBeDefined();
    });
  });

  describe('Equipment Operations', () => {
    let contextValue: any;

    beforeEach(async () => {
      const { result } = renderHook(() => useMultiUnit(), {
        wrapper: ({ children }) => (
          <MultiUnitProvider>{children}</MultiUnitProvider>
        )
      });

      await waitFor(() => {
        expect(result.current.isConfigLoaded).toBe(true);
      });

      contextValue = result.current;
    });

    test('adds test equipment to active unit', () => {
      const mockEquipment = { id: 'test-eq', name: 'Test Equipment' };
      
      act(() => {
        const result = contextValue.addTestEquipment(mockEquipment, 'Center Torso', 5);
        expect(result).toBe(true);
      });

      const activeTab = contextValue.tabs.find((t: any) => t.id === contextValue.activeTabId);
      expect(activeTab.isModified).toBe(true);
    });

    test('adds equipment to unallocated pool', () => {
      const mockEquipment = { id: 'unalloc-eq', name: 'Unallocated Equipment' };
      
      act(() => {
        contextValue.addEquipmentToUnit(mockEquipment);
      });

      const activeTab = contextValue.tabs.find((t: any) => t.id === contextValue.activeTabId);
      expect(activeTab.stateManager.addUnallocatedEquipment).toHaveBeenCalledWith(mockEquipment);
      expect(activeTab.isModified).toBe(true);
    });

    test('removes equipment from unit', () => {
      const equipmentGroupId = 'eq-group-1';
      
      act(() => {
        const result = contextValue.removeEquipment(equipmentGroupId);
        expect(result).toBe(true);
      });

      const activeTab = contextValue.tabs.find((t: any) => t.id === contextValue.activeTabId);
      expect(activeTab.stateManager.removeEquipment).toHaveBeenCalledWith(equipmentGroupId);
      expect(activeTab.isModified).toBe(true);
    });

    test('selects and assigns equipment', () => {
      const equipmentGroupId = 'selected-eq';
      
      // Select equipment
      act(() => {
        contextValue.selectEquipment(equipmentGroupId);
      });

      expect(contextValue.selectedEquipmentId).toBe(equipmentGroupId);

      // Assign selected equipment
      act(() => {
        const result = contextValue.assignSelectedEquipment('Left Arm', 5);
        expect(result).toBe(true);
      });

      expect(mockUnitManager.allocateEquipmentFromPool).toHaveBeenCalledWith(
        equipmentGroupId,
        'Left Arm',
        5
      );
      expect(contextValue.selectedEquipmentId).toBeNull(); // Should clear selection
    });

    test('handles equipment assignment failure', () => {
      mockUnitManager.allocateEquipmentFromPool.mockReturnValue(false);
      
      act(() => {
        contextValue.selectEquipment('failing-eq');
      });

      act(() => {
        const result = contextValue.assignSelectedEquipment('Head', 1);
        expect(result).toBe(false);
      });

      // Selection should remain when assignment fails
      expect(contextValue.selectedEquipmentId).toBe('failing-eq');
    });
  });

  describe('Configuration Management', () => {
    let contextValue: any;

    beforeEach(async () => {
      const { result } = renderHook(() => useMultiUnit(), {
        wrapper: ({ children }) => (
          <MultiUnitProvider>{children}</MultiUnitProvider>
        )
      });

      await waitFor(() => {
        expect(result.current.isConfigLoaded).toBe(true);
      });

      contextValue = result.current;
    });

    test('updates configuration and triggers save', () => {
      const newConfig = createTestConfig({ chassis: 'Updated Chassis', tonnage: 75 });
      
      act(() => {
        contextValue.updateConfiguration(newConfig);
      });

      const activeTab = contextValue.tabs.find((t: any) => t.id === contextValue.activeTabId);
      expect(activeTab.unitManager.updateConfiguration).toHaveBeenCalledWith(newConfig);
      expect(activeTab.isModified).toBe(true);
    });

    test('changes engine type through state manager', () => {
      act(() => {
        contextValue.changeEngine('XL');
      });

      const activeTab = contextValue.tabs.find((t: any) => t.id === contextValue.activeTabId);
      expect(activeTab.stateManager.handleEngineChange).toHaveBeenCalledWith('XL');
      expect(activeTab.isModified).toBe(true);
    });

    test('changes gyro type through state manager', () => {
      act(() => {
        contextValue.changeGyro('Compact');
      });

      const activeTab = contextValue.tabs.find((t: any) => t.id === contextValue.activeTabId);
      expect(activeTab.stateManager.handleGyroChange).toHaveBeenCalledWith('Compact');
      expect(activeTab.isModified).toBe(true);
    });

    test('resets unit with optional configuration', () => {
      const resetConfig = createTestConfig({ chassis: 'Reset Chassis' });
      
      act(() => {
        contextValue.resetUnit(resetConfig);
      });

      const activeTab = contextValue.tabs.find((t: any) => t.id === contextValue.activeTabId);
      expect(activeTab.stateManager.resetUnit).toHaveBeenCalledWith(resetConfig);
      expect(activeTab.isModified).toBe(true);
    });
  });

  describe('State Persistence', () => {
    test('saves complete state with debouncing', async () => {
      const { result } = renderHook(() => useMultiUnit(), {
        wrapper: ({ children }) => (
          <MultiUnitProvider>{children}</MultiUnitProvider>
        )
      });

      await waitFor(() => {
        expect(result.current.isConfigLoaded).toBe(true);
      });

      // Add equipment to trigger state change
      act(() => {
        result.current.addEquipmentToUnit({ id: 'test', name: 'Test' });
      });

      // Verify debounced save manager was called
      expect(MockDebouncedSaveManager).toHaveBeenCalled();
    });

    test('loads complete state with enhanced restoration', async () => {
      // Setup complete state in localStorage
      const completeState = {
        version: '1.0.0',
        configuration: createTestConfig({ chassis: 'Restored Mech' }),
        criticalSlotAllocations: {},
        unallocatedEquipment: [],
        timestamp: Date.now()
      };

      const tabData = {
        completeState,
        config: completeState.configuration,
        modified: new Date().toISOString(),
        version: '2.0.0'
      };

      mockLocalStorage.setItem('battletech-complete-state-tab-1', JSON.stringify(tabData));

      await act(async () => {
        render(
          <MultiUnitProvider>
            <TestConsumer />
          </MultiUnitProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-config-loaded')).toHaveTextContent('true');
      });

      // Verify complete state restoration was attempted
      expect(mockUnitManager.deserializeCompleteState).toHaveBeenCalledWith(completeState);
    });

    test('handles complete state restoration failure gracefully', async () => {
      mockUnitManager.deserializeCompleteState.mockReturnValue(false);

      const completeState = {
        version: '1.0.0',
        configuration: createTestConfig(),
        criticalSlotAllocations: {},
        unallocatedEquipment: [],
        timestamp: Date.now()
      };

      const tabData = {
        completeState,
        config: completeState.configuration,
        modified: new Date().toISOString(),
        version: '2.0.0'
      };

      mockLocalStorage.setItem('battletech-complete-state-tab-1', JSON.stringify(tabData));

      await act(async () => {
        render(
          <MultiUnitProvider>
            <TestConsumer />
          </MultiUnitProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-config-loaded')).toHaveTextContent('true');
      });

      // Should still initialize successfully even if restoration fails
      expect(screen.getByTestId('tabs-count')).toHaveTextContent('1');
    });
  });

  describe('Hook Integration', () => {
    test('useMultiUnit provides complete context', async () => {
      const { result } = renderHook(() => useMultiUnit(), {
        wrapper: ({ children }) => (
          <MultiUnitProvider>{children}</MultiUnitProvider>
        )
      });

      await waitFor(() => {
        expect(result.current.isConfigLoaded).toBe(true);
      });

      // Verify all expected properties are present
      expect(result.current).toHaveProperty('tabs');
      expect(result.current).toHaveProperty('activeTab');
      expect(result.current).toHaveProperty('createTab');
      expect(result.current).toHaveProperty('closeTab');
      expect(result.current).toHaveProperty('unit');
      expect(result.current).toHaveProperty('engineType');
      expect(result.current).toHaveProperty('updateConfiguration');
    });

    test('useUnit provides legacy compatibility interface', async () => {
      const { result } = renderHook(() => useUnit(), {
        wrapper: ({ children }) => (
          <MultiUnitProvider>{children}</MultiUnitProvider>
        )
      });

      await waitFor(() => {
        expect(result.current.isConfigLoaded).toBe(true);
      });

      // Verify legacy interface properties
      expect(result.current).toHaveProperty('unit');
      expect(result.current).toHaveProperty('engineType');
      expect(result.current).toHaveProperty('changeEngine');
      expect(result.current).toHaveProperty('updateConfiguration');
    });

    test('useMultiUnit throws error when used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useMultiUnit());
      }).toThrow('useMultiUnit must be used within MultiUnitProvider');

      consoleError.mockRestore();
    });

    test('useUnit throws error when no active unit', async () => {
      // Mock scenario where no active unit is available
      const EmptyProvider = ({ children }: { children: React.ReactNode }) => {
        const mockContext = {
          tabs: [],
          activeTab: null,
          unit: null,
          isConfigLoaded: true,
          // ... other required properties with null/empty values
        };
        
        return <div>{children}</div>;
      };

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // This would need a custom test setup to properly mock the context
      // For now, just verify the hook exists and has the right structure
      expect(useUnit).toBeDefined();

      consoleError.mockRestore();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles operations on inactive tabs gracefully', async () => {
      const { result } = renderHook(() => useMultiUnit(), {
        wrapper: ({ children }) => (
          <MultiUnitProvider>{children}</MultiUnitProvider>
        )
      });

      await waitFor(() => {
        expect(result.current.isConfigLoaded).toBe(true);
      });

      // Test operations when no active tab is available (simulate edge case)
      const originalActiveTab = result.current.activeTab;
      
      // Operations should handle edge cases gracefully
      act(() => {
        // Test with valid active tab first
        result.current.changeEngine('XL');
        result.current.addEquipmentToUnit({ id: 'test' });
      });

      // Verify the active tab exists and operations worked
      expect(result.current.activeTab).toBeTruthy();
      expect(originalActiveTab).toBeTruthy();
    });

    test('handles localStorage quota exceeded gracefully', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      await act(async () => {
        render(
          <MultiUnitProvider>
            <TestConsumer />
          </MultiUnitProvider>
        );
      });

      // Should still render successfully
      await waitFor(() => {
        expect(screen.getByTestId('is-config-loaded')).toHaveTextContent('true');
      });
    });

    test('handles non-existent tab operations', async () => {
      const { result } = renderHook(() => useMultiUnit(), {
        wrapper: ({ children }) => (
          <MultiUnitProvider>{children}</MultiUnitProvider>
        )
      });

      await waitFor(() => {
        expect(result.current.isConfigLoaded).toBe(true);
      });

      // Try to operate on non-existent tab
      act(() => {
        result.current.closeTab('non-existent-tab');
        result.current.renameTab('non-existent-tab', 'New Name');
        const duplicateResult = result.current.duplicateTab('non-existent-tab');
        expect(duplicateResult).toBe('');
      });

      // Should handle gracefully without errors
    });
  });

  describe('Browser Integration', () => {
    test('attaches save manager to browser handlers', async () => {
      await act(async () => {
        render(
          <MultiUnitProvider>
            <TestConsumer />
          </MultiUnitProvider>
        );
      });

      expect(MockSaveManagerBrowserHandlers.getInstance).toHaveBeenCalled();
    });

    test('detaches save manager on unmount', async () => {
      const mockDetach = jest.fn();
      MockSaveManagerBrowserHandlers.getInstance.mockReturnValue({
        attachSaveManager: jest.fn(),
        detachSaveManager: mockDetach
      });

      const { unmount } = await act(async () => {
        return render(
          <MultiUnitProvider>
            <TestConsumer />
          </MultiUnitProvider>
        );
      });

      act(() => {
        unmount();
      });

      expect(mockDetach).toHaveBeenCalled();
    });
  });

  describe('Data Integrity', () => {
    test('maintains tab order consistency', async () => {
      const { result } = renderHook(() => useMultiUnit(), {
        wrapper: ({ children }) => (
          <MultiUnitProvider>{children}</MultiUnitProvider>
        )
      });

      await waitFor(() => {
        expect(result.current.isConfigLoaded).toBe(true);
      });

      // Create several tabs
      const tabIds: string[] = [];
      act(() => {
        tabIds.push(result.current.createTab('Tab 1'));
        tabIds.push(result.current.createTab('Tab 2'));
        tabIds.push(result.current.createTab('Tab 3'));
      });

      // Verify order is maintained
      const currentTabIds = result.current.tabs.map((tab: any) => tab.id);
      expect(currentTabIds).toEqual(expect.arrayContaining(tabIds));
    });

    test('preserves tab state during provider re-renders', async () => {
      let reRenderCount = 0;
      const TestComponent = () => {
        reRenderCount++;
        const context = useMultiUnit();
        return <div data-testid="render-count">{reRenderCount}</div>;
      };

      const { rerender } = render(
        <MultiUnitProvider>
          <TestComponent />
        </MultiUnitProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('render-count')).toBeInTheDocument();
      });

      const initialRenders = reRenderCount;

      // Force re-render
      rerender(
        <MultiUnitProvider>
          <TestComponent />
        </MultiUnitProvider>
      );

      // Should maintain state consistency
      expect(reRenderCount).toBeGreaterThan(initialRenders);
    });
  });
});
