import React, { useState } from 'react';
import Head from 'next/head';
import UnitEditor from '../../components/editor/UnitEditor';
import { FullUnit, UnitData } from '../../types';
import { EditableUnit, ValidationResult, ARMOR_TYPES } from '../../types/editor';

const CustomizerPage: React.FC = () => {
  // Create an EditableUnit from base data
  const createEditableUnit = (): EditableUnit => {
    const standardArmor = ARMOR_TYPES.find(armor => armor.id === 'standard')!;
    
    return {
      // Base FullUnit properties
      id: "1",
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
        engine: { type: "Fusion", rating: 300 },
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
          { item_name: "AC/20", item_type: "weapon", location: "Right Torso", tech_base: "IS" },
          { item_name: "LRM 20", item_type: "weapon", location: "Left Torso", tech_base: "IS" },
          { item_name: "SRM 6", item_type: "weapon", location: "Center Torso", tech_base: "IS" },
          { item_name: "Medium Laser", item_type: "weapon", location: "Left Arm", tech_base: "IS" },
          { item_name: "Medium Laser", item_type: "weapon", location: "Right Arm", tech_base: "IS" }
        ],
        criticals: [
          { location: "Head", slots: ["Life Support", "Sensors", "Cockpit", "- Empty -", "Sensors", "Life Support"] },
          { location: "Center Torso", slots: ["Fusion Engine", "Fusion Engine", "Fusion Engine", "Gyro", "Gyro", "Gyro", "Gyro", "Fusion Engine", "Fusion Engine", "Fusion Engine", "SRM 6", "- Empty -"] },
          { location: "Left Torso", slots: ["Fusion Engine", "Fusion Engine", "LRM 20", "LRM 20", "LRM 20", "LRM 20", "LRM 20", "- Empty -", "- Empty -", "- Empty -", "- Empty -", "- Empty -"] },
          { location: "Right Torso", slots: ["Fusion Engine", "Fusion Engine", "AC/20", "AC/20", "AC/20", "AC/20", "AC/20", "AC/20", "AC/20", "AC/20", "AC/20", "AC/20"] },
          { location: "Left Arm", slots: ["Shoulder", "Upper Arm Actuator", "Lower Arm Actuator", "Hand Actuator", "Medium Laser", "- Empty -", "- Empty -", "- Empty -", "- Empty -", "- Empty -", "- Empty -", "- Empty -"] },
          { location: "Right Arm", slots: ["Shoulder", "Upper Arm Actuator", "Lower Arm Actuator", "Hand Actuator", "Medium Laser", "- Empty -", "- Empty -", "- Empty -", "- Empty -", "- Empty -", "- Empty -", "- Empty -"] },
          { location: "Left Leg", slots: ["Hip", "Upper Leg Actuator", "Lower Leg Actuator", "Foot Actuator", "- Empty -", "- Empty -"] },
          { location: "Right Leg", slots: ["Hip", "Upper Leg Actuator", "Lower Leg Actuator", "Foot Actuator", "- Empty -", "- Empty -"] }
        ]
      },
      
      // EditableUnit specific properties
      armorAllocation: {
        "Head": { front: 9, maxArmor: 9, type: standardArmor },
        "Center Torso": { front: 47, rear: 12, maxArmor: 59, type: standardArmor },
        "Left Torso": { front: 32, rear: 10, maxArmor: 42, type: standardArmor },
        "Right Torso": { front: 32, rear: 10, maxArmor: 42, type: standardArmor },
        "Left Arm": { front: 34, maxArmor: 34, type: standardArmor },
        "Right Arm": { front: 34, maxArmor: 34, type: standardArmor },
        "Left Leg": { front: 41, maxArmor: 41, type: standardArmor },
        "Right Leg": { front: 41, maxArmor: 41, type: standardArmor }
      },
      equipmentPlacements: [],
      criticalSlots: [],
      fluffData: {
        overview: "The Atlas is one of the most feared BattleMechs on the battlefield.",
        capabilities: "Armed with a devastating AC/20 and supported by missiles and energy weapons.",
        deployment: "Used by elite assault units across the Inner Sphere.",
        history: "First deployed in 2755, the Atlas has become an icon of BattleMech warfare."
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

  const [selectedUnit, setSelectedUnit] = useState<EditableUnit>(createEditableUnit());

  const handleUnitChange = (updatedUnit: EditableUnit) => {
    setSelectedUnit(updatedUnit);
  };

  return (
    <>
      <Head>
        <title>MegaMekLab Unit Editor | BattleTech Editor</title>
        <meta name="description" content="Complete MegaMekLab-compatible unit editor with armor allocation, equipment management, and critical slot assignment." />
      </Head>
      
      <div className="min-h-screen bg-slate-900">
        <UnitEditor
          unit={selectedUnit}
          onUnitChange={handleUnitChange}
          readOnly={false}
        />
      </div>
    </>
  );
};

export default CustomizerPage;
