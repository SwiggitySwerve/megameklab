/**
 * Unallocated Equipment Tray - Expandable sidebar showing equipment not yet assigned to critical slots
 * Persistent across all tabs in the customizer
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useUnit } from '../multiUnit/MultiUnitProvider';
import { EquipmentObject } from '../../utils/criticalSlots/CriticalSlot';
import { 
  getEquipmentTypeBadgeClasses, 
  getEquipmentTypeDisplayName,
  getTechBaseColors,
  getTechBaseDisplayName,
  getEquipmentSortPriority
} from '../../utils/equipmentColors';

interface UnallocatedEquipmentTrayProps {
  isExpanded: boolean;
  onToggle: () => void;
}

// Individual equipment item component
interface EquipmentTrayItemProps {
  equipment: EquipmentObject;
  index: number;
  onRemove: (id: string) => void;
  readOnly?: boolean;
}

function EquipmentTrayItem({ equipment, index, onRemove, readOnly = false }: EquipmentTrayItemProps) {
  // State for selection (for future critical slot assignment)
  const [isSelected, setIsSelected] = React.useState(false);
  
  // Safely access equipment properties with any type
  const equipmentAny = equipment as any;
  
  // Check for V2 EquipmentAllocation structure first (most common)
  const actualEquipment = equipmentAny.equipmentData || equipmentAny;
  
  // Extract equipment data with comprehensive fallback patterns
  // Priority: V2 nested structure -> direct structure -> legacy patterns
  const equipmentData = {
    name: actualEquipment.name || 
          actualEquipment.equipmentName || 
          actualEquipment.variant_name || 
          equipmentAny.name || 
          equipmentAny.equipmentName || 
          'Unknown Equipment',
    
    type: actualEquipment.type || 
          actualEquipment.equipmentType || 
          actualEquipment.category || 
          equipmentAny.type || 
          equipmentAny.equipmentType || 
          equipmentAny.category || 
          'equipment',
    
    techBase: actualEquipment.techBase || 
              actualEquipment.tech_base || 
              actualEquipment.techbase || 
              equipmentAny.techBase || 
              equipmentAny.tech_base || 
              equipmentAny.techbase || 
              'Inner Sphere',
    
    weight: actualEquipment.weight || 
            actualEquipment.weight_tons || 
            actualEquipment.tonnage || 
            equipmentAny.weight || 
            equipmentAny.weight_tons || 
            equipmentAny.tonnage || 
            0,
    
    slots: actualEquipment.requiredSlots || 
           actualEquipment.critical_slots || 
           actualEquipment.slots || 
           equipmentAny.requiredSlots || 
           equipmentAny.critical_slots || 
           equipmentAny.slots || 
           0,
    
    heat: actualEquipment.heat || 
          actualEquipment.heat_generated || 
          actualEquipment.heatGeneration || 
          equipmentAny.heat || 
          equipmentAny.heat_generated || 
          equipmentAny.heatGeneration || 
          0,
    
    id: equipmentAny.equipmentGroupId || 
        actualEquipment.id || 
        actualEquipment.equipmentId || 
        equipmentAny.id || 
        equipmentAny.equipmentId || 
        `equipment-${index}`
  };
  
  // Debug logging for development (can be removed in production)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('EquipmentTrayItem data extraction:', {
        originalEquipment: equipmentAny,
        extractedData: equipmentData,
        hasNestedData: !!equipmentAny.equipmentData
      });
    }
  }, [equipmentAny, equipmentData]);

  // V2 Demo style equipment type colors
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

  // Tech base abbreviation helper
  const getTechAbbreviation = (techBase: string): string => {
    switch (techBase) {
      case 'Inner Sphere': return 'IS'
      case 'Clan': return 'CLAN'
      case 'Star League': return 'SL'
      default: return techBase.substring(0, 3).toUpperCase()
    }
  }

  // Handle single click for selection
  const handleClick = () => {
    if (readOnly) return;
    setIsSelected(!isSelected);
  }

  // Handle double click for removal
  const handleDoubleClick = () => {
    if (readOnly) return;
    onRemove(equipmentData.id);
  }

  // Dynamic tooltip based on state
  const getTooltip = () => {
    if (readOnly) return equipmentData.name;
    return isSelected 
      ? 'Click to deselect • Double-click to remove'
      : 'Click to select • Double-click to remove';
  }

  return (
    <div 
      className={`${getEquipmentTypeColor(equipmentData.type)} 
                 text-white px-2 py-1 rounded border transition-colors hover:opacity-80 
                 cursor-pointer transform hover:scale-105 ${isSelected ? 'ring-2 ring-blue-400' : ''} 
                 min-w-0 flex-shrink-0 relative`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title={getTooltip()}
    >
      {/* Yellow star indicator for selected equipment */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-300 text-black rounded-full flex items-center justify-center text-xs font-bold">
          ★
        </div>
      )}
      
      {/* Header with name and tech type */}
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-xs pr-1 truncate">{equipmentData.name}</h4>
        <span className="text-xs font-bold bg-black bg-opacity-40 px-1 py-0.5 rounded text-gray-200">
          ({getTechAbbreviation(equipmentData.techBase)})
        </span>
      </div>
      
      {/* Condensed stats in single line */}
      <div className="text-xs text-gray-300 leading-tight">
        <span>
          {equipmentData.slots}cr • {equipmentData.weight}t
          {equipmentData.heat !== undefined && equipmentData.heat !== 0 && (
            <span> • {equipmentData.heat > 0 ? '+' : ''}{equipmentData.heat}h</span>
          )}
        </span>
        {isSelected && (
          <div className="text-blue-300 font-medium text-xs">Click slot to assign</div>
        )}
      </div>
    </div>
  );
}

