'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { ReactFlow, ReactFlowProvider, applyNodeChanges, applyEdgeChanges, addEdge, type Node, type Edge, type NodeChange, type EdgeChange, type Connection, type ReactFlowInstance, Background } from '@xyflow/react'
import { NodeLibrary, type NodeTypeDefinition } from '@/components/workflow/NodeLibrary'
import { nodeTypes } from '@/components/workflow/nodeTypes'
import { edgeTypes } from '@/components/workflow/edgeTypes'
import { ConfigPanel } from '@/components/workflow/ConfigPanel'
import { validateConnection } from '@/components/workflow/connectionValidation'
import { ConnectionFeedback, useConnectionFeedback } from '@/components/workflow/ConnectionFeedback'
import { WorkflowToolbar } from '@/components/workflow/WorkflowToolbar'
import { useWorkflowState } from '@/components/workflow/useWorkflowState'
import { DebugPanel } from '@/components/workflow/DebugPanel'
import { WorkflowExecutionProvider, useWorkflowExecutionContext } from '@/components/workflow/WorkflowExecutionProvider'
import { EmptyCanvasWelcome } from '@/components/workflow/EmptyCanvasWelcome'
import { ResponsiveLayout } from '@/components/workflow/ResponsiveLayout'
import { AdvancedCanvasControls } from '@/components/workflow/AdvancedCanvasControls'
import { KeyboardShortcuts } from '@/components/workflow/KeyboardShortcuts'
import { HelpSystem } from '@/components/workflow/HelpSystem'

import '@xyflow/react/dist/style.css'

// Start with empty canvas for better onboarding experience
const initialNodes: Node[] = []
const initialEdges: Edge[] = []

export default function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const { feedback, showFeedback, clearFeedback } = useConnectionFeedback()
  const { 
    workflowState, 
    updateWorkflowState, 
    handleSave, 
    handleToggleStatus 
  } = useWorkflowState({
    name: 'Untitled Workflow'
  })
  
  const {
    executionRuns,
    currentRun,
    executeWorkflow,
    clearLogs,
    isExecuting
  } = useWorkflowExecutionContext()

  const [debugPanelVisible, setDebugPanelVisible] = useState(false)
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)

  // Create serializable wrapper functions for template system
  const handleNodesChange = useCallback((newNodes: Node[]) => {
    setNodes(newNodes)
  }, [])

  const handleEdgesChange = useCallback((newEdges: Edge[]) => {
    setEdges(newEdges)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot))
      // Reset validation when nodes change
      updateWorkflowState({ isValid: false, validationErrors: [] })
    },
    [updateWorkflowState],
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot))
      // Reset validation when edges change
      updateWorkflowState({ isValid: false, validationErrors: [] })
    },
    [updateWorkflowState],
  )

  const onConnect = useCallback(
    (params: Connection) => {
      // Validate the connection before adding it
      const validation = validateConnection(params, nodes, edges)
      
      if (validation.isValid) {
        setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot))
        showFeedback('Connection created successfully!', 'success')
      } else {
        // Show error feedback with specific reason
        showFeedback(validation.reason || 'Invalid connection', 'error')
      }
    },
    [nodes, edges, showFeedback],
  )

  // Provide real-time validation feedback during connection attempts
  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      // Handle both Connection and Edge types
      const connectionParams: Connection = {
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle || null,
        targetHandle: connection.targetHandle || null
      }
      
      const validation = validateConnection(connectionParams, nodes, edges)
      return validation.isValid
    },
    [nodes, edges],
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
            status: 'idle'
          },
        }

        setNodes((nds) => nds.concat(newNode))
        // Reset validation when new node is added
        updateWorkflowState({ isValid: false, validationErrors: [] })
      } catch (error) {
        console.error('Error parsing dropped node data:', error)
      }
    },
    [reactFlowInstance, updateWorkflowState],
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
      <WorkflowExecutionProvider>
        <ResponsiveLayout
          toolbar={
            <WorkflowToolbar
              workflowState={{
                ...workflowState,
                status: isExecuting ? 'testing' : workflowState.status
              }}
              onWorkflowStateChange={updateWorkflowState}
              onRunTest={executeWorkflow}
              onSave={handleSave}
              onToggleStatus={handleToggleStatus}
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
            />
          }
          sidebar={<NodeLibrary />}
          debugPanel={
            <DebugPanel
              isVisible={debugPanelVisible}
              onToggle={() => setDebugPanelVisible(!debugPanelVisible)}
              executionRuns={executionRuns}
              currentRun={currentRun || undefined}
              onClearLogs={clearLogs}
            />
          }
        >
          {/* Header with user info and logout */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-4">
            <span className="text-white text-sm">Welcome, {user.email}!</span>
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors text-sm"
            >
              Logout
            </button>
          </div>

          {/* React Flow Canvas */}
          <div 
            ref={reactFlowWrapper}
            className="w-full h-full relative"
          >
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
              <AdvancedCanvasControls 
                nodes={nodes}
                showMinimap={true}
              />
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
            onSave={handleSave}
            onRunTest={executeWorkflow}
          />

          {/* Help System */}
          <HelpSystem />

          {/* Connection Feedback Toast */}
          {feedback && (
            <ConnectionFeedback
              key={feedback.id}
              message={feedback.message}
              type={feedback.type}
              onClose={clearFeedback}
            />
          )}
        </ResponsiveLayout>
      </WorkflowExecutionProvider>
    </ReactFlowProvider>
  )
}