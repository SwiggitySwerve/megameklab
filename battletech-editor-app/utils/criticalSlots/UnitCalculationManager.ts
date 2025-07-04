/**
 * UnitCalculationManager
 * Handles all unit calculations including weight, armor, heat, and critical slots.
 * Extracted from UnitCriticalManager for modularity and SOLID compliance.
 */

import { UnitConfiguration } from './UnitCriticalManagerTypes';
import { ComponentConfiguration } from '../../types/componentConfiguration';

export interface WeightBreakdown {
  structure: number;
  engine: number;
  gyro: number;
  cockpit: number;
  actuators: number;
  armor: number;
  equipment: number;
  heatSinks: number;
  jumpJets: number;
  total: number;
  remaining: number;
  isOverweight: boolean;
  utilizationPercentage: number;
}

export interface ArmorAnalysis {
  totalWasted: number;
  wastedFromRounding: number;
  trappedPoints: number;
  locationsAtCap: number;
  wastePercentage: number;
  optimalTonnage: number;
  tonnageSavings: number;
}

export interface HeatAnalysis {
  generation: number;
  dissipation: number;
  efficiency: number;
  isOverheating: boolean;
}

export class UnitCalculationManager {
  /**
   * Extract type string from ComponentConfiguration or return string as-is
   */
  private static extractComponentType(component: ComponentConfiguration | string): string {
    if (typeof component === 'string') {
      return component;
    }
    return component.type;
  }

  /**
   * Calculate engine weight based on rating and type
   */
  calculateEngineWeight(config: UnitConfiguration): number {
    const rating = config.engineRating;
    const type = UnitCalculationManager.extractComponentType(config.engineType);
    
    let engineMultiplier = 1;
    switch (type) {
      case 'XL':
      case 'XL (IS)':
      case 'XL (Clan)':
        engineMultiplier = 0.5;
        break;
      case 'Light':
        engineMultiplier = 0.75;
        break;
      case 'XXL':
        engineMultiplier = 0.33;
        break;
      case 'Compact':
        engineMultiplier = 1.5;
        break;
      case 'ICE':
      case 'Fuel Cell':
        engineMultiplier = 2.0;
        break;
      default:
        engineMultiplier = 1.0;
    }
    
    return (rating / 25) * engineMultiplier;
  }

  /**
   * Calculate gyro weight based on engine rating and type
   */
  calculateGyroWeight(config: UnitConfiguration): number {
    const rating = config.engineRating;
    const type = UnitCalculationManager.extractComponentType(config.gyroType);
    
    const baseWeight = Math.ceil(rating / 100);
    
    switch (type) {
      case 'XL':
        return baseWeight * 0.5;
      case 'Compact':
        return baseWeight * 1.5;
      case 'Heavy-Duty':
        return baseWeight * 2.0;
      default: // Standard
        return baseWeight;
    }
  }

  /**
   * Calculate heat sink tonnage per unit
   */
  calculateHeatSinkTonnage(config: UnitConfiguration): number {
    const type = UnitCalculationManager.extractComponentType(config.heatSinkType);
    
    switch (type) {
      case 'Double':
      case 'Double (IS)':
      case 'Double (Clan)':
        return 1.0;
      case 'Compact':
        return 0.5;
      case 'Laser':
        return 1.5;
      default: // Single
        return 1.0;
    }
  }

  /**
   * Calculate jump jet weight based on jump MP and tonnage
   */
  calculateJumpJetWeight(config: UnitConfiguration): number {
    const jumpMP = config.jumpMP || 0;
    if (jumpMP === 0) return 0;
    
    const tonnage = config.tonnage;
    
    if (tonnage <= 55) {
      return jumpMP * 0.5;
    } else if (tonnage <= 85) {
      return jumpMP * 1.0;
    } else {
      return jumpMP * 2.0;
    }
  }

  /**
   * Calculate structure weight based on tonnage and type
   */
  calculateStructureWeight(config: UnitConfiguration): number {
    const type = UnitCalculationManager.extractComponentType(config.structureType);
    const tonnage = config.tonnage;
    
    const multiplier = type === 'Endo Steel' || type === 'Endo Steel (Clan)' ? 0.05 : 0.1;
    return tonnage * multiplier;
  }

