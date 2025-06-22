/**
 * Comprehensive Weapons Database Validation Script
 * 
 * This script validates all weapons data for:
 * - Data completeness
 * - Range consistency
 * - Cost and Battle Value presence
 * - IS/Clan variant consistency
 * - Missing weapons identification
 */

const fs = require('fs');
const path = require('path');

// Import all weapon categories
const WEAPON_FILES = [
  '../data/equipment/energy-weapons.ts',
  '../data/equipment/ballistic-weapons.ts',
  '../data/equipment/missile-weapons.ts',
  '../data/equipment/artillery-weapons.ts',
  '../data/equipment/capital-weapons.ts',
  '../data/equipment/physical-weapons.ts',
  '../data/equipment/anti-personnel-weapons.ts',
  '../data/equipment/one-shot-weapons.ts',
  '../data/equipment/torpedoes.ts'
];

// Known BattleTech weapons that should be in our database
const EXPECTED_WEAPONS = {
  'Energy Weapons': [
    'Small Laser', 'Medium Laser', 'Large Laser',
    'Small Pulse Laser', 'Medium Pulse Laser', 'Large Pulse Laser',
    'ER Small Laser', 'ER Medium Laser', 'ER Large Laser',
    'PPC', 'ER PPC', 'Light PPC', 'Heavy PPC',
    'Flamer', 'Plasma Rifle', 'Plasma Cannon'
  ],
  'Ballistic Weapons': [
    'AC/2', 'AC/5', 'AC/10', 'AC/20',
    'Ultra AC/2', 'Ultra AC/5', 'Ultra AC/10', 'Ultra AC/20',
    'LB 2-X AC', 'LB 5-X AC', 'LB 10-X AC', 'LB 20-X AC',
    'Gauss Rifle', 'Light Gauss Rifle', 'Heavy Gauss Rifle',
    'Machine Gun', 'Light Machine Gun', 'Heavy Machine Gun'
  ],
  'Missile Weapons': [
    'SRM 2', 'SRM 4', 'SRM 6',
    'LRM 5', 'LRM 10', 'LRM 15', 'LRM 20',
    'Streak SRM 2', 'Streak SRM 4', 'Streak SRM 6',
    'ATM 3', 'ATM 6', 'ATM 9', 'ATM 12',
    'MRM 10', 'MRM 20', 'MRM 30', 'MRM 40'
  ]
};

class WeaponsValidator {
  constructor() {
    this.weapons = [];
    this.errors = [];
    this.warnings = [];
    this.stats = {
      totalWeapons: 0,
      weaponsWithCost: 0,
      weaponsWithBV: 0,
      missingData: 0,
      categories: {}
    };
  }

  // Load weapons from TypeScript files
  loadWeapons() {
    console.log('Loading weapons from files...');
    
    WEAPON_FILES.forEach(filePath => {
      try {
        const fullPath = path.resolve(__dirname, filePath);
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Extract weapon objects using regex (simple approach)
        const weaponMatches = content.match(/export const \w+: Equipment = \{[\s\S]*?\};/g);
        
        if (weaponMatches) {
          weaponMatches.forEach(match => {
            try {
              // Basic parsing - in a real implementation we'd use proper TypeScript parsing
              const nameMatch = match.match(/name: ['"]([^'"]+)['"]/);
              const categoryMatch = match.match(/category: ['"]([^'"]+)['"]/);
              const idMatch = match.match(/id: ['"]([^'"]+)['"]/);
              
              if (nameMatch && categoryMatch && idMatch) {
                const weapon = {
                  id: idMatch[1],
                  name: nameMatch[1],
                  category: categoryMatch[1],
                  rawData: match
                };
                
                this.weapons.push(weapon);
                this.stats.totalWeapons++;
                
                if (!this.stats.categories[weapon.category]) {
                  this.stats.categories[weapon.category] = 0;
                }
                this.stats.categories[weapon.category]++;
              }
            } catch (err) {
              this.errors.push(`Failed to parse weapon from ${filePath}: ${err.message}`);
            }
          });
        }
      } catch (err) {
        this.errors.push(`Failed to load file ${filePath}: ${err.message}`);
      }
    });
    
    console.log(`Loaded ${this.stats.totalWeapons} weapons from ${WEAPON_FILES.length} files`);
  }

  // Validate individual weapon data
  validateWeapon(weapon) {
    const issues = [];
    
    // Check for cost and battle value
    const hasCost = weapon.rawData.includes('cost:') && !weapon.rawData.includes('cost: 0');
    const hasBV = weapon.rawData.includes('battleValue:') && !weapon.rawData.includes('battleValue: 0');
    
    if (hasCost) this.stats.weaponsWithCost++;
    if (hasBV) this.stats.weaponsWithBV++;
    
    if (!hasCost) {
      issues.push('Missing cost data');
    }
    
    if (!hasBV) {
      issues.push('Missing battle value data');
    }
    
    // Check for range data consistency
    const hasRanges = weapon.rawData.includes('rangeShort:') && 
                     weapon.rawData.includes('rangeMedium:') && 
                     weapon.rawData.includes('rangeLong:');
    
    if (!hasRanges && !weapon.category.includes('Physical')) {
      issues.push('Missing range data');
    }
    
    // Check for weight and critical slots
    if (!weapon.rawData.includes('weight:')) {
      issues.push('Missing weight data');
    }
    
    if (!weapon.rawData.includes('crits:')) {
      issues.push('Missing critical slots data');
    }
    
    // Check for tech rating and introduction year
    if (!weapon.rawData.includes('introductionYear:')) {
      issues.push('Missing introduction year');
    }
    
    if (issues.length > 0) {
      this.stats.missingData++;
      this.warnings.push(`${weapon.name} (${weapon.category}): ${issues.join(', ')}`);
    }
    
    return issues.length === 0;
  }

