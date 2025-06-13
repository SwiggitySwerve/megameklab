# MegaMekLab Implementation: Next Steps

## Overview
With the comprehensive analysis complete, here's a practical roadmap for implementing the BattleMech editor in React.

## Immediate Next Steps (Week 1-2)

### 1. Set Up Core Infrastructure
```bash
# Already have basic React setup, now need:
npm install --save react-dnd react-dnd-html5-backend
npm install --save @reduxjs/toolkit react-redux
npm install --save react-hook-form yup
npm install --save @mui/material @emotion/react @emotion/styled
```

### 2. Create Base Data Types
```typescript
// types/editor.ts - Extend existing types
interface EditableUnit {
  // ... existing fields
  fluff?: UnitFluff;
  quirks?: UnitQuirks;
  criticalAllocations?: CriticalAllocation[];
}

interface ArmorAllocation {
  location: string;
  front: number;
  rear?: number;
  armorType?: string; // For patchwork
}

interface CriticalAllocation {
  location: string;
  slot: number;
  equipmentId: string;
}
```

### 3. Implement State Management
```typescript
// store/editorSlice.ts
const editorSlice = createSlice({
  name: 'editor',
  initialState: {
    unit: null as EditableUnit | null,
    isDirty: false,
    validationErrors: [],
    history: [],
    currentHistoryIndex: -1,
  },
  reducers: {
    setUnit,
    updateArmor,
    addEquipment,
    removeEquipment,
    allocateCritical,
    deallocateCritical,
    updateFluff,
    toggleQuirk,
    undo,
    redo,
  }
});
```

## Phase 1: Core Components (Week 3-4)

### 1. Basic Armor Location Control
Start with the simplest component:

```typescript
// components/editor/armor/ArmorLocationControl.tsx
const ArmorLocationControl: React.FC<ArmorLocationControlProps> = ({
  location,
  maxArmor,
  currentFront,
  currentRear,
  hasRear,
  onChange
}) => {
  // Simple number inputs with increment/decrement
  // Validation to prevent exceeding max
  // Real-time updates
};
```

### 2. Armor Statistics Panel
Show allocation feedback:

```typescript
// components/editor/armor/ArmorStatisticsPanel.tsx
const ArmorStatisticsPanel: React.FC = () => {
  // Display unallocated, allocated, total, max, wasted
  // Color coding for issues
  // Points per ton calculation
};
```

### 3. Equipment List Components
Basic equipment display:

```typescript
// components/editor/equipment/EquipmentListItem.tsx
const EquipmentListItem: React.FC<{equipment: FullEquipment}> = ({
  equipment
}) => {
  // Display name, tonnage, crits
  // Drag handle for DnD
  // Remove button
};
```

## Phase 2: Layout Implementation (Week 5-6)

### 1. Mech Armor Diagram Layout
Implement the anatomical layout:

```typescript
// components/editor/armor/MechArmorDiagram.tsx
const MECH_LAYOUT = {
  HEAD: { row: 0, col: 2 },
  LEFT_ARM: { row: 1, col: 0 },
  LEFT_TORSO: { row: 1, col: 1 },
  CENTER_TORSO: { row: 1, col: 2 },
  RIGHT_TORSO: { row: 1, col: 3 },
  RIGHT_ARM: { row: 1, col: 4 },
  LEFT_LEG: { row: 2, col: 1 },
  CENTER_LEG: { row: 2, col: 2 }, // Tripod only
  RIGHT_LEG: { row: 2, col: 3 }
};
```

### 2. Critical Slots Diagram
Similar layout for criticals:

```typescript
// components/editor/criticals/CriticalSlotDiagram.tsx
const CriticalSlotDiagram: React.FC = () => {
  // Use same layout as armor
  // Add drop zones for each slot
  // Show existing allocations
};
```

## Phase 3: Drag & Drop (Week 7-8)

### 1. Set Up React DnD
```typescript
// App.tsx or parent component
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

<DndProvider backend={HTML5Backend}>
  <EditorTabs />
</DndProvider>
```

### 2. Implement Draggable Equipment
```typescript
// components/editor/equipment/DraggableEquipment.tsx
const DraggableEquipment: React.FC = ({ equipment }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'equipment',
    item: { id: equipment.id, equipment },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  return <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
    {equipment.name}
  </div>;
};
```

