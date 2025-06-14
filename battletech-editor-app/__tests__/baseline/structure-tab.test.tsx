import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StructureTab from '../../components/editor/tabs/StructureTab';
import { EditableUnit } from '../../types/editor';

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
      type: 'Standard',
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

describe('Structure Tab - Baseline Behavior', () => {
  let mockUnit: EditableUnit;
  let onUnitChange: jest.Mock;

  beforeEach(() => {
    mockUnit = createMockUnit();
    onUnitChange = jest.fn();
  });

  test('renders all structure configuration sections', () => {
    render(<StructureTab unit={mockUnit} onUnitChange={onUnitChange} />);
    
    // Use getAllByText and check for at least one occurrence
    expect(screen.getAllByText('Basic Information').length).toBeGreaterThan(0);
    expect(screen.getByText('Engine Configuration')).toBeInTheDocument();
    expect(screen.getByText('Internal Structure')).toBeInTheDocument();
    expect(screen.getByText('Heat Sinks')).toBeInTheDocument();
    expect(screen.getByText('Movement Profile')).toBeInTheDocument();
  });

  test('changing engine type NOW updates data.engine AND critical slots (NEW BEHAVIOR)', () => {
    render(<StructureTab unit={mockUnit} onUnitChange={onUnitChange} />);
    
    // Find and change engine type dropdown by finding the select after the label
    const engineSection = screen.getByText('Engine Configuration').parentElement?.parentElement;
    const engineTypeSelect = engineSection?.querySelector('select');
    
    if (!engineTypeSelect) throw new Error('Engine type select not found');
    
    fireEvent.change(engineTypeSelect, { target: { value: 'XL' } });
    
    // Verify onUnitChange was called with new synchronization data
    expect(onUnitChange).toHaveBeenCalled();
    
    const updateCall = onUnitChange.mock.calls[0][0];
    
    // NEW BEHAVIOR: Check that systemComponents and criticalAllocations are updated
    expect(updateCall.systemComponents?.engine).toEqual({
      type: 'XL',
      rating: 300,
    });
    
    // NEW BEHAVIOR: Critical allocations should be present
    expect(updateCall.criticalAllocations).toBeDefined();
    
    // NEW BEHAVIOR: Critical slots ARE updated
    expect(updateCall.data?.criticals).toBeDefined();
    expect(updateCall.data?.criticals).not.toEqual(mockUnit.data?.criticals);
  });

  test('changing engine rating updates data.engine', () => {
    render(<StructureTab unit={mockUnit} onUnitChange={onUnitChange} />);
    
    // Find engine rating input
    const engineSection = screen.getByText('Engine Configuration').parentElement?.parentElement;
    const engineRatingInput = engineSection?.querySelector('input[type="number"]');
    
    if (!engineRatingInput) throw new Error('Engine rating input not found');
    
    fireEvent.change(engineRatingInput, { target: { value: '400' } });
    
    expect(onUnitChange).toHaveBeenCalled();
    
    const updateCall = onUnitChange.mock.calls[0][0];
    expect(updateCall.systemComponents?.engine?.rating).toBe(400);
    expect(updateCall.data?.engine?.rating).toBe(400);
  });

  test('changing heat sink type updates data.heat_sinks AND generates equipment', () => {
    render(<StructureTab unit={mockUnit} onUnitChange={onUnitChange} />);
    
    // Find heat sink section and select
    const heatSinkSection = screen.getByText('Heat Sinks').parentElement?.parentElement;
    const heatSinkTypeSelect = heatSinkSection?.querySelector('select');
    
    if (!heatSinkTypeSelect) throw new Error('Heat sink type select not found');
    
    fireEvent.change(heatSinkTypeSelect, { target: { value: 'Double' } });
    
    expect(onUnitChange).toHaveBeenCalled();
    
    const updateCall = onUnitChange.mock.calls[0][0];
    expect(updateCall.systemComponents?.heatSinks?.type).toBe('Double');
    expect(updateCall.data?.heat_sinks?.type).toBe('Double');
    
    // NEW BEHAVIOR: Equipment is generated for external heat sinks
    expect(updateCall.data?.weapons_and_equipment).toBeDefined();
  });

  test('changing heat sink count updates data.heat_sinks', () => {
    render(<StructureTab unit={mockUnit} onUnitChange={onUnitChange} />);
    
    // Find heat sink count input
    const heatSinkSection = screen.getByText('Heat Sinks').parentElement?.parentElement;
    const heatSinkCountInput = heatSinkSection?.querySelector('input[type="number"]');
    
    if (!heatSinkCountInput) throw new Error('Heat sink count input not found');
    
    fireEvent.change(heatSinkCountInput, { target: { value: '25' } });
    
    expect(onUnitChange).toHaveBeenCalled();
    
    const updateCall = onUnitChange.mock.calls[0][0];
    expect(updateCall.systemComponents?.heatSinks?.count).toBe(25);
    expect(updateCall.data?.heat_sinks?.count).toBe(25);
  });

  test('changing structure type updates data.structure AND critical slots', () => {
    render(<StructureTab unit={mockUnit} onUnitChange={onUnitChange} />);
    
    // Find structure section and select
    const structureSection = screen.getByText('Internal Structure').parentElement?.parentElement;
    const structureTypeSelect = structureSection?.querySelector('select');
    
    if (!structureTypeSelect) throw new Error('Structure type select not found');
    
    fireEvent.change(structureTypeSelect, { target: { value: 'Endo Steel' } });
    
    expect(onUnitChange).toHaveBeenCalled();
    
    const updateCall = onUnitChange.mock.calls[0][0];
    expect(updateCall.systemComponents?.structure?.type).toBe('Endo Steel');
    expect(updateCall.data?.structure?.type).toBe('Endo Steel');
    
    // NEW BEHAVIOR: Critical slots are updated for Endo Steel
    expect(updateCall.criticalAllocations).toBeDefined();
  });

  test('heat sinks NOW create equipment entries for external heat sinks (NEW BEHAVIOR)', () => {
    render(<StructureTab unit={mockUnit} onUnitChange={onUnitChange} />);
    
    // Change heat sink count to require external heat sinks
    const heatSinkSection = screen.getByText('Heat Sinks').parentElement?.parentElement;
    const heatSinkCountInput = heatSinkSection?.querySelector('input[type="number"]');
    
    if (!heatSinkCountInput) throw new Error('Heat sink count input not found');
    
    fireEvent.change(heatSinkCountInput, { target: { value: '30' } });
    
    // NEW BEHAVIOR: Equipment is added for external heat sinks
    const updateCall = onUnitChange.mock.calls[0][0];
    expect(updateCall.data.weapons_and_equipment).toBeDefined();
    expect(updateCall.data.weapons_and_equipment.length).toBeGreaterThan(0);
    
    // Check that heat sinks were added
    const heatSinks = updateCall.data.weapons_and_equipment.filter((item: any) => 
      item.item_name.includes('Heat Sink')
    );
    expect(heatSinks.length).toBeGreaterThan(0);
  });

  test('changing movement points updates data.movement', () => {
    render(<StructureTab unit={mockUnit} onUnitChange={onUnitChange} />);
    
    // Find movement section and walk MP input
    const movementSection = screen.getByText('Movement Profile').parentElement?.parentElement;
    const inputs = movementSection?.querySelectorAll('input[type="number"]');
    const walkMPInput = inputs?.[0]; // First input is Walking MP
    
    if (!walkMPInput) throw new Error('Walk MP input not found');
    
    fireEvent.change(walkMPInput, { target: { value: '4' } });
    
    expect(onUnitChange).toHaveBeenCalledWith({
      data: expect.objectContaining({
        movement: {
          walk_mp: 4,
          jump_mp: 0,
        },
      }),
    });
  });

  test('readOnly prop disables all inputs', () => {
    render(<StructureTab unit={mockUnit} onUnitChange={onUnitChange} readOnly />);
    
    // Find various inputs and check they are disabled
    const engineSection = screen.getByText('Engine Configuration').parentElement?.parentElement;
    const engineTypeSelect = engineSection?.querySelector('select') as HTMLSelectElement;
    const engineRatingInput = engineSection?.querySelector('input[type="number"]') as HTMLInputElement;
    
    const heatSinkSection = screen.getByText('Heat Sinks').parentElement?.parentElement;
    const heatSinkTypeSelect = heatSinkSection?.querySelector('select') as HTMLSelectElement;
    
    expect(engineTypeSelect.disabled).toBe(true);
    expect(engineRatingInput.disabled).toBe(true);
    expect(heatSinkTypeSelect.disabled).toBe(true);
  });

  test('validation errors are displayed when provided', () => {
    const validationErrors = [
      { id: '1', category: 'error' as const, message: 'Engine rating too high' },
      { id: '2', category: 'warning' as const, message: 'Heat sinks insufficient' },
    ];
    
    render(
      <StructureTab 
        unit={mockUnit} 
        onUnitChange={onUnitChange} 
        validationErrors={validationErrors}
      />
    );
    
    expect(screen.getByText('Engine rating too high')).toBeInTheDocument();
    expect(screen.getByText('Heat sinks insufficient')).toBeInTheDocument();
  });
});