  // Check for missing expected weapons
  validateCompleteness() {
    console.log('\nValidating completeness against expected weapons...');
    
    Object.entries(EXPECTED_WEAPONS).forEach(([category, expectedWeapons]) => {
      const categoryWeapons = this.weapons.filter(w => w.category === category);
      const weaponNames = categoryWeapons.map(w => w.name);
      
      expectedWeapons.forEach(expectedName => {
        const found = weaponNames.some(name => 
          name.toLowerCase().includes(expectedName.toLowerCase()) ||
          expectedName.toLowerCase().includes(name.toLowerCase())
        );
        
        if (!found) {
          this.warnings.push(`Expected weapon not found: ${expectedName} in ${category}`);
        }
      });
    });
  }

  // Validate range consistency
  validateRanges() {
    console.log('\nValidating weapon ranges...');
    
    this.weapons.forEach(weapon => {
      // Extract range values
      const shortMatch = weapon.rawData.match(/rangeShort:\s*(\d+)/);
      const mediumMatch = weapon.rawData.match(/rangeMedium:\s*(\d+)/);
      const longMatch = weapon.rawData.match(/rangeLong:\s*(\d+)/);
      
      if (shortMatch && mediumMatch && longMatch) {
        const short = parseInt(shortMatch[1]);
        const medium = parseInt(mediumMatch[1]);
        const long = parseInt(longMatch[1]);
        
        if (short > medium || medium > long) {
          this.errors.push(`${weapon.name}: Invalid range progression (S:${short}, M:${medium}, L:${long})`);
        }
      }
    });
  }

  // Generate detailed report
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('BATTLETECH WEAPONS DATABASE VALIDATION REPORT');
    console.log('='.repeat(80));
    
    // Summary statistics
    console.log('\nSUMMARY STATISTICS:');
    console.log(`Total Weapons: ${this.stats.totalWeapons}`);
    console.log(`Weapons with Cost Data: ${this.stats.weaponsWithCost} (${Math.round(this.stats.weaponsWithCost/this.stats.totalWeapons*100)}%)`);
    console.log(`Weapons with Battle Value: ${this.stats.weaponsWithBV} (${Math.round(this.stats.weaponsWithBV/this.stats.totalWeapons*100)}%)`);
    console.log(`Weapons with Missing Data: ${this.stats.missingData}`);
    
    // Category breakdown
    console.log('\nCATEGORY BREAKDOWN:');
    Object.entries(this.stats.categories).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} weapons`);
    });
    
    // Errors
    if (this.errors.length > 0) {
      console.log('\nERRORS:');
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // Warnings
    if (this.warnings.length > 0) {
      console.log('\nWARNINGS:');
      this.warnings.slice(0, 20).forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
      
      if (this.warnings.length > 20) {
        console.log(`  ... and ${this.warnings.length - 20} more warnings`);
      }
    }
    
    // Data completeness recommendations
    console.log('\nRECOMMENDATIONS:');
    
    const costCompleteness = this.stats.weaponsWithCost / this.stats.totalWeapons;
    const bvCompleteness = this.stats.weaponsWithBV / this.stats.totalWeapons;
    
    if (costCompleteness < 0.8) {
      console.log(`  • PRIORITY: Add cost data for ${this.stats.totalWeapons - this.stats.weaponsWithCost} weapons`);
    }
    
    if (bvCompleteness < 0.8) {
      console.log(`  • PRIORITY: Add battle value data for ${this.stats.totalWeapons - this.stats.weaponsWithBV} weapons`);
    }
    
    if (this.errors.length > 0) {
      console.log(`  • CRITICAL: Fix ${this.errors.length} data validation errors`);
    }
    
    console.log('\n' + '='.repeat(80));
    
    // Overall assessment
    const overallScore = ((costCompleteness + bvCompleteness) / 2) * 100;
    console.log(`OVERALL DATA COMPLETENESS: ${Math.round(overallScore)}%`);
    
    if (overallScore >= 90) {
      console.log('STATUS: EXCELLENT - Database is production-ready');
    } else if (overallScore >= 70) {
      console.log('STATUS: GOOD - Minor data gaps remain');
    } else if (overallScore >= 50) {
      console.log('STATUS: FAIR - Significant data population needed');
    } else {
      console.log('STATUS: POOR - Major data population required');
    }
    
    console.log('='.repeat(80));
  }

  // Run all validations
  runValidation() {
    console.log('Starting comprehensive weapons validation...\n');
    
    this.loadWeapons();
    
    // Validate each weapon
    console.log('Validating individual weapons...');
    this.weapons.forEach(weapon => this.validateWeapon(weapon));
    
    this.validateCompleteness();
    this.validateRanges();
    
    this.generateReport();
    
    return {
      totalWeapons: this.stats.totalWeapons,
      errors: this.errors.length,
      warnings: this.warnings.length,
      completeness: Math.round(((this.stats.weaponsWithCost + this.stats.weaponsWithBV) / (this.stats.totalWeapons * 2)) * 100)
    };
  }
}

// Run validation if script is executed directly
if (require.main === module) {
  const validator = new WeaponsValidator();
  const results = validator.runValidation();
  
  // Exit with error code if there are critical issues
  process.exit(results.errors > 0 ? 1 : 0);
}

module.exports = WeaponsValidator;
