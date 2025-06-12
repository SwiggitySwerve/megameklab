# MegaMekLab Implementation - Technical Architecture

## Overview
This document captures the technical architecture, patterns, and design decisions for the MegaMekLab implementation to facilitate future development.

## Architecture Patterns

### Component Structure
```
pages/                    # Next.js page routes
├── api/                 # API endpoints (future)
├── compendium/          # Unit/equipment browsing
├── customizer/          # Main editor interface
├── equipment/           # Equipment database
└── units/              # Unit details/listing

components/
├── common/             # Shared UI components
├── comparison/         # Unit comparison (future)
├── compendium/         # Compendium-specific
├── customizer/         # Customizer main
├── demo/              # Demo components
├── editor/            # Editor components
│   ├── advanced/      # Advanced unit types
│   ├── armor/         # Armor allocation
│   ├── criticals/     # Critical slots
│   ├── equipment/     # Equipment management
│   ├── multiunit/     # Multi-unit (future)
│   ├── structure/     # Structure/chassis
│   └── tabs/          # Main editor tabs
├── equipment/         # Equipment browsing
└── units/            # Unit display

utils/
├── armorAllocation*   # Armor calculation logic
├── batchOperations    # Batch editing (partial)
├── equipmentData      # Equipment database
├── unitConverter      # Unit format conversion
├── unitValidation     # Validation rules
└── unitExportImport*  # Import/export logic
```

### State Management

#### Current Pattern
- React useState/useReducer for component state
- Props drilling for shared state
- Context API for theme/user preferences

#### EditableUnit State Flow
```typescript
// Main state container in UnitEditor.tsx
const [unit, setUnit] = useState<EditableUnit>(initialUnit);

// Update propagation
const handleUnitChange = (updates: Partial<EditableUnit>) => {
  setUnit(prev => ({ ...prev, ...updates }));
  // Trigger validation
  validateUnit(unit);
  // Update undo/redo stack
  undoRedoManager.push(unit);
};

// Tab components receive handlers
<StructureArmorTab 
  unit={unit}
  onUnitChange={handleUnitChange}
/>
```

### Data Models

#### Core Unit Structure
```typescript
interface EditableUnit {
  // Identity
  id: string;
  chassis: string;
  model: string;
  
  // Technical specs
  mass: number;
  tech_base: string;
  rules_level: string;
  
  // Components
  armorAllocation: ArmorAllocation;
  equipmentPlacements: EquipmentPlacement[];
  criticalSlots: CriticalSlot[];
  
  // Metadata
  selectedQuirks: string[];
  fluffData: FluffData;
  validationState: ValidationState;
  editorMetadata: EditorMetadata;
}
```

#### Key Patterns
1. **Immutable Updates**: Always create new objects
2. **Validation on Change**: Real-time validation
3. **Undo/Redo Stack**: Command pattern
4. **Dirty State Tracking**: For save prompts

### Component Patterns

#### Tab Components
Each tab follows a consistent pattern:
```typescript
interface TabProps {
  unit: EditableUnit;
  onUnitChange: (updates: Partial<EditableUnit>) => void;
  readOnly?: boolean;
}

const TabComponent: React.FC<TabProps> = ({ unit, onUnitChange, readOnly }) => {
  // Local state for UI
  const [localState, setLocalState] = useState();
  
  // Handlers update both local and parent state
  const handleChange = (field: string, value: any) => {
    setLocalState(value);
    onUnitChange({ [field]: value });
  };
  
  return (/* UI */);
};
```

#### Drag and Drop Pattern
Used in Equipment and Critical tabs:
```typescript
const handleDragStart = (e: DragEvent, item: Equipment) => {
  e.dataTransfer.setData('equipment', JSON.stringify(item));
  e.dataTransfer.effectAllowed = 'move';
};

const handleDrop = (e: DragEvent, location: string) => {
  e.preventDefault();
  const item = JSON.parse(e.dataTransfer.getData('equipment'));
  
  // Validate placement
  if (canPlaceEquipment(item, location)) {
    placeEquipment(item, location);
  }
};
```

### Validation System

#### Multi-Level Validation
```typescript
interface ValidationState {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// Validation runs on every change
const validateUnit = (unit: EditableUnit): ValidationState => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Weight validation
  if (calculateTotalWeight(unit) > unit.mass) {
    errors.push({ type: 'OVERWEIGHT', message: '...' });
  }
  
  // Tech level validation
  validateTechLevel(unit, errors, warnings);
  
  // Critical space validation
  validateCriticalSpace(unit, errors, warnings);
  
  return { 
    isValid: errors.length === 0,
    errors,
    warnings
  };
};
```

### Performance Optimizations

#### Memoization
```typescript
// Expensive calculations are memoized
const maxArmor = useMemo(() => 
  calculateMaxArmor(unit.mass, unit.armorType),
  [unit.mass, unit.armorType]
);

// Component memoization
const MemoizedArmorDiagram = React.memo(ArmorDiagram, (prev, next) => {
  return prev.armorAllocation === next.armorAllocation &&
         prev.readOnly === next.readOnly;
});
```

#### Lazy Loading
```typescript
// Equipment database loaded on demand
const EquipmentDatabase = lazy(() => 
  import('./EquipmentDatabase')
);

// Heavy components loaded when needed
const CampaignManager = lazy(() => 
  import('./CampaignManager')
);
```

