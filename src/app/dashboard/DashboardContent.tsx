/**
 * Dashboard Content - Wrapped to access NodeOperationsContext
 */

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import {
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type ReactFlowInstance,
  Background,
} from '@xyflow/react'
import {
  NodeLibrary,
  type NodeTypeDefinition,
  nodeTypes,
  edgeTypes,
  ConfigPanel,
  validateConnection,
  ConnectionFeedback,
  useConnectionFeedback,
  WorkflowToolbar,
  useWorkflowState,
  ResponsiveLayout,
  AdvancedCanvasControls,
  KeyboardShortcuts,
  useUndoRedo,
  useAutoSnapshot,
  useUndoRedoKeyboard,
  WorkflowManager,
  ValidationPanel,
  WorkflowExecutionWrapper,
  NodeOperationControls,
} from '@/components/workflow'
import { useNodeOperationsContext } from '@/components/workflow/contexts/NodeOperationsContext'
import { AuthenticationMonitor } from '@/components/workflow/AuthenticationMonitor'
import WorkflowDatabaseClient from '@/lib/database-client'
import type { 
  Workflow, 
  Node as DatabaseNode, 
  NodeConnection,
  CompleteWorkflow,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  CreateNodeRequest,
  CreateConnectionRequest,
  NodeType
} from '@/types/database'
import type { WorkflowState } from '@/components/workflow/toolbar/WorkflowToolbar'

import '@xyflow/react/dist/style.css'

// =============================================================================
// DAG utilities (client-side)
// =============================================================================

function computeTopologicalOrder(nodes: Node[], edges: Edge[]): string[] {
  const nodeIds = nodes.map(n => n.id)
  const adjacency: Record<string, string[]> = {}
  const inDegree: Record<string, number> = {}
  nodeIds.forEach(id => {
    adjacency[id] = []
    inDegree[id] = 0
  })
  edges.forEach(e => {
    if (adjacency[e.source]) {
      adjacency[e.source].push(e.target)
    }
    if (inDegree[e.target] !== undefined) {
      inDegree[e.target] += 1
    }
  })

  const queue: string[] = []
  Object.keys(inDegree).forEach(id => {
    if (inDegree[id] === 0) queue.push(id)
  })

  const order: string[] = []
  let idx = 0
  while (idx < queue.length) {
    const current = queue[idx++]
    order.push(current)
    for (const neighbor of adjacency[current]) {
      inDegree[neighbor] -= 1
      if (inDegree[neighbor] === 0) queue.push(neighbor)
    }
  }

  // If cycle detected (order shorter), return what we have to avoid blocking save
  return order
}

function computeDagStructure(nodes: Node[], edges: Edge[]): string[][] {
  // Level-based decomposition using in-degree layering
  const nodeIds = nodes.map(n => n.id)
  const adjacency: Record<string, string[]> = {}
  const inDegree: Record<string, number> = {}
  nodeIds.forEach(id => {
    adjacency[id] = []
    inDegree[id] = 0
  })
  edges.forEach(e => {
    if (adjacency[e.source]) adjacency[e.source].push(e.target)
    if (inDegree[e.target] !== undefined) inDegree[e.target] += 1
  })

  const levels: string[][] = []
  let currentLevel: string[] = Object.keys(inDegree).filter(id => inDegree[id] === 0)
  const remainingInDegree: Record<string, number> = { ...inDegree }

  const visited: Set<string> = new Set()
  while (currentLevel.length > 0) {
    levels.push(currentLevel)
    const nextLevelCandidates: string[] = []
    for (const id of currentLevel) {
      visited.add(id)
      for (const neighbor of adjacency[id]) {
        remainingInDegree[neighbor] -= 1
        if (remainingInDegree[neighbor] === 0) {
          nextLevelCandidates.push(neighbor)
        }
      }
    }
    currentLevel = nextLevelCandidates.filter(id => !visited.has(id))
  }

  // Include any isolated or cyclic nodes not covered
  const uncovered = nodeIds.filter(id => !levels.flat().includes(id))
  if (uncovered.length > 0) {
    levels.push(uncovered)
  }

  return levels
}

// Start with empty canvas for better onboarding experience
const initialNodes: Node[] = []
const initialEdges: Edge[] = []

