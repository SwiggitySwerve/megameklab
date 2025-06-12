# MegaMekLab Implementation - Next Steps Context Document

## Current Status Summary
- **Overall Completion**: 99%
- **Core Features**: 100% Complete
- **Remaining Work**: Optional enhancements beyond MegaMekLab parity

## Context for Remaining 1% Implementation

### 1. Collaborative Editing Support

#### Technical Requirements
- **Real-time synchronization**: WebSocket or Server-Sent Events
- **Conflict resolution**: Operational Transformation (OT) or CRDTs
- **User presence**: Show who's editing what
- **Permissions**: Owner, editor, viewer roles

#### Implementation Approach
```typescript
// Example structure for collaborative state
interface CollaborativeSession {
  sessionId: string;
  unitId: string;
  users: Map<string, UserPresence>;
  operations: OperationalTransform[];
  version: number;
}

interface UserPresence {
  userId: string;
  name: string;
  color: string;
  cursor?: { location: string; position: number };
  selection?: { start: number; end: number };
}
```

#### Key Integration Points
- `UnitEditor.tsx` - Main editor component
- `undoRedoManager.ts` - Needs to handle remote operations
- All tab components need presence awareness
- Equipment/Critical drag operations need locking

#### Libraries to Consider
- **Yjs**: CRDT-based collaborative editing
- **ShareJS/OT.js**: Operational transformation
- **Socket.io**: Real-time communication
- **Liveblocks**: Collaborative infrastructure

### 2. Cloud Save Integration

#### Storage Options
1. **Firebase Firestore**
   - Real-time sync built-in
   - User authentication
   - Offline support
   
2. **AWS S3 + DynamoDB**
   - S3 for unit files
   - DynamoDB for metadata
   - Lambda for processing

3. **Supabase**
   - PostgreSQL-based
   - Real-time subscriptions
   - Built-in auth

#### Data Model
```typescript
interface CloudUnit {
  id: string;
  userId: string;
  unit: EditableUnit;
  metadata: {
    name: string;
    chassis: string;
    tonnage: number;
    techBase: string;
    created: Date;
    modified: Date;
    tags: string[];
    shared: boolean;
    sharedWith: string[];
  };
  version: number;
  history: UnitRevision[];
}

interface UnitRevision {
  version: number;
  timestamp: Date;
  userId: string;
  changes: string; // JSON diff
}
```

#### Implementation Considerations
- Offline-first approach with sync queue
- Conflict resolution for concurrent edits
- File size optimization (compress large units)
- Version history and rollback
- Sharing and permissions

### 3. Batch Editing

#### Use Cases
- Apply quirk to multiple units
- Update tech base for a force
- Bulk armor type changes
- Mass equipment swaps

#### UI/UX Approach
```typescript
interface BatchOperation {
  type: 'quirk' | 'equipment' | 'armor' | 'tech';
  targets: string[]; // unit IDs
  operation: {
    action: 'add' | 'remove' | 'replace';
    data: any;
  };
  preview: BatchPreview;
}

interface BatchPreview {
  affected: number;
  changes: Map<string, Change[]>;
  conflicts: Conflict[];
}
```

#### Implementation in `batchOperations.ts`
- Already has basic structure
- Needs UI components
- Preview mechanism
- Undo for batch operations

### 4. Unit Comparison Tools

#### Features Needed
- Side-by-side comparison
- Difference highlighting
- Stats comparison charts
- Equipment diff view
- Cost/effectiveness analysis

#### Component Structure
```typescript
interface ComparisonView {
  units: EditableUnit[];
  mode: 'sideBySide' | 'overlay' | 'diff';
  categories: ComparisonCategory[];
  highlights: DifferenceHighlight[];
}

interface ComparisonCategory {
  name: string;
  fields: ComparisonField[];
}

interface ComparisonField {
  path: string;
  label: string;
  formatter?: (value: any) => string;
  differenceThreshold?: number;
}
```

### 5. Force Organization Charts

#### Military Structure
```
Company (12 units)
├── Lance 1 (4 units)
│   ├── Unit 1 (Command)
│   ├── Unit 2
│   ├── Unit 3
│   └── Unit 4
├── Lance 2 (4 units)
└── Lance 3 (4 units)
```

#### Data Model
```typescript
interface Force {
  id: string;
  name: string;
  type: 'lance' | 'company' | 'battalion' | 'regiment';
  units: ForceUnit[];
  subForces: Force[];
  metadata: ForceMetadata;
}

interface ForceUnit {
  unitId: string;
  role: 'command' | 'fire' | 'scout' | 'support';
  pilot?: PilotData;
}
```

#### Visualization
- Org chart view (tree/hierarchy)
- Grid view (lance cards)
- Summary statistics
- C3 network visualization
- Transport assignments

### 6. Campaign Integration

