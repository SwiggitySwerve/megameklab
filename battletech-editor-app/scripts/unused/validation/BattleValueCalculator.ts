/**
 * Battle Value Calculator - Calculates Battle Value (BV) for BattleTech units
 * Implements BV2 calculation rules with proper weapon values, defensive factors, and modifiers
 * Following SOLID principles - Single Responsibility for BV calculations
 */

import { EditableUnit } from '../../types/editor';
import { FullEquipment } from '../../types/index';
import {
  IBattleValueCalculator,
  ValidationContext
} from './ValidationTypes';

export class BattleValueCalculator implements IBattleValueCalculator {
  
  /**
   * Calculate total Battle Value for the unit
   */
  calculateBattleValue(unit: EditableUnit, context: ValidationContext): number {
    console.log('[BattleValueCalculator] Calculating Battle Value');
    
    try {
      // Calculate base components
      const weaponBV = this.calculateWeaponBV(unit);
      const equipmentBV = this.calculateEquipmentBV(unit);
      const defensiveBV = this.calculateDefensiveBV(unit);
      const movementBV = this.calculateMovementBV(unit);
      const pilotBV = this.calculatePilotBV(unit);
      const quirkModifiers = this.calculateQuirkModifiers(unit);
      
      // Calculate offensive BV (weapons + equipment)
      const offensiveBV = weaponBV + equipmentBV;
      
      // Calculate total BV using BV2 formula
      // BV = (Offensive BV + Defensive BV + Movement BV) * Pilot Multiplier + Quirk Modifiers
      const baseBV = offensiveBV + defensiveBV + movementBV;
      const totalBV = Math.round((baseBV * pilotBV) + quirkModifiers);
      
      console.log(`[BattleValueCalculator] BV Components:`);
      console.log(`  Weapon BV: ${weaponBV}`);
      console.log(`  Equipment BV: ${equipmentBV}`);
      console.log(`  Defensive BV: ${defensiveBV}`);
      console.log(`  Movement BV: ${movementBV}`);
      console.log(`  Pilot Multiplier: ${pilotBV}`);
      console.log(`  Quirk Modifiers: ${quirkModifiers}`);
      console.log(`  Total BV: ${totalBV}`);
      
      return totalBV;
      
    } catch (error) {
      console.error('[BattleValueCalculator] Error calculating BV:', error);
      return 0;
    }
  }
  
  /**
   * Calculate Battle Value from weapons
   */
  calculateWeaponBV(unit: EditableUnit): number {
    console.log('[BattleValueCalculator] Calculating weapon BV');
    
    let weaponBV = 0;
    const equipment = this.getAllEquipment(unit);
    
    equipment.forEach(item => {
      if (this.isWeapon(item)) {
        const itemBV = this.getWeaponBV(item, unit);
        weaponBV += itemBV;
        console.log(`  ${item.name}: ${itemBV} BV`);
      }
    });
    
    console.log(`[BattleValueCalculator] Total weapon BV: ${weaponBV}`);
    return weaponBV;
  }
  
  /**
   * Calculate Battle Value from non-weapon equipment
   */
  calculateEquipmentBV(unit: EditableUnit): number {
    console.log('[BattleValueCalculator] Calculating equipment BV');
    
    let equipmentBV = 0;
    const equipment = this.getAllEquipment(unit);
    
    equipment.forEach(item => {
      if (!this.isWeapon(item)) {
        const itemBV = this.getEquipmentBV(item, unit);
        if (itemBV > 0) {
          equipmentBV += itemBV;
          console.log(`  ${item.name}: ${itemBV} BV`);
        }
      }
    });
    
    console.log(`[BattleValueCalculator] Total equipment BV: ${equipmentBV}`);
    return equipmentBV;
  }
  
  /**
   * Calculate quirk modifiers to Battle Value
   */
  calculateQuirkModifiers(unit: EditableUnit): number {
    console.log('[BattleValueCalculator] Calculating quirk modifiers');
    
    // TODO: Implement quirk system when unit quirks are added
    // For now, return 0 as there's no quirk system implemented
    const quirkModifiers = 0;
    
    console.log(`[BattleValueCalculator] Quirk modifiers: ${quirkModifiers}`);
    return quirkModifiers;
  }
  
  /**
   * Calculate defensive Battle Value (armor + structure)
   */
  private calculateDefensiveBV(unit: EditableUnit): number {
    console.log('[BattleValueCalculator] Calculating defensive BV');
    
    const armorBV = this.calculateArmorBV(unit);
    const structureBV = this.calculateStructureBV(unit);
    const defensiveEquipmentBV = this.calculateDefensiveEquipmentBV(unit);
    
    const totalDefensiveBV = armorBV + structureBV + defensiveEquipmentBV;
    
    console.log(`  Armor BV: ${armorBV}`);
    console.log(`  Structure BV: ${structureBV}`);
    console.log(`  Defensive Equipment BV: ${defensiveEquipmentBV}`);
    console.log(`[BattleValueCalculator] Total defensive BV: ${totalDefensiveBV}`);
    
    return totalDefensiveBV;
  }
  
