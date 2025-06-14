import React, { useState, useMemo, lazy, Suspense } from 'react';
import { useRouter } from 'next/router';
import { FullUnit, ArmorLocation, WeaponOrEquipmentItem, CriticalSlotLocation, FluffText, UnitQuirk, WeaponClass } from '../../types';
import { 
  convertFullUnitToCustomizable, 
  convertWeaponsToLoadout, 
  createMockAvailableEquipment 
} from '../../utils/unitConverter';
import MechArmorDiagram from '../common/MechArmorDiagram';
import { exportUnit, downloadUnit } from '../../utils/unitExportImportProper';

// Lazy load the heavy UnitDisplay component
const UnitDisplay = lazy(() => import('../common/UnitDisplay'));

interface UnitDetailProps {
  unit: FullUnit | null;
  isLoading: boolean;
  error?: string | null;
}

const SectionTitle: React.FC<{children: React.ReactNode; className?: string}> = ({ children, className }) => (
  <h3 className={`text-xl font-semibold text-gray-700 mt-4 mb-2 pb-1 border-b border-gray-200 ${className}`}>{children}</h3>
);

const DataPair: React.FC<{label: string, value?: string | number | null}> = ({ label, value }) => (
  <div className="flex justify-between py-1 text-sm">
    <span className="font-medium text-gray-600">{label}:</span>
    <span className="text-gray-800 break-words">{value !== undefined && value !== null ? String(value) : 'N/A'}</span>
  </div>
);

type TabName = "Overview" | "Armament" | "Criticals" | "Armor" | "Fluff" | "Analysis";

// Helper functions for safe data access
const safeGetValue = (primary: any, fallback: any, defaultValue: any = null) => {
  return primary !== undefined && primary !== null ? primary : 
         (fallback !== undefined && fallback !== null ? fallback : defaultValue);
};

const safeGetRole = (role: any, fallbackRole: any) => {
  if (typeof role === 'object' && role?.name) return role.name;
  if (typeof role === 'string') return role;
  if (typeof fallbackRole === 'string') return fallbackRole;
  return null;
};

// Weapon categorization helper functions
const categorizeWeapon = (item: WeaponOrEquipmentItem): WeaponClass => {
  if (item.weapon_class) return item.weapon_class;
  
  const name = item.item_name.toLowerCase();
  const type = item.item_type.toLowerCase();
  
  // Check for specific weapon types by name
  if (name.includes('laser') || name.includes('ppc') || name.includes('flamer') || 
      name.includes('plasma') || name.includes('pulse')) {
    return 'Energy';
  }
  
  if (name.includes('autocannon') || name.includes('ac/') || name.includes('gauss') || 
      name.includes('rifle') || name.includes('machine gun') || name.includes('mg')) {
    return 'Ballistic';
  }
  
  if (name.includes('lrm') || name.includes('srm') || name.includes('missile') || 
      name.includes('rocket') || name.includes('narc') || name.includes('artemis')) {
    return 'Missile';
  }
  
  if (name.includes('hatchet') || name.includes('sword') || name.includes('claw') || 
      name.includes('punch') || name.includes('kick')) {
    return 'Physical';
  }
  
  if (type === 'weapon') {
    return 'Energy'; // Default for unknown weapons
  }
  
  return 'Equipment';
};

const getWeaponTypeColor = (weaponClass: WeaponClass): string => {
  switch (weaponClass) {
    case 'Energy': return 'border-red-200 bg-red-50';
    case 'Ballistic': return 'border-yellow-200 bg-yellow-50';
    case 'Missile': return 'border-blue-200 bg-blue-50';
    case 'Physical': return 'border-purple-200 bg-purple-50';
    case 'Artillery': return 'border-orange-200 bg-orange-50';
    case 'Equipment': 
    default: return 'border-gray-200 bg-gray-50';
  }
};

