import React, { useState, useCallback } from 'react';
import { EditorComponentProps } from '../../../types/editor';
import ArmorAllocationPanel from '../armor/ArmorAllocationPanel';

const StructureArmorTab: React.FC<EditorComponentProps> = ({
  unit,
  onUnitChange,
  validationErrors = [],
  readOnly = false,
  compact = true,
}) => {
  const [activePanel, setActivePanel] = useState<'basic' | 'armor' | 'movement'>('armor');

  const handleArmorChange = useCallback((armorUpdates: any) => {
    onUnitChange({
      ...unit,
      armorAllocation: {
        ...unit.armorAllocation,
        ...armorUpdates,
      },
    });
  }, [unit, onUnitChange]);

  return (
    <div className="structure-armor-tab">
      <div className="grid grid-cols-3 gap-6 max-w-6xl">
        {/* Left Column - Basic Info & Chassis */}
        <div className="space-y-4">
          {/* Basic Information Panel */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Basic Information
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Chassis
                </label>
                <input
                  type="text"
                  value={unit.chassis || ''}
                  onChange={(e) => onUnitChange({ ...unit, chassis: e.target.value })}
                  disabled={readOnly}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  value={unit.model || ''}
                  onChange={(e) => onUnitChange({ ...unit, model: e.target.value })}
                  disabled={readOnly}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Mass (tons)
                </label>
                <input
                  type="number"
                  value={unit.mass || 0}
                  onChange={(e) => onUnitChange({ ...unit, mass: parseInt(e.target.value) || 0 })}
                  disabled={readOnly}
                  min="0"
                  max="200"
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tech Base
                </label>
                <select
                  value={unit.tech_base || 'Inner Sphere'}
                  onChange={(e) => onUnitChange({ ...unit, tech_base: e.target.value })}
                  disabled={readOnly}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="Inner Sphere">Inner Sphere</option>
                  <option value="Clan">Clan</option>
                  <option value="Mixed (IS Chassis)">Mixed (IS Chassis)</option>
                  <option value="Mixed (Clan Chassis)">Mixed (Clan Chassis)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Heat Sinks Panel */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Heat Sinks
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={unit.data?.heat_sinks?.type || 'Single'}
                  onChange={(e) => {
                    const updatedUnit = {
                      ...unit,
                      data: {
                        ...unit.data,
                        heat_sinks: {
                          ...unit.data?.heat_sinks,
                          type: e.target.value,
                        },
                      },
                    };
                    onUnitChange(updatedUnit);
                  }}
                  disabled={readOnly}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                  <option value="Compact">Compact</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Count
                </label>
                <input
                  type="number"
                  value={unit.data?.heat_sinks?.count || 10}
                  onChange={(e) => {
                    const updatedUnit = {
                      ...unit,
                      data: {
                        ...unit.data,
                        heat_sinks: {
                          ...unit.data?.heat_sinks,
                          count: parseInt(e.target.value) || 10,
                        },
                      },
                    };
                    onUnitChange(updatedUnit);
                  }}
                  disabled={readOnly}
                  min="0"
                  max="50"
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Movement Panel */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Movement
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Walk MP
                </label>
                <input
                  type="number"
                  value={unit.data?.movement?.walk_mp || 0}
                  onChange={(e) => {
                    const updatedUnit = {
                      ...unit,
                      data: {
                        ...unit.data,
                        movement: {
                          ...unit.data?.movement,
                          walk_mp: parseInt(e.target.value) || 0,
                        },
                      },
                    };
                    onUnitChange(updatedUnit);
                  }}
                  disabled={readOnly}
                  min="0"
                  max="20"
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Jump MP
                </label>
                <input
                  type="number"
                  value={unit.data?.movement?.jump_mp || 0}
                  onChange={(e) => {
                    const updatedUnit = {
                      ...unit,
                      data: {
                        ...unit.data,
                        movement: {
                          ...unit.data?.movement,
                          jump_mp: parseInt(e.target.value) || 0,
                        },
                      },
                    };
                    onUnitChange(updatedUnit);
                  }}
                  disabled={readOnly}
                  min="0"
                  max="12"
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center Column - Armor Diagram */}
        <div className="flex justify-center">
          <ArmorAllocationPanel
            unit={unit}
            onUnitChange={onUnitChange}
            validationErrors={validationErrors}
            readOnly={readOnly}
            compact={compact}
            showRearArmor={true}
            allowAutoAllocation={!readOnly}
            mechType={unit.data?.config as any || 'Biped'}
          />
        </div>

        {/* Right Column - Armor Configuration */}
        <div className="space-y-4">
          {/* Armor Type Panel */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Armor Configuration
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={unit.data?.armor?.type || 'Standard'}
                  onChange={(e) => {
                    const updatedUnit = {
                      ...unit,
                      data: {
                        ...unit.data,
                        armor: {
                          ...unit.data?.armor,
                          type: e.target.value,
                        },
                      },
                    };
                    onUnitChange(updatedUnit);
                  }}
                  disabled={readOnly}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="Standard">Standard</option>
                  <option value="Ferro-Fibrous">Ferro-Fibrous</option>
                  <option value="Ferro-Fibrous (Clan)">Ferro-Fibrous (Clan)</option>
                  <option value="Stealth">Stealth</option>
                  <option value="Hardened">Hardened</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tonnage
                </label>
                <input
                  type="number"
                  value={unit.data?.armor?.total_armor_points ? (unit.data.armor.total_armor_points / 16) : 0}
                  onChange={(e) => {
                    const tonnage = parseFloat(e.target.value) || 0;
                    const points = Math.round(tonnage * 16);
                    const updatedUnit = {
                      ...unit,
                      data: {
                        ...unit.data,
                        armor: {
                          ...unit.data?.armor,
                          total_armor_points: points,
                        },
                      },
                    };
                    onUnitChange(updatedUnit);
                  }}
                  disabled={readOnly}
                  min="0"
                  max="50"
                  step="0.5"
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Armor Statistics Panel */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Armor Statistics
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Points:</span>
                <span className="font-medium">{unit.data?.armor?.total_armor_points || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Max Possible:</span>
                <span className="font-medium">{Math.floor((unit.mass || 0) * 2 * 2.5)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Allocated:</span>
                <span className="font-medium">
                  {unit.data?.armor?.locations?.reduce((sum, loc) => 
                    sum + loc.armor_points + (loc.rear_armor_points || 0), 0
                  ) || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unallocated:</span>
                <span className="font-medium text-red-600">
                  {(unit.data?.armor?.total_armor_points || 0) - 
                   (unit.data?.armor?.locations?.reduce((sum, loc) => 
                     sum + loc.armor_points + (loc.rear_armor_points || 0), 0
                   ) || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {!readOnly && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="space-y-2">
                <button
                  onClick={() => {
                    // TODO: Implement maximize armor
                    console.log('Maximize armor clicked');
                  }}
                  className="w-full px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Maximize Armor
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement use remaining tonnage
                    console.log('Use remaining tonnage clicked');
                  }}
                  className="w-full px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Use Remaining Tonnage
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement auto-allocate
                    console.log('Auto-allocate clicked');
                  }}
                  className="w-full px-3 py-2 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  Auto Allocate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StructureArmorTab;
