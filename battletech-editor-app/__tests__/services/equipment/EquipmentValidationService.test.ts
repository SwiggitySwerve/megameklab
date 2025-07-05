/**
 * EquipmentValidationService Tests
 * 
 * Comprehensive test suite for equipment validation logic and BattleTech rules enforcement
 */

import { EquipmentValidationService } from '../../../../services/equipment/EquipmentValidationServiceRefactored';
import { ValidationResult } from '../../../../services/equipment/validation/EquipmentValidationTypes';
import { UnitConfiguration } from '../../../utils/criticalSlots/UnitCriticalManager';
import { EquipmentPlacement } from '../../../services/equipment/PlacementCalculationService';

describe('EquipmentValidationService', () => {
  let mockConfig: UnitConfiguration;
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

    mockAllocations = [
      {
        equipmentId: 'laser-1',
        equipment: {
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
        location: 'rightArm',
        slots: [1],
        isFixed: false,
        isValid: true,
        constraints: {
          allowedLocations: ['rightArm', 'leftArm', 'rightTorso', 'leftTorso'],
          forbiddenLocations: [],
          requiresCASE: false,
          requiresArtemis: false,
          minTonnageLocation: 0,
          maxTonnageLocation: 100,
          heatGeneration: 3,
          specialRules: []
        },
        conflicts: []
      },
      // Add 10 heat sinks
      ...Array.from({ length: 10 }, (_, i) => ({
        equipmentId: `heat-sink-${i+1}`,
        equipment: {
          equipmentData: {
            name: 'Heat Sink',
            type: 'heat_sink',
            tonnage: 1,
            criticals: 1,
            cooling: 1,
            techBase: 'Inner Sphere'
          }
        },
        location: i < 5 ? 'leftLeg' : 'rightLeg',
        slots: [i < 5 ? i + 1 : (i - 5) + 1],
        isFixed: false,
        isValid: true,
        constraints: {
          allowedLocations: ['leftLeg', 'rightLeg', 'leftTorso', 'rightTorso'],
          forbiddenLocations: [],
          requiresCASE: false,
          requiresArtemis: false,
          minTonnageLocation: 0,
          maxTonnageLocation: 100,
          heatGeneration: 0,
          specialRules: []
        },
        conflicts: []
      })),
      // Add required engine
      {
        equipmentId: 'engine-1',
        equipment: {
          equipmentData: {
            name: 'Fusion Engine',
            type: 'engine',
            tonnage: 19,
            criticals: 6,
            techBase: 'Inner Sphere'
          }
        },
        location: 'centerTorso',
        slots: [1, 2, 3, 4, 5, 6],
        isFixed: false,
        isValid: true,
        constraints: {
          allowedLocations: ['centerTorso'],
          forbiddenLocations: [],
          requiresCASE: false,
          requiresArtemis: false,
          minTonnageLocation: 0,
          maxTonnageLocation: 100,
          heatGeneration: 0,
          specialRules: []
        },
        conflicts: []
      },
      // Add required gyro
      {
        equipmentId: 'gyro-1',
        equipment: {
          equipmentData: {
            name: 'Standard Gyro',
            type: 'gyro',
            tonnage: 3,
            criticals: 4,
            techBase: 'Inner Sphere'
          }
        },
        location: 'centerTorso',
        slots: [7, 8, 9, 10],
        isFixed: false,
        isValid: true,
        constraints: {
          allowedLocations: ['centerTorso'],
          forbiddenLocations: [],
          requiresCASE: false,
          requiresArtemis: false,
          minTonnageLocation: 0,
          maxTonnageLocation: 100,
          heatGeneration: 0,
          specialRules: []
        },
        conflicts: []
      },
      // Add required cockpit
      {
        equipmentId: 'cockpit-1',
        equipment: {
          equipmentData: {
            name: 'Standard Cockpit',
            type: 'cockpit',
            tonnage: 1,
            criticals: 1,
            techBase: 'Inner Sphere'
          }
        },
        location: 'head',
        slots: [1],
        isFixed: false,
        isValid: true,
        constraints: {
          allowedLocations: ['head'],
          forbiddenLocations: [],
          requiresCASE: false,
          requiresArtemis: false,
          minTonnageLocation: 0,
          maxTonnageLocation: 100,
          heatGeneration: 0,
          specialRules: []
        },
        conflicts: []
      }
    ];
  });

  describe('validateEquipmentPlacement', () => {
    it('should validate valid equipment placement configuration', () => {
      const result: ValidationResult = EquipmentValidationService.validateEquipmentPlacement(mockConfig, mockAllocations);

      if (!result.isValid) {
        // eslint-disable-next-line no-console
        console.log('Validation errors:', result.errors);
      }
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toBeInstanceOf(Array);
      expect(result.compliance).toHaveProperty('battleTechRules');
      expect(result.compliance).toHaveProperty('techLevel');
      expect(result.compliance).toHaveProperty('mountingRules');
      expect(result.compliance).toHaveProperty('weightLimits');
      expect(result.suggestions).toBeInstanceOf(Array);
    });

    it('should detect weight violations', () => {
      const overweightAllocation: EquipmentPlacement = {
        equipmentId: 'massive-1',
        equipment: {
          equipmentData: {
            name: 'Massive Equipment',
            tonnage: 100, // Exceeds any location limit
            criticals: 1,
            techBase: 'Inner Sphere'
          }
        },
        location: 'head',
        slots: [1],
        isFixed: false,
        isValid: false,
        constraints: {
          allowedLocations: ['head'],
          forbiddenLocations: [],
          requiresCASE: false,
          requiresArtemis: false,
          minTonnageLocation: 0,
          maxTonnageLocation: 1,
          heatGeneration: 0,
          specialRules: []
        },
        conflicts: []
      };

      const result: ValidationResult = EquipmentValidationService.validateEquipmentPlacement(mockConfig, [overweightAllocation]);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('weight') || e.message.includes('tonnage'))).toBe(true);
    });

    it('should detect slot conflicts', () => {
      const conflictingAllocations: EquipmentPlacement[] = [
        {
          ...mockAllocations[0],
          equipmentId: 'laser-1',
          slots: [1, 2]
        },
        {
          ...mockAllocations[0],
          equipmentId: 'laser-2',
          slots: [2, 3] // Conflicts with slot 2
        }
      ];

      const result: ValidationResult = EquipmentValidationService.validateEquipmentPlacement(mockConfig, conflictingAllocations);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect tech base conflicts', () => {
      const clanAllocation: EquipmentPlacement = {
        equipmentId: 'clan-laser-1',
        equipment: {
          equipmentData: {
            name: 'Clan Laser',
            type: 'energy_weapon',
            tonnage: 1,
            criticals: 1,
            techBase: 'Clan'
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
      };

      const result: ValidationResult = EquipmentValidationService.validateEquipmentPlacement(mockConfig, [clanAllocation]);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateSinglePlacement', () => {
    it('should validate individual equipment placement', () => {
      const allocation = mockAllocations[0];
      const result = EquipmentValidationService.validateSinglePlacement(allocation, mockConfig, mockAllocations);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toBeInstanceOf(Array);
      expect(result.restrictions).toBeInstanceOf(Array);
      expect(result.suggestions).toBeInstanceOf(Array);
    });

    it('should detect invalid location placement', () => {
      const invalidAllocation: EquipmentPlacement = {
        equipmentId: 'engine-1',
        equipment: {
          equipmentData: {
            name: 'Engine',
            type: 'engine',
            tonnage: 19,
            criticals: 6
          }
        },
        location: 'rightArm', // Engines must be in center torso
        slots: [1, 2, 3, 4, 5, 6],
        isFixed: false,
        isValid: false,
        constraints: {
          allowedLocations: ['centerTorso'],
          forbiddenLocations: ['rightArm'],
          requiresCASE: false,
          requiresArtemis: false,
          minTonnageLocation: 0,
          maxTonnageLocation: 100,
          heatGeneration: 0,
          specialRules: []
        },
        conflicts: []
      };

      const result = EquipmentValidationService.validateSinglePlacement(invalidAllocation, mockConfig, [invalidAllocation]);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.type === 'rule_violation')).toBe(true);
    });

    it('should validate equipment constraints', () => {
      const constrainedAllocation: EquipmentPlacement = {
        equipmentId: 'ammo-1',
        equipment: {
          equipmentData: {
            name: 'AC/10 Ammo',
            type: 'ammunition',
            tonnage: 1,
            criticals: 1,
            explosive: true
          }
        },
        location: 'head', // Explosive ammo shouldn't be in head
        slots: [1],
        isFixed: false,
        isValid: false,
        constraints: {
          allowedLocations: ['leftTorso', 'rightTorso', 'leftLeg', 'rightLeg'],
          forbiddenLocations: ['head'],
          requiresCASE: true,
          requiresArtemis: false,
          minTonnageLocation: 0,
          maxTonnageLocation: 100,
          heatGeneration: 0,
          specialRules: []
        },
        conflicts: []
      };

      const result = EquipmentValidationService.validateSinglePlacement(constrainedAllocation, mockConfig, [constrainedAllocation]);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('checkBattleTechRules', () => {
    it('should validate BattleTech construction rules', () => {
      const result = EquipmentValidationService.checkBattleTechRules(mockConfig, mockAllocations);

      expect(result).toHaveProperty('compliant');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('techLevelIssues');
      expect(result).toHaveProperty('mountingIssues');
      expect(result).toHaveProperty('suggestions');
      expect(Array.isArray(result.violations)).toBe(true);
      expect(Array.isArray(result.techLevelIssues)).toBe(true);
      expect(Array.isArray(result.mountingIssues)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should detect engine rating violations', () => {
      const invalidConfig = {
        ...mockConfig,
        engineRating: 500 // Exceeds max of 400
      };

      const result = EquipmentValidationService.checkBattleTechRules(invalidConfig, mockAllocations);

      expect(result.compliant).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations.some(v => v.rule.includes('Engine Rating'))).toBe(true);
    });

    it('should detect missing required equipment', () => {
      const emptyAllocations: EquipmentPlacement[] = [];

      const result = EquipmentValidationService.checkBattleTechRules(mockConfig, emptyAllocations);

      expect(result.compliant).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations.some(v => v.description.toLowerCase().includes('engine'))).toBe(true);
      expect(result.violations.some(v => v.description.toLowerCase().includes('gyro'))).toBe(true);
      expect(result.violations.some(v => v.description.toLowerCase().includes('cockpit'))).toBe(true);
    });

    it('should validate jump jet limits', () => {
      const tooManyJumpJets: EquipmentPlacement[] = Array(15).fill(null).map((_, i) => ({
        equipmentId: `jumpjet-${i}`,
        equipment: {
          equipmentData: {
            name: 'Jump Jet',
            type: 'jump_jet',
            tonnage: 1,
            criticals: 1
          }
        },
        location: i < 2 ? 'centerTorso' : i < 8 ? 'leftLeg' : 'rightLeg',
        slots: [i % 6 + 1],
        isFixed: false,
        isValid: true,
        constraints: {
          allowedLocations: ['centerTorso', 'leftLeg', 'rightLeg'],
          forbiddenLocations: [],
          requiresCASE: false,
          requiresArtemis: false,
          minTonnageLocation: 0,
          maxTonnageLocation: 100,
          heatGeneration: 0,
          specialRules: []
        },
        conflicts: []
      }));

      const result = EquipmentValidationService.checkBattleTechRules(mockConfig, tooManyJumpJets);

      expect(result.compliant).toBe(false);
      expect(result.violations.some(v => v.rule.includes('Jump Jet'))).toBe(true);
    });
  });

  describe('validateTechLevel', () => {
    it('should validate tech level compliance for standard equipment', () => {
      const equipment = mockAllocations.map(a => a.equipment);
      const result = EquipmentValidationService.validateTechLevel(equipment, mockConfig);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.summary).toHaveProperty('innerSphere');
      expect(result.summary).toHaveProperty('clan');
      expect(result.summary).toHaveProperty('mixed');
      expect(result.summary).toHaveProperty('era');
      expect(result.summary).toHaveProperty('techLevel');
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    it('should detect tech base mismatches', () => {
      const clanEquipment = [
        {
          equipmentData: {
            name: 'Clan Laser',
            techBase: 'Clan',
            introduction: 3050
          }
        }
      ];

      const result = EquipmentValidationService.validateTechLevel(clanEquipment, mockConfig);

      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].equipment).toBe('Clan Laser');
      expect(result.issues[0].canBeResolved).toBe(false);
    });

    it('should detect era availability issues', () => {
      const futureEquipment = [
        {
          equipmentData: {
            name: 'Future Laser',
            techBase: 'Inner Sphere',
            introduction: 3100
          }
        }
      ];

      const configWithEra = { ...mockConfig, era: '3025' };
      const result = EquipmentValidationService.validateTechLevel(futureEquipment, configWithEra);

      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].canBeResolved).toBe(true);
    });

    it('should handle mixed tech configurations', () => {
      const mixedEquipment = [
        {
          equipmentData: {
            name: 'IS Laser',
            techBase: 'Inner Sphere'
          }
        },
        {
          equipmentData: {
            name: 'Clan Laser',
            techBase: 'Clan'
          }
        }
      ];

      const result = EquipmentValidationService.validateTechLevel(mixedEquipment, mockConfig);

      expect(result.summary.mixed).toBe(true);
      expect(result.summary.innerSphere).toBe(1);
      expect(result.summary.clan).toBe(1);
      expect(result.recommendations.some(r => r.includes('Mixed'))).toBe(true);
    });
  });

  describe('validateMountingRestrictions', () => {
    it('should validate proper mounting for weapons', () => {
      const weapon = {
        equipmentData: {
          name: 'Medium Laser',
          type: 'energy_weapon',
          tonnage: 1,
          criticals: 1
        }
      };

      const result = EquipmentValidationService.validateMountingRestrictions(weapon, 'rightArm', mockConfig);

      expect(result.canMount).toBe(true);
      expect(result.restrictions).toBeInstanceOf(Array);
      expect(result.requirements).toBeInstanceOf(Array);
      expect(result.alternatives).toBeInstanceOf(Array);
      expect(result.warnings).toBeInstanceOf(Array);
    });

    it('should detect ammunition mounting restrictions', () => {
      const explosiveAmmo = {
        equipmentData: {
          name: 'AC/20 Ammo',
          type: 'ammunition',
          tonnage: 1,
          criticals: 1,
          explosive: true
        }
      };

      const result = EquipmentValidationService.validateMountingRestrictions(explosiveAmmo, 'head', mockConfig);

      expect(result.canMount).toBe(false);
      expect(result.restrictions.some(r => r.type === 'ammunition')).toBe(true);
      expect(result.alternatives.length).toBeGreaterThan(0);
      expect(result.requirements.some(req => req.type === 'case')).toBe(true);
    });

    it('should validate weight restrictions', () => {
      const heavyEquipment = {
        equipmentData: {
          name: 'Heavy Equipment',
          tonnage: 5, // Exceeds head limit of 1 ton
          criticals: 2
        }
      };

      const result = EquipmentValidationService.validateMountingRestrictions(heavyEquipment, 'head', mockConfig);

      expect(result.canMount).toBe(false);
      expect(result.restrictions.some(r => r.type === 'tonnage')).toBe(true);
      expect(result.alternatives.length).toBeGreaterThan(0);
    });

    it('should provide warnings for vulnerable placements', () => {
      const weapon = {
        equipmentData: {
          name: 'PPC',
          type: 'energy_weapon',
          tonnage: 7,
          criticals: 3
        }
      };

      const result = EquipmentValidationService.validateMountingRestrictions(weapon, 'head', mockConfig);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('vulnerable'))).toBe(true);
    });
  });

  describe('generateValidationReport', () => {
    it('should generate comprehensive validation report', () => {
      const report = EquipmentValidationService.generateValidationReport(mockConfig, mockAllocations);

      expect(typeof report).toBe('string');
      expect(report).toContain('EQUIPMENT VALIDATION REPORT');
      expect(report).toContain('CONFIGURATION');
      expect(report).toContain('COMPLIANCE STATUS');
      expect(report).toContain('EQUIPMENT SUMMARY');
    });

    it('should indicate valid configuration in report', () => {
      const report = EquipmentValidationService.generateValidationReport(mockConfig, mockAllocations);

      expect(report).toContain('✅');
      expect(report).toContain('VALID');
    });

    it('should show errors in report for invalid configuration', () => {
      const invalidAllocation: EquipmentPlacement = {
        equipmentId: 'invalid-1',
        equipment: {
          equipmentData: {
            name: 'Invalid Equipment',
            tonnage: 200,
            criticals: 1
          }
        },
        location: 'head',
        slots: [1],
        isFixed: false,
        isValid: false,
        constraints: {
          allowedLocations: ['head'],
          forbiddenLocations: [],
          requiresCASE: false,
          requiresArtemis: false,
          minTonnageLocation: 0,
          maxTonnageLocation: 1,
          heatGeneration: 0,
          specialRules: []
        },
        conflicts: []
      };

      const report = EquipmentValidationService.generateValidationReport(mockConfig, [invalidAllocation]);

      expect(report).toContain('❌');
      expect(report).toContain('INVALID');
      expect(report).toContain('CRITICAL ERRORS');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty allocations gracefully', () => {
      expect(() => {
        EquipmentValidationService.validateEquipmentPlacement(mockConfig, []);
      }).not.toThrow();

      const result = EquipmentValidationService.validateEquipmentPlacement(mockConfig, []);
      expect(result.isValid).toBe(false); // Should fail due to missing required equipment
    });

    it('should handle invalid configuration gracefully', () => {
      const invalidConfig = {} as UnitConfiguration;

      expect(() => {
        EquipmentValidationService.validateEquipmentPlacement(invalidConfig, mockAllocations);
      }).not.toThrow();
    });

    it('should handle equipment with null equipmentData', () => {
      const invalidAllocation: EquipmentPlacement = {
        equipmentId: 'null-equipment',
        equipment: { equipmentData: null },
        location: 'rightArm',
        slots: [1],
        isFixed: false,
        isValid: false,
        constraints: {
          allowedLocations: [],
          forbiddenLocations: [],
          requiresCASE: false,
          requiresArtemis: false,
          minTonnageLocation: 0,
          maxTonnageLocation: 100,
          heatGeneration: 0,
          specialRules: []
        },
        conflicts: []
      };

      expect(() => {
        EquipmentValidationService.validateEquipmentPlacement(mockConfig, [invalidAllocation]);
      }).not.toThrow();
    });

    it('should handle invalid location gracefully', () => {
      const invalidLocationAllocation: EquipmentPlacement = {
        equipmentId: 'invalid-location',
        equipment: {
          equipmentData: {
            name: 'Test Equipment',
            tonnage: 1,
            criticals: 1
          }
        },
        location: 'invalidLocation',
        slots: [1],
        isFixed: false,
        isValid: false,
        constraints: {
          allowedLocations: ['invalidLocation'],
          forbiddenLocations: [],
          requiresCASE: false,
          requiresArtemis: false,
          minTonnageLocation: 0,
          maxTonnageLocation: 100,
          heatGeneration: 0,
          specialRules: []
        },
        conflicts: []
      };

      const result = EquipmentValidationService.validateSinglePlacement(invalidLocationAllocation, mockConfig, [invalidLocationAllocation]);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'location_invalid')).toBe(true);
    });
  });

  describe('performance considerations', () => {
    it('should handle large allocation lists efficiently', () => {
      const largeAllocationList: EquipmentPlacement[] = Array(100).fill(null).map((_, i) => ({
        equipmentId: `equipment-${i}`,
        equipment: {
          equipmentData: {
            name: `Equipment ${i}`,
            tonnage: 0.5,
            criticals: 1,
            type: 'equipment'
          }
        },
        location: i % 2 === 0 ? 'leftTorso' : 'rightTorso',
        slots: [i % 12 + 1],
        isFixed: false,
        isValid: true,
        constraints: {
          allowedLocations: ['leftTorso', 'rightTorso'],
          forbiddenLocations: [],
          requiresCASE: false,
          requiresArtemis: false,
          minTonnageLocation: 0,
          maxTonnageLocation: 100,
          heatGeneration: 0,
          specialRules: []
        },
        conflicts: []
      }));

      const startTime = Date.now();
      const result = EquipmentValidationService.validateEquipmentPlacement(mockConfig, largeAllocationList);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(result).toBeDefined();
    });

    it('should provide consistent validation results', () => {
      const allocation = mockAllocations[0];

      const result1 = EquipmentValidationService.validateSinglePlacement(allocation, mockConfig, mockAllocations);
      const result2 = EquipmentValidationService.validateSinglePlacement(allocation, mockConfig, mockAllocations);

      expect(result1.isValid).toBe(result2.isValid);
      expect(result1.errors.length).toBe(result2.errors.length);
      expect(result1.warnings.length).toBe(result2.warnings.length);
    });
  });
});
