/**
 * Component Synchronization Service
 * Handles synchronization between system components and critical slots
 */

import { EditableUnit } from '../types/editor';
import { CriticalSlotLocation } from '../types/index';
import {
  SystemComponents,
  EngineType,
  GyroType,
  StructureType,
  ArmorType,
  HeatSinkType,
  calculateIntegratedHeatSinks,
  calculateExternalHeatSinks,
} from '../types/systemComponents';
import {
  initializeCriticalSlots,
  generateHeatSinkItems,
  validateComponentPlacement,
} from './componentRules';

/**
 * Initialize system components from existing unit data
 */
export function initializeSystemComponents(unit: EditableUnit): SystemComponents {
  const data = unit.data || {};
  
  // Map old engine types to new ones
  let engineType: EngineType = 'Standard';
  if (data.engine?.type) {
    const oldType = data.engine.type;
    if (oldType === 'Fusion' || oldType === 'Standard') {
      engineType = 'Standard';
    } else if (oldType === 'XL' || oldType === 'XL Engine') {
      engineType = 'XL';
    } else if (oldType === 'Light' || oldType === 'Light Engine') {
      engineType = 'Light';
    } else if (oldType === 'XXL' || oldType === 'XXL Engine') {
      engineType = 'XXL';
    } else if (oldType === 'Compact' || oldType === 'Compact Engine') {
      engineType = 'Compact';
    } else {
      engineType = oldType as EngineType;
    }
  }
  
  return {
    engine: {
      type: engineType,
      rating: data.engine?.rating || 300,
      manufacturer: data.engine?.manufacturer,
    },
    gyro: {
      type: (unit.data?.gyro?.type || 'Standard') as GyroType,
    },
    cockpit: {
      type: 'Standard', // Default, can be expanded later
    },
    structure: {
      type: (unit.data?.structure?.type || 'Standard') as StructureType,
    },
    armor: {
      type: (unit.data?.armor?.type || 'Standard') as ArmorType,
    },
    heatSinks: {
      type: (unit.data?.heat_sinks?.type || 'Single') as HeatSinkType,
      total: unit.data?.heat_sinks?.count || 10,
      engineIntegrated: calculateIntegratedHeatSinks(data.engine?.rating || 300),
      externalRequired: calculateExternalHeatSinks(
        unit.data?.heat_sinks?.count || 10,
        data.engine?.rating || 300
      ),
    },
  };
}

/**
 * Sync critical slots when engine changes
 */
export function syncEngineChange(
  unit: EditableUnit,
  newEngineType: EngineType,
  newRating?: number
): Partial<EditableUnit> {
  // Initialize system components if not present
  const systemComponents = unit.systemComponents || initializeSystemComponents(unit);
  
  // Update engine in system components
  const updatedComponents: SystemComponents = {
    ...systemComponents,
    engine: {
      type: newEngineType,
      rating: newRating || systemComponents.engine.rating,
    },
  };
  
  // Recalculate heat sinks
  const engineRating = newRating || systemComponents.engine.rating;
  updatedComponents.heatSinks = {
    ...systemComponents.heatSinks,
    engineIntegrated: calculateIntegratedHeatSinks(engineRating),
    externalRequired: calculateExternalHeatSinks(
      systemComponents.heatSinks.total,
      engineRating
    ),
  };
  
  // Initialize new critical allocations
  const criticalAllocations = initializeCriticalSlots(
    updatedComponents,
    unit.mass
  );
  
  // Convert to legacy criticals format for compatibility
  const criticals = convertToLegacyCriticals(criticalAllocations);
  
  // Check for displaced equipment and update weapons_and_equipment
  const displacedEquipmentNames = findDisplacedEquipment(unit, criticals);
  
  // Update weapons and equipment to unallocate displaced items
  let updatedEquipment = unit.data?.weapons_and_equipment || [];
  if (displacedEquipmentNames.length > 0) {
    updatedEquipment = updatedEquipment.map(eq => {
      // Check if this equipment was displaced
      if (displacedEquipmentNames.includes(eq.item_name) && eq.location) {
        // Check if the equipment is still in its location in the new criticals
        const locationCriticals = criticals.find(c => c.location === eq.location);
        if (locationCriticals && !locationCriticals.slots.includes(eq.item_name)) {
          // Equipment was displaced, unallocate it
          return { ...eq, location: '' };
        }
      }
      return eq;
    });
  }
  
  return {
    systemComponents: updatedComponents,
    criticalAllocations,
    data: {
      ...unit.data,
      engine: {
        type: newEngineType,
        rating: engineRating,
      },
      criticals,
      weapons_and_equipment: updatedEquipment,
    },
  };
}

