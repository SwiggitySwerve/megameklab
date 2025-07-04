/**
 * EquipmentValidationService - Equipment placement validation and compliance checking
 * 
 * Extracted from EquipmentAllocationService as part of large file refactoring.
 * Handles validation of equipment placement, BattleTech rule compliance, and mounting restrictions.
 * 
 * @see IMPLEMENTATION_REFERENCE.md for architectural patterns
 */

import { UnitConfiguration } from '../../utils/criticalSlots/UnitCriticalManager';
import { EquipmentPlacement, EquipmentConstraints } from './PlacementCalculationService';
import { PlacementCalculationService } from './PlacementCalculationService';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  compliance: ComplianceStatus;
  suggestions: string[];
}

export interface ValidationError {
  equipmentId: string;
  type: string;
  message: string;
  severity: 'critical' | 'major' | 'minor';
  location?: string;
  suggestedFix: string;
}

export interface ValidationWarning {
  equipmentId: string;
  type: string;
  message: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface ComplianceStatus {
  battleTechRules: boolean;
  techLevel: boolean;
  mountingRules: boolean;
  weightLimits: boolean;
}

export interface PlacementValidation {
  isValid: boolean;
  errors: PlacementError[];
  warnings: PlacementWarning[];
  restrictions: string[];
  suggestions: string[];
}

export interface PlacementError {
  type: 'slot_conflict' | 'location_invalid' | 'weight_exceeded' | 'rule_violation' | 'tech_level';
  message: string;
  severity: 'critical' | 'major' | 'minor';
  suggestedFix: string;
}

export interface PlacementWarning {
  type: 'suboptimal_placement' | 'balance_issue' | 'heat_concern' | 'vulnerability';
  message: string;
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
}

export interface RuleComplianceResult {
  compliant: boolean;
  violations: RuleViolation[];
  techLevelIssues: TechLevelIssue[];
  mountingIssues: MountingIssue[];
  suggestions: ComplianceSuggestion[];
}

export interface RuleViolation {
  rule: string;
  description: string;
  affectedEquipment: string[];
  severity: 'critical' | 'major' | 'minor';
  resolution: string;
}

export interface TechLevelIssue {
  equipment: string;
  requiredTechLevel: string;
  currentTechLevel: string;
  era: string;
  canBeResolved: boolean;
  suggestion: string;
}

export interface MountingIssue {
  equipment: string;
  location: string;
  issue: string;
  restriction: string;
  alternatives: string[];
}

export interface ComplianceSuggestion {
  type: 'tech_level' | 'mounting' | 'rule_compliance';
  equipment: string;
  suggestion: string;
  impact: string;
}

export interface TechLevelValidation {
  isValid: boolean;
  issues: TechLevelIssue[];
  summary: TechLevelSummary;
  recommendations: string[];
}

export interface TechLevelSummary {
  innerSphere: number;
  clan: number;
  mixed: boolean;
  era: string;
  techLevel: string;
}

export interface MountingValidation {
  canMount: boolean;
  restrictions: MountingRestriction[];
  requirements: MountingRequirement[];
  alternatives: string[];
  warnings: string[];
}

export interface MountingRestriction {
  type: 'location' | 'tonnage' | 'heat' | 'ammunition' | 'special';
  description: string;
  severity: 'blocking' | 'warning';
}

export interface MountingRequirement {
  type: 'case' | 'artemis' | 'targeting_computer' | 'special';
  description: string;
  satisfied: boolean;
  suggestion?: string;
}

export class EquipmentValidationService {

  // BattleTech construction rules
  private static readonly CONSTRUCTION_RULES = {
    maxHeadTonnage: 1,
    maxEngineRating: 400,
    minHeatSinks: 10,
    maxJumpMP: 8,
    maxAmmoExplosions: 3,
    techLevelRestrictions: {
      'Inner Sphere': ['Inner Sphere', 'Star League'],
      'Clan': ['Clan', 'Star League'],
      'Mixed': ['Inner Sphere', 'Clan', 'Star League']
    }
  };

