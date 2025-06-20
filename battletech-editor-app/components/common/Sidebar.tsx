import React, { ReactElement } from 'react';
import Link from 'next/link';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

interface NavItemProps {
  href: string;
  icon: ReactElement;
  label: string;
  isCollapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, label, isCollapsed }) => (
  <Link href={href} legacyBehavior>
    <a className="flex items-center p-2 space-x-3 rounded-md hover:bg-gray-700 transition-colors duration-150">
      {icon}
      {!isCollapsed && <span className="text-sm font-medium">{label}</span>}
    </a>
  </Link>
);

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Basic SVG icons - can be replaced with a proper icon library
  const navItems = [
    {
      href: '/',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3m-16.5 0h16.5m-16.5 0V3" />
        </svg>
      ),
      label: 'Dashboard',
    },
    {
      href: '/units',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />
        </svg>
      ),
      label: 'Units',
    },
    {
      href: '/equipment',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.472-2.472a3.375 3.375 0 000-4.773L6.75 2.25 2.25 6.75l4.773 4.773a3.375 3.375 0 004.773 0z" />
        </svg>
      ),
      label: 'Equipment',
    },
    {
      href: '/compendium',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      ),
      label: 'Compendium',
    },
    {
      href: '/customizer',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774a1.125 1.125 0 01.12 1.45l-.527.737c-.25.35-.272.806-.108 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.11v1.093c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738a1.125 1.125 0 01-.12 1.45l-.773.773a1.125 1.125 0 01-1.45-.12l-.737-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.78.93l-.15.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527a1.125 1.125 0 01-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.11v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.764-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.93l.15-.894z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: 'Customizer',
    },
    {
      href: '/compare',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 4.006 4.006 0 00-3.663-.138 4.006 4.006 0 00-3.7 3.7c-.091 1.21-.137 2.43-.137 3.662M19.5 12l2.25 2.25m-2.25-2.25l2.25-2.25M19.5 12l-2.25 2.25m-15-2.25l2.25 2.25m-2.25-2.25l2.25-2.25m-2.25 2.25l-2.25-2.25M12 19.5c-1.232 0-2.453-.046-3.662-.138a4.006 4.006 0 01-3.7-3.7 4.006 4.006 0 01-.138-3.662 4.006 4.006 0 013.7-3.7c1.209-.091 2.43-.137 3.662-.137m0 9.25c1.232 0 2.453.046 3.662.138a4.006 4.006 0 003.7 3.7 4.006 4.006 0 003.663.138 4.006 4.006 0 003.7-3.7c.091-1.21.137-2.43.137-3.662m0 9.25l-2.25-2.25m2.25 2.25l-2.25 2.25M4.5 12l2.25-2.25M4.5 12l-2.25-2.25" />
        </svg>
      ),
      label: 'Compare',
    },
  ];

  const demoItems = [
    {
      href: '/equipment-management-demo',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.472-2.472a3.375 3.375 0 000-4.773L6.75 2.25 2.25 6.75l4.773 4.773a3.375 3.375 0 004.773 0z" />
        </svg>
      ),
      label: 'Equipment Demo',
    },
    {
      href: '/armor-management-demo',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75A11.959 11.959 0 0112 2.715z" />
        </svg>
      ),
      label: 'Armor Demo',
    },
    {
      href: '/criticals-demo',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
      label: 'Criticals Demo',
    },
    {
      href: '/critical-slots-v2-demo',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      ),
      label: 'Critical Slots V2',
    },
    {
      href: '/critical-slots-test',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c.232.232.348.543.348.869v2.479A.75.75 0 0121 20.25h-9.562a.75.75 0 01-.75-.75v-.797m-.75 0H8.25a.75.75 0 01-.75-.75v-.797m.75 0a48.77 48.77 0 01-.75 0m.75 0c-.001-.246.154-.986.75-1.25m0 0v.797" />
        </svg>
      ),
      label: 'Critical Slots Test',
    },
    {
      href: '/armor-location-demo',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      ),
      label: 'Armor Locations',
    },
  ];

  // Remove test items section entirely since all test pages have been deleted
  return (
    <div
      className={`bg-gray-800 text-white transition-all duration-300 ease-in-out print:hidden ${
        isCollapsed ? 'w-20' : 'w-64' // Use isCollapsed from props
      } fixed inset-y-0 left-0 z-30 flex flex-col shadow-lg`} // Ensure it's fixed and covers full height
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-700 h-16"> {/* Fixed height for header */}
        {!isCollapsed && <span className="text-xl font-bold">BattleTech</span>} {/* Use isCollapsed from props */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /> {/* Shorter line for hamburger */}
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
      </div>
      <nav className="flex-grow p-2 space-y-1 overflow-y-auto"> {/* Adjusted padding and spacing */}
        {navItems.map((item) => (
          <NavItem key={item.label} {...item} isCollapsed={isCollapsed} />
        ))}
        
        {/* Demo Section */}
        <div className="pt-4 border-t border-gray-700">
          {!isCollapsed && (
            <div className="px-2 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Demos
            </div>
          )}
          {demoItems.map((item) => (
            <NavItem key={item.label} {...item} isCollapsed={isCollapsed} />
          ))}
        </div>
        
        
      </nav>
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
          <span>Editor v0.1.0</span>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
