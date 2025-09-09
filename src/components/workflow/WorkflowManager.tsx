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

  // Load workflows from Supabase
  const loadWorkflows = useCallback(async () => {
    setIsLoading(true)
    
    try {
      // Get workflows directly from Supabase
      // TODO: Update WorkflowManager to work with new database schema
      // For now, disable the workflow listing functionality
      console.warn('WorkflowManager: Listing workflows is temporarily disabled during database migration')
      setWorkflows([])
      setValidationResults(new Map())
    } catch (error) {
      console.error('Supabase error loading workflows:', error)
      toast.error('Failed to load workflows', {
        description: 'Unable to load workflows from Supabase. Please check your connection.'
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
  const handleLoadWorkflow = useCallback((workflow: Workflow) => {
    const workflowState: WorkflowState = {
      id: workflow.id,
      name: workflow.name,
      status: workflow.is_active ? 'active' : 'draft',
      isValid: true,
      validationErrors: []
    }
    
    onLoadWorkflow(workflow.nodes, workflow.edges, workflowState)
    setIsOpen(false)
    toast.success('Workflow loaded successfully!', {
      description: `Loaded "${workflow.name}"`
    })
  }, [onLoadWorkflow, setIsOpen])

  // Handle delete workflow
  const handleDeleteWorkflow = useCallback(async (workflowId: string) => {
    try {
      // TODO: Update to use new database client
      console.warn('WorkflowManager: Delete workflow is temporarily disabled during database migration')
      throw new Error('Delete workflow functionality is temporarily disabled')
      await loadWorkflows()
      toast.success('Workflow deleted successfully!')
    } catch (error) {
      console.error('Supabase error deleting workflow:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete workflow from Supabase'
      toast.error('Failed to delete workflow', {
        description: errorMessage,
        duration: 8000
      })
    }
  }, [loadWorkflows])

  // Handle duplicate workflow
  const handleDuplicateWorkflow = useCallback(async (workflow: Workflow) => {
    try {
      // TODO: Update to use new database client
      console.warn('WorkflowManager: Duplicate workflow is temporarily disabled during database migration')
      throw new Error('Duplicate workflow functionality is temporarily disabled')
      
      await loadWorkflows()
      toast.success('Workflow duplicated successfully!', {
        description: `Created "${duplicate.name}"`
      })
    } catch (error) {
      console.error('Supabase error duplicating workflow:', error)
      toast.error('Failed to duplicate workflow', {
        description: 'Unable to create duplicate in Supabase'
      })
    }
  }, [loadWorkflows])

  // Handle export workflow
  const handleExportWorkflow = useCallback((workflow: Workflow) => {
    try {
      const workflowState: WorkflowState = {
        id: workflow.id,
        name: workflow.name,
        status: workflow.is_active ? 'active' : 'draft',
        isValid: true,
        validationErrors: []
      }
      
      const exportData = exportWorkflow(workflow.nodes, workflow.edges, workflowState)
      downloadWorkflowFile(exportData)
      toast.success('Workflow exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
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
      {!hideButton && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Manage Workflows
            </Button>
          </DialogTrigger>
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
                                  <span>{workflow.node_count || 0} nodes</span>
                                  <span>{workflow.edge_count || 0} edges</span>
                                  <span>Updated {new Date(workflow.updated_at).toLocaleDateString()}</span>
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
      )}
    </div>
  )
}