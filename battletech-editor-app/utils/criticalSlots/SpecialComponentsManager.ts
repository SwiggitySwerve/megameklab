/**
 * Special Components Manager
 * Handles structure, armor, and special component allocation and management
 * Extracted from UnitCriticalManager.ts for better organization
 */

import { CriticalSection } from './CriticalSection'
import { EquipmentObject, EquipmentAllocation } from './CriticalSlot'
import { 
  UnitConfiguration, 
  StructureType, 
  ArmorType, 
  SpecialEquipmentObject 
} from './UnitCriticalManagerTypes'
import { getComponentDefinition } from '../../types/componentConfiguration';

export class SpecialComponentsManager {
  private sections: Map<string, CriticalSection>
  private unallocatedEquipment: EquipmentAllocation[]
  public configuration: UnitConfiguration
  private specialComponentsInitialized: boolean = false
  private static globalComponentCounter: number = 0

  constructor(
    sections: Map<string, CriticalSection>,
    unallocatedEquipment: EquipmentAllocation[],
    configuration: UnitConfiguration
  ) {
    this.sections = sections
    this.unallocatedEquipment = unallocatedEquipment
    this.configuration = configuration
  }

  /**
   * Type guard to safely access componentType property on equipment
   */
  private static hasComponentType(equipment: EquipmentObject): equipment is EquipmentObject & { componentType: string } {
    return 'componentType' in equipment && typeof (equipment as EquipmentObject & { componentType: unknown }).componentType === 'string'
  }

  /**
   * Safely get componentType from equipment
   */
  private static getComponentType(equipment: EquipmentObject): string | undefined {
    return SpecialComponentsManager.hasComponentType(equipment) ? equipment.componentType : undefined
  }

  /**
   * Get critical slots required for armor type
   */
  private getArmorCriticalSlots(armorType: ArmorType): number {
    const def = getComponentDefinition('armor', armorType);
    return def?.slots ?? 0;
  }

  /**
   * Get critical slots required for structure type
   */
  private getStructureCriticalSlots(structureType: StructureType): number {
    const def = getComponentDefinition('structure', structureType);
    return def?.slots ?? 0;
  }

  /**
   * Initialize special components (structure and armor)
   */
  initializeSpecialComponents(): void {
    const structureType = this.getStructureTypeString()
    const armorType = this.getArmorTypeString()

    // Always clear all special components before adding
    this.clearSpecialComponentsByType('structure')
    this.clearSpecialComponentsByType('armor')

    // Add structure components for the required slot count
    const structureSlots = this.getStructureCriticalSlots(structureType)
    if (structureSlots > 0) {
      this.addSpecialComponents(structureType, 'structure', structureSlots)
    }

    // Add armor components for the required slot count
    const armorSlots = this.getArmorCriticalSlots(armorType)
    if (armorSlots > 0) {
      this.addSpecialComponents(armorType, 'armor', armorSlots)
    }
  }

  /**
   * Handle special component configuration changes
   */
  handleSpecialComponentConfigurationChange(
    oldConfig: UnitConfiguration, 
    newConfig: UnitConfiguration
  ): void {
    const oldStructureType = this.getStructureTypeStringFromConfig(oldConfig)
    const newStructureType = this.getStructureTypeStringFromConfig(newConfig)
    const oldArmorType = this.getArmorTypeStringFromConfig(oldConfig)
    const newArmorType = this.getArmorTypeStringFromConfig(newConfig)

    // Handle structure type changes
    if (oldStructureType !== newStructureType) {
      this.updateSpecialComponents(oldStructureType, newStructureType, 'structure')
    }

    // Handle armor type changes
    if (oldArmorType !== newArmorType) {
      this.updateSpecialComponents(oldArmorType, newArmorType, 'armor')
    }
  }

