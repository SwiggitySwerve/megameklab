import React, { useState } from 'react';
import Head from 'next/head';
import UnitEditorWrapper from '../components/editor/UnitEditorWrapper';
import { EditableUnit } from '../types/editor';
import { migrateUnitToSystemComponents } from '../utils/componentValidation';

export default function TestEngineTypeChange() {
  // Create a test unit
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

  const [unit, setUnit] = useState<EditableUnit>(createTestUnit());
  const [logs, setLogs] = useState<string[]>([]);

  const handleUnitChange = (updatedUnit: EditableUnit) => {
    const engineType = updatedUnit.systemComponents?.engine?.type || 'Unknown';
    const gyroType = updatedUnit.systemComponents?.gyro?.type || 'Unknown';
    
    const logEntry = `Engine: ${engineType}, Gyro: ${gyroType}`;
    setLogs(prev => [...prev, logEntry]);
    setUnit(updatedUnit);
  };

  return (
    <>
      <Head>
        <title>Test Engine Type Change</title>
      </Head>
      
      <div className="min-h-screen bg-slate-900">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-white mb-4">Test Engine Type Change</h1>
          
          {/* Debug Info */}
          <div className="bg-slate-800 rounded-lg p-4 mb-4">
            <h2 className="text-lg font-semibold text-white mb-2">Current State:</h2>
            <div className="text-sm text-slate-300">
              <p>Engine Type: {unit.systemComponents?.engine?.type || 'Not set'}</p>
              <p>Engine Rating: {unit.systemComponents?.engine?.rating || 'Not set'}</p>
              <p>Gyro Type: {unit.systemComponents?.gyro?.type || 'Not set'}</p>
            </div>
          </div>
          
          {/* Change Log */}
          <div className="bg-slate-800 rounded-lg p-4 mb-4">
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
        
        {/* Editor */}
        <UnitEditorWrapper
          unit={unit}
          onUnitChange={handleUnitChange}
          readOnly={false}
        />
      </div>
    </>
  );
}
