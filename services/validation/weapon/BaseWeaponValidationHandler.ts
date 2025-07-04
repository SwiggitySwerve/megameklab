/**
 * Base Weapon Validation Handler
 * Abstract base class implementing Chain of Responsibility pattern for weapon validation
 * Provides infrastructure for validation handler chaining and execution
 */

import {
  WeaponValidationHandler,
  WeaponValidationHandlerResult,
  WeaponValidationContext,
  ValidationError,
  VALIDATION_PRIORITIES
} from './WeaponValidationTypes'

/**
 * Abstract base class for weapon validation handlers
 * Implements Chain of Responsibility pattern for processing weapon validation
 */
export abstract class BaseWeaponValidationHandler implements WeaponValidationHandler {
  protected nextHandler: WeaponValidationHandler | null = null
  protected handlerName: string
  protected priority: number

  constructor(handlerName: string, priority: number) {
    this.handlerName = handlerName
    this.priority = priority
  }

  /**
   * Set the next handler in the chain
   */
  setNext(handler: WeaponValidationHandler): WeaponValidationHandler {
    this.nextHandler = handler
    return handler
  }

  /**
   * Handle the validation request and optionally pass to next handler
   */
  async handle(context: WeaponValidationContext): Promise<WeaponValidationHandlerResult> {
    const startTime = performance.now()

    try {
      // Check if this handler is applicable to the current context
      if (!this.isApplicable(context)) {
        const endTime = performance.now()
        return this.createSkippedResult(endTime - startTime)
      }

      // Execute the specific validation logic
      const result = await this.validateWeapons(context)
      const endTime = performance.now()

      const handlerResult: WeaponValidationHandlerResult = {
        handlerName: this.handlerName,
        processed: true,
        errors: result.errors,
        warnings: result.warnings,
        data: result.data || {},
        executionTime: endTime - startTime,
        recommendations: result.recommendations || []
      }

      // Continue to next handler if available
      if (this.nextHandler && this.shouldContinueChain(context, handlerResult)) {
        const nextResult = await this.nextHandler.handle(context)
        
        // Merge results from next handler
        return this.mergeResults(handlerResult, nextResult)
      }

      return handlerResult
    } catch (error) {
      const endTime = performance.now()
      return this.createErrorResult(endTime - startTime, error)
    }
  }

  /**
   * Get handler name
   */
  getName(): string {
    return this.handlerName
  }

  /**
   * Get handler priority
   */
  getPriority(): number {
    return this.priority
  }

  /**
   * Check if handler is applicable to current context
   */
  abstract isApplicable(context: WeaponValidationContext): boolean

  /**
   * Abstract method for specific validation logic implementation
   */
  protected abstract validateWeapons(context: WeaponValidationContext): Promise<{
    errors: ValidationError[]
    warnings: ValidationError[]
    data?: any
    recommendations?: string[]
  }>

  /**
   * Determine if validation should continue to next handler
   * Override this to implement custom continuation logic
   */
  protected shouldContinueChain(
    context: WeaponValidationContext,
    currentResult: WeaponValidationHandlerResult
  ): boolean {
    // In strict mode, stop chain on critical errors
    if (context.strictMode && this.hasCriticalErrors(currentResult.errors)) {
      return false
    }

    // Continue chain by default
    return true
  }

  /**
   * Check if errors contain critical issues
   */
  protected hasCriticalErrors(errors: ValidationError[]): boolean {
    return errors.some(error => error.severity === 'critical')
  }

  /**
   * Merge results from current and next handler
   */
  protected mergeResults(
    current: WeaponValidationHandlerResult,
    next: WeaponValidationHandlerResult
  ): WeaponValidationHandlerResult {
    return {
      handlerName: `${current.handlerName}+${next.handlerName}`,
      processed: current.processed || next.processed,
      errors: [...current.errors, ...next.errors],
      warnings: [...current.warnings, ...next.warnings],
      data: { ...current.data, ...next.data },
      executionTime: current.executionTime + next.executionTime,
      recommendations: [...current.recommendations, ...next.recommendations]
    }
  }

