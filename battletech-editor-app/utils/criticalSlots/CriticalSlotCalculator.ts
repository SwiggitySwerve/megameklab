/**
 * CriticalSlotCalculator - Critical slot calculation and allocation management
 * 
 * Extracted from UnitCriticalManager as part of large file refactoring.
 * Handles critical slot calculations, allocations, and optimization for BattleMech construction.
 * 
 * @see IMPLEMENTATION_REFERENCE.md for architectural patterns
 */

import { UnitConfiguration } from './UnitCriticalManager';
import { ComponentConfiguration, TechBase } from '../../types/componentConfiguration';

export interface CriticalSlotCalculator {
  // Core slot calculations
  calculateRequiredSlots(config: UnitConfiguration, equipment: any[]): SlotRequirements;
  calculateAvailableSlots(config: UnitConfiguration): AvailableSlots;
  calculateSlotUtilization(config: UnitConfiguration, equipment: any[]): SlotUtilization;
  
  // Allocation methods
  allocateEquipmentSlots(config: UnitConfiguration, equipment: any[]): AllocationResult;
  optimizeSlotAllocation(config: UnitConfiguration, equipment: any[]): OptimizationResult;
  validateSlotAllocation(config: UnitConfiguration, equipment: any[]): ValidationResult;
  
  // Special component handling
  allocateSpecialComponents(config: UnitConfiguration): SpecialComponentAllocation;
  calculateEndoSteelSlots(config: UnitConfiguration): EndoSteelSlotAllocation;
  calculateFerroFibrousSlots(config: UnitConfiguration): FerroFibrousSlotAllocation;
  
  // Slot conflict resolution
  detectSlotConflicts(config: UnitConfiguration, equipment: any[]): SlotConflict[];
  resolveSlotConflicts(conflicts: SlotConflict[]): ConflictResolution;
  suggestSlotReorganization(config: UnitConfiguration, equipment: any[]): ReorganizationSuggestion[];
  
  // Analysis and reporting
  analyzeSlotEfficiency(config: UnitConfiguration, equipment: any[]): EfficiencyAnalysis;
  generateSlotReport(config: UnitConfiguration, equipment: any[]): SlotReport;
  findAvailableSlots(config: UnitConfiguration, equipment: any[], requiredSlots: number): AvailableSlotLocation[];
}

export interface SlotRequirements {
  total: number;
  byLocation: {
    head: number;
    centerTorso: number;
    leftTorso: number;
    rightTorso: number;
    leftArm: number;
    rightArm: number;
    leftLeg: number;
    rightLeg: number;
  };
  byComponent: {
    systemComponents: number;
    specialComponents: number;
    equipment: number;
    ammunition: number;
  };
  critical: boolean; // True if requirements exceed capacity
}

export interface AvailableSlots {
  total: number;
  byLocation: {
    head: number;
    centerTorso: number;
    leftTorso: number;
    rightTorso: number;
    leftArm: number;
    rightArm: number;
    leftLeg: number;
    rightLeg: number;
  };
  reserved: {
    systemComponents: number;
    specialComponents: number;
  };
  usable: number; // Total minus reserved
}

export interface SlotUtilization {
  percentageUsed: number;
  totalUsed: number;
  totalAvailable: number;
  byLocation: {
    [location: string]: {
      used: number;
      available: number;
      percentage: number;
      efficiency: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    };
  };
  bottlenecks: string[]; // Locations with >90% utilization
  recommendations: string[];
}

export interface AllocationResult {
  success: boolean;
  allocations: EquipmentAllocation[];
  unallocated: any[];
  conflicts: SlotConflict[];
  warnings: string[];
  suggestions: string[];
}

export interface EquipmentAllocation {
  equipment: any;
  location: string;
  slots: number[];
  validated: boolean;
  conflicts: string[];
}

export interface OptimizationResult {
  optimized: boolean;
  originalAllocations: EquipmentAllocation[];
  optimizedAllocations: EquipmentAllocation[];
  improvements: {
    slotsFreed: number;
    conflictsResolved: number;
    efficiencyGain: number;
  };
  recommendations: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
  locationStatus: {
    [location: string]: {
      valid: boolean;
      used: number;
      capacity: number;
      conflicts: string[];
    };
  };
}

export interface ValidationError {
  type: 'slot_overflow' | 'invalid_location' | 'component_conflict' | 'rule_violation';
  location: string;
  component: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

export interface ValidationWarning {
  type: 'inefficient_placement' | 'suboptimal_allocation' | 'potential_conflict';
  location: string;
  component: string;
  message: string;
  recommendation: string;
}

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

export interface SlotConflict {
  type: 'overlap' | 'invalid_location' | 'capacity_exceeded' | 'rule_violation';
  location: string;
  slot: number;
  conflictingComponents: string[];
  severity: 'critical' | 'major' | 'minor';
  resolvable: boolean;
  suggestions: string[];
}

export interface ConflictResolution {
  resolved: SlotConflict[];
  unresolved: SlotConflict[];
  newAllocations: EquipmentAllocation[];
  success: boolean;
  explanation: string;
}

export interface ReorganizationSuggestion {
  type: 'move_equipment' | 'split_equipment' | 'optimize_special' | 'relocate_system';
  component: string;
  fromLocation: string;
  toLocation: string;
  benefit: string;
  impact: 'none' | 'minor' | 'moderate' | 'major';
  feasible: boolean;
}

export interface EfficiencyAnalysis {
  overallEfficiency: number; // 0-100 score
  locationEfficiency: {
    [location: string]: {
      efficiency: number;
      utilization: number;
      wastedSlots: number;
      suggestions: string[];
    };
  };
  bottlenecks: string[];
  optimizationPotential: number;
  recommendations: string[];
}

export interface SlotReport {
  summary: {
    totalSlots: number;
    usedSlots: number;
    availableSlots: number;
    utilization: number;
    efficiency: string;
  };
  locationBreakdown: {
    [location: string]: {
      capacity: number;
      used: number;
      available: number;
      equipment: string[];
      specialComponents: string[];
      conflicts: string[];
    };
  };
  specialComponents: SpecialComponentAllocation;
  conflicts: SlotConflict[];
  recommendations: string[];
}

export interface AvailableSlotLocation {
  location: string;
  availableSlots: number[];
  contiguous: boolean;
  suitableFor: string[];
  restrictions: string[];
}

export class CriticalSlotCalculatorImpl implements CriticalSlotCalculator {
  
