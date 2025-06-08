export interface MountedEquipmentDto {
  mounted_equipment_id: number; // PK
  unit_id: number; // FK to UnitDto ID
  equipment_id: number; // FK to EquipmentDefinitionDto ID
  equipment_internal_name: string; // Convenience field, from EquipmentDefinitionDto.internal_name
  equipment_display_name: string; // Convenience field, from EquipmentDefinitionDto.display_name
  location_id?: number; // FK to UnitLocationDto ID, null if unallocated (e.g. in an OmniPod not yet assigned to a location)
  location_name?: string; // Convenience field, from UnitLocationDto.location_name, null if unallocated
  is_rear_mounted?: boolean; // True if equipment is mounted facing rear (e.g. rear laser)
  is_turret_mounted?: boolean; // True if equipment is in a turret (relevant for vehicles)
  is_pod_mounted?: boolean; // True if this is part of an OmniPod configuration
  is_armored_component?: boolean; // True if this component is itself armored (e.g. Armored Engine)

  // Ammo-specific fields
  current_shots?: number; // Current ammunition count for this specific mounted ammo item

  // Variable size equipment fields
  variable_size_value?: number; // Actual value for equipment where size can vary (e.g. tons of Ferro-Fibrous)

  // Linked equipment (e.g. Artemis IV linked to an LRM launcher)
  linked_to_weapon_id?: number; // FK to another MountedEquipmentDto ID (e.g., Artemis IV linked to an LRM)

  // Runtime status fields (useful for UI display during a 'session' or if the DTO represents a unit's current state in a game)
  is_damaged?: boolean; // Component has taken damage but is not yet destroyed
  is_destroyed?: boolean; // Component is destroyed and non-functional
  is_missing?: boolean; // Component is missing (e.g. due to critical hit blowing it off, or pod space not filled)
  is_jammed?: boolean; // Weapon-specific: weapon is currently jammed
  is_breached?: boolean; // Component is breached (e.g. CASE breach, engine shielding breach)
  is_dumping?: boolean; // Ammo-specific: ammo is currently being dumped
  is_fired_this_turn?: boolean; // Weapon-specific: weapon has been fired this turn
}
