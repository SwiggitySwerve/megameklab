/**
 * CriticalSlotRulesValidator - Critical slot allocation and placement validation for BattleTech construction rules
 * 
 * Extracted from ConstructionRulesValidator as part of large file refactoring.
 * Handles critical slot validation, component placement rules, and location-specific restrictions.
 * 
 * @see TECHNICAL_ARCHITECTURE.md for service architecture patterns
 */

import { UnitConfiguration } from '../../utils/criticalSlots/UnitCriticalManager';
import { ComponentConfiguration } from '../../types/componentConfiguration';
import { calculateInternalHeatSinks } from '../../utils/heatSinkCalculations';

export interface CriticalSlotValidation {
  isValid: boolean;
  totalSlotsUsed: number;
  totalSlotsAvailable: number;
  locationUtilization: { [location: string]: SlotUtilization };
  specialComponentSlots: SpecialComponentSlots;
  placementViolations: PlacementViolation[];
  violations: CriticalSlotViolation[];
  recommendations: string[];
}

export interface SlotUtilization {
  used: number;
  available: number;
  utilization: number;
  overflow: boolean;
  components: ComponentSlotInfo[];
}

export interface ComponentSlotInfo {
  id: string;
  name: string;
  type: string;
  slots: number;
  location: string;
  canRelocate: boolean;
}

export interface SpecialComponentSlots {
  endoSteel: EndoSteelSlots;
  ferroFibrous: FerroFibrousSlots;
  doubleHeatSinks: DoubleHeatSinkSlots;
  artemis: ArtemisSlots;
  targetingComputer: TargetingComputerSlots;
}

export interface EndoSteelSlots {
  required: number;
  allocated: number;
  locations: string[];
  isCompliant: boolean;
}

export interface FerroFibrousSlots {
  required: number;
  allocated: number;
  locations: string[];
  isCompliant: boolean;
}

export interface DoubleHeatSinkSlots {
  engineSlots: number;
  externalSlots: number;
  totalRequired: number;
  isCompliant: boolean;
}

export interface ArtemisSlots {
  required: number;
  allocated: number;
  weaponPairings: ArtemisWeaponPairing[];
  isCompliant: boolean;
}

export interface ArtemisWeaponPairing {
  weapon: string;
  artemisSystem: string;
  location: string;
  isValid: boolean;
}

export interface TargetingComputerSlots {
  required: number;
  allocated: number;
  location: string;
  isCompliant: boolean;
}

export interface PlacementViolation {
  component: string;
  location: string;
  type: 'invalid_location' | 'requires_pairing' | 'location_restricted' | 'special_placement';
  message: string;
  severity: 'critical' | 'major' | 'minor';
  suggestedFix: string;
}

export interface CriticalSlotViolation {
  location: string;
  type: 'overflow' | 'invalid_placement' | 'special_component_violation' | 'missing_requirements';
  component?: string;
  message: string;
  severity: 'critical' | 'major' | 'minor';
  suggestedFix: string;
}

export interface CriticalSlotValidationContext {
  strictMode: boolean;
  validateSpecialComponents: boolean;
  validatePlacement: boolean;
  allowFlexiblePlacement: boolean;
  checkLocationRestrictions: boolean;
}

export interface SlotOptimization {
  recommendations: SlotOptimizationRecommendation[];
  alternativeLayouts: AlternativeSlotLayout[];
  efficiencyImprovements: SlotEfficiencyImprovement[];
}

export interface SlotOptimizationRecommendation {
  type: 'relocate_component' | 'merge_locations' | 'optimize_special_components' | 'balance_utilization';
  description: string;
  component?: string;
  fromLocation?: string;
  toLocation?: string;
  benefit: string;
  difficulty: 'easy' | 'moderate' | 'hard';
  priority: 'high' | 'medium' | 'low';
}

export interface AlternativeSlotLayout {
  name: string;
  description: string;
  changes: SlotLayoutChange[];
  benefits: string[];
  tradeoffs: string[];
  efficiency: number;
}

