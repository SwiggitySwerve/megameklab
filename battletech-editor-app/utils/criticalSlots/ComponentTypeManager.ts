/**
 * Component Type Manager
 * Handles component type extraction, validation, and utility functions
 * Extracted from UnitCriticalManager.ts for better organization
 */

import { 
  ComponentConfiguration, 
  TechBase, 
  ComponentCategory, 
  createComponentConfiguration,
  migrateStringToComponentConfiguration,
  getComponentTypeNames
} from '../../types/componentConfiguration'
import { StructureType, ArmorType, HeatSinkType } from './UnitCriticalManagerTypes'
import { JumpJetType } from '../jumpJetCalculations'
import { EngineType, GyroType } from './SystemComponentRules'

export class ComponentTypeManager {
  /**
   * Extract type string from ComponentConfiguration or return string as-is
   */
  static extractComponentType(component: ComponentConfiguration | string): string {
    if (typeof component === 'string') {
      return component // Legacy compatibility
    }
    return component.type
  }

  /**
   * Extract tech base from ComponentConfiguration or infer from string
   */
  static extractTechBase(component: ComponentConfiguration | string, fallback: TechBase = 'Inner Sphere'): TechBase {
    if (typeof component === 'string') {
      // Infer tech base from string (legacy compatibility)
      return component.includes('Clan') ? 'Clan' : fallback
    }
    return component.techBase
  }

  /**
   * Get structure type as string
   */
  static getStructureTypeString(structureType: StructureType): string {
    return ComponentTypeManager.extractComponentType(structureType)
  }

  /**
   * Get armor type as string
   */
  static getArmorTypeString(armorType: ArmorType): string {
    return ComponentTypeManager.extractComponentType(armorType)
  }

  /**
   * Get heat sink type as string
   */
  static getHeatSinkTypeString(heatSinkType: HeatSinkType): string {
    return ComponentTypeManager.extractComponentType(heatSinkType)
  }

  /**
   * Get jump jet type as string
   */
  static getJumpJetTypeString(jumpJetType: JumpJetType): string {
    return ComponentTypeManager.extractComponentType(jumpJetType)
  }

  /**
   * Get gyro type as string
   */
  static getGyroTypeString(gyroType: GyroType): string {
    return ComponentTypeManager.extractComponentType(gyroType)
  }

  /**
   * Get engine type as string
   */
  static getEngineTypeString(engineType: EngineType): string {
    return ComponentTypeManager.extractComponentType(engineType)
  }

  /**
   * Validate component type against allowed types
   */
  static validateComponentType(
    componentType: string, 
    allowedTypes: string[], 
    category: ComponentCategory
  ): { isValid: boolean; error?: string } {
    if (!allowedTypes.includes(componentType)) {
      return {
        isValid: false,
        error: `Invalid ${category} type: ${componentType}. Allowed types: ${allowedTypes.join(', ')}`
      }
    }
    return { isValid: true }
  }

  /**
   * Create component configuration from string (legacy support)
   */
  static createFromString(
    category: ComponentCategory,
    type: string
  ): ComponentConfiguration | null {
    return createComponentConfiguration(category, type)
  }

  /**
   * Migrate legacy string component to new format
   */
  static migrateLegacyComponent(
    category: ComponentCategory,
    legacyComponent: string, 
    fallbackTechBase: TechBase = 'Inner Sphere'
  ): ComponentConfiguration {
    return migrateStringToComponentConfiguration(category, legacyComponent, fallbackTechBase)
  }

  /**
   * Get all available component type names for a category and tech base
   */
  static getAvailableTypes(category: ComponentCategory, techBase: TechBase = 'Inner Sphere'): string[] {
    return getComponentTypeNames(category, techBase)
  }

  /**
   * Check if component is Clan technology
   */
  static isClanComponent(component: ComponentConfiguration | string): boolean {
    const techBase = ComponentTypeManager.extractTechBase(component)
    return techBase === 'Clan'
  }

  /**
   * Check if component is Inner Sphere technology
   */
  static isInnerSphereComponent(component: ComponentConfiguration | string): boolean {
    const techBase = ComponentTypeManager.extractTechBase(component)
    return techBase === 'Inner Sphere'
  }

  /**
   * Get component display name
   */
  static getDisplayName(component: ComponentConfiguration | string): string {
    const type = ComponentTypeManager.extractComponentType(component)
    const techBase = ComponentTypeManager.extractTechBase(component)
    
    if (techBase === 'Clan' && !type.includes('Clan')) {
      return `${type} (Clan)`
    }
    
    return type
  }

  /**
   * Compare two components for equality
   */
  static areComponentsEqual(
    component1: ComponentConfiguration | string,
    component2: ComponentConfiguration | string
  ): boolean {
    const type1 = ComponentTypeManager.extractComponentType(component1)
    const type2 = ComponentTypeManager.extractComponentType(component2)
    const techBase1 = ComponentTypeManager.extractTechBase(component1)
    const techBase2 = ComponentTypeManager.extractTechBase(component2)
    
    return type1 === type2 && techBase1 === techBase2
  }
} 