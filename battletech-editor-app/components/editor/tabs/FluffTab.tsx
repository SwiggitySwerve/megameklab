import React, { useState, useCallback, useEffect } from 'react';
import { EditorComponentProps } from '../../../types/editor';

interface FluffCategory {
  id: string;
  label: string;
  placeholder: string;
  maxLength?: number;
}

const FLUFF_CATEGORIES: FluffCategory[] = [
  {
    id: 'overview',
    label: 'Overview',
    placeholder: 'Provide a general description of the unit, its purpose, and notable characteristics...',
    maxLength: 2000,
  },
  {
    id: 'capabilities',
    label: 'Capabilities',
    placeholder: 'Describe the unit\'s combat capabilities, weapons systems, and tactical role...',
    maxLength: 1500,
  },
  {
    id: 'deployment',
    label: 'Deployment',
    placeholder: 'Detail how and where this unit is typically deployed, including notable engagements...',
    maxLength: 1500,
  },
  {
    id: 'history',
    label: 'History',
    placeholder: 'Chronicle the development history, variants, and significant battles involving this unit...',
    maxLength: 2000,
  },
  {
    id: 'variants',
    label: 'Variants',
    placeholder: 'List and describe notable variants of this unit and their differences...',
    maxLength: 1000,
  },
  {
    id: 'notable_pilots',
    label: 'Notable Pilots',
    placeholder: 'Document famous pilots who have operated this unit and their achievements...',
    maxLength: 1000,
  },
];

