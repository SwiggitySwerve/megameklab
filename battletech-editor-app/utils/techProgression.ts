// Tech Progression and Availability System
// Tracks introduction dates, extinction, and reintroduction of equipment

export interface TechProgression {
  introductionYear: number;
  extinctionYear?: number;
  reintroductionYear?: number;
  prototypeYear?: number;
  commonYear?: number;
  faction: string[];
  techBase: 'IS' | 'Clan' | 'Both';
  rulesLevel: 'Introductory' | 'Standard' | 'Advanced' | 'Experimental';
}

export interface AvailabilityRating {
  techRating: string; // A-F, X
  availability: {
    [era: string]: string; // E.g., "C-C-C-B" for different time periods
  };
}

// Equipment Tech Progression Database
export const EQUIPMENT_TECH_DATA: { [key: string]: TechProgression } = {
  // Structure Types
  'standard_structure': {
    introductionYear: 2350,
    faction: ['All'],
    techBase: 'Both',
    rulesLevel: 'Introductory',
  },
  'endo_steel': {
    introductionYear: 2487,
    extinctionYear: 2865,
    reintroductionYear: 3025,
    faction: ['FedSuns', 'Lyran', 'Draconis', 'Liao', 'Marik'],
    techBase: 'IS',
    rulesLevel: 'Standard',
  },
  'endo_steel_clan': {
    introductionYear: 2827,
    faction: ['Clan'],
    techBase: 'Clan',
    rulesLevel: 'Standard',
  },
  'composite': {
    introductionYear: 3061,
    faction: ['FedSuns', 'Lyran'],
    techBase: 'IS',
    rulesLevel: 'Advanced',
  },
  'reinforced': {
    introductionYear: 3057,
    faction: ['Draconis', 'Kurita'],
    techBase: 'IS',
    rulesLevel: 'Advanced',
  },
  
  // Engine Types
  'fusion_engine': {
    introductionYear: 2450,
    faction: ['All'],
    techBase: 'Both',
    rulesLevel: 'Introductory',
  },
  'xl_engine': {
    introductionYear: 2520,
    extinctionYear: 2865,
    reintroductionYear: 3035,
    faction: ['FedSuns', 'Lyran', 'Steiner'],
    techBase: 'IS',
    rulesLevel: 'Standard',
  },
  'xl_engine_clan': {
    introductionYear: 2824,
    faction: ['Clan'],
    techBase: 'Clan',
    rulesLevel: 'Standard',
  },
  'light_fusion_engine': {
    introductionYear: 3062,
    faction: ['FedSuns', 'Draconis'],
    techBase: 'IS',
    rulesLevel: 'Advanced',
  },
  'compact_fusion_engine': {
    introductionYear: 3068,
    faction: ['Lyran', 'Marik'],
    techBase: 'IS',
    rulesLevel: 'Advanced',
  },
  
  // Armor Types
  'standard_armor': {
    introductionYear: 2350,
    faction: ['All'],
    techBase: 'Both',
    rulesLevel: 'Introductory',
  },
  'ferro_fibrous': {
    introductionYear: 2557,
    extinctionYear: 2865,
    reintroductionYear: 3040,
    faction: ['FedSuns', 'Lyran', 'Draconis'],
    techBase: 'IS',
    rulesLevel: 'Standard',
  },
  'ferro_fibrous_clan': {
    introductionYear: 2820,
    faction: ['Clan'],
    techBase: 'Clan',
    rulesLevel: 'Standard',
  },
  'light_ferro_fibrous': {
    introductionYear: 3066,
    faction: ['FedSuns', 'Liao'],
    techBase: 'IS',
    rulesLevel: 'Advanced',
  },
  'heavy_ferro_fibrous': {
    introductionYear: 3069,
    faction: ['Lyran', 'Marik'],
    techBase: 'IS',
    rulesLevel: 'Advanced',
  },
  'stealth_armor': {
    introductionYear: 3052,
    faction: ['Liao', 'CapellanConfederation'],
    techBase: 'IS',
    rulesLevel: 'Advanced',
  },
  'reactive_armor': {
    introductionYear: 3063,
    faction: ['FedSuns', 'Draconis'],
    techBase: 'IS',
    rulesLevel: 'Advanced',
  },
  'reflective_armor': {
    introductionYear: 3061,
    faction: ['Lyran', 'Steiner'],
    techBase: 'IS',
    rulesLevel: 'Advanced',
  },
  'hardened_armor': {
    introductionYear: 3047,
    faction: ['All'],
    techBase: 'Both',
    rulesLevel: 'Advanced',
  },
  'ferro_lamellor': {
    introductionYear: 3070,
    faction: ['Clan'],
    techBase: 'Clan',
    rulesLevel: 'Experimental',
  },
  
  // Heat Sinks
  'single_heat_sink': {
    introductionYear: 2350,
    faction: ['All'],
    techBase: 'Both',
    rulesLevel: 'Introductory',
  },
  'double_heat_sink': {
    introductionYear: 2567,
    extinctionYear: 2865,
    reintroductionYear: 3040,
    faction: ['FedSuns', 'Lyran', 'Draconis'],
    techBase: 'IS',
    rulesLevel: 'Standard',
  },
  'double_heat_sink_clan': {
    introductionYear: 2825,
    faction: ['Clan'],
    techBase: 'Clan',
    rulesLevel: 'Standard',
  },
  
  // Gyros
  'standard_gyro': {
    introductionYear: 2350,
    faction: ['All'],
    techBase: 'Both',
    rulesLevel: 'Introductory',
  },
  'xl_gyro': {
    introductionYear: 3067,
    faction: ['FedSuns', 'Lyran'],
    techBase: 'IS',
    rulesLevel: 'Advanced',
  },
  'compact_gyro': {
    introductionYear: 3068,
    faction: ['Draconis', 'Liao'],
    techBase: 'IS',
    rulesLevel: 'Advanced',
  },
  'heavy_duty_gyro': {
    introductionYear: 3067,
    faction: ['Marik', 'FreeWorldsLeague'],
    techBase: 'IS',
    rulesLevel: 'Advanced',
  },
  
  // Cockpits
  'standard_cockpit': {
    introductionYear: 2350,
    faction: ['All'],
    techBase: 'Both',
    rulesLevel: 'Introductory',
  },
  'small_cockpit': {
    introductionYear: 3060,
    faction: ['Draconis', 'Kurita'],
    techBase: 'IS',
    rulesLevel: 'Advanced',
  },
  'command_console': {
    introductionYear: 3052,
    faction: ['FedSuns', 'Davion'],
    techBase: 'IS',
    rulesLevel: 'Standard',
  },
  
  // Myomer
  'standard_myomer': {
    introductionYear: 2350,
    faction: ['All'],
    techBase: 'Both',
    rulesLevel: 'Introductory',
  },
  'triple_strength_myomer': {
    introductionYear: 3050,
    faction: ['FedSuns', 'Liao'],
    techBase: 'IS',
    rulesLevel: 'Advanced',
  },
  'masc': {
    introductionYear: 2740,
    extinctionYear: 2865,
    reintroductionYear: 3035,
    faction: ['All'],
    techBase: 'Both',
    rulesLevel: 'Standard',
  },
};

