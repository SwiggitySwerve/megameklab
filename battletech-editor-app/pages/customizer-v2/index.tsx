/**
 * Customizer V2 - Next generation unit customizer using the V2 data model
 * Built on top of the UnitCriticalManager system for advanced unit customization
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { MultiUnitProvider, useUnit } from '../../components/multiUnit/MultiUnitProvider';
import { TabManager } from '../../components/multiUnit/TabManager';
import { formatCondensedMovement } from '../../utils/movementCalculations';
import { TabContentWrapper } from '../../components/common/TabContentWrapper';

// Import equipment components
import { EquipmentTray } from '../../components/criticalSlots/EquipmentTray';
import { EquipmentAllocationDebugPanel } from '../../components/criticalSlots/EquipmentAllocationDebugPanel';

// Import Overview tab
import { OverviewTabV2 } from '../../components/overview/OverviewTabV2';

// Import extracted tab components
import { StructureTabV2 } from '../../components/editor/tabs/StructureTabV2';
import { ArmorTabV2 } from '../../components/editor/tabs/ArmorTabV2';
import { EquipmentTabV2 } from '../../components/editor/tabs/EquipmentTabV2';
import { CriticalsTabV2 } from '../../components/editor/tabs/CriticalsTabV2';
import { FluffTabV2 } from '../../components/editor/tabs/FluffTabV2';

// Inner component that uses the V2 data model with V1 UI design
function CustomizerV2Content() {
  const router = useRouter();
  const {
    unit,
    unallocatedEquipment
  } = useUnit();

  // Equipment tray state
  const [isEquipmentTrayExpanded, setIsEquipmentTrayExpanded] = useState(false);

  // Valid tab IDs
  const validTabs = ['overview', 'structure', 'armor', 'equipment', 'criticals', 'fluff'];

  // Get initial tab from URL or default to 'overview'
  const getInitialTab = () => {
    const tabFromUrl = router.query.tab as string;
    return validTabs.includes(tabFromUrl) ? tabFromUrl : 'overview';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab());

  // Debug panel state
  const [isDebugVisible, setIsDebugVisible] = useState<boolean>(false);

  // Update activeTab when URL changes
  useEffect(() => {
    const tabFromUrl = router.query.tab as string;
    if (tabFromUrl && validTabs.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [router.query.tab, activeTab]);

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

  // Get unit configuration from V2 system
  const unitConfig = unit.getConfiguration();

  // Calculate unit statistics using V2 data model
  const calculateCurrentWeight = (): number => {
    // Base unit weight (structure, engine, gyro, cockpit, heat sinks, armor)
    const baseWeight = unit.getUsedTonnage();
    
    // Add unallocated equipment weight
    let unallocatedWeight = 0;
    unallocatedEquipment.forEach((equipment: any) => {
      const actualEquipment = equipment.equipmentData || equipment;
      const weight = actualEquipment.weight || 
                    actualEquipment.weight_tons || 
                    actualEquipment.tonnage || 
                    equipment.weight || 
                    equipment.weight_tons || 
                    equipment.tonnage || 
                    0;
      unallocatedWeight += weight;
    });
    
    return baseWeight + unallocatedWeight;
  };

  const calculateHeatBalance = (): { generated: number; dissipated: number } => {
    return {
      generated: unit.getHeatGeneration(),
      dissipated: unit.getHeatDissipation()
    };
  };

  const calculateCriticalSlots = (): { total: number; used: number; available: number } => {
    // Use CriticalSlotCalculator for accurate, comprehensive calculations
    const breakdown = unit.getCriticalSlotBreakdown();
    
    return {
      total: breakdown.totals.capacity,        // 78 for standard BattleMech
      used: breakdown.totals.equipmentBurden,  // Includes structural + allocated + unallocated (no double-counting)
      available: breakdown.totals.remaining    // Accurate remaining slots
    };
  };

  const currentWeight = calculateCurrentWeight();
  const heatBalance = calculateHeatBalance();
  const criticalSlots = calculateCriticalSlots();

  // Tab configuration - Overview is now the first tab
  const tabs = [
    { id: 'overview', label: 'Overview', component: OverviewTabV2 },
    { id: 'structure', label: 'Structure', component: StructureTabV2 },
    { id: 'armor', label: 'Armor', component: ArmorTabV2 },
    { id: 'equipment', label: 'Equipment', component: EquipmentTabV2 },
    { id: 'criticals', label: 'Criticals', component: CriticalsTabV2 },
    { id: 'fluff', label: 'Fluff', component: FluffTabV2 },
  ];

  const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component || OverviewTabV2;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Equipment Tray */}
      <EquipmentTray 
        isExpanded={isEquipmentTrayExpanded}
        onToggle={() => setIsEquipmentTrayExpanded(!isEquipmentTrayExpanded)}
      />

      {/* Unit Information Banner - Single Row Design */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Left: Unit Identity */}
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-100">
              New Mek
            </h2>
            <span className="text-sm text-slate-400">
              {unitConfig.tonnage}-ton {unitConfig.techBase} BattleMech
            </span>
          </div>

          {/* Center: Statistics Grid */}
          <div className="grid grid-cols-6 gap-4 text-sm">
            {/* Weight */}
            <div className="flex flex-col items-center text-center">
              <span className="text-slate-400 text-xs mb-1">Weight</span>
              <span className={`font-medium ${currentWeight > unitConfig.tonnage ? 'text-red-400' : 'text-slate-200'
                }`}>
                {currentWeight.toFixed(1)} / {unitConfig.tonnage}
              </span>
              <span className="text-slate-500 text-xs">tons</span>
            </div>

            {/* Heat */}
            <div className="flex flex-col items-center text-center">
              <span className="text-slate-400 text-xs mb-1">Heat</span>
              <span className={`font-medium ${heatBalance.generated > heatBalance.dissipated ? 'text-orange-400' : 'text-green-400'
                }`}>
                {heatBalance.generated} / {heatBalance.dissipated}
              </span>
              <span className="text-slate-500 text-xs">gen / sink</span>
            </div>

            {/* Movement */}
            <div className="flex flex-col items-center text-center">
              <span className="text-slate-400 text-xs mb-1">Movement</span>
              <span className="font-medium text-slate-200">
                {formatCondensedMovement(unitConfig, unitConfig.tonnage)}
              </span>
              <span className="text-slate-500 text-xs">walk / run / jump</span>
            </div>

            {/* Critical Slots */}
            <div className="flex flex-col items-center text-center">
              <span className="text-slate-400 text-xs mb-1">Crits</span>
              <span className={`font-medium ${criticalSlots.used > criticalSlots.total ? 'text-red-400' : 'text-slate-200'
                }`}>
                {criticalSlots.used} / {criticalSlots.total}
              </span>
              <span className="text-slate-500 text-xs">used / total</span>
            </div>

            {/* Rules Level */}
            <div className="flex flex-col items-center text-center">
              <span className="text-slate-400 text-xs mb-1">Rules</span>
              <span className="font-medium text-slate-200">
                Standard
              </span>
              <span className="text-slate-500 text-xs">level</span>
            </div>

            {/* Era */}
            <div className="flex flex-col items-center text-center">
              <span className="text-slate-400 text-xs mb-1">Era</span>
              <span className="font-medium text-slate-200">
                3025
              </span>
              <span className="text-slate-500 text-xs">year</span>
            </div>
          </div>

          {/* Right: Debug Button */}
          <button
            onClick={() => setIsDebugVisible(!isDebugVisible)}
            className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-slate-200 rounded transition-colors"
            title="Toggle Debug Panel"
          >
            Debug
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-700 bg-slate-800 flex-shrink-0">
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

      {/* Tab Content - Using standardized wrapper */}
      <TabContentWrapper>
        <ActiveTabComponent readOnly={false} />
      </TabContentWrapper>

      {/* Conditional Debug Panel */}
      {isDebugVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-4 max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-slate-100 font-semibold">Debug Panel</h3>
              <button
                onClick={() => setIsDebugVisible(false)}
                className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-slate-200 rounded transition-colors"
              >
                Close
              </button>
            </div>
            <EquipmentAllocationDebugPanel />
          </div>
        </div>
      )}

    </div>
  );
}

// Main component with MultiUnitProvider
const CustomizerV2Page: React.FC = () => {
  return (
    <>
      <Head>
        <title>Customizer V2 | BattleTech Editor</title>
        <meta name="description" content="Next generation unit customizer using the V2 data model with advanced critical slot management." />
      </Head>

      <MultiUnitProvider>
        <TabManager>
          <CustomizerV2Content />
        </TabManager>
      </MultiUnitProvider>
    </>
  );
};

export default CustomizerV2Page;
