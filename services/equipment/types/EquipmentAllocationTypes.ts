/**
 * Equipment Allocation Type Definitions
 * Shared types for equipment allocation services
 */

export interface EquipmentPlacement {
  equipmentId: string
  equipment: any
  location: string
  slots: number[]
  isFixed: boolean // Cannot be moved during optimization
  isValid: boolean
  constraints: EquipmentConstraints
  conflicts: string[]
}

export interface PlacementSuggestion {
  location: string
  slots: number[]
  score: number // 0-100, higher is better
  reasoning: string[]
  tradeoffs: string[]
  alternatives: AlternativePlacement[]
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
  type: 'suboptimal_placement' | 'balance_issue' | 'heat_concern' | 'vulnerability' | 'tech_level'
  message: string
  recommendation: string
  impact: 'high' | 'medium' | 'low'
}

export interface AlternativePlacement {
  location: string
  slots: number[]
  pros: string[]
  cons: string[]
  score: number
}

export interface PlacementPreferences {
  preferredLocations: string[]
  avoidLocations: string[]
  prioritizeBalance: boolean
  prioritizeProtection: boolean
  allowSplitting: boolean
  groupWith: string[]
}

export interface EquipmentConstraints {
  allowedLocations: string[]
  forbiddenLocations: string[]
  requiresCASE: boolean
  requiresArtemis: boolean
  minTonnageLocation: number
  maxTonnageLocation: number
  heatGeneration: number
  specialRules: string[]
}

export interface AddEquipmentResult {
  success: boolean
  placement?: EquipmentPlacement
  alternatives: AlternativePlacement[]
  warnings: string[]
  impact: EquipmentImpact
}

export interface RemoveEquipmentResult {
  success: boolean
  freedSlots: { location: string; slots: number[] }
  impact: EquipmentImpact
  suggestions: string[]
}

export interface MoveEquipmentResult {
  success: boolean
  newPlacement?: EquipmentPlacement
  warnings: string[]
  impact: EquipmentImpact
}

export interface EquipmentImpact {
  weight: number
  heat: number
  firepower: number
  balance: number
  efficiency: number
}

export interface AllocationResult {
  success: boolean
  allocations: EquipmentPlacement[]
  unallocated: any[]
  warnings: AllocationWarning[]
  suggestions: string[]
  efficiency: number // 0-100 score
}

export interface AllocationWarning {
  type: 'balance' | 'protection' | 'efficiency' | 'heat' | 'tech_level'
  equipment: string
  message: string
  severity: 'high' | 'medium' | 'low'
  suggestion: string
}

export interface AutoAllocationResult {
  success: boolean
  strategy: string
  allocations: EquipmentPlacement[]
  unallocated: any[]
  metrics: {
    successRate: number
    efficiencyScore: number
    balanceScore: number
    utilization: number
  }
  improvements: string[]
  warnings: AllocationWarning[]
}

export interface AllocationConstraints {
  preferredLocations: string[]
  forbiddenLocations: string[]
  groupTogether: string[][] // Equipment that should be grouped
  separateFrom: string[][] // Equipment that should be separated
  prioritizeBalance: boolean
  prioritizeProtection: boolean
  allowSplitting: boolean
}

export interface WeaponAllocationResult {
  allocated: EquipmentPlacement[]
  unallocated: any[]
  strategy: 'balanced' | 'front_loaded' | 'distributed' | 'concentrated'
  heatEfficiency: number
  firepower: {
    short: number
    medium: number
    long: number
  }
  recommendations: string[]
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  compliance: {
    battleTechRules: boolean
    techLevel: boolean
    mountingRules: boolean
    weightLimits: boolean
  }
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

export interface OptimizationResult {
  improved: boolean
  originalScore: number
  optimizedScore: number
  improvements: Improvement[]
  newAllocations: EquipmentPlacement[]
  summary: string
}

export interface Improvement {
  type: 'balance' | 'efficiency' | 'protection' | 'heat' | 'firepower'
  description: string
  benefit: string
  tradeoff?: string
}

export interface EfficiencyAnalysis {
  overallScore: number // 0-100
  categories: {
    placement: number
    balance: number
    protection: number
    heat: number
    firepower: number
  }
  bottlenecks: string[]
  recommendations: EfficiencyRecommendation[]
}

export interface EfficiencyRecommendation {
  category: string
  issue: string
  suggestion: string
  expectedImprovement: number
  difficulty: 'easy' | 'moderate' | 'hard'
}

export interface HeatAnalysis {
  totalGeneration: number
  byLocation: { [location: string]: number }
  continuousGeneration: number
  alphaStrikeGeneration: number
  heatScale: {
    low: number
    medium: number
    high: number
  }
  recommendations: string[]
}

export interface FirepowerAnalysis {
  totalDamage: {
    short: number
    medium: number
    long: number
  }
  byLocation: {
    [location: string]: {
      short: number
      medium: number
      long: number
    }
  }
  weaponTypes: {
    energy: number
    ballistic: number
    missile: number
  }
  alphaStrike: number
  sustainedFire: number
  recommendations: string[]
}