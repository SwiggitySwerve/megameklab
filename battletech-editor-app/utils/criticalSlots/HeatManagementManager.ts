/**
 * Heat Management Manager
 * Handles all heat generation, dissipation, and heat sink calculations
 * Extracted from UnitCriticalManager.ts for better organization
 */

import { EquipmentAllocation } from './CriticalSlot'
import { UnitConfiguration, HeatSinkType } from './UnitCriticalManagerTypes'
import { JumpJetType } from '../jumpJetCalculations'

export class HeatManagementManager {
  private configuration: UnitConfiguration
  private unallocatedEquipment: EquipmentAllocation[]

  constructor(
    configuration: UnitConfiguration,
    unallocatedEquipment: EquipmentAllocation[]
  ) {
    this.configuration = configuration
    this.unallocatedEquipment = unallocatedEquipment
  }

  /**
   * Get total heat dissipation capacity
   */
  getHeatDissipation(): number {
    const heatSinkType = this.getHeatSinkTypeString()
    const externalHeatSinks = this.configuration.externalHeatSinks
    const heatSinkEfficiency = this.getHeatSinkEfficiency()
    
    // Base heat sinks (10 for most mechs, varies by engine)
    const baseHeatSinks = this.getBaseHeatSinks()
    
    // Calculate total heat dissipation
    const totalHeatSinks = baseHeatSinks + externalHeatSinks
    const totalDissipation = totalHeatSinks * heatSinkEfficiency
    
    if (process.env.NODE_ENV === 'test') {
      console.log(`[DEBUG] Heat dissipation calculation: heatSinkType=${heatSinkType}, efficiency=${heatSinkEfficiency}, baseHeatSinks=${baseHeatSinks}, externalHeatSinks=${externalHeatSinks}, totalHeatSinks=${totalHeatSinks}, totalDissipation=${totalDissipation}`);
    }
    
    return totalDissipation
  }

  /**
   * Get total heat generation from all equipment
   */
  getHeatGeneration(): number {
    let totalHeat = 0

    // Heat from unallocated equipment
    this.unallocatedEquipment.forEach(equipment => {
      if (equipment.equipmentData.heat) {
        totalHeat += equipment.equipmentData.heat
      }
    })

    // Heat from jump jets (if any)
    if (this.configuration.jumpMP > 0) {
      totalHeat += this.configuration.jumpMP // 1 heat per jump MP
    }

    return totalHeat
  }

  /**
   * Get heat sink efficiency based on type
   */
  private getHeatSinkEfficiency(): number {
    const heatSinkType = this.getHeatSinkTypeString()
    
    if (typeof heatSinkType === 'string' && heatSinkType.toLowerCase().includes('double')) {
      return 2 // All double heat sinks dissipate 2 heat each
    }
    switch (heatSinkType) {
      case 'Single':
        return 1 // Single heat sinks dissipate 1 heat each
      case 'Compact':
        return 1 // Compact heat sinks dissipate 1 heat each
      default:
        return 1
    }
  }

  /**
   * Get base heat sinks from engine
   */
  private getBaseHeatSinks(): number {
    const engineRating = this.configuration.engineRating
    
    // Standard BattleTech rule: base heat sinks = engine rating / 25
    const baseInternalHeatSinks = Math.floor(engineRating / 25)
    
    // Minimum of 10 internal heat sinks
    return Math.max(10, baseInternalHeatSinks)
  }

  /**
   * Get heat sink type as string
   */
  private getHeatSinkTypeString(): HeatSinkType {
    return typeof this.configuration.heatSinkType === 'string' 
      ? this.configuration.heatSinkType 
      : (this.configuration.heatSinkType as any).type
  }

  /**
   * Get jump jet type as string
   */
  private getJumpJetTypeString(): JumpJetType {
    return typeof this.configuration.jumpJetType === 'string' 
      ? this.configuration.jumpJetType 
      : (this.configuration.jumpJetType as any).type
  }

  /**
   * Update configuration reference
   */
  updateConfiguration(configuration: UnitConfiguration): void {
    this.configuration = configuration
  }

  /**
   * Update unallocated equipment reference
   */
  updateUnallocatedEquipment(unallocatedEquipment: EquipmentAllocation[]): void {
    this.unallocatedEquipment = unallocatedEquipment
  }
} 