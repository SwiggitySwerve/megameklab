/**
 * Critical Slot Calculator - Modular calculation system for critical slot usage
 * Provides transparent, accurate slot calculations separated by component type
 */

import { UnitConfiguration } from './UnitCriticalManager'
import { SystemComponentRules, EngineType, GyroType } from './SystemComponentRules'
import { CriticalSection } from './CriticalSection'
import { EquipmentAllocation, EquipmentObject } from './CriticalSlot'
import { ARMOR_SLOT_REQUIREMENTS, getArmorSlots } from '../armorCalculations'

// ===== INTERFACES =====

/**
 * Structural component slots (configuration-driven)
 */
export interface StructuralSlots {
  fixedComponents: number     // Cockpit, life support, sensors, actuators (31 base)
  systemComponents: number    // Engine + gyro (varies by config)
  specialComponents: number   // Endo steel, ferro-fibrous, jump jets
  total: number
}

/**
 * Equipment component slots (user-driven)
 */
export interface EquipmentSlots {
  allocated: number           // Equipment placed in critical slots
  unallocated: number        // Equipment waiting to be placed
  total: number
}

/**
 * Complete critical slot breakdown with full transparency
 */
export interface CriticalSlotBreakdown {
  // Structural components (configuration-driven)
  structural: StructuralSlots
  
  // User equipment
  equipment: EquipmentSlots
  
  // Overall calculations
  totals: {
    used: number               // structural.total + equipment.allocated
    capacity: number           // Total available (78 for BattleMech)
    remaining: number          // capacity - used
    equipmentBurden: number    // used + equipment.unallocated (projection)
    overCapacity: number       // Math.max(0, equipmentBurden - capacity)
  }
  
  // Debugging information
  debug?: {
    fixedBreakdown: FixedComponentBreakdown
    systemBreakdown: SystemComponentBreakdown
    specialBreakdown: SpecialComponentBreakdown
  }
}

/**
 * Detailed breakdown of fixed components
 */
export interface FixedComponentBreakdown {
  head: {
    cockpit: number           // 1 slot
    lifeSupportSlots: number  // 2 slots
    sensorSlots: number       // 2 slots
    total: number            // 5 slots
  }
  arms: {
    shoulderSlots: number     // 2 slots (1 per arm)
    upperArmSlots: number     // 2 slots (1 per arm)
    lowerArmSlots: number     // 0 slots (removable, so not counted in base)
    handSlots: number         // 0 slots (removable, so not counted in base)
    total: number            // 4 slots
  }
  legs: {
    hipSlots: number          // 2 slots (1 per leg)
    upperLegSlots: number     // 2 slots (1 per leg)
    lowerLegSlots: number     // 2 slots (1 per leg)
    footSlots: number         // 2 slots (1 per leg)
    total: number            // 8 slots
  }
  total: number              // 17 slots base (minimum actuators)
}

/**
 * System component breakdown (engine + gyro)
 */
export interface SystemComponentBreakdown {
  engine: {
    centerTorso: number
    leftTorso: number
    rightTorso: number
    total: number
  }
  gyro: {
    centerTorso: number
    total: number
  }
  total: number
}

/**
 * Special component breakdown (Endo Steel, Ferro-Fibrous, Jump Jets)
 */
export interface SpecialComponentBreakdown {
  structure: {
    type: string
    slots: number
  }
  armor: {
    type: string
    slots: number
  }
  jumpJets: {
    type: string
    count: number
    slots: number
  }
  total: number
}

// ===== CALCULATOR SERVICE =====

export class CriticalSlotCalculator {
  
  /**
   * Calculate structural component slots based on configuration
   */
  static calculateStructuralSlots(config: UnitConfiguration): StructuralSlots {
    const fixedSlots = this.calculateFixedComponentSlots(config)
    const systemSlots = this.calculateSystemComponentSlots(config)
    const specialSlots = this.calculateSpecialComponentSlots(config)
    
    return {
      fixedComponents: fixedSlots,
      systemComponents: systemSlots,
      specialComponents: specialSlots,
      total: fixedSlots + systemSlots + specialSlots
    }
  }
  
