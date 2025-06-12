import React, { useState, useCallback, useMemo } from 'react';
import { ArmorAllocationProps, MECH_LOCATIONS, ArmorType, ARMOR_TYPES } from '../../../types/editor';
import ArmorLocationControl from './ArmorLocationControl';
import { 
  autoAllocateArmor, 
  maximizeArmor, 
  useRemainingTonnageForArmor,
  calculateMaxArmorTonnage 
} from '../../../utils/armorAllocation';

interface ArmorAllocationPanelProps extends ArmorAllocationProps {}

// Helper function to get armor type by ID
const getArmorType = (id: string): ArmorType => {
  return ARMOR_TYPES.find(type => type.id === id) || ARMOR_TYPES[0];
};

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

  // Get current armor type early so it can be used in callbacks
  const currentArmorTypeId = unit.armorAllocation?.['Center Torso']?.type?.id || 'standard';
  const currentArmorType = getArmorType(currentArmorTypeId);

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

  // Auto-allocate armor using proportional distribution
  const handleAutoAllocate = useCallback(() => {
    // Get total armor points available
    const totalArmorPoints = unit.data?.armor?.total_armor_points || 0;
    
    // Build new armor locations array
    const newLocations: any[] = [];
    
    // If no armor points available, set all locations to 0
    if (totalArmorPoints === 0) {
      armorData.forEach(loc => {
        newLocations.push({
          location: loc.location,
          armor_points: 0,
          rear_armor_points: 0,
        });
      });
    } else {
      // Calculate total maximum armor capacity
      const totalMaxArmor = armorData.reduce((sum, loc) => sum + loc.maxArmor, 0);
      
      // Track remaining points to distribute
      let remainingPoints = totalArmorPoints;
      const allocations: { [key: string]: { front: number; rear: number } } = {};
      
      // First pass: distribute proportionally
      armorData.forEach(loc => {
        const proportion = loc.maxArmor / totalMaxArmor;
        let locationPoints = Math.floor(totalArmorPoints * proportion);
        
        // Ensure we don't exceed the location's max
        locationPoints = Math.min(locationPoints, loc.maxArmor);
        
        if (loc.hasRear) {
          // For torso locations, distribute 75% front, 25% rear
          const frontPoints = Math.floor(locationPoints * 0.75);
          const rearPoints = locationPoints - frontPoints;
          allocations[loc.location] = { front: frontPoints, rear: rearPoints };
        } else {
          // For non-torso locations, all armor goes to front
          allocations[loc.location] = { front: locationPoints, rear: 0 };
        }
        
        remainingPoints -= locationPoints;
      });
      
      // Second pass: distribute any remaining points
      // Prioritize torsos, then legs, then arms, then head
      const priorityOrder = [
        MECH_LOCATIONS.CENTER_TORSO,
        MECH_LOCATIONS.LEFT_TORSO,
        MECH_LOCATIONS.RIGHT_TORSO,
        MECH_LOCATIONS.LEFT_LEG,
        MECH_LOCATIONS.RIGHT_LEG,
        MECH_LOCATIONS.LEFT_ARM,
        MECH_LOCATIONS.RIGHT_ARM,
        MECH_LOCATIONS.HEAD,
      ];
      
      for (const location of priorityOrder) {
        if (remainingPoints <= 0) break;
        
        const locData = armorData.find(loc => loc.location === location);
        if (!locData) continue;
        
        const allocated = allocations[location];
        if (!allocated) continue;
        
        const currentTotal = allocated.front + allocated.rear;
        const maxAdditional = locData.maxArmor - currentTotal;
        
        if (maxAdditional > 0) {
          const toAdd = Math.min(remainingPoints, maxAdditional);
          
          if (locData.hasRear) {
            // Add to front armor for torsos
            allocated.front += toAdd;
          } else {
            allocated.front += toAdd;
          }
          
          remainingPoints -= toAdd;
        }
      }
      
      // Build new locations array from allocations
      // Ensure ALL locations are included, even if not in allocations
      armorData.forEach(loc => {
        const allocated = allocations[loc.location];
        if (allocated) {
          newLocations.push({
            location: loc.location,
            armor_points: allocated.front,
            rear_armor_points: allocated.rear,
          });
        } else {
          // Include location with 0 armor if not allocated
          newLocations.push({
            location: loc.location,
            armor_points: 0,
            rear_armor_points: 0,
          });
        }
      });
    }
    
    // Update unit with all new armor allocations at once
    const updatedUnit = {
      ...unit,
      data: {
        ...unit.data,
        armor: {
          ...unit.data?.armor,
          locations: newLocations,
        },
      },
      editorMetadata: {
        ...unit.editorMetadata,
        isDirty: true,
        lastModified: new Date(),
      },
    };
    
    onUnitChange(updatedUnit);
  }, [unit, armorData, onUnitChange]);

  // Maximize armor
  const handleMaximizeArmor = useCallback(() => {
    const maxTonnage = maximizeArmor(unit);
    const maxPoints = Math.floor(maxTonnage * currentArmorType.pointsPerTon);
    
    // Update the input field
    setArmorTonnageInput(maxTonnage.toFixed(1));
    
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
  }, [unit, currentArmorType, onUnitChange, handleAutoAllocate]);

  // Use remaining tonnage
  const handleUseRemainingTonnage = useCallback(() => {
    const newTonnage = useRemainingTonnageForArmor(unit);
    const newPoints = Math.floor(newTonnage * currentArmorType.pointsPerTon);
    
    // Update the input field
    setArmorTonnageInput(newTonnage.toFixed(1));
    
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
    
    // Don't auto-allocate - just update the tonnage
  }, [unit, currentArmorType, onUnitChange]);

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

  // Calculate current totals
  const totalArmorPoints = armorData.reduce((sum, loc) => sum + loc.armor_points + (loc.rear_armor_points || 0), 0);
  
  // Track armor tonnage separately
  const [armorTonnageInput, setArmorTonnageInput] = useState(() => {
    const intendedArmorPoints = unit.data?.armor?.total_armor_points || 0;
    return (intendedArmorPoints / currentArmorType.pointsPerTon).toFixed(1);
  });
  
  // Sync armor tonnage input with unit changes
  React.useEffect(() => {
    const intendedArmorPoints = unit.data?.armor?.total_armor_points || 0;
    const tonnage = intendedArmorPoints / currentArmorType.pointsPerTon;
    setArmorTonnageInput(tonnage.toFixed(1));
  }, [unit.data?.armor?.total_armor_points, currentArmorType.pointsPerTon]);

  // Handle armor type change
  const handleArmorTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newArmorType = getArmorType(e.target.value);
    
    // Update all locations with new armor type
    const updatedArmorAllocation = { ...unit.armorAllocation };
    Object.keys(updatedArmorAllocation).forEach(location => {
      updatedArmorAllocation[location] = {
        ...updatedArmorAllocation[location],
        type: newArmorType
      };
    });

    onUnitChange({
      ...unit,
      armorAllocation: updatedArmorAllocation
    });
  }, [unit, onUnitChange]);

  // Handle armor tonnage change
  const handleArmorTonnageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Always update the input field to allow free typing
    setArmorTonnageInput(value);
    
    // Parse the value - if empty or invalid, treat as 0
    const newTonnage = value === '' ? 0 : parseFloat(value) || 0;
    const newPoints = Math.floor(newTonnage * currentArmorType.pointsPerTon);
    
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
  }, [unit, currentArmorType, onUnitChange]);

  return (
    <div className="armor-allocation-panel bg-white rounded-lg border border-gray-200 p-4 max-w-sm">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Armor</h3>
        </div>
        
        {/* Armor Type and Tonnage */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-20">Armor Type:</label>
            <select
              value={currentArmorTypeId}
              onChange={handleArmorTypeChange}
              disabled={readOnly}
              className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
            >
              {ARMOR_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-20">Armor Tonnage:</label>
            <input
              type="number"
              value={armorTonnageInput}
              onChange={handleArmorTonnageChange}
              disabled={readOnly}
              step="0.5"
              className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
            />
          </div>
          
          <div className="text-xs text-gray-500 mt-1">
            Points: {unit.data?.armor?.total_armor_points || 0} ({currentArmorType.pointsPerTon} points/ton)
          </div>
        </div>

        {/* Action Buttons */}
        {allowAutoAllocation && (
          <div className="space-y-2">
            <div className="flex gap-1">
              <button
                onClick={handleMaximizeArmor}
                disabled={readOnly}
                className="flex-1 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                title="Set armor to maximum tonnage"
              >
                Maximize Armor
              </button>
              <button
                onClick={handleUseRemainingTonnage}
                disabled={readOnly}
                className="flex-1 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                title="Use all remaining tonnage for armor"
              >
                Use Remaining Tonnage
              </button>
            </div>
            <button
              onClick={handleAutoAllocate}
              disabled={readOnly}
              className="w-full px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              title="Proportionally distribute armor points to all locations"
            >
              Auto-Allocate Armor
            </button>
          </div>
        )}
      </div>

      {/* Armor Allocation Section */}
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Armor Allocation</h4>

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
