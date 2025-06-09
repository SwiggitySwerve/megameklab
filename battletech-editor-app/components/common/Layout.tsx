import React, { ReactNode } from 'react';
import Head from 'next/head';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  sidebarComponent?: ReactNode; // Renamed prop
  isSidebarCollapsed?: boolean; // New prop for controlling margins
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'BattleTech Editor',
  sidebarComponent,
  isSidebarCollapsed,
}) => {
  // Determine margin based on sidebar state for md screens and up
  const contentAndFooterMargin = isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64';

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        {/* Add other meta tags, favicons etc. here */}
      </Head>

      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        {/* Sidebar is expected to be a fixed position component, rendered here */}
        {sidebarComponent && <div className="print:hidden">{sidebarComponent}</div>}

        {/* Main content area */}
        <main
          className={`flex-grow p-4 sm:p-6 w-full ml-0 ${contentAndFooterMargin} transition-all duration-300 ease-in-out`}
        >
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer
        className={`p-4 bg-gray-200 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300 print:hidden ml-0 ${contentAndFooterMargin} transition-all duration-300 ease-in-out`}
      >
        <div className="container mx-auto px-4 text-center">
          <p>BattleTech Data Editor & Viewer | Concept by Jules</p>
          <p>&copy; {new Date().getFullYear()} BattleTech Editor Project. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
};

export default Layout;
