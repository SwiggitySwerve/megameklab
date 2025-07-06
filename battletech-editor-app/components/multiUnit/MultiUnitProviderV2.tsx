/**
 * Multi-Unit Provider V2 - Service-Based Architecture
 * 
 * Refactored to use dedicated services for clean separation of concerns:
 * - MultiUnitStateService: Tab management and persistence
 * - UnitSynchronizationService: Cross-unit sync and debounced saves
 * - UnitComparisonService: Statistics and analysis (on-demand)
 * 
 * Phase 4: Component Modularization - Day 19-20
 * Reduced from 839 lines → ~200 lines coordinator
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useReducer } from 'react'
import { UnitCriticalManager, UnitConfiguration } from '../../utils/criticalSlots/UnitCriticalManager'
import { EngineType, GyroType } from '../../utils/criticalSlots/SystemComponentRules'
import { EquipmentAllocation } from '../../utils/criticalSlots/CriticalSlot'
import { MultiTabDebouncedSaveManager, SaveManagerBrowserHandlers } from '../../utils/DebouncedSaveManager'

// Import the extracted services
import { 
  MultiUnitStateService, 
  TabUnit, 
  MultiUnitState 
} from '../../services/MultiUnitStateService'
import { 
  UnitSynchronizationService,
  SynchronizationOptions 
} from '../../services/UnitSynchronizationService'
import { UnitComparisonService } from '../../services/UnitComparisonService'

// Context value interface (unchanged for backward compatibility)
interface MultiUnitContextValue {
  // State
  tabs: TabUnit[]
  activeTab: TabUnit | null
  activeTabId: string | null
  
  // Tab management
  createTab: (name?: string, config?: UnitConfiguration) => string
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  renameTab: (tabId: string, newName: string) => void
  duplicateTab: (tabId: string) => string
  
  // Active tab unit operations (proxy to current tab's unit)
  unit: UnitCriticalManager | null
  engineType: EngineType | null
  gyroType: GyroType | null
  unallocatedEquipment: EquipmentAllocation[]
  validation: any
  summary: any
  isConfigLoaded: boolean
  selectedEquipmentId: string | null
  
  // Active tab action functions
  changeEngine: (engineType: EngineType) => void
  changeGyro: (gyroType: GyroType) => void
  updateConfiguration: (config: UnitConfiguration) => void
  addTestEquipment: (equipment: any, location: string, startSlot?: number) => boolean
  addEquipmentToUnit: (equipment: any) => void
  removeEquipment: (equipmentGroupId: string) => boolean
  resetUnit: (config?: UnitConfiguration) => void
  selectEquipment: (equipmentGroupId: string | null) => void
  assignSelectedEquipment: (location: string, slotIndex: number) => boolean
  getDebugInfo: () => any
  
  // New service-based features
  getComparisonAnalysis: () => any
  getSyncStats: () => any
  forceSaveAll: () => void
}

const MultiUnitContext = createContext<MultiUnitContextValue | null>(null)

interface MultiUnitProviderProps {
  children: React.ReactNode
  syncOptions?: Partial<SynchronizationOptions>
}

export function MultiUnitProvider({ children, syncOptions }: MultiUnitProviderProps) {
  // Core state
  const [state, setState] = useState<MultiUnitState>({
    tabs: [],
    activeTabId: null,
    nextTabNumber: 1
  })
  
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Service instances
  const [stateService] = useState(() => new MultiUnitStateService())
  const [saveManager] = useState(() => new MultiTabDebouncedSaveManager(1000))
  const [syncService] = useState(() => new UnitSynchronizationService(
    stateService,
    saveManager,
    syncOptions
  ))
  const [comparisonService] = useState(() => new UnitComparisonService())
  
  // Force update mechanism for React re-renders
  const [, forceUpdate] = useReducer(x => x + 1, 0)
  
  // Initialize browser event handlers for save flushing
  useEffect(() => {
    if (isClient) {
      const browserHandlers = SaveManagerBrowserHandlers.getInstance()
      browserHandlers.attachSaveManager(saveManager)
      
      return () => {
        browserHandlers.detachSaveManager()
      }
    }
  }, [isClient, saveManager])
  
  // Initialize on client-side
  useEffect(() => {
    setIsClient(true)
    initializeTabs()
  }, [])
  
  // Subscribe to state service changes
  useEffect(() => {
    const unsubscribe = stateService.subscribe(() => {
      forceUpdate()
    })
    
    return unsubscribe
  }, [stateService])
  
  // Initialize tabs using the state service
  const initializeTabs = useCallback(async () => {
    try {
      const initialState = await stateService.initializeTabs()
      setState(initialState)
      
      // Initialize synchronization for all tabs
      for (const tab of initialState.tabs) {
        syncService.initializeTabSync(tab)
      }
      
      setIsInitialized(true)
      console.log('[MultiUnitProviderV2] Initialization complete with service architecture')
    } catch (error) {
      console.error('[MultiUnitProviderV2] Failed to initialize:', error)
      setIsInitialized(true) // Allow fallback rendering
    }
  }, [stateService, syncService])
  
  // Get active tab
  const activeTab = state.tabs.find(t => t.id === state.activeTabId) || null
  
  // Tab management functions (delegated to services)
  const createTab = useCallback((name?: string, config?: UnitConfiguration): string => {
    const { newState, tabId } = stateService.createTab(state, name, config)
    setState(newState)
    
    // Initialize sync for new tab
    const newTab = newState.tabs.find(t => t.id === tabId)
    if (newTab) {
      syncService.initializeTabSync(newTab)
    }
    
    return tabId
  }, [state, stateService, syncService])
  
  const closeTab = useCallback((tabId: string) => {
    // Clean up sync before closing
    syncService.cleanupTabSync(tabId)
    
    const newState = stateService.closeTab(state, tabId)
    setState(newState)
  }, [state, stateService, syncService])
  
  const setActiveTab = useCallback((tabId: string) => {
    const newState = stateService.setActiveTab(state, tabId)
    setState(newState)
  }, [state, stateService])
  
  const renameTab = useCallback((tabId: string, newName: string) => {
    const newState = stateService.renameTab(state, tabId, newName)
    setState(newState)
  }, [state, stateService])
  
  const duplicateTab = useCallback((tabId: string): string => {
    const { newState, newTabId } = stateService.duplicateTab(state, tabId)
    setState(newState)
    
    // Initialize sync for duplicated tab
    const newTab = newState.tabs.find(t => t.id === newTabId)
    if (newTab) {
      syncService.initializeTabSync(newTab)
    }
    
    return newTabId
  }, [state, stateService, syncService])
  
  // Active tab action functions (delegated to synchronization service)
  const updateConfiguration = useCallback((config: UnitConfiguration) => {
    if (!activeTab) return
    
    syncService.updateConfiguration(activeTab, config)
    forceUpdate() // Trigger React re-render
  }, [activeTab, syncService])
  
  const changeEngine = useCallback((engineType: EngineType) => {
    if (!activeTab) return
    
    syncService.changeEngine(activeTab, engineType)
    forceUpdate()
  }, [activeTab, syncService])
  
  const changeGyro = useCallback((gyroType: GyroType) => {
    if (!activeTab) return
    
    syncService.changeGyro(activeTab, gyroType)
    forceUpdate()
  }, [activeTab, syncService])
  
  const addEquipmentToUnit = useCallback((equipment: any) => {
    if (!activeTab) return
    
    syncService.addEquipmentToUnit(activeTab, equipment)
    forceUpdate()
  }, [activeTab, syncService])
  
  const removeEquipment = useCallback((equipmentGroupId: string): boolean => {
    if (!activeTab) return false
    
    const result = syncService.removeEquipment(activeTab, equipmentGroupId)
    if (result) forceUpdate()
    return result
  }, [activeTab, syncService])
  
  const resetUnit = useCallback((config?: UnitConfiguration) => {
    if (!activeTab) return
    
    syncService.resetUnit(activeTab, config)
    forceUpdate()
  }, [activeTab, syncService])
  
  const assignSelectedEquipment = useCallback((location: string, slotIndex: number): boolean => {
    if (!selectedEquipmentId || !activeTab) return false
    
    const success = syncService.assignEquipment(activeTab, selectedEquipmentId, location, slotIndex)
    
    if (success) {
      setSelectedEquipmentId(null) // Clear selection
      forceUpdate()
    }
    
    return success
  }, [selectedEquipmentId, activeTab, syncService])
  
  // Legacy compatibility functions
  const addTestEquipment = useCallback((equipment: any, location: string, startSlot?: number): boolean => {
    if (!activeTab) return false
    
    const result = activeTab.stateManager.addTestEquipment(equipment, location, startSlot)
    if (result) {
      activeTab.isModified = true
      activeTab.modified = new Date()
      forceUpdate()
    }
    
    return result
  }, [activeTab])
  
  // Service-based analysis functions
  const getComparisonAnalysis = useCallback(() => {
    return comparisonService.compareUnits(state.tabs)
  }, [state.tabs, comparisonService])
  
  const getSyncStats = useCallback(() => {
    return syncService.getSyncStats()
  }, [syncService])
  
  const forceSaveAll = useCallback(() => {
    syncService.forceSaveAll()
  }, [syncService])
  
  // Context value
  const contextValue: MultiUnitContextValue = {
    // State
    tabs: state.tabs,
    activeTab,
    activeTabId: state.activeTabId,
    
    // Tab management
    createTab,
    closeTab,
    setActiveTab,
    renameTab,
    duplicateTab,
    
    // Active tab unit data (proxy to active tab's unit)
    unit: activeTab?.unitManager || null,
    engineType: activeTab?.unitManager.getEngineType() || null,
    gyroType: (activeTab?.unitManager.getGyroType() as GyroType) || null,
    unallocatedEquipment: activeTab?.unitManager.getUnallocatedEquipment() || [],
    validation: activeTab?.stateManager.getUnitSummary().validation || null,
    summary: activeTab?.stateManager.getUnitSummary().summary || null,
    isConfigLoaded: isInitialized,
    selectedEquipmentId,
    
    // Active tab action functions
    changeEngine,
    changeGyro,
    updateConfiguration,
    addTestEquipment,
    addEquipmentToUnit,
    removeEquipment,
    resetUnit,
    selectEquipment: (equipmentGroupId: string | null) => {
      setSelectedEquipmentId(equipmentGroupId)
    },
    assignSelectedEquipment,
    getDebugInfo: () => {
      return activeTab?.stateManager.getDebugInfo() || null
    },
    
    // New service-based features
    getComparisonAnalysis,
    getSyncStats,
    forceSaveAll
  }
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      syncService.cleanup()
    }
  }, [syncService])
  
  // Don't render until initialized
  if (!isClient || !isInitialized) {
    console.log('[MultiUnitProviderV2] Still initializing...', { isClient, isInitialized })
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading BattleTech Editor...</div>
      </div>
    )
  }
  
  console.log('[MultiUnitProviderV2] Rendering with service architecture:', { 
    isClient, 
    isInitialized, 
    tabsCount: state.tabs.length, 
    activeTabId: state.activeTabId 
  })
  
  return (
    <MultiUnitContext.Provider value={contextValue}>
      {children}
    </MultiUnitContext.Provider>
  )
}

// Custom hook for consuming the context (unchanged for compatibility)
export function useMultiUnit(): MultiUnitContextValue {
  const context = useContext(MultiUnitContext)
  if (!context) {
    throw new Error('useMultiUnit must be used within MultiUnitProvider')
  }
  return context
}

// Legacy compatibility hook - proxies to active tab's unit (unchanged)
export function useUnit() {
  const multiUnit = useMultiUnit()
  
  if (!multiUnit.unit) {
    throw new Error('No active unit available')
  }
  
  return {
    unit: multiUnit.unit,
    engineType: multiUnit.engineType!,
    gyroType: multiUnit.gyroType!,
    unallocatedEquipment: multiUnit.unallocatedEquipment,
    validation: multiUnit.validation,
    summary: multiUnit.summary,
    isConfigLoaded: multiUnit.isConfigLoaded,
    selectedEquipmentId: multiUnit.selectedEquipmentId,
    changeEngine: multiUnit.changeEngine,
    changeGyro: multiUnit.changeGyro,
    updateConfiguration: multiUnit.updateConfiguration,
    addTestEquipment: multiUnit.addTestEquipment,
    addEquipmentToUnit: multiUnit.addEquipmentToUnit,
    removeEquipment: multiUnit.removeEquipment,
    resetUnit: multiUnit.resetUnit,
    selectEquipment: multiUnit.selectEquipment,
    assignSelectedEquipment: multiUnit.assignSelectedEquipment,
    getDebugInfo: multiUnit.getDebugInfo
  }
}

// Export the TabUnit interface for backward compatibility
export type { TabUnit }
