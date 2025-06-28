/**
 * Optimization Analyzer - Analyzes unit design efficiency and provides optimization suggestions
 * Provides recommendations for improving BattleTech unit designs across multiple dimensions
 * Following SOLID principles - Single Responsibility for design optimization analysis
 */

import { EditableUnit } from '../../types/editor';
import { FullEquipment } from '../../types/index';
import {
  IOptimizationAnalyzer,
  ValidationContext,
  ValidationSuggestion
} from './ValidationTypes';

export class OptimizationAnalyzer implements IOptimizationAnalyzer {
  
  /**
   * Analyze overall unit optimization and provide suggestions
   */
  analyzeOptimization(unit: EditableUnit, context: ValidationContext): ValidationSuggestion[] {
    console.log('[OptimizationAnalyzer] Analyzing unit optimization');
    
    const suggestions: ValidationSuggestion[] = [];
    
    try {
      // Analyze different aspects of unit design
      suggestions.push(...this.analyzeTonnageEfficiency(unit));
      suggestions.push(...this.analyzeWeaponLoadout(unit));
      suggestions.push(...this.analyzeArmorDistribution(unit));
      suggestions.push(...this.analyzeHeatManagement(unit));
      suggestions.push(...this.analyzeMovementProfile(unit));
      suggestions.push(...this.analyzeCostEfficiency(unit));
      suggestions.push(...this.analyzeRoleOptimization(unit));
      
      // Sort suggestions by severity (major first)
      suggestions.sort((a, b) => {
        const severityOrder = { 'major': 0, 'minor': 1, 'info': 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
      
      console.log(`[OptimizationAnalyzer] Generated ${suggestions.length} optimization suggestions`);
      
    } catch (error) {
      console.error('[OptimizationAnalyzer] Error during optimization analysis:', error);
    }
    
    return suggestions;
  }
  
  /**
   * Analyze tonnage efficiency and utilization
   */
  analyzeTonnageEfficiency(unit: EditableUnit): ValidationSuggestion[] {
    console.log('[OptimizationAnalyzer] Analyzing tonnage efficiency');
    
    const suggestions: ValidationSuggestion[] = [];
    const tonnage = (unit.data as any).tonnage || 0;
    const usedTonnage = this.calculateUsedTonnage(unit);
    const remainingTonnage = tonnage - usedTonnage;
    const efficiency = usedTonnage / tonnage;
    
    console.log(`[OptimizationAnalyzer] Tonnage usage: ${usedTonnage}/${tonnage} (${(efficiency * 100).toFixed(1)}%)`);
    
    // Check for poor tonnage utilization
    if (efficiency < 0.85) {
      suggestions.push({
        id: 'tonnage-underutilized',
        category: 'structure',
        severity: 'major',
        message: `Unit is underutilizing tonnage (${(efficiency * 100).toFixed(1)}% used)`,
        explanation: `You have ${remainingTonnage.toFixed(1)} tons remaining. Consider adding more weapons, armor, or equipment.`
      });
    } else if (efficiency < 0.95) {
      suggestions.push({
        id: 'tonnage-room-for-improvement',
        category: 'structure',
        severity: 'minor',
        message: `Some tonnage could be better utilized (${remainingTonnage.toFixed(1)} tons remaining)`,
        explanation: 'Consider optimizing equipment choices or adding additional systems.'
      });
    }
    
    // Check for overweight
    if (usedTonnage > tonnage) {
      suggestions.push({
        id: 'tonnage-overweight',
        category: 'structure',
        severity: 'major',
        message: `Unit is overweight by ${(usedTonnage - tonnage).toFixed(1)} tons`,
        explanation: 'Remove equipment, reduce armor, or switch to lighter components.'
      });
    }
    
    return suggestions;
  }
  
  /**
   * Analyze weapon loadout optimization
   */
  analyzeWeaponLoadout(unit: EditableUnit): ValidationSuggestion[] {
    console.log('[OptimizationAnalyzer] Analyzing weapon loadout');
    
    const suggestions: ValidationSuggestion[] = [];
    const weapons = this.getWeapons(unit);
    
    if (weapons.length === 0) {
      suggestions.push({
        id: 'no-weapons',
        category: 'weapons',
        severity: 'major',
        message: 'Unit has no weapons equipped',
        explanation: 'Consider adding weapons to make the unit combat-effective.'
      });
      return suggestions;
    }
    
    // Analyze weapon synergy
    const weaponAnalysis = this.analyzeWeaponSynergy(weapons);
    suggestions.push(...weaponAnalysis.suggestions);
    
    // Analyze range brackets
    const rangeAnalysis = this.analyzeRangeBrackets(weapons);
    suggestions.push(...rangeAnalysis);
    
    // Analyze heat efficiency
    const heatAnalysis = this.analyzeWeaponHeatEfficiency(weapons, unit);
    suggestions.push(...heatAnalysis);
    
    // Analyze ammunition dependency
    const ammoAnalysis = this.analyzeAmmunitionDependency(weapons, unit);
    suggestions.push(...ammoAnalysis);
    
    return suggestions;
  }
  
  /**
   * Analyze armor distribution optimization
   */
  analyzeArmorDistribution(unit: EditableUnit): ValidationSuggestion[] {
    console.log('[OptimizationAnalyzer] Analyzing armor distribution');
    
    const suggestions: ValidationSuggestion[] = [];
    const armorData = this.getArmorData(unit);
    const totalArmor = this.getTotalArmorPoints(armorData);
    const maxPossible = this.getMaxArmorPoints(unit);
    
    if (totalArmor === 0) {
      suggestions.push({
        id: 'no-armor',
        category: 'armor',
        severity: 'major',
        message: 'Unit has no armor protection',
        explanation: 'Add armor to protect against damage and critical hits.'
      });
      return suggestions;
    }
    
    // Check armor efficiency
    const efficiency = totalArmor / maxPossible;
    if (efficiency < 0.7) {
      suggestions.push({
        id: 'armor-low-efficiency',
        category: 'armor',
        severity: 'major',
        message: `Armor efficiency is low (${(efficiency * 100).toFixed(1)}%)`,
        explanation: `Consider investing more tonnage in armor. You could add ${(maxPossible - totalArmor)} more armor points.`
      });
    }
    
    // Analyze distribution balance
    const distributionAnalysis = this.analyzeArmorBalance(armorData);
    suggestions.push(...distributionAnalysis);
    
    // Check for critical areas
    const criticalAnalysis = this.analyzeCriticalArmor(armorData);
    suggestions.push(...criticalAnalysis);
    
    return suggestions;
  }
  
  /**
   * Analyze heat management optimization
   */
  private analyzeHeatManagement(unit: EditableUnit): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];
    const weapons = this.getWeapons(unit);
    const heatGeneration = this.calculateHeatGeneration(weapons);
    const heatDissipation = this.calculateHeatDissipation(unit);
    const heatBalance = heatDissipation - heatGeneration;
    
    if (heatGeneration === 0) {
      return suggestions; // No weapons, no heat analysis needed
    }
    
    if (heatBalance < 0) {
      suggestions.push({
        id: 'heat-negative-balance',
        category: 'heat',
        severity: 'major',
        message: `Heat generation exceeds dissipation by ${Math.abs(heatBalance)} points`,
        explanation: 'Add more heat sinks or reduce weapon heat generation.'
      });
    } else if (heatBalance < 5) {
      suggestions.push({
        id: 'heat-low-margin',
        category: 'heat',
        severity: 'minor',
        message: `Low heat margin (${heatBalance} points)`,
        explanation: 'Consider adding heat sinks for sustained fire capability.'
      });
    }
    
    // Check heat sink efficiency
    const heatSinkAnalysis = this.analyzeHeatSinkEfficiency(unit);
    suggestions.push(...heatSinkAnalysis);
    
    return suggestions;
  }
  
  /**
   * Analyze movement profile optimization
   */
  private analyzeMovementProfile(unit: EditableUnit): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];
    const tonnage = (unit.data as any).tonnage || 0;
    const walkSpeed = (unit.data as any).walk_speed || 0;
    const jumpMP = (unit.data as any).jump_mp || 0;
    
