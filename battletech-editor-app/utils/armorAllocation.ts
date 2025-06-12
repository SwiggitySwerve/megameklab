import { EditableUnit } from '../types/editor';
import { EQUIPMENT_DATABASE } from './equipmentData';
import { getArmorType } from './armorTypes';

export interface ArmorAllocation {
  [location: string]: {
    front: number;
    rear?: number;
  };
}

// Internal structure table based on mech tonnage
const INTERNAL_STRUCTURE_TABLE: { [tonnage: number]: { [location: string]: number } } = {
  20: { HEAD: 3, CT: 6, LT: 5, RT: 5, LA: 3, RA: 3, LL: 4, RL: 4 },
  25: { HEAD: 3, CT: 8, LT: 6, RT: 6, LA: 4, RA: 4, LL: 6, RL: 6 },
  30: { HEAD: 3, CT: 10, LT: 7, RT: 7, LA: 5, RA: 5, LL: 7, RL: 7 },
  35: { HEAD: 3, CT: 11, LT: 8, RT: 8, LA: 6, RA: 6, LL: 8, RL: 8 },
  40: { HEAD: 3, CT: 12, LT: 10, RT: 10, LA: 6, RA: 6, LL: 10, RL: 10 },
  45: { HEAD: 3, CT: 14, LT: 11, RT: 11, LA: 7, RA: 7, LL: 11, RL: 11 },
  50: { HEAD: 3, CT: 16, LT: 12, RT: 12, LA: 8, RA: 8, LL: 12, RL: 12 },
  55: { HEAD: 3, CT: 18, LT: 13, RT: 13, LA: 9, RA: 9, LL: 13, RL: 13 },
  60: { HEAD: 3, CT: 20, LT: 14, RT: 14, LA: 10, RA: 10, LL: 14, RL: 14 },
  65: { HEAD: 3, CT: 21, LT: 15, RT: 15, LA: 10, RA: 10, LL: 15, RL: 15 },
  70: { HEAD: 3, CT: 22, LT: 15, RT: 15, LA: 11, RA: 11, LL: 15, RL: 15 },
  75: { HEAD: 3, CT: 23, LT: 16, RT: 16, LA: 12, RA: 12, LL: 16, RL: 16 },
  80: { HEAD: 3, CT: 25, LT: 17, RT: 17, LA: 13, RA: 13, LL: 17, RL: 17 },
  85: { HEAD: 3, CT: 27, LT: 18, RT: 18, LA: 14, RA: 14, LL: 18, RL: 18 },
  90: { HEAD: 3, CT: 29, LT: 19, RT: 19, LA: 15, RA: 15, LL: 19, RL: 19 },
  95: { HEAD: 3, CT: 30, LT: 20, RT: 20, LA: 16, RA: 16, LL: 20, RL: 20 },
  100: { HEAD: 3, CT: 31, LT: 21, RT: 21, LA: 17, RA: 17, LL: 21, RL: 21 },
};

export function calculateMaxArmorPoints(unit: EditableUnit): number {
  let maxArmor = 0;
  
  // Head has special armor calculation
  const headMax = unit.mass > 100 ? 12 : 9; // Superheavy check
  maxArmor += headMax;
  
  // Other locations get 2x internal structure
  const locations = ['CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'];
  locations.forEach(loc => {
    const internalStructure = getInternalStructure(unit, loc);
    maxArmor += internalStructure * 2;
  });
  
  return maxArmor;
}

// Helper function to get internal structure for a location
function getInternalStructure(unit: EditableUnit, location: string): number {
  // Find the appropriate tonnage in the table
  const tonnage = unit.mass || 50;
  let tableEntry: { [location: string]: number } | undefined;
  
  // Find exact match or closest lower tonnage
  const tonnages = Object.keys(INTERNAL_STRUCTURE_TABLE).map(Number).sort((a, b) => a - b);
  for (let i = tonnages.length - 1; i >= 0; i--) {
    if (tonnages[i] <= tonnage) {
      tableEntry = INTERNAL_STRUCTURE_TABLE[tonnages[i]];
      break;
    }
  }
  
  if (!tableEntry) {
    tableEntry = INTERNAL_STRUCTURE_TABLE[20]; // Default to 20-ton values
  }
  
  return tableEntry[location] || 10;
}

