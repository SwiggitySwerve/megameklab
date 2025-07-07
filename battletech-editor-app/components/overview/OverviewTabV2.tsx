/**
 * Overview Tab V2 - BattleTech unit overview with tech progression and rating system
 * Handles tech base, introduction year, rules level, and granular tech progression
 * 
 * Phase 4: Component Modularization - Day 15
 * Refactored from 992 lines → orchestrator + 4 focused components
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useUnit } from '../../components/multiUnit/MultiUnitProvider'
import { 
  TechProgression, 
  updateTechProgression,
  generateTechBaseString,
  isMixedTech,
  getPrimaryTechBase
} from '../../utils/techProgression'
import { 
  autoUpdateTechRating,
  getEraForYear,
  TECH_ERAS
} from '../../utils/techRating'
import { TechRating } from '../../utils/techProgression'
import {
  resolveComponentForTechBase
} from '../../utils/componentResolution'
import { 
  ComponentCategory,
  TechBase
} from '../../utils/componentAvailability'
import {
  ComponentMemoryState
} from '../../types/componentDatabase'
import {
  validateAndResolveComponentWithMemory,
  initializeMemoryFromConfiguration
} from '../../utils/techBaseMemory'
import {
  initializeMemorySystem,
  updateMemoryState,
  saveMemoryToStorage,
  loadMemoryFromStorage
} from '../../utils/memoryPersistence'
import { isComponentAvailable } from '../../utils/componentDatabaseHelpers'
import { getArmorType } from '../../utils/armorTypes';
import { calculateMaxArmorTonnage } from '../../utils/armorAllocation';

// Import extracted components
import TechProgressionPanel from './TechProgressionPanel'
import UnitIdentityPanel from './UnitIdentityPanel'
import TechRatingPanel from './TechRatingPanel'
import OverviewSummaryPanel from './OverviewSummaryPanel'

export interface OverviewTabV2Props {
  readOnly?: boolean
}

export const OverviewTabV2: React.FC<OverviewTabV2Props> = ({ readOnly = false }) => {
  const { unit, updateConfiguration } = useUnit()
  const [renderKey, setRenderKey] = useState(0)
  const [memoryState, setMemoryState] = useState<ComponentMemoryState | null>(null)

  // Memoize enhanced configuration to prevent unnecessary re-renders
  const enhancedConfig = useMemo(() => {
    if (!unit) return {} as any
    const config = unit.getConfiguration()
    return {
      ...config,
      techProgression: (config as any).techProgression || {
        chassis: 'Inner Sphere',
        gyro: 'Inner Sphere',
        engine: 'Inner Sphere',
        heatsink: 'Inner Sphere',
        targeting: 'Inner Sphere',
        myomer: 'Inner Sphere',
        movement: 'Inner Sphere',
        armor: 'Inner Sphere'
      }
    }
  }, [unit, renderKey, unit?.getConfiguration()])

  // Memoize property map to prevent recreation on every render
  const propertyMap = useMemo(() => ({
    chassis: 'structureType',
    gyro: 'gyroType',
    engine: 'engineType',
    heatsink: 'heatSinkType',
    targeting: 'targetingSystem',
    myomer: 'enhancementType',
    movement: 'mascType',
    armor: 'armorType'
  }), [])

  // Helper function to get current component for a subsystem
  const getCurrentComponentForSubsystem = useCallback((subsystem: keyof TechProgression, config: any): string => {
    // Special case for myomer/enhancements
    if (subsystem === 'myomer') {
      const value = config.enhancementType || 'Standard'
      // Handle ComponentConfiguration objects
      if (value && typeof value === 'object' && 'type' in value) {
        return value.type
      }
      return value
    }
    
    const property = propertyMap[subsystem as keyof typeof propertyMap]
    if (!property) return 'Standard'
    
    const value = config[property]
    // Handle ComponentConfiguration objects
    if (value && typeof value === 'object' && 'type' in value) {
      return value.type
    }
    return value || 'Standard'
  }, [propertyMap])

  // Helper function to get config property for subsystem
  const getConfigPropertyForSubsystem = useCallback((subsystem: keyof TechProgression): string | null => {
    // Special case for myomer/enhancements
    if (subsystem === 'myomer') {
      return 'enhancementType'
    }
    
    return propertyMap[subsystem as keyof typeof propertyMap] || null
  }, [propertyMap])

  // Handle configuration updates with auto-calculation
  const handleConfigUpdate = useCallback((updates: any) => {
    if (readOnly) {
      return
    }
    
    // Get current configuration directly from unit to avoid stale closure
    const currentConfig = unit?.getConfiguration()
    if (!currentConfig) {
      console.error('[OverviewTab] No current configuration available')
      return
    }
    
    const newConfig = { ...currentConfig, ...updates }
    updateConfiguration(newConfig)
  }, [unit, updateConfiguration, readOnly])

  // Memory restoration function
  const applyMemoryRestoration = useCallback((config: any, memoryState: ComponentMemoryState): any => {
    if (!memoryState || !memoryState.techBaseMemory) return config
    
    const restoredConfig = { ...config }
    const techBaseMemory = memoryState.techBaseMemory
    
    // Restore components based on memory
    Object.entries(techBaseMemory).forEach(([subsystem, memory]) => {
      if (memory.preferredComponent && memory.lastTechBase) {
        const configProperty = getConfigPropertyForSubsystem(subsystem as keyof TechProgression)
        if (configProperty) {
          restoredConfig[configProperty] = memory.preferredComponent
        }
      }
    })
    
    return restoredConfig
  }, [getConfigPropertyForSubsystem])

  // Handle tech progression changes with memory-first component resolution
  const handleTechProgressionChange = useCallback((
    subsystem: keyof TechProgression, 
    newTechBase: 'Inner Sphere' | 'Clan'
  ) => {
    console.log(`[OverviewTab] Tech progression change: ${subsystem} → ${newTechBase}`)
    if (readOnly) {
      console.log('[OverviewTab] Skipping update - readonly mode')
      return
    }
    try {
      const currentConfig = unit?.getConfiguration()
      if (!currentConfig) {
        console.error('[OverviewTab] No current configuration available')
        return
      }
      const oldTechBase = (currentConfig as any).techProgression?.[subsystem] || 'Inner Sphere'
      const currentComponent = getCurrentComponentForSubsystem(subsystem, currentConfig)
      console.log(`[OverviewTab] Current state: ${subsystem} = ${currentComponent} (${oldTechBase})`)
      let componentToApply = currentComponent
      let updatedMemoryState = memoryState
      if (memoryState && oldTechBase !== newTechBase) {
        console.log(`[OverviewTab] 🔄 Tech base change detected, resolving component with memory`)
        const resolution = validateAndResolveComponentWithMemory(
          currentComponent,
          subsystem as ComponentCategory,
          oldTechBase,
          newTechBase,
          memoryState.techBaseMemory,
          (currentConfig as any).rulesLevel || 'Standard'
        )
        console.log(`[OverviewTab] Memory resolution: ${resolution.resolutionReason}`)
        console.log(`[OverviewTab] Component change: ${currentComponent} → ${resolution.resolvedComponent}`)
        updatedMemoryState = updateMemoryState(memoryState, resolution.updatedMemory)
        componentToApply = resolution.resolvedComponent
      } else {
        console.log(`[OverviewTab] No tech base change or no memory state, keeping current component`)
      }
      const currentProgression = (currentConfig as any).techProgression || {
        chassis: 'Inner Sphere',
        gyro: 'Inner Sphere',
        engine: 'Inner Sphere',
        heatsink: 'Inner Sphere',
        targeting: 'Inner Sphere',
        myomer: 'Inner Sphere',
        movement: 'Inner Sphere',
        armor: 'Inner Sphere'
      }
      const newProgression = {
        ...currentProgression,
        [subsystem]: newTechBase
      }
      const newTechRating = autoUpdateTechRating(
        (currentConfig as any).introductionYear || 3025, 
        newProgression, 
        currentConfig
      )
      let componentConfig = {}
      if (componentToApply !== currentComponent) {
        const configProperty = getConfigPropertyForSubsystem(subsystem)
        if (configProperty) {
          componentConfig = { [configProperty]: componentToApply }
          console.log(`[OverviewTab] 🔧 Component change detected: ${configProperty} = ${componentToApply}`)
          if (subsystem === 'armor' && 'armorTonnage' in currentConfig) {
            const currentArmorTonnage = (currentConfig as any).armorTonnage || 0
            const armorUnit = {
              mass: currentConfig.tonnage,
              data: {
                structure: { type: (currentConfig as any).structureType || 'Standard' },
                engine: { 
                  type: (currentConfig as any).engineType || 'Standard',
                  rating: (currentConfig as any).engineRating || 200
                }
              }
            } as any
            const newMaxArmorTonnage = calculateMaxArmorTonnage(armorUnit, componentToApply)
            const preservedArmorTonnage = Math.min(currentArmorTonnage, newMaxArmorTonnage)
            componentConfig = { ...componentConfig, armorTonnage: preservedArmorTonnage }
            console.log(`[OverviewTab] 🛡️ Armor tonnage preserved: ${currentArmorTonnage} → ${preservedArmorTonnage} (max: ${newMaxArmorTonnage})`)
          }
        }
      }
      const finalConfig = { 
        ...currentConfig,
        techProgression: newProgression,
        techRating: newTechRating,
        ...componentConfig
      }
      console.log(`[OverviewTab] 🚀 Applying final configuration:`, {
        subsystem,
        newTechBase,
        componentChange: componentToApply !== currentComponent,
        techRating: newTechRating
      })
      updateConfiguration(finalConfig)
      if (updatedMemoryState !== memoryState && updatedMemoryState) {
        setMemoryState(updatedMemoryState)
        saveMemoryToStorage(updatedMemoryState)
        console.log(`[OverviewTab] 💾 Memory state updated and persisted`)
      }
      setRenderKey(prev => prev + 1)
      console.log(`[OverviewTab] ✅ Tech progression update completed`)
    } catch (error) {
      console.error('[OverviewTab] Error updating tech progression:', error)
    }
  }, [unit, memoryState, updateConfiguration, readOnly, getCurrentComponentForSubsystem, getConfigPropertyForSubsystem])

  // Handle master tech base change with memory-aware component resolution
  const handleMasterTechBaseChange = useCallback((newTechBase: string) => {
    console.log(`[OverviewTab] Master tech base change: → ${newTechBase}`)
    if (readOnly) {
      console.log('[OverviewTab] Skipping - readonly mode')
      return
    }
    try {
      const currentConfig = unit?.getConfiguration()
      if (!currentConfig) {
        console.error('[OverviewTab] No current configuration available')
        return
      }
      let newProgression: TechProgression
      const componentUpdates: any = {}
      if (newTechBase === 'Mixed') {
        const currentProgression = (currentConfig as any).techProgression || {
          chassis: 'Inner Sphere',
          gyro: 'Inner Sphere',
          engine: 'Inner Sphere',
          heatsink: 'Inner Sphere',
          targeting: 'Inner Sphere',
          myomer: 'Inner Sphere',
          movement: 'Inner Sphere',
          armor: 'Inner Sphere'
        }
        newProgression = currentProgression
        console.log(`[OverviewTab] 🔄 Mixed mode: keeping current progression`)
      } else if (newTechBase === 'Inner Sphere' || newTechBase === 'Clan') {
        const subsystems: (keyof TechProgression)[] = [
          'chassis', 'gyro', 'engine', 'heatsink', 'targeting', 'myomer', 'movement', 'armor'
        ]
        newProgression = {} as TechProgression
        subsystems.forEach(subsystem => {
          newProgression[subsystem] = newTechBase
        })
        console.log(`[OverviewTab] 🔄 Forcing all subsystems to ${newTechBase}`)
      } else {
        console.error('[OverviewTab] Invalid tech base:', newTechBase)
        return
      }
      const newTechRating = autoUpdateTechRating(
        (currentConfig as any).introductionYear || 3025, 
        newProgression, 
        currentConfig
      )
      const finalConfig = {
        ...currentConfig,
        techBase: newTechBase as 'Inner Sphere' | 'Clan' | 'Mixed',
        techProgression: newProgression,
        techRating: newTechRating,
        ...componentUpdates
      }
      console.log(`[OverviewTab] 🚀 Applying master tech base configuration:`, {
        newTechBase,
        componentChanges: Object.keys(componentUpdates).length,
        techRating: newTechRating
      })
      updateConfiguration(finalConfig)
      setRenderKey(prev => prev + 1)
      console.log(`[OverviewTab] ✅ Master tech base update completed`)
    } catch (error) {
      console.error('[OverviewTab] Error updating master tech base:', error)
    }
  }, [unit, memoryState, updateConfiguration, readOnly])

  // Handle component changes with memory preservation
  const handleComponentChange = useCallback((subsystem: keyof TechProgression, newComponent: string) => {
    console.log(`[OverviewTab] Component change: ${subsystem} → ${newComponent}`)
    if (readOnly) {
      console.log('[OverviewTab] Skipping - readonly mode')
      return
    }
    try {
      const currentConfig = unit?.getConfiguration()
      if (!currentConfig) {
        console.error('[OverviewTab] No current configuration available')
        return
      }
      const configProperty = getConfigPropertyForSubsystem(subsystem)
      if (!configProperty) {
        console.error(`[OverviewTab] No config property found for subsystem: ${subsystem}`)
        return
      }
      const finalConfig = {
        ...currentConfig,
        [configProperty]: newComponent
      }
      console.log(`[OverviewTab] 🚀 Applying component configuration:`, {
        subsystem,
        configProperty,
        newComponent
      })
      updateConfiguration(finalConfig)
      setRenderKey(prev => prev + 1)
      console.log(`[OverviewTab] ✅ Component update completed`)
    } catch (error) {
      console.error('[OverviewTab] Error updating component:', error)
    }
  }, [unit, updateConfiguration, readOnly, getConfigPropertyForSubsystem])

  // Load memory state on mount
  useEffect(() => {
    const loadMemory = () => {
      try {
        const savedMemory = loadMemoryFromStorage()
        if (savedMemory) {
          setMemoryState(savedMemory)
          console.log('[OverviewTab] Loaded memory state from storage')
        }
      } catch (error) {
        console.error('[OverviewTab] Error loading memory state:', error)
      }
    }
    loadMemory()
  }, [])

  // Apply memory restoration when config changes
  useEffect(() => {
    if (memoryState && enhancedConfig && Object.keys(enhancedConfig).length > 0) {
      const restoredConfig = applyMemoryRestoration(enhancedConfig, memoryState)
      if (JSON.stringify(restoredConfig) !== JSON.stringify(enhancedConfig)) {
        console.log('[OverviewTab] Applying memory restoration')
        updateConfiguration(restoredConfig)
      }
    }
  }, [memoryState, enhancedConfig, applyMemoryRestoration, updateConfiguration])

  // Calculate current era and determine tech base status
  const currentEra = getEraForYear(enhancedConfig.introductionYear)
  const isMixedTechEnabled = (enhancedConfig.techBase as string) === 'Mixed'
  const primaryTechBase = enhancedConfig.techBase // Use the actual tech base setting
  // Fix: isMixed should be true if master tech base is Mixed
  const isMixed = enhancedConfig.techBase === 'Mixed' as const

  return (
    <div className="h-full flex flex-col">
      {/* Header with unit info - Fixed */}
      <div className="flex-shrink-0 p-4">
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-100 mb-1">Unit Overview</h2>
              <p className="text-slate-400 text-sm">
                Configure technology progression, introduction year, and rules complexity
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Tech Rating</div>
              <div className="text-lg font-bold text-slate-100">
                {typeof enhancedConfig.techRating === 'object' 
                  ? enhancedConfig.techRating?.era2801_3050 || 'D'
                  : enhancedConfig.techRating || 'D'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Condensed Basic Information + Master Tech Base Section */}
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 shadow-lg">
          <h3 className="text-lg font-semibold text-slate-100 mb-3">Unit Configuration</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Introduction Year {readOnly && <span className="text-red-400">(READ ONLY)</span>}
                </label>
                <input
                  type="number"
                  value={enhancedConfig.introductionYear || 3025}
                  onChange={(e) => {
                    handleConfigUpdate({ introductionYear: parseInt(e.target.value) || 3025 })
                  }}
                  disabled={readOnly}
                  className={`w-full px-3 py-2 border rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    readOnly 
                      ? 'bg-slate-600 border-slate-500 opacity-50 cursor-not-allowed' 
                      : 'bg-slate-700 border-slate-600'
                  }`}
                  min="2500"
                  max="3150"
                  style={{ 
                    color: readOnly ? '#94a3b8' : '#f1f5f9',
                    backgroundColor: readOnly ? '#475569' : '#374151'
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Rules Level
                </label>
                <select
                  value={enhancedConfig.rulesLevel || 'Standard'}
                  onChange={(e) => handleConfigUpdate({ rulesLevel: e.target.value })}
                  disabled={readOnly}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="Introductory">Introductory</option>
                  <option value="Standard">Standard</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Experimental">Experimental</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Master Tech Base
              </label>
              <select
                value={enhancedConfig.techBase || 'Inner Sphere'}
                onChange={(e) => handleMasterTechBaseChange(e.target.value as 'Inner Sphere' | 'Clan' | 'Mixed')}
                disabled={readOnly}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="Inner Sphere">Inner Sphere</option>
                <option value="Clan">Clan</option>
                <option value="Mixed">Mixed Tech</option>
              </select>
            </div>
          </div>
          <p className="text-sm text-slate-400 mt-2">
            {isMixed 
              ? 'Mixed tech allows different subsystems to use different tech bases'
              : `${enhancedConfig.techBase} tech base applied to all subsystems`
            }
          </p>
        </div>

        {/* Two Column Layout: Tech Progression + Tech Rating (2/3 to 1/3 split) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Tech Progression (2/3 width) */}
          <div className="lg:col-span-2">
            <TechProgressionPanel
              techProgression={enhancedConfig.techProgression}
              currentConfig={enhancedConfig}
              readOnly={readOnly}
              renderKey={renderKey}
              onTechProgressionChange={handleTechProgressionChange}
              isMixed={isMixed}
            />
          </div>

          {/* Right Column: Tech Rating (1/3 width) */}
          <div className="lg:col-span-1">
            <TechRatingPanel
              techRating={enhancedConfig.techRating}
              introductionYear={enhancedConfig.introductionYear || 3025}
            />
          </div>
        </div>

        {/* Component Configuration Section */}
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50 shadow-lg">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Component Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['chassis', 'gyro', 'engine', 'heatsink', 'targeting', 'myomer', 'movement', 'armor'] as const).map((subsystem) => {
              const currentComponent = getCurrentComponentForSubsystem(subsystem, enhancedConfig)
              const configProperty = getConfigPropertyForSubsystem(subsystem)
              
              return (
                <div key={subsystem} className="p-3 bg-slate-700/50 rounded-md">
                  <label className="block text-sm font-medium text-slate-300 mb-2 capitalize">
                    {subsystem}
                  </label>
                  <div className="text-sm text-slate-400 mb-2">
                    Current: {currentComponent}
                  </div>
                  <div className="text-xs text-slate-500">
                    Property: {configProperty || 'N/A'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OverviewTabV2
