import React, { useState } from 'react';
import Layout from '../components/common/Layout';
import { ArmorLocationControl } from '../components/editor/armor/ArmorLocationControl';
import { ArmorStatisticsPanel } from '../components/editor/armor/ArmorStatisticsPanel';
import { EditableUnit, ArmorType, ARMOR_TYPES, MECH_LOCATIONS } from '../types/editor';
import styles from '../styles/demo.module.css';

// Create a sample unit for testing
const createSampleUnit = (): EditableUnit => ({
  id: 'demo-mech',
  name: 'Demo Mech',
  mass: 50,
  chassis: 'Demo',
  model: 'DM-1',
  unit_type: 'BattleMech',
  unit_subtype: 'Biped',
  era: '3025',
  tech_base: 'Inner Sphere',
  data: {} as any, // Minimal data for demo
  armorAllocation: {
    [MECH_LOCATIONS.HEAD]: {
      front: 9,
      maxArmor: 9,
      type: ARMOR_TYPES[0]
    },
    [MECH_LOCATIONS.CENTER_TORSO]: {
      front: 20,
      rear: 10,
      maxArmor: 35,
      type: ARMOR_TYPES[0]
    },
    [MECH_LOCATIONS.LEFT_TORSO]: {
      front: 15,
      rear: 8,
      maxArmor: 24,
      type: ARMOR_TYPES[0]
    },
    [MECH_LOCATIONS.RIGHT_TORSO]: {
      front: 15,
      rear: 8,
      maxArmor: 24,
      type: ARMOR_TYPES[0]
    },
    [MECH_LOCATIONS.LEFT_ARM]: {
      front: 15,
      maxArmor: 16,
      type: ARMOR_TYPES[0]
    },
    [MECH_LOCATIONS.RIGHT_ARM]: {
      front: 15,
      maxArmor: 16,
      type: ARMOR_TYPES[0]
    },
    [MECH_LOCATIONS.LEFT_LEG]: {
      front: 20,
      maxArmor: 24,
      type: ARMOR_TYPES[0]
    },
    [MECH_LOCATIONS.RIGHT_LEG]: {
      front: 20,
      maxArmor: 24,
      type: ARMOR_TYPES[0]
    }
  },
  equipmentPlacements: [],
  criticalSlots: [],
  fluffData: {},
  selectedQuirks: [],
  validationState: { isValid: true, errors: [], warnings: [] },
  editorMetadata: {
    lastModified: new Date(),
    isDirty: false,
    version: '1.0.0'
  }
} as EditableUnit);

