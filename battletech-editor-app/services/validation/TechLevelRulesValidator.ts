/**
 * TechLevelRulesValidator - Tech level, era, and availability validation for BattleTech construction rules
 * 
 * Extracted from ConstructionRulesValidator as part of large file refactoring.
 * Handles tech base compatibility, era restrictions, mixed tech validation, and component availability ratings.
 * 
 * @see TECHNICAL_ARCHITECTURE.md for service architecture patterns
 */

import { UnitConfiguration } from '../../utils/criticalSlots/UnitCriticalManager';
import { TechBase } from '../../types/componentConfiguration';

export interface TechLevelValidation {
  isValid: boolean;
  unitTechLevel: string;
  unitTechBase: string;
  era: string;
  mixedTech: MixedTechValidation;
  eraRestrictions: EraValidation;
  availability: AvailabilityValidation;
  techBaseCompliance: TechBaseCompliance;
  violations: TechLevelViolation[];
  recommendations: string[];
}

export interface MixedTechValidation {
  isMixed: boolean;
  innerSphereComponents: number;
  clanComponents: number;
  allowedMixed: boolean;
  mixedTechRules: MixedTechRules;
  violations: string[];
}

export interface MixedTechRules {
  allowMixedTech: boolean;
  requiresSpecialPilot: boolean;
  battleValueModifier: number;
  restrictedCombinations: string[];
  compatibilityMatrix: CompatibilityMatrix;
}

export interface CompatibilityMatrix {
  [techBase: string]: {
    compatible: string[];
    restricted: string[];
    forbidden: string[];
  };
}

export interface EraValidation {
  isValid: boolean;
  era: string;
  targetEra: string;
  invalidComponents: EraViolation[];
  eraProgression: EraProgression;
  recommendations: string[];
}

export interface EraViolation {
  component: string;
  availableEra: string;
  currentEra: string;
  earliestAvailability: string;
  message: string;
  severity: 'critical' | 'major' | 'minor';
}

export interface EraProgression {
  currentEra: string;
  availableEras: string[];
  eraTimeline: EraTimelineEntry[];
  technologyIntroductions: TechIntroduction[];
}

export interface EraTimelineEntry {
  era: string;
  startYear: number;
  endYear: number;
  description: string;
  majorEvents: string[];
}

export interface TechIntroduction {
  technology: string;
  era: string;
  year: number;
  techBase: string;
  description: string;
}

export interface AvailabilityValidation {
  isValid: boolean;
  overallRating: string;
  componentRatings: ComponentAvailability[];
  ratingBreakdown: AvailabilityBreakdown;
  violations: AvailabilityViolation[];
}

export interface ComponentAvailability {
  component: string;
  rating: string;
  available: boolean;
  techBase: string;
  era: string;
  rarity: string;
  cost: number;
  notes: string;
}

export interface AvailabilityBreakdown {
  totalComponents: number;
  ratingDistribution: { [rating: string]: number };
  averageRating: number;
  limitingFactors: string[];
  improvementSuggestions: string[];
}

export interface AvailabilityViolation {
  component: string;
  rating: string;
  requiredRating: string;
  message: string;
  severity: 'critical' | 'major' | 'minor';
  impact: string;
}

export interface TechBaseCompliance {
  isValid: boolean;
  unitTechBase: string;
  componentTechBases: ComponentTechBase[];
  conflicts: TechBaseConflict[];
  complianceScore: number;
}

export interface ComponentTechBase {
  component: string;
  techBase: string;
  category: string;
  isCompliant: boolean;
  notes: string;
}

export interface TechBaseConflict {
  component: string;
  unitTechBase: string;
  componentTechBase: string;
  conflictType: 'incompatible' | 'restricted' | 'requires_mixed';
  resolution: string;
  severity: 'critical' | 'major' | 'minor';
}

export interface TechLevelViolation {
  type: 'tech_base_mismatch' | 'era_violation' | 'availability_violation' | 'mixed_tech_violation';
  component: string;
  expected: string;
  actual: string;
  message: string;
  severity: 'critical' | 'major' | 'minor';
  suggestedFix: string;
}

export interface TechLevelValidationContext {
  strictEraCompliance: boolean;
  allowMixedTech: boolean;
  targetAvailabilityRating: string;
  validateTechProgression: boolean;
  enforceCanonicalRestrictions: boolean;
}

export interface TechOptimization {
  recommendations: TechOptimizationRecommendation[];
  alternativeTechBases: AlternativeTechBase[];
  upgradePaths: TechUpgradePath[];
  costAnalysis: TechCostAnalysis;
}

export interface TechOptimizationRecommendation {
  type: 'tech_base_change' | 'era_adjustment' | 'component_replacement' | 'mixed_tech_optimization';
  description: string;
  component?: string;
  fromValue: string;
  toValue: string;
  benefit: string;
  impact: TechImpact;
  difficulty: 'easy' | 'moderate' | 'hard';
  priority: 'high' | 'medium' | 'low';
}