  /**
   * Calculate total used tonnage
   */
  calculateUsedTonnage(config: UnitConfiguration): number {
    const structureWeight = this.calculateStructureWeight(config);
    const engineWeight = this.calculateEngineWeight(config);
    const gyroWeight = this.calculateGyroWeight(config);
    const cockpitWeight = 3.0; // Standard cockpit
    const heatSinkWeight = config.externalHeatSinks * this.calculateHeatSinkTonnage(config);
    const jumpJetWeight = this.calculateJumpJetWeight(config);
    const armorWeight = config.armorTonnage;
    
    return structureWeight + engineWeight + gyroWeight + cockpitWeight + heatSinkWeight + jumpJetWeight + armorWeight;
  }

  /**
   * Calculate remaining tonnage
   */
  calculateRemainingTonnage(config: UnitConfiguration): number {
    const usedTonnage = this.calculateUsedTonnage(config);
    return Math.max(0, config.tonnage - usedTonnage);
  }

  /**
   * Check if unit is overweight
   */
  isOverweight(config: UnitConfiguration): boolean {
    return this.calculateUsedTonnage(config) > config.tonnage;
  }

  /**
   * Calculate armor efficiency based on type
   */
  calculateArmorEfficiency(config: UnitConfiguration): number {
    const type = UnitCalculationManager.extractComponentType(config.armorType);
    
    switch (type) {
      case 'Ferro-Fibrous':
      case 'Ferro-Fibrous (Clan)':
        return 16;
      case 'Light Ferro-Fibrous':
        return 16;
      case 'Heavy Ferro-Fibrous':
        return 16;
      case 'Stealth':
      case 'Stealth (Clan)':
        return 16;
      default: // Standard
        return 16;
    }
  }

  /**
   * Calculate available armor points from tonnage
   */
  calculateAvailableArmorPoints(config: UnitConfiguration): number {
    return Math.floor(config.armorTonnage * this.calculateArmorEfficiency(config));
  }

  /**
   * Calculate allocated armor points from location assignments
   */
  calculateAllocatedArmorPoints(config: UnitConfiguration): number {
    return Object.values(config.armorAllocation).reduce((total, location) => {
      return total + (location.front || 0) + (location.rear || 0);
    }, 0);
  }

  /**
   * Calculate unallocated armor points
   */
  calculateUnallocatedArmorPoints(config: UnitConfiguration): number {
    const availableFromTonnage = this.calculateAvailableArmorPoints(config);
    const allocated = this.calculateAllocatedArmorPoints(config);
    return availableFromTonnage - allocated;
  }

  /**
   * Calculate armor waste analysis
   */
  calculateArmorWasteAnalysis(config: UnitConfiguration): ArmorAnalysis {
    const unitMaximum = this.calculateMaxArmorPoints(config);
    const tonnageMaximum = this.calculateAvailableArmorPoints(config);
    const allocatedPoints = this.calculateAllocatedArmorPoints(config);
    const armorEfficiency = this.calculateArmorEfficiency(config);
    
    const totalWasted = Math.max(0, tonnageMaximum - unitMaximum);
    
    let locationsAtCap = 0;
    Object.entries(config.armorAllocation).forEach(([location, armor]) => {
      const maxForLocation = this.calculateMaxArmorPointsForLocation(location, config);
      const currentArmor = (armor.front || 0) + (armor.rear || 0);
      
      if (currentArmor >= maxForLocation) {
        locationsAtCap++;
      }
    });
    
    const optimalPoints = Math.min(allocatedPoints, unitMaximum);
    const optimalTonnage = Math.ceil(optimalPoints / armorEfficiency * 2) / 2;
    const tonnageSavings = Math.max(0, config.armorTonnage - optimalTonnage);
    const wastePercentage = tonnageMaximum > 0 ? (totalWasted / tonnageMaximum) * 100 : 0;
    
    return {
      totalWasted,
      wastedFromRounding: 0,
      trappedPoints: totalWasted,
      locationsAtCap,
      wastePercentage,
      optimalTonnage,
      tonnageSavings
    };
  }

  /**
   * Calculate maximum armor points for the unit
   */
  calculateMaxArmorPoints(config: UnitConfiguration): number {
    const internalStructure = this.calculateInternalStructurePoints(config);
    return Object.values(internalStructure).reduce((total, points) => total + points * 2, 0);
  }

