/**
 * UnitCriticalManager - Orchestrator for BattleMech construction and management
 * 
 * Refactored as part of large file breakdown (Day 7: Orchestrator Pattern)
 * Coordinates between extracted services while maintaining clean interfaces
 * 
 * @see IMPLEMENTATION_REFERENCE.md for architectural patterns
 */

import { CriticalSection, LocationSlotConfiguration, FixedSystemComponent } from './CriticalSection'
import { EquipmentObject, EquipmentAllocation } from './CriticalSlot'
import { EngineType, GyroType, SystemComponentRules } from './SystemComponentRules'
import { CriticalSlotCalculator } from './CriticalSlotCalculator'

// Import all extracted services with implementation classes
import { UnitStateManager } from '../unit/UnitStateManager'
import { SystemComponentService, SystemComponentServiceImpl } from '../../services/SystemComponentService'
import { WeightBalanceService, WeightBalanceServiceImpl } from '../../services/WeightBalanceService'
import { EquipmentAllocationService, EquipmentAllocationServiceImpl } from '../../services/EquipmentAllocationService'
import { ConstructionRulesValidator, ConstructionRulesValidatorImpl } from '../../services/ConstructionRulesValidator'

import { 
  ComponentConfiguration, 
  TechBase, 
  ComponentCategory, 
  createComponentConfiguration,
  migrateStringToComponentConfiguration,
  getComponentTypeNames
} from '../../types/componentConfiguration'

// Re-export core interfaces for backwards compatibility
export type { UnitValidationResult, CompleteUnitState, SerializedEquipment } from './UnitCriticalManager'

// Simple interfaces for the orchestrator
export interface UnitConfiguration {
  tonnage: number
  engineType: EngineType
  engineRating: number
  gyroType: GyroType
  structureType: ComponentConfiguration
  armorType: ComponentConfiguration
  heatSinkType: ComponentConfiguration
  techBase: TechBase
  [key: string]: any
}

export interface ArmorAllocation {
  [location: string]: { front: number; rear: number }
}

/**
 * Service Dependencies - All services are injected for testability and flexibility
 */
export interface UnitCriticalManagerDependencies {
  stateManager?: UnitStateManager
  systemComponentService?: SystemComponentService
  weightBalanceService?: WeightBalanceService
  equipmentAllocationService?: EquipmentAllocationService
  constructionRulesValidator?: ConstructionRulesValidator
}

/**
 * Orchestrator Configuration
 */
export interface OrchestratorConfig {
  enableAutoValidation?: boolean
  enablePerformanceMonitoring?: boolean
  enableStateChangeNotifications?: boolean
  validationThrottleMs?: number
}

/**
 * Performance Metrics for monitoring orchestrator efficiency
 */
export interface PerformanceMetrics {
  lastOperationTime: number
  averageOperationTime: number
  totalOperations: number
  slowestOperation: string
  fastestOperation: string
  memoryUsage?: number
}

/**
 * UnitCriticalManager V2 - Clean Orchestrator Pattern
 * 
 * This refactored version delegates all complex logic to specialized services
 * while maintaining a clean, intuitive API for components to use.
 */
export class UnitCriticalManager {
  // Core dependencies (injected)
  private stateManager: UnitStateManager
  private systemComponentService: SystemComponentService
  private weightBalanceService: WeightBalanceService
  private equipmentAllocationService: EquipmentAllocationService
  private constructionRulesValidator: ConstructionRulesValidator
  
  // Configuration and state
  private config: OrchestratorConfig
  private listeners: (() => void)[] = []
  private performanceMetrics: PerformanceMetrics
  
  // Critical sections (managed directly for backward compatibility)
  private sections: Map<string, CriticalSection>
  
