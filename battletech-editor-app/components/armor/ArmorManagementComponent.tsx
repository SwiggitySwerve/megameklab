import React, { useState, useCallback, useMemo } from 'react';
import { EditableUnit, ArmorType, ARMOR_TYPES } from '../../types/editor';
import { FullUnit } from '../../types';
import { useArmorCalculations, isEditableUnit } from './hooks/useArmorCalculations';
import { useArmorValidation } from './hooks/useArmorValidation';
import { useArmorInteractions } from './hooks/useArmorInteractions';
import ArmorTypeSelector from '../editor/armor/ArmorTypeSelector';
import ArmorTonnageControl from '../editor/armor/ArmorTonnageControl';
import ArmorDistributionPresets from '../editor/armor/ArmorDistributionPresets';
import ArmorStatisticsPanel from '../editor/armor/ArmorStatisticsPanel';
import MechArmorDiagram from '../editor/armor/MechArmorDiagram';
import { autoAllocateArmor } from '../../utils/armorAllocation';

export interface ArmorManagementComponentProps {
  // Required
  unit: EditableUnit | FullUnit;
  readOnly: boolean;
  
  // Edit mode only
  onUnitChange?: (updates: Partial<EditableUnit>) => void;
  validationErrors?: any[];
  
  // Optional
  className?: string;
  showStatistics?: boolean;
  compactMode?: boolean;
  highlightChanges?: boolean;
}

