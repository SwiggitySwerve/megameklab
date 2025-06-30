/**
 * Unit Validation - Engine Validation Tests
 * Tests focused on engine rating and type validation rules
 * Following Single Responsibility Principle - only tests engine validation
 */

import {
  validateEngineRating,
  ValidationError
} from '../../../utils/unitValidation';

describe('Unit Validation - Engine Validation', () => {
  describe('Standard Engine Rating Limits', () => {
    test('should accept valid engine ratings', () => {
      const validRatings = [10, 15, 20, 50, 100, 150, 200, 250, 300, 350, 400];
      
      validRatings.forEach(rating => {
        const result = validateEngineRating(rating, 'Fusion');
        expect(result).toBeNull();
      });
    });

    test('should enforce maximum rating of 400 for standard engines', () => {
      const result = validateEngineRating(405, 'Fusion');
      expect(result).toEqual({
        field: 'engine',
        message: 'Fusion engine rating cannot exceed 400',
        severity: 'error'
      });
    });

    test('should enforce minimum rating of 10', () => {
      const result = validateEngineRating(5, 'Fusion');
      expect(result).toEqual({
        field: 'engine',
        message: 'Engine rating must be at least 10',
        severity: 'error'
      });
    });

    test('should enforce rating divisibility by 5', () => {
      const invalidRatings = [11, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24];
      
      invalidRatings.forEach(rating => {
        const result = validateEngineRating(rating, 'Fusion');
        expect(result).toEqual({
          field: 'engine',
          message: 'Engine rating must be divisible by 5',
          severity: 'error'
        });
      });
    });

    test('should handle boundary cases for standard engines', () => {
      // Exactly at limits
      expect(validateEngineRating(10, 'Fusion')).toBeNull();
      expect(validateEngineRating(400, 'Fusion')).toBeNull();
      
      // Just outside limits
      expect(validateEngineRating(9, 'Fusion')).not.toBeNull();
      expect(validateEngineRating(401, 'Fusion')).not.toBeNull();
    });
  });

  describe('XXL Engine Rating Limits', () => {
    test('should accept valid XXL engine ratings up to 500', () => {
      const validRatings = [10, 50, 100, 200, 300, 400, 450, 500];
      
      validRatings.forEach(rating => {
        const result = validateEngineRating(rating, 'XXL');
        expect(result).toBeNull();
      });
    });

    test('should enforce maximum rating of 500 for XXL engines', () => {
      const result = validateEngineRating(505, 'XXL');
      expect(result).toEqual({
        field: 'engine',
        message: 'XXL engine rating cannot exceed 500',
        severity: 'error'
      });
    });

    test('should still enforce minimum rating of 10 for XXL', () => {
      const result = validateEngineRating(5, 'XXL');
      expect(result).toEqual({
        field: 'engine',
        message: 'Engine rating must be at least 10',
        severity: 'error'
      });
    });

    test('should still enforce divisibility by 5 for XXL', () => {
      const result = validateEngineRating(403, 'XXL');
      expect(result).toEqual({
        field: 'engine',
        message: 'Engine rating must be divisible by 5',
        severity: 'error'
      });
    });

    test('should handle XXL boundary cases', () => {
      // Exactly at limits
      expect(validateEngineRating(10, 'XXL')).toBeNull();
      expect(validateEngineRating(500, 'XXL')).toBeNull();
      
      // Just outside limits
      expect(validateEngineRating(9, 'XXL')).not.toBeNull();
      expect(validateEngineRating(501, 'XXL')).not.toBeNull();
    });

    test('should allow higher ratings for XXL than standard', () => {
      const xxlOnlyRatings = [405, 410, 415, 420, 450, 475, 500];
      
      xxlOnlyRatings.forEach(rating => {
        const standardResult = validateEngineRating(rating, 'Fusion');
        const xxlResult = validateEngineRating(rating, 'XXL');
        
        expect(standardResult).not.toBeNull(); // Should fail for standard
        expect(xxlResult).toBeNull(); // Should pass for XXL
      });
    });
  });

  describe('Alternative Engine Types', () => {
    test('should handle ICE engines with standard limits', () => {
      const validResult = validateEngineRating(200, 'ICE');
      const invalidResult = validateEngineRating(405, 'ICE');
      
      expect(validResult).toBeNull();
      expect(invalidResult).toEqual({
        field: 'engine',
        message: 'ICE engine rating cannot exceed 400',
        severity: 'error'
      });
    });

    test('should handle Fuel Cell engines with standard limits', () => {
      const validResult = validateEngineRating(150, 'Fuel Cell');
      const invalidResult = validateEngineRating(405, 'Fuel Cell');
      
      expect(validResult).toBeNull();
      expect(invalidResult).toEqual({
        field: 'engine',
        message: 'Fuel Cell engine rating cannot exceed 400',
        severity: 'error'
      });
    });

    test('should handle Light Fusion engines with standard limits', () => {
      const validResult = validateEngineRating(300, 'Light Fusion');
      const invalidResult = validateEngineRating(405, 'Light Fusion');
      
      expect(validResult).toBeNull();
      expect(invalidResult).toEqual({
        field: 'engine',
        message: 'Light Fusion engine rating cannot exceed 400',
        severity: 'error'
      });
    });

    test('should handle Compact Fusion engines with standard limits', () => {
      const validResult = validateEngineRating(250, 'Compact Fusion');
      const invalidResult = validateEngineRating(405, 'Compact Fusion');
      
      expect(validResult).toBeNull();
      expect(invalidResult).toEqual({
        field: 'engine',
        message: 'Compact Fusion engine rating cannot exceed 400',
        severity: 'error'
      });
    });

    test('should default to standard limits for unspecified engine type', () => {
      const validResult = validateEngineRating(300);
      const invalidResult = validateEngineRating(405);
      
      expect(validResult).toBeNull();
      expect(invalidResult).toEqual({
        field: 'engine',
        message: 'Fusion engine rating cannot exceed 400',
        severity: 'error'
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle zero rating', () => {
      const result = validateEngineRating(0, 'Fusion');
      expect(result).toEqual({
        field: 'engine',
        message: 'Engine rating must be at least 10',
        severity: 'error'
      });
    });

    test('should handle negative ratings', () => {
      const result = validateEngineRating(-50, 'Fusion');
      expect(result).toEqual({
        field: 'engine',
        message: 'Engine rating must be at least 10',
        severity: 'error'
      });
    });

    test('should handle decimal ratings', () => {
      const result = validateEngineRating(50.5, 'Fusion');
      expect(result).toEqual({
        field: 'engine',
        message: 'Engine rating must be divisible by 5',
        severity: 'error'
      });
    });

    test('should handle very large ratings', () => {
      const result = validateEngineRating(1000, 'Fusion');
      expect(result).toEqual({
        field: 'engine',
        message: 'Fusion engine rating cannot exceed 400',
        severity: 'error'
      });
    });

    test('should prioritize minimum over divisibility error', () => {
      const result = validateEngineRating(7, 'Fusion');
      expect(result).toEqual({
        field: 'engine',
        message: 'Engine rating must be at least 10',
        severity: 'error'
      });
    });

    test('should prioritize maximum over divisibility error', () => {
      const result = validateEngineRating(403, 'Fusion');
      expect(result).toEqual({
        field: 'engine',
        message: 'Fusion engine rating cannot exceed 400',
        severity: 'error'
      });
    });
  });

  describe('Common BattleTech Engine Ratings', () => {
    test('should validate typical light mech engine ratings', () => {
      const lightMechRatings = [60, 80, 100, 120, 140, 160, 180];
      
      lightMechRatings.forEach(rating => {
        expect(validateEngineRating(rating, 'Fusion')).toBeNull();
        expect(validateEngineRating(rating, 'Light Fusion')).toBeNull();
        expect(validateEngineRating(rating, 'XXL')).toBeNull();
      });
    });

    test('should validate typical medium mech engine ratings', () => {
      const mediumMechRatings = [160, 180, 200, 220, 240, 260, 280];
      
      mediumMechRatings.forEach(rating => {
        expect(validateEngineRating(rating, 'Fusion')).toBeNull();
        expect(validateEngineRating(rating, 'Light Fusion')).toBeNull();
        expect(validateEngineRating(rating, 'XXL')).toBeNull();
      });
    });

    test('should validate typical heavy mech engine ratings', () => {
      const heavyMechRatings = [240, 260, 280, 300, 320, 340, 360];
      
      heavyMechRatings.forEach(rating => {
        expect(validateEngineRating(rating, 'Fusion')).toBeNull();
        expect(validateEngineRating(rating, 'Light Fusion')).toBeNull();
        expect(validateEngineRating(rating, 'XXL')).toBeNull();
      });
    });

    test('should validate typical assault mech engine ratings', () => {
      const assaultMechRatings = [300, 320, 340, 360, 380, 400];
      
      assaultMechRatings.forEach(rating => {
        expect(validateEngineRating(rating, 'Fusion')).toBeNull();
        expect(validateEngineRating(rating, 'Light Fusion')).toBeNull();
        expect(validateEngineRating(rating, 'XXL')).toBeNull();
      });
    });

    test('should validate super-heavy mech engine ratings (XXL only)', () => {
      const superHeavyRatings = [420, 440, 460, 480, 500];
      
      superHeavyRatings.forEach(rating => {
        expect(validateEngineRating(rating, 'Fusion')).not.toBeNull();
        expect(validateEngineRating(rating, 'XXL')).toBeNull();
      });
    });
  });

  describe('Performance and Optimization', () => {
    test('should validate many ratings quickly', () => {
      const startTime = performance.now();
      
      for (let rating = 10; rating <= 400; rating += 5) {
        validateEngineRating(rating, 'Fusion');
        validateEngineRating(rating, 'XXL');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (less than 10ms)
      expect(duration).toBeLessThan(10);
    });

    test('should be deterministic across multiple calls', () => {
      const testCases = [
        { rating: 100, type: 'Fusion' },
        { rating: 405, type: 'Fusion' },
        { rating: 7, type: 'XXL' },
        { rating: 500, type: 'XXL' }
      ];
      
      testCases.forEach(({ rating, type }) => {
        const result1 = validateEngineRating(rating, type);
        const result2 = validateEngineRating(rating, type);
        expect(result1).toEqual(result2);
      });
    });
  });

  describe('Engine Type Case Sensitivity', () => {
    test('should handle different case variations', () => {
      const rating = 200;
      
      // Standard case variations
      expect(validateEngineRating(rating, 'fusion')).toEqual(
        validateEngineRating(rating, 'Fusion')
      );
      expect(validateEngineRating(rating, 'FUSION')).toEqual(
        validateEngineRating(rating, 'Fusion')
      );
      expect(validateEngineRating(rating, 'xxl')).toEqual(
        validateEngineRating(rating, 'XXL')
      );
    });

    test('should handle whitespace in engine types', () => {
      const rating = 200;
      
      expect(validateEngineRating(rating, ' Fusion ')).toEqual(
        validateEngineRating(rating, 'Fusion')
      );
      expect(validateEngineRating(rating, ' XXL ')).toEqual(
        validateEngineRating(rating, 'XXL')
      );
    });
  });

  describe('Return Value Structure', () => {
    test('should return null for valid engines', () => {
      const result = validateEngineRating(200, 'Fusion');
      expect(result).toBeNull();
    });

    test('should return proper ValidationError structure for invalid engines', () => {
      const result = validateEngineRating(405, 'Fusion');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('field');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('severity');
      
      expect(result!.field).toBe('engine');
      expect(typeof result!.message).toBe('string');
      expect(result!.severity).toBe('error');
    });

    test('should always use "error" severity for engine validation', () => {
      const testCases = [
        validateEngineRating(5, 'Fusion'),
        validateEngineRating(405, 'Fusion'),
        validateEngineRating(13, 'XXL'),
        validateEngineRating(505, 'XXL')
      ];
      
      testCases.forEach(result => {
        expect(result).not.toBeNull();
        expect(result!.severity).toBe('error');
      });
    });

    test('should always use "engine" field for engine validation', () => {
      const testCases = [
        validateEngineRating(5, 'Fusion'),
        validateEngineRating(405, 'Fusion'),
        validateEngineRating(13, 'XXL'),
        validateEngineRating(505, 'XXL')
      ];
      
      testCases.forEach(result => {
        expect(result).not.toBeNull();
        expect(result!.field).toBe('engine');
      });
    });
  });
});
