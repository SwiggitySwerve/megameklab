# MegaMekLab Implementation - Developer Guide

## Quick Start

### Prerequisites
```bash
# Required
- Node.js 18+ 
- npm or yarn
- Git

# Optional but recommended
- VS Code with TypeScript extension
- React Developer Tools browser extension
```

### Initial Setup
```bash
# Clone the repository
git clone [repository-url]
cd megameklab/battletech-editor-app

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Key URLs
- `/` - Home page
- `/compendium` - Unit/equipment browser
- `/customizer` - Main editor (start here)
- `/editor-demo` - Editor demonstration
- `/armor-diagram-demo` - Armor system demo
- `/test-editor` - Testing environment

## Project Structure Quick Reference

### Where to Find Things
```
📁 Key Directories:
├── components/editor/        # All editor components
│   ├── tabs/                # Main editor tabs (Structure, Equipment, etc.)
│   ├── armor/               # Armor allocation components
│   ├── equipment/           # Equipment management
│   └── criticals/           # Critical slot assignment
├── utils/                   # Business logic
│   ├── unitValidation.ts    # Validation rules
│   ├── armorAllocation.ts   # Armor calculations
│   └── equipmentData.ts     # Equipment database
├── types/                   # TypeScript definitions
│   ├── index.ts            # Core types
│   └── editor.ts           # Editor-specific types
└── pages/                  # Next.js routes
```

### Most Important Files
```typescript
// Core unit editor
components/editor/UnitEditor.tsx         // Main editor component
components/editor/tabs/*.tsx             // Individual tab components

// Data models
types/index.ts                          // EditableUnit interface
types/editor.ts                         // Editor-specific types

// Business logic
utils/unitValidation.ts                 // Validation rules
utils/armorAllocation.ts                // Armor auto-allocation
utils/equipmentData.ts                  // Equipment database

// State management
utils/undoRedoManager.ts                // Undo/redo functionality
```

## Common Development Tasks

### 1. Adding New Equipment
```typescript
// 1. Add to equipmentData.ts
export const weapons: Equipment[] = [
  // ... existing weapons
  {
    id: 'new-weapon-id',
    name: 'New Weapon',
    type: 'weapon',
    heat: 5,
    damage: 10,
    slots: 2,
    tons: 5,
    cost: 100000,
    tech_base: 'Inner Sphere',
    rules_level: 'standard'
  }
];

// 2. Add any special validation rules in unitValidation.ts
```

### 2. Adding a New Quirk
```typescript
// 1. Add to quirks list in types/index.ts
export const POSITIVE_QUIRKS = [
  // ... existing quirks
  'New Quirk Name'
];

// 2. Add effects in utils/unitValidation.ts if needed
```

### 3. Modifying Validation Rules
```typescript
// In utils/unitValidation.ts
export const validateUnit = (unit: EditableUnit): ValidationState => {
  const errors: ValidationError[] = [];
  
  // Add new validation
  if (/* your condition */) {
    errors.push({
      type: 'CUSTOM_ERROR',
      severity: 'error',
      message: 'Your error message',
      field: 'affected_field'
    });
  }
  
  // ... rest of validation
};
```

### 4. Adding a New Tab
```typescript
// 1. Create new tab component
// components/editor/tabs/NewTab.tsx
export const NewTab: React.FC<TabProps> = ({ unit, onUnitChange }) => {
  return (
    <div className="p-4">
      {/* Your tab content */}
    </div>
  );
};

// 2. Add to UnitEditor.tsx tabs array
const tabs = [
  // ... existing tabs
  { id: 'new', label: 'New Tab', component: NewTab }
];
```

### 5. Implementing a New Auto-Allocation Pattern
```typescript
// In utils/armorAllocation.ts
export const allocateArmorNewPattern = (
  unit: EditableUnit,
  totalPoints: number
): ArmorAllocation => {
  // Your allocation logic
  return {
    head: { front: 9 },
    center_torso: { front: 20, rear: 10 },
    // ... etc
  };
};

// Add to UI in ArmorAllocationPanel.tsx
```

## Debugging Tips

### 1. Enable Debug Mode
```typescript
// In browser console
localStorage.setItem('debug', 'true');

// Now you can access:
window.__UNIT_STATE__      // Current unit state
window.__VALIDATION__      // Validation results
window.__UNDO_STACK__      // Undo/redo history
```

### 2. Common Issues and Solutions

#### Equipment Not Showing
```typescript
// Check these in order:
1. Equipment in equipmentData.ts?
2. Correct tech_base and rules_level?
3. Filters in EquipmentDatabase component?
4. Console errors?
```

#### Validation Not Working
```typescript
// Debug steps:
1. Add console.log in validateUnit()
2. Check ValidationState in React DevTools
3. Verify unit structure matches EditableUnit interface
```

#### Drag and Drop Issues
```typescript
// Common fixes:
1. Check dataTransfer format matches
2. Verify drop zone has preventDefault()
3. Check if location accepts equipment type
4. Test in different browsers
```

### 3. Performance Profiling
```typescript
// Add performance markers
performance.mark('operation-start');
// ... your code
performance.mark('operation-end');
performance.measure('operation', 'operation-start', 'operation-end');

