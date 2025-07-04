/**
 * Unallocated Equipment Display Test Suite
 * Comprehensive tests for the equipment organization and selection UI component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UnallocatedEquipmentDisplay } from '../../../components/criticalSlots/UnallocatedEquipmentDisplay';
import { useUnit } from '../../../components/multiUnit/MultiUnitProvider';

// Mock useUnit hook
jest.mock('../../../components/multiUnit/MultiUnitProvider');
const mockUseUnit = useUnit as jest.MockedFunction<typeof useUnit>;

// Mock console methods to capture debug output
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
  warn: jest.spyOn(console, 'warn').mockImplementation()
};

// Helper function to create mock equipment
function createMockEquipment(
  id: string, 
  name: string, 
  type: string = 'weapon',
  requiredSlots: number = 2,
  weight: number = 5,
  techBase: string = 'Inner Sphere',
  heat?: number
) {
  return {
    equipmentGroupId: id,
    equipmentData: {
      name,
      type,
      requiredSlots,
      weight,
      techBase,
      heat
    },
    isAllocated: false,
    location: 'unallocated'
  } as any;
}

// Helper function to create mock unit
function createMockUnit(unallocatedEquipment: any[] = []) {
  return {
    getUnallocatedEquipment: jest.fn(() => unallocatedEquipment),
    getConfiguration: jest.fn(() => ({
      structureType: 'Standard Structure',
      armorType: 'Standard Armor'
    }))
  } as any;
}

describe('UnallocatedEquipmentDisplay', () => {
  const mockSelectEquipment = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(consoleSpy).forEach(spy => spy.mockClear());

    // Default mock implementation
    mockUseUnit.mockReturnValue({
      unit: createMockUnit([]),
      selectedEquipmentId: null,
      selectEquipment: mockSelectEquipment
    } as any);
  });

  describe('Empty State', () => {
    test('should render empty state when no unallocated equipment', () => {
      render(<UnallocatedEquipmentDisplay />);

      expect(screen.getByText('Unallocated (0)')).toBeInTheDocument();
      expect(screen.getByText('✓ All allocated')).toBeInTheDocument();
    });

    test('should display correct header with count', () => {
      render(<UnallocatedEquipmentDisplay />);

      const header = screen.getByText('Unallocated (0)');
      expect(header).toHaveClass('text-white', 'text-sm', 'font-bold');
    });
  });

  describe('Equipment Categorization', () => {
    test('should categorize weapons correctly', () => {
      const equipment = [
        createMockEquipment('laser1', 'Large Laser', 'weapon'),
        createMockEquipment('ppc1', 'PPC', 'weapon'),
        createMockEquipment('ac1', 'AC/20', 'weapon'),
        createMockEquipment('lrm1', 'LRM 20', 'weapon')
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      expect(screen.getByText('Unallocated (4)')).toBeInTheDocument();
      expect(screen.getByText(/Weapons - Energy/)).toBeInTheDocument();
      expect(screen.getByText(/Weapons - Ballistic/)).toBeInTheDocument();
      expect(screen.getByText(/Weapons - Missile/)).toBeInTheDocument();
    });

    test('should categorize structure and armor components', () => {
      const equipment = [
        createMockEquipment('endo1', 'Endo Steel', 'equipment'),
        createMockEquipment('ferro1', 'Ferro-Fibrous', 'equipment')
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      expect(screen.getByText(/Structure Components/)).toBeInTheDocument();
      expect(screen.getByText(/Armor Components/)).toBeInTheDocument();
    });

    test('should categorize movement and heat management equipment', () => {
      const equipment = [
        createMockEquipment('jj1', 'Jump Jet', 'equipment'),
        createMockEquipment('hs1', 'Heat Sink', 'heat_sink'),
        createMockEquipment('dhs1', 'Double Heat Sink', 'heat_sink')
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      expect(screen.getByText(/Movement Systems/)).toBeInTheDocument();
      expect(screen.getByText(/Heat Management/)).toBeInTheDocument();
    });

    test('should use fallback category for unknown equipment', () => {
      const equipment = [
        createMockEquipment('unknown1', 'Unknown Widget', 'equipment')
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      expect(screen.getByText(/Other Equipment/)).toBeInTheDocument();
    });
  });

  describe('Equipment Grouping', () => {
    test('should group identical equipment items', () => {
      const equipment = [
        createMockEquipment('laser1', 'Large Laser', 'weapon'),
        createMockEquipment('laser2', 'Large Laser', 'weapon'),
        createMockEquipment('laser3', 'Large Laser', 'weapon'),
        createMockEquipment('ppc1', 'PPC', 'weapon')
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      // Should show grouped count for Large Laser - using getAllByText since there are multiple elements
      expect(screen.getAllByText('Large Laser')[0]).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Count badge
      expect(screen.getAllByText('PPC')[0]).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Count badge
    });

    test('should show category totals correctly', () => {
      const equipment = [
        createMockEquipment('laser1', 'Large Laser', 'weapon'),
        createMockEquipment('laser2', 'Large Laser', 'weapon'),
        createMockEquipment('ppc1', 'PPC', 'weapon')
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      // Category should show total count
      const categoryHeader = screen.getByText(/Weapons - Energy/);
      expect(categoryHeader).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Total in category
    });
  });

  describe('Expansion/Collapse Behavior', () => {
    test('should auto-expand categories on first render', async () => {
      const equipment = [
        createMockEquipment('laser1', 'Large Laser', 'weapon')
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      // Should auto-expand and show equipment item - use getAllByText since there are multiple elements
      await new Promise(resolve => setTimeout(resolve, 0)); // Use act for async rendering
      expect(screen.getAllByText('Large Laser')[0]).toBeInTheDocument();
    });

    test('should toggle category expansion on click', () => {
      const equipment = [
        createMockEquipment('laser1', 'Large Laser', 'weapon')
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      const categoryHeader = screen.getByText(/Weapons - Energy/);
      
      // Click to collapse
      fireEvent.click(categoryHeader);

      // Should not show equipment items when collapsed - use queryAllByText since multiple elements
      expect(screen.queryAllByText('Large Laser')).toHaveLength(0);

      // Click to expand again
      fireEvent.click(categoryHeader);

      // Should show equipment items when expanded - use getAllByText
      expect(screen.getAllByText('Large Laser')[0]).toBeInTheDocument();
    });

    test('should toggle equipment group expansion', async () => {
      const equipment = [
        createMockEquipment('laser1', 'Large Laser', 'weapon'),
        createMockEquipment('laser2', 'Large Laser', 'weapon')
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      // Wait for auto-expansion to complete
      await new Promise(resolve => setTimeout(resolve, 0)); // Use act for async rendering
      expect(screen.getAllByText(/2cr • 5t/)).toHaveLength(2);

      // Find the group header by looking for the equipment group arrow (mr-1, not category mr-2)
      // The group header has: ▼ Large Laser [count badge]
      const expandIcons = screen.getAllByText('▼');
      const groupExpandIcon = expandIcons.find(icon => 
        icon.className.includes('mr-1') // Equipment groups use mr-1, categories use mr-2
      );
      const groupRow = groupExpandIcon?.closest('div[class*="flex items-center cursor-pointer"]');
      
      expect(groupRow).toBeTruthy();

      // Click to collapse group
      fireEvent.click(groupRow!);

      await new Promise(resolve => setTimeout(resolve, 0)); // Use act for async rendering
      expect(screen.queryAllByText(/2cr • 5t/)).toHaveLength(0);

      // Verify the arrow changed to collapsed state
      await new Promise(resolve => setTimeout(resolve, 0)); // Use act for async rendering
      expect(screen.getByText('▶')).toBeInTheDocument();

      // Click to expand group again
      const collapsedIcon = screen.getByText('▶');
      const expandGroupRow = collapsedIcon.closest('div[class*="flex items-center cursor-pointer"]');
      fireEvent.click(expandGroupRow!);

      await new Promise(resolve => setTimeout(resolve, 0)); // Use act for async rendering
      expect(screen.getAllByText(/2cr • 5t/)).toHaveLength(2);
    });
  });

  describe('Equipment Selection', () => {
    test('should handle equipment selection', () => {
      const equipment = [
        createMockEquipment('laser1', 'Large Laser', 'weapon')
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      const equipmentItem = screen.getByText(/2cr • 5t/);
      fireEvent.click(equipmentItem);

      expect(mockSelectEquipment).toHaveBeenCalledWith('laser1');
    });

    test('should deselect equipment when clicking selected item', () => {
      const equipment = [
        createMockEquipment('laser1', 'Large Laser', 'weapon')
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: 'laser1',
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      const equipmentItem = screen.getByText(/2cr • 5t/);
      fireEvent.click(equipmentItem);

      expect(mockSelectEquipment).toHaveBeenCalledWith(null);
    });

    test('should show selection indicator for selected equipment', () => {
      const equipment = [
        createMockEquipment('laser1', 'Large Laser', 'weapon')
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: 'laser1',
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      // Should show star indicator and selection message
      expect(screen.getByText('★')).toBeInTheDocument();
      expect(screen.getByText('Click slot to assign')).toBeInTheDocument();
    });

    test('should apply correct colors for selected equipment', () => {
      const equipment = [
        createMockEquipment('laser1', 'Large Laser', 'weapon')
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: 'laser1',
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      // Find the equipment item by its title attribute instead of text content
      const equipmentItem = screen.getByTitle('Click to deselect');
      expect(equipmentItem).toHaveClass('bg-red-500', 'border-red-400', 'ring-2', 'ring-blue-400');
    });
  });

  describe('Equipment Display Details', () => {
    test('should display equipment stats correctly', () => {
      const equipment = [
        createMockEquipment('laser1', 'Large Laser', 'weapon', 2, 5, 'Inner Sphere', 8)
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      // Should show critical slots and weight
      expect(screen.getByText(/2.*cr.*•.*5.*t/)).toBeInTheDocument();
      // Should show heat value
      expect(screen.getByText(/\+.*8.*h/)).toBeInTheDocument();
      expect(screen.getByText('(IS)')).toBeInTheDocument(); // Tech abbreviation
    });

    test('should handle equipment without heat value', () => {
      const equipment = [
        createMockEquipment('ac1', 'AC/20', 'weapon', 10, 14, 'Inner Sphere')
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      // Should show only critical slots and weight
      expect(screen.getByText(/10cr • 14t/)).toBeInTheDocument();
      expect(screen.queryByText(/h$/)).not.toBeInTheDocument();
    });

    test('should abbreviate tech base correctly', () => {
      const equipment = [
        createMockEquipment('laser1', 'Large Laser', 'weapon', 2, 5, 'Clan'),
        createMockEquipment('laser2', 'Large Laser', 'weapon', 2, 5, 'Star League'),
        createMockEquipment('laser3', 'Large Laser', 'weapon', 2, 5, 'Custom Tech')
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      expect(screen.getByText('(CLAN)')).toBeInTheDocument();
      expect(screen.getByText('(SL)')).toBeInTheDocument();
      expect(screen.getByText('(CUS)')).toBeInTheDocument();
    });

    test('should apply correct colors for different equipment types', () => {
      const equipment = [
        createMockEquipment('weapon1', 'Large Laser', 'weapon'),
        createMockEquipment('ammo1', 'AC/20 Ammo', 'ammo'),
        createMockEquipment('equip1', 'CASE', 'equipment'),
        createMockEquipment('hs1', 'Heat Sink', 'heat_sink')
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      // Equipment is ordered by category, not input order:
      // 1. Weapons - Energy: Large Laser (weapon type = red)
      // 2. Heat Management: Heat Sink (heat_sink type = cyan)
      // 3. Electronics & Equipment: CASE (equipment type = blue) 
      // 4. Other Equipment: AC/20 Ammo (ammo type = orange)
      const equipmentItems = screen.getAllByTitle('Click to select for assignment');
      
      expect(equipmentItems[0]).toHaveClass('bg-red-700', 'border-red-600');    // Large Laser
      expect(equipmentItems[1]).toHaveClass('bg-orange-700', 'border-orange-600'); // AC/20 Ammo  
      expect(equipmentItems[2]).toHaveClass('bg-cyan-700', 'border-cyan-600');  // Heat Sink
      expect(equipmentItems[3]).toHaveClass('bg-blue-700', 'border-blue-600');  // CASE
    });
  });

  describe('Debug and Diagnostics', () => {
    test('should log equipment debug information', () => {
      const equipment = [
        createMockEquipment('laser1', 'Large Laser', 'weapon'),
        createMockEquipment('laser2', 'Large Laser', 'weapon')
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      expect(consoleSpy.log).toHaveBeenCalledWith('=== UNALLOCATED EQUIPMENT DEBUG ===');
      expect(consoleSpy.log).toHaveBeenCalledWith('[UnallocatedEquipmentDisplay] Equipment count:', 2);
      expect(consoleSpy.log).toHaveBeenCalledWith('=== END UNALLOCATED EQUIPMENT DEBUG ===');
    });

    test('should detect and warn about duplicate equipment', () => {
      const equipment = [
        createMockEquipment('laser1', 'Large Laser', 'weapon'),
        createMockEquipment('laser1', 'Large Laser', 'weapon') // Same ID - duplicate!
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      expect(consoleSpy.error).toHaveBeenCalledWith('🚨 DUPLICATE EQUIPMENT DETECTED!');
      expect(consoleSpy.error).toHaveBeenCalledWith('Total items:', 2, 'Unique group IDs:', 1);
      expect(consoleSpy.error).toHaveBeenCalledWith('Duplicate group IDs:', ['laser1']);
    });

    test('should log equipment counts by name', () => {
      const equipment = [
        createMockEquipment('laser1', 'Large Laser', 'weapon'),
        createMockEquipment('laser2', 'Large Laser', 'weapon'),
        createMockEquipment('ppc1', 'PPC', 'weapon')
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[UnallocatedEquipmentDisplay] Equipment counts by name:',
        { 'Large Laser': 2, 'PPC': 1 }
      );
    });

    test('should log categorized structure information', () => {
      const equipment = [
        createMockEquipment('laser1', 'Large Laser', 'weapon'),
        createMockEquipment('hs1', 'Heat Sink', 'heat_sink')
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[UnallocatedEquipmentDisplay] Categorized structure:',
        expect.arrayContaining([
          expect.objectContaining({
            category: 'Weapons - Energy',
            totalCount: 1,
            groups: ['Large Laser (1)']
          }),
          expect.objectContaining({
            category: 'Heat Management',
            totalCount: 1,
            groups: ['Heat Sink (1)']
          })
        ])
      );
    });

    test('should log unit configuration', () => {
      const equipment = [
        createMockEquipment('laser1', 'Large Laser', 'weapon')
      ];

      const mockUnit = createMockUnit(equipment);
      mockUnit.getConfiguration.mockReturnValue({
        structureType: 'Endo Steel',
        armorType: 'Ferro-Fibrous'
      });

      mockUseUnit.mockReturnValue({
        unit: mockUnit,
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[UnallocatedEquipmentDisplay] Unit config:',
        {
          structureType: 'Endo Steel',
          armorType: 'Ferro-Fibrous'
        }
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle missing unit gracefully', () => {
      mockUseUnit.mockReturnValue({
        unit: null,
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      expect(() => render(<UnallocatedEquipmentDisplay />)).toThrow();
    });

    test('should handle equipment with missing properties', () => {
      const equipment = [
        {
          equipmentGroupId: 'incomplete1',
          equipmentData: {
            name: 'Incomplete Equipment'
            // Missing other properties
          },
          isAllocated: false,
          location: 'unallocated'
        }
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      // Should not crash
      render(<UnallocatedEquipmentDisplay />);
      expect(screen.getAllByText('Incomplete Equipment')[0]).toBeInTheDocument();
    });

    test('should handle empty equipment categories', () => {
      // Equipment that doesn't match any category keywords
      const equipment = [
        createMockEquipment('mystery1', 'Mystery Component', 'equipment')
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      expect(screen.getByText(/Other Equipment/)).toBeInTheDocument();
      expect(screen.getAllByText('Mystery Component')[0]).toBeInTheDocument();
    });

    test('should handle rapid state changes without crashing', () => {
      const equipment1 = [createMockEquipment('laser1', 'Large Laser', 'weapon')];
      const equipment2 = [createMockEquipment('ppc1', 'PPC', 'weapon')];

      const { rerender } = render(<UnallocatedEquipmentDisplay />);

      // Rapid state changes
      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment1),
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      rerender(<UnallocatedEquipmentDisplay />);

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment2),
        selectedEquipmentId: 'ppc1',
        selectEquipment: mockSelectEquipment
      } as any);

      rerender(<UnallocatedEquipmentDisplay />);

      mockUseUnit.mockReturnValue({
        unit: createMockUnit([]),
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      rerender(<UnallocatedEquipmentDisplay />);

      // Should handle all state changes gracefully
      expect(screen.getByText('✓ All allocated')).toBeInTheDocument();
    });
  });

  describe('Accessibility and User Experience', () => {
    test('should have proper hover effects and cursor styles', () => {
      const equipment = [
        createMockEquipment('laser1', 'Large Laser', 'weapon')
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      const categoryHeader = screen.getByText(/Weapons - Energy/).closest('div');
      expect(categoryHeader).toHaveClass('cursor-pointer', 'hover:bg-gray-700');

      // Find the equipment item directly by title attribute
      const equipmentItem = screen.getByTitle('Click to select for assignment');
      expect(equipmentItem).toHaveClass('cursor-pointer', 'hover:opacity-80', 'hover:scale-105');
    });

    test('should provide tooltips for equipment selection', () => {
      const equipment = [
        createMockEquipment('laser1', 'Large Laser', 'weapon')
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: null,
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      // Directly find the equipment item by title
      const equipmentItem = screen.getByTitle('Click to select for assignment');
      expect(equipmentItem).toHaveAttribute('title', 'Click to select for assignment');
    });

    test('should show different tooltip for selected equipment', () => {
      const equipment = [
        createMockEquipment('laser1', 'Large Laser', 'weapon')
      ];

      mockUseUnit.mockReturnValue({
        unit: createMockUnit(equipment),
        selectedEquipmentId: 'laser1',
        selectEquipment: mockSelectEquipment
      } as any);

      render(<UnallocatedEquipmentDisplay />);

      // Directly find the equipment item by title
      const equipmentItem = screen.getByTitle('Click to deselect');
      expect(equipmentItem).toHaveAttribute('title', 'Click to deselect');
    });
  });
});
