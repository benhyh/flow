import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DebugPanel } from '../panels/DebugPanel'
import { WorkflowExecutionProvider } from '../providers/WorkflowExecutionProvider'
import { renderWithReactFlow, mockNodes, mockEdges } from '@/__tests__/utils/react-flow-test-utils'

// Mock the execution hook
const mockExecutionState = {
  isExecuting: false,
  executionHistory: [
    {
      id: 'run-1',
      timestamp: new Date('2024-01-01T10:00:00Z'),
      status: 'success' as const,
      duration: 1500,
      nodeResults: [
        {
          nodeId: '1',
          status: 'success' as const,
          duration: 500,
          output: { message: 'Email processed successfully' }
        },
        {
          nodeId: '2',
          status: 'success' as const,
          duration: 1000,
          output: { taskId: 'task-123', title: 'New Task Created' }
        }
      ]
    },
    {
      id: 'run-2',
      timestamp: new Date('2024-01-01T09:00:00Z'),
      status: 'error' as const,
      duration: 800,
      error: 'Connection timeout',
      nodeResults: [
        {
          nodeId: '1',
          status: 'success' as const,
          duration: 300,
          output: { message: 'Email processed successfully' }
        },
        {
          nodeId: '2',
          status: 'error' as const,
          duration: 500,
          error: 'Failed to connect to Trello API'
        }
      ]
    }
  ],
  currentExecution: null
}

jest.mock('../useWorkflowExecution', () => ({
  useWorkflowExecution: () => mockExecutionState
}))

const DebugPanelWithProvider = (props: any) => (
  <WorkflowExecutionProvider>
    <DebugPanel {...props} />
  </WorkflowExecutionProvider>
)