const getWeaponTypeBadgeColor = (weaponClass: WeaponClass): string => {
  switch (weaponClass) {
    case 'Energy': return 'bg-red-100 text-red-800';
    case 'Ballistic': return 'bg-yellow-100 text-yellow-800';
    case 'Missile': return 'bg-blue-100 text-blue-800';
    case 'Physical': return 'bg-purple-100 text-purple-800';
    case 'Artillery': return 'bg-orange-100 text-orange-800';
    case 'Equipment': 
    default: return 'bg-gray-100 text-gray-800';
  }
};

const formatDamage = (damage: string | number | undefined): string => {
  if (!damage) return 'N/A';
  if (typeof damage === 'number') return String(damage);
  return String(damage);
};

const formatRange = (range: WeaponOrEquipmentItem['range']): string => {
  if (!range) return 'N/A';
  
  const s = range.short ?? 'N/A';
  const m = range.medium ?? 'N/A';
  const l = range.long ?? 'N/A';
  const e = range.extreme;
  
  let rangeStr = `${s}/${m}/${l}`;
  if (e !== undefined) rangeStr += `/${e}`;
  if (range.minimum !== undefined) rangeStr += ` (Min: ${range.minimum})`;
  
  return rangeStr;
};

const groupWeaponsByType = (weapons: WeaponOrEquipmentItem[]) => {
  const grouped = weapons.reduce((acc, weapon) => {
    const category = categorizeWeapon(weapon);
    if (!acc[category]) acc[category] = [];
    acc[category].push(weapon);
    return acc;
  }, {} as Record<WeaponClass, WeaponOrEquipmentItem[]>);
  
  // Sort within each group by location, then by name
  Object.keys(grouped).forEach(category => {
    grouped[category as WeaponClass].sort((a, b) => {
      if (a.location !== b.location) return a.location.localeCompare(b.location);
      return a.item_name.localeCompare(b.item_name);
    });
  });
  
  return grouped;
};

