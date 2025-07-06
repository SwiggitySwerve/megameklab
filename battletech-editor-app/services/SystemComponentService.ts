/**
 * SystemComponentService - System component calculations and management
 * 
 * Extracted from UnitCriticalManager as part of large file refactoring.
 * Handles engine, gyro, heat sink, and structure calculations following BattleTech rules.
 * 
 * @see IMPLEMENTATION_REFERENCE.md for architectural patterns
 */

import { UnitConfiguration } from '../utils/criticalSlots/UnitCriticalManager';
import { EngineType, GyroType, SystemAllocation as SystemComponentAllocation, SystemComponentRules } from '../utils/criticalSlots/SystemComponentRules';
import { ComponentConfiguration, TechBase } from '../types/componentConfiguration';
import { calculateGyroWeight } from '../utils/gyroCalculations';
import { calculateInternalHeatSinksForEngine } from '../utils/heatSinkCalculations';

export interface SystemComponentService {
  // Engine calculations
  calculateEngineWeight(rating: number, engineType: EngineType): number;
  calculateEngineSlots(engineType: EngineType): EngineSlotAllocation;
  validateEngineRating(tonnage: number, walkMP: number): EngineValidationResult;
  
  // Gyro calculations
  calculateGyroWeight(engineRating: number, gyroType: GyroType): number;
  calculateGyroSlots(gyroType: GyroType): number;
  
  // Heat sink calculations
  calculateHeatSinkWeight(heatSinkType: string, externalCount: number): number;
  calculateInternalHeatSinks(engineRating: number, engineType: EngineType): number;
  calculateHeatDissipation(totalHeatSinks: number, heatSinkType: string): number;
  
  // Structure calculations
  calculateStructureWeight(tonnage: number, structureType: string): number;
  getStructureCriticalSlots(structureType: string): number;
  
  // System allocation
  getCompleteSystemAllocation(engineType: EngineType, gyroType: GyroType): SystemAllocation;
  
  // Validation
  validateSystemComponents(engineType: EngineType, gyroType: GyroType): ValidationResult;
}

export interface EngineSlotAllocation {
  centerTorso: number[];
  leftTorso: number[];
  rightTorso: number[];
  totalSlots: number;
}

export interface SystemAllocation {
  engine: EngineSlotAllocation;
  gyro: {
    centerTorso: number[];
    totalSlots: number;
  };
}

export interface EngineValidationResult {
  isValid: boolean;
  maxWalkMP: number;
  errors: string[];
  warnings: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface WeightBreakdown {
  engine: number;
  gyro: number;
  structure: number;
  heatSinks: number;
  total: number;
}

export class SystemComponentServiceImpl implements SystemComponentService {
  
  // ===== HELPER METHODS =====
  
  /**
   * Extract type string from ComponentConfiguration
   * @deprecated Use component.type directly instead
   */
  private static extractComponentType(component: ComponentConfiguration): string {
    return component.type;
  }

  /**
   * Extract gyro type from ComponentConfiguration
   */
  private static extractGyroType(component: ComponentConfiguration | GyroType): GyroType {
    if (typeof component === 'string') {
      return component as GyroType; // Legacy compatibility
    }
    return component.type as GyroType;
  }
  
  // ===== ENGINE CALCULATIONS =====
  
  calculateEngineWeight(rating: number, engineType: EngineType): number {
    if (rating <= 0) return 0;
    
    const baseWeight = rating / 25; // Standard engine weight formula
    
    // Apply engine type multipliers
    switch (engineType) {
      case 'XL':
        return baseWeight * 0.5;
      case 'Light':
        return baseWeight * 0.75;
      case 'XXL':
        return baseWeight * 0.33;
      case 'Compact':
        return baseWeight * 1.5;
      case 'ICE':
      case 'Fuel Cell':
        return baseWeight * 2.0;
      case 'Standard':
      default:
        return baseWeight;
    }
  }
  
  calculateEngineSlots(engineType: EngineType): EngineSlotAllocation {
    // Use SystemComponentRules for accurate slot allocation
    const allocation = SystemComponentRules.getEngineAllocation(engineType, 'Standard');
    return {
      centerTorso: allocation.centerTorso,
      leftTorso: allocation.leftTorso,
      rightTorso: allocation.rightTorso,
      totalSlots: allocation.centerTorso.length + allocation.leftTorso.length + allocation.rightTorso.length
    };
  }
  
  validateEngineRating(tonnage: number, walkMP: number): EngineValidationResult {
    const result: EngineValidationResult = {
      isValid: true,
      maxWalkMP: Math.floor(400 / tonnage),
      errors: [],
      warnings: []
    };
    
    const requiredRating = tonnage * walkMP;
    
    if (requiredRating > 400) {
      result.isValid = false;
      result.errors.push(`Engine rating ${requiredRating} exceeds maximum of 400`);
    }
    
    if (walkMP < 1) {
      result.isValid = false;
      result.errors.push('Walk MP must be at least 1');
    }
    
    if (walkMP > result.maxWalkMP) {
      result.isValid = false;
      result.errors.push(`Walk MP ${walkMP} exceeds maximum ${result.maxWalkMP} for ${tonnage}-ton unit`);
    }
    
    // Warnings for unusual configurations
    if (walkMP < 2) {
      result.warnings.push('Very slow movement speed may limit tactical effectiveness');
    }
    
    if (walkMP > 6 && tonnage > 55) {
      result.warnings.push('High speed on heavy units requires significant engine investment');
    }
    
    return result;
  }
  
  // ===== GYRO CALCULATIONS =====
  
  calculateGyroWeight(engineRating: number, gyroType: GyroType): number {
    return calculateGyroWeight(engineRating, gyroType);
  }
  
