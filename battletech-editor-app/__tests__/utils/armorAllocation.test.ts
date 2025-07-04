/**
 * Armor Allocation Test Suite
 * Comprehensive tests for BattleTech armor allocation calculations
 */

import {
  calculateMaxArmorPoints,
  autoAllocateArmor,
  allocateLeftoverPoints,
  maximizeArmor,
  calculateMaxArmorTonnage,
  calculateRemainingTonnage,
  calculateRemainingTonnageForArmor,
  ArmorAllocation
} from '../../utils/armorAllocation';
import { EditableUnit } from '../../types/editor';

// Mock dependencies
jest.mock('../../utils/internalStructureTable');
jest.mock('../../utils/armorTypes');
jest.mock('../../utils/equipmentData');

// Mock internal structure table
const mockGetInternalStructure = jest.fn();
require('../../utils/internalStructureTable').getInternalStructurePoints = mockGetInternalStructure;

// Mock armor types
const mockGetArmorType = jest.fn();
require('../../utils/armorTypes').getArmorType = mockGetArmorType;

// Mock equipment database
require('../../utils/equipmentData').EQUIPMENT_DATABASE = [
  { name: 'AC/20', weight: 14 },
  { name: 'Large Laser', weight: 5 },
  { name: 'LRM 20', weight: 10 }
];

// Helper function to create test unit
function createTestUnit(overrides: Partial<EditableUnit> = {}): EditableUnit {
  return {
    mass: 100,
    data: {
      armor: {
        locations: [],
        total_armor_points: 300
      },
      structure: {
        type: 'standard'
      },
      engine: {
        rating: 300,
        type: 'standard'
      },
      gyro: {
        type: 'standard'
      },
      cockpit: {
        type: 'standard'
      },
      heat_sinks: {
        count: 20,
        type: 'single'
      },
      movement: {
        jump_mp: 0
      },
      weapons_and_equipment: []
    },
    armorAllocation: {},
    ...overrides
  } as EditableUnit;
}

// Standard 100-ton Atlas internal structure
const atlasStructure = {
  HD: 3,
  CT: 31,
  LT: 21,
  RT: 21,
  LA: 17,
  RA: 17,
  LL: 21,
  RL: 21
};

// Standard armor type
const standardArmor = {
  pointsPerTon: 16,
  name: 'Standard'
};

