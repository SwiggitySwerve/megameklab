import React, { useState, useMemo } from 'react';
import { EditorComponentProps } from '../../../types/editor';

// Quirk definitions
const POSITIVE_QUIRKS = [
  'Animalistic Appearance',
  'Anti-Aircraft Targeting',
  'Battle Computer',
  'Battle Fists (LA)',
  'Battle Fists (RA)',
  'Combat Computer',
  'Command Mek',
  'Compact Mek',
  'Cowl',
  'Directional Torso Mount',
  'Distracting',
  'Easy to Maintain',
  'Easy to Pilot',
  'Extended Torso Twist',
  'Fast Reload',
  'Fine Manipulators',
  'Good Reputation (1)',
  'Good Reputation (2)',
  'Hyper-Extending Actuators',
  'Improved Communications',
  'Improved Life Support',
  'Improved Sensors',
  'Improved Targeting (Long)',
  'Improved Targeting (Medium)',
  'Improved Targeting (Short)',
  'Multi-Trac',
  'Narrow/Low Profile',
  'Nimble Jumper',
  'Overhead Arms',
  'Protected Actuators',
  'Reinforced Legs',
  'Rugged (1 Point)',
  'Rugged (2 Point)',
  'Searchlight',
  'Stable',
  'Ubiquitous (Clans)',
  'Ubiquitous (Inner Sphere)',
  'Variable Range Targeting (long)',
  'Variable Range Targeting (short)',
  'Vestigial Hands (Left)',
  'Vestigial Hands (Right)',
];

const NEGATIVE_QUIRKS = [
  'Bad Reputation (Clan)',
  'Bad Reputation (Inner Sphere)',
  'Cramped Cockpit',
  'Difficult Ejection',
  'Difficult to Maintain',
  'EM Interference (Whole Unit)',
  'Exposed Actuators',
  'Flawed Cooling System',
  'Hard to Pilot',
  'Illegal Design',
  'Low-Mounted Arms',
  'No Ejection System',
  'No Torso Twist (Legacy)',
  'No/Minimal Arms',
  'Non-Standard Parts',
  'Obsolete',
  'Poor Life Support',
  'Poor Performance',
  'Poor Sealing',
  'Poor Targeting (Long)',
  'Poor Targeting (Medium)',
  'Poor Targeting (Short)',
  'Poor Workmanship',
  'Prototype',
  'Ramshackle',
  'Sensor Ghosts',
  'Susceptible to Centurion Weapon System',
  'Unbalanced',
  'Weak Head Armor (1)',
  'Weak Head Armor (2)',
  'Weak Head Armor (3)',
  'Weak Head Armor (4)',
  'Weak Head Armor (5)',
  'Weak Legs',
];

const WEAPON_QUIRKS = [
  { id: 'accurate_weapon', name: 'Accurate Weapon' },
  { id: 'ammo_feed_problems', name: 'Ammo Feed Problems' },
  { id: 'directional_torso_weapon', name: 'Directional Torso Mounted Weapon' },
  { id: 'exposed_weapon_linkage', name: 'Exposed Weapon Linkage' },
  { id: 'fast_reload', name: 'Fast Reload' },
  { id: 'improved_cooling_jacket', name: 'Improved Cooling Jacket' },
  { id: 'inaccurate_weapon', name: 'Inaccurate Weapon' },
  { id: 'jettison_capable', name: 'Jettison-Capable Weapon' },
  { id: 'misrepaired_weapon', name: 'Misrepaired Weapon' },
  { id: 'misreplaced_weapon', name: 'Misreplaced Weapon' },
  { id: 'modular_weapon', name: 'Modular Weapon' },
  { id: 'non_functional', name: 'Non-Functional' },
  { id: 'poor_cooling_jacket', name: 'Poor Cooling Jacket' },
  { id: 'stabilized_weapon', name: 'Stabilized Weapon' },
];

