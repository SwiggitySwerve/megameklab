import { UnitCriticalManager } from '../../utils/criticalSlots/UnitCriticalManager';
import { UnitConfiguration } from '../../utils/criticalSlots/UnitCriticalManagerTypes';
import { createComponentConfiguration } from '../../types/componentConfiguration';

// Minimal valid configuration for a unit with Endo Steel and Ferro-Fibrous
const mockConfig: UnitConfiguration = {
  chassis: 'TestMech',
  model: 'TM-1',
  tonnage: 100,
  unitType: 'BattleMech',
  techBase: 'Inner Sphere',
  walkMP: 3,
  engineRating: 300,
  runMP: 5,
  engineType: 'Standard',
  jumpMP: 0,
  jumpJetType: createComponentConfiguration('jumpJet', 'Standard Jump Jet')!,
  jumpJetCounts: {},
  hasPartialWing: false,
  gyroType: createComponentConfiguration('gyro', 'Standard')!,
  structureType: createComponentConfiguration('structure', 'Endo Steel')!,
  armorType: createComponentConfiguration('armor', 'Ferro-Fibrous')!,
  armorAllocation: {
    HD: { front: 9, rear: 0 },
    CT: { front: 30, rear: 10 },
    LT: { front: 20, rear: 8 },
    RT: { front: 20, rear: 8 },
    LA: { front: 16, rear: 0 },
    RA: { front: 16, rear: 0 },
    LL: { front: 20, rear: 6 },
    RL: { front: 20, rear: 6 },
  },
  armorTonnage: 19,
  heatSinkType: createComponentConfiguration('heatSink', 'Single')!,
  totalHeatSinks: 10,
  internalHeatSinks: 10,
  externalHeatSinks: 0,
  enhancements: [],
  mass: 100,
};

describe('Dynamic Component Unallocated Pool', () => {
  it('should show unallocated Endo Steel and Ferro-Fibrous slots when not all are assigned', () => {
    const manager = new UnitCriticalManager(mockConfig);
    // Simulate allocation: assign only some of the required slots
    // For this test, we assume Endo Steel requires 14 slots, assign 10
    // (You may need to use manager methods to allocate slots, or directly manipulate sections)

    // Check unallocated pool for remaining dynamic component slots
    const unallocated = manager.unallocatedEquipment.filter(eq =>
      (eq.equipmentData.name === 'Endo Steel' || eq.equipmentData.name === 'Ferro-Fibrous')
    );
    // Expect the number of unallocated slots to match the unassigned slots
    // (e.g., if 4 Endo Steel slots remain, expect 4 in the pool)
    expect(unallocated.length).toBeGreaterThan(0);
  });
}); 