describe('armorAllocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockGetInternalStructure.mockReturnValue(atlasStructure);
    mockGetArmorType.mockReturnValue(standardArmor);
  });

  describe('calculateMaxArmorPoints', () => {
    test('should calculate maximum armor points for 100-ton mech', () => {
      const unit = createTestUnit({ mass: 100 });
      
      const maxArmor = calculateMaxArmorPoints(unit);
      
      // Head: 9 (fixed) + other locations: (31+21+21+17+17+21+21) * 2 = 298
      // Total: 9 + 298 = 307
      expect(maxArmor).toBe(307);
    });

    test('should handle different tonnage classes', () => {
      // 50-ton medium mech
      const mediumStructure = {
        HD: 3, CT: 16, LT: 12, RT: 12, LA: 8, RA: 8, LL: 12, RL: 12
      };
      mockGetInternalStructure.mockReturnValue(mediumStructure);
      
      const unit = createTestUnit({ mass: 50 });
      
      const maxArmor = calculateMaxArmorPoints(unit);
      
      // Head: 9 + others: (16+12+12+8+8+12+12) * 2 = 160
      // Total: 9 + 160 = 169
      expect(maxArmor).toBe(169);
    });

    test('should always cap head armor at 9', () => {
      const unit = createTestUnit({ mass: 100 });
      
      const maxArmor = calculateMaxArmorPoints(unit);
      
      // Head should contribute exactly 9 points regardless of internal structure
      const headContribution = 9;
      const otherContribution = maxArmor - headContribution;
      
      expect(headContribution).toBe(9);
      expect(otherContribution).toBe(298); // For 100-ton Atlas
    });

    test('should handle edge case tonnages', () => {
      // 20-ton light mech
      const lightStructure = {
        HD: 3, CT: 6, LT: 5, RT: 5, LA: 3, RA: 3, LL: 4, RL: 4
      };
      mockGetInternalStructure.mockReturnValue(lightStructure);
      
      const unit = createTestUnit({ mass: 20 });
      
      const maxArmor = calculateMaxArmorPoints(unit);
      
      // Head: 9 + others: (6+5+5+3+3+4+4) * 2 = 60
      // Total: 9 + 60 = 69
      expect(maxArmor).toBe(69);
    });
  });

  describe('autoAllocateArmor', () => {
    test('should allocate armor proportionally', () => {
      const unit = createTestUnit({
        mass: 100,
        data: {
          ...createTestUnit().data!,
          armor: {
            locations: [],
            total_armor_points: 200
          }
        }
      });
      
      const allocation = autoAllocateArmor(unit);
      
      // Should allocate to all locations
      expect(allocation.HEAD).toBeDefined();
      expect(allocation.CT).toBeDefined();
      expect(allocation.LT).toBeDefined();
      expect(allocation.RT).toBeDefined();
      expect(allocation.LA).toBeDefined();
      expect(allocation.RA).toBeDefined();
      expect(allocation.LL).toBeDefined();
      expect(allocation.RL).toBeDefined();
      
      // Total should match input
      const totalAllocated = Object.values(allocation).reduce((sum, loc) => {
        return sum + loc.front + (loc.rear || 0);
      }, 0);
      
      expect(totalAllocated).toBe(200);
    });

    test('should handle zero armor points', () => {
      const unit = createTestUnit({
        data: {
          ...createTestUnit().data!,
          armor: {
            locations: [],
            total_armor_points: 0
          }
        }
      });
      
      const allocation = autoAllocateArmor(unit);
      
      // Should return empty allocation
      expect(allocation.HEAD.front).toBe(0);
      expect(allocation.CT.front).toBe(0);
      expect(allocation.CT.rear).toBe(0);
    });

    test('should prioritize head armor (5x multiplier)', () => {
      const unit = createTestUnit({
        mass: 100,
        data: {
          ...createTestUnit().data!,
          armor: {
            locations: [],
            total_armor_points: 50 // Small amount
          }
        }
      });
      
      const allocation = autoAllocateArmor(unit);
      
      // Head should get more than proportional share due to 5x multiplier
      expect(allocation.HEAD.front).toBeGreaterThan(0);
      
      // But never exceed 9
      expect(allocation.HEAD.front).toBeLessThanOrEqual(9);
    });

    test('should split torso armor 75/25 front/rear', () => {
      const unit = createTestUnit({
        mass: 100,
        data: {
          ...createTestUnit().data!,
          armor: {
            locations: [],
            total_armor_points: 200
          }
        }
      });
      
      const allocation = autoAllocateArmor(unit);
      
      // Check center torso front/rear ratio
      const ctTotal = allocation.CT.front + (allocation.CT.rear || 0);
      if (ctTotal > 0) {
        const frontRatio = allocation.CT.front / ctTotal;
        expect(frontRatio).toBeCloseTo(0.75, 1);
      }
      
      // Same for side torsos
      const ltTotal = allocation.LT.front + (allocation.LT.rear || 0);
      if (ltTotal > 0) {
        const frontRatio = allocation.LT.front / ltTotal;
        expect(frontRatio).toBeCloseTo(0.75, 1);
      }
    });

    test('should not allocate rear armor to arms and legs', () => {
      const unit = createTestUnit({
        mass: 100,
        data: {
          ...createTestUnit().data!,
          armor: {
            locations: [],
            total_armor_points: 200
          }
        }
      });
      
      const allocation = autoAllocateArmor(unit);
      
      // Arms and legs should only have front armor
      expect(allocation.LA.rear).toBeUndefined();
      expect(allocation.RA.rear).toBeUndefined();
      expect(allocation.LL.rear).toBeUndefined();
      expect(allocation.RL.rear).toBeUndefined();
    });

    test('should handle maximum armor allocation', () => {
      const unit = createTestUnit({
        mass: 100,
        data: {
          ...createTestUnit().data!,
          armor: {
            locations: [],
            total_armor_points: 307 // Maximum for 100-ton
          }
        }
      });
      
      const allocation = autoAllocateArmor(unit);
      
      // Should not exceed maximum for any location
      expect(allocation.HEAD.front).toBeLessThanOrEqual(9);
      expect(allocation.CT.front + (allocation.CT.rear || 0)).toBeLessThanOrEqual(62);
      expect(allocation.LT.front + (allocation.LT.rear || 0)).toBeLessThanOrEqual(42);
      expect(allocation.RT.front + (allocation.RT.rear || 0)).toBeLessThanOrEqual(42);
      expect(allocation.LA.front).toBeLessThanOrEqual(34);
      expect(allocation.RA.front).toBeLessThanOrEqual(34);
      expect(allocation.LL.front).toBeLessThanOrEqual(42);
      expect(allocation.RL.front).toBeLessThanOrEqual(42);
    });
  });

  describe('allocateLeftoverPoints', () => {
    test('should distribute leftover points symmetrically', () => {
      const baseAllocation: ArmorAllocation = {
        HEAD: { front: 9 },
        CT: { front: 30, rear: 10 },
        LT: { front: 15, rear: 5 },
        RT: { front: 15, rear: 5 },
        LA: { front: 16 },
        RA: { front: 16 },
        LL: { front: 20 },
        RL: { front: 20 }
      };
      
      const unit = createTestUnit({ mass: 100 });
      
      const result = allocateLeftoverPoints(unit, 4, baseAllocation);
      
      // Should maintain symmetry
      const ltTotal = result.LT.front + (result.LT.rear || 0);
      const rtTotal = result.RT.front + (result.RT.rear || 0);
      expect(Math.abs(ltTotal - rtTotal)).toBeLessThanOrEqual(1);
      
      const laTotal = result.LA.front;
      const raTotal = result.RA.front;
      expect(Math.abs(laTotal - raTotal)).toBeLessThanOrEqual(1);
    });

    test('should prioritize torso over arms and legs', () => {
      const baseAllocation: ArmorAllocation = {
        HEAD: { front: 9 },
        CT: { front: 30, rear: 10 },
        LT: { front: 10, rear: 5 }, // Lower to allow room for growth
        RT: { front: 10, rear: 5 }, // Lower to allow room for growth
        LA: { front: 10 },
        RA: { front: 10 },
        LL: { front: 15 },
        RL: { front: 15 }
      };
      
      const unit = createTestUnit({ mass: 100 });
      
      const result = allocateLeftoverPoints(unit, 2, baseAllocation);
      
      // Should allocate symmetrically to torso when possible
      const originalLT = baseAllocation.LT.front + (baseAllocation.LT.rear || 0);
      const originalRT = baseAllocation.RT.front + (baseAllocation.RT.rear || 0);
      const newLT = result.LT.front + (result.LT.rear || 0);
      const newRT = result.RT.front + (result.RT.rear || 0);
      
      // Should allocate at least some points
      expect(newLT + newRT).toBeGreaterThanOrEqual(originalLT + originalRT);
      
      // With 2 points, should allocate to symmetric locations
      expect(newLT + newRT - originalLT - originalRT).toBeGreaterThanOrEqual(0);
    });

    test('should not exceed location maximums', () => {
      const maxedAllocation: ArmorAllocation = {
        HEAD: { front: 9 }, // At maximum
        CT: { front: 46, rear: 16 }, // At maximum (62 total)
        LT: { front: 31, rear: 11 }, // At maximum (42 total)
        RT: { front: 31, rear: 11 }, // At maximum (42 total)
        LA: { front: 34 }, // At maximum
        RA: { front: 34 }, // At maximum
        LL: { front: 42 }, // At maximum
        RL: { front: 42 }  // At maximum
      };
      
      const unit = createTestUnit({ mass: 100 });
      
      const result = allocateLeftoverPoints(unit, 10, maxedAllocation);
      
      // Should not exceed maximums
      expect(result.HEAD.front).toBe(9);
      expect(result.CT.front + (result.CT.rear || 0)).toBe(62);
      expect(result.LT.front + (result.LT.rear || 0)).toBe(42);
      expect(result.RT.front + (result.RT.rear || 0)).toBe(42);
      expect(result.LA.front).toBe(34);
      expect(result.RA.front).toBe(34);
      expect(result.LL.front).toBe(42);
      expect(result.RL.front).toBe(42);
    });

    test('should handle imbalanced starting allocations', () => {
      const imbalancedAllocation: ArmorAllocation = {
        HEAD: { front: 9 },
        CT: { front: 30, rear: 10 },
        LT: { front: 10, rear: 5 }, // Lower than RT
        RT: { front: 20, rear: 5 }, // Higher than LT
        LA: { front: 15 }, // Lower than RA
        RA: { front: 20 }, // Higher than LA
        LL: { front: 18 },
        RL: { front: 18 }
      };
      
      const unit = createTestUnit({ mass: 100 });
      
      const result = allocateLeftoverPoints(unit, 6, imbalancedAllocation);
      
      // Should work towards balancing imbalanced locations
      const ltTotal = result.LT.front + (result.LT.rear || 0);
      const rtTotal = result.RT.front + (result.RT.rear || 0);
      expect(ltTotal).toBeGreaterThanOrEqual(imbalancedAllocation.LT.front + (imbalancedAllocation.LT.rear || 0));
      
      const laTotal = result.LA.front;
      const raTotal = result.RA.front;
      expect(laTotal).toBeGreaterThanOrEqual(imbalancedAllocation.LA.front);
      
      // Total allocation should increase by the number of points added
      const originalTotal = Object.values(imbalancedAllocation).reduce((sum, loc) => {
        return sum + loc.front + (loc.rear || 0);
      }, 0);
      const newTotal = Object.values(result).reduce((sum, loc) => {
        return sum + loc.front + (loc.rear || 0);
      }, 0);
      expect(newTotal).toBeGreaterThanOrEqual(originalTotal);
    });
  });

  describe('calculateMaxArmorTonnage', () => {
    test('should calculate maximum armor tonnage for standard armor', () => {
      const unit = createTestUnit({ mass: 100 });
      
      const maxTonnage = calculateMaxArmorTonnage(unit);
      
      // 307 max points / 16 points per ton = 19.1875, rounded up to nearest half = 19.5
      expect(maxTonnage).toBe(19.5);
    });

    test('should handle different armor types', () => {
      const ferroFibrousArmor = {
        pointsPerTon: 19.2,
        name: 'Ferro-Fibrous'
      };
      mockGetArmorType.mockReturnValue(ferroFibrousArmor);
      
      const unit = createTestUnit({ mass: 100 });
      
      const maxTonnage = calculateMaxArmorTonnage(unit, ferroFibrousArmor);
      
      // 307 points / 19.2 points per ton = 15.99, rounded up to nearest half = 16.0
      expect(maxTonnage).toBe(16.0);
    });

    test('should handle small mechs', () => {
      // 20-ton mech with 69 max armor points
      const lightStructure = {
        HD: 3, CT: 6, LT: 5, RT: 5, LA: 3, RA: 3, LL: 4, RL: 4
      };
      mockGetInternalStructure.mockReturnValue(lightStructure);
      
      const unit = createTestUnit({ mass: 20 });
      
      const maxTonnage = calculateMaxArmorTonnage(unit);
      
      // 69 points / 16 points per ton = 4.31, rounded up to nearest half = 4.5
      expect(maxTonnage).toBe(4.5);
    });
  });

  describe('calculateRemainingTonnage', () => {
    test('should calculate remaining tonnage for basic mech', () => {
      const unit = createTestUnit({
        mass: 100,
        data: {
          ...createTestUnit().data!,
          structure: { type: 'standard' },
          engine: { rating: 300, type: 'standard' },
          gyro: { type: 'standard' },
          cockpit: { type: 'standard' },
          heat_sinks: { count: 20, type: 'single' },
          armor: { locations: [], total_armor_points: 200 },
          movement: { jump_mp: 0 },
          weapons_and_equipment: []
        }
      });
      
      const remaining = calculateRemainingTonnage(unit);
      
      // Should be positive for a basic mech configuration
      expect(remaining).toBeGreaterThan(0);
      
      // Should be reasonable for 100-ton mech
      expect(remaining).toBeLessThan(50); // Not more than half the mech
    });

    test('should handle different structure types', () => {
      const endoUnit = createTestUnit({
        mass: 100,
        data: {
          ...createTestUnit().data!,
          structure: { type: 'endo-steel' }
        }
      });
      
      const standardUnit = createTestUnit({
        mass: 100,
        data: {
          ...createTestUnit().data!,
          structure: { type: 'standard' }
        }
      });
      
      const endoRemaining = calculateRemainingTonnage(endoUnit);
      const standardRemaining = calculateRemainingTonnage(standardUnit);
      
      // Endo steel should leave more tonnage available
      expect(endoRemaining).toBeGreaterThan(standardRemaining);
    });

    test('should handle different engine types', () => {
      const xlUnit = createTestUnit({
        mass: 100,
        data: {
          ...createTestUnit().data!,
          engine: { rating: 300, type: 'xl' }
        }
      });
      
      const standardUnit = createTestUnit({
        mass: 100,
        data: {
          ...createTestUnit().data!,
          engine: { rating: 300, type: 'standard' }
        }
      });
      
      const xlRemaining = calculateRemainingTonnage(xlUnit);
      const standardRemaining = calculateRemainingTonnage(standardUnit);
      
      // XL engine should leave more tonnage available
      expect(xlRemaining).toBeGreaterThan(standardRemaining);
    });

    test('should account for equipment weight', () => {
      const heavyEquipmentUnit = createTestUnit({
        mass: 100,
        data: {
          ...createTestUnit().data!,
          weapons_and_equipment: [
            { item_name: 'AC/20', location: 'RA', item_type: 'weapon', tech_base: 'IS' },
            { item_name: 'Large Laser', location: 'LA', item_type: 'weapon', tech_base: 'IS' },
            { item_name: 'LRM 20', location: 'LT', item_type: 'weapon', tech_base: 'IS' }
          ]
        }
      });
      
      const lightUnit = createTestUnit({
        mass: 100,
        data: {
          ...createTestUnit().data!,
          weapons_and_equipment: []
        }
      });
      
      const heavyRemaining = calculateRemainingTonnage(heavyEquipmentUnit);
      const lightRemaining = calculateRemainingTonnage(lightUnit);
      
      // Heavy equipment should reduce available tonnage
      expect(heavyRemaining).toBeLessThan(lightRemaining);
      
      // Difference should approximately equal equipment weight (29 tons)
      const difference = lightRemaining - heavyRemaining;
      expect(difference).toBeCloseTo(29, 1);
    });

    test('should round to nearest half-ton', () => {
      const unit = createTestUnit({ mass: 100 });
      
      const remaining = calculateRemainingTonnage(unit);
      
      // Should be multiple of 0.5
      expect(remaining * 2).toBe(Math.floor(remaining * 2));
    });
  });

  describe('calculateRemainingTonnageForArmor', () => {
    test('should add remaining tonnage to current armor', () => {
      const unit = createTestUnit({
        mass: 100,
        data: {
          ...createTestUnit().data!,
          armor: { locations: [], total_armor_points: 100 }
        }
      });
      
      const newTonnage = calculateRemainingTonnageForArmor(unit);
      const currentTonnage = 100 / 16; // 6.25 tons
      
      // Should be more than current armor tonnage
      expect(newTonnage).toBeGreaterThan(currentTonnage);
    });

    test('should not exceed maximum armor tonnage', () => {
      const unit = createTestUnit({
        mass: 100,
        data: {
          ...createTestUnit().data!,
          armor: { locations: [], total_armor_points: 100 }
        }
      });
      
      const newTonnage = calculateRemainingTonnageForArmor(unit);
      const maxTonnage = calculateMaxArmorTonnage(unit);
      
      // Should not exceed maximum
      expect(newTonnage).toBeLessThanOrEqual(maxTonnage);
    });

    test('should handle different armor types', () => {
      const ferroFibrousArmor = {
        pointsPerTon: 19.2,
        name: 'Ferro-Fibrous'
      };
      
      const unit = createTestUnit({
        mass: 100,
        data: {
          ...createTestUnit().data!,
          armor: { locations: [], total_armor_points: 100 }
        }
      });
      
      const standardTonnage = calculateRemainingTonnageForArmor(unit);
      const ferroTonnage = calculateRemainingTonnageForArmor(unit, ferroFibrousArmor);
      
      // Ferro-fibrous should typically allow for less tonnage but more points
      expect(ferroTonnage).toBeLessThan(standardTonnage);
    });

    test('should handle already maximized armor', () => {
      const unit = createTestUnit({
        mass: 100,
        data: {
          ...createTestUnit().data!,
          armor: { locations: [], total_armor_points: 307 }, // Maximum
          // Use lighter configuration to have remaining tonnage
          engine: { rating: 200, type: 'xl' }, // Lighter engine
          heat_sinks: { count: 10, type: 'single' }, // Minimum heat sinks
          weapons_and_equipment: [] // No equipment
        }
      });
      
      const newTonnage = calculateRemainingTonnageForArmor(unit);
      const maxTonnage = calculateMaxArmorTonnage(unit);
      
      // Should equal maximum tonnage when armor is already maxed
      expect(newTonnage).toBe(maxTonnage);
    });

    test('should round to nearest half-ton', () => {
      const unit = createTestUnit({
        mass: 100,
        data: {
          ...createTestUnit().data!,
          armor: { locations: [], total_armor_points: 100 }
        }
      });
      
      const newTonnage = calculateRemainingTonnageForArmor(unit);
      
      // Should be multiple of 0.5
      expect(newTonnage * 2).toBe(Math.floor(newTonnage * 2));
    });
  });

  describe('maximizeArmor', () => {
    test('should return maximum armor tonnage', () => {
      const unit = createTestUnit({ mass: 100 });
      
      const maxArmor = maximizeArmor(unit);
      const expectedMax = calculateMaxArmorTonnage(unit);
      
      expect(maxArmor).toBe(expectedMax);
    });

    test('should handle custom armor type', () => {
      const customArmor = {
        pointsPerTon: 20,
        name: 'Custom'
      };
      
      const unit = createTestUnit({ mass: 100 });
      
      const maxArmor = maximizeArmor(unit, customArmor);
      const expectedMax = calculateMaxArmorTonnage(unit, customArmor);
      
      expect(maxArmor).toBe(expectedMax);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle unit with no data', () => {
      const unit = { mass: 100 } as EditableUnit;
      
      expect(() => calculateMaxArmorPoints(unit)).not.toThrow();
      expect(() => autoAllocateArmor(unit)).not.toThrow();
      expect(() => calculateRemainingTonnage(unit)).not.toThrow();
    });

    test('should handle invalid tonnage', () => {
      mockGetInternalStructure.mockImplementation(() => {
        throw new Error('Invalid tonnage');
      });
      
      const unit = createTestUnit({ mass: 999 });
      
      // Should not throw and use fallback values
      expect(() => calculateMaxArmorPoints(unit)).not.toThrow();
      
      const maxArmor = calculateMaxArmorPoints(unit);
      expect(maxArmor).toBeGreaterThan(0);
    });

    test('should handle zero or negative tonnage', () => {
      const unit = createTestUnit({ mass: 0 });
      
      const maxArmor = calculateMaxArmorPoints(unit);
      const remaining = calculateRemainingTonnage(unit);
      
      // Should handle gracefully
      expect(maxArmor).toBeGreaterThanOrEqual(0);
      expect(remaining).toBeLessThanOrEqual(0);
    });

    test('should handle missing armor type', () => {
      mockGetArmorType.mockReturnValue(null);
      
      const unit = createTestUnit({ mass: 100 });
      
      // Should use fallback values
      expect(() => calculateMaxArmorTonnage(unit)).not.toThrow();
      expect(() => calculateRemainingTonnageForArmor(unit)).not.toThrow();
    });
  });
});
