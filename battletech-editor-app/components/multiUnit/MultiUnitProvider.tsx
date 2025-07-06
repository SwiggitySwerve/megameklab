/**
 * Multi-Unit Provider - Manages multiple unit instances with independent tabs
 * Each tab maintains its own UnitCriticalManager and UnitStateManager
 * Enhanced with comprehensive persistence and debounced saving
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react'
import { UnitStateManager } from '../../utils/criticalSlots/UnitStateManager'
import { UnitCriticalManager, UnitConfiguration, CompleteUnitState } from '../../utils/criticalSlots/UnitCriticalManager'
import { EngineType, GyroType } from '../../utils/criticalSlots/SystemComponentRules'
import { EquipmentAllocation } from '../../utils/criticalSlots/CriticalSlot'
import { MultiTabDebouncedSaveManager, SaveManagerBrowserHandlers } from '../../utils/DebouncedSaveManager'
import { createComponentConfiguration, createDefaultComponentConfiguration } from '../../types/componentConfiguration'

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

// Action types for proper state management
type MultiUnitAction = 
  | { type: 'CREATE_TAB'; payload: { id: string; name: string; unitManager: UnitCriticalManager; stateManager: UnitStateManager } }
  | { type: 'SET_ACTIVE_TAB'; payload: { tabId: string } }
  | { type: 'UPDATE_TAB_CONFIG'; payload: { tabId: string; config: UnitConfiguration } }
  | { type: 'CLOSE_TAB'; payload: { tabId: string } }
  | { type: 'RENAME_TAB'; payload: { tabId: string; newName: string } }
  | { type: 'DUPLICATE_TAB'; payload: { sourceTabId: string; newTabId: string; newName: string; unitManager: UnitCriticalManager; stateManager: UnitStateManager } }
  | { type: 'SET_NEXT_TAB_NUMBER'; payload: { nextNumber: number } }
  | { type: 'INITIALIZE_TABS'; payload: { tabs: TabUnit[]; activeTabId: string | null; nextTabNumber: number } }

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
  unitVersion: number // CRITICAL: Include unit version to force re-renders
  
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
  // Default chassis/model for new multi-unit tabs
  chassis: 'Custom',
  model: 'New Design',
  tonnage: 50,
  unitType: 'BattleMech',
  techBase: 'Inner Sphere',
  walkMP: 4,
  engineRating: 200,
  runMP: 6,
  engineType: 'Standard' as EngineType,
  gyroType: createDefaultComponentConfiguration('gyro', 'Inner Sphere'),
  structureType: createDefaultComponentConfiguration('structure', 'Inner Sphere'),
  armorType: createDefaultComponentConfiguration('armor', 'Inner Sphere'),
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
  heatSinkType: createDefaultComponentConfiguration('heatSink', 'Inner Sphere'),
  totalHeatSinks: 10,
  internalHeatSinks: 8,
  externalHeatSinks: 2,
  enhancementType: null,
  jumpMP: 0,
  jumpJetType: createDefaultComponentConfiguration('jumpJet', 'Inner Sphere'),
  jumpJetCounts: {},
  hasPartialWing: false,
  mass: 50
})

// Storage keys
const TABS_METADATA_KEY = 'battletech-tabs-metadata'
const TAB_DATA_PREFIX = 'battletech-unit-tab-'
const LEGACY_CONFIG_KEY = 'battletech-unit-configuration'

// Enhanced storage keys for complete state
const COMPLETE_STATE_PREFIX = 'battletech-complete-state-'

interface TabsMetadata {
  activeTabId: string | null
  nextTabNumber: number
  tabOrder: string[]
  tabNames: Record<string, string>
  version?: string  // For future migration support
}

// Enhanced tab data interface
interface EnhancedTabData {
  completeState?: CompleteUnitState  // New complete state format
  config?: UnitConfiguration         // Legacy configuration format
  modified: string
  version: string
}

// CRITICAL: Implement reducer function for proper state management
function multiUnitReducer(state: MultiUnitState, action: MultiUnitAction): MultiUnitState {
  switch (action.type) {
    case 'CREATE_TAB': {
      const newTab: TabUnit = {
        id: action.payload.id,
        name: action.payload.name,
        unitManager: action.payload.unitManager,
        stateManager: action.payload.stateManager,
        created: new Date(),
        modified: new Date(),
        isModified: false
      }
      
      return {
        ...state,
        tabs: [...state.tabs, newTab],
        activeTabId: action.payload.id,
        nextTabNumber: state.nextTabNumber + 1
      }
    }
    
    case 'SET_ACTIVE_TAB': {
      return {
        ...state,
        activeTabId: action.payload.tabId
      }
    }
    
    case 'UPDATE_TAB_CONFIG': {
      const updatedTabs = state.tabs.map(tab => {
        if (tab.id === action.payload.tabId) {
          return {
            ...tab,
            unitManager: tab.unitManager,
            isModified: true,
            modified: new Date()
          }
        }
        return tab
      })
      
      return {
        ...state,
        tabs: updatedTabs
      }
    }
    
    case 'CLOSE_TAB': {
      const remainingTabs = state.tabs.filter(tab => tab.id !== action.payload.tabId)
      let newActiveTabId = state.activeTabId
      
      // If we're closing the active tab, switch to another tab
      if (state.activeTabId === action.payload.tabId) {
        newActiveTabId = remainingTabs.length > 0 ? remainingTabs[0].id : null
      }
      
      return {
        ...state,
        tabs: remainingTabs,
        activeTabId: newActiveTabId
      }
    }
    
    case 'RENAME_TAB': {
      const updatedTabs = state.tabs.map(tab => {
        if (tab.id === action.payload.tabId) {
          return {
            ...tab,
            name: action.payload.newName,
            modified: new Date()
          }
        }
        return tab
      })
      
      return {
        ...state,
        tabs: updatedTabs
      }
    }
    
    case 'DUPLICATE_TAB': {
      const newTab: TabUnit = {
        id: action.payload.newTabId,
        name: action.payload.newName,
        unitManager: action.payload.unitManager,
        stateManager: action.payload.stateManager,
        created: new Date(),
        modified: new Date(),
        isModified: false
      }
      
      return {
        ...state,
        tabs: [...state.tabs, newTab],
        activeTabId: action.payload.newTabId,
        nextTabNumber: state.nextTabNumber + 1
      }
    }
    
    case 'SET_NEXT_TAB_NUMBER': {
      return {
        ...state,
        nextTabNumber: action.payload.nextNumber
      }
    }
    
    case 'INITIALIZE_TABS': {
      return {
        ...state,
        tabs: action.payload.tabs,
        activeTabId: action.payload.activeTabId,
        nextTabNumber: action.payload.nextTabNumber
      }
    }
    
    default:
      return state
  }
}

interface MultiUnitProviderProps {
  children: React.ReactNode
}

export function MultiUnitProvider({ children }: MultiUnitProviderProps) {
  // CRITICAL: Implement proper reducer pattern for complex state management
  const [state, dispatch] = useReducer(multiUnitReducer, {
    tabs: [],
    activeTabId: null,
    nextTabNumber: 1
  })
  
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // CRITICAL FIX: Add unit version to force context value changes
  const [unitVersion, setUnitVersion] = useState(0)
  
  // PROPER ARCHITECTURE: No manual state versioning needed
  // React will naturally re-render when unit reference changes
  
  // Debounced save manager with 1-second delay
  const [saveManager] = useState(() => new MultiTabDebouncedSaveManager(1000))
  
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
          const { config } = loadTabData(tabId)
          const tab = createTabFromDataEnhanced(tabId, metadata.tabNames[tabId] || 'New Mech', config)
          tabs.push(tab)
        }
        
        if (tabs.length > 0) {
          dispatch({
            type: 'INITIALIZE_TABS',
            payload: {
              tabs,
              activeTabId: metadata.activeTabId || tabs[0].id,
              nextTabNumber: metadata.nextTabNumber
            }
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
      dispatch({
        type: 'INITIALIZE_TABS',
        payload: {
          tabs: [firstTab],
          activeTabId: firstTab.id,
          nextTabNumber: 2
        }
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
      dispatch({
        type: 'INITIALIZE_TABS',
        payload: {
          tabs: [defaultTab],
          activeTabId: defaultTab.id,
          nextTabNumber: 2
        }
      })
    }
    
    setIsInitialized(true)
  }, [])
  
  // Force update mechanism for tab state changes
  const [, forceUpdate] = useReducer(x => x + 1, 0)

  // Create tab from configuration data
  const createTabFromData = (id: string, name: string, config: UnitConfiguration): TabUnit => {
    const stateManager = new UnitStateManager(config)
    const unitManager = stateManager.getCurrentUnit()
    
    // Subscribe to unit state changes
    const unsubscribe = unitManager.subscribe(() => {
      console.log(`[MultiUnitProvider] Unit state changed for tab ${id}, forcing re-render`)
      forceUpdate()
    })
    
    // Store unsubscribe function on the unit manager for cleanup
    ;(unitManager as any)._unsubscribe = unsubscribe
    
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
  
  // Enhanced save methods with complete state serialization and debounced saving
  
  /**
   * Save individual tab data with complete state (legacy config for compatibility)
   */
  const saveTabData = (tabId: string, config: UnitConfiguration) => {
    if (typeof window === 'undefined') return
    try {
      const tabData: EnhancedTabData = {
        config, // Legacy format for backward compatibility
        modified: new Date().toISOString(),
        version: '1.0.0'
      }
      localStorage.setItem(`${TAB_DATA_PREFIX}${tabId}`, JSON.stringify(tabData))
    } catch (error) {
      console.warn('Failed to save tab data:', error)
    }
  }

  /**
   * Save complete unit state with debounced saving
   */
  const saveCompleteState = (tabId: string, unitManager: UnitCriticalManager) => {
    const saveHandler = (completeState: CompleteUnitState) => {
      if (typeof window === 'undefined') return
      try {
        const tabData: EnhancedTabData = {
          completeState,
          config: completeState.configuration, // Keep legacy config for compatibility
          modified: new Date().toISOString(),
          version: '2.0.0' // New version with complete state
        }
        localStorage.setItem(`${COMPLETE_STATE_PREFIX}${tabId}`, JSON.stringify(tabData))
        console.log(`[MultiUnitProvider] Saved complete state for tab ${tabId}`)
      } catch (error) {
        console.error('Failed to save complete state:', error)
      }
    }

    const getStateCallback = () => {
      return unitManager.serializeCompleteState()
    }

    // Use debounced saving
    saveManager.scheduleSaveForTab(tabId, saveHandler, getStateCallback)
  }

  /**
   * Save complete state immediately (for critical operations)
   */
  const saveCompleteStateImmediately = (tabId: string, unitManager: UnitCriticalManager) => {
    const saveHandler = (completeState: CompleteUnitState) => {
      if (typeof window === 'undefined') return
      try {
        const tabData: EnhancedTabData = {
          completeState,
          config: completeState.configuration,
          modified: new Date().toISOString(),
          version: '2.0.0'
        }
        localStorage.setItem(`${COMPLETE_STATE_PREFIX}${tabId}`, JSON.stringify(tabData))
        console.log(`[MultiUnitProvider] Saved complete state immediately for tab ${tabId}`)
      } catch (error) {
        console.error('Failed to save complete state immediately:', error)
      }
    }

    const getStateCallback = () => {
      return unitManager.serializeCompleteState()
    }

    // Use immediate saving
    saveManager.saveTabImmediately(tabId, saveHandler, getStateCallback)
  }

  /**
   * Load tab data with complete state support and legacy migration
   */
  const loadTabData = (tabId: string): { config: UnitConfiguration, hasCompleteState: boolean } => {
    if (typeof window === 'undefined') {
      return { config: createDefaultConfiguration(), hasCompleteState: false }
    }

    try {
      // Try to load complete state first
      const completeStateStr = localStorage.getItem(`${COMPLETE_STATE_PREFIX}${tabId}`)
      if (completeStateStr) {
        const tabData: EnhancedTabData = JSON.parse(completeStateStr)
        if (tabData.completeState) {
          console.log(`[MultiUnitProvider] Loaded complete state for tab ${tabId}`)
          return { 
            config: tabData.completeState.configuration, 
            hasCompleteState: true
          }
        }
      }

      // Fallback to legacy configuration format
      const legacyDataStr = localStorage.getItem(`${TAB_DATA_PREFIX}${tabId}`)
      if (legacyDataStr) {
        const legacyData = JSON.parse(legacyDataStr)
        console.log(`[MultiUnitProvider] Loaded legacy config for tab ${tabId}`)
        return { 
          config: legacyData.config || createDefaultConfiguration(), 
          hasCompleteState: false
        }
      }

    } catch (error) {
      console.error(`Failed to load tab data for ${tabId}:`, error)
    }

    return { config: createDefaultConfiguration(), hasCompleteState: false }
  }

  /**
   * Create tab from data with complete state restoration
   */
  const createTabFromDataEnhanced = (id: string, name: string, config: UnitConfiguration): TabUnit => {
    const stateManager = new UnitStateManager(config)
    const unitManager = stateManager.getCurrentUnit()
    
    // Check if we have complete state to restore
    const { hasCompleteState } = loadTabData(id)
    if (hasCompleteState) {
      try {
        const completeStateStr = localStorage.getItem(`${COMPLETE_STATE_PREFIX}${id}`)
        if (completeStateStr) {
          const tabData: EnhancedTabData = JSON.parse(completeStateStr)
          if (tabData.completeState) {
            console.log(`[MultiUnitProvider] Restoring complete state for tab ${id}`)
            const success = unitManager.deserializeCompleteState(tabData.completeState)
            if (success) {
              console.log(`[MultiUnitProvider] Successfully restored complete state for tab ${id}`)
            } else {
              console.warn(`[MultiUnitProvider] Failed to restore complete state for tab ${id}, using config only`)
            }
          }
        }
      } catch (error) {
        console.error(`[MultiUnitProvider] Error restoring complete state for tab ${id}:`, error)
      }
    }

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
  
  // Create new tab
  const createTab = useCallback((name?: string, config?: UnitConfiguration): string => {
    const tabId = `tab-${state.nextTabNumber}`
    const tabName = name || `New Mech ${state.nextTabNumber === 1 ? '' : state.nextTabNumber}`.trim()
    const tabConfig = config || createDefaultConfiguration()
    
    const newTab = createTabFromData(tabId, tabName, tabConfig)
    
    const newTabs = [...state.tabs, newTab]
    
    dispatch({
      type: 'CREATE_TAB',
      payload: {
        id: tabId,
        name: tabName,
        unitManager: newTab.unitManager,
        stateManager: newTab.stateManager
      }
    })
    
    dispatch({
      type: 'SET_ACTIVE_TAB',
      payload: { tabId }
    })
    
    dispatch({
      type: 'SET_NEXT_TAB_NUMBER',
      payload: { nextNumber: state.nextTabNumber + 1 }
    })
    
    // Save to localStorage
    const metadata: TabsMetadata = {
      activeTabId: tabId,
      nextTabNumber: state.nextTabNumber + 1,
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
        
        dispatch({
          type: 'UPDATE_TAB_CONFIG',
          payload: { 
            tabId: tab.id, 
            config: defaultConfig 
          }
        })
        
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
    
    dispatch({
      type: 'CLOSE_TAB',
      payload: { tabId }
    })
    
    if (newActiveTabId !== state.activeTabId) {
      dispatch({
        type: 'SET_ACTIVE_TAB',
        payload: { tabId: newActiveTabId || '' }
      })
    }
    
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
    
    dispatch({
      type: 'SET_ACTIVE_TAB',
      payload: { tabId }
    })
    
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
    dispatch({
      type: 'RENAME_TAB',
      payload: { tabId, newName }
    })
    
    // Update metadata
    const metadata: TabsMetadata = {
      activeTabId: state.activeTabId,
      nextTabNumber: state.nextTabNumber,
      tabOrder: state.tabs.map(t => t.id),
      tabNames: Object.fromEntries(state.tabs.map(t => [t.id, t.name]))
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
  
  // CRITICAL FIX: Subscribe to active tab's unit state changes
  useEffect(() => {
    console.log('[MultiUnitProvider] Subscription useEffect triggered:', {
      hasActiveTab: !!activeTab,
      hasUnitManager: !!activeTab?.unitManager,
      activeTabId: activeTab?.id
    })
    
    if (!activeTab?.unitManager) {
      console.log('[MultiUnitProvider] No active tab or unit manager, skipping subscription')
      return
    }
    
    console.log('[MultiUnitProvider] Setting up subscription to active tab unit changes')
    
    // Subscribe to unit state changes
    const unsubscribe = activeTab.unitManager.subscribe(() => {
      console.log('[MultiUnitProvider] Unit state changed, forcing re-render')
      setUnitVersion(v => v + 1) // Increment unit version to force context value change
      forceUpdate()
    })
    
    // Cleanup subscription when active tab changes
    return () => {
      console.log('[MultiUnitProvider] Cleaning up unit subscription')
      unsubscribe()
    }
  }, [activeTab?.unitManager]) // Re-subscribe when active tab's unit manager changes

  // Proxy functions for active tab's unit operations
  const updateActiveTabConfiguration = useCallback((config: UnitConfiguration) => {
    if (!activeTab) return
    
    console.log('[MultiUnitProvider] updateActiveTabConfiguration called with config:', config)
    console.log('[MultiUnitProvider] activeTab.unitManager:', activeTab.unitManager)
    
    activeTab.unitManager.updateConfiguration(config)
    activeTab.isModified = true
    activeTab.modified = new Date()
    
    // Update state to trigger re-render
    dispatch({
      type: 'UPDATE_TAB_CONFIG',
      payload: { 
        tabId: activeTab.id, 
        config: activeTab.unitManager.getConfiguration() 
      }
    })
    
    // CRITICAL FIX: Save complete state instead of just basic config
    // Configuration changes can include special components that need complete serialization
    saveCompleteStateImmediately(activeTab.id, activeTab.unitManager)
    
    // FALLBACK: Force re-render immediately to ensure UI updates
    console.log('[MultiUnitProvider] Forcing immediate re-render after configuration update')
    setUnitVersion(v => v + 1) // Increment unit version to force context value change
    forceUpdate()
    
    console.log('[MultiUnitProvider] Configuration update complete with full state persistence')
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
    // PROPER ARCHITECTURE: Fresh data from unit each render
    unit: activeTab?.unitManager || null,
    engineType: activeTab?.unitManager.getEngineType() || null,
    gyroType: (activeTab?.unitManager.getGyroType() as GyroType) || null,
    unallocatedEquipment: activeTab?.unitManager.getUnallocatedEquipment() || [],
    validation: activeTab?.stateManager.getUnitSummary().validation || null,
    summary: activeTab?.stateManager.getUnitSummary().summary || null,
    isConfigLoaded: isInitialized,
    selectedEquipmentId,
    unitVersion, // CRITICAL: Include unit version to force re-renders
    
    // Active tab action functions with enhanced persistence
    changeEngine: (engineType: EngineType) => {
      if (!activeTab) return
      activeTab.stateManager.handleEngineChange(engineType)
      activeTab.isModified = true
      activeTab.modified = new Date()
      dispatch({
        type: 'UPDATE_TAB_CONFIG',
        payload: { 
          tabId: activeTab.id, 
          config: activeTab.unitManager.getConfiguration() 
        }
      })
      
      // Save complete state with debouncing (configuration changes are significant)
      saveCompleteStateImmediately(activeTab.id, activeTab.unitManager)
    },
    changeGyro: (gyroType: GyroType) => {
      if (!activeTab) return
      activeTab.stateManager.handleGyroChange(gyroType)
      activeTab.isModified = true
      activeTab.modified = new Date()
      dispatch({
        type: 'UPDATE_TAB_CONFIG',
        payload: { 
          tabId: activeTab.id, 
          config: activeTab.unitManager.getConfiguration() 
        }
      })
      
      // Save complete state with debouncing (configuration changes are significant)
      saveCompleteStateImmediately(activeTab.id, activeTab.unitManager)
    },
    updateConfiguration: updateActiveTabConfiguration,
    addTestEquipment: (equipment: any, location: string, startSlot?: number) => {
      if (!activeTab) return false
      const result = activeTab.stateManager.addTestEquipment(equipment, location, startSlot)
      
      if (result) {
        activeTab.isModified = true
        activeTab.modified = new Date()
        dispatch({
          type: 'UPDATE_TAB_CONFIG',
          payload: { 
            tabId: activeTab.id, 
            config: activeTab.unitManager.getConfiguration() 
          }
        })
        
        // Save complete state with debouncing
        saveCompleteState(activeTab.id, activeTab.unitManager)
      }
      
      return result
    },
    addEquipmentToUnit: (equipment: any) => {
      if (!activeTab) return
      activeTab.stateManager.addUnallocatedEquipment(equipment)
      activeTab.isModified = true
      activeTab.modified = new Date()
      dispatch({
        type: 'UPDATE_TAB_CONFIG',
        payload: { 
          tabId: activeTab.id, 
          config: activeTab.unitManager.getConfiguration() 
        }
      })
      
      // Save complete state with debouncing
      saveCompleteState(activeTab.id, activeTab.unitManager)
    },
    removeEquipment: (equipmentGroupId: string) => {
      if (!activeTab) return false
      const result = activeTab.stateManager.removeEquipment(equipmentGroupId)
      
      if (result) {
        activeTab.isModified = true
        activeTab.modified = new Date()
        dispatch({
          type: 'UPDATE_TAB_CONFIG',
          payload: { 
            tabId: activeTab.id, 
            config: activeTab.unitManager.getConfiguration() 
          }
        })
        
        // Save complete state with debouncing
        saveCompleteState(activeTab.id, activeTab.unitManager)
      }
      
      return result
    },
    resetUnit: (config?: UnitConfiguration) => {
      if (!activeTab) return
      activeTab.stateManager.resetUnit(config)
      activeTab.isModified = true
      activeTab.modified = new Date()
      dispatch({
        type: 'UPDATE_TAB_CONFIG',
        payload: { 
          tabId: activeTab.id, 
          config: activeTab.unitManager.getConfiguration() 
        }
      })
      
      // Save complete state immediately (reset is a significant operation)
      saveCompleteStateImmediately(activeTab.id, activeTab.unitManager)
    },
    selectEquipment: (equipmentGroupId: string | null) => {
      setSelectedEquipmentId(equipmentGroupId)
      // Note: Equipment selection doesn't modify unit state, so no save needed
    },
    assignSelectedEquipment: (location: string, slotIndex: number) => {
      if (!selectedEquipmentId || !activeTab) return false
      
      console.log(`[MultiUnitProvider] Attempting to assign equipment ${selectedEquipmentId} to ${location} slot ${slotIndex}`)
      
      // Get the current unallocated count before allocation
      const unallocatedCountBefore = activeTab.unitManager.getUnallocatedEquipment().length
      console.log(`[MultiUnitProvider] Unallocated equipment count before allocation: ${unallocatedCountBefore}`)
      
      const success = activeTab.unitManager.allocateEquipmentFromPool(selectedEquipmentId, location, slotIndex)
      
      if (success) {
        console.log(`[MultiUnitProvider] Equipment allocation successful`)
        
        // Verify the equipment was actually removed from unallocated pool
        const unallocatedCountAfter = activeTab.unitManager.getUnallocatedEquipment().length
        console.log(`[MultiUnitProvider] Unallocated equipment count after allocation: ${unallocatedCountAfter}`)
        
        if (unallocatedCountAfter >= unallocatedCountBefore) {
          console.error(`[MultiUnitProvider] PROBLEM: Equipment was not removed from unallocated pool! Before: ${unallocatedCountBefore}, After: ${unallocatedCountAfter}`)
        } else {
          console.log(`[MultiUnitProvider] SUCCESS: Equipment properly removed from unallocated pool. Reduced from ${unallocatedCountBefore} to ${unallocatedCountAfter}`)
        }
        
        // Clear selection
        setSelectedEquipmentId(null)
        
        // Mark tab as modified
        activeTab.isModified = true
        activeTab.modified = new Date()
        
        // PROPER ARCHITECTURE: Use unit observer pattern to trigger re-renders
        console.log(`[MultiUnitProvider] Equipment allocation completed, unit will notify observers`)
        // The unit's observer pattern will automatically trigger forceUpdate() via the subscription
        
        // Force comprehensive state update
        dispatch({
          type: 'UPDATE_TAB_CONFIG',
          payload: { 
            tabId: activeTab.id, 
            config: activeTab.unitManager.getConfiguration() 
          }
        })
        
        // Log final state for debugging
        const finalUnallocated = activeTab.unitManager.getUnallocatedEquipment()
        console.log(`[MultiUnitProvider] Final unallocated equipment:`, finalUnallocated.map(eq => eq.equipmentData.name))
        
        // Save complete state with debouncing
        saveCompleteState(activeTab.id, activeTab.unitManager)
      } else {
        console.error(`[MultiUnitProvider] Equipment allocation failed for ${selectedEquipmentId} to ${location} slot ${slotIndex}`)
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
    unitVersion: multiUnit.unitVersion, // CRITICAL: Include unit version
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
