'use client'

import React, { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Upload, AlertCircle, CheckCircle } from 'lucide-react'
import { type Node, type Edge } from '@xyflow/react'
import { type WorkflowState } from './WorkflowToolbar'
import { 
  exportWorkflow, 
  downloadWorkflowFile, 
  handleFileImport,
  type WorkflowExportData 
} from '../utils/workflowImportExport'
import { toast } from 'sonner'

interface ImportExportButtonsProps {
  nodes: Node[]
  edges: Edge[]
  workflowState: WorkflowState
  onNodesChange: (nodes: Node[]) => void
  onEdgesChange: (edges: Edge[]) => void
  onWorkflowStateChange: (state: Partial<WorkflowState>) => void
  className?: string
}

export function ImportExportButtons({
  nodes,
  edges,
  workflowState,
  onNodesChange,
  onEdgesChange,
  onWorkflowStateChange,
  className = ''
}: ImportExportButtonsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)

  // Handle export workflow
  const handleExport = () => {
    try {
      const exportData = exportWorkflow(nodes, edges, workflowState)
      downloadWorkflowFile(exportData)
      
      toast.success('Workflow exported successfully!', {
        description: `Downloaded ${exportData.metadata.name}.flow.json`,
        icon: <CheckCircle size={16} />
      })
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export workflow', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        icon: <AlertCircle size={16} />
      })
    }
  }

  // Handle import workflow
  const handleImport = () => {
    fileInputRef.current?.click()
  }

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    
    handleFileImport(
      file,
      (data: WorkflowExportData) => {
        // Load the imported workflow
        onNodesChange(data.workflow.nodes)
        onEdgesChange(data.workflow.edges)
        onWorkflowStateChange({
          ...data.workflow.state,
          name: data.metadata.name
        })
        
        toast.success('Workflow imported successfully!', {
          description: `Imported "${data.metadata.name}"`,
          icon: <CheckCircle size={16} />
        })
        setIsImporting(false)
      },
      (error: string) => {
        toast.error('Failed to import workflow', {
          description: error,
          icon: <AlertCircle size={16} />
        })
        setIsImporting(false)
      }
    )

    // Reset file input
    event.target.value = ''
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={nodes.length === 0}
        title="Export workflow as JSON file"
      >
        <Download size={16} className="mr-2" />
        Export
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleImport}
        disabled={isImporting}
        title="Import workflow from JSON file"
      >
        <Upload size={16} className="mr-2" />
        {isImporting ? 'Importing...' : 'Import'}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.flow.json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
