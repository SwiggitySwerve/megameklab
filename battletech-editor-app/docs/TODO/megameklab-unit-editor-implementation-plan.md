# MegaMekLab Unit Editor Implementation Plan

## Overview
This document outlines the complete implementation plan for creating a MegaMekLab-compatible unit editor with condensed, space-efficient UI components that maintain full functionality while providing modern UX improvements.

## Project Structure

### Core Components Directory Structure
```
components/
├── editor/
│   ├── UnitEditor.tsx                 # Main tabbed editor container
│   ├── tabs/
│   │   ├── StructureArmorTab.tsx      # Tab 1: Structure/Armor
│   │   ├── EquipmentTab.tsx           # Tab 2: Equipment Database
│   │   ├── CriticalsTab.tsx           # Tab 3: Critical Slot Assignment
│   │   ├── FluffTab.tsx               # Tab 4: Narrative Content
│   │   ├── QuirksTab.tsx              # Tab 5: Special Abilities
│   │   └── PreviewTab.tsx             # Tab 6: Record Sheet Preview
│   ├── armor/
│   │   ├── ArmorAllocationPanel.tsx   # Interactive armor diagram
│   │   ├── ArmorLocationControl.tsx   # Individual location controls
│   │   ├── ArmorStatisticsPanel.tsx   # Summary statistics
│   │   └── ArmorConfigPanel.tsx       # Type/tonnage controls
│   ├── equipment/
│   │   ├── EquipmentDatabase.tsx      # Searchable equipment list
│   │   ├── EquipmentFilters.tsx       # Category/type filters
│   │   └── EquipmentDragDrop.tsx      # Drag-and-drop functionality
│   ├── criticals/
│   │   ├── CriticalSlotGrid.tsx       # Visual slot assignment
│   │   ├── LocationPanel.tsx          # Individual location slots
│   │   └── CriticalValidation.tsx     # Real-time validation
│   └── shared/
│       ├── EditableValue.tsx          # Inline editing component
│       ├── ValidationIndicator.tsx    # Visual validation feedback
│       └── CompactPanel.tsx           # Reusable panel component
```

## Implementation Phases

### Phase 1: Foundation & Structure/Armor Tab (Priority 1)
**Duration**: 2-3 days
**Components**: 
- Main UnitEditor container with tab system
- StructureArmorTab with 3-column layout
- ArmorAllocationPanel with interactive diagram
- Basic unit data management

**Key Features**:
- Tab navigation system
- Condensed armor allocation interface (344px × 320px)
- Real-time armor point calculation
- Interactive mech silhouette with hover/click
- Auto-allocation algorithm matching MegaMekLab

**Acceptance Criteria**:
- ✅ Armor points can be allocated per location
- ✅ Front/rear armor support for torso locations
- ✅ Real-time validation (max armor per location)
- ✅ Auto-allocate function distributes armor intelligently
- ✅ Statistics panel shows unallocated/allocated/wasted points

### Phase 2: Equipment Tab (Priority 2)
**Duration**: 2-3 days
**Components**:
- EquipmentDatabase with filterable lists
- Equipment category filters
- Unallocated equipment panel
- Basic drag-and-drop functionality

**Key Features**:
- Searchable equipment database
- Category filtering (Energy, Ballistic, Missile, etc.)
- Equipment cards with stats (damage, heat, weight, criticals)
- Drag-and-drop equipment assignment
- Real-time weight/critical tracking

**Acceptance Criteria**:
- ✅ Equipment can be filtered by category and searched
- ✅ Equipment shows relevant stats (damage, heat, weight, criticals)
- ✅ Drag-and-drop works from database to locations
- ✅ Weight and critical slot validation
- ✅ Unallocated equipment list updates dynamically

### Phase 3: Critical Slots Tab (Priority 2)
**Duration**: 2-3 days
**Components**:
- CriticalSlotGrid visual editor
- LocationPanel for each mech location
- System critical placement (engine, gyro, cockpit)
- Advanced drag-and-drop with validation

**Key Features**:
- Visual critical slot editor (12 slots per location max)
- Fixed system critical display (engine, gyro, etc.)
- Equipment slot assignment with validation
- Multi-slot equipment handling
- Real-time slot availability checking

**Acceptance Criteria**:
- ✅ All mech locations show correct number of critical slots
- ✅ System criticals are properly placed and immutable
- ✅ Equipment can be dragged between slots/locations
- ✅ Multi-slot equipment spans correctly
- ✅ Invalid placements are prevented with visual feedback

