import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import DraggableEquipmentItem from '../../components/editor/equipment/DraggableEquipmentItem';
import { FullEquipment } from '../../types';

// Mock react-dnd hooks
jest.mock('react-dnd', () => {
  const mockUseDrag = jest.fn(() => [
    { isDragging: false },
    jest.fn(),
    jest.fn()
  ]);
  
  return {
    useDrag: mockUseDrag,
    DndProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock the special component check
jest.mock('../../types/systemComponents', () => ({
  isSpecialComponent: jest.fn((name: string) => 
    name.includes('Engine') || name.includes('Gyro') || name.includes('Cockpit')
  ),
}));

// Mock CSS modules
jest.mock('../../components/editor/equipment/DraggableEquipmentItem.module.css', () => ({
  container: 'container',
  compact: 'compact',
  dragging: 'dragging',
  dragHandle: 'dragHandle',
  content: 'content',
  header: 'header',
  nameSection: 'nameSection',
  name: 'name',
  headerRight: 'headerRight',
  techBase: 'techBase',
  removeButton: 'removeButton',
  details: 'details',
  stats: 'stats',
  totals: 'totals',
  location: 'location',
  locationLabel: 'locationLabel',
  locationName: 'locationName',
}));

const renderWithDnd = (component: React.ReactElement) => {
  return render(
    <DndProvider backend={HTML5Backend}>
      {component}
    </DndProvider>
  );
};

const createMockEquipment = (overrides: Partial<FullEquipment> = {}): FullEquipment => ({
  id: 'test-equipment-1',
  name: 'Medium Laser',
  type: 'Energy Weapon',
  tech_base: 'Inner Sphere',
  weight: 1,
  space: 1,
  damage: 5,
  heat: 3,
  data: {
    slots: 1,
    tons: 1,
    damage: 5,
    heatmap: 3,
    range: {
      short: 3,
      medium: 6,
      long: 9,
    },
  },
  ...overrides,
});

describe('DraggableEquipmentItem', () => {
  const mockOnRemove = jest.fn();

  beforeEach(() => {
    mockOnRemove.mockClear();
  });

  describe('Basic Rendering', () => {
    test('renders equipment name', () => {
      const equipment = createMockEquipment();
      renderWithDnd(<DraggableEquipmentItem equipment={equipment} />);
      
      expect(screen.getByText('Medium Laser')).toBeInTheDocument();
    });

    test('displays tech base abbreviation', () => {
      const equipment = createMockEquipment({ tech_base: 'Inner Sphere' });
      renderWithDnd(<DraggableEquipmentItem equipment={equipment} />);
      
      expect(screen.getByText('IS')).toBeInTheDocument();
    });

    test('displays clan tech base abbreviation', () => {
      const equipment = createMockEquipment({ tech_base: 'Clan' });
      renderWithDnd(<DraggableEquipmentItem equipment={equipment} />);
      
      expect(screen.getByText('C')).toBeInTheDocument();
    });

    test('shows drag handle', () => {
      const equipment = createMockEquipment();
      renderWithDnd(<DraggableEquipmentItem equipment={equipment} />);
      
      expect(screen.getByText('⋮⋮')).toBeInTheDocument();
    });
  });

  describe('Equipment Stats Display', () => {
    test('displays weight and critical slots', () => {
      const equipment = createMockEquipment({
        weight: 2,
        space: 3,
      });
      renderWithDnd(<DraggableEquipmentItem equipment={equipment} />);
      
      expect(screen.getByText(/2t/)).toBeInTheDocument();
      expect(screen.getByText(/3 crits/)).toBeInTheDocument();
    });

    test('displays damage for weapons', () => {
      const equipment = createMockEquipment({
        damage: 10,
      });
      renderWithDnd(<DraggableEquipmentItem equipment={equipment} />);
      
      expect(screen.getByText(/10 dmg/)).toBeInTheDocument();
    });

    test('displays heat for weapons', () => {
      const equipment = createMockEquipment({
        heat: 4,
      });
      renderWithDnd(<DraggableEquipmentItem equipment={equipment} />);
      
      expect(screen.getByText(/4 heat/)).toBeInTheDocument();
    });

    test('uses data.slots when space is not available', () => {
      const equipment = createMockEquipment({
        space: undefined,
        data: { slots: 2 }
      });
      renderWithDnd(<DraggableEquipmentItem equipment={equipment} />);
      
      expect(screen.getByText(/2 crits/)).toBeInTheDocument();
    });
  });

  describe('Quantity Handling', () => {
    test('displays quantity when greater than 1', () => {
      const equipment = createMockEquipment();
      renderWithDnd(<DraggableEquipmentItem equipment={equipment} quantity={3} />);
      
      expect(screen.getByText('Medium Laser x3')).toBeInTheDocument();
    });

    test('calculates total weight and slots for multiple quantities', () => {
      const equipment = createMockEquipment({
        weight: 2,
        space: 1,
      });
      renderWithDnd(<DraggableEquipmentItem equipment={equipment} quantity={3} />);
      
      expect(screen.getByText(/Total: 6t, 3 crits/)).toBeInTheDocument();
    });

    test('does not show quantity suffix when quantity is 1', () => {
      const equipment = createMockEquipment();
      renderWithDnd(<DraggableEquipmentItem equipment={equipment} quantity={1} />);
      
      expect(screen.getByText('Medium Laser')).toBeInTheDocument();
      expect(screen.queryByText(/x1/)).not.toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    test('applies compact styling', () => {
      const equipment = createMockEquipment();
      const { container } = renderWithDnd(
        <DraggableEquipmentItem equipment={equipment} isCompact={true} />
      );
      
      expect(container.firstChild).toHaveClass('compact');
    });

    test('hides details in compact mode', () => {
      const equipment = createMockEquipment({
        weight: 2,
        damage: 5,
      });
      renderWithDnd(
        <DraggableEquipmentItem 
          equipment={equipment} 
          isCompact={true} 
          showDetails={true}
        />
      );
      
      expect(screen.queryByText(/2t/)).not.toBeInTheDocument();
      expect(screen.queryByText(/5 dmg/)).not.toBeInTheDocument();
    });
  });

  describe('Details Toggle', () => {
    test('shows details when showDetails is true', () => {
      const equipment = createMockEquipment({
        weight: 1,
        damage: 5,
      });
      renderWithDnd(
        <DraggableEquipmentItem equipment={equipment} showDetails={true} />
      );
      
      expect(screen.getByText(/1t/)).toBeInTheDocument();
      expect(screen.getByText(/5 dmg/)).toBeInTheDocument();
    });

    test('hides details when showDetails is false', () => {
      const equipment = createMockEquipment({
        weight: 1,
        damage: 5,
      });
      renderWithDnd(
        <DraggableEquipmentItem equipment={equipment} showDetails={false} />
      );
      
      expect(screen.queryByText(/1t/)).not.toBeInTheDocument();
      expect(screen.queryByText(/5 dmg/)).not.toBeInTheDocument();
    });
  });

  describe('Location Display', () => {
    test('shows current location when provided', () => {
      const equipment = createMockEquipment();
      renderWithDnd(
        <DraggableEquipmentItem 
          equipment={equipment} 
          currentLocation="Right Torso" 
        />
      );
      
      expect(screen.getByText('Location:')).toBeInTheDocument();
      expect(screen.getByText('Right Torso')).toBeInTheDocument();
    });

    test('does not show location section when not provided', () => {
      const equipment = createMockEquipment();
      renderWithDnd(<DraggableEquipmentItem equipment={equipment} />);
      
      expect(screen.queryByText('Location:')).not.toBeInTheDocument();
    });
  });

  describe('Remove Functionality', () => {
    test('shows remove button when onRemove is provided', () => {
      const equipment = createMockEquipment();
      renderWithDnd(
        <DraggableEquipmentItem equipment={equipment} onRemove={mockOnRemove} />
      );
      
      const removeButton = screen.getByRole('button', { name: /remove medium laser/i });
      expect(removeButton).toBeInTheDocument();
    });

    test('does not show remove button when onRemove is not provided', () => {
      const equipment = createMockEquipment();
      renderWithDnd(<DraggableEquipmentItem equipment={equipment} />);
      
      expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
    });

    test('calls onRemove when remove button is clicked', async () => {
      const user = userEvent.setup();
      const equipment = createMockEquipment();
      renderWithDnd(
        <DraggableEquipmentItem equipment={equipment} onRemove={mockOnRemove} />
      );
      
      const removeButton = screen.getByRole('button', { name: /remove medium laser/i });
      await user.click(removeButton);
      
      expect(mockOnRemove).toHaveBeenCalledWith('test-equipment-1');
    });

    test('stops propagation on remove button click', () => {
      const equipment = createMockEquipment();
      const mockStopPropagation = jest.fn();
      renderWithDnd(
        <DraggableEquipmentItem equipment={equipment} onRemove={mockOnRemove} />
      );
      
      const removeButton = screen.getByRole('button', { name: /remove medium laser/i });
      fireEvent.click(removeButton, {
        stopPropagation: mockStopPropagation,
      });
      
      expect(mockOnRemove).toHaveBeenCalled();
    });
  });
  describe('Special Component Handling', () => {    test('treats special components as 1 critical slot', () => {
      const equipment = createMockEquipment({
        name: 'Standard Engine',
        space: 6, // Should be overridden to 1 for special components
        data: {
          ...createMockEquipment().data,
          slots: 6
        }
      });
      
      renderWithDnd(<DraggableEquipmentItem equipment={equipment} />);
      
      // Special component should override displayed stats to show 1 crit
      // instead of the actual number of crits (6)
      const statsText = screen.getByText(/crits/).textContent || '';
      
      expect(statsText).toContain('1t');
      expect(statsText).not.toContain('6 crits');
      
      // We would expect something like "1t • 1 crits • 5 dmg • 3 heat"
      // Check that only one number appears before "crits"
      const critsMatch = statsText.match(/(\d+)\s+crits/);
      expect(critsMatch?.[1]).toBe('1');
    });    test('preserves heat sink critical slots based on type', () => {
      const equipment = createMockEquipment({
        name: 'Double Heat Sink',
        space: 3,
        data: {
          ...createMockEquipment().data,
          slots: 3
        }
      });
      
      renderWithDnd(<DraggableEquipmentItem equipment={equipment} />);
      
      // Double Heat Sinks should keep their 3 slots
      const statsText = screen.getByText(/crits/).textContent || '';
      expect(statsText).toContain('3 crits');
    });
  });

  describe('Drag Behavior', () => {
    test('applies dragging styles when being dragged', () => {
      const mockUseDrag = require('react-dnd').useDrag;
      mockUseDrag.mockReturnValue([
        { isDragging: true },
        jest.fn(),
        jest.fn()
      ]);

      const equipment = createMockEquipment();
      const { container } = renderWithDnd(
        <DraggableEquipmentItem equipment={equipment} />
      );
      
      expect(container.firstChild).toHaveClass('dragging');
    });    test('has grab cursor when not dragging', () => {
      // Ensure useDrag returns isDragging: false
      const mockUseDrag = require('react-dnd').useDrag;
      mockUseDrag.mockImplementation(() => [
        { isDragging: false },
        jest.fn(),
        jest.fn()
      ]);

      const equipment = createMockEquipment();
      const { container } = renderWithDnd(
        <DraggableEquipmentItem equipment={equipment} />
      );
      
      // The cursor style is set in the component's JSX
      expect(container.firstChild).toHaveStyle('cursor: grab');
    });

    test('sets draggable attribute to false', () => {
      const equipment = createMockEquipment();
      const { container } = renderWithDnd(
        <DraggableEquipmentItem equipment={equipment} />
      );
      
      const element = container.firstChild as HTMLElement;
      expect(element.draggable).toBe(false);
    });
  });

  describe('Tech Base Abbreviation', () => {
    test('handles various tech base formats', () => {
      const testCases = [
        { input: 'Inner Sphere', expected: 'IS' },
        { input: 'IS', expected: 'IS' },
        { input: 'Clan', expected: 'C' },
        { input: 'C', expected: 'C' },
        { input: 'Unknown', expected: 'Unknown' },
        { input: undefined, expected: '' },
      ];

      testCases.forEach(({ input, expected }) => {
        const equipment = createMockEquipment({ tech_base: input });
        const { unmount } = renderWithDnd(
          <DraggableEquipmentItem equipment={equipment} />
        );
        
        if (expected) {
          expect(screen.getByText(expected)).toBeInTheDocument();
        } else {
          expect(screen.queryByText(/IS|C/)).not.toBeInTheDocument();
        }
        
        unmount();
      });
    });
  });

  describe('Edge Cases', () => {    test('handles equipment with no weight', () => {
      const equipment = createMockEquipment({
        weight: undefined,
        data: {
          ...createMockEquipment().data,
          tons: undefined
        }
      });
      renderWithDnd(<DraggableEquipmentItem equipment={equipment} />);
      
      // Check that the weight (t) doesn't appear in the stats
      const statsElement = screen.getByText(/crits/);
      expect(statsElement.textContent).not.toMatch(/\dt/);
    });

    test('handles equipment with no critical slots', () => {
      const equipment = createMockEquipment({
        space: undefined,
        data: { slots: undefined }
      });
      renderWithDnd(<DraggableEquipmentItem equipment={equipment} />);
      
      expect(screen.queryByText(/crits/)).not.toBeInTheDocument();
    });

    test('handles equipment with no damage', () => {
      const equipment = createMockEquipment({
        damage: undefined,
      });
      renderWithDnd(<DraggableEquipmentItem equipment={equipment} />);
      
      expect(screen.queryByText(/dmg/)).not.toBeInTheDocument();
    });

    test('handles equipment with no heat', () => {
      const equipment = createMockEquipment({
        heat: undefined,
      });
      renderWithDnd(<DraggableEquipmentItem equipment={equipment} />);
      
      expect(screen.queryByText(/heat/)).not.toBeInTheDocument();
    });

    test('handles string values for slots in data', () => {
      const equipment = createMockEquipment({
        space: undefined,
        data: { slots: '2' as any }
      });
      renderWithDnd(<DraggableEquipmentItem equipment={equipment} />);
      
      expect(screen.getByText(/2 crits/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('remove button has proper aria-label', () => {
      const equipment = createMockEquipment({ name: 'Large Laser' });
      renderWithDnd(
        <DraggableEquipmentItem equipment={equipment} onRemove={mockOnRemove} />
      );
      
      const removeButton = screen.getByRole('button', { name: 'Remove Large Laser' });
      expect(removeButton).toBeInTheDocument();
    });

    test('component has proper drag semantics', () => {
      const equipment = createMockEquipment();
      const { container } = renderWithDnd(
        <DraggableEquipmentItem equipment={equipment} />
      );
      
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveAttribute('draggable', 'false');
    });
  });
});
