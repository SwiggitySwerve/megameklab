/**
 * Official BattleTech Internal Structure Validation
 * Uses official reference values from validation rules documentation
 */

const { getInternalStructurePoints, getMaxArmorPoints, INTERNAL_STRUCTURE_TABLE } = require('./utils/internalStructureTable');

console.log('=== Official BattleTech Structure Validation ===\n');

// Official reference values from battletech_validation_rules.md
const OFFICIAL_REFERENCE_VALUES = {
    25: { HD: 3, CT: 8, LT: 6, RT: 6, LA: 4, RA: 4, LL: 6, RL: 6 },
    50: { HD: 3, CT: 16, LT: 12, RT: 12, LA: 8, RA: 8, LL: 12, RL: 12 },
    75: { HD: 3, CT: 24, LT: 17, RT: 17, LA: 13, RA: 13, LL: 17, RL: 17 },
    100: { HD: 3, CT: 32, LT: 23, RT: 23, LA: 17, RA: 17, LL: 23, RL: 23 }
};

function calculateMaxArmor(structure) {
    // Head max is 9, all other locations are 2x internal structure
    const headMax = 9;
    const otherLocationsMax = (structure.CT + structure.LT + structure.RT + 
                              structure.LA + structure.RA + structure.LL + structure.RL) * 2;
    
    return headMax + otherLocationsMax;
}

// Test all tonnages, focusing on official reference values
const allTonnages = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
const criticalDiscrepancies = [];
const referenceValidation = [];
const allResults = [];

console.log('🎯 OFFICIAL REFERENCE VALIDATION:');
console.log('='.repeat(80));

// First, validate against official reference values
Object.keys(OFFICIAL_REFERENCE_VALUES).forEach(tonnageStr => {
    const tonnage = parseInt(tonnageStr);
    const official = OFFICIAL_REFERENCE_VALUES[tonnage];
    const current = getInternalStructurePoints(tonnage);
    
    const isMatch = JSON.stringify(current) === JSON.stringify(official);
    const status = isMatch ? '✅' : '❌';
    
    const currentMaxArmor = getMaxArmorPoints(tonnage);
    const officialMaxArmor = calculateMaxArmor(official);
    const currentArmorTonnage = (currentMaxArmor / 16).toFixed(2);
    const officialArmorTonnage = (officialMaxArmor / 16).toFixed(2);
    
    console.log(`${status} ${tonnage}t REFERENCE: ${currentMaxArmor} armor (${currentArmorTonnage}t) ${isMatch ? 'MATCHES OFFICIAL' : 'DIFFERS FROM OFFICIAL'}`);
    
    if (!isMatch) {
        criticalDiscrepancies.push({
            tonnage,
            current,
            official,
            currentMaxArmor,
            officialMaxArmor,
            currentArmorTonnage,
            officialArmorTonnage
        });
    }
    
    referenceValidation.push({
        tonnage,
        isMatch,
        maxArmor: currentMaxArmor,
        armorTonnage: currentArmorTonnage
    });
});

console.log('\n📊 ALL TONNAGES VALIDATION:');
console.log('='.repeat(80));

// Then validate all tonnages (including interpolated ones)
allTonnages.forEach(tonnage => {
    const current = getInternalStructurePoints(tonnage);
    const currentMaxArmor = getMaxArmorPoints(tonnage);
    const currentArmorTonnage = (currentMaxArmor / 16).toFixed(2);
    
    const isOfficialReference = OFFICIAL_REFERENCE_VALUES[tonnage] !== undefined;
    const status = isOfficialReference ? '🎯' : '📐';
    const note = isOfficialReference ? 'OFFICIAL' : 'INTERPOLATED';
    
    console.log(`${status} ${tonnage}t: ${currentMaxArmor} armor (${currentArmorTonnage}t) [${note}]`);
    
    allResults.push({
        tonnage,
        maxArmor: currentMaxArmor,
        armorTonnage: currentArmorTonnage,
        isOfficialReference,
        structure: current
    });
});

