/**
 * Test Equipment Displacement Fix
 * Tests that equipment is properly displaced to unallocated pool when engine changes to XL
 */

import { UnitCriticalManager } from '../../utils/criticalSlots/UnitCriticalManager';
import { EquipmentObject } from '../../utils/criticalSlots/CriticalSlot';

describe('Equipment Displacement Fix', () => {
  function createTestUnit() {
    const config = {
      engineType: 'Standard' as const,
      gyroType: 'Standard' as const,
      mass: 50,
      unitType: 'BattleMech' as const
    };
    
    return new UnitCriticalManager(config);
  }

  function addTestEquipment(unit: UnitCriticalManager) {
    const testEquipment: EquipmentObject[] = [
      {
        id: 'test_weapon_1',
        name: 'AC/10',
        type: 'weapon',
        requiredSlots: 7,
        weight: 12,
        techBase: 'Inner Sphere'
      },
      {
        id: 'test_weapon_2',
        name: 'Medium Laser',
        type: 'weapon',
        requiredSlots: 1,
        weight: 1,
        techBase: 'Inner Sphere'
      },
      {
        id: 'test_equipment_1',
        name: 'Heat Sink',
        type: 'heat_sink',
        requiredSlots: 1,
        weight: 1,
        techBase: 'Inner Sphere'
      }
    ];

    // Add equipment to different locations
    const leftTorso = unit.getSection('Left Torso');
    const rightTorso = unit.getSection('Right Torso');
    const centerTorso = unit.getSection('Center Torso');

    // Place AC/10 in Left Torso (slots 1-7, indices 0-6)
    leftTorso?.allocateEquipment(testEquipment[0], 0);
    
    // Place Medium Laser in Right Torso (slot 1, index 0)
    rightTorso?.allocateEquipment(testEquipment[1], 0);
    
    // Place Heat Sink in Center Torso (slot 10, index 9) - this will conflict with XL engine
    centerTorso?.allocateEquipment(testEquipment[2], 9);

    return testEquipment;
  }

  test('equipment should be displaced to unallocated pool when engine changes to XL', () => {
    // Step 1: Create unit with Standard engine
    const unit = createTestUnit();
    expect(unit.getEngineType()).toBe('Standard');
    
    // Step 2: Add test equipment
    const equipment = addTestEquipment(unit);
    expect(equipment).toHaveLength(3);
    
    // Verify initial state
    const initialSummary = unit.getSummary();
    expect(initialSummary.totalEquipment).toBe(3);
    expect(initialSummary.unallocatedEquipment).toBe(0);
    
    // Step 3: Change engine to XL (this should displace equipment, not remove it)
    const newConfig = {
      ...unit.getConfiguration(),
      engineType: 'XL' as const
    };
    
    unit.updateConfiguration(newConfig);
    
    // Step 4: Verify fix worked
    const afterSummary = unit.getSummary();
    const unallocatedEquipment = unit.getUnallocatedEquipment();
    
    // Verify engine changed
    expect(unit.getEngineType()).toBe('XL');
    
    // Verify all equipment is preserved (allocated + unallocated = original total)
    const totalEquipmentAfter = afterSummary.totalEquipment + afterSummary.unallocatedEquipment;
    expect(totalEquipmentAfter).toBe(3);
    
    // Verify some equipment was displaced (should have unallocated equipment now)
    expect(unallocatedEquipment.length).toBeGreaterThan(0);
    
    // Verify equipment that should conflict was displaced
    const conflictingEquipment = unallocatedEquipment.find(eq => eq.equipmentData.name === 'Heat Sink');
    expect(conflictingEquipment).toBeDefined();
  });

  test('equipment should remain preserved when changing back to Standard engine', () => {
    // Step 1: Create unit and add equipment
    const unit = createTestUnit();
    addTestEquipment(unit);
    
    // Step 2: Change to XL
    const xlConfig = {
      ...unit.getConfiguration(),
      engineType: 'XL' as const
    };
    unit.updateConfiguration(xlConfig);
    
    // Step 3: Change back to Standard
    const standardConfig = {
      ...unit.getConfiguration(),
      engineType: 'Standard' as const
    };
    unit.updateConfiguration(standardConfig);
    
    // Step 4: Verify equipment is still preserved
    const finalSummary = unit.getSummary();
    const totalEquipmentFinal = finalSummary.totalEquipment + finalSummary.unallocatedEquipment;
    expect(totalEquipmentFinal).toBe(3);
    
    // Verify engine is back to Standard
    expect(unit.getEngineType()).toBe('Standard');
  });

  test('specific equipment displacement scenarios', () => {
    const unit = createTestUnit();
    
    // Add equipment to specific slots that will conflict with XL engine
    const conflictEquipment: EquipmentObject = {
      id: 'conflict_equipment',
      name: 'Conflicting Equipment',
      type: 'equipment',
      requiredSlots: 1,
      weight: 1,
      techBase: 'Inner Sphere'
    };

    // Place equipment in Left Torso slot 1 (index 0) - will conflict with XL engine
    const leftTorso = unit.getSection('Left Torso');
    leftTorso?.allocateEquipment(conflictEquipment, 0);
    
    // Place equipment in Right Torso slot 2 (index 1) - will conflict with XL engine  
    const rightTorso = unit.getSection('Right Torso');
    rightTorso?.allocateEquipment({...conflictEquipment, id: 'conflict_equipment_2'}, 1);
    
    // Verify initial allocation
    expect(unit.getSummary().totalEquipment).toBe(2);
    expect(unit.getSummary().unallocatedEquipment).toBe(0);
    
    // Change to XL engine
    const newConfig = {
      ...unit.getConfiguration(),
      engineType: 'XL' as const
    };
    unit.updateConfiguration(newConfig);
    
    // Verify both conflicting equipment pieces were displaced
    const afterSummary = unit.getSummary();
    expect(afterSummary.totalEquipment + afterSummary.unallocatedEquipment).toBe(2);
    expect(afterSummary.unallocatedEquipment).toBe(2); // Both should be displaced
  });
});
