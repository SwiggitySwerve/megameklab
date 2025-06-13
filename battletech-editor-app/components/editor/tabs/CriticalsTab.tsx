import React from 'react';
import { EditorComponentProps } from '../../../types/editor';

const CriticalsTab: React.FC<EditorComponentProps> = ({
  unit,
  onUnitChange,
  validationErrors = [],
  readOnly = false,
}) => {
  return (
    <div>
      {/* Content will be added in subsequent steps */}
    </div>
  );
};

export default CriticalsTab;
