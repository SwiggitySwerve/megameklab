/**
 * State Management Flow Tests
 * Tests the complete data flow: UI → StateManager → UnitCriticalManager → UI
 * With loop detection and timeout protection
 */

import { testWithLoopDetection, StateChangeMonitor, executeWithLoopDetection } from '../utils/testUtilities';
import { UnitStateManager } from '../utils/criticalSlots/UnitStateManager';
import { UnitCriticalManager, UnitConfiguration, UnitConfigurationBuilder } from '../utils/criticalSlots/UnitCriticalManager';

// Increase timeout for state management tests
jest.setTimeout(20000);

describe('State Management Flow with Loop Detection', () => {
  let stateManager: UnitStateManager;
  let stateMonitor: StateChangeMonitor;
  
  beforeEach(() => {
    stateMonitor = new StateChangeMonitor();
    
    // Create state manager with basic configuration
    const initialConfig: UnitConfiguration = {
      tonnage: 50,
      unitType: 'BattleMech',
      techBase: 'Inner Sphere',
      walkMP: 4,
      runMP: 6,
      engineRating: 200,
      engineType: 'Standard',
      gyroType: 'Standard',
      structureType: 'Standard',
      armorType: 'Standard',
      heatSinkType: 'Single',
      totalHeatSinks: 10,
      internalHeatSinks: 8,
      externalHeatSinks: 2,
      enhancementType: null,
      jumpMP: 0,
      jumpJetType: 'Standard Jump Jet',
      jumpJetCounts: {},
      hasPartialWing: false,
      armorAllocation: {
        HD: { front: 9, rear: 0 },
        CT: { front: 20, rear: 10 },
        LT: { front: 15, rear: 5 },
        RT: { front: 15, rear: 5 },
        LA: { front: 12, rear: 0 },
        RA: { front: 12, rear: 0 },
        LL: { front: 18, rear: 0 },
        RL: { front: 18, rear: 0 }
      },
      totalArmorPoints: 0,
      armorTonnage: 0,
      maxArmorPoints: 0,
      mass: 50
    };
    
    stateManager = new UnitStateManager(initialConfig);
  });

  testWithLoopDetection(
    'should update configuration through factory pattern without loops',
    async () => {
      let updateCount = 0;
      const maxUpdates = 5;
      
      // Subscribe to changes with monitoring
      const unsubscribe = stateManager.subscribe(() => {
        updateCount++;
        const currentConfig = stateManager.getCurrentUnit().getConfiguration();
        stateMonitor.recordChange(currentConfig);
        
        if (updateCount > maxUpdates) {
          throw new Error(`Too many updates detected: ${updateCount}`);
        }
      });
      
      try {
        // Test 1: Basic configuration update
        const newConfig = {
          ...stateManager.getConfiguration(),
          tonnage: 75,
          armorType: 'Ferro-Fibrous' as any
        };
        
        await executeWithLoopDetection(
          () => stateManager.handleConfigurationUpdate(newConfig),
          { timeoutMs: 2000, debugMode: true }
        );
        
        // Verify factory generated correct configuration
        const finalConfig = stateManager.getCurrentUnit().getConfiguration();
        expect(finalConfig.tonnage).toBe(75);
        expect(finalConfig.armorType).toBe('Ferro-Fibrous');
        expect(finalConfig.engineRating).toBe(75 * finalConfig.walkMP); // Factory calculation
        
        // Check for rapid state changes
        const rapidChanges = stateMonitor.detectRapidChanges(1000);
        expect(rapidChanges.hasRapidChanges).toBe(false);
        
        expect(updateCount).toBeLessThanOrEqual(maxUpdates);
        
      } finally {
        unsubscribe();
      }
    },
    15000
  );

  testWithLoopDetection(
    'should handle engine changes through MechConstructor without loops',
    async () => {
      let engineChangeCount = 0;
      const maxEngineChanges = 3;
      
      const unsubscribe = stateManager.subscribe(() => {
        engineChangeCount++;
        stateMonitor.recordChange({
          engineType: stateManager.getCurrentUnit().getEngineType(),
          changeCount: engineChangeCount
        });
        
        if (engineChangeCount > maxEngineChanges) {
          throw new Error(`Engine change loop detected: ${engineChangeCount} changes`);
        }
      });
      
      try {
        // Test engine change through factory
        await executeWithLoopDetection(
          () => stateManager.handleEngineChange('XL'),
          { timeoutMs: 3000, debugMode: true }
        );
        
        // Verify factory rebuilt unit correctly
        const unit = stateManager.getCurrentUnit();
        expect(unit.getEngineType()).toBe('XL');
        
        // Verify factory applied construction rules
        const config = unit.getConfiguration();
        expect(config.engineType).toBe('XL');
        
        // Check for oscillating changes
        const rapidChanges = stateMonitor.detectRapidChanges();
        expect(rapidChanges.suspiciousPatterns).toHaveLength(0);
        
        expect(engineChangeCount).toBeLessThanOrEqual(maxEngineChanges);
        
      } finally {
        unsubscribe();
      }
    },
    15000
  );

  testWithLoopDetection(
    'should handle armor configuration changes through factory without loops',
    async () => {
      let armorUpdateCount = 0;
      const maxArmorUpdates = 5;
      
      const unsubscribe = stateManager.subscribe(() => {
        armorUpdateCount++;
        const config = stateManager.getCurrentUnit().getConfiguration();
        stateMonitor.recordChange({
          armorTonnage: config.armorTonnage,
          maxArmorTonnage: stateManager.getCurrentUnit().getMaxArmorTonnage(),
          updateCount: armorUpdateCount
        });
        
        if (armorUpdateCount > maxArmorUpdates) {
          throw new Error(`Armor update loop detected: ${armorUpdateCount} updates`);
        }
      });
      
      try {
        // Test armor configuration that could trigger loops
        const currentConfig = stateManager.getConfiguration();
        const newConfig = {
          ...currentConfig,
          armorTonnage: 15.0, // High armor tonnage
          totalArmorPoints: 240,
          maxArmorPoints: 240
        };
        
        await executeWithLoopDetection(
          () => stateManager.handleConfigurationUpdate(newConfig),
          { timeoutMs: 3000, debugMode: true }
        );
        
        // Verify factory limits were applied
        const finalConfig = stateManager.getCurrentUnit().getConfiguration();
        const maxAllowed = stateManager.getCurrentUnit().getMaxArmorTonnage();
        expect(finalConfig.armorTonnage).toBeLessThanOrEqual(maxAllowed);
        
        // Check for rapid changes that indicate a loop
        const rapidChanges = stateMonitor.detectRapidChanges();
        expect(rapidChanges.hasRapidChanges).toBe(false);
        
        expect(armorUpdateCount).toBeLessThanOrEqual(maxArmorUpdates);
        
      } finally {
        unsubscribe();
      }
    },
    15000
  );

  testWithLoopDetection(
    'should validate construction rules are enforced by factory',
    async () => {
      const unit = stateManager.getCurrentUnit();
      
      // Test factory enforces head armor maximum
      await executeWithLoopDetection(
        () => {
          const config = unit.getConfiguration();
          const newConfig = {
            ...config,
            armorAllocation: {
              ...config.armorAllocation,
              HD: { front: 15, rear: 0 } // Try to exceed head armor limit
            }
          };
          stateManager.handleConfigurationUpdate(newConfig);
        },
        { timeoutMs: 2000 }
      );
      
      // Factory should enforce 9-point head armor limit
      const finalConfig = unit.getConfiguration();
      const headArmor = finalConfig.armorAllocation.HD.front;
      expect(headArmor).toBeLessThanOrEqual(9);
      
      // Test factory enforces total slot count
      const summary = unit.getSummary();
      expect(summary.totalSlots).toBe(78); // Official BattleTech total
      
      // Test factory uses correct structure weights
      const industrialConfig = {
        ...finalConfig,
        structureType: 'Industrial' as any
      };
      
      await executeWithLoopDetection(
        () => stateManager.handleConfigurationUpdate(industrialConfig),
        { timeoutMs: 2000 }
      );
      
      // Should use 20% weight for industrial (from our fixes)
      const industrialWeight = unit.getUsedTonnage();
      const expectedStructureWeight = finalConfig.tonnage * 0.20;
      expect(industrialWeight).toBeGreaterThanOrEqual(expectedStructureWeight - 1); // Allow for other components
    },
    15000
  );

  testWithLoopDetection(
    'should handle complex configuration updates without state loops',
    async () => {
      let complexUpdateCount = 0;
      const maxComplexUpdates = 10;
      
      const unsubscribe = stateManager.subscribe(() => {
        complexUpdateCount++;
        const config = stateManager.getCurrentUnit().getConfiguration();
        stateMonitor.recordChange({
          tonnage: config.tonnage,
          engineType: config.engineType,
          engineRating: config.engineRating,
          updateCount: complexUpdateCount
        });
        
        if (complexUpdateCount > maxComplexUpdates) {
          throw new Error(`Complex update loop detected: ${complexUpdateCount} updates`);
        }
      });
      
      try {
        // Perform rapid configuration changes that could trigger loops
        const changes = [
          { tonnage: 60, engineType: 'XL' as any },
          { tonnage: 70, engineType: 'Light' as any },
          { tonnage: 80, engineType: 'Standard' as any },
          { armorType: 'Ferro-Fibrous' as any },
          { structureType: 'Endo Steel' as any }
        ];
        
        for (const change of changes) {
          const currentConfig = stateManager.getConfiguration();
          const newConfig = { ...currentConfig, ...change };
          
          await executeWithLoopDetection(
            () => stateManager.handleConfigurationUpdate(newConfig),
            { timeoutMs: 1000 }
          );
        }
        
        // Verify final state is consistent
        const finalConfig = stateManager.getCurrentUnit().getConfiguration();
        expect(finalConfig.tonnage).toBe(80);
        expect(finalConfig.engineType).toBe('Standard');
        expect(finalConfig.engineRating).toBe(80 * finalConfig.walkMP);
        
        // Check for suspicious update patterns
        const rapidChanges = stateMonitor.detectRapidChanges(5000);
        expect(rapidChanges.suspiciousPatterns).toHaveLength(0);
        
        expect(complexUpdateCount).toBeLessThanOrEqual(maxComplexUpdates);
        
      } finally {
        unsubscribe();
      }
    },
    20000
  );

  test('should detect and prevent infinite loops in configuration updates', async () => {
    let callCount = 0;
    
    // Create a function that simulates an infinite loop
    const infiniteLoopFunction = async (): Promise<void> => {
      return new Promise((resolve, reject) => {
        const runLoop = () => {
          callCount++;
          if (callCount < 1000) { // Simulate many iterations
            // Use setTimeout to avoid blocking the event loop completely
            setTimeout(runLoop, 0);
          } else {
            resolve(); // Eventually resolve to avoid true infinite loop in test
          }
        };
        runLoop();
      });
    };
    
    // This should timeout before the function completes
    const { result, detection } = await executeWithLoopDetection(
      infiniteLoopFunction,
      { timeoutMs: 500, debugMode: true } // Short timeout to ensure it triggers
    );
    
    expect(detection.timedOut).toBe(true);
    expect(detection.timeElapsed).toBeGreaterThan(400); // Should timeout around 500ms
    expect(detection.timeElapsed).toBeLessThan(600); // But not too much over
    expect(callCount).toBeGreaterThan(10); // Should have made multiple calls before timeout
  }, 5000);

  test('should provide accurate state monitoring diagnostics', () => {
    const monitor = new StateChangeMonitor();
    
    // Simulate rapid state changes with consistent oscillating values
    // Use simple values that will create clear A-B-A-B pattern when stringified
    const oscillatingStates = [
      { configType: 'A' },  // State A
      { configType: 'B' },  // State B  
      { configType: 'A' },  // Back to A (oscillation)
      { configType: 'B' },  // Back to B (oscillation)
      { configType: 'A' },  // Back to A (oscillation)
      { configType: 'B' }   // Back to B (oscillation)
    ];
    
    oscillatingStates.forEach(state => monitor.recordChange(state));
    
    const analysis = monitor.detectRapidChanges(500);
    expect(analysis.changesInWindow).toBe(6);
    expect(analysis.suspiciousPatterns).toContain('Oscillating between two states');
  });
});

