/**
 * UnitStateManager
 * Handles state management, notifications, and observer pattern functionality.
 * Extracted from UnitCriticalManager for modularity and SOLID compliance.
 */

export interface StateChangeListener {
  (): void;
}

export interface UnitSummary {
  totalSections: number;
  totalSlots: number;
  occupiedSlots: number;
  availableSlots: number;
  totalEquipment: number;
  unallocatedEquipment: number;
  systemSlots: number;
  totalWeight: number;
  heatGenerated: number;
  heatDissipated: number;
}

export interface UserEquipmentSlotStatus {
  totalUserSlots: number;      // Slots available for user equipment
  usedUserSlots: number;       // Slots occupied by user equipment
  availableUserSlots: number;  // Remaining slots for user equipment
}

export class UnitStateManager {
  private listeners: StateChangeListener[] = [];
  private sections: Map<string, any>; // CriticalSection[]
  private unallocatedEquipment: any[]; // EquipmentAllocation[]

  constructor(sections: Map<string, any>, unallocatedEquipment: any[]) {
    this.sections = sections;
    this.unallocatedEquipment = unallocatedEquipment;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: StateChangeListener): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify all listeners about state changes
   */
  notifyStateChange(): void {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[UnitStateManager] Error in state change listener:', error);
      }
    });
  }

  /**
   * Get summary statistics
   */
  getSummary(): UnitSummary {
    let totalSlots = 0;
    let occupiedSlots = 0;
    let systemSlots = 0;
    
    // Count mandatory fixed components that are always present
    const mandatorySlots = this.getMandatoryComponentSlots();
    
    this.sections.forEach(section => {
      totalSlots += section.getTotalSlots();
      section.getAllSlots().forEach((slot: any) => {
        if (!slot.isEmpty()) {
          occupiedSlots++;
          if (slot.isSystemSlot()) {
            systemSlots++;
          }
        }
      });
    });
    
    // Add mandatory component slots to occupied count
    occupiedSlots += mandatorySlots;
    systemSlots += mandatorySlots;
    
    return {
      totalSections: this.sections.size,
      totalSlots,
      occupiedSlots,
      availableSlots: totalSlots - occupiedSlots,
      totalEquipment: this.getAllocatedEquipmentCount(),
      unallocatedEquipment: this.getUnallocatedEquipmentCount(),
      systemSlots,
      totalWeight: 0, // Will be calculated by UnitCalculationManager
      heatGenerated: 0, // Will be calculated by HeatManagementManager
      heatDissipated: 0 // Will be calculated by HeatManagementManager
    };
  }

  /**
   * Get slot status specifically for user equipment (excludes system components)
   */
  getUserEquipmentSlotStatus(): UserEquipmentSlotStatus {
    // Calculate system component slot usage
    const systemReservedSlots = this.calculateSystemReservedSlots();
    
    // Calculate available slots for user equipment
    const totalCriticalSlots = 78; // Standard BattleMech total
    const totalUserSlots = totalCriticalSlots - systemReservedSlots;
    
    // Count user equipment slots (exclude system components)
    let usedUserSlots = 0;
    this.sections.forEach(section => {
      section.getAllEquipment().forEach((allocation: any) => {
        // Only count user equipment, not system components
        if (!this.isSystemComponent(allocation.equipmentData)) {
          usedUserSlots += allocation.occupiedSlots.length;
        }
      });
    });
    
    // Calculate remaining slots available for user equipment
    const availableUserSlots = Math.max(0, totalUserSlots - usedUserSlots);
    
    return {
      totalUserSlots,
      usedUserSlots,
      availableUserSlots
    };
  }

  /**
   * Get mandatory component critical slots that are always present
   */
  private getMandatoryComponentSlots(): number {
    // Fixed components that are always present:
    // - Cockpit: 1 slot (Head)
    // - Life Support: 2 slots (Head) 
    // - Sensors: 2 slots (Head)
    // - Actuators: 4 slots per arm (shoulder, upper, lower, hand) + 4 slots per leg (hip, upper, lower, foot)
    
    const cockpitSlots = 1;
    const lifeSupportSlots = 2;
    const sensorSlots = 2;
    const armActuatorSlots = 4 * 2; // 4 slots per arm × 2 arms
    const legActuatorSlots = 4 * 2; // 4 slots per leg × 2 legs
    
    return cockpitSlots + lifeSupportSlots + sensorSlots + armActuatorSlots + legActuatorSlots;
  }

  /**
   * Calculate system reserved slots
   */
  private calculateSystemReservedSlots(): number {
    // This would need to be calculated based on the actual system components
    // For now, return a reasonable estimate
    return 20; // Engine + Gyro + Fixed components
  }

  /**
   * Check if equipment is a system component (engine, gyro, actuators, etc.)
   */
  private isSystemComponent(equipment: any): boolean {
    const name = equipment.name.toLowerCase();
    
    // System component patterns
    const systemPatterns = [
      'engine', 'gyro', 'actuator', 'cockpit', 'life support', 'sensors',
      'shoulder', 'upper arm', 'lower arm', 'hand', 'hip', 'upper leg', 'lower leg', 'foot'
    ];
    
    return systemPatterns.some(pattern => name.includes(pattern));
  }

  /**
   * Get allocated equipment count
   */
  private getAllocatedEquipmentCount(): number {
    let count = 0;
    this.sections.forEach(section => {
      count += section.getAllEquipment().length;
    });
    return count;
  }

  /**
   * Get unallocated equipment count
   */
  private getUnallocatedEquipmentCount(): number {
    return this.unallocatedEquipment.length;
  }

  /**
   * Update internal references when sections or unallocated equipment change
   */
  updateReferences(sections: Map<string, any>, unallocatedEquipment: any[]): void {
    this.sections = sections;
    this.unallocatedEquipment = unallocatedEquipment;
  }
}
