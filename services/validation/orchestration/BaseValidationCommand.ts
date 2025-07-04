/**
 * Base Validation Command
 * Abstract base class for validation commands using Command pattern
 * Part of validation orchestration architecture
 */

import { 
  ValidationCommand,
  ValidationContext,
  ValidationResult,
  ValidationError,
  ValidationWarning
} from './ValidationOrchestrationTypes'

export abstract class BaseValidationCommand implements ValidationCommand {
  protected commandName: string
  protected priority: number
  protected dependencies: string[]

  constructor(commandName: string, priority: number = 50, dependencies: string[] = []) {
    this.commandName = commandName
    this.priority = priority
    this.dependencies = dependencies
  }

  async execute(context: ValidationContext): Promise<ValidationResult> {
    const startTime = performance.now()
    
    try {
      // Check dependencies first
      if (!this.checkDependencies(context)) {
        return this.createFailureResult(startTime, 'Dependencies not met')
      }

      // Execute the validation logic
      const result = await this.executeValidation(context)
      const endTime = performance.now()

      return {
        commandName: this.commandName,
        isValid: result.isValid,
        executionTime: endTime - startTime,
        data: result.data,
        errors: result.errors,
        warnings: result.warnings,
        recommendations: result.recommendations
      }
    } catch (error) {
      const endTime = performance.now()
      return this.createErrorResult(startTime, endTime, error)
    }
  }

  getName(): string {
    return this.commandName
  }

  getPriority(): number {
    return this.priority
  }

  getDependencies(): string[] {
    return this.dependencies
  }

  /**
   * Abstract method for command-specific validation logic
   */
  protected abstract executeValidation(context: ValidationContext): Promise<{
    isValid: boolean
    data: any
    errors: ValidationError[]
    warnings: ValidationWarning[]
    recommendations: string[]
  }>

  /**
   * Check if all dependencies are satisfied
   */
  protected checkDependencies(context: ValidationContext): boolean {
    if (!context.options.validateDependencies) {
      return true // Skip dependency check if disabled
    }

    for (const dependency of this.dependencies) {
      if (!context.results.has(dependency)) {
        return false
      }
      
      const dependencyResult = context.results.get(dependency)
      if (!dependencyResult || !dependencyResult.isValid) {
        return false
      }
    }
    
    return true
  }

