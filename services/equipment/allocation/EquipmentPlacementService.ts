/**
 * Equipment Placement Service
 * Handles core equipment placement operations and slot management
 */

import { UnitConfiguration } from '../../utils/criticalSlots/UnitCriticalManager'
import { 
  EquipmentPlacement, 
  PlacementSuggestion, 
  PlacementValidation,
  AlternativePlacement,
  PlacementPreferences,
  EquipmentConstraints,
  AddEquipmentResult,
  RemoveEquipmentResult,
  MoveEquipmentResult,
  EquipmentImpact,
  PlacementError,
  PlacementWarning
} from '../types/EquipmentAllocationTypes'

export class EquipmentPlacementService {
  /**
   * Find optimal placement for equipment
   */
  findOptimalPlacement(
    equipment: any, 
    config: UnitConfiguration, 
    existingAllocations: EquipmentPlacement[]
  ): PlacementSuggestion[] {
    const suggestions: PlacementSuggestion[] = []
    const allowedLocations = this.getEquipmentConstraints(equipment).allowedLocations
    
    for (const location of allowedLocations) {
      const slots = this.findAvailableSlots(location, equipment, existingAllocations, config)
      
      if (slots.length >= equipment.criticalSlots) {
        const score = this.calculatePlacementScore(equipment, location, config, existingAllocations)
        const reasoning = this.generatePlacementReasoning(equipment, location, score)
        const tradeoffs = this.identifyTradeoffs(equipment, location, config)
        const alternatives = this.generateAlternatives(equipment, location, config)
        
        suggestions.push({
          location,
          slots: slots.slice(0, equipment.criticalSlots),
          score,
          reasoning,
          tradeoffs,
          alternatives
        })
      }
    }
    
    return suggestions.sort((a, b) => b.score - a.score)
  }

  /**
   * Validate equipment placement at specific location
   */
  validatePlacement(equipment: any, location: string, config: UnitConfiguration): PlacementValidation {
    const errors: PlacementError[] = []
    const warnings: PlacementWarning[] = []
    const restrictions: string[] = []
    const suggestions: string[] = []
    
    // Check location restrictions
    const constraints = this.getEquipmentConstraints(equipment)
    if (!constraints.allowedLocations.includes(location)) {
      errors.push({
        type: 'location_invalid',
        message: `${equipment.name} cannot be mounted in ${location}`,
        severity: 'critical',
        suggestedFix: `Try placing in: ${constraints.allowedLocations.join(', ')}`
      })
    }
    
    // Check weight restrictions
    if (equipment.tonnage > config.tonnage / 10) {
      errors.push({
        type: 'weight_exceeded',
        message: `Equipment too heavy for ${location}`,
        severity: 'major',
        suggestedFix: 'Consider a lighter alternative or different location'
      })
    }
    
    // Check tech level compatibility
    if (equipment.techBase && equipment.techBase !== config.techBase) {
      warnings.push({
        type: 'tech_level',
        message: `Tech base mismatch: ${equipment.techBase} vs ${config.techBase}`,
        recommendation: 'Consider using appropriate tech base equipment',
        impact: 'medium'
      })
    }
    
    // Add suggestions for optimal placement
    if (equipment.heatGeneration > 0 && location === 'Head') {
      warnings.push({
        type: 'heat_concern',
        message: 'Heat-generating equipment in head increases pilot risk',
        recommendation: 'Consider torso or arm placement',
        impact: 'low'
      })
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      restrictions,
      suggestions
    }
  }

  /**
   * Suggest alternative placements
   */
  suggestAlternativePlacements(equipment: any, config: UnitConfiguration): AlternativePlacement[] {
    const alternatives: AlternativePlacement[] = []
    const constraints = this.getEquipmentConstraints(equipment)
    
    for (const location of constraints.allowedLocations) {
      const pros = this.getLocationPros(equipment, location)
      const cons = this.getLocationCons(equipment, location)
      const score = this.calculatePlacementScore(equipment, location, config, [])
      
      alternatives.push({
        location,
        slots: [], // Would be calculated when actually placing
        pros,
        cons,
        score
      })
    }
    
    return alternatives.sort((a, b) => b.score - a.score)
  }

