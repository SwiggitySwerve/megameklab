/**
 * Tests for ValidationOrchestrationManager
 * Tests validation orchestration, workflow management, and reporting functionality.
 */

import { ValidationOrchestrationManager } from '../../../../services/validation/ValidationOrchestrationManagerRefactored';
import { ValidationOrchestrationResult } from '../../../../services/validation/orchestration/ValidationOrchestrationTypes';
import { UnitConfiguration } from '../../../utils/criticalSlots/UnitCriticalManager';
import { ComponentConfiguration } from '../../../types/componentConfiguration';

describe('ValidationOrchestrationManager', () => {
  let orchestrationManager: ValidationOrchestrationManager;
  let mockConfig: UnitConfiguration;
  let mockEquipment: any[];

  beforeEach(() => {
    orchestrationManager = new ValidationOrchestrationManager();
    
    // Create mock unit configuration
    mockConfig = {
      chassis: 'Atlas',
      model: 'AS7-D',
      tonnage: 100,
      unitType: 'BattleMech',
      techBase: 'Inner Sphere',
      walkMP: 3,
      engineRating: 300,
      runMP: 5,
      engineType: 'Standard',
      jumpMP: 0,
      jumpJetType: { type: 'Standard', techBase: 'Inner Sphere' } as ComponentConfiguration,
      jumpJetCounts: {},
      hasPartialWing: false,
      gyroType: { type: 'Standard', techBase: 'Inner Sphere' } as ComponentConfiguration,
      structureType: { type: 'Standard', techBase: 'Inner Sphere' } as ComponentConfiguration,
      armorType: { type: 'Standard', techBase: 'Inner Sphere' } as ComponentConfiguration,
      armorAllocation: {
        HD: { front: 9, rear: 0 },
        CT: { front: 31, rear: 10 },
        LT: { front: 21, rear: 7 },
        RT: { front: 21, rear: 7 },
        LA: { front: 15, rear: 5 },
        RA: { front: 15, rear: 5 },
        LL: { front: 21, rear: 7 },
        RL: { front: 21, rear: 7 }
      },
      armorTonnage: 19.5,
      heatSinkType: { type: 'Single', techBase: 'Inner Sphere' } as ComponentConfiguration,
      totalHeatSinks: 20,
      internalHeatSinks: 12,
      externalHeatSinks: 8,
      enhancements: [],
      mass: 100
    };

    // Create mock equipment
    mockEquipment = [
      {
        name: 'Medium Laser',
        type: 'weapon',
        weight: 1,
        heat: 3,
        criticalSlots: 1
      },
      {
        name: 'AC/20',
        type: 'weapon',
        weight: 14,
        heat: 7,
        damage: 20,
        criticalSlots: 10
      },
      {
        name: 'Single Heat Sink',
        type: 'heat_sink',
        weight: 1,
        heat: 0,
        criticalSlots: 1
      }
    ];
  });

  describe('Unit Validation', () => {
    test('should validate complete unit', () => {
      const result = orchestrationManager.validateUnit(mockConfig, mockEquipment);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('configuration');
      expect(result).toHaveProperty('loadout');
      expect(result).toHaveProperty('techLevel');
      expect(result).toHaveProperty('compliance');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('performanceMetrics');
      
      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    test('should handle valid unit configuration', () => {
      const validConfig = { ...mockConfig };
      const result = orchestrationManager.validateUnit(validConfig, mockEquipment);
      
      expect(result.isValid).toBeDefined();
      expect(result.overall).toBeDefined();
      expect(result.configuration).toBeDefined();
      expect(result.loadout).toBeDefined();
      expect(result.techLevel).toBeDefined();
    });

    test('should handle invalid unit configuration', () => {
      const invalidConfig = { ...mockConfig, tonnage: 150 }; // Overweight
      const result = orchestrationManager.validateUnit(invalidConfig, mockEquipment);
      
      expect(result.isValid).toBeDefined();
      expect(result.overall).toBeDefined();
      expect(result.configuration).toBeDefined();
      expect(result.loadout).toBeDefined();
      expect(result.techLevel).toBeDefined();
    });

    test('should generate performance metrics', () => {
      const result = orchestrationManager.validateUnit(mockConfig, mockEquipment);
      
      expect(result.performanceMetrics).toBeDefined();
      expect(result.performanceMetrics).toHaveProperty('totalValidationTime');
      expect(result.performanceMetrics).toHaveProperty('ruleValidationTimes');
      expect(result.performanceMetrics).toHaveProperty('componentValidationTimes');
      expect(result.performanceMetrics).toHaveProperty('performanceBottlenecks');
      expect(result.performanceMetrics).toHaveProperty('optimizationSuggestions');
      
      expect(typeof result.performanceMetrics.totalValidationTime).toBe('number');
      expect(Array.isArray(result.performanceMetrics.performanceBottlenecks)).toBe(true);
      expect(Array.isArray(result.performanceMetrics.optimizationSuggestions)).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    test('should validate unit configuration', () => {
      const result = orchestrationManager.validateConfiguration(mockConfig);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('weight');
      expect(result).toHaveProperty('heat');
      expect(result).toHaveProperty('movement');
      expect(result).toHaveProperty('armor');
      expect(result).toHaveProperty('structure');
      expect(result).toHaveProperty('engine');
      expect(result).toHaveProperty('gyro');
      expect(result).toHaveProperty('cockpit');
      expect(result).toHaveProperty('compatibility');
      
      expect(typeof result.isValid).toBe('boolean');
    });

    test('should validate weight limits', () => {
      const result = orchestrationManager.validateWeightLimits(mockConfig, mockEquipment);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('totalWeight');
      expect(result).toHaveProperty('maxWeight');
      expect(result).toHaveProperty('overweight');
      expect(result).toHaveProperty('underweight');
      expect(result).toHaveProperty('distribution');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('recommendations');
      
      expect(typeof result.isValid).toBe('boolean');
      expect(typeof result.totalWeight).toBe('number');
      expect(typeof result.maxWeight).toBe('number');
      expect(Array.isArray(result.violations)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    test('should validate heat management', () => {
      const result = orchestrationManager.validateHeatManagement(mockConfig, mockEquipment);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('heatGeneration');
      expect(result).toHaveProperty('heatDissipation');
      expect(result).toHaveProperty('heatDeficit');
      expect(result).toHaveProperty('minimumHeatSinks');
      expect(result).toHaveProperty('actualHeatSinks');
      expect(result).toHaveProperty('engineHeatSinks');
      expect(result).toHaveProperty('externalHeatSinks');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('recommendations');
      
      expect(typeof result.isValid).toBe('boolean');
      expect(typeof result.heatGeneration).toBe('number');
      expect(typeof result.heatDissipation).toBe('number');
      expect(Array.isArray(result.violations)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    test('should validate movement rules', () => {
      const result = orchestrationManager.validateMovementRules(mockConfig);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('walkMP');
      expect(result).toHaveProperty('runMP');
      expect(result).toHaveProperty('jumpMP');
      expect(result).toHaveProperty('engineRating');
      expect(result).toHaveProperty('tonnage');
      expect(result).toHaveProperty('engineType');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('recommendations');
      
      expect(typeof result.isValid).toBe('boolean');
      expect(typeof result.walkMP).toBe('number');
      expect(typeof result.runMP).toBe('number');
      expect(typeof result.jumpMP).toBe('number');
      expect(Array.isArray(result.violations)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('Equipment Loadout Validation', () => {
    test('should validate equipment loadout', () => {
      const result = orchestrationManager.validateEquipmentLoadout(mockEquipment, mockConfig);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('weapons');
      expect(result).toHaveProperty('ammunition');
      expect(result).toHaveProperty('jumpJets');
      expect(result).toHaveProperty('specialEquipment');
      expect(result).toHaveProperty('criticalSlots');
      expect(result).toHaveProperty('efficiency');
      
      expect(typeof result.isValid).toBe('boolean');
    });

    test('should validate weapon rules', () => {
      const result = orchestrationManager.validateWeaponRules(mockEquipment, mockConfig);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('weaponCount');
      expect(result).toHaveProperty('totalWeaponWeight');
      expect(result).toHaveProperty('heatGeneration');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('recommendations');
      
      expect(typeof result.isValid).toBe('boolean');
      expect(typeof result.weaponCount).toBe('number');
      expect(typeof result.totalWeaponWeight).toBe('number');
      expect(typeof result.heatGeneration).toBe('number');
      expect(Array.isArray(result.violations)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    test('should validate ammunition rules', () => {
      const result = orchestrationManager.validateAmmoRules(mockEquipment, mockConfig);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('totalAmmoWeight');
      expect(result).toHaveProperty('ammoBalance');
      expect(result).toHaveProperty('caseProtection');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('recommendations');
      
      expect(typeof result.isValid).toBe('boolean');
      expect(typeof result.totalAmmoWeight).toBe('number');
      expect(Array.isArray(result.ammoBalance)).toBe(true);
      expect(Array.isArray(result.violations)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    test('should validate jump jet rules', () => {
      const result = orchestrationManager.validateJumpJetRules(mockConfig, mockEquipment);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('jumpJetCount');
      expect(result).toHaveProperty('jumpMP');
      expect(result).toHaveProperty('maxJumpMP');
      expect(result).toHaveProperty('jumpJetWeight');
      expect(result).toHaveProperty('jumpJetType');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('recommendations');
      
      expect(typeof result.isValid).toBe('boolean');
      expect(typeof result.jumpJetCount).toBe('number');
      expect(typeof result.jumpMP).toBe('number');
      expect(Array.isArray(result.violations)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('Tech Level Validation', () => {
    test('should validate tech level', () => {
      const result = orchestrationManager.validateTechLevel(mockConfig, mockEquipment);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('unitTechLevel');
      expect(result).toHaveProperty('unitTechBase');
      expect(result).toHaveProperty('era');
      expect(result).toHaveProperty('mixedTech');
      expect(result).toHaveProperty('eraRestrictions');
      expect(result).toHaveProperty('availability');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('recommendations');
      
      expect(typeof result.isValid).toBe('boolean');
      expect(typeof result.unitTechLevel).toBe('string');
      expect(typeof result.unitTechBase).toBe('string');
      expect(Array.isArray(result.violations)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    test('should validate mixed tech', () => {
      const result = orchestrationManager.validateMixedTech(mockConfig, mockEquipment);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isMixed');
      expect(result).toHaveProperty('innerSphereComponents');
      expect(result).toHaveProperty('clanComponents');
      expect(result).toHaveProperty('allowedMixed');
      expect(result).toHaveProperty('violations');
      
      expect(typeof result.isMixed).toBe('boolean');
      expect(typeof result.innerSphereComponents).toBe('number');
      expect(typeof result.clanComponents).toBe('number');
      expect(typeof result.allowedMixed).toBe('boolean');
      expect(Array.isArray(result.violations)).toBe(true);
    });

    test('should validate era restrictions', () => {
      const result = orchestrationManager.validateEraRestrictions(mockConfig, mockEquipment);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('era');
      expect(result).toHaveProperty('invalidComponents');
      expect(result).toHaveProperty('recommendations');
      
      expect(typeof result.isValid).toBe('boolean');
      expect(typeof result.era).toBe('string');
      expect(Array.isArray(result.invalidComponents)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    test('should validate availability rating', () => {
      const result = orchestrationManager.validateAvailabilityRating(mockEquipment, mockConfig);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('overallRating');
      expect(result).toHaveProperty('componentRatings');
      expect(result).toHaveProperty('violations');
      
      expect(typeof result.isValid).toBe('boolean');
      expect(typeof result.overallRating).toBe('string');
      expect(Array.isArray(result.componentRatings)).toBe(true);
      expect(Array.isArray(result.violations)).toBe(true);
    });
  });

  describe('Compliance Reporting', () => {
    test('should generate compliance report', () => {
      const result = orchestrationManager.generateComplianceReport(mockConfig, mockEquipment);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('overallCompliance');
      expect(result).toHaveProperty('ruleCompliance');
      expect(result).toHaveProperty('violationSummary');
      expect(result).toHaveProperty('recommendationSummary');
      expect(result).toHaveProperty('complianceMetrics');
      
      expect(typeof result.overallCompliance).toBe('number');
      expect(result.overallCompliance).toBeGreaterThanOrEqual(0);
      expect(result.overallCompliance).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.ruleCompliance)).toBe(true);
    });

    test('should generate validation recommendations', () => {
      const configuration = orchestrationManager.validateConfiguration(mockConfig);
      const loadout = orchestrationManager.validateEquipmentLoadout(mockEquipment, mockConfig);
      const techLevel = orchestrationManager.validateTechLevel(mockConfig, mockEquipment);
      
      const recommendations = orchestrationManager.generateValidationRecommendations(
        configuration, loadout, techLevel
      );
      
      expect(Array.isArray(recommendations)).toBe(true);
      
      recommendations.forEach(recommendation => {
        expect(recommendation).toHaveProperty('type');
        expect(recommendation).toHaveProperty('priority');
        expect(recommendation).toHaveProperty('category');
        expect(recommendation).toHaveProperty('description');
        expect(recommendation).toHaveProperty('benefit');
        expect(recommendation).toHaveProperty('difficulty');
        expect(recommendation).toHaveProperty('estimatedImpact');
        
        expect(['fix', 'optimization', 'alternative', 'upgrade']).toContain(recommendation.type);
        expect(['high', 'medium', 'low']).toContain(recommendation.priority);
        expect(['easy', 'moderate', 'hard']).toContain(recommendation.difficulty);
        expect(typeof recommendation.estimatedImpact).toBe('number');
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty equipment array', () => {
      const result = orchestrationManager.validateUnit(mockConfig, []);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
      expect(result.overall).toBeDefined();
      expect(result.configuration).toBeDefined();
      expect(result.loadout).toBeDefined();
      expect(result.techLevel).toBeDefined();
    });

    test('should handle missing configuration properties', () => {
      const incompleteConfig = {
        tonnage: 100,
        engineRating: 300
      } as UnitConfiguration;
      
      const result = orchestrationManager.validateUnit(incompleteConfig, mockEquipment);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
      expect(result.overall).toBeDefined();
    });

    test('should handle extreme values', () => {
      const extremeConfig = {
        ...mockConfig,
        tonnage: 1, // Very small
        engineRating: 1 // Very small
      };
      
      const result = orchestrationManager.validateUnit(extremeConfig, mockEquipment);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
      expect(result.overall).toBeDefined();
    });
  });

  describe('Performance', () => {
    test('should handle large equipment arrays efficiently', () => {
      const largeEquipment = Array.from({ length: 100 }, (_, i) => ({
        name: `Equipment ${i}`,
        type: 'weapon',
        weight: 1,
        heat: 1,
        criticalSlots: 1
      }));
      
      const startTime = Date.now();
      const result = orchestrationManager.validateUnit(mockConfig, largeEquipment);
      const endTime = Date.now();
      
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    test('should handle complex configurations efficiently', () => {
      const complexConfig = {
        ...mockConfig,
        tonnage: 100,
        engineRating: 400,
        walkMP: 4,
        jumpMP: 4
      };
      
      const startTime = Date.now();
      const result = orchestrationManager.validateUnit(complexConfig, mockEquipment);
      const endTime = Date.now();
      
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
}); 