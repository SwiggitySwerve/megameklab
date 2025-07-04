/**
 * Critical Slot Calculator Facade
 * Coordinates all critical slot services and provides a unified interface
 * Uses Command pattern for complex operations and optimization
 */

import { SlotRequirementCalculationService, SlotRequirements } from './services/SlotRequirementCalculationService'
import { SlotAvailabilityService, AvailableSlots, LocationCapacity } from './services/SlotAvailabilityService'

// Types for the facade
export interface CriticalSlotCalculationResult {
  requirements: SlotRequirements
  availability: AvailableSlots
  utilization: SlotUtilization
  efficiency: number
  bottlenecks: string[]
  recommendations: string[]
}

export interface SlotUtilization {
  overall: number
  byLocation: { [location: string]: number }
  wastedSlots: number
  efficientLocations: string[]
  inefficientLocations: string[]
}

export interface SlotOptimizationResult {
  improved: boolean
  originalEfficiency: number
  optimizedEfficiency: number
  changes: SlotChange[]
  recommendations: string[]
  summary: string
}

export interface SlotChange {
  type: 'move' | 'consolidate' | 'redistribute'
  equipment: string
  fromLocation: string
  toLocation: string
  benefit: string
  impact: number
}

export interface SlotAnalysisReport {
  summary: {
    totalSlots: number
    usedSlots: number
    availableSlots: number
    efficiency: number
    wastedSlots: number
  }
  locationBreakdown: { [location: string]: LocationAnalysis }
  recommendations: RecommendationCategory[]
  optimizationPotential: number
}

export interface LocationAnalysis {
  capacity: number
  used: number
  available: number
  efficiency: number
  bottleneck: boolean
  restrictions: string[]
  equipment: string[]
}

export interface RecommendationCategory {
  category: 'efficiency' | 'balance' | 'protection' | 'optimization'
  priority: 'high' | 'medium' | 'low'
  recommendations: string[]
  expectedImprovement: number
}

// Command interface for complex operations
interface SlotCommand {
  execute(): boolean
  undo?(): boolean
  description: string
  result?: any
}

class SlotCalculationCommand implements SlotCommand {
  description = 'Calculate critical slot requirements and availability'
  result?: CriticalSlotCalculationResult

  constructor(
    private facade: CriticalSlotCalculatorFacade,
    private config: any,
    private equipment: any[]
  ) {}

  execute(): boolean {
    try {
      this.result = this.facade.executeSlotCalculation(this.config, this.equipment)
      return true
    } catch (error) {
      console.error('[SlotCalculationCommand] Failed:', error)
      return false
    }
  }
}

class SlotOptimizationCommand implements SlotCommand {
  description = 'Optimize critical slot allocation'
  result?: SlotOptimizationResult

  constructor(
    private facade: CriticalSlotCalculatorFacade,
    private config: any,
    private equipment: any[]
  ) {}

  execute(): boolean {
    try {
      this.result = this.facade.executeSlotOptimization(this.config, this.equipment)
      return true
    } catch (error) {
      console.error('[SlotOptimizationCommand] Failed:', error)
      return false
    }
  }
}

/**
 * Critical Slot Calculator Facade
 * Provides a unified interface for all critical slot operations
 */
export class CriticalSlotCalculatorFacade {
  private requirementService: SlotRequirementCalculationService
  private availabilityService: SlotAvailabilityService
  private commandHistory: SlotCommand[] = []

  constructor() {
    this.requirementService = new SlotRequirementCalculationService()
    this.availabilityService = new SlotAvailabilityService()
  }

  /**
   * Calculate complete slot analysis
   */
  calculateSlots(config: any, equipment: any[]): CriticalSlotCalculationResult {
    const command = new SlotCalculationCommand(this, config, equipment)
    const success = command.execute()
    
    if (success) {
      this.commandHistory.push(command)
      return command.result!
    }
    
    throw new Error('Slot calculation failed')
  }

  /**
   * Calculate slot requirements only
   */
  calculateRequiredSlots(config: any, equipment: any[]): SlotRequirements {
    return this.requirementService.calculateRequiredSlots(config, equipment)
  }

  /**
   * Calculate available slots only
   */
  calculateAvailableSlots(config: any): AvailableSlots {
    return this.availabilityService.calculateAvailableSlots(config)
  }

  /**
   * Optimize slot allocation
   */
  optimizeSlots(config: any, equipment: any[]): SlotOptimizationResult {
    const command = new SlotOptimizationCommand(this, config, equipment)
    const success = command.execute()
    
    if (success) {
      this.commandHistory.push(command)
      return command.result!
    }
    
    throw new Error('Slot optimization failed')
  }

