/**
 * Equipment Database - Dynamic Calculations Tests
 * Tests focused on equipment calculations that vary by mech tonnage
 * Following Single Responsibility Principle - only tests dynamic calculations
 */

import {
  getJumpJetWeight,
  getHatchetSpecs,
  getSwordSpecs
} from '../../../utils/equipmentDatabase';

describe('Equipment Database - Dynamic Calculations', () => {
  describe('Jump Jet Weight Calculations', () => {
    describe('Light Mech Weight Class (≤55 tons)', () => {
      test('should return 0.5 tons for all light mechs', () => {
        const lightTonnages = [20, 25, 30, 35, 40, 45, 50, 55];
        lightTonnages.forEach(tonnage => {
          expect(getJumpJetWeight(tonnage)).toBe(0.5);
        });
      });

      test('should handle minimum tonnage edge cases', () => {
        expect(getJumpJetWeight(1)).toBe(0.5);
        expect(getJumpJetWeight(10)).toBe(0.5);
        expect(getJumpJetWeight(15)).toBe(0.5);
      });

      test('should handle exactly 55 tons as light mech', () => {
        expect(getJumpJetWeight(55)).toBe(0.5);
      });
    });

    describe('Medium/Heavy Mech Weight Class (56-85 tons)', () => {
      test('should return 1.0 ton for medium/heavy mechs', () => {
        const mediumHeavyTonnages = [56, 60, 65, 70, 75, 80, 85];
        mediumHeavyTonnages.forEach(tonnage => {
          expect(getJumpJetWeight(tonnage)).toBe(1.0);
        });
      });

      test('should handle boundary conditions', () => {
        expect(getJumpJetWeight(56)).toBe(1.0); // First medium
        expect(getJumpJetWeight(85)).toBe(1.0); // Last heavy
      });

      test('should cover standard mech tonnages', () => {
        // Common medium mech tonnages
        expect(getJumpJetWeight(55)).toBe(0.5); // Griffin
        expect(getJumpJetWeight(60)).toBe(1.0); // Wolverine
        expect(getJumpJetWeight(65)).toBe(1.0); // Catapult
        
        // Common heavy mech tonnages
        expect(getJumpJetWeight(70)).toBe(1.0); // Archer
        expect(getJumpJetWeight(75)).toBe(1.0); // Marauder
        expect(getJumpJetWeight(80)).toBe(1.0); // Zeus
      });
    });

    describe('Assault Mech Weight Class (>85 tons)', () => {
      test('should return 2.0 tons for assault mechs', () => {
        const assaultTonnages = [86, 90, 95, 100];
        assaultTonnages.forEach(tonnage => {
          expect(getJumpJetWeight(tonnage)).toBe(2.0);
        });
      });

      test('should handle boundary condition at 86 tons', () => {
        expect(getJumpJetWeight(85)).toBe(1.0); // Still heavy
        expect(getJumpJetWeight(86)).toBe(2.0); // First assault
      });

      test('should handle maximum and beyond maximum tonnages', () => {
        expect(getJumpJetWeight(100)).toBe(2.0); // Standard max
        expect(getJumpJetWeight(120)).toBe(2.0); // Super heavy
        expect(getJumpJetWeight(200)).toBe(2.0); // Theoretical max
      });

      test('should cover standard assault mech tonnages', () => {
        expect(getJumpJetWeight(85)).toBe(1.0); // Stalker (heavy)
        expect(getJumpJetWeight(90)).toBe(2.0); // Highlander
        expect(getJumpJetWeight(95)).toBe(2.0); // Banshee
        expect(getJumpJetWeight(100)).toBe(2.0); // Atlas
      });
    });

    describe('Edge Cases and Error Handling', () => {
      test('should handle invalid inputs gracefully', () => {
        expect(getJumpJetWeight(0)).toBe(0.5);
        expect(getJumpJetWeight(-5)).toBe(0.5);
        expect(getJumpJetWeight(-100)).toBe(0.5);
      });

      test('should handle decimal tonnages', () => {
        expect(getJumpJetWeight(55.5)).toBe(1.0);
        expect(getJumpJetWeight(85.1)).toBe(2.0);
        expect(getJumpJetWeight(54.9)).toBe(0.5);
      });

      test('should be consistent across weight boundaries', () => {
        // Test that function produces expected progression
        const weights = [];
        for (let tonnage = 50; tonnage <= 90; tonnage += 5) {
          weights.push({ tonnage, weight: getJumpJetWeight(tonnage) });
        }

        // Should have exactly 3 weight transitions
        const uniqueWeights = Array.from(new Set(weights.map(w => w.weight)));
        expect(uniqueWeights).toEqual([0.5, 1.0, 2.0]);
      });
    });
  });

  describe('Hatchet Specifications Calculations', () => {
    describe('Weight and Critical Slot Calculations', () => {
      test('should calculate weight as ceiling of tonnage/15', () => {
        expect(getHatchetSpecs(15).weight).toBe(1); // 15/15 = 1
        expect(getHatchetSpecs(16).weight).toBe(2); // ceil(16/15) = 2
        expect(getHatchetSpecs(30).weight).toBe(2); // 30/15 = 2
        expect(getHatchetSpecs(31).weight).toBe(3); // ceil(31/15) = 3
      });

      test('should have critical slots equal to weight', () => {
        for (let tonnage = 20; tonnage <= 100; tonnage += 5) {
          const specs = getHatchetSpecs(tonnage);
          expect(specs.weight).toBe(specs.crits);
        }
      });

      test('should validate specific tonnage calculations', () => {
        const testCases = [
          { tonnage: 20, expectedWeight: 2, expectedCrits: 2 },
          { tonnage: 35, expectedWeight: 3, expectedCrits: 3 },
          { tonnage: 50, expectedWeight: 4, expectedCrits: 4 },
          { tonnage: 65, expectedWeight: 5, expectedCrits: 5 },
          { tonnage: 80, expectedWeight: 6, expectedCrits: 6 },
          { tonnage: 95, expectedWeight: 7, expectedCrits: 7 }
        ];

        testCases.forEach(({ tonnage, expectedWeight, expectedCrits }) => {
          const specs = getHatchetSpecs(tonnage);
          expect(specs.weight).toBe(expectedWeight);
          expect(specs.crits).toBe(expectedCrits);
        });
      });
    });

    describe('Damage Calculations', () => {
      test('should calculate damage as floor(tonnage/5) * 2', () => {
        expect(getHatchetSpecs(20).damage).toBe(8); // floor(20/5) * 2 = 8
        expect(getHatchetSpecs(24).damage).toBe(8); // floor(24/5) * 2 = 8
        expect(getHatchetSpecs(25).damage).toBe(10); // floor(25/5) * 2 = 10
        expect(getHatchetSpecs(50).damage).toBe(20); // floor(50/5) * 2 = 20
      });

      test('should scale damage appropriately with tonnage', () => {
        const damages = [];
        for (let tonnage = 20; tonnage <= 100; tonnage += 20) {
          damages.push(getHatchetSpecs(tonnage).damage);
        }

        // Should increase as tonnage increases
        for (let i = 1; i < damages.length; i++) {
          expect(damages[i]).toBeGreaterThan(damages[i - 1]);
        }
      });

      test('should provide reasonable damage progression', () => {
        const testCases = [
          { tonnage: 20, expectedDamage: 8 },   // Light mech
          { tonnage: 35, expectedDamage: 14 },  // Medium mech
          { tonnage: 55, expectedDamage: 22 },  // Heavy mech
          { tonnage: 75, expectedDamage: 30 },  // Heavy mech
          { tonnage: 100, expectedDamage: 40 }  // Assault mech
        ];

        testCases.forEach(({ tonnage, expectedDamage }) => {
          expect(getHatchetSpecs(tonnage).damage).toBe(expectedDamage);
        });
      });
    });

    describe('Edge Cases and Validation', () => {
      test('should handle minimum tonnages', () => {
        const specs = getHatchetSpecs(5);
        expect(specs.weight).toBe(1);
        expect(specs.crits).toBe(1);
        expect(specs.damage).toBe(2);
      });

      test('should handle boundary tonnages', () => {
        // Test around 15-ton boundaries
        expect(getHatchetSpecs(14).weight).toBe(1);
        expect(getHatchetSpecs(15).weight).toBe(1);
        expect(getHatchetSpecs(16).weight).toBe(2);
      });

      test('should maintain consistent relationships', () => {
        for (let tonnage = 15; tonnage <= 100; tonnage += 15) {
          const specs = getHatchetSpecs(tonnage);
          
          // Weight should always equal crits
          expect(specs.weight).toBe(specs.crits);
          
          // Damage should be proportional to tonnage
          expect(specs.damage).toBeGreaterThan(0);
          expect(specs.damage % 2).toBe(0); // Always even
        }
      });
    });
  });

  describe('Sword Specifications Calculations', () => {
    describe('Weight and Critical Slot Calculations', () => {
      test('should calculate weight as ceiling of tonnage/20 + 0.5', () => {
        expect(getSwordSpecs(20).weight).toBe(1.5); // ceil(20/20) + 0.5 = 1.5
        expect(getSwordSpecs(21).weight).toBe(2.5); // ceil(21/20) + 0.5 = 2.5
        expect(getSwordSpecs(40).weight).toBe(2.5); // ceil(40/20) + 0.5 = 2.5
        expect(getSwordSpecs(41).weight).toBe(3.5); // ceil(41/20) + 0.5 = 3.5
      });

      test('should calculate crits as ceiling of tonnage/20 + 1', () => {
        expect(getSwordSpecs(20).crits).toBe(2); // ceil(20/20) + 1 = 2
        expect(getSwordSpecs(21).crits).toBe(3); // ceil(21/20) + 1 = 3
        expect(getSwordSpecs(40).crits).toBe(3); // ceil(40/20) + 1 = 3
        expect(getSwordSpecs(41).crits).toBe(4); // ceil(41/20) + 1 = 4
      });

      test('should have crits always 0.5 more than weight', () => {
        for (let tonnage = 20; tonnage <= 100; tonnage += 5) {
          const specs = getSwordSpecs(tonnage);
          expect(specs.crits - specs.weight).toBe(0.5);
        }
      });

      test('should validate specific tonnage calculations', () => {
        const testCases = [
          { tonnage: 20, expectedWeight: 1.5, expectedCrits: 2 },
          { tonnage: 35, expectedWeight: 2.5, expectedCrits: 3 },
          { tonnage: 50, expectedWeight: 3.5, expectedCrits: 4 },
          { tonnage: 65, expectedWeight: 4.5, expectedCrits: 5 },
          { tonnage: 80, expectedWeight: 4.5, expectedCrits: 5 },
          { tonnage: 100, expectedWeight: 5.5, expectedCrits: 6 }
        ];

        testCases.forEach(({ tonnage, expectedWeight, expectedCrits }) => {
          const specs = getSwordSpecs(tonnage);
          expect(specs.weight).toBe(expectedWeight);
          expect(specs.crits).toBe(expectedCrits);
        });
      });
    });

    describe('Damage Calculations', () => {
      test('should calculate damage as floor(tonnage/10) + 1', () => {
        expect(getSwordSpecs(20).damage).toBe(3); // floor(20/10) + 1 = 3
        expect(getSwordSpecs(29).damage).toBe(3); // floor(29/10) + 1 = 3
        expect(getSwordSpecs(30).damage).toBe(4); // floor(30/10) + 1 = 4
        expect(getSwordSpecs(50).damage).toBe(6); // floor(50/10) + 1 = 6
      });

      test('should always produce damage greater than tonnage/10', () => {
        for (let tonnage = 20; tonnage <= 100; tonnage += 10) {
          const specs = getSwordSpecs(tonnage);
          expect(specs.damage).toBeGreaterThan(tonnage / 10);
        }
      });

      test('should provide reasonable damage progression', () => {
        const testCases = [
          { tonnage: 20, expectedDamage: 3 },   // Light mech
          { tonnage: 35, expectedDamage: 4 },   // Medium mech
          { tonnage: 55, expectedDamage: 6 },   // Heavy mech
          { tonnage: 75, expectedDamage: 8 },   // Heavy mech
          { tonnage: 100, expectedDamage: 11 }  // Assault mech
        ];

        testCases.forEach(({ tonnage, expectedDamage }) => {
          expect(getSwordSpecs(tonnage).damage).toBe(expectedDamage);
        });
      });
    });

    describe('Edge Cases and Validation', () => {
      test('should handle minimum tonnages', () => {
        const specs = getSwordSpecs(10);
        expect(specs.weight).toBe(1.5);
        expect(specs.crits).toBe(2);
        expect(specs.damage).toBe(2);
      });

      test('should handle boundary tonnages around 20-ton increments', () => {
        // Test around 20-ton boundaries
        expect(getSwordSpecs(19).weight).toBe(1.5);
        expect(getSwordSpecs(20).weight).toBe(1.5);
        expect(getSwordSpecs(21).weight).toBe(2.5);
      });

      test('should maintain weight/crit relationship', () => {
        for (let tonnage = 20; tonnage <= 100; tonnage += 20) {
          const specs = getSwordSpecs(tonnage);
          expect(specs.crits - specs.weight).toBe(0.5);
        }
      });
    });
  });

  describe('Physical Weapon Comparisons', () => {
    describe('Hatchet vs Sword Trade-offs', () => {
      test('should show hatchet generally does more damage than sword', () => {
        const testTonnages = [20, 35, 50, 65, 80, 100];
        
        testTonnages.forEach(tonnage => {
          const hatchetSpecs = getHatchetSpecs(tonnage);
          const swordSpecs = getSwordSpecs(tonnage);
          
          // Hatchet should do more damage
          expect(hatchetSpecs.damage).toBeGreaterThan(swordSpecs.damage);
        });
      });

      test('should show hatchet is generally heavier than sword', () => {
        const testTonnages = [20, 35, 50, 65, 80, 100];
        
        testTonnages.forEach(tonnage => {
          const hatchetSpecs = getHatchetSpecs(tonnage);
          const swordSpecs = getSwordSpecs(tonnage);
          
          // Hatchet should be heavier (usually)
          expect(hatchetSpecs.weight).toBeGreaterThanOrEqual(swordSpecs.weight);
        });
      });

      test('should show damage efficiency differences', () => {
        const tonnage = 75; // Heavy mech example
        const hatchetSpecs = getHatchetSpecs(tonnage);
        const swordSpecs = getSwordSpecs(tonnage);
        
        const hatchetDamagePerTon = hatchetSpecs.damage / hatchetSpecs.weight;
        const swordDamagePerTon = swordSpecs.damage / swordSpecs.weight;
        
        // Both should be reasonable damage per ton
        expect(hatchetDamagePerTon).toBeGreaterThan(4);
        expect(swordDamagePerTon).toBeGreaterThan(1);
      });
    });

    describe('Scaling Across Weight Classes', () => {
      test('should scale appropriately across mech weight classes', () => {
        const weightClasses = [
          { name: 'Light', tonnage: 35 },
          { name: 'Medium', tonnage: 55 },
          { name: 'Heavy', tonnage: 75 },
          { name: 'Assault', tonnage: 100 }
        ];

        const hatchetProgression = weightClasses.map(({ tonnage }) => 
          getHatchetSpecs(tonnage)
        );

        const swordProgression = weightClasses.map(({ tonnage }) => 
          getSwordSpecs(tonnage)
        );

        // Verify damage increases with weight class
        for (let i = 1; i < hatchetProgression.length; i++) {
          expect(hatchetProgression[i].damage).toBeGreaterThan(hatchetProgression[i-1].damage);
          expect(swordProgression[i].damage).toBeGreaterThan(swordProgression[i-1].damage);
        }
      });

      test('should maintain reasonable proportions across tonnages', () => {
        for (let tonnage = 20; tonnage <= 100; tonnage += 20) {
          const hatchetSpecs = getHatchetSpecs(tonnage);
          const swordSpecs = getSwordSpecs(tonnage);
          
          // Damage should scale with tonnage
          expect(hatchetSpecs.damage / tonnage).toBeGreaterThan(0.1);
          expect(swordSpecs.damage / tonnage).toBeGreaterThan(0.05);
          
          // Weight should be reasonable fraction of tonnage
          expect(hatchetSpecs.weight / tonnage).toBeLessThanOrEqual(0.1);
          expect(swordSpecs.weight / tonnage).toBeLessThanOrEqual(0.1);
        }
      });
    });
  });

  describe('Integration and Consistency Tests', () => {
    describe('Cross-Function Consistency', () => {
      test('should produce consistent outputs across multiple calls', () => {
        const tonnage = 50;
        
        // Multiple calls should return identical results
        expect(getJumpJetWeight(tonnage)).toBe(getJumpJetWeight(tonnage));
        expect(getHatchetSpecs(tonnage)).toEqual(getHatchetSpecs(tonnage));
        expect(getSwordSpecs(tonnage)).toEqual(getSwordSpecs(tonnage));
      });

      test('should handle all common mech tonnages', () => {
        const commonTonnages = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
        
        commonTonnages.forEach(tonnage => {
          expect(() => getJumpJetWeight(tonnage)).not.toThrow();
          expect(() => getHatchetSpecs(tonnage)).not.toThrow();
          expect(() => getSwordSpecs(tonnage)).not.toThrow();
          
          // All should return reasonable values
          expect(getJumpJetWeight(tonnage)).toBeGreaterThan(0);
          
          const hatchet = getHatchetSpecs(tonnage);
          expect(hatchet.weight).toBeGreaterThan(0);
          expect(hatchet.crits).toBeGreaterThan(0);
          expect(hatchet.damage).toBeGreaterThan(0);
          
          const sword = getSwordSpecs(tonnage);
          expect(sword.weight).toBeGreaterThan(0);
          expect(sword.crits).toBeGreaterThan(0);
          expect(sword.damage).toBeGreaterThan(0);
        });
      });
    });

    describe('Mathematical Consistency', () => {
      test('should maintain mathematical relationships', () => {
        for (let tonnage = 20; tonnage <= 100; tonnage += 5) {
          const hatchet = getHatchetSpecs(tonnage);
          const sword = getSwordSpecs(tonnage);
          
          // Mathematical invariants
          expect(hatchet.weight).toBe(Math.ceil(tonnage / 15));
          expect(hatchet.crits).toBe(Math.ceil(tonnage / 15));
          expect(hatchet.damage).toBe(Math.floor(tonnage / 5) * 2);
          
          expect(sword.weight).toBe(Math.ceil(tonnage / 20) + 0.5);
          expect(sword.crits).toBe(Math.ceil(tonnage / 20) + 1);
          expect(sword.damage).toBe(Math.floor(tonnage / 10) + 1);
        }
      });
    });
  });
});