    // Analyze speed for tonnage class
    const speedAnalysis = this.analyzeSpeedOptimization(tonnage, walkSpeed);
    suggestions.push(...speedAnalysis);
    
    // Analyze jump capability
    const jumpAnalysis = this.analyzeJumpOptimization(tonnage, jumpMP, walkSpeed);
    suggestions.push(...jumpAnalysis);
    
    return suggestions;
  }
  
  /**
   * Analyze cost efficiency
   */
  private analyzeCostEfficiency(unit: EditableUnit): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];
    const tonnage = (unit.data as any).tonnage || 0;
    
    // Analyze weapon cost per damage point
    const weapons = this.getWeapons(unit);
    if (weapons.length > 0) {
      const costEfficiencyAnalysis = this.analyzeWeaponCostEfficiency(weapons);
      suggestions.push(...costEfficiencyAnalysis);
    }
    
    // Analyze armor cost efficiency
    const armorAnalysis = this.analyzeArmorCostEfficiency(unit);
    suggestions.push(...armorAnalysis);
    
    return suggestions;
  }
  
  /**
   * Analyze role optimization
   */
  private analyzeRoleOptimization(unit: EditableUnit): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];
    const tonnage = (unit.data as any).tonnage || 0;
    const weapons = this.getWeapons(unit);
    const walkSpeed = (unit.data as any).walk_speed || 0;
    const armorData = this.getArmorData(unit);
    const totalArmor = this.getTotalArmorPoints(armorData);
    
    // Determine likely role based on characteristics
    const role = this.determineUnitRole(tonnage, weapons, walkSpeed, totalArmor);
    const roleAnalysis = this.analyzeRoleConsistency(role, unit);
    suggestions.push(...roleAnalysis);
    
    return suggestions;
  }
  
  /**
   * Analyze weapon synergy and effectiveness
   */
  private analyzeWeaponSynergy(weapons: FullEquipment[]): { suggestions: ValidationSuggestion[] } {
    const suggestions: ValidationSuggestion[] = [];
    
    // Group weapons by type
    const energyWeapons = weapons.filter(w => this.isEnergyWeapon(w));
    const ballisticWeapons = weapons.filter(w => this.isBallisticWeapon(w));
    const missileWeapons = weapons.filter(w => this.isMissileWeapon(w));
    
    // Check for weapon type diversity
    const weaponTypes = [energyWeapons.length > 0, ballisticWeapons.length > 0, missileWeapons.length > 0].filter(Boolean).length;
    
    if (weaponTypes === 1 && energyWeapons.length > 0) {
      suggestions.push({
        id: 'energy-boat-heat-risk',
        category: 'weapons',
        severity: 'minor',
        message: 'All-energy weapon loadout may have heat management issues',
        explanation: 'Consider mixing weapon types or ensuring adequate heat dissipation.'
      });
    }
    
    // Check for weapon size diversity
    const weaponSizes = this.analyzeWeaponSizes(weapons);
    if (weaponSizes.hasOnlySmall) {
      suggestions.push({
        id: 'small-weapons-only',
        category: 'weapons',
        severity: 'minor',
        message: 'Unit relies heavily on small weapons',
        explanation: 'Consider adding larger weapons for more decisive firepower.'
      });
    }
    
    return { suggestions };
  }
  
  /**
   * Analyze weapon range brackets
   */
  private analyzeRangeBrackets(weapons: FullEquipment[]): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];
    
    const rangeBrackets = {
      short: weapons.filter(w => this.getEffectiveRange(w) <= 3),
      medium: weapons.filter(w => this.getEffectiveRange(w) > 3 && this.getEffectiveRange(w) <= 12),
      long: weapons.filter(w => this.getEffectiveRange(w) > 12)
    };
    
    const totalWeapons = weapons.length;
    
    // Check for range concentration
    if (rangeBrackets.short.length / totalWeapons > 0.8) {
      suggestions.push({
        id: 'short-range-concentration',
        category: 'weapons',
        severity: 'minor',
        message: 'Weapon loadout is heavily focused on short range',
        explanation: 'Consider adding longer-range weapons for tactical flexibility.'
      });
    }
    
    if (rangeBrackets.long.length / totalWeapons > 0.8) {
      suggestions.push({
        id: 'long-range-concentration',
        category: 'weapons',
        severity: 'minor',
        message: 'Weapon loadout is heavily focused on long range',
        explanation: 'Consider adding shorter-range weapons for close combat.'
      });
    }
    
    // Check for range gaps
    if (rangeBrackets.medium.length === 0 && rangeBrackets.short.length > 0 && rangeBrackets.long.length > 0) {
      suggestions.push({
        id: 'medium-range-gap',
        category: 'weapons',
        severity: 'minor',
        message: 'Unit has a gap in medium-range weapons',
        explanation: 'Consider adding weapons effective at medium range (4-12 hexes).'
      });
    }
    
    return suggestions;
  }
  
  /**
   * Calculate used tonnage for the unit
   */
  private calculateUsedTonnage(unit: EditableUnit): number {
    const tonnage = (unit.data as any).tonnage || 0;
    const armorTonnage = (unit.data as any).armor_tonnage || 0;
    const engineRating = (unit.data as any).engine_rating || 0;
    const externalHeatSinks = (unit.data as any).external_heat_sinks || 0;
    const jumpMP = (unit.data as any).jump_mp || 0;
    
    // Structure (10% of tonnage)
    const structureWeight = tonnage * 0.1;
    
    // Engine weight (simplified calculation)
    const engineWeight = Math.ceil(engineRating / 25);
    
    // Gyro weight (simplified calculation)
    const gyroWeight = Math.ceil(engineRating / 100);
    
    // Cockpit weight
    const cockpitWeight = 3;
    
    // Heat sink weight
    const heatSinkWeight = externalHeatSinks * 1; // Assuming single heat sinks
    
    // Jump jet weight (simplified)
    const jumpJetWeight = this.calculateJumpJetWeight(tonnage, jumpMP);
    
    // Equipment weight
    const equipmentWeight = this.calculateEquipmentWeight(unit);
    
    return structureWeight + engineWeight + gyroWeight + cockpitWeight + 
           armorTonnage + heatSinkWeight + jumpJetWeight + equipmentWeight;
  }
  
  /**
   * Get all weapons from the unit
   */
  private getWeapons(unit: EditableUnit): FullEquipment[] {
    const equipment = this.getAllEquipment(unit);
    return equipment.filter(item => this.isWeapon(item));
  }
  
  /**
   * Get all equipment from the unit
   */
  private getAllEquipment(unit: EditableUnit): FullEquipment[] {
    const equipment: FullEquipment[] = [];
    
    // Get equipment from all sections
    const sections = (unit.data as any).sections || {};
    Object.values(sections).forEach((section: any) => {
      if (section && section.equipment) {
        equipment.push(...section.equipment);
      }
    });
    
    // Get unallocated equipment
    const unallocated = (unit.data as any).unallocated_equipment;
    if (unallocated) {
      equipment.push(...unallocated);
    }
    
    return equipment;
  }
  
  /**
   * Check if equipment is a weapon
   */
  private isWeapon(equipment: FullEquipment): boolean {
    const weaponCategories = [
      'Energy Weapons', 'Ballistic Weapons', 'Missile Weapons',
      'Artillery Weapons', 'Physical Weapons', 'Anti-Personnel Weapons'
    ];
    
    return weaponCategories.includes((equipment as any).category || '') ||
           (Boolean(equipment.damage) && Number(equipment.damage) > 0);
  }
  
  /**
   * Check if weapon is energy type
   */
  private isEnergyWeapon(weapon: FullEquipment): boolean {
    const name = weapon.name?.toLowerCase() || '';
    return name.includes('laser') || name.includes('ppc') || name.includes('flamer');
  }
  
  /**
   * Check if weapon is ballistic type
   */
  private isBallisticWeapon(weapon: FullEquipment): boolean {
    const name = weapon.name?.toLowerCase() || '';
    return name.includes('autocannon') || name.includes('ac/') || 
           name.includes('gauss') || name.includes('machine gun');
  }
  
  /**
   * Check if weapon is missile type
   */
  private isMissileWeapon(weapon: FullEquipment): boolean {
    const name = weapon.name?.toLowerCase() || '';
    return name.includes('lrm') || name.includes('srm') || 
           name.includes('missile') || name.includes('rocket');
  }
  
  /**
   * Get effective range for weapon
   */
  private getEffectiveRange(weapon: FullEquipment): number {
    // Use long range as primary, fallback to medium, then short
    return (weapon as any).rangeLong || (weapon as any).rangeMedium || (weapon as any).rangeShort || 0;
  }
  
  /**
   * Calculate total heat generation from weapons
   */
  private calculateHeatGeneration(weapons: FullEquipment[]): number {
    return weapons.reduce((total, weapon) => {
      return total + (Number(weapon.heat) || 0);
    }, 0);
  }
  
  /**
   * Calculate heat dissipation capacity
   */
  private calculateHeatDissipation(unit: EditableUnit): number {
    const totalHeatSinks = (unit.data as any).total_heat_sinks || 10;
    const heatSinkType = (unit.data as any).heat_sink_type || 'Single';
    
    const efficiency = heatSinkType.includes('Double') ? 2 : 1;
    return totalHeatSinks * efficiency;
  }
  
  /**
   * Get armor data from unit
   */
  private getArmorData(unit: EditableUnit): Record<string, any> {
    return (unit.data as any).armor || {};
  }
  
  /**
   * Calculate total armor points
   */
  private getTotalArmorPoints(armorData: Record<string, any>): number {
    return Object.values(armorData).reduce((total: number, location: any) => {
      if (typeof location === 'object' && location !== null) {
        return total + (location.front || 0) + (location.rear || 0);
      }
      return total + (Number(location) || 0);
    }, 0);
  }
  
  /**
   * Calculate maximum possible armor points
   */
  private getMaxArmorPoints(unit: EditableUnit): number {
    const tonnage = (unit.data as any).tonnage || 0;
    // Simplified: tonnage * 3.2 rounded down
    return Math.floor(tonnage * 3.2);
  }
  
  /**
   * Helper methods for various analyses
   */
  private analyzeWeaponHeatEfficiency(weapons: FullEquipment[], unit: EditableUnit): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];
    
    const inefficientWeapons = weapons.filter(weapon => {
      const damage = Number(weapon.damage) || 0;
      const heat = Number(weapon.heat) || 0;
      return heat > 0 && damage > 0 && (damage / heat) < 1;
    });
    
    if (inefficientWeapons.length > weapons.length * 0.5) {
      suggestions.push({
        id: 'heat-inefficient-weapons',
        category: 'weapons',
        severity: 'minor',
        message: 'Many weapons have poor heat efficiency',
        explanation: 'Consider weapons with better damage-to-heat ratios.'
      });
    }
    
    return suggestions;
  }
  
  private analyzeAmmunitionDependency(weapons: FullEquipment[], unit: EditableUnit): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];
    
    const ammoWeapons = weapons.filter(weapon => this.requiresAmmo(weapon));
    const ammoRatio = ammoWeapons.length / weapons.length;
    
    if (ammoRatio > 0.7) {
      suggestions.push({
        id: 'high-ammo-dependency',
        category: 'weapons',
        severity: 'minor',
        message: 'Unit has high ammunition dependency',
        explanation: 'Consider adding energy weapons for sustained combat capability.'
      });
    }
    
    return suggestions;
  }
  
  private analyzeArmorBalance(armorData: Record<string, any>): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];
    
    // Check for severely imbalanced armor
    const centerTorso = this.getLocationArmor(armorData, 'center_torso');
    const leftTorso = this.getLocationArmor(armorData, 'left_torso');
    const rightTorso = this.getLocationArmor(armorData, 'right_torso');
    
    if (Math.abs(leftTorso - rightTorso) > 10) {
      suggestions.push({
        id: 'armor-side-imbalance',
        category: 'armor',
        severity: 'minor',
        message: 'Significant armor imbalance between left and right sides',
        explanation: 'Consider balancing armor between left and right torso/limbs.'
      });
    }
    
    return suggestions;
  }
  
  private analyzeCriticalArmor(armorData: Record<string, any>): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];
    
    const headArmor = this.getLocationArmor(armorData, 'head');
    const centerTorsoArmor = this.getLocationArmor(armorData, 'center_torso');
    
    if (headArmor < 3) {
      suggestions.push({
        id: 'head-armor-minimal',
        category: 'armor',
        severity: 'minor',
        message: 'Head armor is below recommended minimum',
        explanation: 'Consider allocating at least 3 points to head armor.'
      });
    }
    
    if (centerTorsoArmor < 20) {
      suggestions.push({
        id: 'center-torso-weak',
        category: 'armor',
        severity: 'minor',
        message: 'Center torso armor seems light for protection',
        explanation: 'Center torso destruction destroys the unit - consider more armor.'
      });
    }
    
    return suggestions;
  }
  
  private analyzeHeatSinkEfficiency(unit: EditableUnit): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];
    
    const heatSinkType = (unit.data as any).heat_sink_type || 'Single';
    const totalHeatSinks = (unit.data as any).total_heat_sinks || 10;
    
    if (heatSinkType === 'Single' && totalHeatSinks > 15) {
      suggestions.push({
        id: 'consider-double-heat-sinks',
        category: 'heat',
        severity: 'minor',
        message: 'Consider upgrading to double heat sinks',
        explanation: 'Double heat sinks provide better efficiency for heat-heavy designs.'
      });
    }
    
    return suggestions;
  }
  
  private analyzeSpeedOptimization(tonnage: number, walkSpeed: number): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];
    
    // Speed recommendations by tonnage class
    let recommendedMinSpeed = 3;
    let weightClass = 'Unknown';
    
    if (tonnage <= 35) {
      recommendedMinSpeed = 5;
      weightClass = 'Light';
    } else if (tonnage <= 55) {
      recommendedMinSpeed = 4;
      weightClass = 'Medium';
    } else if (tonnage <= 75) {
      recommendedMinSpeed = 3;
      weightClass = 'Heavy';
    } else {
      recommendedMinSpeed = 2;
      weightClass = 'Assault';
    }
    
    if (walkSpeed < recommendedMinSpeed) {
      suggestions.push({
        id: 'speed-low-for-class',
        category: 'movement',
        severity: 'minor',
        message: `Speed is low for ${weightClass} class (${walkSpeed}/${recommendedMinSpeed} minimum)`,
        explanation: 'Consider increasing engine rating for better tactical mobility.'
      });
    }
    
    return suggestions;
  }
  
  private analyzeJumpOptimization(tonnage: number, jumpMP: number, walkSpeed: number): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];
    
    if (jumpMP === 0 && walkSpeed <= 3) {
      suggestions.push({
        id: 'slow-no-jump',
        category: 'movement',
        severity: 'minor',
        message: 'Slow unit with no jump capability may have mobility issues',
        explanation: 'Consider adding jump jets for tactical flexibility.'
      });
    }
    
    if (jumpMP > walkSpeed * 1.5) {
      suggestions.push({
        id: 'excessive-jump-capability',
        category: 'movement',
        severity: 'minor',
        message: 'Jump capability seems excessive compared to ground speed',
        explanation: 'Consider reallocating tonnage from jump jets to other systems.'
      });
    }
    
    return suggestions;
  }
  
  private analyzeWeaponCostEfficiency(weapons: FullEquipment[]): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];
    
    // Analyze expensive weapons with low damage
    const inefficientWeapons = weapons.filter(weapon => {
      const damage = Number(weapon.damage) || 0;
      const weight = Number(weapon.weight) || 0;
      return weight > 5 && damage < weight * 2; // Simplified efficiency check
    });
    
    if (inefficientWeapons.length > 0) {
      suggestions.push({
        id: 'cost-inefficient-weapons',
        category: 'cost',
        severity: 'info',
        message: 'Some weapons may be cost-inefficient',
        explanation: 'Consider alternatives with better damage-to-weight ratios.'
      });
    }
    
    return suggestions;
  }
  
  private analyzeArmorCostEfficiency(unit: EditableUnit): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];
    
    const armorType = (unit.data as any).armor_type || 'Standard';
    const armorTonnage = (unit.data as any).armor_tonnage || 0;
    
    // Suggest armor type optimization
    if (armorType === 'Standard' && armorTonnage > 10) {
      suggestions.push({
        id: 'consider-ferro-fibrous',
        category: 'cost',
        severity: 'info',
        message: 'Consider Ferro-Fibrous armor for better protection per ton',
        explanation: 'Ferro-Fibrous provides 12% more protection for the same tonnage.'
      });
    }
    
    return suggestions;
  }
  
  private determineUnitRole(tonnage: number, weapons: FullEquipment[], walkSpeed: number, totalArmor: number): string {
    // Simplified role determination
    if (tonnage <= 35) {
      return walkSpeed >= 6 ? 'Scout' : 'Light Striker';
    } else if (tonnage <= 55) {
      return weapons.length > 6 ? 'Skirmisher' : 'Medium Fighter';
    } else if (tonnage <= 75) {
      return totalArmor > tonnage * 2 ? 'Brawler' : 'Fire Support';
    } else {
      return walkSpeed <= 2 ? 'Assault' : 'Heavy Striker';
    }
  }
  
  private analyzeRoleConsistency(role: string, unit: EditableUnit): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];
    
    // Add role-specific suggestions
    suggestions.push({
      id: 'role-identified',
      category: 'structure',
      severity: 'info',
      message: `Unit appears optimized for ${role} role`,
      explanation: `Consider focusing equipment choices to better support the ${role} role.`
    });
    
    return suggestions;
  }
  
  // Helper methods
  private requiresAmmo(weapon: FullEquipment): boolean {
    const name = weapon.name?.toLowerCase() || '';
    return name.includes('autocannon') || name.includes('ac/') || 
           name.includes('lrm') || name.includes('srm') || 
           name.includes('missile') || name.includes('gauss');
  }
  
  private analyzeWeaponSizes(weapons: FullEquipment[]): { hasOnlySmall: boolean } {
    const smallWeapons = weapons.filter(weapon => {
      const weight = Number(weapon.weight) || 0;
      return weight <= 1; // Small weapons are typically 1 ton or less
    });
    
    return {
      hasOnlySmall: smallWeapons.length === weapons.length && weapons.length > 0
    };
  }
  
  private calculateJumpJetWeight(tonnage: number, jumpMP: number): number {
    if (jumpMP === 0) return 0;
    
    // Jump jet weight by tonnage class
    if (tonnage <= 55) {
      return jumpMP * 0.5; // Light/Medium: 0.5 tons per jet
    } else if (tonnage <= 85) {
      return jumpMP * 1.0; // Heavy: 1 ton per jet
    } else {
      return jumpMP * 2.0; // Assault: 2 tons per jet
    }
  }
  
  private calculateEquipmentWeight(unit: EditableUnit): number {
    const equipment = this.getAllEquipment(unit);
    return equipment.reduce((total, item) => {
      return total + (Number(item.weight) || 0);
    }, 0);
  }
  
  private getLocationArmor(armorData: Record<string, any>, location: string): number {
    const locationData = armorData[location];
    if (typeof locationData === 'object' && locationData !== null) {
      return (locationData.front || 0) + (locationData.rear || 0);
    }
    return Number(locationData) || 0;
  }
}