  /**
   * Calculate movement Battle Value
   */
  private calculateMovementBV(unit: EditableUnit): number {
    console.log('[BattleValueCalculator] Calculating movement BV');
    
    const tonnage = (unit.data as any).tonnage || 0;
    const walkSpeed = (unit.data as any).walk_speed || 0;
    const runSpeed = walkSpeed * 1.5; // Standard run multiplier
    const jumpSpeed = this.getJumpSpeed(unit);
    
    // Base movement BV calculation
    // Higher speed units get more BV for their mobility
    let movementBV = 0;
    
    if (tonnage > 0) {
      // Calculate based on movement profile
      const effectiveSpeed = Math.max(runSpeed, jumpSpeed);
      const speedFactor = effectiveSpeed / tonnage; // Speed-to-weight ratio
      
      // BV2 movement calculation
      movementBV = Math.round(tonnage * speedFactor * 2.5);
      
      // Jump capability bonus
      if (jumpSpeed > 0) {
        movementBV += Math.round(jumpSpeed * tonnage * 0.5);
      }
    }
    
    console.log(`  Walk: ${walkSpeed}, Run: ${runSpeed}, Jump: ${jumpSpeed}`);
    console.log(`[BattleValueCalculator] Movement BV: ${movementBV}`);
    
    return movementBV;
  }
  
  /**
   * Calculate pilot skill Battle Value multiplier
   */
  private calculatePilotBV(unit: EditableUnit): number {
    // Standard tournament pilot is 4/5 (Gunnery 4, Piloting 5)
    // This gives a multiplier of 1.0
    // Better pilots increase BV, worse pilots decrease it
    
    const gunnery = (unit.data as any).pilot_gunnery || 4;
    const piloting = (unit.data as any).pilot_piloting || 5;
    
    // BV2 pilot multiplier table
    const skillTotal = gunnery + piloting;
    let multiplier = 1.0;
    
    if (skillTotal <= 2) multiplier = 2.42;
    else if (skillTotal <= 3) multiplier = 2.24;
    else if (skillTotal <= 4) multiplier = 1.93;
    else if (skillTotal <= 5) multiplier = 1.71;
    else if (skillTotal <= 6) multiplier = 1.5;
    else if (skillTotal <= 7) multiplier = 1.35;
    else if (skillTotal <= 8) multiplier = 1.24;
    else if (skillTotal <= 9) multiplier = 1.0; // Standard 4/5
    else if (skillTotal <= 10) multiplier = 0.95;
    else if (skillTotal <= 11) multiplier = 0.9;
    else if (skillTotal <= 12) multiplier = 0.85;
    else multiplier = 0.8;
    
    console.log(`[BattleValueCalculator] Pilot ${gunnery}/${piloting}, multiplier: ${multiplier}`);
    return multiplier;
  }
  
  /**
   * Calculate armor Battle Value
   */
  private calculateArmorBV(unit: EditableUnit): number {
    const armorData = this.getArmorData(unit);
    const armorType = (unit.data as any).armor_type || 'Standard';
    
    // Calculate total armor points
    let totalArmor = 0;
    Object.values(armorData).forEach(armor => {
      totalArmor += armor || 0;
    });
    
    // Armor type multipliers for BV
    let armorMultiplier = 1.0;
    switch (armorType) {
      case 'Ferro-Fibrous':
      case 'Clan Ferro-Fibrous':
        armorMultiplier = 1.2;
        break;
      case 'Light Ferro-Fibrous':
        armorMultiplier = 1.06;
        break;
      case 'Heavy Ferro-Fibrous':
        armorMultiplier = 1.24;
        break;
      case 'Hardened Armor':
        armorMultiplier = 2.0;
        break;
      case 'Stealth Armor':
        armorMultiplier = 1.5;
        break;
    }
    
    // BV2 armor calculation: 2.5 BV per armor point
    const armorBV = Math.round(totalArmor * 2.5 * armorMultiplier);
    
    console.log(`  Total armor: ${totalArmor} points (${armorType})`);
    console.log(`  Armor multiplier: ${armorMultiplier}`);
    
    return armorBV;
  }
  
