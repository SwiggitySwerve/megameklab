// Content for battletech-editor-app/types/customizer.ts

    export interface CriticalLocation {
      location: string; // e.g., "Head", "Center Torso"
      slots: string[]; // Array representing each slot, equipment name or "-Empty-"
    }

    export interface UnitEquipmentItem {
      item_name: string;
      item_type: string;
      location: string;
      rear_facing?: boolean;
      turret_mounted?: boolean;
      // Add other relevant fields from commonUnitSchema.json weapons_and_equipment
    }

    export interface CustomizableUnitData {
      chassis: string;
      model: string;
      mass: number;
      tech_base: string;
      era: string;
      type?: string; // Unit type from data blob (e.g. BattleMech)
      config?: string; // Biped, Quad etc.
      movement?: { walk_mp?: number; run_mp?: number; jump_mp?: number };
      armor?: { type: string; locations: Array<{ location: string; armor_points: number; rear_armor_points?: number }> };
      engine?: { type: string; rating: number };
      structure?: { type: string };
      heat_sinks?: { type: string; count: number };
      weapons_and_equipment: UnitEquipmentItem[];
      criticals: CriticalLocation[];
      [key: string]: any; // Allow other properties
    }

    export interface CustomizableUnit {
      id: string | number;
      chassis: string;
      model: string;
      mass: number; // This is mass_tons from DB, aliased as mass by API
      type: string; // Unit type from top level of API response
      data: CustomizableUnitData; // The full JSON blob
    }

    export interface EquipmentItem {
      id: string | number;
      internal_id: string;
      name: string;
      type: string;
      category: string;
      tech_base: string;
      critical_slots: number;
      tonnage: number;
      cost_cbills?: number;
      battle_value?: number;
      weapon_details?: any;
      ammo_details?: any;
      data: any; // The full JSON blob for equipment
    }

    export interface ApiListResponse<T> {
      items: T[];
      totalItems: number;
      totalPages: number;
      currentPage: number;
    }

    export interface EquipmentToRemoveDetails {
      name: string;
      location: string;
      startIndex: number;
      count: number;
    }
