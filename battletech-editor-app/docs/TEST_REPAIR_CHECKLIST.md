# BattleTech Editor Test Repair Checklist

**Status:** In Progress  
**Started:** January 1, 2025  
**Current Failures:** 17 test suites, 98 failed tests out of 1,369 total

## Summary

This document tracks the systematic repair of all broken unit tests. Each item will be marked as complete when fixed and verified.

## Test Repair Categories

### Phase 1: Internal Structure Table Fixes ✅ **COMPLETED**
| Status | File | Issue | Fix Required |
|--------|------|-------|-------------|
| ✅ | `__tests__/internalStructureTable.test.ts` | 50-ton mech LT structure: expected 11, got 12 | ✅ Fixed INTERNAL_STRUCTURE_TABLE values |
| ✅ | `__tests__/internalStructureTable.test.ts` | 95-ton mech CT structure: expected 31, got 30 | ✅ Fixed INTERNAL_STRUCTURE_TABLE values |
| ✅ | `__tests__/internalStructureTable.test.ts` | Various tonnage calculations incorrect | ✅ Verified all tonnage calculations |

**Files modified:**
- ✅ `utils/internalStructureTable.ts` - Updated INTERNAL_STRUCTURE_TABLE values with correct BattleTech values

**Result:** All 24 tests passing

### Phase 2: UnallocatedEquipmentDisplay Component Fixes ✅ **NEARLY COMPLETED**
| Status | File | Issue | Fix Required |
|--------|------|-------|-------------|
| ✅ | `__tests__/components/criticalSlots/UnallocatedEquipmentDisplay.test.tsx` | Multiple elements with "Mystery Component" text | ✅ Fixed multiple getByText calls to use getAllByText |
| ✅ | `__tests__/components/criticalSlots/UnallocatedEquipmentDisplay.test.tsx` | Null techBase error | ✅ Added null handling in getTechAbbreviation |
| ✅ | `__tests__/components/criticalSlots/UnallocatedEquipmentDisplay.test.tsx` | DOM query targeting wrong elements | ✅ Fixed test selectors for CSS/attributes |
| ✅ | `__tests__/components/criticalSlots/UnallocatedEquipmentDisplay.test.tsx` | Equipment categorization order | ✅ Fixed equipment color test order |
| ⚠️ | `__tests__/components/criticalSlots/UnallocatedEquipmentDisplay.test.tsx` | Group expansion test | Group collapse behavior test still failing |

**Files modified:**
- ✅ `components/criticalSlots/UnallocatedEquipmentDisplay.tsx` - Added null handling for techBase  
- ✅ `__tests__/components/criticalSlots/UnallocatedEquipmentDisplay.test.tsx` - Fixed DOM selectors and multiple text queries

**Progress:** 30 tests passing, 1 test failing (96.8% success rate - improved from 12 failures!)

### Phase 3: OverviewTabV2 Component Fixes ✅ **COMPLETED**
| Status | File | Issue | Fix Required |
|--------|------|-------|-------------|
| ✅ | `__tests__/components/overview/OverviewTabV2.test.tsx` | DOM selector issues - buttons not found | ✅ Fixed querySelector to use getAllByText with element filtering |
| ✅ | `__tests__/components/overview/OverviewTabV2.test.tsx` | Click event failures | ✅ Updated test selectors to find actual button elements |
| ✅ | `__tests__/components/overview/OverviewTabV2.test.tsx` | Null element references | ✅ Fixed DOM queries for tech progression matrix |
| ✅ | `__tests__/components/overview/OverviewTabV2.test.tsx` | Rapid click test expectations | ✅ Updated test to account for component debouncing |

**Files modified:**
- ✅ `__tests__/components/overview/OverviewTabV2.test.tsx` - Fixed all DOM selectors and button targeting

**Result:** 23 tests passing, 0 tests failing (**100% success rate** - improved from 17.4% failure rate!)

