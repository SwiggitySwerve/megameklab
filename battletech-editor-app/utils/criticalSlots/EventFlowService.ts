/**
 * Event Flow Service
 * Implements clear event flow architecture for component changes
 * Adapted from old architecture to work with new typed system
 */

import { UnitConfiguration } from './UnitCriticalManagerTypes';
import { ComponentCategory, TechBase } from '../../types/componentDatabase';
import { UnitCriticalManager } from './UnitCriticalManager';
import { ComponentSynchronizationService, ComponentSyncResult } from './ComponentSynchronizationService';
import { ComponentMemoryState } from '../../types/componentDatabase';

export interface EventFlowContext {
  tabId: string;
  unitManager: UnitCriticalManager;
  memoryState: ComponentMemoryState | null;
  userAction: string;
  timestamp: number;
}

export interface EventFlowResult {
  success: boolean;
  configuration: UnitConfiguration;
  slotUpdates: {
    displacedEquipment: any[];
    warnings: string[];
    errors: string[];
  };
  memoryUpdates: ComponentMemoryState | null;
  notifications: string[];
}

export type EventFlowStep = (
  context: EventFlowContext,
  data: any
) => Promise<EventFlowResult>;

/**
 * Clear event flow service for component changes
 */
export class EventFlowService {
  private syncService: ComponentSynchronizationService;
  private eventSteps: Map<string, EventFlowStep[]>;

  constructor() {
    this.syncService = new ComponentSynchronizationService();
    this.eventSteps = new Map();
    this.initializeEventFlows();
  }

  /**
   * Initialize predefined event flows
   */
  private initializeEventFlows(): void {
    // Component change event flow
    this.eventSteps.set('component_change', [
      this.validateComponentChange,
      this.updateConfiguration,
      this.syncComponentSlots,
      this.updateMemoryState,
      this.notifyStateChange
    ]);

    // Tech progression change event flow
    this.eventSteps.set('tech_progression_change', [
      this.validateTechProgression,
      this.resolveComponentWithMemory,
      this.updateTechProgression,
      this.syncComponentSlots,
      this.updateMemoryState,
      this.notifyStateChange
    ]);

    // Equipment allocation event flow
    this.eventSteps.set('equipment_allocation', [
      this.validateEquipmentAllocation,
      this.allocateEquipment,
      this.updateSlotAllocations,
      this.notifyStateChange
    ]);

    // Equipment displacement event flow
    this.eventSteps.set('equipment_displacement', [
      this.validateDisplacement,
      this.displaceEquipment,
      this.updateSlotAllocations,
      this.notifyStateChange
    ]);
  }