  // Standard slot counts per location for bipedal mechs
  private readonly STANDARD_SLOT_COUNTS = {
    head: 6,
    centerTorso: 12,
    leftTorso: 12,
    rightTorso: 12,
    leftArm: 12,
    rightArm: 12,
    leftLeg: 6,
    rightLeg: 6
  };

  // ===== CORE SLOT CALCULATIONS =====
  
  calculateRequiredSlots(config: UnitConfiguration, equipment: any[]): SlotRequirements {
    const systemSlots = this.calculateSystemComponentSlots(config);
    const specialSlots = this.calculateSpecialComponentSlots(config);
    const equipmentSlots = this.calculateEquipmentSlots(equipment);
    
    const byLocation = this.distributeSlotsByLocation(config, equipment);
    
    const total = systemSlots + specialSlots + equipmentSlots;
    const totalAvailable = this.getTotalAvailableSlots(config);
    
    return {
      total,
      byLocation,
      byComponent: {
        systemComponents: systemSlots,
        specialComponents: specialSlots,
        equipment: equipmentSlots - this.getAmmoSlots(equipment),
        ammunition: this.getAmmoSlots(equipment)
      },
      critical: total > totalAvailable
    };
  }
  
  calculateAvailableSlots(config: UnitConfiguration): AvailableSlots {
    const baseSlots = { ...this.STANDARD_SLOT_COUNTS };
    
    // Adjust for unit type variations
    if (config.unitType === 'IndustrialMech') {
      // Industrial mechs have different slot counts
      baseSlots.head = 4;
    }
    
    const systemSlots = this.calculateSystemComponentSlots(config);
    const specialSlots = this.calculateSpecialComponentSlots(config);
    const totalReserved = systemSlots + specialSlots;
    
    const total = Object.values(baseSlots).reduce((sum, slots) => sum + slots, 0);
    
    return {
      total,
      byLocation: baseSlots,
      reserved: {
        systemComponents: systemSlots,
        specialComponents: specialSlots
      },
      usable: total - totalReserved
    };
  }
  
  calculateSlotUtilization(config: UnitConfiguration, equipment: any[]): SlotUtilization {
    const available = this.calculateAvailableSlots(config);
    const required = this.calculateRequiredSlots(config, equipment);
    
    const totalUsed = required.total;
    const totalAvailable = available.total;
    const percentageUsed = (totalUsed / totalAvailable) * 100;
    
    const byLocation: { [location: string]: any } = {};
    const bottlenecks: string[] = [];
    
    Object.keys(available.byLocation).forEach(location => {
      const used = required.byLocation[location as keyof typeof required.byLocation];
      const capacity = available.byLocation[location as keyof typeof available.byLocation];
      const percentage = (used / capacity) * 100;
      
      let efficiency: SlotUtilization['byLocation'][string]['efficiency'];
      if (percentage <= 60) efficiency = 'excellent';
      else if (percentage <= 75) efficiency = 'good';
      else if (percentage <= 85) efficiency = 'fair';
      else if (percentage <= 95) efficiency = 'poor';
      else efficiency = 'critical';
      
      byLocation[location] = {
        used,
        available: capacity,
        percentage,
        efficiency
      };
      
      if (percentage > 90) {
        bottlenecks.push(location);
      }
    });
    
    const recommendations = this.generateUtilizationRecommendations(byLocation, bottlenecks);
    
    return {
      percentageUsed,
      totalUsed,
      totalAvailable,
      byLocation,
      bottlenecks,
      recommendations
    };
  }
  
  // ===== ALLOCATION METHODS =====
  
