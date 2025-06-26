/**
 * Equipment Browser - Add equipment from database with proper variant support
 * Dark theme component with searchable equipment database and pagination
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useUnit } from '../multiUnit/MultiUnitProvider'
import { EquipmentObject } from '../../utils/criticalSlots/CriticalSlot'

// API interfaces
interface EquipmentVariant {
  id: number;
  template_id: number;
  tech_base: string;
  variant_name: string;
  internal_id: string;
  weight_tons: number;
  critical_slots: number;
  damage?: number;
  heat_generated?: number;
  range_short?: number;
  range_medium?: number;
  range_long?: number;
  range_extreme?: number;
  minimum_range?: number;
  ammo_per_ton?: number;
  cost_cbills?: number;
  battle_value?: number;
  introduction_year?: number;
  extinction_year?: number;
  reintroduction_year?: number;
  availability_rating?: string;
  special_rules?: string | string[];
  restrictions?: string | string[];
  era_category?: string;
  rules_level?: string;
  source_book?: string;
  page_reference?: string;
  is_omnipod: boolean;
  requires_ammo: boolean;
  ammo_type?: string;
  template_name?: string;
  base_type?: string;
  category_name?: string;
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

// Convert API variant to EquipmentObject
function convertVariantToEquipment(variant: EquipmentVariant): EquipmentObject {
  // Map category names to equipment types
  const categoryToType: Record<string, EquipmentObject['type']> = {
    'Weapons': 'weapon',
    'Energy Weapons': 'weapon',
    'Ballistic Weapons': 'weapon',
    'Missile Weapons': 'weapon',
    'Ammunition': 'ammo',
    'Heat Management': 'heat_sink',
    'Equipment': 'equipment',
    'Electronic Warfare': 'equipment',
    'Targeting Systems': 'equipment',
    'Special Equipment': 'equipment',
    'Jump Jets': 'equipment',
    'Cockpit Systems': 'equipment',
    'Actuators': 'equipment'
  }

  // Determine type based on category or base type
  let type: EquipmentObject['type'] = 'equipment'
  if (variant.category_name && categoryToType[variant.category_name]) {
    type = categoryToType[variant.category_name]
  } else if (variant.base_type?.toLowerCase().includes('heat sink')) {
    type = 'heat_sink'
  } else if (variant.base_type?.toLowerCase().includes('ammo')) {
    type = 'ammo'
  } else if (variant.damage || variant.heat_generated) {
    type = 'weapon'
  }

  // Map tech base properly
  let techBase: EquipmentObject['techBase'] = 'Inner Sphere'
  if (variant.tech_base === 'Clan') {
    techBase = 'Clan'
  }
  // Note: Mixed tech base no longer exists in data

  return {
    id: variant.internal_id || `variant-${variant.id}`,
    name: variant.variant_name,
    requiredSlots: variant.critical_slots,
    weight: variant.weight_tons,
    type,
    techBase,
    heat: variant.heat_generated
  }
}

interface EquipmentRowProps {
  variant: EquipmentVariant
}

function EquipmentRow({ variant }: EquipmentRowProps) {
  const { addEquipmentToUnit } = useUnit()
  
  const getTypeColor = (categoryName?: string): string => {
    if (!categoryName) return 'bg-gray-600'
    
    const colors: Record<string, string> = {
      'Weapons': 'bg-red-700',
      'Energy Weapons': 'bg-red-700',
      'Ballistic Weapons': 'bg-red-700',
      'Missile Weapons': 'bg-red-700',
      'Ammunition': 'bg-orange-700',
      'Heat Management': 'bg-cyan-700',
      'Equipment': 'bg-blue-700',
      'Electronic Warfare': 'bg-blue-700',
      'Targeting Systems': 'bg-blue-700',
      'Special Equipment': 'bg-blue-700',
      'Jump Jets': 'bg-blue-700',
      'Cockpit Systems': 'bg-blue-700',
      'Actuators': 'bg-blue-700'
    }
    return colors[categoryName] || 'bg-gray-600'
  }
  
  const getTechBaseColor = (techBase: string): string => {
    return techBase === 'Clan' ? 'text-green-400' : 'text-blue-400'
  }
  
  const handleAdd = () => {
    // Convert variant to equipment object and add
    const equipment = convertVariantToEquipment(variant)
    addEquipmentToUnit(equipment)
  }
  
  // Build range display
  const rangeDisplay = variant.range_short && variant.range_medium && variant.range_long 
    ? `${variant.range_short}/${variant.range_medium}/${variant.range_long}`
    : ''
  
  return (
    <tr className="border-b border-gray-600 hover:bg-gray-700 transition-colors">
      {/* Add Button (Plus Column) */}
      <td className="px-2 py-2 text-center w-12">
        <button
          onClick={handleAdd}
          className="bg-green-600 hover:bg-green-500 text-white text-xs w-6 h-6 rounded flex items-center justify-center transition-colors"
          title="Add to unit"
        >
          +
        </button>
      </td>
      
      {/* Name */}
      <td className="px-3 py-2 text-white font-medium text-sm">
        {variant.variant_name}
      </td>
      
      {/* Damage */}
      <td className="px-3 py-2 text-gray-300 text-sm text-center">
        {variant.damage || '-'}
      </td>
      
      {/* Heat */}
      <td className="px-3 py-2 text-gray-300 text-sm text-center">
        {variant.heat_generated || '-'}
      </td>
      
      {/* Min R */}
      <td className="px-3 py-2 text-gray-300 text-sm text-center">
        {variant.minimum_range || '0'}
      </td>
      
      {/* Range */}
      <td className="px-3 py-2 text-gray-300 text-sm text-center">
        {rangeDisplay || '-'}
      </td>
      
      {/* Shots */}
      <td className="px-3 py-2 text-gray-300 text-sm text-center">
        {variant.ammo_per_ton || '-'}
      </td>
      
      {/* Base */}
      <td className="px-3 py-2 text-xs">
        <span className={getTechBaseColor(variant.tech_base)}>
          {variant.tech_base === 'Inner Sphere' ? 'Both' : variant.tech_base}
        </span>
      </td>
      
      {/* BV */}
      <td className="px-3 py-2 text-gray-300 text-sm text-center">
        {variant.battle_value || '-'}
      </td>
      
      {/* Weight */}
      <td className="px-3 py-2 text-gray-300 text-sm text-center">
        {variant.weight_tons}
      </td>
      
      {/* Crit */}
      <td className="px-3 py-2 text-gray-300 text-sm text-center">
        {variant.critical_slots}
      </td>
      
      {/* Reference */}
      <td className="px-3 py-2 text-gray-400 text-xs">
        {variant.page_reference || 
         (variant.introduction_year ? `${variant.introduction_year}, ${variant.availability_rating || 'Introductory'}` : 'Introductory')}
      </td>
    </tr>
  )
}

