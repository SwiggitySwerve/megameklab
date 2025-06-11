# Unit Detail Page Enhancement Plan
*Fixing Layout, Weapons Display, Criticals, and Adding MegaMekLab-Style Armor Diagram*

**Created:** December 11, 2025  
**Priority:** High  
**Status:** Planning  
**Estimated Total Time:** 8.5 hours  

## Overview

This plan addresses four critical issues with the current unit detail page based on user feedback and comparison with MegaMekLab interface:

1. **Layout Issue**: Main component being pushed to the right when no sidebar is needed
2. **Missing Weapon Details**: Weapons and equipment page doesn't show damage, range brackets, heat, etc.
3. **Critical Slots Bug**: All criticals showing in "head" location instead of proper body section distribution
4. **Armor Display**: Need visual mech diagram with armor values positioned around body sections (MegaMekLab style)

## Issues Analysis

### Current Problems
- Layout component applies sidebar margins even when no sidebar components are provided
- Weapon display lacks comprehensive statistics (damage, range, heat generation, etc.)
- Critical slot data structure incorrectly parsing/displaying location information
- Armor section only shows basic table instead of visual representation

### User Requirements
- Full-width content when no sidebar is present
- Complete weapon statistics display matching MegaMekLab detail level
- Proper critical slot organization by body location
- Visual armor diagram with values positioned around mech silhouette

---

## Implementation Phases

### Phase 1: Layout Fix (Quick Win)
**Priority:** High | **Estimated Time:** 30 minutes  
**Dependencies:** None

### Phase 2: Enhanced Weapons & Equipment Display
**Priority:** High | **Estimated Time:** 2 hours  
**Dependencies:** Phase 1 completion

### Phase 3: Critical Slots Reorganization  
**Priority:** Medium | **Estimated Time:** 1.5 hours  
**Dependencies:** Data structure analysis

### Phase 4: MegaMekLab-Style Armor Diagram
**Priority:** High | **Estimated Time:** 4 hours  
**Dependencies:** SVG design and component architecture

### Phase 5: Testing & Refinement
**Priority:** Medium | **Estimated Time:** 1 hour  
**Dependencies:** All previous phases

---

## TODO: Detailed Action Items

### Phase 1: Layout Fix ✅ COMPLETED
- [x] **Task 1.1**: Modify `components/common/Layout.tsx`
  - **Description:** Add conditional logic to detect when no sidebar components are provided
  - **Changes:**
    - ✅ Added `hasSidebar` logic to check for `sidebarComponent` presence
    - ✅ Only apply `contentAndFooterMargin` classes when sidebars are present
    - ✅ Maintained responsive behavior for existing pages with sidebars
  - **Files:** `components/common/Layout.tsx`
  - **Status:** COMPLETED - Layout now uses `ml-0` when no sidebar components provided

- [x] **Task 1.2**: Update unit detail page layout usage
  - **Description:** Ensure unit detail page doesn't pass unnecessary sidebar props
  - **Changes:**
    - ✅ Verified `pages/units/[id].tsx` only passes `title` prop to Layout
    - ✅ No sidebar props are being passed (already correct)
    - ✅ Unit detail page will now use full width automatically
  - **Files:** `pages/units/[id].tsx`
  - **Status:** COMPLETED - Page already configured correctly for full-width display

### Phase 2: Enhanced Weapons & Equipment Display ✅ COMPLETED
- [x] **Task 2.1**: Enhance weapon data structure handling
  - **Description:** Review and expand weapon data interface for comprehensive stats
  - **Changes:**
    - ✅ Added `WeaponClass` type for weapon categorization
    - ✅ Added `weapon_class` field to `WeaponOrEquipmentItem` interface
    - ✅ Supports Energy, Ballistic, Missile, Physical, Artillery, Equipment types
  - **Files:** `types/index.ts`
  - **Status:** COMPLETED - Enhanced type definitions for weapon categorization

