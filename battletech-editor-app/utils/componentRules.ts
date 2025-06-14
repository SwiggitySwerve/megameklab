/**
 * Component Rules Engine
 * Handles placement rules, validation, and conflict detection for system components
 */

import {
  SystemComponents,
  EngineType,
  GyroType,
  CockpitType,
  StructureType,
  ArmorType,
  CriticalSlot,
  CriticalAllocationMap,
  ENGINE_SLOT_REQUIREMENTS,
  GYRO_SLOT_REQUIREMENTS,
  COCKPIT_SLOT_REQUIREMENTS,
  STRUCTURE_SLOT_REQUIREMENTS,
  ARMOR_SLOT_REQUIREMENTS,
  calculateIntegratedHeatSinks,
  calculateExternalHeatSinks,
} from '../types/systemComponents';
import { MECH_LOCATIONS } from '../types/editor';

// Standard mech locations and their slot counts
export const LOCATION_SLOT_COUNTS: Record<string, number> = {
  [MECH_LOCATIONS.HEAD]: 6,
  [MECH_LOCATIONS.CENTER_TORSO]: 12,
  [MECH_LOCATIONS.LEFT_TORSO]: 12,
  [MECH_LOCATIONS.RIGHT_TORSO]: 12,
  [MECH_LOCATIONS.LEFT_ARM]: 12,
  [MECH_LOCATIONS.RIGHT_ARM]: 12,
  [MECH_LOCATIONS.LEFT_LEG]: 6,
  [MECH_LOCATIONS.RIGHT_LEG]: 6,
};

// Initialize critical slots with standard actuators and system components
export function initializeCriticalSlots(
  systemComponents: SystemComponents,
  mechTonnage: number
): CriticalAllocationMap {
  const criticalSlots: CriticalAllocationMap = {};
  
  // Initialize all locations with empty slots
  Object.entries(LOCATION_SLOT_COUNTS).forEach(([location, slotCount]) => {
    criticalSlots[location] = Array(slotCount).fill(null).map((_, index) => ({
      index,
      content: null,
      contentType: 'empty',
      isFixed: false,
      isManuallyPlaced: false,
    } as CriticalSlot));
  });
  
  // Place actuators
  placeActuators(criticalSlots);
  
  // Place cockpit components
  placeCockpitComponents(criticalSlots, systemComponents.cockpit.type);
  
  // Place engine
  placeEngine(criticalSlots, systemComponents.engine.type);
  
  // Place gyro
  placeGyro(criticalSlots, systemComponents.gyro.type);
  
  // Place structure (if applicable)
  if (STRUCTURE_SLOT_REQUIREMENTS[systemComponents.structure.type] > 0) {
    placeStructure(criticalSlots, systemComponents.structure.type, mechTonnage);
  }
  
  // Place armor (if applicable)
  const armorSlots = ARMOR_SLOT_REQUIREMENTS[systemComponents.armor.type];
  if (armorSlots.slots > 0) {
    placeArmor(criticalSlots, systemComponents.armor.type, mechTonnage);
  }
  
  return criticalSlots;
}

// Place standard actuators
function placeActuators(criticalSlots: CriticalAllocationMap): void {
  // Arms
  [MECH_LOCATIONS.LEFT_ARM, MECH_LOCATIONS.RIGHT_ARM].forEach(location => {
    const slots = criticalSlots[location];
    if (slots) {
      slots[0] = { index: 0, content: 'Shoulder', contentType: 'system', isFixed: true, isManuallyPlaced: false };
      slots[1] = { index: 1, content: 'Upper Arm Actuator', contentType: 'system', isFixed: true, isManuallyPlaced: false };
      slots[2] = { index: 2, content: 'Lower Arm Actuator', contentType: 'system', isFixed: true, isManuallyPlaced: false };
      slots[3] = { index: 3, content: 'Hand Actuator', contentType: 'system', isFixed: false, isManuallyPlaced: false }; // Can be removed
    }
  });
  
  // Legs
  [MECH_LOCATIONS.LEFT_LEG, MECH_LOCATIONS.RIGHT_LEG].forEach(location => {
    const slots = criticalSlots[location];
    if (slots) {
      slots[0] = { index: 0, content: 'Hip', contentType: 'system', isFixed: true, isManuallyPlaced: false };
      slots[1] = { index: 1, content: 'Upper Leg Actuator', contentType: 'system', isFixed: true, isManuallyPlaced: false };
      slots[2] = { index: 2, content: 'Lower Leg Actuator', contentType: 'system', isFixed: true, isManuallyPlaced: false };
      slots[3] = { index: 3, content: 'Foot Actuator', contentType: 'system', isFixed: true, isManuallyPlaced: false };
    }
  });
}

