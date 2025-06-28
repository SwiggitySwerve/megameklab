/**
 * Heat Management Validator - Handles heat generation and dissipation validation
 * Validates heat balance, heat sink efficiency, and thermal management
 * Following SOLID principles - Single Responsibility for heat validation
 */

import { EditableUnit } from '../../types/editor';
import {
  IHeatManagementValidator,
  ValidationContext,
  ValidationResult,
  ValidationError
} from './ValidationTypes';

export class HeatManagementValidator implements IHeatManagementValidator {
  
  /**
   * Validate overall heat management
   */
  validateHeatManagement(unit: EditableUnit, context: ValidationContext): ValidationResult {
    console.log('[HeatManagementValidator] Validating heat management');
    
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    
    // Validate heat sinks
    const heatSinkResult = this.validateHeatSinks(unit);
    errors.push(...heatSinkResult.errors);
    warnings.push(...heatSinkResult.warnings);
    
    // Calculate heat balance
    const heatBalance = this.calculateHeatBalance(unit);
    
    // Check for heat imbalance
    if (heatBalance.balance < 0) {
      const severity = Math.abs(heatBalance.balance) > 10 ? 'error' : 'warning';
      const message = `Heat generation exceeds dissipation by ${Math.abs(heatBalance.balance)} points`;
      
      if (severity === 'error') {
        errors.push({
          id: 'severe-heat-imbalance',
          category: 'error',
          message: `Severe ${message}. Unit will overheat rapidly.`,
          field: 'heat'
        });
      } else {
        warnings.push({
          id: 'heat-imbalance',
          category: 'warning',
          message: `${message}. Unit may overheat during sustained combat.`,
          field: 'heat'
        });
      }
    }
    
    // Check for excessive heat generation
    if (heatBalance.generation > 50) {
      warnings.push({
        id: 'excessive-heat-generation',
        category: 'warning',
        message: `Very high heat generation (${heatBalance.generation}). Consider reducing weapon load or adding cooling.`,
        field: 'heat'
      });
    }
    
    // Check for heat efficiency
    if (heatBalance.efficiency < 0.8) {
      warnings.push({
        id: 'poor-heat-efficiency',
        category: 'warning',
        message: `Poor heat efficiency (${(heatBalance.efficiency * 100).toFixed(1)}%). Consider optimizing heat management.`,
        field: 'heat'
      });
    }
    
    console.log(`[HeatManagementValidator] Heat validation complete: ${errors.length} errors, ${warnings.length} warnings`);
    console.log(`[HeatManagementValidator] Heat balance: ${heatBalance.generation} gen / ${heatBalance.dissipation} dis = ${heatBalance.balance}`);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Calculate heat balance
   */
  calculateHeatBalance(unit: EditableUnit): {
    generation: number;
    dissipation: number;
    balance: number;
    efficiency: number;
  } {
    const generation = this.calculateHeatGeneration(unit);
    const dissipation = this.calculateHeatDissipation(unit);
    const balance = dissipation - generation;
    const efficiency = generation > 0 ? dissipation / generation : 1;
    
    return {
      generation,
      dissipation,
      balance,
      efficiency
    };
  }
  
  /**
   * Validate heat sinks
   */
  validateHeatSinks(unit: EditableUnit): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    
    const heatSinks = this.getHeatSinks(unit);
    const totalHeatSinks = heatSinks.total;
    const engineHeatSinks = this.calculateEngineHeatSinks(unit);
    const externalHeatSinks = totalHeatSinks - engineHeatSinks;
    
    // Validate minimum heat sinks (10 required)
    if (totalHeatSinks < 10) {
      errors.push({
        id: 'insufficient-heat-sinks',
        category: 'error',
        message: `Insufficient heat sinks: ${totalHeatSinks}/10 minimum required`,
        field: 'heat_sinks'
      });
    }
    
    // Validate engine heat sink integration
    const engineRating = unit.data.engine?.rating || 0;
    const maxEngineHeatSinks = Math.min(10, Math.floor(engineRating / 25));
    
    if (engineHeatSinks > maxEngineHeatSinks) {
      errors.push({
        id: 'excessive-engine-heat-sinks',
        category: 'error',
        message: `Too many engine heat sinks: ${engineHeatSinks}/${maxEngineHeatSinks} maximum for engine rating ${engineRating}`,
        field: 'heat_sinks'
      });
    }
    
    // Check for heat sink type consistency
    if (heatSinks.single > 0 && heatSinks.double > 0) {
      warnings.push({
        id: 'mixed-heat-sink-types',
        category: 'warning',
        message: `Mixed heat sink types: ${heatSinks.single} single, ${heatSinks.double} double. Consider standardizing.`,
        field: 'heat_sinks'
      });
    }
    
    // Validate external heat sink placement
    if (externalHeatSinks > 0) {
      const availableSlots = this.calculateAvailableHeatSinkSlots(unit);
      if (externalHeatSinks > availableSlots) {
        errors.push({
          id: 'insufficient-heat-sink-slots',
          category: 'error',
          message: `Insufficient slots for external heat sinks: ${externalHeatSinks} required, ${availableSlots} available`,
          field: 'critical_slots'
        });
      }
    }
    
    // Check for double heat sink tech base compatibility
    if (heatSinks.double > 0) {
      const techBase = unit.data.tech_base || 'Inner Sphere';
      const era = unit.data.era || '3025';
      
      if (techBase === 'Inner Sphere' && era === '3025') {
        errors.push({
          id: 'dhs-tech-incompatibility',
          category: 'error',
          message: 'Double Heat Sinks not available to Inner Sphere in 3025 era',
          field: 'heat_sinks'
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
   * Calculate total heat generation from all sources
   */
  private calculateHeatGeneration(unit: EditableUnit): number {
    let totalHeat = 0;
    
    // Heat from equipment placements
    if (unit.equipmentPlacements) {
      unit.equipmentPlacements.forEach(placement => {
        const equipmentHeat = placement.equipment.heat || 
                            placement.equipment.data?.heatmap || 0;
        totalHeat += equipmentHeat;
      });
    }
    
    // Heat from unallocated equipment (if they would be fired)
    if (unit.unallocatedEquipment) {
      unit.unallocatedEquipment.forEach(equipment => {
        const equipmentHeat = equipment.heat || 
                            equipment.data?.heatmap || 0;
        totalHeat += equipmentHeat;
      });
    }
    
    // Base movement heat (walking = 1 heat, running = 2 heat)
    // This is situational, so we calculate for running
    const movement = unit.data.movement;
    if (movement?.run_mp) {
      totalHeat += 2; // Running heat
    } else if (movement?.walk_mp) {
      totalHeat += 1; // Walking heat
    }
    
    // Jump heat (1 heat per hex jumped)
    if (movement?.jump_mp) {
      totalHeat += movement.jump_mp;
    }
    
    return totalHeat;
  }
  
  /**
   * Calculate total heat dissipation
   */
  private calculateHeatDissipation(unit: EditableUnit): number {
    const heatSinks = this.getHeatSinks(unit);
    
    // Single heat sinks dissipate 1 heat each
    // Double heat sinks dissipate 2 heat each
    return heatSinks.single + (heatSinks.double * 2);
  }
  
  /**
   * Get heat sink counts by type
   */
  private getHeatSinks(unit: EditableUnit): {
    total: number;
    single: number;
    double: number;
  } {
    let singleHS = 0;
    let doubleHS = 0;
    
    // Count heat sinks from unit data
    const heatSinkData = unit.data.heat_sinks;
    if (heatSinkData) {
      const count = heatSinkData.count || 0;
      const type = heatSinkData.type || 'Single';
      
      if (type.toLowerCase().includes('double') || type.toLowerCase().includes('clan')) {
        doubleHS += count;
      } else {
        singleHS += count;
      }
    }
    
    // Count heat sinks from equipment placements
    if (unit.equipmentPlacements) {
      unit.equipmentPlacements.forEach(placement => {
        const name = placement.equipment.name.toLowerCase();
        if (name.includes('heat sink')) {
          if (name.includes('double') || name.includes('clan')) {
            doubleHS++;
          } else {
            singleHS++;
          }
        }
      });
    }
    
    // Count heat sinks from unallocated equipment
    if (unit.unallocatedEquipment) {
      unit.unallocatedEquipment.forEach(equipment => {
        const name = equipment.name.toLowerCase();
        if (name.includes('heat sink')) {
          if (name.includes('double') || name.includes('clan')) {
            doubleHS++;
          } else {
            singleHS++;
          }
        }
      });
    }
    
    // Ensure minimum 10 heat sinks (engine provides at least some)
    const total = singleHS + doubleHS;
    if (total < 10) {
      // Assume missing heat sinks are engine-integrated singles
      singleHS += (10 - total);
    }
    
    return {
      total: singleHS + doubleHS,
      single: singleHS,
      double: doubleHS
    };
  }
  
  /**
   * Calculate how many heat sinks are integrated in the engine
   */
  private calculateEngineHeatSinks(unit: EditableUnit): number {
    const engineRating = unit.data.engine?.rating || 0;
    const engineType = unit.data.engine?.type || 'Standard';
    
    // XL engines integrate fewer heat sinks
    if (engineType.toLowerCase().includes('xl') || engineType.toLowerCase().includes('light')) {
      return Math.min(10, Math.floor(engineRating / 50));
    }
    
    // Compact engines integrate more heat sinks
    if (engineType.toLowerCase().includes('compact')) {
      return Math.min(10, Math.floor(engineRating / 20));
    }
    
    // Standard engines
    return Math.min(10, Math.floor(engineRating / 25));
  }
  
  /**
   * Calculate available critical slots for external heat sinks
   */
  private calculateAvailableHeatSinkSlots(unit: EditableUnit): number {
    // This is a simplified calculation
    // In reality, we'd need to check actual critical slot allocation
    
    const config = unit.data.config || 'Biped';
    let totalSlots = 0;
    
    // Standard mech slot distribution
    switch (config) {
      case 'Biped':
      case 'Biped Omnimech':
        totalSlots = 3 + 12 + 12 + 12 + 12 + 12 + 4 + 4; // H + CT + LT + RT + LA + RA + LL + RL
        break;
      case 'Quad':
      case 'Quad Omnimech':
        totalSlots = 3 + 12 + 12 + 12 + 4 + 4 + 4 + 4; // H + CT + LT + RT + LFL + RFL + LRL + RRL
        break;
      default:
        totalSlots = 60; // Rough estimate
    }
    
    // Subtract slots used by fixed systems (engine, gyro, cockpit, etc.)
    const engineRating = unit.data.engine?.rating || 0;
    const engineSlots = Math.ceil(engineRating / 25) * 3; // Rough engine slot calculation
    const fixedSlots = engineSlots + 4 + 3; // Engine + Gyro + Cockpit
    
    // Subtract slots used by equipment
    let usedSlots = fixedSlots;
    if (unit.equipmentPlacements) {
      unit.equipmentPlacements.forEach(placement => {
        usedSlots += placement.equipment.space || placement.criticalSlots?.length || 1;
      });
    }
    
    return Math.max(0, totalSlots - usedSlots);
  }
  
  /**
   * Validate heat sink efficiency and placement
   */
  private validateHeatSinkEfficiency(unit: EditableUnit): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    
    const heatBalance = this.calculateHeatBalance(unit);
    const heatSinks = this.getHeatSinks(unit);
    
    // Check if unit would benefit from double heat sinks
    if (heatSinks.single > 0 && heatBalance.balance < 5) {
      const techBase = unit.data.tech_base || 'Inner Sphere';
      const era = unit.data.era || '3025';
      
      // Only suggest if double heat sinks are available
      if (techBase === 'Clan' || era !== '3025') {
        warnings.push({
          id: 'dhs-upgrade-suggestion',
          category: 'warning',
          message: 'Consider upgrading to Double Heat Sinks for better heat dissipation',
          field: 'heat_sinks'
        });
      }
    }
    
    // Check for heat sink placement optimization
    if (heatSinks.total > 10) {
      warnings.push({
        id: 'heat-sink-placement',
        category: 'warning',
        message: 'Consider engine integration for heat sinks to save critical slots',
        field: 'heat_sinks'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
