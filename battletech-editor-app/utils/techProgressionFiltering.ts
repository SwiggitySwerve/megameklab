/**
 * Tech Progression Filtering - Filters component options based on tech progression settings
 * Connects Overview tab tech progression to Structure/Armor tab component availability
 */

import { TechProgression } from './techProgression'

/**
 * Component option mappings based on tech progression settings
 */

// Internal Structure options by tech base
export const getStructureOptions = (techBase: 'Inner Sphere' | 'Clan'): string[] => {
  if (techBase === 'Clan') {
    return ['Standard', 'Endo Steel (Clan)', 'Composite', 'Reinforced', 'Industrial']
  }
  return ['Standard', 'Endo Steel', 'Composite', 'Reinforced', 'Industrial']
}

// Gyro options by tech base  
export const getGyroOptions = (techBase: 'Inner Sphere' | 'Clan'): string[] => {
  if (techBase === 'Clan') {
    return ['Standard'] // Clan only gets standard gyro
  }
  return ['Standard', 'XL', 'Compact', 'Heavy-Duty']
}

// Engine options by tech base (same options, different tech ratings)
export const getEngineOptions = (techBase: 'Inner Sphere' | 'Clan'): string[] => {
  // Both tech bases have same engine types, but different characteristics
  return ['Standard', 'XL', 'Light', 'XXL', 'Compact', 'ICE', 'Fuel Cell']
}

// Heat sink options by tech base
export const getHeatSinkOptions = (techBase: 'Inner Sphere' | 'Clan'): string[] => {
  if (techBase === 'Clan') {
    return ['Single', 'Double (Clan)', 'Compact', 'Laser']
  }
  return ['Single', 'Double', 'Compact', 'Laser']
}

// Enhancement/Myomer options by tech base
export const getEnhancementOptions = (techBase: 'Inner Sphere' | 'Clan'): string[] => {
  if (techBase === 'Clan') {
    return ['None', 'MASC'] // Clan does not get Triple Strength Myomer
  }
  return ['None', 'MASC', 'Triple Strength Myomer']
}

// Armor options by tech base
export const getArmorOptions = (techBase: 'Inner Sphere' | 'Clan'): string[] => {
  if (techBase === 'Clan') {
    return ['Standard', 'Ferro-Fibrous (Clan)', 'Light Ferro-Fibrous', 'Heavy Ferro-Fibrous']
  }
  return ['Standard', 'Ferro-Fibrous', 'Light Ferro-Fibrous', 'Heavy Ferro-Fibrous']
}

// Jump jet options by tech base
export const getJumpJetOptions = (techBase: 'Inner Sphere' | 'Clan'): string[] => {
  // Both have same options but different weights/characteristics
  return ['Standard Jump Jet', 'Improved Jump Jet']
}

/**
 * Main filtering function - returns filtered options based on tech progression
 */
export interface FilteredComponentOptions {
  structure: string[]
  gyro: string[]
  engine: string[]
  heatSink: string[]
  enhancement: string[]
  armor: string[]
  jumpJet: string[]
}

export function getFilteredComponentOptions(techProgression: TechProgression): FilteredComponentOptions {
  return {
    structure: getStructureOptions(techProgression.chassis),
    gyro: getGyroOptions(techProgression.gyro),
    engine: getEngineOptions(techProgression.engine),
    heatSink: getHeatSinkOptions(techProgression.heatsink),
    enhancement: getEnhancementOptions(techProgression.myomer),
    armor: getArmorOptions(techProgression.armor),
    jumpJet: getJumpJetOptions(techProgression.movement)
  }
}

/**
 * Validate if a current selection is valid for the tech progression
 */
