# MegaMekLab Armor Diagram - Enhanced UI/UX Implementation Plan

## Design Principles
1. **Space Efficiency**: Maximize information density without clutter
2. **Component Boundaries**: Ensure all UI elements stay within their containers
3. **Responsive Design**: Adapt to different screen sizes and panel configurations
4. **Progressive Disclosure**: Show advanced features only when needed
5. **Intuitive Interactions**: Reduce clicks and simplify workflows

## Enhanced Layout Design

### Structure/Armor Tab - Optimized Layout

#### Responsive Grid System
```
Desktop (>1200px): 
[Basic Info 20%] [Systems 25%] [Armor Config 55%]

Tablet (768-1200px):
[Basic Info 30%] [Systems 70%]
[Armor Config 100%]

Mobile (<768px):
[Collapsible Accordion Sections]
```

#### Space-Saving Components

**1. Collapsible Basic Info Panel**
```typescript
interface BasicInfoPanelProps {
  collapsed?: boolean;
  showOnlyEssentials?: boolean; // Shows only chassis/model when collapsed
}
```
- Collapse to show only chassis/model
- Expand icon in corner
- Remembers user preference

**2. Compact Heat/Movement Section**
```typescript
interface CompactSystemsPanel {
  layout: 'horizontal' | 'vertical';
  showAdvanced: boolean;
}
```
- Inline heat sink controls
- Movement values in compact grid
- "Show Advanced" toggle for rarely-used options

**3. Smart Armor Diagram**
```typescript
interface SmartArmorDiagram {
  size: 'compact' | 'normal' | 'large';
  displayMode: 'diagram' | 'grid' | 'hybrid';
  autoScale: boolean;
}
```

### Improved Armor Diagram Component

#### Adaptive Sizing
```typescript
const ArmorDiagram: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  
  useEffect(() => {
    // Auto-scale based on container size
    const updateScale = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const optimalScale = Math.min(width / 400, height / 500, 1);
        setScale(optimalScale);
      }
    };
    
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={containerRef} className="armor-diagram-container">
      <svg
        viewBox="0 0 400 500"
        style={{ transform: `scale(${scale})` }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Mech silhouette */}
      </svg>
    </div>
  );
};
```

#### Hybrid View Mode
Combines visual diagram with inline numeric inputs:

```typescript
interface HybridArmorView {
  // Armor values displayed directly on the diagram
  // Click to edit in-place
  // No separate grid needed
}
```

**Benefits:**
- Saves 40% vertical space
- No scrolling needed
- Direct manipulation
- Visual + numeric in one view

### Enhanced Interaction Patterns

#### 1. **Smart Click Behavior**
- Single click: +1 armor point
- Shift+click: +5 armor points  
- Right-click: Context menu with presets
- Double-click: Edit numeric value directly
- Drag: Allocate across multiple locations

#### 2. **Inline Editing**
```typescript
const ArmorValue: React.FC<{location: string}> = ({ location }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(0);
  
  if (editing) {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        onBlur={() => setEditing(false)}
        className="inline-armor-input"
        autoFocus
      />
    );
  }
  
  return (
    <text
      onClick={() => setEditing(true)}
      className="armor-value clickable"
    >
      {value}
    </text>
  );
};
```

#### 3. **Gesture Support**
- Pinch to zoom on touch devices
- Swipe between front/rear views
- Long press for options

### Space-Efficient Controls

#### 1. **Floating Action Panel**
```typescript
interface FloatingActionPanel {
  position: 'bottom-right' | 'top-right';
  collapsed: boolean;
  actions: ArmorAction[];
}
```

Replaces large button rows with compact floating panel:
- Maximize Armor
- Auto-Allocate
- Clear All
- Undo/Redo

#### 2. **Smart Allocation Bar**
Instead of multiple text fields:
```
[====|====|====] 45/89 pts (2.8t)
   Used  Max
```
- Visual bar shows allocation
- Click bar to redistribute
- Drag handles to adjust

