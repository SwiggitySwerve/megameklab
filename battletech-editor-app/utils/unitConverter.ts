import { FullUnit, WeaponOrEquipmentItem } from '../types';
import { CustomizableUnit, UnitEquipmentItem, EquipmentItem } from '../types/customizer';

/**
 * Converts a FullUnit from the compendium to a CustomizableUnit for display analysis
 */
export function convertFullUnitToCustomizable(fullUnit: FullUnit): CustomizableUnit {
  const uData = fullUnit.data || {};
  
  return {
    id: fullUnit.id,
    chassis: fullUnit.chassis || uData.chassis || '',
    model: fullUnit.model || uData.model || '',
    type: 'BattleMech', // Default for now, could be determined from unit data
    mass: fullUnit.mass || uData.mass || 0,
    data: {
      chassis: fullUnit.chassis || uData.chassis || '',
      model: fullUnit.model || uData.model || '',
      mass: fullUnit.mass || uData.mass || 0,
      tech_base: uData.tech_base || fullUnit.tech_base || 'Inner Sphere',
      era: uData.era || fullUnit.era || '',
      type: 'BattleMech',
      config: uData.config || 'Biped',
      
      movement: uData.movement ? {
        walk_mp: uData.movement.walk_mp || 0,
        run_mp: uData.movement.run_mp || (uData.movement.walk_mp || 0) * 1.5,
        jump_mp: uData.movement.jump_mp || 0
      } : undefined,
      
      armor: uData.armor ? {
        type: uData.armor.type || 'Standard',
        locations: uData.armor.locations?.map(loc => ({
          location: loc.location,
          armor_points: loc.armor_points,
          rear_armor_points: loc.rear_armor_points
        })) || []
      } : undefined,
      
      engine: uData.engine ? {
        type: uData.engine.type || 'Fusion',
        rating: uData.engine.rating || 0
      } : undefined,
      
      structure: uData.structure ? {
        type: uData.structure.type || 'Standard'
      } : undefined,
      
      heat_sinks: uData.heat_sinks ? {
        type: uData.heat_sinks.type || 'Single',
        count: uData.heat_sinks.count || 10
      } : undefined,
      
      weapons_and_equipment: uData.weapons_and_equipment?.map((item, index) => ({
        item_name: item.item_name,
        item_type: item.item_type,
        location: item.location,
        rear_facing: item.rear_facing || false,
        turret_mounted: item.turret_mounted || false
      })) || [],
      
      criticals: uData.criticals?.map(crit => ({
        location: crit.location,
        slots: crit.slots || []
      })) || [],
      
      // Additional fields that might be useful for analysis
      role: typeof uData.role === 'object' ? uData.role?.name : uData.role || fullUnit.role,
      source: uData.source || fullUnit.source || '',
      mul_id: uData.mul_id || fullUnit.mul_id,
      quirks: uData.quirks?.map(quirk => 
        typeof quirk === 'string' ? quirk : quirk.name
      ) || [],
      fluff_text: uData.fluff_text
    }
  };
}

/**
 * Converts weapons and equipment from FullUnit to loadout format
 */
export function convertWeaponsToLoadout(fullUnit: FullUnit): UnitEquipmentItem[] {
  const uData = fullUnit.data || {};
  if (!uData.weapons_and_equipment) return [];
  
  return uData.weapons_and_equipment.map((item, index) => ({
    id: `${fullUnit.id}-${index}`,
    item_name: item.item_name,
    item_type: item.item_type as 'weapon' | 'ammo' | 'equipment',
    location: item.location,
    quantity: 1, // Default quantity
    rear_facing: item.rear_facing || false,
    turret_mounted: item.turret_mounted || false
  }));
}

/**
 * Creates mock available equipment based on the unit's equipped items
 * This is a simplified version - in a real implementation, you'd fetch from equipment database
 */
export function createMockAvailableEquipment(fullUnit: FullUnit): EquipmentItem[] {
  const uData = fullUnit.data || {};
  if (!uData.weapons_and_equipment) return [];
  
  // Create equipment items from the unit's weapons and equipment
  const equipmentMap = new Map<string, EquipmentItem>();
  
  uData.weapons_and_equipment.forEach((item, index) => {
    if (!equipmentMap.has(item.item_name)) {
      equipmentMap.set(item.item_name, {
        id: `eq-${index}`,
        internal_id: item.item_name,
        name: item.item_name,
        type: item.item_type,
        category: getEquipmentCategory(item),
        tonnage: parseFloat(String(item.tons || 0)),
        critical_slots: parseInt(String(item.crits || 1)),
        tech_base: item.tech_base || 'IS',
        data: item, // Store the original item data
        weapon_details: item.item_type === 'weapon' ? {
          damage: parseFloat(String(item.damage || 0)),
          heat: item.heat || 0,
          range: item.range ? {
            short: item.range.short || 0,
            medium: item.range.medium || 0,
            long: item.range.long || 0,
            extreme: item.range.extreme
          } : undefined,
          ammo_per_ton: item.ammo_per_ton ? parseInt(String(item.ammo_per_ton)) : undefined
        } : undefined
      });
    }
  });
  
  return Array.from(equipmentMap.values());
}

/**
 * Determines equipment category based on item name and type
 */
function getEquipmentCategory(item: WeaponOrEquipmentItem): string {
  const itemName = item.item_name.toLowerCase();
  
  if (item.item_type === 'weapon') {
    if (itemName.includes('laser') || itemName.includes('ppc') || itemName.includes('flamer')) {
      return 'Energy Weapons';
    } else if (itemName.includes('autocannon') || itemName.includes('ac/') || itemName.includes('gauss')) {
      return 'Ballistic Weapons';
    } else if (itemName.includes('lrm') || itemName.includes('srm') || itemName.includes('missile')) {
      return 'Missile Weapons';
    } else if (itemName.includes('hatchet') || itemName.includes('sword') || itemName.includes('claw')) {
      return 'Physical Weapons';
    }
    return 'Weapons';
  } else if (item.item_type === 'ammo') {
    return 'Ammunition';
  } else if (itemName.includes('heat sink')) {
    return 'Heat Management';
  } else if (itemName.includes('jump jet')) {
    return 'Movement';
  } else if (itemName.includes('case') || itemName.includes('artemis') || itemName.includes('targeting')) {
    return 'Fire Control';
  }
  
  return 'Equipment';
}
