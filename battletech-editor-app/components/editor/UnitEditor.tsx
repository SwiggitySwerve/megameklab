import React from 'react';
import { EditableUnit, EditorTab } from '../../types/editor';
import ArmorTabWithHooks from './tabs/ArmorTabWithHooks';
import StructureTabWithHooks from './tabs/StructureTabWithHooks';
import EquipmentTabWithHooks from './tabs/EquipmentTabWithHooks';
import CriticalsTabIntegrated from './tabs/CriticalsTabIntegrated';
import FluffTabWithHooks from './tabs/FluffTabWithHooks';
import { useUnitEditor } from '../../hooks/editor/useUnitEditor';

// Tab definitions
const EDITOR_TABS = [
  { id: 'structure', label: 'Structure', component: StructureTabWithHooks },
  { id: 'armor', label: 'Armor', component: ArmorTabWithHooks },
  { id: 'equipment', label: 'Equipment', component: EquipmentTabWithHooks },
  { id: 'criticals', label: 'Criticals', component: CriticalsTabIntegrated },
  { id: 'fluff', label: 'Fluff', component: FluffTabWithHooks },
  { id: 'quirks', label: 'Quirks', component: null }, // Coming soon
  { id: 'preview', label: 'Preview', component: null }, // Coming soon
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
  // Use the comprehensive unit editor hook
  const {
    unit: editorUnit,
    activeTab,
    validationErrors,
    isValid,
    isDirty,
    isLoading,
    isAutoSaving,
    performance,
    validation,
    availableTabs,
    updateUnit,
    changeTab,
    save,
    getTabValidation,
    canNavigateToTab
  } = useUnitEditor(unit, {
    enableAutoSave: !!onSave,
    enablePersistence: true,
    enableKeyboardShortcuts: true,
    onSave,
    onValidationChange: (validation) => {
      // Optional: notify parent of validation changes
    },
    onTabChange: (tab) => {
      // Optional: notify parent of tab changes
    }
  });

  // Sync changes back to parent
  React.useEffect(() => {
    onUnitChange(editorUnit);
  }, [editorUnit, onUnitChange]);

  // Get active tab component
  const ActiveTabComponent = EDITOR_TABS.find(tab => tab.id === activeTab)?.component;

  // Calculate display values from performance metrics
  const currentWeight = performance?.weight.total || 0;
  const heatGeneration = performance?.heat.generation || 0;
  const heatDissipation = performance?.heat.dissipation || 10;
  const battleValue = performance?.battleValue.total || 0;
  const dryCost = performance?.cost.total || 0;
  const freeCriticalSlots = performance?.criticalSlots.free || 0;
  const totalCriticalSlots = performance?.criticalSlots.total || 78;
  
  const isOverweight = performance?.weight.isOverweight || false;
  const isOverheating = performance?.heat.isOverheating || false;
  const hasValidationErrors = !isValid;

  // Handle tab changes
  const handleTabChange = React.useCallback((tabId: EditorTab) => {
    changeTab(tabId);
  }, [changeTab]);

  // Handle unit updates
  const handleUnitUpdate = React.useCallback((updates: Partial<EditableUnit>) => {
    updateUnit(updates);
  }, [updateUnit]);

  return (
    <div className={`unit-editor ${className}`}>
      {/* Editor Header */}
      <div className="editor-header bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editorUnit.chassis} {editorUnit.model}
              {isDirty && <span className="text-orange-500 ml-2">*</span>}
            </h2>
            <div className="text-sm text-gray-500">
              {editorUnit.mass}t {editorUnit.tech_base}
              {editorUnit.systemComponents?.engine && (
                <span className="ml-2 text-xs">
                  ({editorUnit.systemComponents.engine.type} {editorUnit.systemComponents.engine.rating})
                </span>
              )}
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
            
            {isAutoSaving && (
              <div className="flex items-center text-blue-600 text-sm">
                <svg className="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Auto-saving...
              </div>
            )}
            
            {onSave && (
              <button
                onClick={save}
                disabled={!isDirty || isLoading}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save'}
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

      {/* Editor Status Bar - MegaMekLab style */}
      <div className="editor-status-bar bg-gray-800 text-white px-4 py-2 text-sm border-b border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Weight Status */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Weight:</span>
              <span className={`font-medium ${
                isOverweight ? 'text-red-400' : 'text-green-400'
              }`}>
                {currentWeight.toFixed(1)} / {editorUnit.mass || 0} tons
              </span>
            </div>

            {/* Battle Value */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">BV:</span>
              <span className="font-medium">{battleValue}</span>
            </div>

            {/* Validation Status */}
            {!isValid && (
              <div className="flex items-center space-x-2">
                <span className="text-red-400 font-medium">Invalid</span>
              </div>
            )}

            {/* Dry Cost */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Dry Cost:</span>
              <span className="font-medium">
                {new Intl.NumberFormat('en-US').format(dryCost)} C-bills
              </span>
            </div>

            {/* Free Critical Slots */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Free Slots:</span>
              <span className="font-medium">
                {freeCriticalSlots} / {totalCriticalSlots}
              </span>
            </div>

            {/* Heat Status */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Heat:</span>
              <span className={`font-medium ${
                isOverheating ? 'text-red-400' : 'text-green-400'
              }`}>
                {heatGeneration} / {heatDissipation}
              </span>
            </div>
          </div>

          {/* Right side info */}
          <div className="flex items-center space-x-4">
            {isAutoSaving ? (
              <span className="text-blue-400 text-xs">Auto-saving...</span>
            ) : (
              onSave && <span className="text-green-400 text-xs">Auto-save enabled</span>
            )}
            <span className="text-xs text-gray-400">
              v{editorUnit.editorMetadata?.version || '1.0.0'}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="editor-tabs border-b border-gray-200 bg-gray-50">
        <nav className="flex space-x-8 px-4" aria-label="Tabs">
          {EDITOR_TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            const isDisabled = !tab.component;
            const tabValidation = getTabValidation(tab.id as EditorTab);
            
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && handleTabChange(tab.id as EditorTab)}
                disabled={isDisabled || !canNavigateToTab(tab.id as EditorTab)}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap relative
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : isDisabled
                    ? 'border-transparent text-gray-400 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
                {tabValidation.hasErrors && (
                  <span className="ml-1 inline-flex items-center justify-center px-1 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    !
                  </span>
                )}
                {tabValidation.hasWarnings && !tabValidation.hasErrors && (
                  <span className="ml-1 inline-flex items-center justify-center px-1 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    ⚠
                  </span>
                )}
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
            unit={editorUnit}
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
    </div>
  );
};

export default UnitEditor;
