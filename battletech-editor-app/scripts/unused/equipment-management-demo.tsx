import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import Layout from '../components/common/Layout';
import { EquipmentManagementComponent } from '../components/equipment/EquipmentManagementComponent';
import { CriticalAllocationVisualizer } from '../components/equipment/CriticalAllocationVisualizer';
import { EditableUnit, ARMOR_TYPES } from '../types/editor';
import { FullEquipment } from '../types';

// Mock equipment data
const mockEquipment: FullEquipment[] = [
  // Energy Weapons
  { id: 'er-large-laser', name: 'ER Large Laser', type: 'Energy Weapon', tech_base: 'Clan', weight: 4, space: 1, heat: 12, damage: 10, data: { weapon_type: 'Energy' } },
  { id: 'medium-pulse-laser', name: 'Medium Pulse Laser', type: 'Energy Weapon', tech_base: 'Inner Sphere', weight: 2, space: 1, heat: 4, damage: 6, data: { weapon_type: 'Energy' } },
  { id: 'er-ppc', name: 'ER PPC', type: 'Energy Weapon', tech_base: 'Clan', weight: 6, space: 2, heat: 15, damage: 15, data: { weapon_type: 'Energy' } },
  
  // Ballistic Weapons
  { id: 'ac20', name: 'AC/20', type: 'Ballistic Weapon', tech_base: 'Inner Sphere', weight: 14, space: 10, heat: 7, damage: 20, data: { weapon_type: 'Ballistic' } },
  { id: 'ultra-ac5', name: 'Ultra AC/5', type: 'Ballistic Weapon', tech_base: 'Inner Sphere', weight: 9, space: 5, heat: 1, damage: 5, data: { weapon_type: 'Ballistic' } },
  { id: 'gauss-rifle', name: 'Gauss Rifle', type: 'Ballistic Weapon', tech_base: 'Inner Sphere', weight: 15, space: 7, heat: 1, damage: 15, data: { weapon_type: 'Ballistic' } },
  
  // Missile Weapons
  { id: 'lrm20', name: 'LRM 20', type: 'Missile Weapon', tech_base: 'Inner Sphere', weight: 10, space: 5, heat: 6, damage: 20, data: { weapon_type: 'Missile' } },
  { id: 'srm6', name: 'SRM 6', type: 'Missile Weapon', tech_base: 'Inner Sphere', weight: 3, space: 2, heat: 4, damage: 12, data: { weapon_type: 'Missile' } },
  { id: 'streak-srm4', name: 'Streak SRM 4', type: 'Missile Weapon', tech_base: 'Inner Sphere', weight: 3, space: 1, heat: 3, damage: 8, data: { weapon_type: 'Missile' } },
  
  // Ammunition
  { id: 'ac20-ammo', name: 'AC/20 Ammo', type: 'Ammunition', tech_base: 'Inner Sphere', weight: 1, space: 1 },
  { id: 'gauss-ammo', name: 'Gauss Ammo', type: 'Ammunition', tech_base: 'Inner Sphere', weight: 1, space: 1 },
  { id: 'lrm20-ammo', name: 'LRM 20 Ammo', type: 'Ammunition', tech_base: 'Inner Sphere', weight: 1, space: 1 },
  { id: 'srm6-ammo', name: 'SRM 6 Ammo', type: 'Ammunition', tech_base: 'Inner Sphere', weight: 1, space: 1 },
  
  // Equipment
  { id: 'double-heat-sink', name: 'Double Heat Sink', type: 'Heat Sink', tech_base: 'Inner Sphere', weight: 1, space: 3 },
  { id: 'guardian-ecm', name: 'Guardian ECM', type: 'Equipment', tech_base: 'Inner Sphere', weight: 1.5, space: 2 },
  { id: 'beagle-probe', name: 'Beagle Active Probe', type: 'Equipment', tech_base: 'Inner Sphere', weight: 1.5, space: 2 },
  { id: 'case', name: 'CASE', type: 'Equipment', tech_base: 'Inner Sphere', weight: 0.5, space: 1 },
  { id: 'targeting-computer', name: 'Targeting Computer', type: 'Equipment', tech_base: 'Inner Sphere', weight: 2, space: 2 },
];

