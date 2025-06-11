import { CustomizableUnit, UnitEquipmentItem, EquipmentItem } from '../types/customizer';
import {
  UnitDisplayData,
  UnitAnalysisContext,
  HeatManagementInfo,
  ArmorInfo,
  StructureInfo,
  EquipmentSummary,
  CriticalSlotSummary,
  BuildRecommendation,
  TechnicalSpecs
} from '../types/unitDisplay';

export class UnitAnalyzer {
  /**
   * Performs comprehensive analysis of a unit and returns all display data
   */
  static analyzeUnit(
    unit: CustomizableUnit,
    loadout: UnitEquipmentItem[],
    availableEquipment: EquipmentItem[],
    context: UnitAnalysisContext
  ): UnitDisplayData {
    const result: UnitDisplayData = {
      unit,
      loadout,
      availableEquipment
    };

    if (context.includeHeatAnalysis && context.unitType === 'BattleMech') {
      result.heatManagement = this.analyzeHeatManagement(unit, loadout, availableEquipment);
    }

    if (context.includeArmorAnalysis) {
      result.armorInfo = this.analyzeArmor(unit);
    }

    result.structureInfo = this.analyzeStructure(unit);

    if (context.includeEquipmentAnalysis) {
      result.equipmentSummary = this.analyzeEquipment(loadout, availableEquipment);
    }

    if (context.unitType === 'BattleMech') {
      result.criticalSlotSummary = this.analyzeCriticalSlots(unit);
    }

    if (context.includeBuildRecommendations) {
      result.buildRecommendations = this.generateBuildRecommendations(unit, loadout, availableEquipment, result);
    }

    result.technicalSpecs = this.calculateTechnicalSpecs(unit, loadout, availableEquipment);

    return result;
  }

  /**
   * Analyzes heat generation and dissipation for BattleMechs
   */
  static analyzeHeatManagement(
    unit: CustomizableUnit,
    loadout: UnitEquipmentItem[],
    availableEquipment: EquipmentItem[]
  ): HeatManagementInfo {
    // Calculate heat generation from weapons
    let totalHeatGeneration = 0;
    loadout.forEach(item => {
      const equipment = availableEquipment.find(eq => 
        eq.internal_id === item.item_name || eq.name === item.item_name
      );
      if (equipment?.weapon_details?.heat) {
        totalHeatGeneration += equipment.weapon_details.heat;
      }
    });

    // Add movement heat (walking generates 1 heat)
    totalHeatGeneration += 1;

    // Calculate heat sinks
    const heatSinkCount = unit.data?.heat_sinks?.count || 10;
    const heatSinkType = unit.data?.heat_sinks?.type || 'Single';
    const dissipationPerSink = heatSinkType === 'Double' ? 2 : 1;
    const totalHeatDissipation = heatSinkCount * dissipationPerSink;

    // Engine heat sink capacity (usually 10 for most engines)
    const engineRating = unit.data?.engine?.rating || 0;
    const engineHeatSinkCapacity = Math.min(10, Math.floor(engineRating / 25));
    const engineIntegratedHeatSinks = Math.min(heatSinkCount, engineHeatSinkCapacity);
    const externalHeatSinks = Math.max(0, heatSinkCount - engineIntegratedHeatSinks);

    const heatBalance = totalHeatDissipation - totalHeatGeneration;

    let overheatingRisk: HeatManagementInfo['overheatingRisk'] = 'none';
    if (heatBalance < 0) {
      if (heatBalance >= -2) overheatingRisk = 'low';
      else if (heatBalance >= -5) overheatingRisk = 'medium';
      else if (heatBalance >= -10) overheatingRisk = 'high';
      else overheatingRisk = 'critical';
    }

    return {
      totalHeatGeneration,
      totalHeatDissipation,
      heatBalance,
      totalHeatSinks: heatSinkCount,
      engineIntegratedHeatSinks,
      externalHeatSinks,
      engineHeatSinkCapacity,
      heatSinkType,
      overheatingRisk
    };
  }

