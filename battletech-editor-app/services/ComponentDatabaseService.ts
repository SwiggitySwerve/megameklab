/**
 * Component Database Service Implementation
 * Provides comprehensive component data with proper slot calculations and validation
 */

import {
  ComponentDatabase,
  ComponentSelectionService,
  ComponentVariantUnion,
  EngineVariant,
  GyroVariant,
  StructureVariant,
  ArmorVariant,
  HeatSinkVariant,
  JumpJetVariant,
  EnhancementVariant,
  ComponentCategory,
  TechBase,
  UnitType
} from '../types/core/ComponentDatabase'
import {
  EngineType,
  GyroType,
  StructureType,
  ArmorType,
  HeatSinkType
} from '../types/systemComponents'
import { ENGINE_SLOT_REQUIREMENTS } from '../utils/engineCalculations'
import { GYRO_SLOT_REQUIREMENTS } from '../utils/gyroCalculations'
import { ComponentPlacementService } from './ComponentPlacementService'

// Engine data with proper slot allocations
const ENGINE_DATA: EngineVariant[] = [
  {
    id: 'standard_fusion_engine',
    name: 'Standard Fusion Engine',
    type: 'engine',
    techBase: 'Inner Sphere',
    introductionYear: 2025,
    rulesLevel: 'Introductory',
    cost: 5000,
    battleValue: 0,
    availability: ['Inner Sphere', 'Clan'],
    rating: 0, // Calculated dynamically
    weight: 0, // Calculated dynamically
    criticalSlots: {
      centerTorso: [0, 1, 2, 3, 4, 5], // 6 slots in CT
      leftTorso: [],
      rightTorso: []
    },
    heatDissipation: 10,
    fuelType: 'Fusion',
    features: ['Standard']
  },
  {
    id: 'xl_fusion_engine',
    name: 'XL Fusion Engine',
    type: 'engine',
    techBase: 'Inner Sphere',
    introductionYear: 2750,
    rulesLevel: 'Standard',
    cost: 10000,
    battleValue: 0,
    availability: ['Inner Sphere'],
    rating: 0,
    weight: 0,
    criticalSlots: {
      centerTorso: [0, 1, 2, 3, 4, 5], // 6 slots in CT
      leftTorso: [0, 1, 2], // 3 slots in LT
      rightTorso: [0, 1, 2] // 3 slots in RT
    },
    heatDissipation: 10,
    fuelType: 'Fusion',
    features: ['XL']
  },
  {
    id: 'light_fusion_engine',
    name: 'Light Fusion Engine',
    type: 'engine',
    techBase: 'Inner Sphere',
    introductionYear: 3057,
    rulesLevel: 'Advanced',
    cost: 15000,
    battleValue: 0,
    availability: ['Inner Sphere'],
    rating: 0,
    weight: 0,
    criticalSlots: {
      centerTorso: [0, 1, 2, 3, 4, 5], // 6 slots in CT
      leftTorso: [0, 1], // 2 slots in LT
      rightTorso: [0, 1] // 2 slots in RT
    },
    heatDissipation: 10,
    fuelType: 'Fusion',
    features: ['Light']
  },
  {
    id: 'xxl_fusion_engine',
    name: 'XXL Fusion Engine',
    type: 'engine',
    techBase: 'Inner Sphere',
    introductionYear: 3067,
    rulesLevel: 'Experimental',
    cost: 25000,
    battleValue: 0,
    availability: ['Inner Sphere'],
    rating: 0,
    weight: 0,
    criticalSlots: {
      centerTorso: [0, 1, 2, 3, 4, 5], // 6 slots in CT
      leftTorso: [0, 1, 2, 3, 4, 5], // 6 slots in LT
      rightTorso: [0, 1, 2, 3, 4, 5] // 6 slots in RT
    },
    heatDissipation: 10,
    fuelType: 'Fusion',
    features: ['XXL']
  },
  {
    id: 'compact_fusion_engine',
    name: 'Compact Fusion Engine',
    type: 'engine',
    techBase: 'Inner Sphere',
    introductionYear: 3050,
    rulesLevel: 'Advanced',
    cost: 12000,
    battleValue: 0,
    availability: ['Inner Sphere'],
    rating: 0,
    weight: 0,
    criticalSlots: {
      centerTorso: [0, 1, 2], // 3 slots in CT only
      leftTorso: [],
      rightTorso: []
    },
    heatDissipation: 10,
    fuelType: 'Fusion',
    features: ['Compact']
  }
]

