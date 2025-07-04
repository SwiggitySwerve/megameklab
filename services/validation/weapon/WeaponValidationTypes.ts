/**
 * Weapon Validation Type Definitions
 * Shared types for weapon validation chain of responsibility and strategy patterns
 */

export interface WeaponValidationContext {
  strictMode: boolean
  checkTechCompatibility: boolean
  validateAmmoBalance: boolean
  enforceEraRestrictions: boolean
  unit: any
  equipment: any[]
  weapons: any[]
  ammunition: any[]
}

export interface WeaponValidationResult {
  errors: ValidationError[]
  warnings: ValidationError[]
  weaponCount: number
  totalHeatGeneration: number
  totalWeight: number
  ammoBalance: AmmoBalanceStatus
  techCompatibility: TechCompatibilityStatus
  loadoutAnalysis: WeaponLoadoutAnalysis
  optimizations: WeaponOptimization
  isValid: boolean
}

export interface ValidationError {
  id: string
  category: 'error' | 'warning' | 'info'
  message: string
  field?: string
  severity?: 'critical' | 'major' | 'minor'
  suggestedFix?: string
}

export interface AmmoBalanceStatus {
  weaponsWithAmmo: number
  weaponsNeedingAmmo: number
  excessAmmo: string[]
  missingAmmo: string[]
  recommendations: string[]
  balanceScore: number
}

export interface TechCompatibilityStatus {
  isCompatible: boolean
  mixedTechDetected: boolean
  incompatibleItems: string[]
  suggestions: string[]
  compatibilityScore: number
  innerSphereCount: number
  clanCount: number
}

export interface WeaponLoadoutAnalysis {
  shortRange: number
  mediumRange: number
  longRange: number
  heatBalance: number
  alphaStrike: number
  sustainedDamage: number
  efficiency: number
  rangeProfile: RangeProfile
  heatProfile: HeatProfile
}

export interface RangeProfile {
  optimal: number
  effective: number
  maximum: number
  bracket: 'short' | 'medium' | 'long' | 'mixed'
}

export interface HeatProfile {
  generation: number
  dissipation: number
  deficit: number
  sustainabilityRatio: number
}

export interface WeaponOptimization {
  heatOptimization: OptimizationSuggestion[]
  rangeOptimization: OptimizationSuggestion[]
  weightOptimization: OptimizationSuggestion[]
  ammoOptimization: OptimizationSuggestion[]
  overallScore: number
}

export interface OptimizationSuggestion {
  type: 'replace' | 'remove' | 'add' | 'relocate'
  weapon: string
  suggestion: string
  benefit: string
  impact: number
  difficulty: 'easy' | 'moderate' | 'hard'
  priority: 'high' | 'medium' | 'low'
  category: string
}

// Chain of Responsibility interfaces
export interface WeaponValidationHandler {
  setNext(handler: WeaponValidationHandler): WeaponValidationHandler
  handle(context: WeaponValidationContext): Promise<WeaponValidationHandlerResult>
  getName(): string
  getPriority(): number
  isApplicable(context: WeaponValidationContext): boolean
}

export interface WeaponValidationHandlerResult {
  handlerName: string
  processed: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  data: any
  executionTime: number
  recommendations: string[]
}

// Strategy pattern interfaces
export interface WeaponValidationStrategy {
  validate(context: WeaponValidationContext): WeaponValidationResult
  getName(): string
  getDescription(): string
  isApplicable(context: WeaponValidationContext): boolean
}

export interface WeaponAnalysisStrategy {
  analyze(weapons: any[], context: WeaponValidationContext): WeaponLoadoutAnalysis
  getName(): string
}

export interface WeaponOptimizationStrategy {
  optimize(weapons: any[], context: WeaponValidationContext): WeaponOptimization
  getName(): string
}

// Factory pattern interfaces
export interface WeaponValidatorFactory {
  createValidator(type: WeaponValidationType): WeaponValidationStrategy
  createHandler(type: ValidationHandlerType): WeaponValidationHandler
  getAvailableValidators(): WeaponValidationType[]
  getAvailableHandlers(): ValidationHandlerType[]
}

export type WeaponValidationType = 
  | 'standard'
  | 'competitive'
  | 'casual'
  | 'tournament'
  | 'custom'

export type ValidationHandlerType =
  | 'configuration'
  | 'tech_compatibility'
  | 'ammo_balance'
  | 'placement'
  | 'balance'
  | 'optimization'

