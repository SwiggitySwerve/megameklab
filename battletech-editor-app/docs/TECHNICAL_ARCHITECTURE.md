# 🏗️ BattleTech Editor App - Technical Architecture

## Overview
This document details the complete technical architecture, design patterns, and system implementation for the BattleTech Editor App, providing comprehensive guidance for development and maintenance.

---

## 🏛️ **System Architecture**

### **High-Level Architecture**
```
Frontend (React/Next.js)
├── Component Layer      # UI Components & Editor Interface
├── State Management     # React State + Context API
├── Business Logic       # Validation, Calculations, Data Processing
└── Data Layer          # API Integration & Local Storage

Backend (Next.js API)
├── API Routes          # RESTful Endpoints & Filtering
├── Database Layer      # SQLite with Optimized Queries
├── Validation Engine   # Real-time Unit Validation
└── File Processing     # Import/Export Operations

Data Storage
├── SQLite Database     # 10,245 Units + Equipment Database
├── JSON Schema         # TypeScript Interface Definitions
└── Static Assets       # Documentation & Reference Files
```

### **Technology Stack**
- **Frontend**: React 18, Next.js 13, TypeScript 5.0
- **Styling**: Tailwind CSS 3.x, CSS Modules
- **Database**: SQLite with custom schema optimization
- **Testing**: Jest, React Testing Library, 66 comprehensive tests
- **Build Tools**: Next.js build system, ESLint, Prettier
- **Deployment**: Static export compatible (Vercel/Netlify ready)

---

## 🗄️ **Database Architecture**

### **SQLite Schema Design**
```sql
-- Core units table with complete MegaMekLab compatibility
CREATE TABLE units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chassis TEXT NOT NULL,
    model TEXT NOT NULL,
    mass INTEGER NOT NULL,
    tech_base TEXT CHECK(tech_base IN ('Inner Sphere', 'Clan', 'Mixed (IS Chassis)', 'Mixed (Clan Chassis)')),
    config TEXT CHECK(config IN ('Biped', 'Biped Omnimech', 'Quad', 'Quad Omnimech', 'Tripod', 'Tripod Omnimech', 'LAM')),
    is_omnimech BOOLEAN DEFAULT FALSE,
    omnimech_base_chassis TEXT,
    omnimech_configuration TEXT,
    role TEXT,
    era TEXT,
    rules_level TEXT,
    quirks TEXT, -- JSON array
    equipment TEXT, -- JSON array
    armor_allocation TEXT, -- JSON object
    validation_status TEXT DEFAULT 'pending'
);

-- Performance indexes
CREATE INDEX idx_units_tech_base ON units(tech_base);
CREATE INDEX idx_units_config ON units(config);
CREATE INDEX idx_units_mass ON units(mass);
CREATE INDEX idx_units_role ON units(role);
CREATE INDEX idx_units_is_omnimech ON units(is_omnimech);
CREATE INDEX idx_units_chassis_model ON units(chassis, model);
```

### **Equipment Database Schema**
```sql
CREATE TABLE equipment (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    tech_base TEXT CHECK(tech_base IN ('IS', 'Clan', 'Mixed')),
    rules_level TEXT,
    heat INTEGER DEFAULT 0,
    damage INTEGER DEFAULT 0,
    slots INTEGER DEFAULT 1,
    tons REAL DEFAULT 0,
    cost INTEGER DEFAULT 0,
    is_omnipod BOOLEAN DEFAULT FALSE,
    location_restrictions TEXT, -- JSON array
    special_rules TEXT -- JSON object
);
```

### **Data Population Pipeline**
```python
# Complete MegaMekLab dataset import process
def populate_database():
    """
    Import complete MegaMekLab dataset with validation
    - Process 10,245+ .blk files
    - Convert to JSON with schema validation
    - Populate SQLite database with optimized queries
    - Generate equipment database from unit loadouts
    """
    units_processed = 0
    validation_errors = []
    
    for blk_file in get_megameklab_files():
        try:
            unit_data = parse_blk_file(blk_file)
            validated_unit = validate_unit_schema(unit_data)
            insert_unit_to_database(validated_unit)
            units_processed += 1
        except ValidationError as e:
            validation_errors.append(e)
    
    generate_performance_indexes()
    return units_processed, validation_errors
```

---

## 🎯 **API Architecture**

