import React, { useState } from 'react';
import { EditableUnit } from '../types/editor';
import { migrateUnitToSystemComponents } from '../utils/componentValidation';
import CriticalsTabIntegrated from '../components/editor/tabs/CriticalsTabIntegrated';
import StructureTabWithHooks from '../components/editor/tabs/StructureTabWithHooks';
import { UnitDataProvider } from '../hooks/useUnitData';

// Atlas AS7-D unit data (same as in customizer)
const createAtlasUnit = (): EditableUnit => {
  const unit: any = {
    id: `unit-${Date.now()}`,
    chassis: "Atlas",
    model: "AS7-D",
    mul_id: "AS7-D",
    mass: 100,
    era: "3025",
    tech_base: "Inner Sphere",
    rules_level: 1,
    source: "TRO:3025",
    role: "Juggernaut",
    data: {
      chassis: "Atlas",
      model: "AS7-D",
      mul_id: "AS7-D",
      config: "Biped",
      tech_base: "Inner Sphere",
      era: "3025",
      source: "TRO:3025",
      rules_level: 1,
      role: "Juggernaut",
      mass: 100,
      cockpit: { type: "Standard" },
      gyro: { type: "Standard" },
      engine: { type: "Standard", rating: 300 },
      structure: { type: "Standard" },
      heat_sinks: { type: "Single", count: 20 },
      movement: {
        walk_mp: 3,
        run_mp: 5,
        jump_mp: 0
      },
      armor: {
        type: "Standard",
        total_armor_points: 307,
        locations: [
          { location: "Head", armor_points: 9 },
          { location: "Center Torso", armor_points: 47, rear_armor_points: 12 },
          { location: "Left Torso", armor_points: 32, rear_armor_points: 10 },
          { location: "Right Torso", armor_points: 32, rear_armor_points: 10 },
          { location: "Left Arm", armor_points: 34 },
          { location: "Right Arm", armor_points: 34 },
          { location: "Left Leg", armor_points: 41 },
          { location: "Right Leg", armor_points: 41 }
        ]
      },
      weapons_and_equipment: [
        { item_name: "AC/10", item_type: "weapon", location: "Right Torso", tech_base: "IS" },
        { item_name: "LRM 20", item_type: "weapon", location: "Left Torso", tech_base: "IS" },
        { item_name: "SRM 6", item_type: "weapon", location: "Center Torso", tech_base: "IS" },
        { item_name: "Medium Laser", item_type: "weapon", location: "Left Arm", tech_base: "IS" },
        { item_name: "Medium Laser", item_type: "weapon", location: "Right Arm", tech_base: "IS" }
      ],
      criticals: [
        { 
          location: "Head", 
          slots: [
            { index: 0, name: "Life Support", type: "system", isFixed: true },
            { index: 1, name: "Sensors", type: "system", isFixed: true },
            { index: 2, name: "Cockpit", type: "system", isFixed: true },
            { index: 3, name: "-Empty-", type: "empty", isFixed: false },
            { index: 4, name: "Sensors", type: "system", isFixed: true },
            { index: 5, name: "Life Support", type: "system", isFixed: true }
          ]
        },
        { 
          location: "Center Torso", 
          slots: [
            { index: 0, name: "Engine", type: "system", isFixed: true },
            { index: 1, name: "Engine", type: "system", isFixed: true },
            { index: 2, name: "Engine", type: "system", isFixed: true },
            { index: 3, name: "Gyro", type: "system", isFixed: true },
            { index: 4, name: "Gyro", type: "system", isFixed: true },
            { index: 5, name: "Gyro", type: "system", isFixed: true },
            { index: 6, name: "Gyro", type: "system", isFixed: true },
            { index: 7, name: "Engine", type: "system", isFixed: true },
            { index: 8, name: "Engine", type: "system", isFixed: true },
            { index: 9, name: "Engine", type: "system", isFixed: true },
            { index: 10, name: "SRM 6", type: "equipment", isFixed: false },
            { index: 11, name: "SRM 6", type: "equipment", isFixed: false }
          ]
        },
        { 
          location: "Left Torso", 
          slots: [
            { index: 0, name: "LRM 20", type: "equipment", isFixed: false },
            { index: 1, name: "LRM 20", type: "equipment", isFixed: false },
            { index: 2, name: "LRM 20", type: "equipment", isFixed: false },
            { index: 3, name: "LRM 20", type: "equipment", isFixed: false },
            { index: 4, name: "LRM 20", type: "equipment", isFixed: false },
            { index: 5, name: "-Empty-", type: "empty", isFixed: false },
            { index: 6, name: "-Empty-", type: "empty", isFixed: false },
            { index: 7, name: "-Empty-", type: "empty", isFixed: false },
            { index: 8, name: "-Empty-", type: "empty", isFixed: false },
            { index: 9, name: "-Empty-", type: "empty", isFixed: false },
            { index: 10, name: "-Empty-", type: "empty", isFixed: false },
            { index: 11, name: "-Empty-", type: "empty", isFixed: false }
          ]
        },
        { 
          location: "Right Torso", 
          slots: [
            { index: 0, name: "AC/10", type: "equipment", isFixed: false },
            { index: 1, name: "AC/10", type: "equipment", isFixed: false },
            { index: 2, name: "AC/10", type: "equipment", isFixed: false },
            { index: 3, name: "AC/10", type: "equipment", isFixed: false },
            { index: 4, name: "AC/10", type: "equipment", isFixed: false },
            { index: 5, name: "AC/10", type: "equipment", isFixed: false },
            { index: 6, name: "AC/10", type: "equipment", isFixed: false },
            { index: 7, name: "-Empty-", type: "empty", isFixed: false },
            { index: 8, name: "-Empty-", type: "empty", isFixed: false },
            { index: 9, name: "-Empty-", type: "empty", isFixed: false },
            { index: 10, name: "-Empty-", type: "empty", isFixed: false },
            { index: 11, name: "-Empty-", type: "empty", isFixed: false }
          ]
        },
        { 
          location: "Left Arm", 
          slots: [
            { index: 0, name: "Shoulder", type: "system", isFixed: true },
            { index: 1, name: "Upper Arm Actuator", type: "system", isFixed: true },
            { index: 2, name: "Lower Arm Actuator", type: "system", isFixed: false },
            { index: 3, name: "Hand Actuator", type: "system", isFixed: false },
            { index: 4, name: "Medium Laser", type: "equipment", isFixed: false },
            { index: 5, name: "-Empty-", type: "empty", isFixed: false },
            { index: 6, name: "-Empty-", type: "empty", isFixed: false },
            { index: 7, name: "-Empty-", type: "empty", isFixed: false },
            { index: 8, name: "-Empty-", type: "empty", isFixed: false },
            { index: 9, name: "-Empty-", type: "empty", isFixed: false },
            { index: 10, name: "-Empty-", type: "empty", isFixed: false },
            { index: 11, name: "-Empty-", type: "empty", isFixed: false }
          ]
        },
        { 
          location: "Right Arm", 
          slots: [
            { index: 0, name: "Shoulder", type: "system", isFixed: true },
            { index: 1, name: "Upper Arm Actuator", type: "system", isFixed: true },
            { index: 2, name: "Lower Arm Actuator", type: "system", isFixed: false },
            { index: 3, name: "Hand Actuator", type: "system", isFixed: false },
            { index: 4, name: "Medium Laser", type: "equipment", isFixed: false },
            { index: 5, name: "-Empty-", type: "empty", isFixed: false },
            { index: 6, name: "-Empty-", type: "empty", isFixed: false },
            { index: 7, name: "-Empty-", type: "empty", isFixed: false },
            { index: 8, name: "-Empty-", type: "empty", isFixed: false },
            { index: 9, name: "-Empty-", type: "empty", isFixed: false },
            { index: 10, name: "-Empty-", type: "empty", isFixed: false },
            { index: 11, name: "-Empty-", type: "empty", isFixed: false }
          ]
        },
        { 
          location: "Left Leg", 
          slots: [
            { index: 0, name: "Hip", type: "system", isFixed: true },
            { index: 1, name: "Upper Leg Actuator", type: "system", isFixed: true },
            { index: 2, name: "Lower Leg Actuator", type: "system", isFixed: true },
            { index: 3, name: "Foot Actuator", type: "system", isFixed: true },
            { index: 4, name: "-Empty-", type: "empty", isFixed: false },
            { index: 5, name: "-Empty-", type: "empty", isFixed: false }
          ]
        },
        { 
          location: "Right Leg", 
          slots: [
            { index: 0, name: "Hip", type: "system", isFixed: true },
            { index: 1, name: "Upper Leg Actuator", type: "system", isFixed: true },
            { index: 2, name: "Lower Leg Actuator", type: "system", isFixed: true },
            { index: 3, name: "Foot Actuator", type: "system", isFixed: true },
            { index: 4, name: "-Empty-", type: "empty", isFixed: false },
            { index: 5, name: "-Empty-", type: "empty", isFixed: false }
          ]
        }
      ]
    },
    armorAllocation: {},
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
      version: "1.0.0"
    }
  };
  
  return unit;
};

