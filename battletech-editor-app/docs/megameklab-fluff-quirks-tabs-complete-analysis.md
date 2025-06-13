# MegaMekLab Fluff & Quirks Tabs Complete Analysis

## Overview
This document provides a comprehensive analysis of the MegaMekLab Java implementation of the Fluff and Quirks tabs and a detailed plan for implementing them in our React application.

## Fluff Tab Architecture

### 1. Main Structure (FluffTab.java)
The Fluff tab is organized into two columns:

```
+----------------------------------------------------------+
|                        Fluff Tab                          |
+----------------------------------------------------------+
| +------------------------+ | +------------------------+ |
| | Left Column            | | | Right Column           | |
| |                        | | |                        | |
| | [Set Fluff Image]      | | | [Fluff Image Display]  | |
| | [Import Fluff Image]   | | |   300x300 max          | |
| | [Remove Fluff Image]   | | |                        | |
| |                        | | | ---------------------- | |
| | Capabilities:          | | | Manufacturer: [_____]  | |
| | [________________]     | | | Primary Factory: [___] | |
| | [________________]     | | | Use: [___] (ships)     | |
| | [________________]     | | | Length/Width/Height    | |
| |                        | | |                        | |
| | Overview:              | | | System Components:     | |
| | [________________]     | | | System | Manuf | Model | |
| | [________________]     | | | Engine | [___] | [___] | |
| |                        | | | Armor  | [___] | [___] | |
| | Deployment:            | | | Comms  | [___] | [___] | |
| | [________________]     | | | etc...                 | |
| |                        | | |                        | |
| | History:               | | |                        | |
| | [________________]     | | |                        | |
| |                        | | |                        | |
| | Notes:                 | | |                        | |
| | [________________]     | | |                        | |
| +------------------------+ | +------------------------+ |
+----------------------------------------------------------+
```

### 2. Left Column Features

#### Text Areas
- **Capabilities**: Unit's tactical capabilities
- **Overview**: General description
- **Deployment**: Deployment history
- **History**: Manufacturing/combat history
- **Notes**: Player notes

#### Image Controls
- **Set Fluff Image**: Load from file
- **Import Fluff Image**: Copy from another unit
- **Remove Fluff Image**: Clear current image

### 3. Right Column Features

#### Fluff Image
- Maximum 300x300 pixels
- Auto-scales larger images
- Base64 encoded storage
- Supported formats: PNG, JPG, GIF

#### Unit Details (non-Infantry)
- **Manufacturer**: Company name
- **Primary Factory**: Location
- **Use**: Ship purpose (spacecraft only)
- **Dimensions**: Length/Width/Height (spacecraft)

#### System Components
Table showing manufacturer and model for:
- Engine
- Armor
- Communications
- Targeting
- Jump Jets (if applicable)
- Additional systems based on unit type

## Quirks Tab Architecture

### 1. Main Structure (QuirksTab.java)
Dynamic responsive layout with grouped quirks:

```
+----------------------------------------------------------+
|                       Quirks Tab                          |
+----------------------------------------------------------+
| +------------------------------------------------------+ |
| | General Quirks                                       | |
| | [ ] Easy to Maintain    [ ] Improved Targeting      | |
| | [ ] Battle Computer     [ ] Rugged                  | |
| | [ ] Command Mech        [ ] Stable                  | |
| +------------------------------------------------------+ |
|                                                          |
| +------------------------------------------------------+ |
| | ER PPC (Right Arm)                                   | |
| | [ ] Accurate Weapon     [ ] Fast Reload             | |
| | [ ] Improved Cooling    [ ] Modular Weapon          | |
| +------------------------------------------------------+ |
|                                                          |
| +------------------------------------------------------+ |
| | Medium Laser (Left Torso)                            | |
| | [ ] Accurate Weapon     [ ] Misrepaired             | |
| +------------------------------------------------------+ |
+----------------------------------------------------------+
```

### 2. Quirks Organization

#### General Quirks
- Unit-wide quirks affecting entire mech
- Grouped by category (positive/negative)
- Sorted alphabetically if enabled

#### Weapon Quirks
- Per-weapon quirks
- Grouped by weapon with location
- Include club-type misc equipment

### 3. Dynamic Layout System

#### Responsive Columns
```java
private void triggerRelayoutCheck() {
    int containerWidth = getVisibleContainerWidth();
    int availableWidth = calculateAvailableWidthInPanel(containerWidth);
    int currentNumCols = calculateNumberOfColumns(availableWidth, globalMaxItemWidth);
    
    if (currentNumCols != lastCalculatedNumCols) {
        relayoutAllGroups(currentNumCols);
    }
}
```

Features:
- Calculates optimal column count
- Maintains consistent quirk width
- Reflows on window resize
- Preserves grouping structure

## React Implementation Plan

### Phase 1: Fluff Tab Core

#### 1.1 Fluff Editor Component
```typescript
interface FluffEditorProps {
  unit: EditableUnit;
  onFluffChange: (fluff: UnitFluff) => void;
  readOnly?: boolean;
}

interface UnitFluff {
  capabilities: string;
  overview: string;
  deployment: string;
  history: string;
  notes: string;
  manufacturer?: string;
  primaryFactory?: string;
  use?: string;
  dimensions?: {
    length: string;
    width: string;
    height: string;
  };
  systemComponents?: SystemComponent[];
  fluffImage?: string; // Base64
}
```

#### 1.2 Fluff Image Manager
```typescript
interface FluffImageManagerProps {
  currentImage?: string;
  onImageChange: (image: string | null) => void;
  maxWidth?: number;
  maxHeight?: number;
}
```

Features:
- Drag & drop support
- Image preview
- Auto-resize large images
- Format validation
- Base64 encoding

