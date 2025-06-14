import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import CriticalSlot from '../../components/editor/criticals/CriticalSlot';
import { CriticalSlot as CriticalSlotType, Mounted } from '../../types/criticals';

// Mock react-dnd hooks
jest.mock('react-dnd', () => {
  return {
    useDrop: jest.fn(() => [
      { isOver: false },
      jest.fn()
    ]),
    DndProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock CSS modules
jest.mock('../../components/editor/criticals/CriticalSlot.module.css', () => ({
  slot: 'slot',
  isOver: 'isOver',
  empty: 'empty',
  system: 'system',
  equipment: 'equipment',
}));

const renderWithDnd = (component: React.ReactElement) => {
  return render(
    <DndProvider backend={HTML5Backend}>
      {component}
    </DndProvider>
  );
};

const createEmptySlot = (): CriticalSlotType => ({
  type: 'EMPTY',
});

const createSystemSlot = (system = 'Engine'): CriticalSlotType => ({
  type: 'SYSTEM',
  system,
});

const createEquipmentSlot = (mount: Mounted): CriticalSlotType => ({
  type: 'EQUIPMENT',
  mount,
});

const createMockMount = (overrides: Partial<Mounted> = {}): Mounted => ({
  id: 'test-mount-1',
  name: 'Medium Laser',
  type: 'weapon',
  location: 'Right Arm',
  criticalSlots: 1,
  weight: 1,
  ...overrides,
} as Mounted);

describe('CriticalSlot', () => {
  const mockOnDrop = jest.fn();
  const mockOnDoubleClick = jest.fn();
  const defaultProps = {
    location: 'Right Arm',
    index: 0,
    onDrop: mockOnDrop,
    onDoubleClick: mockOnDoubleClick,
  };

  beforeEach(() => {
    mockOnDrop.mockClear();
    mockOnDoubleClick.mockClear();
  });

  describe('Empty Slot Rendering', () => {
    test('renders empty slot with correct content', () => {
      const slot = createEmptySlot();
      renderWithDnd(
        <CriticalSlot slot={slot} {...defaultProps} />
      );
      
      expect(screen.getByText('-Empty-')).toBeInTheDocument();
    });

    test('applies empty slot CSS class', () => {
      const slot = createEmptySlot();
      const { container } = renderWithDnd(
        <CriticalSlot slot={slot} {...defaultProps} />
      );
      
      expect(container.firstChild).toHaveClass('slot', 'empty');
    });
  });

  describe('System Slot Rendering', () => {
    test('renders system slot with system name', () => {
      const slot = createSystemSlot('Engine');
      renderWithDnd(
        <CriticalSlot slot={slot} {...defaultProps} />
      );
      
      expect(screen.getByText('Engine')).toBeInTheDocument();
    });

    test('applies system slot CSS class', () => {
      const slot = createSystemSlot('Gyro');
      const { container } = renderWithDnd(
        <CriticalSlot slot={slot} {...defaultProps} />
      );
      
      expect(container.firstChild).toHaveClass('slot', 'system');
    });

    test('renders different system types', () => {
      const systemTypes = ['Engine', 'Gyro', 'Cockpit', 'Life Support'];
      
      systemTypes.forEach(systemType => {
        const slot = createSystemSlot(systemType);
        const { unmount } = renderWithDnd(
          <CriticalSlot slot={slot} {...defaultProps} />
        );
        
        expect(screen.getByText(systemType)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Equipment Slot Rendering', () => {
    test('renders equipment slot with equipment name', () => {
      const mount = createMockMount({ name: 'Large Laser' });
      const slot = createEquipmentSlot(mount);
      renderWithDnd(
        <CriticalSlot slot={slot} {...defaultProps} />
      );
      
      expect(screen.getByText('Large Laser')).toBeInTheDocument();
    });

    test('applies equipment slot CSS class', () => {
      const mount = createMockMount();
      const slot = createEquipmentSlot(mount);
      const { container } = renderWithDnd(
        <CriticalSlot slot={slot} {...defaultProps} />
      );
      
      expect(container.firstChild).toHaveClass('slot', 'equipment');
    });

    test('renders different equipment types', () => {
      const equipmentTypes = [
        { name: 'AC/10', type: 'weapon' },
        { name: 'Heat Sink', type: 'equipment' },
        { name: 'Jump Jet', type: 'equipment' },
      ];
      
      equipmentTypes.forEach(({ name, type }) => {
        const mount = createMockMount({ name, type });
        const slot = createEquipmentSlot(mount);
        const { unmount } = renderWithDnd(
          <CriticalSlot slot={slot} {...defaultProps} />
        );
        
        expect(screen.getByText(name)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Drop Functionality', () => {
    test('accepts drops when isOver is true', () => {
      const mockUseDrop = require('react-dnd').useDrop;
      mockUseDrop.mockReturnValue([
        { isOver: true },
        jest.fn()
      ]);

      const slot = createEmptySlot();
      const { container } = renderWithDnd(
        <CriticalSlot slot={slot} {...defaultProps} />
      );
      
      expect(container.firstChild).toHaveClass('slot', 'isOver');
    });

    test('calls onDrop when drop occurs', () => {
      const mockDrop = jest.fn();
      const mockUseDrop = require('react-dnd').useDrop;
      mockUseDrop.mockImplementation((spec: any) => {
        // Simulate a drop
        const equipment = createMockMount();
        spec().drop({ equipment });
        return [{ isOver: false }, mockDrop];
      });

      const slot = createEmptySlot();
      renderWithDnd(
        <CriticalSlot slot={slot} {...defaultProps} />
      );
      
      expect(mockOnDrop).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Medium Laser' }),
        'Right Arm',
        0
      );
    });

    test('configures drop to accept EQUIPMENT drag type', () => {
      const mockUseDrop = require('react-dnd').useDrop;
      const slot = createEmptySlot();
      
      renderWithDnd(
        <CriticalSlot slot={slot} {...defaultProps} />
      );
        const dropSpec = mockUseDrop.mock.calls[0][0]();
      expect(dropSpec.accept).toBe('equipment'); // DragItemType.EQUIPMENT is lowercase 'equipment'
    });
  });

  describe('Double Click Handling', () => {
    test('calls onDoubleClick when double clicked', async () => {
      const user = userEvent.setup();
      const slot = createEmptySlot();
      renderWithDnd(
        <CriticalSlot slot={slot} {...defaultProps} />
      );
      
      const slotElement = screen.getByText('-Empty-');
      await user.dblClick(slotElement);
      
      expect(mockOnDoubleClick).toHaveBeenCalledTimes(1);
    });

    test('works for all slot types', async () => {
      const user = userEvent.setup();
      const testCases = [
        { slot: createEmptySlot(), text: '-Empty-' },
        { slot: createSystemSlot('Engine'), text: 'Engine' },
        { slot: createEquipmentSlot(createMockMount()), text: 'Medium Laser' },
      ];
      
      for (const { slot, text } of testCases) {
        const { unmount } = renderWithDnd(
          <CriticalSlot slot={slot} {...defaultProps} />
        );
        
        const slotElement = screen.getByText(text);
        await user.dblClick(slotElement);
        
        expect(mockOnDoubleClick).toHaveBeenCalled();
        mockOnDoubleClick.mockClear();
        unmount();
      }
    });
  });

  describe('CSS Class Management', () => {
    test('applies base slot class to all slot types', () => {
      const testSlots = [
        createEmptySlot(),
        createSystemSlot('Engine'),
        createEquipmentSlot(createMockMount()),
      ];
      
      testSlots.forEach(slot => {
        const { container, unmount } = renderWithDnd(
          <CriticalSlot slot={slot} {...defaultProps} />
        );
        
        expect(container.firstChild).toHaveClass('slot');
        unmount();
      });
    });

    test('applies isOver class when drag is hovering', () => {
      const mockUseDrop = require('react-dnd').useDrop;
      mockUseDrop.mockReturnValue([
        { isOver: true },
        jest.fn()
      ]);

      const slot = createEmptySlot();
      const { container } = renderWithDnd(
        <CriticalSlot slot={slot} {...defaultProps} />
      );
      
      expect(container.firstChild).toHaveClass('isOver');
    });

    test('does not apply type-specific classes when isOver is true', () => {
      const mockUseDrop = require('react-dnd').useDrop;
      mockUseDrop.mockReturnValue([
        { isOver: true },
        jest.fn()
      ]);

      const slot = createEmptySlot();
      const { container } = renderWithDnd(
        <CriticalSlot slot={slot} {...defaultProps} />
      );
      
      expect(container.firstChild).toHaveClass('isOver');
      expect(container.firstChild).not.toHaveClass('empty');
    });
  });

  describe('Props Handling', () => {
    test('passes location and index to onDrop callback', () => {
      const mockUseDrop = require('react-dnd').useDrop;
      mockUseDrop.mockImplementation((spec: any) => {
        const equipment = createMockMount();
        spec().drop({ equipment });
        return [{ isOver: false }, jest.fn()];
      });

      const slot = createEmptySlot();
      renderWithDnd(
        <CriticalSlot 
          slot={slot} 
          location="Left Leg" 
          index={5} 
          onDrop={mockOnDrop}
          onDoubleClick={mockOnDoubleClick}
        />
      );
      
      expect(mockOnDrop).toHaveBeenCalledWith(
        expect.any(Object),
        'Left Leg',
        5
      );
    });

    test('works with different locations', () => {
      const locations = ['Head', 'Center Torso', 'Left Arm', 'Right Leg'];
      
      locations.forEach(location => {
        const slot = createEmptySlot();
        const { unmount } = renderWithDnd(
          <CriticalSlot 
            slot={slot} 
            location={location}
            index={0}
            onDrop={mockOnDrop}
            onDoubleClick={mockOnDoubleClick}
          />
        );
        
        expect(screen.getByText('-Empty-')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles equipment slot without mount gracefully', () => {
      const slot: CriticalSlotType = {
        type: 'EQUIPMENT',
        mount: undefined,
      };
      
      renderWithDnd(
        <CriticalSlot slot={slot} {...defaultProps} />
      );
      
      expect(screen.getByText('-Empty-')).toBeInTheDocument();
    });

    test('handles system slot without system name', () => {
      const slot: CriticalSlotType = {
        type: 'SYSTEM',
        system: undefined,
      };
      
      renderWithDnd(
        <CriticalSlot slot={slot} {...defaultProps} />
      );
      
      expect(screen.getByText('-Empty-')).toBeInTheDocument();
    });

    test('handles unknown slot type gracefully', () => {
      const slot = {
        type: 'UNKNOWN'
      } as any;
      
      renderWithDnd(
        <CriticalSlot slot={slot} {...defaultProps} />
      );
      
      expect(screen.getByText('-Empty-')).toBeInTheDocument();
    });
  });

  describe('Mouse Event Handling', () => {
    test('double click works with fireEvent as well', () => {
      const slot = createEmptySlot();
      renderWithDnd(
        <CriticalSlot slot={slot} {...defaultProps} />
      );
      
      const slotElement = screen.getByText('-Empty-');
      fireEvent.doubleClick(slotElement);
      
      expect(mockOnDoubleClick).toHaveBeenCalledTimes(1);
    });

    test('does not interfere with drop functionality', () => {
      const mockUseDrop = require('react-dnd').useDrop;
      const mockDrop = jest.fn();
      mockUseDrop.mockReturnValue([
        { isOver: false },
        mockDrop
      ]);

      const slot = createEmptySlot();
      renderWithDnd(
        <CriticalSlot slot={slot} {...defaultProps} />
      );
      
      const slotElement = screen.getByText('-Empty-');
      fireEvent.doubleClick(slotElement);
      
      expect(mockOnDoubleClick).toHaveBeenCalled();
      // Drop functionality should still be available
      expect(mockUseDrop).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('slot element is accessible', () => {
      const slot = createEmptySlot();
      const { container } = renderWithDnd(
        <CriticalSlot slot={slot} {...defaultProps} />
      );
      
      const slotElement = container.firstChild as HTMLElement;
      expect(slotElement.tagName).toBe('DIV');
    });

    test('content is readable by screen readers', () => {
      const testCases = [
        { slot: createEmptySlot(), expectedText: '-Empty-' },
        { slot: createSystemSlot('Engine'), expectedText: 'Engine' },
        { slot: createEquipmentSlot(createMockMount({ name: 'PPC' })), expectedText: 'PPC' },
      ];
      
      testCases.forEach(({ slot, expectedText }) => {
        const { unmount } = renderWithDnd(
          <CriticalSlot slot={slot} {...defaultProps} />
        );
        
        expect(screen.getByText(expectedText)).toBeInTheDocument();
        unmount();
      });
    });
  });
});