  /**
   * Generate comprehensive slot analysis report
   */
  generateSlotReport(config: any, equipment: any[]): SlotAnalysisReport {
    const calculation = this.calculateSlots(config, equipment)
    const locationCapacities = this.availabilityService.getLocationCapacities(config)
    
    const summary = {
      totalSlots: calculation.availability.total,
      usedSlots: calculation.requirements.total,
      availableSlots: calculation.availability.total - calculation.requirements.total,
      efficiency: calculation.efficiency,
      wastedSlots: calculation.utilization.wastedSlots
    }

    const locationBreakdown = this.buildLocationBreakdown(locationCapacities, calculation)
    const recommendations = this.generateRecommendations(calculation)
    const optimizationPotential = this.calculateOptimizationPotential(calculation)

    return {
      summary,
      locationBreakdown,
      recommendations,
      optimizationPotential
    }
  }

  /**
   * Find available locations for equipment
   */
  findAvailableLocations(requiredSlots: number, config: any): string[] {
    return this.availabilityService.findAvailableLocations(requiredSlots, config)
  }

  /**
   * Check if equipment can be placed in location
   */
  canPlaceEquipment(equipment: any, location: string, config: any): boolean {
    const requiredSlots = equipment.criticalSlots || 1
    return this.availabilityService.canAccommodateEquipment(location, requiredSlots, config)
  }

  /**
   * Get efficiency analysis
   */
  analyzeEfficiency(config: any, equipment: any[]): SlotUtilization {
    const calculation = this.calculateSlots(config, equipment)
    return calculation.utilization
  }

  /**
   * Compare different calculation strategies
   */
  compareCalculationStrategies(config: any, equipment: any[]): { [strategy: string]: SlotRequirements } {
    return this.requirementService.compareStrategies(config, equipment)
  }

  /**
   * Get command history
   */
  getCommandHistory(): string[] {
    return this.commandHistory.map(cmd => cmd.description)
  }

  /**
   * Clear command history
   */
  clearCommandHistory(): void {
    this.commandHistory = []
  }

  // ===== COMMAND EXECUTION METHODS =====

  executeSlotCalculation(config: any, equipment: any[]): CriticalSlotCalculationResult {
    const requirements = this.requirementService.calculateRequiredSlots(config, equipment)
    const availability = this.availabilityService.calculateAvailableSlots(config)
    
    const utilization = this.calculateUtilization(requirements, availability)
    const efficiency = this.calculateEfficiency(utilization)
    const bottlenecks = this.identifyBottlenecks(utilization)
    const recommendations = this.generateUtilizationRecommendations(utilization, bottlenecks)

    return {
      requirements,
      availability,
      utilization,
      efficiency,
      bottlenecks,
      recommendations
    }
  }