  /**
   * Update special components when type changes
   */
  private updateSpecialComponents(
    oldType: StructureType | ArmorType,
    newType: StructureType | ArmorType,
    componentType: 'structure' | 'armor'
  ): void {
    // Always clear all special components of this type before adding new ones
    this.clearSpecialComponentsByType(componentType);

    const newSlots = componentType === 'structure'
      ? this.getStructureCriticalSlots(newType as StructureType)
      : this.getArmorCriticalSlots(newType as ArmorType)

    if (newSlots > 0) {
      this.addSpecialComponents(newType, componentType, newSlots)
    }
  }

  /**
   * Clear all special components of a specific type
   */
  private clearSpecialComponentsByType(componentType: 'structure' | 'armor'): void {
    const componentsToRemove: EquipmentAllocation[] = []

    // Find all special components of this type
    for (const allocation of this.unallocatedEquipment) {
      const specialEq = allocation.equipmentData as SpecialEquipmentObject
      if (specialEq.componentType === componentType) {
        componentsToRemove.push(allocation)
      }
    }

    // Remove from unallocated equipment
    for (const component of componentsToRemove) {
      const index = this.unallocatedEquipment.findIndex(
        eq => eq.equipmentGroupId === component.equipmentGroupId
      )
      if (index !== -1) {
        this.unallocatedEquipment.splice(index, 1)
      }
    }

    // Remove from allocated equipment in all sections
    for (const section of Array.from(this.sections.values())) {
      const slots = section.getAllSlots()
      for (const slot of slots) {
        if (slot.hasEquipment() && slot.content?.equipmentReference) {
          const equipment = slot.content.equipmentReference
          const specialEq = equipment.equipmentData as SpecialEquipmentObject
          if (specialEq.componentType === componentType) {
            slot.clearSlot()
          }
        }
      }
    }
  }

  /**
   * Transfer special components when slot count changes
   */
  private transferSpecialComponents(
    oldType: StructureType | ArmorType,
    newType: StructureType | ArmorType,
    componentType: 'structure' | 'armor',
    oldSlots: number,
    newSlots: number
  ): void {
    // Collect existing components
    const existingComponents = this.collectExistingSpecialComponents(oldType, componentType)
    
    // Remove old components
    this.removeSpecialComponents(oldType, componentType)
    
    // Add new components
    this.addSpecialComponents(newType, componentType, newSlots)
    
    // Update properties of new components to match old ones
    const newComponents = this.collectExistingSpecialComponents(newType, componentType)
    if (existingComponents.length > 0 && newComponents.length > 0) {
      // Transfer properties from old to new (e.g., location, slot assignments)
      for (let i = 0; i < Math.min(existingComponents.length, newComponents.length); i++) {
        const oldComponent = existingComponents[i]
        const newComponent = newComponents[i]
        
                 // Copy location and slot information if available
         if (oldComponent.location && oldComponent.startSlotIndex !== -1) {
           // Try to place new component in same location
           const section = this.sections.get(oldComponent.location)
           if (section) {
             const slot = section.getSlot(oldComponent.startSlotIndex)
             if (slot && slot.isEmpty()) {
               slot.allocateEquipment(newComponent, newComponent.equipmentGroupId)
               // Remove from unallocated
               const index = this.unallocatedEquipment.findIndex(
                 eq => eq.equipmentGroupId === newComponent.equipmentGroupId
               )
               if (index !== -1) {
                 this.unallocatedEquipment.splice(index, 1)
               }
             }
           }
         }
      }
    }
  }

  /**
   * Collect existing special components of a specific type
   */
  private collectExistingSpecialComponents(
    type: StructureType | ArmorType,
    componentType: 'structure' | 'armor'
  ): EquipmentAllocation[] {
    const components: EquipmentAllocation[] = []

    // Check unallocated equipment
    for (const allocation of this.unallocatedEquipment) {
      const specialEq = allocation.equipmentData as SpecialEquipmentObject
      if (specialEq.componentType === componentType && 
          specialEq.name.toLowerCase().includes(type.toLowerCase().replace(/\s+/g, ''))) {
        components.push(allocation)
      }
    }

    // Check allocated equipment in all sections
    for (const section of Array.from(this.sections.values())) {
      const slots = section.getAllSlots()
      for (const slot of slots) {
        if (slot.hasEquipment() && slot.content?.equipmentReference) {
          const equipment = slot.content.equipmentReference
          const specialEq = equipment.equipmentData as SpecialEquipmentObject
          if (specialEq.componentType === componentType && 
              specialEq.name.toLowerCase().includes(type.toLowerCase().replace(/\s+/g, ''))) {
            components.push(equipment)
          }
        }
      }
    }

    return components
  }

