# MegaMekLab Screen-by-Screen Analysis

## Screen 1: Structure/Armor Tab

### Layout Structure
The screen is divided into 6 main panels in a grid layout:

```
+-------------------+------------------+-------------------+
| Basic Information | Heat Sinks       | Armor             |
+-------------------+------------------+-------------------+
| Chassis           | Movement         | (Armor cont.)     |
+-------------------+------------------+-------------------+
                    | Summary          |
                    +------------------+
```

### 1.1 Basic Information Panel (Top Left)
**Fields:**
- Chassis: Text input (e.g., "New")
- Clan Name: Text input (empty)
- Model: Text input (e.g., "Mek")
- MUL ID: Numeric input (default: -1)
- Year: Numeric spinner (e.g., 3145)
- Source/Era: Text input (empty)
- Tech Base: Dropdown (Inner Sphere selected)
- Tech Level: Dropdown (Standard selected)
- Manual BV: Numeric input (empty)
- Role: Dropdown (empty)

**Icon Section:**
- Choose file button
- Import from cache button
- Remove button
- Icon preview area (shows default mech icon)

### 1.2 Heat Sinks Panel (Top Middle)
**Configuration:**
- Type: Dropdown (Single selected)
- Number: Spinner (10)
- Engine Free: Display (shows available from engine)
- Weight Free: Calculated value
- Total Dissipation: Calculated (10)
- Total Equipment Heat: Calculated (0)

### 1.3 Armor Panel (Top Right + extends down)
**Main Controls:**
- Armor Type: Dropdown (Standard selected)
- Armor Tonnage: Spinner with increment/decrement (0)
- Maximize Armor button
- Use Remaining Tonnage button

**Armor Allocation Section:**
- Headers: Location | Armor Points | Max
- Locations:
  - HD (Head): 0 input, Max: 9
  - LA (Left Arm): 0 input, Max: 8
  - LT (Left Torso): 0/0 (Front/Rear), Max: 12
  - CT (Center Torso): 0/0 (Front/Rear), Max: 16
  - RT (Right Torso): 0/0 (Front/Rear), Max: 12
  - RA (Right Arm): 0 input, Max: 8
  - LL (Left Leg): 0/0 inputs, Max: 12
  - RL (Right Leg): 0/0 inputs, Max: 12

**Statistics:**
- Unallocated Armor Points: 0
- Allocated Armor Points: 0
- Total Armor Points: 0
- Maximum Possible Armor Points: 89
- Wasted Armor Points: 0
- Points Per Ton: 16.00

**Auto-Allocate Armor button** at bottom

### 1.4 Chassis Panel (Bottom Left)
**Configuration:**
- Tonnage: Spinner (25)
- Omni checkbox (unchecked)
- Base Type: Dropdown (Standard selected)
- Motive Type: Dropdown (Biped selected)
- Structure: Dropdown (Standard selected)
- Engine: Dropdown (Fusion selected)
- Gyro: Dropdown (Standard selected)
- Cockpit: Dropdown (Standard Cockpit selected)
- Enhancement: Dropdown (None selected)

### 1.5 Movement Panel (Bottom Middle)
**Movement Points:**
- Base | Final columns
- Walk MP: 1 | 1
- Run MP: 2 | 2
- Jump/UMU MP: 0 | 0
- Jump Type: Dropdown (Jump Jet selected)
- Mech. J. Booster MP: 0 | 0

### 1.6 Summary Panel (Center)
**Weight Breakdown Table:**
- Headers: Component | Weight | Crits | Availability
- Unit Type: (calculation)
- Structure: 2.5 t | - | D/C-E-D-C
- Engine: 0.5 t | 6 | D/C-E-D-D
- Gyro: 1 t | 4 | D/C-C-C-C
- Cockpit: 3 t | 1 | D/C-C-C-C
- Heatsinks: - | 9 | C/B-B-B-B
- Armor: - | - | D/C-C-C-B
- Jump Jets: (empty)
- Equipment: (empty)
- Myomer: (empty)
- Other: (empty)

**Bottom:** Earliest Possible Year: 2463

## Screen 2: Equipment Tab

### Layout Structure
```
+---------------------------+------------------------+
| Control Buttons           | Equipment Database     |
+---------------------------+------------------------+
| Current Load Out          | (Database cont.)       |
+---------------------------+                        |
| Unallocated Equipment     |                        |
+---------------------------+------------------------+
```

### 2.1 Control Section (Top Left)
**Auto-Fill Buttons:**
- Auto Fill Unhittables
- Auto Compact
- Auto Sort

**Action Buttons:**
- Fill
- Compact
- Sort
- Reset

### 2.2 Current Load Out Panel (Left)
- Remove button
- Remove All button
- Table Headers: Name | Tons | Crits | Heat | Loc | Size
- Shows: AC/20 (14.0t, 10c, 7h) and Enhanced LRM 10 (6.0t, 4c, 4h)

### 2.3 Unallocated Equipment Panel (Bottom Left)
- Grid layout showing equipment placement
- Shows visual representation of equipment slots

