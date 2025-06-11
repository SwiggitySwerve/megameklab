// battletech-editor-app/__tests__/components/UnitCompendiumList.test.tsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import UnitCompendiumList from '../../components/compendium/UnitCompendiumList';
import { UnitFilterState } from '../../components/compendium/UnitFilters';

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('UnitCompendiumList', () => {
  const mockFilters: UnitFilterState = {
    searchTerm: '',
    weightClass: '',
    techBase: '',
    hasQuirk: '',
    startYear: '',
    endYear: ''
  };

  const mockApiResponse = {
    items: [
      {
        id: 1,
        chassis: 'Atlas',
        model: 'AS7-D',
        mass: 100,
        tech_base: 'Inner Sphere',
        era: 'Succession Wars',
        source: 'TRO:3025',
        type: 'meks',
        role: 'Assault',
        validation_status: 'valid'
      },
      {
        id: 2,
        chassis: 'Locust',
        model: 'LCT-1V',
        mass: 20,
        tech_base: 'Inner Sphere',
        era: 'Star League',
        source: 'TRO:3025',
        type: 'meks',
        role: 'Scout',
        validation_status: 'valid'
      }
    ],
    totalItems: 2,
    totalPages: 1,
    currentPage: 1
  };

  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<UnitCompendiumList filters={mockFilters} />);
    expect(screen.getByText('Loading units...')).toBeInTheDocument();
  });

  it('renders units after loading', async () => {
    render(<UnitCompendiumList filters={mockFilters} />);
    
    await waitFor(() => {
      expect(screen.getByText('Atlas')).toBeInTheDocument();
      expect(screen.getByText('Locust')).toBeInTheDocument();
      expect(screen.getByText('Units (2 found)')).toBeInTheDocument();
    });
  });

  it('passes selectedCategory as unit_type parameter to API', async () => {
    const selectedCategory = 'meks';
    render(<UnitCompendiumList filters={mockFilters} selectedCategory={selectedCategory} />);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('unit_type=meks')
      );
    });
  });

  it('includes unit_type parameter in API call when selectedCategory is provided', async () => {
    render(<UnitCompendiumList filters={mockFilters} selectedCategory="vehicles" />);
    
    await waitFor(() => {
      const callArgs = mockFetch.mock.calls[0][0] as string;
      expect(callArgs).toContain('unit_type=vehicles');
    });
  });

  it('does not include unit_type parameter when selectedCategory is null', async () => {
    render(<UnitCompendiumList filters={mockFilters} selectedCategory={null} />);
    
    await waitFor(() => {
      const callArgs = mockFetch.mock.calls[0][0] as string;
      expect(callArgs).not.toContain('unit_type=');
    });
  });

  it('refetches data when selectedCategory changes', async () => {
    const { rerender } = render(<UnitCompendiumList filters={mockFilters} selectedCategory="meks" />);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // Change category
    rerender(<UnitCompendiumList filters={mockFilters} selectedCategory="vehicles" />);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
      const secondCall = mockFetch.mock.calls[1][0] as string;
      expect(secondCall).toContain('unit_type=vehicles');
    });
  });

  it('combines filters and category in API call', async () => {
    const filtersWithData: UnitFilterState = {
      searchTerm: 'Atlas',
      weightClass: 'Assault',
      techBase: 'Inner Sphere',
      hasQuirk: '',
      startYear: '3025',
      endYear: '3067'
    };

    render(<UnitCompendiumList filters={filtersWithData} selectedCategory="meks" />);
    
    await waitFor(() => {
      const callArgs = mockFetch.mock.calls[0][0] as string;
      expect(callArgs).toContain('q=Atlas');
      expect(callArgs).toContain('weight_class=Assault');
      expect(callArgs).toContain('techBase=Inner+Sphere');
      expect(callArgs).toContain('startYear=3025');
      expect(callArgs).toContain('endYear=3067');
      expect(callArgs).toContain('unit_type=meks');
    });
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('API Error'));

    render(<UnitCompendiumList filters={mockFilters} selectedCategory="meks" />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading units')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('displays no results message when no units match criteria', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1
      }),
    } as Response);

    render(<UnitCompendiumList filters={mockFilters} selectedCategory="fighters" />);
    
    await waitFor(() => {
      expect(screen.getByText('No units found matching your criteria.')).toBeInTheDocument();
    });
  });

  it('handles category clearing by removing category parameter', async () => {
    const { rerender } = render(<UnitCompendiumList filters={mockFilters} selectedCategory="meks" />);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const firstCall = mockFetch.mock.calls[0][0] as string;
      expect(firstCall).toContain('unit_type=meks');
    });

    // Clear category
    rerender(<UnitCompendiumList filters={mockFilters} selectedCategory={null} />);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
      const secondCall = mockFetch.mock.calls[1][0] as string;
      expect(secondCall).not.toContain('unit_type=');
    });
  });

  it('preserves all other filters when category changes', async () => {
    const filtersWithData: UnitFilterState = {
      searchTerm: 'Test',
      weightClass: 'Heavy',
      techBase: 'Clan',
      hasQuirk: 'Accurate',
      startYear: '3050',
      endYear: '3067'
    };

    const { rerender } = render(<UnitCompendiumList filters={filtersWithData} selectedCategory="meks" />);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // Change only the category
    rerender(<UnitCompendiumList filters={filtersWithData} selectedCategory="vehicles" />);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
      const secondCall = mockFetch.mock.calls[1][0] as string;
      
      // Verify all filters are still present
      expect(secondCall).toContain('q=Test');
      expect(secondCall).toContain('weight_class=Heavy');
      expect(secondCall).toContain('techBase=Clan');
      expect(secondCall).toContain('has_quirk=Accurate');
      expect(secondCall).toContain('startYear=3050');
      expect(secondCall).toContain('endYear=3067');
      
      // And category changed
      expect(secondCall).toContain('unit_type=vehicles');
      expect(secondCall).not.toContain('unit_type=meks');
    });
  });

  it('navigates to unit detail page when clicking on a unit row', async () => {
    render(<UnitCompendiumList filters={mockFilters} />);
    
    await waitFor(() => {
      expect(screen.getByText('Atlas')).toBeInTheDocument();
    });

    // Click on the Atlas row
    const atlasRow = screen.getByText('Atlas').closest('tr');
    expect(atlasRow).toBeInTheDocument();
    
    fireEvent.click(atlasRow!);
    
    expect(mockPush).toHaveBeenCalledWith('/units/1');
  });

  it('navigates to correct unit detail page for different units', async () => {
    render(<UnitCompendiumList filters={mockFilters} />);
    
    await waitFor(() => {
      expect(screen.getByText('Locust')).toBeInTheDocument();
    });

    // Click on the Locust row
    const locustRow = screen.getByText('Locust').closest('tr');
    expect(locustRow).toBeInTheDocument();
    
    fireEvent.click(locustRow!);
    
    expect(mockPush).toHaveBeenCalledWith('/units/2');
  });
});