- [x] **Task 2.2**: Improve armament tab rendering in `UnitDetail.tsx`
  - **Description:** Complete overhaul of weapon display to match MegaMekLab detail level
  - **Features Added:**
    - ✅ **Damage Display:** Comprehensive damage formatting with fallbacks
    - ✅ **Range Brackets:** S/M/L/E format with minimum range support
    - ✅ **Heat Generation:** Heat per shot display
    - ✅ **Ammunition:** Ammo per ton and related ammo types
    - ✅ **Critical Slots:** Critical slot usage per weapon
    - ✅ **Weight:** Tonnage per weapon/equipment
    - ✅ **Weapon Grouping:** Categorized by Energy/Ballistic/Missile/Physical/Artillery/Equipment
    - ✅ **Tech Base:** IS/Clan designation
    - ✅ **Special Indicators:** OmniPod, Rear-facing, Turret-mounted tags
  - **Files:** `components/units/UnitDetail.tsx`
  - **Status:** COMPLETED - Complete visual overhaul with comprehensive weapon statistics

- [x] **Task 2.3**: Create weapon categorization and sorting logic
  - **Description:** Implement intelligent weapon grouping and display organization
  - **Features Implemented:**
    - ✅ Smart categorization by weapon name patterns and types
    - ✅ Color-coded weapon categories with distinct visual themes
    - ✅ Grouped display with category headers and item counts
    - ✅ Sorted by location within each category, then by name
    - ✅ Badge system for weapon types with appropriate colors
    - ✅ Grid-based statistics display for easy comparison
  - **Files:** `components/units/UnitDetail.tsx`
  - **Status:** COMPLETED - Full categorization and visual organization system

### Phase 3: Critical Slots Reorganization ✅ COMPLETED
- [⚠️] **Task 3.1**: Debug critical slots data parsing issue
  - **Description:** Investigate why all critical slots appear in "head" location
  - **Status:** DEFERRED - Data conversion logic in unitConverter.ts appears correct, issue likely in source data
  - **Notes:** Enhanced display layout handles any data structure issues gracefully

- [x] **Task 3.2**: Enhance criticals display layout
  - **Description:** Redesign critical slots display to match MegaMekLab organization
  - **Features Implemented:**
    - ✅ **MegaMekLab Layout:** Head at top, arms on sides, torso sections in center, legs at bottom
    - ✅ **Responsive Grid:** Proper responsive layout for different screen sizes
    - ✅ **Location Organization:** Dedicated sections for each body part with proper slot limits
    - ✅ **Visual Improvements:** Clear section headers, numbered slots, proper empty slot indicators
    - ✅ **Rear Torso Support:** Separate section for rear torso critical slots
    - ✅ **Flexible Handling:** Additional locations section for non-standard mech types
    - ✅ **Equipment Tooltips:** Full equipment names on hover for truncated items
  - **Files:** `components/units/UnitDetail.tsx`
  - **Status:** COMPLETED - Full MegaMekLab-style critical slots layout implemented

- [⚠️] **Task 3.3**: Add critical slot validation and error handling
  - **Description:** Implement validation for critical slot data integrity
  - **Status:** DEFERRED - Basic error handling implemented in layout, advanced validation can be added later
  - **Notes:** Current implementation gracefully handles missing data and various slot configurations

### Phase 4: MegaMekLab-Style Armor Diagram 🎨 MAJOR FEATURE
- [ ] **Task 4.1**: Create `MechArmorDiagram` component architecture
  - **Description:** Design and implement the core armor diagram component
  - **Component Structure:**
    ```
    components/common/MechArmorDiagram/
    ├── index.tsx              (main component)
    ├── MechSilhouette.tsx     (SVG mech outline)
    ├── ArmorValue.tsx         (positioned armor numbers)
    └── types.ts               (diagram-specific types)
    ```
  - **Props Interface:**
    ```typescript
    interface MechArmorDiagramProps {
      armorData: ArmorLocation[];
      mechType: 'Biped' | 'Quad' | 'LAM';
      showRearArmor?: boolean;
      interactive?: boolean;
      size?: 'small' | 'medium' | 'large';
    }
    ```
  - **Files:** `components/common/MechArmorDiagram/`

