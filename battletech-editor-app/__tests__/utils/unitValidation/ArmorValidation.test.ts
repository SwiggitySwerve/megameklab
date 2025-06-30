/**
 * Unit Validation - Armor Validation Tests
 * Tests focused on armor point allocation and limit validation rules
 * Following Single Responsibility Principle - only tests armor validation
 */

import {
  validateArmorPoints,
  ValidationError
} from '../../../utils/unitValidation';

describe('Unit Validation - Armor Validation', () => {
  describe('Standard Armor Point Validation', () => {
    test('should accept valid armor allocations within limits', () => {
      const testCases = [
        { location: 'Head', armor: 9, max: 9 },
        { location: 'Center Torso', armor: 47, max: 47 },
        { location: 'Left Torso', armor: 32, max: 32 },
        { location: 'Right Torso', armor: 32, max: 32 },
        { location: 'Left Arm', armor: 24, max: 24 },
        { location: 'Right Arm', armor: 24, max: 24 },
        { location: 'Left Leg', armor: 32, max: 32 },
        { location: 'Right Leg', armor: 32, max: 32 }
      ];

      testCases.forEach(({ location, armor, max }) => {
        const result = validateArmorPoints(location, armor, max);
        expect(result).toBeNull();
      });
    });

    test('should reject armor exceeding maximum for location', () => {
      const result = validateArmorPoints('Head', 10, 9);
      expect(result).toEqual({
        field: 'armor_Head',
        message: 'Head armor cannot exceed 9 points',
        severity: 'error'
      });
    });

    test('should reject negative armor values', () => {
      const result = validateArmorPoints('Center Torso', -5, 47);
      expect(result).toEqual({
        field: 'armor_Center Torso',
        message: 'Center Torso armor cannot be negative',
        severity: 'error'
      });
    });

    test('should accept zero armor values', () => {
      const result = validateArmorPoints('Left Arm', 0, 24);
      expect(result).toBeNull();
    });

    test('should handle exact maximum values', () => {
      const locations = [
        { name: 'Head', max: 9 },
        { name: 'Center Torso', max: 47 },
        { name: 'Left Torso', max: 32 },
        { name: 'Left Arm', max: 24 }
      ];

      locations.forEach(({ name, max }) => {
        expect(validateArmorPoints(name, max, max)).toBeNull();
        expect(validateArmorPoints(name, max + 1, max)).not.toBeNull();
      });
    });
  });

  describe('Rear Armor Validation', () => {
    test('should accept valid rear armor allocations', () => {
      const rearArmorCases = [
        { location: 'Center Torso', armor: 14, max: 14 },
        { location: 'Left Torso', armor: 10, max: 10 },
        { location: 'Right Torso', armor: 10, max: 10 }
      ];

      rearArmorCases.forEach(({ location, armor, max }) => {
        const result = validateArmorPoints(location, armor, max, true);
        expect(result).toBeNull();
      });
    });

    test('should reject rear armor exceeding maximum', () => {
      const result = validateArmorPoints('Center Torso', 15, 14, true);
      expect(result).toEqual({
        field: 'armor_Center Torso_rear',
        message: 'Center Torso rear armor cannot exceed 14 points',
        severity: 'error'
      });
    });

    test('should reject negative rear armor values', () => {
      const result = validateArmorPoints('Left Torso', -3, 10, true);
      expect(result).toEqual({
        field: 'armor_Left Torso_rear',
        message: 'Left Torso rear armor cannot be negative',
        severity: 'error'
      });
    });

    test('should use correct field naming for rear armor', () => {
      const result = validateArmorPoints('Right Torso', 15, 10, true);
      expect(result?.field).toBe('armor_Right Torso_rear');
      expect(result?.message).toContain('Right Torso rear armor');
    });

    test('should differentiate between front and rear armor in field names', () => {
      const frontResult = validateArmorPoints('Center Torso', 50, 47, false);
      const rearResult = validateArmorPoints('Center Torso', 20, 14, true);

      expect(frontResult?.field).toBe('armor_Center Torso');
      expect(rearResult?.field).toBe('armor_Center Torso_rear');
    });
  });

  describe('Location-Specific Armor Limits', () => {
    test('should validate head armor with maximum of 9', () => {
      // Valid head armor
      for (let armor = 0; armor <= 9; armor++) {
        expect(validateArmorPoints('Head', armor, 9)).toBeNull();
      }

      // Invalid head armor
      expect(validateArmorPoints('Head', 10, 9)).not.toBeNull();
      expect(validateArmorPoints('Head', 12, 9)).not.toBeNull();
    });

    test('should validate center torso with typical maximums', () => {
      // Standard 75-ton mech center torso
      expect(validateArmorPoints('Center Torso', 47, 47)).toBeNull();
      expect(validateArmorPoints('Center Torso', 48, 47)).not.toBeNull();

      // Light mech center torso
      expect(validateArmorPoints('Center Torso', 31, 31)).toBeNull();
      expect(validateArmorPoints('Center Torso', 32, 31)).not.toBeNull();
    });

    test('should validate side torso armor limits', () => {
      // Heavy mech side torsos
      expect(validateArmorPoints('Left Torso', 32, 32)).toBeNull();
      expect(validateArmorPoints('Right Torso', 32, 32)).toBeNull();
      
      expect(validateArmorPoints('Left Torso', 33, 32)).not.toBeNull();
      expect(validateArmorPoints('Right Torso', 33, 32)).not.toBeNull();
    });

    test('should validate arm armor limits', () => {
      // Medium mech arms
      expect(validateArmorPoints('Left Arm', 24, 24)).toBeNull();
      expect(validateArmorPoints('Right Arm', 24, 24)).toBeNull();
      
      expect(validateArmorPoints('Left Arm', 25, 24)).not.toBeNull();
      expect(validateArmorPoints('Right Arm', 25, 24)).not.toBeNull();
    });

    test('should validate leg armor limits', () => {
      // Heavy mech legs
      expect(validateArmorPoints('Left Leg', 32, 32)).toBeNull();
      expect(validateArmorPoints('Right Leg', 32, 32)).toBeNull();
      
      expect(validateArmorPoints('Left Leg', 33, 32)).not.toBeNull();
      expect(validateArmorPoints('Right Leg', 33, 32)).not.toBeNull();
    });
  });

  describe('Mech Weight Class Armor Scenarios', () => {
    test('should validate light mech armor distribution', () => {
      const lightMechArmor = [
        { location: 'Head', armor: 9, max: 9 },
        { location: 'Center Torso', armor: 25, max: 25 },
        { location: 'Left Torso', armor: 18, max: 18 },
        { location: 'Right Torso', armor: 18, max: 18 },
        { location: 'Left Arm', armor: 12, max: 12 },
        { location: 'Right Arm', armor: 12, max: 12 },
        { location: 'Left Leg', armor: 18, max: 18 },
        { location: 'Right Leg', armor: 18, max: 18 }
      ];

      lightMechArmor.forEach(({ location, armor, max }) => {
        expect(validateArmorPoints(location, armor, max)).toBeNull();
      });
    });

    test('should validate medium mech armor distribution', () => {
      const mediumMechArmor = [
        { location: 'Head', armor: 9, max: 9 },
        { location: 'Center Torso', armor: 35, max: 35 },
        { location: 'Left Torso', armor: 24, max: 24 },
        { location: 'Right Torso', armor: 24, max: 24 },
        { location: 'Left Arm', armor: 18, max: 18 },
        { location: 'Right Arm', armor: 18, max: 18 },
        { location: 'Left Leg', armor: 26, max: 26 },
        { location: 'Right Leg', armor: 26, max: 26 }
      ];

      mediumMechArmor.forEach(({ location, armor, max }) => {
        expect(validateArmorPoints(location, armor, max)).toBeNull();
      });
    });

    test('should validate heavy mech armor distribution', () => {
      const heavyMechArmor = [
        { location: 'Head', armor: 9, max: 9 },
        { location: 'Center Torso', armor: 47, max: 47 },
        { location: 'Left Torso', armor: 32, max: 32 },
        { location: 'Right Torso', armor: 32, max: 32 },
        { location: 'Left Arm', armor: 24, max: 24 },
        { location: 'Right Arm', armor: 24, max: 24 },
        { location: 'Left Leg', armor: 32, max: 32 },
        { location: 'Right Leg', armor: 32, max: 32 }
      ];

      heavyMechArmor.forEach(({ location, armor, max }) => {
        expect(validateArmorPoints(location, armor, max)).toBeNull();
      });
    });

    test('should validate assault mech armor distribution', () => {
      const assaultMechArmor = [
        { location: 'Head', armor: 9, max: 9 },
        { location: 'Center Torso', armor: 63, max: 63 },
        { location: 'Left Torso', armor: 42, max: 42 },
        { location: 'Right Torso', armor: 42, max: 42 },
        { location: 'Left Arm', armor: 34, max: 34 },
        { location: 'Right Arm', armor: 34, max: 34 },
        { location: 'Left Leg', armor: 42, max: 42 },
        { location: 'Right Leg', armor: 42, max: 42 }
      ];

      assaultMechArmor.forEach(({ location, armor, max }) => {
        expect(validateArmorPoints(location, armor, max)).toBeNull();
      });
    });
  });

  describe('Decimal and Fractional Armor Values', () => {
    test('should handle decimal armor values correctly', () => {
      // Armor should typically be whole numbers, but function should handle decimals
      expect(validateArmorPoints('Left Arm', 15.5, 24)).toBeNull();
      expect(validateArmorPoints('Left Arm', 24.1, 24)).not.toBeNull();
    });

    test('should handle fractional maximum values', () => {
      expect(validateArmorPoints('Left Arm', 15, 15.5)).toBeNull();
      expect(validateArmorPoints('Left Arm', 16, 15.5)).not.toBeNull();
    });

    test('should handle precision edge cases', () => {
      expect(validateArmorPoints('Center Torso', 47.0, 47.0)).toBeNull();
      expect(validateArmorPoints('Center Torso', 47.001, 47.0)).not.toBeNull();
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    test('should handle zero maximum armor', () => {
      expect(validateArmorPoints('Test Location', 0, 0)).toBeNull();
      expect(validateArmorPoints('Test Location', 1, 0)).not.toBeNull();
    });

    test('should handle very large armor values', () => {
      const result = validateArmorPoints('Left Arm', 1000, 24);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('cannot exceed 24 points');
    });

    test('should handle very large maximum values', () => {
      expect(validateArmorPoints('Test Location', 100, 1000)).toBeNull();
      expect(validateArmorPoints('Test Location', 1001, 1000)).not.toBeNull();
    });

    test('should handle negative maximum values gracefully', () => {
      // This is an invalid scenario but function should handle it
      const result = validateArmorPoints('Test Location', 5, -1);
      expect(result).not.toBeNull();
    });
  });

  describe('Location Name Handling', () => {
    test('should handle standard location names', () => {
      const standardLocations = [
        'Head', 'Center Torso', 'Left Torso', 'Right Torso',
        'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg'
      ];

      standardLocations.forEach(location => {
        const result = validateArmorPoints(location, 10, 15);
        expect(result).toBeNull();
        
        const field = result?.field || `armor_${location}`;
        expect(field).toContain(location);
      });
    });

    test('should handle location names with spaces', () => {
      const result = validateArmorPoints('Center Torso', 50, 47);
      expect(result?.field).toBe('armor_Center Torso');
      expect(result?.message).toContain('Center Torso');
    });

    test('should handle custom location names', () => {
      const customLocations = ['Test Location', 'Special Area', 'Custom Part'];

      customLocations.forEach(location => {
        const result = validateArmorPoints(location, 100, 50);
        expect(result?.field).toBe(`armor_${location}`);
        expect(result?.message).toContain(location);
      });
    });

    test('should handle empty location names', () => {
      const result = validateArmorPoints('', 10, 5);
      expect(result?.field).toBe('armor_');
      expect(result?.message).toContain(' armor cannot exceed');
    });
  });

  describe('Message Content Validation', () => {
    test('should provide clear error messages for exceeded limits', () => {
      const result = validateArmorPoints('Left Arm', 30, 24);
      expect(result?.message).toBe('Left Arm armor cannot exceed 24 points');
    });

    test('should provide clear error messages for negative values', () => {
      const result = validateArmorPoints('Right Leg', -5, 32);
      expect(result?.message).toBe('Right Leg armor cannot be negative');
    });

    test('should provide clear error messages for rear armor', () => {
      const result = validateArmorPoints('Center Torso', 20, 14, true);
      expect(result?.message).toBe('Center Torso rear armor cannot exceed 14 points');
    });

    test('should include specific armor point limits in messages', () => {
      const testCases = [
        { armor: 25, max: 24, expectedLimit: '24' },
        { armor: 10, max: 9, expectedLimit: '9' },
        { armor: 50, max: 47, expectedLimit: '47' }
      ];

      testCases.forEach(({ armor, max, expectedLimit }) => {
        const result = validateArmorPoints('Test', armor, max);
        expect(result?.message).toContain(expectedLimit);
      });
    });
  });

  describe('Return Value Structure', () => {
    test('should return null for valid armor values', () => {
      const result = validateArmorPoints('Head', 9, 9);
      expect(result).toBeNull();
    });

    test('should return proper ValidationError structure', () => {
      const result = validateArmorPoints('Head', 10, 9);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('field');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('severity');
      
      expect(typeof result!.field).toBe('string');
      expect(typeof result!.message).toBe('string');
      expect(result!.severity).toBe('error');
    });

    test('should always use "error" severity', () => {
      const testCases = [
        validateArmorPoints('Head', 10, 9),
        validateArmorPoints('Left Arm', -5, 24),
        validateArmorPoints('Center Torso', 50, 47, true)
      ];

      testCases.forEach(result => {
        expect(result?.severity).toBe('error');
      });
    });

    test('should generate appropriate field names', () => {
      const frontResult = validateArmorPoints('Left Torso', 35, 32);
      const rearResult = validateArmorPoints('Left Torso', 15, 10, true);

      expect(frontResult?.field).toBe('armor_Left Torso');
      expect(rearResult?.field).toBe('armor_Left Torso_rear');
    });
  });

  describe('Performance and Optimization', () => {
    test('should validate many armor values quickly', () => {
      const startTime = performance.now();
      
      const locations = ['Head', 'Center Torso', 'Left Torso', 'Right Torso'];
      for (let i = 0; i < 1000; i++) {
        locations.forEach(location => {
          validateArmorPoints(location, i % 50, 30);
          validateArmorPoints(location, i % 20, 15, true);
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (less than 50ms for 8000 validations)
      expect(duration).toBeLessThan(50);
    });

    test('should be deterministic across multiple calls', () => {
      const testCases = [
        { location: 'Head', armor: 9, max: 9, rear: false },
        { location: 'Head', armor: 10, max: 9, rear: false },
        { location: 'Center Torso', armor: 15, max: 14, rear: true },
        { location: 'Left Arm', armor: -5, max: 24, rear: false }
      ];

      testCases.forEach(({ location, armor, max, rear }) => {
        const result1 = validateArmorPoints(location, armor, max, rear);
        const result2 = validateArmorPoints(location, armor, max, rear);
        expect(result1).toEqual(result2);
      });
    });
  });

  describe('Integration with Common Scenarios', () => {
    test('should validate complete mech armor setup', () => {
      const completeArmorSetup = [
        { location: 'Head', armor: 9, max: 9, rear: false },
        { location: 'Center Torso', armor: 47, max: 47, rear: false },
        { location: 'Center Torso', armor: 14, max: 14, rear: true },
        { location: 'Left Torso', armor: 32, max: 32, rear: false },
        { location: 'Left Torso', armor: 10, max: 10, rear: true },
        { location: 'Right Torso', armor: 32, max: 32, rear: false },
        { location: 'Right Torso', armor: 10, max: 10, rear: true },
        { location: 'Left Arm', armor: 24, max: 24, rear: false },
        { location: 'Right Arm', armor: 24, max: 24, rear: false },
        { location: 'Left Leg', armor: 32, max: 32, rear: false },
        { location: 'Right Leg', armor: 32, max: 32, rear: false }
      ];

      completeArmorSetup.forEach(({ location, armor, max, rear }) => {
        expect(validateArmorPoints(location, armor, max, rear)).toBeNull();
      });
    });

    test('should identify common armor allocation mistakes', () => {
      const commonMistakes = [
        { location: 'Head', armor: 12, max: 9, expectedError: true },
        { location: 'Center Torso', armor: 50, max: 47, expectedError: true },
        { location: 'Left Arm', armor: 0, max: 24, expectedError: false },
        { location: 'Right Leg', armor: -1, max: 32, expectedError: true }
      ];

      commonMistakes.forEach(({ location, armor, max, expectedError }) => {
        const result = validateArmorPoints(location, armor, max);
        if (expectedError) {
          expect(result).not.toBeNull();
        } else {
          expect(result).toBeNull();
        }
      });
    });
  });
});
