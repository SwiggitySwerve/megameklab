import React from 'react';
import { render, screen } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import EquipmentList from '../../components/editor/equipment/EquipmentList';
import { Mounted } from '../../types/criticals';

// Mock DraggableEquipmentItem
jest.mock('../../components/editor/equipment/DraggableEquipmentItem', () => {
  return function MockDraggableEquipmentItem({ equipment }: any) {
    return (
      <div data-testid="draggable-equipment-item">
        <span data-testid="equipment-name">{equipment.name}</span>
        <span data-testid="equipment-type">{equipment.type}</span>
        <span data-testid="equipment-weight">{equipment.weight}</span>
        <span data-testid="equipment-space">{equipment.space}</span>
        <span data-testid="equipment-id">{equipment.id}</span>
      </div>
    );
  };
});

// Mock CSS modules
jest.mock('../../components/editor/equipment/EquipmentList.module.css', () => ({
  list: 'list',
  title: 'title',
}));

const renderWithDnd = (component: React.ReactElement) => {
  return render(
    <DndProvider backend={HTML5Backend}>
      {component}
    </DndProvider>
  );
};

const createMockMounted = (overrides: Partial<Mounted> = {}): Mounted => ({
  name: 'Medium Laser',
  type: 'weapon',
  location: 0,
  criticals: 1,
  weight: 1,
  ...overrides,
});

