# Tab Components Cleanup Summary

## Current State

### Production Path (Already Using Hooks)
The main production customizer app is correctly using the hook-based versions:
- `pages/customizer/index.tsx` → Uses `UnitEditorWrapper`
- `UnitEditorWrapper` → Uses `UnitEditorWithHooks`
- `UnitEditorWithHooks` → Uses all hook-based tab components with unified data model

### UnitEditor.tsx (Updated)
- Now imports and uses hook-based tab components:
  - `StructureTabWithHooks`
  - `ArmorTabWithHooks`
  - `EquipmentTabWithHooks`
  - `CriticalsTabWithHooks`
  - `FluffTabWithHooks`

### Hook-Based Tab Components (Using Unified Data Model)
These are the current production-ready components:
1. `StructureTabWithHooks.tsx` - Uses `useUnitData()` hook
2. `ArmorTabWithHooks.tsx` - Uses `useUnitData()` hook
3. `EquipmentTabWithHooks.tsx` - Uses `useUnitData()` hook
4. `CriticalsTabWithHooks.tsx` - Uses `useUnitData()` hook
5. `FluffTabWithHooks.tsx` - Uses `useUnitData()` hook

### Legacy Non-Hook Tab Components (To Be Removed)
These components are no longer used in production:
1. `StructureTab.tsx` - Direct prop-based state management
2. `ArmorTab.tsx` - Direct prop-based state management
3. `EquipmentTab.tsx` - Direct prop-based state management
4. `CriticalsTab.tsx` - Direct prop-based state management (with drag-drop fix)
5. `FluffTab.tsx` - Direct prop-based state management

## Files Still Using Legacy Components

### Test Files (May need updating or removal)
- `__tests__/baseline/structure-tab.test.tsx`
- `__tests__/baseline/integration-current-flow.test.tsx`
- `__tests__/baseline/equipment-tab.test.tsx`
- `__tests__/baseline/criticals-tab.test.tsx`

### Demo/Test Pages (Should be updated or removed)
- `pages/separated-tabs-demo.tsx` - Uses StructureTab, ArmorTab
- `pages/test-drag-drop-fix.tsx` - Uses CriticalsTab
- `pages/test-dnd-criticals.tsx` - Uses CriticalsTab
- `pages/phase5-demo.tsx` - Uses FluffTab
- `pages/complete-editor-demo.tsx` - Uses FluffTab, EquipmentTab, CriticalsTab

### Other Pages
- `pages/test-initialization.tsx` - Uses UnitEditor (now updated)
- `pages/test-dnd-debug.tsx` - Uses UnitEditor (now updated)

## Recommended Actions

### 1. Archive Legacy Components
Move the non-hook tab components to an archive folder:
```
components/editor/tabs/_legacy/
  - StructureTab.tsx
  - ArmorTab.tsx
  - EquipmentTab.tsx
  - CriticalsTab.tsx
  - FluffTab.tsx
```

### 2. Update or Remove Test Files
Either:
- Update tests to use hook-based components with proper providers
- Remove outdated tests if they're no longer relevant

### 3. Update Demo Pages
Either:
- Update demo pages to use hook-based components
- Remove demo pages if they're no longer needed
- Keep as legacy examples in a separate folder

### 4. Benefits of Cleanup
- Reduces confusion about which components to use
- Ensures all new development uses the unified data model
- Simplifies maintenance
- Prevents accidental use of legacy components

## Notes

- The drag-drop fix implemented in CriticalsTab.tsx should already be present in CriticalsTabWithHooks.tsx
- QuirksTab and PreviewTab don't have hook versions yet (still in development)
- StructureTabHybrid.tsx appears to be an experimental version
