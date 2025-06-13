import React, { useState, useCallback } from 'react';
import { EditableUnit, ArmorType, ARMOR_TYPES } from '../../../types/editor';
import ArmorTypeSelector from '../armor/ArmorTypeSelector';
import ArmorTonnageControl from '../armor/ArmorTonnageControl';
import ArmorStatisticsPanel from '../armor/ArmorStatisticsPanel';
import MechArmorDiagram from '../armor/MechArmorDiagram';
import ArmorDistributionPresets from '../armor/ArmorDistributionPresets';
import { maximizeArmor, useRemainingTonnageForArmor, autoAllocateArmor } from '../../../utils/armorAllocation';

interface StructureArmorTabProps {
  unit: EditableUnit;
  onUnitChange: (updates: Partial<EditableUnit>) => void;
  validationErrors?: any[];
  readOnly?: boolean;
}

const StructureArmorTab: React.FC<StructureArmorTabProps> = ({
  unit,
  onUnitChange,
  validationErrors = [],
  readOnly = false,
}) => {
  // State management
  const [selectedArmorType, setSelectedArmorType] = useState<ArmorType>(
    ARMOR_TYPES.find(type => type.id === 'standard') || ARMOR_TYPES[0]
  );
  const [armorTonnage, setArmorTonnage] = useState<number>(0);

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
        ...unit.armorAllocation[location],
        front,
        rear: rear || 0
      }
    };

    onUnitChange({
      armorAllocation: updatedArmorAllocation
    });
  }, [unit.armorAllocation, onUnitChange, readOnly]);

  // Calculate max armor for location
  const getMaxArmorForLocation = (location: string, mass: number): number => {
    switch (location) {
      case 'Head':
        return mass > 100 ? 12 : 9;
      case 'Center Torso':
        return Math.floor(mass * 2 * 0.4);
      case 'Left Torso':
      case 'Right Torso':
        return Math.floor(mass * 2 * 0.3);
      case 'Left Arm':
      case 'Right Arm':
      case 'Left Leg':
      case 'Right Leg':
        return Math.floor(mass * 2 * 0.25);
      default:
        return Math.floor(mass * 2 * 0.2);
    }
  };

  // Handle applying armor distribution from presets
  const handleApplyDistribution = useCallback((distribution: any) => {
    if (readOnly) return;

    // Build updated armor allocation with all required properties
    const locations = ['Head', 'Center Torso', 'Left Torso', 'Right Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg'];
    const updatedArmorAllocation: { [key: string]: any } = {};

    locations.forEach(location => {
      updatedArmorAllocation[location] = {
        front: distribution[location].front,
        rear: distribution[location].rear,
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
  }, [unit, selectedArmorType, handleApplyDistribution, readOnly]);

  // Handle use remaining tonnage
  const handleUseRemainingTonnage = useCallback(() => {
    if (readOnly) return;
    
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
  }, [unit, selectedArmorType, handleApplyDistribution, readOnly]);

  return (
    <div className="structure-armor-tab space-y-6">
      {/* Controls Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Armor Type Selection */}
        <ArmorTypeSelector
          currentType={selectedArmorType}
          onChange={handleArmorTypeChange}
          disabled={readOnly}
        />

        {/* Armor Tonnage Control */}
        <ArmorTonnageControl
          currentTonnage={armorTonnage}
          maxTonnage={maxTonnage}
          onChange={handleArmorTonnageChange}
          armorType={selectedArmorType}
          disabled={readOnly}
        />
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-3 mt-4">
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
      </div>

      {/* Armor Distribution Presets Section */}
      <div className="mt-6">
        <ArmorDistributionPresets
          unit={unit}
          totalArmorPoints={totalArmorPoints}
          onApplyDistribution={handleApplyDistribution}
          disabled={readOnly}
        />
      </div>

      {/* Mech Armor Diagram Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Interactive Mech Diagram</h3>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <MechArmorDiagram
            unit={unit}
            onArmorChange={handleArmorLocationChange}
            readOnly={readOnly}
          />
        </div>
      </div>

      {/* Armor Statistics Section */}
      <div className="mt-8">
        <ArmorStatisticsPanel
          unit={unit}
          armorType={selectedArmorType}
          totalTonnage={armorTonnage}
          maxTonnage={maxTonnage}
        />
      </div>

      {/* Mobile Responsive Note */}
      <div className="lg:hidden mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
        <p className="text-xs text-blue-300">
          For the best experience, use a larger screen to access all armor editing features.
        </p>
      </div>
    </div>
  );
};

export default StructureArmorTab;
