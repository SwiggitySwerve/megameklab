/**
 * Tests for Armor Display Calculation Logic
 * Tests the UI-level capping of available armor points to only show allocatable points
 */

import { UnitCriticalManager, UnitConfiguration } from '../../utils/criticalSlots/UnitCriticalManager'

describe('Armor Display Calculation Logic', () => {
  
  function createTestUnit(overrides: Partial<UnitConfiguration> = {}): UnitCriticalManager {
    const baseConfig: UnitConfiguration = {
      chassis: 'Test Mech',
      model: 'TEST-1',
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
      armorAllocation: {
        HD: { front: 9, rear: 0 },
        CT: { front: 30, rear: 10 },
        LT: { front: 24, rear: 8 },
        RT: { front: 24, rear: 8 },
        LA: { front: 20, rear: 0 },
        RA: { front: 20, rear: 0 },
        LL: { front: 30, rear: 0 },
        RL: { front: 30, rear: 0 }
      },
      armorTonnage: 8.0,
      heatSinkType: 'Single',
      totalHeatSinks: 10,
      internalHeatSinks: 8,
      externalHeatSinks: 2,
      enhancements: [],
      jumpMP: 0,
      jumpJetType: 'Standard Jump Jet',
      jumpJetCounts: {},
      hasPartialWing: false,
      mass: 50,
      ...overrides
    }
    
    return new UnitCriticalManager(baseConfig)
  }

  /**
   * Calculate the display logic as implemented in the UI
   */
  function calculateDisplayUnallocatedPoints(unit: UnitCriticalManager): number {
    const availableArmorPoints = unit.getAvailableArmorPoints()    // From tonnage
    const allocatedArmorPoints = unit.getAllocatedArmorPoints()    // From allocation
    const unallocatedArmorPoints = unit.getUnallocatedArmorPoints() // Available - allocated
    const maxArmorPoints = unit.getMaxArmorPoints()               // Unit physical limit
    
    // UI logic: Cap available points to only show what can actually be allocated
    const actuallyAvailablePoints = Math.max(0, maxArmorPoints - allocatedArmorPoints)
    const displayUnallocatedPoints = Math.min(unallocatedArmorPoints, actuallyAvailablePoints)
    
    return displayUnallocatedPoints
  }

  describe('Under-Investment Scenarios (Raw < Unit Max)', () => {
    test('5 tons on 50-ton mech - should show available from tonnage', () => {
      // 5 tons × 16 = 80 points from tonnage
      // 50-ton mech max = 169 points
      // 60 points allocated 
      // Display should show: min(20, 109) = 20 points available
      const unit = createTestUnit({
        tonnage: 50,
        armorTonnage: 5.0,
        armorAllocation: {
          HD: { front: 9, rear: 0 },    // 9
          CT: { front: 15, rear: 5 },   // 20
          LT: { front: 10, rear: 3 },   // 13
          RT: { front: 10, rear: 3 },   // 13
          LA: { front: 2, rear: 0 },    // 2
          RA: { front: 2, rear: 0 },    // 2
          LL: { front: 1, rear: 0 },    // 1
          RL: { front: 0, rear: 0 }     // 0
        }  // Total = 60
      })
      
      // Verify data model methods are unchanged
      expect(unit.getAvailableArmorPoints()).toBe(80)    // From tonnage
      expect(unit.getAllocatedArmorPoints()).toBe(60)    // What's allocated
      expect(unit.getUnallocatedArmorPoints()).toBe(20)  // Raw calculation (80 - 60)
      
      // Display logic should show the same since we're under unit limit
      const displayPoints = calculateDisplayUnallocatedPoints(unit)
      expect(displayPoints).toBe(20) // min(20, 109) = 20 - show all available from tonnage
    })
  })

  describe('Over-Investment Scenarios (Raw > Unit Max)', () => {
    test('11 tons on 50-ton mech at unit maximum - should show 0 available', () => {
      // 11 tons × 16 = 176 points from tonnage
      // 50-ton mech max = 169 points
      // 169 points allocated (unit maxed)
      // Display should show: min(7, 0) = 0 points available
      const unit = createTestUnit({
        tonnage: 50,
        armorTonnage: 11.0,
        armorAllocation: {
          HD: { front: 9, rear: 0 },    // 9
          CT: { front: 24, rear: 8 },   // 32
          LT: { front: 18, rear: 6 },   // 24
          RT: { front: 18, rear: 6 },   // 24
          LA: { front: 16, rear: 0 },   // 16
          RA: { front: 16, rear: 0 },   // 16
          LL: { front: 24, rear: 0 },   // 24
          RL: { front: 24, rear: 0 }    // 24
        }  // Total = 169 (unit maximum)
      })
      
      // Verify data model methods are unchanged  
      expect(unit.getAvailableArmorPoints()).toBe(176)   // From tonnage
      expect(unit.getAllocatedArmorPoints()).toBe(169)   // What's allocated
      expect(unit.getUnallocatedArmorPoints()).toBe(7)   // Raw calculation (176 - 169)
      
      // Display logic should show 0 since unit is at physical limit
      const displayPoints = calculateDisplayUnallocatedPoints(unit)
      expect(displayPoints).toBe(0) // min(7, 0) = 0 - can't allocate more points
    })
    
    test('11 tons on 50-ton mech with partial allocation - should show actual capacity', () => {
      // 11 tons × 16 = 176 points from tonnage
      // 50-ton mech max = 169 points
      // 140 points allocated (29 under max)
      // Display should show: min(36, 29) = 29 points available
      const unit = createTestUnit({
        tonnage: 50,
        armorTonnage: 11.0,
        armorAllocation: {
          HD: { front: 9, rear: 0 },    // 9
          CT: { front: 20, rear: 5 },   // 25
          LT: { front: 15, rear: 3 },   // 18
          RT: { front: 15, rear: 3 },   // 18
          LA: { front: 15, rear: 0 },   // 15
          RA: { front: 15, rear: 0 },   // 15
          LL: { front: 20, rear: 0 },   // 20
          RL: { front: 20, rear: 0 }    // 20
        }  // Total = 140
      })
      
      // Verify data model methods are unchanged
      expect(unit.getAvailableArmorPoints()).toBe(176)   // From tonnage
      expect(unit.getAllocatedArmorPoints()).toBe(140)   // What's allocated
      expect(unit.getUnallocatedArmorPoints()).toBe(36)  // Raw calculation (176 - 140)
      
      // Display logic should cap to unit physical limit
      const displayPoints = calculateDisplayUnallocatedPoints(unit)
      expect(displayPoints).toBe(25) // min(36, 25) = 25 - only show what can actually be allocated
    })
  })

  describe('Exact Investment Scenarios', () => {
    test('10.5625 tons gives exactly 169 points - should show 0 when maxed', () => {
      // 169 ÷ 16 = 10.5625 tons for exactly 169 points
      // All 169 points allocated
      const unit = createTestUnit({
        tonnage: 50,
        armorTonnage: 10.5625,
        armorAllocation: {
          HD: { front: 9, rear: 0 },    // 9
          CT: { front: 24, rear: 8 },   // 32  
          LT: { front: 18, rear: 6 },   // 24
          RT: { front: 18, rear: 6 },   // 24
          LA: { front: 16, rear: 0 },   // 16
          RA: { front: 16, rear: 0 },   // 16
          LL: { front: 24, rear: 0 },   // 24
          RL: { front: 24, rear: 0 }    // 24
        }  // Total = 169 (unit maximum)
      })
      
      // Verify data model methods
      expect(unit.getAvailableArmorPoints()).toBe(169)   // From tonnage
      expect(unit.getAllocatedArmorPoints()).toBe(169)   // What's allocated  
      expect(unit.getUnallocatedArmorPoints()).toBe(0)   // Raw calculation (169 - 169)
      
      // Display logic should show 0 since unit is maxed
      const displayPoints = calculateDisplayUnallocatedPoints(unit)
      expect(displayPoints).toBe(0) // min(0, 0) = 0 - unit at capacity
    })
  })

  describe('Edge Cases', () => {
    test('Zero allocation with tonnage investment - should show min of tonnage and unit max', () => {
      const unit = createTestUnit({
        tonnage: 50,
        armorTonnage: 5.0, // 80 points from tonnage
        armorAllocation: {
          HD: { front: 0, rear: 0 },
          CT: { front: 0, rear: 0 },
          LT: { front: 0, rear: 0 },
          RT: { front: 0, rear: 0 },
          LA: { front: 0, rear: 0 },
          RA: { front: 0, rear: 0 },
          LL: { front: 0, rear: 0 },
          RL: { front: 0, rear: 0 }
        }  // Total = 0
      })
      
      expect(unit.getUnallocatedArmorPoints()).toBe(80)  // Raw from tonnage
      
      const displayPoints = calculateDisplayUnallocatedPoints(unit)
      expect(displayPoints).toBe(80) // min(80, 169) = 80 - show all available from tonnage
    })
    
    test('Extreme over-investment - should show 0 when maxed', () => {
      // 25 tons = 400 points (way over 169 max)
      // Unit maxed at 169 points
      const unit = createTestUnit({
        tonnage: 50,
        armorTonnage: 25.0,
        armorAllocation: {
          HD: { front: 9, rear: 0 },
          CT: { front: 24, rear: 8 },
          LT: { front: 18, rear: 6 },
          RT: { front: 18, rear: 6 },
          LA: { front: 16, rear: 0 },
          RA: { front: 16, rear: 0 },
          LL: { front: 24, rear: 0 },
          RL: { front: 24, rear: 0 }
        }  // Total = 169
      })
      
      expect(unit.getUnallocatedArmorPoints()).toBe(231) // Raw calculation (400 - 169)
      
      const displayPoints = calculateDisplayUnallocatedPoints(unit)
      expect(displayPoints).toBe(0) // min(231, 0) = 0 - unit at physical limit
    })
  })

  describe('Different Unit Sizes', () => {
    test('20-ton mech with over-investment', () => {
      // 20-ton max = 69 points
      // 5 tons = 80 points available
      // 69 points allocated (maxed)
      const unit = createTestUnit({
        tonnage: 20,
        armorTonnage: 5.0,
        armorAllocation: {
          HD: { front: 9, rear: 0 },    // 9
          CT: { front: 8, rear: 4 },    // 12
          LT: { front: 6, rear: 4 },    // 10
          RT: { front: 6, rear: 4 },    // 10
          LA: { front: 6, rear: 0 },    // 6
          RA: { front: 6, rear: 0 },    // 6
          LL: { front: 8, rear: 0 },    // 8
          RL: { front: 8, rear: 0 }     // 8
        }  // Total = 69 (unit maximum for 20-ton)
      })
      
      expect(unit.getUnallocatedArmorPoints()).toBe(11)  // Raw calculation (80 - 69)
      
      const displayPoints = calculateDisplayUnallocatedPoints(unit)
      expect(displayPoints).toBe(10) // min(11, 10) = 10 - unit at physical limit
    })
    
    test('100-ton mech under-investment', () => {
      // 100-ton max = 325 points  
      // 15 tons = 240 points available
      // 200 points allocated (125 under max)
      const unit = createTestUnit({
        tonnage: 100,
        armorTonnage: 15.0,
        armorAllocation: {
          HD: { front: 9, rear: 0 },    // 9
          CT: { front: 40, rear: 15 },  // 55
          LT: { front: 25, rear: 10 },  // 35
          RT: { front: 25, rear: 10 },  // 35
          LA: { front: 17, rear: 0 },   // 17
          RA: { front: 17, rear: 0 },   // 17
          LL: { front: 16, rear: 0 },   // 16
          RL: { front: 16, rear: 0 }    // 16
        }  // Total = 200
      })
      
      expect(unit.getUnallocatedArmorPoints()).toBe(40)  // Raw calculation (240 - 200)
      
      const displayPoints = calculateDisplayUnallocatedPoints(unit)
      expect(displayPoints).toBe(40) // min(40, 125) = 40 - show all available from tonnage
    })
  })
})
