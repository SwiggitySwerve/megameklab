import React, { useState, useCallback, useMemo } from 'react';
import { EditorComponentProps } from '../../../types/editor';
import EquipmentDatabase from '../equipment/EquipmentDatabase';
import UnallocatedEquipmentPanel from '../equipment/UnallocatedEquipmentPanel';
import EquipmentSummaryPanel from '../equipment/EquipmentSummaryPanel';

const EquipmentTab: React.FC<EditorComponentProps> = ({
  unit,
  onUnitChange,
  validationErrors = [],
  readOnly = false,
  compact = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);

  // Calculate current equipment statistics
  const equipmentStats = useMemo(() => {
    const placements = unit.equipmentPlacements || [];
    const totalWeight = placements.reduce((sum, placement) => {
      return sum + (placement.equipment.weight || 0);
    }, 0);

    const totalCriticals = placements.reduce((sum, placement) => {
      return sum + (placement.equipment.space || 0);
    }, 0);

    const unallocatedEquipment = placements.filter(p => !p.location || p.location === 'unallocated');

    return {
      totalWeight,
      totalCriticals,
      unallocatedCount: unallocatedEquipment.length,
      allocatedCount: placements.length - unallocatedEquipment.length,
    };
  }, [unit.equipmentPlacements]);

  // Handle equipment addition from database
  const handleAddEquipment = useCallback((equipment: any) => {
    const newPlacement = {
      id: `placement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      equipment,
      location: 'unallocated', // Start in unallocated pool
      criticalSlots: [],
    };

    const updatedPlacements = [...(unit.equipmentPlacements || []), newPlacement];

    onUnitChange({
      ...unit,
      equipmentPlacements: updatedPlacements,
    });
  }, [unit, onUnitChange]);

  // Handle equipment removal
  const handleRemoveEquipment = useCallback((placementId: string) => {
    const updatedPlacements = (unit.equipmentPlacements || []).filter(p => p.id !== placementId);

    onUnitChange({
      ...unit,
      equipmentPlacements: updatedPlacements,
    });
  }, [unit, onUnitChange]);

  // Handle equipment location change
  const handleEquipmentLocationChange = useCallback((placementId: string, newLocation: string) => {
    const updatedPlacements = (unit.equipmentPlacements || []).map(p => 
      p.id === placementId 
        ? { ...p, location: newLocation }
        : p
    );

    onUnitChange({
      ...unit,
      equipmentPlacements: updatedPlacements,
    });
  }, [unit, onUnitChange]);

  return (
    <div className="equipment-tab">
      <div className="grid grid-cols-4 gap-4 max-w-7xl">
        {/* Left Column - Equipment Database */}
        <div className="col-span-2">
          <EquipmentDatabase
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedEquipment={selectedEquipment}
            onEquipmentSelect={setSelectedEquipment}
            onEquipmentAdd={handleAddEquipment}
            readOnly={readOnly}
            compact={compact}
          />
        </div>

        {/* Center Column - Unallocated Equipment */}
        <div>
          <UnallocatedEquipmentPanel
            unit={unit}
            onEquipmentRemove={handleRemoveEquipment}
            onEquipmentLocationChange={handleEquipmentLocationChange}
            validationErrors={validationErrors}
            readOnly={readOnly}
            compact={compact}
          />
        </div>

        {/* Right Column - Equipment Summary & Actions */}
        <div>
          <EquipmentSummaryPanel
            unit={unit}
            equipmentStats={equipmentStats}
            validationErrors={validationErrors}
            readOnly={readOnly}
            compact={compact}
          />
        </div>
      </div>

      {/* Weight and Critical Slot Warnings */}
      {equipmentStats.totalWeight > unit.mass && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800 font-medium">
              Equipment weight ({equipmentStats.totalWeight}t) exceeds unit tonnage ({unit.mass}t)
            </span>
          </div>
        </div>
      )}

      {equipmentStats.unallocatedCount > 0 && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-800 font-medium">
              {equipmentStats.unallocatedCount} equipment item{equipmentStats.unallocatedCount !== 1 ? 's' : ''} not allocated to locations
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentTab;
