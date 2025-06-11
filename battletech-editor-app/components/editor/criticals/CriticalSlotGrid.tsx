import React, { useCallback, useMemo } from 'react';
import { ValidationError } from '../../../types/editor';

interface CriticalSlot {
  slotIndex: number;
  equipment?: any;
  systemType?: string;
  isFixed: boolean;
  isEmpty: boolean;
  placementId?: string;
}

interface CriticalSlotGridProps {
  location: string;
  slots: CriticalSlot[];
  onEquipmentPlacement: (equipmentId: string, location: string, startSlot: number) => void;
  onEquipmentRemoval: (equipmentId: string) => void;
  draggedEquipment: string | null;
  validationErrors?: ValidationError[];
  readOnly?: boolean;
  compact?: boolean;
}

const SYSTEM_COLORS = {
  engine: 'bg-red-100 border-red-300 text-red-800',
  gyro: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  cockpit: 'bg-blue-100 border-blue-300 text-blue-800',
  lifesupport: 'bg-green-100 border-green-300 text-green-800',
  sensors: 'bg-purple-100 border-purple-300 text-purple-800',
  shoulder: 'bg-gray-100 border-gray-300 text-gray-800',
  upper_arm: 'bg-gray-100 border-gray-300 text-gray-800',
  lower_arm: 'bg-gray-100 border-gray-300 text-gray-800',
  hand: 'bg-gray-100 border-gray-300 text-gray-800',
  hip: 'bg-gray-100 border-gray-300 text-gray-800',
  upper_leg: 'bg-gray-100 border-gray-300 text-gray-800',
  lower_leg: 'bg-gray-100 border-gray-300 text-gray-800',
  foot: 'bg-gray-100 border-gray-300 text-gray-800',
};

const SYSTEM_LABELS = {
  engine: 'Engine',
  gyro: 'Gyro',
  cockpit: 'Cockpit',
  lifesupport: 'Life Support',
  sensors: 'Sensors',
  shoulder: 'Shoulder',
  upper_arm: 'Upper Arm',
  lower_arm: 'Lower Arm',
  hand: 'Hand',
  hip: 'Hip',
  upper_leg: 'Upper Leg',
  lower_leg: 'Lower Leg',
  foot: 'Foot',
};

const CriticalSlotGrid: React.FC<CriticalSlotGridProps> = ({
  location,
  slots,
  onEquipmentPlacement,
  onEquipmentRemoval,
  draggedEquipment,
  validationErrors = [],
  readOnly = false,
  compact = true,
}) => {
  // Handle drag over for drop zones
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Handle equipment drop
  const handleDrop = useCallback((e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    if (draggedEquipment && !readOnly) {
      onEquipmentPlacement(draggedEquipment, location, slotIndex);
    }
  }, [draggedEquipment, location, onEquipmentPlacement, readOnly]);

  // Handle equipment removal
  const handleRemoveEquipment = useCallback((placementId: string) => {
    if (!readOnly) {
      onEquipmentRemoval(placementId);
    }
  }, [onEquipmentRemoval, readOnly]);

  // Group consecutive equipment slots
  const equipmentGroups = useMemo(() => {
    const groups: { [placementId: string]: number[] } = {};
    
    slots.forEach(slot => {
      if (slot.placementId) {
        if (!groups[slot.placementId]) {
          groups[slot.placementId] = [];
        }
        groups[slot.placementId].push(slot.slotIndex);
      }
    });

    // Sort slot indices for each group
    Object.keys(groups).forEach(placementId => {
      groups[placementId].sort((a, b) => a - b);
    });

    return groups;
  }, [slots]);

  return (
    <div className="critical-slot-grid bg-white rounded-lg border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          {location} Critical Slots
        </h3>
        <div className="text-xs text-gray-500">
          {slots.filter(s => !s.isEmpty).length} / {slots.length} used
        </div>
      </div>

      {/* Slot Grid */}
      <div className="critical-slots space-y-1">
        {slots.map((slot, index) => {
          const isDropTarget = draggedEquipment && slot.isEmpty && !readOnly;
          const hasValidationError = validationErrors.some(
            error => error.field === `slot-${location}-${slot.slotIndex}`
          );

          // Check if this is the first slot of a multi-slot equipment
          const isFirstEquipmentSlot = slot.placementId && 
            equipmentGroups[slot.placementId] && 
            equipmentGroups[slot.placementId][0] === slot.slotIndex;

          return (
            <div
              key={slot.slotIndex}
              className={`critical-slot h-8 border rounded px-3 py-1 flex items-center justify-between text-xs transition-all ${
                slot.isEmpty
                  ? isDropTarget
                    ? 'border-blue-400 bg-blue-50 border-dashed'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  : slot.systemType
                  ? SYSTEM_COLORS[slot.systemType as keyof typeof SYSTEM_COLORS] || 'bg-gray-100 border-gray-300'
                  : 'bg-blue-50 border-blue-300 text-blue-800'
              } ${hasValidationError ? 'border-red-500 bg-red-50' : ''}`}
              onDragOver={slot.isEmpty ? handleDragOver : undefined}
              onDrop={slot.isEmpty ? (e) => handleDrop(e, slot.slotIndex) : undefined}
            >
              {/* Slot Index */}
              <div className="text-gray-500 font-mono w-6">
                {slot.slotIndex + 1}
              </div>

              {/* Slot Content */}
              <div className="flex-1 text-center">
                {slot.systemType ? (
                  <span className="font-medium">
                    {SYSTEM_LABELS[slot.systemType as keyof typeof SYSTEM_LABELS] || slot.systemType}
                  </span>
                ) : slot.equipment ? (
                  <div className="flex items-center justify-center space-x-2">
                    <span className="font-medium truncate max-w-32">
                      {slot.equipment.name}
                    </span>
                    {isFirstEquipmentSlot && equipmentGroups[slot.placementId!].length > 1 && (
                      <span className="text-xs bg-blue-200 text-blue-800 px-1 rounded">
                        {equipmentGroups[slot.placementId!].length}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">Empty</span>
                )}
              </div>

              {/* Actions */}
              <div className="w-6 flex justify-end">
                {slot.equipment && slot.placementId && !readOnly && (
                  <button
                    onClick={() => handleRemoveEquipment(slot.placementId!)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="Remove equipment"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600 mb-2 font-medium">Legend:</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded"></div>
            <span>Empty Slot</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-50 border border-blue-300 rounded"></div>
            <span>Equipment</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
            <span>Engine</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span>Gyro</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
            <span>Life Support</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
            <span>Actuator</span>
          </div>
        </div>
      </div>

      {/* Drop Instructions */}
      {draggedEquipment && !readOnly && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
          <div className="text-xs text-blue-800">
            Drop equipment onto an empty slot to assign it to this location.
            Multi-slot equipment will occupy consecutive slots.
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.some(error => error.field?.startsWith(`slot-${location}`)) && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
          <div className="text-xs text-red-800">
            {validationErrors
              .filter(error => error.field?.startsWith(`slot-${location}`))
              .map(error => (
                <div key={error.id}>{error.message}</div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CriticalSlotGrid;
