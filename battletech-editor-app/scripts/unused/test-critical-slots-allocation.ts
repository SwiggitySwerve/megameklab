/**
 * Critical Slots Allocation Test Suite
 * Comprehensive testing for equipment allocation in the Customizer V2
 */

import { UnitCriticalManager, UnitConfiguration } from './utils/criticalSlots/UnitCriticalManager';

interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  details?: any;
}

interface TestSuite {
  suiteName: string;
  results: TestResult[];
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    successRate: number;
  };
}

export class CriticalSlotAllocationTester {
  private unitManager: UnitCriticalManager;

  constructor() {
    // Create a basic configuration for testing
    const testConfig: UnitConfiguration = {
      tonnage: 50,
      unitType: 'BattleMech',
      techBase: 'Inner Sphere',
      walkMP: 4,
      engineRating: 200,
      runMP: 6,
      engineType: 'Standard',
      gyroType: 'Standard',
      structureType: 'Standard',
      armorType: 'Standard',
      armorAllocation: {
        HD: { front: 9, rear: 0 },
        CT: { front: 20, rear: 6 },
        LT: { front: 16, rear: 4 },
        RT: { front: 16, rear: 4 },
        LA: { front: 16, rear: 0 },
        RA: { front: 16, rear: 0 },
        LL: { front: 20, rear: 0 },
        RL: { front: 20, rear: 0 }
      },
      armorTonnage: 8.0,
      heatSinkType: 'Single',
      totalHeatSinks: 10,
      internalHeatSinks: 8,
      externalHeatSinks: 2,
      jumpMP: 0,
      jumpJetType: 'Standard Jump Jet',
      jumpJetCounts: {},
      hasPartialWing: false,
      enhancementType: null,
      mass: 50
    };
    
    this.unitManager = new UnitCriticalManager(testConfig);
  }

  /**
   * Run all critical slot allocation tests
   */
  public runAllTests(): TestSuite {
    console.log('🧪 Starting Critical Slots Allocation Test Suite...');
    
    const results: TestResult[] = [];

    // Basic functionality tests
    results.push(...this.testBasicUnitSetup());
    results.push(...this.testConfigurationUpdates());
    results.push(...this.testSpecialComponentGeneration());
    results.push(...this.testValidationSystem());
    results.push(...this.testCalculationMethods());
    results.push(...this.testArmorCalculations());
    results.push(...this.testWeightValidation());

    // Calculate summary
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const successRate = (passed / results.length) * 100;

    const suite: TestSuite = {
      suiteName: 'Critical Slots Allocation',
      results,
      summary: {
        totalTests: results.length,
        passed,
        failed,
        successRate
      }
    };

    this.logTestResults(suite);
    return suite;
  }