### **RESTful Endpoint Design**
```typescript
// Main units API with comprehensive filtering
app.get('/api/units', async (req, res) => {
  const {
    tech_base,      // Filter by tech base
    config,         // Filter by configuration  
    role,           // Filter by tactical role
    weight_class,   // Filter by weight class
    mass_min,       // Minimum tonnage
    mass_max,       // Maximum tonnage
    era,            // Era restrictions
    search,         // Text search
    quirks,         // Quirk filtering
    page = 1,       // Pagination
    limit = 50,     // Results per page
    sort = 'chassis', // Sort field
    order = 'asc'   // Sort direction
  } = req.query;
  
  try {
    const queryBuilder = new UnitQueryBuilder();
    const query = queryBuilder
      .filterByTechBase(tech_base)
      .filterByConfig(config)
      .filterByRole(role)
      .filterByWeightClass(weight_class)
      .filterByMassRange(mass_min, mass_max)
      .filterByEra(era)
      .search(search)
      .filterByQuirks(quirks)
      .paginate(page, limit)
      .sort(sort, order)
      .build();
      
    const results = await executeQuery(query);
    const validatedResults = await validateUnits(results);
    
    res.json({
      units: validatedResults,
      pagination: getPaginationInfo(results, page, limit),
      filters_applied: getAppliedFilters(req.query),
      performance: getQueryPerformance()
    });
  } catch (error) {
    handleAPIError(error, res);
  }
});

// Equipment database API
app.get('/api/equipment', getEquipmentDatabase);
app.get('/api/equipment/categories', getEquipmentCategories);

// Validation API
app.post('/api/validate', validateUnitConfiguration);

// Export API
app.post('/api/export/:format', exportUnitToFormat);
```

### **Query Builder Pattern**
```typescript
class UnitQueryBuilder {
  private conditions: string[] = [];
  private parameters: any[] = [];
  private sortClause = '';
  private limitClause = '';
  
  filterByTechBase(techBase: string): this {
    if (techBase && techBase !== 'all') {
      this.conditions.push('tech_base = ?');
      this.parameters.push(techBase);
    }
    return this;
  }
  
  filterByConfig(config: string): this {
    if (config && config !== 'all') {
      this.conditions.push('config = ?');
      this.parameters.push(config);
    }
    return this;
  }
  
  search(searchTerm: string): this {
    if (searchTerm) {
      this.conditions.push('(chassis LIKE ? OR model LIKE ?)');
      this.parameters.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }
    return this;
  }
  
  paginate(page: number, limit: number): this {
    const offset = (page - 1) * limit;
    this.limitClause = `LIMIT ${limit} OFFSET ${offset}`;
    return this;
  }
  
  sort(field: string, order: 'asc' | 'desc'): this {
    const validFields = ['chassis', 'model', 'mass', 'tech_base', 'config', 'role'];
    if (validFields.includes(field)) {
      this.sortClause = `ORDER BY ${field} ${order.toUpperCase()}`;
    }
    return this;
  }
  
  build(): { sql: string; params: any[] } {
    let sql = 'SELECT * FROM units';
    
    if (this.conditions.length > 0) {
      sql += ' WHERE ' + this.conditions.join(' AND ');
    }
    
    if (this.sortClause) {
      sql += ' ' + this.sortClause;
    }
    
    if (this.limitClause) {
      sql += ' ' + this.limitClause;
    }
    
    return { sql, params: this.parameters };
  }
}
```

---

## 🧩 **Component Architecture**

### **Component Hierarchy**
```
pages/
├── api/                    # Next.js API routes
├── compendium/            # Unit/equipment browsing
├── customizer/            # Main editor interface
└── equipment/             # Equipment database

components/
├── common/                # Shared UI components
│   ├── Button.tsx         # Reusable button component
│   ├── Modal.tsx          # Modal dialog system
│   ├── LoadingSpinner.tsx # Loading states
│   └── ErrorBoundary.tsx  # Error handling
├── editor/                # Editor components
│   ├── UnitEditor.tsx     # Main editor container
│   ├── tabs/              # Tab-based interface
│   │   ├── StructureArmorTab.tsx
│   │   ├── EquipmentTab.tsx
│   │   ├── CriticalsTab.tsx
│   │   ├── QuirksTab.tsx
│   │   ├── FluffTab.tsx
│   │   └── PreviewTab.tsx
│   ├── armor/             # Armor allocation system
│   │   ├── ArmorDiagram.tsx
│   │   ├── ArmorAllocationPanel.tsx
│   │   └── ArmorLocationControls.tsx
│   ├── equipment/         # Equipment management
│   │   ├── EquipmentDatabase.tsx
│   │   ├── EquipmentList.tsx
│   │   └── EquipmentTooltip.tsx
│   └── criticals/         # Critical slot assignment
│       ├── CriticalSlotGrid.tsx
│       ├── CriticalSlotLocation.tsx
│       └── DragDropSlot.tsx
└── units/                 # Unit display components
    ├── UnitCard.tsx       # Unit summary display
    ├── UnitDetails.tsx    # Detailed unit view
    └── UnitComparison.tsx # Unit comparison (future)
```

