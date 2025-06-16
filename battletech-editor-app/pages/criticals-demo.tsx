import React, { useState } from 'react';
import Layout from '../components/common/Layout';
import { EditableUnit, MECH_LOCATIONS } from '../types/editor';

const mockUnit: EditableUnit = {
  id: 'demo-atlas',
  chassis: 'Atlas',
  model: 'AS7-D',
  era: '3025',
  mass: 100,
  tech_base: 'Inner Sphere',
  role: 'Assault',
  selectedQuirks: [],
  equipmentPlacements: [],
  criticalSlots: [],
  data: {
    chassis: 'Atlas',
    model: 'AS7-D',
    heat_sinks: {
      count: 20,
      type: 'Single',
    },
  },
  armorAllocation: {
    [MECH_LOCATIONS.HEAD]: { front: 9, rear: 0, maxArmor: 9, type: 'Standard' as any },
    [MECH_LOCATIONS.CENTER_TORSO]: { front: 47, rear: 12, maxArmor: 63, type: 'Standard' as any },
    [MECH_LOCATIONS.LEFT_TORSO]: { front: 32, rear: 10, maxArmor: 42, type: 'Standard' as any },
    [MECH_LOCATIONS.RIGHT_TORSO]: { front: 32, rear: 10, maxArmor: 42, type: 'Standard' as any },
    [MECH_LOCATIONS.LEFT_ARM]: { front: 34, rear: 0, maxArmor: 34, type: 'Standard' as any },
    [MECH_LOCATIONS.RIGHT_ARM]: { front: 34, rear: 0, maxArmor: 34, type: 'Standard' as any },
    [MECH_LOCATIONS.LEFT_LEG]: { front: 41, rear: 0, maxArmor: 41, type: 'Standard' as any },
    [MECH_LOCATIONS.RIGHT_LEG]: { front: 41, rear: 0, maxArmor: 41, type: 'Standard' as any },
  },
  fluffData: {
    overview: '',
    capabilities: '',
    deployment: '',
    history: ''
  },
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
};

interface SlotDisplay {
  index: number;
  name: string;
  type: 'engine' | 'gyro' | 'equipment' | 'empty';
  isFixed: boolean;
}

