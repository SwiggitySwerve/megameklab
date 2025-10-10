# Integration Guide: Centralized Rules and State Management

## Overview

This guide explains how to integrate the new centralized rules data providers and state management into existing code.

## New Modules Created

### 1. RulesDataProvider
**Location**: `utils/rules/RulesDataProvider.ts`

**Purpose**: Centralized component availability and compatibility rules

**Key Features**:
- Get available engines, gyros, heat sinks, structure, armor based on tech base
- Validate component compatibility with unit configuration
- Calculate component requirements (slots, weight, cost)
- Tech base compatibility checking
- Introduction years and tech levels

**Usage Example**:
```typescript
import { RulesDataProvider, ConstructionContext } from './utils/rules/RulesDataProvider';

// Create context
const context: ConstructionContext = {
  techBase: 'Inner Sphere',
  era: '3025',
  techLevel: 'Standard',
  mechTonnage: 50,
  engineRating: 200
};

// Get available engines
const engines = RulesDataProvider.getAvailableEngineTypes(context);
engines.forEach(engine => {
  console.log(`${engine.displayName}: ${engine.available ? 'Available' : 'Not Available'}`);
  if (engine.available) {
    console.log(`  Slots: ${engine.requirements.criticalSlots}`);
    console.log(`  Weight: ${engine.requirements.weight} tons`);
  }
});

// Validate component compatibility
const validation = RulesDataProvider.validateComponentCompatibility(
  'engine',
  'XL (IS)',
  context
);

if (!validation.isCompatible) {
  console.log('Issues:', validation.issues);
}
```

### 2. EquipmentRulesProvider
**Location**: `utils/rules/EquipmentRulesProvider.ts`

**Purpose**: Equipment filtering and compatibility rules

**Key Features**:
- Filter equipment by tech base, era, category
- Validate equipment compatibility with unit
- Get equipment upgrade paths (IS to Clan)
- Calculate mixed tech penalties
- Equipment location restrictions

**Usage Example**:
```typescript
import { EquipmentRulesProvider, EquipmentFilterCriteria } from './utils/rules/EquipmentRulesProvider';

// Filter equipment
const criteria: EquipmentFilterCriteria = {
  techBase: 'IS',
  category: 'Weapons',
  era: '3050',
  searchTerm: 'laser'
};

const filtered = EquipmentRulesProvider.filterEquipment(allEquipment, criteria);

// Validate equipment compatibility
const compatibility = EquipmentRulesProvider.validateEquipmentCompatibility(
  equipment,
  context
);

// Get upgrade options
const upgradePath = EquipmentRulesProvider.getEquipmentUpgradePaths(
  currentEquipment,
  allEquipment,
  'Clan'
);

console.log('Upgrade options:', upgradePath.upgradeOptions.length);
console.log('Cost difference:', upgradePath.costDifference);
console.log('Improvements:', upgradePath.performanceImprovement);
```

### 3. ConfigurationStateManager
**Location**: `utils/state/ConfigurationStateManager.ts`

**Purpose**: Centralized configuration state management with persistence

**Key Features**:
- Single source of truth for configuration
- Selection memory (preserves choices when temporarily unavailable)
- Auto-save with debouncing
- State validation
- History tracking
- Subscriber notifications

**Usage Example**:
```typescript
import { ConfigurationStateManager } from './utils/state/ConfigurationStateManager';

// Create state manager
const stateManager = new ConfigurationStateManager({
  tonnage: 50,
  techBase: 'Inner Sphere'
}, {
  storageKey: 'my-unit-config',
  autoSave: true,
  saveDelay: 1000
});

// Subscribe to changes
const unsubscribe = stateManager.subscribe((state, event) => {
  console.log('State changed:', state);
  console.log('Changed fields:', event?.changedFields);
  updateUI(state);
});

// Update component selection with memory
stateManager.updateComponentSelection('engine', 'XL (IS)', true);

// Update multiple fields
stateManager.updateMultipleFields({
  'tonnage': 55,
  'components.gyro': 'Compact'
});

// Try to restore remembered selection
const availableEngines = getAvailableEngines();
const remembered = stateManager.tryRestoreRememberedSelection(
  'engine',
  availableEngines
);

if (remembered) {
  stateManager.updateComponentSelection('engine', remembered);
}

// Get current state
const currentState = stateManager.getCurrentState();

// Undo last change
stateManager.undo();

// Export/import state
const exported = stateManager.exportState();
localStorage.setItem('backup', exported);
stateManager.importState(exported);
```

