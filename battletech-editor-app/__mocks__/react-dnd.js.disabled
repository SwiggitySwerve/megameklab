// Mock implementation of react-dnd
const reactDnd = {
  useDrag: jest.fn(() => [
    { isDragging: false },
    jest.fn(),
    { type: 'mockType' }
  ]),
  useDrop: jest.fn(() => [
    { isOver: false, canDrop: true, draggedItem: null },
    jest.fn(),
  ]),
  DndProvider: function DndProvider({ children }) { return children; },
  // Add useDragLayer mock
  useDragLayer: jest.fn(() => ({
    isDragging: false,
    item: null,
    itemType: null,
    initialOffset: { x: 0, y: 0 },
    currentOffset: { x: 0, y: 0 },
    differenceFromInitialOffset: { x: 0, y: 0 },
    clientOffset: { x: 0, y: 0 }
  })),
  // Add usePreview mock
  usePreview: jest.fn(() => ({
    display: false,
    item: null,
    style: {},
    ref: { current: null }
  })),
};

module.exports = reactDnd;
