/**
 * Cost Calculator - Calculates C-Bill costs for BattleTech units
 * Implements TechManual cost calculation rules with proper component costs and multipliers
 * Following SOLID principles - Single Responsibility for cost calculations
 */

import { EditableUnit } from '../../types/editor';
import { FullEquipment } from '../../types/index';
import {
  ICostCalculator,
  ValidationContext
} from './ValidationTypes';

export class CostCalculator implements ICostCalculator {
  
  /**
   * Calculate total C-Bill cost for the unit
   */
  calculateCost(unit: EditableUnit, context: ValidationContext): number {
    console.log('[CostCalculator] Calculating unit cost');
    
    try {
      // Calculate base components
      const structureCost = this.calculateStructureCost(unit);
      const engineCost = this.calculateEngineCost(unit);
      const gyroCost = this.calculateGyroCost(unit);
      const cockpitCost = this.calculateCockpitCost(unit);
      const armorCost = this.calculateArmorCost(unit);
      const heatSinkCost = this.calculateHeatSinkCost(unit);
      const equipmentCost = this.calculateEquipmentCost(unit);
      const jumpJetCost = this.calculateJumpJetCost(unit);
      
      // Calculate base cost (sum of all components)
      const baseCost = structureCost + engineCost + gyroCost + cockpitCost + 
                      armorCost + heatSinkCost + equipmentCost + jumpJetCost;
      
      // Apply technology base multiplier
      const techMultiplier = this.getTechBaseMultiplier(unit);
      const finalCost = Math.round(baseCost * techMultiplier);
      
      console.log(`[CostCalculator] Cost Components:`);
      console.log(`  Structure: ${structureCost} C-Bills`);
      console.log(`  Engine: ${engineCost} C-Bills`);
      console.log(`  Gyro: ${gyroCost} C-Bills`);
      console.log(`  Cockpit: ${cockpitCost} C-Bills`);
      console.log(`  Armor: ${armorCost} C-Bills`);
      console.log(`  Heat Sinks: ${heatSinkCost} C-Bills`);
      console.log(`  Equipment: ${equipmentCost} C-Bills`);
      console.log(`  Jump Jets: ${jumpJetCost} C-Bills`);
      console.log(`  Base Cost: ${baseCost} C-Bills`);
      console.log(`  Tech Multiplier: ${techMultiplier}x`);
      console.log(`  Final Cost: ${finalCost} C-Bills`);
      
      return finalCost;
      
    } catch (error) {
      console.error('[CostCalculator] Error calculating cost:', error);
      return 0;
    }
  }
  
  /**
   * Calculate structure cost
   */
  calculateStructureCost(unit: EditableUnit): number {
    const tonnage = (unit.data as any).tonnage || 0;
    const structureType = (unit.data as any).structure_type || 'Standard';
    
    // Base structure cost: 400 C-Bills per ton
    let baseCost = tonnage * 400;
    
    // Structure type multipliers
    switch (structureType) {
      case 'Endo Steel':
        baseCost *= 1.6; // 60% increase
        break;
      case 'Endo Steel (Clan)':
        baseCost *= 1.6;
        break;
      case 'Composite':
        baseCost *= 2.4; // 140% increase
        break;
      case 'Reinforced':
        baseCost *= 2.0; // 100% increase
        break;
      case 'Industrial':
        baseCost *= 0.5; // 50% cost reduction
        break;
      default:
        // Standard - no change
        break;
    }
    
    return Math.round(baseCost);
  }
  
  /**
   * Calculate engine cost
   */
  calculateEngineCost(unit: EditableUnit): number {
    const engineRating = (unit.data as any).engine_rating || 0;
    const engineType = (unit.data as any).engine_type || 'Standard';
    
    if (engineRating === 0) return 0;
    
    // Base engine cost formula: Rating² × 5,000 ÷ 75
    let baseCost = (engineRating * engineRating * 5000) / 75;
    
    // Engine type multipliers
    switch (engineType) {
      case 'XL':
        baseCost *= 2.0; // Double cost
        break;
      case 'Clan XL':
        baseCost *= 2.0;
        break;
      case 'Light':
        baseCost *= 1.75; // 75% increase
        break;
      case 'Clan Light':
        baseCost *= 1.75;
        break;
      case 'XXL':
        baseCost *= 10.0; // 10x cost
        break;
      case 'Compact':
        baseCost *= 1.5; // 50% increase
        break;
      case 'ICE':
        baseCost = engineRating * 1250; // Different formula for ICE
        break;
      case 'Fuel Cell':
        baseCost = engineRating * 3500; // Different formula for Fuel Cell
        break;
      default:
        // Standard - no change
        break;
    }
    
    return Math.round(baseCost);
  }
  
