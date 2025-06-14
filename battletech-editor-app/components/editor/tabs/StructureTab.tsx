import React, { useState, useCallback } from 'react';
import { EditableUnit } from '../../../types/editor';
import BasicInfoPanel from '../structure/BasicInfoPanel';
import { 
  syncEngineChange, 
  syncGyroChange, 
  syncStructureChange, 
  syncHeatSinkChange,
  initializeSystemComponents 
} from '../../../utils/componentSync';
import { EngineType, GyroType, StructureType, HeatSinkType } from '../../../types/systemComponents';

interface StructureTabProps {
  unit: EditableUnit;
  onUnitChange: (updates: Partial<EditableUnit>) => void;
  validationErrors?: any[];
  readOnly?: boolean;
}

const StructureTab: React.FC<StructureTabProps> = ({
  unit,
  onUnitChange,
  validationErrors = [],
  readOnly = false,
}) => {
  // Handle basic info changes
  const handleBasicInfoChange = useCallback((field: string, value: any) => {
    if (readOnly) return;
    
    const updates: Partial<EditableUnit> = {};
    
    // Update the appropriate field
    if (['chassis', 'model', 'mass', 'tech_base', 'era', 'source', 'rules_level', 'role'].includes(field)) {
      updates[field as keyof EditableUnit] = value;
    }
    
    // Also update the data object for consistency
    if (unit.data) {
      updates.data = {
        ...unit.data,
        [field]: value
      };
    }
    
    onUnitChange(updates);
  }, [unit.data, onUnitChange, readOnly]);

  // Handle engine configuration changes
  const handleEngineChange = useCallback((engineType: string, rating: number) => {
    if (readOnly) return;
    
    // Use the sync function to update engine and critical slots
    const updates = syncEngineChange(unit, engineType as EngineType, rating);
    onUnitChange(updates);
  }, [unit, onUnitChange, readOnly]);

  // Handle structure changes
  const handleStructureChange = useCallback((structureType: string) => {
    if (readOnly) return;
    
    // Use the sync function to update structure and critical slots
    const updates = syncStructureChange(unit, structureType as StructureType);
    onUnitChange(updates);
  }, [unit, onUnitChange, readOnly]);
  
  // Handle gyro changes
  const handleGyroChange = useCallback((gyroType: string) => {
    if (readOnly) return;
    
    // Use the sync function to update gyro and critical slots
    const updates = syncGyroChange(unit, gyroType as GyroType);
    onUnitChange(updates);
  }, [unit, onUnitChange, readOnly]);

  // Handle heat sink changes
  const handleHeatSinksChange = useCallback((heatSinkType: string, count: number) => {
    if (readOnly) return;
    
    // Use the sync function to update heat sinks and generate equipment
    const updates = syncHeatSinkChange(unit, heatSinkType as HeatSinkType, count);
    onUnitChange(updates);
  }, [unit, onUnitChange, readOnly]);

  // Handle movement changes
  const handleMovementChange = useCallback((walkMP: number, jumpMP: number) => {
    if (readOnly) return;
    
    const updates: Partial<EditableUnit> = {
      data: {
        ...unit.data,
        movement: {
          walk_mp: walkMP,
          jump_mp: jumpMP
        }
      }
    };
    
    onUnitChange(updates);
  }, [unit.data, onUnitChange, readOnly]);

  return (
    <div className="structure-tab space-y-8">
      {/* Header */}
      <div className="text-center border-b border-slate-600 pb-4">
        <h2 className="text-2xl font-bold text-slate-100">Mech Structure Configuration</h2>
        <p className="text-slate-400 mt-2">Configure basic chassis, engine, and structural components</p>
      </div>

      {/* Basic Information Panel */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          Basic Information
        </h3>
        <BasicInfoPanel
          unit={unit}
          onUnitChange={onUnitChange}
          readOnly={readOnly}
        />
      </div>

      {/* Engine Configuration */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.472-2.472a3.375 3.375 0 000-4.773L6.75 2.25 2.25 6.75l4.773 4.773a3.375 3.375 0 004.773 0z" />
          </svg>
          Engine Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Engine Type</label>
            <select
              value={unit.data?.engine?.type || 'Standard'}
              onChange={(e) => handleEngineChange(e.target.value, unit.data?.engine?.rating || 300)}
              disabled={readOnly}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100"
            >
              <option value="Standard">Standard</option>
              <option value="XL">XL Engine</option>
              <option value="Light">Light Engine</option>
              <option value="XXL">XXL Engine</option>
              <option value="Compact">Compact Engine</option>
              <option value="ICE">ICE</option>
              <option value="Fuel Cell">Fuel Cell</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Engine Rating</label>
            <input
              type="number"
              value={unit.data?.engine?.rating || 300}
              onChange={(e) => handleEngineChange(unit.data?.engine?.type || 'Standard', parseInt(e.target.value) || 300)}
              disabled={readOnly}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100"
              min={100}
              max={500}
              step={5}
            />
          </div>
        </div>
        
        {/* Engine Details */}
        {unit.systemComponents?.engine && (
          <div className="mt-4 p-3 bg-slate-700 rounded-md text-sm">
            <p className="text-slate-300">
              <span className="font-medium">Critical Slots:</span>{' '}
              {unit.systemComponents.engine.type === 'Standard' && '6 CT'}
              {unit.systemComponents.engine.type === 'XL' && '6 CT + 3 LT + 3 RT'}
              {unit.systemComponents.engine.type === 'Light' && '6 CT + 2 LT + 2 RT'}
              {unit.systemComponents.engine.type === 'XXL' && '6 CT + 6 LT + 6 RT'}
              {unit.systemComponents.engine.type === 'Compact' && '3 CT'}
            </p>
          </div>
        )}
      </div>

      {/* Gyro Configuration */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H21m-1.5 0H21m-1.5 0H21" />
          </svg>
          Gyro Configuration
        </h3>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Gyro Type</label>
          <select
            value={unit.data?.gyro?.type || 'Standard'}
            onChange={(e) => handleGyroChange(e.target.value)}
            disabled={readOnly}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100"
          >
            <option value="Standard">Standard Gyro</option>
            <option value="Compact">Compact Gyro</option>
            <option value="Heavy-Duty">Heavy-Duty Gyro</option>
            <option value="XL">XL Gyro</option>
          </select>
        </div>
      </div>

      {/* Structure Type */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z" />
          </svg>
          Internal Structure
        </h3>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Structure Type</label>
          <select
            value={unit.data?.structure?.type || 'Standard'}
            onChange={(e) => handleStructureChange(e.target.value)}
            disabled={readOnly}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100"
          >
            <option value="Standard">Standard</option>
            <option value="Endo Steel">Endo Steel</option>
            <option value="Endo Steel (Clan)">Endo Steel (Clan)</option>
            <option value="Composite">Composite</option>
          </select>
        </div>
      </div>

      {/* Heat Sinks */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
          </svg>
          Heat Sinks
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Heat Sink Type</label>
            <select
              value={unit.data?.heat_sinks?.type || 'Single'}
              onChange={(e) => handleHeatSinksChange(e.target.value, unit.data?.heat_sinks?.count || 10)}
              disabled={readOnly}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100"
            >
              <option value="Single">Single Heat Sinks</option>
              <option value="Double">Double Heat Sinks</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Heat Sink Count</label>
            <input
              type="number"
              value={unit.data?.heat_sinks?.count || 10}
              onChange={(e) => handleHeatSinksChange(unit.data?.heat_sinks?.type || 'Single', parseInt(e.target.value) || 10)}
              disabled={readOnly}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100"
              min={10}
              max={30}
            />
          </div>
        </div>
      </div>

      {/* Movement */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25m-18 0V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25m-18 0h18M5.25 6h.008v.008H5.25V6zM7.5 6h.008v.008H7.5V6zm2.25 0h.008v.008H9.75V6z" />
          </svg>
          Movement Profile
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Walking MP</label>
            <input
              type="number"
              value={unit.data?.movement?.walk_mp || 3}
              onChange={(e) => handleMovementChange(parseInt(e.target.value) || 3, unit.data?.movement?.jump_mp || 0)}
              disabled={readOnly}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100"
              min={1}
              max={12}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Jumping MP</label>
            <input
              type="number"
              value={unit.data?.movement?.jump_mp || 0}
              onChange={(e) => handleMovementChange(unit.data?.movement?.walk_mp || 3, parseInt(e.target.value) || 0)}
              disabled={readOnly}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100"
              min={0}
              max={8}
            />
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-4">
          <h4 className="font-medium text-red-400 mb-2">Structure Validation Issues</h4>
          <ul className="space-y-1">
            {validationErrors.slice(0, 5).map((error, index) => (
              <li key={index} className="text-sm text-red-300 flex items-start">
                <span className="text-red-500 mr-2">•</span>
                {error.message || error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mobile Responsive Note */}
      <div className="lg:hidden mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
        <p className="text-xs text-blue-300">
          For the best experience, use a larger screen to access all structure configuration features.
        </p>
      </div>
    </div>
  );
};

export default StructureTab;
