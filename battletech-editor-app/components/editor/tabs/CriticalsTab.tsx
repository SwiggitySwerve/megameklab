import React, { useState, useCallback, useMemo } from 'react';
import { EditorComponentProps } from '../../../types/editor';
import CriticalSlotGrid from '../criticals/CriticalSlotGrid';
import { EQUIPMENT_DATABASE } from '../../../utils/equipmentData';

const MECH_LOCATIONS = {
  HEAD: 'Head',
  CENTER_TORSO: 'Center Torso',
  LEFT_TORSO: 'Left Torso',
  RIGHT_TORSO: 'Right Torso',
  LEFT_ARM: 'Left Arm',
  RIGHT_ARM: 'Right Arm',
  LEFT_LEG: 'Left Leg',
  RIGHT_LEG: 'Right Leg',
};

const CriticalsTab: React.FC<EditorComponentProps> = ({
  unit,
  onUnitChange,
  validationErrors = [],
  readOnly = false,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string>(MECH_LOCATIONS.CENTER_TORSO);
  const [draggedEquipment, setDraggedEquipment] = useState<string | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<{location: string, index: number} | null>(null);

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

      // Add placed equipment from weapons_and_equipment
      (unit.data?.weapons_and_equipment || []).forEach((item, index) => {
        if (item.location === location) {
          const equipment = EQUIPMENT_DATABASE.find(e => e.name === item.item_name);
          if (equipment) {
            const slotsNeeded = equipment.crits || 1;
            // Find consecutive empty slots
            for (let i = 0; i <= slots[location].length - slotsNeeded; i++) {
              let canPlace = true;
              for (let j = 0; j < slotsNeeded; j++) {
                if (!slots[location][i + j]?.isEmpty) {
                  canPlace = false;
                  break;
                }
              }
              if (canPlace) {
                // Place equipment in slots
                for (let j = 0; j < slotsNeeded; j++) {
                  slots[location][i + j] = {
                    slotIndex: i + j,
                    equipment: { 
                      name: item.item_name,
                      index: index,
                      slots: slotsNeeded,
                      currentSlot: j + 1
                    },
                    systemType: null,
                    isFixed: false,
                    isEmpty: false,
                    placementId: index.toString(), // Add placement ID for removal
                  };
                }
                break;
              }
            }
          }
        }
      });
    });

    return slots;
  }, [unit.data?.weapons_and_equipment, unit.data?.engine?.rating, availableLocations]);

  // Handle equipment placement in critical slots
  const handleEquipmentPlacement = useCallback((
    equipmentIndex: string, 
    targetLocation: string, 
    startSlot: number
  ) => {
    const index = parseInt(equipmentIndex);
    const equipment = unit.data?.weapons_and_equipment?.[index];
    if (!equipment || equipment.location !== 'Unallocated') return;

    const equipmentData = EQUIPMENT_DATABASE.find(e => e.name === equipment.item_name);
    if (!equipmentData) return;

    const slotsNeeded = equipmentData.crits || 1;
    const locationSlots = criticalSlotsByLocation[targetLocation];
    
    // Check if there's enough consecutive empty slots
    const availableSlots: number[] = [];
    for (let i = startSlot; i < Math.min(startSlot + slotsNeeded, locationSlots.length); i++) {
      if (locationSlots[i] && locationSlots[i].isEmpty && !locationSlots[i].isFixed) {
        availableSlots.push(i);
      } else {
        // Can't place here - not enough consecutive slots
        return;
      }
    }

    if (availableSlots.length < slotsNeeded) return;

    // Update equipment location
    const updatedEquipment = [...(unit.data?.weapons_and_equipment || [])];
    updatedEquipment[index] = {
      ...updatedEquipment[index],
      location: targetLocation
    };

    const updatedUnit = {
      ...unit,
      data: {
        ...unit.data,
        weapons_and_equipment: updatedEquipment,
      },
    };
    
    onUnitChange(updatedUnit);
  }, [unit, criticalSlotsByLocation, onUnitChange]);

  // Handle equipment removal from critical slots
  const handleEquipmentRemoval = useCallback((equipmentId: string) => {
    // The equipmentId is the index as a string
    const index = parseInt(equipmentId);
    const updatedEquipment = [...(unit.data?.weapons_and_equipment || [])];
    
    if (!isNaN(index) && updatedEquipment[index]) {
      updatedEquipment[index] = {
        ...updatedEquipment[index],
        location: 'Unallocated'
      };

      const updatedUnit = {
        ...unit,
        data: {
          ...unit.data,
          weapons_and_equipment: updatedEquipment,
        },
      };
      
      onUnitChange(updatedUnit);
    }
  }, [unit, onUnitChange]);

  // Get unallocated equipment for assignment
  const unallocatedEquipment = (unit.data?.weapons_and_equipment || [])
    .filter(item => item.location === 'Unallocated')
    .map((item, index) => {
      const equipment = EQUIPMENT_DATABASE.find(e => e.name === item.item_name);
      return {
        name: item.item_name,
        index: index,
        crits: equipment?.crits || 1,
        weight: equipment?.weight || 0,
      };
    });

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
              {unallocatedEquipment.map((item, idx) => (
                <div
                  key={`${item.name}-${idx}`}
                  draggable={!readOnly}
                  onDragStart={() => setDraggedEquipment(`${item.index}`)}
                  onDragEnd={() => setDraggedEquipment(null)}
                  className={`p-2 border border-gray-200 rounded bg-gray-50 cursor-move transition-colors ${
                    draggedEquipment === `${item.index}` ? 'opacity-50' : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {item.crits} slot{item.crits !== 1 ? 's' : ''} • {item.weight}t
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
            compact={true}
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
                    {(unit.data?.weapons_and_equipment || [])
                      .filter(item => item.location === selectedLocation)
                      .map((item, index) => {
                        const equipment = EQUIPMENT_DATABASE.find(e => e.name === item.item_name);
                        return (
                          <div key={`${item.item_name}-${index}`} className="text-xs bg-gray-50 p-2 rounded">
                            <div className="font-medium">{item.item_name}</div>
                            <div className="text-gray-600">
                              {equipment?.crits || 1} slot{equipment?.crits !== 1 ? 's' : ''}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Quick Actions */}
                {!readOnly && (
                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => {
                        // Clear all non-fixed equipment from this location
                        const updatedEquipment = (unit.data?.weapons_and_equipment || []).map(item => 
                          item.location === selectedLocation 
                            ? { ...item, location: 'Unallocated' }
                            : item
                        );
                        
                        const updatedUnit = {
                          ...unit,
                          data: {
                            ...unit.data,
                            weapons_and_equipment: updatedEquipment,
                          },
                        };
                        
                        onUnitChange(updatedUnit);
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
