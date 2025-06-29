/**
 * Test for the enhanced armor efficiency warning system
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ArmorStatisticsPanel from '../../../components/editor/armor/ArmorStatisticsPanel';
import { EditableUnit, ARMOR_TYPES } from '../../../types/editor';

// Mock unit with wasted armor for testing
const createMockUnit = (overrides: any = {}): EditableUnit => ({
  id: 'test-unit',
  chassis: 'Test Mech',
  model: 'TST-1',
  mass: 50,
  data: {
    chassis: 'Test Mech',
    model: 'TST-1',
    mass: 50,
    armor: {
      locations: []
    }
  },
  era: 'Succession Wars',
  tech_base: 'Inner Sphere',
  armorAllocation: {
    Head: {
      front: 9,
      rear: 0,
      maxArmor: 9,
      type: ARMOR_TYPES[0]
    },
    'Center Torso': {
      front: 30,
      rear: 10,
      maxArmor: 40,
      type: ARMOR_TYPES[0]
    },
    'Left Torso': {
      front: 20,
      rear: 8,
      maxArmor: 28,
      type: ARMOR_TYPES[0]
    },
    'Right Torso': {
      front: 20,
      rear: 8,
      maxArmor: 28,
      type: ARMOR_TYPES[0]
    },
    'Left Arm': {
      front: 16,
      rear: 0,
      maxArmor: 16,
      type: ARMOR_TYPES[0]
    },
    'Right Arm': {
      front: 16,
      rear: 0,
      maxArmor: 16,
      type: ARMOR_TYPES[0]
    },
    'Left Leg': {
      front: 20,
      rear: 0,
      maxArmor: 20,
      type: ARMOR_TYPES[0]
    },
    'Right Leg': {
      front: 20,
      rear: 0,
      maxArmor: 20,
      type: ARMOR_TYPES[0]
    }
  },
  equipmentPlacements: [],
  criticalSlots: [],
  fluffData: {},
  selectedQuirks: [],
  validationState: { isValid: true, errors: [], warnings: [] },
  editorMetadata: {
    lastModified: new Date(),
    isDirty: false,
    version: '1.0.0'
  },
  ...overrides
});

describe('Armor Efficiency Warning System', () => {
  it('should show efficiency warning when armor is wasted', () => {
    // Create a unit with excessive armor tonnage that will cause waste
    const mockUnit = createMockUnit();
    const excessiveArmorTonnage = 12.0; // This should cause waste due to smart caps
    
    render(
      <ArmorStatisticsPanel
        unit={mockUnit}
        totalArmorTonnage={excessiveArmorTonnage}
        readOnly={false}
      />
    );
    
    // Check for efficiency warning section
    expect(screen.getByText('Armor Efficiency Notice')).toBeInTheDocument();
  });

  it('should show trapped points warning when locations are at maximum', () => {
    // Create a unit where all locations are at maximum armor
    const mockUnit = createMockUnit();
    const highArmorTonnage = 15.0; // High tonnage to trigger trapped points
    
    render(
      <ArmorStatisticsPanel
        unit={mockUnit}
        totalArmorTonnage={highArmorTonnage}
        readOnly={false}
      />
    );
    
    // Should show trapped points message
    expect(screen.getByText(/trapped/)).toBeInTheDocument();
  });

  it('should show optimization suggestion with tonnage savings', () => {
    const mockUnit = createMockUnit();
    const excessiveArmorTonnage = 12.0;
    
    render(
      <ArmorStatisticsPanel
        unit={mockUnit}
        totalArmorTonnage={excessiveArmorTonnage}
        readOnly={false}
      />
    );
    
    // Should show optimization suggestion
    expect(screen.getByText('Optimization Suggestion')).toBeInTheDocument();
    expect(screen.getByText(/save/)).toBeInTheDocument();
  });

  it('should show BattleTech rules explanation when relevant', () => {
    const mockUnit = createMockUnit();
    const excessiveArmorTonnage = 15.0;
    
    render(
      <ArmorStatisticsPanel
        unit={mockUnit}
        totalArmorTonnage={excessiveArmorTonnage}
        readOnly={false}
      />
    );
    
    // Should show BattleTech rule explanation
    expect(screen.getByText(/📖 BattleTech Rule:/)).toBeInTheDocument();
    expect(screen.getByText(/maximum armor limit/)).toBeInTheDocument();
  });

  it('should not show warnings when armor is efficiently allocated', () => {
    const mockUnit = createMockUnit();
    const efficientArmorTonnage = 9.5; // Just enough for current allocation
    
    render(
      <ArmorStatisticsPanel
        unit={mockUnit}
        totalArmorTonnage={efficientArmorTonnage}
        readOnly={false}
      />
    );
    
    // Should not show efficiency warning section
    expect(screen.queryByText('Armor Efficiency Notice')).not.toBeInTheDocument();
  });

  it('should show optimize button in edit mode but not in read-only', () => {
    const mockUnit = createMockUnit();
    const excessiveArmorTonnage = 12.0;
    const mockOptimizeCallback = jest.fn();
    
    // Render in edit mode
    const { rerender } = render(
      <ArmorStatisticsPanel
        unit={mockUnit}
        totalArmorTonnage={excessiveArmorTonnage}
        onOptimizeArmor={mockOptimizeCallback}
        readOnly={false}
      />
    );
    
    // Should show optimize button
    expect(screen.getByText('Optimize Automatically')).toBeInTheDocument();
    
    // Rerender in read-only mode
    rerender(
      <ArmorStatisticsPanel
        unit={mockUnit}
        totalArmorTonnage={excessiveArmorTonnage}
        readOnly={true}
      />
    );
    
    // Should not show optimize button
    expect(screen.queryByText('Optimize Automatically')).not.toBeInTheDocument();
  });
});
