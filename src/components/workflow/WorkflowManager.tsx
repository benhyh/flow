'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

import { ScrollArea } from '@/components/ui/scroll-area'
// import { Separator } from '@/components/ui/separator' // Unused
import { 
  Search, 
  Plus, 
  FileText, 
  Trash2, 
  Copy, 
  Download, 
  Upload,

} from 'lucide-react'
import { type Node, type Edge } from '@xyflow/react'
import { 
  getStoredWorkflows, 
  deleteWorkflow, 
  duplicateWorkflow, 
  searchWorkflows,
  type StoredWorkflow
} from '@/lib/workflow-storage'
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
  const [workflows, setWorkflows] = useState<StoredWorkflow[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [validationResults, setValidationResults] = useState<Map<string, ValidationResult>>(new Map())
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  
  // Use external control if provided, otherwise use internal state
  const isOpen = externalOpen !== undefined ? externalOpen : internalIsOpen
  const setIsOpen = externalOnOpenChange || setInternalIsOpen

  // Load workflows from storage
  const loadWorkflows = useCallback(() => {
    const storedWorkflows = getStoredWorkflows()
    setWorkflows(storedWorkflows)
    
    // Validate all workflows
    const results = new Map<string, ValidationResult>()
    storedWorkflows.forEach(workflow => {
      const validation = validateWorkflow(workflow.nodes, workflow.edges)
      results.set(workflow.id, validation)
    })
    setValidationResults(results)
  }, [])

  // Load workflows on mount and when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadWorkflows()
    }
  }, [isOpen, loadWorkflows])

  // Filter workflows based on search
  const filteredWorkflows = searchQuery 
    ? searchWorkflows(searchQuery)
    : workflows



  // Handle load workflow
  const handleLoadWorkflow = useCallback((workflow: StoredWorkflow) => {
    onLoadWorkflow(workflow.nodes, workflow.edges, workflow.state)
    setIsOpen(false)
    toast.success('Workflow loaded successfully!', {
      description: `Loaded "${workflow.name}"`
    })
  }, [onLoadWorkflow])

  // Handle delete workflow
  const handleDeleteWorkflow = useCallback((workflowId: string) => {
    if (deleteWorkflow(workflowId)) {
      loadWorkflows()
      toast.success('Workflow deleted successfully!')
    } else {
      toast.error('Failed to delete workflow')
    }
  }, [loadWorkflows])

  // Handle duplicate workflow
  const handleDuplicateWorkflow = useCallback((workflow: StoredWorkflow) => {
    const duplicate = duplicateWorkflow(workflow.id, `${workflow.name} (Copy)`)
    if (duplicate) {
      loadWorkflows()
      toast.success('Workflow duplicated successfully!', {
        description: `Created "${duplicate.name}"`
      })
    } else {
      toast.error('Failed to duplicate workflow')
    }
  }, [loadWorkflows])

  // Handle export workflow
  const handleExportWorkflow = useCallback((workflow: StoredWorkflow) => {
    try {
      const exportData = exportWorkflow(workflow.nodes, workflow.edges, workflow.state)
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
          id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
  }, [onLoadWorkflow])







  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!hideButton && (
        <DialogTrigger asChild>
          <Button variant="outline" className={className}>
            <FileText size={16} className="mr-2" />
            Manage Workflows
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden bg-white/8 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Workflow Manager</DialogTitle>
          <DialogDescription className="text-white/60">
            Manage your saved workflows, view history, and import/export configurations
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Search and Actions */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
                <Input
                  placeholder="Search workflows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 text-white placeholder:text-white/60"
                />
              </div>
              <Button onClick={onCreateNew} variant="outline" className="bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Plus size={16} className="mr-2" />
                New
              </Button>
              <Button
                variant="outline"
                className="bg-white/10 text-white hover:bg-white/20 hover:text-white"
                onClick={() => document.getElementById('import-file')?.click()}
              >
                <Upload size={16} className="mr-2" />
                Import
              </Button>
              <input
                id="import-file"
                type="file"
                accept=".json,.flow.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImportWorkflow(file)
                }}
              />
            </div>

            {/* Workflows List */}
            <ScrollArea className="flex-1">
              <div className="grid gap-3">
                {filteredWorkflows.map((workflow) => (
                  <Card 
                    key={workflow.id} 
                    className="cursor-pointer transition-colors hover:bg-white/10 bg-white/5"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base text-white">{workflow.name}</CardTitle>
                          <CardDescription className="text-sm text-white/60">
                            {workflow.description || 'No description'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-sm text-white/60">
                        <div className="flex items-center gap-4">
                          <span>{workflow.nodes.length} nodes</span>
                          <span>{workflow.edges.length} connections</span>
                          <span>v{workflow.version}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="bg-white/10 text-white hover:bg-white/20 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLoadWorkflow(workflow)
                          }}
                        >
                          Load
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="bg-white/10 text-white hover:bg-white/20 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDuplicateWorkflow(workflow)
                          }}
                        >
                          <Copy size={12} className="mr-1" />
                          Copy
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="bg-white/10 text-white hover:bg-white/20 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleExportWorkflow(workflow)
                          }}
                        >
                          <Download size={12} className="mr-1" />
                          Export
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteWorkflow(workflow.id)
                          }}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredWorkflows.length === 0 && (
                  <div className="text-center py-8 text-white/60">
                    {searchQuery ? 'No workflows found matching your search' : 'No workflows saved yet'}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}