// Gyro data
const GYRO_DATA: GyroVariant[] = [
  {
    id: 'standard_gyro',
    name: 'Standard Gyro',
    type: 'gyro',
    techBase: 'Inner Sphere',
    introductionYear: 2025,
    rulesLevel: 'Introductory',
    cost: 900,
    battleValue: 0,
    availability: ['Inner Sphere', 'Clan'],
    weight: 0, // Calculated dynamically
    criticalSlots: {
      centerTorso: [3, 4, 5, 6] // 4 slots in CT
    },
    features: ['Standard']
  },
  {
    id: 'xl_gyro',
    name: 'XL Gyro',
    type: 'gyro',
    techBase: 'Inner Sphere',
    introductionYear: 2750,
    rulesLevel: 'Standard',
    cost: 1500,
    battleValue: 0,
    availability: ['Inner Sphere'],
    weight: 0,
    criticalSlots: {
      centerTorso: [3, 4, 5, 6, 7, 8] // 6 slots in CT
    },
    features: ['XL']
  },
  {
    id: 'compact_gyro',
    name: 'Compact Gyro',
    type: 'gyro',
    techBase: 'Inner Sphere',
    introductionYear: 3050,
    rulesLevel: 'Advanced',
    cost: 1200,
    battleValue: 0,
    availability: ['Inner Sphere'],
    weight: 0,
    criticalSlots: {
      centerTorso: [3, 4] // 2 slots in CT
    },
    features: ['Compact']
  },
  {
    id: 'heavy_duty_gyro',
    name: 'Heavy-Duty Gyro',
    type: 'gyro',
    techBase: 'Inner Sphere',
    introductionYear: 3050,
    rulesLevel: 'Advanced',
    cost: 1000,
    battleValue: 0,
    availability: ['Inner Sphere'],
    weight: 0,
    criticalSlots: {
      centerTorso: [3, 4, 5, 6] // 4 slots in CT
    },
    features: ['Heavy-Duty']
  }
]

// Structure data
const STRUCTURE_DATA: StructureVariant[] = [
  {
    id: 'standard_structure',
    name: 'Standard Structure',
    type: 'structure',
    techBase: 'Inner Sphere',
    introductionYear: 2025,
    rulesLevel: 'Introductory',
    cost: 0,
    battleValue: 0,
    availability: ['Inner Sphere', 'Clan'],
    weight: 0,
    criticalSlots: {
      centerTorso: [],
      leftTorso: [],
      rightTorso: [],
      leftArm: [],
      rightArm: [],
      leftLeg: [],
      rightLeg: []
    },
    features: ['Standard'],
    internalStructurePoints: 1
  },
  {
    id: 'endo_steel_structure',
    name: 'Endo Steel Structure',
    type: 'structure',
    techBase: 'Inner Sphere',
    introductionYear: 2750,
    rulesLevel: 'Standard',
    cost: 1600,
    battleValue: 0,
    availability: ['Inner Sphere'],
    weight: 0,
    criticalSlots: {
      centerTorso: [],
      leftTorso: [],
      rightTorso: [],
      leftArm: [],
      rightArm: [],
      leftLeg: [],
      rightLeg: []
    },
    features: ['Endo Steel'],
    internalStructurePoints: 1,
    placementType: 'dynamic',
    totalSlots: 14
  },
  {
    id: 'endo_steel_clan_structure',
    name: 'Endo Steel (Clan)',
    type: 'structure',
    techBase: 'Clan',
    introductionYear: 2750,
    rulesLevel: 'Standard',
    cost: 1600,
    battleValue: 0,
    availability: ['Clan'],
    weight: 0,
    criticalSlots: {
      centerTorso: [],
      leftTorso: [],
      rightTorso: [],
      leftArm: [],
      rightArm: [],
      leftLeg: [],
      rightLeg: []
    },
    features: ['Endo Steel', 'Clan'],
    internalStructurePoints: 1,
    placementType: 'dynamic',
    totalSlots: 7
  }
]