  /**
   * Create result for skipped handlers
   */
  protected createSkippedResult(executionTime: number): WeaponValidationHandlerResult {
    return {
      handlerName: this.handlerName,
      processed: false,
      errors: [],
      warnings: [],
      data: {},
      executionTime,
      recommendations: []
    }
  }

  /**
   * Create error result for failed validation
   */
  protected createErrorResult(executionTime: number, error: any): WeaponValidationHandlerResult {
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error'
    
    return {
      handlerName: this.handlerName,
      processed: false,
      errors: [{
        id: `${this.handlerName}-handler-error`,
        category: 'error',
        message: `Validation handler error: ${errorMessage}`,
        severity: 'critical',
        suggestedFix: 'Check validation handler configuration and input data'
      }],
      warnings: [],
      data: {},
      executionTime,
      recommendations: []
    }
  }

  /**
   * Helper method to create validation errors
   */
  protected createError(
    id: string,
    message: string,
    field?: string,
    severity: 'critical' | 'major' | 'minor' = 'major',
    suggestedFix?: string
  ): ValidationError {
    return {
      id,
      category: 'error',
      message,
      field,
      severity,
      suggestedFix
    }
  }

  /**
   * Helper method to create validation warnings
   */
  protected createWarning(
    id: string,
    message: string,
    field?: string,
    suggestedFix?: string
  ): ValidationError {
    return {
      id,
      category: 'warning',
      message,
      field,
      severity: 'minor',
      suggestedFix
    }
  }

  /**
   * Helper method to create informational messages
   */
  protected createInfo(
    id: string,
    message: string,
    field?: string
  ): ValidationError {
    return {
      id,
      category: 'info',
      message,
      field,
      severity: 'minor'
    }
  }

  /**
   * Extract weapons from equipment list
   */
  protected extractWeapons(equipment: any[]): any[] {
    return equipment.filter(item => this.isWeapon(item))
  }

  /**
   * Extract ammunition from equipment list
   */
  protected extractAmmunition(equipment: any[]): any[] {
    return equipment.filter(item => this.isAmmunition(item))
  }

  /**
   * Check if item is a weapon
   */
  protected isWeapon(item: any): boolean {
    if (!item || !item.item_name) return false

    // Check category-based classification
    const hasWeaponCategory = ['Energy Weapons', 'Ballistic Weapons', 'Missile Weapons', 'Artillery Weapons', 'Special Weapons']
      .some(category => item.category?.includes(category))

    // Check type-based classification
    const hasWeaponType = item.item_type === 'weapon' || item.type?.includes('weapon')

    // Check name-based classification
    const hasWeaponName = item.item_name?.match(/\b(Laser|PPC|AC\/|LRM|SRM|Gauss|Pulse|Cannon)\b/i)

    // Check property-based classification
    const hasWeaponProperties = item.heat !== undefined || item.damage !== undefined

    return hasWeaponCategory || hasWeaponType || hasWeaponName || hasWeaponProperties
  }

  /**
   * Check if item is ammunition
   */
  protected isAmmunition(item: any): boolean {
    if (!item || !item.item_name) return false

    return item.item_name?.toLowerCase().includes('ammo') ||
           item.ammo_type !== undefined ||
           item.shots !== undefined ||
           item.item_name?.match(/\b(ammo|ammunition)\b/i)
  }

  /**
   * Calculate total heat generation from weapons
   */
  protected calculateTotalHeat(weapons: any[]): number {
    return weapons.reduce((total, weapon) => total + (weapon.heat || 0), 0)
  }

  /**
   * Calculate total weight from equipment
   */
  protected calculateTotalWeight(equipment: any[]): number {
    return equipment.reduce((total, item) => total + (item.tonnage || 0), 0)
  }