  allocateEquipmentSlots(config: UnitConfiguration, equipment: any[]): AllocationResult {
    const allocations: EquipmentAllocation[] = [];
    const unallocated: any[] = [];
    const conflicts: SlotConflict[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Start with system components
    const systemAllocations = this.allocateSystemComponents(config);
    allocations.push(...systemAllocations);
    
    // Allocate special components
    const specialAllocations = this.allocateSpecialComponentsToSlots(config);
    allocations.push(...specialAllocations.allocations);
    conflicts.push(...specialAllocations.conflicts);
    
    // Allocate equipment
    for (const item of equipment) {
      const result = this.allocateSingleEquipment(item, config, allocations);
      
      if (result.success && result.allocation) {
        allocations.push(result.allocation);
      } else {
        unallocated.push(item);
        conflicts.push(...result.conflicts);
      }
      
      warnings.push(...result.warnings);
    }
    
    // Generate suggestions for improvements
    suggestions.push(...this.generateAllocationSuggestions(config, allocations, unallocated));
    
    return {
      success: unallocated.length === 0 && conflicts.length === 0,
      allocations,
      unallocated,
      conflicts,
      warnings,
      suggestions
    };
  }
  
  optimizeSlotAllocation(config: UnitConfiguration, equipment: any[]): OptimizationResult {
    const originalResult = this.allocateEquipmentSlots(config, equipment);
    const originalAllocations = originalResult.allocations;
    
    // Try different optimization strategies
    const strategies = [
      this.optimizeByLocation,
      this.optimizeBySize,
      this.optimizeByType,
      this.optimizeSpecialComponents
    ];
    
    let bestResult = originalResult;
    let bestScore = this.calculateAllocationScore(originalResult);
    
    for (const strategy of strategies) {
      const optimizedResult = strategy.call(this, config, equipment, originalAllocations);
      const score = this.calculateAllocationScore(optimizedResult);
      
      if (score > bestScore) {
        bestResult = optimizedResult;
        bestScore = score;
      }
    }
    
    const improvements = this.calculateImprovements(originalResult, bestResult);
    const recommendations = this.generateOptimizationRecommendations(improvements);
    
    return {
      optimized: bestScore > this.calculateAllocationScore(originalResult),
      originalAllocations,
      optimizedAllocations: bestResult.allocations,
      improvements,
      recommendations
    };
  }
  
  validateSlotAllocation(config: UnitConfiguration, equipment: any[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];
    const locationStatus: { [location: string]: any } = {};
    
    const allocation = this.allocateEquipmentSlots(config, equipment);
    const available = this.calculateAvailableSlots(config);
    
    // Validate each location
    Object.keys(available.byLocation).forEach(location => {
      const capacity = available.byLocation[location as keyof typeof available.byLocation];
      const used = this.getUsedSlotsInLocation(allocation.allocations, location);
      const conflicts = allocation.conflicts.filter(c => c.location === location);
      
      locationStatus[location] = {
        valid: used <= capacity && conflicts.length === 0,
        used,
        capacity,
        conflicts: conflicts.map(c => c.type)
      };
      
      // Check for overflow
      if (used > capacity) {
        errors.push({
          type: 'slot_overflow',
          location,
          component: 'Multiple',
          message: `Location ${location} has ${used} slots used but only ${capacity} available`,
          severity: 'high'
        });
      }
      
      // Check for near-capacity usage
      if (used / capacity > 0.9 && used <= capacity) {
        warnings.push({
          type: 'inefficient_placement',
          location,
          component: 'Multiple',
          message: `Location ${location} is near capacity (${Math.round(used / capacity * 100)}%)`,
          recommendation: 'Consider moving some equipment to other locations'
        });
      }
    });
    
    // Validate BattleTech rules
    this.validateBattleTechRules(config, allocation, errors, warnings);
    
    // Generate improvement suggestions
    suggestions.push(...this.generateValidationSuggestions(errors, warnings));
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      locationStatus
    };
  }
  
  // ===== SPECIAL COMPONENT HANDLING =====
  
  allocateSpecialComponents(config: UnitConfiguration): SpecialComponentAllocation {
    const endoSteel = this.calculateEndoSteelSlots(config);
    const ferroFibrous = this.calculateFerroFibrousSlots(config);
    
    // Handle other special components (CASE, Artemis, etc.)
    const altri = this.allocateOtherSpecialComponents(config);
    
    return {
      endoSteel: {
        required: this.getEndoSteelRequirement(config),
        allocated: endoSteel,
        conflicts: this.detectEndoSteelConflicts(config, endoSteel)
      },
      ferroFibrous: {
        required: this.getFerroFibrousRequirement(config),
        allocated: ferroFibrous,
        conflicts: this.detectFerroFibrousConflicts(config, ferroFibrous)
      },
      altri: {
        required: this.getOtherSpecialRequirements(config),
        allocated: altri,
        conflicts: this.detectOtherSpecialConflicts(config, altri)
      }
    };
  }
  
  calculateEndoSteelSlots(config: UnitConfiguration): EndoSteelSlotAllocation {
    const structureType = this.extractComponentType(config.structureType);
    
    if (structureType !== 'Endo Steel' && structureType !== 'Endo Steel (Clan)') {
      return {
        total: 0,
        allocations: {},
        isComplete: true,
        remainingSlots: 0
      };
    }
    
    const requiredSlots = structureType === 'Endo Steel (Clan)' ? 7 : 14;
    const allocations = this.distributeEndoSteelSlots(requiredSlots, config);
    
    const totalAllocated = Object.values(allocations).reduce((sum, alloc) => sum + alloc.count, 0);
    
    return {
      total: requiredSlots,
      allocations,
      isComplete: totalAllocated >= requiredSlots,
      remainingSlots: Math.max(0, requiredSlots - totalAllocated)
    };
  }
  
  calculateFerroFibrousSlots(config: UnitConfiguration): FerroFibrousSlotAllocation {
    const armorType = this.extractComponentType(config.armorType);
    
    if (armorType !== 'Ferro-Fibrous' && armorType !== 'Ferro-Fibrous (Clan)') {
      return {
        total: 0,
        allocations: {},
        isComplete: true,
        remainingSlots: 0
      };
    }
    
    const requiredSlots = armorType === 'Ferro-Fibrous (Clan)' ? 7 : 14;
    const allocations = this.distributeFerroFibrousSlots(requiredSlots, config);
    
    const totalAllocated = Object.values(allocations).reduce((sum, alloc) => sum + alloc.count, 0);
    
    return {
      total: requiredSlots,
      allocations,
      isComplete: totalAllocated >= requiredSlots,
      remainingSlots: Math.max(0, requiredSlots - totalAllocated)
    };
  }
  