export interface SlotLayoutChange {
  component: string;
  fromLocation: string;
  toLocation: string;
  reason: string;
}

export interface SlotEfficiencyImprovement {
  location: string;
  currentUtilization: number;
  improvedUtilization: number;
  improvement: number;
  suggestions: string[];
}

export class CriticalSlotRulesValidator {
  private static readonly DEFAULT_CONTEXT: CriticalSlotValidationContext = {
    strictMode: false,
    validateSpecialComponents: true,
    validatePlacement: true,
    allowFlexiblePlacement: false,
    checkLocationRestrictions: true
  };

  // Standard slot counts by location for bipedal mechs
  private static readonly LOCATION_SLOT_COUNTS = {
    'head': 6,
    'centerTorso': 12,
    'leftTorso': 12,
    'rightTorso': 12,
    'leftArm': 12,
    'rightArm': 12,
    'leftLeg': 6,
    'rightLeg': 6
  };

  // Special component slot requirements
  private static readonly SPECIAL_COMPONENT_REQUIREMENTS = {
    'endoSteel': 14, // 14 slots spread across multiple locations
    'ferroFibrous': 14, // 14 slots spread across multiple locations
    'doubleHeatSink': 3, // 3 slots each for external double heat sinks
    'artemis': 1, // 1 slot per Artemis system
    'targetingComputer': (tonnage: number) => Math.ceil(tonnage / 10) // 1 slot per 10 tons
  };

  /**
   * Validate critical slot allocation and placement
   */
  static validateCriticalSlots(
    config: UnitConfiguration, 
    equipment: any[], 
    context: Partial<CriticalSlotValidationContext> = {}
  ): CriticalSlotValidation {
    const ctx = { ...this.DEFAULT_CONTEXT, ...context };
    const violations: CriticalSlotViolation[] = [];
    const placementViolations: PlacementViolation[] = [];
    const recommendations: string[] = [];
    
    // Calculate slot utilization by location
    const locationUtilization = this.calculateLocationUtilization(config, equipment);
    
    // Calculate total slots
    const totalSlotsAvailable = Object.values(this.LOCATION_SLOT_COUNTS).reduce((sum, count) => sum + count, 0);
    const totalSlotsUsed = Object.values(locationUtilization).reduce((sum, util) => sum + util.used, 0);
    
    // Validate slot overflow in each location
    this.validateSlotOverflow(locationUtilization, violations, recommendations);
    
    // Validate special component requirements
    let specialComponentSlots: SpecialComponentSlots = {
      endoSteel: { required: 0, allocated: 0, locations: [], isCompliant: true },
      ferroFibrous: { required: 0, allocated: 0, locations: [], isCompliant: true },
      doubleHeatSinks: { engineSlots: 0, externalSlots: 0, totalRequired: 0, isCompliant: true },
      artemis: { required: 0, allocated: 0, weaponPairings: [], isCompliant: true },
      targetingComputer: { required: 0, allocated: 0, location: '', isCompliant: true }
    };
    
    if (ctx.validateSpecialComponents) {
      specialComponentSlots = this.validateSpecialComponentSlots(config, equipment, violations, recommendations);
    }
    
    // Validate component placement restrictions
    if (ctx.validatePlacement) {
      this.validateComponentPlacement(equipment, placementViolations, ctx);
    }
    
    // Check location-specific restrictions
    if (ctx.checkLocationRestrictions) {
      this.validateLocationRestrictions(equipment, violations, recommendations);
    }
    
    return {
      isValid: violations.filter(v => v.severity === 'critical').length === 0,
      totalSlotsUsed,
      totalSlotsAvailable,
      locationUtilization,
      specialComponentSlots,
      placementViolations,
      violations,
      recommendations
    };
  }