  /**
   * Add equipment to unit
   */
  addEquipment(
    equipment: any, 
    config: UnitConfiguration, 
    preferences: PlacementPreferences
  ): AddEquipmentResult {
    const suggestions = this.findOptimalPlacement(equipment, config, [])
    let placement: EquipmentPlacement | undefined
    const warnings: string[] = []
    
    // Apply preferences to find best placement
    const filteredSuggestions = this.applyPreferences(suggestions, preferences)
    
    if (filteredSuggestions.length > 0) {
      const bestSuggestion = filteredSuggestions[0]
      placement = {
        equipmentId: this.generateEquipmentId(),
        equipment,
        location: bestSuggestion.location,
        slots: bestSuggestion.slots,
        isFixed: false,
        isValid: true,
        constraints: this.getEquipmentConstraints(equipment),
        conflicts: []
      }
    } else {
      warnings.push('No valid placement found with current preferences')
    }
    
    return {
      success: !!placement,
      placement,
      alternatives: this.suggestAlternativePlacements(equipment, config),
      warnings,
      impact: this.calculateEquipmentImpact(equipment)
    }
  }

  /**
   * Remove equipment from unit
   */
  removeEquipment(equipmentId: string, config: UnitConfiguration): RemoveEquipmentResult {
    // Implementation would remove equipment and return freed slots
    return {
      success: true,
      freedSlots: { location: '', slots: [] }, // Would be calculated
      impact: this.calculateEquipmentImpact({}), // Would use actual equipment
      suggestions: []
    }
  }

  /**
   * Move equipment between locations
   */
  moveEquipment(
    equipmentId: string, 
    fromLocation: string, 
    toLocation: string, 
    config: UnitConfiguration
  ): MoveEquipmentResult {
    // Implementation would validate move and update placement
    return {
      success: true,
      warnings: [],
      impact: this.calculateEquipmentImpact({})
    }
  }

  /**
   * Get equipment constraints
   */
  getEquipmentConstraints(equipment: any): EquipmentConstraints {
    const constraints: EquipmentConstraints = {
      allowedLocations: ['Head', 'Center Torso', 'Left Torso', 'Right Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg'],
      forbiddenLocations: [],
      requiresCASE: false,
      requiresArtemis: false,
      minTonnageLocation: 0,
      maxTonnageLocation: 100,
      heatGeneration: equipment.heatGeneration || 0,
      specialRules: []
    }
    
    // Apply equipment-specific rules
    if (equipment.type === 'weapon') {
      if (equipment.ammunition) {
        constraints.requiresCASE = true
      }
      if (equipment.name?.includes('LRM') || equipment.name?.includes('SRM')) {
        constraints.allowedLocations = constraints.allowedLocations.filter(loc => loc !== 'Head')
      }
    }
    
    if (equipment.type === 'ammunition') {
      constraints.requiresCASE = true
      constraints.forbiddenLocations = ['Head']
    }
    
    if (equipment.type === 'jumpjet') {
      constraints.allowedLocations = ['Center Torso', 'Left Leg', 'Right Leg']
    }
    
    return constraints
  }

  // ===== PRIVATE HELPER METHODS =====

  private findAvailableSlots(
    location: string, 
    equipment: any, 
    existingAllocations: EquipmentPlacement[], 
    config: UnitConfiguration
  ): number[] {
    // Implementation would find available slots in location
    // Return array of available slot indices
    return [0, 1, 2, 3] // Placeholder
  }