  // ===== CONFLICT DETECTION AND RESOLUTION =====
  
  detectSlotConflicts(config: UnitConfiguration, equipment: any[]): SlotConflict[] {
    const conflicts: SlotConflict[] = [];
    const allocation = this.allocateEquipmentSlots(config, equipment);
    
    // Check for slot overlaps
    conflicts.push(...this.detectSlotOverlaps(allocation.allocations));
    
    // Check for capacity violations
    conflicts.push(...this.detectCapacityViolations(config, allocation.allocations));
    
    // Check for rule violations
    conflicts.push(...this.detectRuleViolations(config, allocation.allocations));
    
    return conflicts;
  }
  
  resolveSlotConflicts(conflicts: SlotConflict[]): ConflictResolution {
    const resolved: SlotConflict[] = [];
    const unresolved: SlotConflict[] = [];
    const newAllocations: EquipmentAllocation[] = [];
    
    for (const conflict of conflicts) {
      if (conflict.resolvable) {
        const resolution = this.resolveSingleConflict(conflict);
        if (resolution.success) {
          resolved.push(conflict);
          newAllocations.push(...resolution.allocations);
        } else {
          unresolved.push(conflict);
        }
      } else {
        unresolved.push(conflict);
      }
    }
    
    return {
      resolved,
      unresolved,
      newAllocations,
      success: unresolved.length === 0,
      explanation: this.generateResolutionExplanation(resolved, unresolved)
    };
  }
  
  suggestSlotReorganization(config: UnitConfiguration, equipment: any[]): ReorganizationSuggestion[] {
    const suggestions: ReorganizationSuggestion[] = [];
    const utilization = this.calculateSlotUtilization(config, equipment);
    
    // Suggest moving equipment from bottleneck locations
    for (const bottleneck of utilization.bottlenecks) {
      suggestions.push(...this.generateBottleneckSuggestions(bottleneck, config, equipment));
    }
    
    // Suggest optimizing special component placement
    suggestions.push(...this.generateSpecialComponentSuggestions(config));
    
    // Suggest equipment consolidation
    suggestions.push(...this.generateConsolidationSuggestions(equipment));
    
    return suggestions.filter(s => s.feasible);
  }
  
  // ===== ANALYSIS AND REPORTING =====
  
  analyzeSlotEfficiency(config: UnitConfiguration, equipment: any[]): EfficiencyAnalysis {
    const utilization = this.calculateSlotUtilization(config, equipment);
    const allocation = this.allocateEquipmentSlots(config, equipment);
    
    const locationEfficiency: { [location: string]: any } = {};
    let totalEfficiency = 0;
    
    Object.keys(utilization.byLocation).forEach(location => {
      const locationData = utilization.byLocation[location];
      const wastedSlots = this.calculateWastedSlots(location, allocation.allocations);
      
      const efficiency = Math.max(0, 100 - wastedSlots * 10 - (100 - locationData.percentage) * 0.5);
      
      locationEfficiency[location] = {
        efficiency,
        utilization: locationData.percentage,
        wastedSlots,
        suggestions: this.generateLocationSuggestions(location, locationData, wastedSlots)
      };
      
      totalEfficiency += efficiency;
    });
    
    const overallEfficiency = totalEfficiency / Object.keys(locationEfficiency).length;
    const optimizationPotential = this.calculateOptimizationPotential(locationEfficiency);
    const recommendations = this.generateEfficiencyRecommendations(locationEfficiency, overallEfficiency);
    
    return {
      overallEfficiency,
      locationEfficiency,
      bottlenecks: utilization.bottlenecks,
      optimizationPotential,
      recommendations
    };
  }
  
  generateSlotReport(config: UnitConfiguration, equipment: any[]): SlotReport {
    const available = this.calculateAvailableSlots(config);
    const required = this.calculateRequiredSlots(config, equipment);
    const allocation = this.allocateEquipmentSlots(config, equipment);
    const specialComponents = this.allocateSpecialComponents(config);
    const conflicts = this.detectSlotConflicts(config, equipment);
    
    const summary = {
      totalSlots: available.total,
      usedSlots: required.total,
      availableSlots: available.total - required.total,
      utilization: (required.total / available.total) * 100,
      efficiency: this.calculateOverallEfficiency(config, equipment)
    };
    
    const locationBreakdown: { [location: string]: any } = {};
    
    Object.keys(available.byLocation).forEach(location => {
      const capacity = available.byLocation[location as keyof typeof available.byLocation];
      const used = required.byLocation[location as keyof typeof required.byLocation];
      const equipment = this.getEquipmentInLocation(allocation.allocations, location);
      const special = this.getSpecialComponentsInLocation(specialComponents, location);
      const locationConflicts = conflicts.filter(c => c.location === location).map(c => c.type);
      
      locationBreakdown[location] = {
        capacity,
        used,
        available: capacity - used,
        equipment,
        specialComponents: special,
        conflicts: locationConflicts
      };
    });
    
    const recommendations = this.generateReportRecommendations(summary, locationBreakdown, conflicts);
    
    return {
      summary,
      locationBreakdown,
      specialComponents,
      conflicts,
      recommendations
    };
  }
  
