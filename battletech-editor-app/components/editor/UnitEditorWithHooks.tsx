/**
 * Unit Editor Component with Unified Data Model
 * Uses the useUnitData hook for centralized state management
 */

import React, { useState, useEffect } from 'react';
import { EditableUnit } from '../../types/editor';
import { UnitDataProvider } from '../../hooks/useUnitData';
import StructureTabWithHooks from './tabs/StructureTabWithHooks';
import ArmorTabWithHooks from './tabs/ArmorTabWithHooks';
import EquipmentTabWithHooks from './tabs/EquipmentTabWithHooks';
import CriticalsTabWithHooks from './tabs/CriticalsTabWithHooks';
import FluffTabWithHooks from './tabs/FluffTabWithHooks';
import styles from './UnitEditor.module.css';

interface UnitEditorWithHooksProps {
  unit: EditableUnit;
  onUnitChange: (unit: EditableUnit) => void;
  readOnly?: boolean;
}

// Inner component that uses the hook
function UnitEditorContent({ readOnly = false }: { readOnly?: boolean }) {
  const [activeTab, setActiveTab] = useState<string>('structure');
  
  // Tab configuration
  const tabs = [
    { id: 'structure', label: 'Structure', component: StructureTabWithHooks },
    { id: 'armor', label: 'Armor', component: ArmorTabWithHooks },
    { id: 'equipment', label: 'Equipment', component: EquipmentTabWithHooks },
    { id: 'criticals', label: 'Criticals', component: CriticalsTabWithHooks },
    { id: 'fluff', label: 'Fluff', component: FluffTabWithHooks },
  ];
  
  const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component || StructureTabWithHooks;
  
  return (
    <div className={styles.container}>
      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className={styles.tabContent}>
        <ActiveTabComponent readOnly={readOnly} />
      </div>
    </div>
  );
}

// Main component with provider
export default function UnitEditorWithHooks({ 
  unit, 
  onUnitChange, 
  readOnly = false 
}: UnitEditorWithHooksProps) {
  return (
    <UnitDataProvider initialUnit={unit} onUnitChange={onUnitChange}>
      <UnitEditorContent readOnly={readOnly} />
    </UnitDataProvider>
  );
}
