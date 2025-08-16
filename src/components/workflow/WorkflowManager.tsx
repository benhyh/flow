'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
// import { Separator } from '@/components/ui/separator' // Unused
import { 
  Search, 
  Plus, 
  FileText, 
  Clock, 
  Trash2, 
  Copy, 
  Download, 
  Upload,
  History,
  AlertCircle,
  CheckCircle,
  Info,
  BarChart3
} from 'lucide-react'
import { type Node, type Edge } from '@xyflow/react'
import { 
  getStoredWorkflows, 
  deleteWorkflow, 
  duplicateWorkflow, 
  getRecentWorkflows,
  searchWorkflows,
  getWorkflowStats,
  getWorkflowVersions,
  restoreWorkflowVersion,
  type StoredWorkflow,
  type WorkflowVersion
} from '@/lib/workflow-storage'
import { validateWorkflow, getValidationSummary, type ValidationResult } from './utils/workflowValidation'
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
}

export function WorkflowManager({
  currentNodes: _currentNodes,
  currentEdges: _currentEdges,
  currentWorkflowState: _currentWorkflowState,
  onLoadWorkflow,
  onCreateNew,
  className = ''
}: WorkflowManagerProps) {
  const [workflows, setWorkflows] = useState<StoredWorkflow[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWorkflow, setSelectedWorkflow] = useState<StoredWorkflow | null>(null)
  const [workflowVersions, setWorkflowVersions] = useState<WorkflowVersion[]>([])
  const [validationResults, setValidationResults] = useState<Map<string, ValidationResult>>(new Map())
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('workflows')

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

  // Get recent workflows
  const recentWorkflowIds = getRecentWorkflows()
  const recentWorkflows = workflows.filter(w => recentWorkflowIds.includes(w.id))

  // Handle workflow selection
  const handleSelectWorkflow = useCallback((workflow: StoredWorkflow) => {
    setSelectedWorkflow(workflow)
    const versions = getWorkflowVersions(workflow.id)
    setWorkflowVersions(versions)
  }, [])

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
      if (selectedWorkflow?.id === workflowId) {
        setSelectedWorkflow(null)
        setWorkflowVersions([])
      }
      toast.success('Workflow deleted successfully!')
    } else {
      toast.error('Failed to delete workflow')
    }
  }, [loadWorkflows, selectedWorkflow])

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
          name: data.metadata.name,
          status: 'draft'
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

  // Handle restore version
  const handleRestoreVersion = useCallback((workflowId: string, version: number) => {
    const restored = restoreWorkflowVersion(workflowId, version)
    if (restored) {
      loadWorkflows()
      toast.success('Version restored successfully!', {
        description: `Restored to version ${version}`
      })
    } else {
      toast.error('Failed to restore version')
    }
  }, [loadWorkflows])

  // Get workflow stats
  const stats = getWorkflowStats()

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'paused': return 'secondary'
      case 'testing': return 'outline'
      default: return 'outline'
    }
  }

  // Get validation badge
  const getValidationBadge = (workflowId: string) => {
    const validation = validationResults.get(workflowId)
    if (!validation) return null

    if (validation.errors.length > 0) {
      return <Badge variant="destructive" className="text-xs"><AlertCircle size={12} className="mr-1" />{validation.errors.length}</Badge>
    }
    if (validation.warnings.length > 0) {
      return <Badge variant="secondary" className="text-xs"><Info size={12} className="mr-1" />{validation.warnings.length}</Badge>
    }
    return <Badge variant="default" className="text-xs"><CheckCircle size={12} className="mr-1" />Valid</Badge>
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <FileText size={16} className="mr-2" />
          Manage Workflows
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Workflow Manager</DialogTitle>
          <DialogDescription>
            Manage your saved workflows, view history, and import/export configurations
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="flex-1 overflow-hidden">
            <div className="flex flex-col h-full">
              {/* Search and Actions */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search workflows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={onCreateNew} variant="outline">
                  <Plus size={16} className="mr-2" />
                  New
                </Button>
                <Button
                  variant="outline"
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
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedWorkflow?.id === workflow.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleSelectWorkflow(workflow)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{workflow.name}</CardTitle>
                            <CardDescription className="text-sm">
                              {workflow.description || 'No description'}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            {getValidationBadge(workflow.id)}
                            <Badge variant={getStatusVariant(workflow.state.status)}>
                              {workflow.state.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span>{workflow.nodes.length} nodes</span>
                            <span>{workflow.edges.length} connections</span>
                            <span>v{workflow.version}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={12} />
                            <span>{formatDate(workflow.updatedAt)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            variant="outline"
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
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'No workflows found matching your search' : 'No workflows saved yet'}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="recent" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="grid gap-3">
                {recentWorkflows.map((workflow) => (
                  <Card key={workflow.id} className="cursor-pointer hover:bg-muted/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{workflow.name}</CardTitle>
                        <Badge variant={getStatusVariant(workflow.state.status)}>
                          {workflow.state.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{workflow.nodes.length} nodes, {workflow.edges.length} connections</span>
                        <span>{formatDate(workflow.updatedAt)}</span>
                      </div>
                      <Button 
                        size="sm" 
                        className="mt-2"
                        onClick={() => handleLoadWorkflow(workflow)}
                      >
                        Load Workflow
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {recentWorkflows.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent workflows
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="versions" className="flex-1 overflow-hidden">
            {selectedWorkflow ? (
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">{selectedWorkflow.name}</h3>
                  <p className="text-sm text-muted-foreground">Version history</p>
                </div>
                <ScrollArea className="flex-1">
                  <div className="space-y-3">
                    {workflowVersions.map((version) => (
                      <Card key={version.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">Version {version.version}</CardTitle>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <History size={12} />
                              {formatDate(version.createdAt)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground mb-2">
                            {version.description || 'No description'}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {version.nodes.length} nodes, {version.edges.length} connections
                            </span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRestoreVersion(selectedWorkflow.id, version.version)}
                            >
                              Restore
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {workflowVersions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No version history available
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a workflow to view its version history
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="flex-1 overflow-hidden">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 size={20} />
                    Workflow Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stats.totalWorkflows}</div>
                      <div className="text-sm text-muted-foreground">Total Workflows</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stats.totalNodes}</div>
                      <div className="text-sm text-muted-foreground">Total Nodes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stats.totalEdges}</div>
                      <div className="text-sm text-muted-foreground">Total Connections</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {Math.round(stats.storageUsed / 1024)}KB
                      </div>
                      <div className="text-sm text-muted-foreground">Storage Used</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Validation Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Validation Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {workflows.map((workflow) => {
                      const validation = validationResults.get(workflow.id)
                      if (!validation) return null

                      return (
                        <div key={workflow.id} className="flex items-center justify-between p-2 rounded border">
                          <span className="font-medium">{workflow.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {getValidationSummary(validation)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}