  findAvailableSlots(config: UnitConfiguration, equipment: any[], requiredSlots: number): AvailableSlotLocation[] {
    const allocation = this.allocateEquipmentSlots(config, equipment);
    const available = this.calculateAvailableSlots(config);
    const locations: AvailableSlotLocation[] = [];
    
    Object.keys(available.byLocation).forEach(location => {
      const capacity = available.byLocation[location as keyof typeof available.byLocation];
      const used = this.getUsedSlotsInLocation(allocation.allocations, location);
      const availableSlots = this.getAvailableSlotNumbers(location, capacity, used);
      
      if (availableSlots.length >= requiredSlots) {
        const contiguous = this.hasContiguousSlots(availableSlots, requiredSlots);
        const suitableFor = this.getSuitableEquipmentTypes(location);
        const restrictions = this.getLocationRestrictions(location, config);
        
        locations.push({
          location,
          availableSlots,
          contiguous,
          suitableFor,
          restrictions
        });
      }
    });
    
    return locations.sort((a, b) => b.availableSlots.length - a.availableSlots.length);
  }
  
  // ===== PRIVATE HELPER METHODS =====
  
  private extractComponentType(component: ComponentConfiguration | string): string {
    if (typeof component === 'string') return component;
    return component.type;
  }
  
  private calculateSystemComponentSlots(config: UnitConfiguration): number {
    // System components (engine, gyro, cockpit) take slots
    const engineSlots = this.getEngineSlots(config.engineType);
    const gyroSlots = this.getGyroSlots(this.extractComponentType(config.gyroType));
    const cockpitSlots = 5; // Standard cockpit
    
    return engineSlots + gyroSlots + cockpitSlots;
  }
  
  private calculateSpecialComponentSlots(config: UnitConfiguration): number {
    let slots = 0;
    
    // Endo Steel structure
    const structureType = this.extractComponentType(config.structureType);
    if (structureType === 'Endo Steel') slots += 14;
    else if (structureType === 'Endo Steel (Clan)') slots += 7;
    
    // Ferro-Fibrous armor
    const armorType = this.extractComponentType(config.armorType);
    if (armorType === 'Ferro-Fibrous') slots += 14;
    else if (armorType === 'Ferro-Fibrous (Clan)') slots += 7;
    
    return slots;
  }
  
  private calculateEquipmentSlots(equipment: any[]): number {
    return equipment.reduce((total, item) => {
      if (!item?.equipmentData) return total;
      const slotsPerItem = item.equipmentData.criticals || 1;
      const quantity = item.quantity || 1;
      return total + (slotsPerItem * quantity);
    }, 0);
  }
  
  private getAmmoSlots(equipment: any[]): number {
    return equipment.reduce((total, item) => {
      if (!item?.equipmentData || item.equipmentData.type !== 'ammunition') return total;
      const slotsPerItem = item.equipmentData.criticals || 1;
      const quantity = item.quantity || 1;
      return total + (slotsPerItem * quantity);
    }, 0);
  }
  
  private distributeSlotsByLocation(config: UnitConfiguration, equipment: any[]) {
    // Simplified distribution logic - in reality this would be much more complex
    const totalSlots = this.calculateRequiredSlots(config, equipment).total;
    const locations = Object.keys(this.STANDARD_SLOT_COUNTS);
    const slotsPerLocation = Math.ceil(totalSlots / locations.length);
    
    const distribution: any = {};
    locations.forEach(location => {
      distribution[location] = Math.min(slotsPerLocation, this.STANDARD_SLOT_COUNTS[location as keyof typeof this.STANDARD_SLOT_COUNTS]);
    });
    
    return distribution;
  }
  
  private getTotalAvailableSlots(config: UnitConfiguration): number {
    return Object.values(this.STANDARD_SLOT_COUNTS).reduce((sum, slots) => sum + slots, 0);
  }
  
  private getEngineSlots(engineType: string): number {
    switch (engineType) {
      case 'Standard': return 6;
      case 'XL': return 12;
      case 'Light': return 10;
      case 'XXL': return 18;
      case 'Compact': return 3;
      case 'ICE':
      case 'Fuel Cell': return 6;
      default: return 6;
    }
  }
  
  private getGyroSlots(gyroType: string): number {
    switch (gyroType) {
      case 'Standard': return 4;
      case 'XL': return 6;
      case 'Compact': return 2;
      case 'Heavy-Duty': return 4;
      default: return 4;
    }
  }
  
  private generateUtilizationRecommendations(byLocation: any, bottlenecks: string[]): string[] {
    const recommendations: string[] = [];
    
    if (bottlenecks.length > 0) {
      recommendations.push(`Critical slot usage in: ${bottlenecks.join(', ')}`);
      recommendations.push('Consider moving equipment to less utilized locations');
    }
    
    return recommendations;
  }
  
  private allocateSystemComponents(config: UnitConfiguration): EquipmentAllocation[] {
    const allocations: EquipmentAllocation[] = [];
    
    // Simplified system component allocation
    allocations.push({
      equipment: { equipmentData: { name: 'Engine' } },
      location: 'centerTorso',
      slots: [0, 1, 2, 7, 8, 9],
      validated: true,
      conflicts: []
    });
    
    allocations.push({
      equipment: { equipmentData: { name: 'Gyro' } },
      location: 'centerTorso',
      slots: [3, 4, 5, 6],
      validated: true,
      conflicts: []
    });
    
    return allocations;
  }
  
