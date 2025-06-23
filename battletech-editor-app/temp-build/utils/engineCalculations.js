/**
 * Engine Calculations Utility
 * Centralized calculations for all engine types
 */
// Engine weight multipliers with IS/Clan XL differentiation
export const ENGINE_WEIGHT_MULTIPLIERS = {
    'Standard': 1.0,
    'XL (IS)': 0.5,
    'XL (Clan)': 0.5,
    'Light': 0.75,
    'XXL': 0.33,
    'Compact': 1.5,
    'ICE': 2.0,
    'Fuel Cell': 1.5
};
// Engine slot requirements with IS/Clan XL differentiation
export const ENGINE_SLOT_REQUIREMENTS = {
    'Standard': { centerTorso: 6, leftTorso: 0, rightTorso: 0 },
    'XL (IS)': { centerTorso: 6, leftTorso: 3, rightTorso: 3 }, // IS XL: 3 slots per side torso
    'XL (Clan)': { centerTorso: 6, leftTorso: 2, rightTorso: 2 }, // Clan XL: 2 slots per side torso
    'Light': { centerTorso: 6, leftTorso: 2, rightTorso: 2 },
    'XXL': { centerTorso: 6, leftTorso: 6, rightTorso: 6 },
    'Compact': { centerTorso: 3, leftTorso: 0, rightTorso: 0 },
    'ICE': { centerTorso: 6, leftTorso: 0, rightTorso: 0 },
    'Fuel Cell': { centerTorso: 6, leftTorso: 0, rightTorso: 0 }
};
// Engine heat sink capacity
export const ENGINE_HEAT_SINKS = {
    FUSION_BASE: 10,
    MIN_RATING_FOR_FULL: 250,
    HEAT_SINKS_PER_25_RATING: 1
};
/**
 * Calculate engine weight based on rating, mech tonnage, and engine type
 */
export function calculateEngineWeight(rating, mechTonnage, type) {
    const baseWeight = (rating * mechTonnage) / 1000;
    const multiplier = ENGINE_WEIGHT_MULTIPLIERS[type];
    return Math.ceil(baseWeight * multiplier * 2) / 2; // Round to nearest 0.5 ton
}
/**
 * Calculate total engine slots
 */
export function calculateEngineSlots(type) {
    const slots = ENGINE_SLOT_REQUIREMENTS[type];
    return slots.centerTorso + slots.leftTorso + slots.rightTorso;
}
/**
 * Get engine slot distribution by location
 */
export function getEngineSlotDistribution(type) {
    return ENGINE_SLOT_REQUIREMENTS[type];
}
/**
 * Calculate integrated heat sinks based on engine rating
 */
export function calculateIntegratedHeatSinks(engineRating, engineType) {
    // Non-fusion engines don't provide heat sinks
    if (engineType === 'ICE' || engineType === 'Fuel Cell') {
        return 0;
    }
    // Fusion engines include 10 heat sinks for ratings 250+
    if (engineRating >= ENGINE_HEAT_SINKS.MIN_RATING_FOR_FULL) {
        return ENGINE_HEAT_SINKS.FUSION_BASE;
    }
    // Smaller engines get fewer integrated heat sinks
    return Math.floor(engineRating / 25);
}
/**
 * Get all engine calculations
 */
export function getEngineCalculations(rating, mechTonnage, type) {
    return {
        weight: calculateEngineWeight(rating, mechTonnage, type),
        totalSlots: calculateEngineSlots(type),
        slotDistribution: getEngineSlotDistribution(type),
        integratedHeatSinks: calculateIntegratedHeatSinks(rating, type)
    };
}
/**
 * Validate engine rating for mech tonnage
 */
export function validateEngineRating(rating, mechTonnage, maxWalkMP = 20) {
    const walkMP = Math.floor(rating / mechTonnage);
    return walkMP >= 1 && walkMP <= maxWalkMP;
}
/**
 * Calculate walk MP from engine rating and tonnage
 */
export function calculateWalkMP(engineRating, mechTonnage) {
    return Math.floor(engineRating / mechTonnage);
}
/**
 * Calculate required engine rating for desired walk MP
 */
export function calculateRequiredEngineRating(walkMP, mechTonnage) {
    return walkMP * mechTonnage;
}
