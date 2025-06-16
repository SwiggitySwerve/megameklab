/**
 * Unit Provider - React Context provider for critical slots system
 * Manages the state manager and provides context to components
 */

import React, { createContext, useContext, useMemo, useReducer, useEffect } from 'react'
import { UnitStateManager } from '../../utils/criticalSlots/UnitStateManager'
import { UnitCriticalManager, UnitConfiguration } from '../../utils/criticalSlots/UnitCriticalManager'
import { EngineType, GyroType } from '../../utils/criticalSlots/SystemComponentRules'
import { EquipmentAllocation } from '../../utils/criticalSlots/CriticalSlot'

interface UnitContextValue {
  unit: UnitCriticalManager
  engineType: EngineType
  gyroType: GyroType
  unallocatedEquipment: EquipmentAllocation[]
  validation: any
  summary: any
  // Selection state
  selectedEquipmentId: string | null
  // Action functions
  changeEngine: (engineType: EngineType) => void
  changeGyro: (gyroType: GyroType) => void
  updateConfiguration: (config: UnitConfiguration) => void
  addTestEquipment: (equipment: any, location: string, startSlot?: number) => boolean
  addEquipmentToUnit: (equipment: any) => void
  removeEquipment: (equipmentGroupId: string) => boolean
  resetUnit: (config?: UnitConfiguration) => void
  // Selection functions
  selectEquipment: (equipmentGroupId: string | null) => void
  assignSelectedEquipment: (location: string, slotIndex: number) => boolean
  // Debug functions
  getDebugInfo: () => any
}

const UnitContext = createContext<UnitContextValue | null>(null)

interface UnitProviderProps {
  children: React.ReactNode
  initialConfiguration?: UnitConfiguration
}

export function UnitProvider({ children, initialConfiguration }: UnitProviderProps) {
  // Force update mechanism
  const [, forceUpdate] = useReducer(x => x + 1, 0)
  
  // Selection state
  const [selectedEquipmentId, setSelectedEquipmentId] = React.useState<string | null>(null)
  
  // Create state manager once, never recreate
  const stateManager = useMemo(() => {
    console.log('Creating new UnitStateManager...')
    return new UnitStateManager(initialConfiguration)
  }, []) // Empty dependency array - only create once
  
  // Subscribe to state manager changes
  useEffect(() => {
    console.log('Setting up state manager subscription...')
    const unsubscribe = stateManager.subscribe(() => {
      console.log('State manager notified, forcing re-render...')
      forceUpdate() // Trigger re-render when unit changes
    })
    
    return () => {
      console.log('Cleaning up state manager subscription...')
      unsubscribe()
    }
  }, [stateManager])
  
  // Compute context value fresh on each render after state changes
  const unit = stateManager.getCurrentUnit()
  const summary = stateManager.getUnitSummary()
  
  const contextValue = useMemo(() => {
    console.log('Computing new context value...')
    
    return {
      unit,
      engineType: unit.getEngineType(),
      gyroType: unit.getGyroType(),
      unallocatedEquipment: unit.getUnallocatedEquipment(),
      validation: summary.validation,
      summary: summary.summary,
      // Selection state
      selectedEquipmentId,
      // Action functions
      changeEngine: (engineType: EngineType) => {
        console.log(`Context: Changing engine to ${engineType}`)
        stateManager.handleEngineChange(engineType)
      },
      changeGyro: (gyroType: GyroType) => {
        console.log(`Context: Changing gyro to ${gyroType}`)
        stateManager.handleGyroChange(gyroType)
      },
      updateConfiguration: (config: UnitConfiguration) => {
        console.log(`Context: Updating configuration`, config)
        stateManager.handleConfigurationUpdate(config)
      },
      addTestEquipment: (equipment: any, location: string, startSlot?: number) => {
        console.log(`Context: Adding equipment ${equipment.name} to ${location}`)
        return stateManager.addTestEquipment(equipment, location, startSlot)
      },
      addEquipmentToUnit: (equipment: any) => {
        console.log(`Context: Adding equipment ${equipment.name} to unit as unallocated`)
        stateManager.addUnallocatedEquipment(equipment)
      },
      removeEquipment: (equipmentGroupId: string) => {
        console.log(`Context: Removing equipment ${equipmentGroupId}`)
        return stateManager.removeEquipment(equipmentGroupId)
      },
      resetUnit: (config?: UnitConfiguration) => {
        console.log('Context: Resetting unit')
        stateManager.resetUnit(config)
      },
      // Selection functions
      selectEquipment: (equipmentGroupId: string | null) => {
        console.log(`Context: Selecting equipment ${equipmentGroupId}`)
        setSelectedEquipmentId(equipmentGroupId)
      },
      assignSelectedEquipment: (location: string, slotIndex: number): boolean => {
        if (!selectedEquipmentId) {
          console.log('Context: No equipment selected for assignment')
          return false
        }
        
        console.log(`Context: Assigning equipment ${selectedEquipmentId} to ${location} slot ${slotIndex + 1}`)
        const success = stateManager.getCurrentUnit().allocateEquipmentFromPool(selectedEquipmentId, location, slotIndex)
        
        if (success) {
          setSelectedEquipmentId(null) // Clear selection after successful assignment
          forceUpdate() // Force re-render
        }
        
        return success
      },
      getDebugInfo: () => stateManager.getDebugInfo()
    }
  }, [stateManager, unit, summary, selectedEquipmentId]) // Include selectedEquipmentId in dependencies
  
  return (
    <UnitContext.Provider value={contextValue}>
      {children}
    </UnitContext.Provider>
  )
}

// Custom hook for consuming the context
export function useUnit(): UnitContextValue {
  const context = useContext(UnitContext)
  if (!context) {
    throw new Error('useUnit must be used within UnitProvider')
  }
  return context
}
