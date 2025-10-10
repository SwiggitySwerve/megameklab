/**
 * Configuration State Manager - Handles state persistence and option switching
 * 
 * This module manages the configuration state lifecycle, including:
 * - Saving and loading configuration states
 * - Handling option changes (engine, gyro, structure, armor, etc.)
 * - Maintaining configuration history
 * - Validating state transitions
 * - Managing dropdown selections and preserving user choices
 * 
 * This manager is responsible for ensuring that configuration changes are:
 * - Properly persisted
 * - Validated before application
 * - Reversible through history
 * - Consistent across the application
 */

import { TechBase, EngineType, GyroType, StructureType, ArmorType, HeatSinkType } from '../rules/RulesDataProvider';

export interface ComponentSelection {
  engine?: EngineType;
  gyro?: GyroType;
  structure?: StructureType;
  armor?: ArmorType;
  heatSink?: HeatSinkType;
  cockpit?: string;
}

export interface ConfigurationState {
  // Basic unit properties
  tonnage: number;
  techBase: TechBase;
  unitType: 'BattleMech' | 'IndustrialMech';
  
  // Component selections
  components: ComponentSelection;
  
  // Movement
  walkMP: number;
  engineRating: number;
  runMP: number;
  jumpMP: number;
  
  // Heat management
  totalHeatSinks: number;
  internalHeatSinks: number;
  externalHeatSinks: number;
  
  // Armor
  armorTonnage: number;
  armorPoints: number;
  
  // Metadata
  lastModified: number;
  version: string;
  isValid: boolean;
}

export interface StateChangeEvent {
  type: 'component_changed' | 'tonnage_changed' | 'tech_base_changed' | 'full_update';
  timestamp: number;
  previousState: ConfigurationState;
  newState: ConfigurationState;
  changedFields: string[];
  trigger: 'user_action' | 'auto_calculation' | 'validation' | 'load';
}

export interface StatePersistenceOptions {
  storageKey?: string;
  autoSave?: boolean;
  saveDelay?: number;
  maxHistorySize?: number;
  validateOnLoad?: boolean;
}

export interface StateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  autoCorrections: string[];
}

/**
 * Configuration State Manager
 * Manages configuration state, persistence, and transitions
 */
export class ConfigurationStateManager {
  private currentState: ConfigurationState;
  private stateHistory: StateChangeEvent[] = [];
  private options: Required<StatePersistenceOptions>;
  private saveTimer: NodeJS.Timeout | null = null;
  private subscribers: Set<(state: ConfigurationState, event?: StateChangeEvent) => void> = new Set();
  
  // Selection memory - preserves user selections even when temporarily unavailable
  private selectionMemory: Map<string, any> = new Map();
  
  constructor(
    initialState?: Partial<ConfigurationState>,
    options?: StatePersistenceOptions
  ) {
    // Set default options
    this.options = {
      storageKey: 'battletech-configuration-state',
      autoSave: true,
      saveDelay: 1000, // 1 second debounce
      maxHistorySize: 50,
      validateOnLoad: true,
      ...options
    };
    
    // Initialize state
    this.currentState = this.createDefaultState();
    
    // Try to load saved state
    const savedState = this.loadState();
    if (savedState) {
      console.log('[ConfigurationStateManager] Loaded saved state');
      this.currentState = { ...this.currentState, ...savedState };
    }
    
    // Apply initial state if provided
    if (initialState) {
      console.log('[ConfigurationStateManager] Applying initial state');
      this.currentState = { ...this.currentState, ...initialState };
    }
    
    // Validate initial state
    const validation = this.validateState(this.currentState);
    if (!validation.isValid) {
      console.warn('[ConfigurationStateManager] Initial state validation failed:', validation.errors);
      this.currentState.isValid = false;
    }
    
    console.log('[ConfigurationStateManager] Initialized with state:', this.currentState);
  }
  
  // ============================================================================
  // STATE ACCESS
  // ============================================================================
  
  /**
   * Get current configuration state
   */
  getCurrentState(): ConfigurationState {
    return { ...this.currentState };
  }
  
  /**
   * Get specific component selection
   */
  getComponentSelection(componentType: keyof ComponentSelection): any {
    return this.currentState.components[componentType];
  }
  
  /**
   * Check if state is valid
   */
  isStateValid(): boolean {
    return this.currentState.isValid;
  }
  
  // ============================================================================
  // STATE UPDATES
  // ============================================================================
  
