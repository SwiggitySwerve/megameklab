/**
 * Equipment Type Definitions for BattleTech Equipment Database
 */

export type TechBase = 'IS' | 'Clan';
export type RulesLevel = 'Introductory' | 'Standard' | 'Advanced' | 'Experimental';
export type EquipmentCategory = 
  | 'Energy Weapons' 
  | 'Ballistic Weapons' 
  | 'Missile Weapons' 
  | 'Equipment' 
  | 'Heat Management' 
  | 'Electronic Warfare'
  | 'Ammunition';

// Categories that appear in equipment browser by default (weapons and ammo)
export const BROWSABLE_CATEGORIES: EquipmentCategory[] = [
  'Energy Weapons',
  'Ballistic Weapons', 
  'Missile Weapons',
  'Ammunition'
];

// Categories that are excluded by default (special equipment)
export const SPECIAL_CATEGORIES: EquipmentCategory[] = [
  'Heat Management',
  'Equipment', 
  'Electronic Warfare'
];

// All categories for filter dropdown
export const ALL_CATEGORIES: EquipmentCategory[] = [
  'Energy Weapons',
  'Ballistic Weapons',
  'Missile Weapons', 
  'Ammunition',
  'Heat Management',
  'Equipment',
  'Electronic Warfare'
];

export interface EquipmentVariant {
  weight: number;         // Weight in tons
  crits: number;         // Critical slots required
  damage?: number | null; // Damage value (null for non-weapons)
  heat?: number | null;   // Heat generated/dissipated (null if not applicable)
  minRange?: number | null; // Minimum range
  rangeShort?: number | null; // Short range
  rangeMedium?: number | null; // Medium range
  rangeLong?: number | null; // Long range
  rangeExtreme?: number | null; // Extreme range
  ammoPerTon?: number | null; // Shots per ton for ammo
  cost?: number | null;   // Cost in C-Bills
  battleValue?: number | null; // Battle Value
}

export interface Equipment {
  id: string;            // Unique identifier
  name: string;          // Display name
  category: EquipmentCategory;
  baseType?: string;     // Base equipment type
  description?: string;  // Equipment description
  requiresAmmo: boolean; // Whether this equipment needs ammunition
  introductionYear: number; // Year introduced
  rulesLevel: RulesLevel; // Rules complexity level
  variants: {
    IS?: EquipmentVariant;   // Inner Sphere variant
    Clan?: EquipmentVariant; // Clan variant
  };
  special?: string[];    // Special rules or abilities
}

export interface EquipmentDatabase {
  energyWeapons: Equipment[];
  ballisticWeapons: Equipment[];
  missileWeapons: Equipment[];
  equipment: Equipment[];
  heatManagement: Equipment[];
  electronicWarfare: Equipment[];
  ammunition: Equipment[];
}

// Helper type for flattened equipment list with tech base
export interface EquipmentVariantFlat {
  id: string;
  name: string;
  category: EquipmentCategory;
  techBase: TechBase;
  weight: number;
  crits: number;
  damage?: number | null;
  heat?: number | null;
  minRange?: number | null;
  rangeShort?: number | null;
  rangeMedium?: number | null;
  rangeLong?: number | null;
  rangeExtreme?: number | null;
  ammoPerTon?: number | null;
  cost?: number | null;
  battleValue?: number | null;
  requiresAmmo: boolean;
  introductionYear: number;
  rulesLevel: RulesLevel;
  baseType?: string;
  description?: string;
  special?: string[];
}
