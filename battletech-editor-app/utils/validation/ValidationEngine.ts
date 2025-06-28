/**
 * ValidationEngine - Facade that coordinates all validation services
 * Maintains data model integrity during unit regeneration and equipment transfer
 * Following SOLID principles - Facade pattern for unified validation interface
 */

import { EditableUnit } from '../../types/editor';
import {
  IValidationEngine,
  IEquipmentValidator,
  IStructureValidator,
  IHeatManagementValidator,
  IArmorValidator,
  IBattleValueCalculator,
  ICostCalculator,
  IOptimizationAnalyzer,
  ValidationContext,
  DetailedValidationResult,
  EquipmentState,
  EquipmentTransferResult,
  ValidationError,
  ValidationSuggestion,
  RuleViolation,
  DEFAULT_VALIDATION_CONTEXT,
  QUICK_VALIDATION_CONTEXT
} from './ValidationTypes';
import { EquipmentValidator } from './EquipmentValidator';
import { StructureValidator } from './StructureValidator';
import { HeatManagementValidator } from './HeatManagementValidator';
import { ArmorValidator } from './ArmorValidator';
import { BattleValueCalculator } from './BattleValueCalculator';
import { CostCalculator } from './CostCalculator';
import { OptimizationAnalyzer } from './OptimizationAnalyzer';

export class ValidationEngine implements IValidationEngine {
  
  // Service instances (dependency injection ready)
  private equipmentValidator: IEquipmentValidator;
  private structureValidator?: IStructureValidator;
  private heatValidator?: IHeatManagementValidator;
  private armorValidator?: IArmorValidator;
  private battleValueCalculator?: IBattleValueCalculator;
  private costCalculator?: ICostCalculator;
  private optimizationAnalyzer?: IOptimizationAnalyzer;
  
  constructor(dependencies?: {
    equipmentValidator?: IEquipmentValidator;
    structureValidator?: IStructureValidator;
    heatValidator?: IHeatManagementValidator;
    armorValidator?: IArmorValidator;
    battleValueCalculator?: IBattleValueCalculator;
    costCalculator?: ICostCalculator;
    optimizationAnalyzer?: IOptimizationAnalyzer;
  }) {
    // Initialize with provided dependencies or defaults
    this.equipmentValidator = dependencies?.equipmentValidator || new EquipmentValidator();
    this.structureValidator = dependencies?.structureValidator || new StructureValidator();
    this.heatValidator = dependencies?.heatValidator || new HeatManagementValidator();
    this.armorValidator = dependencies?.armorValidator || new ArmorValidator();
    this.battleValueCalculator = dependencies?.battleValueCalculator || new BattleValueCalculator();
    this.costCalculator = dependencies?.costCalculator || new CostCalculator();
    this.optimizationAnalyzer = dependencies?.optimizationAnalyzer || new OptimizationAnalyzer();
    
    console.log('[ValidationEngine] Initialized with services:', {
      equipment: !!this.equipmentValidator,
      structure: !!this.structureValidator,
      heat: !!this.heatValidator,
      armor: !!this.armorValidator,
      battleValue: !!this.battleValueCalculator,
      cost: !!this.costCalculator,
      optimization: !!this.optimizationAnalyzer
    });
  }
  
