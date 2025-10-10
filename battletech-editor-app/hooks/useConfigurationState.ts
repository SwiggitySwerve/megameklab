/**
 * useConfigurationState Hook
 * React hook for using ConfigurationStateManager with React components
 * 
 * This hook provides a React-friendly interface to the ConfigurationStateManager,
 * handling subscriptions, state updates, and cleanup automatically.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  ConfigurationStateManager, 
  ConfigurationState, 
  StateChangeEvent,
  ComponentSelection,
  StatePersistenceOptions
} from '../utils/state';
import { ConstructionContext } from '../utils/rules';

export interface UseConfigurationStateOptions extends StatePersistenceOptions {
  initialState?: Partial<ConfigurationState>;
  onStateChange?: (state: ConfigurationState, event?: StateChangeEvent) => void;
}

export interface UseConfigurationStateReturn {
  // Current state
  state: ConfigurationState;
  isValid: boolean;
  
  // Component selections
  components: ComponentSelection;
  
  // Update methods
  updateState: (updates: Partial<ConfigurationState>) => void;
  updateComponent: (componentType: keyof ComponentSelection, value: any) => void;
  updateMultiple: (updates: Record<string, any>) => void;
  
  // Selection memory
  rememberSelection: (componentType: string, value: any) => void;
  getRememberedSelection: (componentType: string) => any | undefined;
  tryRestoreSelection: (componentType: string, availableOptions: any[]) => any | undefined;
  
  // History
  undo: () => boolean;
  canUndo: boolean;
  history: StateChangeEvent[];
  
  // Persistence
  save: () => void;
  load: () => void;
  reset: () => void;
  
  // Export/Import
  exportState: () => string;
  importState: (json: string) => boolean;
  
  // Construction context helper
  getContext: () => ConstructionContext;
  
  // State manager instance (for advanced usage)
  stateManager: ConfigurationStateManager;
}

/**
 * Hook for managing configuration state with React
 */
export function useConfigurationState(
  options?: UseConfigurationStateOptions
): UseConfigurationStateReturn {
  // Create state manager instance (persists across re-renders)
  const stateManagerRef = useRef<ConfigurationStateManager>();
  
  if (!stateManagerRef.current) {
    stateManagerRef.current = new ConfigurationStateManager(
      options?.initialState,
      options
    );
  }
  
  const stateManager = stateManagerRef.current;
  
  // React state synced with state manager
  const [state, setState] = useState<ConfigurationState>(
    () => stateManager.getCurrentState()
  );
  
  const [history, setHistory] = useState<StateChangeEvent[]>(
    () => stateManager.getStateHistory()
  );
  
  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = stateManager.subscribe((newState, event) => {
      setState(newState);
      setHistory(stateManager.getStateHistory());
      
      // Call custom onChange handler if provided
      if (options?.onStateChange) {
        options.onStateChange(newState, event);
      }
    });
    
    return unsubscribe;
  }, [stateManager, options?.onStateChange]);
  
  // Update methods
  const updateState = useCallback((updates: Partial<ConfigurationState>) => {
    stateManager.updateState(updates, 'user_action');
  }, [stateManager]);
  
  const updateComponent = useCallback((
    componentType: keyof ComponentSelection, 
    value: any
  ) => {
    stateManager.updateComponentSelection(componentType, value, true);
  }, [stateManager]);
  
  const updateMultiple = useCallback((updates: Record<string, any>) => {
    stateManager.updateMultipleFields(updates, 'user_action');
  }, [stateManager]);
  
  // Selection memory methods
  const rememberSelection = useCallback((componentType: string, value: any) => {
    stateManager.rememberSelection(componentType, value);
  }, [stateManager]);
  
  const getRememberedSelection = useCallback((componentType: string) => {
    return stateManager.getRememberedSelection(componentType);
  }, [stateManager]);
  
  const tryRestoreSelection = useCallback((
    componentType: string, 
    availableOptions: any[]
  ) => {
    return stateManager.tryRestoreRememberedSelection(componentType, availableOptions);
  }, [stateManager]);
  
  // History methods
  const undo = useCallback(() => {
    return stateManager.undo();
  }, [stateManager]);
  
  const canUndo = useMemo(() => {
    return history.length > 0;
  }, [history.length]);
  
  // Persistence methods
  const save = useCallback(() => {
    stateManager.saveState();
  }, [stateManager]);
  
  const load = useCallback(() => {
    const loadedState = stateManager.loadState();
    if (loadedState) {
      setState(loadedState);
    }
  }, [stateManager]);
  
  const reset = useCallback(() => {
    stateManager.reset();
  }, [stateManager]);
  
  // Export/Import methods
  const exportState = useCallback(() => {
    return stateManager.exportState();
  }, [stateManager]);
  
  const importState = useCallback((json: string) => {
    return stateManager.importState(json);
  }, [stateManager]);
  
  // Get construction context helper
  const getContext = useCallback((): ConstructionContext => {
    return {
      techBase: state.techBase,
      era: '3050', // Could be from state if we add era field
      techLevel: 'Tournament', // Could be from state if we add tech level field
      mechTonnage: state.tonnage,
      engineRating: state.engineRating,
      currentComponents: {
        engine: state.components.engine,
        gyro: state.components.gyro,
        structure: state.components.structure,
        armor: state.components.armor,
        heatSinks: state.components.heatSink
      }
    };
  }, [state]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // State manager persists, but we could add cleanup here if needed
    };
  }, []);
  
  return {
    state,
    isValid: state.isValid,
    components: state.components,
    updateState,
    updateComponent,
    updateMultiple,
    rememberSelection,
    getRememberedSelection,
    tryRestoreSelection,
    undo,
    canUndo,
    history,
    save,
    load,
    reset,
    exportState,
    importState,
    getContext,
    stateManager
  };
}

