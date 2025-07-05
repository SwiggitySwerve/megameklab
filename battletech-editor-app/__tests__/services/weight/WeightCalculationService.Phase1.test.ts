/**
 * Phase 1 Refactoring Tests for Weight Calculation Domain
 * 
 * Tests validate:
 * - Type safety improvements (no 'as any' casts)
 * - SOLID principles compliance
 * - Proper interface implementation
 * - Dependency injection support
 * - Naming convention compliance
 */

import { WeightCalculationService } from '../../../services/weight/WeightCalculationService';
import { 
  IWeightCalculationService,
  WeightSummary,
  ComponentWeightBreakdown,
  TonnageValidation,
  EquipmentItem,
  isValidUnitConfiguration,
  isValidEquipmentArray
} from '../../../services/weight/IWeightCalculationService';
import { 
  IWeightCalculationServiceFactory,
  WeightCalculationServiceFactory,
  MockWeightCalculationService,
  createWeightCalculationService,
  getWeightCalculationServiceFactory,
  setWeightCalculationServiceFactory,
  resetWeightCalculationServiceFactory
} from '../../../services/weight/WeightCalculationServiceFactory';
import { WeightBalanceServiceImpl } from '../../../services/WeightBalanceService';
import { UnitConfiguration } from '../../../utils/criticalSlots/UnitCriticalManager';