  /**
   * Calculate internal structure Battle Value
   */
  private calculateStructureBV(unit: EditableUnit): number {
    const tonnage = (unit.data as any).tonnage || 0;
    const structureType = (unit.data as any).structure_type || 'Standard';
    
    // Base structure points (tonnage-based)
    const baseStructure = Math.floor(tonnage / 10) * 10 + (tonnage % 10);
    
    // Structure type multipliers
    let structureMultiplier = 1.0;
    switch (structureType) {
      case 'Endo Steel':
      case 'Clan Endo Steel':
        structureMultiplier = 1.0; // Same BV as standard for structure
        break;
      case 'Composite':
        structureMultiplier = 1.5;
        break;
      case 'Reinforced':
        structureMultiplier = 2.0;
        break;
    }
    
    // BV2 structure calculation: 1.5 BV per structure point
    const structureBV = Math.round(baseStructure * 1.5 * structureMultiplier);
    
    console.log(`  Structure: ${baseStructure} points (${structureType})`);
    
    return structureBV;
  }
  
  /**
   * Calculate defensive equipment Battle Value
   */
  private calculateDefensiveEquipmentBV(unit: EditableUnit): number {
    let defensiveBV = 0;
    const equipment = this.getAllEquipment(unit);
    
    equipment.forEach(item => {
      if (this.isDefensiveEquipment(item)) {
        defensiveBV += this.getEquipmentBV(item, unit);
      }
    });
    
    return defensiveBV;
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
      'Artillery Weapons', 'Physical Weapons', 'Anti-Personnel Weapons',
      'Capital Weapons', 'One-Shot Weapons', 'Torpedoes'
    ];
    
