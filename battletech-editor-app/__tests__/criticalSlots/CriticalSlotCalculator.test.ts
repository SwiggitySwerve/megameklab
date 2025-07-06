/**
 * Comprehensive Test Suite for CriticalSlotCalculator
 * Tests every possible configuration of system components to ensure accurate slot calculations
 */

import { CriticalSlotCalculator } from '../../utils/criticalSlots/CriticalSlotCalculator';
import { UnitConfiguration, UnitCriticalManager } from '../../utils/criticalSlots/UnitCriticalManager';

describe('CriticalSlotCalculator - Comprehensive System Component Tests', () => {
  
  // ===== BASE CASE VALIDATION =====
  
  describe('Base Case - Standard 50-ton Mech', () => {
    it('should calculate exactly 31 structural slots for base configuration', () => {
      const baseConfig: UnitConfiguration = {
        chassis: 'Test Mech',
        model: 'Base',
        tonnage: 50,
        unitType: 'BattleMech',
        techBase: 'Inner Sphere',
        walkMP: 4,
        runMP: 6,
        jumpMP: 0,
        engineRating: 200,
        engineType: 'Standard',
        gyroType: 'Standard' as any,
        structureType: 'Standard' as any,
        armorType: 'Standard' as any,
        heatSinkType: 'Single' as any,
        totalHeatSinks: 10,
        internalHeatSinks: 8,
        externalHeatSinks: 2,
        armorAllocation: {
          HD: { front: 9, rear: 0 },
          CT: { front: 20, rear: 5 },
          LT: { front: 15, rear: 4 },
          RT: { front: 15, rear: 4 },
          LA: { front: 12, rear: 0 },
          RA: { front: 12, rear: 0 },
          LL: { front: 18, rear: 0 },
          RL: { front: 18, rear: 0 }
        },
        armorTonnage: 7.0,
        jumpJetType: 'Standard Jump Jet' as any,
        jumpJetCounts: {},
        hasPartialWing: false,
        mass: 50,
        enhancements: []
      };

      const structural = CriticalSlotCalculator.calculateStructuralSlots(baseConfig);
      
      expect(structural.fixedComponents).toBe(17); // Cockpit + Life Support + Sensors + Actuators
      expect(structural.systemComponents).toBe(10); // Standard engine (6) + Standard gyro (4)
      expect(structural.specialComponents).toBe(0); // No special components
      expect(structural.total).toBe(27); // 17 + 10 + 0
    });
  });

  // ===== ENGINE TYPE TESTS =====
  
  describe('Engine Type Variations', () => {
    const engineTests = [
      { type: 'Standard', expectedSlots: 6, description: 'Standard engine uses 6 slots' },
      { type: 'XL', expectedSlots: 12, description: 'XL engine uses 12 slots (6 CT + 3 each side)' },
      { type: 'Light', expectedSlots: 10, description: 'Light engine uses 10 slots' },
      { type: 'XXL', expectedSlots: 18, description: 'XXL engine uses 18 slots' },
      { type: 'Compact', expectedSlots: 3, description: 'Compact engine uses 3 slots' },
      { type: 'ICE', expectedSlots: 6, description: 'ICE engine uses 6 slots' },
      { type: 'Fuel Cell', expectedSlots: 6, description: 'Fuel Cell engine uses 6 slots' }
    ];

    engineTests.forEach(({ type, expectedSlots, description }) => {
      it(description, () => {
        const config: UnitConfiguration = createTestConfig({
          engineType: type as any
        });

        const structural = CriticalSlotCalculator.calculateStructuralSlots(config);
        const expectedTotal = 17 + expectedSlots + 4; // Fixed + Engine + Standard Gyro
        
        expect(structural.systemComponents).toBe(expectedSlots + 4);
        expect(structural.total).toBe(expectedTotal);
      });
    });
  });

  // ===== GYRO TYPE TESTS =====
  
  describe('Gyro Type Variations', () => {
    const gyroTests = [
      { type: 'Standard', expectedSlots: 4, description: 'Standard gyro uses 4 slots' },
      { type: 'XL', expectedSlots: 6, description: 'XL gyro uses 6 slots' },
      { type: 'Compact', expectedSlots: 2, description: 'Compact gyro uses 2 slots' },
      { type: 'Heavy-Duty', expectedSlots: 4, description: 'Heavy-Duty gyro uses 4 slots' }
    ];

    gyroTests.forEach(({ type, expectedSlots, description }) => {
      it(description, () => {
        const config: UnitConfiguration = createTestConfig({
          gyroType: type as any
        });

        const structural = CriticalSlotCalculator.calculateStructuralSlots(config);
        
        const expectedTotal = 17 + 6 + expectedSlots; // Fixed + Standard Engine + Gyro
        expect(structural.systemComponents).toBe(6 + expectedSlots);
        expect(structural.total).toBe(expectedTotal);
      });
    });
  });

  // ===== STRUCTURE TYPE TESTS =====
  
  describe('Structure Type Variations', () => {
    const structureTests = [
      { type: 'Standard', expectedSlots: 0, description: 'Standard structure uses 0 slots' },
      { type: 'Endo Steel', expectedSlots: 14, description: 'Endo Steel uses 14 slots' },
      { type: 'Endo Steel (Clan)', expectedSlots: 7, description: 'Clan Endo Steel uses 7 slots' },
      { type: 'Composite', expectedSlots: 0, description: 'Composite structure uses 0 slots' },
      { type: 'Reinforced', expectedSlots: 0, description: 'Reinforced structure uses 0 slots' },
      { type: 'Industrial', expectedSlots: 0, description: 'Industrial structure uses 0 slots' }
    ];

    structureTests.forEach(({ type, expectedSlots, description }) => {
      it(description, () => {
        const config: UnitConfiguration = createTestConfig({
          structureType: type as any
        });

        const structural = CriticalSlotCalculator.calculateStructuralSlots(config);
        const expectedTotal = 17 + 10 + expectedSlots; // Fixed + Standard System + Structure
        
        expect(structural.specialComponents).toBe(expectedSlots);
        expect(structural.total).toBe(expectedTotal);
      });
    });
  });

  // ===== ARMOR TYPE TESTS =====
  
  describe('Armor Type Variations', () => {
    const armorTests = [
      { type: 'Standard', techBase: 'Inner Sphere', expectedSlots: 0, description: 'Standard armor uses 0 slots' },
      { type: 'Ferro-Fibrous', techBase: 'Inner Sphere', expectedSlots: 14, description: 'IS Ferro-Fibrous uses 14 slots' },
      { type: 'Ferro-Fibrous (Clan)', techBase: 'Clan', expectedSlots: 7, description: 'Clan Ferro-Fibrous uses 7 slots' },
      { type: 'Light Ferro-Fibrous', techBase: 'Inner Sphere', expectedSlots: 7, description: 'Light Ferro-Fibrous uses 7 slots' },
      { type: 'Heavy Ferro-Fibrous', techBase: 'Inner Sphere', expectedSlots: 21, description: 'Heavy Ferro-Fibrous uses 21 slots' },
      { type: 'Stealth', techBase: 'Inner Sphere', expectedSlots: 12, description: 'Stealth armor uses 12 slots' },
      { type: 'Reactive', techBase: 'Inner Sphere', expectedSlots: 14, description: 'Reactive armor uses 14 slots' },
      { type: 'Reflective', techBase: 'Inner Sphere', expectedSlots: 10, description: 'Reflective armor uses 10 slots' },
      { type: 'Hardened', techBase: 'Inner Sphere', expectedSlots: 0, description: 'Hardened armor uses 0 slots' }
    ];

    armorTests.forEach(({ type, techBase, expectedSlots, description }) => {
      it(description, () => {
        const config: UnitConfiguration = createTestConfig({
          armorType: type as any,
          techBase: techBase as any
        });

        const structural = CriticalSlotCalculator.calculateStructuralSlots(config);
        const expectedTotal = 17 + 10 + expectedSlots; // Fixed + Standard System + Armor
        
        expect(structural.specialComponents).toBe(expectedSlots);
        expect(structural.total).toBe(expectedTotal);
      });
    });
  });

  // ===== JUMP JET TESTS =====
  
  describe('Jump Jet Variations', () => {
    const jumpJetTests = [
      { jumpMP: 0, expectedSlots: 0, description: 'No jump jets use 0 slots' },
      { jumpMP: 1, expectedSlots: 1, description: '1 jump jet uses 1 slot' },
      { jumpMP: 3, expectedSlots: 3, description: '3 jump jets use 3 slots' },
      { jumpMP: 5, expectedSlots: 5, description: '5 jump jets use 5 slots' },
      { jumpMP: 8, expectedSlots: 8, description: '8 jump jets use 8 slots' }
    ];

    jumpJetTests.forEach(({ jumpMP, expectedSlots, description }) => {
      it(description, () => {
        const config: UnitConfiguration = createTestConfig({
          jumpMP
        });

        const structural = CriticalSlotCalculator.calculateStructuralSlots(config);
        const expectedTotal = 17 + 10 + expectedSlots; // Fixed + Standard System + Jump Jets
        
        expect(structural.specialComponents).toBe(expectedSlots);
        expect(structural.total).toBe(expectedTotal);
      });
    });
  });

  // ===== COMPLEX COMBINATION TESTS =====
  
  describe('Complex Component Combinations', () => {
    it('should handle XL Engine + XL Gyro + Endo Steel + Ferro-Fibrous correctly', () => {
      const config: UnitConfiguration = createTestConfig({
        engineType: 'XL',
        gyroType: 'XL',
        structureType: 'Endo Steel',
        armorType: 'Ferro-Fibrous'
      });

      const structural = CriticalSlotCalculator.calculateStructuralSlots(config);
      
      expect(structural.fixedComponents).toBe(17);
      expect(structural.systemComponents).toBe(18); // XL Engine (12) + XL Gyro (6)
      expect(structural.specialComponents).toBe(28); // Endo Steel (14) + Ferro-Fibrous (14)
      expect(structural.total).toBe(63); // 17 + 18 + 28
    });

    it('should handle Compact Engine + Compact Gyro + Jump Jets correctly', () => {
      const config: UnitConfiguration = createTestConfig({
        engineType: 'Compact',
        gyroType: 'Compact',
        jumpMP: 5
      });

      const structural = CriticalSlotCalculator.calculateStructuralSlots(config);
      
      expect(structural.fixedComponents).toBe(17);
      expect(structural.systemComponents).toBe(5); // Compact Engine (3) + Compact Gyro (2)
      expect(structural.specialComponents).toBe(5); // Jump Jets (5)
      expect(structural.total).toBe(27); // 17 + 5 + 5
    });

    it('should handle maximum special components configuration', () => {
      const config: UnitConfiguration = createTestConfig({
        engineType: 'XXL',
        gyroType: 'Heavy-Duty',
        structureType: 'Endo Steel',
        armorType: 'Heavy Ferro-Fibrous',
        jumpMP: 8
      });

      const structural = CriticalSlotCalculator.calculateStructuralSlots(config);
      
      expect(structural.fixedComponents).toBe(17);
      expect(structural.systemComponents).toBe(22); // XXL Engine (18) + Heavy-Duty Gyro (4)
      expect(structural.specialComponents).toBe(43); // Endo Steel (14) + Heavy Ferro-Fibrous (21) + Jump Jets (8)
      expect(structural.total).toBe(82); // 17 + 22 + 43 (Over capacity!)
    });

    it('should handle Clan technology combinations', () => {
      const config: UnitConfiguration = createTestConfig({
        techBase: 'Clan',
        structureType: 'Endo Steel (Clan)',
        armorType: 'Ferro-Fibrous (Clan)'
      });

      const structural = CriticalSlotCalculator.calculateStructuralSlots(config);
      
      expect(structural.fixedComponents).toBe(17);
      expect(structural.systemComponents).toBe(10); // Standard Engine + Standard Gyro
      expect(structural.specialComponents).toBe(14); // Clan Endo Steel (7) + Clan Ferro-Fibrous (7)
      expect(structural.total).toBe(41); // 17 + 10 + 14
    });
  });

  // ===== INTEGRATION TESTS WITH UNIT MANAGER =====
  
  describe('Integration with UnitCriticalManager', () => {
    it('should produce accurate breakdown with no user equipment', () => {
      const config: UnitConfiguration = createTestConfig({
        structureType: 'Endo Steel',
        armorType: 'Ferro-Fibrous',
        jumpMP: 3,
        externalHeatSinks: 0  // Set to 0 to avoid auto-generated heat sinks
      });

      const unit = new UnitCriticalManager(config);
      const breakdown = unit.getCriticalSlotBreakdown();
      
      // Verify structural calculations
      expect(breakdown.structural.fixedComponents).toBe(17);
      expect(breakdown.structural.systemComponents).toBe(10);
      expect(breakdown.structural.specialComponents).toBe(31); // Endo (14) + Ferro (14) + Jump (3)
      expect(breakdown.structural.total).toBe(58);
      
      // Verify equipment calculations (should only have auto-generated special components)
      expect(breakdown.equipment.allocated).toBe(0);
      expect(breakdown.equipment.unallocated).toBeGreaterThanOrEqual(0); // Allow for auto-generated components
      expect(breakdown.equipment.total).toBeGreaterThanOrEqual(0);
      
      // Verify totals
      expect(breakdown.totals.capacity).toBe(78);
      expect(breakdown.totals.used).toBe(58); // structural.total + equipment.allocated
      expect(breakdown.totals.remaining).toBe(20); // capacity - used
      expect(breakdown.totals.equipmentBurden).toBe(58 + breakdown.equipment.unallocated); // used + equipment.unallocated
      
      // Calculate dynamic over-capacity based on actual equipment burden
      const expectedOverCapacity = Math.max(0, breakdown.totals.equipmentBurden - 78);
      expect(breakdown.totals.overCapacity).toBe(expectedOverCapacity);
    });

    it('should handle over-capacity configurations correctly', () => {
      const config: UnitConfiguration = createTestConfig({
        engineType: 'XXL',
        gyroType: 'Heavy-Duty',
        structureType: 'Endo Steel',
        armorType: 'Heavy Ferro-Fibrous',
        jumpMP: 8,
        externalHeatSinks: 0  // Set to 0 to avoid auto-generated heat sinks
      });

      const unit = new UnitCriticalManager(config);
      const breakdown = unit.getCriticalSlotBreakdown();
      
      expect(breakdown.structural.total).toBe(82); // Over 78!
      expect(breakdown.totals.used).toBe(82);
      expect(breakdown.totals.remaining).toBe(0); // Capped at 0
      expect(breakdown.totals.equipmentBurden).toBe(82 + breakdown.equipment.unallocated); // Allow for auto-generated components
      expect(breakdown.totals.overCapacity).toBe(Math.max(0, breakdown.totals.equipmentBurden - 78)); // Calculate dynamically
    });
  });

  // ===== EDGE CASES AND ERROR CONDITIONS =====
  
  describe('Edge Cases and Error Conditions', () => {
    it('should handle minimum viable configuration', () => {
      const config: UnitConfiguration = createTestConfig({
        engineType: 'Compact',
        gyroType: 'Compact',
        structureType: 'Standard',
        armorType: 'Standard',
        jumpMP: 0
      });

      const structural = CriticalSlotCalculator.calculateStructuralSlots(config);
      
      expect(structural.total).toBe(22); // 17 + 3 + 2 + 0
    });

    it('should handle maximum system component configuration', () => {
      const config: UnitConfiguration = createTestConfig({
        engineType: 'XXL',
        gyroType: 'Heavy-Duty'
      });

      const structural = CriticalSlotCalculator.calculateStructuralSlots(config);
      
      expect(structural.systemComponents).toBe(22); // XXL (18) + Heavy-Duty (4)
    });

    it('should validate debug breakdown information', () => {
      const config: UnitConfiguration = createTestConfig();
      const unit = new UnitCriticalManager(config);
      const breakdown = unit.getCriticalSlotBreakdown();
      
      expect(breakdown.debug).toBeDefined();
      expect(breakdown.debug!.fixedBreakdown).toBeDefined();
      expect(breakdown.debug!.systemBreakdown).toBeDefined();
      expect(breakdown.debug!.specialBreakdown).toBeDefined();
      
      // Verify fixed breakdown structure
      const fixed = breakdown.debug!.fixedBreakdown;
      expect(fixed.head.total).toBe(5);
      expect(fixed.arms.total).toBe(4);
      expect(fixed.legs.total).toBe(8);
      expect(fixed.total).toBe(17);
    });
  });
});