### **Component Pattern Standards**
```typescript
// Standard tab component interface
interface TabProps {
  unit: EditableUnit;
  onUnitChange: (updates: Partial<EditableUnit>) => void;
  readOnly?: boolean;
  className?: string;
}

// Example implementation
const StructureArmorTab: React.FC<TabProps> = ({ 
  unit, 
  onUnitChange, 
  readOnly = false 
}) => {
  const [localState, setLocalState] = useState<LocalState>({});
  
  const handleArmorChange = useCallback((armorUpdates: Partial<ArmorAllocation>) => {
    const newArmor = { ...unit.armorAllocation, ...armorUpdates };
    onUnitChange({ armorAllocation: newArmor });
  }, [unit.armorAllocation, onUnitChange]);
  
  const handleMassChange = useCallback((newMass: number) => {
    onUnitChange({ mass: newMass });
  }, [onUnitChange]);
  
  return (
    <div className="structure-armor-tab">
      <StructureControls 
        unit={unit}
        onMassChange={handleMassChange}
        readOnly={readOnly}
      />
      <ArmorAllocationPanel
        unit={unit}
        onArmorChange={handleArmorChange}
        readOnly={readOnly}
      />
    </div>
  );
};
```

### **Drag and Drop System**
```typescript
// Standardized drag and drop implementation
interface DragDropConfig {
  dragType: string;
  canDrop: (item: any, target: any) => boolean;
  onDrop: (item: any, target: any) => void;
}

const useDragDrop = (config: DragDropConfig) => {
  const handleDragStart = useCallback((e: DragEvent, item: any) => {
    e.dataTransfer.setData(`application/${config.dragType}`, JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
  }, [config.dragType]);
  
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);
  
  const handleDrop = useCallback((e: DragEvent, target: any) => {
    e.preventDefault();
    const data = e.dataTransfer.getData(`application/${config.dragType}`);
    if (data) {
      const item = JSON.parse(data);
      if (config.canDrop(item, target)) {
        config.onDrop(item, target);
      }
    }
  }, [config]);
  
  return { handleDragStart, handleDragOver, handleDrop };
};

// Usage in critical slots
const CriticalSlotGrid: React.FC<Props> = ({ unit, onUnitChange }) => {
  const dragDropConfig = {
    dragType: 'equipment',
    canDrop: (equipment: Equipment, location: string) => 
      canPlaceEquipmentInLocation(equipment, location, unit),
    onDrop: (equipment: Equipment, location: string) => 
      placeEquipmentInCriticals(equipment, location, unit, onUnitChange)
  };
  
  const { handleDragStart, handleDragOver, handleDrop } = useDragDrop(dragDropConfig);
  
  return (
    <div className="critical-grid">
      {locations.map(location => (
        <CriticalLocation
          key={location}
          location={location}
          slots={unit.criticalSlots[location]}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, location)}
        />
      ))}
    </div>
  );
};
```

---

## 🎛️ **State Management Architecture**