// Mock unit data
const createMockUnit = (): EditableUnit => ({
  id: 'test-mech',
  chassis: 'Test Chassis',
  model: 'TST-1',
  era: 'Succession Wars',
  mass: 65,
  tech_base: 'Inner Sphere',
  role: 'Skirmisher',
  selectedQuirks: [],
  equipmentPlacements: [
    {
      id: 'placement-1',
      equipment: mockEquipment[0], // ER Large Laser
      location: 'Right Arm',
      criticalSlots: [2, 3],
    },
    {
      id: 'placement-2',
      equipment: mockEquipment[6], // LRM 20
      location: 'Left Torso',
      criticalSlots: [0, 1, 2, 3, 4],
    },
  ],
  criticalSlots: [
    // Fixed equipment
    { location: 'Head', slotIndex: 0, systemType: 'lifesupport', isFixed: true, isEmpty: false },
    { location: 'Head', slotIndex: 1, systemType: 'sensors', isFixed: true, isEmpty: false },
    { location: 'Head', slotIndex: 2, systemType: 'cockpit', isFixed: true, isEmpty: false },
    { location: 'Head', slotIndex: 3, systemType: 'sensors', isFixed: true, isEmpty: false },
    { location: 'Head', slotIndex: 4, systemType: 'lifesupport', isFixed: true, isEmpty: false },
    
    // Center Torso
    { location: 'Center Torso', slotIndex: 4, systemType: 'engine', isFixed: true, isEmpty: false },
    { location: 'Center Torso', slotIndex: 5, systemType: 'engine', isFixed: true, isEmpty: false },
    { location: 'Center Torso', slotIndex: 6, systemType: 'engine', isFixed: true, isEmpty: false },
    { location: 'Center Torso', slotIndex: 7, systemType: 'gyro', isFixed: true, isEmpty: false },
    { location: 'Center Torso', slotIndex: 8, systemType: 'gyro', isFixed: true, isEmpty: false },
    { location: 'Center Torso', slotIndex: 9, systemType: 'gyro', isFixed: true, isEmpty: false },
    { location: 'Center Torso', slotIndex: 10, systemType: 'gyro', isFixed: true, isEmpty: false },
    
    // Placed equipment
    { location: 'Right Arm', slotIndex: 2, equipment: mockEquipment[0], isFixed: false, isEmpty: false },
    { location: 'Right Arm', slotIndex: 3, equipment: mockEquipment[0], isFixed: false, isEmpty: false },
    
    { location: 'Left Torso', slotIndex: 0, equipment: mockEquipment[6], isFixed: false, isEmpty: false },
    { location: 'Left Torso', slotIndex: 1, equipment: mockEquipment[6], isFixed: false, isEmpty: false },
    { location: 'Left Torso', slotIndex: 2, equipment: mockEquipment[6], isFixed: false, isEmpty: false },
    { location: 'Left Torso', slotIndex: 3, equipment: mockEquipment[6], isFixed: false, isEmpty: false },
    { location: 'Left Torso', slotIndex: 4, equipment: mockEquipment[6], isFixed: false, isEmpty: false },
    
    // Actuators
    { location: 'Right Arm', slotIndex: 0, systemType: 'actuator', isFixed: true, isEmpty: false },
    { location: 'Right Arm', slotIndex: 1, systemType: 'actuator', isFixed: true, isEmpty: false },
    { location: 'Left Arm', slotIndex: 0, systemType: 'actuator', isFixed: true, isEmpty: false },
    { location: 'Left Arm', slotIndex: 1, systemType: 'actuator', isFixed: true, isEmpty: false },
    
    { location: 'Right Leg', slotIndex: 0, systemType: 'actuator', isFixed: true, isEmpty: false },
    { location: 'Right Leg', slotIndex: 1, systemType: 'actuator', isFixed: true, isEmpty: false },
    { location: 'Right Leg', slotIndex: 2, systemType: 'actuator', isFixed: true, isEmpty: false },
    { location: 'Right Leg', slotIndex: 3, systemType: 'actuator', isFixed: true, isEmpty: false },
    
    { location: 'Left Leg', slotIndex: 0, systemType: 'actuator', isFixed: true, isEmpty: false },
    { location: 'Left Leg', slotIndex: 1, systemType: 'actuator', isFixed: true, isEmpty: false },
    { location: 'Left Leg', slotIndex: 2, systemType: 'actuator', isFixed: true, isEmpty: false },
    { location: 'Left Leg', slotIndex: 3, systemType: 'actuator', isFixed: true, isEmpty: false },
  ],
  data: {
    chassis: 'Test Chassis',
    model: 'TST-1',
    heat_sinks: {
      count: 10,
      type: 'Single',
    },
  },
  armorAllocation: {
    head: { front: 9, rear: 0, maxArmor: 9, type: ARMOR_TYPES[0] }, // Standard armor
    centerTorso: { front: 21, rear: 10, maxArmor: 31, type: ARMOR_TYPES[0] },
    leftTorso: { front: 15, rear: 7, maxArmor: 22, type: ARMOR_TYPES[0] },
    rightTorso: { front: 15, rear: 7, maxArmor: 22, type: ARMOR_TYPES[0] },
    leftArm: { front: 10, rear: 0, maxArmor: 10, type: ARMOR_TYPES[0] },
    rightArm: { front: 10, rear: 0, maxArmor: 10, type: ARMOR_TYPES[0] },
    leftLeg: { front: 15, rear: 0, maxArmor: 15, type: ARMOR_TYPES[0] },
    rightLeg: { front: 15, rear: 0, maxArmor: 15, type: ARMOR_TYPES[0] },
  },
  fluffData: {
    overview: '',
    capabilities: '',
    deployment: '',
    history: '',
    manufacturer: '',
    primaryFactory: '',
    notes: '',
  },
  validationState: {
    isValid: true,
    errors: [],
    warnings: [],
  },
  editorMetadata: {
    lastModified: new Date(),
    isDirty: false,
    version: '1.0',
  },
});

