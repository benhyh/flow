import { useState, useCallback, useRef } from 'react'
import { useReactFlow, type Node, type Edge } from '@xyflow/react'
import { type ExecutionLog, type ExecutionRun, type LogLevel } from './DebugPanel'

// Node execution status
export type NodeExecutionStatus = 'idle' | 'running' | 'success' | 'error'

export interface NodeExecutionState {
  [nodeId: string]: {
    status: NodeExecutionStatus
    startTime?: Date
    endTime?: Date
    error?: string
  }
}

export function useWorkflowExecution() {
  const { getNodes, getEdges, setNodes } = useReactFlow()
  const [executionRuns, setExecutionRuns] = useState<ExecutionRun[]>([])
  const [currentRun, setCurrentRun] = useState<ExecutionRun | null>(null)
  const [nodeExecutionState, setNodeExecutionState] = useState<NodeExecutionState>({})
  const executionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Create a new execution log
  const createLog = useCallback((
    level: LogLevel,
    message: string,
    nodeId?: string,
    nodeName?: string,
    details?: string,
    duration?: number
  ): ExecutionLog => ({
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    level,
    message,
    nodeId,
    nodeName,
    details,
    duration
  }), [])

  // Update node visual status
  const updateNodeStatus = useCallback((nodeId: string, status: NodeExecutionStatus, error?: string) => {
    setNodeExecutionState(prev => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        status,
        error,
        endTime: status !== 'running' ? new Date() : prev[nodeId]?.endTime
      }
    }))

    // Update node visual appearance
    setNodes(nodes => nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            status: status === 'idle' ? 'idle' : 
                   status === 'running' ? 'running' :
                   status === 'success' ? 'success' : 'error'
          }
        }
      }
      return node
    }))
  }, [setNodes])

  // Add log to current run
  const addLog = useCallback((log: ExecutionLog) => {
    setCurrentRun(prev => {
      if (!prev) return prev
      return {
        ...prev,
        logs: [...prev.logs, log]
      }
    })
  }, [])

  // Simulate node execution
  const simulateNodeExecution = useCallback(async (
    node: Node
  ): Promise<{ success: boolean; duration: number; error?: string }> => {
    const nodeData = node.data as Record<string, unknown>
    const nodeType = (nodeData.nodeType as string) || node.type || 'default'
    
    // Simulate different execution times and success rates based on node type
    const getExecutionParams = (type: string) => {
      switch (true) {
        case type.includes('trigger'):
          return { minTime: 500, maxTime: 1500, successRate: 0.95 }
        case type.includes('action'):
          return { minTime: 1000, maxTime: 3000, successRate: 0.90 }
        case type.includes('logic'):
          return { minTime: 200, maxTime: 800, successRate: 0.98 }
        case type.includes('ai'):
          return { minTime: 2000, maxTime: 5000, successRate: 0.85 }
        default:
          return { minTime: 500, maxTime: 2000, successRate: 0.92 }
      }
    }

    const params = getExecutionParams(nodeType)
    const duration = Math.random() * (params.maxTime - params.minTime) + params.minTime
    const success = Math.random() < params.successRate

    // Check if node is configured
    const config = nodeData.config as Record<string, unknown> | undefined
    const isConfigured = config && Object.keys(config).length > 0

    if (!isConfigured) {
      return {
        success: false,
        duration: 100,
        error: 'Node is not configured'
      }
    }

    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, duration))

    if (!success) {
      const errors = [
        'Connection timeout',
        'Authentication failed',
        'Rate limit exceeded',
        'Invalid configuration',
        'Service unavailable'
      ]
      return {
        success: false,
        duration,
        error: errors[Math.floor(Math.random() * errors.length)]
      }
    }

    return { success: true, duration }
  }, [])

  // Execute workflow simulation
  const executeWorkflow = useCallback(async () => {
    const nodes = getNodes()
    const edges = getEdges()

    if (nodes.length === 0) {
      return
    }

    // Create new execution run
    const runId = `run-${Date.now()}`
    const newRun: ExecutionRun = {
      id: runId,
      startTime: new Date(),
      status: 'running',
      logs: [],
      totalNodes: nodes.length,
      completedNodes: 0,
      errorCount: 0
    }

    setCurrentRun(newRun)
    
    // Add initial log
    const startLog = createLog('info', `Starting workflow execution with ${nodes.length} nodes`)
    addLog(startLog)

    // Reset all node statuses
    nodes.forEach(node => {
      updateNodeStatus(node.id, 'idle')
    })

    // Build execution order (topological sort)
    const getExecutionOrder = (nodes: Node[], edges: Edge[]): Node[] => {
      const inDegree = new Map<string, number>()
      const adjList = new Map<string, string[]>()
      
      // Initialize
      nodes.forEach(node => {
        inDegree.set(node.id, 0)
        adjList.set(node.id, [])
      })
      
      // Build adjacency list and calculate in-degrees
      edges.forEach(edge => {
        const targets = adjList.get(edge.source) || []
        targets.push(edge.target)
        adjList.set(edge.source, targets)
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
      })
      
      // Find nodes with no dependencies (triggers)
      const queue: Node[] = []
      nodes.forEach(node => {
        if (inDegree.get(node.id) === 0) {
          queue.push(node)
        }
      })
      
      const result: Node[] = []
      
      while (queue.length > 0) {
        const current = queue.shift()!
        result.push(current)
        
        const neighbors = adjList.get(current.id) || []
        neighbors.forEach(neighborId => {
          const newInDegree = (inDegree.get(neighborId) || 0) - 1
          inDegree.set(neighborId, newInDegree)
          
          if (newInDegree === 0) {
            const neighborNode = nodes.find(n => n.id === neighborId)
            if (neighborNode) {
              queue.push(neighborNode)
            }
          }
        })
      }
      
      return result
    }

    const executionOrder = getExecutionOrder(nodes, edges)
    let completedNodes = 0
    let errorCount = 0

    // Execute nodes in order
    for (const node of executionOrder) {
      const nodeData = node.data as Record<string, unknown>
      const nodeName = nodeData.label as string || node.id
      
      // Start node execution
      updateNodeStatus(node.id, 'running')
      addLog(createLog('info', `Executing node: ${nodeName}`, node.id, nodeName))
      
      try {
        const result = await simulateNodeExecution(node)
        
        if (result.success) {
          updateNodeStatus(node.id, 'success')
          addLog(createLog(
            'success', 
            `Node completed successfully`, 
            node.id, 
            nodeName,
            `Execution completed in ${result.duration.toFixed(0)}ms`,
            result.duration
          ))
          completedNodes++
        } else {
          updateNodeStatus(node.id, 'error', result.error)
          addLog(createLog(
            'error', 
            `Node execution failed: ${result.error}`, 
            node.id, 
            nodeName,
            `Failed after ${result.duration.toFixed(0)}ms`,
            result.duration
          ))
          errorCount++
          
          // Stop execution on error (you could make this configurable)
          break
        }
      } catch {
        updateNodeStatus(node.id, 'error', 'Unexpected error')
        addLog(createLog('error', `Unexpected error in node: ${nodeName}`, node.id, nodeName))
        errorCount++
        break
      }
    }

    // Complete execution
    const finalStatus: ExecutionRun['status'] = errorCount > 0 ? 'error' : 'success'
    const endTime = new Date()
    
    const finalRun: ExecutionRun = {
      ...newRun,
      endTime,
      status: finalStatus,
      completedNodes,
      errorCount
    }

    setCurrentRun(finalRun)
    setExecutionRuns(prev => [finalRun, ...prev.slice(0, 9)]) // Keep last 10 runs
    
    addLog(createLog(
      finalStatus === 'success' ? 'success' : 'error',
      `Workflow execution ${finalStatus}. Completed ${completedNodes}/${nodes.length} nodes${errorCount > 0 ? ` with ${errorCount} errors` : ''}`
    ))

    // Reset node statuses after a delay
    setTimeout(() => {
      nodes.forEach(node => {
        updateNodeStatus(node.id, 'idle')
      })
    }, 3000)

  }, [getNodes, getEdges, createLog, addLog, updateNodeStatus, simulateNodeExecution])

  // Clear execution logs
  const clearLogs = useCallback(() => {
    setExecutionRuns([])
    setCurrentRun(null)
    setNodeExecutionState({})
  }, [])

  // Cancel current execution
  const cancelExecution = useCallback(() => {
    if (executionTimeoutRef.current) {
      clearTimeout(executionTimeoutRef.current)
    }
    
    if (currentRun && currentRun.status === 'running') {
      const cancelledRun: ExecutionRun = {
        ...currentRun,
        endTime: new Date(),
        status: 'cancelled'
      }
      
      setCurrentRun(cancelledRun)
      setExecutionRuns(prev => [cancelledRun, ...prev.slice(0, 9)])
      
      addLog(createLog('warning', 'Workflow execution cancelled by user'))
    }
  }, [currentRun, addLog, createLog])

  return {
    executionRuns,
    currentRun,
    nodeExecutionState,
    executeWorkflow,
    clearLogs,
    cancelExecution,
    isExecuting: currentRun?.status === 'running'
  }
}