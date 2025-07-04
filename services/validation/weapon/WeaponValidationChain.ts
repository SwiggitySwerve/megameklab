/**
 * Weapon Validation Chain
 * Main coordinator for weapon validation using Chain of Responsibility pattern
 * Provides primary interface for weapon validation and result aggregation
 */

import {
  WeaponValidationHandler,
  WeaponValidationContext,
  WeaponValidationResult,
  WeaponValidationObserver,
  WeaponValidationConfig,
  ValidationHandlerType
} from './WeaponValidationTypes'
import { 
  WeaponValidationChainBuilder,
  WeaponValidationHandlerFactory
} from './BaseWeaponValidationHandler'
import { WeaponConfigurationValidationHandler } from './handlers/WeaponConfigurationValidationHandler'
import { AmmoBalanceValidationHandler } from './handlers/AmmoBalanceValidationHandler'

/**
 * Main Weapon Validation Chain
 * Coordinates multiple validation handlers using Chain of Responsibility pattern
 */
export class WeaponValidationChain {
  private validationChain: WeaponValidationHandler | null = null
  private observers: WeaponValidationObserver[] = []
  private config: WeaponValidationConfig

  constructor(config?: Partial<WeaponValidationConfig>) {
    this.config = {
      enabledHandlers: ['configuration', 'tech_compatibility', 'ammo_balance', 'placement', 'balance', 'optimization'],
      validationStrategy: 'standard',
      strictMode: false,
      performanceMode: false,
      enableOptimizations: true,
      customRules: [],
      ...config
    }

    this.initializeChain()
  }

  /**
   * Initialize the validation chain with configured handlers
   */
  private initializeChain(): void {
    // Register default handlers
    this.registerDefaultHandlers()

    // Build chain with enabled handlers
    const builder = new WeaponValidationChainBuilder()

    this.config.enabledHandlers.forEach(handlerType => {
      const handler = WeaponValidationHandlerFactory.createHandler(handlerType)
      if (handler) {
        builder.addHandler(handler)
      }
    })

    this.validationChain = builder.build()
  }

  /**
   * Register default validation handlers
   */
  private registerDefaultHandlers(): void {
    WeaponValidationHandlerFactory.registerHandler('configuration', WeaponConfigurationValidationHandler)
    WeaponValidationHandlerFactory.registerHandler('ammo_balance', AmmoBalanceValidationHandler)
    // TODO: Register other handlers as they are created
  }

  /**
   * Validate weapons using the handler chain
   */
  async validateWeapons(
    unit: any,
    equipment: any[],
    contextOverrides?: Partial<WeaponValidationContext>
  ): Promise<WeaponValidationResult> {
    const startTime = performance.now()

    // Create validation context
    const context = this.createValidationContext(unit, equipment, contextOverrides)

    // Notify observers of validation start
    this.notifyObservers('onValidationStart', context)

    try {
      // Execute validation chain
      let chainResult: any = null
      if (this.validationChain) {
        chainResult = await this.validationChain.handle(context)
      }

      const endTime = performance.now()

      // Aggregate results from chain
      const result = this.aggregateChainResult(chainResult, context, endTime - startTime)

      // Notify observers of completion
      this.notifyObservers('onValidationComplete', result)

      return result
    } catch (error) {
      const endTime = performance.now()
      const errorResult = this.createErrorResult(endTime - startTime, error)
      
      // Notify observers of error
      this.notifyObservers('onValidationError', error)
      
      return errorResult
    }
  }

  /**
   * Create validation context from inputs
   */
  private createValidationContext(
    unit: any,
    equipment: any[],
    overrides?: Partial<WeaponValidationContext>
  ): WeaponValidationContext {
    const weapons = equipment.filter(item => this.isWeapon(item))
    const ammunition = equipment.filter(item => this.isAmmunition(item))

    const defaultContext: WeaponValidationContext = {
      strictMode: this.config.strictMode,
      checkTechCompatibility: true,
      validateAmmoBalance: true,
      enforceEraRestrictions: false,
      unit,
      equipment,
      weapons,
      ammunition
    }

    return { ...defaultContext, ...overrides }
  }

  /**
   * Aggregate results from validation chain
   */
  private aggregateChainResult(
    chainResult: any,
    context: WeaponValidationContext,
    totalTime: number
  ): WeaponValidationResult {
    if (!chainResult) {
      return this.createEmptyResult(totalTime)
    }

    // Extract data from chain result
    const configurationData = chainResult.data?.categories ? chainResult.data : {}
    const ammoBalanceData = chainResult.data?.ammoBalance || this.createEmptyAmmoBalance()
    const techCompatibilityData = chainResult.data?.techCompatibility || this.createEmptyTechCompatibility()

    // Calculate metrics
    const weaponCount = context.weapons.length
    const totalHeatGeneration = this.calculateTotalHeat(context.weapons)
    const totalWeight = this.calculateTotalWeight(context.equipment)

    // Create loadout analysis
    const loadoutAnalysis = this.analyzeWeaponLoadout(context.weapons)

    // Generate optimizations if enabled
    const optimizations = this.config.enableOptimizations ? 
      this.generateOptimizations(context.weapons, context) : 
      this.createEmptyOptimizations()

    return {
      errors: chainResult.errors || [],
      warnings: chainResult.warnings || [],
      weaponCount,
      totalHeatGeneration,
      totalWeight,
      ammoBalance: ammoBalanceData,
      techCompatibility: techCompatibilityData,
      loadoutAnalysis,
      optimizations,
      isValid: (chainResult.errors || []).length === 0
    }
  }

