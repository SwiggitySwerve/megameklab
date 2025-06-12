# MegaMekLab Armor Diagram Complete Implementation Plan

## Overview
Based on analysis of the MegaMekLab Java implementation, the armor diagram system consists of multiple integrated components that work together to provide a complete armor management experience.

## Key Components from MegaMekLab

### 1. Structure Tab Architecture
The BMStructureTab.java shows a three-column layout:
- **Left Panel**: Basic Info, Icon View, Chassis
- **Center Panel**: Heat Sinks, Movement, LAM Fuel, Summary
- **Right Panel**: Armor, Armor Allocation, Patchwork

### 2. Armor Allocation Features

#### Auto-Allocation Algorithm
```java
public void autoAllocateArmor() {
    // 1. Calculate total points to allocate
    // 2. Put 5x percentage into head (max 9 or 12 for superheavy)
    // 3. Distribute remaining by percentage of max armor
    // 4. Front/rear split: 75% front, 25% rear for torso
    // 5. Allocate leftover points symmetrically
}
```

#### Key Methods
- `maximizeArmor()` - Sets armor to maximum tonnage
- `useRemainingTonnageArmor()` - Uses all remaining tonnage for armor
- `armorPointsChanged(location, front, rear)` - Updates specific location
- `allocateLeftoverPoints(points)` - Distributes remainder intelligently

### 3. Patchwork Armor Support
- Separate panel for patchwork armor configuration
- Per-location armor type selection
- Critical slot validation for each armor type

## Our Current Implementation Status

### ✅ Completed
1. **ArmorAllocationPanel** - Basic structure with:
   - Location-based armor controls
   - Visual armor diagram
   - Point allocation per location
   - Total tonnage tracking

2. **MechArmorDiagram** - Visual representation with:
   - SVG-based mech silhouette
   - Clickable locations
   - Armor value display

3. **ArmorLocationControl** - Individual location controls

### 🔄 In Progress / Needs Enhancement

1. **Auto-Allocation Features**
   - Need to implement the sophisticated allocation algorithm
   - Add "Maximize Armor" button
   - Add "Use Remaining Tonnage" button
   - Implement symmetric allocation

2. **Patchwork Armor**
   - Add patchwork panel
   - Per-location armor type selection
   - Critical slot validation

3. **Integration**
   - Connect all components properly
   - Ensure data flow between panels
   - Add validation feedback

## Implementation Plan

### Phase 1: Enhanced Auto-Allocation (2-3 hours)

#### 1.1 Add Auto-Allocation Algorithm
```typescript
// utils/armorAllocation.ts
export function autoAllocateArmor(unit: Unit): ArmorAllocation {
  const totalPoints = unit.armorTonnage * 16; // Points per ton
  const maxArmor = calculateMaxArmorPoints(unit);
  
  // Head gets 5x percentage
  const headMax = unit.isSuperHeavy ? 12 : 9;
  const percent = totalPoints / maxArmor;
  const headArmor = Math.min(Math.floor(percent * headMax * 5), headMax);
  
  // Distribute remaining
  const remaining = totalPoints - headArmor;
  const allocation: ArmorAllocation = { head: headArmor };
  
  // Calculate per location...
  return allocation;
}
```

#### 1.2 Add Control Buttons
```typescript
// components/editor/armor/ArmorAllocationControls.tsx
<div className="armor-controls">
  <button onClick={handleMaximizeArmor}>
    Maximize Armor
  </button>
  <button onClick={handleUseRemainingTonnage}>
    Use Remaining Tonnage
  </button>
  <button onClick={handleAutoAllocate}>
    Auto-Allocate
  </button>
  <button onClick={handleClearArmor}>
    Clear All
  </button>
</div>
```

### Phase 2: Symmetric Allocation Logic (1-2 hours)

#### 2.1 Leftover Points Distribution
```typescript
function allocateLeftoverPoints(
  unit: Unit, 
  points: number, 
  currentAllocation: ArmorAllocation
): ArmorAllocation {
  // Prioritize symmetric locations
  // 1. Torso pairs (LT/RT)
  // 2. Leg pairs (LL/RL)  
  // 3. Arm pairs (LA/RA)
  // 4. Head if not maxed
  // 5. Center torso if space available
}
```

