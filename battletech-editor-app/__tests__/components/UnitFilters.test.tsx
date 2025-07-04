// battletech-editor-app/__tests__/components/UnitFilters.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import UnitFilters from '../../components/compendium/UnitFilters';
import * as mockApiService from '../../services/mockApiService';

// Mock the mockApiService
jest.mock('../../services/mockApiService');
const mockGetMetadata = mockApiService.getMetadata as jest.MockedFunction<typeof mockApiService.getMetadata>;

// Mock timers for debouncing tests
jest.useFakeTimers();

describe('UnitFilters', () => {
  const mockOnFiltersApply = jest.fn();
  const mockWeightClasses = ['Light', 'Medium', 'Heavy', 'Assault'];
  const mockQuirks = ['Accurate', 'Battle Frenzy', 'Command Mech'];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMetadata.mockImplementation((endpoint) => {
      if (endpoint.includes('WeightClasses')) {
        return Promise.resolve(mockWeightClasses);
      }
      if (endpoint.includes('Quirks')) {
        return Promise.resolve(mockQuirks);
      }
      return Promise.resolve([]);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('renders loading state initially', () => {
    render(<UnitFilters onFiltersApply={mockOnFiltersApply} />);
    expect(screen.getByText('Loading filters...')).toBeInTheDocument();
  });

  it('renders all filter controls after loading', async () => {
    await act(async () => {
      render(<UnitFilters onFiltersApply={mockOnFiltersApply} />);
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Search Name/Model')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Year')).toBeInTheDocument();
      expect(screen.getByLabelText('End Year')).toBeInTheDocument();
      expect(screen.getByLabelText('Weight Class')).toBeInTheDocument();
      expect(screen.getByLabelText('Tech Base')).toBeInTheDocument();
      expect(screen.getByLabelText('Role')).toBeInTheDocument();
      expect(screen.getByLabelText('Configuration')).toBeInTheDocument();
      expect(screen.getByLabelText('OmniMech')).toBeInTheDocument();
      expect(screen.getByLabelText('Has Quirk')).toBeInTheDocument();
    });
  });

  it('populates weight class and quirk options from API', async () => {
    await act(async () => {
      render(<UnitFilters onFiltersApply={mockOnFiltersApply} />);
    });
    
    await waitFor(() => {
      const weightClassSelect = screen.getByLabelText('Weight Class');
      expect(weightClassSelect).toBeInTheDocument();
    });

    const weightClassSelect = screen.getByLabelText('Weight Class') as HTMLSelectElement;
    expect(weightClassSelect.options).toHaveLength(5); // Default option + 4 weight classes
    expect(weightClassSelect.options[0].text).toBe('Select Weight Class');
    expect(weightClassSelect.options[1].text).toBe('Light');
    expect(weightClassSelect.options[4].text).toBe('Assault');
  });

  it('shows "Select" placeholders instead of "All" options', async () => {
    await act(async () => {
      render(<UnitFilters onFiltersApply={mockOnFiltersApply} />);
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Weight Class')).toBeInTheDocument();
    });

    const weightClassSelect = screen.getByLabelText('Weight Class');
    const techBaseSelect = screen.getByLabelText('Tech Base');
    const roleSelect = screen.getByLabelText('Role');

    expect((weightClassSelect as HTMLSelectElement).options[0].text).toBe('Select Weight Class');
    expect((techBaseSelect as HTMLSelectElement).options[0].text).toBe('Select Tech Base');
    expect((roleSelect as HTMLSelectElement).options[0].text).toBe('Select Role');
  });

  it('handles search term input with debouncing', async () => {
    await act(async () => {
      render(<UnitFilters onFiltersApply={mockOnFiltersApply} />);
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Search Name/Model')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search Name/Model');
    
    // Type in search box
    fireEvent.change(searchInput, { target: { value: 'Atlas' } });
    
    // Should not call immediately
    expect(mockOnFiltersApply).not.toHaveBeenCalled();
    
    // Advance timers
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    // Should call now
    await waitFor(() => {
      expect(mockOnFiltersApply).toHaveBeenCalledWith(
        expect.objectContaining({ searchTerm: 'Atlas' })
      );
    });
  });

  it('validates year input and shows era information', async () => {
    await act(async () => {
      render(<UnitFilters onFiltersApply={mockOnFiltersApply} />);
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Start Year')).toBeInTheDocument();
    });

    const startYearInput = screen.getByLabelText('Start Year');
    
    // Enter a valid year
    fireEvent.change(startYearInput, { target: { value: '3025' } });
    
    await waitFor(() => {
      expect(screen.getByText('(Succession Wars)')).toBeInTheDocument();
    });
  });

  it('prevents invalid year input', async () => {
    await act(async () => {
      render(<UnitFilters onFiltersApply={mockOnFiltersApply} />);
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Start Year')).toBeInTheDocument();
    });

    const startYearInput = screen.getByLabelText('Start Year') as HTMLInputElement;
    
    // Try to enter invalid characters
    fireEvent.change(startYearInput, { target: { value: 'abc' } });
    
    // Should remain empty
    expect(startYearInput.value).toBe('');
    
    // Try to enter too many digits
    fireEvent.change(startYearInput, { target: { value: '12345' } });
    
    // Should be truncated or remain previous value
    expect(startYearInput.value.length).toBeLessThanOrEqual(4);
  });

  it('handles weight class selection', async () => {
    await act(async () => {
      render(<UnitFilters onFiltersApply={mockOnFiltersApply} />);
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Weight Class')).toBeInTheDocument();
    });

    const weightClassSelect = screen.getByLabelText('Weight Class');
    
    // Select Heavy
    fireEvent.change(weightClassSelect, { target: { value: 'Heavy' } });
    
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    await waitFor(() => {
      expect(mockOnFiltersApply).toHaveBeenCalledWith(
        expect.objectContaining({ weightClass: 'Heavy' })
      );
    });
  });

  it('handles tech base selection', async () => {
    await act(async () => {
      render(<UnitFilters onFiltersApply={mockOnFiltersApply} />);
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Tech Base')).toBeInTheDocument();
    });

    const techBaseSelect = screen.getByLabelText('Tech Base');
    
    // Select Clan
    fireEvent.change(techBaseSelect, { target: { value: 'Clan' } });
    
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    await waitFor(() => {
      expect(mockOnFiltersApply).toHaveBeenCalledWith(
        expect.objectContaining({ techBase: 'Clan' })
      );
    });
  });

  it('handles role selection', async () => {
    await act(async () => {
      render(<UnitFilters onFiltersApply={mockOnFiltersApply} />);
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Role')).toBeInTheDocument();
    });

    const roleSelect = screen.getByLabelText('Role');
    
    // Select Brawler
    fireEvent.change(roleSelect, { target: { value: 'Brawler' } });
    
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    await waitFor(() => {
      expect(mockOnFiltersApply).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'Brawler' })
      );
    });
  });

  it('handles OmniMech filter selection', async () => {
    await act(async () => {
      render(<UnitFilters onFiltersApply={mockOnFiltersApply} />);
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText('OmniMech')).toBeInTheDocument();
    });

    const omniMechSelect = screen.getByLabelText('OmniMech');
    
    // Select OmniMech Only
    fireEvent.change(omniMechSelect, { target: { value: 'true' } });
    
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    await waitFor(() => {
      expect(mockOnFiltersApply).toHaveBeenCalledWith(
        expect.objectContaining({ isOmnimech: true })
      );
    });
  });

  it('handles manual apply button', async () => {
    await act(async () => {
      render(<UnitFilters onFiltersApply={mockOnFiltersApply} />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Apply Filters')).toBeInTheDocument();
    });

    // Set some filters
    const searchInput = screen.getByLabelText('Search Name/Model');
    fireEvent.change(searchInput, { target: { value: 'Warhammer' } });
    
    // Click apply button
    fireEvent.click(screen.getByText('Apply Filters'));
    
    expect(mockOnFiltersApply).toHaveBeenCalledWith(
      expect.objectContaining({ searchTerm: 'Warhammer' })
    );
  });

  it('handles clear all filters button', async () => {
    await act(async () => {
      render(<UnitFilters onFiltersApply={mockOnFiltersApply} />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
    });

    // Set some filters first
    const searchInput = screen.getByLabelText('Search Name/Model');
    fireEvent.change(searchInput, { target: { value: 'Atlas' } });
    
    const weightClassSelect = screen.getByLabelText('Weight Class');
    fireEvent.change(weightClassSelect, { target: { value: 'Assault' } });
    
    // Click clear button
    fireEvent.click(screen.getByText('Clear All Filters'));
    
    // Should call with empty filters
    expect(mockOnFiltersApply).toHaveBeenCalledWith({
      searchTerm: '',
      weightClass: '',
      techBase: '',
      hasQuirk: '',
      startYear: '',
      endYear: '',
      isOmnimech: undefined,
      config: '',
      role: ''
    });
    
    // Input fields should be cleared
    expect((searchInput as HTMLInputElement).value).toBe('');
    expect((weightClassSelect as HTMLSelectElement).value).toBe('');
  });

  it('handles year range constraints', async () => {
    await act(async () => {
      render(<UnitFilters onFiltersApply={mockOnFiltersApply} />);
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Start Year')).toBeInTheDocument();
    });

    const startYearInput = screen.getByLabelText('Start Year') as HTMLInputElement;
    const endYearInput = screen.getByLabelText('End Year') as HTMLInputElement;
    
    // Set end year first
    fireEvent.change(endYearInput, { target: { value: '3050' } });
    
    // Start year should be constrained by end year
    expect(startYearInput.getAttribute('max')).toBe('3050');
    
    // Set start year
    fireEvent.change(startYearInput, { target: { value: '3025' } });
    
    // End year should be constrained by start year
    expect(endYearInput.getAttribute('min')).toBe('3025');
  });

  it('displays different eras correctly', async () => {
    await act(async () => {
      render(<UnitFilters onFiltersApply={mockOnFiltersApply} />);
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Start Year')).toBeInTheDocument();
    });

    const startYearInput = screen.getByLabelText('Start Year');
    
    // Test different eras
    fireEvent.change(startYearInput, { target: { value: '2750' } });
    await waitFor(() => {
      expect(screen.getByText('(Star League)')).toBeInTheDocument();
    });
    
    fireEvent.change(startYearInput, { target: { value: '3055' } });
    await waitFor(() => {
      expect(screen.getByText('(Clan Invasion)')).toBeInTheDocument();
    });
    
    fireEvent.change(startYearInput, { target: { value: '3100' } });
    await waitFor(() => {
      expect(screen.getByText('(Dark Age)')).toBeInTheDocument();
    });
  });

  it('handles error states', async () => {
    const errorMessage = 'Failed to fetch filter data';
    mockGetMetadata.mockRejectedValue(new Error(errorMessage));

    await act(async () => {
      render(<UnitFilters onFiltersApply={mockOnFiltersApply} />);
    });
    
    await waitFor(() => {
      expect(screen.getByText(`Error loading filters: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('fetches data from correct endpoints', async () => {
    await act(async () => {
      render(<UnitFilters onFiltersApply={mockOnFiltersApply} />);
    });
    
    await waitFor(() => {
      expect(mockGetMetadata).toHaveBeenCalledWith('/mockdata/mockUnitWeightClasses.json');
      expect(mockGetMetadata).toHaveBeenCalledWith('/mockdata/mockUnitQuirks.json');
    });
  });

  it('skips auto-apply when year fields are invalid', async () => {
    await act(async () => {
      render(<UnitFilters onFiltersApply={mockOnFiltersApply} />);
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Start Year')).toBeInTheDocument();
    });

    const startYearInput = screen.getByLabelText('Start Year');
    
    // Enter incomplete year
    fireEvent.change(startYearInput, { target: { value: '305' } });
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Should not call filters apply with invalid year
    expect(mockOnFiltersApply).not.toHaveBeenCalled();
  });

  it('includes all filter types in constants', async () => {
    await act(async () => {
      render(<UnitFilters onFiltersApply={mockOnFiltersApply} />);
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Tech Base')).toBeInTheDocument();
    });

    const techBaseSelect = screen.getByLabelText('Tech Base') as HTMLSelectElement;
    const roleSelect = screen.getByLabelText('Role') as HTMLSelectElement;
    const configSelect = screen.getByLabelText('Configuration') as HTMLSelectElement;
    
    // Check that predefined options are available
    expect(Array.from(techBaseSelect.options).some(opt => opt.text === 'Inner Sphere')).toBe(true);
    expect(Array.from(techBaseSelect.options).some(opt => opt.text === 'Clan')).toBe(true);
    
    expect(Array.from(roleSelect.options).some(opt => opt.text === 'Brawler')).toBe(true);
    expect(Array.from(roleSelect.options).some(opt => opt.text === 'Sniper')).toBe(true);
    
    expect(Array.from(configSelect.options).some(opt => opt.text === 'Biped')).toBe(true);
    expect(Array.from(configSelect.options).some(opt => opt.text === 'Quad')).toBe(true);
  });

  it('logs filter changes for debugging', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    await act(async () => {
      render(<UnitFilters onFiltersApply={mockOnFiltersApply} />);
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Weight Class')).toBeInTheDocument();
    });

    const weightClassSelect = screen.getByLabelText('Weight Class');
    fireEvent.change(weightClassSelect, { target: { value: 'Heavy' } });
    
    expect(consoleSpy).toHaveBeenCalledWith('Weight Class changed to:', 'Heavy');
    
    consoleSpy.mockRestore();
  });
});
