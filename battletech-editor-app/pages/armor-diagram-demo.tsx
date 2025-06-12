import React, { useState } from 'react';
import Layout from '../components/common/Layout';
import { EditableUnit, ARMOR_TYPES } from '../types/editor';
import StructureArmorTab from '../components/editor/tabs/StructureArmorTab';

// Mock unit data for demo
const createMockUnit = (tonnage: number): EditableUnit => ({
  id: 'demo-mech',
  model: 'Demo Mech',
  mass: tonnage,
  data: {
    name: 'Demo Mech',
    mass: tonnage,
    rules_level: 'Standard',
    tech_base: 'Inner Sphere',
    armor: {
      type: 'standard',
      manufacturer: 'StarSlab',
      locations: [],
    },
    structure: {
      type: 'standard',
      manufacturer: 'StarFrame',
      locations: []
    },
    heat_sinks: {
      type: 'single',
      count: 10
    },
    myomer: {
      type: 'standard'
    },
    engine: {
      type: 'fusion',
      rating: 250
    },
    gyro: {
      type: 'standard'
    },
    cockpit: {
      type: 'standard'
    },
    actuators: {
      left_arm: { shoulder: true, upper: true, lower: true, hand: true },
      right_arm: { shoulder: true, upper: true, lower: true, hand: true }
    },
    locations: []
  },
  armorAllocation: {
    'Head': { front: 9, rear: 0, maxArmor: 9, type: ARMOR_TYPES[0] },
    'Center Torso': { front: 25, rear: 10, maxArmor: tonnage, type: ARMOR_TYPES[0] },
    'Left Torso': { front: 20, rear: 8, maxArmor: Math.floor(tonnage * 0.75), type: ARMOR_TYPES[0] },
    'Right Torso': { front: 20, rear: 8, maxArmor: Math.floor(tonnage * 0.75), type: ARMOR_TYPES[0] },
    'Left Arm': { front: 16, rear: 0, maxArmor: Math.floor(tonnage * 0.5), type: ARMOR_TYPES[0] },
    'Right Arm': { front: 16, rear: 0, maxArmor: Math.floor(tonnage * 0.5), type: ARMOR_TYPES[0] },
    'Left Leg': { front: 20, rear: 0, maxArmor: Math.floor(tonnage * 0.5), type: ARMOR_TYPES[0] },
    'Right Leg': { front: 20, rear: 0, maxArmor: Math.floor(tonnage * 0.5), type: ARMOR_TYPES[0] },
  },
  equipmentPlacements: [],
  criticalSlots: [],
  fluffData: {},
  selectedQuirks: [],
  validationState: {
    isValid: true,
    errors: [],
    warnings: []
  },
  editorMetadata: {
    lastModified: new Date(),
    isDirty: false,
    version: '1.0.0'
  }
});

