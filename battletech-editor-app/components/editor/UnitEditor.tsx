import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import { EditableUnit, EditorTab, ValidationError, UnitEditorState } from '../../types/editor';
import ArmorTabWithHooks from './tabs/ArmorTabWithHooks';
import StructureTabWithHooks from './tabs/StructureTabWithHooks';
import EquipmentTabWithHooks from './tabs/EquipmentTabWithHooks';
import CriticalsTabWithHooks from './tabs/CriticalsTabWithHooks';
import FluffTabWithHooks from './tabs/FluffTabWithHooks';
import QuirksTab from './tabs/QuirksTab';
import PreviewTab from './tabs/PreviewTab';
import { 
  calculateHeatGeneration, 
  calculateEquipmentWeight, 
  calculateCriticalSlots,
  calculateEquipmentBV 
} from '../../utils/equipmentData';
import { migrateUnitToSystemComponents } from '../../utils/componentValidation';

// Tab definitions
const EDITOR_TABS = [
  { id: 'structure', label: 'Structure', component: StructureTabWithHooks },
  { id: 'armor', label: 'Armor', component: ArmorTabWithHooks },
  { id: 'equipment', label: 'Equipment', component: EquipmentTabWithHooks },
  { id: 'criticals', label: 'Criticals', component: CriticalsTabWithHooks },
  { id: 'fluff', label: 'Fluff', component: FluffTabWithHooks },
  { id: 'quirks', label: 'Quirks', component: QuirksTab },
  { id: 'preview', label: 'Preview', component: PreviewTab },
] as const;

interface UnitEditorProps {
  unit: EditableUnit;
  onUnitChange: (unit: EditableUnit) => void;
  onSave?: (unit: EditableUnit) => Promise<void>;
  readOnly?: boolean;
  className?: string;
}