  private allocateSpecialComponentsToSlots(config: UnitConfiguration): { allocations: EquipmentAllocation[], conflicts: SlotConflict[] } {
    const allocations: EquipmentAllocation[] = [];
    const conflicts: SlotConflict[] = [];
    
    const endoSteel = this.calculateEndoSteelSlots(config);
    const ferroFibrous = this.calculateFerroFibrousSlots(config);
    
    // Add allocations for special components
    if (endoSteel.total > 0) {
      Object.entries(endoSteel.allocations).forEach(([location, alloc]) => {
        allocations.push({
          equipment: { equipmentData: { name: 'Endo Steel' } },
          location,
          slots: alloc.slots,
          validated: true,
          conflicts: []
        });
      });
    }
    
    return { allocations, conflicts };
  }
  
  private allocateSingleEquipment(item: any, config: UnitConfiguration, existingAllocations: EquipmentAllocation[]): { success: boolean, allocation?: EquipmentAllocation, conflicts: SlotConflict[], warnings: string[] } {
    const conflicts: SlotConflict[] = [];
    const warnings: string[] = [];
    
    if (!item?.equipmentData) {
      return { success: false, conflicts, warnings };
    }
    
    const requiredSlots = item.equipmentData.criticals || 1;
    const suitableLocations = this.getSuitableLocations(item, config);
    
    for (const location of suitableLocations) {
      const availableSlots = this.findAvailableSlotsInLocation(location, requiredSlots, existingAllocations);
      
      if (availableSlots.length >= requiredSlots) {
        const allocation: EquipmentAllocation = {
          equipment: item,
          location,
          slots: availableSlots.slice(0, requiredSlots),
          validated: true,
          conflicts: []
        };
        
        return { success: true, allocation, conflicts, warnings };
      }
    }
    
    return { success: false, conflicts, warnings };
  }
  
  private generateAllocationSuggestions(config: UnitConfiguration, allocations: EquipmentAllocation[], unallocated: any[]): string[] {
    const suggestions: string[] = [];
    
    if (unallocated.length > 0) {
      suggestions.push(`${unallocated.length} items could not be allocated`);
      suggestions.push('Consider using advanced structure types to free up slots');
    }
    
    return suggestions;
  }
  
  private optimizeByLocation(config: UnitConfiguration, equipment: any[], allocations: EquipmentAllocation[]): AllocationResult {
    // Simplified optimization - return original result
    return this.allocateEquipmentSlots(config, equipment);
  }
  
  private optimizeBySize(config: UnitConfiguration, equipment: any[], allocations: EquipmentAllocation[]): AllocationResult {
    return this.allocateEquipmentSlots(config, equipment);
  }
  
  private optimizeByType(config: UnitConfiguration, equipment: any[], allocations: EquipmentAllocation[]): AllocationResult {
    return this.allocateEquipmentSlots(config, equipment);
  }
  
  private optimizeSpecialComponents(config: UnitConfiguration, equipment: any[], allocations: EquipmentAllocation[]): AllocationResult {
    return this.allocateEquipmentSlots(config, equipment);
  }
  
  private calculateAllocationScore(result: AllocationResult): number {
    let score = 0;
    score += result.allocations.length * 10;
    score -= result.conflicts.length * 20;
    score -= result.unallocated.length * 15;
    return Math.max(0, score);
  }
  
  private calculateImprovements(original: AllocationResult, optimized: AllocationResult): any {
    return {
      slotsFreed: optimized.allocations.length - original.allocations.length,
      conflictsResolved: original.conflicts.length - optimized.conflicts.length,
      efficiencyGain: this.calculateAllocationScore(optimized) - this.calculateAllocationScore(original)
    };
  }
  
  private generateOptimizationRecommendations(improvements: any): string[] {
    const recommendations: string[] = [];
    
    if (improvements.slotsFreed > 0) {
      recommendations.push(`Freed ${improvements.slotsFreed} critical slots`);
    }
    
    if (improvements.conflictsResolved > 0) {
      recommendations.push(`Resolved ${improvements.conflictsResolved} conflicts`);
    }
    
    return recommendations;
  }
  
  private getUsedSlotsInLocation(allocations: EquipmentAllocation[], location: string): number {
    return allocations
      .filter(alloc => alloc.location === location)
      .reduce((total, alloc) => total + alloc.slots.length, 0);
  }
  
  private validateBattleTechRules(config: UnitConfiguration, allocation: AllocationResult, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Add BattleTech-specific validation rules
    // This is simplified - real implementation would check many more rules
  }
  
  private generateValidationSuggestions(errors: ValidationError[], warnings: ValidationWarning[]): string[] {
    const suggestions: string[] = [];
    
    if (errors.length > 0) {
      suggestions.push('Fix critical errors before proceeding');
    }
    
    if (warnings.length > 0) {
      suggestions.push('Consider addressing warnings for optimal design');
    }
    
    return suggestions;
  }
  
  private allocateOtherSpecialComponents(config: UnitConfiguration): { [location: string]: number[] } {
    return {}; // Simplified implementation
  }
  
  private getEndoSteelRequirement(config: UnitConfiguration): number {
    const structureType = this.extractComponentType(config.structureType);
    if (structureType === 'Endo Steel') return 14;
    if (structureType === 'Endo Steel (Clan)') return 7;
    return 0;
  }
  
