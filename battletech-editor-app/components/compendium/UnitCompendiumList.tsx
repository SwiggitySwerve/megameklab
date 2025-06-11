// battletech-editor-app/components/compendium/UnitCompendiumList.tsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { UnitFilterState } from './UnitFilters';

// Define the structure of the API response for a list of items
export interface ApiListResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

// Interface for the unit data coming from the API
interface UnitFromApi {
  id: string; // Assuming id is a string, adjust if it's a number from API
  chassis: string;
  model: string;
  mass: number; // API provides 'mass' (after 'mass_tons AS mass' change)
  tech_base: string;
  era: string;
  type: string; // API provides 'type'
  // Add other fields if needed from the API response, e.g. source, rules_level
  // data: any; // If the 'data' blob is used directly
}

interface UnitCompendiumListProps {
  filters: UnitFilterState;
  selectedCategory: string | null;
}

const UnitCompendiumList: React.FC<UnitCompendiumListProps> = ({ filters, selectedCategory }) => {
  const [unitData, setUnitData] = useState<ApiListResponse<UnitFromApi> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // This could be made a prop or part of a settings context later

  // Function to convert unit type abbreviations to proper names
  const getUnitTypeName = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      'meks': 'BattleMech',
      'vehicles': 'Vehicle',
      'infantry': 'Infantry',
      'battlearmor': 'Battle Armor',
      'ge': 'Gun Emplacement',
      'fighters': 'Aerospace Fighter',
      'dropships': 'DropShip',
      'warship': 'WarShip',
      'protomeks': 'ProtoMech',
      'convfighter': 'Conventional Fighter',
      'smallcraft': 'Small Craft',
      'spacestation': 'Space Station',
      'jumpships': 'JumpShip',
      'handheld': 'Handheld Weapon'
    };
    return typeMap[type] || type;
  };

  // Function to format mass display
  const formatMass = (mass: number | null | undefined): string => {
    if (mass === null || mass === undefined || mass === 0) {
      return '';
    }
    return `${mass} tons`;
  };

  useEffect(() => {
    const fetchUnits = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('page', currentPage.toString());
        params.append('limit', itemsPerPage.toString());
        if (filters.searchTerm) {
          params.append('q', filters.searchTerm);
        }
        if (filters.weightClass) {
          params.append('weight_class', filters.weightClass);
        }
        if (filters.techBase) {
          params.append('techBase', filters.techBase);
        }
        if (filters.startYear) {
          params.append('startYear', filters.startYear);
        }
        if (filters.endYear) {
          params.append('endYear', filters.endYear);
        }
        if (filters.hasQuirk) {
          params.append('has_quirk', filters.hasQuirk);
        }
        if (selectedCategory) {
          params.append('unit_type', selectedCategory);
        }

        const response = await fetch(`/api/units?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setUnitData(data);
        setError(null);
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'An unknown error occurred';
        setError(errorMsg);
        console.error("Failed to fetch units:", errorMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchUnits();
  }, [filters, selectedCategory, currentPage, itemsPerPage]);

  // Reset to page 1 when filters or category change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, selectedCategory]);


  if (loading) return <p>Loading units...</p>;
  if (error) return <p className="text-red-500">Error loading units: {error}</p>;
  if (!unitData || !unitData.items || unitData.items.length === 0) {
    return <p>No units match the current filters.</p>;
  }

  return (
    <div className="mt-4">
      <ul className="space-y-2">
        {unitData.items.map((unit) => (
          <li key={unit.id} className="p-2 border rounded hover:bg-gray-50">
            <Link href={`/units/${unit.id}`} legacyBehavior>
              <a className="list-item-link">
                {unit.chassis} {unit.model} {formatMass(unit.mass) && `(${formatMass(unit.mass)})`} - {getUnitTypeName(unit.type)}
              </a>
            </Link>
          </li>
        ))}
      </ul>
      {unitData.totalPages > 1 && (
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={unitData.currentPage === 1}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <p>
            Page {unitData.currentPage} of {unitData.totalPages} (Total: {unitData.totalItems} units)
          </p>
          <button
            onClick={() => setCurrentPage(p => Math.min(unitData.totalPages, p + 1))}
            disabled={unitData.currentPage === unitData.totalPages}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default UnitCompendiumList;