## Migration Guide

### Migrating from ConstructionRulesEngine

**Old Code**:
```typescript
import { ConstructionRulesEngine } from './utils/constructionRules/ConstructionRulesEngine';

const engine = new ConstructionRulesEngine();
const engines = engine.getAvailableEngineTypes(techBase);
```

**New Code**:
```typescript
import { RulesDataProvider } from './utils/rules/RulesDataProvider';

const context = { techBase, era, techLevel, mechTonnage };
const engines = RulesDataProvider.getAvailableEngineTypes(context);
```

### Migrating from EquipmentIntegrationService

**Old Code**:
```typescript
import { EquipmentIntegrationService } from './utils/constructionRules/EquipmentIntegrationService';

const service = new EquipmentIntegrationService();
const compatible = service.validateEquipmentCompatibility(equipment, context);
```

**New Code**:
```typescript
import { EquipmentRulesProvider } from './utils/rules/EquipmentRulesProvider';

const compatible = EquipmentRulesProvider.validateEquipmentCompatibility(equipment, context);
```

### Migrating State Management

**Old Code**:
```typescript
// Scattered across components
const [engine, setEngine] = useState('Standard');
const [gyro, setGyro] = useState('Standard');

useEffect(() => {
  localStorage.setItem('engine', engine);
}, [engine]);

// When options change, selection is lost
useEffect(() => {
  if (!availableEngines.includes(engine)) {
    setEngine('Standard'); // Lost user's choice!
  }
}, [availableEngines]);
```

**New Code**:
```typescript
// Centralized in ConfigurationStateManager
import { ConfigurationStateManager } from './utils/state/ConfigurationStateManager';

const stateManager = useRef(new ConfigurationStateManager()).current;

// Subscribe to changes
useEffect(() => {
  return stateManager.subscribe((state) => {
    setEngine(state.components.engine);
    setGyro(state.components.gyro);
  });
}, []);

// Update selection with memory
const handleEngineChange = (newEngine) => {
  stateManager.updateComponentSelection('engine', newEngine, true);
};

// When options change, try to restore
useEffect(() => {
  const remembered = stateManager.tryRestoreRememberedSelection(
    'engine',
    availableEngines.map(e => e.id)
  );
  
  if (remembered && availableEngines.some(e => e.id === remembered)) {
    stateManager.updateComponentSelection('engine', remembered);
  }
}, [availableEngines]);
```

## Component Integration Examples

### Dropdown with Selection Memory

```typescript
import { ConfigurationStateManager } from './utils/state/ConfigurationStateManager';
import { RulesDataProvider, ConstructionContext } from './utils/rules/RulesDataProvider';

function EngineSelector({ stateManager, context }) {
  const [selectedEngine, setSelectedEngine] = useState('Standard');
  const [availableEngines, setAvailableEngines] = useState([]);
  
  // Subscribe to state changes
  useEffect(() => {
    return stateManager.subscribe((state) => {
      setSelectedEngine(state.components.engine);
    });
  }, [stateManager]);
  
  // Update available engines when context changes
  useEffect(() => {
    const engines = RulesDataProvider.getAvailableEngineTypes(context);
    const available = engines.filter(e => e.available);
    setAvailableEngines(available);
    
    // Try to restore remembered selection
    const remembered = stateManager.tryRestoreRememberedSelection(
      'engine',
      available.map(e => e.id)
    );
    
    if (remembered) {
      setSelectedEngine(remembered);
    } else if (!available.some(e => e.id === selectedEngine)) {
      // Current selection not available, pick first available
      setSelectedEngine(available[0]?.id || 'Standard');
    }
  }, [context, stateManager]);
  
  const handleChange = (e) => {
    const newEngine = e.target.value;
    stateManager.updateComponentSelection('engine', newEngine, true);
  };
  
  return (
    <select value={selectedEngine} onChange={handleChange}>
      {availableEngines.map(engine => (
        <option key={engine.id} value={engine.id}>
          {engine.displayName}
          {engine.requirements && ` (${engine.requirements.criticalSlots} slots)`}
        </option>
      ))}
    </select>
  );
}
```