const ArmorDiagramDemo: React.FC = () => {
  const [selectedTonnage, setSelectedTonnage] = useState(50);
  const [demoUnit, setDemoUnit] = useState<EditableUnit>(createMockUnit(selectedTonnage));

  const handleUnitChange = (updates: Partial<EditableUnit>) => {
    setDemoUnit(prev => ({
      ...prev,
      ...updates,
      editorMetadata: {
        ...prev.editorMetadata,
        isDirty: true,
        lastModified: new Date()
      }
    }));
  };

  const handleTonnageChange = (tonnage: number) => {
    setSelectedTonnage(tonnage);
    setDemoUnit(createMockUnit(tonnage));
  };

  const mockValidationErrors = [
    {
      id: 'head-armor-low',
      category: 'warning' as const,
      message: 'Head armor is below recommended minimum',
      location: 'Head',
      field: 'armor'
    }
  ];

  return (
    <Layout title="Armor Diagram Demo">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-4">
            MegaMekLab Armor Diagram Demo
          </h1>
          <p className="text-gray-300 mb-6">
            Test the complete armor management system with all features from the original MegaMekLab implementation.
          </p>

          {/* Tonnage Selector */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
            <h3 className="text-sm font-semibold text-gray-100 mb-3">Select Mech Tonnage</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Light Mechs (20-35 tons) */}
              <div>
                <h4 className="text-xs font-medium text-green-400 mb-2">Light (20-35t)</h4>
                <div className="flex gap-1 flex-wrap">
                  {[20, 25, 30, 35].map(tonnage => (
                    <button
                      key={tonnage}
                      onClick={() => handleTonnageChange(tonnage)}
                      className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                        selectedTonnage === tonnage
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-green-700'
                      }`}
                    >
                      {tonnage}t
                    </button>
                  ))}
                </div>
              </div>

              {/* Medium Mechs (40-55 tons) */}
              <div>
                <h4 className="text-xs font-medium text-yellow-400 mb-2">Medium (40-55t)</h4>
                <div className="flex gap-1 flex-wrap">
                  {[40, 45, 50, 55].map(tonnage => (
                    <button
                      key={tonnage}
                      onClick={() => handleTonnageChange(tonnage)}
                      className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                        selectedTonnage === tonnage
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-yellow-700'
                      }`}
                    >
                      {tonnage}t
                    </button>
                  ))}
                </div>
              </div>

              {/* Heavy Mechs (60-75 tons) */}
              <div>
                <h4 className="text-xs font-medium text-orange-400 mb-2">Heavy (60-75t)</h4>
                <div className="flex gap-1 flex-wrap">
                  {[60, 65, 70, 75].map(tonnage => (
                    <button
                      key={tonnage}
                      onClick={() => handleTonnageChange(tonnage)}
                      className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                        selectedTonnage === tonnage
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-orange-700'
                      }`}
                    >
                      {tonnage}t
                    </button>
                  ))}
                </div>
              </div>

              {/* Assault Mechs (80-100 tons) */}
              <div>
                <h4 className="text-xs font-medium text-red-400 mb-2">Assault (80-100t)</h4>
                <div className="flex gap-1 flex-wrap">
                  {[80, 85, 90, 95, 100].map(tonnage => (
                    <button
                      key={tonnage}
                      onClick={() => handleTonnageChange(tonnage)}
                      className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                        selectedTonnage === tonnage
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-red-700'
                      }`}
                    >
                      {tonnage}t
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feature List */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
            <h3 className="text-sm font-semibold text-gray-100 mb-3">Available Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
              <div>
                <h4 className="font-medium text-gray-100 mb-2">Phase 1-2 Features:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>10+ armor types with tech restrictions</li>
                  <li>0.5 ton increment controls</li>
                  <li>Interactive SVG mech diagram</li>
                  <li>Drag-to-adjust armor values</li>
                  <li>Color-coded coverage visualization</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-100 mb-2">Phase 3-5 Features:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Real-time validation</li>
                  <li>Comprehensive statistics</li>
                  <li>6 distribution presets</li>
                  <li>Patchwork armor support</li>
                  <li>Undo/redo with history</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-300 mb-2">How to Use:</h3>
            <ol className="list-decimal list-inside text-sm text-blue-200 space-y-1">
              <li>Select a mech tonnage above to create a test unit</li>
              <li>Choose an armor type from the dropdown</li>
              <li>Set armor tonnage with the increment controls</li>
              <li>Drag on the mech diagram to adjust armor values</li>
              <li>Try the distribution presets for quick setup</li>
              <li>Enable patchwork armor for per-location types</li>
              <li>Use Ctrl+Z/Y for undo/redo</li>
            </ol>
          </div>
        </div>

        {/* Main Armor Diagram Component */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <StructureArmorTab
            unit={demoUnit}
            onUnitChange={handleUnitChange}
            validationErrors={mockValidationErrors}
            readOnly={false}
          />
        </div>

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-100 mb-3">Debug Info</h3>
            <pre className="text-xs text-gray-400 overflow-auto">
              {JSON.stringify({
                tonnage: demoUnit.mass,
                armorType: demoUnit.data?.armor?.type,
                totalArmorPoints: Object.values(demoUnit.armorAllocation).reduce(
                  (sum, loc) => sum + loc.front + (loc.rear || 0), 0
                ),
                isDirty: demoUnit.editorMetadata.isDirty
              }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ArmorDiagramDemo;
