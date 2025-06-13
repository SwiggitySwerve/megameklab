import React, { useState, useCallback } from 'react';
import { EditableUnit, ArmorType, ARMOR_TYPES } from '../../../types/editor';
import ArmorTypeSelector from '../armor/ArmorTypeSelector';
import ArmorTonnageControl from '../armor/ArmorTonnageControl';
import ArmorStatisticsPanel from '../armor/ArmorStatisticsPanel';
import MechArmorDiagram from '../armor/MechArmorDiagram';

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
