import React from 'react';

interface FluffTabWithHooksProps {
  readOnly?: boolean;
}

export default function FluffTabWithHooks({ readOnly = false }: FluffTabWithHooksProps) {
  return (
    <div>
      <h2>Fluff Tab (Coming Soon)</h2>
      <p>This tab will use the unified data model for fluff/quirks management.</p>
    </div>
  );
}
