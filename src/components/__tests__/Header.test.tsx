// src/components/__tests__/Header.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '@/components/Header'; // Using alias @/

describe('Header Component', () => {
  it('should render the application title', () => {
    render(<Header />);

    // Check if the heading with the specific text is present
    const titleElement = screen.getByRole('heading', { name: /BattleTech Editor/i });
    expect(titleElement).toBeInTheDocument();

    // Alternatively, you can check for text content if role isn't specific enough or changes
    // expect(screen.getByText('BattleTech Editor')).toBeInTheDocument();
  });
});