const UnitDetail: React.FC<UnitDetailProps> = ({ unit, isLoading, error }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabName>("Overview");
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Convert unit for analysis display with error handling - MUST be called before any early returns
  const convertedUnit = useMemo(() => {
    if (!unit) return null;
    try {
      return convertFullUnitToCustomizable(unit);
    } catch (error) {
      console.error('Error converting unit for analysis:', error);
      return null;
    }
  }, [unit]);

  const loadout = useMemo(() => {
    if (!unit) return [];
    try {
      return convertWeaponsToLoadout(unit);
    } catch (error) {
      console.error('Error converting weapons to loadout:', error);
      return [];
    }
  }, [unit]);

  const availableEquipment = useMemo(() => {
    if (!unit) return [];
    try {
      return createMockAvailableEquipment(unit);
    } catch (error) {
      console.error('Error creating mock equipment:', error);
      return [];
    }
  }, [unit]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading unit details...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-10">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md mx-auto">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Unit</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!unit) {
    return (
      <div className="text-center py-10">
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 max-w-md mx-auto">
          <p className="text-gray-600">No unit data available.</p>
        </div>
      </div>
    );
  }

  // Safe data extraction with proper validation
  const uData = unit.data || {};
  const chassis = safeGetValue(uData.chassis, unit.chassis, 'Unknown');
  const model = safeGetValue(uData.model, unit.model, 'Unknown');
  const mass = safeGetValue(uData.mass, unit.mass, 0);
  const tech_base = safeGetValue(uData.tech_base, unit.tech_base, 'Unknown');
  const era = safeGetValue(uData.era, unit.era, 'Unknown');
  const rules_level = safeGetValue(uData.rules_level, unit.rules_level, 'Unknown');
  const role = safeGetRole(uData.role, unit.role);
  const source = safeGetValue(uData.source, unit.source, 'Unknown');
  const mul_id = safeGetValue(uData.mul_id, unit.mul_id, null);

  // Handle export functionality
  const handleExport = (format: 'json' | 'mtf' | 'auto') => {
    // Convert FullUnit to EditableUnit format for export
    const exportUnit = {
      ...unit,
      // Add EditableUnit specific fields
      armorAllocation: {},
      equipmentPlacements: [],
      criticalSlots: [],
      fluffData: uData.fluff_text || {},
      selectedQuirks: [],
      validationState: { isValid: true, errors: [], warnings: [] },
      editorMetadata: {
        lastModified: new Date(),
        isDirty: false,
        version: '1.0'
      }
    };
    
    try {
      downloadUnit(exportUnit as any, format);
      setShowExportMenu(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export unit. Please try again.');
    }
  };


  const renderOverviewTab = () => (
    <>
      <SectionTitle>General</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
        <DataPair label="Mass" value={`${mass || 0} tons`} />
        <DataPair label="Tech Base" value={tech_base} />
        <DataPair label="Era" value={era} />
        <DataPair label="Rules Level" value={rules_level} />
        <DataPair label="Role" value={role} />
        <DataPair label="Source" value={source} />
        <DataPair label="Configuration" value={uData.config} />
        <DataPair label="MUL ID" value={mul_id || 'N/A'} />
      </div>

      {uData.engine && (
        <>
          <SectionTitle>Propulsion & Structure</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            <DataPair label="Engine" value={`${uData.engine.rating} ${uData.engine.type} (${uData.engine.manufacturer || 'N/A'})`} />
            {uData.movement && <DataPair label="Walking MP" value={uData.movement.walk_mp} />}
            {uData.movement && <DataPair label="Running MP" value={uData.movement.run_mp} /> }
            {uData.movement && <DataPair label="Jumping MP" value={uData.movement.jump_mp} />}
            {uData.structure && <DataPair label="Internal Structure" value={`${uData.structure.type} (${uData.structure.manufacturer || 'N/A'})`} />}
            {uData.myomer && <DataPair label="Myomer" value={`${uData.myomer.type} (${uData.myomer.manufacturer || 'N/A'})`} />}
          </div>
        </>
      )}
      {uData.heat_sinks && (
        <>
          <SectionTitle>Heat Management</SectionTitle>
          <DataPair
            label="Heat Sinks"
            value={`${uData.heat_sinks.count || 0} ${uData.heat_sinks.type || ''} (Dissipating: ${uData.heat_sinks.dissipation_per_sink || (uData.heat_sinks.count || 0) * (uData.heat_sinks.type?.includes("Double") ? 2 : 1) })`}
          />
        </>
      )}
      {uData.cockpit && (
         <>
          <SectionTitle>Cockpit</SectionTitle>
          <DataPair label="Cockpit Type" value={uData.cockpit.type || 'Standard'} />
          {uData.cockpit.manufacturer && <DataPair label="Manufacturer" value={uData.cockpit.manufacturer} />}
         </>
      )}
       {uData.gyro && (
         <>
          <SectionTitle>Gyro</SectionTitle>
          <DataPair label="Gyro Type" value={uData.gyro.type || 'Standard'} />
          {uData.gyro.manufacturer && <DataPair label="Manufacturer" value={uData.gyro.manufacturer} />}
         </>
      )}
      {uData.quirks && (Array.isArray(uData.quirks) ? uData.quirks.length > 0 : ((uData.quirks.positive?.length || 0) > 0 || (uData.quirks.negative?.length || 0) > 0)) && (
        <>
          <SectionTitle>Quirks</SectionTitle>
          {Array.isArray(uData.quirks) ? (
            <ul className="list-disc list-inside pl-4 space-y-1 text-sm text-gray-700">
              {uData.quirks.map((quirk: UnitQuirk, index: number) => (
                <li key={index}>{typeof quirk === 'string' ? quirk : quirk.name}</li>
              ))}
            </ul>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uData.quirks.positive && uData.quirks.positive.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-700 mb-1">Positive</h4>
                  <ul className="list-disc list-inside pl-4 space-y-1 text-sm text-gray-700">
                    {uData.quirks.positive.map((quirk: string, index: number) => (
                      <li key={index}>{quirk}</li>
                    ))}
                  </ul>
                </div>
              )}
              {uData.quirks.negative && uData.quirks.negative.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-700 mb-1">Negative</h4>
                  <ul className="list-disc list-inside pl-4 space-y-1 text-sm text-gray-700">
                    {uData.quirks.negative.map((quirk: string, index: number) => (
                      <li key={index}>{quirk}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );

  const renderArmamentTab = () => {
    if (!uData.weapons_and_equipment || uData.weapons_and_equipment.length === 0) {
      return (
        <>
          <SectionTitle>Weapons and Equipment</SectionTitle>
          <p className="text-sm text-gray-500">No armament or significant equipment listed.</p>
        </>
      );
    }

    const groupedWeapons = groupWeaponsByType(uData.weapons_and_equipment);
    const weaponTypes: WeaponClass[] = ['Energy', 'Ballistic', 'Missile', 'Physical', 'Artillery', 'Equipment'];

    return (
      <>
        <SectionTitle>Weapons and Equipment</SectionTitle>
        <div className="space-y-6 mt-4">
          {weaponTypes.map(weaponType => {
            const weapons = groupedWeapons[weaponType];
            if (!weapons || weapons.length === 0) return null;

            return (
              <div key={weaponType} className="space-y-3">
                {/* Category Header */}
                <div className="flex items-center space-x-2">
                  <h4 className="text-lg font-semibold text-gray-700">{weaponType} Weapons</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getWeaponTypeBadgeColor(weaponType)}`}>
                    {weapons.length} item{weapons.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Weapons in this category */}
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
                  {weapons.map((item, index) => {
                    const weaponClass = categorizeWeapon(item);
                    return (
                      <div
                        key={`${weaponType}-${index}`}
                        className={`p-4 rounded-lg shadow-sm border-2 ${getWeaponTypeColor(weaponClass)}`}
                      >
                        {/* Weapon Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900">{item.item_name}</h5>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getWeaponTypeBadgeColor(weaponClass)}`}>
                                {weaponClass}
                              </span>
                              <span className="text-sm text-gray-600">
                                {item.location}
                                {item.rear_facing && <span className="ml-1 text-orange-600">(Rear)</span>}
                                {item.turret_mounted && <span className="ml-1 text-blue-600">(Turret)</span>}
                                {item.is_omnipod && <span className="ml-1 text-purple-600">(OmniPod)</span>}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Weapon Statistics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="space-y-1">
                            <span className="font-medium text-gray-600">Damage:</span>
                            <span className="block text-gray-800">{formatDamage(item.damage)}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="font-medium text-gray-600">Range:</span>
                            <span className="block text-gray-800">{formatRange(item.range)}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="font-medium text-gray-600">Heat:</span>
                            <span className="block text-gray-800">{item.heat ?? 'N/A'}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="font-medium text-gray-600">Crits:</span>
                            <span className="block text-gray-800">{item.crits ?? 'N/A'}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="font-medium text-gray-600">Weight:</span>
                            <span className="block text-gray-800">{item.tons ? `${item.tons} tons` : 'N/A'}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="font-medium text-gray-600">Ammo/Ton:</span>
                            <span className="block text-gray-800">{item.ammo_per_ton ?? 'N/A'}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="font-medium text-gray-600">Tech Base:</span>
                            <span className="block text-gray-800">{item.tech_base}</span>
                          </div>

                          {item.related_ammo && (
                            <div className="space-y-1">
                              <span className="font-medium text-gray-600">Ammo Type:</span>
                              <span className="block text-gray-800">{item.related_ammo}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const renderCriticalsTab = () => {
    if (!uData.criticals || uData.criticals.length === 0) {
      return (
        <>
          <SectionTitle>Critical Locations</SectionTitle>
          <p className="text-sm text-gray-500">Critical slot information not available.</p>
        </>
      );
    }

    // Organize criticals by location for MegaMekLab-style layout
    const criticalsByLocation = uData.criticals.reduce((acc, critLoc) => {
      acc[critLoc.location] = critLoc;
      return acc;
    }, {} as Record<string, CriticalSlotLocation>);

    // Helper function to render a critical location
    const renderCriticalLocation = (locationName: string, maxSlots: number = 12) => {
      const critLoc = criticalsByLocation[locationName];
      if (!critLoc) return null;

      const slots = critLoc.slots.slice(0, maxSlots);
      // Pad with empty slots if needed
      while (slots.length < maxSlots) {
        slots.push('-Empty-');
      }

      return (
        <div className="space-y-2">
          <h4 className="font-semibold text-center text-sm text-gray-700 bg-gray-100 px-3 py-2 rounded border">
            {locationName}
          </h4>
          <div className="border border-gray-200 rounded bg-gray-50">
            <ul className="divide-y divide-gray-200">
              {slots.map((slot, i) => (
                <li 
                  key={i} 
                  className={`px-3 py-1 text-xs flex justify-between items-center ${
                    slot && slot !== '-Empty-' 
                      ? 'bg-white text-gray-900' 
                      : 'text-gray-400 bg-gray-50'
                  }`}
                >
                  <span className="font-mono w-6">{i + 1}:</span>
                  <span className="flex-1 ml-2 truncate" title={slot || 'Empty'}>
                    {slot === '-Empty-' ? 'Empty' : slot}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    };

    return (
      <>
        <SectionTitle>Critical Locations</SectionTitle>
        
        {/* MegaMekLab-style layout */}
        <div className="space-y-6 max-w-6xl mx-auto">
          
          {/* Head Section - Top center */}
          <div className="flex justify-center">
            <div className="w-48">
              {renderCriticalLocation('Head', 6)}
            </div>
          </div>

          {/* Arms and Torso Section - Main body */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            
            {/* Left Arm */}
            <div className="lg:col-span-1">
              {renderCriticalLocation('Left Arm', 12)}
            </div>

            {/* Torso Section */}
            <div className="lg:col-span-3 grid grid-cols-3 gap-4">
              {/* Left Torso */}
              <div>
                {renderCriticalLocation('Left Torso', 12)}
              </div>
              
              {/* Center Torso */}
              <div>
                {renderCriticalLocation('Center Torso', 12)}
              </div>
              
              {/* Right Torso */}
              <div>
                {renderCriticalLocation('Right Torso', 12)}
              </div>
            </div>

            {/* Right Arm */}
            <div className="lg:col-span-1">
              {renderCriticalLocation('Right Arm', 12)}
            </div>
          </div>

          {/* Legs Section - Bottom */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div>
              {renderCriticalLocation('Left Leg', 6)}
            </div>
            <div>
              {renderCriticalLocation('Right Leg', 6)}
            </div>
          </div>

          {/* Rear Torso Section (if applicable) */}
          {(criticalsByLocation['Left Torso (rear)'] || 
            criticalsByLocation['Center Torso (rear)'] || 
            criticalsByLocation['Right Torso (rear)']) && (
            <>
              <div className="border-t pt-6 mt-6">
                <h4 className="text-lg font-semibold text-gray-700 mb-4 text-center">Rear Torso</h4>
                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                  <div>
                    {renderCriticalLocation('Left Torso (rear)', 2)}
                  </div>
                  <div>
                    {renderCriticalLocation('Center Torso (rear)', 2)}
                  </div>
                  <div>
                    {renderCriticalLocation('Right Torso (rear)', 2)}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Additional Locations (for any non-standard locations) */}
          {Object.keys(criticalsByLocation).some(loc => 
            !['Head', 'Left Arm', 'Right Arm', 'Left Torso', 'Center Torso', 'Right Torso', 
              'Left Leg', 'Right Leg', 'Left Torso (rear)', 'Center Torso (rear)', 'Right Torso (rear)'].includes(loc)
          ) && (
            <>
              <div className="border-t pt-6 mt-6">
                <h4 className="text-lg font-semibold text-gray-700 mb-4 text-center">Other Locations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(criticalsByLocation)
                    .filter(([location]) => 
                      !['Head', 'Left Arm', 'Right Arm', 'Left Torso', 'Center Torso', 'Right Torso', 
                        'Left Leg', 'Right Leg', 'Left Torso (rear)', 'Center Torso (rear)', 'Right Torso (rear)'].includes(location)
                    )
                    .map(([location, critLoc]) => (
                      <div key={location}>
                        {renderCriticalLocation(location, critLoc.slots.length)}
                      </div>
                    ))
                  }
                </div>
              </div>
            </>
          )}
        </div>
      </>
    );
  };

  const renderArmorTab = () => {
    if (!uData.armor || !uData.armor.locations || uData.armor.locations.length === 0) {
      return (
        <>
          <SectionTitle>Armor Distribution (N/A)</SectionTitle>
          <p className="text-sm text-gray-500">Armor information not available.</p>
        </>
      );
    }

    // Determine mech type from unit configuration
    const getMechType = () => {
      const config = uData.config?.toLowerCase() || '';
      if (config.includes('quad')) return 'Quad';
      if (config.includes('lam')) return 'LAM';
      return 'Biped'; // Default
    };

    const mechType = getMechType();
    const hasRearArmor = uData.armor.locations.some(loc => 
      loc.rear_armor_points !== undefined && loc.rear_armor_points > 0
    );

    return (
      <>
        <SectionTitle>Armor Distribution ({uData.armor.type || 'N/A'})</SectionTitle>
        
        {/* MegaMekLab-style Armor Diagram */}
        <div className="flex justify-center mb-8">
          <MechArmorDiagram
            armorData={uData.armor.locations}
            mechType={mechType}
            showRearArmor={hasRearArmor}
            interactive={true}
            size="large"
            theme="light"
            className="mx-auto"
          />
        </div>

        {/* Detailed Armor Table */}
        <div className="mt-8">
          <h4 className="text-lg font-semibold text-gray-700 mb-4">Detailed Armor Values</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg shadow-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Front Armor</th>
                  {hasRearArmor && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rear Armor</th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {uData.armor.locations.map((loc: ArmorLocation, index) => {
                  const frontArmor = loc.armor_points || 0;
                  const rearArmor = loc.rear_armor_points || 0;
                  const total = frontArmor + rearArmor;
                  
                  return (
                    <tr key={loc.location} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {loc.location}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-mono">
                        {frontArmor}
                      </td>
                      {hasRearArmor && (
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-mono">
                          {rearArmor > 0 ? rearArmor : '-'}
                        </td>
                      )}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono font-semibold">
                        {total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              
              {/* Total Armor Footer */}
              <tfoot className="bg-gray-100">
                <tr className="font-semibold">
                  <td className="px-4 py-3 text-sm text-gray-900">Total Armor Points</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                    {uData.armor.locations.reduce((sum, loc) => sum + (loc.armor_points || 0), 0)}
                  </td>
                  {hasRearArmor && (
                    <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                      {uData.armor.locations.reduce((sum, loc) => sum + (loc.rear_armor_points || 0), 0)}
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm text-gray-900 font-mono font-bold">
                    {uData.armor.total_armor_points || 
                     uData.armor.locations.reduce((sum, loc) => 
                       sum + (loc.armor_points || 0) + (loc.rear_armor_points || 0), 0
                     )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Armor Summary Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-semibold text-blue-800">Armor Type</h5>
            <p className="text-blue-700">{uData.armor.type || 'Standard'}</p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h5 className="font-semibold text-green-800">Total Protection</h5>
            <p className="text-green-700 font-mono text-lg">
              {uData.armor.total_armor_points || 
               uData.armor.locations.reduce((sum, loc) => 
                 sum + (loc.armor_points || 0) + (loc.rear_armor_points || 0), 0
               )} points
            </p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h5 className="font-semibold text-purple-800">Coverage</h5>
            <p className="text-purple-700">
              {uData.armor.locations.length} locations
              {hasRearArmor && <span className="block text-sm">Includes rear armor</span>}
            </p>
          </div>
        </div>
      </>
    );
  };

  const renderFluffTab = () => (
    <>
      <SectionTitle>History & Background</SectionTitle>
      {(!uData.fluff_text || Object.keys(uData.fluff_text).length === 0) && <p className="text-sm text-gray-500">No fluff or historical information available.</p>}
      {uData.fluff_text && Object.entries(uData.fluff_text).map(([key, value]) => value && (
        <div key={key} className="mt-3">
          <h4 className="font-semibold text-md capitalize text-gray-700">{key.replace(/_/g, ' ')}</h4>
          <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{String(value)}</p>
        </div>
      ))}
    </>
  );

  const renderAnalysisTab = () => (
    <>
      <SectionTitle>Detailed Analysis</SectionTitle>
      {convertedUnit ? (
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading analysis...</span>
            </div>
          }
        >
          <UnitDisplay
            unit={convertedUnit}
            loadout={loadout}
            availableEquipment={availableEquipment}
            options={{
              showBasicInfo: true,
              showMovement: true,
              showArmor: true,
              showStructure: true,
              showHeatManagement: true,
              showEquipmentSummary: true,
              showCriticalSlotSummary: true,
              showBuildRecommendations: true,
              showTechnicalSpecs: true,
              compact: false,
              interactive: false
            }}
          />
        </Suspense>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Analysis Unavailable</h3>
              <p className="mt-1 text-sm text-yellow-700">
                Unable to perform detailed analysis for this unit. This may be due to incomplete unit data or conversion issues.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const tabs: { name: TabName; label: string; disabled?: boolean }[] = [
    { name: "Overview", label: "Overview & Stats" },
    { name: "Armament", label: "Armament & Equipment" },
    { name: "Criticals", label: "Criticals" },
    { name: "Armor", label: "Armor Distribution" },
    { name: "Fluff", label: "History & Fluff" },
    { name: "Analysis", label: "Advanced Analysis", disabled: !convertedUnit },
  ];

  return (
    <div className="content-card">
      <header className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => router.push('/compendium')}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Compendium
          </button>
          
          {/* Export Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Unit
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <button
                  onClick={() => handleExport('json')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  JSON (Full Data)
                </button>
                <button
                  onClick={() => handleExport('mtf')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  MTF (MegaMekLab)
                </button>
                <button
                  onClick={() => handleExport('auto')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Auto-detect Format
                </button>
              </div>
            )}
          </div>
        </div>
        <h1 className="text-3xl font-bold text-blue-700">{chassis} {model}</h1>
      </header>

      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => !tab.disabled && setActiveTab(tab.name)}
              disabled={tab.disabled}
              className={`${
                activeTab === tab.name
                  ? 'border-blue-500 text-blue-600'
                  : tab.disabled
                  ? 'border-transparent text-gray-400 cursor-not-allowed'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 px-2 sm:px-4 border-b-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 rounded-t-md transition-colors duration-200`}
              title={tab.disabled ? 'Analysis unavailable - unit conversion failed' : undefined}
            >
              {tab.label}
              {tab.disabled && (
                <span className="ml-1 text-xs text-gray-400" aria-label="Disabled">⚠</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="tab-content min-h-[200px]"> {/* Added min-height to prevent layout shifts */}
        {activeTab === "Overview" && renderOverviewTab()}
        {activeTab === "Analysis" && renderAnalysisTab()}
        {activeTab === "Armament" && renderArmamentTab()}
        {activeTab === "Criticals" && renderCriticalsTab()}
        {activeTab === "Armor" && renderArmorTab()}
        {activeTab === "Fluff" && renderFluffTab()}
      </div>
    </div>
  );
};

export default UnitDetail;
