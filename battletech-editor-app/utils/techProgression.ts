/**
 * Tech Progression System - Handles BattleTech technology progression analysis
 * Infers granular tech progression from unit data and manages tech base transitions
 */

export interface TechProgression {
  chassis: 'Inner Sphere' | 'Clan'
  gyro: 'Inner Sphere' | 'Clan'
  engine: 'Inner Sphere' | 'Clan'
  heatsink: 'Inner Sphere' | 'Clan'
  targeting: 'Inner Sphere' | 'Clan'
  myomer: 'Inner Sphere' | 'Clan'
  movement: 'Inner Sphere' | 'Clan'
  armor: 'Inner Sphere' | 'Clan'
}

export interface TechRating {
  era2100_2800: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'X'
  era2801_3050: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'X'
  era3051_3082: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'X'
  era3083_Now: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'X'
}

/**
 * Component detection patterns for tech base inference
 */
const TECH_PATTERNS = {
  engine: {
    clan: ['clan', 'ultra', 'pulse', 'er '],
    innerSphere: ['inner sphere', 'is ', 'standard', 'light', 'xl engine', 'compact']
  },
  heatsink: {
    clan: ['double heat sink (clan)', 'clan double', 'compact heat sink (clan)'],
    innerSphere: ['single heat sink', 'double heat sink (is)', 'double heat sink', 'compact heat sink']
  },
  armor: {
    clan: ['ferro-fibrous (clan)', 'clan ferro', 'stealth (clan)'],
    innerSphere: ['ferro-fibrous', 'light ferro', 'heavy ferro', 'stealth armor', 'reactive', 'reflective']
  },
  structure: {
    clan: ['endo steel (clan)', 'clan endo'],
    innerSphere: ['endo steel', 'composite', 'reinforced']
  },
  targeting: {
    clan: ['clan', 'artemis iv (clan)', 'targeting computer (clan)'],
    innerSphere: ['artemis iv', 'targeting computer', 'advanced fire control']
  },
  myomer: {
    clan: ['clan', 'triple strength myomer (clan)'],
    innerSphere: ['standard', 'triple strength myomer', 'masc']
  },
  weapons: {
    clan: ['clan', 'ultra', 'lb ', 'er ', 'pulse', 'streak', 'lrm (clan)', 'srm (clan)'],
    innerSphere: ['ac/', 'lrm', 'srm', 'ppc', 'large laser', 'medium laser', 'small laser', 'machine gun']
  }
}

/**
 * Infer tech progression from unit data
 */
export function inferTechProgression(unitData: any): TechProgression {
  console.log('[TechProgression] Inferring tech progression from unit data:', {
    chassis: unitData.chassis,
    techBase: unitData.tech_base,
    era: unitData.era
  })

  // Start with base tech from unit's primary tech base
  const baseTech = extractBaseTech(unitData.tech_base)
  console.log('[TechProgression] Base tech extracted:', baseTech)

  let progression: TechProgression = {
    chassis: baseTech,
    gyro: baseTech,
    engine: baseTech,
    heatsink: baseTech,
    targeting: baseTech,
    myomer: baseTech,
    movement: baseTech,
    armor: baseTech
  }

  // Analyze specific components to detect mixed tech patterns
  if (unitData.engine?.type) {
    progression.engine = inferComponentTech('engine', unitData.engine.type, baseTech)
  }

  if (unitData.structure?.type) {
    progression.chassis = inferComponentTech('structure', unitData.structure.type, baseTech)
  }

  if (unitData.armor?.type) {
    progression.armor = inferComponentTech('armor', unitData.armor.type, baseTech)
  }

  if (unitData.heat_sinks?.type) {
    progression.heatsink = inferComponentTech('heatsink', unitData.heat_sinks.type, baseTech)
  }

  if (unitData.myomer?.type) {
    progression.myomer = inferComponentTech('myomer', unitData.myomer.type, baseTech)
  }

  // Analyze weapons and equipment for mixed tech indicators
  if (unitData.weapons_and_equipment) {
    const mixedTechAnalysis = analyzeMixedTechPattern(unitData.weapons_and_equipment)
    Object.assign(progression, mixedTechAnalysis)
  }

  // Special case: Mixed tech base override
  if (unitData.tech_base.includes('Mixed')) {
    progression = analyzeMixedTechBase(unitData, progression)
  }

  console.log('[TechProgression] Final inferred progression:', progression)
  return progression
}

/**
 * Extract base tech from unit tech_base field
 */
export function extractBaseTech(techBase: string): 'Inner Sphere' | 'Clan' {
  if (techBase.includes('Clan')) {
    return 'Clan'
  }
  return 'Inner Sphere'
}

/**
 * Infer component tech base from component name/type
 */
function inferComponentTech(
  componentType: keyof typeof TECH_PATTERNS,
  componentName: string,
  fallback: 'Inner Sphere' | 'Clan'
): 'Inner Sphere' | 'Clan' {
  const name = componentName.toLowerCase()
  const patterns = TECH_PATTERNS[componentType]

  if (!patterns) {
    return fallback
  }

  // Check Clan patterns first (usually more specific)
  for (const pattern of patterns.clan) {
    if (name.includes(pattern.toLowerCase())) {
      return 'Clan'
    }
  }

  // Check Inner Sphere patterns
  for (const pattern of patterns.innerSphere) {
    if (name.includes(pattern.toLowerCase())) {
      return 'Inner Sphere'
    }
  }

  return fallback
}

/**
 * Analyze equipment list for mixed tech patterns
 */
