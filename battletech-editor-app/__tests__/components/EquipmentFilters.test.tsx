// battletech-editor-app/__tests__/components/EquipmentFilters.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EquipmentFilters from '../../components/compendium/EquipmentFilters';
import * as mockApiService from '../../services/mockApiService';

// Mock the mockApiService
jest.mock('../../services/mockApiService');
const mockGetMetadata = mockApiService.getMetadata as jest.MockedFunction<typeof mockApiService.getMetadata>;

describe('EquipmentFilters', () => {
  const mockOnFiltersApply = jest.fn();
  const mockTechBases = ['Inner Sphere', 'Clan', 'Mixed'];
  const mockEras = ['Age of War', 'Star League', 'Succession Wars', 'Clan Invasion', 'Civil War', 'Dark Age'];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMetadata.mockImplementation((endpoint) => {
      if (endpoint.includes('TechBases')) {
        return Promise.resolve(mockTechBases);
      }
      if (endpoint.includes('Eras')) {
        return Promise.resolve(mockEras);
      }
      return Promise.resolve([]);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<EquipmentFilters onFiltersApply={mockOnFiltersApply} />);
    expect(screen.getByText('Loading filters...')).toBeInTheDocument();
  });

  it('renders all filter controls after loading', async () => {
    render(<EquipmentFilters onFiltersApply={mockOnFiltersApply} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Search Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Tech Base')).toBeInTheDocument();
      expect(screen.getByLabelText('Era/Year')).toBeInTheDocument();
    });
  });

  it('populates tech base options from API', async () => {
    render(<EquipmentFilters onFiltersApply={mockOnFiltersApply} />);
    
    await waitFor(() => {
      const techBaseSelect = screen.getByLabelText('Tech Base');
      expect(techBaseSelect).toBeInTheDocument();
    });

    const techBaseSelect = screen.getByLabelText('Tech Base') as HTMLSelectElement;
    expect(techBaseSelect.options).toHaveLength(4); // Default option + 3 tech bases
    expect(techBaseSelect.options[0].text).toBe('Select Tech Base');
    expect(techBaseSelect.options[1].text).toBe('Inner Sphere');
    expect(techBaseSelect.options[2].text).toBe('Clan');
    expect(techBaseSelect.options[3].text).toBe('Mixed');
  });

  it('populates era options from API', async () => {
    render(<EquipmentFilters onFiltersApply={mockOnFiltersApply} />);
    
    await waitFor(() => {
      const eraSelect = screen.getByLabelText('Era/Year');
      expect(eraSelect).toBeInTheDocument();
    });

    const eraSelect = screen.getByLabelText('Era/Year') as HTMLSelectElement;
    expect(eraSelect.options).toHaveLength(7); // Default option + 6 eras
    expect(eraSelect.options[0].text).toBe('All');
    expect(eraSelect.options[1].text).toBe('Age of War');
    expect(eraSelect.options[6].text).toBe('Dark Age');
  });

  it('shows "Select Tech Base" instead of "All" for tech base', async () => {
    render(<EquipmentFilters onFiltersApply={mockOnFiltersApply} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Tech Base')).toBeInTheDocument();
    });

    const techBaseSelect = screen.getByLabelText('Tech Base') as HTMLSelectElement;
    expect(techBaseSelect.options[0].text).toBe('Select Tech Base');
  });

  it('handles search term input', async () => {
    render(<EquipmentFilters onFiltersApply={mockOnFiltersApply} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Search Name')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search Name');
    fireEvent.change(searchInput, { target: { value: 'AC/20' } });
    
    expect((searchInput as HTMLInputElement).value).toBe('AC/20');
  });

  it('handles tech base selection', async () => {
    render(<EquipmentFilters onFiltersApply={mockOnFiltersApply} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Tech Base')).toBeInTheDocument();
    });

    const techBaseSelect = screen.getByLabelText('Tech Base');
    fireEvent.change(techBaseSelect, { target: { value: 'Clan' } });
    
    expect((techBaseSelect as HTMLSelectElement).value).toBe('Clan');
  });

  it('handles era selection', async () => {
    render(<EquipmentFilters onFiltersApply={mockOnFiltersApply} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Era/Year')).toBeInTheDocument();
    });

    const eraSelect = screen.getByLabelText('Era/Year');
    fireEvent.change(eraSelect, { target: { value: 'Clan Invasion' } });
    
    expect((eraSelect as HTMLSelectElement).value).toBe('Clan Invasion');
  });

  it('handles apply filters button', async () => {
    render(<EquipmentFilters onFiltersApply={mockOnFiltersApply} />);
    
    await waitFor(() => {
      expect(screen.getByText('Apply Filters')).toBeInTheDocument();
    });

    // Set some filter values
    const searchInput = screen.getByLabelText('Search Name');
    const techBaseSelect = screen.getByLabelText('Tech Base');
    const eraSelect = screen.getByLabelText('Era/Year');

    fireEvent.change(searchInput, { target: { value: 'PPC' } });
    fireEvent.change(techBaseSelect, { target: { value: 'Inner Sphere' } });
    fireEvent.change(eraSelect, { target: { value: 'Star League' } });

    // Click apply button
    fireEvent.click(screen.getByText('Apply Filters'));

    expect(mockOnFiltersApply).toHaveBeenCalledWith({
      searchTerm: 'PPC',
      techBase: 'Inner Sphere',
      era: 'Star League'
    });
  });

  it('handles clear filters button', async () => {
    render(<EquipmentFilters onFiltersApply={mockOnFiltersApply} />);
    
    await waitFor(() => {
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });

    // Set some filter values first
    const searchInput = screen.getByLabelText('Search Name');
    const techBaseSelect = screen.getByLabelText('Tech Base');
    const eraSelect = screen.getByLabelText('Era/Year');

    fireEvent.change(searchInput, { target: { value: 'Laser' } });
    fireEvent.change(techBaseSelect, { target: { value: 'Clan' } });
    fireEvent.change(eraSelect, { target: { value: 'Dark Age' } });

    // Click clear button
    fireEvent.click(screen.getByText('Clear Filters'));

    // Should call with empty filters
    expect(mockOnFiltersApply).toHaveBeenCalledWith({
      searchTerm: '',
      techBase: '',
      era: ''
    });

    // Input fields should be cleared
    expect((searchInput as HTMLInputElement).value).toBe('');
    expect((techBaseSelect as HTMLSelectElement).value).toBe('');
    expect((eraSelect as HTMLSelectElement).value).toBe('');
  });

  it('handles error state for tech bases', async () => {
    const errorMessage = 'Failed to fetch tech bases';
    mockGetMetadata.mockImplementation((endpoint) => {
      if (endpoint.includes('TechBases')) {
        return Promise.reject(new Error(errorMessage));
      }
      if (endpoint.includes('Eras')) {
        return Promise.resolve(mockEras);
      }
      return Promise.resolve([]);
    });

    render(<EquipmentFilters onFiltersApply={mockOnFiltersApply} />);
    
    await waitFor(() => {
      expect(screen.getByText(`Error loading filters: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('handles error state for eras', async () => {
    const errorMessage = 'Failed to fetch eras';
    mockGetMetadata.mockImplementation((endpoint) => {
      if (endpoint.includes('TechBases')) {
        return Promise.resolve(mockTechBases);
      }
      if (endpoint.includes('Eras')) {
        return Promise.reject(new Error(errorMessage));
      }
      return Promise.resolve([]);
    });

    render(<EquipmentFilters onFiltersApply={mockOnFiltersApply} />);
    
    await waitFor(() => {
      expect(screen.getByText(`Error loading filters: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('handles non-Error exceptions', async () => {
    mockGetMetadata.mockRejectedValue('String error');

    render(<EquipmentFilters onFiltersApply={mockOnFiltersApply} />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading filters: An unknown error occurred')).toBeInTheDocument();
    });
  });

  it('fetches data from correct endpoints', async () => {
    render(<EquipmentFilters onFiltersApply={mockOnFiltersApply} />);
    
    await waitFor(() => {
      expect(mockGetMetadata).toHaveBeenCalledWith('/mockdata/mockEquipmentTechBases.json');
      expect(mockGetMetadata).toHaveBeenCalledWith('/mockdata/mockEquipmentEras.json');
    });
  });

  it('uses responsive grid layout', async () => {
    render(<EquipmentFilters onFiltersApply={mockOnFiltersApply} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Search Name')).toBeInTheDocument();
    });

    const gridContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');
    expect(gridContainer).toBeInTheDocument();
  });

  it('maintains proper form structure', async () => {
    render(<EquipmentFilters onFiltersApply={mockOnFiltersApply} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Search Name')).toBeInTheDocument();
    });

    // Check that all form controls have proper labels
    const searchInput = screen.getByLabelText('Search Name');
    const techBaseSelect = screen.getByLabelText('Tech Base');
    const eraSelect = screen.getByLabelText('Era/Year');

    expect(searchInput).toHaveAttribute('id', 'eqSearchTerm');
    expect(techBaseSelect).toHaveAttribute('id', 'eqTechBase');
    expect(eraSelect).toHaveAttribute('id', 'eqEra');
  });

  it('applies proper styling to form elements', async () => {
    render(<EquipmentFilters onFiltersApply={mockOnFiltersApply} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Search Name')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search Name');
    const techBaseSelect = screen.getByLabelText('Tech Base');
    const eraSelect = screen.getByLabelText('Era/Year');

    // Check that form elements have proper styling classes
    expect(searchInput).toHaveClass('block', 'w-full', 'bg-white', 'border', 'border-gray-300');
    expect(techBaseSelect).toHaveClass('block', 'w-full', 'bg-white', 'border', 'border-gray-300');
    expect(eraSelect).toHaveClass('block', 'w-full', 'bg-white', 'border', 'border-gray-300');
  });

  it('logs filter application for debugging', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(<EquipmentFilters onFiltersApply={mockOnFiltersApply} />);
    
    await waitFor(() => {
      expect(screen.getByText('Apply Filters')).toBeInTheDocument();
    });

    // Set some values and apply
    const searchInput = screen.getByLabelText('Search Name');
    fireEvent.change(searchInput, { target: { value: 'Gauss' } });
    fireEvent.click(screen.getByText('Apply Filters'));
    
    expect(consoleSpy).toHaveBeenCalledWith('Applying Equipment Filters:', {
      searchTerm: 'Gauss',
      techBase: '',
      era: ''
    });
    
    consoleSpy.mockRestore();
  });

  it('logs filter clearing for debugging', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(<EquipmentFilters onFiltersApply={mockOnFiltersApply} />);
    
    await waitFor(() => {
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Clear Filters'));
    
    expect(consoleSpy).toHaveBeenCalledWith('Cleared Equipment Filters');
    
    consoleSpy.mockRestore();
  });

  it('handles multiple filter combinations', async () => {
    render(<EquipmentFilters onFiltersApply={mockOnFiltersApply} />);
    
    await waitFor(() => {
      expect(screen.getByText('Apply Filters')).toBeInTheDocument();
    });

    // Test different combinations
    const searchInput = screen.getByLabelText('Search Name');
    const techBaseSelect = screen.getByLabelText('Tech Base');
    const eraSelect = screen.getByLabelText('Era/Year');

    // Test 1: Only search term
    fireEvent.change(searchInput, { target: { value: 'Missile' } });
    fireEvent.click(screen.getByText('Apply Filters'));
    
    expect(mockOnFiltersApply).toHaveBeenCalledWith({
      searchTerm: 'Missile',
      techBase: '',
      era: ''
    });

    // Test 2: Search term + tech base
    fireEvent.change(techBaseSelect, { target: { value: 'Clan' } });
    fireEvent.click(screen.getByText('Apply Filters'));
    
    expect(mockOnFiltersApply).toHaveBeenCalledWith({
      searchTerm: 'Missile',
      techBase: 'Clan',
      era: ''
    });

    // Test 3: All filters
    fireEvent.change(eraSelect, { target: { value: 'Clan Invasion' } });
    fireEvent.click(screen.getByText('Apply Filters'));
    
    expect(mockOnFiltersApply).toHaveBeenCalledWith({
      searchTerm: 'Missile',
      techBase: 'Clan',
      era: 'Clan Invasion'
    });
  });

  it('maintains button styling and layout', async () => {
    render(<EquipmentFilters onFiltersApply={mockOnFiltersApply} />);
    
    await waitFor(() => {
      expect(screen.getByText('Apply Filters')).toBeInTheDocument();
    });

    const applyButton = screen.getByText('Apply Filters');
    const clearButton = screen.getByText('Clear Filters');

    // Check button styling
    expect(applyButton).toHaveClass('bg-blue-500', 'hover:bg-blue-700', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded');
    expect(clearButton).toHaveClass('bg-gray-500', 'hover:bg-gray-700', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded');

    // Check button container layout
    const buttonContainer = applyButton.parentElement;
    expect(buttonContainer).toHaveClass('mt-4', 'flex', 'space-x-2');
  });
});