  /**
   * Update configuration state
   */
  updateState(
    updates: Partial<ConfigurationState>,
    trigger: 'user_action' | 'auto_calculation' | 'validation' | 'load' = 'user_action'
  ): StateChangeEvent {
    const previousState = { ...this.currentState };
    const changedFields: string[] = [];
    
    // Detect changed fields
    Object.keys(updates).forEach(key => {
      if (JSON.stringify(previousState[key as keyof ConfigurationState]) !== 
          JSON.stringify(updates[key as keyof ConfigurationState])) {
        changedFields.push(key);
      }
    });
    
    // Apply updates
    this.currentState = {
      ...this.currentState,
      ...updates,
      lastModified: Date.now()
    };
    
    // Validate new state
    const validation = this.validateState(this.currentState);
    this.currentState.isValid = validation.isValid;
    
    if (!validation.isValid) {
      console.warn('[ConfigurationStateManager] State update resulted in invalid state:', validation.errors);
    }
    
    // Create state change event
    const event: StateChangeEvent = {
      type: changedFields.length === 1 && changedFields[0] === 'components' 
        ? 'component_changed' 
        : changedFields.length > 5 
        ? 'full_update' 
        : this.determineChangeType(changedFields),
      timestamp: Date.now(),
      previousState,
      newState: { ...this.currentState },
      changedFields,
      trigger
    };
    
    // Record in history
    this.recordStateChange(event);
    
    // Notify subscribers
    this.notifySubscribers(event);
    
    // Auto-save if enabled
    if (this.options.autoSave) {
      this.scheduleSave();
    }
    
    console.log('[ConfigurationStateManager] State updated:', {
      changedFields,
      trigger,
      isValid: this.currentState.isValid
    });
    
    return event;
  }
  
  /**
   * Update component selection
   */
  updateComponentSelection(
    componentType: keyof ComponentSelection,
    value: any,
    preserveInMemory: boolean = true
  ): StateChangeEvent {
    // Preserve selection in memory
    if (preserveInMemory) {
      this.rememberSelection(componentType, value);
    }
    
    const updates: Partial<ConfigurationState> = {
      components: {
        ...this.currentState.components,
        [componentType]: value
      }
    };
    
    return this.updateState(updates, 'user_action');
  }
  
  /**
   * Update multiple fields atomically
   */
  updateMultipleFields(
    updates: Record<string, any>,
    trigger: 'user_action' | 'auto_calculation' | 'validation' | 'load' = 'user_action'
  ): StateChangeEvent {
    const stateUpdates: Partial<ConfigurationState> = {};
    
    Object.entries(updates).forEach(([key, value]) => {
      // Handle nested updates for components
      if (key.startsWith('components.')) {
        const componentType = key.replace('components.', '') as keyof ComponentSelection;
        stateUpdates.components = {
          ...(stateUpdates.components || this.currentState.components),
          [componentType]: value
        };
        // Remember the selection
        this.rememberSelection(componentType, value);
      } else {
        (stateUpdates as any)[key] = value;
      }
    });
    
    return this.updateState(stateUpdates, trigger);
  }
  
  // ============================================================================
  // SELECTION MEMORY
  // ============================================================================
  
  /**
   * Remember a user's component selection
   */
  rememberSelection(componentType: string, value: any): void {
    this.selectionMemory.set(componentType, value);
    console.log(`[ConfigurationStateManager] Remembered selection: ${componentType} = ${value}`);
  }
  
  /**
   * Retrieve remembered selection
   */
  getRememberedSelection(componentType: string): any | undefined {
    return this.selectionMemory.get(componentType);
  }
  
  /**
   * Check if we have a remembered selection
   */
  hasRememberedSelection(componentType: string): boolean {
    return this.selectionMemory.has(componentType);
  }
  
  /**
   * Clear remembered selection
   */
  clearRememberedSelection(componentType: string): void {
    this.selectionMemory.delete(componentType);
    console.log(`[ConfigurationStateManager] Cleared remembered selection: ${componentType}`);
  }
  
  /**
   * Clear all remembered selections
   */
  clearAllRememberedSelections(): void {
    this.selectionMemory.clear();
    console.log('[ConfigurationStateManager] Cleared all remembered selections');
  }
  
  /**
   * Try to restore remembered selection if it becomes available again
   */
  tryRestoreRememberedSelection(
    componentType: string,
    availableOptions: any[]
  ): any | undefined {
    const remembered = this.getRememberedSelection(componentType);
    if (!remembered) return undefined;
    
    // Check if the remembered option is now available
    const isAvailable = availableOptions.some(option => 
      option === remembered || option.id === remembered || option.value === remembered
    );
    
    if (isAvailable) {
      console.log(`[ConfigurationStateManager] Restored remembered selection: ${componentType} = ${remembered}`);
      return remembered;
    }
    
    return undefined;
  }
  
  // ============================================================================
  // STATE PERSISTENCE
  // ============================================================================
  
