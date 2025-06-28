/**
 * Equipment Validator - Handles equipment placement, compatibility, and transfer validation
 * Critical service for maintaining data model integrity during unit regeneration
 * Following SOLID principles - Single Responsibility for equipment validation
 */

import { EditableUnit } from '../../types/editor';
import { FullEquipment } from '../../types/index';
import {
  IEquipmentValidator,
  ValidationContext,
  ValidationResult,
  ValidationError,
  EquipmentState,
  EquipmentTransferResult,
  EquipmentCompatibilityResult,
  ValidationSuggestion
} from './ValidationTypes';

export class EquipmentValidator implements IEquipmentValidator {
  
  /**
   * Validate equipment placement across all locations
   */
  validateEquipmentPlacement(unit: EditableUnit, context: ValidationContext): ValidationResult {
    console.log('[EquipmentValidator] Validating equipment placement');
    
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    
    const equipmentPlacements = unit.equipmentPlacements || [];
    
    // Check each equipment placement
    equipmentPlacements.forEach((placement, index) => {
      try {
        // Validate location is valid
        const validLocations = this.getValidLocations(unit);
        if (!validLocations.includes(placement.location)) {
          errors.push({
            id: `invalid-location-${index}`,
            field: `equipmentPlacements[${index}].location`,
            category: 'error',
            message: `Invalid location "${placement.location}" for ${placement.equipment.name}`,
            location: placement.location
          });
        }
        
        // Validate location restrictions
        if (!this.canPlaceEquipment(placement.equipment, placement.location, unit)) {
          const restrictions = this.getLocationRestrictions(placement.equipment, unit);
          errors.push({
            id: `location-restriction-${index}`,
            field: `equipmentPlacements[${index}].location`,
            category: 'error',
            message: `${placement.equipment.name} cannot be placed in ${placement.location}. ${restrictions.join(', ')}`,
            location: placement.location
          });
        }
        
        // Check for ammo safety
        if (this.isAmmoEquipment(placement.equipment)) {
          if (placement.location === 'head' || placement.location === 'center_torso') {
            warnings.push({
              id: `ammo-safety-${index}`,
              field: `equipmentPlacements[${index}].location`,
              category: 'warning',
              message: `${placement.equipment.name} in ${placement.location} poses explosion risk`,
              location: placement.location
            });
          }
        }
        
        // Check for tech base compatibility
        const techBaseResult = this.validateTechBaseCompatibility(placement.equipment, unit, context);
        if (!techBaseResult.isCompatible) {
          techBaseResult.conflicts.forEach(conflict => {
            if (conflict.conflictType === 'tech-base') {
              errors.push({
                id: `tech-base-conflict-${index}`,
                field: `equipmentPlacements[${index}].equipment`,
                category: 'error',
                message: conflict.description,
                location: placement.location
              });
            }
          });
        }
        
      } catch (error) {
        console.error(`[EquipmentValidator] Error validating placement ${index}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          id: `validation-error-${index}`,
          field: `equipmentPlacements[${index}]`,
          category: 'error',
          message: `Validation error for ${placement.equipment.name}: ${errorMessage}`
        });
      }
    });
    
    // Check for missing weapons
    const weapons = equipmentPlacements.filter(eq => this.isWeaponEquipment(eq.equipment));
    if (weapons.length === 0) {
      warnings.push({
        id: 'no-weapons',
        field: 'equipment',
        category: 'warning',
        message: 'Unit has no weapons'
      });
    }
    
    console.log(`[EquipmentValidator] Equipment placement validation complete: ${errors.length} errors, ${warnings.length} warnings`);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Validate equipment compatibility with unit configuration
   */
  validateEquipmentCompatibility(unit: EditableUnit, context: ValidationContext): EquipmentCompatibilityResult {
    console.log('[EquipmentValidator] Validating equipment compatibility');
    
    const conflicts: EquipmentCompatibilityResult['conflicts'] = [];
    const suggestions: ValidationSuggestion[] = [];
    
    const equipmentPlacements = unit.equipmentPlacements || [];
    
    equipmentPlacements.forEach(placement => {
      // Tech base compatibility
      const techBase = unit.data.tech_base || 'Inner Sphere';
      const equipmentTechBase = this.getEquipmentTechBase(placement.equipment);
      
      if (!this.isCompatibleTechBase(equipmentTechBase, techBase, context)) {
        conflicts.push({
          equipment: placement.equipment,
          conflictType: 'tech-base',
          description: `${placement.equipment.name} (${equipmentTechBase}) incompatible with ${techBase} chassis`
        });
      }
      
      // Era restrictions
      if (context.eraRestrictions) {
        const unitEra = unit.data.era || '3025';
        const equipmentYear = placement.equipment.data?.introduced || placement.equipment.introduction_year || 3025;
        
        if (!this.isCompatibleEra(Number(equipmentYear), unitEra)) {
          conflicts.push({
            equipment: placement.equipment,
            conflictType: 'era',
            description: `${placement.equipment.name} (${equipmentYear}) not available in ${unitEra}`
          });
        }
      }
      
      // Rules level compatibility
      if (context.strictMode) {
        const unitRules = String(unit.data.rules_level || 'Standard');
        const equipmentRules = placement.equipment.data?.rules_level || placement.equipment.rules || 'Standard';
        
        if (!this.isCompatibleRulesLevel(String(equipmentRules), unitRules)) {
          conflicts.push({
            equipment: placement.equipment,
            conflictType: 'rules-level',
            description: `${placement.equipment.name} (${equipmentRules}) exceeds unit rules level (${unitRules})`
          });
        }
      }
    });
    
    return {
      isCompatible: conflicts.length === 0,
      conflicts,
      suggestions
    };
  }
  
  /**
   * Validate equipment transfer from pre-regeneration state to new unit
   * This is the critical method for maintaining data integrity during regeneration
   */
  validateEquipmentTransfer(preState: EquipmentState, newUnit: EditableUnit): EquipmentTransferResult {
    console.log('[EquipmentValidator] Validating equipment transfer after regeneration');
    console.log(`[EquipmentValidator] Pre-state: ${preState.equipmentPlacements.length} placed, ${preState.unallocatedEquipment.length} unallocated`);
    
    const result: EquipmentTransferResult = {
      isValid: true,
      transferredCount: 0,
      failedTransfers: [],
      warnings: []
    };
    
    // Validate placed equipment can be transferred
    preState.equipmentPlacements.forEach(placement => {
      const transferCheck = this.validateSingleEquipmentTransfer(placement, newUnit);
      
      if (transferCheck.canTransfer) {
        result.transferredCount++;
      } else {
        result.failedTransfers.push({
          equipment: placement.equipment,
          reason: transferCheck.reason,
          suggestion: transferCheck.suggestion
        });
        result.isValid = false;
      }
    });
    
    // Validate unallocated equipment is still compatible
    preState.unallocatedEquipment.forEach(equipment => {
      const compatibilityCheck = this.validateEquipmentStillCompatible(equipment, newUnit);
      
      if (!compatibilityCheck.isCompatible) {
        result.failedTransfers.push({
          equipment,
          reason: compatibilityCheck.reason,
          suggestion: compatibilityCheck.suggestion
        });
        result.warnings.push({
          id: `unallocated-incompatible-${equipment.id}`,
          category: 'warning',
          message: `Unallocated ${equipment.name} may no longer be compatible: ${compatibilityCheck.reason}`
        });
      }
    });
    
    console.log(`[EquipmentValidator] Transfer validation complete: ${result.transferredCount} transferred, ${result.failedTransfers.length} failed`);
    
    return result;
  }
  
  /**
   * Capture current equipment state for transfer validation
   */
  captureEquipmentState(unit: EditableUnit): EquipmentState {
    console.log('[EquipmentValidator] Capturing equipment state');
    
    const equipmentPlacements = (unit.equipmentPlacements || []).map(placement => ({
      id: placement.id || `${placement.equipment.id}_${Date.now()}`,
      equipment: { ...placement.equipment }, // Deep copy
      location: placement.location,
      slotIndex: placement.criticalSlots?.[0] // Use first critical slot as index
    }));
    
    // Get unallocated equipment (this would come from the orchestrator in real implementation)
    const unallocatedEquipment: FullEquipment[] = [];
    // TODO: Get from UnitManager/CriticalSlotOrchestrator
    
    const state: EquipmentState = {
      equipmentPlacements,
      unallocatedEquipment,
      timestamp: Date.now()
    };
    
    console.log(`[EquipmentValidator] Captured state: ${equipmentPlacements.length} placed, ${unallocatedEquipment.length} unallocated`);
    
    return state;
  }
  
  /**
   * Check if equipment can be placed in specific location
   */
  canPlaceEquipment(equipment: FullEquipment, location: string, unit: EditableUnit): boolean {
    // Check tech base compatibility for location
    const techBase = unit.data.tech_base || 'Inner Sphere';
    const equipmentTechBase = this.getEquipmentTechBase(equipment);
    
    if (!this.isCompatibleTechBase(equipmentTechBase, techBase, { strictMode: false } as ValidationContext)) {
      return false;
    }
    
    // Check if location exists on this unit type
    const validLocations = this.getValidLocations(unit);
    if (!validLocations.includes(location)) {
      return false;
    }
    
    // Default: allow placement (specific restrictions would be handled by the CriticalSlotOrchestrator)
    return true;
  }
  
  /**
   * Get location restrictions for equipment
   */
  getLocationRestrictions(equipment: FullEquipment, unit: EditableUnit): string[] {
    const restrictions: string[] = [];
    
    // Check for ammunition restrictions
    if (this.isAmmoEquipment(equipment)) {
      restrictions.push('Ammunition should avoid head and center torso for safety');
    }
    
    // Check for jump jet restrictions
    if (this.isJumpJetEquipment(equipment)) {
      const jumpJetLocations = ['center_torso', 'left_torso', 'right_torso', 'left_leg', 'right_leg'];
      const validJumpJetLocations = jumpJetLocations.filter((loc: string) => this.getValidLocations(unit).includes(loc));
      
      if (validJumpJetLocations.length === 0) {
        restrictions.push('No valid jump jet locations available');
      }
    }
    
    return restrictions;
  }
  
  /**
   * Validate single equipment transfer
   */
  private validateSingleEquipmentTransfer(
    placement: EquipmentState['equipmentPlacements'][0], 
    newUnit: EditableUnit
  ): { canTransfer: boolean; reason: string; suggestion?: string } {
    
    // Check if location still exists
    const validLocations = this.getValidLocations(newUnit);
    if (!validLocations.includes(placement.location)) {
      return {
        canTransfer: false,
        reason: `Location ${placement.location} no longer exists on regenerated unit`,
        suggestion: 'Move to unallocated pool for manual placement'
      };
    }
    
    // Check if equipment is still compatible with unit
    const compatibilityCheck = this.validateEquipmentStillCompatible(placement.equipment, newUnit);
    if (!compatibilityCheck.isCompatible) {
      return {
        canTransfer: false,
        reason: compatibilityCheck.reason,
        suggestion: compatibilityCheck.suggestion
      };
    }
    
    // Check if placement is still valid
    if (!this.canPlaceEquipment(placement.equipment, placement.location, newUnit)) {
      return {
        canTransfer: false,
        reason: `${placement.equipment.name} can no longer be placed in ${placement.location}`,
        suggestion: 'Move to unallocated pool for manual placement'
      };
    }
    
    return { canTransfer: true, reason: 'Equipment transfer valid' };
  }
  
  /**
   * Validate equipment is still compatible after regeneration
   */
  private validateEquipmentStillCompatible(
    equipment: FullEquipment, 
    newUnit: EditableUnit
  ): { isCompatible: boolean; reason: string; suggestion?: string } {
    
    // Check tech base compatibility
    const newTechBase = newUnit.data.tech_base || 'Inner Sphere';
    const equipmentTechBase = this.getEquipmentTechBase(equipment);
    
    if (!this.isCompatibleTechBase(equipmentTechBase, newTechBase, { strictMode: false } as ValidationContext)) {
      return {
        isCompatible: false,
        reason: `Tech base incompatibility: ${equipmentTechBase} equipment on ${newTechBase} chassis`,
        suggestion: 'Remove incompatible equipment or change unit tech base'
      };
    }
    
    // Check if unit configuration still supports equipment
    const unitConfig = newUnit.data.config || 'Biped';
    if (!this.isEquipmentCompatibleWithConfig(equipment, unitConfig)) {
      return {
        isCompatible: false,
        reason: `Equipment incompatible with unit configuration ${unitConfig}`,
        suggestion: 'Remove incompatible equipment'
      };
    }
    
    return { isCompatible: true, reason: 'Equipment still compatible' };
  }
  
  /**
   * Tech base compatibility validation
   */
  private validateTechBaseCompatibility(
    equipment: FullEquipment, 
    unit: EditableUnit, 
    context: ValidationContext
  ): EquipmentCompatibilityResult {
    const unitTechBase = unit.data.tech_base || 'Inner Sphere';
    const equipmentTechBase = this.getEquipmentTechBase(equipment);
    
    const isCompatible = this.isCompatibleTechBase(equipmentTechBase, unitTechBase, context);
    
    if (!isCompatible) {
      return {
        isCompatible: false,
        conflicts: [{
          equipment,
          conflictType: 'tech-base',
          description: `${equipment.name} (${equipmentTechBase}) incompatible with ${unitTechBase} chassis`
        }],
        suggestions: []
      };
    }
    
    return {
      isCompatible: true,
      conflicts: [],
      suggestions: []
    };
  }
  
  /**
   * Helper methods
   */
  private getValidLocations(unit: EditableUnit): string[] {
    const config = unit.data.config || 'Biped';
    
    const baseLocations = ['head', 'center_torso', 'left_torso', 'right_torso'];
    
    switch (config) {
      case 'Biped':
      case 'Biped Omnimech':
        return [...baseLocations, 'left_arm', 'right_arm', 'left_leg', 'right_leg'];
      case 'Quad':
      case 'Quad Omnimech':
        return [...baseLocations, 'left_front_leg', 'right_front_leg', 'left_rear_leg', 'right_rear_leg'];
      case 'Tripod':
      case 'Tripod Omnimech':
        return [...baseLocations, 'left_leg', 'right_leg', 'center_leg'];
      default:
        return baseLocations;
    }
  }
  
  private getEquipmentTechBase(equipment: FullEquipment): string {
    return equipment.tech_base || equipment.data?.tech_base || 'Inner Sphere';
  }
  
  private isCompatibleTechBase(equipmentTechBase: string, unitTechBase: string, context: ValidationContext): boolean {
    // Allow mixed tech if custom rules enabled
    if (context.customRules) {
      return true;
    }
    
    // Standard compatibility rules
    if (unitTechBase.includes('Mixed')) {
      return true; // Mixed tech units can use anything
    }
    
    if (unitTechBase === 'Inner Sphere' && equipmentTechBase === 'Clan') {
      return false; // IS units can't use Clan tech without mixed rules
    }
    
    if (unitTechBase === 'Clan' && equipmentTechBase === 'Inner Sphere') {
      return true; // Clan units can use IS tech
    }
    
    return equipmentTechBase === unitTechBase;
  }
  
  private isCompatibleEra(equipmentYear: number, unitEra: string): boolean {
    // Simple era checking - could be more sophisticated
    const eraYears: Record<string, number> = {
      '3025': 3025,
      '3050': 3050,
      '3067': 3067,
      '3075': 3075,
      '3085': 3085,
      '3151': 3151
    };
    
    const unitYear = eraYears[unitEra] || 3025;
    return equipmentYear <= unitYear;
  }
  
  private isCompatibleRulesLevel(equipmentRules: string, unitRules: string): boolean {
    const rulesLevels = ['Standard', 'Tournament', 'Advanced', 'Experimental'];
    const equipmentLevel = rulesLevels.indexOf(equipmentRules);
    const unitLevel = rulesLevels.indexOf(unitRules);
    
    return equipmentLevel <= unitLevel;
  }
  
  private isEquipmentCompatibleWithConfig(equipment: FullEquipment, config: string): boolean {
    // Most equipment is compatible with all configurations
    // Special cases would be handled here
    return true;
  }
  
  private isWeaponEquipment(equipment: FullEquipment): boolean {
    return equipment.type === 'weapon' || 
           Boolean(equipment.damage) ||
           Boolean(equipment.data?.damage);
  }
  
  private isAmmoEquipment(equipment: FullEquipment): boolean {
    return equipment.type === 'ammo' || 
           equipment.name.toLowerCase().includes('ammo') ||
           Boolean(equipment.data?.shots);
  }
  
  private isJumpJetEquipment(equipment: FullEquipment): boolean {
    return equipment.name.toLowerCase().includes('jump') ||
           equipment.type === 'jump_jet';
  }
}