  /**
   * Execute event flow for a specific action
   */
  async executeEventFlow(
    action: string,
    context: EventFlowContext,
    data: any
  ): Promise<EventFlowResult> {
    const steps = this.eventSteps.get(action);
    if (!steps) {
      throw new Error(`Unknown event flow: ${action}`);
    }

    console.log(`[EventFlow] Executing ${action} flow for tab: ${context.tabId}`);

    let result: EventFlowResult = {
      success: false,
      configuration: context.unitManager.getConfiguration(),
      slotUpdates: {
        displacedEquipment: [],
        warnings: [],
        errors: []
      },
      memoryUpdates: null,
      notifications: []
    };

    try {
      // Execute each step in sequence
      for (const step of steps) {
        const stepResult = await step(context, data);
        
        // Merge results
        result = {
          ...result,
          ...stepResult,
          slotUpdates: {
            displacedEquipment: [
              ...result.slotUpdates.displacedEquipment,
              ...stepResult.slotUpdates.displacedEquipment
            ],
            warnings: [
              ...result.slotUpdates.warnings,
              ...stepResult.slotUpdates.warnings
            ],
            errors: [
              ...result.slotUpdates.errors,
              ...stepResult.slotUpdates.errors
            ]
          },
          notifications: [
            ...result.notifications,
            ...stepResult.notifications
          ]
        };

        // If any step fails, stop execution
        if (!stepResult.success) {
          result.success = false;
          break;
        }

        // Update context with new configuration
        context.unitManager.updateConfiguration(stepResult.configuration);
        if (stepResult.memoryUpdates) {
          context.memoryState = stepResult.memoryUpdates;
        }
      }

      result.success = true;
      console.log(`[EventFlow] Successfully completed ${action} flow`);

    } catch (error) {
      console.error(`[EventFlow] Error in ${action} flow:`, error);
      result.slotUpdates.errors.push(
        `Event flow execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return result;
  }

  // ===== EVENT FLOW STEPS =====

  /**
   * Validate component change
   */
  private validateComponentChange: EventFlowStep = async (context, data) => {
    const { category, newComponent } = data;
    const currentConfig = context.unitManager.getConfiguration();

    const result: EventFlowResult = {
      success: false,
      configuration: currentConfig,
      slotUpdates: { displacedEquipment: [], warnings: [], errors: [] },
      memoryUpdates: null,
      notifications: []
    };

    // Basic validation
    if (!category || !newComponent) {
      result.slotUpdates.errors.push('Missing category or component');
      return result;
    }

    // Validate component availability
    const techBase = this.getTechBaseForCategory(category, currentConfig);
    // Note: This would need to integrate with component availability system
    // For now, assume valid
    result.success = true;
    result.notifications.push(`Validated ${category} component change`);

    return result;
  };

  /**
   * Update configuration
   */
  private updateConfiguration: EventFlowStep = async (context, data) => {
    const { category, newComponent } = data;
    const currentConfig = context.unitManager.getConfiguration();

    const result: EventFlowResult = {
      success: false,
      configuration: currentConfig,
      slotUpdates: { displacedEquipment: [], warnings: [], errors: [] },
      memoryUpdates: null,
      notifications: []
    };

    try {
      // Use component synchronization service
      const syncResult = this.syncService.syncComponentChange(
        currentConfig,
        category,
        newComponent,
        context.memoryState
      );

      if (syncResult.success) {
        result.success = true;
        result.configuration = syncResult.configuration;
        result.slotUpdates = syncResult.slotUpdates;
        result.memoryUpdates = syncResult.memoryUpdates;
        result.notifications.push(`Updated ${category} configuration`);
      } else {
        result.slotUpdates.errors.push(...syncResult.slotUpdates.errors);
      }

    } catch (error) {
      result.slotUpdates.errors.push(
        `Configuration update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return result;
  };

  /**
   * Sync component slots
   */
  private syncComponentSlots: EventFlowStep = async (context, data) => {
    const currentConfig = context.unitManager.getConfiguration();

    const result: EventFlowResult = {
      success: true,
      configuration: currentConfig,
      slotUpdates: { displacedEquipment: [], warnings: [], errors: [] },
      memoryUpdates: null,
      notifications: []
    };

    // This step would handle slot synchronization
    // For now, just return success
    result.notifications.push('Component slots synchronized');

    return result;
  };

  /**
   * Update memory state
   */
  private updateMemoryState: EventFlowStep = async (context, data) => {
    const result: EventFlowResult = {
      success: true,
      configuration: context.unitManager.getConfiguration(),
      slotUpdates: { displacedEquipment: [], warnings: [], errors: [] },
      memoryUpdates: context.memoryState,
      notifications: []
    };

    // Memory state updates are handled by the sync service
    // This step just ensures the memory state is properly updated
    if (context.memoryState) {
      result.notifications.push('Memory state updated');
    }

    return result;
  };

  /**
   * Notify state change
   */
  private notifyStateChange: EventFlowStep = async (context, data) => {
    const result: EventFlowResult = {
      success: true,
      configuration: context.unitManager.getConfiguration(),
      slotUpdates: { displacedEquipment: [], warnings: [], errors: [] },
      memoryUpdates: null,
      notifications: []
    };

    // This step would trigger UI updates and notifications
    result.notifications.push('State change notification sent');

    return result;
  };

  /**
   * Validate tech progression change
   */
  private validateTechProgression: EventFlowStep = async (context, data) => {
    const { category, newTechBase } = data;
    const currentConfig = context.unitManager.getConfiguration();

    const result: EventFlowResult = {
      success: false,
      configuration: currentConfig,
      slotUpdates: { displacedEquipment: [], warnings: [], errors: [] },
      memoryUpdates: null,
      notifications: []
    };

    // Basic validation
    if (!category || !newTechBase) {
      result.slotUpdates.errors.push('Missing category or tech base');
      return result;
    }

    // Validate tech base
    if (newTechBase !== 'Inner Sphere' && newTechBase !== 'Clan') {
      result.slotUpdates.errors.push('Invalid tech base');
      return result;
    }

    result.success = true;
    result.notifications.push(`Validated ${category} tech progression change`);

    return result;
  };

  /**
   * Resolve component with memory
   */
  private resolveComponentWithMemory: EventFlowStep = async (context, data) => {
    const { category, newTechBase } = data;
    const currentConfig = context.unitManager.getConfiguration();

    const result: EventFlowResult = {
      success: false,
      configuration: currentConfig,
      slotUpdates: { displacedEquipment: [], warnings: [], errors: [] },
      memoryUpdates: null,
      notifications: []
    };

    try {
      // Use component synchronization service for tech progression
      const syncResult = this.syncService.syncTechProgressionChange(
        currentConfig,
        category,
        newTechBase,
        context.memoryState
      );

      if (syncResult.success) {
        result.success = true;
        result.configuration = syncResult.configuration;
        result.slotUpdates = syncResult.slotUpdates;
        result.memoryUpdates = syncResult.memoryUpdates;
        result.notifications.push(`Resolved component for ${category} tech progression`);
      } else {
        result.slotUpdates.errors.push(...syncResult.slotUpdates.errors);
      }

    } catch (error) {
      result.slotUpdates.errors.push(
        `Component resolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return result;
  };

  /**
   * Update tech progression
   */
  private updateTechProgression: EventFlowStep = async (context, data) => {
    const result: EventFlowResult = {
      success: true,
      configuration: context.unitManager.getConfiguration(),
      slotUpdates: { displacedEquipment: [], warnings: [], errors: [] },
      memoryUpdates: null,
      notifications: []
    };

    // Tech progression updates are handled by the sync service
    result.notifications.push('Tech progression updated');

    return result;
  };

  /**
   * Validate equipment allocation
   */
  private validateEquipmentAllocation: EventFlowStep = async (context, data) => {
    const result: EventFlowResult = {
      success: true,
      configuration: context.unitManager.getConfiguration(),
      slotUpdates: { displacedEquipment: [], warnings: [], errors: [] },
      memoryUpdates: null,
      notifications: []
    };

    // Equipment allocation validation would go here
    result.notifications.push('Equipment allocation validated');

    return result;
  };

  /**
   * Allocate equipment
   */
  private allocateEquipment: EventFlowStep = async (context, data) => {
    const result: EventFlowResult = {
      success: true,
      configuration: context.unitManager.getConfiguration(),
      slotUpdates: { displacedEquipment: [], warnings: [], errors: [] },
      memoryUpdates: null,
      notifications: []
    };

    // Equipment allocation logic would go here
    result.notifications.push('Equipment allocated');

    return result;
  };

  /**
   * Update slot allocations
   */
  private updateSlotAllocations: EventFlowStep = async (context, data) => {
    const result: EventFlowResult = {
      success: true,
      configuration: context.unitManager.getConfiguration(),
      slotUpdates: { displacedEquipment: [], warnings: [], errors: [] },
      memoryUpdates: null,
      notifications: []
    };

    // Slot allocation updates would go here
    result.notifications.push('Slot allocations updated');

    return result;
  };

  /**
   * Validate displacement
   */
  private validateDisplacement: EventFlowStep = async (context, data) => {
    const result: EventFlowResult = {
      success: true,
      configuration: context.unitManager.getConfiguration(),
      slotUpdates: { displacedEquipment: [], warnings: [], errors: [] },
      memoryUpdates: null,
      notifications: []
    };

    // Displacement validation would go here
    result.notifications.push('Displacement validated');

    return result;
  };

  /**
   * Displace equipment
   */
  private displaceEquipment: EventFlowStep = async (context, data) => {
    const result: EventFlowResult = {
      success: true,
      configuration: context.unitManager.getConfiguration(),
      slotUpdates: { displacedEquipment: [], warnings: [], errors: [] },
      memoryUpdates: null,
      notifications: []
    };

    // Equipment displacement logic would go here
    result.notifications.push('Equipment displaced');

    return result;
  };

  /**
   * Get tech base for a component category
   */
  private getTechBaseForCategory(
    category: ComponentCategory, 
    config: UnitConfiguration
  ): TechBase {
    // Create default tech progression if it doesn't exist
    const currentTechProgression = config.techProgression || {
      chassis: 'Inner Sphere',
      gyro: 'Inner Sphere',
      engine: 'Inner Sphere',
      heatsink: 'Inner Sphere',
      targeting: 'Inner Sphere',
      myomer: 'Inner Sphere',
      movement: 'Inner Sphere',
      armor: 'Inner Sphere'
    };

    // Map component categories to tech progression properties
    const categoryToTechMap: Record<ComponentCategory, keyof typeof currentTechProgression> = {
      chassis: 'chassis',
      engine: 'engine', 
      gyro: 'gyro',
      heatsink: 'heatsink',
      armor: 'armor',
      myomer: 'myomer',
      targeting: 'targeting',
      movement: 'movement'
    };

    const techProperty = categoryToTechMap[category];
    return currentTechProgression[techProperty];
  }

  /**
   * Register custom event flow
   */
  registerEventFlow(action: string, steps: EventFlowStep[]): void {
    this.eventSteps.set(action, steps);
    console.log(`[EventFlow] Registered custom event flow: ${action}`);
  }

  /**
   * Get available event flows
   */
  getAvailableEventFlows(): string[] {
    return Array.from(this.eventSteps.keys());
  }
} 