export function autoAllocateArmor(unit: EditableUnit): ArmorAllocation {
  const armorLocations = unit.data?.armor?.locations || [];
  const totalArmorPoints = unit.data?.armor?.total_armor_points || 0;
  
  if (totalArmorPoints === 0) {
    return createEmptyAllocation();
  }
  
  const maxArmor = calculateMaxArmorPoints(unit);
  
  // Calculate percentage of max armor we can allocate
  const percent = Math.min(1, totalArmorPoints / maxArmor);
  
  // Head gets 5x percentage (capped at max) - MegaMekLab formula
  const headMax = unit.mass > 100 ? 12 : 9;
  const headArmor = Math.min(Math.floor(percent * headMax * 5), headMax);
  
  let remainingPoints = totalArmorPoints - headArmor;
  const remainingMaxArmor = maxArmor - headMax;
  
  // Recalculate percentage for remaining locations
  const remainingPercent = remainingMaxArmor > 0 ? remainingPoints / remainingMaxArmor : 0;
  
  const allocation: ArmorAllocation = {
    HEAD: { front: headArmor }
  };
  
  // Allocate to other locations
  const locations = [
    { id: 'CT', hasRear: true },
    { id: 'LT', hasRear: true },
    { id: 'RT', hasRear: true },
    { id: 'LA', hasRear: false },
    { id: 'RA', hasRear: false },
    { id: 'LL', hasRear: false },
    { id: 'RL', hasRear: false }
  ];
  
  locations.forEach(loc => {
    const internal = getInternalStructure(unit, loc.id);
    const maxLocationArmor = internal * 2;
    const allocatedArmor = Math.min(Math.floor(maxLocationArmor * remainingPercent), remainingPoints);
    
    if (loc.hasRear) {
      // MegaMekLab: 75% front, 25% rear for torso locations
      let rear = Math.floor(allocatedArmor * 0.25);
      let front = Math.ceil(allocatedArmor * 0.75);
      
      // Make sure rounding doesn't add an extra point
      if (rear + front > allocatedArmor) {
        if (front > rear * 3) {
          front--;
        } else {
          rear--;
        }
      }
      
      allocation[loc.id] = { front, rear };
      remainingPoints -= (front + rear);
    } else {
      allocation[loc.id] = { front: Math.floor(allocatedArmor) };
      remainingPoints -= Math.floor(allocatedArmor);
    }
  });
  
  // Allocate any leftover points using MegaMekLab logic
  if (remainingPoints > 0) {
    return allocateLeftoverPoints(unit, remainingPoints, allocation);
  }
  
  return allocation;
}

