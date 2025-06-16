/**
 * Unallocated Equipment Display - Shows equipment that couldn't be allocated
 * Dark theme component showing displaced equipment
 */

import React from 'react'
import { useUnit } from './UnitProvider'
import { EquipmentAllocation } from '../../utils/criticalSlots/CriticalSlot'

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

  const handleClick = () => {
    if (isSelected) {
      selectEquipment(null) // Deselect if already selected
    } else {
      selectEquipment(equipment.equipmentGroupId) // Select this equipment
    }
  }

  return (
    <div 
      className={`${getEquipmentTypeColor(equipment.equipmentData.type)} 
                 text-white p-3 rounded border transition-colors hover:opacity-80 
                 cursor-pointer transform hover:scale-105 ${isSelected ? 'ring-2 ring-blue-400' : ''} 
                 min-w-0 flex-shrink-0 relative`}
      onClick={handleClick}
      title={isSelected ? 'Click to deselect' : 'Click to select for assignment'}
    >
      {/* Yellow star indicator for selected equipment */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-300 text-black rounded-full flex items-center justify-center text-sm font-bold">
          ★
        </div>
      )}
      
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-sm">{equipment.equipmentData.name}</h4>
        <span className="text-xs bg-gray-800 px-2 py-1 rounded ml-2">
          {equipment.equipmentData.requiredSlots} slot{equipment.equipmentData.requiredSlots !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="text-xs text-gray-300 space-y-1">
        <div>Type: {equipment.equipmentData.type}</div>
        <div>Weight: {equipment.equipmentData.weight} tons</div>
        <div>Tech Base: {equipment.equipmentData.techBase}</div>
        {equipment.location && (
          <div>Previous Location: {equipment.location}</div>
        )}
        {isSelected && (
          <div className="text-blue-300 font-medium">Selected - Click empty slot to assign</div>
        )}
      </div>
    </div>
  )
}

export function UnallocatedEquipmentDisplay() {
  const { unallocatedEquipment, summary } = useUnit()

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white text-lg font-bold">Unallocated Equipment</h2>
        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
          {unallocatedEquipment.length} item{unallocatedEquipment.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      {unallocatedEquipment.length === 0 ? (
        <div className="bg-gray-900 border border-gray-600 p-6 rounded text-center">
          <div className="text-gray-400 mb-2">✓ All equipment allocated</div>
          <div className="text-xs text-gray-500">
            No equipment has been displaced by system component changes
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-300">
            The following equipment was displaced and needs to be reallocated:
          </div>
          
          <div className="flex flex-wrap gap-3 mb-4">
            {unallocatedEquipment.map(equipment => (
              <EquipmentItem 
                key={equipment.equipmentGroupId} 
                equipment={equipment} 
              />
            ))}
          </div>

          {/* Summary Information */}
          <div className="bg-gray-900 border border-gray-600 p-3 rounded">
            <h4 className="text-gray-300 text-sm font-medium mb-2">Displacement Summary:</h4>
            <div className="text-xs text-gray-400 grid grid-cols-2 gap-4">
              <div>
                <span className="text-red-400">Unallocated:</span> {summary.unallocatedEquipment}
              </div>
              <div>
                <span className="text-green-400">Allocated:</span> {summary.totalEquipment}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Instructions */}
      <div className="mt-4 pt-4 border-t border-gray-600">
        <div className="text-gray-400 text-xs">
          <p className="mb-1">• Click equipment to select for assignment to critical slots</p>
          <p className="mb-1">• Selected equipment shows yellow star and blue selection ring</p>
          <p>• Refer to the Unified Color Legend above for complete color coding reference</p>
        </div>
      </div>
    </div>
  )
}
