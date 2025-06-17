/**
 * Enhanced System Component Controls - IS/Clan Technology Differentiation
 * Integrates with construction rules engine for proper tech base validation
 */

import React, { useState, useCallback, useMemo } from 'react'
import { useUnit } from './UnitProvider'
import { EngineType, HeatSinkType, StructureType, ArmorType, GyroType } from '../../types/systemComponents'
import { 
  TechBase, 
  TechLevel,
  ConstructionContext,
  ComponentOption,
  getTechBaseFromEngineType,
  getTechBaseFromHeatSinkType,
  getEngineSurvivabilityDescription,
  getHeatSinkEfficiency
} from '../../types/enhancedSystemComponents'
import { ConstructionRulesEngine } from '../../utils/constructionRules/ConstructionRulesEngine'
import { HEAT_SINK_SPECIFICATIONS } from '../../utils/heatSinkCalculations'
import { ENGINE_SLOT_REQUIREMENTS } from '../../utils/engineCalculations'

export function EnhancedSystemComponentControls() {
  const { unit, validation, updateConfiguration } = useUnit()
  const config = unit.getConfiguration()
  
  // Enhanced configuration state
  const [enhancedConfig, setEnhancedConfig] = useState({
    techBase: 'Inner Sphere' as TechBase,
    techLevel: 'Standard' as TechLevel,
    era: '3050'
  })
  
  // Local state for UI-only values
  const [jumpMP, setJumpMP] = useState(0)
  
  // Initialize construction rules engine
  const constructionEngine = useMemo(() => new ConstructionRulesEngine(), [])
  
  // Create construction context
  const constructionContext: ConstructionContext = useMemo(() => ({
    mechTonnage: config.tonnage,
    techBase: enhancedConfig.techBase,
    techLevel: enhancedConfig.techLevel,
    era: enhancedConfig.era,
    allowMixedTech: enhancedConfig.techBase.includes('Mixed')
  }), [config.tonnage, enhancedConfig])
  
  // Get available component options
  const availableEngineTypes = useMemo(() => 
    constructionEngine.getAvailableEngineTypes(enhancedConfig.techBase),
    [constructionEngine, enhancedConfig.techBase]
  )
  
  const availableHeatSinkTypes = useMemo(() =>
    constructionEngine.getAvailableHeatSinkTypes(enhancedConfig.techBase),
    [constructionEngine, enhancedConfig.techBase]
  )
  
  // Generate tonnage options (20-100 in 5-ton increments)
  const tonnageOptions = Array.from({ length: 17 }, (_, i) => 20 + (i * 5))
  
  // Calculate maximum walk MP for current tonnage
  const maxWalkMP = Math.floor(400 / config.tonnage)
  
  // Legacy to enhanced type converters
  const convertLegacyEngineType = useCallback((legacyType: any): EngineType => {
    if (legacyType === 'XL') {
      // Default to IS XL for legacy compatibility
      return enhancedConfig.techBase === 'Clan' || enhancedConfig.techBase === 'Mixed (Clan Chassis)' 
        ? 'XL (Clan)' : 'XL (IS)'
    }
    return legacyType as EngineType
  }, [enhancedConfig.techBase])
  
  const convertLegacyHeatSinkType = useCallback((legacyType: any): HeatSinkType => {
    if (legacyType === 'Double') {
      // Default to IS Double for legacy compatibility
      return enhancedConfig.techBase === 'Clan' || enhancedConfig.techBase === 'Mixed (Clan Chassis)'
        ? 'Double (Clan)' : 'Double (IS)'
    }
    return legacyType as HeatSinkType
  }, [enhancedConfig.techBase])

  // Enhanced validation with construction rules
  const enhancedValidation = useMemo(() => {
    // Convert legacy types to enhanced types
    const enhancedEngineType = convertLegacyEngineType(config.engineType)
    const enhancedHeatSinkType = convertLegacyHeatSinkType(config.heatSinkType)
    
    // Create mock enhanced components for validation
    const mockComponents = {
      techBase: enhancedConfig.techBase,
      techLevel: enhancedConfig.techLevel,
      era: enhancedConfig.era,
      engine: {
        type: enhancedEngineType,
        rating: config.engineRating,
        techBase: getTechBaseFromEngineType(enhancedEngineType),
        specification: {} // Would be populated from engine specifications
      },
      heatSinks: {
        type: enhancedHeatSinkType,
        total: config.totalHeatSinks,
        engineIntegrated: config.internalHeatSinks,
        externalRequired: config.externalHeatSinks,
        techBase: getTechBaseFromHeatSinkType(enhancedHeatSinkType),
        specification: {} // Would be populated from heat sink specifications
      },
      gyro: { type: config.gyroType, techBase: 'Both' as const, specification: {} },
      cockpit: { type: 'Standard' as const, techBase: 'Both' as const, specification: {} },
      structure: { type: config.structureType, techBase: 'Both' as const, specification: {} },
      armor: { type: config.armorType, techBase: 'Both' as const, specification: {} }
    } as any
    
    return constructionEngine.validateConfiguration(mockComponents, constructionContext)
  }, [constructionEngine, config, enhancedConfig, constructionContext, convertLegacyEngineType, convertLegacyHeatSinkType])
  
  // Get structure options based on tech base
  const getStructureOptions = (techBase: TechBase): StructureType[] => {
    const common: StructureType[] = ['Standard', 'Composite', 'Reinforced', 'Industrial']
    if (techBase === 'Clan' || techBase === 'Mixed (Clan Chassis)') {
      return [...common, 'Endo Steel (Clan)']
    }
    return [...common, 'Endo Steel']
  }
  
  // Get armor options based on tech base
  const getArmorOptions = (techBase: TechBase): ArmorType[] => {
    const common: ArmorType[] = ['Standard', 'Stealth', 'Reactive', 'Reflective', 'Hardened']
    if (techBase === 'Clan' || techBase === 'Mixed (Clan Chassis)') {
      return [...common, 'Ferro-Fibrous (Clan)']
    }
    return [...common, 'Ferro-Fibrous', 'Light Ferro-Fibrous', 'Heavy Ferro-Fibrous']
  }
  
  // Update configuration with enhanced validation
  const updateConfig = useCallback((updates: any) => {
    console.log('EnhancedSystemComponentControls.updateConfig called with:', updates)
    const newConfig = { ...config, ...updates }
    updateConfiguration(newConfig)
  }, [config, updateConfiguration])
  
  // Update enhanced configuration
  const updateEnhancedConfig = useCallback((updates: Partial<typeof enhancedConfig>) => {
    setEnhancedConfig(prev => ({ ...prev, ...updates }))
  }, [])
  
  // Get engine slot information
  const getEngineSlotInfo = (engineType: EngineType) => {
    const slotReq = ENGINE_SLOT_REQUIREMENTS[engineType]
    if (!slotReq) return null
    
    const totalSlots = slotReq.centerTorso + slotReq.leftTorso + slotReq.rightTorso
    return {
      total: totalSlots,
      distribution: `${slotReq.centerTorso}CT + ${slotReq.leftTorso}LT + ${slotReq.rightTorso}RT`,
      sideSlots: slotReq.leftTorso + slotReq.rightTorso
    }
  }
  
  // Get heat sink slot information
  const getHeatSinkSlotInfo = (heatSinkType: HeatSinkType) => {
    const spec = HEAT_SINK_SPECIFICATIONS[heatSinkType]
    if (!spec) return null
    
    return {
      slotsPerUnit: spec.criticalSlots,
      techBase: spec.techBase,
      efficiency: getHeatSinkEfficiency(heatSinkType)
    }
  }

  return (
    <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
      <h2 className="text-white text-base font-bold mb-3">Enhanced Mech Configuration</h2>
      
      {/* Enhanced Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Column: Tech Base & Chassis */}
        <div className="space-y-3">
          {/* Tech Base Configuration */}
          <div className="bg-gray-900 border border-gray-600 p-3 rounded">
            <h3 className="text-gray-300 text-sm font-medium mb-2 border-b border-gray-600 pb-1">Technology Base</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 items-center">
                <label className="text-gray-300 text-xs">Tech Base:</label>
                <select
                  value={enhancedConfig.techBase}
                  onChange={(e) => updateEnhancedConfig({ techBase: e.target.value as TechBase })}
                  className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500"
                >
                  <option value="Inner Sphere">Inner Sphere</option>
                  <option value="Clan">Clan</option>
                  <option value="Mixed (IS Chassis)">Mixed (IS Chassis)</option>
                  <option value="Mixed (Clan Chassis)">Mixed (Clan Chassis)</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-2 items-center">
                <label className="text-gray-300 text-xs">Tech Level:</label>
                <select
                  value={enhancedConfig.techLevel}
                  onChange={(e) => updateEnhancedConfig({ techLevel: e.target.value as TechLevel })}
                  className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500"
                >
                  <option value="Introductory">Introductory</option>
                  <option value="Standard">Standard</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Experimental">Experimental</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-2 items-center">
                <label className="text-gray-300 text-xs">Era:</label>
                <select
                  value={enhancedConfig.era}
                  onChange={(e) => updateEnhancedConfig({ era: e.target.value })}
                  className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500"
                >
                  <option value="3025">Succession Wars (3025)</option>
                  <option value="3050">Clan Invasion (3050)</option>
                  <option value="3057">FedCom Civil War (3057)</option>
                  <option value="3067">Jihad (3067)</option>
                  <option value="3135">Dark Age (3135)</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Chassis Configuration */}
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
                <label className="text-gray-300 text-xs">Structure:</label>
                <select 
                  value={config.structureType} 
                  onChange={(e) => updateConfig({ structureType: e.target.value as StructureType })}
                  className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500"
                >
                  {getStructureOptions(enhancedConfig.techBase).map(option => (
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
                  <option value="Standard">Standard</option>
                  <option value="XL">XL</option>
                  <option value="Compact">Compact</option>
                  <option value="Heavy-Duty">Heavy-Duty</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Engine & Movement */}
        <div className="space-y-3">
          {/* Enhanced Engine Selection */}
          <div className="bg-gray-900 border border-gray-600 p-3 rounded">
            <h3 className="text-gray-300 text-sm font-medium mb-2 border-b border-gray-600 pb-1">Engine</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 items-center">
                <label className="text-gray-300 text-xs">Engine Type:</label>
                <select 
                  value={config.engineType} 
                  onChange={(e) => updateConfig({ engineType: e.target.value as EngineType })}
                  className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500"
                >
                  {availableEngineTypes.map(option => (
                    <option 
                      key={option.id} 
                      value={option.id}
                      disabled={!option.available}
                    >
                      {option.name} {!option.available && '(N/A)'}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Engine Tech Base Indicator */}
              <div className="text-xs text-gray-400">
                Tech Base: {getTechBaseFromEngineType(convertLegacyEngineType(config.engineType))}
                {getEngineSlotInfo(convertLegacyEngineType(config.engineType)) && (
                  <div className="mt-1">
                    Slots: {getEngineSlotInfo(convertLegacyEngineType(config.engineType))?.distribution}
                    <br />
                    Total: {getEngineSlotInfo(convertLegacyEngineType(config.engineType))?.total} slots
                  </div>
                )}
              </div>
              
              {/* Engine Survivability Warning */}
              {(convertLegacyEngineType(config.engineType) === 'XL (IS)' || convertLegacyEngineType(config.engineType) === 'XL (Clan)') && (
                <div className="text-xs text-yellow-400 bg-yellow-900 p-2 rounded">
                  ⚠ {getEngineSurvivabilityDescription(convertLegacyEngineType(config.engineType))}
                </div>
              )}
              
              {/* Movement */}
              <div className="pt-2 border-t border-gray-600">
                <div className="grid grid-cols-3 gap-2 items-center text-xs mb-1">
                  <div></div>
                  <div className="text-gray-400 text-center">Base</div>
                  <div className="text-gray-400 text-center">Final</div>
                </div>
                
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

                <div className="grid grid-cols-3 gap-2 items-center">
                  <label className="text-gray-300 text-xs">Run MP:</label>
                  <div className="bg-gray-700 p-1 rounded border border-gray-600 text-white text-center text-xs">
                    {config.runMP}
                  </div>
                  <div className="bg-gray-700 p-1 rounded border border-gray-600 text-white text-center text-xs">
                    {config.runMP}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 items-center mt-1">
                  <label className="text-gray-300 text-xs">Engine Rating:</label>
                  <div className="bg-gray-700 p-1 rounded border border-gray-600 text-white text-center text-xs">
                    {config.engineRating}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Heat Sink Selection */}
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
                  {availableHeatSinkTypes.map(option => (
                    <option 
                      key={option.id} 
                      value={option.id}
                      disabled={!option.available}
                    >
                      {option.name} {!option.available && '(N/A)'}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Heat Sink Tech Base and Efficiency Info */}
              {getHeatSinkSlotInfo(convertLegacyHeatSinkType(config.heatSinkType)) && (
                <div className="text-xs text-gray-400">
                  <div>Tech: {getHeatSinkSlotInfo(convertLegacyHeatSinkType(config.heatSinkType))?.techBase}</div>
                  <div>Slots per unit: {getHeatSinkSlotInfo(convertLegacyHeatSinkType(config.heatSinkType))?.slotsPerUnit}</div>
                  <div>Efficiency: {getHeatSinkSlotInfo(convertLegacyHeatSinkType(config.heatSinkType))?.efficiency.toFixed(2)} heat/slot</div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2 items-center">
                <label className="text-gray-300 text-xs">Number:</label>
                <input
                  type="number"
                  min="10"
                  value={config.totalHeatSinks}
                  onChange={(e) => updateConfig({ totalHeatSinks: parseInt(e.target.value) || 10 })}
                  className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2 items-center">
                <label className="text-gray-300 text-xs">Engine Free:</label>
                <div className="bg-gray-700 p-1 rounded border border-gray-600 text-white text-center text-xs">
                  {config.internalHeatSinks}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 items-center">
                <label className="text-gray-300 text-xs">External:</label>
                <div className="bg-gray-700 p-1 rounded border border-gray-600 text-white text-center text-xs">
                  {config.externalHeatSinks}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 items-center">
                <label className="text-gray-300 text-xs">Total Dissipation:</label>
                <div className="bg-gray-700 p-1 rounded border border-gray-600 text-white text-center text-xs">
                  {config.heatSinkType.includes('Double') 
                    ? config.totalHeatSinks * 2 
                    : config.totalHeatSinks}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Status & Validation */}
        <div className="space-y-3">
          {/* Armor */}
          <div className="bg-gray-900 border border-gray-600 p-3 rounded">
            <h3 className="text-gray-300 text-sm font-medium mb-2 border-b border-gray-600 pb-1">Armor</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 items-center">
                <label className="text-gray-300 text-xs">Type:</label>
                <select 
                  value={config.armorType} 
                  onChange={(e) => updateConfig({ armorType: e.target.value as ArmorType })}
                  className="bg-gray-700 text-white text-xs p-1 rounded border border-gray-600 focus:border-blue-500"
                >
                  {getArmorOptions(enhancedConfig.techBase).map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Enhanced Configuration Summary */}
          <div className="bg-gray-900 border border-gray-600 p-3 rounded">
            <h3 className="text-gray-300 text-sm font-medium mb-2 border-b border-gray-600 pb-1">Configuration Status</h3>
            <div className="space-y-1 text-xs">
              <div className="grid grid-cols-2 gap-1">
                <span className="text-blue-400">Tonnage:</span>
                <span className="text-white">{config.tonnage}t</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <span className="text-green-400">Tech Base:</span>
                <span className="text-white">{enhancedConfig.techBase}</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <span className="text-orange-400">Engine:</span>
                <span className="text-white">{config.engineType} ({config.engineRating})</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <span className="text-purple-400">Movement:</span>
                <span className="text-white">{config.walkMP}/{config.runMP}</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <span className="text-cyan-400">Heat Sinks:</span>
                <span className="text-white">{config.totalHeatSinks} ({config.heatSinkType})</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <span className="text-gray-400">Status:</span>
                <span className={`${enhancedValidation.isValid ? 'text-green-400' : 'text-red-400'}`}>
                  {enhancedValidation.isValid ? 'Valid' : 'Invalid'}
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced Validation Messages */}
          {!enhancedValidation.isValid && enhancedValidation.errors.length > 0 && (
            <div className="bg-red-900 border border-red-600 p-2 rounded">
              <h4 className="text-red-200 text-xs font-medium mb-1">Construction Rule Violations:</h4>
              <ul className="text-red-300 text-xs space-y-1">
                {enhancedValidation.errors.map((error: string, index: number) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {enhancedValidation.warnings.length > 0 && (
            <div className="bg-yellow-900 border border-yellow-600 p-2 rounded">
              <h4 className="text-yellow-200 text-xs font-medium mb-1">Tech Base Warnings:</h4>
              <ul className="text-yellow-300 text-xs space-y-1">
                {enhancedValidation.warnings.map((warning: string, index: number) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tech Base Violations Detail */}
          {enhancedValidation.techBaseViolations.length > 0 && (
            <div className="bg-orange-900 border border-orange-600 p-2 rounded">
              <h4 className="text-orange-200 text-xs font-medium mb-1">Tech Base Issues:</h4>
              <ul className="text-orange-300 text-xs space-y-1">
                {enhancedValidation.techBaseViolations.map((violation, index) => (
                  <li key={index}>• {violation.component}: {violation.details}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Slot Violations Detail */}
          {enhancedValidation.slotViolations.length > 0 && (
            <div className="bg-purple-900 border border-purple-600 p-2 rounded">
              <h4 className="text-purple-200 text-xs font-medium mb-1">Slot Allocation Issues:</h4>
              <ul className="text-purple-300 text-xs space-y-1">
                {enhancedValidation.slotViolations.map((violation, index) => (
                  <li key={index}>
                    • {violation.location}: {violation.required} required, {violation.available} available
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