// Display critical discrepancies if any
if (criticalDiscrepancies.length > 0) {
    console.log('\n🚨 CRITICAL DISCREPANCIES FROM OFFICIAL VALUES:');
    console.log('='.repeat(80));
    
    criticalDiscrepancies.forEach(disc => {
        console.log(`\n❌ ${disc.tonnage}-ton BattleMech (OFFICIAL REFERENCE):`);
        console.log('   Structure Points:');
        console.log(`      Current:  HD:${disc.current.HD} CT:${disc.current.CT} LT:${disc.current.LT} RT:${disc.current.RT} LA:${disc.current.LA} RA:${disc.current.RA} LL:${disc.current.LL} RL:${disc.current.RL}`);
        console.log(`      Official: HD:${disc.official.HD} CT:${disc.official.CT} LT:${disc.official.LT} RT:${disc.official.RT} LA:${disc.official.LA} RA:${disc.official.RA} LL:${disc.official.LL} RL:${disc.official.RL}`);
        console.log('   Max Armor:');
        console.log(`      Current:  ${disc.currentMaxArmor} points (${disc.currentArmorTonnage}t)`);
        console.log(`      Official: ${disc.officialMaxArmor} points (${disc.officialArmorTonnage}t)`);
    });
    
    console.log('\n🔧 REQUIRED CORRECTIONS FOR OFFICIAL COMPLIANCE:');
    console.log('='.repeat(80));
    console.log('Replace these values in the internal structure table:\n');
    
    criticalDiscrepancies.forEach(disc => {
        const off = disc.official;
        console.log(`    ${disc.tonnage}: { HD: ${off.HD}, CT: ${off.CT}, LT: ${off.LT}, RT: ${off.RT}, LA: ${off.LA}, RA: ${off.RA}, LL: ${off.LL}, RL: ${off.RL} },`);
    });
    
} else {
    console.log('\n✅ ALL OFFICIAL REFERENCE VALUES MATCH!');
    console.log('Internal structure table correctly implements official BattleTech values.');
}

// Summary statistics
console.log('\n📋 VALIDATION SUMMARY:');
console.log('='.repeat(80));

const officialCount = Object.keys(OFFICIAL_REFERENCE_VALUES).length;
const matchingCount = officialCount - criticalDiscrepancies.length;
const accuracy = (matchingCount / officialCount * 100).toFixed(1);

console.log(`Official Reference Tonnages: ${officialCount}`);
console.log(`Matching Official Values: ${matchingCount}`);
console.log(`Accuracy vs Official Rules: ${accuracy}%`);
console.log(`Total Tonnages in Table: ${allTonnages.length}`);
console.log(`Interpolated Values: ${allTonnages.length - officialCount}`);

// Cross-reference with your previous specification
console.log('\n🎯 CROSS-REFERENCE WITH YOUR SPECIFICATIONS:');
console.log('='.repeat(80));

const fiftyTonResult = allResults.find(r => r.tonnage === 50);
if (fiftyTonResult) {
    const expectedArmorPoints = 169; // Your specification
    const actualArmorPoints = fiftyTonResult.maxArmor;
    const expectedTonnage = (expectedArmorPoints / 16).toFixed(2);
    const actualTonnage = fiftyTonResult.armorTonnage;
    
    console.log(`50-ton Specification Check:`);
    console.log(`   Your Requirement: 169 max armor points (${expectedTonnage}t)`);
    console.log(`   Current Value:    ${actualArmorPoints} max armor points (${actualTonnage}t)`);
    
    if (actualArmorPoints === expectedArmorPoints) {
        console.log(`   Status: ✅ MATCHES YOUR SPECIFICATION`);
    } else {
        console.log(`   Status: ❌ DIFFERS FROM YOUR SPECIFICATION`);
        console.log(`   Note: Official table value differs from your requirement`);
    }
}

console.log('\n🎯 VALIDATION COMPLETE');
console.log(`Reference Accuracy: ${accuracy}%`);
console.log(`Implementation: ${criticalDiscrepancies.length === 0 ? 'COMPLIANT' : 'NEEDS CORRECTION'}`);