  /**
   * Update component properties when type changes
   */
  private updateComponentProperties(
    oldType: StructureType | ArmorType,
    newType: StructureType | ArmorType,
    componentType: 'structure' | 'armor'
  ): void {
    const components = this.collectExistingSpecialComponents(oldType, componentType)
    
    for (const component of components) {
      const specialEq = component.equipmentData as SpecialEquipmentObject
      
             // Update the component name and properties
       specialEq.name = this.createSpecialComponentName(newType, componentType)
      
      // Update any other type-specific properties
      if (componentType === 'structure') {
        // Update structure-specific properties
        specialEq.weight = this.getStructureWeight(newType as StructureType, this.configuration.tonnage)
      } else {
        // Update armor-specific properties
        specialEq.weight = this.getArmorWeight(newType as ArmorType, this.configuration.armorTonnage)
      }
    }
  }

  /**
   * Add special components of a specific type
   */
  private addSpecialComponents(type: StructureType | ArmorType, componentType: 'structure' | 'armor', requiredSlots: number): void {
    const components = this.createSpecialComponentEquipment(type, componentType, requiredSlots)
    
    for (const componentData of components) {
      const allocation: EquipmentAllocation = {
        equipmentData: componentData,
        equipmentGroupId: `special_${componentType}_${SpecialComponentsManager.globalComponentCounter++}`,
        location: '',
        startSlotIndex: -1,
        endSlotIndex: -1,
        occupiedSlots: []
      }
      
      this.unallocatedEquipment.push(allocation)
    }
  }

  /**
   * Remove special components of a specific type
   */
  private removeSpecialComponents(type: StructureType | ArmorType, componentType: 'structure' | 'armor'): void {
    this.clearSpecialComponentsByType(componentType)
  }

  /**
   * Create special component equipment objects
   */
  private createSpecialComponentEquipment(
    type: StructureType | ArmorType,
    componentType: 'structure' | 'armor',
    requiredSlots: number
  ): SpecialEquipmentObject[] {
    const components: SpecialEquipmentObject[] = []
    
    // Create individual components, one per slot (like UnitCriticalManager does)
    for (let i = 0; i < requiredSlots; i++) {
      const component: SpecialEquipmentObject = {
        id: `${componentType}_${type.toLowerCase().replace(/\s+/g, '_')}_${i + 1}`,
        name: this.createSpecialComponentName(type, componentType),
        type: 'equipment',
        techBase: 'Inner Sphere',
        requiredSlots: 1, // Each component takes 1 slot
        weight: componentType === 'structure' 
          ? this.getStructureWeight(type as StructureType, this.configuration.tonnage) / requiredSlots
          : this.getArmorWeight(type as ArmorType, this.configuration.armorTonnage) / requiredSlots,
        componentType: componentType
      }
      
      components.push(component)
    }
    
    return components
  }

  /**
   * Create special component name
   */
  private createSpecialComponentName(type: StructureType | ArmorType, componentType: 'structure' | 'armor'): string {
    if (componentType === 'structure') {
      return `${type} Structure`
    } else {
      return `${type} Armor`
    }
  }

  /**
   * Create special component description
   */
  private createSpecialComponentDescription(type: StructureType | ArmorType, componentType: 'structure' | 'armor'): string {
    if (componentType === 'structure') {
      return `${type} internal structure component`
    } else {
      return `${type} armor component`
    }
  }

