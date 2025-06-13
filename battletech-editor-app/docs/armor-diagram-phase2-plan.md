# Armor Diagram Phase 2 Implementation Plan - Dual-Mode Architecture

## Phase 2 Goals
Refactor the armor diagram system to support both read-only viewing (compendium, unit displays) and full editing capabilities (unit editor) through a unified component architecture.

## Key Objectives
1. Create a unified ArmorManagementComponent with dual-mode operation
2. Extract shared logic into reusable hooks
3. Optimize read-only mode for performance
4. Enhance edit mode with complete functionality
5. Establish clear integration patterns

## Implementation Tasks

### 1. Component Refactoring

#### Create Unified ArmorManagementComponent
```typescript
interface ArmorManagementComponentProps {
  // Required
  unit: EditableUnit | Unit;
  readOnly: boolean;
  
  // Edit mode only
  onUnitChange?: (updates: Partial<EditableUnit>) => void;
  validationErrors?: ValidationError[];
  
  // Optional
  className?: string;
  showStatistics?: boolean;
  compactMode?: boolean;
  highlightChanges?: boolean;
}
```

#### Extract Shared Logic into Hooks
- `useArmorCalculations`: Armor point calculations, max values
- `useArmorValidation`: Validation logic and error handling
- `useArmorVisualization`: Color coding, coverage percentages
- `useArmorInteractions`: Event handling, drag/click logic

### 2. Read-Only Optimization

#### Features for Read-Only Mode
- Static armor display with hover tooltips
- Click to show detailed breakdown
- Mobile-friendly tap interactions
- "Open in Unit Editor" button integration
- Minimal bundle size (no editing code)

#### Performance Optimizations
- Remove event listeners for editing
- Simplify state management
- Use React.memo for static renders
- Lazy load statistics if needed

### 3. Edit Mode Enhancement

#### Consolidated Features
- All Phase 1 functionality
- Local state management for changes
- Change detection and dirty state
- Save/cancel workflow
- Real-time validation feedback

#### State Management
```typescript
interface ArmorEditState {
  localValues: ArmorAllocation;
  isDirty: boolean;
  validationErrors: ValidationError[];
  selectedLocation: string | null;
  hoveredLocation: string | null;
}
```

### 4. Integration Strategy

#### Compendium Integration
```typescript
// components/compendium/UnitArmorDisplay.tsx
<ArmorManagementComponent
  unit={unit}
  readOnly={true}
  compactMode={true}
  className="compendium-armor"
/>
```

#### Unit Editor Integration
```typescript
// Current StructureArmorTab becomes:
<ArmorManagementComponent
  unit={editableUnit}
  readOnly={false}
  onUnitChange={handleArmorChange}
  validationErrors={armorErrors}
  showStatistics={true}
/>
```

## File Structure

```
components/armor/
├── ArmorManagementComponent.tsx    # Main dual-mode component
├── hooks/
│   ├── useArmorCalculations.ts    # Shared calculation logic
│   ├── useArmorValidation.ts      # Validation logic
│   ├── useArmorVisualization.ts   # Visual state logic
│   └── useArmorInteractions.ts    # Interaction handlers
├── components/
│   ├── ArmorDiagram.tsx           # SVG visualization (both modes)
│   ├── ArmorLocationDisplay.tsx   # Individual location (read-only)
│   ├── ArmorLocationEditor.tsx    # Individual location (edit)
│   ├── ArmorStatistics.tsx       # Statistics panel
│   ├── ArmorControls.tsx          # Edit controls panel
│   └── ArmorPresets.tsx           # Preset selector
└── types/
    └── armor.ts                   # Armor-specific types
```

## Implementation Steps

### Step 1: Create Custom Hooks (Day 1-2)
1. Extract calculation logic from existing components
2. Create useArmorCalculations hook
3. Create useArmorValidation hook
4. Create useArmorVisualization hook
5. Test hooks independently

### Step 2: Build Unified Component (Day 3-4)
1. Create ArmorManagementComponent shell
2. Implement mode switching logic
3. Integrate custom hooks
4. Add prop-based configuration

### Step 3: Implement Read-Only Mode (Day 5-6)
1. Create ArmorLocationDisplay component
2. Optimize for static rendering
3. Add hover/click interactions
4. Implement mobile touch support
5. Add "Open in Editor" integration

### Step 4: Enhance Edit Mode (Day 7-8)
1. Port all Phase 1 functionality
2. Create ArmorLocationEditor component
3. Implement local state management
4. Add save/cancel workflow
5. Integrate validation feedback

### Step 5: Integration & Testing (Day 9-10)
1. Create demo pages for both modes
2. Replace existing armor displays
3. Update unit editor integration
4. Comprehensive testing
5. Performance profiling

## Success Criteria

### Technical Criteria
- Single component serves both modes
- < 50KB bundle size for read-only mode
- No performance regression
- 100% feature parity with Phase 1

### User Experience Criteria
- Seamless mode switching
- Consistent visual appearance
- Intuitive interactions in both modes
- Mobile-responsive design

### Code Quality Criteria
- 90%+ test coverage
- TypeScript strict mode compliance
- No prop drilling
- Clear separation of concerns

## Risk Mitigation

### Complexity Risk
- **Risk**: Over-engineering the dual-mode system
- **Mitigation**: Start simple, iterate based on needs

### Performance Risk
- **Risk**: Edit mode code affecting read-only performance
- **Mitigation**: Proper code splitting, lazy loading

### Integration Risk
- **Risk**: Breaking existing functionality
- **Mitigation**: Feature flags, gradual rollout

## Deliverables

1. **ArmorManagementComponent**: Unified dual-mode component
2. **Custom Hooks Suite**: Reusable armor logic
3. **Integration Examples**: Demo pages for both modes
4. **Migration Guide**: How to replace existing components
5. **Performance Report**: Bundle size and render metrics

## Next Steps

After Phase 2 completion:
- Phase 3: Advanced features (smart allocation, keyboard shortcuts)
- Phase 4: Full system integration and polish
