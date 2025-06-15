/**
 * Enhanced Drag and Drop types for V2 Critical Slot System
 * Extends the basic types with object-based equipment data
 */

import { EquipmentCategory } from '../../../types/criticalSlots';

export enum DragItemType {
  EQUIPMENT = 'equipment',
  WEAPON = 'weapon',
  AMMO = 'ammo',
  SYSTEM = 'system'
}

export interface DraggedEquipmentV2 {
  type: DragItemType;
  equipmentId: string;
  name: string;
  weight: number;
  criticalSlots: number;
  category?: EquipmentCategory;
  techBase?: string;
  damage?: number | string;
  heat?: number;
  location?: string; // Current location if already placed
  isOmniPod?: boolean;
  rearFacing?: boolean;
  turretMounted?: boolean;
  // For moving from critical slot
  isFromCriticalSlot?: boolean;
  sourceLocation?: string;
  sourceSlotIndex?: number;
}
