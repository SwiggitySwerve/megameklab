// src/app/(editor)/dashboard/page.tsx
import React from 'react';

const DashboardPage: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Dashboard</h1> {/* Adjusted heading style slightly */}

      <p className="text-gray-700 mb-8 text-lg">
        Welcome to the BattleTech Editor! Select an option from the sidebar to get started managing your game data.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Recent Units */}
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <h2 className="text-xl font-semibold text-slate-700 mb-3">Recent Units</h2>
          <p className="text-slate-600">
            No recent units to display yet. This area will show units you've recently worked on.
          </p>
        </div>

        {/* Card 2: Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <h2 className="text-xl font-semibold text-slate-700 mb-3">Quick Actions</h2>
          <p className="text-slate-600">
            {/* These could be styled as buttons or links later */}
            <span className="block sm:inline-block mb-2 sm:mb-0 sm:mr-2">Create New Unit</span>
            <span className="hidden sm:inline-block">|</span>
            <span className="block sm:inline-block sm:ml-2">Manage Factions</span>
          </p>
          <p className="text-slate-500 text-sm mt-3">
            Jump directly into common tasks.
          </p>
        </div>

        {/* Card 3: Statistics (Placeholder) */}
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out md:col-span-2 lg:col-span-1">
          {/* Spans 2 columns on medium, 1 on large to vary layout */}
          <h2 className="text-xl font-semibold text-slate-700 mb-3">Data Overview</h2>
          <p className="text-slate-600">
            Total Units: <span className="font-semibold">0</span>
          </p>
          <p className="text-slate-600">
            Total Factions: <span className="font-semibold">0</span>
          </p>
          <p className="text-slate-600">
            Total Equipment: <span className="font-semibold">0</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
