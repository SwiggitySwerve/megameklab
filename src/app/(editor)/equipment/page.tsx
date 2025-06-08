// src/app/(editor)/equipment/page.tsx
import React from 'react';

const EquipmentPage: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Equipment</h1>

      <p className="text-gray-700 mb-8 text-lg">
        Browse and manage all equipment, weapons, and other items available in the BattleTech universe.
      </p>

      {/* Action Bar Placeholder */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-slate-700">Available Equipment</h2>
        <button
          disabled // This button is a placeholder for now
          className="bg-sky-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-sky-700 transition-colors duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Add New Equipment
        </button>
      </div>

      {/* Placeholder for Equipment List/Table */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="overflow-x-auto"> {/* Handles responsiveness for smaller screens */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Tonnage
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Cost (C-Bills)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Placeholder Row */}
              <tr>
                <td colSpan={5} className="px-6 py-10 whitespace-nowrap text-sm text-center text-gray-500">
                  <p>Equipment list will be displayed here.</p>
                  <p className="mt-1 text-xs">No items available yet, or data is loading.</p>
                </td>
              </tr>

              {/* Example of how an equipment row might look (commented out) */}
              {/*
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Large Laser</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Energy Weapon</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">5.0</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">120,000</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <a href="#" className="text-sky-600 hover:text-sky-800 mr-3">Edit</a>
                  <a href="#" className="text-red-600 hover:text-red-800">Delete</a>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">LRM 20 Rack</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Missile Launcher</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10.0</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">250,000</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <a href="#" className="text-sky-600 hover:text-sky-800 mr-3">Edit</a>
                  <a href="#" className="text-red-600 hover:text-red-800">Delete</a>
                </td>
              </tr>
              */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EquipmentPage;
