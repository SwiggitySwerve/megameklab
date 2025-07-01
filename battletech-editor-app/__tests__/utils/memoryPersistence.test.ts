/**
 * Memory Persistence Test Suite
 * Tests for localStorage integration and cross-session memory persistence
 */

import {
  saveMemoryToStorage,
  loadMemoryFromStorage,
  clearMemoryStorage,
  initializeMemorySystem,
  updateMemoryState,
  isStorageAvailable,
  MemoryDebug
} from '../../utils/memoryPersistence';

import {
  createDefaultMemory,
  MEMORY_VERSION,
  MEMORY_STORAGE_KEY
} from '../../utils/techBaseMemory';

import { ComponentMemoryState } from '../../types/componentDatabase';

// Mock localStorage for testing
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

// Replace global localStorage with mock
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('Memory Persistence', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  describe('Storage Availability', () => {
    test('should detect localStorage availability', () => {
      expect(isStorageAvailable()).toBe(true);
    });

    test('should handle localStorage errors gracefully', () => {
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(isStorageAvailable()).toBe(false);

      // Restore original implementation
      mockLocalStorage.setItem.mockImplementation(originalSetItem);
    });
  });

  describe('Save and Load Memory', () => {
    test('should save memory state to localStorage', () => {
      const memoryState: ComponentMemoryState = {
        techBaseMemory: createDefaultMemory(),
        lastUpdated: Date.now(),
        version: MEMORY_VERSION
      };

      const result = saveMemoryToStorage(memoryState);

      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        MEMORY_STORAGE_KEY,
        JSON.stringify(memoryState)
      );
    });

    test('should load memory state from localStorage', () => {
      const memoryState: ComponentMemoryState = {
        techBaseMemory: createDefaultMemory(),
        lastUpdated: Date.now(),
        version: MEMORY_VERSION
      };

      // Manually set localStorage data
      mockLocalStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memoryState));

      const loaded = loadMemoryFromStorage();

      expect(loaded).not.toBeNull();
      expect(loaded?.version).toBe(MEMORY_VERSION);
      expect(loaded?.techBaseMemory).toEqual(memoryState.techBaseMemory);
    });

    test('should return null when no memory exists in localStorage', () => {
      const loaded = loadMemoryFromStorage();
      expect(loaded).toBeNull();
    });

    test('should handle corrupted localStorage data', () => {
      // Set invalid JSON
      mockLocalStorage.setItem(MEMORY_STORAGE_KEY, 'invalid-json');

      const loaded = loadMemoryFromStorage();

      expect(loaded).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(MEMORY_STORAGE_KEY);
    });

    test('should validate memory structure', () => {
      const invalidMemory = {
        techBaseMemory: {}, // Missing required categories
        lastUpdated: Date.now(),
        version: MEMORY_VERSION
      };

      mockLocalStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(invalidMemory));

      const loaded = loadMemoryFromStorage();

      expect(loaded).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(MEMORY_STORAGE_KEY);
    });
  });

  describe('Memory System Initialization', () => {
    test('should initialize fresh memory when none exists', () => {
      const memoryState = initializeMemorySystem();

      expect(memoryState).toBeDefined();
      expect(memoryState.version).toBe(MEMORY_VERSION);
      expect(memoryState.techBaseMemory).toBeDefined();
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    test('should load existing memory when available', () => {
      const existingMemory: ComponentMemoryState = {
        techBaseMemory: createDefaultMemory(),
        lastUpdated: Date.now() - 1000, // Earlier timestamp
        version: MEMORY_VERSION
      };

      // Set up existing memory
      mockLocalStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(existingMemory));

      const memoryState = initializeMemorySystem();

      expect(memoryState.lastUpdated).toBe(existingMemory.lastUpdated);
      expect(memoryState.techBaseMemory).toEqual(existingMemory.techBaseMemory);
    });

    test('should handle localStorage unavailable gracefully', () => {
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const memoryState = initializeMemorySystem();

      expect(memoryState).toBeDefined();
      expect(memoryState.version).toBe(MEMORY_VERSION);

      // Restore original implementation
      mockLocalStorage.setItem.mockImplementation(originalSetItem);
    });
  });

  describe('Memory State Updates', () => {
    test('should update memory state and persist', () => {
      const initialState = initializeMemorySystem();
      const newMemory = createDefaultMemory();
      
      // Modify memory
      newMemory.myomer['Inner Sphere'] = 'Triple Strength Myomer';

      const updatedState = updateMemoryState(initialState, newMemory);

      expect(updatedState.techBaseMemory.myomer['Inner Sphere']).toBe('Triple Strength Myomer');
      expect(updatedState.lastUpdated).toBeGreaterThan(initialState.lastUpdated);
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2); // Initial + update
    });

    test('should not persist when persist flag is false', () => {
      const initialState = initializeMemorySystem();
      const newMemory = createDefaultMemory();
      
      jest.clearAllMocks(); // Clear previous setItem calls

      const updatedState = updateMemoryState(initialState, newMemory, false);

      expect(updatedState).toBeDefined();
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Memory Clearing', () => {
    test('should clear memory storage', () => {
      // Set up some memory first
      const memoryState = initializeMemorySystem();
      
      clearMemoryStorage();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(MEMORY_STORAGE_KEY);
    });

    test('should handle clear errors gracefully', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Remove error');
      });

      expect(() => clearMemoryStorage()).not.toThrow();
    });
  });

  describe('Cross-Session Persistence', () => {
    test('should persist memory across simulated page reload', () => {
      // Simulate first session
      const memory1 = initializeMemorySystem();
      const modifiedMemory = createDefaultMemory();
      modifiedMemory.myomer['Inner Sphere'] = 'Triple Strength Myomer';
      
      updateMemoryState(memory1, modifiedMemory);

      // Simulate page reload (clear local state but keep localStorage)
      const memory2 = initializeMemorySystem();

      expect(memory2.techBaseMemory.myomer['Inner Sphere']).toBe('Triple Strength Myomer');
    });

    test('should persist complex memory configurations', () => {
      const memory1 = initializeMemorySystem();
      const complexMemory = createDefaultMemory();
      
      // Set up complex configuration
      complexMemory.myomer['Inner Sphere'] = 'Triple Strength Myomer';
      complexMemory.myomer['Clan'] = 'MASC';
      complexMemory.targeting['Clan'] = 'Clan Targeting Computer';
      complexMemory.engine['Inner Sphere'] = 'XL Engine';
      
      updateMemoryState(memory1, complexMemory);

      // Simulate page reload
      const memory2 = initializeMemorySystem();

      expect(memory2.techBaseMemory.myomer['Inner Sphere']).toBe('Triple Strength Myomer');
      expect(memory2.techBaseMemory.myomer['Clan']).toBe('MASC');
      expect(memory2.techBaseMemory.targeting['Clan']).toBe('Clan Targeting Computer');
      expect(memory2.techBaseMemory.engine['Inner Sphere']).toBe('XL Engine');
    });
  });

  describe('Debug Utilities', () => {
    test('should provide debug utilities', () => {
      expect(MemoryDebug).toBeDefined();
      expect(typeof MemoryDebug.logCurrentState).toBe('function');
      expect(typeof MemoryDebug.resetToDefaults).toBe('function');
      expect(typeof MemoryDebug.getStorageInfo).toBe('function');
    });

    test('should reset memory to defaults', () => {
      // Set up modified memory
      const memory = initializeMemorySystem();
      const modifiedMemory = createDefaultMemory();
      modifiedMemory.myomer['Inner Sphere'] = 'Triple Strength Myomer';
      updateMemoryState(memory, modifiedMemory);

      // Reset to defaults
      MemoryDebug.resetToDefaults();

      // Load fresh memory
      const resetMemory = loadMemoryFromStorage();
      expect(resetMemory?.techBaseMemory.myomer['Inner Sphere']).toBe('None');
    });

    test('should provide storage info', () => {
      initializeMemorySystem();
      
      const info = MemoryDebug.getStorageInfo();
      
      expect(info).toHaveProperty('isAvailable');
      expect(info).toHaveProperty('size');
      expect(info).toHaveProperty('hasData');
      expect(info.isAvailable).toBe(true);
      expect(info.hasData).toBe(true);
    });
  });

  describe('Performance and Memory Management', () => {
    test('should handle rapid memory updates efficiently', () => {
      const memory = initializeMemorySystem();
      const startTime = Date.now();
      
      // Perform many rapid updates
      for (let i = 0; i < 100; i++) {
        const newMemory = createDefaultMemory();
        newMemory.myomer['Inner Sphere'] = `Component${i}`;
        updateMemoryState(memory, newMemory);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second for 100 updates
    });

    test('should not leak memory with frequent updates', () => {
      const memory = initializeMemorySystem();
      const initialCallCount = mockLocalStorage.setItem.mock.calls.length;
      
      // Many updates should still result in predictable localStorage calls
      for (let i = 0; i < 10; i++) {
        const newMemory = createDefaultMemory();
        newMemory.myomer['Inner Sphere'] = `Component${i}`;
        updateMemoryState(memory, newMemory);
      }
      
      const finalCallCount = mockLocalStorage.setItem.mock.calls.length;
      expect(finalCallCount - initialCallCount).toBe(10); // One call per update
    });
  });

  describe('Version Migration', () => {
    test('should handle version mismatch by recreating memory', () => {
      const oldVersionMemory = {
        techBaseMemory: createDefaultMemory(),
        lastUpdated: Date.now(),
        version: '0.9.0' // Old version
      };

      mockLocalStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(oldVersionMemory));

      const memory = initializeMemorySystem();

      expect(memory.version).toBe(MEMORY_VERSION);
      expect(memory.techBaseMemory).toEqual(createDefaultMemory());
    });

    test('should handle missing version field', () => {
      const noVersionMemory = {
        techBaseMemory: createDefaultMemory(),
        lastUpdated: Date.now()
        // Missing version field
      };

      mockLocalStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(noVersionMemory));

      const memory = initializeMemorySystem();

      expect(memory.version).toBe(MEMORY_VERSION);
    });
  });
});
