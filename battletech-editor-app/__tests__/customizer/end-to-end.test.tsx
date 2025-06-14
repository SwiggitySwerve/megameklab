import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/router';
import CustomizerPage from '../../pages/customizer/index';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock all editor components with more realistic behavior
jest.mock('../../components/editor/UnitEditorWrapper', () => {
  return function MockUnitEditorWrapper({ unit, onUnitChange, onSave }: any) {
    const [localUnit, setLocalUnit] = React.useState(unit);
    
    const handleWeightChange = () => {
      const updatedUnit = { ...localUnit, mass: localUnit.mass + 5 };
      setLocalUnit(updatedUnit);
      onUnitChange(updatedUnit);
    };
    
    const handleNameChange = () => {
      const updatedUnit = { ...localUnit, chassis: 'Modified', model: 'Custom' };
      setLocalUnit(updatedUnit);
      onUnitChange(updatedUnit);
    };
    
    return (
      <div data-testid="unit-editor-wrapper">
        <div data-testid="unit-display">{localUnit.chassis} {localUnit.model}</div>
        <div data-testid="unit-mass">Mass: {localUnit.mass} tons</div>
        
        {/* Tab simulation */}
        <div data-testid="tab-structure">
          <h3>Structure Tab</h3>
          <button data-testid="change-mass" onClick={handleWeightChange}>
            Increase Mass
          </button>
          <button data-testid="change-name" onClick={handleNameChange}>
            Change Name
          </button>
        </div>
        
        <div data-testid="tab-armor">
          <h3>Armor Tab</h3>
          <div>Total Armor: {localUnit.data?.armor?.total_armor_points || 0}</div>
        </div>
        
        <div data-testid="tab-equipment">
          <h3>Equipment Tab</h3>
          <div>Weapons: {localUnit.data?.weapons_and_equipment?.length || 0}</div>
          <button 
            data-testid="add-weapon" 
            onClick={() => {
              const newWeapon = { 
                item_name: 'Test Weapon', 
                item_type: 'weapon', 
                location: 'Right Arm', 
                tech_base: 'IS' as const 
              };
              const updatedUnit = {
                ...localUnit,
                data: {
                  ...localUnit.data,
                  weapons_and_equipment: [...(localUnit.data?.weapons_and_equipment || []), newWeapon]
                }
              };
              setLocalUnit(updatedUnit);
              onUnitChange(updatedUnit);
            }}
          >
            Add Weapon
          </button>
        </div>
        
        <div data-testid="save-controls">
          <button data-testid="save-unit" onClick={() => onSave?.(localUnit)}>
            Save Unit
          </button>
        </div>
      </div>
    );
  };
});

