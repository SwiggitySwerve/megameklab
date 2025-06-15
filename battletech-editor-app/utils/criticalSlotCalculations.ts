import { EditableUnit, MECH_LOCATIONS } from '../types/editor';

// Types for conflict reporting
export interface ConflictReport {
  conflictsByLocation: Record<string, number[]>;
  totalConflicts: number;
  affectedEquipment: Array<{
    location: string;
    slotIndex: number;
    equipment: string;
  }>;
}

/**
 * Calculate complete internal structure for all locations based on unit configuration
 */
export function calculateCompleteInternalStructure(unit: EditableUnit): Record<string, string[]> {
  const structure: Record<string, string[]> = {};
  
  // Initialize all locations
  Object.values(MECH_LOCATIONS).forEach(location => {
    structure[location] = [];
  });
  
  // 1. Base actuators/components (always present)
  structure[MECH_LOCATIONS.HEAD] = ['Life Support', 'Sensors', 'Cockpit'];
  structure[MECH_LOCATIONS.LEFT_ARM] = ['Shoulder', 'Upper Arm Actuator', 'Lower Arm Actuator'];
  structure[MECH_LOCATIONS.RIGHT_ARM] = ['Shoulder', 'Upper Arm Actuator', 'Lower Arm Actuator'];
  structure[MECH_LOCATIONS.LEFT_LEG] = ['Hip', 'Upper Leg Actuator', 'Lower Leg Actuator', 'Foot Actuator'];
  structure[MECH_LOCATIONS.RIGHT_LEG] = ['Hip', 'Upper Leg Actuator', 'Lower Leg Actuator', 'Foot Actuator'];
  
  // 2. Add hand actuators if present
  if (unit.systemComponents?.leftArmActuators?.hasHand !== false) {
    structure[MECH_LOCATIONS.LEFT_ARM].push('Hand Actuator');
  }
  if (unit.systemComponents?.rightArmActuators?.hasHand !== false) {
    structure[MECH_LOCATIONS.RIGHT_ARM].push('Hand Actuator');
  }
  
  // 3. Engine slots
  const engineType = unit.systemComponents?.engine?.type || 'Standard';
  const engineRating = unit.systemComponents?.engine?.rating || 300;
  addEngineSlots(structure, engineType, engineRating);
  
  // 4. Gyro slots (must come after engine)
  const gyroType = unit.systemComponents?.gyro?.type || 'Standard';
  addGyroSlots(structure, gyroType);
  
  // 5. Additional engine slots for XL/Light/XXL (after gyro)
  addAdditionalEngineSlots(structure, engineType);
  
  // 6. Cockpit extras
  const cockpitType = unit.systemComponents?.cockpit?.type || 'Standard';
  addCockpitSlots(structure, cockpitType);
  
  // 7. Structure type (Endo-Steel, etc.)
  const structureType = unit.systemComponents?.structure?.type || 'Standard';
  addStructureSlots(structure, structureType);
  
  // 8. Armor type (Ferro-Fibrous, etc.)
  const armorType = unit.systemComponents?.armor?.type || 'Standard';
  const techBase = unit.tech_base || 'Inner Sphere';
  addArmorSlots(structure, armorType, techBase);
  
  // 9. Life support extras
  if (cockpitType !== 'Torso-Mounted') {
    structure[MECH_LOCATIONS.HEAD].push('Life Support');
  }
  
  return structure;
}

/**
 * Add engine slots to the structure
 */
function addEngineSlots(structure: Record<string, string[]>, engineType: string, rating: number) {
  // Center torso always gets 3 engine slots
  structure[MECH_LOCATIONS.CENTER_TORSO].push('Engine', 'Engine', 'Engine');
  
  // XL/Light/XXL engines need side torso slots
  if (engineType === 'XL' || engineType === 'Light') {
    structure[MECH_LOCATIONS.LEFT_TORSO].unshift('Engine', 'Engine', 'Engine');
    structure[MECH_LOCATIONS.RIGHT_TORSO].unshift('Engine', 'Engine', 'Engine');
  } else if (engineType === 'XXL') {
    structure[MECH_LOCATIONS.LEFT_TORSO].unshift('Engine', 'Engine', 'Engine', 'Engine', 'Engine', 'Engine');
    structure[MECH_LOCATIONS.RIGHT_TORSO].unshift('Engine', 'Engine', 'Engine', 'Engine', 'Engine', 'Engine');
  }
}

