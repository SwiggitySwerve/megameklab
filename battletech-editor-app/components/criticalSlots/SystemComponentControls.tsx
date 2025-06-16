/**
 * System Component Controls - Engine and Gyro type selection
 * Dark theme component with dropdowns for system component changes
 */

import React from 'react'
import { useUnit } from './UnitProvider'
import { EngineType, GyroType } from '../../utils/criticalSlots/SystemComponentRules'

export function SystemComponentControls() {
  const { engineType, gyroType, changeEngine, changeGyro, validation } = useUnit()

  const engineOptions: EngineType[] = ['Standard', 'XL', 'Light', 'XXL', 'Compact']
  const gyroOptions: GyroType[] = ['Standard', 'XL', 'Compact', 'Heavy-Duty']

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <h2 className="text-white text-lg font-bold mb-4">System Components</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-white block mb-2 text-sm font-medium">Engine Type:</label>
          <select 
            value={engineType} 
            onChange={(e) => changeEngine(e.target.value as EngineType)}
            className="bg-gray-700 text-white p-2 rounded w-full border border-gray-600 
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          >
            {engineOptions.map(option => (
              <option key={option} value={option}>
                {option} Engine
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-white block mb-2 text-sm font-medium">Gyro Type:</label>
          <select 
            value={gyroType} 
            onChange={(e) => changeGyro(e.target.value as GyroType)}
            className="bg-gray-700 text-white p-2 rounded w-full border border-gray-600 
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          >
            {gyroOptions.map(option => (
              <option key={option} value={option}>
                {option} Gyro
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Validation Messages */}
      {!validation.isValid && (
        <div className="mb-4">
          <div className="bg-red-900 border border-red-600 text-red-100 p-3 rounded">
            <h4 className="font-bold text-sm mb-2">Validation Errors:</h4>
            <ul className="text-xs space-y-1">
              {validation.errors.map((error: string, index: number) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {validation.warnings && validation.warnings.length > 0 && (
        <div className="mb-4">
          <div className="bg-yellow-900 border border-yellow-600 text-yellow-100 p-3 rounded">
            <h4 className="font-bold text-sm mb-2">Warnings:</h4>
            <ul className="text-xs space-y-1">
              {validation.warnings.map((warning: string, index: number) => (
                <li key={index}>• {warning}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Current Configuration Display */}
      <div className="bg-gray-900 border border-gray-600 p-3 rounded">
        <h4 className="text-gray-300 text-sm font-medium mb-2">Current Configuration:</h4>
        <div className="text-xs text-gray-400 space-y-1">
          <div><span className="text-red-400">Engine:</span> {engineType}</div>
          <div><span className="text-purple-400">Gyro:</span> {gyroType}</div>
          <div><span className="text-blue-400">Status:</span> {validation.isValid ? 'Valid' : 'Invalid'}</div>
        </div>
      </div>
    </div>
  )
}
