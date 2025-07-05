/**
 * IWeightCalculationService - Interface for weight calculation operations
 * 
 * Defines the contract for weight calculation services following SOLID principles.
 * This interface ensures consistent behavior across all weight calculation implementations.
 */

import { UnitConfiguration } from '../../utils/criticalSlots/UnitCriticalManager';

export interface WeightSummary {
  totalWeight: number;
  maxTonnage: number;
  remainingTonnage: number;
  percentageUsed: number;
  isOverweight: boolean;
  breakdown: {
    structure: number;
    engine: number;
    gyro: number;
    heatSinks: number;
    armor: number;
    equipment: number;
    ammunition: number;
    jumpJets: number;
  };
}

export interface ComponentWeightBreakdown {
  structure: {
    weight: number;
    type: string;
    efficiency: number;
  };
  engine: {
    weight: number;
    type: string;
    rating: number;
    efficiency: number;
  };
  gyro: {
    weight: number;
    type: string;
    efficiency: number;
  };
  heatSinks: {
    internal: number;
    external: number;
    total: number;
    type: string;
    efficiency: number;
  };
  armor: {
    weight: number;
    type: string;
    points: number;
    efficiency: number;
  };
  jumpJets: {
    weight: number;
    count: number;
    type: string;
    efficiency: number;
  };
}

export interface TonnageValidation {
  isValid: boolean;
  currentWeight: number;
  maxTonnage: number;
  overweight: number;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface EquipmentItem {
  equipmentData?: {
    tonnage?: number;
    type?: string;
  };
  quantity?: number;
}

/**
 * Core interface for weight calculation operations
 */
export interface IWeightCalculationService {
  /**
   * Calculate the total weight of a unit including all components and equipment
   */
  calculateTotalWeight(config: UnitConfiguration, equipment: EquipmentItem[]): WeightSummary;

  /**
   * Calculate the weight breakdown for all structural components
   */
  calculateComponentWeights(config: UnitConfiguration): ComponentWeightBreakdown;

  /**
   * Calculate the total weight of equipment loadout
   */
  calculateEquipmentWeight(equipment: EquipmentItem[]): number;

  /**
   * Validate that the unit stays within tonnage limits
   */
  validateTonnageLimit(config: UnitConfiguration, equipment: EquipmentItem[]): TonnageValidation;

  /**
   * Calculate remaining tonnage available for equipment
   */
  calculateRemainingTonnage(config: UnitConfiguration, equipment: EquipmentItem[]): number;

  /**
   * Check if unit is within tonnage limit
   */
  isWithinTonnageLimit(config: UnitConfiguration, equipment: EquipmentItem[]): boolean;

  /**
   * Calculate the weight of jump jets based on configuration
   */
  calculateJumpJetWeight(config: UnitConfiguration): number;
}

/**
 * Type guard to check if an object is a valid UnitConfiguration
 */
export function isValidUnitConfiguration(config: unknown): config is UnitConfiguration {
  if (typeof config !== 'object' || config === null) {
    return false;
  }
  
  // Type-safe property access for tonnage validation
  const configRecord = config as Record<string, unknown>;
  return 'tonnage' in configRecord && 
         typeof configRecord.tonnage === 'number' &&
         configRecord.tonnage > 0;
}

/**
 * Type guard to check if an object is a valid EquipmentItem
 */
export function isValidEquipmentItem(item: unknown): item is EquipmentItem {
  return typeof item === 'object' && item !== null;
}

/**
 * Type guard to check if an array contains valid equipment items
 */
export function isValidEquipmentArray(equipment: unknown): equipment is EquipmentItem[] {
  return Array.isArray(equipment) && equipment.every(isValidEquipmentItem);
}