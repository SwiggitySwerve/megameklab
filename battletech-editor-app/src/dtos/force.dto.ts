import { UnitDto } from './unit.dto';

export interface ForceUnitDto {
  force_unit_id: number; // PK of the force_units table entry (link table or specific force unit record)
  unit: UnitDto; // The full DTO of the unit.
  custom_unit_name_in_force?: string; // Custom name or callsign for this unit within this specific force
  pilot_name?: string; // Name of the pilot assigned to this unit in this force
  gunnery_skill_override?: number; // Override for the unit's default or crew's gunnery skill
  piloting_skill_override?: number; // Override for the unit's default or crew's piloting skill
  unit_role_in_force?: string; // e.g., "Commander", "Scout", "Line Trooper"
  display_order?: number; // Optional field to control display order in UI lists
}

export interface ForceDto {
  force_id: number; // PK
  force_name: string;
  faction?: string; // e.g., "Davion", "Kurita", "Clan Wolf"
  rules_level?: string; // Rules level for the force, could be inherited from units or set force-wide
  description?: string; // User-provided description for the force
  user_id?: number; // Optional: If forces are tied to specific users
  units: ForceUnitDto[]; // Array of units that make up this force
}
