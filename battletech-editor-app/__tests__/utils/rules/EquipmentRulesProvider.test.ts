/**
 * Tests for EquipmentRulesProvider
 * Verifies equipment filtering and compatibility checking
 */

import { EquipmentRulesProvider, EquipmentVariant, EquipmentFilterCriteria } from '../../../utils/rules';
import { ConstructionContext } from '../../../utils/rules/RulesDataProvider';

// Mock equipment data for testing
const mockEquipment: EquipmentVariant[] = [
  {
    id: 'large_laser_is',
    baseEquipmentId: 'large_laser',
    name: 'Large Laser',
    category: 'Weapons',
    techBase: 'IS',
    weight: 5.0,
    criticalSlots: 2,
    damage: 8,
    heat: 8,
    rangeShort: 5,
    rangeMedium: 10,
    rangeLong: 15,
    requiresAmmo: false,
    introductionYear: 2470,
    rulesLevel: 'Introductory'
  },
  {
    id: 'large_laser_clan',
    baseEquipmentId: 'large_laser',
    name: 'Large Laser',
    category: 'Weapons',
    techBase: 'Clan',
    weight: 4.0,
    criticalSlots: 1,
    damage: 8,
    heat: 8,
    rangeShort: 7,
    rangeMedium: 14,
    rangeLong: 21,
    requiresAmmo: false,
    introductionYear: 2824,
    rulesLevel: 'Introductory'
  },
  {
    id: 'ac5_is',
    baseEquipmentId: 'ac5',
    name: 'AC/5',
    category: 'Weapons',
    techBase: 'IS',
    weight: 8.0,
    criticalSlots: 4,
    damage: 5,
    heat: 1,
    rangeShort: 6,
    rangeMedium: 12,
    rangeLong: 18,
    requiresAmmo: true,
    introductionYear: 2250,
    rulesLevel: 'Introductory'
  },
  {
    id: 'gauss_rifle_is',
    baseEquipmentId: 'gauss_rifle',
    name: 'Gauss Rifle',
    category: 'Weapons',
    techBase: 'IS',
    weight: 15.0,
    criticalSlots: 7,
    damage: 15,
    heat: 1,
    rangeShort: 7,
    rangeMedium: 15,
    rangeLong: 22,
    requiresAmmo: true,
    introductionYear: 2590,
    extinctionYear: 2840,
    rulesLevel: 'Tournament'
  },
  {
    id: 'ecm_is',
    baseEquipmentId: 'ecm',
    name: 'ECM Suite',
    category: 'Electronics',
    techBase: 'IS',
    weight: 1.0,
    criticalSlots: 1,
    requiresAmmo: false,
    introductionYear: 2050,
    rulesLevel: 'Standard'
  }
];

