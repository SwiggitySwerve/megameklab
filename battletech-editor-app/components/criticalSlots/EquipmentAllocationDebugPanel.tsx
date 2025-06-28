/**
 * Equipment Allocation Debug Panel
 * Real-time monitoring and validation of equipment allocation operations
 */

import React, { useState, useEffect, useRef } from 'react'
import { useUnit } from '../multiUnit/MultiUnitProvider'

interface AllocationLog {
  timestamp: string
  operation: string
  details: any
  success: boolean
}

interface DebugPanelState {
  isExpanded: boolean
  showTests: boolean
  showLogs: boolean
  autoRefresh: boolean
}

export function EquipmentAllocationDebugPanel() {
  const { 
    unit, 
    unallocatedEquipment, 
    selectedEquipmentId,
    assignSelectedEquipment,
    selectEquipment
  } = useUnit()

  const [debugState, setDebugState] = useState<DebugPanelState>({
    isExpanded: false,
    showTests: false,
    showLogs: true,
    autoRefresh: true
  })

  const [allocationLogs, setAllocationLogs] = useState<AllocationLog[]>([])
  const [testResults, setTestResults] = useState<any>(null)
  const [realTimeStats, setRealTimeStats] = useState({
    totalUnallocated: 0,
    endoSteelCount: 0,
    ferroFibrousCount: 0,
    selectedEquipment: null as string | null,
    lastUpdate: new Date()
  })

  const logRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Update real-time stats
  useEffect(() => {
    if (debugState.autoRefresh) {
      const updateStats = () => {
        const endoSteel = unallocatedEquipment.filter(eq => eq.equipmentData.name === 'Endo Steel')
        const ferroFibrous = unallocatedEquipment.filter(eq => eq.equipmentData.name === 'Ferro-Fibrous')
        
        setRealTimeStats({
          totalUnallocated: unallocatedEquipment.length,
          endoSteelCount: endoSteel.length,
          ferroFibrousCount: ferroFibrous.length,
          selectedEquipment: selectedEquipmentId,
          lastUpdate: new Date()
        })
      }

      updateStats()
      intervalRef.current = setInterval(updateStats, 500)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [unallocatedEquipment, selectedEquipmentId, debugState.autoRefresh])

  // Log equipment allocation attempts
  const logAllocation = (operation: string, details: any, success: boolean) => {
    const logEntry: AllocationLog = {
      timestamp: new Date(Date.now()).toLocaleTimeString(),
      operation,
      details,
      success
    }
    
    setAllocationLogs(prev => {
      const newLogs = [logEntry, ...prev].slice(0, 50) // Keep last 50 logs
      return newLogs
    })
  }

  // Enhanced allocation wrapper
  const debugAssignSelectedEquipment = (location: string, slotIndex: number) => {
    const beforeCount = unallocatedEquipment.length
    const beforeSelected = selectedEquipmentId
    
    logAllocation('Assignment Attempt', {
      selectedEquipment: beforeSelected,
      targetLocation: location,
      targetSlot: slotIndex,
      unallocatedCountBefore: beforeCount
    }, false)

    const success = assignSelectedEquipment(location, slotIndex)
    
    setTimeout(() => {
      const afterCount = unallocatedEquipment.length
      const afterSelected = selectedEquipmentId
      
      logAllocation('Assignment Result', {
        success,
        unallocatedCountBefore: beforeCount,
        unallocatedCountAfter: afterCount,
        selectedBefore: beforeSelected,
        selectedAfter: afterSelected,
        countChanged: afterCount !== beforeCount,
        selectionCleared: beforeSelected !== null && afterSelected === null
      }, success)
    }, 100)

    return success
  }

  // Run comprehensive tests
  const runTests = async () => {
    try {
      console.log('[DebugPanel] Starting comprehensive tests...')
      console.log('Running external test script...')
      
      // For now, just log that tests would run here
      // The actual test script can be run separately via the standalone script
      logAllocation('Test Info', {
        message: 'Tests disabled in UI. Use standalone test script.',
        script: 'npm run test:equipment-allocation'
      }, true)
      
      setTestResults({
        summary: {
          totalTests: 0,
          passed: 0,
          failed: 0,
          successRate: 0
        },
        results: []
      })
    } catch (error) {
      console.error('[DebugPanel] Test execution failed:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      logAllocation('Test Suite Error', { error: errorMessage }, false)
    }
  }

  // Expose debug functions globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).debugEquipmentAllocation = {
        getStats: () => realTimeStats,
        getLogs: () => allocationLogs,
        getUnit: () => unit,
        runTests,
        clearLogs: () => setAllocationLogs([]),
        testAssignment: debugAssignSelectedEquipment
      }
    }
  }, [realTimeStats, allocationLogs, unit])

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current && allocationLogs.length > 0) {
      logRef.current.scrollTop = 0
    }
  }, [allocationLogs])

  if (!debugState.isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setDebugState(prev => ({ ...prev, isExpanded: true }))}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg"
        >
          🔍 Debug Panel
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white border border-gray-700 rounded-lg shadow-xl max-w-md w-96">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-2 rounded-t-lg flex justify-between items-center">
        <h3 className="font-bold text-sm">Equipment Allocation Debug</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setDebugState(prev => ({ ...prev, autoRefresh: !prev.autoRefresh }))}
            className={`text-xs px-2 py-1 rounded ${debugState.autoRefresh ? 'bg-green-600' : 'bg-gray-600'}`}
          >
            Auto {debugState.autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setDebugState(prev => ({ ...prev, isExpanded: false }))}
            className="text-xs px-2 py-1 bg-red-600 rounded hover:bg-red-700"
          >
            ×
          </button>
        </div>
      </div>

      {/* Stats Display */}
      <div className="p-4 border-b border-gray-700">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-gray-400">Total Unallocated</div>
            <div className="text-lg font-bold text-blue-400">{realTimeStats.totalUnallocated}</div>
          </div>
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-gray-400">Endo Steel</div>
            <div className="text-lg font-bold text-green-400">{realTimeStats.endoSteelCount}</div>
          </div>
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-gray-400">Ferro-Fibrous</div>
            <div className="text-lg font-bold text-purple-400">{realTimeStats.ferroFibrousCount}</div>
          </div>
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-gray-400">Selected</div>
            <div className="text-sm text-yellow-400">
              {realTimeStats.selectedEquipment ? '✓ Selected' : '○ None'}
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Last Update: {realTimeStats.lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex gap-2 mb-2">
          <button
            onClick={runTests}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs py-2 px-3 rounded"
          >
            Run Tests
          </button>
          <button
            onClick={() => setAllocationLogs([])}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-xs py-2 px-3 rounded"
          >
            Clear Logs
          </button>
        </div>
        
        {/* Quick Test Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (unallocatedEquipment.length > 0) {
                selectEquipment(unallocatedEquipment[0].equipmentGroupId)
                logAllocation('Manual Selection', { 
                  equipmentId: unallocatedEquipment[0].equipmentGroupId,
                  equipmentName: unallocatedEquipment[0].equipmentData.name
                }, true)
              }
            }}
            className="flex-1 bg-green-600 hover:bg-green-700 text-xs py-1 px-2 rounded"
            disabled={unallocatedEquipment.length === 0}
          >
            Select First
          </button>
          <button
            onClick={() => {
              selectEquipment(null)
              logAllocation('Manual Deselection', {}, true)
            }}
            className="flex-1 bg-red-600 hover:bg-red-700 text-xs py-1 px-2 rounded"
            disabled={!selectedEquipmentId}
          >
            Deselect
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="p-4 border-b border-gray-700">
          <h4 className="text-sm font-bold mb-2">Test Results</h4>
          <div className="text-xs">
            <div className={`mb-1 ${testResults.summary.failed === 0 ? 'text-green-400' : 'text-red-400'}`}>
              {testResults.summary.passed}/{testResults.summary.totalTests} Passed 
              ({testResults.summary.successRate.toFixed(1)}%)
            </div>
            {testResults.summary.failed > 0 && (
              <div className="text-red-400 text-xs">
                Failed Tests: {testResults.results.filter((r: any) => !r.passed).map((r: any) => r.testName).join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Allocation Logs */}
      {debugState.showLogs && (
        <div className="p-4">
          <h4 className="text-sm font-bold mb-2">Allocation Logs ({allocationLogs.length})</h4>
          <div 
            ref={logRef}
            className="max-h-48 overflow-y-auto text-xs space-y-1"
          >
            {allocationLogs.map((log, index) => (
              <div 
                key={index}
                className={`p-2 rounded ${log.success ? 'bg-green-900' : 'bg-red-900'} border-l-2 ${log.success ? 'border-green-500' : 'border-red-500'}`}
              >
                <div className="flex justify-between">
                  <span className="font-bold">{log.operation}</span>
                  <span className="text-gray-400">{log.timestamp}</span>
                </div>
                <div className="text-gray-300 mt-1">
                  {typeof log.details === 'object' ? (
                    Object.entries(log.details).map(([key, value]) => (
                      <div key={key} className="ml-2">
                        {key}: {String(value)}
                      </div>
                    ))
                  ) : (
                    String(log.details)
                  )}
                </div>
              </div>
            ))}
            {allocationLogs.length === 0 && (
              <div className="text-gray-500 italic">No allocation logs yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Console helper functions
if (typeof window !== 'undefined') {
  (window as any).debugEquipmentHelpers = {
    showDebugPanel: () => {
      console.log('Debug panel should be visible in bottom right corner')
      console.log('Available window.debugEquipmentAllocation methods:')
      console.log('- getStats(): Get current equipment statistics')
      console.log('- getLogs(): Get allocation operation logs')
      console.log('- getUnit(): Get current unit manager instance')
      console.log('- runTests(): Run comprehensive allocation tests')
      console.log('- clearLogs(): Clear allocation logs')
      console.log('- testAssignment(location, slot): Test equipment assignment')
    },
    
    quickTest: () => {
      console.log('Running quick allocation test...')
      if ((window as any).debugEquipmentAllocation) {
        const debug = (window as any).debugEquipmentAllocation
        const stats = debug.getStats()
        console.log('Current stats:', stats)
        
        if (stats.endoSteelCount > 0) {
          console.log('Endo Steel pieces available for testing')
          console.log('Try: window.debugEquipmentAllocation.testAssignment("Left Arm", 4)')
        } else {
          console.log('No Endo Steel pieces available for testing')
        }
      }
    }
  }
  
  console.log('Equipment Allocation Debug Panel loaded!')
  console.log('Use window.debugEquipmentHelpers.showDebugPanel() for help')
}