export default function TestAtlasMigration() {
  const [unit, setUnit] = useState<EditableUnit>(() => {
    const atlasUnit = createAtlasUnit();
    return migrateUnitToSystemComponents(atlasUnit);
  });
  const [activeTab, setActiveTab] = useState<'structure' | 'criticals'>('structure');
  
  const handleUnitChange = (updatedUnit: EditableUnit) => {
    setUnit(updatedUnit);
  };
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test Atlas Migration with Engine Changes</h1>
      
      <div className="mb-4">
        <button
          onClick={() => setActiveTab('structure')}
          className={`px-4 py-2 mr-2 ${activeTab === 'structure' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Structure Tab
        </button>
        <button
          onClick={() => setActiveTab('criticals')}
          className={`px-4 py-2 ${activeTab === 'criticals' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Criticals Tab
        </button>
      </div>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">Current Engine Type: {unit.systemComponents?.engine?.type || 'Unknown'}</h3>
        <h3 className="font-bold">Instructions:</h3>
        <ol className="list-decimal list-inside">
          <li>Change engine type in Structure tab</li>
          <li>Switch to Criticals tab to see if slots update correctly</li>
          <li>Check if center torso maintains proper engine/gyro placement</li>
        </ol>
      </div>
      
      <UnitDataProvider initialUnit={unit} onUnitChange={handleUnitChange}>
        {activeTab === 'structure' ? (
          <StructureTabWithHooks />
        ) : (
          <CriticalsTabIntegrated />
        )}
      </UnitDataProvider>
    </div>
  );
}
