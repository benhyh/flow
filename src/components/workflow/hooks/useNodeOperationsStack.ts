/**
 * Node Operations Stack Hook
 * Tracks individual node operations (add/delete) with timestamps for precise undo/redo
 */

import { useState, useCallback, useEffect } from 'react'
import { type Node, type Edge } from '@xyflow/react'

export type NodeOperationType = 'add' | 'delete'

export interface NodeOperation {
  id: string // unique operation ID
  type: NodeOperationType
  timestamp: number
  nodeId: string
  node: Node
  connectedEdges: Edge[]
  sessionId: string
}

const NODE_OPERATIONS_KEY = 'flow_node_operations_stack'
const SESSION_ID_KEY = 'flow_session_id'
const MAX_OPERATIONS = 50 // Stack size limit

// Generate a unique session ID for this browser session
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get or create session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY)
  if (!sessionId) {
    sessionId = generateSessionId()
    sessionStorage.setItem(SESSION_ID_KEY, sessionId)
  }
  return sessionId
}

export function useNodeOperationsStack() {
  const [operations, setOperations] = useState<NodeOperation[]>([])
  const sessionId = getSessionId()

  // Load operations from session storage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(NODE_OPERATIONS_KEY)
      if (stored) {
        const allOperations: NodeOperation[] = JSON.parse(stored)
        // Filter only operations from current session and sort by timestamp
        const sessionOperations = allOperations
          .filter(op => op.sessionId === sessionId)
          .sort((a, b) => a.timestamp - b.timestamp)
        setOperations(sessionOperations)
      }
    } catch (error) {
      console.error('Error loading node operations from session storage:', error)
    }
  }, [sessionId])

  // Save operations to session storage
  const saveToSessionStorage = useCallback((ops: NodeOperation[]) => {
    try {
      // Get all operations from storage
      const stored = sessionStorage.getItem(NODE_OPERATIONS_KEY)
      let allOperations: NodeOperation[] = stored ? JSON.parse(stored) : []
      
      // Remove old operations from current session
      allOperations = allOperations.filter(op => op.sessionId !== sessionId)
      
      // Add current session operations
      allOperations.push(...ops)
      
      // Limit total storage size (keep most recent operations across all sessions)
      if (allOperations.length > MAX_OPERATIONS * 3) {
        allOperations = allOperations
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, MAX_OPERATIONS * 2)
      }
      
      sessionStorage.setItem(NODE_OPERATIONS_KEY, JSON.stringify(allOperations))
    } catch (error) {
      console.error('Error saving node operations to session storage:', error)
    }
  }, [sessionId])

  // Record a node addition
  const recordNodeAddition = useCallback((
    node: Node, 
    connectedEdges: Edge[] = []
  ) => {
    const operation: NodeOperation = {
      id: `add_${node.id}_${Date.now()}`,
      type: 'add',
      timestamp: Date.now(),
      nodeId: node.id,
      node: JSON.parse(JSON.stringify(node)), // Deep clone
      connectedEdges: JSON.parse(JSON.stringify(connectedEdges)), // Deep clone
      sessionId
    }

    const updatedOperations = [...operations, operation]
    
    // Limit stack size (keep most recent operations)
    if (updatedOperations.length > MAX_OPERATIONS) {
      updatedOperations.shift()
    }
    
    setOperations(updatedOperations)
    saveToSessionStorage(updatedOperations)
  }, [operations, sessionId, saveToSessionStorage])

  // Record a node deletion
  const recordNodeDeletion = useCallback((
    node: Node, 
    connectedEdges: Edge[]
  ) => {
    const operation: NodeOperation = {
      id: `delete_${node.id}_${Date.now()}`,
      type: 'delete',
      timestamp: Date.now(),
      nodeId: node.id,
      node: JSON.parse(JSON.stringify(node)), // Deep clone
      connectedEdges: JSON.parse(JSON.stringify(connectedEdges)), // Deep clone
      sessionId
    }

    const updatedOperations = [...operations, operation]
    
    // Limit stack size
    if (updatedOperations.length > MAX_OPERATIONS) {
      updatedOperations.shift()
    }
    
    setOperations(updatedOperations)
    saveToSessionStorage(updatedOperations)
  }, [operations, sessionId, saveToSessionStorage])

  // Get the last operation for undo
  const getLastOperation = useCallback((): NodeOperation | null => {
    if (operations.length === 0) return null
    return operations[operations.length - 1]
  }, [operations])

  // Undo the last operation
  const undoLastOperation = useCallback((): {
    operation: NodeOperation
    shouldAdd: boolean // true if we should add node back, false if we should remove it
    node: Node
    connectedEdges: Edge[]
  } | null => {
    const lastOperation = getLastOperation()
    if (!lastOperation) return null

    // Remove the operation from the stack
    const updatedOperations = operations.slice(0, -1)
    setOperations(updatedOperations)
    saveToSessionStorage(updatedOperations)

    // Return the inverse operation data
    return {
      operation: lastOperation,
      shouldAdd: lastOperation.type === 'delete', // If last op was delete, we should add back
      node: JSON.parse(JSON.stringify(lastOperation.node)),
      connectedEdges: JSON.parse(JSON.stringify(lastOperation.connectedEdges))
    }
  }, [operations, getLastOperation, saveToSessionStorage])

  // Get operations by type for debugging/analysis
  const getOperationsByType = useCallback((type: NodeOperationType) => {
    return operations.filter(op => op.type === type)
  }, [operations])

  // Clear all operations for current session
  const clearOperations = useCallback(() => {
    setOperations([])
    saveToSessionStorage([])
  }, [saveToSessionStorage])

  // Get recently added nodes (within last N operations)
  const getRecentlyAddedNodes = useCallback((count: number = 5) => {
    return operations
      .filter(op => op.type === 'add')
      .slice(-count)
      .map(op => op.node)
  }, [operations])

  // Get recently deleted nodes (within last N operations)
  const getRecentlyDeletedNodes = useCallback((count: number = 5) => {
    return operations
      .filter(op => op.type === 'delete')
      .slice(-count)
      .map(op => ({ node: op.node, connectedEdges: op.connectedEdges }))
  }, [operations])

  return {
    // Actions
    recordNodeAddition,
    recordNodeDeletion,
    undoLastOperation,
    clearOperations,
    
    // Queries
    getLastOperation,
    getOperationsByType,
    getRecentlyAddedNodes,
    getRecentlyDeletedNodes,
    
    // State
    operations,
    operationsCount: operations.length,
    canUndo: operations.length > 0,
    sessionId,
    
    // Statistics
    additionsCount: operations.filter(op => op.type === 'add').length,
    deletionsCount: operations.filter(op => op.type === 'delete').length
  }
}