### File Format Handling

#### Import/Export Architecture
```typescript
// Strategy pattern for different formats
interface FileHandler {
  canHandle(file: File): boolean;
  import(file: File): Promise<EditableUnit>;
  export(unit: EditableUnit): Blob;
}

const handlers: FileHandler[] = [
  new MTFHandler(),    // .mtf files
  new BLKHandler(),    // .blk files
  new JSONHandler(),   // .json files
  new XMLHandler(),    // .xml files
];

// Auto-detect format
const importUnit = async (file: File): Promise<EditableUnit> => {
  const handler = handlers.find(h => h.canHandle(file));
  if (!handler) throw new Error('Unsupported format');
  return handler.import(file);
};
```

### Testing Strategy

#### Component Testing
```typescript
// Example test pattern
describe('ArmorAllocationPanel', () => {
  it('should allocate armor correctly', () => {
    const unit = createMockUnit();
    const onArmorChange = jest.fn();
    
    const { getByRole } = render(
      <ArmorAllocationPanel 
        unit={unit}
        onArmorChange={onArmorChange}
      />
    );
    
    fireEvent.click(getByRole('button', { name: 'Auto-Allocate' }));
    
    expect(onArmorChange).toHaveBeenCalledWith(
      expect.objectContaining({
        head: { front: 9 },
        center_torso: { front: 20, rear: 10 }
      })
    );
  });
});
```

#### Integration Testing
```typescript
// Full editor flow testing
it('should create a valid mech', async () => {
  const { container } = render(<UnitEditor />);
  
  // Configure chassis
  await configureChasis(container, { tonnage: 50 });
  
  // Add equipment
  await addEquipment(container, 'Medium Laser', 'Right Arm');
  
  // Allocate armor
  await allocateArmor(container, 'Maximum Protection');
  
  // Validate result
  const validation = await getValidation(container);
  expect(validation.isValid).toBe(true);
});
```

### API Design (Future)

#### RESTful Endpoints
```typescript
// Unit operations
app.get('/api/units', getAllUnits);
app.get('/api/units/:id', getUnit);
app.post('/api/units', createUnit);
app.put('/api/units/:id', updateUnit);
app.delete('/api/units/:id', deleteUnit);

// Equipment database
app.get('/api/equipment', getEquipment);
app.get('/api/equipment/categories', getCategories);

// Validation
app.post('/api/validate', validateUnit);

// Export
app.post('/api/export/:format', exportUnit);
```

#### WebSocket for Collaboration
```typescript
// Real-time collaboration
io.on('connection', (socket) => {
  socket.on('join-session', (sessionId) => {
    socket.join(sessionId);
  });
  
  socket.on('unit-change', (change) => {
    // Apply operational transform
    const transformed = ot.transform(change);
    
    // Broadcast to other users
    socket.to(change.sessionId).emit('remote-change', transformed);
  });
});
```

### Security Considerations

#### Input Validation
```typescript
// Sanitize all user inputs
const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    return DOMPurify.sanitize(input);
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (typeof input === 'object') {
    return Object.entries(input).reduce((acc, [key, value]) => {
      acc[key] = sanitizeInput(value);
      return acc;
    }, {});
  }
  return input;
};
```

#### Authentication (Future)
```typescript
// JWT-based auth
const authenticateUser = async (req: Request) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new UnauthorizedError();
  
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  return await User.findById(payload.userId);
};
```

### Deployment Architecture

#### Current (Static)
```
Vercel/Netlify
├── Static HTML/JS/CSS
├── Client-side routing
└── Local storage only
```

#### Future (Full-Stack)
```
Load Balancer
├── Web Servers (Next.js)
│   ├── SSR/SSG pages
│   ├── API routes
│   └── WebSocket server
├── Database (PostgreSQL)
│   ├── Units table
│   ├── Users table
│   └── Sessions table
├── Cache (Redis)
│   ├── Session data
│   ├── Equipment cache
│   └── Validation cache
└── Object Storage (S3)
    ├── Unit files
    ├── User uploads
    └── Export cache
```

### Code Quality Standards

#### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

#### ESLint Rules
```javascript
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "react/prop-types": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### Performance Metrics

#### Target Metrics
- Initial Load: < 3s
- Time to Interactive: < 5s
- Equipment Search: < 100ms
- Validation: < 50ms
- Export: < 1s

#### Monitoring (Future)
```typescript
// Performance tracking
const trackPerformance = (metric: string, value: number) => {
  analytics.track('performance', {
    metric,
    value,
    timestamp: Date.now(),
    userAgent: navigator.userAgent
  });
};

// Usage
const startTime = performance.now();
const result = await heavyOperation();
trackPerformance('heavy_operation_time', performance.now() - startTime);
```

## Conclusion

This architecture provides a solid foundation for the remaining 1% implementation. The modular design, consistent patterns, and clear separation of concerns make it straightforward to add collaborative features, cloud storage, and multi-unit management without disrupting existing functionality.

Key strengths:
- Type-safe throughout with TypeScript
- Modular component architecture
- Consistent state management patterns
- Comprehensive validation system
- Performance-optimized rendering
- Extensible file format handling

Areas for future improvement:
- Global state management (Redux/Zustand)
- Server-side rendering for SEO
- Progressive Web App features
- Offline-first architecture
- Real-time collaboration infrastructure
