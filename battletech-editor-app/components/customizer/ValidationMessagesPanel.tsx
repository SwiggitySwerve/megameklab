// battletech-editor-app/components/customizer/ValidationMessagesPanel.tsx
import React from 'react';

interface ValidationMessagesPanelProps {
  warnings: string[];
}

const ValidationMessagesPanel: React.FC<ValidationMessagesPanelProps> = ({ warnings }) => {
  if (!warnings || warnings.length === 0) {
    return (
      <div className="p-4 border rounded shadow-sm mt-4 bg-green-100 text-green-700">
        <h2 className="text-lg font-semibold mb-1">Validation Status</h2>
        <p>No validation warnings. System nominal (based on current checks).</p>
      </div>
    );
  }
  return (
    <div className="p-4 border rounded shadow-sm mt-4 bg-yellow-100 text-yellow-800">
      <h2 className="text-lg font-semibold mb-1">Validation Warnings & Info</h2>
      <ul className="list-disc pl-5 text-sm">
        {warnings.map((warning, index) => (
          <li key={index} className={warning.toLowerCase().startsWith('warning:') ? 'text-red-700' : 'text-yellow-900'}>
            {warning}
          </li>
        ))}
      </ul>
    </div>
  );
};
export default ValidationMessagesPanel;