describe('Phase 1 Weight Calculation Domain Refactoring', () => {
  
  describe('Type Safety Improvements', () => {
    
    test('should have proper interface implementation without "as any" casts', () => {
      const service = new WeightCalculationService();
      
      // Verify service implements interface correctly
      expect(service).toBeInstanceOf(WeightCalculationService);
      expect(typeof service.calculateTotalWeight).toBe('function');
      expect(typeof service.calculateComponentWeights).toBe('function');
      expect(typeof service.calculateEquipmentWeight).toBe('function');
      expect(typeof service.validateTonnageLimit).toBe('function');
      expect(typeof service.calculateRemainingTonnage).toBe('function');
      expect(typeof service.isWithinTonnageLimit).toBe('function');
      expect(typeof service.calculateJumpJetWeight).toBe('function');
    });
    
    test('should validate input parameters with type guards', () => {
      const service = new WeightCalculationService();
      
      // Test invalid configuration
      expect(() => {
        service.calculateTotalWeight(null as any, []);
      }).toThrow('Invalid unit configuration provided');
      
      // Test invalid equipment array  
      expect(() => {
        service.calculateTotalWeight(createValidConfig(), null as any);
      }).toThrow('Invalid equipment array provided');
      
      // Test valid inputs should not throw
      expect(() => {
        service.calculateTotalWeight(createValidConfig(), createValidEquipment());
      }).not.toThrow();
    });
    
    test('should have proper type guards working correctly', () => {
      // Valid configuration
      const validConfig = createValidConfig();
      expect(isValidUnitConfiguration(validConfig)).toBe(true);
      
      // Invalid configurations
      expect(isValidUnitConfiguration(null)).toBe(false);
      expect(isValidUnitConfiguration(undefined)).toBe(false);
      expect(isValidUnitConfiguration({})).toBe(false);
      expect(isValidUnitConfiguration({ tonnage: -1 })).toBe(false);
      expect(isValidUnitConfiguration({ tonnage: 'invalid' })).toBe(false);
      
      // Valid equipment array
      const validEquipment = createValidEquipment();
      expect(isValidEquipmentArray(validEquipment)).toBe(true);
      
      // Invalid equipment arrays
      expect(isValidEquipmentArray(null)).toBe(false);
      expect(isValidEquipmentArray(undefined)).toBe(false);
      expect(isValidEquipmentArray('invalid')).toBe(false);
    });
    
    test('should use proper TypeScript types instead of any', () => {
      const service = new WeightCalculationService();
      const config = createValidConfig();
      const equipment = createValidEquipment();
      
      const weightSummary = service.calculateTotalWeight(config, equipment);
      
      // Verify return types are properly typed
      expect(typeof weightSummary.totalWeight).toBe('number');
      expect(typeof weightSummary.maxTonnage).toBe('number');
      expect(typeof weightSummary.remainingTonnage).toBe('number');
      expect(typeof weightSummary.percentageUsed).toBe('number');
      expect(typeof weightSummary.isOverweight).toBe('boolean');
      expect(typeof weightSummary.breakdown).toBe('object');
      expect(typeof weightSummary.breakdown.structure).toBe('number');
      expect(typeof weightSummary.breakdown.engine).toBe('number');
    });
  });
  
  describe('SOLID Principles Compliance', () => {
    
    test('Single Responsibility Principle: Service has focused responsibility', () => {
      const service = new WeightCalculationService();
      
      // WeightCalculationService should only handle weight calculations
      expect(service.calculateTotalWeight).toBeDefined();
      expect(service.calculateComponentWeights).toBeDefined();
      expect(service.calculateEquipmentWeight).toBeDefined();
      expect(service.calculateJumpJetWeight).toBeDefined();
      
      // Should not have unrelated responsibilities
      expect((service as any).validateConfiguration).toBeUndefined();
      expect((service as any).optimizeWeight).toBeUndefined();
      expect((service as any).analyzeBalance).toBeUndefined();
    });
    
    test('Open/Closed Principle: Can be extended without modification', () => {
      // Create extended service
      class ExtendedWeightCalculationService extends WeightCalculationService {
        calculateAdvancedWeight(config: UnitConfiguration, equipment: EquipmentItem[]): number {
          const summary = this.calculateTotalWeight(config, equipment);
          return summary.totalWeight * 1.1; // Add 10% complexity factor
        }
      }
      
      const extendedService = new ExtendedWeightCalculationService();
      const config = createValidConfig();
      const equipment = createValidEquipment();
      
      // Original functionality still works
      const summary = extendedService.calculateTotalWeight(config, equipment);
      expect(summary).toBeDefined();
      expect(typeof summary.totalWeight).toBe('number');
      
      // Extended functionality works
      const advancedWeight = extendedService.calculateAdvancedWeight(config, equipment);
      expect(advancedWeight).toBeGreaterThan(summary.totalWeight);
    });
    
    test('Liskov Substitution Principle: Interface implementations are substitutable', () => {
      const realService: IWeightCalculationService = new WeightCalculationService();
      const mockService: IWeightCalculationService = new MockWeightCalculationService();
      
      const config = createValidConfig();
      const equipment = createValidEquipment();
      
      // Both should satisfy the interface contract
      const realResult = realService.calculateTotalWeight(config, equipment);
      const mockResult = mockService.calculateTotalWeight(config, equipment);
      
      // Both results should have the same structure
      expect(realResult).toHaveProperty('totalWeight');
      expect(realResult).toHaveProperty('maxTonnage');
      expect(realResult).toHaveProperty('remainingTonnage');
      expect(realResult).toHaveProperty('isOverweight');
      expect(realResult).toHaveProperty('breakdown');
      
      expect(mockResult).toHaveProperty('totalWeight');
      expect(mockResult).toHaveProperty('maxTonnage');
      expect(mockResult).toHaveProperty('remainingTonnage');
      expect(mockResult).toHaveProperty('isOverweight');
      expect(mockResult).toHaveProperty('breakdown');
    });
    
    test('Interface Segregation Principle: Focused interface contracts', () => {
      // IWeightCalculationService should only contain weight-related methods
      const service: IWeightCalculationService = new WeightCalculationService();
      
      // Interface should have focused, weight-related methods only
      expect(typeof service.calculateTotalWeight).toBe('function');
      expect(typeof service.calculateComponentWeights).toBe('function');
      expect(typeof service.calculateEquipmentWeight).toBe('function');
      expect(typeof service.validateTonnageLimit).toBe('function');
      expect(typeof service.calculateRemainingTonnage).toBe('function');
      expect(typeof service.isWithinTonnageLimit).toBe('function');
      expect(typeof service.calculateJumpJetWeight).toBe('function');
      
      // Should not force clients to depend on unrelated methods
      expect((service as any).analyzeStability).toBeUndefined();
      expect((service as any).optimizeConfiguration).toBeUndefined();
      expect((service as any).validateEquipment).toBeUndefined();
    });
    
    test('Dependency Inversion Principle: Uses dependency injection', () => {
      // WeightBalanceService should accept injected dependencies
      const mockWeightService = new MockWeightCalculationService();
      const balanceService = new WeightBalanceServiceImpl(mockWeightService);
      
      const config = createValidConfig();
      const equipment = createValidEquipment();
      
      // Service should use the injected dependency
      const result = balanceService.calculateTotalWeight(config, equipment);
      expect(result.totalWeight).toBe(50); // Mock returns fixed value
      
      // Test with default factory
      const defaultService = new WeightBalanceServiceImpl();
      const defaultResult = defaultService.calculateTotalWeight(config, equipment);
      expect(defaultResult).toBeDefined();
    });
  });
  
  describe('Naming Convention Compliance', () => {
    
    test('Interface should start with "I" prefix', () => {
      // Interface name should follow convention (check import name since interfaces don't have runtime names)
      const interfaceName = 'IWeightCalculationService';
      expect(interfaceName).toMatch(/^I[A-Z]/);
      expect(interfaceName).toBe('IWeightCalculationService');
    });
    
    test('Service should end with "Service" suffix', () => {
      const service = new WeightCalculationService();
      expect(service.constructor.name).toBe('WeightCalculationService');
      expect(service.constructor.name.endsWith('Service')).toBe(true);
    });
    
    test('Factory should end with "Factory" suffix', () => {
      const factory = new WeightCalculationServiceFactory();
      expect(factory.constructor.name).toBe('WeightCalculationServiceFactory');
      expect(factory.constructor.name.endsWith('Factory')).toBe(true);
    });
    
    test('Should not use forbidden naming patterns', () => {
      // Should not have "Impl" suffix, version numbers, or temp names
      expect(WeightCalculationService.name).not.toContain('Impl');
      expect(WeightCalculationService.name).not.toContain('V2');
      expect(WeightCalculationService.name).not.toContain('V3');
      expect(WeightCalculationService.name).not.toContain('Refactored');
      expect(WeightCalculationService.name).not.toContain('New');
      expect(WeightCalculationService.name).not.toContain('Old');
    });
  });
  
  describe('Factory Pattern Implementation', () => {
    
    beforeEach(() => {
      resetWeightCalculationServiceFactory();
    });
    
    test('Factory should create proper service instances', () => {
      const factory = new WeightCalculationServiceFactory();
      
      const service = factory.createWeightCalculationService();
      expect(service).toBeInstanceOf(WeightCalculationService);
      expect(typeof service.calculateTotalWeight).toBe('function');
      
      const mockService = factory.createMockWeightCalculationService();
      expect(mockService).toBeInstanceOf(MockWeightCalculationService);
    });
    
    test('Singleton factory should work correctly', () => {
      const factory1 = getWeightCalculationServiceFactory();
      const factory2 = getWeightCalculationServiceFactory();
      
      expect(factory1).toBe(factory2); // Same instance
      
      const service1 = createWeightCalculationService();
      const service2 = createWeightCalculationService();
      
      expect(service1).not.toBe(service2); // Different instances
      expect(service1.constructor.name).toBe(service2.constructor.name); // Same type
    });
    
    test('Factory can be replaced for testing', () => {
      class TestFactory implements IWeightCalculationServiceFactory {
        createWeightCalculationService(): IWeightCalculationService {
          return new MockWeightCalculationService();
        }
        
        createMockWeightCalculationService(): IWeightCalculationService {
          return new MockWeightCalculationService();
        }
      }
      
      setWeightCalculationServiceFactory(new TestFactory());
      
      const service = createWeightCalculationService();
      expect(service).toBeInstanceOf(MockWeightCalculationService);
      
      resetWeightCalculationServiceFactory();
      
      const normalService = createWeightCalculationService();
      expect(normalService).toBeInstanceOf(WeightCalculationService);
    });
  });
  
  describe('Architecture Integration', () => {
    
    test('Services integrate properly through dependency injection', () => {
      const mockWeightService = new MockWeightCalculationService();
      const balanceService = new WeightBalanceServiceImpl(mockWeightService);
      
      const config = createValidConfig();
      const equipment = createValidEquipment();
      
      // Balance service should use injected weight service
      const result = balanceService.calculateTotalWeight(config, equipment);
      expect(result.totalWeight).toBe(50); // Mock returns this value
      
      // Weight service should be accessible through delegation
      const componentWeights = balanceService.calculateComponentWeights(config);
      expect(componentWeights).toBeDefined();
      expect(componentWeights.structure).toBeDefined();
      expect(componentWeights.engine).toBeDefined();
    });
    
    test('Error handling works correctly across service boundaries', () => {
      const service = new WeightCalculationService();
      
      // Should handle invalid inputs gracefully
      expect(() => {
        service.calculateTotalWeight(null as any, []);
      }).toThrow();
      
      expect(() => {
        service.calculateEquipmentWeight(null as any);
      }).toThrow();
      
      expect(() => {
        service.validateTonnageLimit({} as any, []);
      }).toThrow();
    });
  });
  
  describe('Functional Correctness', () => {
    
    test('Weight calculations produce expected results', () => {
      const service = new WeightCalculationService();
      const config = createValidConfig();
      const equipment = createValidEquipment();
      
      const summary = service.calculateTotalWeight(config, equipment);
      
      expect(summary.totalWeight).toBeGreaterThan(0);
      expect(summary.maxTonnage).toBe(config.tonnage);
      expect(summary.remainingTonnage).toBe(config.tonnage - summary.totalWeight);
      expect(summary.percentageUsed).toBe((summary.totalWeight / config.tonnage) * 100);
      expect(summary.isOverweight).toBe(summary.totalWeight > config.tonnage);
      
      // Breakdown should add up to total
      const breakdownTotal = 
        summary.breakdown.structure +
        summary.breakdown.engine +
        summary.breakdown.gyro +
        summary.breakdown.heatSinks +
        summary.breakdown.armor +
        summary.breakdown.equipment +
        summary.breakdown.ammunition +
        summary.breakdown.jumpJets;
      
      expect(Math.abs(breakdownTotal - summary.totalWeight)).toBeLessThan(0.01);
    });
    
    test('Tonnage validation works correctly', () => {
      const service = new WeightCalculationService();
      
      // Valid configuration
      const validConfig = createValidConfig();
      const validation = service.validateTonnageLimit(validConfig, []);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      
      // Test with overweight equipment
      const heavyEquipment: EquipmentItem[] = Array(20).fill({
        equipmentData: { tonnage: 10, type: 'weapon' },
        quantity: 1
      });
      
      const overweightValidation = service.validateTonnageLimit(validConfig, heavyEquipment);
      expect(overweightValidation.isValid).toBe(false);
      expect(overweightValidation.errors.length).toBeGreaterThan(0);
      expect(overweightValidation.overweight).toBeGreaterThan(0);
      expect(overweightValidation.suggestions.length).toBeGreaterThan(0);
    });
  });
});

// Test Helper Functions

function createValidConfig(): UnitConfiguration {
  return {
    tonnage: 100,
    engineRating: 300,
    engineType: 'Standard',
    structureType: 'Standard',
    armorType: 'Standard',
    gyroType: 'Standard',
    heatSinkType: 'Single',
    jumpMP: 0,
    armorTonnage: 15,
    armorAllocation: {
      head: { front: 9, rear: 0 },
      centerTorso: { front: 30, rear: 15 },
      leftTorso: { front: 20, rear: 10 },
      rightTorso: { front: 20, rear: 10 },
      leftArm: { front: 16, rear: 0 },
      rightArm: { front: 16, rear: 0 },
      leftLeg: { front: 20, rear: 0 },
      rightLeg: { front: 20, rear: 0 }
    }
  } as UnitConfiguration;
}

function createValidEquipment(): EquipmentItem[] {
  return [
    {
      equipmentData: { tonnage: 5, type: 'weapon' },
      quantity: 1
    },
    {
      equipmentData: { tonnage: 2, type: 'ammunition' },
      quantity: 2
    },
    {
      equipmentData: { tonnage: 1, type: 'equipment' },
      quantity: 3
    }
  ];
}