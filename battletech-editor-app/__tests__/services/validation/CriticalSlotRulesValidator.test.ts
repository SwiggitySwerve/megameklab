/**
 * Tests for CriticalSlotRulesValidator
 * 
 * Validates critical slot allocation, component placement, and location-specific restrictions.
 */

import { CriticalSlotRulesValidator } from '../../../services/validation/CriticalSlotRulesValidator'
import { UnitConfiguration } from '../../../utils/criticalSlots/UnitCriticalManager'

// Helper function to create test unit configuration
function createTestConfig(overrides: Partial<UnitConfiguration> = {}): UnitConfiguration {
  return {
    tonnage: 50,
    engineRating: 200,
    engineType: 'Standard',
    structureType: { type: 'Standard', techBase: 'Inner Sphere' },
    armorType: { type: 'Standard', techBase: 'Inner Sphere' },
    gyroType: { type: 'Standard', techBase: 'Inner Sphere' },
    heatSinkType: { type: 'Single', techBase: 'Inner Sphere' },
    armorAllocation: {
      head: 9,
      centerTorso: 16,
      leftTorso: 12,
      rightTorso: 12,
      leftArm: 8,
      rightArm: 8,
      leftLeg: 10,
      rightLeg: 10
    },
    techBase: 'Inner Sphere',
    ...overrides
  } as UnitConfiguration
}

// Helper function to create test equipment
function createTestEquipment(items: Array<{ 
  criticals?: number, 
  type?: string, 
  name?: string, 
  location?: string,
  tonnage?: number 
}> = []): any[] {
  return items.map((item, index) => ({
    id: `item-${index}`,
    location: item.location || 'rightArm',
    equipmentData: {
      criticals: item.criticals || 1,
      type: item.type || 'weapon',
      name: item.name || `Test Item ${index}`,
      tonnage: item.tonnage || 1
    }
  }))
}