/**
 * Sync critical slots when gyro changes
 */
export function syncGyroChange(
  unit: EditableUnit,
  newGyroType: GyroType
): Partial<EditableUnit> {
  const systemComponents = unit.systemComponents || initializeSystemComponents(unit);
  
  const updatedComponents: SystemComponents = {
    ...systemComponents,
    gyro: {
      type: newGyroType,
    },
  };
  
  const criticalAllocations = initializeCriticalSlots(
    updatedComponents,
    unit.mass
  );
  
  const criticals = convertToLegacyCriticals(criticalAllocations);
  
  // Check for displaced equipment and update weapons_and_equipment
  const displacedEquipmentNames = findDisplacedEquipment(unit, criticals);
  
  // Update weapons and equipment to unallocate displaced items
  let updatedEquipment = unit.data?.weapons_and_equipment || [];
  if (displacedEquipmentNames.length > 0) {
    updatedEquipment = updatedEquipment.map(eq => {
      // Check if this equipment was displaced
      if (displacedEquipmentNames.includes(eq.item_name) && eq.location) {
        // Check if the equipment is still in its location in the new criticals
        const locationCriticals = criticals.find(c => c.location === eq.location);
        if (locationCriticals && !locationCriticals.slots.includes(eq.item_name)) {
          // Equipment was displaced, unallocate it
          return { ...eq, location: '' };
        }
      }
      return eq;
    });
  }
  
  return {
    systemComponents: updatedComponents,
    criticalAllocations,
    data: {
      ...unit.data,
      gyro: {
        type: newGyroType,
      },
      criticals,
      weapons_and_equipment: updatedEquipment,
    },
  };
}

/**
 * Sync critical slots when structure changes
 */
export function syncStructureChange(
  unit: EditableUnit,
  newStructureType: StructureType
): Partial<EditableUnit> {
  const systemComponents = unit.systemComponents || initializeSystemComponents(unit);
  
  const updatedComponents: SystemComponents = {
    ...systemComponents,
    structure: {
      type: newStructureType,
    },
  };
  
  const criticalAllocations = initializeCriticalSlots(
    updatedComponents,
    unit.mass
  );
  
  const criticals = convertToLegacyCriticals(criticalAllocations);
  
  // Check for displaced equipment and update weapons_and_equipment
  const displacedEquipmentNames = findDisplacedEquipment(unit, criticals);
  
  // Update weapons and equipment to unallocate displaced items
  let updatedEquipment = unit.data?.weapons_and_equipment || [];
  if (displacedEquipmentNames.length > 0) {
    updatedEquipment = updatedEquipment.map(eq => {
      // Check if this equipment was displaced
      if (displacedEquipmentNames.includes(eq.item_name) && eq.location) {
        // Check if the equipment is still in its location in the new criticals
        const locationCriticals = criticals.find(c => c.location === eq.location);
        if (locationCriticals && !locationCriticals.slots.includes(eq.item_name)) {
          // Equipment was displaced, unallocate it
          return { ...eq, location: '' };
        }
      }
      return eq;
    });
  }
  
  // Remove old structure items
  updatedEquipment = updatedEquipment.filter(eq => 
    !eq.item_name.includes('Endo Steel') && 
    !eq.item_name.includes('Composite') &&
    !eq.item_name.includes('Reinforced')
  );
  
  // Add new structure items if needed
  const STRUCTURE_SLOT_REQUIREMENTS: Record<StructureType, number> = {
    'Standard': 0,
    'Endo Steel': 14,
    'Endo Steel (Clan)': 7,
    'Composite': 0,
    'Reinforced': 0,
    'Industrial': 0,
  };
  
  const slotsRequired = STRUCTURE_SLOT_REQUIREMENTS[newStructureType] || 0;
  for (let i = 0; i < slotsRequired; i++) {
    updatedEquipment.push({
      item_name: newStructureType,
      item_type: 'equipment' as const,
      location: '', // Unallocated
      tech_base: unit.tech_base as 'IS' | 'Clan',
      tons: 0, // Structure weight is calculated separately
      crits: 1,
    });
  }
  
  return {
    systemComponents: updatedComponents,
    criticalAllocations,
    data: {
      ...unit.data,
      structure: {
        type: newStructureType,
      },
      criticals,
      weapons_and_equipment: updatedEquipment,
    },
  };
}

