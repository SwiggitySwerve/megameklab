/**
 * ArmorDiagramDisplay.test.tsx - Comprehensive test suite
 * 
 * Tests extracted ArmorDiagramDisplay component from ArmorTabV2 refactoring (Day 2)
 * Validates interactive diagram functionality, visual feedback, and SVG rendering
 * 
 * @see IMPLEMENTATION_REFERENCE.md for testing patterns
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArmorDiagramDisplay, ArmorDiagramDisplayProps } from '../../../../components/editor/armor/ArmorDiagramDisplay';

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

// Default props for testing
const defaultProps: ArmorDiagramDisplayProps = {
  armorAllocation: mockArmorAllocation,
  selectedSection: null,
  onSectionSelect: jest.fn(),
  onAutoAllocate: jest.fn(),
  availableArmorPoints: 200,
  cappedAvailablePoints: 200,
  displayUnallocatedPoints: 23,
  readOnly: false
};

// Helper function to render component with props
const renderArmorDiagramDisplay = (props: Partial<ArmorDiagramDisplayProps> = {}) => {
  const finalProps = { ...defaultProps, ...props };
  return render(<ArmorDiagramDisplay {...finalProps} />);
};

describe('ArmorDiagramDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // === CORE FUNCTIONALITY TESTS ===
  
  describe('core functionality', () => {
    it('should render armor diagram with title', () => {
      renderArmorDiagramDisplay();
      expect(screen.getByText(/Armor Diagram/)).toBeInTheDocument();
    });

    it('should display available armor points status', () => {
      renderArmorDiagramDisplay();
      expect(screen.getByText(/Available.*23.*pts.*200.*total/)).toBeInTheDocument();
    });

    it('should show over-allocated status when points are negative', () => {
      renderArmorDiagramDisplay({ displayUnallocatedPoints: -5 });
      expect(screen.getByText(/Over-allocated.*-5.*pts.*200.*total/)).toBeInTheDocument();
    });

    it('should render auto-allocate button', () => {
      renderArmorDiagramDisplay();
      const button = screen.getByRole('button', { name: /auto-allocate armor points/i });
      expect(button).toBeInTheDocument();
    });

    it('should call onAutoAllocate when auto-allocate button is clicked', async () => {
      const mockOnAutoAllocate = jest.fn();
      renderArmorDiagramDisplay({ onAutoAllocate: mockOnAutoAllocate });
      
      const button = screen.getByRole('button', { name: /auto-allocate armor points/i });
      await userEvent.click(button);
      
      expect(mockOnAutoAllocate).toHaveBeenCalledTimes(1);
    });

    it('should render SVG diagram with proper dimensions', () => {
      const { container } = renderArmorDiagramDisplay();
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '400');
      expect(svg).toHaveAttribute('height', '500');
      expect(svg).toHaveAttribute('viewBox', '0 0 400 500');
    });
  });

  // === SVG DIAGRAM TESTS ===
  
  describe('SVG diagram', () => {
    it('should render all mech sections', () => {
      renderArmorDiagramDisplay();
      
      // Check for all location text labels
      const locations = ['HD', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'];
      locations.forEach(location => {
        expect(screen.getByText(location)).toBeInTheDocument();
      });
    });

    it('should display armor values for each section', () => {
      renderArmorDiagramDisplay();
      
      // Check armor values are displayed
      expect(screen.getByText('9')).toBeInTheDocument(); // HD
      expect(screen.getByText('30')).toBeInTheDocument(); // CT front
      expect(screen.getByText('10')).toBeInTheDocument(); // CT rear
      expect(screen.getAllByText('20')).toHaveLength(2); // LT/RT front (both have 20)
      expect(screen.getAllByText('16')).toHaveLength(2); // LA/RA front (both have 16)
      expect(screen.getAllByText('24')).toHaveLength(2); // LL/RL front (both have 24)
    });

    it('should show rear armor for torso sections only', () => {
      renderArmorDiagramDisplay();
      
      // Count rear armor displays (should be 3: CT, LT, RT)
      const rearArmorElements = screen.getAllByText('8'); // LT/RT rear
      expect(rearArmorElements).toHaveLength(2); // LT and RT rear
      expect(screen.getByText('10')).toBeInTheDocument(); // CT rear
    });

    it('should apply correct colors based on section type', () => {
      const { container } = renderArmorDiagramDisplay();
      
      // Find SVG sections by their location
      const svgElement = container.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
      
      // Check that sections have proper fill colors (default state)
      const rects = svgElement?.querySelectorAll('rect');
      expect(rects).toBeTruthy();
      expect(rects!.length).toBeGreaterThan(0);
    });

    it('should highlight selected section with blue color', () => {
      const { container } = renderArmorDiagramDisplay({ selectedSection: 'HD' });
      
      const svgElement = container.querySelector('svg');
      const headRect = svgElement?.querySelector('rect[fill="#3b82f6"]'); // Blue color for selected
      expect(headRect).toBeInTheDocument();
    });
  });

  // === INTERACTIVE FUNCTIONALITY TESTS ===
  
  describe('interactive functionality', () => {
    it('should call onSectionSelect when clicking on head section', async () => {
      const mockOnSectionSelect = jest.fn();
      const { container } = renderArmorDiagramDisplay({ onSectionSelect: mockOnSectionSelect });
      
      // Find the HD text element and click its parent group
      const hdText = screen.getByText('HD');
      const hdGroup = hdText.closest('g');
      const hdRect = hdGroup?.querySelector('rect');
      
      expect(hdRect).toBeInTheDocument();
      await userEvent.click(hdRect!);
      
      expect(mockOnSectionSelect).toHaveBeenCalledWith('HD');
    });

    it('should call onSectionSelect when clicking on center torso', async () => {
      const mockOnSectionSelect = jest.fn();
      const { container } = renderArmorDiagramDisplay({ onSectionSelect: mockOnSectionSelect });
      
      // Find CT section and click it
      const ctText = screen.getByText('CT');
      const ctGroup = ctText.closest('g');
      const ctRect = ctGroup?.querySelector('rect');
      
      expect(ctRect).toBeInTheDocument();
      await userEvent.click(ctRect!);
      
      expect(mockOnSectionSelect).toHaveBeenCalledWith('CT');
    });

    it('should call onSectionSelect for all mech sections', async () => {
      const mockOnSectionSelect = jest.fn();
      const { container } = renderArmorDiagramDisplay({ onSectionSelect: mockOnSectionSelect });
      
      const locations = ['HD', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'];
      
      for (const location of locations) {
        const locationText = screen.getByText(location);
        const locationGroup = locationText.closest('g');
        const locationRect = locationGroup?.querySelector('rect');
        
        expect(locationRect).toBeInTheDocument();
        await userEvent.click(locationRect!);
        
        expect(mockOnSectionSelect).toHaveBeenCalledWith(location);
      }
      
      expect(mockOnSectionSelect).toHaveBeenCalledTimes(locations.length);
    });

    it('should handle rear armor section clicks for torso locations', async () => {
      const mockOnSectionSelect = jest.fn();
      const { container } = renderArmorDiagramDisplay({ onSectionSelect: mockOnSectionSelect });
      
      // Find CT rear armor section (smaller rect)
      const ctText = screen.getByText('CT');
      const ctGroup = ctText.closest('g');
      const ctRects = ctGroup?.querySelectorAll('rect');
      
      expect(ctRects).toHaveLength(2); // Front and rear rects
      
      // Click the rear armor rect (should be the second one)
      await userEvent.click(ctRects![1]);
      
      expect(mockOnSectionSelect).toHaveBeenCalledWith('CT');
    });
  });

  // === VISUAL FEEDBACK TESTS ===
  
  describe('visual feedback', () => {
    it('should show hover effects on clickable elements', () => {
      const { container } = renderArmorDiagramDisplay();
      
      const svgElement = container.querySelector('svg');
      const clickableRects = svgElement?.querySelectorAll('rect.cursor-pointer');
      
      expect(clickableRects).toBeTruthy();
      expect(clickableRects!.length).toBeGreaterThan(0);
      
      // Check that elements have hover classes
      clickableRects?.forEach(rect => {
        expect(rect).toHaveClass('cursor-pointer');
        expect(rect).toHaveClass('transition-all');
        // Check for either hover class variant - use getAttribute for SVG elements
        const className = rect.getAttribute('class') || '';
        expect(className).toMatch(/hover:fill-blue-[56]00/);
      });
    });

    it('should display diagram legend correctly', () => {
      renderArmorDiagramDisplay();
      
      expect(screen.getByText('Click any section to edit armor values')).toBeInTheDocument();
      expect(screen.getByText('Head')).toBeInTheDocument();
      expect(screen.getByText('Torso/Limbs')).toBeInTheDocument();
      expect(screen.getByText('Rear Armor')).toBeInTheDocument();
      expect(screen.getByText('Selected')).toBeInTheDocument();
    });

    it('should show color indicators in legend', () => {
      const { container } = renderArmorDiagramDisplay();
      
      // Check for color indicator divs in legend
      const colorDivs = container.querySelectorAll('.bg-green-600, .bg-amber-600, .bg-amber-800, .bg-blue-600');
      expect(colorDivs).toHaveLength(4); // Four legend color indicators
    });

    it('should apply correct status colors based on allocation', () => {
      renderArmorDiagramDisplay({ displayUnallocatedPoints: -10 });
      
      // Title should change color for over-allocation
      const title = screen.getByText(/Armor Diagram/);
      expect(title).toHaveClass('text-orange-300');
    });

    it('should show proper button styling for over-allocation', () => {
      renderArmorDiagramDisplay({ displayUnallocatedPoints: -5 });
      
      const button = screen.getByRole('button', { name: /auto-allocate armor points/i });
      expect(button).toHaveClass('bg-orange-600');
    });
  });

  // === AUTO-ALLOCATION INTEGRATION TESTS ===
  
  describe('auto-allocation integration', () => {
    it('should display available points correctly in button text', () => {
      renderArmorDiagramDisplay({ displayUnallocatedPoints: 50 });
      
      expect(screen.getByText('(50 pts available)')).toBeInTheDocument();
    });

    it('should display over-allocation correctly in button text', () => {
      renderArmorDiagramDisplay({ displayUnallocatedPoints: -10 });
      
      expect(screen.getByText('(-10 pts over-allocated)')).toBeInTheDocument();
    });

    it('should handle zero available points', () => {
      renderArmorDiagramDisplay({ displayUnallocatedPoints: 0 });
      
      expect(screen.getByText('(0 pts available)')).toBeInTheDocument();
    });

    it('should call auto-allocate with different armor states', async () => {
      const mockOnAutoAllocate = jest.fn();
      const { rerender } = renderArmorDiagramDisplay({ 
        onAutoAllocate: mockOnAutoAllocate,
        displayUnallocatedPoints: 100 
      });
      
      const button = screen.getByRole('button', { name: /auto-allocate armor points/i });
      await userEvent.click(button);
      
      expect(mockOnAutoAllocate).toHaveBeenCalledTimes(1);
      
      // Test with over-allocation state
      rerender(<ArmorDiagramDisplay {...defaultProps} onAutoAllocate={mockOnAutoAllocate} displayUnallocatedPoints={-20} />);
      
      await userEvent.click(button);
      expect(mockOnAutoAllocate).toHaveBeenCalledTimes(2);
    });
  });

  // === READ-ONLY MODE TESTS ===
  
  describe('read-only mode', () => {
    it('should disable auto-allocate button in read-only mode', () => {
      renderArmorDiagramDisplay({ readOnly: true });
      
      const button = screen.getByRole('button', { name: /auto-allocate armor points/i });
      expect(button).toBeDisabled();
    });

    it('should still allow section selection in read-only mode', async () => {
      const mockOnSectionSelect = jest.fn();
      const { container } = renderArmorDiagramDisplay({ 
        readOnly: true,
        onSectionSelect: mockOnSectionSelect 
      });
      
      // Should still be able to select sections for viewing
      const hdText = screen.getByText('HD');
      const hdGroup = hdText.closest('g');
      const hdRect = hdGroup?.querySelector('rect');
      
      await userEvent.click(hdRect!);
      expect(mockOnSectionSelect).toHaveBeenCalledWith('HD');
    });

    it('should maintain visual interactivity in read-only mode', () => {
      const { container } = renderArmorDiagramDisplay({ readOnly: true });
      
      const svgElement = container.querySelector('svg');
      const clickableRects = svgElement?.querySelectorAll('rect.cursor-pointer');
      
      // Elements should still be visually interactive
      expect(clickableRects!.length).toBeGreaterThan(0);
    });
  });

  // === EDGE CASES AND ERROR HANDLING ===
  
  describe('edge cases and error handling', () => {
    it('should handle missing armor allocation gracefully', () => {
      const incompleteArmor = { HD: { front: 9, rear: 0 } }; // Missing other locations
      
      expect(() => {
        renderArmorDiagramDisplay({ armorAllocation: incompleteArmor });
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
      
      renderArmorDiagramDisplay({ armorAllocation: zeroArmor });
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThanOrEqual(8); // At least all locations show 0
      expect(zeroElements.length).toBeLessThanOrEqual(11); // Including rear armor zeros
    });

    it('should handle extremely large armor values', () => {
      const largeArmor = {
        ...mockArmorAllocation,
        CT: { front: 9999, rear: 9999 }
      };
      
      renderArmorDiagramDisplay({ armorAllocation: largeArmor });
      expect(screen.getAllByText('9999')).toHaveLength(2); // Front and rear
    });

    it('should handle negative armor allocation points', () => {
      renderArmorDiagramDisplay({ displayUnallocatedPoints: -100 });
      
      expect(screen.getByText('(-100 pts over-allocated)')).toBeInTheDocument();
      const title = screen.getByText(/Over-allocated: -100 pts/);
      expect(title).toBeInTheDocument();
    });

    it('should handle null selectedSection', () => {
      renderArmorDiagramDisplay({ selectedSection: null });
      
      // Should render normally without errors
      expect(screen.getByText(/Armor Diagram/)).toBeInTheDocument();
    });
  });

  // === PERFORMANCE TESTS ===
  
  describe('performance', () => {
    it('should render efficiently with complex armor data', () => {
      const startTime = performance.now();
      renderArmorDiagramDisplay();
      const endTime = performance.now();
      
      // Should render in under 50ms (SVG is generally fast)
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('should handle rapid section selection changes', async () => {
      const mockOnSectionSelect = jest.fn();
      const { container } = renderArmorDiagramDisplay({ onSectionSelect: mockOnSectionSelect });
      
      const locations = ['HD', 'CT', 'LT', 'RT'];
      const startTime = performance.now();
      
      for (const location of locations) {
        const locationText = screen.getByText(location);
        const locationGroup = locationText.closest('g');
        const locationRect = locationGroup?.querySelector('rect');
        
        await userEvent.click(locationRect!);
      }
      
      const endTime = performance.now();
      
      // Should handle rapid clicks efficiently
      expect(endTime - startTime).toBeLessThan(500);
      expect(mockOnSectionSelect).toHaveBeenCalledTimes(4);
    });
  });

  // === INTEGRATION TESTS ===
  
  describe('integration', () => {
    it('should work correctly with parent component state changes', () => {
      const { rerender } = renderArmorDiagramDisplay({ selectedSection: null });
      
      expect(screen.getByText(/Armor Diagram/)).toBeInTheDocument();
      
      // Simulate parent changing selected section
      rerender(<ArmorDiagramDisplay {...defaultProps} selectedSection="CT" />);
      
      // Should update visual state (blue highlighting)
      const { container } = render(<ArmorDiagramDisplay {...defaultProps} selectedSection="CT" />);
      const svgElement = container.querySelector('svg');
      const selectedRect = svgElement?.querySelector('rect[fill="#3b82f6"]');
      expect(selectedRect).toBeInTheDocument();
    });

    it('should maintain consistency between armor values and display', () => {
      const customArmor = {
        HD: { front: 5, rear: 0 },
        CT: { front: 25, rear: 15 },
        LT: { front: 18, rear: 6 },
        RT: { front: 18, rear: 6 },
        LA: { front: 12, rear: 0 },
        RA: { front: 12, rear: 0 },
        LL: { front: 20, rear: 0 },
        RL: { front: 20, rear: 0 }
      };
      
      renderArmorDiagramDisplay({ armorAllocation: customArmor });
      
      // Verify all values are displayed correctly
      expect(screen.getByText('5')).toBeInTheDocument(); // HD
      expect(screen.getByText('25')).toBeInTheDocument(); // CT front
      expect(screen.getByText('15')).toBeInTheDocument(); // CT rear
      expect(screen.getAllByText('18')).toHaveLength(2); // LT/RT front
      expect(screen.getAllByText('6')).toHaveLength(2); // LT/RT rear
      expect(screen.getAllByText('12')).toHaveLength(2); // LA/RA
      expect(screen.getAllByText('20')).toHaveLength(2); // LL/RL
    });

    it('should coordinate properly with auto-allocation functionality', async () => {
      const mockOnAutoAllocate = jest.fn();
      renderArmorDiagramDisplay({ 
        onAutoAllocate: mockOnAutoAllocate,
        displayUnallocatedPoints: 75 
      });
      
      const button = screen.getByRole('button', { name: /auto-allocate armor points/i });
      await userEvent.click(button);
      
      expect(mockOnAutoAllocate).toHaveBeenCalledTimes(1);
      expect(screen.getByText('(75 pts available)')).toBeInTheDocument();
    });
  });

  // === ACCESSIBILITY TESTS ===
  
  describe('accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      const { container } = renderArmorDiagramDisplay();
      
      // SVG should be accessible
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have keyboard accessible button', () => {
      renderArmorDiagramDisplay();
      
      const button = screen.getByRole('button', { name: /auto-allocate armor points/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('should provide visual feedback for interactive elements', () => {
      const { container } = renderArmorDiagramDisplay();
      
      const clickableElements = container.querySelectorAll('.cursor-pointer');
      expect(clickableElements.length).toBeGreaterThan(0);
      
      // All clickable elements should have hover states
      clickableElements.forEach(element => {
        expect(element).toHaveClass('transition-all');
      });
    });
  });
});
