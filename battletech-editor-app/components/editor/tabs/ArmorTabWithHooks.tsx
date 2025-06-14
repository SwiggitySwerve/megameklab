/**
 * Armor Tab Component with Hooks
 * Uses the unified data model for state management
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  useUnitData, 
  useSystemComponents,
  useArmorAllocation,
  useValidationState 
} from '../../../hooks/useUnitData';
import { EditableUnit, ArmorType, ARMOR_TYPES } from '../../../types/editor';
import ArmorTypeSelector from '../armor/ArmorTypeSelector';
import ArmorTonnageControl from '../armor/ArmorTonnageControl';
import ArmorStatisticsPanel from '../armor/ArmorStatisticsPanel';
import MechArmorDiagram from '../armor/MechArmorDiagram';
import ArmorDistributionPresets from '../armor/ArmorDistributionPresets';
import { maximizeArmor, useRemainingTonnageForArmor, autoAllocateArmor } from '../../../utils/armorAllocation';
import { calculateStructureWeight, calculateEngineWeight, calculateGyroWeight } from '../../../types/systemComponents';

interface ArmorTabWithHooksProps {
  readOnly?: boolean;
}

export default function ArmorTabWithHooks({ readOnly = false }: ArmorTabWithHooksProps) {
  const { state, updateArmor, updateArmorAllocation } = useUnitData();
  const systemComponents = useSystemComponents();
  const armorAllocation = useArmorAllocation();
  const validationState = useValidationState();
  
  const unit = state.unit;
  
  // State management
  const [selectedArmorType, setSelectedArmorType] = useState<ArmorType>(
    ARMOR_TYPES.find(type => type.id === unit.data?.armor?.type || 'standard') || ARMOR_TYPES[0]
  );
  
  const [showPresets, setShowPresets] = useState(false);
  
  // Calculate current armor tonnage
  const calculateCurrentArmorTonnage = useCallback((): number => {
    const totalPoints = Object.values(armorAllocation).reduce((total, location) => {
      return total + (location.front || 0) + (location.rear || 0);
    }, 0);
    return Math.ceil(totalPoints / selectedArmorType.pointsPerTon);
  }, [armorAllocation, selectedArmorType.pointsPerTon]);
  
  const [armorTonnage, setArmorTonnage] = useState<number>(() => {
    const totalPoints = Object.values(armorAllocation).reduce((total, location) => {
      return total + (location.front || 0) + (location.rear || 0);
    }, 0);
    return Math.ceil(totalPoints / selectedArmorType.pointsPerTon) || 19;
  });
  
  // Calculate total armor points available
  const totalArmorPoints = Math.floor(armorTonnage * selectedArmorType.pointsPerTon);
  const maxTonnage = unit.mass * 0.5; // Max 50% of mech tonnage
  
  // Calculate current weight to determine remaining tonnage
  const calculateCurrentWeight = (): number => {
    let weight = 0;
    
    // Structure weight
    if (systemComponents?.structure) {
      weight += calculateStructureWeight(unit.mass, systemComponents.structure.type);
    } else {
      weight += unit.mass * 0.1;
    }
    
    // Engine weight
    if (systemComponents?.engine) {
      weight += calculateEngineWeight(systemComponents.engine.rating, systemComponents.engine.type);
    }
    
    // Gyro weight
    if (systemComponents?.engine && systemComponents?.gyro) {
      weight += calculateGyroWeight(systemComponents.engine.rating, systemComponents.gyro.type);
    }
    
    // Cockpit weight (standard is 3 tons)
    weight += 3;
    
    // Heat sinks
    if (systemComponents?.heatSinks) {
      weight += systemComponents.heatSinks.externalRequired;
    }
    
    // Equipment weight
    const equipment = unit.data?.weapons_and_equipment || [];
    equipment.forEach(item => {
      // TODO: Look up actual equipment weight
      weight += 1; // Placeholder
    });
    
    // Current armor weight
    weight += armorTonnage;
    
    return weight;
  };
  
  // Handle armor type change
  const handleArmorTypeChange = useCallback((armorType: ArmorType) => {
    if (readOnly) return;
    setSelectedArmorType(armorType);
    updateArmor(armorType.id);
  }, [readOnly, updateArmor]);
  
  // Handle armor tonnage change
  const handleArmorTonnageChange = useCallback((tonnage: number) => {
    if (readOnly) return;
    setArmorTonnage(tonnage);
  }, [readOnly]);
  
  // Handle armor location change
  const handleArmorLocationChange = useCallback((location: string, front: number, rear: number) => {
    if (readOnly) return;
    
    // Convert location names to match the data model
    const locationMap: { [key: string]: string } = {
      'head': 'Head',
      'center_torso': 'Center Torso',
      'left_torso': 'Left Torso',
      'right_torso': 'Right Torso',
      'left_arm': 'Left Arm',
      'right_arm': 'Right Arm',
      'left_leg': 'Left Leg',
      'right_leg': 'Right Leg'
    };
    
    const mappedLocation = locationMap[location] || location;
    updateArmorAllocation(mappedLocation, front, rear || undefined);
  }, [readOnly, updateArmorAllocation]);
  
  // Calculate max armor for location
  const getMaxArmorForLocation = (location: string, mass: number): number => {
    switch (location.toLowerCase().replace(/_/g, ' ')) {
      case 'head':
        return 9;
      case 'center torso':
        return Math.floor(mass * 2 * 0.4);
      case 'left torso':
      case 'right torso':
        return Math.floor(mass * 2 * 0.3);
      case 'left arm':
      case 'right arm':
      case 'left leg':
      case 'right leg':
        return Math.floor(mass * 2 * 0.25);
      default:
        return Math.floor(mass * 2 * 0.2);
    }
  };
  
  // Handle applying armor distribution from presets
  const handleApplyDistribution = useCallback((distribution: any) => {
    if (readOnly) return;
    
    // Apply distribution to all locations
    Object.entries(distribution).forEach(([location, values]: [string, any]) => {
      if (values && typeof values === 'object') {
        handleArmorLocationChange(location, values.front || 0, values.rear || 0);
      }
    });
  }, [readOnly, handleArmorLocationChange]);
  
  // Handle maximize armor
  const handleMaximizeArmor = useCallback(() => {
    if (readOnly) return;
    
    try {
      const maxTonnage = maximizeArmor(unit, selectedArmorType);
      setArmorTonnage(maxTonnage);
      
      // Calculate armor points and auto-allocate
      const totalPoints = Math.floor(maxTonnage * selectedArmorType.pointsPerTon);
      const updatedUnit = {
        ...unit,
        data: {
          ...unit.data,
          armor: {
            ...unit.data?.armor,
            total_armor_points: totalPoints,
            locations: unit.data?.armor?.locations || []
          }
        }
      };
      
      const allocation = autoAllocateArmor(updatedUnit);
      handleApplyDistribution(allocation);
    } catch (error) {
      console.error('Maximize armor failed:', error);
    }
  }, [unit, selectedArmorType, handleApplyDistribution, readOnly]);
  
  // Handle use remaining tonnage
  const handleUseRemainingTonnage = useCallback(() => {
    if (readOnly) return;
    
    try {
      const currentWeight = calculateCurrentWeight() - armorTonnage; // Subtract current armor
      const remainingTonnage = unit.mass - currentWeight;
      const newTonnage = Math.min(remainingTonnage, maxTonnage);
      
      setArmorTonnage(newTonnage);
      
      // Calculate armor points and auto-allocate
      const totalPoints = Math.floor(newTonnage * selectedArmorType.pointsPerTon);
      const updatedUnit = {
        ...unit,
        data: {
          ...unit.data,
          armor: {
            ...unit.data?.armor,
            total_armor_points: totalPoints,
            locations: unit.data?.armor?.locations || []
          }
        }
      };
      
      const allocation = autoAllocateArmor(updatedUnit);
      handleApplyDistribution(allocation);
    } catch (error) {
      console.error('Use remaining tonnage failed:', error);
    }
  }, [unit, selectedArmorType, armorTonnage, maxTonnage, handleApplyDistribution, readOnly]);
  
  // Auto-allocate armor evenly
  const handleAutoAllocate = useCallback(() => {
    if (readOnly) return;
    
    const locations = ['head', 'center_torso', 'left_torso', 'right_torso', 'left_arm', 'right_arm', 'left_leg', 'right_leg'];
    
    // Calculate total available points
    const availablePoints = totalArmorPoints;
    
    // Distribute armor based on location maximums
    const allocation = {
      head: Math.min(9, Math.floor(availablePoints * 0.05)),
      center_torso: Math.min(getMaxArmorForLocation('center torso', unit.mass), Math.floor(availablePoints * 0.25)),
      left_torso: Math.min(getMaxArmorForLocation('left torso', unit.mass), Math.floor(availablePoints * 0.15)),
      right_torso: Math.min(getMaxArmorForLocation('right torso', unit.mass), Math.floor(availablePoints * 0.15)),
      left_arm: Math.min(getMaxArmorForLocation('left arm', unit.mass), Math.floor(availablePoints * 0.1)),
      right_arm: Math.min(getMaxArmorForLocation('right arm', unit.mass), Math.floor(availablePoints * 0.1)),
      left_leg: Math.min(getMaxArmorForLocation('left leg', unit.mass), Math.floor(availablePoints * 0.1)),
      right_leg: Math.min(getMaxArmorForLocation('right leg', unit.mass), Math.floor(availablePoints * 0.1))
    };
    
    // Add rear armor for torsos
    const distribution: any = {};
    locations.forEach(location => {
      const points = allocation[location as keyof typeof allocation] || 0;
      if (location.includes('torso')) {
        const rearPoints = Math.min(Math.floor(points * 0.2), 10);
        distribution[location] = {
          front: points - rearPoints,
          rear: rearPoints
        };
      } else {
        distribution[location] = {
          front: points,
          rear: 0
        };
      }
    });
    
    handleApplyDistribution(distribution);
  }, [unit.mass, totalArmorPoints, readOnly, handleApplyDistribution]);
  
  // Calculate current total armor points
  const currentArmorPoints = useMemo(() => {
    return Object.values(armorAllocation).reduce((total, location) => {
      return total + (location.front || 0) + (location.rear || 0);
    }, 0);
  }, [armorAllocation]);
  
  return (
    <div className="armor-tab p-4 max-w-7xl mx-auto">
      {/* Compact Header with Main Controls */}
      <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Armor Type & Tonnage */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Armor Type</label>
              <select
                value={selectedArmorType.id}
                onChange={(e) => {
                  const type = ARMOR_TYPES.find(t => t.id === e.target.value);
                  if (type) handleArmorTypeChange(type);
                }}
                disabled={readOnly}
                className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100"
              >
                {ARMOR_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tonnage: {armorTonnage} / {maxTonnage} tons
              </label>
              <input
                type="range"
                min={0}
                max={maxTonnage}
                step={0.5}
                value={armorTonnage}
                onChange={(e) => handleArmorTonnageChange(parseFloat(e.target.value))}
                disabled={readOnly}
                className="w-full"
              />
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-col justify-center space-y-2">
            <div className="flex gap-2">
              <button
                onClick={handleMaximizeArmor}
                disabled={readOnly}
                className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded text-xs font-medium"
              >
                Max
              </button>
              <button
                onClick={handleUseRemainingTonnage}
                disabled={readOnly}
                className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded text-xs font-medium"
              >
                Fill
              </button>
              <button
                onClick={handleAutoAllocate}
                disabled={readOnly}
                className="flex-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded text-xs font-medium"
              >
                Auto
              </button>
              <button
                onClick={() => setShowPresets(!showPresets)}
                disabled={readOnly}
                className="flex-1 px-2 py-1 bg-slate-600 hover:bg-slate-700 disabled:bg-gray-700 text-white rounded text-xs font-medium"
              >
                Presets
              </button>
            </div>
          </div>
          
          {/* Status Info */}
          <div className="text-sm text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span>Points:</span>
              <span className="font-medium">{currentArmorPoints} / {totalArmorPoints}</span>
            </div>
            <div className="flex justify-between">
              <span>Per Ton:</span>
              <span className="font-medium">{selectedArmorType.pointsPerTon} pts</span>
            </div>
            <div className="flex justify-between">
              <span>Tech:</span>
              <span className="font-medium">{selectedArmorType.techLevel}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Presets (Collapsible) */}
      {showPresets && (
        <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-100 mb-2">Distribution Presets</h3>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
            <button className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs">
              Balanced
            </button>
            <button className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs">
              Striker
            </button>
            <button className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs">
              Brawler
            </button>
            <button className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs">
              Juggernaut
            </button>
            <button className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs">
              Sniper
            </button>
            <button className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs">
              Scout
            </button>
          </div>
        </div>
      )}
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Mech Armor Diagram */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-100 mb-2">
            Armor Allocation (Available: {totalArmorPoints - currentArmorPoints} pts)
          </h3>
          <div className="bg-slate-900 rounded p-2" style={{ minHeight: '400px' }}>
            <MechArmorDiagram
              unit={unit}
              onArmorChange={handleArmorLocationChange}
              readOnly={readOnly}
            />
          </div>
        </div>
        
        {/* Armor Statistics */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-100 mb-2">Location Details</h3>
          <div className="space-y-2 text-sm">
            {['Head', 'Center Torso', 'Left Torso', 'Right Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg'].map(location => {
              const key = location.toLowerCase().replace(/ /g, '_');
              const armor = armorAllocation[location] || { front: 0, rear: 0 };
              const max = getMaxArmorForLocation(location, unit.mass);
              const hasRear = location.includes('Torso');
              
              return (
                <div key={location} className="flex items-center justify-between py-1 border-b border-slate-700">
                  <span className="text-slate-300">{location}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs">
                      {armor.front}{hasRear && `/${armor.rear}`} / {max}
                    </span>
                    <div className="w-24 bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, ((armor.front + (armor.rear || 0)) / max) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Validation Errors (Compact) */}
      {validationState && validationState.errors.filter(e => e.field?.includes('armor')).length > 0 && (
        <div className="mt-4 bg-red-900/20 border border-red-700 rounded-lg p-3">
          <h4 className="font-medium text-red-400 text-sm mb-1">Armor Issues</h4>
          <ul className="space-y-0.5">
            {validationState.errors
              .filter(error => error.field?.includes('armor'))
              .slice(0, 3)
              .map((error, index) => (
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