### Equipment Browser with Filtering

```typescript
import { EquipmentRulesProvider } from './utils/rules/EquipmentRulesProvider';

function EquipmentBrowser({ allEquipment, context }) {
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  
  useEffect(() => {
    const criteria = {
      techBase: context.techBase === 'Inner Sphere' ? 'IS' : 'Clan',
      category: category !== 'all' ? category : undefined,
      era: context.era,
      searchTerm
    };
    
    const filtered = EquipmentRulesProvider.filterEquipment(
      allEquipment,
      criteria
    );
    
    // Further filter by compatibility
    const compatible = filtered.filter(eq => {
      const validation = EquipmentRulesProvider.validateEquipmentCompatibility(
        eq,
        context
      );
      return validation.isCompatible;
    });
    
    setFilteredEquipment(compatible);
  }, [allEquipment, context, searchTerm, category]);
  
  return (
    <div>
      <input
        type="text"
        placeholder="Search equipment..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="all">All Categories</option>
        <option value="Weapons">Weapons</option>
        <option value="Electronics">Electronics</option>
      </select>
      
      <div className="equipment-list">
        {filteredEquipment.map(eq => (
          <EquipmentItem key={eq.id} equipment={eq} />
        ))}
      </div>
    </div>
  );
}
```

## Best Practices

### 1. Use Context Objects
Always pass a complete `ConstructionContext` to rules providers:
```typescript
const context: ConstructionContext = {
  techBase: 'Inner Sphere',
  era: '3050',
  techLevel: 'Tournament',
  mechTonnage: 50,
  engineRating: 200,
  currentComponents: {
    engine: 'Standard',
    gyro: 'Standard'
  }
};
```

### 2. Preserve User Selections
Always use selection memory when updating components:
```typescript
// DO THIS:
stateManager.updateComponentSelection('engine', 'XL (IS)', true);

// NOT THIS:
stateManager.updateComponentSelection('engine', 'XL (IS)', false);
```

### 3. Validate Before Applying
Always validate states and components before applying:
```typescript
const validation = stateManager.validateState(newState);
if (!validation.isValid) {
  console.error('Invalid state:', validation.errors);
  return;
}

stateManager.updateState(newState);
```

### 4. Use Subscribers Instead of Polling
Subscribe to state changes instead of checking state repeatedly:
```typescript
// DO THIS:
useEffect(() => {
  return stateManager.subscribe((state) => {
    updateUI(state);
  });
}, []);

// NOT THIS:
useEffect(() => {
  const interval = setInterval(() => {
    const state = stateManager.getCurrentState();
    updateUI(state);
  }, 100);
  return () => clearInterval(interval);
}, []);
```

### 5. Batch Multiple Updates
When updating multiple fields, use `updateMultipleFields`:
```typescript
// DO THIS:
stateManager.updateMultipleFields({
  tonnage: 55,
  'components.engine': 'XL (IS)',
  'components.gyro': 'Compact',
  walkMP: 4
});

// NOT THIS:
stateManager.updateState({ tonnage: 55 });
stateManager.updateComponentSelection('engine', 'XL (IS)');
stateManager.updateComponentSelection('gyro', 'Compact');
stateManager.updateState({ walkMP: 4 });
```

