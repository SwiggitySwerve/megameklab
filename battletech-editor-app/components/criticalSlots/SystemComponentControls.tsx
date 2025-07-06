/**
 * System Component Controls - Comprehensive mech configuration
 * Dark theme component with all mech component selections
 */

import React, { useState, useCallback } from 'react'
import { useUnit } from '../multiUnit/MultiUnitProvider'
import { EngineType, GyroType } from '../../utils/criticalSlots/SystemComponentRules'
import { 
  StructureType, 
  ArmorType, 
  HeatSinkType, 
  UnitConfigurationBuilder, 
  UnitConfiguration
} from '../../utils/criticalSlots/UnitCriticalManager'
import { 
  getAvailableStructureTypes, 
  getAvailableArmorTypes, 
  getAvailableEngineTypes,
  getAvailableHeatSinkTypes,
  getAvailableGyroTypes
} from '../../utils/componentOptionFiltering'
import { 
  JumpJetType, 
  getAvailableJumpJetTypes, 
  calculateTotalJumpJetWeight, 
  calculateTotalJumpJetCrits, 
  validateJumpJetConfiguration,
  calculateJumpJetHeat,
  getMaxAllowedJumpMP,
  calculateJumpJetWeight,
  calculateJumpJetCriticalSlots,
  JUMP_JET_VARIANTS
} from '../../utils/jumpJetCalculations'
import { ComponentConfiguration } from '../../types/componentConfiguration'

