/**
 * Unit JSON Migration Service
 * Converts MegaMekLab JSON format to TypeScript UnitConfiguration format
 */

import { UnitConfiguration } from '../criticalSlots/UnitCriticalManagerTypes';
import { ComponentConfiguration, TechBase } from '../../types/componentConfiguration';

// Field name mapping from JSON snake_case to TypeScript camelCase
const FIELD_MAPPING: Record<string, string> = {
  'tech_base': 'techBase',
  'mass': 'tonnage',
  'walk_mp': 'walkMP',
  'jump_mp': 'jumpMP',
  'run_mp': 'runMP',
  'mul_id': 'mulId',
  'rules_level': 'rulesLevel'
};

// Tech base value normalization
const TECH_BASE_MAPPING: Record<string, TechBase> = {
  'IS': 'Inner Sphere',
  'Inner Sphere': 'Inner Sphere',
  'Clan': 'Clan'
};

// Engine type mapping
const ENGINE_TYPE_MAPPING: Record<string, string> = {
  'Fusion Engine': 'Fusion',
  'Light Engine': 'Light Fusion',
  'XL Engine': 'XL',
  'XXL Engine': 'XXL',
  'Compact Engine': 'Compact',
  'ICE Engine': 'ICE',
  'Fuel Cell Engine': 'Fuel Cell'
};

export interface MigrationResult {
  success: boolean;
  unitConfiguration?: Partial<UnitConfiguration>;
  errors: string[];
  warnings: string[];
}

export interface MigrationValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: string[];
  typeErrors: string[];
}

export class UnitJSONMigrationService {
  
  /**
   * Migrate a JSON unit to UnitConfiguration format
   */
  migrateUnit(jsonUnit: any): MigrationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Step 1: Basic field normalization
      const normalizedFields = this.normalizeFields(jsonUnit);
      
      // Step 2: Extract and convert basic properties
      const baseConfig = this.extractBaseConfiguration(normalizedFields, errors, warnings);
      
      // Step 3: Convert engine configuration
      const engineConfig = this.convertEngineConfiguration(jsonUnit, errors, warnings);
      
      // Step 4: Convert component configurations (basic for now)
      const componentConfig = this.convertBasicComponents(jsonUnit, baseConfig.techBase || 'Inner Sphere', errors, warnings);
      
      // Combine all configurations
      const unitConfiguration: Partial<UnitConfiguration> = {
        ...baseConfig,
        ...engineConfig,
        ...componentConfig
      };
      