describe('EquipmentRulesProvider', () => {
  describe('filterEquipment', () => {
    it('should filter by tech base', () => {
      const criteria: EquipmentFilterCriteria = {
        techBase: 'IS'
      };

      const filtered = EquipmentRulesProvider.filterEquipment(mockEquipment, criteria);

      expect(filtered.every(eq => eq.techBase === 'IS')).toBe(true);
      expect(filtered.length).toBe(4);
    });

    it('should filter by category', () => {
      const criteria: EquipmentFilterCriteria = {
        category: 'Weapons'
      };

      const filtered = EquipmentRulesProvider.filterEquipment(mockEquipment, criteria);

      expect(filtered.every(eq => eq.category === 'Weapons')).toBe(true);
      expect(filtered.length).toBe(4);
    });

    it('should filter by era', () => {
      const criteria: EquipmentFilterCriteria = {
        era: '3025' // Succession Wars era
      };

      const filtered = EquipmentRulesProvider.filterEquipment(mockEquipment, criteria);

      // Should exclude equipment introduced after 3025 or extinct before 3025
      expect(filtered.every(eq => eq.introductionYear <= 3025)).toBe(true);
      expect(filtered.every(eq => !eq.extinctionYear || eq.extinctionYear >= 3025)).toBe(true);
    });

    it('should filter by search term', () => {
      const criteria: EquipmentFilterCriteria = {
        searchTerm: 'laser'
      };

      const filtered = EquipmentRulesProvider.filterEquipment(mockEquipment, criteria);

      expect(filtered.every(eq => eq.name.toLowerCase().includes('laser'))).toBe(true);
      expect(filtered.length).toBe(2);
    });

    it('should filter by weight range', () => {
      const criteria: EquipmentFilterCriteria = {
        minTonnage: 4,
        maxTonnage: 8
      };

      const filtered = EquipmentRulesProvider.filterEquipment(mockEquipment, criteria);

      expect(filtered.every(eq => eq.weight >= 4 && eq.weight <= 8)).toBe(true);
    });

    it('should apply multiple filters', () => {
      const criteria: EquipmentFilterCriteria = {
        techBase: 'IS',
        category: 'Weapons',
        searchTerm: 'laser'
      };

      const filtered = EquipmentRulesProvider.filterEquipment(mockEquipment, criteria);

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('large_laser_is');
    });
  });

  describe('validateEquipmentCompatibility', () => {
    const context: ConstructionContext = {
      techBase: 'Inner Sphere',
      era: '3025',
      techLevel: 'Standard',
      mechTonnage: 50
    };

    it('should validate compatible equipment', () => {
      const equipment = mockEquipment.find(e => e.id === 'large_laser_is')!;
      const result = EquipmentRulesProvider.validateEquipmentCompatibility(equipment, context);

      expect(result.isCompatible).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('should detect tech base incompatibility', () => {
      const equipment = mockEquipment.find(e => e.id === 'large_laser_clan')!;
      const result = EquipmentRulesProvider.validateEquipmentCompatibility(equipment, context);

      expect(result.isCompatible).toBe(false);
      expect(result.issues.some(i => i.includes('Clan'))).toBe(true);
    });

    it('should detect era incompatibility', () => {
      const equipment = mockEquipment.find(e => e.id === 'large_laser_clan')!;
      const result = EquipmentRulesProvider.validateEquipmentCompatibility(equipment, context);

      expect(result.isCompatible).toBe(false);
      expect(result.issues.some(i => i.includes('2824') || i.includes('Clan'))).toBe(true);
    });

    it('should warn about heavy equipment', () => {
      const equipment = mockEquipment.find(e => e.id === 'gauss_rifle_is')!;
      const result = EquipmentRulesProvider.validateEquipmentCompatibility(equipment, context);

      // 15 tons > 20% of 50 tons (10 tons)
      expect(result.warnings.some(w => w.includes('heavy'))).toBe(true);
    });

    it('should check extinction dates', () => {
      const equipment = mockEquipment.find(e => e.id === 'gauss_rifle_is')!;
      const context3050: ConstructionContext = {
        ...context,
        era: '3050'
      };

      const result = EquipmentRulesProvider.validateEquipmentCompatibility(equipment, context3050);

      // Gauss Rifle became extinct in 2840
      expect(result.warnings.some(w => w.includes('extinct'))).toBe(true);
    });
  });

  describe('getEquipmentUpgradePaths', () => {
    it('should find upgrade from IS to Clan', () => {
      const isLaser = mockEquipment.find(e => e.id === 'large_laser_is')!;
      const upgradePath = EquipmentRulesProvider.getEquipmentUpgradePaths(
        isLaser,
        mockEquipment,
        'Clan'
      );

      expect(upgradePath.upgradeOptions.length).toBe(1);
      expect(upgradePath.upgradeOptions[0].id).toBe('large_laser_clan');
    });

    it('should calculate weight difference', () => {
      const isLaser = mockEquipment.find(e => e.id === 'large_laser_is')!;
      const upgradePath = EquipmentRulesProvider.getEquipmentUpgradePaths(
        isLaser,
        mockEquipment,
        'Clan'
      );

      expect(upgradePath.weightDifference).toBe(-1.0); // 4.0 - 5.0 = -1.0
    });

    it('should list performance improvements', () => {
      const isLaser = mockEquipment.find(e => e.id === 'large_laser_is')!;
      const upgradePath = EquipmentRulesProvider.getEquipmentUpgradePaths(
        isLaser,
        mockEquipment,
        'Clan'
      );

      expect(upgradePath.performanceImprovement.length).toBeGreaterThan(0);
      expect(upgradePath.performanceImprovement.some(i => i.includes('Slots'))).toBe(true);
      expect(upgradePath.performanceImprovement.some(i => i.includes('Weight'))).toBe(true);
    });
  });

  describe('calculateMixedTechPenalties', () => {
    it('should return no penalty for pure tech base', () => {
      const context: ConstructionContext = {
        techBase: 'Inner Sphere',
        era: '3050',
        techLevel: 'Tournament',
        mechTonnage: 50
      };

      const equipment = mockEquipment.filter(e => e.techBase === 'IS');
      const penalties = EquipmentRulesProvider.calculateMixedTechPenalties(equipment, context);

      expect(penalties.battleValueMultiplier).toBe(1.0);
      expect(penalties.costMultiplier).toBe(1.0);
      expect(penalties.restrictions.length).toBe(0);
    });

    it('should calculate penalty for mixed tech', () => {
      const context: ConstructionContext = {
        techBase: 'Mixed (IS Chassis)',
        era: '3050',
        techLevel: 'Tournament',
        mechTonnage: 50
      };

      const equipment = [
        mockEquipment.find(e => e.id === 'large_laser_is')!,
        mockEquipment.find(e => e.id === 'large_laser_clan')!
      ];

      const penalties = EquipmentRulesProvider.calculateMixedTechPenalties(equipment, context);

      expect(penalties.battleValueMultiplier).toBeGreaterThan(1.0);
      expect(penalties.costMultiplier).toBeGreaterThan(1.0);
      expect(penalties.restrictions.length).toBeGreaterThan(0);
    });

    it('should increase penalties with more mixed tech', () => {
      const context: ConstructionContext = {
        techBase: 'Mixed (IS Chassis)',
        era: '3050',
        techLevel: 'Tournament',
        mechTonnage: 50
      };

      const lowMixEquipment = [
        mockEquipment.find(e => e.id === 'large_laser_is')!,
        mockEquipment.find(e => e.id === 'ac5_is')!,
        mockEquipment.find(e => e.id === 'large_laser_clan')! // 33% mixed
      ];

      const highMixEquipment = [
        mockEquipment.find(e => e.id === 'large_laser_is')!,
        mockEquipment.find(e => e.id === 'large_laser_clan')! // 50% mixed
      ];

      const lowPenalties = EquipmentRulesProvider.calculateMixedTechPenalties(lowMixEquipment, context);
      const highPenalties = EquipmentRulesProvider.calculateMixedTechPenalties(highMixEquipment, context);

      expect(highPenalties.battleValueMultiplier).toBeGreaterThan(lowPenalties.battleValueMultiplier);
      expect(highPenalties.costMultiplier).toBeGreaterThan(lowPenalties.costMultiplier);
    });
  });

  describe('getEquipmentCategories', () => {
    it('should extract unique categories', () => {
      const categories = EquipmentRulesProvider.getEquipmentCategories(mockEquipment);

      expect(categories).toContain('Weapons');
      expect(categories).toContain('Electronics');
      expect(categories.length).toBe(2);
    });

    it('should sort categories alphabetically', () => {
      const categories = EquipmentRulesProvider.getEquipmentCategories(mockEquipment);

      const sorted = [...categories].sort();
      expect(categories).toEqual(sorted);
    });
  });

  describe('getEquipmentByCategory', () => {
    it('should filter equipment by category', () => {
      const weapons = EquipmentRulesProvider.getEquipmentByCategory(mockEquipment, 'Weapons');

      expect(weapons.every(eq => eq.category === 'Weapons')).toBe(true);
      expect(weapons.length).toBe(4);
    });
  });

  describe('getEquipmentStatistics', () => {
    it('should calculate statistics', () => {
      const stats = EquipmentRulesProvider.getEquipmentStatistics(mockEquipment);

      expect(stats.totalCount).toBe(5);
      expect(stats.averageWeight).toBeGreaterThan(0);
      expect(stats.averageSlots).toBeGreaterThan(0);
      expect(stats.categoryCounts['Weapons']).toBe(4);
      expect(stats.categoryCounts['Electronics']).toBe(1);
      expect(stats.techBaseDistribution['IS']).toBe(4);
      expect(stats.techBaseDistribution['Clan']).toBe(1);
    });
  });
});