/**
 * Add gyro slots to the center torso
 */
function addGyroSlots(structure: Record<string, string[]>, gyroType: string) {
  const slots = getGyroSlotCount(gyroType);
  const gyroName = gyroType === 'Standard' ? 'Gyro' : `${gyroType} Gyro`;
  
  for (let i = 0; i < slots; i++) {
    structure[MECH_LOCATIONS.CENTER_TORSO].push(gyroName);
  }
}

/**
 * Add additional engine slots after gyro for XL/Light/XXL engines
 */
function addAdditionalEngineSlots(structure: Record<string, string[]>, engineType: string) {
  const additionalSlots = getAdditionalEngineSlots(engineType);
  for (let i = 0; i < additionalSlots; i++) {
    structure[MECH_LOCATIONS.CENTER_TORSO].push('Engine');
  }
}

/**
 * Get the number of gyro slots based on type
 */
export function getGyroSlotCount(gyroType: string): number {
  switch (gyroType) {
    case 'XL': return 6;
    case 'Compact': return 2;
    case 'Heavy-Duty': return 4;
    case 'Standard':
    default: return 4;
  }
}

/**
 * Get additional engine slots needed after gyro
 */
function getAdditionalEngineSlots(engineType: string): number {
  switch (engineType) {
    case 'XL': return 3;      // Slots 10-12 in CT
    case 'Light': return 2;   // Slots 10-11 in CT
    case 'XXL': return 4;     // Would need slots 10-13 (overflow!)
    case 'Standard':
    default: return 0;
  }
}

/**
 * Add cockpit-related slots
 */
function addCockpitSlots(structure: Record<string, string[]>, cockpitType: string) {
  if (cockpitType === 'Torso-Mounted') {
    // Torso-mounted cockpit takes slots in CT
    structure[MECH_LOCATIONS.CENTER_TORSO].push('Torso Cockpit', 'Torso Cockpit');
    // Remove cockpit from head
    const headIndex = structure[MECH_LOCATIONS.HEAD].indexOf('Cockpit');
    if (headIndex > -1) {
      structure[MECH_LOCATIONS.HEAD].splice(headIndex, 1);
    }
  } else if (cockpitType === 'Small') {
    // Small cockpit saves space
    // Implementation depends on specific rules
  }
}

/**
 * Add internal structure type slots
 */
function addStructureSlots(structure: Record<string, string[]>, structureType: string) {
  if (structureType === 'Endo-Steel') {
    // Endo-Steel takes 14 slots distributed across the mech
    // Typical distribution pattern
    structure[MECH_LOCATIONS.LEFT_ARM].push('Endo-Steel', 'Endo-Steel');
    structure[MECH_LOCATIONS.RIGHT_ARM].push('Endo-Steel', 'Endo-Steel');
    structure[MECH_LOCATIONS.LEFT_LEG].push('Endo-Steel', 'Endo-Steel');
    structure[MECH_LOCATIONS.RIGHT_LEG].push('Endo-Steel', 'Endo-Steel');
    structure[MECH_LOCATIONS.LEFT_TORSO].push('Endo-Steel', 'Endo-Steel', 'Endo-Steel');
    structure[MECH_LOCATIONS.RIGHT_TORSO].push('Endo-Steel', 'Endo-Steel', 'Endo-Steel');
  } else if (structureType === 'Composite') {
    // Composite structure doesn't take critical slots
  } else if (structureType === 'Reinforced') {
    // Reinforced takes 2 slots per location
    Object.keys(structure).forEach(location => {
      if (location !== MECH_LOCATIONS.HEAD) {
        structure[location].push('Reinforced Structure', 'Reinforced Structure');
      }
    });
  }
}

/**
 * Add armor type slots
 */