describe('UnitConfigurationBuilder Factory Pattern', () => {
  test('should build complete configuration from partial input', () => {
    const partialConfig = {
      tonnage: 55,
      engineType: 'XL' as any,
      armorType: 'Ferro-Fibrous' as any
    };
    
    const fullConfig = UnitConfigurationBuilder.buildConfiguration(partialConfig);
    
    // Factory should fill in missing values
    expect(fullConfig.tonnage).toBe(55);
    expect(fullConfig.engineType).toBe('XL');
    expect(fullConfig.armorType).toBe('Ferro-Fibrous');
    expect(fullConfig.engineRating).toBeDefined();
    expect(fullConfig.totalHeatSinks).toBeGreaterThanOrEqual(10);
    expect(fullConfig.armorAllocation).toBeDefined();
  });

  test('should calculate dependent values correctly', () => {
    const config = UnitConfigurationBuilder.buildConfiguration({
      tonnage: 60,
      walkMP: 5,
      engineType: 'Standard' as any
    });
    
    // Factory should calculate engine rating
    expect(config.engineRating).toBe(300); // 60 * 5
    expect(config.runMP).toBe(7); // Math.floor(5 * 1.5)
    
    // Factory should calculate heat sinks
    expect(config.internalHeatSinks).toBeGreaterThan(0);
    expect(config.externalHeatSinks).toBeGreaterThanOrEqual(0);
    expect(config.totalHeatSinks).toBe(config.internalHeatSinks + config.externalHeatSinks);
  });

  test('should enforce construction rule constraints', () => {
    const config = UnitConfigurationBuilder.buildConfiguration({
      tonnage: 25,
      walkMP: 20 // This would require engine rating 500, over 400 limit
    });
    
    // Factory should cap engine rating at 400
    expect(config.engineRating).toBeLessThanOrEqual(400);
    expect(config.walkMP).toBeLessThanOrEqual(16); // 400/25 = 16 max
  });
});
