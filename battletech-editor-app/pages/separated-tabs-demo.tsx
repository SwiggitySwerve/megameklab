import React, { useState, useCallback } from 'react';
import { GetServerSideProps } from 'next';
import Layout from '../components/common/Layout';
import StructureTab from '../components/editor/tabs/StructureTab';
import ArmorTab from '../components/editor/tabs/ArmorTab';
import { EditableUnit, ARMOR_TYPES } from '../types/editor';

// Sample unit data for demonstration
const createSampleUnit = (): EditableUnit => ({
  id: 'demo-separated-tabs',
  chassis: 'Atlas',
  model: 'AS7-D',
  mass: 100,
  tech_base: 'Inner Sphere',
  era: '3025',
  source: 'TRO:3025',
  rules_level: 'Standard',
  role: 'Juggernaut',
  mul_id: '126',
  data: {
    chassis: 'Atlas',
    model: 'AS7-D',
    structure: {
      type: 'Standard'
    },
    engine: {
      type: 'Fusion',
      rating: 300
    },
    heat_sinks: {
      type: 'Single',
      count: 20
    },
    movement: {
      walk_mp: 3,
      jump_mp: 0
    },
    armor: {
      total_armor_points: 307,
      locations: []
    }
  },
  armorAllocation: {
    head: {
      front: 9,
      rear: 0,
      maxArmor: 9,
      type: ARMOR_TYPES[0]
    },
    center_torso: {
      front: 47,
      rear: 12,
      maxArmor: 63,
      type: ARMOR_TYPES[0]
    },
    left_torso: {
      front: 32,
      rear: 10,
      maxArmor: 42,
      type: ARMOR_TYPES[0]
    },
    right_torso: {
      front: 32,
      rear: 10,
      maxArmor: 42,
      type: ARMOR_TYPES[0]
    },
    left_arm: {
      front: 34,
      rear: 0,
      maxArmor: 34,
      type: ARMOR_TYPES[0]
    },
    right_arm: {
      front: 34,
      rear: 0,
      maxArmor: 34,
      type: ARMOR_TYPES[0]
    },
    left_leg: {
      front: 41,
      rear: 0,
      maxArmor: 41,
      type: ARMOR_TYPES[0]
    },
    right_leg: {
      front: 41,
      rear: 0,
      maxArmor: 41,
      type: ARMOR_TYPES[0]
    }
  },
  equipmentPlacements: [],
  criticalSlots: [],
  fluffData: {
    overview: '',
    capabilities: '',
    history: '',
    deployment: '',
    variants: '',
    notes: ''
  },
  selectedQuirks: [],
  validationState: {
    isValid: true,
    errors: [],
    warnings: []
  },
  editorMetadata: {
    lastModified: new Date(),
    isDirty: false,
    version: '1.0.0'
  }
});

interface SeparatedTabsDemoProps {
  initialUnit: EditableUnit;
}

