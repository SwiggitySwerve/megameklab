/**
 * Armor Management Manager
 * Handles armor-related calculations, validations, and management
 */

import { UnitConfiguration, ArmorAllocation } from './UnitCriticalManagerTypes'
import { ArmorType } from '../../types/systemComponents'
// Import armor calculations
const armorCalculations = require('../armorCalculations');
const { getArmorSpecification } = armorCalculations;
import { getInternalStructurePoints } from '../internalStructureTable';

export class ArmorManagementManager {
  private configuration: UnitConfiguration

  constructor(configuration: UnitConfiguration) {
    this.configuration = configuration
  }

  /**
   * Update the configuration
   */
  updateConfiguration(configuration: UnitConfiguration): void {
    this.configuration = configuration
  }

  /**
   * Get armor type as string
   */
  getArmorTypeString(): ArmorType {
    if (typeof this.configuration.armorType === 'string') {
      return this.configuration.armorType as ArmorType
    }
    return this.configuration.armorType.type as ArmorType
  }

  /**
   * Get critical slot requirements for armor type
   */
  getArmorCriticalSlots(armorType: ArmorType): number {
    const spec = getArmorSpecification(armorType)
    return spec.criticalSlots
  }

  /**
   * Get armor efficiency for current armor type
   */
  getArmorEfficiency(): number {
    // Fallback implementation if import fails
    if (typeof getArmorSpecification === 'function') {
      const spec = getArmorSpecification(this.getArmorTypeString())
      return spec.pointsPerTon
    }
    
    // Direct implementation using official BattleTech TechManual values
    const armorType = this.getArmorTypeString();
    switch (armorType) {
      case 'Standard':
        return 16;
      case 'Ferro-Fibrous':
        return 17.92; // Official TechManual value
      case 'Ferro-Fibrous (Clan)':
        return 17.92; // Official TechManual value (same as IS)
      case 'Light Ferro-Fibrous':
        return 16.8; // Official TechManual value
      case 'Heavy Ferro-Fibrous':
        return 19.2;
      case 'Stealth':
        return 16;
      case 'Reactive':
        return 14; // Official TechManual value
      case 'Reflective':
        return 16; // Official TechManual value (same as standard)
      case 'Hardened':
        return 8;
      default:
        return 16; // Default to standard
    }
  }

  /**
   * Get maximum armor points for a specific location
   */
  getMaxArmorPointsForLocation(location: string): number {
    const internalStructurePoints = this.getInternalStructurePointsForLocation(location)
    const loc = location.toUpperCase();
    if (loc === 'HD' || loc === 'HEAD') {
      return 9;
    }
    // For torso and limbs, return internal structure × 2 (sum cap)
    return internalStructurePoints * 2;
  }

  /**
   * Get internal structure points for a specific location
   */
  private getInternalStructurePointsForLocation(location: string): number {
    const allPoints = getInternalStructurePoints(this.configuration.tonnage)
    return allPoints[location as keyof typeof allPoints] || 0;
  }

  /**
   * Enforce armor allocation rules
   */
  enforceArmorRules(armorAllocation: ArmorAllocation): ArmorAllocation {
    const enforced = { ...armorAllocation }

    // Head: max 9 front, 0 rear
    enforced.HD = { front: Math.min(enforced.HD.front, 9), rear: 0 }

    // Torso locations: enforce sum cap only (front + rear ≤ max)
    const torsoLocations = ['CT', 'LT', 'RT']
    torsoLocations.forEach(location => {
      const maxArmor = this.getMaxArmorPointsForLocation(location)
      let { front, rear } = enforced[location as keyof ArmorAllocation]
      // If sum exceeds max, reduce rear first, then front
      if (front + rear > maxArmor) {
        const overflow = front + rear - maxArmor
        if (rear >= overflow) {
          rear -= overflow
        } else {
          front -= (overflow - rear)
          rear = 0
        }
      }
      // Do NOT cap front at max for torso locations; only the sum matters
      enforced[location as keyof ArmorAllocation] = { front, rear }
    })

    // Arms/Legs: front ≤ max, rear = 0
    const limbLocations = ['LA', 'RA', 'LL', 'RL']
    limbLocations.forEach(location => {
      const maxArmor = this.getMaxArmorPointsForLocation(location)
      let { front } = enforced[location as keyof ArmorAllocation]
      if (front > maxArmor) front = maxArmor
      enforced[location as keyof ArmorAllocation] = { front, rear: 0 }
    })

    return enforced
  }

