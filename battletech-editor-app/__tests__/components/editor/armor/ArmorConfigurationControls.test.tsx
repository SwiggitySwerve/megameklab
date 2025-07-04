/**
 * Tests for ArmorConfigurationControls component
 * 
 * Validates armor type selection, tonnage management, and quick action functionality.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArmorConfigurationControls } from '../../../../components/editor/armor/ArmorConfigurationControls';

describe('ArmorConfigurationControls', () => {
  const mockProps = {
    armorType: 'Standard',
    armorTypeOptions: ['Standard', 'Ferro-Fibrous', 'Light Ferro-Fibrous'],
    currentArmorTonnage: 5.0,
    maxArmorTonnage: 10.0,
    remainingTonnage: 2.5,
    readOnly: false,
    onArmorTypeChange: jest.fn(),
    onArmorTonnageChange: jest.fn(),
    onUseRemainingTonnage: jest.fn(),
    onMaximizeArmor: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render armor type selector with options', () => {
      render(<ArmorConfigurationControls {...mockProps} />);
      
      const select = screen.getByDisplayValue('Standard');
      expect(select).toBeInTheDocument();
      
      // Check that all options are present
      mockProps.armorTypeOptions.forEach(option => {
        expect(screen.getByRole('option', { name: option })).toBeInTheDocument();
      });
    });

    it('should render tonnage input with current value', () => {
      render(<ArmorConfigurationControls {...mockProps} />);
      
      const input = screen.getByDisplayValue('5');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'number');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '10');
      expect(input).toHaveAttribute('step', '0.5');
    });

    it('should render tonnage step controls', () => {
      render(<ArmorConfigurationControls {...mockProps} />);
      
      expect(screen.getByTitle('Increase by 0.5 tons')).toBeInTheDocument();
      expect(screen.getByTitle('Decrease by 0.5 tons')).toBeInTheDocument();
    });

    it('should render quick action buttons', () => {
      render(<ArmorConfigurationControls {...mockProps} />);
      
      expect(screen.getByText('Use Remaining Tonnage')).toBeInTheDocument();
      expect(screen.getByText('Maximize Armor')).toBeInTheDocument();
    });

    it('should display maximum tonnage', () => {
      render(<ArmorConfigurationControls {...mockProps} />);
      
      expect(screen.getByText('/10.0t')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onArmorTypeChange when armor type is selected', () => {
      render(<ArmorConfigurationControls {...mockProps} />);
      
      const select = screen.getByDisplayValue('Standard');
      fireEvent.change(select, { target: { value: 'Ferro-Fibrous' } });
      
      expect(mockProps.onArmorTypeChange).toHaveBeenCalledWith('Ferro-Fibrous');
    });

    it('should call onArmorTonnageChange when tonnage input changes', () => {
      render(<ArmorConfigurationControls {...mockProps} />);
      
      const input = screen.getByDisplayValue('5');
      fireEvent.change(input, { target: { value: '7.5' } });
      
      expect(mockProps.onArmorTonnageChange).toHaveBeenCalledWith(7.5);
    });

    it('should handle invalid tonnage input gracefully', () => {
      render(<ArmorConfigurationControls {...mockProps} />);
      
      const input = screen.getByDisplayValue('5');
      fireEvent.change(input, { target: { value: 'invalid' } });
      
      expect(mockProps.onArmorTonnageChange).toHaveBeenCalledWith(0);
    });

    it('should call onArmorTonnageChange when increase button clicked', () => {
      render(<ArmorConfigurationControls {...mockProps} />);
      
      const increaseButton = screen.getByTitle('Increase by 0.5 tons');
      fireEvent.click(increaseButton);
      
      expect(mockProps.onArmorTonnageChange).toHaveBeenCalledWith(5.5);
    });

    it('should call onArmorTonnageChange when decrease button clicked', () => {
      render(<ArmorConfigurationControls {...mockProps} />);
      
      const decreaseButton = screen.getByTitle('Decrease by 0.5 tons');
      fireEvent.click(decreaseButton);
      
      expect(mockProps.onArmorTonnageChange).toHaveBeenCalledWith(4.5);
    });

    it('should call onUseRemainingTonnage when button clicked', () => {
      render(<ArmorConfigurationControls {...mockProps} />);
      
      const button = screen.getByText('Use Remaining Tonnage');
      fireEvent.click(button);
      
      expect(mockProps.onUseRemainingTonnage).toHaveBeenCalled();
    });

    it('should call onMaximizeArmor when button clicked', () => {
      render(<ArmorConfigurationControls {...mockProps} />);
      
      const button = screen.getByText('Maximize Armor');
      fireEvent.click(button);
      
      expect(mockProps.onMaximizeArmor).toHaveBeenCalled();
    });
  });

  describe('Read-Only Mode', () => {
    const readOnlyProps = { ...mockProps, readOnly: true };

    it('should disable armor type selector in read-only mode', () => {
      render(<ArmorConfigurationControls {...readOnlyProps} />);
      
      const select = screen.getByDisplayValue('Standard');
      expect(select).toBeDisabled();
    });

    it('should disable tonnage input in read-only mode', () => {
      render(<ArmorConfigurationControls {...readOnlyProps} />);
      
      const input = screen.getByDisplayValue('5');
      expect(input).toBeDisabled();
    });

    it('should disable step control buttons in read-only mode', () => {
      render(<ArmorConfigurationControls {...readOnlyProps} />);
      
      expect(screen.getByTitle('Increase by 0.5 tons')).toBeDisabled();
      expect(screen.getByTitle('Decrease by 0.5 tons')).toBeDisabled();
    });

    it('should disable quick action buttons in read-only mode', () => {
      render(<ArmorConfigurationControls {...readOnlyProps} />);
      
      expect(screen.getByText('Use Remaining Tonnage')).toBeDisabled();
      expect(screen.getByText('Maximize Armor')).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should disable increase button when at maximum tonnage', () => {
      const maxProps = { ...mockProps, currentArmorTonnage: 10.0 };
      render(<ArmorConfigurationControls {...maxProps} />);
      
      expect(screen.getByTitle('Increase by 0.5 tons')).toBeDisabled();
    });

    it('should disable decrease button when at zero tonnage', () => {
      const zeroProps = { ...mockProps, currentArmorTonnage: 0 };
      render(<ArmorConfigurationControls {...zeroProps} />);
      
      expect(screen.getByTitle('Decrease by 0.5 tons')).toBeDisabled();
    });

    it('should apply warning styling when at maximum tonnage', () => {
      const maxProps = { ...mockProps, currentArmorTonnage: 10.0 };
      render(<ArmorConfigurationControls {...maxProps} />);
      
      const input = screen.getByDisplayValue('10');
      expect(input).toHaveClass('border-yellow-500');
    });

    it('should handle zero remaining tonnage display', () => {
      const zeroRemainingProps = { ...mockProps, remainingTonnage: 0 };
      render(<ArmorConfigurationControls {...zeroRemainingProps} />);
      
      const button = screen.getByText('Use Remaining Tonnage');
      expect(button).toHaveAttribute('title', 'Use remaining 0.0 tons');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form elements', () => {
      render(<ArmorConfigurationControls {...mockProps} />);
      
      expect(screen.getByText('Armor Type:')).toBeInTheDocument();
      expect(screen.getByText('Tonnage:')).toBeInTheDocument();
    });

    it('should have proper button titles for accessibility', () => {
      render(<ArmorConfigurationControls {...mockProps} />);
      
      expect(screen.getByTitle('Increase by 0.5 tons')).toBeInTheDocument();
      expect(screen.getByTitle('Decrease by 0.5 tons')).toBeInTheDocument();
    });
  });
});