// Armor data
const ARMOR_DATA: ArmorVariant[] = [
  {
    id: 'standard_armor',
    name: 'Standard Armor',
    type: 'armor',
    techBase: 'Inner Sphere',
    introductionYear: 2025,
    rulesLevel: 'Introductory',
    cost: 0,
    battleValue: 0,
    availability: ['Inner Sphere', 'Clan'],
    weight: 0,
    criticalSlots: {
      centerTorso: [],
      leftTorso: [],
      rightTorso: [],
      leftArm: [],
      rightArm: [],
      leftLeg: [],
      rightLeg: []
    },
    features: ['Standard'],
    armorPointsPerTon: 16,
    maxArmorPoints: 0 // Calculated dynamically
  },
  {
    id: 'ferro_fibrous_armor',
    name: 'Ferro-Fibrous Armor',
    type: 'armor',
    techBase: 'Inner Sphere',
    introductionYear: 2750,
    rulesLevel: 'Standard',
    cost: 20000,
    battleValue: 0,
    availability: ['Inner Sphere'],
    weight: 0,
    criticalSlots: {
      centerTorso: [],
      leftTorso: [],
      rightTorso: [],
      leftArm: [],
      rightArm: [],
      leftLeg: [],
      rightLeg: []
    },
    features: ['Ferro-Fibrous'],
    armorPointsPerTon: 16,
    maxArmorPoints: 0,
    placementType: 'dynamic',
    totalSlots: 14
  },
  {
    id: 'ferro_fibrous_clan_armor',
    name: 'Ferro-Fibrous (Clan)',
    type: 'armor',
    techBase: 'Clan',
    introductionYear: 2750,
    rulesLevel: 'Standard',
    cost: 20000,
    battleValue: 0,
    availability: ['Clan'],
    weight: 0,
    criticalSlots: {
      centerTorso: [],
      leftTorso: [],
      rightTorso: [],
      leftArm: [],
      rightArm: [],
      leftLeg: [],
      rightLeg: []
    },
    features: ['Ferro-Fibrous', 'Clan'],
    armorPointsPerTon: 16,
    maxArmorPoints: 0,
    placementType: 'dynamic',
    totalSlots: 7
  }
]

// Heat sink data
const HEATSINK_DATA: HeatSinkVariant[] = [
  {
    id: 'single_heat_sink',
    name: 'Single Heat Sink',
    type: 'heatSink',
    techBase: 'Inner Sphere',
    introductionYear: 2025,
    rulesLevel: 'Introductory',
    cost: 2000,
    battleValue: 0,
    availability: ['Inner Sphere', 'Clan'],
    weight: 1,
    criticalSlots: 1,
    heatDissipation: 1,
    features: ['Single'],
    allowedLocations: ['Center Torso', 'Left Torso', 'Right Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg']
  },
  {
    id: 'double_heat_sink',
    name: 'Double Heat Sink',
    type: 'heatSink',
    techBase: 'Inner Sphere',
    introductionYear: 2750,
    rulesLevel: 'Standard',
    cost: 6000,
    battleValue: 0,
    availability: ['Inner Sphere', 'Clan'],
    weight: 1,
    criticalSlots: 3,
    heatDissipation: 2,
    features: ['Double'],
    allowedLocations: ['Center Torso', 'Left Torso', 'Right Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg']
  }
]

