/**
 * Test script to verify enhancement system functionality
 */

import { UnitCriticalManager, UnitConfiguration } from './utils/criticalSlots/UnitCriticalManager';

// Test basic enhancement configuration
const testConfig: UnitConfiguration = {
  tonnage: 50,
  unitType: 'BattleMech',
  techBase: 'Inner Sphere',
  walkMP: 4,
  engineRating: 200,
  runMP: 6,
  engineType: 'Standard',
  gyroType: 'Standard',
  structureType: 'Standard',
  armorType: 'Standard',
  heatSinkType: 'Single',
  totalHeatSinks: 10,
  internalHeatSinks: 8,
  externalHeatSinks: 2,
  enhancementType: null, // Start with no enhancement
  jumpMP: 0,
  jumpJetType: 'Standard Jump Jet',
  jumpJetCounts: {},
  hasPartialWing: false,
  mass: 50
};

console.log('Testing Enhancement System...');

// Test 1: Create unit with no enhancement
const unit1 = new UnitCriticalManager(testConfig);
const config1 = unit1.getConfiguration();
console.log('Test 1 - No Enhancement:', {
  enhancementType: config1.enhancementType,
  walkMP: config1.walkMP,
  runMP: config1.runMP
});

// Test 2: Update to MASC
const mascConfig = { ...testConfig, enhancementType: 'MASC' as const };
const unit2 = new UnitCriticalManager(mascConfig);
const config2 = unit2.getConfiguration();
console.log('Test 2 - MASC Enhancement:', {
  enhancementType: config2.enhancementType,
  walkMP: config2.walkMP,
  runMP: config2.runMP
});

// Test 3: Update to TSM
const tsmConfig = { ...testConfig, enhancementType: 'Triple Strength Myomer' as const };
const unit3 = new UnitCriticalManager(tsmConfig);
const config3 = unit3.getConfiguration();
console.log('Test 3 - TSM Enhancement:', {
  enhancementType: config3.enhancementType,
  walkMP: config3.walkMP,
  runMP: config3.runMP
});

// Test 4: Update existing unit configuration
console.log('\nTesting configuration updates...');
unit1.updateConfiguration(mascConfig);
const updatedConfig = unit1.getConfiguration();
console.log('Test 4 - Updated to MASC:', {
  enhancementType: updatedConfig.enhancementType,
  walkMP: updatedConfig.walkMP,
  runMP: updatedConfig.runMP
});

console.log('Enhancement system tests completed.');
