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
  generateTechBaseString,
  isMixedTech
} from '../../utils/techProgression'
import { 
  autoUpdateTechRating,
  getEraForYear
} from '../../utils/techRating'

// Import extracted components
import TechProgressionPanel from './TechProgressionPanel'
import UnitIdentityPanel from './UnitIdentityPanel'
import TechRatingPanel from './TechRatingPanel'
import OverviewSummaryPanel from './OverviewSummaryPanel'

export interface OverviewTabV2Props {
  readOnly?: boolean
}

export const OverviewTabV2: React.FC<OverviewTabV2Props> = ({ readOnly = false }) => {
  console.log(`[OverviewTabV2] 🔥 Component rendered with readOnly: ${readOnly}`)
  
  const { unit, isConfigLoaded, updateConfiguration } = useUnit()
  const config = useMemo(() => unit?.getConfiguration(), [unit])
  
  console.log(`[OverviewTabV2] 🔥 Unit state:`, { 
    hasUnit: !!unit, 
    isConfigLoaded, 
    hasConfig: !!config,
    configKeys: config ? Object.keys(config) : []
  })
  
  // State management
  const [renderKey, setRenderKey] = useState(0)
  
  // Early return if not loaded
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

  // Handle configuration updates with auto-calculation
  const handleConfigUpdate = (updates: any) => {
    console.log('[OverviewTab] Updating configuration:', updates)
    
    const newConfig = { ...enhancedConfig, ...updates }
    
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

  // Handle tech progression changes with simplified approach
  const handleTechProgressionChange = (subsystem: keyof TechProgression, newTechBase: 'Inner Sphere' | 'Clan') => {
    console.log(`[OverviewTab] 🔥 Tech progression change: ${subsystem} → ${newTechBase}`)
    console.log(`[OverviewTab] 🔥 ReadOnly state: ${readOnly}`)
    
    if (readOnly) {
      console.log('[OverviewTab] Skipping update - readonly mode')
      return
    }
    
    try {
      // Get current configuration
      const currentConfig = unit?.getConfiguration()
      if (!currentConfig) {
        console.error('[OverviewTab] No current configuration available')
        return
      }
      
      console.log(`[OverviewTab] 🔥 Current config before update:`, currentConfig)
      
      // Update tech progression (cast to any since techProgression is not in the official interface)
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
      
      // Update the configuration with new tech progression
      const updatedConfig = {
        ...currentConfig,
        techProgression: newProgression
      }
      
      console.log(`[OverviewTab] 🔥 Updating configuration with new tech progression:`, {
        subsystem,
        newTechBase,
        newProgression,
        updatedConfig
      })
      
      // Apply the update
      updateConfiguration(updatedConfig)
      
      // Force re-render
      setRenderKey(prev => prev + 1)
      
    } catch (error) {
      console.error('[OverviewTab] Error updating tech progression:', error)
    }
  }

  // Handle master tech base change
  const handleMasterTechBaseChange = (newTechBase: string) => {
    console.log(`[OverviewTab] 🔥 handleMasterTechBaseChange fired with:`, newTechBase)
    console.log(`[OverviewTab] 🔥 ReadOnly state: ${readOnly}`)
    
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
      } else if (newTechBase === 'Inner Sphere' || newTechBase === 'Clan') {
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
      } else {
        console.error('[OverviewTab] Invalid tech base:', newTechBase)
        return
      }
      const updatedConfig = {
        ...currentConfig,
        techBase: newTechBase as 'Inner Sphere' | 'Clan',
        techProgression: newProgression
      }
      console.log(`[OverviewTab] 🔥 Calling updateConfiguration with:`, updatedConfig)
      updateConfiguration(updatedConfig)
      setRenderKey(prev => prev + 1)
    } catch (error) {
      console.error('[OverviewTab] Error updating master tech base:', error)
    }
  }

  // Calculate current era and determine tech base status
  const currentEra = getEraForYear(enhancedConfig.introductionYear)
  const isMixedTechEnabled = (enhancedConfig.techBase as string) === 'Mixed'
  const primaryTechBase = enhancedConfig.techBase // Use the actual tech base setting
  const isMixed = isMixedTech(enhancedConfig.techProgression)

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