// Jump jet data
const JUMPJET_DATA: JumpJetVariant[] = [
  {
    id: 'standard_jump_jet',
    name: 'Standard Jump Jet',
    type: 'jumpJet',
    techBase: 'Inner Sphere',
    introductionYear: 2025,
    rulesLevel: 'Introductory',
    cost: 200,
    battleValue: 0,
    availability: ['Inner Sphere', 'Clan'],
    weight: 0, // Calculated dynamically
    criticalSlots: 1,
    jumpMP: 1,
    features: ['Standard'],
    allowedLocations: ['Center Torso', 'Left Torso', 'Right Torso', 'Left Leg', 'Right Leg']
  },
  {
    id: 'improved_jump_jet',
    name: 'Improved Jump Jet',
    type: 'jumpJet',
    techBase: 'Inner Sphere',
    introductionYear: 3050,
    rulesLevel: 'Advanced',
    cost: 400,
    battleValue: 0,
    availability: ['Inner Sphere'],
    weight: 0,
    criticalSlots: 1,
    jumpMP: 1,
    features: ['Improved'],
    allowedLocations: ['Center Torso', 'Left Torso', 'Right Torso', 'Left Leg', 'Right Leg']
  }
]

export class ComponentDatabaseService implements ComponentDatabase, ComponentSelectionService {
  private static instance: ComponentDatabaseService

  private constructor() {}

  static getInstance(): ComponentDatabaseService {
    if (!ComponentDatabaseService.instance) {
      ComponentDatabaseService.instance = new ComponentDatabaseService()
    }
    return ComponentDatabaseService.instance
  }

  // ComponentDatabase implementation
  getComponents(
    category: ComponentCategory,
    filters: {
      techBase?: TechBase
      unitType?: UnitType
      rulesLevel?: string
      introductionYear?: number
    }
  ): ComponentVariantUnion[] {
    let components: ComponentVariantUnion[] = []

    switch (category) {
      case 'engine':
        components = ENGINE_DATA
        break
      case 'gyro':
        components = GYRO_DATA
        break
      case 'structure':
        components = STRUCTURE_DATA
        break
      case 'armor':
        components = ARMOR_DATA
        break
      case 'heatSink':
        components = HEATSINK_DATA
        break
      case 'jumpJet':
        components = JUMPJET_DATA
        break
      case 'enhancement':
        components = []
        break
    }

    // Apply filters
    if (filters.techBase) {
      components = components.filter(c => c.techBase === filters.techBase)
    }
    if (filters.rulesLevel) {
      components = components.filter(c => c.rulesLevel === filters.rulesLevel)
    }
    if (filters.introductionYear) {
      components = components.filter(c => c.introductionYear <= filters.introductionYear!)
    }

    return components
  }

  getComponentById(id: string): ComponentVariantUnion | null {
    const allComponents = [
      ...ENGINE_DATA,
      ...GYRO_DATA,
      ...STRUCTURE_DATA,
      ...ARMOR_DATA,
      ...HEATSINK_DATA,
      ...JUMPJET_DATA
    ]
    return allComponents.find(c => c.id === id) || null
  }

  // Specialized query methods
  getEngines(filters: { techBase?: TechBase; rulesLevel?: string }): EngineVariant[] {
    return this.getComponents('engine', filters) as EngineVariant[]
  }

  getGyros(filters: { techBase?: TechBase; rulesLevel?: string }): GyroVariant[] {
    return this.getComponents('gyro', filters) as GyroVariant[]
  }

  getStructures(filters: { techBase?: TechBase; rulesLevel?: string }): StructureVariant[] {
    return this.getComponents('structure', filters) as StructureVariant[]
  }

  getArmors(filters: { techBase?: TechBase; rulesLevel?: string }): ArmorVariant[] {
    return this.getComponents('armor', filters) as ArmorVariant[]
  }

  getHeatSinks(filters: { techBase?: TechBase; rulesLevel?: string }): HeatSinkVariant[] {
    return this.getComponents('heatSink', filters) as HeatSinkVariant[]
  }

  getJumpJets(filters: { techBase?: TechBase; rulesLevel?: string }): JumpJetVariant[] {
    return this.getComponents('jumpJet', filters) as JumpJetVariant[]
  }

  getEnhancements(filters: { techBase?: TechBase; rulesLevel?: string }): EnhancementVariant[] {
    return this.getComponents('enhancement', filters) as EnhancementVariant[]
  }

