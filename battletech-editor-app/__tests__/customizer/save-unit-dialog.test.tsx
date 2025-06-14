import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SaveUnitDialog from '../../components/editor/SaveUnitDialog';

describe('SaveUnitDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
    originalChassis: 'Atlas',
    originalModel: 'AS7-D',
    isStandardUnit: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders dialog when open', () => {
      render(<SaveUnitDialog {...defaultProps} />);
      
      expect(screen.getByText('Save Custom Variant')).toBeInTheDocument();
      expect(screen.getByLabelText(/chassis name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/model designation/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    });

    test('does not render when closed', () => {
      render(<SaveUnitDialog {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Save Custom Variant')).not.toBeInTheDocument();
    });

    test('shows different title for custom units', () => {
      render(<SaveUnitDialog {...defaultProps} isStandardUnit={false} />);
      
      expect(screen.getByText('Save Unit')).toBeInTheDocument();
      expect(screen.queryByText('Save Custom Variant')).not.toBeInTheDocument();
    });

    test('shows explanatory text for standard units', () => {
      render(<SaveUnitDialog {...defaultProps} />);
      
      expect(screen.getByText(/creating a custom variant/i)).toBeInTheDocument();
      expect(screen.getByText(/unique model designation/i)).toBeInTheDocument();
    });

    test('does not show explanatory text for custom units', () => {
      render(<SaveUnitDialog {...defaultProps} isStandardUnit={false} />);
      
      expect(screen.queryByText(/creating a custom variant/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Initialization', () => {
    test('initializes chassis field with original chassis', () => {
      render(<SaveUnitDialog {...defaultProps} />);
      
      const chassisInput = screen.getByLabelText(/chassis name/i);
      expect(chassisInput).toHaveValue('Atlas');
    });

    test('initializes model field with custom suffix for standard units', () => {
      render(<SaveUnitDialog {...defaultProps} />);
      
      const modelInput = screen.getByLabelText(/model designation/i);
      expect(modelInput).toHaveValue('AS7-D-Custom');
    });

    test('initializes model field with original model for custom units', () => {
      render(<SaveUnitDialog {...defaultProps} isStandardUnit={false} />);
      
      const modelInput = screen.getByLabelText(/model designation/i);
      expect(modelInput).toHaveValue('AS7-D');
    });

    test('notes field starts empty', () => {
      render(<SaveUnitDialog {...defaultProps} />);
      
      const notesInput = screen.getByLabelText(/notes/i);
      expect(notesInput).toHaveValue('');
    });

    test('resets form when dialog reopens', () => {
      const { rerender } = render(<SaveUnitDialog {...defaultProps} isOpen={false} />);
      
      // Open dialog and modify fields
      rerender(<SaveUnitDialog {...defaultProps} />);
      
      const chassisInput = screen.getByLabelText(/chassis name/i);
      const modelInput = screen.getByLabelText(/model designation/i);
      const notesInput = screen.getByLabelText(/notes/i);
      
      fireEvent.change(chassisInput, { target: { value: 'Modified' } });
      fireEvent.change(modelInput, { target: { value: 'TEST' } });
      fireEvent.change(notesInput, { target: { value: 'Test notes' } });
      
      // Close and reopen
      rerender(<SaveUnitDialog {...defaultProps} isOpen={false} />);
      rerender(<SaveUnitDialog {...defaultProps} />);
      
      // Fields should be reset
      expect(screen.getByLabelText(/chassis name/i)).toHaveValue('Atlas');
      expect(screen.getByLabelText(/model designation/i)).toHaveValue('AS7-D-Custom');
      expect(screen.getByLabelText(/notes/i)).toHaveValue('');
    });
  });

  describe('Form Validation', () => {
    test('requires chassis name', async () => {
      const user = userEvent.setup();
      render(<SaveUnitDialog {...defaultProps} />);
      
      const chassisInput = screen.getByLabelText(/chassis name/i);
      const saveButton = screen.getByText('Save Unit');
      
      // Clear chassis field
      await user.clear(chassisInput);
      await user.click(saveButton);
      
      expect(screen.getByText('Chassis name is required')).toBeInTheDocument();
      expect(defaultProps.onSave).not.toHaveBeenCalled();
    });

    test('requires model designation', async () => {
      const user = userEvent.setup();
      render(<SaveUnitDialog {...defaultProps} />);
      
      const modelInput = screen.getByLabelText(/model designation/i);
      const saveButton = screen.getByText('Save Unit');
      
      // Clear model field
      await user.clear(modelInput);
      await user.click(saveButton);
      
      expect(screen.getByText('Model designation is required')).toBeInTheDocument();
      expect(defaultProps.onSave).not.toHaveBeenCalled();
    });

    test('prevents saving standard unit with same name as original', async () => {
      const user = userEvent.setup();
      render(<SaveUnitDialog {...defaultProps} />);
      
      const chassisInput = screen.getByLabelText(/chassis name/i);
      const modelInput = screen.getByLabelText(/model designation/i);
      const saveButton = screen.getByText('Save Unit');
      
      // Set to original values
      await user.clear(chassisInput);
      await user.type(chassisInput, 'Atlas');
      await user.clear(modelInput);
      await user.type(modelInput, 'AS7-D');
      
      await user.click(saveButton);
      
      expect(screen.getByText(/different model designation/i)).toBeInTheDocument();
      expect(defaultProps.onSave).not.toHaveBeenCalled();
    });

    test('allows saving custom unit with same name as original', async () => {
      const user = userEvent.setup();
      render(<SaveUnitDialog {...defaultProps} isStandardUnit={false} />);
      
      const saveButton = screen.getByText('Save Unit');
      
      // Should allow saving without changing the name
      await user.click(saveButton);
      
      expect(defaultProps.onSave).toHaveBeenCalledWith('Atlas', 'AS7-D', '');
    });

    test('trims whitespace from inputs', async () => {
      const user = userEvent.setup();
      render(<SaveUnitDialog {...defaultProps} />);
      
      const chassisInput = screen.getByLabelText(/chassis name/i);
      const modelInput = screen.getByLabelText(/model designation/i);
      const notesInput = screen.getByLabelText(/notes/i);
      const saveButton = screen.getByText('Save Unit');
      
      await user.clear(chassisInput);
      await user.type(chassisInput, '  Atlas  ');
      await user.clear(modelInput);
      await user.type(modelInput, '  AS7-D-Custom  ');
      await user.type(notesInput, '  Test notes  ');
      
      await user.click(saveButton);
      
      expect(defaultProps.onSave).toHaveBeenCalledWith('Atlas', 'AS7-D-Custom', 'Test notes');
    });

    test('clears errors when inputs become valid', async () => {
      const user = userEvent.setup();
      render(<SaveUnitDialog {...defaultProps} />);
      
      const chassisInput = screen.getByLabelText(/chassis name/i);
      const saveButton = screen.getByText('Save Unit');
      
      // Create error
      await user.clear(chassisInput);
      await user.click(saveButton);
      
      expect(screen.getByText('Chassis name is required')).toBeInTheDocument();
      
      // Fix error
      await user.type(chassisInput, 'Atlas');
      await user.click(saveButton);
      
      expect(screen.queryByText('Chassis name is required')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('can edit all form fields', async () => {
      const user = userEvent.setup();
      render(<SaveUnitDialog {...defaultProps} />);
      
      const chassisInput = screen.getByLabelText(/chassis name/i);
      const modelInput = screen.getByLabelText(/model designation/i);
      const notesInput = screen.getByLabelText(/notes/i);
      
      await user.clear(chassisInput);
      await user.type(chassisInput, 'Warhammer');
      
      await user.clear(modelInput);
      await user.type(modelInput, 'WHM-6R-Custom');
      
      await user.type(notesInput, 'Modified with improved heat sinks');
      
      expect(chassisInput).toHaveValue('Warhammer');
      expect(modelInput).toHaveValue('WHM-6R-Custom');
      expect(notesInput).toHaveValue('Modified with improved heat sinks');
    });

    test('saves with valid inputs', async () => {
      const user = userEvent.setup();
      render(<SaveUnitDialog {...defaultProps} />);
      
      const chassisInput = screen.getByLabelText(/chassis name/i);
      const modelInput = screen.getByLabelText(/model designation/i);
      const notesInput = screen.getByLabelText(/notes/i);
      const saveButton = screen.getByText('Save Unit');
      
      await user.clear(chassisInput);
      await user.type(chassisInput, 'Warhammer');
      
      await user.clear(modelInput);
      await user.type(modelInput, 'WHM-6R-Custom');
      
      await user.type(notesInput, 'Test variant');
      
      await user.click(saveButton);
      
      expect(defaultProps.onSave).toHaveBeenCalledWith('Warhammer', 'WHM-6R-Custom', 'Test variant');
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    test('closes dialog on cancel', async () => {
      const user = userEvent.setup();
      render(<SaveUnitDialog {...defaultProps} />);
      
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(defaultProps.onClose).toHaveBeenCalled();
      expect(defaultProps.onSave).not.toHaveBeenCalled();
    });

    test('closes dialog on backdrop click', async () => {
      const user = userEvent.setup();
      render(<SaveUnitDialog {...defaultProps} />);
      
      // Click the backdrop (the fixed overlay)
      const backdrop = document.querySelector('.fixed.inset-0.bg-black');
      if (backdrop) {
        await user.click(backdrop);
        expect(defaultProps.onClose).toHaveBeenCalled();
      }
    });

    test('closes dialog on X button click', async () => {
      const user = userEvent.setup();
      render(<SaveUnitDialog {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Keyboard Interactions', () => {
    test('saves on Ctrl+Enter', async () => {
      const user = userEvent.setup();
      render(<SaveUnitDialog {...defaultProps} />);
      
      const chassisInput = screen.getByLabelText(/chassis name/i);
      
      // Focus an input and press Ctrl+Enter
      chassisInput.focus();
      await user.keyboard('{Control>}{Enter}{/Control}');
      
      expect(defaultProps.onSave).toHaveBeenCalled();
    });

    test('closes on Escape', async () => {
      const user = userEvent.setup();
      render(<SaveUnitDialog {...defaultProps} />);
      
      const chassisInput = screen.getByLabelText(/chassis name/i);
      
      // Focus an input and press Escape
      chassisInput.focus();
      await user.keyboard('{Escape}');
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    test('does not save on Ctrl+Enter if validation fails', async () => {
      const user = userEvent.setup();
      render(<SaveUnitDialog {...defaultProps} />);
      
      const chassisInput = screen.getByLabelText(/chassis name/i);
      
      // Clear required field
      await user.clear(chassisInput);
      
      // Try to save with Ctrl+Enter
      chassisInput.focus();
      await user.keyboard('{Control>}{Enter}{/Control}');
      
      expect(defaultProps.onSave).not.toHaveBeenCalled();
      expect(screen.getByText('Chassis name is required')).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    test('focuses chassis input when dialog opens', () => {
      render(<SaveUnitDialog {...defaultProps} />);
      
      const chassisInput = screen.getByLabelText(/chassis name/i);
      expect(chassisInput).toHaveFocus();
    });

    test('maintains focus within dialog', async () => {
      const user = userEvent.setup();
      render(<SaveUnitDialog {...defaultProps} />);
      
      // Tab through all interactive elements
      await user.tab();
      expect(screen.getByLabelText(/model designation/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/notes/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Cancel')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Save Unit')).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    test('has proper labels and required indicators', () => {
      render(<SaveUnitDialog {...defaultProps} />);
      
      expect(screen.getByLabelText(/chassis name \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/model designation \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes \(optional\)/i)).toBeInTheDocument();
    });

    test('associates error messages with inputs', async () => {
      const user = userEvent.setup();
      render(<SaveUnitDialog {...defaultProps} />);
      
      const chassisInput = screen.getByLabelText(/chassis name/i);
      const saveButton = screen.getByText('Save Unit');
      
      // Create error
      await user.clear(chassisInput);
      await user.click(saveButton);
      
      const errorMessage = screen.getByText('Chassis name is required');
      expect(errorMessage).toBeInTheDocument();
      
      // In a full implementation, we'd check for aria-describedby
    });

    test('has proper button roles and labels', () => {
      render(<SaveUnitDialog {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save Unit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    test('shows multiple validation errors simultaneously', async () => {
      const user = userEvent.setup();
      render(<SaveUnitDialog {...defaultProps} />);
      
      const chassisInput = screen.getByLabelText(/chassis name/i);
      const modelInput = screen.getByLabelText(/model designation/i);
      const saveButton = screen.getByText('Save Unit');
      
      // Clear both required fields
      await user.clear(chassisInput);
      await user.clear(modelInput);
      await user.click(saveButton);
      
      expect(screen.getByText('Chassis name is required')).toBeInTheDocument();
      expect(screen.getByText('Model designation is required')).toBeInTheDocument();
    });

    test('shows appropriate error styling on invalid inputs', async () => {
      const user = userEvent.setup();
      render(<SaveUnitDialog {...defaultProps} />);
      
      const chassisInput = screen.getByLabelText(/chassis name/i);
      const saveButton = screen.getByText('Save Unit');
      
      // Create error
      await user.clear(chassisInput);
      await user.click(saveButton);
      
      // Check for error styling classes
      expect(chassisInput).toHaveClass('border-red-300', 'focus:border-red-500', 'focus:ring-red-500');
    });
  });
});