  private calculatePlacementScore(
    equipment: any, 
    location: string, 
    config: UnitConfiguration, 
    existingAllocations: EquipmentPlacement[]
  ): number {
    let score = 50 // Base score
    
    // Factor in protection (center torso is most protected)
    if (location === 'Center Torso') score += 20
    else if (location.includes('Torso')) score += 10
    else if (location.includes('Arm')) score += 5
    
    // Factor in balance
    const leftWeight = this.getLocationWeight('Left', existingAllocations)
    const rightWeight = this.getLocationWeight('Right', existingAllocations)
    if (location.includes('Left') && rightWeight > leftWeight) score += 15
    if (location.includes('Right') && leftWeight > rightWeight) score += 15
    
    // Factor in heat for heat-generating equipment
    if (equipment.heatGeneration > 0 && location === 'Head') score -= 20
    
    return Math.max(0, Math.min(100, score))
  }

  private generatePlacementReasoning(equipment: any, location: string, score: number): string[] {
    const reasoning: string[] = []
    
    if (score > 80) reasoning.push('Optimal placement with excellent protection and balance')
    else if (score > 60) reasoning.push('Good placement with adequate protection')
    else if (score > 40) reasoning.push('Acceptable placement with some trade-offs')
    else reasoning.push('Suboptimal placement, consider alternatives')
    
    if (location === 'Center Torso') reasoning.push('Maximum structural protection')
    if (location.includes('Arm')) reasoning.push('Easy to target but maintains mobility')
    
    return reasoning
  }

  private identifyTradeoffs(equipment: any, location: string, config: UnitConfiguration): string[] {
    const tradeoffs: string[] = []
    
    if (location === 'Head') {
      tradeoffs.push('Higher pilot risk but central placement')
    }
    
    if (location.includes('Arm')) {
      tradeoffs.push('More vulnerable to damage but maintains weapon mobility')
    }
    
    if (location.includes('Leg')) {
      tradeoffs.push('Protected by armor but affects mobility if damaged')
    }
    
    return tradeoffs
  }

  private generateAlternatives(equipment: any, location: string, config: UnitConfiguration): AlternativePlacement[] {
    // Generate alternative placements (simplified)
    return []
  }

  private getLocationPros(equipment: any, location: string): string[] {
    const pros: string[] = []
    
    if (location === 'Center Torso') pros.push('Maximum protection', 'Central location')
    if (location.includes('Arm')) pros.push('Weapon mobility', 'Easy maintenance access')
    if (location.includes('Torso')) pros.push('Good protection', 'Balanced placement')
    
    return pros
  }

  private getLocationCons(equipment: any, location: string): string[] {
    const cons: string[] = []
    
    if (location === 'Head') cons.push('Pilot risk', 'Limited space')
    if (location.includes('Arm')) cons.push('Vulnerable to targeting', 'Actuator interference')
    if (location.includes('Leg')) cons.push('Mobility impact if damaged')
    
    return cons
  }

  private applyPreferences(
    suggestions: PlacementSuggestion[], 
    preferences: PlacementPreferences
  ): PlacementSuggestion[] {
    return suggestions.filter(suggestion => {
      if (preferences.avoidLocations.includes(suggestion.location)) return false
      if (preferences.preferredLocations.length > 0 && 
          !preferences.preferredLocations.includes(suggestion.location)) return false
      return true
    }).sort((a, b) => {
      // Boost score for preferred locations
      let scoreA = a.score
      let scoreB = b.score
      
      if (preferences.preferredLocations.includes(a.location)) scoreA += 20
      if (preferences.preferredLocations.includes(b.location)) scoreB += 20
      
      return scoreB - scoreA
    })
  }

  private getLocationWeight(side: 'Left' | 'Right', allocations: EquipmentPlacement[]): number {
    return allocations
      .filter(alloc => alloc.location.includes(side))
      .reduce((total, alloc) => total + (alloc.equipment.tonnage || 0), 0)
  }

  private calculateEquipmentImpact(equipment: any): EquipmentImpact {
    return {
      weight: equipment.tonnage || 0,
      heat: equipment.heatGeneration || 0,
      firepower: equipment.damage || 0,
      balance: 0, // Would be calculated based on placement
      efficiency: 0 // Would be calculated based on placement
    }
  }

  private generateEquipmentId(): string {
    return `equipment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}