import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Layout from '../components/common/Layout';
import { EditableUnit } from '../types/editor';
import { quickValidation } from '../utils/advancedValidation';

// Import all the Phase 5 components
import FluffTab from '../components/editor/tabs/FluffTab';
import QuirksTab from '../components/editor/tabs/QuirksTab';

const Phase5Demo: NextPage = () => {
  // Simple unit data for testing Phase 5 features
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
    armorAllocation: {},
    equipmentPlacements: [],
    criticalSlots: [],
    fluffData: {
      overview: 'The Atlas is the ultimate assault BattleMech, designed to be an unstoppable force on the battlefield.',
      capabilities: 'Armed with devastating weapons and protected by thick armor, the Atlas can engage any enemy.',
      deployment: 'Deployed by elite units and house regiments as the spearhead of major assaults.',
    },
    selectedQuirks: [],
    validationState: { isValid: true, errors: [], warnings: [] },
    editorMetadata: {
      lastModified: new Date(),
      isDirty: false,
      version: '1.0'
    }
  });

  const [activeFeature, setActiveFeature] = useState<string>('fluff');
  const [validationResult, setValidationResult] = useState<any>(null);

  // Handle unit changes
  const handleUnitChange = (updates: Partial<EditableUnit>) => {
    const updatedUnit = { ...unit, ...updates };
    setUnit(updatedUnit);
    
    // Update validation in real-time
    const validation = quickValidation(updatedUnit);
    setValidationResult(validation);
  };

  // Test validation function
  const handleTestValidation = () => {
    const validation = quickValidation(unit);
    setValidationResult(validation);
  };

  return (
    <>
      <Head>
        <title>Phase 5 Features Demo - BattleTech Editor</title>
      </Head>
      <Layout>
        <div className="min-h-screen bg-slate-900 text-slate-100">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-4">Phase 5 Features Demo</h1>
              <p className="text-slate-300 mb-4">
                Test the final Phase 5 features: Fluff Editor, Quirks Manager, and Advanced Validation.
              </p>
              
              {/* Feature Selection */}
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => setActiveFeature('fluff')}
                  className={`px-4 py-2 rounded font-medium ${
                    activeFeature === 'fluff'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Fluff Editor
                </button>
                <button
                  onClick={() => setActiveFeature('quirks')}
                  className={`px-4 py-2 rounded font-medium ${
                    activeFeature === 'quirks'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Quirks Manager
                </button>
                <button
                  onClick={() => setActiveFeature('validation')}
                  className={`px-4 py-2 rounded font-medium ${
                    activeFeature === 'validation'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Advanced Validation
                </button>
              </div>
            </div>

            {/* Feature Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-3">
                {activeFeature === 'fluff' && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Fluff Editor</h2>
                    <div className="bg-slate-800 rounded-lg p-4">
                      <FluffTab
                        unit={unit}
                        onUnitChange={handleUnitChange}
                        validationErrors={[]}
                        readOnly={false}
                      />
                    </div>
                  </div>
                )}

                {activeFeature === 'quirks' && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Quirks Manager</h2>
                    <div className="bg-slate-800 rounded-lg p-4">
                      <QuirksTab
                        unit={unit}
                        onUnitChange={handleUnitChange}
                        validationErrors={[]}
                        readOnly={false}
                      />
                    </div>
                  </div>
                )}

                {activeFeature === 'validation' && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Advanced Validation</h2>
                    <div className="bg-slate-800 rounded-lg p-6">
                      <div className="mb-6">
                        <button
                          onClick={handleTestValidation}
                          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          Run Validation Check
                        </button>
                      </div>

                      {validationResult ? (
                        <div className="space-y-4">
                          <div className={`flex items-center text-lg ${validationResult.isValid ? 'text-green-400' : 'text-red-400'}`}>
                            <span className="mr-2">
                              {validationResult.isValid ? '✓' : '✗'}
                            </span>
                            Unit is {validationResult.isValid ? 'valid' : 'invalid'}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-slate-700 p-4 rounded">
                              <h3 className="font-medium text-red-400 mb-2">Errors</h3>
                              <div className="text-2xl font-bold">{validationResult.errorCount || 0}</div>
                              <div className="text-sm text-slate-400">Critical issues</div>
                            </div>
                            
                            <div className="bg-slate-700 p-4 rounded">
                              <h3 className="font-medium text-yellow-400 mb-2">Warnings</h3>
                              <div className="text-2xl font-bold">{validationResult.warningCount || 0}</div>
                              <div className="text-sm text-slate-400">Optimization suggestions</div>
                            </div>
                            
                            <div className="bg-slate-700 p-4 rounded">
                              <h3 className="font-medium text-blue-400 mb-2">Battle Value</h3>
                              <div className="text-2xl font-bold">{validationResult.battleValue || 'N/A'}</div>
                              <div className="text-sm text-slate-400">Estimated BV</div>
                            </div>
                          </div>

                          {validationResult.suggestions && validationResult.suggestions.length > 0 && (
                            <div>
                              <h3 className="font-medium mb-2">Optimization Suggestions</h3>
                              <div className="space-y-2">
                                {validationResult.suggestions.slice(0, 5).map((suggestion: any, index: number) => (
                                  <div key={index} className="bg-slate-700 p-3 rounded">
                                    <div className="flex items-start">
                                      <span className={`mr-2 text-xs px-2 py-1 rounded ${
                                        suggestion.severity === 'major' ? 'bg-red-600' :
                                        suggestion.severity === 'minor' ? 'bg-yellow-600' : 'bg-blue-600'
                                      }`}>
                                        {suggestion.severity}
                                      </span>
                                      <div>
                                        <div className="font-medium">{suggestion.message}</div>
                                        {suggestion.explanation && (
                                          <div className="text-sm text-slate-400 mt-1">{suggestion.explanation}</div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-slate-400 text-center py-8">
                          Click "Run Validation Check" to test the advanced validation system
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Info Panel */}
              <div className="lg:col-span-1">
                <div className="bg-slate-800 rounded-lg p-4 sticky top-4">
                  <h3 className="font-semibold mb-3">Unit Info</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-slate-400">Chassis:</span> {unit.chassis}</div>
                    <div><span className="text-slate-400">Model:</span> {unit.model}</div>
                    <div><span className="text-slate-400">Mass:</span> {unit.mass} tons</div>
                    <div><span className="text-slate-400">Tech Base:</span> {unit.tech_base}</div>
                    <div><span className="text-slate-400">Era:</span> {unit.era}</div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Current Fluff Sections</h4>
                    <div className="space-y-1 text-xs">
                      {Object.entries(unit.fluffData || {}).map(([key, value]) => (
                        <div key={key} className={value ? 'text-green-400' : 'text-slate-500'}>
                          {key}: {value ? '✓' : '○'}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Selected Quirks</h4>
                    <div className="text-xs">
                      {unit.selectedQuirks && unit.selectedQuirks.length > 0 ? (
                        unit.selectedQuirks.map((quirk, index) => (
                          <div key={index} className={`mb-1 ${
                            quirk.category === 'positive' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {quirk.name}
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500">No quirks selected</div>
                      )}
                    </div>
                  </div>

                  {validationResult && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-2">Quick Status</h4>
                      <div className={`text-sm ${validationResult.isValid ? 'text-green-400' : 'text-red-400'}`}>
                        {validationResult.isValid ? '✓ Unit Valid' : '✗ Has Issues'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Feature Guide */}
                <div className="bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-4 mt-6">
                  <h4 className="font-medium mb-2">Phase 5 Features</h4>
                  <div className="text-xs space-y-1">
                    <div><strong>Fluff Editor:</strong></div>
                    <div>• Multi-section text editor</div>
                    <div>• Import/export capability</div>
                    <div>• Word count tracking</div>
                    <div>• Auto-save functionality</div>
                    
                    <div className="mt-2"><strong>Quirks Manager:</strong></div>
                    <div>• 70+ quirks database</div>
                    <div>• Search and filter</div>
                    <div>• Conflict detection</div>
                    <div>• Weapon-specific quirks</div>
                    
                    <div className="mt-2"><strong>Advanced Validation:</strong></div>
                    <div>• BattleTech rule compliance</div>
                    <div>• Battle value calculation</div>
                    <div>• Optimization suggestions</div>
                    <div>• Real-time error checking</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Testing Instructions */}
            <div className="mt-8 bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Testing Instructions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-2 text-blue-400">Fluff Editor Test</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Switch between fluff sections using tabs</li>
                    <li>Add content to see word count update</li>
                    <li>Export fluff to text file</li>
                    <li>Try importing a text file</li>
                    <li>View live preview</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2 text-green-400">Quirks Manager Test</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Search for specific quirks</li>
                    <li>Add positive and negative quirks</li>
                    <li>Try adding conflicting quirks</li>
                    <li>Add weapon-specific quirks</li>
                    <li>Check balance recommendations</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2 text-purple-400">Validation Test</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Run validation check</li>
                    <li>Review error and warning counts</li>
                    <li>Read optimization suggestions</li>
                    <li>Check battle value calculation</li>
                    <li>Modify unit and re-validate</li>
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

export default Phase5Demo;