const QuirksTab: React.FC<EditorComponentProps> = ({
  unit,
  onUnitChange,
  validationErrors = [],
  readOnly = false,
}) => {
  const [searchPositive, setSearchPositive] = useState('');
  const [searchNegative, setSearchNegative] = useState('');
  const [selectedWeapon, setSelectedWeapon] = useState<string>('');
  const [selectedWeaponQuirk, setSelectedWeaponQuirk] = useState<string>('');

  // Get current quirks from unit
  const positiveQuirks = unit.data?.quirks?.positive || [];
  const negativeQuirks = unit.data?.quirks?.negative || [];
  const weaponQuirks = unit.data?.quirks?.weapons || [];

  // Filter quirks based on search
  const filteredPositiveQuirks = useMemo(() => {
    if (!searchPositive) return POSITIVE_QUIRKS;
    const searchLower = searchPositive.toLowerCase();
    return POSITIVE_QUIRKS.filter(quirk => 
      quirk.toLowerCase().includes(searchLower)
    );
  }, [searchPositive]);

  const filteredNegativeQuirks = useMemo(() => {
    if (!searchNegative) return NEGATIVE_QUIRKS;
    const searchLower = searchNegative.toLowerCase();
    return NEGATIVE_QUIRKS.filter(quirk => 
      quirk.toLowerCase().includes(searchLower)
    );
  }, [searchNegative]);

  // Get available weapons for weapon quirks
  const availableWeapons = useMemo(() => {
    return (unit.data?.weapons_and_equipment || [])
      .filter(item => item.item_type === 'weapon')
      .map(item => ({
        id: item.item_name,
        name: item.item_name,
        location: item.location || 'Unallocated'
      }));
  }, [unit.data?.weapons_and_equipment]);

  // Handle quirk toggle
  const handleQuirkToggle = (quirk: string, isPositive: boolean) => {
    const currentQuirks = isPositive ? positiveQuirks : negativeQuirks;
    const hasQuirk = currentQuirks.includes(quirk);
    
    const updatedQuirks = hasQuirk
      ? currentQuirks.filter(q => q !== quirk)
      : [...currentQuirks, quirk];

    const updatedUnit = {
      ...unit,
      data: {
        ...unit.data,
        quirks: {
          ...unit.data?.quirks,
          [isPositive ? 'positive' : 'negative']: updatedQuirks,
          weapons: weaponQuirks
        }
      }
    };
    
    onUnitChange(updatedUnit);
  };

  // Handle weapon quirk addition
  const handleAddWeaponQuirk = () => {
    if (!selectedWeapon || !selectedWeaponQuirk) return;

    const newWeaponQuirk = {
      weaponId: selectedWeapon,
      quirk: selectedWeaponQuirk
    };

    const updatedUnit = {
      ...unit,
      data: {
        ...unit.data,
        quirks: {
          ...unit.data?.quirks,
          positive: positiveQuirks,
          negative: negativeQuirks,
          weapons: [...weaponQuirks, newWeaponQuirk]
        }
      }
    };
    
    onUnitChange(updatedUnit);
    setSelectedWeapon('');
    setSelectedWeaponQuirk('');
  };

  // Handle weapon quirk removal
  const handleRemoveWeaponQuirk = (index: number) => {
    const updatedWeaponQuirks = weaponQuirks.filter((_, i) => i !== index);
    
    const updatedUnit = {
      ...unit,
      data: {
        ...unit.data,
        quirks: {
          ...unit.data?.quirks,
          positive: positiveQuirks,
          negative: negativeQuirks,
          weapons: updatedWeaponQuirks
        }
      }
    };
    
    onUnitChange(updatedUnit);
  };

  return (
    <div className="quirks-tab bg-slate-900 text-slate-100 min-h-screen p-4">
      <div className="grid grid-cols-2 gap-4 max-w-6xl mx-auto">
        {/* Positive Quirks */}
        <div className="bg-slate-800 border border-slate-600 rounded">
          <div className="bg-slate-700 border-b border-slate-600 px-3 py-2">
            <h3 className="text-sm font-medium">Positive Quirks</h3>
          </div>
          <div className="p-3">
            {/* Search */}
            <div className="mb-3">
              <input
                type="text"
                value={searchPositive}
                onChange={(e) => setSearchPositive(e.target.value)}
                placeholder="Search positive quirks..."
                className="w-full px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            {/* Quirk list */}
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {filteredPositiveQuirks.map(quirk => (
                <label key={quirk} className="flex items-center space-x-2 hover:bg-slate-700 px-2 py-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={positiveQuirks.includes(quirk)}
                    onChange={() => handleQuirkToggle(quirk, true)}
                    disabled={readOnly}
                    className="rounded border-slate-500 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{quirk}</span>
                </label>
              ))}
            </div>
            
            {/* Selected count */}
            <div className="mt-3 pt-3 border-t border-slate-600 text-xs text-slate-400">
              Selected: {positiveQuirks.length} quirks
            </div>
          </div>
        </div>

        {/* Negative Quirks */}
        <div className="bg-slate-800 border border-slate-600 rounded">
          <div className="bg-slate-700 border-b border-slate-600 px-3 py-2">
            <h3 className="text-sm font-medium">Negative Quirks</h3>
          </div>
          <div className="p-3">
            {/* Search */}
            <div className="mb-3">
              <input
                type="text"
                value={searchNegative}
                onChange={(e) => setSearchNegative(e.target.value)}
                placeholder="Search negative quirks..."
                className="w-full px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            {/* Quirk list */}
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {filteredNegativeQuirks.map(quirk => (
                <label key={quirk} className="flex items-center space-x-2 hover:bg-slate-700 px-2 py-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={negativeQuirks.includes(quirk)}
                    onChange={() => handleQuirkToggle(quirk, false)}
                    disabled={readOnly}
                    className="rounded border-slate-500 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm">{quirk}</span>
                </label>
              ))}
            </div>
            
            {/* Selected count */}
            <div className="mt-3 pt-3 border-t border-slate-600 text-xs text-slate-400">
              Selected: {negativeQuirks.length} quirks
            </div>
          </div>
        </div>
      </div>

      {/* Weapon-Specific Quirks */}
      <div className="mt-4 max-w-6xl mx-auto">
        <div className="bg-slate-800 border border-slate-600 rounded">
          <div className="bg-slate-700 border-b border-slate-600 px-3 py-2">
            <h3 className="text-sm font-medium">Weapon-Specific Quirks</h3>
          </div>
          <div className="p-3">
            {/* Add weapon quirk */}
            <div className="flex items-end space-x-3 mb-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-1">Weapon</label>
                <select
                  value={selectedWeapon}
                  onChange={(e) => setSelectedWeapon(e.target.value)}
                  className="w-full px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded focus:ring-1 focus:ring-blue-500"
                  disabled={readOnly || availableWeapons.length === 0}
                >
                  <option value="">Select a weapon...</option>
                  {availableWeapons.map(weapon => (
                    <option key={weapon.id} value={weapon.id}>
                      {weapon.name} ({weapon.location})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-1">Quirk</label>
                <select
                  value={selectedWeaponQuirk}
                  onChange={(e) => setSelectedWeaponQuirk(e.target.value)}
                  className="w-full px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded focus:ring-1 focus:ring-blue-500"
                  disabled={readOnly || !selectedWeapon}
                >
                  <option value="">Select a quirk...</option>
                  {WEAPON_QUIRKS.map(quirk => (
                    <option key={quirk.id} value={quirk.id}>
                      {quirk.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAddWeaponQuirk}
                disabled={readOnly || !selectedWeapon || !selectedWeaponQuirk}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50"
              >
                Add
              </button>
            </div>

            {/* Weapon quirks list */}
            {weaponQuirks.length === 0 ? (
              <div className="text-center text-slate-500 py-4 text-sm">
                No weapon-specific quirks assigned
              </div>
            ) : (
              <div className="space-y-2">
                {weaponQuirks.map((wq, index) => {
                  const weaponName = availableWeapons.find(w => w.id === wq.weaponId)?.name || wq.weaponId;
                  const quirkName = WEAPON_QUIRKS.find(q => q.id === wq.quirk)?.name || wq.quirk;
                  
                  return (
                    <div key={index} className="flex items-center justify-between bg-slate-700 px-3 py-2 rounded">
                      <div className="text-sm">
                        <span className="font-medium">{weaponName}</span>
                        <span className="text-slate-400 mx-2">•</span>
                        <span className="text-slate-300">{quirkName}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveWeaponQuirk(index)}
                        disabled={readOnly}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 max-w-6xl mx-auto bg-blue-900 bg-opacity-20 border border-blue-700 rounded p-3">
        <div className="text-xs text-blue-300">
          <div className="font-medium mb-1">Quirk Rules:</div>
          <ul className="space-y-1 list-disc list-inside">
            <li>Positive quirks provide beneficial effects like improved targeting or reduced maintenance</li>
            <li>Negative quirks impose penalties such as poor performance or exposed components</li>
            <li>Weapon quirks apply to specific weapons and can affect accuracy, heat, or reliability</li>
            <li>Some quirks may have Battle Value (BV) modifiers</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QuirksTab;
