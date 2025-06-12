import React, { useState, useCallback, useMemo } from 'react';
import { EditableUnit } from '../../../types/editor';
import BasicInfoPanel from '../structure/BasicInfoPanel';
import ChassisConfigPanel from '../structure/ChassisConfigPanel';
import HeatSinksPanel from '../structure/HeatSinksPanel';
import MovementPanel from '../structure/MovementPanel';
import SummaryPanel from '../structure/SummaryPanel';
import ArmorAllocationPanel from '../armor/ArmorAllocationPanel';

interface StructureArmorTabProps {
  unit: EditableUnit;
  onUnitChange: (unit: EditableUnit) => void;
  readOnly?: boolean;
}

const StructureArmorTab: React.FC<StructureArmorTabProps> = ({
  unit,
  onUnitChange,
  readOnly = false,
}) => {
  // Component weights state
  const [heatSinkWeight, setHeatSinkWeight] = useState(0);
  const [jumpJetWeight, setJumpJetWeight] = useState(0);
  
  // Calculate structure weight
  const structureWeight = useMemo(() => {
    const STRUCTURE_MULTIPLIERS: { [key: string]: number } = {
      'standard': 0.1,
      'endo_steel': 0.05,
      'endo_steel_clan': 0.05,
      'composite': 0.05,
      'reinforced': 0.2,
      'industrial': 0.15,
    };
    
    const structureType = unit.data?.structure?.type || 'standard';
    const multiplier = STRUCTURE_MULTIPLIERS[structureType] || 0.1;
    return Math.ceil(unit.mass * multiplier * 2) / 2;
  }, [unit.mass, unit.data?.structure?.type]);
  
  // Calculate engine weight
  const engineWeight = useMemo(() => {
    const walkMP = unit.data?.movement?.walk_mp || 1;
    const engineRating = walkMP * unit.mass;
    
    const ENGINE_WEIGHT_MODS: { [key: string]: number } = {
      'fusion': 1.0,
      'xl': 0.5,
      'xl_clan': 0.5,
      'light': 0.75,
      'compact': 1.5,
      'ice': 2.0,
      'fuel_cell': 1.2,
    };
    
    const engineType = unit.data?.engine?.type || 'fusion';
    const weightMod = ENGINE_WEIGHT_MODS[engineType] || 1.0;
    const baseWeight = engineRating * 0.04;
    
    return Math.ceil(baseWeight * weightMod * 2) / 2;
  }, [unit.mass, unit.data?.movement?.walk_mp, unit.data?.engine?.type]);
  
  // Calculate gyro weight
  const gyroWeight = useMemo(() => {
    const walkMP = unit.data?.movement?.walk_mp || 1;
    const engineRating = walkMP * unit.mass;
    
    const GYRO_WEIGHT_MODS: { [key: string]: number } = {
      'standard': 1.0,
      'xl': 0.5,
      'compact': 1.5,
      'heavy_duty': 2.0,
      'none': 0,
    };
    
    const gyroType = unit.data?.gyro?.type || 'standard';
    const weightMod = GYRO_WEIGHT_MODS[gyroType] || 1.0;
    const baseWeight = Math.ceil(engineRating / 100);
    
    return baseWeight * weightMod;
  }, [unit.mass, unit.data?.movement?.walk_mp, unit.data?.gyro?.type]);
  
  // Calculate cockpit weight
  const cockpitWeight = useMemo(() => {
    const COCKPIT_WEIGHTS: { [key: string]: number } = {
      'standard': 3,
      'small': 2,
      'command_console': 3,
      'torso_mounted': 4,
      'primitive': 5,
      'primitive_industrial': 5,
      'industrial': 3,
    };
    
    const cockpitType = unit.data?.cockpit?.type || 'standard';
    return COCKPIT_WEIGHTS[cockpitType] || 3;
  }, [unit.data?.cockpit?.type]);
  
  // Calculate armor weight
  const armorWeight = useMemo(() => {
    let totalArmorPoints = 0;
    Object.values(unit.armorAllocation).forEach(location => {
      totalArmorPoints += location.front + (location.rear || 0);
    });
    
    const armorType = unit.armorAllocation['Center Torso']?.type;
    const pointsPerTon = armorType?.pointsPerTon || 16;
    
    return Math.ceil(totalArmorPoints / pointsPerTon * 2) / 2;
  }, [unit.armorAllocation]);
  
  // Calculate equipment weight
  const equipmentWeight = useMemo(() => {
    let weight = 0;
    unit.equipmentPlacements?.forEach(placement => {
      const eqWeight = placement.equipment.weight || 
                      placement.equipment.data?.tons || 
                      placement.equipment.data?.tonnage || 0;
      weight += Number(eqWeight);
    });
    return weight;
  }, [unit.equipmentPlacements]);
  
  // Calculate myomer weight
  const myomerWeight = useMemo(() => {
    const myomerType = unit.data?.myomer?.type;
    if (myomerType === 'tsm' || myomerType === 'industrial_tsm') {
      // TSM is 0 weight but takes critical slots
      return 0;
    }
    return 0;
  }, [unit.data?.myomer?.type]);
  
  // Create wrapper for ArmorAllocationPanel's onUnitChange
  const handleArmorChange = useCallback((updates: Partial<EditableUnit>) => {
    onUnitChange({ ...unit, ...updates });
  }, [unit, onUnitChange]);
  
  return (
    <div className="structure-armor-tab h-full bg-gray-100 p-3">
      {/* MegaMekLab Grid Layout */}
      <div className="grid grid-cols-[320px_1fr_380px] gap-3 h-full">
        {/* Left Column */}
        <div className="space-y-3 border-r border-gray-300 pr-3">
          <BasicInfoPanel
            unit={unit}
            onUnitChange={onUnitChange}
            readOnly={readOnly}
          />
          <div className="h-px bg-gray-300" />
          <ChassisConfigPanel
            unit={unit}
            onUnitChange={onUnitChange}
            readOnly={readOnly}
          />
        </div>
        
        {/* Middle Column */}
        <div className="space-y-3 px-3">
          <HeatSinksPanel
            unit={unit}
            onUnitChange={onUnitChange}
            readOnly={readOnly}
            onWeightChange={setHeatSinkWeight}
          />
          <div className="h-px bg-gray-300" />
          <MovementPanel
            unit={unit}
            onUnitChange={onUnitChange}
            readOnly={readOnly}
            onJumpJetWeightChange={setJumpJetWeight}
          />
          <div className="h-px bg-gray-300" />
          <SummaryPanel
            unit={unit}
            structureWeight={structureWeight}
            engineWeight={engineWeight}
            gyroWeight={gyroWeight}
            cockpitWeight={cockpitWeight}
            heatSinkWeight={heatSinkWeight}
            armorWeight={armorWeight}
            jumpJetWeight={jumpJetWeight}
            equipmentWeight={equipmentWeight}
            myomerWeight={myomerWeight}
          />
        </div>
        
        {/* Right Column - Armor Panel */}
        <div className="h-full border-l border-gray-300 pl-3">
          <ArmorAllocationPanel
            unit={unit}
            onUnitChange={handleArmorChange}
            showRearArmor={true}
            allowAutoAllocation={true}
            mechType={unit.data?.config as any || 'Biped'}
            readOnly={readOnly}
            compact={false}
          />
        </div>
      </div>
    </div>
  );
};

export default StructureArmorTab;