export function DashboardContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null)
  const { feedback, showFeedback, clearFeedback } = useConnectionFeedback()
  const { recordNodeAddition } = useNodeOperationsContext()
  
  const {
    workflowState,
    updateWorkflowState,
    handleSave,
    handleAutoSave,
    handleToggleStatus,
    validateCurrentWorkflow,
    createNewWorkflow,
  } = useWorkflowState({
    name: 'Untitled Workflow',
  })

  // Will be provided by WorkflowExecutionWrapper inside ReactFlowProvider
  const [validationPanelVisible, setValidationPanelVisible] = useState(false) // Start hidden to avoid clutter
  const [workflowManagerOpen, setWorkflowManagerOpen] = useState(false)
  const [executionErrors, setExecutionErrors] = useState<Array<{
    nodeId: string
    nodeLabel: string
    message: string
    suggestion?: string
  }>>([])

  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)
  
  // Database integration state
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null)
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const addExecutionError = useCallback((error: {
    nodeId: string
    nodeLabel: string
    message: string
    suggestion?: string
  }) => {
    setExecutionErrors(prev => [...prev, error])
  }, [])

  const clearExecutionErrors = useCallback(() => {
    setExecutionErrors([])
  }, [])


  // Helper functions to convert between React Flow and Database types
  const convertReactFlowNodeToDatabase = useCallback((node: Node): CreateNodeRequest => {
    // Map React Flow node types to database node types
    const nodeTypeMapping: Record<string, NodeType> = {
      'email-trigger': 'trigger',
      'webhook-trigger': 'trigger',
      'schedule-trigger': 'trigger',
      'trello-action': 'trello-action',
      'asana-action': 'asana-action',
      'condition-logic': 'logic',
      'ai-tagging': 'ai-tagging',
      'ai-classification': 'ai-classification'
    }

    const dbNodeType = nodeTypeMapping[node.data.nodeType as string] || (node.data.nodeType as NodeType)

    console.log('🔄 [NODE CONVERSION] Converting React Flow node to database:', {
      reactFlowNodeType: node.data.nodeType,
      databaseNodeType: dbNodeType,
      nodeId: node.id,
      nodeLabel: node.data.label
    })

    return {
      workflow_id: currentWorkflow?.id || '',
      node_type: dbNodeType,
      name: node.data.label as string,
      position_x: Math.round(node.position.x),
      position_y: Math.round(node.position.y)
    }
  }, [currentWorkflow?.id])

  const convertDatabaseNodeToReactFlow = useCallback((dbNode: DatabaseNode): Node => {
    // Map database node types back to React Flow node types
    const reverseNodeTypeMapping: Record<NodeType, string> = {
      'trigger': 'email-trigger', // Default to email-trigger for trigger nodes
      'trello-action': 'trello-action',
      'asana-action': 'asana-action',
      'logic': 'logic',
      'ai-tagging': 'ai-tagging',
      'ai-classification': 'ai-classification'
    }

    const reactFlowNodeType = reverseNodeTypeMapping[dbNode.node_type] || dbNode.node_type

    console.log('🔄 [NODE CONVERSION] Converting database node to React Flow:', {
      databaseNodeType: dbNode.node_type,
      reactFlowNodeType: reactFlowNodeType,
      nodeId: dbNode.id,
      nodeLabel: dbNode.name
    })

    return {
      id: dbNode.id,
      type: reactFlowNodeType,
      position: { x: dbNode.position_x, y: dbNode.position_y },
      data: {
        label: dbNode.name,
        nodeType: reactFlowNodeType,
        icon: '', // Will be set based on node type
        color: '', // Will be set based on node type
        status: 'idle'
      }
    }
  }, [])

  // Deprecated: connections are no longer persisted; DAG is saved on workflows table
  const convertReactFlowEdgeToDatabase = useCallback((edge: Edge): CreateConnectionRequest => {
    return {
      workflow_id: currentWorkflow?.id || '',
      source_node_id: edge.source,
      target_node_id: edge.target
    }
  }, [currentWorkflow?.id])

  const convertDatabaseConnectionToReactFlow = useCallback((dbConnection: NodeConnection): Edge => {
    return {
      id: dbConnection.id,
      source: dbConnection.source_node_id,
      target: dbConnection.target_node_id,
      type: 'default'
    }
  }, [])

  // Database operations
  const saveWorkflowToDatabase = useCallback(async (workflowName: string, description?: string) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    console.log('💾 [DATABASE] Starting workflow save operation...', {
      operation: currentWorkflow ? 'UPDATE' : 'CREATE',
      workflowName,
      description,
      userId: user.id,
      currentWorkflowId: currentWorkflow?.id,
      nodesCount: nodes.length,
      edgesCount: edges.length,
      timestamp: new Date().toISOString()
    })

    setSaveError(null)
    setIsLoadingWorkflow(true)

    try {
      let workflow: Workflow

      if (currentWorkflow && currentWorkflow.id) {
        // Update existing workflow
        console.log('🔄 [DATABASE] Updating existing workflow...', {
          workflowId: currentWorkflow.id,
          userId: user.id,
          updateData: {
            name: workflowName,
            description,
            is_active: workflowState.status === 'active' || workflowState.status === 'testing'
          }
        })

        const updateRequest: UpdateWorkflowRequest = {
          name: workflowName,
          description,
          is_active: workflowState.status === 'active' || workflowState.status === 'testing'
        }

        const { data, error } = await WorkflowDatabaseClient.updateWorkflow(
          currentWorkflow.id,
          user.id,
          updateRequest
        )

        if (error) {
          console.error('❌ [DATABASE] Workflow update failed:', error)
          throw new Error(error)
        }
        
        workflow = data!
        console.log('✅ [DATABASE] Workflow updated successfully:', {
          workflowId: workflow.id,
          name: workflow.name,
          isActive: workflow.is_active
        })
      } else {
        // Create new workflow
        console.log('🆕 [DATABASE] Creating new workflow...', {
          userId: user.id,
          createData: {
            name: workflowName,
            description
          }
        })

        const createRequest: CreateWorkflowRequest = {
          name: workflowName,
          description
        }

        const { data, error } = await WorkflowDatabaseClient.createWorkflow(user.id, createRequest)
        if (error) {
          console.error('❌ [DATABASE] Workflow creation failed:', error)
          throw new Error(error)
        }
        
        workflow = data!
        setCurrentWorkflow(workflow)
        console.log('✅ [DATABASE] Workflow created successfully:', {
          workflowId: workflow.id,
          name: workflow.name,
          isActive: workflow.is_active
        })
      }

      // Sync nodes (create, update, delete)
      console.log('🔧 [DATABASE] Syncing nodes...', {
        workflowId: workflow.id,
        nodesCount: nodes.length,
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.data.nodeType,
          name: node.data.label,
          position: node.position
        }))
      })

      // Get existing nodes from database
      const { data: existingDbNodes, error: fetchError } = await WorkflowDatabaseClient.getWorkflowNodes(workflow.id)
      if (fetchError) {
        console.error('❌ [DATABASE] Failed to fetch existing nodes:', fetchError)
        throw new Error(fetchError)
      }

      const existingNodeIds = new Set(existingDbNodes?.map(n => n.id) || [])
      const currentNodeIds = new Set(nodes.map(n => n.id))

      // Delete nodes that no longer exist in React Flow
      const nodesToDelete = existingDbNodes?.filter(dbNode => !currentNodeIds.has(dbNode.id)) || []
      for (const nodeToDelete of nodesToDelete) {
        console.log('🗑️ [DATABASE] Deleting node:', {
          nodeId: nodeToDelete.id,
          nodeType: nodeToDelete.node_type,
          name: nodeToDelete.name
        })

        const { error: deleteError } = await WorkflowDatabaseClient.deleteNode(nodeToDelete.id)
        if (deleteError) {
          console.error('❌ [DATABASE] Node deletion failed:', {
            nodeId: nodeToDelete.id,
            error: deleteError
          })
        } else {
          console.log('✅ [DATABASE] Node deleted successfully:', {
            nodeId: nodeToDelete.id
          })
        }
      }

      // Create or update nodes
      for (const node of nodes) {
        const nodeRequest = convertReactFlowNodeToDatabase(node)
        nodeRequest.workflow_id = workflow.id

        if (existingNodeIds.has(node.id)) {
          // Update existing node
          console.log('🔄 [DATABASE] Updating node:', {
            nodeId: node.id,
            workflowId: workflow.id,
            nodeType: nodeRequest.node_type,
            name: nodeRequest.name,
            position: { x: nodeRequest.position_x, y: nodeRequest.position_y }
          })

          const { data: updatedNode, error: updateError } = await WorkflowDatabaseClient.updateNode(node.id, nodeRequest)
          if (updateError) {
            console.error('❌ [DATABASE] Node update failed:', {
              nodeId: node.id,
              error: updateError
            })
          } else {
            console.log('✅ [DATABASE] Node updated successfully:', {
              nodeId: updatedNode!.id,
              nodeType: updatedNode!.node_type,
              name: updatedNode!.name
            })
          }
        } else {
          // Create new node
          console.log('📝 [DATABASE] Creating node:', {
            nodeId: node.id,
            workflowId: workflow.id,
            nodeType: nodeRequest.node_type,
            name: nodeRequest.name,
            position: { x: nodeRequest.position_x, y: nodeRequest.position_y }
          })

          const { data: savedNode, error: nodeError } = await WorkflowDatabaseClient.createNode(nodeRequest)
          if (nodeError) {
            console.error('❌ [DATABASE] Node creation failed:', {
              nodeId: node.id,
              error: nodeError
            })
            continue
          }

          console.log('✅ [DATABASE] Node created successfully:', {
            originalId: node.id,
            savedId: savedNode!.id,
            nodeType: savedNode!.node_type,
            name: savedNode!.name
          })

          // Update the node ID in the React Flow state
          setNodes(prevNodes => 
            prevNodes.map(n => 
              n.id === node.id ? { ...n, id: savedNode!.id } : n
            )
          )
        }
      }

      // Persist DAG on workflow (dag_structure + execution_order)
      const dag = computeDagStructure(nodes, edges)
      const topo = computeTopologicalOrder(nodes, edges)

      console.log('🧭 [DATABASE] Saving DAG to workflow...', {
        workflowId: workflow.id,
        dagLevelsCount: dag.length,
        executionOrderCount: topo.length
      })

      const { error: dagSaveError } = await WorkflowDatabaseClient.updateWorkflow(
        workflow.id,
        user.id,
        {
          dag_structure: dag,
          execution_order: topo
        }
      )
      if (dagSaveError) {
        console.error('❌ [DATABASE] Failed to save DAG to workflow:', dagSaveError)
        // Do not throw; nodes already saved. Surface error to UI only.
        setSaveError(dagSaveError)
      }

      // Update workflow state with the saved workflow
      updateWorkflowState({
        id: workflow.id,
        name: workflow.name,
        status: workflow.is_active ? 'active' : 'draft'
      })

      console.log('🎉 [DATABASE] Workflow save operation completed successfully:', {
        workflowId: workflow.id,
        name: workflow.name,
        nodesSaved: nodes.length,
        connectionsSaved: edges.length,
        timestamp: new Date().toISOString()
      })

      return workflow
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save workflow'
      console.error('💥 [DATABASE] Workflow save operation failed:', {
        error: errorMessage,
        workflowName,
        userId: user.id,
        timestamp: new Date().toISOString()
      })
      setSaveError(errorMessage)
      throw error
    } finally {
      setIsLoadingWorkflow(false)
    }
  }, [user, currentWorkflow, nodes, edges, workflowState.status, convertReactFlowNodeToDatabase, convertReactFlowEdgeToDatabase, updateWorkflowState])


  const loadWorkflowFromDatabase = useCallback(async (workflowId: string) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    console.log('📥 [DATABASE] Starting workflow load operation...', {
      workflowId,
      userId: user.id,
      timestamp: new Date().toISOString()
    })

    setIsLoadingWorkflow(true)
    setSaveError(null)

    try {
      // Get workflow
      console.log('🔍 [DATABASE] Fetching workflow...', { workflowId, userId: user.id })
      const { data: workflow, error: workflowError } = await WorkflowDatabaseClient.getWorkflow(workflowId, user.id)
      if (workflowError) {
        console.error('❌ [DATABASE] Workflow fetch failed:', workflowError)
        throw new Error(workflowError)
      }
      if (!workflow) {
        console.error('❌ [DATABASE] Workflow not found:', { workflowId, userId: user.id })
        throw new Error('Workflow not found')
      }

      console.log('✅ [DATABASE] Workflow fetched successfully:', {
        workflowId: workflow.id,
        name: workflow.name,
        isActive: workflow.is_active
      })

      setCurrentWorkflow(workflow)

      // Get nodes
      console.log('🔍 [DATABASE] Fetching workflow nodes...', { workflowId })
      const { data: dbNodes, error: nodesError } = await WorkflowDatabaseClient.getWorkflowNodes(workflowId)
      if (nodesError) {
        console.error('❌ [DATABASE] Nodes fetch failed:', nodesError)
        throw new Error(nodesError)
      }

      const reactFlowNodes = dbNodes?.map(convertDatabaseNodeToReactFlow) || []
      console.log('✅ [DATABASE] Nodes fetched successfully:', {
        nodesCount: reactFlowNodes.length,
        nodes: reactFlowNodes.map(node => ({
          id: node.id,
          type: node.data.nodeType,
          name: node.data.label,
          position: node.position
        }))
      })
      setNodes(reactFlowNodes)

      // Connections are not fetched; edges remain client-side only for now
      setEdges([])

      // Update workflow state
      updateWorkflowState({
        id: workflow.id,
        name: workflow.name,
        status: workflow.is_active ? 'active' : 'draft'
      })

      console.log('🎉 [DATABASE] Workflow load operation completed successfully:', {
        workflowId: workflow.id,
        name: workflow.name,
        nodesLoaded: reactFlowNodes.length,
        connectionsLoaded: 0,
        timestamp: new Date().toISOString()
      })

      return { workflow, nodes: reactFlowNodes, edges: reactFlowEdges }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load workflow'
      console.error('💥 [DATABASE] Workflow load operation failed:', {
        error: errorMessage,
        workflowId,
        userId: user.id,
        timestamp: new Date().toISOString()
      })
      setSaveError(errorMessage)
      throw error
    } finally {
      setIsLoadingWorkflow(false)
    }
  }, [user, convertDatabaseNodeToReactFlow, convertDatabaseConnectionToReactFlow, updateWorkflowState])

  // Initial validation when component mounts
  useEffect(() => {
    // Validate initial state (empty workflow)
    validateCurrentWorkflow(initialNodes, initialEdges)
  }, [validateCurrentWorkflow])

  // Undo/Redo functionality
  const undoRedo = useUndoRedo(initialNodes, initialEdges)
  const autoSnapshot = useAutoSnapshot(nodes, edges, undoRedo, 2000) // 2 second debounce

  // Apply undo/redo snapshot
  const applySnapshot = useCallback(
    (snapshot: { nodes: Node[]; edges: Edge[] }) => {
      setNodes(snapshot.nodes)
      setEdges(snapshot.edges)
    },
    []
  )

  // Keyboard shortcuts for undo/redo
  const { handleKeyDown } = useUndoRedoKeyboard(undoRedo, applySnapshot)

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      autoSnapshot.cleanup()
    }
  }, [handleKeyDown, autoSnapshot])

  // Validate when nodes/edges change (manual save only for MVP)
  useEffect(() => {
    // Clear execution errors when workflow changes
    clearExecutionErrors()
    
    // Always validate workflow, even when empty (to show proper empty state messages)
    const validationTimeout = setTimeout(() => {
      validateCurrentWorkflow(nodes, edges)
    }, 100) // Small delay to prevent excessive validation calls

    return () => {
      clearTimeout(validationTimeout)
    }
  }, [nodes, edges, validateCurrentWorkflow, clearExecutionErrors])

  // Create serializable wrapper functions
  const handleNodesChange = useCallback(
    (newNodes: Node[]) => {
      setNodes(newNodes)
      // Schedule snapshot for undo/redo (debounced)
      setTimeout(() => autoSnapshot.scheduleSnapshot('Node changes'), 200)
    },
    [autoSnapshot]
  )

  const handleEdgesChange = useCallback(
    (newEdges: Edge[]) => {
      setEdges(newEdges)
      // Schedule snapshot for undo/redo (debounced)
      setTimeout(() => autoSnapshot.scheduleSnapshot('Edge changes'), 200)
    },
    [autoSnapshot]
  )

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  const onNodesChange = useCallback(
    async (changes: NodeChange[]) => {
      // Check for node deletions and delete from database
      const deleteChanges = changes.filter(change => change.type === 'remove')
      for (const deleteChange of deleteChanges) {
        if (deleteChange.type === 'remove') {
          console.log('🗑️ [DASHBOARD] Node deleted from canvas, deleting from database:', {
            nodeId: deleteChange.id
          })
          
          try {
            const { error } = await WorkflowDatabaseClient.deleteNode(deleteChange.id)
            if (error) {
              console.error('❌ [DASHBOARD] Failed to delete node from database:', {
                nodeId: deleteChange.id,
                error
              })
              // Show error toast or handle gracefully
            } else {
              console.log('✅ [DASHBOARD] Node deleted from database successfully:', {
                nodeId: deleteChange.id
              })
            }
          } catch (error) {
            console.error('❌ [DASHBOARD] Error deleting node from database:', {
              nodeId: deleteChange.id,
              error
            })
          }
        }
      }

      setNodes(nodesSnapshot => {
        const newNodes = applyNodeChanges(changes, nodesSnapshot)
        // Schedule snapshot for undo/redo (debounced)
        setTimeout(
          () => autoSnapshot.scheduleSnapshot('Node modification'),
          100
        )
        // The main useEffect will handle validation automatically
        return newNodes
      })
    },
    [autoSnapshot]
  )

  const onEdgesChange = useCallback(
    async (changes: EdgeChange[]) => {
      setEdges(edgesSnapshot => {
        const newEdges = applyEdgeChanges(changes, edgesSnapshot)
        // Schedule snapshot for undo/redo (debounced)
        setTimeout(
          () => autoSnapshot.scheduleSnapshot('Edge modification'),
          100
        )
        return newEdges
      })
      // Don't reset validation here - let the useEffect handle it
    },
    [autoSnapshot]
  )

  const onConnect = useCallback(
    (params: Connection) => {
      // Validate the connection before adding it
      const validation = validateConnection(params, nodes, edges)

      if (validation.isValid) {
        setEdges(edgesSnapshot => {
          const newEdges = addEdge(params, edgesSnapshot)
          const newEdge = newEdges[newEdges.length - 1] // Get the newly added edge
          
          console.log('🔗 [CONNECTION] Created new connection:', {
            id: newEdge.id,
            source: newEdge.source,
            target: newEdge.target,
            sourceHandle: newEdge.sourceHandle,
            targetHandle: newEdge.targetHandle,
            type: newEdge.type,
            timestamp: new Date().toISOString()
          })
          
          console.log('📊 [CONNECTION] Updated edges state:', {
            previousCount: edgesSnapshot.length,
            newCount: newEdges.length,
            addedConnection: {
              id: newEdge.id,
              source: newEdge.source,
              target: newEdge.target
            }
          })
          
          // Schedule snapshot for undo/redo
          setTimeout(
            () => autoSnapshot.scheduleSnapshot('Connection created'),
            100
          )
          return newEdges
        })
        showFeedback('Connection created successfully!', 'success')
      } else {
        console.log('❌ [CONNECTION] Invalid connection attempt:', {
          source: params.source,
          target: params.target,
          reason: validation.reason,
          timestamp: new Date().toISOString()
        })
        // Show error feedback with specific reason
        showFeedback(validation.reason || 'Invalid connection', 'error')
      }
    },
    [nodes, edges, showFeedback, autoSnapshot]
  )

  // Provide real-time validation feedback during connection attempts
  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      // Handle both Connection and Edge types
      const connectionParams: Connection = {
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle || null,
        targetHandle: connection.targetHandle || null,
      }

      const validation = validateConnection(connectionParams, nodes, edges)
      return validation.isValid
    },
    [nodes, edges]
  )

  // Handle node operations undo
  const handleUndoOperation = useCallback((shouldAdd: boolean, node: Node, connectedEdges: Edge[]) => {
    if (shouldAdd) {
      // Add the node back
      setNodes(currentNodes => {
        const existingNode = currentNodes.find(n => n.id === node.id)
        if (existingNode) {
          return currentNodes.map(n => n.id === node.id ? node : n)
        }
        return [...currentNodes, node]
      })

      // Add back the connected edges
      setEdges(currentEdges => {
        const newEdges = [...currentEdges]
        connectedEdges.forEach(edge => {
          const existingEdge = newEdges.find(e => 
            e.id === edge.id || 
            (e.source === edge.source && 
             e.target === edge.target && 
             e.sourceHandle === edge.sourceHandle && 
             e.targetHandle === edge.targetHandle)
          )
          if (!existingEdge) {
            newEdges.push(edge)
          }
        })
        return newEdges
      })
    } else {
      // Remove the node
      setNodes(currentNodes => currentNodes.filter(n => n.id !== node.id))
      setEdges(currentEdges => currentEdges.filter(edge => 
        edge.source !== node.id && edge.target !== node.id
      ))
    }

    // Take snapshot for the existing undo/redo system
    setTimeout(() => autoSnapshot.scheduleSnapshot('Operation undone'), 100)
    
    
    // The main useEffect will automatically handle validation when nodes/edges state changes
  }, [autoSnapshot])

  // Drag and drop handlers
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      console.log('[DashboardContent] Node drop event triggered')

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!reactFlowBounds || !reactFlowInstance) {
        console.error('[DashboardContent] Missing reactFlowBounds or reactFlowInstance')
        return
      }

      try {
        const nodeTypeData = event.dataTransfer.getData('application/reactflow')
        const nodeType: NodeTypeDefinition = JSON.parse(nodeTypeData)
        console.log('[DashboardContent] Parsed node type:', nodeType)

        // Calculate position relative to the React Flow canvas
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        })

        // Create new node with unique ID and custom type
        const newNode: Node = {
          id: `${nodeType.subtype}-${Date.now()}`,
          type: nodeType.type, // Use the custom node type
          position,
          data: {
            label: nodeType.label,
            nodeType: nodeType.subtype,
            icon: nodeType.icon,
            color: nodeType.color,
            status: 'idle',
            addedAt: Date.now(), // Add timestamp when node is dropped
          },
        }

        console.log('🆕 [NODE] Created new node:', {
          id: newNode.id,
          type: newNode.type,
          nodeType: newNode.data.nodeType,
          label: newNode.data.label,
          position: newNode.position,
          timestamp: new Date().toISOString()
        })

        setNodes(nds => {
          const newNodes = nds.concat(newNode)
          console.log('📊 [NODE] Updated nodes state:', {
            previousCount: nds.length,
            newCount: newNodes.length,
            addedNode: {
              id: newNode.id,
              type: newNode.data.nodeType,
              label: newNode.data.label
            }
          })
          // Record the node addition operation
          recordNodeAddition(newNode, []) // No connected edges when first added
          // Schedule snapshot for undo/redo
          setTimeout(() => autoSnapshot.scheduleSnapshot('Node added'), 100)
          // The main useEffect will automatically handle validation when nodes state changes
          return newNodes
        })
        // Don't reset validation here - let the useEffect handle it
      } catch (error) {
        console.error('[DashboardContent] Error parsing dropped node data:', error)
      }
    },
    [autoSnapshot, reactFlowInstance, recordNodeAddition]
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1D1D1D]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-[rgba(250,250,250,0.6)]">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }


  return (
    <ReactFlowProvider>
      <WorkflowExecutionWrapper>
        {({ executeWorkflow, isExecuting }) => (
          <ResponsiveLayout
          toolbar={
            <WorkflowToolbar
              workflowState={{
                ...workflowState,
                status: isExecuting ? 'testing' : workflowState.status,
              }}
              onWorkflowStateChange={updateWorkflowState}
              onRunTest={() => {
                clearExecutionErrors()
                executeWorkflow(addExecutionError)
              }}
              onSave={async () => {
                try {
                  await saveWorkflowToDatabase(workflowState.name)
                  console.log('Workflow saved to database successfully')
                } catch (error) {
                  console.error('Manual save failed in DashboardContent:', error)
                  // Error is already handled in saveWorkflowToDatabase
                }
              }}
              onToggleStatus={handleToggleStatus}
              onManageWorkflows={() => setWorkflowManagerOpen(true)}
            />
          }
          sidebar={<NodeLibrary />}
                      debugPanel={null}
          gmailPanel={null}
        >
          {/* Header with user info, controls, and logout */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">

            {/* Node Operation Controls */}
            <NodeOperationControls 
              onUndoOperation={handleUndoOperation} 
              currentNodesCount={nodes.length}
            />

            {/* Workflow Manager */}
            <WorkflowManager
              currentNodes={nodes}
              currentEdges={edges}
              currentWorkflowState={workflowState}
              onLoadWorkflow={async (nodes: Node[], edges: Edge[], state: WorkflowState) => {
                try {
                  // The WorkflowManager is calling this with the loaded data
                  // We just need to set the state
                  setNodes(nodes)
                  setEdges(edges)
                  updateWorkflowState(state)
                  // Take snapshot after loading
                  setTimeout(
                    () =>
                      undoRedo.takeSnapshot(
                        nodes,
                        edges,
                        'Workflow loaded'
                      ),
                    100
                  )
                } catch (error) {
                  console.error('Failed to load workflow:', error)
                }
              }}
              open={workflowManagerOpen}
              onOpenChange={setWorkflowManagerOpen}
              hideButton={true}
              onCreateNew={() => {
                const newState = createNewWorkflow()
                setNodes([])
                setEdges([])
                updateWorkflowState(newState)
                // Clear undo/redo history for new workflow
                undoRedo.clearHistory()
                
                // Clear current workflow and save errors in next tick to avoid setState during render
                setTimeout(() => {
                  setCurrentWorkflow(null)
                  setSaveError(null)
                }, 0)
              }}
            />

          </div>

          {/* React Flow Canvas */}
          <div ref={reactFlowWrapper} className="w-full h-full relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              isValidConnection={isValidConnection}
              connectionLineStyle={{
                stroke: '#8b5cf6',
                strokeWidth: 2,
              }}
              colorMode="dark"
              fitView
            >
              <Background />
              <AdvancedCanvasControls nodes={nodes} showMinimap={true} />
              <ConfigPanel currentWorkflowId={currentWorkflow?.id} />
            </ReactFlow>

          </div>

          {/* Keyboard Shortcuts Handler */}
          <KeyboardShortcuts
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onSave={async () => {
              try {
                await saveWorkflowToDatabase(workflowState.name)
                console.log('Workflow saved via keyboard shortcut')
              } catch (error) {
                console.error('Keyboard shortcut save failed in DashboardContent:', error)
                // Error is already handled in saveWorkflowToDatabase
              }
            }}
            onRunTest={() => {
              clearExecutionErrors()
              executeWorkflow(addExecutionError)
            }}
          />

          {/* Validation Panel */}
          <ValidationPanel
            validation={workflowState.lastValidation || null}
            isVisible={validationPanelVisible}
            onToggle={() => setValidationPanelVisible(!validationPanelVisible)}
            onFixError={error => {
              // Handle error fixing - could focus on the problematic node
              console.log('Fix error:', error)
            }}
            hasNodes={nodes.length > 0}
            executionErrors={executionErrors}
          />

          {/* Connection Feedback Toast */}
          {feedback && (
            <ConnectionFeedback
              key={feedback.id}
              message={feedback.message}
              type={feedback.type}
              onClose={clearFeedback}
            />
          )}
          
          {/* Authentication Monitor */}
          <AuthenticationMonitor />

          {/* Database Error Display */}
          {saveError && (
            <div className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-md">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Database Error</h4>
                  <p className="text-sm mt-1">{saveError}</p>
                </div>
                <button
                  onClick={() => setSaveError(null)}
                  className="ml-4 text-white hover:text-gray-200"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoadingWorkflow && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Loading workflow...
              </div>
            </div>
          )}

          </ResponsiveLayout>
        )}
      </WorkflowExecutionWrapper>
    </ReactFlowProvider>
  )
}
