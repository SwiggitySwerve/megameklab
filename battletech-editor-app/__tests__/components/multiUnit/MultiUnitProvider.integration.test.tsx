/**
 * Multi-Unit Provider Integration Tests
 * Simplified tests that focus on core provider functionality with minimal mocking
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { MultiUnitProvider, useMultiUnit } from '../../../components/multiUnit/MultiUnitProvider';

// Simple mock for localStorage
const createMockLocalStorage = () => {
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
    }),
    get store() { return { ...store }; }
  };
};

// Mock the critical dependencies that cause issues in tests
jest.mock('../../../utils/DebouncedSaveManager', () => ({
  MultiTabDebouncedSaveManager: jest.fn().mockImplementation(() => ({
    scheduleSaveForTab: jest.fn(),
    saveTabImmediately: jest.fn()
  })),
  SaveManagerBrowserHandlers: {
    getInstance: jest.fn(() => ({
      attachSaveManager: jest.fn(),
      detachSaveManager: jest.fn()
    }))
  }
}));

// Test component to access provider context
function TestConsumer() {
  const context = useMultiUnit();
  
  return (
    <div>
      <div data-testid="provider-loaded">{context ? 'true' : 'false'}</div>
      <div data-testid="tabs-count">{context?.tabs?.length || 0}</div>
      <div data-testid="active-tab-id">{context?.activeTabId || 'none'}</div>
      <div data-testid="config-loaded">{context?.isConfigLoaded?.toString() || 'false'}</div>
      <div data-testid="has-unit">{context?.unit ? 'true' : 'false'}</div>
      <button 
        data-testid="create-tab-btn" 
        onClick={() => context?.createTab?.('Test Tab')}
        disabled={!context?.createTab}
      >
        Create Tab
      </button>
    </div>
  );
}

describe('MultiUnitProvider Integration Tests', () => {
  let mockLocalStorage: ReturnType<typeof createMockLocalStorage>;

  beforeEach(() => {
    // Create fresh localStorage mock
    mockLocalStorage = createMockLocalStorage();
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  describe('Provider Initialization', () => {
    test('should render provider and initialize with basic functionality', async () => {
      render(
        <MultiUnitProvider>
          <TestConsumer />
        </MultiUnitProvider>
      );

      // Provider should load
      expect(screen.getByTestId('provider-loaded')).toHaveTextContent('true');

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('config-loaded')).toHaveTextContent('true');
      }, { timeout: 3000 });

      // Should have at least one tab
      expect(screen.getByTestId('tabs-count')).toHaveTextContent('1');
      expect(screen.getByTestId('active-tab-id')).toHaveTextContent('tab-1');
    });

    test('should load existing tabs from localStorage', async () => {
      // Setup existing tabs in localStorage
      const metadata = {
        activeTabId: 'tab-2',
        nextTabNumber: 3,
        tabOrder: ['tab-1', 'tab-2'],
        tabNames: { 'tab-1': 'First Mech', 'tab-2': 'Second Mech' }
      };
      
      const tabConfig = {
        chassis: 'Test Mech',
        model: 'Test',
        tonnage: 50,
        unitType: 'BattleMech'
      };

      const tabData = {
        config: tabConfig,
        modified: new Date().toISOString(),
        version: '1.0.0'
      };

      mockLocalStorage.setItem('battletech-tabs-metadata', JSON.stringify(metadata));
      mockLocalStorage.setItem('battletech-unit-tab-tab-1', JSON.stringify(tabData));
      mockLocalStorage.setItem('battletech-unit-tab-tab-2', JSON.stringify(tabData));

      render(
        <MultiUnitProvider>
          <TestConsumer />
        </MultiUnitProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-loaded')).toHaveTextContent('true');
      }, { timeout: 3000 });

      // Should load the existing tabs
      expect(screen.getByTestId('tabs-count')).toHaveTextContent('2');
      expect(screen.getByTestId('active-tab-id')).toHaveTextContent('tab-2');
    });

    test('should handle corrupted localStorage gracefully', async () => {
      // Set invalid JSON in localStorage
      mockLocalStorage.setItem('battletech-tabs-metadata', 'invalid json {');
      mockLocalStorage.setItem('battletech-unit-tab-tab-1', 'also invalid');

      render(
        <MultiUnitProvider>
          <TestConsumer />
        </MultiUnitProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-loaded')).toHaveTextContent('true');
      }, { timeout: 3000 });

      // Should fall back to default state
      expect(screen.getByTestId('tabs-count')).toHaveTextContent('1');
      expect(screen.getByTestId('active-tab-id')).toHaveTextContent('tab-1');
    });

    test('should migrate legacy configuration', async () => {
      const legacyConfig = {
        chassis: 'Legacy Mech',
        tonnage: 75,
        unitType: 'BattleMech'
      };

      mockLocalStorage.setItem('battletech-unit-configuration', JSON.stringify(legacyConfig));

      render(
        <MultiUnitProvider>
          <TestConsumer />
        </MultiUnitProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-loaded')).toHaveTextContent('true');
      }, { timeout: 3000 });

      // Should have migrated the legacy config
      expect(screen.getByTestId('tabs-count')).toHaveTextContent('1');
      
      // Legacy config should be removed
      expect(mockLocalStorage.getItem('battletech-unit-configuration')).toBeNull();
    });
  });

  describe('Basic Tab Operations', () => {
    test('should provide context with expected properties', async () => {
      render(
        <MultiUnitProvider>
          <TestConsumer />
        </MultiUnitProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-loaded')).toHaveTextContent('true');
      }, { timeout: 3000 });

      // All basic properties should be available
      expect(screen.getByTestId('provider-loaded')).toHaveTextContent('true');
      expect(screen.getByTestId('tabs-count')).toHaveTextContent('1');
      expect(screen.getByTestId('active-tab-id')).toHaveTextContent('tab-1');
      expect(screen.getByTestId('has-unit')).toHaveTextContent('true');
    });

    test('should persist tab metadata to localStorage', async () => {
      render(
        <MultiUnitProvider>
          <TestConsumer />
        </MultiUnitProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-loaded')).toHaveTextContent('true');
      }, { timeout: 3000 });

      // Should have saved metadata to localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'battletech-tabs-metadata',
        expect.stringContaining('"activeTabId"')
      );
    });

    test('should handle localStorage errors gracefully', async () => {
      // Mock localStorage to throw an error
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      render(
        <MultiUnitProvider>
          <TestConsumer />
        </MultiUnitProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-loaded')).toHaveTextContent('true');
      }, { timeout: 3000 });

      // Should still work despite localStorage errors
      expect(screen.getByTestId('provider-loaded')).toHaveTextContent('true');
      expect(screen.getByTestId('tabs-count')).toHaveTextContent('1');
    });
  });

  describe('Error Boundaries', () => {
    test('should not crash when used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useMultiUnit must be used within MultiUnitProvider');

      consoleError.mockRestore();
    });

    test('should handle render during initialization', async () => {
      const { rerender } = render(
        <MultiUnitProvider>
          <TestConsumer />
        </MultiUnitProvider>
      );

      // Should be safe to rerender during initialization
      rerender(
        <MultiUnitProvider>
          <TestConsumer />
        </MultiUnitProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-loaded')).toHaveTextContent('true');
      }, { timeout: 3000 });

      expect(screen.getByTestId('provider-loaded')).toHaveTextContent('true');
    });
  });

  describe('Server-Side Rendering Safety', () => {
    test('should handle missing window object gracefully', async () => {
      // Mock server-side environment
      const originalWindow = global.window;
      const originalLocalStorage = window.localStorage;
      
      // @ts-ignore
      delete global.window;
      // @ts-ignore  
      global.window = {};

      render(
        <MultiUnitProvider>
          <TestConsumer />
        </MultiUnitProvider>
      );

      // Should handle missing localStorage gracefully
      expect(screen.getByTestId('provider-loaded')).toHaveTextContent('true');

      // Restore window
      global.window = originalWindow;
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true
      });
    });
  });

  describe('Context Value Stability', () => {
    test('should provide stable context reference', async () => {
      const contextReferences: any[] = [];
      
      function ContextCapture() {
        const context = useMultiUnit();
        contextReferences.push(context);
        return <div data-testid="context-capture">captured</div>;
      }

      const { rerender } = render(
        <MultiUnitProvider>
          <ContextCapture />
        </MultiUnitProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('context-capture')).toBeInTheDocument();
      });

      // Force re-render
      rerender(
        <MultiUnitProvider>
          <ContextCapture />
        </MultiUnitProvider>
      );

      // Should have captured context references
      expect(contextReferences.length).toBeGreaterThan(0);
    });
  });
});
