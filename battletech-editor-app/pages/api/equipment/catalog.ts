import type { NextApiRequest, NextApiResponse } from 'next';
import { getEquipmentCatalog, getEquipmentCategories, getTechBases, getRulesLevels } from '../../../services/equipmentService';
import type { EquipmentSearchParams, EquipmentCatalogResponse } from '../../../services/equipmentService';

// Legacy interface for API compatibility
interface EquipmentVariant {
  id: string;
  template_id?: number;
  tech_base: string;
  variant_name: string;
  internal_id?: string;
  weight_tons: number;
  critical_slots: number;
  damage?: number | null;
  heat_generated?: number | null;
  range_short?: number | null;
  range_medium?: number | null;
  range_long?: number | null;
  range_extreme?: number | null;
  minimum_range?: number | null;
  ammo_per_ton?: number | null;
  cost_cbills?: number | null;
  battle_value?: number | null;
  introduction_year: number;
  extinction_year?: number;
  reintroduction_year?: number;
  availability_rating?: string;
  special_rules?: string[];
  restrictions?: string[];
  era_category?: string;
  rules_level: string;
  source_book?: string;
  page_reference?: string;
  is_omnipod: boolean;
  requires_ammo: boolean;
  ammo_type?: string;
  template_name?: string;
  base_type?: string;
  category_name: string;
  sub_category?: string;
  description?: string;
}

interface CatalogResponse {
  items: EquipmentVariant[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  sortBy: string;
  sortOrder: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      page = 1,
      pageSize = 25,
      search,
      tech_base,
      category,
      rules_level,
      sortBy = 'variant_name',
      sortOrder = 'ASC'
    } = req.query as {
      page?: string | number;
      pageSize?: string | number;
      search?: string;
      tech_base?: string;
      category?: string;
      rules_level?: string;
      sortBy?: string;
      sortOrder?: string;
    };

    // Convert query parameters to service parameters
    const searchParams: EquipmentSearchParams = {
      page: parseInt(page as string, 10) || 1,
      pageSize: Math.min(parseInt(pageSize as string, 10) || 25, 100),
      sortBy,
      sortOrder: (sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC')
    };

    if (search) {
      searchParams.search = search;
    }

    if (tech_base && (tech_base === 'IS' || tech_base === 'Clan')) {
      searchParams.techBase = tech_base;
    }

    if (category) {
      // Map category names from API to service types
      const categoryMapping: Record<string, string> = {
        'Energy Weapons': 'Energy Weapons',
        'Ballistic Weapons': 'Ballistic Weapons', 
        'Missile Weapons': 'Missile Weapons',
        'Equipment': 'Equipment',
        'Heat Management': 'Heat Management',
        'Electronic Warfare': 'Electronic Warfare',
        'Ammunition': 'Ammunition'
      };
      
      if (categoryMapping[category]) {
        searchParams.category = categoryMapping[category] as any;
      }
    }

    if (rules_level) {
      searchParams.rulesLevel = rules_level as any;
    }

    // Get equipment data from file-based service
    const result: EquipmentCatalogResponse = getEquipmentCatalog(searchParams);

    // Convert service response to API format for compatibility
    const items: EquipmentVariant[] = result.items.map(item => ({
      id: item.id,
      tech_base: item.techBase,
      variant_name: item.name,
      weight_tons: item.weight,
      critical_slots: item.crits,
      damage: item.damage,
      heat_generated: item.heat,
      range_short: item.rangeShort,
      range_medium: item.rangeMedium,
      range_long: item.rangeLong,
      range_extreme: item.rangeExtreme,
      minimum_range: item.minRange,
      ammo_per_ton: item.ammoPerTon,
      cost_cbills: item.cost,
      battle_value: item.battleValue,
      introduction_year: item.introductionYear,
      rules_level: item.rulesLevel,
      is_omnipod: false, // Not tracked in new system
      requires_ammo: item.requiresAmmo,
      category_name: item.category,
      base_type: item.baseType,
      description: item.description,
      special_rules: item.special || []
    }));

    const response: CatalogResponse = {
      items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      pageSize: result.pageSize,
      sortBy: result.sortBy,
      sortOrder: result.sortOrder
    };

    return res.status(200).json(response);

  } catch (error: any) {
    console.error('Error fetching equipment catalog:', error);
    return res.status(500).json({
      message: 'Error fetching equipment catalog',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
