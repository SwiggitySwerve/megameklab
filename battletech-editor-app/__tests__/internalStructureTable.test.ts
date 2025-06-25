/**
 * Test Suite for Official BattleTech Internal Structure Table
 * 
 * This test suite verifies that the internal structure calculations match
 * the official BattleTech examples and construction rules.
 */

import {
  getInternalStructurePoints,
  getTotalInternalStructure,
  getMaxArmorPoints,
  getMaxArmorPointsForLocation,
  getInternalStructureBreakdown,
  isValidTonnage,
  getSupportedTonnages,
  INTERNAL_STRUCTURE_TABLE
} from '../utils/internalStructureTable';

describe('BattleTech Internal Structure Table', () => {
  
  describe('Official Examples Verification', () => {
    test('25-ton light mech structure points', () => {
      const structure = getInternalStructurePoints(25);
      
      expect(structure.HD).toBe(3);  // Head: 3 points
      expect(structure.CT).toBe(8);  // Center Torso: 8 points
      expect(structure.LT).toBe(6);  // Left Torso: 6 points
      expect(structure.RT).toBe(6);  // Right Torso: 6 points
      expect(structure.LA).toBe(4);  // Left Arm: 4 points
      expect(structure.RA).toBe(4);  // Right Arm: 4 points
      expect(structure.LL).toBe(6);  // Left Leg: 6 points
      expect(structure.RL).toBe(6);  // Right Leg: 6 points
    });

    test('50-ton medium mech structure points', () => {
      const structure = getInternalStructurePoints(50);
      
      expect(structure.HD).toBe(3);   // Head: 3 points
      expect(structure.CT).toBe(16);  // Center Torso: 16 points
      expect(structure.LT).toBe(11);  // Left Torso: should be 11 (2.1 * 5 = 10.5, rounds to 11)
      expect(structure.RT).toBe(11);  // Right Torso: should be 11
      expect(structure.LA).toBe(9);   // Left Arm: should be 9 (1.7 * 5 = 8.5, rounds to 9)
      expect(structure.RA).toBe(9);   // Right Arm: should be 9
      expect(structure.LL).toBe(11);  // Left Leg: should be 11
      expect(structure.RL).toBe(11);  // Right Leg: should be 11
    });

    test('95-ton assault mech structure points', () => {
      const structure = getInternalStructurePoints(95);
      
      expect(structure.HD).toBe(3);   // Head: 3 points
      expect(structure.CT).toBe(31);  // Center Torso: should be 31 (3.2 * 9.5 = 30.4, rounds to 31)
      expect(structure.LT).toBe(20);  // Left Torso: should be 20 (2.1 * 9.5 = 19.95, rounds to 20)
      expect(structure.RT).toBe(20);  // Right Torso: should be 20
      expect(structure.LA).toBe(17);  // Left Arm: should be 17 (1.7 * 9.5 = 16.15, rounds to 17)
      expect(structure.RA).toBe(17);  // Right Arm: should be 17
      expect(structure.LL).toBe(20);  // Left Leg: should be 20
      expect(structure.RL).toBe(20);  // Right Leg: should be 20
    });
  });

  describe('Edge Cases', () => {
    test('20-ton minimum mech', () => {
      const structure = getInternalStructurePoints(20);
      
      expect(structure.HD).toBe(3);  // Head always 3
      expect(structure.CT).toBe(7);  // 3.2 * 2 = 6.4, rounds to 7
      expect(structure.LT).toBe(5);  // 2.1 * 2 = 4.2, rounds to 5
      expect(structure.RT).toBe(5);  
      expect(structure.LA).toBe(4);  // 1.7 * 2 = 3.4, rounds to 4
      expect(structure.RA).toBe(4);  
      expect(structure.LL).toBe(5);  
      expect(structure.RL).toBe(5);  
    });

    test('100-ton maximum mech', () => {
      const structure = getInternalStructurePoints(100);
      
      expect(structure.HD).toBe(3);   // Head always 3
      expect(structure.CT).toBe(32);  // 3.2 * 10 = 32
      expect(structure.LT).toBe(21);  // 2.1 * 10 = 21
      expect(structure.RT).toBe(21);  
      expect(structure.LA).toBe(17);  // 1.7 * 10 = 17
      expect(structure.RA).toBe(17);  
      expect(structure.LL).toBe(21);  
      expect(structure.RL).toBe(21);  
    });
  });

  describe('Formula Verification', () => {
    test('Head is always 3 points regardless of tonnage', () => {
      const tonnages = [20, 35, 50, 75, 100];
      tonnages.forEach(tonnage => {
        const structure = getInternalStructurePoints(tonnage);
        expect(structure.HD).toBe(3);
      });
    });

    test('Verify linear scaling for 50-ton vs 25-ton', () => {
      const structure25 = getInternalStructurePoints(25);
      const structure50 = getInternalStructurePoints(50);
      
      // 50-ton should have roughly double the structure points (except head)
      // Note: Due to rounding, this isn't exactly double, but should be close
      expect(structure50.CT).toBeGreaterThan(structure25.CT * 1.8);
      expect(structure50.LT).toBeGreaterThan(structure25.LT * 1.8);
      expect(structure50.LA).toBeGreaterThan(structure25.LA * 1.8);
      expect(structure50.LL).toBeGreaterThan(structure25.LL * 1.8);
    });
  });

  describe('Total Internal Structure', () => {
    test('25-ton total internal structure', () => {
      const total = getTotalInternalStructure(25);
      const expected = 3 + 8 + 6 + 6 + 4 + 4 + 6 + 6; // 43
      expect(total).toBe(expected);
    });

    test('50-ton total internal structure', () => {
      const total = getTotalInternalStructure(50);
      // Using corrected values: 3 + 16 + 11 + 11 + 9 + 9 + 11 + 11 = 81
      expect(total).toBe(81);
    });

    test('100-ton total internal structure', () => {
      const total = getTotalInternalStructure(100);
      const expected = 3 + 32 + 21 + 21 + 17 + 17 + 21 + 21; // 153
      expect(total).toBe(expected);
    });
  });

  describe('Maximum Armor Calculations', () => {
    test('25-ton maximum armor points', () => {
      const maxArmor = getMaxArmorPoints(25);
      // Head: 9, Others: (8+6+6+4+4+6+6)*2 = 80, Total: 89
      const expected = 9 + (8 + 6 + 6 + 4 + 4 + 6 + 6) * 2;
      expect(maxArmor).toBe(expected);
    });

    test('50-ton maximum armor points', () => {
      const maxArmor = getMaxArmorPoints(50);
      // Head: 9, Others: (16+11+11+9+9+11+11)*2 = 156, Total: 165
      const expected = 9 + (16 + 11 + 11 + 9 + 9 + 11 + 11) * 2;
      expect(maxArmor).toBe(expected);
    });

    test('Head armor is always limited to 9', () => {
      const tonnages = [20, 50, 100];
      tonnages.forEach(tonnage => {
        const headMax = getMaxArmorPointsForLocation(tonnage, 'HD');
        expect(headMax).toBe(9);
      });
    });

    test('Other locations are 2x internal structure', () => {
      const structure = getInternalStructurePoints(50);
      
      expect(getMaxArmorPointsForLocation(50, 'CT')).toBe(structure.CT * 2);
      expect(getMaxArmorPointsForLocation(50, 'LT')).toBe(structure.LT * 2);
      expect(getMaxArmorPointsForLocation(50, 'LA')).toBe(structure.LA * 2);
      expect(getMaxArmorPointsForLocation(50, 'LL')).toBe(structure.LL * 2);
    });
  });

  describe('Location Name Mapping', () => {
    test('Location name variations work correctly', () => {
      const tonnage = 50;
      
      // Test different ways to specify the same location
      expect(getMaxArmorPointsForLocation(tonnage, 'HEAD')).toBe(9);
      expect(getMaxArmorPointsForLocation(tonnage, 'HD')).toBe(9);
      
      expect(getMaxArmorPointsForLocation(tonnage, 'CENTER_TORSO')).toBe(32);
      expect(getMaxArmorPointsForLocation(tonnage, 'CT')).toBe(32);
      
      expect(getMaxArmorPointsForLocation(tonnage, 'LEFT_ARM')).toBe(18);
      expect(getMaxArmorPointsForLocation(tonnage, 'LA')).toBe(18);
    });

    test('Invalid location throws error', () => {
      expect(() => getMaxArmorPointsForLocation(50, 'INVALID')).toThrow('Unknown location');
    });
  });

  describe('Validation Functions', () => {
    test('Valid tonnages are recognized', () => {
      const validTonnages = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
      validTonnages.forEach(tonnage => {
        expect(isValidTonnage(tonnage)).toBe(true);
      });
    });

    test('Invalid tonnages are rejected', () => {
      const invalidTonnages = [15, 22, 37, 101, 150];
      invalidTonnages.forEach(tonnage => {
        expect(isValidTonnage(tonnage)).toBe(false);
      });
    });

    test('Supported tonnages list is correct', () => {
      const supported = getSupportedTonnages();
      expect(supported).toHaveLength(17); // 20-100 in 5-ton increments
      expect(supported[0]).toBe(20);
      expect(supported[supported.length - 1]).toBe(100);
    });
  });

  describe('Breakdown Function', () => {
    test('Breakdown provides complete information', () => {
      const breakdown = getInternalStructureBreakdown(50);
      
      expect(breakdown.structure).toBeDefined();
      expect(breakdown.total).toBe(81);
      expect(breakdown.maxArmor).toBe(165);
      expect(breakdown.locationMaxArmor.Head).toBe(9);
      expect(breakdown.locationMaxArmor['Center Torso']).toBe(32);
    });
  });

  describe('Error Handling', () => {
    test('Invalid tonnage throws appropriate error', () => {
      expect(() => getInternalStructurePoints(15)).toThrow('Invalid tonnage: 15');
      expect(() => getInternalStructurePoints(105)).toThrow('Invalid tonnage: 105');
    });

    test('Tonnage rounding works correctly', () => {
      // Should round 47 to 45, 53 to 55, etc.
      const structure47 = getInternalStructurePoints(47);
      const structure45 = getInternalStructurePoints(45);
      expect(structure47).toEqual(structure45);
    });
  });

  describe('Table Completeness', () => {
    test('Internal structure table has all required tonnages', () => {
      for (let tonnage = 20; tonnage <= 100; tonnage += 5) {
        expect(INTERNAL_STRUCTURE_TABLE[tonnage]).toBeDefined();
        expect(INTERNAL_STRUCTURE_TABLE[tonnage].HD).toBe(3);
      }
    });

    test('All table entries have positive values', () => {
      Object.values(INTERNAL_STRUCTURE_TABLE).forEach(structure => {
        Object.values(structure).forEach(points => {
          expect(points).toBeGreaterThan(0);
        });
      });
    });
  });
});
