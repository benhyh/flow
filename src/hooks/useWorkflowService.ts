/**
 * useWorkflowService Hook
 * 
 * React hook for using WorkflowService with proper error handling and loading states
 * Phase 1.3: Basic hook for workflow operations
 * Source: DATABASE.md Enhanced Implementation Code Structure
 */

import { useState, useCallback } from 'react'
import { workflowService, type WorkflowCreateInput, type WorkflowUpdateInput, type SupabaseWorkflow } from '@/lib/services/WorkflowService'
import { toast } from 'sonner'

interface UseWorkflowServiceReturn {
  // State
  workflows: SupabaseWorkflow[]
  loading: boolean
  error: string | null

  // Actions
  createWorkflow: (input: WorkflowCreateInput) => Promise<SupabaseWorkflow | null>
  updateWorkflow: (id: string, input: WorkflowUpdateInput) => Promise<SupabaseWorkflow | null>
  deleteWorkflow: (id: string) => Promise<boolean>
  loadWorkflows: () => Promise<void>
  getWorkflow: (id: string) => Promise<SupabaseWorkflow | null>
  
  // Utility
  clearError: () => void
}

export function useWorkflowService(): UseWorkflowServiceReturn {
  const [workflows, setWorkflows] = useState<SupabaseWorkflow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleError = useCallback((error: any, operation: string) => {
    const message = error instanceof Error ? error.message : `Failed to ${operation}`
    setError(message)
    toast.error(`Error: ${message}`)
    console.error(`Error in ${operation}:`, error)
  }, [])

  const loadWorkflows = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await workflowService.getUserWorkflows()
      setWorkflows(data)
    } catch (error) {
      handleError(error, 'load workflows')
    } finally {
      setLoading(false)
    }
  }, [handleError])

  const createWorkflow = useCallback(async (input: WorkflowCreateInput): Promise<SupabaseWorkflow> => {
    try {
      setLoading(true)
      setError(null)
      
      const newWorkflow = await workflowService.createWorkflow(input)
      setWorkflows(prev => [newWorkflow, ...prev])
      toast.success(`Workflow "${input.name}" created successfully!`)
      return newWorkflow
    } catch (error) {
      handleError(error, 'create workflow')
      throw error // Re-throw to let calling code handle it
    } finally {
      setLoading(false)
    }
  }, [handleError])

  const updateWorkflow = useCallback(async (id: string, input: WorkflowUpdateInput): Promise<SupabaseWorkflow> => {
    try {
      setLoading(true)
      setError(null)
      
      const updatedWorkflow = await workflowService.updateWorkflow(id, input)
      setWorkflows(prev => prev.map(w => w.id === id ? updatedWorkflow : w))
      toast.success(`Workflow "${updatedWorkflow.name}" updated successfully!`)
      return updatedWorkflow
    } catch (error) {
      handleError(error, 'update workflow')
      throw error // Re-throw to let calling code handle it
    } finally {
      setLoading(false)
    }
  }, [handleError])

  const deleteWorkflow = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      await workflowService.deleteWorkflow(id)
      setWorkflows(prev => prev.filter(w => w.id !== id))
      toast.success('Workflow deleted successfully!')
      return true
    } catch (error) {
      handleError(error, 'delete workflow')
      throw error // Re-throw to let calling code handle it
    } finally {
      setLoading(false)
    }
  }, [handleError])

  const getWorkflow = useCallback(async (id: string): Promise<SupabaseWorkflow> => {
    try {
      setLoading(true)
      setError(null)
      
      const workflow = await workflowService.getWorkflow(id)
      return workflow
    } catch (error) {
      handleError(error, 'get workflow')
      throw error // Re-throw to let calling code handle it
    } finally {
      setLoading(false)
    }
  }, [handleError])

  return {
    // State
    workflows,
    loading,
    error,

    // Actions
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    loadWorkflows,
    getWorkflow,

    // Utility
    clearError
  }
}

export default useWorkflowService
