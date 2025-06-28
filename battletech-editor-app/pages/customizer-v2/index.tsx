/**
 * Customizer V2 - Next generation unit customizer using the V2 data model
 * Built on top of the UnitCriticalManager system from the critical slots v2 demo
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { MultiUnitProvider, useUnit } from '../../components/multiUnit/MultiUnitProvider';
import { TabManager } from '../../components/multiUnit/TabManager';
import { calculateEnhancedMovement, formatEngineMovementInfo, formatCondensedMovement } from '../../utils/movementCalculations';
import { ARMOR_POINTS_PER_TON, calculateArmorWeight, getArmorSlots } from '../../utils/armorCalculations';
import { calculateMaxArmorPoints, calculateMaxArmorTonnage, calculateRemainingTonnage, useRemainingTonnageForArmor } from '../../utils/armorAllocation';
import { TabContentWrapper } from '../../components/common/TabContentWrapper';

// Import skeleton components
import {
  SkeletonInput,
  SkeletonSelect,
  SkeletonNumberInput,
  SkeletonText,
  SkeletonFormSection
} from '../../components/common/SkeletonLoader';

// Import equipment components
import { EquipmentBrowserRefactored as EquipmentBrowser } from '../../components/equipment/EquipmentBrowserRefactored';
import { EquipmentTray } from '../../components/criticalSlots/EquipmentTray';
import { EquipmentObject } from '../../utils/criticalSlots/CriticalSlot';

// Import working critical slots components
import { SystemComponentControls } from '../../components/criticalSlots/SystemComponentControls';
import { CriticalSlotsDisplay } from '../../components/criticalSlots/CriticalSlotsDisplay';
import { UnallocatedEquipmentDisplay } from '../../components/criticalSlots/UnallocatedEquipmentDisplay';
import { EquipmentAllocationDebugPanel } from '../../components/criticalSlots/EquipmentAllocationDebugPanel';

// No additional imports needed - will use basic implementation

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
    <div className="p-3 max-w-7xl mx-auto">
      {/* Responsive 2-Column Layout with better mobile handling */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Left Column: Component Configuration - Condensed 3-Section Layout */}
        <div className="space-y-3 sm:space-y-4 flex flex-col min-h-0 overflow-y-auto scrollbar-autohide">
          {/* 1. Core Unit Configuration - Combines Unit + Engine */}
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50 shadow-lg hover:border-slate-600/50 transition-all duration-200">
            <h3 className="text-slate-100 font-semibold text-sm mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Core Unit Configuration
            </h3>

            {/* First Row: Tonnage + Tech Base */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-slate-300 text-xs font-medium block mb-2">Tonnage</label>
                {isConfigLoaded ? (
                  <input
                    type="number"
                    min={20}
                    step={5}
                    value={config.tonnage}
                    onChange={(e) => updateConfig({ tonnage: parseInt(e.target.value) || 20 })}
                    disabled={readOnly}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-slate-600/50 rounded-md text-sm text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-center transition-all duration-200 hover:border-slate-500"
                    aria-label="Unit tonnage"
                  />
                ) : (
                  <SkeletonInput />
                )}
                <div className="text-xs text-slate-400 text-center mt-1.5">
                  20-100t (step: 5)
                </div>
              </div>
              <div>
                <label className="text-slate-300 text-xs font-medium block mb-2">Tech Base</label>
                {isConfigLoaded ? (
                  <select
                    value={config.techBase}
                    onChange={(e) => updateConfig({ techBase: e.target.value })}
                    disabled={readOnly}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-slate-600/50 rounded-md text-sm text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-slate-500"
                    aria-label="Technology base"
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

            {/* Second Row: Engine Type + Rating */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 text-xs font-medium block mb-2">Engine Type</label>
                {isConfigLoaded ? (
                  <select
                    value={config.engineType}
                    onChange={(e) => updateConfig({ engineType: e.target.value })}
                    disabled={readOnly}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-slate-600/50 rounded-md text-sm text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-slate-500"
                    aria-label="Engine type"
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
                <label className="text-slate-300 text-xs font-medium block mb-2">Engine Rating</label>
                {isConfigLoaded ? (
                  <div className="bg-slate-700/50 border border-slate-600/50 rounded-md px-3 py-2 text-sm text-slate-100 text-center font-medium">
                    {config.engineRating}
                  </div>
                ) : (
                  <SkeletonText />
                )}
              </div>
            </div>

            {/* Movement Summary - Full Width */}
            {isConfigLoaded ? (
              <div className="mt-4 text-xs text-slate-300 text-center bg-slate-700/40 rounded-md px-3 py-2 border border-slate-600/30">
                <span className="font-medium">Walk:</span> {config.walkMP} MP |
                <span className="font-medium"> Run:</span> {config.runMP} MP |
                <span className="font-medium"> Max:</span> {maxWalkMP} MP
              </div>
            ) : (
              <div className="mt-4 h-8 bg-slate-600/50 rounded-md animate-pulse"></div>
            )}
          </div>

          {/* 2. System Components - Combines Structure & Gyro + Enhancement */}
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50 shadow-lg hover:border-slate-600/50 transition-all duration-200">
            <h3 className="text-slate-100 font-semibold text-sm mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              System Components
            </h3>

            {/* First Row: Structure + Gyro */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-slate-300 text-xs block mb-1">Structure</label>
                {isConfigLoaded ? (
                  <select
                    value={config.structureType}
                    onChange={(e) => {
                      console.log('[StructureTab] Structure type changing from', config.structureType, 'to', e.target.value)
                      updateConfig({ structureType: e.target.value })
                      console.log('[StructureTab] updateConfig called')
                    }}
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

            {/* Second Row: Enhancement Type */}
            <div>
              <label className="text-slate-300 text-xs block mb-1">Enhancement Type</label>
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

            {/* Enhancement Details - Conditional Full Width */}
            {config.enhancementType === 'MASC' && (
              <div className="mt-3 text-xs text-slate-400 bg-slate-700/30 rounded px-3 py-2">
                <div>• Doubles run speed when active</div>
                <div>• Generates 5 heat per activation</div>
                <div>• Risk of system damage if overused</div>
              </div>
            )}
            {config.enhancementType === 'Triple Strength Myomer' && (
              <div className="mt-3 text-xs text-slate-400 bg-slate-700/30 rounded px-3 py-2">
                <div>• Activates at 9+ heat levels</div>
                <div>• +1 Walk MP, recalculated Run MP</div>
                <div>• Doubles physical attack damage</div>
                <div>• Heat: {heatDissipation - config.totalHeatSinks}/9+ for activation</div>
              </div>
            )}
          </div>

          {/* 3. Heat Management - Keep as separate focused section */}
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50 shadow-lg hover:border-slate-600/50 transition-all duration-200">
            <h3 className="text-slate-100 font-semibold text-sm mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Heat Management
            </h3>
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
        </div>

        {/* Right Column: Stats & Summary */}
        <div className="space-y-3 sm:space-y-4 flex flex-col min-h-0 overflow-y-auto scrollbar-elegant">
          {/* Movement Configuration */}
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 shadow-lg hover:border-slate-600/50 transition-all duration-200">
            <h3 className="text-slate-100 font-semibold text-sm mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
              Movement Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="text-slate-300 text-xs font-medium block mb-2">Walk MP</label>
                <input
                  type="number"
                  value={config.walkMP}
                  onChange={(e) => handleWalkMPChange(parseInt(e.target.value) || 1)}
                  disabled={readOnly}
                  min={1}
                  max={maxWalkMP}
                  className="w-full px-3 py-2 bg-slate-700/80 border border-slate-600/50 rounded-md text-sm text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-center transition-all duration-200 hover:border-slate-500"
                  aria-label="Walk movement points"
                />
                <div className="text-xs text-slate-400 text-center mt-1.5">
                  Max: {maxWalkMP}
                </div>
              </div>
              <div>
                <label className="text-slate-300 text-xs font-medium block mb-2">Run MP</label>
                <div className="bg-slate-700/50 border border-slate-600/50 rounded-md px-3 py-2 text-sm text-slate-100 text-center font-medium">
                  {enhancedMovement.runDisplay}
                </div>
                <div className="text-xs text-slate-400 text-center mt-1.5">
                  Auto-calc {config.enhancementType ? `(${config.enhancementType})` : ''}
                </div>
              </div>
              <div>
                <label className="text-slate-300 text-xs font-medium block mb-2">Jump MP</label>
                <input
                  type="number"
                  value={config.jumpMP || 0}
                  onChange={(e) => updateConfig({ jumpMP: parseInt(e.target.value) || 0 })}
                  disabled={readOnly}
                  min={0}
                  max={config.walkMP}
                  className="w-full px-3 py-2 bg-slate-700/80 border border-slate-600/50 rounded-md text-sm text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-center transition-all duration-200 hover:border-slate-500"
                  aria-label="Jump movement points"
                />
                <div className="text-xs text-slate-400 text-center mt-1.5">
                  Max: {config.walkMP}
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-300 text-center bg-slate-700/40 rounded-md px-3 py-2 border border-slate-600/30">
              <span className="font-medium">Engine Rating:</span> {config.tonnage} × {config.walkMP} = {config.engineRating}
              {config.engineRating >= 400 && <span className="text-orange-400 ml-2 font-medium">(Capped at 400)</span>}
            </div>
          </div>

          {/* Enhanced Summary Table */}
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 shadow-lg hover:border-slate-600/50 transition-all duration-200">
            <h3 className="text-slate-100 font-semibold text-sm mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Summary
            </h3>
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-600/70">
                    <th className="text-left text-slate-300 py-2 font-semibold">Component</th>
                    <th className="text-center text-slate-300 py-2 w-16 font-semibold">Weight</th>
                    <th className="text-center text-slate-300 py-2 w-12 font-semibold">Crits</th>
                    <th className="text-center text-slate-300 py-2 w-20 font-semibold">Availability</th>
                  </tr>
                </thead>
                <tbody className="text-slate-100">
                  <tr className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors duration-150">
                    <td className="py-2">Unit Type:</td>
                    <td className="text-center font-semibold">{config.tonnage}t</td>
                    <td className="text-center">—</td>
                    <td className="text-center text-green-400 font-medium">Standard</td>
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
            <div className="mt-4 p-3 bg-slate-700/30 rounded-md border border-slate-600/30">
              <div className="text-xs text-slate-300 space-y-2">
                <div className="flex justify-between items-center">
                  <span>Remaining Tonnage:</span>
                  <span className="text-slate-100 font-semibold">{(config.tonnage -
                    ((config.tonnage * 0.1) +
                      (config.engineRating * (config.engineType === 'XL' ? 0.5 : config.engineType === 'Light' ? 0.75 : 1) / 25) +
                      Math.ceil(config.engineRating / 100) +
                      3.0 +
                      config.externalHeatSinks +
                      ((config.jumpMP || 0) * (config.tonnage <= 55 ? 0.5 : config.tonnage <= 85 ? 1.0 : 2.0)))
                  ).toFixed(1)}t</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Available Critical Slots:</span>
                  <span className="text-slate-100 font-semibold">{78 - (
                    (config.structureType === 'Endo Steel' || config.structureType === 'Endo Steel (Clan)' ? 14 : 0) +
                    (config.engineType === 'XL' ? 12 : config.engineType === 'Light' ? 8 : 6) +
                    (config.gyroType === 'XL' ? 6 : config.gyroType === 'Compact' ? 2 : 4) +
                    1 + config.externalHeatSinks + (config.jumpMP || 0)
                  )}</span>
                </div>
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
    if (readOnly) return

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
    <div className="p-4 max-w-6xl mx-auto">
      {/* Compact Top Controls Section */}
      <div className="bg-slate-800 rounded-lg p-2 mb-4 border border-slate-700">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Armor Type */}
          <div className="flex items-center gap-2">
            <label className="text-slate-300 text-xs font-medium whitespace-nowrap">Armor Type:</label>
            <select
              value={config.armorType}
              onChange={(e) => handleArmorTypeChange(e.target.value)}
              disabled={readOnly}
              className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:border-blue-500 text-sm"
            >
              {armorTypeOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Tonnage Input with Step Controls - Inline */}
          <div className="flex items-center gap-2">
            <label className="text-slate-300 text-xs font-medium whitespace-nowrap">Tonnage:</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={maxArmorTonnage}
                step={0.5}
                value={currentArmorTonnage}
                onChange={(e) => handleArmorTonnageChange(parseFloat(e.target.value) || 0)}
                disabled={readOnly}
                className={`w-24 px-2 py-1 bg-slate-700 border rounded text-slate-100 focus:border-blue-500 text-center text-xs ${currentArmorTonnage >= maxArmorTonnage
                    ? 'border-yellow-500'
                    : 'border-slate-600'
                  }`}
                placeholder="0.0"
              />
              <div className="flex flex-col">
                <button
                  onClick={() => handleArmorTonnageChange(currentArmorTonnage + 0.5)}
                  disabled={readOnly || currentArmorTonnage >= maxArmorTonnage}
                  className="px-0.5 py-0 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:text-slate-500 text-slate-100 rounded-t text-xs transition-colors leading-3"
                  title="Increase by 0.5 tons"
                >
                  ▲
                </button>
                <button
                  onClick={() => handleArmorTonnageChange(currentArmorTonnage - 0.5)}
                  disabled={readOnly || currentArmorTonnage <= 0}
                  className="px-0.5 py-0 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:text-slate-500 text-slate-100 rounded-b text-xs transition-colors leading-3"
                  title="Decrease by 0.5 tons"
                >
                  ▼
                </button>
              </div>
              <span className="text-slate-400 text-xs">
                /{maxArmorTonnage.toFixed(1)}t
              </span>
            </div>
          </div>

          {/* Quick Actions - Stacked */}
          <div className="flex flex-col gap-1">
            <button
              onClick={handleUseRemainingTonnage}
              disabled={readOnly}
              className="w-full px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-xs font-medium transition-colors"
              title={`Use remaining ${getRemainingTonnage().toFixed(1)} tons`}
            >
              Use Remaining Tonnage
            </button>
            <button
              onClick={handleMaximizeArmor}
              disabled={readOnly}
              className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded text-xs font-medium transition-colors"
            >
              Maximize Armor
            </button>
          </div>

        </div>
      </div>

      {/* Two-Column Layout: Diagram + Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Armor Diagram (2/3 width) */}
        <div className="lg:col-span-2 bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className={`font-medium mb-3 ${displayUnallocatedPoints < 0 ? 'text-orange-300' : 'text-slate-100'
            }`}>
            Armor Diagram ({displayUnallocatedPoints < 0 ? 'Over-allocated' : 'Available'}: {displayUnallocatedPoints} pts / {cappedAvailablePoints} total)
          </h3>
          {/* Auto Allocate Button - full width below title */}
          <button
            onClick={handleAutoAllocate}
            disabled={readOnly}
            className={`w-full px-4 py-2 disabled:bg-gray-600 text-white rounded text-sm font-medium transition-colors mb-4 flex items-center justify-center gap-2 ${displayUnallocatedPoints < 0
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-purple-600 hover:bg-purple-700'
              }`}
          >
            <span>⚡</span>
            <span>Auto-Allocate Armor Points</span>
            <span className={`text-xs ${displayUnallocatedPoints < 0 ? 'text-orange-200 font-medium' : 'opacity-75'
              }`}>
              {displayUnallocatedPoints < 0
                ? `(${displayUnallocatedPoints} pts over-allocated)`
                : `(${displayUnallocatedPoints} pts available)`
              }
            </span>
          </button>

          {/* Simple clickable diagram without overlays */}
          <div className="bg-slate-900 rounded-lg p-6">
            <svg
              width="400"
              height="500"
              viewBox="0 0 400 500"
              className="w-full h-full max-w-md mx-auto"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Head */}
              <g>
                <rect
                  x={175}
                  y={20}
                  width={50}
                  height={40}
                  fill={selectedSection === 'HD' ? "#3b82f6" : "#16a34a"}
                  stroke="#22c55e"
                  strokeWidth="2"
                  rx="4"
                  className="cursor-pointer hover:fill-blue-500 transition-all"
                  onClick={() => setSelectedSection('HD')}
                />
                <text x={200} y={35} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">HD</text>
                <text x={200} y={50} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                  {armorAllocation.HD.front}
                </text>
              </g>

              {/* Center Torso */}
              <g>
                <rect
                  x={150}
                  y={80}
                  width={100}
                  height={120}
                  fill={selectedSection === 'CT' ? "#3b82f6" : "#d97706"}
                  stroke="#f59e0b"
                  strokeWidth="2"
                  rx="4"
                  className="cursor-pointer hover:fill-blue-600 transition-all"
                  onClick={() => setSelectedSection('CT')}
                />
                <text x={200} y={125} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">CT</text>
                <text x={200} y={145} textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
                  {armorAllocation.CT.front}
                </text>
                <rect x={150} y={205} width={100} height={20} fill="#92400e" stroke="#d97706" strokeWidth="1" rx="2" className="cursor-pointer" onClick={() => setSelectedSection('CT')} />
                <text x={200} y={215} textAnchor="middle" fill="white" fontSize="10">
                  {armorAllocation.CT.rear}
                </text>
              </g>

              {/* Left Torso */}
              <g>
                <rect
                  x={60}
                  y={90}
                  width={80}
                  height={100}
                  fill={selectedSection === 'LT' ? "#3b82f6" : "#d97706"}
                  stroke="#f59e0b"
                  strokeWidth="2"
                  rx="4"
                  className="cursor-pointer hover:fill-blue-600 transition-all"
                  onClick={() => setSelectedSection('LT')}
                />
                <text x={100} y={125} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">LT</text>
                <text x={100} y={145} textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
                  {armorAllocation.LT.front}
                </text>
                <rect x={60} y={195} width={80} height={20} fill="#92400e" stroke="#d97706" strokeWidth="1" rx="2" className="cursor-pointer" onClick={() => setSelectedSection('LT')} />
                <text x={100} y={208} textAnchor="middle" fill="white" fontSize="10">
                  {armorAllocation.LT.rear}
                </text>
              </g>

              {/* Right Torso */}
              <g>
                <rect
                  x={260}
                  y={90}
                  width={80}
                  height={100}
                  fill={selectedSection === 'RT' ? "#3b82f6" : "#d97706"}
                  stroke="#f59e0b"
                  strokeWidth="2"
                  rx="4"
                  className="cursor-pointer hover:fill-blue-600 transition-all"
                  onClick={() => setSelectedSection('RT')}
                />
                <text x={300} y={125} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">RT</text>
                <text x={300} y={145} textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
                  {armorAllocation.RT.front}
                </text>
                <rect x={260} y={195} width={80} height={20} fill="#92400e" stroke="#d97706" strokeWidth="1" rx="2" className="cursor-pointer" onClick={() => setSelectedSection('RT')} />
                <text x={300} y={208} textAnchor="middle" fill="white" fontSize="10">
                  {armorAllocation.RT.rear}
                </text>
              </g>

              {/* Left Arm */}
              <g>
                <rect
                  x={10}
                  y={100}
                  width={40}
                  height={140}
                  fill={selectedSection === 'LA' ? "#3b82f6" : "#d97706"}
                  stroke="#f59e0b"
                  strokeWidth="2"
                  rx="4"
                  className="cursor-pointer hover:fill-blue-600 transition-all"
                  onClick={() => setSelectedSection('LA')}
                />
                <text x={30} y={160} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">LA</text>
                <text x={30} y={180} textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
                  {armorAllocation.LA.front}
                </text>
              </g>

              {/* Right Arm */}
              <g>
                <rect
                  x={350}
                  y={100}
                  width={40}
                  height={140}
                  fill={selectedSection === 'RA' ? "#3b82f6" : "#d97706"}
                  stroke="#f59e0b"
                  strokeWidth="2"
                  rx="4"
                  className="cursor-pointer hover:fill-blue-600 transition-all"
                  onClick={() => setSelectedSection('RA')}
                />
                <text x={370} y={160} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">RA</text>
                <text x={370} y={180} textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
                  {armorAllocation.RA.front}
                </text>
              </g>

              {/* Left Leg */}
              <g>
                <rect
                  x={110}
                  y={230}
                  width={60}
                  height={180}
                  fill={selectedSection === 'LL' ? "#3b82f6" : "#d97706"}
                  stroke="#f59e0b"
                  strokeWidth="2"
                  rx="4"
                  className="cursor-pointer hover:fill-blue-600 transition-all"
                  onClick={() => setSelectedSection('LL')}
                />
                <text x={140} y={310} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">LL</text>
                <text x={140} y={330} textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
                  {armorAllocation.LL.front}
                </text>
              </g>

              {/* Right Leg */}
              <g>
                <rect
                  x={230}
                  y={230}
                  width={60}
                  height={180}
                  fill={selectedSection === 'RL' ? "#3b82f6" : "#d97706"}
                  stroke="#f59e0b"
                  strokeWidth="2"
                  rx="4"
                  className="cursor-pointer hover:fill-blue-600 transition-all"
                  onClick={() => setSelectedSection('RL')}
                />
                <text x={260} y={310} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">RL</text>
                <text x={260} y={330} textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
                  {armorAllocation.RL.front}
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* Right: Side Panel Editor (1/3 width) */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-slate-100 font-medium mb-4">Armor Editor</h3>

          {selectedSection ? (
            <div className="space-y-4">
              <div className="bg-slate-700/30 rounded p-3">
                <h4 className="text-slate-200 font-medium mb-2">Editing: {selectedSection}</h4>
                <div className="space-y-3">
                  {/* Front and Rear Armor on same line */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Front Armor */}
                    <div>
                      <label className="block text-slate-300 text-xs mb-1">Front</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={getLocationMaxArmor(selectedSection)}
                          value={armorAllocation[selectedSection as keyof typeof armorAllocation].front}
                          onChange={(e) => handleArmorLocationChange(
                            selectedSection,
                            parseInt(e.target.value) || 0,
                            armorAllocation[selectedSection as keyof typeof armorAllocation].rear
                          )}
                          disabled={readOnly}
                          className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:border-blue-500 text-sm"
                        />
                        <span className="text-slate-400 text-xs">/{getLocationMaxArmor(selectedSection)}</span>
                      </div>
                    </div>

                    {/* Rear Armor (only for torsos) */}
                    {['CT', 'LT', 'RT'].includes(selectedSection) ? (
                      <div>
                        <label className="block text-slate-300 text-xs mb-1">Rear</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={Math.floor(getLocationMaxArmor(selectedSection) * 0.5)}
                            value={armorAllocation[selectedSection as keyof typeof armorAllocation].rear}
                            onChange={(e) => handleArmorLocationChange(
                              selectedSection,
                              armorAllocation[selectedSection as keyof typeof armorAllocation].front,
                              parseInt(e.target.value) || 0
                            )}
                            disabled={readOnly}
                            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:border-blue-500 text-sm"
                          />
                          <span className="text-slate-400 text-xs">/{Math.floor(getLocationMaxArmor(selectedSection) * 0.5)}</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-slate-300 text-xs mb-1">Rear</label>
                        <div className="flex items-center justify-center h-8 bg-slate-700/50 rounded text-slate-500 text-xs">
                          N/A
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const maxFront = getLocationMaxArmor(selectedSection);
                        handleArmorLocationChange(selectedSection, maxFront, armorAllocation[selectedSection as keyof typeof armorAllocation].rear);
                      }}
                      disabled={readOnly}
                      className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded text-xs transition-colors"
                    >
                      Max Front
                    </button>
                    <button
                      onClick={() => handleArmorLocationChange(selectedSection, 0, 0)}
                      disabled={readOnly}
                      className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded text-xs transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-8">
              <p>Click an armor section on the diagram to edit its values</p>
            </div>
          )}

          {/* Armor Summary Table */}
          <div className="mt-6">
            <h4 className="text-slate-200 font-medium mb-3 text-sm">All Locations</h4>
            <div className="space-y-1 text-xs">
              {['HD', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'].map(location => {
                const armor = armorAllocation[location as keyof typeof armorAllocation];
                const max = getLocationMaxArmor(location);
                const total = armor.front + armor.rear;
                const hasRear = ['CT', 'LT', 'RT'].includes(location);
                const efficiency = max > 0 ? (total / max) * 100 : 0;

                // Color coding based on efficiency
                const getEfficiencyColor = () => {
                  if (total > max) return 'border-l-red-500 bg-red-900/20'; // Over-allocation
                  if (efficiency >= 90) return 'border-l-green-500 bg-green-900/20'; // Excellent (90%+)
                  if (efficiency >= 70) return 'border-l-blue-500 bg-blue-900/20'; // Good (70-89%)
                  if (efficiency >= 50) return 'border-l-yellow-500 bg-yellow-900/20'; // Fair (50-69%)
                  if (efficiency >= 25) return 'border-l-orange-500 bg-orange-900/20'; // Poor (25-49%)
                  return 'border-l-slate-500 bg-slate-800/20'; // Very low (<25%)
                };

                const getTextColor = () => {
                  if (total > max) return 'text-red-300';
                  if (efficiency >= 90) return 'text-green-300';
                  if (efficiency >= 70) return 'text-blue-300';
                  if (efficiency >= 50) return 'text-yellow-300';
                  if (efficiency >= 25) return 'text-orange-300';
                  return 'text-slate-400';
                };

                return (
                  <div
                    key={location}
                    className={`grid grid-cols-4 gap-1 p-2 rounded border-l-4 cursor-pointer transition-colors ${getEfficiencyColor()
                      } ${selectedSection === location ? 'ring-2 ring-blue-500/50' : 'hover:bg-slate-700/30'}`}
                    onClick={() => setSelectedSection(location)}
                  >
                    <div className="text-slate-300 font-medium">{location}</div>
                    <div className="text-slate-100 text-center">{armor.front}</div>
                    <div className="text-slate-100 text-center">{hasRear ? armor.rear : '-'}</div>
                    <div className={`text-center font-medium ${getTextColor()}`}>
                      {total}/{max}
                      <span className="text-xs ml-1 opacity-75">
                        ({efficiency.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Color Legend */}
            <div className="mt-3 p-2 bg-slate-700/30 rounded text-xs">
              <div className="text-slate-300 font-medium mb-2">Efficiency Legend:</div>
              <div className="grid grid-cols-2 gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-slate-400">90%+ Excellent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-slate-400">70-89% Good</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-slate-400">50-69% Fair</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span className="text-slate-400">25-49% Poor</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-slate-500 rounded"></div>
                  <span className="text-slate-400">&lt;25% Very Low</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-slate-400">Over-allocated</span>
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
  const { unit, unallocatedEquipment, addEquipmentToUnit } = useUnit();

  // Calculate equipment statistics for header display
  const equipmentStats = React.useMemo(() => {
    let totalWeight = 0;
    let totalSlots = 0;
    let totalHeat = 0;

    unallocatedEquipment.forEach((equipment: any) => {
      totalWeight += equipment.weight || 0;
      totalSlots += equipment.requiredSlots || 0;
      totalHeat += equipment.heat || 0;
    });

    return {
      totalWeight,
      totalSlots,
      totalHeat,
      count: unallocatedEquipment.length
    };
  }, [unallocatedEquipment]);

  // Get remaining capacity
  const remainingWeight = unit.getRemainingTonnage();
  const remainingSlots = 78 - unit.getSummary().occupiedSlots;

  return (
    <div className="h-full flex flex-col">
      {/* Equipment Summary Header - Fixed */}
      <div className="flex-shrink-0 p-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-100 mb-2">Equipment Browser</h2>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Unallocated:</span>
                  <span className="font-medium text-slate-200">{equipmentStats.count} items</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Weight:</span>
                  <span className={`font-medium ${equipmentStats.totalWeight > remainingWeight ? 'text-red-400' : 'text-slate-200'
                    }`}>
                    {equipmentStats.totalWeight.toFixed(1)}t
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Slots:</span>
                  <span className={`font-medium ${equipmentStats.totalSlots > remainingSlots ? 'text-red-400' : 'text-slate-200'
                    }`}>
                    {equipmentStats.totalSlots}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Heat:</span>
                  <span className="font-medium text-orange-400">+{equipmentStats.totalHeat}</span>
                </div>
              </div>
            </div>

            {/* Note about the tray */}
            <div className="text-right">
              <div className="text-sm text-slate-300 font-medium">Equipment Tray Available</div>
              <div className="text-xs text-slate-400">
                Use the tray button on the right to manage allocated equipment →
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area - Equipment Browser - Natural Height with Scrolling */}
      <div className="flex-1 px-4 pb-4 min-h-0">
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <EquipmentBrowser
            onAddEquipment={addEquipmentToUnit}
            showAddButtons={!readOnly}
            actionButtonLabel="Add to unit"
            actionButtonIcon="+"
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
};

const CriticalsTabV2: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  return (
    <div className="h-full bg-slate-900 overflow-auto">
      {/* Use the critical slots system with MultiUnitProvider's state */}
      <div className="p-6">
        {/* Main Content Grid - Same layout as demo */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          {/* Critical Slots - Takes up 2 columns */}
          <div className="xl:col-span-2">
            <CriticalSlotsDisplay />
          </div>

          {/* Unallocated Equipment - Takes up 1 column */}
          <div className="xl:col-span-1">
            <UnallocatedEquipmentDisplay />
          </div>
        </div>
      </div>
    </div>
  );
};

const FluffTabV2: React.FC<{ readOnly?: boolean }> = () => (
  <div className="p-6 text-center text-slate-400">
    <h3 className="text-lg font-medium mb-2">Fluff Tab</h3>
    <p>Coming soon - Unit background and description</p>
  </div>
);

// Inner component that uses the V2 data model with V1 UI design
function CustomizerV2Content() {
  const router = useRouter();
  const {
    unit,
    engineType,
    gyroType,
    updateConfiguration,
    unallocatedEquipment
  } = useUnit();

  // Equipment tray state
  const [isEquipmentTrayExpanded, setIsEquipmentTrayExpanded] = useState(false);

  // Valid tab IDs
  const validTabs = ['structure', 'armor', 'equipment', 'criticals', 'fluff'];

  // Get initial tab from URL or default to 'structure'
  const getInitialTab = () => {
    const tabFromUrl = router.query.tab as string;
    return validTabs.includes(tabFromUrl) ? tabFromUrl : 'structure';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab());

  // Debug panel state
  const [isDebugVisible, setIsDebugVisible] = useState<boolean>(false);

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

  // Get unit configuration from V2 system
  const unitConfig = unit.getConfiguration();

  // Calculate unit statistics using V2 data model (V1-style calculations)
  const calculateCurrentWeight = (): number => {
    // Base unit weight (structure, engine, gyro, cockpit, heat sinks, armor)
    const baseWeight = unit.getUsedTonnage();
    
    // Add unallocated equipment weight
    let unallocatedWeight = 0;
    unallocatedEquipment.forEach((equipment: any) => {
      const actualEquipment = equipment.equipmentData || equipment;
      const weight = actualEquipment.weight || 
                    actualEquipment.weight_tons || 
                    actualEquipment.tonnage || 
                    equipment.weight || 
                    equipment.weight_tons || 
                    equipment.tonnage || 
                    0;
      unallocatedWeight += weight;
    });
    
    return baseWeight + unallocatedWeight;
  };

  const calculateHeatBalance = (): { generated: number; dissipated: number } => {
    return {
      generated: unit.getHeatGeneration(),
      dissipated: unit.getHeatDissipation()
    };
  };

  const calculateCriticalSlots = (): { total: number; used: number; available: number } => {
    // CRITICAL FIX: Use CriticalSlotCalculator for accurate, comprehensive calculations
    // This eliminates double-counting of special components (EndoSteel, Ferro-Fibrous, etc.)
    const breakdown = unit.getCriticalSlotBreakdown();
    
    return {
      total: breakdown.totals.capacity,        // 78 for standard BattleMech
      used: breakdown.totals.equipmentBurden,  // Includes structural + allocated + unallocated (no double-counting)
      available: breakdown.totals.remaining    // Accurate remaining slots
    };
  };

  const currentWeight = calculateCurrentWeight();
  const heatBalance = calculateHeatBalance();
  const criticalSlots = calculateCriticalSlots();

  // Calculate enhanced movement for header display using shared utility
  const enhancedMovement = calculateEnhancedMovement(unitConfig);

  // Engine and Gyro types for dropdowns
  const engineTypes = ['Standard', 'XL', 'Light', 'XXL', 'Compact', 'ICE', 'Fuel Cell'];
  const gyroTypes = ['Standard', 'XL', 'Compact', 'Heavy-Duty'];

  // Handle engine type change
  const handleEngineChange = (newType: string) => {
    updateConfiguration({
      ...unitConfig,
      engineType: newType as any
    });
  };

  // Handle gyro type change
  const handleGyroChange = (newType: string) => {
    updateConfiguration({
      ...unitConfig,
      gyroType: newType as any
    });
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
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Equipment Tray */}
      <EquipmentTray 
        isExpanded={isEquipmentTrayExpanded}
        onToggle={() => setIsEquipmentTrayExpanded(!isEquipmentTrayExpanded)}
      />

      {/* Unit Information Banner - Single Row Design */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Left: Unit Identity */}
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-100">
              New Mek
            </h2>
            <span className="text-sm text-slate-400">
              {unitConfig.tonnage}-ton {unitConfig.techBase} BattleMech
            </span>
          </div>

          {/* Center: Statistics Grid */}
          <div className="grid grid-cols-6 gap-4 text-sm">
            {/* Weight */}
            <div className="flex flex-col items-center text-center">
              <span className="text-slate-400 text-xs mb-1">Weight</span>
              <span className={`font-medium ${currentWeight > unitConfig.tonnage ? 'text-red-400' : 'text-slate-200'
                }`}>
                {currentWeight.toFixed(1)} / {unitConfig.tonnage}
              </span>
              <span className="text-slate-500 text-xs">tons</span>
            </div>

            {/* Heat */}
            <div className="flex flex-col items-center text-center">
              <span className="text-slate-400 text-xs mb-1">Heat</span>
              <span className={`font-medium ${heatBalance.generated > heatBalance.dissipated ? 'text-orange-400' : 'text-green-400'
                }`}>
                {heatBalance.generated} / {heatBalance.dissipated}
              </span>
              <span className="text-slate-500 text-xs">gen / sink</span>
            </div>

            {/* Movement - Gets more space */}
            <div className="flex flex-col items-center text-center">
              <span className="text-slate-400 text-xs mb-1">Movement</span>
              <span className="font-medium text-slate-200">
                {formatCondensedMovement(unitConfig, unitConfig.tonnage)}
              </span>
              <span className="text-slate-500 text-xs">walk / run / jump</span>
            </div>

            {/* Critical Slots */}
            <div className="flex flex-col items-center text-center">
              <span className="text-slate-400 text-xs mb-1">Crits</span>
              <span className={`font-medium ${criticalSlots.used > criticalSlots.total ? 'text-red-400' : 'text-slate-200'
                }`}>
                {criticalSlots.used} / {criticalSlots.total}
              </span>
              <span className="text-slate-500 text-xs">used / total</span>
            </div>

            {/* Rules Level */}
            <div className="flex flex-col items-center text-center">
              <span className="text-slate-400 text-xs mb-1">Rules</span>
              <span className="font-medium text-slate-200">
                Standard
              </span>
              <span className="text-slate-500 text-xs">level</span>
            </div>

            {/* Era */}
            <div className="flex flex-col items-center text-center">
              <span className="text-slate-400 text-xs mb-1">Era</span>
              <span className="font-medium text-slate-200">
                3025
              </span>
              <span className="text-slate-500 text-xs">year</span>
            </div>
          </div>

          {/* Right: Debug Button */}
          <button
            onClick={() => setIsDebugVisible(!isDebugVisible)}
            className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-slate-200 rounded transition-colors"
            title="Toggle Debug Panel"
          >
            Debug
          </button>
        </div>
      </div>

      {/* Tab Navigation - V1 Style */}
      <div className="flex border-b border-slate-700 bg-slate-800 flex-shrink-0">
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

      {/* Tab Content - Using standardized wrapper */}
      <TabContentWrapper>
        <ActiveTabComponent readOnly={false} />
      </TabContentWrapper>

      {/* Conditional Debug Panel */}
      {isDebugVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-4 max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-slate-100 font-semibold">Debug Panel</h3>
              <button
                onClick={() => setIsDebugVisible(false)}
                className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-slate-200 rounded transition-colors"
              >
                Close
              </button>
            </div>
            <EquipmentAllocationDebugPanel />
          </div>
        </div>
      )}

    </div>
  );
}

// Main component with MultiUnitProvider
const CustomizerV2Page: React.FC = () => {
  return (
    <>
      <Head>
        <title>Customizer V2 | BattleTech Editor</title>
        <meta name="description" content="Next generation unit customizer using the V2 data model with advanced critical slot management." />
      </Head>

      <MultiUnitProvider>
        <TabManager>
          <CustomizerV2Content />
        </TabManager>
      </MultiUnitProvider>
    </>
  );
};

export default CustomizerV2Page;
