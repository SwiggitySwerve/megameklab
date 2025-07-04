/**
 * SpecialComponentManager
 * Handles special component allocation including Endo Steel, Ferro Fibrous, and other special components.
 * Extracted from CriticalSlotCalculator for modularity and SOLID compliance.
 */

import { UnitConfiguration } from './UnitCriticalManager';
import { ComponentConfiguration } from '../../types/componentConfiguration';

export interface SpecialComponentAllocation {
  endoSteel: {
    required: number;
    allocated: EndoSteelSlotAllocation;
    conflicts: string[];
  };
  ferroFibrous: {
    required: number;
    allocated: FerroFibrousSlotAllocation;
    conflicts: string[];
  };
  altri: {
    required: number;
    allocated: { [location: string]: number[] };
    conflicts: string[];
  };
}

export interface EndoSteelSlotAllocation {
  total: number;
  allocations: {
    [location: string]: {
      slots: number[];
      count: number;
    };
  };
  isComplete: boolean;
  remainingSlots: number;
}

export interface FerroFibrousSlotAllocation {
  total: number;
  allocations: {
    [location: string]: {
      slots: number[];
      count: number;
    };
  };
  isComplete: boolean;
  remainingSlots: number;
}

export class SpecialComponentManager {
  /**
   * Extract type string from ComponentConfiguration or return string as-is
   */
  public extractComponentType(component: ComponentConfiguration | string): string {
    if (typeof component === 'string') {
      return component;
    }
    return component.type;
  }

  /**
   * Allocate special components
   */
  allocateSpecialComponents(config: UnitConfiguration): SpecialComponentAllocation {
    const endoSteel = this.allocateEndoSteel(config);
    const ferroFibrous = this.allocateFerroFibrous(config);
    const altri = this.allocateOtherSpecialComponents(config);

    return {
      endoSteel,
      ferroFibrous,
      altri
    };
  }

  /**
   * Calculate Endo Steel slots
   */
  calculateEndoSteelSlots(config: UnitConfiguration): EndoSteelSlotAllocation {
    const requiredSlots = this.getEndoSteelRequirement(config);
    const allocations = this.distributeEndoSteelSlots(requiredSlots, config);
    const conflicts = this.detectEndoSteelConflicts(config, { total: requiredSlots, allocations, isComplete: false, remainingSlots: 0 });

    const totalAllocated = Object.values(allocations).reduce((sum, data) => sum + data.count, 0);
    const isComplete = totalAllocated >= requiredSlots;
    const remainingSlots = Math.max(0, requiredSlots - totalAllocated);

    return {
      total: requiredSlots,
      allocations,
      isComplete,
      remainingSlots
    };
  }

  /**
   * Calculate Ferro Fibrous slots
   */
  calculateFerroFibrousSlots(config: UnitConfiguration): FerroFibrousSlotAllocation {
    const requiredSlots = this.getFerroFibrousRequirement(config);
    const allocations = this.distributeFerroFibrousSlots(requiredSlots, config);
    const conflicts = this.detectFerroFibrousConflicts(config, { total: requiredSlots, allocations, isComplete: false, remainingSlots: 0 });

    const totalAllocated = Object.values(allocations).reduce((sum, data) => sum + data.count, 0);
    const isComplete = totalAllocated >= requiredSlots;
    const remainingSlots = Math.max(0, requiredSlots - totalAllocated);

    return {
      total: requiredSlots,
      allocations,
      isComplete,
      remainingSlots
    };
  }

  /**
   * Allocate Endo Steel
   */
  private allocateEndoSteel(config: UnitConfiguration): {
    required: number;
    allocated: EndoSteelSlotAllocation;
    conflicts: string[];
  } {
    const requiredSlots = this.getEndoSteelRequirement(config);
    const allocated = this.calculateEndoSteelSlots(config);
    const conflicts = this.detectEndoSteelConflicts(config, allocated);

    return {
      required: requiredSlots,
      allocated,
      conflicts
    };
  }

  /**
   * Allocate Ferro Fibrous
   */
  private allocateFerroFibrous(config: UnitConfiguration): {
    required: number;
    allocated: FerroFibrousSlotAllocation;
    conflicts: string[];
  } {
    const requiredSlots = this.getFerroFibrousRequirement(config);
    const allocated = this.calculateFerroFibrousSlots(config);
    const conflicts = this.detectFerroFibrousConflicts(config, allocated);

    return {
      required: requiredSlots,
      allocated,
      conflicts
    };
  }

