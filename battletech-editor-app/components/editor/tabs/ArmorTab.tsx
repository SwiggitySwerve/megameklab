import React, { useState, useCallback } from 'react';
import { EditableUnit, ArmorType, ARMOR_TYPES } from '../../../types/editor';
import ArmorTypeSelector from '../armor/ArmorTypeSelector';
import ArmorTonnageControl from '../armor/ArmorTonnageControl';
import ArmorStatisticsPanel from '../armor/ArmorStatisticsPanel';
import MechArmorDiagram from '../armor/MechArmorDiagram';
import ArmorDistributionPresets from '../armor/ArmorDistributionPresets';
import { maximizeArmor, useRemainingTonnageForArmor, autoAllocateArmor } from '../../../utils/armorAllocation';

interface ArmorTabProps {
  unit: EditableUnit;
  onUnitChange: (updates: Partial<EditableUnit>) => void;
  validationErrors?: any[];
  readOnly?: boolean;
}

const ArmorTab: React.FC<ArmorTabProps> = ({
  unit,
  onUnitChange,
  validationErrors = [],
  readOnly = false,
}) => {
  // State management
  const [selectedArmorType, setSelectedArmorType] = useState<ArmorType>(
    ARMOR_TYPES.find(type => type.id === 'standard') || ARMOR_TYPES[0]
  );
  const [armorTonnage, setArmorTonnage] = useState<number>(19); // Default for 100-ton mech

  // Calculate total armor points available
  const totalArmorPoints = Math.floor(armorTonnage * selectedArmorType.pointsPerTon);
  const maxTonnage = unit.mass * 0.5; // Max 50% of mech tonnage

  // Handle armor type change
  const handleArmorTypeChange = useCallback((armorType: ArmorType) => {
    if (readOnly) return;
    setSelectedArmorType(armorType);
  }, [readOnly]);

  // Handle armor tonnage change
  const handleArmorTonnageChange = useCallback((tonnage: number) => {
    if (readOnly) return;
    setArmorTonnage(tonnage);
  }, [readOnly]);

  // Handle armor location change
  const handleArmorLocationChange = useCallback((location: string, front: number, rear: number) => {
    if (readOnly) return;
    
    // Update the armor allocation for this location
    const updatedArmorAllocation = {
      ...unit.armorAllocation,
      [location]: {
        ...unit.armorAllocation?.[location],
        front,
        rear: rear || 0,
        type: selectedArmorType
      }
    };

    onUnitChange({
      armorAllocation: updatedArmorAllocation
    });
  }, [unit.armorAllocation, onUnitChange, readOnly, selectedArmorType]);

  // Calculate max armor for location
  const getMaxArmorForLocation = (location: string, mass: number): number => {
    switch (location) {
      case 'head':
        return mass > 100 ? 12 : 9;
      case 'center_torso':
        return Math.floor(mass * 2 * 0.4);
      case 'left_torso':
      case 'right_torso':
        return Math.floor(mass * 2 * 0.3);
      case 'left_arm':
      case 'right_arm':
      case 'left_leg':
      case 'right_leg':
        return Math.floor(mass * 2 * 0.25);
      default:
        return Math.floor(mass * 2 * 0.2);
    }
  };

  // Handle applying armor distribution from presets
  const handleApplyDistribution = useCallback((distribution: any) => {
    if (readOnly) return;

    // Build updated armor allocation with all required properties
    const locations = ['head', 'center_torso', 'left_torso', 'right_torso', 'left_arm', 'right_arm', 'left_leg', 'right_leg'];
    const updatedArmorAllocation: { [key: string]: any } = {};

    locations.forEach(location => {
      const distData = distribution[location] || { front: 0, rear: 0 };
      updatedArmorAllocation[location] = {
        front: distData.front || 0,
        rear: distData.rear || 0,
        maxArmor: getMaxArmorForLocation(location, unit.mass),
        type: selectedArmorType
      };
    });

    onUnitChange({
      armorAllocation: updatedArmorAllocation
    });
  }, [unit.mass, selectedArmorType, onUnitChange, readOnly]);

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
      const newTonnage = useRemainingTonnageForArmor(unit, selectedArmorType);
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
  }, [unit, selectedArmorType, handleApplyDistribution, readOnly]);

  // Auto-allocate armor evenly
  const handleAutoAllocate = useCallback(() => {
    if (readOnly) return;

    const locations = ['head', 'center_torso', 'left_torso', 'right_torso', 'left_arm', 'right_arm', 'left_leg', 'right_leg'];
    const updatedArmorAllocation: { [key: string]: any } = {};
    
    // Calculate total available points
    const availablePoints = totalArmorPoints;
    
    // Distribute armor based on location maximums
    const allocation = {
      head: Math.min(9, Math.floor(availablePoints * 0.05)),
      center_torso: Math.min(Math.floor(unit.mass * 2 * 0.4), Math.floor(availablePoints * 0.25)),
      left_torso: Math.min(Math.floor(unit.mass * 2 * 0.3), Math.floor(availablePoints * 0.15)),
      right_torso: Math.min(Math.floor(unit.mass * 2 * 0.3), Math.floor(availablePoints * 0.15)),
      left_arm: Math.min(Math.floor(unit.mass * 2 * 0.25), Math.floor(availablePoints * 0.1)),
      right_arm: Math.min(Math.floor(unit.mass * 2 * 0.25), Math.floor(availablePoints * 0.1)),
      left_leg: Math.min(Math.floor(unit.mass * 2 * 0.25), Math.floor(availablePoints * 0.1)),
      right_leg: Math.min(Math.floor(unit.mass * 2 * 0.25), Math.floor(availablePoints * 0.1))
    };

    locations.forEach(location => {
      updatedArmorAllocation[location] = {
        front: allocation[location as keyof typeof allocation] || 0,
        rear: location.includes('torso') ? Math.min(Math.floor(allocation[location as keyof typeof allocation] * 0.2), 10) : 0,
        maxArmor: getMaxArmorForLocation(location, unit.mass),
        type: selectedArmorType
      };
    });

    onUnitChange({
      armorAllocation: updatedArmorAllocation
    });
  }, [unit.mass, totalArmorPoints, selectedArmorType, onUnitChange, readOnly]);

  return (
    <div className="armor-tab space-y-8">
      {/* Header */}
      <div className="text-center border-b border-slate-600 pb-4">
        <h2 className="text-2xl font-bold text-slate-100">Armor Configuration</h2>
        <p className="text-slate-400 mt-2">Configure armor type, tonnage, and allocation across all locations</p>
      </div>

      {/* Controls Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Armor Type Selection */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
            Armor Type
          </h3>
          <ArmorTypeSelector
            currentType={selectedArmorType}
            onChange={handleArmorTypeChange}
            disabled={readOnly}
          />
        </div>

        {/* Armor Tonnage Control */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.254 48.254 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.589-1.202L18.75 4.97zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.589-1.202L5.25 4.47z" />
            </svg>
            Tonnage Allocation
          </h3>
          <ArmorTonnageControl
            currentTonnage={armorTonnage}
            maxTonnage={maxTonnage}
            onChange={handleArmorTonnageChange}
            armorType={selectedArmorType}
            disabled={readOnly}
          />
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleMaximizeArmor}
          disabled={readOnly}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          Maximize Armor
        </button>
        <button
          onClick={handleUseRemainingTonnage}
          disabled={readOnly}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          Use Remaining Tonnage
        </button>
        <button
          onClick={handleAutoAllocate}
          disabled={readOnly}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          Auto-Allocate Evenly
        </button>
      </div>

      {/* Armor Distribution Presets Section */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
          Distribution Presets
        </h3>
        <ArmorDistributionPresets
          unit={unit}
          totalArmorPoints={totalArmorPoints}
          onApplyDistribution={handleApplyDistribution}
          disabled={readOnly}
        />
      </div>

      {/* Mech Armor Diagram Section */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
          </svg>
          Interactive Mech Diagram
        </h3>
        <div className="text-sm text-slate-400 mb-4">
          Click on armor locations to edit values directly. Available points: {totalArmorPoints}
        </div>
        <MechArmorDiagram
          unit={unit}
          onArmorChange={handleArmorLocationChange}
          readOnly={readOnly}
        />
      </div>

      {/* Armor Statistics Section */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          Armor Statistics
        </h3>
        <ArmorStatisticsPanel
          unit={unit}
          totalArmorTonnage={armorTonnage}
          onArmorTypeChange={handleArmorTypeChange}
          readOnly={readOnly}
        />
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-4">
          <h4 className="font-medium text-red-400 mb-2">Armor Validation Issues</h4>
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
          For the best experience, use a larger screen to access all armor editing features.
        </p>
      </div>
    </div>
  );
};

export default ArmorTab;
