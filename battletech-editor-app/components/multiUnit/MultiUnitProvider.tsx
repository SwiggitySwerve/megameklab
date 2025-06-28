/**
 * Multi-Unit Provider - Manages multiple unit instances with independent tabs
 * Each tab maintains its own UnitCriticalManager and UnitStateManager
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react'
import { UnitStateManager } from '../../utils/criticalSlots/UnitStateManager'
import { UnitCriticalManager, UnitConfiguration } from '../../utils/criticalSlots/UnitCriticalManager'
import { EngineType, GyroType } from '../../utils/criticalSlots/SystemComponentRules'
import { EquipmentAllocation } from '../../utils/criticalSlots/CriticalSlot'

// Tab unit interface
export interface TabUnit {
  id: string
  name: string
  unitManager: UnitCriticalManager
  stateManager: UnitStateManager
  created: Date
  modified: Date
  isModified: boolean
}

// Multi-unit state interface
interface MultiUnitState {
  tabs: TabUnit[]
  activeTabId: string | null
  nextTabNumber: number
}

// Context value interface
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
}

const MultiUnitContext = createContext<MultiUnitContextValue | null>(null)

// Default unit configuration for new units
const createDefaultConfiguration = (): UnitConfiguration => ({
  tonnage: 50,
  unitType: 'BattleMech',
  techBase: 'Inner Sphere',
  walkMP: 4,
  engineRating: 200,
  runMP: 6,
  engineType: 'Standard',
  gyroType: 'Standard',
  structureType: 'Standard',
  armorType: 'Standard',
  armorAllocation: {
    HD: { front: 9, rear: 0 },
    CT: { front: 20, rear: 6 },
    LT: { front: 16, rear: 5 },
    RT: { front: 16, rear: 5 },
    LA: { front: 16, rear: 0 },
    RA: { front: 16, rear: 0 },
    LL: { front: 20, rear: 0 },
    RL: { front: 20, rear: 0 }
  },
  armorTonnage: 8.0,
  heatSinkType: 'Single',
  totalHeatSinks: 10,
  internalHeatSinks: 8,
  externalHeatSinks: 2,
  enhancementType: null,
  jumpMP: 0,
  jumpJetType: 'Standard Jump Jet',
  jumpJetCounts: {},
  hasPartialWing: false,
  mass: 50
})

// Storage keys
const TABS_METADATA_KEY = 'battletech-tabs-metadata'
const TAB_DATA_PREFIX = 'battletech-unit-tab-'
const LEGACY_CONFIG_KEY = 'battletech-unit-configuration'

interface TabsMetadata {
  activeTabId: string | null
  nextTabNumber: number
  tabOrder: string[]
  tabNames: Record<string, string>
}

interface MultiUnitProviderProps {
  children: React.ReactNode
}

export function MultiUnitProvider({ children }: MultiUnitProviderProps) {
  const [state, setState] = useState<MultiUnitState>({
    tabs: [],
    activeTabId: null,
    nextTabNumber: 1
  })
  
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Initialize on client-side
  useEffect(() => {
    setIsClient(true)
    initializeTabs()
  }, [])
  
  // Initialize tabs from storage or create default
  const initializeTabs = useCallback(() => {
    if (typeof window === 'undefined') return
    
    try {
      // Check for existing tabs
      const metadataStr = localStorage.getItem(TABS_METADATA_KEY)
      
      if (metadataStr) {
        // Load existing tabs
        const metadata: TabsMetadata = JSON.parse(metadataStr)
        const tabs: TabUnit[] = []
        
        for (const tabId of metadata.tabOrder) {
          const tabDataStr = localStorage.getItem(`${TAB_DATA_PREFIX}${tabId}`)
          if (tabDataStr) {
            const tabData = JSON.parse(tabDataStr)
            const tab = createTabFromData(tabId, metadata.tabNames[tabId] || 'New Mech', tabData.config)
            tabs.push(tab)
          }
        }
        
        if (tabs.length > 0) {
          setState({
            tabs,
            activeTabId: metadata.activeTabId || tabs[0].id,
            nextTabNumber: metadata.nextTabNumber
          })
          setIsInitialized(true)
          return
        }
      }
      
      // Check for legacy single unit config
      const legacyConfigStr = localStorage.getItem(LEGACY_CONFIG_KEY)
      let initialConfig = createDefaultConfiguration()
      let tabName = 'New Mech'
      
      if (legacyConfigStr) {
        try {
          const legacyConfig = JSON.parse(legacyConfigStr)
          initialConfig = { ...initialConfig, ...legacyConfig }
          tabName = `${initialConfig.tonnage}t Mech`
          
          // Remove legacy config after migration
          localStorage.removeItem(LEGACY_CONFIG_KEY)
        } catch (error) {
          console.warn('Failed to migrate legacy configuration:', error)
        }
      }
      
      // Create first tab
      const firstTab = createTabFromData('tab-1', tabName, initialConfig)
      setState({
        tabs: [firstTab],
        activeTabId: firstTab.id,
        nextTabNumber: 2
      })
      
      // Save initial state
      saveTabsMetadata({
        activeTabId: firstTab.id,
        nextTabNumber: 2,
        tabOrder: [firstTab.id],
        tabNames: { [firstTab.id]: tabName }
      })
      
      saveTabData(firstTab.id, initialConfig)
      
    } catch (error) {
      console.error('Failed to initialize tabs:', error)
      
      // Fallback: create default tab
      const defaultTab = createTabFromData('tab-1', 'New Mech', createDefaultConfiguration())
      setState({
        tabs: [defaultTab],
        activeTabId: defaultTab.id,
        nextTabNumber: 2
      })
    }
    
    setIsInitialized(true)
  }, [])
  
  // Create tab from configuration data
  const createTabFromData = (id: string, name: string, config: UnitConfiguration): TabUnit => {
    const stateManager = new UnitStateManager(config)
    const unitManager = stateManager.getCurrentUnit()
    
    return {
      id,
      name,
      unitManager,
      stateManager,
      created: new Date(),
      modified: new Date(),
      isModified: false
    }
  }
  
  // Save tabs metadata to localStorage
  const saveTabsMetadata = (metadata: TabsMetadata) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(TABS_METADATA_KEY, JSON.stringify(metadata))
    } catch (error) {
      console.warn('Failed to save tabs metadata:', error)
    }
  }
  
  // Save individual tab data
  const saveTabData = (tabId: string, config: UnitConfiguration) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(`${TAB_DATA_PREFIX}${tabId}`, JSON.stringify({
        config,
        modified: new Date().toISOString()
      }))
    } catch (error) {
      console.warn('Failed to save tab data:', error)
    }
  }
  
  // Create new tab
  const createTab = useCallback((name?: string, config?: UnitConfiguration): string => {
    const tabId = `tab-${state.nextTabNumber}`
    const tabName = name || `New Mech ${state.nextTabNumber === 1 ? '' : state.nextTabNumber}`.trim()
    const tabConfig = config || createDefaultConfiguration()
    
    const newTab = createTabFromData(tabId, tabName, tabConfig)
    
    const newTabs = [...state.tabs, newTab]
    const newState = {
      tabs: newTabs,
      activeTabId: tabId,
      nextTabNumber: state.nextTabNumber + 1
    }
    
    setState(newState)
    
    // Save to localStorage
    const metadata: TabsMetadata = {
      activeTabId: tabId,
      nextTabNumber: newState.nextTabNumber,
      tabOrder: newTabs.map(t => t.id),
      tabNames: Object.fromEntries(newTabs.map(t => [t.id, t.name]))
    }
    
    saveTabsMetadata(metadata)
    saveTabData(tabId, tabConfig)
    
    return tabId
  }, [state])
  
  // Close tab
  const closeTab = useCallback((tabId: string) => {
    if (state.tabs.length <= 1) {
      // Don't close the last tab, just reset it
      const tab = state.tabs[0]
      if (tab) {
        const defaultConfig = createDefaultConfiguration()
        tab.unitManager.updateConfiguration(defaultConfig)
        tab.name = 'New Mech'
        tab.isModified = false
        tab.modified = new Date()
        
        setState(prevState => ({
          ...prevState,
          tabs: [{ ...tab }]
        }))
        
        saveTabData(tab.id, defaultConfig)
      }
      return
    }
    
    const newTabs = state.tabs.filter(t => t.id !== tabId)
    let newActiveTabId = state.activeTabId
    
    // If closing active tab, switch to first remaining tab
    if (tabId === state.activeTabId) {
      newActiveTabId = newTabs[0]?.id || null
    }
    
    const newState = {
      tabs: newTabs,
      activeTabId: newActiveTabId,
      nextTabNumber: state.nextTabNumber
    }
    
    setState(newState)
    
    // Update localStorage
    const metadata: TabsMetadata = {
      activeTabId: newActiveTabId,
      nextTabNumber: state.nextTabNumber,
      tabOrder: newTabs.map(t => t.id),
      tabNames: Object.fromEntries(newTabs.map(t => [t.id, t.name]))
    }
    
    saveTabsMetadata(metadata)
    
    // Remove tab data from localStorage
    try {
      localStorage.removeItem(`${TAB_DATA_PREFIX}${tabId}`)
    } catch (error) {
      console.warn('Failed to remove tab data:', error)
    }
  }, [state])
  
  // Set active tab
  const setActiveTab = useCallback((tabId: string) => {
    if (state.activeTabId === tabId) return
    
    setState(prevState => ({
      ...prevState,
      activeTabId: tabId
    }))
    
    // Update metadata
    const metadata: TabsMetadata = {
      activeTabId: tabId,
      nextTabNumber: state.nextTabNumber,
      tabOrder: state.tabs.map(t => t.id),
      tabNames: Object.fromEntries(state.tabs.map(t => [t.id, t.name]))
    }
    
    saveTabsMetadata(metadata)
  }, [state])
  
  // Rename tab
  const renameTab = useCallback((tabId: string, newName: string) => {
    const newTabs = state.tabs.map(tab => 
      tab.id === tabId 
        ? { ...tab, name: newName, modified: new Date(), isModified: true }
        : tab
    )
    
    setState(prevState => ({
      ...prevState,
      tabs: newTabs
    }))
    
    // Update metadata
    const metadata: TabsMetadata = {
      activeTabId: state.activeTabId,
      nextTabNumber: state.nextTabNumber,
      tabOrder: newTabs.map(t => t.id),
      tabNames: Object.fromEntries(newTabs.map(t => [t.id, t.name]))
    }
    
    saveTabsMetadata(metadata)
  }, [state])
  
  // Duplicate tab
  const duplicateTab = useCallback((tabId: string): string => {
    const sourceTab = state.tabs.find(t => t.id === tabId)
    if (!sourceTab) return ''
    
    const sourceConfig = sourceTab.unitManager.getConfiguration()
    const newTabName = `${sourceTab.name} Copy`
    
    return createTab(newTabName, sourceConfig)
  }, [state, createTab])
  
  // Get active tab
  const activeTab = state.tabs.find(t => t.id === state.activeTabId) || null
  
  // Proxy functions for active tab's unit operations
  const updateActiveTabConfiguration = useCallback((config: UnitConfiguration) => {
    if (!activeTab) return
    
    console.log('[MultiUnitProvider] updateActiveTabConfiguration called with config:', config)
    console.log('[MultiUnitProvider] activeTab.unitManager:', activeTab.unitManager)
    
    activeTab.unitManager.updateConfiguration(config)
    activeTab.isModified = true
    activeTab.modified = new Date()
    
    // Update state to trigger re-render
    setState(prevState => ({
      ...prevState,
      tabs: prevState.tabs.map(tab => 
        tab.id === activeTab.id ? { ...activeTab } : tab
      )
    }))
    
    // Save to localStorage
    saveTabData(activeTab.id, config)
    
    console.log('[MultiUnitProvider] Configuration update complete')
  }, [activeTab])
  
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
    gyroType: activeTab?.unitManager.getGyroType() || null,
    unallocatedEquipment: activeTab?.unitManager.getUnallocatedEquipment() || [],
    validation: activeTab?.stateManager.getUnitSummary().validation || null,
    summary: activeTab?.stateManager.getUnitSummary().summary || null,
    isConfigLoaded: isInitialized,
    selectedEquipmentId,
    
    // Active tab action functions
    changeEngine: (engineType: EngineType) => {
      if (!activeTab) return
      activeTab.stateManager.handleEngineChange(engineType)
      setState(prevState => ({ ...prevState })) // Force re-render
    },
    changeGyro: (gyroType: GyroType) => {
      if (!activeTab) return
      activeTab.stateManager.handleGyroChange(gyroType)
      setState(prevState => ({ ...prevState })) // Force re-render
    },
    updateConfiguration: updateActiveTabConfiguration,
    addTestEquipment: (equipment: any, location: string, startSlot?: number) => {
      if (!activeTab) return false
      return activeTab.stateManager.addTestEquipment(equipment, location, startSlot)
    },
    addEquipmentToUnit: (equipment: any) => {
      if (!activeTab) return
      activeTab.stateManager.addUnallocatedEquipment(equipment)
      setState(prevState => ({ ...prevState })) // Force re-render
    },
    removeEquipment: (equipmentGroupId: string) => {
      if (!activeTab) return false
      const result = activeTab.stateManager.removeEquipment(equipmentGroupId)
      setState(prevState => ({ ...prevState })) // Force re-render
      return result
    },
    resetUnit: (config?: UnitConfiguration) => {
      if (!activeTab) return
      activeTab.stateManager.resetUnit(config)
      setState(prevState => ({ ...prevState })) // Force re-render
    },
    selectEquipment: (equipmentGroupId: string | null) => {
      setSelectedEquipmentId(equipmentGroupId)
    },
    assignSelectedEquipment: (location: string, slotIndex: number) => {
      if (!selectedEquipmentId || !activeTab) return false
      
      const success = activeTab.unitManager.allocateEquipmentFromPool(selectedEquipmentId, location, slotIndex)
      if (success) {
        setSelectedEquipmentId(null)
        setState(prevState => ({ ...prevState })) // Force re-render
      }
      return success
    },
    getDebugInfo: () => {
      return activeTab?.stateManager.getDebugInfo() || null
    }
  }
  
  // Don't render until initialized
  if (!isClient || !isInitialized) {
    console.log('[MultiUnitProvider] Still initializing...', { isClient, isInitialized })
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }
  
  console.log('[MultiUnitProvider] Rendering provider with initialized state:', { 
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

// Custom hook for consuming the context
export function useMultiUnit(): MultiUnitContextValue {
  const context = useContext(MultiUnitContext)
  if (!context) {
    throw new Error('useMultiUnit must be used within MultiUnitProvider')
  }
  return context
}

// Legacy compatibility hook - proxies to active tab's unit
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