/**
 * Hook for component selection with automatic memory and restoration
 * This is a specialized hook that handles the common pattern of:
 * 1. Displaying a dropdown of available options
 * 2. Remembering user selection
 * 3. Restoring selection when options change
 */
export function useComponentSelection<T = any>(
  componentType: keyof ComponentSelection,
  availableOptions: T[],
  stateManager: ConfigurationStateManager,
  optionIdExtractor: (option: T) => string = (option: any) => option.id || option
) {
  const [currentValue, setCurrentValue] = useState<string>(() => {
    return stateManager.getComponentSelection(componentType) || '';
  });
  
  // Subscribe to state changes for this component
  useEffect(() => {
    const unsubscribe = stateManager.subscribe((state) => {
      const newValue = state.components[componentType];
      if (newValue !== currentValue) {
        setCurrentValue(newValue || '');
      }
    });
    
    return unsubscribe;
  }, [stateManager, componentType, currentValue]);
  
  // When available options change, try to restore remembered selection
  useEffect(() => {
    const optionIds = availableOptions.map(optionIdExtractor);
    
    // If current value is not in available options
    if (!optionIds.includes(currentValue)) {
      // Try to restore remembered selection
      const remembered = stateManager.tryRestoreRememberedSelection(
        componentType,
        optionIds
      );
      
      if (remembered) {
        // Restored remembered selection
        stateManager.updateComponentSelection(componentType, remembered, true);
      } else if (optionIds.length > 0) {
        // Fall back to first available option
        const firstOption = optionIds[0];
        stateManager.updateComponentSelection(componentType, firstOption, true);
      }
    }
  }, [availableOptions, currentValue, componentType, stateManager, optionIdExtractor]);
  
  // Update handler
  const handleChange = useCallback((newValue: string) => {
    stateManager.updateComponentSelection(componentType, newValue, true);
  }, [stateManager, componentType]);
  
  return {
    value: currentValue,
    onChange: handleChange,
    availableOptions,
    isValid: availableOptions.some(opt => optionIdExtractor(opt) === currentValue)
  };
}

/**
 * Hook for getting available components based on current context
 * Automatically updates when state changes
 */
export function useAvailableComponents(
  stateManager: ConfigurationStateManager,
  componentType: 'engine' | 'gyro' | 'heatSink' | 'structure' | 'armor'
) {
  const [components, setComponents] = useState<any[]>([]);
  
  useEffect(() => {
    const updateComponents = () => {
      const state = stateManager.getCurrentState();
      const context: ConstructionContext = {
        techBase: state.techBase,
        era: '3050',
        techLevel: 'Tournament',
        mechTonnage: state.tonnage,
        engineRating: state.engineRating,
        currentComponents: {
          engine: state.components.engine,
          gyro: state.components.gyro,
          structure: state.components.structure,
          armor: state.components.armor,
          heatSinks: state.components.heatSink
        }
      };
      
      // Import dynamically to avoid circular dependencies
      import('../utils/rules').then(({ RulesDataProvider }) => {
        let available: any[] = [];
        
        switch (componentType) {
          case 'engine':
            available = RulesDataProvider.getAvailableEngineTypes(context);
            break;
          case 'gyro':
            available = RulesDataProvider.getAvailableGyroTypes(context);
            break;
          case 'heatSink':
            available = RulesDataProvider.getAvailableHeatSinkTypes(context);
            break;
          case 'structure':
            available = RulesDataProvider.getAvailableStructureTypes(context);
            break;
          case 'armor':
            available = RulesDataProvider.getAvailableArmorTypes(context);
            break;
        }
        
        setComponents(available.filter(c => c.available));
      });
    };
    
    // Update immediately
    updateComponents();
    
    // Subscribe to state changes
    const unsubscribe = stateManager.subscribe(() => {
      updateComponents();
    });
    
    return unsubscribe;
  }, [stateManager, componentType]);
  
  return components;
}

/**
 * Example usage:
 * 
 * function MyComponent() {
 *   const {
 *     state,
 *     components,
 *     updateComponent,
 *     undo,
 *     canUndo,
 *     getContext
 *   } = useConfigurationState({
 *     storageKey: 'my-mech-config',
 *     autoSave: true
 *   });
 *   
 *   const availableEngines = useAvailableComponents(stateManager, 'engine');
 *   
 *   return (
 *     <div>
 *       <select 
 *         value={components.engine || ''} 
 *         onChange={(e) => updateComponent('engine', e.target.value)}
 *       >
 *         {availableEngines.map(engine => (
 *           <option key={engine.id} value={engine.id}>
 *             {engine.displayName}
 *           </option>
 *         ))}
 *       </select>
 *       
 *       {canUndo && <button onClick={undo}>Undo</button>}
 *     </div>
 *   );
 * }
 */
