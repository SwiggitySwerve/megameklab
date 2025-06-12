import React, { useState } from 'react';
import Layout from '../components/common/Layout';
import EnhancedArmorDiagram from '../components/editor/armor/EnhancedArmorDiagram';
import CompactArmorAllocationPanel from '../components/editor/armor/CompactArmorAllocationPanel';
import { EditableUnit, ArmorType } from '../types/editor';

const ArmorDiagramDemoPage: React.FC = () => {
  // Create a sample unit for demonstration
  const createSampleUnit = (tonnage: number): EditableUnit => ({
    id: 'demo-unit',
    chassis: 'Demo Mech',
    model: 'DM-1A',
    mul_id: '-1',
    mass: tonnage,
    tech_base: 'Inner Sphere',
    era: '3025',
    source: 'Demo',
    rules_level: 'Standard',
    role: 'Skirmisher',
    data: {
      chassis: 'Demo Mech',
      model: 'DM-1A',
      mass: tonnage,
      tech_base: 'Inner Sphere',
      era: '3025',
      source: 'Demo',
      rules_level: 'Standard',
      engine: {
        type: 'Fusion',
        rating: 240,
      },
      structure: {
        type: 'Standard',
      },
      armor: {
        type: 'Standard',
        locations: [],
        total_armor_points: 0
      },
      heat_sinks: {
        type: 'Single',
        count: 10,
      },
      movement: {
        walk_mp: 4,
        jump_mp: 0,
      },
      weapons_and_equipment: [],
      criticals: [],
    },
    armorAllocation: {
      head: {
        front: 3,
        maxArmor: 9,
        type: {
          id: 'standard',
          name: 'Standard',
          pointsPerTon: 16,
          criticalSlots: 0,
          techLevel: 1,
          isClan: false,
          isInner: true,
        },
      },
      center_torso: {
        front: 16,
        rear: 8,
        maxArmor: Math.floor(tonnage * 0.64),
        type: {
          id: 'standard',
          name: 'Standard',
          pointsPerTon: 16,
          criticalSlots: 0,
          techLevel: 1,
          isClan: false,
          isInner: true,
        },
      },
      left_torso: {
        front: 12,
        rear: 6,
        maxArmor: Math.floor(tonnage * 0.48),
        type: {
          id: 'standard',
          name: 'Standard',
          pointsPerTon: 16,
          criticalSlots: 0,
          techLevel: 1,
          isClan: false,
          isInner: true,
        },
      },
      right_torso: {
        front: 12,
        rear: 6,
        maxArmor: Math.floor(tonnage * 0.48),
        type: {
          id: 'standard',
          name: 'Standard',
          pointsPerTon: 16,
          criticalSlots: 0,
          techLevel: 1,
          isClan: false,
          isInner: true,
        },
      },
      left_arm: {
        front: 8,
        maxArmor: Math.floor(tonnage * 0.32),
        type: {
          id: 'standard',
          name: 'Standard',
          pointsPerTon: 16,
          criticalSlots: 0,
          techLevel: 1,
          isClan: false,
          isInner: true,
        },
      },
      right_arm: {
        front: 8,
        maxArmor: Math.floor(tonnage * 0.32),
        type: {
          id: 'standard',
          name: 'Standard',
          pointsPerTon: 16,
          criticalSlots: 0,
          techLevel: 1,
          isClan: false,
          isInner: true,
        },
      },
      left_leg: {
        front: 12,
        maxArmor: Math.floor(tonnage * 0.48),
        type: {
          id: 'standard',
          name: 'Standard',
          pointsPerTon: 16,
          criticalSlots: 0,
          techLevel: 1,
          isClan: false,
          isInner: true,
        },
      },
      right_leg: {
        front: 12,
        maxArmor: Math.floor(tonnage * 0.48),
        type: {
          id: 'standard',
          name: 'Standard',
          pointsPerTon: 16,
          criticalSlots: 0,
          techLevel: 1,
          isClan: false,
          isInner: true,
        },
      },
    },
    equipmentPlacements: [],
    criticalSlots: [],
    fluffData: {},
    selectedQuirks: [],
    validationState: { isValid: true, errors: [], warnings: [] },
    editorMetadata: {
      lastModified: new Date(),
      isDirty: false,
      version: '1.0'
    }
  });

  const [tonnage, setTonnage] = useState(50);
  const [unit, setUnit] = useState<EditableUnit>(createSampleUnit(tonnage));
  const [mode, setMode] = useState<'compact' | 'normal' | 'large'>('normal');
  const [displayMode, setDisplayMode] = useState<'diagram' | 'grid' | 'hybrid'>('hybrid');

  // Handle tonnage change
  const handleTonnageChange = (newTonnage: number) => {
    setTonnage(newTonnage);
    setUnit(createSampleUnit(newTonnage));
  };

  // Handle armor changes
  const handleArmorChange = (location: string, value: number, isRear?: boolean) => {
    setUnit(prev => ({
      ...prev,
      armorAllocation: {
        ...prev.armorAllocation,
        [location]: {
          ...prev.armorAllocation[location],
          [isRear ? 'rear' : 'front']: value
        }
      }
    }));
  };

  return (
    <Layout>
      <div className="p-4 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Enhanced Armor Diagram Demo</h1>
        
        {/* Controls */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">Demo Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tonnage Control */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Mech Tonnage: {tonnage} tons
              </label>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={tonnage}
                onChange={(e) => handleTonnageChange(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>20t</span>
                <span>60t</span>
                <span>100t</span>
              </div>
            </div>

            {/* Mode Control */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Display Size
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-700 rounded"
              >
                <option value="compact">Compact</option>
                <option value="normal">Normal</option>
                <option value="large">Large</option>
              </select>
            </div>

            {/* Display Mode Control */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Display Mode
              </label>
              <select
                value={displayMode}
                onChange={(e) => setDisplayMode(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-700 rounded"
              >
                <option value="diagram">Diagram Only</option>
                <option value="grid">Grid Only</option>
                <option value="hybrid">Hybrid (Diagram + Rear)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Diagram Containers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Normal Container */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Standard Container</h3>
            <div className="relative bg-slate-900 rounded" style={{ height: '500px' }}>
              <EnhancedArmorDiagram
                unit={unit}
                armorAllocation={unit.armorAllocation}
                onArmorChange={handleArmorChange}
                mode={mode}
                displayMode={displayMode}
              />
            </div>
          </div>

          {/* Narrow Container */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Narrow Container (Sidebar)</h3>
            <div className="relative bg-slate-900 rounded" style={{ width: '300px', height: '400px' }}>
              <EnhancedArmorDiagram
                unit={unit}
                armorAllocation={unit.armorAllocation}
                onArmorChange={handleArmorChange}
                mode="compact"
                displayMode={displayMode}
              />
            </div>
          </div>
        </div>

        {/* Features Showcase */}
        <div className="bg-slate-800 rounded-lg p-4 mt-6">
          <h2 className="text-xl font-semibold mb-4">Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2 text-blue-400">Interactive Features</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>• Click on any location to increment armor by 1</li>
                <li>• Double-click armor values for direct input</li>
                <li>• Color-coded armor levels (red/yellow/green)</li>
                <li>• Hover effects for better visibility</li>
                <li>• Auto-allocation with multiple patterns</li>
                <li>• Maximize armor button for quick setup</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-2 text-green-400">Space Efficiency</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>• Container-aware scaling</li>
                <li>• Compact mode for sidebars</li>
                <li>• Inline editing reduces UI clutter</li>
                <li>• Progress bar instead of text fields</li>
                <li>• Floating action buttons</li>
                <li>• Responsive breakpoints</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Compact Armor Allocation Panel Demo */}
        <div className="bg-slate-800 rounded-lg p-4 mt-6">
          <h2 className="text-xl font-semibold mb-4">Compact Armor Allocation Panel</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Full Width</h3>
              <CompactArmorAllocationPanel
                unit={unit}
                armorAllocation={unit.armorAllocation}
                onArmorChange={handleArmorChange}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Narrow Container (400px)</h3>
              <div style={{ width: '400px' }}>
                <CompactArmorAllocationPanel
                  unit={unit}
                  armorAllocation={unit.armorAllocation}
                  onArmorChange={handleArmorChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Current Armor Values */}
        <div className="bg-slate-800 rounded-lg p-4 mt-6">
          <h2 className="text-xl font-semibold mb-4">Current Armor Values</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {Object.entries(unit.armorAllocation).map(([location, armor]) => (
              <div key={location} className="bg-slate-700 rounded p-3">
                <h4 className="font-medium mb-1 capitalize">
                  {location.replace(/_/g, ' ')}
                </h4>
                <div>
                  Front: {armor.front}/{armor.maxArmor}
                </div>
                {armor.rear !== undefined && (
                  <div>
                    Rear: {armor.rear}/{Math.floor(armor.maxArmor * 0.5)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ArmorDiagramDemoPage;