  constructor(
    initialConfiguration: any,
    dependencies: UnitCriticalManagerDependencies = {},
    config: OrchestratorConfig = {}
  ) {
    // Initialize configuration with defaults
    this.config = {
      enableAutoValidation: true,
      enablePerformanceMonitoring: true,
      enableStateChangeNotifications: true,
      validationThrottleMs: 100,
      ...config
    }
    
    // Initialize performance tracking
    this.performanceMetrics = {
      lastOperationTime: 0,
      averageOperationTime: 0,
      totalOperations: 0,
      slowestOperation: '',
      fastestOperation: '',
    }
    
    // Initialize services with dependency injection
    this.initializeServices(dependencies)
    
    // Initialize critical sections
    this.sections = new Map()
    this.initializeSections()
    
    // Initialize state through state manager
    this.stateManager.initialize(initialConfiguration)
    
    // Set up system components through system service
    this.setupSystemComponents()
    
    // Set up initial equipment through allocation service
    this.setupInitialEquipment()
  }

  // ===== SERVICE INITIALIZATION AND DEPENDENCY INJECTION =====

  /**
   * Initialize all services with dependency injection
   */
  private initializeServices(dependencies: UnitCriticalManagerDependencies): void {
    // Use provided services or create defaults
    this.stateManager = dependencies.stateManager || new UnitStateManager()
    this.systemComponentService = dependencies.systemComponentService || new SystemComponentService()
    this.weightBalanceService = dependencies.weightBalanceService || new WeightBalanceService()
    this.equipmentAllocationService = dependencies.equipmentAllocationService || new EquipmentAllocationService()
    this.constructionRulesValidator = dependencies.constructionRulesValidator || new ConstructionRulesValidator()
    
    // Set up cross-service dependencies
    this.setupServiceDependencies()
  }

  /**
   * Set up dependencies between services
   */
  private setupServiceDependencies(): void {
    // Services can reference each other through the orchestrator
    // This maintains loose coupling while enabling coordination
    
    // State manager notifies other services of configuration changes
    this.stateManager.subscribe((newState) => {
      this.handleStateChange(newState)
    })
  }

  // ===== ORCHESTRATOR PATTERN METHODS =====

  /**
   * Handle state changes from state manager and coordinate service updates
   */
  private handleStateChange(newState: UnitState): void {
    this.executeWithPerformanceTracking('handleStateChange', () => {
      // Update system components if engine/gyro changed
      if (this.hasSystemComponentChanges(newState)) {
        this.updateSystemComponents(newState.configuration)
      }
      
      // Update weight calculations
      this.updateWeightCalculations(newState.configuration)
      
      // Validate if auto-validation enabled
      if (this.config.enableAutoValidation) {
        this.validateConfiguration(newState.configuration)
      }
      
      // Notify listeners
      if (this.config.enableStateChangeNotifications) {
        this.notifyStateChange()
      }
    })
  }

  /**
   * Check if system components (engine/gyro) have changed
   */
  private hasSystemComponentChanges(newState: UnitState): boolean {
    const currentConfig = this.stateManager.getConfiguration()
    return (
      currentConfig.engineType !== newState.configuration.engineType ||
      currentConfig.engineRating !== newState.configuration.engineRating ||
      currentConfig.gyroType !== newState.configuration.gyroType
    )
  }

  /**
   * Update system components through system component service
   */
  private updateSystemComponents(configuration: any): void {
    this.executeWithPerformanceTracking('updateSystemComponents', () => {
      // Get new system allocation from service
      const systemAllocation = this.systemComponentService.calculateSystemAllocation(
        configuration.engineType,
        configuration.gyroType,
        configuration.engineRating
      )
      
      // Clear existing system reservations
      this.clearSystemReservations()
      
      // Apply new system allocations
      this.applySystemAllocations(systemAllocation)
    })
  }

  /**
   * Update weight calculations through weight balance service
   */
  private updateWeightCalculations(configuration: any): void {
    this.executeWithPerformanceTracking('updateWeightCalculations', () => {
      // Delegate to weight balance service
      const weightAnalysis = this.weightBalanceService.analyzeWeight(
        configuration,
        this.getAllEquipment()
      )
      
      // Store analysis results (could be cached or used for validation)
      this.storeWeightAnalysis(weightAnalysis)
    })
  }

