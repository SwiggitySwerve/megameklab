// src/components/Header.tsx
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-900 text-white px-4 py-3 shadow-md"> {/* Changed bg, added shadow */}
      <h1 className="text-xl font-semibold">BattleTech Editor</h1>
    </header>
  );
};

export default Header;
