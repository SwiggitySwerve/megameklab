// Centralized utility for filtering available component options based on unit configuration
import { ArmorType, ARMOR_TYPES } from './armorTypes';
import { EngineType, StructureType, HeatSinkType } from '../types/systemComponents';
import { UnitConfiguration } from './criticalSlots/UnitCriticalManagerTypes';
import { ComponentConfiguration, TechBase } from '../types/componentConfiguration';
// TODO: Import ENGINE_TYPES and STRUCTURE_TYPES from their actual locations if available

// Helper function to create ComponentConfiguration objects
function createComponentConfig(type: string, techBase: TechBase): ComponentConfiguration {
  return { type, techBase };
}

// Example: filter armor types
export function getAvailableArmorTypes(config: UnitConfiguration): ComponentConfiguration[] {
  const techBase = config.techBase || 'Inner Sphere';
  const rulesLevel = (config as any).rulesLevel || 'Standard';
  // Optionally filter by tech progression, rules level, etc.
  return ARMOR_TYPES
    .filter(type => type.techBase === techBase || type.techBase === 'Both')
    .map(type => createComponentConfig(type.name, techBase));
}

// TODO: Implement and use STRUCTURE_TYPES array if available
export function getAvailableStructureTypes(config: UnitConfiguration): ComponentConfiguration[] {
  const techBase = config.techBase || 'Inner Sphere';
  // Placeholder: return all possible structure types for now
  const structureTypes = [
    'Standard',
    'Endo Steel',
    'Endo Steel (Clan)',
    'Composite',
    'Reinforced',
    'Industrial',
  ];
  
  return structureTypes.map(type => createComponentConfig(type, techBase));
}

// TODO: Implement and use ENGINE_TYPES array if available
export function getAvailableEngineTypes(config: UnitConfiguration): ComponentConfiguration[] {
  const techBase = config.techBase || 'Inner Sphere';
  // Placeholder: return all possible engine types for now
  const engineTypes = [
    'Standard',
    'XL (IS)',
    'XL (Clan)',
    'Light',
    'XXL',
    'Compact',
    'ICE',
    'Fuel Cell',
  ];
  
  return engineTypes.map(type => createComponentConfig(type, techBase));
}

// TODO: Implement and use HEAT_SINK_TYPES array if available
export function getAvailableHeatSinkTypes(config: UnitConfiguration): ComponentConfiguration[] {
  const techBase = config.techBase || 'Inner Sphere';
  // Placeholder: return all possible heat sink types for now
  const heatSinkTypes = [
    'Single',
    'Double',
    'Double (Clan)',
    'Compact',
    'Laser',
  ];
  
  return heatSinkTypes.map(type => createComponentConfig(type, techBase));
}

// Legacy functions for backward compatibility (return strings)
export function getAvailableArmorTypeStrings(config: UnitConfiguration): string[] {
  const techBase = config.techBase || 'Inner Sphere';
  return ARMOR_TYPES
    .filter(type => type.techBase === techBase || type.techBase === 'Both')
    .map(type => type.name);
}

export function getAvailableStructureTypeStrings(config: UnitConfiguration): string[] {
  const techBase = config.techBase || 'Inner Sphere';
  return [
    'Standard',
    'Endo Steel',
    'Endo Steel (Clan)',
    'Composite',
    'Reinforced',
    'Industrial',
  ];
}

export function getAvailableEngineTypeStrings(config: UnitConfiguration): string[] {
  const techBase = config.techBase || 'Inner Sphere';
  return [
    'Standard',
    'XL (IS)',
    'XL (Clan)',
    'Light',
    'XXL',
    'Compact',
    'ICE',
    'Fuel Cell',
  ];
} 