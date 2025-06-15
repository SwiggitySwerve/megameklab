/**
 * Equipment Color Coding System
 * Provides visual clarity for different equipment types in critical slots
 */

export enum EquipmentCategory {
  SYSTEM_COMPONENT = 'system_component',
  UNHITTABLE = 'unhittable',
  ENERGY_WEAPON = 'energy_weapon',
  BALLISTIC_WEAPON = 'ballistic_weapon',
  MISSILE_WEAPON = 'missile_weapon',
  MOVEMENT_EQUIPMENT = 'movement_equipment',
  HEAT_SINK = 'heat_sink',
  ARMOR_STRUCTURE = 'armor_structure',
  BALLISTIC_AMMO = 'ballistic_ammo',
  MISSILE_AMMO = 'missile_ammo',
  ENERGY_AMMO = 'energy_ammo',
  ELECTRONICS = 'electronics',
  PHYSICAL_WEAPON = 'physical_weapon',
  MISC_EQUIPMENT = 'misc_equipment',
  EMPTY = 'empty'
}

// Color scheme for equipment categories
export const EQUIPMENT_COLORS: Record<EquipmentCategory, { bg: string; border: string; text: string }> = {
  [EquipmentCategory.SYSTEM_COMPONENT]: {
    bg: 'bg-gray-700',      // Darker gray for fixed system components
    border: 'border-gray-600',
    text: 'text-gray-100'
  },
  [EquipmentCategory.UNHITTABLE]: {
    bg: 'bg-gray-500',      // Light gray for unhittables
    border: 'border-gray-400',
    text: 'text-gray-100'
  },
  [EquipmentCategory.ENERGY_WEAPON]: {
    bg: 'bg-yellow-600',    // Yellow for energy weapons
    border: 'border-yellow-500',
    text: 'text-gray-900'
  },
  [EquipmentCategory.BALLISTIC_WEAPON]: {
    bg: 'bg-purple-600',    // Purple for ballistic weapons
    border: 'border-purple-500',
    text: 'text-gray-100'
  },
  [EquipmentCategory.MISSILE_WEAPON]: {
    bg: 'bg-teal-600',      // Teal for missile weapons
    border: 'border-teal-500',
    text: 'text-gray-100'
  },
  [EquipmentCategory.MOVEMENT_EQUIPMENT]: {
    bg: 'bg-blue-600',      // Blue for jump jets, MASC, supercharger
    border: 'border-blue-500',
    text: 'text-gray-100'
  },
  [EquipmentCategory.HEAT_SINK]: {
    bg: 'bg-green-600',     // Green for heat sinks
    border: 'border-green-500',
    text: 'text-gray-100'
  },
  [EquipmentCategory.ARMOR_STRUCTURE]: {
    bg: 'bg-rose-600',      // Rose for armor/structure components
    border: 'border-rose-500',
    text: 'text-gray-100'
  },
  [EquipmentCategory.BALLISTIC_AMMO]: {
    bg: 'bg-purple-400',    // Lavender for ballistic ammo
    border: 'border-purple-300',
    text: 'text-gray-900'
  },
  [EquipmentCategory.MISSILE_AMMO]: {
    bg: 'bg-cyan-400',      // Aqua for missile ammo
    border: 'border-cyan-300',
    text: 'text-gray-900'
  },
  [EquipmentCategory.ENERGY_AMMO]: {
    bg: 'bg-yellow-400',    // Light yellow for energy ammo
    border: 'border-yellow-300',
    text: 'text-gray-900'
  },
  [EquipmentCategory.ELECTRONICS]: {
    bg: 'bg-green-500',     // Green for electronics (ECM, BAP, etc.)
    border: 'border-green-400',
    text: 'text-gray-100'
  },
  [EquipmentCategory.PHYSICAL_WEAPON]: {
    bg: 'bg-red-600',       // Red for physical weapons
    border: 'border-red-500',
    text: 'text-gray-100'
  },
  [EquipmentCategory.MISC_EQUIPMENT]: {
    bg: 'bg-gray-600',      // Medium gray for misc equipment
    border: 'border-gray-500',
    text: 'text-gray-100'
  },
  [EquipmentCategory.EMPTY]: {
    bg: 'bg-slate-800',     // Dark background for empty slots
    border: 'border-slate-700',
    text: 'text-gray-400'
  }
};

