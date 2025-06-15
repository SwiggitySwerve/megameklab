/**
 * Structure Tab Component with Hooks
 * Uses the unified data model for state management
 */

import React from 'react';
import { 
  useUnitData, 
  useSystemComponents,
  useValidationState 
} from '../../../hooks/useUnitData';
import { 
  ENGINE_SLOT_REQUIREMENTS,
  GYRO_SLOT_REQUIREMENTS,
  STRUCTURE_SLOT_REQUIREMENTS
} from '../../../types/systemComponents';
import { calculateEngineWeight } from '../../../utils/engineCalculations';
import { calculateGyroWeight } from '../../../utils/gyroCalculations';
import { calculateStructureWeight } from '../../../utils/structureCalculations';
import CustomDropdown from '../../common/CustomDropdown';
import styles from './StructureTab.module.css';

interface StructureTabWithHooksProps {
  readOnly?: boolean;
}

export default function StructureTabWithHooks({ readOnly = false }: StructureTabWithHooksProps) {
  const { state, updateEngine, updateGyro, updateStructure, updateHeatSinks } = useUnitData();
  const systemComponents = useSystemComponents();
  const validationState = useValidationState();
  
  const unit = state.unit;
  
  // Calculate weights
  const engineWeight = systemComponents?.engine 
    ? calculateEngineWeight(systemComponents.engine.rating, unit.mass, systemComponents.engine.type)
    : 0;
    
  const gyroWeight = systemComponents?.engine && systemComponents?.gyro
    ? calculateGyroWeight(systemComponents.engine.rating, systemComponents.gyro.type)
    : 0;
    
  const structureWeight = systemComponents?.structure
    ? calculateStructureWeight(unit.mass, systemComponents.structure.type)
    : unit.mass * 0.1;
  
  // Engine types
  const engineTypes = ['Standard', 'XL', 'Light', 'XXL', 'Compact', 'ICE', 'Fuel Cell'];
  const gyroTypes = ['Standard', 'XL', 'Compact', 'Heavy-Duty'];
  const structureTypes = ['Standard', 'Endo Steel', 'Endo Steel (Clan)', 'Composite', 'Reinforced'];
  const heatSinkTypes = ['Single', 'Double', 'Double (Clan)', 'Compact', 'Laser'];
  
  // Handle engine change
  const handleEngineChange = (field: 'type' | 'rating', value: string | number) => {
    if (!systemComponents?.engine) return;
    
    if (field === 'type') {
      updateEngine(value as string, systemComponents.engine.rating);
    } else {
      updateEngine(systemComponents.engine.type, Number(value));
    }
  };
  
  // Handle heat sink change
  const handleHeatSinkChange = (field: 'type' | 'count', value: string | number) => {
    if (!systemComponents?.heatSinks) return;
    
    if (field === 'type') {
      updateHeatSinks(value as string, systemComponents.heatSinks.total);
    } else {
      updateHeatSinks(systemComponents.heatSinks.type, Number(value));
    }
  };
  
  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Basic Info Bar */}
      <div className="bg-slate-800 rounded-lg p-3 mb-4 border border-slate-700">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-slate-400">Chassis:</span>
            <span className="ml-2 font-medium text-slate-100">{unit.chassis}</span>
          </div>
          <div>
            <span className="text-slate-400">Model:</span>
            <span className="ml-2 font-medium text-slate-100">{unit.model}</span>
          </div>
          <div>
            <span className="text-slate-400">Tonnage:</span>
            <span className="ml-2 font-medium text-slate-100">{unit.mass}t</span>
          </div>
          <div>
            <span className="text-slate-400">Tech Base:</span>
            <span className="ml-2 font-medium text-slate-100">{unit.tech_base}</span>
          </div>
        </div>
      </div>
      
      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Engine & Movement */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-100 mb-3">Engine & Movement</h3>
          
          <div className="space-y-3">
            {/* Engine Type & Rating */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-300">Engine Type</label>
                <CustomDropdown
                  value={systemComponents?.engine?.type || 'Standard'}
                  options={engineTypes}
                  onChange={(value) => handleEngineChange('type', value)}
                  disabled={readOnly}
                />
              </div>
              <div>
                <label className="text-xs text-slate-300">Rating</label>
                <input
                  type="number"
                  value={systemComponents?.engine?.rating || 300}
                  onChange={(e) => handleEngineChange('rating', e.target.value)}
                  disabled={readOnly}
                  min={10}
                  max={500}
                  step={5}
                  className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100"
                />
              </div>
            </div>
            
            {/* Engine Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-700/50 rounded p-2">
                <span className="text-slate-400">Weight:</span>
                <span className="ml-1 text-slate-100">{engineWeight} tons</span>
              </div>
              <div className="bg-slate-700/50 rounded p-2">
                <span className="text-slate-400">Walk/Run:</span>
                <span className="ml-1 text-slate-100">
                  {systemComponents?.engine ? Math.floor(systemComponents.engine.rating / unit.mass) : 0}/
                  {systemComponents?.engine ? Math.floor(systemComponents.engine.rating / unit.mass * 1.5) : 0} MP
                </span>
              </div>
            </div>
            
            {/* Critical Slots */}
            {systemComponents?.engine && ENGINE_SLOT_REQUIREMENTS[systemComponents.engine.type] && (
              <div className="text-xs bg-slate-700/50 rounded p-2">
                <span className="text-slate-400">Slots:</span>
                <span className="ml-1 text-slate-100">
                  CT: {ENGINE_SLOT_REQUIREMENTS[systemComponents.engine.type].centerTorso}
                  {ENGINE_SLOT_REQUIREMENTS[systemComponents.engine.type].leftTorso > 0 && (
                    <>, LT: {ENGINE_SLOT_REQUIREMENTS[systemComponents.engine.type].leftTorso}, RT: {ENGINE_SLOT_REQUIREMENTS[systemComponents.engine.type].rightTorso}</>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Structure & Gyro */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-100 mb-3">Structure & Gyro</h3>
          
          <div className="space-y-3">
            {/* Structure Type */}
            <div>
              <label className="text-xs text-slate-300">Internal Structure</label>
              <CustomDropdown
                value={systemComponents?.structure?.type || 'Standard'}
                options={structureTypes}
                onChange={(value) => updateStructure(value)}
                disabled={readOnly}
              />
              <div className="mt-1 text-xs text-slate-400">
                Weight: {structureWeight} tons
                {systemComponents?.structure && STRUCTURE_SLOT_REQUIREMENTS[systemComponents.structure.type] > 0 && 
                  ` | Slots: ${STRUCTURE_SLOT_REQUIREMENTS[systemComponents.structure.type]}`}
              </div>
            </div>
            
            {/* Gyro Type */}
            <div>
              <label className="text-xs text-slate-300">Gyro Type</label>
              <CustomDropdown
                value={systemComponents?.gyro?.type || 'Standard'}
                options={gyroTypes}
                onChange={(value) => updateGyro(value)}
                disabled={readOnly}
              />
              <div className="mt-1 text-xs text-slate-400">
                Weight: {gyroWeight} tons
                {systemComponents?.gyro && ` | Slots: ${GYRO_SLOT_REQUIREMENTS[systemComponents.gyro.type]} CT`}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Heat Sinks Section */}
      <div className="mt-4 bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h3 className="text-sm font-semibold text-slate-100 mb-3">Heat Management</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-slate-300">Heat Sink Type</label>
            <CustomDropdown
              value={systemComponents?.heatSinks?.type || 'Single'}
              options={heatSinkTypes}
              onChange={(value) => handleHeatSinkChange('type', value)}
              disabled={readOnly}
            />
          </div>
          
          <div>
            <label className="text-xs text-slate-300">Total Count</label>
            <input
              type="number"
              value={systemComponents?.heatSinks?.total || 10}
              onChange={(e) => handleHeatSinkChange('count', e.target.value)}
              disabled={readOnly}
              min={10}
              max={50}
              className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100"
            />
          </div>
          
          <div className="flex items-end">
            <div className="bg-slate-700/50 rounded px-3 py-1 text-xs">
              <span className="text-slate-400">Engine:</span>
              <span className="ml-1 text-slate-100">{systemComponents?.heatSinks?.engineIntegrated || 0}</span>
            </div>
          </div>
          
          <div className="flex items-end">
            <div className="bg-slate-700/50 rounded px-3 py-1 text-xs">
              <span className="text-slate-400">External:</span>
              <span className="ml-1 text-slate-100">{systemComponents?.heatSinks?.externalRequired || 0}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Weight Summary */}
      <div className="mt-4 bg-slate-700/50 rounded-lg p-3 border border-slate-600">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
          <div>
            <span className="text-slate-400">Structure:</span>
            <span className="ml-2 text-slate-100">{structureWeight}t</span>
          </div>
          <div>
            <span className="text-slate-400">Engine:</span>
            <span className="ml-2 text-slate-100">{engineWeight}t</span>
          </div>
          <div>
            <span className="text-slate-400">Gyro:</span>
            <span className="ml-2 text-slate-100">{gyroWeight}t</span>
          </div>
          <div>
            <span className="text-slate-400">Cockpit:</span>
            <span className="ml-2 text-slate-100">3t</span>
          </div>
        </div>
      </div>
      
      {/* Validation Errors */}
      {validationState && validationState.errors.length > 0 && (
        <div className="mt-4 bg-red-900/20 border border-red-700 rounded-lg p-3">
          <h4 className="font-medium text-red-400 text-sm mb-1">Structure Issues</h4>
          <ul className="space-y-0.5">
            {validationState.errors.slice(0, 3).map((error, index) => (
              <li key={index} className="text-xs text-red-300 flex items-start">
                <span className="text-red-500 mr-1">•</span>
                {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