  /**
   * Get structure weight based on type and tonnage
   */
  private getStructureWeight(type: StructureType, tonnage: number): number {
    switch (type) {
      case 'Endo Steel':
      case 'Endo Steel (Clan)':
        return Math.ceil(tonnage / 2) / 2 // Half weight, rounded up to nearest 0.5
      case 'Composite':
        return Math.ceil(tonnage * 0.5) / 2 // 50% weight, rounded up to nearest 0.5
      case 'Reinforced':
        return Math.ceil(tonnage * 1.5) / 2 // 150% weight, rounded up to nearest 0.5
      default:
        return Math.ceil(tonnage) / 2 // Standard weight, rounded up to nearest 0.5
    }
  }

  /**
   * Get armor weight based on type and armor tonnage
   */
  private getArmorWeight(type: ArmorType, armorTonnage: number): number {
    switch (type) {
      case 'Ferro-Fibrous':
      case 'Ferro-Fibrous (Clan)':
      case 'Light Ferro-Fibrous':
      case 'Heavy Ferro-Fibrous':
      case 'Stealth':
      case 'Reactive':
      case 'Reflective':
      case 'Hardened':
        return Math.ceil(armorTonnage * 1.2) / 2 // 20% more weight, rounded up to nearest 0.5
      default:
        return Math.ceil(armorTonnage) / 2 // Standard weight, rounded up to nearest 0.5
    }
  }

  /**
   * Get structure type as string from configuration
   */
  private getStructureTypeStringFromConfig(config: UnitConfiguration): StructureType {
    if (config.legacyStructureType) {
      return config.legacyStructureType
    }
    
    const structureType = config.structureType?.type || 'Standard'
    const techBase = config.structureType?.techBase || 'Inner Sphere'
    
    if (structureType === 'Endo Steel') {
      return techBase === 'Clan' ? 'Endo Steel (Clan)' : 'Endo Steel'
    }
    
    return structureType as StructureType
  }

  /**
   * Get armor type as string from configuration
   */
  private getArmorTypeStringFromConfig(config: UnitConfiguration): ArmorType {
    if (config.legacyArmorType) {
      return config.legacyArmorType
    }
    
    const armorType = config.armorType?.type || 'Standard'
    const techBase = config.armorType?.techBase || 'Inner Sphere'
    
    if (armorType === 'Ferro-Fibrous') {
      return techBase === 'Clan' ? 'Ferro-Fibrous (Clan)' : 'Ferro-Fibrous'
    }
    
    return armorType as ArmorType
  }

  /**
   * Get structure type as string from current configuration
   */
  private getStructureTypeString(): StructureType {
    return this.getStructureTypeStringFromConfig(this.configuration)
  }

  /**
   * Get armor type as string from current configuration
   */
  private getArmorTypeString(): ArmorType {
    return this.getArmorTypeStringFromConfig(this.configuration)
  }

  /**
   * Check if equipment is a special component
   */
  isSpecialComponent(equipment: EquipmentObject): boolean {
    const specialEq = equipment as SpecialEquipmentObject
    const name = equipment.name.toLowerCase()
    
    // Check by componentType field (preferred method)
    if (specialEq.componentType === 'structure' || specialEq.componentType === 'armor') {
      return true
    }
    
    // Check by name patterns for special components
    const specialPatterns = [
      'endo steel', 'endosteel', 'endo_steel',
      'ferro-fibrous', 'ferrofibrous', 'ferro_fibrous',
      'ferro fibrous', 'light ferro', 'heavy ferro',
      'stealth armor', 'reactive armor', 'reflective armor',
      'hardened armor', 'composite', 'reinforced'
    ]
    
    return specialPatterns.some(pattern => name.includes(pattern))
  }

  /**
   * Update reference to unallocated equipment array
   * CRITICAL FIX: Called when UnitCriticalManager creates a new unallocated equipment array
   */
  updateUnallocatedEquipmentReference(newUnallocatedEquipment: EquipmentAllocation[]): void {
    this.unallocatedEquipment = newUnallocatedEquipment
  }

  /**
   * Clear all special components
   */
  clearAllSpecialComponents(): void {
    this.clearSpecialComponentsByType('structure')
    this.clearSpecialComponentsByType('armor')
    this.specialComponentsInitialized = false
  }
} 