  /**
   * Calculate maximum armor points for a specific location
   */
  calculateMaxArmorPointsForLocation(location: string, config: UnitConfiguration): number {
    const internalStructure = this.calculateInternalStructurePoints(config);
    
    if (location === 'HD') {
      return 9; // Head max is always 9
    }
    
    const structurePoints = internalStructure[location] || 0;
    return structurePoints * 2;
  }

  /**
   * Calculate internal structure points for each location
   */
  calculateInternalStructurePoints(config: UnitConfiguration): Record<string, number> {
    const tonnage = config.tonnage;
    
    // Standard BattleTech internal structure table
    if (tonnage <= 20) {
      return { HD: 3, CT: 6, LT: 5, RT: 5, LA: 4, RA: 4, LL: 4, RL: 4 };
    } else if (tonnage <= 25) {
      return { HD: 3, CT: 7, LT: 6, RT: 6, LA: 5, RA: 5, LL: 5, RL: 5 };
    } else if (tonnage <= 30) {
      return { HD: 3, CT: 8, LT: 7, RT: 7, LA: 6, RA: 6, LL: 6, RL: 6 };
    } else if (tonnage <= 35) {
      return { HD: 3, CT: 9, LT: 8, RT: 8, LA: 7, RA: 7, LL: 7, RL: 7 };
    } else if (tonnage <= 40) {
      return { HD: 3, CT: 10, LT: 9, RT: 9, LA: 8, RA: 8, LL: 8, RL: 8 };
    } else if (tonnage <= 45) {
      return { HD: 3, CT: 11, LT: 10, RT: 10, LA: 9, RA: 9, LL: 9, RL: 9 };
    } else if (tonnage <= 50) {
      return { HD: 3, CT: 12, LT: 11, RT: 11, LA: 10, RA: 10, LL: 10, RL: 10 };
    } else if (tonnage <= 55) {
      return { HD: 3, CT: 13, LT: 12, RT: 12, LA: 11, RA: 11, LL: 11, RL: 11 };
    } else if (tonnage <= 60) {
      return { HD: 3, CT: 14, LT: 13, RT: 13, LA: 12, RA: 12, LL: 12, RL: 12 };
    } else if (tonnage <= 65) {
      return { HD: 3, CT: 15, LT: 14, RT: 14, LA: 13, RA: 13, LL: 13, RL: 13 };
    } else if (tonnage <= 70) {
      return { HD: 3, CT: 16, LT: 15, RT: 15, LA: 14, RA: 14, LL: 14, RL: 14 };
    } else if (tonnage <= 75) {
      return { HD: 3, CT: 17, LT: 16, RT: 16, LA: 15, RA: 15, LL: 15, RL: 15 };
    } else if (tonnage <= 80) {
      return { HD: 3, CT: 18, LT: 17, RT: 17, LA: 16, RA: 16, LL: 16, RL: 16 };
    } else if (tonnage <= 85) {
      return { HD: 3, CT: 19, LT: 18, RT: 18, LA: 17, RA: 17, LL: 17, RL: 17 };
    } else if (tonnage <= 90) {
      return { HD: 3, CT: 20, LT: 19, RT: 19, LA: 18, RA: 18, LL: 18, RL: 18 };
    } else if (tonnage <= 95) {
      return { HD: 3, CT: 21, LT: 20, RT: 20, LA: 19, RA: 19, LL: 19, RL: 19 };
    } else {
      return { HD: 3, CT: 22, LT: 21, RT: 21, LA: 20, RA: 20, LL: 20, RL: 20 };
    }
  }

  /**
   * Calculate heat sink efficiency
   */
  calculateHeatSinkEfficiency(config: UnitConfiguration): number {
    const type = UnitCalculationManager.extractComponentType(config.heatSinkType);
    
    switch (type) {
      case 'Double':
      case 'Double (IS)':
      case 'Double (Clan)':
        return 2.0;
      case 'Compact':
        return 1.0;
      case 'Laser':
        return 1.0;
      default: // Single
        return 1.0;
    }
  }

  /**
   * Calculate maximum walk MP for tonnage
   */
  calculateMaxWalkMP(config: UnitConfiguration): number {
    return Math.floor(400 / config.tonnage);
  }
} 