  /**
   * Create error result for validation failures
   */
  protected createErrorResult(startTime: number, endTime: number, error: any): ValidationResult {
    return {
      commandName: this.commandName,
      isValid: false,
      executionTime: endTime - startTime,
      data: null,
      errors: [{
        type: 'execution_error',
        message: `Validation command failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'critical',
        suggestedFix: 'Check command configuration and input data'
      }],
      warnings: [],
      recommendations: []
    }
  }

  /**
   * Create failure result for dependency issues
   */
  protected createFailureResult(startTime: number, message: string): ValidationResult {
    const endTime = performance.now()
    
    return {
      commandName: this.commandName,
      isValid: false,
      executionTime: endTime - startTime,
      data: null,
      errors: [{
        type: 'dependency_failure',
        message,
        severity: 'critical',
        suggestedFix: 'Ensure all required validators have completed successfully'
      }],
      warnings: [],
      recommendations: []
    }
  }

  /**
   * Helper method to create validation errors
   */
  protected createError(
    type: string,
    message: string,
    severity: 'critical' | 'major' | 'minor',
    suggestedFix: string,
    component?: string,
    location?: string
  ): ValidationError {
    return {
      type,
      message,
      severity,
      suggestedFix,
      component,
      location
    }
  }

  /**
   * Helper method to create validation warnings
   */
  protected createWarning(
    type: string,
    message: string,
    impact: 'high' | 'medium' | 'low',
    recommendation: string,
    component?: string
  ): ValidationWarning {
    return {
      type,
      message,
      impact,
      recommendation,
      component
    }
  }
}

/**
 * Validation Command Factory
 * Creates appropriate validation commands based on requirements
 */
export class ValidationCommandFactory {
  private static commandConstructors: Map<string, new () => ValidationCommand> = new Map()

  /**
   * Register a command constructor
   */
  static registerCommand(name: string, constructor: new () => ValidationCommand): void {
    this.commandConstructors.set(name, constructor)
  }

  /**
   * Create a validation command by name
   */
  static createCommand(name: string): ValidationCommand | null {
    const Constructor = this.commandConstructors.get(name)
    return Constructor ? new Constructor() : null
  }

  /**
   * Get all available command names
   */
  static getAvailableCommands(): string[] {
    return Array.from(this.commandConstructors.keys())
  }

  /**
   * Create multiple commands from a list of names
   */
  static createCommands(names: string[]): ValidationCommand[] {
    const commands: ValidationCommand[] = []
    
    for (const name of names) {
      const command = this.createCommand(name)
      if (command) {
        commands.push(command)
      }
    }
    
    return commands
  }
}

/**
 * Command Execution Strategy
 * Determines how commands should be executed (sequential, parallel, etc.)
 */
export interface CommandExecutionStrategy {
  executeCommands(commands: ValidationCommand[], context: ValidationContext): Promise<Map<string, ValidationResult>>
}

/**
 * Sequential Command Execution Strategy
 * Executes commands one after another in dependency order
 */
export class SequentialExecutionStrategy implements CommandExecutionStrategy {
  async executeCommands(commands: ValidationCommand[], context: ValidationContext): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>()
    
    // Sort commands by priority and dependencies
    const sortedCommands = this.sortCommandsByDependencies(commands)
    
    for (const command of sortedCommands) {
      // Update context with current results
      context.results = results
      
      // Execute command
      const result = await command.execute(context)
      results.set(command.getName(), result)
      
      // Stop on critical failure if not in performance mode
      if (!context.options.performanceMode && !result.isValid && 
          result.errors.some(e => e.severity === 'critical')) {
        break
      }
    }
    
    return results
  }

  /**
   * Sort commands by dependencies and priority
   */
  private sortCommandsByDependencies(commands: ValidationCommand[]): ValidationCommand[] {
    const sorted: ValidationCommand[] = []
    const remaining = [...commands]
    const processed = new Set<string>()

    while (remaining.length > 0) {
      let foundCommand = false
      
      for (let i = 0; i < remaining.length; i++) {
        const command = remaining[i]
        const dependencies = command.getDependencies()
        
        // Check if all dependencies are already processed
        const dependenciesMet = dependencies.every(dep => processed.has(dep))
        
        if (dependenciesMet) {
          sorted.push(command)
          processed.add(command.getName())
          remaining.splice(i, 1)
          foundCommand = true
          break
        }
      }
      
      // If no command can be processed, break to avoid infinite loop
      if (!foundCommand) {
        // Add remaining commands anyway (dependency resolution failed)
        sorted.push(...remaining)
        break
      }
    }
    
    // Sort by priority within dependency groups
    return sorted.sort((a, b) => b.getPriority() - a.getPriority())
  }
}

/**
 * Parallel Command Execution Strategy
 * Executes independent commands in parallel for better performance
 */
export class ParallelExecutionStrategy implements CommandExecutionStrategy {
  async executeCommands(commands: ValidationCommand[], context: ValidationContext): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>()
    
    // Group commands by dependency levels
    const dependencyLevels = this.groupByDependencyLevels(commands)
    
    // Execute each level sequentially, but commands within each level in parallel
    for (const levelCommands of dependencyLevels) {
      // Update context with current results
      context.results = results
      
      // Execute all commands in this level in parallel
      const promises = levelCommands.map(command => command.execute(context))
      const levelResults = await Promise.all(promises)
      
      // Store results
      levelResults.forEach((result, index) => {
        results.set(levelCommands[index].getName(), result)
      })
      
      // Check for critical failures
      if (!context.options.performanceMode) {
        const hasCriticalFailure = levelResults.some(result => 
          !result.isValid && result.errors.some(e => e.severity === 'critical')
        )
        
        if (hasCriticalFailure) {
          break
        }
      }
    }
    
    return results
  }

  /**
   * Group commands by dependency levels for parallel execution
   */
  private groupByDependencyLevels(commands: ValidationCommand[]): ValidationCommand[][] {
    const levels: ValidationCommand[][] = []
    const remaining = [...commands]
    const processed = new Set<string>()

    while (remaining.length > 0) {
      const currentLevel: ValidationCommand[] = []
      
      // Find all commands that can execute at this level
      for (let i = remaining.length - 1; i >= 0; i--) {
        const command = remaining[i]
        const dependencies = command.getDependencies()
        
        // Check if all dependencies are already processed
        const dependenciesMet = dependencies.every(dep => processed.has(dep))
        
        if (dependenciesMet) {
          currentLevel.push(command)
          processed.add(command.getName())
          remaining.splice(i, 1)
        }
      }
      
      if (currentLevel.length > 0) {
        // Sort current level by priority
        currentLevel.sort((a, b) => b.getPriority() - a.getPriority())
        levels.push(currentLevel)
      } else {
        // No more commands can be processed (circular dependencies or other issues)
        // Add all remaining commands to final level
        if (remaining.length > 0) {
          levels.push([...remaining])
        }
        break
      }
    }
    
    return levels
  }
}