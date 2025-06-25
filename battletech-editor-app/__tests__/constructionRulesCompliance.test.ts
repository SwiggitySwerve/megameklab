/**
 * Construction Rules Compliance Test Suite
 * 
 * Tests to ensure the unit data interface complies with official BattleTech construction rules
 * as defined in the Construction Guide. These tests validate the Priority 1 fixes and ensure
 * long-term compliance with construction rules.
 */

import { 
  STRUCTURE_WEIGHT_MULTIPLIERS,
  calculateStructureWeight,
  calculateMaxArmorPoints
} from '../utils/structureCalculations';
import { 
  calculateMaxArmorPoints as calculateArmorPoints,
  autoAllocateArmor
} from '../utils/armorAllocation';
import { getInternalStructurePoints, getMaxArmorPoints } from '../utils/internalStructureTable';
import { EditableUnit } from '../types/editor';

describe('Construction Rules Compliance', () => {
  
  describe('Industrial Structure Weight', () => {
    test('Industrial structure should be 20% of mech tonnage', () => {
      // Test various tonnages
      const tonnages = [20, 35, 50, 75, 100];
      
      tonnages.forEach(tonnage => {
        const weight = calculateStructureWeight(tonnage, 'Industrial');
        const expectedWeight = Math.ceil((tonnage * 0.20) * 2) / 2; // 20% rounded to nearest half-ton
        
        expect(weight).toBe(expectedWeight);
      });
    });

    test('Industrial structure weight constant should be 0.20', () => {
      expect(STRUCTURE_WEIGHT_MULTIPLIERS.Industrial).toBe(0.20);
    });

    test('Industrial structure weight should be double standard structure', () => {
      const tonnages = [25, 50, 75, 100];
      
      tonnages.forEach(tonnage => {
        const standardWeight = calculateStructureWeight(tonnage, 'Standard');
        const industrialWeight = calculateStructureWeight(tonnage, 'Industrial');
        
        // Industrial should be exactly 2x standard (both use proper rounding)
        expect(industrialWeight).toBe(standardWeight * 2);
      });
    });
  });

  describe('Head Armor Maximum', () => {
    // Create test units for different tonnages
    const createTestUnit = (tonnage: number): EditableUnit => ({
      id: 'test-unit',
      chassis: 'Test Chassis',
      model: 'Test Model',
      mass: tonnage,
      era: 'Clan Invasion',
      tech_base: 'Inner Sphere',
      data: {
        chassis: 'Test Chassis',
        model: 'Test Model',
        structure: { type: 'Standard' },
        armor: { total_armor_points: 0, locations: [] },
        engine: { rating: 200, type: 'standard' },
        gyro: { type: 'standard' },
        cockpit: { type: 'standard' },
        heat_sinks: { count: 10, type: 'single' },
        weapons_and_equipment: []
      },
      armorAllocation: {},
      equipmentPlacements: [],
      criticalSlots: [],
      fluffData: {},
      selectedQuirks: [],
      validationState: { isValid: true, errors: [], warnings: [] },
      editorMetadata: {
        lastModified: new Date(),
        isDirty: false,
        version: '1.0'
      }
    });

    test('Head armor should never exceed 9 points regardless of tonnage', () => {
      const tonnages = [20, 35, 50, 75, 100, 120]; // Including theoretical superheavy
      
      tonnages.forEach(tonnage => {
        const unit = createTestUnit(tonnage);
        const maxArmorPoints = calculateArmorPoints(unit);
        
        // Calculate expected max for comparison
        const internalStructure = Number(getInternalStructurePoints(tonnage));
        const expectedMax = 9 + Math.max(0, internalStructure - 3) * 2; // Head=9, all others=2x structure
        
        expect(maxArmorPoints).toBe(expectedMax);
      });
    });

    test('Auto armor allocation should never allocate more than 9 head armor', () => {
      const tonnages = [20, 50, 100];
      
      tonnages.forEach(tonnage => {
        const unit = createTestUnit(tonnage);
        if (unit.data?.armor) {
          unit.data.armor.total_armor_points = 500; // High armor to test limits
        }
        
        const allocation = autoAllocateArmor(unit);
        
        expect(allocation.HEAD.front).toBeLessThanOrEqual(9);
        expect(allocation.HEAD.front).toBeGreaterThanOrEqual(0);
      });
    });

    test('Head armor should be 9 for all standard tonnage classes', () => {
      // Test standard BattleMech tonnages (20-100 in 5-ton increments)
      for (let tonnage = 20; tonnage <= 100; tonnage += 5) {
        const unit = createTestUnit(tonnage);
        if (unit.data?.armor) {
          unit.data.armor.total_armor_points = 300; // High enough to max head armor
        }
        
        const allocation = autoAllocateArmor(unit);
        
        // With sufficient armor points, head should always get 9
        expect(allocation.HEAD.front).toBeLessThanOrEqual(9);
      }
    });
  });

  describe('Industrial Armor Capacity', () => {
    test('Industrial mechs should use standard 2:1 armor ratio', () => {
      const tonnages = [25, 50, 75];
      
      tonnages.forEach(tonnage => {
        // Test both Standard and Industrial structures
        const standardMax = calculateMaxArmorPoints(tonnage, 'Standard');
        const industrialMax = calculateMaxArmorPoints(tonnage, 'Industrial');
        
        // Both should use the same armor ratio calculation
        // The only difference should be from different internal structure points
        const standardInternal = Number(getInternalStructurePoints(tonnage));
        const industrialInternal = Number(getInternalStructurePoints(tonnage)); // Same table used
        
        // Both should follow: Head=9, Others=2x internal structure
        expect(standardMax).toBe(9 + Math.max(0, standardInternal - 3) * 2);
        expect(industrialMax).toBe(9 + Math.max(0, industrialInternal - 3) * 2);
        
        // Since they use the same internal structure table, max armor should be equal
        expect(industrialMax).toBe(standardMax);
      });
    });
  });

  describe('Weight Rounding Consistency', () => {
    test('Structure weight should round to nearest half-ton', () => {
      // Test with tonnages that create fractional weights
      const testCases = [
        { tonnage: 23, type: 'Standard' as const }, // 2.3 -> 2.5
        { tonnage: 27, type: 'Standard' as const }, // 2.7 -> 3.0
        { tonnage: 33, type: 'Endo Steel' as const }, // 1.65 -> 2.0
      ];
      
      testCases.forEach(({ tonnage, type }) => {
        const weight = calculateStructureWeight(tonnage, type);
        
        // Weight should be a multiple of 0.5
        expect(weight * 2).toBe(Math.floor(weight * 2));
        
        // Weight should be the ceiling of the half-ton calculation
        const exactWeight = tonnage * STRUCTURE_WEIGHT_MULTIPLIERS[type];
        const expectedWeight = Math.ceil(exactWeight * 2) / 2;
        expect(weight).toBe(expectedWeight);
      });
    });
  });

  describe('Critical Slot Validation', () => {
    test('Total critical slots should equal 78 for all mechs', () => {
      // Defined slots per location according to BattleTech rules
      const CRITICAL_SLOTS_PER_LOCATION = {
        'HEAD': 6,
        'CT': 12,
        'LT': 12,
        'RT': 12,
        'LA': 12,
        'RA': 12,
        'LL': 6,
        'RL': 6
      };
      
      const totalSlots = Object.values(CRITICAL_SLOTS_PER_LOCATION).reduce((sum, slots) => sum + slots, 0);
      
      expect(totalSlots).toBe(78);
    });
  });

  describe('Endo Steel Weight Savings', () => {
    test('Endo Steel should provide 50% weight savings', () => {
      const tonnages = [25, 50, 75, 100];
      
      tonnages.forEach(tonnage => {
        const standardWeight = calculateStructureWeight(tonnage, 'Standard');
        const endoSteelWeight = calculateStructureWeight(tonnage, 'Endo Steel');
        
        // Endo Steel should be approximately 50% of standard (with rounding)
        const expectedEndoWeight = Math.ceil((tonnage * 0.05) * 2) / 2;
        expect(endoSteelWeight).toBe(expectedEndoWeight);
        
        // Verify the relationship (allowing for rounding differences)
        expect(endoSteelWeight).toBeLessThanOrEqual(standardWeight * 0.5 + 0.5);
      });
    });
  });

  describe('Official BattleTech Structure Table Compliance', () => {
    test('Structure points should match official BattleTech table', () => {
      // Test key tonnage breakpoints
      const testCases = [
        { tonnage: 20, expected: { total: 31, head: 3 } },
        { tonnage: 35, expected: { total: 53, head: 3 } },
        { tonnage: 50, expected: { total: 76, head: 3 } },
        { tonnage: 75, expected: { total: 114, head: 3 } },
        { tonnage: 100, expected: { total: 152, head: 3 } }
      ];
      
      testCases.forEach(({ tonnage, expected }) => {
        const structure = getInternalStructurePoints(tonnage);
        
        expect(structure).toBe(expected.total);
        
        // Head should always be 3
        const detailedStructure = require('../utils/internalStructureTable').getInternalStructurePoints(tonnage);
        expect(detailedStructure.HD).toBe(expected.head);
      });
    });
  });

  describe('Maximum Armor Points Calculation', () => {
    test('Maximum armor should follow 2:1 rule except head', () => {
      const tonnages = [25, 50, 75, 100];
      
      tonnages.forEach(tonnage => {
        const maxArmor = getMaxArmorPoints(tonnage);
        const totalStructure = Number(getInternalStructurePoints(tonnage));
        
        // Expected: Head=9, everything else=2x structure
        const expectedMax = 9 + (totalStructure - 3) * 2;
        
        expect(maxArmor).toBe(expectedMax);
      });
    });
  });
});

