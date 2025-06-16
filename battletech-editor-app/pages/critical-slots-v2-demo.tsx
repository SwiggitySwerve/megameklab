/**
 * Critical Slots V2 Demo - Complete demo of the new critical slot system
 * Demonstrates engine/gyro changes, equipment displacement, and system validation
 */

import React from 'react'
import { UnitProvider, useUnit } from '../components/criticalSlots/UnitProvider'
import { SystemComponentControls } from '../components/criticalSlots/SystemComponentControls'
import { CriticalSlotsDisplay } from '../components/criticalSlots/CriticalSlotsDisplay'
import { UnallocatedEquipmentDisplay } from '../components/criticalSlots/UnallocatedEquipmentDisplay'
import { AllEquipmentDisplay } from '../components/criticalSlots/AllEquipmentDisplay'
import { EquipmentBrowser } from '../components/criticalSlots/EquipmentBrowser'
import { UnifiedColorLegend } from '../components/criticalSlots/UnifiedColorLegend'
import { UnitConfiguration } from '../utils/criticalSlots/UnitCriticalManager'

// Demo component that adds test equipment on mount
function DemoContent() {
  const [testEquipmentAdded, setTestEquipmentAdded] = React.useState(false)
  
  return (
    <UnitProvider>
      <DemoWithTestEquipment testEquipmentAdded={testEquipmentAdded} setTestEquipmentAdded={setTestEquipmentAdded} />
    </UnitProvider>
  )
}

function DemoWithTestEquipment({ 
  testEquipmentAdded, 
  setTestEquipmentAdded 
}: { 
  testEquipmentAdded: boolean
  setTestEquipmentAdded: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const { addTestEquipment, resetUnit, getDebugInfo } = useUnit()

  // Add test equipment on first load
  React.useEffect(() => {
    if (!testEquipmentAdded && addTestEquipment) {
      console.log('Adding test equipment...')
      
      // Test equipment to demonstrate the system
      const testEquipment = [
        {
          id: 'ac20-1',
          name: 'AC/20',
          requiredSlots: 10,
          weight: 14,
          type: 'weapon' as const,
          techBase: 'Inner Sphere' as const
        },
        {
          id: 'ppc-1',
          name: 'PPC',
          requiredSlots: 3,
          weight: 7,
          type: 'weapon' as const,
          techBase: 'Inner Sphere' as const
        },
        {
          id: 'lrm10-1',
          name: 'LRM 10',
          requiredSlots: 2,
          weight: 5,
          type: 'weapon' as const,
          techBase: 'Inner Sphere' as const
        },
        {
          id: 'mlaser-1',
          name: 'Medium Laser',
          requiredSlots: 1,
          weight: 1,
          type: 'weapon' as const,
          techBase: 'Inner Sphere' as const
        },
        {
          id: 'hsink-1',
          name: 'Heat Sink',
          requiredSlots: 1,
          weight: 1,
          type: 'heat_sink' as const,
          techBase: 'Inner Sphere' as const
        },
        {
          id: 'hsink-2',
          name: 'Heat Sink',
          requiredSlots: 1,
          weight: 1,
          type: 'heat_sink' as const,
          techBase: 'Inner Sphere' as const
        }
      ]

      // Add equipment to various locations
      addTestEquipment(testEquipment[0], 'Center Torso') // AC/20 - should get displaced by XL engine
      addTestEquipment(testEquipment[1], 'Left Torso', 3) // PPC - should get displaced by XL engine  
      addTestEquipment(testEquipment[2], 'Right Torso', 6) // LRM 10 - should survive
      addTestEquipment(testEquipment[3], 'Head') // Medium Laser - should survive
      addTestEquipment(testEquipment[4], 'Left Arm', 4) // Heat Sink - should survive
      addTestEquipment(testEquipment[5], 'Right Arm', 4) // Heat Sink - should survive

      setTestEquipmentAdded(true)
      console.log('Test equipment added')
    }
  }, [testEquipmentAdded, addTestEquipment, setTestEquipmentAdded])

  const handleReset = () => {
    const defaultConfig: UnitConfiguration = {
      engineType: 'Standard',
      gyroType: 'Standard',
      mass: 75,
      unitType: 'BattleMech'
    }
    resetUnit(defaultConfig)
    setTestEquipmentAdded(false)
  }

  const handleDebugLog = () => {
    console.log('Debug Info:', getDebugInfo())
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-white text-3xl font-bold mb-2">Critical Slots V2 Demo</h1>
          <p className="text-gray-400 text-lg">
            Demonstration of the new layered critical slot system with engine/gyro changes and equipment displacement
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900 border border-blue-600 text-blue-100 p-4 rounded-lg mb-6">
          <h3 className="font-bold text-sm mb-2">Demo Instructions:</h3>
          <ul className="text-xs space-y-1">
            <li>• The mech starts with Standard Engine + Standard Gyro and some test equipment</li>
            <li>• Try changing to XL Engine to see equipment displacement in action</li>
            <li>• Change to XL Gyro to see how it shifts engine slots and displaces equipment</li>
            <li>• Watch the Unallocated Equipment section to see displaced items</li>
            <li>• Notice how multi-slot equipment (AC/20, PPC) moves as complete units</li>
          </ul>
        </div>

        {/* Unified Color Legend - Place at top for reference */}
        <div className="mb-6">
          <UnifiedColorLegend />
        </div>

        {/* Controls */}
        <div className="mb-6">
          <SystemComponentControls />
        </div>

        {/* Demo Controls */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-6">
          <h3 className="text-white text-lg font-bold mb-3">Demo Controls</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleReset}
              className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              Reset Demo
            </button>
            <button
              onClick={handleDebugLog}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              Log Debug Info
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          {/* Critical Slots - Takes up 2 columns */}
          <div className="xl:col-span-2">
            <CriticalSlotsDisplay />
          </div>
          
          {/* Unallocated Equipment - Takes up 1 column */}
          <div className="xl:col-span-1">
            <UnallocatedEquipmentDisplay />
          </div>
        </div>

        {/* All Equipment Manifest - Full width */}
        <div className="mb-6">
          <AllEquipmentDisplay />
        </div>

        {/* Equipment Browser - Add equipment from database */}
        <div className="mb-6">
          <EquipmentBrowser />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Critical Slots V2 System - Layered Architecture Demo</p>
        </div>
      </div>
    </div>
  )
}

export default function CriticalSlotsV2Demo() {
  return <DemoContent />
}
