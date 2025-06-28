/**
 * Shared validation types and interfaces
 * Provides consistent typing for all validation services
 */

import { EditableUnit } from '../../types/editor';
import { FullEquipment } from '../../types/index';

// Core validation interfaces
export interface ValidationContext {
  strictMode: boolean;           // Enforce tournament legal rules
  eraRestrictions: boolean;      // Check era-appropriate tech
  customRules: boolean;          // Allow house rules
  experimentalTech: boolean;     // Allow experimental equipment
  skipCostValidation: boolean;   // Skip BV/cost calculations
}

export interface ValidationError {
  id: string;
  field?: string;
  category: 'error' | 'warning' | 'info';
  message: string;
  location?: string;
}

export interface ValidationSuggestion {
  id: string;
  category: 'armor' | 'weapons' | 'heat' | 'structure' | 'movement' | 'cost';
  severity: 'info' | 'minor' | 'major';
  message: string;
  explanation?: string;
}

export interface RuleViolation {
  rule: string;
  section: string;              // TechManual section reference
  description: string;
  violationType: 'construction' | 'equipment' | 'era' | 'tech-base';
  canContinue: boolean;        // Can still play with this violation
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface DetailedValidationResult extends ValidationResult {
  criticalErrors: ValidationError[];    // Must fix to be playable
  suggestions: ValidationSuggestion[];  // Optimization recommendations
  ruleViolations: RuleViolation[];     // Specific rule violations
  battleValue: number;                  // Calculated BV
  cost: number;                        // C-Bill cost
  isLegal: boolean;                    // Tournament legal
  isOptimal: boolean;                  // Well-optimized design
}

// Equipment state tracking for regeneration
export interface EquipmentState {
  equipmentPlacements: {
    id: string;
    equipment: FullEquipment;
    location: string;
    slotIndex?: number;
  }[];
  unallocatedEquipment: FullEquipment[];
  timestamp: number;
}

// Equipment transfer validation
export interface EquipmentTransferResult {
  isValid: boolean;
  transferredCount: number;
  failedTransfers: {
    equipment: FullEquipment;
    reason: string;
    suggestion?: string;
  }[];
  warnings: ValidationError[];
}

// Equipment compatibility result
export interface EquipmentCompatibilityResult {
  isCompatible: boolean;
  conflicts: {
    equipment: FullEquipment;
    conflictType: 'tech-base' | 'era' | 'rules-level' | 'location' | 'space';
    description: string;
  }[];
  suggestions: ValidationSuggestion[];
}

// Validation service interfaces
export interface IStructureValidator {
  validateCoreStructure(unit: EditableUnit, context: ValidationContext): ValidationResult;
  validateMass(unit: EditableUnit): ValidationResult;
  validateEngineRating(unit: EditableUnit): ValidationResult;
  validateMovement(unit: EditableUnit): ValidationResult;
}

export interface IEquipmentValidator {
  validateEquipmentPlacement(unit: EditableUnit, context: ValidationContext): ValidationResult;
  validateEquipmentCompatibility(unit: EditableUnit, context: ValidationContext): EquipmentCompatibilityResult;
  validateEquipmentTransfer(preState: EquipmentState, newUnit: EditableUnit): EquipmentTransferResult;
  captureEquipmentState(unit: EditableUnit): EquipmentState;
  canPlaceEquipment(equipment: FullEquipment, location: string, unit: EditableUnit): boolean;
  getLocationRestrictions(equipment: FullEquipment, unit: EditableUnit): string[];
}

export interface IHeatManagementValidator {
  validateHeatManagement(unit: EditableUnit, context: ValidationContext): ValidationResult;
  calculateHeatBalance(unit: EditableUnit): {
    generation: number;
    dissipation: number;
    balance: number;
    efficiency: number;
  };
  validateHeatSinks(unit: EditableUnit): ValidationResult;
}

export interface IArmorValidator {
  validateArmorAllocation(unit: EditableUnit, context: ValidationContext): ValidationResult;
  validateArmorDistribution(unit: EditableUnit): ValidationResult;
  calculateArmorEfficiency(unit: EditableUnit): {
    totalArmor: number;
    maxPossible: number;
    efficiency: number;
    suggestions: ValidationSuggestion[];
  };
}

export interface IBattleValueCalculator {
  calculateBattleValue(unit: EditableUnit, context: ValidationContext): number;
  calculateWeaponBV(unit: EditableUnit): number;
  calculateEquipmentBV(unit: EditableUnit): number;
  calculateQuirkModifiers(unit: EditableUnit): number;
}

export interface ICostCalculator {
  calculateCost(unit: EditableUnit, context: ValidationContext): number;
  calculateBaseCost(unit: EditableUnit): number;
  calculateEquipmentCost(unit: EditableUnit): number;
}

export interface IOptimizationAnalyzer {
  analyzeOptimization(unit: EditableUnit, context: ValidationContext): ValidationSuggestion[];
  analyzeTonnageEfficiency(unit: EditableUnit): ValidationSuggestion[];
  analyzeWeaponLoadout(unit: EditableUnit): ValidationSuggestion[];
  analyzeArmorDistribution(unit: EditableUnit): ValidationSuggestion[];
}

export interface IValidationEngine {
  validateUnit(unit: EditableUnit, context?: ValidationContext): DetailedValidationResult;
  validateQuick(unit: EditableUnit): { isValid: boolean; errorCount: number; warningCount: number };
  validateEquipmentTransfer(preState: EquipmentState, newUnit: EditableUnit): EquipmentTransferResult;
  captureEquipmentState(unit: EditableUnit): EquipmentState;
  
  // Service access
  getStructureValidator(): IStructureValidator;
  getEquipmentValidator(): IEquipmentValidator;
  getHeatValidator(): IHeatManagementValidator;
  getArmorValidator(): IArmorValidator;
  getBattleValueCalculator(): IBattleValueCalculator;
  getCostCalculator(): ICostCalculator;
  getOptimizationAnalyzer(): IOptimizationAnalyzer;
}

// Default validation context
export const DEFAULT_VALIDATION_CONTEXT: ValidationContext = {
  strictMode: false,
  eraRestrictions: true,
  customRules: false,
  experimentalTech: false,
  skipCostValidation: false
};

// Quick validation context for UI feedback
export const QUICK_VALIDATION_CONTEXT: ValidationContext = {
  strictMode: false,
  eraRestrictions: false,
  customRules: true,
  experimentalTech: true,
  skipCostValidation: true
};
