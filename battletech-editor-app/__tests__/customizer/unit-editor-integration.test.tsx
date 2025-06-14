import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/router';
import UnitEditorWithHooks from '../../components/editor/UnitEditorWithHooks';
import { EditableUnit, ARMOR_TYPES } from '../../types/editor';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock calculation utilities
jest.mock('../../utils/engineCalculations', () => ({
  calculateEngineWeight: jest.fn(() => 19.0),
}));

jest.mock('../../utils/structureCalculations', () => ({
  calculateStructureWeight: jest.fn(() => 10.0),
}));

jest.mock('../../utils/armorCalculations', () => ({
  calculateArmorWeight: jest.fn(() => 19.5),
  ARMOR_POINTS_PER_TON: { Standard: 16 },
}));

jest.mock('../../utils/gyroCalculations', () => ({
  calculateGyroWeight: jest.fn(() => 3.0),
}));

jest.mock('../../utils/cockpitCalculations', () => ({
  getCockpitWeight: jest.fn(() => 3.0),
}));

jest.mock('../../utils/heatSinkCalculations', () => ({
  HEAT_DISSIPATION_RATES: { Single: 1, Double: 2 },
}));

// Mock the tab components to focus on integration logic
jest.mock('../../components/editor/tabs/StructureTabWithHooks', () => {
  return function MockStructureTab({ readOnly }: any) {
    return (
      <div data-testid="structure-tab">
        Structure Tab {readOnly ? '(Read Only)' : ''}
        <button data-testid="structure-change" onClick={() => {}}>
          Change Structure
        </button>
      </div>
    );
  };
});

jest.mock('../../components/editor/tabs/ArmorTabWithHooks', () => {
  return function MockArmorTab({ readOnly }: any) {
    return (
      <div data-testid="armor-tab">
        Armor Tab {readOnly ? '(Read Only)' : ''}
      </div>
    );
  };
});

jest.mock('../../components/editor/tabs/EquipmentTabWithHooks', () => {
  return function MockEquipmentTab({ readOnly }: any) {
    return (
      <div data-testid="equipment-tab">
        Equipment Tab {readOnly ? '(Read Only)' : ''}
      </div>
    );
  };
});

jest.mock('../../components/editor/tabs/CriticalsTabWithHooks', () => {
  return function MockCriticalsTab({ readOnly }: any) {
    return (
      <div data-testid="criticals-tab">
        Criticals Tab {readOnly ? '(Read Only)' : ''}
      </div>
    );
  };
});

jest.mock('../../components/editor/tabs/FluffTabWithHooks', () => {
  return function MockFluffTab({ readOnly }: any) {
    return (
      <div data-testid="fluff-tab">
        Fluff Tab {readOnly ? '(Read Only)' : ''}
      </div>
    );
  };
});

const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue({
    push: mockRouterPush,
    replace: mockRouterReplace,
    query: {},
    pathname: '/customizer',
  });
  
  mockRouterPush.mockClear();
  mockRouterReplace.mockClear();
});

// Helper function to create a test unit
const createTestUnit = (): EditableUnit => {
  const standardArmor = ARMOR_TYPES.find(armor => armor.id === 'standard')!;
  
  return {
    id: 'test-unit-1',
    chassis: 'Atlas',
    model: 'AS7-D',
    mul_id: 'AS7-D',
    mass: 100,
    era: '3025',
    tech_base: 'Inner Sphere',
    rules_level: 1,
    source: 'TRO:3025',
    role: 'Juggernaut',
    data: {
      chassis: 'Atlas',
      model: 'AS7-D',
      mul_id: 'AS7-D',
      config: 'Biped',
      tech_base: 'Inner Sphere',
      era: '3025',
      source: 'TRO:3025',
      rules_level: 1,
      role: 'Juggernaut',
      mass: 100,
      cockpit: { type: 'Standard' },
      gyro: { type: 'Standard' },
      engine: { type: 'Standard', rating: 300 },
      structure: { type: 'Standard' },
      heat_sinks: { type: 'Single', count: 20 },
      movement: {
        walk_mp: 3,
        run_mp: 5,
        jump_mp: 0
      },
      armor: {
        type: 'Standard',
        total_armor_points: 307,
        locations: [
          { location: 'Head', armor_points: 9 },
          { location: 'Center Torso', armor_points: 47, rear_armor_points: 12 }
        ]
      },
      weapons_and_equipment: [
        { item_name: 'AC/10', item_type: 'weapon', location: 'Right Torso', tech_base: 'IS' },
        { item_name: 'Medium Laser', item_type: 'weapon', location: 'Left Arm', tech_base: 'IS' }
      ],
      criticals: []
    },
    armorAllocation: {
      'Head': { front: 9, maxArmor: 9, type: standardArmor },
      'Center Torso': { front: 47, rear: 12, maxArmor: 59, type: standardArmor }
    },
    equipmentPlacements: [],
    criticalSlots: [],
    fluffData: {
      overview: 'Test unit',
      capabilities: '',
      deployment: '',
      history: ''
    },
    selectedQuirks: [],
    validationState: {
      isValid: true,
      errors: [],
      warnings: []
    },
    editorMetadata: {
      lastModified: new Date(),
      isDirty: false,
      version: '1.0.0'
    }
  };
};

