/**
 * Base Equipment Validator
 * Abstract base class for equipment validation pipeline stages
 * Uses Pipeline pattern for sequential validation processing
 */

import { 
  ValidationContext,
  ValidationStageResult,
  ValidationError,
  ValidationWarning 
} from './EquipmentValidationTypes'

export abstract class BaseEquipmentValidator {
  protected nextValidator: BaseEquipmentValidator | null = null
  protected validatorName: string

  constructor(validatorName: string) {
    this.validatorName = validatorName
  }

  /**
   * Set the next validator in the pipeline
   */
  setNext(validator: BaseEquipmentValidator): BaseEquipmentValidator {
    this.nextValidator = validator
    return validator
  }

  /**
   * Process validation and pass to next validator
   */
  async validate(context: ValidationContext): Promise<ValidationStageResult[]> {
    const startTime = performance.now()
    
    try {
      // Execute this validator's logic
      const result = await this.executeValidation(context)
      const endTime = performance.now()
      
      const stageResult: ValidationStageResult = {
        stageName: this.validatorName,
        passed: result.errors.length === 0,
        errors: result.errors,
        warnings: result.warnings,
        processingTime: endTime - startTime,
        suggestions: result.suggestions
      }

      // Collect results from this stage
      const results = [stageResult]

      // Continue to next validator if present
      if (this.nextValidator) {
        const nextResults = await this.nextValidator.validate(context)
        results.push(...nextResults)
      }

      return results
    } catch (error) {
      const endTime = performance.now()
      
      // Handle validation errors gracefully
      const stageResult: ValidationStageResult = {
        stageName: this.validatorName,
        passed: false,
        errors: [{
          equipmentId: 'system',
          type: 'validation_error',
          message: `Validation stage failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'critical' as const,
          suggestedFix: 'Check validator configuration and input data'
        }],
        warnings: [],
        processingTime: endTime - startTime,
        suggestions: []
      }

      return [stageResult]
    }
  }

  /**
   * Abstract method for validator-specific logic
   */
  protected abstract executeValidation(context: ValidationContext): Promise<{
    errors: ValidationError[]
    warnings: ValidationWarning[]
    suggestions: string[]
  }>

  /**
   * Helper method to create validation errors
   */
  protected createError(
    equipmentId: string,
    type: string,
    message: string,
    severity: 'critical' | 'major' | 'minor',
    suggestedFix: string,
    location?: string
  ): ValidationError {
    return {
      equipmentId,
      type,
      message,
      severity,
      location,
      suggestedFix
    }
  }

  /**
   * Helper method to create validation warnings
   */
  protected createWarning(
    equipmentId: string,
    type: string,
    message: string,
    impact: 'high' | 'medium' | 'low',
    recommendation: string
  ): ValidationWarning {
    return {
      equipmentId,
      type,
      message,
      impact,
      recommendation
    }
  }
}

/**
 * Equipment Validation Pipeline
 * Coordinates multiple validators in sequence
 */
export class EquipmentValidationPipeline {
  private validators: BaseEquipmentValidator[] = []
  private pipelineHead: BaseEquipmentValidator | null = null

  /**
   * Add validator to the pipeline
   */
  addValidator(validator: BaseEquipmentValidator): this {
    this.validators.push(validator)
    this.buildPipeline()
    return this
  }

  /**
   * Remove validator from the pipeline
   */
  removeValidator(validatorName: string): this {
    this.validators = this.validators.filter(v => v['validatorName'] !== validatorName)
    this.buildPipeline()
    return this
  }

  /**
   * Execute the entire validation pipeline
   */
  async execute(context: ValidationContext): Promise<ValidationStageResult[]> {
    if (!this.pipelineHead) {
      return []
    }

    return await this.pipelineHead.validate(context)
  }

  /**
   * Get pipeline configuration
   */
  getPipelineConfig(): string[] {
    return this.validators.map(v => v['validatorName'])
  }

  /**
   * Clear all validators
   */
  clear(): this {
    this.validators = []
    this.pipelineHead = null
    return this
  }

  /**
   * Build the validator chain
   */
  private buildPipeline(): void {
    if (this.validators.length === 0) {
      this.pipelineHead = null
      return
    }

    // Set up the chain of responsibility
    this.pipelineHead = this.validators[0]
    
    for (let i = 0; i < this.validators.length - 1; i++) {
      this.validators[i].setNext(this.validators[i + 1])
    }
  }
}

/**
 * Validation Strategy Interface
 * Allows different validation approaches
 */
export interface ValidationStrategy {
  name: string
  description: string
  strictMode: boolean
  enabledStages: string[]
  getValidators(): BaseEquipmentValidator[]
}

/**
 * Standard BattleTech Validation Strategy
 */
export class StandardValidationStrategy implements ValidationStrategy {
  name = 'Standard BattleTech'
  description = 'Standard BattleTech construction rules validation'
  strictMode = false
  enabledStages = [
    'PlacementValidator',
    'RuleComplianceValidator', 
    'TechLevelValidator',
    'MountingValidator',
    'GlobalRulesValidator'
  ]

  getValidators(): BaseEquipmentValidator[] {
    // Will be implemented when creating specific validators
    return []
  }
}

/**
 * Strict Tournament Validation Strategy
 */
export class TournamentValidationStrategy implements ValidationStrategy {
  name = 'Tournament Rules'
  description = 'Strict tournament-level validation with all rules enforced'
  strictMode = true
  enabledStages = [
    'PlacementValidator',
    'RuleComplianceValidator', 
    'TechLevelValidator',
    'MountingValidator',
    'GlobalRulesValidator',
    'TournamentRulesValidator'
  ]

  getValidators(): BaseEquipmentValidator[] {
    return []
  }
}

/**
 * Quick Validation Strategy
 */
export class QuickValidationStrategy implements ValidationStrategy {
  name = 'Quick Validation'
  description = 'Basic validation for fast iteration'
  strictMode = false
  enabledStages = [
    'PlacementValidator',
    'RuleComplianceValidator'
  ]

  getValidators(): BaseEquipmentValidator[] {
    return []
  }
}