  /**
   * Calculate slot utilization for each location
   */
  static calculateLocationUtilization(config: UnitConfiguration, equipment: any[]): { [location: string]: SlotUtilization } {
    const utilization: { [location: string]: SlotUtilization } = {};
    
    // Initialize all locations
    Object.entries(this.LOCATION_SLOT_COUNTS).forEach(([location, available]) => {
      utilization[location] = {
        used: 0,
        available,
        utilization: 0,
        overflow: false,
        components: []
      };
    });
    
    // Add system components (engine, gyro, cockpit, structure, armor)
    this.addSystemComponentSlots(config, utilization);
    
    // Add equipment slots
    equipment.forEach(item => {
      const location = item.location || this.getDefaultLocation(item);
      const slots = item.equipmentData?.criticals || this.getComponentSlots(item);
      
      if (utilization[location]) {
        utilization[location].used += slots;
        utilization[location].components.push({
          id: item.id,
          name: item.equipmentData?.name || item.name || 'Unknown',
          type: item.equipmentData?.type || 'equipment',
          slots,
          location,
          canRelocate: this.canRelocateComponent(item)
        });
      }
    });
    
    // Calculate utilization percentages and overflow
    Object.keys(utilization).forEach(location => {
      const util = utilization[location];
      util.utilization = (util.used / util.available) * 100;
      util.overflow = util.used > util.available;
    });
    
    return utilization;
  }

  /**
   * Add system component slots (engine, gyro, etc.)
   */
  private static addSystemComponentSlots(config: UnitConfiguration, utilization: { [location: string]: SlotUtilization }): void {
    const engineRating = config.engineRating || 0;
    const engineType = config.engineType || 'Standard';
    const gyroType = this.extractComponentType(config.gyroType);
    
    // Engine slots (always in center torso)
    const engineSlots = this.getEngineSlots(engineRating, engineType);
    if (utilization.centerTorso) {
      utilization.centerTorso.used += engineSlots;
      utilization.centerTorso.components.push({
        id: 'engine',
        name: `${engineType} Engine ${engineRating}`,
        type: 'engine',
        slots: engineSlots,
        location: 'centerTorso',
        canRelocate: false
      });
    }
    
    // Gyro slots (always in center torso)
    const gyroSlots = this.getGyroSlots(engineRating, gyroType);
    if (utilization.centerTorso) {
      utilization.centerTorso.used += gyroSlots;
      utilization.centerTorso.components.push({
        id: 'gyro',
        name: `${gyroType} Gyro`,
        type: 'gyro',
        slots: gyroSlots,
        location: 'centerTorso',
        canRelocate: false
      });
    }
    
    // Cockpit slots (always in head)
    const cockpitSlots = 1; // Standard cockpit
    if (utilization.head) {
      utilization.head.used += cockpitSlots;
      utilization.head.components.push({
        id: 'cockpit',
        name: 'Cockpit',
        type: 'cockpit',
        slots: cockpitSlots,
        location: 'head',
        canRelocate: false
      });
    }
  }

  /**
   * Get engine slot requirements
   */
  private static getEngineSlots(engineRating: number, engineType: string): number {
    if (engineRating <= 0) return 0;
    
    // Base engine slots
    let slots = 6; // Standard engine takes 6 slots
    
    switch (engineType) {
      case 'XL':
      case 'XL (Clan)':
        slots = 12; // XL engines take more slots (6 center + 3 each side torso)
        break;
      case 'Light':
      case 'Light (Clan)':
        slots = 4; // Light engines take fewer slots
        break;
      case 'Compact':
        slots = 3; // Compact engines take minimal slots
        break;
    }
    
    return slots;
  }

  /**
   * Get gyro slot requirements
   */
  private static getGyroSlots(engineRating: number, gyroType: string): number {
    const baseSlots = 4; // Standard gyro takes 4 slots
    
    switch (gyroType) {
      case 'Compact':
        return 2; // Compact gyro takes 2 slots
      case 'Heavy Duty':
        return 4; // Same as standard
      case 'XL':
        return 6; // XL gyro takes 6 slots
      default:
        return baseSlots;
    }
  }