  // Calculation methods
  calculateEngineWeight(engineType: string, rating: number): number {
    const engine = ENGINE_DATA.find(e => e.id === engineType)
    if (!engine) return 0

    // Standard BattleTech engine weight calculation
    const baseWeight = rating / 75
    const multiplier = engine.features.includes('XL') ? 0.5 : 
                      engine.features.includes('Light') ? 0.75 :
                      engine.features.includes('XXL') ? 0.25 :
                      engine.features.includes('Compact') ? 1.5 : 1.0

    return Math.ceil(baseWeight * multiplier)
  }

  calculateGyroWeight(gyroType: string, engineRating: number): number {
    const gyro = GYRO_DATA.find(g => g.id === gyroType)
    if (!gyro) return 0

    // Standard BattleTech gyro weight calculation
    const baseWeight = Math.ceil(engineRating / 100)
    const multiplier = gyro.features.includes('XL') ? 0.5 :
                      gyro.features.includes('Compact') ? 1.5 :
                      gyro.features.includes('Heavy-Duty') ? 1.5 : 1.0

    return Math.ceil(baseWeight * multiplier)
  }

  calculateHeatSinkWeight(heatSinkType: string, count: number): number {
    const heatSink = HEATSINK_DATA.find(h => h.id === heatSinkType)
    if (!heatSink) return 0

    return heatSink.weight * count
  }

  calculateJumpJetWeight(jumpJetType: string, unitTonnage: number, count: number): number {
    const jumpJet = JUMPJET_DATA.find(j => j.id === jumpJetType)
    if (!jumpJet) return 0

    // Standard BattleTech jump jet weight calculation
    let weightPerJet = 0.5
    if (unitTonnage > 55 && unitTonnage <= 85) {
      weightPerJet = 1.0
    } else if (unitTonnage > 85) {
      weightPerJet = 2.0
    }

    return weightPerJet * count
  }

  // Slot calculation methods
  getEngineCriticalSlots(engineType: string, gyroType: string): {
    centerTorso: number[]
    leftTorso: number[]
    rightTorso: number[]
  } {
    // Use existing engine slot requirements from engineCalculations
    const engineTypeEnum = this.mapEngineIdToType(engineType)
    const baseEngineSlots = ENGINE_SLOT_REQUIREMENTS[engineTypeEnum]
    
    if (!baseEngineSlots) {
      return { centerTorso: [], leftTorso: [], rightTorso: [] }
    }

    // Get gyro slots to determine engine placement
    const gyroSlots = this.getGyroCriticalSlots(gyroType)
    const gyroEndSlot = gyroSlots.centerTorso.length > 0 ? Math.max(...gyroSlots.centerTorso) : 2

    // Engine slots are always: first 3 slots (0,1,2) + slots after gyro
    const centerTorsoSlots = [0, 1, 2] // First 3 slots always
    
    // Add remaining engine slots after gyro
    const remainingEngineSlots = baseEngineSlots.centerTorso - 3
    for (let i = 1; i <= remainingEngineSlots; i++) {
      const slot = gyroEndSlot + i
      if (slot < 12) { // Don't exceed CT slot limit
        centerTorsoSlots.push(slot)
      }
    }

    return {
      centerTorso: centerTorsoSlots,
      leftTorso: Array.from({ length: baseEngineSlots.leftTorso }, (_, i) => i),
      rightTorso: Array.from({ length: baseEngineSlots.rightTorso }, (_, i) => i)
    }
  }
  
  private mapEngineIdToType(engineId: string): EngineType {
    const engineMap: Record<string, EngineType> = {
      'standard_fusion_engine': 'Standard',
      'xl_fusion_engine': 'XL (IS)',
      'light_fusion_engine': 'Light',
      'xxl_fusion_engine': 'XXL',
      'compact_fusion_engine': 'Compact',
      'ice_engine': 'ICE',
      'fuel_cell_engine': 'Fuel Cell'
    }
    return engineMap[engineId] || 'Standard'
  }

