/**
 * Special Component Manager - Manages BattleTech special components (Endo Steel, Ferro-Fibrous, Jump Jets)
 * Handles component lifecycle, creation, detection, and configuration transitions
 * Following SOLID principles - Single Responsibility for special component management
 */

import { EquipmentObject, EquipmentAllocation } from '../criticalSlots/CriticalSlot';
import { CriticalSection } from '../criticalSlots/CriticalSection';
import { UnitConfiguration } from '../configuration/UnitConfigurationService';
import { getArmorSlots } from '../armorCalculations';

// Types for special components
export type StructureType = 'Standard' | 'Endo Steel' | 'Endo Steel (Clan)' | 'Composite' | 'Reinforced' | 'Industrial';
export type ArmorType = 'Standard' | 'Ferro-Fibrous' | 'Ferro-Fibrous (Clan)' | 'Light Ferro-Fibrous' | 'Heavy Ferro-Fibrous' | 'Stealth' | 'Reactive' | 'Reflective' | 'Hardened';
export type JumpJetType = 'Standard Jump Jet' | 'Improved Jump Jet' | 'UMU' | 'Mechanical Jump Booster' | 'Partial Wing';

export interface SpecialEquipmentObject extends EquipmentObject {
  componentType?: 'structure' | 'armor' | 'jumpjet';
}

export interface ComponentChangeResult {
  componentsCreated: EquipmentAllocation[];
  componentsRemoved: EquipmentAllocation[];
  componentsModified: EquipmentAllocation[];
  warnings: string[];
}

export interface TransferResult {
  success: boolean;
  transferredComponents: EquipmentAllocation[];
  createdComponents: EquipmentAllocation[];
  removedComponents: EquipmentAllocation[];
  errors: string[];
}

export interface ComponentAnalysis {
  totalComponents: number;
  componentsByType: Record<string, number>;
  allocatedComponents: number;
  unallocatedComponents: number;
  duplicateIds: string[];
}

export interface SpecialComponentOptions {
  generateUniqueIds: boolean;
  enforceSlotLimits: boolean;
  autoTransferOnChange: boolean;
  validatePlacement: boolean;
}

/**
 * Special Component Manager Service
 * Centralized management of BattleTech special components with lifecycle management
 */
export class SpecialComponentManager {
  
  private static globalComponentCounter: number = 0;
  private options: SpecialComponentOptions;
  
  constructor(options?: Partial<SpecialComponentOptions>) {
    this.options = {
      generateUniqueIds: true,
      enforceSlotLimits: true,
      autoTransferOnChange: true,
      validatePlacement: true,
      ...options
    };
    
    console.log('[SpecialComponentManager] Initialized with options:', this.options);
  }
  
  /**
   * Initialize special components for a unit configuration
   * FACTORY PATTERN: Components are created exactly once based on configuration
   */
  initializeSpecialComponents(configuration: UnitConfiguration): EquipmentAllocation[] {
    console.log('[SpecialComponentManager] FACTORY: Initializing special components for unit creation');
    console.log('[SpecialComponentManager] Structure type:', configuration.structureType);
    console.log('[SpecialComponentManager] Armor type:', configuration.armorType);
    console.log('[SpecialComponentManager] Jump MP:', configuration.jumpMP);
    
    const components: EquipmentAllocation[] = [];
    
    // Create structure components if needed
    const structureSlots = this.getStructureCriticalSlots(configuration.structureType);
    if (structureSlots > 0) {
      console.log(`[SpecialComponentManager] FACTORY: Creating ${structureSlots} structure components for ${configuration.structureType}`);
      const structureComponents = this.createStructureComponents(configuration.structureType, structureSlots);
      components.push(...this.wrapComponentsAsAllocations(structureComponents));
    }
    
    // Create armor components if needed
    const armorSlots = this.getArmorCriticalSlots(configuration.armorType, configuration.techBase);
    if (armorSlots > 0) {
      console.log(`[SpecialComponentManager] FACTORY: Creating ${armorSlots} armor components for ${configuration.armorType}`);
      const armorComponents = this.createArmorComponents(configuration.armorType, armorSlots);
      components.push(...this.wrapComponentsAsAllocations(armorComponents));
    }
    
    // Create jump jet components if needed
    if (configuration.jumpMP > 0) {
      console.log(`[SpecialComponentManager] FACTORY: Creating ${configuration.jumpMP} jump jet components`);
      const jumpJetComponents = this.createJumpJetComponents(
        configuration.jumpJetType, 
        configuration.jumpMP, 
        configuration.tonnage,
        configuration.techBase
      );
      components.push(...this.wrapComponentsAsAllocations(jumpJetComponents));
    }
    
    console.log(`[SpecialComponentManager] FACTORY: Special component initialization complete. Created ${components.length} components`);
    return components;
  }
  
