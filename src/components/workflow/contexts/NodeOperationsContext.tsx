/**
 * Context for providing node operations stack functionality to the workflow
 * Tracks individual node additions and deletions with timestamps
 */

'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { type Node, type Edge } from '@xyflow/react'
import { useNodeOperationsStack, type NodeOperation, type NodeOperationType } from '../hooks/useNodeOperationsStack'

interface NodeOperationsContextValue {
  // Actions
  recordNodeAddition: (node: Node, connectedEdges?: Edge[]) => void
  recordNodeDeletion: (node: Node, connectedEdges: Edge[]) => void
  undoLastOperation: () => {
    operation: NodeOperation
    shouldAdd: boolean
    node: Node
    connectedEdges: Edge[]
  } | null
  clearOperations: () => void
  
  // Queries
  getLastOperation: () => NodeOperation | null
  getOperationsByType: (type: NodeOperationType) => NodeOperation[]
  getRecentlyAddedNodes: (count?: number) => Node[]
  getRecentlyDeletedNodes: (count?: number) => { node: Node; connectedEdges: Edge[] }[]
  
  // State
  operations: NodeOperation[]
  operationsCount: number
  canUndo: boolean
  sessionId: string
  
  // Statistics
  additionsCount: number
  deletionsCount: number
}

const NodeOperationsContext = createContext<NodeOperationsContextValue | null>(null)

interface NodeOperationsProviderProps {
  children: ReactNode
}

export function NodeOperationsProvider({ children }: NodeOperationsProviderProps) {
  const nodeOperationsStack = useNodeOperationsStack()

  return (
    <NodeOperationsContext.Provider value={nodeOperationsStack}>
      {children}
    </NodeOperationsContext.Provider>
  )
}

export function useNodeOperationsContext(): NodeOperationsContextValue {
  const context = useContext(NodeOperationsContext)
  if (!context) {
    throw new Error('useNodeOperationsContext must be used within a NodeOperationsProvider')
  }
  return context
}
