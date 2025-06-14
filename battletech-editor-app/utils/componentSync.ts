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
  
  // Check for displaced equipment
  const displacedEquipment = findDisplacedEquipment(unit, criticals);
  
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
  
  return {
    systemComponents: updatedComponents,
    criticalAllocations,
    data: {
      ...unit.data,
      gyro: {
        type: newGyroType,
      },
      criticals,
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
  
  return {
    systemComponents: updatedComponents,
    criticalAllocations,
    data: {
      ...unit.data,
      structure: {
        type: newStructureType,
      },
      criticals,
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