  /**
   * Validate slot overflow in locations
   */
  private static validateSlotOverflow(
    locationUtilization: { [location: string]: SlotUtilization },
    violations: CriticalSlotViolation[],
    recommendations: string[]
  ): void {
    Object.entries(locationUtilization).forEach(([location, util]) => {
      if (util.overflow) {
        const excess = util.used - util.available;
        violations.push({
          location,
          type: 'overflow',
          message: `Location ${location} has ${util.used} slots used but only ${util.available} available (${excess} excess)`,
          severity: 'critical',
          suggestedFix: `Move ${excess} slot(s) of equipment to other locations`
        });
        
        recommendations.push(`Relocate equipment from ${location} to reduce slot usage by ${excess}`);
      } else if (util.utilization > 90) {
        recommendations.push(`Location ${location} is ${util.utilization.toFixed(1)}% full - consider redistributing equipment`);
      }
    });
  }

  /**
   * Validate special component slot requirements
   */
  private static validateSpecialComponentSlots(
    config: UnitConfiguration, 
    equipment: any[], 
    violations: CriticalSlotViolation[],
    recommendations: string[]
  ): SpecialComponentSlots {
    const specialComponents: SpecialComponentSlots = {
      endoSteel: this.validateEndoSteelSlots(config, violations, recommendations),
      ferroFibrous: this.validateFerroFibrousSlots(config, violations, recommendations),
      doubleHeatSinks: this.validateDoubleHeatSinkSlots(config, equipment, violations, recommendations),
      artemis: this.validateArtemisSlots(equipment, violations, recommendations),
      targetingComputer: this.validateTargetingComputerSlots(config, equipment, violations, recommendations)
    };
    
    return specialComponents;
  }

  /**
   * Validate Endo Steel structure slot requirements
   */
  private static validateEndoSteelSlots(
    config: UnitConfiguration, 
    violations: CriticalSlotViolation[],
    recommendations: string[]
  ): EndoSteelSlots {
    const structureType = this.extractComponentType(config.structureType);
    const isEndoSteel = structureType.includes('Endo Steel');
    
    if (!isEndoSteel) {
      return { required: 0, allocated: 0, locations: [], isCompliant: true };
    }
    
    const required = this.SPECIAL_COMPONENT_REQUIREMENTS.endoSteel;
    // In actual implementation, would check slot allocation across locations
    const allocated = required; // Simplified for now
    const locations = ['leftTorso', 'rightTorso', 'leftArm', 'rightArm']; // Typical distribution
    
    const isCompliant = allocated >= required;
    
    if (!isCompliant) {
      violations.push({
        location: 'multiple',
        type: 'special_component_violation',
        component: 'Endo Steel',
        message: `Endo Steel structure requires ${required} slots but only ${allocated} allocated`,
        severity: 'critical',
        suggestedFix: `Allocate ${required - allocated} more slots for Endo Steel across multiple locations`
      });
    }
    
    return { required, allocated, locations, isCompliant };
  }

  /**
   * Validate Ferro-Fibrous armor slot requirements
   */
  private static validateFerroFibrousSlots(
    config: UnitConfiguration, 
    violations: CriticalSlotViolation[],
    recommendations: string[]
  ): FerroFibrousSlots {
    const armorType = this.extractComponentType(config.armorType);
    const isFerroFibrous = armorType.includes('Ferro-Fibrous');
    
    if (!isFerroFibrous) {
      return { required: 0, allocated: 0, locations: [], isCompliant: true };
    }
    
    const required = this.SPECIAL_COMPONENT_REQUIREMENTS.ferroFibrous;
    const allocated = required; // Simplified for now
    const locations = ['leftTorso', 'rightTorso', 'leftLeg', 'rightLeg']; // Typical distribution
    
    const isCompliant = allocated >= required;
    
    if (!isCompliant) {
      violations.push({
        location: 'multiple',
        type: 'special_component_violation',
        component: 'Ferro-Fibrous',
        message: `Ferro-Fibrous armor requires ${required} slots but only ${allocated} allocated`,
        severity: 'critical',
        suggestedFix: `Allocate ${required - allocated} more slots for Ferro-Fibrous across multiple locations`
      });
    }
    
    return { required, allocated, locations, isCompliant };
  }

