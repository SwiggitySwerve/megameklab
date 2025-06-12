import React, { useState } from 'react';
import { EditableUnit, ARMOR_TYPES } from '../../types/editor';
import UnitEditor from '../editor/UnitEditor';

// Sample unit data for demonstration
const createSampleUnit = (): EditableUnit => ({
  id: 'demo-atlas',
  chassis: 'Atlas',
  model: 'AS7-D',
  mass: 100,
  era: '3025',
  tech_base: 'Inner Sphere',
  mul_id: 'AS7-D',
  data: {
    chassis: 'Atlas',
    model: 'AS7-D',
    config: 'Biped',
    tech_base: 'Inner Sphere',
    era: '3025',
    mass: 100,
    heat_sinks: {
      type: 'Single',
      count: 20,
    },
    movement: {
      walk_mp: 3,
      jump_mp: 0,
    },
    armor: {
      type: 'Standard',
      total_armor_points: 307,
      locations: [
        { location: 'Head', armor_points: 9, rear_armor_points: 0 },
        { location: 'Center Torso', armor_points: 47, rear_armor_points: 10 },
        { location: 'Left Torso', armor_points: 32, rear_armor_points: 10 },
        { location: 'Right Torso', armor_points: 32, rear_armor_points: 10 },
        { location: 'Left Arm', armor_points: 34, rear_armor_points: 0 },
        { location: 'Right Arm', armor_points: 34, rear_armor_points: 0 },
        { location: 'Left Leg', armor_points: 41, rear_armor_points: 0 },
        { location: 'Right Leg', armor_points: 41, rear_armor_points: 0 },
      ],
    },
    weapons_and_equipment: [],
    criticals: [],
  },
  // Editor-specific fields
  armorAllocation: {
    'Head': { front: 9, rear: 0, maxArmor: 9, type: ARMOR_TYPES[0] },
    'Center Torso': { front: 47, rear: 10, maxArmor: 80, type: ARMOR_TYPES[0] },
    'Left Torso': { front: 32, rear: 10, maxArmor: 60, type: ARMOR_TYPES[0] },
    'Right Torso': { front: 32, rear: 10, maxArmor: 60, type: ARMOR_TYPES[0] },
    'Left Arm': { front: 34, rear: 0, maxArmor: 50, type: ARMOR_TYPES[0] },
    'Right Arm': { front: 34, rear: 0, maxArmor: 50, type: ARMOR_TYPES[0] },
    'Left Leg': { front: 41, rear: 0, maxArmor: 50, type: ARMOR_TYPES[0] },
    'Right Leg': { front: 41, rear: 0, maxArmor: 50, type: ARMOR_TYPES[0] },
  },
  equipmentPlacements: [],
  criticalSlots: [],
  fluffData: {
    overview: 'The Atlas is the ultimate expression of BattleMech warfare technology.',
    capabilities: 'Heavy assault capabilities with excellent armor protection.',
  },
  selectedQuirks: [],
  validationState: {
    isValid: true,
    errors: [],
    warnings: [],
  },
  editorMetadata: {
    lastModified: new Date('2024-01-01T00:00:00Z'),
    isDirty: false,
    version: '1.0.0',
  },
});