// System components that cannot be removed
const SYSTEM_COMPONENTS = [
  'Engine', 'Gyro', 'Cockpit', 'Life Support', 'Sensors',
  'Shoulder', 'Upper Arm Actuator', 'Upper Leg Actuator', 
  'Hip', 'Lower Leg Actuator', 'Foot Actuator'
];

// Components that can potentially be removed
const REMOVABLE_ACTUATORS = ['Lower Arm Actuator', 'Hand Actuator'];

// Unhittable components
const UNHITTABLE_COMPONENTS = [
  'Endo Steel', 'Endo Steel (Clan)', 'Composite', 'Reinforced',
  'Ferro-Fibrous', 'Ferro-Fibrous (Clan)', 'Light Ferro-Fibrous',
  'Heavy Ferro-Fibrous', 'Stealth', 'Reactive', 'Reflective', 'Hardened'
];

// Energy weapons
const ENERGY_WEAPONS = [
  'Small Laser', 'Medium Laser', 'Large Laser', 'ER Small Laser', 
  'ER Medium Laser', 'ER Large Laser', 'Pulse Laser', 'ER PPC', 'PPC',
  'Light PPC', 'Heavy PPC', 'Snub-Nose PPC', 'Flamer', 'Plasma Rifle',
  'TAG', 'Small X-Pulse Laser', 'Medium X-Pulse Laser', 'Large X-Pulse Laser'
];

// Ballistic weapons
const BALLISTIC_WEAPONS = [
  'Machine Gun', 'AC/2', 'AC/5', 'AC/10', 'AC/20', 'Ultra AC/2', 
  'Ultra AC/5', 'Ultra AC/10', 'Ultra AC/20', 'LB 2-X AC', 'LB 5-X AC',
  'LB 10-X AC', 'LB 20-X AC', 'Gauss Rifle', 'Light Gauss Rifle',
  'Heavy Gauss Rifle', 'Rotary AC/2', 'Rotary AC/5'
];

// Missile weapons
const MISSILE_WEAPONS = [
  'SRM 2', 'SRM 4', 'SRM 6', 'LRM 5', 'LRM 10', 'LRM 15', 'LRM 20',
  'Streak SRM 2', 'Streak SRM 4', 'Streak SRM 6', 'MRM 10', 'MRM 20',
  'MRM 30', 'MRM 40', 'Rocket Launcher 10', 'Rocket Launcher 15',
  'Rocket Launcher 20', 'Thunderbolt 5', 'Thunderbolt 10', 'Thunderbolt 15',
  'Thunderbolt 20', 'Arrow IV', 'NARC', 'iNARC'
];

// Movement equipment
const MOVEMENT_EQUIPMENT = [
  'Jump Jet', 'Jump Jets', 'Improved Jump Jet', 'Improved Jump Jets',
  'MASC', 'Supercharger', 'Triple Strength Myomer', 'TSM'
];

// Electronics
const ELECTRONICS = [
  'ECM Suite', 'Guardian ECM Suite', 'Angel ECM Suite', 'BAP',
  'Beagle Active Probe', 'Bloodhound Active Probe', 'C3 Computer',
  'C3 Slave', 'C3 Master', 'C3i Computer', 'Targeting Computer'
];

// Physical weapons
const PHYSICAL_WEAPONS = [
  'Hatchet', 'Sword', 'Mace', 'Claws', 'Talons', 'Spikes'
];

/**
 * Determine the category of an equipment item based on its name
 */