  getGyroCriticalSlots(gyroType: string): { centerTorso: number[] } {
    // Use existing gyro slot requirements from gyroCalculations
    const gyroTypeEnum = this.mapGyroIdToType(gyroType)
    const gyroSlots = GYRO_SLOT_REQUIREMENTS[gyroTypeEnum]
    
    if (!gyroSlots) {
      return { centerTorso: [] }
    }

    // Gyro slots are always in center torso, starting from slot 3
    const centerTorsoSlots = []
    for (let i = 0; i < gyroSlots; i++) {
      const slot = 3 + i
      if (slot < 12) { // Don't exceed CT slot limit
        centerTorsoSlots.push(slot)
      }
    }

    return { centerTorso: centerTorsoSlots }
  }
  
  private mapGyroIdToType(gyroId: string): GyroType {
    const gyroMap: Record<string, GyroType> = {
      'standard_gyro': 'Standard',
      'xl_gyro': 'XL',
      'compact_gyro': 'Compact',
      'heavy_duty_gyro': 'Heavy-Duty'
    }
    return gyroMap[gyroId] || 'Standard'
  }

  getStructureCriticalSlots(structureType: string): {
    centerTorso: number[]
    leftTorso: number[]
    rightTorso: number[]
    leftArm: number[]
    rightArm: number[]
    leftLeg: number[]
    rightLeg: number[]
  } {
    const structure = STRUCTURE_DATA.find(s => s.id === structureType)
    if (!structure) return {
      centerTorso: [], leftTorso: [], rightTorso: [],
      leftArm: [], rightArm: [], leftLeg: [], rightLeg: []
    }

    // For dynamic components, return empty slots - they will be distributed by the placement system
    if (structure.placementType === 'dynamic') {
      return {
        centerTorso: [], leftTorso: [], rightTorso: [],
        leftArm: [], rightArm: [], leftLeg: [], rightLeg: []
      }
    }

    return structure.criticalSlots
  }

  getArmorCriticalSlots(armorType: string): {
    centerTorso: number[]
    leftTorso: number[]
    rightTorso: number[]
    leftArm: number[]
    rightArm: number[]
    leftLeg: number[]
    rightLeg: number[]
  } {
    const armor = ARMOR_DATA.find(a => a.id === armorType)
    if (!armor) return {
      centerTorso: [], leftTorso: [], rightTorso: [],
      leftArm: [], rightArm: [], leftLeg: [], rightLeg: []
    }

    // For dynamic components, return empty slots - they will be distributed by the placement system
    if (armor.placementType === 'dynamic') {
      return {
        centerTorso: [], leftTorso: [], rightTorso: [],
        leftArm: [], rightArm: [], leftLeg: [], rightLeg: []
      }
    }

    return armor.criticalSlots
  }

  /**
   * Get total slots required for dynamic components
   */
  getDynamicComponentSlots(componentId: string): number {
    // Check structure components
    const structure = STRUCTURE_DATA.find(s => s.id === componentId)
    if (structure && structure.placementType === 'dynamic') {
      return structure.totalSlots || 0
    }

    // Check armor components
    const armor = ARMOR_DATA.find(a => a.id === componentId)
    if (armor && armor.placementType === 'dynamic') {
      return armor.totalSlots || 0
    }

    return 0
  }

  // Validation methods
  validateComponentCompatibility(
    component1: ComponentVariantUnion,
    component2: ComponentVariantUnion
  ): { compatible: boolean; errors: string[] } {
    const errors: string[] = []

    // Add validation logic here
    // For now, return compatible
    return { compatible: true, errors }
  }