#### Campaign Features
- Unit wear and damage tracking
- Pilot advancement
- Repair and refit
- Salvage management
- Mission history

#### Data Requirements
```typescript
interface CampaignUnit extends EditableUnit {
  campaignData: {
    currentDamage: DamageState;
    pilot: CampaignPilot;
    maintenanceLog: MaintenanceEntry[];
    combatHistory: CombatRecord[];
    modifications: Modification[];
  };
}

interface CampaignPilot {
  name: string;
  callsign: string;
  skills: {
    gunnery: number;
    piloting: number;
    specialties: string[];
  };
  experience: number;
  injuries: Injury[];
}
```

## Technical Debt and Refactoring Needs

### 1. State Management
- Current: Direct React state
- Consider: Redux/Zustand for complex multi-unit state
- Needed for: Collaborative editing, campaign tracking

### 2. Performance Optimization
- Virtual scrolling for large unit lists
- Memoization of expensive calculations
- Web Workers for batch operations
- IndexedDB for offline storage

### 3. Testing Coverage
- Unit tests for batch operations
- Integration tests for collaborative features
- E2E tests for campaign workflows

## API Design for Backend Services

### REST Endpoints
```
POST   /api/units                 # Create unit
GET    /api/units                 # List units
GET    /api/units/:id             # Get unit
PUT    /api/units/:id             # Update unit
DELETE /api/units/:id             # Delete unit

POST   /api/forces                # Create force
GET    /api/forces                # List forces
PUT    /api/forces/:id            # Update force

POST   /api/collaborate/session   # Start collaborative session
WS     /api/collaborate/connect   # WebSocket for real-time

POST   /api/batch/preview         # Preview batch operation
POST   /api/batch/execute         # Execute batch operation
```

### GraphQL Alternative
```graphql
type Unit {
  id: ID!
  chassis: String!
  model: String!
  # ... full EditableUnit fields
  
  # Relationships
  force: Force
  campaign: CampaignData
  sharedWith: [User!]
}

type Query {
  units(filter: UnitFilter): [Unit!]!
  forces(userId: ID!): [Force!]!
  compareUnits(ids: [ID!]!): ComparisonResult!
}

type Mutation {
  saveUnit(unit: UnitInput!): Unit!
  batchUpdate(operations: [BatchOp!]!): BatchResult!
  shareUnit(unitId: ID!, userIds: [ID!]!): Unit!
}

type Subscription {
  unitUpdated(unitId: ID!): Unit!
  collaborativeChanges(sessionId: ID!): Change!
}
```

## UI/UX Considerations

### 1. Multi-Unit Selection
- Checkbox selection pattern
- Shift-click range selection
- Ctrl/Cmd-click individual selection
- Select all/none/invert

### 2. Collaborative Indicators
- User avatars on active components
- Cursor tracking
- Live typing indicators
- Conflict warnings

### 3. Cloud Sync Status
- Sync status indicator
- Upload/download progress
- Conflict resolution UI
- Offline mode indicator

## Development Priorities

### Phase 1: Cloud Storage (Essential)
1. Basic cloud save/load
2. User authentication
3. Unit library management
4. Share functionality

### Phase 2: Collaboration (High Value)
1. Real-time presence
2. Concurrent editing
3. Change tracking
4. Comments/annotations

### Phase 3: Batch Operations (Efficiency)
1. Multi-select UI
2. Batch preview
3. Common operations
4. Undo/redo support

### Phase 4: Advanced Features (Nice to Have)
1. Force organization
2. Unit comparison
3. Campaign tracking
4. Advanced analytics

## Resources and References

### Libraries
- **Yjs**: https://docs.yjs.dev/
- **Liveblocks**: https://liveblocks.io/
- **Supabase**: https://supabase.com/
- **Firebase**: https://firebase.google.com/

### Patterns
- **CRDT**: Conflict-free Replicated Data Types
- **OT**: Operational Transformation
- **Event Sourcing**: For campaign history
- **CQRS**: For complex state management

### MegaMekLab Integration
- File format compatibility (.mtf, .blk)
- Import/export preservation
- Metadata handling
- Version compatibility

## Testing Strategy

### Unit Tests
- Batch operation logic
- Conflict resolution algorithms
- Force organization rules
- Campaign calculations

### Integration Tests
- Cloud sync flows
- Collaborative editing scenarios
- Import/export with MegaMekLab files
- Multi-user workflows

### E2E Tests
- Full campaign workflow
- Force management
- Collaborative editing session
- Offline/online transitions

## Conclusion

This document provides the complete context needed to implement the remaining 1% of features. These are all enhancements beyond basic MegaMekLab functionality but would significantly improve the user experience for serious BattleTech players managing multiple units and campaigns.

The modular architecture already in place makes these additions straightforward to implement without disrupting the existing 99% complete functionality.
