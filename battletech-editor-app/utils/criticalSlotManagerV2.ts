/**
 * Critical Slot Manager V2
 * Complete object-based critical slot management
 * NO STRING STORAGE - only objects and references
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CriticalSlotObject,
  CriticalAllocationMap,
  EquipmentObject,
  EquipmentReference,
  EquipmentRegistry,
  EquipmentRegistryEntry,
  SlotType,
  EquipmentType,
  EquipmentCategory,
  MultiSlotGroup,
  SlotValidationResult,
  LOCATION_CONFIGS,
  SystemEquipmentSet,
  SlotOperation,
  SlotChangeEvent
} from '../types/criticalSlots';
import { SystemComponents } from '../types/systemComponents';
import { EditableUnit } from '../types/editor';

export class CriticalSlotManagerV2 {
  private allocations: CriticalAllocationMap = {};
  private registry: EquipmentRegistry = {};
  private multiSlotGroups: Map<string, MultiSlotGroup> = new Map();
  private changeHistory: SlotChangeEvent[] = [];

  constructor() {
    this.initializeEmptySlots();
  }

  /**
   * Initialize all locations with empty slot objects
   */
  private initializeEmptySlots(): void {
    LOCATION_CONFIGS.forEach(config => {
      this.allocations[config.location] = [];
      for (let i = 0; i < config.totalSlots; i++) {
        this.allocations[config.location].push({
          slotIndex: i,
          location: config.location,
          equipment: null,
          isPartOfMultiSlot: false,
          slotType: SlotType.NORMAL
        });
      }
    });
  }

  /**
   * Get current allocations
   */
  getAllocations(): CriticalAllocationMap {
    return this.allocations;
  }

  /**
   * Get equipment registry
   */
  getRegistry(): EquipmentRegistry {
    return this.registry;
  }

  /**
   * Get slot content at specific location and index
   */
  getSlotContent(location: string, slotIndex: number): CriticalSlotObject | null {
    const locationSlots = this.allocations[location];
    if (!locationSlots || slotIndex < 0 || slotIndex >= locationSlots.length) {
      return null;
    }
    return locationSlots[slotIndex];
  }

  /**
   * Check if a slot is empty
   */
  isSlotEmpty(location: string, slotIndex: number): boolean {
    const slot = this.getSlotContent(location, slotIndex);
    return slot ? slot.equipment === null : true;
  }

  /**
   * Check if equipment can be allocated to a location starting at a specific slot
   */
  canAllocateEquipment(
    location: string,
    startSlotIndex: number,
    equipment: EquipmentObject
  ): boolean {
    const locationSlots = this.allocations[location];
    if (!locationSlots) return false;

    // Check if there are enough slots
    if (startSlotIndex + equipment.requiredSlots > locationSlots.length) {
      return false;
    }

    // Check if all required slots are empty
    for (let i = 0; i < equipment.requiredSlots; i++) {
      if (!this.isSlotEmpty(location, startSlotIndex + i)) {
        return false;
      }
    }

    // Check location-specific rules
    if (!this.isEquipmentAllowedInLocation(equipment, location)) {
      return false;
    }

    return true;
  }

  /**
   * Allocate equipment to critical slots
   */
  allocateEquipment(
    location: string,
    startSlotIndex: number,
    equipment: EquipmentObject
  ): boolean {
    if (!this.canAllocateEquipment(location, startSlotIndex, equipment)) {
      return false;
    }

    // Generate unique group ID for multi-slot items
    const groupId = equipment.requiredSlots > 1 ? uuidv4() : undefined;

    // Create equipment reference
    const equipmentRef: EquipmentReference = {
      equipmentId: equipment.id,
      equipmentData: equipment,
      allocatedSlots: equipment.requiredSlots,
      startSlotIndex: startSlotIndex,
      endSlotIndex: startSlotIndex + equipment.requiredSlots - 1
    };

    // Allocate slots
    for (let i = 0; i < equipment.requiredSlots; i++) {
      const slotIndex = startSlotIndex + i;
      const previousState = { ...this.allocations[location][slotIndex] };
      
      this.allocations[location][slotIndex] = {
        slotIndex: slotIndex,
        location: location,
        equipment: equipmentRef,
        isPartOfMultiSlot: equipment.requiredSlots > 1,
        multiSlotGroupId: groupId,
        multiSlotIndex: i,
        slotType: SlotType.NORMAL
      };

      // Record change
      this.recordChange({
        type: 'allocate',
        location,
        slotIndex,
        equipment
      }, previousState, this.allocations[location][slotIndex], [slotIndex]);
    }

    // Update registry
    this.updateRegistry(equipment, location, startSlotIndex, startSlotIndex + equipment.requiredSlots - 1);

    // Track multi-slot group
    if (groupId) {
      this.multiSlotGroups.set(groupId, {
        groupId,
        equipmentId: equipment.id,
        location,
        startIndex: startSlotIndex,
        endIndex: startSlotIndex + equipment.requiredSlots - 1,
        totalSlots: equipment.requiredSlots
      });
    }

    return true;
  }

  /**
   * Remove equipment from a slot
   */
  removeEquipment(location: string, slotIndex: number): boolean {
    const slot = this.getSlotContent(location, slotIndex);
    if (!slot || !slot.equipment) {
      return false;
    }

    // Check if equipment is removable
    if (slot.equipment.equipmentData.isFixed && !slot.equipment.equipmentData.isRemovable) {
      return false;
    }

    // Get all slots occupied by this equipment
    const groupId = slot.multiSlotGroupId;
    let slotsToRemove: number[] = [slotIndex];

    if (groupId) {
      const group = this.multiSlotGroups.get(groupId);
      if (group) {
        slotsToRemove = [];
        for (let i = group.startIndex; i <= group.endIndex; i++) {
          slotsToRemove.push(i);
        }
      }
    }

    // Remove from all slots
    const equipment = slot.equipment.equipmentData;
    slotsToRemove.forEach(index => {
      const previousState = { ...this.allocations[location][index] };
      
      this.allocations[location][index] = {
        slotIndex: index,
        location: location,
        equipment: null,
        isPartOfMultiSlot: false,
        slotType: SlotType.NORMAL
      };

      // Record change
      this.recordChange({
        type: 'remove',
        location,
        slotIndex: index
      }, previousState, this.allocations[location][index], [index]);
    });

    // Update registry
    this.removeFromRegistry(equipment.id, location);

    // Remove multi-slot group
    if (groupId) {
      this.multiSlotGroups.delete(groupId);
    }

    return true;
  }

  /**
   * Move equipment from one location to another
   */
  moveEquipment(
    fromLocation: string,
    fromSlotIndex: number,
    toLocation: string,
    toSlotIndex: number
  ): boolean {
    const sourceSlot = this.getSlotContent(fromLocation, fromSlotIndex);
    if (!sourceSlot || !sourceSlot.equipment) {
      return false;
    }

    const equipment = sourceSlot.equipment.equipmentData;

    // Remove from source
    if (!this.removeEquipment(fromLocation, fromSlotIndex)) {
      return false;
    }

    // Allocate to destination
    if (!this.allocateEquipment(toLocation, toSlotIndex, equipment)) {
      // Rollback - re-allocate to original location
      this.allocateEquipment(fromLocation, fromSlotIndex, equipment);
      return false;
    }

    return true;
  }

  /**
   * Clear all equipment from a location (except fixed system components)
   */
  clearLocation(location: string): void {
    const locationSlots = this.allocations[location];
    if (!locationSlots) return;

    // Remove all removable equipment
    for (let i = 0; i < locationSlots.length; i++) {
      const slot = locationSlots[i];
      if (slot.equipment && (!slot.equipment.equipmentData.isFixed || slot.equipment.equipmentData.isRemovable)) {
        this.removeEquipment(location, i);
      }
    }
  }

  /**
   * Initialize slots with system components
   */
  initializeSystemComponents(systemComponents: SystemComponents, unitMass: number): void {
    const systemEquipment = this.createSystemEquipmentSet(systemComponents, unitMass);

    // Head components
    this.allocateEquipment('Head', 0, systemEquipment.lifeSupport);
    this.allocateEquipment('Head', 1, systemEquipment.sensors);
    this.allocateEquipment('Head', 2, systemEquipment.cockpit);
    this.allocateEquipment('Head', 4, systemEquipment.sensors); // Second sensor slot
    this.allocateEquipment('Head', 5, systemEquipment.lifeSupport); // Second life support

    // Engine (Center Torso)
    const engineSlots = this.getEngineSlots(systemComponents.engine.type);
    this.allocateEquipment('Center Torso', 0, {
      ...systemEquipment.engine,
      requiredSlots: engineSlots.ct
    });

    // Engine side torsos (for XL/XXL/Light)
    if (engineSlots.st > 0) {
      const sideEngine: EquipmentObject = {
        ...systemEquipment.engine,
        id: systemEquipment.engine.id + '-st',
        name: systemEquipment.engine.name + ' (Side)',
        requiredSlots: engineSlots.st
      };
      this.allocateEquipment('Left Torso', 0, sideEngine);
      this.allocateEquipment('Right Torso', 0, sideEngine);
    }

    // Gyro (Center Torso after engine)
    const gyroSlots = this.getGyroSlots(systemComponents.gyro.type);
    this.allocateEquipment('Center Torso', engineSlots.ct, {
      ...systemEquipment.gyro,
      requiredSlots: gyroSlots
    });

    // Actuators
    this.initializeActuators(systemEquipment, systemComponents);

    // Heat sinks
    if (systemComponents.heatSinks.externalRequired > 0 && systemEquipment.heatSinks) {
      // Distribute heat sinks across locations
      // This is simplified - real implementation would follow specific rules
      let remainingHS = systemComponents.heatSinks.externalRequired;
      const heatSinkSlots = systemComponents.heatSinks.type === 'Single' ? 1 : 
                           (systemComponents.heatSinks.type === 'Double' ? 3 : 2);
      
      // Try to place in torsos first
      ['Left Torso', 'Right Torso', 'Center Torso'].forEach(location => {
        if (remainingHS > 0) {
          const freeSlots = this.getFreeSlotsInLocation(location);
          const hsToPlace = Math.floor(freeSlots.length / heatSinkSlots);
          if (hsToPlace > 0) {
            for (let i = 0; i < Math.min(hsToPlace, remainingHS); i++) {
              const startSlot = freeSlots[i * heatSinkSlots];
              if (systemEquipment.heatSinks && systemEquipment.heatSinks[0]) {
                this.allocateEquipment(location, startSlot, {
                  ...systemEquipment.heatSinks[0],
                  requiredSlots: heatSinkSlots
                });
                remainingHS--;
              }
            }
          }
        }
      });
    }

    // Structure and armor special components
    if (systemEquipment.endoSteel) {
      this.distributeSpecialComponent(systemEquipment.endoSteel);
    }
    if (systemEquipment.ferroFibrous) {
      this.distributeSpecialComponent(systemEquipment.ferroFibrous);
    }
  }

  /**
   * Create system equipment objects from system components
   */
  private createSystemEquipmentSet(systemComponents: SystemComponents, unitMass: number): SystemEquipmentSet {
    const engineId = uuidv4();
    const gyroId = uuidv4();
    
    return {
      engine: {
        id: engineId,
        name: `${systemComponents.engine.type} Engine ${systemComponents.engine.rating}`,
        type: EquipmentType.ENGINE,
        category: EquipmentCategory.SYSTEM,
        requiredSlots: 6, // Will be adjusted based on type
        weight: this.calculateEngineWeight(systemComponents.engine.rating, unitMass, systemComponents.engine.type),
        isFixed: true,
        isRemovable: false,
        techBase: 'Both'
      },
      gyro: {
        id: gyroId,
        name: `${systemComponents.gyro.type} Gyro`,
        type: EquipmentType.GYRO,
        category: EquipmentCategory.SYSTEM,
        requiredSlots: 4, // Will be adjusted based on type
        weight: this.calculateGyroWeight(systemComponents.engine.rating, systemComponents.gyro.type),
        isFixed: true,
        isRemovable: false,
        techBase: 'Both'
      },
      cockpit: {
        id: uuidv4(),
        name: `${systemComponents.cockpit.type} Cockpit`,
        type: EquipmentType.COCKPIT,
        category: EquipmentCategory.SYSTEM,
        requiredSlots: 1,
        weight: 3,
        isFixed: true,
        isRemovable: false,
        techBase: 'Both'
      },
      lifeSupport: {
        id: uuidv4(),
        name: 'Life Support',
        type: EquipmentType.LIFE_SUPPORT,
        category: EquipmentCategory.SYSTEM,
        requiredSlots: 1,
        weight: 0,
        isFixed: true,
        isRemovable: false,
        techBase: 'Both'
      },
      sensors: {
        id: uuidv4(),
        name: 'Sensors',
        type: EquipmentType.SENSORS,
        category: EquipmentCategory.SYSTEM,
        requiredSlots: 1,
        weight: 0,
        isFixed: true,
        isRemovable: false,
        techBase: 'Both'
      },
      actuators: {
        shoulder: this.createActuator('Shoulder'),
        upperArm: this.createActuator('Upper Arm Actuator'),
        lowerArm: this.createActuator('Lower Arm Actuator'),
        hand: this.createActuator('Hand Actuator'),
        hip: this.createActuator('Hip'),
        upperLeg: this.createActuator('Upper Leg Actuator'),
        lowerLeg: this.createActuator('Lower Leg Actuator'),
        foot: this.createActuator('Foot Actuator')
      },
      heatSinks: systemComponents.heatSinks.externalRequired > 0 ? [{
        id: uuidv4(),
        name: `${systemComponents.heatSinks.type} Heat Sink`,
        type: EquipmentType.HEAT_SINK,
        category: EquipmentCategory.SYSTEM,
        requiredSlots: 1,
        weight: systemComponents.heatSinks.type === 'Single' ? 1 : 1,
        isFixed: false,
        isRemovable: true,
        techBase: 'Both',
        dissipation: systemComponents.heatSinks.type === 'Single' ? 1 : 2
      }] : undefined,
      endoSteel: systemComponents.structure.type.includes('Endo Steel') ? {
        id: uuidv4(),
        name: systemComponents.structure.type,
        type: EquipmentType.ENDO_STEEL,
        category: EquipmentCategory.SPECIAL,
        requiredSlots: 1,
        weight: 0,
        isFixed: true,
        isRemovable: false,
        techBase: systemComponents.structure.type.includes('Clan') ? 'Clan' : 'Inner Sphere'
      } : undefined,
      ferroFibrous: systemComponents.armor.type !== 'Standard' ? {
        id: uuidv4(),
        name: systemComponents.armor.type,
        type: EquipmentType.FERRO_FIBROUS,
        category: EquipmentCategory.SPECIAL,
        requiredSlots: 1,
        weight: 0,
        isFixed: true,
        isRemovable: false,
        techBase: systemComponents.armor.type.includes('Clan') ? 'Clan' : 'Inner Sphere'
      } : undefined
    };
  }

  /**
   * Create actuator equipment object
   */
  private createActuator(name: string): EquipmentObject {
    const isRemovable = name.includes('Lower Arm') || name.includes('Hand');
    return {
      id: uuidv4(),
      name: name,
      type: EquipmentType.ACTUATOR,
      category: EquipmentCategory.SYSTEM,
      requiredSlots: 1,
      weight: 0,
      isFixed: !isRemovable,
      isRemovable: isRemovable,
      techBase: 'Both'
    };
  }

  /**
   * Initialize actuators in appropriate locations
   */
  private initializeActuators(systemEquipment: SystemEquipmentSet, systemComponents: SystemComponents): void {
    // Arms
    ['Left Arm', 'Right Arm'].forEach(location => {
      this.allocateEquipment(location, 0, systemEquipment.actuators.shoulder);
      this.allocateEquipment(location, 1, systemEquipment.actuators.upperArm);
      
      const isLeft = location === 'Left Arm';
      const hasLowerArm = isLeft ? 
        systemComponents.leftArmActuators?.hasLowerArm !== false :
        systemComponents.rightArmActuators?.hasLowerArm !== false;
      const hasHand = isLeft ?
        systemComponents.leftArmActuators?.hasHand !== false :
        systemComponents.rightArmActuators?.hasHand !== false;
      
      if (hasLowerArm && systemEquipment.actuators.lowerArm) {
        this.allocateEquipment(location, 2, systemEquipment.actuators.lowerArm);
      }
      if (hasHand && systemEquipment.actuators.hand) {
        this.allocateEquipment(location, 3, systemEquipment.actuators.hand);
      }
    });

    // Legs
    ['Left Leg', 'Right Leg'].forEach(location => {
      this.allocateEquipment(location, 0, systemEquipment.actuators.hip);
      this.allocateEquipment(location, 1, systemEquipment.actuators.upperLeg);
      this.allocateEquipment(location, 2, systemEquipment.actuators.lowerLeg);
      this.allocateEquipment(location, 3, systemEquipment.actuators.foot);
    });
  }

  /**
   * Distribute special components (endo steel, ferro-fibrous) across locations
   */
  private distributeSpecialComponent(component: EquipmentObject): void {
    const totalSlots = this.getSpecialComponentSlots(component.name, component.techBase);
    let remainingSlots = totalSlots;
    
    // Distribute across all locations except head
    const locations = ['Left Torso', 'Right Torso', 'Center Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg'];
    
    locations.forEach(location => {
      if (remainingSlots > 0) {
        const freeSlots = this.getFreeSlotsInLocation(location);
        const slotsToPlace = Math.min(remainingSlots, freeSlots.length);
        
        for (let i = 0; i < slotsToPlace; i++) {
          this.allocateEquipment(location, freeSlots[i], {
            ...component,
            id: `${component.id}-${location}-${i}`,
            name: `${component.name} (${remainingSlots}/${totalSlots})`
          });
          remainingSlots--;
        }
      }
    });
  }

  /**
   * Get free slots in a location
   */
  private getFreeSlotsInLocation(location: string): number[] {
    const slots = this.allocations[location];
    const freeSlots: number[] = [];
    
    if (slots) {
      slots.forEach((slot, index) => {
        if (slot.equipment === null) {
          freeSlots.push(index);
        }
      });
    }
    
    return freeSlots;
  }

  /**
   * Get engine slot requirements
   */
  private getEngineSlots(engineType: string): { ct: number; st: number } {
    switch (engineType) {
      case 'XL':
      case 'XXL':
        return { ct: 6, st: 3 };
      case 'Light':
        return { ct: 6, st: 2 };
      case 'Compact':
        return { ct: 3, st: 0 };
      default:
        return { ct: 6, st: 0 };
    }
  }

  /**
   * Get gyro slot requirements
   */
  private getGyroSlots(gyroType: string): number {
    switch (gyroType) {
      case 'XL': return 6;
      case 'Compact': return 2;
      case 'Heavy-Duty': return 4;
      default: return 4;
    }
  }

  /**
   * Get special component slot requirements
   */
  private getSpecialComponentSlots(componentName: string, techBase: string): number {
    if (componentName.includes('Endo Steel')) {
      return techBase === 'Clan' ? 7 : 14;
    }
    if (componentName.includes('Ferro-Fibrous')) {
      if (componentName.includes('Light')) return 7;
      if (componentName.includes('Heavy')) return 21;
      return techBase === 'Clan' ? 7 : 14;
    }
    if (componentName.includes('Stealth')) return 12;
    if (componentName.includes('Reactive')) return 14;
    if (componentName.includes('Reflective')) return 10;
    return 0;
  }

  /**
   * Calculate engine weight
   */
  private calculateEngineWeight(rating: number, mechTonnage: number, engineType: string): number {
    // Simplified calculation - real implementation would use proper formulas
    const baseWeight = (rating * mechTonnage) / 400;
    switch (engineType) {
      case 'XL': return baseWeight * 0.5;
      case 'XXL': return baseWeight * 0.33;
      case 'Light': return baseWeight * 0.75;
      case 'Compact': return baseWeight * 1.5;
      default: return baseWeight;
    }
  }

  /**
   * Calculate gyro weight
   */
  private calculateGyroWeight(engineRating: number, gyroType: string): number {
    const baseWeight = Math.ceil(engineRating / 100);
    switch (gyroType) {
      case 'XL': return Math.ceil(baseWeight * 0.5);
      case 'Compact': return Math.ceil(baseWeight * 1.5);
      case 'Heavy-Duty': return Math.ceil(baseWeight * 2);
      default: return baseWeight;
    }
  }

  /**
   * Check if equipment is allowed in a location
   */
  private isEquipmentAllowedInLocation(equipment: EquipmentObject, location: string): boolean {
    // Basic rules - can be expanded
    if (equipment.type === EquipmentType.ENGINE && !location.includes('Torso')) {
      return false;
    }
    if (equipment.type === EquipmentType.GYRO && location !== 'Center Torso') {
      return false;
    }
    if (equipment.type === EquipmentType.COCKPIT && location !== 'Head') {
      return false;
    }
    return true;
  }

  /**
   * Update equipment registry
   */
  private updateRegistry(
    equipment: EquipmentObject,
    location: string,
    startSlot: number,
    endSlot: number
  ): void {
    if (!this.registry[equipment.id]) {
      this.registry[equipment.id] = {
        equipment: equipment,
        totalQuantity: 1,
        allocatedQuantity: 0,
        allocations: []
      };
    }

    const entry = this.registry[equipment.id];
    entry.allocatedQuantity++;
    entry.allocations.push({
      location,
      startSlot,
      endSlot
    });
  }

  /**
   * Remove from equipment registry
   */
  private removeFromRegistry(equipmentId: string, location: string): void {
    const entry = this.registry[equipmentId];
    if (!entry) return;

    entry.allocatedQuantity--;
    entry.allocations = entry.allocations.filter(
      alloc => alloc.location !== location
    );

    if (entry.allocatedQuantity === 0) {
      delete this.registry[equipmentId];
    }
  }

  /**
   * Record a change event
   */
  private recordChange(
    operation: SlotOperation,
    previousState: CriticalSlotObject | null,
    newState: CriticalSlotObject | null,
    affectedSlots: number[]
  ): void {
    this.changeHistory.push({
      operation,
      previousState,
      newState,
      affectedSlots,
      timestamp: new Date()
    });

    // Keep only last 100 changes
    if (this.changeHistory.length > 100) {
      this.changeHistory = this.changeHistory.slice(-100);
    }
  }

  /**
   * Validate current allocations
   */
  validate(): SlotValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for invalid allocations
    Object.entries(this.allocations).forEach(([location, slots]) => {
      slots.forEach((slot, index) => {
        if (slot.equipment) {
          // Check multi-slot consistency
          if (slot.isPartOfMultiSlot && slot.multiSlotGroupId) {
            const group = this.multiSlotGroups.get(slot.multiSlotGroupId);
            if (!group) {
              errors.push(`Slot ${index} in ${location} references invalid multi-slot group`);
            }
          }
        }
      });
    });

    // Check registry consistency
    Object.entries(this.registry).forEach(([equipmentId, entry]) => {
      const actualAllocations = entry.allocations.length;
      if (actualAllocations !== entry.allocatedQuantity) {
        errors.push(`Registry mismatch for ${entry.equipment.name}: ${actualAllocations} allocations vs ${entry.allocatedQuantity} recorded`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Convert from legacy string-based format
   */
  static fromLegacyFormat(
    unit: EditableUnit,
    systemComponents: SystemComponents
  ): CriticalSlotManagerV2 {
    const manager = new CriticalSlotManagerV2();
    
    // Initialize system components first
    manager.initializeSystemComponents(systemComponents, unit.mass);

    // Convert legacy critical slots if they exist
    if (unit.data?.criticals) {
      unit.data.criticals.forEach(locationData => {
        const location = locationData.location;
        locationData.slots.forEach((slotContent, index) => {
          // Skip empty slots and system components
          if (!slotContent || 
              slotContent === '-Empty-' || 
              slotContent === '- Empty -' ||
              manager.allocations[location]?.[index]?.equipment) {
            return;
          }

          // Find equipment in weapons_and_equipment
          const equipment = unit.data?.weapons_and_equipment?.find(
            eq => eq.item_name === slotContent && eq.location === location
          );

          if (equipment) {
            // Convert to equipment object
            const equipmentObj: EquipmentObject = {
              id: uuidv4(),
              name: equipment.item_name,
              type: equipment.item_type === 'weapon' ? EquipmentType.BALLISTIC : EquipmentType.EQUIPMENT,
              category: equipment.item_type === 'weapon' ? EquipmentCategory.WEAPON : EquipmentCategory.EQUIPMENT,
              requiredSlots: typeof equipment.crits === 'string' ? parseInt(equipment.crits) : (equipment.crits || 1),
              weight: typeof equipment.tons === 'string' ? parseFloat(equipment.tons) : (equipment.tons || 0),
              isFixed: false,
              isRemovable: true,
              techBase: equipment.tech_base as any || 'Inner Sphere'
            };

            // Try to allocate at this position
            if (manager.canAllocateEquipment(location, index, equipmentObj)) {
              manager.allocateEquipment(location, index, equipmentObj);
            }
          }
        });
      });
    }

    return manager;
  }

  /**
   * Export to unit data format
   */
  exportToUnitData(): any {
    const criticals: any[] = [];

    Object.entries(this.allocations).forEach(([location, slots]) => {
      const locationSlots: string[] = slots.map(slot => {
        if (slot.equipment) {
          return slot.equipment.equipmentData.name;
        }
        return '-Empty-';
      });

      criticals.push({
        location,
        slots: locationSlots
      });
    });

    return criticals;
  }
}