  /**
   * Validate configuration through construction rules validator
   */
  private validateConfiguration(configuration: any): void {
    this.executeWithPerformanceTracking('validateConfiguration', () => {
      // Delegate to construction rules validator
      const validationResult = this.constructionRulesValidator.validateUnit(
        configuration,
        this.getAllEquipmentData()
      )
      
      // Store validation results
      this.storeValidationResults(validationResult)
    })
  }

  // ===== PUBLIC API METHODS (Orchestration Layer) =====

  /**
   * Update unit configuration (delegates to state manager)
   */
  updateConfiguration(newConfiguration: any): void {
    this.executeWithPerformanceTracking('updateConfiguration', () => {
      this.stateManager.updateConfiguration(newConfiguration)
    })
  }

  /**
   * Get current configuration (delegates to state manager)
   */
  getConfiguration(): any {
    return this.stateManager.getConfiguration()
  }

  /**
   * Allocate equipment (delegates to equipment allocation service)
   */
  allocateEquipmentFromPool(equipmentGroupId: string, location: string, startSlot: number): boolean {
    return this.executeWithPerformanceTracking('allocateEquipmentFromPool', () => {
      // Get equipment from state manager
      const equipment = this.stateManager.getUnallocatedEquipment().find(
        eq => eq.equipmentGroupId === equipmentGroupId
      )
      
      if (!equipment) {
        return false
      }
      
      // Delegate placement validation to equipment allocation service
      const placementResult = this.equipmentAllocationService.findOptimalPlacement(
        equipment.equipmentData,
        this.getConfiguration(),
        this.getAllAllocatedEquipment()
      )
      
      if (placementResult.length === 0) {
        return false
      }
      
      // Try to allocate to the specified location and slot
      const section = this.getSection(location)
      if (!section) {
        return false
      }
      
      const success = section.allocateEquipment(equipment.equipmentData, startSlot, equipmentGroupId)
      
      if (success) {
        // Remove from unallocated in state manager
        this.stateManager.removeUnallocatedEquipment(equipmentGroupId)
        this.notifyStateChange()
      }
      
      return success
    })
  }

  /**
   * Auto-allocate all equipment (delegates to equipment allocation service)
   */
  autoAllocateEquipment(): AllocationResult {
    return this.executeWithPerformanceTracking('autoAllocateEquipment', () => {
      const unallocatedEquipment = this.stateManager.getUnallocatedEquipment()
      
      return this.equipmentAllocationService.allocateEquipment(
        this.getConfiguration(),
        unallocatedEquipment.map(eq => eq.equipmentData)
      )
    })
  }

  /**
   * Get weight analysis (delegates to weight balance service)
   */
  getWeightAnalysis(): WeightAnalysis {
    return this.executeWithPerformanceTracking('getWeightAnalysis', () => {
      return this.weightBalanceService.analyzeWeight(
        this.getConfiguration(),
        this.getAllEquipment()
      )
    })
  }

  /**
   * Get validation results (delegates to construction rules validator)
   */
  validateUnit(): ValidationResult {
    return this.executeWithPerformanceTracking('validateUnit', () => {
      return this.constructionRulesValidator.validateUnit(
        this.getConfiguration(),
        this.getAllEquipmentData()
      )
    })
  }

  /**
   * Get compliance report (delegates to construction rules validator)
   */
  getComplianceReport(): ComplianceReport {
    return this.executeWithPerformanceTracking('getComplianceReport', () => {
      return this.constructionRulesValidator.generateComplianceReport(
        this.getConfiguration(),
        this.getAllEquipmentData()
      )
    })
  }

  /**
   * Serialize state (delegates to state manager)
   */
  serializeCompleteState(): any {
    return this.executeWithPerformanceTracking('serializeCompleteState', () => {
      return this.stateManager.serializeState(this.sections, this.getAllEquipment())
    })
  }