## Testing

### Unit Tests for Rules

```typescript
import { RulesDataProvider } from './utils/rules/RulesDataProvider';

describe('RulesDataProvider', () => {
  it('should return available engines for Inner Sphere', () => {
    const context = {
      techBase: 'Inner Sphere',
      era: '3025',
      techLevel: 'Standard',
      mechTonnage: 50
    };
    
    const engines = RulesDataProvider.getAvailableEngineTypes(context);
    
    expect(engines).toBeDefined();
    expect(engines.length).toBeGreaterThan(0);
    
    const standard = engines.find(e => e.id === 'Standard');
    expect(standard?.available).toBe(true);
    
    const clanXL = engines.find(e => e.id === 'XL (Clan)');
    expect(clanXL?.available).toBe(false);
  });
});
```

### Integration Tests for State Management

```typescript
import { ConfigurationStateManager } from './utils/state/ConfigurationStateManager';

describe('ConfigurationStateManager', () => {
  it('should remember and restore selections', () => {
    const manager = new ConfigurationStateManager();
    
    // Set engine to XL
    manager.updateComponentSelection('engine', 'XL (IS)', true);
    expect(manager.getComponentSelection('engine')).toBe('XL (IS)');
    
    // Change to something else
    manager.updateComponentSelection('engine', 'Standard', true);
    expect(manager.getComponentSelection('engine')).toBe('Standard');
    
    // Should remember XL (IS)
    expect(manager.getRememberedSelection('engine')).toBe('Standard');
    
    // Try to restore XL (IS)
    const restored = manager.tryRestoreRememberedSelection('engine', ['Standard', 'XL (IS)']);
    expect(restored).toBe('Standard');
  });
});
```

## Troubleshooting

### Issue: Selection Gets Lost
**Problem**: Dropdown resets when tech base changes

**Solution**: Use selection memory
```typescript
stateManager.updateComponentSelection('engine', 'XL (IS)', true);
// When options change:
const remembered = stateManager.tryRestoreRememberedSelection('engine', availableOptions);
```

### Issue: State Not Persisting
**Problem**: Configuration not saved to localStorage

**Solution**: Check auto-save is enabled
```typescript
const manager = new ConfigurationStateManager(initialState, {
  autoSave: true,
  saveDelay: 1000
});
```

### Issue: Validation Errors
**Problem**: State updates rejected by validation

**Solution**: Check validation results
```typescript
const validation = stateManager.validateState(newState);
console.log('Errors:', validation.errors);
console.log('Warnings:', validation.warnings);
```

## Performance Considerations

### Debouncing
State manager uses debounced auto-save (default 1 second):
```typescript
// Multiple rapid updates only save once
stateManager.updateState({ tonnage: 45 });
stateManager.updateState({ tonnage: 50 });
stateManager.updateState({ tonnage: 55 });
// Only saves once after 1 second of inactivity
```

### Subscriber Notifications
Subscribers are called synchronously, so keep callbacks fast:
```typescript
stateManager.subscribe((state) => {
  // DO: Fast updates
  setLocalState(state);
  
  // DON'T: Heavy calculations
  // recalculateEntireUnit(state); // Do this async
});
```

### Memoization
Rules providers are static, so results can be memoized:
```typescript
const memoizedEngines = useMemo(() => {
  return RulesDataProvider.getAvailableEngineTypes(context);
}, [context.techBase, context.era]);
```

## Summary

The new architecture provides:
1. **Isolated Rules Logic** - RulesDataProvider and EquipmentRulesProvider
2. **Centralized State Management** - ConfigurationStateManager
3. **Selection Memory** - Preserves user choices across option changes
4. **Proper Persistence** - Debounced auto-save with validation
5. **Clear API** - Simple, consistent interfaces

Use these modules to replace scattered validation and state management logic throughout the application.
