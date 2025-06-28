/**
 * Critical Slots Test - Simple button-based test of the core system
 */

import React from 'react'
import { UnitProvider, useUnit } from '../components/criticalSlots/UnitProvider'

function TestControls() {
  const { engineType, gyroType, changeEngine, changeGyro, summary, addTestEquipment } = useUnit()

  React.useEffect(() => {
    // Add test equipment once
    const testEquipment = {
      id: 'test-ac20',
      name: 'AC/20',
      requiredSlots: 10,
      weight: 14,
      type: 'weapon' as const,
      techBase: 'Inner Sphere' as const
    }
    
    console.log('Adding test equipment...')
    addTestEquipment(testEquipment, 'Center Torso')
  }, [addTestEquipment])

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">Critical Slots System Test</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3">Current Configuration</h2>
        <div className="bg-gray-800 p-4 rounded">
          <div>Engine: <span className="text-red-400">{engineType}</span></div>
          <div>Gyro: <span className="text-purple-400">{gyroType}</span></div>
          <div>Total Equipment: <span className="text-green-400">{summary.totalEquipment}</span></div>
          <div>Unallocated: <span className="text-yellow-400">{summary.unallocatedEquipment}</span></div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3">Engine Controls</h2>
        <div className="space-x-3">
          <button 
            onClick={() => changeEngine('Standard')}
            className={`px-4 py-2 rounded ${engineType === 'Standard' ? 'bg-blue-600' : 'bg-gray-600'}`}
          >
            Standard Engine
          </button>
          <button 
            onClick={() => changeEngine('XL')}
            className={`px-4 py-2 rounded ${engineType === 'XL' ? 'bg-blue-600' : 'bg-gray-600'}`}
          >
            XL Engine
          </button>
          <button 
            onClick={() => changeEngine('Light')}
            className={`px-4 py-2 rounded ${engineType === 'Light' ? 'bg-blue-600' : 'bg-gray-600'}`}
          >
            Light Engine
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3">Gyro Controls</h2>
        <div className="space-x-3">
          <button 
            onClick={() => changeGyro('Standard')}
            className={`px-4 py-2 rounded ${gyroType === 'Standard' ? 'bg-purple-600' : 'bg-gray-600'}`}
          >
            Standard Gyro
          </button>
          <button 
            onClick={() => changeGyro('XL')}
            className={`px-4 py-2 rounded ${gyroType === 'XL' ? 'bg-purple-600' : 'bg-gray-600'}`}
          >
            XL Gyro
          </button>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded">
        <h3 className="text-lg font-bold mb-3">Instructions:</h3>
        <ul className="text-sm space-y-1">
          <li>• Click "XL Engine" to see equipment displacement in action</li>
          <li>• The AC/20 should move to unallocated when XL engine is selected</li>
          <li>• Watch the "Unallocated" count change</li>
          <li>• Switch back to "Standard Engine" to see equipment restored</li>
        </ul>
      </div>
    </div>
  )
}

export default function CriticalSlotsTest() {
  return (
    <UnitProvider>
      <TestControls />
    </UnitProvider>
  )
}