  /**
   * Analyzes armor distribution and efficiency
   */
  static analyzeArmor(unit: CustomizableUnit): ArmorInfo {
    const armorData = unit.data?.armor;
    if (!armorData) {
      return {
        type: 'Standard',
        totalArmorPoints: 0,
        maxArmorPoints: 0,
        armorEfficiency: 0,
        locationBreakdown: [],
        armorTonnage: 0
      };
    }

    let totalArmorPoints = 0;
    const locationBreakdown = (armorData.locations || []).map(loc => {
      const armorPoints = loc.armor_points || 0;
      const rearArmorPoints = loc.rear_armor_points;
      totalArmorPoints += armorPoints + (rearArmorPoints || 0);

      // Calculate max armor for location (simplified)
      let maxArmorPoints = 0;
      if (loc.location === 'Head') {
        maxArmorPoints = 9;
      } else {
        // Estimate based on unit mass (this would need more sophisticated logic)
        maxArmorPoints = Math.floor(unit.mass * 0.8);
      }

      return {
        location: loc.location,
        armorPoints,
        maxArmorPoints,
        rearArmorPoints,
        maxRearArmorPoints: rearArmorPoints ? maxArmorPoints : undefined
      };
    });

    const maxArmorPoints = Math.floor(unit.mass * 3.5 + 40); // Simplified max armor calculation
    const armorEfficiency = maxArmorPoints > 0 ? (totalArmorPoints / maxArmorPoints) * 100 : 0;

    // Estimate armor tonnage (simplified)
    const armorTonnage = Math.ceil(totalArmorPoints / 16); // Standard armor provides 16 points per ton

    return {
      type: armorData.type || 'Standard',
      totalArmorPoints,
      maxArmorPoints,
      armorEfficiency,
      locationBreakdown,
      armorTonnage
    };
  }

  /**
   * Analyzes internal structure
   */
  static analyzeStructure(unit: CustomizableUnit): StructureInfo {
    const structureData = unit.data?.structure;
    const structureType = structureData?.type || 'Standard';
    
    // Calculate total internal structure points (simplified)
    const totalInternalStructure = Math.floor(unit.mass / 10) * 10; // Rough estimate
    
    // Estimate structure tonnage
    let structureTonnage = Math.ceil(unit.mass / 10);
    if (structureType === 'Endo Steel') {
      structureTonnage = Math.ceil(structureTonnage / 2);
    }

    const structureEfficiency = 100; // Structures are typically at max efficiency

    return {
      type: structureType,
      totalInternalStructure,
      structureTonnage,
      structureEfficiency
    };
  }

  /**
   * Analyzes equipment distribution and categories
   */
  static analyzeEquipment(
    loadout: UnitEquipmentItem[],
    availableEquipment: EquipmentItem[]
  ): EquipmentSummary {
    let totalEquipmentTonnage = 0;
    const equipmentByCategory: { [key: string]: { count: number; tonnage: number; items: string[] } } = {};
    let weaponCounts = {
      totalWeapons: 0,
      energyWeapons: 0,
      ballisticWeapons: 0,
      missileWeapons: 0,
      physicalWeapons: 0
    };

    loadout.forEach(item => {
      const equipment = availableEquipment.find(eq => 
        eq.internal_id === item.item_name || eq.name === item.item_name
      );

      if (equipment) {
        totalEquipmentTonnage += equipment.tonnage;
        
        const category = equipment.category || equipment.type || 'Other';
        if (!equipmentByCategory[category]) {
          equipmentByCategory[category] = { count: 0, tonnage: 0, items: [] };
        }
        
        equipmentByCategory[category].count++;
        equipmentByCategory[category].tonnage += equipment.tonnage;
        equipmentByCategory[category].items.push(equipment.name);

        // Weapon categorization
        if (item.item_type === 'weapon') {
          weaponCounts.totalWeapons++;
          
          if (equipment.category?.toLowerCase().includes('energy')) {
            weaponCounts.energyWeapons++;
          } else if (equipment.category?.toLowerCase().includes('ballistic')) {
            weaponCounts.ballisticWeapons++;
          } else if (equipment.category?.toLowerCase().includes('missile')) {
            weaponCounts.missileWeapons++;
          } else if (equipment.category?.toLowerCase().includes('physical')) {
            weaponCounts.physicalWeapons++;
          }
        }
      }
    });

    return {
      totalEquipmentCount: loadout.length,
      totalEquipmentTonnage,
      equipmentByCategory: Object.entries(equipmentByCategory).map(([category, data]) => ({
        category,
        ...data
      })),
      weaponSummary: weaponCounts
    };
  }