function addArmorSlots(structure: Record<string, string[]>, armorType: string, techBase: string) {
  if (armorType === 'Ferro-Fibrous') {
    const slots = techBase === 'Clan' ? 7 : 14;
    // Distribute FF armor slots
    if (techBase === 'Inner Sphere') {
      // IS FF: 14 slots
      structure[MECH_LOCATIONS.LEFT_ARM].push('Ferro-Fibrous', 'Ferro-Fibrous');
      structure[MECH_LOCATIONS.RIGHT_ARM].push('Ferro-Fibrous', 'Ferro-Fibrous');
      structure[MECH_LOCATIONS.LEFT_LEG].push('Ferro-Fibrous', 'Ferro-Fibrous');
      structure[MECH_LOCATIONS.RIGHT_LEG].push('Ferro-Fibrous', 'Ferro-Fibrous');
      structure[MECH_LOCATIONS.LEFT_TORSO].push('Ferro-Fibrous', 'Ferro-Fibrous', 'Ferro-Fibrous');
      structure[MECH_LOCATIONS.RIGHT_TORSO].push('Ferro-Fibrous', 'Ferro-Fibrous', 'Ferro-Fibrous');
    } else {
      // Clan FF: 7 slots
      structure[MECH_LOCATIONS.LEFT_TORSO].push('Ferro-Fibrous', 'Ferro-Fibrous');
      structure[MECH_LOCATIONS.RIGHT_TORSO].push('Ferro-Fibrous', 'Ferro-Fibrous');
      structure[MECH_LOCATIONS.LEFT_LEG].push('Ferro-Fibrous');
      structure[MECH_LOCATIONS.RIGHT_LEG].push('Ferro-Fibrous');
      structure[MECH_LOCATIONS.CENTER_TORSO].push('Ferro-Fibrous');
    }
  } else if (armorType === 'Light Ferro-Fibrous') {
    // Light FF: 7 slots
    structure[MECH_LOCATIONS.LEFT_TORSO].push('Light Ferro-Fibrous', 'Light Ferro-Fibrous');
    structure[MECH_LOCATIONS.RIGHT_TORSO].push('Light Ferro-Fibrous', 'Light Ferro-Fibrous');
    structure[MECH_LOCATIONS.LEFT_ARM].push('Light Ferro-Fibrous');
    structure[MECH_LOCATIONS.RIGHT_ARM].push('Light Ferro-Fibrous');
    structure[MECH_LOCATIONS.CENTER_TORSO].push('Light Ferro-Fibrous');
  } else if (armorType === 'Heavy Ferro-Fibrous') {
    // Heavy FF: 21 slots
    // This is a lot of slots - simplified distribution
    Object.keys(structure).forEach(location => {
      structure[location].push('Heavy Ferro-Fibrous', 'Heavy Ferro-Fibrous', 'Heavy Ferro-Fibrous');
    });
  }
}

/**
 * Rebuild critical slots with new internal structure
 */
