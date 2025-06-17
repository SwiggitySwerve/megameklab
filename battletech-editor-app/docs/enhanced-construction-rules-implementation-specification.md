# Enhanced Construction Rules Implementation Specification

## Overview

This document provides comprehensive technical specifications for implementing Inner Sphere vs Clan technology differences and an enhanced construction rules system for the BattleTech editor. The implementation extends the existing system while maintaining backward compatibility and introduces tech base-aware validation, component specifications, and construction rules.

## Table of Contents

1. [Core Architecture](#core-architecture)
2. [System Components Enhancement](#system-components-enhancement)
3. [Construction Rules Engine](#construction-rules-engine)
4. [Tech Base Rules Manager](#tech-base-rules-manager)
5. [Critical Slot Allocator](#critical-slot-allocator)
6. [Weight & Cost Calculation Engines](#weight--cost-calculation-engines)
7. [File Structure & Integration](#file-structure--integration)
8. [Database Schema Enhancements](#database-schema-enhancements)
9. [UI Component Enhancements](#ui-component-enhancements)
10. [Service Layer Integration](#service-layer-integration)
11. [Implementation Strategy](#implementation-strategy)

---

## Core Architecture

### Enhanced System Components Interface

```typescript
// Enhanced base interface with tech base integration
export interface EnhancedSystemComponents extends SystemComponents {
  techBase: 'Inner Sphere' | 'Clan' | 'Mixed (IS Chassis)' | 'Mixed (Clan Chassis)'
  techLevel: 'Introductory' | 'Standard' | 'Advanced' | 'Experimental'
  era: string  // e.g., "3025", "3050", "3067"
  
  // Enhanced component specs with tech base awareness
  engine: EnhancedEngineComponent
  gyro: EnhancedGyroComponent
  structure: EnhancedStructureComponent
  armor: EnhancedArmorComponent
  heatSinks: EnhancedHeatSinkComponent
}

export interface EnhancedEngineComponent extends EngineComponent {
  techBase: 'Inner Sphere' | 'Clan' | 'Both'
  specification: EngineSpecification
}

export interface ConstructionContext {
  mechTonnage: number
  techBase: 'Inner Sphere' | 'Clan' | 'Mixed (IS Chassis)' | 'Mixed (Clan Chassis)'
  techLevel: 'Introductory' | 'Standard' | 'Advanced' | 'Experimental'
  era: string
  allowMixedTech: boolean
  customRules?: string[]
}

export interface ConstructionValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  techBaseViolations: TechBaseViolation[]
  slotViolations: SlotViolation[]
  weightViolations: WeightViolation[]
  costCalculation: CostCalculation | null
}

export interface TechBaseViolation {
  component: string
  violation: 'tech_base_mismatch' | 'era_unavailable' | 'tech_level_incompatible'
  details: string
}

export interface SlotViolation {
  location: string
  required: number
  available: number
  component: string
}

export interface WeightViolation {
  type: 'overweight' | 'invalid_modifier'
  excess?: number
  details: string
}
```

### Construction Context

```typescript
export interface ConstructionChangeImpact {
  slotImpact: SlotChangeImpact
  weightImpact: WeightChangeImpact
  costImpact: CostChangeImpact
  techCompatibilityImpact: TechCompatibilityImpact
}

export interface SlotChangeImpact {
  displacedEquipment: EquipmentAllocation[]
  newSlotRequirements: { [location: string]: number }
  availabilityChange: { [location: string]: number }
}

export interface ComponentChange {
  componentType: 'engine' | 'gyro' | 'structure' | 'armor' | 'heatSink'
  oldValue: any
  newValue: any
}
```

---

## System Components Enhancement

### Enhanced Engine System

**Current Issue**: The engine system doesn't differentiate between IS and Clan XL engines, which have different critical slot requirements and survivability rules.

```typescript
export type EnhancedEngineType = 
  | 'Standard' 
  | 'XL (IS)' | 'XL (Clan)'     // Separate IS and Clan XL
  | 'Light'                      // IS only
  | 'XXL'                        // Rare, both tech bases
  | 'Compact' 
  | 'ICE' 
  | 'Fuel Cell'

export interface EngineSpecification {
  techBase: 'Inner Sphere' | 'Clan' | 'Both'
  weightMultiplier: number
  slotRequirements: {
    centerTorso: number
    leftTorso: number
    rightTorso: number
  }
  survivabilityRules: {
    sideDestroyed: 'shutdown' | 'continue_penalty' | 'destroyed'
    bothSidesDestroyed: 'destroyed' | 'continue_severe'
  }
  heatSinkCapacity: number  // Integrated heat sinks
  costMultiplier: number
  techLevel: 'Standard' | 'Advanced'
  introductionYear: number
  extinctionYear?: number
}

export const ENGINE_SPECIFICATIONS: Record<EnhancedEngineType, EngineSpecification> = {
  'Standard': {
    techBase: 'Both',
    weightMultiplier: 1.0,
    slotRequirements: { centerTorso: 6, leftTorso: 0, rightTorso: 0 },
    survivabilityRules: { sideDestroyed: 'continue_penalty', bothSidesDestroyed: 'continue_penalty' },
    heatSinkCapacity: 10,
    costMultiplier: 1.0,
    techLevel: 'Standard',
    introductionYear: 2470
  },
  'XL (IS)': {
    techBase: 'Inner Sphere',
    weightMultiplier: 0.5,
    slotRequirements: { centerTorso: 6, leftTorso: 3, rightTorso: 3 },
    survivabilityRules: { sideDestroyed: 'destroyed', bothSidesDestroyed: 'destroyed' },
    heatSinkCapacity: 10,
    costMultiplier: 2.0,
    techLevel: 'Standard',
    introductionYear: 2579
  },
  'XL (Clan)': {
    techBase: 'Clan',
    weightMultiplier: 0.5,
    slotRequirements: { centerTorso: 6, leftTorso: 2, rightTorso: 2 },
    survivabilityRules: { sideDestroyed: 'continue_penalty', bothSidesDestroyed: 'destroyed' },
    heatSinkCapacity: 10,
    costMultiplier: 2.0,
    techLevel: 'Standard',
    introductionYear: 2824
  },
  'Light': {
    techBase: 'Inner Sphere',
    weightMultiplier: 0.75,
    slotRequirements: { centerTorso: 6, leftTorso: 2, rightTorso: 2 },
    survivabilityRules: { sideDestroyed: 'continue_penalty', bothSidesDestroyed: 'continue_penalty' },
    heatSinkCapacity: 10,
    costMultiplier: 1.5,
    techLevel: 'Advanced',
    introductionYear: 3055
  },
  'XXL': {
    techBase: 'Both',
    weightMultiplier: 0.33,
    slotRequirements: { centerTorso: 6, leftTorso: 6, rightTorso: 6 },
    survivabilityRules: { sideDestroyed: 'destroyed', bothSidesDestroyed: 'destroyed' },
    heatSinkCapacity: 10,
    costMultiplier: 10.0,
    techLevel: 'Experimental',
    introductionYear: 3109
  },
  'Compact': {
    techBase: 'Both',
    weightMultiplier: 1.5,
    slotRequirements: { centerTorso: 3, leftTorso: 0, rightTorso: 0 },
    survivabilityRules: { sideDestroyed: 'continue_penalty', bothSidesDestroyed: 'continue_penalty' },
    heatSinkCapacity: 10,
    costMultiplier: 1.5,
    techLevel: 'Advanced',
    introductionYear: 2460
  },
  'ICE': {
    techBase: 'Both',
    weightMultiplier: 2.0,
    slotRequirements: { centerTorso: 6, leftTorso: 0, rightTorso: 0 },
    survivabilityRules: { sideDestroyed: 'shutdown', bothSidesDestroyed: 'shutdown' },
    heatSinkCapacity: 0,
    costMultiplier: 0.1,
    techLevel: 'Standard',
    introductionYear: 1950
  },
  'Fuel Cell': {
    techBase: 'Both',
    weightMultiplier: 1.5,
    slotRequirements: { centerTorso: 6, leftTorso: 0, rightTorso: 0 },
    survivabilityRules: { sideDestroyed: 'shutdown', bothSidesDestroyed: 'shutdown' },
    heatSinkCapacity: 0,
    costMultiplier: 3.5,
    techLevel: 'Advanced',
    introductionYear: 3045
  }
}
```

### Enhanced Heat Sink System

```typescript
export type EnhancedHeatSinkType = 
  | 'Single'                   // Both tech bases
  | 'Double (IS)'              // Inner Sphere
  | 'Double (Clan)'            // Clan
  | 'Compact'                  // Advanced tech, both
  | 'Laser'                    // Advanced tech, both

export interface HeatSinkSpecification {
  techBase: 'Inner Sphere' | 'Clan' | 'Both'
  dissipation: number
  weight: number
  criticalSlots: number
  costMultiplier: number
  techLevel: 'Standard' | 'Advanced' | 'Experimental'
  introductionYear: number
  extinctionYear?: number
}

export const HEAT_SINK_SPECIFICATIONS: Record<EnhancedHeatSinkType, HeatSinkSpecification> = {
  'Single': {
    techBase: 'Both',
    dissipation: 1,
    weight: 1,
    criticalSlots: 1,
    costMultiplier: 1.0,
    techLevel: 'Standard',
    introductionYear: 2470
  },
  'Double (IS)': {
    techBase: 'Inner Sphere',
    dissipation: 2,
    weight: 1,
    criticalSlots: 3,
    costMultiplier: 6.0,
    techLevel: 'Standard',
    introductionYear: 3040
  },
  'Double (Clan)': {
    techBase: 'Clan',
    dissipation: 2,
    weight: 1,
    criticalSlots: 2,
    costMultiplier: 6.0,
    techLevel: 'Standard',
    introductionYear: 2824
  },
  'Compact': {
    techBase: 'Both',
    dissipation: 1,
    weight: 1,
    criticalSlots: 1,
    costMultiplier: 3.0,
    techLevel: 'Advanced',
    introductionYear: 3058
  },
  'Laser': {
    techBase: 'Both',
    dissipation: 2,
    weight: 1,
    criticalSlots: 2,
    costMultiplier: 6.0,
    techLevel: 'Advanced',
    introductionYear: 3067
  }
}
```

### Enhanced Structure System

```typescript
export interface StructureSpecification {
  techBase: 'Inner Sphere' | 'Clan' | 'Both'
  weightMultiplier: number
  criticalSlots: number
  slotDistribution: { [location: string]: number }
  costMultiplier: number
  techLevel: 'Standard' | 'Advanced'
  introductionYear: number
  extinctionYear?: number
}

export const STRUCTURE_SPECIFICATIONS: Record<StructureType, StructureSpecification> = {
  'Standard': {
    techBase: 'Both',
    weightMultiplier: 1.0,
    criticalSlots: 0,
    slotDistribution: {},
    costMultiplier: 1.0,
    techLevel: 'Standard',
    introductionYear: 2470
  },
  'Endo Steel': {
    techBase: 'Inner Sphere',
    weightMultiplier: 0.5,
    criticalSlots: 14,
    slotDistribution: {
      'Left Arm': 2, 'Right Arm': 2,
      'Left Torso': 3, 'Right Torso': 3,
      'Left Leg': 2, 'Right Leg': 2
    },
    costMultiplier: 1.6,
    techLevel: 'Advanced',
    introductionYear: 3035
  },
  'Endo Steel (Clan)': {
    techBase: 'Clan',
    weightMultiplier: 0.5,
    criticalSlots: 7,
    slotDistribution: {
      'Left Torso': 2, 'Right Torso': 2,
      'Left Leg': 1, 'Right Leg': 1, 'Head': 1
    },
    costMultiplier: 1.6,
    techLevel: 'Advanced',
    introductionYear: 2824
  },
  'Composite': {
    techBase: 'Both',
    weightMultiplier: 0.5,
    criticalSlots: 0,
    slotDistribution: {},
    costMultiplier: 1.2,
    techLevel: 'Advanced',
    introductionYear: 3080
  },
  'Reinforced': {
    techBase: 'Both',
    weightMultiplier: 2.0,
    criticalSlots: 0,
    slotDistribution: {},
    costMultiplier: 2.0,
    techLevel: 'Advanced',
    introductionYear: 3068
  },
  'Industrial': {
    techBase: 'Both',
    weightMultiplier: 2.0,
    criticalSlots: 0,
    slotDistribution: {},
    costMultiplier: 0.5,
    techLevel: 'Standard',
    introductionYear: 2350
  }
}
```

---

## Construction Rules Engine

### Core Construction Rules Manager

```typescript
export class ConstructionRulesEngine {
  private componentSpecifications: ComponentSpecificationRegistry
  private techBaseRules: TechBaseRulesManager
  private slotAllocator: CriticalSlotAllocator
  private weightCalculator: WeightCalculationEngine
  private costCalculator: CostCalculationEngine
  private validator: ConstructionValidator

  constructor() {
    this.componentSpecifications = new ComponentSpecificationRegistry()
    this.techBaseRules = new TechBaseRulesManager()
    this.slotAllocator = new CriticalSlotAllocator()
    this.weightCalculator = new WeightCalculationEngine()
    this.costCalculator = new CostCalculationEngine()
    this.validator = new ConstructionValidator()
  }

  /**
   * Validate complete mech configuration
   */
  validateConstruction(
    components: EnhancedSystemComponents, 
    context: ConstructionContext
  ): ConstructionValidationResult {
    const result: ConstructionValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      techBaseViolations: [],
      slotViolations: [],
      weightViolations: [],
      costCalculation: null
    }

    // 1. Tech base compatibility validation
    const techBaseResult = this.techBaseRules.validateCompatibility(components, context)
    result.errors.push(...techBaseResult.errors)
    result.warnings.push(...techBaseResult.warnings)
    result.techBaseViolations = techBaseResult.violations

    // 2. Critical slot allocation validation  
    const slotResult = this.slotAllocator.validateAllocation(components, context)
    result.errors.push(...slotResult.errors)
    result.slotViolations = slotResult.violations

    // 3. Weight calculations and validation
    const weightResult = this.weightCalculator.calculateAndValidate(components, context)
    result.errors.push(...weightResult.errors)
    result.warnings.push(...weightResult.warnings)
    result.weightViolations = weightResult.violations

    // 4. Cost calculations
    result.costCalculation = this.costCalculator.calculateTotalCost(components, context)

    result.isValid = result.errors.length === 0

    return result
  }

  /**
   * Get available component options based on tech base and era
   */
  getAvailableComponents(
    componentType: ComponentType,
    context: ConstructionContext
  ): ComponentOption[] {
    return this.componentSpecifications.getAvailableOptions(componentType, context)
  }

  /**
   * Calculate construction impact of component change
   */
  calculateChangeImpact(
    currentComponents: EnhancedSystemComponents,
    proposedChange: ComponentChange,
    context: ConstructionContext
  ): ConstructionChangeImpact {
    // Calculate slot displacement
    const slotImpact = this.slotAllocator.calculateChangeImpact(
      currentComponents, proposedChange, context
    )

    // Calculate weight impact
    const weightImpact = this.weightCalculator.calculateChangeImpact(
      currentComponents, proposedChange, context
    )

    // Calculate cost impact
    const costImpact = this.costCalculator.calculateChangeImpact(
      currentComponents, proposedChange, context
    )

    return {
      slotImpact,
      weightImpact, 
      costImpact,
      techCompatibilityImpact: this.techBaseRules.validateChange(
        currentComponents, proposedChange, context
      )
    }
  }
}

export interface ComponentOption {
  id: string
  name: string
  techBase: string
  available: boolean
  reason?: string
  details?: {
    weight: number
    criticalSlots: number
    cost: number
    techLevel: string
    introductionYear: number
  }
}

export type ComponentType = 'engine' | 'gyro' | 'structure' | 'armor' | 'heatSink' | 'cockpit'
```

### Component Specification Registry

```typescript
export class ComponentSpecificationRegistry {
  private specifications: Map<string, any>
  private availabilityCache: Map<string, ComponentOption[]>

  constructor() {
    this.specifications = new Map()
    this.availabilityCache = new Map()
    this.loadSpecifications()
  }

  getAvailableOptions(
    componentType: ComponentType,
    context: ConstructionContext
  ): ComponentOption[] {
    const cacheKey = this.generateCacheKey(componentType, context)
    
    if (this.availabilityCache.has(cacheKey)) {
      return this.availabilityCache.get(cacheKey)!
    }

    const options = this.calculateAvailableOptions(componentType, context)
    this.availabilityCache.set(cacheKey, options)
    return options
  }

  private calculateAvailableOptions(
    componentType: ComponentType,
    context: ConstructionContext
  ): ComponentOption[] {
    const options: ComponentOption[] = []

    switch (componentType) {
      case 'engine':
        Object.entries(ENGINE_SPECIFICATIONS).forEach(([type, spec]) => {
          const option = this.createEngineOption(type as EnhancedEngineType, spec, context)
          options.push(option)
        })
        break

      case 'heatSink':
        Object.entries(HEAT_SINK_SPECIFICATIONS).forEach(([type, spec]) => {
          const option = this.createHeatSinkOption(type as EnhancedHeatSinkType, spec, context)
          options.push(option)
        })
        break

      case 'structure':
        Object.entries(STRUCTURE_SPECIFICATIONS).forEach(([type, spec]) => {
          const option = this.createStructureOption(type as StructureType, spec, context)
          options.push(option)
        })
        break

      // Add other component types...
    }

    return options.filter(option => option.available || context.techLevel === 'Experimental')
  }

  private createEngineOption(
    type: EnhancedEngineType,
    spec: EngineSpecification,
    context: ConstructionContext
  ): ComponentOption {
    const isCompatible = this.isTechBaseCompatible(spec.techBase, context.techBase)
    const isAvailable = this.isAvailableInEra(spec.introductionYear, spec.extinctionYear, context.era)
    const isTechLevelCompatible = this.isTechLevelCompatible(spec.techLevel, context.techLevel)

    let reason = ''
    if (!isCompatible) reason = `Incompatible with ${context.techBase}`
    else if (!isAvailable) reason = `Not available in ${context.era}`
    else if (!isTechLevelCompatible) reason = `Requires ${spec.techLevel} tech level`

    return {
      id: type,
      name: this.formatEngineName(type),
      techBase: spec.techBase,
      available: isCompatible && isAvailable && isTechLevelCompatible,
      reason,
      details: {
        weight: 0, // Calculated based on rating
        criticalSlots: spec.slotRequirements.centerTorso + spec.slotRequirements.leftTorso + spec.slotRequirements.rightTorso,
        cost: 0, // Calculated based on rating
        techLevel: spec.techLevel,
        introductionYear: spec.introductionYear
      }
    }
  }

  private isTechBaseCompatible(componentTechBase: string, chassisTechBase: string): boolean {
    const compatibilityRules = {
      'Inner Sphere': ['Inner Sphere', 'Mixed (IS Chassis)'],
      'Clan': ['Clan', 'Mixed (Clan Chassis)'],
      'Both': ['Inner Sphere', 'Clan', 'Mixed (IS Chassis)', 'Mixed (Clan Chassis)']
    }

    return compatibilityRules[componentTechBase]?.includes(chassisTechBase) || false
  }

  private isAvailableInEra(introYear: number, extinctYear: number | undefined, era: string): boolean {
    const eraYear = this.parseEraYear(era)
    if (eraYear < introYear) return false
    if (extinctYear && eraYear > extinctYear) return false
    return true
  }

  private isTechLevelCompatible(componentTechLevel: string, contextTechLevel: string): boolean {
    const techLevelHierarchy = ['Introductory', 'Standard', 'Advanced', 'Experimental']
    const componentIndex = techLevelHierarchy.indexOf(componentTechLevel)
    const contextIndex = techLevelHierarchy.indexOf(contextTechLevel)
    return componentIndex <= contextIndex
  }

  private parseEraYear(era: string): number {
    // Convert era string to year (e.g., "3025" -> 3025, "Succession Wars" -> 3025)
    const eraYearMap: { [key: string]: number } = {
      'Age of War': 2005,
      'Star League': 2571,
      'Succession Wars': 3025,
      'Clan Invasion': 3050,
      'FedCom Civil War': 3057,
      'Jihad': 3067,
      'Dark Age': 3135
    }

    const numericYear = parseInt(era)
    if (!isNaN(numericYear)) return numericYear

    return eraYearMap[era] || 3025
  }

  private formatEngineName(type: EnhancedEngineType): string {
    const nameMap: { [key: string]: string } = {
      'Standard': 'Fusion Engine',
      'XL (IS)': 'XL Engine (IS)',
      'XL (Clan)': 'XL Engine (Clan)',
      'Light': 'Light Engine',
      'XXL': 'XXL Engine',
      'Compact': 'Compact Engine',
      'ICE': 'I.C.E. Engine',
      'Fuel Cell': 'Fuel Cell Engine'
    }

    return nameMap[type] || type
  }

  private generateCacheKey(componentType: ComponentType, context: ConstructionContext): string {
    return `${componentType}-${context.techBase}-${context.techLevel}-${context.era}`
  }
}
```

---

## Tech Base Rules Manager

### Tech Base Compatibility System

```typescript
export interface TechValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  violations: TechBaseViolation[]
}

export interface TechCompatibilityImpact {
  compatibilityChanges: string[]
  newRestrictions: string[]
  removedRestrictions: string[]
}

export class TechBaseRulesManager {
  private compatibilityMatrix: TechCompatibilityMatrix
  private mixedTechRules: MixedTechRulesEngine

  constructor() {
    this.compatibilityMatrix = new TechCompatibilityMatrix()
    this.mixedTechRules = new MixedTechRulesEngine()
  }

  validateCompatibility(
    components: EnhancedSystemComponents,
    context: ConstructionContext
  ): TechValidationResult {
    const result: TechValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      violations: []
    }

    // Check each component's tech base compatibility
    this.validateEngineCompatibility(components.engine, context, result)
    this.validateStructureCompatibility(components.structure, context, result)
    this.validateArmorCompatibility(components.armor, context, result)
    this.validateHeatSinkCompatibility(components.heatSinks, context, result)

    // Mixed tech validation if applicable
    if (context.techBase.startsWith('Mixed')) {
      const mixedTechResult = this.mixedTechRules.validate(components, context)
      result.errors.push(...mixedTechResult.errors)
      result.warnings.push(...mixedTechResult.warnings)
    }

    return result
  }

  validateChange(
    currentComponents: EnhancedSystemComponents,
    proposedChange: ComponentChange,
    context: ConstructionContext
  ): TechCompatibilityImpact {
    // Calculate compatibility impact of the proposed change
    const tempComponents = this.applyChange(currentComponents, proposedChange)
    const currentValidation = this.validateCompatibility(currentComponents, context)
    const newValidation = this.validateCompatibility(tempComponents, context)

    return {
      compatibilityChanges: this.findCompatibilityChanges(currentValidation, newValidation),
      newRestrictions: this.findNewRestrictions(currentValidation, newValidation),
      removedRestrictions: this.findRemovedRestrictions(currentValidation, newValidation)
    }
  }

  private validateEngineCompatibility(
    engine: EnhancedEngineComponent,
    context: ConstructionContext,
    result: TechValidationResult
  ): void {
    const engineSpec = ENGINE_SPECIFICATIONS[engine.type as EnhancedEngineType]
    
    // Check basic tech base compatibility
    if (engineSpec.techBase !== 'Both' && 
        !this.isTechBaseCompatible(engineSpec.techBase, context.techBase)) {
      result.errors.push(
        `${engine.type} engine (${engineSpec.techBase}) not compatible with ${context.techBase} chassis`
      )
      result.violations.push({
        component: 'engine',
        violation: 'tech_base_mismatch',
        details: `Engine tech base ${engineSpec.techBase} incompatible with chassis ${context.techBase}`
      })
    }

    // Check era availability
    if (!this.isAvailableInEra(engine.type, context.era)) {
      result.errors.push(
        `${engine.type} engine not available in era ${context.era}`
      )
      result.violations.push({
        component: 'engine',
        violation: 'era_unavailable',
        details: `Technology not developed in ${context.era}`
      })
    }

    // Check tech level compatibility
    if (!this.isTechLevelCompatible(engineSpec.techLevel, context.techLevel)) {
      result.errors.push(
        `${engine.type} engine requires ${engineSpec.techLevel} tech level, current is ${context.techLevel}`
      )
      result.violations.push({
        component: 'engine',
        violation: 'tech_level_incompatible',
        details: `Engine requires ${engineSpec.techLevel} tech level`
      })
    }

    // Special rules for mixed tech
    if (context.techBase.startsWith('Mixed') && engineSpec.techBase !== 'Both') {
      this.validateMixedTechEngine(engine, context, result)
    }
  }

  private validateStructureCompatibility(
    structure: EnhancedStructureComponent,
    context: ConstructionContext,
    result: TechValidationResult
  ): void {
    const structureSpec = STRUCTURE_SPECIFICATIONS[structure.type]
    
    if (structureSpec.techBase !== 'Both' && 
        !this.isTechBaseCompatible(structureSpec.techBase, context.techBase)) {
      result.errors.push(
        `${structure.type} structure not compatible with ${context.techBase} chassis`
      )
      result.violations.push({
        component: 'structure',
        violation: 'tech_base_mismatch',
        details: `Structure tech base ${structureSpec.techBase} incompatible with chassis ${context.techBase}`
      })
    }

    if (!this.isTechLevelCompatible(structureSpec.techLevel, context.techLevel)) {
      result.errors.push(
        `${structure.type} structure requires ${structureSpec.techLevel} tech level`
      )
    }
  }

  private validateArmorCompatibility(
    armor: EnhancedArmorComponent,
    context: ConstructionContext,
    result: TechValidationResult
  ): void {
    // Implement armor compatibility validation similar to structure
    // Check tech base, era availability, and tech level compatibility
  }

  private validateHeatSinkCompatibility(
    heatSinks: EnhancedHeatSinkComponent,
    context: ConstructionContext,
    result: TechValidationResult
  ): void {
    const heatSinkSpec = HEAT_SINK_SPECIFICATIONS[heatSinks.type as EnhancedHeatSinkType]
    
    if (heatSinkSpec.techBase !== 'Both' && 
        !this.isTechBaseCompatible(heatSinkSpec.techBase, context.techBase)) {
      result.errors.push(
        `${heatSinks.type} heat sinks not compatible with ${context.techBase} chassis`
      )
      result.violations.push({
        component: 'heatSinks',
        violation: 'tech_base_mismatch',
        details: `Heat sink tech base ${heatSinkSpec.techBase} incompatible with chassis ${context.techBase}`
      })
    }
  }

  private validateMixedTechEngine(
    engine: EnhancedEngineComponent,
    context: ConstructionContext, 
    result: TechValidationResult
  ): void {
    // Mixed tech engines have special rules and restrictions
    const mixedTechPenalties = this.mixedTechRules.calculatePenalties(engine, context)
    
    if (mixedTechPenalties.battleValueMultiplier > 1.0) {
      result.warnings.push(
        `Mixed tech engine increases Battle Value by ${Math.round((mixedTechPenalties.battleValueMultiplier - 1) * 100)}%`
      )
    }

    if (mixedTechPenalties.costMultiplier > 1.0) {
      result.warnings.push(
        `Mixed tech engine increases cost by ${Math.round((mixedTechPenalties.costMultiplier - 1) * 100)}%`
      )
    }
  }

  private isTechBaseCompatible(componentTechBase: string, chassisTechBase: string): boolean {
    const compatibilityRules = {
      'Inner Sphere': ['Inner Sphere', 'Mixed (IS Chassis)'],
      'Clan': ['Clan', 'Mixed (Clan Chassis)'],
      'Both': ['Inner Sphere', 'Clan', 'Mixed (IS Chassis)', 'Mixed (Clan Chassis)']
    }

    return compatibilityRules[componentTechBase]?.includes(chassisTechBase) || false
  }

  private isAvailableInEra(engineType: string, era: string): boolean {
    // Implementation for era availability checking
    return true // Simplified for now
  }

  private isTechLevelCompatible(componentTechLevel: string, contextTechLevel: string): boolean {
    const techLevelHierarchy = ['Introductory', 'Standard', 'Advanced', 'Experimental']
    const componentIndex = techLevelHierarchy.indexOf(componentTechLevel)
    const contextIndex = techLevelHierarchy.indexOf(contextTechLevel)
    return componentIndex <= contextIndex
  }
}

### Mixed Tech Rules Engine

```typescript
export interface MixedTechPenalties {
  battleValueMultiplier: number
  costMultiplier: number
  additionalRestrictions: string[]
}

export class MixedTechRulesEngine {
  validate(
    components: EnhancedSystemComponents,
    context: ConstructionContext
  ): TechValidationResult {
    const result: TechValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      violations: []
    }

    // Mixed tech chassis must follow specific rules
    if (context.techBase.startsWith('Mixed')) {
      // Check mixed tech percentage limits
      const mixedTechPercentage = this.calculateMixedTechPercentage(components)
      
      if (mixedTechPercentage > 0.5) {
        result.warnings.push(
          `Mixed tech configuration is ${Math.round(mixedTechPercentage * 100)}% non-chassis tech`
        )
      }

      // Apply mixed tech penalties
      const penalties = this.calculateTotalPenalties(components, context)
      if (penalties.battleValueMultiplier > 1.0) {
        result.warnings.push(
          `Mixed tech penalties: BV +${Math.round((penalties.battleValueMultiplier - 1) * 100)}%, Cost +${Math.round((penalties.costMultiplier - 1) * 100)}%`
        )
      }
    }

    return result
  }

  calculatePenalties(
    engine: EnhancedEngineComponent,
    context: ConstructionContext
  ): MixedTechPenalties {
    const engineSpec = ENGINE_SPECIFICATIONS[engine.type as EnhancedEngineType]
    
    // Base penalties for mixed tech
    let battleValueMultiplier = 1.0
    let costMultiplier = 1.0
    const additionalRestrictions: string[] = []

    if (context.techBase.startsWith('Mixed') && engineSpec.techBase !== 'Both') {
      // Check if engine tech base differs from chassis tech base
      const chassisTechBase = context.techBase.includes('IS') ? 'Inner Sphere' : 'Clan'
      
      if (engineSpec.techBase !== chassisTechBase) {
        battleValueMultiplier = 1.25 // 25% BV penalty
        costMultiplier = 1.5 // 50% cost penalty
        additionalRestrictions.push('Mixed tech engine requires special maintenance')
      }
    }

    return {
      battleValueMultiplier,
      costMultiplier,
      additionalRestrictions
    }
  }

  private calculateMixedTechPercentage(components: EnhancedSystemComponents): number {
    // Calculate percentage of non-chassis tech components
    return 0.3 // Simplified calculation
  }

  private calculateTotalPenalties(
    components: EnhancedSystemComponents,
    context: ConstructionContext
  ): MixedTechPenalties {
    // Aggregate penalties from all mixed tech components
    return {
      battleValueMultiplier: 1.25,
      costMultiplier: 1.5,
      additionalRestrictions: []
    }
  }
}
```

---

## Critical Slot Allocator

### Enhanced Slot Allocation System

```typescript
export interface SlotValidationResult {
  isValid: boolean
  errors: string[]
  violations: SlotViolation[]
  slotMap: { [location: string]: SlotAllocation[] }
  availableSlots: { [location: string]: number[] }
}

export interface SlotAllocation {
  slotIndex: number
  component: string
  componentType: 'system' | 'equipment' | 'structure' | 'armor'
  isFixed: boolean
  techBase?: string
}

export class CriticalSlotAllocator {
  private slotLayoutEngine: SlotLayoutEngine
  private displacementManager: EquipmentDisplacementManager

  constructor() {
    this.slotLayoutEngine = new SlotLayoutEngine()
    this.displacementManager = new EquipmentDisplacementManager()
  }

  validateAllocation(
    components: EnhancedSystemComponents,
    context: ConstructionContext
  ): SlotValidationResult {
    const result: SlotValidationResult = {
      isValid: true,
      errors: [],
      violations: [],
      slotMap: this.generateSlotMap(components, context),
      availableSlots: this.calculateAvailableSlots(components, context)
    }

    // Validate engine slot allocation
    this.validateEngineSlots(components.engine, context, result)
    
    // Validate structure slot allocation  
    this.validateStructureSlots(components.structure, context, result)
    
    // Validate armor slot allocation
    this.validateArmorSlots(components.armor, context, result)

    // Validate heat sink slot allocation
    this.validateHeatSinkSlots(components.heatSinks, context, result)

    return result
  }

  private validateEngineSlots(
    engine: EnhancedEngineComponent,
    context: ConstructionContext,
    result: SlotValidationResult
  ): void {
    const engineSpec = ENGINE_SPECIFICATIONS[engine.type as EnhancedEngineType]
    const requiredSlots = engineSpec.slotRequirements

    // Validate center torso allocation
    if (requiredSlots.centerTorso > 0) {
      const ctAvailable = this.getAvailableSlotsInLocation('Center Torso', result.slotMap)
      if (ctAvailable < requiredSlots.centerTorso) {
        result.errors.push(
          `${engine.type} engine requires ${requiredSlots.centerTorso} CT slots, only ${ctAvailable} available`
        )
        result.violations.push({
          location: 'Center Torso',
          required: requiredSlots.centerTorso,
          available: ctAvailable,
          component: 'engine'
        })
      }
    }

    // Validate side torso allocations (XL/Light/XXL engines)
    if (requiredSlots.leftTorso > 0) {
      this.validateSideTorsoSlots('Left Torso', requiredSlots.leftTorso, engine.type, result)
    }
    if (requiredSlots.rightTorso > 0) {
      this.validateSideTorsoSlots('Right Torso', requiredSlots.rightTorso, engine.type, result)
    }

    // Special validation for Clan XL vs IS XL
    if (engine.type === 'XL (IS)' || engine.type === 'XL (Clan)') {
      this.validateXLEngineSpecifics(engine, context, result)
    }
  }

  private validateXLEngineSpecifics(
    engine: EnhancedEngineComponent,
    context: ConstructionContext,
    result: SlotValidationResult
  ): void {
    const engineSpec = ENGINE_SPECIFICATIONS[engine.type as EnhancedEngineType]
    
    // Clan XL engines use fewer side torso slots
    if (engine.type === 'XL (Clan)') {
      // Verify the reduced slot requirement is properly accounted for
      if (engineSpec.slotRequirements.leftTorso !== 2 || engineSpec.slotRequirements.rightTorso !== 2) {
        result.errors.push('Clan XL engine slot requirements are incorrect - should be 2 per side torso')
      }
    } else if (engine.type === 'XL (IS)') {
      // IS XL engines use 3 slots per side torso
      if (engineSpec.slotRequirements.leftTorso !== 3 || engineSpec.slotRequirements.rightTorso !== 3) {
        result.errors.push('IS XL engine slot requirements are incorrect - should be 3 per side torso')
      }
    }

    // Add survivability warnings
    if (engine.type === 'XL (IS)') {
      result.warnings?.push('IS XL engines are destroyed if either side torso is lost')
    } else if (engine.type === 'XL (Clan)') {
      result.warnings?.push('Clan XL engines continue operating with -2 penalty if one side torso is lost')
    }
  }

  private validateStructureSlots(
    structure: EnhancedStructureComponent,
    context: ConstructionContext,
    result: SlotValidationResult
  ): void {
    const structureSpec = STRUCTURE_SPECIFICATIONS[structure.type]
    
    if (structureSpec.criticalSlots > 0) {
      // Validate structure slot distribution
      Object.entries(structureSpec.slotDistribution).forEach(([location, requiredSlots]) => {
        const available = this.getAvailableSlotsInLocation(location, result.slotMap)
        if (available < requiredSlots) {
          result.errors.push(
            `${structure.type} requires ${requiredSlots} slots in ${location}, only ${available} available`
          )
          result.violations.push({
            location,
            required: requiredSlots,
            available,
            component: 'structure'
          })
        }
      })
    }
  }

  private validateArmorSlots(
    armor: EnhancedArmorComponent,
    context: ConstructionContext,
    result: SlotValidationResult
  ): void {
    // Similar validation for armor slots
  }

  private validateHeatSinkSlots(
    heatSinks: EnhancedHeatSinkComponent,
    context: ConstructionContext,
    result: SlotValidationResult
  ): void {
    const heatSinkSpec = HEAT_SINK_SPECIFICATIONS[heatSinks.type as EnhancedHeatSinkType]
    const externalHeatSinks = heatSinks.externalRequired
    const totalSlotsNeeded = externalHeatSinks * heatSinkSpec.criticalSlots

    // Check if there are enough slots across all locations for external heat sinks
    const totalAvailableSlots = Object.values(result.availableSlots).reduce(
      (total, slots) => total + slots.length, 0
    )

    if (totalAvailableSlots < totalSlotsNeeded) {
      result.errors.push(
        `Need ${totalSlotsNeeded} slots for ${externalHeatSinks} external heat sinks, only ${totalAvailableSlots} available`
      )
    }
  }

  calculateChangeImpact(
    currentComponents: EnhancedSystemComponents,
    proposedChange: ComponentChange,
    context: ConstructionContext
  ): SlotChangeImpact {
    const currentSlotMap = this.generateSlotMap(currentComponents, context)
    
    // Create temporary components with the proposed change
    const tempComponents = this.applyChange(currentComponents, proposedChange)
    const newSlotMap = this.generateSlotMap(tempComponents, context)

    // Calculate displaced equipment
    const displacedEquipment = this.displacementManager.calculateDisplacement(
      currentSlotMap, newSlotMap, proposedChange
    )

    return {
      displacedEquipment,
      newSlotRequirements: this.calculateSlotDifferences(currentSlotMap, newSlotMap),
      availabilityChange: this.calculateAvailabilityChange(currentSlotMap, newSlotMap)
    }
  }

  private generateSlotMap(
    components: EnhancedSystemComponents,
    context: ConstructionContext
  ): { [location: string]: SlotAllocation[] } {
    // Generate complete slot allocation map based on components
    const slotMap: { [location: string]: SlotAllocation[] } = {}
    
    // Initialize all locations
    const locations = ['Head', 'Center Torso', 'Left Torso', 'Right Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg']
    locations.forEach(location => {
      slotMap[location] = []
    })

    // Add system component allocations
    this.addEngineSlots(slotMap, components.engine, context)
    this.addGyroSlots(slotMap, components.gyro, context)
    this.addStructureSlots(slotMap, components.structure, context)
    this.addArmorSlots(slotMap, components.armor, context)

    return slotMap
  }

  private addEngineSlots(
    slotMap: { [location: string]: SlotAllocation[] },
    engine: EnhancedEngineComponent,
    context: ConstructionContext
  ): void {
    const engineSpec = ENGINE_SPECIFICATIONS[engine.type as EnhancedEngineType]
    const requirements = engineSpec.slotRequirements

    // Add center torso engine slots
    for (let i = 0; i < requirements.centerTorso; i++) {
      slotMap['Center Torso'].push({
        slotIndex: i,
        component: 'Engine',
        componentType: 'system',
        isFixed: true,
        techBase: engineSpec.techBase
      })
    }

    // Add side torso engine slots
    for (let i = 0; i < requirements.leftTorso; i++) {
      slotMap['Left Torso'].push({
        slotIndex: i,
        component: 'Engine',
        componentType: 'system',
        isFixed: true,
        techBase: engineSpec.techBase
      })
    }

    for (let i = 0; i < requirements.rightTorso; i++) {
      slotMap['Right Torso'].push({
        slotIndex: i,
        component: 'Engine',
        componentType: 'system',
        isFixed: true,
        techBase: engineSpec.techBase
      })
    }
  }

  private getAvailableSlotsInLocation(location: string, slotMap: { [location: string]: SlotAllocation[] }): number {
    const maxSlots = this.getMaxSlotsForLocation(location)
    const occupiedSlots = slotMap[location]?.length || 0
    return maxSlots - occupiedSlots
  }

  private getMaxSlotsForLocation(location: string): number {
    const slotCounts: { [key: string]: number } = {
      'Head': 6,
      'Center Torso': 12,
      'Left Torso': 12,
      'Right Torso': 12,
      'Left Arm': 12,
      'Right Arm': 12,
      'Left Leg': 6,
      'Right Leg': 6
    }
    return slotCounts[location] || 0
  }
}
```

---

## Weight & Cost Calculation Engines

### Enhanced Weight Calculation

```typescript
export interface WeightValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  violations: WeightViolation[]
  totalWeight: number
  breakdown: WeightBreakdown
}

export interface WeightBreakdown {
  engine: number
  structure: number
  armor: number
  heatSinks: number
  gyro: number
  cockpit: number
}

export interface WeightChangeImpact {
  weightDelta: number
  newTotalWeight: number
  affectedSystems: string[]
  violations: WeightViolation[]
}

export class WeightCalculationEngine {
  calculateAndValidate(
    components: EnhancedSystemComponents,
    context: ConstructionContext
  ): WeightValidationResult {
    const result: WeightValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      violations: [],
      totalWeight: 0,
      breakdown: {
        engine: 0,
        structure: 0,
        armor: 0,
        heatSinks: 0,
        gyro: 0,
        cockpit: 0
      }
    }

    // Calculate engine weight with tech base considerations
    const engineWeight = this.calculateEngineWeight(components.engine, context)
    result.breakdown.engine = engineWeight

    // Calculate structure weight
    const structureWeight = this.calculateStructureWeight(components.structure, context)
    result.breakdown.structure = structureWeight

    // Calculate armor weight
    const armorWeight = this.calculateArmorWeight(components.armor, context)
    result.breakdown.armor = armorWeight

    // Calculate heat sink weight
    const heatSinkWeight = this.calculateHeatSinkWeight(components.heatSinks, context)
    result.breakdown.heatSinks = heatSinkWeight

    // Calculate gyro weight
    const gyroWeight = this.calculateGyroWeight(components.gyro, context)
    result.breakdown.gyro = gyroWeight

    // Calculate cockpit weight
    const cockpitWeight = this.calculateCockpitWeight(components.cockpit, context)
    result.breakdown.cockpit = cockpitWeight

    result.totalWeight = engineWeight + structureWeight + armorWeight + heatSinkWeight + gyroWeight + cockpitWeight

    // Validate against tonnage limits
    if (result.totalWeight > context.mechTonnage) {
      result.errors.push(
        `Total component weight ${result.totalWeight} exceeds mech tonnage ${context.mechTonnage}`
      )
      result.violations.push({
        type: 'overweight',
        excess: result.totalWeight - context.mechTonnage,
        details: `Weight exceeds chassis capacity by ${result.totalWeight - context.mechTonnage} tons`
      })
      result.isValid = false
    }

    return result
  }

  calculateChangeImpact(
    currentComponents: EnhancedSystemComponents,
    proposedChange: ComponentChange,
    context: ConstructionContext
  ): WeightChangeImpact {
    const currentWeight = this.calculateAndValidate(currentComponents, context)
    const tempComponents = this.applyChange(currentComponents, proposedChange)
    const newWeight = this.calculateAndValidate(tempComponents, context)

    return {
      weightDelta: newWeight.totalWeight - currentWeight.totalWeight,
      newTotalWeight: newWeight.totalWeight,
      affectedSystems: this.findAffectedSystems(currentWeight.breakdown, newWeight.breakdown),
      violations: newWeight.violations
    }
  }

  private calculateEngineWeight(
    engine: EnhancedEngineComponent,
    context: ConstructionContext
  ): number {
    const engineSpec = ENGINE_SPECIFICATIONS[engine.type as EnhancedEngineType]
    
    // Engine weight formula: (Rating / 25) * Weight Multiplier, rounded up to nearest 0.5 ton
    const baseWeight = engine.rating / 25
    const adjustedWeight = baseWeight * engineSpec.weightMultiplier
    return Math.ceil(adjustedWeight * 2) / 2
  }

  private calculateStructureWeight(
    structure: EnhancedStructureComponent,
    context: ConstructionContext
  ): number {
    const structureSpec = STRUCTURE_SPECIFICATIONS[structure.type]
    
    // Base structure weight: 10% of mech tonnage
    const baseStructureWeight = context.mechTonnage * 0.1
    const adjustedWeight = baseStructureWeight * structureSpec.weightMultiplier
    return Math.ceil(adjustedWeight * 2) / 2
  }

  private calculateArmorWeight(
    armor: EnhancedArmorComponent,
    context: ConstructionContext
  ): number {
    // This will be calculated based on armor points allocated
    // For now, return a placeholder
    return 0
  }

  private calculateHeatSinkWeight(
    heatSinks: EnhancedHeatSinkComponent,
    context: ConstructionContext
  ): number {
    const heatSinkSpec = HEAT_SINK_SPECIFICATIONS[heatSinks.type as EnhancedHeatSinkType]
    const externalHeatSinks = heatSinks.externalRequired
    return externalHeatSinks * heatSinkSpec.weight
  }

  private calculateGyroWeight(
    gyro: EnhancedGyroComponent,
    context: ConstructionContext
  ): number {
    // Gyro weight is typically based on engine rating and gyro type
    // Standard formula: Engine Rating / 100, rounded up, with type modifiers
    return Math.ceil(context.mechTonnage / 100) // Simplified
  }

  private calculateCockpitWeight(
    cockpit: EnhancedCockpitComponent,
    context: ConstructionContext
  ): number {
    // Standard cockpit weighs 3 tons
    return 3 // Simplified
  }

  private applyChange(
    components: EnhancedSystemComponents,
    change: ComponentChange
  ): EnhancedSystemComponents {
    const newComponents = { ...components }
    
    switch (change.componentType) {
      case 'engine':
        newComponents.engine = { ...newComponents.engine, ...change.newValue }
        break
      case 'structure':
        newComponents.structure = { ...newComponents.structure, ...change.newValue }
        break
      // Add other component types
    }
    
    return newComponents
  }

  private findAffectedSystems(
    oldBreakdown: WeightBreakdown,
    newBreakdown: WeightBreakdown
  ): string[] {
    const affected: string[] = []
    
    Object.keys(oldBreakdown).forEach(system => {
      if (oldBreakdown[system as keyof WeightBreakdown] !== newBreakdown[system as keyof WeightBreakdown]) {
        affected.push(system)
      }
    })
    
    return affected
  }
}

### Cost Calculation Engine

```typescript
export interface CostCalculation {
  totalCost: number
  breakdown: CostBreakdown
  modifiers: CostModifier[]
}

export interface CostBreakdown {
  chassis: number
  engine: number
  structure: number
  armor: number
  heatSinks: number
  gyro: number
  cockpit: number
  equipment: number
  mixedTechPenalty: number
}

export interface CostModifier {
  type: string
  description: string
  multiplier: number
  applies_to: string[]
}

export class CostCalculationEngine {
  calculateTotalCost(
    components: EnhancedSystemComponents,
    context: ConstructionContext
  ): CostCalculation {
    const breakdown: CostBreakdown = {
      chassis: this.calculateChassisCost(context),
      engine: this.calculateEngineCost(components.engine, context),
      structure: this.calculateStructureCost(components.structure, context),
      armor: this.calculateArmorCost(components.armor, context),
      heatSinks: this.calculateHeatSinkCost(components.heatSinks, context),
      gyro: this.calculateGyroCost(components.gyro, context),
      cockpit: this.calculateCockpitCost(components.cockpit, context),
      equipment: 0, // Calculated separately
      mixedTechPenalty: 0
    }

    const modifiers = this.calculateCostModifiers(components, context)
    breakdown.mixedTechPenalty = this.calculateMixedTechPenalty(components, context, breakdown)

    const totalCost = Object.values(breakdown).reduce((sum, cost) => sum + cost, 0)

    return {
      totalCost,
      breakdown,
      modifiers
    }
  }

  private calculateChassisCost(context: ConstructionContext): number {
    // Basic chassis cost formula
    return context.mechTonnage * context.mechTonnage * 50
  }

  private calculateEngineCost(
    engine: EnhancedEngineComponent,
    context: ConstructionContext
  ): number {
    const engineSpec = ENGINE_SPECIFICATIONS[engine.type as EnhancedEngineType]
    const baseCost = engine.rating * engine.rating * 50
    return baseCost * engineSpec.costMultiplier
  }

  private calculateStructureCost(
    structure: EnhancedStructureComponent,
    context: ConstructionContext
  ): number {
    const structureSpec = STRUCTURE_SPECIFICATIONS[structure.type]
    const baseCost = context.mechTonnage * 400
    return baseCost * structureSpec.costMultiplier
  }

  private calculateHeatSinkCost(
    heatSinks: EnhancedHeatSinkComponent,
    context: ConstructionContext
  ): number {
    const heatSinkSpec = HEAT_SINK_SPECIFICATIONS[heatSinks.type as EnhancedHeatSinkType]
    const externalHeatSinks = heatSinks.externalRequired
    const baseCostPerHeatSink = 2000
    return externalHeatSinks * baseCostPerHeatSink * heatSinkSpec.costMultiplier
  }

  private calculateCostModifiers(
    components: EnhancedSystemComponents,
    context: ConstructionContext
  ): CostModifier[] {
    const modifiers: CostModifier[] = []

    // Mixed tech modifiers
    if (context.techBase.startsWith('Mixed')) {
      modifiers.push({
        type: 'mixed_tech',
        description: 'Mixed Technology Penalty',
        multiplier: 1.5,
        applies_to: ['engine', 'structure', 'armor', 'equipment']
      })
    }

    // Era modifiers
    if (context.era && this.isEarlyEra(context.era)) {
      modifiers.push({
        type: 'early_era',
        description: 'Early Era Technology Premium',
        multiplier: 1.25,
        applies_to: ['engine', 'structure', 'armor']
      })
    }

    return modifiers
  }

  private calculateMixedTechPenalty(
    components: EnhancedSystemComponents,
    context: ConstructionContext,
    breakdown: CostBreakdown
  ): number {
    if (!context.techBase.startsWith('Mixed')) {
      return 0
    }

    // Calculate penalty based on non-chassis components
    const penaltyCost = (breakdown.engine + breakdown.structure + breakdown.armor) * 0.5
    return penaltyCost
  }

  private isEarlyEra(era: string): boolean {
    const earlyEras = ['Age of War', 'Star League', 'Succession Wars']
    return earlyEras.includes(era)
  }
}
```

---

## File Structure & Integration

### New Directory Structure

```
battletech-editor-app/
├── utils/
│   ├── criticalSlots/  (existing)
│   ├── constructionRules/  (new)
│   │   ├── ConstructionRulesEngine.ts
│   │   ├── TechBaseRulesManager.ts
│   │   ├── CriticalSlotAllocator.ts
│   │   ├── WeightCalculationEngine.ts
│   │   ├── CostCalculationEngine.ts
│   │   ├── ComponentSpecificationRegistry.ts
│   │   ├── MixedTechRulesEngine.ts
│   │   └── index.ts
│   ├── techBase/  (new)
│   │   ├── specifications/
│   │   │   ├── EngineSpecifications.ts
│   │   │   ├── HeatSinkSpecifications.ts
│   │   │   ├── StructureSpecifications.ts
│   │   │   ├── ArmorSpecifications.ts
│   │   │   └── index.ts
│   │   ├── compatibility/
│   │   │   ├── TechCompatibilityMatrix.ts
│   │   │   ├── EraAvailability.ts
│   │   │   └── MixedTechRules.ts
│   │   └── index.ts
│   └── enhanced/ (new - enhanced versions of existing utilities)
│       ├── EnhancedEngineCalculations.ts
│       ├── EnhancedArmorCalculations.ts
│       └── EnhancedComponentSync.ts
```

---

## Database Schema Enhancements

### Enhanced Equipment Table

```sql
-- Add tech base variant support to existing equipment table
ALTER TABLE equipment ADD COLUMN tech_variant TEXT; -- 'IS', 'Clan', 'Base'
ALTER TABLE equipment ADD COLUMN base_equipment_id INTEGER REFERENCES equipment(id);
ALTER TABLE equipment ADD COLUMN tech_level TEXT CHECK (tech_level IN ('Introductory', 'Standard', 'Advanced', 'Experimental'));
ALTER TABLE equipment ADD COLUMN introduction_year INTEGER;
ALTER TABLE equipment ADD COLUMN extinction_year INTEGER;
ALTER TABLE equipment ADD COLUMN era_availability TEXT; -- JSON array of era restrictions

-- Create equipment variants table for tech-specific specifications
CREATE TABLE IF NOT EXISTS equipment_tech_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    base_equipment_id INTEGER NOT NULL REFERENCES equipment(id),
    tech_base TEXT NOT NULL CHECK (tech_base IN ('Inner Sphere', 'Clan')),
    weight REAL NOT NULL,
    critical_slots INTEGER NOT NULL,
    cost_cbills INTEGER,
    special_rules TEXT, -- JSON array of special rules
    performance_modifiers TEXT, -- JSON object with damage/range/heat modifications
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(base_equipment_id, tech_base)
);

-- Create construction rules table
CREATE TABLE IF NOT EXISTS construction_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_type TEXT NOT NULL, -- 'tech_compatibility', 'era_restriction', 'mixed_tech'
    component_type TEXT NOT NULL, -- 'engine', 'structure', 'armor', 'weapon', etc.
    tech_base TEXT CHECK (tech_base IN ('Inner Sphere', 'Clan', 'Both', 'Mixed')),
    era_start INTEGER,
    era_end INTEGER,
    rule_data TEXT NOT NULL, -- JSON object with rule specifications
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create component specifications table
CREATE TABLE IF NOT EXISTS component_specifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component_id TEXT UNIQUE NOT NULL, -- e.g., 'xl_engine_is', 'clan_xl_engine'
    component_type TEXT NOT NULL,
    tech_base TEXT NOT NULL,
    specification_data TEXT NOT NULL, -- JSON with weight multipliers, slot requirements, etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced indexes
CREATE INDEX IF NOT EXISTS idx_equipment_tech_variant ON equipment(tech_variant);
CREATE INDEX IF NOT EXISTS idx_equipment_base_id ON equipment(base_equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_tech_level ON equipment(tech_level);
CREATE INDEX IF NOT EXISTS idx_construction_rules_type ON construction_rules(rule_type, component_type);
CREATE INDEX IF NOT EXISTS idx_component_specs_type ON component_specifications(component_type, tech_base);
```

### Equipment Variants Data Structure

```sql
-- Example data for equipment variants
INSERT INTO equipment_tech_variants (base_equipment_id, tech_base, weight, critical_slots, cost_cbills, performance_modifiers) VALUES
  -- Large Laser variants
  (1, 'Inner Sphere', 5.0, 2, 100000, '{"damage": 8, "heat": 8, "range": {"short": 5, "medium": 10, "long": 15}}'),
  (1, 'Clan', 4.0, 1, 100000, '{"damage": 8, "heat": 8, "range": {"short": 7, "medium": 14, "long": 21}}'),
  
  -- AC/5 variants
  (2, 'Inner Sphere', 8.0, 4, 125000, '{"damage": 5, "heat": 1, "ammo_per_ton": 20}'),
  (2, 'Clan', 7.0, 3, 125000, '{"damage": 5, "heat": 1, "ammo_per_ton": 20, "range_bonus": 2}');
```

---

## UI Component Enhancements

### Enhanced SystemComponentControls

```typescript
// Update existing SystemComponentControls.tsx
export function EnhancedSystemComponentControls() {
  const { unit, validation, updateConfiguration } = useUnit()
  const [constructionRules] = useConstructionRules()
  const config = unit.getEnhancedConfiguration()
  
  // Tech base dependent options with availability checking
  const getAvailableEngineTypes = useCallback((): ComponentOption[] => {
    return constructionRules.getAvailableComponents('engine', {
      mechTonnage: config.tonnage,
      techBase: config.techBase,
      techLevel: config.techLevel,
      era: config.era,
      allowMixedTech: config.mixedTechRules?.allowMixedTech || false
    })
  }, [config, constructionRules])

  const getAvailableHeatSinkTypes = useCallback((): ComponentOption[] => {
    return constructionRules.getAvailableComponents('heatSink', {
      mechTonnage: config.tonnage,
      techBase: config.techBase,
      techLevel: config.techLevel,
      era: config.era,
      allowMixedTech: config.mixedTechRules?.allowMixedTech || false
    })
  }, [config, constructionRules])

  // Enhanced update with validation
  const updateConfigEnhanced = useCallback((updates: Partial<EnhancedUnitConfiguration>) => {
    try {
      const newConfig = { ...config, ...updates }
      const validationResult = constructionRules.validateConfiguration(newConfig)
      
      if (!validationResult.isValid) {
        // Show validation errors to user
        setValidationErrors(validationResult.errors)
        return
      }

      // Calculate change impact
      const changeImpact = constructionRules.calculateChangeImpact(config, updates)
      
      // Warn user about displaced equipment
      if (changeImpact.slotImpact.displacedEquipment.length > 0) {
        const confirmed = window.confirm(
          `This change will displace ${changeImpact.slotImpact.displacedEquipment.length} pieces of equipment. Continue?`
        )
        if (!confirmed) return
      }

      updateConfiguration(newConfig)
    } catch (error) {
      console.error('Configuration update failed:', error)
      setValidationErrors([error.message])
    }
  }, [config, constructionRules, updateConfiguration])

  return (
    <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
      <h2 className="text-white text-base font-bold mb-3">Enhanced Mech Configuration</h2>
      
      {/* Tech Base Selection */}
      <div className="mb-4 p-3 bg-gray-900 border border-gray-600 rounded">
        <h3 className="text-gray-300 text-sm font-medium mb-2">Technology Base</h3>
        <div className="grid grid-cols-2 gap-2">
          <select 
            value={config.techBase} 
            onChange={(e) => updateConfigEnhanced({ 
              techBase: e.target.value as EnhancedUnitConfiguration['techBase']
            })}
            className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600"
          >
            <option value="Inner Sphere">Inner Sphere</option>
            <option value="Clan">Clan</option>
            <option value="Mixed (IS Chassis)">Mixed (IS Chassis)</option>
            <option value="Mixed (Clan Chassis)">Mixed (Clan Chassis)</option>
          </select>
          
          <select
            value={config.techLevel}
            onChange={(e) => updateConfigEnhanced({ 
              techLevel: e.target.value as EnhancedUnitConfiguration['techLevel']
            })}
            className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600"
          >
            <option value="Introductory">Introductory</option>
            <option value="Standard">Standard</option>
            <option value="Advanced">Advanced</option>
            <option value="Experimental">Experimental</option>
          </select>
        </div>
      </div>

      {/* Era Selection */}
      <div className="mb-4 p-3 bg-gray-900 border border-gray-600 rounded">
        <h3 className="text-gray-300 text-sm font-medium mb-2">Era</h3>
        <select
          value={config.era}
          onChange={(e) => updateConfigEnhanced({ era: e.target.value })}
          className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 w-full"
        >
          <option value="3025">Succession Wars (3025)</option>
          <option value="3050">Clan Invasion (3050)</option>
          <option value="3057">FedCom Civil War (3057)</option>
          <option value="3067">Jihad (3067)</option>
          <option value="3135">Dark Age (3135)</option>
        </select>
      </div>

      {/* Enhanced Engine Selection */}
      <div className="mb-4 p-3 bg-gray-900 border border-gray-600 rounded">
        <h3 className="text-gray-300 text-sm font-medium mb-2">Engine</h3>
        <div className="space-y-2">
          <select 
            value={config.engineType} 
            onChange={(e) => updateConfigEnhanced({ 
              engineType: e.target.value as EnhancedEngineType 
            })}
            className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 w-full"
          >
            {getAvailableEngineTypes().map(option => (
              <option key={option.id} value={option.id} disabled={!option.available}>
                {option.name} {!option.available && '(Not Available)'}
              </option>
            ))}
          </select>
          
          {/* Engine tech base indicator */}
          <div className="text-xs text-gray-400">
            Tech Base: {getEngineTechBase(config.engineType)}
            {config.engineType.includes('XL') && (
              <div className="text-yellow-400 mt-1">
                ⚠ XL Engine: {getXLEngineWarning(config.engineType)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Heat Sink Selection */}
      <div className="mb-4 p-3 bg-gray-900 border border-gray-600 rounded">
        <h3 className="text-gray-300 text-sm font-medium mb-2">Heat Sinks</h3>
        <div className="space-y-2">
          <select 
            value={config.heatSinkType} 
            onChange={(e) => updateConfigEnhanced({ 
              heatSinkType: e.target.value as EnhancedHeatSinkType 
            })}
            className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 w-full"
          >
            {getAvailableHeatSinkTypes().map(option => (
              <option key={option.id} value={option.id} disabled={!option.available}>
                {option.name} ({option.details?.criticalSlots} slots) {!option.available && '(Not Available)'}
              </option>
            ))}
          </select>
          
          <div className="grid grid-cols-3 gap-1 text-xs">
            <div className="text-gray-400">Slots per HS:</div>
            <div className="text-white">{getHeatSinkSlots(config.heatSinkType)}</div>
            <div className="text-gray-400">Tech: {getHeatSinkTechBase(config.heatSinkType)}</div>
          </div>
        </div>
      </div>

      {/* Construction Validation Display */}
      {validation.constructionValidation && !validation.constructionValidation.isValid && (
        <div className="bg-red-900 border border-red-600 p-2 rounded mb-4">
          <h4 className="text-red-200 text-xs font-medium mb-1">Construction Rule Violations:</h4>
          <ul className="text-red-300 text-xs space-y-1">
            {validation.constructionValidation.errors.map((error: string, index: number) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Mixed Tech Rules Display */}
      {config.techBase.startsWith('Mixed') && (
        <div className="bg-yellow-900 border border-yellow-600 p-2 rounded mb-4">
          <h4 className="text-yellow-200 text-xs font-medium mb-1">Mixed Tech Rules:</h4>
          <div className="text-yellow-300 text-xs space-y-1">
            <div>• BV Multiplier: {config.mixedTechRules?.mixedTechPenalties.battleValueMultiplier || 1.0}x</div>
            <div>• Cost Multiplier: {config.mixedTechRules?.mixedTechPenalties.costMultiplier || 1.0}x</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper functions for UI
function getEngineTechBase(engineType: EnhancedEngineType): string {
  const spec = ENGINE_SPECIFICATIONS[engineType]
  return spec?.techBase || 'Unknown'
}

function getXLEngineWarning(engineType: EnhancedEngineType): string {
  if (engineType === 'XL (IS)') {
    return 'Destroyed if either side torso is lost'
  } else if (engineType === 'XL (Clan)') {
    return 'Continues with -2 penalty if one side torso is lost'
  }
  return ''
}

function getHeatSinkSlots(heatSinkType: EnhancedHeatSinkType): number {
  const spec = HEAT_SINK_SPECIFICATIONS[heatSinkType]
  return spec?.criticalSlots || 1
}

function getHeatSinkTechBase(heatSinkType: EnhancedHeatSinkType): string {
  const spec = HEAT_SINK_SPECIFICATIONS[heatSinkType]
  return spec?.techBase || 'Unknown'
}
```

### Enhanced UnitConfiguration Interface

```typescript
// Extend existing UnitConfiguration in UnitCriticalManager.ts
export interface EnhancedUnitConfiguration extends UnitConfiguration {
  // Enhanced tech base support
  techBase: 'Inner Sphere' | 'Clan' | 'Mixed (IS Chassis)' | 'Mixed (Clan Chassis)'
  techLevel: 'Introductory' | 'Standard' | 'Advanced' | 'Experimental'
  era: string
  eraYear: number
  
  // Enhanced engine specification
  engineType: EnhancedEngineType // Replaces existing EngineType
  engineTechBase: 'Inner Sphere' | 'Clan' // Explicit tech base for engine
  
  // Enhanced heat sink specification  
  heatSinkType: EnhancedHeatSinkType // Replaces existing HeatSinkType
  heatSinkTechBase: 'Inner Sphere' | 'Clan'
  
  // Structure and armor with explicit tech variants
  structureType: EnhancedStructureType
  armorType: EnhancedArmorType
  
  // Mixed tech configuration
  mixedTechRules?: {
    allowMixedTech: boolean
    mixedTechPenalties: {
      battleValueMultiplier: number
      costMultiplier: number
    }
  }
  
  // Construction validation cache
  constructionValidation?: ConstructionValidationResult
}
```

---

## Service Layer Integration

### Enhanced Database Service

```typescript
// New service: constructionRulesService.ts
export class ConstructionRulesService {
  private db: Database

  async getComponentSpecifications(
    componentType: string, 
    techBase: string, 
    era: string
  ): Promise<ComponentSpecification[]> {
    const query = `
      SELECT cs.*, cr.rule_data
      FROM component_specifications cs
      LEFT JOIN construction_rules cr ON cr.component_type = cs.component_type 
        AND cr.tech_base IN (cs.tech_base, 'Both')
        AND (cr.era_start <= ? OR cr.era_start IS NULL)
        AND (cr.era_end >= ? OR cr.era_end IS NULL)
      WHERE cs.component_type = ? 
        AND cs.tech_base IN (?, 'Both')
        AND cs.is_active = 1
    `
    
    const results = await this.db.all(query, [era, era, componentType, techBase])
    return results.map(this.mapToComponentSpecification)
  }

  async getEquipmentVariants(
    baseEquipmentId: number,
    techBase: string
  ): Promise<EquipmentTechVariant[]> {
    const query = `
      SELECT etv.*, e.name, e.internal_id
      FROM equipment_tech_variants etv
      JOIN equipment e ON e.id = etv.base_equipment_id
      WHERE etv.base_equipment_id = ? 
        AND etv.tech_base = ?
    `
    
    const results = await this.db.all(query, [baseEquipmentId, techBase])
    return results.map(this.mapToEquipmentVariant)
  }

  async validateTechCompatibility(
    componentType: string,
    componentId: string,
    techBase: string,
    era: string
  ): Promise<TechCompatibilityResult> {
    const query = `
      SELECT rule_data, rule_type
      FROM construction_rules
      WHERE component_type = ?
        AND tech_base IN (?, 'Both')
        AND (era_start <= ? OR era_start IS NULL)
        AND (era_end >= ? OR era_end IS NULL)
        AND is_active = 1
    `
    
    const rules = await this.db.all(query, [componentType, techBase, era, era])
    return this.processCompatibilityRules(rules, componentId)
  }

  private mapToComponentSpecification(row: any): ComponentSpecification {
    return {
      id: row.component_id,
      type: row.component_type,
      techBase: row.tech_base,
      specification: JSON.parse(row.specification_data),
      rules: row.rule_data ? JSON.parse(row.rule_data) : null
    }
  }

  private mapToEquipmentVariant(row: any): EquipmentTechVariant {
    return {
      id: row.id,
      baseEquipmentId: row.base_equipment_id,
      name: row.name,
      internalId: row.internal_id,
      techBase: row.tech_base,
      weight: row.weight,
      criticalSlots: row.critical_slots,
      cost: row.cost_cbills,
      specialRules: row.special_rules ? JSON.parse(row.special_rules) : [],
      performanceModifiers: row.performance_modifiers ? JSON.parse(row.performance_modifiers) : {}
    }
  }

  private processCompatibilityRules(rules: any[], componentId: string): TechCompatibilityResult {
    const result: TechCompatibilityResult = {
      isCompatible: true,
      restrictions: [],
      warnings: [],
      errors: []
    }

    rules.forEach(rule => {
      const ruleData = JSON.parse(rule.rule_data)
      
      switch (rule.rule_type) {
        case 'tech_compatibility':
          if (!this.checkTechCompatibility(componentId, ruleData)) {
            result.isCompatible = false
            result.errors.push(`Component ${componentId} violates tech compatibility rules`)
          }
          break
          
        case 'era_restriction':
          if (!this.checkEraRestriction(componentId, ruleData)) {
            result.warnings.push(`Component ${componentId} may have era restrictions`)
          }
          break
          
        case 'mixed_tech':
          if (ruleData.penaltyMultiplier > 1.0) {
            result.warnings.push(`Mixed tech penalties apply: ${ruleData.penaltyMultiplier}x cost`)
          }
          break
      }
    })

    return result
  }
}

// Enhanced UnitProvider with construction rules
export function EnhancedUnitProvider({ children, initialConfiguration }: UnitProviderProps) {
  const [constructionRulesService] = useState(new ConstructionRulesService())
  const [constructionEngine] = useState(new ConstructionRulesEngine())
  
  // ... existing provider logic with enhanced validation
  
  const contextValue = useMemo(() => ({
    // ... existing context
    constructionRules: constructionEngine,
    constructionService: constructionRulesService,
    validateConfiguration: (config: EnhancedUnitConfiguration) => 
      constructionEngine.validateConstruction(config, getConstructionContext(config)),
    getAvailableComponents: (type: ComponentType) =>
      constructionEngine.getAvailableComponents(type, getConstructionContext(unit.getConfiguration())),
  }), [/* dependencies */])
  
  return (
    <UnitContext.Provider value={contextValue}>
      {children}
    </UnitContext.Provider>
  )
}
```

### Enhanced UnitCriticalManager Integration

```typescript
// Extend existing UnitCriticalManager class
export class EnhancedUnitCriticalManager extends UnitCriticalManager {
  private constructionEngine: ConstructionRulesEngine
  private techBaseManager: TechBaseRulesManager

  constructor(configuration: EnhancedUnitConfiguration) {
    // Convert enhanced config to legacy format for parent constructor
    const legacyConfig = this.convertToLegacyConfig(configuration)
    super(legacyConfig)
    
    this.constructionEngine = new ConstructionRulesEngine()
    this.techBaseManager = new TechBaseRulesManager()
    
    // Initialize with enhanced configuration
    this.enhancedConfiguration = configuration
    this.validateAndInitialize()
  }

  /**
   * Enhanced configuration update with construction rules validation
   */
  updateConfigurationEnhanced(newConfiguration: EnhancedUnitConfiguration): void {
    const context: ConstructionContext = {
      mechTonnage: newConfiguration.tonnage,
      techBase: newConfiguration.techBase,
      techLevel: newConfiguration.techLevel,
      era: newConfiguration.era,
      allowMixedTech: newConfiguration.mixedTechRules?.allowMixedTech || false
    }

    // Validate configuration with construction rules
    const validationResult = this.constructionEngine.validateConstruction(
      this.convertConfigToComponents(newConfiguration), 
      context
    )

    if (!validationResult.isValid) {
      throw new ConstructionValidationError(
        'Configuration violates construction rules', 
        validationResult.errors
      )
    }

    // Calculate change impact
    const changeImpact = this.constructionEngine.calculateChangeImpact(
      this.convertConfigToComponents(this.enhancedConfiguration),
      this.calculateConfigChange(this.enhancedConfiguration, newConfiguration),
      context
    )

    // Handle equipment displacement if necessary
    if (changeImpact.slotImpact.displacedEquipment.length > 0) {
      this.handleEquipmentDisplacement(changeImpact.slotImpact.displacedEquipment)
    }

    // Update configuration and recalculate system components
    this.enhancedConfiguration = newConfiguration
    this.recalculateSystemComponents()
    
    // Update parent class configuration
    super.updateConfiguration(this.convertToLegacyConfig(newConfiguration))
  }

  /**
   * Get available component options based on current tech base
   */
  getAvailableEngineTypes(): ComponentOption[] {
    const context = this.getConstructionContext()
    return this.constructionEngine.getAvailableComponents('engine', context)
  }

  getAvailableHeatSinkTypes(): ComponentOption[] {
    const context = this.getConstructionContext()
    return this.constructionEngine.getAvailableComponents('heatSink', context)
  }

  /**
   * Validate equipment compatibility with current configuration
   */
  validateEquipmentCompatibility(equipment: EnhancedEquipmentObject): CompatibilityResult {
    const context = this.getConstructionContext()
    return this.techBaseManager.validateEquipmentCompatibility(equipment, context)
  }

  private getConstructionContext(): ConstructionContext {
    return {
      mechTonnage: this.enhancedConfiguration.tonnage,
      techBase: this.enhancedConfiguration.techBase,
      techLevel: this.enhancedConfiguration.techLevel,
      era: this.enhancedConfiguration.era,
      allowMixedTech: this.enhancedConfiguration.mixedTechRules?.allowMixedTech || false
    }
  }

  private handleEquipmentDisplacement(displacedEquipment: EquipmentAllocation[]): void {
    // Enhanced displacement handling with tech base validation
    displacedEquipment.forEach(equipment => {
      const compatibility = this.validateEquipmentCompatibility(equipment.equipmentData)
      if (!compatibility.isCompatible) {
        // Equipment is no longer compatible - mark for removal or conversion
        this.flagIncompatibleEquipment(equipment, compatibility.issues)
      } else {
        // Equipment is compatible - add to unallocated pool
        this.addUnallocatedEquipment([equipment])
      }
    })
  }

  private convertToLegacyConfig(config: EnhancedUnitConfiguration): UnitConfiguration {
    // Convert enhanced configuration to legacy format for backward compatibility
    return {
      tonnage: config.tonnage,
      unitType: config.unitType,
      techBase: config.techBase.includes('Inner Sphere') ? 'Inner Sphere' : 'Clan',
      walkMP: config.walkMP,
      engineRating: config.engineRating,
      runMP: config.runMP,
      engineType: this.convertEngineType(config.engineType),
      gyroType: config.gyroType,
      structureType: config.structureType,
      armorType: config.armorType,
      heatSinkType: this.convertHeatSinkType(config.heatSinkType),
      totalHeatSinks: config.totalHeatSinks,
      internalHeatSinks: config.internalHeatSinks,
      externalHeatSinks: config.externalHeatSinks,
      mass: config.tonnage
    }
  }

  private convertEngineType(enhancedType: EnhancedEngineType): EngineType {
    // Convert enhanced engine type to legacy format
    if (enhancedType === 'XL (IS)' || enhancedType === 'XL (Clan)') {
      return 'XL'
    }
    return enhancedType as EngineType
  }

  private convertHeatSinkType(enhancedType: EnhancedHeatSinkType): HeatSinkType {
    // Convert enhanced heat sink type to legacy format
    if (enhancedType === 'Double (IS)' || enhancedType === 'Double (Clan)') {
      return 'Double'
    }
    return enhancedType as HeatSinkType
  }
}

export class ConstructionValidationError extends Error {
  constructor(message: string, public violations: string[]) {
    super(message)
    this.name = 'ConstructionValidationError'
  }
}
```

---

## Implementation Strategy

### Phase 1: Core Infrastructure (Weeks 1-2)

1. **Create base directory structure** and interfaces
2. **Implement component specifications** (engines, heat sinks, structure, armor)
3. **Build construction rules engine core** classes
4. **Database schema updates** and migrations
5. **Basic tech base compatibility** validation

### Phase 2: System Component Integration (Weeks 3-4)

1. **Enhanced UnitCriticalManager** implementation
2. **Critical slot allocator** with tech base awareness
3. **Weight and cost calculation** engines
4. **Tech base rules manager** with mixed tech support
5. **Unit tests** for core functionality

### Phase 3: UI Integration (Weeks 5-6)

1. **Enhanced SystemComponentControls** UI component
2. **Tech base selection** and era controls
3. **Construction validation** feedback display
4. **Equipment compatibility** indicators
5. **User experience** improvements

### Phase 4: Equipment Database (Weeks 7-8)

1. **Equipment tech variants** database population
2. **Comprehensive weapon specifications** with IS/Clan differences
3. **Electronics and special equipment** variants
4. **Equipment browser** enhancements
5. **Search and filtering** by tech base

### Phase 5: Advanced Features (Weeks 9-10)

1. **Mixed tech rules** implementation
2. **Era-based availability** restrictions
3. **Battle Value calculations** with tech modifiers
4. **Cost calculations** with tech penalties
5. **Advanced validation** and error handling

### Phase 6: Testing and Optimization (Weeks 11-12)

1. **Comprehensive testing** of all features
2. **Performance optimization** and caching
3. **Documentation** updates
4. **User acceptance testing**
5. **Deployment** and monitoring

### Backward Compatibility Strategy

- **Legacy interface support** - Keep existing interfaces working
- **Gradual migration** - Components can be migrated one at a time
- **Conversion utilities** - Auto-convert legacy configurations
- **Fallback mechanisms** - Default to legacy behavior when enhanced features not available

### Risk Mitigation

- **Incremental development** - Each phase builds on previous work
- **Comprehensive testing** - Unit tests, integration tests, user acceptance tests
- **Feature flags** - Enable/disable enhanced features during development
- **Database migrations** - Safe, reversible schema changes
- **Performance monitoring** - Track system performance during implementation

---

## Conclusion

This comprehensive implementation specification provides a complete roadmap for implementing Inner Sphere vs Clan technology differences and enhanced construction rules in the BattleTech editor. The system is designed to:

1. **Maintain backward compatibility** while adding enhanced features
2. **Provide comprehensive tech base validation** and construction rules
3. **Support mixed technology** configurations with appropriate penalties
4. **Enable era-based technology restrictions** and availability
5. **Calculate accurate weights, costs, and battle values** with tech modifiers
6. **Deliver an enhanced user experience** with intuitive controls and feedback

The modular architecture allows for incremental implementation and testing, reducing risk while ensuring a robust final product. The system extends naturally to support future enhancements such as additional tech bases, new eras, and expanded equipment databases.
