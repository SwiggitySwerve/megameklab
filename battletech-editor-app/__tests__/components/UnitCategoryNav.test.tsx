// battletech-editor-app/__tests__/components/UnitCategoryNav.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UnitCategoryNav from '../../components/compendium/UnitCategoryNav';
import * as mockApiService from '../../services/mockApiService';

// Mock the mockApiService
jest.mock('../../services/mockApiService');
const mockGetMetadata = mockApiService.getMetadata as jest.MockedFunction<typeof mockApiService.getMetadata>;

describe('UnitCategoryNav', () => {
  const mockOnSelectCategory = jest.fn();
  const mockCategories = ['meks', 'vehicles', 'infantry', 'battlearmor', 'fighters'];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMetadata.mockResolvedValue(mockCategories);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<UnitCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory={null} />);
    expect(screen.getByText('Loading unit categories...')).toBeInTheDocument();
  });

  it('renders categories after loading', async () => {
    render(<UnitCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory={null} />);
    
    await waitFor(() => {
      expect(screen.getAllByText('BattleMechs')).toHaveLength(2); // Desktop + Mobile
      expect(screen.getAllByText('Vehicles')).toHaveLength(2);
      expect(screen.getAllByText('Infantry')).toHaveLength(2);
      expect(screen.getAllByText('Battle Armor')).toHaveLength(2);
      expect(screen.getAllByText('Aerospace Fighters')).toHaveLength(2);
    });
  });

  it('does not render "All Units" option in desktop layout', async () => {
    render(<UnitCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory={null} />);
    
    await waitFor(() => {
      expect(screen.getAllByText('BattleMechs')).toHaveLength(2);
    });

    // Check that "All Units" is not rendered anywhere
    const allUnitsButtons = screen.queryAllByText('All Units');
    expect(allUnitsButtons.length).toBe(0);
  });

  it('calls onSelectCategory when a category is clicked', async () => {
    render(<UnitCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory={null} />);
    
    await waitFor(() => {
      expect(screen.getAllByText('BattleMechs')).toHaveLength(2);
    });

    // Click the first (desktop) button
    fireEvent.click(screen.getAllByText('BattleMechs')[0]);
    expect(mockOnSelectCategory).toHaveBeenCalledWith('meks');
  });

  it('highlights selected category', async () => {
    render(<UnitCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory="vehicles" />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Vehicles')).toHaveLength(2);
    });

    const vehicleButtons = screen.getAllByText('Vehicles');
    // Desktop button should have desktop highlighting classes
    expect(vehicleButtons[0]).toHaveClass('font-bold', 'bg-blue-100', 'text-blue-800');
    // Mobile button should have mobile highlighting classes
    expect(vehicleButtons[1]).toHaveClass('bg-blue-500', 'text-white', 'border-blue-500');
  });

  it('displays proper category names from mapping', async () => {
    render(<UnitCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory={null} />);
    
    await waitFor(() => {
      expect(screen.getAllByText('BattleMechs')).toHaveLength(2); // meks -> BattleMechs
      expect(screen.getAllByText('Battle Armor')).toHaveLength(2); // battlearmor -> Battle Armor
      expect(screen.getAllByText('Aerospace Fighters')).toHaveLength(2); // fighters -> Aerospace Fighters
    });
  });

  it('handles error state', async () => {
    const errorMessage = 'Failed to fetch';
    mockGetMetadata.mockRejectedValue(new Error(errorMessage));

    render(<UnitCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory={null} />);
    
    await waitFor(() => {
      expect(screen.getByText(`Error loading unit categories: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('handles empty categories', async () => {
    mockGetMetadata.mockResolvedValue([]);

    render(<UnitCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory={null} />);
    
    await waitFor(() => {
      expect(screen.getByText('No unit categories found.')).toBeInTheDocument();
    });
  });

  it('handles unknown category types', async () => {
    const unknownCategories = ['unknowntype'];
    mockGetMetadata.mockResolvedValue(unknownCategories);

    render(<UnitCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory={null} />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Unknowntype')).toHaveLength(2); // Capitalized fallback (desktop + mobile)
    });
  });

  // Test for mobile layout behavior
  it('renders mobile layout with proper styling', async () => {
    render(<UnitCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory="meks" />);
    
    await waitFor(() => {
      expect(screen.getAllByText('BattleMechs')).toHaveLength(2);
    });

    // Check desktop layout exists (hidden on mobile)
    const desktopContainer = document.querySelector('.hidden.sm\\:block');
    expect(desktopContainer).toBeInTheDocument();

    // Check mobile layout exists (hidden on desktop)
    const mobileContainer = document.querySelector('.block.sm\\:hidden');
    expect(mobileContainer).toBeInTheDocument();
  });

  it('fetches categories from correct endpoint', async () => {
    render(<UnitCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory={null} />);
    
    await waitFor(() => {
      expect(mockGetMetadata).toHaveBeenCalledWith('/mockdata/mockUnitCategories.json');
    });
  });
});
