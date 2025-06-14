/**
 * Hybrid Structure Tab
 * Works with both prop-based and hook-based data models
 */

import React, { useContext } from 'react';
import { EditableUnit } from '../../../types/editor';
import StructureTab from './StructureTab';
import StructureTabWithHooks from './StructureTabWithHooks';

// Create a context to detect if we're using the unified data model
const UnitDataContext = React.createContext<boolean>(false);

interface StructureTabHybridProps {
  unit: EditableUnit;
  onUnitChange: (updates: Partial<EditableUnit>) => void;
  validationErrors?: any[];
  readOnly?: boolean;
}

const StructureTabHybrid: React.FC<StructureTabHybridProps> = (props) => {
  // Try to detect if we're in a UnitDataProvider context
  try {
    // Import the hook dynamically to avoid errors when not in context
    const { useUnitData } = require('../../../hooks/useUnitData');
    const context = useUnitData();
    
    // If we successfully got the context, use the hooks version
    if (context) {
      return <StructureTabWithHooks readOnly={props.readOnly} />;
    }
  } catch (e) {
    // Not in a UnitDataProvider, use prop-based version
  }
  
  // Fall back to prop-based version
  return <StructureTab {...props} />;
};

export default StructureTabHybrid;