export interface TechImpact {
  availabilityChange: number;
  costChange: number;
  performanceChange: number;
  compatibilityChange: number;
  ruleCompliance: number;
}

export interface AlternativeTechBase {
  name: string;
  description: string;
  techBase: string;
  era: string;
  advantages: string[];
  disadvantages: string[];
  componentChanges: ComponentChange[];
  overallRating: number;
}

export interface ComponentChange {
  component: string;
  from: string;
  to: string;
  reason: string;
  impact: string;
}

export interface TechUpgradePath {
  name: string;
  description: string;
  steps: UpgradeStep[];
  totalCost: number;
  timeframe: string;
  feasibility: number;
}

export interface UpgradeStep {
  step: number;
  description: string;
  components: string[];
  cost: number;
  timeline: string;
  prerequisites: string[];
}

export interface TechCostAnalysis {
  baselineCost: number;
  optimizedCost: number;
  savings: number;
  costBreakdown: CostBreakdown;
  returnOnInvestment: number;
}

export interface CostBreakdown {
  components: number;
  research: number;
  development: number;
  production: number;
  maintenance: number;
}

export class TechLevelRulesValidator {
  private static readonly DEFAULT_CONTEXT: TechLevelValidationContext = {
    strictEraCompliance: false,
    allowMixedTech: false,
    targetAvailabilityRating: 'D',
    validateTechProgression: true,
    enforceCanonicalRestrictions: false
  };

  // Era definitions and timeline
  private static readonly ERA_TIMELINE: EraTimelineEntry[] = [
    {
      era: 'Age of War',
      startYear: 2005,
      endYear: 2570,
      description: 'Pre-Star League era of constant warfare',
      majorEvents: ['Formation of major houses', 'Technological advancement']
    },
    {
      era: 'Star League',
      startYear: 2571,
      endYear: 2780,
      description: 'Golden age of technology and peace',
      majorEvents: ['Star League formation', 'Height of technology', 'Exodus of Kerensky']
    },
    {
      era: 'Succession Wars',
      startYear: 2781,
      endYear: 3049,
      description: 'Dark age of warfare and technological regression',
      majorEvents: ['First Succession War', 'Technology loss', 'House wars']
    },
    {
      era: 'Clan Invasion',
      startYear: 3050,
      endYear: 3067,
      description: 'Return of the Clans with superior technology',
      majorEvents: ['Clan arrival', 'Battle of Tukayyid', 'Tech renaissance']
    },
    {
      era: 'FedCom Civil War',
      startYear: 3057,
      endYear: 3067,
      description: 'Internal strife and technological recovery',
      majorEvents: ['Civil war', 'Industrial rebuilding', 'Tech spread']
    },
    {
      era: 'Jihad',
      startYear: 3067,
      endYear: 3080,
      description: 'Word of Blake Jihad and destruction',
      majorEvents: ['WoB uprising', 'HPG network destruction', 'Devastation']
    },
    {
      era: 'Dark Age',
      startYear: 3081,
      endYear: 3135,
      description: 'Recovery and technological rediscovery',
      majorEvents: ['Republic formation', 'Tech recovery', 'New innovations']
    },
    {
      era: 'ilClan Era',
      startYear: 3136,
      endYear: 3200,
      description: 'Clan Jade Falcon and Clan Wolf dominance',
      majorEvents: ['ilClan formation', 'Terra conquest', 'New order']
    }
  ];

  // Tech base compatibility matrix
  private static readonly TECH_COMPATIBILITY: CompatibilityMatrix = {
    'Inner Sphere': {
      compatible: ['Inner Sphere', 'Star League'],
      restricted: ['Clan'],
      forbidden: ['Alien', 'Prototype']
    },
    'Clan': {
      compatible: ['Clan', 'Star League'],
      restricted: ['Inner Sphere'],
      forbidden: ['Alien', 'Prototype']
    },
    'Mixed': {
      compatible: ['Inner Sphere', 'Clan', 'Star League', 'Mixed'],
      restricted: [],
      forbidden: ['Alien']
    },
    'Star League': {
      compatible: ['Inner Sphere', 'Clan', 'Star League'],
      restricted: [],
      forbidden: ['Alien', 'Prototype']
    }
  };

  // Availability rating definitions
  private static readonly AVAILABILITY_RATINGS = {
    'A': { name: 'Very Common', cost: 1.0, description: 'Readily available everywhere' },
    'B': { name: 'Common', cost: 1.2, description: 'Available in most locations' },
    'C': { name: 'Uncommon', cost: 1.5, description: 'Available in major centers' },
    'D': { name: 'Rare', cost: 2.0, description: 'Difficult to find' },
    'E': { name: 'Very Rare', cost: 3.0, description: 'Extremely difficult to obtain' },
    'F': { name: 'Extinct', cost: 5.0, description: 'Lost technology' },
    'X': { name: 'Unique', cost: 10.0, description: 'One-of-a-kind or experimental' }
  };

