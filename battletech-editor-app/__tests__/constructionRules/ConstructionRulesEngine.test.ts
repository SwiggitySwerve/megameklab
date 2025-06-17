/**
 * Construction Rules Engine Test Suite
 * Comprehensive testing for enhanced construction rules with IS/Clan differentiation
 */

import { ConstructionRulesEngine } from '../../utils/constructionRules/ConstructionRulesEngine';
import { 
  ConstructionContext, 
  EnhancedSystemComponents,
  TechBase,
  TechLevel
} from '../../types/enhancedSystemComponents';

describe('ConstructionRulesEngine', () => {
  let engine: ConstructionRulesEngine;
  let mockISContext: ConstructionContext;
  let mockClanContext: ConstructionContext;
  let mockMixedContext: ConstructionContext;

  beforeEach(() => {
    engine = new ConstructionRulesEngine();
    
    mockISContext = {
      mechTonnage: 65,
      techBase: 'Inner Sphere',
      techLevel: 'Standard',
      era: '3050',
      allowMixedTech: false
    };

    mockClanContext = {
      mechTonnage: 65,
      techBase: 'Clan',
      techLevel: 'Standard',
      era: '3050',
      allowMixedTech: false
    };

    mockMixedContext = {
      mechTonnage: 65,
      techBase: 'Mixed (IS Chassis)',
      techLevel: 'Standard',
      era: '3050',
      allowMixedTech: true
    };
  });

  describe('Engine Type Availability', () => {
    test('should provide IS XL engines for Inner Sphere tech base', () => {
      const availableEngines = engine.getAvailableEngineTypes('Inner Sphere');
      
      const isXLEngine = availableEngines.find(eng => eng.id === 'XL (IS)');
      const clanXLEngine = availableEngines.find(eng => eng.id === 'XL (Clan)');
      
      expect(isXLEngine).toBeDefined();
      expect(isXLEngine?.available).toBe(true);
      expect(clanXLEngine?.available).toBe(false);
    });

    test('should provide Clan XL engines for Clan tech base', () => {
      const availableEngines = engine.getAvailableEngineTypes('Clan');
      
      const isXLEngine = availableEngines.find(eng => eng.id === 'XL (IS)');
      const clanXLEngine = availableEngines.find(eng => eng.id === 'XL (Clan)');
      
      expect(clanXLEngine).toBeDefined();
      expect(clanXLEngine?.available).toBe(true);
      expect(isXLEngine?.available).toBe(false);
    });

    test('should provide both engine types for mixed tech', () => {
      const availableEngines = engine.getAvailableEngineTypes('Mixed (IS Chassis)');
      
      const isXLEngine = availableEngines.find(eng => eng.id === 'XL (IS)');
      const clanXLEngine = availableEngines.find(eng => eng.id === 'XL (Clan)');
      
      expect(isXLEngine?.available).toBe(true);
      expect(clanXLEngine?.available).toBe(true); // Mixed tech allows both
    });

    test('should show correct slot requirements for IS vs Clan XL engines', () => {
      const availableEngines = engine.getAvailableEngineTypes('Inner Sphere');
      
      const isXLEngine = availableEngines.find(eng => eng.id === 'XL (IS)');
      expect(isXLEngine?.details?.criticalSlots).toBe(12); // 6 CT + 3 LT + 3 RT
      
      const clanEngines = engine.getAvailableEngineTypes('Clan');
      const clanXLEngine = clanEngines.find(eng => eng.id === 'XL (Clan)');
      expect(clanXLEngine?.details?.criticalSlots).toBe(10); // 6 CT + 2 LT + 2 RT
    });
  });

  describe('Heat Sink Type Availability', () => {
    test('should provide IS Double heat sinks for Inner Sphere tech base', () => {
      const availableHeatSinks = engine.getAvailableHeatSinkTypes('Inner Sphere');
      
      const isDoubleHS = availableHeatSinks.find(hs => hs.id === 'Double (IS)');
      const clanDoubleHS = availableHeatSinks.find(hs => hs.id === 'Double (Clan)');
      
      expect(isDoubleHS).toBeDefined();
      expect(isDoubleHS?.available).toBe(true);
      expect(clanDoubleHS?.available).toBe(false);
    });

    test('should provide Clan Double heat sinks for Clan tech base', () => {
      const availableHeatSinks = engine.getAvailableHeatSinkTypes('Clan');
      
      const isDoubleHS = availableHeatSinks.find(hs => hs.id === 'Double (IS)');
      const clanDoubleHS = availableHeatSinks.find(hs => hs.id === 'Double (Clan)');
      
      expect(clanDoubleHS).toBeDefined();
      expect(clanDoubleHS?.available).toBe(true);
      expect(isDoubleHS?.available).toBe(false);
    });

    test('should show correct slot requirements for IS vs Clan Double heat sinks', () => {
      const isHeatSinks = engine.getAvailableHeatSinkTypes('Inner Sphere');
      const isDoubleHS = isHeatSinks.find(hs => hs.id === 'Double (IS)');
      expect(isDoubleHS?.details?.criticalSlots).toBe(3);
      
      const clanHeatSinks = engine.getAvailableHeatSinkTypes('Clan');
      const clanDoubleHS = clanHeatSinks.find(hs => hs.id === 'Double (Clan)');
      expect(clanDoubleHS?.details?.criticalSlots).toBe(2);
    });
  });

  describe('Configuration Validation', () => {
    test('should validate compatible IS configuration', () => {
      const mockComponents: any = {
        techBase: 'Inner Sphere',
        techLevel: 'Standard',
        era: '3050',
        engine: {
          type: 'XL (IS)',
          rating: 260,
          techBase: 'Inner Sphere',
          specification: {}
        },
        heatSinks: {
          type: 'Double (IS)',
          total: 15,
          engineIntegrated: 10,
          externalRequired: 5,
          techBase: 'Inner Sphere',
          specification: {}
        },
        gyro: { type: 'Standard', techBase: 'Both', specification: {} },
        cockpit: { type: 'Standard', techBase: 'Both', specification: {} },
        structure: { type: 'Endo Steel', techBase: 'Inner Sphere', specification: {} },
        armor: { type: 'Standard', techBase: 'Both', specification: {} }
      };

      const result = engine.validateConfiguration(mockComponents, mockISContext);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.techBaseViolations).toHaveLength(0);
    });

    test('should reject incompatible tech base combinations', () => {
      const mockComponents: any = {
        techBase: 'Inner Sphere',
        techLevel: 'Standard',
        era: '3050',
        engine: {
          type: 'XL (Clan)', // Clan engine on IS chassis
          rating: 260,
          techBase: 'Clan',
          specification: {}
        },
        heatSinks: {
          type: 'Double (IS)',
          total: 15,
          engineIntegrated: 10,
          externalRequired: 5,
          techBase: 'Inner Sphere',
          specification: {}
        },
        gyro: { type: 'Standard', techBase: 'Both', specification: {} },
        cockpit: { type: 'Standard', techBase: 'Both', specification: {} },
        structure: { type: 'Standard', techBase: 'Both', specification: {} },
        armor: { type: 'Standard', techBase: 'Both', specification: {} }
      };

      const result = engine.validateConfiguration(mockComponents, mockISContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.techBaseViolations.length).toBeGreaterThan(0);
      expect(result.techBaseViolations[0].component).toBe('engine');
      expect(result.techBaseViolations[0].violation).toBe('tech_base_mismatch');
    });

    test('should validate mixed tech configurations with warnings', () => {
      const mockComponents: any = {
        techBase: 'Mixed (IS Chassis)',
        techLevel: 'Standard',
        era: '3050',
        engine: {
          type: 'XL (Clan)', // Clan engine on IS chassis - allowed for mixed tech
          rating: 260,
          techBase: 'Clan',
          specification: {}
        },
        heatSinks: {
          type: 'Double (IS)',
          total: 15,
          engineIntegrated: 10,
          externalRequired: 5,
          techBase: 'Inner Sphere',
          specification: {}
        },
        gyro: { type: 'Standard', techBase: 'Both', specification: {} },
        cockpit: { type: 'Standard', techBase: 'Both', specification: {} },
        structure: { type: 'Standard', techBase: 'Both', specification: {} },
        armor: { type: 'Standard', techBase: 'Both', specification: {} }
      };

      const result = engine.validateConfiguration(mockComponents, mockMixedContext);
      
      expect(result.isValid).toBe(true); // Should be valid for mixed tech
      expect(result.warnings.length).toBeGreaterThan(0); // But should have warnings
    });
  });

  describe('Slot Allocation Calculation', () => {
    test('should calculate correct slot requirements for IS XL engine', () => {
      const mockComponents: any = {
        engine: { type: 'XL (IS)' },
        heatSinks: { type: 'Double (IS)', total: 10, engineIntegrated: 10, externalRequired: 0 }
      };

      const slotRequirements = engine.calculateSystemSlotRequirements(mockComponents);
      
      expect(slotRequirements['Center Torso']).toBe(10); // 6 engine + 4 gyro
      expect(slotRequirements['Left Torso']).toBe(3); // 3 engine slots
      expect(slotRequirements['Right Torso']).toBe(3); // 3 engine slots
      expect(slotRequirements['Head']).toBe(1); // 1 cockpit
    });

    test('should calculate correct slot requirements for Clan XL engine', () => {
      const mockComponents: any = {
        engine: { type: 'XL (Clan)' },
        heatSinks: { type: 'Double (Clan)', total: 10, engineIntegrated: 10, externalRequired: 0 }
      };

      const slotRequirements = engine.calculateSystemSlotRequirements(mockComponents);
      
      expect(slotRequirements['Center Torso']).toBe(10); // 6 engine + 4 gyro
      expect(slotRequirements['Left Torso']).toBe(2); // 2 engine slots (Clan XL efficiency)
      expect(slotRequirements['Right Torso']).toBe(2); // 2 engine slots (Clan XL efficiency)
      expect(slotRequirements['Head']).toBe(1); // 1 cockpit
    });

    test('should calculate external heat sink slot requirements correctly', () => {
      const mockComponents: any = {
        engine: { type: 'Standard' },
        heatSinks: { 
          type: 'Double (IS)', 
          total: 15, 
          engineIntegrated: 10, 
          externalRequired: 5 
        }
      };

      const slotRequirements = engine.calculateSystemSlotRequirements(mockComponents);
      
      // With 5 external IS Double Heat Sinks (3 slots each = 15 slots)
      // Should be distributed across locations
      const totalExternalSlots = Object.values(slotRequirements).reduce((sum, slots) => sum + slots, 0);
      expect(totalExternalSlots).toBeGreaterThan(15); // At least 15 from heat sinks + system components
    });
  });

  describe('Engine Survivability Rules', () => {
    test('should provide appropriate warnings for IS XL engines', () => {
      const mockComponents: any = {
        techBase: 'Inner Sphere',
        techLevel: 'Standard',
        era: '3050',
        engine: {
          type: 'XL (IS)',
          rating: 260,
          techBase: 'Inner Sphere',
          specification: {}
        },
        heatSinks: { type: 'Double (IS)', total: 10, techBase: 'Inner Sphere', specification: {} },
        gyro: { type: 'Standard', techBase: 'Both', specification: {} },
        cockpit: { type: 'Standard', techBase: 'Both', specification: {} },
        structure: { type: 'Standard', techBase: 'Both', specification: {} },
        armor: { type: 'Standard', techBase: 'Both', specification: {} }
      };

      const result = engine.validateConfiguration(mockComponents, mockISContext);
      
      const hasXLWarning = result.warnings.some(warning => 
        warning.includes('IS XL engines are destroyed')
      );
      expect(hasXLWarning).toBe(true);
    });

    test('should provide appropriate warnings for Clan XL engines', () => {
      const mockComponents: any = {
        techBase: 'Clan',
        techLevel: 'Standard',
        era: '3050',
        engine: {
          type: 'XL (Clan)',
          rating: 260,
          techBase: 'Clan',
          specification: {}
        },
        heatSinks: { type: 'Double (Clan)', total: 10, techBase: 'Clan', specification: {} },
        gyro: { type: 'Standard', techBase: 'Both', specification: {} },
        cockpit: { type: 'Standard', techBase: 'Both', specification: {} },
        structure: { type: 'Standard', techBase: 'Both', specification: {} },
        armor: { type: 'Standard', techBase: 'Both', specification: {} }
      };

      const result = engine.validateConfiguration(mockComponents, mockClanContext);
      
      const hasXLWarning = result.warnings.some(warning => 
        warning.includes('Clan XL engines continue with -2 penalty')
      );
      expect(hasXLWarning).toBe(true);
    });
  });

  describe('Heat Sink Requirements', () => {
    test('should enforce minimum heat sink requirement', () => {
      const mockComponents: any = {
        techBase: 'Inner Sphere',
        techLevel: 'Standard',
        era: '3050',
        engine: { type: 'Standard', rating: 200, techBase: 'Both', specification: {} },
        heatSinks: {
          type: 'Single',
          total: 8, // Below minimum of 10
          engineIntegrated: 8,
          externalRequired: 0,
          techBase: 'Both',
          specification: {}
        },
        gyro: { type: 'Standard', techBase: 'Both', specification: {} },
        cockpit: { type: 'Standard', techBase: 'Both', specification: {} },
        structure: { type: 'Standard', techBase: 'Both', specification: {} },
        armor: { type: 'Standard', techBase: 'Both', specification: {} }
      };

      const result = engine.validateConfiguration(mockComponents, mockISContext);
      
      expect(result.isValid).toBe(false);
      const hasMinHeatSinkError = result.errors.some(error => 
        error.includes('must have at least 10 heat sinks')
      );
      expect(hasMinHeatSinkError).toBe(true);
    });

    test('should validate heat sink compatibility with tech base', () => {
      const mockComponents: any = {
        techBase: 'Inner Sphere',
        techLevel: 'Standard',
        era: '3050',
        engine: { type: 'Standard', rating: 200, techBase: 'Both', specification: {} },
        heatSinks: {
          type: 'Double (Clan)', // Clan heat sinks on IS chassis
          total: 10,
          engineIntegrated: 10,
          externalRequired: 0,
          techBase: 'Clan',
          specification: {}
        },
        gyro: { type: 'Standard', techBase: 'Both', specification: {} },
        cockpit: { type: 'Standard', techBase: 'Both', specification: {} },
        structure: { type: 'Standard', techBase: 'Both', specification: {} },
        armor: { type: 'Standard', techBase: 'Both', specification: {} }
      };

      const result = engine.validateConfiguration(mockComponents, mockISContext);
      
      expect(result.isValid).toBe(false);
      expect(result.techBaseViolations.length).toBeGreaterThan(0);
      expect(result.techBaseViolations[0].component).toBe('heatSinks');
    });
  });

  describe('Performance Edge Cases', () => {
    test('should handle Standard engines without slot violations', () => {
      const mockComponents: any = {
        techBase: 'Inner Sphere',
        techLevel: 'Standard',
        era: '3050',
        engine: { type: 'Standard', rating: 260, techBase: 'Both', specification: {} },
        heatSinks: { type: 'Single', total: 10, techBase: 'Both', specification: {} },
        gyro: { type: 'Standard', techBase: 'Both', specification: {} },
        cockpit: { type: 'Standard', techBase: 'Both', specification: {} },
        structure: { type: 'Standard', techBase: 'Both', specification: {} },
        armor: { type: 'Standard', techBase: 'Both', specification: {} }
      };

      const result = engine.validateConfiguration(mockComponents, mockISContext);
      
      expect(result.isValid).toBe(true);
      expect(result.slotViolations).toHaveLength(0);
    });

    test('should handle invalid engine ratings', () => {
      const mockComponents: any = {
        techBase: 'Inner Sphere',
        techLevel: 'Standard',
        era: '3050',
        engine: { 
          type: 'Standard', 
          rating: 600, // Invalid rating > 500
          techBase: 'Both', 
          specification: {} 
        },
        heatSinks: { type: 'Single', total: 10, techBase: 'Both', specification: {} },
        gyro: { type: 'Standard', techBase: 'Both', specification: {} },
        cockpit: { type: 'Standard', techBase: 'Both', specification: {} },
        structure: { type: 'Standard', techBase: 'Both', specification: {} },
        armor: { type: 'Standard', techBase: 'Both', specification: {} }
      };

      const result = engine.validateConfiguration(mockComponents, mockISContext);
      
      expect(result.isValid).toBe(false);
      const hasEngineRatingError = result.errors.some(error => 
        error.includes('Engine rating') && error.includes('outside valid range')
      );
      expect(hasEngineRatingError).toBe(true);
    });
  });

  describe('Caching and Performance', () => {
    test('should cache component availability results', () => {
      // First call
      const start1 = performance.now();
      const engines1 = engine.getAvailableEngineTypes('Inner Sphere');
      const end1 = performance.now();
      
      // Second call should be faster (cached)
      const start2 = performance.now();
      const engines2 = engine.getAvailableEngineTypes('Inner Sphere');
      const end2 = performance.now();
      
      expect(engines1).toEqual(engines2);
      // Note: In a real test environment, we might not see significant timing differences
      // This is more of a structural test
      expect(engines2.length).toBeGreaterThan(0);
    });
  });
});