  /**
   * Calculate gyro cost
   */
  calculateGyroCost(unit: EditableUnit): number {
    const engineRating = (unit.data as any).engine_rating || 0;
    const gyroType = (unit.data as any).gyro_type || 'Standard';
    
    if (engineRating === 0) return 0;
    
    // Base gyro cost: Engine Rating × 300
    let baseCost = engineRating * 300;
    
    // Gyro type multipliers
    switch (gyroType) {
      case 'XL':
        baseCost *= 2.0; // Double cost
        break;
      case 'Compact':
        baseCost *= 1.5; // 50% increase
        break;
      case 'Heavy-Duty':
        baseCost *= 2.0; // Double cost
        break;
      default:
        // Standard - no change
        break;
    }
    
    return Math.round(baseCost);
  }
  
  /**
   * Calculate cockpit cost
   */
  calculateCockpitCost(unit: EditableUnit): number {
    const cockpitType = (unit.data as any).cockpit_type || 'Standard';
    
    // Base cockpit cost
    switch (cockpitType) {
      case 'Standard':
        return 200000; // 200,000 C-Bills
      case 'Small':
        return 175000; // 175,000 C-Bills
      case 'Torso-Mounted':
        return 750000; // 750,000 C-Bills
      case 'Industrial':
        return 100000; // 100,000 C-Bills
      case 'Primitive':
        return 100000; // 100,000 C-Bills
      default:
        return 200000; // Default to standard
    }
  }
  
  /**
   * Calculate armor cost
   */
  calculateArmorCost(unit: EditableUnit): number {
    const armorTonnage = (unit.data as any).armor_tonnage || 0;
    const armorType = (unit.data as any).armor_type || 'Standard';
    
    if (armorTonnage === 0) return 0;
    
    // Base armor cost per ton
    let costPerTon = 10000; // Standard armor: 10,000 C-Bills per ton
    
    // Armor type cost multipliers
    switch (armorType) {
      case 'Ferro-Fibrous':
        costPerTon = 20000; // 20,000 C-Bills per ton
        break;
      case 'Ferro-Fibrous (Clan)':
        costPerTon = 20000;
        break;
      case 'Light Ferro-Fibrous':
        costPerTon = 15000; // 15,000 C-Bills per ton
        break;
      case 'Heavy Ferro-Fibrous':
        costPerTon = 25000; // 25,000 C-Bills per ton
        break;
      case 'Stealth':
        costPerTon = 50000; // 50,000 C-Bills per ton
        break;
      case 'Reactive':
        costPerTon = 30000; // 30,000 C-Bills per ton
        break;
      case 'Reflective':
        costPerTon = 30000; // 30,000 C-Bills per ton
        break;
      case 'Hardened':
        costPerTon = 15000; // 15,000 C-Bills per ton
        break;
      default:
        // Standard armor
        break;
    }
    
    return Math.round(armorTonnage * costPerTon);
  }
  
  /**
   * Calculate heat sink cost
   */
  calculateHeatSinkCost(unit: EditableUnit): number {
    const externalHeatSinks = (unit.data as any).external_heat_sinks || 0;
    const heatSinkType = (unit.data as any).heat_sink_type || 'Single';
    
    if (externalHeatSinks === 0) return 0;
    
    // Heat sink cost per unit
    let costPerHeatSink = 2000; // Single heat sink: 2,000 C-Bills
    
    switch (heatSinkType) {
      case 'Double':
        costPerHeatSink = 6000; // 6,000 C-Bills
        break;
      case 'Double (Clan)':
        costPerHeatSink = 6000;
        break;
      case 'Compact':
        costPerHeatSink = 3000; // 3,000 C-Bills
        break;
      case 'Laser':
        costPerHeatSink = 6000; // 6,000 C-Bills
        break;
      default:
        // Single heat sink
        break;
    }
    
    return externalHeatSinks * costPerHeatSink;
  }
  
