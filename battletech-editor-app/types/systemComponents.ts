/**
 * System Components Data Model
 * Unified structure for tracking mech system components and their critical slot allocations
 */

export type EngineType = 'Standard' | 'XL' | 'Light' | 'XXL' | 'Compact' | 'ICE' | 'Fuel Cell';
export type GyroType = 'Standard' | 'XL' | 'Compact' | 'Heavy-Duty';
export type CockpitType = 'Standard' | 'Small' | 'Command Console' | 'Torso-Mounted' | 'Interface' | 'Primitive';
export type StructureType = 'Standard' | 'Endo Steel' | 'Endo Steel (Clan)' | 'Composite' | 'Reinforced' | 'Industrial';
export type ArmorType = 'Standard' | 'Ferro-Fibrous' | 'Ferro-Fibrous (Clan)' | 'Light Ferro-Fibrous' | 'Heavy Ferro-Fibrous' | 'Stealth' | 'Reactive' | 'Reflective' | 'Hardened';
export type HeatSinkType = 'Single' | 'Double' | 'Compact' | 'Laser' | 'Double (Clan)';

export interface EngineComponent {
  type: EngineType;
  rating: number;
  manufacturer?: string;
}

export interface GyroComponent {
  type: GyroType;
}

export interface CockpitComponent {
  type: CockpitType;
}

export interface StructureComponent {
  type: StructureType;
}

export interface ArmorComponent {
  type: ArmorType;
  manufacturer?: string;
}

export interface HeatSinkComponent {
  type: HeatSinkType;
  total: number;
  engineIntegrated: number;  // Auto-calculated based on engine rating
  externalRequired: number;   // total - engineIntegrated
}

// Track actuator states for arms
export interface ActuatorState {
  hasLowerArm: boolean;
  hasHand: boolean;
}

export interface SystemComponents {
  engine: EngineComponent;
  gyro: GyroComponent;
  cockpit: CockpitComponent;
  structure: StructureComponent;
  armor: ArmorComponent;
  heatSinks: HeatSinkComponent;
  leftArmActuators?: ActuatorState;
  rightArmActuators?: ActuatorState;
}

// Critical slot allocation types
export type SlotContentType = 'system' | 'equipment' | 'heat-sink' | 'endo-steel' | 'ferro-fibrous' | 'empty';

// Context menu options for critical slots
export interface ContextMenuOption {
  label: string;
  action: 'add' | 'remove';
  component: string;
  isEnabled: () => boolean;
}

export interface CriticalSlot {
  index: number;
  content: string | null;
  contentType: SlotContentType;
  isFixed: boolean;           // Cannot be manually removed
  isConditionallyRemovable?: boolean; // Can be removed via context menu
  isManuallyPlaced: boolean;  // User placed vs auto-allocated
  linkedSlots?: number[];     // For multi-slot items (e.g., AC/20 uses 10 slots)
  equipmentId?: string;       // Reference to equipment item
  contextMenuOptions?: ContextMenuOption[]; // Right-click options
}

export interface LocationCriticalSlots {
  location: string;
  slots: CriticalSlot[];
}

export type CriticalAllocationMap = Record<string, CriticalSlot[]>;

// Fixed system components that cannot be removed
export const FIXED_SYSTEM_COMPONENTS = [
  // Head components
  'Life Support',
  'Sensors',
  'Cockpit',
  'Command Console',
  'Primitive Cockpit',
  'Torso-Mounted Cockpit',
  
  // Arm components (except hand/lower arm)
  'Shoulder',
  'Upper Arm Actuator',
  
  // Leg components  
  'Hip',
  'Upper Leg Actuator',
  'Lower Leg Actuator',
  'Foot Actuator',
  
  // Torso components
  'Engine',
  'Gyro',
];

// Conditionally removable components
export const CONDITIONALLY_REMOVABLE_COMPONENTS = [
  'Lower Arm Actuator',
  'Hand Actuator',
];

