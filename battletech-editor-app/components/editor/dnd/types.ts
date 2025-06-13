// Drag and Drop types for equipment management

export enum DragItemType {
  EQUIPMENT = 'equipment',
  WEAPON = 'weapon',
  AMMO = 'ammo',
  SYSTEM = 'system'
}

export interface DraggedEquipment {
  type: DragItemType;
  equipmentId: string;
  name: string;
  weight: number;
  criticalSlots: number;
  location?: string; // Current location if already placed
  isOmniPod?: boolean;
  rearFacing?: boolean;
  turretMounted?: boolean;
}

export interface DropResult {
  location: string;
  slotIndex: number;
  accepted: boolean;
}

export interface CriticalSlotDropZone {
  location: string;
  slotIndex: number;
  canAccept: (item: DraggedEquipment) => boolean;
  onDrop: (item: DraggedEquipment) => void;
}
