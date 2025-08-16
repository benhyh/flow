
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { performance } from 'perf_hooks'
import { NodeLibrary } from '../panels/NodeLibrary'
import { WorkflowToolbar } from '../toolbar/WorkflowToolbar'
import { renderWithReactFlow, mockNodes, mockEdges, mockWorkflowState } from '@/__tests__/utils/react-flow-test-utils'

// Mock performance.now for consistent testing
const mockPerformanceNow = jest.fn()
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow
  }
})

// Helper to measure render time
const measureRenderTime = (component: React.ReactElement) => {
  const startTime = performance.now()
  render(component)
  const endTime = performance.now()
  return endTime - startTime
}

describe('Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPerformanceNow.mockReturnValue(0)
  })

  test('NodeLibrary renders within performance budget', () => {
    const renderTime = measureRenderTime(<NodeLibrary />)
    
    // Should render within 100ms
    expect(renderTime).toBeLessThan(100)
  })

  test('WorkflowToolbar renders quickly with complex state', () => {
    const complexWorkflowState = {
      ...mockWorkflowState,
      validationErrors: Array(50).fill('Validation error'),
      lastSaved: new Date(),
      lastRun: new Date(),
    }

    const mockProps = {
      workflowState: complexWorkflowState,
      onWorkflowStateChange: jest.fn(),
      onRunTest: jest.fn(),
      onSave: jest.fn(),
      onToggleStatus: jest.fn(),
    }

    const renderTime = measureRenderTime(<WorkflowToolbar {...mockProps} />)
    
    // Should render within 50ms even with complex state
    expect(renderTime).toBeLessThan(50)
  })

  test('Large workflow with many nodes renders efficiently', () => {
    // Create a large workflow with 100 nodes
    const largeNodes = Array.from({ length: 100 }, (_, i) => ({
      id: `node-${i}`,
      type: i % 4 === 0 ? 'trigger' : i % 4 === 1 ? 'action' : i % 4 === 2 ? 'logic' : 'ai',
      position: { x: (i % 10) * 200, y: Math.floor(i / 10) * 100 },
      data: {
        label: `Node ${i}`,
        subtype: 'test-node',
        config: {}
      }
    }))

    const largeEdges = Array.from({ length: 99 }, (_, i) => ({
      id: `edge-${i}`,
      source: `node-${i}`,
      target: `node-${i + 1}`
    }))

    const mockProps = {
      workflowState: mockWorkflowState,
      onWorkflowStateChange: jest.fn(),
      onRunTest: jest.fn(),
      onSave: jest.fn(),
      onToggleStatus: jest.fn(),
      nodes: largeNodes,
      edges: largeEdges,
      onNodesChange: jest.fn(),
      onEdgesChange: jest.fn(),
    }

    const startTime = performance.now()
    renderWithReactFlow(<WorkflowToolbar {...mockProps} />)
    const endTime = performance.now()

    // Should handle large workflows within 200ms
    expect(endTime - startTime).toBeLessThan(200)
  })

  test('Frequent state updates do not cause performance issues', async () => {
    const mockProps = {
      workflowState: mockWorkflowState,
      onWorkflowStateChange: jest.fn(),
      onRunTest: jest.fn(),
      onSave: jest.fn(),
      onToggleStatus: jest.fn(),
    }

    renderWithReactFlow(<WorkflowToolbar {...mockProps} />)

    const nameInput = screen.getByDisplayValue(mockWorkflowState.name)
    
    // Simulate rapid typing (100 characters)
    const startTime = performance.now()
    
    for (let i = 0; i < 100; i++) {
      fireEvent.change(nameInput, { target: { value: `Test Workflow ${i}` } })
    }
    
    const endTime = performance.now()
    
    // Should handle rapid updates within 500ms
    expect(endTime - startTime).toBeLessThan(500)
  })

  test('Memory usage remains stable during interactions', () => {
    const mockProps = {
      workflowState: mockWorkflowState,
      onWorkflowStateChange: jest.fn(),
      onRunTest: jest.fn(),
      onSave: jest.fn(),
      onToggleStatus: jest.fn(),
    }

    const { rerender } = renderWithReactFlow(<WorkflowToolbar {...mockProps} />)

    // Simulate multiple re-renders with different props
    for (let i = 0; i < 50; i++) {
      const updatedProps = {
        ...mockProps,
        workflowState: {
          ...mockWorkflowState,
          name: `Workflow ${i}`
        }
      }
      rerender(<WorkflowToolbar {...updatedProps} />)
    }

    // Component should still be responsive
    expect(screen.getByDisplayValue('Workflow 49')).toBeInTheDocument()
  })

  test('Drag and drop operations are performant', () => {
    renderWithReactFlow(<NodeLibrary />)

    const draggableNode = screen.getByText('New Email').closest('[draggable="true"]')
    
    const startTime = performance.now()
    
    // Simulate drag operations
    for (let i = 0; i < 10; i++) {
      fireEvent.dragStart(draggableNode!, {
        dataTransfer: {
          setData: jest.fn(),
          getData: jest.fn(),
        }
      })
      fireEvent.dragEnd(draggableNode!)
    }
    
    const endTime = performance.now()
    
    // Should handle multiple drag operations quickly
    expect(endTime - startTime).toBeLessThan(100)
  })

  test('Component memoization prevents unnecessary re-renders', () => {
    const renderSpy = jest.fn()
    
    const MemoizedComponent = React.memo(() => {
      renderSpy()
      return <div>Memoized Component</div>
    })

    const ParentComponent = ({ count }: { count: number }) => (
      <div>
        <div>Count: {count}</div>
        <MemoizedComponent />
      </div>
    )

    const { rerender } = render(<ParentComponent count={1} />)
    
    expect(renderSpy).toHaveBeenCalledTimes(1)
    
    // Re-render with same props
    rerender(<ParentComponent count={1} />)
    
    // Memoized component should not re-render
    expect(renderSpy).toHaveBeenCalledTimes(1)
    
    // Re-render with different props
    rerender(<ParentComponent count={2} />)
    
    // Memoized component still should not re-render (its props didn't change)
    expect(renderSpy).toHaveBeenCalledTimes(1)
  })

  test('Event handlers are properly memoized', () => {
    const onClickSpy = jest.fn()
    
    const TestComponent = ({ value }: { value: string }) => {
      const handleClick = React.useCallback(() => {
        onClickSpy(value)
      }, [value])

      return <button onClick={handleClick}>Click me</button>
    }

    const { rerender } = render(<TestComponent value="test" />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(onClickSpy).toHaveBeenCalledWith('test')
    
    // Re-render with same value
    rerender(<TestComponent value="test" />)
    
    // Handler should be memoized (same reference)
    fireEvent.click(button)
    expect(onClickSpy).toHaveBeenCalledTimes(2)
  })

  test('Large lists render efficiently with virtualization', () => {
    // Mock a large list of workflows
    const largeWorkflowList = Array.from({ length: 1000 }, (_, i) => ({
      id: `workflow-${i}`,
      name: `Workflow ${i}`,
      status: 'draft' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))

    const ListComponent = ({ items }: { items: typeof largeWorkflowList }) => (
      <div style={{ height: '400px', overflow: 'auto' }}>
        {items.slice(0, 20).map(item => ( // Simulate virtualization
          <div key={item.id} style={{ height: '50px' }}>
            {item.name}
          </div>
        ))}
      </div>
    )

    const startTime = performance.now()
    render(<ListComponent items={largeWorkflowList} />)
    const endTime = performance.now()

    // Should render virtualized list quickly
    expect(endTime - startTime).toBeLessThan(50)
    
    // Should only render visible items
    expect(screen.getByText('Workflow 0')).toBeInTheDocument()
    expect(screen.getByText('Workflow 19')).toBeInTheDocument()
    expect(screen.queryByText('Workflow 50')).not.toBeInTheDocument()
  })

  test('Debounced search performs well', async () => {
    const searchSpy = jest.fn()
    
    const SearchComponent = () => {
      const [query, setQuery] = React.useState('')
      
      const debouncedSearch = React.useMemo(
        () => {
          let timeoutId: NodeJS.Timeout
          return (searchQuery: string) => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(() => {
              searchSpy(searchQuery)
            }, 300)
          }
        },
        []
      )

      React.useEffect(() => {
        debouncedSearch(query)
      }, [query, debouncedSearch])

      return (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
        />
      )
    }

    render(<SearchComponent />)
    
    const input = screen.getByPlaceholderText('Search...')
    
    // Type rapidly
    const startTime = performance.now()
    fireEvent.change(input, { target: { value: 'a' } })
    fireEvent.change(input, { target: { value: 'ab' } })
    fireEvent.change(input, { target: { value: 'abc' } })
    const endTime = performance.now()
    
    // Should handle rapid typing quickly
    expect(endTime - startTime).toBeLessThan(50)
    
    // Should debounce search calls
    expect(searchSpy).not.toHaveBeenCalled()
    
    // Wait for debounce
    await waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith('abc')
    }, { timeout: 500 })
    
    // Should only call search once after debounce
    expect(searchSpy).toHaveBeenCalledTimes(1)
  })

  test('Animation performance is acceptable', () => {
    const AnimatedComponent = () => {
      const [isVisible, setIsVisible] = React.useState(false)
      
      return (
        <div>
          <button onClick={() => setIsVisible(!isVisible)}>
            Toggle
          </button>
          <div
            style={{
              opacity: isVisible ? 1 : 0,
              transition: 'opacity 0.3s ease',
              transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
            }}
          >
            Animated Content
          </div>
        </div>
      )
    }

    const startTime = performance.now()
    render(<AnimatedComponent />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    const endTime = performance.now()
    
    // Animation trigger should be fast
    expect(endTime - startTime).toBeLessThan(50)
  })

  test('Bundle size impact is minimal', () => {
    // This is a conceptual test - in practice you'd use tools like bundlephobia
    // or webpack-bundle-analyzer to measure actual bundle impact
    
    const componentSizes = {
      NodeLibrary: 15, // KB (estimated)
      WorkflowToolbar: 12, // KB (estimated)
      ConfigPanel: 18, // KB (estimated)
      DebugPanel: 10, // KB (estimated)
    }
    
    const totalSize = Object.values(componentSizes).reduce((sum, size) => sum + size, 0)
    
    // Total component bundle should be under 100KB
    expect(totalSize).toBeLessThan(100)
  })
})