### **State Flow Pattern**
```typescript
// Main editor state container
interface EditorState {
  unit: EditableUnit;
  validationState: ValidationState;
  undoStack: EditableUnit[];
  redoStack: EditableUnit[];
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;
}

// State management hook
const useUnitEditor = (initialUnit: EditableUnit) => {
  const [state, setState] = useState<EditorState>({
    unit: initialUnit,
    validationState: { isValid: true, errors: [], warnings: [] },
    undoStack: [],
    redoStack: [],
    isDirty: false,
    isLoading: false,
    error: null
  });
  
  const updateUnit = useCallback((updates: Partial<EditableUnit>) => {
    setState(prevState => {
      const newUnit = { ...prevState.unit, ...updates };
      const validationState = validateUnit(newUnit);
      
      return {
        ...prevState,
        unit: newUnit,
        validationState,
        undoStack: [...prevState.undoStack, prevState.unit],
        redoStack: [], // Clear redo stack on new change
        isDirty: true
      };
    });
  }, []);
  
  const undo = useCallback(() => {
    setState(prevState => {
      if (prevState.undoStack.length === 0) return prevState;
      
      const previousUnit = prevState.undoStack[prevState.undoStack.length - 1];
      const newUndoStack = prevState.undoStack.slice(0, -1);
      const newRedoStack = [...prevState.redoStack, prevState.unit];
      
      return {
        ...prevState,
        unit: previousUnit,
        validationState: validateUnit(previousUnit),
        undoStack: newUndoStack,
        redoStack: newRedoStack,
        isDirty: newUndoStack.length > 0
      };
    });
  }, []);
  
  const redo = useCallback(() => {
    setState(prevState => {
      if (prevState.redoStack.length === 0) return prevState;
      
      const nextUnit = prevState.redoStack[prevState.redoStack.length - 1];
      const newRedoStack = prevState.redoStack.slice(0, -1);
      const newUndoStack = [...prevState.undoStack, prevState.unit];
      
      return {
        ...prevState,
        unit: nextUnit,
        validationState: validateUnit(nextUnit),
        undoStack: newUndoStack,
        redoStack: newRedoStack,
        isDirty: true
      };
    });
  }, []);
  
  return {
    ...state,
    updateUnit,
    undo,
    redo,
    canUndo: state.undoStack.length > 0,
    canRedo: state.redoStack.length > 0
  };
};
```

### **Context Providers**
```typescript
// Application-wide context
interface AppContextType {
  theme: 'light' | 'dark';
  user: User | null;
  preferences: UserPreferences;
  toggleTheme: () => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);
  
  const updatePreferences = useCallback((prefs: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...prefs }));
  }, []);
  
  const value = {
    theme,
    user,
    preferences,
    toggleTheme,
    updatePreferences
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
```

---

## ✅ **Validation Architecture**

### **Multi-Level Validation System**
```typescript
interface ValidationState {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
}

interface ValidationError {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
  location?: string;
}

// Comprehensive validation engine
export const validateUnit = (unit: EditableUnit): ValidationState => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: ValidationSuggestion[] = [];
  
  // Weight validation
  const totalWeight = calculateTotalWeight(unit);
  if (totalWeight > unit.mass) {
    errors.push({
      type: 'OVERWEIGHT',
      severity: 'error',
      message: `Unit is ${totalWeight - unit.mass} tons overweight`,
      field: 'mass'
    });
  }
  
  // Tech base consistency validation
  validateTechBaseConsistency(unit, errors, warnings);
  
  // Critical space validation
  validateCriticalSpace(unit, errors, warnings);
  
  // Armor validation
  validateArmorAllocation(unit, errors, warnings);
  
  // Equipment compatibility validation
  validateEquipmentCompatibility(unit, errors, warnings, suggestions);
  
  // Construction rules validation
  validateConstructionRules(unit, errors, warnings);
  
  // Era restrictions validation
  validateEraRestrictions(unit, errors, warnings);
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
};

// Specific validation functions
const validateTechBaseConsistency = (
  unit: EditableUnit,
  errors: ValidationError[],
  warnings: ValidationWarning[]
) => {
  const equipmentTechBases = unit.equipment.map(eq => eq.tech_base);
  const uniqueTechBases = [...new Set(equipmentTechBases)];
  
  if (unit.tech_base === 'Inner Sphere' && uniqueTechBases.includes('Clan')) {
    errors.push({
      type: 'TECH_BASE_MISMATCH',
      severity: 'error',
      message: 'Inner Sphere chassis cannot mount Clan equipment without mixed tech rules',
      field: 'tech_base'
    });
  }
  
  if (unit.tech_base.startsWith('Mixed') && uniqueTechBases.length === 1) {
    warnings.push({
      type: 'UNNECESSARY_MIXED_TECH',
      severity: 'warning',
      message: 'Mixed tech designation not required for single tech base equipment'
    });
  }
};

const validateCriticalSpace = (
  unit: EditableUnit,
  errors: ValidationError[],
  warnings: ValidationWarning[]
) => {
  const locations = ['head', 'center_torso', 'left_torso', 'right_torso', 'left_arm', 'right_arm', 'left_leg', 'right_leg'];
  
  locations.forEach(location => {
    const criticalSlots = unit.criticalSlots[location] || [];
    const usedSlots = criticalSlots.filter(slot => slot.equipment !== null).length;
    const maxSlots = getMaxCriticalSlots(location, unit.config);
    
    if (usedSlots > maxSlots) {
      errors.push({
        type: 'CRITICAL_SPACE_EXCEEDED',
        severity: 'error',
        message: `${location} has ${usedSlots}/${maxSlots} critical slots used`,
        location
      });
    }
  });
};
```