export function EquipmentBrowser() {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [techBaseFilter, setTechBaseFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState('variant_name')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  
  // Available filter options
  const [categories, setCategories] = useState<string[]>([])
  const [techBases, setTechBases] = useState<string[]>([])

  // Load filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await fetch('/api/equipment/filters')
      if (response.ok) {
        const filterData = await response.json()
        setCategories(filterData.categories || [])
        setTechBases(filterData.techBases || [])
      }
    } catch (err) {
      console.error('Error fetching filter options:', err)
    }
  }, [])

  const fetchCatalog = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        sortBy,
        sortOrder
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (techBaseFilter !== 'all') params.append('tech_base', techBaseFilter)
      
      const response = await fetch(`/api/equipment/catalog?${params}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: CatalogResponse = await response.json()
      setCatalog(data)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch equipment catalog')
      console.error('Error fetching equipment catalog:', err)
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, searchTerm, categoryFilter, techBaseFilter, sortBy, sortOrder])

  // Fetch filter options on mount
  useEffect(() => {
    fetchFilterOptions()
  }, [fetchFilterOptions])

  // Fetch catalog on mount and when filters change
  useEffect(() => {
    fetchCatalog()
  }, [fetchCatalog])

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchTerm, categoryFilter, techBaseFilter, sortBy, sortOrder])

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  return (
    <div className="h-full flex flex-col bg-gray-800 p-4 rounded-lg border border-gray-700">
      <h2 className="text-white text-lg font-bold mb-4">Equipment Browser</h2>
      
      {/* Filters - Fixed at top */}
      <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* Search */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">Search Equipment</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name..."
            className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>
        
        {/* Category Filter */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        {/* Tech Base Filter */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">Tech Base</label>
          <select
            value={techBaseFilter}
            onChange={(e) => setTechBaseFilter(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Tech Bases</option>
            <option value="IS">Inner Sphere</option>
            <option value="Clan">Clan</option>
          </select>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">Sort By</label>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-')
              setSortBy(newSortBy)
              setSortOrder(newSortOrder as 'ASC' | 'DESC')
            }}
            className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="variant_name-ASC">Name (A-Z)</option>
            <option value="variant_name-DESC">Name (Z-A)</option>
            <option value="weight_tons-ASC">Weight (Low-High)</option>
            <option value="weight_tons-DESC">Weight (High-Low)</option>
            <option value="critical_slots-ASC">Slots (Low-High)</option>
            <option value="critical_slots-DESC">Slots (High-Low)</option>
            <option value="tech_base-ASC">Tech Base</option>
          </select>
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Loading/Error States */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-400">Loading equipment catalog...</div>
          </div>
        )}

        {error && (
          <div className="flex-shrink-0 bg-red-900 border border-red-600 text-red-100 p-4 rounded-lg mb-4">
            <div className="font-bold">Error loading equipment catalog:</div>
            <div>{error}</div>
            <button 
              onClick={fetchCatalog}
              className="mt-2 bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {catalog && !loading && (
          <>
            {/* Results Info - Fixed */}
            <div className="flex-shrink-0 flex justify-between items-center mb-4">
              <div className="text-gray-400 text-sm">
                Showing {catalog.items.length} of {catalog.totalItems} equipment variants
                (Page {catalog.currentPage} of {catalog.totalPages})
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-gray-400 text-sm">Items per page:</label>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="bg-gray-700 border border-gray-600 text-white text-sm rounded px-2 py-1"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            
            {/* Equipment Table - Scrollable */}
            <div className="flex-1 overflow-hidden border border-gray-600 rounded">
              <div className="overflow-auto h-full">
                <table className="w-full text-left">
                <thead className="sticky top-0 bg-gray-800 z-10">
                  <tr className="border-b border-gray-600">
                    <th className="px-2 py-2 text-gray-300 text-sm font-medium text-center w-12"></th>
                    <th className="px-3 py-2 text-gray-300 text-sm font-medium">Name ▲</th>
                    <th className="px-3 py-2 text-gray-300 text-sm font-medium">Damage</th>
                    <th className="px-3 py-2 text-gray-300 text-sm font-medium">Heat</th>
                    <th className="px-3 py-2 text-gray-300 text-sm font-medium">Min R</th>
                    <th className="px-3 py-2 text-gray-300 text-sm font-medium">Range</th>
                    <th className="px-3 py-2 text-gray-300 text-sm font-medium">Shots</th>
                    <th className="px-3 py-2 text-gray-300 text-sm font-medium">Base</th>
                    <th className="px-3 py-2 text-gray-300 text-sm font-medium">BV</th>
                    <th className="px-3 py-2 text-gray-300 text-sm font-medium">Weight</th>
                    <th className="px-3 py-2 text-gray-300 text-sm font-medium">Crit</th>
                    <th className="px-3 py-2 text-gray-300 text-sm font-medium">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {catalog.items.map((variant) => (
                    <EquipmentRow key={variant.id} variant={variant} />
                  ))}
                </tbody>
                </table>
              </div>
            </div>

            {/* Pagination - Fixed at bottom */}
            {catalog.totalPages > 1 && (
              <div className="flex-shrink-0 flex justify-center items-center space-x-2 mt-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-3 py-1 rounded text-sm"
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, catalog.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(catalog.totalPages - 4, currentPage - 2)) + i
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded text-sm ${
                        pageNum === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-600 hover:bg-gray-500 text-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= catalog.totalPages}
                  className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-3 py-1 rounded text-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Instructions - Fixed at bottom */}
      <div className="flex-shrink-0 mt-4 pt-4 border-t border-gray-600">
        <div className="text-gray-400 text-xs">
          <p className="mb-1">• Click <span className="text-green-400">Add</span> to add equipment to unallocated list</p>
          <p className="mb-1">• Each variant (IS/Clan) is shown as a separate entry with specific stats</p>
          <p className="mb-1">• Use filters and search to find specific equipment</p>
          <p>• <span className="text-blue-400">IS</span> and <span className="text-green-400">Clan</span> tech bases available</p>
        </div>
      </div>
    </div>
  )
}
