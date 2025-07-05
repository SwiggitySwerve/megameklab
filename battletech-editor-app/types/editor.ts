import { FullUnit, ArmorLocation, FullEquipment } from './index';
import { SystemComponents, CriticalAllocationMap } from './systemComponents';

// Core Editor Types
export type EditorTab = 'structure' | 'equipment' | 'criticals' | 'fluff' | 'quirks' | 'preview';

export interface ValidationError {
  id: string;
  category: 'error' | 'warning' | 'info';
  message: string;
  location?: string;
  field?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// Editable Unit Interface
export interface EditableUnit extends FullUnit {
  // System components (engine, gyro, cockpit, etc.)
  systemComponents?: SystemComponents;
  
  // Critical allocations (unified source of truth)
  criticalAllocations?: CriticalAllocationMap;
  
  // Armor allocation per location
  armorAllocation: {
    [location: string]: {
      front: number;
      rear?: number;
      maxArmor: number;
      type: ArmorType;
    };
  };
  
  // Equipment placements
  equipmentPlacements: EquipmentPlacement[];
  
  // Critical slot assignments
  criticalSlots: CriticalSlotAssignment[];
  
  // Fluff content
  fluffData: FluffContent;
  
  // Selected quirks
  selectedQuirks: Quirk[];
  
  // Validation state
  validationState: ValidationResult;
  
  // Editor metadata
  editorMetadata: {
    lastModified: Date;
    isDirty: boolean;
    version: string;
    isCustom?: boolean;
    originalUnit?: string;
    customNotes?: string;
  };
  
  // LAM configuration (for Land-Air Mechs)
  lamConfiguration?: {
    currentMode: 'BattleMech' | 'AirMech' | 'Fighter';
    conversionEquipmentDamaged: boolean;
    currentFuel: number;
    maxFuel: number;
    lastTransformation?: number;
  };
  
  // Pilot data
  pilot?: {
    name?: string;
    pilotingSkill: number;
    gunnerySkill: number;
  };
  
  // QuadVee configuration
  quadVeeConfiguration?: {
    currentMode: 'Mech' | 'Vehicle';
    conversionEquipmentDamaged: boolean;
    lastTransformation?: number;
  };
  
  // Current game state (for transformation checks)
  currentMovementPoints?: number;
  currentTerrain?: string;
  
  // ProtoMech configuration
  protoMechScale?: number; // 2-9 tons
  maxCriticalSlots?: number;
  
  // Battle Armor mounting
  mountedBattleArmor?: Array<{
    id: string;
    name: string;
    squad: string;
    troopers: number;
    location: string;
    isOmniMount: boolean;
  }>;
  hasOmniMounts?: boolean;
  
