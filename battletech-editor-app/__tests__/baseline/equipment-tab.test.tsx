import React from 'react';
import { render, fireEvent, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import EquipmentTab from '../../components/editor/tabs/EquipmentTab';
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
    {
      id: 'ac20-ammo',
      name: 'AC/20 Ammo',
      category: 'Ammo',
      weight: 1,
      crits: 1,
      damage: '',
      heat: 0,
      minRange: 0,
      range: '',
      shots: '5',
      base: 'IS',
      bv: 7,
      reference: 'TRO 3025',
      year: 2490,
      techBase: 'IS',
      isAmmo: true,
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
      { location: 'Head', slots: Array(6).fill('-Empty-') },
      { location: 'Center Torso', slots: Array(12).fill('-Empty-') },
      { location: 'Left Torso', slots: Array(12).fill('-Empty-') },
      { location: 'Right Torso', slots: Array(12).fill('-Empty-') },
      { location: 'Left Arm', slots: Array(12).fill('-Empty-') },
      { location: 'Right Arm', slots: Array(12).fill('-Empty-') },
      { location: 'Left Leg', slots: Array(6).fill('-Empty-') },
      { location: 'Right Leg', slots: Array(6).fill('-Empty-') },
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

describe('Equipment Tab - Baseline Behavior', () => {
  let mockUnit: EditableUnit;
  let onUnitChange: jest.Mock;

  beforeEach(() => {
    mockUnit = createMockUnit();
    onUnitChange = jest.fn();
  });

  test('renders equipment database and current loadout sections', () => {
    render(<EquipmentTab unit={mockUnit} onUnitChange={onUnitChange} />);
    
    expect(screen.getByText('Current Loadout')).toBeInTheDocument();
    expect(screen.getByText('Equipment Database')).toBeInTheDocument();
  });

  test('adding equipment creates unallocated entry with empty location', async () => {
    render(<EquipmentTab unit={mockUnit} onUnitChange={onUnitChange} />);
    
    // Find and click the add button for AC/20
    const addButtons = screen.getAllByTitle(/Add AC\/20/);
    fireEvent.click(addButtons[0]);
    
    // Verify onUnitChange was called with new equipment
    expect(onUnitChange).toHaveBeenCalledWith({
      ...mockUnit,
      data: expect.objectContaining({
        weapons_and_equipment: [
          {
            item_name: 'AC/20',
            item_type: 'weapon',
            location: '', // Empty location - unallocated
            tech_base: 'IS',
          },
        ],
      }),
    });
  });

  test('equipment starts with empty location when added', () => {
    render(<EquipmentTab unit={mockUnit} onUnitChange={onUnitChange} />);
    
    // Add Medium Laser
    const addButtons = screen.getAllByTitle(/Add Medium Laser/);
    fireEvent.click(addButtons[0]);
    
    const updateCall = onUnitChange.mock.calls[0][0];
    const addedEquipment = updateCall.data.weapons_and_equipment[0];
    
    expect(addedEquipment.location).toBe('');
    expect(addedEquipment.item_name).toBe('Medium Laser');
  });

  test('removing equipment updates weapons_and_equipment array', () => {
    // Start with equipment already loaded
    const unitWithEquipment = {
      ...mockUnit,
      data: {
        ...mockUnit.data,
        weapons_and_equipment: [
          { item_name: 'AC/20', item_type: 'weapon', location: '', tech_base: 'IS' as const },
          { item_name: 'Medium Laser', item_type: 'weapon', location: '', tech_base: 'IS' as const },
        ],
      },
    };
    
    render(<EquipmentTab unit={unitWithEquipment} onUnitChange={onUnitChange} />);
    
    // Click on the AC/20 in the current loadout (first occurrence)
    const currentLoadoutSection = screen.getByText('Current Loadout').parentElement?.parentElement;
    const ac20Elements = currentLoadoutSection?.querySelectorAll('span');
    let ac20ToClick;
    
    ac20Elements?.forEach(el => {
      if (el.textContent === 'AC/20' && el.className.includes('group-hover:text-red-400')) {
        ac20ToClick = el;
      }
    });
    
    if (!ac20ToClick) throw new Error('AC/20 not found in current loadout');
    
    fireEvent.click(ac20ToClick);
    
    // Verify equipment was removed
    expect(onUnitChange).toHaveBeenCalledWith({
      ...unitWithEquipment,
      data: expect.objectContaining({
        weapons_and_equipment: [
          { item_name: 'Medium Laser', item_type: 'weapon', location: '', tech_base: 'IS' },
        ],
      }),
    });
  });

  test('equipment tab does NOT directly update critical slots', () => {
    render(<EquipmentTab unit={mockUnit} onUnitChange={onUnitChange} />);
    
    // Add equipment
    const addButtons = screen.getAllByTitle(/Add AC\/20/);
    fireEvent.click(addButtons[0]);
    
    // Verify criticals were not modified
    const updateCall = onUnitChange.mock.calls[0][0];
    expect(updateCall.data.criticals).toEqual(mockUnit.data?.criticals);
  });

  test('equipment with location shows abbreviated location in list', () => {
    const unitWithAllocatedEquipment = {
      ...mockUnit,
      data: {
        ...mockUnit.data,
        weapons_and_equipment: [
          { item_name: 'AC/20', item_type: 'weapon', location: 'Right Torso', tech_base: 'IS' as const },
        ],
      },
    };
    
    render(<EquipmentTab unit={unitWithAllocatedEquipment} onUnitChange={onUnitChange} />);
    
    // Check for abbreviated location
    expect(screen.getByText('RT')).toBeInTheDocument();
  });

  test('unallocated equipment shows "-" for location', () => {
    const unitWithUnallocatedEquipment = {
      ...mockUnit,
      data: {
        ...mockUnit.data,
        weapons_and_equipment: [
          { item_name: 'Medium Laser', item_type: 'weapon', location: '', tech_base: 'IS' as const },
        ],
      },
    };
    
    render(<EquipmentTab unit={unitWithUnallocatedEquipment} onUnitChange={onUnitChange} />);
    
    // Check for dash indicating no location in the current loadout
    const currentLoadoutSection = screen.getByText('Current Loadout').parentElement?.parentElement;
    const locationCell = currentLoadoutSection?.querySelector('div[title="Unallocated"]');
    
    expect(locationCell?.textContent).toBe('-');
  });

  test('ammo can be added independently of weapons', () => {
    render(<EquipmentTab unit={mockUnit} onUnitChange={onUnitChange} />);
    
    // Add AC/20 Ammo without having AC/20
    const ammoAddButtons = screen.getAllByTitle(/Add AC\/20 Ammo/);
    fireEvent.click(ammoAddButtons[0]);
    
    expect(onUnitChange).toHaveBeenCalledWith({
      ...mockUnit,
      data: expect.objectContaining({
        weapons_and_equipment: [
          {
            item_name: 'AC/20 Ammo',
            item_type: 'ammo',
            location: '',
            tech_base: 'IS',
          },
        ],
      }),
    });
  });

  test('equipment filtering by category works', () => {
    render(<EquipmentTab unit={mockUnit} onUnitChange={onUnitChange} />);
    
    // Click on Energy category button (not the equipment type)
    const categoryButtons = screen.getByText('Show:').parentElement;
    const energyButton = categoryButtons?.querySelector('button:nth-child(2)'); // Energy is the second button after 'Show:'
    
    if (!energyButton) throw new Error('Energy button not found');
    
    fireEvent.click(energyButton);
    
    // Should see Medium Laser but not AC/20 in the equipment database
    const equipmentTable = screen.getByText('Equipment Database').parentElement?.parentElement;
    
    expect(within(equipmentTable!).getByText('Medium Laser')).toBeInTheDocument();
    expect(within(equipmentTable!).queryByText('AC/20')).not.toBeInTheDocument();
  });

  test('readOnly prop prevents equipment modifications', () => {
    render(<EquipmentTab unit={mockUnit} onUnitChange={onUnitChange} readOnly />);
    
    // Try to add equipment
    const addButtons = screen.getAllByTitle(/Add AC\/20/);
    fireEvent.click(addButtons[0]);
    
    // Verify onUnitChange was NOT called
    expect(onUnitChange).not.toHaveBeenCalled();
  });
});