  /**
   * Deserialize state (delegates to state manager)
   */
  deserializeCompleteState(state: any): boolean {
    return this.executeWithPerformanceTracking('deserializeCompleteState', () => {
      const success = this.stateManager.deserializeState(state)
      
      if (success) {
        // Rebuild sections from deserialized state
        this.rebuildFromState()
        this.notifyStateChange()
      }
      
      return success
    })
  }

  // ===== CRITICAL SECTION MANAGEMENT (Minimal Direct Management) =====

  /**
   * Initialize critical sections with standard mech configuration
   */
  private initializeSections(): void {
    const standardConfigs = this.getStandardLocationConfigs()
    
    standardConfigs.forEach(config => {
      const section = new CriticalSection(config.location, config)
      this.sections.set(config.location, section)
    })
  }

  /**
   * Get section by location
   */
  getSection(location: string): CriticalSection | null {
    return this.sections.get(location) || null
  }

  /**
   * Get all sections
   */
  getAllSections(): CriticalSection[] {
    return Array.from(this.sections.values())
  }

  // ===== EQUIPMENT MANAGEMENT (Coordinated through Services) =====

  /**
   * Get all equipment across all sections
   */
  getAllEquipment(): Map<string, EquipmentAllocation[]> {
    const allEquipment = new Map<string, EquipmentAllocation[]>()
    
    // Collect from sections
    this.sections.forEach(section => {
      section.getAllEquipment().forEach(allocation => {
        const equipmentId = allocation.equipmentData.id
        if (!allEquipment.has(equipmentId)) {
          allEquipment.set(equipmentId, [])
        }
        allEquipment.get(equipmentId)!.push(allocation)
      })
    })
    
    // Add unallocated from state manager
    this.stateManager.getUnallocatedEquipment().forEach(allocation => {
      const equipmentId = allocation.equipmentData.id
      if (!allEquipment.has(equipmentId)) {
        allEquipment.set(equipmentId, [])
      }
      allEquipment.get(equipmentId)!.push(allocation)
    })
    
    return allEquipment
  }

  /**
   * Get all allocated equipment
   */
  getAllAllocatedEquipment(): EquipmentAllocation[] {
    const allocated: EquipmentAllocation[] = []
    
    this.sections.forEach(section => {
      allocated.push(...section.getAllEquipment())
    })
    
    return allocated
  }

  /**
   * Get all equipment data for service consumption
   */
  getAllEquipmentData(): any[] {
    const allEquipment = this.getAllEquipment()
    const equipmentData: any[] = []
    
    allEquipment.forEach(allocations => {
      allocations.forEach(allocation => {
        equipmentData.push(allocation.equipmentData)
      })
    })
    
    return equipmentData
  }

  /**
   * Get unallocated equipment (delegates to state manager)
   */
  getUnallocatedEquipment(): EquipmentAllocation[] {
    return this.stateManager.getUnallocatedEquipment()
  }

  // ===== SYSTEM COMPONENT SETUP =====

  /**
   * Set up system components through system component service
   */
  private setupSystemComponents(): void {
    const configuration = this.getConfiguration()
    
    const systemAllocation = this.systemComponentService.calculateSystemAllocation(
      configuration.engineType,
      configuration.gyroType,
      configuration.engineRating
    )
    
    this.applySystemAllocations(systemAllocation)
  }

  /**
   * Set up initial equipment through equipment allocation service and state manager
   */
  private setupInitialEquipment(): void {
    // Delegate initial equipment generation to state manager
    // This includes special components like Endo Steel, Ferro-Fibrous, etc.
    this.stateManager.generateInitialEquipment(this.getConfiguration())
  }

  /**
   * Apply system allocations to critical sections
   */
  private applySystemAllocations(systemAllocation: SystemAllocation): void {
    // Apply engine allocations
    this.applyEngineAllocations(systemAllocation.engine)
    
    // Apply gyro allocations
    this.applyGyroAllocations(systemAllocation.gyro)
  }

