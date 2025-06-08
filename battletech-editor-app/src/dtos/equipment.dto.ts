export interface EquipmentDefinitionDto {
  equipment_id: number; // PK
  internal_name: string; // Unique key, e.g., "CLLargePulseLaser"
  display_name: string;
  equipment_type: string; // "Weapon", "Ammo", "Misc", "Armor", "InternalStructure", "Engine", "Gyro", "Cockpit", "HeatSink", "JumpJet", "Actuator", etc.
  tech_base: 'Inner Sphere' | 'Clan' | 'Mixed' | 'All';
  year_introduced: number;
  rules_level: string; // "Introductory", "Standard", "Advanced", "Experimental"
  tonnage: number;
  critical_slots: number; // Can be 0.5 for some items like Ferro-Fibrous armor
  cost?: number;
  battle_value?: number;
  heat?: number; // For weapons/equipment generating heat

  // Weapon-specific fields
  damage_short?: string; // e.g., "10", "2d6" (string to accommodate dice notation)
  damage_medium?: string;
  damage_long?: string;
  range_min?: number;
  range_short?: number;
  range_medium?: number;
  range_long?: number;
  weapon_flags?: string[]; // e.g., ["Pulse", "LBX", "Ultra", "Streak", "DirectFire", "IndirectFire", "Heat"]

  // Ammo-specific fields
  ammo_per_ton?: number;
  ammo_rack_size?: number; // e.g., 5 for LRM/5, 1 for AC/10 ammo. Indicates shots per slot/ton for this ammo type.
  ammo_flags?: string[]; // e.g., ["Explosive", "Inferno", "Tracer"]

  // Misc equipment fields (e.g., CASE, ECM, Targeting Computer)
  misc_flags?: string[]; // e.g., ["CASE", "TSM", "ECM", "ActiveProbe"]

  // Armor-specific fields
  armor_points_per_ton?: number; // How many armor points this type of armor provides per ton

  // Structure-specific fields
  structure_points_per_ton?: number; // How many internal structure points this type of structure provides per ton

  // Variable size fields (for items like Artemis IV, Ferro-Fibrous, etc. that can take half slots or whose size/tonnage can vary)
  is_variable_size?: boolean; // If true, this equipment can vary in size/tonnage/slots based on unit tonnage or other factors.
  variable_step_size?: number; // For items that scale, e.g. 0.5 for Ferro taking half-slots.

  // Added for refined validation support
  /**
   * Links weapon to compatible ammo types (e.g., "AC10Ammo"),
   * or ammo to weapon types it feeds (e.g., "AC10").
   * Used for validation to ensure correct ammo is loaded for weapons.
   * Can be null if not applicable (e.g. for energy weapons, or general equipment).
   */
  ammo_match_key?: string | null;
  /**
   * How many units of this specific ammo type this weapon consumes per shot.
   * Typically 1, but could be more for specific weapon/ammo combinations.
   * Relevant for weapons; null for non-weapons or ammo itself.
   */
  weapon_shot_grouping?: number | null;
  /** Can this equipment be rear-mounted? (Defaults to false in DB if not specified) */
  allow_rear_mount?: boolean;
  /** Can this equipment be turret-mounted? (Defaults to false in DB if not specified, primarily for vehicles) */
  allow_turret_mount?: boolean;
}