describe('CriticalSlotRulesValidator', () => {
  describe('validateCriticalSlots', () => {
    it('should validate unit with proper slot allocation', () => {
      const config = createTestConfig()
      const equipment = createTestEquipment([
        { type: 'weapon', name: 'Medium Laser', criticals: 1, location: 'rightArm' },
        { type: 'weapon', name: 'Small Laser', criticals: 1, location: 'leftArm' }
      ])

      const result = CriticalSlotRulesValidator.validateCriticalSlots(config, equipment)

      expect(result.isValid).toBe(true)
      expect(result.totalSlotsUsed).toBeGreaterThan(0)
      expect(result.totalSlotsAvailable).toBe(78) // Standard mech total
      expect(result.violations).toHaveLength(0)
    })

    it('should detect slot overflow in locations', () => {
      const config = createTestConfig()
      const equipment = createTestEquipment([
        { type: 'weapon', name: 'AC/20', criticals: 10, location: 'rightArm' },
        { type: 'weapon', name: 'Large Laser', criticals: 2, location: 'rightArm' },
        { type: 'weapon', name: 'Medium Laser', criticals: 1, location: 'rightArm' }
      ])

      const result = CriticalSlotRulesValidator.validateCriticalSlots(config, equipment)

      expect(result.isValid).toBe(false)
      expect(result.locationUtilization.rightArm.overflow).toBe(true)
      expect(result.violations.some(v => v.type === 'overflow')).toBe(true)
      expect(result.violations.some(v => v.severity === 'critical')).toBe(true)
    })

    it('should validate special component requirements', () => {
      const config = createTestConfig({
        structureType: { type: 'Endo Steel', techBase: 'Inner Sphere' },
        armorType: { type: 'Ferro-Fibrous', techBase: 'Inner Sphere' }
      })
      const equipment = createTestEquipment([])

      const result = CriticalSlotRulesValidator.validateCriticalSlots(config, equipment)

      expect(result.specialComponentSlots.endoSteel.required).toBe(14)
      expect(result.specialComponentSlots.ferroFibrous.required).toBe(14)
      expect(result.specialComponentSlots.endoSteel.isCompliant).toBe(true)
      expect(result.specialComponentSlots.ferroFibrous.isCompliant).toBe(true)
    })

    it('should handle double heat sink slot requirements', () => {
      const config = createTestConfig({
        heatSinkType: { type: 'Double', techBase: 'Inner Sphere' }
      })
      const equipment = createTestEquipment([
        { type: 'heat_sink', name: 'Double Heat Sink', criticals: 3, location: 'leftTorso' },
        { type: 'heat_sink', name: 'Double Heat Sink', criticals: 3, location: 'rightTorso' }
      ])

      const result = CriticalSlotRulesValidator.validateCriticalSlots(config, equipment)

      expect(result.specialComponentSlots.doubleHeatSinks.externalSlots).toBe(6) // 2 × 3 slots
      expect(result.specialComponentSlots.doubleHeatSinks.isCompliant).toBe(true)
    })

    it('should validate ammunition placement restrictions', () => {
      const config = createTestConfig()
      const equipment = createTestEquipment([
        { type: 'ammunition', name: 'AC/10 Ammo', location: 'head' }
      ])

      const result = CriticalSlotRulesValidator.validateCriticalSlots(config, equipment)

      expect(result.isValid).toBe(false)
      expect(result.violations.some(v => v.type === 'invalid_placement')).toBe(true)
      expect(result.violations.some(v => v.message.includes('ammunition cannot be placed in head'))).toBe(true)
    })

    it('should recommend CASE protection for torso ammunition', () => {
      const config = createTestConfig()
      const equipment = createTestEquipment([
        { type: 'ammunition', name: 'AC/10 Ammo', location: 'leftTorso' },
        { type: 'ammunition', name: 'LRM Ammo', location: 'rightTorso' }
      ])

      const result = CriticalSlotRulesValidator.validateCriticalSlots(config, equipment)

      expect(result.recommendations.some(r => r.includes('CASE protection'))).toBe(true)
    })
  })

  describe('calculateLocationUtilization', () => {
    it('should calculate correct slot utilization', () => {
      const config = createTestConfig({ engineRating: 200 })
      const equipment = createTestEquipment([
        { type: 'weapon', name: 'PPC', criticals: 3, location: 'rightArm' },
        { type: 'weapon', name: 'Medium Laser', criticals: 1, location: 'rightArm' }
      ])

      const utilization = CriticalSlotRulesValidator.calculateLocationUtilization(config, equipment)

      expect(utilization.rightArm.used).toBe(4) // 3 + 1
      expect(utilization.rightArm.available).toBe(12)
      expect(utilization.rightArm.utilization).toBeCloseTo(33.33, 1)
      expect(utilization.rightArm.overflow).toBe(false)
    })

    it('should include system components in center torso', () => {
      const config = createTestConfig({ 
        engineRating: 200,
        gyroType: { type: 'Standard', techBase: 'Inner Sphere' }
      })
      const equipment = createTestEquipment([])

      const utilization = CriticalSlotRulesValidator.calculateLocationUtilization(config, equipment)

      expect(utilization.centerTorso.used).toBeGreaterThan(0) // Engine + Gyro
      expect(utilization.centerTorso.components.some(c => c.type === 'engine')).toBe(true)
      expect(utilization.centerTorso.components.some(c => c.type === 'gyro')).toBe(true)
      expect(utilization.head.components.some(c => c.type === 'cockpit')).toBe(true)
    })

    it('should handle XL engine slot requirements', () => {
      const config = createTestConfig({ 
        engineRating: 300,
        engineType: 'XL'
      })

      const utilization = CriticalSlotRulesValidator.calculateLocationUtilization(config, [])

      const engineComponent = utilization.centerTorso.components.find(c => c.type === 'engine')
      expect(engineComponent?.slots).toBe(12) // XL engines take more slots
    })

    it('should handle different gyro types', () => {
      const config = createTestConfig({ 
        engineRating: 200,
        gyroType: { type: 'Compact', techBase: 'Inner Sphere' }
      })

      const utilization = CriticalSlotRulesValidator.calculateLocationUtilization(config, [])

      const gyroComponent = utilization.centerTorso.components.find(c => c.type === 'gyro')
      expect(gyroComponent?.slots).toBe(2) // Compact gyro takes 2 slots
    })
  })

  describe('component placement validation', () => {
    it('should validate Artemis weapon pairing', () => {
      const config = createTestConfig()
      const equipment = [
        {
          id: 'artemis-1',
          location: 'rightArm',
          equipmentData: {
            type: 'equipment',
            name: 'Artemis IV FCS',
            criticals: 1
          }
        }
      ]

      const result = CriticalSlotRulesValidator.validateCriticalSlots(config, equipment, {
        validatePlacement: true
      })

      expect(result.placementViolations.some(v => v.type === 'requires_pairing')).toBe(true)
      expect(result.placementViolations.some(v => v.message.includes('compatible missile weapons'))).toBe(true)
    })

    it('should validate proper Artemis pairing', () => {
      const config = createTestConfig()
      const equipment = [
        {
          id: 'artemis-1',
          location: 'rightArm',
          equipmentData: {
            type: 'equipment',
            name: 'Artemis IV FCS',
            criticals: 1
          }
        },
        {
          id: 'lrm-1',
          location: 'rightArm',
          equipmentData: {
            type: 'weapon',
            name: 'LRM 10',
            criticals: 2
          }
        }
      ]

      const result = CriticalSlotRulesValidator.validateCriticalSlots(config, equipment, {
        validatePlacement: true
      })

      expect(result.placementViolations.filter(v => v.type === 'requires_pairing')).toHaveLength(0)
    })

    it('should provide ECM placement recommendations', () => {
      const config = createTestConfig()
      const equipment = [
        {
          id: 'ecm-1',
          location: 'leftArm',
          equipmentData: {
            type: 'equipment',
            name: 'Guardian ECM Suite',
            criticals: 2
          }
        }
      ]

      const result = CriticalSlotRulesValidator.validateCriticalSlots(config, equipment, {
        validatePlacement: true
      })

      expect(result.placementViolations.some(v => v.type === 'special_placement')).toBe(true)
      expect(result.placementViolations.some(v => v.message.includes('head or center torso'))).toBe(true)
    })

    it('should validate CASE location restrictions', () => {
      const config = createTestConfig()
      const equipment = [
        {
          id: 'case-1',
          location: 'rightArm',
          equipmentData: {
            type: 'case',
            name: 'CASE',
            criticals: 1
          }
        }
      ]

      const result = CriticalSlotRulesValidator.validateCriticalSlots(config, equipment, {
        validatePlacement: true
      })

      expect(result.placementViolations.some(v => v.type === 'invalid_location')).toBe(true)
      expect(result.placementViolations.some(v => v.message.includes('torso locations'))).toBe(true)
    })
  })

  describe('special component validation', () => {
    it('should handle targeting computer requirements', () => {
      const config = createTestConfig({ tonnage: 50 })
      const equipment = [
        {
          id: 'tc-1',
          location: 'head',
          equipmentData: {
            type: 'equipment',
            name: 'Targeting Computer',
            criticals: 3 // Less than required 5 slots for 50-ton mech
          }
        }
      ]

      const result = CriticalSlotRulesValidator.validateCriticalSlots(config, equipment)

      expect(result.specialComponentSlots.targetingComputer.required).toBe(5) // Math.ceil(50/10)
      expect(result.specialComponentSlots.targetingComputer.allocated).toBe(3)
      expect(result.specialComponentSlots.targetingComputer.isCompliant).toBe(false)
      expect(result.violations.some(v => v.component === 'Targeting Computer')).toBe(true)
    })

    it('should validate Artemis system requirements', () => {
      const config = createTestConfig()
      const equipment = [
        {
          id: 'artemis-1',
          location: 'rightArm',
          equipmentData: {
            type: 'equipment',
            name: 'Artemis IV FCS',
            criticals: 1
          }
        },
        {
          id: 'artemis-2',
          location: 'leftArm',
          equipmentData: {
            type: 'equipment',
            name: 'Artemis IV FCS',
            criticals: 1
          }
        }
      ]

      const result = CriticalSlotRulesValidator.validateCriticalSlots(config, equipment)

      expect(result.specialComponentSlots.artemis.required).toBe(2) // 2 × 1 slot each
      expect(result.specialComponentSlots.artemis.allocated).toBe(2)
      expect(result.specialComponentSlots.artemis.weaponPairings).toHaveLength(2)
      expect(result.specialComponentSlots.artemis.isCompliant).toBe(true)
    })
  })

  describe('generateSlotOptimizations', () => {
    it('should suggest component relocation for overflow', () => {
      const config = createTestConfig()
      const equipment = createTestEquipment([
        { type: 'weapon', name: 'AC/20', criticals: 10, location: 'rightArm' },
        { type: 'weapon', name: 'Large Laser', criticals: 2, location: 'rightArm' },
        { type: 'weapon', name: 'Medium Laser', criticals: 1, location: 'rightArm' }
      ])

      const optimizations = CriticalSlotRulesValidator.generateSlotOptimizations(config, equipment)

      expect(optimizations.recommendations.length).toBeGreaterThan(0)
      expect(optimizations.recommendations.some(r => r.type === 'relocate_component')).toBe(true)
      expect(optimizations.recommendations.some(r => r.priority === 'high')).toBe(true)
    })

    it('should suggest efficiency improvements for underutilized locations', () => {
      const config = createTestConfig()
      const equipment = createTestEquipment([
        { type: 'weapon', name: 'Small Laser', criticals: 1, location: 'rightArm' }
      ])

      const optimizations = CriticalSlotRulesValidator.generateSlotOptimizations(config, equipment)

      expect(optimizations.efficiencyImprovements.length).toBeGreaterThan(0)
      expect(optimizations.efficiencyImprovements.some(ei => ei.currentUtilization < 50)).toBe(true)
    })
  })

  describe('calculateSlotEfficiency', () => {
    it('should give high efficiency for balanced slot usage', () => {
      const config = createTestConfig()
      const equipment = createTestEquipment([
        { type: 'weapon', name: 'Medium Laser', criticals: 1, location: 'rightArm' },
        { type: 'weapon', name: 'Medium Laser', criticals: 1, location: 'leftArm' },
        { type: 'weapon', name: 'SRM 6', criticals: 2, location: 'rightTorso' },
        { type: 'ammunition', name: 'SRM Ammo', criticals: 1, location: 'rightTorso' }
      ])

      const efficiency = CriticalSlotRulesValidator.calculateSlotEfficiency(config, equipment)

      expect(efficiency).toBeGreaterThan(80)
    })

    it('should penalize slot overflow', () => {
      const config = createTestConfig()
      const equipment = createTestEquipment([
        { type: 'weapon', name: 'AC/20', criticals: 10, location: 'rightArm' },
        { type: 'weapon', name: 'Large Laser', criticals: 2, location: 'rightArm' },
        { type: 'weapon', name: 'Medium Laser', criticals: 1, location: 'rightArm' }
      ])

      const efficiency = CriticalSlotRulesValidator.calculateSlotEfficiency(config, equipment)

      expect(efficiency).toBeLessThan(75) // Penalized for overflow
    })

    it('should penalize low utilization', () => {
      const config = createTestConfig()
      const equipment = createTestEquipment([
        { type: 'weapon', name: 'Small Laser', criticals: 1, location: 'rightArm' }
      ])

      const efficiency = CriticalSlotRulesValidator.calculateSlotEfficiency(config, equipment)

      expect(efficiency).toBeLessThan(100) // Penalized for low utilization
    })
  })

  describe('helper methods', () => {
    it('should provide default locations for different component types', () => {
      const config = createTestConfig()
      
      // Test with items that don't have explicit locations
      const weaponItem = {
        id: 'weapon-1',
        equipmentData: { type: 'weapon', name: 'Medium Laser' }
      }
      const ammoItem = {
        id: 'ammo-1',
        equipmentData: { type: 'ammunition', name: 'AC/10 Ammo' }
      }
      const heatSinkItem = {
        id: 'hs-1',
        equipmentData: { type: 'heat_sink', name: 'Heat Sink' }
      }

      const utilization = CriticalSlotRulesValidator.calculateLocationUtilization(
        config, 
        [weaponItem, ammoItem, heatSinkItem]
      )

      // Check that items were assigned to appropriate default locations
      expect(utilization.rightArm.components.some(c => c.name === 'Medium Laser')).toBe(true)
      expect(utilization.leftTorso.components.some(c => c.name === 'AC/10 Ammo')).toBe(true)
      expect(utilization.centerTorso.components.some(c => c.name === 'Heat Sink')).toBe(true)
    })

    it('should determine component slot requirements correctly', () => {
      const config = createTestConfig()
      const equipment = [
        { id: '1', equipmentData: { type: 'weapon', name: 'AC/20' } },
        { id: '2', equipmentData: { type: 'weapon', name: 'AC/10' } },
        { id: '3', equipmentData: { type: 'weapon', name: 'AC/5' } },
        { id: '4', equipmentData: { type: 'weapon', name: 'PPC' } },
        { id: '5', equipmentData: { type: 'weapon', name: 'Large Laser' } },
        { id: '6', equipmentData: { type: 'weapon', name: 'Medium Laser' } },
        { id: '7', equipmentData: { type: 'heat_sink', name: 'Double Heat Sink' } },
        { id: '8', equipmentData: { type: 'heat_sink', name: 'Heat Sink' } }
      ]

      const utilization = CriticalSlotRulesValidator.calculateLocationUtilization(config, equipment)

      // Verify slot allocations based on weapon types
      const ac20 = utilization.rightArm.components.find(c => c.name === 'AC/20')
      const ac10 = utilization.rightArm.components.find(c => c.name === 'AC/10')
      const ac5 = utilization.rightArm.components.find(c => c.name === 'AC/5')
      const ppc = utilization.rightArm.components.find(c => c.name === 'PPC')
      const largeLaser = utilization.rightArm.components.find(c => c.name === 'Large Laser')
      const mediumLaser = utilization.rightArm.components.find(c => c.name === 'Medium Laser')

      expect(ac20?.slots).toBe(10)
      expect(ac10?.slots).toBe(7)
      expect(ac5?.slots).toBe(4)
      expect(ppc?.slots).toBe(3)
      expect(largeLaser?.slots).toBe(2)
      expect(mediumLaser?.slots).toBe(1)

      // Check heat sink slots in center torso
      const doubleHS = utilization.centerTorso.components.find(c => c.name === 'Double Heat Sink')
      const singleHS = utilization.centerTorso.components.find(c => c.name === 'Heat Sink')

      expect(doubleHS?.slots).toBe(3)
      expect(singleHS?.slots).toBe(1)
    })

    it('should identify relocatable vs fixed components', () => {
      const config = createTestConfig()
      const equipment = [
        { id: '1', equipmentData: { type: 'weapon', name: 'Medium Laser' } },
        { id: '2', equipmentData: { type: 'equipment', name: 'CASE' } },
        { id: '3', equipmentData: { type: 'ammunition', name: 'AC/10 Ammo' } }
      ]

      const utilization = CriticalSlotRulesValidator.calculateLocationUtilization(config, equipment)

      // Find components in their locations
      const allComponents = Object.values(utilization).flatMap(u => u.components)
      
      const weapon = allComponents.find(c => c.name === 'Medium Laser')
      const caseComp = allComponents.find(c => c.name === 'CASE')
      const ammo = allComponents.find(c => c.name === 'AC/10 Ammo')
      const engine = allComponents.find(c => c.type === 'engine')
      const cockpit = allComponents.find(c => c.type === 'cockpit')

      expect(weapon?.canRelocate).toBe(true)
      expect(caseComp?.canRelocate).toBe(false) // CASE is location-specific
      expect(ammo?.canRelocate).toBe(true)
      expect(engine?.canRelocate).toBe(false) // System components are fixed
      expect(cockpit?.canRelocate).toBe(false)
    })
  })

  describe('getValidationRules', () => {
    it('should return comprehensive slot validation rules', () => {
      const rules = CriticalSlotRulesValidator.getValidationRules()

      expect(rules.length).toBeGreaterThan(0)
      expect(rules.every(rule => rule.name && rule.description && rule.severity && rule.category)).toBe(true)
      expect(rules.some(rule => rule.name === 'Slot Overflow')).toBe(true)
      expect(rules.some(rule => rule.name === 'Special Component Slots')).toBe(true)
      expect(rules.some(rule => rule.name === 'Component Placement')).toBe(true)
      expect(rules.some(rule => rule.name === 'Location Restrictions')).toBe(true)
      expect(rules.some(rule => rule.category === 'slots')).toBe(true)
      expect(rules.some(rule => rule.category === 'placement')).toBe(true)
      expect(rules.some(rule => rule.severity === 'critical')).toBe(true)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle zero engine rating', () => {
      const config = createTestConfig({ engineRating: 0 })

      const utilization = CriticalSlotRulesValidator.calculateLocationUtilization(config, [])

      const engineComponent = utilization.centerTorso.components.find(c => c.type === 'engine')
      expect(engineComponent?.slots).toBe(0)
    })

    it('should handle undefined equipment data', () => {
      const config = createTestConfig()
      const equipment = [
        {
          id: 'item-1',
          location: 'rightArm',
          equipmentData: undefined
        }
      ]

      const result = CriticalSlotRulesValidator.validateCriticalSlots(config, equipment)

      expect(result.isValid).toBe(true) // Should handle gracefully
      expect(result.totalSlotsUsed).toBeGreaterThan(0) // System components still counted
    })

    it('should handle equipment without location', () => {
      const config = createTestConfig()
      const equipment = [
        {
          id: 'item-1',
          equipmentData: {
            type: 'weapon',
            name: 'Medium Laser',
            criticals: 1
          }
        }
      ]

      const utilization = CriticalSlotRulesValidator.calculateLocationUtilization(config, equipment)

      // Should assign to default location (rightArm for weapons)
      expect(utilization.rightArm.components.some(c => c.name === 'Medium Laser')).toBe(true)
    })

    it('should handle invalid location names', () => {
      const config = createTestConfig()
      const equipment = [
        {
          id: 'item-1',
          location: 'invalidLocation',
          equipmentData: {
            type: 'weapon',
            name: 'Medium Laser',
            criticals: 1
          }
        }
      ]

      const utilization = CriticalSlotRulesValidator.calculateLocationUtilization(config, equipment)

      // Should not crash, component placement should be handled gracefully
      expect(Object.keys(utilization)).toEqual(['head', 'centerTorso', 'leftTorso', 'rightTorso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'])
    })

    it('should handle special component types without configuration', () => {
      const config = createTestConfig({
        structureType: { type: 'Standard', techBase: 'Inner Sphere' },
        armorType: { type: 'Standard', techBase: 'Inner Sphere' }
      })

      const result = CriticalSlotRulesValidator.validateCriticalSlots(config, [])

      expect(result.specialComponentSlots.endoSteel.required).toBe(0)
      expect(result.specialComponentSlots.ferroFibrous.required).toBe(0)
      expect(result.specialComponentSlots.endoSteel.isCompliant).toBe(true)
      expect(result.specialComponentSlots.ferroFibrous.isCompliant).toBe(true)
    })

    it('should handle empty equipment list', () => {
      const config = createTestConfig()

      const result = CriticalSlotRulesValidator.validateCriticalSlots(config, [])

      expect(result.isValid).toBe(true)
      expect(result.totalSlotsUsed).toBeGreaterThan(0) // System components
      expect(result.violations.filter(v => v.type === 'overflow')).toHaveLength(0)
      expect(result.placementViolations).toHaveLength(0)
    })

    it('should handle context validation flags', () => {
      const config = createTestConfig()
      const equipment = createTestEquipment([
        { type: 'ammunition', name: 'AC/10 Ammo', location: 'head' }
      ])

      // Test with different validation contexts
      const resultStrict = CriticalSlotRulesValidator.validateCriticalSlots(config, equipment, {
        strictMode: true,
        validateSpecialComponents: true,
        validatePlacement: true,
        checkLocationRestrictions: true
      })

      const resultLenient = CriticalSlotRulesValidator.validateCriticalSlots(config, equipment, {
        strictMode: false,
        validateSpecialComponents: false,
        validatePlacement: false,
        checkLocationRestrictions: false
      })

      expect(resultStrict.violations.length).toBeGreaterThan(resultLenient.violations.length)
      expect(resultStrict.placementViolations.length).toBeGreaterThan(resultLenient.placementViolations.length)
    })
  })
})