// Availability Rating Database
export const AVAILABILITY_RATINGS: { [key: string]: AvailabilityRating } = {
  'standard_structure': {
    techRating: 'A',
    availability: {
      'Age of War': 'C-C-C-C',
      'Star League': 'C-C-C-C',
      'Succession Wars': 'C-C-C-C',
      'Clan Invasion': 'C-C-C-C',
      'Civil War': 'C-C-C-C',
      'Jihad': 'C-C-C-C',
      'Republic': 'C-C-C-C',
      'Dark Age': 'C-C-C-C',
    },
  },
  'endo_steel': {
    techRating: 'E',
    availability: {
      'Age of War': 'X-X-X-X',
      'Star League': 'E-F-D-C',
      'Succession Wars': 'X-X-X-X',
      'Clan Invasion': 'E-F-D-C',
      'Civil War': 'D-E-D-C',
      'Jihad': 'D-D-C-C',
      'Republic': 'C-C-C-C',
      'Dark Age': 'C-C-C-C',
    },
  },
  'xl_engine': {
    techRating: 'E',
    availability: {
      'Age of War': 'X-X-X-X',
      'Star League': 'E-F-E-D',
      'Succession Wars': 'X-X-X-X',
      'Clan Invasion': 'E-E-D-C',
      'Civil War': 'D-D-C-C',
      'Jihad': 'C-C-C-C',
      'Republic': 'C-C-C-C',
      'Dark Age': 'C-C-C-C',
    },
  },
  'ferro_fibrous': {
    techRating: 'E',
    availability: {
      'Age of War': 'X-X-X-X',
      'Star League': 'E-F-D-C',
      'Succession Wars': 'X-X-X-X',
      'Clan Invasion': 'E-F-D-C',
      'Civil War': 'D-E-D-C',
      'Jihad': 'D-D-C-C',
      'Republic': 'C-C-C-C',
      'Dark Age': 'C-C-C-C',
    },
  },
  'double_heat_sink': {
    techRating: 'E',
    availability: {
      'Age of War': 'X-X-X-X',
      'Star League': 'E-E-D-C',
      'Succession Wars': 'X-X-X-X',
      'Clan Invasion': 'E-E-D-C',
      'Civil War': 'D-D-C-C',
      'Jihad': 'C-C-C-C',
      'Republic': 'C-C-C-C',
      'Dark Age': 'C-C-C-C',
    },
  },
  'stealth_armor': {
    techRating: 'F',
    availability: {
      'Age of War': 'X-X-X-X',
      'Star League': 'X-X-X-X',
      'Succession Wars': 'X-X-X-X',
      'Clan Invasion': 'X-X-F-E',
      'Civil War': 'X-F-E-D',
      'Jihad': 'E-E-D-C',
      'Republic': 'D-D-C-C',
      'Dark Age': 'D-D-C-C',
    },
  },
};