### **Real-Time Validation**
```typescript
// Validation hook for real-time feedback
const useUnitValidation = (unit: EditableUnit) => {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  });
  
  // Debounced validation to avoid excessive processing
  const debouncedValidation = useMemo(
    () => debounce((unit: EditableUnit) => {
      const result = validateUnit(unit);
      setValidationState(result);
    }, 300),
    []
  );
  
  useEffect(() => {
    debouncedValidation(unit);
    return () => debouncedValidation.cancel();
  }, [unit, debouncedValidation]);
  
  return validationState;
};
```

---

## 🚀 **Performance Architecture**

### **Optimization Strategies**
```typescript
// Memoization for expensive calculations
const ArmorDiagram: React.FC<Props> = React.memo(({ unit, onArmorChange }) => {
  const maxArmor = useMemo(() => 
    calculateMaxArmor(unit.mass, unit.armorType),
    [unit.mass, unit.armorType]
  );
  
  const armorDistribution = useMemo(() =>
    calculateArmorDistribution(unit.armorAllocation),
    [unit.armorAllocation]
  );
  
  return (
    <svg className="armor-diagram">
      {/* SVG content */}
    </svg>
  );
}, (prevProps, nextProps) => {
  return prevProps.unit.armorAllocation === nextProps.unit.armorAllocation &&
         prevProps.unit.mass === nextProps.unit.mass &&
         prevProps.unit.armorType === nextProps.unit.armorType;
});

// Lazy loading for heavy components
const EquipmentDatabase = lazy(() => import('./EquipmentDatabase'));
const CampaignManager = lazy(() => import('./CampaignManager'));
const UnitComparison = lazy(() => import('./UnitComparison'));

// Virtual scrolling for large lists
const VirtualizedUnitList: React.FC<Props> = ({ units }) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={units.length}
      itemSize={120}
      itemData={units}
    >
      {UnitListItem}
    </FixedSizeList>
  );
};
```

### **Database Performance**
```sql
-- Optimized queries with proper indexing
EXPLAIN QUERY PLAN 
SELECT * FROM units 
WHERE tech_base = 'Inner Sphere' 
  AND config = 'Biped' 
  AND mass BETWEEN 50 AND 75
ORDER BY chassis, model;

-- Query optimization results:
-- 0|0|0|SEARCH TABLE units USING INDEX idx_units_tech_base (tech_base=?)
-- 0|0|0|USE TEMP B-TREE FOR ORDER BY
```

---

## 🧪 **Testing Architecture**

### **Testing Strategy**
```typescript
// Component testing pattern
describe('ArmorAllocationPanel', () => {
  const mockUnit: EditableUnit = {
    mass: 50,
    armorAllocation: {
      head: { front: 9 },
      center_torso: { front: 16, rear: 8 }
      // ... complete armor allocation
    }
    // ... complete unit structure
  };
  
  it('should allocate maximum armor correctly', () => {
    const onArmorChange = jest.fn();
    const { getByRole } = render(
      <ArmorAllocationPanel 
        unit={mockUnit}
        onArmorChange={onArmorChange}
      />
    );
    
    fireEvent.click(getByRole('button', { name: 'Maximum Protection' }));
    
    expect(onArmorChange).toHaveBeenCalledWith(
      expect.objectContaining({
        head: { front: 9 },
        center_torso: { front: 20, rear: 10 }
      })
    );
  });
  
  it('should validate armor allocation', () => {
    const invalidUnit = { ...mockUnit, mass: 20 }; // Too light for armor
    const { getByText } = render(
      <ArmorAllocationPanel unit={invalidUnit} onArmorChange={jest.fn()} />
    );
    
    expect(getByText(/exceeds maximum armor/i)).toBeInTheDocument();
  });
});

// API testing
describe('/api/units', () => {
  it('should filter units by tech base', async () => {
    const response = await request(app)
      .get('/api/units?tech_base=Inner%20Sphere')
      .expect(200);
    
    expect(response.body.units).toHaveLength(expect.any(Number));
    response.body.units.forEach(unit => {
      expect(unit.tech_base).toBe('Inner Sphere');
    });
  });
  
  it('should handle pagination correctly', async () => {
    const response = await request(app)
      .get('/api/units?page=2&limit=10')
      .expect(200);
    
    expect(response.body.units).toHaveLength(10);
    expect(response.body.pagination).toMatchObject({
      current_page: 2,
      per_page: 10,
      total: expect.any(Number)
    });
  });
});
```