export function getEquipmentCategory(itemName: string): EquipmentCategory {
  if (!itemName || itemName === '-Empty-') {
    return EquipmentCategory.EMPTY;
  }

  // Check system components first
  if (SYSTEM_COMPONENTS.some(comp => itemName.includes(comp))) {
    return EquipmentCategory.SYSTEM_COMPONENT;
  }

  // Check removable actuators - these are still system components but can be removed
  if (REMOVABLE_ACTUATORS.some(comp => itemName.includes(comp))) {
    return EquipmentCategory.SYSTEM_COMPONENT;
  }

  // Check unhittables
  if (UNHITTABLE_COMPONENTS.some(comp => itemName.includes(comp))) {
    return EquipmentCategory.UNHITTABLE;
  }

  // Check heat sinks
  if (itemName.includes('Heat Sink')) {
    return EquipmentCategory.HEAT_SINK;
  }

  // Check ammo - determine type based on weapon it's for
  if (itemName.includes('Ammo') || itemName.includes('(OS)')) {
    // Check if it's ballistic ammo
    if (BALLISTIC_WEAPONS.some(weapon => itemName.includes(weapon))) {
      return EquipmentCategory.BALLISTIC_AMMO;
    }
    // Check if it's missile ammo
    if (MISSILE_WEAPONS.some(weapon => itemName.includes(weapon))) {
      return EquipmentCategory.MISSILE_AMMO;
    }
    // Check for specific missile ammo
    if (itemName.includes('SRM') || itemName.includes('LRM') || itemName.includes('MRM') || 
        itemName.includes('Streak') || itemName.includes('Rocket') || itemName.includes('Arrow') ||
        itemName.includes('Thunderbolt') || itemName.includes('NARC')) {
      return EquipmentCategory.MISSILE_AMMO;
    }
    // Check for energy ammo (plasma rifle, etc)
    if (itemName.includes('Plasma')) {
      return EquipmentCategory.ENERGY_AMMO;
    }
    // Default to ballistic ammo for unspecified
    return EquipmentCategory.BALLISTIC_AMMO;
  }

  // Check energy weapons
  if (ENERGY_WEAPONS.some(weapon => itemName.includes(weapon))) {
    return EquipmentCategory.ENERGY_WEAPON;
  }

  // Check ballistic weapons
  if (BALLISTIC_WEAPONS.some(weapon => itemName.includes(weapon))) {
    return EquipmentCategory.BALLISTIC_WEAPON;
  }

  // Check missile weapons
  if (MISSILE_WEAPONS.some(weapon => itemName.includes(weapon))) {
    return EquipmentCategory.MISSILE_WEAPON;
  }

  // Check movement equipment
  if (MOVEMENT_EQUIPMENT.some(equip => itemName.includes(equip))) {
    return EquipmentCategory.MOVEMENT_EQUIPMENT;
  }

  // Check electronics
  if (ELECTRONICS.some(equip => itemName.includes(equip))) {
    return EquipmentCategory.ELECTRONICS;
  }

  // Check physical weapons
  if (PHYSICAL_WEAPONS.some(weapon => itemName.includes(weapon))) {
    return EquipmentCategory.PHYSICAL_WEAPON;
  }

  // Default to misc equipment
  return EquipmentCategory.MISC_EQUIPMENT;
}

/**
 * Get the color classes for an equipment item
 */
export function getEquipmentColorClasses(itemName: string): { bg: string; border: string; text: string } {
  const category = getEquipmentCategory(itemName);
  return EQUIPMENT_COLORS[category];
}

/**
 * Get the color style for an equipment item (for inline styles if needed)
 */
