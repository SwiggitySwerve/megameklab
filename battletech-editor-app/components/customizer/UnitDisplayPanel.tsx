import React from 'react';
    import { CustomizableUnit, UnitEquipmentItem, EquipmentItem } from '../../types/customizer';

    interface UnitDisplayPanelProps {
      selectedUnit: CustomizableUnit | null;
      customizedLoadout: UnitEquipmentItem[];
      availableEquipment: EquipmentItem[];
    }

    const UnitDisplayPanel: React.FC<UnitDisplayPanelProps> = ({ selectedUnit, customizedLoadout, availableEquipment }) => {
      if (!selectedUnit) {
        return <div className="p-4 border rounded shadow-sm">Loading unit information...</div>;
      }

      const currentEquipmentWeight = customizedLoadout.reduce((sum, loadoutItem) => {
        const equipmentDetails = availableEquipment.find(eq => eq.internal_id === loadoutItem.item_name || eq.name === loadoutItem.item_name);
        return sum + (equipmentDetails?.tonnage || 0);
      }, 0);

      return (
        <div className="p-4 border rounded shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Unit Information: {selectedUnit.chassis} {selectedUnit.model}</h2>
          <p>Type: {selectedUnit.data?.type || selectedUnit.type} ({selectedUnit.data?.config})</p>
          <p>Mass (Equipment Only): {currentEquipmentWeight.toFixed(2)} / {selectedUnit.mass} tons <em className="text-xs">(Base chassis weight not yet included)</em></p>
          <p>Tech Base: {selectedUnit.data?.tech_base}</p>
          <p>Era: {selectedUnit.data?.era}</p>

          <h3 className="text-lg font-semibold mt-3 mb-1">Movement:</h3>
          <p>
            Walk: {selectedUnit.data?.movement?.walk_mp ?? 'N/A'} MP,
            Run: {selectedUnit.data?.movement?.run_mp ?? 'N/A'} MP,
            Jump: {selectedUnit.data?.movement?.jump_mp ?? 'N/A'} MP
          </p>

          <h3 className="text-lg font-semibold mt-3 mb-1">Current Loadout (Count: {customizedLoadout.length}):</h3>
          {customizedLoadout.length === 0 ? (
            <p>No equipment mounted.</p>
          ) : (
            <ul className="list-disc pl-5 text-sm max-h-40 overflow-y-auto">
              {customizedLoadout.map((item, index) => (
                <li key={index}>{item.item_name} ({item.item_type}) - {item.location}</li>
              ))}
            </ul>
          )}
        </div>
      );
    };
    export default UnitDisplayPanel;
