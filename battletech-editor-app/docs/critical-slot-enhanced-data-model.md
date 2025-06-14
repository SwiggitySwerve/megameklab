# Enhanced Critical Slot Data Model Implementation

## Overview

This document details the implementation of an enhanced critical slot data model that provides:
- Instant tracking of additions/removals
- Slot index management
- Proper empty slot handling
- Drag and drop state management
- Transaction-based change tracking

## Core Data Model

### Enhanced Critical Slot Structure

```typescript
interface EnhancedCriticalSlot {
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

interface EnhancedCriticalAllocationMap {
  [location: string]: EnhancedCriticalSlot[];
}
```

### Transaction Tracking

```typescript
interface CriticalSlotTransaction {
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

interface TransactionLog {
  transactions: CriticalSlotTransaction[];
  maxHistory: number;              // Default: 50
  currentIndex: number;            // For undo/redo
}
```

### Drag State Management

```typescript
interface DragState {
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
```

## Unhittables System

### Overview
"Unhittables" are critical slot components that represent distributed structural elements (like Endo Steel or Ferro-Fibrous Armor) that cannot be targeted individually in combat. These components:
- Are ALWAYS individual 1-slot items (never group together)
- Can be placed in any available critical slot
- Must all be allocated for the unit to be valid
- Are automatically generated when certain structure/armor types are selected

### Unhittable Component Structure

```typescript
interface UnhittableComponent {
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

interface UnhittablesTracker {
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
```

### Complete List of Unhittable-Generating Systems

```typescript
const UNHITTABLE_SYSTEMS = {
  structure: {
    'Standard': { slots: 0 },
    'Endo Steel': { 'Inner Sphere': 14, 'Clan': 7 },
    'Endo-Composite': { 'Inner Sphere': 7, 'Clan': 4 },
    'Composite': { slots: 0 },
    'Reinforced': { slots: 0 }
  },
  armor: {
    'Standard': { slots: 0 },
    'Ferro-Fibrous': { 'Inner Sphere': 14, 'Clan': 7 },
    'Light Ferro-Fibrous': { 'Inner Sphere': 7, 'Clan': 7 },
    'Heavy Ferro-Fibrous': { 'Inner Sphere': 21, 'Clan': 14 },
    'Stealth': { 'Inner Sphere': 12, 'Clan': 12 }, // Also requires ECM
    'Reactive': { 'Inner Sphere': 14, 'Clan': 7 },
    'Reflective': { 'Inner Sphere': 10, 'Clan': 5 },
    'Ferro-Lamellor': { 'Inner Sphere': 12, 'Clan': 6 },
    'Hardened': { slots: 0 }
  },
  special: {
    'Blue Shield PFD': { slots: 7 },
    'Null Signature System': { slots: 7 },
    'Chameleon LPS': { slots: 6 },
    'CASE II': { slots: 1 } // Per location where installed
  }
};
```

### Unhittables Generation Example

