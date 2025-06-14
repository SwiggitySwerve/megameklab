/**
 * Critical Slots Object-Based Data Model
 * A complete object-based system for tracking critical slot allocations
 * NO STRINGS - only objects and references
 */

import { SystemComponents } from './systemComponents';

// Core slot object - never a string
export interface CriticalSlotObject {
  slotIndex: number;
  location: string;
  equipment: EquipmentReference | null;  // null = empty, never a string
  isPartOfMultiSlot: boolean;
  multiSlotGroupId?: string;
  multiSlotIndex?: number;  // 0 = first slot, 1 = second, etc.
  slotType: SlotType;
}

export enum SlotType {
  NORMAL = 'normal',
  REAR = 'rear',
  TURRET = 'turret'
}

// Reference to actual equipment
export interface EquipmentReference {
  equipmentId: string;  // UUID reference to equipment in weapons_and_equipment
  equipmentData: EquipmentObject;
  allocatedSlots: number;
  startSlotIndex: number;
  endSlotIndex: number;
}

// Equipment object with all metadata
export interface EquipmentObject {
  id: string;
  name: string;
  type: EquipmentType;
  category: EquipmentCategory;
  requiredSlots: number;
  weight: number;
  isFixed: boolean;
  isRemovable: boolean;
  techBase: 'Inner Sphere' | 'Clan' | 'Both';
  manufacturer?: string;
  model?: string;
  // Weapon-specific
  damage?: number | string;
  heat?: number;
  minRange?: number;
  shortRange?: number;
  mediumRange?: number;
  longRange?: number;
  // Ammo-specific
  ammoType?: string;
  shotsPerTon?: number;
  // Heat sink specific
  dissipation?: number;
  // Additional metadata
  criticalHitModifier?: number;
  explosiveAmmo?: boolean;
  requiresAmmo?: boolean;
  linkedAmmoTypes?: string[];
}

export enum EquipmentType {
  // System Components
  ENGINE = 'engine',
  GYRO = 'gyro',
  COCKPIT = 'cockpit',
  LIFE_SUPPORT = 'life_support',
  SENSORS = 'sensors',
  ACTUATOR = 'actuator',
  
  // Structure & Armor
  ENDO_STEEL = 'endo_steel',
  FERRO_FIBROUS = 'ferro_fibrous',
  
  // Heat Management
  HEAT_SINK = 'heat_sink',
  
  // Weapons
  BALLISTIC = 'ballistic',
  ENERGY = 'energy',
  MISSILE = 'missile',
  PHYSICAL = 'physical',
  
  // Equipment
  AMMO = 'ammo',
  EQUIPMENT = 'equipment',
  ELECTRONICS = 'electronics',
  TARGETING = 'targeting',
  MISCELLANEOUS = 'miscellaneous'
}

export enum EquipmentCategory {
  SYSTEM = 'system',
  WEAPON = 'weapon',
  AMMO = 'ammo',
  EQUIPMENT = 'equipment',
  SPECIAL = 'special'
}

// Location-based allocation map
export interface CriticalAllocationMap {
  [location: string]: CriticalSlotObject[];
}

// Equipment registry entry
export interface EquipmentRegistryEntry {
  equipment: EquipmentObject;
  totalQuantity: number;
  allocatedQuantity: number;
  allocations: Array<{
    location: string;
    startSlot: number;
    endSlot: number;
  }>;
}

// Equipment registry
export interface EquipmentRegistry {
  [equipmentId: string]: EquipmentRegistryEntry;
}

// System component equipment objects
export interface SystemEquipmentSet {
  engine: EquipmentObject;
  gyro: EquipmentObject;
  cockpit: EquipmentObject;
  lifeSupport: EquipmentObject;
  sensors: EquipmentObject;
  actuators: {
    shoulder: EquipmentObject;
    upperArm: EquipmentObject;
    lowerArm?: EquipmentObject;
    hand?: EquipmentObject;
    hip: EquipmentObject;
    upperLeg: EquipmentObject;
    lowerLeg: EquipmentObject;
    foot: EquipmentObject;
  };
  heatSinks?: EquipmentObject[];
  endoSteel?: EquipmentObject;
  ferroFibrous?: EquipmentObject;
}

// Multi-slot group tracking
export interface MultiSlotGroup {
  groupId: string;
  equipmentId: string;
  location: string;
  startIndex: number;
  endIndex: number;
  totalSlots: number;
}

// Slot validation result
export interface SlotValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Drag and drop state
export interface CriticalDragState {
  isDragging: boolean;
  draggedEquipment: EquipmentObject | null;
  sourceLocation?: string;
  sourceSlotIndex?: number;
  hoveredLocation?: string;
  hoveredSlotIndex?: number;
  canDrop: boolean;
  dropPreview: {
    location: string;
    slots: number[];
  } | null;
}

// Location slot configuration
export interface LocationSlotConfig {
  location: string;
  totalSlots: number;
  rearSlots?: number;
  turretSlots?: number;
  fixedEquipment?: Array<{
    equipment: EquipmentObject;
    startSlot: number;
  }>;
}

// Mech location configurations
export const LOCATION_CONFIGS: LocationSlotConfig[] = [
  { location: 'Head', totalSlots: 6 },
  { location: 'Center Torso', totalSlots: 12, rearSlots: 2 },
  { location: 'Left Torso', totalSlots: 12 },
  { location: 'Right Torso', totalSlots: 12 },
  { location: 'Left Arm', totalSlots: 12 },
  { location: 'Right Arm', totalSlots: 12 },
  { location: 'Left Leg', totalSlots: 6 },
  { location: 'Right Leg', totalSlots: 6 }
];

// Helper type for slot operations
export interface SlotOperation {
  type: 'allocate' | 'remove' | 'move';
  location: string;
  slotIndex: number;
  equipment?: EquipmentObject;
  targetLocation?: string;
  targetSlotIndex?: number;
}

// Slot change event
export interface SlotChangeEvent {
  operation: SlotOperation;
  previousState: CriticalSlotObject | null;
  newState: CriticalSlotObject | null;
  affectedSlots: number[];
  timestamp: Date;
}

// Critical slot state for UI
export interface CriticalSlotUIState {
  allocations: CriticalAllocationMap;
  registry: EquipmentRegistry;
  dragState: CriticalDragState;
  hoveredSlot: {
    location: string;
    index: number;
  } | null;
  selectedSlots: Array<{
    location: string;
    index: number;
  }>;
  validation: SlotValidationResult;
}
