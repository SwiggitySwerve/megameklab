import { UnitData, TechBase, EquipmentTechBase } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationContext {
  era?: number;
  allowExperimental?: boolean;
  allowExtinct?: boolean;
}

/**
 * Validates mixed tech construction rules based on MegaMekLab implementation
 */
export function validateMixedTech(unit: UnitData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!unit.tech_base || !unit.tech_base.includes('Mixed')) {
    return { valid: true, errors, warnings };
  }

  // Mixed (IS Chassis) validation
  if (unit.tech_base === 'Mixed (IS Chassis)') {
    // IS chassis must have IS structure
    if (unit.structure?.type && unit.structure.type.toLowerCase().includes('clan')) {
      errors.push('Mixed (IS Chassis) units must use Inner Sphere structure');
    }
    
    // IS chassis typically uses IS engine (with some exceptions)
    if (unit.engine?.type && unit.engine.type.toLowerCase().includes('clan')) {
      warnings.push('Mixed (IS Chassis) units typically use Inner Sphere engines');
    }
  }

  // Mixed (Clan Chassis) validation  
  if (unit.tech_base === 'Mixed (Clan Chassis)') {
    // Clan chassis must have Clan structure
    if (unit.structure?.type && !unit.structure.type.toLowerCase().includes('clan')) {
      errors.push('Mixed (Clan Chassis) units must use Clan structure');
    }
    
    // Clan chassis typically uses Clan engine
    if (unit.engine?.type && !unit.engine.type.toLowerCase().includes('clan')) {
      warnings.push('Mixed (Clan Chassis) units typically use Clan engines');
    }
  }

  // Equipment validation for mixed tech
  if (unit.weapons_and_equipment) {
    const hasISEquipment = unit.weapons_and_equipment.some(item => item.tech_base === 'IS');
    const hasClanEquipment = unit.weapons_and_equipment.some(item => item.tech_base === 'Clan');
    
    if (!hasISEquipment && !hasClanEquipment) {
      warnings.push('Mixed tech unit should have equipment from both IS and Clan tech bases');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates era-based technology restrictions
 */
export function validateEraRestrictions(unit: UnitData, context: ValidationContext = {}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const era = context.era || (unit.era ? parseInt(unit.era.toString()) : null);
  
  if (!era) {
    return { valid: true, errors, warnings };
  }

  // Mixed tech restrictions by era
  if (unit.tech_base?.includes('Mixed')) {
    if (era < 3050) {
      errors.push('Mixed technology is not available before 3050 (except rare prototypes)');
    } else if (era < 3067) {
      warnings.push('Mixed technology was limited between 3050-3067');
    }
  }

  // Advanced equipment era restrictions (examples)
  if (unit.weapons_and_equipment) {
    unit.weapons_and_equipment.forEach(item => {
      // Pulse lasers
      if (item.item_name.toLowerCase().includes('pulse') && era < 3058) {
        warnings.push(`${item.item_name} may not be available in ${era}`);
      }
      
      // Ultra AC
      if (item.item_name.toLowerCase().includes('ultra') && era < 3057) {
        warnings.push(`${item.item_name} may not be available in ${era}`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates OmniMech configuration rules
 */
export function validateOmniMech(unit: UnitData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const isOmniConfig = unit.config?.includes('Omnimech') || unit.is_omnimech;
  
  if (!isOmniConfig) {
    return { valid: true, errors, warnings };
  }

  // OmniMech must have base chassis specified
  if (!unit.omnimech_base_chassis) {
    warnings.push('OmniMech should specify base chassis');
  }

  // OmniMech should have configuration variant
  if (!unit.omnimech_configuration) {
    warnings.push('OmniMech should specify configuration variant (Prime, A, B, etc.)');
  }

  // Pod-mounted equipment validation
  if (unit.weapons_and_equipment) {
    const hasPodEquipment = unit.weapons_and_equipment.some(item => item.is_omnipod);
    
    if (!hasPodEquipment) {
      warnings.push('OmniMech should have some pod-mounted equipment');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates equipment tech base consistency
 */
export function validateEquipmentTechBase(unit: UnitData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!unit.weapons_and_equipment) {
    return { valid: true, errors, warnings };
  }

  unit.weapons_and_equipment.forEach((item, index) => {
    // Equipment must have tech base specified
    if (!item.tech_base) {
      errors.push(`Equipment item ${index + 1} (${item.item_name}) missing tech base`);
      return;
    }

    // Validate tech base matches expected patterns
    const itemName = item.item_name.toLowerCase();
    
    // Common IS equipment patterns
    if ((itemName.startsWith('is') || itemName.includes('autocannon') || itemName.includes('standard')) 
        && item.tech_base === 'Clan') {
      warnings.push(`${item.item_name} is typically Inner Sphere technology`);
    }
    
    // Common Clan equipment patterns  
    if ((itemName.startsWith('cl') || itemName.includes('streak') || itemName.includes('er ') || itemName.includes('lrm') || itemName.includes('srm'))
        && item.tech_base === 'IS') {
      warnings.push(`${item.item_name} is typically Clan technology`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Comprehensive unit validation combining all rules
 */
export function validateUnit(unit: UnitData, context: ValidationContext = {}): ValidationResult {
  const results = [
    validateMixedTech(unit),
    validateEraRestrictions(unit, context),
    validateOmniMech(unit),
    validateEquipmentTechBase(unit)
  ];

  const allErrors = results.flatMap(r => r.errors);
  const allWarnings = results.flatMap(r => r.warnings);

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}

/**
 * Utility function to determine if a unit is mixed tech
 */
export function isMixedTech(unit: UnitData): boolean {
  return unit.tech_base?.includes('Mixed') || false;
}

/**
 * Utility function to determine chassis tech base from mixed tech string
 */
export function getChassisTechBase(unit: UnitData): EquipmentTechBase | null {
  if (unit.tech_base === 'Mixed (IS Chassis)') return 'IS';
  if (unit.tech_base === 'Mixed (Clan Chassis)') return 'Clan';
  if (unit.tech_base === 'Inner Sphere') return 'IS';
  if (unit.tech_base === 'Clan') return 'Clan';
  return null;
}

/**
 * Utility function to get era as number
 */
export function getEraAsNumber(unit: UnitData): number | null {
  if (!unit.era) return null;
  
  const era = parseInt(unit.era.toString());
  return isNaN(era) ? null : era;
}
