/**
 * Tests for RulesDataProvider
 * Verifies component availability and compatibility checking
 */

import { RulesDataProvider, ConstructionContext, TechBase } from '../../../utils/rules';

describe('RulesDataProvider', () => {
  describe('getAvailableEngineTypes', () => {
    it('should return available engines for Inner Sphere', () => {
      const context: ConstructionContext = {
        techBase: 'Inner Sphere',
        era: '3025',
        techLevel: 'Standard',
        mechTonnage: 50
      };

      const engines = RulesDataProvider.getAvailableEngineTypes(context);

      expect(engines).toBeDefined();
      expect(engines.length).toBeGreaterThan(0);

      // Standard engine should be available
      const standard = engines.find(e => e.id === 'Standard');
      expect(standard).toBeDefined();
      expect(standard?.available).toBe(true);

      // Clan XL should not be available for Inner Sphere
      const clanXL = engines.find(e => e.id === 'XL (Clan)');
      expect(clanXL).toBeDefined();
      expect(clanXL?.available).toBe(false);
    });

    it('should return available engines for Clan', () => {
      const context: ConstructionContext = {
        techBase: 'Clan',
        era: '3050',
        techLevel: 'Tournament',
        mechTonnage: 50
      };

      const engines = RulesDataProvider.getAvailableEngineTypes(context);

      // Standard engine should be available (Both tech bases)
      const standard = engines.find(e => e.id === 'Standard');
      expect(standard?.available).toBe(true);

      // Clan XL should be available for Clan
      const clanXL = engines.find(e => e.id === 'XL (Clan)');
      expect(clanXL?.available).toBe(true);

      // IS XL should not be available for Clan
      const isXL = engines.find(e => e.id === 'XL (IS)');
      expect(isXL?.available).toBe(false);
    });

    it('should include component requirements', () => {
      const context: ConstructionContext = {
        techBase: 'Inner Sphere',
        era: '3050',
        techLevel: 'Tournament',
        mechTonnage: 50,
        engineRating: 200
      };

      const engines = RulesDataProvider.getAvailableEngineTypes(context);
      const standard = engines.find(e => e.id === 'Standard');

      expect(standard?.requirements).toBeDefined();
      expect(standard?.requirements.criticalSlots).toBe(6); // Standard engine: 6 slots in CT
      expect(standard?.requirements.weight).toBeGreaterThan(0);
      expect(standard?.requirements.techLevel).toBeDefined();
      expect(standard?.requirements.introductionYear).toBeGreaterThan(0);
    });
  });

  describe('getAvailableGyroTypes', () => {
    it('should return available gyros for Inner Sphere', () => {
      const context: ConstructionContext = {
        techBase: 'Inner Sphere',
        era: '3067',
        techLevel: 'Advanced',
        mechTonnage: 50
      };

      const gyros = RulesDataProvider.getAvailableGyroTypes(context);

      expect(gyros).toBeDefined();
      expect(gyros.length).toBeGreaterThan(0);

      // Standard gyro should be available
      const standard = gyros.find(g => g.id === 'Standard');
      expect(standard?.available).toBe(true);
      expect(standard?.requirements.criticalSlots).toBe(4);
    });

    it('should return correct slot requirements', () => {
      const context: ConstructionContext = {
        techBase: 'Inner Sphere',
        era: '3067',
        techLevel: 'Advanced',
        mechTonnage: 50
      };

      const gyros = RulesDataProvider.getAvailableGyroTypes(context);

      const standard = gyros.find(g => g.id === 'Standard');
      const xl = gyros.find(g => g.id === 'XL');
      const compact = gyros.find(g => g.id === 'Compact');

      expect(standard?.requirements.criticalSlots).toBe(4);
      expect(xl?.requirements.criticalSlots).toBe(6);
      expect(compact?.requirements.criticalSlots).toBe(2);
    });
  });

  describe('getAvailableHeatSinkTypes', () => {
    it('should return available heat sinks for Inner Sphere', () => {
      const context: ConstructionContext = {
        techBase: 'Inner Sphere',
        era: '3050',
        techLevel: 'Tournament',
        mechTonnage: 50
      };

      const heatSinks = RulesDataProvider.getAvailableHeatSinkTypes(context);

      expect(heatSinks).toBeDefined();

      // Single heat sinks should be available
      const single = heatSinks.find(h => h.id === 'Single');
      expect(single?.available).toBe(true);
      expect(single?.requirements.criticalSlots).toBe(1);

      // IS Double heat sinks should be available
      const isDouble = heatSinks.find(h => h.id === 'Double (IS)');
      expect(isDouble?.available).toBe(true);
      expect(isDouble?.requirements.criticalSlots).toBe(3);

      // Clan Double heat sinks should not be available
      const clanDouble = heatSinks.find(h => h.id === 'Double (Clan)');
      expect(clanDouble?.available).toBe(false);
    });
  });

  describe('getAvailableStructureTypes', () => {
    it('should return available structure types', () => {
      const context: ConstructionContext = {
        techBase: 'Inner Sphere',
        era: '3050',
        techLevel: 'Tournament',
        mechTonnage: 50
      };

      const structures = RulesDataProvider.getAvailableStructureTypes(context);

      expect(structures).toBeDefined();

      const standard = structures.find(s => s.id === 'Standard');
      expect(standard?.available).toBe(true);
      expect(standard?.requirements.criticalSlots).toBe(0);

      const endoSteel = structures.find(s => s.id === 'Endo Steel');
      expect(endoSteel?.available).toBe(true);
      expect(endoSteel?.requirements.criticalSlots).toBe(14);
    });
  });

  describe('getAvailableArmorTypes', () => {
    it('should return available armor types', () => {
      const context: ConstructionContext = {
        techBase: 'Inner Sphere',
        era: '3050',
        techLevel: 'Tournament',
        mechTonnage: 50
      };

      const armors = RulesDataProvider.getAvailableArmorTypes(context);

      expect(armors).toBeDefined();

      const standard = armors.find(a => a.id === 'Standard');
      expect(standard?.available).toBe(true);
      expect(standard?.requirements.criticalSlots).toBe(0);

      const ferroFibrous = armors.find(a => a.id === 'Ferro-Fibrous');
      expect(ferroFibrous?.available).toBe(true);
      expect(ferroFibrous?.requirements.criticalSlots).toBe(14);
    });
  });

  describe('validateComponentCompatibility', () => {
    it('should validate compatible engine', () => {
      const context: ConstructionContext = {
        techBase: 'Inner Sphere',
        era: '3050',
        techLevel: 'Tournament',
        mechTonnage: 50
      };

      const result = RulesDataProvider.validateComponentCompatibility(
        'engine',
        'Standard',
        context
      );

      expect(result.isCompatible).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('should detect incompatible engine', () => {
      const context: ConstructionContext = {
        techBase: 'Inner Sphere',
        era: '3050',
        techLevel: 'Tournament',
        mechTonnage: 50
      };

      const result = RulesDataProvider.validateComponentCompatibility(
        'engine',
        'XL (Clan)',
        context
      );

      expect(result.isCompatible).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]).toContain('Incompatible');
    });

    it('should include warnings for special rules', () => {
      const context: ConstructionContext = {
        techBase: 'Inner Sphere',
        era: '3050',
        techLevel: 'Tournament',
        mechTonnage: 50
      };

      const result = RulesDataProvider.validateComponentCompatibility(
        'engine',
        'XL (IS)',
        context
      );

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('side torso'))).toBe(true);
    });
  });

  describe('isComponentCompatibleWithTechBase', () => {
    it('should allow Both tech base components on any chassis', () => {
      expect(
        RulesDataProvider.isComponentCompatibleWithTechBase('Both', 'Inner Sphere')
      ).toBe(true);
      
      expect(
        RulesDataProvider.isComponentCompatibleWithTechBase('Both', 'Clan')
      ).toBe(true);
    });

    it('should allow Inner Sphere components on Inner Sphere chassis', () => {
      expect(
        RulesDataProvider.isComponentCompatibleWithTechBase('Inner Sphere', 'Inner Sphere')
      ).toBe(true);
    });

    it('should not allow Clan components on Inner Sphere chassis', () => {
      expect(
        RulesDataProvider.isComponentCompatibleWithTechBase('Clan', 'Inner Sphere')
      ).toBe(false);
    });

    it('should allow mixed tech on Mixed chassis', () => {
      expect(
        RulesDataProvider.isComponentCompatibleWithTechBase('Inner Sphere', 'Mixed (IS Chassis)')
      ).toBe(true);
      
      expect(
        RulesDataProvider.isComponentCompatibleWithTechBase('Clan', 'Mixed (IS Chassis)')
      ).toBe(true);
    });
  });
});