  /**
   * Test basic unit setup and configuration
   */
  private testBasicUnitSetup(): TestResult[] {
    const results: TestResult[] = [];

    try {
      // Test 1: Unit initialization
      const config = this.unitManager.getConfiguration();
      results.push({
        testName: 'Unit Initialization',
        passed: config.tonnage === 50 && config.structureType === 'Standard',
        details: { tonnage: config.tonnage, structureType: config.structureType }
      });

      // Test 2: Engine and gyro types
      results.push({
        testName: 'Engine and Gyro Types',
        passed: this.unitManager.getEngineType() === 'Standard' && this.unitManager.getGyroType() === 'Standard',
        details: { 
          engineType: this.unitManager.getEngineType(), 
          gyroType: this.unitManager.getGyroType() 
        }
      });

      // Test 3: Section access
      const headSection = this.unitManager.getSection('Head');
      results.push({
        testName: 'Section Access',
        passed: headSection !== null,
        details: { headSectionExists: headSection !== null }
      });

    } catch (error) {
      results.push({
        testName: 'Basic Unit Setup',
        passed: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return results;
  }

  /**
   * Test configuration updates
   */
  private testConfigurationUpdates(): TestResult[] {
    const results: TestResult[] = [];

    try {
      const originalConfig = this.unitManager.getConfiguration();
      
      // Test configuration update
      const newConfig = {
        ...originalConfig,
        tonnage: 75,
        structureType: 'Endo Steel' as const
      };
      
      this.unitManager.updateConfiguration(newConfig);
      const updatedConfig = this.unitManager.getConfiguration();
      
      results.push({
        testName: 'Configuration Update',
        passed: updatedConfig.tonnage === 75 && updatedConfig.structureType === 'Endo Steel',
        details: { 
          originalTonnage: originalConfig.tonnage,
          updatedTonnage: updatedConfig.tonnage,
          originalStructure: originalConfig.structureType,
          updatedStructure: updatedConfig.structureType
        }
      });

      // Test engine rating auto-calculation
      const expectedEngineRating = updatedConfig.tonnage * updatedConfig.walkMP;
      results.push({
        testName: 'Engine Rating Auto-Calculation',
        passed: updatedConfig.engineRating === Math.min(expectedEngineRating, 400),
        details: { 
          calculated: expectedEngineRating,
          actual: updatedConfig.engineRating,
          walkMP: updatedConfig.walkMP,
          tonnage: updatedConfig.tonnage
        }
      });

    } catch (error) {
      results.push({
        testName: 'Configuration Updates',
        passed: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return results;
  }

  /**
   * Test special component generation (Endo Steel, Ferro-Fibrous)
   */
  private testSpecialComponentGeneration(): TestResult[] {
    const results: TestResult[] = [];

    try {
      // Test Endo Steel generation
      const config = this.unitManager.getConfiguration();
      this.unitManager.updateConfiguration({
        ...config,
        structureType: 'Endo Steel'
      });

      const unallocatedEquipment = this.unitManager.getUnallocatedEquipment();
      const endoSteelPieces = unallocatedEquipment.filter(eq => 
        eq.equipmentData.name === 'Endo Steel'
      );

      results.push({
        testName: 'Endo Steel Generation',
        passed: endoSteelPieces.length === 14,
        details: { 
          endoSteelPieces: endoSteelPieces.length,
          expectedPieces: 14,
          totalUnallocated: unallocatedEquipment.length
        }
      });

      // Test Ferro-Fibrous generation
      this.unitManager.updateConfiguration({
        ...config,
        armorType: 'Ferro-Fibrous'
      });

      const updatedUnallocated = this.unitManager.getUnallocatedEquipment();
      const ferroFibrousPieces = updatedUnallocated.filter(eq => 
        eq.equipmentData.name === 'Ferro-Fibrous'
      );

      results.push({
        testName: 'Ferro-Fibrous Generation',
        passed: ferroFibrousPieces.length === 14,
        details: { 
          ferroFibrousPieces: ferroFibrousPieces.length,
          expectedPieces: 14,
          totalUnallocated: updatedUnallocated.length
        }
      });

    } catch (error) {
      results.push({
        testName: 'Special Component Generation',
        passed: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return results;
  }

  /**
   * Test validation system
   */
  private testValidationSystem(): TestResult[] {
    const results: TestResult[] = [];

    try {
      // Test basic validation
      const validation = this.unitManager.validate();
      results.push({
        testName: 'Basic Validation',
        passed: typeof validation.isValid === 'boolean',
        details: { 
          isValid: validation.isValid,
          errorCount: validation.errors.length,
          warningCount: validation.warnings.length,
          errors: validation.errors,
          warnings: validation.warnings
        }
      });

      // Test summary generation
      const summary = this.unitManager.getSummary();
      results.push({
        testName: 'Summary Generation',
        passed: typeof summary.totalSlots === 'number' && typeof summary.occupiedSlots === 'number',
        details: { 
          totalSlots: summary.totalSlots,
          occupiedSlots: summary.occupiedSlots,
          availableSlots: summary.availableSlots,
          totalWeight: summary.totalWeight
        }
      });

    } catch (error) {
      results.push({
        testName: 'Validation System',
        passed: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return results;
  }

  /**
   * Test calculation methods
   */
  private testCalculationMethods(): TestResult[] {
    const results: TestResult[] = [];

    try {
      // Test tonnage calculations
      const usedTonnage = this.unitManager.getUsedTonnage();
      const remainingTonnage = this.unitManager.getRemainingTonnage();
      const configTonnage = this.unitManager.getConfiguration().tonnage;

      results.push({
        testName: 'Tonnage Calculations',
        passed: usedTonnage + remainingTonnage === configTonnage,
        details: { 
          usedTonnage,
          remainingTonnage,
          totalTonnage: configTonnage,
          calculationCorrect: usedTonnage + remainingTonnage === configTonnage
        }
      });

      // Test armor calculations
      const maxArmorTonnage = this.unitManager.getMaxArmorTonnage();
      const maxArmorPoints = this.unitManager.getMaxArmorPoints();
      
      results.push({
        testName: 'Armor Limit Calculations',
        passed: maxArmorTonnage > 0 && maxArmorPoints > 0,
        details: { 
          maxArmorTonnage,
          maxArmorPoints,
          armorEfficiency: this.unitManager.getArmorEfficiency()
        }
      });

      // Test heat calculations
      const heatDissipation = this.unitManager.getHeatDissipation();
      const heatGeneration = this.unitManager.getHeatGeneration();
      
      results.push({
        testName: 'Heat Calculations',
        passed: heatDissipation >= 10, // Minimum 10 heat sinks
        details: { 
          heatDissipation,
          heatGeneration,
          totalHeatSinks: this.unitManager.getConfiguration().totalHeatSinks
        }
      });

    } catch (error) {
      results.push({
        testName: 'Calculation Methods',
        passed: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return results;
  }

  /**
   * Test armor-specific calculations
   */
  private testArmorCalculations(): TestResult[] {
    const results: TestResult[] = [];

    try {
      // Test armor point calculations
      const availableArmorPoints = this.unitManager.getAvailableArmorPoints();
      const allocatedArmorPoints = this.unitManager.getAllocatedArmorPoints();
      const unallocatedArmorPoints = this.unitManager.getUnallocatedArmorPoints();

      results.push({
        testName: 'Armor Point Calculations',
        passed: availableArmorPoints === allocatedArmorPoints + unallocatedArmorPoints,
        details: { 
          availableArmorPoints,
          allocatedArmorPoints,
          unallocatedArmorPoints,
          calculationCorrect: availableArmorPoints === allocatedArmorPoints + unallocatedArmorPoints
        }
      });

      // Test location-specific armor limits
      const headMaxArmor = this.unitManager.getMaxArmorPointsForLocation('HD');
      const centerTorsoMaxArmor = this.unitManager.getMaxArmorPointsForLocation('CT');
      
      results.push({
        testName: 'Location Armor Limits',
        passed: headMaxArmor === 9 && centerTorsoMaxArmor > headMaxArmor,
        details: { 
          headMaxArmor,
          centerTorsoMaxArmor,
          headIsCorrect: headMaxArmor === 9
        }
      });

    } catch (error) {
      results.push({
        testName: 'Armor Calculations',
        passed: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return results;
  }

  /**
   * Test weight validation
   */
  private testWeightValidation(): TestResult[] {
    const results: TestResult[] = [];

    try {
      // Test normal weight scenario
      const isOverweight = this.unitManager.isOverweight();
      const weightValidation = this.unitManager.getWeightValidation();
      
      results.push({
        testName: 'Weight Validation - Normal',
        passed: !isOverweight === weightValidation.isValid,
        details: { 
          isOverweight,
          weightValidation,
          usedTonnage: this.unitManager.getUsedTonnage(),
          maxTonnage: this.unitManager.getConfiguration().tonnage
        }
      });

      // Test overweight scenario by setting very low tonnage
      const originalConfig = this.unitManager.getConfiguration();
      this.unitManager.updateConfiguration({
        ...originalConfig,
        tonnage: 20 // Very low tonnage to trigger overweight
      });

      const overweightCheck = this.unitManager.isOverweight();
      const overweightValidation = this.unitManager.getWeightValidation();
      
      results.push({
        testName: 'Weight Validation - Overweight',
        passed: overweightCheck && !overweightValidation.isValid,
        details: { 
          isOverweight: overweightCheck,
          overweightValidation,
          usedTonnage: this.unitManager.getUsedTonnage(),
          maxTonnage: this.unitManager.getConfiguration().tonnage
        }
      });

      // Restore original configuration
      this.unitManager.updateConfiguration(originalConfig);

    } catch (error) {
      results.push({
        testName: 'Weight Validation',
        passed: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return results;
  }

  /**
   * Log comprehensive test results
   */
  private logTestResults(suite: TestSuite): void {
    console.log('\n' + '='.repeat(60));
    console.log(`📋 ${suite.suiteName} Test Results`);
    console.log('='.repeat(60));
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total Tests: ${suite.summary.totalTests}`);
    console.log(`   ✅ Passed: ${suite.summary.passed}`);
    console.log(`   ❌ Failed: ${suite.summary.failed}`);
    console.log(`   📈 Success Rate: ${suite.summary.successRate.toFixed(1)}%`);

    if (suite.summary.failed > 0) {
      console.log(`\n❌ Failed Tests:`);
      suite.results.filter(r => !r.passed).forEach(result => {
        console.log(`   • ${result.testName}`);
        if (result.error) {
          console.log(`     Error: ${result.error}`);
        }
        if (result.details) {
          console.log(`     Details:`, result.details);
        }
      });
    }

    if (suite.summary.passed > 0) {
      console.log(`\n✅ Passed Tests:`);
      suite.results.filter(r => r.passed).forEach(result => {
        console.log(`   • ${result.testName}`);
        if (result.details) {
          console.log(`     Details:`, result.details);
        }
      });
    }

    console.log('\n' + '='.repeat(60));
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  const tester = new CriticalSlotAllocationTester();
  tester.runAllTests();
}

// Make available for browser console
if (typeof window !== 'undefined') {
  (window as any).CriticalSlotAllocationTester = CriticalSlotAllocationTester;
}
