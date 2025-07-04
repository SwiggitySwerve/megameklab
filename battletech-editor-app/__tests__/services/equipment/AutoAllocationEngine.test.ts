/**
 * AutoAllocationEngine Tests
 * 
 * Comprehensive test suite for automatic equipment allocation algorithms
 */

import { AutoAllocationEngine, AutoAllocationResult, WeaponAllocationResult, AmmoAllocationResult, HeatSinkAllocationResult, JumpJetAllocationResult } from '../../../services/equipment/AutoAllocationEngine';
import { UnitConfiguration } from '../../../utils/criticalSlots/UnitCriticalManager';

describe('AutoAllocationEngine', () => {
  let mockConfig: UnitConfiguration;
  let mockWeapons: any[];
  let mockAmmunition: any[];
  let mockHeatSinks: any[];
  let mockJumpJets: any[];

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
      jumpMP: 4,
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

    mockWeapons = [
      {
        equipmentData: {
          name: 'Medium Laser',
          type: 'energy_weapon',
          tonnage: 1,
          criticals: 1,
          heat: 3,
          damage: 5,
          techBase: 'Inner Sphere'
        }
      },
      {
        equipmentData: {
          name: 'AC/10',
          type: 'ballistic_weapon',
          tonnage: 12,
          criticals: 7,
          heat: 3,
          damage: 10,
          techBase: 'Inner Sphere'
        }
      }
    ];

    mockAmmunition = [
      {
        equipmentData: {
          name: 'AC/10 Ammo',
          type: 'ammunition',
          tonnage: 1,
          criticals: 1,
          explosive: true,
          weaponType: 'AC/10',
          techBase: 'Inner Sphere'
        }
      }
    ];

    mockHeatSinks = [
      {
        equipmentData: {
          name: 'Heat Sink',
          type: 'heat_sink',
          tonnage: 1,
          criticals: 1,
          cooling: 1,
          techBase: 'Inner Sphere'
        }
      },
      {
        equipmentData: {
          name: 'Heat Sink',
          type: 'heat_sink',
          tonnage: 1,
          criticals: 1,
          cooling: 1,
          techBase: 'Inner Sphere'
        }
      }
    ];

    mockJumpJets = [
      {
        equipmentData: {
          name: 'Jump Jet',
          type: 'jump_jet',
          tonnage: 1,
          criticals: 1,
          techBase: 'Inner Sphere'
        }
      },
      {
        equipmentData: {
          name: 'Jump Jet',
          type: 'jump_jet',
          tonnage: 1,
          criticals: 1,
          techBase: 'Inner Sphere'
        }
      },
      {
        equipmentData: {
          name: 'Jump Jet',
          type: 'jump_jet',
          tonnage: 1,
          criticals: 1,
          techBase: 'Inner Sphere'
        }
      },
      {
        equipmentData: {
          name: 'Jump Jet',
          type: 'jump_jet',
          tonnage: 1,
          criticals: 1,
          techBase: 'Inner Sphere'
        }
      }
    ];
  });

  describe('autoAllocateEquipment', () => {
    it('should successfully auto-allocate mixed equipment', () => {
      const equipment = [...mockWeapons, ...mockAmmunition, ...mockHeatSinks];
      
      const result: AutoAllocationResult = AutoAllocationEngine.autoAllocateEquipment(mockConfig, equipment);

      expect(result.success).toBe(true);
      expect(['balanced', 'front_loaded', 'distributed', 'concentrated']).toContain(result.strategy);
      expect(result.allocations).toHaveLength(equipment.length);
      expect(result.unallocated).toHaveLength(0);
      expect(result.metrics).toHaveProperty('successRate');
      expect(result.metrics).toHaveProperty('efficiencyScore');
      expect(result.metrics).toHaveProperty('balanceScore');
      expect(result.metrics).toHaveProperty('utilization');
      expect(result.improvements).toBeInstanceOf(Array);
      expect(result.warnings).toBeInstanceOf(Array);
    });

    it('should handle partial allocation when some equipment cannot be placed', () => {
      const oversizedEquipment = {
        equipmentData: {
          name: 'Oversized Equipment',
          tonnage: 200,
          criticals: 50
        }
      };
      const equipment = [...mockWeapons, oversizedEquipment];

      const result: AutoAllocationResult = AutoAllocationEngine.autoAllocateEquipment(mockConfig, equipment);

      expect(result.success).toBe(false);
      expect(result.allocations.length).toBeLessThan(equipment.length);
      expect(result.unallocated.length).toBeGreaterThan(0);
      expect(result.unallocated).toContain(oversizedEquipment);
    });

    it('should provide meaningful metrics and improvements', () => {
      const equipment = mockWeapons;
      
      const result: AutoAllocationResult = AutoAllocationEngine.autoAllocateEquipment(mockConfig, equipment);

      expect(result.metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(result.metrics.successRate).toBeLessThanOrEqual(100);
      expect(result.metrics.efficiencyScore).toBeGreaterThanOrEqual(0);
      expect(result.metrics.efficiencyScore).toBeLessThanOrEqual(100);
      expect(result.metrics.balanceScore).toBeGreaterThanOrEqual(0);
      expect(result.metrics.balanceScore).toBeLessThanOrEqual(100);
      expect(result.metrics.utilization).toBeGreaterThanOrEqual(0);
      expect(result.metrics.utilization).toBeLessThanOrEqual(100);
    });

    it('should handle empty equipment list', () => {
      const result: AutoAllocationResult = AutoAllocationEngine.autoAllocateEquipment(mockConfig, []);

      expect(result.success).toBe(true);
      expect(result.allocations).toHaveLength(0);
      expect(result.unallocated).toHaveLength(0);
      expect(result.metrics.successRate).toBe(100);
    });
  });

  describe('autoAllocateWeapons', () => {
    it('should allocate weapons with optimal strategy', () => {
      const result: WeaponAllocationResult = AutoAllocationEngine.autoAllocateWeapons(mockWeapons, mockConfig);

      expect(result.allocated).toHaveLength(mockWeapons.length);
      expect(result.unallocated).toHaveLength(0);
      expect(['balanced', 'front_loaded', 'distributed', 'concentrated']).toContain(result.strategy);
      expect(result.heatEfficiency).toBeGreaterThanOrEqual(0);
      expect(result.heatEfficiency).toBeLessThanOrEqual(100);
      expect(result.firepower).toHaveProperty('short');
      expect(result.firepower).toHaveProperty('medium');
      expect(result.firepower).toHaveProperty('long');
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    it('should prioritize larger weapons', () => {
      const smallWeapon = {
        equipmentData: {
          name: 'Small Laser',
          type: 'energy_weapon',
          tonnage: 0.5,
          criticals: 1,
          heat: 1,
          damage: 3
        }
      };

      const largeWeapon = {
        equipmentData: {
          name: 'Large Laser',
          type: 'energy_weapon',
          tonnage: 5,
          criticals: 2,
          heat: 8,
          damage: 8
        }
      };

      const weapons = [smallWeapon, largeWeapon];
      const result: WeaponAllocationResult = AutoAllocationEngine.autoAllocateWeapons(weapons, mockConfig);

      expect(result.allocated).toHaveLength(2);
      // Large weapon should be allocated to a preferred location first
      const largeWeaponAllocation = result.allocated.find(a => a.equipment.equipmentData.name === 'Large Laser');
      expect(largeWeaponAllocation).toBeDefined();
      expect(['leftTorso', 'rightTorso', 'leftArm', 'rightArm']).toContain(largeWeaponAllocation!.location);
    });

    it('should calculate heat efficiency correctly', () => {
      const highHeatWeapons = [
        {
          equipmentData: {
            name: 'PPC',
            type: 'energy_weapon',
            tonnage: 7,
            criticals: 3,
            heat: 10,
            damage: 10
          }
        }
      ];

      const result: WeaponAllocationResult = AutoAllocationEngine.autoAllocateWeapons(highHeatWeapons, mockConfig);

      expect(result.heatEfficiency).toBeLessThan(100); // High heat should reduce efficiency
    });

    it('should provide weapon recommendations', () => {
      const result: WeaponAllocationResult = AutoAllocationEngine.autoAllocateWeapons(mockWeapons, mockConfig);

      expect(result.recommendations).toBeInstanceOf(Array);
      // Should have recommendations if there are potential issues
      if (result.unallocated.length > 0) {
        expect(result.recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('autoAllocateAmmunition', () => {
    it('should allocate ammunition with CASE considerations', () => {
      const result: AmmoAllocationResult = AutoAllocationEngine.autoAllocateAmmunition(mockAmmunition, mockConfig);

      expect(result.allocated).toHaveLength(mockAmmunition.length);
      expect(result.unallocated).toHaveLength(0);
      expect(result.caseProtection).toHaveProperty('protected');
      expect(result.caseProtection).toHaveProperty('unprotected');
      expect(result.caseProtection).toHaveProperty('recommendations');
      expect(result.ammoBalance).toBeInstanceOf(Array);
      expect(result.suggestions).toBeInstanceOf(Array);
    });

    it('should analyze ammo balance per weapon type', () => {
      const multipleAmmo = [
        ...mockAmmunition,
        {
          equipmentData: {
            name: 'LRM Ammo',
            type: 'ammunition',
            tonnage: 1,
            criticals: 1,
            explosive: true,
            weaponType: 'LRM',
            techBase: 'Inner Sphere'
          }
        }
      ];

      const result: AmmoAllocationResult = AutoAllocationEngine.autoAllocateAmmunition(multipleAmmo, mockConfig);

      expect(result.ammoBalance).toHaveLength(2); // AC/10 and LRM
      result.ammoBalance.forEach(balance => {
        expect(balance).toHaveProperty('weapon');
        expect(balance).toHaveProperty('ammoTons');
        expect(balance).toHaveProperty('recommendedTons');
        expect(balance).toHaveProperty('turns');
        expect(balance).toHaveProperty('adequate');
      });
    });

    it('should provide CASE protection analysis', () => {
      const result: AmmoAllocationResult = AutoAllocationEngine.autoAllocateAmmunition(mockAmmunition, mockConfig);

      expect(result.caseProtection.protected).toBeInstanceOf(Array);
      expect(result.caseProtection.unprotected).toBeInstanceOf(Array);
      expect(result.caseProtection.recommendations).toBeInstanceOf(Array);
      
      // Since we don't have CASE in mock config, ammo should be unprotected
      expect(result.caseProtection.unprotected.length).toBeGreaterThan(0);
      expect(result.caseProtection.recommendations.length).toBeGreaterThan(0);
    });

    it('should suggest CASE for explosive ammunition', () => {
      const explosiveAmmo = [
        {
          equipmentData: {
            name: 'Explosive Ammo',
            type: 'ammunition',
            tonnage: 1,
            criticals: 1,
            explosive: true,
            weaponType: 'Test',
            techBase: 'Inner Sphere'
          }
        }
      ];

      const result: AmmoAllocationResult = AutoAllocationEngine.autoAllocateAmmunition(explosiveAmmo, mockConfig);

      expect(result.suggestions.some(s => s.includes('CASE'))).toBe(true);
    });
  });

  describe('autoAllocateHeatSinks', () => {
    it('should allocate heat sinks optimally', () => {
      const result: HeatSinkAllocationResult = AutoAllocationEngine.autoAllocateHeatSinks(mockHeatSinks, mockConfig);

      expect(result.allocated).toHaveLength(mockHeatSinks.length);
      expect(result.engineHeatSinks).toBeGreaterThanOrEqual(10); // Minimum engine heat sinks
      expect(result.externalHeatSinks).toBe(mockHeatSinks.length);
      expect(result.heatDissipation).toBeGreaterThan(0);
      expect(result.heatBalance).toHaveProperty('generation');
      expect(result.heatBalance).toHaveProperty('dissipation');
      expect(result.heatBalance).toHaveProperty('deficit');
      expect(result.optimization).toBeInstanceOf(Array);
    });

    it('should prefer leg locations for heat sinks', () => {
      const result: HeatSinkAllocationResult = AutoAllocationEngine.autoAllocateHeatSinks(mockHeatSinks, mockConfig);

      const legPlacements = result.allocated.filter(alloc => 
        alloc.location === 'leftLeg' || alloc.location === 'rightLeg'
      );
      
      // Should prefer legs when available
      expect(legPlacements.length).toBeGreaterThan(0);
    });

    it('should calculate heat balance correctly', () => {
      const result: HeatSinkAllocationResult = AutoAllocationEngine.autoAllocateHeatSinks(mockHeatSinks, mockConfig);

      expect(result.heatBalance.generation).toBeGreaterThanOrEqual(0);
      expect(result.heatBalance.dissipation).toBeGreaterThan(0);
      expect(result.heatBalance.deficit).toBeGreaterThanOrEqual(0);
      
      // Heat deficit should be generation - dissipation (when positive)
      const expectedDeficit = Math.max(0, result.heatBalance.generation - result.heatBalance.dissipation);
      expect(result.heatBalance.deficit).toBe(expectedDeficit);
    });

    it('should provide optimization recommendations', () => {
      const result: HeatSinkAllocationResult = AutoAllocationEngine.autoAllocateHeatSinks(mockHeatSinks, mockConfig);

      expect(result.optimization).toBeInstanceOf(Array);
      
      if (result.heatBalance.deficit > 0) {
        expect(result.optimization.some(opt => opt.includes('Add'))).toBe(true);
      }
    });
  });

  describe('autoAllocateJumpJets', () => {
    it('should allocate jump jets with optimal distribution', () => {
      const result: JumpJetAllocationResult = AutoAllocationEngine.autoAllocateJumpJets(mockJumpJets, mockConfig);

      expect(result.allocated).toHaveLength(mockJumpJets.length);
      expect(result.jumpMP).toBe(mockConfig.jumpMP);
      expect(result.distribution).toHaveProperty('centerTorso');
      expect(result.distribution).toHaveProperty('legs');
      expect(result.distribution).toHaveProperty('recommended');
      expect(result.validation).toHaveProperty('isValid');
      expect(result.validation).toHaveProperty('errors');
      expect(result.validation).toHaveProperty('warnings');
    });

    it('should follow BattleTech jump jet placement rules', () => {
      const result: JumpJetAllocationResult = AutoAllocationEngine.autoAllocateJumpJets(mockJumpJets, mockConfig);

      // Should place some in center torso and rest in legs
      expect(result.distribution.centerTorso).toBeGreaterThanOrEqual(0);
      expect(result.distribution.legs).toBeGreaterThanOrEqual(0);
      expect(result.distribution.centerTorso + result.distribution.legs).toBe(mockJumpJets.length);
      
      // Center torso should be limited (max 2 typically)
      expect(result.distribution.centerTorso).toBeLessThanOrEqual(2);
    });

    it('should validate jump jet limits', () => {
      const tooManyJumpJets = Array(10).fill({
        equipmentData: {
          name: 'Jump Jet',
          type: 'jump_jet',
          tonnage: 1,
          criticals: 1,
          techBase: 'Inner Sphere'
        }
      });

      const result: JumpJetAllocationResult = AutoAllocationEngine.autoAllocateJumpJets(tooManyJumpJets, mockConfig);

      // Should detect violation of jump jet limits
      expect(result.validation.isValid).toBe(false);
      expect(result.validation.errors.length).toBeGreaterThan(0);
      expect(result.validation.errors.some(e => e.includes('Too many'))).toBe(true);
    });

    it('should recommend balanced distribution', () => {
      const result: JumpJetAllocationResult = AutoAllocationEngine.autoAllocateJumpJets(mockJumpJets, mockConfig);

      // If all jump jets were placed successfully, distribution should be recommended
      if (result.allocated.length === mockJumpJets.length) {
        expect(result.distribution.recommended).toBe(true);
      }
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle null/undefined equipment gracefully', () => {
      expect(() => {
        AutoAllocationEngine.autoAllocateWeapons(null as any, mockConfig);
      }).not.toThrow();

      expect(() => {
        AutoAllocationEngine.autoAllocateAmmunition(undefined as any, mockConfig);
      }).not.toThrow();
    });

    it('should handle invalid configuration gracefully', () => {
      const invalidConfig = {} as UnitConfiguration;

      expect(() => {
        AutoAllocationEngine.autoAllocateHeatSinks(mockHeatSinks, invalidConfig);
      }).not.toThrow();
    });

    it('should handle equipment with missing data', () => {
      const incompleteEquipment = [
        {
          equipmentData: {
            name: 'Incomplete Equipment'
            // Missing other properties
          }
        }
      ];

      expect(() => {
        AutoAllocationEngine.autoAllocateEquipment(mockConfig, incompleteEquipment);
      }).not.toThrow();
    });

    it('should handle zero-weight equipment', () => {
      const zeroWeightEquipment = [
        {
          equipmentData: {
            name: 'Zero Weight',
            tonnage: 0,
            criticals: 1,
            type: 'equipment'
          }
        }
      ];

      const result: AutoAllocationResult = AutoAllocationEngine.autoAllocateEquipment(mockConfig, zeroWeightEquipment);

      expect(result.allocations).toHaveLength(1);
      expect(result.success).toBe(true);
    });
  });

  describe('strategy comparison', () => {
    it('should select best strategy based on equipment mix', () => {
      const mixedEquipment = [...mockWeapons, ...mockAmmunition, ...mockHeatSinks];
      
      const result: AutoAllocationResult = AutoAllocationEngine.autoAllocateEquipment(mockConfig, mixedEquipment);

      expect(['balanced', 'front_loaded', 'distributed', 'concentrated']).toContain(result.strategy);
      expect(result.metrics.successRate).toBeGreaterThan(0);
    });

    it('should handle different equipment priorities', () => {
      const criticalEquipment = [
        {
          equipmentData: {
            name: 'Engine',
            type: 'engine',
            tonnage: 19,
            criticals: 6
          }
        },
        {
          equipmentData: {
            name: 'Gyro',
            type: 'gyro',
            tonnage: 3,
            criticals: 4
          }
        }
      ];

      const result: AutoAllocationResult = AutoAllocationEngine.autoAllocateEquipment(mockConfig, criticalEquipment);

      // Critical equipment should be allocated successfully
      expect(result.allocations.length).toBe(2);
      
      // Engine should be in center torso
      const engineAllocation = result.allocations.find((a: any) => a.equipment.equipmentData.name === 'Engine');
      expect(engineAllocation?.location).toBe('centerTorso');
      
      // Gyro should be in center torso
      const gyroAllocation = result.allocations.find((a: any) => a.equipment.equipmentData.name === 'Gyro');
      expect(gyroAllocation?.location).toBe('centerTorso');
    });
  });
});