  /**
   * Validate complete tech level compliance
   */
  static validateTechLevel(
    config: UnitConfiguration, 
    equipment: any[], 
    context: Partial<TechLevelValidationContext> = {}
  ): TechLevelValidation {
    const ctx = { ...this.DEFAULT_CONTEXT, ...context };
    const violations: TechLevelViolation[] = [];
    const recommendations: string[] = [];
    
    const unitTechLevel = this.determineUnitTechLevel(config, equipment);
    const unitTechBase = config.techBase || 'Inner Sphere';
    const era = this.determineEra(config);
    
    // Adjust context for pure tech base units
    const adjustedCtx = this.adjustContextForTechBase(ctx, config, equipment);
    
    // Validate mixed tech
    const mixedTech = this.validateMixedTech(config, equipment, adjustedCtx);
    
    // Validate era restrictions
    const eraRestrictions = this.validateEraRestrictions(config, equipment, era, adjustedCtx);
    
    // Validate availability ratings
    const availability = this.validateAvailabilityRating(equipment, config, adjustedCtx);
    
    // Validate tech base compliance
    const techBaseCompliance = this.validateTechBaseCompliance(config, equipment, adjustedCtx);
    
    // Compile violations from all sub-validations
    violations.push(...mixedTech.violations.map(v => ({
      type: 'mixed_tech_violation' as const,
      component: 'Mixed Tech',
      expected: 'Pure tech base',
      actual: 'Mixed tech detected',
      message: v,
      severity: 'major' as const,
      suggestedFix: 'Remove mixed tech components or enable mixed tech rules'
    })));
    
    violations.push(...eraRestrictions.invalidComponents.map(ec => ({
      type: 'era_violation' as const,
      component: ec.component,
      expected: ec.currentEra,
      actual: ec.availableEra,
      message: ec.message,
      severity: ec.severity,
      suggestedFix: `Replace with ${ec.currentEra}-appropriate equivalent or adjust era to ${ec.availableEra}`
    })));
    
    violations.push(...availability.violations.map(av => ({
      type: 'availability_violation' as const,
      component: av.component,
      expected: av.requiredRating,
      actual: av.rating,
      message: av.message,
      severity: av.severity,
      suggestedFix: `Replace with more commonly available alternative`
    })));
    
    violations.push(...techBaseCompliance.conflicts.map(tbc => ({
      type: 'tech_base_mismatch' as const,
      component: tbc.component,
      expected: tbc.unitTechBase,
      actual: tbc.componentTechBase,
      message: `Component tech base ${tbc.componentTechBase} incompatible with unit tech base ${tbc.unitTechBase}`,
      severity: tbc.severity,
      suggestedFix: tbc.resolution
    })));
    
    // Generate recommendations
    if (mixedTech.isMixed && !ctx.allowMixedTech) {
      recommendations.push('Consider enabling mixed tech rules or standardizing to single tech base');
    }
    
    if (eraRestrictions.invalidComponents.length > 0) {
      recommendations.push('Update components to match selected era or adjust era setting');
    }
    
    if (availability.violations.length > 0) {
      recommendations.push('Consider using more commonly available components to improve availability rating');
    }
    
    return {
      isValid: violations.filter(v => v.severity === 'critical' || v.severity === 'major').length === 0,
      unitTechLevel,
      unitTechBase,
      era,
      mixedTech,
      eraRestrictions,
      availability,
      techBaseCompliance,
      violations,
      recommendations
    };
  }

  /**
   * Validate mixed tech compliance
   */
  static validateMixedTech(
    config: UnitConfiguration, 
    equipment: any[], 
    context: TechLevelValidationContext
  ): MixedTechValidation {
    let innerSphereComponents = 0;
    let clanComponents = 0;
    const violations: string[] = [];
    
    // Count tech base components
    const allComponents = this.getAllComponents(config, equipment);
    
    for (const component of allComponents) {
      const techBase = component.techBase || 'Inner Sphere';
      if (techBase === 'Inner Sphere' || techBase === 'Star League') {
        innerSphereComponents++;
      } else if (techBase === 'Clan') {
        clanComponents++;
      }
    }
    
    const isMixed = innerSphereComponents > 0 && clanComponents > 0;
    const allowedMixed = context.allowMixedTech;
    
    const mixedTechRules: MixedTechRules = {
      allowMixedTech: allowedMixed,
      requiresSpecialPilot: isMixed,
      battleValueModifier: isMixed ? 1.25 : 1.0,
      restrictedCombinations: this.getRestrictedCombinations(),
      compatibilityMatrix: this.TECH_COMPATIBILITY
    };
    
    if (isMixed && !allowedMixed) {
      violations.push('Mixed tech detected but not allowed by current rules');
    }
    
    if (isMixed && context.enforceCanonicalRestrictions) {
      const restrictedCombos = this.checkRestrictedCombinations(allComponents);
      violations.push(...restrictedCombos);
    }
    
    return {
      isMixed,
      innerSphereComponents,
      clanComponents,
      allowedMixed,
      mixedTechRules,
      violations
    };
  }