const UnitEditor: React.FC<UnitEditorProps> = ({
  unit,
  onUnitChange,
  onSave,
  readOnly = false,
  className = '',
}) => {
  const router = useRouter();
  
  // Initialize active tab from URL or default
  const getInitialTab = (): EditorTab => {
    const tab = router.query.tab;
    if (tab && typeof tab === 'string') {
      const validTab = EDITOR_TABS.find(t => t.id === tab);
      if (validTab) {
        return tab as EditorTab;
      }
    }
    return 'structure';
  };

  // Ensure unit has proper system components and critical allocations
  const initializeUnit = useCallback((inputUnit: EditableUnit): EditableUnit => {
    // If unit doesn't have system components or critical allocations, migrate it
    if (!inputUnit.systemComponents || !inputUnit.criticalAllocations) {
      console.log('Migrating unit to system components format');
      return migrateUnitToSystemComponents(inputUnit);
    }
    return inputUnit;
  }, []);

  const [editorState, setEditorState] = useState<UnitEditorState>({
    unit: initializeUnit(unit),
    activeTab: getInitialTab(),
    validationErrors: [],
    isDirty: false,
    autoSave: true,
    isLoading: false,
  });

  // Update unit when prop changes
  useEffect(() => {
    // Only update if it's a different unit or if current unit lacks system components
    if (unit.id !== editorState.unit.id || !editorState.unit.systemComponents) {
      const initializedUnit = initializeUnit(unit);
      setEditorState(prev => ({
        ...prev,
        unit: initializedUnit,
      }));
    }
  }, [unit.id]); // Only check when unit ID changes

  // Handle tab changes
  const handleTabChange = useCallback((tabId: EditorTab) => {
    setEditorState(prev => ({
      ...prev,
      activeTab: tabId,
    }));
    
    // Update URL with the new tab
    router.push({
      pathname: router.pathname,
      query: { tab: tabId },
    }, undefined, { shallow: true });
  }, [router]);
  
  // Listen for URL changes
  useEffect(() => {
    const tab = router.query.tab;
    if (tab && typeof tab === 'string') {
      const validTab = EDITOR_TABS.find(t => t.id === tab);
      if (validTab && editorState.activeTab !== tab) {
        setEditorState(prev => ({
          ...prev,
          activeTab: tab as EditorTab,
        }));
      }
    }
  }, [router.query.tab, editorState.activeTab]);

  // Handle unit updates
  const handleUnitUpdate = useCallback((updates: Partial<EditableUnit>) => {
    // Merge updates with existing unit
    const mergedUnit = {
      ...editorState.unit,
      ...updates,
      // Preserve system components and critical allocations if not in updates
      systemComponents: updates.systemComponents || editorState.unit.systemComponents,
      criticalAllocations: updates.criticalAllocations || editorState.unit.criticalAllocations,
      editorMetadata: {
        ...editorState.unit.editorMetadata,
        lastModified: new Date(),
        isDirty: true,
      },
    };

    // Deep merge data if both exist
    if (updates.data && editorState.unit.data) {
      mergedUnit.data = {
        ...editorState.unit.data,
        ...updates.data,
      };
    }

    setEditorState(prev => ({
      ...prev,
      unit: mergedUnit,
      isDirty: true,
    }));

    onUnitChange(mergedUnit);
  }, [editorState.unit, onUnitChange]);

  // Validate unit
  const validationErrors = useMemo((): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Basic validation - to be expanded
    if (!editorState.unit.chassis) {
      errors.push({
        id: 'missing-chassis',
        category: 'error',
        message: 'Chassis name is required',
        field: 'chassis',
      });
    }

    if (!editorState.unit.model) {
      errors.push({
        id: 'missing-model',
        category: 'error',
        message: 'Model designation is required',
        field: 'model',
      });
    }

    return errors;
  }, [editorState.unit]);

  // Get active tab component
  const ActiveTabComponent = EDITOR_TABS.find(tab => tab.id === editorState.activeTab)?.component;

  // Calculate unit statistics
  const calculateCurrentWeight = (): number => {
    let weight = 0;
    
    // Use system components if available for accurate calculations
    if (editorState.unit.systemComponents) {
      const components = editorState.unit.systemComponents;
      
      // Structure weight
      if (components.structure) {
        const structureMultiplier = components.structure.type === 'Standard' ? 0.1 : 0.05;
        weight += editorState.unit.mass * structureMultiplier;
      } else {
        weight += editorState.unit.mass * 0.1; // Default to standard
      }
      
      // Engine weight (using actual engine rating if available)
      if (components.engine) {
        const rating = components.engine.rating;
        let engineMultiplier = 1;
        switch (components.engine.type) {
          case 'XL': engineMultiplier = 0.5; break;
          case 'Light': engineMultiplier = 0.75; break;
          case 'XXL': engineMultiplier = 0.33; break;
          case 'Compact': engineMultiplier = 1.5; break;
        }
        weight += (rating / 5) * engineMultiplier;
      } else {
        // Fallback calculation
        const engineRating = editorState.unit.data?.engine?.rating || 300;
        weight += engineRating / 10;
      }
      
      // Gyro weight
      if (components.gyro && components.engine) {
        const gyroMultiplier = components.gyro.type === 'Standard' ? 1 : 
                              components.gyro.type === 'Compact' ? 0.5 :
                              components.gyro.type === 'Heavy-Duty' ? 2 : 1.5;
        weight += Math.ceil(components.engine.rating / 100) * gyroMultiplier;
      } else {
        weight += 3; // Default 3 tons
      }
      
      // Cockpit weight
      weight += components.cockpit?.type === 'Small' ? 2 : 3;
      
      // External heat sinks
      if (components.heatSinks) {
        weight += components.heatSinks.externalRequired * 
                 (components.heatSinks.type === 'Double' ? 1 : 1);
      }
    } else {
      // Fallback to simple calculation
      const structureWeight = editorState.unit.mass * 0.1;
      const engineRating = editorState.unit.data?.engine?.rating || 300;
      const engineWeight = engineRating / 10;
      weight += structureWeight + engineWeight + 3; // +3 for gyro
    }
    
    // Armor weight
    const armorWeight = (editorState.unit.data?.armor?.total_armor_points || 0) / 16;
    weight += armorWeight;
    
    // Equipment weight
    const equipmentWeight = calculateEquipmentWeight(editorState.unit.data?.weapons_and_equipment || []);
    weight += equipmentWeight;
    
    return Math.round(weight * 10) / 10;
  };

  const currentWeight = calculateCurrentWeight();
  const weapons = editorState.unit.data?.weapons_and_equipment?.filter(e => e.item_type === 'weapon') || [];
  const heatGeneration = calculateHeatGeneration(weapons);
  const heatDissipation = editorState.unit.data?.heat_sinks?.count || 10;
  
  // Calculate critical slots
  const structureSlots = 0; // Standard structure uses no slots
  const engineSlots = 6; // Standard engine in torso
  const gyroSlots = 4;
  const cockpitSlots = 5; // Including life support and sensors
  const actuatorSlots = 8; // 4 per arm for biped
  const equipmentSlots = calculateCriticalSlots(editorState.unit.data?.weapons_and_equipment || []);
  const usedCriticalSlots = structureSlots + engineSlots + gyroSlots + cockpitSlots + actuatorSlots + equipmentSlots;
  const totalCriticalSlots = 78; // Standard for battlemech
  const freeCriticalSlots = totalCriticalSlots - usedCriticalSlots;
  
  // Calculate battle value (simplified)
  const baseBV = editorState.unit.mass * 2;
  const equipmentBV = calculateEquipmentBV(editorState.unit.data?.weapons_and_equipment || []);
  const battleValue = Math.round(baseBV + equipmentBV);
  
  // Calculate cost (simplified)
  const baseCost = editorState.unit.mass * 10000;
  const equipmentCost = equipmentBV * 1000; // Simplified cost calculation
  const dryCost = Math.round(baseCost + equipmentCost);
  
  const isOverweight = currentWeight > (editorState.unit.mass || 0);
  const isOverheating = heatGeneration > heatDissipation;
  const hasValidationErrors = validationErrors.length > 0;

  return (
    <div className={`unit-editor ${className}`}>
      {/* Editor Header */}
      <div className="editor-header bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editorState.unit.chassis} {editorState.unit.model}
              {editorState.isDirty && <span className="text-orange-500 ml-2">*</span>}
            </h2>
            <div className="text-sm text-gray-500">
              {editorState.unit.mass}t {editorState.unit.tech_base}
              {editorState.unit.systemComponents?.engine && (
                <span className="ml-2 text-xs">
                  ({editorState.unit.systemComponents.engine.type} {editorState.unit.systemComponents.engine.rating})
                </span>
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {validationErrors.length > 0 && (
              <div className="flex items-center text-red-600 text-sm">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {validationErrors.length} error{validationErrors.length !== 1 ? 's' : ''}
              </div>
            )}
            
            {onSave && (
              <button
                onClick={() => onSave(editorState.unit)}
                disabled={!editorState.isDirty || editorState.isLoading}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editorState.isLoading ? 'Saving...' : 'Save'}
              </button>
            )}
          </div>
        </div>

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
            <ul className="text-sm text-red-800 space-y-1">
              {validationErrors.map(error => (
                <li key={error.id} className="flex items-center">
                  <span className="mr-2">•</span>
                  {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Editor Status Bar - MegaMekLab style */}
      <div className="editor-status-bar bg-gray-800 text-white px-4 py-2 text-sm border-b border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Weight Status */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Weight:</span>
              <span className={`font-medium ${
                currentWeight > (editorState.unit.mass || 0) 
                  ? 'text-red-400' 
                  : 'text-green-400'
              }`}>
                {currentWeight} / {editorState.unit.mass || 0} tons
              </span>
            </div>

            {/* Battle Value */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">BV:</span>
              <span className="font-medium">{battleValue}</span>
            </div>

            {/* Validation Status */}
            {validationErrors.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-red-400 font-medium">Invalid</span>
              </div>
            )}

            {/* Dry Cost */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Dry Cost:</span>
              <span className="font-medium">
                {new Intl.NumberFormat('en-US').format(dryCost)} C-bills
              </span>
            </div>

            {/* Free Critical Slots */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Free Slots:</span>
              <span className="font-medium">
                {freeCriticalSlots} / {totalCriticalSlots}
              </span>
            </div>

            {/* Heat Status */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Heat:</span>
              <span className={`font-medium ${
                heatGeneration > heatDissipation
                  ? 'text-red-400'
                  : 'text-green-400'
              }`}>
                {heatGeneration} / {heatDissipation}
              </span>
            </div>
          </div>

          {/* Right side info */}
          <div className="flex items-center space-x-4">
            {editorState.autoSave && (
              <span className="text-green-400 text-xs">Auto-save enabled</span>
            )}
            <span className="text-xs text-gray-400">
              v{editorState.unit.editorMetadata?.version || '1.0.0'}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="editor-tabs border-b border-gray-200 bg-gray-50">
        <nav className="flex space-x-8 px-4" aria-label="Tabs">
          {EDITOR_TABS.map((tab) => {
            const isActive = tab.id === editorState.activeTab;
            const isDisabled = !tab.component;
            
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && handleTabChange(tab.id as EditorTab)}
                disabled={isDisabled}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : isDisabled
                    ? 'border-transparent text-gray-400 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
                {isDisabled && (
                  <span className="ml-1 text-xs text-gray-400">(Coming Soon)</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="editor-content flex-1 p-4 bg-gray-50 min-h-[600px]">
        {ActiveTabComponent ? (
          <ActiveTabComponent
            unit={editorState.unit}
            onUnitChange={handleUnitUpdate}
            validationErrors={validationErrors}
            readOnly={readOnly}
            compact={true}
          />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Coming Soon</h3>
              <p className="mt-1 text-sm text-gray-500">
                This tab is under development
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitEditor;
