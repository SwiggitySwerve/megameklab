/**
 * Customizer V2 - Next generation unit customizer using the V2 data model
 * Built on top of the UnitCriticalManager system for advanced unit customization
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  const { unit, unitVersion } = useUnit();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isEquipmentTrayExpanded, setIsEquipmentTrayExpanded] = useState(false);
  const [isDebugVisible, setIsDebugVisible] = useState(false);

  // Get the current unit configuration directly from the unit
  const unitConfig = useMemo(() => unit.getConfiguration(), [unit, unitVersion]);

  // Get unallocated equipment for weight calculations
  const unallocatedEquipment = useMemo(() => unit.getUnallocatedEquipment(), [unit, unitVersion]);

  // Initialize active tab from URL query or localStorage
  useEffect(() => {
    const getInitialTab = () => {
      // First, try to get tab from URL query parameter
      if (router.query.tab && typeof router.query.tab === 'string') {
        const urlTab = router.query.tab;
        if (['overview', 'structure', 'armor', 'equipment', 'criticals', 'fluff'].includes(urlTab)) {
          return urlTab;
        }
      }
      
      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        const savedTab = localStorage.getItem('customizer-v2-active-tab');
        if (savedTab && ['overview', 'structure', 'armor', 'equipment', 'criticals', 'fluff'].includes(savedTab)) {
          return savedTab;
        }
      }
      
      return 'overview';
    };

    const initialTab = getInitialTab();
    setActiveTab(initialTab);
  }, [router.query.tab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    
    // Update URL query parameter
    const newQuery = { ...router.query, tab: tabId };
    router.push({
      pathname: router.pathname,
      query: newQuery
    }, undefined, { shallow: true });
    
    // Also save to localStorage as backup
    if (typeof window !== 'undefined') {
      localStorage.setItem('customizer-v2-active-tab', tabId);
    }
  };

  // Debug: Log all equipment on the unit (allocated and unallocated)
  useEffect(() => {
    const sections = unit.getAllSections();
    const allocatedEquipment: Array<{ location: string; name: string; weight: number; heat: number }> = [];
    sections.forEach(section => {
      const sectionEquipment = section.getAllEquipment();
      sectionEquipment.forEach(equipment => {
        allocatedEquipment.push({
          location: section.getLocation?.() || section.location || 'Unknown',
          name: equipment.equipmentData?.name || 'Unknown',
          weight: equipment.equipmentData?.weight || 0,
          heat: equipment.equipmentData?.heat || 0
        });
      });
    });

    const unallocatedEquipmentList = unallocatedEquipment.map(eq => ({
      name: eq.equipmentData?.name || 'Unknown',
      weight: eq.equipmentData?.weight || 0,
      heat: eq.equipmentData?.heat || 0
    }));

    console.log('[EQUIPMENT_DEBUG] Allocated Equipment:', allocatedEquipment);
    console.log('[EQUIPMENT_DEBUG] Unallocated Equipment:', unallocatedEquipmentList);
  }, [unit, unallocatedEquipment, unitVersion]);

  // Calculate current weight including all equipment (allocated and unallocated)
  const calculateCurrentWeight = useCallback((): number => {
    const baseWeight = unit.getUsedTonnage(); // System components only
    
    // Add allocated equipment weight
    let allocatedWeight = 0;
    const sections = unit.getAllSections();
    sections.forEach(section => {
      const sectionEquipment = section.getAllEquipment();
      sectionEquipment.forEach(equipment => {
        allocatedWeight += equipment.equipmentData?.weight || 0;
      });
    });
    
    // Add unallocated equipment weight
    const unallocatedWeight = unallocatedEquipment.reduce((total, equipment) => {
      return total + (equipment.equipmentData?.weight || 0);
    }, 0);
    
    const totalWeight = baseWeight + allocatedWeight + unallocatedWeight;
    
    // Debug logging
    console.log('[TopBar] Weight Calculation:', {
      baseWeight: baseWeight.toFixed(1),
      allocatedWeight: allocatedWeight.toFixed(1),
      unallocatedWeight: unallocatedWeight.toFixed(1),
      totalWeight: totalWeight.toFixed(1),
      unitTonnage: unitConfig.tonnage
    });
    
    return totalWeight;
  }, [unit, unallocatedEquipment, unitVersion]);

  // Calculate heat balance including all equipment heat generation
  const calculateHeatBalance = useCallback((): { generated: number; dissipated: number } => {
    // Base heat generation from unit (system components)
    let generated = unit.getHeatGeneration();
    
    // Add heat from allocated equipment
    const sections = unit.getAllSections();
    sections.forEach(section => {
      const sectionEquipment = section.getAllEquipment();
      sectionEquipment.forEach(equipment => {
        generated += equipment.equipmentData?.heat || 0;
      });
    });
    
    // Add heat from unallocated equipment
    unallocatedEquipment.forEach(equipment => {
      generated += equipment.equipmentData?.heat || 0;
    });
    
    const dissipated = unit.getHeatDissipation();
    
    // Debug logging
    console.log('[TopBar] Heat Calculation:', {
      baseHeat: unit.getHeatGeneration(),
      allocatedHeat: sections.reduce((sum, section) => 
        sum + section.getAllEquipment().reduce((s, eq) => s + (eq.equipmentData?.heat || 0), 0), 0),
      unallocatedHeat: unallocatedEquipment.reduce((sum, eq) => sum + (eq.equipmentData?.heat || 0), 0),
      totalGenerated: generated,
      dissipated
    });
    
    return {
      generated,
      dissipated
    };
  }, [unit, unallocatedEquipment, unitVersion]);

  // Calculate critical slots using unit's breakdown method
  const calculateCriticalSlots = useCallback((): { total: number; used: number; available: number } => {
    const breakdown = unit.getCriticalSlotBreakdown();
    
    return {
      total: breakdown.totals.capacity,
      used: breakdown.totals.used,
      available: breakdown.totals.remaining
    };
  }, [unit, unitVersion]);

  // Calculate movement using unit configuration and enhancements
  const calculateMovement = useCallback((): { walk: number; run: number; jump: number; display: string } => {
    const config = unit.getConfiguration();
    const movement = formatCondensedMovement(config, config.tonnage);
    
    // Parse the movement display to get individual values
    const parts = movement.split(' / ');
    const walkPart = parts[0];
    const runPart = parts[1];
    const jumpPart = parts[2];
    
    // Extract base and enhanced values
    const walkMatch = walkPart.match(/(\d+)(?:\s*\[(\d+)\])?/);
    const runMatch = runPart.match(/(\d+)(?:\s*\[(\d+)\])?/);
    const jumpMatch = jumpPart.match(/(\d+)/);
    
    const walk = walkMatch ? parseInt(walkMatch[2] || walkMatch[1]) : config.walkMP;
    const run = runMatch ? parseInt(runMatch[2] || runMatch[1]) : config.runMP;
    const jump = jumpMatch ? parseInt(jumpMatch[1]) : config.jumpMP;
    
    return {
      walk,
      run,
      jump,
      display: movement
    };
  }, [unit, unitVersion]);

  // Memoize the calculated values to prevent unnecessary recalculations
  const currentWeight = useMemo(() => calculateCurrentWeight(), [calculateCurrentWeight]);
  const heatBalance = useMemo(() => calculateHeatBalance(), [calculateHeatBalance]);
  const criticalSlots = useMemo(() => calculateCriticalSlots(), [calculateCriticalSlots]);
  const movement = useMemo(() => calculateMovement(), [calculateMovement]);

  // Tab configuration - Overview is now the first tab
  const tabs = useMemo(() => [
    { id: 'overview', label: 'Overview', component: OverviewTabV2 },
    { id: 'structure', label: 'Structure', component: StructureTabV2 },
    { id: 'armor', label: 'Armor', component: ArmorTabV2 },
    { id: 'equipment', label: 'Equipment', component: EquipmentTabV2 },
    { id: 'criticals', label: 'Criticals', component: CriticalsTabV2 },
    { id: 'fluff', label: 'Fluff', component: FluffTabV2 },
  ], []);

  // Memoize the active tab component to prevent unnecessary re-renders
  const ActiveTabComponent = useMemo(() => {
    return tabs.find(tab => tab.id === activeTab)?.component || OverviewTabV2;
  }, [activeTab, tabs]);

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
              {unitConfig.chassis}
            </h2>
            <span className="text-sm text-slate-400">
              {unitConfig.tonnage}-ton {unitConfig.techBase} {unitConfig.unitType}
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
                {movement.display}
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
