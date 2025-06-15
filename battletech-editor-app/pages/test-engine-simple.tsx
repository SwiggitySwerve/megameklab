import React, { useState } from 'react';
import Head from 'next/head';
import { EditableUnit } from '../types/editor';
import { UnitDataProvider, useUnitData } from '../hooks/useUnitData';
import { migrateUnitToSystemComponents } from '../utils/componentValidation';

function TestContent() {
  const { state, updateEngine } = useUnitData();
  const [logs, setLogs] = useState<string[]>([]);

  const handleEngineTypeChange = (newType: string) => {
    const engineRating = state.unit.systemComponents?.engine?.rating || 200;
    updateEngine(newType, engineRating);
    
    setLogs(prev => [...prev, `Changed engine to: ${newType}`]);
  };

  const engineType = state.unit.systemComponents?.engine?.type || 'Standard';

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-white mb-4">Simple Engine Type Test</h1>
      
      <div className="bg-slate-800 rounded-lg p-4 mb-4">
        <h2 className="text-lg font-semibold text-white mb-2">Current Engine Type: {engineType}</h2>
        
        <div className="space-x-2">
          <button 
            onClick={() => handleEngineTypeChange('Standard')}
            className={`px-4 py-2 rounded ${engineType === 'Standard' ? 'bg-blue-600' : 'bg-slate-600'} text-white`}
          >
            Standard
          </button>
          <button 
            onClick={() => handleEngineTypeChange('XL')}
            className={`px-4 py-2 rounded ${engineType === 'XL' ? 'bg-blue-600' : 'bg-slate-600'} text-white`}
          >
            XL
          </button>
          <button 
            onClick={() => handleEngineTypeChange('Light')}
            className={`px-4 py-2 rounded ${engineType === 'Light' ? 'bg-blue-600' : 'bg-slate-600'} text-white`}
          >
            Light
          </button>
          <button 
            onClick={() => handleEngineTypeChange('XXL')}
            className={`px-4 py-2 rounded ${engineType === 'XXL' ? 'bg-blue-600' : 'bg-slate-600'} text-white`}
          >
            XXL
          </button>
        </div>
      </div>
      
      <div className="bg-slate-800 rounded-lg p-4 mb-4">
        <h2 className="text-lg font-semibold text-white mb-2">Critical Allocations:</h2>
        <pre className="text-xs text-slate-300 overflow-auto">
          {JSON.stringify(state.unit.criticalAllocations, null, 2)}
        </pre>
      </div>
      
      <div className="bg-slate-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-white mb-2">Change Log:</h2>
        <div className="text-sm text-slate-300 space-y-1">
          {logs.length === 0 ? (
            <p>No changes yet...</p>
          ) : (
            logs.map((log, index) => (
              <p key={index}>{index + 1}. {log}</p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function TestEngineSimple() {
  const createTestUnit = (): EditableUnit => {
    const unit: any = {
      id: `unit-${Date.now()}`,
      chassis: "Test",
      model: "TST-1",
      mul_id: "TST-1",
      mass: 50,
      era: "3025",
      tech_base: "Inner Sphere",
      rules_level: 1,
      source: "Test",
      role: "Test",
      data: {
        chassis: "Test",
        model: "TST-1",
        mul_id: "TST-1",
        config: "Biped",
        tech_base: "Inner Sphere",
        era: "3025",
        source: "Test",
        rules_level: 1,
        role: "Test",
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
        criticals: []
      }
    };
    
    return migrateUnitToSystemComponents(unit);
  };

  const [unit] = useState<EditableUnit>(createTestUnit());

  return (
    <>
      <Head>
        <title>Simple Engine Test</title>
      </Head>
      
      <div className="min-h-screen bg-slate-900">
        <UnitDataProvider initialUnit={unit} onUnitChange={() => {}}>
          <TestContent />
        </UnitDataProvider>
      </div>
    </>
  );
}
