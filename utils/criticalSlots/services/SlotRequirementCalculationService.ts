/**
 * Slot Requirement Calculation Service
 * Calculates critical slot requirements for equipment, systems, and special components
 * Uses Strategy pattern for different calculation approaches
 */

import { UnitConfiguration } from '../UnitCriticalManagerTypes'
import { ComponentConfiguration, TechBase } from '../../../types/componentConfiguration'

export interface SlotRequirements {
  total: number
  byLocation: {
    Head: number
    'Center Torso': number
    'Left Torso': number
    'Right Torso': number
    'Left Arm': number
    'Right Arm': number
    'Left Leg': number
    'Right Leg': number
  }
  byCategory: {
    systemComponents: number
    specialComponents: number
    equipment: number
    ammunition: number
    weapons: number
  }
  breakdown: {
    engine: number
    gyro: number
    cockpit: number
    actuators: number
    endoSteel: number
    ferroFibrous: number
    equipment: { name: string; slots: number; location: string }[]
  }
}

export interface SlotCalculationStrategy {
  calculateRequiredSlots(config: UnitConfiguration, equipment: any[]): SlotRequirements
  getName(): string
  getDescription(): string
}

/**
 * Standard BattleTech slot calculation strategy
 */
export class StandardSlotCalculationStrategy implements SlotCalculationStrategy {
  getName(): string {
    return 'Standard BattleTech'
  }

  getDescription(): string {
    return 'Standard BattleTech critical slot calculation rules'
  }

  calculateRequiredSlots(config: UnitConfiguration, equipment: any[]): SlotRequirements {
    const breakdown = this.calculateDetailedBreakdown(config, equipment)
    const byCategory = this.calculateCategoryBreakdown(breakdown)
    const byLocation = this.calculateLocationBreakdown(config, equipment, breakdown)
    
    return {
      total: Object.values(byLocation).reduce((sum, slots) => sum + slots, 0),
      byLocation,
      byCategory,
      breakdown
    }
  }

  private calculateDetailedBreakdown(config: UnitConfiguration, equipment: any[]) {
    return {
      engine: this.getEngineSlots(config.engineType),
      gyro: this.getGyroSlots(this.extractComponentType(config.gyroType)),
      cockpit: 1, // Standard cockpit always takes 1 slot
      actuators: this.getActuatorSlots(),
      endoSteel: this.getEndoSteelSlots(config),
      ferroFibrous: this.getFerroFibrousSlots(config),
      equipment: this.getEquipmentSlots(equipment)
    }
  }

  private calculateCategoryBreakdown(breakdown: any) {
    return {
      systemComponents: breakdown.engine + breakdown.gyro + breakdown.cockpit + breakdown.actuators,
      specialComponents: breakdown.endoSteel + breakdown.ferroFibrous,
      equipment: breakdown.equipment.reduce((sum: number, item: any) => sum + item.slots, 0),
      ammunition: breakdown.equipment.filter((item: any) => item.name.includes('Ammo')).reduce((sum: number, item: any) => sum + item.slots, 0),
      weapons: breakdown.equipment.filter((item: any) => !item.name.includes('Ammo')).reduce((sum: number, item: any) => sum + item.slots, 0)
    }
  }

  private calculateLocationBreakdown(config: UnitConfiguration, equipment: any[], breakdown: any) {
    // Simplified location distribution - in reality this would be more complex
    const totalEquipmentSlots = breakdown.equipment.reduce((sum: number, item: any) => sum + item.slots, 0)
    const specialSlots = breakdown.endoSteel + breakdown.ferroFibrous
    
    return {
      'Head': 1, // Cockpit
      'Center Torso': breakdown.engine + breakdown.gyro + Math.floor(specialSlots * 0.3),
      'Left Torso': Math.floor(totalEquipmentSlots * 0.2) + Math.floor(specialSlots * 0.2),
      'Right Torso': Math.floor(totalEquipmentSlots * 0.2) + Math.floor(specialSlots * 0.2),
      'Left Arm': 4 + Math.floor(totalEquipmentSlots * 0.15), // 4 actuators
      'Right Arm': 4 + Math.floor(totalEquipmentSlots * 0.15), // 4 actuators
      'Left Leg': 4 + Math.floor(totalEquipmentSlots * 0.1) + Math.floor(specialSlots * 0.15), // 4 actuators
      'Right Leg': 4 + Math.floor(totalEquipmentSlots * 0.1) + Math.floor(specialSlots * 0.15) // 4 actuators
    }
  }

