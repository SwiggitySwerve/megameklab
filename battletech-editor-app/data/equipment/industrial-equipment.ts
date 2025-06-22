import { Equipment } from './types';

// Backhoe
export const BACKHOE: Equipment = {
  id: 'backhoe',
  name: 'Backhoe',
  category: 'Industrial Equipment',
  baseType: 'Backhoe',
  description: 'Excavation equipment for construction and mining operations',
  requiresAmmo: false,
  introductionYear: 2000,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 5,
      crits: 6,
      damage: 6,
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 50000,
      battleValue: 10
    }
  },
  special: ['Industrial Tool', 'Melee Weapon', 'Construction Equipment']
};

// Bulldozer
export const BULLDOZER: Equipment = {
  id: 'bulldozer',
  name: 'Bulldozer',
  category: 'Industrial Equipment',
  baseType: 'Bulldozer',
  description: 'Heavy earth-moving equipment with pushing blade',
  requiresAmmo: false,
  introductionYear: 2000,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 10,
      crits: 8,
      damage: 5,
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 100000,
      battleValue: 12
    }
  },
  special: ['Industrial Tool', 'Pushing Weapon', 'Earth Moving']
};

// Chainsaw
export const CHAINSAW: Equipment = {
  id: 'chainsaw',
  name: 'Chainsaw',
  category: 'Industrial Equipment',
  baseType: 'Chainsaw',
  description: 'Motorized cutting tool for forestry operations',
  requiresAmmo: false,
  introductionYear: 2000,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 2,
      damage: 2,
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 100000,
      battleValue: 4
    }
  },
  special: ['Industrial Tool', 'Cutting Tool', 'Motorized']
};

// Dual Saw
export const DUAL_SAW: Equipment = {
  id: 'dual_saw',
  name: 'Dual Saw',
  category: 'Industrial Equipment',
  baseType: 'Dual Saw',
  description: 'Double-bladed cutting equipment for heavy duty operations',
  requiresAmmo: false,
  introductionYear: 2000,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 3,
      crits: 3,
      damage: 3,
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 150000,
      battleValue: 7
    }
  },
  special: ['Industrial Tool', 'Cutting Tool', 'Dual Blade']
};

// Mining Drill
export const MINING_DRILL: Equipment = {
  id: 'mining_drill',
  name: 'Mining Drill',
  category: 'Industrial Equipment',
  baseType: 'Mining Drill',
  description: 'Heavy-duty drilling equipment for mining operations',
  requiresAmmo: false,
  introductionYear: 2000,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 7,
      crits: 7,
      damage: 7,
      heat: 3,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 100000,
      battleValue: 17
    }
  },
  special: ['Industrial Tool', 'Drilling Equipment', 'Mining Tool']
};

// Pile Driver
export const PILE_DRIVER: Equipment = {
  id: 'pile_driver',
  name: 'Pile Driver',
  category: 'Industrial Equipment',
  baseType: 'Pile Driver',
  description: 'Heavy construction equipment for driving support piles',
  requiresAmmo: false,
  introductionYear: 2000,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 10,
      crits: 8,
      damage: 10,
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 100000,
      battleValue: 20
    }
  },
  special: ['Industrial Tool', 'Pile Driving', 'Construction Equipment']
};

// Wrecking Ball
export const WRECKING_BALL: Equipment = {
  id: 'wrecking_ball',
  name: 'Wrecking Ball',
  category: 'Industrial Equipment',
  baseType: 'Wrecking Ball',
  description: 'Heavy demolition equipment for destroying structures',
  requiresAmmo: false,
  introductionYear: 2000,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 8,
      crits: 8,
      damage: 10,
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 80000,
      battleValue: 18
    }
  },
  special: ['Industrial Tool', 'Demolition Equipment', 'Swinging Weapon']
};

// Salvage Arm
export const SALVAGE_ARM: Equipment = {
  id: 'salvage_arm',
  name: 'Salvage Arm',
  category: 'Industrial Equipment',
  baseType: 'Salvage Arm',
  description: 'Specialized equipment for salvage and recovery operations',
  requiresAmmo: false,
  introductionYear: 2300,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 3,
      crits: 7,
      damage: 0,
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 50000,
      battleValue: 0
    }
  },
  special: ['Industrial Tool', 'Salvage Equipment', 'Non-Combat']
};

