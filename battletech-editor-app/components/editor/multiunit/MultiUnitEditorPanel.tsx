import React, { useState, useCallback } from 'react';
import { EditableUnit, Quirk } from '../../../types/editor';
import { FullEquipment } from '../../../types/index';
import { 
  BatchOperationsManager, 
  BatchOperation, 
  BatchOperationResult,
  UnitTemplate,
  STANDARD_TEMPLATES 
} from '../../../utils/batchOperations';

interface MultiUnitEditorPanelProps {
  units: EditableUnit[];
  availableEquipment: FullEquipment[];
  availableQuirks: Quirk[];
  onUnitsChange: (units: EditableUnit[]) => void;
  readOnly?: boolean;
}

const MultiUnitEditorPanel: React.FC<MultiUnitEditorPanelProps> = ({
  units,
  availableEquipment,
  availableQuirks,
  onUnitsChange,
  readOnly = false,
}) => {
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [operations, setOperations] = useState<BatchOperation[]>([]);
  const [results, setResults] = useState<BatchOperationResult[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<UnitTemplate | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Toggle unit selection
  const toggleUnitSelection = useCallback((unitId: string) => {
    setSelectedUnitIds(prev => 
      prev.includes(unitId) 
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
  }, []);

  // Select all units
  const selectAllUnits = useCallback(() => {
    setSelectedUnitIds(units.map(u => u.id));
  }, [units]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedUnitIds([]);
  }, []);

  // Add operation to queue
  const addOperation = useCallback((operation: BatchOperation) => {
    setOperations(prev => [...prev, operation]);
  }, []);

  // Remove operation from queue
  const removeOperation = useCallback((index: number) => {
    setOperations(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Clear all operations
  const clearOperations = useCallback(() => {
    setOperations([]);
  }, []);

  // Execute batch operations
  const executeBatchOperations = useCallback(async () => {
    if (selectedUnitIds.length === 0 || operations.length === 0) return;
    
    setIsProcessing(true);
    
    // Get selected units
    const selectedUnits = units.filter(u => selectedUnitIds.includes(u.id));
    
    // Apply operations
    const operationResults = BatchOperationsManager.applyBatchOperations(
      selectedUnits,
      operations
    );
    
    setResults(operationResults);
    
    // Update units
    const updatedUnits = [...units];
    onUnitsChange(updatedUnits);
    
    setIsProcessing(false);
  }, [selectedUnitIds, operations, units, onUnitsChange]);

  // Apply template
  const applyTemplate = useCallback(() => {
    if (!selectedTemplate) return;
    
    addOperation({
      type: 'applyTemplate',
      template: selectedTemplate
    });
  }, [selectedTemplate, addOperation]);

  return (
    <div className="multi-unit-editor-panel bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Multi-Unit Batch Editor</h3>

      {/* Unit Selection */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Select Units</h4>
          <div className="space-x-2">
            <button
              onClick={selectAllUnits}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Select All
            </button>
            <button
              onClick={clearSelection}
              className="text-xs text-gray-600 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded">
          {units.map(unit => (
            <label
              key={unit.id}
              className={`
                flex items-center p-2 rounded cursor-pointer transition-colors
                ${selectedUnitIds.includes(unit.id) 
                  ? 'bg-blue-100 border border-blue-300' 
                  : 'bg-white border border-gray-200 hover:bg-gray-50'
                }
              `}
            >
              <input
                type="checkbox"
                checked={selectedUnitIds.includes(unit.id)}
                onChange={() => toggleUnitSelection(unit.id)}
                className="mr-2"
                disabled={readOnly}
              />
              <div className="text-sm">
                <div className="font-medium">{unit.chassis} {unit.model}</div>
                <div className="text-xs text-gray-500">{unit.mass} tons</div>
              </div>
            </label>
          ))}
        </div>
        
        <div className="mt-2 text-xs text-gray-600">
          {selectedUnitIds.length} of {units.length} units selected
        </div>
      </div>

      {/* Operation Builder */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Build Operations</h4>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => addOperation({ type: 'setArmor', location: 'all', value: 0 })}
            disabled={readOnly}
            className="p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded"
          >
            Clear All Armor
          </button>
          
          <button
            onClick={() => {
              const template = STANDARD_TEMPLATES[0]; // Striker template
              addOperation({ type: 'applyTemplate', template });
            }}
            disabled={readOnly}
            className="p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded"
          >
            Apply Striker Template
          </button>
          
          <button
            onClick={() => {
              const template = STANDARD_TEMPLATES[1]; // Brawler template
              addOperation({ type: 'applyTemplate', template });
            }}
            disabled={readOnly}
            className="p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded"
          >
            Apply Brawler Template
          </button>
        </div>

        {/* Custom Operation Builder */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <select 
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
              disabled={readOnly}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'add-equipment') {
                  // In real implementation, would show equipment selector
                } else if (value === 'add-quirk') {
                  // In real implementation, would show quirk selector
                }
                e.target.value = '';
              }}
            >
              <option value="">Add Operation...</option>
              <option value="add-equipment">Add Equipment</option>
              <option value="remove-equipment">Remove Equipment</option>
              <option value="set-armor">Set Armor</option>
              <option value="add-quirk">Add Quirk</option>
              <option value="remove-quirk">Remove Quirk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Operation Queue */}
      {operations.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Operation Queue</h4>
            <button
              onClick={clearOperations}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          </div>
          
          <div className="space-y-1">
            {operations.map((op, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
              >
                <span>{getOperationDescription(op)}</span>
                <button
                  onClick={() => removeOperation(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execute Button */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-600">
          {operations.length} operation{operations.length !== 1 ? 's' : ''} queued
        </div>
        
        <button
          onClick={executeBatchOperations}
          disabled={readOnly || isProcessing || selectedUnitIds.length === 0 || operations.length === 0}
          className={`
            px-4 py-2 rounded font-medium text-sm transition-colors
            ${readOnly || isProcessing || selectedUnitIds.length === 0 || operations.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {isProcessing ? 'Processing...' : 'Execute Batch Operations'}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Results</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`
                  p-2 rounded text-xs
                  ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}
                `}
              >
                <div className="font-medium">{result.unitName}</div>
                {result.errors && (
                  <ul className="mt-1 space-y-0.5">
                    {result.errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                )}
                {result.warnings && (
                  <ul className="mt-1 space-y-0.5 text-yellow-700">
                    {result.warnings.map((warning, i) => (
                      <li key={i}>⚠ {warning}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to describe operations
function getOperationDescription(operation: BatchOperation): string {
  switch (operation.type) {
    case 'addEquipment':
      return `Add ${operation.equipment.name}${operation.location ? ` to ${operation.location}` : ''}`;
    case 'removeEquipment':
      return `Remove equipment ${operation.equipmentId}`;
    case 'setArmor':
      return `Set ${operation.location} armor to ${operation.value}${operation.isRear ? ' (rear)' : ''}`;
    case 'addQuirk':
      return `Add quirk: ${operation.quirk.name}`;
    case 'removeQuirk':
      return `Remove quirk ${operation.quirkId}`;
    case 'setArmorType':
      return `Change armor type to ${operation.armorTypeId}`;
    case 'applyTemplate':
      return `Apply template: ${operation.template.name}`;
    default:
      return 'Unknown operation';
  }
}

export default MultiUnitEditorPanel;