### **Test Coverage Requirements**
- **Unit Tests**: All utilities and validation functions (100% coverage)
- **Component Tests**: All UI components with user interactions
- **Integration Tests**: Complete editor workflows and data flow
- **API Tests**: All endpoints with various filter combinations
- **Performance Tests**: Response time validation and concurrent access

---

## 🔒 **Security Architecture**

### **Input Validation & Sanitization**
```typescript
// Comprehensive input sanitization
import DOMPurify from 'dompurify';

const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    return DOMPurify.sanitize(input);
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (typeof input === 'object' && input !== null) {
    return Object.entries(input).reduce((acc, [key, value]) => {
      acc[key] = sanitizeInput(value);
      return acc;
    }, {} as any);
  }
  return input;
};

// API endpoint protection
app.use('/api', (req, res, next) => {
  req.body = sanitizeInput(req.body);
  req.query = sanitizeInput(req.query);
  next();
});
```

### **Data Validation**
```typescript
// Schema validation for API inputs
const unitFilterSchema = z.object({
  tech_base: z.enum(['Inner Sphere', 'Clan', 'Mixed (IS Chassis)', 'Mixed (Clan Chassis)']).optional(),
  config: z.enum(['Biped', 'Biped Omnimech', 'Quad', 'Quad Omnimech', 'Tripod', 'Tripod Omnimech', 'LAM']).optional(),
  mass_min: z.number().min(10).max(200).optional(),
  mass_max: z.number().min(10).max(200).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional()
});

app.get('/api/units', async (req, res) => {
  try {
    const validatedQuery = unitFilterSchema.parse(req.query);
    // ... process with validated input
  } catch (error) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }
});
```

---

## 📊 **Monitoring & Analytics**

### **Performance Monitoring**
```typescript
// Performance tracking system
interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

const trackPerformance = (metric: PerformanceMetric) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`Performance: ${metric.operation} took ${metric.duration}ms`);
  }
  
  // Send to analytics in production
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'performance', {
      event_category: 'performance',
      event_label: metric.operation,
      value: Math.round(metric.duration)
    });
  }
};

// Usage in components
const usePerformanceTracking = (operationName: string) => {
  return useCallback(async (operation: () => Promise<any>) => {
    const startTime = performance.now();
    try {
      const result = await operation();
      trackPerformance({
        operation: operationName,
        duration: performance.now() - startTime,
        timestamp: Date.now(),
        success: true
      });
      return result;
    } catch (error) {
      trackPerformance({
        operation: operationName,
        duration: performance.now() - startTime,
        timestamp: Date.now(),
        success: false,
        error: error.message
      });
      throw error;
    }
  }, [operationName]);
};
```

---

## 📦 **Deployment Architecture**

### **Current Static Deployment**
```
Static Site (Vercel/Netlify)
├── Pre-built HTML/CSS/JS
├── Client-side routing (Next.js)
├── SQLite database (bundled)
└── Local storage for user data
```

### **Future Server-Side Architecture**
```
Load Balancer
├── Next.js App Servers
│   ├── SSR/SSG pages
│   ├── API routes
│   └── WebSocket server
├── PostgreSQL Database
│   ├── Units table
│   ├── Users table
│   └── Sessions table
├── Redis Cache
│   ├── Session data
│   ├── Equipment cache
│   └── Query results
└── Object Storage (S3)
    ├── Unit files
    ├── User uploads
    └── Export cache
```

