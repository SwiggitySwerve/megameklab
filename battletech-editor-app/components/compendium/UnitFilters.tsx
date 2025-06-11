// battletech-editor-app/components/compendium/UnitFilters.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { getMetadata } from '../../services/mockApiService';

export interface UnitFilterState {
  searchTerm: string;
  weightClass: string;
  techBase: string;
  hasQuirk?: string;
  startYear?: string;
  endYear?: string;
}

interface UnitFiltersProps {
  onFiltersApply: (filters: UnitFilterState) => void;
}

const UnitFilters: React.FC<UnitFiltersProps> = ({ onFiltersApply }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [weightClass, setWeightClass] = useState('');
  const [techBase, setTechBase] = useState('');
  const [hasQuirk, setHasQuirk] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');

  const [weightClasses, setWeightClasses] = useState<string[]>([]);
  const [techBases, setTechBases] = useState<string[]>([]);
  const [quirks, setQuirks] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [wcData, tbData, quirkData] = await Promise.all([
          getMetadata('/mockdata/mockUnitWeightClasses.json'),
          getMetadata('/mockdata/mockUnitTechBases.json'),
          getMetadata('/mockdata/mockUnitQuirks.json'),
        ]);

        setWeightClasses(wcData);
        setTechBases(tbData);
        setQuirks(quirkData);
        setError(null);
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'An unknown error occurred';
        setError(errorMsg);
        console.error("Failed to fetch filter data:", errorMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Function to get era name from year
  const getEraFromYear = (year: string): string => {
    if (year.length !== 4) return '';
    
    const yearNum = parseInt(year);
    if (yearNum >= 2005 && yearNum <= 2570) return 'Age of War';
    if (yearNum >= 2571 && yearNum <= 2780) return 'Star League';
    if (yearNum >= 2781 && yearNum <= 3049) return 'Succession Wars';
    if (yearNum >= 3050 && yearNum <= 3067) return 'Clan Invasion';
    if (yearNum >= 3068 && yearNum <= 3080) return 'Civil War';
    if (yearNum >= 3081 && yearNum <= 3151) return 'Dark Age';
    if (yearNum >= 3152 && yearNum <= 3200) return 'ilClan';
    return '';
  };

  // Calculate min/max values for year validation
  const getStartYearConstraints = () => {
    const min = 2005;
    const max = endYear.length === 4 ? Math.min(parseInt(endYear), 3200) : 3200;
    return { min, max };
  };

  const getEndYearConstraints = () => {
    const min = startYear.length === 4 ? Math.max(parseInt(startYear), 2005) : 2005;
    const max = 3200;
    return { min, max };
  };

  // Handlers with validation
  const handleStartYearChange = (value: string) => {
    if (value === '' || (value.length <= 4 && !isNaN(parseInt(value)))) {
      setStartYear(value);
    }
  };

  const handleEndYearChange = (value: string) => {
    if (value === '' || (value.length <= 4 && !isNaN(parseInt(value)))) {
      setEndYear(value);
    }
  };

  // Auto-apply filters with debouncing
  useEffect(() => {
    const yearFieldsValid = (startYear.length === 0 || startYear.length === 4) && 
                           (endYear.length === 0 || endYear.length === 4);
    
    if (!yearFieldsValid) return;

    const delay = searchTerm.length > 0 && searchTerm.length < 3 ? 0 : 500;
    
    const timeout = setTimeout(() => {
      onFiltersApply({ searchTerm, weightClass, techBase, hasQuirk, startYear, endYear });
      console.log('Auto-applying filters:', { searchTerm, weightClass, techBase, hasQuirk, startYear, endYear });
    }, delay);

    return () => {
      clearTimeout(timeout);
    };
  }, [searchTerm, weightClass, techBase, hasQuirk, startYear, endYear]);

  const handleApply = () => {
    onFiltersApply({ searchTerm, weightClass, techBase, hasQuirk, startYear, endYear });
    console.log('Manually applying filters:', { searchTerm, weightClass, techBase, hasQuirk, startYear, endYear });
  };

  const handleClear = () => {
    setSearchTerm('');
    setWeightClass('');
    setTechBase('');
    setHasQuirk('');
    setStartYear('');
    setEndYear('');
    onFiltersApply({ searchTerm: '', weightClass: '', techBase: '', hasQuirk: '', startYear: '', endYear: '' });
    console.log('Cleared Unit Filters');
  };

  if (loading) return <p>Loading filters...</p>;
  if (error) return <p className="text-red-500">Error loading filters: {error}</p>;

  return (
    <div className="navy-section mb-4">
      {/* Search field on its own row */}
      <div className="mb-4">
        <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">Search Name/Model</label>
        <input
          type="text"
          id="searchTerm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          placeholder="Enter chassis or model"
        />
      </div>

      {/* Date range with era display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="startYear" className="block text-sm font-medium text-gray-700 mb-1">
            Start Year
            {getEraFromYear(startYear) && (
              <span className="ml-2 text-xs text-blue-600 font-medium">({getEraFromYear(startYear)})</span>
            )}
          </label>
          <input
            type="number"
            id="startYear"
            value={startYear}
            onChange={(e) => handleStartYearChange(e.target.value)}
            className="block w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="e.g., 3025"
            min={getStartYearConstraints().min}
            max={getStartYearConstraints().max}
          />
        </div>
        <div>
          <label htmlFor="endYear" className="block text-sm font-medium text-gray-700 mb-1">
            End Year
            {getEraFromYear(endYear) && (
              <span className="ml-2 text-xs text-blue-600 font-medium">({getEraFromYear(endYear)})</span>
            )}
          </label>
          <input
            type="number"
            id="endYear"
            value={endYear}
            onChange={(e) => handleEndYearChange(e.target.value)}
            className="block w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="e.g., 3067"
            min={getEndYearConstraints().min}
            max={getEndYearConstraints().max}
          />
        </div>
      </div>

      {/* Other filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="weightClass" className="block text-sm font-medium text-gray-700 mb-1">Weight Class</label>
          <select
            id="weightClass"
            value={weightClass}
            onChange={(e) => {
              console.log('Weight Class changed to:', e.target.value);
              setWeightClass(e.target.value);
            }}
            className="block w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All</option>
            {weightClasses.map(wc => <option key={wc} value={wc}>{wc}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="techBase" className="block text-sm font-medium text-gray-700 mb-1">Tech Base</label>
          <select
            id="techBase"
            value={techBase}
            onChange={(e) => {
              console.log('Tech Base changed to:', e.target.value);
              setTechBase(e.target.value);
            }}
            className="block w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All</option>
            {techBases.map(tb => <option key={tb} value={tb}>{tb}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="hasQuirk" className="block text-sm font-medium text-gray-700 mb-1">Has Quirk</label>
          <select
            id="hasQuirk"
            value={hasQuirk}
            onChange={(e) => {
              console.log('Has Quirk changed to:', e.target.value);
              setHasQuirk(e.target.value);
            }}
            className="block w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All</option>
            {quirks.map(quirk => <option key={quirk} value={quirk}>{quirk}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-4 flex justify-center gap-4">
        <button
          onClick={handleApply}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Apply Filters
        </button>
        <button
          onClick={handleClear}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
};

export default UnitFilters;
