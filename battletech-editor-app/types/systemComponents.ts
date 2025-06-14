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

export interface SystemComponents {
  engine: EngineComponent;
  gyro: GyroComponent;
  cockpit: CockpitComponent;
  structure: StructureComponent;
  armor: ArmorComponent;
  heatSinks: HeatSinkComponent;
}

// Critical slot allocation types
export type SlotContentType = 'system' | 'equipment' | 'heat-sink' | 'endo-steel' | 'ferro-fibrous' | 'empty';

export interface CriticalSlot {
  index: number;
  content: string | null;
  contentType: SlotContentType;
  isFixed: boolean;           // Cannot be manually removed
  isManuallyPlaced: boolean;  // User placed vs auto-allocated
  linkedSlots?: number[];     // For multi-slot items (e.g., AC/20 uses 10 slots)
  equipmentId?: string;       // Reference to equipment item
}

export interface LocationCriticalSlots {
  location: string;
  slots: CriticalSlot[];
}

export type CriticalAllocationMap = Record<string, CriticalSlot[]>;

// Component slot requirements
export const ENGINE_SLOT_REQUIREMENTS: Record<EngineType, { centerTorso: number; leftTorso: number; rightTorso: number }> = {
  'Standard': { centerTorso: 6, leftTorso: 0, rightTorso: 0 },
  'XL': { centerTorso: 6, leftTorso: 3, rightTorso: 3 },
  'Light': { centerTorso: 6, leftTorso: 2, rightTorso: 2 },
  'XXL': { centerTorso: 6, leftTorso: 6, rightTorso: 6 },
  'Compact': { centerTorso: 3, leftTorso: 0, rightTorso: 0 },
  'ICE': { centerTorso: 6, leftTorso: 0, rightTorso: 0 },
  'Fuel Cell': { centerTorso: 6, leftTorso: 0, rightTorso: 0 },
};

export const GYRO_SLOT_REQUIREMENTS: Record<GyroType, number> = {
  'Standard': 4,
  'Compact': 2,
  'Heavy-Duty': 4,
  'XL': 6,
};

export const COCKPIT_SLOT_REQUIREMENTS: Record<CockpitType, { head: number; centerTorso: number }> = {
  'Standard': { head: 1, centerTorso: 0 },
  'Small': { head: 1, centerTorso: 0 },
  'Command Console': { head: 2, centerTorso: 0 },
  'Torso-Mounted': { head: 0, centerTorso: 1 },
  'Interface': { head: 1, centerTorso: 0 },
  'Primitive': { head: 5, centerTorso: 0 },
};

export const STRUCTURE_SLOT_REQUIREMENTS: Record<StructureType, number> = {
  'Standard': 0,
  'Endo Steel': 14,
  'Endo Steel (Clan)': 7,
  'Composite': 0,
  'Reinforced': 0,
  'Industrial': 0,
};

export const ARMOR_SLOT_REQUIREMENTS: Record<ArmorType, { slots: number; clanSlots?: number }> = {
  'Standard': { slots: 0 },
  'Ferro-Fibrous': { slots: 14, clanSlots: 7 },
  'Ferro-Fibrous (Clan)': { slots: 7 },
  'Light Ferro-Fibrous': { slots: 7 },
  'Heavy Ferro-Fibrous': { slots: 21 },
  'Stealth': { slots: 12 },
  'Reactive': { slots: 14 },
  'Reflective': { slots: 10 },
  'Hardened': { slots: 0 },
};

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

// Weight calculations for components
export function calculateEngineWeight(rating: number, type: EngineType): number {
  // Base engine weight formula
  const baseWeight = (rating * 5) / 1000;
  
  const multipliers: Record<EngineType, number> = {
    'Standard': 1.0,
    'XL': 0.5,
    'Light': 0.75,
    'XXL': 0.33,
    'Compact': 1.5,
    'ICE': 2.0,
    'Fuel Cell': 1.5,
  };
  
  return Math.ceil(baseWeight * multipliers[type] * 2) / 2; // Round to nearest 0.5 ton
}

export function calculateGyroWeight(engineRating: number, type: GyroType): number {
  // Gyro weight is based on engine rating
  const baseWeight = Math.ceil(engineRating / 100);
  
  const multipliers: Record<GyroType, number> = {
    'Standard': 1.0,
    'Compact': 1.5,
    'Heavy-Duty': 2.0,
    'XL': 0.5,
  };
  
  return baseWeight * multipliers[type];
}

export function calculateStructureWeight(mechTonnage: number, type: StructureType): number {
  // Structure weight is 10% of mech tonnage for standard
  const baseWeight = mechTonnage * 0.1;
  
  const multipliers: Record<StructureType, number> = {
    'Standard': 1.0,
    'Endo Steel': 0.5,
    'Endo Steel (Clan)': 0.5,
    'Composite': 0.5,
    'Reinforced': 2.0,
    'Industrial': 1.5,
  };
  
  return Math.ceil(baseWeight * multipliers[type] * 2) / 2; // Round to nearest 0.5 ton
}

export function calculateArmorWeight(armorPoints: number, type: ArmorType): number {
  // 16 points per ton for standard armor
  const pointsPerTon: Record<ArmorType, number> = {
    'Standard': 16,
    'Ferro-Fibrous': 17.92,      // 12% more points
    'Ferro-Fibrous (Clan)': 19.2, // 20% more points
    'Light Ferro-Fibrous': 18.56, // 16% more points
    'Heavy Ferro-Fibrous': 19.2,  // 20% more points
    'Stealth': 16,
    'Reactive': 14.4,             // 10% less points
    'Reflective': 14.4,           // 10% less points
    'Hardened': 8,                // 50% less points
  };
  
  return Math.ceil((armorPoints / pointsPerTon[type]) * 2) / 2; // Round to nearest 0.5 ton
}
