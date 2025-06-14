import React, { useState } from 'react';
import { CustomizableUnit, UnitEquipmentItem, EquipmentItem } from '../../types/customizer';
import { UnitDisplayOptions } from '../../types/unitDisplay';
import UnitDisplay from './UnitDisplay';

interface UnitDisplayDemoProps {
  unit: CustomizableUnit;
  loadout: UnitEquipmentItem[];
  availableEquipment: EquipmentItem[];
}

const UnitDisplayDemo: React.FC<UnitDisplayDemoProps> = ({ 
  unit, 
  loadout, 
  availableEquipment 
}) => {
  const [displayOptions, setDisplayOptions] = useState<UnitDisplayOptions>({
    showBasicInfo: true,
    showMovement: true,
    showArmor: true,
    showStructure: true,
    showHeatManagement: true,
    showEquipmentSummary: true,
    showCriticalSlotSummary: true,
    showBuildRecommendations: true,
    showTechnicalSpecs: true,
    showFluffText: false,
    compact: false,
    interactive: true
  });

  const handleRecommendationAction = (recommendationId: string, action: string) => {
    console.log(`Recommendation action: ${action} for ${recommendationId}`);
    // This would integrate with the actual customization system
  };

  const toggleOption = (option: keyof UnitDisplayOptions) => {
    setDisplayOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Display Options Controls */}
      <div className="p-4 border rounded shadow-sm bg-gray-50">
        <h3 className="text-lg font-semibold mb-3">Display Options</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(displayOptions).map(([key, value]) => (
            <label key={key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={() => toggleOption(key as keyof UnitDisplayOptions)}
                className="rounded"
              />
              <span className="text-sm capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </label>
          ))}
        </div>
      </div>
      {/* Demo: Full Display */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Full Unit Display</h3>
        <UnitDisplay
          unit={unit}
          loadout={loadout}
          availableEquipment={availableEquipment}
          options={displayOptions}
          onRecommendationAction={handleRecommendationAction}
          className="border-2 border-blue-200"
        />
      </div>
      {/* Demo: Compact Display */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Compact Unit Display</h3>
        <UnitDisplay
          unit={unit}
          loadout={loadout}
          availableEquipment={availableEquipment}
          options={{ ...displayOptions, compact: true }}
          className="border-2 border-green-200"
        />
      </div>
      {/* Demo: Basic Info Only */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Basic Info Only</h3>
        <UnitDisplay
          unit={unit}
          loadout={loadout}
          availableEquipment={availableEquipment}
          options={{
            showBasicInfo: true,
            showMovement: true,
            compact: false,
            interactive: false
          }}
          className="border-2 border-purple-200"
        />
      </div>
    </div>
  );
};

export default UnitDisplayDemo;