  private detectEndoSteelConflicts(config: UnitConfiguration, allocation: EndoSteelSlotAllocation): string[] {
    return []; // Simplified implementation
  }
  
  private getFerroFibrousRequirement(config: UnitConfiguration): number {
    const armorType = this.extractComponentType(config.armorType);
    if (armorType === 'Ferro-Fibrous') return 14;
    if (armorType === 'Ferro-Fibrous (Clan)') return 7;
    return 0;
  }
  
  private detectFerroFibrousConflicts(config: UnitConfiguration, allocation: FerroFibrousSlotAllocation): string[] {
    return []; // Simplified implementation
  }
  
  private getOtherSpecialRequirements(config: UnitConfiguration): number {
    return 0; // Simplified implementation
  }
  
  private detectOtherSpecialConflicts(config: UnitConfiguration, allocation: { [location: string]: number[] }): string[] {
    return []; // Simplified implementation
  }
  
  private distributeEndoSteelSlots(requiredSlots: number, config: UnitConfiguration): { [location: string]: { slots: number[], count: number } } {
    const allocations: { [location: string]: { slots: number[], count: number } } = {};
    
    // Simplified distribution logic
    const locations = Object.keys(this.STANDARD_SLOT_COUNTS);
    const slotsPerLocation = Math.ceil(requiredSlots / locations.length);
    
    locations.forEach(location => {
      const capacity = this.STANDARD_SLOT_COUNTS[location as keyof typeof this.STANDARD_SLOT_COUNTS];
      const allocatedSlots = Math.min(slotsPerLocation, capacity, requiredSlots);
      
      if (allocatedSlots > 0) {
        allocations[location] = {
          slots: Array.from({ length: allocatedSlots }, (_, i) => capacity - allocatedSlots + i),
          count: allocatedSlots
        };
        requiredSlots -= allocatedSlots;
      }
    });
    
    return allocations;
  }
  
  private distributeFerroFibrousSlots(requiredSlots: number, config: UnitConfiguration): { [location: string]: { slots: number[], count: number } } {
    return this.distributeEndoSteelSlots(requiredSlots, config); // Same logic for now
  }
  
  private detectSlotOverlaps(allocations: EquipmentAllocation[]): SlotConflict[] {
    const conflicts: SlotConflict[] = [];
    const usedSlots: { [location: string]: { [slot: number]: string[] } } = {};
    
    allocations.forEach(allocation => {
      if (!usedSlots[allocation.location]) {
        usedSlots[allocation.location] = {};
      }
      
      allocation.slots.forEach(slot => {
        if (!usedSlots[allocation.location][slot]) {
          usedSlots[allocation.location][slot] = [];
        }
        usedSlots[allocation.location][slot].push(allocation.equipment?.equipmentData?.name || 'Unknown');
        
        if (usedSlots[allocation.location][slot].length > 1) {
          conflicts.push({
            type: 'overlap',
            location: allocation.location,
            slot,
            conflictingComponents: usedSlots[allocation.location][slot],
            severity: 'critical',
            resolvable: true,
            suggestions: ['Move one component to a different location']
          });
        }
      });
    });
    
    return conflicts;
  }
  
  private detectCapacityViolations(config: UnitConfiguration, allocations: EquipmentAllocation[]): SlotConflict[] {
    const conflicts: SlotConflict[] = [];
    
    Object.keys(this.STANDARD_SLOT_COUNTS).forEach(location => {
      const capacity = this.STANDARD_SLOT_COUNTS[location as keyof typeof this.STANDARD_SLOT_COUNTS];
      const used = this.getUsedSlotsInLocation(allocations, location);
      
      if (used > capacity) {
        conflicts.push({
          type: 'capacity_exceeded',
          location,
          slot: -1,
          conflictingComponents: ['Multiple'],
          severity: 'critical',
          resolvable: true,
          suggestions: ['Move equipment to other locations']
        });
      }
    });
    
    return conflicts;
  }
  
  private detectRuleViolations(config: UnitConfiguration, allocations: EquipmentAllocation[]): SlotConflict[] {
    return []; // Simplified implementation
  }
  
  private resolveSingleConflict(conflict: SlotConflict): { success: boolean, allocations: EquipmentAllocation[] } {
    return { success: false, allocations: [] }; // Simplified implementation
  }
  
  private generateResolutionExplanation(resolved: SlotConflict[], unresolved: SlotConflict[]): string {
    return `Resolved ${resolved.length} conflicts, ${unresolved.length} remain unresolved`;
  }
  
  private generateBottleneckSuggestions(bottleneck: string, config: UnitConfiguration, equipment: any[]): ReorganizationSuggestion[] {
    return [{
      type: 'move_equipment',
      component: 'Heavy equipment',
      fromLocation: bottleneck,
      toLocation: 'centerTorso',
      benefit: 'Reduce bottleneck pressure',
      impact: 'minor',
      feasible: true
    }];
  }
  
  private generateSpecialComponentSuggestions(config: UnitConfiguration): ReorganizationSuggestion[] {
    return []; // Simplified implementation
  }
  
  private generateConsolidationSuggestions(equipment: any[]): ReorganizationSuggestion[] {
    return []; // Simplified implementation
  }
  
  private calculateWastedSlots(location: string, allocations: EquipmentAllocation[]): number {
    // Calculate slots that could be better utilized
    return 0; // Simplified implementation
  }
  
