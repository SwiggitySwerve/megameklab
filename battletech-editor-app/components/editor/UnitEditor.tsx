import React, { useState, useCallback, useMemo } from 'react';
import { EditableUnit, EditorTab, ValidationError, UnitEditorState } from '../../types/editor';
import StructureArmorTab from './tabs/StructureArmorTab';

// Tab definitions
const EDITOR_TABS = [
  { id: 'structure', label: 'Structure/Armor', component: StructureArmorTab },
  { id: 'equipment', label: 'Equipment', component: null }, // To be implemented
  { id: 'criticals', label: 'Assign Criticals', component: null },
  { id: 'fluff', label: 'Fluff', component: null },
  { id: 'quirks', label: 'Quirks', component: null },
  { id: 'preview', label: 'Preview', component: null },
] as const;

interface UnitEditorProps {
  unit: EditableUnit;
  onUnitChange: (unit: EditableUnit) => void;
  onSave?: (unit: EditableUnit) => Promise<void>;
  readOnly?: boolean;
  className?: string;
}

const UnitEditor: React.FC<UnitEditorProps> = ({
  unit,
  onUnitChange,
  onSave,
  readOnly = false,
  className = '',
}) => {
  const [editorState, setEditorState] = useState<UnitEditorState>({
    unit,
    activeTab: 'structure',
    validationErrors: [],
    isDirty: false,
    autoSave: true,
    isLoading: false,
  });

  // Handle tab changes
  const handleTabChange = useCallback((tabId: EditorTab) => {
    setEditorState(prev => ({
      ...prev,
      activeTab: tabId,
    }));
  }, []);

  // Handle unit updates
  const handleUnitUpdate = useCallback((updates: Partial<EditableUnit>) => {
    const updatedUnit = {
      ...editorState.unit,
      ...updates,
      editorMetadata: {
        ...editorState.unit.editorMetadata,
        lastModified: new Date(),
        isDirty: true,
      },
    };

    setEditorState(prev => ({
      ...prev,
      unit: updatedUnit,
      isDirty: true,
    }));

    onUnitChange(updatedUnit);
  }, [editorState.unit, onUnitChange]);

  // Validate unit
  const validationErrors = useMemo((): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Basic validation - to be expanded
    if (!editorState.unit.chassis) {
      errors.push({
        id: 'missing-chassis',
        category: 'error',
        message: 'Chassis name is required',
        field: 'chassis',
      });
    }

    if (!editorState.unit.model) {
      errors.push({
        id: 'missing-model',
        category: 'error',
        message: 'Model designation is required',
        field: 'model',
      });
    }

    return errors;
  }, [editorState.unit]);

  // Get active tab component
  const ActiveTabComponent = EDITOR_TABS.find(tab => tab.id === editorState.activeTab)?.component;

  return (
    <div className={`unit-editor ${className}`}>
      {/* Editor Header */}
      <div className="editor-header bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editorState.unit.chassis} {editorState.unit.model}
              {editorState.isDirty && <span className="text-orange-500 ml-2">*</span>}
            </h2>
            <div className="text-sm text-gray-500">
              {editorState.unit.mass}t {editorState.unit.tech_base}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {validationErrors.length > 0 && (
              <div className="flex items-center text-red-600 text-sm">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {validationErrors.length} error{validationErrors.length !== 1 ? 's' : ''}
              </div>
            )}
            
            {onSave && (
              <button
                onClick={() => onSave(editorState.unit)}
                disabled={!editorState.isDirty || editorState.isLoading}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editorState.isLoading ? 'Saving...' : 'Save'}
              </button>
            )}
          </div>
        </div>

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
            <ul className="text-sm text-red-800 space-y-1">
              {validationErrors.map(error => (
                <li key={error.id} className="flex items-center">
                  <span className="mr-2">•</span>
                  {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="editor-tabs border-b border-gray-200 bg-gray-50">
        <nav className="flex space-x-8 px-4" aria-label="Tabs">
          {EDITOR_TABS.map((tab) => {
            const isActive = tab.id === editorState.activeTab;
            const isDisabled = !tab.component && tab.id !== 'structure';
            
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && handleTabChange(tab.id as EditorTab)}
                disabled={isDisabled}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : isDisabled
                    ? 'border-transparent text-gray-400 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
                {isDisabled && (
                  <span className="ml-1 text-xs text-gray-400">(Coming Soon)</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="editor-content flex-1 p-4 bg-gray-50 min-h-[600px]">
        {ActiveTabComponent ? (
          <ActiveTabComponent
            unit={editorState.unit}
            onUnitChange={handleUnitUpdate}
            validationErrors={validationErrors}
            readOnly={readOnly}
            compact={true}
          />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Coming Soon</h3>
              <p className="mt-1 text-sm text-gray-500">
                This tab is under development
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Editor Footer */}
      <div className="editor-footer bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Last modified: {editorState.unit.editorMetadata?.lastModified?.toLocaleTimeString() || 'Never'}</span>
            {editorState.autoSave && <span className="text-green-600">Auto-save enabled</span>}
          </div>
          <div className="flex items-center space-x-2">
            <span>Version: {editorState.unit.editorMetadata?.version || '1.0.0'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitEditor;