  /**
   * Analyze weapon loadout for range and heat profiles
   */
  private analyzeWeaponLoadout(weapons: any[]): any {
    const totalHeat = this.calculateTotalHeat(weapons)
    const totalDamage = weapons.reduce((sum, weapon) => sum + (weapon.damage || 0), 0)
    const averageRange = weapons.length > 0 ? 
      weapons.reduce((sum, weapon) => sum + (weapon.range || 0), 0) / weapons.length : 0

    // Categorize by range
    let shortRange = 0, mediumRange = 0, longRange = 0
    weapons.forEach(weapon => {
      const range = weapon.range || 0
      if (range <= 90) shortRange += weapon.damage || 0
      else if (range <= 270) mediumRange += weapon.damage || 0
      else longRange += weapon.damage || 0
    })

    // Calculate efficiency metrics
    const heatEfficiency = totalHeat > 0 ? totalDamage / totalHeat : 0
    const weightEfficiency = weapons.length > 0 ? 
      totalDamage / this.calculateTotalWeight(weapons) : 0

    return {
      shortRange,
      mediumRange,
      longRange,
      heatBalance: totalHeat,
      alphaStrike: totalDamage,
      sustainedDamage: totalDamage * 0.8, // Estimate considering heat
      efficiency: Math.round((heatEfficiency + weightEfficiency) / 2),
      rangeProfile: {
        optimal: averageRange,
        effective: averageRange * 0.8,
        maximum: Math.max(...weapons.map(w => w.range || 0), 0),
        bracket: this.determineRangeBracket(averageRange)
      },
      heatProfile: {
        generation: totalHeat,
        dissipation: 10, // Default heat sink dissipation
        deficit: Math.max(0, totalHeat - 10),
        sustainabilityRatio: totalHeat > 0 ? 10 / totalHeat : 1
      }
    }
  }

  /**
   * Generate weapon optimizations
   */
  private generateOptimizations(weapons: any[], context: WeaponValidationContext): any {
    const suggestions: any[] = []

    // Heat optimization suggestions
    const totalHeat = this.calculateTotalHeat(weapons)
    if (totalHeat > 20) {
      suggestions.push({
        type: 'remove',
        weapon: 'high-heat weapons',
        suggestion: 'Consider reducing heat-generating weapons',
        benefit: 'Improved heat management',
        impact: 75,
        difficulty: 'moderate',
        priority: 'high',
        category: 'heat'
      })
    }

    // Range optimization suggestions
    const ranges = weapons.map(w => w.range || 0)
    const rangeSpread = Math.max(...ranges) - Math.min(...ranges)
    if (rangeSpread > 300) {
      suggestions.push({
        type: 'replace',
        weapon: 'mixed-range weapons',
        suggestion: 'Consider focusing on consistent range brackets',
        benefit: 'Better tactical coordination',
        impact: 60,
        difficulty: 'moderate',
        priority: 'medium',
        category: 'range'
      })
    }

    // Weight optimization suggestions
    const heavyWeapons = weapons.filter(w => (w.tonnage || 0) > 10)
    if (heavyWeapons.length > 2) {
      suggestions.push({
        type: 'replace',
        weapon: 'heavy weapons',
        suggestion: 'Consider lighter weapon alternatives',
        benefit: 'Weight savings for other equipment',
        impact: 65,
        difficulty: 'hard',
        priority: 'medium',
        category: 'weight'
      })
    }

    return {
      heatOptimization: suggestions.filter(s => s.category === 'heat'),
      rangeOptimization: suggestions.filter(s => s.category === 'range'),
      weightOptimization: suggestions.filter(s => s.category === 'weight'),
      ammoOptimization: [],
      overallScore: this.calculateOptimizationScore(suggestions)
    }
  }

  /**
   * Calculate optimization score
   */
  private calculateOptimizationScore(suggestions: any[]): number {
    if (suggestions.length === 0) return 100

    const totalImpact = suggestions.reduce((sum, s) => sum + s.impact, 0)
    const averageImpact = totalImpact / suggestions.length
    
    return Math.max(0, 100 - averageImpact)
  }

  /**
   * Determine range bracket from average range
   */
  private determineRangeBracket(averageRange: number): 'short' | 'medium' | 'long' | 'mixed' {
    if (averageRange <= 90) return 'short'
    if (averageRange <= 270) return 'medium'
    if (averageRange > 270) return 'long'
    return 'mixed'
  }

  /**
   * Add observer for validation events
   */
  addObserver(observer: WeaponValidationObserver): void {
    this.observers.push(observer)
  }

  /**
   * Remove observer
   */
  removeObserver(observer: WeaponValidationObserver): void {
    const index = this.observers.indexOf(observer)
    if (index > -1) {
      this.observers.splice(index, 1)
    }
  }

