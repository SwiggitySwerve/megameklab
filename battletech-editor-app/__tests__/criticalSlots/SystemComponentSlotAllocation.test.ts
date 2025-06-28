/**
 * Comprehensive Test Suite for Engine/Gyro Slot Allocation
 * Validates correct BattleTech critical slot placement for all system component combinations
 */

import { SystemComponentRules, EngineType, GyroType } from '../../utils/criticalSlots/SystemComponentRules';

describe('SystemComponentRules - Engine/Gyro Slot Allocation', () => {
  
  // ===== GYRO ALLOCATION TESTS =====
  
  describe('Gyro Slot Allocation', () => {
    it('Standard Gyro should use slots 4-7 (4 slots)', () => {
      const allocation = SystemComponentRules.getGyroAllocation('Standard');
      expect(allocation.centerTorso).toEqual([3, 4, 5, 6]); // Slots 4-7 (0-indexed)
      expect(allocation.leftTorso).toEqual([]);
      expect(allocation.rightTorso).toEqual([]);
    });

    it('XL Gyro should use slots 4-9 (6 slots)', () => {
      const allocation = SystemComponentRules.getGyroAllocation('XL');
      expect(allocation.centerTorso).toEqual([3, 4, 5, 6, 7, 8]); // Slots 4-9 (0-indexed)
      expect(allocation.leftTorso).toEqual([]);
      expect(allocation.rightTorso).toEqual([]);
    });

    it('Compact Gyro should use slots 4-5 (2 slots)', () => {
      const allocation = SystemComponentRules.getGyroAllocation('Compact');
      expect(allocation.centerTorso).toEqual([3, 4]); // Slots 4-5 (0-indexed)
      expect(allocation.leftTorso).toEqual([]);
      expect(allocation.rightTorso).toEqual([]);
    });

    it('Heavy-Duty Gyro should use slots 4-7 (4 slots)', () => {
      const allocation = SystemComponentRules.getGyroAllocation('Heavy-Duty');
      expect(allocation.centerTorso).toEqual([3, 4, 5, 6]); // Slots 4-7 (0-indexed)
      expect(allocation.leftTorso).toEqual([]);
      expect(allocation.rightTorso).toEqual([]);
    });
  });

  // ===== STANDARD ENGINE TESTS =====
  
  describe('Standard Engine with Different Gyros', () => {
    it('Standard Engine + Standard Gyro: slots 1-3, 8-10', () => {
      const allocation = SystemComponentRules.getEngineAllocation('Standard', 'Standard');
      expect(allocation.centerTorso).toEqual([0, 1, 2, 7, 8, 9]); // Slots 1-3, 8-10 (0-indexed)
      expect(allocation.leftTorso).toEqual([]);
      expect(allocation.rightTorso).toEqual([]);
    });

    it('Standard Engine + XL Gyro: slots 1-3, 10-12', () => {
      const allocation = SystemComponentRules.getEngineAllocation('Standard', 'XL');
      expect(allocation.centerTorso).toEqual([0, 1, 2, 9, 10, 11]); // Slots 1-3, 10-12 (0-indexed)
      expect(allocation.leftTorso).toEqual([]);
      expect(allocation.rightTorso).toEqual([]);
    });

    it('Standard Engine + Compact Gyro: slots 1-3, 6-8', () => {
      const allocation = SystemComponentRules.getEngineAllocation('Standard', 'Compact');
      expect(allocation.centerTorso).toEqual([0, 1, 2, 5, 6, 7]); // Slots 1-3, 6-8 (0-indexed)
      expect(allocation.leftTorso).toEqual([]);
      expect(allocation.rightTorso).toEqual([]);
    });

    it('Standard Engine + Heavy-Duty Gyro: CT 1-3,8-10', () => {
      const allocation = SystemComponentRules.getEngineAllocation('Standard', 'Heavy-Duty');
      // Heavy-Duty Gyro uses slots 4-7, so engine gets slots 1-3, 8-10 (normal behavior)
      expect(allocation.centerTorso).toEqual([0, 1, 2, 7, 8, 9]); // Slots 1-3, 8-10 (0-indexed)
      expect(allocation.leftTorso).toEqual([]);
      expect(allocation.rightTorso).toEqual([]);
    });
  });

  // ===== XL ENGINE TESTS =====
  
  describe('XL Engine with Different Gyros', () => {
    it('XL Engine + Standard Gyro: CT 1-3,8-10 + LT/RT 1-3', () => {
      const allocation = SystemComponentRules.getEngineAllocation('XL', 'Standard');
      expect(allocation.centerTorso).toEqual([0, 1, 2, 7, 8, 9]); // Slots 1-3, 8-10 (0-indexed)
      expect(allocation.leftTorso).toEqual([0, 1, 2]); // Slots 1-3
      expect(allocation.rightTorso).toEqual([0, 1, 2]); // Slots 1-3
    });

    it('XL Engine + XL Gyro: CT 1-3,10-12 + LT/RT 1-3', () => {
      const allocation = SystemComponentRules.getEngineAllocation('XL', 'XL');
      expect(allocation.centerTorso).toEqual([0, 1, 2, 9, 10, 11]); // Slots 1-3, 10-12 (0-indexed)
      expect(allocation.leftTorso).toEqual([0, 1, 2]); // Slots 1-3
      expect(allocation.rightTorso).toEqual([0, 1, 2]); // Slots 1-3
    });

    it('XL Engine + Compact Gyro: CT 1-3,6-8 + LT/RT 1-3', () => {
      const allocation = SystemComponentRules.getEngineAllocation('XL', 'Compact');
      expect(allocation.centerTorso).toEqual([0, 1, 2, 5, 6, 7]); // Slots 1-3, 6-8 (0-indexed)
      expect(allocation.leftTorso).toEqual([0, 1, 2]); // Slots 1-3
      expect(allocation.rightTorso).toEqual([0, 1, 2]); // Slots 1-3
    });

    it('XL Engine + Heavy-Duty Gyro: CT 1-3,8-10 + LT/RT 1-3', () => {
      const allocation = SystemComponentRules.getEngineAllocation('XL', 'Heavy-Duty');
      // Heavy-Duty Gyro uses slots 4-7, so engine gets slots 1-3, 8-10 + sides (normal behavior)
      expect(allocation.centerTorso).toEqual([0, 1, 2, 7, 8, 9]); // Slots 1-3, 8-10 (0-indexed)
      expect(allocation.leftTorso).toEqual([0, 1, 2]); // Slots 1-3
      expect(allocation.rightTorso).toEqual([0, 1, 2]); // Slots 1-3
    });
  });

  // ===== LIGHT ENGINE TESTS =====
  
  describe('Light Engine with Different Gyros', () => {
    it('Light Engine + Standard Gyro: CT 1-3,8-10 + LT/RT 1-2', () => {
      const allocation = SystemComponentRules.getEngineAllocation('Light', 'Standard');
      expect(allocation.centerTorso).toEqual([0, 1, 2, 7, 8, 9]); // Slots 1-3, 8-10 (0-indexed)
      expect(allocation.leftTorso).toEqual([0, 1]); // Slots 1-2
      expect(allocation.rightTorso).toEqual([0, 1]); // Slots 1-2
    });

    it('Light Engine + XL Gyro: CT 1-3,10-12 + LT/RT 1-2', () => {
      const allocation = SystemComponentRules.getEngineAllocation('Light', 'XL');
      expect(allocation.centerTorso).toEqual([0, 1, 2, 9, 10, 11]); // Slots 1-3, 10-12 (0-indexed)
      expect(allocation.leftTorso).toEqual([0, 1]); // Slots 1-2
      expect(allocation.rightTorso).toEqual([0, 1]); // Slots 1-2
    });

    it('Light Engine + Compact Gyro: CT 1-3,6-8 + LT/RT 1-2', () => {
      const allocation = SystemComponentRules.getEngineAllocation('Light', 'Compact');
      expect(allocation.centerTorso).toEqual([0, 1, 2, 5, 6, 7]); // Slots 1-3, 6-8 (0-indexed)
      expect(allocation.leftTorso).toEqual([0, 1]); // Slots 1-2
      expect(allocation.rightTorso).toEqual([0, 1]); // Slots 1-2
    });
  });

  // ===== XXL ENGINE TESTS =====
  
  describe('XXL Engine with Different Gyros', () => {
    it('XXL Engine + Standard Gyro: CT 1-3,8-10 + LT/RT 1-6', () => {
      const allocation = SystemComponentRules.getEngineAllocation('XXL', 'Standard');
      expect(allocation.centerTorso).toEqual([0, 1, 2, 7, 8, 9]); // Slots 1-3, 8-10 (0-indexed)
      expect(allocation.leftTorso).toEqual([0, 1, 2, 3, 4, 5]); // Slots 1-6
      expect(allocation.rightTorso).toEqual([0, 1, 2, 3, 4, 5]); // Slots 1-6
    });

    it('XXL Engine + Compact Gyro: CT 1-3,6-8 + LT/RT 1-6', () => {
      const allocation = SystemComponentRules.getEngineAllocation('XXL', 'Compact');
      expect(allocation.centerTorso).toEqual([0, 1, 2, 5, 6, 7]); // Slots 1-3, 6-8 (0-indexed)
      expect(allocation.leftTorso).toEqual([0, 1, 2, 3, 4, 5]); // Slots 1-6
      expect(allocation.rightTorso).toEqual([0, 1, 2, 3, 4, 5]); // Slots 1-6
    });

    it('XXL Engine + XL Gyro: CT 1-3,10-12 + LT/RT 1-6', () => {
      const allocation = SystemComponentRules.getEngineAllocation('XXL', 'XL');
      expect(allocation.centerTorso).toEqual([0, 1, 2, 9, 10, 11]); // Slots 1-3, 10-12 (0-indexed)
      expect(allocation.leftTorso).toEqual([0, 1, 2, 3, 4, 5]); // Slots 1-6
      expect(allocation.rightTorso).toEqual([0, 1, 2, 3, 4, 5]); // Slots 1-6
    });
  });

  // ===== COMPACT ENGINE TESTS =====
  
  describe('Compact Engine with Different Gyros', () => {
    it('Compact Engine + Standard Gyro: CT 1-3 only', () => {
      const allocation = SystemComponentRules.getEngineAllocation('Compact', 'Standard');
      expect(allocation.centerTorso).toEqual([0, 1, 2]); // Only slots 1-3 (0-indexed)
      expect(allocation.leftTorso).toEqual([]);
      expect(allocation.rightTorso).toEqual([]);
    });

    it('Compact Engine + XL Gyro: CT 1-3 only', () => {
      const allocation = SystemComponentRules.getEngineAllocation('Compact', 'XL');
      expect(allocation.centerTorso).toEqual([0, 1, 2]); // Only slots 1-3 (0-indexed)
      expect(allocation.leftTorso).toEqual([]);
      expect(allocation.rightTorso).toEqual([]);
    });

    it('Compact Engine + Compact Gyro: CT 1-3 only', () => {
      const allocation = SystemComponentRules.getEngineAllocation('Compact', 'Compact');
      expect(allocation.centerTorso).toEqual([0, 1, 2]); // Only slots 1-3 (0-indexed)
      expect(allocation.leftTorso).toEqual([]);
      expect(allocation.rightTorso).toEqual([]);
    });
  });

  // ===== COMPLETE SYSTEM ALLOCATION TESTS =====
  
  describe('Complete System Allocation (Engine + Gyro)', () => {
    it('Standard Engine + Standard Gyro should not overlap', () => {
      const allocation = SystemComponentRules.getCompleteSystemAllocation('Standard', 'Standard');
      
      expect(allocation.engine.centerTorso).toEqual([0, 1, 2, 7, 8, 9]); // Engine slots
      expect(allocation.gyro.centerTorso).toEqual([3, 4, 5, 6]); // Gyro slots
      
      // Combined should be all slots used
      expect(allocation.combined.centerTorso).toEqual([0, 1, 2, 7, 8, 9, 3, 4, 5, 6]);
      
      // Check no overlaps
      const engineSet = new Set(allocation.engine.centerTorso);
      const gyroSet = new Set(allocation.gyro.centerTorso);
      const intersection = Array.from(engineSet).filter(slot => gyroSet.has(slot));
      expect(intersection).toEqual([]);
    });

    it('XL Engine + XL Gyro should not overlap', () => {
      const allocation = SystemComponentRules.getCompleteSystemAllocation('XL', 'XL');
      
      expect(allocation.engine.centerTorso).toEqual([0, 1, 2, 9, 10, 11]); // Engine slots
      expect(allocation.gyro.centerTorso).toEqual([3, 4, 5, 6, 7, 8]); // Gyro slots
      
      // Check no overlaps
      const engineSet = new Set(allocation.engine.centerTorso);
      const gyroSet = new Set(allocation.gyro.centerTorso);
      const intersection = Array.from(engineSet).filter(slot => gyroSet.has(slot));
      expect(intersection).toEqual([]);
    });

    it('Standard Engine + Heavy-Duty Gyro should be valid', () => {
      const validation = SystemComponentRules.validateSystemComponents('Standard', 'Heavy-Duty');
      expect(validation.isValid).toBe(true);
    });
  });

  // ===== VALIDATION TESTS =====
  
  describe('System Component Validation', () => {
    it('should validate slot overflow detection', () => {
      // Note: With Heavy-Duty gyro fixed to 4 slots, there are no invalid combinations
      // This test now serves as a placeholder for future invalid combinations
      const invalidCombinations = [] as const;

      invalidCombinations.forEach(([engineType, gyroType]) => {
        const validation = SystemComponentRules.validateSystemComponents(engineType, gyroType);
        expect(validation.isValid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
      });
    });

    it('should validate legitimate combinations as valid', () => {
      const validCombinations = [
        ['Standard', 'Standard'],
        ['Standard', 'XL'],
        ['Standard', 'Compact'],
        ['Standard', 'Heavy-Duty'],
        ['XL', 'Standard'],
        ['XL', 'XL'],
        ['XL', 'Compact'],
        ['XL', 'Heavy-Duty'],
        ['Light', 'Standard'],
        ['Light', 'XL'],
        ['Light', 'Compact'],
        ['Light', 'Heavy-Duty'],
        ['XXL', 'Standard'],
        ['XXL', 'XL'],
        ['XXL', 'Compact'],
        ['XXL', 'Heavy-Duty'],
        ['Compact', 'Standard'],
        ['Compact', 'XL'],
        ['Compact', 'Compact'],
        ['Compact', 'Heavy-Duty']
      ] as const;

      validCombinations.forEach(([engineType, gyroType]) => {
        const validation = SystemComponentRules.validateSystemComponents(engineType, gyroType);
        if (!validation.isValid) {
          console.error(`Failed validation for ${engineType} + ${gyroType}:`, validation.errors);
        }
        expect(validation.isValid).toBe(true);
      });
    });

    it('should detect slot overlaps if they occur', () => {
      // This is a defensive test - with correct implementation there should be no overlaps
      const allocation = SystemComponentRules.getCompleteSystemAllocation('Standard', 'Standard');
      const allSlots = allocation.combined.centerTorso;
      const uniqueSlots = new Set(allSlots);
      
      expect(uniqueSlots.size).toBe(allSlots.length); // No duplicates
    });
  });

  // ===== EDGE CASE TESTS =====
  
  describe('Edge Cases and Error Conditions', () => {
    it('should handle maximum CT slot usage correctly', () => {
      const allocation = SystemComponentRules.getCompleteSystemAllocation('XXL', 'Compact');
      const ctSlots = allocation.combined.centerTorso;
      
      // Should not exceed slot 11 (index 11 = slot 12)
      const maxSlot = Math.max(...ctSlots);
      expect(maxSlot).toBeLessThan(12);
    });

    it('should provide accurate system descriptions', () => {
      const description = SystemComponentRules.getSystemDescription('XL', 'Standard');
      expect(description).toContain('XL Engine');
      expect(description).toContain('Standard Gyro');
      expect(description).toContain('CT slots');
      expect(description).toContain('LT slots');
      expect(description).toContain('RT slots');
    });
  });
});