export function SystemComponentControls() {
  const { unit, validation, updateConfiguration, removeEquipment, addEquipmentToUnit } = useUnit()
  const config = unit.getConfiguration()
  
  // Use configuration values directly
  const jumpMP = config.jumpMP || 0
  
  // Get available jump jet types for current tech base and rules level
  const availableJumpJetTypes = getAvailableJumpJetTypes(config.techBase, 'Standard')
  
  // Handle jump jet type - can be ComponentConfiguration object or string
  let jumpJetTypeName: string = 'Standard Jump Jet'
  if (config.jumpJetType) {
    if (typeof config.jumpJetType === 'string') {
      jumpJetTypeName = config.jumpJetType
    } else if (config.jumpJetType.type) {
      jumpJetTypeName = config.jumpJetType.type
    }
  }
  
  // Ensure we have a valid jump jet type
  if (!availableJumpJetTypes.includes(jumpJetTypeName as JumpJetType)) {
    jumpJetTypeName = availableJumpJetTypes[0] || 'Standard Jump Jet'
  }
  
  const jumpJetAllocation = { [jumpJetTypeName]: jumpMP }
  
  // Calculate jump jet validation
  const jumpJetValidation = validateJumpJetConfiguration(
    jumpJetAllocation,
    jumpMP,
    config.walkMP,
    config.runMP,
    config.tonnage
  )
  
  // Calculate jump jet stats
  const jumpJetWeight = jumpMP > 0 ? calculateTotalJumpJetWeight(jumpJetAllocation, config.tonnage, false) : 0
  const jumpJetCrits = jumpMP > 0 ? calculateTotalJumpJetCrits(jumpJetAllocation, config.tonnage) : 0
  const jumpJetHeat = jumpMP > 0 ? calculateJumpJetHeat(jumpJetAllocation, jumpMP) : 0
  const maxAllowedJumpMP = getMaxAllowedJumpMP(jumpJetTypeName as JumpJetType, config.walkMP, config.runMP)
  
  // Generate tonnage options (20-100 in 5-ton increments)
  const tonnageOptions = Array.from({ length: 17 }, (_, i) => 20 + (i * 5))
  
  // Calculate maximum walk MP for current tonnage
  const maxWalkMP = Math.floor(400 / config.tonnage)
  
  // Tech base dependent options - use central utility
  const engineOptions = getAvailableEngineTypes(config)
  const gyroOptions = getAvailableGyroTypes(config)
  
  // Remove local filtering functions and use central utility
  const structureOptions = getAvailableStructureTypes(config)
  const armorOptions = getAvailableArmorTypes(config)
  const heatSinkOptions = getAvailableHeatSinkTypes(config)
  
  // Helper function to extract component type
  const getComponentType = (component: ComponentConfiguration | string | undefined): string => {
    if (!component) return 'Standard'
    if (typeof component === 'string') return component
    return component.type
  }
  
  // Helper function to create ComponentConfiguration from string
  const createComponentConfig = (type: string, techBase: string): ComponentConfiguration => ({
    type,
    techBase: techBase as 'Inner Sphere' | 'Clan'
  })
  
  // Update configuration
  const updateConfig = useCallback((updates: Partial<UnitConfiguration>) => {
    console.log('SystemComponentControls.updateConfig called with:', updates)
    const newConfig = { ...config, ...updates }
    
    // Recalculate dependent values and apply to unit
    const validatedConfig = UnitConfigurationBuilder.buildConfiguration(newConfig)
    console.log('Calling updateConfiguration with:', validatedConfig)
    updateConfiguration(validatedConfig)
  }, [config, updateConfiguration])
  
  // Engine rating validation
  const engineValidation = UnitConfigurationBuilder.validateEngineRating(
    config.tonnage, 
    config.walkMP
  )

  return (
    <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
      <h2 className="text-white text-base font-bold mb-3">Mech Configuration</h2>
      
      {/* Condensed Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Column: Chassis */}
        <div className="bg-gray-900 border border-gray-600 p-3 rounded">
          <h3 className="text-gray-300 text-sm font-medium mb-2 border-b border-gray-600 pb-1">Chassis</h3>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-gray-300 text-xs">Tonnage:</label>
              <select 
                value={config.tonnage} 
                onChange={(e) => updateConfig({ tonnage: parseInt(e.target.value) })}
                className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500"
              >
                {tonnageOptions.map(tonnage => (
                  <option key={tonnage} value={tonnage}>{tonnage}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-gray-300 text-xs">Tech Base:</label>
              <select
                value={config.techBase}
                onChange={(e) => updateConfig({ techBase: e.target.value as 'Inner Sphere' | 'Clan' })}
                className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500"
              >
                <option value="Inner Sphere">Inner Sphere</option>
                <option value="Clan">Clan</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-gray-300 text-xs">Structure:</label>
              <select 
                value={getComponentType(config.structureType)} 
                onChange={(e) => {
                  console.log('Structure change:', e.target.value)
                  updateConfig({ structureType: createComponentConfig(e.target.value, config.techBase) })
                }}
                className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500"
              >
                {structureOptions.map(option => (
                  <option key={option.type} value={option.type}>{option.type}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-gray-300 text-xs">Engine:</label>
              <select 
                value={(() => {
                  // Handle both string and ComponentConfiguration engine types
                  if (typeof config.engineType === 'string') {
                    // Find matching option for the string type
                    const matchingOption = engineOptions.find(option => option.type === config.engineType);
                    return matchingOption ? JSON.stringify(matchingOption) : JSON.stringify(engineOptions[0]);
                  }
                  return JSON.stringify(config.engineType);
                })()}
                onChange={e => {
                  const selected = JSON.parse(e.target.value);
                  updateConfig({ engineType: selected });
                }}
                className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500"
              >
                {engineOptions.map(option => (
                  <option key={option.type + option.techBase} value={JSON.stringify(option)}>{option.type}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-gray-300 text-xs">Gyro:</label>
              <select 
                value={getComponentType(config.gyroType)} 
                onChange={(e) => updateConfig({ gyroType: createComponentConfig(e.target.value, config.techBase) })}
                className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500"
              >
                {gyroOptions.map(option => (
                  <option key={option.type} value={option.type}>{option.type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Middle Column: Movement & Heat Sinks */}
        <div className="space-y-3">
          {/* Movement */}
          <div className="bg-gray-900 border border-gray-600 p-3 rounded">
            <h3 className="text-gray-300 text-sm font-medium mb-2 border-b border-gray-600 pb-1">Movement</h3>
            <div className="space-y-2">
              {/* Column Headers */}
              <div className="grid grid-cols-3 gap-2 items-center text-xs">
                <div></div>
                <div className="text-gray-400 text-center">Base</div>
                <div className="text-gray-400 text-center">Final</div>
              </div>
              
              {/* Walk MP */}
              <div className="grid grid-cols-3 gap-2 items-center">
                <label className="text-gray-300 text-xs">Walk MP:</label>
                <input
                  type="number"
                  min="1"
                  max={maxWalkMP}
                  value={config.walkMP}
                  onChange={(e) => updateConfig({ walkMP: parseInt(e.target.value) || 1 })}
                  className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500 text-center"
                />
                <div className="bg-gray-700 p-1 rounded border border-gray-600 text-white text-center text-xs">
                  {config.walkMP}
                </div>
              </div>

              {/* Run MP */}
              <div className="grid grid-cols-3 gap-2 items-center">
                <label className="text-gray-300 text-xs">Run MP:</label>
                <div className="bg-gray-700 p-1 rounded border border-gray-600 text-white text-center text-xs">
                  {config.runMP}
                </div>
                <div className="bg-gray-700 p-1 rounded border border-gray-600 text-white text-center text-xs">
                  {config.runMP}
                </div>
              </div>

              {/* Jump/UMU MP */}
              <div className="grid grid-cols-3 gap-2 items-center">
                <label className="text-gray-300 text-xs">Jump/UMU MP:</label>
                <input
                  type="number"
                  min="0"
                  max={maxAllowedJumpMP}
                  value={jumpMP}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) || 0
                    const clampedValue = Math.min(Math.max(newValue, 0), maxAllowedJumpMP)
                    updateConfig({ jumpMP: clampedValue })
                  }}
                  className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500 text-center"
                />
                <div className="bg-gray-700 p-1 rounded border border-gray-600 text-white text-center text-xs">
                  {jumpMP}
                </div>
              </div>

              {/* Jump Type */}
              <div className="grid grid-cols-3 gap-2 items-center">
                <label className="text-gray-300 text-xs">Jump Type:</label>
                <select 
                  value={jumpJetTypeName}
                  onChange={e => {
                    const selectedType = e.target.value as JumpJetType
                    updateConfig({ jumpJetType: createComponentConfig(selectedType, config.techBase) })
                  }}
                  className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500 col-span-2"
                >
                  {availableJumpJetTypes.map(option => (
                    <option key={option} value={option}>
                      {JUMP_JET_VARIANTS[option]?.name || option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Jump Jet Stats */}
              <div className="grid grid-cols-3 gap-2 items-center text-xs">
                <span className="text-gray-400">Weight:</span>
                <span className="text-center text-white">{jumpJetWeight.toFixed(1)}t</span>
                <span className="text-gray-400">Crits: {jumpJetCrits}</span>
              </div>

              {/* Movement Limits */}
              <div className="grid grid-cols-3 gap-2 items-center text-xs">
                <span className="text-gray-400">Max Jump MP:</span>
                <span className="text-center text-white">{maxAllowedJumpMP}</span>
                <span className="text-gray-400">Heat: {jumpJetHeat}</span>
              </div>
              
              {/* Engine Rating (moved here for context) */}
              <div className="grid grid-cols-2 gap-2 items-center pt-2 border-t border-gray-600">
                <label className="text-gray-300 text-xs">Engine Rating:</label>
                <div className={`bg-gray-700 p-1 rounded border text-center text-xs
                               ${!engineValidation.isValid ? 'border-red-500 text-red-300' : 'border-gray-600 text-white'}`}>
                  {config.engineRating}
                </div>
              </div>
            </div>
          </div>

          {/* Heat Sinks */}
          <div className="bg-gray-900 border border-gray-600 p-3 rounded">
            <h3 className="text-gray-300 text-sm font-medium mb-2 border-b border-gray-600 pb-1">Heat Sinks</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 items-center">
                <label className="text-gray-300 text-xs">Type:</label>
                <select 
                  value={getComponentType(config.heatSinkType)} 
                  onChange={(e) => updateConfig({ heatSinkType: createComponentConfig(e.target.value, config.techBase) })}
                  className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500"
                >
                  {heatSinkOptions.map(option => (
                    <option key={option.type} value={option.type}>{option.type}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-4 gap-1 items-center">
                <label className="text-gray-300 text-xs col-span-2">Number:</label>
                <input
                  type="number"
                  min="10"
                  value={config.totalHeatSinks}
                  onChange={(e) => updateConfig({ totalHeatSinks: parseInt(e.target.value) || 10 })}
                  className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500"
                />
                <div className="text-gray-400 text-xs text-center">
                  <span className="text-gray-300">Engine Free:</span>
                  <div className="bg-gray-700 p-1 rounded border border-gray-600 text-white text-center">
                    {config.internalHeatSinks}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 items-center">
                <label className="text-gray-300 text-xs">Weight Free:</label>
                <div className="bg-gray-700 p-1 rounded border border-gray-600 text-white text-center text-xs">
                  {config.externalHeatSinks}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 items-center">
                <label className="text-gray-300 text-xs">Total Dissipation:</label>
                <div className="bg-gray-700 p-1 rounded border border-gray-600 text-white text-center text-xs">
                  {getComponentType(config.heatSinkType) === 'Double' || getComponentType(config.heatSinkType) === 'Double (Clan)' 
                    ? config.totalHeatSinks * 2 
                    : config.totalHeatSinks}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 items-center">
                <label className="text-gray-300 text-xs">Total Equipment Heat:</label>
                <div className="bg-gray-700 p-1 rounded border border-gray-600 text-white text-center text-xs">
                  0
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="riscHeatSink"
                  className="text-blue-500 text-xs"
                />
                <label htmlFor="riscHeatSink" className="text-gray-300 text-xs">
                  RISC Heat Sink Override Kit
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Armor & Status */}
        <div className="space-y-3">
          {/* Armor */}
          <div className="bg-gray-900 border border-gray-600 p-3 rounded">
            <h3 className="text-gray-300 text-sm font-medium mb-2 border-b border-gray-600 pb-1">Armor</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 items-center">
                <label className="text-gray-300 text-xs">Armor Type:</label>
                <select 
                  value={getComponentType(config.armorType)} 
                  onChange={(e) => updateConfig({ armorType: createComponentConfig(e.target.value, config.techBase) })}
                  className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500"
                >
                  {armorOptions.map(option => (
                    <option key={option.type} value={option.type}>{option.type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Configuration Status */}
          <div className="bg-gray-900 border border-gray-600 p-3 rounded">
            <h3 className="text-gray-300 text-sm font-medium mb-2 border-b border-gray-600 pb-1">Summary</h3>
            <div className="space-y-1 text-xs">
              <div className="grid grid-cols-2 gap-1">
                <span className="text-blue-400">Tonnage:</span>
                <span className="text-white">{config.tonnage}t</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <span className="text-green-400">Tech Base:</span>
                <span className="text-white">{config.techBase === 'Inner Sphere' ? 'IS' : 'Clan'}</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <span className="text-orange-400">Engine:</span>
                <span className="text-white">{config.engineRating}</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <span className="text-purple-400">Movement:</span>
                <span className="text-white">{config.walkMP}/{config.runMP}/{jumpMP}</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <span className="text-cyan-400">Heat Sinks:</span>
                <span className="text-white">{config.totalHeatSinks}</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <span className="text-gray-400">Status:</span>
                <span className={`${(validation.isValid && engineValidation.isValid) ? 'text-green-400' : 'text-red-400'}`}>
                  {(validation.isValid && engineValidation.isValid) ? 'Valid' : 'Invalid'}
                </span>
              </div>
            </div>
          </div>

          {/* Validation Messages */}
          {(!validation.isValid || !engineValidation.isValid || !jumpJetValidation.isValid) && (
            <div className="bg-red-900 border border-red-600 p-2 rounded">
              <h4 className="text-red-200 text-xs font-medium mb-1">Errors:</h4>
              <ul className="text-red-300 text-xs space-y-1">
                {validation.errors.map((error: string, index: number) => (
                  <li key={`validation-${index}`}>• {error}</li>
                ))}
                {engineValidation.errors.map((error: string, index: number) => (
                  <li key={`engine-${index}`}>• {error}</li>
                ))}
                {jumpJetValidation.errors.map((error: string, index: number) => (
                  <li key={`jumpjet-${index}`}>• Jump Jets: {error}</li>
                ))}
              </ul>
            </div>
          )}

          {(validation.warnings && validation.warnings.length > 0) || jumpJetValidation.warnings.length > 0 && (
            <div className="bg-yellow-900 border border-yellow-600 p-2 rounded">
              <h4 className="text-yellow-200 text-xs font-medium mb-1">Warnings:</h4>
              <ul className="text-yellow-300 text-xs space-y-1">
                {validation.warnings && validation.warnings.map((warning: string, index: number) => (
                  <li key={`warning-${index}`}>• {warning}</li>
                ))}
                {jumpJetValidation.warnings.map((warning: string, index: number) => (
                  <li key={`jumpjet-warn-${index}`}>• Jump Jets: {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
