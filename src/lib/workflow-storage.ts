/**
 * Workflow Local Storage Management
 * Handles persistent storage of workflows in browser localStorage
 */

import { type Node, type Edge } from '@xyflow/react'
import { type WorkflowState } from '@/components/workflow/toolbar/WorkflowToolbar'

export interface StoredWorkflow {
  id: string
  name: string
  description?: string
  nodes: Node[]
  edges: Edge[]
  state: WorkflowState
  version: number
}

export interface WorkflowVersion {
  id: string
  workflowId: string
  version: number
  nodes: Node[]
  edges: Edge[]
  state: WorkflowState
  description?: string
}

const STORAGE_KEYS = {
  WORKFLOWS: 'flow_workflows',
  VERSIONS: 'flow_workflow_versions',
  SETTINGS: 'flow_settings',
  RECENT: 'flow_recent_workflows'
} as const

const MAX_VERSIONS_PER_WORKFLOW = 10
const MAX_RECENT_WORKFLOWS = 20

/**
 * Generate unique ID for workflows
 */
function generateId(): string {
  return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get all stored workflows
 */
export function getStoredWorkflows(): StoredWorkflow[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WORKFLOWS)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading workflows from storage:', error)
    return []
  }
}

/**
 * Save workflow to localStorage
 */
export function saveWorkflow(
  nodes: Node[],
  edges: Edge[],
  workflowState: WorkflowState,
  description?: string
): StoredWorkflow {
  try {
    const workflows = getStoredWorkflows()
    
    // Find existing workflow or create new one
    let existingWorkflow = workflows.find(w => w.id === workflowState.id)
    
    if (existingWorkflow) {
      // Create version before updating
      createWorkflowVersion(existingWorkflow)
      
      // Update existing workflow
      existingWorkflow.nodes = nodes
      existingWorkflow.edges = edges
      existingWorkflow.state = { ...workflowState }
      existingWorkflow.version += 1
      if (description) existingWorkflow.description = description
    } else {
      // Create new workflow
      const newWorkflow: StoredWorkflow = {
        id: workflowState.id || generateId(),
        name: workflowState.name || 'Untitled Workflow',
        description,
        nodes,
        edges,
        state: { ...workflowState, id: workflowState.id || generateId() },
        version: 1
      }
      workflows.push(newWorkflow)
      existingWorkflow = newWorkflow
    }
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(workflows))
    
    // Update recent workflows
    updateRecentWorkflows(existingWorkflow.id)
    
    return existingWorkflow
  } catch (error) {
    console.error('Error saving workflow:', error)
    throw new Error('Failed to save workflow')
  }
}

/**
 * Load workflow by ID
 */
export function loadWorkflow(id: string): StoredWorkflow | null {
  try {
    const workflows = getStoredWorkflows()
    const workflow = workflows.find(w => w.id === id)
    
    if (workflow) {
      updateRecentWorkflows(id)
    }
    
    return workflow || null
  } catch (error) {
    console.error('Error loading workflow:', error)
    return null
  }
}

/**
 * Delete workflow
 */
export function deleteWorkflow(id: string): boolean {
  try {
    const workflows = getStoredWorkflows()
    const filteredWorkflows = workflows.filter(w => w.id !== id)
    
    if (filteredWorkflows.length === workflows.length) {
      return false // Workflow not found
    }
    
    localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(filteredWorkflows))
    
    // Also delete versions
    deleteWorkflowVersions(id)
    
    // Remove from recent
    removeFromRecentWorkflows(id)
    
    return true
  } catch (error) {
    console.error('Error deleting workflow:', error)
    return false
  }
}

/**
 * Duplicate workflow
 */
export function duplicateWorkflow(id: string, newName?: string): StoredWorkflow | null {
  try {
    const original = loadWorkflow(id)
    if (!original) return null
    
    const duplicate: StoredWorkflow = {
      ...original,
      id: generateId(),
      name: newName || `${original.name} (Copy)`,
      state: {
        ...original.state,
        id: generateId(),
        name: newName || `${original.name} (Copy)`
      },
      version: 1
    }
    
    const workflows = getStoredWorkflows()
    workflows.push(duplicate)
    localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(workflows))
    
    return duplicate
  } catch (error) {
    console.error('Error duplicating workflow:', error)
    return null
  }
}

/**
 * Create workflow version
 */
function createWorkflowVersion(workflow: StoredWorkflow): void {
  try {
    const versions = getWorkflowVersions(workflow.id)
    
    const newVersion: WorkflowVersion = {
      id: `${workflow.id}_v${workflow.version}`,
      workflowId: workflow.id,
      version: workflow.version,
      nodes: [...workflow.nodes],
      edges: [...workflow.edges],
      state: { ...workflow.state },
      description: `Version ${workflow.version}`
    }
    
    versions.push(newVersion)
    
    // Keep only the latest versions
    const sortedVersions = versions
      .sort((a, b) => b.version - a.version)
      .slice(0, MAX_VERSIONS_PER_WORKFLOW)
    
    const allVersions = getAllVersions()
    const otherVersions = allVersions.filter(v => v.workflowId !== workflow.id)
    const updatedVersions = [...otherVersions, ...sortedVersions]
    
    localStorage.setItem(STORAGE_KEYS.VERSIONS, JSON.stringify(updatedVersions))
  } catch (error) {
    console.error('Error creating workflow version:', error)
  }
}

/**
 * Get all versions
 */
function getAllVersions(): WorkflowVersion[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.VERSIONS)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading versions:', error)
    return []
  }
}

/**
 * Get workflow versions
 */
