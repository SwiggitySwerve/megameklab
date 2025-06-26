/**
 * Unallocated Equipment Tray - Expandable sidebar showing equipment not yet assigned to critical slots
 * Persistent across all tabs in the customizer
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useUnit } from '../multiUnit/MultiUnitProvider';
import { EquipmentObject } from '../../utils/criticalSlots/CriticalSlot';

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
  // Equipment type color coding
  const getEquipmentTypeColor = (type: EquipmentObject['type']) => {
    const colors = {
      weapon: 'bg-red-700 text-red-100',
      ammo: 'bg-orange-700 text-orange-100',
      heat_sink: 'bg-cyan-700 text-cyan-100',
      equipment: 'bg-blue-700 text-blue-100'
    };
    return colors[type] || 'bg-gray-700 text-gray-100';
  };

  // Tech base color coding
  const getTechBaseColor = (techBase: EquipmentObject['techBase']) => {
    return techBase === 'Clan' ? 'text-green-400' : 'text-blue-400';
  };

  return (
    <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded border border-slate-600 hover:bg-slate-700/50 transition-colors">
      <div className="flex-1 min-w-0">
        {/* Equipment Type Badge */}
        <div className="flex items-center gap-2 mb-1">
          <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${getEquipmentTypeColor(equipment.type)}`}>
            {equipment.type.toUpperCase()}
          </div>
          <div className={`text-xs ${getTechBaseColor(equipment.techBase)}`}>
            {equipment.techBase}
          </div>
        </div>
        
        {/* Equipment Name */}
        <div className="font-medium text-slate-100 text-sm truncate">{equipment.name}</div>
        
        {/* Equipment Stats */}
        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
          <span>{equipment.weight}t</span>
          <span>{equipment.requiredSlots} slots</span>
          {equipment.heat && equipment.heat > 0 && (
            <span className="text-orange-400">+{equipment.heat} heat</span>
          )}
        </div>
      </div>
      
      {/* Remove Button */}
      <button
        onClick={() => onRemove(equipment.id)}
        disabled={readOnly}
        className="ml-2 px-2 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded text-xs font-medium transition-colors flex-shrink-0"
        title="Remove equipment"
      >
        ×
      </button>
    </div>
  );
}

export function UnallocatedEquipmentTray({ isExpanded, onToggle }: UnallocatedEquipmentTrayProps) {
  const router = useRouter();
  const { unit, unallocatedEquipment, removeEquipment } = useUnit();

  // Calculate equipment statistics
  const equipmentStats = useMemo(() => {
    let totalWeight = 0;
    let totalSlots = 0;
    let totalHeat = 0;

    unallocatedEquipment.forEach((equipment: any) => {
      totalWeight += equipment.weight || 0;
      totalSlots += equipment.requiredSlots || 0;
      totalHeat += equipment.heat || 0;
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
              <p className="mb-1">• Equipment here isn't assigned to critical slots yet</p>
              <p className="mb-1">• Use the Criticals tab to assign equipment to locations</p>
              <p>• Remove unwanted equipment with the × button</p>
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
