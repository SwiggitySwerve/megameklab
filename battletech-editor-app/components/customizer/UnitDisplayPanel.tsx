import React from 'react';
import { CustomizableUnit, UnitEquipmentItem, EquipmentItem } from '../../types/customizer';
import { UnitDisplayOptions } from '../../types/unitDisplay';
import UnitDisplay from '../common/UnitDisplay';

interface UnitDisplayPanelProps {
  selectedUnit: CustomizableUnit | null;
  customizedLoadout: UnitEquipmentItem[];
  availableEquipment: EquipmentItem[];
  options?: UnitDisplayOptions;
}

const UnitDisplayPanel: React.FC<UnitDisplayPanelProps> = ({ 
  selectedUnit, 
  customizedLoadout, 
  availableEquipment,
  options
}) => {
  // Default options for the customizer panel - show comprehensive information
  const defaultOptions: UnitDisplayOptions = {
    showBasicInfo: true,
    showMovement: true,
    showArmor: true,
    showStructure: true,
    showHeatManagement: true,
    showEquipmentSummary: true,
    showCriticalSlotSummary: true,
    showBuildRecommendations: true,
    showTechnicalSpecs: false, // Can be enabled if needed
    showFluffText: false,
    compact: false,
    interactive: true
  };

  const finalOptions = { ...defaultOptions, ...options };

  return (
    <UnitDisplay
      unit={selectedUnit}
      loadout={customizedLoadout}
      availableEquipment={availableEquipment}
      options={finalOptions}
      className="space-y-4"
    />
  );
};

export default UnitDisplayPanel;