  /**
   * Validate era restrictions
   */
  static validateEraRestrictions(
    config: UnitConfiguration, 
    equipment: any[], 
    era: string,
    context: TechLevelValidationContext
  ): EraValidation {
    const invalidComponents: EraViolation[] = [];
    const recommendations: string[] = [];
    
    const eraProgression: EraProgression = {
      currentEra: era,
      availableEras: this.ERA_TIMELINE.map(e => e.era),
      eraTimeline: this.ERA_TIMELINE,
      technologyIntroductions: this.getTechnologyIntroductions(era)
    };
    
    if (context.strictEraCompliance) {
      const allComponents = this.getAllComponents(config, equipment);
      
      for (const component of allComponents) {
        const availability = this.getComponentEraAvailability(component.name, component.techBase);
        
        if (availability && !this.isAvailableInEra(availability.era, era)) {
          invalidComponents.push({
            component: component.name,
            availableEra: availability.era,
            currentEra: era,
            earliestAvailability: availability.era,
            message: `${component.name} not available in ${era} (available from ${availability.era})`,
            severity: this.getEraViolationSeverity(availability.era, era)
          });
        }
      }
    }
    
    if (invalidComponents.length > 0) {
      recommendations.push(`Consider updating era to ${this.getRecommendedEra(invalidComponents)} to accommodate all components`);
      recommendations.push('Replace era-inappropriate components with period-appropriate alternatives');
    }
    
    return {
      isValid: invalidComponents.length === 0,
      era,
      targetEra: era,
      invalidComponents,
      eraProgression,
      recommendations
    };
  }

  /**
   * Validate availability ratings
   */
  static validateAvailabilityRating(
    equipment: any[], 
    config: UnitConfiguration,
    context: TechLevelValidationContext
  ): AvailabilityValidation {
    const violations: AvailabilityViolation[] = [];
    const componentRatings: ComponentAvailability[] = [];
    
    const allComponents = this.getAllComponents(config, equipment);
    const targetRating = context.targetAvailabilityRating;
    
    for (const component of allComponents) {
      const availability = this.getComponentAvailability(component, config);
      componentRatings.push(availability);
      
      if (this.isRatingWorse(availability.rating, targetRating)) {
        violations.push({
          component: component.name,
          rating: availability.rating,
          requiredRating: targetRating,
          message: `${component.name} availability rating ${availability.rating} exceeds target ${targetRating}`,
          severity: this.getAvailabilitySeverity(availability.rating, targetRating),
          impact: `Increases unit rarity and procurement difficulty`
        });
      }
    }
    
    const ratingBreakdown = this.calculateAvailabilityBreakdown(componentRatings, targetRating);
    const overallRating = this.calculateOverallAvailabilityRating(componentRatings);
    
    return {
      isValid: violations.length === 0,
      overallRating,
      componentRatings,
      ratingBreakdown,
      violations
    };
  }

  /**
   * Validate tech base compliance
   */
  static validateTechBaseCompliance(
    config: UnitConfiguration, 
    equipment: any[],
    context: TechLevelValidationContext
  ): TechBaseCompliance {
    const unitTechBase = config.techBase || 'Inner Sphere';
    const componentTechBases: ComponentTechBase[] = [];
    const conflicts: TechBaseConflict[] = [];
    
    const allComponents = this.getAllComponents(config, equipment);
    
    for (const component of allComponents) {
      const componentTechBase = component.techBase || 'Inner Sphere';
      const isCompliant = this.isTechBaseCompatible(unitTechBase, componentTechBase, context);
      
      componentTechBases.push({
        component: component.name,
        techBase: componentTechBase,
        category: component.category || 'equipment',
        isCompliant,
        notes: isCompliant ? 'Compatible' : 'Tech base conflict'
      });
      
      if (!isCompliant) {
        conflicts.push({
          component: component.name,
          unitTechBase,
          componentTechBase,
          conflictType: this.getConflictType(unitTechBase, componentTechBase),
          resolution: this.getConflictResolution(unitTechBase, componentTechBase),
          severity: this.getConflictSeverity(unitTechBase, componentTechBase)
        });
      }
    }
    
    const complianceScore = this.calculateComplianceScore(componentTechBases);
    
    return {
      isValid: conflicts.length === 0,
      unitTechBase,
      componentTechBases,
      conflicts,
      complianceScore
    };
  }