const ArmorManagementComponent: React.FC<ArmorManagementComponentProps> = ({
  unit,
  readOnly,
  onUnitChange,
  validationErrors = [],
  className = '',
  showStatistics = true,
  compactMode = false,
  highlightChanges = false,
}) => {
  // State management
  const [selectedArmorType, setSelectedArmorType] = useState<ArmorType>(
    ARMOR_TYPES.find(type => type.id === 'standard') || ARMOR_TYPES[0]
  );
  const [armorTonnage, setArmorTonnage] = useState<number>(0);

  // Use custom hooks
  const armorCalcs = useArmorCalculations(unit);
  const validation = useArmorValidation(
    armorCalcs.locations,
    armorTonnage,
    unit.mass * 0.5 // Max 50% of mech tonnage
  );
  const interactions = useArmorInteractions(readOnly, handleArmorLocationChange);

  // Calculate total armor points available
  const totalArmorPoints = Math.floor(armorTonnage * selectedArmorType.pointsPerTon);
  const maxTonnage = unit.mass * 0.5;

  // Handle armor type change (edit mode only)
  const handleArmorTypeChange = useCallback((armorType: ArmorType) => {
    if (readOnly) return;
    setSelectedArmorType(armorType);
  }, [readOnly]);

  // Handle armor tonnage change (edit mode only)
  const handleArmorTonnageChange = useCallback((tonnage: number) => {
    if (readOnly) return;
    setArmorTonnage(tonnage);
  }, [readOnly]);

  // Handle armor optimization (edit mode only)
  const handleOptimizeArmor = useCallback((newTonnage: number) => {
    if (readOnly || !onUnitChange) return;
    
    // Update armor tonnage in the unit's data structure
    onUnitChange({
      data: {
        ...unit.data,
        armor: {
          ...unit.data?.armor,
          total_armor_tonnage: newTonnage
        } as any // Type assertion to work around interface limitation
      }
    });
    
    // Update local state
    setArmorTonnage(newTonnage);
  }, [readOnly, onUnitChange, unit.data]);

  // Handle armor location change (edit mode only)
  function handleArmorLocationChange(location: string, front: number, rear: number) {
    if (readOnly || !onUnitChange) return;
    
    // Get current values
    const currentLocation = armorCalcs.locations[location];
    if (!currentLocation) return;

    // Use -1 as a sentinel value for "don't change"
    const newFront = front === -1 ? currentLocation.front : front;
    const newRear = rear === -1 ? currentLocation.rear : rear;
    
    // Update the armor allocation for this location
    const updatedArmorAllocation = {
      ...((unit as EditableUnit).armorAllocation || {}),
      [location]: {
        front: newFront,
        rear: newRear,
        maxArmor: currentLocation.max,
        type: selectedArmorType
      }
    };

    onUnitChange({
      armorAllocation: updatedArmorAllocation
    });
  }

  // Handle applying armor distribution from presets
  const handleApplyDistribution = useCallback((distribution: any) => {
    if (readOnly || !onUnitChange) return;

    // Build updated armor allocation with all required properties
    const locations = ['Head', 'Center Torso', 'Left Torso', 'Right Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg'];
    const updatedArmorAllocation: { [key: string]: any } = {};

    locations.forEach(location => {
      const calcLocation = armorCalcs.locations[location];
      if (calcLocation && distribution[location]) {
        updatedArmorAllocation[location] = {
          front: distribution[location].front,
          rear: distribution[location].rear,
          maxArmor: calcLocation.max,
          type: selectedArmorType
        };
      }
    });

    onUnitChange({
      armorAllocation: updatedArmorAllocation
    });
  }, [armorCalcs.locations, selectedArmorType, onUnitChange, readOnly]);

  // Handle maximize armor
  const handleMaximizeArmor = useCallback(() => {
    if (readOnly || !onUnitChange) return;
    
    const maxArmorPoints = armorCalcs.totalMax;
    const maxTonnage = Math.ceil((maxArmorPoints / selectedArmorType.pointsPerTon) * 2) / 2;
    setArmorTonnage(maxTonnage);
    
    // Create temporary unit with max armor points
    const tempUnit = {
      ...unit,
      data: {
        ...unit.data,
        armor: {
          ...unit.data?.armor,
          total_armor_points: maxArmorPoints,
          locations: unit.data?.armor?.locations || []
        }
      }
    };
    
    const allocation = autoAllocateArmor(tempUnit as EditableUnit);
    handleApplyDistribution(allocation);
  }, [unit, selectedArmorType, armorCalcs.totalMax, handleApplyDistribution, readOnly, onUnitChange]);

  // Render compact mode for read-only views
  if (compactMode && readOnly) {
    return (
      <div className={`armor-management-compact ${className}`}>
        <div className="bg-gray-800 rounded-lg p-4">
          <MechArmorDiagram
            unit={unit as EditableUnit}
            onArmorChange={() => {}} // No-op in read-only
            readOnly={true}
          />
          {showStatistics && (
            <div className="mt-4 text-sm text-gray-300">
              <div>Total Armor: {armorCalcs.totalArmor} points</div>
              <div>Coverage: {Math.round(armorCalcs.overallCoverage)}%</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full component render
  return (
    <div className={`armor-management-component space-y-6 ${className}`}>
      {/* Controls Section - Edit Mode Only */}
      {!readOnly && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Armor Type Selection */}
            <ArmorTypeSelector
              currentType={selectedArmorType}
              onChange={handleArmorTypeChange}
              disabled={readOnly}
            />

            {/* Armor Tonnage Control */}
            <ArmorTonnageControl
              currentTonnage={armorTonnage}
              maxTonnage={maxTonnage}
              onChange={handleArmorTonnageChange}
              armorType={selectedArmorType}
              disabled={readOnly}
            />
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleMaximizeArmor}
              disabled={readOnly}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Maximize Armor
            </button>
          </div>

          {/* Armor Distribution Presets */}
          <ArmorDistributionPresets
            unit={unit as EditableUnit}
            totalArmorPoints={totalArmorPoints}
            onApplyDistribution={handleApplyDistribution}
            disabled={readOnly}
          />
        </>
      )}

      {/* Mech Armor Diagram */}
      <div className="armor-diagram-section">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">
          {readOnly ? 'Armor Configuration' : 'Interactive Mech Diagram'}
        </h3>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <MechArmorDiagram
            unit={unit as EditableUnit}
            onArmorChange={handleArmorLocationChange}
            readOnly={readOnly}
          />
        </div>
      </div>

      {/* Armor Statistics */}
      {showStatistics && (
        <ArmorStatisticsPanel
          unit={unit as EditableUnit}
          totalArmorTonnage={armorTonnage}
          onArmorTypeChange={handleArmorTypeChange}
          onOptimizeArmor={handleOptimizeArmor}
          readOnly={readOnly}
        />
      )}

      {/* Validation Feedback */}
      {!readOnly && validation.errors.length > 0 && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <h4 className="text-red-400 font-semibold mb-2">Validation Errors</h4>
          <ul className="list-disc list-inside text-sm text-red-300">
            {validation.errors.map((error, index) => (
              <li key={index}>{error.location}: {error.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Open in Editor Button - Read-Only Mode */}
      {readOnly && (
        <div className="flex justify-center mt-6">
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            Open in Unit Editor
          </button>
        </div>
      )}
    </div>
  );
};

export default ArmorManagementComponent;
