// Fixed Export/Import functionality with proper type handling
import { EditableUnit } from '../types/editor';

// File extension mapping based on unit type
const FILE_EXTENSIONS: { [key: string]: string } = {
  'mech': 'mtf',
  'battlemech': 'mtf',
  'vehicle': 'blk',
  'battlearmor': 'blk',
  'aerospace': 'blk',
  'protomech': 'blk',
  'infantry': 'blk',
  'dropship': 'blk',
  'jumpship': 'blk',
  'warship': 'blk',
  'spacestation': 'blk',
  'smallcraft': 'blk',
  'default': 'blk'
};

// Get appropriate file extension based on unit type
export function getFileExtension(unitType?: string): string {
  if (!unitType) return FILE_EXTENSIONS.default;
  const type = unitType.toLowerCase().replace(/\s+/g, '');
  return FILE_EXTENSIONS[type] || FILE_EXTENSIONS.default;
}

// Export to JSON format
export function exportToJSON(unit: EditableUnit): string {
  // Create clean export object
  const exportData = {
    ...unit,
    exportVersion: '1.0',
    exportDate: new Date().toISOString(),
    application: 'BattleTech Editor'
  };
  
  return JSON.stringify(exportData, null, 2);
}

// Import from JSON format
export function importFromJSON(jsonString: string): EditableUnit {
  try {
    const data = JSON.parse(jsonString);
    
    // Ensure required fields are present
    const unit: EditableUnit = {
      id: data.id || '',
      name: data.name || 'Imported Unit',
      type: data.type || 'mech',
      mass: data.mass || 25,
      tech_base: data.tech_base || 'Inner Sphere',
      rules_level: data.rules_level || 'Standard',
      role: data.role || '',
      era: data.era || '3025',
      cost: data.cost || 0,
      bv: data.bv || 0,
      
      // Map data fields
      chassis: data.chassis || data.name || 'Unknown',
      model: data.model || 'Standard',
      mul_id: data.mul_id || '-1',
      
      // Engine and movement
      engineType: data.engineType || 'Fusion Engine',
      engineRating: data.engineRating || 100,
      walkMP: data.walkMP || 4,
      jumpMP: data.jumpMP || 0,
      
      // Structure and armor
      structureType: data.structureType || 'Standard',
      armorType: data.armorType || 'Standard',
      armor: data.armor || {},
      
      // Heat sinks
      heatSinkType: data.heatSinkType || 'Single',
      heatSinks: data.heatSinks || 10,
      
      // Equipment
      equipment: data.equipment || [],
      criticalSlots: data.criticalSlots || {},
      
      // Additional data
      data: data.data || {},
      fluffData: data.fluffData || {},
      
      // Handle quirks - ensure it's an object
      selectedQuirks: data.selectedQuirks || data.quirks || {},
      
      // Other optional fields
      configuration: data.configuration || {},
      image: data.image
    };
    
    return unit;
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error}`);
  }
}

// Export to MTF format (MegaMekLab)
export function exportToMTF(unit: EditableUnit): string {
  const lines: string[] = [];
  
  // Header
  lines.push(`chassis:${unit.chassis || 'Unknown'}`);
  lines.push(`model:${unit.model || 'Standard'}`);
  lines.push(`mul id:${unit.mul_id || '-1'}`);
  lines.push('');
  
  // Config
  lines.push(`Config:${unit.configuration?.type || 'Biped'}`);
  lines.push(`TechBase:${unit.tech_base || 'Inner Sphere'}`);
  lines.push(`Era:${unit.era || '3025'}`);
  lines.push(`Source:${unit.data?.source || 'Custom'}`);
  lines.push(`Rules Level:${unit.rules_level || 'Standard'}`);
  lines.push('');
  
  // Mass
  lines.push(`Mass:${unit.mass || 25}`);
  lines.push(`Engine:${unit.engineRating || 100} ${unit.engineType || 'Fusion Engine'}`);
  lines.push(`Structure:${unit.structureType || 'Standard'}`);
  lines.push(`Myomer:${unit.data?.myomer || 'Standard'}`);
  lines.push('');
  
  // Heat Sinks
  const engineHS = Math.floor((unit.engineRating || 100) / 25);
  lines.push(`Heat Sinks:${unit.heatSinks || 10} ${unit.heatSinkType || 'Single'}`);
  lines.push(`Walk MP:${unit.walkMP || 4}`);
  lines.push(`Jump MP:${unit.jumpMP || 0}`);
  lines.push('');
  
  // Armor
  lines.push(`Armor:${unit.armorType || 'Standard'}`);
  if (unit.armor) {
    const locations = ['head', 'center_torso', 'center_torso_rear', 
                      'left_torso', 'left_torso_rear', 'right_torso', 'right_torso_rear',
                      'left_arm', 'right_arm', 'left_leg', 'right_leg'];
    
    locations.forEach(loc => {
      const armorValue = unit.armor[loc] || 0;
      const locName = loc.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      lines.push(`${locName}:${armorValue}`);
    });
  }
  lines.push('');
  
  // Weapons & Equipment
  lines.push('Weapons & Equipment:');
  if (unit.equipment && unit.equipment.length > 0) {
    unit.equipment.forEach(item => {
      const location = item.location || 'Center Torso';
      const rear = item.rear ? ' (R)' : '';
      lines.push(`${item.name}, ${location}${rear}`);
    });
  }
  lines.push('');
  
  // Quirks
  if (unit.selectedQuirks && Object.keys(unit.selectedQuirks).length > 0) {
    lines.push('Quirks:');
    Object.entries(unit.selectedQuirks).forEach(([quirk, level]) => {
      if (level && level > 0) {
        lines.push(quirk);
      }
    });
    lines.push('');
  }
  
  // Manufacturer Data
  if (unit.fluffData?.manufacturers) {
    lines.push('Manufacturer:');
    if (unit.fluffData.manufacturers.chassis) {
      lines.push(`Chassis: ${unit.fluffData.manufacturers.chassis}`);
    }
    if (unit.fluffData.manufacturers.engine) {
      lines.push(`Engine: ${unit.fluffData.manufacturers.engine}`);
    }
    if (unit.fluffData.manufacturers.armor) {
      lines.push(`Armor: ${unit.fluffData.manufacturers.armor}`);
    }
    if (unit.fluffData.manufacturers.jumpJets) {
      lines.push(`Jump Jets: ${unit.fluffData.manufacturers.jumpJets}`);
    }
    if (unit.fluffData.manufacturers.communications) {
      lines.push(`Communications: ${unit.fluffData.manufacturers.communications}`);
    }
    if (unit.fluffData.manufacturers.targeting) {
      lines.push(`Targeting: ${unit.fluffData.manufacturers.targeting}`);
    }
  }
  
  return lines.join('\n');
}

// Export to BLK format (for non-mech units)
export function exportToBLK(unit: EditableUnit): string {
  // BLK format is more complex and varies by unit type
  // For now, we'll create a basic implementation
  const lines: string[] = [];
  
  lines.push(`#building block data file`);
  lines.push(`<BlockVersion>`);
  lines.push(`1`);
  lines.push(`</BlockVersion>`);
  lines.push(``);
  
  // Unit header
  lines.push(`<UnitType>`);
  lines.push(unit.type || 'Vehicle');
  lines.push(`</UnitType>`);
  lines.push(``);
  
  lines.push(`<Name>`);
  lines.push(unit.chassis || 'Unknown');
  lines.push(`</Name>`);
  lines.push(``);
  
  lines.push(`<Model>`);
  lines.push(unit.model || '');
  lines.push(`</Model>`);
  lines.push(``);
  
  lines.push(`<year>`);
  lines.push(unit.era || '3025');
  lines.push(`</year>`);
  lines.push(``);
  
  lines.push(`<type>`);
  lines.push(unit.tech_base || 'IS');
  lines.push(`</type>`);
  lines.push(``);
  
  // Add more BLK format fields as needed...
  
  return lines.join('\n');
}