  /**
   * Complete unit validation with detailed results
   * Primary method for maintaining data model integrity
   */
  validateUnit(unit: EditableUnit, context: ValidationContext = DEFAULT_VALIDATION_CONTEXT): DetailedValidationResult {
    console.log('[ValidationEngine] Starting comprehensive unit validation');
    
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const criticalErrors: ValidationError[] = [];
    const suggestions: ValidationSuggestion[] = [];
    const ruleViolations: RuleViolation[] = [];
    
    let battleValue = 0;
    let cost = 0;
    
    try {
      // Equipment validation (always available and critical for regeneration)
      const equipmentResult = this.equipmentValidator.validateEquipmentPlacement(unit, context);
      errors.push(...equipmentResult.errors);
      warnings.push(...equipmentResult.warnings);
      
      // Mark tech base violations as critical
      equipmentResult.errors.forEach(error => {
        if (error.message.includes('tech-base') || error.message.includes('incompatible')) {
          criticalErrors.push(error);
        }
      });
      
      // Equipment compatibility validation
      const compatibilityResult = this.equipmentValidator.validateEquipmentCompatibility(unit, context);
      if (!compatibilityResult.isCompatible) {
        compatibilityResult.conflicts.forEach(conflict => {
          const error: ValidationError = {
            id: `compatibility-${conflict.conflictType}-${Date.now()}`,
            category: 'error',
            message: conflict.description,
            field: 'equipment'
          };
          errors.push(error);
          
          if (conflict.conflictType === 'tech-base' || conflict.conflictType === 'era') {
            criticalErrors.push(error);
          }
        });
      }
      suggestions.push(...compatibilityResult.suggestions);
      
      // Structure validation (if available)
      if (this.structureValidator) {
        const structureResult = this.structureValidator.validateCoreStructure(unit, context);
        errors.push(...structureResult.errors);
        warnings.push(...structureResult.warnings);
        
        // Structure errors are typically critical
        criticalErrors.push(...structureResult.errors);
      }
      
      // Heat management validation (if available)
      if (this.heatValidator) {
        const heatResult = this.heatValidator.validateHeatManagement(unit, context);
        errors.push(...heatResult.errors);
        warnings.push(...heatResult.warnings);
        
        // Heat inefficiency is usually a warning, not critical
      }
      
      // Armor validation (if available)
      if (this.armorValidator) {
        const armorResult = this.armorValidator.validateArmorAllocation(unit, context);
        errors.push(...armorResult.errors);
        warnings.push(...armorResult.warnings);
        
        // Armor over-allocation is critical
        armorResult.errors.forEach(error => {
          if (error.message.includes('exceed') || error.message.includes('over')) {
            criticalErrors.push(error);
          }
        });
      }
      
      // Battle value calculation (if available and not skipped)
      if (this.battleValueCalculator && !context.skipCostValidation) {
        battleValue = this.battleValueCalculator.calculateBattleValue(unit, context);
      }
      
      // Cost calculation (if available and not skipped)
      if (this.costCalculator && !context.skipCostValidation) {
        cost = this.costCalculator.calculateCost(unit, context);
      }
      
      // Optimization analysis (if available)
      if (this.optimizationAnalyzer) {
        const optimizationSuggestions = this.optimizationAnalyzer.analyzeOptimization(unit, context);
        suggestions.push(...optimizationSuggestions);
      }
      
    } catch (error) {
      console.error('[ValidationEngine] Error during validation:', error);
      const validationError: ValidationError = {
        id: `validation-engine-error-${Date.now()}`,
        category: 'error',
        message: `Validation engine error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        field: 'system'
      };
      errors.push(validationError);
      criticalErrors.push(validationError);
    }
    
    // Determine overall validation state
    const isValid = errors.length === 0;
    const isLegal = criticalErrors.length === 0 && ruleViolations.length === 0;
    const isOptimal = suggestions.filter(s => s.severity === 'major').length === 0;
    
    const result: DetailedValidationResult = {
      isValid,
      errors,
      warnings,
      criticalErrors,
      suggestions,
      ruleViolations,
      battleValue,
      cost,
      isLegal,
      isOptimal
    };
    
    console.log(`[ValidationEngine] Validation complete: ${isValid ? 'VALID' : 'INVALID'}, ${errors.length} errors, ${warnings.length} warnings, ${criticalErrors.length} critical`);
    
    return result;
  }
  
  /**
   * Quick validation for UI feedback
   * Optimized for performance during editing
   */
  validateQuick(unit: EditableUnit): { isValid: boolean; errorCount: number; warningCount: number } {
    console.log('[ValidationEngine] Quick validation check');
    
    try {
      // Use minimal context for speed
      const result = this.validateUnit(unit, QUICK_VALIDATION_CONTEXT);
      
      return {
        isValid: result.isValid,
        errorCount: result.errors.length,
        warningCount: result.warnings.length
      };
    } catch (error) {
      console.error('[ValidationEngine] Quick validation error:', error);
      return {
        isValid: false,
        errorCount: 1,
        warningCount: 0
      };
    }
  }
  
  /**
   * Validate equipment transfer during unit regeneration
   * Critical method for maintaining data model integrity
   */
  validateEquipmentTransfer(preState: EquipmentState, newUnit: EditableUnit): EquipmentTransferResult {
    console.log('[ValidationEngine] Coordinating equipment transfer validation');
    
    if (!this.equipmentValidator) {
      console.error('[ValidationEngine] Equipment validator not available for transfer validation');
      return {
        isValid: false,
        transferredCount: 0,
        failedTransfers: [],
        warnings: [{
          id: 'no-equipment-validator',
          category: 'error',
          message: 'Equipment validator not available for transfer validation'
        }]
      };
    }
    
    // Delegate to equipment validator
    const result = this.equipmentValidator.validateEquipmentTransfer(preState, newUnit);
    
    // Log transfer results for debugging
    console.log(`[ValidationEngine] Equipment transfer result: ${result.isValid ? 'SUCCESS' : 'PARTIAL'}`);
    console.log(`[ValidationEngine] Transferred: ${result.transferredCount}, Failed: ${result.failedTransfers.length}`);
    
    if (result.failedTransfers.length > 0) {
      console.warn('[ValidationEngine] Failed transfers:', result.failedTransfers.map(ft => ft.equipment.name));
    }
    
    return result;
  }
  
  /**
   * Capture equipment state for transfer validation
   * Essential for maintaining equipment consistency during regeneration
   */
  captureEquipmentState(unit: EditableUnit): EquipmentState {
    console.log('[ValidationEngine] Capturing equipment state for transfer validation');
    
    if (!this.equipmentValidator) {
      console.error('[ValidationEngine] Equipment validator not available for state capture');
      return {
        equipmentPlacements: [],
        unallocatedEquipment: [],
        timestamp: Date.now()
      };
    }
    
    const state = this.equipmentValidator.captureEquipmentState(unit);
    
    console.log(`[ValidationEngine] Captured equipment state: ${state.equipmentPlacements.length} placed, ${state.unallocatedEquipment.length} unallocated`);
    
    return state;
  }
  
  /**
   * Service accessor methods for dependency injection and testing
   */
  getStructureValidator(): IStructureValidator {
    if (!this.structureValidator) {
      throw new Error('Structure validator not initialized');
    }
    return this.structureValidator;
  }
  
  getEquipmentValidator(): IEquipmentValidator {
    return this.equipmentValidator;
  }
  
  getHeatValidator(): IHeatManagementValidator {
    if (!this.heatValidator) {
      throw new Error('Heat validator not initialized');
    }
    return this.heatValidator;
  }
  
  getArmorValidator(): IArmorValidator {
    if (!this.armorValidator) {
      throw new Error('Armor validator not initialized');
    }
    return this.armorValidator;
  }
  
  getBattleValueCalculator(): IBattleValueCalculator {
    if (!this.battleValueCalculator) {
      throw new Error('Battle value calculator not initialized');
    }
    return this.battleValueCalculator;
  }
  
  getCostCalculator(): ICostCalculator {
    if (!this.costCalculator) {
      throw new Error('Cost calculator not initialized');
    }
    return this.costCalculator;
  }
  
  getOptimizationAnalyzer(): IOptimizationAnalyzer {
    if (!this.optimizationAnalyzer) {
      throw new Error('Optimization analyzer not initialized');
    }
    return this.optimizationAnalyzer;
  }
  
  /**
   * Check if specific validation services are available
   */
  hasStructureValidator(): boolean {
    return !!this.structureValidator;
  }
  
  hasHeatValidator(): boolean {
    return !!this.heatValidator;
  }
  
  hasArmorValidator(): boolean {
    return !!this.armorValidator;
  }
  
  hasBattleValueCalculator(): boolean {
    return !!this.battleValueCalculator;
  }
  
  hasCostCalculator(): boolean {
    return !!this.costCalculator;
  }
  
  hasOptimizationAnalyzer(): boolean {
    return !!this.optimizationAnalyzer;
  }
}

// Singleton instance for global use
let globalValidationEngine: ValidationEngine | null = null;

/**
 * Get or create global validation engine instance
 */
export function getValidationEngine(): ValidationEngine {
  if (!globalValidationEngine) {
    globalValidationEngine = new ValidationEngine();
  }
  return globalValidationEngine;
}

/**
 * Initialize global validation engine with specific services
 */
export function initializeValidationEngine(dependencies: {
  equipmentValidator?: IEquipmentValidator;
  structureValidator?: IStructureValidator;
  heatValidator?: IHeatManagementValidator;
  armorValidator?: IArmorValidator;
  battleValueCalculator?: IBattleValueCalculator;
  costCalculator?: ICostCalculator;
  optimizationAnalyzer?: IOptimizationAnalyzer;
}): ValidationEngine {
  globalValidationEngine = new ValidationEngine(dependencies);
  return globalValidationEngine;
}

/**
 * Reset global validation engine (for testing)
 */
export function resetValidationEngine(): void {
  globalValidationEngine = null;
}
