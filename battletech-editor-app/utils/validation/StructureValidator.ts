/**
 * Structure Validator - Handles core structural validation
 * Validates mass, tonnage, engine, and basic construction rules
 * Following SOLID principles - Single Responsibility for structure validation
 */

import { EditableUnit } from '../../types/editor';
import {
  IStructureValidator,
  ValidationContext,
  ValidationResult,
  ValidationError
} from './ValidationTypes';

export class StructureValidator implements IStructureValidator {
  
  /**
   * Validate core structure rules
   */
  validateCoreStructure(unit: EditableUnit, context: ValidationContext): ValidationResult {
    console.log('[StructureValidator] Validating core structure');
    
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    
    // Validate mass
    const massResult = this.validateMass(unit);
    errors.push(...massResult.errors);
    warnings.push(...massResult.warnings);
    
    // Validate engine rating
    const engineResult = this.validateEngineRating(unit);
    errors.push(...engineResult.errors);
    warnings.push(...engineResult.warnings);
    
    // Validate movement
    const movementResult = this.validateMovement(unit);
    errors.push(...movementResult.errors);
    warnings.push(...movementResult.warnings);
    
    // Validate configuration
    const configErrors = this.validateConfiguration(unit, context);
    errors.push(...configErrors);
    
    console.log(`[StructureValidator] Structure validation complete: ${errors.length} errors, ${warnings.length} warnings`);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Validate unit mass and weight distribution
   */
  validateMass(unit: EditableUnit): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    
    const unitMass = unit.mass || unit.data.mass || 0;
    
    // Validate mass is valid tonnage
    const validTonnages = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
    if (!validTonnages.includes(unitMass)) {
      errors.push({
        id: 'invalid-tonnage',
        category: 'error',
        message: `Invalid unit tonnage: ${unitMass}. Must be one of: ${validTonnages.join(', ')}`,
        field: 'mass'
      });
    }
    
    // Calculate used tonnage
    const usedTonnage = this.calculateUsedTonnage(unit);
    
    // Check if overweight
    if (usedTonnage > unitMass) {
      errors.push({
        id: 'overweight',
        category: 'error',
        message: `Unit is overweight: ${usedTonnage}/${unitMass} tons (${(usedTonnage - unitMass).toFixed(2)} tons over)`,
        field: 'weight'
      });
    }
    
    // Check if underweight (warning)
    const underweightThreshold = unitMass * 0.9; // 10% underweight threshold
    if (usedTonnage < underweightThreshold) {
      warnings.push({
        id: 'underweight',
        category: 'warning',
        message: `Unit may be underweight: ${usedTonnage}/${unitMass} tons (${(unitMass - usedTonnage).toFixed(2)} tons remaining)`,
        field: 'weight'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Validate engine rating and engine-related rules
   */
  validateEngineRating(unit: EditableUnit): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    
    const engineRating = unit.data.engine?.rating || 0;
    const unitMass = unit.mass || unit.data.mass || 0;
    
    // Validate engine rating exists
    if (!engineRating || engineRating <= 0) {
      errors.push({
        id: 'missing-engine',
        category: 'error',
        message: 'Unit must have a valid engine rating',
        field: 'engine'
      });
      return { isValid: false, errors, warnings };
    }
    
    // Validate engine rating is valid
    const minRating = Math.ceil(unitMass * 0.25); // Minimum 0.25 rating per ton
    const maxRating = unitMass * 10; // Maximum 10 rating per ton
    
    if (engineRating < minRating) {
      errors.push({
        id: 'engine-too-small',
        category: 'error',
        message: `Engine rating too low: ${engineRating}. Minimum for ${unitMass} tons: ${minRating}`,
        field: 'engine'
      });
    }
    
    if (engineRating > maxRating) {
      errors.push({
        id: 'engine-too-large',
        category: 'error',
        message: `Engine rating too high: ${engineRating}. Maximum for ${unitMass} tons: ${maxRating}`,
        field: 'engine'
      });
    }
    
    // Validate engine rating is multiple of 5 (for most engines)
    if (engineRating % 5 !== 0) {
      warnings.push({
        id: 'engine-rating-multiple',
        category: 'warning',
        message: `Engine rating ${engineRating} is not a multiple of 5, which is unusual`,
        field: 'engine'
      });
    }
    
    // Validate engine type if available
    const engineType = unit.data.engine?.type;
    if (engineType) {
      const engineValidation = this.validateEngineType(engineType, engineRating, unitMass);
      errors.push(...engineValidation.errors);
      warnings.push(...engineValidation.warnings);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Validate movement values
   */
  validateMovement(unit: EditableUnit): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    
    const movement = unit.data.movement;
    const engineRating = unit.data.engine?.rating || 0;
    const unitMass = unit.mass || unit.data.mass || 0;
    
    if (!movement) {
      warnings.push({
        id: 'missing-movement',
        category: 'warning',
        message: 'Movement data not defined',
        field: 'movement'
      });
      return { isValid: true, errors, warnings };
    }
    
    // Calculate expected walking speed
    const expectedWalk = Math.floor(engineRating / unitMass);
    const expectedRun = Math.ceil(expectedWalk * 1.5);
    
    // Validate walking speed
    if (movement.walk_mp !== undefined && movement.walk_mp !== expectedWalk) {
      errors.push({
        id: 'incorrect-walk-speed',
        category: 'error',
        message: `Incorrect walking speed: ${movement.walk_mp}. Expected: ${expectedWalk} (Engine ${engineRating} / ${unitMass} tons)`,
        field: 'movement'
      });
    }
    
    // Validate running speed
    if (movement.run_mp !== undefined && movement.run_mp !== expectedRun) {
      errors.push({
        id: 'incorrect-run-speed',
        category: 'error',
        message: `Incorrect running speed: ${movement.run_mp}. Expected: ${expectedRun}`,
        field: 'movement'
      });
    }
    
    // Validate jump speed if present
    if (movement.jump_mp !== undefined && movement.jump_mp > 0) {
      // Jump MP should not exceed walk MP for standard units
      if (movement.jump_mp > expectedWalk) {
        warnings.push({
          id: 'high-jump-speed',
          category: 'warning',
          message: `Jump speed ${movement.jump_mp} exceeds walking speed ${expectedWalk}. This is unusual but not illegal.`,
          field: 'movement'
        });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Validate unit configuration
   */
  private validateConfiguration(unit: EditableUnit, context: ValidationContext): ValidationError[] {
    const errors: ValidationError[] = [];
    
    const config = unit.data.config;
    const unitMass = unit.mass || unit.data.mass || 0;
    
    // Validate configuration is supported
    const supportedConfigs = ['Biped', 'Quad', 'Tripod', 'LAM', 'Biped Omnimech', 'Quad Omnimech', 'Tripod Omnimech'];
    if (config && !supportedConfigs.includes(config)) {
      errors.push({
        id: 'unsupported-config',
        category: 'error',
        message: `Unsupported unit configuration: ${config}`,
        field: 'config'
      });
    }
    
    // Validate mass restrictions for configurations
    if (config === 'LAM' && unitMass > 55) {
      errors.push({
        id: 'lam-mass-limit',
        category: 'error',
        message: `LAM units cannot exceed 55 tons. Current: ${unitMass} tons`,
        field: 'config'
      });
    }
    
    if (config === 'Tripod' && unitMass < 30) {
      errors.push({
        id: 'tripod-mass-minimum',
        category: 'error',
        message: `Tripod units must be at least 30 tons. Current: ${unitMass} tons`,
        field: 'config'
      });
    }
    
    // Validate tech base compatibility
    const techBase = unit.data.tech_base;
    if (context.strictMode && techBase) {
      if (config?.includes('Omnimech') && techBase === 'Inner Sphere') {
        // Inner Sphere Omnimechs are advanced tech
        if (!context.experimentalTech) {
          errors.push({
            id: 'is-omnimech-restriction',
            category: 'error',
            message: 'Inner Sphere Omnimechs require experimental technology rules',
            field: 'config'
          });
        }
      }
    }
    
    return errors;
  }
  
  /**
   * Validate specific engine type
   */
  private validateEngineType(engineType: string, rating: number, unitMass: number): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    
    // Validate engine type constraints
    switch (engineType.toLowerCase()) {
      case 'ice':
      case 'internal combustion engine':
        if (rating > unitMass * 5) {
          errors.push({
            id: 'ice-rating-limit',
            category: 'error',
            message: `ICE engine rating cannot exceed ${unitMass * 5} for ${unitMass}-ton unit`,
            field: 'engine'
          });
        }
        break;
        
      case 'fuel cell':
        if (rating > unitMass * 6) {
          errors.push({
            id: 'fuel-cell-rating-limit',
            category: 'error',
            message: `Fuel Cell engine rating cannot exceed ${unitMass * 6} for ${unitMass}-ton unit`,
            field: 'engine'
          });
        }
        break;
        
      case 'light fusion':
        if (unitMass < 20) {
          errors.push({
            id: 'light-fusion-mass-minimum',
            category: 'error',
            message: 'Light Fusion engines require minimum 20-ton chassis',
            field: 'engine'
          });
        }
        break;
        
      case 'compact fusion':
        if (unitMass > 100) {
          errors.push({
            id: 'compact-fusion-mass-maximum',
            category: 'error',
            message: 'Compact Fusion engines limited to maximum 100-ton chassis',
            field: 'engine'
          });
        }
        break;
        
      case 'xl':
      case 'extralight':
        // XL engines are twice as vulnerable to critical hits
        warnings.push({
          id: 'xl-engine-vulnerability',
          category: 'warning',
          message: 'XL engines are more vulnerable to critical damage',
          field: 'engine'
        });
        break;
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Calculate total used tonnage
   */
  private calculateUsedTonnage(unit: EditableUnit): number {
    let usedTonnage = 0;
    
    // Engine weight (simplified calculation)
    const engineRating = unit.data.engine?.rating || 0;
    usedTonnage += this.calculateEngineWeight(engineRating);
    
    // Gyro weight (typically 1% of engine rating, minimum 1 ton)
    usedTonnage += Math.max(1, Math.ceil(engineRating * 0.01));
    
    // Cockpit weight (typically 3 tons)
    usedTonnage += 3;
    
    // Internal structure weight (10% of unit mass)
    const unitMass = unit.mass || unit.data.mass || 0;
    usedTonnage += unitMass * 0.1;
    
    // Equipment weight
    const equipmentWeight = this.calculateEquipmentWeight(unit);
    usedTonnage += equipmentWeight;
    
    // Armor weight
    const armorWeight = this.calculateArmorWeight(unit);
    usedTonnage += armorWeight;
    
    return Math.round(usedTonnage * 100) / 100; // Round to 2 decimal places
  }
  
  /**
   * Calculate engine weight based on rating and type
   */
  private calculateEngineWeight(rating: number, engineType: string = 'Standard'): number {
    // Simplified engine weight calculation
    // Real calculation is more complex and varies by type
    
    const baseWeight = Math.ceil(rating / 25);
    
    switch (engineType.toLowerCase()) {
      case 'xl':
      case 'extralight':
        return baseWeight * 0.5;
      case 'light':
      case 'light fusion':
        return baseWeight * 0.75;
      case 'compact':
      case 'compact fusion':
        return baseWeight * 1.5;
      default:
        return baseWeight;
    }
  }
  
  /**
   * Calculate equipment weight
   */
  private calculateEquipmentWeight(unit: EditableUnit): number {
    let totalWeight = 0;
    
    // Sum equipment placements
    if (unit.equipmentPlacements) {
      unit.equipmentPlacements.forEach(placement => {
        totalWeight += placement.equipment.weight || 0;
      });
    }
    
    // Add unallocated equipment if available
    if (unit.unallocatedEquipment) {
      unit.unallocatedEquipment.forEach(equipment => {
        totalWeight += equipment.weight || 0;
      });
    }
    
    return totalWeight;
  }
  
  /**
   * Calculate armor weight
   */
  private calculateArmorWeight(unit: EditableUnit): number {
    let totalArmorPoints = 0;
    
    // Sum armor from all locations
    if (unit.armorAllocation) {
      Object.values(unit.armorAllocation).forEach(allocation => {
        totalArmorPoints += allocation.front || 0;
        totalArmorPoints += allocation.rear || 0;
      });
    }
    
    // Convert armor points to tonnage (16 points per ton for standard armor)
    const armorType = unit.data.armor?.type || 'Standard';
    const pointsPerTon = this.getArmorPointsPerTon(armorType);
    
    return totalArmorPoints / pointsPerTon;
  }
  
  /**
   * Get armor points per ton for different armor types
   */
  private getArmorPointsPerTon(armorType: string): number {
    switch (armorType.toLowerCase()) {
      case 'ferro-fibrous':
        return 17.6;
      case 'light ferro-fibrous':
        return 16.8;
      case 'heavy ferro-fibrous':
        return 19.2;
      case 'hardened':
        return 8;
      case 'ferro-lamellor':
        return 20.48;
      default:
        return 16; // Standard armor
    }
  }
}
