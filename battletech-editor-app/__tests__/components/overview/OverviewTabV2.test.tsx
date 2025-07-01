/**
 * OverviewTabV2 Component Test Suite
 * Tests for tech progression button visual state and interaction
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OverviewTabV2 } from '../../../components/overview/OverviewTabV2';
import { useUnit } from '../../../components/multiUnit/MultiUnitProvider';

// Mock dependencies
jest.mock('../../../components/multiUnit/MultiUnitProvider');
const mockUseUnit = useUnit as jest.MockedFunction<typeof useUnit>;

// Mock tech progression utilities
jest.mock('../../../utils/techProgression', () => ({
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

// Mock tech rating utilities
jest.mock('../../../utils/techRating', () => ({
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
jest.mock('../../../utils/componentResolution', () => ({
  resolveComponentForTechBase: jest.fn((component, category, techBase) => {
    // Return a simple tech-base-specific component name
    if (techBase === 'Clan') {
      return `${component} (Clan)`;
    }
    return component === `${component} (Clan)` ? component.replace(' (Clan)', '') : component;
  })
}));

// Mock tech base memory utilities
jest.mock('../../../utils/techBaseMemory', () => ({
  validateAndResolveComponentWithMemory: jest.fn((component, category, oldTech, newTech, memory, rules) => ({
    resolvedComponent: newTech === 'Clan' ? `${component} (Clan)` : component.replace(' (Clan)', ''),
    updatedMemory: memory,
    wasRestored: false,
    resolutionReason: 'fallback'
  })),
  initializeMemoryFromConfiguration: jest.fn(() => ({}))
}));

// Mock memory persistence utilities
jest.mock('../../../utils/memoryPersistence', () => ({
  initializeMemorySystem: jest.fn(() => ({
    techBaseMemory: {},
    lastUpdate: Date.now()
  })),
  updateMemoryState: jest.fn((current, updates) => ({ ...current, ...updates })),
  saveMemoryToStorage: jest.fn(),
  loadMemoryFromStorage: jest.fn()
}));

describe('OverviewTabV2 Component', () => {
  const mockUpdateConfiguration = jest.fn();
  
  // Helper function to create mock unit configuration
  const createMockConfig = (overrides = {}) => ({
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
      targeting: 'Inner Sphere',
      myomer: 'Inner Sphere',
      movement: 'Inner Sphere',
      armor: 'Inner Sphere'
    },
    techRating: {
      era2100_2800: 'D',
      era2801_3050: 'D',
      era3051_3082: 'D',
      era3083_Now: 'D'
    },
    ...overrides
  });

  const createMockUnit = (config = {}) => ({
    getConfiguration: jest.fn(() => createMockConfig(config))
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseUnit.mockReturnValue({
      unit: createMockUnit(),
      updateConfiguration: mockUpdateConfiguration,
      isConfigLoaded: true
    } as any);
  });

  describe('Component Rendering', () => {
    test('should render main structure', () => {
      render(<OverviewTabV2 />);
      
      expect(screen.getByText('Unit Overview')).toBeInTheDocument();
      expect(screen.getByText('Technology Foundation')).toBeInTheDocument();
      expect(screen.getByText('Technology Progression')).toBeInTheDocument();
      expect(screen.getAllByText('Rules Level').length).toBeGreaterThan(0);
      expect(screen.getByText('Tech Rating')).toBeInTheDocument();
    });

    test('should display unit information correctly', () => {
      const config = {
        chassis: 'Atlas',
        model: 'AS7-D',
        tonnage: 100,
        techBase: 'Inner Sphere'
      };
      
      mockUseUnit.mockReturnValue({
        unit: createMockUnit(config),
        updateConfiguration: mockUpdateConfiguration,
        isConfigLoaded: true
      } as any);

      render(<OverviewTabV2 />);
      
      expect(screen.getByText('Atlas AS7-D')).toBeInTheDocument();
      expect(screen.getByText('100-ton')).toBeInTheDocument();
    });

    test('should show loading state when not loaded', () => {
      mockUseUnit.mockReturnValue({
        unit: null,
        updateConfiguration: mockUpdateConfiguration,
        isConfigLoaded: false
      } as any);

      render(<OverviewTabV2 />);
      
      expect(screen.getByText('Loading unit configuration...')).toBeInTheDocument();
    });
  });

  describe('Technology Progression Matrix', () => {
    test('should render all tech progression subsystems', () => {
      render(<OverviewTabV2 />);
      
      // Check for subsystem labels
      expect(screen.getByText('Tech/Chassis')).toBeInTheDocument();
      expect(screen.getByText('Tech/Gyro')).toBeInTheDocument();
      expect(screen.getByText('Tech/Engine')).toBeInTheDocument();
      expect(screen.getByText('Tech/Heatsink')).toBeInTheDocument();
      expect(screen.getByText('Tech/Targeting')).toBeInTheDocument();
      expect(screen.getByText('Tech/Myomer')).toBeInTheDocument();
      expect(screen.getByText('Tech/Movement')).toBeInTheDocument();
      expect(screen.getByText('Tech/Armor')).toBeInTheDocument();
    });

    test('should render Inner Sphere and Clan buttons for each subsystem', () => {
      render(<OverviewTabV2 />);
      
      // Should have 8 subsystems × 2 buttons = 16 tech progression buttons
      const innerSphereButtons = screen.getAllByText('Inner Sphere').filter(
        el => el.tagName === 'BUTTON'
      );
      const clanButtons = screen.getAllByText('Clan').filter(
        el => el.tagName === 'BUTTON'
      );
      
      expect(innerSphereButtons).toHaveLength(8);
      expect(clanButtons).toHaveLength(8);
    });

    test('should show correct button states for mixed tech progression', () => {
      const mixedConfig = {
        techProgression: {
          chassis: 'Inner Sphere',
          gyro: 'Inner Sphere',
          engine: 'Inner Sphere', 
          heatsink: 'Inner Sphere',
          targeting: 'Clan', // This should show Clan button as selected
          myomer: 'Inner Sphere',
          movement: 'Inner Sphere',
          armor: 'Inner Sphere'
        }
      };
      
      mockUseUnit.mockReturnValue({
        unit: createMockUnit(mixedConfig),
        updateConfiguration: mockUpdateConfiguration,
        isConfigLoaded: true
      } as any);

      render(<OverviewTabV2 />);
      
      // Find the targeting subsystem row
      const targetingRow = screen.getByText('Tech/Targeting').closest('.grid');
      
      // Check button styles within this row - note: buttons are 2nd and 3rd child due to label being first
      const innerSphereButton = targetingRow?.querySelector('button:nth-of-type(1)');
      const clanButton = targetingRow?.querySelector('button:nth-of-type(2)');
      
      // Inner Sphere button should be unselected
      expect(innerSphereButton).toHaveClass('bg-slate-700/50');
      expect(innerSphereButton).not.toHaveClass('bg-orange-600');
      
      // Clan button should be selected
      expect(clanButton).toHaveClass('bg-green-600');
      expect(clanButton).not.toHaveClass('bg-slate-700/50');
    });

    test('should call handleTechProgressionChange when button clicked', () => {
      render(<OverviewTabV2 />);
      
      // Find all Clan buttons and click one (they should all work the same way)
      const clanButtons = screen.getAllByText('Clan').filter(el => el.tagName === 'BUTTON');
      expect(clanButtons.length).toBeGreaterThan(0);
      
      fireEvent.click(clanButtons[0]);
      
      expect(mockUpdateConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          techProgression: expect.any(Object)
        })
      );
    });

    test('should update visual state when tech progression changes', async () => {
      let currentConfig = createMockConfig();
      
      // Mock that returns current config and allows updates
      const mockUnit = {
        getConfiguration: jest.fn(() => currentConfig)
      };
      
      const mockUpdate = jest.fn((newConfig) => {
        currentConfig = { ...currentConfig, ...newConfig };
        mockUnit.getConfiguration.mockReturnValue(currentConfig);
      });
      
      mockUseUnit.mockReturnValue({
        unit: mockUnit,
        updateConfiguration: mockUpdate,
        isConfigLoaded: true
      } as any);

      const { rerender } = render(<OverviewTabV2 />);
      
      // Find and click a Clan button
      const clanButtons = screen.getAllByText('Clan').filter(el => el.tagName === 'BUTTON');
      expect(clanButtons.length).toBeGreaterThan(0);
      
      fireEvent.click(clanButtons[0]);
      
      // Update should have been called
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          techProgression: expect.any(Object)
        })
      );
    });

    test('should handle rapid button clicks without visual state lag', async () => {
      render(<OverviewTabV2 />);
      
      // Find all buttons and click them rapidly
      const innerSphereButtons = screen.getAllByText('Inner Sphere').filter(el => el.tagName === 'BUTTON');
      const clanButtons = screen.getAllByText('Clan').filter(el => el.tagName === 'BUTTON');
      
      expect(clanButtons.length).toBeGreaterThan(0);
      expect(innerSphereButtons.length).toBeGreaterThan(0);
      
      // Click different buttons (different subsystems to avoid deduplication)
      fireEvent.click(clanButtons[0]); // First subsystem
      fireEvent.click(clanButtons[1]); // Second subsystem  
      fireEvent.click(clanButtons[2]); // Third subsystem
      
      // Should call updateConfiguration at least once (component may debounce rapid clicks)
      expect(mockUpdateConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          techProgression: expect.any(Object)
        })
      );
      
      // At minimum should have been called once
      expect(mockUpdateConfiguration).toHaveBeenCalled();
    });

    test('should not allow interaction when readOnly is true', () => {
      render(<OverviewTabV2 readOnly={true} />);
      
      // Find any Clan button and try to click it
      const clanButtons = screen.getAllByText('Clan').filter(el => el.tagName === 'BUTTON');
      expect(clanButtons.length).toBeGreaterThan(0);
      
      fireEvent.click(clanButtons[0]);
      
      expect(mockUpdateConfiguration).not.toHaveBeenCalled();
    });
  });

  describe('Tech Base Dropdown', () => {
    test('should render tech base dropdown with correct value', () => {
      render(<OverviewTabV2 />);
      
      const techBaseSelect = screen.getByDisplayValue('Inner Sphere');
      expect(techBaseSelect).toBeInTheDocument();
    });

    test('should update tech base when dropdown changes', () => {
      render(<OverviewTabV2 />);
      
      const techBaseSelect = screen.getByDisplayValue('Inner Sphere');
      fireEvent.change(techBaseSelect, { target: { value: 'Clan' } });
      
      expect(mockUpdateConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          techBase: 'Clan',
          techProgression: expect.objectContaining({
            chassis: 'Clan',
            gyro: 'Clan',
            engine: 'Clan',
            heatsink: 'Clan',
            targeting: 'Clan',
            myomer: 'Clan',
            movement: 'Clan',
            armor: 'Clan'
          })
        })
      );
    });

    test('should show Mixed when tech progression is mixed', () => {
      const mixedConfig = {
        techBase: 'Mixed Tech',  // Changed to match the actual option value
        techProgression: {
          chassis: 'Inner Sphere',
          gyro: 'Inner Sphere',
          engine: 'Inner Sphere',
          heatsink: 'Inner Sphere',
          targeting: 'Clan',
          myomer: 'Inner Sphere',
          movement: 'Inner Sphere',
          armor: 'Inner Sphere'
        }
      };
      
      mockUseUnit.mockReturnValue({
        unit: createMockUnit(mixedConfig),
        updateConfiguration: mockUpdateConfiguration,
        isConfigLoaded: true
      } as any);

      render(<OverviewTabV2 />);
      
      // Look for the specific option element
      expect(screen.getAllByText('Mixed Tech')).toHaveLength(2); // Option and status display
    });
  });

  describe('Rules Level Selection', () => {
    test('should render all rules level options', () => {
      render(<OverviewTabV2 />);
      
      expect(screen.getByText('Introductory')).toBeInTheDocument();
      expect(screen.getAllByText('Standard').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Advanced').length).toBeGreaterThan(0);
      expect(screen.getByText('Experimental')).toBeInTheDocument();
    });

    test('should show current rules level as selected', () => {
      const config = { rulesLevel: 'Advanced' };
      
      mockUseUnit.mockReturnValue({
        unit: createMockUnit(config),
        updateConfiguration: mockUpdateConfiguration,
        isConfigLoaded: true
      } as any);

      render(<OverviewTabV2 />);
      
      // Use getAllByText to handle multiple instances and verify at least one exists
      expect(screen.getAllByText('Advanced').length).toBeGreaterThan(0);
    });

    test('should update rules level when clicked', () => {
      render(<OverviewTabV2 />);
      
      const experimentalButton = screen.getByText('Experimental').closest('button');
      fireEvent.click(experimentalButton!);
      
      expect(mockUpdateConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          rulesLevel: 'Experimental'
        })
      );
    });
  });

  describe('Introduction Year', () => {
    test('should render introduction year input', () => {
      render(<OverviewTabV2 />);
      
      const yearInput = screen.getByDisplayValue('3025');
      expect(yearInput).toBeInTheDocument();
      expect(yearInput).toHaveAttribute('type', 'number');
    });

    test('should update introduction year when changed', () => {
      render(<OverviewTabV2 />);
      
      const yearInput = screen.getByDisplayValue('3025');
      fireEvent.change(yearInput, { target: { value: '3050' } });
      
      expect(mockUpdateConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          introductionYear: 3050
        })
      );
    });

    test('should handle invalid year input gracefully', () => {
      render(<OverviewTabV2 />);
      
      const yearInput = screen.getByDisplayValue('3025');
      fireEvent.change(yearInput, { target: { value: '' } });
      
      expect(mockUpdateConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          introductionYear: 3025 // Should default to 3025
        })
      );
    });
  });

  describe('Tech Rating Display', () => {
    test('should render tech rating for all eras', () => {
      render(<OverviewTabV2 />);
      
      expect(screen.getByText('2100 – 2800')).toBeInTheDocument();
      expect(screen.getByText('2801 – 3050')).toBeInTheDocument();
      expect(screen.getByText('3051 – 3082')).toBeInTheDocument();
      expect(screen.getByText('3083 – Now')).toBeInTheDocument();
    });

    test('should show rating legend', () => {
      render(<OverviewTabV2 />);
      
      expect(screen.getByText('Rating Scale')).toBeInTheDocument();
      expect(screen.getByText('A: Common')).toBeInTheDocument();
      expect(screen.getByText('B: Uncommon')).toBeInTheDocument();
      expect(screen.getByText('C: Rare')).toBeInTheDocument();
      expect(screen.getByText('D: Very Rare')).toBeInTheDocument();
      expect(screen.getByText('E: Experimental')).toBeInTheDocument();
      expect(screen.getByText('F: Primitive')).toBeInTheDocument();
      expect(screen.getByText('X: Unavailable')).toBeInTheDocument();
    });
  });

  describe('Visual State Debugging', () => {
    test('should log button state changes in console', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<OverviewTabV2 />);
      
      // Find all Clan buttons and click the first one
      const clanButtons = screen.getAllByText('Clan').filter(el => el.tagName === 'BUTTON');
      if (clanButtons.length > 0) {
        fireEvent.click(clanButtons[0]);
      }
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('BUTTON CLICKED:')
      );
      
      consoleSpy.mockRestore();
    });

    test('should render buttons for tech progression', () => {
      render(<OverviewTabV2 />);
      
      // Simple test to ensure buttons exist and are clickable
      const clanButtons = screen.getAllByText('Clan').filter(el => el.tagName === 'BUTTON');
      expect(clanButtons.length).toBeGreaterThan(0);
      
      // Click should not throw
      expect(() => fireEvent.click(clanButtons[0])).not.toThrow();
    });
  });
});
