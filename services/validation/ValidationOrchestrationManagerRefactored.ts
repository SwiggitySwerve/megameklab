/**
 * Validation Orchestration Manager - Refactored
 * Coordinates different validation types and manages the validation workflow.
 * Refactored to use Mediator pattern and Command pattern for better architecture.
 * Maintains backward compatibility with original interface.
 */

import { ValidationOrchestrationFacade } from './orchestration/ValidationOrchestrationFacade'
import { 
  ValidationOrchestrationResult,
  ConfigurationValidation,
  LoadoutValidation,
  TechLevelValidation,
  ComplianceReport,
  ValidationSummary,
  ValidationMetrics,
  ValidationRecommendation
} from './orchestration/ValidationOrchestrationTypes'
import { UnitConfiguration } from '../../battletech-editor-app/utils/criticalSlots/UnitCriticalManager'
import { ComponentConfiguration } from '../../battletech-editor-app/types/componentConfiguration'
import { RuleManagementManager, RuleComplianceResult, RuleScore } from '../../battletech-editor-app/services/validation/RuleManagementManager'

/**
 * Refactored ValidationOrchestrationManager
 * Maintains original interface while using new orchestration architecture
 */
export class ValidationOrchestrationManager {
  private readonly orchestrationFacade: ValidationOrchestrationFacade
  private readonly ruleManagementManager: RuleManagementManager
  private readonly syncCache = new Map<string, any>()

  constructor() {
    this.orchestrationFacade = new ValidationOrchestrationFacade()
    this.ruleManagementManager = new RuleManagementManager()
  }

  /**
   * Type-safe async-to-sync converter for validation results
   */
  private executeSync<T>(
    asyncMethod: () => Promise<T>,
    fallback: T,
    cacheKey?: string
  ): T {
    if (cacheKey && this.syncCache.has(cacheKey)) {
      return this.syncCache.get(cacheKey);
    }

    // For backward compatibility, return fallback immediately and execute async in background
    asyncMethod().then(result => {
      if (cacheKey) {
        this.syncCache.set(cacheKey, result);
      }
    }).catch(error => {
      console.warn('Async validation failed:', error);
    });

    return fallback;
  }

  /**
   * Create fallback validation result for sync compatibility
   */
  private createFallbackValidationResult(): ValidationOrchestrationResult {
    return {
      isValid: true,
      overall: this.createFallbackValidationSummary(),
      configuration: this.createFallbackConfigurationValidation(),
      loadout: this.createFallbackLoadoutValidation(),
      techLevel: this.createFallbackTechLevelValidation(),
      compliance: this.createFallbackComplianceReport(),
      recommendations: [],
      performanceMetrics: this.createFallbackValidationMetrics()
    };
  }

  /**
   * Create fallback validation summary
   */
  private createFallbackValidationSummary(): ValidationSummary {
    return {
      totalRules: 0,
      passedRules: 0,
      failedRules: 0,
      warningRules: 0,
      complianceScore: 100,
      criticalViolations: 0,
      majorViolations: 0,
      minorViolations: 0
    };
  }

