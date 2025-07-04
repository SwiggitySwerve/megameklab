/**
 * PlacementCalculationService Tests
 * 
 * Comprehensive test suite for equipment placement calculation logic
 */

import { PlacementCalculationService, EquipmentPlacement } from '../../../services/equipment/PlacementCalculationService';
import { UnitConfiguration } from '../../../utils/criticalSlots/UnitCriticalManager';

describe('PlacementCalculationService', () => {
  let mockConfig: UnitConfiguration;
  let mockEquipment: any;
  let mockAllocations: EquipmentPlacement[];

  beforeEach(() => {
    mockConfig = {
      chassis: 'Griffin',
      model: 'GRF-1N',
      unitType: 'BattleMech',
      tonnage: 75,
      techBase: 'Inner Sphere',
      engineType: 'Fusion',
      engineRating: 300,
      walkMP: 4,
      runMP: 6,
      jumpMP: 0,
      heatSinkType: { type: 'Standard' } as any,
      armorType: { type: 'Standard' } as any,
      structureType: { type: 'Standard' } as any,
      internalStructure: {} as any,
      armorAllocation: {} as any,
      criticalSlots: {} as any,
      equipment: [] as any,
      role: 'Fire Support',
      bv: 1542,
      cost: 6000000
    } as any;

    mockEquipment = {
      equipmentData: {
        name: 'Medium Laser',
        type: 'energy_weapon',
        tonnage: 1,
        criticals: 1,
        heat: 3,
        damage: 5,
        techBase: 'Inner Sphere'
      }
    };

    mockAllocations = [];
  });

  describe('findOptimalPlacement', () => {
    it('should find valid placement for equipment', () => {
      const placements = PlacementCalculationService.findOptimalPlacement(
        mockEquipment, 
        mockConfig, 
        mockAllocations
      );

      expect(placements).toHaveLength(6); // Should find placements in most locations
      expect(placements[0]).toHaveProperty('location');
      expect(placements[0]).toHaveProperty('slots');
      expect(placements[0]).toHaveProperty('score');
    });

    it('should prefer torso locations for weapons', () => {
      const placements = PlacementCalculationService.findOptimalPlacement(
        mockEquipment, 
        mockConfig, 
        mockAllocations
      );

      const firstPlacement = placements[0];
      expect(['leftTorso', 'rightTorso', 'leftArm', 'rightArm']).toContain(firstPlacement.location);
    });

    it('should return empty array for invalid equipment', () => {
      const invalidEquipment = {
        equipmentData: {
          name: 'Invalid Equipment',
          tonnage: 200, // Too heavy
          criticals: 50 // Too many criticals
        }
      };

      const placements = PlacementCalculationService.findOptimalPlacement(
        invalidEquipment, 
        mockConfig, 
        mockAllocations
      );

      expect(placements).toHaveLength(0);
    });

    it('should avoid locations with existing allocations', () => {
      // Fill up left torso
      mockAllocations = [{
        equipmentId: 'existing-1',
        equipment: mockEquipment,
        location: 'leftTorso',
        slots: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        isFixed: false,
        isValid: true,
        constraints: {
          allowedLocations: ['leftTorso'],
          forbiddenLocations: [],
          requiresCASE: false,
          requiresArtemis: false,
          minTonnageLocation: 0,
          maxTonnageLocation: 100,
          heatGeneration: 0,
          specialRules: []
        },
        conflicts: []
      }];

      const placements = PlacementCalculationService.findOptimalPlacement(
        mockEquipment, 
        mockConfig, 
        mockAllocations
      );

      // Should not place in leftTorso since it's full
      const leftTorsoPlacement = placements.find(p => p.location === 'leftTorso');
      expect(leftTorsoPlacement).toBeUndefined();
    });
  });

  describe('calculatePlacementScore', () => {
    it('should calculate higher scores for better placements', () => {
      const weaponEquipment = {
        equipmentData: {
          name: 'AC/20',
          type: 'ballistic_weapon',
          tonnage: 14,
          criticals: 10,
          heat: 7,
          damage: 20
        }
      };

      const torsoScore = PlacementCalculationService.calculatePlacementScore(
        weaponEquipment, 'rightTorso', mockConfig, mockAllocations
      );

      const legScore = PlacementCalculationService.calculatePlacementScore(
        weaponEquipment, 'leftLeg', mockConfig, mockAllocations
      );

      expect(torsoScore).toBeGreaterThan(legScore);
    });

    it('should return 0 for invalid placements', () => {
      const heavyEquipment = {
        equipmentData: {
          name: 'Gauss Rifle',
          tonnage: 15,
          criticals: 7
        }
      };

      const headScore = PlacementCalculationService.calculatePlacementScore(
        heavyEquipment, 'head', mockConfig, mockAllocations
      );

      expect(headScore).toBe(0);
    });

    it('should consider protection factors', () => {
      const ammoEquipment = {
        equipmentData: {
          name: 'AC/20 Ammo',
          type: 'ammunition',
          tonnage: 1,
          criticals: 1,
          explosive: true
        }
      };

      const headScore = PlacementCalculationService.calculatePlacementScore(
        ammoEquipment, 'head', mockConfig, mockAllocations
      );

      const torsoScore = PlacementCalculationService.calculatePlacementScore(
        ammoEquipment, 'leftTorso', mockConfig, mockAllocations
      );

      expect(torsoScore).toBeGreaterThan(headScore);
    });
  });

  describe('getEquipmentConstraints', () => {
    it('should return proper constraints for energy weapons', () => {
      const constraints = PlacementCalculationService.getEquipmentConstraints(mockEquipment);

      expect(constraints.allowedLocations).toContain('leftArm');
      expect(constraints.allowedLocations).toContain('rightArm');
      expect(constraints.allowedLocations).toContain('leftTorso');
      expect(constraints.allowedLocations).toContain('rightTorso');
      expect(constraints.forbiddenLocations).not.toContain('leftArm');
    });

    it('should restrict ammunition from head', () => {
      const ammoEquipment = {
        equipmentData: {
          name: 'LRM Ammo',
          type: 'ammunition',
          explosive: true
        }
      };

      const constraints = PlacementCalculationService.getEquipmentConstraints(ammoEquipment);

      expect(constraints.forbiddenLocations).toContain('head');
    });

    it('should restrict engine to center torso', () => {
      const engineEquipment = {
        equipmentData: {
          name: 'Fusion Engine 300',
          type: 'engine'
        }
      };

      const constraints = PlacementCalculationService.getEquipmentConstraints(engineEquipment);

      expect(constraints.allowedLocations).toEqual(['centerTorso']);
    });

    it('should restrict gyro to center torso', () => {
      const gyroEquipment = {
        equipmentData: {
          name: 'Gyro',
          type: 'gyro'
        }
      };

      const constraints = PlacementCalculationService.getEquipmentConstraints(gyroEquipment);

      expect(constraints.allowedLocations).toEqual(['centerTorso']);
    });

    it('should limit head tonnage', () => {
      const heavyEquipment = {
        equipmentData: {
          name: 'Heavy Equipment',
          tonnage: 5
        }
      };

      const constraints = PlacementCalculationService.getEquipmentConstraints(heavyEquipment);

      expect(constraints.forbiddenLocations).toContain('head');
    });
  });

  describe('findAvailableSlots', () => {
    it('should find available slots in empty location', () => {
      const slots = PlacementCalculationService.findAvailableSlots(
        'leftArm', mockEquipment, mockAllocations, mockConfig
      );

      expect(slots).toHaveLength(12); // Full arm location
      expect(slots).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });

    it('should account for existing allocations', () => {
      mockAllocations = [{
        equipmentId: 'existing-1',
        equipment: mockEquipment,
        location: 'leftArm',
        slots: [1, 2, 3],
        isFixed: false,
        isValid: true,
        constraints: {
          allowedLocations: ['leftArm'],
          forbiddenLocations: [],
          requiresCASE: false,
          requiresArtemis: false,
          minTonnageLocation: 0,
          maxTonnageLocation: 100,
          heatGeneration: 0,
          specialRules: []
        },
        conflicts: []
      }];

      const slots = PlacementCalculationService.findAvailableSlots(
        'leftArm', mockEquipment, mockAllocations, mockConfig
      );

      expect(slots).toHaveLength(9); // 12 - 3 occupied slots
      expect(slots).toEqual([4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });

    it('should return empty array for invalid location', () => {
      const slots = PlacementCalculationService.findAvailableSlots(
        'invalidLocation', mockEquipment, mockAllocations, mockConfig
      );

      expect(slots).toHaveLength(0);
    });

    it('should handle head location correctly', () => {
      const slots = PlacementCalculationService.findAvailableSlots(
        'head', mockEquipment, mockAllocations, mockConfig
      );

      expect(slots).toHaveLength(6); // Head has 6 slots
    });
  });

  describe('calculatePlacementEfficiency', () => {
    it('should calculate efficiency for equipment placements', () => {
      const testAllocations: EquipmentPlacement[] = [
        {
          equipmentId: 'weapon-1',
          equipment: {
            equipmentData: {
              name: 'Medium Laser',
              type: 'energy_weapon',
              tonnage: 1,
              criticals: 1
            }
          },
          location: 'rightArm',
          slots: [1],
          isFixed: false,
          isValid: true,
          constraints: {
            allowedLocations: ['rightArm'],
            forbiddenLocations: [],
            requiresCASE: false,
            requiresArtemis: false,
            minTonnageLocation: 0,
            maxTonnageLocation: 100,
            heatGeneration: 3,
            specialRules: []
          },
          conflicts: []
        }
      ];

      const efficiency = PlacementCalculationService.calculatePlacementEfficiency(
        testAllocations, mockConfig
      );

      expect(efficiency).toBeGreaterThan(0);
      expect(efficiency).toBeLessThanOrEqual(100);
    });

    it('should return 100% for empty allocations', () => {
      const efficiency = PlacementCalculationService.calculatePlacementEfficiency(
        [], mockConfig
      );

      expect(efficiency).toBe(100);
    });
  });

  describe('sortEquipmentByPriority', () => {
    it('should sort equipment by priority', () => {
      const equipment = [
        {
          equipmentData: {
            name: 'Small Laser',
            tonnage: 0.5,
            damage: 3
          }
        },
        {
          equipmentData: {
            name: 'AC/20',
            tonnage: 14,
            damage: 20
          }
        },
        {
          equipmentData: {
            name: 'Medium Laser',
            tonnage: 1,
            damage: 5
          }
        }
      ];

      const sorted = PlacementCalculationService.sortEquipmentByPriority(equipment);

      expect(sorted[0].equipmentData.name).toBe('AC/20'); // Heaviest first
      expect(sorted[2].equipmentData.name).toBe('Small Laser'); // Lightest last
    });

    it('should handle equipment without data', () => {
      const equipment = [
        { equipmentData: null },
        { equipmentData: { name: 'Test', tonnage: 1 } }
      ];

      const sorted = PlacementCalculationService.sortEquipmentByPriority(equipment);

      expect(sorted).toHaveLength(2);
      expect(sorted[0].equipmentData?.name).toBe('Test');
    });
  });

  describe('equipment constraint testing', () => {
    it('should understand constraint patterns for different equipment types', () => {
      // Test various equipment constraint scenarios
      const weaponConstraints = PlacementCalculationService.getEquipmentConstraints(mockEquipment);
      expect(weaponConstraints.allowedLocations).toContain('leftArm');

      const ammoEquipment = {
        equipmentData: {
          name: 'LRM Ammo',
          type: 'ammunition',
          explosive: true
        }
      };
      const ammoConstraints = PlacementCalculationService.getEquipmentConstraints(ammoEquipment);
      expect(ammoConstraints.forbiddenLocations).toContain('head');
    });

    it('should handle placement scoring correctly', () => {
      const score = PlacementCalculationService.calculatePlacementScore(
        mockEquipment, 'rightArm', mockConfig, mockAllocations
      );
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle null/undefined equipment gracefully', () => {
      expect(() => {
        PlacementCalculationService.findOptimalPlacement(null as any, mockConfig, mockAllocations);
      }).not.toThrow();

      expect(() => {
        PlacementCalculationService.findOptimalPlacement(undefined as any, mockConfig, mockAllocations);
      }).not.toThrow();
    });

    it('should handle invalid configuration gracefully', () => {
      const invalidConfig = {} as UnitConfiguration;

      expect(() => {
        PlacementCalculationService.findOptimalPlacement(mockEquipment, invalidConfig, mockAllocations);
      }).not.toThrow();
    });

    it('should handle equipment with missing data', () => {
      const incompleteEquipment = {
        equipmentData: {
          name: 'Incomplete'
          // Missing tonnage, criticals, etc.
        }
      };

      const placements = PlacementCalculationService.findOptimalPlacement(
        incompleteEquipment, mockConfig, mockAllocations
      );

      expect(Array.isArray(placements)).toBe(true);
    });
  });
});
