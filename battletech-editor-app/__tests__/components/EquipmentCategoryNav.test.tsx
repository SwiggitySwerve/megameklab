// battletech-editor-app/__tests__/components/EquipmentCategoryNav.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EquipmentCategoryNav from '../../components/compendium/EquipmentCategoryNav';
import * as mockApiService from '../../services/mockApiService';

// Mock the mockApiService
jest.mock('../../services/mockApiService');
const mockGetMetadata = mockApiService.getMetadata as jest.MockedFunction<typeof mockApiService.getMetadata>;

describe('EquipmentCategoryNav', () => {
  const mockOnSelectCategory = jest.fn();
  const mockCategories = ['weapons', 'ammunition', 'equipment', 'armor', 'structure'];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMetadata.mockResolvedValue(mockCategories);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<EquipmentCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory={null} />);
    expect(screen.getByText('Loading equipment categories...')).toBeInTheDocument();
  });

  it('renders categories after loading', async () => {
    render(<EquipmentCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory={null} />);
    
    await waitFor(() => {
      expect(screen.getByText('Weapons')).toBeInTheDocument();
      expect(screen.getByText('Ammunition')).toBeInTheDocument();
      expect(screen.getByText('Equipment')).toBeInTheDocument();
      expect(screen.getByText('Armor')).toBeInTheDocument();
      expect(screen.getByText('Structure')).toBeInTheDocument();
    });
  });

  it('does not render "All Equipment Types" option', async () => {
    render(<EquipmentCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory={null} />);
    
    await waitFor(() => {
      expect(screen.getByText('Weapons')).toBeInTheDocument();
    });

    // Check that "All Equipment Types" is not rendered
    expect(screen.queryByText('All Equipment Types')).not.toBeInTheDocument();
  });

  it('calls onSelectCategory when a category is clicked', async () => {
    render(<EquipmentCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory={null} />);
    
    await waitFor(() => {
      expect(screen.getByText('Weapons')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Weapons'));
    expect(mockOnSelectCategory).toHaveBeenCalledWith('weapons');
  });

  it('highlights selected category', async () => {
    render(<EquipmentCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory="ammunition" />);
    
    await waitFor(() => {
      expect(screen.getByText('Ammunition')).toBeInTheDocument();
    });

    const ammunitionButton = screen.getByText('Ammunition');
    expect(ammunitionButton).toHaveClass('font-bold');
  });

  it('capitalizes category names properly', async () => {
    const lowerCaseCategories = ['weapons', 'ammunition', 'equipment'];
    mockGetMetadata.mockResolvedValue(lowerCaseCategories);

    render(<EquipmentCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory={null} />);
    
    await waitFor(() => {
      expect(screen.getByText('Weapons')).toBeInTheDocument(); // weapons -> Weapons
      expect(screen.getByText('Ammunition')).toBeInTheDocument(); // ammunition -> Ammunition
      expect(screen.getByText('Equipment')).toBeInTheDocument(); // equipment -> Equipment
    });
  });

  it('handles error state', async () => {
    const errorMessage = 'Failed to fetch equipment categories';
    mockGetMetadata.mockRejectedValue(new Error(errorMessage));

    render(<EquipmentCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory={null} />);
    
    await waitFor(() => {
      expect(screen.getByText(`Error loading equipment categories: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('handles empty categories', async () => {
    mockGetMetadata.mockResolvedValue([]);

    render(<EquipmentCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory={null} />);
    
    await waitFor(() => {
      expect(screen.getByText('No equipment categories found.')).toBeInTheDocument();
    });
  });

  it('handles non-Error exceptions', async () => {
    mockGetMetadata.mockRejectedValue('String error');

    render(<EquipmentCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory={null} />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading equipment categories: An unknown error occurred')).toBeInTheDocument();
    });
  });

  it('renders with scrollable container', async () => {
    render(<EquipmentCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory={null} />);
    
    await waitFor(() => {
      expect(screen.getByText('Weapons')).toBeInTheDocument();
    });

    const listContainer = screen.getByRole('list');
    expect(listContainer).toHaveClass('max-h-96', 'overflow-y-auto');
  });

  it('maintains proper navigation structure', async () => {
    render(<EquipmentCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory={null} />);
    
    await waitFor(() => {
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('list')).toBeInTheDocument();
    });
  });

  it('fetches categories from correct endpoint', async () => {
    render(<EquipmentCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory={null} />);
    
    await waitFor(() => {
      expect(mockGetMetadata).toHaveBeenCalledWith('/mockdata/mockEquipmentCategories.json');
    });
  });

  it('handles multiple category selections', async () => {
    render(<EquipmentCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory={null} />);
    
    await waitFor(() => {
      expect(screen.getByText('Weapons')).toBeInTheDocument();
    });

    // Click first category
    fireEvent.click(screen.getByText('Weapons'));
    expect(mockOnSelectCategory).toHaveBeenCalledWith('weapons');

    // Clear mock and click second category
    mockOnSelectCategory.mockClear();
    fireEvent.click(screen.getByText('Ammunition'));
    expect(mockOnSelectCategory).toHaveBeenCalledWith('ammunition');
  });

  it('shows proper styling for unselected categories', async () => {
    render(<EquipmentCategoryNav onSelectCategory={mockOnSelectCategory} selectedCategory="weapons" />);
    
    await waitFor(() => {
      expect(screen.getByText('Ammunition')).toBeInTheDocument();
    });

    const ammunitionButton = screen.getByText('Ammunition');
    expect(ammunitionButton).not.toHaveClass('font-bold');
  });
});