export function UnallocatedEquipmentTray({ isExpanded, onToggle }: UnallocatedEquipmentTrayProps) {
  const router = useRouter();
  const { unit, unallocatedEquipment, removeEquipment } = useUnit();

  // Calculate equipment statistics with V2 structure support
  const equipmentStats = useMemo(() => {
    let totalWeight = 0;
    let totalSlots = 0;
    let totalHeat = 0;

    unallocatedEquipment.forEach((equipment: any) => {
      // Check for V2 EquipmentAllocation structure first
      const actualEquipment = equipment.equipmentData || equipment;
      
      // Extract values with comprehensive fallback patterns
      const weight = actualEquipment.weight || 
                    actualEquipment.weight_tons || 
                    actualEquipment.tonnage || 
                    equipment.weight || 
                    equipment.weight_tons || 
                    equipment.tonnage || 
                    0;
      
      const slots = actualEquipment.requiredSlots || 
                    actualEquipment.critical_slots || 
                    actualEquipment.slots || 
                    equipment.requiredSlots || 
                    equipment.critical_slots || 
                    equipment.slots || 
                    0;
      
      const heat = actualEquipment.heat || 
                   actualEquipment.heat_generated || 
                   actualEquipment.heatGeneration || 
                   equipment.heat || 
                   equipment.heat_generated || 
                   equipment.heatGeneration || 
                   0;
      
      totalWeight += weight;
      totalSlots += slots;
      totalHeat += heat;
    });

    return {
      totalWeight,
      totalSlots,
      totalHeat,
      count: unallocatedEquipment.length
    };
  }, [unallocatedEquipment]);

  // Get remaining capacity
  const remainingWeight = unit.getRemainingTonnage();
  const remainingSlots = 78 - unit.getSummary().occupiedSlots;

  // Handle equipment removal
  const handleRemoveEquipment = (equipmentId: string) => {
    removeEquipment(equipmentId);
  };

  // Handle navigation to equipment tab
  const handleGoToEquipmentTab = () => {
    const newQuery = { ...router.query, tab: 'equipment' };
    router.replace(
      {
        pathname: router.pathname,
        query: newQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  return (
    <>
      {/* Toggle Button - Always visible */}
      <button
        onClick={onToggle}
        className={`fixed top-1/4 z-50 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-l-md border-l border-t border-b border-slate-600 transition-all duration-300 shadow-lg`}
        title={isExpanded ? 'Collapse Equipment Tray' : 'Expand Equipment Tray'}
        style={{ 
          right: isExpanded ? '320px' : '-2px',
          height: '50vh', // Middle half of screen height
          width: '20px'
        }}
      >
        <div className="flex flex-col items-center justify-between h-full py-2">
          <div className={`transform transition-transform text-xs ${isExpanded ? 'rotate-0' : 'rotate-180'}`}>
            ▶
          </div>
          <div className="text-xs font-medium transform -rotate-90 whitespace-nowrap" style={{ transformOrigin: 'center' }}>
            Equipment
          </div>
          <div className="flex items-center justify-center">
            {equipmentStats.count > 0 && (
              <div className="bg-orange-600 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center font-bold" style={{ fontSize: '10px' }}>
                {equipmentStats.count > 9 ? '9' : equipmentStats.count}
              </div>
            )}
          </div>
        </div>
      </button>

      {/* Equipment Tray Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-slate-800 border-l border-slate-700 transform transition-transform duration-300 ease-in-out z-40 ${
          isExpanded ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-100 font-medium">Unallocated Equipment</h3>
            <button
              onClick={onToggle}
              className="text-slate-400 hover:text-slate-100 transition-colors"
              title="Close tray"
            >
              ×
            </button>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-700/30 rounded p-2 text-center">
              <div className="text-slate-400">Items</div>
              <div className="font-medium text-slate-100">{equipmentStats.count}</div>
            </div>
            <div className="bg-slate-700/30 rounded p-2 text-center">
              <div className="text-slate-400">Weight</div>
              <div className={`font-medium ${
                equipmentStats.totalWeight > remainingWeight ? 'text-red-400' : 'text-slate-100'
              }`}>
                {equipmentStats.totalWeight.toFixed(1)}t
              </div>
            </div>
            <div className="bg-slate-700/30 rounded p-2 text-center">
              <div className="text-slate-400">Slots</div>
              <div className={`font-medium ${
                equipmentStats.totalSlots > remainingSlots ? 'text-red-400' : 'text-slate-100'
              }`}>
                {equipmentStats.totalSlots}
              </div>
            </div>
            <div className="bg-slate-700/30 rounded p-2 text-center">
              <div className="text-slate-400">Heat</div>
              <div className="font-medium text-orange-400">+{equipmentStats.totalHeat}</div>
            </div>
          </div>

          {/* Capacity Warnings */}
          {(equipmentStats.totalWeight > remainingWeight || equipmentStats.totalSlots > remainingSlots) && (
            <div className="mt-3 p-2 bg-red-900/20 border border-red-600/30 rounded text-red-300 text-xs">
              <div className="font-medium mb-1">⚠️ Capacity Exceeded</div>
              {equipmentStats.totalWeight > remainingWeight && (
                <div>• Weight over by {(equipmentStats.totalWeight - remainingWeight).toFixed(1)}t</div>
              )}
              {equipmentStats.totalSlots > remainingSlots && (
                <div>• Slots over by {equipmentStats.totalSlots - remainingSlots}</div>
              )}
            </div>
          )}
        </div>

        {/* Equipment List */}
        <div className="flex-1 overflow-auto p-4">
          {unallocatedEquipment.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <div className="text-4xl mb-4">⚙️</div>
              <h4 className="font-medium mb-2">No Equipment Added</h4>
              <p className="text-sm mb-4">
                Use the Equipment Browser to add weapons and equipment to your unit
              </p>
              <button
                onClick={handleGoToEquipmentTab}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                <span>🔧</span>
                Go to Equipment Tab
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {unallocatedEquipment.map((equipment: any, index: number) => (
                <EquipmentTrayItem
                  key={`${equipment.id}-${index}`}
                  equipment={equipment}
                  index={index}
                  onRemove={handleRemoveEquipment}
                  readOnly={false}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Instructions */}
        {unallocatedEquipment.length > 0 && (
          <div className="flex-shrink-0 p-4 border-t border-slate-700 bg-slate-800/50">
            <div className="text-slate-400 text-xs">
              <p className="mb-1">• Click equipment to select for critical slot assignment</p>
              <p className="mb-1">• Double-click equipment to remove from unit</p>
              <p className="mb-1">• Selected equipment shows yellow star and blue ring</p>
              <p>• Heat: +X = generated, -X = dissipated</p>
            </div>
          </div>
        )}
      </div>

      {/* Backdrop overlay when expanded (for mobile) */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}