const UnitEditorDemo: React.FC = () => {
  const [unit, setUnit] = useState<EditableUnit>(createSampleUnit());
  const [savedUnit, setSavedUnit] = useState<EditableUnit | null>(null);

  const handleUnitChange = (updatedUnit: EditableUnit) => {
    setUnit(updatedUnit);
  };

  const handleSave = async (unitToSave: EditableUnit) => {
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSavedUnit({ ...unitToSave });
    console.log('Unit saved:', unitToSave);
  };

  return (
    <div className="unit-editor-demo p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Demo Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            MegaMekLab Unit Editor Demo
          </h1>
          <p className="text-gray-600 mb-4">
            This demo showcases the MegaMekLab-compatible unit editor with full 
            Structure/Armor, Equipment, Critical Slots, and Preview tab functionality. 
            The editor provides a condensed, modern interface while maintaining complete 
            feature parity with the original.
          </p>

          {/* Demo Features */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Implemented Features:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <h4 className="font-medium text-blue-900 mb-1">✅ Phase 1: Structure/Armor</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Interactive armor allocation</li>
                  <li>• Real-time validation and visual feedback</li>
                  <li>• Auto-allocation algorithm</li>
                  <li>• 2-column layout for better space usage</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">✅ Phase 2: Equipment</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Searchable equipment database</li>
                  <li>• Category filtering and sorting</li>
                  <li>• Click-to-add equipment assignment</li>
                  <li>• Real-time weight/heat tracking</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">✅ Phase 3: Critical Slots</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Visual critical slot editor</li>
                  <li>• System critical placement</li>
                  <li>• Drag-and-drop equipment assignment</li>
                  <li>• Multi-slot equipment handling</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">✅ Phase 4: Preview</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Complete record sheet generation</li>
                  <li>• Print-ready formatting</li>
                  <li>• Armor diagram integration</li>
                  <li>• Unit validation dashboard</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">✅ Phase 5: Fluff & Quirks</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Rich text editor with categories</li>
                  <li>• Auto-save functionality</li>
                  <li>• Comprehensive quirk system</li>
                  <li>• Point cost tracking</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Demo Controls */}
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => setUnit(createSampleUnit())}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Reset Demo Unit
            </button>
            
            <button
              onClick={() => {
                const newUnit = { ...unit };
                if (newUnit.data?.armor) {
                  newUnit.data.armor.total_armor_points = 400;
                }
                setUnit(newUnit);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Add More Armor Points
            </button>

            <button
              onClick={() => {
                const newUnit = { ...unit };
                if (newUnit.data?.armor?.locations) {
                  // Clear all armor allocation
                  newUnit.data.armor.locations = newUnit.data.armor.locations.map(loc => ({
                    ...loc,
                    armor_points: 0,
                    rear_armor_points: 0,
                  }));
                }
                setUnit(newUnit);
              }}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
            >
              Clear Armor Allocation
            </button>
          </div>

          {savedUnit && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
              <p className="text-green-800 text-sm">
                ✅ Unit saved successfully! Last saved: {savedUnit.editorMetadata.lastModified.toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>

        {/* Unit Editor */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <UnitEditor
            unit={unit}
            onUnitChange={handleUnitChange}
            onSave={handleSave}
            readOnly={false}
          />
        </div>

        {/* Demo Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Usage Instructions</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li><strong>Structure/Armor Tab:</strong> Click armor locations to edit values directly</li>
              <li><strong>Equipment Tab:</strong> Search and filter equipment, click "Add" to assign to unit</li>
              <li><strong>Critical Slots Tab:</strong> Drag equipment from unallocated list to specific slots</li>
              <li><strong>Preview Tab:</strong> View complete record sheet with print/export options</li>
              <li><strong>Auto-Allocate:</strong> Click "Auto" to distribute armor points intelligently</li>
              <li><strong>Validation:</strong> Red indicators show over-allocated locations or weight limits</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Details</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li><strong>Framework:</strong> React 18 with TypeScript</li>
              <li><strong>Styling:</strong> Tailwind CSS for responsive design</li>
              <li><strong>Architecture:</strong> Component-based with proper state management</li>
              <li><strong>Validation:</strong> Real-time validation with error boundaries</li>
              <li><strong>Accessibility:</strong> WCAG 2.1 AA compliant with keyboard navigation</li>
            </ul>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 bg-gray-100 rounded-lg border border-gray-300 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Implementation Roadmap</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">✅ Phases 1-4: Complete</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✅ Structure/Armor tab with interactive allocation</li>
                <li>✅ Equipment database with search and filtering</li>
                <li>✅ Critical slot assignment with drag-and-drop</li>
                <li>✅ Complete record sheet preview</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Phase 5: Fluff & Quirks</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Rich text editor for unit descriptions</li>
                <li>• Categorized quirk selection system</li>
                <li>• Point cost tracking</li>
                <li>• Auto-save functionality</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Future Enhancements</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Multi-unit editing</li>
                <li>• Template system</li>
                <li>• Advanced validation rules</li>
                <li>• Export improvements</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitEditorDemo;
