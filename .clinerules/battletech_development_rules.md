# BattleTech Editor Development Rules

## Code Architecture Guidelines

### Service Extraction Rules
- Always follow SOLID principles when creating new services
- Each service should have a single, clear responsibility
- Use dependency injection for testability
- Implement proper error handling and logging
- Extract services in logical phases (50-800 lines per service)

### BattleTech Rule Implementation
- All construction rules must follow official BattleTech TechManual specifications
- Weight calculations must use proper multipliers for component types
- Armor allocation must respect location-specific maximums (Head: 9 points max)
- Engine rating constraints must be enforced (max 400, tonnage × walk MP)
- Heat sink minimums must be validated (minimum 10 total)

### Equipment Management
- Equipment allocation must validate location restrictions
- Special components (Endo Steel, Ferro-Fibrous, Jump Jets) require factory pattern
- Unique IDs must be generated to prevent duplication bugs
- Equipment transfer validation required for unit regeneration scenarios

### Service Naming Conventions
- Services should end with descriptive suffixes: `Service`, `Manager`, `Calculator`, `Validator`
- Use clear, BattleTech-specific naming: `BattleTechConstructionRules`, `SpecialComponentManager`
- Interface names should describe the contract: `WeightBreakdown`, `ArmorCalculation`

### Refactoring Process
1. Identify cohesive functionality blocks (400-800 lines)
2. Extract to dedicated service with SOLID compliance
3. Update UnitCriticalManager to delegate to service
4. Add comprehensive TypeScript types and interfaces
5. Document the service in REFACTORING_PROGRESS.md

### Testing Requirements
- Each service must be independently testable
- Mock dependencies for isolation
- Test edge cases for BattleTech rule violations
- Validate error handling and recovery

### Documentation Standards
- Follow the 6-document structure (PROJECT_OVERVIEW, TECHNICAL_ARCHITECTURE, etc.)
- Update REFACTORING_PROGRESS.md after each phase completion
- Include code examples in service documentation
- Document BattleTech rule implementations with references

### Error Handling
- Use Result patterns for validation operations
- Provide detailed error messages with rule violations
- Include suggestions for fixing construction issues
- Log important operations for debugging

### Performance Considerations
- Cache expensive calculations where appropriate
- Use efficient algorithms for weight and armor calculations
- Minimize object creation in hot paths
- Profile services for performance bottlenecks
