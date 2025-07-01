/**
 * Memory Restoration Integration Tests
 * Tests that reproduce the exact bug shown in screenshots:
 * TSM → Clan (None) → Back to Inner Sphere (should restore TSM)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OverviewTabV2 } from '../../components/overview/OverviewTabV2';
import { MultiUnitProvider } from '../../components/multiUnit/MultiUnitProvider';
import { 
  saveMemoryToStorage,
  clearMemoryStorage,
  initializeMemorySystem 
} from '../../utils/memoryPersistence';
import { createDefaultMemory } from '../../utils/techBaseMemory';

// Mock localStorage for tests
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock unit configuration
const mockUnit = {
  getConfiguration: jest.fn(() => ({
    chassis: 'Test Chassis',
    model: 'TEST-1',
    tonnage: 70,
    unitType: 'BattleMech',
    techBase: 'Inner Sphere',
    enhancementType: 'Triple Strength Myomer', // Start with TSM
    structureType: 'Standard',
    engineType: 'Standard',
    gyroType: 'Standard',
    heatSinkType: 'Standard',
    armorType: 'Standard',
    targetingType: 'Standard',
    movementType: 'Standard',
    techProgression: {
      chassis: 'Inner Sphere',
      gyro: 'Inner Sphere',
      engine: 'Inner Sphere',
      heatsink: 'Inner Sphere',
      targeting: 'Inner Sphere',
      myomer: 'Inner Sphere',
      movement: 'Inner Sphere',
      armor: 'Inner Sphere'
    }
  }))
};

const mockUpdateConfiguration = jest.fn();

// Mock the MultiUnitProvider
jest.mock('../../components/multiUnit/MultiUnitProvider', () => ({
  useUnit: () => ({
    unit: mockUnit,
    updateConfiguration: mockUpdateConfiguration,
    isConfigLoaded: true
  }),
  MultiUnitProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock component database functions
jest.mock('../../utils/componentDatabaseHelpers', () => ({
  getDefaultComponent: jest.fn((category: string, techBase: string) => {
    if (category === 'myomer') {
      return { name: 'None', techBase, category };
    }
    return { name: 'Standard', techBase, category };
  }),
  isComponentAvailable: jest.fn(() => true),
  getComponentsByCategory: jest.fn(() => [])
}));

describe('Memory Restoration Integration Tests', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
    clearMemoryStorage();
  });

  describe('TSM → Clan → Inner Sphere Restoration Bug', () => {
    test('should reproduce the exact bug: TSM not restored when switching back', async () => {
      // STEP 1: Render component with TSM initially selected
      const { rerender } = render(<OverviewTabV2 />);
      
      // Verify initial state shows TSM
      await waitFor(() => {
        expect(screen.getByText('Triple Strength Myomer')).toBeInTheDocument();
      });
      
      // STEP 2: Click Clan button for myomer
      const clanButton = screen.getAllByText('Clan').find(button => 
        button.closest('.grid')?.querySelector('[data-testid="myomer-label"]') ||
        button.closest('.grid')?.textContent?.includes('Tech/Myomer')
      );
      
      expect(clanButton).toBeInTheDocument();
      fireEvent.click(clanButton!);
      
      // Wait for state update
      await waitFor(() => {
        expect(mockUpdateConfiguration).toHaveBeenCalled();
      });
      
      // STEP 3: Simulate the configuration update (Clan shows "None")
      mockUnit.getConfiguration.mockReturnValue({
        ...mockUnit.getConfiguration(),
        enhancementType: 'None',
        techProgression: {
          ...mockUnit.getConfiguration().techProgression,
          myomer: 'Clan'
        }
      });
      
      rerender(<OverviewTabV2 />);
      
      // Verify Clan state shows "None"
      await waitFor(() => {
        expect(screen.getByText('None')).toBeInTheDocument();
      });
      
      // STEP 4: Click Inner Sphere button to switch back
      const innerSphereButton = screen.getAllByText('Inner Sphere').find(button => 
        button.closest('.grid')?.textContent?.includes('Tech/Myomer')
      );
      
      expect(innerSphereButton).toBeInTheDocument();
      fireEvent.click(innerSphereButton!);
      
      await waitFor(() => {
        expect(mockUpdateConfiguration).toHaveBeenCalledTimes(2);
      });
      
      // STEP 5: This is where the bug occurs - TSM should be restored but isn't
      // The test should FAIL initially, proving the bug exists
      
      // Check what the system actually does (should call updateConfiguration with TSM)
      const lastCall = mockUpdateConfiguration.mock.calls[mockUpdateConfiguration.mock.calls.length - 1];
      const updateData = lastCall[0];
      
      // THIS IS THE BUG: enhancementType should be 'Triple Strength Myomer' but it's not being set
      console.log('Configuration update data:', updateData);
      
      // This assertion will FAIL initially, proving the bug
      expect(updateData.enhancementType).toBe('Triple Strength Myomer');
    });

    test('should save TSM to memory when switching to Clan', async () => {
      render(<OverviewTabV2 />);
      
      // Verify TSM is initially selected
      await waitFor(() => {
        expect(screen.getByText('Triple Strength Myomer')).toBeInTheDocument();
      });
      
      // Click Clan button
      const clanButton = screen.getAllByText('Clan').find(button => 
        button.closest('.grid')?.textContent?.includes('Tech/Myomer')
      );
      
      fireEvent.click(clanButton!);
      
      await waitFor(() => {
        expect(mockUpdateConfiguration).toHaveBeenCalled();
      });
      
      // Verify memory was saved (check localStorage)
      const memoryData = mockLocalStorage.getItem('battletech_tech_base_memory');
      expect(memoryData).toBeTruthy();
      
      if (memoryData) {
        const parsed = JSON.parse(memoryData);
        // TSM should be saved to Inner Sphere memory slot
        expect(parsed.techBaseMemory.myomer['Inner Sphere']).toBe('Triple Strength Myomer');
      }
    });

    test('should handle page reload with memory restoration', async () => {
      // STEP 1: Set up initial memory with TSM saved
      const memory = createDefaultMemory();
      memory.myomer['Inner Sphere'] = 'Triple Strength Myomer';
      memory.myomer['Clan'] = 'MASC';
      
      const memoryState = {
        techBaseMemory: memory,
        lastUpdated: Date.now(),
        version: '1.0.0'
      };
      
      saveMemoryToStorage(memoryState);
      
      // STEP 2: Render component (simulating page reload)
      render(<OverviewTabV2 />);
      
      // STEP 3: Component should initialize and apply memory
      // THIS IS WHAT'S CURRENTLY BROKEN - memory loads but isn't applied
      
      await waitFor(() => {
        // Check if updateConfiguration was called with restored values
        const calls = mockUpdateConfiguration.mock.calls;
        
        // Look for a call that restores the component configuration
        const restorationCall = calls.find(call => 
          call[0].enhancementType === 'Triple Strength Myomer'
        );
        
        // This will FAIL initially, proving memory restoration is broken
        expect(restorationCall).toBeDefined();
      });
    });
  });

  describe('MASC → Inner Sphere → Clan Restoration', () => {
    test('should restore MASC when switching back to Clan', async () => {
      // Start with Clan MASC configuration
      mockUnit.getConfiguration.mockReturnValue({
        ...mockUnit.getConfiguration(),
        enhancementType: 'MASC',
        techProgression: {
          ...mockUnit.getConfiguration().techProgression,
          myomer: 'Clan'
        }
      });
      
      render(<OverviewTabV2 />);
      
      // Verify MASC is initially selected
      await waitFor(() => {
        expect(screen.getByText('MASC')).toBeInTheDocument();
      });
      
      // Switch to Inner Sphere
      const innerSphereButton = screen.getAllByText('Inner Sphere').find(button => 
        button.closest('.grid')?.textContent?.includes('Tech/Myomer')
      );
      
      fireEvent.click(innerSphereButton!);
      
      await waitFor(() => {
        expect(mockUpdateConfiguration).toHaveBeenCalled();
      });
      
      // Simulate Inner Sphere state (shows None)
      mockUnit.getConfiguration.mockReturnValue({
        ...mockUnit.getConfiguration(),
        enhancementType: 'None',
        techProgression: {
          ...mockUnit.getConfiguration().techProgression,
          myomer: 'Inner Sphere'
        }
      });
      
      // Switch back to Clan
      const clanButton = screen.getAllByText('Clan').find(button => 
        button.closest('.grid')?.textContent?.includes('Tech/Myomer')
      );
      
      fireEvent.click(clanButton!);
      
      await waitFor(() => {
        expect(mockUpdateConfiguration).toHaveBeenCalledTimes(2);
      });
      
      // Check if MASC was restored
      const lastCall = mockUpdateConfiguration.mock.calls[mockUpdateConfiguration.mock.calls.length - 1];
      const updateData = lastCall[0];
      
      // This should restore MASC
      expect(updateData.enhancementType).toBe('MASC');
    });
  });

  describe('Complex Multi-Component Memory', () => {
    test('should handle multiple components with independent memory', async () => {
      // Set up complex initial state
      mockUnit.getConfiguration.mockReturnValue({
        ...mockUnit.getConfiguration(),
        enhancementType: 'Triple Strength Myomer',
        targetingType: 'Standard',
        engineType: 'XL Engine',
        techProgression: {
          chassis: 'Inner Sphere',
          gyro: 'Inner Sphere',
          engine: 'Inner Sphere',
          heatsink: 'Inner Sphere',
          targeting: 'Inner Sphere',
          myomer: 'Inner Sphere',
          movement: 'Inner Sphere',
          armor: 'Inner Sphere'
        }
      });
      
      render(<OverviewTabV2 />);
      
      // Switch myomer to Clan
      const myomerClanButton = screen.getAllByText('Clan').find(button => 
        button.closest('.grid')?.textContent?.includes('Tech/Myomer')
      );
      fireEvent.click(myomerClanButton!);
      
      await waitFor(() => {
        expect(mockUpdateConfiguration).toHaveBeenCalled();
      });
      
      // Switch targeting to Clan
      const targetingClanButton = screen.getAllByText('Clan').find(button => 
        button.closest('.grid')?.textContent?.includes('Tech/Targeting')
      );
      fireEvent.click(targetingClanButton!);
      
      await waitFor(() => {
        expect(mockUpdateConfiguration).toHaveBeenCalledTimes(2);
      });
      
      // Verify memory saved both components independently
      const memoryData = mockLocalStorage.getItem('battletech_tech_base_memory');
      if (memoryData) {
        const parsed = JSON.parse(memoryData);
        expect(parsed.techBaseMemory.myomer['Inner Sphere']).toBe('Triple Strength Myomer');
        expect(parsed.techBaseMemory.targeting['Inner Sphere']).toBe('Standard');
        expect(parsed.techBaseMemory.engine['Inner Sphere']).toBe('XL Engine');
      }
    });
  });

  describe('Memory Validation Edge Cases', () => {
    test('should handle corrupted memory gracefully', async () => {
      // Set up corrupted memory
      mockLocalStorage.setItem('battletech_tech_base_memory', 'invalid-json');
      
      render(<OverviewTabV2 />);
      
      // Should not crash and should initialize fresh memory
      await waitFor(() => {
        expect(screen.getByText('Unit Overview')).toBeInTheDocument();
      });
      
      // Should have cleared the corrupted data
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('battletech_tech_base_memory');
    });

    test('should handle missing component in memory gracefully', async () => {
      // Set up memory with a component that no longer exists
      const memory = createDefaultMemory();
      memory.myomer['Inner Sphere'] = 'Obsolete Component That No Longer Exists';
      
      const memoryState = {
        techBaseMemory: memory,
        lastUpdated: Date.now(),
        version: '1.0.0'
      };
      
      saveMemoryToStorage(memoryState);
      
      render(<OverviewTabV2 />);
      
      // Should not crash and should fall back to default
      await waitFor(() => {
        expect(screen.getByText('Unit Overview')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Under Memory Operations', () => {
    test('should handle rapid tech base switching efficiently', async () => {
      render(<OverviewTabV2 />);
      
      const startTime = Date.now();
      
      // Rapidly switch tech bases multiple times
      for (let i = 0; i < 10; i++) {
        const clanButton = screen.getAllByText('Clan').find(button => 
          button.closest('.grid')?.textContent?.includes('Tech/Myomer')
        );
        fireEvent.click(clanButton!);
        
        const innerSphereButton = screen.getAllByText('Inner Sphere').find(button => 
          button.closest('.grid')?.textContent?.includes('Tech/Myomer')
        );
        fireEvent.click(innerSphereButton!);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete rapidly (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds for 20 switches
      
      // Should not cause excessive localStorage operations
      const setItemCalls = mockLocalStorage.setItem.mock.calls.length;
      expect(setItemCalls).toBeLessThan(50); // Reasonable upper bound
    });
  });
});