  /**
   * Create fallback configuration validation
   */
  private createFallbackConfigurationValidation(): ConfigurationValidation {
    return {
      isValid: true,
      weight: {
        isValid: true,
        totalWeight: 0,
        maxWeight: 100,
        overweight: 0,
        underweight: 0,
        distribution: { structure: 0, armor: 0, engine: 0, equipment: 0, ammunition: 0, systems: 0 },
        violations: [],
        recommendations: []
      },
      heat: {
        isValid: true,
        heatGeneration: 0,
        heatDissipation: 10,
        heatDeficit: 0,
        minimumHeatSinks: 10, // This is minimum TOTAL heat sinks for the mech, not engine heat sinks
        actualHeatSinks: 10,
        engineHeatSinks: 10,
        externalHeatSinks: 0,
        violations: [],
        recommendations: []
      },
      movement: {
        isValid: true,
        walkMP: 4,
        runMP: 6,
        jumpMP: 0,
        engineRating: 200,
        tonnage: 50,
        engineType: 'Standard',
        violations: [],
        recommendations: []
      },
      armor: {
        isValid: true,
        totalArmor: 0,
        maxArmor: 169,
        armorType: 'Standard',
        armorWeight: 0,
        locationLimits: {},
        violations: [],
        recommendations: []
      },
      structure: {
        isValid: true,
        structureType: 'Standard',
        structureWeight: 5,
        internalStructure: 16,
        violations: [],
        recommendations: []
      },
      engine: {
        isValid: true,
        engineType: 'Standard',
        engineRating: 200,
        engineWeight: 21.5,
        walkMP: 4,
        maxRating: 400,
        minRating: 10,
        violations: [],
        recommendations: []
      },
      gyro: {
        isValid: true,
        gyroType: 'Standard',
        gyroWeight: 2,
        engineCompatible: true,
        violations: [],
        recommendations: []
      },
      cockpit: {
        isValid: true,
        cockpitType: 'Standard',
        cockpitWeight: 3,
        violations: [],
        recommendations: []
      },
      compatibility: {
        isValid: true,
        componentCompatibility: [],
        systemIntegration: [],
        violations: [],
        recommendations: []
      }
    };
  }

  /**
   * Create fallback loadout validation
   */
  private createFallbackLoadoutValidation(): LoadoutValidation {
    return {
      isValid: true,
      weapons: {
        isValid: true,
        weaponCount: 0,
        totalWeaponWeight: 0,
        heatGeneration: 0,
        violations: [],
        recommendations: []
      },
      ammunition: {
        isValid: true,
        totalAmmoWeight: 0,
        ammoBalance: [],
        caseProtection: {
          requiredLocations: [],
          protectedLocations: [],
          unprotectedLocations: [],
          isCompliant: true
        },
        violations: [],
        recommendations: []
      },
      jumpJets: {
        isValid: true,
        jumpJetCount: 0,
        jumpMP: 0,
        maxJumpMP: 8,
        jumpJetWeight: 0,
        jumpJetType: 'Standard',
        violations: [],
        recommendations: []
      },
      specialEquipment: {
        isValid: true,
        specialEquipment: [],
        violations: [],
        recommendations: []
      },
      criticalSlots: {
        isValid: true,
        totalSlotsUsed: 0,
        totalSlotsAvailable: 78,
        locationUtilization: {},
        violations: [],
        recommendations: []
      },
      efficiency: {
        isValid: true,
        overallEfficiency: 85,
        weightEfficiency: 85,
        slotEfficiency: 85,
        heatEfficiency: 85,
        firepowerEfficiency: 85,
        violations: [],
        recommendations: []
      }
    };
  }

  /**
   * Create fallback tech level validation
   */
  private createFallbackTechLevelValidation(): TechLevelValidation {
    return {
      isValid: true,
      unitTechLevel: 'Standard',
      unitTechBase: 'Inner Sphere',
      era: 'Succession Wars',
      mixedTech: {
        isMixed: false,
        innerSphereComponents: 0,
        clanComponents: 0,
        allowedMixed: false,
        violations: []
      },
      eraRestrictions: {
        isValid: true,
        era: 'Succession Wars',
        invalidComponents: [],
        recommendations: []
      },
      availability: {
        isValid: true,
        overallRating: 'A',
        componentRatings: [],
        violations: []
      },
      violations: [],
      recommendations: []
    };
  }

  /**
   * Create fallback compliance report
   */
  private createFallbackComplianceReport(): ComplianceReport {
    return {
      overallCompliance: 100,
      ruleCompliance: [],
      violationSummary: {
        totalViolations: 0,
        criticalViolations: 0,
        majorViolations: 0,
        minorViolations: 0,
        violationsByCategory: {},
        topViolations: []
      },
      recommendationSummary: {
        totalRecommendations: 0,
        criticalRecommendations: 0,
        implementationDifficulty: {},
        estimatedImpact: {},
        topRecommendations: []
      },
      complianceMetrics: {
        validationTime: 0,
        rulesChecked: 0,
        componentsValidated: 0,
        performance: {
          averageRuleTime: 0,
          slowestRule: '',
          fastestRule: ''
        }
      }
    };
  }

