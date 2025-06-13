import React, { useState } from 'react';
import Layout from '../components/common/Layout';
import ArmorManagementComponent from '../components/armor/ArmorManagementComponent';
import { EditableUnit, ARMOR_TYPES } from '../types/editor';
import { FullUnit } from '../types';

// Sample units for demonstration
const sampleEditableUnit: EditableUnit = {
  id: 'demo-editable',
  chassis: 'Atlas',
  model: 'AS7-D',
  mass: 100,
  tech_base: 'Inner Sphere',
  era: '3025',
  data: {
    chassis: 'Atlas',
    model: 'AS7-D',
    mass: 100,
    armor: {
      type: 'standard',
      locations: [
        { location: 'Head', armor_points: 9 },
        { location: 'Center Torso', armor_points: 40, rear_armor_points: 20 },
        { location: 'Left Torso', armor_points: 30, rear_armor_points: 15 },
        { location: 'Right Torso', armor_points: 30, rear_armor_points: 15 },
        { location: 'Left Arm', armor_points: 30 },
        { location: 'Right Arm', armor_points: 30 },
        { location: 'Left Leg', armor_points: 35 },
        { location: 'Right Leg', armor_points: 35 },
      ],
      total_armor_points: 274
    }
  },
  armorAllocation: {
    'Head': { front: 9, rear: 0, maxArmor: 9, type: ARMOR_TYPES[0] },
    'Center Torso': { front: 40, rear: 20, maxArmor: 80, type: ARMOR_TYPES[0] },
    'Left Torso': { front: 30, rear: 15, maxArmor: 60, type: ARMOR_TYPES[0] },
    'Right Torso': { front: 30, rear: 15, maxArmor: 60, type: ARMOR_TYPES[0] },
    'Left Arm': { front: 30, rear: 0, maxArmor: 50, type: ARMOR_TYPES[0] },
    'Right Arm': { front: 30, rear: 0, maxArmor: 50, type: ARMOR_TYPES[0] },
    'Left Leg': { front: 35, rear: 0, maxArmor: 50, type: ARMOR_TYPES[0] },
    'Right Leg': { front: 35, rear: 0, maxArmor: 50, type: ARMOR_TYPES[0] }
  },
  equipmentPlacements: [],
  criticalSlots: [],
  fluffData: {
    overview: 'The Atlas AS7-D is the iconic assault mech of the Inner Sphere.',
    capabilities: 'Heavily armored with impressive firepower.',
    deployment: 'Used as a command mech and anchor for assault lances.',
    history: 'First deployed in 2755 by the Hegemony Armed Forces.'
  },
  selectedQuirks: [],
  validationState: {
    isValid: true,
    errors: [],
    warnings: []
  },
  editorMetadata: {
    lastModified: new Date(),
    isDirty: false,
    version: '1.0.0',
    isCustom: false
  }
};

const sampleFullUnit: FullUnit = {
  id: 'demo-readonly',
  chassis: 'Timber Wolf',
  model: 'Prime',
  mass: 75,
  tech_base: 'Clan',
  era: '3050',
  data: {
    chassis: 'Timber Wolf',
    model: 'Prime',
    mass: 75,
    armor: {
      type: 'ferro-fibrous',
      locations: [
        { location: 'Head', armor_points: 9 },
        { location: 'Center Torso', armor_points: 30, rear_armor_points: 14 },
        { location: 'Left Torso', armor_points: 22, rear_armor_points: 10 },
        { location: 'Right Torso', armor_points: 22, rear_armor_points: 10 },
        { location: 'Left Arm', armor_points: 24 },
        { location: 'Right Arm', armor_points: 24 },
        { location: 'Left Leg', armor_points: 30 },
        { location: 'Right Leg', armor_points: 30 },
      ],
      total_armor_points: 215
    }
  }
};

const ArmorManagementDemo: React.FC = () => {
  const [demoMode, setDemoMode] = useState<'edit' | 'readonly' | 'compact'>('edit');
  const [editableUnit, setEditableUnit] = useState<EditableUnit>(sampleEditableUnit);

  const handleUnitChange = (updates: Partial<EditableUnit>) => {
    setEditableUnit(prev => ({
      ...prev,
      ...updates
    }));
  };

  return (
    <Layout title="Armor Management Component Demo">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">
          Armor Management Component - Dual Mode Demo
        </h1>

        {/* Mode Selector */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Select Demo Mode</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setDemoMode('edit')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                demoMode === 'edit'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Edit Mode
            </button>
            <button
              onClick={() => setDemoMode('readonly')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                demoMode === 'readonly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Read-Only Mode
            </button>
            <button
              onClick={() => setDemoMode('compact')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                demoMode === 'compact'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Compact Read-Only
            </button>
          </div>
        </div>

        {/* Component Demo */}
        <div className="bg-gray-800 rounded-lg p-6">
          {demoMode === 'edit' && (
            <>
              <h2 className="text-xl font-semibold text-white mb-4">
                Edit Mode - Unit Editor Integration
              </h2>
              <p className="text-gray-400 mb-6">
                Full editing capabilities with all controls and interactions enabled.
              </p>
              <ArmorManagementComponent
                unit={editableUnit}
                readOnly={false}
                onUnitChange={handleUnitChange}
                showStatistics={true}
              />
            </>
          )}

          {demoMode === 'readonly' && (
            <>
              <h2 className="text-xl font-semibold text-white mb-4">
                Read-Only Mode - Compendium View
              </h2>
              <p className="text-gray-400 mb-6">
                Display-only mode for viewing unit armor configurations.
              </p>
              <ArmorManagementComponent
                unit={sampleFullUnit}
                readOnly={true}
                showStatistics={true}
              />
            </>
          )}

          {demoMode === 'compact' && (
            <>
              <h2 className="text-xl font-semibold text-white mb-4">
                Compact Read-Only - Unit Lists
              </h2>
              <p className="text-gray-400 mb-6">
                Minimal display for unit comparison views and lists.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Atlas AS7-D</h3>
                  <ArmorManagementComponent
                    unit={sampleEditableUnit}
                    readOnly={true}
                    compactMode={true}
                    showStatistics={true}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Timber Wolf Prime</h3>
                  <ArmorManagementComponent
                    unit={sampleFullUnit}
                    readOnly={true}
                    compactMode={true}
                    showStatistics={true}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Phase 2 Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-green-400 mb-2">✅ Completed</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Dual-mode component architecture</li>
                <li>• Custom hooks for logic extraction</li>
                <li>• Read-only optimization</li>
                <li>• Compact display mode</li>
                <li>• TypeScript strict mode compliance</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-blue-400 mb-2">🔧 Integration Ready</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Drop-in replacement for StructureArmorTab</li>
                <li>• Compendium unit display integration</li>
                <li>• Unit comparison views</li>
                <li>• Mobile responsive design</li>
                <li>• Performance optimized</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Code Examples */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Integration Examples</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">Unit Editor</h3>
              <pre className="bg-gray-900 p-4 rounded-lg text-sm text-gray-400 overflow-x-auto">
{`<ArmorManagementComponent
  unit={editableUnit}
  readOnly={false}
  onUnitChange={handleUnitChange}
  showStatistics={true}
/>`}
              </pre>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">Compendium</h3>
              <pre className="bg-gray-900 p-4 rounded-lg text-sm text-gray-400 overflow-x-auto">
{`<ArmorManagementComponent
  unit={unit}
  readOnly={true}
  compactMode={isListView}
  className="compendium-armor"
/>`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ArmorManagementDemo;