  // Unallocated equipment (not yet placed in critical slots)
  unallocatedEquipment?: FullEquipment[];
}

// Armor Types
export interface ArmorType {
  id: string;
  name: string;
  pointsPerTon: number;
  criticalSlots: number;
  techLevel: string;
  techBase?: 'Inner Sphere' | 'Clan' | 'Both';
  isClan: boolean;
  isInner: boolean;
  description?: string;
  weightMultiplier?: number;
}

// Equipment Placement
export interface EquipmentPlacement {
  id: string;
  equipment: FullEquipment;
  location: string;
  criticalSlots: number[];
  isRear?: boolean;
  isTurret?: boolean;
}

// Critical Slot Assignment
export interface CriticalSlotAssignment {
  location: string;
  slotIndex: number;
  equipment?: FullEquipment;
  systemType?: 'engine' | 'gyro' | 'cockpit' | 'lifesupport' | 'sensors' | 'actuator';
  isFixed: boolean;
  isEmpty: boolean;
}

// Quirks
export interface Quirk {
  id: string;
  name: string;
  category: 'positive' | 'negative' | 'equipment';
  cost: number;
  description: string;
  restrictions?: string[];
  incompatibleWith?: string[];
}

// Fluff Content
export interface FluffContent {
  overview?: string;
  capabilities?: string;
  deployment?: string;
  history?: string;
  variants?: string;
  notable_pilots?: string;
  manufacturer?: string;
  primaryFactory?: string;
  communicationsSystem?: string;
  targetingTracking?: string;
  notes?: string;
  use?: string; // For spacecraft
  length?: string;
  width?: string; 
  height?: string;
  fluffImage?: string; // Base64 encoded
  systemComponents?: SystemComponent[];
}

// New interfaces for implementation
export interface UnitFluff extends FluffContent {
  // Extends FluffContent with additional structure
}

export interface SystemComponent {
  system: SystemType;
  manufacturer: string;
  model: string;
}

export enum SystemType {
  ENGINE = 'ENGINE',
  ARMOR = 'ARMOR',
  COMMUNICATIONS = 'COMMUNICATIONS',
  TARGETING = 'TARGETING',
  JUMPJET = 'JUMPJET',
  MYOMER = 'MYOMER'
}

export interface UnitQuirks {
  general: QuirkSelection[];
  weapons: WeaponQuirks[];
}

export interface QuirkSelection {
  id: string;
  name: string;
  category: string;
  enabled: boolean;
  disallowedReason?: string;
}

export interface WeaponQuirks {
  weaponId: string;
  weaponName: string;
  location: string;
  quirks: QuirkSelection[];
}

export interface CriticalAllocation {
  location: string;
  slot: number;
  equipmentId: string;
  equipment?: FullEquipment;
  isFixed?: boolean;
}

export interface ArmorAllocation {
  location: string;
  front: number;
  rear?: number;
  armorType?: string; // For patchwork
}

// Editor State
export interface UnitEditorState {
  unit: EditableUnit;
  activeTab: EditorTab;
  validationErrors: ValidationError[];
  isDirty: boolean;
  autoSave: boolean;
  isLoading: boolean;
  lastSaved?: Date;
}

// Component Props
export interface EditorComponentProps {
  unit: EditableUnit;
  onUnitChange: (updates: Partial<EditableUnit>) => void;
  validationErrors?: ValidationError[];
  readOnly?: boolean;
  compact?: boolean;
}

// Armor Allocation Props
export interface ArmorAllocationProps extends EditorComponentProps {
  showRearArmor?: boolean;
  allowAutoAllocation?: boolean;
  mechType?: 'Biped' | 'Quad' | 'LAM' | 'Tripod';
}

// Location Armor Data
export interface LocationArmor {
  location: string;
  front: number;
  rear: number;
  maxFront: number;
  maxRear: number;
  armorType: ArmorType;
}

// Equipment Filters
export interface EquipmentFilters {
  category?: string[];
  techLevel?: number[];
  weight?: { min?: number; max?: number };
  criticals?: { min?: number; max?: number };
  searchTerm?: string;
  showUnavailable?: boolean;
}

// Validation Rules
export interface ValidationRule {
  name: string;
  category: 'warning' | 'error';
  validator: (unit: EditableUnit) => boolean;
  message: string;
  field?: string;
}

// Auto-allocation Settings
export interface AutoAllocationSettings {
  headArmorMultiplier: number;
  rearArmorPercentage: number;
  prioritizeSymmetry: boolean;
  minimumHeadArmor: number;
}

// Equipment Database Entry
export interface EquipmentDatabaseEntry extends FullEquipment {
  availability: {
    techLevel: number;
    year: number;
    faction: string[];
  };
  restrictions: string[];
  variants: string[];
}

// Critical Slot Layout
export interface CriticalSlotLayout {
  location: string;
  slots: CriticalSlot[];
  maxSlots: number;
  hasRear: boolean;
}

export interface CriticalSlot {
  index: number;
  equipment?: FullEquipment;
  systemType?: string;
  isFixed: boolean;
  isEmpty: boolean;
  isDestroyed?: boolean;
}

// Mech Locations
export const MECH_LOCATIONS = {
  HEAD: 'Head',
  LEFT_ARM: 'Left Arm',
  RIGHT_ARM: 'Right Arm',
  LEFT_TORSO: 'Left Torso',
  CENTER_TORSO: 'Center Torso',
  RIGHT_TORSO: 'Right Torso',
  LEFT_LEG: 'Left Leg',
  RIGHT_LEG: 'Right Leg',
  CENTER_LEG: 'Center Leg', // For tripods
} as const;

export type MechLocation = typeof MECH_LOCATIONS[keyof typeof MECH_LOCATIONS];

// Standard Armor Types
export const ARMOR_TYPES: ArmorType[] = [
  {
    id: 'standard',
    name: 'Standard',
    pointsPerTon: 16,
    criticalSlots: 0,
    techLevel: 'Introductory',
    techBase: 'Both',
    isClan: false,
    isInner: true,
    description: 'Standard armor provides basic protection at 16 points per ton.',
  },
  {
    id: 'ferro_fibrous',
    name: 'Ferro-Fibrous',
    pointsPerTon: 17.92,
    criticalSlots: 14,
    techLevel: 'Standard',
    techBase: 'Inner Sphere',
    isClan: false,
    isInner: true,
    description: 'Ferro-Fibrous armor provides 17.92 points per ton but requires 14 critical slots.',
  },
  {
    id: 'ferro_fibrous_clan',
    name: 'Ferro-Fibrous (Clan)',
    pointsPerTon: 17.92,
    criticalSlots: 7,
    techLevel: 'Standard',
    techBase: 'Clan',
    isClan: true,
    isInner: false,
    description: 'Clan Ferro-Fibrous armor provides 17.92 points per ton but only requires 7 critical slots.',
  },
  {
    id: 'stealth',
    name: 'Stealth',
    pointsPerTon: 16,
    criticalSlots: 12,
    techLevel: 'Advanced',
    techBase: 'Inner Sphere',
    isClan: false,
    isInner: true,
    description: 'Stealth armor incorporates ECM capabilities but requires Guardian ECM and 12 critical slots.',
  },
  {
    id: 'light_ferro_fibrous',
    name: 'Light Ferro-Fibrous',
    pointsPerTon: 16.8,
    criticalSlots: 7,
    techLevel: 'Standard',
    techBase: 'Inner Sphere',
    isClan: false,
    isInner: true,
    description: 'Light Ferro-Fibrous armor provides 16.8 points per ton with fewer critical slots than standard FF.',
  },
  {
    id: 'heavy_ferro_fibrous',
    name: 'Heavy Ferro-Fibrous',
    pointsPerTon: 19.2,
    criticalSlots: 21,
    techLevel: 'Advanced',
    techBase: 'Inner Sphere',
    isClan: false,
    isInner: true,
    description: 'Heavy Ferro-Fibrous armor provides 19.2 points per ton but requires 21 critical slots.',
  },
  {
    id: 'ferro_lamellor',
    name: 'Ferro-Lamellor',
    pointsPerTon: 20.48,
    criticalSlots: 12,
    techLevel: 'Experimental',
    techBase: 'Clan',
    isClan: true,
    isInner: false,
    description: 'Ferro-Lamellor armor provides 28% more protection and reduced critical damage.',
  },
  {
    id: 'hardened',
    name: 'Hardened',
    pointsPerTon: 8,
    criticalSlots: 0,
    techLevel: 'Advanced',
    techBase: 'Both',
    isClan: false,
    isInner: true,
    description: 'Hardened armor halves damage but provides only 8 points per ton.',
  },
  {
    id: 'reactive',
    name: 'Reactive',
    pointsPerTon: 16,
    criticalSlots: 14,
    techLevel: 'Advanced',
    techBase: 'Inner Sphere',
    isClan: false,
    isInner: true,
    description: 'Reactive armor provides enhanced protection against missiles and physical attacks.',
  },
  {
    id: 'reflective',
    name: 'Reflective',
    pointsPerTon: 16,
    criticalSlots: 10,
    techLevel: 'Advanced',
    techBase: 'Inner Sphere',
    isClan: false,
    isInner: true,
    description: 'Reflective armor provides enhanced protection against energy weapons.',
  },
];

// Standard Validation Rules
export const VALIDATION_RULES: ValidationRule[] = [
  {
    name: 'armorOverAllocation',
    category: 'error',
    validator: (unit) => !hasArmorOverAllocation(unit),
    message: 'Armor points exceed maximum for location',
    field: 'armor',
  },
  {
    name: 'weightOverLimit',
    category: 'error',
    validator: (unit) => getTotalWeight(unit) <= unit.mass,
    message: 'Unit weight exceeds tonnage limit',
    field: 'weight',
  },
  {
    name: 'criticalSlotsOverLimit',
    category: 'error',
    validator: (unit) => !hasCriticalSlotOverflow(unit),
    message: 'Critical slots exceed available space',
    field: 'criticals',
  },
  {
    name: 'heatEfficiencyWarning',
    category: 'warning',
    validator: (unit) => getHeatEfficiency(unit) >= 1.0,
    message: 'Heat generation exceeds dissipation capacity',
    field: 'heat',
  },
];

// Helper function declarations (to be implemented)
declare function hasArmorOverAllocation(unit: EditableUnit): boolean;
declare function getTotalWeight(unit: EditableUnit): number;
declare function hasCriticalSlotOverflow(unit: EditableUnit): boolean;
declare function getHeatEfficiency(unit: EditableUnit): number;