// Place cockpit components in head (and center torso for torso-mounted)
function placeCockpitComponents(criticalSlots: CriticalAllocationMap, cockpitType: CockpitType): void {
  const headSlots = criticalSlots[MECH_LOCATIONS.HEAD];
  const ctSlots = criticalSlots[MECH_LOCATIONS.CENTER_TORSO];
  
  if (!headSlots) return;
  
  // Standard head components
  if (cockpitType !== 'Torso-Mounted') {
    headSlots[0] = { index: 0, content: 'Life Support', contentType: 'system', isFixed: true, isManuallyPlaced: false };
    headSlots[1] = { index: 1, content: 'Sensors', contentType: 'system', isFixed: true, isManuallyPlaced: false };
    headSlots[2] = { index: 2, content: 'Cockpit', contentType: 'system', isFixed: true, isManuallyPlaced: false };
    headSlots[3] = { index: 3, content: 'Sensors', contentType: 'system', isFixed: true, isManuallyPlaced: false };
    
    // Command Console takes extra slot
    if (cockpitType === 'Command Console') {
      headSlots[4] = { index: 4, content: 'Command Console', contentType: 'system', isFixed: true, isManuallyPlaced: false };
    }
    
    // Primitive cockpit takes 5 slots
    if (cockpitType === 'Primitive') {
      headSlots[4] = { index: 4, content: 'Primitive Cockpit', contentType: 'system', isFixed: true, isManuallyPlaced: false };
    }
  } else {
    // Torso-mounted cockpit
    headSlots[0] = { index: 0, content: 'Life Support', contentType: 'system', isFixed: true, isManuallyPlaced: false };
    headSlots[1] = { index: 1, content: 'Sensors', contentType: 'system', isFixed: true, isManuallyPlaced: false };
    headSlots[2] = { index: 2, content: 'Sensors', contentType: 'system', isFixed: true, isManuallyPlaced: false };
    headSlots[3] = { index: 3, content: 'Sensors', contentType: 'system', isFixed: true, isManuallyPlaced: false };
    headSlots[4] = { index: 4, content: 'Sensors', contentType: 'system', isFixed: true, isManuallyPlaced: false };
    
    // Place cockpit in CT slot 11 (last slot)
    if (ctSlots) {
      ctSlots[11] = { index: 11, content: 'Torso-Mounted Cockpit', contentType: 'system', isFixed: true, isManuallyPlaced: false };
    }
  }
}

// Place engine in appropriate locations
function placeEngine(criticalSlots: CriticalAllocationMap, engineType: EngineType): void {
  const requirements = ENGINE_SLOT_REQUIREMENTS[engineType];
  
  // If requirements not found, use standard engine as default
  if (!requirements) {
    console.warn(`Engine type ${engineType} not found in requirements, using Standard`);
    const standardReqs = ENGINE_SLOT_REQUIREMENTS['Standard'];
    if (!standardReqs) return;
    
    // Place standard engine in center torso
    const ctSlots = criticalSlots[MECH_LOCATIONS.CENTER_TORSO];
    if (ctSlots && ctSlots.length >= 6) {
      for (let i = 0; i < 6; i++) {
        ctSlots[i] = { 
          index: i, 
          content: 'Engine', 
          contentType: 'system', 
          isFixed: true,
          isManuallyPlaced: false 
        };
      }
    }
    return;
  }
  
  // Place in center torso
  const ctSlots = criticalSlots[MECH_LOCATIONS.CENTER_TORSO];
  if (ctSlots && requirements.centerTorso) {
    for (let i = 0; i < requirements.centerTorso && i < ctSlots.length; i++) {
      ctSlots[i] = { 
        index: i, 
        content: 'Engine', 
        contentType: 'system', 
        isFixed: true,
        isManuallyPlaced: false 
      };
    }
  }
  
  // Place in side torsos for XL/Light/XXL engines
  if (requirements.leftTorso && requirements.leftTorso > 0) {
    const ltSlots = criticalSlots[MECH_LOCATIONS.LEFT_TORSO];
    if (ltSlots) {
      for (let i = 0; i < requirements.leftTorso && i < ltSlots.length; i++) {
        ltSlots[i] = { 
          index: i, 
          content: 'Engine', 
          contentType: 'system', 
          isFixed: true,
          isManuallyPlaced: false 
        };
      }
    }
  }
  
  if (requirements.rightTorso && requirements.rightTorso > 0) {
    const rtSlots = criticalSlots[MECH_LOCATIONS.RIGHT_TORSO];
    if (rtSlots) {
      for (let i = 0; i < requirements.rightTorso && i < rtSlots.length; i++) {
        rtSlots[i] = { 
          index: i, 
          content: 'Engine', 
          contentType: 'system', 
          isFixed: true,
          isManuallyPlaced: false 
        };
      }
    }
  }
}

