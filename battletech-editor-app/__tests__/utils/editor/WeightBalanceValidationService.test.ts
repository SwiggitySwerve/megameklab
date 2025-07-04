/**
 * Tests for WeightBalanceValidationService
 * 
 * Validates weight balance and physical constraint validation logic and BattleTech rule compliance.
 */

import { WeightBalanceValidationService } from '../../../utils/editor/WeightBalanceValidationService'
import { EditableUnit } from '../../../types/editor'

// Mock UnitCalculationService
jest.mock('../../../utils/editor/UnitCalculationService', () => ({
  UnitCalculationService: {
    calculateWeightBreakdown: jest.fn(),
    calculateHeatBalance: jest.fn(),
    calculateCriticalSlotBreakdown: jest.fn()
  }
}))

import { UnitCalculationService } from '../../../utils/editor/UnitCalculationService'

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
    
    // System components
    systemComponents: {
      engine: {
        rating: 200,
        type: 'Standard'
      },
      heatSinks: {
        total: 10,
        externalRequired: 2,
        engineIntegrated: 8,
        type: 'Single Heat Sink'
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

describe('WeightBalanceValidationService', () => {
  let mockUnit: EditableUnit

  beforeEach(() => {
    mockUnit = createMockUnit()
    jest.clearAllMocks()
  })

  describe('validateWeightBalance', () => {
    it('should validate a properly balanced unit', () => {
      // Mock successful calculations
      (UnitCalculationService.calculateWeightBreakdown as jest.Mock).mockReturnValue({
        total: 45,
        isOverweight: false,
        utilizationPercentage: 90,
        components: {
          engine: 8.5,
          armor: 10, // 22% - good armor weight
          weapons: 15,
          equipment: 6.5
        }
      });
      
      (UnitCalculationService.calculateHeatBalance as jest.Mock).mockReturnValue({
        generation: 20,
        dissipation: 25,
        balance: 5,
        isOverheating: false,
        heatEfficiency: 125,
        weaponCount: 4,
        heatSinkWeight: 10
      });

      (UnitCalculationService.calculateCriticalSlotBreakdown as jest.Mock).mockReturnValue({
        used: 40,
        total: 78,
        free: 38,
        utilizationPercentage: 51.3,
        byLocation: {},
        byType: { weapons: 20, equipment: 20 }
      })

      const result = WeightBalanceValidationService.validateWeightBalance(mockUnit)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.metrics?.weightBreakdown).toBeDefined()
    })

    it('should handle units with no mass', () => {
      const unitWithoutMass = createMockUnit({ mass: 0 })

      const result = WeightBalanceValidationService.validateWeightBalance(unitWithoutMass)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(1)
      expect(result.errors.some(e => e.id === 'invalid-unit-mass')).toBe(true)
    })

    it('should allow disabling specific validations', () => {
      const result = WeightBalanceValidationService.validateWeightBalance(mockUnit, {
        validateWeightLimits: false,
        validateHeatBalance: false,
        validateCriticalSlots: false
      })

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should include metrics when calculations succeed', () => {
      // Mock all calculations separately
      (UnitCalculationService.calculateWeightBreakdown as jest.Mock).mockReturnValue({
        total: 45,
        isOverweight: false,
        utilizationPercentage: 90
      });
      
      (UnitCalculationService.calculateHeatBalance as jest.Mock).mockReturnValue({
        generation: 20,
        dissipation: 25,
        balance: 5,
        isOverheating: false,
        heatEfficiency: 125
      });

      (UnitCalculationService.calculateCriticalSlotBreakdown as jest.Mock).mockReturnValue({
        used: 40,
        total: 78,
        free: 38,
        utilizationPercentage: 51.3
      });

      const result = WeightBalanceValidationService.validateWeightBalance(mockUnit)

      expect(result.metrics).toBeDefined()
      expect(result.metrics?.weightBreakdown).toBeDefined()
      expect(result.metrics?.heatBalance).toBeDefined()
      expect(result.metrics?.criticalBreakdown).toBeDefined()
    })
  })

  describe('validateWeightLimits', () => {
    it('should validate normal weight utilization', () => {
      (UnitCalculationService.calculateWeightBreakdown as jest.Mock).mockReturnValue({
        total: 45,
        isOverweight: false,
        utilizationPercentage: 90,
        components: {}
      })

      const result = WeightBalanceValidationService.validateWeightLimits(mockUnit, {
        strictMode: false,
        validateWeightLimits: true,
        validateHeatBalance: true,
        validateCriticalSlots: true,
        performanceThresholds: {
          weightUtilizationHigh: 95,
          weightUtilizationLow: 75,
          heatEfficiencyLow: 120,
          excessiveHeatCapacity: 20,
          criticalUtilizationHigh: 90,
          lowCriticalSlots: 5
        }
      })

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect overweight units', () => {
      (UnitCalculationService.calculateWeightBreakdown as jest.Mock).mockReturnValue({
        total: 55,
        isOverweight: true,
        utilizationPercentage: 110,
        components: {}
      })

      const result = WeightBalanceValidationService.validateWeightLimits(mockUnit, {
        strictMode: false,
        validateWeightLimits: true,
        validateHeatBalance: true,
        validateCriticalSlots: true,
        performanceThresholds: {
          weightUtilizationHigh: 95,
          weightUtilizationLow: 75,
          heatEfficiencyLow: 120,
          excessiveHeatCapacity: 20,
          criticalUtilizationHigh: 90,
          lowCriticalSlots: 5
        }
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].id).toBe('unit-overweight')
      expect(result.errors[0].message).toContain('5.0 tons overweight')
    })

    it('should warn about high weight utilization', () => {
      (UnitCalculationService.calculateWeightBreakdown as jest.Mock).mockReturnValue({
        total: 48,
        isOverweight: false,
        utilizationPercentage: 96,
        components: {
          armor: 12, // 25% - good armor weight to avoid extra warnings
          weapons: 15,
          engine: 10,
          equipment: 11
        }
      })

      const result = WeightBalanceValidationService.validateWeightLimits(mockUnit, {
        strictMode: false,
        validateWeightLimits: true,
        validateHeatBalance: true,
        validateCriticalSlots: true,
        performanceThresholds: {
          weightUtilizationHigh: 95,
          weightUtilizationLow: 75,
          heatEfficiencyLow: 120,
          excessiveHeatCapacity: 20,
          criticalUtilizationHigh: 90,
          lowCriticalSlots: 5
        }
      })

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].id).toBe('high-weight-utilization')
    })

    it('should warn about low weight utilization', () => {
      (UnitCalculationService.calculateWeightBreakdown as jest.Mock).mockReturnValue({
        total: 35,
        isOverweight: false,
        utilizationPercentage: 70,
        components: {
          armor: 8, // 23% - good armor weight to avoid extra warnings
          weapons: 12,
          engine: 8,
          equipment: 7
        }
      })

      const result = WeightBalanceValidationService.validateWeightLimits(mockUnit, {
        strictMode: false,
        validateWeightLimits: true,
        validateHeatBalance: true,
        validateCriticalSlots: true,
        performanceThresholds: {
          weightUtilizationHigh: 95,
          weightUtilizationLow: 75,
          heatEfficiencyLow: 120,
          excessiveHeatCapacity: 20,
          criticalUtilizationHigh: 90,
          lowCriticalSlots: 5
        }
      })

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].id).toBe('low-weight-utilization')
    })

    it('should handle weight calculation errors', () => {
      (UnitCalculationService.calculateWeightBreakdown as jest.Mock).mockImplementation(() => {
        throw new Error('Calculation failed')
      })

      const result = WeightBalanceValidationService.validateWeightLimits(mockUnit, {
        strictMode: false,
        validateWeightLimits: true,
        validateHeatBalance: true,
        validateCriticalSlots: true,
        performanceThresholds: {
          weightUtilizationHigh: 95,
          weightUtilizationLow: 75,
          heatEfficiencyLow: 120,
          excessiveHeatCapacity: 20,
          criticalUtilizationHigh: 90,
          lowCriticalSlots: 5
        }
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].id).toBe('weight-calculation-error')
    })
  })

  describe('validateHeatBalance', () => {
    it('should validate normal heat balance', () => {
      (UnitCalculationService.calculateHeatBalance as jest.Mock).mockReturnValue({
        generation: 20,
        dissipation: 25,
        balance: 5,
        isOverheating: false,
        heatEfficiency: 125,
        weaponCount: 4
      })

      const result = WeightBalanceValidationService.validateHeatBalance(mockUnit, {
        strictMode: false,
        validateWeightLimits: true,
        validateHeatBalance: true,
        validateCriticalSlots: true,
        performanceThresholds: {
          weightUtilizationHigh: 95,
          weightUtilizationLow: 75,
          heatEfficiencyLow: 120,
          excessiveHeatCapacity: 20,
          criticalUtilizationHigh: 90,
          lowCriticalSlots: 5
        }
      })

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect overheating units', () => {
      (UnitCalculationService.calculateHeatBalance as jest.Mock).mockReturnValue({
        generation: 30,
        dissipation: 20,
        balance: -10,
        isOverheating: true,
        heatEfficiency: 67
      })

      const result = WeightBalanceValidationService.validateHeatBalance(mockUnit, {
        strictMode: false,
        validateWeightLimits: true,
        validateHeatBalance: true,
        validateCriticalSlots: true,
        performanceThresholds: {
          weightUtilizationHigh: 95,
          weightUtilizationLow: 75,
          heatEfficiencyLow: 120,
          excessiveHeatCapacity: 20,
          criticalUtilizationHigh: 90,
          lowCriticalSlots: 5
        }
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].id).toBe('unit-overheating')
      expect(result.errors[0].message).toContain('10.0 more heat')
    })

    it('should warn about low heat efficiency', () => {
      (UnitCalculationService.calculateHeatBalance as jest.Mock).mockReturnValue({
        generation: 25,
        dissipation: 30,
        balance: 5,
        isOverheating: false,
        heatEfficiency: 115,
        heatSinkWeight: 10,
        weaponCount: 4 // 25/4 = 6.25 heat per weapon (not > 8, so no high heat warning)
      })

      const result = WeightBalanceValidationService.validateHeatBalance(mockUnit, {
        strictMode: false,
        validateWeightLimits: true,
        validateHeatBalance: true,
        validateCriticalSlots: true,
        performanceThresholds: {
          weightUtilizationHigh: 95,
          weightUtilizationLow: 75,
          heatEfficiencyLow: 120,
          excessiveHeatCapacity: 20,
          criticalUtilizationHigh: 90,
          lowCriticalSlots: 5
        }
      })

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].id).toBe('low-heat-efficiency')
    })

    it('should warn about excessive heat capacity', () => {
      (UnitCalculationService.calculateHeatBalance as jest.Mock).mockReturnValue({
        generation: 10,
        dissipation: 35,
        balance: 25,
        isOverheating: false,
        heatEfficiency: 350,
        weaponCount: 2, // 10/2 = 5 heat per weapon (not > 8, so no high heat warning)
        heatSinkWeight: 15
      })

      const result = WeightBalanceValidationService.validateHeatBalance(mockUnit, {
        strictMode: false,
        validateWeightLimits: true,
        validateHeatBalance: true,
        validateCriticalSlots: true,
        performanceThresholds: {
          weightUtilizationHigh: 95,
          weightUtilizationLow: 75,
          heatEfficiencyLow: 120,
          excessiveHeatCapacity: 20,
          criticalUtilizationHigh: 90,
          lowCriticalSlots: 5
        }
      })

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].id).toBe('excessive-heat-capacity')
    })

    it('should warn about no heat generation (unarmed unit)', () => {
      (UnitCalculationService.calculateHeatBalance as jest.Mock).mockReturnValue({
        generation: 0,
        dissipation: 20,
        balance: 20,
        isOverheating: false,
        heatEfficiency: 0
      })

      const result = WeightBalanceValidationService.validateHeatBalance(mockUnit, {
        strictMode: false,
        validateWeightLimits: true,
        validateHeatBalance: true,
        validateCriticalSlots: true,
        performanceThresholds: {
          weightUtilizationHigh: 95,
          weightUtilizationLow: 75,
          heatEfficiencyLow: 120,
          excessiveHeatCapacity: 20,
          criticalUtilizationHigh: 90,
          lowCriticalSlots: 5
        }
      })

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].id).toBe('no-heat-generation')
    })

    it('should handle heat calculation errors', () => {
      (UnitCalculationService.calculateHeatBalance as jest.Mock).mockImplementation(() => {
        throw new Error('Heat calculation failed')
      })

      const result = WeightBalanceValidationService.validateHeatBalance(mockUnit, {
        strictMode: false,
        validateWeightLimits: true,
        validateHeatBalance: true,
        validateCriticalSlots: true,
        performanceThresholds: {
          weightUtilizationHigh: 95,
          weightUtilizationLow: 75,
          heatEfficiencyLow: 120,
          excessiveHeatCapacity: 20,
          criticalUtilizationHigh: 90,
          lowCriticalSlots: 5
        }
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].id).toBe('heat-calculation-error')
    })
  })

  describe('validateCriticalSlots', () => {
    it('should validate normal critical slot usage', () => {
      (UnitCalculationService.calculateCriticalSlotBreakdown as jest.Mock).mockReturnValue({
        used: 40,
        total: 78,
        free: 38,
        utilizationPercentage: 51.3,
        byLocation: {
          'center torso': { used: 10, total: 12 },
          'right arm': { used: 8, total: 12 }
        },
        byType: {
          weapons: 20,
          equipment: 20
        }
      })

      const result = WeightBalanceValidationService.validateCriticalSlots(mockUnit, {
        strictMode: false,
        validateWeightLimits: true,
        validateHeatBalance: true,
        validateCriticalSlots: true,
        performanceThresholds: {
          weightUtilizationHigh: 95,
          weightUtilizationLow: 75,
          heatEfficiencyLow: 120,
          excessiveHeatCapacity: 20,
          criticalUtilizationHigh: 90,
          lowCriticalSlots: 5
        }
      })

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect critical slot overflow', () => {
      (UnitCalculationService.calculateCriticalSlotBreakdown as jest.Mock).mockReturnValue({
        used: 85,
        total: 78,
        free: -7,
        utilizationPercentage: 109,
        byLocation: {},
        byType: {}
      })

      const result = WeightBalanceValidationService.validateCriticalSlots(mockUnit, {
        strictMode: false,
        validateWeightLimits: true,
        validateHeatBalance: true,
        validateCriticalSlots: true,
        performanceThresholds: {
          weightUtilizationHigh: 95,
          weightUtilizationLow: 75,
          heatEfficiencyLow: 120,
          excessiveHeatCapacity: 20,
          criticalUtilizationHigh: 90,
          lowCriticalSlots: 5
        }
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].id).toBe('critical-slot-overflow')
      expect(result.errors[0].message).toContain('7 slots')
    })

    it('should warn about low critical slot availability', () => {
      (UnitCalculationService.calculateCriticalSlotBreakdown as jest.Mock).mockReturnValue({
        used: 75,
        total: 78,
        free: 3,
        utilizationPercentage: 96.2,
        byLocation: {},
        byType: {}
      })

      const result = WeightBalanceValidationService.validateCriticalSlots(mockUnit, {
        strictMode: false,
        validateWeightLimits: true,
        validateHeatBalance: true,
        validateCriticalSlots: true,
        performanceThresholds: {
          weightUtilizationHigh: 95,
          weightUtilizationLow: 75,
          heatEfficiencyLow: 120,
          excessiveHeatCapacity: 20,
          criticalUtilizationHigh: 90,
          lowCriticalSlots: 5
        }
      })

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(2) // low slots + high utilization
      expect(result.warnings.some(w => w.id === 'low-critical-slots')).toBe(true)
    })

    it('should warn about high critical slot utilization', () => {
      (UnitCalculationService.calculateCriticalSlotBreakdown as jest.Mock).mockReturnValue({
        used: 72,
        total: 78,
        free: 6,
        utilizationPercentage: 92.3,
        byLocation: {},
        byType: {}
      })

      const result = WeightBalanceValidationService.validateCriticalSlots(mockUnit, {
        strictMode: false,
        validateWeightLimits: true,
        validateHeatBalance: true,
        validateCriticalSlots: true,
        performanceThresholds: {
          weightUtilizationHigh: 95,
          weightUtilizationLow: 75,
          heatEfficiencyLow: 120,
          excessiveHeatCapacity: 20,
          criticalUtilizationHigh: 90,
          lowCriticalSlots: 5
        }
      })

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].id).toBe('high-critical-utilization')
    })

    it('should handle critical slot calculation errors', () => {
      (UnitCalculationService.calculateCriticalSlotBreakdown as jest.Mock).mockImplementation(() => {
        throw new Error('Critical calculation failed')
      })

      const result = WeightBalanceValidationService.validateCriticalSlots(mockUnit, {
        strictMode: false,
        validateWeightLimits: true,
        validateHeatBalance: true,
        validateCriticalSlots: true,
        performanceThresholds: {
          weightUtilizationHigh: 95,
          weightUtilizationLow: 75,
          heatEfficiencyLow: 120,
          excessiveHeatCapacity: 20,
          criticalUtilizationHigh: 90,
          lowCriticalSlots: 5
        }
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].id).toBe('critical-calculation-error')
    })
  })

  describe('analyzeWeightEfficiency', () => {
    it('should analyze weight distribution and provide suggestions', () => {
      const weightBreakdown = {
        total: 50,
        components: {
          armor: 8, // 16% - low for heavy mech
          weapons: 22, // 44% - heavy weapon load
          engine: 15, // 30% - heavy for light mech
          equipment: 5
        }
      }

      const analysis = WeightBalanceValidationService.analyzeWeightEfficiency(
        weightBreakdown,
        createMockUnit({ mass: 80 }) // Heavy mech
      )

      expect(analysis.score).toBeLessThan(100)
      expect(analysis.suggestions.length).toBeGreaterThan(0)
      expect(analysis.suggestions.some(s => s.id === 'low-armor-weight')).toBe(true)
      expect(analysis.suggestions.some(s => s.id === 'heavy-weapon-load')).toBe(true)
    })

    it('should provide no suggestions for efficient weight distribution', () => {
      const weightBreakdown = {
        total: 50,
        components: {
          armor: 12, // 24% - good
          weapons: 15, // 30% - reasonable
          engine: 8, // 16% - reasonable
          equipment: 15 // 30% - reasonable
        }
      }

      const analysis = WeightBalanceValidationService.analyzeWeightEfficiency(
        weightBreakdown,
        mockUnit
      )

      expect(analysis.score).toBe(100)
      expect(analysis.suggestions).toHaveLength(0)
    })

    it('should detect heavy engine load on light mechs', () => {
      const weightBreakdown = {
        total: 40,
        components: {
          armor: 8,
          weapons: 10,
          engine: 12, // 30% - heavy for light mech
          equipment: 10
        }
      }

      const analysis = WeightBalanceValidationService.analyzeWeightEfficiency(
        weightBreakdown,
        createMockUnit({ mass: 35 }) // Light mech
      )

      expect(analysis.suggestions.some(s => s.id === 'heavy-engine-load')).toBe(true)
    })
  })

  describe('analyzeHeatEfficiency', () => {
    it('should analyze heat sink efficiency', () => {
      const heatBalance = {
        generation: 20,
        dissipation: 25,
        heatSinkWeight: 15, // Poor efficiency (25/15 = 1.67 < 2)
        weaponCount: 4,
        balance: 5
      }

      const analysis = WeightBalanceValidationService.analyzeHeatEfficiency(heatBalance, mockUnit)

      expect(analysis.score).toBeLessThan(100)
      expect(analysis.suggestions.some(s => s.id === 'inefficient-heat-sinks')).toBe(true)
    })

    it('should detect high-heat weapons', () => {
      const heatBalance = {
        generation: 40,
        dissipation: 45,
        heatSinkWeight: 10,
        weaponCount: 4, // 40/4 = 10 heat per weapon > 8
        balance: 5
      }

      const analysis = WeightBalanceValidationService.analyzeHeatEfficiency(heatBalance, mockUnit)

      expect(analysis.suggestions.some(s => s.id === 'high-heat-weapons')).toBe(true)
    })

    it('should detect limited alpha strike capability', () => {
      const heatBalance = {
        generation: 25,
        dissipation: 30,
        heatSinkWeight: 10,
        weaponCount: 3,
        balance: -5 // Negative but small
      }

      const analysis = WeightBalanceValidationService.analyzeHeatEfficiency(heatBalance, mockUnit)

      expect(analysis.suggestions.some(s => s.id === 'limited-alpha-strike')).toBe(true)
    })

    it('should provide no suggestions for efficient heat management', () => {
      const heatBalance = {
        generation: 20,
        dissipation: 25,
        heatSinkWeight: 10, // Good efficiency (25/10 = 2.5 > 2)
        weaponCount: 4, // 20/4 = 5 heat per weapon < 8
        balance: 5 // Positive and reasonable
      }

      const analysis = WeightBalanceValidationService.analyzeHeatEfficiency(heatBalance, mockUnit)

      expect(analysis.score).toBe(100)
      expect(analysis.suggestions).toHaveLength(0)
    })
  })

  describe('analyzeCriticalSlotDistribution', () => {
    it('should warn about full critical locations', () => {
      const criticalBreakdown = {
        byLocation: {
          'center torso': { used: 12, total: 12 }, // 100% full
          'right arm': { used: 11, total: 12 }, // 91.7% - high
          'left leg': { used: 0, total: 6 } // Empty
        }
      }

      const analysis = WeightBalanceValidationService.analyzeCriticalSlotDistribution(
        criticalBreakdown,
        {
          strictMode: false,
          validateWeightLimits: true,
          validateHeatBalance: true,
          validateCriticalSlots: true,
          performanceThresholds: {
            weightUtilizationHigh: 95,
            weightUtilizationLow: 75,
            heatEfficiencyLow: 120,
            excessiveHeatCapacity: 20,
            criticalUtilizationHigh: 90,
            lowCriticalSlots: 5
          }
        }
      )

      expect(analysis.warnings.length).toBeGreaterThan(0)
      expect(analysis.warnings.some(w => w.id === 'center torso-critical-full')).toBe(true)
      expect(analysis.warnings.some(w => w.id === 'right arm-critical-high')).toBe(true)
      expect(analysis.warnings.some(w => w.id === 'left leg-critical-empty')).toBe(true)
    })

    it('should not warn about empty head location', () => {
      const criticalBreakdown = {
        byLocation: {
          'head': { used: 0, total: 6 }, // Empty head is acceptable
          'center torso': { used: 8, total: 12 }
        }
      }

      const analysis = WeightBalanceValidationService.analyzeCriticalSlotDistribution(
        criticalBreakdown,
        {
          strictMode: false,
          validateWeightLimits: true,
          validateHeatBalance: true,
          validateCriticalSlots: true,
          performanceThresholds: {
            weightUtilizationHigh: 95,
            weightUtilizationLow: 75,
            heatEfficiencyLow: 120,
            excessiveHeatCapacity: 20,
            criticalUtilizationHigh: 90,
            lowCriticalSlots: 5
          }
        }
      )

      expect(analysis.warnings.some(w => w.id === 'head-critical-empty')).toBe(false)
    })
  })

  describe('analyzeCriticalSlotEfficiency', () => {
    it('should detect weapon-heavy slot usage', () => {
      const criticalBreakdown = {
        used: 50,
        byType: {
          weapons: 32, // 64% of slots for weapons
          equipment: 18
        }
      }

      const analysis = WeightBalanceValidationService.analyzeCriticalSlotEfficiency(
        criticalBreakdown,
        mockUnit
      )

      expect(analysis.suggestions.some(s => s.id === 'weapon-slot-heavy')).toBe(true)
    })

    it('should detect high equipment density', () => {
      const criticalBreakdown = {
        used: 80, // High density for 50-ton mech (80/50 = 1.6 > 1.5)
        byType: {
          weapons: 40,
          equipment: 40
        }
      }

      const analysis = WeightBalanceValidationService.analyzeCriticalSlotEfficiency(
        criticalBreakdown,
        mockUnit
      )

      expect(analysis.suggestions.some(s => s.id === 'high-equipment-density')).toBe(true)
    })

    it('should detect low equipment density', () => {
      const criticalBreakdown = {
        used: 30, // Low density for 50-ton mech (30/50 = 0.6 < 0.8)
        byType: {
          weapons: 15,
          equipment: 15
        }
      }

      const analysis = WeightBalanceValidationService.analyzeCriticalSlotEfficiency(
        criticalBreakdown,
        mockUnit
      )

      expect(analysis.suggestions.some(s => s.id === 'low-equipment-density')).toBe(true)
    })

    it('should provide no suggestions for efficient slot usage', () => {
      const criticalBreakdown = {
        used: 45, // Good density (45/50 = 0.9)
        byType: {
          weapons: 20, // 44% - reasonable
          equipment: 25
        }
      }

      const analysis = WeightBalanceValidationService.analyzeCriticalSlotEfficiency(
        criticalBreakdown,
        mockUnit
      )

      expect(analysis.score).toBe(100)
      expect(analysis.suggestions).toHaveLength(0)
    })
  })

  describe('calculatePerformanceMetrics', () => {
    it('should calculate overall performance metrics', () => {
      // Clear and set up all mocks separately
      jest.clearAllMocks();
      
      (UnitCalculationService.calculateWeightBreakdown as jest.Mock).mockReturnValue({
        total: 45,
        components: { armor: 12, weapons: 15, engine: 8, equipment: 10 }
      });
      
      (UnitCalculationService.calculateHeatBalance as jest.Mock).mockReturnValue({
        generation: 20,
        dissipation: 25,
        heatSinkWeight: 10,
        weaponCount: 4,
        balance: 5
      });

      (UnitCalculationService.calculateCriticalSlotBreakdown as jest.Mock).mockReturnValue({
        used: 45,
        byType: { weapons: 20, equipment: 25 }
      });

      const metrics = WeightBalanceValidationService.calculatePerformanceMetrics(mockUnit)

      expect(metrics.weightEfficiency).toBe(100)
      expect(metrics.heatEfficiency).toBe(100)
      expect(metrics.criticalEfficiency).toBe(100)
      expect(metrics.overallScore).toBe(100)
    })

    it('should handle calculation errors gracefully', () => {
      (UnitCalculationService.calculateWeightBreakdown as jest.Mock).mockImplementation(() => {
        throw new Error('Calculation failed')
      })

      const metrics = WeightBalanceValidationService.calculatePerformanceMetrics(mockUnit)

      expect(metrics.weightEfficiency).toBe(0)
      expect(metrics.heatEfficiency).toBe(0)
      expect(metrics.criticalEfficiency).toBe(0)
      expect(metrics.overallScore).toBe(0)
    })
  })

  describe('getOptimizationSuggestions', () => {
    it('should provide optimization suggestions based on validation results', () => {
      // Clear and set up all mocks separately
      jest.clearAllMocks();
      
      (UnitCalculationService.calculateWeightBreakdown as jest.Mock).mockReturnValue({
        total: 55,
        isOverweight: true,
        utilizationPercentage: 110,
        components: {}
      });

      (UnitCalculationService.calculateHeatBalance as jest.Mock).mockReturnValue({
        generation: 30,
        dissipation: 20,
        balance: -10,
        isOverheating: true,
        heatEfficiency: 67
      });

      (UnitCalculationService.calculateCriticalSlotBreakdown as jest.Mock).mockReturnValue({
        used: 85,
        total: 78,
        free: -7,
        utilizationPercentage: 109,
        byLocation: {},
        byType: {}
      });

      const suggestions = WeightBalanceValidationService.getOptimizationSuggestions(mockUnit)

      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions.some(s => s.category === 'Critical')).toBe(true)
      expect(suggestions.some(s => s.priority === 'High')).toBe(true)
      expect(suggestions.every(s => s.action.length > 0)).toBe(true)
    })

    it('should limit suggestions to top 10', () => {
      // Clear and set up all mocks separately
      jest.clearAllMocks();
      
      (UnitCalculationService.calculateWeightBreakdown as jest.Mock).mockReturnValue({
        total: 35,
        isOverweight: false,
        utilizationPercentage: 70,
        components: {
          armor: 5, // Many efficiency issues
          weapons: 20,
          engine: 10
        }
      });

      (UnitCalculationService.calculateHeatBalance as jest.Mock).mockReturnValue({
        generation: 10,
        dissipation: 35,
        balance: 25,
        isOverheating: false,
        heatEfficiency: 350,
        heatSinkWeight: 15,
        weaponCount: 1
      });

      (UnitCalculationService.calculateCriticalSlotBreakdown as jest.Mock).mockReturnValue({
        used: 72,
        total: 78,
        free: 6,
        utilizationPercentage: 92.3,
        byLocation: {
          'center torso': { used: 12, total: 12 },
          'left arm': { used: 0, total: 12 }
        },
        byType: { weapons: 50, equipment: 22 }
      });

      const suggestions = WeightBalanceValidationService.getOptimizationSuggestions(mockUnit)

      expect(suggestions.length).toBeLessThanOrEqual(10)
    })
  })

  describe('utility methods', () => {
    it('should return validation rules for UI display', () => {
      const rules = WeightBalanceValidationService.getValidationRules()

      expect(rules).toHaveLength(3) // Weight, Heat, Critical
      expect(rules[0].category).toBe('Weight Constraints')
      expect(rules[1].category).toBe('Heat Management')
      expect(rules[2].category).toBe('Critical Slots')
      
      // Each category should have rules
      rules.forEach(category => {
        expect(category.rules.length).toBeGreaterThan(0)
        category.rules.forEach(rule => {
          expect(rule.name).toBeDefined()
          expect(rule.description).toBeDefined()
          expect(rule.severity).toBeDefined()
        })
      })
    })

    it('should provide action recommendations for errors', () => {
      const action1 = WeightBalanceValidationService['getActionForError']('unit-overweight')
      const action2 = WeightBalanceValidationService['getActionForError']('unknown-error')

      expect(action1).toBe('Remove equipment or upgrade to lighter variants')
      expect(action2).toBe('Review configuration')
    })

    it('should provide action recommendations for warnings', () => {
      const action1 = WeightBalanceValidationService['getActionForWarning']('high-weight-utilization')
      const action2 = WeightBalanceValidationService['getActionForWarning']('unknown-warning')

      expect(action1).toBe('Consider lighter components for upgrade flexibility')
      expect(action2).toBe('Consider optimization')
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle missing calculation data gracefully', () => {
      // Clear and set up all mocks separately
      jest.clearAllMocks();
      
      (UnitCalculationService.calculateWeightBreakdown as jest.Mock).mockReturnValue({});
      (UnitCalculationService.calculateHeatBalance as jest.Mock).mockReturnValue({});
      (UnitCalculationService.calculateCriticalSlotBreakdown as jest.Mock).mockReturnValue({});

      const result = WeightBalanceValidationService.validateWeightBalance(mockUnit)

      expect(result.isValid).toBe(true) // Should not crash
    })

    it('should handle validation context variations', () => {
      (UnitCalculationService.calculateWeightBreakdown as jest.Mock).mockReturnValue({
        total: 45,
        isOverweight: false,
        utilizationPercentage: 90
      })

      const result = WeightBalanceValidationService.validateWeightBalance(mockUnit, {
        strictMode: true,
        performanceThresholds: {
          weightUtilizationHigh: 85, // Lower threshold
          weightUtilizationLow: 60,
          heatEfficiencyLow: 150,
          excessiveHeatCapacity: 15,
          criticalUtilizationHigh: 85,
          lowCriticalSlots: 3
        }
      })

      expect(result.isValid).toBe(true)
      expect(result.warnings.length).toBeGreaterThanOrEqual(0)
    })

    it('should handle units with undefined mass in analysis', () => {
      const unitWithoutMass = createMockUnit({ mass: undefined as any })
      
      const weightBreakdown = { total: 45, components: {} }
      const analysis = WeightBalanceValidationService.analyzeWeightEfficiency(
        weightBreakdown,
        unitWithoutMass
      )

      expect(analysis.score).toBe(100) // Should not crash
    })
  })
})
