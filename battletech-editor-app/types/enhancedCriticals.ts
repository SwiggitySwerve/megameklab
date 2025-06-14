/**
 * Enhanced Critical Slot Types
 * Provides comprehensive type definitions for the enhanced critical slot system
 */

// Core slot structure
export interface EnhancedCriticalSlot {
  // Core properties
  index: number;                    // Slot position (0-based)
  content: string | null;           // Equipment name or null for empty
  contentType: 'empty' | 'equipment' | 'system' | 'unhittable';
  
  // Tracking properties
  equipmentId?: string;             // Unique ID for equipment instance
  isFixed: boolean;                 // Cannot be removed
  isManuallyPlaced: boolean;        // Placed by user vs auto-allocated
  
  // For unhittables
  unhittableType?: 'structure' | 'armor' | 'special';
  parentComponent?: string;         // e.g., "Endo Steel", "Ferro-Fibrous Armor"
  
  // Metadata
  lastModified?: Date;              // When slot was last changed
  transactionId?: string;           // Link to change transaction
  multiSlotGroup?: string;          // ID for equipment spanning multiple slots (NOT used for unhittables)
}

export interface EnhancedCriticalAllocationMap {
  [location: string]: EnhancedCriticalSlot[];
}

// Transaction tracking
export interface CriticalSlotTransaction {
  id: string;                       // Unique transaction ID
  timestamp: Date;                  // When the change occurred
  type: 'add' | 'remove' | 'move' | 'clear';
  
  // Change details
  location: string;                 // Target location
  slotIndex: number;               // Target slot index
  slotCount?: number;              // Number of slots affected
  
  // Equipment details
  equipment?: {
    id: string;                   // Equipment instance ID
    name: string;                 // Equipment name
    slots: number;                // Total slots required
  };
  
  // Source details (for moves)
  sourceLocation?: string;
  sourceSlotIndex?: number;
  
  // Rollback data
  previousState?: EnhancedCriticalSlot[];
}

export interface TransactionLog {
  transactions: CriticalSlotTransaction[];
  maxHistory: number;              // Default: 50
  currentIndex: number;            // For undo/redo
}

// Drag state
export interface DragState {
  isDragging: boolean;
  dragStartTime?: Date;
  
  // Dragged item details
  draggedItem: {
    equipmentId: string;
    name: string;
    slots: number;
    weight?: number;
    
    // Source information
    isFromInventory: boolean;      // From equipment list vs critical slot
    sourceLocation?: string;       // If from critical slot
    sourceSlotIndex?: number;      // Starting slot if from critical
  } | null;
  
  // Validation state
  validDropTargets: {
    location: string;
    startIndex: number;
    endIndex: number;
  }[];
}

// Unhittables
export interface UnhittableComponent {
  id: string;                       // Unique ID for this specific slot
  name: string;                     // Component name (e.g., "Endo Steel")
  displayName: string;              // UI display (e.g., "Endo Steel (1/14)")
  unhittableType: 'structure' | 'armor' | 'special';
  parentSystem: string;             // The system requiring these slots
  totalRequired: number;            // Total slots needed for this system
  currentIndex: number;             // Which slot this is (1-based)
  techBase: 'Inner Sphere' | 'Clan';
  slots: 1;                         // ALWAYS 1 - unhittables never group
}

export interface UnhittablesTracker {
  structure: {
    type: string;                   // e.g., "Endo Steel"
    totalSlots: number;             
    allocatedSlots: number;         
    components: UnhittableComponent[];
  };
  armor: {
    type: string;                   // e.g., "Ferro-Fibrous"
    totalSlots: number;
    allocatedSlots: number;
    components: UnhittableComponent[];
  };
  special: {
    systems: Array<{
      name: string;
      totalSlots: number;
      allocatedSlots: number;
      components: UnhittableComponent[];
    }>;
  };
}

// Unhittable system definitions
export interface UnhittableSystemDefinition {
  'Inner Sphere'?: number;
  'Clan'?: number;
  slots?: number;  // For systems that don't vary by tech base
}

export interface UnhittableSystemMap {
  [systemName: string]: UnhittableSystemDefinition;
}