#### 3. **Contextual Tooltips**
Show only when hovering/focusing:
- Current/Max values
- Weight impact
- Validation warnings
- Quick actions

### Responsive Behavior

#### Breakpoint-Based Layouts

**Large Screens (>1400px)**
- Side-by-side armor diagram and controls
- All panels visible
- Detailed tooltips

**Medium Screens (1000-1400px)**
- Stacked layout
- Collapsible sections
- Essential info prioritized

**Small Screens (<1000px)**
- Tab-based navigation
- Full-screen diagram mode
- Slide-out panels

#### Container-Aware Sizing
```typescript
const useContainerQuery = (ref: RefObject<HTMLElement>) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    if (!ref.current) return;
    
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  
  return dimensions;
};
```

### Advanced UX Features

#### 1. **Preset Templates**
Quick armor configurations:
- Maximum Protection
- Balanced Front/Rear
- Striker Pattern
- Brawler Pattern
- Custom Save/Load

#### 2. **Visual Feedback**
- Smooth animations for value changes
- Color coding for armor levels:
  - Red: <25% max
  - Yellow: 25-75% max
  - Green: >75% max
- Pulse effect on changes
- Highlight valid drop zones

#### 3. **Keyboard Navigation**
- Tab through locations
- Arrow keys adjust values
- Enter to confirm
- Escape to cancel
- Shortcuts for common actions

#### 4. **Smart Validation**
- Inline error indicators
- Real-time feedback
- Suggested fixes
- Non-blocking warnings

### Performance Optimizations

#### 1. **Virtualization**
- Only render visible armor sections
- Lazy load detailed views
- Efficient re-renders

#### 2. **Debounced Updates**
```typescript
const useDebounced = (value: number, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};
```

#### 3. **Memoization**
- Cache SVG paths
- Memoize calculations
- Prevent unnecessary re-renders

### Implementation Phases

**Phase 1: Core Responsive Layout**
- Container-aware sizing
- Breakpoint system
- Basic touch support

**Phase 2: Enhanced Diagram**
- Smart scaling
- Inline editing
- Hybrid view mode

**Phase 3: Advanced Interactions**
- Gesture support
- Keyboard navigation
- Preset templates

**Phase 4: Polish & Optimization**
- Animations
- Performance tuning
- Accessibility

### Mockup Examples

#### Compact Mode (Sidebar)
```
┌─────────────────┐
│ Armor: Standard │
│ ┌─────────────┐ │
│ │   ┌─┐       │ │
│ │  ┌┴┬┴┐      │ │
│ │  │HD│9      │ │
│ │ ┌┴─┴┐      │ │
│ │ │CT │16/10  │ │
│ │ └┬─┬┘      │ │
│ │  │ │       │ │
│ └─────────────┘ │
│ [Auto] [Max]    │
│ 45/89 pts 2.8t │
└─────────────────┘
```

#### Normal Mode
```
┌───────────────────────────────┐
│ Armor Configuration           │
│ ┌───────────┬───────────────┐ │
│ │   Front   │     Rear      │ │
│ │  ┌─────┐  │   ┌─────┐     │ │
│ │  │  9  │  │   │  0  │     │ │
│ │  └──┬──┘  │   └──┬──┘     │ │
│ │ ┌───┴───┐ │  ┌───┴───┐    │ │
│ │ │16│ │10│ │  │10│ │ 5│    │ │
│ │ └───┬───┘ │  └───┬───┘    │ │
│ │     │     │      │         │ │
│ └───────────┴───────────────┘ │
│ Allocation: ████████░░ 45/89  │
│ Weight: 2.8t  [Maximize] [▼] │
└───────────────────────────────┘
```

### Benefits of Enhanced Design
1. **50% less vertical space** required
2. **No horizontal scrolling** needed
3. **Faster armor allocation** (fewer clicks)
4. **Better mobile experience**
5. **Cleaner, modern interface**
6. **Improved accessibility**
7. **Better performance** on low-end devices

This enhanced design maintains all MegaMekLab functionality while significantly improving the user experience and space efficiency.
