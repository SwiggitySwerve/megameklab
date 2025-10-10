/**
 * Component Selector with Memory - Example Component
 * 
 * This component demonstrates the proper integration of:
 * - useConfigurationState hook
 * - RulesDataProvider for component availability
 * - Selection memory to preserve user choices
 * - Automatic restoration when options become available
 * 
 * Use this as a reference for migrating other component selectors.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useConfigurationState, useAvailableComponents } from '../../hooks/useConfigurationState';
import { RulesDataProvider, ComponentOption, ConstructionContext } from '../../utils/rules';

interface ComponentSelectorProps {
  label: string;
  componentType: 'engine' | 'gyro' | 'heatSink' | 'structure' | 'armor';
  className?: string;
}

/**
 * Example: Component selector with automatic selection memory
 */
export function ComponentSelectorWithMemory({ 
  label, 
  componentType,
  className = ''
}: ComponentSelectorProps) {
  const {
    state,
    components,
    updateComponent,
    tryRestoreSelection,
    stateManager,
    getContext
  } = useConfigurationState({
    storageKey: 'example-mech-config',
    autoSave: true,
    saveDelay: 1000
  });

  // Get available components using the hook
  const availableComponents = useAvailableComponents(stateManager, componentType);
  
  // Current selection
  const currentValue = components[componentType] || '';
  
  // Track if we've attempted restoration
  const [restorationAttempted, setRestorationAttempted] = useState(false);
  
  // When available options change, try to restore remembered selection
  useEffect(() => {
    if (availableComponents.length === 0) return;
    
    const optionIds = availableComponents.map(c => c.id);
    
    // If current value is not in available options
    if (!optionIds.includes(currentValue)) {
      // Try to restore remembered selection
      const remembered = tryRestoreSelection(
        componentType,
        optionIds
      );
      
      if (remembered && optionIds.includes(remembered)) {
        console.log(`[${componentType}] Restored remembered selection:`, remembered);
        updateComponent(componentType, remembered);
        setRestorationAttempted(true);
      } else if (!restorationAttempted && optionIds.length > 0) {
        // Fall back to first available option if no remembered selection
        console.log(`[${componentType}] No remembered selection, using first available:`, optionIds[0]);
        updateComponent(componentType, optionIds[0]);
        setRestorationAttempted(true);
      }
    } else {
      setRestorationAttempted(true);
    }
  }, [availableComponents, currentValue, componentType, tryRestoreSelection, updateComponent, restorationAttempted]);
  
  // Reset restoration flag when tech base changes
  useEffect(() => {
    setRestorationAttempted(false);
  }, [state.techBase]);
  
  // Handle selection change
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value;
    console.log(`[${componentType}] User selected:`, newValue);
    updateComponent(componentType, newValue);
  };
  
  // Get option details for display
  const getOptionLabel = (option: ComponentOption): string => {
    const details = [];
    if (option.requirements.criticalSlots > 0) {
      details.push(`${option.requirements.criticalSlots} slots`);
    }
    if (option.requirements.weight > 0) {
      details.push(`${option.requirements.weight} tons`);
    }
    
    return details.length > 0 
      ? `${option.displayName} (${details.join(', ')})`
      : option.displayName;
  };
  
  return (
    <div className={`component-selector ${className}`}>
      <label htmlFor={`${componentType}-select`} className="block text-sm font-medium mb-1">
        {label}
      </label>
      
      <select
        id={`${componentType}-select`}
        value={currentValue}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={availableComponents.length === 0}
      >
        {availableComponents.length === 0 && (
          <option value="">No options available</option>
        )}
        
        {availableComponents.map(option => (
          <option key={option.id} value={option.id}>
            {getOptionLabel(option)}
          </option>
        ))}
      </select>
      
      {/* Show warnings if any */}
      {availableComponents.find(o => o.id === currentValue)?.specialRules && (
        <div className="mt-1 text-xs text-yellow-600">
          {availableComponents
            .find(o => o.id === currentValue)
            ?.specialRules?.map((rule, i) => (
              <div key={i}>⚠️ {rule}</div>
            ))}
        </div>
      )}
      
      {/* Show tech base mismatch warning */}
      {availableComponents.find(o => o.id === currentValue) && 
       !availableComponents.find(o => o.id === currentValue)?.available && (
        <div className="mt-1 text-xs text-red-600">
          ❌ Not compatible with current tech base
        </div>
      )}
    </div>
  );
}

/**
 * Example: Complete mech configuration panel with selection memory
 */