// Weapon data interfaces
export interface WeaponData {
  item_name: string
  category?: string
  type?: string
  tonnage?: number
  heat?: number
  damage?: number
  range?: number
  criticals?: number
  tech_base?: string
  location?: string
  ammo_type?: string
}

export interface AmmoData {
  item_name: string
  ammo_type: string
  tonnage: number
  shots: number
  tech_base?: string
  compatible_weapons: string[]
}

// Validation rule interfaces
export interface WeaponValidationRule {
  id: string
  name: string
  description: string
  category: string
  severity: 'critical' | 'major' | 'minor'
  isApplicable(context: WeaponValidationContext): boolean
  validate(context: WeaponValidationContext): ValidationError[]
}

export interface WeaponCompatibilityRule {
  weaponPattern: RegExp
  ammoPattern: RegExp
  isCompatible: boolean
  notes?: string
}

export interface TechBaseRule {
  unitTechBase: string
  allowedItemTechBases: string[]
  mixedTechAllowed: boolean
  restrictions: string[]
}

// Observer pattern for validation monitoring
export interface WeaponValidationObserver {
  onValidationStart(context: WeaponValidationContext): void
  onHandlerStart(handlerName: string): void
  onHandlerComplete(handlerName: string, result: WeaponValidationHandlerResult): void
  onValidationComplete(result: WeaponValidationResult): void
  onValidationError(error: Error): void
}

// Configuration interfaces
export interface WeaponValidationConfig {
  enabledHandlers: ValidationHandlerType[]
  validationStrategy: WeaponValidationType
  strictMode: boolean
  performanceMode: boolean
  enableOptimizations: boolean
  customRules: WeaponValidationRule[]
}

// Metrics and monitoring
export interface WeaponValidationMetrics {
  totalValidationTime: number
  handlerExecutionTimes: { [handlerName: string]: number }
  validationCounts: { [validationType: string]: number }
  errorCounts: { [errorType: string]: number }
  performanceBottlenecks: string[]
  recommendations: string[]
}

// Constants and enums
export const WEAPON_CATEGORIES = [
  'Energy Weapons',
  'Ballistic Weapons', 
  'Missile Weapons',
  'Artillery Weapons',
  'Special Weapons'
] as const

export const AMMO_WEAPONS = [
  'AC/2', 'AC/5', 'AC/10', 'AC/20',
  'Ultra AC/2', 'Ultra AC/5', 'Ultra AC/10', 'Ultra AC/20',
  'LB 2-X AC', 'LB 5-X AC', 'LB 10-X AC', 'LB 20-X AC',
  'LRM-5', 'LRM-10', 'LRM-15', 'LRM-20',
  'SRM-2', 'SRM-4', 'SRM-6',
  'Streak SRM-2', 'Streak SRM-4', 'Streak SRM-6',
  'Gauss Rifle', 'Light Gauss Rifle', 'Heavy Gauss Rifle',
  'Machine Gun', 'Light Machine Gun', 'Heavy Machine Gun'
] as const

export const TECH_BASES = [
  'Inner Sphere',
  'Clan',
  'Mixed (IS Chassis)',
  'Mixed (Clan Chassis)'
] as const

export const VALIDATION_PRIORITIES = {
  CONFIGURATION: 100,
  TECH_COMPATIBILITY: 90,
  AMMO_BALANCE: 80,
  PLACEMENT: 70,
  BALANCE: 60,
  OPTIMIZATION: 50
} as const

// Utility type guards
export function isWeaponData(item: any): item is WeaponData {
  return item && typeof item.item_name === 'string' && (
    WEAPON_CATEGORIES.some(category => item.category?.includes(category)) ||
    item.item_type === 'weapon' ||
    item.type?.includes('weapon') ||
    item.item_name?.match(/\b(Laser|PPC|AC\/|LRM|SRM|Gauss|Pulse)\b/i) ||
    (item.heat !== undefined || item.damage !== undefined)
  )
}

export function isAmmoData(item: any): item is AmmoData {
  return item && typeof item.item_name === 'string' && (
    item.item_name?.toLowerCase().includes('ammo') ||
    item.ammo_type !== undefined ||
    item.shots !== undefined
  )
}

export function requiresAmmo(weapon: WeaponData): boolean {
  const weaponName = weapon.item_name || ''
  return AMMO_WEAPONS.some(ammoWeapon => 
    weaponName.includes(ammoWeapon) ||
    weaponName.includes(ammoWeapon.split(' ')[0])
  )
}