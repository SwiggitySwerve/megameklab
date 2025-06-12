import React, { useState, useRef } from 'react';
import { EditorComponentProps } from '../../../types/editor';
import { 
  calculateComponentWeights,
  calculateStructureWeight,
  calculateEngineWeight,
  calculateGyroWeight,
  calculateCockpitWeight
} from '../../../utils/componentCalculations';

const PreviewTab: React.FC<EditorComponentProps> = ({
  unit,
  onUnitChange,
  validationErrors = [],
  readOnly = false,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'standard' | 'compact' | 'tournament'>('standard');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'html' | 'mtf' | 'mul'>('pdf');
  const previewRef = useRef<HTMLDivElement>(null);

  // Calculate unit stats
  const componentWeights = calculateComponentWeights(unit);
  const totalWeight = componentWeights.total;
  const engineRating = (unit.data?.movement?.walk_mp || 1) * unit.mass;
  const engineWeight = calculateEngineWeight(engineRating, unit.data?.engine?.type || 'Fusion');
  const structureWeight = calculateStructureWeight(unit.mass, unit.data?.structure?.type || 'Standard');
  const gyroWeight = calculateGyroWeight(engineRating, unit.data?.gyro?.type || 'Standard');
  const cockpitWeight = calculateCockpitWeight(unit.data?.cockpit?.type || 'Standard Cockpit');
  
  const totalHeatSinks = unit.data?.heat_sinks?.count || 10;
  const heatSinkType = unit.data?.heat_sinks?.type || 'Single';
  const heatDissipation = totalHeatSinks * (heatSinkType === 'Double' ? 2 : 1);

  // Get weapons and equipment
  const weapons = (unit.data?.weapons_and_equipment || []).filter(item => item.item_type === 'weapon');
  const ammo = (unit.data?.weapons_and_equipment || []).filter(item => item.item_type === 'ammo');
  const equipment = (unit.data?.weapons_and_equipment || []).filter(item => item.item_type === 'equipment');

  // Handle export
  const handleExport = () => {
    switch (exportFormat) {
      case 'pdf':
        handlePDFExport();
        break;
      case 'html':
        handleHTMLExport();
        break;
      case 'mtf':
        handleMTFExport();
        break;
      case 'mul':
        handleMULExport();
        break;
    }
  };

  // Export as HTML
  const handleHTMLExport = () => {
    if (!previewRef.current) return;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${unit.chassis} ${unit.model} Record Sheet</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .record-sheet { max-width: 800px; margin: 0 auto; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0; }
    th, td { border: 1px solid #000; padding: 4px 8px; text-align: left; }
    th { background-color: #f0f0f0; font-weight: bold; }
    .section { margin: 20px 0; }
    .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  ${previewRef.current.innerHTML}
</body>
</html>`;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${unit.chassis}_${unit.model}_record_sheet.html`.replace(/\s+/g, '_');
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export as MTF
  const handleMTFExport = () => {
    const mtf = generateMTF(unit);
    const blob = new Blob([mtf], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${unit.chassis}_${unit.model}.mtf`.replace(/\s+/g, '_');
    link.click();
    URL.revokeObjectURL(url);
  };

  // Generate MTF format
  const generateMTF = (unit: any): string => {
    const lines: string[] = [];
    
    // Header
    lines.push(`chassis:${unit.chassis}`);
    lines.push(`model:${unit.model}`);
    lines.push(`mul id:${unit.mul_id || ''}`);
    lines.push('');
    lines.push(`Config:${unit.data?.config || 'Biped'}`);
    lines.push(`TechBase:${unit.tech_base}`);
    lines.push(`Era:${unit.era}`);
    lines.push(`Source:${unit.data?.source || ''}`);
    lines.push(`Rules Level:${unit.rules_level || '2'}`);
    lines.push('');
    lines.push(`role:${unit.role || ''}`);
    lines.push(`mass:${unit.mass}`);
    lines.push(`Engine:${unit.data?.engine?.rating || 0} ${unit.data?.engine?.type || 'Fusion'} Engine`);
    
    // Structure
    lines.push('');
    lines.push(`Structure:${unit.data?.structure?.type || 'Standard'}`);
    lines.push(`Myomer:${unit.data?.myomer?.type || 'Standard'}`);
    
    // Heat Sinks
    lines.push('');
    lines.push(`Heat Sinks:${totalHeatSinks} ${heatSinkType}`);
    lines.push(`Walk MP:${unit.data?.movement?.walk_mp || 0}`);
    lines.push(`Jump MP:${unit.data?.movement?.jump_mp || 0}`);
    
    // Armor
    lines.push('');
    lines.push(`Armor:${unit.data?.armor?.type || 'Standard'}(Inner Sphere)`);
    unit.data?.armor?.locations.forEach((location: any) => {
      if (location.rear_armor_points !== undefined) {
        lines.push(`${location.location} Armor:${location.armor_points}/${location.rear_armor_points}`);
      } else {
        lines.push(`${location.location} Armor:${location.armor_points}`);
      }
    });
    
    // Weapons
    lines.push('');
    lines.push('Weapons:' + weapons.length);
    weapons.forEach((weapon: any) => {
      lines.push(`${weapon.item_name}, ${weapon.location}`);
    });
    
    // Ammo
    if (ammo.length > 0) {
      lines.push('');
      ammo.forEach((item: any) => {
        lines.push(`${item.item_name}, ${item.location}`);
      });
    }
    
    // Equipment
    if (equipment.length > 0) {
      lines.push('');
      equipment.forEach((item: any) => {
        lines.push(`${item.item_name}, ${item.location}`);
      });
    }
    
    return lines.join('\n');
  };

  // Export as MUL (simplified)
  const handleMULExport = () => {
    const mul = {
      chassis: unit.chassis,
      model: unit.model,
      mul_id: unit.mul_id,
      mass: unit.mass,
      tech_base: unit.tech_base,
      era: unit.era,
      role: unit.role,
      config: unit.data,
    };
    
    const json = JSON.stringify(mul, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${unit.chassis}_${unit.model}.json`.replace(/\s+/g, '_');
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export as PDF (simplified - would need a library like jsPDF)
  const handlePDFExport = () => {
    window.print(); // Simple print solution for now
  };

  return (
    <div className="preview-tab bg-slate-900 text-slate-100 min-h-screen p-4">
      {/* Controls */}
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 mb-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Format Selection */}
            <div>
              <label className="text-sm font-medium text-slate-400 mr-2">Format:</label>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as any)}
                className="px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded"
              >
                <option value="standard">Standard Record Sheet</option>
                <option value="compact">Compact Format</option>
                <option value="tournament">Tournament Legal</option>
              </select>
            </div>
            
            {/* Export Format */}
            <div>
              <label className="text-sm font-medium text-slate-400 mr-2">Export As:</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded"
              >
                <option value="pdf">PDF (Print)</option>
                <option value="html">HTML</option>
                <option value="mtf">MTF File</option>
                <option value="mul">MUL JSON</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.print()}
              className="px-3 py-1 text-sm bg-slate-700 text-slate-100 rounded hover:bg-slate-600"
            >
              Print Preview
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Record Sheet Preview */}
      <div ref={previewRef} className="record-sheet bg-white text-black p-8 max-w-5xl mx-auto rounded-lg print:rounded-none print:shadow-none shadow-lg">
        {/* Header */}
        <div className="text-center mb-6 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold">{unit.chassis} {unit.model}</h1>
          <div className="text-sm mt-2 grid grid-cols-4 gap-4">
            <div>Mass: {unit.mass} tons</div>
            <div>Tech Base: {unit.tech_base}</div>
            <div>Era: {unit.era}</div>
            <div>Role: {unit.role}</div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div>
            {/* Movement */}
            <div className="section">
              <div className="section-title">Movement</div>
              <table>
                <tbody>
                  <tr>
                    <td className="font-medium">Walking MP:</td>
                    <td>{unit.data?.movement?.walk_mp || 0}</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Running MP:</td>
                    <td>{Math.floor((unit.data?.movement?.walk_mp || 0) * 1.5)}</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Jumping MP:</td>
                    <td>{unit.data?.movement?.jump_mp || 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Engine & Internals */}
            <div className="section">
              <div className="section-title">Internal Components</div>
              <table>
                <tbody>
                  <tr>
                    <td className="font-medium">Engine:</td>
                    <td>{unit.data?.engine?.rating} {unit.data?.engine?.type}</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Gyro:</td>
                    <td>{unit.data?.gyro?.type || 'Standard'}</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Cockpit:</td>
                    <td>{unit.data?.cockpit?.type || 'Standard'}</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Structure:</td>
                    <td>{unit.data?.structure?.type || 'Standard'}</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Armor:</td>
                    <td>{unit.data?.armor?.type || 'Standard'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Heat Management */}
            <div className="section">
              <div className="section-title">Heat Management</div>
              <table>
                <tbody>
                  <tr>
                    <td className="font-medium">Heat Sinks:</td>
                    <td>{totalHeatSinks} {heatSinkType}</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Heat Dissipation:</td>
                    <td>{heatDissipation}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Armor Values */}
            <div className="section">
              <div className="section-title">Armor Values</div>
              <table>
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Front</th>
                    <th>Rear</th>
                    <th>Internal</th>
                  </tr>
                </thead>
                <tbody>
                  {unit.data?.armor?.locations.map((loc: any) => (
                    <tr key={loc.location}>
                      <td className="font-medium">{loc.location}</td>
                      <td>{loc.armor_points}</td>
                      <td>{loc.rear_armor_points || '-'}</td>
                      <td>{getInternalStructure(loc.location, unit.mass)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Weight Summary */}
            <div className="section">
              <div className="section-title">Weight Summary</div>
              <table>
                <tbody>
                  <tr>
                    <td className="font-medium">Structure:</td>
                    <td>{structureWeight.toFixed(1)} tons</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Engine:</td>
                    <td>{engineWeight.toFixed(1)} tons</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Gyro:</td>
                    <td>{gyroWeight.toFixed(1)} tons</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Cockpit:</td>
                    <td>{cockpitWeight.toFixed(1)} tons</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Armor:</td>
                    <td>{((unit.data?.armor?.total_armor_points || 0) / 16).toFixed(1)} tons</td>
                  </tr>
                  <tr className="font-bold border-t">
                    <td>Total:</td>
                    <td>{totalWeight.toFixed(1)} tons</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Weapons & Equipment */}
        <div className="section mt-6">
          <div className="section-title">Weapons & Equipment</div>
          <table>
            <thead>
              <tr>
                <th>Qty</th>
                <th>Weapon/Equipment</th>
                <th>Location</th>
                <th>Heat</th>
                <th>Damage</th>
                <th>Range</th>
              </tr>
            </thead>
            <tbody>
              {weapons.map((weapon: any, index: number) => (
                <tr key={index}>
                  <td>1</td>
                  <td>{weapon.item_name}</td>
                  <td>{weapon.location}</td>
                  <td>{weapon.heat || '-'}</td>
                  <td>{weapon.damage || '-'}</td>
                  <td>{weapon.range || '-'}</td>
                </tr>
              ))}
              {ammo.map((item: any, index: number) => (
                <tr key={`ammo-${index}`}>
                  <td>1</td>
                  <td>{item.item_name}</td>
                  <td>{item.location}</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
              ))}
              {equipment.map((item: any, index: number) => (
                <tr key={`eq-${index}`}>
                  <td>1</td>
                  <td>{item.item_name}</td>
                  <td>{item.location}</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quirks */}
        {unit.data?.quirks && (unit.data.quirks.positive?.length || unit.data.quirks.negative?.length) ? (
          <div className="section mt-6">
            <div className="section-title">Quirks</div>
            <div className="grid grid-cols-2 gap-4">
              {unit.data.quirks.positive && unit.data.quirks.positive.length > 0 && (
                <div>
                  <div className="font-medium mb-1">Positive:</div>
                  <ul className="text-sm">
                    {unit.data.quirks.positive.map((quirk: string, index: number) => (
                      <li key={index}>• {quirk}</li>
                    ))}
                  </ul>
                </div>
              )}
              {unit.data.quirks.negative && unit.data.quirks.negative.length > 0 && (
                <div>
                  <div className="font-medium mb-1">Negative:</div>
                  <ul className="text-sm">
                    {unit.data.quirks.negative.map((quirk: string, index: number) => (
                      <li key={index}>• {quirk}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .preview-tab {
            background: white;
            color: black;
          }
          .bg-slate-800 {
            display: none;
          }
          .record-sheet {
            box-shadow: none;
            border: none;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
};

// Helper function to get internal structure points
function getInternalStructure(location: string, tonnage: number): number {
  const isPoints: { [key: string]: { [key: number]: number } } = {
    'Head': { 20: 3, 25: 3, 30: 3, 35: 3, 40: 3, 45: 3, 50: 3, 55: 3, 60: 3, 65: 3, 70: 3, 75: 3, 80: 3, 85: 3, 90: 3, 95: 3, 100: 3 },
    'Center Torso': { 20: 6, 25: 8, 30: 10, 35: 11, 40: 12, 45: 14, 50: 16, 55: 18, 60: 20, 65: 21, 70: 22, 75: 23, 80: 25, 85: 27, 90: 29, 95: 30, 100: 31 },
    'Left Torso': { 20: 5, 25: 6, 30: 7, 35: 8, 40: 10, 45: 11, 50: 12, 55: 13, 60: 14, 65: 15, 70: 15, 75: 16, 80: 17, 85: 18, 90: 19, 95: 20, 100: 21 },
    'Right Torso': { 20: 5, 25: 6, 30: 7, 35: 8, 40: 10, 45: 11, 50: 12, 55: 13, 60: 14, 65: 15, 70: 15, 75: 16, 80: 17, 85: 18, 90: 19, 95: 20, 100: 21 },
    'Left Arm': { 20: 3, 25: 4, 30: 5, 35: 6, 40: 6, 45: 7, 50: 8, 55: 9, 60: 10, 65: 10, 70: 11, 75: 12, 80: 13, 85: 14, 90: 15, 95: 16, 100: 17 },
    'Right Arm': { 20: 3, 25: 4, 30: 5, 35: 6, 40: 6, 45: 7, 50: 8, 55: 9, 60: 10, 65: 10, 70: 11, 75: 12, 80: 13, 85: 14, 90: 15, 95: 16, 100: 17 },
    'Left Leg': { 20: 4, 25: 6, 30: 7, 35: 8, 40: 10, 45: 11, 50: 12, 55: 13, 60: 14, 65: 15, 70: 15, 75: 16, 80: 17, 85: 18, 90: 19, 95: 20, 100: 21 },
    'Right Leg': { 20: 4, 25: 6, 30: 7, 35: 8, 40: 10, 45: 11, 50: 12, 55: 13, 60: 14, 65: 15, 70: 15, 75: 16, 80: 17, 85: 18, 90: 19, 95: 20, 100: 21 },
  };

  return isPoints[location]?.[tonnage] || 0;
}

export default PreviewTab;