export const UNHITTABLE_SYSTEMS = {
  structure: {
    'Standard': { slots: 0 },
    'Endo Steel': { 'Inner Sphere': 14, 'Clan': 7 },
    'Endo-Composite': { 'Inner Sphere': 7, 'Clan': 4 },
    'Composite': { slots: 0 },
    'Reinforced': { slots: 0 }
  } as UnhittableSystemMap,
  armor: {
    'Standard': { slots: 0 },
    'Ferro-Fibrous': { 'Inner Sphere': 14, 'Clan': 7 },
    'Light Ferro-Fibrous': { 'Inner Sphere': 7, 'Clan': 7 },
    'Heavy Ferro-Fibrous': { 'Inner Sphere': 21, 'Clan': 14 },
    'Stealth': { 'Inner Sphere': 12, 'Clan': 12 },
    'Reactive': { 'Inner Sphere': 14, 'Clan': 7 },
    'Reflective': { 'Inner Sphere': 10, 'Clan': 5 },
    'Ferro-Lamellor': { 'Inner Sphere': 12, 'Clan': 6 },
    'Hardened': { slots: 0 }
  } as UnhittableSystemMap,
  special: {
    'Blue Shield PFD': { slots: 7 },
    'Null Signature System': { slots: 7 },
    'Chameleon LPS': { slots: 6 },
    'CASE II': { slots: 1 } // Per location where installed
  } as UnhittableSystemMap
};

// Location slot counts
export const LOCATION_SLOT_COUNTS: { [key: string]: number } = {
  'Head': 6,
  'Left Arm': 12,
  'Right Arm': 12,
  'Left Torso': 12,
  'Center Torso': 12,
  'Right Torso': 12,
  'Left Leg': 6,
  'Right Leg': 6
};

// Manager interface
export interface ICriticalSlotManager {
  // Read operations
  getSlot(location: string, index: number): EnhancedCriticalSlot | null;
  getLocationSlots(location: string): EnhancedCriticalSlot[];
  isSlotEmpty(location: string, index: number): boolean;
  canAcceptEquipment(location: string, startIndex: number, equipment: { name: string; slots: number }): boolean;
  findEquipment(equipmentId: string): { location: string; startIndex: number; slots: EnhancedCriticalSlot[] } | null;
  
  // Write operations
  addEquipment(location: string, startIndex: number, equipment: {
    id: string;
    name: string;
    slots: number;
    isSystem?: boolean;
    isFixed?: boolean;
  }): boolean;
  removeEquipment(location: string, slotIndex: number): {
    equipment: { id: string; name: string; slots: number };
    affectedSlots: number[];
  } | null;
  moveEquipment(fromLocation: string, fromIndex: number, toLocation: string, toIndex: number): boolean;
  clearLocation(location: string): { id: string; name: string; slots: number }[];
  
  // Unhittables management
  generateUnhittables(type: 'structure' | 'armor', componentType: string, techBase: 'Inner Sphere' | 'Clan'): UnhittableComponent[];
  addUnhittable(location: string, slotIndex: number, unhittable: UnhittableComponent): boolean;
  getUnallocatedUnhittables(): {
    structure: UnhittableComponent[];
    armor: UnhittableComponent[];
    special: UnhittableComponent[];
  };
  validateUnhittablesAllocation(): {
    valid: boolean;
    missing: {
      structure: number;
      armor: number;
      special: Array<{ name: string; missing: number }>;
    };
  };
  
  // Transaction management
  getRecentTransactions(limit?: number): CriticalSlotTransaction[];
  undoLastTransaction(): boolean;
  redoTransaction(): boolean;
  
  // Drag state management
  startDrag(equipment: {
    id: string;
    name: string;
    slots: number;
    weight?: number;
  }, sourceLocation?: string, sourceSlotIndex?: number): void;
  endDrag(success: boolean): void;
  isDragging(): boolean;
  getDraggedItem(): DragState['draggedItem'];
  getValidDropTargets(): DragState['validDropTargets'];
  
  // Export/Import
  exportState(): {
    allocations: EnhancedCriticalAllocationMap;
    transactions: CriticalSlotTransaction[];
  };
  importState(state: {
    allocations: EnhancedCriticalAllocationMap;
    transactions?: CriticalSlotTransaction[];
  }): void;
}
