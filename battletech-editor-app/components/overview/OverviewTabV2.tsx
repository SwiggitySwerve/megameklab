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
  saveMemoryToStorage
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
  const { unit, isConfigLoaded, updateConfiguration, unitVersion } = useUnit()
  
  const config = useMemo(() => {
    console.log('[OverviewTabV2] useMemo triggered - unit reference changed:', {
      unitId: unit?.constructor.name,
      hasUnit: !!unit,
      unitVersion
    })
    return unit?.getConfiguration()
  }, [unit, unitVersion]);
  
  // State management
  const [hasInitialized, setHasInitialized] = useState(false)
  const [memoryState, setMemoryState] = useState<ComponentMemoryState | null>(null)
  const [needsMemoryRestoration, setNeedsMemoryRestoration] = useState(false)
  const [renderKey, setRenderKey] = useState(0) // Add back renderKey for TechProgressionPanel
  
  // Enhanced configuration - use actual config values directly
  const enhancedConfig = {
    ...config,
    introductionYear: (config as any).introductionYear || 3068,
    rulesLevel: (config as any).rulesLevel || 'Standard',
    techBase: (config.techBase as 'Inner Sphere' | 'Clan' | 'Mixed') || 'Inner Sphere',
    techProgression: (config as any).techProgression || {
      chassis: 'Inner Sphere',
      gyro: 'Inner Sphere',
      engine: 'Inner Sphere',
      heatsink: 'Inner Sphere',
      targeting: 'Inner Sphere',
      myomer: 'Inner Sphere',
      movement: 'Inner Sphere',
      armor: 'Inner Sphere'
    },
    techRating: (config as any).techRating || {
      era2100_2800: 'D' as const,
      era2801_3050: 'D' as const,
      era3051_3082: 'D' as const,
      era3083_Now: 'D' as const
    }
  }
  
  // === DIAGNOSTIC CODE START ===
  useEffect(() => {
    // Test component database availability
    try {
      const testResult = isComponentAvailable('Standard', 'engine', 'Inner Sphere')
      console.log('[DIAGNOSTIC] Component database test (engine, IS, Standard):', testResult)
    } catch (error) {
      console.error('[DIAGNOSTIC] Component database error:', error)
    }
    // Log memory state and initialization
    console.log('[DIAGNOSTIC] Memory state:', memoryState)
    console.log('[DIAGNOSTIC] Has initialized:', hasInitialized)
    console.log('[DIAGNOSTIC] Needs memory restoration:', needsMemoryRestoration)
    // Log config and progression
    console.log('[DIAGNOSTIC] Config:', config)
    console.log('[DIAGNOSTIC] Enhanced config:', enhancedConfig)
  }, [memoryState, hasInitialized, needsMemoryRestoration, config, enhancedConfig])
  // === DIAGNOSTIC CODE END ===
  
  // Move all useEffect hooks to the top level, before any conditional logic
  // Initialize enhanced fields and memory system on first load
  useEffect(() => {
    if (!hasInitialized && isConfigLoaded && unit) {
      console.log('[OverviewTab] 💾 🚀 ONE-TIME INITIALIZATION - Enhanced config fields and memory system')
      
      // Get fresh config at initialization time
      const currentConfig = unit.getConfiguration()
      const updates: any = {}
      
      // Only set defaults if fields don't exist
      if (!(currentConfig as any).introductionYear) {
        updates.introductionYear = 3068
      }
      if (!(currentConfig as any).rulesLevel) {
        updates.rulesLevel = 'Standard'
      }
      if (!(currentConfig as any).techProgression) {
        updates.techProgression = {
          chassis: 'Inner Sphere',
          gyro: 'Inner Sphere',
          engine: 'Inner Sphere',
          heatsink: 'Inner Sphere',
          targeting: 'Inner Sphere', // Start with Inner Sphere for consistency
          myomer: 'Inner Sphere',
          movement: 'Inner Sphere',
          armor: 'Inner Sphere'
        }
      }
      if (!(currentConfig as any).techRating) {
        updates.techRating = {
          era2100_2800: 'D' as const,
          era2801_3050: 'D' as const,
          era3051_3082: 'D' as const,
          era3083_Now: 'D' as const
        }
      }
      
      // Initialize memory system FIRST
      console.log('[OverviewTab] 💾 Initializing memory system')
      const initialMemoryState = initializeMemorySystem()
      setMemoryState(initialMemoryState)
      
      // 🔥 FIXED: Only apply memory restoration during true initialization
      console.log('[OverviewTab] 💾 ⚠️ ONE-TIME MEMORY RESTORATION - This should only happen once')
      const restorationUpdates = applyMemoryRestoration(currentConfig, initialMemoryState)
      
      // Check if restoration was deferred
      if (restorationUpdates._needsMemoryRestoration) {
        console.log('[OverviewTab] 💾 ⏳ Memory restoration deferred, will retry when components are available')
        setNeedsMemoryRestoration(true)
        delete restorationUpdates._needsMemoryRestoration // Remove flag before applying
      }
      
      Object.assign(updates, restorationUpdates)
      
      // Only update if we have changes
      if (Object.keys(updates).length > 0) {
        console.log('[OverviewTab] 🚀 ONE-TIME CONFIG UPDATE (including memory restoration):', updates)
        updateConfiguration({ ...currentConfig, ...updates })
      }
      
      setHasInitialized(true)
      console.log('[OverviewTab] ✅ INITIALIZATION COMPLETE - No more automatic restoration')
    }
  }, [isConfigLoaded, hasInitialized, unit, updateConfiguration])
  
  // Retry restoration when components become available
  useEffect(() => {
    if (needsMemoryRestoration && memoryState && isConfigLoaded && unit) {
      console.log('[OverviewTab] 💾 🔄 Setting up retry mechanism...')
      
      // Use interval to periodically check for component availability
      const retryInterval = setInterval(() => {
        console.log('[OverviewTab] 💾 🔄 Checking component availability for retry...')
        
        const currentConfig = unit.getConfiguration()
        const restorationUpdates = applyMemoryRestoration(currentConfig, memoryState)
        
        // Check if restoration succeeded this time
        if (!restorationUpdates._needsMemoryRestoration) {
          console.log('[OverviewTab] 💾 ✅ Retry restoration successful!')
          
          // Clear the retry flag
          setNeedsMemoryRestoration(false)
          
          // Apply the restoration updates
          delete restorationUpdates._needsMemoryRestoration
          if (Object.keys(restorationUpdates).length > 0) {
            console.log('[OverviewTab] 💾 🚀 Applying deferred restoration updates:', restorationUpdates)
            updateConfiguration({ ...currentConfig, ...restorationUpdates })
          }
          
          // Clear the interval since we succeeded
          clearInterval(retryInterval)
        } else {
          console.log('[OverviewTab] 💾 ⏳ Components still not available, will retry again in 500ms')
        }
      }, 500) // Check every 500ms
      
      // Clean up interval after 10 seconds max to prevent infinite retries
      const timeout = setTimeout(() => {
        console.log('[OverviewTab] 💾 ⏰ Retry timeout reached, giving up on restoration')
        clearInterval(retryInterval)
        setNeedsMemoryRestoration(false)
      }, 10000)
      
      // Cleanup function
      return () => {
        clearInterval(retryInterval)
        clearTimeout(timeout)
      }
    }
  }, [needsMemoryRestoration, memoryState, isConfigLoaded, unit, updateConfiguration])
  
  // Update memory only when user makes changes, not on every render
  const updateMemoryFromConfig = useCallback(() => {
    if (memoryState && isConfigLoaded && config) {
      const currentProgression = (config as any).techProgression || {
        chassis: 'Inner Sphere',
        gyro: 'Inner Sphere',
        engine: 'Inner Sphere',
        heatsink: 'Inner Sphere',
        targeting: 'Inner Sphere',
        myomer: 'Inner Sphere',
        movement: 'Inner Sphere',
        armor: 'Inner Sphere'
      }
      
      const currentComponents = {
        chassis: getCurrentComponentForSubsystem('chassis', config),
        engine: getCurrentComponentForSubsystem('engine', config),
        gyro: getCurrentComponentForSubsystem('gyro', config),
        heatsink: getCurrentComponentForSubsystem('heatsink', config),
        armor: getCurrentComponentForSubsystem('armor', config),
        myomer: getCurrentComponentForSubsystem('myomer', config),
        targeting: getCurrentComponentForSubsystem('targeting', config),
        movement: getCurrentComponentForSubsystem('movement', config)
      }
      
      const updatedTechBaseMemory = initializeMemoryFromConfiguration(
        currentProgression,
        currentComponents
      )
      
      // Create proper ComponentMemoryState object
      const updatedMemory: ComponentMemoryState = {
        techBaseMemory: updatedTechBaseMemory,
        lastUpdated: Date.now(),
        version: '1.0'
      }
      
      setMemoryState(updatedMemory)
      saveMemoryToStorage(updatedMemory)
    }
  }, [memoryState, isConfigLoaded, config])
  
  // Early return after all hooks are defined
  if (!isConfigLoaded || !config) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    )
  }
  
  // 🔥 SIMPLIFIED: Clean memory restoration function with proper imports
  const applyMemoryRestoration = (config: any, memoryState: ComponentMemoryState): any => {
    if (!memoryState || !memoryState.techBaseMemory) {
      console.log('[OverviewTab] 💾 No memory state available for restoration')
      return {}
    }
    
    console.log('[OverviewTab] 💾 Attempting memory restoration from saved state')
    const restorationUpdates: any = {}
    
    // Get current tech progression (or use defaults)
    const techProgression = config.techProgression || {
      chassis: 'Inner Sphere',
      gyro: 'Inner Sphere',
      engine: 'Inner Sphere',
      heatsink: 'Inner Sphere',
      targeting: 'Inner Sphere',
      myomer: 'Inner Sphere',
      movement: 'Inner Sphere',
      armor: 'Inner Sphere'
    }
    
    // 🔥 SIMPLE APPROACH: Try restoration, defer if components not available
    let componentsAvailable = true
    // Quick test to see if component system is working
    const testResult = isComponentAvailable('None', 'myomer', 'Inner Sphere')
    if (testResult === undefined || testResult === null) {
      componentsAvailable = false
    }
    
    if (!componentsAvailable) {
      console.log('[OverviewTab] 💾 🚫 Skipping restoration - will retry when components are available')
      return { _needsMemoryRestoration: true }
    }
    
    console.log('[OverviewTab] 💾 ✅ Components available, proceeding with restoration')
    
    // For each subsystem, restore component from memory if available
    Object.entries(techProgression).forEach(([subsystem, techBase]) => {
      const savedComponent = memoryState.techBaseMemory[subsystem as keyof typeof memoryState.techBaseMemory]?.[techBase as 'Inner Sphere' | 'Clan']
      
      if (savedComponent && savedComponent !== 'None' && savedComponent !== 'Standard') {
        const configProperty = getConfigPropertyForSubsystem(subsystem as keyof TechProgression)
        if (configProperty) {
          restorationUpdates[configProperty] = savedComponent
          console.log(`[OverviewTab] 💾 ✅ Restored ${subsystem} (${techBase}) → ${savedComponent}`)
        }
      }
    })
    
    console.log(`[OverviewTab] 💾 🎯 Restoration completed with ${Object.keys(restorationUpdates).length} updates`)
    return restorationUpdates
  }
  
  // Fix property map to exclude myomer since it's now an array
  const propertyMap = {
    chassis: 'structureType',
    gyro: 'gyroType', 
    engine: 'engineType',
    heatsink: 'heatSinkType',
    armor: 'armorType',
    targeting: 'targetingType',
    movement: 'movementType'
    // myomer removed - now handled as enhancements array
  };

  // Helper function to get current component for a subsystem
  const getCurrentComponentForSubsystem = (subsystem: keyof TechProgression, config: any): string => {
    // Special case for myomer/enhancements
    if (subsystem === 'myomer') {
      if (Array.isArray(config.enhancements) && config.enhancements.length > 0) {
        return config.enhancements[0].type; // Return first enhancement type
      }
      return 'Standard';
    }
    
    const property = propertyMap[subsystem as keyof typeof propertyMap];
    if (!property) return 'Standard';
    const value = config[property];
    if (value && typeof value === 'object' && 'type' in value) {
      return value.type;
    }
    return value || 'Standard';
  }

  // Helper function to get config property for subsystem
  const getConfigPropertyForSubsystem = (subsystem: keyof TechProgression): string | null => {
    // Special case for myomer/enhancements
    if (subsystem === 'myomer') {
      return 'enhancements';
    }
    
    return propertyMap[subsystem as keyof typeof propertyMap] || null;
  }

  // Handle configuration updates with auto-calculation
  const handleConfigUpdate = (updates: any) => {
    console.log('[OverviewTab] Updating configuration:', updates)
    const newConfig = { ...enhancedConfig, ...updates }
    if ('introductionYear' in updates || 'techProgression' in updates) {
      const year = updates.introductionYear || enhancedConfig.introductionYear
      const progression = updates.techProgression || enhancedConfig.techProgression
      newConfig.techRating = autoUpdateTechRating(year, progression, newConfig)
      console.log('[OverviewTab] Auto-updated tech rating:', newConfig.techRating)
    }
    if ('techProgression' in updates && !('techBase' in updates) && (enhancedConfig.techBase as string) !== 'Mixed') {
      const progression = updates.techProgression
      newConfig.techBase = generateTechBaseString(progression)
      console.log('[OverviewTab] Updated tech base string:', newConfig.techBase)
    }
    updateConfiguration(newConfig)
  }

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
  }, [unit, memoryState, updateConfiguration, readOnly])

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
      let componentUpdates: any = {}
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

  // Calculate current era and determine tech base status
  const currentEra = getEraForYear(enhancedConfig.introductionYear)
  const isMixedTechEnabled = (enhancedConfig.techBase as string) === 'Mixed'
  const primaryTechBase = enhancedConfig.techBase // Use the actual tech base setting
  // Fix: isMixed should be true if master tech base is Mixed
  const isMixed = enhancedConfig.techBase === 'Mixed' as const;

  // Debug log for isMixed and techProgression
  console.log('[OverviewTabV2] isMixed:', isMixed, 'techProgression:', enhancedConfig.techProgression);

  console.log('[DEBUG] Render OverviewTabV2', {
    techBase: enhancedConfig.techBase,
    techProgression: enhancedConfig.techProgression
  })

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
              <div className="text-slate-300 font-medium">{config.chassis} {config.model}</div>
              <div className="text-slate-400 text-sm">{config.tonnage}-ton {config.unitType}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 min-h-0 px-4 pb-4">
        <div className="h-full overflow-y-auto">
          {/* Two-column layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column: Tech Base & Introduction (2/3 width) */}
            <div className="xl:col-span-2 space-y-6">
          
          {/* Unit Identity Panel - Tech Base & Introduction Year */}
          <UnitIdentityPanel
            techBase={enhancedConfig.techBase}
            introductionYear={enhancedConfig.introductionYear}
            readOnly={readOnly}
            onTechBaseChange={handleMasterTechBaseChange}
            onIntroductionYearChange={(year) => handleConfigUpdate({ introductionYear: year })}
          />

          {/* Tech Progression Panel */}
          <TechProgressionPanel
            techProgression={enhancedConfig.techProgression}
            currentConfig={enhancedConfig}
            readOnly={readOnly}
            renderKey={renderKey}
            onTechProgressionChange={handleTechProgressionChange}
            isMixed={isMixed}
          />
            </div>

            {/* Right Column: Tech Rating Timeline (1/3 width) */}
            <div className="space-y-6">
              {/* Tech Rating Panel */}
              <TechRatingPanel
                techRating={enhancedConfig.techRating}
                introductionYear={enhancedConfig.introductionYear}
              />

              {/* Overview Summary Panel */}
              <OverviewSummaryPanel
                rulesLevel={enhancedConfig.rulesLevel}
                techBase={enhancedConfig.techBase}
                introductionYear={enhancedConfig.introductionYear}
                unitConfig={config}
                readOnly={readOnly}
                onRulesLevelChange={(rulesLevel) => handleConfigUpdate({ rulesLevel })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OverviewTabV2
