/**
 * Equipment Database - Data Integrity Tests
 * Tests focused on validating the core equipment data structures
 * Following Single Responsibility Principle - only tests data integrity
 */

import {
  ENERGY_WEAPONS,
  BALLISTIC_WEAPONS,
  MISSILE_WEAPONS,
  EQUIPMENT,
  AMMUNITION,
  FULL_EQUIPMENT_DATABASE,
  EquipmentItem
} from '../../../utils/equipmentDatabase';

describe('Equipment Database - Data Integrity', () => {
  describe('Energy Weapons Data Validation', () => {
    test('should have valid basic properties for all energy weapons', () => {
      ENERGY_WEAPONS.forEach(weapon => {
        expect(weapon.id).toBeDefined();
        expect(weapon.name).toBeDefined();
        expect(weapon.category).toBe('Energy');
        expect(typeof weapon.weight).toBe('number');
        expect(weapon.weight).toBeGreaterThan(0);
        expect(typeof weapon.crits).toBe('number');
        expect(weapon.crits).toBeGreaterThan(0);
        expect(weapon.techBase).toMatch(/^(IS|Clan|Both)$/);
        expect(weapon.techLevel).toMatch(/^(Introductory|Standard|Advanced|Experimental)$/);
        expect(typeof weapon.year).toBe('number');
        expect(weapon.year).toBeGreaterThan(1800);
      });
    });

    test('should have valid damage values for energy weapons', () => {
      ENERGY_WEAPONS.forEach(weapon => {
        expect(weapon.damage).toBeDefined();
        if (typeof weapon.damage === 'number') {
          expect(weapon.damage).toBeGreaterThan(0);
        } else {
          expect(typeof weapon.damage).toBe('string');
          expect(weapon.damage).toBeTruthy();
        }
      });
    });

    test('should have valid heat generation for energy weapons', () => {
      ENERGY_WEAPONS.forEach(weapon => {
        expect(weapon.heat).toBeDefined();
        expect(typeof weapon.heat).toBe('number');
        expect(weapon.heat).toBeGreaterThanOrEqual(0);
      });
    });

    test('should have valid range data for energy weapons', () => {
      ENERGY_WEAPONS.forEach(weapon => {
        expect(weapon.range).toBeDefined();
        expect(typeof weapon.range).toBe('string');
        expect(weapon.range).toMatch(/^\d+\/\d+\/\d+$/);
        
        if (weapon.minRange !== undefined) {
          expect(typeof weapon.minRange).toBe('number');
          expect(weapon.minRange).toBeGreaterThanOrEqual(0);
        }
      });
    });

    test('should validate specific energy weapon entries', () => {
      const smallLaser = ENERGY_WEAPONS.find(w => w.id === 'small-laser');
      expect(smallLaser).toEqual({
        id: 'small-laser',
        name: 'Small Laser',
        category: 'Energy',
        weight: 0.5,
        crits: 1,
        damage: 3,
        heat: 1,
        minRange: 0,
        range: '1/2/3',
        techBase: 'Both',
        techLevel: 'Introductory',
        year: 2300,
        bv: 9
      });

      const ppc = ENERGY_WEAPONS.find(w => w.id === 'ppc');
      expect(ppc?.minRange).toBe(3);
      expect(ppc?.damage).toBe(10);
      expect(ppc?.heat).toBe(10);
    });

    test('should have clan energy weapons with correct tech base', () => {
      const clanWeapons = ENERGY_WEAPONS.filter(w => w.name.includes('(Clan)'));
      clanWeapons.forEach(weapon => {
        expect(weapon.techBase).toBe('Clan');
        expect(weapon.id).toContain('clan');
      });
    });

    test('should have pulse lasers with special rules', () => {
      const pulseWeapons = ENERGY_WEAPONS.filter(w => w.name.includes('Pulse'));
      pulseWeapons.forEach(weapon => {
        expect(weapon.special).toBeDefined();
        expect(weapon.special).toContain('-2 to-hit');
        expect(weapon.techBase).toBe('IS');
      });
    });
  });

  describe('Ballistic Weapons Data Validation', () => {
    test('should have valid basic properties for all ballistic weapons', () => {
      BALLISTIC_WEAPONS.forEach(weapon => {
        expect(weapon.id).toBeDefined();
        expect(weapon.name).toBeDefined();
        expect(weapon.category).toBe('Ballistic');
        expect(typeof weapon.weight).toBe('number');
        expect(weapon.weight).toBeGreaterThan(0);
        expect(typeof weapon.crits).toBe('number');
        expect(weapon.crits).toBeGreaterThan(0);
        expect(weapon.techBase).toMatch(/^(IS|Clan|Both)$/);
        expect(weapon.techLevel).toMatch(/^(Introductory|Standard|Advanced|Experimental)$/);
      });
    });

    test('should validate autocannon progression', () => {
      const ac2 = BALLISTIC_WEAPONS.find(w => w.id === 'ac2');
      const ac5 = BALLISTIC_WEAPONS.find(w => w.id === 'ac5');
      const ac10 = BALLISTIC_WEAPONS.find(w => w.id === 'ac10');
      const ac20 = BALLISTIC_WEAPONS.find(w => w.id === 'ac20');

      // Damage progression
      expect(ac2?.damage).toBe(2);
      expect(ac5?.damage).toBe(5);
      expect(ac10?.damage).toBe(10);
      expect(ac20?.damage).toBe(20);

      // Weight progression (should increase)
      expect(ac2?.weight).toBeLessThan(ac5?.weight || 0);
      expect(ac5?.weight).toBeLessThan(ac10?.weight || 0);
      expect(ac10?.weight).toBeLessThan(ac20?.weight || 0);

      // Critical slot progression (should increase)
      expect(ac2?.crits).toBeLessThan(ac5?.crits || 0);
      expect(ac5?.crits).toBeLessThan(ac10?.crits || 0);
      expect(ac10?.crits).toBeLessThan(ac20?.crits || 0);
    });

    test('should have gauss rifle with explosion special rule', () => {
      const gaussRifle = BALLISTIC_WEAPONS.find(w => w.id === 'gauss-rifle');
      expect(gaussRifle).toBeDefined();
      expect(gaussRifle?.special).toContain('Explodes on critical hit');
      expect(gaussRifle?.damage).toBe(15);
      expect(gaussRifle?.heat).toBe(1);
    });

    test('should have ultra autocannons with double fire rate', () => {
      const ultraWeapons = BALLISTIC_WEAPONS.filter(w => w.name.includes('Ultra'));
      ultraWeapons.forEach(weapon => {
        expect(weapon.special).toContain('Double rate of fire');
        expect(weapon.techBase).toBe('IS');
        expect(weapon.techLevel).toBe('Standard');
      });
    });

    test('should have machine gun with anti-infantry bonus', () => {
      const machineGun = BALLISTIC_WEAPONS.find(w => w.id === 'machine-gun');
      expect(machineGun?.special).toContain('+2 damage vs infantry');
      expect(machineGun?.weight).toBe(0.5);
      expect(machineGun?.heat).toBe(0);
    });
  });

  describe('Missile Weapons Data Validation', () => {
    test('should have valid basic properties for all missile weapons', () => {
      MISSILE_WEAPONS.forEach(weapon => {
        expect(weapon.id).toBeDefined();
        expect(weapon.name).toBeDefined();
        expect(weapon.category).toBe('Missile');
        expect(typeof weapon.weight).toBe('number');
        expect(weapon.weight).toBeGreaterThan(0);
        expect(typeof weapon.crits).toBe('number');
        expect(weapon.crits).toBeGreaterThan(0);
      });
    });

    test('should validate SRM launcher progression', () => {
      const srm2 = MISSILE_WEAPONS.find(w => w.id === 'srm2');
      const srm4 = MISSILE_WEAPONS.find(w => w.id === 'srm4');
      const srm6 = MISSILE_WEAPONS.find(w => w.id === 'srm6');

      // All should have same damage per missile
      expect(srm2?.damage).toBe('2/missile');
      expect(srm4?.damage).toBe('2/missile');
      expect(srm6?.damage).toBe('2/missile');

      // Heat should increase with launcher size
      expect(srm2?.heat).toBeLessThan(srm4?.heat || 0);
      expect(srm4?.heat).toBeLessThan(srm6?.heat || 0);

      // Weight should increase with launcher size
      expect(srm2?.weight).toBeLessThan(srm4?.weight || 0);
      expect(srm4?.weight).toBeLessThan(srm6?.weight || 0);
    });

    test('should validate LRM launcher progression', () => {
      const lrm5 = MISSILE_WEAPONS.find(w => w.id === 'lrm5');
      const lrm10 = MISSILE_WEAPONS.find(w => w.id === 'lrm10');
      const lrm15 = MISSILE_WEAPONS.find(w => w.id === 'lrm15');
      const lrm20 = MISSILE_WEAPONS.find(w => w.id === 'lrm20');

      // All should have same damage per missile
      [lrm5, lrm10, lrm15, lrm20].forEach(lrm => {
        expect(lrm?.damage).toBe('1/missile');
        expect(lrm?.minRange).toBe(6);
        expect(lrm?.range).toBe('7/14/21');
      });

      // Progressive increases
      expect(lrm5?.weight).toBeLessThan(lrm10?.weight || 0);
      expect(lrm10?.weight).toBeLessThan(lrm15?.weight || 0);
      expect(lrm15?.weight).toBeLessThan(lrm20?.weight || 0);
    });

    test('should have streak SRM with special targeting', () => {
      const streakSrm = MISSILE_WEAPONS.find(w => w.id === 'streak-srm2');
      expect(streakSrm?.special).toContain('All missiles hit');
      expect(streakSrm?.techBase).toBe('IS');
      expect(streakSrm?.techLevel).toBe('Standard');
    });
  });

  describe('Equipment Data Validation', () => {
    test('should have valid basic properties for all equipment', () => {
      EQUIPMENT.forEach(item => {
        expect(item.id).toBeDefined();
        expect(item.name).toBeDefined();
        expect(item.category).toMatch(/^(Electronics|Physical|Equipment)$/);
        expect(typeof item.weight).toBe('number');
        expect(item.weight).toBeGreaterThanOrEqual(0);
        expect(typeof item.crits).toBe('number');
        expect(item.crits).toBeGreaterThanOrEqual(0);
      });
    });

    test('should validate electronic warfare equipment', () => {
      const beagle = EQUIPMENT.find(e => e.id === 'beagle-probe');
      const guardian = EQUIPMENT.find(e => e.id === 'guardian-ecm');
      const tag = EQUIPMENT.find(e => e.id === 'tag');

      expect(beagle?.category).toBe('Electronics');
      expect(guardian?.category).toBe('Electronics');
      expect(tag?.category).toBe('Electronics');

      expect(beagle?.special).toContain('Detects hidden units');
      expect(guardian?.special).toContain('Blocks enemy electronics');
      expect(tag?.special).toContain('Designates targets for artillery');
    });

    test('should validate heat sink types', () => {
      const standardHS = EQUIPMENT.find(e => e.id === 'heat-sink');
      const doubleHS = EQUIPMENT.find(e => e.id === 'double-heat-sink');
      const clanDoubleHS = EQUIPMENT.find(e => e.id === 'clan-double-heat-sink');

      expect(standardHS?.weight).toBe(1);
      expect(standardHS?.crits).toBe(1);
      expect(doubleHS?.crits).toBe(3);
      expect(clanDoubleHS?.crits).toBe(2);
      expect(clanDoubleHS?.techBase).toBe('Clan');
    });

    test('should validate CASE equipment', () => {
      const isCase = EQUIPMENT.find(e => e.id === 'case');
      const clanCase = EQUIPMENT.find(e => e.id === 'clan-case');

      expect(isCase?.weight).toBe(0.5);
      expect(isCase?.crits).toBe(1);
      expect(clanCase?.weight).toBe(0);
      expect(clanCase?.crits).toBe(0);
      expect(clanCase?.special).toContain('Built into all Clan locations');
    });
  });

  describe('Ammunition Data Validation', () => {
    test('should have valid basic properties for all ammunition', () => {
      AMMUNITION.forEach(ammo => {
        expect(ammo.id).toBeDefined();
        expect(ammo.name).toBeDefined();
        expect(ammo.category).toBe('Ammo');
        expect(ammo.weight).toBe(1); // All ammo weighs 1 ton
        expect(ammo.crits).toBe(1); // All ammo takes 1 crit
        expect(ammo.shots).toBeDefined();
        expect(ammo.ammoFor).toBeDefined();
      });
    });

    test('should validate autocannon ammo shot counts', () => {
      const ac2Ammo = AMMUNITION.find(a => a.id === 'ac2-ammo');
      const ac5Ammo = AMMUNITION.find(a => a.id === 'ac5-ammo');
      const ac10Ammo = AMMUNITION.find(a => a.id === 'ac10-ammo');
      const ac20Ammo = AMMUNITION.find(a => a.id === 'ac20-ammo');

      expect(ac2Ammo?.shots).toBe('45');
      expect(ac5Ammo?.shots).toBe('20');
      expect(ac10Ammo?.shots).toBe('10');
      expect(ac20Ammo?.shots).toBe('5');

      // Higher damage = fewer shots per ton
      expect(parseInt(ac2Ammo?.shots || '0')).toBeGreaterThan(parseInt(ac5Ammo?.shots || '0'));
      expect(parseInt(ac5Ammo?.shots || '0')).toBeGreaterThan(parseInt(ac10Ammo?.shots || '0'));
      expect(parseInt(ac10Ammo?.shots || '0')).toBeGreaterThan(parseInt(ac20Ammo?.shots || '0'));
    });

    test('should validate missile ammo types', () => {
      const srmAmmo = AMMUNITION.find(a => a.id === 'srm-ammo');
      const lrmAmmo = AMMUNITION.find(a => a.id === 'lrm-ammo');

      expect(srmAmmo?.ammoFor).toBe('SRM');
      expect(lrmAmmo?.ammoFor).toBe('LRM');
      expect(parseInt(srmAmmo?.shots || '0')).toBeLessThan(parseInt(lrmAmmo?.shots || '0'));
    });

    test('should validate special ammo types', () => {
      const gaussAmmo = AMMUNITION.find(a => a.id === 'gauss-ammo');
      const mgAmmo = AMMUNITION.find(a => a.id === 'mg-ammo');

      expect(gaussAmmo?.shots).toBe('8');
      expect(gaussAmmo?.ammoFor).toBe('Gauss Rifle');
      expect(mgAmmo?.shots).toBe('200');
      expect(mgAmmo?.ammoFor).toBe('Machine Gun');
    });
  });

  describe('Full Database Consistency', () => {
    test('should have unique IDs across all equipment', () => {
      const allIds = FULL_EQUIPMENT_DATABASE.map(item => item.id);
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });

    test('should have unique names across all equipment', () => {
      const allNames = FULL_EQUIPMENT_DATABASE.map(item => item.name);
      const uniqueNames = new Set(allNames);
      expect(uniqueNames.size).toBe(allNames.length);
    });

    test('should contain all sub-databases', () => {
      const totalExpected = ENERGY_WEAPONS.length + 
                          BALLISTIC_WEAPONS.length + 
                          MISSILE_WEAPONS.length + 
                          EQUIPMENT.length + 
                          AMMUNITION.length;
      
      expect(FULL_EQUIPMENT_DATABASE.length).toBe(totalExpected);
    });

    test('should have valid battle values where specified', () => {
      const itemsWithBV = FULL_EQUIPMENT_DATABASE.filter(item => item.bv !== undefined);
      itemsWithBV.forEach(item => {
        expect(typeof item.bv).toBe('number');
        expect(item.bv).toBeGreaterThanOrEqual(0);
      });
    });

    test('should have consistent year progression by tech level', () => {
      const introductoryItems = FULL_EQUIPMENT_DATABASE.filter(item => item.techLevel === 'Introductory');
      const standardItems = FULL_EQUIPMENT_DATABASE.filter(item => item.techLevel === 'Standard');
      
      const avgIntroYear = introductoryItems.reduce((sum, item) => sum + item.year, 0) / introductoryItems.length;
      const avgStandardYear = standardItems.reduce((sum, item) => sum + item.year, 0) / standardItems.length;
      
      expect(avgStandardYear).toBeGreaterThan(avgIntroYear);
    });

    test('should have clan equipment with appropriate years', () => {
      const clanItems = FULL_EQUIPMENT_DATABASE.filter(item => item.techBase === 'Clan');
      clanItems.forEach(item => {
        expect(item.year).toBeGreaterThanOrEqual(2800); // Clan exodus
      });
    });
  });
});