  calculateGyroSlots(gyroType: GyroType): number {
    switch (gyroType) {
      case 'XL':
        return 6;
      case 'Compact':
        return 2;
      case 'Heavy-Duty':
        return 4;
      case 'Standard':
      default:
        return 4;
    }
  }
  
  // ===== HEAT SINK CALCULATIONS =====
  
  calculateHeatSinkWeight(heatSinkType: string, externalCount: number): number {
    if (externalCount <= 0) return 0;
    
    switch (heatSinkType) {
      case 'Double':
      case 'Double (Clan)':
      case 'Single':
        return externalCount * 1.0;
      case 'Compact':
        return externalCount * 0.5;
      case 'Laser':
        return externalCount * 1.5;
      default:
        return externalCount * 1.0;
    }
  }
  
  calculateInternalHeatSinks(engineRating: number, engineType: EngineType): number {
    // Use the centralized calculation function
    return calculateInternalHeatSinksForEngine(engineRating, engineType);
  }
  
  calculateHeatDissipation(totalHeatSinks: number, heatSinkType: string): number {
    const efficiency = this.getHeatSinkEfficiency(heatSinkType);
    return totalHeatSinks * efficiency;
  }
  
  private getHeatSinkEfficiency(heatSinkType: string): number {
    switch (heatSinkType) {
      case 'Double':
      case 'Double (Clan)':
        return 2.0;
      case 'Compact':
      case 'Laser':
      case 'Single':
      default:
        return 1.0;
    }
  }
  
  // ===== STRUCTURE CALCULATIONS =====
  
  calculateStructureWeight(tonnage: number, structureType: string): number {
    const baseWeight = Math.ceil(tonnage / 10);
    
    switch (structureType) {
      case 'Endo Steel':
      case 'Endo Steel (Clan)':
        return baseWeight * 0.5;
      case 'Composite':
        return baseWeight * 0.5;
      case 'Reinforced':
        return baseWeight * 2.0;
      case 'Industrial':
        return baseWeight * 0.5;
      case 'Standard':
      default:
        return baseWeight;
    }
  }
  
  getStructureCriticalSlots(structureType: string): number {
    switch (structureType) {
      case 'Endo Steel':
        return 14;
      case 'Endo Steel (Clan)':
        return 7;
      case 'Composite':
      case 'Reinforced':
      case 'Industrial':
      case 'Standard':
      default:
        return 0;
    }
  }
  
  // ===== SYSTEM ALLOCATION =====
  
  getCompleteSystemAllocation(engineType: EngineType, gyroType: GyroType): SystemAllocation {
    // Use SystemComponentRules for accurate allocation
    const systemAllocation = SystemComponentRules.getCompleteSystemAllocation(engineType, gyroType);
    
    return {
      engine: {
        centerTorso: systemAllocation.engine.centerTorso,
        leftTorso: systemAllocation.engine.leftTorso,
        rightTorso: systemAllocation.engine.rightTorso,
        totalSlots: systemAllocation.engine.centerTorso.length + 
                   systemAllocation.engine.leftTorso.length + 
                   systemAllocation.engine.rightTorso.length
      },
      gyro: {
        centerTorso: systemAllocation.gyro.centerTorso,
        totalSlots: systemAllocation.gyro.centerTorso.length
      }
    };
  }
  
  // ===== VALIDATION =====
  
  validateSystemComponents(engineType: EngineType, gyroType: GyroType): ValidationResult {
    // Use SystemComponentRules for validation
    const rulesResult = SystemComponentRules.validateSystemComponents(engineType, gyroType);
    
    const result: ValidationResult = {
      isValid: rulesResult.isValid,
      errors: [...rulesResult.errors],
      warnings: [...rulesResult.warnings]
    };
    
    // Add our own validation for engine and gyro types
    const validEngineTypes: EngineType[] = ['Standard', 'XL', 'Light', 'XXL', 'Compact', 'ICE', 'Fuel Cell'];
    if (!validEngineTypes.includes(engineType)) {
      result.isValid = false;
      result.errors.push(`Invalid engine type: ${engineType}`);
    }
    
    const validGyroTypes: GyroType[] = ['Standard', 'XL', 'Compact', 'Heavy-Duty'];
    if (!validGyroTypes.includes(gyroType)) {
      result.isValid = false;
      result.errors.push(`Invalid gyro type: ${gyroType}`);
    }
    
    // Check for compatibility issues
    if (engineType === 'ICE' || engineType === 'Fuel Cell') {
      if (gyroType !== 'Standard') {
        result.warnings.push(`${gyroType} gyro with ${engineType} engine is unusual`);
      }
    }
    
    return result;
  }
  
  // ===== COMPREHENSIVE CALCULATIONS =====
  
  calculateSystemWeights(config: UnitConfiguration): WeightBreakdown {
    const engineWeight = this.calculateEngineWeight(config.engineRating, config.engineType);
    const gyroWeight = this.calculateGyroWeight(config.engineRating, SystemComponentServiceImpl.extractGyroType(config.gyroType));
    const structureWeight = this.calculateStructureWeight(config.tonnage, SystemComponentServiceImpl.extractComponentType(config.structureType));
    const heatSinkWeight = this.calculateHeatSinkWeight(SystemComponentServiceImpl.extractComponentType(config.heatSinkType), config.externalHeatSinks);
    
    return {
      engine: engineWeight,
      gyro: gyroWeight,
      structure: structureWeight,
      heatSinks: heatSinkWeight,
      total: engineWeight + gyroWeight + structureWeight + heatSinkWeight
    };
  }
}

// Export factory function for dependency injection
export const createSystemComponentService = (): SystemComponentService => {
  return new SystemComponentServiceImpl();
};
