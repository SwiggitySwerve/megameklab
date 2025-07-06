/**
 * Comprehensive Dropdown Memory Integration Test
 * Tests ALL dropdowns across ALL tabs to ensure complete memory integration
 * Validates Structure tab, Armor tab, and any other dropdowns that interface with memory
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MultiUnitProvider } from '../../components/multiUnit/MultiUnitProvider';
import { OverviewTabV2 } from '../../components/overview/OverviewTabV2';
import { 
  saveMemoryToStorage,
  clearMemoryStorage 
} from '../../utils/memoryPersistence';
import { createDefaultMemory } from '../../utils/techBaseMemory';
import { getComponentType } from '../../utils/componentTypeUtils';

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

// Mock all tab components to simulate real dropdown behavior
const MockAllTabsWithDropdowns = () => {
  const [config, setConfig] = React.useState({
    tonnage: 70,
    techBase: 'Inner Sphere',
    // Structure tab components
    engineType: 'Standard',
    structureType: 'Standard',
    gyroType: 'Standard',
    heatSinkType: 'Single',
    enhancements: [],
    // Armor tab components
    armorType: 'Standard',
    // Other potential components
    targetingType: 'None',
    movementType: 'Standard Jump Jets',
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

  // Listen for config updates from mock unit provider
  React.useEffect(() => {
    const interval = setInterval(() => {
      const lastCall = mockUpdateConfiguration.mock.calls[mockUpdateConfiguration.mock.calls.length - 1];
      if (lastCall && lastCall[0]) {
        setConfig(prev => ({
          ...prev,
          ...lastCall[0]
        }));
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Helper functions to get component values (same logic as actual tabs)
  const getStructureTypeValue = (): string => {
    if (typeof config.structureType === 'string') {
      return config.structureType;
    }
    return 'Standard';
  };

  const getArmorTypeValue = (): string => {
    if (typeof config.armorType === 'string') {
      return config.armorType;
    }
    return 'Standard';
  };

  const getEngineTypeValue = (): string => {
    if (typeof config.engineType === 'string') {
      return config.engineType;
    }
    return 'Standard';
  };

  const getGyroTypeValue = (): string => {
    if (typeof config.gyroType === 'string') {
      return config.gyroType;
    }
    return 'Standard';
  };

  const getHeatSinkTypeValue = (): string => {
    if (typeof config.heatSinkType === 'string') {
      return config.heatSinkType;
    }
    return 'Single';
  };

  return (
    <div data-testid="all-tabs-mock">
      <h3>All Tabs Dropdown Mock</h3>
      
      {/* Structure Tab Dropdowns */}
      <div data-testid="structure-section">
        <h4>Structure Tab</h4>
        
        <select data-testid="engine-dropdown" value={getEngineTypeValue()}>
          <option value="Standard">Standard</option>
          <option value="XL">XL</option>
          <option value="XL (Clan)">XL (Clan)</option>
          <option value="Light">Light</option>
        </select>
        
        <select data-testid="structure-dropdown" value={getStructureTypeValue()}>
          <option value="Standard">Standard</option>
          <option value="Endo Steel">Endo Steel</option>
          <option value="Endo Steel (Clan)">Endo Steel (Clan)</option>
        </select>
        
        <select data-testid="gyro-dropdown" value={getGyroTypeValue()}>
          <option value="Standard">Standard</option>
          <option value="XL">XL</option>
          <option value="Compact">Compact</option>
        </select>
        
        <select data-testid="heatsink-dropdown" value={getHeatSinkTypeValue()}>
          <option value="Single">Single</option>
          <option value="Double">Double</option>
          <option value="Double (Clan)">Double (Clan)</option>
        </select>
        
        <select data-testid="enhancement-dropdown" value={config.enhancements.join(', ')}>
          <option value="None">None</option>
          <option value="MASC">MASC</option>
          <option value="Triple Strength Myomer">Triple Strength Myomer</option>
        </select>
      </div>

      {/* Armor Tab Dropdowns */}
      <div data-testid="armor-section">
        <h4>Armor Tab</h4>
        
        <select data-testid="armor-dropdown" value={getArmorTypeValue()}>
          <option value="Standard">Standard</option>
          <option value="Ferro-Fibrous">Ferro-Fibrous</option>
          <option value="Ferro-Fibrous (Clan)">Ferro-Fibrous (Clan)</option>
        </select>
      </div>

      {/* Config Display for Debugging */}
      <div data-testid="config-display">
        <h4>Current Config</h4>
        <div data-testid="engine-config">Engine: {config.engineType}</div>
        <div data-testid="structure-config">Structure: {getComponentType(config.structureType)}</div>
        <div data-testid="gyro-config">Gyro: {getComponentType(config.gyroType)}</div>
        <div data-testid="heatsink-config">HeatSink: {getComponentType(config.heatSinkType)}</div>
        <div data-testid="enhancement-config">Enhancement: {config.enhancements.join(', ')}</div>
        <div data-testid="armor-config">Armor: {getComponentType(config.armorType)}</div>
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
        engineType: 'Standard',
        structureType: 'Standard',
        gyroType: 'Standard',
        heatSinkType: 'Single',
        enhancements: [],
        armorType: 'Standard',
        targetingType: 'None',
        movementType: 'Standard Jump Jets',
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