  private extractComponentType(component: ComponentConfiguration | string): string {
    if (typeof component === 'string') return component
    return component.type
  }

  private getEngineSlots(engineType: string): number {
    if (engineType.includes('XL')) return 6 // XL engines take 6 slots (3 in each side torso)
    if (engineType.includes('Light')) return 4 // Light engines
    if (engineType.includes('Compact')) return 3 // Compact engines
    return 0 // Standard engines take 0 critical slots
  }

  private getGyroSlots(gyroType: string): number {
    if (gyroType.includes('XL')) return 6
    if (gyroType.includes('Compact')) return 2
    if (gyroType.includes('Heavy Duty')) return 4
    return 4 // Standard gyro
  }

  private getActuatorSlots(): number {
    return 16 // 4 actuators per arm (8) + 4 per leg (8) = 16 total
  }

  private getEndoSteelSlots(config: UnitConfiguration): number {
    const structureType = this.extractComponentType(config.structureType)
    if (structureType === 'Endo Steel') return 14
    if (structureType === 'Endo Steel (Clan)') return 7
    return 0
  }

  private getFerroFibrousSlots(config: UnitConfiguration): number {
    const armorType = this.extractComponentType(config.armorType)
    if (armorType === 'Ferro-Fibrous') return 14
    if (armorType === 'Ferro-Fibrous (Clan)') return 7
    if (armorType === 'Light Ferro-Fibrous') return 7
    if (armorType === 'Heavy Ferro-Fibrous') return 21
    if (armorType === 'Stealth') return 12
    if (armorType === 'Reactive') return 14
    if (armorType === 'Reflective') return 10
    return 0
  }

  private getEquipmentSlots(equipment: any[]): { name: string; slots: number; location: string }[] {
    return equipment.map(item => ({
      name: item.name || item.equipmentData?.name || 'Unknown',
      slots: (item.equipmentData?.criticals || 1) * (item.quantity || 1),
      location: item.location || 'Unassigned'
    }))
  }
}

/**
 * Optimized slot calculation strategy for competitive play
 */
export class OptimizedSlotCalculationStrategy implements SlotCalculationStrategy {
  getName(): string {
    return 'Optimized'
  }

  getDescription(): string {
    return 'Optimized slot calculation that minimizes wasted space'
  }

  calculateRequiredSlots(config: UnitConfiguration, equipment: any[]): SlotRequirements {
    // Use standard calculation as base
    const standard = new StandardSlotCalculationStrategy()
    const baseResult = standard.calculateRequiredSlots(config, equipment)
    
    // Apply optimizations
    const optimizedByLocation = this.optimizeLocationDistribution(baseResult.byLocation)
    const total = Object.values(optimizedByLocation).reduce((sum, slots) => sum + slots, 0)
    
    return {
      ...baseResult,
      total,
      byLocation: optimizedByLocation
    }
  }

  private optimizeLocationDistribution(baseDistribution: any) {
    // Redistribute slots to balance load across locations
    const totalSlots = Object.values(baseDistribution).reduce((sum: any, slots: any) => sum + slots, 0)
    const locationCount = Object.keys(baseDistribution).length
    const averageSlots = Math.floor(totalSlots / locationCount)
    const remainder = totalSlots % locationCount
    
    const optimized: any = {}
    const locations = Object.keys(baseDistribution)
    
    locations.forEach((location, index) => {
      optimized[location] = averageSlots + (index < remainder ? 1 : 0)
    })
    
    return optimized
  }
}

/**
 * Clan technology slot calculation strategy
 */
export class ClanSlotCalculationStrategy implements SlotCalculationStrategy {
  getName(): string {
    return 'Clan Technology'
  }

  getDescription(): string {
    return 'Clan technology slot calculation with different rules for special components'
  }

  calculateRequiredSlots(config: UnitConfiguration, equipment: any[]): SlotRequirements {
    // Use standard calculation but apply Clan-specific modifications
    const standard = new StandardSlotCalculationStrategy()
    const baseResult = standard.calculateRequiredSlots(config, equipment)
    
    // Apply Clan-specific slot reductions
    const clanBreakdown = this.applyClanModifications(baseResult.breakdown, config)
    const clanByCategory = this.recalculateCategoryBreakdown(clanBreakdown)
    
    return {
      ...baseResult,
      breakdown: clanBreakdown,
      byCategory: clanByCategory
    }
  }

