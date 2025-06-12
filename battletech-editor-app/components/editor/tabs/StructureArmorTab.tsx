import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { EditorComponentProps } from '../../../types/editor';
import MechArmorDiagram from '../../common/MechArmorDiagram';
import { ArmorLocation, UnitConfig } from '../../../types';
import { 
  calculateComponentWeights, 
  calculateComponentCrits,
  calculateEngineFreeHeatSinks,
  getComponentAvailability,
  calculateEarliestPossibleYear,
  calculateEquipmentHeat
} from '../../../utils/componentCalculations';
import { validateUnit, ValidationResult } from '../../../utils/unitValidation';
import { useDebounce, useMemoizedCalculation } from '../../../utils/performance';

const StructureArmorTab: React.FC<EditorComponentProps> = ({
  unit,
  onUnitChange,
  validationErrors = [],
  readOnly = false,
}) => {
  // Icon management state
  const [iconCache, setIconCache] = useState<{id: string, data: string, name: string}[]>([]);
  const [showIconCache, setShowIconCache] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load icon cache from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem('mechIconCache');
    if (cached) {
      try {
        setIconCache(JSON.parse(cached));
      } catch (e) {
        console.error('Failed to load icon cache:', e);
      }
    }
  }, []);

  // Handle icon upload
  const handleIconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const iconData = e.target?.result as string;
        const iconId = `icon_${Date.now()}`;
        
        // Update unit with new icon
        const updatedUnit = {
          ...unit,
          data: {
            ...unit.data,
            icon: iconData
          }
        };
        onUnitChange(updatedUnit);
        
        // Add to cache
        const newCacheItem = { id: iconId, data: iconData, name: file.name };
        const updatedCache = [...iconCache, newCacheItem];
        setIconCache(updatedCache);
        localStorage.setItem('mechIconCache', JSON.stringify(updatedCache));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle icon removal
  const handleIconRemove = () => {
    const updatedUnit = {
      ...unit,
      data: {
        ...unit.data,
        icon: undefined
      }
    };
    onUnitChange(updatedUnit);
  };

  // Handle icon import from cache
  const handleIconImportFromCache = (iconData: string) => {
    const updatedUnit = {
      ...unit,
      data: {
        ...unit.data,
        icon: iconData
      }
    };
    onUnitChange(updatedUnit);
    setShowIconCache(false);
  };

  // Calculate derived values
  const currentTonnage = unit.mass || 0;
  const walkMP = unit.data?.movement?.walk_mp || 1;
  const enhancement = unit.data?.myomer?.type || 'None';
  const hasSupercharger = unit.data?.weapons_and_equipment?.some(item => 
    item.item_name.toLowerCase().includes('supercharger')
  ) || false;
  const jumpType = unit.data?.movement?.jump_type || 'Jump Jet';
  const mechJumpBoosterMP = unit.data?.movement?.mech_jump_booster_mp || 0;
  
  // Calculate base and enhanced movement
  const baseWalkMP = walkMP;
  const baseRunMP = Math.floor(walkMP * 1.5);
  let finalWalkMP = baseWalkMP;
  let finalRunMP = baseRunMP;
  
  // Apply enhancement effects
  if (enhancement === 'MASC') {
    // MASC: Run MP = Walk MP × 2
    finalRunMP = walkMP * 2;
  } else if (enhancement === 'Triple Strength Myomer') {
    // TSM: +2 Walk MP when heat ≥ 9 (we'll simulate this as always active for now)
    // In a real implementation, this would check current heat level
    finalWalkMP = baseWalkMP + 2;
    finalRunMP = Math.floor(finalWalkMP * 1.5);
  }
  
  // Supercharger increases engine rating by 25% temporarily
  // This would affect walk MP calculation in combat
  const superchargerNote = hasSupercharger ? " (SC available)" : "";
  
  const engineRating = walkMP * currentTonnage;
  const totalArmorPoints = unit.data?.armor?.total_armor_points || 0;
  const allocatedArmor = unit.data?.armor?.locations?.reduce((sum, loc) => 
    sum + loc.armor_points + (loc.rear_armor_points || 0), 0
  ) || 0;
  const armorType = unit.data?.armor?.type || 'Standard';
  const pointsPerTon = armorType === 'Ferro-Fibrous' ? 17.92 : 16;
  const armorTonnage = Math.ceil((totalArmorPoints / pointsPerTon) * 2) / 2;
  
  // Calculate component weights and crits with memoization
  const weights = useMemoizedCalculation(() => calculateComponentWeights(unit), [
    unit.mass,
    unit.data?.structure?.type,
    unit.data?.engine?.type,
    unit.data?.gyro?.type,
    unit.data?.cockpit?.type,
    unit.data?.heat_sinks?.count,
    unit.data?.heat_sinks?.type,
    unit.data?.movement?.walk_mp,
    unit.data?.movement?.jump_mp,
    unit.data?.movement?.jump_type,
    unit.data?.armor?.total_armor_points,
    unit.data?.armor?.type,
    unit.data?.myomer?.type
  ]);
  
  const crits = useMemoizedCalculation(() => calculateComponentCrits(unit), [
    unit.mass,
    unit.data?.structure?.type,
    unit.data?.engine?.type,
    unit.data?.gyro?.type,
    unit.data?.cockpit?.type,
    unit.data?.heat_sinks?.count,
    unit.data?.heat_sinks?.type,
    unit.data?.movement?.walk_mp,
    unit.data?.movement?.jump_mp,
    unit.data?.movement?.jump_type,
    unit.data?.armor?.type,
    unit.data?.myomer?.type
  ]);
  
  const engineFreeHeatSinks = useMemoizedCalculation(
    () => calculateEngineFreeHeatSinks(engineRating, unit.data?.engine?.type || 'Fusion'),
    [engineRating, unit.data?.engine?.type]
  );
  
  // Calculate max armor for location based on internal structure
  const getMaxArmor = useMemoizedCalculation(() => {
    return (location: string): number => {
      // Max armor = internal structure × 2
      const getInternalStructure = (loc: string): number => {
        switch (loc) {
          case 'Head': return 3;
          case 'Center Torso': 
            // CT has special calculation
            if (currentTonnage <= 35) return Math.ceil(currentTonnage / 5);
            else if (currentTonnage <= 55) return Math.ceil(currentTonnage / 5) + 1;
            else if (currentTonnage <= 75) return Math.ceil(currentTonnage / 5) + 2;
            else return Math.ceil(currentTonnage / 5) + 3;
          case 'Left Torso':
          case 'Right Torso':
            // Side torsos
            if (currentTonnage <= 35) return Math.ceil(currentTonnage / 5);
            else if (currentTonnage <= 60) return Math.ceil(currentTonnage / 5) + 1;
            else return Math.ceil(currentTonnage / 5) + 2;
          case 'Left Arm':
          case 'Right Arm':
            // Arms
            if (currentTonnage <= 35) return Math.ceil(currentTonnage / 7);
            else if (currentTonnage <= 70) return Math.ceil(currentTonnage / 7) + 1;
            else return Math.ceil(currentTonnage / 7) + 2;
          case 'Left Leg':
          case 'Right Leg':
            // Legs
            if (currentTonnage <= 35) return Math.ceil(currentTonnage / 5);
            else if (currentTonnage <= 55) return Math.ceil(currentTonnage / 5) + 1;
            else return Math.ceil(currentTonnage / 5) + 3;
          default: return 0;
        }
      };
      
      return getInternalStructure(location) * 2;
    };
  }, [currentTonnage]);

  // Calculate maximum possible armor points for mech (sum of all location maximums)
  const maxPossibleArmor = useMemoizedCalculation(() => {
    const locations = ['Head', 'Center Torso', 'Left Torso', 'Right Torso', 
                      'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg'];
    return locations.reduce((sum, loc) => sum + getMaxArmor(loc), 0);
  }, [currentTonnage]);

  // Simple numeric input component
  const NumericInput: React.FC<{
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    width?: string;
  }> = ({ value, onChange, min = 0, max = 999, step = 1, disabled = false, width = "w-20" }) => {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        disabled={disabled || readOnly}
        className={`${width} text-sm border border-slate-500 bg-slate-700 text-white rounded px-2 py-1 text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-600`}
      />
    );
  };

  // Get armor value for location
  const getArmorValue = (location: string, isRear: boolean = false): number => {
    const loc = unit.data?.armor?.locations?.find(l => l.location === location);
    return isRear ? (loc?.rear_armor_points || 0) : (loc?.armor_points || 0);
  };

  // Update armor value for location - Raw function
  const updateArmorValueRaw = useCallback((location: string, value: number, isRear: boolean = false) => {
    const locations = unit.data?.armor?.locations || [];
    const existingIndex = locations.findIndex(l => l.location === location);
    
    let updatedLocations;
    if (existingIndex >= 0) {
      updatedLocations = [...locations];
      if (isRear) {
        updatedLocations[existingIndex] = { ...updatedLocations[existingIndex], rear_armor_points: value };
      } else {
        updatedLocations[existingIndex] = { ...updatedLocations[existingIndex], armor_points: value };
      }
    } else {
      const newLocation = {
        location,
        armor_points: isRear ? 0 : value,
        rear_armor_points: isRear ? value : 0,
      };
      updatedLocations = [...locations, newLocation];
    }

    // Calculate new total armor points from all locations
    const newTotalPoints = updatedLocations.reduce((sum, loc) => 
      sum + loc.armor_points + (loc.rear_armor_points || 0), 0
    );

    const updatedUnit = {
      ...unit,
      data: {
        ...unit.data,
        armor: {
          ...unit.data?.armor,
          total_armor_points: newTotalPoints,
          locations: updatedLocations,
        },
      },
    };
    onUnitChange(updatedUnit);
  }, [unit, onUnitChange]);
  
  // Debounced version for interactive updates
  const updateArmorValue = useDebounce(updateArmorValueRaw, 150);

  // Calculate unit statistics
  const equipmentWeight = unit.data?.weapons_and_equipment?.reduce((sum: number, item: any) => {
    return sum + (parseFloat(item.tons) || 0);
  }, 0) || 0;
  const usedTonnage = weights.total + equipmentWeight;
  const maxTonnage = currentTonnage;
  const isOverweight = usedTonnage > maxTonnage;
  const battleValue = unit.data?.manual_bv || 0; // Use manual BV if set
  const dryCost = 0; // TODO: Calculate actual cost
  const usedSlots = crits.total; // Critical slots from components
  const totalSlots = 78; // 12 slots × 6 locations + 6 head slots
  const heatGeneration = useMemoizedCalculation(
    () => calculateEquipmentHeat(unit),
    [unit.data?.weapons_and_equipment, unit.data?.movement?.jump_mp]
  );
  
  const heatDissipation = unit.data?.heat_sinks?.count || 10;
  
  const earliestYear = useMemoizedCalculation(
    () => calculateEarliestPossibleYear(unit),
    [
      unit.data?.structure?.type,
      unit.data?.engine?.type,
      unit.data?.gyro?.type,
      unit.data?.cockpit?.type,
      unit.data?.heat_sinks?.type,
      unit.data?.armor?.type,
      unit.data?.myomer?.type,
      unit.data?.movement?.jump_type,
      unit.data?.movement?.jump_mp,
      unit.data?.weapons_and_equipment
    ]
  );
  
  // Run validation with memoization
  const validation: ValidationResult = useMemoizedCalculation(
    () => validateUnit(unit, weights, crits),
    [unit, weights, crits]
  );
  const isInvalid = !validation.isValid || validationErrors.length > 0;

  // Prepare armor data for the visual diagram
  const armorDataForDiagram = useMemo((): ArmorLocation[] => {
    const locations = unit.data?.armor?.locations || [];
    // Ensure all locations exist for the diagram
    const allLocations = ['Head', 'Center Torso', 'Left Torso', 'Right Torso', 
                         'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg'];
    
    return allLocations.map(locName => {
      const existing = locations.find(l => l.location === locName);
      return existing || {
        location: locName,
        armor_points: 0,
        rear_armor_points: 0
      };
    });
  }, [unit.data?.armor?.locations]);

  return (
    <div className="structure-armor-tab bg-slate-900 min-h-screen">
      {/* Validation Messages */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="bg-slate-800 border-b border-slate-600 p-4">
          {validation.errors.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-red-400 mb-2">Validation Errors:</h4>
              <ul className="space-y-1">
                {validation.errors.map((error, idx) => (
                  <li key={idx} className="text-xs text-red-300 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{error.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {validation.warnings.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-yellow-400 mb-2">Warnings:</h4>
              <ul className="space-y-1">
                {validation.warnings.map((warning, idx) => (
                  <li key={idx} className="text-xs text-yellow-300 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{warning.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4 p-4 max-w-7xl mx-auto">
        
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          {/* Basic Information */}
          <div className="bg-slate-800 border border-slate-600 rounded">
            <h3 className="bg-slate-700 border-b border-slate-600 px-3 py-2 text-sm font-medium text-slate-100">Basic Information</h3>
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Chassis:</label>
                  <input
                    type="text"
                    value={unit.chassis || 'New'}
                    onChange={(e) => onUnitChange({ ...unit, chassis: e.target.value })}
                    className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Clan Name:</label>
                  <input
                    type="text"
                    value={unit.data?.clan_name || ''}
                    onChange={(e) => {
                      const updatedUnit = {
                        ...unit,
                        data: {
                          ...unit.data,
                          clan_name: e.target.value
                        }
                      };
                      onUnitChange(updatedUnit);
                    }}
                    className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100"
                    disabled={readOnly}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Model:</label>
                  <input
                    type="text"
                    value={unit.model || 'Mek'}
                    onChange={(e) => onUnitChange({ ...unit, model: e.target.value })}
                    className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">MUL ID:</label>
                  <input
                    type="text"
                    value={unit.mul_id || '-1'}
                    onChange={(e) => onUnitChange({ ...unit, mul_id: e.target.value })}
                    className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100"
                    disabled={readOnly}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Year:</label>
                  <input
                    type="text"
                    value={unit.era || '3145'}
                    onChange={(e) => onUnitChange({ ...unit, era: e.target.value })}
                    className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Source/Era:</label>
                  <input
                    type="text"
                    value={unit.data?.source_era || ''}
                    onChange={(e) => {
                      const updatedUnit = {
                        ...unit,
                        data: {
                          ...unit.data,
                          source_era: e.target.value
                        }
                      };
                      onUnitChange(updatedUnit);
                    }}
                    className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100"
                    disabled={readOnly}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tech Base:</label>
                  <select
                    value={unit.tech_base || 'Inner Sphere'}
                    onChange={(e) => onUnitChange({ ...unit, tech_base: e.target.value })}
                    className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    disabled={readOnly}
                  >
                    <option value="Inner Sphere">Inner Sphere</option>
                    <option value="Clan">Clan</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tech Level:</label>
                  <select
                    value={unit.rules_level || 'Standard'}
                    onChange={(e) => onUnitChange({ ...unit, rules_level: e.target.value })}
                    className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100"
                    disabled={readOnly}
                  >
                    <option value="Introductory">Introductory</option>
                    <option value="Standard">Standard</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Experimental">Experimental</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Manual BV:</label>
                  <input
                    type="number"
                    value={unit.data?.manual_bv || ''}
                    onChange={(e) => {
                      const updatedUnit = {
                        ...unit,
                        data: {
                          ...unit.data,
                          manual_bv: e.target.value ? parseInt(e.target.value) : undefined
                        }
                      };
                      onUnitChange(updatedUnit);
                    }}
                    className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100"
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Role:</label>
                  <select
                    value={unit.role || ''}
                    onChange={(e) => onUnitChange({ ...unit, role: e.target.value })}
                    className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100"
                    disabled={readOnly}
                  >
                    <option value="">None</option>
                    <option value="Brawler">Brawler</option>
                    <option value="Sniper">Sniper</option>
                    <option value="Skirmisher">Skirmisher</option>
                    <option value="Scout">Scout</option>
                    <option value="Striker">Striker</option>
                    <option value="Juggernaut">Juggernaut</option>
                    <option value="Missile Boat">Missile Boat</option>
                    <option value="Fire Support">Fire Support</option>
                  </select>
                </div>
              </div>

              {/* Icon Management */}
              <div className="mt-3 pt-3 border-t border-slate-600">
                <label className="block text-xs font-medium text-slate-300 mb-2">Icon</label>
                <div className="flex items-start space-x-3">
                  {/* Icon Display */}
                  <div className="w-20 h-20 bg-slate-700 border border-slate-600 rounded flex items-center justify-center overflow-hidden">
                    {unit.data?.icon ? (
                      <img 
                        src={unit.data.icon} 
                        alt="Unit Icon" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  
                  {/* Icon Buttons */}
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleIconUpload}
                      className="hidden"
                      disabled={readOnly}
                    />
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-100 rounded"
                      disabled={readOnly}
                    >
                      Choose file
                    </button>
                    
                    <button
                      onClick={() => setShowIconCache(true)}
                      className="w-full px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-100 rounded"
                      disabled={readOnly || iconCache.length === 0}
                    >
                      Import from cache
                    </button>
                    
                    <button
                      onClick={handleIconRemove}
                      className="w-full px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-100 rounded"
                      disabled={readOnly || !unit.data?.icon}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Icon Cache Modal */}
          {showIconCache && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 max-w-2xl max-h-[80vh] overflow-y-auto">
                <h3 className="text-lg font-medium text-slate-100 mb-4">Select Icon from Cache</h3>
                <div className="grid grid-cols-4 gap-3">
                  {iconCache.map((icon) => (
                    <button
                      key={icon.id}
                      onClick={() => handleIconImportFromCache(icon.data)}
                      className="w-24 h-24 bg-slate-700 border border-slate-600 rounded hover:border-blue-500 p-1"
                    >
                      <img 
                        src={icon.data} 
                        alt={icon.name} 
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowIconCache(false)}
                  className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Chassis */}
          <div className="bg-slate-800 border border-slate-600 rounded">
            <h3 className="bg-slate-700 border-b border-slate-600 px-3 py-2 text-sm font-medium text-slate-100">Chassis</h3>
            <div className="p-3 space-y-3">
              <div className="flex items-center space-x-2">
                <label className="text-xs font-medium text-slate-300">Tonnage:</label>
                <NumericInput
                  value={currentTonnage}
                  onChange={(value) => onUnitChange({ ...unit, mass: value })}
                  min={20}
                  max={100}
                  step={5}
                  width="w-16"
                />
                <label className="flex items-center text-xs text-slate-300">
                  <input 
                    type="checkbox" 
                    className="mr-1" 
                    checked={unit.data?.is_omnimech || false}
                    onChange={(e) => {
                      const isQuad = unit.data?.config?.includes('Quad');
                      const updatedUnit = {
                        ...unit,
                        data: {
                          ...unit.data,
                          is_omnimech: e.target.checked,
                          config: (e.target.checked 
                            ? (isQuad ? 'Quad Omnimech' : 'Biped Omnimech')
                            : (isQuad ? 'Quad' : 'Biped')) as UnitConfig
                        }
                      };
                      onUnitChange(updatedUnit);
                    }}
                    disabled={readOnly} 
                  />
                  Omni
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Base Type:</label>
                  <select 
                    value={unit.data?.base_type || 'Standard'}
                    onChange={(e) => {
                      const updatedUnit = {
                        ...unit,
                        data: {
                          ...unit.data,
                          base_type: e.target.value
                        }
                      };
                      onUnitChange(updatedUnit);
                    }}
                    className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100" 
                    disabled={readOnly}
                  >
                    <option value="Standard">Standard</option>
                    <option value="Primitive">Primitive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Motive Type:</label>
                  <select 
                    value={unit.data?.config?.includes('Quad') ? 'Quad' : 'Biped'}
                    onChange={(e) => {
                      const isOmni = unit.data?.is_omnimech || false;
                      const isQuad = e.target.value === 'Quad';
                      const updatedUnit = {
                        ...unit,
                        data: {
                          ...unit.data,
                          config: (isOmni 
                            ? (isQuad ? 'Quad Omnimech' : 'Biped Omnimech')
                            : (isQuad ? 'Quad' : 'Biped')) as UnitConfig
                        }
                      };
                      onUnitChange(updatedUnit);
                    }}
                    className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100" 
                    disabled={readOnly}
                  >
                    <option value="Biped">Biped</option>
                    <option value="Quad">Quad</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Structure:</label>
                  <select 
                    value={unit.data?.structure?.type || 'Standard'}
                    onChange={(e) => {
                      const updatedUnit = {
                        ...unit,
                        data: {
                          ...unit.data,
                          structure: {
                            ...unit.data?.structure,
                            type: e.target.value
                          }
                        }
                      };
                      onUnitChange(updatedUnit);
                    }}
                    className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100" 
                    disabled={readOnly}
                  >
                    <option value="Standard">Standard</option>
                    <option value="Endo Steel">Endo Steel</option>
                    <option value="Endo Steel (Clan)">Endo Steel (Clan)</option>
                    <option value="Composite">Composite</option>
                    <option value="Reinforced">Reinforced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Engine:</label>
                  <div className="flex items-center space-x-2">
                    <select 
                      value={unit.data?.engine?.type || 'Fusion'}
                      onChange={(e) => {
                        const updatedUnit = {
                          ...unit,
                          data: {
                            ...unit.data,
                            engine: {
                              ...unit.data?.engine,
                              type: e.target.value,
                              rating: engineRating
                            }
                          }
                        };
                        onUnitChange(updatedUnit);
                      }}
                      className="flex-1 text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100" 
                      disabled={readOnly}
                    >
                      <option value="Fusion">Fusion</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                      <option value="Light">Light</option>
                      <option value="Compact">Compact</option>
                      <option value="ICE">ICE</option>
                      <option value="Fuel Cell">Fuel Cell</option>
                    </select>
                    <div className={`px-2 py-1 text-xs font-medium rounded ${
                      validation.errors.some(e => e.field === 'engine') ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-100'
                    } border border-slate-600`}>
                      {engineRating}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Gyro:</label>
                  <select 
                    value={unit.data?.gyro?.type || 'Standard'}
                    onChange={(e) => {
                      const updatedUnit = {
                        ...unit,
                        data: {
                          ...unit.data,
                          gyro: {
                            ...unit.data?.gyro,
                            type: e.target.value
                          }
                        }
                      };
                      onUnitChange(updatedUnit);
                    }}
                    className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100" 
                    disabled={readOnly}
                  >
                    <option value="Standard">Standard</option>
                    <option value="XL">XL</option>
                    <option value="Compact">Compact</option>
                    <option value="Heavy Duty">Heavy Duty</option>
                    <option value="None">None</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Cockpit:</label>
                  <select 
                    value={unit.data?.cockpit?.type || 'Standard Cockpit'}
                    onChange={(e) => {
                      const updatedUnit = {
                        ...unit,
                        data: {
                          ...unit.data,
                          cockpit: {
                            ...unit.data?.cockpit,
                            type: e.target.value
                          }
                        }
                      };
                      onUnitChange(updatedUnit);
                    }}
                    className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100" 
                    disabled={readOnly}
                  >
                    <option value="Standard Cockpit">Standard Cockpit</option>
                    <option value="Small Cockpit">Small Cockpit</option>
                    <option value="Torso-Mounted">Torso-Mounted</option>
                    <option value="Command Console">Command Console</option>
                    <option value="Primitive">Primitive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Enhancement:</label>
                <select 
                  value={unit.data?.myomer?.type || 'None'}
                  onChange={(e) => {
                    const updatedUnit = {
                      ...unit,
                      data: {
                        ...unit.data,
                        myomer: {
                          ...unit.data?.myomer,
                          type: e.target.value === 'None' ? undefined : e.target.value
                        }
                      }
                    };
                    onUnitChange(updatedUnit);
                  }}
                  className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100" 
                  disabled={readOnly}
                >
                  <option value="None">None</option>
                  <option value="MASC">MASC</option>
                  <option value="Triple Strength Myomer">Triple Strength Myomer</option>
                  <option value="Industrial TSM">Industrial TSM</option>
                </select>
              </div>
            </div>
          </div>

          {/* Heat Sinks */}
          <div className="bg-slate-800 border border-slate-600 rounded">
            <h3 className="bg-slate-700 border-b border-slate-600 px-3 py-2 text-sm font-medium text-slate-100">Heat Sinks</h3>
            <div className="p-3 space-y-2">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-medium text-slate-300">Type:</label>
                  <select
                    value={unit.data?.heat_sinks?.type || 'Single'}
                    onChange={(e) => {
                      const updatedUnit = {
                        ...unit,
                        data: {
                          ...unit.data,
                          heat_sinks: {
                            ...unit.data?.heat_sinks,
                            type: e.target.value
                          }
                        }
                      };
                      onUnitChange(updatedUnit);
                    }}
                    className="text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100"
                    disabled={readOnly}
                  >
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-medium text-slate-300">Number:</label>
                  <NumericInput
                    value={unit.data?.heat_sinks?.count || 10}
                    onChange={(value) => {
                      const updatedUnit = {
                        ...unit,
                        data: {
                          ...unit.data,
                          heat_sinks: {
                            ...unit.data?.heat_sinks,
                            count: value
                          }
                        }
                      };
                      onUnitChange(updatedUnit);
                    }}
                    min={10}
                    max={50}
                    width="w-16"
                  />
                  <span className="text-xs text-slate-300">Engine Free:</span>
                  <span className="text-xs font-medium text-slate-100">{engineFreeHeatSinks}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-300">Weight Free:</span>
                  <span className="font-medium text-slate-100">10</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-300">Total Dissipation:</span>
                  <span className="font-medium text-slate-100">{unit.data?.heat_sinks?.count || 10}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-300">Total Equipment Heat:</span>
                <span className="font-medium text-slate-100">{heatGeneration}</span>
              </div>
            </div>
          </div>

          {/* Movement */}
          <div className="bg-slate-800 border border-slate-600 rounded">
            <h3 className="bg-slate-700 border-b border-slate-600 px-3 py-2 text-sm font-medium text-slate-100">Movement</h3>
            <div className="p-3 space-y-2">
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="pr-2"></td>
                    <td className="text-center font-medium pr-2 text-slate-300">Base</td>
                    <td className="text-center font-medium text-slate-300">Final</td>
                  </tr>
                  <tr>
                    <td className="pr-2 font-medium text-slate-300">Walk MP:</td>
                    <td className="text-center pr-2">
                      <NumericInput
                        value={unit.data?.movement?.walk_mp || 1}
                        onChange={(value) => {
                          // Calculate max walk MP based on tonnage to keep engine rating <= 400
                          const maxWalkMP = Math.floor(400 / currentTonnage);
                          const constrainedValue = Math.min(value, maxWalkMP);
                          
                          const updatedUnit = {
                            ...unit,
                            data: {
                              ...unit.data,
                              movement: {
                                ...unit.data?.movement,
                                walk_mp: constrainedValue
                              },
                              engine: {
                                ...unit.data?.engine,
                                rating: constrainedValue * currentTonnage
                              }
                            }
                          };
                          onUnitChange(updatedUnit);
                        }}
                        min={1}
                        max={Math.min(12, Math.floor(400 / currentTonnage))}
                        width="w-16"
                      />
                    </td>
                    <td className="text-center">
                      <span className="inline-block px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded min-w-[40px]">{unit.data?.movement?.walk_mp || 1}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="pr-2 font-medium text-slate-300">Run MP:</td>
                    <td className="text-center pr-2">
                      <span className="inline-block px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded min-w-[40px]">{baseRunMP}</span>
                    </td>
                    <td className="text-center">
                      <span className="inline-block px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded min-w-[40px]">{finalRunMP}{finalRunMP !== baseRunMP ? ` (${baseRunMP})` : ''}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="pr-2 font-medium text-slate-300">Jump/UMU MP:</td>
                    <td className="text-center pr-2">
                      <NumericInput
                        value={unit.data?.movement?.jump_mp || 0}
                        onChange={(value) => {
                          const updatedUnit = {
                            ...unit,
                            data: {
                              ...unit.data,
                              movement: {
                                ...unit.data?.movement,
                                jump_mp: value
                              }
                            }
                          };
                          onUnitChange(updatedUnit);
                        }}
                        min={0}
                        max={12}
                        width="w-16"
                      />
                    </td>
                    <td className="text-center">
                      <span className="inline-block px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded min-w-[40px]">{unit.data?.movement?.jump_mp || 0}</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="pt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-medium text-slate-300">Jump Type:</label>
                  <select 
                    value={unit.data?.movement?.jump_type || 'Jump Jet'}
                    onChange={(e) => {
                      const updatedUnit = {
                        ...unit,
                        data: {
                          ...unit.data,
                          movement: {
                            ...unit.data?.movement,
                            jump_type: e.target.value
                          }
                        }
                      };
                      onUnitChange(updatedUnit);
                    }}
                    className="flex-1 text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100" 
                    disabled={readOnly}
                  >
                    <option value="Jump Jet">Jump Jet</option>
                    <option value="UMU">UMU</option>
                    <option value="Mechanical Jump Booster">Mechanical Jump Booster</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-medium text-slate-300">Mech. J. Booster MP:</label>
                  <NumericInput
                    value={unit.data?.movement?.mech_jump_booster_mp || 0}
                    onChange={(value) => {
                      const updatedUnit = {
                        ...unit,
                        data: {
                          ...unit.data,
                          movement: {
                            ...unit.data?.movement,
                            mech_jump_booster_mp: value
                          }
                        }
                      };
                      onUnitChange(updatedUnit);
                    }}
                    min={0}
                    max={12}
                    width="w-16"
                    disabled={unit.data?.movement?.jump_type !== 'Mechanical Jump Booster'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">
          {/* Armor */}
          <div className="bg-slate-800 border border-slate-600 rounded">
            <h3 className="bg-slate-700 border-b border-slate-600 px-3 py-2 text-sm font-medium text-slate-100">Armor</h3>
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Armor Type:</label>
                  <select
                    value={unit.data?.armor?.type || 'Standard'}
                    onChange={(e) => {
                      // When changing armor type, recalculate tonnage based on new points per ton
                      const newType = e.target.value;
                      const newPointsPerTon = newType === 'Ferro-Fibrous' ? 17.92 : 16;
                      const currentPoints = unit.data?.armor?.total_armor_points || 0;
                      
                      const updatedUnit = {
                        ...unit,
                        data: {
                          ...unit.data,
                          armor: {
                            ...unit.data?.armor,
                            type: newType,
                            total_armor_points: currentPoints, // Keep same points, tonnage will update
                            locations: unit.data?.armor?.locations || []
                          }
                        }
                      };
                      onUnitChange(updatedUnit);
                    }}
                    className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100"
                    disabled={readOnly}
                  >
                    <option value="Standard">Standard</option>
                    <option value="Ferro-Fibrous">Ferro-Fibrous</option>
                    <option value="Stealth">Stealth</option>
                  </select>
                </div>
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-300 mb-1">Armor Tonnage:</label>
                    <NumericInput
                      value={armorTonnage}
                      onChange={(value) => {
                        // Calculate new total armor points based on tonnage
                        const newPoints = Math.floor(value * pointsPerTon);
                        
                        // If we have existing armor allocation, scale it proportionally
                        const currentTotal = totalArmorPoints;
                        const locations = unit.data?.armor?.locations || [];
                        
                        let updatedLocations = locations;
                        if (currentTotal > 0 && newPoints !== currentTotal) {
                          const ratio = newPoints / currentTotal;
                          updatedLocations = locations.map(loc => ({
                            ...loc,
                            armor_points: Math.floor(loc.armor_points * ratio),
                            rear_armor_points: Math.floor((loc.rear_armor_points || 0) * ratio)
                          }));
                        }
                        
                        const updatedUnit = {
                          ...unit,
                          data: {
                            ...unit.data,
                            armor: {
                              ...unit.data?.armor,
                              total_armor_points: newPoints,
                              locations: updatedLocations
                            }
                          }
                        };
                        onUnitChange(updatedUnit);
                      }}
                      min={0}
                      max={50}
                      step={0.5}
                      width="w-16"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <button 
                  onClick={() => {
                    // Calculate maximum armor points and auto-allocate them
                    const maxArmor = maxPossibleArmor;
                    
                    // Auto-allocate maximum armor across all locations
                    const locations = [
                      { name: 'Head', max: 9, weight: 0.05 },
                      { name: 'Center Torso', max: getMaxArmor('Center Torso'), weight: 0.20 },
                      { name: 'Left Torso', max: getMaxArmor('Left Torso'), weight: 0.15 },
                      { name: 'Right Torso', max: getMaxArmor('Right Torso'), weight: 0.15 },
                      { name: 'Left Arm', max: getMaxArmor('Left Arm'), weight: 0.10 },
                      { name: 'Right Arm', max: getMaxArmor('Right Arm'), weight: 0.10 },
                      { name: 'Left Leg', max: getMaxArmor('Left Leg'), weight: 0.125 },
                      { name: 'Right Leg', max: getMaxArmor('Right Leg'), weight: 0.125 },
                    ];

                    const newLocations: Array<{
                      location: string;
                      armor_points: number;
                      rear_armor_points: number;
                    }> = [];

                    // Simply max out each location
                    locations.forEach(loc => {
                      if (loc.name === 'Center Torso' || loc.name === 'Left Torso' || loc.name === 'Right Torso') {
                        // Torsos have front and rear armor, distribute 2/3 front, 1/3 rear
                        const frontPoints = Math.ceil(loc.max * 0.67);
                        const rearPoints = loc.max - frontPoints;
                        
                        newLocations.push({
                          location: loc.name,
                          armor_points: frontPoints,
                          rear_armor_points: rearPoints
                        });
                      } else {
                        newLocations.push({
                          location: loc.name,
                          armor_points: loc.max,
                          rear_armor_points: 0
                        });
                      }
                    });

                    const updatedUnit = {
                      ...unit,
                      data: {
                        ...unit.data,
                        armor: {
                          ...unit.data?.armor,
                          total_armor_points: maxArmor,
                          locations: newLocations
                        }
                      }
                    };
                    onUnitChange(updatedUnit);
                  }}
                  className="w-full px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700" 
                  disabled={readOnly}
                >
                  Maximize Armor
                </button>
                <button 
                  onClick={() => {
                    // Calculate remaining tonnage
                    const remainingTonnage = Math.max(0, currentTonnage - usedTonnage);
                    if (remainingTonnage > 0) {
                      // Calculate how many armor points we can add
                      const additionalArmorTonnage = remainingTonnage;
                      const additionalPoints = Math.floor(additionalArmorTonnage * pointsPerTon);
                      const currentPoints = unit.data?.armor?.total_armor_points || 0;
                      const newTotalPoints = currentPoints + additionalPoints;
                      
                      // Don't exceed maximum possible armor
                      const finalPoints = Math.min(newTotalPoints, maxPossibleArmor);
                      
                      const updatedUnit = {
                        ...unit,
                        data: {
                          ...unit.data,
                          armor: {
                            ...unit.data?.armor,
                            total_armor_points: finalPoints,
                            locations: unit.data?.armor?.locations || []
                          }
                        }
                      };
                      onUnitChange(updatedUnit);
                    }
                  }}
                  className="w-full px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-slate-600" 
                  disabled={readOnly || currentTonnage <= usedTonnage}
                >
                  Use Remaining Tonnage ({Math.max(0, currentTonnage - usedTonnage).toFixed(1)}t)
                </button>
              </div>
            </div>
          </div>

          {/* Armor Allocation */}
          <div className="bg-slate-800 border border-slate-600 rounded">
            <h3 className="bg-slate-700 border-b border-slate-600 px-3 py-2 text-sm font-medium text-slate-100">Armor Allocation</h3>
            
            {/* Visual Armor Diagram */}
            <div className="p-3 border-b border-slate-600">
              <MechArmorDiagram
                armorData={armorDataForDiagram}
                mechType="Biped"
                showRearArmor={true}
                interactive={!readOnly}
                size="small"
                theme="dark"
                className="mx-auto"
              />
            </div>
            
            {/* Numeric Inputs */}
            <div className="p-3 text-xs">
              {/* Head - Centered at top */}
              <div className="text-center mb-3">
                <div className="font-medium mb-1 text-slate-100">HD</div>
                <div className="inline-block">
                  <NumericInput
                    value={getArmorValue('Head')}
                    onChange={(value: number) => updateArmorValue('Head', value)}
                    max={getMaxArmor('Head')}
                    width="w-12"
                  />
                </div>
                <div className="text-slate-400 mt-1 text-xs">Max: {getMaxArmor('Head')}</div>
              </div>
              
              {/* Arms and Torsos */}
              <div className="flex justify-center mb-3 space-x-2">
                {/* Left Arm */}
                <div className="text-center">
                  <div className="font-medium mb-1 text-slate-100">LA</div>
                  <NumericInput
                    value={getArmorValue('Left Arm')}
                    onChange={(value: number) => updateArmorValue('Left Arm', value)}
                    max={getMaxArmor('Left Arm')}
                    width="w-12"
                  />
                  <div className="text-slate-400 mt-1 text-xs">Max: {getMaxArmor('Left Arm')}</div>
                </div>

                {/* Left Torso - Boxed with rear */}
                <div className="border border-slate-500 rounded p-1">
                  <div className="text-center">
                    <div className="font-medium mb-1 text-slate-100">LT</div>
                    <NumericInput
                      value={getArmorValue('Left Torso')}
                      onChange={(value: number) => updateArmorValue('Left Torso', value)}
                      max={getMaxArmor('Left Torso')}
                      width="w-12"
                    />
                    <div className="text-slate-400 mt-1 text-xs">Rear</div>
                    <NumericInput
                      value={getArmorValue('Left Torso', true)}
                      onChange={(value: number) => updateArmorValue('Left Torso', value, true)}
                      max={getMaxArmor('Left Torso')}
                      width="w-12"
                    />
                    <div className="text-slate-400 mt-1 text-xs">Max: {getMaxArmor('Left Torso')}</div>
                  </div>
                </div>

                {/* Center Torso - Boxed with rear */}
                <div className="border border-slate-500 rounded p-1">
                  <div className="text-center">
                    <div className="font-medium mb-1 text-slate-100">CT</div>
                    <NumericInput
                      value={getArmorValue('Center Torso')}
                      onChange={(value: number) => updateArmorValue('Center Torso', value)}
                      max={getMaxArmor('Center Torso')}
                      width="w-12"
                    />
                    <div className="text-slate-400 mt-1 text-xs">Rear</div>
                    <NumericInput
                      value={getArmorValue('Center Torso', true)}
                      onChange={(value: number) => updateArmorValue('Center Torso', value, true)}
                      max={getMaxArmor('Center Torso')}
                      width="w-12"
                    />
                    <div className="text-slate-400 mt-1 text-xs">Max: {getMaxArmor('Center Torso')}</div>
                  </div>
                </div>

                {/* Right Torso - Boxed with rear */}
                <div className="border border-slate-500 rounded p-1">
                  <div className="text-center">
                    <div className="font-medium mb-1 text-slate-100">RT</div>
                    <NumericInput
                      value={getArmorValue('Right Torso')}
                      onChange={(value: number) => updateArmorValue('Right Torso', value)}
                      max={getMaxArmor('Right Torso')}
                      width="w-12"
                    />
                    <div className="text-slate-400 mt-1 text-xs">Rear</div>
                    <NumericInput
                      value={getArmorValue('Right Torso', true)}
                      onChange={(value: number) => updateArmorValue('Right Torso', value, true)}
                      max={getMaxArmor('Right Torso')}
                      width="w-12"
                    />
                    <div className="text-slate-400 mt-1 text-xs">Max: {getMaxArmor('Right Torso')}</div>
                  </div>
                </div>

                {/* Right Arm */}
                <div className="text-center">
                  <div className="font-medium mb-1 text-slate-100">RA</div>
                  <NumericInput
                    value={getArmorValue('Right Arm')}
                    onChange={(value: number) => updateArmorValue('Right Arm', value)}
                    max={getMaxArmor('Right Arm')}
                    width="w-12"
                  />
                  <div className="text-slate-400 mt-1 text-xs">Max: {getMaxArmor('Right Arm')}</div>
                </div>
              </div>
              
              {/* Legs - Centered at bottom */}
              <div className="flex justify-center space-x-4">
                {/* Left Leg */}
                <div className="text-center">
                  <div className="font-medium mb-1 text-slate-100">LL</div>
                  <NumericInput
                    value={getArmorValue('Left Leg')}
                    onChange={(value: number) => updateArmorValue('Left Leg', value)}
                    max={getMaxArmor('Left Leg')}
                    width="w-12"
                  />
                </div>
                
                {/* Right Leg */}
                <div className="text-center">
                  <div className="font-medium mb-1 text-slate-100">RL</div>
                  <NumericInput
                    value={getArmorValue('Right Leg')}
                    onChange={(value: number) => updateArmorValue('Right Leg', value)}
                    max={getMaxArmor('Right Leg')}
                    width="w-12"
                  />
                </div>
              </div>
              <div className="text-center text-slate-400 mt-1 text-xs">Max: {getMaxArmor('Left Leg')}</div>
            </div>
            
            {/* Auto-Allocate button at bottom of allocation section */}
            <div className="mt-4 border-t border-slate-600 pt-3">
              <button 
                onClick={() => {
                  // Auto-allocate armor points across all locations
                  const pointsToAllocate = totalArmorPoints;
                  const locations = [
                    { name: 'Head', max: 9, weight: 0.05 },
                    { name: 'Center Torso', max: getMaxArmor('Center Torso'), weight: 0.20 },
                    { name: 'Left Torso', max: getMaxArmor('Left Torso'), weight: 0.15 },
                    { name: 'Right Torso', max: getMaxArmor('Right Torso'), weight: 0.15 },
                    { name: 'Left Arm', max: getMaxArmor('Left Arm'), weight: 0.10 },
                    { name: 'Right Arm', max: getMaxArmor('Right Arm'), weight: 0.10 },
                    { name: 'Left Leg', max: getMaxArmor('Left Leg'), weight: 0.125 },
                    { name: 'Right Leg', max: getMaxArmor('Right Leg'), weight: 0.125 },
                  ];

                  let remainingPoints = pointsToAllocate;
                  const newLocations: Array<{
                    location: string;
                    armor_points: number;
                    rear_armor_points: number;
                  }> = [];

                  // First pass: allocate based on weights
                  locations.forEach(loc => {
                    const desiredPoints = Math.floor(pointsToAllocate * loc.weight);
                    const actualPoints = Math.min(desiredPoints, loc.max);
                    
                    if (loc.name === 'Center Torso' || loc.name === 'Left Torso' || loc.name === 'Right Torso') {
                      // Torsos have front and rear armor
                      const frontPoints = Math.ceil(actualPoints * 0.67); // 2/3 front
                      const rearPoints = actualPoints - frontPoints; // 1/3 rear
                      
                      newLocations.push({
                        location: loc.name,
                        armor_points: Math.min(frontPoints, loc.max),
                        rear_armor_points: Math.min(rearPoints, loc.max)
                      });
                      
                      remainingPoints -= (frontPoints + rearPoints);
                    } else {
                      newLocations.push({
                        location: loc.name,
                        armor_points: actualPoints,
                        rear_armor_points: 0
                      });
                      
                      remainingPoints -= actualPoints;
                    }
                  });

                  // Second pass: distribute any remaining points
                  if (remainingPoints > 0) {
                    // Prioritize CT, then side torsos, then limbs
                    const priorityOrder = ['Center Torso', 'Left Torso', 'Right Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg', 'Head'];
                    
                    for (const locName of priorityOrder) {
                      if (remainingPoints <= 0) break;
                      
                      const loc = newLocations.find(l => l.location === locName);
                      const maxForLoc = getMaxArmor(locName);
                      
                      if (loc) {
                        const currentTotal = loc.armor_points + (loc.rear_armor_points || 0);
                        const canAdd = maxForLoc - currentTotal;
                        
                        if (canAdd > 0) {
                          const toAdd = Math.min(canAdd, remainingPoints);
                          
                          if (locName.includes('Torso')) {
                            // Add to front armor first
                            loc.armor_points += toAdd;
                          } else {
                            loc.armor_points += toAdd;
                          }
                          
                          remainingPoints -= toAdd;
                        }
                      }
                    }
                  }

                  const updatedUnit = {
                    ...unit,
                    data: {
                      ...unit.data,
                      armor: {
                        ...unit.data?.armor,
                        locations: newLocations
                      }
                    }
                  };
                  onUnitChange(updatedUnit);
                }}
                className="w-full px-3 py-2 text-sm bg-orange-600 text-white rounded hover:bg-orange-700" 
                disabled={readOnly}
              >
                Auto-Allocate Armor
              </button>
            </div>
          </div>

          {/* Armor Statistics */}
          <div className="bg-slate-800 border border-slate-600 rounded">
            <h3 className="bg-slate-700 border-b border-slate-600 px-3 py-2 text-sm font-medium text-slate-100">Armor Statistics</h3>
            <div className="p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Unallocated Armor Points:</span>
                <span className="font-medium text-slate-100">{totalArmorPoints - allocatedArmor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Allocated Armor Points:</span>
                <span className="font-medium text-slate-100">{allocatedArmor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Armor Points:</span>
                <span className="font-medium text-slate-100">{totalArmorPoints}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Maximum Possible Armor Points:</span>
                <span className="font-medium text-slate-100">{maxPossibleArmor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Wasted Armor Points:</span>
                <span className="font-medium text-slate-100">{Math.max(0, totalArmorPoints - maxPossibleArmor)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Points Per Ton:</span>
                <span className="font-medium text-slate-100">{pointsPerTon.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-slate-800 border border-slate-600 rounded">
            <h3 className="bg-slate-700 border-b border-slate-600 px-3 py-2 text-sm font-medium text-slate-100">Summary</h3>
            <div className="p-3">
              <div className="grid grid-cols-4 gap-1 text-xs border-b border-slate-600 pb-1 mb-2">
                <span className="font-medium text-slate-300"></span>
                <span className="font-medium text-center text-slate-300">Weight</span>
                <span className="font-medium text-center text-slate-300">Crits</span>
                <span className="font-medium text-center text-slate-300">Availability</span>
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="grid grid-cols-4 gap-1">
                  <span className="text-slate-300">Unit Type:</span>
                  <span className="text-center text-slate-100">{unit.mass} t</span>
                  <span className="text-center text-slate-100">-</span>
                  <span className="text-center text-xs text-slate-100">D/C-C-C-C</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <span className="text-slate-300">Structure:</span>
                  <span className="text-center text-slate-100">{weights.structure.toFixed(1)} t</span>
                  <span className="text-center text-slate-100">{crits.structure}</span>
                  <span className="text-center text-xs text-slate-100">{getComponentAvailability(unit.data?.structure?.type || 'Standard', unit.tech_base)}</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <span className="text-slate-300">Engine:</span>
                  <span className="text-center text-slate-100">{weights.engine.toFixed(1)} t</span>
                  <span className="text-center text-slate-100">{crits.engine}</span>
                  <span className="text-center text-xs text-slate-100">{getComponentAvailability(unit.data?.engine?.type || 'Fusion', unit.tech_base)}</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <span className="text-slate-300">Gyro:</span>
                  <span className="text-center text-slate-100">{weights.gyro} t</span>
                  <span className="text-center text-slate-100">{crits.gyro}</span>
                  <span className="text-center text-xs text-slate-100">{getComponentAvailability(unit.data?.gyro?.type || 'Standard', unit.tech_base)}</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <span className="text-slate-300">Cockpit:</span>
                  <span className="text-center text-slate-100">{weights.cockpit} t</span>
                  <span className="text-center text-slate-100">{crits.cockpit}</span>
                  <span className="text-center text-xs text-slate-100">D/C-C-C-C</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <span className="text-slate-300">Heatsinks:</span>
                  <span className="text-center text-slate-100">{weights.heatSinks} t</span>
                  <span className="text-center text-slate-100">{crits.heatSinks}</span>
                  <span className="text-center text-xs text-slate-100">{getComponentAvailability(unit.data?.heat_sinks?.type || 'Single', unit.tech_base)}</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <span className="text-slate-300">Armor:</span>
                  <span className="text-center text-slate-100">{weights.armor.toFixed(1)} t</span>
                  <span className="text-center text-slate-100">{crits.armor}</span>
                  <span className="text-center text-xs text-slate-100">{getComponentAvailability(unit.data?.armor?.type || 'Standard', unit.tech_base)}</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <span className="text-slate-300">Jump Jets:</span>
                  <span className="text-center text-slate-100">{weights.jumpJets.toFixed(1)} t</span>
                  <span className="text-center text-slate-100">{crits.jumpJets}</span>
                  <span className="text-center text-xs text-slate-100">D/C-C-C-C</span>
                </div>
                {weights.enhancement > 0 && (
                  <div className="grid grid-cols-4 gap-1">
                    <span className="text-slate-300">Enhancement:</span>
                    <span className="text-center text-slate-100">{weights.enhancement} t</span>
                    <span className="text-center text-slate-100">{crits.enhancement}</span>
                    <span className="text-center text-xs text-slate-100">{getComponentAvailability(unit.data?.myomer?.type || 'None', unit.tech_base)}</span>
                  </div>
                )}
                <div className="grid grid-cols-4 gap-1">
                  <span className="text-slate-300">Equipment:</span>
                  <span className="text-center text-slate-100">{equipmentWeight.toFixed(1)} t</span>
                  <span className="text-center text-slate-100">-</span>
                  <span className="text-center text-xs text-slate-100">-</span>
                </div>
                <div className="grid grid-cols-4 gap-1 border-t border-slate-600 pt-1">
                  <span className="text-slate-300 font-medium">Total:</span>
                  <span className={`text-center font-medium ${
                    validation.errors.some(e => e.field === 'tonnage') ? 'text-red-400' : 'text-slate-100'
                  }`}>
                    {(weights.total + equipmentWeight).toFixed(1)} t
                  </span>
                  <span className={`text-center font-medium ${
                    validation.errors.some(e => e.field === 'critical_slots') ? 'text-red-400' : 'text-slate-100'
                  }`}>
                    {crits.total}
                  </span>
                  <span className="text-center text-xs text-slate-100">-</span>
                </div>
              </div>
              
              <div className="mt-3 pt-2 border-t border-slate-600 text-xs">
                <div className="text-center">
                  <span className="font-medium text-slate-100">Earliest Possible Year: {earliestYear}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StructureArmorTab;
