/**
 * Comprehensive Test Suite for Gyro Calculations
 * Tests all BattleTech gyro rules, weight calculations, slot requirements, and special properties
 */

import {
  calculateGyroWeight,
  getGyroSlots,
  validateGyroType,
  getGyroSpecialProperties,
  supportsTorsoMountedCockpit,
  getGyroLocation,
  getGyroCalculations,
  getMinimumEngineRating,
  GYRO_WEIGHT_MULTIPLIERS,
  GYRO_SLOT_REQUIREMENTS,
  GYRO_TECH_RESTRICTIONS,
  GYRO_SPECIAL_PROPERTIES
} from '../../utils/gyroCalculations';
import { GyroType } from '../../types/systemComponents';

describe('Gyro Calculations - BattleTech Rules', () => {

  // ===== GYRO WEIGHT CALCULATIONS =====
  
  describe('Gyro Weight Calculations', () => {
    
    describe('Standard Gyros', () => {
      it('should calculate correct weight for Standard gyros', () => {
        expect(calculateGyroWeight(100, 'Standard')).toBe(1); // 100 ÷ 100 = 1, × 1.0 = 1
        expect(calculateGyroWeight(200, 'Standard')).toBe(2); // 200 ÷ 100 = 2, × 1.0 = 2
        expect(calculateGyroWeight(250, 'Standard')).toBe(3); // 250 ÷ 100 = 2.5, rounded up to 3, × 1.0 = 3
        expect(calculateGyroWeight(300, 'Standard')).toBe(3); // 300 ÷ 100 = 3, × 1.0 = 3
        expect(calculateGyroWeight(400, 'Standard')).toBe(4); // 400 ÷ 100 = 4, × 1.0 = 4
      });

      it('should handle fractional engine ratings correctly', () => {
        expect(calculateGyroWeight(175, 'Standard')).toBe(2); // 175 ÷ 100 = 1.75, rounded up to 2
        expect(calculateGyroWeight(225, 'Standard')).toBe(3); // 225 ÷ 100 = 2.25, rounded up to 3
        expect(calculateGyroWeight(350, 'Standard')).toBe(4); // 350 ÷ 100 = 3.5, rounded up to 4
      });
    });

    describe('Compact Gyros', () => {
      it('should calculate Compact gyro weight as 150% of Standard', () => {
        expect(calculateGyroWeight(100, 'Compact')).toBe(1.5); // 1 × 1.5 = 1.5
        expect(calculateGyroWeight(200, 'Compact')).toBe(3.0); // 2 × 1.5 = 3.0
        expect(calculateGyroWeight(250, 'Compact')).toBe(4.5); // 3 × 1.5 = 4.5
        expect(calculateGyroWeight(300, 'Compact')).toBe(4.5); // 3 × 1.5 = 4.5
        expect(calculateGyroWeight(400, 'Compact')).toBe(6.0); // 4 × 1.5 = 6.0
      });
    });

    describe('Heavy-Duty Gyros', () => {
      it('should calculate Heavy-Duty gyro weight as 200% of Standard', () => {
        expect(calculateGyroWeight(100, 'Heavy-Duty')).toBe(2); // 1 × 2.0 = 2
        expect(calculateGyroWeight(200, 'Heavy-Duty')).toBe(4); // 2 × 2.0 = 4
        expect(calculateGyroWeight(250, 'Heavy-Duty')).toBe(6); // 3 × 2.0 = 6
        expect(calculateGyroWeight(300, 'Heavy-Duty')).toBe(6); // 3 × 2.0 = 6
        expect(calculateGyroWeight(400, 'Heavy-Duty')).toBe(8); // 4 × 2.0 = 8
      });
    });

    describe('XL Gyros', () => {
      it('should calculate XL gyro weight as 50% of Standard', () => {
        expect(calculateGyroWeight(100, 'XL')).toBe(0.5); // 1 × 0.5 = 0.5
        expect(calculateGyroWeight(200, 'XL')).toBe(1.0); // 2 × 0.5 = 1.0
        expect(calculateGyroWeight(250, 'XL')).toBe(1.5); // 3 × 0.5 = 1.5
        expect(calculateGyroWeight(300, 'XL')).toBe(1.5); // 3 × 0.5 = 1.5
        expect(calculateGyroWeight(400, 'XL')).toBe(2.0); // 4 × 0.5 = 2.0
      });
    });
  });

  // ===== GYRO SLOT CALCULATIONS =====
  
  describe('Gyro Slot Requirements', () => {
    
    it('should return correct slot requirements for each gyro type', () => {
      expect(getGyroSlots('Standard')).toBe(4);
      expect(getGyroSlots('Compact')).toBe(2);
      expect(getGyroSlots('Heavy-Duty')).toBe(4);
      expect(getGyroSlots('XL')).toBe(6);
    });

    it('should be consistent with GYRO_SLOT_REQUIREMENTS constant', () => {
      Object.entries(GYRO_SLOT_REQUIREMENTS).forEach(([gyroType, expectedSlots]) => {
        expect(getGyroSlots(gyroType as GyroType)).toBe(expectedSlots);
      });
    });
  });

  // ===== GYRO TYPE VALIDATION =====
  
  describe('Gyro Type Validation', () => {
    
    describe('Standard Gyros', () => {
      it('should be valid for all tech bases and rules levels', () => {
        expect(validateGyroType('Standard', 'Inner Sphere', 'Standard')).toBe(true);
        expect(validateGyroType('Standard', 'Clan', 'Standard')).toBe(true);
        expect(validateGyroType('Standard', 'Both', 'Standard')).toBe(true);
        expect(validateGyroType('Standard', 'Inner Sphere', 'Tournament')).toBe(true);
        expect(validateGyroType('Standard', 'Inner Sphere', 'Advanced')).toBe(true);
        expect(validateGyroType('Standard', 'Inner Sphere', 'Experimental')).toBe(true);
      });
    });

    describe('Compact Gyros', () => {
      it('should be valid for Both tech base and Advanced/Experimental rules', () => {
        expect(validateGyroType('Compact', 'Both', 'Advanced')).toBe(true);
        expect(validateGyroType('Compact', 'Both', 'Experimental')).toBe(true);
        
        // Should be invalid for Standard/Tournament rules
        expect(validateGyroType('Compact', 'Both', 'Standard')).toBe(false);
        expect(validateGyroType('Compact', 'Both', 'Tournament')).toBe(false);
        
        // Should be valid for specific tech bases (since Both is allowed)
        expect(validateGyroType('Compact', 'Inner Sphere', 'Advanced')).toBe(true);
        expect(validateGyroType('Compact', 'Clan', 'Advanced')).toBe(true);
      });
    });

    describe('Heavy-Duty Gyros', () => {
      it('should be valid for Both tech base and Tournament/Advanced/Experimental rules', () => {
        expect(validateGyroType('Heavy-Duty', 'Both', 'Tournament')).toBe(true);
        expect(validateGyroType('Heavy-Duty', 'Both', 'Advanced')).toBe(true);
        expect(validateGyroType('Heavy-Duty', 'Both', 'Experimental')).toBe(true);
        
        // Should be invalid for Standard rules
        expect(validateGyroType('Heavy-Duty', 'Both', 'Standard')).toBe(false);
        
        // Should be valid for specific tech bases (since Both is allowed)
        expect(validateGyroType('Heavy-Duty', 'Inner Sphere', 'Tournament')).toBe(true);
        expect(validateGyroType('Heavy-Duty', 'Clan', 'Tournament')).toBe(true);
      });
    });

    describe('XL Gyros', () => {
      it('should be valid for Both tech base and Advanced/Experimental rules', () => {
        expect(validateGyroType('XL', 'Both', 'Advanced')).toBe(true);
        expect(validateGyroType('XL', 'Both', 'Experimental')).toBe(true);
        
        // Should be invalid for Standard/Tournament rules
        expect(validateGyroType('XL', 'Both', 'Standard')).toBe(false);
        expect(validateGyroType('XL', 'Both', 'Tournament')).toBe(false);
        
        // Should be valid for specific tech bases (since Both is allowed)
        expect(validateGyroType('XL', 'Inner Sphere', 'Advanced')).toBe(true);
        expect(validateGyroType('XL', 'Clan', 'Advanced')).toBe(true);
      });
    });
  });

  // ===== GYRO SPECIAL PROPERTIES =====
  
  describe('Gyro Special Properties', () => {
    
    it('should return correct special properties for Standard gyros', () => {
      const properties = getGyroSpecialProperties('Standard');
      expect(properties).toEqual({});
    });

    it('should return correct special properties for Compact gyros', () => {
      const properties = getGyroSpecialProperties('Compact');
      expect(properties).toEqual({});
    });

    it('should return correct special properties for Heavy-Duty gyros', () => {
      const properties = getGyroSpecialProperties('Heavy-Duty');
      expect(properties).toEqual({
        hitPointsModifier: 2,
        pilotingModifier: -1
      });
    });

    it('should return correct special properties for XL gyros', () => {
      const properties = getGyroSpecialProperties('XL');
      expect(properties).toEqual({
        criticalHitPenalty: 1
      });
    });

    it('should be consistent with GYRO_SPECIAL_PROPERTIES constant', () => {
      Object.entries(GYRO_SPECIAL_PROPERTIES).forEach(([gyroType, expectedProperties]) => {
        expect(getGyroSpecialProperties(gyroType as GyroType)).toEqual(expectedProperties);
      });
    });
  });

  // ===== TORSO-MOUNTED COCKPIT SUPPORT =====
  
  describe('Torso-Mounted Cockpit Support', () => {
    
    it('should support torso-mounted cockpit for most gyro types', () => {
      expect(supportsTorsoMountedCockpit('Standard')).toBe(true);
      expect(supportsTorsoMountedCockpit('Compact')).toBe(true);
      expect(supportsTorsoMountedCockpit('Heavy-Duty')).toBe(true);
    });

    it('should not support torso-mounted cockpit for XL gyros', () => {
      expect(supportsTorsoMountedCockpit('XL')).toBe(false);
    });
  });

  // ===== GYRO LOCATION =====
  
  describe('Gyro Location', () => {
    
    it('should always return Center Torso as gyro location', () => {
      expect(getGyroLocation()).toBe('Center Torso');
    });
  });

  // ===== COMPREHENSIVE GYRO CALCULATIONS =====
  
  describe('Comprehensive Gyro Calculations', () => {
    
    it('should provide complete calculations for Standard gyros', () => {
      const result = getGyroCalculations(200, 'Standard');
      
      expect(result.weight).toBe(2);
      expect(result.slots).toBe(4);
      expect(result.isValid).toBe(true);
      expect(result.specialProperties).toEqual({});
    });

    it('should provide complete calculations for Compact gyros', () => {
      const result = getGyroCalculations(300, 'Compact');
      
      expect(result.weight).toBe(4.5); // 3 × 1.5 = 4.5
      expect(result.slots).toBe(2);
      expect(result.isValid).toBe(true);
      expect(result.specialProperties).toEqual({});
    });

    it('should provide complete calculations for Heavy-Duty gyros', () => {
      const result = getGyroCalculations(250, 'Heavy-Duty');
      
      expect(result.weight).toBe(6); // 3 × 2.0 = 6
      expect(result.slots).toBe(4);
      expect(result.isValid).toBe(true);
      expect(result.specialProperties).toEqual({
        hitPointsModifier: 2,
        pilotingModifier: -1
      });
    });

    it('should provide complete calculations for XL gyros', () => {
      const result = getGyroCalculations(400, 'XL');
      
      expect(result.weight).toBe(2.0); // 4 × 0.5 = 2.0
      expect(result.slots).toBe(6);
      expect(result.isValid).toBe(true);
      expect(result.specialProperties).toEqual({
        criticalHitPenalty: 1
      });
    });
  });

  // ===== MINIMUM ENGINE RATING =====
  
  describe('Minimum Engine Rating', () => {
    
    it('should return correct minimum engine rating for gyros', () => {
      expect(getMinimumEngineRating()).toBe(100);
    });

    it('should validate minimum engine rating with weight calculations', () => {
      const minRating = getMinimumEngineRating();
      
      // All gyro types should work with minimum rating
      expect(calculateGyroWeight(minRating, 'Standard')).toBe(1);
      expect(calculateGyroWeight(minRating, 'Compact')).toBe(1.5);
      expect(calculateGyroWeight(minRating, 'Heavy-Duty')).toBe(2);
      expect(calculateGyroWeight(minRating, 'XL')).toBe(0.5);
    });
  });

  // ===== EDGE CASES AND ERROR CONDITIONS =====
  
  describe('Edge Cases and Error Conditions', () => {
    
    it('should handle very low engine ratings', () => {
      expect(calculateGyroWeight(50, 'Standard')).toBe(1); // 50 ÷ 100 = 0.5, rounded up to 1
      expect(calculateGyroWeight(75, 'Standard')).toBe(1); // 75 ÷ 100 = 0.75, rounded up to 1
      expect(calculateGyroWeight(99, 'Standard')).toBe(1); // 99 ÷ 100 = 0.99, rounded up to 1
    });

    it('should handle maximum engine ratings', () => {
      expect(calculateGyroWeight(500, 'Standard')).toBe(5); // 500 ÷ 100 = 5
      expect(calculateGyroWeight(500, 'Compact')).toBe(7.5); // 5 × 1.5 = 7.5
      expect(calculateGyroWeight(500, 'Heavy-Duty')).toBe(10); // 5 × 2.0 = 10
      expect(calculateGyroWeight(500, 'XL')).toBe(2.5); // 5 × 0.5 = 2.5
    });

    it('should handle fractional weights correctly', () => {
      // Test cases that result in fractional weights
      expect(calculateGyroWeight(100, 'XL')).toBe(0.5);
      expect(calculateGyroWeight(100, 'Compact')).toBe(1.5);
      expect(calculateGyroWeight(200, 'Compact')).toBe(3.0);
      expect(calculateGyroWeight(250, 'XL')).toBe(1.5);
    });

    it('should validate all constants are properly defined', () => {
      const allGyroTypes: GyroType[] = ['Standard', 'Compact', 'Heavy-Duty', 'XL'];
      
      allGyroTypes.forEach(gyroType => {
        expect(GYRO_WEIGHT_MULTIPLIERS[gyroType]).toBeDefined();
        expect(GYRO_SLOT_REQUIREMENTS[gyroType]).toBeDefined();
        expect(GYRO_TECH_RESTRICTIONS[gyroType]).toBeDefined();
        expect(GYRO_SPECIAL_PROPERTIES[gyroType]).toBeDefined();
      });
    });
  });

  // ===== INTEGRATION TESTS =====
  
  describe('Integration Tests', () => {
    
    it('should validate complete gyro configurations for different engine ratings', () => {
      const testCases = [
        { engineRating: 100, gyroType: 'Standard' as GyroType, expectedWeight: 1, expectedSlots: 4 },
        { engineRating: 175, gyroType: 'Compact' as GyroType, expectedWeight: 3.0, expectedSlots: 2 },
        { engineRating: 250, gyroType: 'Heavy-Duty' as GyroType, expectedWeight: 6, expectedSlots: 4 },
        { engineRating: 300, gyroType: 'XL' as GyroType, expectedWeight: 1.5, expectedSlots: 6 },
        { engineRating: 400, gyroType: 'Standard' as GyroType, expectedWeight: 4, expectedSlots: 4 }
      ];

      testCases.forEach(({ engineRating, gyroType, expectedWeight, expectedSlots }) => {
        const calculations = getGyroCalculations(engineRating, gyroType);
        expect(calculations.weight).toBe(expectedWeight);
        expect(calculations.slots).toBe(expectedSlots);
        expect(calculations.isValid).toBe(true);
      });
    });

    it('should validate weight multipliers are correctly applied', () => {
      Object.entries(GYRO_WEIGHT_MULTIPLIERS).forEach(([gyroType, multiplier]) => {
        const baseWeight = Math.ceil(200 / 100); // 2 tons base for 200 rating
        const calculatedWeight = calculateGyroWeight(200, gyroType as GyroType);
        const expectedWeight = baseWeight * multiplier;
        expect(calculatedWeight).toBe(expectedWeight);
      });
    });

    it('should validate tech restrictions for common scenarios', () => {
      // Tournament legal combinations
      expect(validateGyroType('Standard', 'Inner Sphere', 'Tournament')).toBe(true);
      expect(validateGyroType('Heavy-Duty', 'Both', 'Tournament')).toBe(true);
      
      // Advanced combinations
      expect(validateGyroType('Compact', 'Both', 'Advanced')).toBe(true);
      expect(validateGyroType('XL', 'Both', 'Advanced')).toBe(true);
      
      // Invalid combinations
      expect(validateGyroType('Compact', 'Inner Sphere', 'Standard')).toBe(false);
      expect(validateGyroType('XL', 'Clan', 'Tournament')).toBe(false);
    });
  });

  // ===== CONSTANTS VALIDATION =====
  
  describe('Constants Validation', () => {
    
    it('should have correct gyro weight multipliers', () => {
      expect(GYRO_WEIGHT_MULTIPLIERS['Standard']).toBe(1.0);
      expect(GYRO_WEIGHT_MULTIPLIERS['Compact']).toBe(1.5);
      expect(GYRO_WEIGHT_MULTIPLIERS['Heavy-Duty']).toBe(2.0);
      expect(GYRO_WEIGHT_MULTIPLIERS['XL']).toBe(0.5);
    });

    it('should have correct gyro slot requirements', () => {
      expect(GYRO_SLOT_REQUIREMENTS['Standard']).toBe(4);
      expect(GYRO_SLOT_REQUIREMENTS['Compact']).toBe(2);
      expect(GYRO_SLOT_REQUIREMENTS['Heavy-Duty']).toBe(4);
      expect(GYRO_SLOT_REQUIREMENTS['XL']).toBe(6);
    });

    it('should have proper tech restrictions defined', () => {
      Object.values(GYRO_TECH_RESTRICTIONS).forEach(restriction => {
        expect(restriction.techBase).toBeDefined();
        expect(restriction.rulesLevel).toBeDefined();
        expect(Array.isArray(restriction.techBase)).toBe(true);
        expect(Array.isArray(restriction.rulesLevel)).toBe(true);
      });
    });

    it('should have special properties defined for all gyro types', () => {
      const allGyroTypes: GyroType[] = ['Standard', 'Compact', 'Heavy-Duty', 'XL'];
      
      allGyroTypes.forEach(gyroType => {
        expect(GYRO_SPECIAL_PROPERTIES[gyroType]).toBeDefined();
        expect(typeof GYRO_SPECIAL_PROPERTIES[gyroType]).toBe('object');
      });
    });
  });

  // ===== GAME MECHANICS VALIDATION =====
  
  describe('Game Mechanics Validation', () => {
    
    it('should validate Heavy-Duty gyro special abilities', () => {
      const properties = getGyroSpecialProperties('Heavy-Duty');
      
      // Heavy-Duty gyros can take 2 critical hits instead of 1
      expect(properties.hitPointsModifier).toBe(2);
      
      // Heavy-Duty gyros provide piloting bonus
      expect(properties.pilotingModifier).toBe(-1);
    });

    it('should validate XL gyro vulnerabilities', () => {
      const properties = getGyroSpecialProperties('XL');
      
      // XL gyros are more vulnerable to critical hits
      expect(properties.criticalHitPenalty).toBe(1);
    });

    it('should validate torso cockpit compatibility rules', () => {
      // Most gyros support torso cockpits
      expect(supportsTorsoMountedCockpit('Standard')).toBe(true);
      expect(supportsTorsoMountedCockpit('Compact')).toBe(true);
      expect(supportsTorsoMountedCockpit('Heavy-Duty')).toBe(true);
      
      // XL gyros don't support torso cockpits
      expect(supportsTorsoMountedCockpit('XL')).toBe(false);
    });

    it('should validate gyro location rules', () => {
      // All gyros must be in center torso
      expect(getGyroLocation()).toBe('Center Torso');
    });
  });
});
