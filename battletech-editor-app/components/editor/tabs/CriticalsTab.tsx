import React, { useState, useCallback, useMemo } from 'react';
import { EditorComponentProps, MECH_LOCATIONS } from '../../../types/editor';
import CriticalSlotGrid from '../criticals/CriticalSlotGrid';

const CriticalsTab: React.FC<EditorComponentProps> = ({
  unit,
  onUnitChange,
  validationErrors = [],
  readOnly = false,
  compact = true,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string>(MECH_LOCATIONS.CENTER_TORSO);
  const [draggedEquipment, setDraggedEquipment] = useState<string | null>(null);

  // Available locations for mech configuration
  const availableLocations = useMemo(() => {
    const locations = [
      MECH_LOCATIONS.HEAD,
      MECH_LOCATIONS.CENTER_TORSO,
      MECH_LOCATIONS.LEFT_TORSO,
      MECH_LOCATIONS.RIGHT_TORSO,
      MECH_LOCATIONS.LEFT_ARM,
      MECH_LOCATIONS.RIGHT_ARM,
      MECH_LOCATIONS.LEFT_LEG,
      MECH_LOCATIONS.RIGHT_LEG,
    ];

    // Filter based on mech type if needed
    return locations;
  }, [unit.data?.config]);

  // Get critical slots for each location
  const criticalSlotsByLocation = useMemo(() => {
    const slots: { [location: string]: any[] } = {};
    
    availableLocations.forEach(location => {
      // Initialize with empty slots (12 for most locations, 6 for head)
      const slotCount = location === MECH_LOCATIONS.HEAD ? 6 : 12;
      slots[location] = Array(slotCount).fill(null).map((_, index) => ({
        slotIndex: index,
        equipment: null,
        systemType: null,
        isFixed: false,
        isEmpty: true,
      }));

      // Add system criticals
      if (location === MECH_LOCATIONS.HEAD) {
        slots[location][0] = { slotIndex: 0, systemType: 'lifesupport', isFixed: true, isEmpty: false };
        slots[location][1] = { slotIndex: 1, systemType: 'sensors', isFixed: true, isEmpty: false };
        slots[location][2] = { slotIndex: 2, systemType: 'cockpit', isFixed: true, isEmpty: false };
        slots[location][4] = { slotIndex: 4, systemType: 'sensors', isFixed: true, isEmpty: false };
        slots[location][5] = { slotIndex: 5, systemType: 'lifesupport', isFixed: true, isEmpty: false };
      } else if (location === MECH_LOCATIONS.CENTER_TORSO) {
        // Engine criticals (varies by engine rating)
        const engineSlots = Math.min(6, Math.floor((unit.data?.engine?.rating || 250) / 25));
        for (let i = 0; i < engineSlots; i++) {
          if (i < 3) {
            slots[location][i] = { slotIndex: i, systemType: 'engine', isFixed: true, isEmpty: false };
          }
          if (i >= 3 && slots[location][11 - (i - 3)]) {
            slots[location][11 - (i - 3)] = { slotIndex: 11 - (i - 3), systemType: 'engine', isFixed: true, isEmpty: false };
          }
        }
        // Gyro
        slots[location][3] = { slotIndex: 3, systemType: 'gyro', isFixed: true, isEmpty: false };
        slots[location][4] = { slotIndex: 4, systemType: 'gyro', isFixed: true, isEmpty: false };
        slots[location][5] = { slotIndex: 5, systemType: 'gyro', isFixed: true, isEmpty: false };
        slots[location][6] = { slotIndex: 6, systemType: 'gyro', isFixed: true, isEmpty: false };
      } else if (location === MECH_LOCATIONS.LEFT_ARM || location === MECH_LOCATIONS.RIGHT_ARM) {
        // Arm actuators
        slots[location][0] = { slotIndex: 0, systemType: 'shoulder', isFixed: true, isEmpty: false };
        slots[location][1] = { slotIndex: 1, systemType: 'upper_arm', isFixed: true, isEmpty: false };
        slots[location][2] = { slotIndex: 2, systemType: 'lower_arm', isFixed: true, isEmpty: false };
        slots[location][3] = { slotIndex: 3, systemType: 'hand', isFixed: true, isEmpty: false };
      } else if (location === MECH_LOCATIONS.LEFT_LEG || location === MECH_LOCATIONS.RIGHT_LEG) {
        // Leg actuators
        slots[location][0] = { slotIndex: 0, systemType: 'hip', isFixed: true, isEmpty: false };
        slots[location][1] = { slotIndex: 1, systemType: 'upper_leg', isFixed: true, isEmpty: false };
        slots[location][2] = { slotIndex: 2, systemType: 'lower_leg', isFixed: true, isEmpty: false };
        slots[location][3] = { slotIndex: 3, systemType: 'foot', isFixed: true, isEmpty: false };
      }

      // Add placed equipment
      (unit.equipmentPlacements || []).forEach(placement => {
        if (placement.location === location && placement.criticalSlots) {
          placement.criticalSlots.forEach(slotIndex => {
            if (slots[location][slotIndex] && slots[location][slotIndex].isEmpty) {
              slots[location][slotIndex] = {
                slotIndex,
                equipment: placement.equipment,
                systemType: null,
                isFixed: false,
                isEmpty: false,
                placementId: placement.id,
              };
            }
          });
        }
      });
    });

    return slots;
  }, [unit.equipmentPlacements, unit.data?.engine?.rating, availableLocations]);

  // Handle equipment placement in critical slots
  const handleEquipmentPlacement = useCallback((
    equipmentId: string, 
    targetLocation: string, 
    startSlot: number
  ) => {
    const equipment = (unit.equipmentPlacements || []).find(p => p.id === equipmentId);
    if (!equipment) return;

    const slotsNeeded = equipment.equipment.space || 1;
    const locationSlots = criticalSlotsByLocation[targetLocation];
    
    // Check if there's enough space
    const availableSlots: number[] = [];
    for (let i = startSlot; i < Math.min(startSlot + slotsNeeded, locationSlots.length); i++) {
      if (locationSlots[i] && locationSlots[i].isEmpty) {
        availableSlots.push(i);
      } else {
        // Can't place here
        return;
      }
    }

    if (availableSlots.length < slotsNeeded) return;

    // Update equipment placement
    const updatedPlacements = (unit.equipmentPlacements || []).map(p => 
      p.id === equipmentId 
        ? { ...p, location: targetLocation, criticalSlots: availableSlots }
        : p
    );

    onUnitChange({
      ...unit,
      equipmentPlacements: updatedPlacements,
    });
  }, [unit, criticalSlotsByLocation, onUnitChange]);

  // Handle equipment removal from critical slots
  const handleEquipmentRemoval = useCallback((equipmentId: string) => {
    const updatedPlacements = (unit.equipmentPlacements || []).map(p => 
      p.id === equipmentId 
        ? { ...p, location: 'unallocated', criticalSlots: [] }
        : p
    );

    onUnitChange({
      ...unit,
      equipmentPlacements: updatedPlacements,
    });
  }, [unit, onUnitChange]);

  // Get unallocated equipment for assignment
  const unallocatedEquipment = (unit.equipmentPlacements || []).filter(
    placement => !placement.location || placement.location === 'unallocated'
  );

  return (
    <div className="criticals-tab">
      <div className="grid grid-cols-4 gap-4 max-w-7xl">
        {/* Left Column - Location Selector */}
        <div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Mech Locations
            </h3>
            <div className="space-y-1">
              {availableLocations.map(location => {
                const slots = criticalSlotsByLocation[location];
                const usedSlots = slots?.filter(slot => !slot.isEmpty).length || 0;
                const totalSlots = slots?.length || 0;
                const isSelected = selectedLocation === location;

                return (
                  <button
                    key={location}
                    onClick={() => setSelectedLocation(location)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      isSelected
                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                        : 'hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{location}</span>
                      <span className={`text-xs ${
                        usedSlots === totalSlots ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {usedSlots}/{totalSlots}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unallocated Equipment */}
          <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Unallocated Equipment
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {unallocatedEquipment.map(placement => (
                <div
                  key={placement.id}
                  draggable={!readOnly}
                  onDragStart={() => setDraggedEquipment(placement.id)}
                  onDragEnd={() => setDraggedEquipment(null)}
                  className={`p-2 border border-gray-200 rounded bg-gray-50 cursor-move transition-colors ${
                    draggedEquipment === placement.id ? 'opacity-50' : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">
                    {placement.equipment.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {placement.equipment.space} slot{placement.equipment.space !== 1 ? 's' : ''} • {placement.equipment.weight}t
                  </div>
                </div>
              ))}

              {unallocatedEquipment.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  All equipment allocated
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Column - Critical Slot Grid */}
        <div className="col-span-2">
          <CriticalSlotGrid
            location={selectedLocation}
            slots={criticalSlotsByLocation[selectedLocation] || []}
            onEquipmentPlacement={handleEquipmentPlacement}
            onEquipmentRemoval={handleEquipmentRemoval}
            draggedEquipment={draggedEquipment}
            validationErrors={validationErrors}
            readOnly={readOnly}
            compact={compact}
          />
        </div>

        {/* Right Column - Location Summary & Actions */}
        <div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              {selectedLocation} Summary
            </h3>
            
            {criticalSlotsByLocation[selectedLocation] && (
              <div className="space-y-3">
                {/* Slot utilization */}
                <div className="text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Slot Usage:</span>
                    <span className="font-medium">
                      {criticalSlotsByLocation[selectedLocation].filter(s => !s.isEmpty).length} / {criticalSlotsByLocation[selectedLocation].length}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${(criticalSlotsByLocation[selectedLocation].filter(s => !s.isEmpty).length / criticalSlotsByLocation[selectedLocation].length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Equipment in this location */}
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-2">Equipment:</div>
                  <div className="space-y-1">
                    {(unit.equipmentPlacements || [])
                      .filter(p => p.location === selectedLocation)
                      .map(placement => (
                        <div key={placement.id} className="text-xs bg-gray-50 p-2 rounded">
                          <div className="font-medium">{placement.equipment.name}</div>
                          <div className="text-gray-600">
                            Slots: {placement.criticalSlots?.join(', ') || 'None'}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Quick Actions */}
                {!readOnly && (
                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => {
                        // Clear all non-fixed equipment from this location
                        const updatedPlacements = (unit.equipmentPlacements || []).map(p => 
                          p.location === selectedLocation 
                            ? { ...p, location: 'unallocated', criticalSlots: [] }
                            : p
                        );
                        onUnitChange({ ...unit, equipmentPlacements: updatedPlacements });
                      }}
                      className="w-full px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Clear Location
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implement auto-assign for this location
                        console.log('Auto-assign to', selectedLocation);
                      }}
                      className="w-full px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Auto-Assign
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-800">
              <div className="font-medium mb-1">Instructions:</div>
              <ul className="space-y-1">
                <li>• Drag equipment from the unallocated list</li>
                <li>• Drop onto available critical slots</li>
                <li>• Multi-slot equipment spans consecutive slots</li>
                <li>• System criticals cannot be moved</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriticalsTab;
