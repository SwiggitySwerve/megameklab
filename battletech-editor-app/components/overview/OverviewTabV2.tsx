/**
 * Overview Tab V2 - BattleTech unit overview with tech progression and rating system
 * Handles tech base, introduction year, rules level, and granular tech progression
 * 
 * Phase 4: Component Modularization - Day 15
 * Refactored from 992 lines → orchestrator + 4 focused components
 */

import React, { useState, useEffect } from 'react'
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
  updateMemoryState
} from '../../utils/memoryPersistence'

// Import extracted components
import TechProgressionPanel from './TechProgressionPanel'
import UnitIdentityPanel from './UnitIdentityPanel'
import TechRatingPanel from './TechRatingPanel'
import OverviewSummaryPanel from './OverviewSummaryPanel'

export interface OverviewTabV2Props {
  readOnly?: boolean
}

export const OverviewTabV2: React.FC<OverviewTabV2Props> = ({ readOnly = false }) => {
  const { unit, updateConfiguration, isConfigLoaded } = useUnit()
  
  // Force re-render when tech progression changes by using a counter
  const [renderKey, setRenderKey] = useState(0)
  
  // Memory system state
  const [memoryState, setMemoryState] = useState<ComponentMemoryState | null>(null)
  
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
  
  // Track if memory restoration is pending due to component unavailability
  const [needsMemoryRestoration, setNeedsMemoryRestoration] = useState(false)
  
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
  
  // Initialize enhanced fields and memory system on first load - FIXED: Remove updateConfiguration dependency
  useEffect(() => {
    if (!hasInitialized && isConfigLoaded && unit) {
      console.log('[OverviewTab] 💾 🚀 ONE-TIME INITIALIZATION - Enhanced config fields and memory system')
      
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
  }, [isConfigLoaded, hasInitialized, unit]) // FIXED: Removed updateConfiguration dependency
  
  // 🔥 NEW: Retry restoration when components become available
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
    try {
      // Use correct import path
      const { isComponentAvailable } = require('../../utils/componentDatabaseHelpers')
      
      // Quick test to see if component system is working
      const testResult = isComponentAvailable('None', 'myomer', 'Inner Sphere')
      if (testResult === undefined || testResult === null) {
        componentsAvailable = false
      }
    } catch (error: any) {
      console.log('[OverviewTab] 💾 ⚠️ Component system not ready, deferring restoration:', error.message)
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
  
  // 🔥 SIMPLIFIED: Update memory only when user makes changes, not on every render
  const updateMemoryFromConfig = React.useCallback(() => {
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
      
      const updatedMemory = initializeMemoryFromConfiguration(
        currentProgression,
        currentComponents
      )
      
      const newMemoryState = updateMemoryState(memoryState, updatedMemory)
      setMemoryState(newMemoryState)
    }
  }, [memoryState, isConfigLoaded, config])
  
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
    if (!property) return 'Standard';
    
    const value = config[property];
    
    // Handle ComponentConfiguration objects by extracting the type property
    if (value && typeof value === 'object' && 'type' in value) {
      return value.type;
    }
    
    // Handle string values or fallback to default
    return value || 'Standard';
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

  // Handle tech progression changes with memory-first approach
  const handleTechProgressionChange = (subsystem: keyof TechProgression, newTechBase: 'Inner Sphere' | 'Clan') => {
    console.log(`[OverviewTab] BUTTON CLICKED: ${subsystem} → ${newTechBase}`)
    console.log(`[OverviewTab] ReadOnly status: ${readOnly}`)
    
    if (readOnly) {
      console.log('[OverviewTab] Skipping update - readonly mode')
      return
    }
    
    try {
      // 🔥 STEP 1: CAPTURE CURRENT STATE BEFORE ANY CHANGES
      const oldTechBase = enhancedConfig.techProgression[subsystem];
      const currentComponent = getCurrentComponentForSubsystem(subsystem, enhancedConfig);
      
      console.log(`[OverviewTab] MEMORY FLOW: ${subsystem} (${oldTechBase} → ${newTechBase})`);
      console.log(`[OverviewTab] Current component: ${currentComponent}`);
      
      // Skip if no actual change (but allow for visual feedback)
      if (oldTechBase === newTechBase) {
        console.log(`[OverviewTab] No tech base change needed for ${subsystem}, but allowing for UI feedback`);
      }
      
      let componentToApply = currentComponent;
      let updatedMemoryState = memoryState;
      
      // 🔥 STEP 2: HANDLE MEMORY OPERATIONS IF AVAILABLE
      if (memoryState && oldTechBase !== newTechBase) {
        const resolution = validateAndResolveComponentWithMemory(
          currentComponent,
          subsystem as ComponentCategory,
          oldTechBase,
          newTechBase,
          memoryState.techBaseMemory,
          enhancedConfig.rulesLevel as any
        );
        
        console.log(`[OverviewTab] 🧠 Memory resolution: ${resolution.resolutionReason}`);
        console.log(`[OverviewTab] 🧠 Component change: ${currentComponent} → ${resolution.resolvedComponent}`);
        console.log(`[OverviewTab] 🧠 Was restored from memory: ${resolution.wasRestored}`);
        
        // Update memory state and component to apply
        updatedMemoryState = updateMemoryState(memoryState, resolution.updatedMemory);
        setMemoryState(updatedMemoryState);
        componentToApply = resolution.resolvedComponent;
      } else if (!memoryState) {
        // Fallback resolution without memory
        componentToApply = resolveComponentForTechBase(currentComponent, subsystem as ComponentCategory, newTechBase);
        console.log(`[OverviewTab] 🔄 Fallback resolution: ${currentComponent} → ${componentToApply}`);
      }
      
      // 🔥 STEP 3: UPDATE TECH PROGRESSION
      const newProgression = updateTechProgression(enhancedConfig.techProgression, subsystem, newTechBase);
      
      console.log(`[OverviewTab] ✅ Tech progression updated:`, {
        old: enhancedConfig.techProgression,
        new: newProgression
      });
      
      // 🔥 STEP 4: PREPARE COMPONENT CONFIGURATION UPDATE
      let componentConfig = {};
      if (componentToApply !== currentComponent) {
        const configProperty = getConfigPropertyForSubsystem(subsystem);
        if (configProperty) {
          componentConfig = { [configProperty]: componentToApply };
          console.log(`[OverviewTab] 🔧 Component config update: ${configProperty} = ${componentToApply}`);
          
          // 🔥 SPECIAL HANDLING FOR ARMOR TONNAGE PRESERVATION
          if (subsystem === 'armor' && 'armorTonnage' in enhancedConfig) {
            try {
              // Import needed functions directly to avoid circular dependencies
              const { getArmorType } = require('../../utils/armorTypes');
              const { calculateMaxArmorTonnage } = require('../../utils/armorAllocation');
              
              // Get current armor tonnage
              const currentArmorTonnage = enhancedConfig.armorTonnage || 0;
              console.log(`[OverviewTab] 🛡️ Current armor tonnage: ${currentArmorTonnage}t`);
              
              // Create a simple unit object with the necessary properties for calculateMaxArmorTonnage
              const unitObj = {
                mass: enhancedConfig.tonnage || 50,
                getMaxArmorTonnage: () => {
                  const armorType = getArmorType(componentToApply);
                  return calculateMaxArmorTonnage({ mass: enhancedConfig.tonnage || 50 }, armorType);
                }
              };
              
              // Calculate max armor tonnage for the new armor type
              const newMaxArmorTonnage = unitObj.getMaxArmorTonnage();
              console.log(`[OverviewTab] 🛡️ New maximum armor tonnage: ${newMaxArmorTonnage}t`);
              
              // Preserve tonnage, but cap at new maximum
              const preservedArmorTonnage = Math.min(currentArmorTonnage, newMaxArmorTonnage);
              console.log(`[OverviewTab] 🛡️ Preserved armor tonnage: ${preservedArmorTonnage}t`);
              
              // Add armorTonnage to the component update
              componentConfig = {
                ...componentConfig,
                armorTonnage: preservedArmorTonnage
              };
            } catch (error) {
              console.error('[OverviewTab] Error preserving armor tonnage:', error);
            }
          }
        }
      }
      
      // 🔥 STEP 5: APPLY ALL CHANGES TOGETHER
      const finalConfig = { 
        techProgression: newProgression,
        ...componentConfig
      };
      
      console.log(`[OverviewTab] 🚀 Final config update:`, finalConfig);
      
      handleConfigUpdate(finalConfig);
      
      // Force immediate re-render to ensure visual state updates
      setRenderKey(prev => prev + 1);
      
      console.log(`[OverviewTab] ✅ Memory-aware update completed for ${subsystem} → ${newTechBase}`);
      
    } catch (error) {
      console.error('[OverviewTab] Error in memory-aware tech progression change:', error);
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
        // 🔥 MEMORY-FIRST APPROACH: Capture current state before any changes
        const componentUpdates: any = {};
        let updatedMemoryState = memoryState;
        
        // Process each subsystem with memory-first approach
        Object.keys(newProgression).forEach(subsystem => {
          // Capture current state BEFORE any changes
          const currentComponent = getCurrentComponentForSubsystem(subsystem as keyof TechProgression, enhancedConfig);
          const oldTechBase = enhancedConfig.techProgression[subsystem as keyof TechProgression];
          
          console.log(`[OverviewTab] 🔥 Master ${subsystem}: ${oldTechBase} → ${newTechBase}, component: ${currentComponent}`);
          
          if (memoryState && updatedMemoryState && oldTechBase !== newTechBase) {
            // Use memory-aware resolution for master tech base change
            const resolution = validateAndResolveComponentWithMemory(
              currentComponent,
              subsystem as ComponentCategory,
              oldTechBase,
              newTechBase as TechBase,
              updatedMemoryState.techBaseMemory,
              enhancedConfig.rulesLevel as any
            );
            
            console.log(`[OverviewTab] 🧠 Master ${subsystem}: ${resolution.resolutionReason}`);
            console.log(`[OverviewTab] 🧠 Master ${subsystem}: ${currentComponent} → ${resolution.resolvedComponent}, restored: ${resolution.wasRestored}`);
            
            // Update memory state with each resolution
            updatedMemoryState = updateMemoryState(updatedMemoryState, resolution.updatedMemory);
            
            // Apply component change if different
            if (resolution.resolvedComponent !== currentComponent) {
              const configProperty = getConfigPropertyForSubsystem(subsystem as keyof TechProgression);
              if (configProperty) {
                componentUpdates[configProperty] = resolution.resolvedComponent;
                console.log(`[OverviewTab] 🔧 Master config: ${configProperty} = ${resolution.resolvedComponent}`);
                
                // 🔥 SPECIAL HANDLING FOR ARMOR TONNAGE PRESERVATION
                if (subsystem === 'armor' && 'armorTonnage' in enhancedConfig) {
                  try {
                    // Import needed functions directly
                    const { getArmorType } = require('../../utils/armorTypes');
                    const { calculateMaxArmorTonnage } = require('../../utils/armorAllocation');
                    
                    // Get current armor tonnage
                    const currentArmorTonnage = enhancedConfig.armorTonnage || 0;
                    console.log(`[OverviewTab] 🛡️ Master: Current armor tonnage: ${currentArmorTonnage}t`);
                    
                    // Create a simple unit object with necessary properties
                    const unitObj = {
                      mass: enhancedConfig.tonnage || 50,
                      getMaxArmorTonnage: () => {
                        const armorType = getArmorType(resolution.resolvedComponent);
                        return calculateMaxArmorTonnage({ mass: enhancedConfig.tonnage || 50 }, armorType);
                      }
                    };
                    
                    // Calculate max armor tonnage for the new armor type
                    const newMaxArmorTonnage = unitObj.getMaxArmorTonnage();
                    console.log(`[OverviewTab] 🛡️ Master: New maximum armor tonnage: ${newMaxArmorTonnage}t`);
                    
                    // Preserve tonnage, but cap at new maximum
                    const preservedArmorTonnage = Math.min(currentArmorTonnage, newMaxArmorTonnage);
                    console.log(`[OverviewTab] 🛡️ Master: Preserved armor tonnage: ${preservedArmorTonnage}t`);
                    
                    // Add armorTonnage to the component update
                    componentUpdates.armorTonnage = preservedArmorTonnage;
                  } catch (error) {
                    console.error('[OverviewTab] Error preserving armor tonnage in master change:', error);
                  }
                }
              }
            }
          } else if (!memoryState) {
            // Fallback resolution without memory
            const newComponent = resolveComponentForTechBase(currentComponent, subsystem as ComponentCategory, newTechBase as TechBase);
            
            if (newComponent !== currentComponent) {
              const configProperty = getConfigPropertyForSubsystem(subsystem as keyof TechProgression);
              if (configProperty) {
                componentUpdates[configProperty] = newComponent;
                console.log(`[OverviewTab] 🔄 Master fallback ${subsystem}: ${currentComponent} → ${newComponent}`);
              }
            }
          }
        });
        
        // Update memory state if we have changes
        if (updatedMemoryState && updatedMemoryState !== memoryState) {
          setMemoryState(updatedMemoryState);
          console.log(`[OverviewTab] 💾 Master memory state updated`);
        }
        
        updatedConfig = componentUpdates;
        console.log(`[OverviewTab] 🚀 Master tech base component updates:`, updatedConfig)
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
