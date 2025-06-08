// src/components/Sidebar.tsx
'use client'; // Required for usePathname

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // For active link styling

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/units', label: 'Units' },
  { href: '/factions', label: 'Factions' },
  { href: '/equipment', label: 'Equipment' },
];

const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-800 text-gray-200 p-5 min-h-screen"> {/* Adjusted background to gray-800 for better contrast with hover/active */}
      <nav>
        <ul>
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/'); // Handles sub-routes as active
            return (
              <li key={link.href} className="mb-2">
                <Link
                  href={link.href}
                  className={`block py-3 px-4 rounded transition-colors duration-150 ease-in-out
                    ${isActive
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'hover:bg-gray-700 hover:text-gray-100'
                    }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