  /**
   * Analyzes critical slot utilization for BattleMechs
   */
  static analyzeCriticalSlots(unit: CustomizableUnit): CriticalSlotSummary {
    const criticals = unit.data?.criticals || [];
    let totalSlots = 0;
    let usedSlots = 0;

    const locationBreakdown = criticals.map(location => {
      const slots = location.slots || [];
      const locationTotalSlots = slots.length;
      const locationUsedSlots = slots.filter(slot => 
        slot && slot !== '-Empty-' && slot.trim() !== ''
      ).length;
      
      totalSlots += locationTotalSlots;
      usedSlots += locationUsedSlots;

      return {
        location: location.location,
        totalSlots: locationTotalSlots,
        usedSlots: locationUsedSlots,
        availableSlots: locationTotalSlots - locationUsedSlots,
        utilizationPercentage: locationTotalSlots > 0 ? 
          (locationUsedSlots / locationTotalSlots) * 100 : 0
      };
    });

    return {
      totalSlots,
      usedSlots,
      availableSlots: totalSlots - usedSlots,
      locationBreakdown
    };
  }

  /**
   * Generates build recommendations based on analysis
   */
  static generateBuildRecommendations(
    unit: CustomizableUnit,
    loadout: UnitEquipmentItem[],
    availableEquipment: EquipmentItem[],
    analysisData: UnitDisplayData
  ): BuildRecommendation[] {
    const recommendations: BuildRecommendation[] = [];

    // Heat management recommendations
    if (analysisData.heatManagement) {
      const heat = analysisData.heatManagement;
      if (heat.overheatingRisk === 'high' || heat.overheatingRisk === 'critical') {
        recommendations.push({
          id: 'heat-management-critical',
          type: 'heat_management',
          priority: 'high',
          title: 'Critical Heat Management Issue',
          description: `Unit generates ${heat.totalHeatGeneration} heat but only dissipates ${heat.totalHeatDissipation}. Add ${Math.abs(heat.heatBalance)} more heat sinks.`,
          suggestedActions: [`Add ${Math.abs(heat.heatBalance)} heat sinks`],
          autoApplyable: true
        });
      } else if (heat.overheatingRisk === 'medium') {
        recommendations.push({
          id: 'heat-management-warning',
          type: 'heat_management',
          priority: 'medium',
          title: 'Heat Management Warning',
          description: `Unit may overheat under sustained fire. Consider adding ${Math.abs(heat.heatBalance) + 2} heat sinks for safety margin.`,
          suggestedActions: [`Add ${Math.abs(heat.heatBalance) + 2} heat sinks for safety`],
          autoApplyable: true
        });
      }
    }

    // Armor efficiency recommendations
    if (analysisData.armorInfo) {
      const armor = analysisData.armorInfo;
      if (armor.armorEfficiency < 80) {
        recommendations.push({
          id: 'armor-efficiency',
          type: 'protection',
          priority: 'medium',
          title: 'Low Armor Efficiency',
          description: `Unit is only using ${armor.armorEfficiency.toFixed(1)}% of maximum armor. Consider maximizing armor for better protection.`,
          suggestedActions: ['Maximize armor allocation'],
          autoApplyable: true
        });
      }
    }

    // Critical slot utilization
    if (analysisData.criticalSlotSummary) {
      const slots = analysisData.criticalSlotSummary;
      if (slots.availableSlots > 10) {
        recommendations.push({
          id: 'slot-utilization',
          type: 'optimization',
          priority: 'low',
          title: 'Unused Critical Slots',
          description: `${slots.availableSlots} critical slots are unused. Consider adding more equipment.`,
          suggestedActions: ['Review equipment options for unused slots'],
          autoApplyable: false
        });
      }
    }

    // Equipment balance recommendations
    if (analysisData.equipmentSummary) {
      const equipment = analysisData.equipmentSummary;
      if (equipment.weaponSummary.totalWeapons === 0) {
        recommendations.push({
          id: 'no-weapons',
          type: 'constraint_violation',
          priority: 'high',
          title: 'No Weapons Equipped',
          description: 'Unit has no weapons equipped. This is likely not a valid combat unit.',
          suggestedActions: ['Add weapons to the unit'],
          autoApplyable: false
        });
      } else if (equipment.weaponSummary.totalWeapons < 3) {
        recommendations.push({
          id: 'few-weapons',
          type: 'optimization',
          priority: 'medium',
          title: 'Limited Weaponry',
          description: 'Unit has very few weapons. Consider adding more for combat effectiveness.',
          suggestedActions: ['Add more weapons for balanced firepower'],
          autoApplyable: false
        });
      }
    }

    return recommendations;
  }

