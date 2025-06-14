/**
 * Unit Editor Component with Unified Data Model
 * Uses the useUnitData hook for centralized state management
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { EditableUnit } from '../../types/editor';
import { UnitDataProvider, useUnitData, useSystemComponents, useCriticalAllocations, useEquipment } from '../../hooks/useUnitData';
import { STRUCTURE_SLOT_REQUIREMENTS, ARMOR_SLOT_REQUIREMENTS, isSpecialComponent } from '../../types/systemComponents';
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
  const criticalAllocations = useCriticalAllocations();
  const equipment = useEquipment();
  
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
  
  // Calculate critical slot usage
  const calculateCriticalSlots = (): { total: number; required: number; assigned: number } => {
    let total = 78; // Standard battlemech has 78 critical slots
    let assigned = 0;
    let required = 0;
    
    // Count assigned slots
    if (criticalAllocations) {
      Object.values(criticalAllocations).forEach(locationSlots => {
        locationSlots.forEach(slot => {
          if (slot && slot.content && slot.content !== '') {
            assigned++;
          }
        });
      });
    }
    
    // Count total required slots from all sources
    
    // 1. Count equipment slots (excluding special components which are counted separately)
    if (equipment) {
      equipment.forEach(eq => {
        // Skip special components like Endo Steel and Ferro-Fibrous as they're counted via systemComponents
        if (!isSpecialComponent(eq.item_name) && !eq.item_name.includes('Heat Sink')) {
          const crits = typeof eq.crits === 'string' ? parseInt(eq.crits) : (eq.crits || 0);
          if (crits > 0) {
            required += crits;
          }
        }
      });
    }
    
    // 2. Count engine slots
    if (systemComponents?.engine) {
      const engineType = systemComponents.engine.type;
      if (engineType === 'XL') {
        required += 12; // 6 CT + 3 LT + 3 RT
      } else if (engineType === 'Light') {
        required += 10; // 6 CT + 2 LT + 2 RT
      } else if (engineType === 'XXL') {
        required += 12; // 6 CT + 3 LT + 3 RT
      } else if (engineType === 'Compact') {
        required += 3; // 3 CT
      } else {
        required += 6; // Standard engine: 6 CT
      }
    }
    
    // 3. Count gyro slots
    if (systemComponents?.gyro) {
      const gyroType = systemComponents.gyro.type;
      if (gyroType === 'XL') {
        required += 6;
      } else if (gyroType === 'Compact') {
        required += 2;
      } else {
        required += 4; // Standard, Heavy-Duty
      }
    }
    
    // 4. Count actuator slots (fixed components)
    // Each location has certain fixed actuators
    required += 2; // Head: Life Support (2 slots)
    required += 3; // Head: Sensors (3 slots)  
    required += 1; // Head: Cockpit (1 slot)
    required += 8; // Arms: 2 shoulders + 2 upper arms (4 slots each arm)
    required += 8; // Legs: 2 hips + 2 upper legs + 2 lower legs + 2 feet
    
    // Add lower arm and hand actuators if present
    if (systemComponents?.leftArmActuators) {
      if (systemComponents.leftArmActuators.hasLowerArm) required += 1;
      if (systemComponents.leftArmActuators.hasHand) required += 1;
    }
    if (systemComponents?.rightArmActuators) {
      if (systemComponents.rightArmActuators.hasLowerArm) required += 1;
      if (systemComponents.rightArmActuators.hasHand) required += 1;
    }
    
    // 5. Count structure special component slots
    if (systemComponents?.structure) {
      const structureType = systemComponents.structure.type;
      const structureSlots = STRUCTURE_SLOT_REQUIREMENTS[structureType] || 0;
      required += structureSlots;
    }
    
    // 6. Count armor special component slots
    if (systemComponents?.armor) {
      const armorType = systemComponents.armor.type;
      const armorReq = ARMOR_SLOT_REQUIREMENTS[armorType];
      if (armorReq) {
        // For Ferro-Fibrous, check if it's clan version
        if (armorType === 'Ferro-Fibrous' && unit.tech_base === 'Clan' && armorReq.clanSlots) {
          required += armorReq.clanSlots;
        } else {
          required += armorReq.slots;
        }
      }
    }
    
    // 7. Count heat sink slots
    if (systemComponents?.heatSinks) {
      const heatSinkType = systemComponents.heatSinks.type;
      const externalHeatSinks = systemComponents.heatSinks.externalRequired || 0;
      
      if (externalHeatSinks > 0) {
        if (heatSinkType === 'Double' || heatSinkType === 'Double (Clan)') {
          // Double heat sinks take 3 slots each (IS) or 2 slots each (Clan)
          const slotsPerHS = (heatSinkType === 'Double (Clan)' || unit.tech_base === 'Clan') ? 2 : 3;
          required += externalHeatSinks * slotsPerHS;
        } else {
          // Single and Compact heat sinks take 1 slot each
          required += externalHeatSinks;
        }
      }
    }
    
    return {
      total,
      required,
      assigned
    };
  };
  
  const currentWeight = calculateCurrentWeight();
  const heatBalance = calculateHeatBalance();
  const criticalSlots = calculateCriticalSlots();
  
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
            
            {/* Critical Slots */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Crits:</span>
              <span className={`font-medium ${
                criticalSlots.required > criticalSlots.total ? 'text-red-400' : 'text-slate-200'
              }`}>
                {criticalSlots.required} / {criticalSlots.total}
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