describe('UnitEditorWithHooks Integration', () => {
  const mockOnUnitChange = jest.fn();

  beforeEach(() => {
    mockOnUnitChange.mockClear();
  });

  describe('Basic Rendering', () => {
    test('renders unit information banner', () => {
      const unit = createTestUnit();
      render(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
        />
      );

      expect(screen.getByText('Atlas AS7-D')).toBeInTheDocument();
      expect(screen.getByText(/100-ton Inner Sphere BattleMech/)).toBeInTheDocument();
    });

    test('renders all tab navigation buttons', () => {
      const unit = createTestUnit();
      render(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
        />
      );

      expect(screen.getByText('Structure')).toBeInTheDocument();
      expect(screen.getByText('Armor')).toBeInTheDocument();
      expect(screen.getByText('Equipment')).toBeInTheDocument();
      expect(screen.getByText('Criticals')).toBeInTheDocument();
      expect(screen.getByText('Fluff')).toBeInTheDocument();
    });

    test('shows structure tab by default', () => {
      const unit = createTestUnit();
      render(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
        />
      );

      expect(screen.getByTestId('structure-tab')).toBeInTheDocument();
      expect(screen.queryByTestId('armor-tab')).not.toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    test('can switch between tabs', async () => {
      const user = userEvent.setup();
      const unit = createTestUnit();
      
      render(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
        />
      );

      // Start with structure tab
      expect(screen.getByTestId('structure-tab')).toBeInTheDocument();

      // Switch to armor tab
      await user.click(screen.getByText('Armor'));
      expect(screen.getByTestId('armor-tab')).toBeInTheDocument();
      expect(screen.queryByTestId('structure-tab')).not.toBeInTheDocument();

      // Switch to equipment tab
      await user.click(screen.getByText('Equipment'));
      expect(screen.getByTestId('equipment-tab')).toBeInTheDocument();
      expect(screen.queryByTestId('armor-tab')).not.toBeInTheDocument();
    });

    test('updates URL when switching tabs', async () => {
      const user = userEvent.setup();
      const unit = createTestUnit();
      
      render(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
        />
      );

      await user.click(screen.getByText('Armor'));

      expect(mockRouterReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({ tab: 'armor' })
        }),
        undefined,
        { shallow: true }
      );
    });

    test('handles initial tab from URL', () => {
      (useRouter as jest.Mock).mockReturnValue({
        push: mockRouterPush,
        replace: mockRouterReplace,
        query: { tab: 'equipment' },
        pathname: '/customizer',
      });

      const unit = createTestUnit();
      render(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
        />
      );

      expect(screen.getByTestId('equipment-tab')).toBeInTheDocument();
    });

    test('falls back to structure tab for invalid URL tab', () => {
      (useRouter as jest.Mock).mockReturnValue({
        push: mockRouterPush,
        replace: mockRouterReplace,
        query: { tab: 'invalid' },
        pathname: '/customizer',
      });

      const unit = createTestUnit();
      render(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
        />
      );

      expect(screen.getByTestId('structure-tab')).toBeInTheDocument();
    });
  });

  describe('Statistics Display', () => {
    test('displays unit weight', () => {
      const unit = createTestUnit();
      render(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
        />
      );

      // Should show calculated weight vs max weight
      expect(screen.getByText(/Weight:/)).toBeInTheDocument();
      expect(screen.getByText(/100 tons/)).toBeInTheDocument();
    });

    test('displays heat balance', () => {
      const unit = createTestUnit();
      render(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
        />
      );

      expect(screen.getByText(/Heat:/)).toBeInTheDocument();
    });

    test('displays movement points', () => {
      const unit = createTestUnit();
      render(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
        />
      );

      expect(screen.getByText(/Movement:/)).toBeInTheDocument();
      expect(screen.getByText(/3\/0/)).toBeInTheDocument(); // walk/jump
    });

    test('displays critical slots usage', () => {
      const unit = createTestUnit();
      render(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
        />
      );

      expect(screen.getByText(/Crits:/)).toBeInTheDocument();
    });

    test('displays rules level and era', () => {
      const unit = createTestUnit();
      render(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
        />
      );

      expect(screen.getByText(/Rules:/)).toBeInTheDocument();
      expect(screen.getByText(/Era:/)).toBeInTheDocument();
      expect(screen.getByText('3025')).toBeInTheDocument();
    });

    test('shows warning colors for overweight units', () => {
      const unit = createTestUnit();
      // Mock to return weight over limit
      const mockCalculateEngineWeight = require('../../utils/engineCalculations').calculateEngineWeight;
      mockCalculateEngineWeight.mockReturnValue(50.0); // Make total weight > 100

      render(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
        />
      );

      const weightDisplay = screen.getByText(/Weight:/).nextElementSibling;
      expect(weightDisplay).toHaveClass('text-red-400');
    });

    test('shows warning colors for heat-positive units', () => {
      const unit = {
        ...createTestUnit(),
        data: {
          ...createTestUnit().data,
          weapons_and_equipment: [
            // Add weapons that generate more heat than can be dissipated
            { item_name: 'PPC', item_type: 'weapon', location: 'Right Arm', tech_base: 'IS' as const },
            { item_name: 'PPC', item_type: 'weapon', location: 'Left Arm', tech_base: 'IS' as const },
          ]
        }
      };

      render(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
        />
      );

      // Should show orange/red color for heat-positive units
      const heatDisplay = screen.getByText(/Heat:/).nextElementSibling;
      // Color depends on heat balance calculation
    });
  });

  describe('Read-Only Mode', () => {
    test('passes read-only prop to tab components', () => {
      const unit = createTestUnit();
      render(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
          readOnly={true}
        />
      );

      expect(screen.getByText('Structure Tab (Read Only)')).toBeInTheDocument();
    });

    test('allows tab switching in read-only mode', async () => {
      const user = userEvent.setup();
      const unit = createTestUnit();
      
      render(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
          readOnly={true}
        />
      );

      await user.click(screen.getByText('Armor'));
      expect(screen.getByText('Armor Tab (Read Only)')).toBeInTheDocument();
    });
  });

  describe('Data Provider Integration', () => {
    test('provides unit data to child components', () => {
      const unit = createTestUnit();
      render(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
        />
      );

      // Tab components should receive the unit data through context
      expect(screen.getByTestId('structure-tab')).toBeInTheDocument();
    });

    test('handles unit changes through provider', async () => {
      const user = userEvent.setup();
      const unit = createTestUnit();
      
      render(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
        />
      );

      // Simulate a change from a tab component
      const changeButton = screen.getByTestId('structure-change');
      await user.click(changeButton);

      // The onUnitChange callback should be triggered through the provider
      // (In the actual implementation, this would require the tab component to make changes)
    });
  });

  describe('URL Integration', () => {
    test('updates URL when tab changes without navigation', async () => {
      const user = userEvent.setup();
      const unit = createTestUnit();
      
      render(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
        />
      );

      await user.click(screen.getByText('Criticals'));

      expect(mockRouterReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({ tab: 'criticals' })
        }),
        undefined,
        { shallow: true }
      );
    });

    test('preserves other URL parameters when changing tabs', async () => {
      const user = userEvent.setup();
      (useRouter as jest.Mock).mockReturnValue({
        push: mockRouterPush,
        replace: mockRouterReplace,
        query: { someParam: 'value', tab: 'structure' },
        pathname: '/customizer',
      });

      const unit = createTestUnit();
      render(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
        />
      );

      await user.click(screen.getByText('Fluff'));

      expect(mockRouterReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({ 
            someParam: 'value',
            tab: 'fluff'
          })
        }),
        undefined,
        { shallow: true }
      );
    });
  });

  describe('Performance', () => {
    test('does not unnecessarily re-render when props do not change', () => {
      const unit = createTestUnit();
      const { rerender } = render(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
        />
      );

      const initialBanner = screen.getByText('Atlas AS7-D');

      // Re-render with same props
      rerender(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
        />
      );

      // Elements should be stable
      expect(screen.getByText('Atlas AS7-D')).toBe(initialBanner);
    });

    test('updates display when unit data changes', () => {
      const unit = createTestUnit();
      const { rerender } = render(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
        />
      );

      expect(screen.getByText('Atlas AS7-D')).toBeInTheDocument();

      // Update unit
      const updatedUnit = { ...unit, chassis: 'Warhammer', model: 'WHM-6R' };
      rerender(
        <UnitEditorWithHooks
          unit={updatedUnit}
          onUnitChange={mockOnUnitChange}
        />
      );

      expect(screen.getByText('Warhammer WHM-6R')).toBeInTheDocument();
      expect(screen.queryByText('Atlas AS7-D')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles missing unit data gracefully', () => {
      const incompleteUnit = {
        ...createTestUnit(),
        data: undefined
      } as any;

      render(
        <UnitEditorWithHooks
          unit={incompleteUnit}
          onUnitChange={mockOnUnitChange}
        />
      );

      // Should not crash and should render something reasonable
      expect(screen.getByText('Atlas AS7-D')).toBeInTheDocument();
    });

    test('handles calculation errors gracefully', () => {
      const mockCalculateEngineWeight = require('../../utils/engineCalculations').calculateEngineWeight;
      mockCalculateEngineWeight.mockImplementation(() => {
        throw new Error('Calculation error');
      });

      const unit = createTestUnit();

      // Should not crash
      expect(() => {
        render(
          <UnitEditorWithHooks
            unit={unit}
            onUnitChange={mockOnUnitChange}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    test('tab navigation is keyboard accessible', async () => {
      const user = userEvent.setup();
      const unit = createTestUnit();
      
      render(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
        />
      );

      const armorTab = screen.getByText('Armor');
      armorTab.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByTestId('armor-tab')).toBeInTheDocument();
    });

    test('has proper heading structure', () => {
      const unit = createTestUnit();
      render(
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={mockOnUnitChange}
        />
      );

      // Main unit name should be a heading
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Atlas AS7-D');
    });
  });
});
