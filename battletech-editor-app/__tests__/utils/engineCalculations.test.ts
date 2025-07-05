/**
 * Comprehensive Test Suite for Engine Calculations
 * Tests all BattleTech engine rules, weight calculations, and heat sink capacity
 */

import {
  calculateEngineWeight,
  calculateEngineSlots,
  getEngineSlotDistribution,
  calculateIntegratedHeatSinks,
  getEngineCalculations,
  validateEngineRating,
  calculateWalkMP,
  calculateRequiredEngineRating,
  ENGINE_WEIGHT_MULTIPLIERS,
  ENGINE_SLOT_REQUIREMENTS,
  ENGINE_HEAT_SINKS
} from '../../utils/engineCalculations';
import { EngineType } from '../../types/systemComponents';

describe('Engine Calculations - BattleTech Rules', () => {

  // ===== ENGINE WEIGHT CALCULATIONS =====
  
  describe('Engine Weight Calculations', () => {
    
    describe('Standard Fusion Engines', () => {
      it('should calculate correct weight for Standard engines', () => {
        // Test with 50-ton mech
        expect(calculateEngineWeight(200, 50, 'Standard')).toBe(10.0); // (200 * 50) / 1000 * 1.0 = 10.0
        expect(calculateEngineWeight(250, 50, 'Standard')).toBe(12.5); // (250 * 50) / 1000 * 1.0 = 12.5
        expect(calculateEngineWeight(300, 50, 'Standard')).toBe(15.0); // (300 * 50) / 1000 * 1.0 = 15.0
      });

      it('should calculate correct weight for different tonnages', () => {
        expect(calculateEngineWeight(200, 25, 'Standard')).toBe(5.0);  // (200 * 25) / 1000 = 5.0
        expect(calculateEngineWeight(200, 75, 'Standard')).toBe(15.0); // (200 * 75) / 1000 = 15.0
        expect(calculateEngineWeight(200, 100, 'Standard')).toBe(20.0); // (200 * 100) / 1000 = 20.0
      });
    });

    describe('XL Fusion Engines', () => {
      it('should calculate XL (IS) engine weight as 50% of Standard', () => {
        expect(calculateEngineWeight(200, 50, 'XL (IS)')).toBe(5.0); // 50% of 10.0
        expect(calculateEngineWeight(300, 50, 'XL (IS)')).toBe(7.5); // 50% of 15.0
        expect(calculateEngineWeight(400, 50, 'XL (IS)')).toBe(10.0); // 50% of 20.0
      });

      it('should calculate XL (Clan) engine weight as 50% of Standard', () => {
        expect(calculateEngineWeight(200, 50, 'XL (Clan)')).toBe(5.0); // 50% of 10.0
        expect(calculateEngineWeight(300, 50, 'XL (Clan)')).toBe(7.5); // 50% of 15.0
        expect(calculateEngineWeight(400, 50, 'XL (Clan)')).toBe(10.0); // 50% of 20.0
      });
    });

    describe('Light Fusion Engines', () => {
      it('should calculate Light engine weight as 75% of Standard', () => {
        expect(calculateEngineWeight(200, 50, 'Light')).toBe(7.5); // 75% of 10.0
        expect(calculateEngineWeight(300, 50, 'Light')).toBe(11.5); // 75% of 15.0 rounded to 0.5
        expect(calculateEngineWeight(400, 50, 'Light')).toBe(15.0); // 75% of 20.0
      });
    });

    describe('XXL Fusion Engines', () => {
      it('should calculate XXL engine weight as 33% of Standard', () => {
        expect(calculateEngineWeight(200, 50, 'XXL')).toBe(3.5); // 33% of 10.0 rounded to 0.5
        expect(calculateEngineWeight(300, 50, 'XXL')).toBe(5.0); // 33% of 15.0 rounded to 0.5
        expect(calculateEngineWeight(400, 50, 'XXL')).toBe(7.0); // 33% of 20.0 rounded to 0.5
      });
    });

    describe('Compact Fusion Engines', () => {
      it('should calculate Compact engine weight as 150% of Standard', () => {
        expect(calculateEngineWeight(200, 50, 'Compact')).toBe(15.0); // 150% of 10.0
        expect(calculateEngineWeight(300, 50, 'Compact')).toBe(22.5); // 150% of 15.0
        expect(calculateEngineWeight(400, 50, 'Compact')).toBe(30.0); // 150% of 20.0
      });
    });

    describe('ICE Engines', () => {
      it('should calculate ICE engine weight using 200% multiplier', () => {
        expect(calculateEngineWeight(100, 50, 'ICE')).toBe(10.0); // (100 * 50) / 1000 * 2.0 = 10.0
        expect(calculateEngineWeight(200, 50, 'ICE')).toBe(20.0); // (200 * 50) / 1000 * 2.0 = 20.0
        expect(calculateEngineWeight(300, 50, 'ICE')).toBe(30.0); // (300 * 50) / 1000 * 2.0 = 30.0
      });
    });

    describe('Fuel Cell Engines', () => {
      it('should calculate Fuel Cell engine weight using 150% multiplier', () => {
        expect(calculateEngineWeight(100, 50, 'Fuel Cell')).toBe(7.5); // (100 * 50) / 1000 * 1.5 = 7.5
        expect(calculateEngineWeight(200, 50, 'Fuel Cell')).toBe(15.0); // (200 * 50) / 1000 * 1.5 = 15.0
        expect(calculateEngineWeight(300, 50, 'Fuel Cell')).toBe(22.5); // (300 * 50) / 1000 * 1.5 = 22.5
      });
    });
  });

  // ===== ENGINE SLOT CALCULATIONS =====
  
  describe('Engine Slot Calculations', () => {
    
    it('should calculate correct total slots for each engine type', () => {
      expect(calculateEngineSlots('Standard')).toBe(6);    // 6 CT + 0 + 0
      expect(calculateEngineSlots('XL (IS)')).toBe(12);    // 6 CT + 3 LT + 3 RT
      expect(calculateEngineSlots('XL (Clan)')).toBe(10);  // 6 CT + 2 LT + 2 RT
      expect(calculateEngineSlots('Light')).toBe(10);      // 6 CT + 2 LT + 2 RT
      expect(calculateEngineSlots('XXL')).toBe(18);        // 6 CT + 6 LT + 6 RT
      expect(calculateEngineSlots('Compact')).toBe(3);     // 3 CT + 0 + 0
      expect(calculateEngineSlots('ICE')).toBe(6);         // 6 CT + 0 + 0
      expect(calculateEngineSlots('Fuel Cell')).toBe(6);   // 6 CT + 0 + 0
    });

    it('should provide correct slot distribution for each engine type', () => {
      const standardDist = getEngineSlotDistribution('Standard');
      expect(standardDist).toEqual({ centerTorso: 6, leftTorso: 0, rightTorso: 0 });

      const xlISDist = getEngineSlotDistribution('XL (IS)');
      expect(xlISDist).toEqual({ centerTorso: 6, leftTorso: 3, rightTorso: 3 });

      const xlClanDist = getEngineSlotDistribution('XL (Clan)');
      expect(xlClanDist).toEqual({ centerTorso: 6, leftTorso: 2, rightTorso: 2 });

      const lightDist = getEngineSlotDistribution('Light');
      expect(lightDist).toEqual({ centerTorso: 6, leftTorso: 2, rightTorso: 2 });

      const xxlDist = getEngineSlotDistribution('XXL');
      expect(xxlDist).toEqual({ centerTorso: 6, leftTorso: 6, rightTorso: 6 });

      const compactDist = getEngineSlotDistribution('Compact');
      expect(compactDist).toEqual({ centerTorso: 3, leftTorso: 0, rightTorso: 0 });
    });
  });

  // ===== INTEGRATED HEAT SINK CALCULATIONS =====
  
  describe('Integrated Heat Sink Calculations', () => {
    
    it('should calculate integrated heat sinks for fusion engines', () => {
      expect(calculateIntegratedHeatSinks(100, 'Standard')).toBe(4);  // 100 ÷ 25 = 4
      expect(calculateIntegratedHeatSinks(200, 'Standard')).toBe(8);  // 200 ÷ 25 = 8
      expect(calculateIntegratedHeatSinks(250, 'Standard')).toBe(10); // 250 ÷ 25 = 10
      expect(calculateIntegratedHeatSinks(300, 'Standard')).toBe(12); // 300 ÷ 25 = 12 (official BattleTech rule)
      expect(calculateIntegratedHeatSinks(400, 'Standard')).toBe(16); // 400 ÷ 25 = 16 (official BattleTech rule)
    });

    it('should return 0 heat sinks for non-fusion engines', () => {
      expect(calculateIntegratedHeatSinks(200, 'ICE')).toBe(0);
      expect(calculateIntegratedHeatSinks(200, 'Fuel Cell')).toBe(0);
    });

    it('should handle engines below 250 rating correctly', () => {
      expect(calculateIntegratedHeatSinks(175, 'XL (IS)')).toBe(7);  // 175 ÷ 25 = 7
      expect(calculateIntegratedHeatSinks(225, 'Light')).toBe(9);    // 225 ÷ 25 = 9
      expect(calculateIntegratedHeatSinks(75, 'Compact')).toBe(3);   // 75 ÷ 25 = 3
    });
  });

  // ===== MOVEMENT POINT CALCULATIONS =====
  
  describe('Movement Point Calculations', () => {
    
    it('should calculate walk MP from engine rating and tonnage', () => {
      expect(calculateWalkMP(200, 50)).toBe(4);  // 200 ÷ 50 = 4 MP
      expect(calculateWalkMP(300, 75)).toBe(4);  // 300 ÷ 75 = 4 MP
      expect(calculateWalkMP(400, 100)).toBe(4); // 400 ÷ 100 = 4 MP
    });

    it('should handle fractional MP correctly', () => {
      expect(calculateWalkMP(225, 75)).toBe(3);  // 225 ÷ 75 = 3 MP
      expect(calculateWalkMP(340, 85)).toBe(4);  // 340 ÷ 85 = 4 MP
      expect(calculateWalkMP(195, 65)).toBe(3);  // 195 ÷ 65 = 3 MP
    });

    it('should calculate required engine rating for desired MP', () => {
      expect(calculateRequiredEngineRating(4, 50)).toBe(200);  // 4 × 50 = 200
      expect(calculateRequiredEngineRating(3, 75)).toBe(225);  // 3 × 75 = 225
      expect(calculateRequiredEngineRating(5, 20)).toBe(100);  // 5 × 20 = 100
    });
  });

  // ===== ENGINE VALIDATION =====
  
  describe('Engine Validation', () => {
    
    it('should validate engine ratings within reasonable limits', () => {
      expect(validateEngineRating(200, 50)).toBe(true);   // Valid: 50 tons, 4 MP
      expect(validateEngineRating(50, 50)).toBe(true);    // Valid: 50 tons, 1 MP
      expect(validateEngineRating(400, 50)).toBe(true);   // Valid: 50 tons, 8 MP
      expect(validateEngineRating(1000, 50)).toBe(true);  // Valid: 50 tons, 20 MP (default max)
    });

    it('should reject invalid engine ratings', () => {
      expect(validateEngineRating(25, 50)).toBe(false);   // Invalid: Less than 1 MP
      expect(validateEngineRating(1050, 50)).toBe(false); // Invalid: Over 20 MP default limit
    });

    it('should respect custom maximum walk MP', () => {
      expect(validateEngineRating(400, 50, 8)).toBe(true);   // Valid: 8 MP with max 8
      expect(validateEngineRating(450, 50, 8)).toBe(false);  // Invalid: 9 MP with max 8
      expect(validateEngineRating(500, 50, 10)).toBe(true);  // Valid: 10 MP with max 10
    });
  });

  // ===== COMPREHENSIVE ENGINE CALCULATIONS =====
  
  describe('Comprehensive Engine Calculations', () => {
    
    it('should provide complete engine calculations for Standard engines', () => {
      const result = getEngineCalculations(200, 50, 'Standard');
      
      expect(result.weight).toBe(10.0);
      expect(result.totalSlots).toBe(6);
      expect(result.slotDistribution).toEqual({ centerTorso: 6, leftTorso: 0, rightTorso: 0 });
      expect(result.integratedHeatSinks).toBe(8); // 200 ÷ 25 = 8
    });

    it('should provide complete engine calculations for XL (IS) engines', () => {
      const result = getEngineCalculations(300, 75, 'XL (IS)');
      
      expect(result.weight).toBe(11.5); // (300 * 75) / 1000 * 0.5 = 11.25, rounded to 11.5
      expect(result.totalSlots).toBe(12);
      expect(result.slotDistribution).toEqual({ centerTorso: 6, leftTorso: 3, rightTorso: 3 });
      expect(result.integratedHeatSinks).toBe(12); // 300 ÷ 25 = 12 (official BattleTech rule)
    });

    it('should provide complete engine calculations for XXL engines', () => {
      const result = getEngineCalculations(400, 100, 'XXL');
      
      expect(result.weight).toBe(13.5); // (400 * 100) / 1000 * 0.33 = 13.2, rounded to 13.5
      expect(result.totalSlots).toBe(18);
      expect(result.slotDistribution).toEqual({ centerTorso: 6, leftTorso: 6, rightTorso: 6 });
      expect(result.integratedHeatSinks).toBe(16); // 400 ÷ 25 = 16 (official BattleTech rule)
    });

    it('should provide complete engine calculations for ICE engines', () => {
      const result = getEngineCalculations(150, 50, 'ICE');
      
      expect(result.weight).toBe(15.0); // (150 * 50) / 1000 * 2.0 = 15.0
      expect(result.totalSlots).toBe(6);
      expect(result.slotDistribution).toEqual({ centerTorso: 6, leftTorso: 0, rightTorso: 0 });
      expect(result.integratedHeatSinks).toBe(0); // ICE engines don't provide heat sinks
    });
  });

  // ===== EDGE CASES AND ERROR CONDITIONS =====
  
  describe('Edge Cases and Error Conditions', () => {
    
    it('should handle minimum tonnage mechs (20 tons)', () => {
      const result = getEngineCalculations(100, 20, 'Standard');
      expect(result.weight).toBe(2.0); // (100 * 20) / 1000 = 2.0
      expect(calculateWalkMP(100, 20)).toBe(5); // 100 ÷ 20 = 5 MP
      expect(validateEngineRating(100, 20)).toBe(true);
    });

    it('should handle maximum tonnage mechs (100 tons)', () => {
      const result = getEngineCalculations(400, 100, 'Standard');
      expect(result.weight).toBe(40.0); // (400 * 100) / 1000 = 40.0
      expect(calculateWalkMP(400, 100)).toBe(4); // 400 ÷ 100 = 4 MP
      expect(validateEngineRating(400, 100)).toBe(true);
    });

    it('should handle very low engine ratings', () => {
      expect(calculateIntegratedHeatSinks(50, 'Standard')).toBe(2); // 50 ÷ 25 = 2
      expect(calculateWalkMP(60, 60)).toBe(1); // 60 ÷ 60 = 1 MP (minimum)
    });

    it('should handle weight rounding correctly', () => {
      // Test cases that require rounding to nearest 0.5 ton
      const result1 = getEngineCalculations(175, 50, 'Light'); // Should round properly
      expect(result1.weight).toBe(7.0); // (175 * 50) / 1000 * 0.75 = 6.5625, rounded to 7.0
      
      const result2 = getEngineCalculations(225, 50, 'XXL'); // Should round properly
      expect(result2.weight).toBe(4.0); // (225 * 50) / 1000 * 0.33 = 3.7125, rounded to 4.0
    });
  });

  // ===== INTEGRATION TESTS =====
  
  describe('Integration Tests', () => {
    
    it('should validate complete engine configurations for different weight classes', () => {
      const testCases = [
        { tonnage: 20, walkMP: 5, engineType: 'Standard' as EngineType, expectedRating: 100 },
        { tonnage: 35, walkMP: 5, engineType: 'XL (IS)' as EngineType, expectedRating: 175 },
        { tonnage: 50, walkMP: 4, engineType: 'Light' as EngineType, expectedRating: 200 },
        { tonnage: 75, walkMP: 3, engineType: 'XXL' as EngineType, expectedRating: 225 },
        { tonnage: 100, walkMP: 3, engineType: 'Compact' as EngineType, expectedRating: 300 }
      ];

      testCases.forEach(({ tonnage, walkMP, engineType, expectedRating }) => {
        const rating = calculateRequiredEngineRating(walkMP, tonnage);
        expect(rating).toBe(expectedRating);
        expect(validateEngineRating(rating, tonnage)).toBe(true);
        expect(calculateWalkMP(rating, tonnage)).toBe(walkMP);
        
        const calculations = getEngineCalculations(rating, tonnage, engineType);
        expect(calculations.weight).toBeGreaterThan(0);
        expect(calculations.totalSlots).toBeGreaterThan(0);
      });
    });

    it('should validate engine weight multipliers are correctly applied', () => {
      Object.entries(ENGINE_WEIGHT_MULTIPLIERS).forEach(([engineType, multiplier]) => {
        const baseWeight = (200 * 50) / 1000; // 10.0 tons base
        const calculatedWeight = calculateEngineWeight(200, 50, engineType as EngineType);
        const expectedWeight = Math.ceil(baseWeight * multiplier * 2) / 2; // Round to 0.5
        expect(calculatedWeight).toBe(expectedWeight);
      });
    });

    it('should validate slot requirements are correctly defined', () => {
      Object.entries(ENGINE_SLOT_REQUIREMENTS).forEach(([engineType, slots]) => {
        const totalSlots = calculateEngineSlots(engineType as EngineType);
        const expectedTotal = slots.centerTorso + slots.leftTorso + slots.rightTorso;
        expect(totalSlots).toBe(expectedTotal);
        
        const distribution = getEngineSlotDistribution(engineType as EngineType);
        expect(distribution).toEqual(slots);
      });
    });
  });

  // ===== CONSTANTS VALIDATION =====
  
  describe('Constants Validation', () => {
    
    it('should have correct engine weight multipliers', () => {
      expect(ENGINE_WEIGHT_MULTIPLIERS['Standard']).toBe(1.0);
      expect(ENGINE_WEIGHT_MULTIPLIERS['XL (IS)']).toBe(0.5);
      expect(ENGINE_WEIGHT_MULTIPLIERS['XL (Clan)']).toBe(0.5);
      expect(ENGINE_WEIGHT_MULTIPLIERS['Light']).toBe(0.75);
      expect(ENGINE_WEIGHT_MULTIPLIERS['XXL']).toBe(0.33);
      expect(ENGINE_WEIGHT_MULTIPLIERS['Compact']).toBe(1.5);
      expect(ENGINE_WEIGHT_MULTIPLIERS['ICE']).toBe(2.0);
      expect(ENGINE_WEIGHT_MULTIPLIERS['Fuel Cell']).toBe(1.5);
    });

    it('should have correct heat sink constants', () => {
      expect(ENGINE_HEAT_SINKS.FUSION_BASE).toBe(10);
      expect(ENGINE_HEAT_SINKS.MIN_RATING_FOR_FULL).toBe(250);
      expect(ENGINE_HEAT_SINKS.HEAT_SINKS_PER_25_RATING).toBe(1);
    });

    it('should have slot requirements for all engine types', () => {
      const requiredEngineTypes: EngineType[] = [
        'Standard', 'XL (IS)', 'XL (Clan)', 'Light', 'XXL', 'Compact', 'ICE', 'Fuel Cell'
      ];
      
      requiredEngineTypes.forEach(engineType => {
        expect(ENGINE_SLOT_REQUIREMENTS[engineType]).toBeDefined();
        expect(ENGINE_WEIGHT_MULTIPLIERS[engineType]).toBeDefined();
      });
    });
  });
});
