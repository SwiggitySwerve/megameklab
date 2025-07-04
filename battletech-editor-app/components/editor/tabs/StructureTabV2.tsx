/**
 * StructureTabV2 - Unit structure and system configuration tab
 * 
 * Extracted from CustomizerV2Content as part of Phase 2 refactoring
 * Handles core unit configuration, engine settings, system components, and heat management
 * 
 * @see IMPLEMENTATION_REFERENCE.md for tab component patterns
 */

import React from 'react';
import { useUnit } from '../../multiUnit/MultiUnitProvider';
import { 
  SkeletonInput,
  SkeletonSelect,
  SkeletonText,
  SkeletonFormSection
} from '../../common/SkeletonLoader';

// Import tech progression filtering
import { 
  getFilteredComponentOptions,
  validateComponentSelection,
  autoCorrectComponentSelections,
  formatTechBaseForDisplay
} from '../../../utils/techProgressionFiltering';

// Import memory system for Structure tab integration
import {
  initializeMemorySystem,
  updateMemoryState,
  saveMemoryToStorage,
  loadMemoryFromStorage
} from '../../../utils/memoryPersistence';

import {
  validateAndResolveComponentWithMemory,
  initializeMemoryFromConfiguration
} from '../../../utils/techBaseMemory';

import {
  TechBaseMemory,
  ComponentMemoryState
} from '../../../types/componentDatabase';

import { ComponentCategory } from '../../../utils/componentAvailability';

// Import ComponentConfiguration helpers
import { 
  ComponentConfiguration, 
  TechBase, 
  createComponentConfiguration, 
  migrateStringToComponentConfiguration,
  createDefaultComponentConfiguration 
} from '../../../types/componentConfiguration';

// Import movement calculations
import { calculateEnhancedMovement, formatEngineMovementInfo, formatCondensedMovement } from '../../../utils/movementCalculations';

// Import structure and armor calculations
import { calculateStructureWeight, getStructureSlots } from '../../../utils/structureCalculations';
import { getArmorSlots } from '../../../utils/armorCalculations';
import { isComponentAvailable } from '../../../utils/componentDatabaseHelpers';

/**
 * Props for StructureTabV2 component
 */
export interface StructureTabV2Props {
  /** Whether the component is in read-only mode */
  readOnly?: boolean;
}

/**
 * StructureTabV2 Component
 * 
 * Manages core unit configuration including:
 * - Unit tonnage and tech base
 * - Engine configuration and movement
 * - System components (structure, gyro, enhancement)
 * - Heat management
 * - Movement configuration with enhanced movement support
 */