/**
 * Sync critical slots when armor changes
 */
export function syncArmorChange(
  unit: EditableUnit,
  newArmorType: ArmorType
): Partial<EditableUnit> {
  const systemComponents = unit.systemComponents || initializeSystemComponents(unit);
  
  const updatedComponents: SystemComponents = {
    ...systemComponents,
    armor: {
      type: newArmorType,
    },
  };
  
  const criticalAllocations = initializeCriticalSlots(
    updatedComponents,
    unit.mass
  );
  
  const criticals = convertToLegacyCriticals(criticalAllocations);
  
  // Check for displaced equipment and update weapons_and_equipment
  const displacedEquipmentNames = findDisplacedEquipment(unit, criticals);
  
  // Update weapons and equipment to unallocate displaced items
  let updatedEquipment = unit.data?.weapons_and_equipment || [];
  if (displacedEquipmentNames.length > 0) {
    updatedEquipment = updatedEquipment.map(eq => {
      // Check if this equipment was displaced
      if (displacedEquipmentNames.includes(eq.item_name) && eq.location) {
        // Check if the equipment is still in its location in the new criticals
        const locationCriticals = criticals.find(c => c.location === eq.location);
        if (locationCriticals && !locationCriticals.slots.includes(eq.item_name)) {
          // Equipment was displaced, unallocate it
          return { ...eq, location: '' };
        }
      }
      return eq;
    });
  }
  
  // Remove old armor items
  updatedEquipment = updatedEquipment.filter(eq => 
    !eq.item_name.includes('Ferro-Fibrous') && 
    !eq.item_name.includes('Stealth') &&
    !eq.item_name.includes('Reactive') &&
    !eq.item_name.includes('Reflective')
  );
  
  // Add new armor items if needed
  const ARMOR_SLOT_REQUIREMENTS: Record<ArmorType, { slots: number }> = {
    'Standard': { slots: 0 },
    'Ferro-Fibrous': { slots: 14 },
    'Ferro-Fibrous (Clan)': { slots: 7 },
    'Light Ferro-Fibrous': { slots: 7 },
    'Heavy Ferro-Fibrous': { slots: 21 },
    'Stealth': { slots: 12 },
    'Reactive': { slots: 14 },
    'Reflective': { slots: 10 },
    'Hardened': { slots: 0 },
  };
  
  const armorReq = ARMOR_SLOT_REQUIREMENTS[newArmorType];
  const slotsRequired = armorReq?.slots || 0;
  
  for (let i = 0; i < slotsRequired; i++) {
    updatedEquipment.push({
      item_name: newArmorType,
      item_type: 'equipment' as const,
      location: '', // Unallocated
      tech_base: unit.tech_base as 'IS' | 'Clan',
      tons: 0, // Armor weight is calculated separately
      crits: 1,
    });
  }
  
  return {
    systemComponents: updatedComponents,
    criticalAllocations,
    data: {
      ...unit.data,
      armor: {
        ...unit.data?.armor,
        type: newArmorType,
        locations: unit.data?.armor?.locations || [],
      },
      criticals,
      weapons_and_equipment: updatedEquipment,
    },
  };
}

/**
 * Sync heat sinks and generate external heat sink items
 */