  /**
   * Get available armor points
   */
  getAvailableArmorPoints(): number {
    const maxArmorPoints = this.getMaxArmorPoints()
    const allocatedPoints = this.getAllocatedArmorPoints()
    return maxArmorPoints - allocatedPoints
  }

  /**
   * Get allocated armor points
   */
  getAllocatedArmorPoints(): number {
    let total = 0
    Object.values(this.configuration.armorAllocation).forEach(allocation => {
      total += allocation.front + allocation.rear
    })
    return total
  }

  /**
   * Get unallocated armor points
   */
  getUnallocatedArmorPoints(): number {
    return this.getAvailableArmorPoints()
  }

  /**
   * Get remaining armor points
   */
  getRemainingArmorPoints(): number {
    return this.getAvailableArmorPoints()
  }

  /**
   * Get maximum armor points allowed for this unit
   */
  getMaxArmorPoints(): number {
    const allPoints = getInternalStructurePoints(this.configuration.tonnage)
    const totalInternalStructure = Object.values(allPoints).reduce((sum: number, points: unknown) => sum + (points as number), 0)
    const multiplier = this.getArmorEfficiency() / 16
    return Math.floor(totalInternalStructure * multiplier)
  }

  /**
   * Get armor waste analysis
   */
  getArmorWasteAnalysis(): any {
    const maxArmorPoints = this.getMaxArmorPoints()
    const allocatedPoints = this.getAllocatedArmorPoints()
    const wastedPoints = maxArmorPoints - allocatedPoints

    return {
      maxArmorPoints,
      allocatedPoints,
      wastedPoints,
      hasWaste: wastedPoints > 0,
      efficiency: allocatedPoints / maxArmorPoints
    }
  }

  /**
   * Check if there is armor waste
   */
  hasArmorWaste(): boolean {
    return this.getArmorWasteAnalysis().hasWaste
  }

  /**
   * Get wasted armor points
   */
  getWastedArmorPoints(): number {
    return this.getArmorWasteAnalysis().wastedPoints
  }

  /**
   * Get remaining tonnage for armor
   */
  getRemainingTonnageForArmor(): number {
    const usedWithoutArmor = this.getUsedTonnageWithoutArmor()
    return this.configuration.tonnage - usedWithoutArmor
  }

  /**
   * Get used tonnage without armor
   */
  private getUsedTonnageWithoutArmor(): number {
    const config = this.configuration
    
    // Engine weight
    const engineWeight = this.getEngineWeight()
    
    // Gyro weight
    const gyroWeight = this.getGyroWeight()
    
    // Structure weight (assume 1 ton per 10 tons of mech)
    const structureWeight = Math.ceil(config.tonnage / 10)
    
    // Heat sink weight
    const heatSinkWeight = config.externalHeatSinks * this.getHeatSinkTonnage()
    
    // Jump jet weight
    const jumpJetWeight = this.getJumpJetWeight()
    
    // Equipment weight (estimate)
    const equipmentWeight = 0 // This would need to be calculated from actual equipment
    
    return engineWeight + gyroWeight + structureWeight + heatSinkWeight + jumpJetWeight + equipmentWeight
  }

  /**
   * Get engine weight
   */
  private getEngineWeight(): number {
    return this.configuration.engineRating / 75
  }

  /**
   * Get gyro weight
   */
  private getGyroWeight(): number {
    const engineRating = this.configuration.engineRating
    return Math.ceil(engineRating / 100)
  }

  /**
   * Get heat sink tonnage
   */
  private getHeatSinkTonnage(): number {
    const heatSinkType = this.getHeatSinkTypeString()
    return heatSinkType === 'Double' ? 1.0 : 0.5
  }

  /**
   * Get jump jet weight
   */
  private getJumpJetWeight(): number {
    const jumpJetType = this.getJumpJetTypeString()
    const jumpMP = this.configuration.jumpMP
    
    if (jumpMP === 0) return 0
    
    const baseWeight = jumpJetType === 'Improved Jump Jet' ? 0.5 : 0.5
    return jumpMP * baseWeight
  }

  /**
   * Get heat sink type as string
   */
  private getHeatSinkTypeString(): string {
    if (typeof this.configuration.heatSinkType === 'string') {
      return this.configuration.heatSinkType
    }
    return this.configuration.heatSinkType.type
  }

  /**
   * Get jump jet type as string
   */
  private getJumpJetTypeString(): string {
    if (typeof this.configuration.jumpJetType === 'string') {
      return this.configuration.jumpJetType
    }
    return this.configuration.jumpJetType.type
  }
} 