  // Location-specific restrictions
  private static readonly LOCATION_RESTRICTIONS = {
    'head': {
      maxTonnage: 1,
      maxCriticals: 6,
      forbiddenTypes: ['engine', 'gyro', 'ammunition'],
      specialRules: ['cockpit_required']
    },
    'centerTorso': {
      maxTonnage: 100,
      maxCriticals: 12,
      requiredTypes: ['engine', 'gyro'],
      specialRules: ['engine_placement', 'gyro_placement']
    },
    'leftTorso': {
      maxTonnage: 100,
      maxCriticals: 12,
      forbiddenTypes: [],
      specialRules: ['side_torso_rules']
    },
    'rightTorso': {
      maxTonnage: 100,
      maxCriticals: 12,
      forbiddenTypes: [],
      specialRules: ['side_torso_rules']
    },
    'leftArm': {
      maxTonnage: 100,
      maxCriticals: 12,
      forbiddenTypes: ['engine', 'gyro'],
      specialRules: ['actuator_restrictions']
    },
    'rightArm': {
      maxTonnage: 100,
      maxCriticals: 12,
      forbiddenTypes: ['engine', 'gyro'],
      specialRules: ['actuator_restrictions']
    },
    'leftLeg': {
      maxTonnage: 100,
      maxCriticals: 6,
      forbiddenTypes: ['engine', 'gyro'],
      specialRules: ['leg_restrictions']
    },
    'rightLeg': {
      maxTonnage: 100,
      maxCriticals: 6,
      forbiddenTypes: ['engine', 'gyro'],
      specialRules: ['leg_restrictions']
    }
  };

  /**
   * Validate all equipment placements in a configuration
   */
  static validateEquipmentPlacement(
    config: UnitConfiguration,
    allocations: EquipmentPlacement[]
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    // Validate each individual placement
    for (const allocation of allocations) {
      const validation = this.validateSinglePlacement(allocation, config, allocations);

      if (!validation.isValid) {
        validation.errors.forEach(error => {
          errors.push({
            equipmentId: allocation.equipmentId,
            type: error.type,
            message: error.message,
            severity: error.severity,
            location: allocation.location,
            suggestedFix: error.suggestedFix
          });
        });
      }

      validation.warnings.forEach(warning => {
        warnings.push({
          equipmentId: allocation.equipmentId,
          type: warning.type,
          message: warning.message,
          impact: warning.impact,
          recommendation: warning.recommendation
        });
      });
    }

    // Check global rules
    const globalValidation = this.validateGlobalRules(config, allocations);
    errors.push(...globalValidation.errors);
    warnings.push(...globalValidation.warnings);

    // Determine compliance status
    const compliance = this.determineComplianceStatus(errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compliance,
      suggestions
    };
  }

  /**
   * Validate a single equipment placement
   */
  static validateSinglePlacement(
    allocation: EquipmentPlacement,
    config: UnitConfiguration,
    allAllocations: EquipmentPlacement[]
  ): PlacementValidation {
    const errors: PlacementError[] = [];
    const warnings: PlacementWarning[] = [];
    const restrictions: string[] = [];
    const suggestions: string[] = [];

    const equipment = allocation.equipment;
    const location = allocation.location;

    // Check basic placement validation
    const placementValidation = this.validatePlacement(equipment, location, config);
    errors.push(...placementValidation.errors);
    warnings.push(...placementValidation.warnings);

    // Check slot conflicts
    const slotValidation = this.validateSlotConflicts(allocation, allAllocations);
    if (!slotValidation.isValid) {
      errors.push({
        type: 'slot_conflict',
        message: 'Equipment conflicts with existing placement',
        severity: 'critical',
        suggestedFix: 'Move to different location or slots'
      });
    }

    // Check weight limits
    const weightValidation = this.validateWeightLimits(allocation, location, config);
    if (!weightValidation.isValid) {
      errors.push({
        type: 'weight_exceeded',
        message: weightValidation.message || 'Weight limit exceeded',
        severity: 'critical',
        suggestedFix: 'Move to location with higher weight capacity'
      });
    }

    // Check special requirements
    const requirementValidation = this.validateSpecialRequirements(allocation, config, allAllocations);
    errors.push(...requirementValidation.errors);
    warnings.push(...requirementValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      restrictions,
      suggestions
    };
  }