  /**
   * Extract weapon type for ammunition matching
   */
  protected extractWeaponType(weaponName: string): string {
    if (!weaponName) return ''

    // Match common weapon patterns
    const patterns = [
      /AC\/(\d+)/i,
      /(Ultra AC)\/(\d+)/i,
      /(LB \d+-X AC)/i,
      /(LRM)-(\d+)/i,
      /(SRM)-(\d+)/i,
      /(Streak SRM)-(\d+)/i,
      /(Gauss Rifle)/i,
      /(Machine Gun)/i
    ]

    for (const pattern of patterns) {
      const match = weaponName.match(pattern)
      if (match) {
        return match[0]
      }
    }

    // Return the first word if no pattern matches
    return weaponName.split(' ')[0]
  }

  /**
   * Extract ammunition type for weapon matching
   */
  protected extractAmmoType(ammoName: string): string {
    if (!ammoName) return ''

    // Remove "Ammo" prefix/suffix and normalize
    return ammoName
      .replace(/\b(ammo|ammunition)\b/gi, '')
      .replace(/^\s*\(|\)\s*$/g, '')
      .trim()
  }

  /**
   * Check if ammunition is compatible with weapon
   */
  protected isAmmoCompatible(ammo: any, weaponType: string): boolean {
    if (!ammo || !weaponType) return false

    const ammoType = this.extractAmmoType(ammo.item_name)
    
    // Direct match
    if (ammoType === weaponType) return true

    // Pattern-based matching for common weapon types
    if (weaponType.includes('AC/') && ammoType.includes('AC')) return true
    if (weaponType.includes('LRM') && ammoType.includes('LRM')) return true
    if (weaponType.includes('SRM') && ammoType.includes('SRM')) return true
    if (weaponType.includes('Gauss') && ammoType.includes('Gauss')) return true
    if (weaponType.includes('Machine Gun') && ammoType.includes('Machine Gun')) return true

    return false
  }
}

/**
 * Handler Chain Builder
 * Utility class for building validation handler chains
 */
export class WeaponValidationChainBuilder {
  private handlers: WeaponValidationHandler[] = []

  /**
   * Add handler to the chain
   */
  addHandler(handler: WeaponValidationHandler): WeaponValidationChainBuilder {
    this.handlers.push(handler)
    return this
  }

  /**
   * Build the chain by linking handlers in priority order
   */
  build(): WeaponValidationHandler | null {
    if (this.handlers.length === 0) return null

    // Sort handlers by priority (highest first)
    const sortedHandlers = [...this.handlers].sort((a, b) => b.getPriority() - a.getPriority())

    // Link handlers together
    for (let i = 0; i < sortedHandlers.length - 1; i++) {
      sortedHandlers[i].setNext(sortedHandlers[i + 1])
    }

    return sortedHandlers[0]
  }

  /**
   * Get handlers in current chain
   */
  getHandlers(): WeaponValidationHandler[] {
    return [...this.handlers]
  }

  /**
   * Clear all handlers
   */
  clear(): WeaponValidationChainBuilder {
    this.handlers = []
    return this
  }
}

/**
 * Handler Factory
 * Creates handler instances based on type
 */
export class WeaponValidationHandlerFactory {
  private static handlerConstructors: Map<string, new () => WeaponValidationHandler> = new Map()

  /**
   * Register handler constructor
   */
  static registerHandler(name: string, constructor: new () => WeaponValidationHandler): void {
    this.handlerConstructors.set(name, constructor)
  }

  /**
   * Create handler by name
   */
  static createHandler(name: string): WeaponValidationHandler | null {
    const Constructor = this.handlerConstructors.get(name)
    return Constructor ? new Constructor() : null
  }

  /**
   * Get available handler names
   */
  static getAvailableHandlers(): string[] {
    return Array.from(this.handlerConstructors.keys())
  }

  /**
   * Create default handler chain
   */
  static createDefaultChain(): WeaponValidationHandler | null {
    const builder = new WeaponValidationChainBuilder()

    // Add handlers in order of registration
    const defaultHandlers = [
      'configuration',
      'tech_compatibility', 
      'ammo_balance',
      'placement',
      'balance',
      'optimization'
    ]

    for (const handlerName of defaultHandlers) {
      const handler = this.createHandler(handlerName)
      if (handler) {
        builder.addHandler(handler)
      }
    }

    return builder.build()
  }
}