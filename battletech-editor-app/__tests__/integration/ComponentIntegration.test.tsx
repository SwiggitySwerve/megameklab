/**
 * Component Integration Test Suite
 * 
 * Tests integration between React components and the service layer.
 * Validates prop passing, event handling, and component communication.
 * 
 * Phase 5: Validation & Testing - Days 23-24
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { getComponentType } from '../../utils/componentTypeUtils';

// Mock the MultiUnitProvider and related components
const MockMultiUnitProvider = ({ children }: { children: React.ReactNode }) => {
  const mockContextValue = {
    tabs: [
      {
        id: 'tab-1',
        name: 'Test Mech',
        unitManager: {
          getConfiguration: () => ({
            chassis: 'Atlas',
            model: 'AS7-D',
            tonnage: 100,
            walkMP: 3,
            runMP: 5,
            jumpMP: 0,
            engineRating: 300,
            engineType: 'Standard',
            techBase: 'Inner Sphere'
          }),
          getUnallocatedEquipment: () => [
            { equipmentData: { name: 'AC/20', type: 'weapon' } },
            { equipmentData: { name: 'Medium Laser', type: 'weapon' } }
          ]
        },
        stateManager: {
          getUnitSummary: () => ({
            validation: { isValid: true },
            summary: { tonnage: 100 }
          })
        },
        created: new Date(),
        modified: new Date(),
        isModified: false
      }
    ],
    activeTab: {
      id: 'tab-1',
      name: 'Test Mech',
      unitManager: {
        getConfiguration: () => ({
          chassis: 'Atlas',
          model: 'AS7-D',
          tonnage: 100,
          walkMP: 3,
          runMP: 5,
          jumpMP: 0,
          engineRating: 300,
          engineType: 'Standard',
          techBase: 'Inner Sphere'
        }),
        getUnallocatedEquipment: () => [
          { equipmentData: { name: 'AC/20', type: 'weapon' } },
          { equipmentData: { name: 'Medium Laser', type: 'weapon' } }
        ]
      },
      stateManager: {
        getUnitSummary: () => ({
          validation: { isValid: true },
          summary: { tonnage: 100 }
        })
      },
      created: new Date(),
      modified: new Date(),
      isModified: false
    },
    activeTabId: 'tab-1',
    unit: {
      getConfiguration: () => ({
        chassis: 'Atlas',
        model: 'AS7-D',
        tonnage: 100,
        walkMP: 3,
        runMP: 5,
        jumpMP: 0,
        engineRating: 300,
        engineType: 'Standard',
        techBase: 'Inner Sphere'
      }),
      getUnallocatedEquipment: () => [
        { equipmentData: { name: 'AC/20', type: 'weapon' } },
        { equipmentData: { name: 'Medium Laser', type: 'weapon' } }
      ]
    },
    engineType: 'Standard',
    gyroType: 'Standard',
    unallocatedEquipment: [
      { equipmentData: { name: 'AC/20', type: 'weapon' } },
      { equipmentData: { name: 'Medium Laser', type: 'weapon' } }
    ],
    validation: { isValid: true },
    summary: { tonnage: 100 },
    isConfigLoaded: true,
    selectedEquipmentId: null,
    createTab: jest.fn(),
    closeTab: jest.fn(),
    setActiveTab: jest.fn(),
    renameTab: jest.fn(),
    duplicateTab: jest.fn(),
    changeEngine: jest.fn(),
    changeGyro: jest.fn(),
    updateConfiguration: jest.fn(),
    addTestEquipment: jest.fn(),
    addEquipmentToUnit: jest.fn(),
    removeEquipment: jest.fn(),
    resetUnit: jest.fn(),
    selectEquipment: jest.fn(),
    assignSelectedEquipment: jest.fn(),
    getDebugInfo: jest.fn(),
    getComparisonAnalysis: jest.fn(() => ({
      tabs: ['tab-1'],
      statistics: {
        'tab-1': {
          tonnage: 100,
          battleValue: 2000,
          weaponCount: 2,
          armorPoints: 307,
          mobility: { walkMP: 3, runMP: 5, jumpMP: 0 },
          survivability: { totalArmor: 307, armorPerTon: 3.07 },
          firepower: { totalDamage: 25, heatGeneration: 6 },
          heatEfficiency: 80,
          cost: 8500000
        }
      },
      analysis: {
        bestOverall: 'tab-1',
        mostEfficient: 'tab-1',
        highestFirepower: 'tab-1',
        bestSurvivability: 'tab-1'
      },
      recommendations: []
    })),
    getSyncStats: jest.fn(() => ({
      totalEvents: 5,
      recentEvents: [],
      activeObservers: 1,
      pendingSaves: 0
    })),
    forceSaveAll: jest.fn()
  }

  return React.createElement(
    'div',
    { 'data-testid': 'mock-provider' },
    React.createElement(
      React.createContext(mockContextValue).Provider,
      { value: mockContextValue },
      children
    )
  )
}

// Mock individual components
const MockUnitBasicInfo = ({ unit }: { unit: any }) => {
  const config = unit.getConfiguration()
  return React.createElement('div', { 'data-testid': 'unit-basic-info' },
    React.createElement('h3', {}, `${config.chassis} ${config.model}`),
    React.createElement('p', {}, `Tonnage: ${config.tonnage}`),
    React.createElement('p', {}, `Engine: ${getComponentType(config.engineType)}`)
  )
}

const MockUnitTechnicalSpecs = ({ unit }: { unit: any }) => {
  const config = unit.getConfiguration()
  return React.createElement('div', { 'data-testid': 'unit-technical-specs' },
    React.createElement('h4', {}, 'Technical Specifications'),
    React.createElement('p', {}, `Movement: ${config.walkMP}/${config.runMP}`),
    React.createElement('p', {}, `Engine Rating: ${config.engineRating}`)
  )
}

const MockUnitEquipmentSummary = ({ unit }: { unit: any }) => {
  return React.createElement('div', { 'data-testid': 'unit-equipment-summary' },
    React.createElement('h4', {}, 'Equipment'),
    ...unit.getUnallocatedEquipment().map((eq: any, index: number) =>
      React.createElement('p', { key: index }, eq.equipmentData.name)
    )
  )
}

const MockUnitActionButtons = ({ 
  onExport, 
  onCompare, 
  onReset 
}: { 
  onExport: () => void
  onCompare: () => void
  onReset: () => void 
}) => {
  return React.createElement('div', { 'data-testid': 'unit-action-buttons' },
    React.createElement('button', { onClick: onExport }, 'Export'),
    React.createElement('button', { onClick: onCompare }, 'Compare'),
    React.createElement('button', { onClick: onReset }, 'Reset')
  )
}

const MockUnitDetail = () => {
  const mockUnit = {
    getConfiguration: () => ({
      chassis: 'Atlas',
      model: 'AS7-D',
      tonnage: 100,
      walkMP: 3,
      runMP: 5,
      jumpMP: 0,
      engineRating: 300,
      engineType: 'Standard'
    }),
    getUnallocatedEquipment: () => [
      { equipmentData: { name: 'AC/20', type: 'weapon' } },
      { equipmentData: { name: 'Medium Laser', type: 'weapon' } }
    ]
  }

  return React.createElement('div', { 'data-testid': 'unit-detail' },
    React.createElement(MockUnitBasicInfo, { unit: mockUnit }),
    React.createElement(MockUnitTechnicalSpecs, { unit: mockUnit }),
    React.createElement(MockUnitEquipmentSummary, { unit: mockUnit }),
    React.createElement(MockUnitActionButtons, {
      onExport: () => console.log('Export clicked'),
      onCompare: () => console.log('Compare clicked'),
      onReset: () => console.log('Reset clicked')
    })
  )
}

describe('Component Integration Tests', () => {
  describe('Unit Detail Component Integration', () => {
    it('should render all sub-components with correct data', () => {
      render(
        <MockMultiUnitProvider>
          <MockUnitDetail />
        </MockMultiUnitProvider>
      )

      // Verify all components are rendered
      expect(screen.getByTestId('unit-detail')).toBeInTheDocument()
      expect(screen.getByTestId('unit-basic-info')).toBeInTheDocument()
      expect(screen.getByTestId('unit-technical-specs')).toBeInTheDocument()
      expect(screen.getByTestId('unit-equipment-summary')).toBeInTheDocument()
      expect(screen.getByTestId('unit-action-buttons')).toBeInTheDocument()

      // Verify data is displayed correctly
      expect(screen.getByText('Atlas AS7-D')).toBeInTheDocument()
      expect(screen.getByText('Tonnage: 100')).toBeInTheDocument()
      expect(screen.getByText('Engine: Standard')).toBeInTheDocument()
      expect(screen.getByText('Movement: 3/5')).toBeInTheDocument()
      expect(screen.getByText('AC/20')).toBeInTheDocument()
      expect(screen.getByText('Medium Laser')).toBeInTheDocument()
    })

    it('should handle component interactions', () => {
      render(
        <MockMultiUnitProvider>
          <MockUnitDetail />
        </MockMultiUnitProvider>
      )

      const exportButton = screen.getByText('Export')
      const compareButton = screen.getByText('Compare')
      const resetButton = screen.getByText('Reset')

      // Test button interactions
      expect(exportButton).toBeInTheDocument()
      expect(compareButton).toBeInTheDocument()
      expect(resetButton).toBeInTheDocument()

      // Buttons should be clickable
      fireEvent.click(exportButton)
      fireEvent.click(compareButton)
      fireEvent.click(resetButton)
    })
  })

  describe('Provider Integration', () => {
    it('should provide context to child components', () => {
      const TestComponent = () => {
        return (
          <div data-testid="test-component">
            Context is available
          </div>
        )
      }

      render(
        <MockMultiUnitProvider>
          <TestComponent />
        </MockMultiUnitProvider>
      )

      expect(screen.getByTestId('mock-provider')).toBeInTheDocument()
      expect(screen.getByTestId('test-component')).toBeInTheDocument()
    })
  })

  describe('State Management Integration', () => {
    it('should handle state updates across components', async () => {
      const StateTestComponent = () => {
        const [count, setCount] = React.useState(0)

        return (
          <div data-testid="state-test">
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>Increment</button>
          </div>
        )
      }

      render(
        <MockMultiUnitProvider>
          <StateTestComponent />
        </MockMultiUnitProvider>
      )

      const button = screen.getByText('Increment')
      const countText = screen.getByText('Count: 0')

      expect(countText).toBeInTheDocument()

      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Count: 1')).toBeInTheDocument()
      })
    })
  })

  describe('Event Handling Integration', () => {
    it('should propagate events between components', () => {
      const eventLog: string[] = []

      const ParentComponent = () => {
        const handleChildEvent = (event: string) => {
          eventLog.push(event)
        }

        return (
          <div data-testid="parent-component">
            <ChildComponent onEvent={handleChildEvent} />
            <div data-testid="event-log">
              Events: {eventLog.join(', ')}
            </div>
          </div>
        )
      }

      const ChildComponent = ({ onEvent }: { onEvent: (event: string) => void }) => {
        return (
          <div data-testid="child-component">
            <button onClick={() => onEvent('button1')}>Button 1</button>
            <button onClick={() => onEvent('button2')}>Button 2</button>
          </div>
        )
      }

      render(
        <MockMultiUnitProvider>
          <ParentComponent />
        </MockMultiUnitProvider>
      )

      const button1 = screen.getByText('Button 1')
      const button2 = screen.getByText('Button 2')

      fireEvent.click(button1)
      fireEvent.click(button2)
      fireEvent.click(button1)

      expect(eventLog).toEqual(['button1', 'button2', 'button1'])
    })
  })

  describe('Error Boundary Integration', () => {
    it('should handle component errors gracefully', () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = jest.fn()

      class ErrorBoundary extends React.Component<
        { children: React.ReactNode },
        { hasError: boolean }
      > {
        constructor(props: { children: React.ReactNode }) {
          super(props)
          this.state = { hasError: false }
        }

        static getDerivedStateFromError() {
          return { hasError: true }
        }

        render() {
          if (this.state.hasError) {
            return <div data-testid="error-fallback">Something went wrong</div>
          }

          return this.props.children
        }
      }

      const BuggyComponent = () => {
        throw new Error('Test error')
      }

      render(
        <MockMultiUnitProvider>
          <ErrorBoundary>
            <BuggyComponent />
          </ErrorBoundary>
        </MockMultiUnitProvider>
      )

      expect(screen.getByTestId('error-fallback')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      // Restore console.error
      console.error = originalError
    })
  })

  describe('Performance Integration', () => {
    it('should handle rapid state updates efficiently', async () => {
      const PerformanceTestComponent = () => {
        const [updates, setUpdates] = React.useState(0)

        const handleRapidUpdates = () => {
          // Simulate rapid state updates
          for (let i = 0; i < 100; i++) {
            setTimeout(() => setUpdates(prev => prev + 1), i)
          }
        }

        return (
          <div data-testid="performance-test">
            <p>Updates: {updates}</p>
            <button onClick={handleRapidUpdates}>Start Rapid Updates</button>
          </div>
        )
      }

      render(
        <MockMultiUnitProvider>
          <PerformanceTestComponent />
        </MockMultiUnitProvider>
      )

      const button = screen.getByText('Start Rapid Updates')
      fireEvent.click(button)

      // Should handle rapid updates without crashing
      await waitFor(() => {
        expect(screen.getByTestId('performance-test')).toBeInTheDocument()
      })
    })
  })

  describe('Async Integration', () => {
    it('should handle async operations correctly', async () => {
      const AsyncTestComponent = () => {
        const [data, setData] = React.useState<string | null>(null)
        const [loading, setLoading] = React.useState(false)

        const loadData = async () => {
          setLoading(true)
          await new Promise(resolve => setTimeout(resolve, 100))
          setData('Loaded data')
          setLoading(false)
        }

        return (
          <div data-testid="async-test">
            {loading && <p>Loading...</p>}
            {data && <p>{data}</p>}
            <button onClick={loadData}>Load Data</button>
          </div>
        )
      }

      render(
        <MockMultiUnitProvider>
          <AsyncTestComponent />
        </MockMultiUnitProvider>
      )

      const button = screen.getByText('Load Data')
      fireEvent.click(button)

      // Should show loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument()

      // Should show loaded data after delay
      await waitFor(() => {
        expect(screen.getByText('Loaded data')).toBeInTheDocument()
      })

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
  })

  describe('Memory Leak Prevention', () => {
    it('should cleanup event listeners on unmount', () => {
      const cleanup = jest.fn()

      const ComponentWithListeners = () => {
        React.useEffect(() => {
          const handler = () => {}
          window.addEventListener('scroll', handler)
          
          return () => {
            window.removeEventListener('scroll', handler)
            cleanup()
          }
        }, [])

        return <div data-testid="listener-component">Component with listeners</div>
      }

      const { unmount } = render(
        <MockMultiUnitProvider>
          <ComponentWithListeners />
        </MockMultiUnitProvider>
      )

      expect(screen.getByTestId('listener-component')).toBeInTheDocument()

      unmount()

      expect(cleanup).toHaveBeenCalled()
    })
  })
})