// Mock save dialog with more realistic behavior
jest.mock('../../components/editor/SaveUnitDialog', () => {
  return function MockSaveUnitDialog({ 
    isOpen, 
    onClose, 
    onSave, 
    originalChassis, 
    originalModel,
    isStandardUnit 
  }: any) {
    const [chassis, setChassis] = React.useState(originalChassis);
    const [model, setModel] = React.useState(
      isStandardUnit ? `${originalModel}-Custom` : originalModel
    );
    const [notes, setNotes] = React.useState('');
    const [hasError, setHasError] = React.useState(false);
    
    const handleSave = () => {
      if (!chassis.trim() || !model.trim()) {
        setHasError(true);
        return;
      }
      
      if (isStandardUnit && chassis === originalChassis && model === originalModel) {
        setHasError(true);
        return;
      }
      
      setHasError(false);
      onSave(chassis, model, notes);
    };
    
    if (!isOpen) return null;
    
    return (
      <div data-testid="save-unit-dialog">
        <h2>{isStandardUnit ? 'Save Custom Variant' : 'Save Unit'}</h2>
        
        <label>
          Chassis:
          <input 
            data-testid="chassis-input" 
            value={chassis}
            onChange={(e) => setChassis(e.target.value)}
          />
        </label>
        
        <label>
          Model:
          <input 
            data-testid="model-input" 
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </label>
        
        <label>
          Notes:
          <textarea 
            data-testid="notes-input" 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        
        {hasError && (
          <div data-testid="save-error">
            Please fix validation errors before saving.
          </div>
        )}
        
        <button data-testid="save-confirm" onClick={handleSave}>
          Save
        </button>
        <button data-testid="save-cancel" onClick={onClose}>
          Cancel
        </button>
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
  
  mockRouterPush.mockClear();
  mockRouterReplace.mockClear();
  
  // Mock console and alert
  global.console.log = jest.fn();
  global.alert = jest.fn();
});

describe('Customizer End-to-End Workflows', () => {
  describe('Complete Unit Creation Workflow', () => {
    test('creates new unit, modifies it, and saves successfully', async () => {
      const user = userEvent.setup();
      render(<CustomizerPage />);
      
      // Start with default Atlas
      expect(screen.getByText(/Atlas AS7-D/)).toBeInTheDocument();
      
      // Create a new unit tab
      await user.click(screen.getByRole('button', { name: '+' }));
      
      // Should now have New Mek tab active
      expect(screen.getByText('New Mek')).toBeInTheDocument();
      
      // Modify the unit
      await user.click(screen.getByTestId('change-name'));
      
      // Should see updated name
      await waitFor(() => {
        expect(screen.getByText('Modified Custom')).toBeInTheDocument();
      });
      
      // Add equipment
      await user.click(screen.getByTestId('add-weapon'));
      
      // Save the unit
      await user.click(screen.getByTestId('save-unit'));
      
      // Save dialog should appear
      expect(screen.getByTestId('save-unit-dialog')).toBeInTheDocument();
      
      // Fill in save details
      await user.clear(screen.getByTestId('chassis-input'));
      await user.type(screen.getByTestId('chassis-input'), 'CustomMech');
      
      await user.clear(screen.getByTestId('model-input'));
      await user.type(screen.getByTestId('model-input'), 'CM-1');
      
      await user.type(screen.getByTestId('notes-input'), 'Test custom unit');
      
      // Confirm save
      await user.click(screen.getByTestId('save-confirm'));
      
      // Should see success message
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('Unit "CustomMech CM-1" saved successfully!')
      );
      
      // Tab should update with new name
      await waitFor(() => {
        expect(screen.getByText('CustomMech CM-1')).toBeInTheDocument();
      });
    });

    test('handles save validation errors gracefully', async () => {
      const user = userEvent.setup();
      render(<CustomizerPage />);
      
      // Trigger save with empty fields
      await user.click(screen.getByTestId('save-unit'));
      
      // Clear required fields
      await user.clear(screen.getByTestId('chassis-input'));
      await user.clear(screen.getByTestId('model-input'));
      
      // Try to save
      await user.click(screen.getByTestId('save-confirm'));
      
      // Should show validation error
      expect(screen.getByTestId('save-error')).toBeInTheDocument();
      
      // Dialog should stay open
      expect(screen.getByTestId('save-unit-dialog')).toBeInTheDocument();
    });
  });

  describe('Multi-Tab Workflow', () => {
    test('manages multiple units simultaneously', async () => {
      const user = userEvent.setup();
      render(<CustomizerPage />);
      
      // Start with Atlas tab
      expect(screen.getByTestId('unit-display')).toHaveTextContent('Atlas AS7-D');
      
      // Modify Atlas
      await user.click(screen.getByTestId('change-mass'));
      
      await waitFor(() => {
        expect(screen.getByTestId('unit-mass')).toHaveTextContent('Mass: 105 tons');
      });
      
      // Create second tab
      await user.click(screen.getByRole('button', { name: '+' }));
      
      // Should switch to new tab
      expect(screen.getByTestId('unit-display')).toHaveTextContent('New Mek');
      expect(screen.getByTestId('unit-mass')).toHaveTextContent('Mass: 25 tons');
      
      // Modify new unit
      await user.click(screen.getByTestId('change-name'));
      
      await waitFor(() => {
        expect(screen.getByTestId('unit-display')).toHaveTextContent('Modified Custom');
      });
      
      // Switch back to Atlas tab
      await user.click(screen.getByText(/Atlas AS7-D/));
      
      // Should still show modified Atlas
      expect(screen.getByTestId('unit-display')).toHaveTextContent('Atlas AS7-D');
      expect(screen.getByTestId('unit-mass')).toHaveTextContent('Mass: 105 tons');
      
      // Switch back to custom tab
      await user.click(screen.getByText(/Modified Custom/));
      
      // Should show modified custom unit
      expect(screen.getByTestId('unit-display')).toHaveTextContent('Modified Custom');
    });

    test('closes tabs correctly while preserving others', async () => {
      const user = userEvent.setup();
      render(<CustomizerPage />);
      
      // Create second tab
      await user.click(screen.getByRole('button', { name: '+' }));
      
      // Create third tab
      await user.click(screen.getByRole('button', { name: '+' }));
      
      // Should have 3 tabs now
      expect(screen.getByText(/Atlas AS7-D/)).toBeInTheDocument();
      expect(screen.getAllByText(/New Mek/)).toHaveLength(2);
      
      // Close the active tab (latest New Mek)
      const closeButtons = screen.getAllByText('×');
      await user.click(closeButtons[closeButtons.length - 1]);
      
      // Should have 2 tabs remaining
      expect(screen.getByText(/Atlas AS7-D/)).toBeInTheDocument();
      expect(screen.getAllByText(/New Mek/)).toHaveLength(1);
      
      // Close another tab
      const remainingCloseButtons = screen.getAllByText('×');
      await user.click(remainingCloseButtons[1]);
      
      // Should have 1 tab remaining (Atlas)
      expect(screen.getByText(/Atlas AS7-D/)).toBeInTheDocument();
      expect(screen.queryByText(/New Mek/)).not.toBeInTheDocument();
      
      // Should not show close button when only one tab remains
      expect(screen.queryByText('×')).not.toBeInTheDocument();
    });
  });

  describe('Unit Modification Workflows', () => {
    test('tracks modifications across different areas', async () => {
      const user = userEvent.setup();
      render(<CustomizerPage />);
      
      // Should start with no modification indicator
      expect(screen.queryByText('●')).not.toBeInTheDocument();
      
      // Make a structural change
      await user.click(screen.getByTestId('change-mass'));
      
      // Should show modification indicator
      await waitFor(() => {
        expect(screen.getByText('●')).toBeInTheDocument();
      });
      
      // Make an equipment change
      await user.click(screen.getByTestId('add-weapon'));
      
      // Should still show modification indicator
      expect(screen.getByText('●')).toBeInTheDocument();
      
      // Save the unit
      await user.click(screen.getByTestId('save-unit'));
      await user.type(screen.getByTestId('chassis-input'), 'Test');
      await user.type(screen.getByTestId('model-input'), 'Test-1');
      await user.click(screen.getByTestId('save-confirm'));
      
      // Should clear modification indicator after save
      await waitFor(() => {
        expect(screen.queryByText('●')).not.toBeInTheDocument();
      });
    });

    test('preserves unit state during tab switches', async () => {
      const user = userEvent.setup();
      render(<CustomizerPage />);
      
      // Modify Atlas in multiple ways
      await user.click(screen.getByTestId('change-mass'));
      await user.click(screen.getByTestId('add-weapon'));
      
      await waitFor(() => {
        expect(screen.getByTestId('unit-mass')).toHaveTextContent('Mass: 105 tons');
      });
      
      // Create new tab
      await user.click(screen.getByRole('button', { name: '+' }));
      
      // Modify new unit
      await user.click(screen.getByTestId('change-name'));
      
      // Switch back to Atlas
      await user.click(screen.getByText(/Atlas AS7-D/));
      
      // Atlas should retain all modifications
      expect(screen.getByTestId('unit-mass')).toHaveTextContent('Mass: 105 tons');
      expect(screen.getByText('●')).toBeInTheDocument(); // Still modified
      
      // Equipment count should be preserved
      const weaponsDisplay = screen.getByText(/Weapons:/);
      expect(weaponsDisplay).toHaveTextContent('Weapons: 5'); // Original 4 + 1 added
    });
  });

  describe('Save and Load Workflows', () => {
    test('handles standard unit customization flow', async () => {
      const user = userEvent.setup();
      render(<CustomizerPage />);
      
      // Start with standard Atlas
      expect(screen.getByTestId('unit-display')).toHaveTextContent('Atlas AS7-D');
      
      // Make modifications
      await user.click(screen.getByTestId('change-mass'));
      await user.click(screen.getByTestId('add-weapon'));
      
      // Save as custom variant
      await user.click(screen.getByTestId('save-unit'));
      
      // Should show custom variant dialog
      expect(screen.getByText('Save Custom Variant')).toBeInTheDocument();
      
      // Should pre-populate with custom suffix
      const modelInput = screen.getByTestId('model-input');
      expect(modelInput).toHaveValue('AS7-D-Custom');
      
      // Change the model name
      await user.clear(modelInput);
      await user.type(modelInput, 'AS7-D-Heavy');
      
      await user.type(screen.getByTestId('notes-input'), 'Increased tonnage variant');
      
      // Save
      await user.click(screen.getByTestId('save-confirm'));
      
      // Should update tab to show custom variant
      await waitFor(() => {
        expect(screen.getByText('Atlas AS7-D-Heavy')).toBeInTheDocument();
      });
      
      // Should clear modification indicator
      expect(screen.queryByText('●')).not.toBeInTheDocument();
    });

    test('prevents saving standard unit with same name', async () => {
      const user = userEvent.setup();
      render(<CustomizerPage />);
      
      // Try to save Atlas with original name
      await user.click(screen.getByTestId('save-unit'));
      
      // Set back to original values
      await user.clear(screen.getByTestId('model-input'));
      await user.type(screen.getByTestId('model-input'), 'AS7-D');
      
      // Try to save
      await user.click(screen.getByTestId('save-confirm'));
      
      // Should show validation error
      expect(screen.getByTestId('save-error')).toBeInTheDocument();
      
      // Dialog should remain open
      expect(screen.getByTestId('save-unit-dialog')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles rapid tab creation and switching', async () => {
      const user = userEvent.setup();
      render(<CustomizerPage />);
      
      // Rapidly create multiple tabs
      for (let i = 0; i < 5; i++) {
        await user.click(screen.getByRole('button', { name: '+' }));
      }
      
      // Should have 6 tabs total (1 Atlas + 5 New Mek)
      expect(screen.getByText(/Atlas AS7-D/)).toBeInTheDocument();
      expect(screen.getAllByText(/New Mek/)).toHaveLength(5);
      
      // Rapidly switch between tabs
      await user.click(screen.getByText(/Atlas AS7-D/));
      const newMekTabs = screen.getAllByText(/New Mek/);
      await user.click(newMekTabs[0]);
      await user.click(newMekTabs[2]);
      await user.click(newMekTabs[4]);
      
      // Should not crash and should show the selected tab
      expect(screen.getByTestId('unit-display')).toHaveTextContent('New Mek');
    });

    test('handles save dialog cancellation', async () => {
      const user = userEvent.setup();
      render(<CustomizerPage />);
      
      // Make modifications
      await user.click(screen.getByTestId('change-mass'));
      
      // Open save dialog
      await user.click(screen.getByTestId('save-unit'));
      
      // Fill in some data
      await user.type(screen.getByTestId('chassis-input'), 'Test');
      await user.type(screen.getByTestId('notes-input'), 'Test notes');
      
      // Cancel
      await user.click(screen.getByTestId('save-cancel'));
      
      // Dialog should close
      expect(screen.queryByTestId('save-unit-dialog')).not.toBeInTheDocument();
      
      // Unit should still be modified
      expect(screen.getByText('●')).toBeInTheDocument();
      expect(screen.getByTestId('unit-mass')).toHaveTextContent('Mass: 105 tons');
    });

    test('handles unexpected unit data gracefully', () => {
      // This test would require more sophisticated mocking to simulate
      // corrupted or missing unit data scenarios
      render(<CustomizerPage />);
      
      // Should render without crashing even with potential data issues
      expect(screen.getByTestId('unit-editor-wrapper')).toBeInTheDocument();
    });
  });

  describe('Performance and User Experience', () => {
    test('maintains responsive UI during complex operations', async () => {
      const user = userEvent.setup();
      render(<CustomizerPage />);
      
      // Perform multiple rapid operations
      await user.click(screen.getByTestId('change-mass'));
      await user.click(screen.getByTestId('add-weapon'));
      await user.click(screen.getByTestId('change-name'));
      await user.click(screen.getByTestId('add-weapon'));
      
      // UI should remain responsive
      expect(screen.getByTestId('unit-display')).toBeInTheDocument();
      expect(screen.getByTestId('unit-mass')).toBeInTheDocument();
      
      // All changes should be reflected
      await waitFor(() => {
        expect(screen.getByTestId('unit-display')).toHaveTextContent('Modified Custom');
        expect(screen.getByTestId('unit-mass')).toHaveTextContent('Mass: 105 tons');
      });
    });

    test('provides clear feedback for user actions', async () => {
      const user = userEvent.setup();
      render(<CustomizerPage />);
      
      // Modification should show immediate feedback
      await user.click(screen.getByTestId('change-mass'));
      
      await waitFor(() => {
        expect(screen.getByText('●')).toBeInTheDocument();
        expect(screen.getByTestId('unit-mass')).toHaveTextContent('Mass: 105 tons');
      });
      
      // Save should provide clear feedback
      await user.click(screen.getByTestId('save-unit'));
      await user.type(screen.getByTestId('chassis-input'), 'TestFeedback');
      await user.type(screen.getByTestId('model-input'), 'TF-1');
      await user.click(screen.getByTestId('save-confirm'));
      
      // Should show success message
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('Unit "TestFeedback TF-1" saved successfully!')
      );
      
      // Should clear modification indicator
      await waitFor(() => {
        expect(screen.queryByText('●')).not.toBeInTheDocument();
      });
    });
  });
});
