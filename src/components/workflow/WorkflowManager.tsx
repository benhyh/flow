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
  Trash2, 
  Copy, 
  Download, 
  Upload,
  RefreshCw,
  Cloud,
  CloudOff,
  AlertCircle,
  CheckCircle

} from 'lucide-react'
import { type Node, type Edge } from '@xyflow/react'
import WorkflowDatabaseClient from '@/lib/database-client'
import type { Workflow } from '@/types/database'
import { validateWorkflow, type ValidationResult } from './utils/workflowValidation'
import { exportWorkflow, downloadWorkflowFile, handleFileImport, type WorkflowExportData } from './utils/workflowImportExport'
import { type WorkflowState } from './toolbar/WorkflowToolbar'
import { toast } from 'sonner'

interface WorkflowManagerProps {
  currentNodes: Node[]
  currentEdges: Edge[]
  currentWorkflowState: WorkflowState
  onLoadWorkflow: (nodes: Node[], edges: Edge[], state: WorkflowState) => void
  onCreateNew: () => void
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideButton?: boolean
}

export function WorkflowManager({
  currentNodes: _currentNodes,
  currentEdges: _currentEdges,
  currentWorkflowState: _currentWorkflowState,
  onLoadWorkflow,
  onCreateNew,
  className = '',
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  hideButton = false
}: WorkflowManagerProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [validationResults, setValidationResults] = useState<Map<string, ValidationResult>>(new Map())
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Use external control if provided, otherwise use internal state
  const isOpen = externalOpen !== undefined ? externalOpen : internalIsOpen
  const setIsOpen = externalOnOpenChange || setInternalIsOpen

  // Debug logging for modal state
  React.useEffect(() => {
    console.log('🔧 [WORKFLOW MANAGER] Modal state changed:', {
      externalOpen,
      internalIsOpen,
      isOpen,
      hasExternalControl: externalOpen !== undefined
    })
  }, [externalOpen, internalIsOpen, isOpen])

  // Load workflows from Supabase
  const loadWorkflows = useCallback(async () => {
    setIsLoading(true)
    
    try {
      console.log('🔄 [WORKFLOW MANAGER] Loading workflows from database...')
      
      // Get workflows using the new database client
      const { data: workflowsData, error } = await WorkflowDatabaseClient.getWorkflows()
      
      if (error) {
        console.error('❌ [WORKFLOW MANAGER] Failed to load workflows:', error)
        toast.error('Failed to load workflows', {
          description: `Database error: ${error}`
        })
        setWorkflows([])
        return
      }

      console.log('✅ [WORKFLOW MANAGER] Loaded workflows:', {
        count: workflowsData?.length || 0,
        workflows: workflowsData?.map(w => ({
          id: w.id,
          name: w.name,
          isActive: w.is_active,
          createdAt: w.created_at
        }))
      })

      setWorkflows(workflowsData || [])
      
      // Validate each workflow
      const validationMap = new Map<string, ValidationResult>()
      for (const workflow of workflowsData || []) {
        try {
          // Load nodes and edges for validation
          const { data: nodes } = await WorkflowDatabaseClient.getWorkflowNodes(workflow.id)
          const { data: edges } = await WorkflowDatabaseClient.getWorkflowConnections(workflow.id)
          
          if (nodes && edges) {
            // Convert database nodes to React Flow format for validation
            const reactFlowNodes = nodes.map(node => ({
              id: node.id,
              type: node.node_type,
              position: { x: node.position_x, y: node.position_y },
              data: {
                label: node.name,
                nodeType: node.node_type,
                config: (node as any).config || {}
              }
            }))

            const reactFlowEdges = edges.map(edge => ({
              id: edge.id,
              source: edge.source_node_id,
              target: edge.target_node_id,
              type: 'default'
            }))

            const validation = validateWorkflow(reactFlowNodes, reactFlowEdges)
            validationMap.set(workflow.id, validation)
          }
        } catch (validationError) {
          console.warn(`⚠️ [WORKFLOW MANAGER] Failed to validate workflow ${workflow.id}:`, validationError)
          const errorResult: ValidationResult = {
            isValid: false,
            errors: [{
              id: 'validation-error',
              type: 'error',
              category: 'structure',
              message: 'Unable to validate workflow',
              severity: 'high'
            }],
            warnings: [],
            info: [],
            score: 0
          }
          validationMap.set(workflow.id, errorResult)
        }
      }
      
      setValidationResults(validationMap)
      
    } catch (error) {
      console.error('❌ [WORKFLOW MANAGER] Unexpected error loading workflows:', error)
      toast.error('Failed to load workflows', {
        description: 'An unexpected error occurred while loading workflows.'
      })
      setWorkflows([])
    } finally {
      setIsLoading(false)
    }
  }, [])

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
    try {
      console.log('🔄 [WORKFLOW MANAGER] Loading workflow:', {
        workflowId: workflow.id,
        workflowName: workflow.name
      })

      // Load nodes and edges from database
      const [nodesResult, edgesResult] = await Promise.all([
        WorkflowDatabaseClient.getWorkflowNodes(workflow.id),
        WorkflowDatabaseClient.getWorkflowConnections(workflow.id)
      ])

      if (nodesResult.error) {
        console.error('❌ [WORKFLOW MANAGER] Failed to load nodes:', nodesResult.error)
        toast.error('Failed to load workflow nodes', {
          description: `Error: ${nodesResult.error}`
        })
        return
      }

      if (edgesResult.error) {
        console.error('❌ [WORKFLOW MANAGER] Failed to load edges:', edgesResult.error)
        toast.error('Failed to load workflow connections', {
          description: `Error: ${edgesResult.error}`
        })
        return
      }

      const nodes = nodesResult.data || []
      const edges = edgesResult.data || []

      console.log('✅ [WORKFLOW MANAGER] Loaded workflow data:', {
        workflowId: workflow.id,
        nodesCount: nodes.length,
        edgesCount: edges.length
      })

      // Convert database nodes to React Flow nodes
      const reactFlowNodes = nodes.map(node => {
        // Convert database node to React Flow node format
        const nodeTypeMapping: Record<string, string> = {
          'trigger': 'email-trigger', // Map generic trigger to email-trigger for React Flow
          'action': 'trello-action',  // Map generic action to trello-action for React Flow
          'logic': 'logic-node',
          'ai': 'ai-node'
        }

        return {
          id: node.id,
          type: nodeTypeMapping[node.node_type] || node.node_type,
          position: { x: node.position_x, y: node.position_y },
          data: {
            label: node.name,
            nodeType: node.node_type,
            config: (node as any).config || {}
          }
        }
      })

      // Convert database edges to React Flow edges
      const reactFlowEdges = edges.map(edge => ({
        id: edge.id,
        source: edge.source_node_id,
        target: edge.target_node_id,
        type: (edge as any).connection_type || 'default'
      }))

      const workflowState: WorkflowState = {
        id: workflow.id,
        name: workflow.name,
        status: workflow.is_active ? 'active' : 'draft',
        isValid: true,
        validationErrors: []
      }
      
      onLoadWorkflow(reactFlowNodes, reactFlowEdges, workflowState)
      setIsOpen(false)

      toast.success('Workflow loaded successfully!', {
        description: `Loaded "${workflow.name}" with ${nodes.length} nodes and ${edges.length} connections`
      })

    } catch (error) {
      console.error('❌ [WORKFLOW MANAGER] Failed to load workflow:', error)
      toast.error('Failed to load workflow', {
        description: 'An unexpected error occurred while loading the workflow'
      })
    }
  }, [onLoadWorkflow, setIsOpen])

  // Handle delete workflow
  const handleDeleteWorkflow = useCallback(async (workflowId: string) => {
    try {
      console.log('🗑️ [WORKFLOW MANAGER] Deleting workflow:', { workflowId })

      const { error } = await WorkflowDatabaseClient.deleteWorkflow(workflowId)
      
      if (error) {
        console.error('❌ [WORKFLOW MANAGER] Failed to delete workflow:', error)
        toast.error('Failed to delete workflow', {
          description: `Database error: ${error}`,
          duration: 8000
        })
        return
      }

      console.log('✅ [WORKFLOW MANAGER] Workflow deleted successfully:', { workflowId })
      await loadWorkflows()
      toast.success('Workflow deleted successfully!')
    } catch (error) {
      console.error('❌ [WORKFLOW MANAGER] Unexpected error deleting workflow:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete workflow'
      toast.error('Failed to delete workflow', {
        description: errorMessage,
        duration: 8000
      })
    }
  }, [loadWorkflows])

  // Handle duplicate workflow
  const handleDuplicateWorkflow = useCallback(async (workflow: Workflow) => {
    try {
      console.log('📋 [WORKFLOW MANAGER] Duplicating workflow:', {
        originalId: workflow.id,
        originalName: workflow.name
      })

      // Create a new workflow with a modified name
      const duplicateName = `${workflow.name} (Copy)`
      const { data: duplicate, error } = await WorkflowDatabaseClient.createWorkflow({
        name: duplicateName,
        description: workflow.description || ''
      })

      if (error) {
        console.error('❌ [WORKFLOW MANAGER] Failed to create duplicate workflow:', error)
        toast.error('Failed to duplicate workflow', {
          description: `Database error: ${error}`
        })
        return
      }

      if (!duplicate) {
        throw new Error('No workflow data returned from create operation')
      }

      console.log('✅ [WORKFLOW MANAGER] Duplicate workflow created:', {
        duplicateId: duplicate.id,
        duplicateName: duplicate.name
      })

      // Load nodes and edges from original workflow
      const [nodesResult, edgesResult] = await Promise.all([
        WorkflowDatabaseClient.getWorkflowNodes(workflow.id),
        WorkflowDatabaseClient.getWorkflowConnections(workflow.id)
      ])

      if (nodesResult.data && nodesResult.data.length > 0) {
        // Create a mapping of old node IDs to new node IDs
        const nodeIdMapping = new Map<string, string>()
        
        // Create duplicate nodes
        for (const originalNode of nodesResult.data) {
          const { data: duplicateNode, error: nodeError } = await WorkflowDatabaseClient.createNode({
            workflow_id: duplicate.id,
            node_type: originalNode.node_type,
            name: originalNode.name,
            position_x: originalNode.position_x,
            position_y: originalNode.position_y
          })

          if (nodeError) {
            console.error('❌ [WORKFLOW MANAGER] Failed to duplicate node:', nodeError)
            continue
          }

          if (duplicateNode) {
            nodeIdMapping.set(originalNode.id, duplicateNode.id)
          }
        }

        // Create duplicate connections using the new node IDs
        if (edgesResult.data && edgesResult.data.length > 0) {
          for (const originalEdge of edgesResult.data) {
            const newSourceId = nodeIdMapping.get(originalEdge.source_node_id)
            const newTargetId = nodeIdMapping.get(originalEdge.target_node_id)

            if (newSourceId && newTargetId) {
              await WorkflowDatabaseClient.createConnection({
                workflow_id: duplicate.id,
                source_node_id: newSourceId,
                target_node_id: newTargetId
              })
            }
          }
        }
      }

      await loadWorkflows()
      toast.success('Workflow duplicated successfully!', {
        description: `Created "${duplicate.name}"`
      })

    } catch (error) {
      console.error('❌ [WORKFLOW MANAGER] Unexpected error duplicating workflow:', error)
      toast.error('Failed to duplicate workflow', {
        description: 'An unexpected error occurred while duplicating the workflow'
      })
    }
  }, [loadWorkflows])

  // Handle export workflow
  const handleExportWorkflow = useCallback(async (workflow: Workflow) => {
    try {
      console.log('📤 [WORKFLOW MANAGER] Exporting workflow:', {
        workflowId: workflow.id,
        workflowName: workflow.name
      })

      // Load nodes and edges from database
      const [nodesResult, edgesResult] = await Promise.all([
        WorkflowDatabaseClient.getWorkflowNodes(workflow.id),
        WorkflowDatabaseClient.getWorkflowConnections(workflow.id)
      ])

      if (nodesResult.error || edgesResult.error) {
        console.error('❌ [WORKFLOW MANAGER] Failed to load workflow data for export:', {
          nodesError: nodesResult.error,
          edgesError: edgesResult.error
        })
        toast.error('Failed to load workflow data for export')
        return
      }

      const nodes = nodesResult.data || []
      const edges = edgesResult.data || []

      // Convert database nodes to React Flow format
      const reactFlowNodes = nodes.map(node => ({
        id: node.id,
        type: node.node_type,
        position: { x: node.position_x, y: node.position_y },
        data: {
          label: node.name,
          nodeType: node.node_type,
          config: (node as any).config || {}
        }
      }))

      // Convert database edges to React Flow format
      const reactFlowEdges = edges.map(edge => ({
        id: edge.id,
        source: edge.source_node_id,
        target: edge.target_node_id,
        type: 'default'
      }))

      const workflowState: WorkflowState = {
        id: workflow.id,
        name: workflow.name,
        status: workflow.is_active ? 'active' : 'draft',
        isValid: true,
        validationErrors: []
      }
      
      const exportData = exportWorkflow(reactFlowNodes, reactFlowEdges, workflowState)
      downloadWorkflowFile(exportData)
      toast.success('Workflow exported successfully!')
    } catch (error) {
      console.error('❌ [WORKFLOW MANAGER] Export error:', error)
      toast.error('Failed to export workflow')
    }
  }, [])

  // Handle import workflow
  const handleImportWorkflow = useCallback((file: File) => {
    handleFileImport(
      file,
      (data: WorkflowExportData) => {
        // Load the imported workflow
        const importedState: WorkflowState = {
          ...data.workflow.state,
          id: '', // Let Supabase generate UUID when saving
          name: data.metadata.name
        }
        
        onLoadWorkflow(data.workflow.nodes, data.workflow.edges, importedState)
        setIsOpen(false)
        toast.success('Workflow imported successfully!', {
          description: `Imported "${data.metadata.name}"`
        })
      },
      (error: string) => {
        toast.error('Failed to import workflow', {
          description: error
        })
      }
    )
  }, [onLoadWorkflow, setIsOpen])

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    try {
      await loadWorkflows()
      toast.success('Workflows refreshed successfully!')
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
              Manage Workflows
            </Button>
          </DialogTrigger>
        )}
        <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Workflow Manager</DialogTitle>
              <DialogDescription>
                Manage your workflows stored in Supabase
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Search and Actions */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search workflows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button onClick={onCreateNew} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Workflow
                </Button>
              </div>

              {/* Workflows List */}
              <ScrollArea className="h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                    <span className="ml-2">Loading workflows...</span>
                  </div>
                ) : filteredWorkflows.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No workflows match your search.' : 'No workflows found.'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredWorkflows.map((workflow) => {
                      const validation = validationResults.get(workflow.id)
                      const isValid = validation?.isValid ?? true
                      
                      return (
                        <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold truncate">{workflow.name}</h3>
                                  {workflow.is_active && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Active
                                    </span>
                                  )}
                                  {!isValid && (
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                  )}
                                </div>
                                {workflow.description && (
                                  <p className="text-sm text-muted-foreground mt-1 truncate">
                                    {workflow.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span>Updated {new Date(workflow.last_modified_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleLoadWorkflow(workflow)}
                                  disabled={!isValid}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDuplicateWorkflow(workflow)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleExportWorkflow(workflow)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteWorkflow(workflow.id)}
                                  className="text-red-600 hover:text-red-700"
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

              {/* Import Section */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Import Workflow</h3>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleImportWorkflow(file)
                      }
                    }}
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  )
}