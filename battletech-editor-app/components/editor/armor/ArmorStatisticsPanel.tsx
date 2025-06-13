import React from 'react';
import { EditableUnit, ArmorType, ARMOR_TYPES } from '../../../types/editor';
import styles from './ArmorStatisticsPanel.module.css';

export interface ArmorStatisticsProps {
  unit: EditableUnit;
  totalArmorTonnage: number;
  onArmorTypeChange?: (armorType: ArmorType) => void;
  readOnly?: boolean;
}

export const ArmorStatisticsPanel: React.FC<ArmorStatisticsProps> = ({
  unit,
  totalArmorTonnage,
  onArmorTypeChange,
  readOnly = false,
}) => {
  // Get current armor type
  const currentArmorType = unit.armorAllocation?.HEAD?.type || ARMOR_TYPES[0];
  
  // Calculate armor statistics
  const calculateArmorStats = () => {
    let totalAllocated = 0;
    let totalMax = 0;
    
    if (unit.armorAllocation) {
      Object.entries(unit.armorAllocation).forEach(([location, armor]) => {
        totalAllocated += armor.front + (armor.rear || 0);
        totalMax += armor.maxArmor;
      });
    }
    
    const pointsPerTon = currentArmorType.pointsPerTon;
    const totalPoints = Math.floor(totalArmorTonnage * pointsPerTon);
    const unallocated = totalPoints - totalAllocated;
    const wasted = unallocated > 0 ? unallocated % pointsPerTon : 0;
    
    return {
      totalAllocated,
      totalMax,
      totalPoints,
      unallocated,
      wasted,
      efficiency: totalMax > 0 ? (totalAllocated / totalMax) * 100 : 0
    };
  };
  
  const stats = calculateArmorStats();
  
  const handleArmorTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!readOnly && onArmorTypeChange) {
      const selectedType = ARMOR_TYPES.find(type => type.id === e.target.value);
      if (selectedType) {
        onArmorTypeChange(selectedType);
      }
    }
  };
  
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Armor Statistics</h3>
      
      {/* Armor Type Selection */}
      <div className={styles.section}>
        <label className={styles.label}>
          Armor Type:
          <select 
            className={styles.select}
            value={currentArmorType.id}
            onChange={handleArmorTypeChange}
            disabled={readOnly}
          >
            {ARMOR_TYPES.map(type => (
              <option key={type.id} value={type.id}>
                {type.name} ({type.pointsPerTon} pts/ton)
              </option>
            ))}
          </select>
        </label>
        {currentArmorType.criticalSlots > 0 && (
          <div className={styles.info}>
            Requires {currentArmorType.criticalSlots} critical slots
          </div>
        )}
      </div>
      
      {/* Armor Tonnage */}
      <div className={styles.section}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Armor Tonnage:</span>
          <span className={styles.statValue}>{totalArmorTonnage} tons</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Points per Ton:</span>
          <span className={styles.statValue}>{currentArmorType.pointsPerTon}</span>
        </div>
      </div>
      
      {/* Allocation Statistics */}
      <div className={styles.section}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total Points:</span>
          <span className={styles.statValue}>{stats.totalPoints}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Allocated:</span>
          <span className={styles.statValue}>{stats.totalAllocated}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Unallocated:</span>
          <span className={`${styles.statValue} ${stats.unallocated > 0 ? styles.warning : ''}`}>
            {stats.unallocated}
          </span>
        </div>
        {stats.wasted > 0 && (
          <div className={styles.stat}>
            <span className={styles.statLabel}>Wasted:</span>
            <span className={`${styles.statValue} ${styles.error}`}>
              {stats.wasted}
            </span>
          </div>
        )}
      </div>
      
      {/* Progress Bar */}
      <div className={styles.progressSection}>
        <div className={styles.progressLabel}>
          <span>Allocation Progress</span>
          <span>{stats.efficiency.toFixed(1)}%</span>
        </div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${Math.min(stats.efficiency, 100)}%` }}
          />
        </div>
      </div>
      
      {/* Max Armor Info */}
      <div className={styles.section}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Maximum Possible:</span>
          <span className={styles.statValue}>{stats.totalMax} points</span>
        </div>
        <div className={styles.info}>
          {stats.totalAllocated < stats.totalMax && (
            <span>
              You can allocate {stats.totalMax - stats.totalAllocated} more points to reach maximum protection.
            </span>
          )}
          {stats.totalAllocated === stats.totalMax && (
            <span className={styles.success}>
              Maximum armor allocated!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArmorStatisticsPanel;
