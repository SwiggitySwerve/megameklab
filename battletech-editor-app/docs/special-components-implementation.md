# Special Components Implementation

## Overview
This document tracks the implementation of special components that take up critical slots but are not found in the regular equipment section.

## Special Components List

### 1. Structure Components
- **Endo Steel**: 14 slots (IS), 7 slots (Clan) - Individual 1-slot items
- **Composite**: No critical slots
- **Reinforced**: No critical slots
- **Industrial**: No critical slots

### 2. Armor Components  
- **Ferro-Fibrous**: 14 slots (IS) - Individual 1-slot items
- **Ferro-Fibrous (Clan)**: 7 slots - Individual 1-slot items
- **Light Ferro-Fibrous**: 7 slots - Individual 1-slot items
- **Heavy Ferro-Fibrous**: 21 slots - Individual 1-slot items
- **Stealth**: 12 slots - Individual 1-slot items
- **Reactive**: 14 slots - Individual 1-slot items
- **Reflective**: 10 slots - Individual 1-slot items
- **Hardened**: No critical slots

### 3. Heat Sinks
- **Single Heat Sink**: 1 slot each - Individual items
- **Double Heat Sink**: 3 slots (IS), 2 slots (Clan) - NOT grouped, individual items
- **Compact Heat Sink**: 1 slot - Individual items

### 4. Engine Components (Fixed)
- **Standard Engine**: 6 CT slots
- **XL Engine**: 6 CT + 3 LT + 3 RT slots
- **Light Engine**: 6 CT + 2 LT + 2 RT slots
- **XXL Engine**: 6 CT + 3 LT + 3 RT slots
- **Compact Engine**: 3 CT slots
- **ICE**: 6 CT slots
- **Fuel Cell**: 6 CT slots

### 5. Gyro Components (Fixed in CT)
- **Standard Gyro**: 4 slots
- **Compact Gyro**: 2 slots
- **Heavy-Duty Gyro**: 4 slots
- **XL Gyro**: 6 slots

### 6. Cockpit Components (Fixed)
- **Life Support**: 2 slots in Head (slots 1 & 6)
- **Sensors**: 3 slots in Head (slots 2, 4, 5)
- **Standard Cockpit**: 1 slot in Head (slot 3)
- **Small Cockpit**: 1 slot in Head
- **Command Console**: 2 slots in Head
- **Torso-Mounted Cockpit**: 1 slot in CT (slot 12)

### 7. Actuators
- **Shoulder**: Fixed in arms (slot 1)
- **Upper Arm Actuator**: Fixed in arms (slot 2)
- **Lower Arm Actuator**: Conditionally removable (slot 3)
- **Hand Actuator**: Conditionally removable (slot 4)
- **Hip**: Fixed in legs (slot 1)
- **Upper Leg Actuator**: Fixed in legs (slot 2)
- **Lower Leg Actuator**: Fixed in legs (slot 3)
- **Foot Actuator**: Fixed in legs (slot 4)

## Implementation Details

### Component Behavior
1. **Fixed Components**: Cannot be moved or removed (engines, gyros, shoulders, etc.)
2. **Conditionally Removable**: Can be removed via context menu (lower arm, hand actuators)
3. **Special Components**: Individual 1-slot items that can be freely moved (Endo Steel, Ferro-Fibrous, Heat Sinks)

### Visual Styling
- Gray background: Fixed system components
- Purple background: Special components (Endo/Ferro)
- Red background: Heat sinks
- Green background: Equipment/weapons

### Key Features
- Double-click to remove equipment (prevents accidental removal)
- Drag and drop for all movable components
- Individual 1-slot behavior for all special components
- No grouping for special components or heat sinks
- Automatic equipment generation when changing structure/armor types
- Unified data model with reactive hooks

### Empty Slots
- Display "- Empty -" text (or "Location - Empty -" for first slot)
- Gray color with italic text
- Act as drop targets for equipment
- Show slot numbers consistently
