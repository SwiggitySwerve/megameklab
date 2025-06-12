import React, { useState, useCallback } from 'react';
import { EditableUnit, ArmorType, ARMOR_TYPES } from '../../../types/editor';
import ArmorTypeSelector from '../armor/ArmorTypeSelector';
import ArmorTonnageControl from '../armor/ArmorTonnageControl';
import ArmorStatisticsPanel from '../armor/ArmorStatisticsPanel';

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

  return (
    <div className="structure-armor-tab space-y-6">
      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Controls */}
        <div className="space-y-4">
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

        {/* Right Column - Statistics */}
        <div className="space-y-4">
          {/* Armor Statistics */}
          <ArmorStatisticsPanel
            unit={unit}
            armorType={selectedArmorType}
            totalTonnage={armorTonnage}
            maxTonnage={maxTonnage}
          />
        </div>
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