  /**
   * Save state to storage
   */
  saveState(): void {
    if (typeof window === 'undefined') {
      console.warn('[ConfigurationStateManager] Cannot save state: no window object');
      return;
    }
    
    try {
      const serialized = JSON.stringify(this.currentState);
      localStorage.setItem(this.options.storageKey, serialized);
      console.log('[ConfigurationStateManager] State saved to storage');
    } catch (error) {
      console.error('[ConfigurationStateManager] Failed to save state:', error);
    }
  }
  
  /**
   * Load state from storage
   */
  loadState(): ConfigurationState | null {
    if (typeof window === 'undefined') {
      console.warn('[ConfigurationStateManager] Cannot load state: no window object');
      return null;
    }
    
    try {
      const serialized = localStorage.getItem(this.options.storageKey);
      if (!serialized) {
        console.log('[ConfigurationStateManager] No saved state found');
        return null;
      }
      
      const state = JSON.parse(serialized) as ConfigurationState;
      
      // Validate if enabled
      if (this.options.validateOnLoad) {
        const validation = this.validateState(state);
        if (!validation.isValid) {
          console.warn('[ConfigurationStateManager] Loaded state is invalid:', validation.errors);
          // Could either reject the state or auto-correct it
          state.isValid = false;
        }
      }
      
      return state;
    } catch (error) {
      console.error('[ConfigurationStateManager] Failed to load state:', error);
      return null;
    }
  }
  
