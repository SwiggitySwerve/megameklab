/**
 * Equipment Tab Component with Hooks
 * Manages weapons and equipment, filtering out system components
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useUnitData, useSystemComponents } from '../../../hooks/useUnitData';
import { EquipmentItem, FULL_EQUIPMENT_DATABASE, getJumpJetWeight, getHatchetSpecs, getSwordSpecs } from '../../../utils/equipmentDatabase';
import { FullEquipment } from '../../../types';

interface EquipmentTabWithHooksProps {
  readOnly?: boolean;
}

// Equipment that should be filtered out (managed by other tabs)
const FILTERED_EQUIPMENT_IDS = [
  'heat-sink',
  'double-heat-sink',
  'clan-double-heat-sink',
  // Add more system component IDs as needed
];

// Categories to show in the equipment tab
const EQUIPMENT_CATEGORIES = [
  'Energy',
  'Ballistic',
  'Missile',
  'Artillery',
  'Physical',
  'Equipment',
  'Ammo',
  'Other',
];

interface EquipmentFilter {
  categories: string[];
  hidePrototype: boolean;
  hideOneShot: boolean;
  hideTorpedoes: boolean;
  hideAmmoWithoutWeapon: boolean;
  hideUnavailable: boolean;
  searchText: string;
  showAll: boolean;
}

export default function EquipmentTabWithHooks({ readOnly = false }: EquipmentTabWithHooksProps) {
  const { state, addEquipment, removeEquipment } = useUnitData();
  const systemComponents = useSystemComponents();
  
  const unit = state.unit;
  
  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('Show All');
  const [filter, setFilter] = useState<EquipmentFilter>({
    categories: [],
    hidePrototype: false,
    hideOneShot: false,
    hideTorpedoes: false,
    hideAmmoWithoutWeapon: false,
    hideUnavailable: true,
    searchText: '',
    showAll: true,
  });
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Get currently mounted equipment
  const mountedEquipment = unit.equipmentPlacements || [];
  
  // Calculate current equipment weight
  const calculateEquipmentWeight = useCallback((): number => {
    let weight = 0;
    
    mountedEquipment.forEach(placement => {
      const equipment = placement.equipment;
      if (equipment.id === 'jump-jet') {
        weight += getJumpJetWeight(unit.mass);
      } else if (equipment.id === 'hatchet') {
        weight += getHatchetSpecs(unit.mass).weight;
      } else if (equipment.id === 'sword') {
        weight += getSwordSpecs(unit.mass).weight;
      } else {
        weight += equipment.weight || 0;
      }
    });
    
    return weight;
  }, [mountedEquipment, unit.mass]);
  
  const equipmentWeight = calculateEquipmentWeight();
  
  // Sort equipment
  const sortEquipment = useCallback((items: EquipmentItem[]) => {
    return [...items].sort((a, b) => {
      let aVal: any = a[sortColumn as keyof EquipmentItem];
      let bVal: any = b[sortColumn as keyof EquipmentItem];
      
      // Convert to numbers for numeric columns
      if (['weight', 'crits', 'heat', 'damage', 'minRange', 'bv', 'year'].includes(sortColumn)) {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [sortColumn, sortDirection]);
  
  // Filter available equipment
  const availableEquipment = useMemo(() => {
    return FULL_EQUIPMENT_DATABASE.filter(item => {
      // Filter out system components
      if (FILTERED_EQUIPMENT_IDS.includes(item.id)) return false;
      
      // Category filter - empty string means show all
      if (!filter.showAll && filter.categories.length > 0 && !filter.categories.includes(item.category)) {
        return false;
      }
      
      // Hide unavailable based on year
      const unitYear = parseInt(unit.era) || 3025;
      if (filter.hideUnavailable && item.year > unitYear) return false;
      
      // Search filter
      if (filter.searchText && !item.name.toLowerCase().includes(filter.searchText.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [filter, unit.era]);
  
  // Sort filtered equipment
  const sortedEquipment = useMemo(() => {
    return sortEquipment(availableEquipment);
  }, [availableEquipment, sortEquipment]);
  
  // Handle category click
  const handleCategoryClick = (category: string) => {
    if (category === 'Show All') {
      setFilter(prev => ({ ...prev, showAll: true, categories: [] }));
    } else {
      const newCategories = filter.categories.includes(category)
        ? filter.categories.filter(c => c !== category)
        : [...filter.categories, category];
      setFilter(prev => ({ 
        ...prev, 
        showAll: false, 
        categories: newCategories 
      }));
    }
    setSelectedCategory(category);
  };
  
  // Handle column sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  // Handle adding equipment
  const handleAddEquipment = useCallback((equipmentItem: EquipmentItem) => {
    if (readOnly) return;
    
    // Create FullEquipment object from EquipmentItem
    const fullEquipment: FullEquipment = {
      id: equipmentItem.id,
      name: equipmentItem.name,
      type: equipmentItem.category.toLowerCase() as any,
      weight: equipmentItem.weight,
      space: equipmentItem.crits,
      damage: equipmentItem.damage,
      heat: equipmentItem.heat,
      tech_base: equipmentItem.techBase as any,
      introduction_year: equipmentItem.year,
    };
    
    // Handle special cases for variable weight items
    if (equipmentItem.id === 'jump-jet') {
      fullEquipment.weight = getJumpJetWeight(unit.mass);
    } else if (equipmentItem.id === 'hatchet') {
      const specs = getHatchetSpecs(unit.mass);
      fullEquipment.weight = specs.weight;
      fullEquipment.space = specs.crits;
      fullEquipment.damage = specs.damage;
    } else if (equipmentItem.id === 'sword') {
      const specs = getSwordSpecs(unit.mass);
      fullEquipment.weight = specs.weight;
      fullEquipment.space = specs.crits;
      fullEquipment.damage = specs.damage;
    }
    
    addEquipment(fullEquipment);
  }, [readOnly, unit.mass, addEquipment]);
  
  // Handle removing equipment
  const handleRemoveEquipment = useCallback((placementId: string) => {
    if (readOnly) return;
    removeEquipment(placementId as any);
  }, [readOnly, removeEquipment]);
  
  // Calculate totals
  const totalWeight = equipmentWeight;
  const totalCrits = mountedEquipment.reduce((sum, placement) => {
    const equipment = placement.equipment;
    return sum + (equipment.space || 0);
  }, 0);
  const totalHeat = mountedEquipment.reduce((sum, placement) => {
    const equipment = placement.equipment;
    return sum + (equipment.heat || 0);
  }, 0);
  
  // Calculate remaining tonnage
  const calculateRemainingTonnage = (): number => {
    let usedTonnage = 0;
    
    // Structure weight
    if (systemComponents?.structure) {
      usedTonnage += unit.mass * 0.1; // Simplified
    }
    
    // Engine, gyro, cockpit weights
    // Add actual calculations here
    
    // Equipment weight
    usedTonnage += equipmentWeight;
    
    return unit.mass - usedTonnage;
  };
  
  const remainingTonnage = calculateRemainingTonnage();
  
  // Function to abbreviate location names
  const abbreviateLocation = (location: string): string => {
    const abbreviations: Record<string, string> = {
      'Left Torso': 'LT',
      'Right Torso': 'RT',
      'Center Torso': 'CT',
      'Left Arm': 'LA',
      'Right Arm': 'RA',
      'Left Leg': 'LL',
      'Right Leg': 'RL',
      'Head': 'H',
    };
    return abbreviations[location] || location || '-';
  };
  
  const unitYear = parseInt(unit.era) || 3025;
  
  return (
    <div className="equipment-tab bg-slate-900 text-slate-100 min-h-screen p-4">
      <div className="grid grid-cols-3 gap-4">
        {/* Left Column - Current Loadout (1/3 width) */}
        <div className="col-span-1">
          <div className="bg-slate-800 border border-slate-600 rounded">
            <div className="bg-slate-700 border-b border-slate-600 px-3 py-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Current Loadout</h3>
                <button
                  onClick={() => {
                    // Remove all equipment
                    mountedEquipment.forEach(placement => {
                      removeEquipment(placement.id as any);
                    });
                  }}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium"
                  disabled={readOnly || mountedEquipment.length === 0}
                >
                  Remove All Equipment
                </button>
              </div>
              {mountedEquipment.length > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  <span className="text-yellow-500">💡 Tip:</span> Click any equipment item to remove it
                </p>
              )}
            </div>
            <div className="p-3">
              {/* Headers */}
              <div className="grid grid-cols-7 gap-1 text-xs font-medium text-slate-400 border-b border-slate-600 pb-2 mb-2">
                <div className="col-span-2">Name</div>
                <div className="text-center">Tons</div>
                <div className="text-center">Crits</div>
                <div className="text-center">Heat</div>
                <div className="text-center">Loc</div>
                <div className="text-center">Size</div>
              </div>
              
              {/* Current equipment list */}
              {mountedEquipment.length === 0 ? (
                <div className="text-center text-slate-500 py-4 text-sm">
                  No equipment loaded
                </div>
              ) : (
                <div className="space-y-1">
                  {mountedEquipment.map((placement) => {
                    const equipment = placement.equipment;
                    const isUnallocated = !placement.location || placement.location === '';
                    
                    // Get display values
                    let displayWeight = equipment.weight;
                    let displayCrits = equipment.space || 0;
                    
                    if (equipment.id === 'jump-jet') {
                      displayWeight = getJumpJetWeight(unit.mass);
                    } else if (equipment.id === 'hatchet') {
                      const specs = getHatchetSpecs(unit.mass);
                      displayWeight = specs.weight;
                      displayCrits = specs.crits;
                    } else if (equipment.id === 'sword') {
                      const specs = getSwordSpecs(unit.mass);
                      displayWeight = specs.weight;
                      displayCrits = specs.crits;
                    }
                    
                    return (
                      <div
                        key={placement.id}
                        className={`grid grid-cols-7 gap-1 text-xs hover:bg-red-900 hover:bg-opacity-30 px-1 py-1 rounded cursor-pointer transition-colors group ${
                          isUnallocated ? 'text-yellow-500' : ''
                        }`}
                        onClick={() => handleRemoveEquipment(placement.id)}
                        title="Click to remove this equipment"
                      >
                        <div className="col-span-2 truncate flex items-center">
                          <span className="group-hover:text-red-400 transition-colors">{equipment.name}</span>
                          <span className="ml-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs">✕</span>
                        </div>
                        <div className="text-center">{displayWeight}</div>
                        <div className="text-center">{displayCrits}</div>
                        <div className="text-center">{equipment.heat || 0}</div>
                        <div className="text-center" title={placement.location || 'Unallocated'}>{abbreviateLocation(placement.location)}</div>
                        <div className="text-center">{displayCrits}</div>
                      </div>
                    );
                  })}
                  
                  {/* Totals */}
                  <div className="border-t border-slate-600 pt-2 mt-2">
                    <div className="grid grid-cols-7 gap-1 text-xs font-medium">
                      <div className="col-span-2">Total:</div>
                      <div className="text-center">{totalWeight.toFixed(1)}</div>
                      <div className="text-center">{totalCrits}</div>
                      <div className="text-center">{totalHeat}</div>
                      <div className="text-center">-</div>
                      <div className="text-center">-</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Equipment Database (2/3 width) */}
        <div className="col-span-2">
          <div className="bg-slate-800 border border-slate-600 rounded">
            <div className="bg-slate-700 border-b border-slate-600 px-3 py-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center">
                  <span className="mr-2">Equipment Database</span>
                  <span className="text-xs text-yellow-500">
                    Note: Ctrl-Click a filter to add it to the selected filters.
                  </span>
                </h3>
              </div>
            </div>

            {/* Category filters - More compact */}
            <div className="px-3 py-1 border-b border-slate-600 flex items-center space-x-0.5 overflow-x-auto">
              <span className="text-xs font-medium text-slate-400 flex-shrink-0 mr-1">Show:</span>
              {EQUIPMENT_CATEGORIES.concat(['Show All']).map(category => (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className={`px-1 py-0.5 text-xs rounded whitespace-nowrap flex-shrink-0 ${
                    (selectedCategory === category) || (filter.showAll && category === 'Show All')
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Hide filters */}
            <div className="px-3 py-2 border-b border-slate-600 flex items-center space-x-4">
              <span className="text-xs font-medium text-slate-400">Hide:</span>
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={filter.hidePrototype}
                  onChange={(e) => setFilter(prev => ({ ...prev, hidePrototype: e.target.checked }))}
                  className="mr-1"
                />
                Prototype
              </label>
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={filter.hideOneShot}
                  onChange={(e) => setFilter(prev => ({ ...prev, hideOneShot: e.target.checked }))}
                  className="mr-1"
                />
                One-Shot
              </label>
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={filter.hideTorpedoes}
                  onChange={(e) => setFilter(prev => ({ ...prev, hideTorpedoes: e.target.checked }))}
                  className="mr-1"
                />
                Torpedoes
              </label>
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={filter.hideAmmoWithoutWeapon}
                  onChange={(e) => setFilter(prev => ({ ...prev, hideAmmoWithoutWeapon: e.target.checked }))}
                  className="mr-1"
                />
                Ammo w/o Weapon
              </label>
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={filter.hideUnavailable}
                  onChange={(e) => setFilter(prev => ({ ...prev, hideUnavailable: e.target.checked }))}
                  className="mr-1"
                />
                <span className={filter.hideUnavailable ? 'text-yellow-500' : ''}>
                  Unavailable ({unitYear})
                </span>
              </label>
            </div>

            {/* Search and controls */}
            <div className="px-3 py-2 border-b border-slate-600 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Text Filter:</span>
                <input
                  type="text"
                  value={filter.searchText}
                  onChange={(e) => setFilter(prev => ({ ...prev, searchText: e.target.value }))}
                  className="px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded w-32"
                  placeholder="Search..."
                />
                <button
                  onClick={() => setFilter(prev => ({ ...prev, searchText: '' }))}
                  className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                >
                  X
                </button>
              </div>
              <button
                className="px-3 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
              >
                Switch Table Columns
              </button>
            </div>

            {/* Equipment table */}
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-700 text-slate-300 border-b border-slate-600">
                    <th className="px-1 py-1 text-center w-8"></th>
                    <th 
                      className="px-2 py-1 text-left cursor-pointer hover:bg-slate-600"
                      onClick={() => handleSort('name')}
                    >
                      Name {sortColumn === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th 
                      className="px-2 py-1 text-center cursor-pointer hover:bg-slate-600"
                      onClick={() => handleSort('damage')}
                    >
                      Damage {sortColumn === 'damage' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th 
                      className="px-2 py-1 text-center cursor-pointer hover:bg-slate-600"
                      onClick={() => handleSort('heat')}
                    >
                      Heat {sortColumn === 'heat' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="px-2 py-1 text-center">Min R</th>
                    <th className="px-2 py-1 text-center">Range</th>
                    <th className="px-2 py-1 text-center">Shots</th>
                    <th className="px-2 py-1 text-center">Base</th>
                    <th 
                      className="px-2 py-1 text-center cursor-pointer hover:bg-slate-600"
                      onClick={() => handleSort('bv')}
                    >
                      BV {sortColumn === 'bv' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th 
                      className="px-2 py-1 text-center cursor-pointer hover:bg-slate-600"
                      onClick={() => handleSort('weight')}
                    >
                      Weight {sortColumn === 'weight' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th 
                      className="px-2 py-1 text-center cursor-pointer hover:bg-slate-600"
                      onClick={() => handleSort('crits')}
                    >
                      Crit {sortColumn === 'crits' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="px-2 py-1 text-left">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEquipment.map((item: EquipmentItem) => {
                    // Calculate actual weight for variable items
                    let displayWeight = item.weight;
                    let displayCrits = item.crits;
                    let displayDamage = item.damage;
                    
                    if (item.id === 'jump-jet') {
                      displayWeight = getJumpJetWeight(unit.mass);
                    } else if (item.id === 'hatchet') {
                      const specs = getHatchetSpecs(unit.mass);
                      displayWeight = specs.weight;
                      displayCrits = specs.crits;
                      displayDamage = specs.damage;
                    } else if (item.id === 'sword') {
                      const specs = getSwordSpecs(unit.mass);
                      displayWeight = specs.weight;
                      displayCrits = specs.crits;
                      displayDamage = specs.damage;
                    }
                    
                    const canAdd = remainingTonnage >= displayWeight;
                    
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-slate-700 hover:bg-slate-700 ${
                          item.year > unitYear ? 'text-slate-500' : ''
                        }`}
                      >
                        <td className="px-1 py-0.5 text-center">
                          <button
                            onClick={() => handleAddEquipment(item)}
                            className="w-6 h-6 flex items-center justify-center text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            disabled={readOnly || !canAdd}
                            title={canAdd ? `Add ${item.name}` : 'Insufficient tonnage'}
                          >
                            +
                          </button>
                        </td>
                        <td className="px-2 py-1">
                          <span className="hover:text-blue-400 cursor-help">{item.name}</span>
                        </td>
                        <td className="px-2 py-1 text-center">{displayDamage || '-'}</td>
                        <td className="px-2 py-1 text-center">{item.heat || '-'}</td>
                        <td className="px-2 py-1 text-center">{item.minRange || '0'}</td>
                        <td className="px-2 py-1 text-center">{item.range || '-'}</td>
                        <td className="px-2 py-1 text-center">{item.shots || '-'}</td>
                        <td className="px-2 py-1 text-center">{item.techBase}</td>
                        <td className="px-2 py-1 text-center">{item.bv || '-'}</td>
                        <td className="px-2 py-1 text-center">{displayWeight}</td>
                        <td className="px-2 py-1 text-center">{displayCrits}</td>
                        <td className="px-2 py-1">{item.year}, {item.techLevel}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