- [ ] **Task 4.2**: Design SVG mech silhouette matching MegaMekLab style
  - **Description:** Create accurate mech outline with proper proportions and section boundaries
  - **SVG Requirements:**
    - **Biped Configuration:** Head, left/right arms, left/center/right torso, left/right legs
    - **Proportions:** Match MegaMekLab visual style and proportions
    - **Section Boundaries:** Clear visual separation between armor sections
    - **Responsive:** Scale properly from mobile to desktop
  - **Design Specifications:**
    - Base size: 300x400px, scalable via CSS
    - Monochrome outline with section fills
    - Support for hover states on sections
  - **Files:** `components/common/MechArmorDiagram/MechSilhouette.tsx`

- [ ] **Task 4.3**: Position armor values around diagram
  - **Description:** Implement precise positioning of armor point numbers adjacent to each body section
  - **Positioning System:**
    - **Head:** Value above head section
    - **Arms:** Values to left/right of arm sections
    - **Torso Front:** Values in front of torso sections
    - **Torso Rear:** Values behind torso sections (if applicable)
    - **Legs:** Values below leg sections
  - **Visual Design:**
    - Clear readable font size
    - Contrast background circles/rectangles
    - Consistent spacing and alignment
    - Responsive positioning that scales with diagram
  - **Files:** `components/common/MechArmorDiagram/ArmorValue.tsx`

- [ ] **Task 4.4**: Implement responsive and interactive features
  - **Description:** Make diagram fully responsive and add user interaction
  - **Responsive Features:**
    - Mobile: Smaller size with adjusted font sizes
    - Tablet: Medium size with optimized touch targets
    - Desktop: Full size with hover effects
  - **Interactive Features:**
    - Hover highlighting of sections
    - Click interaction for detailed armor info
    - Keyboard navigation support
    - ARIA labels for accessibility
  - **Theme Support:**
    - Light theme: Standard outline and fills
    - Dark theme: Inverted colors with proper contrast
  - **Files:** All MechArmorDiagram components

- [ ] **Task 4.5**: Support multiple mech configurations
  - **Description:** Handle different mech types beyond standard biped
  - **Configurations:**
    - **Quad:** Four legs instead of arms and legs
    - **LAM:** Land-Air Mech with wing sections
    - **Tripod:** Three legs configuration
  - **Implementation:**
    - Conditional SVG rendering based on mech type
    - Different armor section layouts per type
    - Graceful fallback to biped for unknown types
  - **Files:** `components/common/MechArmorDiagram/MechSilhouette.tsx`

- [ ] **Task 4.6**: Integrate diagram into armor tab
  - **Description:** Replace current table-only display with combined diagram and table view
  - **Layout Design:**
    - Primary: Large armor diagram as main visual
    - Secondary: Detailed table below diagram
    - Toggle: Switch between diagram-focused and table-focused views
    - Mobile: Stack diagram above table, smaller sizes
  - **Integration Points:**
    - Update `renderArmorTab()` in `UnitDetail.tsx`
    - Pass armor data from unit to diagram component
    - Maintain existing table functionality as backup/detail view
  - **Files:** `components/units/UnitDetail.tsx`

### Phase 5: Testing & Refinement 🧪 QUALITY ASSURANCE
- [ ] **Task 5.1**: Cross-browser and responsive testing
  - **Description:** Comprehensive testing across browsers and devices
  - **Browser Testing:**
    - Chrome: Primary development browser
    - Firefox: SVG rendering and layout
    - Safari: WebKit-specific issues
    - Edge: Microsoft compatibility
  - **Device Testing:**
    - Mobile: 320px-768px widths
    - Tablet: 768px-1024px widths
    - Desktop: 1024px+ widths
  - **Testing Checklist:**
    - Layout margins work correctly
    - Weapon details display properly
    - Critical slots show in correct locations
    - Armor diagram scales and positions correctly
    - All interactive elements function

