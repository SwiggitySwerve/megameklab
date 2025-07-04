/**
 * Tests for BasicInfoValidationService
 * 
 * Validates basic unit information validation logic and BattleTech rule compliance.
 */

import { BasicInfoValidationService } from '../../../utils/editor/BasicInfoValidationService'
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

describe('BasicInfoValidationService', () => {
  let mockUnit: EditableUnit

  beforeEach(() => {
    mockUnit = createMockUnit()
  })

  describe('validateBasicInfo', () => {
    it('should validate a properly configured unit', () => {
      const result = BasicInfoValidationService.validateBasicInfo(mockUnit)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0) // Era is provided, so no warnings
    })

    it('should handle units with no era (optional field)', () => {
      const unitWithoutEra = createMockUnit({ era: undefined })

      const result = BasicInfoValidationService.validateBasicInfo(unitWithoutEra)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].id).toBe('missing-era')
    })

    it('should detect missing required fields', () => {
      const invalidUnit = createMockUnit({
        chassis: '',
        model: '',
        mass: 0,
        tech_base: ''
      })

      const result = BasicInfoValidationService.validateBasicInfo(invalidUnit)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(4) // chassis, model, mass, tech_base
      expect(result.errors.some(e => e.id === 'missing-chassis')).toBe(true)
      expect(result.errors.some(e => e.id === 'missing-model')).toBe(true)
      expect(result.errors.some(e => e.id === 'invalid-mass')).toBe(true)
      expect(result.errors.some(e => e.id === 'missing-tech-base')).toBe(true)
    })

    it('should validate non-standard tonnage as warning', () => {
      const unit = { ...mockUnit, mass: 47 } // Not divisible by 5

      const result = BasicInfoValidationService.validateBasicInfo(unit)

      expect(result.isValid).toBe(true) // Warning, not error
      expect(result.warnings.some(w => w.id === 'invalid-tonnage-increment')).toBe(true)
    })

    it('should enforce standard tonnage in strict mode', () => {
      const unit = { ...mockUnit, mass: 47 }

      const result = BasicInfoValidationService.validateBasicInfo(unit, {
        strictMode: true,
        enforceStandardTonnage: true
      })

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.id === 'invalid-tonnage-increment')).toBe(true)
    })

    it('should disable optional field validation when requested', () => {
      const unitWithoutEra = createMockUnit({ era: undefined })

      const result = BasicInfoValidationService.validateBasicInfo(unitWithoutEra, {
        validateOptionalFields: false
      })

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(0) // Era warning disabled
    })
  })

  describe('validateChassisField', () => {
    it('should validate a proper chassis name', () => {
      const result = BasicInfoValidationService.validateChassisField('Atlas', {
        strictMode: false,
        validateOptionalFields: true,
        enforceStandardTonnage: false
      })

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject missing chassis', () => {
      const result = BasicInfoValidationService.validateChassisField('', {
        strictMode: false,
        validateOptionalFields: true,
        enforceStandardTonnage: false
      })

      expect(result.isValid).toBe(false)
      expect(result.error?.id).toBe('missing-chassis')
    })

    it('should reject too long chassis names', () => {
      const longName = 'A'.repeat(51) // Over 50 character limit

      const result = BasicInfoValidationService.validateChassisField(longName, {
        strictMode: false,
        validateOptionalFields: true,
        enforceStandardTonnage: false
      })

      expect(result.isValid).toBe(false)
      expect(result.error?.id).toBe('chassis-too-long')
    })

    it('should reject too short chassis names', () => {
      const result = BasicInfoValidationService.validateChassisField('A', {
        strictMode: false,
        validateOptionalFields: true,
        enforceStandardTonnage: false
      })

      expect(result.isValid).toBe(false)
      expect(result.error?.id).toBe('chassis-too-short')
    })

    it('should validate characters in strict mode', () => {
      const result = BasicInfoValidationService.validateChassisField('Atlas@#$', {
        strictMode: true,
        validateOptionalFields: true,
        enforceStandardTonnage: false
      })

      expect(result.isValid).toBe(false)
      expect(result.error?.id).toBe('chassis-invalid-characters')
      expect(result.suggestions).toBeDefined()
    })

    it('should allow valid characters in strict mode', () => {
      const result = BasicInfoValidationService.validateChassisField('Atlas-AS7_1D', {
        strictMode: true,
        validateOptionalFields: true,
        enforceStandardTonnage: false
      })

      expect(result.isValid).toBe(true)
    })
  })

  describe('validateModelField', () => {
    it('should validate a proper model designation', () => {
      const result = BasicInfoValidationService.validateModelField('AS7-D', {
        strictMode: false,
        validateOptionalFields: true,
        enforceStandardTonnage: false
      })

      expect(result.isValid).toBe(true)
    })

    it('should reject missing model', () => {
      const result = BasicInfoValidationService.validateModelField('', {
        strictMode: false,
        validateOptionalFields: true,
        enforceStandardTonnage: false
      })

      expect(result.isValid).toBe(false)
      expect(result.error?.id).toBe('missing-model')
    })

    it('should reject too long model designations', () => {
      const longModel = 'A'.repeat(31) // Over 30 character limit

      const result = BasicInfoValidationService.validateModelField(longModel, {
        strictMode: false,
        validateOptionalFields: true,
        enforceStandardTonnage: false
      })

      expect(result.isValid).toBe(false)
      expect(result.error?.id).toBe('model-too-long')
    })

    it('should validate characters in strict mode', () => {
      const result = BasicInfoValidationService.validateModelField('AS7@D', {
        strictMode: true,
        validateOptionalFields: true,
        enforceStandardTonnage: false
      })

      expect(result.isValid).toBe(false)
      expect(result.error?.id).toBe('model-invalid-characters')
    })
  })

  describe('validateMassField', () => {
    it('should validate standard BattleMech tonnages', () => {
      const standardTonnages = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]
      
      standardTonnages.forEach(mass => {
        const result = BasicInfoValidationService.validateMassField(mass, {
          strictMode: false,
          validateOptionalFields: true,
          enforceStandardTonnage: false
        })

        expect(result.isValid).toBe(true)
      })
    })

    it('should reject zero or negative mass', () => {
      const result = BasicInfoValidationService.validateMassField(0, {
        strictMode: false,
        validateOptionalFields: true,
        enforceStandardTonnage: false
      })

      expect(result.isValid).toBe(false)
      expect(result.error?.id).toBe('invalid-mass')
    })

    it('should reject excessively high mass', () => {
      const result = BasicInfoValidationService.validateMassField(250, {
        strictMode: false,
        validateOptionalFields: true,
        enforceStandardTonnage: false
      })

      expect(result.isValid).toBe(false)
      expect(result.error?.id).toBe('mass-too-high')
    })

    it('should provide suggestions for non-increment tonnages', () => {
      const result = BasicInfoValidationService.validateMassField(47, {
        strictMode: false,
        validateOptionalFields: true,
        enforceStandardTonnage: false
      })

      expect(result.isValid).toBe(true) // Warning mode
      expect(result.error?.category).toBe('warning')
      expect(result.suggestions).toBeDefined()
      expect(result.suggestions?.length).toBeGreaterThan(0)
    })

    it('should enforce standard tonnage when required', () => {
      const result = BasicInfoValidationService.validateMassField(47, {
        strictMode: false,
        validateOptionalFields: true,
        enforceStandardTonnage: true
      })

      expect(result.isValid).toBe(false)
      expect(result.error?.id).toBe('invalid-tonnage-increment')
    })
  })

  describe('validateMassRanges', () => {
    it('should warn about light mechs', () => {
      const warnings = BasicInfoValidationService.validateMassRanges(15, {
        strictMode: false,
        validateOptionalFields: true,
        enforceStandardTonnage: false
      })

      expect(warnings).toHaveLength(1)
      expect(warnings[0].id).toBe('light-tonnage')
    })

    it('should warn about heavy mechs', () => {
      const warnings = BasicInfoValidationService.validateMassRanges(110, {
        strictMode: false,
        validateOptionalFields: true,
        enforceStandardTonnage: false
      })

      expect(warnings).toHaveLength(1)
      expect(warnings[0].id).toBe('heavy-tonnage')
    })

    it('should not warn for standard range mechs', () => {
      const warnings = BasicInfoValidationService.validateMassRanges(50, {
        strictMode: false,
        validateOptionalFields: true,
        enforceStandardTonnage: false
      })

      expect(warnings).toHaveLength(0)
    })
  })

  describe('validateTechBaseField', () => {
    it('should validate all valid tech bases', () => {
      const validTechBases = ['Inner Sphere', 'Clan', 'Mixed (IS Chassis)', 'Mixed (Clan Chassis)']

      validTechBases.forEach(techBase => {
        const result = BasicInfoValidationService.validateTechBaseField(techBase, {
          strictMode: false,
          validateOptionalFields: true,
          enforceStandardTonnage: false
        })

        expect(result.isValid).toBe(true)
      })
    })

    it('should reject missing tech base', () => {
      const result = BasicInfoValidationService.validateTechBaseField('', {
        strictMode: false,
        validateOptionalFields: true,
        enforceStandardTonnage: false
      })

      expect(result.isValid).toBe(false)
      expect(result.error?.id).toBe('missing-tech-base')
    })

    it('should reject invalid tech base', () => {
      const result = BasicInfoValidationService.validateTechBaseField('Star League', {
        strictMode: false,
        validateOptionalFields: true,
        enforceStandardTonnage: false
      })

      expect(result.isValid).toBe(false)
      expect(result.error?.id).toBe('invalid-tech-base')
      expect(result.suggestions).toEqual(['Inner Sphere', 'Clan', 'Mixed (IS Chassis)', 'Mixed (Clan Chassis)'])
    })
  })

  describe('validateEraField', () => {
    it('should warn about missing era', () => {
      const warnings = BasicInfoValidationService.validateEraField('', {
        strictMode: false,
        validateOptionalFields: true,
        enforceStandardTonnage: false
      })

      expect(warnings).toHaveLength(1)
      expect(warnings[0].id).toBe('missing-era')
    })

    it('should not warn when era is provided', () => {
      const warnings = BasicInfoValidationService.validateEraField('3025', {
        strictMode: false,
        validateOptionalFields: true,
        enforceStandardTonnage: false
      })

      expect(warnings).toHaveLength(0)
    })
  })

  describe('validateUnitType', () => {
    it('should warn about missing unit type', () => {
      const warnings = BasicInfoValidationService.validateUnitType('', {
        strictMode: false,
        validateOptionalFields: true,
        enforceStandardTonnage: false
      })

      expect(warnings).toHaveLength(1)
      expect(warnings[0].id).toBe('missing-unit-type')
    })

    it('should not warn when unit type is provided', () => {
      const warnings = BasicInfoValidationService.validateUnitType('BattleMech', {
        strictMode: false,
        validateOptionalFields: true,
        enforceStandardTonnage: false
      })

      expect(warnings).toHaveLength(0)
    })
  })

  describe('getSuggestedTonnages', () => {
    it('should provide suggestions for odd tonnages', () => {
      const suggestions = BasicInfoValidationService.getSuggestedTonnages(47)

      expect(suggestions).toContain('45 tons')
      expect(suggestions).toContain('50 tons')
      expect(suggestions.length).toBeLessThanOrEqual(4)
    })

    it('should provide default suggestions for zero/invalid input', () => {
      const suggestions = BasicInfoValidationService.getSuggestedTonnages(0)

      expect(suggestions).toHaveLength(5)
      expect(suggestions[0]).toBe('20 tons')
    })

    it('should handle edge cases near limits', () => {
      const suggestions = BasicInfoValidationService.getSuggestedTonnages(97)

      expect(suggestions).toContain('95 tons')
      expect(suggestions).toContain('100 tons')
    })
  })

  describe('validateField', () => {
    it('should delegate chassis validation correctly', () => {
      const result = BasicInfoValidationService.validateField(mockUnit, 'chassis', 'Test Chassis')

      expect(result.isValid).toBe(true)
    })

    it('should delegate model validation correctly', () => {
      const result = BasicInfoValidationService.validateField(mockUnit, 'model', 'TST-1')

      expect(result.isValid).toBe(true)
    })

    it('should delegate mass validation correctly', () => {
      const result = BasicInfoValidationService.validateField(mockUnit, 'mass', 50)

      expect(result.isValid).toBe(true)
    })

    it('should delegate tech base validation correctly', () => {
      const result = BasicInfoValidationService.validateField(mockUnit, 'tech_base', 'Inner Sphere')

      expect(result.isValid).toBe(true)
    })

    it('should return valid for unknown fields', () => {
      const result = BasicInfoValidationService.validateField(mockUnit, 'unknown_field', 'value')

      expect(result.isValid).toBe(true)
    })
  })

  describe('utility methods', () => {
    it('should return validation rules for UI display', () => {
      const rules = BasicInfoValidationService.getValidationRules()

      expect(rules).toHaveLength(3) // Required, Naming, BattleTech categories
      expect(rules[0].category).toBe('Required Information')
      expect(rules[1].category).toBe('Naming Conventions')
      expect(rules[2].category).toBe('BattleTech Standards')
    })

    it('should return standard tonnages', () => {
      const tonnages = BasicInfoValidationService.getStandardTonnages()

      expect(tonnages).toContain(20)
      expect(tonnages).toContain(50)
      expect(tonnages).toContain(100)
      expect(tonnages).toHaveLength(17) // 20-100 in 5-ton increments
    })

    it('should return valid tech bases', () => {
      const techBases = BasicInfoValidationService.getValidTechBases()

      expect(techBases).toContain('Inner Sphere')
      expect(techBases).toContain('Clan')
      expect(techBases).toHaveLength(4)
    })

    it('should check if tonnage is standard', () => {
      expect(BasicInfoValidationService.isStandardTonnage(50)).toBe(true)
      expect(BasicInfoValidationService.isStandardTonnage(47)).toBe(false)
    })

    it('should check if tech base is valid', () => {
      expect(BasicInfoValidationService.isValidTechBase('Inner Sphere')).toBe(true)
      expect(BasicInfoValidationService.isValidTechBase('Star League')).toBe(false)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle undefined values gracefully', () => {
      const unit = createMockUnit({
        chassis: undefined as any,
        model: undefined as any,
        mass: undefined as any,
        tech_base: undefined as any
      })

      const result = BasicInfoValidationService.validateBasicInfo(unit)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should handle null values gracefully', () => {
      const unit = createMockUnit({
        chassis: null as any,
        model: null as any,
        mass: null as any,
        tech_base: null as any
      })

      const result = BasicInfoValidationService.validateBasicInfo(unit)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should handle whitespace-only values', () => {
      const unit = createMockUnit({
        chassis: '   ',
        model: '\t\n',
        mass: 50,
        tech_base: '  '
      })

      const result = BasicInfoValidationService.validateBasicInfo(unit)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.id === 'missing-chassis')).toBe(true)
      expect(result.errors.some(e => e.id === 'missing-model')).toBe(true)
      expect(result.errors.some(e => e.id === 'missing-tech-base')).toBe(true)
    })
  })

  describe('context validation and configuration', () => {
    it('should respect strict mode settings', () => {
      const unit = createMockUnit({ chassis: 'Test@Chassis' })

      const normalResult = BasicInfoValidationService.validateBasicInfo(unit, {
        strictMode: false
      })

      const strictResult = BasicInfoValidationService.validateBasicInfo(unit, {
        strictMode: true
      })

      expect(normalResult.isValid).toBe(true) // No character validation
      expect(strictResult.isValid).toBe(false) // Character validation enabled
    })

    it('should respect optional field validation settings', () => {
      const unitWithoutEra = createMockUnit({ era: undefined })

      const withOptional = BasicInfoValidationService.validateBasicInfo(unitWithoutEra, {
        validateOptionalFields: true
      })

      const withoutOptional = BasicInfoValidationService.validateBasicInfo(unitWithoutEra, {
        validateOptionalFields: false
      })

      expect(withOptional.warnings.length).toBeGreaterThan(0)
      expect(withoutOptional.warnings.length).toBe(0)
    })

    it('should respect standard tonnage enforcement', () => {
      const unit = createMockUnit({ mass: 47 }) // Non-standard

      const normalResult = BasicInfoValidationService.validateBasicInfo(unit, {
        enforceStandardTonnage: false
      })

      const strictTonnageResult = BasicInfoValidationService.validateBasicInfo(unit, {
        enforceStandardTonnage: true
      })

      expect(normalResult.isValid).toBe(true) // Warning only
      expect(strictTonnageResult.isValid).toBe(false) // Error
    })
  })
})
