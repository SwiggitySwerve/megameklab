import React, { useState, useCallback, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { EditorComponentProps, MECH_LOCATIONS } from '../../../types/editor';
import { CriticalSlotDropZone } from '../criticals/CriticalSlotDropZone';
import { DraggableEquipmentItem } from '../equipment/DraggableEquipmentItem';
import { DraggedEquipment, DragItemType } from '../dnd/types';
import { EQUIPMENT_DATABASE } from '../../../utils/equipmentData';
import { FullEquipment } from '../../../types';

// Critical slot counts for each location (per BattleTech rules)
const CRITICAL_SLOT_COUNTS = {
  [MECH_LOCATIONS.HEAD]: 6,
  [MECH_LOCATIONS.LEFT_TORSO]: 12,
  [MECH_LOCATIONS.CENTER_TORSO]: 12,
  [MECH_LOCATIONS.RIGHT_TORSO]: 12,
  [MECH_LOCATIONS.LEFT_ARM]: 12,
  [MECH_LOCATIONS.RIGHT_ARM]: 12,
  [MECH_LOCATIONS.LEFT_LEG]: 6,
  [MECH_LOCATIONS.RIGHT_LEG]: 6,
};

interface CriticalSlot {
  slotIndex: number;
  content: string;
  isFixed: boolean;
  isEmpty: boolean;
  isInternal: boolean;
  equipmentIndex?: number;
}

// Extend FullEquipment with properties needed for the drag-and-drop interface
interface DraggableFullEquipment extends FullEquipment {
  equipmentId: string;
  criticalSlots: number;
  location: string;
}

const CriticalsTab: React.FC<EditorComponentProps> = ({
  unit,
  onUnitChange,
  validationErrors = [],
  readOnly = false,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [clickMode, setClickMode] = useState<'drag' | 'click'>('drag');

  // Convert unit equipment to draggable format
  const unallocatedEquipment = useMemo(() => {
    return (unit.data?.weapons_and_equipment || [])
      .map((item, index): DraggableFullEquipment | null => {
        const equipment = EQUIPMENT_DATABASE.find(e => e.name === item.item_name);
        if (!equipment) return null;
        
        return {
          id: `equipment-${index}`,
          name: item.item_name,
          type: item.item_type || 'equipment',
          tech_base: item.tech_base || 'IS',
          weight: Number(equipment.weight) || 0,
          space: Number(equipment.crits) || 1,
          damage: equipment.damage || 0,
          heat: equipment.heat || 0,
          equipmentId: `equipment-${index}`,
          criticalSlots: Number(equipment.crits) || 1,
          location: item.location,
        };
      })
      .filter((item): item is DraggableFullEquipment => item !== null && (!item.location || item.location === 'Unallocated'));
  }, [unit.data?.weapons_and_equipment]);

  // Handle equipment placement via drag and drop
  const handleEquipmentPlace = useCallback((equipment: DraggedEquipment, location: string, slotIndex: number) => {
    if (readOnly) return;

    const equipmentIndex = parseInt(equipment.equipmentId.replace('equipment-', ''));
    const updatedEquipment = [...(unit.data?.weapons_and_equipment || [])];
    
    if (updatedEquipment[equipmentIndex]) {
      updatedEquipment[equipmentIndex] = {
        ...updatedEquipment[equipmentIndex],
        location: location
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
  }, [unit, onUnitChange, readOnly]);

  // Handle equipment placement via click-then-click
  const handleSlotClick = useCallback((location: string, slotIndex: number) => {
    if (readOnly || clickMode !== 'click' || !selectedEquipment) return;

    const selectedItem = unallocatedEquipment.find(item => item.id === selectedEquipment);
    if (!selectedItem) return;

    const draggedEquipment: DraggedEquipment = {
      type: DragItemType.EQUIPMENT,
      equipmentId: selectedItem.id,
      name: selectedItem.name,
      weight: selectedItem.weight || 0,
      criticalSlots: selectedItem.space || 1,
      location: selectedItem.location,
    };

    handleEquipmentPlace(draggedEquipment, location, slotIndex);
    setSelectedEquipment(null);
  }, [readOnly, clickMode, selectedEquipment, unallocatedEquipment, handleEquipmentPlace]);

  // Handle equipment item click for click-then-click mode
  const handleEquipmentClick = useCallback((equipmentId: string) => {
    if (clickMode === 'click') {
      setSelectedEquipment(selectedEquipment === equipmentId ? null : equipmentId);
    }
  }, [clickMode, selectedEquipment]);

  // Clear all equipment from selected location
  const handleClearLocation = useCallback(() => {
    if (!selectedLocation || readOnly) return;

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
  }, [selectedLocation, unit, onUnitChange, readOnly]);

  // Calculate engine slots based on engine type and rating
  const getEngineSlots = useCallback(() => {
    const engineType = unit.data?.engine?.type || 'Fusion';
    
    if (engineType === 'XL Fusion' || engineType === 'Light Fusion') {
      return {
        centerTorso: 6,
        leftTorso: 3,
        rightTorso: 3
      };
    } else {
      return {
        centerTorso: 6,
        leftTorso: 0,
        rightTorso: 0
      };
    }
  }, [unit.data?.engine]);

  // Get the critical slots for a location with proper internal structure
  const getLocationCriticalSlots = useCallback((location: string) => {
    const slotCount = CRITICAL_SLOT_COUNTS[location as keyof typeof CRITICAL_SLOT_COUNTS] || 12;
    const slots: CriticalSlot[] = Array(slotCount).fill(null).map((_, index) => ({
      slotIndex: index,
      content: '- Empty -',
      isFixed: false,
      isEmpty: true,
      isInternal: false,
      equipmentIndex: undefined,
    }));

    const engineSlots = getEngineSlots();

    // Fill internal structure slots based on location
    switch (location) {
      case MECH_LOCATIONS.HEAD:
        slots[0] = { slotIndex: 0, content: 'Life Support', isFixed: true, isEmpty: false, isInternal: true };
        slots[1] = { slotIndex: 1, content: 'Sensors', isFixed: true, isEmpty: false, isInternal: true };
        slots[2] = { slotIndex: 2, content: 'Cockpit', isFixed: true, isEmpty: false, isInternal: true };
        slots[3] = { slotIndex: 3, content: '- Empty -', isFixed: false, isEmpty: true, isInternal: false };
        slots[4] = { slotIndex: 4, content: 'Sensors', isFixed: true, isEmpty: false, isInternal: true };
        slots[5] = { slotIndex: 5, content: 'Life Support', isFixed: true, isEmpty: false, isInternal: true };
        break;

      case MECH_LOCATIONS.CENTER_TORSO:
        // Engine slots
        for (let i = 0; i < engineSlots.centerTorso; i++) {
          if (i < 3) {
            slots[i] = { slotIndex: i, content: 'Engine', isFixed: true, isEmpty: false, isInternal: true };
          } else {
            slots[11 - (i - 3)] = { slotIndex: 11 - (i - 3), content: 'Engine', isFixed: true, isEmpty: false, isInternal: true };
          }
        }
        // Gyro slots
        slots[3] = { slotIndex: 3, content: 'Standard Gyro', isFixed: true, isEmpty: false, isInternal: true };
        slots[4] = { slotIndex: 4, content: 'Standard Gyro', isFixed: true, isEmpty: false, isInternal: true };
        slots[5] = { slotIndex: 5, content: 'Standard Gyro', isFixed: true, isEmpty: false, isInternal: true };
        slots[6] = { slotIndex: 6, content: 'Standard Gyro', isFixed: true, isEmpty: false, isInternal: true };
        break;

      case MECH_LOCATIONS.LEFT_TORSO:
        // XL Engine slots if applicable
        for (let i = 0; i < engineSlots.leftTorso; i++) {
          slots[i] = { slotIndex: i, content: 'XL Engine', isFixed: true, isEmpty: false, isInternal: true };
        }
        break;

      case MECH_LOCATIONS.RIGHT_TORSO:
        // XL Engine slots if applicable
        for (let i = 0; i < engineSlots.rightTorso; i++) {
          slots[i] = { slotIndex: i, content: 'XL Engine', isFixed: true, isEmpty: false, isInternal: true };
        }
        break;

      case MECH_LOCATIONS.LEFT_ARM:
      case MECH_LOCATIONS.RIGHT_ARM:
        slots[0] = { slotIndex: 0, content: 'Shoulder', isFixed: true, isEmpty: false, isInternal: true };
        slots[1] = { slotIndex: 1, content: 'Upper Arm', isFixed: true, isEmpty: false, isInternal: true };
        slots[2] = { slotIndex: 2, content: 'Lower Arm', isFixed: true, isEmpty: false, isInternal: true };
        slots[3] = { slotIndex: 3, content: 'Hand', isFixed: true, isEmpty: false, isInternal: true };
        break;

      case MECH_LOCATIONS.LEFT_LEG:
      case MECH_LOCATIONS.RIGHT_LEG:
        slots[0] = { slotIndex: 0, content: 'Hip', isFixed: true, isEmpty: false, isInternal: true };
        slots[1] = { slotIndex: 1, content: 'Upper Leg', isFixed: true, isEmpty: false, isInternal: true };
        slots[2] = { slotIndex: 2, content: 'Lower Leg', isFixed: true, isEmpty: false, isInternal: true };
        slots[3] = { slotIndex: 3, content: 'Foot', isFixed: true, isEmpty: false, isInternal: true };
        break;
    }

    // Add placed equipment from weapons_and_equipment
    (unit.data?.weapons_and_equipment || []).forEach((item, index) => {
      if (item.location === location) {
        const equipment = EQUIPMENT_DATABASE.find(e => e.name === item.item_name);
        if (equipment) {
          const slotsNeeded = equipment.crits || 1;
          
          // Find consecutive empty slots
          for (let i = 0; i <= slots.length - slotsNeeded; i++) {
            let canPlace = true;
            for (let j = 0; j < slotsNeeded; j++) {
              if (!slots[i + j]?.isEmpty) {
                canPlace = false;
                break;
              }
            }
            if (canPlace) {
              // Place equipment in slots
              for (let j = 0; j < slotsNeeded; j++) {
                slots[i + j] = {
                  slotIndex: i + j,
                  content: item.item_name,
                  isFixed: false,
                  isEmpty: false,
                  isInternal: false,
                  equipmentIndex: index,
                };
              }
              break;
            }
          }
        }
      }
    });

    return slots;
  }, [unit.data?.weapons_and_equipment, getEngineSlots]);

  // Check if we can accept equipment at a specific slot
  const canAcceptEquipment = useCallback((item: DraggedEquipment, location: string, slotIndex: number): boolean => {
    if (readOnly) return false;
    
    const slots = getLocationCriticalSlots(location);
    
    // Can't place in internal structure slots
    if (slotIndex < slots.length && slots[slotIndex].isInternal) return false;
    
    // Check if we have enough consecutive empty slots
    for (let i = 0; i < item.criticalSlots; i++) {
      if (slotIndex + i >= slots.length || !slots[slotIndex + i].isEmpty) {
        return false;
      }
    }
    
    return true;
  }, [readOnly, getLocationCriticalSlots]);

  // Handle equipment removal
  const handleEquipmentRemove = useCallback((location: string, slotIndex: number) => {
    if (readOnly) return;

    const slots = getLocationCriticalSlots(location);
    const slotToRemove = slots[slotIndex];
    
    if (!slotToRemove || slotToRemove.isEmpty || slotToRemove.isInternal) return;

    const updatedEquipment = (unit.data?.weapons_and_equipment || []).map((item, index) => {
      // Find the equipment at this location that matches the slot content
      if (item.location === location && item.item_name === slotToRemove.content) {
        return { ...item, location: 'Unallocated' };
      }
      return item;
    });

    const updatedUnit = {
      ...unit,
      data: {
        ...unit.data,
        weapons_and_equipment: updatedEquipment,
      },
    };
    
    onUnitChange(updatedUnit);
  }, [unit, onUnitChange, readOnly, getLocationCriticalSlots]);

  // Render a single location's critical slots
  const renderLocationSlots = useCallback((location: string) => {
    const slots = getLocationCriticalSlots(location);
    
    return (
      <div className={`bg-gray-950 border-2 ${
        selectedLocation === location ? 'border-blue-500 shadow-xl shadow-blue-500/20' : 'border-gray-800'
      }`}>
        <div 
          className="text-xs font-bold text-center py-1.5 bg-gray-800 text-gray-100 cursor-pointer hover:bg-gray-700 border-b-2 border-gray-700"
          onClick={() => setSelectedLocation(location)}
        >
          {location}
        </div>
        <div className="text-xs bg-gray-900">
          {slots.map((slot) => {
            if (clickMode === 'drag') {
              // Use CriticalSlotDropZone for drag & drop
              return (
                <CriticalSlotDropZone
                  key={`${location}-${slot.slotIndex}`}
                  location={location}
                  slotIndex={slot.slotIndex}
                  currentItem={slot.content}
                  onDrop={handleEquipmentPlace}
                  onRemove={handleEquipmentRemove}
                  canAccept={(item) => canAcceptEquipment(item, location, slot.slotIndex)}
                  disabled={readOnly || slot.isInternal}
                  isOmniPodSlot={false}
                />
              );
            } else {
              // Use custom rendering for click mode
              const canInteract = !slot.isFixed && !slot.isInternal && slot.isEmpty && 
                                clickMode === 'click' && selectedEquipment;
              
              return (
                <div
                  key={`${location}-${slot.slotIndex}`}
                  className={`
                    px-2 py-0.5 border-b border-gray-800 text-left whitespace-nowrap overflow-hidden text-xs
                    ${slot.isInternal
                      ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                      : slot.isEmpty 
                      ? 'bg-gray-950 text-gray-600 hover:bg-gray-900 cursor-default' 
                      : 'bg-gray-900 text-gray-100 hover:bg-gray-800 cursor-pointer'
                    }
                    ${canInteract
                      ? 'hover:bg-gray-800 cursor-pointer ring-1 ring-blue-500 ring-inset'
                      : ''
                    }
                  `}
                  onClick={() => {
                    if (canInteract) {
                      handleSlotClick(location, slot.slotIndex);
                    } else if (!slot.isEmpty && !slot.isInternal && !readOnly) {
                      handleEquipmentRemove(location, slot.slotIndex);
                    }
                  }}
                  title={
                    slot.isInternal 
                      ? `Internal Structure: ${slot.content}` 
                      : canInteract
                      ? `Click to place ${unallocatedEquipment.find(e => e.id === selectedEquipment)?.name || ''}`
                      : !slot.isEmpty && !readOnly
                      ? 'Click to remove'
                      : slot.content
                  }
                >
                  {slot.content}
                </div>
              );
            }
          })}
        </div>
      </div>
    );
  }, [getLocationCriticalSlots, selectedLocation, clickMode, selectedEquipment, handleSlotClick, 
      unallocatedEquipment, readOnly, handleEquipmentRemove, handleEquipmentPlace, canAcceptEquipment]);

  // Create mech-shaped critical slots layout
  const MechCriticalsLayout = useCallback(() => {
    return (
      <div className="flex flex-col items-center space-y-3 max-w-4xl mx-auto">
        {/* Head - Top Center */}
        <div className="flex justify-center">
          <div className="w-44">
            {renderLocationSlots(MECH_LOCATIONS.HEAD)}
          </div>
        </div>

        {/* Torso and Arms - Middle Row */}
        <div className="flex justify-center items-start space-x-3">
          {/* Left Arm */}
          <div className="w-40">
            {renderLocationSlots(MECH_LOCATIONS.LEFT_ARM)}
          </div>
          
          {/* Left Torso */}
          <div className="w-44">
            {renderLocationSlots(MECH_LOCATIONS.LEFT_TORSO)}
          </div>
          
          {/* Center Torso */}
          <div className="w-44">
            {renderLocationSlots(MECH_LOCATIONS.CENTER_TORSO)}
          </div>
          
          {/* Right Torso */}
          <div className="w-44">
            {renderLocationSlots(MECH_LOCATIONS.RIGHT_TORSO)}
          </div>
          
          {/* Right Arm */}
          <div className="w-40">
            {renderLocationSlots(MECH_LOCATIONS.RIGHT_ARM)}
          </div>
        </div>

        {/* Legs - Bottom Row */}
        <div className="flex justify-center space-x-12">
          {/* Left Leg */}
          <div className="w-40">
            {renderLocationSlots(MECH_LOCATIONS.LEFT_LEG)}
          </div>
          
          {/* Right Leg */}
          <div className="w-40">
            {renderLocationSlots(MECH_LOCATIONS.RIGHT_LEG)}
          </div>
        </div>
      </div>
    );
  }, [renderLocationSlots]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="criticals-tab h-full overflow-auto">
        {/* Header with mode toggle */}
        <div className="mb-4 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Critical Slots Assignment</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Mode:</span>
                <button
                  onClick={() => setClickMode('drag')}
                  className={`px-3 py-1 text-sm rounded ${
                    clickMode === 'drag'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Drag & Drop
                </button>
                <button
                  onClick={() => setClickMode('click')}
                  className={`px-3 py-1 text-sm rounded ${
                    clickMode === 'click'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Click & Click
                </button>
              </div>
            </div>
          </div>
          
          {clickMode === 'click' && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              {selectedEquipment ? (
                <span>Selected: <strong>{unallocatedEquipment.find(e => e.id === selectedEquipment)?.name || ''}</strong>. Click on a critical slot to place it.</span>
              ) : (
                <span>Click on equipment below to select it, then click on a critical slot to place it.</span>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-5 gap-4">
          {/* Left Column - Unallocated Equipment */}
          <div className="col-span-1 space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                Unallocated Equipment
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {unallocatedEquipment.map((equipment) => (
                  <div
                    key={equipment.id}
                    className={`${
                      clickMode === 'click' 
                        ? 'cursor-pointer' 
                        : ''
                    } ${
                      selectedEquipment === equipment.id
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : ''
                    }`}
                    onClick={() => clickMode === 'click' && handleEquipmentClick(equipment.id)}
                  >
                    <DraggableEquipmentItem
                      equipment={equipment as FullEquipment}
                      isCompact={true}
                      showDetails={true}
                    />
                  </div>
                ))}

                {unallocatedEquipment.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    All equipment allocated
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {!readOnly && selectedLocation && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={handleClearLocation}
                    className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Clear {selectedLocation}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Center Area - Critical Slots Grid */}
          <div className="col-span-4">
            <div className="bg-gray-950 rounded-lg border-2 border-gray-800 p-4">
              <MechCriticalsLayout />
            </div>
          </div>
        </div>

        {/* Instructions Panel */}
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Instructions</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Drag & Drop Mode:</h4>
              <ul className="space-y-1 text-xs">
                <li>• Drag equipment from the left panel</li>
                <li>• Drop onto available critical slots</li>
                <li>• Multi-slot equipment fills consecutive slots</li>
                <li>• Internal structure cannot be modified</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Click & Click Mode:</h4>
              <ul className="space-y-1 text-xs">
                <li>• Click equipment to select it</li>
                <li>• Click critical slot to place it</li>
                <li>• Selected equipment is highlighted</li>
                <li>• Gray slots are internal structure</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default CriticalsTab;
