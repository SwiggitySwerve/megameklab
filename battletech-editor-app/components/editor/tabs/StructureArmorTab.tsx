import React, { useCallback } from 'react';
import { EditorComponentProps } from '../../../types/editor';

const StructureArmorTab: React.FC<EditorComponentProps> = ({
  unit,
  onUnitChange,
  validationErrors = [],
  readOnly = false,
}) => {
  // Calculate derived values
  const currentTonnage = unit.mass || 0;
  const runMP = Math.floor((unit.data?.movement?.walk_mp || 0) * 1.5);
  const totalArmorPoints = unit.data?.armor?.total_armor_points || 0;
  const allocatedArmor = unit.data?.armor?.locations?.reduce((sum, loc) => 
    sum + loc.armor_points + (loc.rear_armor_points || 0), 0
  ) || 0;
  const armorTonnage = Math.round((totalArmorPoints / 16) * 2) / 2;

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

  // Update armor value for location
  const updateArmorValue = useCallback((location: string, value: number, isRear: boolean = false) => {
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

  // Calculate max armor for location
  const getMaxArmor = (location: string): number => {
    switch (location) {
      case 'Head': return 9;
      case 'Center Torso': return Math.floor(currentTonnage * 2 * 0.4);
      case 'Left Torso':
      case 'Right Torso': return Math.floor(currentTonnage * 2 * 0.3);
      case 'Left Arm':
      case 'Right Arm':
      case 'Left Leg':
      case 'Right Leg': return Math.floor(currentTonnage * 2 * 0.25);
      default: return 0;
    }
  };

  // Calculate unit statistics
  const usedTonnage = 25; // TODO: Calculate actual used tonnage
  const maxTonnage = currentTonnage;
  const isOverweight = usedTonnage > maxTonnage;
  const battleValue = 277; // TODO: Calculate actual BV
  const dryCost = 1444583; // TODO: Calculate actual cost
  const usedSlots = 54; // TODO: Calculate actual used slots
  const totalSlots = 78;
  const heatGeneration = 13; // TODO: Calculate actual heat
  const heatDissipation = 10; // TODO: Calculate actual dissipation
  const isInvalid = isOverweight || validationErrors.length > 0;

  return (
    <div className="structure-armor-tab bg-slate-900 min-h-screen relative pb-16">
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
                    value=""
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
                    value="-1"
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
                    value=""
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
                    value="Standard"
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
                    type="text"
                    value=""
                    className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100"
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Role:</label>
                  <select
                    value=""
                    className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100"
                    disabled={readOnly}
                  >
                    <option value="">None</option>
                    <option value="Brawler">Brawler</option>
                    <option value="Sniper">Sniper</option>
                    <option value="Skirmisher">Skirmisher</option>
                    <option value="Scout">Scout</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

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
                  <input type="checkbox" className="mr-1" disabled={readOnly} />
                  Omni
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Base Type:</label>
                  <select className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100" disabled={readOnly}>
                    <option value="Standard">Standard</option>
                    <option value="Primitive">Primitive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Motive Type:</label>
                  <select className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100" disabled={readOnly}>
                    <option value="Biped">Biped</option>
                    <option value="Quad">Quad</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Structure:</label>
                  <select className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100" disabled={readOnly}>
                    <option value="Standard">Standard</option>
                    <option value="Endo Steel">Endo Steel</option>
                    <option value="Endo Steel (Clan)">Endo Steel (Clan)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Engine:</label>
                  <select className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100" disabled={readOnly}>
                    <option value="Fusion">Fusion</option>
                    <option value="XL">XL</option>
                    <option value="Light">Light</option>
                    <option value="Compact">Compact</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Gyro:</label>
                  <select className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100" disabled={readOnly}>
                    <option value="Standard">Standard</option>
                    <option value="XL">XL</option>
                    <option value="Compact">Compact</option>
                    <option value="Heavy Duty">Heavy Duty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Cockpit:</label>
                  <select className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100" disabled={readOnly}>
                    <option value="Standard Cockpit">Standard Cockpit</option>
                    <option value="Small Cockpit">Small Cockpit</option>
                    <option value="Torso-Mounted">Torso-Mounted</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Enhancement:</label>
                <select className="w-full text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100" disabled={readOnly}>
                  <option value="None">None</option>
                  <option value="MASC">MASC</option>
                  <option value="Triple Strength Myomer">Triple Strength Myomer</option>
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
                  <span className="text-xs font-medium text-slate-100">1</span>
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
                <span className="font-medium text-slate-100">0</span>
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
                          const updatedUnit = {
                            ...unit,
                            data: {
                              ...unit.data,
                              movement: {
                                ...unit.data?.movement,
                                walk_mp: value
                              }
                            }
                          };
                          onUnitChange(updatedUnit);
                        }}
                        min={1}
                        max={12}
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
                      <span className="inline-block px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded min-w-[40px]">{runMP}</span>
                    </td>
                    <td className="text-center">
                      <span className="inline-block px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded min-w-[40px]">{runMP}</span>
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
                  <select className="flex-1 text-sm border border-slate-600 rounded px-2 py-1 bg-slate-700 text-slate-100" disabled={readOnly}>
                    <option value="Jump Jet">Jump Jet</option>
                    <option value="UMU">UMU</option>
                    <option value="Mechanical Jump Booster">Mechanical Jump Booster</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-medium text-slate-300">Mech. J. Booster MP:</label>
                  <NumericInput
                    value={0}
                    onChange={() => {}}
                    min={0}
                    max={12}
                    width="w-16"
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
                      onChange={() => {}}
                      min={0}
                      max={50}
                      step={0.5}
                      width="w-16"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <button className="w-full px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700" disabled={readOnly}>
                  Maximize Armor
                </button>
                <button className="w-full px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700" disabled={readOnly}>
                  Use Remaining Tonnage
                </button>
              </div>
            </div>
          </div>

          {/* Armor Allocation */}
          <div className="bg-slate-800 border border-slate-600 rounded">
            <h3 className="bg-slate-700 border-b border-slate-600 px-3 py-2 text-sm font-medium text-slate-100">Armor Allocation</h3>
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
                <div className="text-slate-400 mt-1 text-xs">Max: 9</div>
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
                  <div className="text-slate-400 mt-1 text-xs">Max: 8</div>
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
                    <div className="text-slate-400 mt-1 text-xs">Max: 12</div>
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
                    <div className="text-slate-400 mt-1 text-xs">Max: 16</div>
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
                    <div className="text-slate-400 mt-1 text-xs">Max: 12</div>
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
                  <div className="text-slate-400 mt-1 text-xs">Max: 8</div>
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
              <div className="text-center text-slate-400 mt-1 text-xs">Max: 12</div>
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
                <span className="font-medium text-slate-100">89</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Wasted Armor Points:</span>
                <span className="font-medium text-slate-100">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Points Per Ton:</span>
                <span className="font-medium text-slate-100">16.00</span>
              </div>
            </div>
          </div>

          {/* Auto-Allocate Armor */}
          <div className="bg-slate-800 border border-slate-600 rounded">
            <div className="p-3">
              <button className="w-full px-3 py-2 text-sm bg-orange-600 text-white rounded hover:bg-orange-700" disabled={readOnly}>
                Auto-Allocate Armor
              </button>
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
                {[
                  ['Unit Type:', '2.5 t', '', 'D/C-E-D-C'],
                  ['Structure:', '0.5 t', '6', 'D/C-E-D-D'],
                  ['Engine:', '1 t', '4', 'D/C-C-C-C'],
                  ['Gyro:', '3 t', '1', 'D/C-C-C-C'],
                  ['Cockpit:', '', '9', 'C/B-B-B-B'],
                  ['Heatsinks:', '', '', 'D/C-C-C-B'],
                  ['Armor:', '', '', ''],
                  ['Jump Jets:', '', '', ''],
                  ['Equipment:', '', '', ''],
                  ['Myomer:', '', '', ''],
                  ['Other:', '', '', ''],
                ].map(([label, weight, crits, avail], idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-1">
                    <span className="text-slate-300">{label}</span>
                    <span className="text-center text-slate-100">{weight}</span>
                    <span className="text-center text-slate-100">{crits}</span>
                    <span className="text-center text-xs text-slate-100">{avail}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 pt-2 border-t border-slate-600 text-xs">
                <div className="text-center">
                  <span className="font-medium text-slate-100">Earliest Possible Year: 2463</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-600 px-4 py-2 flex items-center justify-between z-50">
        {/* Left side - Status indicators */}
        <div className="flex items-center space-x-6 text-sm">
          {/* Weight */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Weight:</span>
            <span className={`font-medium ${isOverweight ? 'text-red-500' : 'text-slate-100'}`}>
              {usedTonnage} / {maxTonnage}
            </span>
          </div>

          {/* BV */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">BV:</span>
            <span className="font-medium text-slate-100">{battleValue.toLocaleString()}</span>
          </div>

          {/* Validation Status */}
          {isInvalid && (
            <div className="flex items-center space-x-2">
              <span className="text-red-500 font-medium">Invalid</span>
            </div>
          )}

          {/* Dry Cost */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Dry Cost:</span>
            <span className="font-medium text-slate-100">{dryCost.toLocaleString()} C-bills</span>
          </div>

          {/* Free Slots */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Free Slots:</span>
            <span className="font-medium text-slate-100">{totalSlots - usedSlots} / {totalSlots}</span>
          </div>

          {/* Heat */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Heat:</span>
            <span className={`font-medium ${heatGeneration > heatDissipation ? 'text-orange-500' : 'text-slate-100'}`}>
              {heatGeneration} / {heatDissipation}
            </span>
          </div>
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center space-x-3">
          <button className="px-3 py-1 text-sm bg-slate-700 text-slate-200 border border-slate-600 rounded hover:bg-slate-600">
            Equipment Database
          </button>
          <button className="px-3 py-1 text-sm bg-slate-700 text-slate-200 border border-slate-600 rounded hover:bg-slate-600">
            Validate Unit
          </button>
          <button className="px-3 py-1 text-sm bg-slate-700 text-slate-200 border border-slate-600 rounded hover:bg-slate-600">
            Add to Force
          </button>
          <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
            Refresh UI
          </button>
        </div>
      </div>
    </div>
  );
};

export default StructureArmorTab;