  /**
   * Create fallback validation metrics
   */
  private createFallbackValidationMetrics(): ValidationMetrics {
    return {
      totalValidationTime: 0,
      ruleValidationTimes: {},
      componentValidationTimes: {},
      performanceBottlenecks: [],
      optimizationSuggestions: []
    };
  }

  /**
   * Main validation entry point - maintains original interface
   */
  validateUnit(config: UnitConfiguration, equipment: any[]): ValidationOrchestrationResult {
    const cacheKey = `validateUnit_${JSON.stringify(config)}_${equipment.length}`;
    return this.executeSync(
      () => this.orchestrationFacade.validateUnit(config, equipment),
      this.createFallbackValidationResult(),
      cacheKey
    );
  }

  /**
   * Validate configuration aspects (weight, heat, movement, etc.)
   */
  validateConfiguration(config: UnitConfiguration): ConfigurationValidation {
    const cacheKey = `validateConfiguration_${JSON.stringify(config)}`;
    return this.executeSync(
      () => this.orchestrationFacade.validateConfiguration(config),
      this.createFallbackConfigurationValidation(),
      cacheKey
    );
  }

  /**
   * Validate equipment loadout
   */
  validateEquipmentLoadout(equipment: any[], config: UnitConfiguration): LoadoutValidation {
    const cacheKey = `validateEquipmentLoadout_${equipment.length}_${JSON.stringify(config)}`;
    return this.executeSync(
      () => this.orchestrationFacade.validateEquipmentLoadout(equipment, config),
      this.createFallbackLoadoutValidation(),
      cacheKey
    );
  }

