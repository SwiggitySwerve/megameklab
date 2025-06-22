/**
 * Equipment Service - File-based equipment data access
 * Replaces SQLite database with TypeScript configuration files
 */

import { 
  Equipment, 
  EquipmentVariantFlat, 
  TechBase, 
  EquipmentCategory,
  RulesLevel,
  EQUIPMENT_DATABASE,
  ALL_EQUIPMENT_VARIANTS,
  BROWSABLE_CATEGORIES,
  ALL_CATEGORIES
} from '../data/equipment';

export interface EquipmentSearchParams {
  search?: string;
  techBase?: TechBase;
  category?: EquipmentCategory;
  rulesLevel?: RulesLevel;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  pageSize?: number;
}

export interface EquipmentCatalogResponse {
  items: EquipmentVariantFlat[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  sortBy: string;
  sortOrder: string;
}

// Convert Equipment to flattened variants for API compatibility
function flattenEquipment(equipment: Equipment[]): EquipmentVariantFlat[] {
  const flattened: EquipmentVariantFlat[] = [];
  
  equipment.forEach(item => {
    Object.entries(item.variants).forEach(([techBase, variant]) => {
        flattened.push({
          id: `${item.id}_${techBase.toLowerCase()}`,
          name: item.name,
          category: item.category,
          techBase: techBase as TechBase,
          weight: variant.weight,
          crits: variant.crits,
          damage: variant.damage,
          heat: variant.heat,
          minRange: variant.minRange,
          rangeShort: variant.rangeShort,
          rangeMedium: variant.rangeMedium,
          rangeLong: variant.rangeLong,
          rangeExtreme: variant.rangeExtreme,
          ammoPerTon: variant.ammoPerTon,
          cost: variant.cost,
          battleValue: variant.battleValue,
          requiresAmmo: item.requiresAmmo,
          introductionYear: item.introductionYear,
          rulesLevel: item.rulesLevel,
          baseType: item.baseType,
          description: item.description,
          special: item.special,
          sourceBook: item.sourceBook,
          pageReference: item.pageReference
        });
    });
  });
  
  return flattened;
}

// Get all equipment variants as flattened list
export function getAllEquipmentVariants(): EquipmentVariantFlat[] {
  return flattenEquipment(ALL_EQUIPMENT_VARIANTS);
}

// Get browsable equipment variants (excludes special categories by default)
export function getBrowsableEquipmentVariants(): EquipmentVariantFlat[] {
  const allVariants = getAllEquipmentVariants();
  return allVariants.filter(variant => BROWSABLE_CATEGORIES.includes(variant.category));
}

// Filter equipment based on search parameters
export function filterEquipment(variants: EquipmentVariantFlat[], params: EquipmentSearchParams): EquipmentVariantFlat[] {
  let filtered = [...variants];
  
  // Apply search filter
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(searchLower) ||
      item.baseType?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower)
    );
  }
  
  // Apply tech base filter
  if (params.techBase && (params.techBase === 'IS' || params.techBase === 'Clan')) {
    filtered = filtered.filter(item => item.techBase === params.techBase);
  }
  
  // Apply category filter
  if (params.category) {
    filtered = filtered.filter(item => item.category === params.category);
  }
  
  // Apply rules level filter
  if (params.rulesLevel) {
    filtered = filtered.filter(item => item.rulesLevel === params.rulesLevel);
  }
  
  return filtered;
}

// Sort equipment variants
export function sortEquipment(variants: EquipmentVariantFlat[], sortBy: string, sortOrder: 'ASC' | 'DESC'): EquipmentVariantFlat[] {
  const sorted = [...variants];
  
  const getValue = (item: EquipmentVariantFlat, field: string): any => {
    switch (field) {
      case 'variant_name':
      case 'name':
        return item.name;
      case 'tech_base':
        return item.techBase;
      case 'weight_tons':
      case 'weight':
        return item.weight;
      case 'critical_slots':
      case 'crits':
        return item.crits;
      case 'damage':
        return item.damage || 0;
      case 'heat_generated':
      case 'heat':
        return item.heat || 0;
      case 'introduction_year':
        return item.introductionYear;
      case 'battle_value':
        return item.battleValue || 0;
      case 'cost_cbills':
        return item.cost || 0;
      case 'category_name':
      case 'category':
        return item.category;
      case 'rules_level':
        return item.rulesLevel;
      default:
        return item.name;
    }
  };
  
  sorted.sort((a, b) => {
    const aVal = getValue(a, sortBy);
    const bVal = getValue(b, sortBy);
    
    let comparison = 0;
    if (aVal < bVal) comparison = -1;
    else if (aVal > bVal) comparison = 1;
    
    return sortOrder === 'DESC' ? -comparison : comparison;
  });
  
  return sorted;
}

// Paginate equipment variants
export function paginateEquipment(variants: EquipmentVariantFlat[], page: number, pageSize: number): EquipmentVariantFlat[] {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return variants.slice(startIndex, endIndex);
}

// Main equipment catalog function - replaces the SQLite API
export function getEquipmentCatalog(params: EquipmentSearchParams): EquipmentCatalogResponse {
  const {
    page = 1,
    pageSize = 25,
    sortBy = 'name',
    sortOrder = 'ASC'
  } = params;
  
  // Start with browsable equipment by default, unless specific category is requested
  let variants = params.category ? getAllEquipmentVariants() : getBrowsableEquipmentVariants();
  
  // Apply filters
  variants = filterEquipment(variants, params);
  
  // Apply sorting
  variants = sortEquipment(variants, sortBy, sortOrder);
  
  // Calculate pagination
  const totalItems = variants.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedVariants = paginateEquipment(variants, page, pageSize);
  
  return {
    items: paginatedVariants,
    totalItems,
    totalPages,
    currentPage: page,
    pageSize,
    sortBy,
    sortOrder
  };
}

// Get unique categories for filtering
export function getEquipmentCategories(): EquipmentCategory[] {
  return ALL_CATEGORIES;
}

// Get unique tech bases for filtering  
export function getTechBases(): TechBase[] {
  return ['IS', 'Clan'];
}

// Get unique rules levels for filtering
export function getRulesLevels(): RulesLevel[] {
  const variants = getAllEquipmentVariants();
  const rulesLevels = new Set(variants.map(v => v.rulesLevel));
  return Array.from(rulesLevels);
}

// Get equipment by name and tech base
export function getEquipmentByName(name: string, techBase?: TechBase): EquipmentVariantFlat | undefined {
  const variants = getAllEquipmentVariants();
  return variants.find(v => 
    v.name === name && 
    (techBase ? v.techBase === techBase : true)
  );
}

// Get equipment by ID
export function getEquipmentById(id: string): EquipmentVariantFlat | undefined {
  const variants = getAllEquipmentVariants();
  return variants.find(v => v.id === id);
}