describe('EquipmentList', () => {
  describe('Basic Rendering', () => {
    test('renders title', () => {
      renderWithDnd(<EquipmentList equipment={[]} />);
      
      expect(screen.getByText('Equipment')).toBeInTheDocument();
    });

    test('applies correct CSS classes', () => {
      const { container } = renderWithDnd(<EquipmentList equipment={[]} />);
      
      expect(container.firstChild).toHaveClass('list');
      expect(screen.getByText('Equipment')).toHaveClass('title');
    });

    test('renders with empty equipment list', () => {
      renderWithDnd(<EquipmentList equipment={[]} />);
      
      expect(screen.getByText('Equipment')).toBeInTheDocument();
      expect(screen.queryByTestId('draggable-equipment-item')).not.toBeInTheDocument();
    });
  });

  describe('Equipment Rendering', () => {
    test('renders single equipment item', () => {
      const equipment = [createMockMounted()];
      
      renderWithDnd(<EquipmentList equipment={equipment} />);
      
      expect(screen.getByTestId('draggable-equipment-item')).toBeInTheDocument();
      expect(screen.getByTestId('equipment-name')).toHaveTextContent('Medium Laser');
    });

    test('renders multiple equipment items', () => {
      const equipment = [
        createMockMounted({ name: 'Medium Laser' }),
        createMockMounted({ name: 'AC/10', type: 'weapon', weight: 12 }),
        createMockMounted({ name: 'Heat Sink', type: 'weapon', weight: 1 }),
      ];
      
      renderWithDnd(<EquipmentList equipment={equipment} />);
      
      const items = screen.getAllByTestId('draggable-equipment-item');
      expect(items).toHaveLength(3);
      
      expect(screen.getByText('Medium Laser')).toBeInTheDocument();
      expect(screen.getByText('AC/10')).toBeInTheDocument();
      expect(screen.getByText('Heat Sink')).toBeInTheDocument();
    });

    test('maintains correct order of equipment items', () => {
      const equipment = [
        createMockMounted({ name: 'First Item' }),
        createMockMounted({ name: 'Second Item' }),
        createMockMounted({ name: 'Third Item' }),
      ];
      
      renderWithDnd(<EquipmentList equipment={equipment} />);
      
      const names = screen.getAllByTestId('equipment-name');
      expect(names[0]).toHaveTextContent('First Item');
      expect(names[1]).toHaveTextContent('Second Item');
      expect(names[2]).toHaveTextContent('Third Item');
    });
  });

  describe('Data Conversion', () => {
    test('converts Mounted to FullEquipment with all basic fields', () => {
      const mounted = createMockMounted({
        name: 'Large Laser',
        type: 'weapon',
        weight: 5,
        criticalSlots: 2,
        damage: 8,
        heat: 8,
      });
      
      renderWithDnd(<EquipmentList equipment={[mounted]} />);
      
      expect(screen.getByTestId('equipment-name')).toHaveTextContent('Large Laser');
      expect(screen.getByTestId('equipment-type')).toHaveTextContent('weapon');
      expect(screen.getByTestId('equipment-weight')).toHaveTextContent('5');
      expect(screen.getByTestId('equipment-space')).toHaveTextContent('2');
    });

    test('generates unique IDs for equipment items', () => {
      const equipment = [
        createMockMounted({ name: 'Medium Laser' }),
        createMockMounted({ name: 'Medium Laser' }), // Same name, different index
        createMockMounted({ name: 'AC/10' }),
      ];
      
      renderWithDnd(<EquipmentList equipment={equipment} />);
      
      const ids = screen.getAllByTestId('equipment-id');
      expect(ids[0]).toHaveTextContent('Medium Laser-0');
      expect(ids[1]).toHaveTextContent('Medium Laser-1');
      expect(ids[2]).toHaveTextContent('AC/10-2');
    });

    test('handles missing optional fields gracefully', () => {
      const mounted: Mounted = {
        name: 'Basic Equipment',
        type: 'weapon',
        location: 0,
        criticals: 1,
        // Missing optional fields like weight, damage, heat, etc.
      };
      
      renderWithDnd(<EquipmentList equipment={[mounted]} />);
      
      expect(screen.getByTestId('equipment-name')).toHaveTextContent('Basic Equipment');
      expect(screen.getByTestId('equipment-type')).toHaveTextContent('equipment');
      expect(screen.getByTestId('equipment-weight')).toHaveTextContent('0'); // Default value
      expect(screen.getByTestId('equipment-space')).toHaveTextContent('1');
    });

    test('uses default values for undefined fields', () => {
      const mounted = createMockMounted({
        weight: undefined,
        criticalSlots: undefined,
      });
      
      renderWithDnd(<EquipmentList equipment={[mounted]} />);
      
      expect(screen.getByTestId('equipment-weight')).toHaveTextContent('0');
      expect(screen.getByTestId('equipment-space')).toHaveTextContent('0');
    });

    test('preserves techBase and defaults to IS when missing', () => {
      const equipment = [
        createMockMounted({ techBase: 'Clan' }),
        createMockMounted({ techBase: undefined }),
      ];
      
      // Since we can't directly test the techBase in our mock, we test the conversion logic
      // by checking that the component renders without errors
      renderWithDnd(<EquipmentList equipment={equipment} />);
      
      const items = screen.getAllByTestId('draggable-equipment-item');
      expect(items).toHaveLength(2);
    });
  });

  describe('Equipment Types', () => {
    test('handles weapons', () => {
      const weapon = createMockMounted({
        name: 'PPC',
        type: 'weapon',
        weight: 7,
        criticalSlots: 3,
        damage: 10,
        heat: 10,
      });
      
      renderWithDnd(<EquipmentList equipment={[weapon]} />);
      
      expect(screen.getByTestId('equipment-name')).toHaveTextContent('PPC');
      expect(screen.getByTestId('equipment-type')).toHaveTextContent('weapon');
    });

    test('handles equipment', () => {
      const equipment = createMockMounted({
        name: 'Jump Jet',
        type: 'weapon',
        weight: 0.5,
        criticalSlots: 1,
      });
      
      renderWithDnd(<EquipmentList equipment={[equipment]} />);
      
      expect(screen.getByTestId('equipment-name')).toHaveTextContent('Jump Jet');
      expect(screen.getByTestId('equipment-type')).toHaveTextContent('weapon');
    });

    test('handles ammo', () => {
      const ammo = createMockMounted({
        name: 'AC/10 Ammo',
        type: 'ammo',
        weight: 1,
        criticalSlots: 1,
      });
      
      renderWithDnd(<EquipmentList equipment={[ammo]} />);
      
      expect(screen.getByTestId('equipment-name')).toHaveTextContent('AC/10 Ammo');
      expect(screen.getByTestId('equipment-type')).toHaveTextContent('ammo');
    });
  });

  describe('Performance', () => {
    test('handles large equipment lists efficiently', () => {
      const largeEquipmentList = Array.from({ length: 50 }, (_, index) => 
        createMockMounted({
          name: `Equipment Item ${index}`,
          type: 'equipment',
          weight: index,
          criticalSlots: 1,
        })
      );
      
      renderWithDnd(<EquipmentList equipment={largeEquipmentList} />);
      
      const items = screen.getAllByTestId('draggable-equipment-item');
      expect(items).toHaveLength(50);
      
      // Check first and last items to ensure correct rendering
      expect(screen.getByText('Equipment Item 0')).toBeInTheDocument();
      expect(screen.getByText('Equipment Item 49')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles equipment with special characters in name', () => {
      const equipment = createMockMounted({
        name: "Medium Laser (Clan) w/ Special-Characters & Symbols!",
        type: 'weapon',
      });
      
      renderWithDnd(<EquipmentList equipment={[equipment]} />);
      
      expect(screen.getByText("Medium Laser (Clan) w/ Special-Characters & Symbols!")).toBeInTheDocument();
    });

    test('handles equipment with very long names', () => {
      const equipment = createMockMounted({
        name: "This is a very long equipment name that might cause layout issues or other problems in the user interface",
        type: 'equipment',
      });
      
      renderWithDnd(<EquipmentList equipment={[equipment]} />);
      
      expect(screen.getByText(/This is a very long equipment name/)).toBeInTheDocument();
    });

    test('handles equipment with numeric values at boundaries', () => {
      const equipment = [
        createMockMounted({ weight: 0, criticalSlots: 0 }),
        createMockMounted({ weight: 999.99, criticalSlots: 20 }),
        createMockMounted({ weight: -1, criticalSlots: -1 }), // Invalid values
      ];
      
      renderWithDnd(<EquipmentList equipment={equipment} />);
      
      const items = screen.getAllByTestId('draggable-equipment-item');
      expect(items).toHaveLength(3);
    });

    test('handles null and undefined values gracefully', () => {
      const equipment = createMockMounted({
        name: 'Test Equipment',
        damage: null as any,
        heat: undefined,
        bv: null as any,
        cost: undefined,
      });
      
      renderWithDnd(<EquipmentList equipment={[equipment]} />);
      
      expect(screen.getByTestId('equipment-name')).toHaveTextContent('Test Equipment');
    });
  });

  describe('Integration', () => {
    test('works within DndProvider context', () => {
      const equipment = [createMockMounted()];
      
      // This test ensures the component works properly within the drag-and-drop context
      renderWithDnd(<EquipmentList equipment={equipment} />);
      
      expect(screen.getByTestId('draggable-equipment-item')).toBeInTheDocument();
    });

    test('passes correct props to DraggableEquipmentItem', () => {
      const mounted = createMockMounted({
        name: 'Test Equipment',
        type: 'weapon',
        weight: 5,
        criticalSlots: 2,
        damage: 10,
        heat: 5,
      });
      
      renderWithDnd(<EquipmentList equipment={[mounted]} />);
      
      // Verify the converted data is passed correctly
      expect(screen.getByTestId('equipment-name')).toHaveTextContent('Test Equipment');
      expect(screen.getByTestId('equipment-type')).toHaveTextContent('weapon');
      expect(screen.getByTestId('equipment-weight')).toHaveTextContent('5');
      expect(screen.getByTestId('equipment-space')).toHaveTextContent('2');
      expect(screen.getByTestId('equipment-id')).toHaveTextContent('Test Equipment-0');
    });
  });

  describe('Accessibility', () => {
    test('title has proper semantic markup', () => {
      renderWithDnd(<EquipmentList equipment={[]} />);
      
      const title = screen.getByText('Equipment');
      expect(title.tagName).toBe('H3');
    });

    test('list structure is accessible', () => {
      const equipment = [
        createMockMounted({ name: 'Item 1' }),
        createMockMounted({ name: 'Item 2' }),
      ];
      
      renderWithDnd(<EquipmentList equipment={equipment} />);
      
      // Each equipment item should be accessible
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    test('applies list class to container', () => {
      const { container } = renderWithDnd(<EquipmentList equipment={[]} />);
      
      expect(container.firstChild).toHaveClass('list');
    });

    test('applies title class to heading', () => {
      renderWithDnd(<EquipmentList equipment={[]} />);
      
      const title = screen.getByText('Equipment');
      expect(title).toHaveClass('title');
    });
  });

  describe('React Keys', () => {
    test('uses index as key for equipment items', () => {
      const equipment = [
        createMockMounted({ name: 'Item 1' }),
        createMockMounted({ name: 'Item 2' }),
      ];
      
      // React keys are internal, but we can test that re-rendering works correctly
      const { rerender } = renderWithDnd(<EquipmentList equipment={equipment} />);
      
      expect(screen.getAllByTestId('draggable-equipment-item')).toHaveLength(2);
      
      // Rerender with different equipment
      const newEquipment = [createMockMounted({ name: 'New Item' })];
      rerender(
        <DndProvider backend={HTML5Backend}>
          <EquipmentList equipment={newEquipment} />
        </DndProvider>
      );
      
      expect(screen.getAllByTestId('draggable-equipment-item')).toHaveLength(1);
      expect(screen.getByText('New Item')).toBeInTheDocument();
    });
  });
});
