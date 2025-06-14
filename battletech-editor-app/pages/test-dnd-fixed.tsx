import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import CriticalSlotDropZone from '../components/editor/criticals/CriticalSlotDropZone';
import DraggableEquipmentItem from '../components/editor/equipment/DraggableEquipmentItem';
import { CriticalSlotObject, EquipmentObject, SlotType, EquipmentType, EquipmentCategory } from '../types/criticalSlots';
import styles from '../styles/demo.module.css';

const TestDndFixed: React.FC = () => {
  // Initialize with empty slots
  const [slots, setSlots] = useState<CriticalSlotObject[]>(() => 
    Array(12).fill(null).map((_, index) => ({
      slotIndex: index,
      location: 'Test Location',
      equipment: null,
      isPartOfMultiSlot: false,
      slotType: SlotType.NORMAL
    }))
  );

  // Track equipped items
  const [equippedItems, setEquippedItems] = useState<Set<string>>(new Set());

  // Test equipment
  const allEquipment: EquipmentObject[] = [
    {
      id: 'ml-1',
      name: 'Medium Laser',
      type: EquipmentType.ENERGY,
      category: EquipmentCategory.WEAPON,
      requiredSlots: 1,
      weight: 1,
      isFixed: false,
      isRemovable: true,
      techBase: 'Inner Sphere',
      damage: 5,
      heat: 3
    },
    {
      id: 'ac20-1',
      name: 'AC/20',
      type: EquipmentType.BALLISTIC,
      category: EquipmentCategory.WEAPON,
      requiredSlots: 10,
      weight: 14,
      isFixed: false,
      isRemovable: true,
      techBase: 'Inner Sphere',
      damage: 20,
      heat: 7
    },
    {
      id: 'hs-1',
      name: 'Heat Sink',
      type: EquipmentType.HEAT_SINK,
      category: EquipmentCategory.EQUIPMENT,
      requiredSlots: 1,
      weight: 1,
      isFixed: false,
      isRemovable: true,
      techBase: 'Inner Sphere'
    },
    {
      id: 'dhs-1',
      name: 'Double Heat Sink',
      type: EquipmentType.HEAT_SINK,
      category: EquipmentCategory.EQUIPMENT,
      requiredSlots: 3,
      weight: 1,
      isFixed: false,
      isRemovable: true,
      techBase: 'Inner Sphere'
    }
  ];

  // Filter out equipped items from available equipment
  const availableEquipment = allEquipment.filter(eq => !equippedItems.has(eq.id));

  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [hoveredEquipment, setHoveredEquipment] = useState<EquipmentObject | null>(null);

  const handleDrop = (equipment: EquipmentObject, location: string, slotIndex: number) => {
    console.log('Drop:', equipment.name, 'at slot', slotIndex);
    
    // Check if we have enough consecutive empty slots
    const requiredSlots = equipment.requiredSlots;
    const canPlace = checkCanPlaceEquipment(slotIndex, requiredSlots);
    
    if (!canPlace) {
      console.log('Cannot place equipment - not enough slots');
      return;
    }

    // Place the equipment
    const newSlots = [...slots];
    const groupId = `${equipment.id}-${Date.now()}`;
    
    for (let i = 0; i < requiredSlots; i++) {
      newSlots[slotIndex + i] = {
        ...newSlots[slotIndex + i],
        equipment: {
          equipmentId: equipment.id,
          equipmentData: equipment,
          allocatedSlots: requiredSlots,
          startSlotIndex: slotIndex,
          endSlotIndex: slotIndex + requiredSlots - 1
        },
        isPartOfMultiSlot: requiredSlots > 1,
        multiSlotGroupId: groupId,
        multiSlotIndex: i
      };
    }
    
    setSlots(newSlots);
    
    // Add to equipped items
    setEquippedItems(prev => new Set(prev).add(equipment.id));
  };

  const handleRemove = (location: string, slotIndex: number) => {
    console.log('Remove from slot', slotIndex);
    
    const slot = slots[slotIndex];
    if (!slot.equipment) return;
    
    // Remove all slots for multi-slot equipment
    const newSlots = [...slots];
    if (slot.isPartOfMultiSlot && slot.multiSlotGroupId) {
      // Find all slots with the same group ID
      newSlots.forEach((s, idx) => {
        if (s.multiSlotGroupId === slot.multiSlotGroupId) {
          newSlots[idx] = {
            ...s,
            equipment: null,
            isPartOfMultiSlot: false,
            multiSlotGroupId: undefined,
            multiSlotIndex: undefined
          };
        }
      });
    } else {
      // Single slot equipment
      newSlots[slotIndex] = {
        ...slot,
        equipment: null
      };
    }
    
    setSlots(newSlots);
    
    // Remove from equipped items when removing
    if (slot.equipment) {
      setEquippedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(slot.equipment!.equipmentId);
        return newSet;
      });
    }
  };

  const handleMove = (fromLocation: string, fromIndex: number, toLocation: string, toIndex: number) => {
    console.log('Move from slot', fromIndex, 'to slot', toIndex);
    
    // Get the equipment from the source slot
    const sourceSlot = slots[fromIndex];
    if (!sourceSlot.equipment) return;
    
    const equipment = sourceSlot.equipment.equipmentData;
    const requiredSlots = equipment.requiredSlots;
    
    // Check if we can place at the target
    const canPlace = checkCanPlaceEquipment(toIndex, requiredSlots, fromIndex);
    
    if (!canPlace) {
      console.log('Cannot move equipment - not enough slots at target');
      return;
    }
    
    // Create new slots array
    const newSlots = [...slots];
    
    // Clear source slots
    if (sourceSlot.isPartOfMultiSlot && sourceSlot.multiSlotGroupId) {
      // Clear all slots for multi-slot equipment
      newSlots.forEach((s, idx) => {
        if (s.multiSlotGroupId === sourceSlot.multiSlotGroupId) {
          newSlots[idx] = {
            ...s,
            equipment: null,
            isPartOfMultiSlot: false,
            multiSlotGroupId: undefined,
            multiSlotIndex: undefined
          };
        }
      });
    } else {
      // Clear single slot
      newSlots[fromIndex] = {
        ...newSlots[fromIndex],
        equipment: null
      };
    }
    
    // Place at target
    const groupId = `${equipment.id}-${Date.now()}`;
    for (let i = 0; i < requiredSlots; i++) {
      newSlots[toIndex + i] = {
        ...newSlots[toIndex + i],
        equipment: {
          equipmentId: equipment.id,
          equipmentData: equipment,
          allocatedSlots: requiredSlots,
          startSlotIndex: toIndex,
          endSlotIndex: toIndex + requiredSlots - 1
        },
        isPartOfMultiSlot: requiredSlots > 1,
        multiSlotGroupId: groupId,
        multiSlotIndex: i
      };
    }
    
    setSlots(newSlots);
  };

  const canAccept = (equipment: EquipmentObject) => {
    // Basic validation - in real app would check more constraints
    return true;
  };

  const checkCanPlaceEquipment = (startIndex: number, requiredSlots: number, ignoreSourceIndex?: number): boolean => {
    if (startIndex + requiredSlots > slots.length) return false;
    
    for (let i = 0; i < requiredSlots; i++) {
      const checkIndex = startIndex + i;
      if (slots[checkIndex].equipment !== null) {
        // Allow if this is the source slot we're moving from
        if (ignoreSourceIndex !== undefined && checkIndex >= ignoreSourceIndex && checkIndex < ignoreSourceIndex + requiredSlots) {
          continue;
        }
        return false;
      }
    }
    
    return true;
  };

  const handleHoverChange = (isHovering: boolean, equipment: EquipmentObject | null) => {
    if (isHovering && equipment) {
      setHoveredEquipment(equipment);
    } else {
      setHoveredEquipment(null);
      setHoveredSlot(null);
    }
  };

  // Calculate which slots should be highlighted for multi-slot preview
  const getMultiSlotPreview = (hoverIndex: number): number[] => {
    if (!hoveredEquipment) return [];
    
    const requiredSlots = hoveredEquipment.requiredSlots;
    const previewSlots: number[] = [];
    
    // Check if we can place at this position
    if (checkCanPlaceEquipment(hoverIndex, requiredSlots)) {
      for (let i = 0; i < requiredSlots; i++) {
        previewSlots.push(hoverIndex + i);
      }
    }
    
    return previewSlots;
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.container}>
        <h1>Critical Slot Drag & Drop Test - Fixed</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          {/* Available Equipment */}
          <div>
            <h2>Available Equipment</h2>
            <div style={{ background: '#1f2937', padding: '1rem', borderRadius: '0.5rem' }}>
              {availableEquipment.map(equipment => (
                <DraggableEquipmentItem
                  key={equipment.id}
                  equipment={{
                    id: equipment.id,
                    name: equipment.name,
                    type: equipment.category,
                    tech_base: equipment.techBase as 'IS' | 'Clan',
                    weight: equipment.weight,
                    space: equipment.requiredSlots,
                    damage: equipment.damage,
                    heat: equipment.heat
                  }}
                  quantity={1}
                />
              ))}
            </div>
          </div>

          {/* Critical Slots */}
          <div>
            <h2>Critical Slots</h2>
            <div style={{ background: '#1f2937', padding: '1rem', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {slots.map((slot, index) => {
                  const multiSlotPreview = hoveredSlot === index ? getMultiSlotPreview(index) : [];
                  const isPartOfPreview = multiSlotPreview.includes(index);
                  
                  return (
                    <CriticalSlotDropZone
                      key={index}
                      location="Test Location"
                      slotIndex={index}
                      slot={slot}
                      onDrop={handleDrop}
                      onRemove={handleRemove}
                      onMove={handleMove}
                      canAccept={canAccept}
                      isHoveredMultiSlot={isPartOfPreview}
                      onHoverChange={(isHovering, equipment) => {
                        if (isHovering) {
                          setHoveredSlot(index);
                        }
                        handleHoverChange(isHovering, equipment);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#1e293b', borderRadius: '0.5rem' }}>
          <h3>Instructions</h3>
          <ul>
            <li>Drag equipment from the left panel to empty slots on the right</li>
            <li>Drag equipment from occupied slots to move them to different slots</li>
            <li>Empty slots should highlight green when hovering with valid equipment</li>
            <li>Occupied slots should highlight red when hovering</li>
            <li>Multi-slot equipment (AC/20, Double Heat Sink) should preview across multiple slots</li>
            <li>Click on occupied slots to remove equipment</li>
          </ul>
        </div>

        {/* Debug Info */}
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#1e293b', borderRadius: '0.5rem' }}>
          <h4>Debug Info</h4>
          <p>Hovered Slot: {hoveredSlot !== null ? hoveredSlot : 'None'}</p>
          <p>Hovered Equipment: {hoveredEquipment?.name || 'None'}</p>
          <p>Required Slots: {hoveredEquipment?.requiredSlots || 0}</p>
          <p>Available Equipment: {availableEquipment.length} items</p>
          <p>Equipped Items: {equippedItems.size} items</p>
        </div>
      </div>
    </DndProvider>
  );
};

export default TestDndFixed;
