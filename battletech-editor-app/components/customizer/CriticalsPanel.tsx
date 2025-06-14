// battletech-editor-app/components/customizer/CriticalsPanel.tsx
import React from 'react';
import { CriticalLocation, EquipmentToRemoveDetails } from '../../types/customizer';
import { CriticalSlotItem } from '../../types';

interface CriticalsPanelProps {
  customizedCriticals: CriticalLocation[];
  unitType?: string;
  unitConfig?: string;
  onSelectSlot: (location: string, slotIndex: number, slot: CriticalSlotItem) => void;
  targetLocation?: string | null;
  targetSlotIndex?: number | null;
  equipmentToRemoveDetails?: EquipmentToRemoveDetails | null;
}

const CriticalsPanel: React.FC<CriticalsPanelProps> = ({
  customizedCriticals,
  unitType,
  unitConfig,
  onSelectSlot,
  targetLocation,
  targetSlotIndex,
  equipmentToRemoveDetails, // Destructure new prop
}) => {
  const battleMechLocationOrder = [
    "Head", "Center Torso", "Left Torso", "Right Torso",
    "Left Arm", "Right Arm", "Left Leg", "Right Leg"
  ];

  // Sort critical locations based on the defined order for consistent display
  const sortedCriticals = [...customizedCriticals].sort((a, b) => {
    const indexA = battleMechLocationOrder.indexOf(a.location);
    const indexB = battleMechLocationOrder.indexOf(b.location);
    if (indexA === -1 && indexB === -1) return a.location.localeCompare(b.location); // both not in order, sort alphabetically
    if (indexA === -1) return 1; // a not in order, b is: b comes first
    if (indexB === -1) return -1; // b not in order, a is: a comes first
    return indexA - indexB;
  });

  // No local handleSlotClick needed anymore, will call onSelectSlot from props directly

  if (!customizedCriticals || customizedCriticals.length === 0) {
    return (
      <div className="p-4 border rounded shadow-sm mt-4">
        <h2 className="text-xl font-semibold mb-2">Critical Slots Viewer ({unitType} - {unitConfig})</h2>
        <p>No critical slot data for this unit, or unit does not use standard critical slots.</p>
      </div>
    );
  }

  // Determine grid columns based on number of locations, aiming for a balanced layout
  // For BattleMechs (typically 8 locations), 4 columns might be good.
  const gridColsClass = sortedCriticals.length <= 4 ? `grid-cols-${sortedCriticals.length || 1}` : 'md:grid-cols-3 lg:grid-cols-4';


  return (
    <div className="p-4 border rounded shadow-sm mt-4">
      <h2 className="text-xl font-semibold mb-2">Critical Slots ({unitType} - {unitConfig})</h2>
      <div className={`grid grid-cols-2 ${gridColsClass} gap-3 text-xs`}>
        {sortedCriticals.map((loc) => (
          <div key={loc.location} className="p-2 border rounded bg-gray-50 shadow">
            <h3 className="font-bold text-sm mb-1 text-center text-gray-700">{loc.location}</h3>
            <ul className="space-y-1">
              {loc.slots.map((slotItem, index) => {
                // Handle both string and object formats during transition
                const slot: CriticalSlotItem = typeof slotItem === 'object' && slotItem ? slotItem : {
                  index,
                  name: typeof slotItem === 'string' ? slotItem : '-Empty-',
                  type: 'empty',
                  isFixed: false,
                  isManuallyPlaced: false
                };
                
                const isEmpty = slot.type === 'empty' || slot.name === '-Empty-' || slot.name === '- Empty -';
                const isTargetedForAdd = loc.location === targetLocation && index === targetSlotIndex;

                let isSelectedForRemoval = false;
                if (equipmentToRemoveDetails && loc.location === equipmentToRemoveDetails.location) {
                  if (index >= equipmentToRemoveDetails.startIndex && index < equipmentToRemoveDetails.startIndex + equipmentToRemoveDetails.count) {
                    isSelectedForRemoval = true;
                  }
                }

                return (
                  <li
                    key={index}
                    className={`p-1.5 border text-center rounded cursor-pointer ${
                      isSelectedForRemoval ? 'ring-2 ring-red-500 bg-red-100' :
                      isTargetedForAdd && isEmpty ? 'ring-2 ring-green-500 bg-green-100' :
                      isEmpty ? 'bg-gray-200 text-gray-500 hover:bg-gray-300 hover:ring-2 hover:ring-green-400' :
                      'bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium'
                    }`}
                    title={`${loc.location} - Slot ${index + 1}: ${slot.name}`}
                    onClick={() => onSelectSlot(loc.location, index, slot)}
                  >
                    {`${index + 1}: ${slot.name || '-Empty-'}`}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CriticalsPanel;
