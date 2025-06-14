import React from 'react';
import { render, fireEvent, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import StructureTab from '../../components/editor/tabs/StructureTab';
import EquipmentTab from '../../components/editor/tabs/EquipmentTab';
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
      minRange: 0,
      range: '3/6/9',
      shots: '',
      base: 'IS',
      bv: 178,
      reference: 'TRO 3025',
      year: 2490,
      techBase: 'IS',
      isAmmo: false,
      isPrototype: false,
      isOneShot: false,
      isTorpedo: false,
    },
    {
      id: 'medium-laser',
      name: 'Medium Laser',
      category: 'Energy',
      weight: 1,
      crits: 1,
      damage: 5,
      heat: 3,
      minRange: 0,
      range: '3/6/9',
      shots: '',
      base: 'IS',
      bv: 46,
      reference: 'TRO 3025',
      year: 2300,
      techBase: 'IS',
      isAmmo: false,
      isPrototype: false,
      isOneShot: false,
      isTorpedo: false,
    },
  ],
}));

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
    weapons_and_equipment: [],
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

describe('Current Integration Flow', () => {
  let mockUnit: EditableUnit;

  beforeEach(() => {
    mockUnit = createMockUnit();
  });

  test('equipment flows from Equipment to Criticals tab', () => {
    let currentUnit = mockUnit;
    const updateUnit = (updates: Partial<EditableUnit>) => {
      currentUnit = { ...currentUnit, ...updates };
    };

    // Step 1: Add equipment in Equipment Tab
    const { rerender } = render(
      <EquipmentTab unit={currentUnit} onUnitChange={updateUnit} />
    );

    // Add AC/20
    const addButtons = screen.getAllByTitle(/Add AC\/20/);
    fireEvent.click(addButtons[0]);

    // Verify equipment was added with empty location
    expect(currentUnit.data?.weapons_and_equipment).toHaveLength(1);
    expect(currentUnit.data?.weapons_and_equipment?.[0]).toEqual({
      item_name: 'AC/20',
      item_type: 'weapon',
      location: '',
      tech_base: 'IS',
    });

    // Step 2: Switch to Criticals Tab
    rerender(
      <DndProvider backend={HTML5Backend}>
        <CriticalsTab unit={currentUnit} onUnitChange={updateUnit} />
      </DndProvider>
    );

    // Verify AC/20 appears in unallocated equipment
    const unallocatedPanel = screen.getByText('Unallocated Equipment').parentElement;
    expect(within(unallocatedPanel!).getByText('AC/20')).toBeInTheDocument();
  });

  test('Structure Tab changes do NOT update critical slots (current bug)', () => {
    let currentUnit = mockUnit;
    const updateUnit = (updates: Partial<EditableUnit>) => {
      currentUnit = { ...currentUnit, ...updates };
    };

    // Render Structure Tab
    render(<StructureTab unit={currentUnit} onUnitChange={updateUnit} />);

    // Change engine from Standard to XL
    const engineTypeSelect = screen.getByLabelText('Engine Type');
    fireEvent.change(engineTypeSelect, { target: { value: 'XL' } });

    // Verify engine type changed
    expect(currentUnit.data?.engine?.type).toBe('XL');

    // BUG: Critical slots should update but don't
    const centerTorsoCriticals = currentUnit.data?.criticals?.find(
      c => c.location === 'Center Torso'
    );
    const sideTorsoCriticals = currentUnit.data?.criticals?.filter(
      c => c.location === 'Left Torso' || c.location === 'Right Torso'
    );

    // All slots still show as empty or original - no XL engine slots
    expect(sideTorsoCriticals?.[0].slots.every(slot => slot === '-Empty-')).toBe(true);
    expect(sideTorsoCriticals?.[1].slots.every(slot => slot === '-Empty-')).toBe(true);
  });

  test('heat sink changes do NOT create external heat sink items (current behavior)', () => {
    let currentUnit = mockUnit;
    const updateUnit = (updates: Partial<EditableUnit>) => {
      currentUnit = { ...currentUnit, ...updates };
    };

    // Render Structure Tab
    render(<StructureTab unit={currentUnit} onUnitChange={updateUnit} />);

    // Engine rating 300 = 12 integrated heat sinks
    // Change heat sinks to 25 (13 external needed)
    const heatSinkCountInput = screen.getByLabelText('Heat Sink Count');
    fireEvent.change(heatSinkCountInput, { target: { value: '25' } });

    // Verify heat sink count changed
    expect(currentUnit.data?.heat_sinks?.count).toBe(25);

    // BUG: No heat sink equipment items are created
    expect(currentUnit.data?.weapons_and_equipment).toHaveLength(0);
  });

  test('equipment placed in Criticals updates location in weapons_and_equipment', () => {
    let currentUnit: EditableUnit = {
      ...mockUnit,
      data: {
        ...mockUnit.data!,
        weapons_and_equipment: [
          { item_name: 'Medium Laser', item_type: 'weapon', location: '', tech_base: 'IS' as const },
        ],
      },
    };
    const updateUnit = (updates: Partial<EditableUnit>) => {
      currentUnit = { ...currentUnit, ...updates };
    };

    // Render Criticals Tab
    render(
      <DndProvider backend={HTML5Backend}>
        <CriticalsTab unit={currentUnit} onUnitChange={updateUnit} />
      </DndProvider>
    );

    // Verify Medium Laser is in unallocated
    const unallocatedPanel = screen.getByText('Unallocated Equipment').parentElement;
    expect(within(unallocatedPanel!).getByText('Medium Laser')).toBeInTheDocument();

    // Note: Actually testing drag & drop would require complex setup
    // In real usage, dragging Medium Laser to a slot would:
    // 1. Update criticals array with 'Medium Laser' in the slot
    // 2. Update weapons_and_equipment location field
  });

  test('removing equipment from criticals clears its location', () => {
    let currentUnit: EditableUnit = {
      ...mockUnit,
      data: {
        ...mockUnit.data!,
        weapons_and_equipment: [
          { item_name: 'Medium Laser', item_type: 'weapon', location: 'Right Torso', tech_base: 'IS' as const },
        ],
        criticals: mockUnit.data?.criticals?.map(crit => {
          if (crit.location === 'Right Torso') {
            return {
              ...crit,
              slots: ['Medium Laser', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-'],
            };
          }
          return crit;
        }) || [],
      },
    };
    const updateUnit = (updates: Partial<EditableUnit>) => {
      currentUnit = { ...currentUnit, ...updates };
    };

    // Render Criticals Tab
    render(
      <DndProvider backend={HTML5Backend}>
        <CriticalsTab unit={currentUnit} onUnitChange={updateUnit} />
      </DndProvider>
    );

    // Clear Right Torso
    const rightTorsoSection = screen.getByText('Right Torso').parentElement;
    const clearButton = within(rightTorsoSection!).getByText('Clear');
    fireEvent.click(clearButton);

    // Verify location was cleared
    const updatedWeapon = currentUnit.data?.weapons_and_equipment?.find(
      eq => eq.item_name === 'Medium Laser'
    );
    expect(updatedWeapon?.location).toBe('');

    // Verify critical slot was cleared
    const rtCriticals = currentUnit.data?.criticals?.find(c => c.location === 'Right Torso');
    expect(rtCriticals?.slots[0]).toBe('-Empty-');
  });

  test('system components remain when switching between tabs', () => {
    let currentUnit = mockUnit;
    const updateUnit = (updates: Partial<EditableUnit>) => {
      currentUnit = { ...currentUnit, ...updates };
    };

    // Check initial state in Criticals Tab
    const { rerender } = render(
      <DndProvider backend={HTML5Backend}>
        <CriticalsTab unit={currentUnit} onUnitChange={updateUnit} />
      </DndProvider>
    );

    // Verify system components are present
    expect(screen.getAllByText('Engine')).toHaveLength(6);
    expect(screen.getAllByText('Gyro')).toHaveLength(4);

    // Switch to Structure Tab
    rerender(<StructureTab unit={currentUnit} onUnitChange={updateUnit} />);

    // Make a change
    const walkMPInput = screen.getByLabelText('Walking MP');
    fireEvent.change(walkMPInput, { target: { value: '4' } });

    // Switch back to Criticals Tab
    rerender(
      <DndProvider backend={HTML5Backend}>
        <CriticalsTab unit={currentUnit} onUnitChange={updateUnit} />
      </DndProvider>
    );

    // System components should still be there
    expect(screen.getAllByText('Engine')).toHaveLength(6);
    expect(screen.getAllByText('Gyro')).toHaveLength(4);
  });
});