export default function CriticalsDemo() {
  const [engineType, setEngineType] = useState<'Standard' | 'XL' | 'Light'>('Standard');
  const [gyroType, setGyroType] = useState<'Standard' | 'XL' | 'Compact'>('Standard');

  const generateCenterTorsoSlots = (): SlotDisplay[] => {
    const slots: SlotDisplay[] = Array(12).fill(null).map((_, i) => ({
      index: i,
      name: '-Empty-',
      type: 'empty' as const,
      isFixed: false
    }));

    // Check for XL gyro + non-XL engine incompatibility
    if (gyroType === 'XL' && engineType === 'Standard') {
      // Show incompatibility - don't place XL gyro
      for (let i = 0; i <= 2; i++) {
        slots[i] = { index: i, name: 'Engine', type: 'engine', isFixed: true };
      }
      for (let i = 3; i <= 6; i++) {
        slots[i] = { index: i, name: 'Gyro', type: 'gyro', isFixed: true };
      }
      for (let i = 7; i <= 9; i++) {
        slots[i] = { index: i, name: 'Engine', type: 'engine', isFixed: true };
      }
      // Slot 10 would conflict with XL gyro
      slots[10] = { index: 10, name: 'SRM 6', type: 'equipment', isFixed: false };
      slots[11] = { index: 11, name: 'SRM 6', type: 'equipment', isFixed: false };
      return slots;
    }

    const gyroSlots = gyroType === 'XL' ? 6 : gyroType === 'Compact' ? 2 : 4;

    if (gyroType === 'XL' && (engineType === 'XL' || engineType === 'Light')) {
      // Special XL+XL layout: Engine 0-2, Gyro 3-8, Engine 9-11
      for (let i = 0; i <= 2; i++) {
        slots[i] = { index: i, name: 'Engine', type: 'engine', isFixed: true };
      }
      for (let i = 3; i <= 8; i++) {
        slots[i] = { index: i, name: 'Gyro', type: 'gyro', isFixed: true };
      }
      for (let i = 9; i <= 11; i++) {
        slots[i] = { index: i, name: 'Engine', type: 'engine', isFixed: true };
      }
    } else {
      // Standard layout: Engine 0-2, Gyro 3-(3+gyroSlots), Engine 7-9
      for (let i = 0; i <= 2; i++) {
        slots[i] = { index: i, name: 'Engine', type: 'engine', isFixed: true };
      }
      for (let i = 3; i < 3 + gyroSlots; i++) {
        slots[i] = { index: i, name: 'Gyro', type: 'gyro', isFixed: true };
      }
      for (let i = 7; i <= 9; i++) {
        slots[i] = { index: i, name: 'Engine', type: 'engine', isFixed: true };
      }
      
      // Add some sample equipment if there's room
      if (3 + gyroSlots < 7) {
        // Can fit equipment between gyro and engine
        slots[10] = { index: 10, name: 'SRM 6', type: 'equipment', isFixed: false };
        slots[11] = { index: 11, name: 'SRM 6', type: 'equipment', isFixed: false };
      } else {
        // Equipment gets displaced
        slots[10] = { index: 10, name: 'SRM 6', type: 'equipment', isFixed: false };
        slots[11] = { index: 11, name: 'SRM 6', type: 'equipment', isFixed: false };
      }
    }

    return slots;
  };

  const handleEngineChange = (newEngineType: typeof engineType) => {
    setEngineType(newEngineType);
  };

  const handleGyroChange = (newGyroType: typeof gyroType) => {
    setGyroType(newGyroType);
  };

  const ctSlots = generateCenterTorsoSlots();
  const isIncompatible = gyroType === 'XL' && engineType === 'Standard';
  const isSpecialLayout = gyroType === 'XL' && (engineType === 'XL' || engineType === 'Light');

  return (
    <Layout>
      <div className="min-h-screen bg-slate-900 p-4">
        <h1 className="text-3xl font-bold text-white mb-6">Critical Slots & Engine/Gyro Demo</h1>
        <p className="text-slate-300 mb-6">
          This demo showcases the critical slots system with proper engine and gyro placement, 
          including the special XL Engine + XL Gyro configuration and compatibility checking.
        </p>
        
        {/* Engine/Gyro Controls */}
        <div className="bg-slate-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold text-white mb-4">System Components</h2>
          <div className="flex gap-6 mb-4">
            <div>
              <label className="block text-white mb-2 font-medium">Engine Type:</label>
              <select 
                value={engineType} 
                onChange={(e) => handleEngineChange(e.target.value as typeof engineType)}
                className="bg-slate-700 text-white p-3 rounded-md border border-slate-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="Standard">Standard</option>
                <option value="XL">XL</option>
                <option value="Light">Light</option>
              </select>
            </div>
            <div>
              <label className="block text-white mb-2 font-medium">Gyro Type:</label>
              <select 
                value={gyroType} 
                onChange={(e) => handleGyroChange(e.target.value as typeof gyroType)}
                className="bg-slate-700 text-white p-3 rounded-md border border-slate-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="Standard">Standard (4 slots)</option>
                <option value="XL">XL (6 slots)</option>
                <option value="Compact">Compact (2 slots)</option>
              </select>
            </div>
          </div>
          
          {/* Current Status */}
          <div className="bg-slate-700 p-4 rounded-md">
            <p className="text-slate-300 mb-2">
              <strong>Current Configuration:</strong> {engineType} Engine + {gyroType} Gyro
            </p>
            {isIncompatible && (
              <div className="bg-red-900 border border-red-700 p-3 rounded-md">
                <p className="text-red-300">
                  ⚠️ <strong>INCOMPATIBLE:</strong> XL Gyro cannot be used with Standard engine due to slot conflicts!
                </p>
                <p className="text-red-400 text-sm mt-1">
                  XL Gyro needs 6 slots (3-8) but Standard engine uses slots 7-9
                </p>
              </div>
            )}
            {isSpecialLayout && (
              <div className="bg-green-900 border border-green-700 p-3 rounded-md">
                <p className="text-green-300">
                  ✓ <strong>SPECIAL LAYOUT:</strong> XL Engine + XL Gyro uses optimized slot arrangement
                </p>
                <p className="text-green-400 text-sm mt-1">
                  Engine slots: 0-2, 9-11 | Gyro slots: 3-8
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Center Torso Slots Display */}
        <div className="bg-slate-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Center Torso Slot Layout</h2>
          <div className="grid grid-cols-4 gap-3">
            {ctSlots.map((slot) => {
              let bgColor = 'bg-slate-700 text-slate-300';
              let borderColor = 'border-slate-600';
              
              if (slot.type === 'engine') {
                bgColor = 'bg-blue-600 text-white';
                borderColor = 'border-blue-500';
              } else if (slot.type === 'gyro') {
                bgColor = 'bg-purple-600 text-white';
                borderColor = 'border-purple-500';
              } else if (slot.type === 'equipment') {
                bgColor = 'bg-orange-600 text-white';
                borderColor = 'border-orange-500';
              }
              
              return (
                <div 
                  key={slot.index} 
                  className={`p-3 rounded-md border-2 ${bgColor} ${borderColor} font-mono text-sm text-center transition-all duration-200`}
                >
                  <div className="font-bold">Slot {slot.index}</div>
                  <div className="text-xs mt-1">{slot.name}</div>
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded border border-blue-500"></div>
              <span className="text-slate-300">Engine</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-600 rounded border border-purple-500"></div>
              <span className="text-slate-300">Gyro</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-600 rounded border border-orange-500"></div>
              <span className="text-slate-300">Equipment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-700 rounded border border-slate-600"></div>
              <span className="text-slate-300">Empty</span>
            </div>
          </div>
        </div>
        
        {/* Slot Layout Rules */}
        <div className="bg-slate-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Slot Layout Rules</h2>
          <div className="space-y-4 text-slate-300">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Standard Layout</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Engine: Slots 0-2 (top) and 7-9 (bottom)</li>
                <li>Gyro: Starting at slot 3, size varies by type</li>
                <li>Standard Gyro: 4 slots (3-6)</li>
                <li>Compact Gyro: 2 slots (3-4)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">XL Engine + XL Gyro Special Layout</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Engine: Slots 0-2 (top) and 9-11 (bottom)</li>
                <li>XL Gyro: Slots 3-8 (6 slots total)</li>
                <li>This avoids slot conflicts and maximizes available space</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Compatibility Rules</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>XL Gyro (6 slots) conflicts with Standard engine slots 7-9</li>
                <li>Only XL or Light engines can accommodate XL Gyros</li>
                <li>Equipment in conflicting slots gets moved to unallocated</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Features Summary */}
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-4">Engine/Gyro System Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-300">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Smart Slot Management</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Automatic slot allocation based on component types</li>
                <li>Special layouts for XL Engine + XL Gyro combinations</li>
                <li>Equipment displacement when slots are needed</li>
                <li>Real-time compatibility checking</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Visual Feedback</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Color-coded slot types for easy identification</li>
                <li>Compatibility warnings for invalid configurations</li>
                <li>Success indicators for valid special layouts</li>
                <li>Clear slot numbering and component names</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
