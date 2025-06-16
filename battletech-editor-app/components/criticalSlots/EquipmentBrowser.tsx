/**
 * Equipment Browser - Add equipment from database for testing
 * Dark theme component with searchable equipment database
 */

import React, { useState, useMemo } from 'react'
import { useUnit } from './UnitProvider'
import { EquipmentObject } from '../../utils/criticalSlots/CriticalSlot'

// Mock equipment database for testing
const EQUIPMENT_DATABASE: EquipmentObject[] = [
  // Weapons - Energy
  { id: 'small-laser', name: 'Small Laser', requiredSlots: 1, weight: 0.5, type: 'weapon', techBase: 'Inner Sphere' },
  { id: 'medium-laser', name: 'Medium Laser', requiredSlots: 1, weight: 1, type: 'weapon', techBase: 'Inner Sphere' },
  { id: 'large-laser', name: 'Large Laser', requiredSlots: 2, weight: 5, type: 'weapon', techBase: 'Inner Sphere' },
  { id: 'ppc', name: 'PPC', requiredSlots: 3, weight: 7, type: 'weapon', techBase: 'Inner Sphere' },
  { id: 'er-ppc', name: 'ER PPC', requiredSlots: 3, weight: 7, type: 'weapon', techBase: 'Inner Sphere' },
  
  // Weapons - Ballistic
  { id: 'ac2', name: 'AC/2', requiredSlots: 1, weight: 6, type: 'weapon', techBase: 'Inner Sphere' },
  { id: 'ac5', name: 'AC/5', requiredSlots: 4, weight: 8, type: 'weapon', techBase: 'Inner Sphere' },
  { id: 'ac10', name: 'AC/10', requiredSlots: 7, weight: 12, type: 'weapon', techBase: 'Inner Sphere' },
  { id: 'ac20', name: 'AC/20', requiredSlots: 10, weight: 14, type: 'weapon', techBase: 'Inner Sphere' },
  { id: 'gauss-rifle', name: 'Gauss Rifle', requiredSlots: 7, weight: 15, type: 'weapon', techBase: 'Inner Sphere' },
  { id: 'machine-gun', name: 'Machine Gun', requiredSlots: 1, weight: 0.5, type: 'weapon', techBase: 'Inner Sphere' },
  
  // Weapons - Missile
  { id: 'lrm5', name: 'LRM 5', requiredSlots: 1, weight: 2, type: 'weapon', techBase: 'Inner Sphere' },
  { id: 'lrm10', name: 'LRM 10', requiredSlots: 2, weight: 5, type: 'weapon', techBase: 'Inner Sphere' },
  { id: 'lrm15', name: 'LRM 15', requiredSlots: 3, weight: 7, type: 'weapon', techBase: 'Inner Sphere' },
  { id: 'lrm20', name: 'LRM 20', requiredSlots: 5, weight: 10, type: 'weapon', techBase: 'Inner Sphere' },
  { id: 'srm2', name: 'SRM 2', requiredSlots: 1, weight: 1, type: 'weapon', techBase: 'Inner Sphere' },
  { id: 'srm4', name: 'SRM 4', requiredSlots: 1, weight: 2, type: 'weapon', techBase: 'Inner Sphere' },
  { id: 'srm6', name: 'SRM 6', requiredSlots: 2, weight: 3, type: 'weapon', techBase: 'Inner Sphere' },
  
  // Ammunition
  { id: 'ac2-ammo', name: 'AC/2 Ammo', requiredSlots: 1, weight: 1, type: 'ammo', techBase: 'Inner Sphere' },
  { id: 'ac5-ammo', name: 'AC/5 Ammo', requiredSlots: 1, weight: 1, type: 'ammo', techBase: 'Inner Sphere' },
  { id: 'ac10-ammo', name: 'AC/10 Ammo', requiredSlots: 1, weight: 1, type: 'ammo', techBase: 'Inner Sphere' },
  { id: 'ac20-ammo', name: 'AC/20 Ammo', requiredSlots: 1, weight: 1, type: 'ammo', techBase: 'Inner Sphere' },
  { id: 'gauss-ammo', name: 'Gauss Rifle Ammo', requiredSlots: 1, weight: 1, type: 'ammo', techBase: 'Inner Sphere' },
  { id: 'lrm-ammo', name: 'LRM Ammo', requiredSlots: 1, weight: 1, type: 'ammo', techBase: 'Inner Sphere' },
  { id: 'srm-ammo', name: 'SRM Ammo', requiredSlots: 1, weight: 1, type: 'ammo', techBase: 'Inner Sphere' },
  { id: 'mg-ammo', name: 'Machine Gun Ammo', requiredSlots: 1, weight: 1, type: 'ammo', techBase: 'Inner Sphere' },
  
  // Heat Sinks & Equipment
  { id: 'heat-sink', name: 'Heat Sink', requiredSlots: 1, weight: 1, type: 'heat_sink', techBase: 'Inner Sphere' },
  { id: 'double-heat-sink', name: 'Double Heat Sink', requiredSlots: 3, weight: 1, type: 'heat_sink', techBase: 'Inner Sphere' },
  { id: 'jump-jet', name: 'Jump Jet', requiredSlots: 1, weight: 0.5, type: 'equipment', techBase: 'Inner Sphere' },
  { id: 'case', name: 'CASE', requiredSlots: 1, weight: 0.5, type: 'equipment', techBase: 'Inner Sphere' },
  { id: 'artemis-iv', name: 'Artemis IV FCS', requiredSlots: 1, weight: 1, type: 'equipment', techBase: 'Inner Sphere' },
  
  // Clan Equipment
  { id: 'clan-er-medium-laser', name: 'ER Medium Laser', requiredSlots: 1, weight: 1, type: 'weapon', techBase: 'Clan' },
  { id: 'clan-er-large-laser', name: 'ER Large Laser', requiredSlots: 1, weight: 4, type: 'weapon', techBase: 'Clan' },
  { id: 'clan-er-ppc', name: 'ER PPC', requiredSlots: 2, weight: 6, type: 'weapon', techBase: 'Clan' },
  { id: 'clan-ultra-ac5', name: 'Ultra AC/5', requiredSlots: 5, weight: 8, type: 'weapon', techBase: 'Clan' },
  { id: 'clan-lrm20', name: 'LRM 20', requiredSlots: 4, weight: 5, type: 'weapon', techBase: 'Clan' },
]

