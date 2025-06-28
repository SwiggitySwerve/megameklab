/**
 * Unallocated Equipment Display - Shows equipment that couldn't be allocated
 * Dark theme component showing displaced equipment with grouped organization
 */

import React, { useState, useMemo } from 'react'
import { useUnit } from '../multiUnit/MultiUnitProvider'
import { EquipmentAllocation } from '../../utils/criticalSlots/CriticalSlot'

// Equipment categorization for logical grouping
const EQUIPMENT_CATEGORIES = {
  'Structure Components': {
    icon: '🔧',
    keywords: ['Endo Steel', 'Composite Structure', 'Standard Structure']
  },
  'Armor Components': {
    icon: '🛡️', 
    keywords: ['Ferro-Fibrous', 'Light Ferro-Fibrous', 'Heavy Ferro-Fibrous', 'Stealth Armor', 'Standard Armor']
  },
  'Weapons - Energy': {
    icon: '⚡',
    keywords: ['Laser', 'PPC', 'Flamer', 'Plasma']
  },
  'Weapons - Ballistic': {
    icon: '🔫',
    keywords: ['AC/', 'Gauss', 'Machine Gun', 'Rifle']
  },
  'Weapons - Missile': {
    icon: '🚀',
    keywords: ['LRM', 'SRM', 'Streak', 'NARC', 'TAG', 'Artemis']
  },
  'Movement Systems': {
    icon: '🦵',
    keywords: ['Jump Jet', 'Mechanical Jump Booster']
  },
  'Heat Management': {
    icon: '❄️',
    keywords: ['Heat Sink', 'Double Heat Sink']
  },
  'Electronics & Equipment': {
    icon: '📡',
    keywords: ['ECM', 'BAP', 'C3', 'CASE', 'Targeting Computer']
  },
  'Other Equipment': {
    icon: '⚙️',
    keywords: [] // catch-all
  }
}

interface GroupedEquipment {
  [equipmentName: string]: {
    items: EquipmentAllocation[]
    count: number
    category: string
  }
}

interface CategoryData {
  name: string
  icon: string
  groups: GroupedEquipment
  totalCount: number
}

// Helper function to categorize equipment
function categorizeEquipment(equipmentName: string): string {
  for (const [categoryName, categoryData] of Object.entries(EQUIPMENT_CATEGORIES)) {
    if (categoryData.keywords.some(keyword => equipmentName.includes(keyword))) {
      return categoryName
    }
  }
  return 'Other Equipment' // Default fallback
}

// Helper function to group equipment by name and category
function groupEquipmentByCategory(equipment: EquipmentAllocation[]): CategoryData[] {
  // First, group by equipment name
  const grouped: GroupedEquipment = {}
  
  equipment.forEach(item => {
    const name = item.equipmentData.name
    if (!grouped[name]) {
      grouped[name] = {
        items: [],
        count: 0,
        category: categorizeEquipment(name)
      }
    }
    grouped[name].items.push(item)
    grouped[name].count++
  })

  // Then, group by category
  const categories: { [key: string]: CategoryData } = {}
  
  Object.entries(grouped).forEach(([equipmentName, groupData]) => {
    const categoryName = groupData.category
    if (!categories[categoryName]) {
      categories[categoryName] = {
        name: categoryName,
        icon: EQUIPMENT_CATEGORIES[categoryName as keyof typeof EQUIPMENT_CATEGORIES]?.icon || '⚙️',
        groups: {},
        totalCount: 0
      }
    }
    
    categories[categoryName].groups[equipmentName] = groupData
    categories[categoryName].totalCount += groupData.count
  })

  // Sort categories by priority (Structure Components first, then alphabetically)
  const categoryOrder = [
    'Structure Components',
    'Armor Components', 
    'Weapons - Energy',
    'Weapons - Ballistic',
    'Weapons - Missile',
    'Movement Systems',
    'Heat Management',
    'Electronics & Equipment',
    'Other Equipment'
  ]

  return categoryOrder
    .filter(catName => categories[catName])
    .map(catName => categories[catName])
}