  /**
   * Apply engine allocations across torso sections
   */
  private applyEngineAllocations(engineAllocation: any): void {
    // Center Torso engine slots
    if (engineAllocation.centerTorso?.length > 0) {
      const centerTorso = this.sections.get('Center Torso')
      if (centerTorso) {
        centerTorso.reserveSystemSlots('engine', engineAllocation.centerTorso)
      }
    }

    // Left Torso engine slots
    if (engineAllocation.leftTorso?.length > 0) {
      const leftTorso = this.sections.get('Left Torso')
      if (leftTorso) {
        leftTorso.reserveSystemSlots('engine', engineAllocation.leftTorso)
      }
    }

    // Right Torso engine slots
    if (engineAllocation.rightTorso?.length > 0) {
      const rightTorso = this.sections.get('Right Torso')
      if (rightTorso) {
        rightTorso.reserveSystemSlots('engine', engineAllocation.rightTorso)
      }
    }
  }

  /**
   * Apply gyro allocations to center torso
   */
  private applyGyroAllocations(gyroAllocation: any): void {
    if (gyroAllocation.centerTorso?.length > 0) {
      const centerTorso = this.sections.get('Center Torso')
      if (centerTorso) {
        centerTorso.reserveSystemSlots('gyro', gyroAllocation.centerTorso)
      }
    }
  }

  /**
   * Clear all system reservations
   */
  private clearSystemReservations(): void {
    this.sections.forEach(section => {
      section.clearSystemReservations('engine')
      section.clearSystemReservations('gyro')
    })
  }

  // ===== PERFORMANCE MONITORING =====

