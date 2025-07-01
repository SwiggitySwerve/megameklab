/**
 * Tech Progression Visual State Synchronization Test
 * Focused test to debug the exact visual state update issue
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OverviewTabV2 } from '../../components/overview/OverviewTabV2';
import { useUnit } from '../../components/multiUnit/MultiUnitProvider';

// Mock dependencies
jest.mock('../../components/multiUnit/MultiUnitProvider');
const mockUseUnit = useUnit as jest.MockedFunction<typeof useUnit>;

// Mock utilities with simplified implementations
jest.mock('../../utils/techProgression', () => ({
  updateTechProgression: jest.fn((current, subsystem, techBase) => ({
    ...current,
    [subsystem]: techBase
  })),
  generateTechBaseString: jest.fn((progression) => {
    const values = Object.values(progression);
    const isCount = values.filter(v => v === 'Inner Sphere').length;
    const clanCount = values.filter(v => v === 'Clan').length;
    if (isCount > 0 && clanCount > 0) return 'Mixed';
    return values[0] || 'Inner Sphere';
  }),
  isMixedTech: jest.fn((progression) => {
    const values = Object.values(progression);
    const isCount = values.filter(v => v === 'Inner Sphere').length;
    const clanCount = values.filter(v => v === 'Clan').length;
    return isCount > 0 && clanCount > 0;
  }),
  getPrimaryTechBase: jest.fn((progression) => progression.chassis)
}));

jest.mock('../../utils/techRating', () => ({
  autoUpdateTechRating: jest.fn(() => ({
    era2100_2800: 'D',
    era2801_3050: 'D', 
    era3051_3082: 'D',
    era3083_Now: 'D'
  })),
  getEraForYear: jest.fn(() => '3051-3082'),
  TECH_ERAS: {
    '2100-2800': { name: 'Age of War', start: 2100, end: 2800 },
    '2801-3050': { name: 'Succession Wars', start: 2801, end: 3050 },
    '3051-3082': { name: 'Clan Invasion', start: 3051, end: 3082 },
    '3083-Now': { name: 'Dark Age', start: 3083, end: 3200 }
  }
}));

// Mock component resolution utilities
jest.mock('../../utils/componentResolution', () => ({
  resolveComponentForTechBase: jest.fn((component, category, techBase) => {
    // Return a simple tech-base-specific component name
    if (techBase === 'Clan') {
      return `${component} (Clan)`;
    }
    return component === `${component} (Clan)` ? component.replace(' (Clan)', '') : component;
  })
}));

// Mock tech base memory utilities
jest.mock('../../utils/techBaseMemory', () => ({
  validateAndResolveComponentWithMemory: jest.fn((component, category, oldTech, newTech, memory, rules) => ({
    resolvedComponent: newTech === 'Clan' ? `${component} (Clan)` : component.replace(' (Clan)', ''),
    updatedMemory: memory,
    wasRestored: false,
    resolutionReason: 'fallback'
  })),
  initializeMemoryFromConfiguration: jest.fn(() => ({}))
}));

// Mock memory persistence utilities
jest.mock('../../utils/memoryPersistence', () => ({
  initializeMemorySystem: jest.fn(() => ({
    techBaseMemory: {},
    lastUpdate: Date.now()
  })),
  updateMemoryState: jest.fn((current, updates) => ({ ...current, ...updates })),
  saveMemoryToStorage: jest.fn(),
  loadMemoryFromStorage: jest.fn()
}));

describe('Tech Progression Visual State Synchronization', () => {
  let currentConfig: any;
  let mockUpdateConfiguration: jest.Mock;
  let mockUnit: any;

  const createInitialConfig = () => ({
    chassis: 'Test Mech',
    model: 'TM-1', 
    tonnage: 50,
    techBase: 'Inner Sphere',
    introductionYear: 3025,
    rulesLevel: 'Standard',
    techProgression: {
      chassis: 'Inner Sphere',
      gyro: 'Inner Sphere',
      engine: 'Inner Sphere',
      heatsink: 'Inner Sphere',
      targeting: 'Inner Sphere', // Start with Inner Sphere
      myomer: 'Inner Sphere',
      movement: 'Inner Sphere',
      armor: 'Inner Sphere'
    },
    techRating: {
      era2100_2800: 'D',
      era2801_3050: 'D',
      era3051_3082: 'D', 
      era3083_Now: 'D'
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    currentConfig = createInitialConfig();
    
    mockUnit = {
      getConfiguration: jest.fn(() => currentConfig)
    };
    
    mockUpdateConfiguration = jest.fn((newConfig) => {
      console.log('[TEST] Config update called with:', newConfig);
      currentConfig = { ...currentConfig, ...newConfig };
      mockUnit.getConfiguration.mockReturnValue(currentConfig);
    });
    
    mockUseUnit.mockReturnValue({
      unit: mockUnit,
      updateConfiguration: mockUpdateConfiguration,
      isConfigLoaded: true
    } as any);
  });

  test('VISUAL STATE BUG: Button state should reflect tech progression changes', () => {
    console.log('[TEST] === INITIAL STATE TEST ===');
    console.log('[TEST] Initial config:', currentConfig);
    
    const { rerender } = render(<OverviewTabV2 />);
    
    // Find targeting buttons using data attributes (more reliable)
    const targetingButtons = screen.getAllByRole('button').filter(button => 
      button.textContent === 'Inner Sphere' || button.textContent === 'Clan'
    );
    
    console.log('[TEST] Found buttons:', targetingButtons.length);
    
    // Find the targeting subsystem specifically
    const targetingLabel = screen.getByText('Tech/Targeting');
    const targetingContainer = targetingLabel.closest('.grid');
    
    if (!targetingContainer) {
      console.error('[TEST] Could not find targeting container');
      return;
    }
    
    const innerSphereBtn = targetingContainer.querySelector('button:nth-child(2)') as HTMLElement;
    const clanBtn = targetingContainer.querySelector('button:nth-child(3)') as HTMLElement;
    
    console.log('[TEST] Inner Sphere button classes:', innerSphereBtn?.className);
    console.log('[TEST] Clan button classes:', clanBtn?.className);
    
    // Initially, Inner Sphere should be selected (orange background)
    expect(innerSphereBtn).toHaveClass('bg-orange-600');
    expect(clanBtn).toHaveClass('bg-slate-700/50');
    expect(clanBtn).not.toHaveClass('bg-green-600');
    
    console.log('[TEST] === CLICKING CLAN BUTTON ===');
    
    // Click Clan button
    fireEvent.click(clanBtn);
    
    // Check that updateConfiguration was called
    expect(mockUpdateConfiguration).toHaveBeenCalled();
    const lastCall = mockUpdateConfiguration.mock.calls[mockUpdateConfiguration.mock.calls.length - 1][0];
    console.log('[TEST] Last updateConfiguration call:', lastCall);
    
    // Update current config to reflect the change
    currentConfig = {
      ...currentConfig,
      techProgression: {
        ...currentConfig.techProgression,
        targeting: 'Clan'
      }
    };
    
    console.log('[TEST] Updated config:', currentConfig);
    
    // Force re-render
    rerender(<OverviewTabV2 />);
    
    console.log('[TEST] === AFTER RE-RENDER ===');
    
    // Find buttons again after re-render
    const newTargetingLabel = screen.getByText('Tech/Targeting');
    const newTargetingContainer = newTargetingLabel.closest('.grid');
    const newInnerSphereBtn = newTargetingContainer?.querySelector('button:nth-child(2)') as HTMLElement;
    const newClanBtn = newTargetingContainer?.querySelector('button:nth-child(3)') as HTMLElement;
    
    console.log('[TEST] After re-render Inner Sphere button classes:', newInnerSphereBtn?.className);
    console.log('[TEST] After re-render Clan button classes:', newClanBtn?.className);
    
    // Now Clan should be selected (green background)
    expect(newClanBtn).toHaveClass('bg-green-600');
    expect(newInnerSphereBtn).toHaveClass('bg-slate-700/50');
    expect(newInnerSphereBtn).not.toHaveClass('bg-orange-600');
  });

  test('DEBUGGING: Check current tech base calculation', () => {
    // Set up a mixed tech scenario
    currentConfig = {
      ...createInitialConfig(),
      techProgression: {
        chassis: 'Inner Sphere',
        gyro: 'Inner Sphere', 
        engine: 'Inner Sphere',
        heatsink: 'Inner Sphere',
        targeting: 'Clan', // This should make Clan button selected
        myomer: 'Inner Sphere',
        movement: 'Inner Sphere',
        armor: 'Inner Sphere'
      }
    };
    
    mockUnit.getConfiguration.mockReturnValue(currentConfig);
    
    render(<OverviewTabV2 />);
    
    // Find targeting buttons
    const targetingLabel = screen.getByText('Tech/Targeting');
    const targetingContainer = targetingLabel.closest('.grid');
    const clanBtn = targetingContainer?.querySelector('button:nth-child(3)') as HTMLElement;
    
    console.log('[TEST] DEBUGGING: Current config tech progression:', currentConfig.techProgression);
    console.log('[TEST] DEBUGGING: Targeting tech base:', currentConfig.techProgression.targeting);
    console.log('[TEST] DEBUGGING: Clan button classes:', clanBtn?.className);
    
    // Clan button should be selected because targeting is 'Clan'
    expect(clanBtn).toHaveClass('bg-green-600');
  });

  test('DEBUGGING: Check enhancedConfig calculation', () => {
    // Console spy to capture logs
    const consoleSpy = jest.spyOn(console, 'log');
    
    render(<OverviewTabV2 />);
    
    // Check console logs for config state
    const configLogs = consoleSpy.mock.calls.filter(call => 
      call[0].includes('[OverviewTab]')
    );
    
    console.log('[TEST] DEBUGGING: Console logs from component:', configLogs);
    
    consoleSpy.mockRestore();
  });

  test('DEBUGGING: Check button className calculation logic', () => {
    // Test the exact logic used in the component
    const testProgression = {
      chassis: 'Inner Sphere',
      gyro: 'Inner Sphere',
      engine: 'Inner Sphere', 
      heatsink: 'Inner Sphere',
      targeting: 'Clan', // Targeting is Clan
      myomer: 'Inner Sphere',
      movement: 'Inner Sphere',
      armor: 'Inner Sphere'
    };
    
    const currentTechBase = testProgression.targeting; // Should be 'Clan'
    
    console.log('[TEST] DEBUGGING: Current tech base for targeting:', currentTechBase);
    
    // Test Inner Sphere button className logic
    const innerSphereSelected = currentTechBase === 'Inner Sphere';
    const innerSphereClassName = innerSphereSelected
      ? 'bg-orange-600 text-white border border-orange-500 shadow-md'
      : 'bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:border-orange-500/50 hover:bg-slate-600/50';
    
    // Test Clan button className logic  
    const clanSelected = currentTechBase === 'Clan';
    const clanClassName = clanSelected
      ? 'bg-green-600 text-white border border-green-500 shadow-md'
      : 'bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:border-green-500/50 hover:bg-slate-600/50';
    
    console.log('[TEST] DEBUGGING: Inner Sphere selected:', innerSphereSelected);
    console.log('[TEST] DEBUGGING: Inner Sphere className:', innerSphereClassName);
    console.log('[TEST] DEBUGGING: Clan selected:', clanSelected);
    console.log('[TEST] DEBUGGING: Clan className:', clanClassName);
    
    expect(clanSelected).toBe(true);
    expect(innerSphereSelected).toBe(false);
    expect(clanClassName).toContain('bg-green-600');
    expect(innerSphereClassName).toContain('bg-slate-700/50');
  });
});
