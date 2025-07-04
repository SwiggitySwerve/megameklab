/**
 * Hybrid Structure Tab
 * Works with both prop-based and hook-based data models
 */

import React from 'react';
import { EditableUnit } from '../../../types/editor';
import StructureTab from './StructureTab';
import StructureTabWithHooks from './StructureTabWithHooks';
import { useUnitData } from '../../../hooks/useUnitData';

// Create a context to detect if we're using the unified data model
const UnitDataContext = React.createContext<boolean>(false);

interface StructureTabHybridProps {
  unit: EditableUnit;
  onUnitChange: (updates: Partial<EditableUnit>) => void;
  validationErrors?: any[];
  readOnly?: boolean;
}

const StructureTabHybrid: React.FC<StructureTabHybridProps> = (props) => {
  // Try to use the hook at the top level
  let hasUnitData = false;
  try {
    // This will throw if not in a UnitDataProvider context
    useUnitData();
    hasUnitData = true;
  } catch {
    // Not in a UnitDataProvider context
    hasUnitData = false;
  }
  
  if (hasUnitData) {
    return <StructureTabWithHooks readOnly={props.readOnly} />;
  }
  return <StructureTab {...props} />;
};

export default StructureTabHybrid;