// Import from MTF format
export function importFromMTF(mtfString: string): EditableUnit {
  const lines = mtfString.split('\n').map(line => line.trim());
  const unit: Partial<EditableUnit> = {
    equipment: [],
    armor: {},
    data: {},
    fluffData: {
      manufacturers: {}
    },
    selectedQuirks: {}
  };
  
  let currentSection = '';
  
  for (const line of lines) {
    if (!line) {
      currentSection = '';
      continue;
    }
    
    // Check for section headers
    if (line.endsWith(':') && !line.includes(':')) {
      currentSection = line.slice(0, -1).toLowerCase();
      continue;
    }
    
    // Parse key:value pairs
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).toLowerCase();
      const value = line.substring(colonIndex + 1);
      
      switch (key) {
        case 'chassis':
          unit.chassis = value;
          unit.name = value; // Use chassis as name if not specified
          break;
        case 'model':
          unit.model = value;
          break;
        case 'mul id':
          unit.mul_id = value;
          break;
        case 'config':
          unit.configuration = { type: value };
          break;
        case 'techbase':
          unit.tech_base = value;
          break;
        case 'era':
          unit.era = value;
          break;
        case 'rules level':
          unit.rules_level = value;
          break;
        case 'mass':
          unit.mass = parseInt(value) || 25;
          break;
        case 'engine':
          const engineParts = value.split(' ');
          unit.engineRating = parseInt(engineParts[0]) || 100;
          unit.engineType = engineParts.slice(1).join(' ');
          break;
        case 'structure':
          unit.structureType = value;
          break;
        case 'armor':
          unit.armorType = value;
          break;
        case 'heat sinks':
          const hsParts = value.split(' ');
          unit.heatSinks = parseInt(hsParts[0]) || 10;
          unit.heatSinkType = hsParts.slice(1).join(' ');
          break;
        case 'walk mp':
          unit.walkMP = parseInt(value) || 4;
          break;
        case 'jump mp':
          unit.jumpMP = parseInt(value) || 0;
          break;
        default:
          // Handle armor locations
          if (currentSection === '' && key.includes('torso') || key.includes('arm') || key.includes('leg') || key === 'head') {
            const location = key.replace(/ /g, '_').toLowerCase();
            unit.armor![location] = parseInt(value) || 0;
          }
      }
    }
    
    // Handle weapons & equipment section
    if (currentSection === 'weapons & equipment' && line.includes(',')) {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        const equipment = {
          id: Date.now().toString(),
          name: parts[0],
          location: parts[1].replace(' (R)', ''),
          rear: parts[1].includes('(R)')
        };
        unit.equipment!.push(equipment);
      }
    }
    
    // Handle quirks section
    if (currentSection === 'quirks' && line && !line.includes(':')) {
      unit.selectedQuirks![line] = 1;
    }
    
    // Handle manufacturer section
    if (currentSection === 'manufacturer' && line.includes(':')) {
      const [mfgType, mfgValue] = line.split(':').map(s => s.trim());
      if (unit.fluffData!.manufacturers) {
        const mfgKey = mfgType.toLowerCase().replace(/ /g, '');
        (unit.fluffData!.manufacturers as any)[mfgKey] = mfgValue;
      }
    }
  }
  
  // Set defaults and ensure required fields
  return {
    id: '',
    name: unit.chassis || 'Imported Unit',
    type: 'mech',
    mass: unit.mass || 25,
    tech_base: unit.tech_base || 'Inner Sphere',
    rules_level: unit.rules_level || 'Standard',
    role: '',
    era: unit.era || '3025',
    cost: 0,
    bv: 0,
    chassis: unit.chassis || 'Unknown',
    model: unit.model || 'Standard',
    mul_id: unit.mul_id || '-1',
    engineType: unit.engineType || 'Fusion Engine',
    engineRating: unit.engineRating || 100,
    walkMP: unit.walkMP || 4,
    jumpMP: unit.jumpMP || 0,
    structureType: unit.structureType || 'Standard',
    armorType: unit.armorType || 'Standard',
    armor: unit.armor || {},
    heatSinkType: unit.heatSinkType || 'Single',
    heatSinks: unit.heatSinks || 10,
    equipment: unit.equipment || [],
    criticalSlots: {},
    data: unit.data || {},
    fluffData: unit.fluffData || {},
    selectedQuirks: unit.selectedQuirks || {},
    configuration: unit.configuration || {}
  };
}