  /**
   * Handle configuration changes for special components
   * ULTIMATE FIX: Always clear ALL special components and recreate from scratch
   */
  handleConfigurationChange(
    oldConfig: UnitConfiguration, 
    newConfig: UnitConfiguration,
    sections: Map<string, CriticalSection>,
    unallocatedEquipment: EquipmentAllocation[]
  ): ComponentChangeResult {
    console.log('[SpecialComponentManager] ULTIMATE FIX: Handling special component configuration change');
    
    const result: ComponentChangeResult = {
      componentsCreated: [],
      componentsRemoved: [],
      componentsModified: [],
      warnings: []
    };
    
    // ULTIMATE FIX: Clear ALL special components first to ensure clean slate
    console.log('[SpecialComponentManager] ULTIMATE FIX: Clearing ALL special components');
    const removedComponents = this.clearAllSpecialComponents(sections, unallocatedEquipment);
    result.componentsRemoved = removedComponents;
    
    // Now recreate exactly what's needed for the new configuration
    console.log('[SpecialComponentManager] ULTIMATE FIX: Creating components for new configuration');
    const newComponents = this.initializeSpecialComponents(newConfig);
    result.componentsCreated = newComponents;
    
    console.log(`[SpecialComponentManager] ULTIMATE FIX: Special component update complete. Created: ${newComponents.length}, Removed: ${removedComponents.length}`);
    
    return result;
  }
  
  /**
   * Create structure component equipment pieces
   */
  createStructureComponents(structureType: StructureType, requiredSlots: number): SpecialEquipmentObject[] {
    console.log(`[SpecialComponentManager] Creating ${requiredSlots} structure components for ${structureType}`);
    
    return Array.from({ length: requiredSlots }, (_, index) => ({
      id: this.generateUniqueComponentId(structureType, index),
      name: structureType,
      type: 'equipment' as const,
      requiredSlots: 1,
      weight: 0,
      techBase: structureType.includes('Clan') ? 'Clan' : 'Inner Sphere',
      componentType: 'structure' as const,
      isGrouped: false
    }));
  }
  
  /**
   * Create armor component equipment pieces
   */
  createArmorComponents(armorType: ArmorType, requiredSlots: number): SpecialEquipmentObject[] {
    console.log(`[SpecialComponentManager] Creating ${requiredSlots} armor components for ${armorType}`);
    
    return Array.from({ length: requiredSlots }, (_, index) => ({
      id: this.generateUniqueComponentId(armorType, index),
      name: armorType,
      type: 'equipment' as const,
      requiredSlots: 1,
      weight: 0,
      techBase: armorType.includes('Clan') ? 'Clan' : 'Inner Sphere',
      componentType: 'armor' as const,
      isGrouped: false
    }));
  }
  