  /**
   * Update configuration and rebuild chain
   */
  updateConfig(newConfig: Partial<WeaponValidationConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.initializeChain()
  }

  /**
   * Get current configuration
   */
  getConfig(): WeaponValidationConfig {
    return { ...this.config }
  }

  /**
   * Get available handlers
   */
  getAvailableHandlers(): ValidationHandlerType[] {
    return ['configuration', 'tech_compatibility', 'ammo_balance', 'placement', 'balance', 'optimization']
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Check if item is a weapon
   */
  private isWeapon(item: any): boolean {
    if (!item || !item.item_name) return false

    const hasWeaponCategory = ['Energy Weapons', 'Ballistic Weapons', 'Missile Weapons', 'Artillery Weapons', 'Special Weapons']
      .some(category => item.category?.includes(category))
    const hasWeaponType = item.item_type === 'weapon' || item.type?.includes('weapon')
    const hasWeaponName = item.item_name?.match(/\b(Laser|PPC|AC\/|LRM|SRM|Gauss|Pulse|Cannon)\b/i)
    const hasWeaponProperties = item.heat !== undefined || item.damage !== undefined

    return hasWeaponCategory || hasWeaponType || hasWeaponName || hasWeaponProperties
  }

  /**
   * Check if item is ammunition
   */
  private isAmmunition(item: any): boolean {
    if (!item || !item.item_name) return false

    return item.item_name?.toLowerCase().includes('ammo') ||
           item.ammo_type !== undefined ||
           item.shots !== undefined ||
           item.item_name?.match(/\b(ammo|ammunition)\b/i)
  }

  /**
   * Calculate total heat generation
   */
  private calculateTotalHeat(weapons: any[]): number {
    return weapons.reduce((total, weapon) => total + (weapon.heat || 0), 0)
  }

  /**
   * Calculate total weight
   */
  private calculateTotalWeight(equipment: any[]): number {
    return equipment.reduce((total, item) => total + (item.tonnage || 0), 0)
  }

  /**
   * Create empty result for error cases
   */
  private createEmptyResult(totalTime: number): WeaponValidationResult {
    return {
      errors: [],
      warnings: [],
      weaponCount: 0,
      totalHeatGeneration: 0,
      totalWeight: 0,
      ammoBalance: this.createEmptyAmmoBalance(),
      techCompatibility: this.createEmptyTechCompatibility(),
      loadoutAnalysis: this.createEmptyLoadoutAnalysis(),
      optimizations: this.createEmptyOptimizations(),
      isValid: true
    }
  }

  /**
   * Create error result
   */
  private createErrorResult(totalTime: number, error: any): WeaponValidationResult {
    return {
      errors: [{
        id: 'validation-chain-error',
        category: 'error',
        message: `Validation chain error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'critical',
        suggestedFix: 'Check validation configuration and input data'
      }],
      warnings: [],
      weaponCount: 0,
      totalHeatGeneration: 0,
      totalWeight: 0,
      ammoBalance: this.createEmptyAmmoBalance(),
      techCompatibility: this.createEmptyTechCompatibility(),
      loadoutAnalysis: this.createEmptyLoadoutAnalysis(),
      optimizations: this.createEmptyOptimizations(),
      isValid: false
    }
  }

  /**
   * Create empty ammo balance status
   */
  private createEmptyAmmoBalance(): any {
    return {
      weaponsWithAmmo: 0,
      weaponsNeedingAmmo: 0,
      excessAmmo: [],
      missingAmmo: [],
      recommendations: [],
      balanceScore: 100
    }
  }

  /**
   * Create empty tech compatibility status
   */
  private createEmptyTechCompatibility(): any {
    return {
      isCompatible: true,
      mixedTechDetected: false,
      incompatibleItems: [],
      suggestions: [],
      compatibilityScore: 100,
      innerSphereCount: 0,
      clanCount: 0
    }
  }

  /**
   * Create empty loadout analysis
   */
  private createEmptyLoadoutAnalysis(): any {
    return {
      shortRange: 0,
      mediumRange: 0,
      longRange: 0,
      heatBalance: 0,
      alphaStrike: 0,
      sustainedDamage: 0,
      efficiency: 0,
      rangeProfile: {
        optimal: 0,
        effective: 0,
        maximum: 0,
        bracket: 'mixed'
      },
      heatProfile: {
        generation: 0,
        dissipation: 10,
        deficit: 0,
        sustainabilityRatio: 1
      }
    }
  }

  /**
   * Create empty optimizations
   */
  private createEmptyOptimizations(): any {
    return {
      heatOptimization: [],
      rangeOptimization: [],
      weightOptimization: [],
      ammoOptimization: [],
      overallScore: 100
    }
  }

  /**
   * Notify all observers
   */
  private notifyObservers(method: keyof WeaponValidationObserver, ...args: any[]): void {
    this.observers.forEach(observer => {
      try {
        (observer[method] as any)(...args)
      } catch (error) {
        console.warn('Observer notification failed:', error)
      }
    })
  }
}