  /**
   * Calculate equipment slots from sections and unallocated pool
   */
  static calculateEquipmentSlots(
    sections: Map<string, CriticalSection>, 
    unallocatedEquipment: EquipmentAllocation[]
  ): EquipmentSlots {
    let allocatedSlots = 0
    let unallocatedSlots = 0
    
    // Count allocated equipment slots (exclude system/special components)
    sections.forEach(section => {
      section.getAllEquipment().forEach(allocation => {
        if (this.isUserEquipment(allocation.equipmentData)) {
          allocatedSlots += allocation.occupiedSlots.length
        }
      })
    })
    
    // Count unallocated equipment slots
    unallocatedEquipment.forEach(allocation => {
      if (this.isUserEquipment(allocation.equipmentData)) {
        unallocatedSlots += allocation.equipmentData.requiredSlots || 1
      }
    })
    
    return {
      allocated: allocatedSlots,
      unallocated: unallocatedSlots,
      total: allocatedSlots + unallocatedSlots
    }
  }
  
  /**
   * Get complete critical slot breakdown for a unit
   */
  static getCompleteBreakdown(
    config: UnitConfiguration,
    sections: Map<string, CriticalSection>,
    unallocatedEquipment: EquipmentAllocation[]
  ): CriticalSlotBreakdown {
    const structural = this.calculateStructuralSlots(config)
    const equipment = this.calculateEquipmentSlots(sections, unallocatedEquipment)
    
    const capacity = 78 // Standard BattleMech total
    const used = structural.total + equipment.allocated
    const remaining = Math.max(0, capacity - used)
    const equipmentBurden = used + equipment.unallocated
    const overCapacity = Math.max(0, equipmentBurden - capacity)
    
    return {
      structural,
      equipment,
      totals: {
        used,
        capacity,
        remaining,
        equipmentBurden,
        overCapacity
      },
      debug: {
        fixedBreakdown: this.calculateFixedComponentBreakdown(config),
        systemBreakdown: this.calculateSystemComponentBreakdown(config),
        specialBreakdown: this.calculateSpecialComponentBreakdown(config)
      }
    }
  }
  
  // ===== PRIVATE CALCULATION METHODS =====
  
  /**
   * Calculate fixed component slots (cockpit, life support, sensors, actuators)
   */
  private static calculateFixedComponentSlots(config: UnitConfiguration): number {
    // Head: Cockpit (1) + Life Support (2) + Sensors (2) = 5 slots
    const headSlots = 5
    
    // Arms: Shoulder (2) + Upper Arm (2) = 4 slots (Lower Arm + Hand are removable)
    const armSlots = 4
    
    // Legs: Hip (2) + Upper Leg (2) + Lower Leg (2) + Foot (2) = 8 slots
    const legSlots = 8
    
    return headSlots + armSlots + legSlots // 17 slots total
  }
  
  /**
   * Calculate system component slots (engine + gyro)
   */
  private static calculateSystemComponentSlots(config: UnitConfiguration): number {
    const systemAllocation = SystemComponentRules.getCompleteSystemAllocation(
      config.engineType,
      config.gyroType
    )
    
    // Engine slots
    const engineSlots = systemAllocation.engine.centerTorso.length +
                       systemAllocation.engine.leftTorso.length +
                       systemAllocation.engine.rightTorso.length
    
    // Gyro slots
    const gyroSlots = systemAllocation.gyro.centerTorso.length
    
    return engineSlots + gyroSlots
  }
  
  /**
   * Calculate special component slots (Endo Steel, Ferro-Fibrous, Jump Jets)
   */
  private static calculateSpecialComponentSlots(config: UnitConfiguration): number {
    let specialSlots = 0
    
    // Structure component slots
    specialSlots += this.getStructureCriticalSlots(config.structureType)
    
    // Armor component slots
    specialSlots += this.getArmorCriticalSlots(config.armorType, config.techBase)
    
    // Jump jet slots
    specialSlots += config.jumpMP || 0
    
    return specialSlots
  }
  
  /**
   * Get detailed fixed component breakdown for debugging
   */
  private static calculateFixedComponentBreakdown(config: UnitConfiguration): FixedComponentBreakdown {
    return {
      head: {
        cockpit: 1,
        lifeSupportSlots: 2,
        sensorSlots: 2,
        total: 5
      },
      arms: {
        shoulderSlots: 2,      // 1 per arm × 2 arms
        upperArmSlots: 2,      // 1 per arm × 2 arms
        lowerArmSlots: 0,      // Removable, not counted in base
        handSlots: 0,          // Removable, not counted in base
        total: 4
      },
      legs: {
        hipSlots: 2,           // 1 per leg × 2 legs
        upperLegSlots: 2,      // 1 per leg × 2 legs
        lowerLegSlots: 2,      // 1 per leg × 2 legs
        footSlots: 2,          // 1 per leg × 2 legs
        total: 8
      },
      total: 17 // 5 + 4 + 8
    }
  }
  