  /**
   * Calculates comprehensive technical specifications
   */
  static calculateTechnicalSpecs(
    unit: CustomizableUnit,
    loadout: UnitEquipmentItem[],
    availableEquipment: EquipmentItem[]
  ): TechnicalSpecs {
    // Calculate equipment tonnage
    const equipmentTonnage = loadout.reduce((sum, item) => {
      const equipment = availableEquipment.find(eq => 
        eq.internal_id === item.item_name || eq.name === item.item_name
      );
      return sum + (equipment?.tonnage || 0);
    }, 0);

    // Estimate tonnage breakdown (simplified)
    const engineRating = unit.data?.engine?.rating || 0;
    const engineTonnage = Math.ceil(engineRating / 25); // Simplified engine weight calculation
    
    const weaponTonnage = loadout
      .filter(item => item.item_type === 'weapon')
      .reduce((sum, item) => {
        const equipment = availableEquipment.find(eq => 
          eq.internal_id === item.item_name || eq.name === item.item_name
        );
        return sum + (equipment?.tonnage || 0);
      }, 0);

    const ammoTonnage = loadout
      .filter(item => item.item_type === 'ammo')
      .reduce((sum, item) => {
        const equipment = availableEquipment.find(eq => 
          eq.internal_id === item.item_name || eq.name === item.item_name
        );
        return sum + (equipment?.tonnage || 0);
      }, 0);

    // Calculate movement speeds
    const walkMP = unit.data?.movement?.walk_mp || 0;
    const runMP = unit.data?.movement?.run_mp || walkMP * 1.5;
    const jumpMP = unit.data?.movement?.jump_mp || 0;

    // Convert MP to kph (simplified: MP * 10.8 for walking speed)
    const walkSpeed = walkMP * 10.8;
    const runSpeed = runMP * 10.8;
    const jumpSpeed = jumpMP * 10.8;

    return {
      battleValue: 0, // Would need complex BV calculation
      costCBills: 0, // Would need complex cost calculation
      techLevel: unit.data?.tech_base || 'Inner Sphere',
      rulesLevel: 'Standard', // Would need to determine from equipment
      walkSpeed,
      runSpeed,
      jumpSpeed,
      tonnageBreakdown: {
        chassis: unit.mass - equipmentTonnage - engineTonnage,
        engine: engineTonnage,
        heatSinks: (unit.data?.heat_sinks?.count || 10) * 1, // Simplified
        armor: 0, // Would need armor tonnage calculation
        structure: Math.ceil(unit.mass / 10), // Simplified
        equipment: equipmentTonnage - weaponTonnage - ammoTonnage,
        weapons: weaponTonnage,
        ammunition: ammoTonnage
      }
    };
  }
}