export function syncHeatSinkChange(
  unit: EditableUnit,
  newType: HeatSinkType,
  newCount: number
): Partial<EditableUnit> {
  const systemComponents = unit.systemComponents || initializeSystemComponents(unit);
  const engineRating = systemComponents.engine.rating;
  
  const updatedComponents: SystemComponents = {
    ...systemComponents,
    heatSinks: {
      type: newType,
      total: newCount,
      engineIntegrated: calculateIntegratedHeatSinks(engineRating),
      externalRequired: calculateExternalHeatSinks(newCount, engineRating),
    },
  };
  
  // Generate external heat sink items
  const heatSinkItems = generateHeatSinkItems(newType, newCount, engineRating);
  
  // Remove existing heat sinks from weapons_and_equipment
  const filteredEquipment = (unit.data?.weapons_and_equipment || []).filter(
    item => !item.item_name.includes('Heat Sink')
  );
  
  // Add new heat sink items as unallocated equipment
  const newEquipment = [
    ...filteredEquipment,
    ...heatSinkItems.map(hs => ({
      item_name: hs.name,
      item_type: 'equipment' as const,
      location: '', // Unallocated
      tech_base: unit.tech_base as 'IS' | 'Clan',
    })),
  ];
  
  return {
    systemComponents: updatedComponents,
    data: {
      ...unit.data,
      heat_sinks: {
        type: newType,
        count: newCount,
      },
      weapons_and_equipment: newEquipment,
    },
  };
}

/**
 * Convert critical allocations to legacy criticals format
 */
function convertToLegacyCriticals(
  criticalAllocations: Record<string, any[]>
): CriticalSlotLocation[] {
  return Object.entries(criticalAllocations).map(([location, slots]) => ({
    location,
    slots: slots.map(slot => slot.content || '-Empty-'),
  }));
}

/**
 * Find equipment that was displaced by component changes
 */
function findDisplacedEquipment(
  unit: EditableUnit,
  newCriticals: CriticalSlotLocation[]
): string[] {
  const displaced: string[] = [];
  
  // Compare old and new criticals
  unit.data?.criticals?.forEach(oldLocation => {
    const newLocation = newCriticals.find(loc => loc.location === oldLocation.location);
    if (!newLocation) return;
    
    oldLocation.slots.forEach((oldSlot, index) => {
      if (oldSlot !== '-Empty-' && 
          !isSystemComponent(oldSlot) &&
          newLocation.slots[index] !== oldSlot) {
        displaced.push(oldSlot);
      }
    });
  });
  
  return displaced;
}

/**
 * Check if a slot content is a system component
 */
function isSystemComponent(content: string): boolean {
  const systemComponents = [
    'Engine', 'Gyro', 'Cockpit', 'Life Support', 'Sensors',
    'Shoulder', 'Upper Arm Actuator', 'Lower Arm Actuator', 'Hand Actuator',
    'Hip', 'Upper Leg Actuator', 'Lower Leg Actuator', 'Foot Actuator',
  ];
  
  return systemComponents.some(comp => content.includes(comp));
}

/**
 * Validate system component changes
 */
export function validateComponentChange(
  unit: EditableUnit,
  componentType: 'engine' | 'gyro' | 'structure',
  newValue: any
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check weight limits
  if (componentType === 'engine') {
    const maxRating = unit.mass * 400 / 100; // Max engine rating formula
    if (newValue.rating > maxRating) {
      errors.push(`Engine rating ${newValue.rating} exceeds maximum of ${maxRating} for ${unit.mass}-ton mech`);
    }
  }
  
  // Check tech level compatibility
  // TODO: Add tech level validation
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Handle equipment placement in critical slots
 */
export function placeEquipmentInCriticals(
  unit: EditableUnit,
  equipmentName: string,
  location: string,
  startSlot: number
): Partial<EditableUnit> {
  const criticals = [...(unit.data?.criticals || [])];
  const locationIndex = criticals.findIndex(c => c.location === location);
  
  if (locationIndex === -1) {
    throw new Error(`Location ${location} not found`);
  }
  
  // Find equipment details
  const equipment = unit.data?.weapons_and_equipment?.find(
    w => w.item_name === equipmentName && !w.location
  );
  
  if (!equipment) {
    throw new Error(`Unallocated equipment ${equipmentName} not found`);
  }
  
  // Update equipment location
  const updatedEquipment = unit.data?.weapons_and_equipment?.map(eq => 
    eq === equipment ? { ...eq, location } : eq
  ) || [];
  
  // TODO: Update critical slots based on equipment size
  // For now, just update the data
  
  return {
    data: {
      ...unit.data,
      weapons_and_equipment: updatedEquipment,
    },
  };
}