export function allocateLeftoverPoints(
  unit: EditableUnit,
  points: number,
  currentAllocation: ArmorAllocation
): ArmorAllocation {
  const allocation = { ...currentAllocation };
  const headMax = unit.mass > 100 ? 12 : 9;
  
  while (points >= 1) {
    // If we have 2+ points, allocate to symmetric locations
    if (points >= 2) {
      // MegaMekLab priority: torso pairs first
      if (canAddToLocation(unit, allocation, 'LT') && canAddToLocation(unit, allocation, 'RT')) {
        allocation.LT.front += 1;
        allocation.RT.front += 1;
        points -= 2;
        continue;
      }
      
      // Then leg pairs
      if (canAddToLocation(unit, allocation, 'LL') && canAddToLocation(unit, allocation, 'RL')) {
        allocation.LL.front += 1;
        allocation.RL.front += 1;
        points -= 2;
        continue;
      }
      
      // Then arm pairs
      if (canAddToLocation(unit, allocation, 'LA') && canAddToLocation(unit, allocation, 'RA')) {
        allocation.LA.front += 1;
        allocation.RA.front += 1;
        points -= 2;
        continue;
      }
    }
    
    // Single point allocation
    // Special case: if only 1 point left and head & CT are at max, remove 1 from CT
    if (points === 1 && allocation.HEAD.front === headMax) {
      const ctMax = getInternalStructure(unit, 'CT') * 2;
      const ctTotal = allocation.CT.front + (allocation.CT.rear || 0);
      if (ctTotal === ctMax) {
        // Remove 1 from CT to allow symmetric locations to get extra
        allocation.CT.front -= 1;
        points += 1;
        continue;
      }
    }
    
    // First try head
    if (allocation.HEAD.front < headMax) {
      allocation.HEAD.front += 1;
      points -= 1;
      continue;
    }
    
    // Then balance uneven allocations in MegaMekLab order
    const ltTotal = allocation.LT.front + (allocation.LT.rear || 0);
    const rtTotal = allocation.RT.front + (allocation.RT.rear || 0);
    const laTotal = allocation.LA.front;
    const raTotal = allocation.RA.front;
    const llTotal = allocation.LL.front;
    const rlTotal = allocation.RL.front;
    
    if (ltTotal < rtTotal && canAddToLocation(unit, allocation, 'LT')) {
      allocation.LT.front += 1;
      points -= 1;
      continue;
    } else if (rtTotal < ltTotal && canAddToLocation(unit, allocation, 'RT')) {
      allocation.RT.front += 1;
      points -= 1;
      continue;
    } else if (raTotal < laTotal && canAddToLocation(unit, allocation, 'RA')) {
      allocation.RA.front += 1;
      points -= 1;
      continue;
    } else if (laTotal < raTotal && canAddToLocation(unit, allocation, 'LA')) {
      allocation.LA.front += 1;
      points -= 1;
      continue;
    } else if (rlTotal < llTotal && canAddToLocation(unit, allocation, 'RL')) {
      allocation.RL.front += 1;
      points -= 1;
      continue;
    } else if (llTotal < rlTotal && canAddToLocation(unit, allocation, 'LL')) {
      allocation.LL.front += 1;
      points -= 1;
      continue;
    }
    
    // If nothing is uneven, add to CT
    if (canAddToLocation(unit, allocation, 'CT')) {
      allocation.CT.front += 1;
      points -= 1;
      continue;
    }
    
    // If we can't allocate anymore, break
    break;
  }
  
  return allocation;
}

function canAddToLocation(unit: EditableUnit, allocation: ArmorAllocation, location: string): boolean {
  const internal = getInternalStructure(unit, location);
  const maxArmor = internal * 2;
  const currentArmor = (allocation[location]?.front || 0) + (allocation[location]?.rear || 0);
  return currentArmor < maxArmor;
}

function findUnbalancedLocation(allocation: ArmorAllocation): string | null {
  // Check for imbalances in symmetric locations
  const pairs = [
    ['LT', 'RT'],
    ['LA', 'RA'],
    ['LL', 'RL']
  ];
  
  for (const [left, right] of pairs) {
    const leftTotal = (allocation[left]?.front || 0) + (allocation[left]?.rear || 0);
    const rightTotal = (allocation[right]?.front || 0) + (allocation[right]?.rear || 0);
    
    if (leftTotal < rightTotal) return left;
    if (rightTotal < leftTotal) return right;
  }
  
  return null;
}

function createEmptyAllocation(): ArmorAllocation {
  return {
    HEAD: { front: 0 },
    CT: { front: 0, rear: 0 },
    LT: { front: 0, rear: 0 },
    RT: { front: 0, rear: 0 },
    LA: { front: 0 },
    RA: { front: 0 },
    LL: { front: 0 },
    RL: { front: 0 }
  };
}

export function maximizeArmor(unit: EditableUnit): number {
  const maxTonnage = calculateMaxArmorTonnage(unit);
  return maxTonnage;
}

export function calculateMaxArmorTonnage(unit: EditableUnit): number {
  // Maximum armor is based on internal structure
  const maxPoints = calculateMaxArmorPoints(unit);
  
  // Get actual armor type from unit
  const armorTypeId = unit.armorAllocation?.['Center Torso']?.type?.id || 'standard';
  const armorType = getArmorType(armorTypeId);
  const pointsPerTon = armorType.pointsPerTon;
  
  // Calculate weight and round to nearest half-ton
  const armorWeight = maxPoints / pointsPerTon;
  return Math.ceil(armorWeight * 2) / 2;
}

