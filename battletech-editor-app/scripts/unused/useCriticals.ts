import { useState, useCallback } from 'react';
import { FullUnit } from '../../../types/index';
import { Mounted, CriticalSlot } from '../../../types/criticals';

export const useCriticals = (unit: FullUnit) => {
  const [criticals, setCriticals] = useState(unit.data.criticals);

  const addEquipment = useCallback((equipment: Mounted, location: string, slot: number) => {
    // This is a simplified version of the logic in BMCriticalTransferHandler.java
    // A full implementation would require porting over all the validation and
    // placement logic from the legacy application.
    const newCriticals = criticals ? [...criticals] : [];
    const locationIndex = newCriticals.findIndex(loc => loc.location === location);
    if (locationIndex !== -1) {
      const newSlots = [...newCriticals[locationIndex].slots];
      // This is a simplification. A full implementation would need to handle
      // spreadable and splittable equipment, as well as freeing up contiguous
      // critical slots.
      for (let i = 0; i < equipment.criticals; i++) {
        if (slot + i < newSlots.length) {
          newSlots[slot + i] = equipment.name;
        }
      }
      newCriticals[locationIndex] = { ...newCriticals[locationIndex], slots: newSlots };
      setCriticals(newCriticals);
    }
  }, [criticals]);

  const removeEquipment = useCallback((location: string, slot: number) => {
    const newCriticals = criticals ? [...criticals] : [];
    const locationIndex = newCriticals.findIndex(loc => loc.location === location);
    if (locationIndex !== -1) {
      const newSlots = [...newCriticals[locationIndex].slots];
      newSlots[slot] = '-Empty-';
      newCriticals[locationIndex] = { ...newCriticals[locationIndex], slots: newSlots };
      setCriticals(newCriticals);
    }
  }, [criticals]);

  const isValidPlacement = useCallback((equipment: Mounted, location: string, slot: number) => {
    // TODO: Implement placement validation logic
    return true;
  }, []);

  return {
    criticals,
    addEquipment,
    removeEquipment,
    isValidPlacement,
  };
};