// Place gyro in center torso
function placeGyro(criticalSlots: CriticalAllocationMap, gyroType: GyroType): void {
  const slots = GYRO_SLOT_REQUIREMENTS[gyroType];
  const ctSlots = criticalSlots[MECH_LOCATIONS.CENTER_TORSO];
  
  if (!ctSlots) return;
  
  // Find first available slot after engine
  let startSlot = 0;
  for (let i = 0; i < ctSlots.length; i++) {
    if (ctSlots[i].content !== 'Engine') {
      startSlot = i;
      break;
    }
  }
  
  // Place gyro
  for (let i = 0; i < slots && startSlot + i < ctSlots.length; i++) {
    ctSlots[startSlot + i] = { 
      index: startSlot + i, 
      content: 'Gyro', 
      contentType: 'system', 
      isFixed: true, 
      isManuallyPlaced: false,
      linkedSlots: Array.from({ length: slots }, (_, j) => startSlot + j)
    };
  }
}

// Place structure criticals (like Endo Steel)
function placeStructure(criticalSlots: CriticalAllocationMap, structureType: StructureType, mechTonnage: number): void {
  const totalSlots = STRUCTURE_SLOT_REQUIREMENTS[structureType];
  if (totalSlots === 0) return;
  
  // Distribute structure slots across locations
  // Standard distribution pattern for Endo Steel
  const distribution = getStructureDistribution(structureType, mechTonnage);
  
  Object.entries(distribution).forEach(([location, count]) => {
    const locationSlots = criticalSlots[location];
    if (!locationSlots) return;
    
    let placed = 0;
    for (let i = 0; i < locationSlots.length && placed < count; i++) {
      if (locationSlots[i].contentType === 'empty') {
        locationSlots[i] = {
          index: i,
          content: structureType,
          contentType: 'endo-steel',
          isFixed: true,
          isManuallyPlaced: false,
        };
        placed++;
      }
    }
  });
}

// Place armor criticals (like Ferro-Fibrous)
function placeArmor(criticalSlots: CriticalAllocationMap, armorType: ArmorType, mechTonnage: number): void {
  const armorReq = ARMOR_SLOT_REQUIREMENTS[armorType];
  const totalSlots = armorReq.slots;
  if (totalSlots === 0) return;
  
  // Distribute armor slots across locations
  const distribution = getArmorDistribution(armorType, mechTonnage);
  
  Object.entries(distribution).forEach(([location, count]) => {
    const locationSlots = criticalSlots[location];
    if (!locationSlots) return;
    
    let placed = 0;
    for (let i = 0; i < locationSlots.length && placed < count; i++) {
      if (locationSlots[i].contentType === 'empty') {
        locationSlots[i] = {
          index: i,
          content: armorType,
          contentType: 'ferro-fibrous',
          isFixed: true,
          isManuallyPlaced: false,
        };
        placed++;
      }
    }
  });
}

// Get distribution pattern for structure slots
function getStructureDistribution(structureType: StructureType, mechTonnage: number): Record<string, number> {
  const totalSlots = STRUCTURE_SLOT_REQUIREMENTS[structureType];
  
  // Standard Endo Steel distribution
  if (structureType === 'Endo Steel' && totalSlots === 14) {
    return {
      [MECH_LOCATIONS.LEFT_ARM]: 2,
      [MECH_LOCATIONS.RIGHT_ARM]: 2,
      [MECH_LOCATIONS.LEFT_TORSO]: 3,
      [MECH_LOCATIONS.RIGHT_TORSO]: 3,
      [MECH_LOCATIONS.LEFT_LEG]: 2,
      [MECH_LOCATIONS.RIGHT_LEG]: 2,
    };
  }
  
  // Clan Endo Steel distribution
  if (structureType === 'Endo Steel (Clan)' && totalSlots === 7) {
    return {
      [MECH_LOCATIONS.LEFT_TORSO]: 2,
      [MECH_LOCATIONS.RIGHT_TORSO]: 2,
      [MECH_LOCATIONS.LEFT_LEG]: 1,
      [MECH_LOCATIONS.RIGHT_LEG]: 1,
      [MECH_LOCATIONS.HEAD]: 1,
    };
  }
  
  return {};
}