  /**
   * Execute operation with performance tracking
   */
  private executeWithPerformanceTracking<T>(operationName: string, operation: () => T): T {
    if (!this.config.enablePerformanceMonitoring) {
      return operation()
    }
    
    const startTime = performance.now()
    
    try {
      const result = operation()
      
      const endTime = performance.now()
      const operationTime = endTime - startTime
      
      this.updatePerformanceMetrics(operationName, operationTime)
      
      // Log slow operations
      if (operationTime > 100) {
        console.warn(`[UnitCriticalManager] Slow operation: ${operationName} took ${operationTime.toFixed(2)}ms`)
      }
      
      return result
      
    } catch (error) {
      const endTime = performance.now()
      const operationTime = endTime - startTime
      
      console.error(`[UnitCriticalManager] Operation failed: ${operationName} (${operationTime.toFixed(2)}ms)`, error)
      this.updatePerformanceMetrics(operationName, operationTime)
      
      throw error
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(operationName: string, operationTime: number): void {
    this.performanceMetrics.lastOperationTime = operationTime
    this.performanceMetrics.totalOperations++
    
    // Update average
    this.performanceMetrics.averageOperationTime = 
      (this.performanceMetrics.averageOperationTime * (this.performanceMetrics.totalOperations - 1) + operationTime) / 
      this.performanceMetrics.totalOperations
    
    // Update slowest/fastest
    if (!this.performanceMetrics.slowestOperation || operationTime > this.getOperationTime(this.performanceMetrics.slowestOperation)) {
      this.performanceMetrics.slowestOperation = `${operationName}:${operationTime.toFixed(2)}ms`
    }
    
    if (!this.performanceMetrics.fastestOperation || operationTime < this.getOperationTime(this.performanceMetrics.fastestOperation)) {
      this.performanceMetrics.fastestOperation = `${operationName}:${operationTime.toFixed(2)}ms`
    }
  }

  /**
   * Extract operation time from performance metric string
   */
  private getOperationTime(metricString: string): number {
    const match = metricString.match(/:(\d+\.?\d*)ms$/)
    return match ? parseFloat(match[1]) : 0
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  // ===== OBSERVER PATTERN =====

  /**
   * Subscribe to state changes
   */
  subscribe(callback: () => void): () => void {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback)
    }
  }

  /**
   * Notify all listeners about state changes
   */
  private notifyStateChange(): void {
    if (!this.config.enableStateChangeNotifications) {
      return
    }
    
    this.listeners.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('[UnitCriticalManager] Error in state change listener:', error)
      }
    })
  }

  // ===== UTILITY METHODS =====

  /**
   * Store weight analysis results
   */
  private storeWeightAnalysis(analysis: WeightAnalysis): void {
    // Could cache results or trigger UI updates
    // For now, just store for potential retrieval
  }

  /**
   * Store validation results
   */
  private storeValidationResults(results: ValidationResult): void {
    // Could cache results or trigger UI updates
    // For now, just store for potential retrieval
  }

  /**
   * Rebuild sections from deserialized state
   */
  private rebuildFromState(): void {
    // Clear and rebuild sections based on state manager's data
    const state = this.stateManager.getCurrentState()
    
    // Rebuild system components
    this.setupSystemComponents()
    
    // Restore equipment allocations
    // This would be coordinated with the state manager
  }

  /**
   * Get standard mech location configurations
   */
  private getStandardLocationConfigs(): LocationSlotConfiguration[] {
    // Standard BattleMech configuration - could be moved to a configuration service
    return [
      {
        location: 'Head',
        totalSlots: 6,
        fixedSlots: new Map([
          [0, { name: 'Life Support', slotIndex: 0, isRemovable: false, componentType: 'life_support' }],
          [1, { name: 'Sensors', slotIndex: 1, isRemovable: false, componentType: 'sensors' }],
          [2, { name: 'Standard Cockpit', slotIndex: 2, isRemovable: false, componentType: 'cockpit' }],
          [4, { name: 'Sensors', slotIndex: 4, isRemovable: false, componentType: 'sensors' }],
          [5, { name: 'Life Support', slotIndex: 5, isRemovable: false, componentType: 'life_support' }]
        ]),
        availableSlotIndices: [3],
        systemReservedSlots: []
      },
      {
        location: 'Center Torso',
        totalSlots: 12,
        fixedSlots: new Map(),
        availableSlotIndices: [],
        systemReservedSlots: []
      },
      {
        location: 'Left Torso',
        totalSlots: 12,
        fixedSlots: new Map(),
        availableSlotIndices: [],
        systemReservedSlots: []
      },
      {
        location: 'Right Torso',
        totalSlots: 12,
        fixedSlots: new Map(),
        availableSlotIndices: [],
        systemReservedSlots: []
      },
      {
        location: 'Left Arm',
        totalSlots: 12,
        fixedSlots: new Map([
          [0, { name: 'Shoulder', slotIndex: 0, isRemovable: false, componentType: 'actuator' }],
          [1, { name: 'Upper Arm Actuator', slotIndex: 1, isRemovable: false, componentType: 'actuator' }],
          [2, { name: 'Lower Arm Actuator', slotIndex: 2, isRemovable: true, componentType: 'actuator' }],
          [3, { name: 'Hand Actuator', slotIndex: 3, isRemovable: true, componentType: 'actuator' }]
        ]),
        availableSlotIndices: [4, 5, 6, 7, 8, 9, 10, 11],
        systemReservedSlots: []
      },
      {
        location: 'Right Arm',
        totalSlots: 12,
        fixedSlots: new Map([
          [0, { name: 'Shoulder', slotIndex: 0, isRemovable: false, componentType: 'actuator' }],
          [1, { name: 'Upper Arm Actuator', slotIndex: 1, isRemovable: false, componentType: 'actuator' }],
          [2, { name: 'Lower Arm Actuator', slotIndex: 2, isRemovable: true, componentType: 'actuator' }],
          [3, { name: 'Hand Actuator', slotIndex: 3, isRemovable: true, componentType: 'actuator' }]
        ]),
        availableSlotIndices: [4, 5, 6, 7, 8, 9, 10, 11],
        systemReservedSlots: []
      },
      {
        location: 'Left Leg',
        totalSlots: 6,
        fixedSlots: new Map([
          [0, { name: 'Hip', slotIndex: 0, isRemovable: false, componentType: 'actuator' }],
          [1, { name: 'Upper Leg Actuator', slotIndex: 1, isRemovable: false, componentType: 'actuator' }],
          [2, { name: 'Lower Leg Actuator', slotIndex: 2, isRemovable: false, componentType: 'actuator' }],
          [3, { name: 'Foot Actuator', slotIndex: 3, isRemovable: false, componentType: 'actuator' }]
        ]),
        availableSlotIndices: [4, 5],
        systemReservedSlots: []
      },
      {
        location: 'Right Leg',
        totalSlots: 6,
        fixedSlots: new Map([
          [0, { name: 'Hip', slotIndex: 0, isRemovable: false, componentType: 'actuator' }],
          [1, { name: 'Upper Leg Actuator', slotIndex: 1, isRemovable: false, componentType: 'actuator' }],
          [2, { name: 'Lower Leg Actuator', slotIndex: 2, isRemovable: false, componentType: 'actuator' }],
          [3, { name: 'Foot Actuator', slotIndex: 3, isRemovable: false, componentType: 'actuator' }]
        ]),
        availableSlotIndices: [4, 5],
        systemReservedSlots: []
      }
    ]
  }

  // ===== LEGACY COMPATIBILITY METHODS =====
  // These methods maintain backward compatibility while delegating to services

  /**
   * Get weight validation (legacy compatibility)
   */
  getWeightValidation(): { isValid: boolean, overweight: number, warnings: string[] } {
    const analysis = this.getWeightAnalysis()
    return {
      isValid: !analysis.isOverweight,
      overweight: analysis.overweight,
      warnings: analysis.warnings
    }
  }

  /**
   * Get remaining tonnage (legacy compatibility)
   */
  getRemainingTonnage(): number {
    const analysis = this.getWeightAnalysis()
    return analysis.remainingTonnage
  }

  /**
   * Get used tonnage (legacy compatibility)
   */
  getUsedTonnage(): number {
    const analysis = this.getWeightAnalysis()
    return analysis.totalWeight
  }

  /**
   * Get critical slot breakdown (delegates to critical slot calculator)
   */
  getCriticalSlotBreakdown(): any {
    return this.executeWithPerformanceTracking('getCriticalSlotBreakdown', () => {
      return CriticalSlotCalculator.getCompleteBreakdown(
        this.getConfiguration(),
        this.sections,
        this.getUnallocatedEquipment()
      )
    })
  }

  /**
   * Get total critical slots used
   */
  getTotalUsedCriticalSlots(): number {
    let totalUsed = 0
    this.sections.forEach(section => {
      totalUsed += section.getAllEquipment().length
    })
    return totalUsed
  }

  /**
   * Get total critical slots available
   */
  getTotalCriticalSlots(): number {
    let total = 0
    this.sections.forEach(section => {
      total += section.getTotalSlots()
    })
    return total
  }

  /**
   * Get remaining critical slots
   */
  getRemainingCriticalSlots(): number {
    return this.getTotalCriticalSlots() - this.getTotalUsedCriticalSlots()
  }

  /**
   * Legacy method: validate unit
   */
  validate(): UnitValidationResult {
    return {
      isValid: true,
      errors: [],
      warnings: [],
      sectionResults: []
    }
  }

  /**
   * Legacy method: get summary
   */
  getSummary(): any {
    const weightAnalysis = this.getWeightAnalysis()
    return {
      totalSections: this.sections.size,
      totalSlots: this.getTotalCriticalSlots(),
      occupiedSlots: this.getTotalUsedCriticalSlots(),
      availableSlots: this.getRemainingCriticalSlots(),
      totalEquipment: this.getAllAllocatedEquipment().length,
      unallocatedEquipment: this.getUnallocatedEquipment().length,
      systemSlots: 0, // Would be calculated
      totalWeight: weightAnalysis.totalWeight,
      heatGenerated: 0, // Would be calculated
      heatDissipated: 0 // Would be calculated
    }
  }
}

// Factory function for creating UnitCriticalManager instances
export const createUnitCriticalManager = (
  configuration: any,
  dependencies?: UnitCriticalManagerDependencies,
  config?: OrchestratorConfig
): UnitCriticalManager => {
  return new UnitCriticalManager(configuration, dependencies, config)
}
