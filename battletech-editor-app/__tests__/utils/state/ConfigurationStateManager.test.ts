/**
 * Tests for ConfigurationStateManager
 * Verifies state management, persistence, and selection memory
 */

import { ConfigurationStateManager, ConfigurationState } from '../../../utils/state';

describe('ConfigurationStateManager', () => {
  let stateManager: ConfigurationStateManager;

  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    
    stateManager = new ConfigurationStateManager(undefined, {
      autoSave: false, // Disable auto-save for tests
      validateOnLoad: true
    });
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const state = stateManager.getCurrentState();

      expect(state).toBeDefined();
      expect(state.tonnage).toBe(50);
      expect(state.techBase).toBe('Inner Sphere');
      expect(state.components.engine).toBe('Standard');
      expect(state.isValid).toBe(true);
    });

    it('should initialize with custom state', () => {
      const customManager = new ConfigurationStateManager({
        tonnage: 75,
        techBase: 'Clan'
      }, {
        autoSave: false
      });

      const state = customManager.getCurrentState();

      expect(state.tonnage).toBe(75);
      expect(state.techBase).toBe('Clan');
    });
  });

  describe('updateState', () => {
    it('should update state fields', () => {
      const result = stateManager.updateState({
        tonnage: 60
      });

      expect(result.changedFields).toContain('tonnage');
      expect(stateManager.getCurrentState().tonnage).toBe(60);
    });

    it('should update multiple fields', () => {
      stateManager.updateState({
        tonnage: 70,
        techBase: 'Clan',
        walkMP: 5
      });

      const state = stateManager.getCurrentState();
      expect(state.tonnage).toBe(70);
      expect(state.techBase).toBe('Clan');
      expect(state.walkMP).toBe(5);
    });

    it('should validate state after update', () => {
      // Update with invalid tonnage
      stateManager.updateState({
        tonnage: 150 // Too high
      });

      const state = stateManager.getCurrentState();
      expect(state.isValid).toBe(false);
    });

    it('should record state changes in history', () => {
      stateManager.updateState({ tonnage: 60 });
      stateManager.updateState({ tonnage: 70 });

      const history = stateManager.getStateHistory();
      expect(history.length).toBe(2);
    });
  });

  describe('updateComponentSelection', () => {
    it('should update component selection', () => {
      stateManager.updateComponentSelection('engine', 'XL (IS)', true);

      const state = stateManager.getCurrentState();
      expect(state.components.engine).toBe('XL (IS)');
    });

    it('should remember selection when preserveInMemory is true', () => {
      stateManager.updateComponentSelection('engine', 'XL (IS)', true);

      const remembered = stateManager.getRememberedSelection('engine');
      expect(remembered).toBe('XL (IS)');
    });

    it('should not remember selection when preserveInMemory is false', () => {
      stateManager.updateComponentSelection('engine', 'Standard', false);

      const remembered = stateManager.getRememberedSelection('engine');
      expect(remembered).toBeUndefined();
    });
  });

  describe('selection memory', () => {
    it('should remember component selection', () => {
      stateManager.rememberSelection('engine', 'XL (IS)');

      const remembered = stateManager.getRememberedSelection('engine');
      expect(remembered).toBe('XL (IS)');
    });

    it('should restore remembered selection if available', () => {
      stateManager.rememberSelection('engine', 'XL (IS)');

      const availableOptions = ['Standard', 'XL (IS)', 'Light'];
      const restored = stateManager.tryRestoreRememberedSelection('engine', availableOptions);

      expect(restored).toBe('XL (IS)');
    });

    it('should not restore if selection not in available options', () => {
      stateManager.rememberSelection('engine', 'XL (IS)');

      const availableOptions = ['Standard', 'Compact'];
      const restored = stateManager.tryRestoreRememberedSelection('engine', availableOptions);

      expect(restored).toBeUndefined();
    });

    it('should clear remembered selection', () => {
      stateManager.rememberSelection('engine', 'XL (IS)');
      stateManager.clearRememberedSelection('engine');

      const remembered = stateManager.getRememberedSelection('engine');
      expect(remembered).toBeUndefined();
    });

    it('should clear all remembered selections', () => {
      stateManager.rememberSelection('engine', 'XL (IS)');
      stateManager.rememberSelection('gyro', 'Compact');
      stateManager.clearAllRememberedSelections();

      expect(stateManager.getRememberedSelection('engine')).toBeUndefined();
      expect(stateManager.getRememberedSelection('gyro')).toBeUndefined();
    });
  });

  describe('validateState', () => {
    it('should validate valid state', () => {
      const state = stateManager.getCurrentState();
      const validation = stateManager.validateState(state);

      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should detect invalid tonnage', () => {
      const invalidState: ConfigurationState = {
        ...stateManager.getCurrentState(),
        tonnage: 150 // Too high
      };

      const validation = stateManager.validateState(invalidState);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('tonnage'))).toBe(true);
    });

    it('should detect invalid engine rating', () => {
      const invalidState: ConfigurationState = {
        ...stateManager.getCurrentState(),
        engineRating: 500 // Too high
      };

      const validation = stateManager.validateState(invalidState);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('rating'))).toBe(true);
    });

    it('should detect insufficient heat sinks', () => {
      const invalidState: ConfigurationState = {
        ...stateManager.getCurrentState(),
        totalHeatSinks: 5 // Too few
      };

      const validation = stateManager.validateState(invalidState);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('heat'))).toBe(true);
    });
  });

  describe('history and undo', () => {
    it('should track state history', () => {
      stateManager.updateState({ tonnage: 60 });
      stateManager.updateState({ tonnage: 70 });
      stateManager.updateState({ tonnage: 80 });

      const history = stateManager.getStateHistory();
      expect(history.length).toBe(3);
    });

    it('should undo last change', () => {
      stateManager.updateState({ tonnage: 60 });
      const previousState = stateManager.getCurrentState();
      
      stateManager.updateState({ tonnage: 70 });
      expect(stateManager.getCurrentState().tonnage).toBe(70);

      const undone = stateManager.undo();
      expect(undone).toBe(true);
      expect(stateManager.getCurrentState().tonnage).toBe(60);
    });

    it('should not undo if no history', () => {
      const undone = stateManager.undo();
      expect(undone).toBe(false);
    });

    it('should limit history size', () => {
      const limitedManager = new ConfigurationStateManager(undefined, {
        maxHistorySize: 5,
        autoSave: false
      });

      // Add more than maxHistorySize changes
      for (let i = 0; i < 10; i++) {
        limitedManager.updateState({ tonnage: 50 + i });
      }

      const history = limitedManager.getStateHistory();
      expect(history.length).toBeLessThanOrEqual(5);
    });
  });

  describe('subscribers', () => {
    it('should notify subscribers on state change', () => {
      const mockCallback = jest.fn();
      stateManager.subscribe(mockCallback);

      stateManager.updateState({ tonnage: 60 });

      expect(mockCallback).toHaveBeenCalled();
    });

    it('should pass state and event to subscribers', () => {
      const mockCallback = jest.fn();
      stateManager.subscribe(mockCallback);

      stateManager.updateState({ tonnage: 60 });

      const [state, event] = mockCallback.mock.calls[0];
      expect(state).toBeDefined();
      expect(state.tonnage).toBe(60);
      expect(event).toBeDefined();
      expect(event.changedFields).toContain('tonnage');
    });

    it('should allow unsubscribing', () => {
      const mockCallback = jest.fn();
      const unsubscribe = stateManager.subscribe(mockCallback);

      stateManager.updateState({ tonnage: 60 });
      expect(mockCallback).toHaveBeenCalledTimes(1);

      unsubscribe();
      stateManager.updateState({ tonnage: 70 });
      expect(mockCallback).toHaveBeenCalledTimes(1); // Not called again
    });
  });

  describe('export and import', () => {
    it('should export state as JSON', () => {
      stateManager.updateState({ tonnage: 75 });
      
      const exported = stateManager.exportState();
      const parsed = JSON.parse(exported);

      expect(parsed.tonnage).toBe(75);
      expect(parsed.components).toBeDefined();
    });

    it('should import valid state', () => {
      const validState = {
        ...stateManager.getCurrentState(),
        tonnage: 85
      };
      
      const json = JSON.stringify(validState);
      const success = stateManager.importState(json);

      expect(success).toBe(true);
      expect(stateManager.getCurrentState().tonnage).toBe(85);
    });

    it('should reject invalid state import', () => {
      const invalidJson = '{ "invalid": true }';
      const success = stateManager.importState(invalidJson);

      expect(success).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset to default state', () => {
      stateManager.updateState({ tonnage: 75, techBase: 'Clan' });
      stateManager.rememberSelection('engine', 'XL (IS)');
      stateManager.reset();

      const state = stateManager.getCurrentState();
      expect(state.tonnage).toBe(50);
      expect(state.techBase).toBe('Inner Sphere');
      expect(stateManager.getRememberedSelection('engine')).toBeUndefined();
      expect(stateManager.getStateHistory().length).toBe(0);
    });
  });
});
