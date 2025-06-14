/**
 * UnitEditor Wrapper
 * Integrates the unified data model with hooks into the existing UnitEditor
 */

import React from 'react';
import { EditableUnit } from '../../types/editor';
import UnitEditorWithHooks from './UnitEditorWithHooks';

interface UnitEditorWrapperProps {
  unit: EditableUnit;
  onUnitChange: (unit: EditableUnit) => void;
  onSave?: (unit: EditableUnit) => Promise<void>;
  readOnly?: boolean;
  className?: string;
}

// Main wrapper component
export default function UnitEditorWrapper({
  unit,
  onUnitChange,
  onSave,
  readOnly = false,
  className = '',
}: UnitEditorWrapperProps) {
  // UnitEditorWithHooks already has its own UnitDataProvider,
  // so we just pass through the props
  return (
    <UnitEditorWithHooks
      unit={unit}
      onUnitChange={onUnitChange}
      readOnly={readOnly}
    />
  );
}