// Import from BLK format
export function importFromBLK(blkString: string): EditableUnit {
  // Basic BLK parser - would need expansion for full support
  const unit: Partial<EditableUnit> = {
    equipment: [],
    armor: {},
    data: {},
    fluffData: {},
    selectedQuirks: {}
  };
  
  // Simple tag parser
  const getTagContent = (tag: string): string => {
    const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i');
    const match = blkString.match(regex);
    return match ? match[1].trim() : '';
  };
  
  unit.type = getTagContent('UnitType').toLowerCase() || 'vehicle';
  unit.chassis = getTagContent('Name');
  unit.model = getTagContent('Model');
  unit.era = getTagContent('year');
  unit.tech_base = getTagContent('type');
  
  // Set defaults
  return {
    id: '',
    name: unit.chassis || 'Imported Unit',
    type: unit.type || 'vehicle',
    mass: 25,
    tech_base: unit.tech_base || 'Inner Sphere',
    rules_level: 'Standard',
    role: '',
    era: unit.era || '3025',
    cost: 0,
    bv: 0,
    chassis: unit.chassis || 'Unknown',
    model: unit.model || 'Standard',
    mul_id: '-1',
    engineType: 'Fusion Engine',
    engineRating: 100,
    walkMP: 4,
    jumpMP: 0,
    structureType: 'Standard',
    armorType: 'Standard',
    armor: unit.armor || {},
    heatSinkType: 'Single',
    heatSinks: 10,
    equipment: unit.equipment || [],
    criticalSlots: {},
    data: unit.data || {},
    fluffData: unit.fluffData || {},
    selectedQuirks: unit.selectedQuirks || {},
    configuration: {}
  };
}

