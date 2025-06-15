import React, { useState } from 'react';
import { EditableUnit } from '../types/editor';
import { initializeSystemComponents } from '../utils/componentSync';
import { syncEngineChange } from '../utils/componentSync';
import { CriticalSlot } from '../types/systemComponents';
import { initializeCriticalSlots } from '../utils/componentRules';

const TestEngineChange: React.FC = () => {
  // Create a test unit
  const createTestUnit = (): EditableUnit => {
    const unit: EditableUnit = {
      id: 'test-unit',
      chassis: 'Test',
      model: 'Mech',
      mul_id: 'test',
      mass: 50,
      era: '3025',
      tech_base: 'Inner Sphere',
      rules_level: 1,
      source: 'Test',
      data: {
        chassis: 'Test',
        model: 'Mech',
        mul_id: 'test',
        config: 'Biped',
        tech_base: 'Inner Sphere',
        era: '3025',
        source: 'Test',
        rules_level: 1,
        mass: 50,
        engine: { type: 'Standard', rating: 200 },
        gyro: { type: 'Standard' },
        structure: { type: 'Standard' },
        heat_sinks: { type: 'Single', count: 10 },
        weapons_and_equipment: [
          { item_name: 'AC/10', item_type: 'weapon' as const, location: 'Right Torso', tech_base: 'IS' },
          { item_name: 'LRM 20', item_type: 'weapon' as const, location: 'Left Torso', tech_base: 'IS' },
          { item_name: 'SRM 6', item_type: 'weapon' as const, location: 'Center Torso', tech_base: 'IS' },
        ],
        movement: { walk_mp: 4, run_mp: 6, jump_mp: 0 },
        armor: {
          type: 'Standard',
          total_armor_points: 100,
          locations: []
        },
        criticals: []
      },
      armorAllocation: {},
      equipmentPlacements: [],
      criticalSlots: [],
      fluffData: {},
      selectedQuirks: [],
      validationState: { isValid: true, errors: [], warnings: [] },
      editorMetadata: { lastModified: new Date(), isDirty: false, version: '1.0.0' }
    };
    
    // Initialize system components
    unit.systemComponents = initializeSystemComponents(unit);
    
    // Initialize critical allocations
    unit.criticalAllocations = initializeCriticalSlots(unit.systemComponents, unit.mass);
    
    // Add some test equipment to center torso
    if (unit.criticalAllocations['Center Torso']) {
      // Place AC/10 in slots 10-11 (after gyro)
      unit.criticalAllocations['Center Torso'][10] = {
        index: 10,
        name: 'AC/10',
        type: 'equipment',
        isFixed: false,
        isManuallyPlaced: true
      };
      unit.criticalAllocations['Center Torso'][11] = {
        index: 11,
        name: 'AC/10',
        type: 'equipment',
        isFixed: false,
        isManuallyPlaced: true
      };
    }
    
    if (unit.criticalAllocations['Left Torso']) {
      // Place LRM 20 in slots 0-4
      for (let i = 0; i < 5; i++) {
        unit.criticalAllocations['Left Torso'][i] = {
          index: i,
          name: 'LRM 20',
          type: 'equipment',
          isFixed: false,
          isManuallyPlaced: true
        };
      }
    }
    
    if (unit.criticalAllocations['Right Torso']) {
      // Place SRM 6 in slots 0-1
      for (let i = 0; i < 2; i++) {
        unit.criticalAllocations['Right Torso'][i] = {
          index: i,
          name: 'SRM 6',
          type: 'equipment',
          isFixed: false,
          isManuallyPlaced: true
        };
      }
    }
    
    return unit;
  };
  
  const [unit, setUnit] = useState<EditableUnit>(createTestUnit());
  const [selectedEngine, setSelectedEngine] = useState('Standard');
  
  const handleEngineChange = (engineType: string) => {
    console.log('=== Engine Change Start ===');
    console.log('Changing engine from:', unit.systemComponents?.engine.type, 'to:', engineType);
    console.log('Current critical allocations:', JSON.stringify(unit.criticalAllocations, null, 2));
    
    setSelectedEngine(engineType);
    
    // Apply the engine change
    const updates = syncEngineChange(unit, engineType as any, unit.systemComponents?.engine.rating || 200);
    
    console.log('Updates from syncEngineChange:', updates);
    console.log('New critical allocations:', JSON.stringify(updates.criticalAllocations, null, 2));
    
    // Apply updates to unit
    const updatedUnit = {
      ...unit,
      ...updates,
      data: {
        ...unit.data,
        ...updates.data
      }
    };
    
    console.log('Updated unit:', updatedUnit);
    console.log('=== Engine Change End ===');
    setUnit(updatedUnit);
  };
  
  // Format critical slots for display
  const formatCriticalSlot = (slot: CriticalSlot) => {
    if (!slot || slot.name === '-Empty-') return '-Empty-';
    return slot.name;
  };
  
  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">Engine Change Test</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Engine Type</label>
        <select
          value={selectedEngine}
          onChange={(e) => handleEngineChange(e.target.value)}
          className="w-64 px-3 py-2 bg-slate-700 border border-slate-600 rounded"
        >
          <option value="Standard">Standard</option>
          <option value="XL">XL</option>
          <option value="Light">Light</option>
          <option value="XXL">XXL</option>
          <option value="Compact">Compact</option>
        </select>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">System Components</h2>
        <div className="bg-slate-800 p-4 rounded">
          <pre className="text-sm">{JSON.stringify(unit.systemComponents, null, 2)}</pre>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Critical Allocations</h2>
        {unit.criticalAllocations && (
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(unit.criticalAllocations).map(([location, slots]) => (
              <div key={location} className="bg-slate-800 p-4 rounded">
                <h3 className="font-semibold mb-2">{location}</h3>
                <div className="space-y-1">
                  {(slots as CriticalSlot[]).map((slot, index) => (
                    <div key={index} className="text-sm">
                      Slot {index}: {formatCriticalSlot(slot)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Displaced Equipment</h2>
        <div className="bg-slate-800 p-4 rounded">
          {unit.data?.weapons_and_equipment?.filter(eq => !eq.location).map((eq, index) => (
            <div key={index} className="text-sm">
              {eq.item_name} - Unallocated
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestEngineChange;
