import React, { useState, useCallback, useEffect } from 'react';
import { EditorComponentProps } from '../../../types/editor';
import { debounce } from '../../../utils/performance';

interface FluffData {
  overview?: string;
  capabilities?: string;
  battleHistory?: string;
  deployment?: string;
  variants?: string;
  notablePilots?: string;
  notes?: string;
  [key: string]: string | undefined;
}

const FluffTab: React.FC<EditorComponentProps> = ({
  unit,
  onUnitChange,
  validationErrors = [],
  readOnly = false,
}) => {
  // Get fluff data from unit
  const fluffData: FluffData = unit.data?.fluff_text || {};

  // Local state for text areas (for debouncing)
  const [localFluff, setLocalFluff] = useState<FluffData>(fluffData);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [wordCounts, setWordCounts] = useState<{ [key: string]: number }>({});

  // Calculate word counts
  useEffect(() => {
    const counts: { [key: string]: number } = {};
    Object.entries(localFluff).forEach(([key, value]) => {
      counts[key] = value ? value.split(/\s+/).filter((word: string) => word.length > 0).length : 0;
    });
    setWordCounts(counts);
  }, [localFluff]);

  // Debounced update function
  const debouncedUpdate = useCallback(
    debounce((newFluff: FluffData) => {
      const updatedUnit = {
        ...unit,
        data: {
          ...unit.data,
          fluff_text: newFluff
        }
      };
      onUnitChange(updatedUnit);
    }, 500),
    [unit, onUnitChange]
  );

  // Handle text change
  const handleTextChange = (section: string, value: string) => {
    const newFluff = {
      ...localFluff,
      [section]: value
    };
    setLocalFluff(newFluff);
    debouncedUpdate(newFluff);
  };

  // Export fluff to text file
  const handleExport = () => {
    const content = Object.entries(localFluff)
      .filter(([_, value]) => value)
      .map(([section, value]) => {
        const title = section.charAt(0).toUpperCase() + section.slice(1).replace(/([A-Z])/g, ' $1');
        return `=== ${title} ===\n\n${value}\n`;
      })
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${unit.chassis}_${unit.model}_fluff.txt`.replace(/\s+/g, '_');
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import fluff from file
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      
      // Parse the imported text
      const sections = text.split(/=== (.+?) ===/).filter(s => s.trim());
      const newFluff: FluffData = {};
      
      for (let i = 0; i < sections.length; i += 2) {
        const title = sections[i].trim().toLowerCase().replace(/\s+/g, '');
        const content = sections[i + 1]?.trim() || '';
        
        // Map titles to fluff sections
        if (title.includes('overview')) newFluff.overview = content;
        else if (title.includes('capabilit')) newFluff.capabilities = content;
        else if (title.includes('history')) newFluff.battleHistory = content;
        else if (title.includes('deploy')) newFluff.deployment = content;
        else if (title.includes('variant')) newFluff.variants = content;
        else if (title.includes('pilot')) newFluff.notablePilots = content;
        else if (title.includes('note')) newFluff.notes = content;
      }
      
      setLocalFluff(newFluff);
      debouncedUpdate(newFluff);
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  // Clear all fluff
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all fluff text?')) {
      const emptyFluff: FluffData = {};
      setLocalFluff(emptyFluff);
      debouncedUpdate(emptyFluff);
    }
  };

  const sections = [
    { id: 'overview', title: 'Overview', placeholder: 'General description and introduction of the unit...' },
    { id: 'capabilities', title: 'Capabilities', placeholder: 'Combat capabilities, strengths, and weaknesses...' },
    { id: 'battleHistory', title: 'Battle History', placeholder: 'Notable battles and combat history...' },
    { id: 'deployment', title: 'Deployment', placeholder: 'Where and how the unit is typically deployed...' },
    { id: 'variants', title: 'Variants', placeholder: 'Different configurations and variations...' },
    { id: 'notablePilots', title: 'Notable Pilots', placeholder: 'Famous pilots who have used this unit...' },
    { id: 'notes', title: 'Notes', placeholder: 'Additional notes and information...' },
  ];

  return (
    <div className="fluff-tab bg-slate-900 text-slate-100 min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with controls */}
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Unit Fluff Text</h2>
            <div className="flex items-center space-x-3">
              {/* Import */}
              <label className="px-3 py-1 text-sm bg-slate-700 text-slate-100 rounded hover:bg-slate-600 cursor-pointer">
                Import
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleImport}
                  className="hidden"
                  disabled={readOnly}
                />
              </label>
              
              {/* Export */}
              <button
                onClick={handleExport}
                disabled={readOnly || Object.values(localFluff).every(v => !v)}
                className="px-3 py-1 text-sm bg-slate-700 text-slate-100 rounded hover:bg-slate-600 disabled:opacity-50"
              >
                Export
              </button>
              
              {/* Clear All */}
              <button
                onClick={handleClearAll}
                disabled={readOnly || Object.values(localFluff).every(v => !v)}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Clear All
              </button>
            </div>
          </div>
          
          {/* Section tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {section.title}
                {wordCounts[section.id] > 0 && (
                  <span className="ml-2 text-xs opacity-75">
                    ({wordCounts[section.id]})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Active section editor */}
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-4">
          {sections.map(section => (
            <div
              key={section.id}
              className={activeSection === section.id ? 'block' : 'hidden'}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-md font-medium">{section.title}</h3>
                <div className="text-sm text-slate-400">
                  {wordCounts[section.id] || 0} words
                </div>
              </div>
              
              <textarea
                value={localFluff[section.id as keyof FluffData] || ''}
                onChange={(e) => handleTextChange(section.id, e.target.value)}
                placeholder={section.placeholder}
                disabled={readOnly}
                className="w-full h-96 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg 
                         text-slate-100 placeholder-slate-500 resize-none 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                spellCheck={true}
              />
              
              {/* Character limit warning */}
              {(localFluff[section.id as keyof FluffData]?.length || 0) > 5000 && (
                <div className="mt-2 text-sm text-yellow-500">
                  Warning: This section is quite long ({localFluff[section.id as keyof FluffData]?.length} characters). 
                  Consider breaking it into multiple sections.
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="mt-4 bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-3">
          <div className="text-xs text-blue-300">
            <div className="font-medium mb-1">Writing Tips:</div>
            <ul className="space-y-1 list-disc list-inside">
              <li>Use the Overview section for a general introduction to the unit</li>
              <li>Capabilities should focus on combat performance and tactical uses</li>
              <li>Battle History can include specific engagements and outcomes</li>
              <li>Variants section is ideal for describing different configurations</li>
              <li>Text is automatically saved as you type</li>
              <li>Import/Export supports plain text format for easy sharing</li>
            </ul>
          </div>
        </div>

        {/* Preview panel */}
        <div className="mt-4 bg-slate-800 border border-slate-600 rounded-lg p-4">
          <h3 className="text-md font-medium mb-3">Preview</h3>
          <div className="prose prose-invert max-w-none">
            {Object.entries(localFluff).filter(([_, value]) => value).length === 0 ? (
              <p className="text-slate-500 italic">No fluff text entered yet.</p>
            ) : (
              Object.entries(localFluff)
                .filter(([_, value]) => value)
                .map(([section, value]) => {
                  const title = sections.find(s => s.id === section)?.title || section;
                  return (
                    <div key={section} className="mb-6">
                      <h4 className="text-sm font-semibold text-slate-200 mb-2">{title}</h4>
                      <div className="text-sm text-slate-300 whitespace-pre-wrap">{value}</div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FluffTab;
