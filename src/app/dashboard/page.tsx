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
} from '@/components/workflow'
import {
  ConnectionFeedback,
  useConnectionFeedback,
  WorkflowToolbar,
  useWorkflowState,
  EmptyCanvasWelcome,
  ResponsiveLayout,
  AdvancedCanvasControls,
  KeyboardShortcuts,
  useUndoRedo,
  useAutoSnapshot,
  useUndoRedoKeyboard,
  WorkflowManager,
  ValidationPanel,
  WorkflowExecutionWrapper,
} from '@/components/workflow'
import { AuthenticationMonitor } from '@/components/workflow/AuthenticationMonitor'

import { Button } from '@/components/ui/button'
import { Undo, Redo, Save } from 'lucide-react'

import '@xyflow/react/dist/style.css'

// Start with empty canvas for better onboarding experience
const initialNodes: Node[] = []
const initialEdges: Edge[] = []

export default function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null)
  const { feedback, showFeedback, clearFeedback } = useConnectionFeedback()
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
  const [validationPanelVisible, setValidationPanelVisible] = useState(false)

  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)

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

  // Auto-save and validate when nodes/edges change
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      // Validate workflow (debounced)
      const validationTimeout = setTimeout(() => {
        validateCurrentWorkflow(nodes, edges)
      }, 100) // Small delay to prevent excessive validation calls

      // Auto-save after 5 seconds of inactivity
      const autoSaveTimeout = setTimeout(() => {
        handleAutoSave(nodes, edges)
      }, 5000)

      return () => {
        clearTimeout(validationTimeout)
        clearTimeout(autoSaveTimeout)
      }
    }
  }, [nodes, edges, handleAutoSave, validateCurrentWorkflow])

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
    (changes: NodeChange[]) => {
      setNodes(nodesSnapshot => {
        const newNodes = applyNodeChanges(changes, nodesSnapshot)
        // Schedule snapshot for undo/redo (debounced)
        setTimeout(
          () => autoSnapshot.scheduleSnapshot('Node modification'),
          100
        )
        return newNodes
      })
      // Don't reset validation here - let the useEffect handle it
    },
    [autoSnapshot]
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
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
          // Schedule snapshot for undo/redo
          setTimeout(
            () => autoSnapshot.scheduleSnapshot('Connection created'),
            100
          )
          return newEdges
        })
        showFeedback('Connection created successfully!', 'success')
      } else {
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

  // Drag and drop handlers
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!reactFlowBounds || !reactFlowInstance) return

      try {
        const nodeTypeData = event.dataTransfer.getData('application/reactflow')
        const nodeType: NodeTypeDefinition = JSON.parse(nodeTypeData)

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
          },
        }

        setNodes(nds => {
          const newNodes = nds.concat(newNode)
          // Schedule snapshot for undo/redo
          setTimeout(() => autoSnapshot.scheduleSnapshot('Node added'), 100)
          return newNodes
        })
        // Don't reset validation here - let the useEffect handle it
      } catch (error) {
        console.error('Error parsing dropped node data:', error)
      }
    },
    [autoSnapshot, reactFlowInstance]
  )

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1D1D1D]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
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
              onRunTest={executeWorkflow}
              onSave={() => handleSave(nodes, edges)}
              onToggleStatus={handleToggleStatus}
            />
          }
          sidebar={<NodeLibrary />}
          debugPanel={null}
          gmailPanel={null}
        >
          {/* Header with user info, controls, and logout */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">


            {/* Undo/Redo Controls */}
            <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-lg p-1 border">
              <Button
                size="sm"
                variant="ghost"
                disabled={!undoRedo.canUndo}
                onClick={() => {
                  const snapshot = undoRedo.undo()
                  if (snapshot) {
                    applySnapshot(snapshot)
                    setTimeout(() => undoRedo.finishApplyingHistory(), 0)
                  }
                }}
                title="Undo (Ctrl+Z)"
              >
                <Undo size={14} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={!undoRedo.canRedo}
                onClick={() => {
                  const snapshot = undoRedo.redo()
                  if (snapshot) {
                    applySnapshot(snapshot)
                    setTimeout(() => undoRedo.finishApplyingHistory(), 0)
                  }
                }}
                title="Redo (Ctrl+Y)"
              >
                <Redo size={14} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSave(nodes, edges)}
                title="Save Workflow (Ctrl+S)"
              >
                <Save size={14} />
              </Button>
            </div>

            {/* Workflow Manager */}
            <WorkflowManager
              currentNodes={nodes}
              currentEdges={edges}
              currentWorkflowState={workflowState}
              onLoadWorkflow={(loadedNodes, loadedEdges, loadedState) => {
                setNodes(loadedNodes)
                setEdges(loadedEdges)
                updateWorkflowState(loadedState)
                // Take snapshot after loading
                setTimeout(
                  () =>
                    undoRedo.takeSnapshot(
                      loadedNodes,
                      loadedEdges,
                      'Workflow loaded'
                    ),
                  100
                )
              }}
              onCreateNew={() => {
                const newState = createNewWorkflow()
                setNodes([])
                setEdges([])
                updateWorkflowState(newState)
                // Clear undo/redo history for new workflow
                undoRedo.clearHistory()
              }}
            />

            {/* User info and logout */}
            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border">
              <span className="text-sm">
                Welcome, {user.email?.split('@')[0]}!
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
              >
                Logout
              </button>
            </div>
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
              <ConfigPanel />
            </ReactFlow>

            {/* Empty Canvas Welcome Screen */}
            {nodes.length === 0 && (
              <EmptyCanvasWelcome
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onWorkflowStateChange={updateWorkflowState}
              />
            )}
          </div>

          {/* Keyboard Shortcuts Handler */}
          <KeyboardShortcuts
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onSave={() => handleSave(nodes, edges)}
            onRunTest={executeWorkflow}
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
          </ResponsiveLayout>
        )}
      </WorkflowExecutionWrapper>
    </ReactFlowProvider>
  )
}