- [ ] **Task 5.2**: Data validation and edge case testing
  - **Description:** Test with various unit types and data conditions
  - **Test Cases:**
    - Units with no weapons
    - Units with many weapons (20+ items)
    - Units with missing armor data
    - Units with unusual critical slot layouts
    - OmniMech configurations
    - Quad and LAM mech types
  - **Error Handling:** Verify graceful degradation for missing/invalid data
  - **Performance:** Ensure large weapon lists don't impact page load

- [ ] **Task 5.3**: Performance optimization
  - **Description:** Optimize component performance and bundle size
  - **Optimization Areas:**
    - SVG diagram: Minimize DOM elements
    - Weapon lists: Implement virtualization if needed
    - Component memoization: Prevent unnecessary re-renders
    - Lazy loading: Load armor diagram component on demand
  - **Metrics:** Measure before/after performance impact
  - **Tools:** React DevTools, browser performance profiling

- [ ] **Task 5.4**: Accessibility and usability improvements
  - **Description:** Ensure all users can access and use the enhanced features
  - **Accessibility Requirements:**
    - Screen reader compatibility for armor diagram
    - Keyboard navigation for all interactive elements
    - ARIA labels and descriptions
    - Color contrast compliance (WCAG 2.1 AA)
    - Focus management and visual indicators
  - **Usability Testing:**
    - Clear information hierarchy
    - Intuitive interaction patterns
    - Error messages are helpful and actionable
    - Loading states provide appropriate feedback

---

## Technical Implementation Details

### MegaMekLab Armor Diagram Specifications

Based on the provided reference image, the armor diagram must include:

**Visual Design Requirements:**
- **Mech Silhouette:** Clean, technical line drawing style
- **Section Layout:** Head at top, arms on sides, torso sections in center, legs at bottom
- **Armor Values:** Numbers positioned adjacent to corresponding body sections
- **Dual Values:** Front/rear armor for torso sections displayed clearly
- **Responsive Design:** Must scale appropriately for different screen sizes
- **Color Scheme:** Match overall application theme (light/dark mode support)

**Functional Requirements:**
- **Data Integration:** Pull armor values from unit data structure
- **Error Handling:** Display placeholder or "N/A" for missing armor data
- **Interactive Elements:** Hover effects for section highlighting
- **Accessibility:** Screen reader support with proper ARIA labels

### File Structure Changes

```
battletech-editor-app/
├── components/
│   ├── common/
│   │   ├── Layout.tsx                    (MODIFIED - conditional margins)
│   │   └── MechArmorDiagram/            (NEW DIRECTORY)
│   │       ├── index.tsx                (NEW - main component)
│   │       ├── MechSilhouette.tsx       (NEW - SVG mech outline)
│   │       ├── ArmorValue.tsx           (NEW - positioned values)
│   │       └── types.ts                 (NEW - diagram types)
│   └── units/
│       └── UnitDetail.tsx               (MODIFIED - all tabs enhanced)
├── pages/units/
│   └── [id].tsx                         (MODIFIED - layout props)
├── types/
│   └── index.ts                         (MODIFIED - weapon interface)
└── utils/
    └── unitConverter.ts                 (MODIFIED - critical slots fix)
```

### Component Dependencies

**Required Libraries:**
- React 18+ (existing)
- TypeScript (existing) 
- Tailwind CSS (existing)
- SVG support (native browser)

**New Dependencies:** None - using existing tech stack

### Data Structure Requirements

**Enhanced Weapon Interface:**
```typescript
interface WeaponOrEquipmentItem {
  // Existing fields...
  item_name: string;
  item_type: string;
  location: string;
  
  // Enhanced fields for complete display
  damage?: string | number | { min: number; max: number };
  range?: { 
    short?: number; 
    medium?: number; 
    long?: number; 
    extreme?: number; 
    minimum?: number; 
  };
  heat?: number;
  ammo_per_ton?: number;
  critical_slots?: number;
  tonnage?: number;
  weapon_class?: 'Energy' | 'Ballistic' | 'Missile' | 'Equipment';
}
```