  /**
   * Validate double heat sink slot requirements
   */
  private static validateDoubleHeatSinkSlots(
    config: UnitConfiguration, 
    equipment: any[], 
    violations: CriticalSlotViolation[],
    recommendations: string[]
  ): DoubleHeatSinkSlots {
    const heatSinkType = this.extractComponentType(config.heatSinkType);
    const isDoubleHeatSinks = heatSinkType.includes('Double');
    
    if (!isDoubleHeatSinks) {
      return { engineSlots: 0, externalSlots: 0, totalRequired: 0, isCompliant: true };
    }
    
    const engineHeatSinks = this.getEngineHeatSinks(config);
    const externalHeatSinks = equipment.filter(item => 
      item.equipmentData?.type === 'heat_sink' || 
      item.equipmentData?.name?.toLowerCase().includes('heat sink')
    ).length;
    
    const engineSlots = engineHeatSinks * 0; // Engine heat sinks don't take extra slots
    const externalSlots = externalHeatSinks * this.SPECIAL_COMPONENT_REQUIREMENTS.doubleHeatSink;
    const totalRequired = engineSlots + externalSlots;
    
    // In actual implementation, would verify slot allocation
    const isCompliant = true; // Simplified
    
    return { engineSlots, externalSlots, totalRequired, isCompliant };
  }

  /**
   * Validate Artemis system slot requirements
   */
  private static validateArtemisSlots(
    equipment: any[], 
    violations: CriticalSlotViolation[],
    recommendations: string[]
  ): ArtemisSlots {
    const artemisWeapons = equipment.filter(item => 
      item.equipmentData?.name?.toLowerCase().includes('artemis') ||
      item.equipmentData?.type?.includes('artemis')
    );
    
    const required = artemisWeapons.length * this.SPECIAL_COMPONENT_REQUIREMENTS.artemis;
    const allocated = artemisWeapons.length; // Simplified
    
    const weaponPairings: ArtemisWeaponPairing[] = artemisWeapons.map(item => ({
      weapon: item.equipmentData?.name || 'Unknown',
      artemisSystem: 'Artemis IV',
      location: item.location || 'Unknown',
      isValid: true
    }));
    
    const isCompliant = allocated >= required;
    
    return { required, allocated, weaponPairings, isCompliant };
  }

  /**
   * Validate targeting computer slot requirements
   */
  private static validateTargetingComputerSlots(
    config: UnitConfiguration, 
    equipment: any[], 
    violations: CriticalSlotViolation[],
    recommendations: string[]
  ): TargetingComputerSlots {
    const targetingComputers = equipment.filter(item => 
      item.equipmentData?.name?.toLowerCase().includes('targeting computer')
    );
    
    if (targetingComputers.length === 0) {
      return { required: 0, allocated: 0, location: '', isCompliant: true };
    }
    
    const tonnage = config.tonnage || 100;
    const required = this.SPECIAL_COMPONENT_REQUIREMENTS.targetingComputer(tonnage);
    const allocated = targetingComputers.reduce((sum, tc) => sum + (tc.equipmentData?.criticals || required), 0);
    const location = targetingComputers[0]?.location || 'Unknown';
    
    const isCompliant = allocated >= required;
    
    if (!isCompliant) {
      violations.push({
        location,
        type: 'special_component_violation',
        component: 'Targeting Computer',
        message: `Targeting Computer requires ${required} slots but only ${allocated} allocated`,
        severity: 'major',
        suggestedFix: `Allocate ${required - allocated} more slots for Targeting Computer`
      });
    }
    
    return { required, allocated, location, isCompliant };
  }

  /**
   * Validate component placement restrictions
   */
  private static validateComponentPlacement(
    equipment: any[], 
    violations: PlacementViolation[], 
    context: CriticalSlotValidationContext
  ): void {
    equipment.forEach(item => {
      const componentType = item.equipmentData?.type || 'equipment';
      const location = item.location || 'Unknown';
      const name = item.equipmentData?.name || 'Unknown';
      
      // Check location restrictions for specific component types
      this.checkLocationRestrictions(item, location, violations);
      
      // Check pairing requirements (e.g., Artemis with missiles)
      this.checkPairingRequirements(item, equipment, violations);
      
      // Check special placement rules
      this.checkSpecialPlacementRules(item, location, violations);
    });
  }

