// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Assuming Tailwind CSS global styles

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BattleTech Editor",
  description: "Editor for BattleTech game data",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-200`}>
        {children}
      </body>
    </html>
  );
}