  /**
   * Create jump jet component equipment pieces
   */
  createJumpJetComponents(
    jumpJetType: JumpJetType, 
    jumpMP: number, 
    tonnage: number,
    techBase: string
  ): SpecialEquipmentObject[] {
    console.log(`[SpecialComponentManager] Creating ${jumpMP} jump jet components for ${jumpJetType}`);
    
    try {
      // Import jump jet calculations
      const { calculateJumpJetWeight, calculateJumpJetCriticalSlots, JUMP_JET_VARIANTS } = require('../jumpJetCalculations');
      
      const variant = JUMP_JET_VARIANTS[jumpJetType];
      if (!variant) {
        console.warn(`[SpecialComponentManager] Unknown jump jet type: ${jumpJetType}`);
        return [];
      }
      
      // Define location restrictions for jump jets
      const jumpJetLocations = ['Center Torso', 'Left Torso', 'Right Torso', 'Left Leg', 'Right Leg'];
      
      return Array.from({ length: jumpMP }, (_, index) => ({
        id: this.generateUniqueComponentId(jumpJetType, index),
        name: variant.name,
        type: 'equipment' as const,
        requiredSlots: calculateJumpJetCriticalSlots(jumpJetType, tonnage),
        weight: calculateJumpJetWeight(jumpJetType, tonnage),
        techBase: variant.techBase === 'Both' ? techBase : variant.techBase,
        heat: variant.heatGeneration || 0,
        allowedLocations: jumpJetLocations,
        componentType: 'jumpjet' as const,
        isGrouped: false
      }));
    } catch (error) {
      console.error('[SpecialComponentManager] Error creating jump jet components:', error);
      return [];
    }
  }
  
  /**
   * Comprehensive detection of special components
   * Detects by component type, name patterns, and IDs to catch ALL variants
   */
  isSpecialComponent(equipment: EquipmentObject): boolean {
    const specialEq = equipment as SpecialEquipmentObject;
    const name = equipment.name.toLowerCase();
    const id = equipment.id.toLowerCase();
    
    // Check by componentType field (preferred method)
    if (specialEq.componentType === 'structure' || 
        specialEq.componentType === 'armor' || 
        specialEq.componentType === 'jumpjet') {
      return true;
    }
    
    // Check by name patterns for structure types
    const structureTypes = [
      'endo steel', 'endosteel', 'endo_steel',
      'composite', 'reinforced', 'industrial'
    ];
    
    // Check by name patterns for armor types  
    const armorTypes = [
      'ferro-fibrous', 'ferrofibrous', 'ferro_fibrous',
      'light ferro', 'heavy ferro', 'stealth', 'reactive', 'reflective', 'hardened'
    ];
    
    // Check by name patterns for jump jets
    const jumpJetTypes = [
      'jump', 'umu', 'booster', 'wing'
    ];
    
    // Check if name matches any special component pattern
    const isStructure = structureTypes.some(type => name.includes(type));
    const isArmor = armorTypes.some(type => name.includes(type));
    const isJumpJet = jumpJetTypes.some(type => name.includes(type));
    
    // Check if ID matches special component pattern
    const hasSpecialId = id.includes('piece') || id.includes('endo') || id.includes('ferro') || id.includes('jump');
    
    return isStructure || isArmor || isJumpJet || hasSpecialId;
  }
  
  /**
   * Get the type of special component
   */
  getSpecialComponentType(equipment: EquipmentObject): 'structure' | 'armor' | 'jumpjet' | null {
    const specialEq = equipment as SpecialEquipmentObject;
    
    // Check componentType field first
    if (specialEq.componentType) {
      return specialEq.componentType;
    }
    
    // Fallback to name-based detection
    const name = equipment.name.toLowerCase();
    
    if (name.includes('endo') || name.includes('composite') || name.includes('reinforced')) {
      return 'structure';
    }
    
    if (name.includes('ferro') || name.includes('stealth') || name.includes('reactive') || name.includes('reflective')) {
      return 'armor';
    }
    
    if (name.includes('jump') || name.includes('umu') || name.includes('booster') || name.includes('wing')) {
      return 'jumpjet';
    }
    
    return null;
  }
  
