import { type Node, type Edge, type Connection } from '@xyflow/react'

// Define node type categories for connection rules
export type NodeCategory = 'trigger' | 'action' | 'logic' | 'ai'

// Connection rules: what can connect to what
export const CONNECTION_RULES: Record<NodeCategory, NodeCategory[]> = {
  // Triggers can connect to Actions, Logic, or AI nodes (but not other triggers)
  trigger: ['action', 'logic', 'ai'],
  
  // Actions can connect to other Actions, Logic, or AI nodes (for chaining)
  action: ['action', 'logic', 'ai'],
  
  // Logic nodes can connect to Actions or AI nodes (for conditional branching)
  logic: ['action', 'ai'],
  
  // AI nodes can connect to Actions or other AI nodes (for processing chains)
  ai: ['action', 'ai']
}

// Special connection limits (max outgoing connections per node type)
export const CONNECTION_LIMITS: Record<NodeCategory, number> = {
  trigger: 3, // Triggers can have up to 3 outputs
  action: 2,  // Actions can have up to 2 outputs
  logic: 2,   // Logic nodes can have 2 outputs (true/false branches)
  ai: 2       // AI nodes can have up to 2 outputs
}

// Get node category from node data
export function getNodeCategory(node: Node): NodeCategory {
  const nodeData = node.data as { nodeType?: string }
  const nodeType = nodeData.nodeType || node.type
  
  // Map specific node types to categories
  if (nodeType?.includes('trigger') || nodeType === 'trigger') return 'trigger'
  if (nodeType?.includes('action') || nodeType === 'action') return 'action'
  if (nodeType?.includes('logic') || nodeType === 'logic') return 'logic'
  if (nodeType?.includes('ai') || nodeType === 'ai') return 'ai'
  
  // Default fallback
  return 'action'
}

// Check if a connection is valid based on node types
export function isValidConnection(
  sourceNode: Node,
  targetNode: Node,
  existingEdges: Edge[] = []
): { isValid: boolean; reason?: string } {
  // Check for self-connection first
  if (sourceNode.id === targetNode.id) {
    return {
      isValid: false,
      reason: 'Nodes cannot connect to themselves'
    }
  }

  // Get node categories
  const sourceCategory = getNodeCategory(sourceNode)
  const targetCategory = getNodeCategory(targetNode)
  
  // Check if source can connect to target based on rules
  const allowedTargets = CONNECTION_RULES[sourceCategory]
  if (!allowedTargets.includes(targetCategory)) {
    return {
      isValid: false,
      reason: `${sourceCategory} nodes cannot connect to ${targetCategory} nodes`
    }
  }
  
  // Check for duplicate connections
  const duplicateEdge = existingEdges.find(
    edge => edge.source === sourceNode.id && edge.target === targetNode.id
  )
  if (duplicateEdge) {
    return {
      isValid: false,
      reason: 'Connection already exists between these nodes'
    }
  }

  // Check connection limits
  const outgoingConnections = existingEdges.filter(edge => edge.source === sourceNode.id)
  const maxConnections = CONNECTION_LIMITS[sourceCategory]
  if (outgoingConnections.length >= maxConnections) {
    return {
      isValid: false,
      reason: `${sourceCategory} nodes can have maximum ${maxConnections} outgoing connections`
    }
  }
  
  // Check for circular dependencies (basic check)
  if (wouldCreateCircularDependency(sourceNode.id, targetNode.id, existingEdges)) {
    return {
      isValid: false,
      reason: 'Connection would create a circular dependency'
    }
  }
  
  return { isValid: true }
}

// Check if adding an edge would create a circular dependency
function wouldCreateCircularDependency(
  sourceId: string,
  targetId: string,
  existingEdges: Edge[]
): boolean {
  // Create a temporary edge list with the new connection
  const tempEdges = [...existingEdges, { 
    id: 'temp', 
    source: sourceId, 
    target: targetId,
    sourceHandle: null,
    targetHandle: null
  } as Edge]
  
  // Use DFS to detect cycles
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  
  function hasCycle(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) return true
    if (visited.has(nodeId)) return false
    
    visited.add(nodeId)
    recursionStack.add(nodeId)
    
    // Find all outgoing edges from this node
    const outgoingEdges = tempEdges.filter(edge => edge.source === nodeId)
    
    for (const edge of outgoingEdges) {
      if (hasCycle(edge.target)) return true
    }
    
    recursionStack.delete(nodeId)
    return false
  }
  
  // Check for cycles starting from any node
  const allNodeIds = new Set([
    ...tempEdges.map(e => e.source),
    ...tempEdges.map(e => e.target)
  ])
  
  for (const nodeId of allNodeIds) {
    if (!visited.has(nodeId) && hasCycle(nodeId)) {
      return true
    }
  }
  
  return false
}

// Validate a connection attempt
export function validateConnection(
  connection: Connection,
  nodes: Node[],
  edges: Edge[]
): { isValid: boolean; reason?: string } {
  // Handle null or invalid connection
  if (!connection || !connection.source || !connection.target) {
    return {
      isValid: false,
      reason: 'Source or target node not found'
    }
  }

  const sourceNode = nodes.find(node => node.id === connection.source)
  const targetNode = nodes.find(node => node.id === connection.target)
  
  if (!sourceNode || !targetNode) {
    return {
      isValid: false,
      reason: 'Source or target node not found'
    }
  }
  
  return isValidConnection(sourceNode, targetNode, edges)
}

// Get connection feedback for UI
export function getConnectionFeedback(
  connection: Connection,
  nodes: Node[],
  edges: Edge[]
): {
  isValid: boolean
  reason?: string
  color: string
  message: string
} {
  const validation = validateConnection(connection, nodes, edges)
  
  if (validation.isValid) {
    return {
      isValid: true,
      color: '#10b981', // green
      message: 'Valid connection'
    }
  } else {
    return {
      isValid: false,
      reason: validation.reason,
      color: '#ef4444', // red
      message: validation.reason || 'Invalid connection'
    }
  }
}