  /**
   * Check location restrictions for components
   */
  private static checkLocationRestrictions(item: any, location: string, violations: PlacementViolation[]): void {
    const componentType = item.equipmentData?.type || 'equipment';
    const name = item.equipmentData?.name || 'Unknown';
    
    // Example restrictions
    const restrictions: { [key: string]: { forbidden?: string[], required?: string[], reason: string } } = {
      'ammunition': {
        forbidden: ['head'], // No ammo in head
        reason: 'Explosive ammunition cannot be placed in head location'
      },
      'case': {
        required: ['centerTorso', 'leftTorso', 'rightTorso'], // CASE only in torso
        reason: 'CASE can only be installed in torso locations'
      }
    };
    
    const restriction = restrictions[componentType];
    if (restriction) {
      if (restriction.forbidden && restriction.forbidden.includes(location)) {
        violations.push({
          component: name,
          location,
          type: 'location_restricted',
          message: `${name} cannot be placed in ${location}: ${restriction.reason}`,
          severity: 'critical',
          suggestedFix: `Move ${name} to an allowed location`
        });
      }
      
      if (restriction.required && !restriction.required.includes(location)) {
        violations.push({
          component: name,
          location,
          type: 'invalid_location',
          message: `${name} must be placed in torso locations: ${restriction.reason}`,
          severity: 'major',
          suggestedFix: `Move ${name} to ${restriction.required.join(', ')}`
        });
      }
    }
  }

  /**
   * Check pairing requirements for components
   */
  private static checkPairingRequirements(item: any, allEquipment: any[], violations: PlacementViolation[]): void {
    const name = item.equipmentData?.name || 'Unknown';
    
    // Example: Artemis systems must be paired with compatible missiles
    if (name.toLowerCase().includes('artemis')) {
      const location = item.location || 'Unknown';
      const compatibleMissiles = allEquipment.filter(eq => 
        eq.location === location && 
        (eq.equipmentData?.name?.includes('LRM') || eq.equipmentData?.name?.includes('SRM'))
      );
      
      if (compatibleMissiles.length === 0) {
        violations.push({
          component: name,
          location,
          type: 'requires_pairing',
          message: `${name} requires compatible missile weapons in the same location`,
          severity: 'major',
          suggestedFix: `Add compatible missile weapons to ${location} or relocate Artemis system`
        });
      }
    }
  }

  /**
   * Check special placement rules
   */
  private static checkSpecialPlacementRules(item: any, location: string, violations: PlacementViolation[]): void {
    const name = item.equipmentData?.name || 'Unknown';
    const type = item.equipmentData?.type || 'equipment';
    
    // Example: Jump jets should be distributed
    if (type === 'jump_jet') {
      // In a real implementation, would check for proper distribution
      // For now, just a placeholder
    }
    
    // Example: ECM equipment restrictions
    if (name.toLowerCase().includes('ecm')) {
      const validLocations = ['head', 'centerTorso'];
      if (!validLocations.includes(location)) {
        violations.push({
          component: name,
          location,
          type: 'special_placement',
          message: `${name} should be placed in head or center torso for optimal effectiveness`,
          severity: 'minor',
          suggestedFix: `Consider moving ${name} to head or center torso`
        });
      }
    }
  }

