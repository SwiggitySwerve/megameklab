import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Layout from '../components/common/Layout';
import { EditableUnit } from '../types/editor';
import { performAdvancedValidation, quickValidation } from '../utils/advancedValidation';
import { exportUnit, importUnit, downloadUnit } from '../utils/unitExportImportProper';

// Import all the Phase 5 components
import FluffTab from '../components/editor/tabs/FluffTab';
import QuirksTab from '../components/editor/tabs/QuirksTab';
import StructureArmorTab from '../components/editor/tabs/StructureArmorTab';
import EquipmentTab from '../components/editor/tabs/EquipmentTab';
import CriticalsTab from '../components/editor/tabs/CriticalsTab';
import PreviewTab from '../components/editor/tabs/PreviewTab';

// Import enhanced components
import InteractiveMechArmorDiagram from '../components/editor/armor/InteractiveMechArmorDiagram';
import MechCriticalsAllocationGrid from '../components/editor/criticals/MechCriticalsAllocationGrid';

// Import auto-allocation utilities
import { autoAllocateArmor } from '../utils/armorAutoAllocation';
import { autoAllocateEquipment } from '../utils/criticalAutoAllocation';

const CompleteEditorDemo: NextPage = () => {
  // Sample unit data for testing
  const [unit, setUnit] = useState<EditableUnit>({
    id: 'demo-atlas',
    chassis: 'Atlas',
    model: 'AS7-D',
    mul_id: '204',
    mass: 100,
    tech_base: 'Inner Sphere',
    era: '3025',
    source: 'TRO:3025',
    rules_level: 'Standard',
    role: 'Juggernaut',
    data: {
      chassis: 'Atlas',
      model: 'AS7-D',
      mass: 100,
      tech_base: 'Inner Sphere',
      era: '3025',
      source: 'TRO:3025',
      rules_level: 'Standard',
      config: 'Biped',
      engine: {
        type: 'Fusion',
        rating: 300,
      },
      structure: {
        type: 'Standard',
      },
      armor: {
        type: 'Standard',
        locations: [],
        total_armor_points: 304
      },
      heat_sinks: {
        type: 'Single',
        count: 20,
      },
      movement: {
        walk_mp: 3,
        jump_mp: 0,
      },
      weapons_and_equipment: [],
      criticals: [],
    },
    armorAllocation: {
      head: { front: 9, maxArmor: 9, type: { id: 'standard', name: 'Standard', pointsPerTon: 16, criticalSlots: 0, techLevel: 'Introductory', isClan: false, isInner: true } },
      center_torso: { front: 47, rear: 12, maxArmor: 63, type: { id: 'standard', name: 'Standard', pointsPerTon: 16, criticalSlots: 0, techLevel: 'Introductory', isClan: false, isInner: true } },
      left_torso: { front: 32, rear: 10, maxArmor: 42, type: { id: 'standard', name: 'Standard', pointsPerTon: 16, criticalSlots: 0, techLevel: 'Introductory', isClan: false, isInner: true } },
      right_torso: { front: 32, rear: 10, maxArmor: 42, type: { id: 'standard', name: 'Standard', pointsPerTon: 16, criticalSlots: 0, techLevel: 'Introductory', isClan: false, isInner: true } },
      left_arm: { front: 34, maxArmor: 34, type: { id: 'standard', name: 'Standard', pointsPerTon: 16, criticalSlots: 0, techLevel: 'Introductory', isClan: false, isInner: true } },
      right_arm: { front: 34, maxArmor: 34, type: { id: 'standard', name: 'Standard', pointsPerTon: 16, criticalSlots: 0, techLevel: 'Introductory', isClan: false, isInner: true } },
      left_leg: { front: 41, maxArmor: 41, type: { id: 'standard', name: 'Standard', pointsPerTon: 16, criticalSlots: 0, techLevel: 'Introductory', isClan: false, isInner: true } },
      right_leg: { front: 41, maxArmor: 41, type: { id: 'standard', name: 'Standard', pointsPerTon: 16, criticalSlots: 0, techLevel: 'Introductory', isClan: false, isInner: true } },
    },
    equipmentPlacements: [
      {
        id: '1',
        equipment: { id: 'ac20', name: 'AC/20', type: 'weapon', damage: 20, heat: 7, weight: 14 },
        location: 'right_torso',
        criticalSlots: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      },
      {
        id: '2',
        equipment: { id: 'lrm20', name: 'LRM 20', type: 'weapon', damage: 20, heat: 6, weight: 10 },
        location: 'left_torso',
        criticalSlots: [1, 2, 3, 4, 5]
      }
    ],
    criticalSlots: [],
    fluffData: {
      overview: 'The Atlas is the ultimate assault BattleMech, designed to be an unstoppable force on the battlefield.',
      capabilities: 'Armed with devastating weapons and protected by thick armor, the Atlas can engage any enemy.',
      deployment: 'Deployed by elite units and house regiments as the spearhead of major assaults.',
    },
    selectedQuirks: [
      { id: '1', name: 'Command Mek', category: 'positive', cost: 0, description: 'Improves coordination with other units' },
      { id: '2', name: 'Hard to Pilot', category: 'negative', cost: 0, description: 'Requires skilled pilots' }
    ],
    validationState: { isValid: true, errors: [], warnings: [] },
    editorMetadata: {
      lastModified: new Date(),
      isDirty: false,
      version: '1.0'
    }
  });

  const [activeTab, setActiveTab] = useState<string>('structure');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('center_torso');

  // Tab definitions
  const tabs = [
    { id: 'structure', name: 'Structure/Armor', component: StructureArmorTab },
    { id: 'equipment', name: 'Equipment', component: EquipmentTab },
    { id: 'criticals', name: 'Criticals', component: CriticalsTab },
    { id: 'fluff', name: 'Fluff', component: FluffTab },
    { id: 'quirks', name: 'Quirks', component: QuirksTab },
    { id: 'preview', name: 'Preview', component: PreviewTab },
  ];

  // Handle unit changes
  const handleUnitChange = (updates: Partial<EditableUnit>) => {
    const updatedUnit = { ...unit, ...updates };
    setUnit(updatedUnit);
    
    // Update validation in real-time
    const validation = quickValidation(updatedUnit);
    setValidationResult(validation);
  };

  // Auto-allocation functions
  const handleAutoAllocateArmor = () => {
    try {
      const allocation = autoAllocateArmor(unit.mass, 304, {
        distributeByIS: true,
        maximizeHead: true,
        balanceTorsos: true
      });
      
      // Convert array to object format
      const allocationObject: any = {};
      if (Array.isArray(allocation)) {
        allocation.forEach(alloc => {
          allocationObject[alloc.location] = {
            front: alloc.front,
            rear: alloc.rear,
            maxArmor: alloc.maxArmor || 50,
            type: alloc.type || { id: 'standard', name: 'Standard', pointsPerTon: 16, criticalSlots: 0, techLevel: 'Introductory', isClan: false, isInner: true }
          };
        });
      } else {
        Object.assign(allocationObject, allocation);
      }
      
      handleUnitChange({ armorAllocation: allocationObject });
    } catch (error) {
      console.error('Auto-allocation failed:', error);
    }
  };

  const handleAutoAllocateEquipment = () => {
    try {
      // Extract equipment from placements for auto-allocation
      const equipment = unit.equipmentPlacements?.map(p => p.equipment) || [];
      
      const criticals = autoAllocateEquipment(
        equipment,
        unit.criticalSlots || [],
        {
          fillUnhittables: true,
          prioritizeSymmetry: true,
          balanceWeight: true
        }
      );
      
      // Convert to proper format
      const criticalSlots = criticals.map((crit: any, index: number) => ({
        location: crit.location || 'center_torso',
        slotIndex: crit.slot || index,
        equipment: crit.equipment,
        systemType: crit.systemType,
        isFixed: crit.isFixed || false,
        isEmpty: !crit.equipment
      }));
      
      handleUnitChange({ criticalSlots });
    } catch (error) {
      console.error('Equipment allocation failed:', error);
    }
  };

  // Validation functions
  const handleFullValidation = () => {
    const result = performAdvancedValidation(unit, {
      strictMode: true,
      eraRestrictions: true,
      customRules: false,
      experimentalTech: false,
      skipCostValidation: false
    });
    setValidationResult(result);
  };

  // Save/Load functions
  const handleExport = (format: 'json' | 'mtf' | 'blk') => {
    try {
      downloadUnit(unit, format);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const importedUnit = importUnit(content, file.name);
        setUnit(importedUnit);
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <>
      <Head>
        <title>Complete MegaMekLab Editor Demo - BattleTech Editor</title>
      </Head>
      <Layout>
        <div className="min-h-screen bg-slate-900 text-slate-100">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-4">Complete MegaMekLab Editor Demo</h1>
              <p className="text-slate-300 mb-4">
                This demo showcases all implemented features from all 5 phases of development.
                Test all components, auto-allocation, validation, and file I/O here.
              </p>
              
              {/* Control Panel */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Auto-Allocation</h3>
                  <div className="space-y-2">
                    <button
                      onClick={handleAutoAllocateArmor}
                      className="w-full px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Auto-Allocate Armor
                    </button>
                    <button
                      onClick={handleAutoAllocateEquipment}
                      className="w-full px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Auto-Allocate Equipment
                    </button>
                  </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Validation</h3>
                  <button
                    onClick={handleFullValidation}
                    className="w-full px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Run Full Validation
                  </button>
                  {validationResult && (
                    <div className="mt-2 text-xs">
                      <div className={validationResult.isValid ? 'text-green-400' : 'text-red-400'}>
                        {validationResult.isValid ? '✓ Valid' : '✗ Invalid'}
                      </div>
                      <div>Errors: {validationResult.errorCount || 0}</div>
                      <div>Warnings: {validationResult.warningCount || 0}</div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Export</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleExport('mtf')}
                      className="w-full px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
                    >
                      Export MTF
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
                    >
                      Export JSON
                    </button>
                    <button
                      onClick={() => handleExport('blk')}
                      className="w-full px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
                    >
                      Export BLK
                    </button>
                  </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Import</h3>
                  <label className="w-full px-3 py-1 text-sm bg-teal-600 text-white rounded hover:bg-teal-700 cursor-pointer block text-center">
                    Import Unit File
                    <input
                      type="file"
                      accept=".mtf,.json,.blk"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-slate-600 mb-6">
              <nav className="flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Tab Content */}
              <div className="lg:col-span-2">
                {ActiveTabComponent && (
                  <ActiveTabComponent
                    unit={unit}
                    onUnitChange={handleUnitChange}
                    validationErrors={validationResult?.errors || []}
                    readOnly={false}
                  />
                )}
              </div>

              {/* Side Panel with Visual Components */}
              <div className="space-y-6">
                {/* Interactive Armor Diagram */}
                <div className="bg-slate-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Interactive Armor Diagram</h3>
                  <div className="text-sm text-slate-400 mb-2">
                    Click on armor locations to edit values
                  </div>
                  <div className="bg-slate-700 p-4 rounded">
                    <div className="text-center mb-4">
                      <div className="text-lg font-bold">{unit.chassis} {unit.model}</div>
                      <div className="text-sm text-slate-400">{unit.mass} tons</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {Object.entries(unit.armorAllocation || {}).map(([location, allocation]) => (
                        <div 
                          key={location}
                          className={`p-2 rounded cursor-pointer ${
                            selectedLocation === location ? 'bg-blue-600' : 'bg-slate-600 hover:bg-slate-500'
                          }`}
                          onClick={() => setSelectedLocation(location)}
                        >
                          <div className="font-medium">{location.replace('_', ' ')}</div>
                          <div>Front: {allocation.front}</div>
                          {allocation.rear !== undefined && (
                            <div>Rear: {allocation.rear}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Critical Slots Grid */}
                <div className="bg-slate-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Critical Slots - {selectedLocation}</h3>
                  <div className="text-sm text-slate-400 mb-2">
                    Equipment placement for {selectedLocation.replace('_', ' ')}
                  </div>
                  <div className="bg-slate-700 p-4 rounded">
                    <div className="space-y-1">
                      {Array.from({ length: 12 }, (_, i) => {
                        const slot = unit.criticalSlots?.find(cs => 
                          cs.location === selectedLocation && cs.slotIndex === i
                        );
                        return (
                          <div 
                            key={i}
                            className={`p-2 text-xs rounded ${
                              slot?.equipment 
                                ? 'bg-green-600' 
                                : slot?.isFixed 
                                  ? 'bg-orange-600' 
                                  : 'bg-slate-600'
                            }`}
                          >
                            {slot?.equipment?.name || slot?.systemType || `Slot ${i + 1}: Empty`}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Validation Summary */}
                {validationResult && (
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Validation Results</h3>
                    <div className="space-y-2 text-sm">
                      <div className={`flex items-center ${validationResult.isValid ? 'text-green-400' : 'text-red-400'}`}>
                        <span className="mr-2">
                          {validationResult.isValid ? '✓' : '✗'}
                        </span>
                        Unit is {validationResult.isValid ? 'valid' : 'invalid'}
                      </div>
                      
                      {validationResult.criticalErrors?.length > 0 && (
                        <div>
                          <div className="text-red-400 font-medium">Critical Errors:</div>
                          {validationResult.criticalErrors.slice(0, 3).map((error: any, index: number) => (
                            <div key={index} className="text-red-300 text-xs ml-2">
                              • {error.message}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {validationResult.warnings?.length > 0 && (
                        <div>
                          <div className="text-yellow-400 font-medium">Warnings:</div>
                          {validationResult.warnings.slice(0, 3).map((warning: any, index: number) => (
                            <div key={index} className="text-yellow-300 text-xs ml-2">
                              • {warning.message}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {validationResult.suggestions?.length > 0 && (
                        <div>
                          <div className="text-blue-400 font-medium">Suggestions:</div>
                          {validationResult.suggestions.slice(0, 3).map((suggestion: any, index: number) => (
                            <div key={index} className="text-blue-300 text-xs ml-2">
                              • {suggestion.message}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {validationResult.battleValue && (
                        <div className="text-slate-300">
                          Battle Value: {validationResult.battleValue}
                        </div>
                      )}
                      
                      {validationResult.cost && (
                        <div className="text-slate-300">
                          Cost: {validationResult.cost.toLocaleString()} C-Bills
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Feature Testing Guide */}
            <div className="mt-8 bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Testing Guide</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Phase 4 Features (Auto-Allocation)</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Click "Auto-Allocate Armor" to test armor distribution</li>
                    <li>Click "Auto-Allocate Equipment" to test equipment placement</li>
                    <li>Try drag & drop in the criticals section</li>
                    <li>Interactive armor diagram with click-to-edit</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Phase 5 Features (Polish)</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Fluff tab: Rich text editor with import/export</li>
                    <li>Quirks tab: Search and manage positive/negative quirks</li>
                    <li>Validation: Real-time BattleTech rule compliance</li>
                    <li>Export/Import: MTF, JSON, and BLK format support</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default CompleteEditorDemo;
