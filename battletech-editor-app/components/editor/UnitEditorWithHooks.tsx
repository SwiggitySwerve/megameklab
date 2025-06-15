/**
 * Unit Editor Component with Unified Data Model
 * Uses the useUnitData hook for centralized state management
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { EditableUnit } from '../../types/editor';
import { UnitDataProvider, useUnitData, useSystemComponents, useCriticalAllocations, useEquipment } from '../../hooks/useUnitData';
import { EquipmentCalculator, EquipmentCategory } from '../../types/equipmentInterfaces';
import { calculateEngineWeight } from '../../utils/engineCalculations';
import { calculateStructureWeight } from '../../utils/structureCalculations';
import { calculateArmorWeight, ARMOR_POINTS_PER_TON } from '../../utils/armorCalculations';
import { calculateGyroWeight } from '../../utils/gyroCalculations';
import { getCockpitWeight } from '../../utils/cockpitCalculations';
import { HEAT_DISSIPATION_RATES } from '../../utils/heatSinkCalculations';
import StructureTabWithHooks from './tabs/StructureTabWithHooks';
import ArmorTabWithHooks from './tabs/ArmorTabWithHooks';
import EquipmentTabWithHooks from './tabs/EquipmentTabWithHooks';
import CriticalsTabIntegrated from './tabs/CriticalsTabIntegrated';
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
  
  // Calculate unit statistics using unified equipment interface
  const calculateCurrentWeight = (): number => {
    let weight = 0;
    
    // Structure weight using utility function
    if (systemComponents?.structure) {
      weight += calculateStructureWeight(unit.mass, systemComponents.structure.type);
    }
    
    // Engine weight using utility function
    if (systemComponents?.engine) {
      weight += calculateEngineWeight(
        systemComponents.engine.rating, 
        unit.mass, 
        systemComponents.engine.type
      );
    }
    
    // Gyro weight using utility function
    if (systemComponents?.gyro && systemComponents?.engine) {
      weight += calculateGyroWeight(
        systemComponents.engine.rating, 
        systemComponents.gyro.type
      );
    }
    
    // Cockpit weight using utility function
    if (systemComponents?.cockpit) {
      weight += getCockpitWeight(systemComponents.cockpit.type);
    }
    
    // Armor weight using utility function
    if (unit.data?.armor) {
      let totalArmorPoints = 0;
      const armorData = unit.data.armor;
      
      // Sum all armor points from all locations
      Object.entries(armorData).forEach(([location, values]: [string, any]) => {
        if (typeof values === 'object' && values !== null) {
          totalArmorPoints += (values.front || 0) + (values.rear || 0);
        }
      });
      
      if (totalArmorPoints > 0 && systemComponents?.armor) {
        weight += calculateArmorWeight(totalArmorPoints, systemComponents.armor.type);
      }
    }
    
    // Get all equipment items and calculate their weight
    const allEquipment = EquipmentCalculator.getAllEquipmentItems(
      equipment || [],
      systemComponents,
      unit
    );
    
    // Add weight from all equipment (filtering out components already calculated above)
    const equipmentWeight = allEquipment
      .filter(item => 
        item.type !== EquipmentCategory.ENGINE &&
        item.type !== EquipmentCategory.GYRO &&
        item.type !== EquipmentCategory.COCKPIT &&
        item.type !== EquipmentCategory.ACTUATOR &&
        item.type !== EquipmentCategory.LIFE_SUPPORT &&
        item.type !== EquipmentCategory.SENSORS &&
        item.type !== EquipmentCategory.STRUCTURE &&
        item.type !== EquipmentCategory.ARMOR &&
        item.type !== EquipmentCategory.SPECIAL_COMPONENT
      )
      .reduce((sum, item) => sum + item.weight, 0);
    
    weight += equipmentWeight;
    
    return Math.round(weight * 2) / 2; // Round to nearest 0.5 ton
  };
  
  const calculateHeatBalance = (): { generated: number; dissipated: number } => {
    // Get all equipment items
    const allEquipment = EquipmentCalculator.getAllEquipmentItems(
      equipment || [],
      systemComponents,
      unit
    );
    
    // Calculate heat generated from weapons
    let generated = 0;
    allEquipment
      .filter(item => item.type === EquipmentCategory.WEAPON)
      .forEach(weapon => {
        // Find weapon stats in equipment database
        const weaponData = equipment?.find(eq => eq.item_name === weapon.name);
        if (weaponData) {
          // Get heat from equipment database or from the item data
          const heat = typeof weaponData.heat === 'string' ? 
            parseInt(weaponData.heat) || 0 : 
            (weaponData.heat || 0);
          generated += heat;
        }
      });
    
    // Calculate heat dissipated
    const engineHeatSinks = 10; // Standard fusion engine provides 10 heat sinks
    const externalHeatSinks = systemComponents?.heatSinks?.externalRequired || 0;
    const heatSinkType = systemComponents?.heatSinks?.type || 'Single';
    
    // Calculate dissipation based on heat sink type
    let dissipationPerSink = 1;
    if (heatSinkType === 'Double' || heatSinkType === 'Double (Clan)') {
      dissipationPerSink = 2;
    }
    
    const dissipated = (engineHeatSinks + externalHeatSinks) * dissipationPerSink;
    
    return { generated, dissipated };
  };
  
  // Calculate critical slot usage using unified equipment interface
  const calculateCriticalSlots = (): { total: number; required: number; assigned: number } => {
    const total = 78; // Standard battlemech has 78 critical slots
    let assigned = 0;
    
    // Count assigned slots
    if (criticalAllocations) {
      Object.values(criticalAllocations).forEach(locationSlots => {
        locationSlots.forEach(slot => {
          if (slot && slot.name && slot.name !== '' && slot.name !== '-Empty-') {
            assigned++;
          }
        });
      });
    }
    
    // Calculate required slots - only for fixed components and allocated equipment
    let required = 0;
    
    // 1. Get fixed system components (always required)
    const fixedComponents = EquipmentCalculator.getFixedSystemComponents(systemComponents);
    required += EquipmentCalculator.calculateTotalSlots(fixedComponents);
    
    // 2. Get only allocated equipment (has a location)
    const allocatedEquipment = (equipment || []).filter(eq => eq.location && eq.location !== '');
    const allocatedItems = EquipmentCalculator.getRegularEquipmentItems(allocatedEquipment);
    required += EquipmentCalculator.calculateTotalSlots(allocatedItems);
    
    // 3. Get structure and armor items that are allocated
    const allocatedStructureArmor = EquipmentCalculator.getStructureAndArmorItems(allocatedEquipment);
    required += EquipmentCalculator.calculateTotalSlots(allocatedStructureArmor);
    
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
    { id: 'criticals', label: 'Criticals', component: CriticalsTabIntegrated },
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