const ArmorLocationDemo: React.FC = () => {
  const [unit, setUnit] = useState<EditableUnit>(createSampleUnit());
  const [armorTonnage] = useState(10); // 10 tons of armor

  const handleArmorChange = (location: string, front: number, rear?: number) => {
    setUnit(prevUnit => ({
      ...prevUnit,
      armorAllocation: {
        ...prevUnit.armorAllocation,
        [location]: {
          ...prevUnit.armorAllocation[location],
          front,
          ...(rear !== undefined && { rear })
        }
      }
    }));
  };

  const handleArmorTypeChange = (armorType: ArmorType) => {
    setUnit(prevUnit => {
      const newAllocation = { ...prevUnit.armorAllocation };
      Object.keys(newAllocation).forEach(location => {
        newAllocation[location].type = armorType;
      });
      return {
        ...prevUnit,
        armorAllocation: newAllocation
      };
    });
  };

  return (
    <Layout>
      <div className={styles.container}>
        <h1>Armor Components Demo</h1>
        
        <div className={styles.grid}>
          {/* Left Column - Armor Location Controls */}
          <div className={styles.column}>
            <h2>Armor Location Controls</h2>
            <p>These controls allow you to allocate armor points to each location:</p>
            
            <div className={styles.controlsGrid}>
              {/* Head */}
              <ArmorLocationControl
                location={MECH_LOCATIONS.HEAD}
                maxArmor={unit.armorAllocation[MECH_LOCATIONS.HEAD].maxArmor}
                currentFront={unit.armorAllocation[MECH_LOCATIONS.HEAD].front}
                hasRear={false}
                armorType={unit.armorAllocation[MECH_LOCATIONS.HEAD].type}
                onChange={handleArmorChange}
              />
              
              {/* Torsos with rear armor */}
              <ArmorLocationControl
                location={MECH_LOCATIONS.CENTER_TORSO}
                maxArmor={unit.armorAllocation[MECH_LOCATIONS.CENTER_TORSO].maxArmor}
                currentFront={unit.armorAllocation[MECH_LOCATIONS.CENTER_TORSO].front}
                currentRear={unit.armorAllocation[MECH_LOCATIONS.CENTER_TORSO].rear}
                hasRear={true}
                armorType={unit.armorAllocation[MECH_LOCATIONS.CENTER_TORSO].type}
                onChange={handleArmorChange}
              />
              
              <ArmorLocationControl
                location={MECH_LOCATIONS.LEFT_TORSO}
                maxArmor={unit.armorAllocation[MECH_LOCATIONS.LEFT_TORSO].maxArmor}
                currentFront={unit.armorAllocation[MECH_LOCATIONS.LEFT_TORSO].front}
                currentRear={unit.armorAllocation[MECH_LOCATIONS.LEFT_TORSO].rear}
                hasRear={true}
                armorType={unit.armorAllocation[MECH_LOCATIONS.LEFT_TORSO].type}
                onChange={handleArmorChange}
              />
              
              <ArmorLocationControl
                location={MECH_LOCATIONS.RIGHT_TORSO}
                maxArmor={unit.armorAllocation[MECH_LOCATIONS.RIGHT_TORSO].maxArmor}
                currentFront={unit.armorAllocation[MECH_LOCATIONS.RIGHT_TORSO].front}
                currentRear={unit.armorAllocation[MECH_LOCATIONS.RIGHT_TORSO].rear}
                hasRear={true}
                armorType={unit.armorAllocation[MECH_LOCATIONS.RIGHT_TORSO].type}
                onChange={handleArmorChange}
              />
              
              {/* Arms */}
              <ArmorLocationControl
                location={MECH_LOCATIONS.LEFT_ARM}
                maxArmor={unit.armorAllocation[MECH_LOCATIONS.LEFT_ARM].maxArmor}
                currentFront={unit.armorAllocation[MECH_LOCATIONS.LEFT_ARM].front}
                hasRear={false}
                armorType={unit.armorAllocation[MECH_LOCATIONS.LEFT_ARM].type}
                onChange={handleArmorChange}
              />
              
              <ArmorLocationControl
                location={MECH_LOCATIONS.RIGHT_ARM}
                maxArmor={unit.armorAllocation[MECH_LOCATIONS.RIGHT_ARM].maxArmor}
                currentFront={unit.armorAllocation[MECH_LOCATIONS.RIGHT_ARM].front}
                hasRear={false}
                armorType={unit.armorAllocation[MECH_LOCATIONS.RIGHT_ARM].type}
                onChange={handleArmorChange}
              />
              
              {/* Legs */}
              <ArmorLocationControl
                location={MECH_LOCATIONS.LEFT_LEG}
                maxArmor={unit.armorAllocation[MECH_LOCATIONS.LEFT_LEG].maxArmor}
                currentFront={unit.armorAllocation[MECH_LOCATIONS.LEFT_LEG].front}
                hasRear={false}
                armorType={unit.armorAllocation[MECH_LOCATIONS.LEFT_LEG].type}
                onChange={handleArmorChange}
              />
              
              <ArmorLocationControl
                location={MECH_LOCATIONS.RIGHT_LEG}
                maxArmor={unit.armorAllocation[MECH_LOCATIONS.RIGHT_LEG].maxArmor}
                currentFront={unit.armorAllocation[MECH_LOCATIONS.RIGHT_LEG].front}
                hasRear={false}
                armorType={unit.armorAllocation[MECH_LOCATIONS.RIGHT_LEG].type}
                onChange={handleArmorChange}
              />
            </div>
            
            <h3>Compact Mode Example</h3>
            <ArmorLocationControl
              location="Example Location"
              maxArmor={20}
              currentFront={15}
              currentRear={5}
              hasRear={true}
              armorType={ARMOR_TYPES[0]}
              onChange={() => {}}
              compact={true}
            />
          </div>
          
          {/* Right Column - Armor Statistics */}
          <div className={styles.column}>
            <h2>Armor Statistics Panel</h2>
            <p>This panel shows overall armor allocation statistics:</p>
            
            <ArmorStatisticsPanel
              unit={unit}
              totalArmorTonnage={armorTonnage}
              onArmorTypeChange={handleArmorTypeChange}
            />
            
            <h3>Read-Only Example</h3>
            <ArmorStatisticsPanel
              unit={unit}
              totalArmorTonnage={armorTonnage}
              readOnly={true}
            />
          </div>
        </div>
        
        <div className={styles.notes}>
          <h2>Implementation Notes</h2>
          <ul>
            <li>The ArmorLocationControl component handles individual location armor allocation</li>
            <li>It supports both front-only and front/rear armor configurations</li>
            <li>The component validates input to prevent exceeding maximum armor values</li>
            <li>The ArmorStatisticsPanel shows overall armor usage and efficiency</li>
            <li>Both components support read-only and compact modes</li>
            <li>These components follow the MegaMekLab design patterns</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default ArmorLocationDemo;