// Component for individual equipment group (e.g., "Endo Steel (14)")
function EquipmentGroup({ 
  equipmentName, 
  groupData, 
  isExpanded, 
  onToggle 
}: { 
  equipmentName: string
  groupData: { items: EquipmentAllocation[], count: number, category: string }
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="ml-2">
      {/* Compact Group Header */}
      <div 
        className="flex items-center cursor-pointer hover:bg-gray-700 px-2 py-1 rounded text-sm"
        onClick={onToggle}
      >
        <span className="text-gray-400 text-xs mr-1">
          {isExpanded ? '▼' : '▶'}
        </span>
        <span className="text-white mr-2 truncate">
          {equipmentName}
        </span>
        <span className="bg-blue-600 text-white text-xs px-1 rounded ml-auto">
          {groupData.count}
        </span>
      </div>
      
      {/* Individual equipment items - very compact */}
      {isExpanded && (
        <div className="ml-4 mt-1">
          {groupData.items.slice(0, 3).map(equipment => (
            <EquipmentItem 
              key={equipment.equipmentGroupId} 
              equipment={equipment} 
            />
          ))}
          {groupData.items.length > 3 && (
            <div className="text-xs text-gray-500 px-2">
              ...and {groupData.items.length - 3} more (click to select any)
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Component for equipment category section (e.g., "Structure Components (14)")
function CategorySection({ 
  category, 
  isExpanded, 
  onToggle 
}: { 
  category: CategoryData
  isExpanded: boolean
  onToggle: () => void
}) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Auto-expand all equipment groups when category is expanded
  React.useEffect(() => {
    if (isExpanded && expandedGroups.size === 0) {
      const allGroups = new Set(Object.keys(category.groups))
      setExpandedGroups(allGroups)
    }
  }, [isExpanded, category.groups, expandedGroups.size])

  const toggleGroup = (equipmentName: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(equipmentName)) {
      newExpanded.delete(equipmentName)
    } else {
      newExpanded.add(equipmentName)
    }
    setExpandedGroups(newExpanded)
  }

  return (
    <div className="mb-2">
      {/* Compact Category Header */}
      <div 
        className="flex items-center cursor-pointer hover:bg-gray-700 p-2 rounded border border-gray-600"
        onClick={onToggle}
      >
        <span className="text-gray-400 text-xs mr-2">
          {isExpanded ? '▼' : '▶'}
        </span>
        <span className="text-sm mr-1">
          {category.icon}
        </span>
        <span className="text-white text-sm font-medium flex-1">
          {category.name}
        </span>
        <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">
          {category.totalCount}
        </span>
      </div>
      
      {/* Equipment Groups within Category */}
      {isExpanded && (
        <div className="mt-1">
          {Object.entries(category.groups).map(([equipmentName, groupData]) => (
            <EquipmentGroup
              key={equipmentName}
              equipmentName={equipmentName}
              groupData={groupData}
              isExpanded={expandedGroups.has(equipmentName)}
              onToggle={() => toggleGroup(equipmentName)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EquipmentItem({ equipment }: { equipment: EquipmentAllocation }) {
  const { selectedEquipmentId, selectEquipment } = useUnit()
  
  const isSelected = selectedEquipmentId === equipment.equipmentGroupId
  
  const getEquipmentTypeColor = (type: string): string => {
    const baseColors = {
      'weapon': 'bg-red-700 border-red-600',
      'ammo': 'bg-orange-700 border-orange-600', 
      'equipment': 'bg-blue-700 border-blue-600',
      'heat_sink': 'bg-cyan-700 border-cyan-600',
    }
    
    const selectedColors = {
      'weapon': 'bg-red-500 border-red-400',
      'ammo': 'bg-orange-500 border-orange-400',
      'equipment': 'bg-blue-500 border-blue-400', 
      'heat_sink': 'bg-cyan-500 border-cyan-400',
    }
    
    if (isSelected) {
      return selectedColors[type as keyof typeof selectedColors] || 'bg-gray-500 border-gray-400'
    }
    
    return baseColors[type as keyof typeof baseColors] || 'bg-gray-700 border-gray-600'
  }

  const getTechAbbreviation = (techBase: string): string => {
    switch (techBase) {
      case 'Inner Sphere': return 'IS'
      case 'Clan': return 'CLAN'
      case 'Star League': return 'SL'
      default: return techBase.substring(0, 3).toUpperCase()
    }
  }

  const handleClick = () => {
    // Radio-button style selection: always select this item unless it's already selected
    if (isSelected) {
      selectEquipment(null) // Deselect if clicking the currently selected item
    } else {
      selectEquipment(equipment.equipmentGroupId) // Select this equipment (clears any other selection)
    }
  }

  return (
    <div 
      className={`${getEquipmentTypeColor(equipment.equipmentData.type)} 
                 text-white px-2 py-1 rounded border transition-colors hover:opacity-80 
                 cursor-pointer transform hover:scale-105 ${isSelected ? 'ring-2 ring-blue-400' : ''} 
                 min-w-0 flex-shrink-0 relative`}
      onClick={handleClick}
      title={isSelected ? 'Click to deselect' : 'Click to select for assignment'}
    >
      {/* Yellow star indicator for selected equipment */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-300 text-black rounded-full flex items-center justify-center text-xs font-bold">
          ★
        </div>
      )}
      
      {/* Header with name and tech type */}
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-xs pr-1 truncate">{equipment.equipmentData.name}</h4>
        <span className="text-xs font-bold bg-black bg-opacity-40 px-1 py-0.5 rounded text-gray-200">
          ({getTechAbbreviation(equipment.equipmentData.techBase)})
        </span>
      </div>
      
      {/* Condensed stats in single line */}
      <div className="text-xs text-gray-300 leading-tight">
        <span>
          {equipment.equipmentData.requiredSlots}cr • {equipment.equipmentData.weight}t
          {equipment.equipmentData.heat !== undefined && (
            <span> • {equipment.equipmentData.heat > 0 ? '+' : ''}{equipment.equipmentData.heat}h</span>
          )}
        </span>
        {isSelected && (
          <div className="text-blue-300 font-medium text-xs">Click slot to assign</div>
        )}
      </div>
    </div>
  )
}

export function UnallocatedEquipmentDisplay() {
  const { unit } = useUnit()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // PROPER ARCHITECTURE: Get fresh data directly from unit each render
  const unallocatedEquipment = unit.getUnallocatedEquipment()

  // Reset button handler with confirmation
  const handleResetToBase = () => {
    const confirmReset = window.confirm(
      `Are you sure you want to reset to base configuration?\n\n` +
      `This will:\n` +
      `• Clear ALL allocated equipment\n` +
      `• Reset special components (Endo Steel, Ferro-Fibrous, Jump Jets)\n` +
      `• Rebuild unit from current configuration\n\n` +
      `This action cannot be undone.`
    )
    
    if (confirmReset) {
      console.log('[UnallocatedEquipmentDisplay] User confirmed reset to base configuration')
      unit.resetToBaseConfiguration()
    }
  }
  
  // Group equipment by category using fresh data from unit
  const categorizedEquipment = useMemo(() => {
    return groupEquipmentByCategory(unallocatedEquipment)
  }, [unallocatedEquipment])

  // Toggle category expansion
  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName)
    } else {
      newExpanded.add(categoryName)
    }
    setExpandedCategories(newExpanded)
  }

  // Auto-expand categories with items on first render
  React.useEffect(() => {
    if (categorizedEquipment.length > 0 && expandedCategories.size === 0) {
      const autoExpand = new Set(categorizedEquipment.map(cat => cat.name))
      setExpandedCategories(autoExpand)
    }
  }, [categorizedEquipment, expandedCategories.size])

  // Debug logging - Enhanced with duplication detection
  React.useEffect(() => {
    console.log('=== UNALLOCATED EQUIPMENT DEBUG ===')
    console.log('[UnallocatedEquipmentDisplay] Equipment count:', unallocatedEquipment.length)
    
    // Check for duplicates by groupId
    const groupIds = unallocatedEquipment.map(eq => eq.equipmentGroupId)
    const uniqueGroupIds = new Set(groupIds)
    const hasDuplicates = groupIds.length !== uniqueGroupIds.size
    
    if (hasDuplicates) {
      console.error('🚨 DUPLICATE EQUIPMENT DETECTED!')
      console.error('Total items:', groupIds.length, 'Unique group IDs:', uniqueGroupIds.size)
      
      // Find duplicates
      const duplicates = groupIds.filter((id, index, arr) => arr.indexOf(id) !== index)
      console.error('Duplicate group IDs:', Array.from(new Set(duplicates)))
    }
    
    // Count by equipment name
    const nameCounts = unallocatedEquipment.reduce((acc, eq) => {
      const name = eq.equipmentData.name
      acc[name] = (acc[name] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log('[UnallocatedEquipmentDisplay] Equipment counts by name:', nameCounts)
    console.log('[UnallocatedEquipmentDisplay] Categorized structure:', categorizedEquipment.map(cat => ({
      category: cat.name,
      totalCount: cat.totalCount,
      groups: Object.keys(cat.groups).map(name => `${name} (${cat.groups[name].count})`)
    })))
    
    if (unit) {
      const config = unit.getConfiguration()
      console.log('[UnallocatedEquipmentDisplay] Unit config:', {
        structureType: config.structureType,
        armorType: config.armorType
      })
    }
    
    console.log('=== END UNALLOCATED EQUIPMENT DEBUG ===')
  }, [unallocatedEquipment, categorizedEquipment, unit])

  return (
    <div className="bg-gray-800 p-2 rounded border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-white text-sm font-bold">
          Unallocated ({unallocatedEquipment.length})
        </h3>
        <button
          onClick={handleResetToBase}
          className="bg-red-600 hover:bg-red-700 text-white text-xs px-1 py-0.5 rounded border border-red-500 transition-colors"
          title="Reset to Base Configuration - Clears all equipment and rebuilds unit fresh"
        >
          🔄
        </button>
      </div>
      
      {unallocatedEquipment.length === 0 ? (
        <div className="text-center py-4 text-gray-400 text-sm">✓ All allocated</div>
      ) : (
        <div className="space-y-1">
          {categorizedEquipment.map(category => (
            <CategorySection
              key={category.name}
              category={category}
              isExpanded={expandedCategories.has(category.name)}
              onToggle={() => toggleCategory(category.name)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