  /**
   * Allocate other special components
   */
  private allocateOtherSpecialComponents(config: UnitConfiguration): {
    required: number;
    allocated: { [location: string]: number[] };
    conflicts: string[];
  } {
    const requiredSlots = this.getOtherSpecialRequirements(config);
    const allocated = this.distributeOtherSpecialSlots(requiredSlots, config);
    const conflicts = this.detectOtherSpecialConflicts(config, allocated);

    return {
      required: requiredSlots,
      allocated,
      conflicts
    };
  }

  /**
   * Get Endo Steel requirement
   */
  public getEndoSteelRequirement(config: UnitConfiguration): number {
    const tonnage = config.tonnage;
    return Math.ceil(tonnage / 5); // 1 slot per 5 tons
  }

  /**
   * Get Ferro Fibrous requirement
   */
  public getFerroFibrousRequirement(config: UnitConfiguration): number {
    const tonnage = config.tonnage;
    return Math.ceil(tonnage / 5); // 1 slot per 5 tons
  }

  /**
   * Get other special requirements
   */
  private getOtherSpecialRequirements(config: UnitConfiguration): number {
    // Simplified - in practice this would check for other special components
    return 0;
  }

  /**
   * Detect Endo Steel conflicts
   */
  private detectEndoSteelConflicts(config: UnitConfiguration, allocation: EndoSteelSlotAllocation): string[] {
    const conflicts: string[] = [];

    // Check if allocation is complete
    if (!allocation.isComplete) {
      conflicts.push(`Incomplete Endo Steel allocation: ${allocation.remainingSlots} slots remaining`);
    }

    // Check for invalid locations
    Object.entries(allocation.allocations).forEach(([location, data]) => {
      if (data.count > 0 && !this.isValidEndoSteelLocation(location)) {
        conflicts.push(`Invalid Endo Steel location: ${location}`);
      }
    });

    return conflicts;
  }

  /**
   * Detect Ferro Fibrous conflicts
   */
  private detectFerroFibrousConflicts(config: UnitConfiguration, allocation: FerroFibrousSlotAllocation): string[] {
    const conflicts: string[] = [];

    // Check if allocation is complete
    if (!allocation.isComplete) {
      conflicts.push(`Incomplete Ferro Fibrous allocation: ${allocation.remainingSlots} slots remaining`);
    }

    // Check for invalid locations
    Object.entries(allocation.allocations).forEach(([location, data]) => {
      if (data.count > 0 && !this.isValidFerroFibrousLocation(location)) {
        conflicts.push(`Invalid Ferro Fibrous location: ${location}`);
      }
    });

    return conflicts;
  }

  /**
   * Detect other special conflicts
   */
  private detectOtherSpecialConflicts(config: UnitConfiguration, allocation: { [location: string]: number[] }): string[] {
    // Simplified conflict detection for other special components
    return [];
  }

