/**
 * Validation Orchestrator Interface
 * Follows Interface Segregation Principle - split into focused interfaces
 */

import { UnitConfiguration } from '../../../battletech-editor-app/utils/criticalSlots/UnitCriticalManager'

// Core validation result interfaces
export interface ValidationResult {
  isValid: boolean
  violations: ValidationViolation[]
  recommendations: string[]
}

export interface ValidationViolation {
  type: string
  severity: 'critical' | 'major' | 'minor'
  message: string
  component?: string
  location?: string
}

// Segregated interfaces for different validation concerns
export interface IConfigurationValidator {
  validateConfiguration(config: UnitConfiguration): Promise<ConfigurationValidation>
}

export interface IEquipmentValidator {
  validateEquipment(equipment: any[], config: UnitConfiguration): Promise<EquipmentValidation>
}

export interface ITechLevelValidator {
  validateTechLevel(config: UnitConfiguration, equipment: any[]): Promise<TechLevelValidation>
}

export interface IComplianceReporter {
  generateComplianceReport(config: UnitConfiguration, equipment: any[]): Promise<ComplianceReport>
}

// Specific validation result types
export interface ConfigurationValidation extends ValidationResult {
  weight: WeightValidation
  heat: HeatValidation
  movement: MovementValidation
  armor: ArmorValidation
  structure: StructureValidation
}

export interface EquipmentValidation extends ValidationResult {
  weapons: WeaponValidation
  ammunition: AmmoValidation
  criticalSlots: CriticalSlotValidation
  specialEquipment: SpecialEquipmentValidation
}

export interface TechLevelValidation extends ValidationResult {
  techLevel: number
  era: string
  mixedTech: boolean
  availabilityRating: number
}

export interface ComplianceReport {
  overallCompliance: number
  configurationCompliance: number
  equipmentCompliance: number
  techLevelCompliance: number
  summary: ComplianceSummary
}

// Detailed validation types
export interface WeightValidation extends ValidationResult {
  currentWeight: number
  maxWeight: number
  weightEfficiency: number
}

export interface HeatValidation extends ValidationResult {
  heatGeneration: number
  heatDissipation: number
  heatEfficiency: number
}

export interface MovementValidation extends ValidationResult {
  walkSpeed: number
  runSpeed: number
  jumpCapacity: number
}

export interface ArmorValidation extends ValidationResult {
  totalArmor: number
  maxArmor: number
  armorEfficiency: number
}

export interface StructureValidation extends ValidationResult {
  structureIntegrity: number
  criticalComponents: string[]
}

export interface WeaponValidation extends ValidationResult {
  weaponCount: number
  totalWeaponWeight: number
  heatGeneration: number
}

export interface AmmoValidation extends ValidationResult {
  totalAmmoWeight: number
  ammoBalance: AmmoBalanceCheck[]
  caseProtection: CaseProtectionCheck
}

export interface CriticalSlotValidation extends ValidationResult {
  slotsUsed: number
  slotsAvailable: number
  slotEfficiency: number
}

export interface SpecialEquipmentValidation extends ValidationResult {
  specialEquipment: SpecialEquipmentCheck[]
}

// Supporting types
export interface AmmoBalanceCheck {
  weaponType: string
  ammoTons: number
  recommendedTons: number
  isBalanced: boolean
}

export interface CaseProtectionCheck {
  requiredLocations: string[]
  protectedLocations: string[]
  unprotectedLocations: string[]
  isCompliant: boolean
}

export interface SpecialEquipmentCheck {
  equipment: string
  isCompatible: boolean
  conflicts: string[]
}

export interface ComplianceSummary {
  totalViolations: number
  criticalViolations: number
  majorViolations: number
  minorViolations: number
  totalRecommendations: number
}

// Main orchestrator interface combining all validation concerns
export interface IValidationOrchestrator extends 
  IConfigurationValidator, 
  IEquipmentValidator, 
  ITechLevelValidator, 
  IComplianceReporter {
  
  validateUnit(config: UnitConfiguration, equipment: any[]): Promise<ValidationOrchestrationResult>
  quickValidate(config: UnitConfiguration, equipment: any[]): Promise<boolean>
}

export interface ValidationOrchestrationResult {
  configuration: ConfigurationValidation
  equipment: EquipmentValidation
  techLevel: TechLevelValidation
  compliance: ComplianceReport
  overallValid: boolean
  executionTime: number
}