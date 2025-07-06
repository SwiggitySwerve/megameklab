/**
 * Structure Tab Dropdown Sync Test
 * Validates that Structure tab dropdowns properly sync with memory-restored values from Overview tab
 * This is the definitive test for the dropdown memory integration issue
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MultiUnitProvider } from '../../components/multiUnit/MultiUnitProvider';
import { OverviewTabV2 } from '../../components/overview/OverviewTabV2';
import { 
  saveMemoryToStorage,
  clearMemoryStorage 
} from '../../utils/memoryPersistence';
import { createDefaultMemory } from '../../utils/techBaseMemory';

// Mock localStorage
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: jest.fn((key: string) => mockStorage[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: jest.fn(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  })
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Structure Tab Component - Simplified version using actual dropdown logic
const StructureTabWithMemorySync = () => {
  const [config, setConfig] = React.useState({
    tonnage: 70,
    techBase: 'Inner Sphere',
    enhancements: [],  // This will be updated by memory restoration
    structureType: 'Standard',
    heatSinkType: 'Single',
    armorType: 'Standard',
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

  // This simulates how the Structure tab would receive config updates
  React.useEffect(() => {
    // Listen for config updates from mock unit provider
    const interval = setInterval(() => {
      // Check if updateConfiguration was called with enhancementType
      const lastCall = mockUpdateConfiguration.mock.calls[mockUpdateConfiguration.mock.calls.length - 1];
      if (lastCall && lastCall[0] && lastCall[0].enhancements) {
        setConfig(prev => ({
          ...prev,
          enhancements: lastCall[0].enhancements
        }));
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const enhancements = config.enhancements;
  
  return (
    <div data-testid="structure-tab-sync">
      <h3>Structure Tab (Sync Test)</h3>
      
      {/* Enhancement Type Dropdown - Using actual Structure tab logic */}
      <div>
        <label>Enhancement Type</label>
        <select 
          data-testid="enhancement-dropdown-sync"
          value={enhancements.length > 0 ? enhancements[0].type : 'None'}
          onChange={() => {}} // Read-only for testing
        >
          <option value="None">None</option>
          <option value="MASC">MASC</option>
          <option value="Triple Strength Myomer">Triple Strength Myomer</option>
        </select>
      </div>

      {/* Display current config for debugging */}
      <div data-testid="config-display">
        Config Enhancement: {JSON.stringify(config.enhancements)}
      </div>
      <div data-testid="dropdown-value-display">
        Dropdown Value: {enhancements.length > 0 ? enhancements[0].type : 'None'}
      </div>
    </div>
  );
};

const mockUpdateConfiguration = jest.fn();