export function getEquipmentColorStyle(itemName: string): React.CSSProperties {
  const category = getEquipmentCategory(itemName);
  const colorMap: Record<EquipmentCategory, React.CSSProperties> = {
    [EquipmentCategory.SYSTEM_COMPONENT]: { 
      backgroundColor: '#374151', 
      borderColor: '#4B5563', 
      color: '#F3F4F6' 
    },
    [EquipmentCategory.UNHITTABLE]: { 
      backgroundColor: '#6B7280', 
      borderColor: '#9CA3AF', 
      color: '#F3F4F6' 
    },
    [EquipmentCategory.ENERGY_WEAPON]: { 
      backgroundColor: '#D97706', 
      borderColor: '#F59E0B', 
      color: '#111827' 
    },
    [EquipmentCategory.BALLISTIC_WEAPON]: { 
      backgroundColor: '#7C3AED', 
      borderColor: '#8B5CF6', 
      color: '#F3F4F6' 
    },
    [EquipmentCategory.MISSILE_WEAPON]: { 
      backgroundColor: '#14B8A6', 
      borderColor: '#2DD4BF', 
      color: '#F3F4F6' 
    },
    [EquipmentCategory.MOVEMENT_EQUIPMENT]: { 
      backgroundColor: '#2563EB', 
      borderColor: '#3B82F6', 
      color: '#F3F4F6' 
    },
    [EquipmentCategory.HEAT_SINK]: { 
      backgroundColor: '#059669', 
      borderColor: '#10B981', 
      color: '#F3F4F6' 
    },
    [EquipmentCategory.ARMOR_STRUCTURE]: { 
      backgroundColor: '#E11D48', 
      borderColor: '#F43F5E', 
      color: '#F3F4F6' 
    },
    [EquipmentCategory.BALLISTIC_AMMO]: { 
      backgroundColor: '#C084FC', 
      borderColor: '#D8B4FE', 
      color: '#111827' 
    },
    [EquipmentCategory.MISSILE_AMMO]: { 
      backgroundColor: '#5EEAD4', 
      borderColor: '#99F6E4', 
      color: '#111827' 
    },
    [EquipmentCategory.ENERGY_AMMO]: { 
      backgroundColor: '#FDE047', 
      borderColor: '#FEF08A', 
      color: '#111827' 
    },
    [EquipmentCategory.ELECTRONICS]: { 
      backgroundColor: '#10B981', 
      borderColor: '#34D399', 
      color: '#F3F4F6' 
    },
    [EquipmentCategory.PHYSICAL_WEAPON]: { 
      backgroundColor: '#DC2626', 
      borderColor: '#EF4444', 
      color: '#F3F4F6' 
    },
    [EquipmentCategory.MISC_EQUIPMENT]: { 
      backgroundColor: '#4B5563', 
      borderColor: '#6B7280', 
      color: '#F3F4F6' 
    },
    [EquipmentCategory.EMPTY]: { 
      backgroundColor: '#1E293B', 
      borderColor: '#334155', 
      color: '#9CA3AF' 
    }
  };
  
  return colorMap[category];
}

/**
 * Get a legend for the equipment colors
 */
export function getEquipmentColorLegend(): Array<{ category: string; label: string; color: string }> {
  return [
    { category: EquipmentCategory.SYSTEM_COMPONENT, label: 'System Components', color: '#374151' },
    { category: EquipmentCategory.UNHITTABLE, label: 'Unhittable', color: '#6B7280' },
    { category: EquipmentCategory.ENERGY_WEAPON, label: 'Energy Weapons', color: '#D97706' },
    { category: EquipmentCategory.BALLISTIC_WEAPON, label: 'Ballistic Weapons', color: '#7C3AED' },
    { category: EquipmentCategory.MISSILE_WEAPON, label: 'Missile Weapons', color: '#14B8A6' },
    { category: EquipmentCategory.MOVEMENT_EQUIPMENT, label: 'Movement', color: '#2563EB' },
    { category: EquipmentCategory.HEAT_SINK, label: 'Heat Sinks', color: '#059669' },
    { category: EquipmentCategory.ARMOR_STRUCTURE, label: 'Armor/Structure', color: '#E11D48' },
    { category: EquipmentCategory.BALLISTIC_AMMO, label: 'Ballistic Ammo', color: '#C084FC' },
    { category: EquipmentCategory.MISSILE_AMMO, label: 'Missile Ammo', color: '#5EEAD4' },
    { category: EquipmentCategory.ENERGY_AMMO, label: 'Energy Ammo', color: '#FDE047' },
    { category: EquipmentCategory.ELECTRONICS, label: 'Electronics', color: '#10B981' },
    { category: EquipmentCategory.PHYSICAL_WEAPON, label: 'Physical Weapons', color: '#DC2626' },
    { category: EquipmentCategory.MISC_EQUIPMENT, label: 'Misc Equipment', color: '#4B5563' }
  ];
}
