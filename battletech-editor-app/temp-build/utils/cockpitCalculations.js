/**
 * Cockpit Calculations Utility
 * Centralized calculations for all cockpit types
 */
// Cockpit fixed weights (in tons)
export const COCKPIT_WEIGHTS = {
    'Standard': 3,
    'Small': 2,
    'Command Console': 3,
    'Torso-Mounted': 4,
    'Interface': 2,
    'Primitive': 5
};
// Cockpit critical slot requirements
export const COCKPIT_SLOT_REQUIREMENTS = {
    'Standard': { head: 1, centerTorso: 0 },
    'Small': { head: 1, centerTorso: 0 },
    'Command Console': { head: 2, centerTorso: 0 },
    'Torso-Mounted': { head: 0, centerTorso: 1 },
    'Interface': { head: 1, centerTorso: 0 },
    'Primitive': { head: 5, centerTorso: 0 }
};
// Cockpit technology restrictions
export const COCKPIT_TECH_RESTRICTIONS = {
    'Standard': {
        techBase: ['Inner Sphere', 'Clan', 'Both'],
        rulesLevel: ['Standard', 'Tournament', 'Advanced', 'Experimental']
    },
    'Small': {
        techBase: ['Both'],
        rulesLevel: ['Advanced', 'Experimental']
    },
    'Command Console': {
        techBase: ['Both'],
        rulesLevel: ['Advanced', 'Experimental']
    },
    'Torso-Mounted': {
        techBase: ['Both'],
        rulesLevel: ['Advanced', 'Experimental'],
        incompatibleWith: ['XL Gyro']
    },
    'Interface': {
        techBase: ['Both'],
        rulesLevel: ['Experimental']
    },
    'Primitive': {
        techBase: ['Both'],
        rulesLevel: ['Standard', 'Tournament', 'Advanced', 'Experimental']
    }
};
// Cockpit special properties
export const COCKPIT_SPECIAL_PROPERTIES = {
    'Standard': {
        ejectionCapable: true,
        lifeSupport: true
    },
    'Small': {
        ejectionCapable: true,
        lifeSupport: true,
        pilotingModifier: 1 // +1 penalty to piloting
    },
    'Command Console': {
        ejectionCapable: false, // No ejection
        lifeSupport: true,
        initiativeBonus: -2, // -2 to initiative (better)
        commandBonus: 1 // Can coordinate other units
    },
    'Torso-Mounted': {
        ejectionCapable: false, // No ejection
        lifeSupport: true,
        pilotingModifier: 1 // +1 penalty to piloting
    },
    'Interface': {
        ejectionCapable: false, // No ejection
        lifeSupport: false, // No life support
        consciousness: false // Pilot unconscious during operation
    },
    'Primitive': {
        ejectionCapable: false, // No ejection
        lifeSupport: true,
        pilotingModifier: 1 // +1 penalty to piloting
    }
};
/**
 * Get cockpit weight
 */
export function getCockpitWeight(type) {
    return COCKPIT_WEIGHTS[type];
}
/**
 * Get cockpit total slot requirements
 */
export function getCockpitSlots(type) {
    const slots = COCKPIT_SLOT_REQUIREMENTS[type];
    return slots.head + slots.centerTorso;
}
/**
 * Get cockpit slot distribution by location
 */
export function getCockpitSlotDistribution(type) {
    return COCKPIT_SLOT_REQUIREMENTS[type];
}
/**
 * Validate cockpit type for tech base and rules level
 */
export function validateCockpitType(type, techBase, rulesLevel, gyroType) {
    const restrictions = COCKPIT_TECH_RESTRICTIONS[type];
    if (!restrictions)
        return false;
    const validTechBase = restrictions.techBase.includes(techBase) || restrictions.techBase.includes('Both');
    const validRulesLevel = restrictions.rulesLevel.includes(rulesLevel);
    // Check incompatibilities (e.g., Torso-Mounted with XL Gyro)
    let compatible = true;
    if (restrictions.incompatibleWith && gyroType) {
        compatible = !restrictions.incompatibleWith.includes(gyroType);
    }
    return validTechBase && validRulesLevel && compatible;
}
/**
 * Get special properties for cockpit type
 */
export function getCockpitSpecialProperties(type) {
    return COCKPIT_SPECIAL_PROPERTIES[type] || {};
}
/**
 * Check if cockpit requires additional equipment
 */
export function getCockpitRequirements(type) {
    const requirements = [];
    // Command Console requires communication equipment
    if (type === 'Command Console') {
        requirements.push('Communication Equipment');
    }
    // Interface cockpit requires neural interface
    if (type === 'Interface') {
        requirements.push('Neural Interface');
    }
    return requirements;
}
/**
 * Check if cockpit supports CASE
 */
export function supportsCASE(type) {
    // Only cockpits with ejection systems support CASE
    const properties = COCKPIT_SPECIAL_PROPERTIES[type];
    return properties?.ejectionCapable || false;
}
/**
 * Get all cockpit calculations
 */
export function getCockpitCalculations(type) {
    return {
        weight: getCockpitWeight(type),
        totalSlots: getCockpitSlots(type),
        slotDistribution: getCockpitSlotDistribution(type),
        isValid: true,
        specialProperties: getCockpitSpecialProperties(type)
    };
}
/**
 * Get cockpit components that occupy fixed slots
 */
export function getCockpitComponents(type) {
    const components = [];
    // All cockpits include basic components
    if (type !== 'Interface') {
        components.push('Life Support');
    }
    components.push('Sensors');
    components.push('Cockpit');
    // Command Console adds extra command equipment
    if (type === 'Command Console') {
        components.push('Command Console');
    }
    return components;
}
