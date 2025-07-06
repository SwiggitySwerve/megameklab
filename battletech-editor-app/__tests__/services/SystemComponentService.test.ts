/**
 * Tests for SystemComponentService
 * 
 * Validates system component calculations, BattleTech rule compliance, and service functionality.
 */

import { 
  SystemComponentService, 
  SystemComponentServiceImpl,
  createSystemComponentService,
  EngineSlotAllocation,
  SystemAllocation,
  EngineValidationResult,
  ValidationResult,
  WeightBreakdown
} from '../../services/SystemComponentService';
import { EngineType, GyroType } from '../../utils/criticalSlots/SystemComponentRules';
import { UnitConfiguration } from '../../utils/criticalSlots/UnitCriticalManager';

describe('SystemComponentService', () => {
  let service: SystemComponentService;

  beforeEach(() => {
    service = createSystemComponentService();
  });

  describe('Factory Function', () => {
    it('should create SystemComponentService instance', () => {
      const createdService = createSystemComponentService();
      expect(createdService).toBeInstanceOf(SystemComponentServiceImpl);
    });
  });

  describe('Engine Calculations', () => {
    describe('calculateEngineWeight', () => {
      it('should calculate Standard engine weight correctly', () => {
        expect(service.calculateEngineWeight(200, 'Standard')).toBe(8);
        expect(service.calculateEngineWeight(300, 'Standard')).toBe(12);
        expect(service.calculateEngineWeight(400, 'Standard')).toBe(16);
      });

      it('should calculate XL engine weight correctly', () => {
        expect(service.calculateEngineWeight(200, 'XL')).toBe(4);
        expect(service.calculateEngineWeight(300, 'XL')).toBe(6);
        expect(service.calculateEngineWeight(400, 'XL')).toBe(8);
      });

      it('should calculate Light engine weight correctly', () => {
        expect(service.calculateEngineWeight(200, 'Light')).toBe(6);
        expect(service.calculateEngineWeight(300, 'Light')).toBe(9);
      });

      it('should calculate XXL engine weight correctly', () => {
        expect(service.calculateEngineWeight(300, 'XXL')).toBeCloseTo(3.96, 1);
        expect(service.calculateEngineWeight(400, 'XXL')).toBeCloseTo(5.28, 1);
      });

      it('should calculate Compact engine weight correctly', () => {
        expect(service.calculateEngineWeight(200, 'Compact')).toBe(12);
        expect(service.calculateEngineWeight(300, 'Compact')).toBe(18);
      });

      it('should calculate ICE engine weight correctly', () => {
        expect(service.calculateEngineWeight(200, 'ICE')).toBe(16);
        expect(service.calculateEngineWeight(300, 'ICE')).toBe(24);
      });

      it('should handle zero rating', () => {
        expect(service.calculateEngineWeight(0, 'Standard')).toBe(0);
        expect(service.calculateEngineWeight(-10, 'Standard')).toBe(0);
      });
    });

    describe('calculateEngineSlots', () => {
      it('should return correct slot allocation for Standard engine', () => {
        const slots = service.calculateEngineSlots('Standard');
        expect(slots.centerTorso).toEqual([0, 1, 2, 7, 8, 9]);
        expect(slots.leftTorso).toEqual([]);
        expect(slots.rightTorso).toEqual([]);
        expect(slots.totalSlots).toBe(6);
      });

      it('should return correct slot allocation for XL engine', () => {
        const slots = service.calculateEngineSlots('XL');
        expect(slots.centerTorso.length).toBeGreaterThan(3);
        expect(slots.leftTorso.length).toBeGreaterThan(0);
        expect(slots.rightTorso.length).toBeGreaterThan(0);
        expect(slots.totalSlots).toBe(slots.centerTorso.length + slots.leftTorso.length + slots.rightTorso.length);
      });

      it('should return correct slot allocation for Light engine', () => {
        const slots = service.calculateEngineSlots('Light');
        expect(slots.centerTorso.length).toBeGreaterThan(3);
        expect(slots.leftTorso.length).toBeGreaterThan(0);
        expect(slots.rightTorso.length).toBeGreaterThan(0);
        expect(slots.totalSlots).toBe(slots.centerTorso.length + slots.leftTorso.length + slots.rightTorso.length);
      });

      it('should return correct slot allocation for XXL engine', () => {
        const slots = service.calculateEngineSlots('XXL');
        expect(slots.centerTorso.length).toBeGreaterThan(3);
        expect(slots.leftTorso.length).toBeGreaterThan(3);
        expect(slots.rightTorso.length).toBeGreaterThan(3);
        expect(slots.totalSlots).toBe(slots.centerTorso.length + slots.leftTorso.length + slots.rightTorso.length);
      });

      it('should return correct slot allocation for Compact engine', () => {
        const slots = service.calculateEngineSlots('Compact');
        expect(slots.centerTorso).toEqual([0, 1, 2]);
        expect(slots.leftTorso).toEqual([]);
        expect(slots.rightTorso).toEqual([]);
        expect(slots.totalSlots).toBe(3);
      });
    });

    describe('validateEngineRating', () => {
      it('should validate correct engine ratings', () => {
        const result = service.validateEngineRating(50, 4); // 200 rating
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.maxWalkMP).toBe(8);
      });

      it('should reject engine rating over 400', () => {
        const result = service.validateEngineRating(50, 9); // 450 rating
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Engine rating 450 exceeds maximum of 400');
      });

      it('should reject zero or negative walk MP', () => {
        const result = service.validateEngineRating(50, 0);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Walk MP must be at least 1');
      });

      it('should reject walk MP exceeding tonnage limits', () => {
        const result = service.validateEngineRating(100, 5); // Would require 500 rating
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Walk MP 5 exceeds maximum 4 for 100-ton unit');
      });

      it('should provide warnings for unusual configurations', () => {
        const slowResult = service.validateEngineRating(50, 1);
        expect(slowResult.warnings).toContain('Very slow movement speed may limit tactical effectiveness');

        const fastHeavyResult = service.validateEngineRating(75, 7);
        expect(fastHeavyResult.warnings).toContain('High speed on heavy units requires significant engine investment');
      });
    });
  });

  describe('Gyro Calculations', () => {
    describe('calculateGyroWeight', () => {
      it('should calculate Standard gyro weight correctly', () => {
        expect(service.calculateGyroWeight(200, 'Standard')).toBe(2);
        expect(service.calculateGyroWeight(300, 'Standard')).toBe(3);
        expect(service.calculateGyroWeight(400, 'Standard')).toBe(4);
      });

      it('should calculate XL gyro weight correctly', () => {
        expect(service.calculateGyroWeight(200, 'XL')).toBe(1);
        expect(service.calculateGyroWeight(300, 'XL')).toBe(1.5);
        expect(service.calculateGyroWeight(400, 'XL')).toBe(2);
      });

      it('should calculate Compact gyro weight correctly', () => {
        expect(service.calculateGyroWeight(200, 'Compact')).toBe(3);
        expect(service.calculateGyroWeight(300, 'Compact')).toBe(4.5);
      });

      it('should calculate Heavy-Duty gyro weight correctly', () => {
        expect(service.calculateGyroWeight(200, 'Heavy-Duty')).toBe(4);
        expect(service.calculateGyroWeight(300, 'Heavy-Duty')).toBe(6);
      });

      it('should handle zero engine rating', () => {
        expect(service.calculateGyroWeight(0, 'Standard')).toBe(0);
        expect(service.calculateGyroWeight(-10, 'Standard')).toBe(0);
      });
    });

    describe('calculateGyroSlots', () => {
      it('should return correct slots for each gyro type', () => {
        expect(service.calculateGyroSlots('Standard')).toBe(4);
        expect(service.calculateGyroSlots('XL')).toBe(6);
        expect(service.calculateGyroSlots('Compact')).toBe(2);
        expect(service.calculateGyroSlots('Heavy-Duty')).toBe(4);
      });
    });
  });

  describe('Heat Sink Calculations', () => {
    describe('calculateHeatSinkWeight', () => {
      it('should calculate heat sink weights correctly', () => {
        expect(service.calculateHeatSinkWeight('Single', 5)).toBe(5);
        expect(service.calculateHeatSinkWeight('Double', 3)).toBe(3);
        expect(service.calculateHeatSinkWeight('Compact', 4)).toBe(2);
        expect(service.calculateHeatSinkWeight('Laser', 2)).toBe(3);
      });

      it('should handle zero or negative external count', () => {
        expect(service.calculateHeatSinkWeight('Single', 0)).toBe(0);
        expect(service.calculateHeatSinkWeight('Single', -5)).toBe(0);
      });
    });

    describe('calculateInternalHeatSinks', () => {
      it('should calculate internal heat sinks for fusion engines', () => {
        expect(service.calculateInternalHeatSinks(250, 'Standard')).toBe(10);
        expect(service.calculateInternalHeatSinks(300, 'XL')).toBe(12); // XL engines follow same rule as standard - only rating matters
        expect(service.calculateInternalHeatSinks(200, 'Standard')).toBe(8);
        expect(service.calculateInternalHeatSinks(100, 'Standard')).toBe(4);
      });

      it('should return zero for non-fusion engines', () => {
        expect(service.calculateInternalHeatSinks(250, 'ICE')).toBe(0);
        expect(service.calculateInternalHeatSinks(300, 'Fuel Cell')).toBe(0);
      });
    });

    describe('calculateHeatDissipation', () => {
      it('should calculate heat dissipation correctly', () => {
        expect(service.calculateHeatDissipation(10, 'Single')).toBe(10);
        expect(service.calculateHeatDissipation(10, 'Double')).toBe(20);
        expect(service.calculateHeatDissipation(10, 'Compact')).toBe(10);
        expect(service.calculateHeatDissipation(10, 'Laser')).toBe(10);
      });
    });
  });

  describe('Structure Calculations', () => {
    describe('calculateStructureWeight', () => {
      it('should calculate Standard structure weight correctly', () => {
        expect(service.calculateStructureWeight(50, 'Standard')).toBe(5);
        expect(service.calculateStructureWeight(75, 'Standard')).toBe(8);
        expect(service.calculateStructureWeight(100, 'Standard')).toBe(10);
      });

      it('should calculate Endo Steel structure weight correctly', () => {
        expect(service.calculateStructureWeight(50, 'Endo Steel')).toBe(2.5);
        expect(service.calculateStructureWeight(75, 'Endo Steel')).toBe(4);
        expect(service.calculateStructureWeight(100, 'Endo Steel')).toBe(5);
      });

      it('should calculate Reinforced structure weight correctly', () => {
        expect(service.calculateStructureWeight(50, 'Reinforced')).toBe(10);
        expect(service.calculateStructureWeight(75, 'Reinforced')).toBe(16);
      });
    });

    describe('getStructureCriticalSlots', () => {
      it('should return correct critical slots for structure types', () => {
        expect(service.getStructureCriticalSlots('Standard')).toBe(0);
        expect(service.getStructureCriticalSlots('Endo Steel')).toBe(14);
        expect(service.getStructureCriticalSlots('Endo Steel (Clan)')).toBe(7);
        expect(service.getStructureCriticalSlots('Composite')).toBe(0);
        expect(service.getStructureCriticalSlots('Reinforced')).toBe(0);
      });
    });
  });

  describe('System Allocation', () => {
    describe('getCompleteSystemAllocation', () => {
      it('should provide complete system allocation for Standard/Standard', () => {
        const allocation = service.getCompleteSystemAllocation('Standard', 'Standard');
        
        // Engine should have slots from SystemComponentRules
        expect(allocation.engine.centerTorso).toContain(0);
        expect(allocation.engine.centerTorso).toContain(1);
        expect(allocation.engine.centerTorso).toContain(2);
        expect(allocation.engine.leftTorso).toEqual([]);
        expect(allocation.engine.rightTorso).toEqual([]);
        
        // Gyro should have slots from SystemComponentRules
        expect(allocation.gyro.centerTorso).toContain(3);
        expect(allocation.gyro.centerTorso).toContain(4);
        expect(allocation.gyro.centerTorso).toContain(5);
        expect(allocation.gyro.centerTorso).toContain(6);
        expect(allocation.gyro.totalSlots).toBe(4);
      });

      it('should provide complete system allocation for XL/XL', () => {
        const allocation = service.getCompleteSystemAllocation('XL', 'XL');
        
        // Engine should have slots from SystemComponentRules
        expect(allocation.engine.centerTorso.length).toBeGreaterThan(0);
        expect(allocation.engine.leftTorso.length).toBeGreaterThan(0);
        expect(allocation.engine.rightTorso.length).toBeGreaterThan(0);
        
        // Gyro should have slots from SystemComponentRules  
        expect(allocation.gyro.centerTorso.length).toBe(6);
        expect(allocation.gyro.totalSlots).toBe(6);
      });

      it('should provide complete system allocation for Compact/Compact', () => {
        const allocation = service.getCompleteSystemAllocation('Compact', 'Compact');
        
        // Engine should have slots from SystemComponentRules
        expect(allocation.engine.centerTorso.length).toBeGreaterThan(0);
        expect(allocation.engine.leftTorso).toEqual([]);
        expect(allocation.engine.rightTorso).toEqual([]);
        
        // Gyro should have slots from SystemComponentRules
        expect(allocation.gyro.centerTorso.length).toBe(2);
        expect(allocation.gyro.totalSlots).toBe(2);
      });
    });
  });

  describe('System Validation', () => {
    describe('validateSystemComponents', () => {
      it('should validate compatible system combinations', () => {
        const result = service.validateSystemComponents('Standard', 'Standard');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate XL engine with Standard gyro', () => {
        const result = service.validateSystemComponents('XL', 'Standard');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject invalid engine types', () => {
        const result = service.validateSystemComponents('InvalidEngine' as EngineType, 'Standard');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid engine type: InvalidEngine');
      });

      it('should reject invalid gyro types', () => {
        const result = service.validateSystemComponents('Standard', 'InvalidGyro' as GyroType);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid gyro type: InvalidGyro');
      });

      it('should warn about unusual ICE engine combinations', () => {
        const result = service.validateSystemComponents('ICE', 'XL');
        expect(result.warnings).toContain('XL gyro with ICE engine is unusual');
      });

      it('should detect slot conflicts', () => {
        // This would require a combination that actually conflicts
        // The current implementation may not have conflicts, but the test structure is ready
        const allocation = service.getCompleteSystemAllocation('XL', 'XL');
        const gyroSlots = allocation.gyro.centerTorso;
        const engineSlots = allocation.engine.centerTorso;
        
        // Verify no overlaps in current implementation
        const overlap = gyroSlots.some(slot => engineSlots.includes(slot));
        expect(overlap).toBe(false);
      });
    });
  });

  describe('Comprehensive Weight Calculations', () => {
    it('should calculate complete system weights', () => {
      const mockConfig: UnitConfiguration = {
        chassis: 'Test Mech',
        model: 'TST-1',
        tonnage: 50,
        unitType: 'BattleMech',
        techBase: 'Inner Sphere',
        walkMP: 4,
        engineRating: 200,
        runMP: 6,
        engineType: 'Standard',
        gyroType: { type: 'Standard', techBase: 'Inner Sphere' },
        structureType: { type: 'Standard', techBase: 'Inner Sphere' },
        armorType: { type: 'Standard', techBase: 'Inner Sphere' },
        armorAllocation: {
          HD: { front: 9, rear: 0 },
          CT: { front: 20, rear: 6 },
          LT: { front: 15, rear: 4 },
          RT: { front: 15, rear: 4 },
          LA: { front: 12, rear: 0 },
          RA: { front: 12, rear: 0 },
          LL: { front: 15, rear: 0 },
          RL: { front: 15, rear: 0 }
        },
        armorTonnage: 6.5,
        heatSinkType: { type: 'Single', techBase: 'Inner Sphere' },
        totalHeatSinks: 10,
        internalHeatSinks: 8,
        externalHeatSinks: 2,
        enhancements: [],
        jumpMP: 0,
        jumpJetType: { type: 'Standard Jump Jet', techBase: 'Inner Sphere' },
        jumpJetCounts: {},
        hasPartialWing: false,
        mass: 50
      };

      const weights = (service as SystemComponentServiceImpl).calculateSystemWeights(mockConfig);
      
      expect(weights.engine).toBe(8); // 200/25 = 8
      expect(weights.gyro).toBe(2); // ceil(200/100) = 2
      expect(weights.structure).toBe(5); // ceil(50/10) = 5
      expect(weights.heatSinks).toBe(2); // 2 external * 1.0 = 2
      expect(weights.total).toBe(17); // 8 + 2 + 5 + 2 = 17
    });

    it('should calculate weights for XL engine configuration', () => {
      const mockConfig: UnitConfiguration = {
        chassis: 'Test Mech',
        model: 'TST-2',
        tonnage: 75,
        unitType: 'BattleMech',
        techBase: 'Inner Sphere',
        walkMP: 4,
        engineRating: 300,
        runMP: 6,
        engineType: 'XL',
        gyroType: { type: 'XL', techBase: 'Inner Sphere' },
        structureType: { type: 'Endo Steel', techBase: 'Inner Sphere' },
        armorType: { type: 'Standard', techBase: 'Inner Sphere' },
        armorAllocation: {
          HD: { front: 9, rear: 0 },
          CT: { front: 24, rear: 8 },
          LT: { front: 18, rear: 6 },
          RT: { front: 18, rear: 6 },
          LA: { front: 15, rear: 0 },
          RA: { front: 15, rear: 0 },
          LL: { front: 18, rear: 0 },
          RL: { front: 18, rear: 0 }
        },
        armorTonnage: 9.5,
        heatSinkType: { type: 'Double', techBase: 'Inner Sphere' },
        totalHeatSinks: 15,
        internalHeatSinks: 10,
        externalHeatSinks: 5,
        enhancements: [],
        jumpMP: 0,
        jumpJetType: { type: 'Standard Jump Jet', techBase: 'Inner Sphere' },
        jumpJetCounts: {},
        hasPartialWing: false,
        mass: 75
      };

      const weights = (service as SystemComponentServiceImpl).calculateSystemWeights(mockConfig);
      
      expect(weights.engine).toBe(6); // 300/25 * 0.5 = 6
      expect(weights.gyro).toBe(1.5); // ceil(300/100) * 0.5 = 1.5
      expect(weights.structure).toBe(4); // ceil(75/10) * 0.5 = 4
      expect(weights.heatSinks).toBe(5); // 5 external * 1.0 = 5
      expect(weights.total).toBe(16.5); // 6 + 1.5 + 4 + 5 = 16.5
    });
  });

  describe('BattleTech Rule Compliance', () => {
    it('should enforce minimum engine rating constraints', () => {
      const result = service.validateEngineRating(100, 1);
      expect(result.isValid).toBe(true);
      expect(result.maxWalkMP).toBe(4);
    });

    it('should enforce maximum engine rating of 400', () => {
      const result = service.validateEngineRating(20, 21); // Would be 420 rating
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Engine rating 420 exceeds maximum of 400');
    });

    it('should calculate internal heat sinks according to BattleTech rules', () => {
      // Official BattleTech rule: Engine Rating ÷ 25 (rounded down), NO MINIMUM
      expect(service.calculateInternalHeatSinks(250, 'Standard')).toBe(10);
      expect(service.calculateInternalHeatSinks(400, 'XL')).toBe(16); // XL engines follow same rule as standard - only rating matters
      
      // Smaller engines get rating/25 heat sinks
      expect(service.calculateInternalHeatSinks(200, 'Standard')).toBe(8);
      expect(service.calculateInternalHeatSinks(175, 'Light')).toBe(7); // Light engines follow same rule - 175/25 = 7
      expect(service.calculateInternalHeatSinks(100, 'Standard')).toBe(4);
    });

    it('should calculate gyro weight based on engine rating', () => {
      // Gyro weight is ceil(engine_rating / 100) * modifier
      expect(service.calculateGyroWeight(195, 'Standard')).toBe(2); // ceil(1.95) = 2
      expect(service.calculateGyroWeight(205, 'Standard')).toBe(3); // ceil(2.05) = 3
      expect(service.calculateGyroWeight(300, 'Standard')).toBe(3); // ceil(3.0) = 3
    });
  });

  describe('Performance Tests', () => {
    it('should handle engine calculations efficiently', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        service.calculateEngineWeight(200 + i % 200, 'Standard');
        service.calculateEngineSlots('XL');
        service.validateEngineRating(50 + i % 50, 4);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50); // Should complete 1000 operations in < 50ms
    });

    it('should handle system validation efficiently', () => {
      const startTime = performance.now();
      
      const engineTypes: EngineType[] = ['Standard', 'XL', 'Light', 'Compact'];
      const gyroTypes: GyroType[] = ['Standard', 'XL', 'Compact', 'Heavy-Duty'];
      
      for (let i = 0; i < 100; i++) {
        const engineType = engineTypes[i % engineTypes.length];
        const gyroType = gyroTypes[i % gyroTypes.length];
        
        service.validateSystemComponents(engineType, gyroType);
        service.getCompleteSystemAllocation(engineType, gyroType);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(25); // Should complete 100 validation operations in < 25ms
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum tonnage units', () => {
      const result = service.validateEngineRating(20, 8); // Light mech
      expect(result.isValid).toBe(true);
      expect(result.maxWalkMP).toBe(20);
    });

    it('should handle maximum tonnage units', () => {
      const result = service.validateEngineRating(100, 3); // Assault mech
      expect(result.isValid).toBe(true);
      expect(result.maxWalkMP).toBe(4);
    });

    it('should handle fractional weight calculations', () => {
      const xlWeight = service.calculateEngineWeight(275, 'XL');
      expect(xlWeight).toBe(5.5); // 275/25 * 0.5 = 5.5
      
      const xxlWeight = service.calculateEngineWeight(375, 'XXL');
      expect(xxlWeight).toBeCloseTo(4.95, 2); // 375/25 * 0.33
    });

    it('should validate all engine types exist', () => {
      const engineTypes: EngineType[] = ['Standard', 'XL', 'Light', 'XXL', 'Compact', 'ICE', 'Fuel Cell'];
      
      engineTypes.forEach(engineType => {
        const weight = service.calculateEngineWeight(200, engineType);
        expect(weight).toBeGreaterThan(0);
        
        const slots = service.calculateEngineSlots(engineType);
        expect(slots.totalSlots).toBeGreaterThan(0);
      });
    });

    it('should validate all gyro types exist', () => {
      const gyroTypes: GyroType[] = ['Standard', 'XL', 'Compact', 'Heavy-Duty'];
      
      gyroTypes.forEach(gyroType => {
        const weight = service.calculateGyroWeight(200, gyroType);
        expect(weight).toBeGreaterThan(0);
        
        const slots = service.calculateGyroSlots(gyroType);
        expect(slots).toBeGreaterThanOrEqual(2);
        expect(slots).toBeLessThanOrEqual(6);
      });
    });
  });
});
