/**
 * Gyro Calculations Utility
 * Centralized calculations for all gyro types
 */
// Gyro weight multipliers
export const GYRO_WEIGHT_MULTIPLIERS = {
    'Standard': 1.0,
    'Compact': 1.5,
    'Heavy-Duty': 2.0,
    'XL': 0.5
};
// Gyro critical slot requirements
export const GYRO_SLOT_REQUIREMENTS = {
    'Standard': 4,
    'Compact': 2,
    'Heavy-Duty': 4,
    'XL': 6
};
// Gyro technology restrictions
export const GYRO_TECH_RESTRICTIONS = {
    'Standard': {
        techBase: ['Inner Sphere', 'Clan', 'Both'],
        rulesLevel: ['Standard', 'Tournament', 'Advanced', 'Experimental']
    },
    'Compact': {
        techBase: ['Both'],
        rulesLevel: ['Advanced', 'Experimental']
    },
    'Heavy-Duty': {
        techBase: ['Both'],
        rulesLevel: ['Tournament', 'Advanced', 'Experimental']
    },
    'XL': {
        techBase: ['Both'],
        rulesLevel: ['Advanced', 'Experimental']
    }
};
// Gyro special properties
export const GYRO_SPECIAL_PROPERTIES = {
    'Standard': {},
    'Compact': {},
    'Heavy-Duty': {
        hitPointsModifier: 2, // Can take 2 critical hits instead of 1
        pilotingModifier: -1 // Easier piloting
    },
    'XL': {
        criticalHitPenalty: 1 // More vulnerable to criticals
    }
};
/**
 * Calculate gyro weight based on engine rating and gyro type
 */
export function calculateGyroWeight(engineRating, type) {
    // Gyro weight is based on engine rating (1 ton per 100 rating, rounded up)
    const baseWeight = Math.ceil(engineRating / 100);
    const multiplier = GYRO_WEIGHT_MULTIPLIERS[type];
    return baseWeight * multiplier;
}
/**
 * Get gyro slot requirements
 */
export function getGyroSlots(type) {
    return GYRO_SLOT_REQUIREMENTS[type];
}
/**
 * Validate gyro type for tech base and rules level
 */
export function validateGyroType(type, techBase, rulesLevel) {
    const restrictions = GYRO_TECH_RESTRICTIONS[type];
    if (!restrictions)
        return false;
    const validTechBase = restrictions.techBase.includes(techBase) || restrictions.techBase.includes('Both');
    const validRulesLevel = restrictions.rulesLevel.includes(rulesLevel);
    return validTechBase && validRulesLevel;
}
/**
 * Get special properties for gyro type
 */
export function getGyroSpecialProperties(type) {
    return GYRO_SPECIAL_PROPERTIES[type] || {};
}
/**
 * Check if gyro type supports torso-mounted cockpit
 */
export function supportsTorsoMountedCockpit(type) {
    // Torso-mounted cockpits are incompatible with XL gyros
    return type !== 'XL';
}
/**
 * Calculate gyro location (always center torso)
 */
export function getGyroLocation() {
    return 'Center Torso';
}
/**
 * Get all gyro calculations
 */
export function getGyroCalculations(engineRating, type) {
    return {
        weight: calculateGyroWeight(engineRating, type),
        slots: getGyroSlots(type),
        isValid: true,
        specialProperties: getGyroSpecialProperties(type)
    };
}
/**
 * Calculate minimum engine rating for gyro
 * (Gyros need at least 100 rating to function)
 */
export function getMinimumEngineRating() {
    return 100;
}
