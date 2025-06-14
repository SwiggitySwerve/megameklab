import React from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const DragItem = ({ name }: { name: string }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'test-item',
    item: { name },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as any}
      style={{
        opacity: isDragging ? 0.5 : 1,
        padding: '8px',
        margin: '4px',
        backgroundColor: '#3b82f6',
        color: 'white',
        cursor: 'move',
        borderRadius: '4px',
      }}
    >
      {name}
    </div>
  );
};

const DropZone = ({ onDrop }: { onDrop: (item: any) => void }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'test-item',
    drop: (item) => {
      console.log('Dropped:', item);
      onDrop(item);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  return (
    <div
      ref={drop as any}
      style={{
        width: '200px',
        height: '100px',
        margin: '8px',
        padding: '8px',
        border: '2px dashed #ccc',
        borderRadius: '4px',
        backgroundColor: isOver ? '#e0f2fe' : canDrop ? '#f0f9ff' : '#f3f4f6',
      }}
    >
      Drop here
      {isOver && <div>Release to drop!</div>}
    </div>
  );
};

const TestSimpleDnd = () => {
  const [droppedItems, setDroppedItems] = React.useState<string[]>([]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ padding: '20px' }}>
        <h1>Simple Drag and Drop Test</h1>
        
        <div style={{ display: 'flex', gap: '20px' }}>
          <div>
            <h2>Drag these:</h2>
            <DragItem name="Item 1" />
            <DragItem name="Item 2" />
            <DragItem name="Item 3" />
          </div>
          
          <div>
            <h2>Drop here:</h2>
            <DropZone onDrop={(item) => setDroppedItems([...droppedItems, item.name])} />
            
            <h3>Dropped items:</h3>
            <ul>
              {droppedItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default TestSimpleDnd;