  /**
   * Distribute Endo Steel slots
   */
  private distributeEndoSteelSlots(requiredSlots: number, config: UnitConfiguration): { [location: string]: { slots: number[], count: number } } {
    const allocations: { [location: string]: { slots: number[], count: number } } = {};
    let remainingSlots = requiredSlots;

    // Priority locations for Endo Steel
    const priorityLocations = ['centerTorso', 'leftTorso', 'rightTorso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
    const maxSlotsPerLocation = {
      centerTorso: 6,
      leftTorso: 6,
      rightTorso: 6,
      leftArm: 4,
      rightArm: 4,
      leftLeg: 3,
      rightLeg: 3
    };

    for (const location of priorityLocations) {
      if (remainingSlots <= 0) break;

      const maxSlots = maxSlotsPerLocation[location as keyof typeof maxSlotsPerLocation] || 3;
      const slotsToAllocate = Math.min(remainingSlots, maxSlots);
      
      if (slotsToAllocate > 0) {
        allocations[location] = {
          slots: Array.from({ length: slotsToAllocate }, (_, i) => i),
          count: slotsToAllocate
        };
        remainingSlots -= slotsToAllocate;
      }
    }

    return allocations;
  }

  /**
   * Distribute Ferro Fibrous slots
   */
  private distributeFerroFibrousSlots(requiredSlots: number, config: UnitConfiguration): { [location: string]: { slots: number[], count: number } } {
    const allocations: { [location: string]: { slots: number[], count: number } } = {};
    let remainingSlots = requiredSlots;

    // Priority locations for Ferro Fibrous
    const priorityLocations = ['centerTorso', 'leftTorso', 'rightTorso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
    const maxSlotsPerLocation = {
      centerTorso: 6,
      leftTorso: 6,
      rightTorso: 6,
      leftArm: 4,
      rightArm: 4,
      leftLeg: 3,
      rightLeg: 3
    };

    for (const location of priorityLocations) {
      if (remainingSlots <= 0) break;

      const maxSlots = maxSlotsPerLocation[location as keyof typeof maxSlotsPerLocation] || 3;
      const slotsToAllocate = Math.min(remainingSlots, maxSlots);
      
      if (slotsToAllocate > 0) {
        allocations[location] = {
          slots: Array.from({ length: slotsToAllocate }, (_, i) => i),
          count: slotsToAllocate
        };
        remainingSlots -= slotsToAllocate;
      }
    }

    return allocations;
  }

  /**
   * Distribute other special slots
   */
  private distributeOtherSpecialSlots(requiredSlots: number, config: UnitConfiguration): { [location: string]: number[] } {
    // Simplified distribution for other special components
    if (requiredSlots > 0) {
      return {
        centerTorso: Array.from({ length: Math.min(requiredSlots, 6) }, (_, i) => i)
      };
    }
    return {};
  }

  /**
   * Check if location is valid for Endo Steel
   */
  private isValidEndoSteelLocation(location: string): boolean {
    const validLocations = ['centerTorso', 'leftTorso', 'rightTorso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
    return validLocations.includes(location);
  }

  /**
   * Check if location is valid for Ferro Fibrous
   */
  private isValidFerroFibrousLocation(location: string): boolean {
    const validLocations = ['centerTorso', 'leftTorso', 'rightTorso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
    return validLocations.includes(location);
  }

  /**
   * Get special component slots for configuration
   */
  public calculateSpecialComponentSlots(config: UnitConfiguration): number {
    let slots = 0;

    // Endo Steel slots
    const structureType = this.extractComponentType(config.structureType);
    if (structureType === 'Endo Steel' || structureType === 'Endo Steel (Clan)') {
      slots += this.getEndoSteelRequirement(config);
    }

    // Ferro Fibrous slots
    const armorType = this.extractComponentType(config.armorType);
    if (armorType === 'Ferro-Fibrous' || armorType === 'Ferro-Fibrous (Clan)' || 
        armorType === 'Light Ferro-Fibrous' || armorType === 'Heavy Ferro-Fibrous') {
      slots += this.getFerroFibrousRequirement(config);
    }

    // Other special components
    slots += this.getOtherSpecialRequirements(config);

    return slots;
  }

  /**
   * Validate special component placement
   */
  public validateSpecialComponentPlacement(config: UnitConfiguration, allocations: any[]): string[] {
    const errors: string[] = [];

    // Validate Endo Steel placement
    const structureType = this.extractComponentType(config.structureType);
    if (structureType === 'Endo Steel' || structureType === 'Endo Steel (Clan)') {
      const endoAllocations = allocations.filter(a => a.equipment.type === 'structure' && 
        (a.equipment.name.includes('Endo Steel')));
      
      endoAllocations.forEach(allocation => {
        if (!this.isValidEndoSteelLocation(allocation.location)) {
          errors.push(`Invalid Endo Steel placement in ${allocation.location}`);
        }
      });
    }

    // Validate Ferro Fibrous placement
    const armorType = this.extractComponentType(config.armorType);
    if (armorType === 'Ferro-Fibrous' || armorType === 'Ferro-Fibrous (Clan)' || 
        armorType === 'Light Ferro-Fibrous' || armorType === 'Heavy Ferro-Fibrous') {
      const ferroAllocations = allocations.filter(a => a.equipment.type === 'armor' && 
        (a.equipment.name.includes('Ferro-Fibrous')));
      
      ferroAllocations.forEach(allocation => {
        if (!this.isValidFerroFibrousLocation(allocation.location)) {
          errors.push(`Invalid Ferro Fibrous placement in ${allocation.location}`);
        }
      });
    }

    return errors;
  }

  /**
   * Get special component recommendations
   */
  public getSpecialComponentRecommendations(config: UnitConfiguration): string[] {
    const recommendations: string[] = [];

    // Endo Steel recommendations
    const structureType = this.extractComponentType(config.structureType);
    if (structureType === 'Endo Steel' || structureType === 'Endo Steel (Clan)') {
      const requiredSlots = this.getEndoSteelRequirement(config);
      recommendations.push(`Endo Steel requires ${requiredSlots} critical slots`);
      recommendations.push('Distribute Endo Steel slots across multiple locations for better protection');
    }

    // Ferro Fibrous recommendations
    const armorType = this.extractComponentType(config.armorType);
    if (armorType === 'Ferro-Fibrous' || armorType === 'Ferro-Fibrous (Clan)' || 
        armorType === 'Light Ferro-Fibrous' || armorType === 'Heavy Ferro-Fibrous') {
      const requiredSlots = this.getFerroFibrousRequirement(config);
      recommendations.push(`Ferro Fibrous requires ${requiredSlots} critical slots`);
      recommendations.push('Consider armor distribution for optimal protection');
    }

    return recommendations;
  }
} 