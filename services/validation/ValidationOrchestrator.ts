/**
 * Validation Orchestrator - SOLID Compliant Implementation
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Orchestrates validation, delegates actual validation to specialized services
 * - Open/Closed: Extensible through dependency injection, closed for modification
 * - Liskov Substitution: Properly implements IValidationOrchestrator interface
 * - Interface Segregation: Uses focused interfaces for different concerns
 * - Dependency Inversion: Depends on abstractions, not concrete implementations
 */

import { 
  IValidationOrchestrator,
  IConfigurationValidator,
  IEquipmentValidator,
  ITechLevelValidator,
  IComplianceReporter,
  ValidationOrchestrationResult,
  ConfigurationValidation,
  EquipmentValidation,
  TechLevelValidation,
  ComplianceReport
} from './interfaces/IValidationOrchestrator'
import { UnitConfiguration } from '../../battletech-editor-app/utils/criticalSlots/UnitCriticalManager'

/**
 * Main Validation Orchestrator
 * Coordinates validation across different domains while maintaining SOLID principles
 */
export class ValidationOrchestrator implements IValidationOrchestrator {
  
  constructor(
    private readonly configurationValidator: IConfigurationValidator,
    private readonly equipmentValidator: IEquipmentValidator,
    private readonly techLevelValidator: ITechLevelValidator,
    private readonly complianceReporter: IComplianceReporter
  ) {}

  /**
   * Orchestrates complete unit validation
   * Single Responsibility: Only coordinates, doesn't do actual validation
   */
  async validateUnit(config: UnitConfiguration, equipment: any[]): Promise<ValidationOrchestrationResult> {
    const startTime = Date.now()
    
    try {
      // Execute validations in parallel for better performance
      const [configuration, equipmentValidation, techLevel] = await Promise.all([
        this.validateConfiguration(config),
        this.validateEquipment(equipment, config),
        this.validateTechLevel(config, equipment)
      ])

      // Generate compliance report based on validation results
      const compliance = await this.generateComplianceReport(config, equipment)

      const executionTime = Date.now() - startTime
      const overallValid = configuration.isValid && equipmentValidation.isValid && techLevel.isValid

      return {
        configuration,
        equipment: equipmentValidation,
        techLevel,
        compliance,
        overallValid,
        executionTime
      }
    } catch (error) {
      throw new ValidationOrchestrationError(`Validation orchestration failed: ${error}`)
    }
  }

  /**
   * Validates configuration aspects
   * Dependency Inversion: Delegates to injected configuration validator
   */
  async validateConfiguration(config: UnitConfiguration): Promise<ConfigurationValidation> {
    return await this.configurationValidator.validateConfiguration(config)
  }

  /**
   * Validates equipment loadout
   * Dependency Inversion: Delegates to injected equipment validator
   */
  async validateEquipment(equipment: any[], config: UnitConfiguration): Promise<EquipmentValidation> {
    return await this.equipmentValidator.validateEquipment(equipment, config)
  }

  /**
   * Validates tech level restrictions
   * Dependency Inversion: Delegates to injected tech level validator
   */
  async validateTechLevel(config: UnitConfiguration, equipment: any[]): Promise<TechLevelValidation> {
    return await this.techLevelValidator.validateTechLevel(config, equipment)
  }

  /**
   * Generates compliance report
   * Dependency Inversion: Delegates to injected compliance reporter
   */
  async generateComplianceReport(config: UnitConfiguration, equipment: any[]): Promise<ComplianceReport> {
    return await this.complianceReporter.generateComplianceReport(config, equipment)
  }

  /**
   * Quick validation for performance-critical scenarios
   * Open/Closed: Can be extended with different quick validation strategies
   */
  async quickValidate(config: UnitConfiguration, equipment: any[]): Promise<boolean> {
    try {
      // Perform minimal validation checks
      const criticalChecks = await Promise.all([
        this.quickConfigurationCheck(config),
        this.quickEquipmentCheck(equipment, config)
      ])

      return criticalChecks.every(check => check)
    } catch (error) {
      return false
    }
  }

  /**
   * Quick configuration validation
   * Single Responsibility: Only checks critical configuration issues
   */
  private async quickConfigurationCheck(config: UnitConfiguration): Promise<boolean> {
    // Basic weight check - use tonnage instead of weight
    if (config.tonnage > 100) { // Basic sanity check
      return false
    }

    // Basic heat check
    const estimatedHeat = this.estimateHeatGeneration(config)
    const heatDissipation = this.estimateHeatDissipation(config)
    if (estimatedHeat > heatDissipation * 1.5) {
      return false
    }

    return true
  }

