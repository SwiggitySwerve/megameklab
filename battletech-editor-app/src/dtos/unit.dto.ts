import { MountedEquipmentDto } from './mounted-equipment.dto';

export interface CriticalSlotOccupantDto {
  mounted_equipment_id: number; // Matches PK of MountedEquipmentDto if it's equipment
  display_name: string; // Corresponds to equipment_display_name from MountedEquipmentDto or system name
  type: 'equipment' | 'system'; // To distinguish from fixed systems
  system_type?: string; // e.g., "Engine", "Gyro", "Actuator", only if type is 'system'
  is_armored_component?: boolean; // From MountedEquipmentDto or system's property
  is_damaged?: boolean; // Runtime status for the occupant in this slot
  is_destroyed?: boolean; // Runtime status for the occupant in this slot
  is_breached?: boolean; // Runtime status, specific to critical slot damage affecting the occupant
}

export interface CriticalSlotDto {
  critical_slot_id: number; // PK
  slot_index: number;
  occupant_1?: CriticalSlotOccupantDto;
  occupant_2?: CriticalSlotOccupantDto;
  // Slot-specific damage status, if different from occupant status, can be re-added here.
  // For now, assuming occupant status covers damage relevant to the slot's function.
}

export interface UnitLocationDto {
  location_id: number; // PK
  location_name: string;
  location_index: number;
  max_armor_front: number;
  current_armor_front: number;
  max_armor_rear?: number;
  current_armor_rear?: number;
  max_armor_internal?: number;
  current_armor_internal?: number;
  internal_structure_points: number;
  critical_slots: CriticalSlotDto[]; // Array of critical slots in this location

  // Added for refined armor representation and to reflect DB capabilities
  /** Indicates if this location type can have rear armor (e.g., torsos can, arms cannot) */
  can_have_rear_armor?: boolean;
  /** FK to equipment_definitions for the specific armor material used on this location (if location-specific armor is possible) */
  armor_equipment_id?: number | null;
  /** Convenience: Display name of the armor material (e.g., "Standard Armor", "Ferro-Fibrous") */
  armor_type_name?: string | null;
  /** Tech base of the armor material, if it can differ from the unit's overall tech base or equipment definition's default */
  armor_tech_base?: string | null;
}

export interface UnitQuirkDto {
  unit_quirk_id: number; // PK
  quirk_name: string;
  quirk_description?: string;
  /**
   * Type of quirk.
   * - 'Positive': Beneficial quirk
   * - 'Negative': Detrimental quirk
   * - 'BattleMech': Specific to BattleMechs
   * - 'Vehicle': Specific to Vehicles
   * - 'BattleArmor': Specific to BattleArmor
   * - 'Infantry': Specific to Infantry
   * - 'Aero': Specific to Aerospace units
   */
  quirk_type: 'Positive' | 'Negative' | 'BattleMech' | 'Vehicle' | 'BattleArmor' | 'Infantry' | 'Aero' | string;
  quirk_cost_modifier?: number;
}

export interface CrewMemberDto {
  crew_member_id: number; // PK
  slot_index: number;
  role: string; // e.g., "Pilot", "Gunner"
  gunnery_skill?: number;
  piloting_skill?: number;
  hits_taken?: number;
  is_conscious?: boolean;
}

export interface UnitDto {
  unit_id: number; // PK
  name: string;
  model: string;
  source_file_content?: string; // Optional for DTO, might be large
  unit_type: string; // "Mek", "Tank", etc.
  tonnage: number;
  battle_value: number;
  manual_bv?: number;
  use_manual_bv?: boolean;
  cost?: number;
  rules_level: string; // "Introductory", "Standard", etc.
  tech_base: 'Inner Sphere' | 'Clan' | 'Mixed';
  year_introduced: number;
  min_era?: string;
  max_era?: string;
  is_omni?: boolean;
  engine_type_name?: string;
  engine_rating?: number;
  gyro_type_name?: string;
  cockpit_type_name?: string;
  physical_enhancement_type_name?: string; // e.g., "TSM", "MASC"
  walk_mp?: number;
  run_mp?: number; // or cruise for vehicles/aero
  jump_mp?: number;
  jump_jet_type_name?: string;
  base_heat_sinks?: number;
  heat_sink_type_name?: string;
  fluff?: string;
  source_book?: string;
  image_url?: string;
  locations: UnitLocationDto[];
  quirks: UnitQuirkDto[];
  crew: CrewMemberDto[];
  unallocated_equipment?: any[]; // Placeholder for unallocated equipment DTOs, ideally list of MountedEquipmentDto

  // Added for aerospace unit support
  /** Maximum structural integrity points, relevant for aerospace fighters and other applicable units. */
  structural_integrity_max?: number | null;
  /** Current structural integrity points. */
  structural_integrity_current?: number | null;
}
