/**
 * Equipment Database - Helper Functions Tests
 * Tests focused on validating database query and utility functions
 * Following Single Responsibility Principle - only tests helper functions
 */

import {
  getEquipmentById,
  getEquipmentByName,
  getEquipmentByCategory,
  getAmmoForWeapon,
  getJumpJetWeight,
  getHatchetSpecs,
  getSwordSpecs,
  FULL_EQUIPMENT_DATABASE
} from '../../../utils/equipmentDatabase';

describe('Equipment Database - Helper Functions', () => {
  describe('getEquipmentById', () => {
    test('should return equipment when valid ID is provided', () => {
      const smallLaser = getEquipmentById('small-laser');
      expect(smallLaser).toBeDefined();
      expect(smallLaser?.id).toBe('small-laser');
      expect(smallLaser?.name).toBe('Small Laser');
      expect(smallLaser?.category).toBe('Energy');
    });

    test('should return undefined for invalid ID', () => {
      const nonExistent = getEquipmentById('invalid-id');
      expect(nonExistent).toBeUndefined();
    });

    test('should return undefined for empty string', () => {
      const empty = getEquipmentById('');
      expect(empty).toBeUndefined();
    });

    test('should handle case-sensitive IDs correctly', () => {
      const upperCase = getEquipmentById('SMALL-LASER');
      const mixedCase = getEquipmentById('Small-Laser');
      expect(upperCase).toBeUndefined();
      expect(mixedCase).toBeUndefined();
    });

    test('should work with all equipment types', () => {
      // Energy weapon
      const laser = getEquipmentById('medium-laser');
      expect(laser?.category).toBe('Energy');

      // Ballistic weapon
      const ac5 = getEquipmentById('ac5');
      expect(ac5?.category).toBe('Ballistic');

      // Missile weapon
      const srm2 = getEquipmentById('srm2');
      expect(srm2?.category).toBe('Missile');

      // Equipment
      const beagle = getEquipmentById('beagle-probe');
      expect(beagle?.category).toBe('Electronics');

      // Ammunition
      const ammo = getEquipmentById('ac5-ammo');
      expect(ammo?.category).toBe('Ammo');
    });
  });

  describe('getEquipmentByName', () => {
    test('should return equipment when valid name is provided', () => {
      const ppc = getEquipmentByName('PPC');
      expect(ppc).toBeDefined();
      expect(ppc?.name).toBe('PPC');
      expect(ppc?.id).toBe('ppc');
    });

    test('should return undefined for invalid name', () => {
      const nonExistent = getEquipmentByName('Invalid Weapon Name');
      expect(nonExistent).toBeUndefined();
    });

    test('should handle exact name matching', () => {
      const exact = getEquipmentByName('Large Laser');
      const partial = getEquipmentByName('Large');
      const caseWrong = getEquipmentByName('large laser');
      
      expect(exact).toBeDefined();
      expect(partial).toBeUndefined();
      expect(caseWrong).toBeUndefined();
    });

    test('should distinguish between similar names', () => {
      const largeLaser = getEquipmentByName('Large Laser');
      const erLargeLaser = getEquipmentByName('ER Large Laser');
      const clanErLargeLaser = getEquipmentByName('ER Large Laser (Clan)');

      expect(largeLaser?.id).toBe('large-laser');
      expect(erLargeLaser?.id).toBe('er-large-laser');
      expect(clanErLargeLaser?.id).toBe('clan-er-large-laser');
    });

    test('should work with complex names', () => {
      const ultraAc = getEquipmentByName('Ultra AC/5');
      const streakSrm = getEquipmentByName('Streak SRM 2');
      
      expect(ultraAc?.id).toBe('uac5');
      expect(streakSrm?.id).toBe('streak-srm2');
    });
  });

  describe('getEquipmentByCategory', () => {
    test('should return all energy weapons', () => {
      const energyWeapons = getEquipmentByCategory('Energy');
      expect(energyWeapons.length).toBeGreaterThan(0);
      energyWeapons.forEach(weapon => {
        expect(weapon.category).toBe('Energy');
      });
    });

    test('should return all ballistic weapons', () => {
      const ballisticWeapons = getEquipmentByCategory('Ballistic');
      expect(ballisticWeapons.length).toBeGreaterThan(0);
      ballisticWeapons.forEach(weapon => {
        expect(weapon.category).toBe('Ballistic');
      });
    });

    test('should return all missile weapons', () => {
      const missileWeapons = getEquipmentByCategory('Missile');
      expect(missileWeapons.length).toBeGreaterThan(0);
      missileWeapons.forEach(weapon => {
        expect(weapon.category).toBe('Missile');
      });
    });

    test('should return all ammunition', () => {
      const ammunition = getEquipmentByCategory('Ammo');
      expect(ammunition.length).toBeGreaterThan(0);
      ammunition.forEach(ammo => {
        expect(ammo.category).toBe('Ammo');
        expect(ammo.ammoFor).toBeDefined();
      });
    });

    test('should return all electronics', () => {
      const electronics = getEquipmentByCategory('Electronics');
      expect(electronics.length).toBeGreaterThan(0);
      electronics.forEach(item => {
        expect(item.category).toBe('Electronics');
      });
    });

    test('should return empty array for invalid category', () => {
      const invalid = getEquipmentByCategory('InvalidCategory');
      expect(invalid).toEqual([]);
    });

    test('should handle case-sensitive category names', () => {
      const lowercase = getEquipmentByCategory('energy');
      const uppercase = getEquipmentByCategory('ENERGY');
      expect(lowercase).toEqual([]);
      expect(uppercase).toEqual([]);
    });

    test('should return equipment and physical categories', () => {
      const equipment = getEquipmentByCategory('Equipment');
      const physical = getEquipmentByCategory('Physical');
      
      expect(equipment.length).toBeGreaterThan(0);
      physical.forEach(item => {
        expect(item.category).toBe('Physical');
      });
    });
  });

  describe('getAmmoForWeapon', () => {
    test('should return SRM ammo for SRM weapons', () => {
      const srmAmmo = getAmmoForWeapon('SRM 2');
      expect(srmAmmo.length).toBeGreaterThan(0);
      srmAmmo.forEach(ammo => {
        expect(ammo.ammoFor).toBe('SRM');
      });
    });

    test('should return LRM ammo for LRM weapons', () => {
      const lrmAmmo = getAmmoForWeapon('LRM 10');
      expect(lrmAmmo.length).toBeGreaterThan(0);
      lrmAmmo.forEach(ammo => {
        expect(ammo.ammoFor).toBe('LRM');
      });
    });

    test('should handle specific weapon ammo matching', () => {
      const ac5Ammo = getAmmoForWeapon('AC/5');
      expect(ac5Ammo.length).toBe(1);
      expect(ac5Ammo[0].ammoFor).toBe('AC/5');
      expect(ac5Ammo[0].id).toBe('ac5-ammo');
    });

    test('should return gauss rifle ammo', () => {
      const gaussAmmo = getAmmoForWeapon('Gauss Rifle');
      expect(gaussAmmo.length).toBe(1);
      expect(gaussAmmo[0].ammoFor).toBe('Gauss Rifle');
      expect(gaussAmmo[0].shots).toBe('8');
    });

    test('should return machine gun ammo', () => {
      const mgAmmo = getAmmoForWeapon('Machine Gun');
      expect(mgAmmo.length).toBe(1);
      expect(mgAmmo[0].ammoFor).toBe('Machine Gun');
      expect(mgAmmo[0].shots).toBe('200');
    });

    test('should return empty array for weapons with no ammo', () => {
      const laserAmmo = getAmmoForWeapon('Large Laser');
      const ppcAmmo = getAmmoForWeapon('PPC');
      expect(laserAmmo).toEqual([]);
      expect(ppcAmmo).toEqual([]);
    });

    test('should handle weapon name variations', () => {
      const srmVariations = [
        'SRM 2', 'SRM 4', 'SRM 6',
        'SRM2', 'SRM4', 'SRM6',
        'Streak SRM 2'
      ];

      srmVariations.forEach(weaponName => {
        const ammo = getAmmoForWeapon(weaponName);
        if (weaponName.includes('SRM')) {
          expect(ammo.length).toBeGreaterThan(0);
        }
      });
    });

    test('should handle LRM weapon variations', () => {
      const lrmVariations = [
        'LRM 5', 'LRM 10', 'LRM 15', 'LRM 20'
      ];

      lrmVariations.forEach(weaponName => {
        const ammo = getAmmoForWeapon(weaponName);
        expect(ammo.length).toBeGreaterThan(0);
        expect(ammo[0].ammoFor).toBe('LRM');
      });
    });
  });

  describe('getJumpJetWeight', () => {
    test('should return 0.5 tons for light mechs (≤55 tons)', () => {
      expect(getJumpJetWeight(20)).toBe(0.5);
      expect(getJumpJetWeight(35)).toBe(0.5);
      expect(getJumpJetWeight(55)).toBe(0.5);
    });

    test('should return 1.0 ton for medium/heavy mechs (56-85 tons)', () => {
      expect(getJumpJetWeight(60)).toBe(1.0);
      expect(getJumpJetWeight(75)).toBe(1.0);
      expect(getJumpJetWeight(85)).toBe(1.0);
    });

    test('should return 2.0 tons for assault mechs (>85 tons)', () => {
      expect(getJumpJetWeight(90)).toBe(2.0);
      expect(getJumpJetWeight(100)).toBe(2.0);
    });

    test('should handle edge cases correctly', () => {
      expect(getJumpJetWeight(55)).toBe(0.5); // Exactly 55
      expect(getJumpJetWeight(56)).toBe(1.0); // Just over 55
      expect(getJumpJetWeight(85)).toBe(1.0); // Exactly 85
      expect(getJumpJetWeight(86)).toBe(2.0); // Just over 85
    });

    test('should handle invalid tonnages gracefully', () => {
      expect(getJumpJetWeight(0)).toBe(0.5);
      expect(getJumpJetWeight(-10)).toBe(0.5);
      expect(getJumpJetWeight(1000)).toBe(2.0);
    });
  });

  describe('getHatchetSpecs', () => {
    test('should calculate hatchet specs for light mechs', () => {
      const specs20 = getHatchetSpecs(20);
      expect(specs20.weight).toBe(2); // ceil(20/15) = 2
      expect(specs20.crits).toBe(2);
      expect(specs20.damage).toBe(8); // floor(20/5) * 2 = 8

      const specs35 = getHatchetSpecs(35);
      expect(specs35.weight).toBe(3); // ceil(35/15) = 3
      expect(specs35.crits).toBe(3);
      expect(specs35.damage).toBe(14); // floor(35/5) * 2 = 14
    });

    test('should calculate hatchet specs for medium mechs', () => {
      const specs55 = getHatchetSpecs(55);
      expect(specs55.weight).toBe(4); // ceil(55/15) = 4
      expect(specs55.crits).toBe(4);
      expect(specs55.damage).toBe(22); // floor(55/5) * 2 = 22
    });

    test('should calculate hatchet specs for heavy mechs', () => {
      const specs75 = getHatchetSpecs(75);
      expect(specs75.weight).toBe(5); // ceil(75/15) = 5
      expect(specs75.crits).toBe(5);
      expect(specs75.damage).toBe(30); // floor(75/5) * 2 = 30
    });

    test('should calculate hatchet specs for assault mechs', () => {
      const specs100 = getHatchetSpecs(100);
      expect(specs100.weight).toBe(7); // ceil(100/15) = 7
      expect(specs100.crits).toBe(7);
      expect(specs100.damage).toBe(40); // floor(100/5) * 2 = 40
    });

    test('should handle edge case tonnages', () => {
      const specs15 = getHatchetSpecs(15); // Exactly divisible by 15
      expect(specs15.weight).toBe(1);
      expect(specs15.crits).toBe(1);
      expect(specs15.damage).toBe(6);

      const specs16 = getHatchetSpecs(16); // Just over 15
      expect(specs16.weight).toBe(2);
      expect(specs16.crits).toBe(2);
      expect(specs16.damage).toBe(6);
    });

    test('should return consistent weight and crit values', () => {
      for (let tonnage = 20; tonnage <= 100; tonnage += 5) {
        const specs = getHatchetSpecs(tonnage);
        expect(specs.weight).toBe(specs.crits);
        expect(specs.weight).toBeGreaterThan(0);
        expect(specs.damage).toBeGreaterThan(0);
      }
    });
  });

  describe('getSwordSpecs', () => {
    test('should calculate sword specs for light mechs', () => {
      const specs20 = getSwordSpecs(20);
      expect(specs20.weight).toBe(1.5); // ceil(20/20) + 0.5 = 1.5
      expect(specs20.crits).toBe(2); // ceil(20/20) + 1 = 2
      expect(specs20.damage).toBe(3); // floor(20/10) + 1 = 3

      const specs35 = getSwordSpecs(35);
      expect(specs35.weight).toBe(2.5); // ceil(35/20) + 0.5 = 2.5
      expect(specs35.crits).toBe(3); // ceil(35/20) + 1 = 3
      expect(specs35.damage).toBe(4); // floor(35/10) + 1 = 4
    });

    test('should calculate sword specs for medium mechs', () => {
      const specs55 = getSwordSpecs(55);
      expect(specs55.weight).toBe(3.5); // ceil(55/20) + 0.5 = 3.5
      expect(specs55.crits).toBe(4); // ceil(55/20) + 1 = 4
      expect(specs55.damage).toBe(6); // floor(55/10) + 1 = 6
    });

    test('should calculate sword specs for heavy mechs', () => {
      const specs75 = getSwordSpecs(75);
      expect(specs75.weight).toBe(4.5); // ceil(75/20) + 0.5 = 4.5
      expect(specs75.crits).toBe(5); // ceil(75/20) + 1 = 5
      expect(specs75.damage).toBe(8); // floor(75/10) + 1 = 8
    });

    test('should calculate sword specs for assault mechs', () => {
      const specs100 = getSwordSpecs(100);
      expect(specs100.weight).toBe(5.5); // ceil(100/20) + 0.5 = 5.5
      expect(specs100.crits).toBe(6); // ceil(100/20) + 1 = 6
      expect(specs100.damage).toBe(11); // floor(100/10) + 1 = 11
    });

    test('should handle edge case tonnages', () => {
      const specs20 = getSwordSpecs(20); // Exactly divisible by 20
      expect(specs20.weight).toBe(1.5);
      expect(specs20.crits).toBe(2);
      expect(specs20.damage).toBe(3);

      const specs21 = getSwordSpecs(21); // Just over 20
      expect(specs21.weight).toBe(2.5);
      expect(specs21.crits).toBe(3);
      expect(specs21.damage).toBe(3);
    });

    test('should always have weight 0.5 tons less than crits', () => {
      for (let tonnage = 20; tonnage <= 100; tonnage += 5) {
        const specs = getSwordSpecs(tonnage);
        expect(specs.crits - specs.weight).toBe(0.5);
      }
    });

    test('should have higher damage than tonnage/10', () => {
      for (let tonnage = 20; tonnage <= 100; tonnage += 10) {
        const specs = getSwordSpecs(tonnage);
        expect(specs.damage).toBeGreaterThan(tonnage / 10);
      }
    });
  });

  describe('Function Integration', () => {
    test('should maintain consistency between search functions', () => {
      // Get a weapon by ID and verify name search returns same item
      const weaponById = getEquipmentById('medium-laser');
      const weaponByName = getEquipmentByName('Medium Laser');
      expect(weaponById).toEqual(weaponByName);
    });

    test('should maintain category consistency', () => {
      // Get all energy weapons and verify each can be found by ID
      const energyWeapons = getEquipmentByCategory('Energy');
      energyWeapons.forEach(weapon => {
        const foundWeapon = getEquipmentById(weapon.id);
        expect(foundWeapon).toEqual(weapon);
      });
    });

    test('should handle ammo weapon relationships correctly', () => {
      // Find weapons that should have ammo
      const ac5 = getEquipmentById('ac5');
      const ac5Ammo = getAmmoForWeapon('AC/5');
      expect(ac5).toBeDefined();
      expect(ac5Ammo.length).toBe(1);
      expect(ac5Ammo[0].ammoFor).toBe('AC/5');
    });

    test('should calculate physical weapon specs consistently', () => {
      // Compare hatchet and sword for same tonnage
      const tonnage = 50;
      const hatchetSpecs = getHatchetSpecs(tonnage);
      const swordSpecs = getSwordSpecs(tonnage);

      // Hatchet should generally be heavier but do more damage
      expect(hatchetSpecs.damage).toBeGreaterThan(swordSpecs.damage);
    });

    test('should maintain database referential integrity', () => {
      // Ensure all ammo references valid weapon types
      const ammunition = getEquipmentByCategory('Ammo');
      ammunition.forEach(ammo => {
        expect(ammo.ammoFor).toBeDefined();
        expect(typeof ammo.ammoFor).toBe('string');
        expect(ammo.ammoFor!.length).toBeGreaterThan(0);
      });
    });
  });
});