  /**
   * Clear all special components from sections and unallocated equipment
   * ULTIMATE FIX: Clear from BOTH unallocated AND allocated slots using comprehensive detection
   */
  clearAllSpecialComponents(
    sections: Map<string, CriticalSection>,
    unallocatedEquipment: EquipmentAllocation[]
  ): EquipmentAllocation[] {
    console.log('[SpecialComponentManager] ULTIMATE FIX: Clearing ALL special components using comprehensive detection');
    
    const removedComponents: EquipmentAllocation[] = [];
    
    // Remove ALL special components from unallocated equipment
    const beforeUnallocated = unallocatedEquipment.length;
    const unallocatedToRemove = unallocatedEquipment.filter(eq => this.isSpecialComponent(eq.equipmentData));
    removedComponents.push(...unallocatedToRemove);
    
    // Clear unallocated array of special components
    const filteredUnallocated = unallocatedEquipment.filter(eq => !this.isSpecialComponent(eq.equipmentData));
    unallocatedEquipment.length = 0;
    unallocatedEquipment.push(...filteredUnallocated);
    
    const afterUnallocated = unallocatedEquipment.length;
    
    // Remove ALL special components from ALLOCATED slots across all sections
    let removedFromSlots = 0;
    sections.forEach(section => {
      const equipmentToRemove = section.getAllEquipment().filter(eq => 
        this.isSpecialComponent(eq.equipmentData)
      );
      
      equipmentToRemove.forEach(eq => {
        const removed = section.removeEquipmentGroup(eq.equipmentGroupId);
        if (removed) {
          removedComponents.push(removed);
          removedFromSlots++;
        }
      });
    });
    
    console.log(`[SpecialComponentManager] ULTIMATE FIX: Cleared ALL special components:`);
    console.log(`  - From unallocated: ${beforeUnallocated - afterUnallocated} (${beforeUnallocated} → ${afterUnallocated})`);
    console.log(`  - From allocated slots: ${removedFromSlots}`);
    console.log(`  - Total cleared: ${removedComponents.length}`);
    
    return removedComponents;
  }
  
  /**
   * Clear special components of a specific type
   */
  clearSpecialComponentsByType(
    componentType: 'structure' | 'armor' | 'jumpjet',
    sections: Map<string, CriticalSection>,
    unallocatedEquipment: EquipmentAllocation[]
  ): EquipmentAllocation[] {
    console.log(`[SpecialComponentManager] Clearing ${componentType} components`);
    
    const removedComponents: EquipmentAllocation[] = [];
    const beforeCount = unallocatedEquipment.length;
    
    // Remove from unallocated equipment
    const unallocatedToRemove = unallocatedEquipment.filter(eq => {
      const specialEq = eq.equipmentData as SpecialEquipmentObject;
      return this.getSpecialComponentType(eq.equipmentData) === componentType;
    });
    removedComponents.push(...unallocatedToRemove);
    
    // Filter unallocated equipment
    const filteredUnallocated = unallocatedEquipment.filter(eq => 
      this.getSpecialComponentType(eq.equipmentData) !== componentType
    );
    unallocatedEquipment.length = 0;
    unallocatedEquipment.push(...filteredUnallocated);
    
    // Remove from allocated slots across all sections
    let removedFromSlots = 0;
    sections.forEach(section => {
      const equipmentToRemove = section.getAllEquipment().filter(eq => 
        this.getSpecialComponentType(eq.equipmentData) === componentType
      );
      
      equipmentToRemove.forEach(eq => {
        const removed = section.removeEquipmentGroup(eq.equipmentGroupId);
        if (removed) {
          removedComponents.push(removed);
          removedFromSlots++;
        }
      });
    });
    
    const afterCount = unallocatedEquipment.length;
    console.log(`[SpecialComponentManager] Cleared ${componentType} components:`);
    console.log(`  - From unallocated: ${beforeCount - afterCount}`);
    console.log(`  - From allocated slots: ${removedFromSlots}`);
    console.log(`  - Total cleared: ${removedComponents.length}`);
    
    return removedComponents;
  }
  