export function rebuildCriticalSlots(
  unit: EditableUnit,
  newInternalStructure: Record<string, string[]>
): { 
  newCriticalSlots: any,
  removedEquipment: Array<{ location: string, equipment: any }>
} {
  const newCriticalSlots: any = {};
  const removedEquipment: Array<{ location: string, equipment: any }> = [];
  
  // Get critical slot counts for each location
  const SLOT_COUNTS: Record<string, number> = {
    [MECH_LOCATIONS.HEAD]: 6,
    [MECH_LOCATIONS.LEFT_TORSO]: 12,
    [MECH_LOCATIONS.CENTER_TORSO]: 12,
    [MECH_LOCATIONS.RIGHT_TORSO]: 12,
    [MECH_LOCATIONS.LEFT_ARM]: 12,
    [MECH_LOCATIONS.RIGHT_ARM]: 12,
    [MECH_LOCATIONS.LEFT_LEG]: 6,
    [MECH_LOCATIONS.RIGHT_LEG]: 6,
  };
  
  // Get old internal structure to understand current layout
  const oldInternalStructure = calculateCompleteInternalStructure(unit);
  
  // For each location
  Object.entries(SLOT_COUNTS).forEach(([location, totalSlots]) => {
    const newInternalSlots = newInternalStructure[location] || [];
    const oldInternalSlots = oldInternalStructure[location] || [];
    const currentEquipmentArray = (unit.criticalSlots as any)?.[location] || [];
    
    // Calculate available slots
    const oldAvailableSlots = totalSlots - oldInternalSlots.length;
    const newAvailableSlots = totalSlots - newInternalSlots.length;
    
    // Create new equipment array
    const newEquipmentSlots: any[] = new Array(Math.max(0, newAvailableSlots)).fill(null);
    
    // Process each equipment item
    currentEquipmentArray.forEach((item: any, equipmentIndex: number) => {
      if (item && item !== '- Empty -' && item !== null) {
        // Calculate the absolute slot position in the UI
        // equipmentIndex 0 = first slot after internal structure
        const absoluteSlotPosition = oldInternalSlots.length + equipmentIndex;
        
        console.log(`Processing equipment "${item}" at equipment index ${equipmentIndex}, absolute position ${absoluteSlotPosition}`);
        
        // Check if this absolute position conflicts with new internal structure
        if (absoluteSlotPosition < newInternalSlots.length) {
          // This slot is now occupied by internal structure - remove equipment
          console.log(`  -> Conflicts with new internal structure (slot ${absoluteSlotPosition} < ${newInternalSlots.length})`);
          removedEquipment.push({ location, equipment: item });
        } else {
          // Calculate new equipment array index
          const newEquipmentIndex = absoluteSlotPosition - newInternalSlots.length;
          
          if (newEquipmentIndex >= 0 && newEquipmentIndex < newAvailableSlots) {
            // Equipment can be placed in the new structure
            console.log(`  -> Placing at new equipment index ${newEquipmentIndex}`);
            newEquipmentSlots[newEquipmentIndex] = item;
          } else {
            // No room in new structure - add to removed list
            console.log(`  -> No room in new structure`);
            removedEquipment.push({ location, equipment: item });
          }
        }
      }
    });
    
    newCriticalSlots[location] = newEquipmentSlots;
  });
  
  return { newCriticalSlots, removedEquipment };
}

/**
 * Handle system configuration changes
 */
export function handleSystemChange(
  unit: EditableUnit,
  changeType: 'engine' | 'gyro' | 'cockpit' | 'structure' | 'armor',
  newValue: string
): { updatedUnit: EditableUnit, removedEquipment: Array<{ location: string, equipment: any }> } {
  // Create updated unit with new system value
  const updatedUnit = { ...unit };
  
  // Ensure systemComponents exists
  if (!updatedUnit.systemComponents) {
    updatedUnit.systemComponents = {
      engine: { type: 'Standard', rating: 300 },
      gyro: { type: 'Standard' },
      cockpit: { type: 'Standard' },
      structure: { type: 'Standard' },
      armor: { type: 'Standard' },
      heatSinks: { type: 'Single', total: 10, engineIntegrated: 10, externalRequired: 0 }
    };
  }
  
  // Update the appropriate component
  switch (changeType) {
    case 'engine':
      updatedUnit.systemComponents.engine.type = newValue as any;
      break;
    case 'gyro':
      updatedUnit.systemComponents.gyro.type = newValue as any;
      break;
    case 'cockpit':
      updatedUnit.systemComponents.cockpit.type = newValue as any;
      break;
    case 'structure':
      updatedUnit.systemComponents.structure.type = newValue as any;
      break;
    case 'armor':
      updatedUnit.systemComponents.armor.type = newValue as any;
      break;
  }
  
  // Calculate new internal structure
  const newInternalStructure = calculateCompleteInternalStructure(updatedUnit);
  
  // Rebuild critical slots with new structure
  const { newCriticalSlots, removedEquipment } = rebuildCriticalSlots(unit, newInternalStructure);
  
  // Update the unit with new critical slots
  updatedUnit.criticalSlots = newCriticalSlots;
  
  // Add removed equipment to unallocated list
  if (removedEquipment.length > 0 && updatedUnit.unallocatedEquipment) {
    updatedUnit.unallocatedEquipment = [
      ...(updatedUnit.unallocatedEquipment || []),
      ...removedEquipment.map(item => item.equipment)
    ];
  }
  
  return { updatedUnit, removedEquipment };
}
