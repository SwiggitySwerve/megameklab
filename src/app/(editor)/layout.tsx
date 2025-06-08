// src/app/(editor)/layout.tsx
import React from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden"> {/* Added overflow-hidden for better layout control */}
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 bg-gray-100 overflow-y-auto"> {/* Ensured padding, added overflow-y-auto */}
          {children}
        </main>
      </div>
    </div>
  );
}