describe('DebugPanel', () => {
  const mockProps = {
    nodes: mockNodes,
    edges: mockEdges,
    isOpen: true,
    onToggle: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders debug panel when open', () => {
    renderWithReactFlow(<DebugPanelWithProvider {...mockProps} />)
    
    expect(screen.getByText('Debug Panel')).toBeInTheDocument()
    expect(screen.getByText('Execution History')).toBeInTheDocument()
  })

  test('does not render content when closed', () => {
    renderWithReactFlow(
      <DebugPanelWithProvider {...mockProps} isOpen={false} />
    )
    
    expect(screen.queryByText('Execution History')).not.toBeInTheDocument()
  })

  test('displays execution history', () => {
    renderWithReactFlow(<DebugPanelWithProvider {...mockProps} />)
    
    // Should show both execution runs
    expect(screen.getByText('run-1')).toBeInTheDocument()
    expect(screen.getByText('run-2')).toBeInTheDocument()
    
    // Should show status indicators
    expect(screen.getByText('success')).toBeInTheDocument()
    expect(screen.getByText('error')).toBeInTheDocument()
  })

  test('shows execution duration', () => {
    renderWithReactFlow(<DebugPanelWithProvider {...mockProps} />)
    
    // Should display execution durations
    expect(screen.getByText('1.5s')).toBeInTheDocument()
    expect(screen.getByText('0.8s')).toBeInTheDocument()
  })

  test('displays node results when execution is expanded', async () => {
    renderWithReactFlow(<DebugPanelWithProvider {...mockProps} />)
    
    // Click on first execution to expand
    const firstExecution = screen.getByText('run-1')
    fireEvent.click(firstExecution)
    
    await waitFor(() => {
      // Should show node results
      expect(screen.getByText('Email processed successfully')).toBeInTheDocument()
      expect(screen.getByText('New Task Created')).toBeInTheDocument()
    })
  })

  test('shows error details for failed executions', async () => {
    renderWithReactFlow(<DebugPanelWithProvider {...mockProps} />)
    
    // Click on failed execution to expand
    const failedExecution = screen.getByText('run-2')
    fireEvent.click(failedExecution)
    
    await waitFor(() => {
      // Should show error details
      expect(screen.getByText('Connection timeout')).toBeInTheDocument()
      expect(screen.getByText('Failed to connect to Trello API')).toBeInTheDocument()
    })
  })

  test('displays current execution status', () => {
    const executingState = {
      ...mockExecutionState,
      isExecuting: true,
      currentExecution: {
        id: 'current-run',
        startTime: new Date(),
        currentNodeId: '1',
        status: 'running' as const
      }
    }
    
    jest.mocked(require('../useWorkflowExecution').useWorkflowExecution).mockReturnValue(executingState)
    
    renderWithReactFlow(<DebugPanelWithProvider {...mockProps} />)
    
    expect(screen.getByText('Running...')).toBeInTheDocument()
    expect(screen.getByText('Current Node: 1')).toBeInTheDocument()
  })

  test('handles toggle functionality', () => {
    renderWithReactFlow(<DebugPanelWithProvider {...mockProps} />)
    
    const toggleButton = screen.getByRole('button', { name: /toggle debug panel/i })
    fireEvent.click(toggleButton)
    
    expect(mockProps.onToggle).toHaveBeenCalledTimes(1)
  })

  test('shows empty state when no execution history', () => {
    const emptyState = {
      ...mockExecutionState,
      executionHistory: []
    }
    
    jest.mocked(require('../useWorkflowExecution').useWorkflowExecution).mockReturnValue(emptyState)
    
    renderWithReactFlow(<DebugPanelWithProvider {...mockProps} />)
    
    expect(screen.getByText('No execution history')).toBeInTheDocument()
  })

  test('formats timestamps correctly', () => {
    renderWithReactFlow(<DebugPanelWithProvider {...mockProps} />)
    
    // Should show formatted timestamps
    expect(screen.getByText(/Jan 1, 2024/)).toBeInTheDocument()
  })

  test('shows node status indicators', async () => {
    renderWithReactFlow(<DebugPanelWithProvider {...mockProps} />)
    
    // Expand first execution
    const firstExecution = screen.getByText('run-1')
    fireEvent.click(firstExecution)
    
    await waitFor(() => {
      // Should show success indicators for nodes
      const successIndicators = screen.getAllByText('✓')
      expect(successIndicators.length).toBeGreaterThan(0)
    })
  })

  test('handles execution clearing', () => {
    renderWithReactFlow(<DebugPanelWithProvider {...mockProps} />)
    
    const clearButton = screen.getByRole('button', { name: /clear history/i })
    fireEvent.click(clearButton)
    
    // Should trigger history clearing
    expect(screen.getByText('History cleared')).toBeInTheDocument()
  })

  test('maintains scroll position in execution list', () => {
    renderWithReactFlow(<DebugPanelWithProvider {...mockProps} />)
    
    const scrollArea = screen.getByRole('region', { name: /execution history/i })
    expect(scrollArea).toBeInTheDocument()
    expect(scrollArea).toHaveClass('overflow-auto')
  })

  test('shows execution progress for running workflows', () => {
    const runningState = {
      ...mockExecutionState,
      isExecuting: true,
      currentExecution: {
        id: 'current-run',
        startTime: new Date(),
        currentNodeId: '1',
        status: 'running' as const,
        progress: 0.5
      }
    }
    
    jest.mocked(require('../useWorkflowExecution').useWorkflowExecution).mockReturnValue(runningState)
    
    renderWithReactFlow(<DebugPanelWithProvider {...mockProps} />)
    
    // Should show progress indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  test('applies correct styling for different execution statuses', () => {
    renderWithReactFlow(<DebugPanelWithProvider {...mockProps} />)
    
    // Success execution should have green styling
    const successExecution = screen.getByText('run-1').closest('[data-status="success"]')
    expect(successExecution).toBeInTheDocument()
    
    // Error execution should have red styling
    const errorExecution = screen.getByText('run-2').closest('[data-status="error"]')
    expect(errorExecution).toBeInTheDocument()
  })

  test('maintains accessibility standards', () => {
    renderWithReactFlow(<DebugPanelWithProvider {...mockProps} />)
    
    // Panel should have proper ARIA labels
    const panel = screen.getByRole('region', { name: /debug panel/i })
    expect(panel).toBeInTheDocument()
    
    // Execution items should be accessible
    const executionItems = screen.getAllByRole('button')
    executionItems.forEach(item => {
      expect(item).toHaveAccessibleName()
    })
  })
})