    return weaponCategories.includes((equipment as any).category || '');
  }
  
  /**
   * Check if equipment provides defensive benefits
   */
  private isDefensiveEquipment(equipment: FullEquipment): boolean {
    const defensiveKeywords = [
      'ECM', 'AMS', 'Anti-Missile', 'Guardian', 'Angel',
      'Stealth', 'Null Signature', 'Void Signature'
    ];
    
    const name = equipment.name?.toLowerCase() || '';
    return defensiveKeywords.some(keyword => name.includes(keyword.toLowerCase()));
  }
  
  /**
   * Get Battle Value for a specific weapon
   */
  private getWeaponBV(weapon: FullEquipment, unit: EditableUnit): number {
    // Base weapon BV from damage and other factors
    const damage = Number(weapon.damage) || 0;
    const heat = Number(weapon.heat) || 0;
    const range = this.getEffectiveRange(weapon);
    const tonnage = Number(weapon.weight) || 0;
    
    if (damage === 0 && !this.isSpecialWeapon(weapon)) {
      return 0; // No damage, no BV (unless special weapon)
    }
    
    // BV2 weapon calculation formula
    // Base: Damage * Range Factor * Heat Factor
    let weaponBV = damage * 10; // Base 10 BV per damage point
    
    // Range modifier
    if (range > 0) {
      const rangeFactor = Math.min(range / 10, 2.0); // Cap at 2x for very long range
      weaponBV *= (1 + rangeFactor * 0.1);
    }
    
    // Heat efficiency factor
    if (heat > 0 && damage > 0) {
      const heatEfficiency = damage / heat;
      if (heatEfficiency > 1) {
        weaponBV *= (1 + (heatEfficiency - 1) * 0.1);
      }
    }
    
    // Special weapon adjustments
    if (this.isSpecialWeapon(weapon)) {
      weaponBV += this.getSpecialWeaponBV(weapon);
    }
    
    // Ammo weapons penalty (need ammo to be effective)
    if ((weapon as any).requiresAmmo) {
      const ammoTons = this.getAmmoTonsForWeapon(weapon, unit);
      if (ammoTons === 0) {
        weaponBV *= 0.1; // Severe penalty for no ammo
      } else if (ammoTons < 2) {
        weaponBV *= 0.7; // Moderate penalty for low ammo
      }
    }
    
    return Math.round(weaponBV);
  }
  
  /**
   * Get Battle Value for non-weapon equipment
   */
  private getEquipmentBV(equipment: FullEquipment, unit: EditableUnit): number {
    const name = equipment.name?.toLowerCase() || '';
    const tonnage = equipment.weight || 0;
    
    // Heat sinks
    if (name.includes('heat sink')) {
      if (name.includes('double')) {
        return 6; // Double heat sinks: 6 BV each
      }
      return 3; // Single heat sinks: 3 BV each
    }
    
    // Jump jets
    if (name.includes('jump jet')) {
      return Math.round(tonnage * 5); // 5 BV per ton
    }
    
    // ECM and defensive systems
    if (name.includes('ecm') || name.includes('guardian')) {
      return 61; // Standard ECM BV
    }
    
    if (name.includes('ams') || name.includes('anti-missile')) {
      return 32; // Standard AMS BV
    }
    
    // CASE and explosive protection
    if (name.includes('case')) {
      return 5; // CASE BV
    }
    
    // Engine and other core systems are included in base BV
    if (name.includes('engine') || name.includes('gyro') || 
        name.includes('cockpit') || name.includes('life support')) {
      return 0; // Already counted in base structure/movement BV
    }
    
    // Default equipment BV based on tonnage and category
    return Math.round(tonnage * 2);
  }
  
  /**
   * Get effective range for weapon BV calculation
   */
  private getEffectiveRange(weapon: FullEquipment): number {
    // Use long range as primary, or medium if long not available
    return (weapon as any).rangeLong || (weapon as any).rangeMedium || (weapon as any).rangeShort || 0;
  }
  
  /**
   * Check if weapon has special properties affecting BV
   */
  private isSpecialWeapon(weapon: FullEquipment): boolean {
    const name = weapon.name?.toLowerCase() || '';
    const special = (weapon as any).special || [];
    
    return special.length > 0 || 
           name.includes('ultra') || 
           name.includes('lb-x') ||
           name.includes('streak') ||
           name.includes('artemis') ||
           name.includes('narc');
  }
  
  /**
   * Get additional BV for special weapon properties
   */
  private getSpecialWeaponBV(weapon: FullEquipment): number {
    const name = weapon.name?.toLowerCase() || '';
    const special = (weapon as any).special || [];
    const damage = Number(weapon.damage) || 0;
    let specialBV = 0;
    
    // Ultra autocannons
    if (name.includes('ultra')) {
      specialBV += damage * 2; // Extra damage potential
    }
    
    // LB-X autocannons
    if (name.includes('lb-x')) {
      specialBV += damage * 1.5; // Cluster rounds
    }
    
    // Streak missiles
    if (name.includes('streak')) {
      specialBV += damage * 1.5; // Guaranteed hit
    }
    
    // Artemis FCS
    if (name.includes('artemis')) {
      specialBV += damage * 0.5; // Improved accuracy
    }
    
    // NARC beacon
    if (name.includes('narc')) {
      specialBV += 20; // Fixed BV for NARC capability
    }
    
    return Math.round(specialBV);
  }
  
  /**
   * Get amount of ammo for a specific weapon
   */
  private getAmmoTonsForWeapon(weapon: FullEquipment, unit: EditableUnit): number {
    const equipment = this.getAllEquipment(unit);
    const weaponName = weapon.name?.toLowerCase() || '';
    
    let ammoTons = 0;
    equipment.forEach(item => {
      const itemName = item.name?.toLowerCase() || '';
      if (itemName.includes('ammo') && 
          (itemName.includes(weaponName) || this.isCompatibleAmmo(weapon, item))) {
        ammoTons += item.weight || 0;
      }
    });
    
    return ammoTons;
  }
  
  /**
   * Check if ammo is compatible with weapon
   */
  private isCompatibleAmmo(weapon: FullEquipment, ammo: FullEquipment): boolean {
    const weaponName = weapon.name?.toLowerCase() || '';
    const ammoName = ammo.name?.toLowerCase() || '';
    
    // Basic compatibility check
    if (weaponName.includes('ac/') && ammoName.includes('ac/')) {
      return this.extractCaliber(weaponName) === this.extractCaliber(ammoName);
    }
    
    if (weaponName.includes('lrm') && ammoName.includes('lrm')) {
      return this.extractCaliber(weaponName) === this.extractCaliber(ammoName);
    }
    
    if (weaponName.includes('srm') && ammoName.includes('srm')) {
      return this.extractCaliber(weaponName) === this.extractCaliber(ammoName);
    }
    
    return false;
  }
  
  /**
   * Extract caliber/size from weapon/ammo name
   */
  private extractCaliber(name: string): string {
    const match = name.match(/\d+/);
    return match ? match[0] : '';
  }
  
  /**
   * Get jump speed from jump jets
   */
  private getJumpSpeed(unit: EditableUnit): number {
    const equipment = this.getAllEquipment(unit);
    let jumpJets = 0;
    
    equipment.forEach(item => {
      if (item.name?.toLowerCase().includes('jump jet')) {
        jumpJets += 1;
      }
    });
    
    return jumpJets; // Each jump jet provides 1 jump MP
  }
  
  /**
   * Get armor data from unit
   */
  private getArmorData(unit: EditableUnit): Record<string, number> {
    const armorData = unit.data.armor;
    const result: Record<string, number> = {};
    
    if (armorData && typeof armorData === 'object') {
      const locations = ['head', 'center_torso', 'left_torso', 'right_torso', 
                        'left_arm', 'right_arm', 'left_leg', 'right_leg',
                        'center_torso_rear', 'left_torso_rear', 'right_torso_rear'];
      
      locations.forEach(location => {
        const value = (armorData as any)[location];
        if (typeof value === 'number') {
          result[location] = value;
        }
      });
    }
    
    return result;
  }
}
