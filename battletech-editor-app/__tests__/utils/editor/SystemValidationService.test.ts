/**
 * Tests for SystemValidationService
 * 
 * Validates system component integration validation logic and BattleTech rule compliance.
 */

import { SystemValidationService } from '../../../utils/editor/SystemValidationService'
import { EditableUnit } from '../../../types/editor'

// Helper function to create minimal valid EditableUnit for testing
function createMockUnit(overrides: Partial<EditableUnit> = {}): EditableUnit {
  return {
    // Basic unit properties
    chassis: 'Test Chassis',
    model: 'TST-1',
    mass: 50,
    tech_base: 'Inner Sphere',
    era: '3025',
    data: {
      chassis: 'Test Chassis',
      model: 'TST-1'
    },
    
    // System components for system validation
    systemComponents: {
      engine: {
        rating: 200,
        type: 'Standard'
      },
      heatSinks: {
        total: 10,
        externalRequired: 0,
        engineIntegrated: 8,
        type: 'Single Heat Sink'
      },
      gyro: {
        type: 'Standard'
      },
      cockpit: {
        type: 'Standard'
      },
      lifesupport: {
        environmental: false
      },
      sensors: {
        type: 'Standard'
      }
    },
    
    // Required EditableUnit properties
    armorAllocation: {},
    equipmentPlacements: [],
    criticalSlots: [],
    fluffData: {},
    selectedQuirks: [],
    validationState: {
      isValid: true,
      errors: [],
      warnings: []
    },
    editorMetadata: {
      lastModified: new Date(),
      isDirty: false,
      version: '1.0.0'
    },
    
    // Apply any overrides
    ...overrides
  } as EditableUnit
}

