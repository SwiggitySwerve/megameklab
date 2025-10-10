/**
 * Construction Rules Engine Adapter
 * 
 * This adapter bridges the old ConstructionRulesEngine interface with the new
 * RulesDataProvider. This allows existing code to continue working while we
 * gradually migrate to the new architecture.
 * 
 * Usage:
 * - Keep using ConstructionRulesEngine in existing code
 * - This adapter will delegate to RulesDataProvider under the hood
 * - Gradually replace ConstructionRulesEngine with RulesDataProvider directly
 */

import { RulesDataProvider, ConstructionContext, ComponentOption, TechBase } from '../rules';
import { 
  EnhancedSystemComponents,
  ConstructionValidationResult,
  ComponentType
} from '../../types/enhancedSystemComponents';
import { EngineType, HeatSinkType } from '../../types/systemComponents';

/**
 * Adapter class that wraps the new RulesDataProvider with the old interface
 * This maintains backward compatibility while using the new implementation
 */
export class ConstructionRulesEngineAdapter {
  
  /**
   * Validate complete system component configuration
   * Delegates to RulesDataProvider
   */
  validateConfiguration(
    components: EnhancedSystemComponents,
    context: ConstructionContext
  ): ConstructionValidationResult {
    const result: ConstructionValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      techBaseViolations: [],
      slotViolations: [],
      weightViolations: [],
      costCalculation: null
    };

    // Validate engine
    const engineValidation = RulesDataProvider.validateComponentCompatibility(
      'engine',
      components.engine.type,
      context
    );
    
    if (!engineValidation.isCompatible) {
      result.isValid = false;
      result.errors.push(...engineValidation.issues);
      result.techBaseViolations.push({
        component: 'engine',
        violation: 'tech_base_mismatch',
        details: engineValidation.issues.join('; ')
      });
    }
    result.warnings.push(...engineValidation.warnings);

    // Validate gyro if present
    if (context.currentComponents?.gyro) {
      const gyroValidation = RulesDataProvider.validateComponentCompatibility(
        'gyro',
        context.currentComponents.gyro,
        context
      );
      
      if (!gyroValidation.isCompatible) {
        result.isValid = false;
        result.errors.push(...gyroValidation.issues);
      }
      result.warnings.push(...gyroValidation.warnings);
    }

    // Validate heat sinks
    const heatSinkValidation = RulesDataProvider.validateComponentCompatibility(
      'heatSink',
      components.heatSinks.type,
      context
    );
    
    if (!heatSinkValidation.isCompatible) {
      result.isValid = false;
      result.errors.push(...heatSinkValidation.issues);
      result.techBaseViolations.push({
        component: 'heatSinks',
        violation: 'tech_base_mismatch',
        details: heatSinkValidation.issues.join('; ')
      });
    }
    result.warnings.push(...heatSinkValidation.warnings);

    // Validate structure if present
    if (context.currentComponents?.structure) {
      const structureValidation = RulesDataProvider.validateComponentCompatibility(
        'structure',
        context.currentComponents.structure,
        context
      );
      
      if (!structureValidation.isCompatible) {
        result.isValid = false;
        result.errors.push(...structureValidation.issues);
      }
      result.warnings.push(...structureValidation.warnings);
    }

    // Validate armor if present
    if (context.currentComponents?.armor) {
      const armorValidation = RulesDataProvider.validateComponentCompatibility(
        'armor',
        context.currentComponents.armor,
        context
      );
      
      if (!armorValidation.isCompatible) {
        result.isValid = false;
        result.errors.push(...armorValidation.issues);
      }
      result.warnings.push(...armorValidation.warnings);
    }

