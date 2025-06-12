import React, { useState, useMemo, useCallback } from 'react';
import { EditorComponentProps } from '../../../types/editor';
import { FullEquipment } from '../../../types';
import { EQUIPMENT_DATABASE, EquipmentItem } from '../../../utils/equipmentData';
import EquipmentTooltip from '../equipment/EquipmentTooltip';
import { hasCompatibleWeapon, getAmmoWarning } from '../../../utils/ammoMapping';

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

interface DragItem {
  type: 'equipment';
  id: string;
  source: 'database' | 'loadout' | 'unallocated';
}

const EquipmentTab: React.FC<EditorComponentProps> = ({
  unit,
  onUnitChange,
  validationErrors = [],
  readOnly = false,
}) => {
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
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showColumnSwitcher, setShowColumnSwitcher] = useState(false);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Get unit year for filtering
  const unitYear = parseInt(unit.era || '3025');

  // Current loadout
  const currentLoadout = unit.data?.weapons_and_equipment || [];

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

  // Filter equipment based on year and other criteria
  const filteredEquipment = useMemo(() => {
    const filtered = EQUIPMENT_DATABASE.filter((item: EquipmentItem) => {
      // Year constraint
      if (filter.hideUnavailable && item.year > unitYear) return false;
      
      // Category filter
      if (!filter.showAll && filter.categories.length > 0 && !filter.categories.includes(item.category)) {
        return false;
      }
      
      // Hide filters
      if (filter.hidePrototype && item.isPrototype) return false;
      if (filter.hideOneShot && item.isOneShot) return false;
      if (filter.hideTorpedoes && item.isTorpedo) return false;
      if (filter.hideAmmoWithoutWeapon && item.isAmmo) {
        const loadedWeaponNames = currentLoadout
          .filter(e => e.item_type !== 'ammo')
          .map(e => e.item_name);
        if (!hasCompatibleWeapon(item.name, loadedWeaponNames)) return false;
      }
      
      // Search filter
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        return item.name.toLowerCase().includes(searchLower);
      }
      
      return true;
    });
    
    return sortEquipment(filtered);
  }, [filter, unitYear, currentLoadout, sortEquipment]);

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

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, item: DragItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop on unallocated area
  const handleDropOnUnallocated = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.source === 'unallocated') return;
    
    if (draggedItem.source === 'loadout') {
      // Move from loadout to unallocated
      const itemIndex = parseInt(draggedItem.id);
      const updatedEquipment = [...currentLoadout];
      
      if (itemIndex >= 0 && itemIndex < updatedEquipment.length) {
        updatedEquipment[itemIndex] = {
          ...updatedEquipment[itemIndex],
          location: 'Unallocated'
        };
        
        const updatedUnit = {
          ...unit,
          data: {
            ...unit.data,
            weapons_and_equipment: updatedEquipment,
          },
        };
        onUnitChange(updatedUnit);
      }
    }
    
    setDraggedItem(null);
  };

  // Handle drop on current loadout
  const handleDropOnLoadout = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedItem) return;
    
    if (draggedItem.source === 'database') {
      // Add from database
      handleAddSingleEquipment(draggedItem.id);
    } else if (draggedItem.source === 'unallocated') {
      // Move from unallocated to loadout
      const itemIndex = parseInt(draggedItem.id);
      const updatedEquipment = [...currentLoadout];
      
      if (itemIndex >= 0 && itemIndex < updatedEquipment.length) {
        updatedEquipment[itemIndex] = {
          ...updatedEquipment[itemIndex],
          location: 'CT' // Default to Center Torso
        };
        
        const updatedUnit = {
          ...unit,
          data: {
            ...unit.data,
            weapons_and_equipment: updatedEquipment,
          },
        };
        onUnitChange(updatedUnit);
      }
    }
    
    setDraggedItem(null);
  };

  // Handle add single equipment item
  const handleAddSingleEquipment = (itemId: string) => {
    const item = EQUIPMENT_DATABASE.find((e: EquipmentItem) => e.id === itemId);
    if (!item) return;

    const newEquipment = {
      item_name: item.name,
      item_type: item.isAmmo ? 'ammo' : 'weapon' as string,
      location: 'Unallocated',
      tech_base: item.techBase as 'IS' | 'Clan',
    };

    const updatedUnit = {
      ...unit,
      data: {
        ...unit.data,
        weapons_and_equipment: [
          ...(unit.data?.weapons_and_equipment || []),
          newEquipment,
        ],
      },
    };
    
    onUnitChange(updatedUnit);
  };

  // Handle remove equipment
  const handleRemoveEquipment = (index: number) => {
    const updatedEquipment = [...currentLoadout];
    updatedEquipment.splice(index, 1);
    
    const updatedUnit = {
      ...unit,
      data: {
        ...unit.data,
        weapons_and_equipment: updatedEquipment,
      },
    };
    
    onUnitChange(updatedUnit);
  };

  // Calculate totals
  const totalWeight = currentLoadout.reduce((sum, item) => {
    const equipment = EQUIPMENT_DATABASE.find((e: EquipmentItem) => e.name === item.item_name);
    return sum + (equipment?.weight || 0);
  }, 0);

  const totalCrits = currentLoadout.reduce((sum, item) => {
    const equipment = EQUIPMENT_DATABASE.find((e: EquipmentItem) => e.name === item.item_name);
    return sum + (equipment?.crits || 0);
  }, 0);

  const totalHeat = currentLoadout.reduce((sum, item) => {
    const equipment = EQUIPMENT_DATABASE.find((e: EquipmentItem) => e.name === item.item_name);
    return sum + (equipment?.heat || 0);
  }, 0);

  // Get unallocated equipment
  const unallocatedEquipment = currentLoadout.filter(item => item.location === 'Unallocated');
  const allocatedEquipment = currentLoadout.filter(item => item.location !== 'Unallocated');

  return (
    <div className="equipment-tab bg-slate-900 text-slate-100 min-h-screen p-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Left Column - Current Loadout and Unallocated */}
        <div className="space-y-4">
          {/* Current Load out */}
          <div 
            className="bg-slate-800 border border-slate-600 rounded"
            onDragOver={handleDragOver}
            onDrop={handleDropOnLoadout}
          >
            <div className="bg-slate-700 border-b border-slate-600 px-3 py-2 flex justify-between items-center">
              <h3 className="text-sm font-medium">Current Load out</h3>
              <div className="space-x-2">
                <button
                  onClick={() => {
                    // Only remove allocated equipment
                    const updatedUnit = {
                      ...unit,
                      data: {
                        ...unit.data,
                        weapons_and_equipment: unallocatedEquipment,
                      },
                    };
                    onUnitChange(updatedUnit);
                  }}
                  className="px-2 py-1 text-xs bg-slate-700 text-slate-100 rounded hover:bg-slate-600"
                  disabled={readOnly || allocatedEquipment.length === 0}
                >
                  Remove
                </button>
                <button
                  onClick={() => {
                    const updatedUnit = {
                      ...unit,
                      data: {
                        ...unit.data,
                        weapons_and_equipment: [],
                      },
                    };
                    onUnitChange(updatedUnit);
                  }}
                  className="px-2 py-1 text-xs bg-slate-700 text-slate-100 rounded hover:bg-slate-600"
                  disabled={readOnly}
                >
                  Remove All
                </button>
              </div>
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
              {allocatedEquipment.length === 0 ? (
                <div className="text-center text-slate-500 py-4 text-sm">
                  No equipment loaded
                </div>
              ) : (
                <div className="space-y-1">
                  {allocatedEquipment.map((item, index) => {
                    const equipment = EQUIPMENT_DATABASE.find((e: EquipmentItem) => e.name === item.item_name);
                    const originalIndex = currentLoadout.findIndex(i => i === item);
                    return (
                      <div
                      key={index}
                      className={`grid grid-cols-7 gap-1 text-xs hover:bg-slate-700 px-1 py-1 rounded cursor-move ${
                        draggedItem?.id === originalIndex.toString() ? 'opacity-50' : ''
                      }`}
                      draggable={!readOnly}
                      onDragStart={(e) => handleDragStart(e, {
                        type: 'equipment',
                        id: originalIndex.toString(),
                        source: 'loadout'
                      })}
                      onClick={() => handleRemoveEquipment(originalIndex)}
                    >
                        <div className="col-span-2 truncate">{item.item_name}</div>
                        <div className="text-center">{equipment?.weight || 0}</div>
                        <div className="text-center">{equipment?.crits || 0}</div>
                        <div className="text-center">{equipment?.heat || 0}</div>
                        <div className="text-center">{item.location || '-'}</div>
                        <div className="text-center">{equipment?.crits || 0}</div>
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

          {/* Unallocated Equipment */}
          <div 
            className="bg-slate-800 border border-slate-600 rounded"
            onDragOver={handleDragOver}
            onDrop={handleDropOnUnallocated}
          >
            <div className="bg-slate-700 border-b border-slate-600 px-3 py-2">
              <h3 className="text-sm font-medium">Unallocated Equipment</h3>
            </div>
            <div className="p-3 min-h-[100px]">
              {unallocatedEquipment.length === 0 ? (
                <div className="text-center text-slate-500 py-4 text-sm">
                  No unallocated equipment
                </div>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {unallocatedEquipment.map((item, index) => {
                    const equipment = EQUIPMENT_DATABASE.find((e: EquipmentItem) => e.name === item.item_name);
                    const actualIndex = currentLoadout.findIndex(eq => eq === item);
                    return (
                      <div
                        key={index}
                        draggable={!readOnly}
                        onDragStart={(e) => handleDragStart(e, {
                          type: 'equipment',
                          id: actualIndex.toString(),
                          source: 'unallocated'
                        })}
                        className={`flex items-center justify-between text-xs hover:bg-slate-700 px-2 py-1 rounded cursor-move ${
                          draggedItem?.id === actualIndex.toString() && draggedItem?.source === 'unallocated' ? 'opacity-50' : ''
                        }`}
                      >
                        <span className="truncate flex-1">{item.item_name}</span>
                        <span className="text-slate-400 ml-2">
                          {equipment?.weight || 0}t / {equipment?.crits || 0} slots
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        
        {/* Right Column - Equipment Database */}
        <div>
          <div className="bg-slate-800 border border-slate-600 rounded">
            <div className="bg-slate-700 border-b border-slate-600 px-3 py-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center">
                  <span className="mr-2">Equipment Database</span>
                  <span className="text-xs text-yellow-500">
                    Note: Ctrl-Click a filter to add it to the selected filters.
                  </span>
                </h3>
                <button
                  onClick={() => window.open('/equipment-help', '_blank')}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Got it!
                </button>
              </div>
            </div>

            {/* Category filters - More compact */}
            <div className="px-3 py-1 border-b border-slate-600 flex items-center space-x-0.5 overflow-x-auto">
              <span className="text-xs font-medium text-slate-400 flex-shrink-0 mr-1">Show:</span>
              {['Energy', 'Ballistic', 'Missile', 'Artillery', 'Physical', 'Ammo', 'Other', 'Show All'].map(category => (
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
                onClick={() => setShowColumnSwitcher(!showColumnSwitcher)}
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
                  {filteredEquipment.map((item: EquipmentItem) => {
                    const loadedWeaponNames = currentLoadout
                      .filter(e => e.item_type !== 'ammo')
                      .map(e => e.item_name);
                    const ammoWarning = item.isAmmo ? getAmmoWarning(item.name, loadedWeaponNames) : null;
                    
                    return (
                      <tr
                        key={item.id}
                        draggable={!readOnly}
                        onDragStart={(e) => handleDragStart(e, {
                          type: 'equipment',
                          id: item.id,
                          source: 'database'
                        })}
                        className={`border-b border-slate-700 hover:bg-slate-700 cursor-move ${
                          item.year > unitYear ? 'text-slate-500' : ''
                        } ${draggedItem?.id === item.id && draggedItem?.source === 'database' ? 'opacity-50' : ''}`}
                      >
                      <td className="px-1 py-0.5 text-center">
                        <button
                          onClick={() => handleAddSingleEquipment(item.id)}
                          className="w-6 h-6 flex items-center justify-center text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          disabled={readOnly}
                          title={`Add ${item.name}`}
                        >
                          +
                        </button>
                      </td>
                      <td className="px-2 py-1">
                        <EquipmentTooltip 
                          equipment={{
                            name: item.name,
                            type: item.category,
                            damage: item.damage,
                            heat: item.heat,
                            minRange: item.minRange,
                            weight: item.weight,
                            crits: item.crits,
                            bv: item.bv,
                            techBase: item.techBase,
                            availability: `Year ${item.year}`,
                          }}
                        >
                          <span className="hover:text-blue-400 cursor-help">{item.name}</span>
                        </EquipmentTooltip>
                      </td>
                      <td className="px-2 py-1 text-center">{item.damage}</td>
                      <td className="px-2 py-1 text-center">{item.heat}</td>
                      <td className="px-2 py-1 text-center">{item.minRange}</td>
                      <td className="px-2 py-1 text-center">{item.range}</td>
                      <td className="px-2 py-1 text-center">{item.shots}</td>
                      <td className="px-2 py-1 text-center">{item.base}</td>
                      <td className="px-2 py-1 text-center">{item.bv}</td>
                      <td className="px-2 py-1 text-center">{item.weight}</td>
                      <td className="px-2 py-1 text-center">{item.crits}</td>
                      <td className="px-2 py-1">{item.reference}</td>
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
};

export default EquipmentTab;