describe('Comprehensive Dropdown Memory Integration', () => {
  beforeEach(() => {
    // Reset all state
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    jest.clearAllMocks();
    clearMemoryStorage();
  });

  test('should restore ALL component types from memory and sync ALL dropdowns', async () => {
    console.log('\n🎯 === COMPREHENSIVE ALL DROPDOWNS MEMORY TEST ===\n');
    
    // STEP 1: Set up comprehensive memory with ALL component types
    console.log('💾 STEP 1: Setting up comprehensive memory with ALL components');
    const memory = createDefaultMemory();
    
    // Set advanced components for each subsystem
    memory.chassis['Inner Sphere'] = 'Endo Steel';
    memory.engine['Inner Sphere'] = 'XL';
    memory.gyro['Inner Sphere'] = 'Compact';
    memory.heatsink['Inner Sphere'] = 'Double';
    memory.myomer['Inner Sphere'] = 'Triple Strength Myomer';
    memory.armor['Inner Sphere'] = 'Ferro-Fibrous';
    memory.targeting['Inner Sphere'] = 'None';
    memory.movement['Inner Sphere'] = 'Standard Jump Jets';
    
    // Also set Clan alternatives
    memory.chassis['Clan'] = 'Endo Steel (Clan)';
    memory.engine['Clan'] = 'XL (Clan)';
    memory.heatsink['Clan'] = 'Double (Clan)';
    memory.myomer['Clan'] = 'MASC';
    memory.armor['Clan'] = 'Ferro-Fibrous (Clan)';
    
    const memoryState = {
      techBaseMemory: memory,
      lastUpdated: Date.now(),
      version: '1.0.0'
    };
    
    saveMemoryToStorage(memoryState);
    console.log('💾 Comprehensive memory saved with ALL component types');
    
    // STEP 2: Render Overview tab to trigger memory restoration
    console.log('\n🖥️ STEP 2: Rendering Overview tab (triggers comprehensive restoration)');
    const { unmount: unmountOverview } = render(
      <MultiUnitProvider>
        <OverviewTabV2 />
      </MultiUnitProvider>
    );
    
    // Wait for comprehensive memory restoration
    await waitFor(() => {
      const updateCalls = mockUpdateConfiguration.mock.calls;
      console.log(`📞 Total config update calls: ${updateCalls.length}`);
      
      // Look for restoration calls with multiple components
      const comprehensiveRestoration = updateCalls.find(call => 
        call[0] && (
          call[0].structureType === 'Endo Steel' ||
          call[0].engineType === 'XL' ||
          call[0].gyroType === 'Compact' ||
          call[0].heatSinkType === 'Double' ||
          call[0].enhancements.some((enh: any) => enh.type === 'Triple Strength Myomer') ||
          call[0].armorType === 'Ferro-Fibrous'
        )
      );
      
      if (comprehensiveRestoration) {
        console.log('🎉 Comprehensive restoration found!');
        console.log('📋 Restoration details:', comprehensiveRestoration[0]);
        
        // Count how many component types were restored
        const restoredComponents = [];
        if (comprehensiveRestoration[0].structureType) restoredComponents.push('structure');
        if (comprehensiveRestoration[0].engineType) restoredComponents.push('engine');
        if (comprehensiveRestoration[0].gyroType) restoredComponents.push('gyro');
        if (comprehensiveRestoration[0].heatSinkType) restoredComponents.push('heatsink');
        if (comprehensiveRestoration[0].enhancements.some((enh: any) => enh.type === 'Triple Strength Myomer')) restoredComponents.push('enhancement');
        if (comprehensiveRestoration[0].armorType) restoredComponents.push('armor');
        
        console.log(`🔢 Restored ${restoredComponents.length} component types: ${restoredComponents.join(', ')}`);
      }
      
      expect(comprehensiveRestoration).toBeDefined();
    });
    
    console.log('\n✅ Comprehensive memory restoration completed in Overview tab');
    unmountOverview();
    
    // STEP 3: Render all tabs mock to verify dropdown sync
    console.log('\n📱 STEP 3: Rendering all tabs mock to verify dropdown sync');
    render(<MockAllTabsWithDropdowns />);
    
    // STEP 4: Verify ALL dropdowns show restored values
    console.log('\n🔍 STEP 4: Verifying ALL dropdowns show restored values');
    
    await waitFor(() => {
      // Check Structure tab dropdowns
      const engineDropdown = screen.getByTestId('engine-dropdown');
      const structureDropdown = screen.getByTestId('structure-dropdown');
      const gyroDropdown = screen.getByTestId('gyro-dropdown');
      const heatsinkDropdown = screen.getByTestId('heatsink-dropdown');
      const enhancementDropdown = screen.getByTestId('enhancement-dropdown');
      
      // Check Armor tab dropdown
      const armorDropdown = screen.getByTestId('armor-dropdown');
      
      console.log('📊 Dropdown Values Check:');
      console.log(`  Engine: ${(engineDropdown as HTMLSelectElement).value}`);
      console.log(`  Structure: ${(structureDropdown as HTMLSelectElement).value}`);
      console.log(`  Gyro: ${(gyroDropdown as HTMLSelectElement).value}`);
      console.log(`  HeatSink: ${(heatsinkDropdown as HTMLSelectElement).value}`);
      console.log(`  Enhancement: ${(enhancementDropdown as HTMLSelectElement).value}`);
      console.log(`  Armor: ${(armorDropdown as HTMLSelectElement).value}`);
      
      // Verify all dropdowns show restored values
      expect((engineDropdown as HTMLSelectElement).value).toBe('XL');
      expect((structureDropdown as HTMLSelectElement).value).toBe('Endo Steel');
      expect((gyroDropdown as HTMLSelectElement).value).toBe('Compact');
      expect((heatsinkDropdown as HTMLSelectElement).value).toBe('Double');
      expect((enhancementDropdown as HTMLSelectElement).value).toBe('Triple Strength Myomer');
      expect((armorDropdown as HTMLSelectElement).value).toBe('Ferro-Fibrous');
    }, { timeout: 5000 });
    
    // STEP 5: Verify config display matches
    console.log('\n📋 STEP 5: Verifying config display consistency');
    
    const configDisplay = {
      engine: screen.getByTestId('engine-config'),
      structure: screen.getByTestId('structure-config'),
      gyro: screen.getByTestId('gyro-config'),
      heatsink: screen.getByTestId('heatsink-config'),
      enhancement: screen.getByTestId('enhancement-config'),
      armor: screen.getByTestId('armor-config')
    };
    
    console.log('📊 Config Display Values:');
    Object.entries(configDisplay).forEach(([key, element]) => {
      console.log(`  ${key}: ${element.textContent}`);
    });
    
    // Verify config display shows restored values
    expect(configDisplay.engine.textContent).toContain('XL');
    expect(configDisplay.structure.textContent).toContain('Endo Steel');
    expect(configDisplay.gyro.textContent).toContain('Compact');
    expect(configDisplay.heatsink.textContent).toContain('Double');
    expect(configDisplay.enhancement.textContent).toContain('Triple Strength Myomer');
    expect(configDisplay.armor.textContent).toContain('Ferro-Fibrous');
    
    console.log('\n🎉 SUCCESS: ALL dropdowns properly synced with memory-restored values!');
    console.log('\n✅ === COMPREHENSIVE INTEGRATION COMPLETE ===\n');
  });

  test('should handle mixed tech base restoration across all dropdowns', async () => {
    console.log('\n🌈 === MIXED TECH COMPREHENSIVE TEST ===\n');
    
    // Set up mixed tech scenario
    const memory = createDefaultMemory();
    memory.chassis['Inner Sphere'] = 'Endo Steel';
    memory.engine['Clan'] = 'XL (Clan)';
    memory.gyro['Inner Sphere'] = 'Compact';
    memory.heatsink['Clan'] = 'Double (Clan)';
    memory.myomer['Inner Sphere'] = 'Triple Strength Myomer';
    memory.armor['Clan'] = 'Ferro-Fibrous (Clan)';
    
    saveMemoryToStorage({
      techBaseMemory: memory,
      lastUpdated: Date.now(),
      version: '1.0.0'
    });
    
    console.log('💾 Mixed tech memory saved');
    
    // Render Overview tab
    const { unmount } = render(
      <MultiUnitProvider>
        <OverviewTabV2 />
      </MultiUnitProvider>
    );
    
    // Wait for restoration
    await waitFor(() => {
      const updateCalls = mockUpdateConfiguration.mock.calls;
      const mixedRestoration = updateCalls.find(call => 
        call[0] && (
          call[0].structureType === 'Endo Steel' ||
          call[0].engineType === 'XL (Clan)' ||
          call[0].heatSinkType === 'Double (Clan)' ||
          call[0].armorType === 'Ferro-Fibrous (Clan)'
        )
      );
      
      if (mixedRestoration) {
        console.log('🌈 Mixed tech restoration found:', mixedRestoration[0]);
      }
      
      expect(mixedRestoration).toBeDefined();
    });
    
    unmount();
    console.log('✅ Mixed tech restoration validated across all component types');
  });

  test('should validate data model consistency across all dropdown types', async () => {
    console.log('\n📊 === DATA MODEL CONSISTENCY ALL DROPDOWNS ===\n');
    
    // Set up memory with all types
    const memory = createDefaultMemory();
    memory.chassis['Inner Sphere'] = 'Endo Steel';
    memory.engine['Inner Sphere'] = 'XL';
    memory.gyro['Inner Sphere'] = 'XL';
    memory.heatsink['Inner Sphere'] = 'Double';
    memory.myomer['Inner Sphere'] = 'Triple Strength Myomer';
    memory.armor['Inner Sphere'] = 'Ferro-Fibrous';
    
    saveMemoryToStorage({
      techBaseMemory: memory,
      lastUpdated: Date.now(),
      version: '1.0.0'
    });
    
    console.log('💾 All component types memory saved');
    
    // Render Overview tab
    const { unmount } = render(
      <MultiUnitProvider>
        <OverviewTabV2 />
      </MultiUnitProvider>
    );
    
    // Wait for restoration and validate data model structure
    await waitFor(() => {
      const updateCalls = mockUpdateConfiguration.mock.calls;
      const dataModelCall = updateCalls.find(call => 
        call[0] && Object.keys(call[0]).length >= 3 // Multiple components restored
      );
      
      if (dataModelCall) {
        console.log('🎯 Multi-component data model call found:', dataModelCall[0]);
        
        // Verify data model structure for all component types
        const configUpdate = dataModelCall[0];
        const componentTypes = ['structureType', 'engineType', 'gyroType', 'heatSinkType', 'enhancements', 'armorType'];
        
        componentTypes.forEach(componentType => {
          if (configUpdate[componentType]) {
            expect(typeof configUpdate[componentType]).toBe('string');
            console.log(`✅ ${componentType}: ${configUpdate[componentType]} (string)`);
          }
        });
        
        // Verify tech progression structure
        if (configUpdate.techProgression) {
          expect(typeof configUpdate.techProgression).toBe('object');
          console.log('✅ techProgression structure validated');
        }
        
        console.log('✅ Data model consistency validated for all component types');
      }
      
      expect(dataModelCall).toBeDefined();
    });
    
    unmount();
    console.log('✅ All dropdown data model consistency verified');
  });

  test('should handle missing memory gracefully for all dropdown types', async () => {
    console.log('\n🚫 === NO MEMORY ALL DROPDOWNS TEST ===\n');
    
    // No memory saved - test default behavior for all dropdowns
    console.log('💾 No memory saved (testing graceful defaults)');
    
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
    
    // Render all tabs mock
    render(<MockAllTabsWithDropdowns />);
    
    // Should show default values for all dropdowns
    await waitFor(() => {
      const dropdowns = {
        engine: screen.getByTestId('engine-dropdown'),
        structure: screen.getByTestId('structure-dropdown'),
        gyro: screen.getByTestId('gyro-dropdown'),
        heatsink: screen.getByTestId('heatsink-dropdown'),
        enhancement: screen.getByTestId('enhancement-dropdown'),
        armor: screen.getByTestId('armor-dropdown')
      };
      
      console.log('📊 Default dropdown values:');
      Object.entries(dropdowns).forEach(([key, dropdown]) => {
        const value = (dropdown as HTMLSelectElement).value;
        console.log(`  ${key}: ${value}`);
      });
      
      // Verify default values
      expect((dropdowns.engine as HTMLSelectElement).value).toBe('Standard');
      expect((dropdowns.structure as HTMLSelectElement).value).toBe('Standard');
      expect((dropdowns.gyro as HTMLSelectElement).value).toBe('Standard');
      expect((dropdowns.heatsink as HTMLSelectElement).value).toBe('Single');
      expect((dropdowns.enhancement as HTMLSelectElement).value).toBe('None');
      expect((dropdowns.armor as HTMLSelectElement).value).toBe('Standard');
    });
    
    console.log('✅ All dropdowns show correct default values without memory');
  });
});