interface EquipmentRowProps {
  equipment: EquipmentObject
}

function EquipmentRow({ equipment }: EquipmentRowProps) {
  const { addEquipmentToUnit } = useUnit()
  
  const getTypeColor = (type: string): string => {
    const colors = {
      'weapon': 'bg-red-700',
      'ammo': 'bg-orange-700',
      'equipment': 'bg-blue-700',
      'heat_sink': 'bg-cyan-700',
    }
    return colors[type as keyof typeof colors] || 'bg-gray-600'
  }
  
  const getTechBaseColor = (techBase: string): string => {
    return techBase === 'Clan' ? 'text-green-400' : 'text-blue-400'
  }
  
  const handleAdd = () => {
    // Add as unallocated equipment for manual placement
    addEquipmentToUnit(equipment)
  }
  
  return (
    <tr className="border-b border-gray-600 hover:bg-gray-700 transition-colors">
      {/* Equipment Name */}
      <td className="px-3 py-2">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded ${getTypeColor(equipment.type)}`}></div>
          <span className="text-white font-medium text-sm">{equipment.name}</span>
        </div>
      </td>
      
      {/* Type */}
      <td className="px-3 py-2 text-gray-300 text-xs capitalize">
        {equipment.type.replace('_', ' ')}
      </td>
      
      {/* Slots */}
      <td className="px-3 py-2 text-center">
        <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">
          {equipment.requiredSlots}
        </span>
      </td>
      
      {/* Weight */}
      <td className="px-3 py-2 text-gray-300 text-xs text-center">
        {equipment.weight}
      </td>
      
      {/* Tech Base */}
      <td className="px-3 py-2 text-xs">
        <span className={getTechBaseColor(equipment.techBase)}>
          {equipment.techBase}
        </span>
      </td>
      
      {/* Add Button */}
      <td className="px-3 py-2 text-center">
        <button
          onClick={handleAdd}
          className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1 rounded transition-colors"
        >
          Add
        </button>
      </td>
    </tr>
  )
}

export function EquipmentBrowser() {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [techBaseFilter, setTechBaseFilter] = useState<string>('all')
  
  const filteredEquipment = useMemo(() => {
    return EQUIPMENT_DATABASE.filter(equipment => {
      const matchesSearch = equipment.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = typeFilter === 'all' || equipment.type === typeFilter
      const matchesTechBase = techBaseFilter === 'all' || equipment.techBase === techBaseFilter
      
      return matchesSearch && matchesType && matchesTechBase
    })
  }, [searchTerm, typeFilter, techBaseFilter])
  
  const equipmentTypes = Array.from(new Set(EQUIPMENT_DATABASE.map(eq => eq.type)))
  const techBases = Array.from(new Set(EQUIPMENT_DATABASE.map(eq => eq.techBase)))
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <h2 className="text-white text-lg font-bold mb-4">Equipment Browser</h2>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
        
        {/* Type Filter */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">Equipment Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Types</option>
            {equipmentTypes.map(type => (
              <option key={type} value={type}>
                {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
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
            {techBases.map(techBase => (
              <option key={techBase} value={techBase}>{techBase}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Results Count */}
      <div className="mb-4 text-gray-400 text-sm">
        Showing {filteredEquipment.length} of {EQUIPMENT_DATABASE.length} equipment items
      </div>
      
      {/* Equipment Table */}
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-gray-800">
            <tr className="border-b border-gray-600">
              <th className="px-3 py-2 text-gray-300 text-sm font-medium">Equipment</th>
              <th className="px-3 py-2 text-gray-300 text-sm font-medium">Type</th>
              <th className="px-3 py-2 text-gray-300 text-sm font-medium text-center">Slots</th>
              <th className="px-3 py-2 text-gray-300 text-sm font-medium text-center">Weight</th>
              <th className="px-3 py-2 text-gray-300 text-sm font-medium">Tech Base</th>
              <th className="px-3 py-2 text-gray-300 text-sm font-medium text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredEquipment.map((equipment) => (
              <EquipmentRow key={equipment.id} equipment={equipment} />
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Instructions */}
      <div className="mt-4 pt-4 border-t border-gray-600">
        <div className="text-gray-400 text-xs">
          <p className="mb-1">• Click <span className="text-green-400">Add</span> to add equipment to unallocated list</p>
          <p className="mb-1">• Use filters to find specific equipment types</p>
          <p>• <span className="text-blue-400">Inner Sphere</span> and <span className="text-green-400">Clan</span> tech bases available</p>
          <p>• Refer to the Unified Color Legend above for color coding reference</p>
        </div>
      </div>
    </div>
  )
}
