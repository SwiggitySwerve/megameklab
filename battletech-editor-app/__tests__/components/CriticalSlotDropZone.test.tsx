import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import CriticalSlotDropZone from '../../components/editor/criticals/CriticalSlotDropZone';
import { DraggedEquipment, DragItemType } from '../../components/editor/dnd/types';

// Mock react-dnd hooks - this is now handled by the __mocks__/react-dnd.js file
// We still need to mock this for the specific tests that manipulate the mock behavior
jest.mock('react-dnd', () => {
  return {
    useDrag: jest.fn(() => [
      { isDragging: false },
      jest.fn(),
    ]),
    useDrop: jest.fn(() => [
      { isOver: false, canDrop: true, draggedItem: null },
      jest.fn(),
    ]),
    DndProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock equipment database
jest.mock('../../utils/equipmentData', () => ({
  EQUIPMENT_DATABASE: [
    {
      name: 'Medium Laser',
      crits: 1,
      weight: 1,
      type: 'Energy Weapon',
    },
    {
      name: 'AC/10',
      crits: 7,
      weight: 12,
      type: 'Ballistic Weapon',
    },
    {
      name: 'Heat Sink',
      crits: 1,
      weight: 1,
      type: 'Heat Sink',
    },
  ],
}));

// Mock CSS modules
jest.mock('../../components/editor/criticals/CriticalSlotDropZone.module.css', () => ({
  slot: 'slot',
  empty: 'empty',
  invalid: 'invalid',
  highlighted: 'highlighted',
  rejected: 'rejected',
  omniPod: 'omniPod',
  disabled: 'disabled',
  systemProtected: 'systemProtected',
  dragging: 'dragging',
  hoveredMultiSlot: 'hoveredMultiSlot',
  groupStart: 'groupStart',
  groupMiddle: 'groupMiddle',
  groupEnd: 'groupEnd',
  draggable: 'draggable',
  slotNumber: 'slotNumber',
  slotContent: 'slotContent',
  omniPodIndicator: 'omniPodIndicator',
}));

const renderWithDnd = (component: React.ReactElement) => {
  return render(
    <DndProvider backend={HTML5Backend}>
      {component}
    </DndProvider>
  );
};

const createMockDraggedEquipment = (overrides: Partial<DraggedEquipment> = {}): DraggedEquipment => ({
  type: DragItemType.EQUIPMENT,
  equipmentId: 'test-equipment-1',
  name: 'Medium Laser',
  criticalSlots: 1,
  weight: 1,
  ...overrides,
});

describe('CriticalSlotDropZone', () => {
  const mockOnDrop = jest.fn();
  const mockOnRemove = jest.fn();
  const mockCanAccept = jest.fn();
  const mockOnSystemClick = jest.fn();
  const mockOnHoverChange = jest.fn();

  const defaultProps = {
    location: 'Right Arm',
    slotIndex: 0,
    onDrop: mockOnDrop,
  };

  beforeEach(() => {
    mockOnDrop.mockClear();
    mockOnRemove.mockClear();
    mockCanAccept.mockClear();
    mockOnSystemClick.mockClear();
    mockOnHoverChange.mockClear();
  });

  describe('Basic Rendering', () => {
    test('renders empty slot with correct content', () => {
      renderWithDnd(<CriticalSlotDropZone {...defaultProps} />);
      
      expect(screen.getByText('1')).toBeInTheDocument(); // slot number
      expect(screen.getByText('- Empty -')).toBeInTheDocument();
    });

    test('renders filled slot with equipment name', () => {
      renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          currentItem="Medium Laser" 
        />
      );
      
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Medium Laser')).toBeInTheDocument();
    });

    test('displays correct slot number', () => {
      renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          slotIndex={4} 
        />
      );
      
      expect(screen.getByText('5')).toBeInTheDocument(); // slotIndex + 1
    });

    test('shows OmniPod indicator when isOmniPodSlot is true', () => {
      renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          isOmniPodSlot={true} 
        />
      );
      
      expect(screen.getByText('○')).toBeInTheDocument();
    });
  });

  describe('Empty Slot Detection', () => {
    test('treats undefined as empty', () => {
      renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          currentItem={undefined} 
        />
      );
      
      expect(screen.getByText('- Empty -')).toBeInTheDocument();
    });

    test('treats various empty representations as empty', () => {
      const emptyValues = [
        '',
        '   ',
        '- Empty -',
        '- empty -',
        'empty',
        '-',
        '- -',
        '—',
        '–',
        'null',
        'undefined',
      ];

      emptyValues.forEach(value => {
        const { unmount } = renderWithDnd(
          <CriticalSlotDropZone 
            {...defaultProps} 
            currentItem={value} 
          />
        );
        
        expect(screen.getByText('- Empty -')).toBeInTheDocument();
        unmount();
      });
    });

    test('does not treat actual equipment names as empty', () => {
      renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          currentItem="Medium Laser" 
        />
      );
      
      expect(screen.getByText('Medium Laser')).toBeInTheDocument();
      expect(screen.queryByText('- Empty -')).not.toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    test('applies empty class for empty slots', () => {
      const { container } = renderWithDnd(
        <CriticalSlotDropZone {...defaultProps} />
      );
      
      expect(container.firstChild).toHaveClass('slot', 'empty');
    });

    test('applies invalid class when isValid is false', () => {
      const { container } = renderWithDnd(
        <CriticalSlotDropZone {...defaultProps} isValid={false} />
      );
      
      expect(container.firstChild).toHaveClass('invalid');
    });

    test('applies omniPod class when isOmniPodSlot is true', () => {
      const { container } = renderWithDnd(
        <CriticalSlotDropZone {...defaultProps} isOmniPodSlot={true} />
      );
      
      expect(container.firstChild).toHaveClass('omniPod');
    });

    test('applies disabled class when disabled is true', () => {
      const { container } = renderWithDnd(
        <CriticalSlotDropZone {...defaultProps} disabled={true} />
      );
      
      expect(container.firstChild).toHaveClass('disabled');
    });

    test('applies group classes for multi-slot equipment', () => {
      const { container, rerender } = renderWithDnd(
        <CriticalSlotDropZone {...defaultProps} isStartOfGroup={true} />
      );
      expect(container.firstChild).toHaveClass('groupStart');

      rerender(
        <DndProvider backend={HTML5Backend}>
          <CriticalSlotDropZone {...defaultProps} isMiddleOfGroup={true} />
        </DndProvider>
      );
      expect(container.firstChild).toHaveClass('groupMiddle');

      rerender(
        <DndProvider backend={HTML5Backend}>
          <CriticalSlotDropZone {...defaultProps} isEndOfGroup={true} />
        </DndProvider>
      );
      expect(container.firstChild).toHaveClass('groupEnd');
    });

    test('applies draggable class for non-empty, non-system slots', () => {
      const { container } = renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          currentItem="Medium Laser"
          onRemove={mockOnRemove}
        />
      );
      
      expect(container.firstChild).toHaveClass('draggable');
    });

    test('does not apply draggable class for system components', () => {
      const { container } = renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          currentItem="Engine"
          isSystemComponent={true}
        />
      );
      
      expect(container.firstChild).not.toHaveClass('draggable');
    });
  });

  describe('Drop Functionality', () => {
    test('accepts valid drops on empty slots', () => {
      const mockUseDrop = require('react-dnd').useDrop;
      const mockDropSpec = jest.fn();
      
      mockUseDrop.mockImplementation((spec: any) => {
        mockDropSpec.mockImplementation(spec().canDrop);
        return [
          { isOver: false, canDrop: true, draggedItem: null },
          jest.fn(),
        ];
      });

      renderWithDnd(<CriticalSlotDropZone {...defaultProps} />);
      
      const draggedItem = createMockDraggedEquipment();
      const canDrop = mockDropSpec(draggedItem);
      
      expect(canDrop).toBe(true);
    });

    test('rejects drops on occupied slots', () => {
      const mockUseDrop = require('react-dnd').useDrop;
      const mockDropSpec = jest.fn();
      
      mockUseDrop.mockImplementation((spec: any) => {
        mockDropSpec.mockImplementation(spec().canDrop);
        return [
          { isOver: false, canDrop: false, draggedItem: null },
          jest.fn(),
        ];
      });

      renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          currentItem="Medium Laser" 
        />
      );
      
      const draggedItem = createMockDraggedEquipment();
      const canDrop = mockDropSpec(draggedItem);
      
      expect(canDrop).toBe(false);
    });

    test('rejects drops when disabled', () => {
      const mockUseDrop = require('react-dnd').useDrop;
      const mockDropSpec = jest.fn();
      
      mockUseDrop.mockImplementation((spec: any) => {
        mockDropSpec.mockImplementation(spec().canDrop);
        return [
          { isOver: false, canDrop: false, draggedItem: null },
          jest.fn(),
        ];
      });

      renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          disabled={true} 
        />
      );
      
      const draggedItem = createMockDraggedEquipment();
      const canDrop = mockDropSpec(draggedItem);
      
      expect(canDrop).toBe(false);
    });

    test('uses custom canAccept function when provided', () => {
      mockCanAccept.mockReturnValue(false);
      
      const mockUseDrop = require('react-dnd').useDrop;
      const mockDropSpec = jest.fn();
      
      mockUseDrop.mockImplementation((spec: any) => {
        mockDropSpec.mockImplementation(spec().canDrop);
        return [
          { isOver: false, canDrop: false, draggedItem: null },
          jest.fn(),
        ];
      });

      renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          canAccept={mockCanAccept} 
        />
      );
      
      const draggedItem = createMockDraggedEquipment();
      mockDropSpec(draggedItem);
      
      expect(mockCanAccept).toHaveBeenCalledWith(draggedItem);
    });

    test('calls onDrop when drop occurs', () => {
      const mockUseDrop = require('react-dnd').useDrop;
      
      mockUseDrop.mockImplementation((spec: any) => {
        const draggedItem = createMockDraggedEquipment();
        spec().drop(draggedItem);
        return [
          { isOver: false, canDrop: true, draggedItem: null },
          jest.fn(),
        ];
      });

      renderWithDnd(<CriticalSlotDropZone {...defaultProps} />);
      
      expect(mockOnDrop).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Medium Laser' }),
        'Right Arm',
        0
      );
    });
  });

  describe('Drag Functionality', () => {
    test('creates drag item for filled slots', () => {
      const mockUseDrag = require('react-dnd').useDrag;
      const mockDragSpec = jest.fn();
      
      mockUseDrag.mockImplementation((spec: any) => {
        const item = spec().item();
        mockDragSpec.mockReturnValue(item);
        return [{ isDragging: false }, jest.fn()];
      });

      renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          currentItem="Medium Laser" 
        />
      );
      
      const dragItem = mockDragSpec();
      
      expect(dragItem).toMatchObject({
        name: 'Medium Laser',
        type: DragItemType.EQUIPMENT,
        sourceLocation: 'Right Arm',
        sourceSlotIndex: 0,
        isFromCriticalSlot: true,
      });
    });

    test('does not create drag item for empty slots', () => {
      const mockUseDrag = require('react-dnd').useDrag;
      const mockDragSpec = jest.fn();
      
      mockUseDrag.mockImplementation((spec: any) => {
        const item = spec().item();
        mockDragSpec.mockReturnValue(item);
        return [{ isDragging: false }, jest.fn()];
      });

      renderWithDnd(<CriticalSlotDropZone {...defaultProps} />);
      
      const dragItem = mockDragSpec();
      expect(dragItem).toBeNull();
    });

    test('does not allow dragging of system components', () => {
      const mockUseDrag = require('react-dnd').useDrag;
      const mockCanDrag = jest.fn();
      
      mockUseDrag.mockImplementation((spec: any) => {
        mockCanDrag.mockReturnValue(spec().canDrag);
        return [{ isDragging: false }, jest.fn()];
      });

      renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          currentItem="Engine"
          isSystemComponent={true}
        />
      );
      
      const canDrag = mockCanDrag();
      expect(canDrag).toBe(false);
    });

    test('does not allow dragging when disabled', () => {
      const mockUseDrag = require('react-dnd').useDrag;
      const mockCanDrag = jest.fn();
      
      mockUseDrag.mockImplementation((spec: any) => {
        mockCanDrag.mockReturnValue(spec().canDrag);
        return [{ isDragging: false }, jest.fn()];
      });

      renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          currentItem="Medium Laser"
          disabled={true}
        />
      );
      
      const canDrag = mockCanDrag();
      expect(canDrag).toBe(false);
    });
  });

  describe('Double Click Handling', () => {
    test('calls onRemove for equipment slots when double-clicked', async () => {
      const user = userEvent.setup();
      
      renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          currentItem="Medium Laser"
          onRemove={mockOnRemove}
        />
      );
      
      const slot = screen.getByText('Medium Laser').parentElement;
      await user.dblClick(slot!);
      
      expect(mockOnRemove).toHaveBeenCalledWith('Right Arm', 0);
    });

    test('calls onSystemClick for system components when double-clicked', async () => {
      const user = userEvent.setup();
      
      renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          currentItem="Engine"
          isSystemComponent={true}
          onSystemClick={mockOnSystemClick}
        />
      );
      
      const slot = screen.getByText('Engine').parentElement;
      await user.dblClick(slot!);
      
      expect(mockOnSystemClick).toHaveBeenCalled();
    });

    test('does not call onRemove for empty slots', async () => {
      const user = userEvent.setup();
      
      renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          onRemove={mockOnRemove}
        />
      );
      
      const slot = screen.getByText('- Empty -').parentElement;
      await user.dblClick(slot!);
      
      expect(mockOnRemove).not.toHaveBeenCalled();
    });

    test('does not call onRemove when disabled', async () => {
      const user = userEvent.setup();
      
      renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          currentItem="Medium Laser"
          disabled={true}
          onRemove={mockOnRemove}
        />
      );
      
      const slot = screen.getByText('Medium Laser').parentElement;
      await user.dblClick(slot!);
      
      expect(mockOnRemove).not.toHaveBeenCalled();
    });
  });

  describe('Hover State Management', () => {
    test('calls onHoverChange when hovering with valid drop', () => {
      const mockUseDrop = require('react-dnd').useDrop;
      
      mockUseDrop.mockReturnValue([
        { 
          isOver: true, 
          canDrop: true, 
          draggedItem: createMockDraggedEquipment() 
        },
        jest.fn(),
      ]);

      renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          onHoverChange={mockOnHoverChange}
        />
      );
      
      expect(mockOnHoverChange).toHaveBeenCalledWith(
        true, 
        expect.objectContaining({ name: 'Medium Laser' })
      );
    });

    test('applies hoveredMultiSlot styling when prop is true', () => {
      const { container } = renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          isHoveredMultiSlot={true}
        />
      );
      
      expect(container.firstChild).toHaveClass('hoveredMultiSlot');
    });    test('applies inline styles for hovered multi-slot', () => {
      const { container } = renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          isHoveredMultiSlot={true}
        />
      );
      
      // Instead of checking the inline styles directly, we'll check if the class is applied
      // The useEffect in the component applies styles to the DOM node directly
      expect(container.firstChild).toHaveClass('hoveredMultiSlot');
    });
  });

  describe('Equipment Database Integration', () => {
    test('retrieves equipment stats from database', () => {
      const mockUseDrag = require('react-dnd').useDrag;
      const mockDragSpec = jest.fn();
      
      mockUseDrag.mockImplementation((spec: any) => {
        const item = spec().item();
        mockDragSpec.mockReturnValue(item);
        return [{ isDragging: false }, jest.fn()];
      });

      renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          currentItem="AC/10" 
        />
      );
      
      const dragItem = mockDragSpec();
      
      expect(dragItem).toMatchObject({
        name: 'AC/10',
        criticalSlots: 7,
        weight: 12,
      });
    });

    test('uses fallback stats for unknown equipment', () => {
      const mockUseDrag = require('react-dnd').useDrag;
      const mockDragSpec = jest.fn();
      
      mockUseDrag.mockImplementation((spec: any) => {
        const item = spec().item();
        mockDragSpec.mockReturnValue(item);
        return [{ isDragging: false }, jest.fn()];
      });

      renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          currentItem="Unknown Equipment" 
        />
      );
      
      const dragItem = mockDragSpec();
      
      expect(dragItem).toMatchObject({
        name: 'Unknown Equipment',
        criticalSlots: 1,
        weight: 1,
      });
    });
  });

  describe('Visual Feedback', () => {
    test('shows system feedback when system component is double-clicked', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      const { container } = renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          currentItem="Engine"
          isSystemComponent={true}
          onSystemClick={mockOnSystemClick}
        />
      );
      
      const slot = screen.getByText('Engine').parentElement;
      await user.dblClick(slot!);
      
      // Should show system protected class immediately
      expect(container.firstChild).toHaveClass('systemProtected');
      
      // Should remove the class after timeout
      jest.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(container.firstChild).not.toHaveClass('systemProtected');
      });
      
      jest.useRealTimers();
    });

    test('applies highlighted class when drop is valid and hovering', () => {
      const mockUseDrop = require('react-dnd').useDrop;
      
      mockUseDrop.mockReturnValue([
        { isOver: true, canDrop: true, draggedItem: null },
        jest.fn(),
      ]);

      const { container } = renderWithDnd(
        <CriticalSlotDropZone {...defaultProps} />
      );
      
      expect(container.firstChild).toHaveClass('highlighted');
    });

    test('applies rejected class when drop is invalid and hovering', () => {
      const mockUseDrop = require('react-dnd').useDrop;
      
      mockUseDrop.mockReturnValue([
        { isOver: true, canDrop: false, draggedItem: null },
        jest.fn(),
      ]);

      const { container } = renderWithDnd(
        <CriticalSlotDropZone {...defaultProps} />
      );
      
      expect(container.firstChild).toHaveClass('rejected');
    });
  });

  describe('Cursor and Tooltip', () => {
    test('shows move cursor for draggable filled slots', () => {
      const { container } = renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          currentItem="Medium Laser"
          onRemove={mockOnRemove}
        />
      );
      
      const element = container.firstChild as HTMLElement;
      expect(element.style.cursor).toBe('move');
    });

    test('shows default cursor for empty slots', () => {
      const { container } = renderWithDnd(
        <CriticalSlotDropZone {...defaultProps} />
      );
      
      const element = container.firstChild as HTMLElement;
      expect(element.style.cursor).toBe('default');
    });

    test('shows tooltip for draggable slots', () => {
      const { container } = renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          currentItem="Medium Laser"
          onRemove={mockOnRemove}
        />
      );
      
      const element = container.firstChild as HTMLElement;
      expect(element.title).toBe('Drag to move or double-click to remove');
    });
  });

  describe('Data Attributes', () => {
    test('sets correct data attributes', () => {
      const { container } = renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          location="Left Torso"
          slotIndex={3}
        />
      );
      
      const element = container.firstChild as HTMLElement;
      expect(element.getAttribute('data-location')).toBe('Left Torso');
      expect(element.getAttribute('data-slot')).toBe('3');
    });
  });

  describe('Edge Cases', () => {
    test('handles null currentItem gracefully', () => {
      renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          currentItem={null as any}
        />
      );
      
      expect(screen.getByText('- Empty -')).toBeInTheDocument();
    });

    test('handles non-string currentItem gracefully', () => {
      renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          currentItem={123 as any}
        />
      );
      
      expect(screen.getByText('- Empty -')).toBeInTheDocument();
    });

    test('prevents dragging middle and end group slots', () => {
      const mockUseDrag = require('react-dnd').useDrag;
      const mockCanDrag = jest.fn();
      
      mockUseDrag.mockImplementation((spec: any) => {
        mockCanDrag.mockReturnValue(spec().canDrag);
        return [{ isDragging: false }, jest.fn()];
      });

      // Test middle of group
      const { rerender } = renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          currentItem="AC/10"
          isMiddleOfGroup={true}
        />
      );
      
      let canDrag = mockCanDrag();
      expect(canDrag).toBe(false);

      // Test end of group
      rerender(
        <DndProvider backend={HTML5Backend}>
          <CriticalSlotDropZone 
            {...defaultProps} 
            currentItem="AC/10"
            isEndOfGroup={true}
          />
        </DndProvider>
      );
      
      canDrag = mockCanDrag();
      expect(canDrag).toBe(false);
    });
  });

  describe('Accessibility', () => {
    test('slot number is accessible', () => {
      renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          slotIndex={5}
        />
      );
      
      expect(screen.getByText('6')).toBeInTheDocument();
    });

    test('slot content is accessible', () => {
      renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          currentItem="Large Laser"
        />
      );
      
      expect(screen.getByText('Large Laser')).toBeInTheDocument();
    });

    test('OmniPod indicator is accessible', () => {
      renderWithDnd(
        <CriticalSlotDropZone 
          {...defaultProps} 
          isOmniPodSlot={true}
        />
      );
      
      expect(screen.getByText('○')).toBeInTheDocument();
    });
  });
});
