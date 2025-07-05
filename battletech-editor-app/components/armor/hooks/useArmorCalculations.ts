import { useMemo } from 'react';
import { EditableUnit, MECH_LOCATIONS } from '../../../types/editor';
import { FullUnit } from '../../../types';

export interface ArmorLocationData {
  location: string;
  front: number;
  rear: number;
  max: number;
  hasRear: boolean;
  coverage: number;
}

export interface ArmorCalculations {
  locations: Record<string, ArmorLocationData>;
  totalArmor: number;
  totalMax: number;
  overallCoverage: number;
  isValid: boolean;
  errors: string[];
}

export function useArmorCalculations(unit: EditableUnit | FullUnit): ArmorCalculations {
  return useMemo(() => {
    const mass = unit.mass || 50;
    const locations: Record<string, ArmorLocationData> = {};
    let totalArmor = 0;
    let totalMax = 0;
    const errors: string[] = [];

    // Define location mapping
    const locationMapping: Record<string, string> = {
      'Head': MECH_LOCATIONS.HEAD,
      'Center Torso': MECH_LOCATIONS.CENTER_TORSO,
      'Left Torso': MECH_LOCATIONS.LEFT_TORSO,
      'Right Torso': MECH_LOCATIONS.RIGHT_TORSO,
      'Left Arm': MECH_LOCATIONS.LEFT_ARM,
      'Right Arm': MECH_LOCATIONS.RIGHT_ARM,
      'Left Leg': MECH_LOCATIONS.LEFT_LEG,
      'Right Leg': MECH_LOCATIONS.RIGHT_LEG,
    };

    // Calculate armor for each location
    Object.entries(locationMapping).forEach(([displayName, locationId]) => {
      const maxArmor = getMaxArmorForLocation(locationId, mass);
      const hasRear = hasRearArmor(locationId);
      
      // Get armor values from unit data
      let front = 0;
      let rear = 0;

      // Check EditableUnit armor allocation first
      if ('armorAllocation' in unit && unit.armorAllocation?.[displayName]) {
        front = unit.armorAllocation[displayName].front || 0;
        rear = unit.armorAllocation[displayName].rear || 0;
      } 
      // Fallback to standard unit armor data
      else if (unit.data?.armor?.locations) {
        const armorLocation = unit.data.armor.locations.find(
          (loc: any) => loc.location === displayName
        );
        if (armorLocation) {
          front = armorLocation.armor_points || 0;
          rear = armorLocation.rear_armor_points || 0;
        }
      }

      const total = front + rear;
      const coverage = maxArmor > 0 ? (total / maxArmor) * 100 : 0;

      // Validate armor values
      if (total > maxArmor) {
        errors.push(`${displayName}: Armor (${total}) exceeds maximum (${maxArmor})`);
      }

      locations[displayName] = {
        location: displayName,
        front,
        rear,
        max: maxArmor,
        hasRear,
        coverage,
      };

      totalArmor += total;
      totalMax += maxArmor;
    });

    const overallCoverage = totalMax > 0 ? (totalArmor / totalMax) * 100 : 0;
    const isValid = errors.length === 0;

    return {
      locations,
      totalArmor,
      totalMax,
      overallCoverage,
      isValid,
      errors,
    };
  }, [unit]);
}

// Helper function to calculate max armor for a location
export function getMaxArmorForLocation(location: string, mass: number): number {
  switch (location) {
    case MECH_LOCATIONS.HEAD:
      return mass > 100 ? 12 : 9;
    case MECH_LOCATIONS.CENTER_TORSO:
      return Math.floor(mass * 2 * 0.4);
    case MECH_LOCATIONS.LEFT_TORSO:
    case MECH_LOCATIONS.RIGHT_TORSO:
      return Math.floor(mass * 2 * 0.3);
    case MECH_LOCATIONS.LEFT_ARM:
    case MECH_LOCATIONS.RIGHT_ARM:
    case MECH_LOCATIONS.LEFT_LEG:
    case MECH_LOCATIONS.RIGHT_LEG:
      return Math.floor(mass * 2 * 0.25);
    default:
      return Math.floor(mass * 2 * 0.2);
  }
}

// Helper function to determine if location has rear armor
export function hasRearArmor(location: string): boolean {
  // Type-safe location checking for rear armor locations
  const rearArmorLocations = [
    MECH_LOCATIONS.CENTER_TORSO,
    MECH_LOCATIONS.LEFT_TORSO,
    MECH_LOCATIONS.RIGHT_TORSO,
  ] as string[];
  
  return rearArmorLocations.includes(location);
}

// Helper function to get location abbreviation
export function getLocationAbbr(location: string): string {
  const abbrevMap: { [key: string]: string } = {
    'Head': 'HD',
    'Left Arm': 'LA',
    'Right Arm': 'RA',
    'Left Torso': 'LT',
    'Center Torso': 'CT',
    'Right Torso': 'RT',
    'Left Leg': 'LL',
    'Right Leg': 'RL',
  };
  return abbrevMap[location] || location.substring(0, 2).toUpperCase();
}

// Helper to check if unit is an EditableUnit
export function isEditableUnit(unit: EditableUnit | FullUnit): unit is EditableUnit {
  return 'armorAllocation' in unit;
}