  /**
   * Clear saved state from storage
   */
  clearSavedState(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(this.options.storageKey);
      console.log('[ConfigurationStateManager] Cleared saved state from storage');
    } catch (error) {
      console.error('[ConfigurationStateManager] Failed to clear saved state:', error);
    }
  }
  
  /**
   * Schedule auto-save with debouncing
   */
  private scheduleSave(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    
    this.saveTimer = setTimeout(() => {
      this.saveState();
      this.saveTimer = null;
    }, this.options.saveDelay);
  }
  
  // ============================================================================
  // STATE VALIDATION
  // ============================================================================
  
  /**
   * Validate configuration state
   */
  validateState(state: ConfigurationState): StateValidationResult {
    const result: StateValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      autoCorrections: []
    };
    
    // Validate tonnage
    if (state.tonnage < 20 || state.tonnage > 100) {
      result.errors.push(`Invalid tonnage: ${state.tonnage} (must be between 20 and 100)`);
      result.isValid = false;
    }
    
    if (state.tonnage % 5 !== 0) {
      result.warnings.push(`Tonnage ${state.tonnage} is not a multiple of 5`);
    }
    
    // Validate engine rating
    const maxEngineRating = 400;
    if (state.engineRating > maxEngineRating) {
      result.errors.push(`Engine rating ${state.engineRating} exceeds maximum of ${maxEngineRating}`);
      result.isValid = false;
    }
    
    // Validate movement
    const calculatedWalkMP = Math.floor(state.engineRating / state.tonnage);
    if (state.walkMP !== calculatedWalkMP) {
      result.warnings.push(`Walk MP ${state.walkMP} doesn't match engine rating (should be ${calculatedWalkMP})`);
    }
    
    // Validate heat sinks
    if (state.totalHeatSinks < 10) {
      result.errors.push('Total heat sinks must be at least 10');
      result.isValid = false;
    }
    
    if (state.externalHeatSinks < 0) {
      result.errors.push('External heat sinks cannot be negative');
      result.isValid = false;
    }
    
    // Validate component selections
    if (!state.components.engine) {
      result.errors.push('Engine type must be selected');
      result.isValid = false;
    }
    
    if (!state.components.gyro) {
      result.errors.push('Gyro type must be selected');
      result.isValid = false;
    }
    
    return result;
  }
  
  /**
   * Auto-correct state issues
   */
  autoCorrectState(state: ConfigurationState): ConfigurationState {
    const corrected = { ...state };
    
    // Round tonnage to nearest 5
    if (corrected.tonnage % 5 !== 0) {
      corrected.tonnage = Math.round(corrected.tonnage / 5) * 5;
    }
    
    // Clamp tonnage to valid range
    corrected.tonnage = Math.max(20, Math.min(100, corrected.tonnage));
    
    // Clamp engine rating
    corrected.engineRating = Math.max(10, Math.min(400, corrected.engineRating));
    
    // Recalculate walk MP
    corrected.walkMP = Math.floor(corrected.engineRating / corrected.tonnage);
    
    // Recalculate run MP
    corrected.runMP = Math.floor(corrected.walkMP * 1.5);
    
    // Ensure minimum heat sinks
    corrected.totalHeatSinks = Math.max(10, corrected.totalHeatSinks);
    
    // Recalculate external heat sinks
    corrected.externalHeatSinks = Math.max(0, corrected.totalHeatSinks - corrected.internalHeatSinks);
    
    return corrected;
  }
  
  // ============================================================================
  // STATE HISTORY
  // ============================================================================
  
  /**
   * Record state change in history
   */
  private recordStateChange(event: StateChangeEvent): void {
    this.stateHistory.push(event);
    
    // Trim history if it exceeds max size
    if (this.stateHistory.length > this.options.maxHistorySize) {
      this.stateHistory = this.stateHistory.slice(-this.options.maxHistorySize);
    }
  }
  
  /**
   * Get state history
   */
  getStateHistory(): StateChangeEvent[] {
    return [...this.stateHistory];
  }
  
  /**
   * Get recent state changes
   */
  getRecentChanges(count: number = 10): StateChangeEvent[] {
    return this.stateHistory.slice(-count);
  }
  
  /**
   * Undo last state change
   */
  undo(): boolean {
    if (this.stateHistory.length === 0) {
      console.warn('[ConfigurationStateManager] No history to undo');
      return false;
    }
    
    const lastEvent = this.stateHistory[this.stateHistory.length - 1];
    this.currentState = { ...lastEvent.previousState, lastModified: Date.now() };
    this.stateHistory.pop();
    
    this.notifySubscribers();
    
    if (this.options.autoSave) {
      this.scheduleSave();
    }
    
    console.log('[ConfigurationStateManager] Undid last change');
    return true;
  }
  
  /**
   * Clear state history
   */
  clearHistory(): void {
    this.stateHistory = [];
    console.log('[ConfigurationStateManager] Cleared state history');
  }
  
  // ============================================================================
  // SUBSCRIBERS
  // ============================================================================
  
  /**
   * Subscribe to state changes
   */
  subscribe(
    callback: (state: ConfigurationState, event?: StateChangeEvent) => void
  ): () => void {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }
  
  /**
   * Notify all subscribers of state change
   */
  private notifySubscribers(event?: StateChangeEvent): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.currentState, event);
      } catch (error) {
        console.error('[ConfigurationStateManager] Error in subscriber callback:', error);
      }
    });
  }
  
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
  /**
   * Create default configuration state
   */
  private createDefaultState(): ConfigurationState {
    return {
      tonnage: 50,
      techBase: 'Inner Sphere',
      unitType: 'BattleMech',
      components: {
        engine: 'Standard',
        gyro: 'Standard',
        structure: 'Standard',
        armor: 'Standard',
        heatSink: 'Single'
      },
      walkMP: 4,
      engineRating: 200,
      runMP: 6,
      jumpMP: 0,
      totalHeatSinks: 10,
      internalHeatSinks: 8,
      externalHeatSinks: 2,
      armorTonnage: 0,
      armorPoints: 0,
      lastModified: Date.now(),
      version: '1.0.0',
      isValid: true
    };
  }
  
  /**
   * Determine change type from changed fields
   */
  private determineChangeType(changedFields: string[]): StateChangeEvent['type'] {
    if (changedFields.includes('components')) {
      return 'component_changed';
    }
    if (changedFields.includes('tonnage')) {
      return 'tonnage_changed';
    }
    if (changedFields.includes('techBase')) {
      return 'tech_base_changed';
    }
    return 'full_update';
  }
  
  /**
   * Reset to default state
   */
  reset(): void {
    this.currentState = this.createDefaultState();
    this.clearHistory();
    this.clearAllRememberedSelections();
    this.notifySubscribers();
    
    if (this.options.autoSave) {
      this.saveState();
    }
    
    console.log('[ConfigurationStateManager] Reset to default state');
  }
  
  /**
   * Export state as JSON
   */
  exportState(): string {
    return JSON.stringify(this.currentState, null, 2);
  }
  
  /**
   * Import state from JSON
   */
  importState(json: string): boolean {
    try {
      const state = JSON.parse(json) as ConfigurationState;
      const validation = this.validateState(state);
      
      if (!validation.isValid) {
        console.error('[ConfigurationStateManager] Cannot import invalid state:', validation.errors);
        return false;
      }
      
      this.updateState(state, 'load');
      return true;
    } catch (error) {
      console.error('[ConfigurationStateManager] Failed to import state:', error);
      return false;
    }
  }
  
  /**
   * Get debug information
   */
  getDebugInfo(): {
    currentState: ConfigurationState;
    historySize: number;
    subscriberCount: number;
    rememberedSelections: Record<string, any>;
    isValid: boolean;
  } {
    return {
      currentState: this.getCurrentState(),
      historySize: this.stateHistory.length,
      subscriberCount: this.subscribers.size,
      rememberedSelections: Object.fromEntries(this.selectionMemory),
      isValid: this.isStateValid()
    };
  }
}