  /**
   * Quick equipment validation
   * Single Responsibility: Only checks critical equipment issues
   */
  private async quickEquipmentCheck(equipment: any[], config: UnitConfiguration): Promise<boolean> {
    // Check if equipment fits in critical slots
    const totalSlots = equipment.reduce((sum, eq) => sum + (eq.criticalSlots || 0), 0)
    const availableSlots = this.calculateAvailableSlots(config)
    
    return totalSlots <= availableSlots
  }

  /**
   * Estimates heat generation for quick validation
   */
  private estimateHeatGeneration(config: UnitConfiguration): number {
    // Simple estimation based on engine rating
    return Math.floor(config.engineRating / 25)
  }

  /**
   * Estimates heat dissipation for quick validation
   */
  private estimateHeatDissipation(config: UnitConfiguration): number {
    // Base dissipation + heat sinks
    return 10 + (config.totalHeatSinks || 0)
  }

  /**
   * Calculates available critical slots
   */
  private calculateAvailableSlots(config: UnitConfiguration): number {
    // Basic slot calculation based on tonnage
    if (config.tonnage <= 35) return 40      // Light
    if (config.tonnage <= 55) return 50      // Medium
    if (config.tonnage <= 75) return 60      // Heavy
    return 70                                // Assault
  }
}

/**
 * Custom error class for validation orchestration
 * Single Responsibility: Handles validation orchestration specific errors
 */
export class ValidationOrchestrationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationOrchestrationError'
  }
}

/**
 * Factory for creating ValidationOrchestrator instances
 * Open/Closed: Can be extended with different validator implementations
 * Dependency Inversion: Creates instances with proper dependencies
 */
export class ValidationOrchestratorFactory {
  static create(
    configurationValidator: IConfigurationValidator,
    equipmentValidator: IEquipmentValidator,
    techLevelValidator: ITechLevelValidator,
    complianceReporter: IComplianceReporter
  ): IValidationOrchestrator {
    return new ValidationOrchestrator(
      configurationValidator,
      equipmentValidator,
      techLevelValidator,
      complianceReporter
    )
  }

  /**
   * Creates orchestrator with default implementations
   * Can be extended to use different default implementations
   */
  static createWithDefaults(): IValidationOrchestrator {
    // Import default implementations using ES6 imports
    const { DefaultConfigurationValidator } = require('./validators/DefaultConfigurationValidator')
    const { DefaultEquipmentValidator } = require('./validators/DefaultEquipmentValidator')
    const { DefaultTechLevelValidator } = require('./validators/DefaultTechLevelValidator')
    const { DefaultComplianceReporter } = require('./reporters/DefaultComplianceReporter')

    return new ValidationOrchestrator(
      new DefaultConfigurationValidator(),
      new DefaultEquipmentValidator(),
      new DefaultTechLevelValidator(),
      new DefaultComplianceReporter()
    )
  }
}

/**
 * Backward compatibility adapter
 * Liskov Substitution: Can substitute the old ValidationOrchestrationManager
 */
export class ValidationOrchestrationManagerAdapter {
  constructor(private readonly orchestrator: IValidationOrchestrator) {}

  /**
   * Synchronous wrapper for backward compatibility
   * Note: This is a compromise for backward compatibility
   * New code should use the async orchestrator directly
   */
  validateUnit(config: UnitConfiguration, equipment: any[]): any {
    // For backward compatibility, return a promise that can be awaited
    return this.orchestrator.validateUnit(config, equipment)
  }

  validateConfiguration(config: UnitConfiguration): any {
    return this.orchestrator.validateConfiguration(config)
  }

  validateEquipmentLoadout(equipment: any[], config: UnitConfiguration): any {
    return this.orchestrator.validateEquipment(equipment, config)
  }

  validateTechLevel(config: UnitConfiguration, equipment: any[]): any {
    return this.orchestrator.validateTechLevel(config, equipment)
  }

  generateComplianceReport(config: UnitConfiguration, equipment: any[]): any {
    return this.orchestrator.generateComplianceReport(config, equipment)
  }

  quickValidate(config: UnitConfiguration, equipment: any[]): any {
    return this.orchestrator.quickValidate(config, equipment)
  }
}