  /**
   * Validate placement against basic rules
   */
  static validatePlacement(equipment: any, location: string, config: UnitConfiguration): PlacementValidation {
    const errors: PlacementError[] = [];
    const warnings: PlacementWarning[] = [];
    const restrictions: string[] = [];
    const suggestions: string[] = [];

    const constraints = PlacementCalculationService.getEquipmentConstraints(equipment);
    const locationRules = this.LOCATION_RESTRICTIONS[location as keyof typeof this.LOCATION_RESTRICTIONS];

    if (!locationRules) {
      errors.push({
        type: 'location_invalid',
        message: `Invalid location: ${location}`,
        severity: 'critical',
        suggestedFix: 'Use valid mech location'
      });
      return { isValid: false, errors, warnings, restrictions, suggestions };
    }

    // Check location restrictions
    if (constraints.forbiddenLocations.includes(location)) {
      errors.push({
        type: 'location_invalid',
        message: `${equipment.equipmentData?.name || 'Equipment'} cannot be mounted in ${location}`,
        severity: 'critical',
        suggestedFix: `Mount in: ${constraints.allowedLocations.join(', ')}`
      });
    }

    // Check weight restrictions
    const tonnage = equipment.equipmentData?.tonnage || 0;
    if (tonnage > locationRules.maxTonnage) {
      errors.push({
        type: 'weight_exceeded',
        message: `Equipment too heavy for ${location} (${tonnage} > ${locationRules.maxTonnage} tons)`,
        severity: 'critical',
        suggestedFix: 'Move to location with higher weight capacity'
      });
    }

    // Check type restrictions
    const equipmentType = equipment.equipmentData?.type || 'equipment';
    const forbiddenTypes = 'forbiddenTypes' in locationRules ? locationRules.forbiddenTypes : [];
    if (forbiddenTypes.includes(equipmentType)) {
      errors.push({
        type: 'rule_violation',
        message: `${equipmentType} cannot be placed in ${location}`,
        severity: 'critical',
        suggestedFix: 'Move to appropriate location for this equipment type'
      });
    }

    // Check tech level compatibility
    const techValidation = this.validateTechLevel([equipment], config);
    if (!techValidation.isValid) {
      errors.push({
        type: 'tech_level',
        message: techValidation.issues[0]?.suggestion || 'Tech level incompatibility',
        severity: 'major',
        suggestedFix: 'Adjust unit tech level or use compatible equipment'
      });
    }

    // Generate warnings for suboptimal placement
    this.generatePlacementWarnings(equipment, location, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      restrictions,
      suggestions
    };
  }

