/**
 * Customizer V2 - Next generation unit customizer using the V2 data model
 * Built on top of the UnitCriticalManager system from the critical slots v2 demo
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { UnitProvider, useUnit } from '../../components/criticalSlots/UnitProvider';
import { calculateEnhancedMovement, formatEngineMovementInfo } from '../../utils/movementCalculations';
import { ARMOR_POINTS_PER_TON, calculateArmorWeight, getArmorSlots } from '../../utils/armorCalculations';
import { calculateMaxArmorPoints, calculateMaxArmorTonnage, calculateRemainingTonnage, useRemainingTonnageForArmor } from '../../utils/armorAllocation';

// Import skeleton components
import { 
  SkeletonInput, 
  SkeletonSelect, 
  SkeletonNumberInput, 
  SkeletonText, 
  SkeletonFormSection 
} from '../../components/common/SkeletonLoader';

// Import equipment components
import { EquipmentBrowser } from '../../components/criticalSlots/EquipmentBrowser';
import { AllEquipmentDisplay } from '../../components/criticalSlots/AllEquipmentDisplay';
import { UnallocatedEquipmentDisplay } from '../../components/criticalSlots/UnallocatedEquipmentDisplay';

// Placeholder tab components - these will be implemented later
const StructureTabV2: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  const { unit, engineType, gyroType, updateConfiguration, isConfigLoaded } = useUnit();
  const config = unit.getConfiguration();
  
  // Generate tonnage options (20-100 in 5-ton increments)
  const tonnageOptions = Array.from({ length: 17 }, (_, i) => 20 + (i * 5));
  
  // Tech base options including Mixed
  const techBaseOptions = ['Inner Sphere', 'Clan', 'Mixed'];
  
  // Get available options based on tech base
  const engineOptions = ['Standard', 'XL', 'Light', 'XXL', 'Compact', 'ICE', 'Fuel Cell'];
  const gyroOptions = ['Standard', 'XL', 'Compact', 'Heavy-Duty'];
  
  const getStructureOptions = (techBase: string) => {
    if (techBase === 'Mixed') {
      return ['Standard', 'Endo Steel', 'Endo Steel (Clan)', 'Composite', 'Reinforced', 'Industrial'];
    }
    return techBase === 'Clan' 
      ? ['Standard', 'Endo Steel (Clan)', 'Composite', 'Reinforced', 'Industrial']
      : ['Standard', 'Endo Steel', 'Composite', 'Reinforced', 'Industrial'];
  };
  
  const getHeatSinkOptions = (techBase: string) => {
    if (techBase === 'Mixed') {
      return ['Single', 'Double', 'Double (Clan)', 'Compact', 'Laser'];
    }
    return techBase === 'Clan'
      ? ['Single', 'Double (Clan)', 'Compact', 'Laser']
      : ['Single', 'Double', 'Compact', 'Laser'];
  };
  
  const structureOptions = getStructureOptions(config.techBase);
  const heatSinkOptions = getHeatSinkOptions(config.techBase);
  
  // Calculate derived values
  const maxWalkMP = Math.floor(400 / config.tonnage);
  const calculatedEngineRating = config.tonnage * config.walkMP;
  const actualEngineRating = Math.min(calculatedEngineRating, 400);
  
  const heatDissipation = config.heatSinkType === 'Double' || config.heatSinkType === 'Double (Clan)' 
    ? config.totalHeatSinks * 2 
    : config.totalHeatSinks;
  
  // Use shared movement utility for consistent display
  const enhancedMovement = calculateEnhancedMovement(config);
  const calculatedRunMP = config.runMP; // Use base run MP for data model consistency
  
  // Update configuration helper with auto-calculations
  const updateConfig = (updates: any) => {
    let newConfig = { ...config, ...updates };
    
    // Auto-calculate engine rating and movement when tonnage, walkMP, or enhancement changes
    if ('tonnage' in updates || 'walkMP' in updates || 'enhancementType' in updates) {
      const tonnage = updates.tonnage || config.tonnage;
      const walkMP = updates.walkMP || config.walkMP;
      const enhancementType = updates.enhancementType !== undefined ? updates.enhancementType : config.enhancementType;
      const engineRating = Math.min(tonnage * walkMP, 400);
      
      // Calculate enhanced movement using shared utility
      const movementConfig = { walkMP, runMP: Math.floor(walkMP * 1.5), jumpMP: newConfig.jumpMP, enhancementType };
      const enhancedMovement = calculateEnhancedMovement(movementConfig);
      
      newConfig = {
        ...newConfig,
        engineRating,
        runMP: enhancedMovement.runValue
      };
    }
    
    updateConfiguration(newConfig);
  };
  
  // Handle walk MP change with validation
  const handleWalkMPChange = (value: number) => {
    const clampedValue = Math.min(Math.max(value, 1), maxWalkMP);
    updateConfig({ walkMP: clampedValue });
  };
  
  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Compact 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Component Configuration */}
        <div className="space-y-4">
          {/* Basic Unit Info */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="text-slate-100 font-medium text-sm mb-3">Unit Configuration</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 text-xs block mb-1">Tonnage</label>
                {isConfigLoaded ? (
                  <input
                    type="number"
                    min={20}
                    step={5}
                    value={config.tonnage}
                    onChange={(e) => updateConfig({ tonnage: parseInt(e.target.value) || 20 })}
                    disabled={readOnly}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 focus:border-blue-500 text-center"
                  />
                ) : (
                  <SkeletonInput />
                )}
                <div className="text-xs text-slate-400 text-center mt-1">
                  20-100t (step: 5)
                </div>
              </div>
              <div>
                <label className="text-slate-300 text-xs block mb-1">Tech Base</label>
                {isConfigLoaded ? (
                  <select
                    value={config.techBase}
                    onChange={(e) => updateConfig({ techBase: e.target.value })}
                    disabled={readOnly}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 focus:border-blue-500"
                  >
                    {techBaseOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <SkeletonSelect />
                )}
              </div>
            </div>
          </div>
          
          {/* Engine Configuration */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="text-slate-100 font-medium text-sm mb-3">Engine</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 text-xs block mb-1">Type</label>
                {isConfigLoaded ? (
                  <select
                    value={config.engineType}
                    onChange={(e) => updateConfig({ engineType: e.target.value })}
                    disabled={readOnly}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 focus:border-blue-500"
                  >
                    {engineOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <SkeletonSelect />
                )}
              </div>
              <div>
                <label className="text-slate-300 text-xs block mb-1">Rating</label>
                {isConfigLoaded ? (
                  <div className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-slate-100">
                    {config.engineRating}
                  </div>
                ) : (
                  <SkeletonText />
                )}
              </div>
            </div>
            {isConfigLoaded ? (
              <div className="mt-2 text-xs text-slate-400">
                Walk: {config.walkMP} MP | Run: {config.runMP} MP | Max: {maxWalkMP} MP
              </div>
            ) : (
              <div className="mt-2 h-4 bg-slate-600/50 rounded animate-pulse"></div>
            )}
          </div>
          
          {/* Structure & Gyro */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="text-slate-100 font-medium text-sm mb-3">Structure & Gyro</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 text-xs block mb-1">Structure</label>
                {isConfigLoaded ? (
                  <select
                    value={config.structureType}
                    onChange={(e) => updateConfig({ structureType: e.target.value })}
                    disabled={readOnly}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 focus:border-blue-500"
                  >
                    {structureOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <SkeletonSelect />
                )}
              </div>
              <div>
                <label className="text-slate-300 text-xs block mb-1">Gyro</label>
                {isConfigLoaded ? (
                  <select
                    value={config.gyroType}
                    onChange={(e) => updateConfig({ gyroType: e.target.value })}
                    disabled={readOnly}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 focus:border-blue-500"
                  >
                    {gyroOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <SkeletonSelect />
                )}
              </div>
            </div>
          </div>
          
          {/* Heat Management */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="text-slate-100 font-medium text-sm mb-3">Heat Management</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 text-xs block mb-1">Heat Sink Type</label>
                <select
                  value={config.heatSinkType}
                  onChange={(e) => updateConfig({ heatSinkType: e.target.value })}
                  disabled={readOnly}
                  className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 focus:border-blue-500"
                >
                  {heatSinkOptions.map(option => (
                    <option key={option} value={option}>
                      {config.techBase === 'Inner Sphere' && option === 'Double' ? 'IS Double' : option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-300 text-xs block mb-1">Total Count</label>
                <input
                  type="number"
                  value={config.totalHeatSinks}
                  onChange={(e) => updateConfig({ totalHeatSinks: parseInt(e.target.value) || 10 })}
                  disabled={readOnly}
                  min={10}
                  className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-700/50 rounded px-2 py-1">
                <span className="text-slate-400">Engine:</span>
                <span className="ml-1 text-slate-100">{config.internalHeatSinks}</span>
              </div>
              <div className="bg-slate-700/50 rounded px-2 py-1">
                <span className="text-slate-400">External:</span>
                <span className="ml-1 text-slate-100">{config.externalHeatSinks}</span>
              </div>
            </div>
          </div>
          
          {/* Enhancement */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="text-slate-100 font-medium text-sm mb-3">Enhancement</h3>
            <div>
              <label className="text-slate-300 text-xs block mb-1">Type</label>
              <select
                value={config.enhancementType || 'None'}
                onChange={(e) => updateConfig({ enhancementType: e.target.value === 'None' ? null : e.target.value })}
                disabled={readOnly}
                className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 focus:border-blue-500"
              >
                <option value="None">None</option>
                <option value="MASC">MASC</option>
                <option value="Triple Strength Myomer">Triple Strength Myomer</option>
              </select>
            </div>
            {config.enhancementType === 'MASC' && (
              <div className="mt-2 text-xs text-slate-400">
                <div>• Doubles run speed when active</div>
                <div>• Generates 5 heat per activation</div>
                <div>• Risk of system damage if overused</div>
              </div>
            )}
            {config.enhancementType === 'Triple Strength Myomer' && (
              <div className="mt-2 text-xs text-slate-400">
                <div>• Activates at 9+ heat levels</div>
                <div>• +1 Walk MP, recalculated Run MP</div>
                <div>• Doubles physical attack damage</div>
                <div>• Heat: {heatDissipation - config.totalHeatSinks}/9+ for activation</div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column: Stats & Summary */}
        <div className="space-y-4">
          {/* Movement Configuration */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="text-slate-100 font-medium text-sm mb-3">Movement Configuration</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-slate-300 text-xs block mb-1">Walk MP</label>
                <input
                  type="number"
                  value={config.walkMP}
                  onChange={(e) => handleWalkMPChange(parseInt(e.target.value) || 1)}
                  disabled={readOnly}
                  min={1}
                  max={maxWalkMP}
                  className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 focus:border-blue-500 text-center"
                />
                <div className="text-xs text-slate-400 text-center mt-1">
                  Max: {maxWalkMP}
                </div>
              </div>
              <div>
                <label className="text-slate-300 text-xs block mb-1">Run MP</label>
                <div className="bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm text-slate-100 text-center">
                  {enhancedMovement.runDisplay}
                </div>
                <div className="text-xs text-slate-400 text-center mt-1">
                  Auto-calc {config.enhancementType ? `(${config.enhancementType})` : ''}
                </div>
              </div>
              <div>
                <label className="text-slate-300 text-xs block mb-1">Jump MP</label>
                <input
                  type="number"
                  value={config.jumpMP || 0}
                  onChange={(e) => updateConfig({ jumpMP: parseInt(e.target.value) || 0 })}
                  disabled={readOnly}
                  min={0}
                  max={config.walkMP}
                  className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 focus:border-blue-500 text-center"
                />
                <div className="text-xs text-slate-400 text-center mt-1">
                  Max: {config.walkMP}
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-400 text-center">
              Engine Rating: {config.tonnage} × {config.walkMP} = {config.engineRating}
              {config.engineRating >= 400 && <span className="text-orange-400 ml-2">(Capped at 400)</span>}
            </div>
          </div>
          
          {/* Enhanced Summary Table */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="text-slate-100 font-medium text-sm mb-3">Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left text-slate-300 py-1">Component</th>
                    <th className="text-center text-slate-300 py-1 w-16">Weight</th>
                    <th className="text-center text-slate-300 py-1 w-12">Crits</th>
                    <th className="text-center text-slate-300 py-1 w-20">Availability</th>
                  </tr>
                </thead>
                <tbody className="text-slate-100">
                  <tr className="border-b border-slate-700/50">
                    <td className="py-1">Unit Type:</td>
                    <td className="text-center font-medium">{config.tonnage}t</td>
                    <td className="text-center">—</td>
                    <td className="text-center text-green-400">Standard</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-1">Structure ({config.structureType}):</td>
                    <td className="text-center font-medium">{(config.tonnage * 0.1).toFixed(1)}t</td>
                    <td className="text-center">{config.structureType === 'Endo Steel' || config.structureType === 'Endo Steel (Clan)' ? '14' : '0'}</td>
                    <td className="text-center text-yellow-400">D/C-E-D-D</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-1">Engine ({config.engineType} {config.engineRating}):</td>
                    <td className="text-center font-medium">{(config.engineRating * (config.engineType === 'XL' ? 0.5 : config.engineType === 'Light' ? 0.75 : 1) / 25).toFixed(1)}t</td>
                    <td className="text-center">{config.engineType === 'XL' ? '12' : config.engineType === 'Light' ? '8' : '6'}</td>
                    <td className="text-center text-green-400">D/C-E-D-D</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-1">Gyro ({config.gyroType}):</td>
                    <td className="text-center font-medium">{Math.ceil(config.engineRating / 100).toFixed(1)}t</td>
                    <td className="text-center">{config.gyroType === 'XL' ? '6' : config.gyroType === 'Compact' ? '2' : '4'}</td>
                    <td className="text-center text-green-400">D/C-C-C-C</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-1">Cockpit:</td>
                    <td className="text-center font-medium">3.0t</td>
                    <td className="text-center">1</td>
                    <td className="text-center text-green-400">D/C-C-C-C</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-1">Heat Sinks ({config.totalHeatSinks} {config.heatSinkType}):</td>
                    <td className="text-center font-medium">{config.externalHeatSinks}t</td>
                    <td className="text-center">{config.externalHeatSinks}</td>
                    <td className="text-center text-blue-400">{config.heatSinkType === 'Double' || config.heatSinkType === 'Double (Clan)' ? 'C/B-B-B-B' : 'D/C-C-C-C'}</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-1">Armor ({config.armorType}):</td>
                    <td className="text-center font-medium">{config.armorTonnage.toFixed(1)}t</td>
                    <td className="text-center">{config.armorType === 'Ferro-Fibrous' ? '14' : config.armorType === 'Ferro-Fibrous (Clan)' ? '7' : '0'}</td>
                    <td className="text-center text-green-400">D/C-C-C-B</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-1">Jump Jets:</td>
                    <td className="text-center font-medium">{(config.jumpMP || 0) * (config.tonnage <= 55 ? 0.5 : config.tonnage <= 85 ? 1.0 : 2.0)}t</td>
                    <td className="text-center">{config.jumpMP || 0}</td>
                    <td className="text-center text-green-400">D/C-C-C-C</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-1">Equipment:</td>
                    <td className="text-center font-medium">0.0t</td>
                    <td className="text-center">0</td>
                    <td className="text-center text-slate-400">—</td>
                  </tr>
                  <tr className="border-t-2 border-slate-600 font-medium">
                    <td className="py-2 text-slate-200">Subtotal:</td>
                    <td className="text-center text-slate-200">{(
                      (config.tonnage * 0.1) + // Structure
                      (config.engineRating * (config.engineType === 'XL' ? 0.5 : config.engineType === 'Light' ? 0.75 : 1) / 25) + // Engine
                      Math.ceil(config.engineRating / 100) + // Gyro  
                      3.0 + // Cockpit
                      config.externalHeatSinks + // Heat sinks
                      ((config.jumpMP || 0) * (config.tonnage <= 55 ? 0.5 : config.tonnage <= 85 ? 1.0 : 2.0)) // Jump jets
                    ).toFixed(1)}t</td>
                    <td className="text-center text-slate-200">{
                      (config.structureType === 'Endo Steel' || config.structureType === 'Endo Steel (Clan)' ? 14 : 0) +
                      (config.engineType === 'XL' ? 12 : config.engineType === 'Light' ? 8 : 6) +
                      (config.gyroType === 'XL' ? 6 : config.gyroType === 'Compact' ? 2 : 4) +
                      1 + // Cockpit
                      config.externalHeatSinks +
                      (config.jumpMP || 0)
                    }</td>
                    <td className="text-center text-slate-400">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              <div>Remaining Tonnage: <span className="text-slate-200 font-medium">{(config.tonnage - 
                ((config.tonnage * 0.1) + 
                (config.engineRating * (config.engineType === 'XL' ? 0.5 : config.engineType === 'Light' ? 0.75 : 1) / 25) + 
                Math.ceil(config.engineRating / 100) + 
                3.0 + 
                config.externalHeatSinks + 
                ((config.jumpMP || 0) * (config.tonnage <= 55 ? 0.5 : config.tonnage <= 85 ? 1.0 : 2.0)))
              ).toFixed(1)}t</span></div>
              <div className="mt-1">Available Critical Slots: <span className="text-slate-200 font-medium">{78 - (
                (config.structureType === 'Endo Steel' || config.structureType === 'Endo Steel (Clan)' ? 14 : 0) +
                (config.engineType === 'XL' ? 12 : config.engineType === 'Light' ? 8 : 6) +
                (config.gyroType === 'XL' ? 6 : config.gyroType === 'Compact' ? 2 : 4) +
                1 + config.externalHeatSinks + (config.jumpMP || 0)
              )}</span></div>
            </div>
          </div>
          
          {/* Heat Balance */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="text-slate-100 font-medium text-sm mb-3">Heat Balance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-green-400">{heatDissipation}</div>
                <div className="text-xs text-slate-400">Dissipation</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-400">0</div>
                <div className="text-xs text-slate-400">Generation</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              Heat Sink Efficiency: {config.heatSinkType === 'Double' || config.heatSinkType === 'Double (Clan)' ? '2.0' : '1.0'} per sink
            </div>
          </div>
          
          {/* Critical Slots Summary */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="text-slate-100 font-medium text-sm mb-3">Critical Slots</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Engine Slots:</span>
                <span className="text-slate-100">CT/LT/RT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gyro Slots:</span>
                <span className="text-slate-100">CT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Structure Slots:</span>
                <span className="text-slate-100">—</span>
              </div>
              <div className="flex justify-between border-t border-slate-600 pt-2">
                <span className="text-slate-300 font-medium">Total System:</span>
                <span className="text-slate-100 font-bold">— / 78</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ArmorTabV2: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  const { unit, updateConfiguration } = useUnit();
  const config = unit.getConfiguration();
  
  // Selection state for side panel editing
  const [selectedSection, setSelectedSection] = React.useState<string | null>(null);
  
  // Armor type options based on tech base
  const getArmorTypeOptions = (techBase: string) => {
    const baseOptions = ['Standard', 'Ferro-Fibrous'];
    if (techBase === 'Clan') {
      return [...baseOptions, 'Ferro-Fibrous (Clan)'];
    } else if (techBase === 'Mixed') {
      return [...baseOptions, 'Ferro-Fibrous (Clan)', 'Light Ferro-Fibrous', 'Heavy Ferro-Fibrous'];
    }
    return [...baseOptions, 'Light Ferro-Fibrous', 'Heavy Ferro-Fibrous'];
  };
  
  const armorTypeOptions = getArmorTypeOptions(config.techBase);
  
  // ===== OPTION A: SINGLE SOURCE OF TRUTH + COMPUTED PROPERTIES =====
  // Clean armor points calculation - no data conflicts
  
  const maxArmorTonnage = unit.getMaxArmorTonnage();
  const maxArmorPoints = unit.getMaxArmorPoints();
  const currentArmorTonnage = config.armorTonnage;
  const armorAllocation = config.armorAllocation;
  
  // Use computed properties from data model
  const availableArmorPoints = unit.getAvailableArmorPoints();    // From tonnage
  const allocatedArmorPoints = unit.getAllocatedArmorPoints();    // From allocation
  const unallocatedArmorPoints = unit.getUnallocatedArmorPoints(); // Available - allocated
  const remainingTonnage = unit.getRemainingTonnage();
  
  // Calculate theoretical maximum armor points (sum of all location maximums)
  const theoreticalMaxArmorPoints = React.useMemo(() => {
    const locations = ['HD', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'];
    let totalMax = 0;
    locations.forEach(location => {
      totalMax += unit.getMaxArmorPointsForLocation(location);
    });
    return totalMax;
  }, [unit, config.tonnage]);
  
  // Cap available points to theoretical maximum to prevent over-allocation display
  const cappedAvailablePoints = Math.min(availableArmorPoints, theoreticalMaxArmorPoints);
  
  // Manual calculation to ensure negative values are captured correctly
  const manualUnallocatedPoints = React.useMemo(() => {
    let totalAllocated = 0;
    Object.values(armorAllocation).forEach(armor => {
      totalAllocated += armor.front + armor.rear;
    });
    return cappedAvailablePoints - totalAllocated;
  }, [cappedAvailablePoints, armorAllocation]);
  
  // Use manual calculation if it differs significantly from data model
  const displayUnallocatedPoints = Math.abs(unallocatedArmorPoints - manualUnallocatedPoints) > 0.1 
    ? manualUnallocatedPoints 
    : unallocatedArmorPoints;
  
  // Get max armor for specific location using data model
  const getLocationMaxArmor = (location: string): number => {
    return unit.getMaxArmorPointsForLocation(location);
  };
  
  // Configuration update wrapper with armor tonnage validation
  const updateConfigurationWithValidation = (newConfig: any) => {
    // Validate armor tonnage if it's being updated
    if ('armorTonnage' in newConfig) {
      newConfig.armorTonnage = Math.min(Math.max(newConfig.armorTonnage, 0), maxArmorTonnage);
      
      // Recalculate armor points based on validated tonnage
      const armorEfficiency = unit.getArmorEfficiency();
      newConfig.totalArmorPoints = Math.floor(newConfig.armorTonnage * armorEfficiency);
      newConfig.maxArmorPoints = newConfig.totalArmorPoints;
    }
    
    updateConfiguration(newConfig);
  };

  // Handle armor type change
  const handleArmorTypeChange = (newArmorType: string) => {
    if (readOnly) return;
    updateConfigurationWithValidation({ 
      ...config,
      armorType: newArmorType as any
    });
  };
  
  // Simple, direct armor tonnage update - single source of truth
  const handleArmorTonnageChange = (value: number) => {
    if (readOnly) return;
    
    // Always cap to maximum
    const cappedValue = Math.min(Math.max(value, 0), maxArmorTonnage);
    
    // Calculate armor points based on capped tonnage
    const armorEfficiency = unit.getArmorEfficiency();
    const newTotalArmorPoints = Math.floor(cappedValue * armorEfficiency);
    
    updateConfiguration({
      ...config,
      armorTonnage: cappedValue
    });
  };

  // Auto-reduce armor tonnage when maximum changes (unit tonnage or armor type changes)
  React.useEffect(() => {
    if (currentArmorTonnage > maxArmorTonnage) {
      console.log(`Auto-reducing armor tonnage from ${currentArmorTonnage} to max ${maxArmorTonnage}`);
      handleArmorTonnageChange(maxArmorTonnage);
    }
  }, [maxArmorTonnage, config.tonnage, config.armorType]);

  // Ensure armor points are calculated from tonnage on load
  React.useEffect(() => {
    if (currentArmorTonnage > 0 && availableArmorPoints === 0) {
      console.log(`Recalculating armor points from tonnage: ${currentArmorTonnage}t`);
      // The data model will automatically calculate points from tonnage
      // No manual update needed - computed properties handle this
    }
  }, [currentArmorTonnage, availableArmorPoints, unit, config]);
  
  // Handle maximize armor tonnage (set tonnage to maximum allowed)
  const handleMaximizeArmor = () => {
    if (readOnly) return;
    
    updateConfigurationWithValidation({
      ...config,
      armorTonnage: maxArmorTonnage
      // Keep existing armorAllocation unchanged
    });
  };
  
  // Handle individual armor location changes
  const handleArmorLocationChange = (location: string, front: number, rear: number = 0) => {
    if (readOnly) return;
    
    const newAllocation = {
      ...armorAllocation,
      [location]: { front, rear }
    };
    
    updateConfiguration({
      ...config,
      armorAllocation: newAllocation as any
    });
  };
  
  // Enhanced auto-allocate armor with remainder distribution
  const handleAutoAllocate = () => {
    if (readOnly) return;
    
    // Enhanced MegaMekLab-style armor allocation algorithm
    // 1. Maximize head armor first
    // 2. Distribute remaining points by internal structure ratios
    // 3. Apply 75% front / 25% rear split for torsos
    // 4. NEW: Distribute remainder points using priority allocation
    
    const locations = ['HD', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'];
    const newAllocation = { ...armorAllocation };
    let remainingPoints = availableArmorPoints;
    
    // Clear current allocation
    locations.forEach(loc => {
      (newAllocation as any)[loc] = { front: 0, rear: 0 };
    });
    
    // Step 1: Maximize head armor first (official BattleTech construction rule)
    const headMaxArmor = getLocationMaxArmor('HD'); // Always 9 for head
    const headArmor = Math.min(headMaxArmor, remainingPoints);
    (newAllocation as any)['HD'] = { front: headArmor, rear: 0 };
    remainingPoints -= headArmor;
    
    // Step 2: Get internal structure points for remaining locations
    const getRemainingLocationIS = (location: string): number => {
      const maxLocationArmor = getLocationMaxArmor(location);
      
      if (location === 'HD') {
        return 0; // Head already handled
      }
      
      // Calculate IS from max armor (max armor = IS * 2 for non-head locations)
      return Math.floor(maxLocationArmor / 2);
    };
    
    const remainingLocations = ['CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'];
    const internalStructure: { [key: string]: number } = {};
    let totalRemainingIS = 0;
    
    remainingLocations.forEach(location => {
      const is = getRemainingLocationIS(location);
      internalStructure[location] = is;
      totalRemainingIS += is;
    });
    
    // Step 3: Distribute remaining points by internal structure ratios (using Math.floor)
    const distributedPoints: { [key: string]: number } = {};
    let usedPoints = 0;
    
    remainingLocations.forEach(location => {
      if (totalRemainingIS === 0) return; // Safety check
      
      const isRatio = internalStructure[location] / totalRemainingIS;
      const targetArmor = Math.floor(remainingPoints * isRatio);
      const maxLocationArmor = getLocationMaxArmor(location);
      const actualArmor = Math.min(targetArmor, maxLocationArmor);
      
      distributedPoints[location] = actualArmor;
      usedPoints += actualArmor;
      
      // Apply 75% front / 25% rear split for torso locations
      if (['CT', 'LT', 'RT'].includes(location)) {
        const frontArmor = Math.ceil(actualArmor * 0.75);
        const rearArmor = actualArmor - frontArmor;
        
        // Ensure rear armor doesn't exceed location limits
        const maxRearArmor = Math.floor(maxLocationArmor * 0.5); // Rear armor limited to 50% of max
        const finalRearArmor = Math.min(rearArmor, maxRearArmor);
        const finalFrontArmor = actualArmor - finalRearArmor;
        
        (newAllocation as any)[location] = {
          front: finalFrontArmor,
          rear: finalRearArmor
        };
      } else {
        // Arms and legs get no rear armor
        (newAllocation as any)[location] = {
          front: actualArmor,
          rear: 0
        };
      }
    });
    
    // Step 4: NEW - Symmetric remainder distribution with left/right balance
    const remainder = remainingPoints - usedPoints;
    
    if (remainder > 0) {
      console.log(`Distributing ${remainder} remainder points with symmetry...`);
      
      // Get current armor for each location after ratio distribution
      const getCurrentArmor = (location: string) => {
        return (newAllocation as any)[location].front + (newAllocation as any)[location].rear;
      };
      
      // Check capacity for each location
      const getAvailableCapacity = (location: string) => {
        const maxArmor = getLocationMaxArmor(location);
        const currentArmor = getCurrentArmor(location);
        return maxArmor - currentArmor;
      };
      
      let remainderToDistribute = remainder;
      
      // Handle odd remainder: give 1 point to Center Torso first
      if (remainderToDistribute % 2 === 1) {
        const ctCapacity = getAvailableCapacity('CT');
        if (ctCapacity > 0) {
          (newAllocation as any)['CT'].front += 1;
          remainderToDistribute -= 1;
          console.log(`Added 1 remainder point to CT (odd remainder handling)`);
        }
      }
      
      // Define symmetric pairs in priority order: Torsos > Legs > Arms
      const symmetricPairs = [
        ['LT', 'RT'], // Left/Right Torso (highest priority)
        ['LL', 'RL'], // Left/Right Leg (medium priority)  
        ['LA', 'RA']  // Left/Right Arm (lowest priority)
      ];
      
      // Distribute remaining even points to symmetric pairs
      for (const [leftLoc, rightLoc] of symmetricPairs) {
        if (remainderToDistribute <= 0) break;
        
        // Check if both locations have capacity
        const leftCapacity = getAvailableCapacity(leftLoc);
        const rightCapacity = getAvailableCapacity(rightLoc);
        
        if (leftCapacity > 0 && rightCapacity > 0 && remainderToDistribute >= 2) {
          // Add one point to each side
          (newAllocation as any)[leftLoc].front += 1;
          (newAllocation as any)[rightLoc].front += 1;
          remainderToDistribute -= 2;
          console.log(`Added 1 remainder point each to ${leftLoc} and ${rightLoc} (symmetric pair)`);
        }
      }
      
      // If there are still points left and we couldn't maintain symmetry, 
      // fall back to priority-based single point distribution
      if (remainderToDistribute > 0) {
        console.log(`Distributing final ${remainderToDistribute} points individually...`);
        
        const allLocations = ['CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'];
        const locationsByPriority = allLocations
          .map(location => ({
            location,
            capacity: getAvailableCapacity(location),
            priority: location === 'CT' ? 4 : 
                     ['LT', 'RT'].includes(location) ? 3 :
                     ['LL', 'RL'].includes(location) ? 2 : 1
          }))
          .filter(item => item.capacity > 0)
          .sort((a, b) => {
            if (a.priority !== b.priority) {
              return b.priority - a.priority;
            }
            return b.capacity - a.capacity;
          });
        
        let priorityIndex = 0;
        while (remainderToDistribute > 0 && locationsByPriority.length > 0) {
          const target = locationsByPriority[priorityIndex];
          
          if (target.capacity > 0) {
            (newAllocation as any)[target.location].front += 1;
            target.capacity -= 1;
            remainderToDistribute -= 1;
            console.log(`Added 1 final remainder point to ${target.location}`);
          }
          
          if (target.capacity <= 0) {
            locationsByPriority.splice(priorityIndex, 1);
            if (priorityIndex >= locationsByPriority.length) {
              priorityIndex = 0;
            }
          } else {
            priorityIndex = (priorityIndex + 1) % locationsByPriority.length;
          }
        }
      }
      
      if (remainderToDistribute > 0) {
        console.warn(`Could not distribute ${remainderToDistribute} remainder points - all locations at maximum`);
      }
    }
    
    updateConfiguration({
      ...config,
      armorAllocation: newAllocation as any
    });
  };
  
  // Handle use remaining tonnage using data model
  const handleUseRemainingTonnage = () => {
    if (readOnly) return;
    
    // Use data model method for remaining tonnage calculation
    const newArmorTonnage = unit.getRemainingTonnageForArmor();
    
    updateConfigurationWithValidation({
      ...config,
      armorTonnage: newArmorTonnage
      // Keep existing armorAllocation unchanged
    });
  };
  
  // Calculate remaining tonnage for display using data model
  const getRemainingTonnage = (): number => {
    return unit.getRemainingTonnage();
  };

  return (
    <div className="p-4 h-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
        {/* Left Panel: Armor Configuration (1/3) */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800 rounded-lg border border-slate-700 h-full flex flex-col">
            {/* Header */}
            <div className="p-3 border-b border-slate-700">
              <h3 className="text-slate-100 font-medium">Armor Configuration</h3>
            </div>
            
            {/* Configuration Content */}
            <div className="flex-1 p-4 space-y-4">
              {/* Armor Type Selection */}
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-2">Armor Type</label>
                <select
                  value={config.armorType}
                  onChange={(e) => handleArmorTypeChange(e.target.value)}
                  disabled={readOnly}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:border-blue-500"
                >
                  {armorTypeOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
              {/* Armor Tonnage */}
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-2">
                  Armor Tonnage ({currentArmorTonnage.toFixed(1)} / {maxArmorTonnage.toFixed(1)} tons)
                </label>
                <input
                  type="number"
                  min={0}
                  max={maxArmorTonnage}
                  step={0.5}
                  value={currentArmorTonnage}
                  onChange={(e) => handleArmorTonnageChange(parseFloat(e.target.value) || 0)}
                  disabled={readOnly}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:border-blue-500"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={handleMaximizeArmor}
                    disabled={readOnly}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded text-sm transition-colors"
                  >
                    Maximize
                  </button>
                  <button
                    onClick={handleUseRemainingTonnage}
                    disabled={readOnly}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded text-sm transition-colors"
                  >
                    Use Remaining
                  </button>
                </div>
              </div>
              
              {/* Armor Points Summary */}
              <div className="bg-slate-700/50 rounded p-3">
                <h4 className="text-slate-200 font-medium mb-2">Armor Points</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Available:</span>
                    <span className="text-slate-100">{cappedAvailablePoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Allocated:</span>
                    <span className="text-slate-100">{allocatedArmorPoints}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-600 pt-1">
                    <span className="text-slate-300 font-medium">Unallocated:</span>
                    <span className={`font-medium ${displayUnallocatedPoints < 0 ? 'text-red-400' : 'text-slate-100'}`}>
                      {displayUnallocatedPoints}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Auto-Allocate Button */}
              <button
                onClick={handleAutoAllocate}
                disabled={readOnly || availableArmorPoints === 0}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:text-slate-400 text-white rounded font-medium transition-colors"
              >
                Auto-Allocate Armor
              </button>
              
              {/* Remaining Tonnage Info */}
              <div className="bg-slate-700/30 rounded p-3">
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Remaining Tonnage:</span>
                    <span className="text-slate-100 font-medium">{remainingTonnage.toFixed(1)}t</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Panel: Armor Allocation (2/3) */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800 rounded-lg border border-slate-700 h-full flex flex-col">
            {/* Header */}
            <div className="p-3 border-b border-slate-700">
              <h3 className="text-slate-100 font-medium">Armor Allocation</h3>
              <div className="text-slate-400 text-xs mt-1">
                Click on location sections to select and edit armor values
              </div>
            </div>
            
            {/* Armor Allocation Content */}
            <div className="flex-1 p-4">
              <div className="grid grid-cols-2 gap-4 h-full">
                {/* Left Column - Front Locations */}
                <div className="space-y-3">
                  <h4 className="text-slate-200 font-medium mb-3">Front Armor</h4>
                  
                  {/* Head */}
                  <div className="bg-slate-700/50 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 font-medium">Head</span>
                      <span className="text-slate-400 text-xs">Max: {getLocationMaxArmor('HD')}</span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={getLocationMaxArmor('HD')}
                      value={armorAllocation.HD?.front || 0}
                      onChange={(e) => handleArmorLocationChange('HD', parseInt(e.target.value) || 0, armorAllocation.HD?.rear || 0)}
                      disabled={readOnly}
                      className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-slate-100 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Center Torso */}
                  <div className="bg-slate-700/50 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 font-medium">Center Torso</span>
                      <span className="text-slate-400 text-xs">Max: {getLocationMaxArmor('CT')}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-400 text-xs">Front</label>
                        <input
                          type="number"
                          min={0}
                          max={getLocationMaxArmor('CT')}
                          value={armorAllocation.CT?.front || 0}
                          onChange={(e) => handleArmorLocationChange('CT', parseInt(e.target.value) || 0, armorAllocation.CT?.rear || 0)}
                          disabled={readOnly}
                          className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-slate-100 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-xs">Rear</label>
                        <input
                          type="number"
                          min={0}
                          max={Math.floor(getLocationMaxArmor('CT') / 2)}
                          value={armorAllocation.CT?.rear || 0}
                          onChange={(e) => handleArmorLocationChange('CT', armorAllocation.CT?.front || 0, parseInt(e.target.value) || 0)}
                          disabled={readOnly}
                          className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-slate-100 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Left Arm */}
                  <div className="bg-slate-700/50 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 font-medium">Left Arm</span>
                      <span className="text-slate-400 text-xs">Max: {getLocationMaxArmor('LA')}</span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={getLocationMaxArmor('LA')}
                      value={armorAllocation.LA?.front || 0}
                      onChange={(e) => handleArmorLocationChange('LA', parseInt(e.target.value) || 0, 0)}
                      disabled={readOnly}
                      className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-slate-100 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Left Leg */}
                  <div className="bg-slate-700/50 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 font-medium">Left Leg</span>
                      <span className="text-slate-400 text-xs">Max: {getLocationMaxArmor('LL')}</span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={getLocationMaxArmor('LL')}
                      value={armorAllocation.LL?.front || 0}
                      onChange={(e) => handleArmorLocationChange('LL', parseInt(e.target.value) || 0, 0)}
                      disabled={readOnly}
                      className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-slate-100 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                {/* Right Column - Remaining Locations */}
                <div className="space-y-3">
                  <h4 className="text-slate-200 font-medium mb-3">Side & Rear Armor</h4>
                  
                  {/* Left Torso */}
                  <div className="bg-slate-700/50 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 font-medium">Left Torso</span>
                      <span className="text-slate-400 text-xs">Max: {getLocationMaxArmor('LT')}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-400 text-xs">Front</label>
                        <input
                          type="number"
                          min={0}
                          max={getLocationMaxArmor('LT')}
                          value={armorAllocation.LT?.front || 0}
                          onChange={(e) => handleArmorLocationChange('LT', parseInt(e.target.value) || 0, armorAllocation.LT?.rear || 0)}
                          disabled={readOnly}
                          className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-slate-100 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-xs">Rear</label>
                        <input
                          type="number"
                          min={0}
                          max={Math.floor(getLocationMaxArmor('LT') / 2)}
                          value={armorAllocation.LT?.rear || 0}
                          onChange={(e) => handleArmorLocationChange('LT', armorAllocation.LT?.front || 0, parseInt(e.target.value) || 0)}
                          disabled={readOnly}
                          className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-slate-100 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Torso */}
                  <div className="bg-slate-700/50 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 font-medium">Right Torso</span>
                      <span className="text-slate-400 text-xs">Max: {getLocationMaxArmor('RT')}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-400 text-xs">Front</label>
                        <input
                          type="number"
                          min={0}
                          max={getLocationMaxArmor('RT')}
                          value={armorAllocation.RT?.front || 0}
                          onChange={(e) => handleArmorLocationChange('RT', parseInt(e.target.value) || 0, armorAllocation.RT?.rear || 0)}
                          disabled={readOnly}
                          className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-slate-100 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-xs">Rear</label>
                        <input
                          type="number"
                          min={0}
                          max={Math.floor(getLocationMaxArmor('RT') / 2)}
                          value={armorAllocation.RT?.rear || 0}
                          onChange={(e) => handleArmorLocationChange('RT', armorAllocation.RT?.front || 0, parseInt(e.target.value) || 0)}
                          disabled={readOnly}
                          className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-slate-100 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Arm */}
                  <div className="bg-slate-700/50 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 font-medium">Right Arm</span>
                      <span className="text-slate-400 text-xs">Max: {getLocationMaxArmor('RA')}</span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={getLocationMaxArmor('RA')}
                      value={armorAllocation.RA?.front || 0}
                      onChange={(e) => handleArmorLocationChange('RA', parseInt(e.target.value) || 0, 0)}
                      disabled={readOnly}
                      className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-slate-100 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Right Leg */}
                  <div className="bg-slate-700/50 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 font-medium">Right Leg</span>
                      <span className="text-slate-400 text-xs">Max: {getLocationMaxArmor('RL')}</span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={getLocationMaxArmor('RL')}
                      value={armorAllocation.RL?.front || 0}
                      onChange={(e) => handleArmorLocationChange('RL', parseInt(e.target.value) || 0, 0)}
                      disabled={readOnly}
                      className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-slate-100 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EquipmentTabV2: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  const { unit } = useUnit();
  
  // Tray state for hover-based expansion
  const [isTrayExpanded, setIsTrayExpanded] = useState(false);
  
  // Helper function to check if equipment is a special structural component
  const isSpecialComponent = (equipment: any) => {
    if (!equipment?.equipmentData) return false;
    
    const name = equipment.equipmentData.name?.toLowerCase() || '';
    const type = equipment.equipmentData.type?.toLowerCase() || '';
    
    // Filter out structural components that shouldn't appear in equipment view
    const specialComponents = [
      'ferro-fibrous', 'ferro fibrous', 'endo steel', 'endo-steel',
      'standard', 'composite', 'reinforced', 'industrial',
      'heat sink', 'heat-sink', 'double heat sink',
      'jump jet', 'jump-jet', 'standard jump jet'
    ];
    
    return specialComponents.some(component => 
      name.includes(component) || 
      (equipment.equipmentData.componentType && 
       ['structure', 'armor'].includes(equipment.equipmentData.componentType))
    );
  };
  
  // Get filtered equipment (excluding special components)
  const getFilteredEquipment = () => {
    const allEquipment = unit.getAllEquipment();
    const filtered = new Map();
    
    allEquipment.forEach((equipmentList, equipmentId) => {
      const nonSpecialEquipment = equipmentList.filter(eq => !isSpecialComponent(eq));
      if (nonSpecialEquipment.length > 0) {
        filtered.set(equipmentId, nonSpecialEquipment);
      }
    });
    
    return filtered;
  };
  
  // Calculate totals for current loadout
  const calculateTotals = () => {
    const filteredEquipment = getFilteredEquipment();
    let totalWeight = 0;
    let totalCrits = 0;
    let totalHeat = 0;
    
    filteredEquipment.forEach(equipmentList => {
      equipmentList.forEach((allocation: any) => {
        totalWeight += allocation.equipmentData.weight || 0;
        totalCrits += allocation.equipmentData.requiredSlots || 0;
        totalHeat += allocation.equipmentData.heat || 0;
      });
    });
    
    return { totalWeight, totalCrits, totalHeat };
  };
  
  const { totalWeight, totalCrits, totalHeat } = calculateTotals();
  const filteredEquipment = getFilteredEquipment();
  
  // Remove all equipment handler
  const handleRemoveAllEquipment = () => {
    if (readOnly) return;
    
    // Remove all non-special equipment
    filteredEquipment.forEach(equipmentList => {
      equipmentList.forEach((allocation: any) => {
        const found = unit.findEquipmentGroup(allocation.equipmentGroupId);
        if (found && found.section) {
          found.section.removeEquipmentGroup(allocation.equipmentGroupId);
        } else {
          unit.removeUnallocatedEquipment(allocation.equipmentGroupId);
        }
      });
    });
  };
  
  // Remove individual equipment handler
  const handleRemoveEquipment = (equipmentGroupId: string) => {
    if (readOnly) return;
    
    const found = unit.findEquipmentGroup(equipmentGroupId);
    if (found && found.section) {
      found.section.removeEquipmentGroup(equipmentGroupId);
    } else {
      unit.removeUnallocatedEquipment(equipmentGroupId);
    }
  };
  
  return (
    <div className="p-4 h-full flex gap-4">
      {/* Main Content Area - Equipment Browser */}
      <div className={`
        flex-1 bg-slate-800 rounded-lg border border-slate-700 flex flex-col
        transition-all duration-300 ease-in-out
        ${isTrayExpanded ? 'mr-2' : 'mr-0'}
      `}>
        {/* Header */}
        <div className="p-3 border-b border-slate-700">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-slate-100 font-medium">Equipment Database</h3>
            <div className="text-yellow-400 text-xs">
              Ctrl+Click filters to add to selection
            </div>
          </div>
        </div>
        
        {/* Equipment Browser */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full">
            <EquipmentBrowser />
          </div>
        </div>
      </div>
      
      {/* Persistent Right Tray */}
      <div 
        className={`
          bg-slate-800 border border-slate-700 rounded-lg flex flex-col
          transition-all duration-300 ease-in-out
          ${isTrayExpanded ? 'w-80' : 'w-12'}
          hover:cursor-pointer
        `}
        onMouseEnter={() => setIsTrayExpanded(true)}
        onMouseLeave={() => setIsTrayExpanded(false)}
      >
        {/* Tray Header */}
        <div className="p-3 border-b border-slate-700 flex items-center justify-center">
          {isTrayExpanded ? (
            <h3 className="text-slate-100 font-medium text-sm">Unallocated Equipment</h3>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={1.5} 
                stroke="currentColor" 
                className="w-5 h-5 text-slate-400"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
              <div className="text-xs text-slate-400 text-center leading-tight">
                <div>UN</div>
                <div>EQ</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Tray Content */}
        <div className="flex-1 overflow-hidden">
          {isTrayExpanded ? (
            <div className="p-4 h-full overflow-y-auto">
              <UnallocatedEquipmentDisplay />
            </div>
          ) : (
            <div className="p-2 flex flex-col items-center justify-start gap-2 h-full overflow-hidden">
              {/* Collapsed state - show just a count or indicator */}
              <div className="text-xs text-slate-500 text-center">
                <div className="text-slate-400 font-medium">0</div>
                <div className="text-slate-600">items</div>
              </div>
              
              {/* Visual separator */}
              <div className="w-6 h-px bg-slate-600"></div>
              
              {/* Hover hint */}
              <div className="text-xs text-slate-600 text-center transform rotate-90 mt-8">
                HOVER
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CriticalsTabV2: React.FC<{ readOnly?: boolean }> = () => (
  <div className="p-6 text-center text-slate-400">
    <h3 className="text-lg font-medium mb-2">Critical Slots Tab</h3>
    <p>Coming soon - Critical slot allocation using V2 system</p>
  </div>
);

const FluffTabV2: React.FC<{ readOnly?: boolean }> = () => (
  <div className="p-6 text-center text-slate-400">
    <h3 className="text-lg font-medium mb-2">Fluff Tab</h3>
    <p>Coming soon - Unit background and description</p>
  </div>
);

// Inner component that uses the V2 data model
function CustomizerV2Content() {
  const router = useRouter();
  const { unit, engineType, gyroType, summary } = useUnit();
  
  // Valid tab IDs
  const validTabs = ['structure', 'armor', 'equipment', 'criticals', 'fluff'];
  
  // Get initial tab from URL or default to 'structure'
  const getInitialTab = () => {
    const tabFromUrl = router.query.tab as string;
    return validTabs.includes(tabFromUrl) ? tabFromUrl : 'structure';
  };
  
  const [activeTab, setActiveTab] = useState<string>(getInitialTab());
  
  // Update activeTab when URL changes
  useEffect(() => {
    const tabFromUrl = router.query.tab as string;
    if (tabFromUrl && validTabs.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [router.query.tab, activeTab]);
  
  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    
    // Update URL without triggering navigation
    const newQuery = { ...router.query, tab: tabId };
    router.replace(
      {
        pathname: router.pathname,
        query: newQuery,
      },
      undefined,
      { shallow: true }
    );
  };
  
  // Calculate unit statistics from V2 data model with validation
  const calculateCurrentWeight = (): number => {
    const modelWeight = unit.getUsedTonnage();
    const config = unit.getConfiguration();
    
    // Manual calculation for validation
    const structureWeight = config.tonnage * 0.1;
    const engineWeight = unit.getEngineWeight();
    const gyroWeight = unit.getGyroWeight();
    const cockpitWeight = 3.0;
    const heatSinkWeight = config.externalHeatSinks * unit.getHeatSinkTonnage();
    const jumpJetWeight = unit.getJumpJetWeight();
    const armorWeight = config.armorTonnage;
    
    const validatedWeight = structureWeight + engineWeight + gyroWeight + cockpitWeight + heatSinkWeight + jumpJetWeight + armorWeight;
    
    // Check for discrepancy
    const discrepancy = Math.abs(modelWeight - validatedWeight);
    if (discrepancy > 0.1) {
      console.warn(`Weight calculation discrepancy detected:
        Model: ${modelWeight.toFixed(1)}t
        Validated: ${validatedWeight.toFixed(1)}t
        Armor tonnage: ${armorWeight.toFixed(1)}t
        Discrepancy: ${discrepancy.toFixed(1)}t`);
      
      // Always use validated calculation to ensure accuracy
      return validatedWeight;
    }
    
    return validatedWeight; // Always use validated weight for consistency
  };
  
  const calculateHeatBalance = (): { generated: number; dissipated: number } => {
    // Get heat info directly from data model methods
    return {
      generated: unit.getHeatGeneration(),
      dissipated: unit.getHeatDissipation()
    };
  };
  
  const calculateCriticalSlots = (): { total: number; required: number; assigned: number } => {
    // Get critical slot info from data model summary
    const summary = unit.getSummary();
    return {
      total: 78, // Standard BattleMech total
      required: summary.occupiedSlots,
      assigned: summary.occupiedSlots
    };
  };
  
  // Get unit configuration from V2 system
  const unitConfig = unit.getConfiguration();
  
  // Force re-calculation on every render to ensure fresh data
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Force refresh when armor tonnage changes
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [unitConfig.armorTonnage, unitConfig.tonnage, unitConfig.engineType, unitConfig.gyroType]);
  
  const currentWeight = calculateCurrentWeight();
  const heatBalance = calculateHeatBalance();
  const criticalSlots = calculateCriticalSlots();
  
  // Calculate enhanced movement for header display using shared utility
  const enhancedMovement = calculateEnhancedMovement(unitConfig);
  
  // Default unit info (will be configurable in future versions)
  const unitInfo = {
    chassis: 'New Mek', // Default chassis name
    model: '', // No model designation for new mech
    rulesLevel: 'Standard', // Default rules level
    era: '3025' // Default era
  };
  
  // Tab configuration
  const tabs = [
    { id: 'structure', label: 'Structure', component: StructureTabV2 },
    { id: 'armor', label: 'Armor', component: ArmorTabV2 },
    { id: 'equipment', label: 'Equipment', component: EquipmentTabV2 },
    { id: 'criticals', label: 'Criticals', component: CriticalsTabV2 },
    { id: 'fluff', label: 'Fluff', component: FluffTabV2 },
  ];
  
  const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component || StructureTabV2;
  
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Unit Information Banner */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left Side: Unit Info */}
          <div className="space-y-2">
            {/* Unit Name and Type */}
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-slate-100">
                {unitInfo.chassis} {unitInfo.model}
              </h2>
              <span className="text-sm text-slate-400">
                {unitConfig.tonnage}-ton {unitConfig.techBase} BattleMech
              </span>
            </div>
            
            {/* Engine and Gyro Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Engine:</span>
                <span className="text-sm text-slate-200">{engineType} {unitConfig.engineRating}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Gyro:</span>
                <span className="text-sm text-slate-200">{gyroType}</span>
              </div>
            </div>
          </div>
          
          {/* Right Side: Key Statistics */}
          <div className="flex items-center gap-6 text-sm">
            {/* Weight */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Weight:</span>
              <span className={`font-medium ${
                currentWeight > unitConfig.tonnage ? 'text-red-400' : 'text-slate-200'
              }`}>
                {currentWeight.toFixed(1)} / {unitConfig.tonnage} tons
              </span>
            </div>
            
            {/* Heat */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Heat:</span>
              <span className={`font-medium ${
                heatBalance.generated > heatBalance.dissipated ? 'text-orange-400' : 'text-green-400'
              }`}>
                {heatBalance.generated} / {heatBalance.dissipated}
              </span>
            </div>
            
            {/* Movement */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Movement:</span>
              <span className="font-medium text-slate-200">
                {enhancedMovement.combinedDisplay}
              </span>
            </div>
            
            {/* Critical Slots */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Crits:</span>
              <span className={`font-medium ${
                criticalSlots.required > criticalSlots.total ? 'text-red-400' : 'text-slate-200'
              }`}>
                {criticalSlots.required} / {criticalSlots.total}
              </span>
            </div>
            
            {/* Rules Level */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Rules:</span>
              <span className="font-medium text-slate-200">
                {unitInfo.rulesLevel}
              </span>
            </div>
            
            {/* Era */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Era:</span>
              <span className="font-medium text-slate-200">
                {unitInfo.era}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-700 bg-slate-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`
              px-6 py-3 text-sm font-medium transition-colors
              ${activeTab === tab.id 
                ? 'text-slate-100 border-b-2 border-blue-500 bg-slate-700/50' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
              }
            `}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="bg-slate-900">
        <ActiveTabComponent readOnly={false} />
      </div>
    </div>
  );
}

// Main component with UnitProvider
const CustomizerV2Page: React.FC = () => {
  return (
    <>
      <Head>
        <title>Customizer V2 | BattleTech Editor</title>
        <meta name="description" content="Next generation unit customizer using the V2 data model with advanced critical slot management." />
      </Head>
      
      <UnitProvider>
        <CustomizerV2Content />
      </UnitProvider>
    </>
  );
};

export default CustomizerV2Page;