### Phase 4: Component Test Fixes ⚠️ **IN PROGRESS**
| Status | File | Issue | Fix Required |
|--------|------|-------|-------------|
| ⚠️ | `__tests__/components/criticalSlots/SystemComponentControls.test.tsx` | Multiple element matches | ✅ 37/51 tests passing (72.5% success rate) |
| ✅ | `__tests__/components/criticalSlots/EquipmentAllocationDebugPanel.test.tsx` | Debug panel interface | ✅ 40/40 tests passing (100% success rate) |
| ✅ | `__tests__/components/CriticalSlot.test.tsx` | Critical slot interface | ✅ 1/1 tests passing (100% success rate) |
| ⚠️ | `__tests__/components/multiUnit/MultiUnitProvider.test.tsx` | State management mock issues | ⚠️ 24/33 tests passing (72.7% success rate) |

**Files Status:**
- ⚠️ `SystemComponentControls.test.tsx` - DOM selector fixes applied, remaining styling/validation issues
- ✅ `EquipmentAllocationDebugPanel.test.tsx` - Perfect functionality, no fixes needed
- ✅ `CriticalSlot.test.tsx` - Perfect functionality, no fixes needed  
- ⚠️ `MultiUnitProvider.test.tsx` - Complex state management issues, needs mock architecture fixes

**Phase 4 Progress:** 102/125 tests passing (81.6% success rate)

### Phase 5: Integration Test Fixes
| Status | File | Issue | Fix Required |
|--------|------|-------|-------------|
| ❌ | `__tests__/integration/DropdownMemoryIntegration.test.tsx` | Memory persistence issues | Fix memory integration |
| ❌ | `__tests__/integration/TopBarWeightCalculation.test.tsx` | Weight calculation mismatches | Fix weight calculations |
| ❌ | `__tests__/integration/TechProgressionVisualSync.test.tsx` | Tech progression sync issues | Fix tech progression |
| ❌ | `__tests__/integration/EndoSteelWeightCalculation.test.tsx` | Endo steel calculations | Fix structure calculations |
| ❌ | `__tests__/integration/StructureAndGyroMemoryIntegration.test.tsx` | Memory integration | Fix memory persistence |
| ❌ | `__tests__/integration/ComprehensiveDropdownMemoryIntegration.test.tsx` | Dropdown memory issues | Fix dropdown memory |
| ❌ | `__tests__/integration/MemoryRestoration.test.tsx` | Memory restoration | Fix memory restoration |
| ❌ | `__tests__/integration/ComponentAvailabilityTiming.test.tsx` | Component timing | Fix component availability |
| ❌ | `__tests__/integration/DropdownTimingFix.test.tsx` | Dropdown timing | Fix dropdown timing |

### Phase 6: Utility Test Fixes
| Status | File | Issue | Fix Required |
|--------|------|-------|-------------|
| ❌ | `__tests__/utils/structureCalculations.test.ts` | Structure calculation mismatches | Fix calculation formulas |
| ❌ | `__tests__/utils/techProgression.test.ts` | Tech progression logic | Fix tech progression |
| ❌ | `__tests__/utils/memoryPersistence.test.ts` | Memory persistence logic | Fix persistence utilities |
| ❌ | `__tests__/utils/criticalSlots/UnitCriticalManager.test.ts` | Unit manager interface | Fix manager tests |

## Detailed Fix Progress

### ✅ Completed: Internal Structure Table

**Issue:** The INTERNAL_STRUCTURE_TABLE in `utils/internalStructureTable.ts` had incorrect values compared to test expectations.

**Resolution:** Updated INTERNAL_STRUCTURE_TABLE with correct BattleTech values for all tonnages. All 24 tests now passing.

### Currently Working On: UnallocatedEquipmentDisplay Component

**Issues:**
1. Multiple elements with "Mystery Component" text causing `getByText` failures
2. Missing hover CSS classes: `cursor-pointer hover:opacity-80 hover:scale-105`
3. Missing tooltip attributes (`title` attributes on equipment items)
4. DOM query targeting wrong elements in tests

**Next Action:** Fix component CSS classes and attributes, then update test queries.

## Completion Tracking

- **Total Items:** 25+ individual fixes
- **Completed:** 3 (Internal Structure Table fixes)
- **In Progress:** UnallocatedEquipmentDisplay fixes
- **Remaining:** 22+

## Notes

- Each fix should be tested individually before moving to the next
- Run specific test files after each fix to verify resolution
- Document any implementation changes that affect other components
- Update this checklist after each completed fix

---

**Last Updated:** January 1, 2025 - Document created, starting with Internal Structure Table fixes.
