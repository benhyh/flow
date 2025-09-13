'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Search, 
  Plus, 
  FileText, 
  RefreshCw,
  Trash2,
  AlertTriangle

} from 'lucide-react'
import { type Node, type Edge } from '@xyflow/react'
import WorkflowDatabaseClient from '@/lib/database-client'
import type { Workflow } from '@/types/database'
import { type WorkflowState } from './toolbar/WorkflowToolbar'
import { toast } from 'sonner'
import { useAuth } from '@/providers/AuthProvider'

interface WorkflowManagerProps {
  onLoadWorkflow: (nodes: Node[], edges: Edge[], state: WorkflowState) => void
  onCreateNew: () => void
  onWorkflowDeleted?: (deletedWorkflowId: string) => void
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideButton?: boolean
}

export function WorkflowManager({
  onLoadWorkflow,
  onCreateNew,
  onWorkflowDeleted,
  className = '',
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  hideButton = false
}: WorkflowManagerProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null)
  
  // Get current user from auth provider
  const { user } = useAuth()
  
  // Use external control if provided, otherwise use internal state
  const isOpen = externalOpen !== undefined ? externalOpen : internalIsOpen
  const setIsOpen = externalOnOpenChange || setInternalIsOpen

  // Load workflows from Supabase
  const loadWorkflows = useCallback(async () => {
    if (!user) {
      console.warn('📋 [WORKFLOW MANAGER] User not authenticated, skipping workflow load')
      return
    }

    setIsLoading(true)
    
    try {
      console.log('📋 [WORKFLOW MANAGER] Loading workflows for user:', user.id)
      
      // Get workflows from database
      const { data: workflows, error } = await WorkflowDatabaseClient.getUserWorkflows(user.id)
      
      if (error) {
        throw new Error(error)
      }

      console.log('✅ [WORKFLOW MANAGER] Loaded workflows:', {
        count: workflows?.length || 0,
        workflows: workflows?.map(w => ({ id: w.id, name: w.name, is_active: w.is_active }))
      })

      setWorkflows(workflows || [])
    } catch (error) {
      console.error('❌ [WORKFLOW MANAGER] Error loading workflows:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error('Failed to load workflows', {
        description: errorMessage
      })
      setWorkflows([])
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Load workflows on mount and when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadWorkflows()
    }
  }, [isOpen, loadWorkflows])

  // Filter workflows based on search (use local filtering for performance)
  const filteredWorkflows = searchQuery 
    ? workflows.filter(workflow => 
        workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : workflows

  // Handle load workflow
  const handleLoadWorkflow = useCallback(async (workflow: Workflow) => {
    if (!user) {
      toast.error('User not authenticated')
      return
    }

    try {
      setIsLoading(true)
      
      console.log('📥 [WORKFLOW MANAGER] Loading workflow:', {
        workflowId: workflow.id,
        workflowName: workflow.name
      })

      // Get workflow details
      const { data: workflowData, error: workflowError } = await WorkflowDatabaseClient.getWorkflow(workflow.id, user.id)
      if (workflowError) {
        throw new Error(workflowError)
      }

      // Get workflow nodes
      const { data: nodes, error: nodesError } = await WorkflowDatabaseClient.getWorkflowNodes(workflow.id)
      if (nodesError) {
        throw new Error(nodesError)
      }

      console.log('✅ [WORKFLOW MANAGER] Loaded workflow data:', {
        workflowId: workflow.id,
        nodesCount: nodes?.length || 0,
        nodes: nodes?.map(n => ({ id: n.id, name: n.name, type: n.node_type, position: { x: n.position_x, y: n.position_y } }))
      })

      // Convert database nodes to React Flow nodes
      const reactFlowNodes = nodes?.map(dbNode => {
        // Map database node types to React Flow base node types
        const nodeTypeMapping: Record<string, string> = {
          'trigger': 'trigger',
          'trello-action': 'action',
          'asana-action': 'action', 
          'logic': 'logic',
          'ai-tagging': 'ai',
          'ai-classification': 'ai'
        }

        // Get the base React Flow node type
        const reactFlowNodeType = nodeTypeMapping[dbNode.node_type] || 'trigger'
        
        // Map database node types to their subtypes for data.nodeType
        const nodeSubtypeMapping: Record<string, string> = {
          'trigger': 'email-trigger', // Default to email-trigger for trigger nodes
          'trello-action': 'trello-action',
          'asana-action': 'asana-action',
          'logic': 'condition-logic',
          'ai-tagging': 'ai-tagging',
          'ai-classification': 'ai-classification'
        }

        const nodeSubtype = nodeSubtypeMapping[dbNode.node_type] || 'email-trigger'

        return {
          id: dbNode.id,
          type: reactFlowNodeType, // Use base type for React Flow
          position: { x: dbNode.position_x, y: dbNode.position_y },
          data: {
            label: dbNode.name,
            nodeType: nodeSubtype, // Use subtype for custom node rendering
            icon: '', // Will be set based on node type
            color: '', // Will be set based on node type
            status: 'idle'
          }
        }
      }) || []

      // Create workflow state
      const workflowState: WorkflowState = {
        id: workflow.id,
        name: workflow.name,
        status: workflow.is_active ? 'active' : 'draft',
        isValid: true,
        validationErrors: []
      }
      
      // Restore connections from localStorage (MVP solution)
      let restoredEdges: Edge[] = []
      if (typeof window !== 'undefined') {
        try {
          const savedConnections = localStorage.getItem(`workflow_connections_${workflow.id}`)
          if (savedConnections) {
            const connectionsData = JSON.parse(savedConnections)
            console.log('🔗 [WORKFLOW MANAGER] Restoring connections from localStorage:', {
              connectionsCount: connectionsData.length,
              workflowId: workflow.id
            })
            
            // Convert back to React Flow edges
            restoredEdges = connectionsData.map((conn: any) => ({
              id: conn.id,
              source: conn.source,
              target: conn.target,
              sourceHandle: conn.sourceHandle,
              targetHandle: conn.targetHandle,
              type: conn.type || 'default'
            }))
          }
        } catch (error) {
          console.error('❌ [WORKFLOW MANAGER] Error restoring connections:', error)
        }
      }

      // Load the workflow with restored connections
      onLoadWorkflow(reactFlowNodes, restoredEdges, workflowState)
      setIsOpen(false)
      
      toast.success('Workflow loaded successfully!', {
        description: `Loaded "${workflow.name}" with ${reactFlowNodes.length} nodes and ${restoredEdges.length} connections`
      })
    } catch (error) {
      console.error('❌ [WORKFLOW MANAGER] Error loading workflow:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error('Failed to load workflow', {
        description: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, onLoadWorkflow, setIsOpen])

  // Handle delete workflow confirmation
  const handleDeleteWorkflowClick = useCallback((workflow: Workflow, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent triggering the card click to load workflow
    setWorkflowToDelete(workflow)
    setDeleteConfirmOpen(true)
  }, [])

  // Handle delete workflow with CASCADE
  const handleDeleteWorkflow = useCallback(async () => {
    if (!workflowToDelete || !user) return

    try {
      setIsLoading(true)
      
      console.log('🗑️ [WORKFLOW MANAGER] Deleting workflow with CASCADE:', {
        workflowId: workflowToDelete.id,
        workflowName: workflowToDelete.name
      })

      // Delete workflow from database (should CASCADE to delete nodes and configurations)
      const { error } = await WorkflowDatabaseClient.deleteWorkflow(workflowToDelete.id, user.id)
      if (error) {
        throw new Error(error)
      }

      console.log('✅ [WORKFLOW MANAGER] Workflow deleted successfully:', workflowToDelete.id)
      
      // Notify parent component about the deletion
      onWorkflowDeleted?.(workflowToDelete.id)
      
      // Reload workflows list
      await loadWorkflows()
      toast.success('Workflow deleted successfully!', {
        description: `Deleted "${workflowToDelete.name}" and all its components`
      })
    } catch (error) {
      console.error('❌ [WORKFLOW MANAGER] Error deleting workflow:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete workflow'
      toast.error('Failed to delete workflow', {
        description: errorMessage,
        duration: 8000
      })
    } finally {
      setIsLoading(false)
      setDeleteConfirmOpen(false)
      setWorkflowToDelete(null)
    }
  }, [workflowToDelete, user, loadWorkflows])

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    try {
      await loadWorkflows()
    } catch (error) {
      console.error('Error refreshing workflows:', error)
      toast.error('Failed to refresh workflows')
    }
  }, [loadWorkflows])

  return (
    <div className={className}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {!hideButton && (
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Load Workflow
            </Button>
          </DialogTrigger>
        )}
        <DialogContent className="max-w-2xl max-h-[70vh] bg-[#2D2D2D] border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-white">Select Workflow</DialogTitle>
            <DialogDescription className="text-white/50">
              Choose a workflow to load into the editor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search and Actions */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  placeholder="Search workflows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#1D1D1D] border-gray-600 text-white placeholder:text-white/50"
                />
              </div>
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                size="sm" 
                disabled={isLoading}
                className="border-gray-600 text-white hover:bg-gray-600"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                onClick={() => {
                  onCreateNew()
                  setIsOpen(false)
                }} 
                size="sm"
                className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Workflow
              </Button>
            </div>

            {/* Workflows List */}
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8b5cf6]"></div>
                  <span className="ml-2 text-white">Loading workflows...</span>
                </div>
              ) : filteredWorkflows.length === 0 ? (
                <div className="text-center py-8 text-white/50">
                  {searchQuery ? 'No workflows match your search.' : 'No workflows found.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredWorkflows.map((workflow) => {
                    return (
                      <Card 
                        key={workflow.id} 
                        className="bg-[#1D1D1D] border-gray-600 hover:bg-[#252525] transition-colors cursor-pointer"
                        onClick={() => handleLoadWorkflow(workflow)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold truncate text-white">{workflow.name}</h3>
                                {workflow.is_active && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
                                    Active
                                  </span>
                                )}
                              </div>
                              {workflow.description && (
                                <p className="text-sm text-white/50 mt-1 truncate">
                                  {workflow.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleDeleteWorkflowClick(workflow, e)}
                                disabled={isLoading}
                                className="text-gray-400 hover:text-red-500 hover:bg-transparent"
                                title="Delete workflow"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md bg-[#2D2D2D] border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-white">
              Delete Workflow
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Are you sure you want to delete "{workflowToDelete?.name}"?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isLoading}
              className="border-gray-600 text-white hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteWorkflow}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}