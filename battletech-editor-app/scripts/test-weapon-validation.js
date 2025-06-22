/**
 * Test script for weapon range validation
 * Run with: node scripts/test-weapon-validation.js
 */

const { WeaponRangeValidator, initializeWeaponRangeValidation } = require('../utils/weaponRangeValidation');

console.log('=== Weapon Range Validation Test ===\n');

try {
  console.log('Testing weapon range validation...');
  
  // Initialize the validation system
  initializeWeaponRangeValidation();
  
  console.log('✓ All weapons passed range validation');
  
  // Test getting weapons with invalid ranges (should be empty if all are valid)
  const invalidWeapons = WeaponRangeValidator.getWeaponsWithInvalidRanges();
  
  if (invalidWeapons.length === 0) {
    console.log('✓ No weapons found with invalid ranges');
  } else {
    console.log(`⚠ Found ${invalidWeapons.length} weapons with invalid ranges:`);
    invalidWeapons.forEach(weapon => {
      console.log(`  - ${weapon.name} (${weapon.id})`);
    });
  }
  
  console.log('\n=== Test Completed Successfully ===');
  
} catch (error) {
  console.error('❌ Weapon range validation failed:', error.message);
  process.exit(1);
}
