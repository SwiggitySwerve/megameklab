/**
 * Tests for FieldValidationService
 * 
 * Validates individual field validation logic with context-aware rules.
 */

import { FieldValidationService } from '../../../utils/editor/FieldValidationService';
import { ValidationContext } from '../../../utils/editor/UnitValidationService';

describe('FieldValidationService', () => {
  const defaultContext: ValidationContext = {
    strictMode: false,
    validateOptionalFields: true,
    checkTechCompatibility: true,
    validateConstructionRules: true
  };

  const strictContext: ValidationContext = {
    ...defaultContext,
    strictMode: true
  };

  describe('validateChassisField', () => {
    it('should accept valid chassis names', () => {
      const result = FieldValidationService.validateChassisField('Atlas', defaultContext);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty chassis names', () => {
      const result = FieldValidationService.validateChassisField('', defaultContext);
      expect(result.isValid).toBe(false);
      expect(result.error?.id).toBe('invalid-chassis');
      expect(result.error?.message).toBe('Chassis name is required');
    });

    it('should reject chassis names exceeding 50 characters', () => {
      const longName = 'a'.repeat(51);
      const result = FieldValidationService.validateChassisField(longName, defaultContext);
      expect(result.isValid).toBe(false);
      expect(result.error?.id).toBe('chassis-too-long');
    });

    it('should validate special characters in strict mode', () => {
      const result = FieldValidationService.validateChassisField('Atlas@#$', strictContext);
      expect(result.isValid).toBe(false);
      expect(result.error?.id).toBe('chassis-invalid-characters');
      expect(result.suggestions).toContain('Use only letters, numbers, spaces, hyphens, underscores, and periods');
    });

    it('should accept valid special characters', () => {
      const result = FieldValidationService.validateChassisField('Atlas-II_v2.0', strictContext);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateModelField', () => {
    it('should accept valid model designations', () => {
      const result = FieldValidationService.validateModelField('AS7-D', defaultContext);
      expect(result.isValid).toBe(true);
    });

    it('should reject empty model designations', () => {
      const result = FieldValidationService.validateModelField('', defaultContext);
      expect(result.isValid).toBe(false);
      expect(result.error?.id).toBe('invalid-model');
    });

    it('should reject model designations exceeding 30 characters', () => {
      const longModel = 'a'.repeat(31);
      const result = FieldValidationService.validateModelField(longModel, defaultContext);
      expect(result.isValid).toBe(false);
      expect(result.error?.id).toBe('model-too-long');
    });

    it('should validate model format in strict mode', () => {
      const result = FieldValidationService.validateModelField('as7-d', strictContext);
      expect(result.isValid).toBe(false);
      expect(result.error?.id).toBe('model-invalid-format');
      expect(result.suggestions).toContain('Use uppercase letters, numbers, and hyphens (e.g., "BLR-1G", "AWS-8Q")');
    });

    it('should accept properly formatted models in strict mode', () => {
      const result = FieldValidationService.validateModelField('BLR-1G', strictContext);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateMassField', () => {
    it('should accept valid mass values', () => {
      const result = FieldValidationService.validateMassField(75, defaultContext);
      expect(result.isValid).toBe(true);
    });

    it('should reject zero or negative mass', () => {
      const result = FieldValidationService.validateMassField(0, defaultContext);
      expect(result.isValid).toBe(false);
      expect(result.error?.id).toBe('invalid-mass');
    });

    it('should reject mass below 10 tons', () => {
      const result = FieldValidationService.validateMassField(5, defaultContext);
      expect(result.isValid).toBe(false);
      expect(result.error?.id).toBe('mass-too-low');
    });

    it('should reject mass above 200 tons', () => {
      const result = FieldValidationService.validateMassField(250, defaultContext);
      expect(result.isValid).toBe(false);
      expect(result.error?.id).toBe('mass-too-high');
    });

    it('should enforce 5-ton increments in strict mode', () => {
      const result = FieldValidationService.validateMassField(73, strictContext);
      expect(result.isValid).toBe(false);
      expect(result.error?.id).toBe('invalid-tonnage-increment');
    });

    it('should suggest 5-ton increments in non-strict mode', () => {
      const result = FieldValidationService.validateMassField(73, defaultContext);
      expect(result.isValid).toBe(true);
      expect(result.suggestions).toContain('Consider using standard 5-ton increments for compatibility');
    });
  });

  describe('validateTechBaseField', () => {
    it('should accept valid tech bases', () => {
      const validTechBases = ['Inner Sphere', 'Clan', 'Mixed (IS Chassis)', 'Mixed (Clan Chassis)'];
      
      validTechBases.forEach(techBase => {
        const result = FieldValidationService.validateTechBaseField(techBase, defaultContext);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject invalid tech bases', () => {
      const result = FieldValidationService.validateTechBaseField('Invalid Tech', defaultContext);
      expect(result.isValid).toBe(false);
      expect(result.error?.id).toBe('invalid-tech-base');
      expect(result.suggestions).toEqual(['Inner Sphere', 'Clan', 'Mixed (IS Chassis)', 'Mixed (Clan Chassis)']);
    });

    it('should provide warnings for mixed tech in strict mode', () => {
      const result = FieldValidationService.validateTechBaseField('Mixed (IS Chassis)', strictContext);
      expect(result.isValid).toBe(true);
      expect(result.suggestions).toContain('Mixed tech requires special rules and may not be allowed in all game settings');
    });
  });

  describe('validateEraField', () => {
    it('should accept valid eras', () => {
      const result = FieldValidationService.validateEraField('Clan Invasion', defaultContext);
      expect(result.isValid).toBe(true);
    });

    it('should provide suggestions for empty era when optional fields are validated', () => {
      const result = FieldValidationService.validateEraField('', defaultContext);
      expect(result.isValid).toBe(true);
      expect(result.suggestions).toContain('Specifying an era helps with tech availability validation');
    });

    it('should reject invalid eras', () => {
      const result = FieldValidationService.validateEraField('Invalid Era', defaultContext);
      expect(result.isValid).toBe(false);
      expect(result.error?.id).toBe('invalid-era');
    });
  });

  describe('validateWalkSpeedField', () => {
    it('should accept valid walk speeds', () => {
      const result = FieldValidationService.validateWalkSpeedField(4, defaultContext);
      expect(result.isValid).toBe(true);
    });

    it('should reject walk speed below 1', () => {
      const result = FieldValidationService.validateWalkSpeedField(0, defaultContext);
      expect(result.isValid).toBe(false);
      expect(result.error?.id).toBe('invalid-walk-speed');
    });

    it('should enforce walk speed limits in strict mode', () => {
      const result = FieldValidationService.validateWalkSpeedField(10, strictContext);
      expect(result.isValid).toBe(false);
      expect(result.error?.id).toBe('excessive-walk-speed');
    });

    it('should provide warnings for high walk speed in non-strict mode', () => {
      const result = FieldValidationService.validateWalkSpeedField(10, defaultContext);
      expect(result.isValid).toBe(true);
      expect(result.suggestions).toContain('Walk speed above 8 is unusual for standard BattleMechs');
    });
  });

  describe('validateEngineRatingField', () => {
    it('should accept correct engine ratings', () => {
      const result = FieldValidationService.validateEngineRatingField(300, 75, 4, defaultContext);
      expect(result.isValid).toBe(true);
    });

    it('should reject zero or negative engine ratings', () => {
      const result = FieldValidationService.validateEngineRatingField(0, 75, 4, defaultContext);
      expect(result.isValid).toBe(false);
      expect(result.error?.id).toBe('invalid-engine-rating');
    });

    it('should validate engine rating calculation', () => {
      const result = FieldValidationService.validateEngineRatingField(280, 75, 4, defaultContext);
      expect(result.isValid).toBe(false);
      expect(result.error?.id).toBe('engine-rating-mismatch');
      expect(result.error?.message).toContain('Engine rating should be 300');
    });

    it('should enforce standard engine ratings in strict mode', () => {
      const result = FieldValidationService.validateEngineRatingField(301, 301, 1, strictContext);
      expect(result.isValid).toBe(false);
      expect(result.error?.id).toBe('non-standard-engine-rating');
    });

    it('should provide warnings for non-standard ratings in non-strict mode', () => {
      // Use a valid calculation but non-standard rating
      const result = FieldValidationService.validateEngineRatingField(301, 75.25, 4, defaultContext);
      expect(result.isValid).toBe(true);
      expect(result.suggestions).toContain('Non-standard engine ratings may not be available in all game settings');
    });
  });

  describe('validateFieldsCrossReference', () => {
    it('should validate consistent engine calculations', () => {
      const fields = {
        mass: 75,
        walkSpeed: 4,
        engineRating: 300
      };

      const result = FieldValidationService.validateFieldsCrossReference(fields, defaultContext);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect engine rating mismatches', () => {
      const fields = {
        mass: 75,
        walkSpeed: 4,
        engineRating: 280
      };

      const result = FieldValidationService.validateFieldsCrossReference(fields, defaultContext);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].id).toBe('engine-mass-speed-mismatch');
    });

    it('should validate tech base and era compatibility in strict mode', () => {
      const fields = {
        techBase: 'Clan',
        era: 'Succession Wars'
      };

      const result = FieldValidationService.validateFieldsCrossReference(fields, strictContext);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].id).toBe('clan-tech-era-mismatch');
    });

    it('should provide warnings for tech/era mismatches in non-strict mode', () => {
      const fields = {
        techBase: 'Clan',
        era: 'Succession Wars'
      };

      const result = FieldValidationService.validateFieldsCrossReference(fields, defaultContext);
      expect(result.isValid).toBe(true);
      expect(result.suggestions).toContain('Clan technology is typically not available before the Clan Invasion era');
    });

    it('should accept compatible tech base and era combinations', () => {
      const fields = {
        techBase: 'Clan',
        era: 'Clan Invasion'
      };

      const result = FieldValidationService.validateFieldsCrossReference(fields, defaultContext);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('getFieldValidationRules', () => {
    it('should provide validation rules for all supported fields', () => {
      const rules = FieldValidationService.getFieldValidationRules();
      
      const expectedFields = ['chassis', 'model', 'mass', 'techBase', 'era', 'walkSpeed', 'engineRating'];
      expectedFields.forEach(field => {
        expect(rules[field]).toBeDefined();
        expect(Array.isArray(rules[field])).toBe(true);
        expect(rules[field].length).toBeGreaterThan(0);
      });
    });

    it('should provide properly structured rule objects', () => {
      const rules = FieldValidationService.getFieldValidationRules();
      
      Object.values(rules).flat().forEach(rule => {
        expect(rule).toHaveProperty('name');
        expect(rule).toHaveProperty('description');
        expect(rule).toHaveProperty('severity');
        expect(['error', 'warning', 'info']).toContain(rule.severity);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined values gracefully', () => {
      const result = FieldValidationService.validateChassisField(undefined as any, defaultContext);
      expect(result.isValid).toBe(false);
    });

    it('should handle null values gracefully', () => {
      const result = FieldValidationService.validateMassField(null as any, defaultContext);
      expect(result.isValid).toBe(false);
    });

    it('should handle whitespace-only strings', () => {
      const result = FieldValidationService.validateChassisField('   ', defaultContext);
      expect(result.isValid).toBe(false);
      expect(result.error?.id).toBe('invalid-chassis');
    });

    it('should handle missing context properties', () => {
      const partialContext = { strictMode: true } as ValidationContext;
      const result = FieldValidationService.validateChassisField('Atlas', partialContext);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Boundary Value Testing', () => {
    it('should handle exact boundary values for mass', () => {
      expect(FieldValidationService.validateMassField(10, defaultContext).isValid).toBe(true);
      expect(FieldValidationService.validateMassField(9, defaultContext).isValid).toBe(false);
      expect(FieldValidationService.validateMassField(200, defaultContext).isValid).toBe(true);
      expect(FieldValidationService.validateMassField(201, defaultContext).isValid).toBe(false);
    });

    it('should handle exact boundary values for chassis name length', () => {
      const exactLength = 'a'.repeat(50);
      const overLength = 'a'.repeat(51);
      
      expect(FieldValidationService.validateChassisField(exactLength, defaultContext).isValid).toBe(true);
      expect(FieldValidationService.validateChassisField(overLength, defaultContext).isValid).toBe(false);
    });

    it('should handle exact boundary values for walk speed', () => {
      expect(FieldValidationService.validateWalkSpeedField(1, defaultContext).isValid).toBe(true);
      expect(FieldValidationService.validateWalkSpeedField(0, defaultContext).isValid).toBe(false);
      expect(FieldValidationService.validateWalkSpeedField(8, defaultContext).isValid).toBe(true);
      expect(FieldValidationService.validateWalkSpeedField(9, strictContext).isValid).toBe(false);
    });
  });
});