### 2.4 Equipment Database Panel (Right)
**Filter Controls:**
- Note: "Ctrl-Click a filter to add it to the selected filters"
- Got it! button
- Show: Category buttons (Energy, Ballistic, Missile, Artillery, Physical, Ammo, Other, Show All)
- Hide: Filter buttons (Prototype, One-Shot, Torpedoes, Ammo w/o Weapon, Unavailable)
- << Add button
- Text Filter input
- Search button
- Switch Table Columns button

**Equipment Table:**
- Headers: Name▲ | Damage | Heat | Min R | Range | Shots | Base | BV | Weight | Crit | Reference
- Shows various weapons like AC/2, AC/5, AC/10, AC/20, Anti-BattleArmor Pods, etc.
- Selected: Enhanced LRM 10 (highlighted in blue)

## Screen 3: Assign Criticals Tab

### Layout Structure
```
+------------------+------------------+------------------+
| Left Side        | Center Section   | Right Side       |
| (Arms/Legs)      | (Torsos/Head)    | (Arms/Legs)      |
+------------------+------------------+------------------+
```

### 3.1 Critical Slot Layout
Each location shows:
- Location name header
- Slot listings (1-12 or appropriate number)
- Fixed equipment (e.g., Shoulder, Upper Arm, Lower Arm, Hand)
- Empty slots marked as "- Empty -"

**Specific Allocations Shown:**
- Head: Life Support, Sensors, Standard Cockpit, Life Support
- Center Torso: Engine (6 slots), Standard Gyro (4 slots)
- Left/Right Torso: Empty slots
- Arms: Shoulder, Upper/Lower Arm actuators, Hand, Empty slots
- Legs: Hip, Upper/Lower Leg actuators, Foot, Empty slots

### 3.2 Equipment Display
- Head section shows 10 Heat Sinks allocated
- AC/20 and Enhanced LRM 10 shown in unallocated area

## Screen 4: Quirks Tab

### Layout Structure
```
+--------------------------------+
| Positive Quirks                |
+--------------------------------+
| Negative Quirks                |
+--------------------------------+
| Weapon-Specific Quirks         |
+--------------------------------+
```

### 4.1 Positive Quirks Section
Multiple columns of checkboxes including:
- Animalistic Appearance
- Anti-Aircraft Targeting
- Battle Computer
- Battle Fists (LA/RA)
- Combat Computer
- Command Mek
- Compact Mek
- Cowl
- Directional Torso Mount
- Distracting
- Easy to Maintain
- Easy to Pilot
- Extended Torso Twist
- Fast Reload
- Fine Manipulators
- Good Reputation (1/2)
- Hyper-Extending Actuators
- Improved Communications
- Improved Life Support
- Improved Sensors
- Improved Targeting (Long/Medium/Short)
- Multi-Trac
- Narrow/Low Profile
- Nimble Jumper
- Overhead Arms
- Protected Actuators
- Reinforced Legs
- Rugged (1/2 Point)
- Scout Bike
- Searchlight
- Stable
- Ubiquitous (Clans/Inner Sphere)
- Variable Range Targeting (long/short)
- Vestigial Hands (Left/Right)

### 4.2 Negative Quirks Section
Multiple columns including:
- Bad Reputation (Clan/Inner Sphere)
- Cramped Cockpit
- Difficult Ejection
- Difficult to Maintain
- EM Interference (Whole Unit)
- Exposed Actuators
- Flawed Cooling System
- Hard to Pilot
- Illegal Design
- Low-Mounted Arms
- No Ejection System
- No Torso Twist (Legacy)
- No/Minimal Arms
- Non-Standard Parts
- Obsolete
- Poor Life Support
- Poor Performance
- Poor Sealing
- Poor Targeting (Long/Medium/Short)
- Poor Workmanship
- Prototype
- Ramshackle
- Sensor Ghosts
- Susceptible to Centurion Weapon System
- Unbalanced
- Weak Head Armor (1-5)
- Weak Legs

### 4.3 Weapon-Specific Quirks (AC/20)
Checkboxes for:
- Accurate Weapon
- Ammo Feed Problems
- Directional Torso Mounted Weapon
- Fast Reload
- Improved Cooling Jacket
- Inaccurate Weapon
- Jettison-Capable Weapon
- Misrepaired Weapon
- Misreplaced Weapon
- Modular Weapon
- Non-Functional
- Poor Cooling Jacket
- Stabilized Weapon

## Implementation Priority Order

1. **Core Structure/Armor Tab Components**
   - Chassis configuration (affects everything)
   - Armor allocation system
   - Summary calculations

2. **Equipment Management**
   - Equipment database with filtering
   - Drag-and-drop assignment
   - Current loadout tracking

3. **Critical Slot Assignment**
   - Visual slot layout
   - Fixed equipment placement
   - Equipment distribution

4. **Quirks System**
   - Positive/negative quirk selection
   - Weapon-specific quirks
   - Cost/benefit calculations

5. **Integration Features**
   - Auto-allocation algorithms
   - Validation across all tabs
   - Export/save functionality