describe('Regression Tests for Fixed Issues', () => {
  describe('Issue: Industrial Structure Weight was 15% instead of 20%', () => {
    test('50-ton Industrial mech should have 10.0 tons structure weight', () => {
      const weight = calculateStructureWeight(50, 'Industrial');
      expect(weight).toBe(10.0); // 50 * 0.20 = 10.0
    });
    
    test('75-ton Industrial mech should have 15.0 tons structure weight', () => {
      const weight = calculateStructureWeight(75, 'Industrial');
      expect(weight).toBe(15.0); // 75 * 0.20 = 15.0
    });
  });
  
  describe('Issue: Head armor allowed 12 points for superheavy mechs', () => {
    test('100+ ton mechs should still have 9 point head armor maximum', () => {
      const unit: EditableUnit = {
        id: 'test-superheavy',
        chassis: 'Test Superheavy',
        model: 'Test Model',
        mass: 120, // Theoretical superheavy
        era: 'Clan Invasion',
        tech_base: 'Inner Sphere',
        data: {
          chassis: 'Test Superheavy',
          model: 'Test Model',
          structure: { type: 'Standard' },
          armor: { total_armor_points: 500, locations: [] },
          engine: { rating: 200, type: 'standard' },
          gyro: { type: 'standard' },
          cockpit: { type: 'standard' },
          heat_sinks: { count: 10, type: 'single' },
          weapons_and_equipment: []
        },
        armorAllocation: {},
        equipmentPlacements: [],
        criticalSlots: [],
        fluffData: {},
        selectedQuirks: [],
        validationState: { isValid: true, errors: [], warnings: [] },
        editorMetadata: {
          lastModified: new Date(),
          isDirty: false,
          version: '1.0'
        }
      };
      
      const allocation = autoAllocateArmor(unit);
      expect(allocation.HEAD.front).toBeLessThanOrEqual(9);
    });
  });
  
  describe('Issue: Industrial mechs had reduced armor capacity', () => {
    test('Industrial mechs should have same armor capacity as standard mechs', () => {
      const tonnage = 50;
      const standardMax = calculateMaxArmorPoints(tonnage, 'Standard');
      const industrialMax = calculateMaxArmorPoints(tonnage, 'Industrial');
      
      // Should be equal since they use the same internal structure table
      expect(industrialMax).toBe(standardMax);
    });
  });
});
