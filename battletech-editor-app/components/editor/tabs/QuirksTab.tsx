import React, { useState, useMemo } from 'react';
import { EditorComponentProps, Quirk } from '../../../types/editor';

// Sample quirks data - would normally come from a database
const SAMPLE_QUIRKS: Quirk[] = [
  // Positive Quirks
  {
    id: 'accurate',
    name: 'Accurate',
    category: 'positive',
    cost: 2,
    description: 'This unit receives a -1 modifier to all weapon attack rolls.',
    restrictions: ['BattleMech', 'Vehicle'],
  },
  {
    id: 'battlefists',
    name: 'Battle Fists',
    category: 'positive', 
    cost: 1,
    description: 'Physical attacks with this unit\'s fists cause +1 damage.',
    restrictions: ['BattleMech'],
    incompatibleWith: ['no_arms'],
  },
  {
    id: 'command_mech',
    name: 'Command \'Mech',
    category: 'positive',
    cost: 2,
    description: 'Friendly units within 6 hexes gain +1 to initiative rolls.',
    restrictions: ['BattleMech'],
  },
  {
    id: 'difficult_eject',
    name: 'Difficult to Pilot',
    category: 'positive',
    cost: 1,
    description: 'Pilots receive +1 bonus to ejection rolls.',
    restrictions: ['BattleMech'],
  },
  {
    id: 'enhanced_sensors',
    name: 'Enhanced Sensors',
    category: 'positive',
    cost: 3,
    description: 'Extended sensor range and improved target acquisition.',
    restrictions: ['BattleMech', 'Vehicle'],
  },
  {
    id: 'improved_life_support',
    name: 'Improved Life Support',
    category: 'positive',
    cost: 1,
    description: 'Pilot can survive longer in hostile environments.',
    restrictions: ['BattleMech'],
  },
  {
    id: 'rugged',
    name: 'Rugged',
    category: 'positive',
    cost: 2,
    description: 'Receives +1 modifier to critical hit resistance rolls.',
    restrictions: ['BattleMech', 'Vehicle'],
  },

  // Negative Quirks
  {
    id: 'ammunition_feed_problem',
    name: 'Ammunition Feed Problem',
    category: 'negative',
    cost: -2,
    description: 'Ballistic weapons have increased chance of jamming.',
    restrictions: ['BattleMech', 'Vehicle'],
  },
  {
    id: 'cramped_cockpit',
    name: 'Cramped Cockpit',
    category: 'negative',
    cost: -1,
    description: 'Pilot suffers +1 penalty to all piloting rolls.',
    restrictions: ['BattleMech'],
  },
  {
    id: 'exposed_actuators',
    name: 'Exposed Actuators',
    category: 'negative',
    cost: -1,
    description: 'Actuators are more vulnerable to critical hits.',
    restrictions: ['BattleMech'],
  },
  {
    id: 'hard_pilot',
    name: 'Hard to Pilot',
    category: 'negative',
    cost: -1,
    description: 'All piloting skill rolls receive +1 difficulty modifier.',
    restrictions: ['BattleMech'],
  },
  {
    id: 'no_ejection_system',
    name: 'No Ejection System',
    category: 'negative',
    cost: -2,
    description: 'Pilot cannot eject from this unit.',
    restrictions: ['BattleMech'],
    incompatibleWith: ['difficult_eject'],
  },
  {
    id: 'poor_cooling_jacket',
    name: 'Poor Cooling Jacket',
    category: 'negative',
    cost: -1,
    description: 'Heat dissipation is reduced by 1 point per turn.',
    restrictions: ['BattleMech'],
  },
  {
    id: 'weak_head_armor',
    name: 'Weak Head Armor',
    category: 'negative',
    cost: -1,
    description: 'Head location has reduced armor protection.',
    restrictions: ['BattleMech'],
  },

  // Equipment Quirks
  {
    id: 'improved_cooling_jacket',
    name: 'Improved Cooling Jacket',
    category: 'equipment',
    cost: 1,
    description: 'Heat dissipation is increased by 1 point per turn.',
    restrictions: ['BattleMech'],
    incompatibleWith: ['poor_cooling_jacket'],
  },
  {
    id: 'reinforced_legs',
    name: 'Reinforced Legs',
    category: 'equipment',
    cost: 1,
    description: 'Leg locations receive +2 internal structure.',
    restrictions: ['BattleMech'],
  },
];