// Helper Functions

/**
 * Check if equipment is available in a given year
 */
export function isEquipmentAvailable(
  equipmentId: string, 
  year: number, 
  faction?: string
): boolean {
  const tech = EQUIPMENT_TECH_DATA[equipmentId];
  if (!tech) return false;
  
  // Check year availability
  if (year < tech.introductionYear) return false;
  if (tech.extinctionYear && year >= tech.extinctionYear && 
      (!tech.reintroductionYear || year < tech.reintroductionYear)) {
    return false;
  }
  
  // Check faction availability
  if (faction && tech.faction.length > 0) {
    if (!tech.faction.includes('All') && !tech.faction.includes(faction)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get the era for a given year
 */
export function getEraFromYear(year: number): string {
  if (year < 2571) return 'Age of War';
  if (year < 2785) return 'Star League';
  if (year < 3050) return 'Succession Wars';
  if (year < 3061) return 'Clan Invasion';
  if (year < 3068) return 'Civil War';
  if (year < 3086) return 'Jihad';
  if (year < 3135) return 'Republic';
  return 'Dark Age';
}

/**
 * Parse availability code (e.g., "D-C-E-D-C")
 * Format: TechRating-Availability(ComStar)-Availability(IS)-Availability(Clan)-CommonAvailability
 */
export function parseAvailabilityCode(code: string): {
  techRating: string;
  comStar: string;
  innerSphere: string;
  clan: string;
  common: string;
} {
  const parts = code.split('-');
  return {
    techRating: parts[0] || 'X',
    comStar: parts[1] || 'X',
    innerSphere: parts[2] || 'X',
    clan: parts[3] || 'X',
    common: parts[4] || 'X',
  };
}

/**
 * Get availability rating for equipment
 */
export function getAvailabilityRating(
  equipmentId: string, 
  year: number, 
  faction?: string
): string {
  const rating = AVAILABILITY_RATINGS[equipmentId];
  if (!rating) return 'X-X-X-X';
  
  const era = getEraFromYear(year);
  return rating.availability[era] || 'X-X-X-X';
}

/**
 * Convert numeric tech rating to letter
 */
export function getTechRatingLetter(rating: number): string {
  const ratings = ['A', 'B', 'C', 'D', 'E', 'F', 'X'];
  return ratings[rating - 1] || 'X';
}

/**
 * Get all equipment available for a given year and faction
 */
export function getAvailableEquipment(
  year: number, 
  faction?: string, 
  techBase?: 'IS' | 'Clan' | 'Both'
): string[] {
  return Object.entries(EQUIPMENT_TECH_DATA)
    .filter(([id, tech]) => {
      // Check availability
      if (!isEquipmentAvailable(id, year, faction)) return false;
      
      // Check tech base
      if (techBase && techBase !== 'Both') {
        if (tech.techBase !== 'Both' && tech.techBase !== techBase) {
          return false;
        }
      }
      
      return true;
    })
    .map(([id]) => id);
}

/**
 * Calculate unit's earliest possible year based on equipment
 */
export function calculateEarliestYear(equipmentIds: string[]): number {
  let latestIntroduction = 2350; // Default mech introduction
  
  equipmentIds.forEach(id => {
    const tech = EQUIPMENT_TECH_DATA[id];
    if (tech && tech.introductionYear > latestIntroduction) {
      // Check if there's an extinction period we need to account for
      if (tech.extinctionYear && tech.reintroductionYear) {
        // If reintroduced, use that date if it's later
        latestIntroduction = Math.max(
          tech.introductionYear, 
          tech.reintroductionYear
        );
      } else {
        latestIntroduction = tech.introductionYear;
      }
    }
  });
  
  return latestIntroduction;
}

/**
 * Validate unit equipment for a specific year
 */
export function validateUnitForYear(
  equipmentIds: string[], 
  year: number, 
  faction?: string
): { 
  valid: boolean; 
  invalidEquipment: string[] 
} {
  const invalidEquipment = equipmentIds.filter(
    id => !isEquipmentAvailable(id, year, faction)
  );
  
  return {
    valid: invalidEquipment.length === 0,
    invalidEquipment,
  };
}