### Phase 4: Preview Tab (Priority 3)
**Duration**: 1-2 days
**Components**:
- PreviewTab with record sheet generation
- Print-ready formatting
- Export functionality (PDF, image)
- Unit validation system

**Key Features**:
- Live preview of complete unit record sheet
- Print-optimized layout
- Export to multiple formats
- Comprehensive unit validation
- Battle Value calculation

**Acceptance Criteria**:
- ✅ Complete unit data displays in record sheet format
- ✅ Armor diagram shows current allocation
- ✅ Equipment list with locations shown
- ✅ Critical hit tables populated
- ✅ Unit validation shows all issues

### Phase 5: Fluff & Quirks Tabs (Priority 4)
**Duration**: 1-2 days
**Components**:
- FluffTab with rich text editing
- QuirksTab with categorized selections
- Auto-save functionality
- Export capabilities

**Key Features**:
- Rich text editor for unit descriptions
- Predefined fluff categories (Overview, Capabilities, etc.)
- Categorized quirk selection system
- Point cost tracking for quirks
- Auto-save during editing

**Acceptance Criteria**:
- ✅ Text can be entered and formatted in fluff fields
- ✅ Quirks can be selected with point cost tracking
- ✅ Incompatible quirks are prevented
- ✅ Content auto-saves during editing
- ✅ Fluff exports with unit data

## Technical Implementation Details

### State Management Architecture
```typescript
interface UnitEditorState {
  unit: EditableUnit;
  activeTab: EditorTab;
  validationErrors: ValidationError[];
  isDirty: boolean;
  autoSave: boolean;
}

interface EditableUnit extends Unit {
  armorAllocation: LocationArmor[];
  equipmentPlacements: EquipmentPlacement[];
  criticalSlots: CriticalSlotAssignment[];
  fluffData: FluffContent;
  selectedQuirks: Quirk[];
}
```

### Component Props Patterns
```typescript
// Consistent props for all editor components
interface EditorComponentProps {
  unit: EditableUnit;
  onUnitChange: (updates: Partial<EditableUnit>) => void;
  validationErrors?: ValidationError[];
  readOnly?: boolean;
  compact?: boolean;
}
```

### Validation System
```typescript
interface ValidationRule {
  name: string;
  category: 'warning' | 'error';
  validator: (unit: EditableUnit) => boolean;
  message: string;
}

// Example validation rules
const VALIDATION_RULES: ValidationRule[] = [
  {
    name: 'armorOverAllocation',
    category: 'error',
    validator: (unit) => !hasArmorOverAllocation(unit),
    message: 'Armor points exceed maximum for location'
  },
  {
    name: 'weightOverLimit',
    category: 'error', 
    validator: (unit) => getTotalWeight(unit) <= unit.tonnage,
    message: 'Unit weight exceeds tonnage limit'
  }
];
```

## Design Specifications

### Color Scheme & Theming
```css
:root {
  /* Primary Colors */
  --editor-primary: #2563eb;
  --editor-primary-hover: #1d4ed8;
  
  /* Status Colors */
  --validation-error: #dc2626;
  --validation-warning: #d97706;
  --validation-success: #059669;
  
  /* Layout Colors */
  --panel-bg: #f9fafb;
  --panel-border: #e5e7eb;
  --panel-hover: #f3f4f6;
  
  /* Dark Mode Variants */
  --dark-panel-bg: #111827;
  --dark-panel-border: #374151;
  --dark-panel-hover: #1f2937;
}
```

### Responsive Design Breakpoints
```css
/* Minimum supported width: 800px */
@media (min-width: 800px) and (max-width: 1024px) {
  .unit-editor {
    --panel-padding: 8px;
    --font-size-base: 12px;
  }
}

@media (min-width: 1024px) {
  .unit-editor {
    --panel-padding: 12px;
    --font-size-base: 14px;
  }
}
```

### Compact Layout Guidelines
- **Maximum component width**: 400px per panel
- **Minimum interactive target**: 24px × 24px
- **Standard spacing unit**: 8px
- **Panel padding**: 12px
- **Border radius**: 6px

## Integration Points

### Equipment Database Integration
```typescript
interface EquipmentIntegration {
  // Connect to existing equipment data
  getAvailableEquipment: (filters: EquipmentFilters) => Promise<Equipment[]>;
  validateEquipmentPlacement: (equipment: Equipment, location: string) => ValidationResult;
  calculateEquipmentWeight: (placements: EquipmentPlacement[]) => number;
}
```