export function MechConfigurationPanel() {
  const {
    state,
    updateState,
    updateMultiple,
    undo,
    canUndo,
    isValid,
    exportState,
    importState
  } = useConfigurationState({
    storageKey: 'mech-builder-config',
    autoSave: true,
    onStateChange: (newState, event) => {
      console.log('State changed:', event?.type, event?.changedFields);
    }
  });
  
  // Handle tech base change
  const handleTechBaseChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTechBase = event.target.value as any;
    console.log('Tech base changing to:', newTechBase);
    updateState({ techBase: newTechBase });
  };
  
  // Handle tonnage change
  const handleTonnageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTonnage = parseInt(event.target.value) || 20;
    // Round to nearest 5
    const roundedTonnage = Math.round(newTonnage / 5) * 5;
    updateState({ tonnage: roundedTonnage });
  };
  
  // Export configuration
  const handleExport = () => {
    const json = exportState();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mech-config-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  // Import configuration
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const json = e.target?.result as string;
      if (importState(json)) {
        alert('Configuration imported successfully!');
      } else {
        alert('Failed to import configuration. Invalid format.');
      }
    };
    reader.readAsText(file);
  };
  
  return (
    <div className="mech-configuration-panel p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Mech Configuration Builder</h2>
      
      {/* Status indicator */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium">Status: </span>
            <span className={`text-sm ${isValid ? 'text-green-600' : 'text-red-600'}`}>
              {isValid ? '✓ Valid' : '✗ Invalid'}
            </span>
          </div>
          <div>
            {canUndo && (
              <button
                onClick={undo}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                ↶ Undo
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Basic Configuration */}
      <div className="mb-6 space-y-4">
        <h3 className="text-lg font-semibold">Basic Configuration</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="tech-base" className="block text-sm font-medium mb-1">
              Tech Base
            </label>
            <select
              id="tech-base"
              value={state.techBase}
              onChange={handleTechBaseChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Inner Sphere">Inner Sphere</option>
              <option value="Clan">Clan</option>
              <option value="Mixed (IS Chassis)">Mixed (IS Chassis)</option>
              <option value="Mixed (Clan Chassis)">Mixed (Clan Chassis)</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="tonnage" className="block text-sm font-medium mb-1">
              Tonnage
            </label>
            <input
              id="tonnage"
              type="number"
              min="20"
              max="100"
              step="5"
              value={state.tonnage}
              onChange={handleTonnageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      
      {/* Component Selectors with Memory */}
      <div className="mb-6 space-y-4">
        <h3 className="text-lg font-semibold">System Components</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <ComponentSelectorWithMemory 
            label="Engine Type" 
            componentType="engine" 
          />
          
          <ComponentSelectorWithMemory 
            label="Gyro Type" 
            componentType="gyro" 
          />
          
          <ComponentSelectorWithMemory 
            label="Structure Type" 
            componentType="structure" 
          />
          
          <ComponentSelectorWithMemory 
            label="Armor Type" 
            componentType="armor" 
          />
          
          <ComponentSelectorWithMemory 
            label="Heat Sink Type" 
            componentType="heatSink" 
          />
        </div>
      </div>
      
      {/* Current Configuration Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="text-lg font-semibold mb-2">Current Configuration</h3>
        <div className="text-sm space-y-1">
          <div><span className="font-medium">Tech Base:</span> {state.techBase}</div>
          <div><span className="font-medium">Tonnage:</span> {state.tonnage} tons</div>
          <div><span className="font-medium">Engine:</span> {state.components.engine || 'Not set'}</div>
          <div><span className="font-medium">Gyro:</span> {state.components.gyro || 'Not set'}</div>
          <div><span className="font-medium">Structure:</span> {state.components.structure || 'Not set'}</div>
          <div><span className="font-medium">Armor:</span> {state.components.armor || 'Not set'}</div>
          <div><span className="font-medium">Heat Sinks:</span> {state.components.heatSink || 'Not set'}</div>
        </div>
      </div>
      
      {/* Export/Import */}
      <div className="flex gap-4">
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          📥 Export Configuration
        </button>
        
        <label className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 cursor-pointer">
          📤 Import Configuration
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>
      
      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded text-sm">
        <h4 className="font-semibold mb-2">How Selection Memory Works:</h4>
        <ol className="list-decimal list-inside space-y-1">
          <li>Select components for your mech</li>
          <li>Change the tech base (e.g., Inner Sphere to Clan)</li>
          <li>Notice components automatically adjust to available options</li>
          <li>Change tech base back to original</li>
          <li>Your original selections are automatically restored! ✨</li>
        </ol>
      </div>
    </div>
  );
}

/**
 * Usage in application:
 * 
 * import { MechConfigurationPanel } from './components/examples/ComponentSelectorWithMemory';
 * 
 * function App() {
 *   return (
 *     <div>
 *       <MechConfigurationPanel />
 *     </div>
 *   );
 * }
 */