  /**
   * Check BattleTech construction rules compliance
   */
  static checkBattleTechRules(
    config: UnitConfiguration,
    allocations: EquipmentPlacement[]
  ): RuleComplianceResult {
    const violations: RuleViolation[] = [];
    const techLevelIssues: TechLevelIssue[] = [];
    const mountingIssues: MountingIssue[] = [];
    const suggestions: ComplianceSuggestion[] = [];

    // Check for missing required equipment
    const equipmentTypes = allocations.map(a => a.equipment.equipmentData?.type || 'equipment');
    const hasEngine = equipmentTypes.includes('engine');
    const hasGyro = equipmentTypes.includes('gyro');
    const hasCockpit = equipmentTypes.includes('cockpit');

    if (!hasEngine) {
      violations.push({
        rule: 'Required Equipment',
        description: 'Engine is required for all mechs',
        affectedEquipment: ['Engine'],
        severity: 'critical',
        resolution: 'Add engine to center torso'
      });
    }

    if (!hasGyro) {
      violations.push({
        rule: 'Required Equipment',
        description: 'Gyro is required for all mechs',
        affectedEquipment: ['Gyro'],
        severity: 'critical',
        resolution: 'Add gyro to center torso'
      });
    }

    if (!hasCockpit) {
      violations.push({
        rule: 'Required Equipment',
        description: 'Cockpit is required for all mechs',
        affectedEquipment: ['Cockpit'],
        severity: 'critical',
        resolution: 'Add cockpit to head'
      });
    }

    // Check engine rating limits
    const engineRating = config.engineRating || 0;
    if (engineRating > this.CONSTRUCTION_RULES.maxEngineRating) {
      violations.push({
        rule: 'Engine Rating Limit',
        description: `Engine rating ${engineRating} exceeds maximum of ${this.CONSTRUCTION_RULES.maxEngineRating}`,
        affectedEquipment: ['Engine'],
        severity: 'critical',
        resolution: 'Reduce engine rating or select different chassis'
      });
    }

    // Check heat sink requirements
    const heatSinks = this.countHeatSinks(config, allocations);
    if (heatSinks < this.CONSTRUCTION_RULES.minHeatSinks) {
      violations.push({
        rule: 'Minimum Heat Sinks',
        description: `Only ${heatSinks} heat sinks, minimum required is ${this.CONSTRUCTION_RULES.minHeatSinks}`,
        affectedEquipment: ['Heat Sinks'],
        severity: 'critical',
        resolution: `Add ${this.CONSTRUCTION_RULES.minHeatSinks - heatSinks} more heat sinks`
      });
    }

    // Check jump jet limits
    const jumpJets = allocations.filter(a => a.equipment.equipmentData?.type === 'jump_jet').length;
    const maxJumpMP = Math.min(this.CONSTRUCTION_RULES.maxJumpMP, Math.floor((config.tonnage || 100) / 10));
    if (jumpJets > maxJumpMP) {
      violations.push({
        rule: 'Jump Jet Limit',
        description: `${jumpJets} jump jets exceed maximum of ${maxJumpMP}`,
        affectedEquipment: ['Jump Jets'],
        severity: 'critical',
        resolution: `Remove ${jumpJets - maxJumpMP} jump jets`
      });
    }

    // Check tech level compliance
    const equipment = allocations.map(a => a.equipment);
    const techValidation = this.validateTechLevel(equipment, config);
    techLevelIssues.push(...techValidation.issues);

    // Check mounting restrictions
    for (const allocation of allocations) {
      const mounting = this.validateMountingRestrictions(allocation.equipment, allocation.location, config);
      if (!mounting.canMount) {
        mountingIssues.push({
          equipment: allocation.equipment.equipmentData?.name || 'Unknown',
          location: allocation.location,
          issue: mounting.restrictions[0]?.description || 'Cannot mount',
          restriction: mounting.restrictions[0]?.type || 'unknown',
          alternatives: mounting.alternatives
        });
      }
    }

    // Generate compliance suggestions
    if (violations.length > 0) {
      suggestions.push({
        type: 'rule_compliance',
        equipment: 'Configuration',
        suggestion: 'Address rule violations to achieve legal mech design',
        impact: 'Critical - mech cannot be used in legal play'
      });
    }

    return {
      compliant: violations.length === 0 && techLevelIssues.length === 0 && mountingIssues.length === 0,
      violations,
      techLevelIssues,
      mountingIssues,
      suggestions
    };
  }

  /**
   * Validate tech level compatibility
   */
  static validateTechLevel(equipment: any[], config: UnitConfiguration): TechLevelValidation {
    const issues: TechLevelIssue[] = [];
    let innerSphere = 0;
    let clan = 0;

    const unitTechBase = config.techBase || 'Inner Sphere';
    const unitEra = (config as any).era || '3025';

    for (const item of equipment) {
      const equipmentTechBase = item.equipmentData?.techBase || 'Inner Sphere';
      const equipmentIntroduction = item.equipmentData?.introduction || 3025;

      // Count tech base distribution
      if (equipmentTechBase === 'Inner Sphere') {
        innerSphere++;
      } else if (equipmentTechBase === 'Clan') {
        clan++;
      }

      // Check tech base compatibility
      if (unitTechBase === 'Inner Sphere' && equipmentTechBase === 'Clan') {
        issues.push({
          equipment: item.equipmentData?.name || 'Unknown',
          requiredTechLevel: equipmentTechBase,
          currentTechLevel: unitTechBase,
          era: unitEra,
          canBeResolved: false,
          suggestion: 'Change unit tech base to Mixed or use Inner Sphere equivalent'
        });
      }

      // Check era availability
      if (equipmentIntroduction > parseInt(unitEra)) {
        issues.push({
          equipment: item.equipmentData?.name || 'Unknown',
          requiredTechLevel: `Available ${equipmentIntroduction}`,
          currentTechLevel: `Era ${unitEra}`,
          era: unitEra,
          canBeResolved: true,
          suggestion: `Change era to ${equipmentIntroduction} or later, or use era-appropriate equipment`
        });
      }
    }

    const summary: TechLevelSummary = {
      innerSphere,
      clan,
      mixed: innerSphere > 0 && clan > 0,
      era: unitEra,
      techLevel: unitTechBase
    };

    const recommendations: string[] = [];
    if (issues.length > 0) {
      recommendations.push('Resolve tech level mismatches for legal configuration');
    }

    if (summary.mixed) {
      recommendations.push('Consider changing unit tech base to Mixed for mixed-tech designs');
    }

    return {
      isValid: issues.length === 0,
      issues,
      summary,
      recommendations
    };
  }

