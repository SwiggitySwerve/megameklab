/**
 * ArmorRulesValidator Test Suite
 * Tests for BattleTech armor validation rules
 */

import { ArmorRulesValidator } from '../../../services/validation/ArmorRulesValidator';
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
    armorAllocation: {
      head: 9,
      centerTorso: { front: 20, rear: 10 },
      leftTorso: { front: 15, rear: 8 },
      rightTorso: { front: 15, rear: 8 },
      leftArm: 10,
      rightArm: 10,
      leftLeg: 12,
      rightLeg: 12
    },
    techBase: 'Inner Sphere',
    ...overrides
  } as UnitConfiguration;
}

describe('ArmorRulesValidator', () => {

  describe('validateArmorRules', () => {
    test('should validate standard armor configuration successfully', () => {
      const config = createTestConfig();
      const result = ArmorRulesValidator.validateArmorRules(config);
      
      expect(result.isValid).toBe(true);
      expect(result.totalArmor).toBe(109);
      expect(result.maxArmor).toBe(130); // 65 tons * 2
      expect(result.armorType).toBe('Standard');
      expect(result.violations).toHaveLength(0);
    });

    test('should reject invalid armor type', () => {
      const config = createTestConfig({ 
        armorType: { type: 'InvalidArmorType', techBase: 'Inner Sphere' }
      });
      
      const result = ArmorRulesValidator.validateArmorRules(config);
      
      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe('invalid_type');
      expect(result.violations[0].severity).toBe('critical');
    });

    test('should detect total armor exceeding maximum', () => {
      // Set armor beyond maximum (65 * 2 = 130)
      const config = createTestConfig({
        armorAllocation: {
          head: 9,
          centerTorso: { front: 30, rear: 20 },
          leftTorso: { front: 25, rear: 15 },
          rightTorso: { front: 25, rear: 15 },
          leftArm: 15,
          rightArm: 15,
          leftLeg: 15,
          rightLeg: 15
        }
      });
      
      const result = ArmorRulesValidator.validateArmorRules(config);
      
      expect(result.isValid).toBe(false);
      expect(result.totalArmor).toBe(164);
      expect(result.violations.some(v => v.type === 'exceeds_maximum')).toBe(true);
      expect(result.violations[0].severity).toBe('critical');
    });

    test('should validate individual location limits', () => {
      // Head armor exceeding 9 points
      const config = createTestConfig({
        armorAllocation: {
          head: 12,
          centerTorso: { front: 20, rear: 10 },
          leftTorso: { front: 15, rear: 8 },
          rightTorso: { front: 15, rear: 8 },
          leftArm: 10,
          rightArm: 10,
          leftLeg: 12,
          rightLeg: 12
        }
      });
      
      const result = ArmorRulesValidator.validateArmorRules(config);
      
      expect(result.isValid).toBe(false);
      expect(result.locationLimits.head.isValid).toBe(false);
      expect(result.violations.some(v => 
        v.type === 'location_violation' && v.location === 'head'
      )).toBe(true);
    });

    test('should recommend armor improvements for underarmored units', () => {
      // Reduce armor to 80% below maximum
      const config = createTestConfig({
        armorAllocation: {
          head: 9,
          centerTorso: { front: 10, rear: 5 },
          leftTorso: { front: 8, rear: 4 },
          rightTorso: { front: 8, rear: 4 },
          leftArm: 5,
          rightArm: 5,
          leftLeg: 6,
          rightLeg: 6
        }
      });
      
      const result = ArmorRulesValidator.validateArmorRules(config);
      
      expect(result.isValid).toBe(true);
      expect(result.totalArmor).toBe(70); // Well below 130 * 0.8 = 104
      expect(result.recommendations).toContain(
        expect.stringContaining('underarmored')
      );
    });

    test('should recommend Ferro-Fibrous armor for heavy units', () => {
      const config = createTestConfig({ 
        tonnage: 80,
        armorType: { type: 'Standard', techBase: 'Inner Sphere' }
      });
      
      const result = ArmorRulesValidator.validateArmorRules(config);
      
      expect(result.recommendations).toContain(
        expect.stringContaining('Ferro-Fibrous')
      );
    });
  });

  describe('calculateMaxArmor', () => {
    test('should calculate correct maximum armor for various tonnages', () => {
      expect(ArmorRulesValidator.calculateMaxArmor(20)).toBe(40);
      expect(ArmorRulesValidator.calculateMaxArmor(55)).toBe(110);
      expect(ArmorRulesValidator.calculateMaxArmor(100)).toBe(200);
    });
  });

  describe('calculateArmorWeight', () => {
    test('should calculate standard armor weight correctly', () => {
      const weight = ArmorRulesValidator.calculateArmorWeight(64, 'Standard');
      expect(weight).toBe(4); // 64 points / 16 = 4 tons
    });

    test('should calculate Ferro-Fibrous (IS) weight with savings', () => {
      const weight = ArmorRulesValidator.calculateArmorWeight(64, 'Ferro-Fibrous (IS)');
      expect(weight).toBe(4.5); // 12% weight savings, rounded to half-tons
    });

    test('should calculate Clan Ferro-Fibrous weight correctly', () => {
      const weight = ArmorRulesValidator.calculateArmorWeight(64, 'Ferro-Fibrous (Clan)');
      expect(weight).toBe(5); // 20% weight savings, rounded to half-tons
    });

    test('should calculate Hardened armor weight correctly', () => {
      const weight = ArmorRulesValidator.calculateArmorWeight(64, 'Hardened');
      expect(weight).toBe(8); // Double weight
    });

    test('should handle edge cases with zero armor', () => {
      const weight = ArmorRulesValidator.calculateArmorWeight(0, 'Standard');
      expect(weight).toBe(0);
    });
  });

  describe('getArmorCriticalSlots', () => {
    test('should return correct critical slots for armor types', () => {
      expect(ArmorRulesValidator.getArmorCriticalSlots('Standard')).toBe(0);
      expect(ArmorRulesValidator.getArmorCriticalSlots('Ferro-Fibrous (IS)')).toBe(14);
      expect(ArmorRulesValidator.getArmorCriticalSlots('Ferro-Fibrous (Clan)')).toBe(7);
      expect(ArmorRulesValidator.getArmorCriticalSlots('Heavy Ferro-Fibrous')).toBe(21);
      expect(ArmorRulesValidator.getArmorCriticalSlots('Hardened')).toBe(0);
    });
  });

  describe('getArmorProtectionMultiplier', () => {
    test('should return correct protection multipliers', () => {
      expect(ArmorRulesValidator.getArmorProtectionMultiplier('Standard')).toBe(1.0);
      expect(ArmorRulesValidator.getArmorProtectionMultiplier('Ferro-Fibrous (IS)')).toBe(1.0);
      expect(ArmorRulesValidator.getArmorProtectionMultiplier('Hardened')).toBe(2.0);
      expect(ArmorRulesValidator.getArmorProtectionMultiplier('Reactive')).toBe(1.1);
      expect(ArmorRulesValidator.getArmorProtectionMultiplier('Reflective')).toBe(1.2);
    });
  });

  describe('getArmorDistributionAnalysis', () => {
    test('should analyze armor distribution correctly', () => {
      const analysis = ArmorRulesValidator.getArmorDistributionAnalysis(mockConfig);
      
      expect(analysis.distribution).toBeDefined();
      expect(analysis.distribution.head.armor).toBe(9);
      expect(analysis.distribution.centerTorso.armor).toBe(30);
      expect(analysis.balance).toMatch(/front-heavy|rear-heavy|balanced/);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    test('should detect front-heavy armor distribution', () => {
      const frontHeavyConfig = {
        ...mockConfig,
        armorAllocation: {
          head: 9,
          centerTorso: { front: 25, rear: 2 },
          leftTorso: { front: 20, rear: 2 },
          rightTorso: { front: 20, rear: 2 },
          leftArm: 15,
          rightArm: 15,
          leftLeg: 15,
          rightLeg: 15
        }
      };
      
      const analysis = ArmorRulesValidator.getArmorDistributionAnalysis(frontHeavyConfig);
      
      expect(analysis.balance).toBe('front-heavy');
      expect(analysis.recommendations).toContain(
        expect.stringContaining('rear armor')
      );
    });

    test('should detect low head armor', () => {
      const lowHeadConfig = {
        ...mockConfig,
        armorAllocation: {
          ...mockConfig.armorAllocation,
          head: 3
        }
      };
      
      const analysis = ArmorRulesValidator.getArmorDistributionAnalysis(lowHeadConfig);
      
      expect(analysis.recommendations).toContain(
        expect.stringContaining('Head armor is very low')
      );
    });
  });

  describe('getArmorTechLevelRestrictions', () => {
    test('should return correct tech level info for Standard armor', () => {
      const restrictions = ArmorRulesValidator.getArmorTechLevelRestrictions('Standard');
      
      expect(restrictions.techLevel).toBe('Introductory');
      expect(restrictions.era).toBe('Age of War');
      expect(restrictions.availability).toBe('Common');
      expect(restrictions.restrictions).toHaveLength(0);
    });

    test('should return correct tech level info for Ferro-Fibrous (IS)', () => {
      const restrictions = ArmorRulesValidator.getArmorTechLevelRestrictions('Ferro-Fibrous (IS)');
      
      expect(restrictions.techLevel).toBe('Standard');
      expect(restrictions.era).toBe('Succession Wars');
      expect(restrictions.availability).toBe('Uncommon');
      expect(restrictions.restrictions).toContain('Requires 14 critical slots');
    });

    test('should return correct tech level info for Clan Ferro-Fibrous', () => {
      const restrictions = ArmorRulesValidator.getArmorTechLevelRestrictions('Ferro-Fibrous (Clan)');
      
      expect(restrictions.techLevel).toBe('Standard');
      expect(restrictions.availability).toBe('Common (Clan)');
      expect(restrictions.restrictions).toContain('Clan technology');
    });

    test('should return correct tech level info for advanced armor types', () => {
      const stealthRestrictions = ArmorRulesValidator.getArmorTechLevelRestrictions('Stealth');
      expect(stealthRestrictions.techLevel).toBe('Advanced');
      expect(stealthRestrictions.restrictions).toContain('Requires Guardian ECM');
      
      const hardenedRestrictions = ArmorRulesValidator.getArmorTechLevelRestrictions('Hardened');
      expect(hardenedRestrictions.techLevel).toBe('Experimental');
      expect(hardenedRestrictions.availability).toBe('Prototype');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle missing armor allocation gracefully', () => {
      const configWithoutArmor = {
        ...mockConfig,
        armorAllocation: null
      };
      
      const result = ArmorRulesValidator.validateArmorRules(configWithoutArmor);
      
      expect(result.totalArmor).toBe(0);
      expect(result.isValid).toBe(true); // No armor is technically valid
    });

    test('should handle undefined tonnage', () => {
      const configWithoutTonnage = {
        ...mockConfig,
        tonnage: undefined
      };
      
      const result = ArmorRulesValidator.validateArmorRules(configWithoutTonnage);
      
      expect(result.maxArmor).toBe(200); // Default 100 tons * 2
    });

    test('should handle mixed armor allocation formats', () => {
      const mixedConfig = {
        ...mockConfig,
        armorAllocation: {
          head: 9,
          centerTorso: { front: 20, rear: 10 }, // Object format
          leftTorso: 15, // Number format
          rightTorso: { front: 15, rear: 8 },
          leftArm: 10,
          rightArm: 10,
          leftLeg: 12,
          rightLeg: 12
        }
      };
      
      const result = ArmorRulesValidator.validateArmorRules(mixedConfig);
      
      expect(result.totalArmor).toBe(101);
      expect(result.isValid).toBe(true);
    });

    test('should validate extreme tonnage values', () => {
      const lightConfig = { ...mockConfig, tonnage: 20 };
      const assaultConfig = { ...mockConfig, tonnage: 100 };
      
      const lightResult = ArmorRulesValidator.validateArmorRules(lightConfig);
      const assaultResult = ArmorRulesValidator.validateArmorRules(assaultConfig);
      
      expect(lightResult.maxArmor).toBe(40);
      expect(assaultResult.maxArmor).toBe(200);
    });

    test('should handle component configuration object vs string', () => {
      const stringConfig = { ...mockConfig, armorType: 'Ferro-Fibrous' };
      const objectConfig = { ...mockConfig, armorType: { type: 'Ferro-Fibrous' } };
      
      const stringResult = ArmorRulesValidator.validateArmorRules(stringConfig);
      const objectResult = ArmorRulesValidator.validateArmorRules(objectConfig);
      
      expect(stringResult.armorType).toBe('Ferro-Fibrous');
      expect(objectResult.armorType).toBe('Ferro-Fibrous');
    });
  });

  describe('Performance and Optimization', () => {
    test('should handle large armor allocations efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        ArmorRulesValidator.validateArmorRules(mockConfig);
      }
      
      const end = performance.now();
      const totalTime = end - start;
      
      expect(totalTime).toBeLessThan(100); // Should complete 100 validations in under 100ms
    });

    test('should validate complex armor configurations', () => {
      const complexConfig = {
        ...mockConfig,
        tonnage: 100,
        armorType: { type: 'Ferro-Fibrous (Clan)' },
        armorAllocation: {
          head: 9,
          centerTorso: { front: 35, rear: 15 },
          leftTorso: { front: 28, rear: 12 },
          rightTorso: { front: 28, rear: 12 },
          leftArm: 20,
          rightArm: 20,
          leftLeg: 25,
          rightLeg: 25
        }
      };
      
      const result = ArmorRulesValidator.validateArmorRules(complexConfig);
      
      expect(result).toBeDefined();
      expect(result.totalArmor).toBe(189);
      expect(result.armorWeight).toBeCloseTo(12, 1); // Clan FF efficiency
    });
  });
});