  private applyClanModifications(breakdown: any, config: UnitConfiguration) {
    const modified = { ...breakdown }
    
    // Clan Endo Steel takes 7 slots instead of 14
    if (this.extractComponentType(config.structureType) === 'Endo Steel (Clan)') {
      modified.endoSteel = 7
    }
    
    // Clan Ferro-Fibrous takes 7 slots instead of 14
    if (this.extractComponentType(config.armorType) === 'Ferro-Fibrous (Clan)') {
      modified.ferroFibrous = 7
    }
    
    return modified
  }

  private recalculateCategoryBreakdown(breakdown: any) {
    return {
      systemComponents: breakdown.engine + breakdown.gyro + breakdown.cockpit + breakdown.actuators,
      specialComponents: breakdown.endoSteel + breakdown.ferroFibrous,
      equipment: breakdown.equipment.reduce((sum: number, item: any) => sum + item.slots, 0),
      ammunition: breakdown.equipment.filter((item: any) => item.name.includes('Ammo')).reduce((sum: number, item: any) => sum + item.slots, 0),
      weapons: breakdown.equipment.filter((item: any) => !item.name.includes('Ammo')).reduce((sum: number, item: any) => sum + item.slots, 0)
    }
  }

  private extractComponentType(component: ComponentConfiguration | string): string {
    if (typeof component === 'string') return component
    return component.type
  }
}

/**
 * Slot Requirement Calculation Service
 * Coordinates different calculation strategies
 */
export class SlotRequirementCalculationService {
  private strategies: Map<string, SlotCalculationStrategy> = new Map()
  private defaultStrategy: string = 'Standard BattleTech'

  constructor() {
    this.registerStrategy(new StandardSlotCalculationStrategy())
    this.registerStrategy(new OptimizedSlotCalculationStrategy())
    this.registerStrategy(new ClanSlotCalculationStrategy())
  }

  /**
   * Register a new calculation strategy
   */
  registerStrategy(strategy: SlotCalculationStrategy): void {
    this.strategies.set(strategy.getName(), strategy)
  }

  /**
   * Calculate slot requirements using specified strategy
   */
  calculateRequiredSlots(config: UnitConfiguration, equipment: any[], strategyName?: string): SlotRequirements {
    const strategy = this.getStrategy(strategyName || this.defaultStrategy)
    return strategy.calculateRequiredSlots(config, equipment)
  }

  /**
   * Calculate using the best strategy for the configuration
   */
  calculateOptimalRequiredSlots(config: UnitConfiguration, equipment: any[]): SlotRequirements {
    const techBase = this.extractTechBase(config)
    const strategyName = techBase === 'Clan' ? 'Clan Technology' : 'Standard BattleTech'
    
    return this.calculateRequiredSlots(config, equipment, strategyName)
  }

  /**
   * Compare results from different strategies
   */
  compareStrategies(config: UnitConfiguration, equipment: any[]): { [strategyName: string]: SlotRequirements } {
    const results: { [strategyName: string]: SlotRequirements } = {}
    
    for (const [name, strategy] of this.strategies) {
      results[name] = strategy.calculateRequiredSlots(config, equipment)
    }
    
    return results
  }

  /**
   * Get available strategies
   */
  getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys())
  }

  /**
   * Set default strategy
   */
  setDefaultStrategy(strategyName: string): void {
    if (this.strategies.has(strategyName)) {
      this.defaultStrategy = strategyName
    } else {
      throw new Error(`Strategy '${strategyName}' not found`)
    }
  }

  private getStrategy(strategyName: string): SlotCalculationStrategy {
    const strategy = this.strategies.get(strategyName)
    if (!strategy) {
      throw new Error(`Strategy '${strategyName}' not found`)
    }
    return strategy
  }

  private extractTechBase(config: UnitConfiguration): TechBase {
    // Extract tech base from configuration
    if (typeof config.techBase === 'string') {
      return config.techBase as TechBase
    }
    return 'Inner Sphere' // Default
  }
}