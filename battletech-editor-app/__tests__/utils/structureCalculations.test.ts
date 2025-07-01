/**
 * Structure Calculations Tests
 * Tests for Endo Steel weight reduction and other structure calculations
 */

import {
  calculateStructureWeight,
  getStructureSlots,
  STRUCTURE_WEIGHT_MULTIPLIERS,
  STRUCTURE_SLOT_REQUIREMENTS,
  validateStructureType,
  getStructureCalculations
} from '../../utils/structureCalculations';

describe('Structure Calculations', () => {
  describe('calculateStructureWeight', () => {
    test('Standard structure should be 10% of mech tonnage', () => {
      expect(calculateStructureWeight(50, 'Standard')).toBe(5.0);
      expect(calculateStructureWeight(75, 'Standard')).toBe(7.5);
      expect(calculateStructureWeight(100, 'Standard')).toBe(10.0);
    });

    test('Endo Steel should be 50% weight reduction (5% of mech tonnage)', () => {
      expect(calculateStructureWeight(50, 'Endo Steel')).toBe(2.5);
      expect(calculateStructureWeight(75, 'Endo Steel')).toBe(4.0); // Rounded up to nearest 0.5
      expect(calculateStructureWeight(100, 'Endo Steel')).toBe(5.0);
    });

    test('Clan Endo Steel should be 50% weight reduction (5% of mech tonnage)', () => {
      expect(calculateStructureWeight(50, 'Endo Steel (Clan)')).toBe(2.5);
      expect(calculateStructureWeight(75, 'Endo Steel (Clan)')).toBe(4.0); // Rounded up to nearest 0.5
      expect(calculateStructureWeight(100, 'Endo Steel (Clan)')).toBe(5.0);
    });

    test('Weight should round to nearest 0.5 ton', () => {
      // 60 tons * 0.05 = 3.0 tons (exact)
      expect(calculateStructureWeight(60, 'Endo Steel')).toBe(3.0);
      
      // 70 tons * 0.05 = 3.5 tons (exact)
      expect(calculateStructureWeight(70, 'Endo Steel')).toBe(3.5);
      
      // 65 tons * 0.05 = 3.25 tons -> rounds up to 3.5
      expect(calculateStructureWeight(65, 'Endo Steel')).toBe(3.5);
    });

    test('Industrial structure should be 20% of mech tonnage', () => {
      expect(calculateStructureWeight(50, 'Industrial')).toBe(10.0);
      expect(calculateStructureWeight(100, 'Industrial')).toBe(20.0);
    });
  });

  describe('getStructureSlots', () => {
    test('Standard structure requires no critical slots', () => {
      expect(getStructureSlots('Standard')).toBe(0);
    });

    test('Endo Steel requires 14 critical slots for Inner Sphere', () => {
      expect(getStructureSlots('Endo Steel')).toBe(14);
    });

    test('Clan Endo Steel requires 7 critical slots', () => {
      expect(getStructureSlots('Endo Steel (Clan)')).toBe(7);
    });

    test('Industrial structure requires no critical slots', () => {
      expect(getStructureSlots('Industrial')).toBe(0);
    });
  });

  describe('validateStructureType', () => {
    test('Standard structure is valid for both tech bases and all rules levels', () => {
      expect(validateStructureType('Standard', 'Inner Sphere', 'Standard')).toBe(true);
      expect(validateStructureType('Standard', 'Clan', 'Standard')).toBe(true);
      expect(validateStructureType('Standard', 'Both', 'Tournament')).toBe(true);
    });

    test('Endo Steel is only valid for Inner Sphere at Tournament+ rules', () => {
      expect(validateStructureType('Endo Steel', 'Inner Sphere', 'Tournament')).toBe(true);
      expect(validateStructureType('Endo Steel', 'Inner Sphere', 'Advanced')).toBe(true);
      expect(validateStructureType('Endo Steel', 'Inner Sphere', 'Standard')).toBe(false);
      expect(validateStructureType('Endo Steel', 'Clan', 'Tournament')).toBe(false);
    });

    test('Clan Endo Steel is only valid for Clan at Tournament+ rules', () => {
      expect(validateStructureType('Endo Steel (Clan)', 'Clan', 'Tournament')).toBe(true);
      expect(validateStructureType('Endo Steel (Clan)', 'Clan', 'Advanced')).toBe(true);
      expect(validateStructureType('Endo Steel (Clan)', 'Inner Sphere', 'Tournament')).toBe(false);
      expect(validateStructureType('Endo Steel (Clan)', 'Clan', 'Standard')).toBe(false);
    });
  });

  describe('getStructureCalculations', () => {
    test('Should return complete calculation result for Endo Steel', () => {
      const result = getStructureCalculations(75, 'Endo Steel');
      
      expect(result.weight).toBe(4.0); // 75 * 0.05 = 3.75 -> rounds to 4.0
      expect(result.slots).toBe(14);
      expect(result.isValid).toBe(true);
      expect(result.maxArmor).toBeGreaterThan(0); // Should have armor calculation
    });

    test('Should return complete calculation result for Standard', () => {
      const result = getStructureCalculations(50, 'Standard');
      
      expect(result.weight).toBe(5.0); // 50 * 0.10 = 5.0
      expect(result.slots).toBe(0);
      expect(result.isValid).toBe(true);
      expect(result.maxArmor).toBeGreaterThan(0); // Should have armor calculation
    });
  });

  describe('STRUCTURE_WEIGHT_MULTIPLIERS constants', () => {
    test('Should have correct weight multipliers', () => {
      expect(STRUCTURE_WEIGHT_MULTIPLIERS['Standard']).toBe(0.10);
      expect(STRUCTURE_WEIGHT_MULTIPLIERS['Endo Steel']).toBe(0.05);
      expect(STRUCTURE_WEIGHT_MULTIPLIERS['Endo Steel (Clan)']).toBe(0.05);
      expect(STRUCTURE_WEIGHT_MULTIPLIERS['Industrial']).toBe(0.20);
      expect(STRUCTURE_WEIGHT_MULTIPLIERS['Reinforced']).toBe(0.20);
      expect(STRUCTURE_WEIGHT_MULTIPLIERS['Composite']).toBe(0.05);
    });
  });

  describe('STRUCTURE_SLOT_REQUIREMENTS constants', () => {
    test('Should have correct slot requirements', () => {
      expect(STRUCTURE_SLOT_REQUIREMENTS['Standard']).toBe(0);
      expect(STRUCTURE_SLOT_REQUIREMENTS['Endo Steel']).toBe(14);
      expect(STRUCTURE_SLOT_REQUIREMENTS['Endo Steel (Clan)']).toBe(7);
      expect(STRUCTURE_SLOT_REQUIREMENTS['Industrial']).toBe(0);
      expect(STRUCTURE_SLOT_REQUIREMENTS['Reinforced']).toBe(0);
      expect(STRUCTURE_SLOT_REQUIREMENTS['Composite']).toBe(0);
    });
  });

  describe('Real-world BattleTech examples', () => {
    test('Atlas AS7-D (100-ton Standard structure)', () => {
      const weight = calculateStructureWeight(100, 'Standard');
      expect(weight).toBe(10.0); // 10 tons for 100-ton Atlas
    });

    test('Centurion CN9-A (50-ton Standard structure)', () => {
      const weight = calculateStructureWeight(50, 'Standard');
      expect(weight).toBe(5.0); // 5 tons for 50-ton Centurion
    });

    test('Hypothetical 75-ton Endo Steel mech', () => {
      const standardWeight = calculateStructureWeight(75, 'Standard'); // 7.5 tons
      const endoWeight = calculateStructureWeight(75, 'Endo Steel'); // 4.0 tons (3.75 rounded up)
      
      expect(standardWeight).toBe(7.5);
      expect(endoWeight).toBe(4.0);
      expect(standardWeight - endoWeight).toBe(3.5); // 3.5 tons saved
    });

    test('Clan Timber Wolf with Endo Steel', () => {
      const standardWeight = calculateStructureWeight(75, 'Standard'); // 7.5 tons
      const clanEndoWeight = calculateStructureWeight(75, 'Endo Steel (Clan)'); // 4.0 tons
      const clanEndoSlots = getStructureSlots('Endo Steel (Clan)'); // 7 slots
      
      expect(standardWeight).toBe(7.5);
      expect(clanEndoWeight).toBe(4.0);
      expect(clanEndoSlots).toBe(7); // Half the slots of IS Endo Steel
    });
  });
});
