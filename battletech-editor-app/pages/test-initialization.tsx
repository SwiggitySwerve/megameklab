import React, { useState } from 'react';
import { EditableUnit } from '../types/editor';
import UnitEditor from '../components/editor/UnitEditor';

const TestInitializationPage: React.FC = () => {
  // Create a test unit without system components (legacy format)
  const createLegacyUnit = (): EditableUnit => ({
    id: 'test-mech-1',
    chassis: 'Atlas',
    model: 'AS7-D',
    mass: 100,
    tech_base: 'Inner Sphere',
    era: '3025',
    rules_level: 1,
    source: 'TRO 3025',
    role: 'Juggernaut',
    data: {
      chassis: 'Atlas',
      model: 'AS7-D',
      mass: 100,
      tech_base: 'Inner Sphere',
      era: '3025',
      rules_level: 1,
      role: 'Juggernaut',
      config: 'Biped',
      engine: {
        type: 'XL',  // XL engine should populate side torsos
        rating: 300,
      },
      structure: {
        type: 'Standard',
      },
      heat_sinks: {
        type: 'Double',
        count: 20,  // This should create external heat sinks
      },
      gyro: {
        type: 'Standard',
      },
      movement: {
        walk_mp: 3,
        jump_mp: 0,
      },
      armor: {
        type: 'Standard',
        locations: [],
      },
      weapons_and_equipment: [
        {
          item_name: 'AC/20',
          item_type: 'weapon',
          tech_base: 'IS' as any,
          location: '',
        },
        {
          item_name: 'Gauss Rifle',
          item_type: 'weapon',
          tech_base: 'IS' as any,
          location: '',
        },
        {
          item_name: 'Medium Laser',
          item_type: 'weapon',
          tech_base: 'IS' as any,
          location: '',
        },
      ],
      criticals: [
        { location: 'Head', slots: Array(6).fill('-Empty-') },
        { location: 'Center Torso', slots: Array(12).fill('-Empty-') },
        { location: 'Left Torso', slots: Array(12).fill('-Empty-') },
        { location: 'Right Torso', slots: Array(12).fill('-Empty-') },
        { location: 'Left Arm', slots: Array(12).fill('-Empty-') },
        { location: 'Right Arm', slots: Array(12).fill('-Empty-') },
        { location: 'Left Leg', slots: Array(6).fill('-Empty-') },
        { location: 'Right Leg', slots: Array(6).fill('-Empty-') },
      ],
    },
    armorAllocation: {},
    equipmentPlacements: [],
    criticalSlots: [],
    fluffData: {},
    selectedQuirks: [],
    validationState: {
      isValid: true,
      errors: [],
      warnings: [],
    },
    editorMetadata: {
      lastModified: new Date(),
      isDirty: false,
      version: '1.0.0',
    },
  });

  const [unit, setUnit] = useState<EditableUnit>(createLegacyUnit());
  const [showDebug, setShowDebug] = useState(true);

  const handleUnitChange = (updatedUnit: EditableUnit) => {
    setUnit(updatedUnit);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            System Components Initialization Test
          </h1>
          <p className="text-gray-600 mb-4">
            This page tests that critical slots properly initialize with system components
            based on the unit's engine type, gyro, and other configuration.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">Expected Behavior:</h3>
            <ul className="list-disc list-inside text-blue-800 space-y-1">
              <li>XL Engine should populate: 6 CT slots + 3 LT slots + 3 RT slots</li>
              <li>Standard Gyro should populate: 4 CT slots</li>
              <li>Actuators should be in arms and legs</li>
              <li>20 Double Heat Sinks should create 8 external heat sink items (12 integrated in engine)</li>
              <li>Life Support, Sensors, and Cockpit should be in head</li>
            </ul>
          </div>
          
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            {showDebug ? 'Hide' : 'Show'} Debug Info
          </button>
        </div>

        {/* Debug Information */}
        {showDebug && (
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-2">System Components:</h3>
              <pre className="text-xs overflow-auto max-h-64 bg-gray-100 p-2 rounded">
                {JSON.stringify(unit.systemComponents, null, 2)}
              </pre>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-2">Critical Allocations (Center Torso):</h3>
              <pre className="text-xs overflow-auto max-h-64 bg-gray-100 p-2 rounded">
                {JSON.stringify(unit.criticalAllocations?.['Center Torso'] || 'Not initialized', null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Unit Editor */}
        <div className="bg-white rounded-lg shadow-lg">
          <UnitEditor
            unit={unit}
            onUnitChange={handleUnitChange}
          />
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">Test Instructions:</h3>
          <ol className="list-decimal list-inside text-yellow-800 space-y-2">
            <li>Switch to the <strong>Criticals</strong> tab</li>
            <li>Verify that the Center Torso shows:
              <ul className="list-disc list-inside ml-6 mt-1">
                <li>6 Engine slots</li>
                <li>4 Gyro slots</li>
              </ul>
            </li>
            <li>Verify that the Left and Right Torsos show:
              <ul className="list-disc list-inside ml-6 mt-1">
                <li>3 Engine slots each (for XL engine)</li>
              </ul>
            </li>
            <li>Verify that the Head shows:
              <ul className="list-disc list-inside ml-6 mt-1">
                <li>Life Support</li>
                <li>Sensors</li>
                <li>Cockpit</li>
              </ul>
            </li>
            <li>Check the Equipment panel for 8 Double Heat Sink items</li>
            <li>Try changing engine type in Structure tab and verify slots update</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default TestInitializationPage;