export const StructureTabV2: React.FC<StructureTabV2Props> = ({ readOnly = false }) => {
  const { unit, engineType, gyroType, updateConfiguration, isConfigLoaded } = useUnit();
  const config = unit.getConfiguration();

  // 🔥 MEMORY SYSTEM STATE (same as Overview tab)
  const [memoryState, setMemoryState] = React.useState<ComponentMemoryState | null>(null);
  const [hasInitialized, setHasInitialized] = React.useState(false);

  // Enhanced configuration with tech progression (with defaults for missing fields)
  const enhancedConfig = {
    ...config,
    techProgression: (config as any).techProgression || {
      chassis: config.techBase.includes('Clan') ? 'Clan' : 'Inner Sphere',
      gyro: config.techBase.includes('Clan') ? 'Clan' : 'Inner Sphere',
      engine: config.techBase.includes('Clan') ? 'Clan' : 'Inner Sphere',
      heatsink: config.techBase.includes('Clan') ? 'Clan' : 'Inner Sphere',
      targeting: config.techBase.includes('Clan') ? 'Clan' : 'Inner Sphere',
      myomer: config.techBase.includes('Clan') ? 'Clan' : 'Inner Sphere',
      movement: config.techBase.includes('Clan') ? 'Clan' : 'Inner Sphere',
      armor: config.techBase.includes('Clan') ? 'Clan' : 'Inner Sphere'
    }
  };

  // 🔥 MEMORY SYSTEM INITIALIZATION (initialize only, no restoration - let Overview tab handle restoration)
  React.useEffect(() => {
    if (!hasInitialized && isConfigLoaded && unit) {
      console.log('[StructureTab] 💾 Initializing memory system (no restoration - Overview tab handles that)');
      
      // Initialize memory system but don't restore - Overview tab handles restoration
      const initialMemoryState = initializeMemorySystem();
      setMemoryState(initialMemoryState);
      
      setHasInitialized(true);
    }
  }, [isConfigLoaded, hasInitialized, unit, updateConfiguration]);

  // 🔥 MEMORY RESTORATION FUNCTION (same pattern as Overview tab)
  const applyMemoryRestoration = (config: any, memoryState: ComponentMemoryState): any => {
    if (!memoryState || !memoryState.techBaseMemory) {
      console.log('[StructureTab] 💾 No memory state available for restoration');
      return {};
    }
    
    console.log('[StructureTab] 💾 Attempting memory restoration from saved state');
    const restorationUpdates: any = {};
    
    // Get current tech progression (or use defaults)
    const techProgression = config.techProgression || enhancedConfig.techProgression;
    
    // Check if component system is available
    let componentsAvailable = true;
    const testResult = isComponentAvailable('None', 'myomer', 'Inner Sphere');
    if (testResult === undefined || testResult === null) {
      componentsAvailable = false;
    }
    
    if (!componentsAvailable) {
      console.log('[StructureTab] 💾 🚫 Components not available, skipping restoration');
      return {};
    }
    
    console.log('[StructureTab] 💾 ✅ Components available, proceeding with restoration');
    
    // For each subsystem, restore component from memory if available
    Object.entries(techProgression).forEach(([subsystem, techBase]) => {
      const savedComponent = memoryState.techBaseMemory[subsystem as keyof typeof memoryState.techBaseMemory]?.[techBase as 'Inner Sphere' | 'Clan'];
      
      if (savedComponent && savedComponent !== 'None' && savedComponent !== 'Standard') {
        const configProperty = getConfigPropertyForSubsystem(subsystem as string);
        if (configProperty) {
          restorationUpdates[configProperty] = savedComponent;
          console.log(`[StructureTab] 💾 ✅ Restored ${subsystem} (${techBase}) → ${savedComponent}`);
        }
      }
    });
    
    console.log(`[StructureTab] 💾 🎯 Restoration completed with ${Object.keys(restorationUpdates).length} updates`);
    return restorationUpdates;
  };

  // 🔥 HELPER FUNCTIONS (same pattern as Overview tab)
  const getCurrentComponentForSubsystem = (subsystem: string, config: any): string => {
    const propertyMap = {
      chassis: 'structureType',
      gyro: 'gyroType', 
      engine: 'engineType',
      heatsink: 'heatSinkType',
      myomer: 'enhancementType',
      armor: 'armorType',
      targeting: 'targetingType',
      movement: 'movementType'
    } as any;
    
    const property = propertyMap[subsystem];
    if (!property) return 'Standard';
    
    const value = config[property];
    if (typeof value === 'string') {
      return value;
    } else if (value && typeof value === 'object') {
      return value.type || 'Standard';
    }
    return 'Standard';
  };

  const getConfigPropertyForSubsystem = (subsystem: string): string | null => {
    const propertyMap = {
      chassis: 'structureType',
      gyro: 'gyroType', 
      engine: 'engineType',
      heatsink: 'heatSinkType',
      myomer: 'enhancementType',
      armor: 'armorType',
      targeting: 'targetingType',
      movement: 'movementType'
    } as any;
    
    return propertyMap[subsystem] || null;
  };

  // Get dynamic component options based on tech progression
  const filteredOptions = getFilteredComponentOptions(enhancedConfig.techProgression);

  // Helper functions to handle ComponentConfiguration vs string migration
  const getStructureTypeValue = (): string => {
    if (typeof config.structureType === 'string') {
      return config.structureType;
    } else if (config.structureType && typeof config.structureType === 'object') {
      return config.structureType.type;
    }
    return 'Standard';
  };

  const getGyroTypeValue = (): string => {
    if (typeof config.gyroType === 'string') {
      return config.gyroType;
    } else if (config.gyroType && typeof config.gyroType === 'object') {
      return config.gyroType.type;
    }
    return 'Standard';
  };

  const getEnhancementTypeValue = (): string => {
    if (!config.enhancementType) return 'None';
    if (typeof config.enhancementType === 'string') {
      return config.enhancementType;
    } else if (config.enhancementType && typeof config.enhancementType === 'object') {
      return config.enhancementType.type;
    }
    return 'None';
  };

  const getHeatSinkTypeValue = (): string => {
    if (typeof config.heatSinkType === 'string') {
      return config.heatSinkType;
    } else if (config.heatSinkType && typeof config.heatSinkType === 'object') {
      return config.heatSinkType.type;
    }
    return 'Single';
  };

  const getArmorTypeValue = (): string => {
    if (typeof config.armorType === 'string') {
      return config.armorType;
    } else if (config.armorType && typeof config.armorType === 'object') {
      return config.armorType.type;
    }
    return 'Standard';
  };

  // Calculate derived values
  const maxWalkMP = Math.floor(400 / config.tonnage);
  const calculatedEngineRating = config.tonnage * config.walkMP;
  const actualEngineRating = Math.min(calculatedEngineRating, 400);

  const heatDissipation = getHeatSinkTypeValue() === 'Double' || getHeatSinkTypeValue() === 'Double (Clan)'
    ? config.totalHeatSinks * 2
    : config.totalHeatSinks;

  // Use shared movement utility for consistent display - convert ComponentConfiguration to string
  const enhancementValue = getEnhancementTypeValue();
  const typedEnhancementType = enhancementValue === 'None' ? null : 
    (enhancementValue === 'MASC' || enhancementValue === 'Triple Strength Myomer') ? 
    enhancementValue as 'MASC' | 'Triple Strength Myomer' : null;
  
  const movementConfig = {
    ...config,
    enhancementType: typedEnhancementType
  };
  const enhancedMovement = calculateEnhancedMovement(movementConfig);
  const calculatedRunMP = config.runMP; // Use base run MP for data model consistency

  // Update configuration helper with auto-calculations and tech progression sync
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

  // 🔥 WORKING DROPDOWN PATTERN - Based on Overview tab success
  const handleEngineTypeChange = (newValue: string) => {
    console.log(`[StructureTab] 🔧 Engine type change: ${config.engineType} → ${newValue}`);
    
    if (readOnly) {
      console.log('[StructureTab] Skipping update - readonly mode');
      return;
    }

    updateConfig({ engineType: newValue });
    console.log(`[StructureTab] ✅ Engine type updated successfully`);
  };

  const handleGyroTypeChange = (newValue: string) => {
    console.log(`[StructureTab] 🔧 Gyro type change: ${getGyroTypeValue()} → ${newValue}`);
    
    if (readOnly) {
      console.log('[StructureTab] Skipping update - readonly mode');
      return;
    }

    updateConfig({ gyroType: newValue });
    console.log(`[StructureTab] ✅ Gyro type updated successfully`);
  };

  const handleStructureTypeChange = (newValue: string) => {
    console.log(`[StructureTab] 🔧 Structure type change: ${getStructureTypeValue()} → ${newValue}`);
    
    if (readOnly) {
      console.log('[StructureTab] Skipping update - readonly mode');
      return;
    }

    updateConfig({ structureType: newValue });
    console.log(`[StructureTab] ✅ Structure type updated successfully`);
  };

  const handleHeatSinkTypeChange = (newValue: string) => {
    console.log(`[StructureTab] 🔧 Heat sink type change: ${getHeatSinkTypeValue()} → ${newValue}`);
    
    if (readOnly) {
      console.log('[StructureTab] Skipping update - readonly mode');
      return;
    }

    updateConfig({ heatSinkType: newValue });
    console.log(`[StructureTab] ✅ Heat sink type updated successfully`);
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

            {/* First Row: Tonnage (Tech Base moved to Overview tab) */}
            <div className="grid grid-cols-1 gap-3 mb-3">
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
                  20-100t (step: 5) • Tech Base set in Overview tab
                </div>
              </div>
            </div>

            {/* Second Row: Engine Type + Rating */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 text-xs font-medium block mb-2">Engine Type</label>
                {isConfigLoaded ? (
                  <select
                    value={config.engineType}
                    onChange={(e) => handleEngineTypeChange(e.target.value)}
                    disabled={readOnly}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-slate-600/50 rounded-md text-sm text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-slate-500"
                    aria-label="Engine type"
                  >
                    {filteredOptions.engine.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <SkeletonSelect />
                )}
                <div className="text-xs text-slate-400 mt-1">
                  Current: {config.engineType} | Options: {filteredOptions.engine.join(', ')}
                </div>
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
                    value={getStructureTypeValue()}
                    onChange={(e) => handleStructureTypeChange(e.target.value)}
                    disabled={readOnly}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 focus:border-blue-500"
                  >
                    {filteredOptions.structure.map(option => (
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
                    value={getGyroTypeValue()}
                    onChange={(e) => handleGyroTypeChange(e.target.value)}
                    disabled={readOnly}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 focus:border-blue-500"
                  >
                    {filteredOptions.gyro.map(option => (
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
                value={getEnhancementTypeValue()}
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
            {getEnhancementTypeValue() === 'MASC' && (
              <div className="mt-3 text-xs text-slate-400 bg-slate-700/30 rounded px-3 py-2">
                <div>• Doubles run speed when active</div>
                <div>• Generates 5 heat per activation</div>
                <div>• Risk of system damage if overused</div>
              </div>
            )}
            {getEnhancementTypeValue() === 'Triple Strength Myomer' && (
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
                  value={getHeatSinkTypeValue()}
                  onChange={(e) => handleHeatSinkTypeChange(e.target.value)}
                  disabled={readOnly}
                  className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 focus:border-blue-500"
                >
                  {filteredOptions.heatSink.map(option => (
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
                  Auto-calc {getEnhancementTypeValue() !== 'None' ? `(${getEnhancementTypeValue()})` : ''}
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
                    <td className="py-1">Structure ({getStructureTypeValue()}):</td>
                    <td className="text-center font-medium">{calculateStructureWeight(config.tonnage, getStructureTypeValue() as any).toFixed(1)}t</td>
                    <td className="text-center">{getStructureSlots(getStructureTypeValue() as any)}</td>
                    <td className="text-center text-yellow-400">D/C-E-D-D</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-1">Engine ({config.engineType} {config.engineRating}):</td>
                    <td className="text-center font-medium">{(config.engineRating * (config.engineType === 'XL' ? 0.5 : config.engineType === 'Light' ? 0.75 : 1) / 25).toFixed(1)}t</td>
                    <td className="text-center">{config.engineType === 'XL' ? '12' : config.engineType === 'Light' ? '8' : '6'}</td>
                    <td className="text-center text-green-400">D/C-E-D-D</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-1">Gyro ({getGyroTypeValue()}):</td>
                    <td className="text-center font-medium">{Math.ceil(config.engineRating / 100).toFixed(1)}t</td>
                    <td className="text-center">{getGyroTypeValue() === 'XL' ? '6' : getGyroTypeValue() === 'Compact' ? '2' : '4'}</td>
                    <td className="text-center text-green-400">D/C-C-C-C</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-1">Cockpit:</td>
                    <td className="text-center font-medium">3.0t</td>
                    <td className="text-center">1</td>
                    <td className="text-center text-green-400">D/C-C-C-C</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-1">Heat Sinks ({config.totalHeatSinks} {getHeatSinkTypeValue()}):</td>
                    <td className="text-center font-medium">{config.externalHeatSinks}t</td>
                    <td className="text-center">{config.externalHeatSinks}</td>
                    <td className="text-center text-blue-400">{getHeatSinkTypeValue() === 'Double' || getHeatSinkTypeValue() === 'Double (Clan)' ? 'C/B-B-B-B' : 'D/C-C-C-C'}</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-1">Armor ({getArmorTypeValue()}):</td>
                    <td className="text-center font-medium">{config.armorTonnage.toFixed(1)}t</td>
                    <td className="text-center">{getArmorTypeValue() === 'Ferro-Fibrous' ? '14' : getArmorTypeValue() === 'Ferro-Fibrous (Clan)' ? '7' : '0'}</td>
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
                      calculateStructureWeight(config.tonnage, getStructureTypeValue() as any) + // Structure
                      (config.engineRating * (config.engineType === 'XL' ? 0.5 : config.engineType === 'Light' ? 0.75 : 1) / 25) + // Engine
                      Math.ceil(config.engineRating / 100) + // Gyro  
                      3.0 + // Cockpit
                      config.externalHeatSinks + // Heat sinks
                      ((config.jumpMP || 0) * (config.tonnage <= 55 ? 0.5 : config.tonnage <= 85 ? 1.0 : 2.0)) // Jump jets
                    ).toFixed(1)}t</td>
                    <td className="text-center text-slate-200">{
                      (getStructureTypeValue() === 'Endo Steel' || getStructureTypeValue() === 'Endo Steel (Clan)' ? 14 : 0) +
                      (config.engineType === 'XL' ? 12 : config.engineType === 'Light' ? 8 : 6) +
                      (getGyroTypeValue() === 'XL' ? 6 : getGyroTypeValue() === 'Compact' ? 2 : 4) +
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
                    (calculateStructureWeight(config.tonnage, getStructureTypeValue() as any) +
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
                    (getStructureTypeValue() === 'Endo Steel' || getStructureTypeValue() === 'Endo Steel (Clan)' ? 14 : 0) +
                    (config.engineType === 'XL' ? 12 : config.engineType === 'Light' ? 8 : 6) +
                    (getGyroTypeValue() === 'XL' ? 6 : getGyroTypeValue() === 'Compact' ? 2 : 4) +
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