export function validateComponentSelection(
  techProgression: TechProgression,
  currentSelections: {
    structureType?: string
    gyroType?: string
    engineType?: string
    heatSinkType?: string
    enhancementType?: string | null
    armorType?: string
    jumpJetType?: string
  }
): {
  isValid: boolean
  invalidSelections: string[]
  suggestedReplacements: Record<string, string>
} {
  const filteredOptions = getFilteredComponentOptions(techProgression)
  const invalidSelections: string[] = []
  const suggestedReplacements: Record<string, string> = {}

  // Check each component type
  if (currentSelections.structureType && !filteredOptions.structure.includes(currentSelections.structureType)) {
    invalidSelections.push('structure')
    suggestedReplacements.structureType = 'Standard'
  }

  if (currentSelections.gyroType && !filteredOptions.gyro.includes(currentSelections.gyroType)) {
    invalidSelections.push('gyro')
    suggestedReplacements.gyroType = 'Standard'
  }

  if (currentSelections.engineType && !filteredOptions.engine.includes(currentSelections.engineType)) {
    invalidSelections.push('engine')
    suggestedReplacements.engineType = 'Standard'
  }

  if (currentSelections.heatSinkType && !filteredOptions.heatSink.includes(currentSelections.heatSinkType)) {
    invalidSelections.push('heatSink')
    suggestedReplacements.heatSinkType = 'Single'
  }

  if (currentSelections.enhancementType && currentSelections.enhancementType !== 'None' && 
      !filteredOptions.enhancement.includes(currentSelections.enhancementType)) {
    invalidSelections.push('enhancement')
    suggestedReplacements.enhancementType = 'None'
  }

  if (currentSelections.armorType && !filteredOptions.armor.includes(currentSelections.armorType)) {
    invalidSelections.push('armor')
    suggestedReplacements.armorType = 'Standard'
  }

  if (currentSelections.jumpJetType && !filteredOptions.jumpJet.includes(currentSelections.jumpJetType)) {
    invalidSelections.push('jumpJet')
    suggestedReplacements.jumpJetType = 'Standard Jump Jet'
  }

  return {
    isValid: invalidSelections.length === 0,
    invalidSelections,
    suggestedReplacements
  }
}

/**
 * Auto-correct component selections to match tech progression
 */
export function autoCorrectComponentSelections(
  techProgression: TechProgression,
  currentConfig: any
): any {
  const validation = validateComponentSelection(techProgression, {
    structureType: currentConfig.structureType,
    gyroType: currentConfig.gyroType,
    engineType: currentConfig.engineType,
    heatSinkType: currentConfig.heatSinkType,
    enhancementType: currentConfig.enhancementType,
    armorType: currentConfig.armorType,
    jumpJetType: currentConfig.jumpJetType
  })

  if (validation.isValid) {
    return currentConfig // No changes needed
  }

  // Apply suggested replacements
  const correctedConfig = { ...currentConfig }
  Object.entries(validation.suggestedReplacements).forEach(([key, value]) => {
    correctedConfig[key] = value
  })

  return correctedConfig
}

/**
 * Equipment filtering based on tech progression
 * Filters equipment in Equipment tab based on Tech/Targeting progression
 */
export function shouldShowEquipment(
  equipmentTechBase: 'IS' | 'Clan',
  equipmentBaseType: string,
  techProgression: TechProgression
): boolean {
  // Filter targeting computers based on Tech/Targeting progression
  if (equipmentBaseType === 'Targeting Computer') {
    const targetingTechBase = techProgression.targeting
    
    // Convert tech progression format to equipment format
    if (targetingTechBase === 'Inner Sphere' && equipmentTechBase === 'IS') return true
    if (targetingTechBase === 'Clan' && equipmentTechBase === 'Clan') return true
    
    return false
  }

  // For other equipment, check relevant tech progression categories
  // This can be expanded for other equipment types
  
  return true // Default: show all equipment
}

/**
 * Get tech progression category for a component type
 */
export function getTechProgressionCategory(componentType: string): keyof TechProgression | null {
  const categoryMap: Record<string, keyof TechProgression> = {
    'structure': 'chassis',
    'gyro': 'gyro',
    'engine': 'engine',
    'heatSink': 'heatsink',
    'enhancement': 'myomer',
    'armor': 'armor',
    'jumpJet': 'movement',
    'targeting': 'targeting'
  }

  return categoryMap[componentType] || null
}

/**
 * Format tech base for display (handles "Double (Clan)" vs "Double" formatting)
 */
export function formatTechBaseForDisplay(
  optionName: string,
  techBase: 'Inner Sphere' | 'Clan',
  componentType: string
): string {
  // Special case for heat sinks
  if (componentType === 'heatSink' && optionName === 'Double' && techBase === 'Inner Sphere') {
    return 'IS Double'
  }

  return optionName
}
