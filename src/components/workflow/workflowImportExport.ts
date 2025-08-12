/**
 * Workflow Import/Export Utilities
 * Handles saving and loading workflow configurations as JSON files
 */

import { type Node, type Edge } from '@xyflow/react'
import { type WorkflowState } from './WorkflowToolbar'

export interface WorkflowExportData {
  version: string
  metadata: {
    name: string
    description?: string
    createdAt: string
    exportedAt: string
    author?: string
  }
  workflow: {
    nodes: Node[]
    edges: Edge[]
    state: Omit<WorkflowState, 'lastSaved' | 'lastRun'>
  }
}

/**
 * Export workflow to JSON format
 */
export function exportWorkflow(
  nodes: Node[],
  edges: Edge[],
  workflowState: WorkflowState,
  description?: string
): WorkflowExportData {
  const exportData: WorkflowExportData = {
    version: '1.0.0',
    metadata: {
      name: workflowState.name || 'Untitled Workflow',
      description: description || `Exported workflow with ${nodes.length} nodes and ${edges.length} connections`,
      createdAt: new Date().toISOString(),
      exportedAt: new Date().toISOString(),
    },
    workflow: {
      nodes: nodes.map(node => ({
        ...node,
        // Clean up any runtime-specific data
        selected: false,
        dragging: false,
      })),
      edges: edges.map(edge => ({
        ...edge,
        // Clean up any runtime-specific data
        selected: false,
      })),
      state: {
        id: workflowState.id,
        name: workflowState.name,
        status: 'draft', // Always export as draft
        isValid: workflowState.isValid,
        validationErrors: workflowState.validationErrors,
      }
    }
  }

  return exportData
}

/**
 * Download workflow as JSON file
 */
export function downloadWorkflowFile(exportData: WorkflowExportData): void {
  const jsonString = JSON.stringify(exportData, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `${sanitizeFilename(exportData.metadata.name)}.flow.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Import workflow from JSON data
 */
export function importWorkflow(jsonData: string): {
  success: boolean
  data?: WorkflowExportData
  error?: string
} {
  try {
    const parsed = JSON.parse(jsonData) as WorkflowExportData
    
    // Validate the imported data structure
    const validation = validateImportData(parsed)
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      }
    }

    return {
      success: true,
      data: parsed
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid JSON format'
    }
  }
}

/**
 * Handle file upload and import
 */
export function handleFileImport(
  file: File,
  onSuccess: (data: WorkflowExportData) => void,
  onError: (error: string) => void
): void {
  if (!file.name.endsWith('.flow.json') && !file.name.endsWith('.json')) {
    onError('Please select a valid .flow.json file')
    return
  }

  const reader = new FileReader()
  
  reader.onload = (event) => {
    const content = event.target?.result as string
    if (!content) {
      onError('Failed to read file content')
      return
    }

    const result = importWorkflow(content)
    if (result.success && result.data) {
      onSuccess(result.data)
    } else {
      onError(result.error || 'Failed to import workflow')
    }
  }

  reader.onerror = () => {
    onError('Failed to read file')
  }

  reader.readAsText(file)
}

/**
 * Validate imported workflow data
 */
function validateImportData(data: unknown): { isValid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Invalid file format' }
  }

  const importData = data as Record<string, unknown>

  if (!importData.version) {
    return { isValid: false, error: 'Missing version information' }
  }

  if (!importData.workflow) {
    return { isValid: false, error: 'Missing workflow data' }
  }

  const workflow = importData.workflow as Record<string, unknown>

  if (!Array.isArray(workflow.nodes)) {
    return { isValid: false, error: 'Invalid nodes data' }
  }

  if (!Array.isArray(workflow.edges)) {
    return { isValid: false, error: 'Invalid edges data' }
  }

  const metadata = importData.metadata as Record<string, unknown>
  if (!metadata || !metadata.name) {
    return { isValid: false, error: 'Missing workflow metadata' }
  }

  // Validate node structure
  for (const node of workflow.nodes) {
    const nodeObj = node as Record<string, unknown>
    if (!nodeObj.id || !nodeObj.type || !nodeObj.position || !nodeObj.data) {
      return { isValid: false, error: 'Invalid node structure detected' }
    }
  }

  // Validate edge structure
  for (const edge of workflow.edges) {
    const edgeObj = edge as Record<string, unknown>
    if (!edgeObj.id || !edgeObj.source || !edgeObj.target) {
      return { isValid: false, error: 'Invalid edge structure detected' }
    }
  }

  return { isValid: true }
}

/**
 * Sanitize filename for download
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase() || 'workflow'
}

/**
 * Generate a sample workflow for testing
 */
export function generateSampleWorkflow(): WorkflowExportData {
  const sampleNodes: Node[] = [
    {
      id: 'trigger-1',
      type: 'trigger',
      position: { x: 100, y: 100 },
      data: {
        label: 'New Email Received',
        nodeType: 'email-trigger',
        icon: '⚡',
        color: '#8b5cf6',
        status: 'idle',
        config: {
          emailFilters: {
            subject: 'Project Update',
            sender: '',
            keywords: ['urgent', 'important']
          }
        }
      }
    },
    {
      id: 'action-1',
      type: 'action',
      position: { x: 400, y: 100 },
      data: {
        label: 'Create Trello Card',
        nodeType: 'trello-action',
        icon: '✅',
        color: '#10b981',
        status: 'idle',
        config: {
          board: 'Project Management',
          list: 'To Do',
          cardTemplate: {
            title: 'New Task from Email',
            description: 'Auto-generated from email'
          }
        }
      }
    }
  ]

  const sampleEdges: Edge[] = [
    {
      id: 'e1-2',
      source: 'trigger-1',
      target: 'action-1',
      type: 'custom'
    }
  ]

  return exportWorkflow(
    sampleNodes,
    sampleEdges,
    {
      name: 'Sample Email to Task Workflow',
      status: 'draft',
      isValid: true,
      validationErrors: []
    },
    'A sample workflow that creates Trello cards from important emails'
  )
}