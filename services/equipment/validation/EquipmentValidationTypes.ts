/**
 * Equipment Validation Type Definitions
 * Shared types for equipment validation pipeline services
 */

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  compliance: ComplianceStatus
  suggestions: string[]
}

export interface ValidationError {
  equipmentId: string
  type: string
  message: string
  severity: 'critical' | 'major' | 'minor'
  location?: string
  suggestedFix: string
}

export interface ValidationWarning {
  equipmentId: string
  type: string
  message: string
  impact: 'high' | 'medium' | 'low'
  recommendation: string
}

export interface ComplianceStatus {
  battleTechRules: boolean
  techLevel: boolean
  mountingRules: boolean
  weightLimits: boolean
}

export interface PlacementValidation {
  isValid: boolean
  errors: PlacementError[]
  warnings: PlacementWarning[]
  restrictions: string[]
  suggestions: string[]
}

export interface PlacementError {
  type: 'slot_conflict' | 'location_invalid' | 'weight_exceeded' | 'rule_violation' | 'tech_level'
  message: string
  severity: 'critical' | 'major' | 'minor'
  suggestedFix: string
}

export interface PlacementWarning {
  type: 'suboptimal_placement' | 'balance_issue' | 'heat_concern' | 'vulnerability'
  message: string
  recommendation: string
  impact: 'high' | 'medium' | 'low'
}

export interface RuleComplianceResult {
  compliant: boolean
  violations: RuleViolation[]
  techLevelIssues: TechLevelIssue[]
  mountingIssues: MountingIssue[]
  suggestions: ComplianceSuggestion[]
}

export interface RuleViolation {
  rule: string
  description: string
  affectedEquipment: string[]
  severity: 'critical' | 'major' | 'minor'
  resolution: string
}

export interface TechLevelIssue {
  equipment: string
  requiredTechLevel: string
  currentTechLevel: string
  era: string
  canBeResolved: boolean
  suggestion: string
}

export interface MountingIssue {
  equipment: string
  location: string
  issue: string
  restriction: string
  alternatives: string[]
}

export interface ComplianceSuggestion {
  type: 'tech_level' | 'mounting' | 'rule_compliance'
  equipment: string
  suggestion: string
  impact: string
}

export interface TechLevelValidation {
  isValid: boolean
  issues: TechLevelIssue[]
  summary: TechLevelSummary
  recommendations: string[]
}

export interface TechLevelSummary {
  innerSphere: number
  clan: number
  mixed: boolean
  era: string
  techLevel: string
}

export interface MountingValidation {
  canMount: boolean
  restrictions: MountingRestriction[]
  requirements: MountingRequirement[]
  alternatives: string[]
  warnings: string[]
}

export interface MountingRestriction {
  type: 'location' | 'tonnage' | 'heat' | 'ammunition' | 'special'
  description: string
  severity: 'blocking' | 'warning'
}

export interface MountingRequirement {
  type: 'case' | 'artemis' | 'targeting_computer' | 'special'
  description: string
  satisfied: boolean
  suggestion?: string
}

// Pipeline-specific types
export interface ValidationContext {
  config: any
  allocations: any[]
  strictMode: boolean
  techLevel: string
  era: string
}

export interface ValidationStageResult {
  stageName: string
  passed: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  processingTime: number
  suggestions: string[]
}

export interface PipelineResult {
  overall: ValidationResult
  stages: ValidationStageResult[]
  processingTime: number
  summary: ValidationSummary
}

export interface ValidationSummary {
  totalErrors: number
  totalWarnings: number
  criticalIssues: number
  majorIssues: number
  minorIssues: number
  complianceScore: number
}

// Equipment placement types
export interface EquipmentPlacement {
  equipmentId: string
  equipment: any
  location: string
  startSlot?: number
  endSlot?: number
  quantity?: number
}

export interface EquipmentConstraints {
  allowedLocations: string[]
  forbiddenLocations: string[]
  requiredComponents: string[]
  maxQuantity: number
  tonnageLimit: number
  heatGeneration: number
  specialRules: string[]
}