  /**
   * Calculate base cost (structure, engine, gyro, cockpit, armor, heat sinks, jump jets)
   */
  calculateBaseCost(unit: EditableUnit): number {
    console.log('[CostCalculator] Calculating base cost');
    
    const structureCost = this.calculateStructureCost(unit);
    const engineCost = this.calculateEngineCost(unit);
    const gyroCost = this.calculateGyroCost(unit);
    const cockpitCost = this.calculateCockpitCost(unit);
    const armorCost = this.calculateArmorCost(unit);
    const heatSinkCost = this.calculateHeatSinkCost(unit);
    const jumpJetCost = this.calculateJumpJetCost(unit);
    
    const baseCost = structureCost + engineCost + gyroCost + cockpitCost + 
                    armorCost + heatSinkCost + jumpJetCost;
    
    console.log(`[CostCalculator] Base cost components:`);
    console.log(`  Structure: ${structureCost} C-Bills`);
    console.log(`  Engine: ${engineCost} C-Bills`);
    console.log(`  Gyro: ${gyroCost} C-Bills`);
    console.log(`  Cockpit: ${cockpitCost} C-Bills`);
    console.log(`  Armor: ${armorCost} C-Bills`);
    console.log(`  Heat Sinks: ${heatSinkCost} C-Bills`);
    console.log(`  Jump Jets: ${jumpJetCost} C-Bills`);
    console.log(`  Total Base Cost: ${baseCost} C-Bills`);
    
    return baseCost;
  }
  
  /**
   * Calculate equipment cost
   */
  calculateEquipmentCost(unit: EditableUnit): number {
    console.log('[CostCalculator] Calculating equipment cost');
    
    let totalCost = 0;
    const equipment = this.getAllEquipment(unit);
    
    equipment.forEach(item => {
      const itemCost = this.getEquipmentCost(item);
      totalCost += itemCost;
      
      if (itemCost > 0) {
        console.log(`  ${item.name}: ${itemCost} C-Bills`);
      }
    });
    
    console.log(`[CostCalculator] Total equipment cost: ${totalCost} C-Bills`);
    return totalCost;
  }
  
  /**
   * Calculate jump jet cost
   */
  calculateJumpJetCost(unit: EditableUnit): number {
    const jumpMP = (unit.data as any).jump_mp || 0;
    const jumpJetType = (unit.data as any).jump_jet_type || 'Standard Jump Jet';
    const tonnage = (unit.data as any).tonnage || 0;
    
    if (jumpMP === 0) return 0;
    
    // Jump jet cost varies by tonnage class and type
    let costPerJet = 0;
    
    // Base cost by tonnage class
    if (tonnage <= 55) {
      costPerJet = 50000; // Light/Medium: 50,000 C-Bills per jet
    } else if (tonnage <= 85) {
      costPerJet = 100000; // Heavy: 100,000 C-Bills per jet
    } else {
      costPerJet = 200000; // Assault: 200,000 C-Bills per jet
    }
    
    // Jump jet type multipliers
    switch (jumpJetType) {
      case 'Improved Jump Jet':
        costPerJet *= 2.0; // Double cost
        break;
      case 'UMU':
        costPerJet *= 1.5; // 50% increase
        break;
      case 'Mechanical Jump Booster':
        costPerJet *= 1.2; // 20% increase
        break;
      case 'Partial Wing':
        costPerJet = 50000; // Fixed cost regardless of tonnage
        break;
      default:
        // Standard jump jet - no change
        break;
    }
    
    return Math.round(jumpMP * costPerJet);
  }
  
