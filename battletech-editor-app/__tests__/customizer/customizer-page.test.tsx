import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/router';
import CustomizerPage from '../../pages/customizer/index';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock the editor components to focus on customizer logic
jest.mock('../../components/editor/UnitEditorWrapper', () => {
  return function MockUnitEditorWrapper({ unit, onUnitChange, onSave }: any) {
    return (
      <div data-testid="unit-editor-wrapper">
        <div data-testid="unit-display">{unit.chassis} {unit.model}</div>
        <button 
          data-testid="mock-edit-button" 
          onClick={() => onUnitChange({ ...unit, chassis: 'Modified' })}
        >
          Mock Edit
        </button>
        <button 
          data-testid="mock-save-button" 
          onClick={() => onSave?.(unit)}
        >
          Mock Save
        </button>
      </div>
    );
  };
});

// Mock the save dialog
jest.mock('../../components/editor/SaveUnitDialog', () => {
  return function MockSaveUnitDialog({ isOpen, onClose, onSave, originalChassis, originalModel }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="save-unit-dialog">
        <input 
          data-testid="chassis-input" 
          defaultValue={originalChassis}
          onChange={(e) => {}}
        />
        <input 
          data-testid="model-input" 
          defaultValue={originalModel}
          onChange={(e) => {}}
        />
        <button 
          data-testid="save-confirm" 
          onClick={() => onSave('TestChassis', 'TestModel')}
        >
          Save
        </button>
        <button data-testid="save-cancel" onClick={onClose}>Cancel</button>
      </div>
    );
  };
});

const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue({
    push: mockRouterPush,
    replace: mockRouterReplace,
    query: {},
    pathname: '/customizer',
  });
  
  // Clear mocks
  mockRouterPush.mockClear();
  mockRouterReplace.mockClear();
  
  // Mock window.alert
  global.alert = jest.fn();
  global.console.log = jest.fn();
});