#### 1.3 System Components Editor
```typescript
interface SystemComponentsEditorProps {
  components: SystemComponent[];
  onChange: (components: SystemComponent[]) => void;
  unitType: string;
}

interface SystemComponent {
  system: SystemType;
  manufacturer: string;
  model: string;
}

enum SystemType {
  ENGINE = 'ENGINE',
  ARMOR = 'ARMOR',
  COMMUNICATIONS = 'COMMUNICATIONS',
  TARGETING = 'TARGETING',
  JUMPJET = 'JUMPJET',
  // etc...
}
```

### Phase 2: Quirks Tab Core

#### 2.1 Quirks Manager Component
```typescript
interface QuirksManagerProps {
  unit: EditableUnit;
  onQuirksChange: (quirks: UnitQuirks) => void;
  layout?: 'responsive' | 'fixed';
}

interface UnitQuirks {
  general: QuirkSelection[];
  weapons: WeaponQuirks[];
}

interface QuirkSelection {
  id: string;
  name: string;
  category: string;
  enabled: boolean;
  disallowedReason?: string;
}
```

#### 2.2 Responsive Quirk Layout
```typescript
interface ResponsiveQuirkLayoutProps {
  groups: QuirkGroup[];
  onQuirkToggle: (groupId: string, quirkId: string, enabled: boolean) => void;
  minQuirkWidth?: number;
  gap?: number;
}
```

Features:
- Auto-calculate columns
- Maintain consistent widths
- Group preservation
- Smooth reflow animation

#### 2.3 Quirk Validation
```typescript
interface QuirkValidator {
  isAllowed(quirk: Quirk, unit: EditableUnit): boolean;
  getDisallowedReason(quirk: Quirk, unit: EditableUnit): string | null;
  getConflicts(quirk: Quirk, currentQuirks: Quirk[]): Quirk[];
  validateWeaponQuirk(quirk: Quirk, weapon: Weapon, unit: EditableUnit): boolean;
}
```

### Phase 3: Enhanced Features

#### 3.1 Rich Text Editor for Fluff
- Markdown support
- Basic formatting toolbar
- Character/word count
- Auto-save drafts
- Templates for common patterns

#### 3.2 Image Gallery
```typescript
interface FluffImageGalleryProps {
  unitType: string;
  onSelectImage: (imageUrl: string) => void;
  customImages?: ImageRecord[];
}
```

Features:
- Preset unit images
- Custom image library
- Image search/filter
- Cloud storage integration

#### 3.3 Quirks Enhancement
- Quirk search/filter
- Quirk effects preview
- Bulk operations
- Import/export quirk sets
- Quirk recommendations based on unit

## Component Architecture

### Fluff Tab
```
FluffTab
├── FluffControls
│   ├── ImageUploadButton
│   ├── ImageImportButton
│   └── RemoveImageButton
├── FluffContent
│   ├── LeftColumn
│   │   ├── CapabilitiesEditor
│   │   ├── OverviewEditor
│   │   ├── DeploymentEditor
│   │   ├── HistoryEditor
│   │   └── NotesEditor
│   └── RightColumn
│       ├── FluffImageDisplay
│       ├── ManufacturerDetails
│       │   ├── ManufacturerField
│       │   ├── FactoryField
│       │   └── DimensionsFields
│       └── SystemComponentsTable
└── FluffValidation
```

### Quirks Tab
```
QuirksTab
├── QuirksLayout
│   ├── GeneralQuirksGroup
│   │   └── QuirkCheckbox[]
│   └── WeaponQuirksGroups
│       └── WeaponQuirkGroup[]
│           └── QuirkCheckbox[]
├── QuirksSearch
│   ├── SearchInput
│   └── CategoryFilter
└── QuirksValidation
```

## Key Implementation Details

### 1. Auto-Save Strategy
```typescript
const useAutoSave = (value: string, onSave: (value: string) => void, delay = 500) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (localValue !== value) {
        onSave(localValue);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [localValue, value, onSave, delay]);

  return [localValue, setLocalValue] as const;
};
```

### 2. Responsive Quirks Algorithm
```typescript
const calculateQuirkColumns = (
  containerWidth: number,
  minQuirkWidth: number,
  gap: number
): number => {
  const availableWidth = containerWidth - gap;
  const itemWidth = minQuirkWidth + gap;
  return Math.max(1, Math.floor(availableWidth / itemWidth));
};
```

### 3. Image Processing
```typescript
const processFluffImage = async (
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Calculate scaling
        const scale = Math.min(
          maxWidth / img.width,
          maxHeight / img.height,
          1
        );
        
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};
```

## Key Differences from MegaMekLab

### Improvements
1. **Rich Text Editing**: Markdown support for fluff text
2. **Better Image Handling**: Drag & drop, preview, gallery
3. **Smart Quirks Layout**: Better responsive design
4. **Search & Filter**: Find quirks quickly
5. **Auto-Save**: No data loss from forgetting to save

### New Features
1. **Templates**: Pre-written fluff templates
2. **AI Assistance**: Generate fluff text
3. **Image Effects**: Filters and adjustments
4. **Quirk Recommendations**: Based on unit role
5. **Version History**: Track fluff changes

## Testing Strategy

### Unit Tests
- Image processing functions
- Quirk validation logic
- Text field character limits
- Responsive layout calculations

### Integration Tests
- Fluff save/load cycle
- Quirk selection persistence
- Image import/export
- System component updates

### E2E Tests
- Complete fluff editing flow
- Quirk management workflow
- Image upload and display
- Cross-tab synchronization

This comprehensive analysis provides the foundation for implementing modern fluff and quirks management that improves upon MegaMekLab's functionality while maintaining full compatibility.