// Get distribution pattern for armor slots
function getArmorDistribution(armorType: ArmorType, mechTonnage: number): Record<string, number> {
  const armorReq = ARMOR_SLOT_REQUIREMENTS[armorType];
  const totalSlots = armorReq.slots;
  
  // Standard Ferro-Fibrous distribution (14 slots)
  if (armorType === 'Ferro-Fibrous' && totalSlots === 14) {
    return {
      [MECH_LOCATIONS.LEFT_ARM]: 2,
      [MECH_LOCATIONS.RIGHT_ARM]: 2,
      [MECH_LOCATIONS.LEFT_TORSO]: 3,
      [MECH_LOCATIONS.RIGHT_TORSO]: 3,
      [MECH_LOCATIONS.LEFT_LEG]: 2,
      [MECH_LOCATIONS.RIGHT_LEG]: 2,
    };
  }
  
  // Clan Ferro-Fibrous distribution (7 slots)
  if ((armorType === 'Ferro-Fibrous (Clan)' || armorType === 'Light Ferro-Fibrous') && totalSlots === 7) {
    return {
      [MECH_LOCATIONS.LEFT_TORSO]: 2,
      [MECH_LOCATIONS.RIGHT_TORSO]: 2,
      [MECH_LOCATIONS.LEFT_LEG]: 1,
      [MECH_LOCATIONS.RIGHT_LEG]: 1,
      [MECH_LOCATIONS.CENTER_TORSO]: 1,
    };
  }
  
  // Heavy Ferro-Fibrous distribution (21 slots)
  if (armorType === 'Heavy Ferro-Fibrous' && totalSlots === 21) {
    return {
      [MECH_LOCATIONS.LEFT_ARM]: 3,
      [MECH_LOCATIONS.RIGHT_ARM]: 3,
      [MECH_LOCATIONS.LEFT_TORSO]: 4,
      [MECH_LOCATIONS.RIGHT_TORSO]: 4,
      [MECH_LOCATIONS.LEFT_LEG]: 2,
      [MECH_LOCATIONS.RIGHT_LEG]: 2,
      [MECH_LOCATIONS.CENTER_TORSO]: 2,
      [MECH_LOCATIONS.HEAD]: 1,
    };
  }
  
  // Stealth armor distribution (12 slots)
  if (armorType === 'Stealth' && totalSlots === 12) {
    return {
      [MECH_LOCATIONS.LEFT_ARM]: 2,
      [MECH_LOCATIONS.RIGHT_ARM]: 2,
      [MECH_LOCATIONS.LEFT_TORSO]: 2,
      [MECH_LOCATIONS.RIGHT_TORSO]: 2,
      [MECH_LOCATIONS.LEFT_LEG]: 2,
      [MECH_LOCATIONS.RIGHT_LEG]: 2,
    };
  }
  
  return {};
}

// Validate component placement
export function validateComponentPlacement(
  criticalSlots: CriticalAllocationMap,
  systemComponents: SystemComponents
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate engine placement
  const engineReq = ENGINE_SLOT_REQUIREMENTS[systemComponents.engine.type];
  const ctEngineSlots = criticalSlots[MECH_LOCATIONS.CENTER_TORSO]?.filter(s => s.content === 'Engine').length || 0;
  if (ctEngineSlots !== engineReq.centerTorso) {
    errors.push(`Engine requires ${engineReq.centerTorso} CT slots but has ${ctEngineSlots}`);
  }
  
  // Validate gyro placement
  const gyroSlots = criticalSlots[MECH_LOCATIONS.CENTER_TORSO]?.filter(s => s.content === 'Gyro').length || 0;
  const requiredGyroSlots = GYRO_SLOT_REQUIREMENTS[systemComponents.gyro.type];
  if (gyroSlots !== requiredGyroSlots) {
    errors.push(`Gyro requires ${requiredGyroSlots} slots but has ${gyroSlots}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Generate heat sink equipment items
export function generateHeatSinkItems(
  heatSinkType: string,
  totalCount: number,
  engineRating: number
): Array<{ name: string; type: string; slots: number; weight: number }> {
  const integrated = calculateIntegratedHeatSinks(engineRating);
  const external = calculateExternalHeatSinks(totalCount, engineRating);
  
  if (external <= 0) return [];
  
  const items: Array<{ name: string; type: string; slots: number; weight: number }> = [];
  
  for (let i = 0; i < external; i++) {
    items.push({
      name: heatSinkType === 'Double' ? 'Double Heat Sink' : 'Heat Sink',
      type: 'heat-sink',
      slots: heatSinkType === 'Double' ? 3 : 1,
      weight: 1,
    });
  }
  
  return items;
}