const QUIRK_CATEGORIES = [
  { id: 'all', label: 'All Quirks', icon: '🔧' },
  { id: 'positive', label: 'Positive Quirks', icon: '✅' },
  { id: 'negative', label: 'Negative Quirks', icon: '❌' },
  { id: 'equipment', label: 'Equipment Quirks', icon: '⚙️' },
];

const QuirksTab: React.FC<EditorComponentProps> = ({
  unit,
  onUnitChange,
  validationErrors = [],
  readOnly = false,
  compact = true,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filter quirks based on category and search
  const filteredQuirks = useMemo(() => {
    let quirks = SAMPLE_QUIRKS;

    // Filter by category
    if (selectedCategory !== 'all') {
      quirks = quirks.filter(quirk => quirk.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      quirks = quirks.filter(quirk => 
        quirk.name.toLowerCase().includes(search) ||
        quirk.description.toLowerCase().includes(search)
      );
    }

    return quirks;
  }, [selectedCategory, searchTerm]);

  // Calculate total quirk cost
  const totalQuirkCost = useMemo(() => {
    return (unit.selectedQuirks || []).reduce((sum, quirk) => sum + quirk.cost, 0);
  }, [unit.selectedQuirks]);

  // Check if quirk is selected
  const isQuirkSelected = (quirkId: string): boolean => {
    return (unit.selectedQuirks || []).some(quirk => quirk.id === quirkId);
  };

  // Check if quirk is compatible
  const isQuirkCompatible = (quirk: Quirk): boolean => {
    const selectedQuirks = unit.selectedQuirks || [];
    
    // Check incompatible quirks
    if (quirk.incompatibleWith) {
      const hasIncompatible = selectedQuirks.some(selected => 
        quirk.incompatibleWith!.includes(selected.id)
      );
      if (hasIncompatible) return false;
    }

    // Check if any selected quirks are incompatible with this one
    const conflictsWithSelected = selectedQuirks.some(selected => 
      selected.incompatibleWith?.includes(quirk.id)
    );
    
    return !conflictsWithSelected;
  };

  // Handle quirk selection
  const handleQuirkToggle = (quirk: Quirk) => {
    if (readOnly) return;

    const selectedQuirks = unit.selectedQuirks || [];
    const isSelected = isQuirkSelected(quirk.id);

    let updatedQuirks: Quirk[];
    if (isSelected) {
      // Remove quirk
      updatedQuirks = selectedQuirks.filter(q => q.id !== quirk.id);
    } else {
      // Add quirk if compatible
      if (isQuirkCompatible(quirk)) {
        updatedQuirks = [...selectedQuirks, quirk];
      } else {
        return; // Can't add incompatible quirk
      }
    }

    onUnitChange({
      ...unit,
      selectedQuirks: updatedQuirks,
    });
  };

  // Clear all quirks
  const handleClearAllQuirks = () => {
    if (readOnly) return;
    onUnitChange({
      ...unit,
      selectedQuirks: [],
    });
  };

  return (
    <div className="quirks-tab">
      <div className="grid grid-cols-4 gap-4 max-w-7xl">
        {/* Left Column - Categories and Search */}
        <div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Quirk Categories
            </h3>
            
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search quirks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div className="space-y-1">
              {QUIRK_CATEGORIES.map(category => {
                const isSelected = selectedCategory === category.id;
                const count = category.id === 'all' 
                  ? SAMPLE_QUIRKS.length 
                  : SAMPLE_QUIRKS.filter(q => q.category === category.id).length;

                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      isSelected
                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                        : 'hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <span className="mr-2">{category.icon}</span>
                        <span className="font-medium">{category.label}</span>
                      </span>
                      <span className="text-xs text-gray-500">{count}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Quirks Summary */}
          <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Selected Quirks
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Cost:</span>
                <span className={`font-semibold ${
                  totalQuirkCost > 0 ? 'text-green-600' : 
                  totalQuirkCost < 0 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {totalQuirkCost > 0 ? '+' : ''}{totalQuirkCost} points
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Count:</span>
                <span className="text-gray-900">{(unit.selectedQuirks || []).length}</span>
              </div>

              {(unit.selectedQuirks || []).length > 0 && (
                <div className="space-y-1">
                  {(unit.selectedQuirks || []).map(quirk => (
                    <div key={quirk.id} className="text-xs bg-gray-50 p-2 rounded">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{quirk.name}</span>
                        <span className={`${
                          quirk.cost > 0 ? 'text-green-600' : 
                          quirk.cost < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {quirk.cost > 0 ? '+' : ''}{quirk.cost}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!readOnly && (unit.selectedQuirks || []).length > 0 && (
                <button
                  onClick={handleClearAllQuirks}
                  className="w-full mt-3 px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Clear All Quirks
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Center Column - Available Quirks */}
        <div className="col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Available Quirks
              </h3>
              <div className="text-sm text-gray-500">
                {filteredQuirks.length} quirk{filteredQuirks.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredQuirks.map(quirk => {
                const isSelected = isQuirkSelected(quirk.id);
                const isCompatible = isQuirkCompatible(quirk);
                const canSelect = !isSelected && isCompatible;

                return (
                  <div
                    key={quirk.id}
                    className={`border rounded-lg p-3 transition-colors ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : !isCompatible
                        ? 'border-red-300 bg-red-50 opacity-60'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">{quirk.name}</h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            quirk.category === 'positive' ? 'bg-green-100 text-green-800' :
                            quirk.category === 'negative' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {quirk.category}
                          </span>
                          <span className={`text-sm font-semibold ${
                            quirk.cost > 0 ? 'text-green-600' : 
                            quirk.cost < 0 ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {quirk.cost > 0 ? '+' : ''}{quirk.cost}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {quirk.description}
                        </p>

                        {quirk.restrictions && quirk.restrictions.length > 0 && (
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Restrictions:</span> {quirk.restrictions.join(', ')}
                          </div>
                        )}

                        {quirk.incompatibleWith && quirk.incompatibleWith.length > 0 && (
                          <div className="text-xs text-red-600 mt-1">
                            <span className="font-medium">Incompatible with:</span> {quirk.incompatibleWith.join(', ')}
                          </div>
                        )}

                        {!isCompatible && !isSelected && (
                          <div className="text-xs text-red-600 mt-1 font-medium">
                            ⚠️ Incompatible with selected quirks
                          </div>
                        )}
                      </div>

                      {!readOnly && (
                        <button
                          onClick={() => handleQuirkToggle(quirk)}
                          disabled={!canSelect && !isSelected}
                          className={`ml-3 px-3 py-1 text-xs rounded transition-colors ${
                            isSelected
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : canSelect
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {isSelected ? 'Remove' : 'Add'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredQuirks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-lg mb-2">🔍</div>
                  <p>No quirks found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Rules and Help */}
        <div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Quirk Rules
            </h3>
            
            <div className="space-y-3 text-xs text-gray-600">
              <div>
                <div className="font-medium text-gray-700 mb-1">Positive Quirks:</div>
                <p>Beneficial traits that cost points to add. Improve unit performance in various ways.</p>
              </div>
              
              <div>
                <div className="font-medium text-gray-700 mb-1">Negative Quirks:</div>
                <p>Detrimental traits that provide points when taken. Can offset positive quirk costs.</p>
              </div>
              
              <div>
                <div className="font-medium text-gray-700 mb-1">Equipment Quirks:</div>
                <p>Special modifications or equipment enhancements that affect unit capabilities.</p>
              </div>

              <div>
                <div className="font-medium text-gray-700 mb-1">Incompatibility:</div>
                <p>Some quirks cannot be taken together. Incompatible quirks are highlighted in red.</p>
              </div>

              <div>
                <div className="font-medium text-gray-700 mb-1">Point Balance:</div>
                <p>Total quirk cost is typically limited by scenario rules or campaign guidelines.</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-600">
              <div className="font-medium mb-2">Quick Stats:</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Available Quirks:</span>
                  <span>{SAMPLE_QUIRKS.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Positive:</span>
                  <span className="text-green-600">{SAMPLE_QUIRKS.filter(q => q.category === 'positive').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Negative:</span>
                  <span className="text-red-600">{SAMPLE_QUIRKS.filter(q => q.category === 'negative').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Equipment:</span>
                  <span className="text-blue-600">{SAMPLE_QUIRKS.filter(q => q.category === 'equipment').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuirksTab;
