/**
 * Comprehensive Test Suite for Structure Calculations
 * Tests all BattleTech structure rules, weight calculations, slot requirements, and armor calculations
 */

import {
  calculateStructureWeight,
  getStructureSlots,
  calculateMaxArmorPoints,
  getInternalStructureByLocation,
  getInternalStructurePoints,
  validateStructureType,
  getStructureCalculations,
  STRUCTURE_WEIGHT_MULTIPLIERS,
  STRUCTURE_SLOT_REQUIREMENTS,
  STRUCTURE_TECH_RESTRICTIONS
} from '../../utils/structureCalculations';
import { StructureType } from '../../types/systemComponents';

describe('Structure Calculations - BattleTech Rules', () => {

  // ===== STRUCTURE WEIGHT CALCULATIONS =====
  
  describe('Structure Weight Calculations', () => {
    
    describe('Standard Structure', () => {
      it('should calculate correct weight for Standard structure (10% of tonnage)', () => {
        expect(calculateStructureWeight(20, 'Standard')).toBe(2.0); // 20 × 0.10 = 2.0
        expect(calculateStructureWeight(35, 'Standard')).toBe(3.5); // 35 × 0.10 = 3.5
        expect(calculateStructureWeight(50, 'Standard')).toBe(5.0); // 50 × 0.10 = 5.0
        expect(calculateStructureWeight(75, 'Standard')).toBe(7.5); // 75 × 0.10 = 7.5
        expect(calculateStructureWeight(100, 'Standard')).toBe(10.0); // 100 × 0.10 = 10.0
      });

      it('should handle fractional weights correctly with rounding', () => {
        expect(calculateStructureWeight(25, 'Standard')).toBe(2.5); // 25 × 0.10 = 2.5
        expect(calculateStructureWeight(30, 'Standard')).toBe(3.0); // 30 × 0.10 = 3.0
        expect(calculateStructureWeight(55, 'Standard')).toBe(5.5); // 55 × 0.10 = 5.5
      });
    });

    describe('Endo Steel Structure', () => {
      it('should calculate Endo Steel weight as 50% of Standard (5% of tonnage)', () => {
        expect(calculateStructureWeight(20, 'Endo Steel')).toBe(1.0); // 20 × 0.05 = 1.0
        expect(calculateStructureWeight(35, 'Endo Steel')).toBe(2.0); // 35 × 0.05 = 1.75, rounded to 2.0
        expect(calculateStructureWeight(50, 'Endo Steel')).toBe(2.5); // 50 × 0.05 = 2.5
        expect(calculateStructureWeight(75, 'Endo Steel')).toBe(4.0); // 75 × 0.05 = 3.75, rounded to 4.0
        expect(calculateStructureWeight(100, 'Endo Steel')).toBe(5.0); // 100 × 0.05 = 5.0
      });
    });

    describe('Endo Steel (Clan) Structure', () => {
      it('should calculate Clan Endo Steel weight as 50% of Standard (5% of tonnage)', () => {
        expect(calculateStructureWeight(20, 'Endo Steel (Clan)')).toBe(1.0); // 20 × 0.05 = 1.0
        expect(calculateStructureWeight(35, 'Endo Steel (Clan)')).toBe(2.0); // 35 × 0.05 = 1.75, rounded to 2.0
        expect(calculateStructureWeight(50, 'Endo Steel (Clan)')).toBe(2.5); // 50 × 0.05 = 2.5
        expect(calculateStructureWeight(75, 'Endo Steel (Clan)')).toBe(4.0); // 75 × 0.05 = 3.75, rounded to 4.0
        expect(calculateStructureWeight(100, 'Endo Steel (Clan)')).toBe(5.0); // 100 × 0.05 = 5.0
      });
    });

    describe('Composite Structure', () => {
      it('should calculate Composite structure weight as 50% of Standard (5% of tonnage)', () => {
        expect(calculateStructureWeight(20, 'Composite')).toBe(1.0); // 20 × 0.05 = 1.0
        expect(calculateStructureWeight(50, 'Composite')).toBe(2.5); // 50 × 0.05 = 2.5
        expect(calculateStructureWeight(100, 'Composite')).toBe(5.0); // 100 × 0.05 = 5.0
      });
    });

    describe('Reinforced Structure', () => {
      it('should calculate Reinforced structure weight as 200% of Standard (20% of tonnage)', () => {
        expect(calculateStructureWeight(20, 'Reinforced')).toBe(4.0); // 20 × 0.20 = 4.0
        expect(calculateStructureWeight(50, 'Reinforced')).toBe(10.0); // 50 × 0.20 = 10.0
        expect(calculateStructureWeight(100, 'Reinforced')).toBe(20.0); // 100 × 0.20 = 20.0
      });
    });

    describe('Industrial Structure', () => {
      it('should calculate Industrial structure weight as 200% of Standard (20% of tonnage)', () => {
        expect(calculateStructureWeight(20, 'Industrial')).toBe(4.0); // 20 × 0.20 = 4.0
        expect(calculateStructureWeight(50, 'Industrial')).toBe(10.0); // 50 × 0.20 = 10.0
        expect(calculateStructureWeight(100, 'Industrial')).toBe(20.0); // 100 × 0.20 = 20.0
      });
    });
  });

  // ===== STRUCTURE SLOT CALCULATIONS =====
  
  describe('Structure Slot Requirements', () => {
    
    it('should return correct slot requirements for each structure type', () => {
      expect(getStructureSlots('Standard')).toBe(0);
      expect(getStructureSlots('Endo Steel')).toBe(14);
      expect(getStructureSlots('Endo Steel (Clan)')).toBe(7);
      expect(getStructureSlots('Composite')).toBe(0);
      expect(getStructureSlots('Reinforced')).toBe(0);
      expect(getStructureSlots('Industrial')).toBe(0);
    });

    it('should be consistent with STRUCTURE_SLOT_REQUIREMENTS constant', () => {
      Object.entries(STRUCTURE_SLOT_REQUIREMENTS).forEach(([structureType, expectedSlots]) => {
        expect(getStructureSlots(structureType as StructureType)).toBe(expectedSlots);
      });
    });
  });

  // ===== INTERNAL STRUCTURE CALCULATIONS =====
  
  describe('Internal Structure Calculations', () => {
    
    it('should calculate total internal structure points correctly', () => {
      // Test common mech weights using expected totals from official tables
      expect(getInternalStructurePoints(20)).toBeGreaterThan(0);
      expect(getInternalStructurePoints(35)).toBeGreaterThan(0);
      expect(getInternalStructurePoints(50)).toBeGreaterThan(0);
      expect(getInternalStructurePoints(75)).toBeGreaterThan(0);
      expect(getInternalStructurePoints(100)).toBeGreaterThan(0);
      
      // Internal structure should increase with tonnage
      expect(getInternalStructurePoints(50)).toBeGreaterThan(getInternalStructurePoints(35));
      expect(getInternalStructurePoints(75)).toBeGreaterThan(getInternalStructurePoints(50));
      expect(getInternalStructurePoints(100)).toBeGreaterThan(getInternalStructurePoints(75));
    });

    it('should provide internal structure breakdown by location', () => {
      const structure50ton = getInternalStructureByLocation(50);
      
      // Verify all locations are present
      expect(structure50ton).toHaveProperty('head');
      expect(structure50ton).toHaveProperty('centerTorso');
      expect(structure50ton).toHaveProperty('leftTorso');
      expect(structure50ton).toHaveProperty('rightTorso');
      expect(structure50ton).toHaveProperty('leftArm');
      expect(structure50ton).toHaveProperty('rightArm');
      expect(structure50ton).toHaveProperty('leftLeg');
      expect(structure50ton).toHaveProperty('rightLeg');
      
      // All locations should have positive values
      Object.values(structure50ton).forEach(value => {
        expect(value).toBeGreaterThan(0);
      });
      
      // Center torso should be the strongest
      expect(structure50ton.centerTorso).toBeGreaterThan(structure50ton.head);
      expect(structure50ton.centerTorso).toBeGreaterThan(structure50ton.leftTorso);
      expect(structure50ton.centerTorso).toBeGreaterThan(structure50ton.rightTorso);
    });

    it('should have symmetric structure values for paired locations', () => {
      const structure = getInternalStructureByLocation(75);
      
      // Arms should be symmetric
      expect(structure.leftArm).toBe(structure.rightArm);
      
      // Legs should be symmetric
      expect(structure.leftLeg).toBe(structure.rightLeg);
      
      // Side torsos should be symmetric
      expect(structure.leftTorso).toBe(structure.rightTorso);
    });
  });

  // ===== ARMOR CALCULATIONS =====
  
  describe('Armor Calculations', () => {
    
    it('should calculate maximum armor points as 2x internal structure', () => {
      const tonnages = [20, 35, 50, 75, 100];
      
      tonnages.forEach(tonnage => {
        const internalStructure = getInternalStructurePoints(tonnage);
        const maxArmor = calculateMaxArmorPoints(tonnage, 'Standard');
        expect(maxArmor).toBe(Math.floor(internalStructure * 2));
      });
    });

    it('should provide same max armor regardless of structure type', () => {
      const structureTypes: StructureType[] = ['Standard', 'Endo Steel', 'Endo Steel (Clan)', 'Composite', 'Reinforced', 'Industrial'];
      
      structureTypes.forEach(type => {
        const maxArmor = calculateMaxArmorPoints(50, type);
        expect(maxArmor).toBe(calculateMaxArmorPoints(50, 'Standard'));
      });
    });

    it('should calculate armor for different tonnages', () => {
      expect(calculateMaxArmorPoints(20, 'Standard')).toBeGreaterThan(0);
      expect(calculateMaxArmorPoints(35, 'Standard')).toBeGreaterThan(calculateMaxArmorPoints(20, 'Standard'));
      expect(calculateMaxArmorPoints(50, 'Standard')).toBeGreaterThan(calculateMaxArmorPoints(35, 'Standard'));
      expect(calculateMaxArmorPoints(75, 'Standard')).toBeGreaterThan(calculateMaxArmorPoints(50, 'Standard'));
      expect(calculateMaxArmorPoints(100, 'Standard')).toBeGreaterThan(calculateMaxArmorPoints(75, 'Standard'));
    });
  });

  // ===== STRUCTURE TYPE VALIDATION =====
  
  describe('Structure Type Validation', () => {
    
    describe('Standard Structure', () => {
      it('should be valid for all tech bases and rules levels', () => {
        expect(validateStructureType('Standard', 'Inner Sphere', 'Standard')).toBe(true);
        expect(validateStructureType('Standard', 'Clan', 'Standard')).toBe(true);
        expect(validateStructureType('Standard', 'Both', 'Standard')).toBe(true);
        expect(validateStructureType('Standard', 'Inner Sphere', 'Tournament')).toBe(true);
        expect(validateStructureType('Standard', 'Inner Sphere', 'Advanced')).toBe(true);
        expect(validateStructureType('Standard', 'Inner Sphere', 'Experimental')).toBe(true);
      });
    });

    describe('Endo Steel Structure', () => {
      it('should be valid for Inner Sphere tech base and Tournament+ rules', () => {
        expect(validateStructureType('Endo Steel', 'Inner Sphere', 'Tournament')).toBe(true);
        expect(validateStructureType('Endo Steel', 'Inner Sphere', 'Advanced')).toBe(true);
        expect(validateStructureType('Endo Steel', 'Inner Sphere', 'Experimental')).toBe(true);
        expect(validateStructureType('Endo Steel', 'Both', 'Tournament')).toBe(true);
        
        // Should be invalid for Standard rules
        expect(validateStructureType('Endo Steel', 'Inner Sphere', 'Standard')).toBe(false);
        
        // Should be valid for Clan tech base (since Both is allowed)
        expect(validateStructureType('Endo Steel', 'Clan', 'Tournament')).toBe(true);
      });
    });

    describe('Endo Steel (Clan) Structure', () => {
      it('should be valid for Clan tech base and Tournament+ rules', () => {
        expect(validateStructureType('Endo Steel (Clan)', 'Clan', 'Tournament')).toBe(true);
        expect(validateStructureType('Endo Steel (Clan)', 'Clan', 'Advanced')).toBe(true);
        expect(validateStructureType('Endo Steel (Clan)', 'Clan', 'Experimental')).toBe(true);
        
        // Should be invalid for Standard rules
        expect(validateStructureType('Endo Steel (Clan)', 'Clan', 'Standard')).toBe(false);
        
        // Should be invalid for Inner Sphere tech base
        expect(validateStructureType('Endo Steel (Clan)', 'Inner Sphere', 'Tournament')).toBe(false);
        expect(validateStructureType('Endo Steel (Clan)', 'Both', 'Tournament')).toBe(false);
      });
    });

    describe('Composite Structure', () => {
      it('should be valid for Both tech base and Experimental rules only', () => {
        expect(validateStructureType('Composite', 'Both', 'Experimental')).toBe(true);
        
        // Should be invalid for all other rules levels
        expect(validateStructureType('Composite', 'Both', 'Standard')).toBe(false);
        expect(validateStructureType('Composite', 'Both', 'Tournament')).toBe(false);
        expect(validateStructureType('Composite', 'Both', 'Advanced')).toBe(false);
        
        // Should be valid for specific tech bases (since Both is allowed)
        expect(validateStructureType('Composite', 'Inner Sphere', 'Experimental')).toBe(true);
        expect(validateStructureType('Composite', 'Clan', 'Experimental')).toBe(true);
      });
    });

    describe('Reinforced Structure', () => {
      it('should be valid for Both tech base and Advanced+ rules', () => {
        expect(validateStructureType('Reinforced', 'Both', 'Advanced')).toBe(true);
        expect(validateStructureType('Reinforced', 'Both', 'Experimental')).toBe(true);
        
        // Should be invalid for Standard/Tournament rules
        expect(validateStructureType('Reinforced', 'Both', 'Standard')).toBe(false);
        expect(validateStructureType('Reinforced', 'Both', 'Tournament')).toBe(false);
        
        // Should be valid for specific tech bases (since Both is allowed)
        expect(validateStructureType('Reinforced', 'Inner Sphere', 'Advanced')).toBe(true);
        expect(validateStructureType('Reinforced', 'Clan', 'Advanced')).toBe(true);
      });
    });

    describe('Industrial Structure', () => {
      it('should be valid for Both tech base and all rules levels', () => {
        expect(validateStructureType('Industrial', 'Both', 'Standard')).toBe(true);
        expect(validateStructureType('Industrial', 'Both', 'Tournament')).toBe(true);
        expect(validateStructureType('Industrial', 'Both', 'Advanced')).toBe(true);
        expect(validateStructureType('Industrial', 'Both', 'Experimental')).toBe(true);
        
        // Should be valid for specific tech bases (since Both is allowed)
        expect(validateStructureType('Industrial', 'Inner Sphere', 'Standard')).toBe(true);
        expect(validateStructureType('Industrial', 'Clan', 'Standard')).toBe(true);
      });
    });
  });

  // ===== COMPREHENSIVE STRUCTURE CALCULATIONS =====
  
  describe('Comprehensive Structure Calculations', () => {
    
    it('should provide complete calculations for Standard structure', () => {
      const result = getStructureCalculations(50, 'Standard');
      
      expect(result.weight).toBe(5.0); // 50 × 0.10 = 5.0
      expect(result.slots).toBe(0);
      expect(result.isValid).toBe(true);
      expect(result.maxArmor).toBeGreaterThan(0);
    });

    it('should provide complete calculations for Endo Steel structure', () => {
      const result = getStructureCalculations(75, 'Endo Steel');
      
      expect(result.weight).toBe(4.0); // 75 × 0.05 = 3.75, rounded to 4.0
      expect(result.slots).toBe(14);
      expect(result.isValid).toBe(true);
      expect(result.maxArmor).toBeGreaterThan(0);
    });

    it('should provide complete calculations for Clan Endo Steel structure', () => {
      const result = getStructureCalculations(100, 'Endo Steel (Clan)');
      
      expect(result.weight).toBe(5.0); // 100 × 0.05 = 5.0
      expect(result.slots).toBe(7);
      expect(result.isValid).toBe(true);
      expect(result.maxArmor).toBeGreaterThan(0);
    });

    it('should provide complete calculations for Reinforced structure', () => {
      const result = getStructureCalculations(50, 'Reinforced');
      
      expect(result.weight).toBe(10.0); // 50 × 0.20 = 10.0
      expect(result.slots).toBe(0);
      expect(result.isValid).toBe(true);
      expect(result.maxArmor).toBeGreaterThan(0);
    });
  });

  // ===== EDGE CASES AND ERROR CONDITIONS =====
  
  describe('Edge Cases and Error Conditions', () => {
    
    it('should handle minimum tonnage mechs (20 tons)', () => {
      const result = getStructureCalculations(20, 'Standard');
      expect(result.weight).toBe(2.0);
      expect(result.maxArmor).toBeGreaterThan(0);
      
      const internalStructure = getInternalStructureByLocation(20);
      expect(internalStructure.head).toBeGreaterThan(0);
      expect(internalStructure.centerTorso).toBeGreaterThan(0);
    });

    it('should handle maximum tonnage mechs (100 tons)', () => {
      const result = getStructureCalculations(100, 'Standard');
      expect(result.weight).toBe(10.0);
      expect(result.maxArmor).toBeGreaterThan(0);
      
      const internalStructure = getInternalStructureByLocation(100);
      expect(internalStructure.head).toBeGreaterThan(0);
      expect(internalStructure.centerTorso).toBeGreaterThan(0);
    });

    it('should handle fractional weight calculations correctly', () => {
      // Test cases that require rounding to nearest 0.5 ton
      expect(calculateStructureWeight(25, 'Endo Steel')).toBe(1.5); // 25 × 0.05 = 1.25, rounded to 1.5
      expect(calculateStructureWeight(35, 'Endo Steel')).toBe(2.0); // 35 × 0.05 = 1.75, rounded to 2.0
      expect(calculateStructureWeight(45, 'Endo Steel')).toBe(2.5); // 45 × 0.05 = 2.25, rounded to 2.5
    });

    it('should validate all constants are properly defined', () => {
      const allStructureTypes: StructureType[] = ['Standard', 'Endo Steel', 'Endo Steel (Clan)', 'Composite', 'Reinforced', 'Industrial'];
      
      allStructureTypes.forEach(structureType => {
        expect(STRUCTURE_WEIGHT_MULTIPLIERS[structureType]).toBeDefined();
        expect(STRUCTURE_SLOT_REQUIREMENTS[structureType]).toBeDefined();
        expect(STRUCTURE_TECH_RESTRICTIONS[structureType]).toBeDefined();
      });
    });
  });

  // ===== INTEGRATION TESTS =====
  
  describe('Integration Tests', () => {
    
    it('should validate complete structure configurations for different tonnages', () => {
      const testCases = [
        { tonnage: 20, structureType: 'Standard' as StructureType, expectedWeight: 2.0, expectedSlots: 0 },
        { tonnage: 35, structureType: 'Endo Steel' as StructureType, expectedWeight: 2.0, expectedSlots: 14 },
        { tonnage: 50, structureType: 'Endo Steel (Clan)' as StructureType, expectedWeight: 2.5, expectedSlots: 7 },
        { tonnage: 75, structureType: 'Reinforced' as StructureType, expectedWeight: 15.0, expectedSlots: 0 },
        { tonnage: 100, structureType: 'Industrial' as StructureType, expectedWeight: 20.0, expectedSlots: 0 }
      ];

      testCases.forEach(({ tonnage, structureType, expectedWeight, expectedSlots }) => {
        const calculations = getStructureCalculations(tonnage, structureType);
        expect(calculations.weight).toBe(expectedWeight);
        expect(calculations.slots).toBe(expectedSlots);
        expect(calculations.isValid).toBe(true);
        expect(calculations.maxArmor).toBeGreaterThan(0);
      });
    });

    it('should validate weight multipliers are correctly applied', () => {
      Object.entries(STRUCTURE_WEIGHT_MULTIPLIERS).forEach(([structureType, multiplier]) => {
        const tonnage = 50;
        const calculatedWeight = calculateStructureWeight(tonnage, structureType as StructureType);
        const baseWeight = tonnage * multiplier;
        const expectedWeight = Math.ceil(baseWeight * 2) / 2; // Round to 0.5
        expect(calculatedWeight).toBe(expectedWeight);
      });
    });

    it('should validate tech restrictions for common scenarios', () => {
      // Tournament legal combinations
      expect(validateStructureType('Standard', 'Inner Sphere', 'Tournament')).toBe(true);
      expect(validateStructureType('Endo Steel', 'Inner Sphere', 'Tournament')).toBe(true);
      expect(validateStructureType('Endo Steel (Clan)', 'Clan', 'Tournament')).toBe(true);
      
      // Advanced combinations
      expect(validateStructureType('Reinforced', 'Both', 'Advanced')).toBe(true);
      expect(validateStructureType('Composite', 'Both', 'Experimental')).toBe(true);
      
      // Invalid combinations
      expect(validateStructureType('Endo Steel', 'Inner Sphere', 'Standard')).toBe(false);
      expect(validateStructureType('Composite', 'Inner Sphere', 'Advanced')).toBe(false);
    });
  });

  // ===== CONSTANTS VALIDATION =====
  
  describe('Constants Validation', () => {
    
    it('should have correct structure weight multipliers', () => {
      expect(STRUCTURE_WEIGHT_MULTIPLIERS['Standard']).toBe(0.10);
      expect(STRUCTURE_WEIGHT_MULTIPLIERS['Endo Steel']).toBe(0.05);
      expect(STRUCTURE_WEIGHT_MULTIPLIERS['Endo Steel (Clan)']).toBe(0.05);
      expect(STRUCTURE_WEIGHT_MULTIPLIERS['Composite']).toBe(0.05);
      expect(STRUCTURE_WEIGHT_MULTIPLIERS['Reinforced']).toBe(0.20);
      expect(STRUCTURE_WEIGHT_MULTIPLIERS['Industrial']).toBe(0.20);
    });

    it('should have correct structure slot requirements', () => {
      expect(STRUCTURE_SLOT_REQUIREMENTS['Standard']).toBe(0);
      expect(STRUCTURE_SLOT_REQUIREMENTS['Endo Steel']).toBe(14);
      expect(STRUCTURE_SLOT_REQUIREMENTS['Endo Steel (Clan)']).toBe(7);
      expect(STRUCTURE_SLOT_REQUIREMENTS['Composite']).toBe(0);
      expect(STRUCTURE_SLOT_REQUIREMENTS['Reinforced']).toBe(0);
      expect(STRUCTURE_SLOT_REQUIREMENTS['Industrial']).toBe(0);
    });

    it('should have proper tech restrictions defined', () => {
      Object.values(STRUCTURE_TECH_RESTRICTIONS).forEach(restriction => {
        expect(restriction.techBase).toBeDefined();
        expect(restriction.rulesLevel).toBeDefined();
        expect(Array.isArray(restriction.techBase)).toBe(true);
        expect(Array.isArray(restriction.rulesLevel)).toBe(true);
      });
    });
  });

  // ===== PERFORMANCE AND OPTIMIZATION TESTS =====
  
  describe('Performance and Optimization', () => {
    
    it('should handle rapid calculations efficiently', () => {
      const startTime = Date.now();
      
      // Perform many calculations
      for (let i = 0; i < 1000; i++) {
        const tonnage = 20 + (i % 80); // 20-100 tons
        const structureType = ['Standard', 'Endo Steel', 'Reinforced'][i % 3] as StructureType;
        getStructureCalculations(tonnage, structureType);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second for 1000 calculations
    });

    it('should provide consistent results for repeated calculations', () => {
      const tonnage = 50;
      const structureType = 'Endo Steel';
      
      const result1 = getStructureCalculations(tonnage, structureType);
      const result2 = getStructureCalculations(tonnage, structureType);
      const result3 = getStructureCalculations(tonnage, structureType);
      
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });
  });
});