      return {
        success: errors.length === 0,
        unitConfiguration,
        errors,
        warnings
      };
      
    } catch (error) {
      errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        errors,
        warnings
      };
    }
  }
  
  /**
   * Normalize field names from snake_case to camelCase
   */
  private normalizeFields(jsonUnit: any): any {
    const normalized: any = {};
    
    for (const [key, value] of Object.entries(jsonUnit)) {
      const normalizedKey = FIELD_MAPPING[key] || key;
      normalized[normalizedKey] = value;
    }
    
    return normalized;
  }
  
  /**
   * Extract basic configuration properties
   */
  private extractBaseConfiguration(
    normalizedFields: any, 
    errors: string[], 
    warnings: string[]
  ): Partial<UnitConfiguration> {
    const config: Partial<UnitConfiguration> = {};
    
    // Required fields
    if (normalizedFields.chassis) {
      config.chassis = normalizedFields.chassis;
    } else {
      errors.push('Missing required field: chassis');
    }
    
    if (normalizedFields.model) {
      config.model = normalizedFields.model;
    } else {
      errors.push('Missing required field: model');
    }
    
    // Tonnage (from mass field)
    if (typeof normalizedFields.tonnage === 'number') {
      config.tonnage = normalizedFields.tonnage;
      config.mass = normalizedFields.tonnage; // Legacy compatibility
    } else {
      errors.push('Missing or invalid tonnage/mass field');
    }
    
    // Tech base
    if (normalizedFields.techBase) {
      const mappedTechBase = TECH_BASE_MAPPING[normalizedFields.techBase];
      if (mappedTechBase) {
        config.techBase = mappedTechBase;
      } else {
        errors.push(`Unknown tech base: ${normalizedFields.techBase}`);
      }
    } else {
      warnings.push('Missing tech base, defaulting to Inner Sphere');
      config.techBase = 'Inner Sphere';
    }
    
    // Unit type (default to BattleMech for now)
    config.unitType = 'BattleMech';
    
    // Movement points
    if (typeof normalizedFields.walkMP === 'string') {
      config.walkMP = parseInt(normalizedFields.walkMP, 10);
    } else if (typeof normalizedFields.walkMP === 'number') {
      config.walkMP = normalizedFields.walkMP;
    }
    
    if (typeof normalizedFields.jumpMP === 'string') {
      config.jumpMP = parseInt(normalizedFields.jumpMP, 10);
    } else if (typeof normalizedFields.jumpMP === 'number') {
      config.jumpMP = normalizedFields.jumpMP;
    } else {
      config.jumpMP = 0; // Default to no jump capability
    }
    
    return config;
  }
  
  /**
   * Convert engine configuration
   */
  private convertEngineConfiguration(
    jsonUnit: any,
    errors: string[],
    warnings: string[]
  ): Partial<UnitConfiguration> {
    const config: Partial<UnitConfiguration> = {};
    
    if (jsonUnit.engine) {
      // Engine rating
      if (typeof jsonUnit.engine.rating === 'number') {
        config.engineRating = jsonUnit.engine.rating;
      } else {
        errors.push('Missing or invalid engine rating');
      }
      
      // Engine type
      if (jsonUnit.engine.type) {
        const mappedEngineType = ENGINE_TYPE_MAPPING[jsonUnit.engine.type] || jsonUnit.engine.type;
        config.engineType = mappedEngineType as any; // Will need proper typing later
      } else {
        warnings.push('Missing engine type, defaulting to Fusion');
        config.engineType = 'Fusion' as any;
      }
      
      // Calculate movement if we have engine rating and tonnage
      if (config.engineRating && config.tonnage) {
        config.walkMP = Math.floor(config.engineRating / config.tonnage);
        config.runMP = Math.floor(config.walkMP * 1.5);
      }
    } else {
      errors.push('Missing engine configuration');
    }
    
    return config;
  }
  
  /**
   * Convert basic component configurations
   */
  private convertBasicComponents(
    jsonUnit: any,
    techBase: TechBase,
    errors: string[],
    warnings: string[]
  ): Partial<UnitConfiguration> {
    const config: Partial<UnitConfiguration> = {};
    
    // Structure
    if (jsonUnit.structure?.type) {
      config.structureType = this.createComponentConfiguration(
        jsonUnit.structure.type,
        techBase
      );
    } else {
      warnings.push('Missing structure type, defaulting to Standard');
      config.structureType = this.createComponentConfiguration('Standard', techBase);
    }
    
    // Armor (basic conversion)
    if (jsonUnit.armor?.type) {
      config.armorType = this.createComponentConfiguration(
        jsonUnit.armor.type,
        techBase
      );
    } else {
      warnings.push('Missing armor type, defaulting to Standard');
      config.armorType = this.createComponentConfiguration('Standard', techBase);
    }
    
    // Heat sinks (basic conversion)
    if (jsonUnit.heat_sinks?.type) {
      config.heatSinkType = this.createComponentConfiguration(
        jsonUnit.heat_sinks.type,
        techBase
      );
      
      if (typeof jsonUnit.heat_sinks.count === 'number') {
        config.totalHeatSinks = jsonUnit.heat_sinks.count;
      }
    } else {
      warnings.push('Missing heat sink configuration');
    }
    
    return config;
  }
  
  /**
   * Create a ComponentConfiguration object
   */
  private createComponentConfiguration(
    type: string,
    techBase: TechBase
  ): ComponentConfiguration {
    return {
      type,
      techBase
    };
  }
  
  /**
   * Validate the migration result
   */
  validateMigration(
    originalJson: any,
    migratedConfig: Partial<UnitConfiguration>
  ): MigrationValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingFields: string[] = [];
    const typeErrors: string[] = [];
    
    // Check required fields
    const requiredFields: (keyof UnitConfiguration)[] = [
      'chassis', 'model', 'tonnage', 'techBase', 'walkMP', 'engineRating'
    ];
    
    requiredFields.forEach(field => {
      if (!migratedConfig[field]) {
        missingFields.push(field);
      }
    });
    
    // Type validation
    if (migratedConfig.tonnage && typeof migratedConfig.tonnage !== 'number') {
      typeErrors.push('tonnage must be a number');
    }
    
    if (migratedConfig.walkMP && typeof migratedConfig.walkMP !== 'number') {
      typeErrors.push('walkMP must be a number');
    }
    
    // Validation summary
    errors.push(...missingFields.map(field => `Missing required field: ${field}`));
    errors.push(...typeErrors);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingFields,
      typeErrors
    };
  }
}

export default UnitJSONMigrationService;