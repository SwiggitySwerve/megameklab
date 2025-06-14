/**
 * Unified Data Model Demo
 * Demonstrates the hooks-based architecture with centralized state management
 */

import React, { useState } from 'react';
import { EditableUnit } from '../types/editor';
import UnitEditorWithHooks from '../components/editor/UnitEditorWithHooks';
import styles from '../styles/demo.module.css';

export default function UnifiedDataDemo() {
  // Create a test unit
  const createTestUnit = (): EditableUnit => ({
    id: 'test-mech-unified',
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
        type: 'XL',
        rating: 300,
      },
      structure: {
        type: 'Standard',
      },
      heat_sinks: {
        type: 'Double',
        count: 20,
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
      criticals: [],
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

  const [unit, setUnit] = useState<EditableUnit>(createTestUnit());
  const [stateJson, setStateJson] = useState<string>('');
  const [showStateDebug, setShowStateDebug] = useState(false);

  const handleUnitChange = (updatedUnit: EditableUnit) => {
    setUnit(updatedUnit);
    
    // Update debug JSON display
    if (showStateDebug) {
      const debugState = {
        systemComponents: updatedUnit.systemComponents,
        criticalAllocations: updatedUnit.criticalAllocations ? 
          Object.entries(updatedUnit.criticalAllocations).reduce((acc, [loc, slots]) => ({
            ...acc,
            [loc]: slots.map(s => s.content || '-Empty-').slice(0, 6) + (slots.length > 6 ? '...' : '')
          }), {}) : null,
        equipment: updatedUnit.data?.weapons_and_equipment?.map(eq => ({
          name: eq.item_name,
          location: eq.location || 'unallocated'
        })),
        validation: updatedUnit.validationState,
      };
      setStateJson(JSON.stringify(debugState, null, 2));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Unified Data Model Demo</h1>
        <p className={styles.subtitle}>
          This demo showcases the new hooks-based architecture with centralized state management.
          All tabs automatically sync through the unified data model.
        </p>
      </div>

      <div className={styles.features}>
        <h2>Key Features:</h2>
        <ul>
          <li>✅ Centralized state management with React hooks</li>
          <li>✅ Automatic synchronization between all tabs</li>
          <li>✅ Real-time validation and error reporting</li>
          <li>✅ Automatic migration from legacy data formats</li>
          <li>✅ Engine/gyro/structure changes automatically update critical slots</li>
          <li>✅ Equipment changes sync between Equipment and Criticals tabs</li>
          <li>✅ Debounced validation for performance</li>
        </ul>
      </div>

      <div className={styles.controls}>
        <button
          onClick={() => setShowStateDebug(!showStateDebug)}
          className={styles.button}
        >
          {showStateDebug ? 'Hide' : 'Show'} State Debug
        </button>
        
        <button
          onClick={() => setUnit(createTestUnit())}
          className={styles.button}
        >
          Reset Unit
        </button>
      </div>

      {showStateDebug && (
        <div className={styles.debugSection}>
          <h3>Current State (Live Updates):</h3>
          <pre className={styles.codeBlock}>
            {stateJson || 'Make changes to see state updates...'}
          </pre>
        </div>
      )}

      <div className={styles.editorWrapper}>
        <UnitEditorWithHooks
          unit={unit}
          onUnitChange={handleUnitChange}
        />
      </div>

      <div className={styles.notes}>
        <h3>Implementation Notes:</h3>
        <ul>
          <li>The <code>useUnitData</code> hook provides centralized state management</li>
          <li>Each tab component uses specific hooks like <code>useSystemComponents</code>, <code>useCriticalAllocations</code>, etc.</li>
          <li>Changes in one tab automatically trigger updates in other tabs through the reducer</li>
          <li>The system automatically migrates legacy unit data to the new format</li>
          <li>Validation runs automatically after changes with a 500ms debounce</li>
        </ul>
      </div>

      <div className={styles.architecture}>
        <h3>Architecture Overview:</h3>
        <pre className={styles.codeBlock}>
{`UnitDataProvider (Context)
  ├── useReducer (State Management)
  ├── Auto-migration on mount
  ├── Auto-validation on changes
  └── Child Components
       ├── StructureTab
       │   └── useSystemComponents()
       ├── ArmorTab
       │   └── useArmorAllocation()
       ├── EquipmentTab
       │   └── useEquipment()
       ├── CriticalsTab
       │   ├── useCriticalAllocations()
       │   └── useEquipment()
       └── FluffTab
           └── useUnitData()`}
        </pre>
      </div>
    </div>
  );
}
