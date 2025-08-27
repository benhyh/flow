import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useWorkflowExecution, WorkflowExecutionProvider } from '../index'
import { mockNodes, mockEdges } from '@/__tests__/utils/react-flow-test-utils'

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(WorkflowExecutionProvider, null, children)

describe('useWorkflowExecution', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('initializes with correct default state', () => {
    const { result } = renderHook(() => useWorkflowExecution(), { wrapper })

    expect(result.current.isExecuting).toBe(false)
    expect(result.current.executionHistory).toEqual([])
    expect(result.current.currentExecution).toBeNull()
    expect(result.current.nodeStatuses).toEqual({})
  })

  test('starts workflow execution', async () => {
    const { result } = renderHook(() => useWorkflowExecution(), { wrapper })

    act(() => {
      result.current.executeWorkflow(mockNodes, mockEdges)
    })

    expect(result.current.isExecuting).toBe(true)
    expect(result.current.currentExecution).toBeTruthy()
    expect(result.current.currentExecution?.status).toBe('running')
  })

  test('executes nodes in topological order', async () => {
    const { result } = renderHook(() => useWorkflowExecution(), { wrapper })

    act(() => {
      result.current.executeWorkflow(mockNodes, mockEdges)
    })

    // First node should start executing
    expect(result.current.nodeStatuses['1']).toBe('running')
    expect(result.current.nodeStatuses['2']).toBe('idle')

    // Advance timers to complete first node
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(result.current.nodeStatuses['1']).toBe('success')
      expect(result.current.nodeStatuses['2']).toBe('running')
    })
  })

  test('completes workflow execution successfully', async () => {
    const { result } = renderHook(() => useWorkflowExecution(), { wrapper })

    act(() => {
      result.current.executeWorkflow(mockNodes, mockEdges)
    })

    // Complete all nodes
    act(() => {
      jest.advanceTimersByTime(3000) // Enough time for all nodes
    })

    await waitFor(() => {
      expect(result.current.isExecuting).toBe(false)
      expect(result.current.nodeStatuses['1']).toBe('success')
      expect(result.current.nodeStatuses['2']).toBe('success')
      expect(result.current.executionHistory).toHaveLength(1)
    })

    const execution = result.current.executionHistory[0]
    expect(execution.status).toBe('success')
    expect(execution.nodeResults).toHaveLength(2)
  })

  test('handles node execution errors', async () => {
    const { result } = renderHook(() => useWorkflowExecution(), { wrapper })

    // Mock a node that will fail
    const failingNodes = [
      {
        ...mockNodes[0],
        data: { ...mockNodes[0].data, shouldFail: true },
      },
      mockNodes[1],
    ]

    act(() => {
      result.current.executeWorkflow(failingNodes, mockEdges)
    })

    // Advance timers to trigger failure
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(result.current.nodeStatuses['1']).toBe('error')
      expect(result.current.isExecuting).toBe(false)
      expect(result.current.executionHistory[0].status).toBe('error')
    })
  })

  test('stops execution when requested', async () => {
    const { result } = renderHook(() => useWorkflowExecution(), { wrapper })

    act(() => {
      result.current.executeWorkflow(mockNodes, mockEdges)
    })

    expect(result.current.isExecuting).toBe(true)

    act(() => {
      result.current.stopExecution()
    })

    expect(result.current.isExecuting).toBe(false)
    expect(result.current.currentExecution).toBeNull()
  })

  test('clears execution history', () => {
    const { result } = renderHook(() => useWorkflowExecution(), { wrapper })

    // Add some mock history
    act(() => {
      result.current.executeWorkflow(mockNodes, mockEdges)
    })

    act(() => {
      jest.advanceTimersByTime(3000)
    })

    // Clear history
    act(() => {
      result.current.clearHistory()
    })

    expect(result.current.executionHistory).toEqual([])
  })

  test('limits execution history to maximum entries', async () => {
    const { result } = renderHook(() => useWorkflowExecution(), { wrapper })

    // Execute workflow multiple times
    for (let i = 0; i < 15; i++) {
      act(() => {
        result.current.executeWorkflow(mockNodes, mockEdges)
      })

      act(() => {
        jest.advanceTimersByTime(3000)
      })

      await waitFor(() => {
        expect(result.current.isExecuting).toBe(false)
      })
    }

    // Should only keep last 10 executions
    expect(result.current.executionHistory).toHaveLength(10)
  })

  test('calculates execution duration correctly', async () => {
    const { result } = renderHook(() => useWorkflowExecution(), { wrapper })

    const startTime = Date.now()

    act(() => {
      result.current.executeWorkflow(mockNodes, mockEdges)
    })

    act(() => {
      jest.advanceTimersByTime(2500) // 2.5 seconds
    })

    await waitFor(() => {
      expect(result.current.isExecuting).toBe(false)
    })

    const execution = result.current.executionHistory[0]
    expect(execution.duration).toBeGreaterThan(2000)
    expect(execution.duration).toBeLessThan(3000)
  })

  test('handles empty workflow', () => {
    const { result } = renderHook(() => useWorkflowExecution(), { wrapper })

    act(() => {
      result.current.executeWorkflow([], [])
    })

    expect(result.current.isExecuting).toBe(false)
    expect(result.current.executionHistory).toHaveLength(1)
    expect(result.current.executionHistory[0].status).toBe('error')
    expect(result.current.executionHistory[0].error).toBe('No nodes to execute')
  })

  test('handles disconnected workflow', () => {
    const { result } = renderHook(() => useWorkflowExecution(), { wrapper })

    const disconnectedNodes = [
      mockNodes[0],
      {
        ...mockNodes[1],
        id: '3',
      },
    ]

    act(() => {
      result.current.executeWorkflow(disconnectedNodes, [])
    })

    expect(result.current.isExecuting).toBe(false)
    expect(result.current.executionHistory[0].status).toBe('error')
    expect(result.current.executionHistory[0].error).toContain('disconnected')
  })

  test('provides node execution results', async () => {
    const { result } = renderHook(() => useWorkflowExecution(), { wrapper })

    act(() => {
      result.current.executeWorkflow(mockNodes, mockEdges)
    })

    act(() => {
      jest.advanceTimersByTime(3000)
    })

    await waitFor(() => {
      expect(result.current.isExecuting).toBe(false)
    })

    const execution = result.current.executionHistory[0]
    expect(execution.nodeResults).toHaveLength(2)

    const node1Result = execution.nodeResults.find(r => r.nodeId === '1')
    const node2Result = execution.nodeResults.find(r => r.nodeId === '2')

    expect(node1Result).toBeTruthy()
    expect(node1Result?.status).toBe('success')
    expect(node1Result?.output).toBeTruthy()

    expect(node2Result).toBeTruthy()
    expect(node2Result?.status).toBe('success')
    expect(node2Result?.output).toBeTruthy()
  })

  test('handles concurrent execution attempts', () => {
    const { result } = renderHook(() => useWorkflowExecution(), { wrapper })

    act(() => {
      result.current.executeWorkflow(mockNodes, mockEdges)
    })

    expect(result.current.isExecuting).toBe(true)

    // Try to start another execution
    act(() => {
      result.current.executeWorkflow(mockNodes, mockEdges)
    })

    // Should still be executing the first one
    expect(result.current.isExecuting).toBe(true)
    expect(result.current.executionHistory).toHaveLength(0) // No completed executions yet
  })

  test('resets node statuses between executions', async () => {
    const { result } = renderHook(() => useWorkflowExecution(), { wrapper })

    // First execution
    act(() => {
      result.current.executeWorkflow(mockNodes, mockEdges)
    })

    act(() => {
      jest.advanceTimersByTime(3000)
    })

    await waitFor(() => {
      expect(result.current.isExecuting).toBe(false)
    })

    expect(result.current.nodeStatuses['1']).toBe('success')

    // Second execution
    act(() => {
      result.current.executeWorkflow(mockNodes, mockEdges)
    })

    // Node statuses should be reset
    expect(result.current.nodeStatuses['1']).toBe('running')
  })

  test('provides execution progress information', () => {
    const { result } = renderHook(() => useWorkflowExecution(), { wrapper })

    act(() => {
      result.current.executeWorkflow(mockNodes, mockEdges)
    })

    const execution = result.current.currentExecution
    expect(execution?.progress).toBeDefined()
    expect(execution?.currentNodeId).toBe('1')
    expect(execution?.totalNodes).toBe(2)
  })
})
