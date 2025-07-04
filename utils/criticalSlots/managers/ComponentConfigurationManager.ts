/**
 * Component Configuration Manager
 * Handles component configuration operations, type extractions, and validation
 */

import { 
  ComponentConfiguration, 
  TechBase, 
  StructureType,
  ArmorType,
  HeatSinkType,
  GyroType
} from '../../../types/componentConfiguration'
import { JumpJetType } from '../../jumpJetCalculations'
import { UnitConfiguration } from '../UnitCriticalManagerTypes'

export class ComponentConfigurationManager {
  private configuration: UnitConfiguration

  constructor(configuration: UnitConfiguration) {
    this.configuration = configuration
  }

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
  getStructureTypeString(): StructureType {
    return ComponentConfigurationManager.extractComponentType(this.configuration.structureType) as StructureType
  }

  /**
   * Get armor type as string
   */
  getArmorTypeString(): ArmorType {
    return ComponentConfigurationManager.extractComponentType(this.configuration.armorType) as ArmorType
  }

  /**
   * Get heat sink type as string
   */
  getHeatSinkTypeString(): HeatSinkType {
    return ComponentConfigurationManager.extractComponentType(this.configuration.heatSinkType) as HeatSinkType
  }

  /**
   * Get jump jet type as string
   */
  getJumpJetTypeString(): JumpJetType {
    return ComponentConfigurationManager.extractComponentType(this.configuration.jumpJetType) as JumpJetType
  }

  /**
   * Get gyro type as string
   */
  getGyroTypeString(): GyroType {
    return ComponentConfigurationManager.extractComponentType(this.configuration.gyroType) as GyroType
  }

  /**
   * Update configuration reference
   */
  updateConfiguration(newConfiguration: UnitConfiguration): void {
    this.configuration = newConfiguration
  }

  /**
   * Get current configuration
   */
  getConfiguration(): UnitConfiguration {
    return this.configuration
  }
}