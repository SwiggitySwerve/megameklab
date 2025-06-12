import { EditableUnit } from '../types/editor';
import { EQUIPMENT_DATABASE } from './equipmentData';

export interface ArmorAllocation {
  [location: string]: {
    front: number;
    rear?: number;
  };
}

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
  // This is a simplified calculation - in reality it depends on the mech's tonnage and structure type
  // Standard structure values for a 50-ton mech as example
  const structureMap: { [key: string]: number } = {
    'HEAD': 3,
    'CT': 16,
    'LT': 12,
    'RT': 12,
    'LA': 8,
    'RA': 8,
    'LL': 12,
    'RL': 12
  };
  
  // Scale based on tonnage (simplified)
  const baseTonnage = 50;
  const scale = unit.mass / baseTonnage;
  
  return Math.floor((structureMap[location] || 10) * scale);
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
  
  // Head gets 5x percentage (capped at max)
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
      // 75% front, 25% rear for torso locations
      const rear = Math.floor(allocatedArmor * 0.25);
      const front = allocatedArmor - rear;
      allocation[loc.id] = { front, rear };
      remainingPoints -= allocatedArmor;
    } else {
      allocation[loc.id] = { front: allocatedArmor };
      remainingPoints -= allocatedArmor;
    }
  });
  
  // Allocate any leftover points
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
      // Check torso pairs
      if (canAddToLocation(unit, allocation, 'LT') && canAddToLocation(unit, allocation, 'RT')) {
        allocation.LT.front += 1;
        allocation.RT.front += 1;
        points -= 2;
        continue;
      }
      
      // Check leg pairs
      if (canAddToLocation(unit, allocation, 'LL') && canAddToLocation(unit, allocation, 'RL')) {
        allocation.LL.front += 1;
        allocation.RL.front += 1;
        points -= 2;
        continue;
      }
      
      // Check arm pairs
      if (canAddToLocation(unit, allocation, 'LA') && canAddToLocation(unit, allocation, 'RA')) {
        allocation.LA.front += 1;
        allocation.RA.front += 1;
        points -= 2;
        continue;
      }
    }
    
    // Single point allocation
    // First try head
    if (allocation.HEAD.front < headMax) {
      allocation.HEAD.front += 1;
      points -= 1;
      continue;
    }
    
    // Then try to balance uneven allocations
    const unbalanced = findUnbalancedLocation(allocation);
    if (unbalanced && canAddToLocation(unit, allocation, unbalanced)) {
      allocation[unbalanced].front += 1;
      points -= 1;
      continue;
    }
    
    // Finally, add to CT if possible
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
  // Convert points to tonnage (16 points per ton for standard armor)
  const armorType = unit.data?.armor?.type || 'standard';
  const pointsPerTon = armorType === 'ferro-fibrous' ? 17.6 : 16;
  return Math.ceil(maxPoints / pointsPerTon * 2) / 2; // Round to nearest half-ton
}

export function calculateRemainingTonnage(unit: EditableUnit): number {
  const totalTonnage = unit.mass || 0;
  
  // Calculate current used tonnage
  let usedTonnage = 0;
  
  // Structure (simplified - normally varies by type)
  usedTonnage += totalTonnage * 0.1; // 10% for standard structure
  
  // Engine (simplified calculation)
  const engineRating = unit.data?.engine?.rating || 200;
  const engineType = unit.data?.engine?.type || 'standard';
  let engineWeight = engineRating / totalTonnage;
  if (engineType === 'xl') engineWeight *= 0.5;
  else if (engineType === 'light') engineWeight *= 0.75;
  usedTonnage += engineWeight;
  
  // Gyro (2 tons for standard)
  usedTonnage += 2;
  
  // Cockpit (3 tons for standard)
  usedTonnage += 3;
  
  // Heat sinks (beyond free engine sinks)
  const totalHeatSinks = unit.data?.heat_sinks?.count || 10;
  const freeHeatSinks = 10; // Simplified - engines provide free heat sinks
  const extraHeatSinks = Math.max(0, totalHeatSinks - freeHeatSinks);
  const heatSinkWeight = unit.data?.heat_sinks?.type === 'double' ? 1 : 1;
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
  const armorType = unit.data?.armor?.type || 'standard';
  const pointsPerTon = armorType === 'ferro-fibrous' ? 17.6 : 16;
  usedTonnage += currentArmorPoints / pointsPerTon;
  
  return Math.max(0, totalTonnage - usedTonnage);
}

export function useRemainingTonnageForArmor(unit: EditableUnit): number {
  const remainingTonnage = calculateRemainingTonnage(unit);
  const currentArmorTonnage = (unit.data?.armor?.total_armor_points || 0) / 16;
  const newArmorTonnage = Math.min(
    currentArmorTonnage + remainingTonnage,
    calculateMaxArmorTonnage(unit)
  );
  return Math.floor(newArmorTonnage * 2) / 2; // Round to nearest half-ton
}
