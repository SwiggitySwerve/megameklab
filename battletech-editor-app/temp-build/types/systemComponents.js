/**
 * System Components Data Model
 * Unified structure for tracking mech system components and their critical slot allocations
 */
// Fixed system components that cannot be removed
export const FIXED_SYSTEM_COMPONENTS = [
    // Head components
    'Life Support',
    'Sensors',
    'Cockpit',
    'Command Console',
    'Primitive Cockpit',
    'Torso-Mounted Cockpit',
    // Arm components (except hand/lower arm)
    'Shoulder',
    'Upper Arm Actuator',
    // Leg components  
    'Hip',
    'Upper Leg Actuator',
    'Lower Leg Actuator',
    'Foot Actuator',
    // Torso components
    'Engine',
    'Gyro',
];
// Conditionally removable components
export const CONDITIONALLY_REMOVABLE_COMPONENTS = [
    'Lower Arm Actuator',
    'Hand Actuator',
];
// Special components that take slots but aren't equipment
export const SPECIAL_COMPONENTS = [
    'Endo Steel',
    'Endo Steel (Clan)',
    'Ferro-Fibrous',
    'Ferro-Fibrous (Clan)',
    'Light Ferro-Fibrous',
    'Heavy Ferro-Fibrous',
    'Stealth',
    'Reactive',
    'Reflective',
];
// Actuator dependency rules
export const ARM_ACTUATOR_RULES = {
    'Lower Arm Actuator': {
        canRemove: true,
        removesAlso: ['Hand Actuator'],
        slot: 2,
    },
    'Hand Actuator': {
        canRemove: true,
        requires: ['Lower Arm Actuator'],
        slot: 3,
    },
};
// Re-export slot requirements from centralized utilities for backward compatibility
export { ENGINE_SLOT_REQUIREMENTS } from '../utils/engineCalculations';
export { GYRO_SLOT_REQUIREMENTS } from '../utils/gyroCalculations';
export { COCKPIT_SLOT_REQUIREMENTS } from '../utils/cockpitCalculations';
export { STRUCTURE_SLOT_REQUIREMENTS } from '../utils/structureCalculations';
export { ARMOR_SLOT_REQUIREMENTS } from '../utils/armorCalculations';
// Heat sink calculations
export function calculateIntegratedHeatSinks(engineRating) {
    // Fusion engines include 10 heat sinks, +1 per 25 rating above 250
    if (engineRating >= 250) {
        return 10;
    }
    // Smaller engines get fewer integrated heat sinks
    return Math.floor(engineRating / 25);
}
export function calculateExternalHeatSinks(total, engineRating) {
    const integrated = calculateIntegratedHeatSinks(engineRating);
    return Math.max(0, total - integrated);
}
// Re-export weight calculation functions from centralized utilities for backward compatibility
export { calculateStructureWeight } from '../utils/structureCalculations';
export { calculateArmorWeight } from '../utils/armorCalculations';
export { calculateGyroWeight } from '../utils/gyroCalculations';
// Note: Engine weight calculation has different parameters in the utility
// So we need a wrapper for backward compatibility
export function calculateEngineWeight(rating, type) {
    // Import the function from engineCalculations
    const { calculateEngineWeight: calcEngineWeight } = require('../utils/engineCalculations');
    // The utility expects (rating, mechTonnage, type) but this legacy function doesn't have mechTonnage
    // We'll use a default of 100 tons for backward compatibility
    return calcEngineWeight(rating, 100, type);
}
// Helper to check if a component is fixed
export function isFixedComponent(componentName) {
    if (!componentName)
        return false;
    return FIXED_SYSTEM_COMPONENTS.some(comp => componentName.includes(comp));
}
// Helper to check if a component is conditionally removable
export function isConditionallyRemovable(componentName) {
    if (!componentName)
        return false;
    return CONDITIONALLY_REMOVABLE_COMPONENTS.some(comp => componentName.includes(comp));
}
// Helper to check if a component is a special component
export function isSpecialComponent(componentName) {
    if (!componentName)
        return false;
    return SPECIAL_COMPONENTS.some(comp => componentName.includes(comp));
}
// Helper to determine slot content type
export function getSlotContentType(name) {
    if (!name || name === '-Empty-')
        return 'empty';
    if (name.includes('Heat Sink'))
        return 'heat-sink';
    if (isSpecialComponent(name)) {
        if (name.includes('Endo Steel'))
            return 'endo-steel';
        if (name.includes('Ferro') || name.includes('Stealth') ||
            name.includes('Reactive') || name.includes('Reflective')) {
            return 'ferro-fibrous';
        }
    }
    if (isFixedComponent(name) || isConditionallyRemovable(name)) {
        return 'system';
    }
    return 'equipment';
}