  /**
   * Validate mounting restrictions
   */
  static validateMountingRestrictions(
    equipment: any,
    location: string,
    config: UnitConfiguration
  ): MountingValidation {
    const restrictions: MountingRestriction[] = [];
    const requirements: MountingRequirement[] = [];
    const alternatives: string[] = [];
    const warnings: string[] = [];

    const equipmentData = equipment.equipmentData || {};
    const tonnage = equipmentData.tonnage || 0;
    const type = equipmentData.type || 'equipment';

    // Check basic mounting restrictions
    if (location === 'head' && tonnage > this.CONSTRUCTION_RULES.maxHeadTonnage) {
      restrictions.push({
        type: 'tonnage',
        description: `Head location limited to ${this.CONSTRUCTION_RULES.maxHeadTonnage} ton equipment`,
        severity: 'blocking'
      });
      alternatives.push('centerTorso', 'leftTorso', 'rightTorso');
    }

    // Check ammunition restrictions
    if (type === 'ammunition' && equipmentData.explosive) {
      if (location === 'head') {
        restrictions.push({
          type: 'ammunition',
          description: 'Explosive ammunition cannot be placed in head',
          severity: 'blocking'
        });
        alternatives.push('leftTorso', 'rightTorso', 'leftLeg', 'rightLeg');
      }

      requirements.push({
        type: 'case',
        description: 'Explosive ammunition should have CASE protection',
        satisfied: this.hasLocationCASE(location, config),
        suggestion: 'Install CASE in this location'
      });
    }

    // Check Artemis requirements
    if (type === 'missile_weapon' && equipmentData.artemisCompatible) {
      requirements.push({
        type: 'artemis',
        description: 'Weapon can use Artemis IV FCS',
        satisfied: this.hasLocationArtemis(location, config),
        suggestion: 'Install Artemis IV FCS for improved accuracy'
      });
    }

    // Check special requirements
    if (equipmentData.special) {
      for (const special of equipmentData.special) {
        if (special.includes('targeting_computer')) {
          requirements.push({
            type: 'targeting_computer',
            description: 'Weapon benefits from Targeting Computer',
            satisfied: this.hasTargetingComputer(config),
            suggestion: 'Install Targeting Computer for weapon bonuses'
          });
        }
      }
    }

    // Generate warnings
    if (type.includes('weapon') && location === 'head') {
      warnings.push('Weapons in head are vulnerable to critical hits');
    }

    if (tonnage > 5 && (location === 'leftArm' || location === 'rightArm')) {
      warnings.push('Heavy equipment in arms may be lost if arm is destroyed');
    }

    return {
      canMount: restrictions.filter(r => r.severity === 'blocking').length === 0,
      restrictions,
      requirements,
      alternatives,
      warnings
    };
  }

  // ===== HELPER METHODS =====

  private static validateSlotConflicts(
    allocation: EquipmentPlacement,
    allAllocations: EquipmentPlacement[]
  ): { isValid: boolean; conflicts: string[] } {
    const conflicts: string[] = [];

    for (const other of allAllocations) {
      if (other.equipmentId !== allocation.equipmentId && other.location === allocation.location) {
        const overlap = allocation.slots.some(slot => other.slots.includes(slot));
        if (overlap) {
          conflicts.push(other.equipmentId);
        }
      }
    }

    return {
      isValid: conflicts.length === 0,
      conflicts
    };
  }