  /**
   * Transfer special components between types with validation
   */
  transferSpecialComponents(
    oldType: StructureType | ArmorType,
    newType: StructureType | ArmorType,
    componentType: 'structure' | 'armor',
    oldSlots: number,
    newSlots: number,
    sections: Map<string, CriticalSection>,
    unallocatedEquipment: EquipmentAllocation[]
  ): TransferResult {
    console.log(`[SpecialComponentManager] TRANSFER: Starting component transfer for ${componentType}: ${oldType} -> ${newType}`);
    
    const result: TransferResult = {
      success: true,
      transferredComponents: [],
      createdComponents: [],
      removedComponents: [],
      errors: []
    };
    
    try {
      // Collect all existing components of this type (allocated + unallocated)
      const existingComponents = this.collectExistingSpecialComponents(oldType, componentType, sections, unallocatedEquipment);
      console.log(`[SpecialComponentManager] TRANSFER: Found ${existingComponents.length} existing components`);
      
      // Remove existing components from their current locations
      const removedComponents = this.removeSpecialComponentsByName(oldType, componentType, sections, unallocatedEquipment);
      result.removedComponents = removedComponents;
      
      if (newSlots === 0) {
        // Configuration no longer requires special components
        console.log(`[SpecialComponentManager] TRANSFER: New type ${newType} requires no slots, components removed`);
        return result;
      }
      
      // Transfer/adjust components to match new requirements
      if (newSlots === existingComponents.length) {
        // Same number of slots: just update component properties and place in unallocated
        console.log(`[SpecialComponentManager] TRANSFER: Same slot count, updating component properties`);
        this.updateComponentProperties(existingComponents, newType, componentType);
        result.transferredComponents = existingComponents;
        // Place updated components in unallocated pool for user to re-assign
        unallocatedEquipment.push(...existingComponents);
      } else if (newSlots < existingComponents.length) {
        // Fewer slots needed: keep first N components, update properties
        console.log(`[SpecialComponentManager] TRANSFER: Fewer slots needed (${newSlots}), keeping first ${newSlots} components`);
        const keptComponents = existingComponents.slice(0, newSlots);
        this.updateComponentProperties(keptComponents, newType, componentType);
        result.transferredComponents = keptComponents;
        // Place kept components in unallocated pool for user to re-assign
        unallocatedEquipment.push(...keptComponents);
      } else {
        // More slots needed: keep all existing + create additional
        console.log(`[SpecialComponentManager] TRANSFER: More slots needed (${newSlots}), creating ${newSlots - existingComponents.length} additional components`);
        this.updateComponentProperties(existingComponents, newType, componentType);
        result.transferredComponents = existingComponents;
        // Place existing components in unallocated pool
        unallocatedEquipment.push(...existingComponents);
        
        // Create additional components needed
        const additionalCount = newSlots - existingComponents.length;
        const additionalComponents = componentType === 'structure' 
          ? this.createStructureComponents(newType as StructureType, additionalCount)
          : this.createArmorComponents(newType as ArmorType, additionalCount);
        
        const additionalAllocations = this.wrapComponentsAsAllocations(additionalComponents);
        result.createdComponents = additionalAllocations;
        unallocatedEquipment.push(...additionalAllocations);
      }
      
      console.log(`[SpecialComponentManager] TRANSFER: Complete. Transferred: ${result.transferredComponents.length}, Created: ${result.createdComponents.length}`);
      
    } catch (error) {
      console.error(`[SpecialComponentManager] TRANSFER: Error during transfer:`, error);
      result.success = false;
      result.errors.push(`Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return result;
  }
  
  /**
   * Collect all existing special components (allocated + unallocated)
   */
  private collectExistingSpecialComponents(
    type: StructureType | ArmorType,
    componentType: 'structure' | 'armor',
    sections: Map<string, CriticalSection>,
    unallocatedEquipment: EquipmentAllocation[]
  ): EquipmentAllocation[] {
    const components: EquipmentAllocation[] = [];
    
    // Collect from unallocated equipment
    unallocatedEquipment.forEach(eq => {
      const specialEq = eq.equipmentData as SpecialEquipmentObject;
      if (specialEq.name === type && specialEq.componentType === componentType) {
        components.push(eq);
      }
    });
    
    // Collect from critical slots across all sections
    sections.forEach(section => {
      section.getAllEquipment().forEach(eq => {
        const specialEq = eq.equipmentData as SpecialEquipmentObject;
        if (specialEq.name === type && specialEq.componentType === componentType) {
          components.push(eq);
        }
      });
    });
    
    return components;
  }
  
  /**
   * Remove special components by name and type
   */
  private removeSpecialComponentsByName(
    type: StructureType | ArmorType,
    componentType: 'structure' | 'armor',
    sections: Map<string, CriticalSection>,
    unallocatedEquipment: EquipmentAllocation[]
  ): EquipmentAllocation[] {
    const removedComponents: EquipmentAllocation[] = [];
    
    // Remove from unallocated equipment
    const unallocatedToRemove = unallocatedEquipment.filter(eq => {
      const specialEq = eq.equipmentData as SpecialEquipmentObject;
      return specialEq.name === type && specialEq.componentType === componentType;
    });
    removedComponents.push(...unallocatedToRemove);
    
    const filteredUnallocated = unallocatedEquipment.filter(eq => {
      const specialEq = eq.equipmentData as SpecialEquipmentObject;
      return !(specialEq.name === type && specialEq.componentType === componentType);
    });
    unallocatedEquipment.length = 0;
    unallocatedEquipment.push(...filteredUnallocated);
    
    // Remove from critical slots across all sections
    sections.forEach(section => {
      const equipmentToRemove = section.getAllEquipment().filter(eq => {
        const specialEq = eq.equipmentData as SpecialEquipmentObject;
        return specialEq.name === type && specialEq.componentType === componentType;
      });
      
      equipmentToRemove.forEach(eq => {
        const removed = section.removeEquipmentGroup(eq.equipmentGroupId);
        if (removed) {
          removedComponents.push(removed);
        }
      });
    });
    
    return removedComponents;
  }
  
  /**
   * Update properties of existing components to match new type
   */
  private updateComponentProperties(
    components: EquipmentAllocation[],
    newType: StructureType | ArmorType,
    componentType: 'structure' | 'armor'
  ): void {
    components.forEach((allocation, index) => {
      // Update the equipment data properties
      const updatedEquipmentData: SpecialEquipmentObject = {
        ...allocation.equipmentData,
        id: this.generateUniqueComponentId(newType, index),
        name: newType,
        techBase: newType.includes('Clan') ? 'Clan' : 'Inner Sphere',
        componentType
      };
      
      // Update the allocation
      allocation.equipmentData = updatedEquipmentData;
      allocation.equipmentGroupId = `${updatedEquipmentData.id}_group`;
      allocation.location = '';
      allocation.startSlotIndex = -1;
      allocation.endSlotIndex = -1;
      allocation.occupiedSlots = [];
    });
  }
  
  /**
   * Wrap special equipment objects as allocations
   */
  private wrapComponentsAsAllocations(components: SpecialEquipmentObject[]): EquipmentAllocation[] {
    return components.map(component => ({
      equipmentData: component,
      equipmentGroupId: `${component.id}_group`,
      location: '',
      startSlotIndex: -1,
      endSlotIndex: -1,
      occupiedSlots: []
    }));
  }
  
  /**
   * Generate unique component ID
   */
  private generateUniqueComponentId(type: string, index: number): string {
    if (this.options.generateUniqueIds) {
      SpecialComponentManager.globalComponentCounter++;
      const timestamp = Date.now();
      const cleanType = type.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '');
      return `${cleanType}_piece_${index + 1}_${SpecialComponentManager.globalComponentCounter}_${timestamp}`;
    } else {
      const cleanType = type.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '');
      return `${cleanType}_piece_${index + 1}`;
    }
  }
  
  /**
   * Get critical slot requirements for structure type
   */
  getStructureCriticalSlots(structureType: StructureType): number {
    const structureSlotMap: Record<StructureType, number> = {
      'Standard': 0,
      'Endo Steel': 14,
      'Endo Steel (Clan)': 7,
      'Composite': 0,
      'Reinforced': 0,
      'Industrial': 0
    };
    return structureSlotMap[structureType] || 0;
  }
  
  /**
   * Get critical slot requirements for armor type
   */
  getArmorCriticalSlots(armorType: ArmorType, techBase: string): number {
    try {
      // Type-safe tech base validation
      const validTechBases = ['Inner Sphere', 'Clan', 'Both'];
      const safeTechBase = validTechBases.includes(techBase) ? techBase : 'Inner Sphere';
      
      // Call external function with validated parameters
      return getArmorSlots(armorType, safeTechBase) || 0;
    } catch (error) {
      // Fallback for armor types not in the armor calculations
      const armorSlotMap: Record<ArmorType, number> = {
        'Standard': 0,
        'Ferro-Fibrous': 14,
        'Ferro-Fibrous (Clan)': 7,
        'Light Ferro-Fibrous': 7,
        'Heavy Ferro-Fibrous': 21,
        'Stealth': 12,
        'Reactive': 14,
        'Reflective': 10,
        'Hardened': 0  // Hardened armor takes 0 slots
      };
      return armorSlotMap[armorType] || 0;
    }
  }
  
  /**
   * Analyze special components in the unit
   */
  analyzeSpecialComponents(
    sections: Map<string, CriticalSection>,
    unallocatedEquipment: EquipmentAllocation[]
  ): ComponentAnalysis {
    const analysis: ComponentAnalysis = {
      totalComponents: 0,
      componentsByType: {},
      allocatedComponents: 0,
      unallocatedComponents: 0,
      duplicateIds: []
    };
    
    const allComponents: EquipmentAllocation[] = [];
    const componentIds: string[] = [];
    
    // Collect from unallocated equipment
    unallocatedEquipment.forEach(eq => {
      if (this.isSpecialComponent(eq.equipmentData)) {
        allComponents.push(eq);
        componentIds.push(eq.equipmentGroupId);
        analysis.unallocatedComponents++;
        
        const type = this.getSpecialComponentType(eq.equipmentData) || 'unknown';
        analysis.componentsByType[type] = (analysis.componentsByType[type] || 0) + 1;
      }
    });
    
    // Collect from allocated slots
    sections.forEach(section => {
      section.getAllEquipment().forEach(eq => {
        if (this.isSpecialComponent(eq.equipmentData)) {
          allComponents.push(eq);
          componentIds.push(eq.equipmentGroupId);
          analysis.allocatedComponents++;
          
          const type = this.getSpecialComponentType(eq.equipmentData) || 'unknown';
          analysis.componentsByType[type] = (analysis.componentsByType[type] || 0) + 1;
        }
      });
    });
    
    analysis.totalComponents = allComponents.length;
    
    // Check for duplicate IDs
    const uniqueIds = new Set(componentIds);
    if (componentIds.length !== uniqueIds.size) {
      const duplicates = componentIds.filter((id, index, arr) => arr.indexOf(id) !== index);
      analysis.duplicateIds = Array.from(new Set(duplicates));
    }
    
    return analysis;
  }
}

// Singleton instance for global use
let globalSpecialComponentManager: SpecialComponentManager | null = null;

/**
 * Get or create global special component manager
 */
export function getSpecialComponentManager(): SpecialComponentManager {
  if (!globalSpecialComponentManager) {
    globalSpecialComponentManager = new SpecialComponentManager();
  }
  return globalSpecialComponentManager;
}

/**
 * Initialize global special component manager with specific options
 */
export function initializeSpecialComponentManager(options: Partial<SpecialComponentOptions>): SpecialComponentManager {
  globalSpecialComponentManager = new SpecialComponentManager(options);
  return globalSpecialComponentManager;
}

/**
 * Reset global special component manager (for testing)
 */
export function resetSpecialComponentManager(): void {
  globalSpecialComponentManager = null;
}
