// Simplified Unit Export/Import Utility
// Handles conversion between JSON format and MegaMekLab .mtf format

import { EditableUnit } from '../types/editor';
import { getArmorType } from './armorTypes';

/**
 * Export unit to JSON format
 */
export function exportToJSON(unit: EditableUnit): string {
  // Clean up the unit data for export
  const exportData = {
    ...unit,
    exportVersion: '1.0',
    exportDate: new Date().toISOString(),
    application: 'BattleTech Editor'
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Export unit to MegaMekLab .mtf format
 */
export function exportToMTF(unit: EditableUnit): string {
  const lines: string[] = [];
  
  // Header
  lines.push(`chassis:${unit.chassis || 'Unknown'}`);
  lines.push(`model:${unit.model || ''}`);
  lines.push(`mul id:${unit.mul_id || -1}`);
  lines.push('');
  
  // Configuration
  lines.push(`Config:${unit.data?.config || 'Biped'}`);
  lines.push(`TechBase:${unit.tech_base || 'Inner Sphere'}`);
  lines.push(`Era:${unit.era || '3145'}`);
  lines.push(`Source:${unit.data?.source_era || 'TRO: 3145'}`);
  lines.push(`Rules Level:${mapRulesLevel(unit.rules_level || 'Standard')}`);
  lines.push('');
  
  // Physical
  lines.push(`Mass:${unit.mass}`);
  lines.push(`Engine:${calculateEngineString(unit)}`);
  lines.push(`Structure:${mapStructureType(unit.data?.structure?.type || 'standard')}`);
  lines.push(`Myomer:${mapMyomerType(unit.data?.myomer?.type || 'standard')}`);
  lines.push('');
  
  // Heat & Movement
  lines.push(`Heat Sinks:${unit.data?.heat_sinks?.count || 10} ${mapHeatSinkType(unit.data?.heat_sinks?.type || 'single')}`);
  lines.push(`Walk MP:${unit.data?.movement?.walk_mp || 1}`);
  lines.push(`Jump MP:${unit.data?.movement?.jump_mp || 0}`);
  lines.push('');
  
  // Armor
  const armorType = unit.armorAllocation?.['Center Torso']?.type || { id: 'standard', name: 'Standard' };
  lines.push(`Armor:${mapArmorType(armorType.id)}`);
  
  // Armor values by location
  Object.entries(unit.armorAllocation || {}).forEach(([location, allocation]) => {
    const mtfLocation = mapLocationToMTF(location);
    if (allocation.rear !== undefined && allocation.rear > 0) {
      lines.push(`${mtfLocation} Armor:${allocation.front}/${allocation.rear}`);
    } else {
      lines.push(`${mtfLocation} Armor:${allocation.front}`);
    }
  });
  lines.push('');
  
  // Weapons & Equipment
  lines.push('Weapons:' + (unit.equipmentPlacements?.length || 0));
  unit.equipmentPlacements?.forEach(placement => {
    const location = mapLocationToMTF(placement.location);
    const weaponName = placement.equipment.name;
    
    if (placement.equipment.type === 'ammunition') {
      lines.push(`${placement.equipment.data?.shots || 1} ${weaponName}, ${location}`);
    } else {
      lines.push(`1 ${weaponName}, ${location}`);
    }
  });
  lines.push('');
  
  // Quirks - Handle UnitQuirks object structure
  if (unit.data?.quirks && Object.keys(unit.data.quirks).length > 0) {
    lines.push('Quirks:');
    Object.entries(unit.data.quirks).forEach(([key, quirk]) => {
      if (quirk.active) {
        lines.push(quirk.displayName || key);
      }
    });
    lines.push('');
  }
  
  // Manufacturer info from manufacturers object
  if (unit.data?.manufacturers) {
    const mfrs = unit.data.manufacturers;
    if (mfrs.chassis) {
      lines.push(`Manufacturer:${mfrs.chassis}`);
    }
    if (mfrs.primaryFactory) {
      lines.push(`Primary Factory:${mfrs.primaryFactory}`);
    }
    
    // System manufacturers
    const systems: string[] = [];
    if (mfrs.communications) systems.push(`COMM:${mfrs.communications}`);
    if (mfrs.targeting) systems.push(`T&T:${mfrs.targeting}`);
    if (mfrs.armor) systems.push(`ARMOR:${mfrs.armor}`);
    if (mfrs.engine) systems.push(`ENGINE:${mfrs.engine}`);
    if (mfrs.structure) systems.push(`STRUCTURE:${mfrs.structure}`);
    if (mfrs.jumpJets) systems.push(`JUMPJET:${mfrs.jumpJets}`);
    if (mfrs.gyro) systems.push(`GYRO:${mfrs.gyro}`);
    if (mfrs.cockpit) systems.push(`COCKPIT:${mfrs.cockpit}`);
    
    if (systems.length > 0) {
      lines.push('System Manufacturer:');
      systems.forEach(sys => lines.push(sys));
    }
  }
  
  return lines.join('\n');
}

/**
 * Import unit from JSON format
 */
export function importFromJSON(jsonString: string): EditableUnit {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate the data structure
    if (!data.mass || !data.chassis) {
      throw new Error('Invalid unit data: missing required fields');
    }
    
    // Convert to EditableUnit format if needed
    return data as EditableUnit;
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error}`);
  }
}

/**
 * Import unit from MegaMekLab .mtf format
 */
export function importFromMTF(mtfContent: string): EditableUnit {
  const lines = mtfContent.split('\n').map(line => line.trim());
  const unit: Partial<EditableUnit> = {
    data: {
      chassis: '',
      model: '',
      movement: {},
      heat_sinks: {},
      structure: {},
      engine: {},
      gyro: {},
      cockpit: {},
      myomer: {},
      manufacturers: {
        chassis: '',
        primaryFactory: '',
        communications: '',
        targeting: '',
        armor: '',
        engine: '',
        structure: '',
        jumpJets: '',
        gyro: '',
        cockpit: '',
      },
      quirks: {},
    },
    armorAllocation: {},
    equipmentPlacements: [],
  };
  
  let currentSection = '';
  
  for (const line of lines) {
    if (!line) continue;
    
    // Parse key:value pairs
    if (line.includes(':') && !line.startsWith(' ')) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      
      switch (key.toLowerCase()) {
        case 'chassis':
          unit.chassis = value;
          unit.data!.chassis = value;
          break;
        case 'model':
          unit.model = value;
          unit.data!.model = value;
          break;
        case 'mul id':
          unit.mul_id = value;
          break;
        case 'config':
          // Map string to UnitConfig
          unit.data!.config = value as any; // Will need proper mapping
          break;
        case 'techbase':
          unit.tech_base = value;
          break;
        case 'era':
          unit.era = value;
          break;
        case 'source':
          unit.data!.source_era = value;
          break;
        case 'rules level':
          unit.rules_level = parseRulesLevel(parseInt(value));
          break;
        case 'mass':
          unit.mass = parseInt(value);
          break;
        case 'engine':
          parseEngine(value, unit);
          break;
        case 'structure':
          unit.data!.structure!.type = parseStructureType(value);
          break;
        case 'myomer':
          unit.data!.myomer!.type = parseMyomerType(value);
          break;
        case 'heat sinks':
          parseHeatSinks(value, unit);
          break;
        case 'walk mp':
          unit.data!.movement!.walk_mp = parseInt(value);
          break;
        case 'jump mp':
          unit.data!.movement!.jump_mp = parseInt(value);
          break;
        case 'armor':
          // Parse armor type
          const armorTypeId = parseArmorType(value);
          const armorType = getArmorType(armorTypeId);
          // Set default armor type for all locations
          initializeArmorAllocation(unit, armorType);
          currentSection = 'armor';
          break;
        case 'weapons':
          currentSection = 'weapons';
          break;
        case 'quirks':
          currentSection = 'quirks';
          break;
        case 'manufacturer':
          unit.data!.manufacturers!.chassis = value;
          break;
        case 'primary factory':
          unit.data!.manufacturers!.primaryFactory = value;
          break;
        case 'system manufacturer':
          currentSection = 'system_manufacturer';
          break;
        default:
          // Check for armor values
          if (key.endsWith(' Armor')) {
            const location = parseMTFLocation(key.replace(' Armor', ''));
            const [front, rear] = value.split('/').map(v => parseInt(v));
            
            if (!unit.armorAllocation![location]) {
              unit.armorAllocation![location] = {
                front: 0,
                rear: 0,
                maxArmor: 0,
                type: getArmorType('standard'),
              };
            }
            
            unit.armorAllocation![location].front = front;
            if (rear !== undefined) {
              unit.armorAllocation![location].rear = rear;
            }
          }
      }
    } else {
      // Handle multi-line sections
      if (currentSection === 'quirks' && unit.data!.quirks) {
        // Add quirk as active
        const quirkKey = line.toLowerCase().replace(/\s+/g, '_');
        unit.data!.quirks[quirkKey] = {
          active: true,
          displayName: line,
          description: '',
        };
      } else if (currentSection === 'system_manufacturer' && line.includes(':')) {
        // Parse system manufacturer entries
        const [system, manufacturer] = line.split(':').map(s => s.trim());
        const sysMap: { [key: string]: keyof typeof unit.data.manufacturers } = {
          'COMM': 'communications',
          'T&T': 'targeting',
          'ARMOR': 'armor',
          'ENGINE': 'engine',
          'STRUCTURE': 'structure',
          'JUMPJET': 'jumpJets',
          'GYRO': 'gyro',
          'COCKPIT': 'cockpit',
        };
        
        const field = sysMap[system];
        if (field && unit.data!.manufacturers) {
          (unit.data!.manufacturers as any)[field] = manufacturer;
        }
      } else if (currentSection === 'weapons' && line.includes(',')) {
        // Parse weapon entries
        const match = line.match(/^(\d+)\s+(.+),\s+(.+)$/);
        if (match) {
          const [, quantity, name, location] = match;
          const placement: any = {
            id: `${generateEquipmentId(name)}_${Date.now()}`,
            equipment: {
              id: generateEquipmentId(name),
              name: name,
              type: determineEquipmentType(name),
              data: {},
            },
            location: parseMTFLocation(location),
            criticalSlots: [],
          };
          
          // Add multiple if quantity > 1
          for (let i = 0; i < parseInt(quantity); i++) {
            unit.equipmentPlacements!.push({ 
              ...placement, 
              id: `${placement.id}_${i}` 
            });
          }
        }
      }
    }
  }
  
  // Calculate max armor for each location based on tonnage
  if (unit.mass) {
    calculateMaxArmor(unit as EditableUnit);
  }
  
  return unit as EditableUnit;
}

// Helper functions

function calculateEngineString(unit: EditableUnit): string {
  const walkMP = unit.data?.movement?.walk_mp || 1;
  const engineRating = walkMP * unit.mass;
  const engineType = unit.data?.engine?.type || 'fusion';
  
  const engineTypeMap: { [key: string]: string } = {
    'fusion': 'Fusion Engine',
    'xl': 'XL Engine',
    'xl_clan': 'XL Engine',
    'light': 'Light Fusion Engine',
    'compact': 'Compact Fusion Engine',
    'ice': 'ICE',
    'fuel_cell': 'Fuel Cell',
  };
  
  return `${engineRating} ${engineTypeMap[engineType] || 'Fusion Engine'}`;
}

function mapStructureType(type: string): string {
  const structureMap: { [key: string]: string } = {
    'standard': 'Standard',
    'endo_steel': 'Endo Steel',
    'endo_steel_clan': 'Endo Steel',
    'composite': 'Composite',
    'reinforced': 'Reinforced',
    'industrial': 'Industrial',
  };
  
  return structureMap[type] || 'Standard';
}

function mapMyomerType(type: string): string {
  const myomerMap: { [key: string]: string } = {
    'standard': 'Standard',
    'tsm': 'Triple-Strength',
    'industrial_tsm': 'Industrial Triple-Strength',
    'masc': 'MASC',
  };
  
  return myomerMap[type] || 'Standard';
}

function mapHeatSinkType(type: string): string {
  const hsMap: { [key: string]: string } = {
    'single': 'Single',
    'double': 'Double',
    'double_clan': 'Double',
    'compact': 'Compact',
  };
  
  return hsMap[type] || 'Single';
}

function mapArmorType(typeId: string): string {
  const armorMap: { [key: string]: string } = {
    'standard': 'Standard',
    'ferro_fibrous': 'Ferro-Fibrous',
    'ferro_fibrous_clan': 'Ferro-Fibrous',
    'light_ferro_fibrous': 'Light Ferro-Fibrous',
    'heavy_ferro_fibrous': 'Heavy Ferro-Fibrous',
    'stealth': 'Stealth',
    'reactive': 'Reactive',
    'reflective': 'Reflective',
    'hardened': 'Hardened',
    'ferro_lamellor': 'Ferro-Lamellor',
    'primitive': 'Primitive',
    'commercial': 'Commercial',
    'industrial': 'Industrial',
    'heavy_industrial': 'Heavy Industrial',
  };
  
  return armorMap[typeId] || 'Standard';
}

function mapLocationToMTF(location: string): string {
  const locationMap: { [key: string]: string } = {
    'Head': 'HD',
    'Center Torso': 'CT',
    'Left Torso': 'LT',
    'Right Torso': 'RT',
    'Left Arm': 'LA',
    'Right Arm': 'RA',
    'Left Leg': 'LL',
    'Right Leg': 'RL',
  };
  
  return locationMap[location] || location;
}

function parseMTFLocation(mtfLocation: string): string {
  const locationMap: { [key: string]: string } = {
    'HD': 'Head',
    'CT': 'Center Torso',
    'LT': 'Left Torso',
    'RT': 'Right Torso',
    'LA': 'Left Arm',
    'RA': 'Right Arm',
    'LL': 'Left Leg',
    'RL': 'Right Leg',
  };
  
  return locationMap[mtfLocation] || mtfLocation;
}

function mapRulesLevel(level: string): number {
  const levelMap: { [key: string]: number } = {
    'Introductory': 1,
    'Standard': 2,
    'Advanced': 3,
    'Experimental': 4,
  };
  
  return levelMap[level] || 2;
}

function parseRulesLevel(level: number): string {
  const levelMap: { [key: number]: string } = {
    1: 'Introductory',
    2: 'Standard',
    3: 'Advanced',
    4: 'Experimental',
  };
  
  return levelMap[level] || 'Standard';
}

function parseEngine(engineString: string, unit: Partial<EditableUnit>): void {
  const match = engineString.match(/^(\d+)\s+(.+)$/);
  if (match) {
    const [, rating, type] = match;
    
    // Calculate walk MP from engine rating
    if (unit.mass) {
      unit.data!.movement!.walk_mp = Math.floor(parseInt(rating) / unit.mass);
    }
    
    // Parse engine type
    const engineTypeMap: { [key: string]: string } = {
      'Fusion Engine': 'fusion',
      'XL Engine': 'xl',
      'Light Fusion Engine': 'light',
      'Compact Fusion Engine': 'compact',
      'ICE': 'ice',
      'Fuel Cell': 'fuel_cell',
    };
    
    unit.data!.engine!.type = engineTypeMap[type] || 'fusion';
  }
}

function parseStructureType(type: string): string {
  const structureMap: { [key: string]: string } = {
    'Standard': 'standard',
    'Endo Steel': 'endo_steel',
    'Composite': 'composite',
    'Reinforced': 'reinforced',
    'Industrial': 'industrial',
  };
  
  return structureMap[type] || 'standard';
}

function parseMyomerType(type: string): string {
  const myomerMap: { [key: string]: string } = {
    'Standard': 'standard',
    'Triple-Strength': 'tsm',
    'Industrial Triple-Strength': 'industrial_tsm',
    'MASC': 'masc',
  };
  
  return myomerMap[type] || 'standard';
}

function parseHeatSinks(hsString: string, unit: Partial<EditableUnit>): void {
  const match = hsString.match(/^(\d+)\s+(.+)$/);
  if (match) {
    const [, count, type] = match;
    unit.data!.heat_sinks!.count = parseInt(count);
    
    const hsTypeMap: { [key: string]: string } = {
      'Single': 'single',
      'Double': 'double',
      'Compact': 'compact',
    };
    
    unit.data!.heat_sinks!.type = hsTypeMap[type] || 'single';
  }
}

function parseArmorType(type: string): string {
  const armorMap: { [key: string]: string } = {
    'Standard': 'standard',
    'Ferro-Fibrous': 'ferro_fibrous',
    'Light Ferro-Fibrous': 'light_ferro_fibrous',
    'Heavy Ferro-Fibrous': 'heavy_ferro_fibrous',
    'Stealth': 'stealth',
    'Reactive': 'reactive',
    'Reflective': 'reflective',
    'Hardened': 'hardened',
    'Ferro-Lamellor': 'ferro_lamellor',
    'Primitive': 'primitive',
    'Commercial': 'commercial',
    'Industrial': 'industrial',
    'Heavy Industrial': 'heavy_industrial',
  };
  
  return armorMap[type] || 'standard';
}

function initializeArmorAllocation(unit: Partial<EditableUnit>, armorType: any): void {
  const locations = ['Head', 'Center Torso', 'Left Torso', 'Right Torso', 
                     'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg'];
  
  unit.armorAllocation = {};
  locations.forEach(location => {
    unit.armorAllocation![location] = {
      front: 0,
      rear: 0,
      maxArmor: 0,
      type: armorType,
    };
  });
}

function calculateMaxArmor(unit: EditableUnit): void {
  const maxArmorPoints = unit.mass * 2 + 3;
  
  const locationMultipliers: { [key: string]: number } = {
    'Head': 0.09,
    'Center Torso': 0.18,
    'Left Torso': 0.135,
    'Right Torso': 0.135,
    'Left Arm': 0.09,
    'Right Arm': 0.09,
    'Left Leg': 0.135,
    'Right Leg': 0.135,
  };
  
  Object.entries(unit.armorAllocation).forEach(([location, allocation]) => {
    allocation.maxArmor = Math.floor(maxArmorPoints * (locationMultipliers[location] || 0.1));
  });
}

function generateEquipmentId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function determineEquipmentType(name: string): string {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('ammo') || lowerName.includes('ammunition')) {
    return 'ammunition';
  } else if (lowerName.includes('heat sink')) {
    return 'heat_sink';
  } else if (lowerName.includes('jump jet')) {
    return 'jump_jet';
  } else {
    return 'weapon';
  }
}

// File handling utilities

/**
 * Download unit as file
 */
export function downloadUnit(unit: EditableUnit, format: 'json' | 'mtf'): void {
  let content: string;
  let filename: string;
  let mimeType: string;
  
  if (format === 'json') {
    content = exportToJSON(unit);
    filename = `${unit.chassis}_${unit.model}.json`.replace(/\s+/g, '_');
    mimeType = 'application/json';
  } else {
    content = exportToMTF(unit);
    filename = `${unit.chassis}_${unit.model}.mtf`.replace(/\s+/g, '_');
    mimeType = 'text/plain';
  }
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Read uploaded file
 */
export async function readUploadedFile(file: File): Promise<EditableUnit> {
  const content = await file.text();
  
  if (file.name.endsWith('.json')) {
    return importFromJSON(content);
  } else if (file.name.endsWith('.mtf')) {
    return importFromMTF(content);
  } else {
    throw new Error('Unsupported file format. Please use .json or .mtf files.');
  }
}