  validateUnitConfiguration(components: {
    engine?: EngineVariant
    gyro?: GyroVariant
    structure?: StructureVariant
    armor?: ArmorVariant
    heatSinks?: HeatSinkVariant[]
    jumpJets?: JumpJetVariant[]
    enhancements?: EnhancementVariant[]
  }): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // Add validation logic here
    // For now, return valid
    return { valid: true, errors, warnings }
  }

  // ComponentSelectionService implementation
  getAvailableComponents(
    category: ComponentCategory,
    filters: {
      techBase: TechBase
      unitType: UnitType
      rulesLevel?: string
      introductionYear?: number
    }
  ): ComponentVariantUnion[] {
    return this.getComponents(category, filters)
  }

  getComponentRecommendations(
    unitType: UnitType,
    techBase: TechBase,
    tonnage: number,
    walkMP: number
  ): {
    engines: EngineVariant[]
    gyros: GyroVariant[]
    structures: StructureVariant[]
    armors: ArmorVariant[]
    heatSinks: HeatSinkVariant[]
    jumpJets: JumpJetVariant[]
    enhancements: EnhancementVariant[]
  } {
    return {
      engines: this.getEngines({ techBase }),
      gyros: this.getGyros({ techBase }),
      structures: this.getStructures({ techBase }),
      armors: this.getArmors({ techBase }),
      heatSinks: this.getHeatSinks({ techBase }),
      jumpJets: this.getJumpJets({ techBase }),
      enhancements: this.getEnhancements({ techBase })
    }
  }

  validateSelections(selections: {
    engine?: string
    gyro?: string
    structure?: string
    armor?: string
    heatSink?: string
    jumpJet?: string
    enhancements?: string[]
  }): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // Add validation logic here
    // For now, return valid
    return { valid: true, errors, warnings }
  }

  getComponentDetails(componentId: string): ComponentVariantUnion | null {
    return this.getComponentById(componentId)
  }

  calculateTotalSlots(configuration: {
    engine?: string
    gyro?: string
    structure?: string
    armor?: string
    heatSinks?: number
    jumpJets?: number
    enhancements?: string[]
  }): {
    total: number
    breakdown: {
      engine: number
      gyro: number
      structure: number
      armor: number
      heatSinks: number
      jumpJets: number
      enhancements: number
    }
  } {
    const breakdown = {
      engine: 0,
      gyro: 0,
      structure: 0,
      armor: 0,
      heatSinks: 0,
      jumpJets: 0,
      enhancements: 0
    }

    // Calculate engine slots
    if (configuration.engine && configuration.gyro) {
      const engineSlots = this.getEngineCriticalSlots(configuration.engine, configuration.gyro)
      breakdown.engine = engineSlots.centerTorso.length + engineSlots.leftTorso.length + engineSlots.rightTorso.length
    }

    // Calculate gyro slots
    if (configuration.gyro) {
      const gyroSlots = this.getGyroCriticalSlots(configuration.gyro)
      breakdown.gyro = gyroSlots.centerTorso.length
    }

    // Calculate structure slots
    if (configuration.structure) {
      const dynamicSlots = this.getDynamicComponentSlots(configuration.structure)
      if (dynamicSlots > 0) {
        breakdown.structure = dynamicSlots
      } else {
        const structureSlots = this.getStructureCriticalSlots(configuration.structure)
        breakdown.structure = Object.values(structureSlots).reduce((sum, slots) => sum + slots.length, 0)
      }
    }

    // Calculate armor slots
    if (configuration.armor) {
      const dynamicSlots = this.getDynamicComponentSlots(configuration.armor)
      if (dynamicSlots > 0) {
        breakdown.armor = dynamicSlots
      } else {
        const armorSlots = this.getArmorCriticalSlots(configuration.armor)
        breakdown.armor = Object.values(armorSlots).reduce((sum, slots) => sum + slots.length, 0)
      }
    }

    // Calculate heat sink slots
    if (configuration.heatSinks) {
      const heatSink = this.getHeatSinks({})[0] // Get first heat sink type
      if (heatSink) {
        breakdown.heatSinks = heatSink.criticalSlots * configuration.heatSinks
      }
    }

    // Calculate jump jet slots
    if (configuration.jumpJets) {
      const jumpJet = this.getJumpJets({})[0] // Get first jump jet type
      if (jumpJet) {
        breakdown.jumpJets = jumpJet.criticalSlots * configuration.jumpJets
      }
    }

    // Calculate enhancements slots
    if (configuration.enhancements) {
      breakdown.enhancements = configuration.enhancements.length // Simplified
    }

    const total = Object.values(breakdown).reduce((sum, count) => sum + count, 0)

    return { total, breakdown }
  }
}

// Export singleton instance
export const componentDatabase = ComponentDatabaseService.getInstance() 