### Unit Data Model Extensions
```typescript
// Extend existing Unit interface for editor functionality
interface EditableUnit extends Unit {
  // Armor allocation per location
  armorAllocation: {
    [location: string]: {
      front: number;
      rear?: number;
      type: ArmorType;
    };
  };
  
  // Equipment placements
  equipmentPlacements: {
    id: string;
    equipment: Equipment;
    location: string;
    criticalSlots: number[];
  }[];
  
  // Validation state
  validationState: {
    errors: ValidationError[];
    warnings: ValidationError[];
    isValid: boolean;
  };
}
```

## Testing Strategy

### Unit Tests
- Component rendering with various props
- State management and updates
- Validation rule execution
- Calculation functions (armor, weight, BV)

### Integration Tests  
- Tab navigation and state persistence
- Drag-and-drop functionality
- Equipment placement validation
- Auto-allocation algorithms

### E2E Tests
- Complete unit creation workflow
- Import/export functionality
- Print preview generation
- Multi-tab editing session

## Performance Considerations

### Optimization Strategies
- **Memoization**: Heavy calculations (BV, validation) cached
- **Virtual scrolling**: Equipment database for large lists
- **Debounced updates**: Real-time validation with 300ms delay
- **Code splitting**: Tab components loaded on demand

### Bundle Size Targets
- **Core editor**: < 150KB gzipped
- **Per tab**: < 50KB gzipped
- **Total**: < 400KB gzipped

## Accessibility Features

### WCAG 2.1 AA Compliance
- **Keyboard navigation**: All interactive elements accessible via keyboard
- **Screen reader support**: Proper ARIA labels and roles
- **Color contrast**: 4.5:1 minimum contrast ratio
- **Focus management**: Visible focus indicators throughout

### Specific Accessibility Implementations
- Tab navigation with arrow keys
- Equipment drag-and-drop with keyboard alternatives
- Armor value editing with screen reader announcements
- Validation errors read by assistive technology

## Deployment & Migration

### Rollout Strategy
1. **Phase 1**: Deploy as feature flag for testing
2. **Phase 2**: Limited beta with power users
3. **Phase 3**: Gradual rollout to all users
4. **Phase 4**: Replace existing unit detail components

### Migration Considerations
- Backward compatibility with existing unit data
- Import functionality for MegaMekLab .mtf files
- Export compatibility for existing workflows
- User preference migration

## Success Metrics

### Functional Metrics
- ✅ 100% feature parity with MegaMekLab structure/armor tab
- ✅ < 500ms response time for all interactions
- ✅ Zero data loss during editing sessions
- ✅ 95% test coverage for core functionality

### User Experience Metrics
- ✅ 40% reduction in screen space usage vs. MegaMekLab
- ✅ 90% user satisfaction in usability testing
- ✅ < 5 seconds to complete common tasks
- ✅ Accessible to screen reader users

## Risk Mitigation

### Technical Risks
- **Complex drag-and-drop**: Prototype early, fallback to click-to-assign
- **Performance with large equipment lists**: Implement virtual scrolling
- **Cross-browser compatibility**: Test on major browsers early

### User Experience Risks
- **Learning curve**: Provide tutorial/onboarding
- **Data loss**: Implement robust auto-save
- **Mobile usability**: Test on tablet devices

## Future Enhancements

### Post-MVP Features
- **Multi-unit editing**: Edit lance/company formations
- **Template system**: Save/load unit templates
- **Collaborative editing**: Real-time multi-user editing
- **Advanced validation**: Rules-specific validation (tournament legal, etc.)
- **AI assistance**: Suggested builds based on role/weight class

---

## Implementation Checklist

### Phase 1 (Structure/Armor) - Ready for Implementation
- [ ] Create UnitEditor container component
- [ ] Implement StructureArmorTab layout
- [ ] Build ArmorAllocationPanel with interactive diagram  
- [ ] Add armor point validation and statistics
- [ ] Implement auto-allocation algorithm
- [ ] Add basic unit data management
- [ ] Create comprehensive tests

### Next Phases (Pending Phase 1 Completion)
- [ ] Equipment Tab implementation
- [ ] Critical Slots Tab implementation  
- [ ] Preview Tab implementation
- [ ] Fluff & Quirks Tabs implementation
- [ ] Integration testing
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] User acceptance testing

---

*This plan provides the roadmap for creating a modern, condensed, and fully-functional MegaMekLab unit editor that maintains feature parity while providing significant UX improvements.*