  /**
   * Get detailed system component breakdown for debugging
   */
  private static calculateSystemComponentBreakdown(config: UnitConfiguration): SystemComponentBreakdown {
    const systemAllocation = SystemComponentRules.getCompleteSystemAllocation(
      config.engineType,
      config.gyroType
    )
    
    const engineSlots = {
      centerTorso: systemAllocation.engine.centerTorso.length,
      leftTorso: systemAllocation.engine.leftTorso.length,
      rightTorso: systemAllocation.engine.rightTorso.length,
      total: systemAllocation.engine.centerTorso.length +
             systemAllocation.engine.leftTorso.length +
             systemAllocation.engine.rightTorso.length
    }
    
    const gyroSlots = {
      centerTorso: systemAllocation.gyro.centerTorso.length,
      total: systemAllocation.gyro.centerTorso.length
    }
    
    return {
      engine: engineSlots,
      gyro: gyroSlots,
      total: engineSlots.total + gyroSlots.total
    }
  }
  
  /**
   * Get detailed special component breakdown for debugging
   */
  private static calculateSpecialComponentBreakdown(config: UnitConfiguration): SpecialComponentBreakdown {
    const structureSlots = this.getStructureCriticalSlots(config.structureType)
    const armorSlots = this.getArmorCriticalSlots(config.armorType, config.techBase)
    const jumpJetSlots = config.jumpMP || 0
    
    return {
      structure: {
        type: config.structureType,
        slots: structureSlots
      },
      armor: {
        type: config.armorType,
        slots: armorSlots
      },
      jumpJets: {
        type: config.jumpJetType || 'None',
        count: config.jumpMP || 0,
        slots: jumpJetSlots
      },
      total: structureSlots + armorSlots + jumpJetSlots
    }
  }
  
  // ===== HELPER METHODS =====
  
  /**
   * Get structure critical slot requirements
   */
  private static getStructureCriticalSlots(structureType: string): number {
    const structureSlotMap: Record<string, number> = {
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
   * Get armor critical slot requirements
   */
  private static getArmorCriticalSlots(armorType: string, techBase: string): number {
    try {
      return getArmorSlots(armorType as any, techBase as any) || 0
    } catch (error) {
      // Fallback for armor types not in the armor calculations
      const armorSlotMap: Record<string, number> = {
        'Standard': 0,
        'Ferro-Fibrous': 14,
        'Ferro-Fibrous (Clan)': 7,
        'Light Ferro-Fibrous': 7,
        'Heavy Ferro-Fibrous': 21,
        'Stealth': 12,
        'Reactive': 14,
        'Reflective': 10,
        'Hardened': 0
      }
      return armorSlotMap[armorType] || 0
    }
  }
  
  /**
   * Check if equipment is user equipment (not system/special components)
   */
  private static isUserEquipment(equipment: EquipmentObject): boolean {
    const name = equipment.name.toLowerCase()
    const specialEq = equipment as any
    
    // Exclude system components
    const systemPatterns = [
      'engine', 'gyro', 'actuator', 'cockpit', 'life support', 'sensors',
      'shoulder', 'upper arm', 'lower arm', 'hand', 'hip', 'upper leg', 'lower leg', 'foot'
    ]
    
    if (systemPatterns.some(pattern => name.includes(pattern))) {
      return false
    }
    
    // CRITICAL FIX: Exclude special components (structure/armor/jump jets) by componentType
    if (specialEq.componentType === 'structure' || specialEq.componentType === 'armor') {
      return false
    }
    
    // CRITICAL FIX: Also exclude by name patterns to catch all variants
    const structurePatterns = ['endo steel', 'endosteel', 'endo_steel', 'composite', 'reinforced']
    const armorPatterns = ['ferro-fibrous', 'ferrofibrous', 'ferro_fibrous', 'stealth', 'reactive', 'reflective', 'hardened']
    const jumpJetPatterns = ['jump', 'umu', 'booster', 'wing']
    
    // Check structure patterns
    if (structurePatterns.some(pattern => name.includes(pattern))) {
      return false
    }
    
    // Check armor patterns  
    if (armorPatterns.some(pattern => name.includes(pattern))) {
      return false
    }
    
    // Check jump jet patterns
    if (jumpJetPatterns.some(pattern => name.includes(pattern))) {
      return false
    }
    
    return true
  }
}