export function getWorkflowVersions(workflowId: string): WorkflowVersion[] {
  try {
    const allVersions = getAllVersions()
    return allVersions
      .filter(v => v.workflowId === workflowId)
      .sort((a, b) => b.version - a.version)
  } catch (error) {
    console.error('Error loading workflow versions:', error)
    return []
  }
}

/**
 * Restore workflow version
 */
export function restoreWorkflowVersion(workflowId: string, version: number): StoredWorkflow | null {
  try {
    const versions = getWorkflowVersions(workflowId)
    const targetVersion = versions.find(v => v.version === version)
    
    if (!targetVersion) return null
    
    const workflows = getStoredWorkflows()
    const workflowIndex = workflows.findIndex(w => w.id === workflowId)
    
    if (workflowIndex === -1) return null
    
    // Create backup of current version before restoring
    createWorkflowVersion(workflows[workflowIndex])
    
    // Restore the version
    workflows[workflowIndex] = {
      ...workflows[workflowIndex],
      nodes: [...targetVersion.nodes],
      edges: [...targetVersion.edges],
      state: { ...targetVersion.state },
      version: workflows[workflowIndex].version + 1
    }
    
    localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(workflows))
    
    return workflows[workflowIndex]
  } catch (error) {
    console.error('Error restoring workflow version:', error)
    return null
  }
}

/**
 * Delete workflow versions
 */
function deleteWorkflowVersions(workflowId: string): void {
  try {
    const allVersions = getAllVersions()
    const filteredVersions = allVersions.filter(v => v.workflowId !== workflowId)
    localStorage.setItem(STORAGE_KEYS.VERSIONS, JSON.stringify(filteredVersions))
  } catch (error) {
    console.error('Error deleting workflow versions:', error)
  }
}

/**
 * Update recent workflows
 */
function updateRecentWorkflows(workflowId: string): void {
  try {
    const recent = getRecentWorkflows()
    const filtered = recent.filter(id => id !== workflowId)
    const updated = [workflowId, ...filtered].slice(0, MAX_RECENT_WORKFLOWS)
    
    localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(updated))
  } catch (error) {
    console.error('Error updating recent workflows:', error)
  }
}

/**
 * Get recent workflows
 */
export function getRecentWorkflows(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RECENT)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading recent workflows:', error)
    return []
  }
}

/**
 * Remove from recent workflows
 */
function removeFromRecentWorkflows(workflowId: string): void {
  try {
    const recent = getRecentWorkflows()
    const filtered = recent.filter(id => id !== workflowId)
    localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(filtered))
  } catch (error) {
    console.error('Error removing from recent workflows:', error)
  }
}

/**
 * Search workflows
 */
export function searchWorkflows(query: string): StoredWorkflow[] {
  try {
    const workflows = getStoredWorkflows()
    const lowercaseQuery = query.toLowerCase()
    
    return workflows.filter(workflow => 
      workflow.name.toLowerCase().includes(lowercaseQuery) ||
      workflow.description?.toLowerCase().includes(lowercaseQuery)
    )
  } catch (error) {
    console.error('Error searching workflows:', error)
    return []
  }
}

/**
 * Get workflow statistics
 */
export function getWorkflowStats(): {
  totalWorkflows: number
  totalNodes: number
  totalEdges: number
  storageUsed: number
} {
  try {
    const workflows = getStoredWorkflows()
    const versions = getAllVersions()
    
    const totalNodes = workflows.reduce((sum, w) => sum + w.nodes.length, 0)
    const totalEdges = workflows.reduce((sum, w) => sum + w.edges.length, 0)
    
    // Calculate approximate storage usage
    const workflowsSize = JSON.stringify(workflows).length
    const versionsSize = JSON.stringify(versions).length
    const storageUsed = workflowsSize + versionsSize
    
    return {
      totalWorkflows: workflows.length,
      totalNodes,
      totalEdges,
      storageUsed
    }
  } catch (error) {
    console.error('Error calculating workflow stats:', error)
    return {
      totalWorkflows: 0,
      totalNodes: 0,
      totalEdges: 0,
      storageUsed: 0
    }
  }
}

/**
 * Export all workflows
 */
export function exportAllWorkflows(): string {
  try {
    const workflows = getStoredWorkflows()
    const versions = getAllVersions()
    
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      workflows,
      versions
    }
    
    return JSON.stringify(exportData, null, 2)
  } catch (error) {
    console.error('Error exporting all workflows:', error)
    throw new Error('Failed to export workflows')
  }
}

/**
 * Import all workflows
 */
export function importAllWorkflows(jsonData: string): { success: boolean; error?: string } {
  try {
    const data = JSON.parse(jsonData)
    
    if (!data.workflows || !Array.isArray(data.workflows)) {
      return { success: false, error: 'Invalid import data format' }
    }
    
    // Backup current data
    const currentWorkflows = getStoredWorkflows()
    const currentVersions = getAllVersions()
    
    try {
      // Import workflows
      localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(data.workflows))
      
      // Import versions if available
      if (data.versions && Array.isArray(data.versions)) {
        localStorage.setItem(STORAGE_KEYS.VERSIONS, JSON.stringify(data.versions))
      }
      
      return { success: true }
    } catch (importError) {
      // Restore backup on error
      localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(currentWorkflows))
      localStorage.setItem(STORAGE_KEYS.VERSIONS, JSON.stringify(currentVersions))
      throw importError
    }
  } catch (error) {
    console.error('Error importing workflows:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to import workflows' 
    }
  }
}

/**
 * Clear all workflow data
 */
export function clearAllWorkflowData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.WORKFLOWS)
    localStorage.removeItem(STORAGE_KEYS.VERSIONS)
    localStorage.removeItem(STORAGE_KEYS.RECENT)
  } catch (error) {
    console.error('Error clearing workflow data:', error)
  }
}