const SeparatedTabsDemo: React.FC<SeparatedTabsDemoProps> = ({ initialUnit }) => {
  const [unit, setUnit] = useState<EditableUnit>(initialUnit);
  const [activeTab, setActiveTab] = useState<'structure' | 'armor'>('structure');
  const [validationErrors, setValidationErrors] = useState<any[]>([]);

  // Handle unit changes
  const handleUnitChange = useCallback((updates: Partial<EditableUnit>) => {
    setUnit(prevUnit => ({
      ...prevUnit,
      ...updates
    }));
  }, []);

  // Calculate validation errors (simplified)
  const calculateValidationErrors = useCallback(() => {
    const errors: any[] = [];
    
    // Check for basic validation
    if (!unit.chassis || unit.chassis.trim() === '') {
      errors.push({ message: 'Chassis name is required' });
    }
    
    if (unit.mass <= 0) {
      errors.push({ message: 'Mass must be greater than 0' });
    }
    
    // Check engine rating vs movement
    const engineRating = unit.data?.engine?.rating || 0;
    const expectedWalkMP = Math.floor(engineRating / unit.mass);
    const actualWalkMP = unit.data?.movement?.walk_mp || 0;
    
    if (Math.abs(expectedWalkMP - actualWalkMP) > 1) {
      errors.push({ 
        message: `Engine rating ${engineRating} should provide ~${expectedWalkMP} Walk MP, but ${actualWalkMP} is configured` 
      });
    }
    
    return errors;
  }, [unit]);

  // Update validation errors when unit changes
  React.useEffect(() => {
    const errors = calculateValidationErrors();
    setValidationErrors(errors);
  }, [unit, calculateValidationErrors]);

  return (
    <Layout>
      <div className="min-h-screen bg-slate-900 text-slate-100">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div>
                <h1 className="text-xl font-bold text-slate-100">
                  MegaMekLab-Style Separated Tabs Demo
                </h1>
                <p className="text-sm text-slate-400">
                  Structure and Armor configuration in separate tabs (like original MegaMekLab)
                </p>
              </div>
              
              {/* Unit Summary */}
              <div className="text-right">
                <div className="text-sm font-medium">{unit.chassis} {unit.model}</div>
                <div className="text-xs text-slate-400">
                  {unit.mass} tons • {unit.tech_base} • {unit.era}
                </div>
                {validationErrors.length > 0 && (
                  <div className="text-xs text-red-400">
                    {validationErrors.length} validation issue{validationErrors.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-800 border-b border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('structure')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'structure'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.472-2.472a3.375 3.375 0 000-4.773L6.75 2.25 2.25 6.75l4.773 4.773a3.375 3.375 0 004.773 0z" />
                  </svg>
                  <span>Structure</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('armor')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'armor'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  <span>Armor</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'structure' && (
            <StructureTab
              unit={unit}
              onUnitChange={handleUnitChange}
              validationErrors={validationErrors.filter(err => 
                err.message?.includes('Chassis') || 
                err.message?.includes('Mass') || 
                err.message?.includes('Engine') ||
                err.message?.includes('movement')
              )}
              readOnly={false}
            />
          )}

          {activeTab === 'armor' && (
            <ArmorTab
              unit={unit}
              onUnitChange={handleUnitChange}
              validationErrors={validationErrors.filter(err => 
                err.message?.includes('armor') || 
                err.message?.includes('Armor')
              )}
              readOnly={false}
            />
          )}
        </div>

        {/* Footer Info */}
        <div className="bg-slate-800 border-t border-slate-700 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <h3 className="font-medium text-slate-300 mb-2">MegaMekLab Parity</h3>
                <p className="text-slate-400">
                  This demo shows Structure and Armor configuration in separate tabs, 
                  matching the original MegaMekLab workflow.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-slate-300 mb-2">Current Unit State</h3>
                <div className="space-y-1 text-slate-400">
                  <div>Engine: {unit.data?.engine?.type} {unit.data?.engine?.rating}</div>
                  <div>Movement: {unit.data?.movement?.walk_mp}/{unit.data?.movement?.jump_mp}</div>
                  <div>Heat Sinks: {unit.data?.heat_sinks?.count} {unit.data?.heat_sinks?.type}</div>
                  <div>Structure: {unit.data?.structure?.type}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-slate-300 mb-2">Armor Summary</h3>
                <div className="space-y-1 text-slate-400">
                  {unit.armorAllocation && Object.entries(unit.armorAllocation).map(([location, armor]) => (
                    <div key={location} className="flex justify-between">
                      <span className="capitalize">{location.replace('_', ' ')}:</span>
                      <span>{armor.front}{(armor.rear || 0) > 0 ? `/${armor.rear}` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const initialUnit = createSampleUnit();
  
  return {
    props: {
      initialUnit,
    },
  };
};

export default SeparatedTabsDemo;
