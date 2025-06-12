import React, { useState, useCallback, useMemo } from 'react';
import { ArmorAllocationProps, MECH_LOCATIONS, ArmorType, ARMOR_TYPES } from '../../../types/editor';
import ArmorLocationControl from './ArmorLocationControl';
import { 
  maximizeArmor, 
  useRemainingTonnageForArmor,
  calculateMaxArmorTonnage 
} from '../../../utils/armorAllocation';
import { autoAllocateArmor } from '../../../utils/armorAllocation';

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

  // Track armor tonnage separately - move this before callbacks that use it
  const [armorTonnageInput, setArmorTonnageInput] = useState(() => {
    const intendedArmorPoints = unit.data?.armor?.total_armor_points || 0;
    const tonnage = intendedArmorPoints / currentArmorType.pointsPerTon;
    // Round to nearest half-ton
    const roundedTonnage = Math.round(tonnage * 2) / 2;
    return roundedTonnage.toFixed(1);
  });

  // Helper functions
  const getMaxArmorForLocation = (location: string, mass: number): number => {
    switch (location) {
      case MECH_LOCATIONS.HEAD:
        // Head is always 9 armor max (12 for superheavy mechs over 100 tons)
        return mass > 100 ? 12 : 9;
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
    const currentTotalPoints = unit.data?.armor?.total_armor_points || 0;
    console.log('Auto-allocate called. Current armor points:', currentTotalPoints);
    
    // If no armor points set, use what's currently in the tonnage field
    if (currentTotalPoints === 0) {
      const tonnage = parseFloat(armorTonnageInput) || 0;
      const points = Math.floor(tonnage * currentArmorType.pointsPerTon);
      console.log('No armor points found, using tonnage input:', tonnage, 'which gives points:', points);
      
      // Create a temporary unit with the armor points for allocation
      const tempUnit = {
        ...unit,
        data: {
          ...unit.data,
            armor: {
              ...unit.data?.armor,
              total_armor_points: points,
              locations: unit.data?.armor?.locations || [],
            }
        }
      };
      
      // Use the exact MegaMekLab algorithm from utils
      const allocation = autoAllocateArmor(tempUnit);
      console.log('Allocation result with temp unit:', allocation);
      
      // Continue with the allocation...
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
      
      // Convert allocation to locations array
      const newLocations: any[] = [];
      
      Object.entries(allocation).forEach(([abbreviation, armorData]) => {
        const fullLocation = locationMap[abbreviation] || abbreviation;
        newLocations.push({
          location: fullLocation,
          armor_points: armorData.front,
          rear_armor_points: armorData.rear || 0,
        });
      });
      
      console.log('New locations:', newLocations);
      
      // Update unit with all new armor allocations AND the total points
      const updatedUnit = {
        ...unit,
        data: {
          ...unit.data,
          armor: {
            ...unit.data?.armor,
            total_armor_points: points,
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
      return;
    }
    
    // Use the exact MegaMekLab algorithm from utils
    const allocation = autoAllocateArmor(unit);
    
    console.log('Allocation result:', allocation);
    
    // Map abbreviations to full location names
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
    
    // Convert allocation to locations array
    const newLocations: any[] = [];
    
    Object.entries(allocation).forEach(([abbreviation, armorData]) => {
      const fullLocation = locationMap[abbreviation] || abbreviation;
      newLocations.push({
        location: fullLocation,
        armor_points: armorData.front,
        rear_armor_points: armorData.rear || 0,
      });
    });
    
    console.log('New locations:', newLocations);
    
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
  }, [unit, onUnitChange]);

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
  
  // Sync armor tonnage input with unit changes
  React.useEffect(() => {
    const intendedArmorPoints = unit.data?.armor?.total_armor_points || 0;
    const tonnage = intendedArmorPoints / currentArmorType.pointsPerTon;
    // Round to nearest half-ton
    const roundedTonnage = Math.round(tonnage * 2) / 2;
    setArmorTonnageInput(roundedTonnage.toFixed(1));
  }, [unit.data?.armor?.total_armor_points, currentArmorType.pointsPerTon]);

  // Handle armor type change
  const handleArmorTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newArmorType = getArmorType(e.target.value);
    
    // Get current armor points
    const currentArmorPoints = unit.data?.armor?.total_armor_points || 0;
    
    // Calculate tonnage with new armor type
    const tonnage = currentArmorPoints / newArmorType.pointsPerTon;
    
    // Round to nearest half-ton
    const roundedTonnage = Math.round(tonnage * 2) / 2;
    
    // Recalculate armor points based on rounded tonnage
    const newArmorPoints = Math.floor(roundedTonnage * newArmorType.pointsPerTon);
    
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
      armorAllocation: updatedArmorAllocation,
      data: {
        ...unit.data,
        armor: {
          ...unit.data?.armor,
          total_armor_points: newArmorPoints,
          locations: unit.data?.armor?.locations || [],
        },
      },
    });
  }, [unit, onUnitChange]);

  // Handle armor tonnage change
  const handleArmorTonnageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Always update the input field to allow free typing
    setArmorTonnageInput(value);
    
    // Don't update the unit until blur (when validation happens)
  }, []);

  // Handle armor tonnage blur (validate and apply)
  const handleArmorTonnageBlur = useCallback(() => {
    // Parse the value - if empty or invalid, treat as 0
    const inputValue = armorTonnageInput === '' ? 0 : parseFloat(armorTonnageInput) || 0;
    
    // Round to nearest half-ton
    const roundedTonnage = Math.round(inputValue * 2) / 2;
    
    // Update the input to show the rounded value
    setArmorTonnageInput(roundedTonnage.toFixed(1));
    
    // Calculate new armor points
    const newPoints = Math.floor(roundedTonnage * currentArmorType.pointsPerTon);
    
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
  }, [armorTonnageInput, unit, currentArmorType, onUnitChange]);

  // Handle Enter key press to apply changes
  const handleArmorTonnageKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleArmorTonnageBlur();
    }
  }, [handleArmorTonnageBlur]);

  return (
    <div className="armor-allocation-panel bg-gray-800 rounded-lg border border-gray-700 p-4 max-w-sm">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-100">Armor</h3>
        </div>
        
        {/* Armor Type and Tonnage */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-300 w-20">Armor Type:</label>
            <select
              value={currentArmorTypeId}
              onChange={handleArmorTypeChange}
              disabled={readOnly}
              className="flex-1 text-xs bg-gray-700 text-gray-100 border border-gray-600 rounded px-2 py-1 disabled:opacity-50"
            >
              {ARMOR_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-300 w-20">Armor Tonnage:</label>
            <input
              type="number"
              value={armorTonnageInput}
              onChange={handleArmorTonnageChange}
              onBlur={handleArmorTonnageBlur}
              onKeyPress={handleArmorTonnageKeyPress}
              disabled={readOnly}
              step="0.5"
              min="0"
              className="flex-1 text-xs bg-gray-700 text-gray-100 border border-gray-600 rounded px-2 py-1 disabled:opacity-50"
              title="Armor tonnage must be in increments of 0.5 tons"
            />
          </div>
          
          <div className="text-xs text-gray-400 mt-1">
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
        <h4 className="text-xs font-semibold text-gray-300 mb-2">Armor Allocation</h4>

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
      <div className="mt-4 pt-3 border-t border-gray-600">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Allocated:</span>
            <span className="font-medium text-gray-200">
              {armorData.reduce((sum, loc) => sum + loc.armor_points + (loc.rear_armor_points || 0), 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total:</span>
            <span className="font-medium text-gray-200">{unit.data?.armor?.total_armor_points || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Unallocated:</span>
            <span className={`font-medium ${
              (unit.data?.armor?.total_armor_points || 0) - 
              armorData.reduce((sum, loc) => sum + loc.armor_points + (loc.rear_armor_points || 0), 0) !== 0
                ? 'text-red-400' : 'text-green-400'
            }`}>
              {(unit.data?.armor?.total_armor_points || 0) - 
               armorData.reduce((sum, loc) => sum + loc.armor_points + (loc.rear_armor_points || 0), 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Max:</span>
            <span className="font-medium text-gray-200">
              {armorData.reduce((sum, loc) => sum + loc.maxArmor, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Selected location details */}
      {selectedLocation && (
        <div className="mt-3 p-2 bg-gray-700 rounded text-xs border border-gray-600">
          <div className="font-medium text-gray-200">{selectedLocation}</div>
          <div className="text-gray-400 mt-1">
            Max armor: {getMaxArmorForLocation(selectedLocation, unit.mass || 0)}
            {hasRearArmor(selectedLocation) && " (front + rear)"}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArmorAllocationPanel;
