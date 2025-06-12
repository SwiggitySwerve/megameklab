import React, { useState, useCallback, useMemo } from 'react';
import { ArmorAllocationProps, MECH_LOCATIONS } from '../../../types/editor';
import ArmorLocationControl from './ArmorLocationControl';
import { 
  autoAllocateArmor, 
  maximizeArmor, 
  useRemainingTonnageForArmor,
  calculateMaxArmorTonnage 
} from '../../../utils/armorAllocation';

interface ArmorAllocationPanelProps extends ArmorAllocationProps {}

const ArmorAllocationPanel: React.FC<ArmorAllocationPanelProps> = ({
  unit,
  onUnitChange,
  validationErrors = [],
  readOnly = false,
  compact = true,
  showRearArmor = true,
  allowAutoAllocation = true,
  mechType = 'Biped',
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Helper functions
  const getMaxArmorForLocation = (location: string, mass: number): number => {
    switch (location) {
      case MECH_LOCATIONS.HEAD:
        return Math.min(9, Math.floor(mass / 10) + 3);
      case MECH_LOCATIONS.CENTER_TORSO:
        return Math.floor(mass * 2 * 0.4);
      case MECH_LOCATIONS.LEFT_TORSO:
      case MECH_LOCATIONS.RIGHT_TORSO:
        return Math.floor(mass * 2 * 0.3);
      case MECH_LOCATIONS.LEFT_ARM:
      case MECH_LOCATIONS.RIGHT_ARM:
      case MECH_LOCATIONS.LEFT_LEG:
      case MECH_LOCATIONS.RIGHT_LEG:
        return Math.floor(mass * 2 * 0.25);
      default:
        return Math.floor(mass * 2 * 0.2);
    }
  };

  const hasRearArmor = (location: string): boolean => {
    return [MECH_LOCATIONS.CENTER_TORSO, MECH_LOCATIONS.LEFT_TORSO, MECH_LOCATIONS.RIGHT_TORSO]
      .includes(location as any);
  };

  // Get or initialize armor data
  const armorData = useMemo(() => {
    const locations = unit.data?.armor?.locations || [];
    const locationMap = new Map(locations.map(loc => [loc.location, loc]));
    
    // Ensure all mech locations have armor data
    const mechLocations = mechType === 'Quad' 
      ? [MECH_LOCATIONS.HEAD, MECH_LOCATIONS.LEFT_ARM, MECH_LOCATIONS.RIGHT_ARM, 
         MECH_LOCATIONS.LEFT_TORSO, MECH_LOCATIONS.CENTER_TORSO, MECH_LOCATIONS.RIGHT_TORSO,
         MECH_LOCATIONS.LEFT_LEG, MECH_LOCATIONS.RIGHT_LEG]
      : [MECH_LOCATIONS.HEAD, MECH_LOCATIONS.LEFT_ARM, MECH_LOCATIONS.RIGHT_ARM, 
         MECH_LOCATIONS.LEFT_TORSO, MECH_LOCATIONS.CENTER_TORSO, MECH_LOCATIONS.RIGHT_TORSO,
         MECH_LOCATIONS.LEFT_LEG, MECH_LOCATIONS.RIGHT_LEG];

    return mechLocations.map(location => ({
      location,
      armor_points: locationMap.get(location)?.armor_points || 0,
      rear_armor_points: locationMap.get(location)?.rear_armor_points || 0,
      maxArmor: getMaxArmorForLocation(location, unit.mass || 0),
      hasRear: hasRearArmor(location),
    }));
  }, [unit.data?.armor?.locations, unit.mass, mechType]);

  // Handle armor point changes
  const handleArmorChange = useCallback((location: string, front: number, rear: number = 0) => {
    console.log(`Armor change: ${location} - Front: ${front}, Rear: ${rear}`);
    
    const updatedLocations = unit.data?.armor?.locations?.map(loc => 
      loc.location === location 
        ? { ...loc, armor_points: front, rear_armor_points: rear }
        : loc
    ) || [];

    // Add location if it doesn't exist
    if (!updatedLocations.find(loc => loc.location === location)) {
      updatedLocations.push({
        location,
        armor_points: front,
        rear_armor_points: rear,
      });
    }

    const updatedUnit = {
      ...unit,
      data: {
        ...unit.data,
        armor: {
          ...unit.data?.armor,
          locations: updatedLocations,
        },
      },
      // Update editor metadata to trigger dirty state
      editorMetadata: {
        ...unit.editorMetadata,
        isDirty: true,
        lastModified: new Date(),
      },
    };

    console.log('Updated unit:', updatedUnit);
    onUnitChange(updatedUnit);
  }, [unit, onUnitChange]);

  // Auto-allocate armor using MegaMekLab algorithm
  const handleAutoAllocate = useCallback(() => {
    const allocation = autoAllocateArmor(unit);
    
    // Convert location abbreviations to full names
    const locationMap: { [key: string]: string } = {
      'HEAD': MECH_LOCATIONS.HEAD,
      'CT': MECH_LOCATIONS.CENTER_TORSO,
      'LT': MECH_LOCATIONS.LEFT_TORSO,
      'RT': MECH_LOCATIONS.RIGHT_TORSO,
      'LA': MECH_LOCATIONS.LEFT_ARM,
      'RA': MECH_LOCATIONS.RIGHT_ARM,
      'LL': MECH_LOCATIONS.LEFT_LEG,
      'RL': MECH_LOCATIONS.RIGHT_LEG,
    };
    
    // Apply allocations
    Object.entries(allocation).forEach(([locAbbr, values]) => {
      const location = locationMap[locAbbr];
      if (location) {
        handleArmorChange(location, values.front, values.rear || 0);
      }
    });
  }, [unit, handleArmorChange]);

  // Maximize armor
  const handleMaximizeArmor = useCallback(() => {
    const maxTonnage = maximizeArmor(unit);
    const maxPoints = Math.floor(maxTonnage * 16); // 16 points per ton
    
    // Update unit with new armor tonnage
    const updatedUnit = {
      ...unit,
      data: {
        ...unit.data,
        armor: {
          ...unit.data?.armor,
          total_armor_points: maxPoints,
          locations: unit.data?.armor?.locations || [],
        },
      },
    };
    
    onUnitChange(updatedUnit);
    
    // Auto-allocate the new maximum armor
    setTimeout(() => handleAutoAllocate(), 100);
  }, [unit, onUnitChange, handleAutoAllocate]);

  // Use remaining tonnage
  const handleUseRemainingTonnage = useCallback(() => {
    const newTonnage = useRemainingTonnageForArmor(unit);
    const newPoints = Math.floor(newTonnage * 16); // 16 points per ton
    
    // Update unit with new armor tonnage
    const updatedUnit = {
      ...unit,
      data: {
        ...unit.data,
        armor: {
          ...unit.data?.armor,
          total_armor_points: newPoints,
          locations: unit.data?.armor?.locations || [],
        },
      },
    };
    
    onUnitChange(updatedUnit);
    
    // Auto-allocate the new armor
    setTimeout(() => handleAutoAllocate(), 100);
  }, [unit, onUnitChange, handleAutoAllocate]);

  // Clear all armor
  const handleClearArmor = useCallback(() => {
    const mechLocations = [
      MECH_LOCATIONS.HEAD,
      MECH_LOCATIONS.CENTER_TORSO,
      MECH_LOCATIONS.LEFT_TORSO,
      MECH_LOCATIONS.RIGHT_TORSO,
      MECH_LOCATIONS.LEFT_ARM,
      MECH_LOCATIONS.RIGHT_ARM,
      MECH_LOCATIONS.LEFT_LEG,
      MECH_LOCATIONS.RIGHT_LEG,
    ];
    
    mechLocations.forEach(location => {
      handleArmorChange(location, 0, 0);
    });
  }, [handleArmorChange]);

  return (
    <div className="armor-allocation-panel bg-white rounded-lg border border-gray-200 p-4 max-w-sm">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Armor Allocation</h3>
        </div>
        {allowAutoAllocation && (
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={handleAutoAllocate}
              disabled={readOnly}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              title="Auto-allocate armor points"
            >
              Auto-Allocate
            </button>
            <button
              onClick={handleMaximizeArmor}
              disabled={readOnly}
              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              title="Set armor to maximum tonnage"
            >
              Maximize
            </button>
            <button
              onClick={handleUseRemainingTonnage}
              disabled={readOnly}
              className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
              title="Use all remaining tonnage for armor"
            >
              Use Remaining
            </button>
            <button
              onClick={handleClearArmor}
              disabled={readOnly}
              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              title="Clear all armor"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Mech Silhouette with Armor Controls */}
      <div className="relative">
        {/* Simple mech diagram layout */}
        <div className="armor-diagram space-y-2">
          {/* Head */}
          <div className="flex justify-center">
            <ArmorLocationControl
              location={MECH_LOCATIONS.HEAD}
              armorData={armorData.find(a => a.location === MECH_LOCATIONS.HEAD)}
              onArmorChange={handleArmorChange}
              readOnly={readOnly}
              compact={compact}
              isSelected={selectedLocation === MECH_LOCATIONS.HEAD}
              onSelect={setSelectedLocation}
            />
          </div>

          {/* Arms and Torso */}
          <div className="grid grid-cols-5 gap-1 items-center">
            <ArmorLocationControl
              location={MECH_LOCATIONS.LEFT_ARM}
              armorData={armorData.find(a => a.location === MECH_LOCATIONS.LEFT_ARM)}
              onArmorChange={handleArmorChange}
              readOnly={readOnly}
              compact={compact}
              isSelected={selectedLocation === MECH_LOCATIONS.LEFT_ARM}
              onSelect={setSelectedLocation}
            />
            <ArmorLocationControl
              location={MECH_LOCATIONS.LEFT_TORSO}
              armorData={armorData.find(a => a.location === MECH_LOCATIONS.LEFT_TORSO)}
              onArmorChange={handleArmorChange}
              readOnly={readOnly}
              compact={compact}
              showRearArmor={showRearArmor}
              isSelected={selectedLocation === MECH_LOCATIONS.LEFT_TORSO}
              onSelect={setSelectedLocation}
            />
            <ArmorLocationControl
              location={MECH_LOCATIONS.CENTER_TORSO}
              armorData={armorData.find(a => a.location === MECH_LOCATIONS.CENTER_TORSO)}
              onArmorChange={handleArmorChange}
              readOnly={readOnly}
              compact={compact}
              showRearArmor={showRearArmor}
              isSelected={selectedLocation === MECH_LOCATIONS.CENTER_TORSO}
              onSelect={setSelectedLocation}
            />
            <ArmorLocationControl
              location={MECH_LOCATIONS.RIGHT_TORSO}
              armorData={armorData.find(a => a.location === MECH_LOCATIONS.RIGHT_TORSO)}
              onArmorChange={handleArmorChange}
              readOnly={readOnly}
              compact={compact}
              showRearArmor={showRearArmor}
              isSelected={selectedLocation === MECH_LOCATIONS.RIGHT_TORSO}
              onSelect={setSelectedLocation}
            />
            <ArmorLocationControl
              location={MECH_LOCATIONS.RIGHT_ARM}
              armorData={armorData.find(a => a.location === MECH_LOCATIONS.RIGHT_ARM)}
              onArmorChange={handleArmorChange}
              readOnly={readOnly}
              compact={compact}
              isSelected={selectedLocation === MECH_LOCATIONS.RIGHT_ARM}
              onSelect={setSelectedLocation}
            />
          </div>

          {/* Legs */}
          <div className="grid grid-cols-5 gap-1">
            <div></div>
            <ArmorLocationControl
              location={MECH_LOCATIONS.LEFT_LEG}
              armorData={armorData.find(a => a.location === MECH_LOCATIONS.LEFT_LEG)}
              onArmorChange={handleArmorChange}
              readOnly={readOnly}
              compact={compact}
              isSelected={selectedLocation === MECH_LOCATIONS.LEFT_LEG}
              onSelect={setSelectedLocation}
            />
            <div></div>
            <ArmorLocationControl
              location={MECH_LOCATIONS.RIGHT_LEG}
              armorData={armorData.find(a => a.location === MECH_LOCATIONS.RIGHT_LEG)}
              onArmorChange={handleArmorChange}
              readOnly={readOnly}
              compact={compact}
              isSelected={selectedLocation === MECH_LOCATIONS.RIGHT_LEG}
              onSelect={setSelectedLocation}
            />
            <div></div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Allocated:</span>
            <span className="font-medium">
              {armorData.reduce((sum, loc) => sum + loc.armor_points + (loc.rear_armor_points || 0), 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total:</span>
            <span className="font-medium">{unit.data?.armor?.total_armor_points || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Unallocated:</span>
            <span className={`font-medium ${
              (unit.data?.armor?.total_armor_points || 0) - 
              armorData.reduce((sum, loc) => sum + loc.armor_points + (loc.rear_armor_points || 0), 0) !== 0
                ? 'text-red-600' : 'text-green-600'
            }`}>
              {(unit.data?.armor?.total_armor_points || 0) - 
               armorData.reduce((sum, loc) => sum + loc.armor_points + (loc.rear_armor_points || 0), 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Max:</span>
            <span className="font-medium">
              {armorData.reduce((sum, loc) => sum + loc.maxArmor, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Selected location details */}
      {selectedLocation && (
        <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
          <div className="font-medium text-blue-900">{selectedLocation}</div>
          <div className="text-blue-700 mt-1">
            Max armor: {getMaxArmorForLocation(selectedLocation, unit.mass || 0)}
            {hasRearArmor(selectedLocation) && " (front + rear)"}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArmorAllocationPanel;