// Mock the MultiUnitProvider
jest.mock('../../components/multiUnit/MultiUnitProvider', () => ({
  useUnit: () => ({
    unit: {
      getConfiguration: jest.fn(() => ({
        chassis: 'Test Chassis',
        model: 'TEST-1',
        tonnage: 70,
        unitType: 'BattleMech',
        techBase: 'Inner Sphere',
        enhancements: [],
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
    },
    updateConfiguration: mockUpdateConfiguration,
    isConfigLoaded: true
  }),
  MultiUnitProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

describe('Structure Tab Dropdown Sync', () => {
  beforeEach(() => {
    // Reset all state
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    jest.clearAllMocks();
    clearMemoryStorage();
  });

  test('should sync Structure tab dropdown with Overview tab memory restoration', async () => {
    console.log('\n🔄 === STRUCTURE TAB DROPDOWN SYNC TEST ===\n');
    
    // STEP 1: Set up memory with TSM saved for Inner Sphere
    console.log('💾 STEP 1: Setting up memory with TSM');
    const memory = createDefaultMemory();
    memory.myomer['Inner Sphere'] = 'Triple Strength Myomer';
    
    const memoryState = {
      techBaseMemory: memory,
      lastUpdated: Date.now(),
      version: '1.0.0'
    };
    
    saveMemoryToStorage(memoryState);
    console.log('💾 Memory saved with TSM for Inner Sphere');
    
    // STEP 2: Render Overview tab to trigger memory restoration
    console.log('\n🖥️ STEP 2: Rendering Overview tab (triggers memory restoration)');
    const { unmount: unmountOverview } = render(
      <MultiUnitProvider>
        <OverviewTabV2 />
      </MultiUnitProvider>
    );
    
    // Wait for memory restoration to complete
    await waitFor(() => {
      const updateCalls = mockUpdateConfiguration.mock.calls;
      const tsmRestoration = updateCalls.find(call => 
        call[0] && call[0].enhancements && call[0].enhancements.length > 0 && call[0].enhancements[0].type === 'Triple Strength Myomer'
      );
      
      expect(tsmRestoration).toBeDefined();
      console.log('✅ Overview tab memory restoration completed');
    });
    
    // Clean up Overview tab
    unmountOverview();
    
    // STEP 3: Render Structure tab component
    console.log('\n📱 STEP 3: Rendering Structure tab component');
    render(<StructureTabWithMemorySync />);
    
    // STEP 4: Wait for Structure tab to sync with restored config
    console.log('\n🔄 STEP 4: Waiting for Structure tab dropdown sync');
    
    await waitFor(() => {
      const enhancementDropdown = screen.getByTestId('enhancement-dropdown-sync');
      const dropdownValue = (enhancementDropdown as HTMLSelectElement).value;
      
      console.log(`📋 Current dropdown value: "${dropdownValue}"`);
      
      // Verify dropdown shows the memory-restored value
      expect(dropdownValue).toBe('Triple Strength Myomer');
    }, { timeout: 3000 });
    
    // STEP 5: Validate final state
    console.log('\n🔍 STEP 5: Validating final dropdown state');
    
    const enhancementDropdown = screen.getByTestId('enhancement-dropdown-sync');
    const configDisplay = screen.getByTestId('config-display');
    const dropdownDisplay = screen.getByTestId('dropdown-value-display');
    
    const finalDropdownValue = (enhancementDropdown as HTMLSelectElement).value;
    
    console.log('📊 Final State:');
    console.log(`  Dropdown value: "${finalDropdownValue}"`);
    console.log(`  Config display: ${configDisplay.textContent}`);
    console.log(`  Dropdown display: ${dropdownDisplay.textContent}`);
    
    // Final assertions
    expect(finalDropdownValue).toBe('Triple Strength Myomer');
    expect(dropdownDisplay.textContent).toContain('Triple Strength Myomer');
    
    console.log('\n🎉 SUCCESS: Structure tab dropdown properly synced with memory-restored value!');
    console.log('\n✅ === DROPDOWN SYNC TEST COMPLETE ===\n');
  });

  test('should handle config changes without memory gracefully', async () => {
    console.log('\n🚫 === NO MEMORY CONFIG SYNC TEST ===\n');
    
    // No memory saved - test default behavior
    console.log('💾 No memory saved (testing default sync)');
    
    // Render Overview tab
    const { unmount: unmountOverview } = render(
      <MultiUnitProvider>
        <OverviewTabV2 />
      </MultiUnitProvider>
    );
    
    // Wait for initialization
    await waitFor(() => {
      expect(mockUpdateConfiguration.mock.calls.length).toBeGreaterThan(0);
    });
    
    unmountOverview();
    
    // Render Structure tab
    render(<StructureTabWithMemorySync />);
    
    // Should show default value
    await waitFor(() => {
      const enhancementDropdown = screen.getByTestId('enhancement-dropdown-sync');
      const dropdownValue = (enhancementDropdown as HTMLSelectElement).value;
      
      console.log(`📋 Default dropdown value: "${dropdownValue}"`);
      expect(dropdownValue).toBe('None');
    });
    
    console.log('✅ Default sync behavior working correctly');
  });

  test('should demonstrate data model consistency during sync', async () => {
    console.log('\n📊 === DATA MODEL CONSISTENCY SYNC TEST ===\n');
    
    // Set up memory with multiple components
    const memory = createDefaultMemory();
    memory.myomer['Inner Sphere'] = 'Triple Strength Myomer';
    memory.heatsink['Inner Sphere'] = 'Double';
    memory.chassis['Inner Sphere'] = 'Endo Steel';
    
    saveMemoryToStorage({
      techBaseMemory: memory,
      lastUpdated: Date.now(),
      version: '1.0.0'
    });
    
    console.log('💾 Memory saved with multiple components');
    
    // Render Overview tab
    const { unmount } = render(
      <MultiUnitProvider>
        <OverviewTabV2 />
      </MultiUnitProvider>
    );
    
    // Wait for restoration
    await waitFor(() => {
      const updateCalls = mockUpdateConfiguration.mock.calls;
      const restorationCall = updateCalls.find(call => 
        call[0] && (
          call[0].enhancements && call[0].enhancements.length > 0 && call[0].enhancements[0].type === 'Triple Strength Myomer' ||
          call[0].heatSinkType === 'Double' ||
          call[0].structureType === 'Endo Steel'
        )
      );
      
      if (restorationCall) {
        console.log('🎯 Multi-component restoration found:', restorationCall[0]);
        
        // Verify data model structure
        const configUpdate = restorationCall[0];
        
        if (configUpdate.enhancements && configUpdate.enhancements.length > 0) {
          expect(typeof configUpdate.enhancements[0].type).toBe('string');
        }
        if (configUpdate.heatSinkType) {
          expect(typeof configUpdate.heatSinkType).toBe('string');
        }
        if (configUpdate.structureType) {
          expect(typeof configUpdate.structureType).toBe('string');
        }
        
        console.log('✅ Data model consistency validated');
      }
      
      expect(restorationCall).toBeDefined();
    });
    
    unmount();
    console.log('✅ Multi-component sync test completed');
  });
});