  /**
   * Validate general location restrictions
   */
  private static validateLocationRestrictions(
    equipment: any[], 
    violations: CriticalSlotViolation[],
    recommendations: string[]
  ): void {
    // Check for ammunition in head
    const headAmmo = equipment.filter(item => 
      item.location === 'head' && 
      item.equipmentData?.type === 'ammunition'
    );
    
    headAmmo.forEach(ammo => {
      violations.push({
        location: 'head',
        type: 'invalid_placement',
        component: ammo.equipmentData?.name || 'Ammunition',
        message: 'Explosive ammunition cannot be placed in head location',
        severity: 'critical',
        suggestedFix: 'Move ammunition to torso or limb locations'
      });
    });
    
    // Check for proper CASE protection
    const torsoAmmo = equipment.filter(item => 
      ['centerTorso', 'leftTorso', 'rightTorso'].includes(item.location) && 
      item.equipmentData?.type === 'ammunition'
    );
    
    if (torsoAmmo.length > 0) {
      const caseEquipment = equipment.filter(item => 
        item.equipmentData?.name?.toLowerCase().includes('case')
      );
      
      if (caseEquipment.length === 0) {
        recommendations.push('Consider adding CASE protection for torso-mounted ammunition');
      }
    }
  }

  /**
   * Generate slot optimization recommendations
   */
  static generateSlotOptimizations(config: UnitConfiguration, equipment: any[]): SlotOptimization {
    const validation = this.validateCriticalSlots(config, equipment);
    const recommendations: SlotOptimizationRecommendation[] = [];
    const alternativeLayouts: AlternativeSlotLayout[] = [];
    const efficiencyImprovements: SlotEfficiencyImprovement[] = [];
    
    // Generate relocation recommendations for overflowing locations
    Object.entries(validation.locationUtilization).forEach(([location, util]) => {
      if (util.overflow) {
        const relocatableComponents = util.components.filter(comp => comp.canRelocate);
        relocatableComponents.forEach(comp => {
          const targetLocation = this.findBestRelocationTarget(comp, validation.locationUtilization);
          if (targetLocation) {
            recommendations.push({
              type: 'relocate_component',
              description: `Move ${comp.name} from ${location} to ${targetLocation}`,
              component: comp.name,
              fromLocation: location,
              toLocation: targetLocation,
              benefit: `Reduces ${location} slot usage and improves distribution`,
              difficulty: 'moderate',
              priority: 'high'
            });
          }
        });
      }
    });
    
    // Generate efficiency improvements
    Object.entries(validation.locationUtilization).forEach(([location, util]) => {
      if (util.utilization < 50) {
        efficiencyImprovements.push({
          location,
          currentUtilization: util.utilization,
          improvedUtilization: 75,
          improvement: 25,
          suggestions: [`Consider adding more equipment to ${location} to better utilize available slots`]
        });
      }
    });
    
    return {
      recommendations,
      alternativeLayouts,
      efficiencyImprovements
    };
  }

  /**
   * Calculate slot efficiency score (0-100)
   */
  static calculateSlotEfficiency(config: UnitConfiguration, equipment: any[]): number {
    const validation = this.validateCriticalSlots(config, equipment);
    let efficiency = 100;
    
    // Penalize overflow conditions severely
    Object.values(validation.locationUtilization).forEach(util => {
      if (util.overflow) {
        efficiency -= 30; // Major penalty for overflow
      }
    });
    
    // Calculate average utilization
    const utilizationSum = Object.values(validation.locationUtilization)
      .reduce((sum, util) => sum + util.utilization, 0);
    const avgUtilization = utilizationSum / Object.keys(validation.locationUtilization).length;
    
    // Reward good utilization (60-90% is optimal)
    if (avgUtilization >= 60 && avgUtilization <= 90) {
      efficiency += (avgUtilization - 50) * 0.2; // Bonus for good utilization
    } else if (avgUtilization < 60) {
      efficiency -= (60 - avgUtilization) * 0.3; // Moderate penalty for low utilization
    } else if (avgUtilization > 90) {
      efficiency -= (avgUtilization - 90) * 0.5; // Penalty for over-utilization
    }
    
    // Bonus for balanced distribution (low variance in utilization)
    const utilizations = Object.values(validation.locationUtilization).map(util => util.utilization);
    const variance = this.calculateVariance(utilizations);
    if (variance < 100) { // Low variance means balanced
      efficiency += Math.max(0, (100 - variance) * 0.1);
    }
    
    return Math.max(0, Math.min(100, efficiency));
  }