describe('SystemValidationService', () => {
  let mockUnit: EditableUnit

  beforeEach(() => {
    mockUnit = createMockUnit()
  })

  describe('validateSystemComponents', () => {
    it('should validate a properly configured system', () => {
      const result = SystemValidationService.validateSystemComponents(mockUnit)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      // May have warnings due to engine integration
    })

    it('should handle units with no system components', () => {
      const unitWithoutSystems = createMockUnit({ systemComponents: undefined })

      const result = SystemValidationService.validateSystemComponents(unitWithoutSystems)

      expect(result.isValid).toBe(true) // Warning mode
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].id).toBe('missing-system-components')
    })

    it('should require system components in strict mode', () => {
      const unitWithoutSystems = createMockUnit({ systemComponents: undefined })

      const result = SystemValidationService.validateSystemComponents(unitWithoutSystems, {
        strictMode: true
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].id).toBe('missing-system-components')
    })

    it('should validate all system components when enabled', () => {
      const result = SystemValidationService.validateSystemComponents(mockUnit, {
        validateEngineIntegration: true,
        validateHeatSinkRequirements: true,
        checkSystemCompatibility: true
      })

      expect(result.isValid).toBe(true)
      // Should have delegated to engine validation
    })

    it('should allow disabling specific validations', () => {
      const result = SystemValidationService.validateSystemComponents(mockUnit, {
        validateEngineIntegration: false,
        validateHeatSinkRequirements: false,
        checkSystemCompatibility: false
      })

      expect(result.isValid).toBe(true)
      expect(result.warnings.length).toBeGreaterThanOrEqual(0) // Required components warnings
    })
  })

  describe('validateHeatSinkSystem', () => {
    it('should validate proper heat sink configuration', () => {
      const result = SystemValidationService.validateHeatSinkSystem(
        mockUnit.systemComponents!,
        mockUnit,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should require heat sink configuration', () => {
      const systemsWithoutHeatSinks = {
        ...mockUnit.systemComponents!,
        heatSinks: undefined
      }

      const result = SystemValidationService.validateHeatSinkSystem(
        systemsWithoutHeatSinks,
        mockUnit,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].id).toBe('missing-heat-sinks')
    })

    it('should enforce minimum heat sink requirement', () => {
      const systemsWithFewHeatSinks = {
        ...mockUnit.systemComponents!,
        heatSinks: {
          total: 5, // Below minimum of 10
          externalRequired: 0,
          engineIntegrated: 5,
          type: 'Single Heat Sink'
        }
      }

      const result = SystemValidationService.validateHeatSinkSystem(
        systemsWithFewHeatSinks,
        mockUnit,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].id).toBe('insufficient-heat-sinks')
    })

    it('should reject negative external heat sinks', () => {
      const systemsWithNegativeHeatSinks = {
        ...mockUnit.systemComponents!,
        heatSinks: {
          total: 10,
          externalRequired: -5, // Invalid negative value
          engineIntegrated: 8, // Valid engine capacity
          type: 'Single Heat Sink'
        }
      }

      const result = SystemValidationService.validateHeatSinkSystem(
        systemsWithNegativeHeatSinks,
        mockUnit,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].id).toBe('negative-external-heat-sinks')
    })

    it('should validate heat sink tech compatibility', () => {
      const clanUnit = createMockUnit({
        tech_base: 'Inner Sphere',
        systemComponents: {
          ...mockUnit.systemComponents!,
          heatSinks: {
            total: 10,
            externalRequired: 0,
            engineIntegrated: 8,
            type: 'Clan Double Heat Sink' as any // Mismatched tech for testing
          }
        }
      })

      const result = SystemValidationService.validateHeatSinkSystem(
        clanUnit.systemComponents!,
        clanUnit,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(true) // Warning mode
      expect(result.warnings.some(w => w.id === 'heat-sink-tech-mismatch')).toBe(true)
    })

    it('should enforce heat sink tech compatibility in strict mode', () => {
      const mismatchedUnit = createMockUnit({
        tech_base: 'Inner Sphere',
        systemComponents: {
          ...mockUnit.systemComponents!,
          heatSinks: {
            total: 10,
            externalRequired: 0,
            engineIntegrated: 8,
            type: 'Clan Double Heat Sink' as any
          }
        }
      })

      const result = SystemValidationService.validateHeatSinkSystem(
        mismatchedUnit.systemComponents!,
        mismatchedUnit,
        {
          strictMode: true,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.id === 'heat-sink-tech-mismatch')).toBe(true)
    })
  })

  describe('validateHeatSinkTechCompatibility', () => {
    it('should allow matching tech bases', () => {
      const result = SystemValidationService.validateHeatSinkTechCompatibility(
        'Single Heat Sink',
        'Inner Sphere',
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should warn about Clan heat sinks on Inner Sphere chassis', () => {
      const result = SystemValidationService.validateHeatSinkTechCompatibility(
        'Clan Double Heat Sink',
        'Inner Sphere',
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].id).toBe('heat-sink-tech-mismatch')
    })

    it('should warn about Inner Sphere heat sinks on Clan chassis', () => {
      const result = SystemValidationService.validateHeatSinkTechCompatibility(
        'Inner Sphere Double Heat Sink',
        'Clan',
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].id).toBe('heat-sink-tech-mismatch')
    })
  })

  describe('validateEngineHeatSinkCapacity', () => {
    it('should validate engine heat sink capacity', () => {
      const engine = { rating: 200 } // Can hold 8 heat sinks (200/25)
      const heatSinks = { engineIntegrated: 8 }

      const result = SystemValidationService.validateEngineHeatSinkCapacity(
        engine,
        heatSinks,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject excess engine heat sinks', () => {
      const engine = { rating: 100 } // Can only hold 4 heat sinks (100/25)
      const heatSinks = { engineIntegrated: 6 } // Too many

      const result = SystemValidationService.validateEngineHeatSinkCapacity(
        engine,
        heatSinks,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].id).toBe('excess-engine-heat-sinks')
    })

    it('should warn about unused engine capacity', () => {
      const engine = { rating: 300 } // Can hold 12 heat sinks (300/25)
      const heatSinks = { engineIntegrated: 8 } // Using only 8

      const result = SystemValidationService.validateEngineHeatSinkCapacity(
        engine,
        heatSinks,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].id).toBe('unused-engine-heat-sink-capacity')
    })

    it('should handle engines without rating', () => {
      const engine = {} // No rating
      const heatSinks = { engineIntegrated: 8 }

      const result = SystemValidationService.validateEngineHeatSinkCapacity(
        engine,
        heatSinks,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })
  })

  describe('validateHeatSinkEfficiency', () => {
    it('should calculate heat sink efficiency for standard heat sinks', () => {
      const heatSinks = {
        total: 15,
        type: 'Single Heat Sink'
      }

      const result = SystemValidationService.validateHeatSinkEfficiency(
        heatSinks,
        mockUnit,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should calculate heat sink efficiency for double heat sinks', () => {
      const heatSinks = {
        total: 15,
        type: 'Double Heat Sink'
      }

      const result = SystemValidationService.validateHeatSinkEfficiency(
        heatSinks,
        mockUnit,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should warn about excessive heat dissipation', () => {
      const heatSinks = {
        total: 35, // Very high heat dissipation
        type: 'Single Heat Sink'
      }

      const result = SystemValidationService.validateHeatSinkEfficiency(
        heatSinks,
        mockUnit,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(true)
      expect(result.warnings.some(w => w.id === 'excessive-heat-dissipation')).toBe(true)
    })

    it('should warn about low heat dissipation for heavy units', () => {
      const heatSinks = {
        total: 10, // Low heat dissipation
        type: 'Single Heat Sink'
      }
      const heavyUnit = createMockUnit({ mass: 80 })

      const result = SystemValidationService.validateHeatSinkEfficiency(
        heatSinks,
        heavyUnit,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(true)
      expect(result.warnings.some(w => w.id === 'low-heat-dissipation')).toBe(true)
    })
  })

  describe('validateSystemIntegration', () => {
    it('should validate gyro-engine compatibility', () => {
      const result = SystemValidationService.validateSystemIntegration(
        mockUnit.systemComponents!,
        mockUnit,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate cockpit integration', () => {
      const systemsWithCockpit = {
        ...mockUnit.systemComponents!,
        cockpit: {
          type: 'Standard'
        }
      }

      const result = SystemValidationService.validateSystemIntegration(
        systemsWithCockpit,
        mockUnit,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate life support integration', () => {
      const systemsWithLifeSupport = {
        ...mockUnit.systemComponents!,
        lifesupport: {
          environmental: true
        },
        cockpit: {
          type: 'Standard',
          sealed: false
        }
      }

      const result = SystemValidationService.validateSystemIntegration(
        systemsWithLifeSupport,
        mockUnit,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(true)
      expect(result.warnings.some(w => w.id === 'environmental-lifesupport-unsealed-cockpit')).toBe(true)
    })
  })

  describe('validateGyroEngineCompatibility', () => {
    it('should validate standard gyro with normal engine', () => {
      const gyro = { type: 'Standard' }
      const engine = { rating: 300 }

      const result = SystemValidationService.validateGyroEngineCompatibility(
        gyro,
        engine,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject standard gyro with excessive engine rating', () => {
      const gyro = { type: 'Standard' }
      const engine = { rating: 450 } // Over 400 limit

      const result = SystemValidationService.validateGyroEngineCompatibility(
        gyro,
        engine,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].id).toBe('gyro-engine-incompatibility')
    })

    it('should warn about compact gyro with XL engine', () => {
      const gyro = { type: 'Compact' }
      const engine = { rating: 300, type: 'XL Engine' }

      const result = SystemValidationService.validateGyroEngineCompatibility(
        gyro,
        engine,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].id).toBe('compact-gyro-xl-engine')
    })
  })

  describe('validateCockpitIntegration', () => {
    it('should validate standard cockpit', () => {
      const cockpit = { type: 'Standard' }

      const result = SystemValidationService.validateCockpitIntegration(
        cockpit,
        mockUnit,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should warn about industrial cockpit on Clan unit', () => {
      const cockpit = { type: 'Industrial' }
      const clanUnit = createMockUnit({ tech_base: 'Clan' })

      const result = SystemValidationService.validateCockpitIntegration(
        cockpit,
        clanUnit,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].id).toBe('industrial-cockpit-clan')
    })

    it('should enforce industrial cockpit restriction in strict mode', () => {
      const cockpit = { type: 'Industrial' }
      const clanUnit = createMockUnit({ tech_base: 'Clan' })

      const result = SystemValidationService.validateCockpitIntegration(
        cockpit,
        clanUnit,
        {
          strictMode: true,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].id).toBe('industrial-cockpit-clan')
    })

    it('should warn about small cockpit on heavy mech', () => {
      const cockpit = { type: 'Small' }
      const heavyUnit = createMockUnit({ mass: 80 })

      const result = SystemValidationService.validateCockpitIntegration(
        cockpit,
        heavyUnit,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].id).toBe('small-cockpit-heavy-mech')
    })
  })

  describe('validateRequiredComponents', () => {
    it('should pass with all required components', () => {
      const components = {
        engine: { rating: 200 },
        gyro: { type: 'Standard' },
        cockpit: { type: 'Standard' },
        lifesupport: { environmental: false },
        sensors: { type: 'Standard' }
      }

      const result = SystemValidationService.validateRequiredComponents(
        components,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should warn about missing components in normal mode', () => {
      const incompleteComponents = {
        engine: { rating: 200 }
        // Missing gyro, cockpit, lifesupport, sensors
      }

      const result = SystemValidationService.validateRequiredComponents(
        incompleteComponents,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(true) // Warnings only
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some(w => w.id === 'missing-gyro')).toBe(true)
    })

    it('should require components in strict mode', () => {
      const incompleteComponents = {
        engine: { rating: 200 }
        // Missing other components
      }

      const result = SystemValidationService.validateRequiredComponents(
        incompleteComponents,
        {
          strictMode: true,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.id === 'missing-gyro')).toBe(true)
    })
  })

  describe('utility methods', () => {
    it('should return system component requirements', () => {
      const requirements = SystemValidationService.getSystemComponentRequirements(mockUnit)

      expect(requirements.minHeatSinks).toBe(10)
      expect(requirements.requiredComponents).toContain('engine')
      expect(requirements.requiredComponents).toContain('gyro')
      expect(requirements.techBaseConstraints).toContain('Inner Sphere technology compatible')
    })

    it('should adapt requirements for light units', () => {
      const lightUnit = createMockUnit({ mass: 15 })
      const requirements = SystemValidationService.getSystemComponentRequirements(lightUnit)

      expect(requirements.incompatibleComponents).toContain('Standard Gyro (too heavy)')
    })

    it('should adapt requirements for Clan units', () => {
      const clanUnit = createMockUnit({ tech_base: 'Clan' })
      const requirements = SystemValidationService.getSystemComponentRequirements(clanUnit)

      expect(requirements.techBaseConstraints).toContain('Clan technology compatible')
    })

    it('should validate tech compatibility', () => {
      expect(SystemValidationService.validateTechCompatibility('engine', 'Standard', 'Inner Sphere')).toBe(true)
      expect(SystemValidationService.validateTechCompatibility('engine', 'Clan XL', 'Inner Sphere')).toBe(false)
      expect(SystemValidationService.validateTechCompatibility('engine', 'Clan XL', 'Clan')).toBe(true)
    })

    it('should return validation rules for UI display', () => {
      const rules = SystemValidationService.getValidationRules()

      expect(rules).toHaveLength(3) // System Requirements, Integration, Performance
      expect(rules[0].category).toBe('System Requirements')
      expect(rules[1].category).toBe('Integration Compatibility')
      expect(rules[2].category).toBe('Performance Optimization')
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle missing system components gracefully', () => {
      const emptyComponents = {}

      const result = SystemValidationService.validateHeatSinkSystem(
        emptyComponents,
        mockUnit,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].id).toBe('missing-heat-sinks')
    })

    it('should handle undefined heat sink properties', () => {
      const malformedHeatSinks = {
        heatSinks: {
          total: undefined, // Missing required property
          externalRequired: undefined,
          engineIntegrated: undefined
        }
      }

      const result = SystemValidationService.validateHeatSinkSystem(
        malformedHeatSinks,
        mockUnit,
        {
          strictMode: false,
          validateEngineIntegration: true,
          validateHeatSinkRequirements: true,
          checkSystemCompatibility: true
        }
      )

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should handle validation context variations', () => {
      const result = SystemValidationService.validateSystemComponents(mockUnit, {
        strictMode: true,
        validateEngineIntegration: false,
        validateHeatSinkRequirements: false,
        checkSystemCompatibility: false
      })

      expect(result.isValid).toBe(true) // Should pass basic validation
    })
  })
})