### Phase 3: Patchwork Armor Panel (2-3 hours)

#### 3.1 Patchwork Configuration Component
```typescript
// components/editor/armor/PatchworkArmorPanel.tsx
interface PatchworkArmorPanelProps {
  unit: Unit;
  onArmorTypeChange: (location: string, armorType: ArmorType) => void;
}

export const PatchworkArmorPanel: React.FC<PatchworkArmorPanelProps> = ({
  unit,
  onArmorTypeChange
}) => {
  return (
    <div className="patchwork-panel">
      {MECH_LOCATIONS.map(location => (
        <PatchworkLocationRow
          key={location}
          location={location}
          currentType={unit.getArmorType(location)}
          availableTypes={getAvailableArmorTypes(unit, location)}
          criticalSlots={unit.getEmptyCriticals(location)}
          onChange={(type) => onArmorTypeChange(location, type)}
        />
      ))}
    </div>
  );
};
```

### Phase 4: Integration & Polish (1-2 hours)

#### 4.1 Connect Components in StructureArmorTab
```typescript
// Updated StructureArmorTab.tsx
const [showPatchwork, setShowPatchwork] = useState(false);

return (
  <div className="structure-armor-tab">
    {/* Existing panels */}
    
    <ArmorAllocationPanel
      unit={unit}
      onChange={handleArmorChange}
      onAutoAllocate={handleAutoAllocate}
      onMaximize={handleMaximizeArmor}
    />
    
    {showPatchwork && (
      <PatchworkArmorPanel
        unit={unit}
        onArmorTypeChange={handlePatchworkChange}
      />
    )}
  </div>
);
```

#### 4.2 Validation & Feedback
- Add real-time validation for armor limits
- Show warnings for invalid configurations
- Highlight over-allocated locations
- Display remaining points/tonnage

### Phase 5: Final Testing & Optimization (1 hour)

1. **Test Scenarios**:
   - Standard armor allocation
   - Patchwork armor with different types
   - Maximum armor scenarios
   - Edge cases (superheavy, primitive, etc.)

2. **Performance Optimization**:
   - Memoize expensive calculations
   - Optimize re-renders
   - Add loading states for complex operations

## Visual Design Specifications

### Armor Diagram Enhancements
1. **Color Coding**:
   - Green: Normal allocation
   - Yellow: Near maximum
   - Red: At maximum
   - Gray: Disabled/destroyed

2. **Interactive Features**:
   - Click to select location
   - Drag to adjust values
   - Hover for tooltips
   - Visual feedback on changes

3. **Layout**:
   ```
   [Armor Type Selector] [Total Tonnage: X.X]
   
   [Mech Diagram]          [Location List]
   +-------------+         Head:      [9/9]
   |    Head     |         CT:     [20/30]
   |  LT  CT  RT |         LT:     [15/20]
   |  LA     RA  |         RT:     [15/20]
   |  LL     RL  |         ...
   +-------------+         
   
   [Auto-Allocate] [Maximize] [Use Remaining] [Clear]
   ```

## Technical Considerations

1. **State Management**:
   - Use local state for temporary changes
   - Commit to unit on blur/confirm
   - Support undo/redo if possible

2. **Validation**:
   - Real-time validation during input
   - Prevent invalid states
   - Clear error messages

3. **Performance**:
   - Debounce rapid changes
   - Optimize diagram re-renders
   - Cache calculations

## Estimated Timeline

- Phase 1: 2-3 hours
- Phase 2: 1-2 hours  
- Phase 3: 2-3 hours
- Phase 4: 1-2 hours
- Phase 5: 1 hour

**Total: 7-11 hours**

## Next Steps

1. Start with Phase 1 - implement auto-allocation algorithm
2. Add control buttons to existing ArmorAllocationPanel
3. Test with various mech configurations
4. Move to symmetric allocation logic
5. Implement patchwork armor support
6. Final integration and testing
