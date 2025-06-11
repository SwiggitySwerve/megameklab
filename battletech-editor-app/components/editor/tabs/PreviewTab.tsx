import React, { useMemo } from 'react';
import { EditorComponentProps, MECH_LOCATIONS } from '../../../types/editor';
import MechArmorDiagram from '../../common/MechArmorDiagram';

const PreviewTab: React.FC<EditorComponentProps> = ({
  unit,
  onUnitChange,
  validationErrors = [],
  readOnly = true, // Preview is typically read-only
  compact = false, // Preview should use full layout
}) => {
  // Calculate unit statistics
  const unitStats = useMemo(() => {
    const equipmentWeight = (unit.equipmentPlacements || []).reduce(
      (sum, placement) => sum + (placement.equipment.weight || 0),
      0
    );

    const totalHeat = (unit.equipmentPlacements || []).reduce(
      (sum, placement) => sum + (placement.equipment.heat || 0),
      0
    );

    const heatDissipation = (unit.data?.heat_sinks?.count || 10) * 
      (unit.data?.heat_sinks?.type === 'Double' ? 2 : 1);

    const totalArmorPoints = unit.data?.armor?.locations?.reduce(
      (sum, loc) => sum + (loc.armor_points || 0) + (loc.rear_armor_points || 0),
      0
    ) || 0;

    return {
      equipmentWeight,
      totalHeat,
      heatDissipation,
      totalArmorPoints,
      remainingWeight: unit.mass - equipmentWeight,
      heatBalance: totalHeat - heatDissipation,
    };
  }, [unit]);

  // Group equipment by location
  const equipmentByLocation = useMemo(() => {
    const locations: { [key: string]: any[] } = {};
    
    (unit.equipmentPlacements || []).forEach(placement => {
      const location = placement.location || 'Unallocated';
      if (!locations[location]) {
        locations[location] = [];
      }
      locations[location].push(placement);
    });

    return locations;
  }, [unit.equipmentPlacements]);

  // Convert armor allocation for diagram
  const armorDiagramData = useMemo(() => {
    if (!unit.data?.armor?.locations) return [];

    return unit.data.armor.locations.map(loc => ({
      location: loc.location,
      armor_points: loc.armor_points || 0,
      rear_armor_points: loc.rear_armor_points || 0,
    }));
  }, [unit.data?.armor?.locations]);

  return (
    <div className="preview-tab bg-white">
      <div className="max-w-5xl mx-auto p-6">
        {/* Record Sheet Header */}
        <div className="text-center mb-6 border-b-2 border-gray-900 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            BATTLEMECH RECORD SHEET
          </h1>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div className="text-left">
              <div className="grid grid-cols-2 gap-2">
                <span className="font-semibold">Type/Model:</span>
                <span>{unit.chassis} {unit.model}</span>
                <span className="font-semibold">Mass:</span>
                <span>{unit.mass} tons</span>
                <span className="font-semibold">Tech Base:</span>
                <span>{unit.tech_base}</span>
                <span className="font-semibold">Era:</span>
                <span>{unit.era}</span>
              </div>
            </div>
            <div className="text-left">
              <div className="grid grid-cols-2 gap-2">
                <span className="font-semibold">Movement Points:</span>
                <span>{unit.data?.movement?.walk_mp || 0}/{unit.data?.movement?.jump_mp || 0}</span>
                <span className="font-semibold">Engine:</span>
                <span>{unit.data?.engine?.type || 'Fusion'}</span>
                <span className="font-semibold">Heat Sinks:</span>
                <span>{unit.data?.heat_sinks?.count || 10} ({unit.data?.heat_sinks?.type || 'Single'})</span>
                <span className="font-semibold">Gyro:</span>
                <span>{unit.data?.gyro?.type || 'Standard'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Left Column - Armor Diagram */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              ARMOR DIAGRAM
            </h3>
            <div className="border-2 border-gray-900 p-4 bg-gray-50">
              {armorDiagramData && (
                <MechArmorDiagram
                  armorData={armorDiagramData}
                  mechType="Biped"
                  showRearArmor={true}
                  interactive={false}
                  size="medium"
                  theme="light"
                />
              )}
              
              {/* Armor Summary */}
              <div className="mt-4 text-xs">
                <div className="flex justify-between border-b border-gray-400 pb-1">
                  <span className="font-semibold">Total Armor Points:</span>
                  <span>{unitStats.totalArmorPoints}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Armor Type:</span>
                  <span>{unit.data?.armor?.type || 'Standard'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Equipment & Weapons */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              WEAPONS & EQUIPMENT
            </h3>
            <div className="border-2 border-gray-900 bg-gray-50">
              <div className="bg-gray-900 text-white text-xs font-semibold p-1 grid grid-cols-6 gap-1">
                <span className="col-span-2">WEAPON</span>
                <span>LOC</span>
                <span>HT</span>
                <span>DMG</span>
                <span>RNG</span>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {Object.entries(equipmentByLocation).map(([location, equipment]) => 
                  equipment.map((placement, index) => (
                    <div key={`${location}-${index}`} className="text-xs p-1 border-b border-gray-300 grid grid-cols-6 gap-1">
                      <span className="col-span-2 truncate">{placement.equipment.name}</span>
                      <span className="text-center">{location.substr(0, 2).toUpperCase()}</span>
                      <span className="text-center">{placement.equipment.heat || '-'}</span>
                      <span className="text-center">{placement.equipment.damage || '-'}</span>
                      <span className="text-center">{placement.equipment.range || '-'}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Equipment Summary */}
              <div className="bg-gray-100 p-2 text-xs border-t-2 border-gray-900">
                <div className="flex justify-between">
                  <span className="font-semibold">Equipment Weight:</span>
                  <span>{unitStats.equipmentWeight.toFixed(1)}t</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Heat Generated:</span>
                  <span>{unitStats.totalHeat}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Heat Dissipated:</span>
                  <span>{unitStats.heatDissipation}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Critical Hits Tables */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              CRITICAL HITS
            </h3>
            <div className="space-y-2">
              {[
                MECH_LOCATIONS.HEAD,
                MECH_LOCATIONS.CENTER_TORSO,
                MECH_LOCATIONS.LEFT_TORSO,
                MECH_LOCATIONS.RIGHT_TORSO,
                MECH_LOCATIONS.LEFT_ARM,
                MECH_LOCATIONS.RIGHT_ARM,
                MECH_LOCATIONS.LEFT_LEG,
                MECH_LOCATIONS.RIGHT_LEG,
              ].map(location => {
                const locationEquipment = equipmentByLocation[location] || [];
                const maxSlots = location === MECH_LOCATIONS.HEAD ? 6 : 12;
                
                return (
                  <div key={location} className="border border-gray-900">
                    <div className="bg-gray-900 text-white text-xs font-semibold p-1 text-center">
                      {location.toUpperCase()}
                    </div>
                    <div className="text-xs">
                      {Array.from({ length: maxSlots }, (_, i) => {
                        const slot = i + 1;
                        let content = '';
                        
                        // Add system criticals
                        if (location === MECH_LOCATIONS.HEAD) {
                          if (slot === 1 || slot === 6) content = 'Life Support';
                          else if (slot === 2 || slot === 5) content = 'Sensors';
                          else if (slot === 3) content = 'Cockpit';
                        } else if (location === MECH_LOCATIONS.CENTER_TORSO) {
                          if (slot <= 3) content = 'Engine';
                          else if (slot >= 4 && slot <= 7) content = 'Gyro';
                          else if (slot >= 10) content = 'Engine';
                        } else if (location.includes('Arm')) {
                          if (slot === 1) content = 'Shoulder';
                          else if (slot === 2) content = 'Upper Arm';
                          else if (slot === 3) content = 'Lower Arm';
                          else if (slot === 4) content = 'Hand';
                        } else if (location.includes('Leg')) {
                          if (slot === 1) content = 'Hip';
                          else if (slot === 2) content = 'Upper Leg';
                          else if (slot === 3) content = 'Lower Leg';
                          else if (slot === 4) content = 'Foot';
                        }
                        
                        // Add equipment if placed
                        const equipment = locationEquipment.find(eq => 
                          eq.criticalSlots?.includes(slot - 1)
                        );
                        if (equipment) {
                          content = equipment.equipment.name;
                        }

                        return (
                          <div key={slot} className="border-b border-gray-300 p-1 h-6 flex items-center">
                            <span className="w-4 text-gray-600 text-xs">{slot}</span>
                            <span className="ml-2 text-xs truncate">{content}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Validation & Statistics Footer */}
        <div className="border-t-2 border-gray-900 pt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">UNIT VALIDATION</h3>
          
          <div className="grid grid-cols-3 gap-6">
            {/* Weight Analysis */}
            <div className="bg-gray-50 border border-gray-300 p-3">
              <h4 className="font-semibold text-sm mb-2">Weight Analysis</h4>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Chassis Weight:</span>
                  <span>{unit.mass}t</span>
                </div>
                <div className="flex justify-between">
                  <span>Equipment Weight:</span>
                  <span>{unitStats.equipmentWeight.toFixed(1)}t</span>
                </div>
                <div className="flex justify-between border-t border-gray-400 pt-1">
                  <span className="font-semibold">Remaining:</span>
                  <span className={`font-semibold ${
                    unitStats.remainingWeight < 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {unitStats.remainingWeight.toFixed(1)}t
                  </span>
                </div>
              </div>
            </div>

            {/* Heat Analysis */}
            <div className="bg-gray-50 border border-gray-300 p-3">
              <h4 className="font-semibold text-sm mb-2">Heat Analysis</h4>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Heat Generated:</span>
                  <span>{unitStats.totalHeat}</span>
                </div>
                <div className="flex justify-between">
                  <span>Heat Dissipated:</span>
                  <span>{unitStats.heatDissipation}</span>
                </div>
                <div className="flex justify-between border-t border-gray-400 pt-1">
                  <span className="font-semibold">Balance:</span>
                  <span className={`font-semibold ${
                    unitStats.heatBalance > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {unitStats.heatBalance > 0 ? '+' : ''}{unitStats.heatBalance}
                  </span>
                </div>
              </div>
            </div>

            {/* Validation Errors */}
            <div className="bg-gray-50 border border-gray-300 p-3">
              <h4 className="font-semibold text-sm mb-2">Validation Status</h4>
              {validationErrors.length === 0 ? (
                <div className="flex items-center text-green-600 text-sm">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Unit is valid
                </div>
              ) : (
                <div className="space-y-1">
                  {validationErrors.slice(0, 3).map((error, index) => (
                    <div key={index} className="flex items-start text-red-600 text-xs">
                      <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{error.message}</span>
                    </div>
                  ))}
                  {validationErrors.length > 3 && (
                    <div className="text-xs text-gray-600">
                      +{validationErrors.length - 3} more issues
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Print Actions */}
        <div className="mt-6 flex justify-center space-x-4 no-print">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Print Record Sheet
          </button>
          <button
            onClick={() => {
              // TODO: Implement PDF export
              console.log('Export to PDF');
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Export to PDF
          </button>
          <button
            onClick={() => {
              // TODO: Implement MTF export
              console.log('Export to MTF');
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            Export to .MTF
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewTab;
