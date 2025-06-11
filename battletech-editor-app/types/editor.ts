import { FullUnit, ArmorLocation, FullEquipment } from './index';

// Core Editor Types
export type EditorTab = 'structure' | 'equipment' | 'criticals' | 'fluff' | 'quirks' | 'preview';

export interface ValidationError {
  id: string;
  category: 'error' | 'warning';
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
  };
}

// Armor Types
export interface ArmorType {
  id: string;
  name: string;
  pointsPerTon: number;
  criticalSlots: number;
  techLevel: number;
  isClan: boolean;
  isInner: boolean;
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
  // Allow dynamic string indexing
  [key: string]: string | undefined;
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
    techLevel: 1,
    isClan: false,
    isInner: true,
  },
  {
    id: 'ferro_fibrous',
    name: 'Ferro-Fibrous',
    pointsPerTon: 17.6,
    criticalSlots: 14,
    techLevel: 2,
    isClan: false,
    isInner: true,
  },
  {
    id: 'ferro_fibrous_clan',
    name: 'Ferro-Fibrous (Clan)',
    pointsPerTon: 17.6,
    criticalSlots: 7,
    techLevel: 2,
    isClan: true,
    isInner: false,
  },
  {
    id: 'stealth',
    name: 'Stealth',
    pointsPerTon: 16,
    criticalSlots: 12,
    techLevel: 3,
    isClan: false,
    isInner: true,
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