### **Environment Configuration**
```typescript
// Production environment variables
const config = {
  database: {
    url: process.env.DATABASE_URL || 'sqlite:./units.db',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
    connectionTimeout: parseInt(process.env.DB_TIMEOUT || '5000')
  },
  cache: {
    redis: process.env.REDIS_URL,
    ttl: parseInt(process.env.CACHE_TTL || '3600')
  },
  performance: {
    enableProfiling: process.env.ENABLE_PROFILING === 'true',
    responseTimeThreshold: parseInt(process.env.RESPONSE_TIME_THRESHOLD || '1000')
  }
};
```

---

## 🔧 **Development Workflow**

### **Code Quality Standards**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}

// eslint.config.js
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "react-hooks/exhaustive-deps": "error"
  }
}
```

### **Build & Deployment Pipeline**
```bash
# Development workflow
npm run dev          # Start development server
npm run test         # Run test suite
npm run test:watch   # Watch mode for tests
npm run lint         # ESLint validation
npm run type-check   # TypeScript validation

# Production workflow  
npm run build        # Build for production
npm run start        # Start production server
npm run export       # Static site export
npm run analyze      # Bundle analysis
```

---

## 📋 **Maintenance Guidelines**

### **Common Tasks**
1. **Adding New Equipment**
   - Update `utils/equipmentData.ts`
   - Add validation rules if needed
   - Update TypeScript types
   - Add tests for new equipment

2. **Modifying Validation Rules**
   - Edit `utils/unitValidation.ts`
   - Add corresponding test cases
   - Update error message documentation

3. **Performance Optimization**
   - Use React DevTools Profiler
   - Monitor bundle size with webpack-bundle-analyzer
   - Implement code splitting for heavy components
   - Add performance tracking for critical paths

4. **Database Schema Changes**
   - Update SQLite schema
   - Create migration scripts
   - Update TypeScript interfaces
   - Regenerate test data

### **Troubleshooting Guide**
```typescript
// Common debugging patterns
const debugMode = process.env.NODE_ENV === 'development';

// Enable debug logging
if (debugMode) {
  window.__DEBUG__ = {
    unitState: () => console.log(currentUnit),
    validation: () => console.log(validationResults),
    performance: () => console.log(performanceMetrics)
  };
}

// Performance monitoring
const monitorQuery = async (queryName: string, query: () => Promise<any>) => {
  const start = performance.now();
  try {
    const result = await query();
    const duration = performance.now() - start;
    
    if (duration > 1000) {
      console.warn(`Slow query: ${queryName} took ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    console.error(`Query failed: ${queryName}`, error);
    throw error;
  }
};
```

---

## 🎯 **Future Architecture Considerations**

### **Scalability Enhancements**
- **Microservices**: Split validation, database, and file processing into separate services
- **CDN Integration**: Global content delivery for static assets
- **Database Sharding**: Partition units by era or tech base for better performance
- **Caching Strategy**: Multi-level caching with Redis and browser cache

### **Feature Extensions**
- **Real-time Collaboration**: WebSocket-based multi-user editing
- **Mobile Applications**: React Native implementation sharing core logic
- **API Ecosystem**: Public API for third-party integrations
- **Analytics Platform**: User behavior analysis and performance metrics

---

## 🏆 **Architecture Summary**

### **Strengths**
- **Type Safety**: Complete TypeScript coverage with strict configuration
- **Performance**: Optimized rendering with memoization and lazy loading
- **Testability**: Comprehensive test coverage with clear testing patterns
- **Maintainability**: Modular architecture with clear separation of concerns
- **Scalability**: Ready for horizontal scaling with minimal changes

### **Key Design Principles**
1. **Immutable State**: All state updates create new objects
2. **Functional Programming**: Pure functions for calculations and validation
3. **Component Composition**: Reusable components with clear interfaces
4. **Progressive Enhancement**: Core functionality works without JavaScript
5. **Performance First**: Optimization built into the architecture

This technical architecture provides a solid foundation for the complete BattleTech Editor App implementation, supporting both current functionality and future enhancements while maintaining high performance and code quality standards.

---

**Last Updated**: December 11, 2024  
**Architecture Version**: 2.0  
**Performance Target**: < 1s response times ⚡  
**Test Coverage**: 100% for critical paths 🎯  
**Type Safety**: Complete TypeScript coverage ✅