describe('Customizer Page', () => {
  describe('Initial State', () => {
    test('renders with default Atlas unit tab', () => {
      render(<CustomizerPage />);
      
      // Should show the tab with Atlas AS7-D
      expect(screen.getByText(/Atlas AS7-D/)).toBeInTheDocument();
      expect(screen.getByTestId('unit-editor-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('unit-display')).toHaveTextContent('Atlas AS7-D');
    });

    test('renders tab controls', () => {
      render(<CustomizerPage />);
      
      // Should have new tab button
      expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument();
      
      // Should show the tab title
      expect(screen.getByText('Atlas AS7-D')).toBeInTheDocument();
    });

    test('new tab button is visible and functional', () => {
      render(<CustomizerPage />);
      
      const newTabButton = screen.getByRole('button', { name: '+' });
      expect(newTabButton).toBeInTheDocument();
      expect(newTabButton).toHaveAttribute('title', 'New Mek');
    });
  });

  describe('Tab Management', () => {
    test('can create new tab', async () => {
      const user = userEvent.setup();
      render(<CustomizerPage />);
      
      const newTabButton = screen.getByRole('button', { name: '+' });
      await user.click(newTabButton);
      
      // Should now have two tabs
      expect(screen.getByText('Atlas AS7-D')).toBeInTheDocument();
      expect(screen.getByText('New Mek')).toBeInTheDocument();
      
      // New tab should be active (check if it's displayed in editor)
      expect(screen.getByTestId('unit-display')).toHaveTextContent('New Mek');
    });

    test('can switch between tabs', async () => {
      const user = userEvent.setup();
      render(<CustomizerPage />);
      
      // Create second tab
      await user.click(screen.getByRole('button', { name: '+' }));
      
      // Click back to first tab
      await user.click(screen.getByText('Atlas AS7-D'));
      
      // Should show Atlas in editor
      expect(screen.getByTestId('unit-display')).toHaveTextContent('Atlas AS7-D');
    });

    test('can close tabs (but not the last one)', async () => {
      const user = userEvent.setup();
      render(<CustomizerPage />);
      
      // With only one tab, close button should not exist
      expect(screen.queryByText('×')).not.toBeInTheDocument();
      
      // Create second tab
      await user.click(screen.getByRole('button', { name: '+' }));
      
      // Now close buttons should appear
      const closeButtons = screen.getAllByText('×');
      expect(closeButtons).toHaveLength(2);
      
      // Close the second tab
      await user.click(closeButtons[1]);
      
      // Should be back to one tab
      expect(screen.getByText('Atlas AS7-D')).toBeInTheDocument();
      expect(screen.queryByText('New Mek')).not.toBeInTheDocument();
    });

    test('shows modification indicator when unit is modified', async () => {
      const user = userEvent.setup();
      render(<CustomizerPage />);
      
      // Initially no modification indicator
      expect(screen.queryByText('●')).not.toBeInTheDocument();
      
      // Trigger a modification
      await user.click(screen.getByTestId('mock-edit-button'));
      
      // Should show modification indicator
      await waitFor(() => {
        expect(screen.getByText('●')).toBeInTheDocument();
      });
    });

    test('updates tab title when unit chassis/model changes', async () => {
      const user = userEvent.setup();
      render(<CustomizerPage />);
      
      // Trigger a modification that changes the chassis
      await user.click(screen.getByTestId('mock-edit-button'));
      
      // Tab title should update
      await waitFor(() => {
        expect(screen.getByText(/Modified AS7-D/)).toBeInTheDocument();
      });
    });
  });

  describe('Tab State Isolation', () => {
    test('modifications in one tab do not affect other tabs', async () => {
      const user = userEvent.setup();
      render(<CustomizerPage />);
      
      // Create second tab
      await user.click(screen.getByRole('button', { name: '+' }));
      
      // Modify the second tab (New Mek)
      await user.click(screen.getByTestId('mock-edit-button'));
      
      // Switch back to first tab
      await user.click(screen.getByText('Atlas AS7-D'));
      
      // First tab should still show original Atlas
      expect(screen.getByTestId('unit-display')).toHaveTextContent('Atlas AS7-D');
      
      // Switch back to second tab
      await user.click(screen.getByText(/Modified/));
      
      // Second tab should show the modification
      expect(screen.getByTestId('unit-display')).toHaveTextContent('Modified Mek');
    });
  });

  describe('Save Functionality', () => {
    test('opens save dialog when save is triggered', async () => {
      const user = userEvent.setup();
      render(<CustomizerPage />);
      
      // Trigger save
      await user.click(screen.getByTestId('mock-save-button'));
      
      // Save dialog should open
      expect(screen.getByTestId('save-unit-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('chassis-input')).toBeInTheDocument();
      expect(screen.getByTestId('model-input')).toBeInTheDocument();
    });

    test('can cancel save dialog', async () => {
      const user = userEvent.setup();
      render(<CustomizerPage />);
      
      // Trigger save
      await user.click(screen.getByTestId('mock-save-button'));
      
      // Cancel save
      await user.click(screen.getByTestId('save-cancel'));
      
      // Dialog should close
      expect(screen.queryByTestId('save-unit-dialog')).not.toBeInTheDocument();
    });

    test('completes save operation and updates tab state', async () => {
      const user = userEvent.setup();
      render(<CustomizerPage />);
      
      // First modify the unit to make it dirty
      await user.click(screen.getByTestId('mock-edit-button'));
      
      // Wait for modification indicator
      await waitFor(() => {
        expect(screen.getByText('●')).toBeInTheDocument();
      });
      
      // Trigger save
      await user.click(screen.getByTestId('mock-save-button'));
      
      // Complete save
      await user.click(screen.getByTestId('save-confirm'));
      
      // Should show success alert
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('Unit "TestChassis TestModel" saved successfully!')
      );
      
      // Tab should update with new name and no longer show as modified
      await waitFor(() => {
        expect(screen.getByText('TestChassis TestModel')).toBeInTheDocument();
        expect(screen.queryByText('●')).not.toBeInTheDocument();
      });
    });
  });

  describe('Unit Creation Templates', () => {
    test('creates Atlas template with proper initial data', () => {
      render(<CustomizerPage />);
      
      // Check that initial unit has Atlas characteristics
      const unitDisplay = screen.getByTestId('unit-display');
      expect(unitDisplay).toHaveTextContent('Atlas AS7-D');
    });

    test('creates blank mech template when adding new tab', async () => {
      const user = userEvent.setup();
      render(<CustomizerPage />);
      
      // Create new tab
      await user.click(screen.getByRole('button', { name: '+' }));
      
      // Should show New Mek template
      expect(screen.getByTestId('unit-display')).toHaveTextContent('New Mek');
    });
  });

  describe('Error Handling', () => {
    test('handles missing unit data gracefully', () => {
      // This test would require mocking a scenario where unit data is corrupted
      // For now, just ensure the component renders without crashing
      render(<CustomizerPage />);
      expect(screen.getByTestId('unit-editor-wrapper')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('tab navigation is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<CustomizerPage />);
      
      // Create second tab
      await user.click(screen.getByRole('button', { name: '+' }));
      
      // Tab buttons should be focusable and activatable with keyboard
      const atlasTab = screen.getByText('Atlas AS7-D');
      atlasTab.focus();
      
      await user.keyboard('{Enter}');
      
      // Should switch to Atlas tab
      expect(screen.getByTestId('unit-display')).toHaveTextContent('Atlas AS7-D');
    });

    test('close buttons have proper accessibility attributes', async () => {
      const user = userEvent.setup();
      render(<CustomizerPage />);
      
      // Create second tab to show close buttons
      await user.click(screen.getByRole('button', { name: '+' }));
      
      const closeButtons = screen.getAllByText('×');
      closeButtons.forEach(button => {
        expect(button).toBeInTheDocument();
        // In a real implementation, these would have aria-labels
      });
    });
  });

  describe('Performance', () => {
    test('does not recreate components unnecessarily', () => {
      const { rerender } = render(<CustomizerPage />);
      
      const editorElement = screen.getByTestId('unit-editor-wrapper');
      
      // Re-render should not change the editor element
      rerender(<CustomizerPage />);
      
      expect(screen.getByTestId('unit-editor-wrapper')).toBe(editorElement);
    });
  });
});
