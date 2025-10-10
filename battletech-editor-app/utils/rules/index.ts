/**
 * Rules Module Exports
 * Centralized exports for all rules-related functionality
 */

// Main rules providers
export { RulesDataProvider } from './RulesDataProvider';
export { EquipmentRulesProvider } from './EquipmentRulesProvider';

// Type exports from RulesDataProvider
export type {
  TechBase,
  EngineType,
  GyroType,
  HeatSinkType,
  StructureType,
  ArmorType,
  CockpitType,
  ComponentOption,
  ConstructionContext,
  ComponentCompatibilityResult
} from './RulesDataProvider';

// Type exports from EquipmentRulesProvider
export type {
  EquipmentVariant,
  EquipmentFilterCriteria,
  EquipmentCompatibilityResult,
  EquipmentLocationRestrictions,
  EquipmentUpgradePath
} from './EquipmentRulesProvider';
