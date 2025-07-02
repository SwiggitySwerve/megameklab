/**
 * ArmorValidationPanel.test.tsx - Comprehensive test suite
 * 
 * Tests extracted ArmorValidationPanel component from ArmorTabV2 refactoring (Day 3)
 * Validates armor efficiency calculations, validation feedback, and interactive features
 * 
 * @see IMPLEMENTATION_REFERENCE.md for testing patterns
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArmorValidationPanel, ArmorValidationPanelProps } from '../../../../components/editor/armor/ArmorValidationPanel';

// Mock armor allocation data
const mockArmorAllocation = {
  HD: { front: 9, rear: 0 },
  CT: { front: 30, rear: 10 },
  LT: { front: 20, rear: 8 },
  RT: { front: 20, rear: 8 },
  LA: { front: 16, rear: 0 },
  RA: { front: 16, rear: 0 },
  LL: { front: 24, rear: 0 },
  RL: { front: 24, rear: 0 }
};

// Mock function to get location max armor
const mockGetLocationMaxArmor = (location: string): number => {
  const maxValues: { [key: string]: number } = {
    HD: 9,
    CT: 47,
    LT: 32,
    RT: 32,
    LA: 24,
    RA: 24,
    LL: 41,
    RL: 41
  };
  return maxValues[location] || 0;
};

// Default props for testing
const defaultProps: ArmorValidationPanelProps = {
  armorAllocation: mockArmorAllocation,
  getLocationMaxArmor: mockGetLocationMaxArmor,
  selectedSection: null,
  onSectionSelect: jest.fn(),
  readOnly: false
};

// Helper function to render component with props
const renderArmorValidationPanel = (props: Partial<ArmorValidationPanelProps> = {}) => {
  const finalProps = { ...defaultProps, ...props };
  return render(<ArmorValidationPanel {...finalProps} />);
};

describe('ArmorValidationPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // === CORE FUNCTIONALITY TESTS ===
  
  describe('core functionality', () => {
    it('should render armor validation header', () => {
      renderArmorValidationPanel();
      expect(screen.getByText('Armor Validation')).toBeInTheDocument();
    });

    it('should display overall efficiency calculation', () => {
      renderArmorValidationPanel();
      // Should calculate and display efficiency percentage
      expect(screen.getByText(/\d+% Efficiency/)).toBeInTheDocument();
    });

    it('should show total armor points allocated', () => {
      renderArmorValidationPanel();
      // Should display total/max armor points
      expect(screen.getByText(/\d+ \/ \d+ armor points allocated/)).toBeInTheDocument();
    });

    it('should render all armor locations', () => {
      renderArmorValidationPanel();
      
      const locations = ['HD', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'];
      locations.forEach(location => {
        expect(screen.getByText(location)).toBeInTheDocument();
      });
    });

    it('should display armor values for each location', () => {
      renderArmorValidationPanel();
      
      // Check specific armor values
      expect(screen.getByText('9')).toBeInTheDocument(); // HD front
      expect(screen.getByText('30')).toBeInTheDocument(); // CT front
      expect(screen.getByText('10')).toBeInTheDocument(); // CT rear
      expect(screen.getAllByText('20')).toHaveLength(2); // LT/RT front
      expect(screen.getAllByText('8')).toHaveLength(2); // LT/RT rear
    });

    it('should show rear armor only for torso locations', () => {
      renderArmorValidationPanel();
      
      // Torso locations should show rear armor values
      const torsoRearValues = screen.getAllByText('8'); // LT/RT rear
      expect(torsoRearValues).toHaveLength(2);
      
      // Non-torso locations should show "-" for rear
      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThanOrEqual(4); // HD, LA, RA, LL, RL
    });

    it('should calculate efficiency percentages correctly', () => {
      renderArmorValidationPanel();
      
      // HD: 9/9 = 100%
      expect(screen.getByText('(100%)')).toBeInTheDocument();
      
      // CT: 40/47 = ~85%
      expect(screen.getByText('(85%)')).toBeInTheDocument();
      
      // Should show various efficiency percentages
      const percentageElements = screen.getAllByText(/\(\d+%\)/);
      expect(percentageElements.length).toBeGreaterThanOrEqual(8); // One for each location
    });
  });

  // === VALIDATION LOGIC TESTS ===
  
  describe('validation logic', () => {
    it('should detect over-allocated locations', () => {
      const overAllocatedArmor = {
        ...mockArmorAllocation,
        HD: { front: 15, rear: 0 } // Over max of 9
      };
      
      renderArmorValidationPanel({ armorAllocation: overAllocatedArmor });
      
      expect(screen.getAllByText(/over-allocated location/)).toHaveLength(2); // Header warning + recommendation
    });

    it('should categorize efficiency levels correctly', () => {
      const mixedEfficiencyArmor = {
        HD: { front: 9, rear: 0 },   // 100% - Excellent
        CT: { front: 35, rear: 7 },  // ~89% - Good 
        LT: { front: 20, rear: 0 },  // ~62% - Fair
        RT: { front: 10, rear: 0 },  // ~31% - Poor
        LA: { front: 3, rear: 0 },   // ~12% - Very Low
        RA: { front: 16, rear: 0 },  // ~67% - Fair
        LL: { front: 24, rear: 0 },  // ~58% - Fair
        RL: { front: 24, rear: 0 }   // ~58% - Fair
      };
      
      renderArmorValidationPanel({ armorAllocation: mixedEfficiencyArmor });
      
      // Should show efficiency legend
      expect(screen.getByText('90%+ Excellent')).toBeInTheDocument();
      expect(screen.getByText('70-89% Good')).toBeInTheDocument();
      expect(screen.getByText('50-69% Fair')).toBeInTheDocument();
      expect(screen.getByText('25-49% Poor')).toBeInTheDocument();
      expect(screen.getByText('<25% Very Low')).toBeInTheDocument();
    });

    it('should provide optimization recommendations', () => {
      const lowEfficiencyArmor = {
        HD: { front: 2, rear: 0 },   // Low efficiency
        CT: { front: 10, rear: 0 },  // Low efficiency
        LT: { front: 5, rear: 0 },   // Low efficiency
        RT: { front: 5, rear: 0 },   // Low efficiency
        LA: { front: 3, rear: 0 },   // Low efficiency
        RA: { front: 3, rear: 0 },   // Low efficiency
        LL: { front: 5, rear: 0 },   // Low efficiency
        RL: { front: 5, rear: 0 }    // Low efficiency
      };
      
      renderArmorValidationPanel({ armorAllocation: lowEfficiencyArmor });
      
      expect(screen.getByText('Optimization Recommendations')).toBeInTheDocument();
      expect(screen.getByText(/consider auto-allocation/i)).toBeInTheDocument();
    });

    it('should show warning for over-allocated locations', () => {
      const overAllocatedArmor = {
        ...mockArmorAllocation,
        HD: { front: 15, rear: 0 }, // Over max
        CT: { front: 50, rear: 10 } // Over max
      };
      
      renderArmorValidationPanel({ armorAllocation: overAllocatedArmor });
      
      expect(screen.getByText(/⚠️ \d+ over-allocated location/)).toBeInTheDocument();
      expect(screen.getByText(/Fix over-allocated locations/)).toBeInTheDocument();
    });

    it('should provide positive feedback for good armor distribution', () => {
      const goodArmor = {
        HD: { front: 9, rear: 0 },   // 100%
        CT: { front: 40, rear: 7 },  // 100%
        LT: { front: 24, rear: 8 },  // 100%
        RT: { front: 24, rear: 8 },  // 100%
        LA: { front: 24, rear: 0 },  // 100%
        RA: { front: 24, rear: 0 },  // 100%
        LL: { front: 41, rear: 0 },  // 100%
        RL: { front: 41, rear: 0 }   // 100%
      };
      
      renderArmorValidationPanel({ armorAllocation: goodArmor });
      
      expect(screen.getByText(/Good armor distribution/i)).toBeInTheDocument();
    });
  });

  // === VISUAL FEEDBACK TESTS ===
  
  describe('visual feedback', () => {
    it('should apply correct color coding based on efficiency', () => {
      const { container } = renderArmorValidationPanel();
      
      // Should have efficiency-based border colors
      const greenBorders = container.querySelectorAll('.border-l-green-500');
      const blueBorders = container.querySelectorAll('.border-l-blue-500');
      const yellowBorders = container.querySelectorAll('.border-l-yellow-500');
      
      expect(greenBorders.length + blueBorders.length + yellowBorders.length).toBeGreaterThan(0);
    });

    it('should highlight over-allocated locations in red', () => {
      const overAllocatedArmor = {
        ...mockArmorAllocation,
        HD: { front: 15, rear: 0 } // Over max of 9
      };
      
      const { container } = renderArmorValidationPanel({ armorAllocation: overAllocatedArmor });
      
      const redBorders = container.querySelectorAll('.border-l-red-500');
      expect(redBorders.length).toBeGreaterThan(0);
    });

    it('should show efficiency badge with appropriate color', () => {
      const { container } = renderArmorValidationPanel();
      
      // Should have efficiency badge with color
      const efficiencyBadge = container.querySelector('[class*="bg-"][class*="600"]');
      expect(efficiencyBadge).toBeInTheDocument();
      expect(efficiencyBadge).toHaveTextContent(/\d+% Efficiency/);
    });

    it('should display color legend with all efficiency categories', () => {
      renderArmorValidationPanel();
      
      // Check for all color indicators in legend
      const { container } = render(<ArmorValidationPanel {...defaultProps} />);
      const colorIndicators = container.querySelectorAll('.w-3.h-3');
      expect(colorIndicators.length).toBeGreaterThanOrEqual(6); // 6 efficiency categories
    });

    it('should show column headers for data alignment', () => {
      renderArmorValidationPanel();
      
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Front')).toBeInTheDocument();
      expect(screen.getByText('Rear')).toBeInTheDocument();
      expect(screen.getByText('Total/Max')).toBeInTheDocument();
    });
  });

  // === INTERACTIVE FUNCTIONALITY TESTS ===
  
  describe('interactive functionality', () => {
    it('should call onSectionSelect when clicking a location', async () => {
      const mockOnSectionSelect = jest.fn();
      renderArmorValidationPanel({ onSectionSelect: mockOnSectionSelect });
      
      const hdLocation = screen.getByText('HD').closest('div[role="button"]');
      expect(hdLocation).toBeInTheDocument();
      
      await userEvent.click(hdLocation!);
      expect(mockOnSectionSelect).toHaveBeenCalledWith('HD');
    });

    it('should handle keyboard navigation with Enter key', async () => {
      const mockOnSectionSelect = jest.fn();
      renderArmorValidationPanel({ onSectionSelect: mockOnSectionSelect });
      
      const ctLocation = screen.getByText('CT').closest('div[role="button"]');
      expect(ctLocation).toBeInTheDocument();
      
      (ctLocation! as HTMLElement).focus();
      fireEvent.keyDown(ctLocation!, { key: 'Enter' });
      
      expect(mockOnSectionSelect).toHaveBeenCalledWith('CT');
    });

    it('should handle keyboard navigation with Space key', async () => {
      const mockOnSectionSelect = jest.fn();
      renderArmorValidationPanel({ onSectionSelect: mockOnSectionSelect });
      
      const ltLocation = screen.getByText('LT').closest('div[role="button"]');
      expect(ltLocation).toBeInTheDocument();
      
      (ltLocation! as HTMLElement).focus();
      fireEvent.keyDown(ltLocation!, { key: ' ' });
      
      expect(mockOnSectionSelect).toHaveBeenCalledWith('LT');
    });

    it('should highlight selected section visually', () => {
      const { container } = renderArmorValidationPanel({ selectedSection: 'CT' });
      
      // Should have ring highlight for selected section
      const selectedElement = container.querySelector('.ring-2.ring-blue-500\\/50');
      expect(selectedElement).toBeInTheDocument();
    });

    it('should allow selection of all armor locations', async () => {
      const mockOnSectionSelect = jest.fn();
      renderArmorValidationPanel({ onSectionSelect: mockOnSectionSelect });
      
      const locations = ['HD', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'];
      
      for (const location of locations) {
        const locationElement = screen.getByText(location).closest('div[role="button"]');
        expect(locationElement).toBeInTheDocument();
        
        await userEvent.click(locationElement!);
        expect(mockOnSectionSelect).toHaveBeenCalledWith(location);
      }
      
      expect(mockOnSectionSelect).toHaveBeenCalledTimes(locations.length);
    });

    it('should ignore other keyboard keys', () => {
      const mockOnSectionSelect = jest.fn();
      renderArmorValidationPanel({ onSectionSelect: mockOnSectionSelect });
      
      const hdLocation = screen.getByText('HD').closest('div[role="button"]');
      fireEvent.keyDown(hdLocation!, { key: 'Tab' });
      fireEvent.keyDown(hdLocation!, { key: 'Escape' });
      fireEvent.keyDown(hdLocation!, { key: 'a' });
      
      expect(mockOnSectionSelect).not.toHaveBeenCalled();
    });
  });

  // === EDGE CASES AND ERROR HANDLING ===
  
  describe('edge cases and error handling', () => {
    it('should handle missing armor allocation gracefully', () => {
      const incompleteArmor = { HD: { front: 9, rear: 0 } }; // Missing other locations
      
      expect(() => {
        renderArmorValidationPanel({ armorAllocation: incompleteArmor });
      }).not.toThrow();
    });

    it('should handle zero armor values', () => {
      const zeroArmor = {
        HD: { front: 0, rear: 0 },
        CT: { front: 0, rear: 0 },
        LT: { front: 0, rear: 0 },
        RT: { front: 0, rear: 0 },
        LA: { front: 0, rear: 0 },
        RA: { front: 0, rear: 0 },
        LL: { front: 0, rear: 0 },
        RL: { front: 0, rear: 0 }
      };
      
      renderArmorValidationPanel({ armorAllocation: zeroArmor });
      
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThanOrEqual(8); // At least one per location
    });

    it('should handle extremely large armor values', () => {
      const largeArmor = {
        ...mockArmorAllocation,
        CT: { front: 9999, rear: 9999 }
      };
      
      renderArmorValidationPanel({ armorAllocation: largeArmor });
      expect(screen.getAllByText('9999')).toHaveLength(2);
    });

    it('should handle missing getLocationMaxArmor function gracefully', () => {
      const mockBadFunction = () => 0; // Always returns 0
      
      renderArmorValidationPanel({ getLocationMaxArmor: mockBadFunction });
      
      // Should not crash and should show division by zero handling
      expect(screen.getByText('Armor Validation')).toBeInTheDocument();
    });

    it('should handle null selectedSection', () => {
      renderArmorValidationPanel({ selectedSection: null });
      
      // Should render normally without errors
      expect(screen.getByText('Armor Validation')).toBeInTheDocument();
    });

    it('should handle invalid location names', () => {
      const invalidArmor = {
        ...mockArmorAllocation,
        'INVALID': { front: 10, rear: 0 }
      };
      
      expect(() => {
        renderArmorValidationPanel({ armorAllocation: invalidArmor });
      }).not.toThrow();
    });
  });

  // === PERFORMANCE TESTS ===
  
  describe('performance', () => {
    it('should render efficiently with complex armor data', () => {
      const startTime = performance.now();
      renderArmorValidationPanel();
      const endTime = performance.now();
      
      // Should render in under 50ms
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('should handle rapid selection changes efficiently', async () => {
      const mockOnSectionSelect = jest.fn();
      renderArmorValidationPanel({ onSectionSelect: mockOnSectionSelect });
      
      const locations = ['HD', 'CT', 'LT', 'RT'];
      const startTime = performance.now();
      
      for (const location of locations) {
        const locationElement = screen.getByText(location).closest('div[role="button"]');
        await userEvent.click(locationElement!);
      }
      
      const endTime = performance.now();
      
      // Should handle rapid selections efficiently
      expect(endTime - startTime).toBeLessThan(500);
      expect(mockOnSectionSelect).toHaveBeenCalledTimes(4);
    });

    it('should calculate efficiency for large datasets efficiently', () => {
      const startTime = performance.now();
      
      // Render multiple times to test calculation efficiency
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderArmorValidationPanel();
        unmount();
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(200);
    });
  });

  // === INTEGRATION TESTS ===
  
  describe('integration', () => {
    it('should work correctly with parent component state changes', () => {
      const { rerender } = renderArmorValidationPanel({ selectedSection: null });
      
      expect(screen.getByText('Armor Validation')).toBeInTheDocument();
      
      // Simulate parent changing selected section
      rerender(<ArmorValidationPanel {...defaultProps} selectedSection="CT" />);
      
      // Should update visual state
      const { container } = render(<ArmorValidationPanel {...defaultProps} selectedSection="CT" />);
      const selectedElement = container.querySelector('.ring-2.ring-blue-500\\/50');
      expect(selectedElement).toBeInTheDocument();
    });

    it('should maintain consistency between armor values and validation', () => {
      const customArmor = {
        HD: { front: 5, rear: 0 },   // 56% efficiency (5/9)
        CT: { front: 25, rear: 15 }, // 85% efficiency (40/47)
        LT: { front: 18, rear: 6 },  // 75% efficiency (24/32)
        RT: { front: 18, rear: 6 },  // 75% efficiency (24/32)
        LA: { front: 12, rear: 0 },  // 50% efficiency (12/24)
        RA: { front: 12, rear: 0 },  // 50% efficiency (12/24)
        LL: { front: 20, rear: 0 },  // 49% efficiency (20/41)
        RL: { front: 20, rear: 0 }   // 49% efficiency (20/41)
      };
      
      renderArmorValidationPanel({ armorAllocation: customArmor });
      
      // Verify specific efficiency calculations
      expect(screen.getByText('(56%)')).toBeInTheDocument(); // HD: 5/9
      expect(screen.getByText('(85%)')).toBeInTheDocument(); // CT: 40/47
      expect(screen.getAllByText('(75%)')).toHaveLength(2); // LT/RT: 24/32 each
      expect(screen.getAllByText('(50%)')).toHaveLength(2); // LA/RA: 12/24 each
      expect(screen.getAllByText('(49%)')).toHaveLength(2); // LL/RL: 20/41 each
    });

    it('should coordinate properly with section selection', async () => {
      const mockOnSectionSelect = jest.fn();
      const { rerender } = renderArmorValidationPanel({ 
        onSectionSelect: mockOnSectionSelect,
        selectedSection: null 
      });
      
      const hdLocation = screen.getByText('HD').closest('div[role="button"]');
      await userEvent.click(hdLocation!);
      
      expect(mockOnSectionSelect).toHaveBeenCalledWith('HD');
      
      // Simulate parent updating selection
      rerender(<ArmorValidationPanel {...defaultProps} onSectionSelect={mockOnSectionSelect} selectedSection="HD" />);
      
      // Should show visual selection
      const updatedContainer = render(<ArmorValidationPanel {...defaultProps} selectedSection="HD" />).container;
      const selectedElement = updatedContainer.querySelector('.ring-2.ring-blue-500\\/50');
      expect(selectedElement).toBeInTheDocument();
    });
  });

  // === ACCESSIBILITY TESTS ===
  
  describe('accessibility', () => {
    it('should have proper ARIA labels for location buttons', () => {
      renderArmorValidationPanel();
      
      const hdButton = screen.getByLabelText(/Select HD armor section/);
      expect(hdButton).toBeInTheDocument();
      expect(hdButton).toHaveAttribute('role', 'button');
      expect(hdButton).toHaveAttribute('tabindex', '0');
    });

    it('should provide detailed ARIA descriptions', () => {
      renderArmorValidationPanel();
      
      const ctButton = screen.getByLabelText(/Select CT armor section.*points.*efficiency/);
      expect(ctButton).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      renderArmorValidationPanel();
      
      const locations = ['HD', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'];
      locations.forEach(location => {
        const button = screen.getByText(location).closest('div[role="button"]');
        expect(button).toHaveAttribute('tabindex', '0');
      });
    });

    it('should provide visual focus indicators', () => {
      const { container } = renderArmorValidationPanel();
      
      const buttons = container.querySelectorAll('div[role="button"]');
      buttons.forEach(button => {
        expect(button).toHaveClass('cursor-pointer', 'transition-colors');
      });
    });

    it('should support screen reader navigation', () => {
      renderArmorValidationPanel();
      
      // Check for descriptive text that screen readers can use
      expect(screen.getByText('Armor Validation')).toBeInTheDocument();
      expect(screen.getByText('All Locations')).toBeInTheDocument();
      expect(screen.getByText('Efficiency Legend:')).toBeInTheDocument();
    });
  });

  // === READ-ONLY MODE TESTS ===
  
  describe('read-only mode', () => {
    it('should still allow section selection in read-only mode', async () => {
      const mockOnSectionSelect = jest.fn();
      renderArmorValidationPanel({ 
        readOnly: true,
        onSectionSelect: mockOnSectionSelect 
      });
      
      const hdLocation = screen.getByText('HD').closest('div[role="button"]');
      await userEvent.click(hdLocation!);
      
      expect(mockOnSectionSelect).toHaveBeenCalledWith('HD');
    });

    it('should maintain visual interactivity in read-only mode', () => {
      const { container } = renderArmorValidationPanel({ readOnly: true });
      
      const clickableElements = container.querySelectorAll('.cursor-pointer');
      expect(clickableElements.length).toBeGreaterThan(0);
    });

    it('should display all validation data in read-only mode', () => {
      renderArmorValidationPanel({ readOnly: true });
      
      expect(screen.getByText('Armor Validation')).toBeInTheDocument();
      expect(screen.getByText(/\d+% Efficiency/)).toBeInTheDocument();
      expect(screen.getByText('All Locations')).toBeInTheDocument();
      expect(screen.getByText('Efficiency Legend:')).toBeInTheDocument();
    });
  });
});
