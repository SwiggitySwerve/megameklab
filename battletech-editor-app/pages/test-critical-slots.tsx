import React, { useState } from 'react';
import { EditableUnit, ARMOR_TYPES } from '../types/editor';
import { UnitDataProvider, useUnitData, useCriticalAllocations } from '../hooks/useUnitData';
import CriticalsTabWithHooks from '../components/editor/tabs/CriticalsTabWithHooks';

// Component to display the critical allocations data
function CriticalDataDisplay() {
  const { state } = useUnitData();
  const criticalAllocations = useCriticalAllocations();
  
  // Count empty slots
  let totalSlots = 0;
  let emptySlots = 0;
  let emptyStrings = 0;
  
  if (criticalAllocations) {
    Object.values(criticalAllocations).forEach(locationSlots => {
      locationSlots.forEach(slot => {
        totalSlots++;
        if (!slot.content || slot.content === null) {
          emptySlots++;
        }
        if (slot.content === '-Empty-') {
          emptyStrings++;
        }
      });
    });
  }
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', color: '#fff' }}>
      <h2>Critical Allocations Debug Info</h2>
      <p>Total Slots: {totalSlots}</p>
      <p>Empty Slots (null): {emptySlots}</p>
      <p>Empty String Slots ("-Empty-"): {emptyStrings}</p>
      <p>Used Slots: {totalSlots - emptySlots - emptyStrings}</p>
      
      <h3>Raw Data:</h3>
      <pre style={{ fontSize: '10px', maxHeight: '300px', overflow: 'auto' }}>
        {JSON.stringify(criticalAllocations, null, 2)}
      </pre>
      
      <h3>Legacy Criticals:</h3>
      <pre style={{ fontSize: '10px', maxHeight: '200px', overflow: 'auto' }}>
        {JSON.stringify(state.unit.data?.criticals, null, 2)}
      </pre>
    </div>
  );
}

export default function TestCriticalSlots() {
  // Create test unit with legacy format
  const createTestUnit = (): EditableUnit => {
    const standardArmor = ARMOR_TYPES.find(armor => armor.id === 'standard')!;
    
    return {
      id: `unit-${Date.now()}`,
      chassis: "Test",
      model: "Mech",
      mul_id: "-1",
      mass: 50,
      era: "3025",
      tech_base: "Inner Sphere",
      rules_level: 1,
      source: "",
      role: undefined,
      data: {
        chassis: "Test",
        model: "Mech",
        mul_id: "-1",
        config: "Biped",
        tech_base: "Inner Sphere",
        era: "3025",
        source: "",
        rules_level: 1,
        role: undefined,
        mass: 50,
        cockpit: { type: "Standard" },
        gyro: { type: "Standard" },
        engine: { type: "Standard", rating: 200 },
        structure: { type: "Standard" },
        heat_sinks: { type: "Single", count: 10 },
        movement: {
          walk_mp: 4,
          run_mp: 6,
          jump_mp: 0
        },
        armor: {
          type: "Standard",
          total_armor_points: 0,
          locations: []
        },
        weapons_and_equipment: [],
        // Legacy format with "-Empty-" strings
        criticals: [
          { location: "Head", slots: ["Life Support", "Sensors", "Cockpit", "- Empty -", "Sensors", "Life Support"] },
          { location: "Center Torso", slots: ["Engine", "Engine", "Engine", "Engine", "Gyro", "Gyro", "Gyro", "Gyro", "- Empty -", "- Empty -", "- Empty -", "- Empty -"] },
          { location: "Left Torso", slots: Array(12).fill("- Empty -") },
          { location: "Right Torso", slots: Array(12).fill("- Empty -") },
          { location: "Left Arm", slots: ["Shoulder", "Upper Arm Actuator", "Lower Arm Actuator", "Hand Actuator", ...Array(8).fill("- Empty -")] },
          { location: "Right Arm", slots: ["Shoulder", "Upper Arm Actuator", "Lower Arm Actuator", "Hand Actuator", ...Array(8).fill("- Empty -")] },
          { location: "Left Leg", slots: ["Hip", "Upper Leg Actuator", "Lower Leg Actuator", "Foot Actuator", "- Empty -", "- Empty -"] },
          { location: "Right Leg", slots: ["Hip", "Upper Leg Actuator", "Lower Leg Actuator", "Foot Actuator", "- Empty -", "- Empty -"] }
        ]
      },
      armorAllocation: {
        "Head": { front: 0, maxArmor: 9, type: standardArmor },
        "Center Torso": { front: 0, rear: 0, maxArmor: 32, type: standardArmor },
        "Left Torso": { front: 0, rear: 0, maxArmor: 24, type: standardArmor },
        "Right Torso": { front: 0, rear: 0, maxArmor: 24, type: standardArmor },
        "Left Arm": { front: 0, maxArmor: 16, type: standardArmor },
        "Right Arm": { front: 0, maxArmor: 16, type: standardArmor },
        "Left Leg": { front: 0, maxArmor: 24, type: standardArmor },
        "Right Leg": { front: 0, maxArmor: 24, type: standardArmor }
      },
      equipmentPlacements: [],
      criticalSlots: [],
      fluffData: {
        overview: "",
        capabilities: "",
        deployment: "",
        history: ""
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
        version: "1.0.0"
      }
    };
  };
  
  const [unit, setUnit] = useState(createTestUnit());
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f0f0f' }}>
      <UnitDataProvider initialUnit={unit} onUnitChange={setUnit}>
        <div style={{ display: 'flex', height: '100vh' }}>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <CriticalsTabWithHooks readOnly={false} />
          </div>
          <div style={{ width: '400px', overflow: 'auto', borderLeft: '1px solid #333' }}>
            <CriticalDataDisplay />
          </div>
        </div>
      </UnitDataProvider>
    </div>
  );
}
