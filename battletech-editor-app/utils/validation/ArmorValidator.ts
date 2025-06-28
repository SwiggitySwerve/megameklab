/**
 * Armor Validator - Handles armor allocation and distribution validation
 * Validates armor allocation, distribution efficiency, and construction rules
 * Following SOLID principles - Single Responsibility for armor validation
 */

import { EditableUnit } from '../../types/editor';
import {
  IArmorValidator,
  ValidationContext,
  ValidationResult,
  ValidationError,
  ValidationSuggestion
} from './ValidationTypes';

export class ArmorValidator implements IArmorValidator {
  
  /**
   * Validate overall armor allocation
   */
  validateArmorAllocation(unit: EditableUnit, context: ValidationContext): ValidationResult {
    console.log('[ArmorValidator] Validating armor allocation');
    
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    
    // Validate armor distribution
    const distributionResult = this.validateArmorDistribution(unit);
    errors.push(...distributionResult.errors);
    warnings.push(...distributionResult.warnings);
    
    // Calculate armor efficiency
    const efficiency = this.calculateArmorEfficiency(unit);
    
    // Check for armor over-allocation
    if (efficiency.totalArmor > efficiency.maxPossible) {
      errors.push({
        id: 'armor-over-allocation',
        category: 'error',
        message: `Armor exceeds maximum: ${efficiency.totalArmor}/${efficiency.maxPossible} points`,
        field: 'armor'
      });
    }
    
    // Check for severely under-armored units
    if (efficiency.efficiency < 0.5) {
      warnings.push({
        id: 'severely-under-armored',
        category: 'warning',
        message: `Unit is severely under-armored (${(efficiency.efficiency * 100).toFixed(1)}% efficiency). Consider adding more armor.`,
        field: 'armor'
      });
    }
    
    // Check for minimal armor protection
    if (efficiency.totalArmor < 10) {
      warnings.push({
        id: 'minimal-armor',
        category: 'warning',
        message: `Very low armor protection (${efficiency.totalArmor} points). Unit is vulnerable to critical hits.`,
        field: 'armor'
      });
    }
    
    // Validate armor type compatibility
    const armorTypeResult = this.validateArmorType(unit, context);
    errors.push(...armorTypeResult.errors);
    warnings.push(...armorTypeResult.warnings);
    
    console.log(`[ArmorValidator] Armor validation complete: ${errors.length} errors, ${warnings.length} warnings`);
    console.log(`[ArmorValidator] Armor efficiency: ${(efficiency.efficiency * 100).toFixed(1)}% (${efficiency.totalArmor}/${efficiency.maxPossible})`);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Validate armor distribution across locations
   */
  validateArmorDistribution(unit: EditableUnit): ValidationResult {
    console.log('[ArmorValidator] Validating armor distribution');
    
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    
    // Get armor data - handle both flat and structured formats
    const armorData = this.getArmorData(unit);
    const locations = this.getArmorLocations(unit);
    
    // Validate each location
    locations.forEach(location => {
      const armorValue = armorData[location] || 0;
      const maxArmor = this.getMaxArmorForLocation(unit, location);
      
      // Check for over-armored locations
      if (armorValue > maxArmor) {
        errors.push({
          id: `armor-${location}-over`,
          category: 'error',
          message: `${location} armor exceeds maximum: ${armorValue}/${maxArmor}`,
          field: 'armor',
          location
        });
      }
      
      // Check for completely unarmored locations
      if (armorValue === 0 && maxArmor > 0) {
        warnings.push({
          id: `armor-${location}-none`,
          category: 'warning',
          message: `${location} has no armor protection`,
          field: 'armor',
          location
        });
      }
      
      // Check for critically under-armored locations
      if (armorValue > 0 && armorValue < maxArmor * 0.1) {
        warnings.push({
          id: `armor-${location}-minimal`,
          category: 'warning',
          message: `${location} is critically under-armored (${armorValue}/${maxArmor})`,
          field: 'armor',
          location
        });
      }
    });
    
    // Check for rear armor on locations that support it
    this.validateRearArmor(unit, errors, warnings);
    
    // Check for head armor minimum (3 points required)
    if (armorData.head && armorData.head < 3) {
      warnings.push({
        id: 'head-armor-minimum',
        category: 'warning',
        message: `Head armor below recommended minimum: ${armorData.head}/3`,
        field: 'armor',
        location: 'head'
      });
    }
    
    console.log(`[ArmorValidator] Distribution validation complete: ${errors.length} errors, ${warnings.length} warnings`);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Get armor data from unit, handling different data formats
   */
  private getArmorData(unit: EditableUnit): Record<string, number> {
    const armorData = unit.data.armor;
    
    // Handle different armor data formats
    if (!armorData) {
      return {};
    }
    
    // If it's already a flat object with numeric values, use it
    if (typeof armorData === 'object' && !Array.isArray(armorData)) {
      // Try to extract numeric values, assuming locations are direct properties
      const result: Record<string, number> = {};
      
      // Handle common armor location properties
      const locations = ['head', 'center_torso', 'left_torso', 'right_torso', 
                        'left_arm', 'right_arm', 'left_leg', 'right_leg',
                        'center_torso_rear', 'left_torso_rear', 'right_torso_rear'];
      
      locations.forEach(location => {
        const value = (armorData as any)[location];
        if (typeof value === 'number') {
          result[location] = value;
        }
      });
      
      return result;
    }
    
    return {};
  }

  /**
   * Calculate armor efficiency and provide suggestions
   */
  calculateArmorEfficiency(unit: EditableUnit): {
    totalArmor: number;
    maxPossible: number;
    efficiency: number;
    suggestions: ValidationSuggestion[];
  } {
    console.log('[ArmorValidator] Calculating armor efficiency');
    
    const armorData = this.getArmorData(unit);
    const suggestions: ValidationSuggestion[] = [];
    
    // Calculate total current armor
    let totalArmor = 0;
    const locations = this.getArmorLocations(unit);
    
    locations.forEach(location => {
      const armor = armorData[location] || 0;
      totalArmor += armor;
      
      // Add rear armor if applicable
      const rearLocation = `${location}_rear`;
      if (armorData[rearLocation]) {
        totalArmor += armorData[rearLocation];
      }
    });
    
    // Calculate maximum possible armor
    const maxPossible = this.calculateMaxArmorPoints(unit);
    
    // Calculate efficiency
    const efficiency = maxPossible > 0 ? totalArmor / maxPossible : 0;
    
    // Generate suggestions based on efficiency
    if (efficiency < 0.7) {
      suggestions.push({
        id: 'increase-armor',
        category: 'armor',
        severity: 'major',
        message: `Consider increasing armor allocation (currently ${(efficiency * 100).toFixed(1)}% efficient)`,
        explanation: `You have ${maxPossible - totalArmor} additional armor points available`
      });
    }
    
    if (efficiency < 0.5) {
      suggestions.push({
        id: 'armor-distribution',
        category: 'armor',
        severity: 'major',
        message: 'Redistribute armor to critical locations',
        explanation: 'Focus armor on center torso, head, and weapon-carrying locations'
      });
    }
    
    // Check for uneven distribution
    const distributionAnalysis = this.analyzeArmorDistribution(unit, armorData);
    if (distributionAnalysis.isUneven) {
      suggestions.push({
        id: 'armor-balance',
        category: 'armor',
        severity: 'minor',
        message: 'Consider balancing armor distribution',
        explanation: distributionAnalysis.suggestion
      });
    }
    
    console.log(`[ArmorValidator] Armor efficiency: ${(efficiency * 100).toFixed(1)}% (${totalArmor}/${maxPossible})`);
    
    return {
      totalArmor,
      maxPossible,
      efficiency,
      suggestions
    };
  }
  
  /**
   * Validate armor type compatibility
   */
  private validateArmorType(unit: EditableUnit, context: ValidationContext): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    
    const armorType = (unit.data as any).armor_type || 'Standard';
    const techBase = unit.data.tech_base || 'Inner Sphere';
    const era = unit.data.era || '3025';
    
    // Validate tech base compatibility
    if (armorType.includes('Clan') && techBase === 'Inner Sphere') {
      errors.push({
        id: 'armor-tech-base-mismatch',
        category: 'error',
        message: `Clan armor type '${armorType}' not compatible with Inner Sphere tech base`,
        field: 'armor_type'
      });
    }
    
    // Validate era restrictions
    if (context.eraRestrictions) {
      const eraIssues = this.checkArmorEraCompatibility(armorType, era);
      if (eraIssues) {
        if (context.strictMode) {
          errors.push({
            id: 'armor-era-restriction',
            category: 'error',
            message: eraIssues,
            field: 'armor_type'
          });
        } else {
          warnings.push({
            id: 'armor-era-warning',
            category: 'warning',
            message: eraIssues,
            field: 'armor_type'
          });
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Validate rear armor allocation
   */
  private validateRearArmor(unit: EditableUnit, errors: ValidationError[], warnings: ValidationError[]): void {
    const armorData = (unit.data.armor as any) || {};
    const config = unit.data.config || 'Biped';
    
    // Only certain locations have rear armor
    const rearLocations = ['center_torso', 'left_torso', 'right_torso'];
    
    rearLocations.forEach(location => {
      const frontArmor = armorData[location] || 0;
      const rearArmor = armorData[`${location}_rear`] || 0;
      const maxFrontArmor = this.getMaxArmorForLocation(unit, location);
      const maxRearArmor = Math.floor(maxFrontArmor / 2); // Rear armor is typically half front max
      
      // Validate rear armor doesn't exceed maximum
      if (rearArmor > maxRearArmor) {
        errors.push({
          id: `armor-${location}-rear-over`,
          category: 'error',
          message: `${location} rear armor exceeds maximum: ${rearArmor}/${maxRearArmor}`,
          field: 'armor',
          location: `${location}_rear`
        });
      }
      
      // Suggest rear armor for center torso if none allocated
      if (location === 'center_torso' && frontArmor > 0 && rearArmor === 0) {
        warnings.push({
          id: 'center-torso-rear-armor',
          category: 'warning',
          message: 'Consider adding rear armor to center torso for protection',
          field: 'armor',
          location: 'center_torso_rear'
        });
      }
    });
  }
  
  /**
   * Get armor locations based on unit configuration
   */
  private getArmorLocations(unit: EditableUnit): string[] {
    const config = unit.data.config || 'Biped';
    
    switch (config) {
      case 'Biped':
      case 'Biped Omnimech':
        return ['head', 'center_torso', 'left_torso', 'right_torso', 'left_arm', 'right_arm', 'left_leg', 'right_leg'];
      
      case 'Quad':
      case 'Quad Omnimech':
        return ['head', 'center_torso', 'left_torso', 'right_torso', 'left_front_leg', 'right_front_leg', 'left_rear_leg', 'right_rear_leg'];
      
      case 'LAM':
        return ['head', 'center_torso', 'left_torso', 'right_torso', 'left_arm', 'right_arm', 'left_leg', 'right_leg'];
      
      default:
        console.warn(`[ArmorValidator] Unknown configuration: ${config}, using Biped default`);
        return ['head', 'center_torso', 'left_torso', 'right_torso', 'left_arm', 'right_arm', 'left_leg', 'right_leg'];
    }
  }
  
  /**
   * Calculate maximum armor points for the unit
   */
  private calculateMaxArmorPoints(unit: EditableUnit): number {
    const tonnage = (unit.data as any).tonnage || 0;
    const armorType = (unit.data as any).armor_type || 'Standard';
    
    // Base calculation: tonnage * 3.2, rounded down
    let maxArmor = Math.floor(tonnage * 3.2);
    
    // Adjust for armor type efficiency
    switch (armorType) {
      case 'Ferro-Fibrous':
      case 'Clan Ferro-Fibrous':
        maxArmor = Math.floor(maxArmor * 1.12); // 12% more protection
        break;
      case 'Light Ferro-Fibrous':
        maxArmor = Math.floor(maxArmor * 1.06); // 6% more protection
        break;
      case 'Heavy Ferro-Fibrous':
        maxArmor = Math.floor(maxArmor * 1.24); // 24% more protection
        break;
      case 'Hardened Armor':
        maxArmor = Math.floor(maxArmor * 2.0); // Double protection but very heavy
        break;
      case 'Stealth Armor':
        maxArmor = Math.floor(maxArmor * 1.0); // Same as standard but with stealth
        break;
      default:
        // Standard armor - no change
        break;
    }
    
    return maxArmor;
  }
  
  /**
   * Get maximum armor for a specific location
   */
  private getMaxArmorForLocation(unit: EditableUnit, location: string): number {
    const totalMaxArmor = this.calculateMaxArmorPoints(unit);
    const locations = this.getArmorLocations(unit);
    const config = unit.data.config || 'Biped';
    
    // Distribution varies by location and configuration
    switch (location) {
      case 'head':
        return Math.min(9, Math.floor(totalMaxArmor * 0.1)); // Head is limited to 9 points
      
      case 'center_torso':
        return Math.floor(totalMaxArmor * 0.25); // 25% of total
      
      case 'left_torso':
      case 'right_torso':
        return Math.floor(totalMaxArmor * 0.15); // 15% each
      
      case 'left_arm':
      case 'right_arm':
      case 'left_leg':
      case 'right_leg':
      case 'left_front_leg':
      case 'right_front_leg':
      case 'left_rear_leg':
      case 'right_rear_leg':
        return Math.floor(totalMaxArmor * 0.12); // 12% each
      
      default:
        return Math.floor(totalMaxArmor / locations.length); // Even distribution fallback
    }
  }
  
  /**
   * Check armor type era compatibility
   */
  private checkArmorEraCompatibility(armorType: string, era: string): string | null {
    const armorIntroduction: Record<string, number> = {
      'Standard': 2439,
      'Ferro-Fibrous': 2571,
      'Clan Ferro-Fibrous': 2571,
      'Light Ferro-Fibrous': 3067,
      'Heavy Ferro-Fibrous': 3069,
      'Stealth Armor': 3063,
      'Hardened Armor': 3047,
      'Reactive Armor': 3063,
      'Reflective Armor': 3066
    };
    
    const eraYear = this.parseEra(era);
    const introYear = armorIntroduction[armorType];
    
    if (introYear && eraYear < introYear) {
      return `${armorType} not available in ${era} (introduced ${introYear})`;
    }
    
    return null;
  }
  
  /**
   * Parse era string to year
   */
  private parseEra(era: string): number {
    if (era.includes('3025')) return 3025;
    if (era.includes('3050')) return 3050;
    if (era.includes('3067')) return 3067;
    if (era.includes('3145')) return 3145;
    
    // Extract year from era string
    const match = era.match(/(\d{4})/);
    return match ? parseInt(match[1]) : 3025;
  }
  
  /**
   * Analyze armor distribution for balance
   */
  private analyzeArmorDistribution(unit: EditableUnit, armorData: Record<string, number>): {
    isUneven: boolean;
    suggestion: string;
  } {
    const config = unit.data.config || 'Biped';
    
    // Check for common distribution issues
    const centerTorso = armorData.center_torso || 0;
    const leftTorso = armorData.left_torso || 0;
    const rightTorso = armorData.right_torso || 0;
    const head = armorData.head || 0;
    
    // Check for severely imbalanced sides
    const leftSide = leftTorso + (armorData.left_arm || 0) + (armorData.left_leg || 0);
    const rightSide = rightTorso + (armorData.right_arm || 0) + (armorData.right_leg || 0);
    
    if (Math.abs(leftSide - rightSide) > centerTorso * 0.5) {
      return {
        isUneven: true,
        suggestion: 'Left and right side armor is severely imbalanced'
      };
    }
    
    // Check for weak center torso
    if (centerTorso < Math.max(leftTorso, rightTorso)) {
      return {
        isUneven: true,
        suggestion: 'Center torso should have more armor than side torsos'
      };
    }
    
    // Check for over-armored head
    if (head > centerTorso * 0.5) {
      return {
        isUneven: true,
        suggestion: 'Head armor may be excessive compared to torso protection'
      };
    }
    
    return {
      isUneven: false,
      suggestion: 'Armor distribution is balanced'
    };
  }
}
