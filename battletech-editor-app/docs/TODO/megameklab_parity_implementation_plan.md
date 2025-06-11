# MegaMekLab Web Application Parity Implementation Plan

## Executive Summary

This document outlines a comprehensive plan to achieve full parity with the legacy Java MegaMekLab application for BattleTech unit customization. Based on detailed analysis of the existing codebase, this plan addresses the sophisticated constraint systems, UI/UX patterns, and automation features that make MegaMekLab the gold standard for BattleTech unit construction.

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [UI/UX Architecture](#uiux-architecture)
3. [Constraint Engine System](#constraint-engine-system)
4. [Critical Slot Management](#critical-slot-management)
5. [Automation Systems](#automation-systems)
6. [Unit Type Specific Handlers](#unit-type-specific-handlers)
7. [Data Model Enhancements](#data-model-enhancements)
8. [Implementation Phases](#implementation-phases)
9. [Technical Specifications](#technical-specifications)
10. [Risk Assessment](#risk-assessment)

## Current State Analysis

### Existing Web Application Capabilities
- **Basic UI Components**: Equipment picker, critical slots display, unit information panel
- **Simple Validation**: Weight limits, basic slot capacity checks
- **Limited Constraints**: No sophisticated equipment placement rules
- **Manual Process**: User must handle all equipment placement manually

### Legacy MegaMekLab Capabilities (Gap Analysis)
- **Sophisticated Constraint Engine**: 2000+ lines of validation logic
- **Drag-and-Drop Interface**: Intuitive equipment placement
- **Automation Features**: Auto-fill, auto-sort, auto-compact
- **Complex Equipment Rules**: Heat sink integration, spread equipment, dependencies
- **Visual Feedback**: Location highlighting, constraint visualization
- **Unit Type Specialization**: Different rules for Mechs, Vehicles, Battle Armor

## UI/UX Architecture

### 1. Enhanced Critical Slots Panel

#### Current Implementation
```typescript
// Simple grid layout with basic slot display
const CriticalsPanel: React.FC<CriticalsPanelProps> = ({
  customizedCriticals,
  onSelectSlot
}) => {
  // Basic grid with click handlers
}
```

#### Target Implementation
```typescript
interface EnhancedCriticalsPanelProps {
  unit: CustomizableUnit;
  criticals: CriticalLocation[];
  onSlotDrop: (equipmentId: string, location: string, slotIndex: number) => PlacementResult;
  onSlotClick: (location: string, slotIndex: number) => void;
  draggedEquipment?: EquipmentItem;
  invalidLocations: Set<string>;
  highlightedSlots: SlotHighlight[];
  automationSettings: AutomationSettings;
}

const EnhancedCriticalsPanel: React.FC<EnhancedCriticalsPanelProps> = (props) => {
  // Anatomical layout with visual feedback
  // Drag-and-drop zones with collision detection
  // Visual darkening of invalid locations
  // Equipment grouping for multi-slot items
  // Real-time constraint validation
}
```

#### Key Features
- **Anatomical Layout**: Positioned panels representing mech body structure
- **Drag-and-Drop Zones**: Visual feedback for valid/invalid placements
- **Slot Highlighting**: Color-coded feedback for placement constraints
- **Equipment Grouping**: Multi-slot equipment shown as connected blocks
- **Location Status**: CASE indicators, actuator status, special equipment

### 2. Advanced Equipment Browser

#### Enhanced Filtering System
```typescript
interface EquipmentFilter {
  category: EquipmentCategory[];
  techBase: TechBase[];
  era: EraRange;
  tonnageRange: [number, number];
  criticalSlotsRange: [number, number];
  searchText: string;
  availableOnly: boolean; // Hide equipment that can't be placed
}

interface EquipmentBrowserProps {
  availableEquipment: EquipmentItem[];
  unit: CustomizableUnit;
  filters: EquipmentFilter;
  onFilterChange: (filters: EquipmentFilter) => void;
  onEquipmentSelect: (equipment: EquipmentItem) => void;
  onEquipmentDrag: (equipment: EquipmentItem) => void;
  suggestedEquipment: EquipmentSuggestion[];
}
```

#### Features
- **Smart Filtering**: Hide incompatible equipment automatically
- **Tech Level Validation**: Visual indicators for era/tech base compatibility
- **Constraint Preview**: Show where equipment can be placed before dragging
- **Equipment Suggestions**: AI-driven recommendations based on current build
- **Favorites System**: Quick access to commonly used equipment

### 3. Automation Control Panel

```typescript
interface AutomationSettings {
  autoFillUnhittables: boolean;
  autoCompact: boolean;
  autoSort: boolean;
  autoLinkEquipment: boolean;
  intelligentPlacement: boolean;
}

interface AutomationPanelProps {
  settings: AutomationSettings;
  onSettingChange: (setting: keyof AutomationSettings, value: boolean) => void;
  onFillAll: () => void;
  onFillUnhittables: () => void;
  onCompact: () => void;
  onSort: () => void;
  onReset: () => void;
  onOptimize: () => void;
}
```

## Constraint Engine System

### 1. Core Architecture

```typescript
// Base constraint interface
interface EquipmentConstraint {
  id: string;
  name: string;
  type: ConstraintType;
  priority: number;
  validator: ConstraintValidator;
  message: string;
}

enum ConstraintType {
  LOCATION_RESTRICTION = 'location_restriction',
  DEPENDENCY_REQUIREMENT = 'dependency_requirement',
  MUTUAL_EXCLUSION = 'mutual_exclusion',
  QUANTITY_LIMIT = 'quantity_limit',
  TECH_COMPATIBILITY = 'tech_compatibility',
  PHYSICAL_CONSTRAINT = 'physical_constraint'
}

interface ConstraintValidator {
  (unit: CustomizableUnit, equipment: EquipmentItem, context: PlacementContext): ConstraintResult;
}

interface ConstraintResult {
  valid: boolean;
  severity: 'error' | 'warning' | 'info';
  message?: string;
  suggestedActions?: SuggestedAction[];
}
```

### 2. Location Validation System

```typescript
class LocationValidator {
  private static readonly CONSTRAINT_RULES: Map<string, LocationConstraint> = new Map([
    ['Jump Jet', {
      validLocations: ['Left Torso', 'Right Torso', 'Center Torso', 'Left Leg', 'Right Leg'],
      invalidLocations: ['Head', 'Left Arm', 'Right Arm'],
      reason: 'Jump jets can only be mounted in torso and leg locations'
    }],
    ['Supercharger', {
      validLocations: [], // Dynamic based on engine location
      requiresCondition: (unit, location) => this.hasEngineInLocation(unit, location),
      reason: 'Supercharger must be in the same location as the engine'
    }],
    ['CASE', {
      validLocations: [], // Any location with explosive equipment
      requiresCondition: (unit, location) => this.hasExplosiveEquipment(unit, location),
      reason: 'CASE should be placed in locations with explosive equipment'
    }]
  ]);

  static validatePlacement(
    unit: CustomizableUnit, 
    equipment: EquipmentItem, 
    location: string
  ): ValidationResult {
    const constraints = this.getConstraintsForEquipment(equipment);
    const results: ConstraintResult[] = [];

    for (const constraint of constraints) {
      const result = constraint.validator(unit, equipment, { location });
      results.push(result);
    }

    return this.aggregateResults(results);
  }

  static validateJumpJets(unit: CustomizableUnit, location: string): boolean {
    const validLocations = ['Left Torso', 'Right Torso', 'Center Torso', 'Left Leg', 'Right Leg'];
    if (unit.config === 'Tripod') {
      validLocations.push('Center Leg');
    }
    return validLocations.includes(location);
  }

  static validateHeatSinkPlacement(
    unit: CustomizableUnit, 
    heatSink: EquipmentItem
  ): HeatSinkPlacementOptions {
    const engineCapacity = this.getEngineHeatSinkCapacity(unit);
    const currentEngineHeatSinks = this.getEngineHeatSinks(unit);
    
    if (currentEngineHeatSinks < engineCapacity) {
      return {
        canPlaceInEngine: true,
        availableLocations: this.getAllValidLocations(unit),
        recommendation: 'engine'
      };
    }
    
    return {
      canPlaceInEngine: false,
      availableLocations: this.getAllValidLocations(unit),
      recommendation: 'external'
    };
  }
}
```

### 3. Equipment Dependency System

```typescript
class DependencyManager {
  private static readonly DEPENDENCY_RULES: Map<string, DependencyRule[]> = new Map([
    ['Artemis IV FCS', [{
      requiresEquipment: ['LRM 5', 'LRM 10', 'LRM 15', 'LRM 20', 'SRM 2', 'SRM 4', 'SRM 6'],
      sameLocation: true,
      ratio: '1:1',
      autoLink: true
    }]],
    ['PPC Capacitor', [{
      requiresEquipment: ['PPC', 'ER PPC', 'Light PPC', 'Heavy PPC'],
      sameLocation: true,
      ratio: '1:1',
      autoLink: true
    }]],
    ['Supercharger', [{
      requiresEquipment: ['Engine'],
      sameLocation: true,
      ratio: '1:1',
      autoLink: false
    }]]
  ]);

  static validateDependencies(unit: CustomizableUnit, equipment: EquipmentItem): DependencyResult {
    const rules = this.DEPENDENCY_RULES.get(equipment.name) || [];
    const violations: DependencyViolation[] = [];

    for (const rule of rules) {
      const compatible = this.findCompatibleEquipment(unit, rule, equipment.location);
      if (compatible.length === 0) {
        violations.push({
          equipment: equipment.name,
          missingDependency: rule.requiresEquipment,
          location: equipment.location,
          severity: 'error'
        });
      }
    }

    return {
      valid: violations.length === 0,
      violations,
      suggestions: this.generateDependencySuggestions(violations)
    };
  }

  static autoLinkEquipment(unit: CustomizableUnit): LinkingResult {
    const linkings: EquipmentLink[] = [];
    const errors: LinkingError[] = [];

    // Find all equipment that can be auto-linked
    const artemisItems = this.getEquipmentByType(unit, 'Artemis IV FCS');
    const launchers = this.getEquipmentByType(unit, ['LRM', 'SRM']);

    for (const artemis of artemisItems) {
      if (artemis.linkedTo) continue; // Already linked

      const compatibleLaunchers = launchers.filter(launcher => 
        launcher.location === artemis.location && 
        !launcher.linkedTo &&
        this.isArtemisCompatible(launcher)
      );

      if (compatibleLaunchers.length > 0) {
        const bestMatch = this.selectBestLauncher(artemis, compatibleLaunchers);
        linkings.push(this.createLink(artemis, bestMatch));
      } else {
        errors.push({
          equipment: artemis.name,
          reason: 'No compatible launcher in same location',
          severity: 'warning'
        });
      }
    }

    return { linkings, errors };
  }
}
```

## Critical Slot Management

### 1. Slot Allocation Engine

```typescript
class CriticalSlotManager {
  static allocateEquipment(
    unit: CustomizableUnit,
    equipment: EquipmentItem,
    location: string,
    options: AllocationOptions = {}
  ): AllocationResult {
    
    // Validate placement constraints
    const validation = LocationValidator.validatePlacement(unit, equipment, location);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // Handle special equipment types
    if (this.isSpreadEquipment(equipment)) {
      return SpreadEquipmentManager.allocateSpreadEquipment(unit, equipment);
    }

    if (this.isHeatSink(equipment)) {
      return this.allocateHeatSink(unit, equipment, options);
    }

    // Standard contiguous slot allocation
    return this.allocateContiguousSlots(unit, equipment, location, options);
  }

  private static allocateContiguousSlots(
    unit: CustomizableUnit,
    equipment: EquipmentItem,
    location: string,
    options: AllocationOptions
  ): AllocationResult {
    
    const slotsNeeded = this.getSlotsNeeded(equipment, unit);
    const locationSlots = this.getLocationSlots(unit, location);
    
    // Find available slot range
    const slotRange = this.findAvailableSlotRange(
      locationSlots, 
      slotsNeeded, 
      options.preferredStartSlot
    );

    if (!slotRange.found) {
      // Try to make space by moving FMU equipment
      if (options.allowFMURelocation) {
        const relocated = this.relocateFMUEquipment(unit, location, slotsNeeded);
        if (relocated.success) {
          return this.allocateContiguousSlots(unit, equipment, location, {
            ...options,
            allowFMURelocation: false // Prevent infinite recursion
          });
        }
      }
      
      return { 
        success: false, 
        reason: 'Insufficient contiguous slots',
        slotsAvailable: this.getAvailableSlotCount(locationSlots),
        slotsNeeded
      };
    }

    // Perform allocation
    return this.performSlotAllocation(unit, equipment, location, slotRange);
  }

  private static findAvailableSlotRange(
    slots: CriticalSlot[],
    slotsNeeded: number,
    preferredStart?: number
  ): SlotRangeResult {
    
    // Try preferred position first
    if (preferredStart !== undefined) {
      if (this.checkSlotAvailability(slots, preferredStart, slotsNeeded)) {
        return {
          found: true,
          startSlot: preferredStart,
          endSlot: preferredStart + slotsNeeded - 1
        };
      }
    }

    // Find first available contiguous block
    for (let start = 0; start <= slots.length - slotsNeeded; start++) {
      if (this.checkSlotAvailability(slots, start, slotsNeeded)) {
        return {
          found: true,
          startSlot: start,
          endSlot: start + slotsNeeded - 1
        };
      }
    }

    return { found: false };
  }

  private static checkSlotAvailability(
    slots: CriticalSlot[],
    startIndex: number,
    count: number,
    allowFMU: boolean = false
  ): boolean {
    
    for (let i = startIndex; i < startIndex + count; i++) {
      if (i >= slots.length) return false;
      
      const slot = slots[i];
      if (slot.isEmpty) continue;
      
      if (allowFMU && this.isFMUEquipment(slot.equipmentId)) continue;
      
      return false; // Slot is occupied by non-movable equipment
    }
    
    return true;
  }
}
```

### 2. Spread Equipment Management

```typescript
class SpreadEquipmentManager {
  private static readonly SPREAD_PATTERNS: Map<string, SpreadPattern> = new Map([
    ['TSM', {
      totalSlots: 6,
      locationType: 'all',
      slotsPerLocation: 1,
      userPlaceable: true,
      fixedPositions: false
    }],
    ['Endo Steel', {
      totalSlots: 14,
      locationType: 'all',
      slotsPerLocation: 'variable',
      userPlaceable: true,
      fixedPositions: false
    }],
    ['Environmental Sealing', {
      totalSlots: 8, // One per location
      locationType: 'all',
      slotsPerLocation: 1,
      userPlaceable: false,
      fixedPositions: true
    }],
    ['Stealth Armor', {
      totalSlots: 12,
      locationType: 'specific',
      targetLocations: ['Left Arm', 'Right Arm', 'Left Torso', 'Right Torso', 'Left Leg', 'Right Leg'],
      slotsPerLocation: 2,
      userPlaceable: false,
      fixedPositions: true
    }],
    ['Partial Wing', {
      totalSlots: 6,
      locationType: 'specific',
      targetLocations: ['Left Torso', 'Right Torso'],
      slotsPerLocation: 3,
      userPlaceable: false,
      fixedPositions: true
    }]
  ]);

  static allocateSpreadEquipment(
    unit: CustomizableUnit,
    equipment: EquipmentItem
  ): AllocationResult {
    
    const pattern = this.SPREAD_PATTERNS.get(equipment.name);
    if (!pattern) {
      return { success: false, reason: 'Unknown spread equipment pattern' };
    }

    const targetLocations = this.resolveTargetLocations(pattern, unit);
    const allocationPlan = this.createAllocationPlan(unit, equipment, pattern, targetLocations);

    if (!allocationPlan.feasible) {
      return { 
        success: false, 
        reason: 'Cannot fit spread equipment',
        details: allocationPlan.conflicts
      };
    }

    return this.executeAllocationPlan(unit, allocationPlan);
  }

  private static createAllocationPlan(
    unit: CustomizableUnit,
    equipment: EquipmentItem,
    pattern: SpreadPattern,
    targetLocations: string[]
  ): AllocationPlan {
    
    const plan: LocationAllocation[] = [];
    const conflicts: AllocationConflict[] = [];

    if (pattern.userPlaceable) {
      // For user-placeable spread equipment (TSM, Endo Steel)
      // User controls placement, just validate total slots
      const allocatedSlots = this.countAllocatedSlots(unit, equipment);
      return {
        feasible: allocatedSlots <= pattern.totalSlots,
        allocations: [], // User manages individual allocations
        conflicts: allocatedSlots > pattern.totalSlots ? [{
          location: 'all',
          reason: 'Too many slots allocated',
          slotsOver: allocatedSlots - pattern.totalSlots
        }] : []
      };
    }

    // For fixed-position spread equipment
    for (const location of targetLocations) {
      const slotsNeeded = this.getSlotsForLocation(pattern, location);
      const availableSlots = CriticalSlotManager.findAvailableSlotRange(
        this.getLocationSlots(unit, location),
        slotsNeeded
      );

      if (availableSlots.found) {
        plan.push({
          location,
          startSlot: availableSlots.startSlot,
          slotCount: slotsNeeded
        });
      } else {
        conflicts.push({
          location,
          reason: 'Insufficient contiguous slots',
          slotsNeeded,
          slotsAvailable: this.getAvailableSlotCount(unit, location)
        });
      }
    }

    return {
      feasible: conflicts.length === 0,
      allocations: plan,
      conflicts
    };
  }
}
```

## Automation Systems

### 1. Auto-Fill Engine

```typescript
class AutoFillManager {
  static fillUnhittableEquipment(unit: CustomizableUnit): AutoFillResult {
    const unallocated = this.getUnallocatedFMU(unit);
    const results: AllocationAttempt[] = [];

    for (const equipment of unallocated) {
      const bestLocation = PlacementIntelligence.findOptimalLocation(unit, equipment);
      
      if (bestLocation) {
        const result = CriticalSlotManager.allocateEquipment(
          unit, 
          equipment, 
          bestLocation.location
        );
        
        results.push({
          equipment: equipment.name,
          attempted: true,
          success: result.success,
          location: bestLocation.location,
          reason: result.success ? 'Placed successfully' : result.reason
        });
      } else {
        results.push({
          equipment: equipment.name,
          attempted: false,
          success: false,
          reason: 'No valid locations available'
        });
      }
    }

    return {
      totalAttempted: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      details: results
    };
  }

  static fillAllEquipment(unit: CustomizableUnit): AutoFillResult {
    const unallocated = this.getAllUnallocatedEquipment(unit);
    const sortedEquipment = this.sortEquipmentByPriority(unallocated);
    const results: AllocationAttempt[] = [];

    for (const equipment of sortedEquipment) {
      if (this.isHeatSink(equipment)) {
        // Handle heat sinks specially
        const heatSinkResult = this.allocateHeatSink(unit, equipment);
        results.push(heatSinkResult);
      } else {
        // Standard equipment placement
        const suggestions = PlacementIntelligence.suggestOptimalPlacement(unit, equipment);
        
        let placed = false;
        for (const suggestion of suggestions) {
          const result = CriticalSlotManager.allocateEquipment(
            unit, 
            equipment, 
            suggestion.location
          );
          
          if (result.success) {
            results.push({
              equipment: equipment.name,
              attempted: true,
              success: true,
              location: suggestion.location,
              reason: suggestion.reason
            });
            placed = true;
            break;
          }
        }

        if (!placed) {
          results.push({
            equipment: equipment.name,
            attempted: true,
            success: false,
            reason: 'No suitable location found'
          });
        }
      }
    }

    return this.aggregateResults(results);
  }

  static compactCriticals(unit: CustomizableUnit): CompactionResult {
    const results: LocationCompactionResult[] = [];

    for (const location of unit.criticals) {
      const before = this.analyzeLocation(location);
      const compacted = this.compactLocationSlots(location);
      const after = this.analyzeLocation(compacted);

      results.push({
        location: location.location,
        slotsBefore: before.totalSlots,
        slotsAfter: after.totalSlots,
        emptySlotsBefore: before.emptySlots,
        emptySlotsAfter: after.emptySlots,
        gapsRemoved: before.gaps - after.gaps
      });

      location.slots = compacted.slots;
    }

    return {
      totalGapsRemoved: results.reduce((sum, r) => sum + r.gapsRemoved, 0),
      locationResults: results
    };
  }

  static sortEquipment(unit: CustomizableUnit): SortingResult {
    const results: LocationSortResult[] = [];

    for (const location of unit.criticals) {
      const equipment = this.extractEquipmentFromLocation(location);
      const sorted = this.sortByOfficialOrder(equipment, unit);
      const relinked = this.reorderLinkedEquipment(sorted);
      
      location.slots = this.rebuildSlotsFromEquipment(relinked);
      
      results.push({
        location: location.location,
        equipmentCount: equipment.length,
        reorderingApplied: !this.arraysEqual(equipment, sorted)
      });
    }

    return {
      locationsProcessed: results.length,
      locationsReordered: results.filter(r => r.reorderingApplied).length,
      details: results
    };
  }

  private static readonly SORT_ORDER_WEIGHTS: Map<string, number> = new Map([
    ['Partial Wing', 1],
    ['Heat Sink', 2],
    ['Jump Jet', 3],
    ['Weapon', 4],
    ['Ammo', 5],
    ['Hittable Equipment', 6],
    ['SCM', 7],
    ['CASE', 8],
    ['Structure', 9],
    ['Armor', 10],
    ['Other', 11]
  ]);
}
```

### 2. Placement Intelligence

```typescript
class PlacementIntelligence {
  static suggestOptimalPlacement(
    unit: CustomizableUnit, 
    equipment: EquipmentItem
  ): PlacementSuggestion[] {
    
    const suggestions: PlacementSuggestion[] = [];
    const validLocations = LocationValidator.getValidLocations(unit, equipment);

    for (const location of validLocations) {
      const score = this.calculatePlacementScore(unit, equipment, location);
      if (score > 0) {
        suggestions.push({
          location,
          score,
          reasoning: this.generateReasoning(unit, equipment, location),
          warnings: this.identifyWarnings(unit, equipment, location)
        });
      }
    }

    return suggestions.sort((a, b) => b.score - a.score);
  }

  private static calculatePlacementScore(
    unit: CustomizableUnit,
    equipment: EquipmentItem,
    location: string
  ): number {
    
    let score = 50; // Base score

    // Equipment type specific scoring
    if (this.isWeapon(equipment)) {
      score += this.scoreWeaponPlacement(unit, equipment, location);
    } else if (this.isAmmo(equipment)) {
      score += this.scoreAmmoPlacement(unit, equipment, location);
    } else if (this.isHeatSink(equipment)) {
      score += this.scoreHeatSinkPlacement(unit, equipment, location);
    }

    // General placement factors
    score += this.scoreLocationCapacity(unit, location);
    score += this.scoreArmorProtection(unit, location);
    score += this.scoreCriticalValue(unit, location);

    return Math.max(0, Math.min(100, score));
  }

  private static scoreWeaponPlacement(
    unit: CustomizableUnit,
    weapon: EquipmentItem,
    location: string
  ): number {
    
    let score = 0;

    // Direct-fire weapons prefer arms
    if (this.isDirectFireWeapon(weapon) && location.includes('Arm')) {
      score += 20;
    }

    // Missile weapons good in torso
    if (this.isMissileWeapon(weapon) && location.includes('Torso')) {
      score += 15;
    }

    // Energy weapons can go anywhere but prefer torso/arms
    if (this.isEnergyWeapon(weapon) && 
        (location.includes('Torso') || location.includes('Arm'))) {
      score += 10;
    }

    // Avoid head for large weapons
    if (location === 'Head' && weapon.critical_slots > 1) {
      score -= 30;
    }

    // Consider weapon range and role
    if (this.isLongRangeWeapon(weapon) && location.includes('Torso')) {
      score += 10; // Better protected
    }

    return score;
  }

  private static scoreAmmoPlacement(
    unit: CustomizableUnit,
    ammo: EquipmentItem,
    location: string
  ): number {
    
    let score = 0;

    // Prefer locations with compatible weapons
    const compatibleWeapons = this.findCompatibleWeapons(unit, ammo, location);
    score += compatibleWeapons.length * 15;

    // CASE protection bonus
    if (this.locationHasCASE(unit, location)) {
      score += 25;
    }

    // Avoid head for ammo
    if (location === 'Head') {
      score -= 40;
    }

    // Prefer torso locations for ammo (better protected)
    if (location.includes('Torso')) {
      score += 10;
    }

    return score;
  }

  static generateAutomaticRecommendations(unit: CustomizableUnit): BuildRecommendation[] {
    const recommendations: BuildRecommendation[] = [];

    // Analyze current build state
    const analysis = this.analyzeBuildState(unit);

    // Heat management recommendations
    if (analysis.heatDeficit > 0) {
      recommendations.push({
        type: 'heat_management',
        priority: 'high',
        title: 'Heat Sink Shortage',
        description: `Unit generates ${analysis.heatGeneration} heat but only dissipates ${analysis.heatDissipation}. Add ${analysis.heatDeficit} more heat sinks.`,
        suggestedActions: [
          { action: 'add_equipment', equipment: 'Heat Sink', quantity: analysis.heatDeficit }
        ]
      });
    }

    // CASE recommendations
    const explosiveLocations = this.findLocationsWithExplosives(unit);
    const unprotectedExplosives = explosiveLocations.filter(loc => !this.locationHasCASE(unit, loc));
    
    if (unprotectedExplosives.length > 0) {
      recommendations.push({
        type: 'protection',
        priority: 'medium',
        title: 'Missing CASE Protection',
        description: `Locations with explosive equipment should have CASE protection: ${unprotectedExplosives.join(', ')}`,
        suggestedActions: unprotectedExplosives.map(loc => ({
          action: 'add_equipment',
          equipment: 'CASE',
          location: loc
        }))
      });
    }

    // Equipment linking recommendations
    const unlinkableEquipment = this.findUnlinkableEquipment(unit);
    if (unlinkableEquipment.length > 0) {
      recommendations.push({
        type: 'optimization',
        priority: 'low',
        title: 'Equipment Linking Opportunities',
        description: 'Some equipment could benefit from enhancement systems',
        suggestedActions: unlinkableEquipment.map(eq => ({
          action: 'add_equipment',
          equipment: eq.enhancementType,
          location: eq.location
        }))
      });
    }

    return recommendations;
  }
}
```

## Unit Type Specific Handlers

### 1. BattleMech Handler

```typescript
class BattleMechHandler implements UnitTypeHandler {
  getValidLocations(equipment: EquipmentItem, unit: CustomizableUnit): string[] {
    const baseLocations = ['Head', 'Center Torso', 'Left Torso', 'Right Torso', 
                          'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg'];
    
    // Add center leg for Tripod mechs
    if (unit.config === 'Tripod') {
      baseLocations.push('Center Leg');
    }
    
    // Apply equipment-specific restrictions
    if (this.isJumpJet(equipment)) {
      return baseLocations.filter(loc => 
        loc.includes('Torso') || loc.includes('Leg')
      );
    }
    
    if (this.requiresActuators(equipment)) {
      return baseLocations.filter(loc => 
        loc.includes('Arm') && this.hasRequiredActuators(unit, loc, equipment)
      );
    }
    
    return baseLocations;
  }

  validateActuators(unit: CustomizableUnit, location: string, equipment: EquipmentItem): ActuatorValidation {
    if (!location.includes('Arm')) {
      return { valid: true, requiredActuators: [], availableActuators: [] };
    }
    
    const required = this.getRequiredActuators(equipment);
    const available = this.getAvailableActuators(unit, location);
    const missing = required.filter(req => !available.includes(req));
    
    return {
      valid: missing.length === 0,
      requiredActuators: required,
      availableActuators: available,
      missingActuators: missing,
      canRemoveActuators: this.canRemoveActuators(unit, location, missing)
    };
  }

  manageHeatSinks(unit: CustomizableUnit): HeatSinkManagement {
    const engineCapacity = this.getEngineHeatSinkCapacity(unit);
    const totalHeatSinks = this.getTotalHeatSinks(unit);
    const engineIntegrated = Math.min(engineCapacity, totalHeatSinks);
    const externalRequired = Math.max(0, totalHeatSinks - engineCapacity);
    
    return {
      engineCapacity,
      engineIntegrated,
      externalRequired,
      recommendations: this.generateHeatSinkRecommendations(unit, externalRequired)
    };
  }

  getCriticalSlotLayout(unit: CustomizableUnit): CriticalSlotLayout {
    const layout: CriticalSlotLayout = {};
    
    const slotCounts = {
      'Head': unit.isSuperHeavy ? 6 : 6,
      'Center Torso': unit.isSuperHeavy ? 24 : 12,
      'Left Torso': unit.isSuperHeavy ? 24 : 12,
      'Right Torso': unit.isSuperHeavy ? 24 : 12,
      'Left Arm': unit.isSuperHeavy ? 24 : 12,
      'Right Arm': unit.isSuperHeavy ? 24 : 12,
      'Left Leg': unit.isSuperHeavy ? 12 : 6,
      'Right Leg': unit.isSuperHeavy ? 12 : 6
    };

    if (unit.config === 'Tripod') {
      slotCounts['Center Leg'] = unit.isSuperHeavy ? 12 : 6;
    }

    for (const [location, slots] of Object.entries(slotCounts)) {
      layout[location] = {
        maxSlots: slots,
        systemSlots: this.getSystemSlots(unit, location),
        availableSlots: slots - this.getSystemSlots(unit, location).length
      };
    }

    return layout;
  }
}
```

### 2. Vehicle Handler

```typescript
class VehicleHandler implements UnitTypeHandler {
  getValidLocations(equipment: EquipmentItem, unit: CustomizableUnit): string[] {
    const baseLocations = ['Front', 'Left Side', 'Right Side', 'Rear', 'Body'];
    
    // Add turret if unit has one
    if (this.hasTurret(unit)) {
      baseLocations.push('Turret');
    }
    
    // VTOL specific locations
    if (unit.config === 'VTOL') {
      return ['Nose', 'Sides', 'Rear', 'Rotor'];
    }
    
    // Naval specific locations
    if (unit.config === 'Naval') {
      baseLocations.push('Port Side', 'Starboard Side');
    }
    
    return baseLocations;
  }

  validatePlacement(unit: CustomizableUnit, equipment: EquipmentItem, location: string): VehicleValidation {
    // Vehicles don't use critical slots, different validation rules
    return {
      valid: this.isValidVehicleLocation(equipment, location) && 
             this.checkTonnageLimits(unit, equipment) &&
             this.checkMountingRestrictions(unit, equipment, location),
      tonnageCheck: this.validateTonnage(unit, equipment),
      mountingCheck: this.validateMounting(unit, equipment, location),
      locationCheck: this.validateLocationRules(equipment, location)
    };
  }

  allocateEquipment(unit: CustomizableUnit, equipment: EquipmentItem, location: string): AllocationResult {
    // No critical slot management for vehicles
    const validation = this.validatePlacement(unit, equipment, location);
    
    if (!validation.valid) {
      return { 
        success: false, 
        reason: 'Vehicle placement validation failed',
        details: validation
      };
    }
    
    return this.addToLocationEquipment(unit, equipment, location);
  }

  getLocationCapacity(unit: CustomizableUnit, location: string): LocationCapacity {
    // Vehicle capacity based on tonnage, not slots
    const baseTonnage = unit.mass;
    const locationPercentage = this.getLocationTonnagePercentage(location);
    
    return {
      maxTonnage: baseTonnage * locationPercentage,
      currentTonnage: this.getCurrentLocationTonnage(unit, location),
      availableTonnage: (baseTonnage * locationPercentage) - this.getCurrentLocationTonnage(unit, location)
    };
  }
}
```

### 3. Battle Armor Handler

```typescript
class BattleArmorHandler implements UnitTypeHandler {
  getValidLocations(equipment: EquipmentItem, unit: CustomizableUnit): string[] {
    // Battle Armor has different mounting system
    const mountLocations = ['Body', 'Left Arm', 'Right Arm', 'Squad'];
    
    if (this.isAntiPersonnelWeapon(equipment)) {
      return ['APM']; // Anti-Personnel Mount
    }
    
    if (this.isDetachableWeapon(equipment)) {
      return ['DWP']; // Detachable Weapon Pack
    }
    
    return mountLocations;
  }

  validatePlacement(unit: CustomizableUnit, equipment: EquipmentItem, location: string): BattleArmorValidation {
    return {
      valid: this.checkBattleArmorRules(unit, equipment, location),
      manipulatorCheck: this.validateManipulators(unit, equipment, location),
      squadLevelCheck: this.validateSquadLevel(unit, equipment),
      weightClassCheck: this.validateWeightClass(unit, equipment)
    };
  }

  allocateEquipment(unit: CustomizableUnit, equipment: EquipmentItem, location: string): AllocationResult {
    // Battle Armor uses capacity-based system, not critical slots
    const capacity = this.getLocationCapacity(unit, location);
    const equipmentSize = this.getEquipmentSize(equipment);
    
    if (capacity.available < equipmentSize) {
      return {
        success: false,
        reason: 'Insufficient capacity',
        capacityRequired: equipmentSize,
        capacityAvailable: capacity.available
      };
    }
    
    return this.addToBattleArmorLocation(unit, equipment, location);
  }

  getSquadConfiguration(unit: CustomizableUnit): SquadConfiguration {
    return {
      trooperCount: unit.trooperCount || 4,
      weightClass: unit.weight_class,
      manipulators: this.getManipulatorConfiguration(unit),
      jumpCapability: this.hasJumpCapability(unit),
      vtolCapability: this.hasVTOLCapability(unit)
    };
  }
}
```

## Data Model Enhancements

### 1. Enhanced Unit Model

```typescript
interface EnhancedCustomizableUnit extends CustomizableUnit {
  // Critical slot system
  criticalSlots: {
    [location: string]: {
      slots: EnhancedCriticalSlot[];
      maxSlots: number;
      systemSlots: SystemSlot[];
      specialRules: LocationRule[];
    }
  };
  
  // Actuator management (BattleMechs only)
  actuators?: {
    [location: string]: {
      shoulder: boolean;
      upperArm: boolean;
      lowerArm: boolean;
      hand: boolean;
      canRemove: {
        lowerArm: boolean;
        hand: boolean;
      };
    }
  };
  
  // Heat management
  heatManagement: {
    totalHeatSinks: number;
    engineIntegratedCount: number;
    engineCapacity: number;
    externalHeatSinks: HeatSinkMount[];
    totalHeatGeneration: number;
    totalHeatDissipation: number;
    heatBalance: number;
  };
  
  // Equipment linking system
  equipmentLinks: EquipmentLink[];
  
  // Build recommendations
  recommendations: BuildRecommendation[];
  
  // Validation state
  validationState: UnitValidationState;
  
  // Unit type specific data
  unitTypeData: BattleMechData | VehicleData | BattleArmorData;
}

interface EnhancedCriticalSlot {
  id: string;
  slotIndex: number;
  isEmpty: boolean;
  equipmentId?: string;
  equipmentName?: string;
  isSystem: boolean;
  systemType?: SystemType;
  canRemove: boolean;
  isMovable: boolean; // For FMU equipment
  linkedTo?: string; // Equipment linking
  groupId?: string; // For multi-slot equipment
}

interface EquipmentLink {
  primaryEquipmentId: string;
  enhancementEquipmentId: string;
  linkType: 'artemis' | 'capacitor' | 'targeting_computer' | 'supercharger';
  location: string;
  autoLinked: boolean;
}

interface BuildRecommendation {
  id: string;
  type: 'heat_management' | 'protection' | 'optimization' | 'constraint_violation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggestedActions: SuggestedAction[];
  autoApplyable: boolean;
}
```

### 2. Enhanced Equipment Model

```typescript
interface EnhancedEquipmentItem extends EquipmentItem {
  // Placement constraints
  placementRules: PlacementRule[];
  locationRestrictions: LocationRestriction[];
  dependencyRequirements: DependencyRequirement[];
  mutualExclusions: MutualExclusion[];
  
  // Physical properties
  criticalSlots: number;
  isSpreadable: boolean;
  spreadPattern?: SpreadPattern;
  isUnhittable: boolean;
  isMovable: boolean; // FMU equipment
  
  // Linking capabilities
  canLinkTo: string[];
  requiresLinkedEquipment: boolean;
  enhancementTypes: string[];
  
  // Special behaviors
  autoPlacement: boolean;
  userPlaceable: boolean;
  fixedLocation?: string;
  
  // Heat management
  heatGeneration?: number;
  heatDissipation?: number;
  
  // Validation metadata
  validationRules: ValidationRule[];
  
  // UI properties
  uiHints: {
    preferredLocations?: string[];
    placementTips?: string[];
    warningMessages?: string[];
  };
}

interface PlacementRule {
  id: string;
  ruleType: 'location_restriction' | 'dependency' | 'exclusion' | 'quantity_limit';
  condition: (unit: CustomizableUnit, context: PlacementContext) => boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}
```

## Implementation Phases

### Phase 1: Core Infrastructure (4-6 weeks)

#### Week 1-2: Constraint Engine Foundation
- **Deliverables:**
  - `ConstraintEngine` class with validation framework
  - `LocationValidator` with basic rules (Jump Jets, Heat Sinks)
  - `EquipmentConstraint` interface and base implementations
  - Unit tests for core validation logic

- **Key Components:**
  - Constraint registration system
  - Validation result aggregation
  - Error message localization framework
  - Basic constraint rules database

#### Week 3-4: Critical Slot Management
- **Deliverables:**
  - `CriticalSlotManager` with allocation/deallocation logic
  - `SlotAllocationEngine` for contiguous slot finding
  - FMU equipment relocation system
  - Enhanced data models for critical slots

- **Key Components:**
  - Slot availability checking algorithms
  - Equipment grouping for multi-slot items
  - Conflict resolution for slot allocation
  - Integration with existing UI components

#### Week 5-6: Unit Type Handlers
- **Deliverables:**
  - `BattleMechHandler` with actuator management
  - `VehicleHandler` with tonnage-based allocation
  - `BattleArmorHandler` with capacity-based system
  - Unit type detection and handler routing

- **Key Components:**
  - Type-specific validation rules
  - Location mapping for different unit types
  - Capacity calculation algorithms
  - Handler registration system

### Phase 2: UI Enhancement (3-4 weeks)

#### Week 1-2: Drag-and-Drop System
- **Deliverables:**
  - Enhanced `CriticalsPanel` with drag-and-drop
  - Visual feedback system for valid/invalid drops
  - Equipment grouping visualization
  - Real-time constraint checking during drag

- **Key Components:**
  - React DnD integration
  - Custom drag layers for equipment visualization
  - Drop zone highlighting system
  - Collision detection for equipment placement

#### Week 3-4: Equipment Browser Enhancement
- **Deliverables:**
  - Advanced filtering system
  - Smart constraint-based hiding
  - Equipment suggestions engine
  - Favorites and recent equipment system

- **Key Components:**
  - Multi-dimensional filtering logic
  - Search indexing for fast filtering
  - Recommendation algorithms
  - User preference storage

### Phase 3: Automation Systems (3-4 weeks)

#### Week 1-2: Auto-Fill Logic
- **Deliverables:**
  - `AutoFillManager` with intelligent placement
  - Equipment priority sorting algorithms
  - FMU equipment auto-placement
  - Batch operation management

- **Key Components:**
  - Placement scoring algorithms
  - Equipment type prioritization
  - Location optimization logic
  - Rollback mechanisms for failed operations

#### Week 3-4: Advanced Automation
- **Deliverables:**
  - Equipment sorting with official order
  - Critical slot compaction algorithms
  - Build optimization suggestions
  - Automated constraint fixing

- **Key Components:**
  - Official sorting order implementation
  - Gap analysis and compaction logic
  - Build analysis engine
  - Suggestion generation system

### Phase 4: Advanced Features (4-5 weeks)

#### Week 1-2: Equipment Dependencies
- **Deliverables:**
  - `DependencyManager` with auto-linking
  - Equipment relationship mapping
  - Dependency violation detection
  - Automatic enhancement linking

- **Key Components:**
  - Equipment compatibility database
  - Auto-linking algorithms
  - Dependency graph management
  - Link visualization system

#### Week 3-4: Spread Equipment System
- **Deliverables:**
  - `SpreadEquipmentManager` with pattern recognition
  - Complex allocation algorithms for spread equipment
  - User-placeable vs fixed-position handling
  - Pattern validation and enforcement

- **Key Components:**
  - Spread pattern definitions
  - Multi-location allocation planning
  - Constraint satisfaction solver
  - Pattern conflict resolution

#### Week 5: Heat Management Integration
- **Deliverables:**
  - Engine heat sink integration logic
  - Heat balance calculations
  - Heat sink placement optimization
  - Real-time heat warnings

- **Key Components:**
  - Engine capacity calculations
  - Heat sink type handling
  - Integration preference algorithms
  - Heat balance UI indicators

### Phase 5: Testing & Polish (2-3 weeks)

#### Week 1: Integration Testing
- **Deliverables:**
  - End-to-end test suite
  - Cross-browser compatibility testing
  - Performance optimization
  - Memory leak detection and fixes

#### Week 2: User Experience Polish
- **Deliverables:**
  - Animation and transition improvements
  - Accessibility enhancements
  - Mobile responsiveness improvements
  - User feedback integration

#### Week 3: Documentation & Launch Prep
- **Deliverables:**
  - User documentation and tutorials
  - API documentation
  - Developer guides
  - Launch readiness checklist

## Technical Specifications

### Performance Requirements
- **Constraint Validation**: < 100ms for full unit validation
- **Auto-Fill Operations**: < 500ms for complete auto-fill
- **UI Responsiveness**: < 16ms for drag-and-drop operations
- **Memory Usage**: < 50MB for typical unit editing session

### Browser Compatibility
- **Primary Support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Support**: iOS Safari 14+, Chrome Mobile 90+
- **Fallback Support**: Graceful degradation for older browsers

### Data Persistence
- **Local Storage**: User preferences and temporary builds
- **Session Storage**: Current editing state
- **IndexedDB**: Large equipment databases and caching
- **Server Sync**: Optional cloud save functionality

### Security Considerations
- **Input Validation**: All user inputs sanitized and validated
- **XSS Prevention**: Content Security Policy implementation
- **Data Privacy**: No sensitive data collection
- **Offline Capability**: Full functionality without network access

## Risk Assessment

### High Risk Items

#### 1. Constraint Engine Complexity
- **Risk**: Complex constraint interactions may cause performance issues
- **Mitigation**: Implement constraint caching and lazy validation
- **Contingency**: Simplify constraint rules if performance targets not met

#### 2. Legacy MegaMekLab Rule Accuracy
- **Risk**: Missing or incorrect implementation of BattleTech rules
- **Mitigation**: Extensive testing against legacy MML and official sources
- **Contingency**: Community feedback integration and rapid iteration

#### 3. Cross-Browser Drag-and-Drop
- **Risk**: Inconsistent drag-and-drop behavior across browsers
- **Mitigation**: Use React DnD library with fallback implementations
- **Contingency**: Alternative touch-based interaction for mobile

### Medium Risk Items

#### 1. Data Model Migration
- **Risk**: Breaking changes to existing data structures
- **Mitigation**: Versioned data models with migration scripts
- **Contingency**: Rollback capability and data export/import

#### 2. Performance on Large Units
- **Risk**: Slow performance on units with many equipment items
- **Mitigation**: Virtual scrolling and lazy loading
- **Contingency**: Pagination for large equipment lists

### Low Risk Items

#### 1. UI Component Compatibility
- **Risk**: Styling conflicts with existing components
- **Mitigation**: CSS modules and component isolation
- **Contingency**: Custom styling overrides

#### 2. Feature Creep
- **Risk**: Scope expansion beyond core requirements
- **Mitigation**: Strict adherence to phase deliverables
- **Contingency**: Feature prioritization and deferral

## Success Metrics

### Functional Parity
- **100%** of legacy MML constraint rules implemented
- **95%** accuracy in equipment placement validation
- **90%** of automation features working correctly

### Performance Targets
- **Sub-second** response times for all operations
- **Zero** memory leaks in 8-hour usage sessions
- **99.9%** uptime for web application

### User Experience
- **Drag-and-drop** success rate > 98%
- **Auto-fill** satisfaction rate > 85% (user feedback)
- **Learning curve** < 30 minutes for MML users

### Code Quality
- **90%** test coverage for core logic
- **Zero** critical security vulnerabilities
- **Clean** code architecture with <20% technical debt

## Conclusion

This implementation plan provides a comprehensive roadmap to achieve full parity with the legacy Java MegaMekLab application while delivering a modern, web-based user experience. The phased approach ensures incremental delivery of value while managing risk through careful dependency management and testing.

The success of this project will establish the web application as the premier tool for BattleTech unit customization, providing users with the power and flexibility of the original MegaMekLab in a more accessible and maintainable platform.

## Appendices

### A. Equipment Constraint Reference
- Complete list of equipment-specific constraints
- Location restriction mappings
- Dependency relationship tables

### B. Performance Benchmarks
- Detailed performance requirements per operation
- Memory usage profiles
- Browser-specific optimizations

### C. Testing Strategy
- Unit test coverage requirements
- Integration test scenarios
- User acceptance test criteria

### D. Deployment Strategy
- Staging environment setup
- Production deployment process
- Rollback procedures