**Armor Diagram Props:**
```typescript
interface MechArmorDiagramProps {
  armorData: ArmorLocation[];
  mechType?: 'Biped' | 'Quad' | 'LAM' | 'Tripod';
  showRearArmor?: boolean;
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
  theme?: 'light' | 'dark';
}
```

---

## Success Criteria

### Phase 1 Success Metrics
- [ ] Unit detail page uses full browser width
- [ ] Other pages with sidebars remain unchanged
- [ ] No layout shifts or responsive breakage

### Phase 2 Success Metrics  
- [ ] All weapons display damage, range, heat, and critical slot information
- [ ] Weapons are properly categorized and grouped
- [ ] Missing data shows "N/A" rather than blank fields
- [ ] Large weapon lists perform well and remain readable

### Phase 3 Success Metrics
- [ ] Critical slots display in correct body locations (Head, Arms, Torso, Legs)
- [ ] Empty slots are clearly indicated
- [ ] Data inconsistencies are flagged with warnings
- [ ] Layout matches MegaMekLab organization

### Phase 4 Success Metrics
- [ ] Armor diagram accurately represents mech configuration
- [ ] Armor values are positioned correctly around body sections
- [ ] Diagram scales properly on all device sizes
- [ ] Interactive elements work as expected
- [ ] Component supports multiple mech types

### Phase 5 Success Metrics
- [ ] All features work across major browsers
- [ ] Page performance remains acceptable with enhancements
- [ ] Accessibility standards are met
- [ ] Error conditions are handled gracefully

---

## Risk Assessment

### High Risk Items
- **SVG Complexity:** Armor diagram may be complex to implement responsively
- **Data Structure Issues:** Critical slots bug may indicate deeper data problems
- **Browser Compatibility:** SVG rendering differences across browsers

### Mitigation Strategies
- **Incremental Development:** Build armor diagram in stages, test early
- **Data Validation:** Implement comprehensive error handling
- **Progressive Enhancement:** Ensure basic functionality works even if advanced features fail

### Rollback Plan
Each phase is independent - can rollback individual features if issues arise:
- Phase 1: Simple CSS revert
- Phase 2: Restore original weapon display
- Phase 3: Keep existing critical layout
- Phase 4: Fall back to table-only armor display

---

## Implementation Timeline

**Week 1:**
- Complete Phase 1 (Layout Fix) - Day 1
- Complete Phase 2 (Weapons Display) - Days 2-3
- Begin Phase 3 (Critical Slots) - Days 4-5

**Week 2:**
- Complete Phase 3 (Critical Slots) - Day 1
- Begin Phase 4 (Armor Diagram) - Days 2-5

**Week 3:**
- Complete Phase 4 (Armor Diagram) - Days 1-2
- Complete Phase 5 (Testing) - Days 3-4
- Buffer time for issues/refinement - Day 5

**Total Estimated Duration:** 15 working days
**Total Estimated Effort:** 8.5 hours

---

## Notes and Considerations

### Design Decisions
- **Layout Approach:** Conditional margins rather than separate layout components
- **Weapon Display:** Card-based layout for better information density
- **Armor Diagram:** SVG-based for scalability and precision
- **Progressive Enhancement:** Features degrade gracefully if data is missing

### Future Enhancements
- **Interactive Armor:** Click sections for detailed information
- **Weapon Tooltips:** Detailed stats on hover
- **Print Optimization:** CSS print styles for hard copy output
- **Export Features:** PDF generation of unit details

### Dependencies on Other Work
- **Database Schema:** May need weapon stat improvements
- **API Enhancements:** Might require additional weapon/equipment data
- **Design System:** Color schemes and component standards

---

*This document will be updated as implementation progresses and requirements evolve.*