### 3. Implement Drop Zones
```typescript
// components/editor/criticals/CriticalSlot.tsx
const CriticalSlot: React.FC = ({ location, slotIndex }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'equipment',
    canDrop: (item) => validateDrop(item, location, slotIndex),
    drop: (item) => handleDrop(item, location, slotIndex),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });
  
  return <div ref={drop} className={getSlotClassName(isOver, canDrop)}>
    {/* Slot content */}
  </div>;
};
```

## Phase 4: Auto-Allocation Features (Week 9-10)

### 1. Port Auto-Allocation Algorithm
```typescript
// utils/armorAutoAllocation.ts
export const autoAllocateArmor = (
  unit: EditableUnit,
  totalPoints: number,
  options: AutoAllocationOptions
): ArmorAllocation[] => {
  // Port the MegaMekLab algorithm
  // Head gets 5x percentage (max 9/12)
  // Torsos: 75% front, 25% rear
  // Distribute by internal structure
};
```

### 2. Equipment Auto-Fill
```typescript
// utils/criticalAutoAllocation.ts
export const autoFillCriticals = (
  unit: EditableUnit,
  options: { fillUnhittables: boolean }
): CriticalAllocation[] => {
  // Prioritize unhittable equipment
  // Spread equipment like Endo Steel
  // Balance weight distribution
};
```

## Phase 5: Additional Features (Week 11-12)

### 1. Fluff Editor
- Rich text editor with markdown
- Image upload and management
- System components table

### 2. Quirks Manager
- Responsive checkbox grid
- Validation for disallowed quirks
- Per-weapon quirk support

### 3. Save/Load System
- Export to MegaMekLab format
- Import existing units
- Local storage for drafts

## Testing Strategy

### 1. Unit Tests (Ongoing)
```typescript
// __tests__/utils/armorCalculations.test.ts
describe('Armor Calculations', () => {
  test('calculates points per ton correctly', () => {
    expect(getArmorPointsPerTon('Standard', 'IS')).toBe(16);
    expect(getArmorPointsPerTon('Ferro-Fibrous', 'IS')).toBe(17.92);
  });
});
```

### 2. Component Tests
```typescript
// __tests__/components/ArmorLocationControl.test.tsx
describe('ArmorLocationControl', () => {
  test('prevents exceeding max armor', () => {
    // Test validation
  });
  
  test('handles front/rear balance', () => {
    // Test torso locations
  });
});
```

### 3. Integration Tests
- Full armor allocation flow
- Equipment to critical assignment
- Save/load cycle

## Demo Pages to Create

### 1. Armor Demo Page
```typescript
// pages/armor-demo.tsx
const ArmorDemoPage = () => {
  return (
    <DemoLayout>
      <MechArmorDiagram unit={sampleMech} />
      <ArmorStatisticsPanel unit={sampleMech} />
    </DemoLayout>
  );
};
```

### 2. Equipment Demo Page
```typescript
// pages/equipment-demo.tsx
const EquipmentDemoPage = () => {
  return (
    <DemoLayout>
      <EquipmentDatabase />
      <CurrentLoadout />
    </DemoLayout>
  );
};
```

### 3. Full Editor Demo
```typescript
// pages/editor-demo.tsx
const EditorDemoPage = () => {
  return (
    <EditorProvider>
      <EditorTabs />
    </EditorProvider>
  );
};
```

## Success Metrics

### 1. Functionality
- [ ] Can allocate armor to all locations
- [ ] Can add/remove equipment
- [ ] Can assign equipment to critical slots
- [ ] Can save/load units
- [ ] Validates construction rules

### 2. Performance
- [ ] Loads in < 2 seconds
- [ ] No lag during drag operations
- [ ] Smooth animations
- [ ] Responsive on mobile

### 3. User Experience
- [ ] Intuitive without documentation
- [ ] Clear error messages
- [ ] Helpful tooltips
- [ ] Keyboard accessible

## Resources Needed

### 1. Design Assets
- SVG mech silhouettes
- Equipment icons
- UI mockups

### 2. Data Files
- Complete equipment database
- Quirks definitions
- Validation rules

### 3. Documentation
- API documentation
- Component storybook
- User guide

## Getting Started

1. **Today**: Set up Redux store and base types
2. **Tomorrow**: Create first ArmorLocationControl component
3. **This Week**: Get basic armor allocation working
4. **Next Week**: Add equipment management
5. **Month 1**: Complete MVP with all core features

The key is to start small, test thoroughly, and iterate quickly. Each component should be functional and tested before moving to the next.