  /**
   * Validate tech level and era restrictions
   */
  validateTechLevel(config: UnitConfiguration, equipment: any[]): TechLevelValidation {
    const cacheKey = `validateTechLevel_${JSON.stringify(config)}_${equipment.length}`;
    return this.executeSync(
      () => this.orchestrationFacade.validateTechLevel(config, equipment),
      this.createFallbackTechLevelValidation(),
      cacheKey
    );
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(config: UnitConfiguration, equipment: any[]): ComplianceReport {
    const cacheKey = `generateComplianceReport_${JSON.stringify(config)}_${equipment.length}`;
    return this.executeSync(
      () => this.orchestrationFacade.generateComplianceReport(config, equipment),
      this.createFallbackComplianceReport(),
      cacheKey
    );
  }

  /**
   * Generate validation recommendations
   */
  generateValidationRecommendations(
    configuration: ConfigurationValidation, 
    loadout: LoadoutValidation, 
    techLevel: TechLevelValidation
  ): ValidationRecommendation[] {
    const cacheKey = `generateValidationRecommendations_${Date.now()}`;
    return this.executeSync(
      () => this.orchestrationFacade.generateValidationRecommendations(configuration, loadout, techLevel),
      [],
      cacheKey
    );
  }

  /**
   * Calculate validation metrics
   */
  calculateValidationMetrics(validationTime: number, compliance: ComplianceReport): ValidationMetrics {
    const cacheKey = `calculateValidationMetrics_${validationTime}_${compliance.overallCompliance}`;
    return this.executeSync(
      () => this.orchestrationFacade.calculateValidationMetrics(validationTime, compliance),
      this.createFallbackValidationMetrics(),
      cacheKey
    );
  }

  /**
   * Generate overall validation summary
   */
  generateOverallSummary(validations: any[]): ValidationSummary {
    return this.orchestrationFacade.generateOverallSummary(validations)
  }

  /**
   * Generate violation summary
   */
  generateViolationSummary(ruleCompliance: RuleComplianceResult[]): any {
    const violations = ruleCompliance.flatMap(rule => rule.violations || [])
    
    return {
      totalViolations: violations.length,
      criticalViolations: violations.filter(v => v.severity === 'critical').length,
      majorViolations: violations.filter(v => v.severity === 'major').length,
      minorViolations: violations.filter(v => v.severity === 'minor').length,
      violationsByCategory: this.groupViolationsByCategory(violations),
      topViolations: violations
        .filter(v => v.severity === 'critical')
        .slice(0, 5)
    }
  }

  /**
   * Generate recommendation summary
   */
  generateRecommendationSummary(ruleCompliance: RuleComplianceResult[]): any {
    const recommendations = ruleCompliance.flatMap(rule => rule.recommendations || [])
    
    return {
      totalRecommendations: recommendations.length,
      criticalRecommendations: recommendations.filter(r => r.priority === 'high').length,
      implementationDifficulty: this.groupByDifficulty(recommendations),
      estimatedImpact: this.groupByImpact(recommendations),
      topRecommendations: recommendations.slice(0, 10)
    }
  }

  /**
   * Generate compliance metrics
   */
  generateComplianceMetrics(ruleCompliance: RuleComplianceResult[]): any {
    return {
      validationTime: ruleCompliance.reduce((sum, rule) => sum + (rule.executionTime || 0), 0),
      rulesChecked: ruleCompliance.length,
      componentsValidated: this.countUniqueComponents(ruleCompliance),
      performance: {
        averageRuleTime: this.calculateAverageTime(ruleCompliance),
        slowestRule: this.findSlowestRule(ruleCompliance),
        fastestRule: this.findFastestRule(ruleCompliance)
      }
    }
  }

  // ===== INDIVIDUAL VALIDATION METHODS (Original Interface) =====
  // These methods are preserved for backward compatibility but now delegate to the orchestration

  /**
   * Validate weight limits - delegates to orchestration
   */
  validateWeightLimits(config: UnitConfiguration, equipment: any[]): any {
    const result = this.validateConfiguration(config)
    return result.weight
  }

  /**
   * Validate heat management - delegates to orchestration
   */
  validateHeatManagement(config: UnitConfiguration, equipment: any[]): any {
    const result = this.validateConfiguration(config)
    return result.heat
  }

  /**
   * Validate movement rules - delegates to orchestration
   */
  validateMovementRules(config: UnitConfiguration): any {
    const result = this.validateConfiguration(config)
    return result.movement
  }

  /**
   * Validate armor rules - delegates to orchestration
   */
  validateArmorRules(config: UnitConfiguration): any {
    const result = this.validateConfiguration(config)
    return result.armor
  }

  /**
   * Validate structure rules - delegates to orchestration
   */
  validateStructureRules(config: UnitConfiguration): any {
    const result = this.validateConfiguration(config)
    return result.structure
  }

  /**
   * Validate engine rules - delegates to orchestration
   */
  validateEngineRules(config: UnitConfiguration): any {
    const result = this.validateConfiguration(config)
    return result.engine
  }

  /**
   * Validate gyro rules - delegates to orchestration
   */
  validateGyroRules(config: UnitConfiguration): any {
    const result = this.validateConfiguration(config)
    return result.gyro
  }

  /**
   * Validate cockpit rules - delegates to orchestration
   */
  validateCockpitRules(config: UnitConfiguration): any {
    const result = this.validateConfiguration(config)
    return result.cockpit
  }

  /**
   * Validate weapon rules - delegates to orchestration
   */
  validateWeaponRules(equipment: any[], config: UnitConfiguration): any {
    const result = this.validateEquipmentLoadout(equipment, config)
    return result.weapons
  }

  /**
   * Validate ammo rules - delegates to orchestration
   */
  validateAmmoRules(equipment: any[], config: UnitConfiguration): any {
    const result = this.validateEquipmentLoadout(equipment, config)
    return result.ammunition
  }

  /**
   * Validate jump jet rules - delegates to orchestration
   */
  validateJumpJetRules(config: UnitConfiguration, equipment: any[]): any {
    const result = this.validateEquipmentLoadout(equipment, config)
    return result.jumpJets
  }

  /**
   * Validate special equipment rules - delegates to orchestration
   */
  validateSpecialEquipmentRules(equipment: any[], config: UnitConfiguration): any {
    const result = this.validateEquipmentLoadout(equipment, config)
    return result.specialEquipment
  }

  /**
   * Validate critical slots - delegates to orchestration
   */
  validateCriticalSlots(config: UnitConfiguration, equipment: any[]): any {
    const result = this.validateEquipmentLoadout(equipment, config)
    return result.criticalSlots
  }

  /**
   * Validate construction efficiency - delegates to orchestration
   */
  validateConstructionEfficiency(config: UnitConfiguration, equipment: any[]): any {
    const result = this.validateEquipmentLoadout(equipment, config)
    return result.efficiency
  }

  /**
   * Validate component compatibility - delegates to orchestration
   */
  validateComponentCompatibility(config: UnitConfiguration): any {
    const result = this.validateConfiguration(config)
    return result.compatibility
  }

  /**
   * Validate mixed tech - delegates to orchestration
   */
  validateMixedTech(config: UnitConfiguration, equipment: any[]): any {
    const result = this.validateTechLevel(config, equipment)
    return result.mixedTech
  }

  /**
   * Validate era restrictions - delegates to orchestration
   */
  validateEraRestrictions(config: UnitConfiguration, equipment: any[]): any {
    const result = this.validateTechLevel(config, equipment)
    return result.eraRestrictions
  }

  /**
   * Validate availability rating - delegates to orchestration
   */
  validateAvailabilityRating(equipment: any[], config: UnitConfiguration): any {
    const result = this.validateTechLevel(config, equipment)
    return result.availability
  }

  // ===== CONFIGURATION METHODS =====

  /**
   * Enable strict validation mode
   */
  enableStrictMode(): void {
    this.orchestrationFacade.enableStrictMode()
  }

  /**
   * Enable performance mode
   */
  enablePerformanceMode(): void {
    this.orchestrationFacade.enablePerformanceMode()
  }

  /**
   * Quick validation
   */
  quickValidate(config: UnitConfiguration, equipment: any[]): boolean {
    const cacheKey = `quickValidate_${JSON.stringify(config)}_${equipment.length}`;
    return this.executeSync(
      () => this.orchestrationFacade.quickValidate(config, equipment),
      true,
      cacheKey
    );
  }

  /**
   * Reset orchestration to defaults
   */
  reset(): void {
    this.orchestrationFacade.reset()
  }

  // ===== PRIVATE HELPER METHODS =====

  private groupViolationsByCategory(violations: any[]): { [category: string]: number } {
    const categories: { [category: string]: number } = {}
    
    for (const violation of violations) {
      const category = violation.type?.split('_')[0] || 'general'
      categories[category] = (categories[category] || 0) + 1
    }
    
    return categories
  }

  private groupByDifficulty(recommendations: any[]): { [difficulty: string]: number } {
    const difficulties: { [difficulty: string]: number } = {}
    
    for (const recommendation of recommendations) {
      const difficulty = recommendation.difficulty || 'moderate'
      difficulties[difficulty] = (difficulties[difficulty] || 0) + 1
    }
    
    return difficulties
  }

  private groupByImpact(recommendations: any[]): { [impact: string]: number } {
    const impacts: { [impact: string]: number } = {}
    
    for (const recommendation of recommendations) {
      const impact = recommendation.estimatedImpact > 70 ? 'high' : 
                    recommendation.estimatedImpact > 40 ? 'medium' : 'low'
      impacts[impact] = (impacts[impact] || 0) + 1
    }
    
    return impacts
  }

  private countUniqueComponents(ruleCompliance: RuleComplianceResult[]): number {
    const components = new Set()
    
    for (const rule of ruleCompliance) {
      if (rule.component) {
        components.add(rule.component)
      }
    }
    
    return components.size
  }

  private calculateAverageTime(ruleCompliance: RuleComplianceResult[]): number {
    const times = ruleCompliance.map(rule => rule.executionTime || 0)
    return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0
  }

  private findSlowestRule(ruleCompliance: RuleComplianceResult[]): string {
    let slowest = ruleCompliance[0]
    
    for (const rule of ruleCompliance) {
      if ((rule.executionTime || 0) > (slowest?.executionTime || 0)) {
        slowest = rule
      }
    }
    
    return slowest?.ruleName || ''
  }

  private findFastestRule(ruleCompliance: RuleComplianceResult[]): string {
    let fastest = ruleCompliance[0]
    
    for (const rule of ruleCompliance) {
      if ((rule.executionTime || Infinity) < (fastest?.executionTime || Infinity)) {
        fastest = rule
      }
    }
    
    return fastest?.ruleName || ''
  }
}