import React from 'react';

interface CriticalSlot {
  slotIndex: number;
  equipment: any;
  systemType: string | null;
  isFixed: boolean;
  isEmpty: boolean;
  placementId?: string;
}

interface MechCriticalsDiagramProps {
  criticalSlotsByLocation: { [location: string]: CriticalSlot[] };
  onSlotClick?: (location: string, slotIndex: number) => void;
  onSlotDrop?: (location: string, slotIndex: number, equipmentId: string) => void;
  draggedEquipment?: string | null;
  readOnly?: boolean;
}

const MechCriticalsDiagram: React.FC<MechCriticalsDiagramProps> = ({
  criticalSlotsByLocation,
  onSlotClick,
  onSlotDrop,
  draggedEquipment,
  readOnly = false,
}) => {
  // Render a single critical slot
  const renderSlot = (location: string, slot: CriticalSlot, index: number) => {
    const isDropTarget = !readOnly && !slot.isFixed && slot.isEmpty && draggedEquipment;
    
    return (
      <div
        key={index}
        className={`
          h-7 px-2 flex items-center text-xs border-b border-slate-600 
          ${slot.isFixed ? 'bg-slate-700' : 'bg-slate-800'}
          ${slot.isEmpty && !slot.isFixed ? 'text-slate-500' : 'text-slate-100'}
          ${isDropTarget ? 'hover:bg-slate-600 cursor-pointer' : ''}
          ${!readOnly && !slot.isFixed ? 'hover:bg-slate-700' : ''}
        `}
        onClick={() => !readOnly && onSlotClick?.(location, index)}
        onDragOver={(e) => {
          if (isDropTarget) {
            e.preventDefault();
            e.currentTarget.classList.add('bg-slate-600');
          }
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove('bg-slate-600');
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('bg-slate-600');
          if (isDropTarget && draggedEquipment) {
            onSlotDrop?.(location, index, draggedEquipment);
          }
        }}
      >
        {slot.systemType ? (
          <span className="font-medium">
            {slot.systemType === 'lifesupport' && 'Life Support'}
            {slot.systemType === 'sensors' && 'Sensors'}
            {slot.systemType === 'cockpit' && 'Cockpit'}
            {slot.systemType === 'engine' && 'Engine'}
            {slot.systemType === 'gyro' && 'Gyro'}
            {slot.systemType === 'shoulder' && 'Shoulder'}
            {slot.systemType === 'upper_arm' && 'Upper Arm Actuator'}
            {slot.systemType === 'lower_arm' && 'Lower Arm Actuator'}
            {slot.systemType === 'hand' && 'Hand Actuator'}
            {slot.systemType === 'hip' && 'Hip'}
            {slot.systemType === 'upper_leg' && 'Upper Leg Actuator'}
            {slot.systemType === 'lower_leg' && 'Lower Leg Actuator'}
            {slot.systemType === 'foot' && 'Foot Actuator'}
          </span>
        ) : slot.equipment ? (
          <span>{slot.equipment.name}</span>
        ) : (
          <span className="italic">- Empty -</span>
        )}
      </div>
    );
  };

  // Render a location box
  const renderLocation = (locationName: string, slots: CriticalSlot[], width: string = 'w-40') => {
    return (
      <div className={`${width} bg-slate-800 border border-slate-600 rounded`}>
        <div className="bg-slate-700 px-2 py-1 text-xs font-medium text-slate-100 border-b border-slate-600">
          {locationName}
        </div>
        <div className="divide-y divide-slate-700">
          {slots.map((slot, index) => renderSlot(locationName, slot, index))}
        </div>
      </div>
    );
  };

  return (
    <div className="mech-criticals-diagram bg-slate-900 p-4 rounded-lg">
      {/* Controls */}
      <div className="flex justify-center gap-2 mb-4">
        <button className="px-3 py-1 text-xs bg-slate-700 text-slate-100 rounded hover:bg-slate-600">
          Auto Fill Unhhittables
        </button>
        <button className="px-3 py-1 text-xs bg-slate-700 text-slate-100 rounded hover:bg-slate-600">
          Auto Compact
        </button>
        <button className="px-3 py-1 text-xs bg-slate-700 text-slate-100 rounded hover:bg-slate-600">
          Auto Sort
        </button>
        <div className="border-l border-slate-600 mx-2" />
        <button className="px-3 py-1 text-xs bg-slate-700 text-slate-100 rounded hover:bg-slate-600">
          Fill
        </button>
        <button className="px-3 py-1 text-xs bg-slate-700 text-slate-100 rounded hover:bg-slate-600">
          Compact
        </button>
        <button className="px-3 py-1 text-xs bg-slate-700 text-slate-100 rounded hover:bg-slate-600">
          Sort
        </button>
        <div className="border-l border-slate-600 mx-2" />
        <button className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">
          Reset
        </button>
      </div>

      {/* Mech Diagram */}
      <div className="grid grid-cols-3 gap-3 max-w-3xl mx-auto">
        {/* Row 1: Head */}
        <div className="col-start-2">
          {renderLocation('Head', criticalSlotsByLocation['Head'] || [])}
        </div>

        {/* Row 2: Arms and Torsos */}
        <div className="contents">
          {renderLocation('Left Arm', criticalSlotsByLocation['Left Arm'] || [])}
          
          <div className="space-y-3">
            {renderLocation('Left Torso', criticalSlotsByLocation['Left Torso'] || [])}
            {renderLocation('Center Torso', criticalSlotsByLocation['Center Torso'] || [])}
            {renderLocation('Right Torso', criticalSlotsByLocation['Right Torso'] || [])}
          </div>
          
          {renderLocation('Right Arm', criticalSlotsByLocation['Right Arm'] || [])}
        </div>

        {/* Row 3: Legs */}
        <div className="contents">
          <div className="col-start-2 grid grid-cols-2 gap-3">
            {renderLocation('Left Leg', criticalSlotsByLocation['Left Leg'] || [], 'w-full')}
            {renderLocation('Right Leg', criticalSlotsByLocation['Right Leg'] || [], 'w-full')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MechCriticalsDiagram;