const FluffTab: React.FC<EditorComponentProps> = ({
  unit,
  onUnitChange,
  validationErrors = [],
  readOnly = false,
  compact = true,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('overview');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);

  // Auto-save functionality
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleFluffChange = useCallback((categoryId: string, content: string) => {
    const updatedFluffData = {
      ...unit.fluffData,
      [categoryId]: content,
    };

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set saving status
    setAutoSaveStatus('saving');

    // Set new timeout for auto-save
    const newTimeout = setTimeout(() => {
      onUnitChange({
        ...unit,
        fluffData: updatedFluffData,
      });
      setAutoSaveStatus('saved');
      
      // Clear saved status after 2 seconds
      setTimeout(() => setAutoSaveStatus(null), 2000);
    }, 1000); // Auto-save after 1 second of inactivity

    setSaveTimeout(newTimeout);
  }, [unit, onUnitChange, saveTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  const getCurrentContent = (categoryId: string): string => {
    return unit.fluffData?.[categoryId] || '';
  };

  const getWordCount = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharacterCount = (text: string): number => {
    return text.length;
  };

  const activeFluffCategory = FLUFF_CATEGORIES.find(cat => cat.id === activeCategory) || FLUFF_CATEGORIES[0];

  return (
    <div className="fluff-tab">
      <div className="grid grid-cols-4 gap-4 max-w-7xl">
        {/* Left Column - Category Navigation */}
        <div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Fluff Categories
            </h3>
            <div className="space-y-1">
              {FLUFF_CATEGORIES.map(category => {
                const content = getCurrentContent(category.id);
                const wordCount = getWordCount(content);
                const isSelected = activeCategory === category.id;
                const hasContent = content.trim().length > 0;

                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      isSelected
                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                        : 'hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category.label}</span>
                      <div className="flex items-center space-x-1">
                        {hasContent && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                        <span className="text-xs text-gray-500">
                          {wordCount}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Auto-save status */}
            {autoSaveStatus && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className={`flex items-center text-sm ${
                  autoSaveStatus === 'saved' ? 'text-green-600' :
                  autoSaveStatus === 'saving' ? 'text-blue-600' :
                  'text-red-600'
                }`}>
                  {autoSaveStatus === 'saved' && (
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {autoSaveStatus === 'saving' && (
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {autoSaveStatus === 'error' && (
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span>
                    {autoSaveStatus === 'saved' && 'Saved'}
                    {autoSaveStatus === 'saving' && 'Saving...'}
                    {autoSaveStatus === 'error' && 'Save Error'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle Column - Text Editor */}
        <div className="col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {activeFluffCategory.label}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>
                  Words: {getWordCount(getCurrentContent(activeCategory))}
                </span>
                <span>
                  Characters: {getCharacterCount(getCurrentContent(activeCategory))}
                  {activeFluffCategory.maxLength && (
                    <span className={getCharacterCount(getCurrentContent(activeCategory)) > activeFluffCategory.maxLength ? 'text-red-600' : ''}>
                      /{activeFluffCategory.maxLength}
                    </span>
                  )}
                </span>
              </div>
            </div>

            <textarea
              value={getCurrentContent(activeCategory)}
              onChange={(e) => handleFluffChange(activeCategory, e.target.value)}
              placeholder={activeFluffCategory.placeholder}
              disabled={readOnly}
              className={`w-full h-96 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                readOnly ? 'bg-gray-50' : 'bg-white'
              } ${
                activeFluffCategory.maxLength && 
                getCharacterCount(getCurrentContent(activeCategory)) > activeFluffCategory.maxLength
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : ''
              }`}
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
            />

            {/* Character limit warning */}
            {activeFluffCategory.maxLength && 
             getCharacterCount(getCurrentContent(activeCategory)) > activeFluffCategory.maxLength && (
              <div className="mt-2 text-sm text-red-600">
                Content exceeds maximum length by {getCharacterCount(getCurrentContent(activeCategory)) - activeFluffCategory.maxLength} characters
              </div>
            )}

            {/* Formatting Help */}
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Writing Tips:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Write in third person for official technical readouts</li>
                <li>• Focus on factual information about capabilities and deployment</li>
                <li>• Include relevant dates, battles, and historical context</li>
                <li>• Maintain consistency with BattleTech universe lore</li>
                <li>• Content auto-saves after 1 second of inactivity</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column - Actions & Statistics */}
        <div className="space-y-4">
          {/* Unit Icon */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Unit Icon
            </h3>
            <div className="text-center space-y-3">
              <div className="w-24 h-24 mx-auto bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-sm">No Icon</span>
              </div>
              <div className="space-y-2">
                <button 
                  className="w-full px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50" 
                  disabled={readOnly}
                >
                  Choose File
                </button>
                <button 
                  className="w-full px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50" 
                  disabled={readOnly}
                >
                  Import from Cache
                </button>
                <button 
                  className="w-full px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50" 
                  disabled={readOnly}
                >
                  Remove Icon
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Recommended: 256x256px PNG
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Content Statistics
            </h3>
            
            <div className="space-y-3">
              {/* Overall progress */}
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Categories with content:</span>
                  <span>
                    {FLUFF_CATEGORIES.filter(cat => getCurrentContent(cat.id).trim().length > 0).length} / {FLUFF_CATEGORIES.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${(FLUFF_CATEGORIES.filter(cat => getCurrentContent(cat.id).trim().length > 0).length / FLUFF_CATEGORIES.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Per-category word counts */}
              <div>
                <div className="text-xs font-medium text-gray-700 mb-2">Word Counts:</div>
                <div className="space-y-1">
                  {FLUFF_CATEGORIES.map(category => {
                    const wordCount = getWordCount(getCurrentContent(category.id));
                    return (
                      <div key={category.id} className="flex justify-between text-xs">
                        <span className="text-gray-600">{category.label}:</span>
                        <span className={wordCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                          {wordCount}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {!readOnly && (
              <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
                <button
                  onClick={() => {
                    const updatedFluffData = { ...unit.fluffData };
                    updatedFluffData[activeCategory] = '';
                    onUnitChange({ ...unit, fluffData: updatedFluffData });
                  }}
                  className="w-full px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Clear Current Section
                </button>
                <button
                  onClick={() => {
                    const emptyFluffData: { [key: string]: string } = {};
                    FLUFF_CATEGORIES.forEach(cat => {
                      emptyFluffData[cat.id] = '';
                    });
                    onUnitChange({ ...unit, fluffData: emptyFluffData });
                  }}
                  className="w-full px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Clear All Content
                </button>
              </div>
            )}
          </div>

          {/* Templates */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-800">
              <div className="font-medium mb-1">Content Templates:</div>
              <div className="space-y-1">
                <button className="text-left text-blue-700 hover:text-blue-900 block">
                  • Standard Assault Mech
                </button>
                <button className="text-left text-blue-700 hover:text-blue-900 block">
                  • House Unit Variant
                </button>
                <button className="text-left text-blue-700 hover:text-blue-900 block">
                  • Mercenary Custom
                </button>
                <button className="text-left text-blue-700 hover:text-blue-900 block">
                  • Clan Technology
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FluffTab;