  /**
   * Generate tech optimization recommendations
   */
  static generateTechOptimizations(config: UnitConfiguration, equipment: any[]): TechOptimization {
    const recommendations: TechOptimizationRecommendation[] = [];
    const alternativeTechBases: AlternativeTechBase[] = [];
    const upgradePaths: TechUpgradePath[] = [];
    
    // Analyze current tech configuration
    const validation = this.validateTechLevel(config, equipment);
    
    // Generate tech base alternatives
    if (validation.techBaseCompliance.conflicts.length > 0) {
      alternativeTechBases.push(...this.generateAlternativeTechBases(config, equipment));
    }
    
    // Generate upgrade paths
    if (validation.availability.violations.length > 0) {
      upgradePaths.push(...this.generateUpgradePaths(config, equipment));
    }
    
    // Generate specific recommendations
    if (validation.mixedTech.isMixed && !validation.mixedTech.allowedMixed) {
      recommendations.push({
        type: 'tech_base_change',
        description: 'Standardize to single tech base',
        benefit: 'Eliminates mixed tech violations and simplifies procurement',
        fromValue: 'Mixed',
        toValue: validation.unitTechBase,
        impact: {
          availabilityChange: 10,
          costChange: -15,
          performanceChange: 0,
          compatibilityChange: 25,
          ruleCompliance: 30
        },
        difficulty: 'moderate',
        priority: 'high'
      });
    }
    
    const costAnalysis = this.calculateTechCostAnalysis(config, equipment, recommendations);
    
    return {
      recommendations,
      alternativeTechBases,
      upgradePaths,
      costAnalysis
    };
  }

