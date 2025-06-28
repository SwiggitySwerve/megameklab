/**
 * Comprehensive Internal Structure Table Validation
 * Tests all tonnages (20-100) against official BattleTech construction rules
 */

const { getInternalStructurePoints, getMaxArmorPoints, INTERNAL_STRUCTURE_TABLE } = require('./utils/internalStructureTable');

console.log('=== Complete BattleTech Internal Structure Validation ===\n');

// Official BattleTech formulas from construction guide
function calculateExpectedStructure(tonnage) {
    const baseUnit = tonnage / 10;
    
    return {
        HD: 3, // Always 3 points
        CT: Math.ceil(3.2 * baseUnit), // Center Torso
        LT: Math.ceil(2.1 * baseUnit), // Left Torso  
        RT: Math.ceil(2.1 * baseUnit), // Right Torso
        LA: Math.ceil(1.7 * baseUnit), // Left Arm
        RA: Math.ceil(1.7 * baseUnit), // Right Arm
        LL: Math.ceil(2.1 * baseUnit), // Left Leg
        RL: Math.ceil(2.1 * baseUnit)  // Right Leg
    };
}

function calculateMaxArmor(structure) {
    // Head max is 9, all other locations are 2x internal structure
    const headMax = 9;
    const otherLocationsMax = (structure.CT + structure.LT + structure.RT + 
                              structure.LA + structure.RA + structure.LL + structure.RL) * 2;
    
    return headMax + otherLocationsMax;
}

// Test all tonnages
const tonnages = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
const discrepancies = [];
const results = [];

console.log('Validating all tonnages against official BattleTech formulas...\n');

tonnages.forEach(tonnage => {
    const current = getInternalStructurePoints(tonnage);
    const expected = calculateExpectedStructure(tonnage);
    
    const currentMaxArmor = getMaxArmorPoints(tonnage);
    const expectedMaxArmor = calculateMaxArmor(expected);
    
    const currentArmorTonnage = currentMaxArmor / 16;
    const expectedArmorTonnage = expectedMaxArmor / 16;
    
    // Check for discrepancies
    const hasStructureDiscrepancy = JSON.stringify(current) !== JSON.stringify(expected);
    const hasArmorDiscrepancy = currentMaxArmor !== expectedMaxArmor;
    
    if (hasStructureDiscrepancy || hasArmorDiscrepancy) {
        discrepancies.push({
            tonnage,
            current,
            expected,
            currentMaxArmor,
            expectedMaxArmor,
            currentArmorTonnage: currentArmorTonnage.toFixed(2),
            expectedArmorTonnage: expectedArmorTonnage.toFixed(2)
        });
    }
    
    results.push({
        tonnage,
        maxArmor: currentMaxArmor,
        armorTonnage: currentArmorTonnage.toFixed(2),
        isCorrect: !hasStructureDiscrepancy && !hasArmorDiscrepancy
    });
});

// Display results summary
console.log('📊 VALIDATION SUMMARY:');
console.log('='.repeat(80));

results.forEach(result => {
    const status = result.isCorrect ? '✅' : '❌';
    console.log(`${status} ${result.tonnage}t: ${result.maxArmor} max armor (${result.armorTonnage}t)`);
});

// Display detailed discrepancies
if (discrepancies.length > 0) {
    console.log('\n🚨 DISCREPANCIES FOUND:');
    console.log('='.repeat(80));
    
    discrepancies.forEach(disc => {
        console.log(`\n❌ ${disc.tonnage}-ton BattleMech:`);
        
        // Structure comparison
        if (JSON.stringify(disc.current) !== JSON.stringify(disc.expected)) {
            console.log('   Structure Points:');
            console.log(`      Current:  HD:${disc.current.HD} CT:${disc.current.CT} LT:${disc.current.LT} RT:${disc.current.RT} LA:${disc.current.LA} RA:${disc.current.RA} LL:${disc.current.LL} RL:${disc.current.RL}`);
            console.log(`      Expected: HD:${disc.expected.HD} CT:${disc.expected.CT} LT:${disc.expected.LT} RT:${disc.expected.RT} LA:${disc.expected.LA} RA:${disc.expected.RA} LL:${disc.expected.LL} RL:${disc.expected.RL}`);
        }
        
        // Armor comparison
        if (disc.currentMaxArmor !== disc.expectedMaxArmor) {
            console.log('   Max Armor:');
            console.log(`      Current:  ${disc.currentMaxArmor} points (${disc.currentArmorTonnage}t)`);
            console.log(`      Expected: ${disc.expectedMaxArmor} points (${disc.expectedArmorTonnage}t)`);
        }
    });
    
    // Generate corrected table
    console.log('\n🔧 CORRECTED VALUES:');
    console.log('='.repeat(80));
    console.log('Copy these corrected values into the internal structure table:\n');
    
    discrepancies.forEach(disc => {
        const exp = disc.expected;
        console.log(`    ${disc.tonnage}: { HD: ${exp.HD}, CT: ${exp.CT}, LT: ${exp.LT}, RT: ${exp.RT}, LA: ${exp.LA}, RA: ${exp.RA}, LL: ${exp.LL}, RL: ${exp.RL} },`);
    });
    
} else {
    console.log('\n✅ ALL TONNAGES VALIDATED SUCCESSFULLY!');
    console.log('Internal structure table matches official BattleTech construction rules.');
}

// Cross-reference with construction guide examples
console.log('\n📋 CONSTRUCTION GUIDE CROSS-REFERENCE:');
console.log('='.repeat(80));

const guideExamples = [
    { tonnage: 25, expectedMaxArmor: 'Light class reference' },
    { tonnage: 50, expectedMaxArmor: 'Medium class reference (corrected: 169)' },
    { tonnage: 75, expectedMaxArmor: 'Heavy class reference' },
    { tonnage: 95, expectedMaxArmor: 'Assault class reference' }
];

guideExamples.forEach(example => {
    const result = results.find(r => r.tonnage === example.tonnage);
    if (result) {
        console.log(`${example.tonnage}t (${example.expectedMaxArmor}): ${result.maxArmor} max armor, ${result.armorTonnage}t standard armor`);
    }
});

console.log('\n🎯 VALIDATION COMPLETE');
console.log(`Total tonnages tested: ${tonnages.length}`);
console.log(`Discrepancies found: ${discrepancies.length}`);
console.log(`Accuracy: ${((tonnages.length - discrepancies.length) / tonnages.length * 100).toFixed(1)}%`);