  private static validateWeightLimits(
    allocation: EquipmentPlacement,
    location: string,
    config: UnitConfiguration
  ): { isValid: boolean; message?: string } {
    const tonnage = allocation.equipment.equipmentData?.tonnage || 0;
    const locationRules = this.LOCATION_RESTRICTIONS[location as keyof typeof this.LOCATION_RESTRICTIONS];

    if (!locationRules) {
      return { isValid: false, message: 'Invalid location' };
    }

    if (tonnage > locationRules.maxTonnage) {
      return {
        isValid: false,
        message: `Equipment weight (${tonnage} tons) exceeds location tonnage limit (${locationRules.maxTonnage} tons)`
      };
    }

    return { isValid: true };
  }

  private static validateSpecialRequirements(
    allocation: EquipmentPlacement,
    config: UnitConfiguration,
    allAllocations: EquipmentPlacement[]
  ): { errors: PlacementError[]; warnings: PlacementWarning[] } {
    const errors: PlacementError[] = [];
    const warnings: PlacementWarning[] = [];

    const equipment = allocation.equipment;
    const type = equipment.equipmentData?.type || 'equipment';

    // Check for required engine placement
    if (type === 'engine' && allocation.location !== 'centerTorso') {
      errors.push({
        type: 'rule_violation',
        message: 'Engine must be placed in center torso',
        severity: 'critical',
        suggestedFix: 'Move engine to center torso'
      });
    }

    // Check for required gyro placement
    if (type === 'gyro' && allocation.location !== 'centerTorso') {
      errors.push({
        type: 'rule_violation',
        message: 'Gyro must be placed in center torso',
        severity: 'critical',
        suggestedFix: 'Move gyro to center torso'
      });
    }

    // Check for cockpit requirements
    if (type === 'cockpit' && allocation.location !== 'head') {
      errors.push({
        type: 'rule_violation',
        message: 'Cockpit must be placed in head',
        severity: 'critical',
        suggestedFix: 'Move cockpit to head'
      });
    }

    return { errors, warnings };
  }

  private static validateGlobalRules(
    config: UnitConfiguration,
    allocations: EquipmentPlacement[]
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for required equipment
    const hasEngine = allocations.some(a => a.equipment.equipmentData?.type === 'engine');
    if (!hasEngine) {
      errors.push({
        equipmentId: 'engine',
        type: 'rule_violation',
        message: 'Mech must have an engine',
        severity: 'critical',
        suggestedFix: 'Install appropriate engine for mech tonnage',
        location: 'centerTorso'
      });
    }

    const hasGyro = allocations.some(a => a.equipment.equipmentData?.type === 'gyro');
    if (!hasGyro) {
      errors.push({
        equipmentId: 'gyro',
        type: 'rule_violation',
        message: 'Mech must have a gyro',
        severity: 'critical',
        suggestedFix: 'Install gyro in center torso',
        location: 'centerTorso'
      });
    }

    const hasCockpit = allocations.some(a => a.equipment.equipmentData?.type === 'cockpit');
    if (!hasCockpit) {
      errors.push({
        equipmentId: 'cockpit',
        type: 'rule_violation',
        message: 'Mech must have a cockpit',
        severity: 'critical',
        suggestedFix: 'Install cockpit in head',
        location: 'head'
      });
    }

    return { errors, warnings };
  }

  private static generatePlacementWarnings(
    equipment: any,
    location: string,
    warnings: PlacementWarning[]
  ): void {
    const type = equipment.equipmentData?.type || 'equipment';
    const tonnage = equipment.equipmentData?.tonnage || 0;

    // Ammunition vulnerability warnings
    if (type === 'ammunition' && equipment.equipmentData?.explosive) {
      if (location === 'head') {
        warnings.push({
          type: 'vulnerability',
          message: 'Explosive ammunition in head is extremely dangerous',
          recommendation: 'Move to torso or leg location with CASE protection',
          impact: 'high'
        });
      } else if (!this.hasLocationCASE(location, {} as UnitConfiguration)) {
        warnings.push({
          type: 'vulnerability',
          message: 'Explosive ammunition should have CASE protection',
          recommendation: 'Install CASE in this location',
          impact: 'medium'
        });
      }
    }

    // Heat generation warnings
    if (equipment.equipmentData?.heat > 10) {
      warnings.push({
        type: 'heat_concern',
        message: 'High heat generation equipment',
        recommendation: 'Ensure adequate heat sink capacity',
        impact: 'medium'
      });
    }

    // Balance warnings
    if (tonnage > 10 && (location === 'leftArm' || location === 'rightArm')) {
      warnings.push({
        type: 'balance_issue',
        message: 'Heavy equipment in arm may cause balance issues',
        recommendation: 'Consider torso placement for better balance',
        impact: 'low'
      });
    }
  }

