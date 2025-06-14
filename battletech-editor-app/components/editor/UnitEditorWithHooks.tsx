/**
 * Unit Editor Component with Unified Data Model
 * Uses the useUnitData hook for centralized state management
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { EditableUnit } from '../../types/editor';
import { UnitDataProvider, useUnitData, useSystemComponents } from '../../hooks/useUnitData';
import StructureTabWithHooks from './tabs/StructureTabWithHooks';
import ArmorTabWithHooks from './tabs/ArmorTabWithHooks';
import EquipmentTabWithHooks from './tabs/EquipmentTabWithHooks';
import CriticalsTabWithHooks from './tabs/CriticalsTabWithHooks';
import FluffTabWithHooks from './tabs/FluffTabWithHooks';

interface UnitEditorWithHooksProps {
  unit: EditableUnit;
  onUnitChange: (unit: EditableUnit) => void;
  readOnly?: boolean;
}

// Inner component that uses the hook
function UnitEditorContent({ readOnly = false }: { readOnly?: boolean }) {
  const router = useRouter();
  const { state } = useUnitData();
  const systemComponents = useSystemComponents();
  
  // Valid tab IDs
  const validTabs = ['structure', 'armor', 'equipment', 'criticals', 'fluff'];
  
  // Get initial tab from URL or default to 'structure'
  const getInitialTab = () => {
    const tabFromUrl = router.query.tab as string;
    return validTabs.includes(tabFromUrl) ? tabFromUrl : 'structure';
  };
  
  const [activeTab, setActiveTab] = useState<string>(getInitialTab());
  
  // Update activeTab when URL changes
  useEffect(() => {
    const tabFromUrl = router.query.tab as string;
    if (tabFromUrl && validTabs.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [router.query.tab]);
  
  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    
    // Update URL without triggering navigation
    const newQuery = { ...router.query, tab: tabId };
    router.replace(
      {
        pathname: router.pathname,
        query: newQuery,
      },
      undefined,
      { shallow: true }
    );
  };
  
  const unit = state.unit;
  
  // Calculate unit statistics
  const calculateCurrentWeight = (): number => {
    let weight = 0;
    
    // Structure weight
    if (systemComponents?.structure) {
      weight += unit.mass * 0.1; // Simplified calculation
    }
    
    // Add equipment weight, armor weight, etc.
    // This is a simplified version - you'd want to calculate actual weights
    
    return weight;
  };
  
  const calculateHeatBalance = (): { generated: number; dissipated: number } => {
    const generated = 0; // Calculate from weapons
    const dissipated = (systemComponents?.heatSinks?.externalRequired || 0) + 10; // Engine heat sinks + external
    return { generated, dissipated };
  };
  
  const currentWeight = calculateCurrentWeight();
  const heatBalance = calculateHeatBalance();
  
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
    <div className="min-h-screen bg-slate-900">
      {/* Unit Information Banner */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Unit Name and Type */}
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-100">
              {unit.chassis} {unit.model}
            </h2>
            <span className="text-sm text-slate-400">
              {unit.mass}-ton {unit.tech_base} {unit.data?.config || 'BattleMech'}
            </span>
          </div>
          
          {/* Key Statistics */}
          <div className="flex items-center gap-6 text-sm">
            {/* Weight */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Weight:</span>
              <span className={`font-medium ${
                currentWeight > unit.mass ? 'text-red-400' : 'text-slate-200'
              }`}>
                {currentWeight.toFixed(1)} / {unit.mass} tons
              </span>
            </div>
            
            {/* Heat */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Heat:</span>
              <span className={`font-medium ${
                heatBalance.generated > heatBalance.dissipated ? 'text-orange-400' : 'text-green-400'
              }`}>
                {heatBalance.generated} / {heatBalance.dissipated}
              </span>
            </div>
            
            {/* Movement */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Movement:</span>
              <span className="font-medium text-slate-200">
                {unit.data?.movement?.walk_mp || 0}/{unit.data?.movement?.jump_mp || 0}
              </span>
            </div>
            
            {/* Rules Level */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Rules:</span>
              <span className="font-medium text-slate-200">
                {unit.rules_level || 'Standard'}
              </span>
            </div>
            
            {/* Era */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Era:</span>
              <span className="font-medium text-slate-200">
                {unit.era}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-700 bg-slate-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`
              px-6 py-3 text-sm font-medium transition-colors
              ${activeTab === tab.id 
                ? 'text-slate-100 border-b-2 border-blue-500 bg-slate-700/50' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
              }
            `}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="bg-slate-900">
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
