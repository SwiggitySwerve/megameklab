/**
 * Unit Validation - Tonnage and Critical Validation Tests
 * Tests focused on weight limits, heat sink requirements, and critical slot validation
 * Following Single Responsibility Principle - only tests tonnage/critical validations
 */

import {
  validateTotalTonnage,
  validateHeatSinks,
  validateCriticalSlots,
  ValidationError
} from '../../../utils/unitValidation';

describe('Unit Validation - Tonnage and Critical Validation', () => {
  describe('Total Tonnage Validation', () => {
    test('should accept tonnage within mech limits', () => {
      const testCases = [
        { used: 19.5, max: 20 },
        { used: 34.0, max: 35 },
        { used: 50.0, max: 55 },
        { used: 74.5, max: 75 },
        { used: 99.0, max: 100 }
      ];

      testCases.forEach(({ used, max }) => {
        expect(validateTotalTonnage(used, max)).toBeNull();
      });
    });

    test('should reject tonnage exceeding mech limits', () => {
      const result = validateTotalTonnage(21.0, 20);
      expect(result).toEqual({
        field: 'tonnage',
        message: 'Total weight (21.0t) exceeds mech tonnage (20t)',
        severity: 'error'
      });
    });

    test('should handle exact tonnage limits', () => {
      expect(validateTotalTonnage(20.0, 20)).toBeNull();
      expect(validateTotalTonnage(35.0, 35)).toBeNull();
      expect(validateTotalTonnage(55.0, 55)).toBeNull();
      expect(validateTotalTonnage(75.0, 75)).toBeNull();
      expect(validateTotalTonnage(100.0, 100)).toBeNull();
    });

    test('should handle fractional tonnage overages', () => {
      const result = validateTotalTonnage(20.1, 20);
      expect(result).toEqual({
        field: 'tonnage',
        message: 'Total weight (20.1t) exceeds mech tonnage (20t)',
        severity: 'error'
      });
    });

    test('should format decimal places correctly in error messages', () => {
      const testCases = [
        { used: 20.5, max: 20, expectedUsed: '20.5' },
        { used: 35.75, max: 35, expectedUsed: '35.8' }, // Rounded to 1 decimal
        { used: 100.123, max: 100, expectedUsed: '100.1' }
      ];

      testCases.forEach(({ used, max, expectedUsed }) => {
        const result = validateTotalTonnage(used, max);
        expect(result?.message).toContain(expectedUsed);
      });
    });

    test('should handle zero and negative tonnages', () => {
      expect(validateTotalTonnage(0, 20)).toBeNull();
      expect(validateTotalTonnage(-5, 20)).toBeNull(); // Negative used tonnage is technically valid
      expect(validateTotalTonnage(5, 0)).not.toBeNull(); // But exceeding 0 max is not
    });

    test('should validate common mech weight classes', () => {
      const weightClasses = [
        { name: 'Light', max: 35, validUsed: [20, 25, 30, 35], invalidUsed: [36, 40] },
        { name: 'Medium', max: 55, validUsed: [40, 45, 50, 55], invalidUsed: [56, 60] },
        { name: 'Heavy', max: 75, validUsed: [60, 65, 70, 75], invalidUsed: [76, 80] },
        { name: 'Assault', max: 100, validUsed: [80, 85, 90, 100], invalidUsed: [101, 110] }
      ];

      weightClasses.forEach(({ name, max, validUsed, invalidUsed }) => {
        validUsed.forEach(used => {
          expect(validateTotalTonnage(used, max)).toBeNull();
        });
        
        invalidUsed.forEach(used => {
          expect(validateTotalTonnage(used, max)).not.toBeNull();
        });
      });
    });
  });

  describe('Heat Sink Validation', () => {
    test('should enforce minimum heat sinks for Fusion engines', () => {
      const result = validateHeatSinks(5, 'Fusion');
      expect(result).toEqual({
        field: 'heat_sinks',
        message: 'Fusion engines require at least 10 heat sinks',
        severity: 'error'
      });
    });

    test('should accept valid heat sink counts for Fusion engines', () => {
      const validCounts = [10, 11, 12, 15, 20, 25, 30];
      validCounts.forEach(count => {
        expect(validateHeatSinks(count, 'Fusion')).toBeNull();
      });
    });

    test('should handle boundary case of exactly 10 heat sinks for Fusion', () => {
      expect(validateHeatSinks(10, 'Fusion')).toBeNull();
      expect(validateHeatSinks(9, 'Fusion')).not.toBeNull();
    });

    test('should allow zero heat sinks for ICE engines', () => {
      expect(validateHeatSinks(0, 'ICE')).toBeNull();
      expect(validateHeatSinks(5, 'ICE')).toBeNull();
      expect(validateHeatSinks(10, 'ICE')).toBeNull();
    });

    test('should allow zero heat sinks for Fuel Cell engines', () => {
      expect(validateHeatSinks(0, 'Fuel Cell')).toBeNull();
      expect(validateHeatSinks(3, 'Fuel Cell')).toBeNull();
      expect(validateHeatSinks(8, 'Fuel Cell')).toBeNull();
    });

    test('should require 10 heat sinks for standard Fusion variants', () => {
      const fusionTypes = ['Fusion', 'Light Fusion', 'Compact Fusion', 'XL'];
      
      fusionTypes.forEach(engineType => {
        expect(validateHeatSinks(10, engineType)).toBeNull();
        expect(validateHeatSinks(9, engineType)).not.toBeNull();
      });
    });

    test('should default to Fusion rules when engine type not specified', () => {
      expect(validateHeatSinks(10)).toBeNull();
      expect(validateHeatSinks(9)).not.toBeNull();
    });

    test('should handle edge case heat sink counts', () => {
      // Very high heat sink counts should be valid
      expect(validateHeatSinks(50, 'Fusion')).toBeNull();
      expect(validateHeatSinks(100, 'ICE')).toBeNull();
      
      // Negative heat sink counts should fail for all engine types
      expect(validateHeatSinks(-1, 'Fusion')).not.toBeNull();
      expect(validateHeatSinks(-1, 'ICE')).not.toBeNull(); // Negative heat sinks are invalid
    });

    test('should provide engine-specific error messages', () => {
      const testCases = [
        { count: 5, engine: 'Fusion', expectedMessage: 'Fusion engines require at least 10 heat sinks' },
        { count: 8, engine: 'Light Fusion', expectedMessage: 'Light Fusion engines require at least 10 heat sinks' },
        { count: 7, engine: 'XL', expectedMessage: 'XL engines require at least 10 heat sinks' }
      ];

      testCases.forEach(({ count, engine, expectedMessage }) => {
        const result = validateHeatSinks(count, engine);
        expect(result?.message).toBe(expectedMessage);
      });
    });
  });

  describe('Critical Slot Validation', () => {
    test('should accept critical slot usage within limits', () => {
      const testCases = [
        { used: 50, total: 78 },
        { used: 78, total: 78 },
        { used: 0, total: 78 },
        { used: 30, total: 50 },
        { used: 25, total: 40 }
      ];

      testCases.forEach(({ used, total }) => {
        expect(validateCriticalSlots(used, total)).toBeNull();
      });
    });

    test('should reject critical slot usage exceeding limits', () => {
      const result = validateCriticalSlots(80, 78);
      expect(result).toEqual({
        field: 'critical_slots',
        message: 'Used critical slots (80) exceed available slots (78)',
        severity: 'error'
      });
    });

    test('should handle exact critical slot limits', () => {
      expect(validateCriticalSlots(78, 78)).toBeNull(); // Standard mech
      expect(validateCriticalSlots(79, 78)).not.toBeNull();
    });

    test('should validate typical mech critical slot scenarios', () => {
      // Standard BattleMech has 78 critical slots total
      const standardMechSlots = 78;
      
      // Common usage scenarios
      expect(validateCriticalSlots(50, standardMechSlots)).toBeNull(); // Partially equipped
      expect(validateCriticalSlots(78, standardMechSlots)).toBeNull(); // Fully equipped
      expect(validateCriticalSlots(79, standardMechSlots)).not.toBeNull(); // Over-equipped
    });

    test('should handle zero critical slot scenarios', () => {
      expect(validateCriticalSlots(0, 78)).toBeNull(); // No equipment
      expect(validateCriticalSlots(0, 0)).toBeNull(); // No slots available (edge case)
      expect(validateCriticalSlots(1, 0)).not.toBeNull(); // Using slots when none available
    });

    test('should validate OmniMech critical slot variations', () => {
      // OmniMechs may have different slot distributions
      const omniMechConfigs = [
        { used: 40, total: 60 },
        { used: 35, total: 50 },
        { used: 25, total: 40 }
      ];

      omniMechConfigs.forEach(({ used, total }) => {
        expect(validateCriticalSlots(used, total)).toBeNull();
        expect(validateCriticalSlots(used + 1, total)).toBeNull(); // Within limit
        expect(validateCriticalSlots(total + 1, total)).not.toBeNull(); // Over limit
      });
    });

    test('should handle negative critical slot values', () => {
      expect(validateCriticalSlots(-1, 78)).toBeNull(); // Negative used slots (unusual but not invalid)
      expect(validateCriticalSlots(10, -1)).not.toBeNull(); // Negative total slots should fail
    });

    test('should provide detailed error messages', () => {
      const testCases = [
        { used: 80, total: 78, expectedUsed: '80', expectedTotal: '78' },
        { used: 100, total: 78, expectedUsed: '100', expectedTotal: '78' },
        { used: 50, total: 40, expectedUsed: '50', expectedTotal: '40' }
      ];

      testCases.forEach(({ used, total, expectedUsed, expectedTotal }) => {
        const result = validateCriticalSlots(used, total);
        expect(result?.message).toContain(expectedUsed);
        expect(result?.message).toContain(expectedTotal);
      });
    });
  });

  describe('Integration Scenarios', () => {
    test('should validate complete light mech configuration', () => {
      const lightMechConfig = {
        usedTonnage: 34.5,
        maxTonnage: 35,
        heatSinks: 10,
        engineType: 'Fusion',
        usedSlots: 45,
        totalSlots: 78
      };

      expect(validateTotalTonnage(lightMechConfig.usedTonnage, lightMechConfig.maxTonnage)).toBeNull();
      expect(validateHeatSinks(lightMechConfig.heatSinks, lightMechConfig.engineType)).toBeNull();
      expect(validateCriticalSlots(lightMechConfig.usedSlots, lightMechConfig.totalSlots)).toBeNull();
    });

    test('should validate complete assault mech configuration', () => {
      const assaultMechConfig = {
        usedTonnage: 99.5,
        maxTonnage: 100,
        heatSinks: 20,
        engineType: 'XL',
        usedSlots: 77,
        totalSlots: 78
      };

      expect(validateTotalTonnage(assaultMechConfig.usedTonnage, assaultMechConfig.maxTonnage)).toBeNull();
      expect(validateHeatSinks(assaultMechConfig.heatSinks, assaultMechConfig.engineType)).toBeNull();
      expect(validateCriticalSlots(assaultMechConfig.usedSlots, assaultMechConfig.totalSlots)).toBeNull();
    });

    test('should identify multiple validation failures', () => {
      const invalidConfig = {
        usedTonnage: 101,
        maxTonnage: 100,
        heatSinks: 5,
        engineType: 'Fusion',
        usedSlots: 80,
        totalSlots: 78
      };

      expect(validateTotalTonnage(invalidConfig.usedTonnage, invalidConfig.maxTonnage)).not.toBeNull();
      expect(validateHeatSinks(invalidConfig.heatSinks, invalidConfig.engineType)).not.toBeNull();
      expect(validateCriticalSlots(invalidConfig.usedSlots, invalidConfig.totalSlots)).not.toBeNull();
    });

    test('should validate ICE engine configurations', () => {
      const iceEngineConfig = {
        usedTonnage: 54.5,
        maxTonnage: 55,
        heatSinks: 0, // ICE engines don't require heat sinks
        engineType: 'ICE',
        usedSlots: 60,
        totalSlots: 78
      };

      expect(validateTotalTonnage(iceEngineConfig.usedTonnage, iceEngineConfig.maxTonnage)).toBeNull();
      expect(validateHeatSinks(iceEngineConfig.heatSinks, iceEngineConfig.engineType)).toBeNull();
      expect(validateCriticalSlots(iceEngineConfig.usedSlots, iceEngineConfig.totalSlots)).toBeNull();
    });
  });

  describe('Performance and Consistency', () => {
    test('should validate many configurations quickly', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        validateTotalTonnage(i % 100, 100);
        validateHeatSinks(i % 30, 'Fusion');
        validateCriticalSlots(i % 80, 78);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete quickly (less than 20ms for 3000 validations)
      expect(duration).toBeLessThan(20);
    });

    test('should be deterministic across multiple calls', () => {
      const testCases = [
        () => validateTotalTonnage(101, 100),
        () => validateHeatSinks(5, 'Fusion'),
        () => validateCriticalSlots(80, 78)
      ];

      testCases.forEach(testFunction => {
        const result1 = testFunction();
        const result2 = testFunction();
        expect(result1).toEqual(result2);
      });
    });

    test('should handle edge case combinations', () => {
      const edgeCases = [
        { tonnage: [0, 0], heatSinks: [0, 'ICE'], slots: [0, 0] },
        { tonnage: [100, 100], heatSinks: [50, 'Fusion'], slots: [78, 78] },
        { tonnage: [0.1, 100], heatSinks: [10, 'Light Fusion'], slots: [1, 78] }
      ];

      edgeCases.forEach(({ tonnage, heatSinks, slots }) => {
        expect(() => validateTotalTonnage(tonnage[0], tonnage[1])).not.toThrow();
        expect(() => validateHeatSinks(heatSinks[0] as number, heatSinks[1] as string)).not.toThrow();
        expect(() => validateCriticalSlots(slots[0], slots[1])).not.toThrow();
      });
    });
  });

  describe('Return Value Structure Consistency', () => {
    test('should return consistent ValidationError structures', () => {
      const errors = [
        validateTotalTonnage(101, 100),
        validateHeatSinks(5, 'Fusion'),
        validateCriticalSlots(80, 78)
      ];

      errors.forEach(error => {
        expect(error).toBeDefined();
        expect(error).toHaveProperty('field');
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('severity');
        expect(error!.severity).toBe('error');
        expect(typeof error!.field).toBe('string');
        expect(typeof error!.message).toBe('string');
      });
    });

    test('should use appropriate field names', () => {
      const tonnageError = validateTotalTonnage(101, 100);
      const heatSinkError = validateHeatSinks(5, 'Fusion');
      const slotError = validateCriticalSlots(80, 78);

      expect(tonnageError?.field).toBe('tonnage');
      expect(heatSinkError?.field).toBe('heat_sinks');
      expect(slotError?.field).toBe('critical_slots');
    });

    test('should return null for valid configurations', () => {
      expect(validateTotalTonnage(99, 100)).toBeNull();
      expect(validateHeatSinks(15, 'Fusion')).toBeNull();
      expect(validateCriticalSlots(70, 78)).toBeNull();
    });
  });

  describe('Boundary Value Analysis', () => {
    test('should test tonnage boundaries precisely', () => {
      const boundaries = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
      
      boundaries.forEach(max => {
        expect(validateTotalTonnage(max, max)).toBeNull(); // Exactly at limit
        expect(validateTotalTonnage(max - 0.1, max)).toBeNull(); // Just under
        expect(validateTotalTonnage(max + 0.1, max)).not.toBeNull(); // Just over
      });
    });

    test('should test heat sink boundaries', () => {
      // Fusion engine minimum boundary
      expect(validateHeatSinks(9, 'Fusion')).not.toBeNull();
      expect(validateHeatSinks(10, 'Fusion')).toBeNull();
      
      // ICE engine boundary (minimum 0)
      expect(validateHeatSinks(-1, 'ICE')).not.toBeNull(); // Negative is invalid
      expect(validateHeatSinks(0, 'ICE')).toBeNull();
      expect(validateHeatSinks(1, 'ICE')).toBeNull();
    });

    test('should test critical slot boundaries', () => {
      const standardSlots = 78;
      
      expect(validateCriticalSlots(standardSlots - 1, standardSlots)).toBeNull();
      expect(validateCriticalSlots(standardSlots, standardSlots)).toBeNull();
      expect(validateCriticalSlots(standardSlots + 1, standardSlots)).not.toBeNull();
    });
  });
});