  private static determineComplianceStatus(
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): ComplianceStatus {
    const criticalErrors = errors.filter(e => e.severity === 'critical');

    return {
      battleTechRules: criticalErrors.filter(e => e.type === 'rule_violation').length === 0,
      techLevel: criticalErrors.filter(e => e.type === 'tech_level').length === 0,
      mountingRules: criticalErrors.filter(e => e.type === 'location_invalid').length === 0,
      weightLimits: criticalErrors.filter(e => e.type === 'weight_exceeded').length === 0
    };
  }

  private static countHeatSinks(config: UnitConfiguration, allocations: EquipmentPlacement[]): number {
    const engineHeatSinks = Math.min(10, Math.floor((config.engineRating || 0) / 25));
    const externalHeatSinks = allocations.filter(a => a.equipment.equipmentData?.type === 'heat_sink').length;
    
    return engineHeatSinks + externalHeatSinks;
  }

  private static hasLocationCASE(location: string, config: UnitConfiguration): boolean {
    // Simplified check - would examine actual equipment for CASE
    return false;
  }

  private static hasLocationArtemis(location: string, config: UnitConfiguration): boolean {
    // Simplified check - would examine actual equipment for Artemis
    return false;
  }

  private static hasTargetingComputer(config: UnitConfiguration): boolean {
    // Simplified check - would examine actual equipment for Targeting Computer
    return false;
  }

  /**
   * Generate validation summary report
   */
  static generateValidationReport(
    config: UnitConfiguration,
    allocations: EquipmentPlacement[]
  ): string {
    const validation = this.validateEquipmentPlacement(config, allocations);
    const compliance = this.checkBattleTechRules(config, allocations);

    const report: string[] = [];
    report.push('=== EQUIPMENT VALIDATION REPORT ===');
    report.push('');

    // Overall status
    if (validation.isValid && compliance.compliant) {
      report.push('✅ CONFIGURATION VALID - All equipment properly placed and compliant');
    } else {
      report.push('❌ CONFIGURATION INVALID - Issues found that require attention');
    }
    report.push('');

    // Errors
    if (validation.errors.length > 0) {
      report.push('🚨 CRITICAL ERRORS:');
      validation.errors.forEach(error => {
        report.push(`  • ${error.message} (${error.equipmentId})`);
        report.push(`    Fix: ${error.suggestedFix}`);
      });
      report.push('');
    }

    // Warnings
    if (validation.warnings.length > 0) {
      report.push('⚠️  WARNINGS:');
      validation.warnings.forEach(warning => {
        report.push(`  • ${warning.message} (${warning.equipmentId})`);
        report.push(`    Recommendation: ${warning.recommendation}`);
      });
      report.push('');
    }

    // Compliance status
    report.push('📋 COMPLIANCE STATUS:');
    report.push(`  BattleTech Rules: ${validation.compliance.battleTechRules ? '✅' : '❌'}`);
    report.push(`  Tech Level: ${validation.compliance.techLevel ? '✅' : '❌'}`);
    report.push(`  Mounting Rules: ${validation.compliance.mountingRules ? '✅' : '❌'}`);
    report.push(`  Weight Limits: ${validation.compliance.weightLimits ? '✅' : '❌'}`);
    report.push('');

    // Equipment summary
    report.push('📊 EQUIPMENT SUMMARY:');
    report.push(`  Total Items: ${allocations.length}`);
    const totalWeight = allocations.reduce((sum, alloc) => sum + (alloc.equipment.equipmentData?.tonnage || 0), 0);
    report.push(`  Total Weight: ${totalWeight.toFixed(1)} tons`);
    
    return report.join('\n');
  }
}

export default EquipmentValidationService;
