import { useState } from 'react';
import Layout from '../components/common/Layout';
import Sidebar from '../components/common/Sidebar'; // Import Sidebar

export default function HomePage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <Layout
      title="BattleTech Dashboard" // Set page title
      sidebarComponent={
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
      }
      isSidebarCollapsed={isSidebarCollapsed} // Pass state to Layout for content margin adjustment
    >
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
          Welcome to the BattleTech Editor Dashboard!
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
          This is your central hub for managing BattleTech data. Use the sidebar navigation to explore different sections like Units, Equipment, and more.
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          Select an option from the menu to get started. More features and content will be added soon.
        </p>
      </div>
    </Layout>
  );
}