// Special components that take slots but aren't equipment
export const SPECIAL_COMPONENTS = [
  'Endo Steel',
  'Endo Steel (Clan)',
  'Ferro-Fibrous',
  'Ferro-Fibrous (Clan)',
  'Light Ferro-Fibrous',
  'Heavy Ferro-Fibrous',
  'Stealth',
  'Reactive',
  'Reflective',
];

// Actuator dependency rules
export const ARM_ACTUATOR_RULES = {
  'Lower Arm Actuator': {
    canRemove: true,
    removesAlso: ['Hand Actuator'],
    slot: 2,
  },
  'Hand Actuator': {
    canRemove: true,
    requires: ['Lower Arm Actuator'],
    slot: 3,
  },
};

// Re-export slot requirements from centralized utilities for backward compatibility
export { ENGINE_SLOT_REQUIREMENTS } from '../utils/engineCalculations';
export { GYRO_SLOT_REQUIREMENTS } from '../utils/gyroCalculations';
export { COCKPIT_SLOT_REQUIREMENTS } from '../utils/cockpitCalculations';
export { STRUCTURE_SLOT_REQUIREMENTS } from '../utils/structureCalculations';
export { ARMOR_SLOT_REQUIREMENTS } from '../utils/armorCalculations';

// Heat sink calculations
export function calculateIntegratedHeatSinks(engineRating: number): number {
  // Fusion engines include 10 heat sinks, +1 per 25 rating above 250
  if (engineRating >= 250) {
    return 10;
  }
  // Smaller engines get fewer integrated heat sinks
  return Math.floor(engineRating / 25);
}

export function calculateExternalHeatSinks(total: number, engineRating: number): number {
  const integrated = calculateIntegratedHeatSinks(engineRating);
  return Math.max(0, total - integrated);
}

// Re-export weight calculation functions from centralized utilities for backward compatibility
export { calculateStructureWeight } from '../utils/structureCalculations';
export { calculateArmorWeight } from '../utils/armorCalculations';
export { calculateGyroWeight } from '../utils/gyroCalculations';

// Note: Engine weight calculation has different parameters in the utility
// So we need a wrapper for backward compatibility
export function calculateEngineWeight(rating: number, type: EngineType): number {
  // Import the function from engineCalculations
  const { calculateEngineWeight: calcEngineWeight } = require('../utils/engineCalculations');
  // The utility expects (rating, mechTonnage, type) but this legacy function doesn't have mechTonnage
  // We'll use a default of 100 tons for backward compatibility
  return calcEngineWeight(rating, 100, type);
}

// Helper to check if a component is fixed
export function isFixedComponent(componentName: string): boolean {
  if (!componentName) return false;
  return FIXED_SYSTEM_COMPONENTS.some(comp => componentName.includes(comp));
}

// Helper to check if a component is conditionally removable
export function isConditionallyRemovable(componentName: string): boolean {
  if (!componentName) return false;
  return CONDITIONALLY_REMOVABLE_COMPONENTS.some(comp => componentName.includes(comp));
}

// Helper to check if a component is a special component
export function isSpecialComponent(componentName: string): boolean {
  if (!componentName) return false;
  return SPECIAL_COMPONENTS.some(comp => componentName.includes(comp));
}

// Helper to determine slot content type
export function getSlotContentType(content: string): SlotContentType {
  if (!content || content === '-Empty-') return 'empty';
  
  if (content.includes('Heat Sink')) return 'heat-sink';
  
  if (isSpecialComponent(content)) {
    if (content.includes('Endo Steel')) return 'endo-steel';
    if (content.includes('Ferro') || content.includes('Stealth') || 
        content.includes('Reactive') || content.includes('Reflective')) {
      return 'ferro-fibrous';
    }
  }
  
  if (isFixedComponent(content) || isConditionallyRemovable(content)) {
    return 'system';
  }
  
  return 'equipment';
}