export function analyzeMixedTechPattern(equipmentList: any[]): Partial<TechProgression> {
  const analysis: Partial<TechProgression> = {}

  equipmentList.forEach(equipment => {
    const name = equipment.item_name?.toLowerCase() || ''
    const techBase = equipment.tech_base

    // Direct tech_base field takes precedence
    if (techBase === 'Clan' || techBase === 'IS') {
      const targetTech = techBase === 'Clan' ? 'Clan' : 'Inner Sphere'

      // Categorize equipment into subsystems
      if (name.includes('heat sink')) {
        analysis.heatsink = targetTech
      } else if (name.includes('targeting') || name.includes('artemis') || name.includes('narc')) {
        analysis.targeting = targetTech
      } else if (name.includes('masc') || name.includes('myomer')) {
        analysis.myomer = targetTech
      } else if (name.includes('jump') || name.includes('booster')) {
        analysis.movement = targetTech
      }
    }

    // Pattern-based analysis for components without explicit tech_base
    for (const [componentType, patterns] of Object.entries(TECH_PATTERNS)) {
      const clanMatch = patterns.clan.some(pattern => name.includes(pattern.toLowerCase()))
      const isMatch = patterns.innerSphere.some(pattern => name.includes(pattern.toLowerCase()))

      if (clanMatch) {
        const subsystem = mapComponentToSubsystem(componentType)
        if (subsystem) {
          analysis[subsystem] = 'Clan'
        }
      } else if (isMatch) {
        const subsystem = mapComponentToSubsystem(componentType)
        if (subsystem) {
          analysis[subsystem] = 'Inner Sphere'
        }
      }
    }
  })

  return analysis
}

/**
 * Map component type to tech progression subsystem
 */
function mapComponentToSubsystem(componentType: string): keyof TechProgression | null {
  const mapping: Record<string, keyof TechProgression> = {
    'engine': 'engine',
    'heatsink': 'heatsink',
    'armor': 'armor',
    'structure': 'chassis',
    'targeting': 'targeting',
    'weapons': 'targeting' // Weapons often indicate targeting tech
  }

  return mapping[componentType] || null
}

/**
 * Analyze mixed tech base units for more nuanced tech progression
 */
function analyzeMixedTechBase(unitData: any, basePro: TechProgression): TechProgression {
  const progression = { ...basePro }

  // Mixed (IS Chassis) - Chassis is IS, but other tech can be Clan
  if (unitData.tech_base === 'Mixed (IS Chassis)') {
    progression.chassis = 'Inner Sphere'
    // Other subsystems may be Clan based on equipment analysis
  }

  // Mixed (Clan Chassis) - Chassis is Clan, but other tech can be IS
  if (unitData.tech_base === 'Mixed (Clan Chassis)') {
    progression.chassis = 'Clan'
    // Other subsystems may be IS based on equipment analysis
  }

  return progression
}

/**
 * Update tech progression with user changes
 */
export function updateTechProgression(
  current: TechProgression,
  subsystem: keyof TechProgression,
  newTech: 'Inner Sphere' | 'Clan'
): TechProgression {
  const updated = { ...current, [subsystem]: newTech }

  // Handle cascading updates for related subsystems
  if (subsystem === 'chassis') {
    // Chassis change might influence structure
    // Keep user's explicit choices, but default new subsystems to chassis tech
  }

  return updated
}

/**
 * Check if unit uses mixed technology
 */
export function isMixedTech(progression: TechProgression): boolean {
  const values = Object.values(progression)
  const innerSphereCount = values.filter(v => v === 'Inner Sphere').length
  const clanCount = values.filter(v => v === 'Clan').length

  return innerSphereCount > 0 && clanCount > 0
}

/**
 * Get primary tech base from progression
 */
export function getPrimaryTechBase(progression: TechProgression): 'Inner Sphere' | 'Clan' | 'Mixed' {
  if (!isMixedTech(progression)) {
    return progression.chassis // Use chassis as primary indicator
  }

  const values = Object.values(progression)
  const innerSphereCount = values.filter(v => v === 'Inner Sphere').length
  const clanCount = values.filter(v => v === 'Clan').length

  if (innerSphereCount > clanCount) {
    return 'Inner Sphere'
  } else if (clanCount > innerSphereCount) {
    return 'Clan'
  }

  return 'Mixed'
}

/**
 * Generate tech base string for compatibility with existing system
 */
export function generateTechBaseString(progression: TechProgression): string {
  if (!isMixedTech(progression)) {
    return progression.chassis
  }

  // For mixed tech, use chassis to determine primary
  if (progression.chassis === 'Clan') {
    return 'Mixed (Clan Chassis)'
  } else {
    return 'Mixed (IS Chassis)'
  }
}

/**
 * Create default tech progression for new units
 */
export function createDefaultTechProgression(techBase: 'Inner Sphere' | 'Clan' = 'Inner Sphere'): TechProgression {
  return {
    chassis: techBase,
    gyro: techBase,
    engine: techBase,
    heatsink: techBase,
    targeting: techBase,
    myomer: techBase,
    movement: techBase,
    armor: techBase
  }
}

/**
 * Validate tech progression for logical consistency
 */
export function validateTechProgression(progression: TechProgression): {
  isValid: boolean
  warnings: string[]
  errors: string[]
} {
  const warnings: string[] = []
  const errors: string[] = []

  // Check for unusual combinations
  if (progression.chassis === 'Inner Sphere' && progression.engine === 'Clan') {
    warnings.push('Inner Sphere chassis with Clan engine is uncommon')
  }

  if (progression.heatsink === 'Clan' && progression.engine === 'Inner Sphere') {
    warnings.push('Clan heat sinks with Inner Sphere engine may not be optimal')
  }

  // No hard errors currently - BattleTech allows mixed tech
  return {
    isValid: errors.length === 0,
    warnings,
    errors
  }
}