    return result;
  }

  /**
   * Get available engine types for given tech base
   * Delegates to RulesDataProvider
   */
  getAvailableEngineTypes(techBase: TechBase, context?: Partial<ConstructionContext>): ComponentOption[] {
    const fullContext: ConstructionContext = {
      techBase,
      era: context?.era || '3050',
      techLevel: context?.techLevel || 'Tournament',
      mechTonnage: context?.mechTonnage || 50,
      engineRating: context?.engineRating,
      currentComponents: context?.currentComponents
    };
    
    return RulesDataProvider.getAvailableEngineTypes(fullContext);
  }

  /**
   * Get available heat sink types for given tech base
   * Delegates to RulesDataProvider
   */
  getAvailableHeatSinkTypes(techBase: TechBase, context?: Partial<ConstructionContext>): ComponentOption[] {
    const fullContext: ConstructionContext = {
      techBase,
      era: context?.era || '3050',
      techLevel: context?.techLevel || 'Tournament',
      mechTonnage: context?.mechTonnage || 50,
      engineRating: context?.engineRating,
      currentComponents: context?.currentComponents
    };
    
    return RulesDataProvider.getAvailableHeatSinkTypes(fullContext);
  }

  /**
   * Get available gyro types for given tech base
   * Delegates to RulesDataProvider
   */
  getAvailableGyroTypes(techBase: TechBase, context?: Partial<ConstructionContext>): ComponentOption[] {
    const fullContext: ConstructionContext = {
      techBase,
      era: context?.era || '3050',
      techLevel: context?.techLevel || 'Tournament',
      mechTonnage: context?.mechTonnage || 50,
      engineRating: context?.engineRating,
      currentComponents: context?.currentComponents
    };
    
    return RulesDataProvider.getAvailableGyroTypes(fullContext);
  }

  /**
   * Get available structure types for given tech base
   * Delegates to RulesDataProvider
   */
  getAvailableStructureTypes(techBase: TechBase, context?: Partial<ConstructionContext>): ComponentOption[] {
    const fullContext: ConstructionContext = {
      techBase,
      era: context?.era || '3050',
      techLevel: context?.techLevel || 'Tournament',
      mechTonnage: context?.mechTonnage || 50,
      engineRating: context?.engineRating,
      currentComponents: context?.currentComponents
    };
    
    return RulesDataProvider.getAvailableStructureTypes(fullContext);
  }

  /**
   * Get available armor types for given tech base
   * Delegates to RulesDataProvider
   */
  getAvailableArmorTypes(techBase: TechBase, context?: Partial<ConstructionContext>): ComponentOption[] {
    const fullContext: ConstructionContext = {
      techBase,
      era: context?.era || '3050',
      techLevel: context?.techLevel || 'Tournament',
      mechTonnage: context?.mechTonnage || 50,
      engineRating: context?.engineRating,
      currentComponents: context?.currentComponents
    };
    
    return RulesDataProvider.getAvailableArmorTypes(fullContext);
  }

  /**
   * Calculate system slot requirements
   * Delegates to RulesDataProvider for component requirements
   */
  calculateSystemSlotRequirements(components: EnhancedSystemComponents): { [location: string]: number } {
    const requirements: { [location: string]: number } = {
      'Head': 0,
      'Center Torso': 0,
      'Left Torso': 0,
      'Right Torso': 0,
      'Left Arm': 0,
      'Right Arm': 0,
      'Left Leg': 0,
      'Right Leg': 0
    };

    // Get engine slot requirements from RulesDataProvider
    const context: ConstructionContext = {
      techBase: 'Inner Sphere', // Default, should be passed in
      era: '3050',
      techLevel: 'Tournament',
      mechTonnage: 50
    };
    
    const engineOptions = RulesDataProvider.getAvailableEngineTypes(context);
    const engineOption = engineOptions.find(e => e.id === components.engine.type);
    
    if (engineOption) {
      // Engine slots are distributed across torsos
      // This is a simplified calculation - actual distribution depends on engine type
      requirements['Center Torso'] += 6; // Engines typically take 6 CT slots
      
      if (components.engine.type.includes('XL')) {
        requirements['Left Torso'] += 3;
        requirements['Right Torso'] += 3;
      } else if (components.engine.type === 'Light') {
        requirements['Left Torso'] += 2;
        requirements['Right Torso'] += 2;
      }
    }

    // Gyro slots (typically 4 in center torso)
    requirements['Center Torso'] += 4;

    // Cockpit slots (typically 1 in head)
    requirements['Head'] += 1;

    // External heat sink slots
    const externalHeatSinks = Math.max(0, components.heatSinks.total - components.heatSinks.engineIntegrated);
    const heatSinkOptions = RulesDataProvider.getAvailableHeatSinkTypes(context);
    const heatSinkOption = heatSinkOptions.find(h => h.id === components.heatSinks.type);
    
    if (heatSinkOption && externalHeatSinks > 0) {
      const slotsPerHeatSink = heatSinkOption.requirements.criticalSlots;
      const totalHeatSinkSlots = externalHeatSinks * slotsPerHeatSink;
      
      // Distribute heat sink slots across locations
      const slotsPerLocation = Math.ceil(totalHeatSinkSlots / 8);
      Object.keys(requirements).forEach(location => {
        requirements[location] += Math.min(slotsPerLocation, totalHeatSinkSlots);
      });
    }

    return requirements;
  }
}

/**
 * Singleton instance for backward compatibility
 * Use this to replace existing ConstructionRulesEngine usage
 */
export const constructionRulesEngineAdapter = new ConstructionRulesEngineAdapter();

/**
 * Migration guide:
 * 
 * OLD CODE:
 * ```
 * import { ConstructionRulesEngine } from './ConstructionRulesEngine';
 * const engine = new ConstructionRulesEngine();
 * const engines = engine.getAvailableEngineTypes(techBase);
 * ```
 * 
 * INTERMEDIATE (using adapter):
 * ```
 * import { constructionRulesEngineAdapter } from './ConstructionRulesEngineAdapter';
 * const engines = constructionRulesEngineAdapter.getAvailableEngineTypes(techBase);
 * ```
 * 
 * NEW CODE (direct usage):
 * ```
 * import { RulesDataProvider } from '../rules';
 * const context = { techBase, era, techLevel, mechTonnage };
 * const engines = RulesDataProvider.getAvailableEngineTypes(context);
 * ```
 */
