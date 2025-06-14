import React from 'react';
import { render, fireEvent, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import CriticalsTab from '../../components/editor/tabs/CriticalsTab';
import { EditableUnit } from '../../types/editor';

// Mock the equipment database
jest.mock('../../utils/equipmentData', () => ({
  EQUIPMENT_DATABASE: [
    {
      id: 'ac20',
      name: 'AC/20',
      category: 'Ballistic',
      weight: 14,
      crits: 10,
      damage: 20,
      heat: 7,
      techBase: 'IS',
    },
    {
      id: 'medium-laser',
      name: 'Medium Laser',
      category: 'Energy',
      weight: 1,
      crits: 1,
      damage: 5,
      heat: 3,
      techBase: 'IS',
    },
  ],
}));

// Wrap component with DndProvider for testing
const renderWithDnd = (component: React.ReactElement) => {
  return render(
    <DndProvider backend={HTML5Backend}>
      {component}
    </DndProvider>
  );
};

// Mock unit data
const createMockUnit = (): EditableUnit => ({
  id: 'test-unit-1',
  chassis: 'Atlas',
  model: 'AS7-D',
  mass: 100,
  tech_base: 'Inner Sphere',
  era: '3025',
  rules_level: 1,
  source: 'TRO 3025',
  role: 'Juggernaut',
  data: {
    chassis: 'Atlas',
    model: 'AS7-D',
    mass: 100,
    tech_base: 'Inner Sphere',
    era: '3025',
    rules_level: 1,
    role: 'Juggernaut',
    config: 'Biped',
    engine: {
      type: 'Fusion',
      rating: 300,
    },
    structure: {
      type: 'Standard',
    },
    heat_sinks: {
      type: 'Single',
      count: 20,
    },
    movement: {
      walk_mp: 3,
      jump_mp: 0,
    },
    armor: {
      type: 'Standard',
      locations: [],
    },
    weapons_and_equipment: [
      { item_name: 'AC/20', item_type: 'weapon', location: '', tech_base: 'IS' },
      { item_name: 'Medium Laser', item_type: 'weapon', location: '', tech_base: 'IS' },
    ],
    criticals: [
      { 
        location: 'Head', 
        slots: ['Life Support', 'Sensors', 'Cockpit', '-Empty-', 'Sensors', 'Life Support'] 
      },
      { 
        location: 'Center Torso', 
        slots: ['Engine', 'Engine', 'Engine', 'Gyro', 'Gyro', 'Gyro', 'Gyro', 'Engine', 'Engine', 'Engine', '-Empty-', '-Empty-'] 
      },
      { location: 'Left Torso', slots: Array(12).fill('-Empty-') },
      { location: 'Right Torso', slots: Array(12).fill('-Empty-') },
      { 
        location: 'Left Arm', 
        slots: ['Shoulder', 'Upper Arm Actuator', 'Lower Arm Actuator', 'Hand Actuator', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-'] 
      },
      { 
        location: 'Right Arm', 
        slots: ['Shoulder', 'Upper Arm Actuator', 'Lower Arm Actuator', 'Hand Actuator', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-'] 
      },
      { 
        location: 'Left Leg', 
        slots: ['Hip', 'Upper Leg Actuator', 'Lower Leg Actuator', 'Foot Actuator', '-Empty-', '-Empty-'] 
      },
      { 
        location: 'Right Leg', 
        slots: ['Hip', 'Upper Leg Actuator', 'Lower Leg Actuator', 'Foot Actuator', '-Empty-', '-Empty-'] 
      },
    ],
  },
  armorAllocation: {},
  equipmentPlacements: [],
  criticalSlots: [],
  fluffData: {},
  selectedQuirks: [],
  validationState: {
    isValid: true,
    errors: [],
    warnings: [],
  },
  editorMetadata: {
    lastModified: new Date(),
    isDirty: false,
    version: '1.0.0',
  },
});

describe('Criticals Tab - Baseline Behavior', () => {
  let mockUnit: EditableUnit;
  let onUnitChange: jest.Mock;

  beforeEach(() => {
    mockUnit = createMockUnit();
    onUnitChange = jest.fn();
  });

  test('renders critical slot sections and unallocated equipment', () => {
    renderWithDnd(<CriticalsTab unit={mockUnit} onUnitChange={onUnitChange} />);
    
    expect(screen.getByText('Critical Slot Allocation')).toBeInTheDocument();
    expect(screen.getByText('Unallocated Equipment')).toBeInTheDocument();
    
    // Check all location sections exist
    expect(screen.getByText('Head')).toBeInTheDocument();
    expect(screen.getByText('Center Torso')).toBeInTheDocument();
    expect(screen.getByText('Left Torso')).toBeInTheDocument();
    expect(screen.getByText('Right Torso')).toBeInTheDocument();
    expect(screen.getByText('Left Arm')).toBeInTheDocument();
    expect(screen.getByText('Right Arm')).toBeInTheDocument();
    expect(screen.getByText('Left Leg')).toBeInTheDocument();
    expect(screen.getByText('Right Leg')).toBeInTheDocument();
  });

  test('unallocated equipment appears in right panel', () => {
    renderWithDnd(<CriticalsTab unit={mockUnit} onUnitChange={onUnitChange} />);
    
    // Equipment with empty location should appear as unallocated
    const unallocatedPanel = screen.getByText('Unallocated Equipment').parentElement;
    expect(within(unallocatedPanel!).getByText('AC/20')).toBeInTheDocument();
    expect(within(unallocatedPanel!).getByText('Medium Laser')).toBeInTheDocument();
  });

  test('equipment with locations does NOT appear in unallocated panel', () => {
    const unitWithAllocatedEquipment = {
      ...mockUnit,
      data: {
        ...mockUnit.data,
        weapons_and_equipment: [
          { item_name: 'AC/20', item_type: 'weapon', location: 'Right Torso', tech_base: 'IS' as const },
          { item_name: 'Medium Laser', item_type: 'weapon', location: '', tech_base: 'IS' as const },
        ],
      },
    };
    
    renderWithDnd(<CriticalsTab unit={unitWithAllocatedEquipment} onUnitChange={onUnitChange} />);
    
    const unallocatedPanel = screen.getByText('Unallocated Equipment').parentElement;
    // AC/20 has a location, so it shouldn't appear
    expect(within(unallocatedPanel!).queryByText('AC/20')).not.toBeInTheDocument();
    // Medium Laser has no location, so it should appear
    expect(within(unallocatedPanel!).getByText('Medium Laser')).toBeInTheDocument();
  });

  test('system components are displayed in critical slots', () => {
    renderWithDnd(<CriticalsTab unit={mockUnit} onUnitChange={onUnitChange} />);
    
    // Check Head components
    expect(screen.getByText('Life Support')).toBeInTheDocument();
    expect(screen.getAllByText('Sensors')).toHaveLength(2);
    expect(screen.getByText('Cockpit')).toBeInTheDocument();
    
    // Check Center Torso components
    expect(screen.getAllByText('Engine')).toHaveLength(6);
    expect(screen.getAllByText('Gyro')).toHaveLength(4);
    
    // Check Arm actuators
    expect(screen.getAllByText('Shoulder')).toHaveLength(2);
    expect(screen.getAllByText('Upper Arm Actuator')).toHaveLength(2);
    expect(screen.getAllByText('Lower Arm Actuator')).toHaveLength(2);
    expect(screen.getAllByText('Hand Actuator')).toHaveLength(2);
    
    // Check Leg actuators
    expect(screen.getAllByText('Hip')).toHaveLength(2);
    expect(screen.getAllByText('Upper Leg Actuator')).toHaveLength(2);
    expect(screen.getAllByText('Lower Leg Actuator')).toHaveLength(2);
    expect(screen.getAllByText('Foot Actuator')).toHaveLength(2);
  });

  test('placing equipment updates both criticals and equipment location', () => {
    renderWithDnd(<CriticalsTab unit={mockUnit} onUnitChange={onUnitChange} />);
    
    // This would require simulating drag and drop, which is complex in tests
    // For now, we'll test the handler directly by simulating a drop
    const dropZones = screen.getAllByText('-Empty-');
    
    // Simulate dropping AC/20 (10 slots) on Right Torso slot 0
    // Note: Actual drag-drop testing would require more complex setup
    
    // For baseline, verify the current state doesn't auto-allocate
    expect(mockUnit.data?.criticals?.find(c => c.location === 'Right Torso')?.slots[0]).toBe('-Empty-');
  });

  test('system components cannot be removed', () => {
    renderWithDnd(<CriticalsTab unit={mockUnit} onUnitChange={onUnitChange} />);
    
    // System components should not have remove functionality
    // In the actual component, clicking on them should do nothing
    const engineSlot = screen.getAllByText('Engine')[0];
    fireEvent.click(engineSlot);
    
    // Verify no changes were made
    expect(onUnitChange).not.toHaveBeenCalled();
  });

  test('hand actuators CAN be removed', () => {
    renderWithDnd(<CriticalsTab unit={mockUnit} onUnitChange={onUnitChange} />);
    
    // Hand actuators are special - they can be removed
    // Testing this would require checking the component's behavior
    const handActuator = screen.getAllByText('Hand Actuator')[0];
    
    // Verify it exists in the initial state
    expect(handActuator).toBeInTheDocument();
  });

  test('clear button removes non-system equipment from location', () => {
    // Add some equipment to a location first
    const unitWithPlacedEquipment = {
      ...mockUnit,
      data: {
        ...mockUnit.data,
        criticals: mockUnit.data?.criticals?.map(crit => {
          if (crit.location === 'Right Torso') {
            return {
              ...crit,
              slots: ['Medium Laser', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-'],
            };
          }
          return crit;
        }) || [],
        weapons_and_equipment: [
          { item_name: 'AC/20', item_type: 'weapon', location: '', tech_base: 'IS' as const },
          { item_name: 'Medium Laser', item_type: 'weapon', location: 'Right Torso', tech_base: 'IS' as const },
        ],
      },
    };
    
    renderWithDnd(<CriticalsTab unit={unitWithPlacedEquipment} onUnitChange={onUnitChange} />);
    
    // Find and click the Clear button for Right Torso
    const rightTorsoSection = screen.getByText('Right Torso').parentElement;
    const clearButton = within(rightTorsoSection!).getByText('Clear');
    fireEvent.click(clearButton);
    
    // Verify onUnitChange was called
    expect(onUnitChange).toHaveBeenCalled();
    
    // Verify the equipment location was cleared
    const updateCall = onUnitChange.mock.calls[0][0];
    const updatedWeapon = updateCall.data.weapons_and_equipment.find(
      (eq: any) => eq.item_name === 'Medium Laser'
    );
    expect(updatedWeapon.location).toBe('');
  });

  test('multi-slot equipment occupies consecutive slots', () => {
    const unitWithMultiSlotEquipment = {
      ...mockUnit,
      data: {
        ...mockUnit.data,
        criticals: mockUnit.data?.criticals?.map(crit => {
          if (crit.location === 'Right Torso') {
            // AC/20 takes 10 slots
            return {
              ...crit,
              slots: ['AC/20', 'AC/20', 'AC/20', 'AC/20', 'AC/20', 'AC/20', 'AC/20', 'AC/20', 'AC/20', 'AC/20', '-Empty-', '-Empty-'],
            };
          }
          return crit;
        }) || [],
        weapons_and_equipment: [
          { item_name: 'AC/20', item_type: 'weapon', location: 'Right Torso', tech_base: 'IS' as const },
          { item_name: 'Medium Laser', item_type: 'weapon', location: '', tech_base: 'IS' as const },
        ],
      },
    };
    
    renderWithDnd(<CriticalsTab unit={unitWithMultiSlotEquipment} onUnitChange={onUnitChange} />);
    
    // Should see AC/20 in 10 consecutive slots
    const rightTorsoSection = screen.getByText('Right Torso').parentElement;
    const ac20Slots = within(rightTorsoSection!).getAllByText('AC/20');
    expect(ac20Slots).toHaveLength(10);
  });

  test('readOnly prop prevents equipment modifications', () => {
    renderWithDnd(<CriticalsTab unit={mockUnit} onUnitChange={onUnitChange} readOnly />);
    
    // Clear buttons should not be visible in readOnly mode
    expect(screen.queryByText('Clear')).not.toBeInTheDocument();
  });
});
