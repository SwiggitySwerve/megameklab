import React, { useState } from 'react';
    import { EquipmentItem } from '../../types/customizer';

    interface EquipmentPickerPanelProps {
      availableEquipment: EquipmentItem[];
      onSelectEquipment: (equipment: EquipmentItem) => void;
      selectedEquipmentId?: string | number | null;
    }

    const EquipmentPickerPanel: React.FC<EquipmentPickerPanelProps> = ({ availableEquipment, onSelectEquipment, selectedEquipmentId }) => {
      const [searchTerm, setSearchTerm] = useState('');

      const filteredEquipment = availableEquipment.filter(eq =>
        eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (eq.internal_id && eq.internal_id.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      return (
        <div className="p-4 border rounded shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Equipment Browser ({availableEquipment.length} items loaded)</h2>
          <input
            type="text"
            placeholder="Search equipment by name or ID..."
            className="w-full p-2 border rounded mb-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="max-h-[600px] overflow-y-auto text-sm">
            {availableEquipment.length === 0 && !searchTerm && <p>Loading equipment or no equipment available...</p>}
            {availableEquipment.length > 0 && filteredEquipment.length === 0 && searchTerm && <p>No equipment matches search term: "{searchTerm}"</p>}
            <ul>
              {filteredEquipment.map((eq) => (
                <li
                  key={eq.id || eq.internal_id}
                  className={`p-1 hover:bg-gray-200 border-b cursor-pointer ${selectedEquipmentId === (eq.id || eq.internal_id) ? 'bg-blue-200 ring-2 ring-blue-500' : 'bg-white'}`}
                  onClick={() => onSelectEquipment(eq)}
                  title={`ID: ${eq.internal_id || 'N/A'}`}
                >
                  <strong>{eq.name}</strong> (T: {eq.tonnage}, C: {eq.critical_slots}, Cat: {eq.category || eq.type})
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    };
    export default EquipmentPickerPanel;
