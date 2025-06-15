import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import UnitEditorWrapper from '../../components/editor/UnitEditorWrapper';
import SaveUnitDialog from '../../components/editor/SaveUnitDialog';
import { FullUnit, UnitData, CriticalSlotItem } from '../../types';
import { EditableUnit, ValidationResult, ARMOR_TYPES } from '../../types/editor';
import { getSlotContentType } from '../../types/systemComponents';
import { migrateUnitToSystemComponents } from '../../utils/componentValidation';

interface TabData {
  id: string;
  unit: EditableUnit;
  title: string;
  isModified: boolean;
}

const CustomizerPage: React.FC = () => {
  const router = useRouter();
  
  // Create an EditableUnit from base data
  const createEditableUnit = (): EditableUnit => {
    const standardArmor = ARMOR_TYPES.find(armor => armor.id === 'standard')!;
    
    return {
      // Base FullUnit properties
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
        engine: { type: "XL", rating: 300 },
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
              { index: 0, name: "Life Support", type: "system" as const, isFixed: true },
              { index: 1, name: "Sensors", type: "system" as const, isFixed: true },
              { index: 2, name: "Cockpit", type: "system" as const, isFixed: true },
              { index: 3, name: "-Empty-", type: "empty" as const, isFixed: false },
              { index: 4, name: "Sensors", type: "system" as const, isFixed: true },
              { index: 5, name: "Life Support", type: "system" as const, isFixed: true }
            ] as CriticalSlotItem[]
          },
          { 
            location: "Center Torso", 
            slots: [
              { index: 0, name: "Engine", type: "system" as const, isFixed: true },
              { index: 1, name: "Engine", type: "system" as const, isFixed: true },
              { index: 2, name: "Engine", type: "system" as const, isFixed: true },
              { index: 3, name: "Gyro", type: "system" as const, isFixed: true },
              { index: 4, name: "Gyro", type: "system" as const, isFixed: true },
              { index: 5, name: "Gyro", type: "system" as const, isFixed: true },
              { index: 6, name: "Gyro", type: "system" as const, isFixed: true },
              { index: 7, name: "Engine", type: "system" as const, isFixed: true },
              { index: 8, name: "Engine", type: "system" as const, isFixed: true },
              { index: 9, name: "Engine", type: "system" as const, isFixed: true },
              { index: 10, name: "SRM 6", type: "equipment" as const, isFixed: false },
              { index: 11, name: "SRM 6", type: "equipment" as const, isFixed: false }
            ] as CriticalSlotItem[]
          },
          { 
            location: "Left Torso", 
            slots: [
              { index: 0, name: "Engine", type: "system" as const, isFixed: true },
              { index: 1, name: "Engine", type: "system" as const, isFixed: true },
              { index: 2, name: "Engine", type: "system" as const, isFixed: true },
              { index: 3, name: "LRM 20", type: "equipment" as const, isFixed: false },
              { index: 4, name: "LRM 20", type: "equipment" as const, isFixed: false },
              { index: 5, name: "LRM 20", type: "equipment" as const, isFixed: false },
              { index: 6, name: "LRM 20", type: "equipment" as const, isFixed: false },
              { index: 7, name: "LRM 20", type: "equipment" as const, isFixed: false },
              { index: 8, name: "-Empty-", type: "empty" as const, isFixed: false },
              { index: 9, name: "-Empty-", type: "empty" as const, isFixed: false },
              { index: 10, name: "-Empty-", type: "empty" as const, isFixed: false },
              { index: 11, name: "-Empty-", type: "empty" as const, isFixed: false }
            ] as CriticalSlotItem[]
          },
          { 
            location: "Right Torso", 
            slots: [
              { index: 0, name: "Engine", type: "system" as const, isFixed: true },
              { index: 1, name: "Engine", type: "system" as const, isFixed: true },
              { index: 2, name: "Engine", type: "system" as const, isFixed: true },
              { index: 3, name: "AC/10", type: "equipment" as const, isFixed: false },
              { index: 4, name: "AC/10", type: "equipment" as const, isFixed: false },
              { index: 5, name: "AC/10", type: "equipment" as const, isFixed: false },
              { index: 6, name: "AC/10", type: "equipment" as const, isFixed: false },
              { index: 7, name: "AC/10", type: "equipment" as const, isFixed: false },
              { index: 8, name: "AC/10", type: "equipment" as const, isFixed: false },
              { index: 9, name: "AC/10", type: "equipment" as const, isFixed: false },
              { index: 10, name: "-Empty-", type: "empty" as const, isFixed: false },
              { index: 11, name: "-Empty-", type: "empty" as const, isFixed: false }
            ] as CriticalSlotItem[]
          },
          { 
            location: "Left Arm", 
            slots: [
              { index: 0, name: "Shoulder", type: "system" as const, isFixed: true },
              { index: 1, name: "Upper Arm Actuator", type: "system" as const, isFixed: true },
              { index: 2, name: "Lower Arm Actuator", type: "system" as const, isFixed: false },
              { index: 3, name: "Hand Actuator", type: "system" as const, isFixed: false },
              { index: 4, name: "Medium Laser", type: "equipment" as const, isFixed: false },
              { index: 5, name: "-Empty-", type: "empty" as const, isFixed: false },
              { index: 6, name: "-Empty-", type: "empty" as const, isFixed: false },
              { index: 7, name: "-Empty-", type: "empty" as const, isFixed: false },
              { index: 8, name: "-Empty-", type: "empty" as const, isFixed: false },
              { index: 9, name: "-Empty-", type: "empty" as const, isFixed: false },
              { index: 10, name: "-Empty-", type: "empty" as const, isFixed: false },
              { index: 11, name: "-Empty-", type: "empty" as const, isFixed: false }
            ] as CriticalSlotItem[]
          },
          { 
            location: "Right Arm", 
            slots: [
              { index: 0, name: "Shoulder", type: "system" as const, isFixed: true },
              { index: 1, name: "Upper Arm Actuator", type: "system" as const, isFixed: true },
              { index: 2, name: "Lower Arm Actuator", type: "system" as const, isFixed: false },
              { index: 3, name: "Hand Actuator", type: "system" as const, isFixed: false },
              { index: 4, name: "Medium Laser", type: "equipment" as const, isFixed: false },
              { index: 5, name: "-Empty-", type: "empty" as const, isFixed: false },
              { index: 6, name: "-Empty-", type: "empty" as const, isFixed: false },
              { index: 7, name: "-Empty-", type: "empty" as const, isFixed: false },
              { index: 8, name: "-Empty-", type: "empty" as const, isFixed: false },
              { index: 9, name: "-Empty-", type: "empty" as const, isFixed: false },
              { index: 10, name: "-Empty-", type: "empty" as const, isFixed: false },
              { index: 11, name: "-Empty-", type: "empty" as const, isFixed: false }
            ] as CriticalSlotItem[]
          },
          { 
            location: "Left Leg", 
            slots: [
              { index: 0, name: "Hip", type: "system" as const, isFixed: true },
              { index: 1, name: "Upper Leg Actuator", type: "system" as const, isFixed: true },
              { index: 2, name: "Lower Leg Actuator", type: "system" as const, isFixed: true },
              { index: 3, name: "Foot Actuator", type: "system" as const, isFixed: true },
              { index: 4, name: "-Empty-", type: "empty" as const, isFixed: false },
              { index: 5, name: "-Empty-", type: "empty" as const, isFixed: false }
            ] as CriticalSlotItem[]
          },
          { 
            location: "Right Leg", 
            slots: [
              { index: 0, name: "Hip", type: "system" as const, isFixed: true },
              { index: 1, name: "Upper Leg Actuator", type: "system" as const, isFixed: true },
              { index: 2, name: "Lower Leg Actuator", type: "system" as const, isFixed: true },
              { index: 3, name: "Foot Actuator", type: "system" as const, isFixed: true },
              { index: 4, name: "-Empty-", type: "empty" as const, isFixed: false },
              { index: 5, name: "-Empty-", type: "empty" as const, isFixed: false }
            ] as CriticalSlotItem[]
          }
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

  // Create a new empty mech
  const createNewMech = (): EditableUnit => {
    const standardArmor = ARMOR_TYPES.find(armor => armor.id === 'standard')!;
    
    return {
      id: `unit-${Date.now()}`,
      chassis: "New",
      model: "Mek",
      mul_id: "-1",
      mass: 25,
      era: "3025",
      tech_base: "Inner Sphere",
      rules_level: 1,
      source: "",
      role: undefined,
      data: {
        chassis: "New",
        model: "Mek",
        mul_id: "-1",
        config: "Biped",
        tech_base: "Inner Sphere",
        era: "3025",
        source: "",
        rules_level: 1,
        role: undefined,
        mass: 25,
        cockpit: { type: "Standard" },
        gyro: { type: "Standard" },
        engine: { type: "Standard", rating: 100 },
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
          locations: [
            { location: "Head", armor_points: 0 },
            { location: "Center Torso", armor_points: 0, rear_armor_points: 0 },
            { location: "Left Torso", armor_points: 0, rear_armor_points: 0 },
            { location: "Right Torso", armor_points: 0, rear_armor_points: 0 },
            { location: "Left Arm", armor_points: 0 },
            { location: "Right Arm", armor_points: 0 },
            { location: "Left Leg", armor_points: 0 },
            { location: "Right Leg", armor_points: 0 }
          ]
        },
        weapons_and_equipment: [],
        criticals: [
          { 
            location: "Head", 
            slots: [
              { index: 0, name: "Life Support", type: "system" as const, isFixed: true },
              { index: 1, name: "Sensors", type: "system" as const, isFixed: true },
              { index: 2, name: "Cockpit", type: "system" as const, isFixed: true },
              { index: 3, name: "-Empty-", type: "empty" as const, isFixed: false },
              { index: 4, name: "Sensors", type: "system" as const, isFixed: true },
              { index: 5, name: "Life Support", type: "system" as const, isFixed: true }
            ] as CriticalSlotItem[]
          },
          { 
            location: "Center Torso", 
            slots: Array(12).fill(null).map((_, i) => ({ 
              index: i, 
              name: "-Empty-", 
              type: "empty" as const, 
              isFixed: false 
            })) as CriticalSlotItem[]
          },
          { 
            location: "Left Torso", 
            slots: Array(12).fill(null).map((_, i) => ({ 
              index: i, 
              name: "-Empty-", 
              type: "empty" as const, 
              isFixed: false 
            })) as CriticalSlotItem[]
          },
          { 
            location: "Right Torso", 
            slots: Array(12).fill(null).map((_, i) => ({ 
              index: i, 
              name: "-Empty-", 
              type: "empty" as const, 
              isFixed: false 
            })) as CriticalSlotItem[]
          },
          { 
            location: "Left Arm", 
            slots: [
              { index: 0, name: "Shoulder", type: "system" as const, isFixed: true },
              { index: 1, name: "Upper Arm Actuator", type: "system" as const, isFixed: true },
              { index: 2, name: "Lower Arm Actuator", type: "system" as const, isFixed: false },
              { index: 3, name: "Hand Actuator", type: "system" as const, isFixed: false },
              ...Array(8).fill(null).map((_, i) => ({ 
                index: i + 4, 
                name: "-Empty-", 
                type: "empty" as const, 
                isFixed: false 
              }))
            ] as CriticalSlotItem[]
          },
          { 
            location: "Right Arm", 
            slots: [
              { index: 0, name: "Shoulder", type: "system" as const, isFixed: true },
              { index: 1, name: "Upper Arm Actuator", type: "system" as const, isFixed: true },
              { index: 2, name: "Lower Arm Actuator", type: "system" as const, isFixed: false },
              { index: 3, name: "Hand Actuator", type: "system" as const, isFixed: false },
              ...Array(8).fill(null).map((_, i) => ({ 
                index: i + 4, 
                name: "-Empty-", 
                type: "empty" as const, 
                isFixed: false 
              }))
            ] as CriticalSlotItem[]
          },
          { 
            location: "Left Leg", 
            slots: [
              { index: 0, name: "Hip", type: "system" as const, isFixed: true },
              { index: 1, name: "Upper Leg Actuator", type: "system" as const, isFixed: true },
              { index: 2, name: "Lower Leg Actuator", type: "system" as const, isFixed: true },
              { index: 3, name: "Foot Actuator", type: "system" as const, isFixed: true },
              { index: 4, name: "-Empty-", type: "empty" as const, isFixed: false },
              { index: 5, name: "-Empty-", type: "empty" as const, isFixed: false }
            ] as CriticalSlotItem[]
          },
          { 
            location: "Right Leg", 
            slots: [
              { index: 0, name: "Hip", type: "system" as const, isFixed: true },
              { index: 1, name: "Upper Leg Actuator", type: "system" as const, isFixed: true },
              { index: 2, name: "Lower Leg Actuator", type: "system" as const, isFixed: true },
              { index: 3, name: "Foot Actuator", type: "system" as const, isFixed: true },
              { index: 4, name: "-Empty-", type: "empty" as const, isFixed: false },
              { index: 5, name: "-Empty-", type: "empty" as const, isFixed: false }
            ] as CriticalSlotItem[]
          }
        ]
      },
      armorAllocation: {
        "Head": { front: 0, maxArmor: 9, type: standardArmor },
        "Center Torso": { front: 0, rear: 0, maxArmor: 16, type: standardArmor },
        "Left Torso": { front: 0, rear: 0, maxArmor: 12, type: standardArmor },
        "Right Torso": { front: 0, rear: 0, maxArmor: 12, type: standardArmor },
        "Left Arm": { front: 0, maxArmor: 8, type: standardArmor },
        "Right Arm": { front: 0, maxArmor: 8, type: standardArmor },
        "Left Leg": { front: 0, maxArmor: 12, type: standardArmor },
        "Right Leg": { front: 0, maxArmor: 12, type: standardArmor }
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

  // Initialize with one tab
  const initialUnit = migrateUnitToSystemComponents(createEditableUnit());
  const [tabs, setTabs] = useState<TabData[]>([
    {
      id: `tab-${Date.now()}`,
      unit: initialUnit,
      title: `${initialUnit.chassis} ${initialUnit.model}`,
      isModified: false,
    }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [unitToSave, setUnitToSave] = useState<EditableUnit | null>(null);

  const handleUnitChange = (updatedUnit: EditableUnit) => {
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTabId 
          ? { 
              ...tab, 
              unit: updatedUnit, 
              isModified: true,
              title: `${updatedUnit.chassis} ${updatedUnit.model}`
            }
          : tab
      )
    );
  };

  const handleNewTab = () => {
    const newUnit = migrateUnitToSystemComponents(createNewMech());
    const newTab: TabData = {
      id: `tab-${Date.now()}`,
      unit: newUnit,
      title: 'New Mek',
      isModified: false,
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleSaveUnit = async (unit: EditableUnit) => {
    setUnitToSave(unit);
    setSaveDialogOpen(true);
  };

  const handleSaveDialogConfirm = (chassis: string, model: string, notes?: string) => {
    if (!unitToSave) return;
    
    const isStandardUnit = !unitToSave.id.startsWith('unit-') && !unitToSave.id.includes('custom');
    
    // Create the updated unit with new chassis/model
    const savedUnit: EditableUnit = {
      ...unitToSave,
      chassis,
      model,
      id: isStandardUnit ? `custom-${Date.now()}` : unitToSave.id,
      editorMetadata: {
        ...unitToSave.editorMetadata,
        isCustom: true,
        originalUnit: isStandardUnit ? `${unitToSave.chassis} ${unitToSave.model}` : unitToSave.editorMetadata.originalUnit,
        customNotes: notes || unitToSave.editorMetadata.customNotes,
        lastModified: new Date(),
        isDirty: false
      }
    };
    
    // Update unit data as well
    if (savedUnit.data) {
      savedUnit.data.chassis = chassis;
      savedUnit.data.model = model;
    }
    
    // Update the tab with the saved unit
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTabId 
          ? { 
              ...tab, 
              unit: savedUnit, 
              title: `${savedUnit.chassis} ${savedUnit.model}`,
              isModified: false 
            }
          : tab
      )
    );
    
    // Save the unit (in real app, this would call an API)
    console.log('Saving unit:', savedUnit);
    alert(`Unit "${savedUnit.chassis} ${savedUnit.model}" saved successfully!`);
    
    setSaveDialogOpen(false);
    setUnitToSave(null);
  };

  const handleCloseTab = (tabId: string) => {
    if (tabs.length === 1) return; // Don't close the last tab
    
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);

    // If closing the active tab, activate adjacent tab
    if (tabId === activeTabId && newTabs.length > 0) {
      const newIndex = Math.min(tabIndex, newTabs.length - 1);
      setActiveTabId(newTabs[newIndex].id);
    }
  };

  const activeTab = tabs.find(t => t.id === activeTabId);

  // No URL management for unit tabs - the 'tab' parameter is used by editor tabs

  return (
    <>
      <Head>
        <title>MegaMekLab Unit Editor | BattleTech Editor</title>
        <meta name="description" content="Complete MegaMekLab-compatible unit editor with armor allocation, equipment management, and critical slot assignment." />
      </Head>
      
      <div className="min-h-screen bg-slate-900">
        {/* Tab Bar - Similar to MegaMekLab */}
        <div className="bg-slate-800 border-b border-slate-600 flex items-center">
          <div className="flex-1 flex items-center overflow-x-auto">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex items-center px-3 py-2 border-r border-slate-600 cursor-pointer hover:bg-slate-700 ${
                  tab.id === activeTabId ? 'bg-slate-700 border-b-2 border-blue-500' : ''
                }`}
                onClick={() => setActiveTabId(tab.id)}
              >
                <span className="text-sm text-slate-200 whitespace-nowrap">
                  {tab.isModified && <span className="text-yellow-500 mr-1">●</span>}
                  {tab.title}
                </span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseTab(tab.id);
                    }}
                    className="ml-2 text-slate-400 hover:text-slate-200"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={handleNewTab}
            className="px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            title="New Mek"
          >
            +
          </button>
        </div>

        {/* Editor Content */}
        {activeTab && (
          <UnitEditorWrapper
            unit={activeTab.unit}
            onUnitChange={handleUnitChange}
            onSave={handleSaveUnit}
            readOnly={false}
          />
        )}
        
        {/* Save Unit Dialog */}
        {unitToSave && (
          <SaveUnitDialog
            isOpen={saveDialogOpen}
            onClose={() => {
              setSaveDialogOpen(false);
              setUnitToSave(null);
            }}
            onSave={handleSaveDialogConfirm}
            originalChassis={unitToSave.chassis}
            originalModel={unitToSave.model}
            isStandardUnit={!unitToSave.id.startsWith('unit-') && !unitToSave.id.includes('custom')}
          />
        )}
      </div>
    </>
  );
};

export default CustomizerPage;
