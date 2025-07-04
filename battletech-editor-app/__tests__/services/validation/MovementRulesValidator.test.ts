/**
 * MovementRulesValidator Test Suite
 * Tests for BattleTech movement validation rules
 */

import { MovementRulesValidator } from '../../../services/validation/MovementRulesValidator';
import type { UnitConfiguration } from '../../../utils/criticalSlots/UnitCriticalManager';

// Helper function to create test unit configuration
function createTestConfig(overrides: Partial<UnitConfiguration> = {}): UnitConfiguration {
  return {
    tonnage: 65,
    engineRating: 260,
    engineType: 'Standard',
    structureType: { type: 'Standard', techBase: 'Inner Sphere' },
    armorType: { type: 'Standard', techBase: 'Inner Sphere' },
    gyroType: { type: 'Standard', techBase: 'Inner Sphere' },
    heatSinkType: { type: 'Single', techBase: 'Inner Sphere' },
    techBase: 'Inner Sphere',
    ...overrides
  } as UnitConfiguration;
}

describe('MovementRulesValidator', () => {
  describe('validateMovementRules', () => {
    test('should validate standard movement configuration', () => {
      const config = createTestConfig({
        tonnage: 65,
        engineRating: 260, // 4/6/0 movement for 65 tons
        engineType: 'Standard'
      });
      
      const result = MovementRulesValidator.validateMovementRules(config);
      
      expect(result.isValid).toBe(true);
      expect(result.walkMP).toBe(4);
      expect(result.runMP).toBe(6);
      expect(result.jumpMP).toBe(0);
      expect(result.violations).toHaveLength(0);
    });

    test('should detect invalid engine rating for tonnage', () => {
      const config = createTestConfig({
        tonnage: 65,
        engineRating: 100, // Too small for effective movement
        engineType: 'Standard'
      });
      
      const result = MovementRulesValidator.validateMovementRules(config);
      
      expect(result.walkMP).toBe(1); // Very slow movement
      expect(result.recommendations).toContain(
        expect.stringContaining('low mobility')
      );
    });

    test('should validate XL Engine weight reduction', () => {
      const standardConfig = createTestConfig({
        tonnage: 80,
        engineRating: 320,
        engineType: 'Standard'
      });
      
      const xlConfig = createTestConfig({
        tonnage: 80,
        engineRating: 320,
        engineType: 'XL'
      });
      
      const standardResult = MovementRulesValidator.validateMovementRules(standardConfig);
      const xlResult = MovementRulesValidator.validateMovementRules(xlConfig);
      
      expect(standardResult.walkMP).toBe(xlResult.walkMP); // Same movement
      expect(xlResult.recommendations).toContain(
        expect.stringContaining('vulnerability')
      );
    });

    test('should handle maximum engine ratings', () => {
      const config = createTestConfig({
        tonnage: 100,
        engineRating: 400, // High performance
        engineType: 'Standard'
      });
      
      const result = MovementRulesValidator.validateMovementRules(config);
      
      expect(result.walkMP).toBe(4);
      expect(result.runMP).toBe(6);
      expect(result.isValid).toBe(true);
    });

    test('should validate Light Engine characteristics', () => {
      const config = createTestConfig({
        tonnage: 55,
        engineRating: 275,
        engineType: 'Light'
      });
      
      const result = MovementRulesValidator.validateMovementRules(config);
      
      expect(result.walkMP).toBe(5);
      expect(result.runMP).toBe(8);
      expect(result.recommendations).toContain(
        expect.stringContaining('weight savings')
      );
    });

    test('should handle zero engine rating', () => {
      const config = createTestConfig({
        tonnage: 50,
        engineRating: 0,
        engineType: 'Standard'
      });
      
      const result = MovementRulesValidator.validateMovementRules(config);
      
      expect(result.isValid).toBe(false);
      expect(result.walkMP).toBe(0);
      expect(result.violations.some(v => v.type === 'invalid_engine_rating')).toBe(true);
    });
  });

  describe('calculateMovementPoints', () => {
    test('should calculate movement points correctly', () => {
      const testCases = [
        { tonnage: 20, rating: 120, expectedWalk: 6 },
        { tonnage: 35, rating: 175, expectedWalk: 5 },
        { tonnage: 55, rating: 275, expectedWalk: 5 },
        { tonnage: 75, rating: 300, expectedWalk: 4 },
        { tonnage: 100, rating: 300, expectedWalk: 3 }
      ];
      
      testCases.forEach(({ tonnage, rating, expectedWalk }) => {
        const walkMP = MovementRulesValidator.calculateWalkMP(rating, tonnage);
        expect(walkMP).toBe(expectedWalk);
        
        const runMP = MovementRulesValidator.calculateRunMP(walkMP);
        expect(runMP).toBe(Math.min(walkMP * 1.5, walkMP + 2));
      });
    });

    test('should handle fractional movement correctly', () => {
      const config = createTestConfig({
        tonnage: 70,
        engineRating: 280 // Results in 4 walk MP
      });
      
      const walkMP = MovementRulesValidator.calculateWalkMP(280, 70);
      const runMP = MovementRulesValidator.calculateRunMP(walkMP);
      
      expect(walkMP).toBe(4);
      expect(runMP).toBe(6); // 4 * 1.5 = 6
    });
  });

  describe('validateJumpJets', () => {
    test('should validate jump jet maximum limits', () => {
      const config = createTestConfig({
        tonnage: 65,
        engineRating: 260
      });
      
      const equipment = [
        { equipmentData: { type: 'jump_jet', tonnage: 2, criticals: 1 } },
        { equipmentData: { type: 'jump_jet', tonnage: 2, criticals: 1 } },
        { equipmentData: { type: 'jump_jet', tonnage: 2, criticals: 1 } },
        { equipmentData: { type: 'jump_jet', tonnage: 2, criticals: 1 } }
      ];
      
      const result = MovementRulesValidator.validateJumpJets(config, equipment);
      
      expect(result.jumpJetCount).toBe(4);
      expect(result.jumpMP).toBe(4);
      expect(result.isValid).toBe(true); // 4 JJ <= 4 walk MP
    });

    test('should detect excessive jump jets', () => {
      const config = createTestConfig({
        tonnage: 65,
        engineRating: 195 // Only 3 walk MP
      });
      
      const equipment = [
        { equipmentData: { type: 'jump_jet', tonnage: 2, criticals: 1 } },
        { equipmentData: { type: 'jump_jet', tonnage: 2, criticals: 1 } },
        { equipmentData: { type: 'jump_jet', tonnage: 2, criticals: 1 } },
        { equipmentData: { type: 'jump_jet', tonnage: 2, criticals: 1 } },
        { equipmentData: { type: 'jump_jet', tonnage: 2, criticals: 1 } } // 5 JJ > 3 walk MP
      ];
      
      const result = MovementRulesValidator.validateJumpJets(config, equipment);
      
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.type === 'exceeds_maximum')).toBe(true);
    });

    test('should validate different jump jet types', () => {
      const config = createTestConfig({ tonnage: 55 });
      
      const standardJJ = [
        { equipmentData: { type: 'jump_jet', name: 'Jump Jet', tonnage: 2 } }
      ];
      
      const improvedJJ = [
        { equipmentData: { type: 'jump_jet', name: 'Improved Jump Jet', tonnage: 2 } }
      ];
      
      const standardResult = MovementRulesValidator.validateJumpJets(config, standardJJ);
      const improvedResult = MovementRulesValidator.validateJumpJets(config, improvedJJ);
      
      expect(standardResult.isValid).toBe(true);
      expect(improvedResult.isValid).toBe(true);
    });
  });

  describe('validateEngineType', () => {
    test('should validate Standard engine characteristics', () => {
      const result = MovementRulesValidator.validateEngineType('Standard', 260, 65);
      
      expect(result.isValid).toBe(true);
      expect(result.advantages).toContain('Reliable and durable');
      expect(result.disadvantages).toContain('Heavy weight');
    });

    test('should validate XL engine with warnings', () => {
      const result = MovementRulesValidator.validateEngineType('XL', 260, 65);
      
      expect(result.isValid).toBe(true);
      expect(result.advantages).toContain('50% weight reduction');
      expect(result.disadvantages).toContain('Vulnerable to side torso damage');
    });

    test('should validate Compact engine limitations', () => {
      const result = MovementRulesValidator.validateEngineType('Compact', 100, 30);
      
      expect(result.isValid).toBe(true);
      expect(result.disadvantages).toContain('No heat sink integration');
      expect(result.disadvantages).toContain('Increased weight');
    });

    test('should reject invalid engine types', () => {
      const result = MovementRulesValidator.validateEngineType('InvalidEngine', 260, 65);
      
      expect(result.isValid).toBe(false);
      expect(result.violations).toContain(
        expect.stringContaining('Invalid engine type')
      );
    });
  });

  describe('calculateEngineWeight', () => {
    test('should calculate standard engine weights correctly', () => {
      const testCases = [
        { rating: 100, type: 'Standard', expectedWeight: 3 },
        { rating: 200, type: 'Standard', expectedWeight: 8.5 },
        { rating: 300, type: 'Standard', expectedWeight: 19 },
        { rating: 400, type: 'Standard', expectedWeight: 38.5 }
      ];
      
      testCases.forEach(({ rating, type, expectedWeight }) => {
        const weight = MovementRulesValidator.calculateEngineWeight(rating, type);
        expect(weight).toBeCloseTo(expectedWeight, 1);
      });
    });

    test('should apply XL engine weight reduction', () => {
      const standardWeight = MovementRulesValidator.calculateEngineWeight(260, 'Standard');
      const xlWeight = MovementRulesValidator.calculateEngineWeight(260, 'XL');
      
      expect(xlWeight).toBeCloseTo(standardWeight * 0.5, 1);
    });

    test('should handle Light engine weights', () => {
      const standardWeight = MovementRulesValidator.calculateEngineWeight(200, 'Standard');
      const lightWeight = MovementRulesValidator.calculateEngineWeight(200, 'Light');
      
      expect(lightWeight).toBeCloseTo(standardWeight * 0.75, 1);
    });
  });

  describe('Performance Analysis', () => {
    test('should analyze movement efficiency', () => {
      const fastConfig = createTestConfig({
        tonnage: 30,
        engineRating: 210 // 7/11/0 movement
      });
      
      const slowConfig = createTestConfig({
        tonnage: 100,
        engineRating: 200 // 2/3/0 movement
      });
      
      const fastResult = MovementRulesValidator.validateMovementRules(fastConfig);
      const slowResult = MovementRulesValidator.validateMovementRules(slowConfig);
      
      expect(fastResult.walkMP).toBeGreaterThan(slowResult.walkMP);
      expect(slowResult.recommendations).toContain(
        expect.stringContaining('low mobility')
      );
    });

    test('should recommend optimal engine ratings', () => {
      const config = createTestConfig({
        tonnage: 55,
        engineRating: 165 // Only 3 walk MP
      });
      
      const result = MovementRulesValidator.validateMovementRules(config);
      
      expect(result.recommendations).toContain(
        expect.stringContaining('Consider increasing engine rating')
      );
    });

    test('should validate movement vs tonnage ratios', () => {
      const lightMech = createTestConfig({
        tonnage: 25,
        engineRating: 150 // 6 walk MP
      });
      
      const assaultMech = createTestConfig({
        tonnage: 100,
        engineRating: 300 // 3 walk MP
      });
      
      const lightResult = MovementRulesValidator.validateMovementRules(lightMech);
      const assaultResult = MovementRulesValidator.validateMovementRules(assaultMech);
      
      expect(lightResult.walkMP).toBeGreaterThan(assaultResult.walkMP);
      // Light mechs should have better mobility
      expect(lightResult.walkMP / lightMech.tonnage).toBeGreaterThan(
        assaultResult.walkMP / assaultMech.tonnage
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle missing engine configuration', () => {
      const config = createTestConfig({
        engineRating: undefined,
        engineType: undefined
      });
      
      const result = MovementRulesValidator.validateMovementRules(config);
      
      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    test('should handle extreme tonnage values', () => {
      const veryLight = createTestConfig({
        tonnage: 10,
        engineRating: 60
      });
      
      const veryHeavy = createTestConfig({
        tonnage: 200,
        engineRating: 400
      });
      
      const lightResult = MovementRulesValidator.validateMovementRules(veryLight);
      const heavyResult = MovementRulesValidator.validateMovementRules(veryHeavy);
      
      expect(lightResult.isValid).toBe(true);
      expect(heavyResult.isValid).toBe(true);
    });

    test('should validate performance efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        const config = createTestConfig({
          tonnage: 50 + i % 50,
          engineRating: 200 + i % 200
        });
        MovementRulesValidator.validateMovementRules(config);
      }
      
      const end = performance.now();
      const totalTime = end - start;
      
      expect(totalTime).toBeLessThan(50); // Should complete 100 validations quickly
    });
  });
});