// Lift Hoist
export const LIFT_HOIST: Equipment = {
  id: 'lift_hoist',
  name: 'Lift Hoist',
  category: 'Industrial Equipment',
  baseType: 'Lift Hoist',
  description: 'Heavy lifting equipment for construction operations',
  requiresAmmo: false,
  introductionYear: 2000,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 3,
      crits: 3,
      damage: 0,
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 50000,
      battleValue: 0
    }
  },
  special: ['Industrial Tool', 'Lifting Equipment', 'Non-Combat']
};

// Spot Welder
export const SPOT_WELDER: Equipment = {
  id: 'spot_welder',
  name: 'Spot Welder',
  category: 'Industrial Equipment',
  baseType: 'Spot Welder',
  description: 'Precision welding equipment for metal fabrication',
  requiresAmmo: false,
  introductionYear: 2000,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 2,
      crits: 2,
      damage: 5,
      heat: 2,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 75000,
      battleValue: 5
    }
  },
  special: ['Industrial Tool', 'Welding Equipment', 'Heat Weapon']
};

// Extended Fuel Tank
export const EXTENDED_FUEL_TANK: Equipment = {
  id: 'extended_fuel_tank',
  name: 'Extended Fuel Tank',
  category: 'Industrial Equipment',
  baseType: 'Extended Fuel Tank',
  description: 'Additional fuel storage for extended operations',
  requiresAmmo: false,
  introductionYear: 2000,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      damage: 0,
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 1000,
      battleValue: 0
    }
  },
  special: ['Fuel Storage', 'Extended Range', 'Explosive if Breached']
};

// Ladder
export const LADDER: Equipment = {
  id: 'ladder',
  name: 'Ladder',
  category: 'Industrial Equipment',
  baseType: 'Ladder',
  description: 'Deployable ladder for accessing elevated positions',
  requiresAmmo: false,
  introductionYear: 2000,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0.5,
      crits: 1,
      damage: 0,
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 2000,
      battleValue: 0
    }
  },
  special: ['Access Equipment', 'Deployable', 'Non-Combat']
};

// Bridge Layer (Light)
export const LIGHT_BRIDGE_LAYER: Equipment = {
  id: 'light_bridge_layer',
  name: 'Light Bridge Layer',
  category: 'Industrial Equipment',
  baseType: 'Light Bridge Layer',
  description: 'Deployable bridge equipment for light vehicles',
  requiresAmmo: false,
  introductionYear: 2000,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 8,
      crits: 6,
      damage: 0,
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 50000,
      battleValue: 0
    }
  },
  special: ['Bridge Equipment', 'Deployable', 'Engineering Tool']
};

// Bridge Layer (Medium)
export const MEDIUM_BRIDGE_LAYER: Equipment = {
  id: 'medium_bridge_layer',
  name: 'Medium Bridge Layer',
  category: 'Industrial Equipment',
  baseType: 'Medium Bridge Layer',
  description: 'Deployable bridge equipment for medium vehicles',
  requiresAmmo: false,
  introductionYear: 2000,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 15,
      crits: 10,
      damage: 0,
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 100000,
      battleValue: 0
    }
  },
  special: ['Bridge Equipment', 'Deployable', 'Engineering Tool']
};

// Bridge Layer (Heavy)
export const HEAVY_BRIDGE_LAYER: Equipment = {
  id: 'heavy_bridge_layer',
  name: 'Heavy Bridge Layer',
  category: 'Industrial Equipment',
  baseType: 'Heavy Bridge Layer',
  description: 'Deployable bridge equipment for heavy vehicles',
  requiresAmmo: false,
  introductionYear: 2000,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 25,
      crits: 15,
      damage: 0,
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 200000,
      battleValue: 0
    }
  },
  special: ['Bridge Equipment', 'Deployable', 'Engineering Tool']
};

export const INDUSTRIAL_EQUIPMENT: Equipment[] = [
  BACKHOE,
  BULLDOZER,
  CHAINSAW,
  DUAL_SAW,
  MINING_DRILL,
  PILE_DRIVER,
  WRECKING_BALL,
  SALVAGE_ARM,
  LIFT_HOIST,
  SPOT_WELDER,
  EXTENDED_FUEL_TANK,
  LADDER,
  LIGHT_BRIDGE_LAYER,
  MEDIUM_BRIDGE_LAYER,
  HEAVY_BRIDGE_LAYER
];