  private generateLocationSuggestions(location: string, locationData: any, wastedSlots: number): string[] {
    const suggestions: string[] = [];
    
    if (wastedSlots > 0) {
      suggestions.push(`${wastedSlots} slots could be better utilized in ${location}`);
    }
    
    return suggestions;
  }
  
  private calculateOptimizationPotential(locationEfficiency: any): number {
    const efficiencies = Object.values(locationEfficiency).map((loc: any) => loc.efficiency);
    const averageEfficiency = efficiencies.reduce((sum: number, eff: any) => sum + eff, 0) / efficiencies.length;
    return Math.max(0, 100 - averageEfficiency);
  }
  
  private generateEfficiencyRecommendations(locationEfficiency: any, overallEfficiency: number): string[] {
    const recommendations: string[] = [];
    
    if (overallEfficiency < 70) {
      recommendations.push('Consider reorganizing equipment placement for better efficiency');
    }
    
    return recommendations;
  }
  
  private calculateOverallEfficiency(config: UnitConfiguration, equipment: any[]): string {
    const utilization = this.calculateSlotUtilization(config, equipment);
    
    if (utilization.percentageUsed < 60) return 'excellent';
    if (utilization.percentageUsed < 75) return 'good';
    if (utilization.percentageUsed < 90) return 'fair';
    return 'poor';
  }
  
  private getEquipmentInLocation(allocations: EquipmentAllocation[], location: string): string[] {
    return allocations
      .filter(alloc => alloc.location === location)
      .map(alloc => alloc.equipment?.equipmentData?.name || 'Unknown');
  }
  
  private getSpecialComponentsInLocation(specialComponents: SpecialComponentAllocation, location: string): string[] {
    const components: string[] = [];
    
    if (specialComponents.endoSteel.allocated.allocations[location]) {
      components.push('Endo Steel');
    }
    
    if (specialComponents.ferroFibrous.allocated.allocations[location]) {
      components.push('Ferro-Fibrous');
    }
    
    return components;
  }
  
  private generateReportRecommendations(summary: any, locationBreakdown: any, conflicts: SlotConflict[]): string[] {
    const recommendations: string[] = [];
    
    if (summary.utilization > 90) {
      recommendations.push('Critical slot usage is very high - consider weight optimization');
    }
    
    if (conflicts.length > 0) {
      recommendations.push('Resolve slot conflicts before finalizing design');
    }
    
    return recommendations;
  }
  
  private getAvailableSlotNumbers(location: string, capacity: number, usedCount: number): number[] {
    const availableSlots: number[] = [];
    
    for (let i = 0; i < capacity; i++) {
      // Simplified - in reality would check actual slot usage
      if (i >= usedCount) {
        availableSlots.push(i);
      }
    }
    
    return availableSlots;
  }
  
  private hasContiguousSlots(availableSlots: number[], requiredSlots: number): boolean {
    if (availableSlots.length < requiredSlots) return false;
    
    for (let i = 0; i <= availableSlots.length - requiredSlots; i++) {
      let contiguous = true;
      for (let j = 1; j < requiredSlots; j++) {
        if (availableSlots[i + j] !== availableSlots[i + j - 1] + 1) {
          contiguous = false;
          break;
        }
      }
      if (contiguous) return true;
    }
    
    return false;
  }
  
  private getSuitableEquipmentTypes(location: string): string[] {
    switch (location) {
      case 'head':
        return ['sensors', 'cockpit_equipment'];
      case 'centerTorso':
        return ['engine', 'gyro', 'weapons', 'equipment'];
      case 'leftTorso':
      case 'rightTorso':
        return ['weapons', 'equipment', 'ammunition'];
      case 'leftArm':
      case 'rightArm':
        return ['weapons', 'equipment'];
      case 'leftLeg':
      case 'rightLeg':
        return ['equipment', 'heat_sinks'];
      default:
        return ['equipment'];
    }
  }
  
  private getLocationRestrictions(location: string, config: UnitConfiguration): string[] {
    const restrictions: string[] = [];
    
    if (location === 'head') {
      restrictions.push('Limited to 1 ton equipment');
      restrictions.push('No ammunition allowed');
    }
    
    return restrictions;
  }
  
  private getSuitableLocations(item: any, config: UnitConfiguration): string[] {
    // Simplified location suitability logic
    const allLocations = Object.keys(this.STANDARD_SLOT_COUNTS);
    
    if (item.equipmentData?.type === 'ammunition' && item.equipmentData?.explosive) {
      // Avoid head for explosive ammunition
      return allLocations.filter(loc => loc !== 'head');
    }
    
    return allLocations;
  }
  
  private findAvailableSlotsInLocation(location: string, requiredSlots: number, existingAllocations: EquipmentAllocation[]): number[] {
    const capacity = this.STANDARD_SLOT_COUNTS[location as keyof typeof this.STANDARD_SLOT_COUNTS];
    const usedSlots = new Set<number>();
    
    existingAllocations
      .filter(alloc => alloc.location === location)
      .forEach(alloc => alloc.slots.forEach(slot => usedSlots.add(slot)));
    
    const availableSlots: number[] = [];
    for (let i = 0; i < capacity; i++) {
      if (!usedSlots.has(i)) {
        availableSlots.push(i);
      }
    }
    
    return availableSlots;
  }
}

// Export factory function for dependency injection
export const createCriticalSlotCalculator = (): CriticalSlotCalculator => {
  return new CriticalSlotCalculatorImpl();
};