// Main export function that determines format
export function exportUnit(unit: EditableUnit, format: 'json' | 'mtf' | 'blk'): string {
  switch (format) {
    case 'json':
      return exportToJSON(unit);
    case 'mtf':
      return exportToMTF(unit);
    case 'blk':
      return exportToBLK(unit);
    default:
      return exportToJSON(unit);
  }
}

// Main import function that auto-detects format
export function importUnit(content: string, filename?: string): EditableUnit {
  // Try to detect format from filename
  if (filename) {
    if (filename.endsWith('.json')) {
      return importFromJSON(content);
    } else if (filename.endsWith('.mtf')) {
      return importFromMTF(content);
    } else if (filename.endsWith('.blk')) {
      return importFromBLK(content);
    }
  }
  
  // Try to detect format from content
  if (content.trim().startsWith('{')) {
    return importFromJSON(content);
  } else if (content.includes('chassis:') && content.includes('model:')) {
    return importFromMTF(content);
  } else if (content.includes('<BlockVersion>')) {
    return importFromBLK(content);
  }
  
  // Default to JSON
  return importFromJSON(content);
}

// Download helper
export function downloadUnit(unit: EditableUnit, format: 'json' | 'mtf' | 'blk' | 'auto' = 'auto') {
  // Determine format and extension
  let actualFormat: 'json' | 'mtf' | 'blk';
  let extension: string;
  
  if (format === 'auto') {
    // Use MTF for mechs, BLK for everything else
    const unitType = unit.type?.toLowerCase() || 'mech';
    if (unitType === 'mech' || unitType === 'battlemech') {
      actualFormat = 'mtf';
      extension = 'mtf';
    } else {
      actualFormat = 'blk';
      extension = 'blk';
    }
  } else {
    actualFormat = format;
    extension = format;
  }
  
  const content = exportUnit(unit, actualFormat);
  const filename = `${unit.chassis}_${unit.model}.${extension}`.replace(/\s+/g, '_');
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// File upload helper
export async function readUploadedFile(file: File): Promise<EditableUnit> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const unit = importUnit(content, file.name);
        resolve(unit);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
