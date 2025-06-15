# Critical Section Code Cleanup Plan

## Files to Remove

### Unused Critical Components
1. **components/editor/criticals/CriticalSlot.tsx** - Old component, replaced by CriticalSlotDropZone
2. **components/editor/criticals/CriticalSlot.module.css** - Styles for old component
3. **components/editor/criticals/CriticalsGrid.tsx** - Not used anywhere
4. **components/editor/criticals/CriticalsGrid.module.css** - Styles for unused component
5. **components/editor/criticals/CriticalSlotGrid.tsx** - Not used anywhere
6. **components/editor/criticals/EnhancedCriticalSlot.tsx** - Not used anywhere
7. **components/editor/criticals/EnhancedCriticalSlotDropZone.tsx** - Not used anywhere
8. **components/editor/criticals/EnhancedCriticalSlotDropZone.module.css** - Styles for unused component
9. **components/editor/criticals/MechCriticalsDiagram.tsx** - Not used anywhere
10. **components/editor/criticals/MechCriticalsDiagram.module.css** - Styles for unused component

### Old DnD Types (to migrate from)
- **components/editor/dnd/types.ts** - Old types, need to migrate remaining usage to typesV2

### Test Pages to Remove
1. **pages/test-critical-slots.tsx** - Old test page
2. **pages/test-critical-slots-v2.tsx** - Test page
3. **pages/test-criticals-hover.tsx** - Test page
4. **pages/test-dnd-criticals.tsx** - Test page
5. **pages/test-dnd-debug.tsx** - Test page
6. **pages/test-dnd-fixed.tsx** - Test page
7. **pages/test-drag-drop-fix.tsx** - Test page
8. **pages/test-drop-zone-debug.tsx** - Test page
9. **pages/test-empty-slots.tsx** - Test page
10. **pages/test-initialization.tsx** - Test page
11. **pages/test-simple-dnd.tsx** - Test page
12. **pages/test-editor.tsx** - Test page if not needed
13. **pages/dnd-demo.tsx** - Demo page

### Old Tab Components
1. **components/editor/tabs/CriticalsTabFixed.tsx** - Old version
2. **components/editor/tabs/CriticalsTabUpdated.tsx** - Old version
3. **components/editor/tabs/CriticalsTabWithHooks.tsx** - Old version

## Files to Keep

### Core Components
- **components/editor/criticals/CriticalSlotDropZone.tsx** - Main critical slot component
- **components/editor/criticals/CriticalSlotDropZone.module.css** - Styles
- **components/editor/criticals/MechCriticalsAllocationGrid.tsx** - Used in demo (keep for now)
- **components/editor/criticals/MechCriticalsAllocationGrid.module.css** - Styles

### DnD Types
- **components/editor/dnd/typesV2.ts** - New types being used

### Main Tab
- **components/editor/tabs/CriticalsTabIntegrated.tsx** - Main criticals tab

### Demo Pages (keep for reference)
- **pages/criticals-demo.tsx** - Demo page using MechCriticalsAllocationGrid
- **pages/complete-editor-demo.tsx** - Complete editor demo

## Migration Tasks
1. Update any remaining imports from `dnd/types` to `dnd/typesV2`
2. Remove test imports from test files
3. Clean up any dead imports

## Total Files to Remove: ~25 files
