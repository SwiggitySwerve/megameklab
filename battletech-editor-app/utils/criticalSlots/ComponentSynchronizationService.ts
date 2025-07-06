/**
 * Component Synchronization Service
 * Handles synchronization between system components and critical slots
 * Adapted from old componentSync.ts to work with new typed architecture
 */

import { 
  UnitConfiguration
} from './UnitCriticalManagerTypes';
import { ComponentCategory, TechBase } from '../../types/componentDatabase';
import { ComponentMemoryState } from '../../types/componentDatabase';
import { CriticalSection } from './CriticalSection';
import { EquipmentAllocation } from './CriticalSlot';
import { 
  resolveComponentForTechBase,
  getComponentChanges 
} from '../componentResolution';
import { 
  getAvailableComponents,
  isComponentAvailable 
} from '../componentAvailability';

export interface SlotUpdateResult {
  success: boolean;
  displacedEquipment: EquipmentAllocation[];
  warnings: string[];
  errors: string[];
}

export interface ComponentSyncResult {
  success: boolean;
  configuration: UnitConfiguration;
  slotUpdates: SlotUpdateResult;
  memoryUpdates: ComponentMemoryState | null;
}

/**
 * Smart component synchronization service
 */
export class ComponentSynchronizationService {
  
  /**
   * Sync component changes with memory-first resolution
   */
  syncComponentChange(
    currentConfig: UnitConfiguration,
    category: ComponentCategory,
    newComponent: string,
    memoryState: ComponentMemoryState | null = null
  ): ComponentSyncResult {
    const result: ComponentSyncResult = {
      success: false,
      configuration: currentConfig,
      slotUpdates: {
        success: false,
        displacedEquipment: [],
        warnings: [],
        errors: []
      },
      memoryUpdates: null
    };

    try {
      // Validate component availability for current tech base
      const techBase = this.getTechBaseForCategory(category, currentConfig);
      if (!isComponentAvailable(newComponent, category, techBase)) {
        result.slotUpdates.errors.push(
          `Component "${newComponent}" is not available for ${techBase} tech base in ${category} category`
        );
        return result;
      }

      // Update configuration
      const updatedConfig = this.updateConfigurationProperty(
        currentConfig, 
        category, 
        newComponent
      );

      // Perform smart slot updates
      const slotResult = this.performSmartSlotUpdate(
        currentConfig,
        updatedConfig,
        category
      );

      // Update memory state if provided
      let memoryUpdates: ComponentMemoryState | null = null;
      if (memoryState) {
        memoryUpdates = this.updateMemoryState(
          memoryState,
          category,
          techBase,
          newComponent
        );
      }

      result.success = true;
      result.configuration = updatedConfig;
      result.slotUpdates = slotResult;
      result.memoryUpdates = memoryUpdates;

    } catch (error) {
      result.slotUpdates.errors.push(
        `Component synchronization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return result;
  }

  /**
   * Sync tech progression changes with memory-first resolution
   */
  syncTechProgressionChange(
    currentConfig: UnitConfiguration,
    category: ComponentCategory,
    newTechBase: TechBase,
    memoryState: ComponentMemoryState | null = null
  ): ComponentSyncResult {
    const result: ComponentSyncResult = {
      success: false,
      configuration: currentConfig,
      slotUpdates: {
        success: false,
        displacedEquipment: [],
        warnings: [],
        errors: []
      },
      memoryUpdates: null
    };

    try {
      // Get current component for this category
      const currentComponent = this.getComponentForCategory(currentConfig, category);
      
      // Resolve component for new tech base using memory-first approach
      const resolvedComponent = this.resolveComponentWithMemory(
        currentComponent,
        category,
        newTechBase,
        memoryState
      );

      // Update tech progression in configuration
      const updatedConfig = this.updateTechProgression(
        currentConfig,
        category,
        newTechBase
      );

      // If component changed, sync the component change
      if (resolvedComponent !== currentComponent) {
        const componentResult = this.syncComponentChange(
          updatedConfig,
          category,
          resolvedComponent,
          memoryState
        );

        // Merge results
        result.success = componentResult.success;
        result.configuration = componentResult.configuration;
        result.slotUpdates = componentResult.slotUpdates;
        result.memoryUpdates = componentResult.memoryUpdates;

        if (componentResult.slotUpdates.warnings.length > 0) {
          result.slotUpdates.warnings.push(
            `Component automatically changed from "${currentComponent}" to "${resolvedComponent}" for ${newTechBase} tech base`
          );
        }
      } else {
        // Component didn't change, just update tech progression
        result.success = true;
        result.configuration = updatedConfig;
        result.slotUpdates.success = true;
      }

    } catch (error) {
      result.slotUpdates.errors.push(
        `Tech progression synchronization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return result;
  }

  /**
   * Perform smart slot updates to minimize equipment displacement
   */
  private performSmartSlotUpdate(
    oldConfig: UnitConfiguration,
    newConfig: UnitConfiguration,
    category: ComponentCategory
  ): SlotUpdateResult {
    const result: SlotUpdateResult = {
      success: false,
      displacedEquipment: [],
      warnings: [],
      errors: []
    };

    try {
      // Get slot requirements for old and new configurations
      const oldSlots = this.getSlotRequirements(oldConfig, category);
      const newSlots = this.getSlotRequirements(newConfig, category);

      // If slot requirements haven't changed, no displacement needed
      if (this.areSlotRequirementsEqual(oldSlots, newSlots)) {
        result.success = true;
        return result;
      }

      // Find conflicting slots that need equipment displacement
      const conflicts = this.findSlotConflicts(oldSlots, newSlots);
      
      if (conflicts.length === 0) {
        result.success = true;
        return result;
      }

      // Displace equipment from conflicting slots
      const displacedEquipment = this.displaceEquipmentFromConflicts(conflicts);
      
      result.success = true;
      result.displacedEquipment = displacedEquipment;
      
      if (displacedEquipment.length > 0) {
        result.warnings.push(
          `${displacedEquipment.length} equipment items were displaced due to ${category} changes`
        );
      }

    } catch (error) {
      result.errors.push(
        `Smart slot update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return result;
  }

  /**
   * Resolve component with memory-first approach
   */
  private resolveComponentWithMemory(
    currentComponent: string,
    category: ComponentCategory,
    newTechBase: TechBase,
    memoryState: ComponentMemoryState | null
  ): string {
    // If we have memory state, try to restore previous choice for this tech base
    if (memoryState?.techBaseMemory?.[category]?.[newTechBase]) {
      const rememberedComponent = memoryState.techBaseMemory[category][newTechBase];
      
      // Verify the remembered component is still available
      if (isComponentAvailable(rememberedComponent, category, newTechBase)) {
        return rememberedComponent;
      }
    }

    // Fall back to intelligent resolution
    return resolveComponentForTechBase(currentComponent, category, newTechBase);
  }

  /**
   * Update memory state with new component choice
   */
  private updateMemoryState(
    memoryState: ComponentMemoryState,
    category: ComponentCategory,
    techBase: TechBase,
    component: string
  ): ComponentMemoryState {
    const updatedMemory = {
      ...memoryState,
      techBaseMemory: {
        ...memoryState.techBaseMemory,
        [category]: {
          ...memoryState.techBaseMemory[category],
          [techBase]: component
        }
      },
      lastUpdated: Date.now()
    };

    return updatedMemory;
  }

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
   * Get component for a category from configuration
   */
  private getComponentForCategory(
    config: UnitConfiguration, 
    category: ComponentCategory
  ): string {
    // Map component categories to configuration properties
    const categoryToPropertyMap: Record<ComponentCategory, keyof UnitConfiguration> = {
      chassis: 'structureType',
      engine: 'engineType',
      gyro: 'gyroType', 
      heatsink: 'heatSinkType',
      armor: 'armorType',
      myomer: 'enhancementType',
      targeting: 'jumpJetType', // Use jumpJetType for targeting/movement
      movement: 'jumpJetType'   // Use jumpJetType for movement
    };

    const property = categoryToPropertyMap[category];
    const value = config[property];
    
    // Handle ComponentConfiguration objects
    if (value && typeof value === 'object' && 'type' in value) {
      return value.type;
    }
    
    // Handle string values or fallback
    return typeof value === 'string' ? value : 'Standard';
  }

  /**
   * Update configuration property for a component category
   */
  private updateConfigurationProperty(
    config: UnitConfiguration,
    category: ComponentCategory,
    newComponent: string
  ): UnitConfiguration {
    const categoryToPropertyMap: Record<ComponentCategory, keyof UnitConfiguration> = {
      chassis: 'structureType',
      engine: 'engineType',
      gyro: 'gyroType',
      heatsink: 'heatSinkType', 
      armor: 'armorType',
      myomer: 'enhancementType',
      targeting: 'jumpJetType', // Use jumpJetType for targeting/movement
      movement: 'jumpJetType'   // Use jumpJetType for movement
    };

    const property = categoryToPropertyMap[category];
    
    // For ComponentConfiguration properties, create proper object
    if (property === 'structureType' || property === 'gyroType' || 
        property === 'armorType' || property === 'heatSinkType' || 
        property === 'enhancementType' || property === 'jumpJetType') {
      return {
        ...config,
        [property]: {
          type: newComponent,
          techBase: this.getTechBaseForCategory(category, config)
        }
      };
    }
    
    // For legacy string properties
    return {
      ...config,
      [property]: newComponent
    };
  }

  /**
   * Update tech progression for a category
   */
  private updateTechProgression(
    config: UnitConfiguration,
    category: ComponentCategory,
    newTechBase: TechBase
  ): UnitConfiguration {
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
    
    return {
      ...config,
      techProgression: {
        ...currentTechProgression,
        [techProperty]: newTechBase
      }
    };
  }

  /**
   * Get slot requirements for a configuration and category
   */
  private getSlotRequirements(
    config: UnitConfiguration,
    category: ComponentCategory
  ): any[] {
    // This would integrate with the slot calculation system
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Check if slot requirements are equal
   */
  private areSlotRequirementsEqual(oldSlots: any[], newSlots: any[]): boolean {
    return JSON.stringify(oldSlots) === JSON.stringify(newSlots);
  }

  /**
   * Find slot conflicts between old and new requirements
   */
  private findSlotConflicts(oldSlots: any[], newSlots: any[]): any[] {
    // This would implement conflict detection logic
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Displace equipment from conflicting slots
   */
  private displaceEquipmentFromConflicts(conflicts: any[]): EquipmentAllocation[] {
    // This would implement equipment displacement logic
    // For now, return empty array as placeholder
    return [];
  }
} 