export function calculateRemainingTonnage(unit: EditableUnit): number {
  const totalTonnage = unit.mass || 0;
  
  // Calculate current used tonnage - this is a simplified version
  let usedTonnage = 0;
  
  // Structure weight
  const structureType = unit.data?.structure?.type || 'standard';
  if (structureType === 'standard') {
    usedTonnage += totalTonnage * 0.1;
  } else if (structureType === 'endo-steel') {
    usedTonnage += totalTonnage * 0.05;
  }
  
  // Engine weight (very simplified - should use actual engine tables)
  const engineRating = unit.data?.engine?.rating || 200;
  const engineType = unit.data?.engine?.type || 'standard';
  let engineWeight = engineRating / 5.0; // Simplified standard engine weight
  
  if (engineType === 'xl') {
    engineWeight *= 0.5;
  } else if (engineType === 'light') {
    engineWeight *= 0.75;
  } else if (engineType === 'compact') {
    engineWeight *= 1.5;
  }
  
  usedTonnage += engineWeight;
  
  // Gyro (varies by type)
  const gyroType = unit.data?.gyro?.type || 'standard';
  const gyroWeights: { [key: string]: number } = {
    'standard': Math.ceil(engineRating / 100.0),
    'compact': Math.ceil(engineRating / 100.0) * 1.5,
    'heavy-duty': Math.ceil(engineRating / 100.0) * 2,
    'xl': Math.ceil(engineRating / 100.0) * 0.5,
    'none': 0
  };
  usedTonnage += gyroWeights[gyroType] || Math.ceil(engineRating / 100.0);
  
  // Cockpit
  const cockpitType = unit.data?.cockpit?.type || 'standard';
  const cockpitWeights: { [key: string]: number } = {
    'standard': 3,
    'small': 2,
    'command-console': 3,
    'torso-mounted': 4
  };
  usedTonnage += cockpitWeights[cockpitType] || 3;
  
  // Heat sinks (beyond free engine sinks)
  const totalHeatSinks = unit.data?.heat_sinks?.count || 10;
  const engineHeatSinks = Math.min(10, Math.floor(engineRating / 25));
  const extraHeatSinks = Math.max(0, totalHeatSinks - engineHeatSinks);
  const heatSinkType = unit.data?.heat_sinks?.type || 'single';
  const heatSinkWeight = heatSinkType === 'single' ? 1 : 1;
  usedTonnage += extraHeatSinks * heatSinkWeight;
  
  // Equipment
  (unit.data?.weapons_and_equipment || []).forEach(item => {
    const equipment = EQUIPMENT_DATABASE.find(e => e.name === item.item_name);
    if (equipment) {
      usedTonnage += equipment.weight || 0;
    }
  });
  
  // Current armor
  const currentArmorPoints = unit.data?.armor?.total_armor_points || 0;
  const armorTypeId = unit.armorAllocation?.['Center Torso']?.type?.id || 'standard';
  const armorType = getArmorType(armorTypeId);
  const pointsPerTon = armorType.pointsPerTon;
  usedTonnage += currentArmorPoints / pointsPerTon;
  
  // Jump jets
  const jumpMP = unit.data?.movement?.jump_mp || 0;
  const jumpJetWeight = jumpMP * (totalTonnage <= 55 ? 0.5 : totalTonnage <= 85 ? 1.0 : 2.0);
  usedTonnage += jumpJetWeight;
  
  // Round to nearest half-ton for comparison
  const remaining = totalTonnage - usedTonnage;
  return Math.floor(remaining * 2) / 2;
}

export function useRemainingTonnageForArmor(unit: EditableUnit): number {
  const remainingTonnage = calculateRemainingTonnage(unit);
  
  // Get current armor tonnage
  const currentArmorPoints = unit.data?.armor?.total_armor_points || 0;
  const armorTypeId = unit.armorAllocation?.['Center Torso']?.type?.id || 'standard';
  const armorType = getArmorType(armorTypeId);
  const pointsPerTon = armorType.pointsPerTon;
  const currentArmorTonnage = currentArmorPoints / pointsPerTon;
  
  // Add remaining tonnage to current armor tonnage
  const newArmorTonnage = currentArmorTonnage + remainingTonnage;
  
  // Ensure we don't exceed maximum armor tonnage
  const maxArmorTonnage = calculateMaxArmorTonnage(unit);
  const finalTonnage = Math.min(newArmorTonnage, maxArmorTonnage);
  
  // Round to nearest half-ton (using MegaMekLab formula)
  return Math.ceil(finalTonnage * 2) / 2;
}
