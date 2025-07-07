/**
 * React Hook for Component Database
 * Provides easy access to component database service for UI components
 */

import { useMemo } from 'react'
import { componentDatabase } from '../services/ComponentDatabaseService'
import {
  ComponentCategory,
  ComponentVariantUnion,
  EngineVariant,
  GyroVariant,
  StructureVariant,
  ArmorVariant,
  HeatSinkVariant,
  JumpJetVariant,
  TechBase,
  UnitType
} from '../types/core/ComponentDatabase'

export interface ComponentFilters {
  techBase: TechBase
  unitType: UnitType
  rulesLevel?: string
  introductionYear?: number
}

export const useComponentDatabase = () => {
  const getComponents = useMemo(() => {
    return (
      category: ComponentCategory,
      filters: ComponentFilters
    ): ComponentVariantUnion[] => {
      return componentDatabase.getAvailableComponents(category, filters)
    }
  }, [])

  const getEngines = useMemo(() => {
    return (filters: ComponentFilters): EngineVariant[] => {
      return componentDatabase.getEngines({
        techBase: filters.techBase,
        rulesLevel: filters.rulesLevel
      })
    }
  }, [])

  const getGyros = useMemo(() => {
    return (filters: ComponentFilters): GyroVariant[] => {
      return componentDatabase.getGyros({
        techBase: filters.techBase,
        rulesLevel: filters.rulesLevel
      })
    }
  }, [])

  const getStructures = useMemo(() => {
    return (filters: ComponentFilters): StructureVariant[] => {
      return componentDatabase.getStructures({
        techBase: filters.techBase,
        rulesLevel: filters.rulesLevel
      })
    }
  }, [])

  const getArmors = useMemo(() => {
    return (filters: ComponentFilters): ArmorVariant[] => {
      return componentDatabase.getArmors({
        techBase: filters.techBase,
        rulesLevel: filters.rulesLevel
      })
    }
  }, [])

  const getHeatSinks = useMemo(() => {
    return (filters: ComponentFilters): HeatSinkVariant[] => {
      return componentDatabase.getHeatSinks({
        techBase: filters.techBase,
        rulesLevel: filters.rulesLevel
      })
    }
  }, [])

  const getJumpJets = useMemo(() => {
    return (filters: ComponentFilters): JumpJetVariant[] => {
      return componentDatabase.getJumpJets({
        techBase: filters.techBase,
        rulesLevel: filters.rulesLevel
      })
    }
  }, [])

  const getComponentById = useMemo(() => {
    return (id: string): ComponentVariantUnion | null => {
      return componentDatabase.getComponentById(id)
    }
  }, [])

  const calculateTotalSlots = useMemo(() => {
    return (configuration: {
      engine?: string
      gyro?: string
      structure?: string
      armor?: string
      heatSinks?: number
      jumpJets?: number
      enhancements?: string[]
    }) => {
      return componentDatabase.calculateTotalSlots(configuration)
    }
  }, [])

  const validateSelections = useMemo(() => {
    return (selections: {
      engine?: string
      gyro?: string
      structure?: string
      armor?: string
      heatSink?: string
      jumpJet?: string
      enhancements?: string[]
    }) => {
      return componentDatabase.validateSelections(selections)
    }
  }, [])

  const getComponentRecommendations = useMemo(() => {
    return (
      unitType: UnitType,
      techBase: TechBase,
      tonnage: number,
      walkMP: number
    ) => {
      return componentDatabase.getComponentRecommendations(unitType, techBase, tonnage, walkMP)
    }
  }, [])

  return {
    getComponents,
    getEngines,
    getGyros,
    getStructures,
    getArmors,
    getHeatSinks,
    getJumpJets,
    getComponentById,
    calculateTotalSlots,
    validateSelections,
    getComponentRecommendations
  }
} 