  /**
   * Calculate variance for balancing bonus
   */
  private static calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Get validation rules for UI display
   */
  static getValidationRules(): Array<{
    name: string;
    description: string;
    severity: string;
    category: string;
  }> {
    return [
      {
        name: 'Slot Overflow',
        description: 'Components must fit within available critical slots per location',
        severity: 'critical',
        category: 'slots'
      },
      {
        name: 'Special Component Slots',
        description: 'Special components like Endo Steel must allocate required slots',
        severity: 'critical',
        category: 'slots'
      },
      {
        name: 'Component Placement',
        description: 'Components must be placed in valid locations',
        severity: 'major',
        category: 'placement'
      },
      {
        name: 'Location Restrictions',
        description: 'Certain components have placement restrictions (e.g., no ammo in head)',
        severity: 'critical',
        category: 'placement'
      }
    ];
  }

  // ===== PRIVATE HELPER METHODS =====

  private static getDefaultLocation(item: any): string {
    const type = item.equipmentData?.type || 'equipment';
    const name = item.equipmentData?.name || '';
    
    // Default placement logic
    if (type === 'weapon') {
      return 'rightArm'; // Default weapon placement
    }
    if (type === 'ammunition') {
      return 'leftTorso'; // Default ammo placement
    }
    if (type === 'heat_sink') {
      return 'centerTorso'; // Default heat sink placement
    }
    if (type === 'jump_jet') {
      return 'leftLeg'; // Default jump jet placement
    }
    
    return 'centerTorso'; // Default for everything else
  }

  private static getComponentSlots(item: any): number {
    const type = item.equipmentData?.type || 'equipment';
    const name = item.equipmentData?.name || '';
    
    // Standard slot counts by component type
    if (type === 'weapon') {
      // Most weapons take 1 slot, but some are larger
      if (name.includes('AC/20')) return 10;
      if (name.includes('AC/10')) return 7;
      if (name.includes('AC/5')) return 4;
      if (name.includes('PPC')) return 3;
      if (name.includes('Large Laser')) return 2;
      return 1; // Default for most weapons
    }
    
    if (type === 'ammunition') {
      return 1; // Most ammo takes 1 slot
    }
    
    if (type === 'heat_sink') {
      const heatSinkType = item.equipmentData?.name || '';
      if (heatSinkType.includes('Double')) return 3;
      return 1; // Single heat sinks
    }
    
    if (type === 'jump_jet') {
      return 1;
    }
    
    return 1; // Default slot count
  }

  private static canRelocateComponent(item: any): boolean {
    const type = item.equipmentData?.type || 'equipment';
    const name = item.equipmentData?.name || '';
    
    // System components cannot be relocated
    if (['engine', 'gyro', 'cockpit', 'life_support'].includes(type)) {
      return false;
    }
    
    // Some special components have restrictions
    if (name.toLowerCase().includes('case')) {
      return false; // CASE is typically location-specific
    }
    
    // Most equipment can be relocated
    return true;
  }

  private static extractComponentType(component: ComponentConfiguration | string): string {
    if (typeof component === 'string') return component;
    return component?.type || 'Standard';
  }

  private static getEngineHeatSinks(config: UnitConfiguration): number {
    const engineRating = config.engineRating || 0;
      const { calculateInternalHeatSinksForEngine } = require('../../utils/heatSinkCalculations');
    return calculateInternalHeatSinksForEngine(engineRating, 'Standard');
  }

  private static findBestRelocationTarget(
    component: ComponentSlotInfo, 
    utilization: { [location: string]: SlotUtilization }
  ): string | null {
    const validTargets = Object.entries(utilization)
      .filter(([location, util]) => 
        location !== component.location && 
        util.used + component.slots <= util.available
      )
      .sort((a, b) => a[1].utilization - b[1].utilization); // Prefer less utilized locations
    
    return validTargets.length > 0 ? validTargets[0][0] : null;
  }
}
