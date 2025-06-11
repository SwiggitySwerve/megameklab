import React, { useState, useCallback, useMemo } from 'react';
import { ArmorAllocationProps, MECH_LOCATIONS } from '../../../types/editor';
import ArmorLocationControl from './ArmorLocationControl';

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
    };

    onUnitChange(updatedUnit);
  }, [unit, onUnitChange]);

  // Auto-allocate armor function (placeholder)
  const handleAutoAllocate = useCallback(() => {
    const totalArmorPoints = unit.data?.armor?.total_armor_points || 0;
    if (totalArmorPoints === 0) return;

    // Simple auto-allocation algorithm (MegaMekLab-style)
    let remainingPoints = totalArmorPoints;
    const allocations: { [location: string]: { front: number; rear: number } } = {};

    // Prioritize head armor
    const headArmor = Math.min(9, Math.floor(remainingPoints * 0.05));
    allocations[MECH_LOCATIONS.HEAD] = { front: headArmor, rear: 0 };
    remainingPoints -= headArmor;

    // Distribute remaining armor proportionally
    const proportions = {
      [MECH_LOCATIONS.CENTER_TORSO]: 0.25,
      [MECH_LOCATIONS.LEFT_TORSO]: 0.15,
      [MECH_LOCATIONS.RIGHT_TORSO]: 0.15,
      [MECH_LOCATIONS.LEFT_ARM]: 0.12,
      [MECH_LOCATIONS.RIGHT_ARM]: 0.12,
      [MECH_LOCATIONS.LEFT_LEG]: 0.1,
      [MECH_LOCATIONS.RIGHT_LEG]: 0.1,
    };

    Object.entries(proportions).forEach(([location, proportion]) => {
      const totalForLocation = Math.floor(remainingPoints * proportion);
      const maxArmor = getMaxArmorForLocation(location, unit.mass || 0);
      
      if (hasRearArmor(location)) {
        const rearArmor = Math.floor(totalForLocation * 0.25);
        const frontArmor = Math.min(totalForLocation - rearArmor, maxArmor - rearArmor);
        allocations[location] = { 
          front: Math.min(frontArmor, maxArmor),
          rear: Math.min(rearArmor, maxArmor - frontArmor)
        };
      } else {
        allocations[location] = { 
          front: Math.min(totalForLocation, maxArmor), 
          rear: 0 
        };
      }
    });

    // Apply allocations
    Object.entries(allocations).forEach(([location, { front, rear }]) => {
      handleArmorChange(location, front, rear);
    });
  }, [unit, handleArmorChange]);

  return (
    <div className="armor-allocation-panel bg-white rounded-lg border border-gray-200 p-4 max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Armor Allocation</h3>
        {allowAutoAllocation && (
          <button
            onClick={handleAutoAllocate}
            disabled={readOnly}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Auto
          </button>
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