  /**
   * Get technology base cost multiplier
   */
  private getTechBaseMultiplier(unit: EditableUnit): number {
    const techBase = (unit.data as any).tech_base || 'Inner Sphere';
    const era = (unit.data as any).era || '3025';
    
    // Basic tech base multipliers
    let multiplier = 1.0;
    
    if (techBase === 'Clan') {
      multiplier = 1.2; // Clan tech is 20% more expensive
    }
    
    // Era availability multipliers
    if (era.includes('Star League') || era.includes('2750')) {
      multiplier *= 0.9; // Star League era discount
    } else if (era.includes('3025') || era.includes('Succession Wars')) {
      multiplier *= 1.0; // Standard pricing
    } else if (era.includes('3050') || era.includes('Clan Invasion')) {
      multiplier *= 1.1; // Premium for new tech
    } else if (era.includes('3067') || era.includes('FedCom Civil War')) {
      multiplier *= 1.15; // Higher costs during war
    } else if (era.includes('3145') || era.includes('Dark Age')) {
      multiplier *= 1.2; // Premium for advanced tech
    }
    
    return multiplier;
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
   * Get cost for individual equipment
   */
  private getEquipmentCost(equipment: FullEquipment): number {
    const name = equipment.name?.toLowerCase() || '';
    
    // Special component costs (should be included in base costs, so return 0)
    if (this.isSpecialComponent(equipment)) {
      return 0; // Already counted in structure/armor costs
    }
    
    // Weapon costs
    if (this.isWeapon(equipment)) {
      return this.getWeaponCost(equipment);
    }
    
    // Ammunition costs
    if (name.includes('ammo')) {
      return this.getAmmoCost(equipment);
    }
    
    // Electronic warfare equipment
    if (name.includes('ecm') || name.includes('guardian')) {
      return 200000; // 200,000 C-Bills
    }
    
    if (name.includes('ams') || name.includes('anti-missile')) {
      return 100000; // 100,000 C-Bills
    }
    
    // CASE protection
    if (name.includes('case')) {
      return 50000; // 50,000 C-Bills
    }
    
    // Targeting computers
    if (name.includes('targeting computer')) {
      const tonnage = Number(equipment.weight) || 1;
      return tonnage * 10000; // 10,000 C-Bills per ton
    }
    
    // Artemis fire control
    if (name.includes('artemis')) {
      return 100000; // 100,000 C-Bills per system
    }
    
    // Default equipment cost based on tonnage
    const tonnage = Number(equipment.weight) || 0;
    return Math.round(tonnage * 5000); // 5,000 C-Bills per ton default
  }
  
  /**
   * Get weapon cost
   */
  private getWeaponCost(weapon: FullEquipment): number {
    const name = weapon.name?.toLowerCase() || '';
    const damage = Number(weapon.damage) || 0;
    const tonnage = Number(weapon.weight) || 0;
    
    // Energy weapons
    if (name.includes('laser')) {
      if (name.includes('small')) {
        return 11250; // Small Laser
      } else if (name.includes('medium')) {
        return 40000; // Medium Laser
      } else if (name.includes('large')) {
        return 100000; // Large Laser
      } else if (name.includes('er small')) {
        return 11250; // ER Small Laser
      } else if (name.includes('er medium')) {
        return 80000; // ER Medium Laser
      } else if (name.includes('er large')) {
        return 200000; // ER Large Laser
      }
    }
    
    if (name.includes('ppc')) {
      if (name.includes('er')) {
        return 300000; // ER PPC
      } else {
        return 200000; // Standard PPC
      }
    }
    
    // Ballistic weapons
    if (name.includes('autocannon') || name.includes('ac/')) {
      const caliber = this.extractCaliber(name);
      switch (caliber) {
        case '2': return 75000;
        case '5': return 125000;
        case '10': return 200000;
        case '20': return 300000;
        default: return tonnage * 50000;
      }
    }
    
    if (name.includes('gauss')) {
      return 300000; // Gauss Rifle
    }
    
    if (name.includes('machine gun')) {
      return 5000; // Machine Gun
    }
    
    // Missile weapons
    if (name.includes('lrm')) {
      const size = this.extractCaliber(name);
      switch (size) {
        case '5': return 30000;
        case '10': return 100000;
        case '15': return 175000;
        case '20': return 250000;
        default: return tonnage * 40000;
      }
    }
    
    if (name.includes('srm')) {
      const size = this.extractCaliber(name);
      switch (size) {
        case '2': return 10000;
        case '4': return 60000;
        case '6': return 80000;
        default: return tonnage * 30000;
      }
    }
    
    // Default weapon cost based on damage and tonnage
    return Math.round((damage * 10000) + (tonnage * 20000));
  }
  
  /**
   * Get ammunition cost
   */
  private getAmmoCost(ammo: FullEquipment): number {
    const name = ammo.name?.toLowerCase() || '';
    const tonnage = Number(ammo.weight) || 1;
    
    // Ammunition is generally cheap - 1,000 C-Bills per ton
    let costPerTon = 1000;
    
    // Special ammunition types cost more
    if (name.includes('precision') || name.includes('streak')) {
      costPerTon = 6000;
    } else if (name.includes('cluster') || name.includes('inferno')) {
      costPerTon = 4000;
    } else if (name.includes('semi-guided') || name.includes('swarm')) {
      costPerTon = 8000;
    }
    
    return Math.round(tonnage * costPerTon);
  }
  
  /**
   * Check if equipment is a special component
   */
  private isSpecialComponent(equipment: FullEquipment): boolean {
    const name = equipment.name?.toLowerCase() || '';
    const specialEq = equipment as any;
    
    // Check by component type
    if (specialEq.componentType === 'structure' || specialEq.componentType === 'armor') {
      return true;
    }
    
    // Check by name patterns
    const structureTypes = ['endo steel', 'composite', 'reinforced'];
    const armorTypes = ['ferro-fibrous', 'stealth', 'reactive', 'reflective', 'hardened'];
    
    return structureTypes.some(type => name.includes(type)) ||
           armorTypes.some(type => name.includes(type));
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
   * Extract caliber/size from weapon name
   */
  private extractCaliber(name: string): string {
    const match = name.match(/\d+/);
    return match ? match[0] : '';
  }
}
