/**
 * Customizer V2 - Next generation unit customizer using the V2 data model
 * Built on top of the UnitCriticalManager system from the critical slots v2 demo
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { UnitProvider, useUnit } from '../../components/criticalSlots/UnitProvider';

// Placeholder tab components - these will be implemented later
const StructureTabV2: React.FC<{ readOnly?: boolean }> = () => (
  <div className="p-6 text-center text-slate-400">
    <h3 className="text-lg font-medium mb-2">Structure Tab</h3>
    <p>Coming soon - Engine, Gyro, Structure, and Cockpit configuration</p>
  </div>
);

const ArmorTabV2: React.FC<{ readOnly?: boolean }> = () => (
  <div className="p-6 text-center text-slate-400">
    <h3 className="text-lg font-medium mb-2">Armor Tab</h3>
    <p>Coming soon - Armor type selection and allocation</p>
  </div>
);

const EquipmentTabV2: React.FC<{ readOnly?: boolean }> = () => (
  <div className="p-6 text-center text-slate-400">
    <h3 className="text-lg font-medium mb-2">Equipment Tab</h3>
    <p>Coming soon - Weapon and equipment selection</p>
  </div>
);

const CriticalsTabV2: React.FC<{ readOnly?: boolean }> = () => (
  <div className="p-6 text-center text-slate-400">
    <h3 className="text-lg font-medium mb-2">Critical Slots Tab</h3>
    <p>Coming soon - Critical slot allocation using V2 system</p>
  </div>
);

const FluffTabV2: React.FC<{ readOnly?: boolean }> = () => (
  <div className="p-6 text-center text-slate-400">
    <h3 className="text-lg font-medium mb-2">Fluff Tab</h3>
    <p>Coming soon - Unit background and description</p>
  </div>
);

// Inner component that uses the V2 data model
function CustomizerV2Content() {
  const router = useRouter();
  const { unit, engineType, gyroType, summary } = useUnit();
  
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
  
  // Calculate unit statistics from V2 data model
  const calculateCurrentWeight = (): number => {
    // Get weight from unit summary
    return summary?.totalWeight || 0;
  };
  
  const calculateHeatBalance = (): { generated: number; dissipated: number } => {
    // Get heat info from unit summary
    return {
      generated: summary?.heatGenerated || 0,
      dissipated: summary?.heatDissipated || 0
    };
  };
  
  const calculateCriticalSlots = (): { total: number; required: number; assigned: number } => {
    // Get critical slot info from unit summary
    return {
      total: 78, // Standard BattleMech total
      required: summary?.criticalSlotsUsed || 0,
      assigned: summary?.criticalSlotsUsed || 0
    };
  };
  
  // Get unit configuration from V2 system
  const unitConfig = unit.getConfiguration();
  const currentWeight = calculateCurrentWeight();
  const heatBalance = calculateHeatBalance();
  const criticalSlots = calculateCriticalSlots();
  
  // Default unit info (will be configurable in future versions)
  const unitInfo = {
    chassis: 'Atlas', // Default chassis name
    model: 'AS7-D', // Default model
    rulesLevel: 'Standard', // Default rules level
    era: '3025' // Default era
  };
  
  // Tab configuration
  const tabs = [
    { id: 'structure', label: 'Structure', component: StructureTabV2 },
    { id: 'armor', label: 'Armor', component: ArmorTabV2 },
    { id: 'equipment', label: 'Equipment', component: EquipmentTabV2 },
    { id: 'criticals', label: 'Criticals', component: CriticalsTabV2 },
    { id: 'fluff', label: 'Fluff', component: FluffTabV2 },
  ];
  
  const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component || StructureTabV2;
  
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Unit Information Banner */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left Side: Unit Info */}
          <div className="space-y-2">
            {/* Unit Name and Type */}
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-slate-100">
                {unitInfo.chassis} {unitInfo.model}
              </h2>
              <span className="text-sm text-slate-400">
                {unitConfig.tonnage}-ton {unitConfig.techBase} BattleMech
              </span>
            </div>
            
            {/* Engine and Gyro Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Engine:</span>
                <span className="text-sm text-slate-200">{engineType} {unitConfig.engineRating}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Gyro:</span>
                <span className="text-sm text-slate-200">{gyroType}</span>
              </div>
            </div>
          </div>
          
          {/* Right Side: Key Statistics */}
          <div className="flex items-center gap-6 text-sm">
            {/* Weight */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Weight:</span>
              <span className={`font-medium ${
                currentWeight > unitConfig.tonnage ? 'text-red-400' : 'text-slate-200'
              }`}>
                {currentWeight.toFixed(1)} / {unitConfig.tonnage} tons
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
                {unitConfig.walkMP}/{unitConfig.runMP}/{unitConfig.jumpMP || 0}
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
                {unitInfo.rulesLevel}
              </span>
            </div>
            
            {/* Era */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Era:</span>
              <span className="font-medium text-slate-200">
                {unitInfo.era}
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
        <ActiveTabComponent readOnly={false} />
      </div>
    </div>
  );
}

// Main component with UnitProvider
const CustomizerV2Page: React.FC = () => {
  return (
    <>
      <Head>
        <title>Customizer V2 | BattleTech Editor</title>
        <meta name="description" content="Next generation unit customizer using the V2 data model with advanced critical slot management." />
      </Head>
      
      <UnitProvider>
        <CustomizerV2Content />
      </UnitProvider>
    </>
  );
};

export default CustomizerV2Page;
