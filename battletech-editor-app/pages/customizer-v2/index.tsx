/**
 * Customizer V2 - Next generation unit customizer using the V2 data model
 * Built on top of the UnitCriticalManager system from the critical slots v2 demo
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { UnitProvider, useUnit } from '../../components/criticalSlots/UnitProvider';

// Placeholder tab components - these will be implemented later
const StructureTabV2: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  const { unit, engineType, gyroType, updateConfiguration } = useUnit();
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
  const calculatedRunMP = Math.floor(config.walkMP * 1.5);
  
  const heatDissipation = config.heatSinkType === 'Double' || config.heatSinkType === 'Double (Clan)' 
    ? config.totalHeatSinks * 2 
    : config.totalHeatSinks;
  
  // Update configuration helper with auto-calculations
  const updateConfig = (updates: any) => {
    let newConfig = { ...config, ...updates };
    
    // Auto-calculate engine rating when tonnage or walkMP changes
    if ('tonnage' in updates || 'walkMP' in updates) {
      const tonnage = updates.tonnage || config.tonnage;
      const walkMP = updates.walkMP || config.walkMP;
      const engineRating = Math.min(tonnage * walkMP, 400);
      const runMP = Math.floor(walkMP * 1.5);
      
      newConfig = {
        ...newConfig,
        engineRating,
        runMP
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
                <input
                  type="number"
                  min={20}
                  max={100}
                  step={5}
                  value={config.tonnage}
                  onChange={(e) => updateConfig({ tonnage: parseInt(e.target.value) || 20 })}
                  disabled={readOnly}
                  className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 focus:border-blue-500 text-center"
                />
                <div className="text-xs text-slate-400 text-center mt-1">
                  20-100t (step: 5)
                </div>
              </div>
              <div>
                <label className="text-slate-300 text-xs block mb-1">Tech Base</label>
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
              </div>
            </div>
          </div>
          
          {/* Engine Configuration */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="text-slate-100 font-medium text-sm mb-3">Engine</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 text-xs block mb-1">Type</label>
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
              </div>
              <div>
                <label className="text-slate-300 text-xs block mb-1">Rating</label>
                <div className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-slate-100">
                  {config.engineRating}
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Walk: {config.walkMP} MP | Run: {config.runMP} MP | Max: {maxWalkMP} MP
            </div>
          </div>
          
          {/* Structure & Gyro */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="text-slate-100 font-medium text-sm mb-3">Structure & Gyro</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 text-xs block mb-1">Structure</label>
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
              </div>
              <div>
                <label className="text-slate-300 text-xs block mb-1">Gyro</label>
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
                  {config.runMP}
                </div>
                <div className="text-xs text-slate-400 text-center mt-1">
                  Auto-calc
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
                    <td className="py-1">Armor:</td>
                    <td className="text-center font-medium">0.0t</td>
                    <td className="text-center">0</td>
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

const ArmorTabV2: React.FC<{ readOnly?: boolean }> = () => (
  <div className="p-6 text-center text-slate-400">
    <h3 className="text-lg font-medium mb-2">Armor Tab</h3>
    <p>Coming soon - Armor type selection and allocation</p>
  </div>
);

const EquipmentTabV2: React.FC<{ readOnly?: boolean }> = () => (
  <div className="p-6 text-center text-slate-400">
    <h3 className="text-lg font-medium mb-2">Equipment Tab</h3>
    <p>Coming soon - Weapon and equipment selection</p>
  </div>
);

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
  
  // Calculate unit statistics from V2 data model
  const calculateCurrentWeight = (): number => {
    // Get weight from unit summary
    return summary?.totalWeight || 0;
  };
  
  const calculateHeatBalance = (): { generated: number; dissipated: number } => {
    // Get heat info from unit summary
    return {
      generated: summary?.heatGenerated || 0,
      dissipated: summary?.heatDissipated || 0
    };
  };
  
  const calculateCriticalSlots = (): { total: number; required: number; assigned: number } => {
    // Get critical slot info from unit summary
    return {
      total: 78, // Standard BattleMech total
      required: summary?.criticalSlotsUsed || 0,
      assigned: summary?.criticalSlotsUsed || 0
    };
  };
  
  // Get unit configuration from V2 system
  const unitConfig = unit.getConfiguration();
  const currentWeight = calculateCurrentWeight();
  const heatBalance = calculateHeatBalance();
  const criticalSlots = calculateCriticalSlots();
  
  // Default unit info (will be configurable in future versions)
  const unitInfo = {
    chassis: 'Atlas', // Default chassis name
    model: 'AS7-D', // Default model
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
                {unitConfig.walkMP}/{unitConfig.runMP}/{unitConfig.jumpMP || 0}
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
