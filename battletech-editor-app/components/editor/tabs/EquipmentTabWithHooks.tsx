import React from 'react';

interface EquipmentTabWithHooksProps {
  readOnly?: boolean;
}

export default function EquipmentTabWithHooks({ readOnly = false }: EquipmentTabWithHooksProps) {
  return (
    <div>
      <h2>Equipment Tab (Coming Soon)</h2>
      <p>This tab will use the unified data model for equipment management.</p>
    </div>
  );
}
