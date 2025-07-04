/**
 * Critical Slot Validation Type Definitions
 * Shared types for critical slot validation services
 */

export interface CriticalSlotValidation {
  isValid: boolean
  totalSlotsUsed: number
  totalSlotsAvailable: number
  locationUtilization: { [location: string]: SlotUtilization }
  specialComponentSlots: SpecialComponentSlots
  placementViolations: PlacementViolation[]
  violations: CriticalSlotViolation[]
  recommendations: string[]
}

export interface SlotUtilization {
  used: number
  available: number
  utilization: number
  overflow: boolean
  components: ComponentSlotInfo[]
}

export interface ComponentSlotInfo {
  id: string
  name: string
  type: string
  slots: number
  location: string
  canRelocate: boolean
}

export interface SpecialComponentSlots {
  endoSteel: EndoSteelSlots
  ferroFibrous: FerroFibrousSlots
  doubleHeatSinks: DoubleHeatSinkSlots
  artemis: ArtemisSlots
  targetingComputer: TargetingComputerSlots
}

export interface EndoSteelSlots {
  required: number
  allocated: number
  locations: string[]
  isCompliant: boolean
}

export interface FerroFibrousSlots {
  required: number
  allocated: number
  locations: string[]
  isCompliant: boolean
}

export interface DoubleHeatSinkSlots {
  engineSlots: number
  externalSlots: number
  totalRequired: number
  isCompliant: boolean
}

export interface ArtemisSlots {
  required: number
  allocated: number
  weaponPairings: ArtemisWeaponPairing[]
  isCompliant: boolean
}

export interface ArtemisWeaponPairing {
  weapon: string
  artemisSystem: string
  location: string
  isValid: boolean
}

export interface TargetingComputerSlots {
  required: number
  allocated: number
  location: string
  isCompliant: boolean
}

export interface PlacementViolation {
  component: string
  location: string
  type: 'invalid_location' | 'requires_pairing' | 'location_restricted' | 'special_placement'
  message: string
  severity: 'critical' | 'major' | 'minor'
  suggestedFix: string
}

export interface CriticalSlotViolation {
  location: string
  type: 'overflow' | 'invalid_placement' | 'special_component_violation' | 'missing_requirements'
  component?: string
  message: string
  severity: 'critical' | 'major' | 'minor'
  suggestedFix: string
}

export interface CriticalSlotValidationContext {
  strictMode: boolean
  validateSpecialComponents: boolean
  validatePlacement: boolean
  allowFlexiblePlacement: boolean
  checkLocationRestrictions: boolean
}

export interface SlotOptimization {
  recommendations: SlotOptimizationRecommendation[]
  alternativeLayouts: AlternativeSlotLayout[]
  efficiencyImprovements: SlotEfficiencyImprovement[]
}

export interface SlotOptimizationRecommendation {
  type: 'relocate_component' | 'merge_locations' | 'optimize_special_components' | 'balance_utilization'
  description: string
  component?: string
  fromLocation?: string
  toLocation?: string
  benefit: string
  difficulty: 'easy' | 'moderate' | 'hard'
  priority: 'high' | 'medium' | 'low'
}

export interface AlternativeSlotLayout {
  name: string
  description: string
  changes: SlotLayoutChange[]
  benefits: string[]
  tradeoffs: string[]
  efficiency: number
}

export interface SlotLayoutChange {
  component: string
  fromLocation: string
  toLocation: string
  reason: string
}

export interface SlotEfficiencyImprovement {
  location: string
  currentUtilization: number
  improvedUtilization: number
  improvement: number
  suggestions: string[]
}