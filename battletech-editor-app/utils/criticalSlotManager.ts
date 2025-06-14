/**
 * Critical Slot Manager Implementation
 * Provides comprehensive management of critical slots with transaction tracking,
 * unhittables support, and drag/drop state management
 */

import {
  EnhancedCriticalSlot,
  EnhancedCriticalAllocationMap,
  CriticalSlotTransaction,
  TransactionLog,
  DragState,
  UnhittableComponent,
  UnhittablesTracker,
  ICriticalSlotManager,
  UNHITTABLE_SYSTEMS,
  LOCATION_SLOT_COUNTS
} from '../types/enhancedCriticals';

export class CriticalSlotManager implements ICriticalSlotManager {
  private allocations: EnhancedCriticalAllocationMap;
  private transactionLog: TransactionLog;
  private dragState: DragState;
  private unhittablesTracker: UnhittablesTracker;
  
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
    this.unhittablesTracker = {
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
          slots.forEach((slot) => {
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
        }
      });
      equipment.slots = affectedSlots.length;
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
    
    // Update unhittables tracker if needed
    if (slot.contentType === 'unhittable' && slot.unhittableType && slot.unhittableType !== 'special') {
      this.unhittablesTracker[slot.unhittableType].allocatedSlots--;
    }
    
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
    const processedIds = new Set<string>();
    
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
        } else if (slot.equipmentId && !processedIds.has(slot.equipmentId)) {
          processedIds.add(slot.equipmentId);
          removedEquipment.push({
            id: slot.equipmentId,
            name: slot.content,
            slots: 1
          });
        }
        
        // Update unhittables tracker if needed
        if (slot.contentType === 'unhittable' && slot.unhittableType && slot.unhittableType !== 'special') {
          this.unhittablesTracker[slot.unhittableType].allocatedSlots--;
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
  
  generateUnhittables(
    type: 'structure' | 'armor',
    componentType: string,
    techBase: 'Inner Sphere' | 'Clan'
  ): UnhittableComponent[] {
    const systemDef = UNHITTABLE_SYSTEMS[type][componentType];
    if (!systemDef) return [];
    
    const slotsRequired = systemDef[techBase] || systemDef.slots || 0;
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
    
    // Create transaction
    const transaction: CriticalSlotTransaction = {
      id: transactionId,
      timestamp: new Date(),
      type: 'add',
      location,
      slotIndex,
      slotCount: 1,
      equipment: {
        id: unhittable.id,
        name: unhittable.name,
        slots: 1
      },
      previousState: [...locationSlots]
    };
    
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
    } else {
      // Handle special systems
      let specialSystem = this.unhittablesTracker.special.systems.find(
        s => s.name === unhittable.parentSystem
      );
      if (!specialSystem) {
        specialSystem = {
          name: unhittable.parentSystem,
          totalSlots: unhittable.totalRequired,
          allocatedSlots: 0,
          components: []
        };
        this.unhittablesTracker.special.systems.push(specialSystem);
      }
      specialSystem.allocatedSlots++;
    }
    
    this.addTransaction(transaction);
    return true;
  }
  
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
  
  private isUnhittableAllocated(unhittableId: string): boolean {
    for (const [, slots] of Object.entries(this.allocations)) {
      if (slots.some(slot => slot.equipmentId === unhittableId)) {
        return true;
      }
    }
    return false;
  }
  
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
      
      // Recalculate unhittables allocations
      this.recalculateUnhittableAllocations();
      
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
    // This is a simplified implementation - full implementation would
    // need to re-execute the transaction based on its type
    return true;
  }
  
  private recalculateUnhittableAllocations(): void {
    // Reset counts
    this.unhittablesTracker.structure.allocatedSlots = 0;
    this.unhittablesTracker.armor.allocatedSlots = 0;
    this.unhittablesTracker.special.systems.forEach(system => {
      system.allocatedSlots = 0;
    });
    
    // Recalculate from current allocations
    for (const [, slots] of Object.entries(this.allocations)) {
      slots.forEach(slot => {
        if (slot.contentType === 'unhittable' && slot.unhittableType) {
          if (slot.unhittableType === 'structure' || slot.unhittableType === 'armor') {
            this.unhittablesTracker[slot.unhittableType].allocatedSlots++;
          } else if (slot.unhittableType === 'special' && slot.parentComponent) {
            const system = this.unhittablesTracker.special.systems.find(
              s => s.name === slot.parentComponent
            );
            if (system) {
              system.allocatedSlots++;
            }
          }
        }
      });
    }
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
        // It should already be back in place due to undo
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
    return LOCATION_SLOT_COUNTS[location] || 12;
  }
  
  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private calculateValidDropTargets(
    equipment: { name: string; slots: number }
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
    unhittablesTracker: UnhittablesTracker;
  } {
    return {
      allocations: this.allocations,
      transactions: this.transactionLog.transactions,
      unhittablesTracker: this.unhittablesTracker
    };
  }
  
  importState(state: {
    allocations: EnhancedCriticalAllocationMap;
    transactions?: CriticalSlotTransaction[];
    unhittablesTracker?: UnhittablesTracker;
  }): void {
    this.allocations = state.allocations;
    if (state.transactions) {
      this.transactionLog.transactions = state.transactions;
      this.transactionLog.currentIndex = state.transactions.length - 1;
    }
    if (state.unhittablesTracker) {
      this.unhittablesTracker = state.unhittablesTracker;
    } else {
      // Recalculate unhittables from allocations if not provided
      this.recalculateUnhittableAllocations();
    }
  }
}