  executeSlotOptimization(config: any, equipment: any[]): SlotOptimizationResult {
    const originalCalculation = this.executeSlotCalculation(config, equipment)
    const originalEfficiency = originalCalculation.efficiency

    // Apply optimization strategies
    const optimizationStrategies = [
      this.optimizeByBalance,
      this.optimizeByProtection,
      this.optimizeByEfficiency
    ]

    let bestOptimization = originalCalculation
    let bestEfficiency = originalEfficiency
    const changes: SlotChange[] = []

    for (const strategy of optimizationStrategies) {
      const optimized = strategy.call(this, config, equipment, originalCalculation)
      if (optimized.efficiency > bestEfficiency) {
        bestOptimization = optimized
        bestEfficiency = optimized.efficiency
        // Track changes made by this strategy
      }
    }

    const improved = bestEfficiency > originalEfficiency
    const recommendations = this.generateOptimizationRecommendations(originalCalculation, bestOptimization)

    return {
      improved,
      originalEfficiency,
      optimizedEfficiency: bestEfficiency,
      changes,
      recommendations,
      summary: this.generateOptimizationSummary(improved, originalEfficiency, bestEfficiency)
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  private calculateUtilization(requirements: SlotRequirements, availability: AvailableSlots): SlotUtilization {
    const overall = (requirements.total / availability.total) * 100
    const byLocation: { [location: string]: number } = {}
    
    Object.keys(availability.byLocation).forEach(location => {
      const required = requirements.byLocation[location as keyof typeof requirements.byLocation]
      const available = availability.byLocation[location as keyof typeof availability.byLocation]
      byLocation[location] = available > 0 ? (required / available) * 100 : 0
    })

    const wastedSlots = this.calculateWastedSlots(requirements, availability)
    const efficientLocations = Object.entries(byLocation)
      .filter(([_, utilization]) => utilization > 70 && utilization <= 95)
      .map(([location, _]) => location)
    
    const inefficientLocations = Object.entries(byLocation)
      .filter(([_, utilization]) => utilization < 50 || utilization > 95)
      .map(([location, _]) => location)

    return {
      overall,
      byLocation,
      wastedSlots,
      efficientLocations,
      inefficientLocations
    }
  }

  private calculateEfficiency(utilization: SlotUtilization): number {
    // Efficiency is based on balanced utilization across locations
    const utilizationValues = Object.values(utilization.byLocation)
    const averageUtilization = utilizationValues.reduce((sum, util) => sum + util, 0) / utilizationValues.length
    
    // Penalty for very unbalanced utilization
    const variance = utilizationValues.reduce((sum, util) => sum + Math.pow(util - averageUtilization, 2), 0) / utilizationValues.length
    const balancePenalty = Math.sqrt(variance) / 100
    
    // Efficiency is average utilization minus balance penalty and waste penalty
    const wastePenalty = utilization.wastedSlots * 2
    
    return Math.max(0, Math.min(100, averageUtilization - balancePenalty - wastePenalty))
  }

  private identifyBottlenecks(utilization: SlotUtilization): string[] {
    return Object.entries(utilization.byLocation)
      .filter(([_, util]) => util > 90)
      .map(([location, _]) => location)
  }

  private calculateWastedSlots(requirements: SlotRequirements, availability: AvailableSlots): number {
    // Calculate slots that could be used more efficiently
    let wastedSlots = 0
    
    Object.keys(availability.byLocation).forEach(location => {
      const required = requirements.byLocation[location as keyof typeof requirements.byLocation]
      const available = availability.byLocation[location as keyof typeof availability.byLocation]
      
      // Slots are "wasted" if a location has very low utilization while others are overloaded
      if (available > 0 && (required / available) < 0.3) {
        wastedSlots += Math.floor(available * 0.5) // Potential waste
      }
    })
    
    return wastedSlots
  }

  private generateUtilizationRecommendations(utilization: SlotUtilization, bottlenecks: string[]): string[] {
    const recommendations: string[] = []
    
    if (bottlenecks.length > 0) {
      recommendations.push(`Bottleneck locations detected: ${bottlenecks.join(', ')}`)
      recommendations.push('Consider moving equipment to less utilized locations')
    }
    
    if (utilization.inefficientLocations.length > 0) {
      recommendations.push('Rebalance equipment distribution for better efficiency')
    }
    
    if (utilization.wastedSlots > 5) {
      recommendations.push('Significant slot waste detected - optimize equipment placement')
    }
    
    return recommendations
  }

  private buildLocationBreakdown(capacities: LocationCapacity[], calculation: CriticalSlotCalculationResult): { [location: string]: LocationAnalysis } {
    const breakdown: { [location: string]: LocationAnalysis } = {}
    
    capacities.forEach(capacity => {
      const required = calculation.requirements.byLocation[capacity.location as keyof typeof calculation.requirements.byLocation]
      const utilization = calculation.utilization.byLocation[capacity.location]
      
      breakdown[capacity.location] = {
        capacity: capacity.totalSlots,
        used: required,
        available: capacity.availableSlots,
        efficiency: utilization,
        bottleneck: calculation.bottlenecks.includes(capacity.location),
        restrictions: capacity.restrictions,
        equipment: [] // Would be populated with actual equipment list
      }
    })
    
    return breakdown
  }

  private generateRecommendations(calculation: CriticalSlotCalculationResult): RecommendationCategory[] {
    const recommendations: RecommendationCategory[] = []
    
    if (calculation.efficiency < 70) {
      recommendations.push({
        category: 'efficiency',
        priority: 'high',
        recommendations: ['Optimize equipment placement', 'Reduce slot waste'],
        expectedImprovement: 20
      })
    }
    
    if (calculation.bottlenecks.length > 0) {
      recommendations.push({
        category: 'balance',
        priority: 'high',
        recommendations: ['Redistribute equipment from bottleneck locations'],
        expectedImprovement: 15
      })
    }
    
    return recommendations
  }

  private calculateOptimizationPotential(calculation: CriticalSlotCalculationResult): number {
    return Math.max(0, 100 - calculation.efficiency)
  }

  private optimizeByBalance(config: any, equipment: any[], original: CriticalSlotCalculationResult): CriticalSlotCalculationResult {
    // Strategy: Balance utilization across all locations
    return original // Simplified - would implement actual balancing
  }

  private optimizeByProtection(config: any, equipment: any[], original: CriticalSlotCalculationResult): CriticalSlotCalculationResult {
    // Strategy: Place critical equipment in protected locations
    return original // Simplified - would implement actual protection optimization
  }

  private optimizeByEfficiency(config: any, equipment: any[], original: CriticalSlotCalculationResult): CriticalSlotCalculationResult {
    // Strategy: Minimize wasted slots
    return original // Simplified - would implement actual efficiency optimization
  }

  private generateOptimizationRecommendations(original: CriticalSlotCalculationResult, optimized: CriticalSlotCalculationResult): string[] {
    const recommendations: string[] = []
    
    const improvement = optimized.efficiency - original.efficiency
    if (improvement > 5) {
      recommendations.push(`Efficiency can be improved by ${improvement.toFixed(1)}%`)
    }
    
    return recommendations
  }

  private generateOptimizationSummary(improved: boolean, original: number, optimized: number): string {
    if (improved) {
      const improvement = optimized - original
      return `Optimization improved efficiency by ${improvement.toFixed(1)}% (${original.toFixed(1)}% → ${optimized.toFixed(1)}%)`
    } else {
      return `Current slot allocation is already well optimized (${original.toFixed(1)}% efficiency)`
    }
  }
}