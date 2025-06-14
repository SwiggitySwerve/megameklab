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
  
  // Get armor type from system components
  const selectedArmorType = useMemo(() => {
    const armorTypeId = systemComponents?.armor?.type || 'Standard';
    // Convert system component type to armor type ID
    const typeMap: { [key: string]: string } = {
      'Standard': 'standard',
      'Ferro-Fibrous': 'ferro_fibrous',
      'Ferro-Fibrous (Clan)': 'ferro_fibrous_clan',
      'Light Ferro-Fibrous': 'light_ferro_fibrous',
      'Heavy Ferro-Fibrous': 'heavy_ferro_fibrous',
      'Stealth': 'stealth',
      'Reactive': 'reactive',
      'Reflective': 'reflective',
      'Hardened': 'hardened',
    };
    const mappedId = typeMap[armorTypeId] || 'standard';
    return ARMOR_TYPES.find(type => type.id === mappedId) || ARMOR_TYPES[0];
  }, [systemComponents?.armor?.type]);
  
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
  
  // Calculate maximum possible armor points based on location limits
  const calculateMaxPossibleArmorPoints = useCallback(() => {
    const locations = [
      { name: 'head', hasRear: false },
      { name: 'center torso', hasRear: true },
      { name: 'left torso', hasRear: true },
      { name: 'right torso', hasRear: true },
      { name: 'left arm', hasRear: false },
      { name: 'right arm', hasRear: false },
      { name: 'left leg', hasRear: false },
      { name: 'right leg', hasRear: false }
    ];
    
    let totalMax = 0;
    locations.forEach(loc => {
      const max = getMaxArmorForLocation(loc.name, unit.mass);
      totalMax += max;
      // Add rear armor capacity for torsos (typically can have as much rear as front)
      if (loc.hasRear) {
        totalMax += max;
      }
    });
    
    return totalMax;
  }, [unit.mass]);
  
  // Calculate total armor points available
  const totalArmorPoints = Math.floor(armorTonnage * selectedArmorType.pointsPerTon);
  
  // Calculate max tonnage based on armor type (can't exceed physical limits)
  const maxTonnage = useMemo(() => {
    const maxPossibleArmorPoints = calculateMaxPossibleArmorPoints();
    const maxTonnageByType = Math.ceil(maxPossibleArmorPoints / selectedArmorType.pointsPerTon);
    
    // Different practical limits based on armor type
    let practicalLimit = unit.mass;
    
    // Hardened armor has much lower efficiency, so it needs more tonnage
    if (selectedArmorType.id === 'hardened') {
      // Hardened armor (8 pts/ton) can theoretically use up to 77% of mech tonnage
      practicalLimit = Math.floor(unit.mass * 0.77);
    } else if (selectedArmorType.id === 'standard' || 
               selectedArmorType.id === 'stealth' || 
               selectedArmorType.id === 'reactive' || 
               selectedArmorType.id === 'reflective') {
      // Standard efficiency armors (16 pts/ton) typically max out around 39% of mech tonnage
      practicalLimit = Math.floor(unit.mass * 0.39);
    } else if (selectedArmorType.id === 'light_ferro_fibrous') {
      // Light FF (16.8 pts/ton) maxes around 37% of mech tonnage
      practicalLimit = Math.floor(unit.mass * 0.37);
    } else if (selectedArmorType.id === 'ferro_fibrous' || selectedArmorType.id === 'ferro_fibrous_clan') {
      // Ferro-Fibrous (17.6 pts/ton) maxes around 35% of mech tonnage
      practicalLimit = Math.floor(unit.mass * 0.35);
    } else if (selectedArmorType.id === 'heavy_ferro_fibrous') {
      // Heavy FF (19.2 pts/ton) maxes around 32% of mech tonnage
      practicalLimit = Math.floor(unit.mass * 0.32);
    } else if (selectedArmorType.id === 'ferro_lamellor') {
      // Ferro-Lamellor (20.48 pts/ton) maxes around 30% of mech tonnage
      practicalLimit = Math.floor(unit.mass * 0.30);
    }
    
    // Return the minimum of calculated max and practical limit
    return Math.min(maxTonnageByType, practicalLimit);
  }, [calculateMaxPossibleArmorPoints, selectedArmorType, unit.mass]);
  
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
    
    // Convert armor type ID to system component type name
    const typeMap: { [key: string]: string } = {
      'standard': 'Standard',
      'ferro_fibrous': 'Ferro-Fibrous',
      'ferro_fibrous_clan': 'Ferro-Fibrous (Clan)',
      'light_ferro_fibrous': 'Light Ferro-Fibrous',
      'heavy_ferro_fibrous': 'Heavy Ferro-Fibrous',
      'stealth': 'Stealth',
      'reactive': 'Reactive',
      'reflective': 'Reflective',
      'hardened': 'Hardened',
    };
    
    const systemComponentType = typeMap[armorType.id] || 'Standard';
    updateArmor(systemComponentType);
    
    // Calculate new max tonnage for the selected armor type
    const maxPossibleArmorPoints = calculateMaxPossibleArmorPoints();
    const maxTonnageByType = Math.ceil(maxPossibleArmorPoints / armorType.pointsPerTon);
    
    // Calculate practical limit based on armor type
    let practicalLimit = unit.mass;
    
    if (armorType.id === 'hardened') {
      practicalLimit = Math.floor(unit.mass * 0.77);
    } else if (armorType.id === 'standard' || 
               armorType.id === 'stealth' || 
               armorType.id === 'reactive' || 
               armorType.id === 'reflective') {
      practicalLimit = Math.floor(unit.mass * 0.39);
    } else if (armorType.id === 'light_ferro_fibrous') {
      practicalLimit = Math.floor(unit.mass * 0.37);
    } else if (armorType.id === 'ferro_fibrous' || armorType.id === 'ferro_fibrous_clan') {
      practicalLimit = Math.floor(unit.mass * 0.35);
    } else if (armorType.id === 'heavy_ferro_fibrous') {
      practicalLimit = Math.floor(unit.mass * 0.32);
    } else if (armorType.id === 'ferro_lamellor') {
      practicalLimit = Math.floor(unit.mass * 0.30);
    }
    
    const newMaxTonnage = Math.min(maxTonnageByType, practicalLimit);
    
    // If current tonnage exceeds new maximum, adjust it down
    if (armorTonnage > newMaxTonnage) {
      setArmorTonnage(newMaxTonnage);
    }
  }, [readOnly, updateArmor, armorTonnage, calculateMaxPossibleArmorPoints, unit.mass]);
  
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
            <div className="text-xs text-slate-400 mb-1">Quick Actions</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleMaximizeArmor}
                disabled={readOnly}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded text-xs font-medium transition-colors"
                title="Maximize armor tonnage"
              >
                ⬆ Max Armor
              </button>
              <button
                onClick={() => setShowPresets(!showPresets)}
                disabled={readOnly}
                className={`px-3 py-1.5 ${showPresets ? 'bg-slate-500' : 'bg-slate-600'} hover:bg-slate-700 disabled:bg-gray-700 text-white rounded text-xs font-medium transition-colors`}
                title="Show preset distributions"
              >
                📋 Presets {showPresets ? '▲' : '▼'}
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
          {/* Auto-Allocate Button */}
          <div className="mb-4">
            <button
              onClick={handleAutoAllocate}
              disabled={readOnly}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
              title="Auto-distribute armor across all locations"
            >
              <span>⚡</span>
              <span>Auto-Allocate Armor Points</span>
              <span className="text-xs opacity-75">({totalArmorPoints} pts available)</span>
            </button>
          </div>
          
          <h3 className="text-sm font-semibold text-slate-100 mb-3">Location Details</h3>
          
          {/* Table Header */}
          <div className="grid grid-cols-5 gap-2 text-xs font-medium text-slate-400 pb-2 border-b border-slate-600">
            <div className="col-span-2">Location</div>
            <div className="text-center">Front</div>
            <div className="text-center">Rear</div>
            <div className="text-center">Total / Max</div>
          </div>
          
          {/* Location Rows */}
          <div className="space-y-1 mt-2">
            {['Head', 'Center Torso', 'Left Torso', 'Right Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg'].map(location => {
              const armor = armorAllocation[location] || { front: 0, rear: 0 };
              const max = getMaxArmorForLocation(location, unit.mass);
              const hasRear = location.includes('Torso');
              const total = armor.front + (armor.rear || 0);
              const percentage = (total / max) * 100;
              
              return (
                <div key={location} className="grid grid-cols-5 gap-2 items-center py-1.5 hover:bg-slate-700/30 rounded transition-colors">
                  <div className="col-span-2 text-slate-300 text-sm font-medium">
                    {location}
                  </div>
                  <div className="text-center">
                    <span className="text-slate-100 font-medium">{armor.front}</span>
                  </div>
                  <div className="text-center">
                    {hasRear ? (
                      <span className="text-slate-100 font-medium">{armor.rear || 0}</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </div>
                  <div className="text-center flex items-center justify-center gap-2">
                    <span className="text-slate-400 text-xs">{total}/{max}</span>
                    <div className="w-12 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          percentage >= 80 ? 'bg-green-500' :
                          percentage >= 50 ? 'bg-blue-500' :
                          percentage >= 25 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Summary Stats */}
          <div className="mt-3 pt-3 border-t border-slate-600 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-700/30 rounded px-2 py-1">
              <span className="text-slate-400">Total Front:</span>
              <span className="ml-2 text-slate-100 font-medium">
                {Object.values(armorAllocation).reduce((sum, loc) => sum + (loc.front || 0), 0)}
              </span>
            </div>
            <div className="bg-slate-700/30 rounded px-2 py-1">
              <span className="text-slate-400">Total Rear:</span>
              <span className="ml-2 text-slate-100 font-medium">
                {Object.values(armorAllocation).reduce((sum, loc) => sum + (loc.rear || 0), 0)}
              </span>
            </div>
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