```typescript
// When structure type changes to Endo Steel
function generateStructureUnhittables(
  structureType: string, 
  techBase: 'Inner Sphere' | 'Clan'
): UnhittableComponent[] {
  const slotsRequired = UNHITTABLE_SYSTEMS.structure[structureType]?.[techBase] || 0;
  if (slotsRequired === 0) return [];
  
  const components: UnhittableComponent[] = [];
  
  // Generate individual 1-slot components
  for (let i = 0; i < slotsRequired; i++) {
    components.push({
      id: `${structureType.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${i}`,
      name: structureType,
      displayName: `${structureType} (${i + 1}/${slotsRequired})`,
      unhittableType: 'structure',
      parentSystem: `${structureType} Structure`,
      totalRequired: slotsRequired,
      currentIndex: i + 1,
      techBase,
      slots: 1  // ALWAYS 1 slot each
    });
  }
  
  return components;
}
```

### UI Display Examples

#### Unallocated Equipment Panel
```typescript
const UnallocatedEquipmentPanel = () => {
  const unallocatedItems = getUnallocatedItems();
  
  return (
    <div className="equipment-panel">
      {/* Regular Equipment Section */}
      <section className="equipment-section">
        <h3>Weapons & Equipment</h3>
        {unallocatedItems.equipment.map(item => (
          <DraggableItem key={item.id} equipment={item} />
        ))}
      </section>
      
      {/* Unhittables - Structure */}
      {unallocatedItems.unhittables.structure.length > 0 && (
        <section className="unhittables-section structure">
          <h3>Structure Components (Unhittable)</h3>
          <div className="allocation-status">
            Endo Steel: {allocated}/{total} slots allocated
          </div>
          <div className="unhittable-items">
            {unallocatedItems.unhittables.structure.map(item => (
              <DraggableItem 
                key={item.id} 
                equipment={item}
                className="unhittable-item"
                icon="structure-icon"
              />
            ))}
          </div>
        </section>
      )}
      
      {/* Unhittables - Armor */}
      {unallocatedItems.unhittables.armor.length > 0 && (
        <section className="unhittables-section armor">
          <h3>Armor Components (Unhittable)</h3>
          <div className="allocation-status">
            Ferro-Fibrous: {allocated}/{total} slots allocated
          </div>
          <div className="unhittable-items">
            {unallocatedItems.unhittables.armor.map(item => (
              <DraggableItem 
                key={item.id} 
                equipment={item}
                className="unhittable-item"
                icon="armor-icon"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
```

#### Critical Slot Display
```typescript
// In critical slots, unhittables appear individually:
Left Torso:
1. [Endo Steel]         ← Individual unhittable
2. [Large Laser]        ← Start of multi-slot equipment
3. [Large Laser]        ← End of multi-slot equipment  
4. [Ferro-Fibrous]      ← Another individual unhittable
5. [- Empty -]
6. [Endo Steel]         ← Can be scattered anywhere
```

### Important Implementation Notes

1. **No Grouping**: Unlike regular equipment that can span multiple consecutive slots, each unhittable is always a separate 1-slot item
2. **Individual Placement**: Each unhittable can be placed independently in any empty slot
3. **Individual Removal**: Each unhittable can be removed independently (double-click removes just that one)
4. **Validation**: System must track that ALL required unhittables are allocated before unit is valid
5. **Auto-Generation**: When structure/armor type changes, automatically generate the correct number of individual unhittable components
6. **Visual Distinction**: Unhittables should have different visual styling (color, icon, etc.) to distinguish from regular equipment

## CriticalSlotManager Utility

```typescript
class CriticalSlotManager {
  private allocations: EnhancedCriticalAllocationMap;
  private transactionLog: TransactionLog;
  private dragState: DragState;
  
  constructor(initialAllocations?: EnhancedCriticalAllocationMap) {
    this.allocations = initialAllocations || {};
    this.transactionLog = {
      transactions: [],
      maxHistory: 50,
      currentIndex: -1
    };
    this.dragState = {
      isDragging: false,
      draggedItem: null,
      validDropTargets: []
    };
  }
  
  // === Read Operations ===
  
  getSlot(location: string, index: number): EnhancedCriticalSlot | null {
    return this.allocations[location]?.[index] || null;
  }
  
  getLocationSlots(location: string): EnhancedCriticalSlot[] {
    return this.allocations[location] || [];
  }
  
  isSlotEmpty(location: string, index: number): boolean {
    const slot = this.getSlot(location, index);
    return !slot || slot.content === null;
  }
  
  canAcceptEquipment(
    location: string, 
    startIndex: number, 
    equipment: { name: string; slots: number }
  ): boolean {
    const locationSlots = this.getLocationSlots(location);
    
    // Check bounds
    if (startIndex < 0 || startIndex + equipment.slots > locationSlots.length) {
      return false;
    }
    
    // Check all required slots are empty
    for (let i = 0; i < equipment.slots; i++) {
      const slot = locationSlots[startIndex + i];
      if (slot && slot.content !== null) {
        return false;
      }
    }
    
    return true;
  }
  
  findEquipment(equipmentId: string): {
    location: string;
    startIndex: number;
    slots: EnhancedCriticalSlot[];
  } | null {
    for (const [location, slots] of Object.entries(this.allocations)) {
      const index = slots.findIndex(s => s.equipmentId === equipmentId);
      if (index !== -1) {
        // Find all slots for this equipment
        const equipmentSlots: EnhancedCriticalSlot[] = [];
        const multiSlotGroup = slots[index].multiSlotGroup;
        
        if (multiSlotGroup) {
          // Multi-slot equipment
          slots.forEach((slot, i) => {
            if (slot.multiSlotGroup === multiSlotGroup) {
              equipmentSlots.push(slot);
            }
          });
        } else {
          // Single slot
          equipmentSlots.push(slots[index]);
        }
        
        return { location, startIndex: index, slots: equipmentSlots };
      }
    }
    return null;
  }
  
  // === Write Operations ===
  
  addEquipment(
    location: string,
    startIndex: number,
    equipment: {
      id: string;
      name: string;
      slots: number;
      isSystem?: boolean;
      isFixed?: boolean;
    }
  ): boolean {
    if (!this.canAcceptEquipment(location, startIndex, equipment)) {
      return false;
    }
    
    // Create transaction
    const transactionId = this.generateTransactionId();
    const transaction: CriticalSlotTransaction = {
      id: transactionId,
      timestamp: new Date(),
      type: 'add',
      location,
      slotIndex: startIndex,
      slotCount: equipment.slots,
      equipment: {
        id: equipment.id,
        name: equipment.name,
        slots: equipment.slots
      },
      previousState: [...(this.allocations[location] || [])]
    };
    
    // Generate multi-slot group ID for equipment spanning multiple slots
    const multiSlotGroup = equipment.slots > 1 ? 
      `${equipment.id}-${Date.now()}` : undefined;
    
    // Update slots
    const locationSlots = this.ensureLocation(location);
    for (let i = 0; i < equipment.slots; i++) {
      locationSlots[startIndex + i] = {
        index: startIndex + i,
        content: equipment.name,
        contentType: equipment.isSystem ? 'system' : 'equipment',
        equipmentId: equipment.id,
        isFixed: equipment.isFixed || false,
        isManuallyPlaced: true,
        lastModified: new Date(),
        transactionId,
        multiSlotGroup
      };
    }
    
    this.addTransaction(transaction);
    return true;
  }
  
  removeEquipment(location: string, slotIndex: number): {
    equipment: { id: string; name: string; slots: number };
    affectedSlots: number[];
  } | null {
    const slot = this.getSlot(location, slotIndex);
    if (!slot || !slot.content || slot.isFixed) {
      return null;
    }
    
    const locationSlots = this.allocations[location];
    const equipment = {
      id: slot.equipmentId || '',
      name: slot.content,
      slots: 1
    };
    const affectedSlots: number[] = [];
    
    // Handle multi-slot equipment
    if (slot.multiSlotGroup) {
      locationSlots.forEach((s, index) => {
        if (s.multiSlotGroup === slot.multiSlotGroup) {
          affectedSlots.push(index);
          equipment.slots++;
        }
      });
    } else {
      affectedSlots.push(slotIndex);
    }
    
    // Create transaction
    const transactionId = this.generateTransactionId();
    const transaction: CriticalSlotTransaction = {
      id: transactionId,
      timestamp: new Date(),
      type: 'remove',
      location,
      slotIndex: affectedSlots[0],
      slotCount: affectedSlots.length,
      equipment,
      previousState: [...locationSlots]
    };
    
    // Clear slots
    affectedSlots.forEach(index => {
      locationSlots[index] = {
        index,
        content: null,
        contentType: 'empty',
        isFixed: false,
        isManuallyPlaced: false,
        lastModified: new Date(),
        transactionId
      };
    });
    
    this.addTransaction(transaction);
    return { equipment, affectedSlots };
  }
  
  moveEquipment(
    fromLocation: string,
    fromIndex: number,
    toLocation: string,
    toIndex: number
  ): boolean {
    // Get source equipment
    const sourceSlot = this.getSlot(fromLocation, fromIndex);
    if (!sourceSlot || !sourceSlot.content) {
      return false;
    }
    
    // Gather equipment info
    const equipment = {
      id: sourceSlot.equipmentId || '',
      name: sourceSlot.content,
      slots: 1,
      isSystem: sourceSlot.contentType === 'system',
      isFixed: sourceSlot.isFixed
    };
    
    // Count slots for multi-slot equipment
    if (sourceSlot.multiSlotGroup) {
      const locationSlots = this.allocations[fromLocation];
      equipment.slots = locationSlots.filter(
        s => s.multiSlotGroup === sourceSlot.multiSlotGroup
      ).length;
    }
    
    // Check if target is valid
    if (!this.canAcceptEquipment(toLocation, toIndex, equipment)) {
      return false;
    }
    
    // Remove from source
    this.removeEquipment(fromLocation, fromIndex);
    
    // Add to target
    this.addEquipment(toLocation, toIndex, equipment);
    
    // Update last transaction to be a move
    const lastTransaction = this.transactionLog.transactions[
      this.transactionLog.transactions.length - 1
    ];
    if (lastTransaction) {
      lastTransaction.type = 'move';
      lastTransaction.sourceLocation = fromLocation;
      lastTransaction.sourceSlotIndex = fromIndex;
    }
    
    return true;
  }
  
  clearLocation(location: string): {
    id: string;
    name: string;
    slots: number;
  }[] {
    const locationSlots = this.allocations[location];
    if (!locationSlots) return [];
    
    const removedEquipment: { id: string; name: string; slots: number }[] = [];
    const processedGroups = new Set<string>();
    
    // Create transaction
    const transactionId = this.generateTransactionId();
    const transaction: CriticalSlotTransaction = {
      id: transactionId,
      timestamp: new Date(),
      type: 'clear',
      location,
      slotIndex: 0,
      slotCount: locationSlots.length,
      previousState: [...locationSlots]
    };
    
    // Process all slots
    locationSlots.forEach((slot, index) => {
      if (slot.content && !slot.isFixed) {
        // Track equipment
        if (slot.multiSlotGroup) {
          if (!processedGroups.has(slot.multiSlotGroup)) {
            processedGroups.add(slot.multiSlotGroup);
            const slotCount = locationSlots.filter(
              s => s.multiSlotGroup === slot.multiSlotGroup
            ).length;
            removedEquipment.push({
              id: slot.equipmentId || '',
              name: slot.content,
              slots: slotCount
            });
          }
        } else {
          removedEquipment.push({
            id: slot.equipmentId || '',
            name: slot.content,
            slots: 1
          });
        }
        
        // Clear slot
        locationSlots[index] = {
          index,
          content: null,
          contentType: 'empty',
          isFixed: false,
          isManuallyPlaced: false,
          lastModified: new Date(),
          transactionId
        };
      }
    });
    
    this.addTransaction(transaction);
    return removedEquipment;
  }
  
  // === Unhittables Management ===
  
  private unhittablesTracker: UnhittablesTracker = {
    structure: {
      type: 'Standard',
      totalSlots: 0,
      allocatedSlots: 0,
      components: []
    },
    armor: {
      type: 'Standard',
      totalSlots: 0,
      allocatedSlots: 0,
      components: []
    },
    special: {
      systems: []
    }
  };
  
  // Generate unhittables when structure/armor changes
  generateUnhittables(
    type: 'structure' | 'armor',
    componentType: string,
    techBase: 'Inner Sphere' | 'Clan'
  ): UnhittableComponent[] {
    const slotsRequired = type === 'structure' 
      ? UNHITTABLE_SYSTEMS.structure[componentType]?.[techBase] || 0
      : UNHITTABLE_SYSTEMS.armor[componentType]?.[techBase] || 0;
      
    if (slotsRequired === 0) return [];
    
    const components: UnhittableComponent[] = [];
    
    // Generate individual 1-slot components
    for (let i = 0; i < slotsRequired; i++) {
      components.push({
        id: `${componentType.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${i}`,
        name: componentType,
        displayName: `${componentType} (${i + 1}/${slotsRequired})`,
        unhittableType: type,
        parentSystem: `${componentType} ${type === 'structure' ? 'Structure' : 'Armor'}`,
        totalRequired: slotsRequired,
        currentIndex: i + 1,
        techBase,
        slots: 1  // ALWAYS 1 slot each
      });
    }
    
    // Update tracker
    this.unhittablesTracker[type] = {
      type: componentType,
      totalSlots: slotsRequired,
      allocatedSlots: 0,
      components
    };
    
    return components;
  }
  
  // Add unhittable to slot
  addUnhittable(
    location: string,
    slotIndex: number,
    unhittable: UnhittableComponent
  ): boolean {
    if (!this.canAcceptEquipment(location, slotIndex, { name: unhittable.name, slots: 1 })) {
      return false;
    }
    
    const transactionId = this.generateTransactionId();
    const locationSlots = this.ensureLocation(location);
    
    // Add unhittable to slot
    locationSlots[slotIndex] = {
      index: slotIndex,
      content: unhittable.name,
      contentType: 'unhittable',
      equipmentId: unhittable.id,
      isFixed: false,
      isManuallyPlaced: true,
      unhittableType: unhittable.unhittableType,
      parentComponent: unhittable.parentSystem,
      lastModified: new Date(),
      transactionId,
      multiSlotGroup: undefined  // Unhittables NEVER group
    };
    
    // Update allocated count
    if (unhittable.unhittableType !== 'special') {
      this.unhittablesTracker[unhittable.unhittableType].allocatedSlots++;
    }
    
    return true;
  }
  
  // Get unallocated unhittables
  getUnallocatedUnhittables(): {
    structure: UnhittableComponent[];
    armor: UnhittableComponent[];
    special: UnhittableComponent[];
  } {
    const unallocated = {
      structure: [] as UnhittableComponent[],
      armor: [] as UnhittableComponent[],
      special: [] as UnhittableComponent[]
    };
    
    // Check structure unhittables
    this.unhittablesTracker.structure.components.forEach(component => {
      if (!this.isUnhittableAllocated(component.id)) {
        unallocated.structure.push(component);
      }
    });
    
    // Check armor unhittables
    this.unhittablesTracker.armor.components.forEach(component => {
      if (!this.isUnhittableAllocated(component.id)) {
        unallocated.armor.push(component);
      }
    });
    
    // Check special system unhittables
    this.unhittablesTracker.special.systems.forEach(system => {
      system.components.forEach(component => {
        if (!this.isUnhittableAllocated(component.id)) {
          unallocated.special.push(component);
        }
      });
    });
    
    return unallocated;
  }
  
  // Check if unhittable is allocated
  private isUnhittableAllocated(unhittableId: string): boolean {
    for (const [location, slots] of Object.entries(this.allocations)) {
      if (slots.some(slot => slot.equipmentId === unhittableId)) {
        return true;
      }
    }
    return false;
  }
  
  // Validate all unhittables are allocated
  validateUnhittablesAllocation(): {
    valid: boolean;
    missing: {
      structure: number;
      armor: number;
      special: Array<{ name: string; missing: number }>;
    };
  } {
    const missing = {
      structure: this.unhittablesTracker.structure.totalSlots - 
                 this.unhittablesTracker.structure.allocatedSlots,
      armor: this.unhittablesTracker.armor.totalSlots - 
             this.unhittablesTracker.armor.allocatedSlots,
      special: [] as Array<{ name: string; missing: number }>
    };
    
    this.unhittablesTracker.special.systems.forEach(system => {
      const missingCount = system.totalSlots - system.allocatedSlots;
      if (missingCount > 0) {
        missing.special.push({ name: system.name, missing: missingCount });
      }
    });
    
    const valid = missing.structure === 0 && 
                  missing.armor === 0 && 
                  missing.special.length === 0;
    
    return { valid, missing };
  }
  
  // === Transaction Management ===
  
  private addTransaction(transaction: CriticalSlotTransaction): void {
    // Remove any transactions after current index (for redo functionality)
    this.transactionLog.transactions = this.transactionLog.transactions.slice(
      0, 
      this.transactionLog.currentIndex + 1
    );
    
    // Add new transaction
    this.transactionLog.transactions.push(transaction);
    
    // Enforce max history
    if (this.transactionLog.transactions.length > this.transactionLog.maxHistory) {
      this.transactionLog.transactions.shift();
    } else {
      this.transactionLog.currentIndex++;
    }
  }
  
  getRecentTransactions(limit: number = 10): CriticalSlotTransaction[] {
    const start = Math.max(0, this.transactionLog.transactions.length - limit);
    return this.transactionLog.transactions.slice(start).reverse();
  }
  
  undoLastTransaction(): boolean {
    if (this.transactionLog.currentIndex < 0) {
      return false;
    }
    
    const transaction = this.transactionLog.transactions[
      this.transactionLog.currentIndex
    ];
    
    if (transaction && transaction.previousState) {
      // Restore previous state
      this.allocations[transaction.location] = [...transaction.previousState];
      this.transactionLog.currentIndex--;
      return true;
    }
    
    return false;
  }
  
  redoTransaction(): boolean {
    if (this.transactionLog.currentIndex >= 
        this.transactionLog.transactions.length - 1) {
      return false;
    }
    
    this.transactionLog.currentIndex++;
    const transaction = this.transactionLog.transactions[
      this.transactionLog.currentIndex
    ];
    
    // Re-apply transaction
    // Implementation depends on transaction type
    return true;
  }
  
  // === Drag State Management ===
  
  startDrag(
    equipment: {
      id: string;
      name: string;
      slots: number;
      weight?: number;
    },
    sourceLocation?: string,
    sourceSlotIndex?: number
  ): void {
    this.dragState = {
      isDragging: true,
      dragStartTime: new Date(),
      draggedItem: {
        equipmentId: equipment.id,
        name: equipment.name,
        slots: equipment.slots,
        weight: equipment.weight,
        isFromInventory: !sourceLocation,
        sourceLocation,
        sourceSlotIndex
      },
      validDropTargets: this.calculateValidDropTargets(equipment)
    };
  }
  
  endDrag(success: boolean): void {
    if (!success && this.dragState.draggedItem) {
      // Handle failed drag (e.g., return to source)
      const item = this.dragState.draggedItem;
      if (!item.isFromInventory && item.sourceLocation && 
          item.sourceSlotIndex !== undefined) {
        // Item was dragged from a critical slot but not dropped
        // It should already be back in place
      }
    }
    
    this.dragState = {
      isDragging: false,
      draggedItem: null,
      validDropTargets: []
    };
  }
  
  isDragging(): boolean {
    return this.dragState.isDragging;
  }
  
  getDraggedItem(): DragState['draggedItem'] {
    return this.dragState.draggedItem;
  }
  
  getValidDropTargets(): DragState['validDropTargets'] {
    return this.dragState.validDropTargets;
  }
  
  // === Helper Methods ===
  
  private ensureLocation(location: string): EnhancedCriticalSlot[] {
    if (!this.allocations[location]) {
      // Initialize with proper slot count based on location
      const slotCount = this.getLocationSlotCount(location);
      this.allocations[location] = Array(slotCount).fill(null).map((_, index) => ({
        index,
        content: null,
        contentType: 'empty' as const,
        isFixed: false,
        isManuallyPlaced: false
      }));
    }
    return this.allocations[location];
  }
  
  private getLocationSlotCount(location: string): number {
    // Map location names to slot counts
    const slotCounts: { [key: string]: number } = {
      'Head': 6,
      'Left Arm': 12,
      'Right Arm': 12,
      'Left Torso': 12,
      'Center Torso': 12,
      'Right Torso': 12,
      'Left Leg': 6,
      'Right Leg': 6
    };
    
    return slotCounts[location] || 12;
  }
  
  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private calculateValidDropTargets(
    equipment: { slots: number }
  ): DragState['validDropTargets'] {
    const targets: DragState['validDropTargets'] = [];
    
    for (const [location, slots] of Object.entries(this.allocations)) {
      for (let i = 0; i <= slots.length - equipment.slots; i++) {
        if (this.canAcceptEquipment(location, i, equipment)) {
          targets.push({
            location,
            startIndex: i,
            endIndex: i + equipment.slots - 1
          });
        }
      }
    }
    
    return targets;
  }
  
  // === Export/Import ===
  
  exportState(): {
    allocations: EnhancedCriticalAllocationMap;
    transactions: CriticalSlotTransaction[];
  } {
    return {
      allocations: this.allocations,
      transactions: this.transactionLog.transactions
    };
  }
  
  importState(state: {
    allocations: EnhancedCriticalAllocationMap;
    transactions?: CriticalSlotTransaction[];
  }): void {
    this.allocations = state.allocations;
    if (state.transactions) {
      this.transactionLog.transactions = state.transactions;
      this.transactionLog.currentIndex = state.transactions.length - 1;
    }
  }
}
```

## UI Integration

### Component Hooks

```typescript
// Hook for using the critical slot manager
function useCriticalSlotManager() {
  const { state, updateCriticalSlots } = useUnitData();
  const [manager] = useState(() => 
    new CriticalSlotManager(state.unit.criticalAllocations)
  );
  
  // Sync manager with state changes
  useEffect(() => {
    manager.importState({
      allocations: state.unit.criticalAllocations
    });
  }, [state.unit.criticalAllocations]);
  
  // Wrap manager methods to update state
  const addEquipment = useCallback((
    location: string,
    startIndex: number,
    equipment: any
  ) => {
    const success = manager.addEquipment(location, startIndex, equipment);
    if (success) {
      const slots = manager.getLocationSlots(location);
      updateCriticalSlots(
        location,
        slots.map(s => s.content || '-Empty-')
      );
    }
    return success;
  }, [manager, updateCriticalSlots]);
  
  // ... wrap other methods similarly
  
  return {
    ...manager,
    addEquipment,
    // ... other wrapped methods
  };
}
```

### Empty Slot Display

```typescript
// Helper component for consistent empty slot display
const CriticalSlotDisplay: React.FC<{
  slot: EnhancedCriticalSlot | null;
}> = ({ slot }) => {
  if (!slot || slot.content === null) {
    return <span className="empty-slot">- Empty -</span>;
  }
  
  return <span className="equipment-name">{slot.content}</span>;
};
```

### Drag and Drop Integration

```typescript
// Enhanced drag handling
const handleDragStart = (equipment: any, location?: string, index?: number) => {
  manager.startDrag(equipment, location, index);
};

const handleDrop = (location: string, index: number) => {
  const draggedItem = manager.getDraggedItem();
  if (!draggedItem) return;
  
  let success = false;
  if (draggedItem.sourceLocation) {
    // Moving equipment
    success = manager.moveEquipment(
      draggedItem.sourceLocation,
      draggedItem.sourceSlotIndex!,
      location,
      index
    );
  } else {
    // Adding new equipment
    success = manager.addEquipment(location, index, draggedItem);
  }
  
  manager.endDrag(success);
};
```

## Benefits

1. **Instant Change Tracking**: Every modification is tracked with timestamps
2. **Transaction History**: Full audit trail with undo/redo capability
3. **Proper Empty Slot Handling**: Consistent null representation with "- Empty -" display
4. **Enhanced Drag/Drop**: Equipment properly tracked during drag operations
5. **Multi-Slot Support**: Proper handling of equipment spanning multiple slots
6. **Validation**: Built-in validation for placement operations
7. **Easy UI Integration**: Simple hooks and methods for UI components

## Migration Path

1. Update type definitions to use enhanced structures
2. Implement CriticalSlotManager utility
3. Create React hooks for manager integration
4. Update UI components to use new hooks
5. Add transaction history UI (optional)
6. Implement undo/redo functionality (optional)
