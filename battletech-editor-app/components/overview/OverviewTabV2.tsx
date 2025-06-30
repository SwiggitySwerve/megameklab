/**
 * Overview Tab V2 - BattleTech unit overview with tech progression and rating system
 * Handles tech base, introduction year, rules level, and granular tech progression
 */

import React, { useState, useEffect } from 'react'
import { useUnit } from '../../components/multiUnit/MultiUnitProvider'
import { 
  TechProgression, 
  TechRating,
  updateTechProgression,
  generateTechBaseString,
  isMixedTech,
  getPrimaryTechBase
} from '../../utils/techProgression'
import { 
  calculateTechRating,
  autoUpdateTechRating,
  getTechRatingDescription,
  getEraForYear,
  TECH_ERAS
} from '../../utils/techRating'
import {
  resolveComponentForTechBase
} from '../../utils/componentResolution'
import { 
  getAvailableComponents,
  ComponentCategory,
  TechBase
} from '../../utils/componentAvailability'

/**
 * Rules level options
 */
const RULES_LEVELS = [
  { value: 'Introductory', label: 'Introductory', description: 'Basic rules, common technology' },
  { value: 'Standard', label: 'Standard', description: 'Tournament legal, standard rules' },
  { value: 'Advanced', label: 'Advanced', description: 'Complex rules, rare technology' },
  { value: 'Experimental', label: 'Experimental', description: 'Prototype technology, special rules' }
] as const

/**
 * Tech base options for overview
 */
const TECH_BASE_OPTIONS = [
  { value: 'Inner Sphere', label: 'Inner Sphere', description: 'Standard Inner Sphere technology' },
  { value: 'Clan', label: 'Clan', description: 'Advanced Clan technology' },
  { value: 'Mixed', label: 'Mixed Tech', description: 'Combination of IS and Clan technology' }
] as const

/**
 * Subsystem labels for tech progression matrix
 */
const SUBSYSTEM_LABELS = {
  chassis: 'Tech/Chassis',
  gyro: 'Tech/Gyro', 
  engine: 'Tech/Engine',
  heatsink: 'Tech/Heatsink',
  targeting: 'Tech/Targeting',
  myomer: 'Tech/Myomer',
  movement: 'Tech/Movement',
  armor: 'Tech/Armor'
} as const

/**
 * Era icons for tech rating display
 */
const ERA_ICONS = {
  '2100-2800': '🏛️',
  '2801-3050': '⚔️', 
  '3051-3082': '🔥',
  '3083-Now': '🌟'
} as const

export interface OverviewTabV2Props {
  readOnly?: boolean
}

