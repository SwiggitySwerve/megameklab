// src/components/__tests__/Sidebar.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import Sidebar from '@/components/Sidebar';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('Sidebar Component', () => {
  beforeEach(() => {
    // Reset mock before each test if needed, or set a default mock implementation
    (require('next/navigation').usePathname as jest.Mock).mockReturnValue('/dashboard');
  });

  it('should render the sidebar', () => {
    render(<Sidebar />);
    // Check for an element that is unique to the sidebar, e.g., the <aside> tag or a specific role
    expect(screen.getByRole('complementary')).toBeInTheDocument(); // <aside> has 'complementary' role
  });

  it('should display all navigation links', () => {
    render(<Sidebar />);
    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Units/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Factions/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Equipment/i })).toBeInTheDocument();
  });

  it('should highlight the active link', () => {
    // usePathname is mocked to return '/dashboard' by default in beforeEach
    render(<Sidebar />);
    const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });
    // Active link should have specific classes for styling (e.g., 'bg-sky-600 text-white')
    // These classes are defined in Sidebar.tsx
    expect(dashboardLink).toHaveClass('bg-sky-600');
    expect(dashboardLink).toHaveClass('text-white');
  });

  it('should not highlight an inactive link', () => {
    (require('next/navigation').usePathname as jest.Mock).mockReturnValue('/units'); // Set current path to /units
    render(<Sidebar />);
    const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });
    // Dashboard link should NOT have active classes if current path is /units
    expect(dashboardLink).not.toHaveClass('bg-sky-600');
    expect(dashboardLink).not.toHaveClass('text-white');

    const unitsLink = screen.getByRole('link', { name: /Units/i });
    expect(unitsLink).toHaveClass('bg-sky-600'); // Units link should be active
  });
});
