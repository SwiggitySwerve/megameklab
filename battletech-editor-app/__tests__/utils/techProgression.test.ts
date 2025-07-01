/**
 * Tech Progression Utility Test Suite
 * Tests for core tech progression logic and tech base determination
 */

import {
  TechProgression,
  TechRating,
  updateTechProgression,
  generateTechBaseString,
  isMixedTech,
  getPrimaryTechBase,
  extractBaseTech,
  createDefaultTechProgression,
  validateTechProgression,
  inferTechProgression,
  analyzeMixedTechPattern
} from '../../utils/techProgression';

describe('TechProgression Utilities', () => {
  // Sample tech progression configurations for testing
  const innerSphereProgression: TechProgression = {
    chassis: 'Inner Sphere',
    gyro: 'Inner Sphere',
    engine: 'Inner Sphere',
    heatsink: 'Inner Sphere',
    targeting: 'Inner Sphere',
    myomer: 'Inner Sphere',
    movement: 'Inner Sphere',
    armor: 'Inner Sphere'
  };

  const clanProgression: TechProgression = {
    chassis: 'Clan',
    gyro: 'Clan',
    engine: 'Clan',
    heatsink: 'Clan',
    targeting: 'Clan',
    myomer: 'Clan',
    movement: 'Clan',
    armor: 'Clan'
  };

  const mixedProgression: TechProgression = {
    chassis: 'Inner Sphere',
    gyro: 'Inner Sphere',
    engine: 'Inner Sphere',
    heatsink: 'Inner Sphere',
    targeting: 'Clan',      // Mixed: Clan targeting
    myomer: 'Inner Sphere',
    movement: 'Inner Sphere',
    armor: 'Inner Sphere'
  };

  const partiallyMixedProgression: TechProgression = {
    chassis: 'Clan',        // Clan chassis
    gyro: 'Clan',          // Clan gyro  
    engine: 'Inner Sphere', // IS engine
    heatsink: 'Clan',      // Clan heat sinks
    targeting: 'Clan',
    myomer: 'Inner Sphere',
    movement: 'Inner Sphere',
    armor: 'Clan'          // Clan armor
  };

  describe('updateTechProgression', () => {
    test('should update single subsystem correctly', () => {
      const result = updateTechProgression(innerSphereProgression, 'targeting', 'Clan');
      
      expect(result).toEqual({
        ...innerSphereProgression,
        targeting: 'Clan'
      });
      
      // Should not mutate original
      expect(innerSphereProgression.targeting).toBe('Inner Sphere');
    });

    test('should update multiple subsystems independently', () => {
      let result = updateTechProgression(innerSphereProgression, 'targeting', 'Clan');
      result = updateTechProgression(result, 'engine', 'Clan');
      result = updateTechProgression(result, 'armor', 'Clan');
      
      expect(result).toEqual({
        chassis: 'Inner Sphere',
        gyro: 'Inner Sphere',
        engine: 'Clan',
        heatsink: 'Inner Sphere',
        targeting: 'Clan',
        myomer: 'Inner Sphere',
        movement: 'Inner Sphere',
        armor: 'Clan'
      });
    });

    test('should handle switching from Clan to Inner Sphere', () => {
      const result = updateTechProgression(clanProgression, 'targeting', 'Inner Sphere');
      
      expect(result).toEqual({
        ...clanProgression,
        targeting: 'Inner Sphere'
      });
    });

    test('should handle invalid subsystem gracefully', () => {
      // @ts-expect-error Testing invalid input
      const result = updateTechProgression(innerSphereProgression, 'invalidSubsystem', 'Clan');
      
      // Current implementation adds the invalid subsystem to the object
      expect(result).toEqual({
        ...innerSphereProgression,
        invalidSubsystem: 'Clan'
      });
    });

    test('should handle invalid tech base gracefully', () => {
      // @ts-expect-error Testing invalid input
      const result = updateTechProgression(innerSphereProgression, 'targeting', 'InvalidTech');
      
      // Current implementation allows invalid tech base (adds it to the object)
      expect(result).toEqual({
        ...innerSphereProgression,
        targeting: 'InvalidTech'
      });
    });

    test('should preserve other subsystems when updating one', () => {
      const originalProgression = { ...mixedProgression };
      const result = updateTechProgression(mixedProgression, 'armor', 'Clan');
      
      // Only armor should change
      expect(result.armor).toBe('Clan');
      expect(result.targeting).toBe('Clan'); // Should preserve existing Clan targeting
      expect(result.chassis).toBe('Inner Sphere'); // Should preserve IS chassis
      expect(result.engine).toBe('Inner Sphere'); // Should preserve IS engine
    });
  });

  describe('generateTechBaseString', () => {
    test('should return "Inner Sphere" for pure Inner Sphere tech', () => {
      const result = generateTechBaseString(innerSphereProgression);
      expect(result).toBe('Inner Sphere');
    });

    test('should return "Clan" for pure Clan tech', () => {
      const result = generateTechBaseString(clanProgression);
      expect(result).toBe('Clan');
    });

    test('should return "Mixed" for mixed technology', () => {
      const result = generateTechBaseString(mixedProgression);
      expect(result).toBe('Mixed (IS Chassis)'); // mixedProgression has IS chassis
    });

    test('should return "Mixed" for partially mixed technology', () => {
      const result = generateTechBaseString(partiallyMixedProgression);
      expect(result).toBe('Mixed (Clan Chassis)'); // partiallyMixedProgression has Clan chassis
    });

    test('should handle single subsystem difference', () => {
      const singleMixed = {
        ...innerSphereProgression,
        targeting: 'Clan' as const
      };
      
      const result = generateTechBaseString(singleMixed);
      expect(result).toBe('Mixed (IS Chassis)'); // IS chassis
    });

    test('should handle mostly Clan with single IS component', () => {
      const mostlyClan = {
        ...clanProgression,
        engine: 'Inner Sphere' as const
      };
      
      const result = generateTechBaseString(mostlyClan);
      expect(result).toBe('Mixed (Clan Chassis)'); // Clan chassis
    });
  });

  describe('isMixedTech', () => {
    test('should return false for pure Inner Sphere tech', () => {
      expect(isMixedTech(innerSphereProgression)).toBe(false);
    });

    test('should return false for pure Clan tech', () => {
      expect(isMixedTech(clanProgression)).toBe(false);
    });

    test('should return true for mixed technology', () => {
      expect(isMixedTech(mixedProgression)).toBe(true);
    });

    test('should return true for partially mixed technology', () => {
      expect(isMixedTech(partiallyMixedProgression)).toBe(true);
    });

    test('should return true for minimal mixed technology', () => {
      const minimalMixed = {
        ...innerSphereProgression,
        myomer: 'Clan' as const
      };
      
      expect(isMixedTech(minimalMixed)).toBe(true);
    });

    test('should handle edge case with all different combinations', () => {
      const complexMixed: TechProgression = {
        chassis: 'Inner Sphere',
        gyro: 'Clan',
        engine: 'Inner Sphere', 
        heatsink: 'Clan',
        targeting: 'Inner Sphere',
        myomer: 'Clan',
        movement: 'Inner Sphere',
        armor: 'Clan'
      };
      
      expect(isMixedTech(complexMixed)).toBe(true);
    });
  });

  describe('getPrimaryTechBase', () => {
    test('should return "Inner Sphere" for pure Inner Sphere tech', () => {
      expect(getPrimaryTechBase(innerSphereProgression)).toBe('Inner Sphere');
    });

    test('should return "Clan" for pure Clan tech', () => {
      expect(getPrimaryTechBase(clanProgression)).toBe('Clan');
    });

    test('should return dominant tech base for mixed technology', () => {
      // 7 Inner Sphere, 1 Clan - should be Inner Sphere
      expect(getPrimaryTechBase(mixedProgression)).toBe('Inner Sphere');
    });

    test('should return "Clan" when Clan dominates', () => {
      const clanDominated = {
        chassis: 'Clan',
        gyro: 'Clan',
        engine: 'Clan',
        heatsink: 'Clan',
        targeting: 'Clan',
        myomer: 'Inner Sphere', // Only one IS component
        movement: 'Clan',
        armor: 'Clan'
      };
      
      expect(getPrimaryTechBase(clanDominated)).toBe('Clan');
    });

    test('should handle tie-breaker correctly', () => {
      const tiedProgression: TechProgression = {
        chassis: 'Inner Sphere',
        gyro: 'Inner Sphere',
        engine: 'Inner Sphere',
        heatsink: 'Inner Sphere',
        targeting: 'Clan',
        myomer: 'Clan',
        movement: 'Clan',
        armor: 'Clan'
      };
      
      // With 4-4 tie, should return 'Mixed'
      const result = getPrimaryTechBase(tiedProgression);
      expect(result).toBe('Mixed');
    });
  });

  describe('extractBaseTech', () => {
    test('should extract "Inner Sphere" from IS tech base strings', () => {
      expect(extractBaseTech('Inner Sphere')).toBe('Inner Sphere');
      expect(extractBaseTech('Mixed (IS Chassis)')).toBe('Inner Sphere');
      expect(extractBaseTech('Standard')).toBe('Inner Sphere');
    });

    test('should extract "Clan" from Clan tech base strings', () => {
      expect(extractBaseTech('Clan')).toBe('Clan');
      expect(extractBaseTech('Mixed (Clan Chassis)')).toBe('Clan');
      expect(extractBaseTech('Clan Omnimech')).toBe('Clan');
    });

    test('should default to Inner Sphere for unknown strings', () => {
      expect(extractBaseTech('Unknown')).toBe('Inner Sphere');
      expect(extractBaseTech('')).toBe('Inner Sphere');
    });
  });

  describe('createDefaultTechProgression', () => {
    test('should create default Inner Sphere progression', () => {
      const result = createDefaultTechProgression();
      expect(result).toEqual(innerSphereProgression);
    });

    test('should create default Clan progression', () => {
      const result = createDefaultTechProgression('Clan');
      expect(result).toEqual(clanProgression);
    });

    test('should create specific tech base progression', () => {
      const isResult = createDefaultTechProgression('Inner Sphere');
      const clanResult = createDefaultTechProgression('Clan');
      
      expect(isResult).toEqual(innerSphereProgression);
      expect(clanResult).toEqual(clanProgression);
    });
  });

  describe('validateTechProgression', () => {
    test('should validate pure tech progressions as valid', () => {
      const isResult = validateTechProgression(innerSphereProgression);
      const clanResult = validateTechProgression(clanProgression);
      
      expect(isResult.isValid).toBe(true);
      expect(isResult.errors).toHaveLength(0);
      expect(clanResult.isValid).toBe(true);
      expect(clanResult.errors).toHaveLength(0);
    });

    test('should provide warnings for unusual combinations', () => {
      const unusualProgression: TechProgression = {
        chassis: 'Inner Sphere',
        gyro: 'Inner Sphere',
        engine: 'Clan', // Unusual: Clan engine with IS chassis
        heatsink: 'Inner Sphere',
        targeting: 'Inner Sphere',
        myomer: 'Inner Sphere',
        movement: 'Inner Sphere',
        armor: 'Inner Sphere'
      };
      
      const result = validateTechProgression(unusualProgression);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Inner Sphere chassis with Clan engine');
    });

    test('should warn about Clan heat sinks with IS engine', () => {
      const problematicProgression: TechProgression = {
        chassis: 'Inner Sphere',
        gyro: 'Inner Sphere',
        engine: 'Inner Sphere',
        heatsink: 'Clan', // Unusual: Clan heat sinks with IS engine
        targeting: 'Inner Sphere',
        myomer: 'Inner Sphere',
        movement: 'Inner Sphere',
        armor: 'Inner Sphere'
      };
      
      const result = validateTechProgression(problematicProgression);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('Clan heat sinks with Inner Sphere engine'))).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle null/undefined progression gracefully', () => {
      expect(() => updateTechProgression(null as any, 'targeting', 'Clan')).not.toThrow();
      expect(() => generateTechBaseString(null as any)).toThrow();
      expect(() => isMixedTech(null as any)).toThrow();
      expect(() => getPrimaryTechBase(null as any)).toThrow();
    });

    test('should handle empty progression object', () => {
      const emptyProgression = {} as TechProgression;
      
      expect(() => updateTechProgression(emptyProgression, 'targeting', 'Clan')).not.toThrow();
      expect(() => generateTechBaseString(emptyProgression)).not.toThrow();
      expect(() => isMixedTech(emptyProgression)).not.toThrow();
      expect(() => getPrimaryTechBase(emptyProgression)).not.toThrow();
    });
  });

  describe('Performance and Immutability', () => {
    test('should not mutate original progression object', () => {
      const original = { ...innerSphereProgression };
      const updated = updateTechProgression(original, 'targeting', 'Clan');
      
      expect(original).toEqual(innerSphereProgression);
      expect(updated).not.toBe(original); // Different object reference
      expect(updated.targeting).toBe('Clan');
      expect(original.targeting).toBe('Inner Sphere');
    });

    test('should create new object for each update', () => {
      const progression1 = updateTechProgression(innerSphereProgression, 'targeting', 'Clan');
      const progression2 = updateTechProgression(progression1, 'engine', 'Clan');
      
      expect(progression1).not.toBe(progression2);
      expect(progression1).not.toBe(innerSphereProgression);
      expect(progression2.targeting).toBe('Clan');
      expect(progression2.engine).toBe('Clan');
      expect(progression1.engine).toBe('Inner Sphere');
    });

    test('should handle rapid sequential updates efficiently', () => {
      let progression = innerSphereProgression;
      const subsystems: (keyof TechProgression)[] = ['targeting', 'engine', 'armor', 'heatsink'];
      
      // Rapidly update multiple subsystems
      subsystems.forEach(subsystem => {
        progression = updateTechProgression(progression, subsystem, 'Clan');
      });
      
      expect(progression.targeting).toBe('Clan');
      expect(progression.engine).toBe('Clan');
      expect(progression.armor).toBe('Clan');
      expect(progression.heatsink).toBe('Clan');
      expect(progression.chassis).toBe('Inner Sphere'); // Unchanged
    });
  });

  describe('Integration with React State', () => {
    test('should be suitable for React state updates', () => {
      // Simulate React setState pattern
      const mockSetState = jest.fn();
      const currentProgression = innerSphereProgression;
      
      // Simulate button click handler
      const handleTechProgressionChange = (subsystem: keyof TechProgression, techBase: 'Inner Sphere' | 'Clan') => {
        const newProgression = updateTechProgression(currentProgression, subsystem, techBase);
        mockSetState(newProgression);
      };
      
      handleTechProgressionChange('targeting', 'Clan');
      
      expect(mockSetState).toHaveBeenCalledWith({
        ...innerSphereProgression,
        targeting: 'Clan'
      });
    });

    test('should maintain referential equality for unchanged subsystems', () => {
      const original = innerSphereProgression;
      const updated = updateTechProgression(original, 'targeting', 'Clan');
      
      // These should be the same reference (optimization for React)
      expect(updated.chassis).toBe(original.chassis);
      expect(updated.engine).toBe(original.engine);
      expect(updated.armor).toBe(original.armor);
      
      // This should be different
      expect(updated.targeting).not.toBe(original.targeting);
    });
  });
});