export const OverviewTabV2: React.FC<OverviewTabV2Props> = ({ readOnly = false }) => {
  const { unit, updateConfiguration, isConfigLoaded } = useUnit()
  
  // Force re-render when tech progression changes by using a counter
  const [renderKey, setRenderKey] = useState(0)
  
  if (!isConfigLoaded || !unit) {
    return (
      <div className="p-6 text-center text-slate-400">
        <div className="animate-pulse">Loading unit configuration...</div>
      </div>
    )
  }

  // Get fresh config every render to ensure we have latest state
  const config = unit.getConfiguration()
  
  // Initialize config with defaults only once
  const [hasInitialized, setHasInitialized] = useState(false)
  
  // Initialize enhanced fields on first load
  useEffect(() => {
    if (!hasInitialized && isConfigLoaded && unit) {
      console.log('[OverviewTab] Initializing enhanced config fields')
      
      // Get fresh config at initialization time
      const currentConfig = unit.getConfiguration()
      const updates: any = {}
      
      // Only set defaults if fields don't exist
      if (!(currentConfig as any).introductionYear) {
        updates.introductionYear = 3025
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
      
      // Only update if we have changes
      if (Object.keys(updates).length > 0) {
        console.log('[OverviewTab] Setting default values:', updates)
        updateConfiguration({ ...currentConfig, ...updates })
      }
      
      setHasInitialized(true)
    }
  }, [isConfigLoaded, hasInitialized, unit, updateConfiguration])
  
  // Enhanced configuration - use actual config values directly
  const enhancedConfig = {
    ...config,
    introductionYear: (config as any).introductionYear || 3025,
    rulesLevel: (config as any).rulesLevel || 'Standard',
    techBase: config.techBase || 'Inner Sphere',
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
  
  console.log('[OverviewTab] Tech progression state:', enhancedConfig.techProgression)

  // Helper function to get current component for a subsystem
  const getCurrentComponentForSubsystem = (subsystem: keyof TechProgression, config: any): string => {
    const propertyMap = {
      chassis: 'structureType',
      gyro: 'gyroType', 
      engine: 'engineType',
      heatsink: 'heatSinkType',
      myomer: 'enhancementType',
      armor: 'armorType',
      targeting: 'targetingType',
      movement: 'movementType'
    };
    
    const property = propertyMap[subsystem];
    return property ? (config[property] || 'Standard') : 'Standard';
  }

  // Helper function to get config property for subsystem
  const getConfigPropertyForSubsystem = (subsystem: keyof TechProgression): string | null => {
    const propertyMap = {
      chassis: 'structureType',
      gyro: 'gyroType', 
      engine: 'engineType',
      heatsink: 'heatSinkType',
      myomer: 'enhancementType',
      armor: 'armorType',
      targeting: 'targetingType',
      movement: 'movementType'
    };
    
    return propertyMap[subsystem] || null;
  }

  // Handle configuration updates with auto-calculation
  const handleConfigUpdate = (updates: any) => {
    console.log('[OverviewTab] Updating configuration:', updates)
    
    let newConfig = { ...enhancedConfig, ...updates }
    
    // Auto-update tech rating when year or progression changes
    if ('introductionYear' in updates || 'techProgression' in updates) {
      const year = updates.introductionYear || enhancedConfig.introductionYear
      const progression = updates.techProgression || enhancedConfig.techProgression
      
      newConfig.techRating = autoUpdateTechRating(year, progression, newConfig)
      console.log('[OverviewTab] Auto-updated tech rating:', newConfig.techRating)
    }
    
    // Only update tech base string when NOT in mixed mode, or when explicitly changing tech base
    if ('techProgression' in updates && !('techBase' in updates) && (enhancedConfig.techBase as string) !== 'Mixed') {
      const progression = updates.techProgression
      newConfig.techBase = generateTechBaseString(progression)
      console.log('[OverviewTab] Updated tech base string:', newConfig.techBase)
    }
    
    updateConfiguration(newConfig)
  }

  // Handle tech progression changes with immediate state update
  const handleTechProgressionChange = (subsystem: keyof TechProgression, techBase: 'Inner Sphere' | 'Clan') => {
    console.log(`[OverviewTab] BUTTON CLICKED: ${subsystem} → ${techBase}`)
    console.log(`[OverviewTab] ReadOnly status: ${readOnly}`)
    console.log(`[OverviewTab] Current value for ${subsystem}:`, enhancedConfig.techProgression[subsystem])
    
    if (readOnly) {
      console.log('[OverviewTab] Skipping update - readonly mode')
      return
    }
    
    // ✅ ALLOW ALL CLICKS - Let user toggle even if "same" value for visual feedback
    console.log(`[OverviewTab] Processing tech progression change (current: ${enhancedConfig.techProgression[subsystem]} → new: ${techBase})`)
    
    try {
      const newProgression = updateTechProgression(enhancedConfig.techProgression, subsystem, techBase)
      
      console.log(`[OverviewTab] Tech progression change: ${subsystem} → ${techBase}`)
      console.log(`[OverviewTab] Current progression:`, enhancedConfig.techProgression)
      console.log(`[OverviewTab] New progression:`, newProgression)
      
      // Verify the change actually happened
      if (newProgression[subsystem] !== techBase) {
        console.error(`[OverviewTab] CRITICAL: Tech progression update failed! Expected ${techBase}, got ${newProgression[subsystem]}`)
        return
      }
      
      // Update the actual unit configuration based on the new tech progression
      let updatedConfig = {}
      try {
        // Get current component for this subsystem
        const currentComponent = getCurrentComponentForSubsystem(subsystem, enhancedConfig);
        const newComponent = resolveComponentForTechBase(currentComponent, subsystem as ComponentCategory, techBase);
        
        if (newComponent !== currentComponent) {
          const configProperty = getConfigPropertyForSubsystem(subsystem);
          if (configProperty) {
            updatedConfig = { [configProperty]: newComponent };
            console.log(`[OverviewTab] Component update: ${subsystem} ${currentComponent} → ${newComponent}`);
          }
        }
      } catch (resolutionError) {
        console.warn('[OverviewTab] Error resolving component configuration:', resolutionError)
        // Continue with just the tech progression update
      }
      
      const finalConfig = { 
        techProgression: newProgression,
        ...updatedConfig
      }
      
      console.log(`[OverviewTab] Calling handleConfigUpdate with:`, finalConfig)
      
      handleConfigUpdate(finalConfig)
      
      // Force immediate re-render to ensure visual state updates
      setRenderKey(prev => prev + 1)
      
      console.log(`[OverviewTab] State update completed for ${subsystem} → ${techBase}`)
    } catch (error) {
      console.error('[OverviewTab] Error in tech progression change:', error)
    }
  }

  // Handle master tech base change
  const handleMasterTechBaseChange = (newTechBase: string) => {
    console.log(`[OverviewTab] TECH BASE CHANGE TRIGGERED: ${newTechBase}`)
    console.log(`[OverviewTab] Current readOnly: ${readOnly}`)
    console.log(`[OverviewTab] Current techBase: ${enhancedConfig.techBase}`)
    
    if (readOnly) {
      console.log('[OverviewTab] Skipping - readonly mode')
      return
    }
    
    let newProgression: TechProgression
    let updatedConfig = {}
    
    if (newTechBase === 'Mixed') {
      console.log('[OverviewTab] Setting to Mixed Tech - keeping current progression')
      // Keep current progression for mixed tech
      newProgression = enhancedConfig.techProgression
    } else if (newTechBase === 'Inner Sphere' || newTechBase === 'Clan') {
      console.log(`[OverviewTab] Setting all subsystems to ${newTechBase}`)
      // Set all subsystems to the selected tech base
      newProgression = {
        chassis: newTechBase,
        gyro: newTechBase,
        engine: newTechBase,
        heatsink: newTechBase,
        targeting: newTechBase,
        myomer: newTechBase,
        movement: newTechBase,
        armor: newTechBase
      }
      
      // Update all component configurations to match the new tech base
      try {
        // Resolve all components for the new tech base
        const componentUpdates: any = {};
        Object.keys(newProgression).forEach(subsystem => {
          const currentComponent = getCurrentComponentForSubsystem(subsystem as keyof TechProgression, enhancedConfig);
          const newComponent = resolveComponentForTechBase(currentComponent, subsystem as ComponentCategory, newTechBase as TechBase);
          
          if (newComponent !== currentComponent) {
            const configProperty = getConfigPropertyForSubsystem(subsystem as keyof TechProgression);
            if (configProperty) {
              componentUpdates[configProperty] = newComponent;
              console.log(`[OverviewTab] ${subsystem}: ${currentComponent} → ${newComponent}`);
            }
          }
        });
        updatedConfig = componentUpdates;
        console.log(`[OverviewTab] Component updates:`, updatedConfig)
      } catch (error) {
        console.error('[OverviewTab] Error updating configuration:', error)
      }
      
      console.log(`[OverviewTab] Master tech base change: ${enhancedConfig.techBase} → ${newTechBase}`)
    } else {
      console.log(`[OverviewTab] Unknown tech base: ${newTechBase}, using current progression`)
      // Fallback to current progression for unknown tech base
      newProgression = enhancedConfig.techProgression
    }
    
    const finalConfig = { 
      techBase: newTechBase,
      techProgression: newProgression,
      ...updatedConfig
    }
    
    console.log(`[OverviewTab] Final config update:`, finalConfig)
    handleConfigUpdate(finalConfig)
  }

  // Calculate current era and determine tech base status
  const currentEra = getEraForYear(enhancedConfig.introductionYear)
  const isMixedTechEnabled = (enhancedConfig.techBase as string) === 'Mixed'
  const primaryTechBase = enhancedConfig.techBase // Use the actual tech base setting
  const isMixed = isMixedTech(enhancedConfig.techProgression)

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
          
          {/* Tech Base & Introduction Year */}
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 shadow-lg">
            <h3 className="text-slate-100 font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Technology Foundation
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tech Base Selection */}
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-2">Tech Base</label>
                <select
                  value={enhancedConfig.techBase}
                  onChange={(e) => {
                    console.log(`[OverviewTab] DROPDOWN CHANGE EVENT: ${e.target.value}`)
                    handleMasterTechBaseChange(e.target.value)
                  }}
                  disabled={readOnly}
                  className="w-full px-3 py-2 bg-slate-700/80 border border-slate-600/50 rounded-md text-sm text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                >
                  {TECH_BASE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-slate-400 mt-1">
                  {isMixedTechEnabled ? 'Mixed technology configuration' : `All systems use ${enhancedConfig.techBase} technology`}
                </div>
              </div>

              {/* Introduction Year */}
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-2">Introduction Year</label>
                <input
                  type="number"
                  min="2005"
                  max="3200"
                  step="1"
                  value={enhancedConfig.introductionYear}
                  onChange={(e) => handleConfigUpdate({ introductionYear: parseInt(e.target.value) || 3025 })}
                  disabled={readOnly}
                  className="w-full px-3 py-2 bg-slate-700/80 border border-slate-600/50 rounded-md text-sm text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
                <div className="text-xs text-slate-400 mt-1">
                  Era: {currentEra} • Year of first production
                </div>
              </div>
            </div>
          </div>

          {/* Tech Progression Matrix */}
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 shadow-lg">
            <h3 className="text-slate-100 font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Technology Progression
            </h3>
            
            <div key={`tech-progression-${renderKey}-${JSON.stringify(enhancedConfig.techProgression)}`} className="space-y-2">
              {Object.entries(SUBSYSTEM_LABELS).map(([subsystem, label]) => {
                const currentTechBase = enhancedConfig.techProgression[subsystem as keyof TechProgression];
                
                // Get current component value using our helper function
                const currentValue = getCurrentComponentForSubsystem(subsystem as keyof TechProgression, enhancedConfig);
                
                return (
                  <div key={subsystem} className="grid grid-cols-3 gap-2 items-center">
                    {/* Subsystem Label with Current Component */}
                    <div className="text-slate-300 text-xs font-medium">
                      <div>{label}</div>
                      {currentValue && (
                        <div className="text-slate-500 text-xs mt-0.5 truncate">
                          {currentValue}
                        </div>
                      )}
                    </div>
                    
                    {/* Inner Sphere Option */}
                    <button
                      onClick={() => handleTechProgressionChange(subsystem as keyof TechProgression, 'Inner Sphere')}
                      disabled={readOnly}
                      className={`px-2 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                        currentTechBase === 'Inner Sphere'
                          ? 'bg-orange-600 text-white border border-orange-500 shadow-md'
                          : 'bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:border-orange-500/50 hover:bg-slate-600/50'
                      }`}
                    >
                      Inner Sphere
                    </button>
                    
                    {/* Clan Option */}
                    <button
                      onClick={() => handleTechProgressionChange(subsystem as keyof TechProgression, 'Clan')}
                      disabled={readOnly}
                      className={`px-2 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                        currentTechBase === 'Clan'
                          ? 'bg-green-600 text-white border border-green-500 shadow-md'
                          : 'bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:border-green-500/50 hover:bg-slate-600/50'
                      }`}
                    >
                      Clan
                    </button>
                  </div>
                );
              })}
            </div>
            
            {isMixed && (
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600/30 rounded-md">
                <div className="text-blue-300 text-sm font-medium mb-1">Mixed Technology Configuration</div>
                <div className="text-blue-200 text-xs">
                  This unit combines Inner Sphere and Clan technologies. Each subsystem can be configured independently.
                </div>
              </div>
            )}
          </div>

          {/* Rules Level */}
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 shadow-lg">
            <h3 className="text-slate-100 font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              Rules Level
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {RULES_LEVELS.map(level => (
                <button
                  key={level.value}
                  onClick={() => handleConfigUpdate({ rulesLevel: level.value })}
                  disabled={readOnly}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                    enhancedConfig.rulesLevel === level.value
                      ? 'bg-yellow-600/20 border-yellow-500 text-yellow-100'
                      : 'bg-slate-700/30 border-slate-600/50 text-slate-300 hover:border-yellow-500/50 hover:bg-slate-600/30'
                  }`}
                >
                  <div className="font-medium text-sm">{level.label}</div>
                  <div className="text-xs opacity-75 mt-1">{level.description}</div>
                </button>
              ))}
            </div>
          </div>
            </div>

            {/* Right Column: Tech Rating Timeline (1/3 width) */}
            <div className="space-y-6">
              {/* Tech Rating Timeline */}
              <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 shadow-lg">
                <h3 className="text-slate-100 font-semibold text-lg mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                  Tech Rating
                </h3>
                
                <div className="space-y-3">
                  {Object.entries(TECH_ERAS).map(([era, info]) => {
                    const rating = enhancedConfig.techRating[era as keyof TechRating]
                    const isCurrentEra = enhancedConfig.introductionYear >= info.start && enhancedConfig.introductionYear <= info.end
                    
                    // Rating color scheme
                    const getRatingColor = (r: string) => {
                      switch (r) {
                        case 'A': return 'text-green-400 bg-green-900/30 border-green-600/50'
                        case 'B': return 'text-blue-400 bg-blue-900/30 border-blue-600/50'
                        case 'C': return 'text-yellow-400 bg-yellow-900/30 border-yellow-600/50'
                        case 'D': return 'text-orange-400 bg-orange-900/30 border-orange-600/50'
                        case 'E': return 'text-red-400 bg-red-900/30 border-red-600/50'
                        case 'F': return 'text-purple-400 bg-purple-900/30 border-purple-600/50'
                        case 'X': return 'text-gray-400 bg-gray-900/30 border-gray-600/50'
                        default: return 'text-slate-400 bg-slate-900/30 border-slate-600/50'
                      }
                    }
                    
                    return (
                      <div
                        key={era}
                        className={`p-3 rounded-lg border ${getRatingColor(rating)} ${
                          isCurrentEra ? 'ring-2 ring-cyan-500/50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{ERA_ICONS[era as keyof typeof ERA_ICONS]}</span>
                            <span className="font-medium text-sm text-slate-200">
                              {era.replace('-', ' – ')}
                            </span>
                          </div>
                          <div className={`font-bold text-lg ${getRatingColor(rating)}`}>
                            {rating}
                          </div>
                        </div>
                        <div className="text-xs opacity-75">{info.name}</div>
                        {isCurrentEra && (
                          <div className="text-xs text-cyan-400 mt-1 font-medium">
                            Introduction Era
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                
                {/* Rating Legend */}
                <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
                  <div className="text-slate-300 font-medium text-sm mb-2">Rating Scale</div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="text-green-400">A: Common</div>
                    <div className="text-blue-400">B: Uncommon</div>
                    <div className="text-yellow-400">C: Rare</div>
                    <div className="text-orange-400">D: Very Rare</div>
                    <div className="text-red-400">E: Experimental</div>
                    <div className="text-purple-400">F: Primitive</div>
                    <div className="text-gray-400 col-span-2">X: Unavailable</div>
                  </div>
                </div>
              </div>

              {/* Unit Summary */}
              <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 shadow-lg">
                <h3 className="text-slate-100 font-semibold text-lg mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Unit Summary
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tonnage</span>
                    <span className="text-slate-200 font-medium">{config.tonnage}t</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Configuration</span>
                    <span className="text-slate-200 font-medium">Biped BattleMech</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tech Base</span>
                    <span className="text-slate-200 font-medium">{primaryTechBase}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Introduction</span>
                    <span className="text-slate-200 font-medium">{enhancedConfig.introductionYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rules Level</span>
                    <span className="text-slate-200 font-medium">{enhancedConfig.rulesLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Era</span>
                    <span className="text-slate-200 font-medium">{currentEra}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OverviewTabV2
