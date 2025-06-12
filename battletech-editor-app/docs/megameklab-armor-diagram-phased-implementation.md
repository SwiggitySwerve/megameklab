# MegaMekLab Armor Diagram - Phased Implementation Plan

## Overview
This document outlines the phased implementation of the MegaMekLab armor diagram setup, including all components needed to match the original Java implementation.

## Current Status
- ✅ Dark theme styling applied to ArmorAllocationPanel and ArmorLocationControl
- ✅ Basic armor allocation functionality
- ✅ Auto-allocation algorithm (MegaMekLab exact algorithm)
- 🔲 Complete Structure/Armor tab implementation
- 🔲 Full visual armor diagram with all MegaMekLab features

## Phase 1: Enhanced Armor Type Management
### Components to Create/Update:
1. **ArmorTypeSelector.tsx**
   - Comprehensive armor type dropdown
   - Real-time point recalculation
   - Tech level validation
   - Weight/space requirements display

2. **ArmorTonnageControl.tsx**
   - 0.5 ton increment validation
   - Min/max tonnage constraints
   - Real-time points display
   - Invalid input highlighting

### Implementation Steps:
```typescript
// ArmorTypeSelector.tsx
interface ArmorTypeSelectorProps {
  currentType: ArmorType;
  availableTypes: ArmorType[];
  techLevel: TechLevel;
  onChange: (type: ArmorType) => void;
  disabled?: boolean;
}

// Features:
- Filter by tech level availability
- Show points per ton
- Display space requirements (criticals)
- Show tech base compatibility
```

## Phase 2: Complete Visual Armor Diagram
### Components to Create:
1. **MechArmorDiagram.tsx**
   - Full mech silhouette with proper proportions
   - Location-based visual representation
   - Color-coded armor levels
   - Interactive hover states

2. **ArmorLocationVisual.tsx**
   - SVG-based location rendering
   - Fill percentage visualization
   - Damage state indicators
   - Click/drag interaction zones

### Visual Layout:
```
        [HEAD]
    [LA] [LT][CT][RT] [RA]
         [LL]    [RL]
```

### Features:
- Visual armor percentage fills
- Hover tooltips with details
- Drag-to-adjust on visual elements
- Color gradients for armor levels

## Phase 3: Advanced Statistics & Validation
### Components to Create:
1. **ArmorStatisticsPanel.tsx**
   - Comprehensive armor statistics
   - Per-location breakdowns
   - Weight efficiency metrics
   - Coverage analysis

2. **ArmorValidationDisplay.tsx**
   - Real-time validation messages
   - Location-specific warnings
   - Tech level conflicts
   - Construction rule violations

### Statistics to Display:
- Total armor points vs maximum possible
- Weight efficiency (points per ton)
- Coverage percentage by location
- Front/rear armor ratio analysis
- Vulnerable location warnings

## Phase 4: MegaMekLab Feature Parity
### Components to Create:
1. **ArmorDistributionPresets.tsx**
   - Preset distribution patterns
   - Custom distribution profiles
   - Save/load distributions

2. **PatchworkArmorManager.tsx**
   - Per-location armor type selection
   - Mixed armor validation
   - Weight/space calculations

### Advanced Features:
- Armor distribution templates (Striker, Brawler, Sniper)
- Patchwork armor support
- Stealth armor integration
- Reactive armor handling
- Hardened armor calculations

## Phase 5: Integration & Polish
### Components to Update:
1. **StructureArmorTab.tsx**
   - Complete tab implementation
   - All sub-panels integration
   - Responsive layout
   - Keyboard navigation

2. **ArmorHistoryManager.tsx**
   - Undo/redo for armor changes
   - Change history display
   - Bulk operations support

### Integration Tasks:
- Connect to unit save/load system
- Integrate with validation pipeline
- Add to export/import functionality
- Performance optimization
- Accessibility improvements

## Implementation Priority Order

### Week 1: Core Components
1. Create ArmorTypeSelector with full armor type support
2. Implement ArmorTonnageControl with validation
3. Update existing components for new features

### Week 2: Visual Diagram
1. Create MechArmorDiagram component
2. Implement ArmorLocationVisual with SVG
3. Add interactive features and animations

### Week 3: Statistics & Validation
1. Build ArmorStatisticsPanel
2. Create ArmorValidationDisplay
3. Integrate with existing validation system

### Week 4: Advanced Features
1. Add distribution presets
2. Implement patchwork armor support
3. Create armor templates system

### Week 5: Polish & Integration
1. Complete StructureArmorTab
2. Add history management
3. Performance optimization
4. Testing and bug fixes

## Technical Considerations

### State Management
```typescript
interface ArmorState {
  armorType: ArmorType;
  tonnage: number;
  totalPoints: number;
  locations: ArmorLocationData[];
  distribution: ArmorDistribution;
  validation: ValidationResult[];
  history: ArmorChange[];
}
```

### Performance Optimizations
- Memoize armor calculations
- Virtualize large equipment lists
- Debounce validation checks
- Lazy load visual components

### Accessibility
- ARIA labels for all controls
- Keyboard navigation support
- Screen reader announcements
- High contrast mode support

## Testing Strategy
1. Unit tests for armor calculations
2. Integration tests for state management
3. Visual regression tests for diagram
4. E2E tests for complete workflow
5. Performance benchmarks

## Success Metrics
- [ ] Full MegaMekLab feature parity
- [ ] Sub-second response times
- [ ] Zero calculation errors
- [ ] 100% keyboard accessible
- [ ] Mobile responsive design