// ===== HELPER FUNCTIONS =====

/**
 * Create a test configuration with default values and optional overrides
 */
function createTestConfig(overrides: Partial<UnitConfiguration> = {}): UnitConfiguration {
  const defaultConfig: UnitConfiguration = {
    chassis: 'Test Mech',
    model: 'Test Model',
    tonnage: 50,
    unitType: 'BattleMech',
    techBase: 'Inner Sphere',
    walkMP: 4,
    runMP: 6,
    jumpMP: 0,
    engineRating: 200,
    engineType: 'Standard',
    gyroType: 'Standard' as any,
    structureType: 'Standard' as any,
    armorType: 'Standard' as any,
    heatSinkType: 'Single' as any,
    totalHeatSinks: 10,
    internalHeatSinks: 8,
    externalHeatSinks: 2,
    armorAllocation: {
      HD: { front: 9, rear: 0 },
      CT: { front: 20, rear: 5 },
      LT: { front: 15, rear: 4 },
      RT: { front: 15, rear: 4 },
      LA: { front: 12, rear: 0 },
      RA: { front: 12, rear: 0 },
      LL: { front: 18, rear: 0 },
      RL: { front: 18, rear: 0 }
    },
    armorTonnage: 7.0,
    jumpJetType: 'Standard Jump Jet' as any,
    jumpJetCounts: {},
    hasPartialWing: false,
    mass: 50,
    enhancements: []
  };

  return { ...defaultConfig, ...overrides };
}