const EquipmentManagementDemo: React.FC = () => {
  const [unit, setUnit] = useState<EditableUnit>(createMockUnit());
  const [selectedTab, setSelectedTab] = useState<'equipment' | 'criticals'>('equipment');
  const [compactMode, setCompactMode] = useState(false);

  const handleUnitChange = (updates: Partial<EditableUnit>) => {
    setUnit(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const handleEquipmentClick = (equipment: FullEquipment, location: string) => {
    console.log('Equipment clicked:', equipment.name, 'in', location);
  };

  const handleSlotClick = (location: string, slotIndex: number) => {
    console.log('Slot clicked:', location, 'index', slotIndex);
  };

  return (
    <Layout title="Equipment Management Demo">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Equipment Management Demo</h1>
          <p className="text-gray-600 mb-4">
            This demo showcases the equipment management system with filtering, placement, validation, and drag & drop functionality.
          </p>
          
          {/* Controls */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedTab('equipment')}
                className={`px-4 py-2 rounded-md ${
                  selectedTab === 'equipment' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Equipment List
              </button>
              <button
                onClick={() => setSelectedTab('criticals')}
                className={`px-4 py-2 rounded-md ${
                  selectedTab === 'criticals' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Critical Slots
              </button>
            </div>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={compactMode}
                onChange={(e) => setCompactMode(e.target.checked)}
              />
              Compact Mode
            </label>
            
            <button
              onClick={() => setUnit(createMockUnit())}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Reset Unit
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - Equipment Management or Critical Slots */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {selectedTab === 'equipment' ? (
              <>
                <h2 className="text-xl font-semibold mb-4">Equipment Database</h2>
                <EquipmentManagementComponent
                  unit={unit}
                  equipment={mockEquipment}
                  onUnitChange={handleUnitChange}
                  compact={compactMode}
                />
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-4">Critical Slot Allocation</h2>
                <CriticalAllocationVisualizer
                  unit={unit}
                  onSlotClick={handleSlotClick}
                  onEquipmentClick={handleEquipmentClick}
                  compact={compactMode}
                />
              </>
            )}
          </div>

          {/* Right column - Unit Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Unit Status</h2>
            
            {/* Basic info */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Basic Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Chassis: <span className="font-medium">{unit.data?.chassis || 'N/A'}</span></div>
                <div>Model: <span className="font-medium">{unit.data?.model || 'N/A'}</span></div>
                <div>Mass: <span className="font-medium">{unit.mass}t</span></div>
                <div>Tech Base: <span className="font-medium">{unit.tech_base}</span></div>
              </div>
            </div>

            {/* Equipment summary */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Installed Equipment</h3>
              <div className="space-y-1">
                {unit.equipmentPlacements.map(placement => (
                  <div key={placement.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                    <span>{placement.equipment.name}</span>
                    <span className="text-gray-600">{placement.location}</span>
                  </div>
                ))}
                {unit.equipmentPlacements.length === 0 && (
                  <div className="text-sm text-gray-500 italic">No equipment installed</div>
                )}
              </div>
            </div>

            {/* Weight summary */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Weight Summary</h3>
              <div className="space-y-1 text-sm">
                {(() => {
                  const equipmentWeight = unit.equipmentPlacements.reduce(
                    (sum, p) => sum + (p.equipment.weight || 0), 0
                  );
                  const remainingWeight = unit.mass - equipmentWeight;
                  
                  return (
                    <>
                      <div className="flex justify-between">
                        <span>Equipment Weight:</span>
                        <span>{equipmentWeight.toFixed(1)}t</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Remaining Weight:</span>
                        <span className={remainingWeight < 0 ? 'text-red-600' : ''}>
                          {remainingWeight.toFixed(1)}t
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Heat summary */}
            <div>
              <h3 className="font-medium mb-2">Heat Summary</h3>
              <div className="space-y-1 text-sm">
                {(() => {
                  const heatGeneration = unit.equipmentPlacements
                    .filter(p => p.equipment.heat)
                    .reduce((sum, p) => sum + (p.equipment.heat || 0), 0);
                  const heatDissipation = (unit.data?.heat_sinks?.count || 10) * 
                    (unit.data?.heat_sinks?.type === 'Double' ? 2 : 1);
                  const netHeat = heatGeneration - heatDissipation;
                  
                  return (
                    <>
                      <div className="flex justify-between">
                        <span>Heat Generation:</span>
                        <span>{heatGeneration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Heat Dissipation:</span>
                        <span>{heatDissipation}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Net Heat:</span>
                        <span className={netHeat > 0 ? 'text-red-600' : 'text-green-600'}>
                          {netHeat > 0 ? '+' : ''}{netHeat}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Features Demonstrated</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium mb-2">Equipment Management</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Advanced filtering (search, tech base, weight, heat)</li>
                <li>Filter presets for common equipment types</li>
                <li>Equipment categorization with expandable groups</li>
                <li>Real-time validation with error/warning indicators</li>
                <li>Drag & drop support (drag equipment to critical slots)</li>
                <li>Auto-placement with intelligent suggestions</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Critical Slot Visualization</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Color-coded equipment types</li>
                <li>Interactive slot selection</li>
                <li>Equipment highlighting</li>
                <li>Usage statistics and breakdown</li>
                <li>Compact and expanded view modes</li>
                <li>Hover tooltips with equipment details</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Placement Options</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Multiple placement strategies (balanced, concentrated, distributed)</li>
                <li>Configurable priorities (protection, heat, weight, space)</li>
                <li>Safety restrictions (explosives, symmetry)</li>
                <li>Placement optimization suggestions</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Validation System</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Tech base compatibility checking</li>
                <li>Weight and heat validation</li>
                <li>Equipment dependency checking</li>
                <li>Conflict detection</li>
                <li>Quirk compatibility</li>
                <li>Helpful suggestions for fixes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};

export default EquipmentManagementDemo;