  /**
   * Calculate tech level efficiency score (0-100)
   */
  static calculateTechEfficiency(config: UnitConfiguration, equipment: any[]): number {
    const validation = this.validateTechLevel(config, equipment);
    let efficiency = 100;
    
    // Penalize violations
    validation.violations.forEach(violation => {
      switch (violation.severity) {
        case 'critical':
          efficiency -= 25;
          break;
        case 'major':
          efficiency -= 15;
          break;
        case 'minor':
          efficiency -= 5;
          break;
      }
    });
    
    // Bonus for good availability
    const avgAvailability = this.calculateAverageAvailabilityScore(validation.availability.componentRatings);
    efficiency += Math.max(0, (avgAvailability - 3) * 5); // Bonus for better than 'C' rating
    
    // Bonus for tech base consistency
    if (!validation.mixedTech.isMixed) {
      efficiency += 10;
    }
    
    return Math.max(0, Math.min(100, efficiency));
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
        name: 'Tech Base Compatibility',
        description: 'Components must be compatible with unit tech base',
        severity: 'major',
        category: 'tech_level'
      },
      {
        name: 'Era Restrictions',
        description: 'Components must be available in the selected era',
        severity: 'major',
        category: 'tech_level'
      },
      {
        name: 'Mixed Tech Rules',
        description: 'Mixed tech usage must follow canonical restrictions',
        severity: 'major',
        category: 'tech_level'
      },
      {
        name: 'Availability Rating',
        description: 'Component availability should meet target rating requirements',
        severity: 'minor',
        category: 'tech_level'
      }
    ];
  }

  // ===== PRIVATE HELPER METHODS =====

  private static determineUnitTechLevel(config: UnitConfiguration, equipment: any[]): string {
    // Simplified tech level determination
    const hasAdvancedTech = equipment.some(item => 
      item.equipmentData?.name?.toLowerCase().includes('advanced') ||
      item.equipmentData?.name?.toLowerCase().includes('improved')
    );
    
    const hasClanTech = equipment.some(item => 
      item.equipmentData?.techBase === 'Clan'
    );
    
    if (hasClanTech) return 'Advanced';
    if (hasAdvancedTech) return 'Advanced';
    return 'Standard';
  }

  private static determineEra(config: UnitConfiguration): string {
    // Default era determination - in real implementation would be configurable
    return 'Succession Wars';
  }

  private static getAllComponents(config: UnitConfiguration, equipment: any[]): Array<{
    name: string;
    techBase: string;
    category: string;
  }> {
    const components: Array<{ name: string; techBase: string; category: string }> = [];
    const unitTechBase = config.techBase || 'Inner Sphere';
    
    // Add system components with proper tech base inheritance
    components.push({
      name: `${this.extractComponentType(config.structureType)} Structure`,
      techBase: config.structureType?.techBase || unitTechBase,
      category: 'structure'
    });
    
    components.push({
      name: `${this.extractComponentType(config.armorType)} Armor`,
      techBase: config.armorType?.techBase || unitTechBase,
      category: 'armor'
    });
    
    components.push({
      name: `${config.engineType || 'Standard'} Engine`,
      techBase: unitTechBase, // Use unit tech base, not hardcoded
      category: 'engine'
    });
    
    // Add equipment
    equipment.forEach(item => {
      components.push({
        name: item.equipmentData?.name || 'Unknown',
        techBase: item.equipmentData?.techBase || unitTechBase,
        category: item.equipmentData?.type || 'equipment'
      });
    });
    
    return components;
  }

  private static getRestrictedCombinations(): string[] {
    return [
      'Clan weapons with Inner Sphere targeting computers',
      'Inner Sphere ammunition with Clan weapons',
      'Mixed heat sink types',
      'Clan XL engines with Inner Sphere components'
    ];
  }

  private static checkRestrictedCombinations(components: Array<{ name: string; techBase: string; category: string }>): string[] {
    const violations: string[] = [];
    
    // Check for common incompatible combinations
    const clanWeapons = components.filter(c => c.category === 'weapon' && c.techBase === 'Clan');
    const isTargetingComputer = components.some(c => c.name.toLowerCase().includes('targeting computer') && c.techBase === 'Inner Sphere');
    
    if (clanWeapons.length > 0 && isTargetingComputer) {
      violations.push('Clan weapons with Inner Sphere targeting computer detected');
    }
    
    return violations;
  }

  private static getTechnologyIntroductions(era: string): TechIntroduction[] {
    // Simplified tech introduction data
    return [
      {
        technology: 'Double Heat Sinks',
        era: 'Star League',
        year: 2571,
        techBase: 'Star League',
        description: 'Advanced heat dissipation technology'
      },
      {
        technology: 'Endo Steel',
        era: 'Star League',
        year: 2571,
        techBase: 'Star League',
        description: 'Lightweight internal structure'
      },
      {
        technology: 'Ferro-Fibrous Armor',
        era: 'Star League',
        year: 2571,
        techBase: 'Star League',
        description: 'Lightweight armor technology'
      }
    ];
  }

  private static getComponentEraAvailability(componentName: string, techBase: string): { era: string } | null {
    // Normalized component name for better matching
    const lowerName = componentName.toLowerCase();
    
    // Star League era components (lost technology)
    const starLeagueComponents = [
      'double heat sink',
      'endo steel',
      'ferro-fibrous',
      'xl engine',
      'light engine',
      'pulse laser',
      'er laser',
      'ultra ac',
      'lb-x ac',
      'streak srm',
      'artemis'
    ];
    
    // Check for Star League technology first
    if (starLeagueComponents.some(comp => lowerName.includes(comp))) {
      return { era: 'Star League' };
    }
    
    // Clan technology is available from Clan Invasion era
    if (techBase === 'Clan') {
      return { era: 'Clan Invasion' };
    }
    
    // Standard Inner Sphere technology available from Succession Wars
    return { era: 'Succession Wars' }; // Default era
  }

  private static isAvailableInEra(componentEra: string, targetEra: string): boolean {
    const eraOrder = this.ERA_TIMELINE.map(e => e.era);
    const componentIndex = eraOrder.indexOf(componentEra);
    const targetIndex = eraOrder.indexOf(targetEra);
    
    if (componentIndex === -1 || targetIndex === -1) return true; // Unknown eras default to available
    
    // Handle lost technology: Star League tech is NOT available in Succession Wars
    if (componentEra === 'Star League' && targetEra === 'Succession Wars') {
      return false;
    }
    
    // Clan technology is only available from Clan Invasion era onward
    if (componentEra === 'Clan Invasion' && targetIndex < eraOrder.indexOf('Clan Invasion')) {
      return false;
    }
    
    // Generally, technology is available from its introduction era onward
    // BUT Star League tech is lost during Succession Wars and regained later
    if (componentEra === 'Star League') {
      // Star League tech is available in Star League era and later eras (except Succession Wars)
      return targetEra === 'Star League' || targetIndex >= eraOrder.indexOf('Clan Invasion');
    }
    
    // Standard availability: component is available from its era onward
    return componentIndex <= targetIndex;
  }

  private static getEraViolationSeverity(componentEra: string, currentEra: string): 'critical' | 'major' | 'minor' {
    const eraOrder = this.ERA_TIMELINE.map(e => e.era);
    const componentIndex = eraOrder.indexOf(componentEra);
    const currentIndex = eraOrder.indexOf(currentEra);
    
    const eraDifference = componentIndex - currentIndex;
    
    if (eraDifference > 2) return 'critical';
    if (eraDifference > 1) return 'major';
    return 'minor';
  }

  private static getRecommendedEra(invalidComponents: EraViolation[]): string {
    // Find the latest era required by any component
    const requiredEras = invalidComponents.map(c => c.availableEra);
    const eraOrder = this.ERA_TIMELINE.map(e => e.era);
    
    let latestEraIndex = -1;
    for (const era of requiredEras) {
      const index = eraOrder.indexOf(era);
      if (index > latestEraIndex) {
        latestEraIndex = index;
      }
    }
    
    return latestEraIndex >= 0 ? eraOrder[latestEraIndex] : 'Succession Wars';
  }

  private static getComponentAvailability(component: { name: string; techBase: string; category: string }, config: UnitConfiguration): ComponentAvailability {
    const unitTechBase = config.techBase || 'Inner Sphere';
    
    // Start with default availability
    let rating = 'C'; // Default to uncommon
    let cost = 1.5;
    let rarity = 'Uncommon';
    
    // Basic components are more common
    if (component.category === 'structure' && component.name.includes('Standard')) {
      rating = 'A';
      cost = 1.0;
      rarity = 'Very Common';
    }
    
    // Advanced components are rarer
    if (component.name.includes('Double') || component.name.includes('Endo') || 
        component.name.includes('Ferro') || component.name.includes('XL')) {
      rating = 'D';
      cost = 2.0;
      rarity = 'Rare';
    }
    
    // Clan components are always very rare (E rating) regardless of unit tech base
    // This reflects their rarity in the Inner Sphere and even in Clan space
    if (component.techBase === 'Clan') {
      rating = 'E';
      cost = 3.0;
      rarity = 'Very Rare';
    } else if (component.techBase === 'Inner Sphere' && unitTechBase === 'Clan') {
      // Inner Sphere components on Clan units are rare (salvage/captured)
      rating = rating === 'A' ? 'C' : (rating === 'C' ? 'D' : rating);
      cost = cost * 1.5;
      rarity = rating === 'D' ? 'Rare' : 'Uncommon';
    }
    
    return {
      component: component.name,
      rating,
      available: true,
      techBase: component.techBase,
      era: this.determineEra(config),
      rarity,
      cost,
      notes: `${rarity} availability in current era`
    };
  }

  private static isRatingWorse(rating: string, targetRating: string): boolean {
    const ratingOrder = ['A', 'B', 'C', 'D', 'E', 'F', 'X'];
    const ratingIndex = ratingOrder.indexOf(rating);
    const targetIndex = ratingOrder.indexOf(targetRating);
    
    // Handle invalid target ratings gracefully
    if (targetIndex === -1) {
      return false; // If target rating is invalid, don't flag as violation
    }
    
    return ratingIndex > targetIndex;
  }

  private static getAvailabilitySeverity(rating: string, targetRating: string): 'critical' | 'major' | 'minor' {
    const ratingOrder = ['A', 'B', 'C', 'D', 'E', 'F', 'X'];
    const ratingIndex = ratingOrder.indexOf(rating);
    const targetIndex = ratingOrder.indexOf(targetRating);
    
    const difference = ratingIndex - targetIndex;
    
    if (difference > 2) return 'critical';
    if (difference > 1) return 'major';
    return 'minor';
  }

  private static calculateAvailabilityBreakdown(ratings: ComponentAvailability[], targetRating: string): AvailabilityBreakdown {
    const totalComponents = ratings.length;
    const ratingDistribution: { [rating: string]: number } = {};
    
    // Count rating distribution
    ratings.forEach(r => {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    });
    
    // Calculate average rating
    const ratingOrder = ['A', 'B', 'C', 'D', 'E', 'F', 'X'];
    const averageRating = ratings.reduce((sum, r) => sum + ratingOrder.indexOf(r.rating), 0) / totalComponents;
    
    const limitingFactors = ratings.filter(r => this.isRatingWorse(r.rating, targetRating))
      .map(r => r.component);
    
    const improvementSuggestions = [
      'Replace rare components with more common alternatives',
      'Consider different tech base for better availability',
      'Adjust era settings to match component availability'
    ];
    
    return {
      totalComponents,
      ratingDistribution,
      averageRating,
      limitingFactors,
      improvementSuggestions
    };
  }

  private static calculateOverallAvailabilityRating(ratings: ComponentAvailability[]): string {
    if (ratings.length === 0) return 'A';
    
    // Use the worst rating as the overall rating
    const ratingOrder = ['A', 'B', 'C', 'D', 'E', 'F', 'X'];
    let worstIndex = 0;
    
    ratings.forEach(r => {
      const index = ratingOrder.indexOf(r.rating);
      if (index > worstIndex) {
        worstIndex = index;
      }
    });
    
    return ratingOrder[worstIndex];
  }

  private static isTechBaseCompatible(unitTechBase: string, componentTechBase: string, context: TechLevelValidationContext): boolean {
    if (unitTechBase === 'Mixed' || context.allowMixedTech) {
      return true; // Mixed tech allows everything
    }
    
    const compatibility = this.TECH_COMPATIBILITY[unitTechBase];
    if (!compatibility) return false;
    
    return compatibility.compatible.includes(componentTechBase) && 
           !compatibility.forbidden.includes(componentTechBase);
  }

  private static getConflictType(unitTechBase: string, componentTechBase: string): 'incompatible' | 'restricted' | 'requires_mixed' {
    const compatibility = this.TECH_COMPATIBILITY[unitTechBase];
    if (!compatibility) return 'incompatible';
    
    if (compatibility.forbidden.includes(componentTechBase)) {
      return 'incompatible';
    }
    
    if (compatibility.restricted.includes(componentTechBase)) {
      return 'requires_mixed';
    }
    
    return 'restricted';
  }

  private static getConflictResolution(unitTechBase: string, componentTechBase: string): string {
    if (unitTechBase === 'Inner Sphere' && componentTechBase === 'Clan') {
      return 'Replace with Inner Sphere equivalent or enable mixed tech';
    }
    
    if (unitTechBase === 'Clan' && componentTechBase === 'Inner Sphere') {
      return 'Replace with Clan equivalent or enable mixed tech';
    }
    
    return `Select compatible component for ${unitTechBase} tech base`;
  }

  private static getConflictSeverity(unitTechBase: string, componentTechBase: string): 'critical' | 'major' | 'minor' {
    const compatibility = this.TECH_COMPATIBILITY[unitTechBase];
    if (!compatibility) return 'critical';
    
    if (compatibility.forbidden.includes(componentTechBase)) {
      return 'critical';
    }
    
    if (compatibility.restricted.includes(componentTechBase)) {
      return 'major';
    }
    
    return 'minor';
  }

  private static calculateComplianceScore(componentTechBases: ComponentTechBase[]): number {
    if (componentTechBases.length === 0) return 100;
    
    const compliantComponents = componentTechBases.filter(ctb => ctb.isCompliant).length;
    return Math.round((compliantComponents / componentTechBases.length) * 100);
  }

  private static generateAlternativeTechBases(config: UnitConfiguration, equipment: any[]): AlternativeTechBase[] {
    const alternatives: AlternativeTechBase[] = [];
    
    // Inner Sphere alternative
    if (config.techBase !== 'Inner Sphere') {
      alternatives.push({
        name: 'Inner Sphere Standard',
        description: 'Convert to pure Inner Sphere technology',
        techBase: 'Inner Sphere',
        era: 'Succession Wars',
        advantages: ['Widely available', 'Lower cost', 'Easier maintenance'],
        disadvantages: ['Lower performance', 'Heavier components'],
        componentChanges: [],
        overallRating: 75
      });
    }
    
    // Clan alternative
    if (config.techBase !== 'Clan') {
      alternatives.push({
        name: 'Clan Technology',
        description: 'Convert to pure Clan technology',
        techBase: 'Clan',
        era: 'Clan Invasion',
        advantages: ['Superior performance', 'Lighter weight', 'Advanced capabilities'],
        disadvantages: ['Very rare', 'Expensive', 'Difficult maintenance'],
        componentChanges: [],
        overallRating: 90
      });
    }
    
    return alternatives;
  }

  private static generateUpgradePaths(config: UnitConfiguration, equipment: any[]): TechUpgradePath[] {
    const upgradePaths: TechUpgradePath[] = [];
    
    upgradePaths.push({
      name: 'Availability Improvement',
      description: 'Replace rare components with more common alternatives',
      steps: [
        {
          step: 1,
          description: 'Replace exotic components',
          components: ['Advanced components'],
          cost: 1000,
          timeline: '1 month',
          prerequisites: ['Component analysis']
        }
      ],
      totalCost: 1000,
      timeframe: '1 month',
      feasibility: 85
    });
    
    return upgradePaths;
  }

  private static calculateTechCostAnalysis(config: UnitConfiguration, equipment: any[], recommendations: TechOptimizationRecommendation[]): TechCostAnalysis {
    const baselineCost = 100000; // Simplified baseline cost
    const optimizedCost = baselineCost * 0.85; // 15% savings from optimizations
    
    return {
      baselineCost,
      optimizedCost,
      savings: baselineCost - optimizedCost,
      costBreakdown: {
        components: 60000,
        research: 10000,
        development: 15000,
        production: 10000,
        maintenance: 5000
      },
      returnOnInvestment: 0.15
    };
  }

  private static calculateAverageAvailabilityScore(ratings: ComponentAvailability[]): number {
    if (ratings.length === 0) return 0;
    
    const ratingOrder = ['A', 'B', 'C', 'D', 'E', 'F', 'X'];
    const totalScore = ratings.reduce((sum, r) => sum + ratingOrder.indexOf(r.rating), 0);
    
    return totalScore / ratings.length;
  }

  private static extractComponentType(component: any): string {
    if (typeof component === 'string') return component;
    return component?.type || 'Standard';
  }

  private static adjustContextForTechBase(
    context: TechLevelValidationContext, 
    config: UnitConfiguration, 
    equipment: any[]
  ): TechLevelValidationContext {
    const adjustedContext = { ...context };
    const allComponents = this.getAllComponents(config, equipment);
    
    // Check if this is a pure tech base unit
    const unitTechBase = config.techBase || 'Inner Sphere';
    const isPureTechBase = allComponents.every(component => 
      component.techBase === unitTechBase || 
      component.techBase === 'Star League' // Star League is compatible with both
    );
    
    // For pure Clan units, adjust target availability to be more lenient
    if (isPureTechBase && unitTechBase === 'Clan') {
      // Clan components are inherently rare (E), so adjust target to E for pure Clan units
      adjustedContext.targetAvailabilityRating = 'E';
    }
    
    return adjustedContext;
  }
}