// View in Chrome DevTools Performance tab
```

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test ArmorAllocationPanel

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Writing Tests
```typescript
// Component test example
import { render, fireEvent } from '@testing-library/react';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  it('should handle user interaction', () => {
    const mockHandler = jest.fn();
    const { getByRole } = render(
      <YourComponent onSomething={mockHandler} />
    );
    
    fireEvent.click(getByRole('button'));
    expect(mockHandler).toHaveBeenCalled();
  });
});

// Utility test example
import { yourUtility } from './yourUtility';

describe('yourUtility', () => {
  it('should calculate correctly', () => {
    const result = yourUtility(input);
    expect(result).toEqual(expectedOutput);
  });
});
```

## Code Style Guide

### TypeScript Best Practices
```typescript
// ✅ DO: Use explicit types
const calculateWeight = (equipment: Equipment[]): number => {
  return equipment.reduce((sum, item) => sum + item.tons, 0);
};

// ❌ DON'T: Use any
const calculateWeight = (equipment: any) => {
  // ...
};

// ✅ DO: Use interfaces for object shapes
interface UnitStats {
  tonnage: number;
  speed: number;
}

// ✅ DO: Use enums for constants
enum LocationType {
  HEAD = 'head',
  CENTER_TORSO = 'center_torso',
  // ...
}
```

### React Best Practices
```typescript
// ✅ DO: Use functional components
export const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  // ...
};

// ✅ DO: Memoize expensive operations
const expensiveValue = useMemo(() => {
  return calculateExpensive(data);
}, [data]);

// ✅ DO: Use proper event handler naming
const handleClick = () => {};
const handleChange = () => {};

// ❌ DON'T: Mutate state directly
// Wrong:
unit.armor = newArmor;

// ✅ Correct:
onUnitChange({ armor: newArmor });
```

## Deployment

### Building for Production
```bash
# Build the application
npm run build

# Test the production build
npm run start

# Export static site
npm run export
```

### Environment Variables
```bash
# .env.local (create this file)
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_ENABLE_DEBUG=false
```

## Troubleshooting Common Problems

### Problem: "Cannot find module" errors
```bash
# Solution 1: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Solution 2: Check tsconfig paths
# Ensure paths in tsconfig.json match actual directories
```

### Problem: State not updating
```typescript
// Check for these common issues:
1. Using stale closure values
2. Not spreading objects correctly
3. Mutating state instead of creating new objects

// Example fix:
// Wrong:
const handleUpdate = () => {
  unit.equipment.push(newItem); // Mutation!
  onUnitChange(unit);
};

// Correct:
const handleUpdate = () => {
  onUnitChange({
    ...unit,
    equipment: [...unit.equipment, newItem]
  });
};
```

### Problem: Performance issues
```typescript
// Common solutions:
1. Add React.memo to expensive components
2. Use useMemo for expensive calculations
3. Implement virtual scrolling for long lists
4. Debounce rapid state updates
```

## Getting Help

### Documentation Hierarchy
1. **README.md** - Overview and status
2. **TECHNICAL_ARCHITECTURE.md** - System design
3. **IMPLEMENTATION_INSIGHTS.md** - Lessons learned
4. **NEXT_STEPS_CONTEXT.md** - Future features
5. **DEVELOPER_GUIDE.md** - This file

### Key Concepts to Understand
1. **EditableUnit** - Core data structure
2. **Validation System** - Multi-level validation
3. **State Management** - Immutable updates
4. **Component Props Pattern** - Consistent interface

### Where to Look for Examples
- **Simple Component**: `ArmorValue.tsx`
- **Complex Component**: `EquipmentDatabase.tsx`
- **State Management**: `UnitEditor.tsx`
- **Validation**: `unitValidation.ts`
- **Drag & Drop**: `CriticalSlotGrid.tsx`

## Next Developer Checklist

When picking up this project:

- [ ] Run the development server
- [ ] Explore `/customizer` to understand the editor
- [ ] Read `EditableUnit` interface in `types/index.ts`
- [ ] Review `UnitEditor.tsx` for state management
- [ ] Check `NEXT_STEPS_CONTEXT.md` for remaining work
- [ ] Run tests to ensure everything works
- [ ] Try creating a sample mech in the editor
- [ ] Review browser console for any errors

## Final Tips

1. **Start Small**: Make small changes and test frequently
2. **Use TypeScript**: Let the type system guide you
3. **Check Existing Patterns**: Follow established patterns
4. **Test Edge Cases**: BattleTech has many special rules
5. **Ask Questions**: The domain is complex, clarification helps

Remember: The codebase is 99% complete with full MegaMekLab parity. The remaining 1% consists of optional enhancements that go beyond the original functionality.
