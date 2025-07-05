/**
 * Armor Configuration Manager
 * Handles armor configuration, critical slot calculations, and construction rules
 */

import { ARMOR_SLOT_REQUIREMENTS, getArmorSlots } from '../../armorCalculations'
import { UnitConfiguration, StructureType, ArmorType } from '../UnitCriticalManagerTypes'

// Type-safe conversion functions
function armorTypeToString(armorType: ArmorType): string {
  return String(armorType);
}

function techBaseToString(techBase: string | undefined): string {
  return techBase || 'Inner Sphere';
}

export class ArmorConfigurationManager {
  private configuration: UnitConfiguration

  constructor(configuration: UnitConfiguration) {
    this.configuration = configuration
  }

  /**
   * Get critical slot requirements for armor type
   */
  getArmorCriticalSlots(armorType: ArmorType): number {
    try {
      return getArmorSlots(armorTypeToString(armorType), techBaseToString(this.configuration.techBase)) || 0
    } catch (error) {
      // Fallback for armor types not in the armor calculations
      const armorSlotMap: Record<ArmorType, number> = {
        'Standard': 0,
        'Ferro-Fibrous': 14,
        'Ferro-Fibrous (Clan)': 7,
        'Light Ferro-Fibrous': 7,
        'Heavy Ferro-Fibrous': 21,
        'Stealth': 12,
        'Reactive': 14,
        'Reflective': 10,
        'Hardened': 0  // Key fix - Hardened armor takes 0 slots
      }
      return armorSlotMap[armorType] || 0
    }
  }

  /**
   * Get critical slot requirements for structure type
   */
  getStructureCriticalSlots(structureType: StructureType): number {
    const structureSlotMap: Record<StructureType, number> = {
      'Standard': 0,
      'Endo Steel': 14,
      'Endo Steel (Clan)': 7,
      'Composite': 0,
      'Reinforced': 0,
      'Industrial': 0
    }
    return structureSlotMap[structureType] || 0
  }

  /**
   * Get maximum armor points for a location based on tonnage and internal structure
   */
  getMaxArmorPointsForLocation(location: string): number {
    const internalStructure = this.getInternalStructurePoints()
    const structurePoints = internalStructure[location] || 0
    
    // BattleTech rules: max armor = 2x internal structure points
    // Exception: Head can only have max 9 armor points
    if (location === 'HD') {
      return Math.min(9, structurePoints * 2)
    }
    
    return structurePoints * 2
  }

  /**
   * Get internal structure points for all locations
   */
  getInternalStructurePoints(): Record<string, number> {
    const tonnage = this.configuration.tonnage
    
    // Standard BattleMech internal structure distribution
    const head = 3
    const centerTorso = Math.floor(tonnage / 10) + 2
    const sideTorso = Math.floor(tonnage / 10)
    const arms = Math.floor(tonnage / 10)
    const legs = Math.floor(tonnage / 10) + 1

    return {
      'HD': head,
      'CT': centerTorso,
      'LT': sideTorso,
      'RT': sideTorso,
      'LA': arms,
      'RA': arms,
      'LL': legs,
      'RL': legs
    }
  }

  /**
   * Get maximum armor tonnage
   */
  getMaxArmorTonnage(): number {
    return Math.floor(this.configuration.tonnage / 2) + 1
  }

  /**
   * Get physical maximum armor tonnage (engine limitation)
   */
  getPhysicalMaxArmorTonnage(): number {
    const remainingTonnage = this.configuration.tonnage - this.getFixedWeight()
    return Math.max(0, remainingTonnage - 1) // Reserve 1 ton minimum for weapons/equipment
  }

  /**
   * Get maximum armor points possible
   */
  getMaxArmorPoints(): number {
    const locations = ['HD', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL']
    return locations.reduce((total, location) => {
      return total + this.getMaxArmorPointsForLocation(location)
    }, 0)
  }

  /**
   * Get fixed weight (engine, gyro, structure)
   */
  private getFixedWeight(): number {
    // This would need access to engine and gyro calculations
    // For now, return an estimate
    return Math.floor(this.configuration.tonnage * 0.5) // Rough estimate
  }

  /**
   * Enforce BattleTech armor construction rules
   */
  enforceArmorRules(config: UnitConfiguration): UnitConfiguration {
    const enforcedConfig = { ...config }
    
    // Enforce head armor maximum (9 points)
    if (enforcedConfig.armorAllocation.HD.front > 9) {
      enforcedConfig.armorAllocation.HD = { front: 9, rear: 0 }
    }
    
    // Enforce no rear armor on head, arms, legs
    const noRearLocations = ['HD', 'LA', 'RA', 'LL', 'RL']
    noRearLocations.forEach(location => {
      if (enforcedConfig.armorAllocation[location as keyof typeof enforcedConfig.armorAllocation].rear > 0) {
        enforcedConfig.armorAllocation[location as keyof typeof enforcedConfig.armorAllocation] = {
          ...enforcedConfig.armorAllocation[location as keyof typeof enforcedConfig.armorAllocation],
          rear: 0
        }
      }
    })
    
    // Enforce maximum armor points per location
    Object.keys(enforcedConfig.armorAllocation).forEach(location => {
      const maxArmor = this.getMaxArmorPointsForLocation(location)
      const currentArmor = enforcedConfig.armorAllocation[location as keyof typeof enforcedConfig.armorAllocation]
      const totalArmor = currentArmor.front + currentArmor.rear
      
      if (totalArmor > maxArmor) {
        // Reduce proportionally
        const ratio = maxArmor / totalArmor
        enforcedConfig.armorAllocation[location as keyof typeof enforcedConfig.armorAllocation] = {
          front: Math.floor(currentArmor.front * ratio),
          rear: Math.floor(currentArmor.rear * ratio)
        }
      }
    })
    
    return enforcedConfig
  }

  /**
   * Get allocated armor points
   */
  getAllocatedArmorPoints(): number {
    const allocation = this.configuration.armorAllocation
    return Object.values(allocation).reduce((total, locationArmor) => {
      return total + locationArmor.front + locationArmor.rear
    }, 0)
  }

  /**
   * Get armor efficiency (percentage of max armor used)
   */
  getArmorEfficiency(): number {
    const allocated = this.getAllocatedArmorPoints()
    const maximum = this.getMaxArmorPoints()
    return maximum > 0 ? (allocated / maximum) * 100 : 0
  }

  /**
   * Update configuration reference
   */
  updateConfiguration(newConfiguration: UnitConfiguration): void {
    this.configuration = newConfiguration
  }
}