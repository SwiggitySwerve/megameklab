/**
 * System Component Controls - Comprehensive mech configuration
 * Dark theme component with all mech component selections
 */

import React, { useState, useCallback } from 'react'
import { useUnit } from './UnitProvider'
import { EngineType, GyroType } from '../../utils/criticalSlots/SystemComponentRules'
import { StructureType, ArmorType, HeatSinkType, UnitConfigurationBuilder, UnitConfiguration } from '../../utils/criticalSlots/UnitCriticalManager'

export function SystemComponentControls() {
  const { unit, validation, updateConfiguration } = useUnit()
  const config = unit.getConfiguration()
  
  // Local state for UI-only values
  const [jumpMP, setJumpMP] = useState(0)
  
  // Generate tonnage options (20-100 in 5-ton increments)
  const tonnageOptions = Array.from({ length: 17 }, (_, i) => 20 + (i * 5))
  
  // Calculate maximum walk MP for current tonnage
  const maxWalkMP = Math.floor(400 / config.tonnage)
  
  // Tech base dependent options
  const engineOptions: EngineType[] = ['Standard', 'XL', 'Light', 'XXL', 'Compact', 'ICE', 'Fuel Cell']
  const gyroOptions: GyroType[] = ['Standard', 'XL', 'Compact', 'Heavy-Duty']
  
  const getStructureOptions = (techBase: string): StructureType[] => {
    const common: StructureType[] = ['Standard', 'Composite', 'Reinforced', 'Industrial']
    return techBase === 'Clan' 
      ? [...common, 'Endo Steel (Clan)']
      : [...common, 'Endo Steel']
  }
  
  const getArmorOptions = (techBase: string): ArmorType[] => {
    const common: ArmorType[] = ['Standard', 'Stealth', 'Reactive', 'Reflective', 'Hardened']
    return techBase === 'Clan'
      ? [...common, 'Ferro-Fibrous (Clan)']
      : [...common, 'Ferro-Fibrous', 'Light Ferro-Fibrous', 'Heavy Ferro-Fibrous']
  }
  
  const getHeatSinkOptions = (techBase: string): HeatSinkType[] => {
    const common: HeatSinkType[] = ['Single', 'Compact', 'Laser']
    return techBase === 'Clan'
      ? [...common, 'Double (Clan)']
      : [...common, 'Double']
  }
  
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
                value={config.structureType} 
                onChange={(e) => {
                  console.log('Structure change:', e.target.value)
                  updateConfig({ structureType: e.target.value as StructureType })
                }}
                className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500"
              >
                {getStructureOptions(config.techBase).map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-gray-300 text-xs">Engine:</label>
              <select 
                value={config.engineType} 
                onChange={(e) => updateConfig({ engineType: e.target.value as EngineType })}
                className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500"
              >
                {engineOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-gray-300 text-xs">Gyro:</label>
              <select 
                value={config.gyroType} 
                onChange={(e) => updateConfig({ gyroType: e.target.value as GyroType })}
                className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500"
              >
                {gyroOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
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
                  max="12"
                  value={jumpMP}
                  onChange={(e) => setJumpMP(parseInt(e.target.value) || 0)}
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
                  defaultValue="Jump Jet"
                  className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500 col-span-2"
                >
                  <option value="Jump Jet">Jump Jet</option>
                  <option value="Improved Jump Jet">Improved Jump Jet</option>
                  <option value="UMU">UMU</option>
                  <option value="Mechanical Jump Booster">Mechanical Jump Booster</option>
                </select>
              </div>

              {/* Mech. J. Booster MP */}
              <div className="grid grid-cols-3 gap-2 items-center">
                <label className="text-gray-300 text-xs">Mech. J. Booster MP:</label>
                <input
                  type="number"
                  min="0"
                  max="6"
                  defaultValue="0"
                  className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500 text-center"
                />
                <div></div>
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
                  value={config.heatSinkType} 
                  onChange={(e) => updateConfig({ heatSinkType: e.target.value as HeatSinkType })}
                  className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500"
                >
                  {getHeatSinkOptions(config.techBase).map(option => (
                    <option key={option} value={option}>
                      {config.techBase === 'Inner Sphere' && option === 'Double' ? 'IS Double' : option}
                    </option>
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
                  {config.heatSinkType === 'Double' || config.heatSinkType === 'Double (Clan)' 
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
                  value={config.armorType} 
                  onChange={(e) => updateConfig({ armorType: e.target.value as ArmorType })}
                  className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500"
                >
                  {getArmorOptions(config.techBase).map(option => (
                    <option key={option} value={option}>{option}</option>
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
                <span className="text-white">{config.walkMP}/{config.runMP}</span>
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
          {(!validation.isValid || !engineValidation.isValid) && (
            <div className="bg-red-900 border border-red-600 p-2 rounded">
              <h4 className="text-red-200 text-xs font-medium mb-1">Errors:</h4>
              <ul className="text-red-300 text-xs space-y-1">
                {validation.errors.map((error: string, index: number) => (
                  <li key={index}>• {error}</li>
                ))}
                {engineValidation.errors.map((error: string, index: number) => (
                  <li key={`engine-${index}`}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.warnings && validation.warnings.length > 0 && (
            <div className="bg-yellow-900 border border-yellow-600 p-2 rounded">
              <h4 className="text-yellow-200 text-xs font-medium mb-1">Warnings:</h4>
              <ul className="text-yellow-300 text-xs space-y-1">
                {validation.warnings.map((warning: string, index: number) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
