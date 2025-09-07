import { useState, useCallback, useEffect, useRef } from 'react'
import { type Node, type Edge } from '@xyflow/react'
import { type WorkflowState, type WorkflowStatus } from '../toolbar/WorkflowToolbar'
import { workflowService } from '@/lib/services/WorkflowService'
import { validateWorkflow, type ValidationResult } from '../utils/workflowValidation'
import { toast } from 'sonner'

// Helper function to validate UUID format
const isValidUUID = (id: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

// Default workflow state
const defaultWorkflowState: WorkflowState = {
  name: 'Untitled Workflow',
  status: 'draft',
  isValid: false,
  validationErrors: []
}

export function useWorkflowState(initialState?: Partial<WorkflowState>) {
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    ...defaultWorkflowState,
    ...initialState
  })

  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false) // Disabled for MVP - manual saves only
  const [isSaving, setIsSaving] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle')
  const mountedRef = useRef(true)

  // Don't generate local IDs - let Supabase generate UUIDs when saving
  // useEffect(() => {
  //   if (!workflowState.id) {
  //     const id = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  //     setWorkflowState(prev => ({ ...prev, id }))
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []) // Empty dependency array to run only once

  // Update workflow state
  const updateWorkflowState = useCallback((updates: Partial<WorkflowState>) => {
    setWorkflowState(prev => ({ ...prev, ...updates }))
  }, [])

  // Validate workflow
  const validateCurrentWorkflow = useCallback((nodes: Node[], edges: Edge[]) => {
    if (!mountedRef.current) return { isValid: false, errors: [], warnings: [], info: [], score: 0 }
    
    const validation = validateWorkflow(nodes, edges)
    setLastValidation(validation)
    
    // Only update state if validation results actually changed and component is mounted
    setWorkflowState(prev => {
      if (!mountedRef.current) return prev
      
      const newIsValid = validation.isValid
      const newErrors = validation.errors.map(error => error.message)
      
      // Check if validation state actually changed
      if (prev.isValid === newIsValid && 
          JSON.stringify(prev.validationErrors) === JSON.stringify(newErrors)) {
        return prev // No change, return same object to prevent re-render
      }
      
      return {
        ...prev,
        isValid: newIsValid,
        validationErrors: newErrors
      }
    })
    
    return validation
  }, [])

  // Handle test run
  const handleRunTest = useCallback(() => {
    updateWorkflowState({ 
      status: 'testing',
      lastRun: new Date()
    })

    // Simulate test execution
    setTimeout(() => {
      updateWorkflowState({ 
        status: workflowState.status === 'active' ? 'active' : 'draft'
      })
    }, 3000) // 3 second test simulation
  }, [workflowState.status, updateWorkflowState])

  // Handle save with validation and direct Supabase storage
  const handleSave = useCallback(async (
    nodes: Node[], 
    edges: Edge[], 
    description?: string,
    showToast: boolean = true
  ) => {
    if (isSaving) return false // Prevent concurrent saves
    
    try {
      setIsSaving(true)
      setSyncStatus('syncing')
      
      // Validate before saving
      const validation = validateCurrentWorkflow(nodes, edges)
      
      if (validation.errors.length > 0 && showToast) {
        toast.error('Cannot save workflow with errors', {
          description: `${validation.errors.length} error(s) need to be fixed first`
        })
        setSyncStatus('error')
        return false
      }

      // Save directly to Supabase
      let savedWorkflow
      
      // Check if we have a valid UUID (Supabase-generated) or need to create new
      const isSupabaseId = workflowState.id && workflowState.id.trim() !== '' && isValidUUID(workflowState.id)
      
      console.log(`[useWorkflowState] Workflow ID: "${workflowState.id}", Is Supabase ID: ${isSupabaseId}`)
      
      if (isSupabaseId) {
        // Update existing workflow in Supabase
        console.log(`[useWorkflowState] Updating existing workflow in Supabase: ${workflowState.id}`)
        savedWorkflow = await workflowService.updateWorkflow(workflowState.id, {
          name: workflowState.name,
          description: description || workflowState.description,
          nodes,
          edges,
          is_active: workflowState.status === 'active'
        })
      } else {
        // Create new workflow in Supabase (no ID or invalid ID)
        console.log(`[useWorkflowState] Creating new workflow in Supabase (current ID: "${workflowState.id}")`)
        savedWorkflow = await workflowService.createWorkflow({
          name: workflowState.name,
          description: description || workflowState.description,
          nodes,
          edges,
          is_active: workflowState.status === 'active',
          validate: false // Already validated above
        })
      }
      
      // Update state with saved workflow info
      updateWorkflowState({ 
        lastSaved: new Date(),
        id: savedWorkflow.id,
        name: savedWorkflow.name
      })

      setSyncStatus('synced')
      
      if (showToast) {
        toast.success('Workflow saved successfully!', {
          description: `"${savedWorkflow.name}" has been saved to Supabase`
        })
      }

      return true
    } catch (error) {
      console.error('Supabase error saving workflow:', error)
      setSyncStatus('error')
      
      if (showToast) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save workflow to Supabase'
        
        toast.error('Failed to save workflow', {
          description: errorMessage,
          duration: 8000 // Longer duration for error messages
        })
      }
      
      // Re-throw error to let calling code handle it
      throw error
    } finally {
      setIsSaving(false)
      // Reset sync status after 3 seconds
      setTimeout(() => setSyncStatus('idle'), 3000)
    }
  }, [workflowState, updateWorkflowState, validateCurrentWorkflow, isSaving])

  // Auto-save functionality
  const handleAutoSave = useCallback(async (
    nodes: Node[], 
    edges: Edge[]
  ) => {
    console.log('[useWorkflowState] handleAutoSave called:', {
      autoSaveEnabled,
      workflowStateId: workflowState.id,
      nodeCount: nodes.length,
      edgeCount: edges.length
    })

    if (!autoSaveEnabled) {
      console.log('[useWorkflowState] Auto-save disabled, skipping')
      return
    }

    // Auto-save should work even with empty IDs (for new workflows)
    // The handleSave function will handle the create vs update logic

    console.log('[useWorkflowState] Proceeding with auto-save...')
    try {
      await handleSave(nodes, edges, undefined, false) // Silent save
      console.log('[useWorkflowState] Auto-save completed successfully')
    } catch (error) {
      console.error('[useWorkflowState] Auto-save failed - Supabase error:', error)
      // Don't show toast for auto-save failures, but log them
      setSyncStatus('error')
    }
  }, [autoSaveEnabled, workflowState.id, handleSave])

  // Handle status toggle
  const handleToggleStatus = useCallback(() => {
    const currentStatus = workflowState.status
    let newStatus: WorkflowStatus

    switch (currentStatus) {
      case 'draft':
        newStatus = 'active'
        break
      case 'active':
        newStatus = 'paused'
        break
      case 'paused':
        newStatus = 'active'
        break
      default:
        newStatus = 'draft'
    }

    updateWorkflowState({ status: newStatus })
  }, [workflowState.status, updateWorkflowState])

  // Load workflow from Supabase (for future use)
  const loadWorkflowFromStorage = useCallback(async (workflowId: string) => {
    try {
      const storedWorkflow = await workflowService.getWorkflow(workflowId)
      const workflowState: WorkflowState = {
        id: storedWorkflow.id,
        name: storedWorkflow.name,
        status: storedWorkflow.is_active ? 'active' : 'draft',
        isValid: true,
        validationErrors: []
      }
      
      setWorkflowState(workflowState)
      toast.success('Workflow loaded successfully!', {
        description: `"${storedWorkflow.name}" loaded from Supabase`
      })
      return {
        nodes: storedWorkflow.nodes,
        edges: storedWorkflow.edges,
        state: workflowState
      }
    } catch (error) {
      console.error('Supabase error loading workflow:', error)
      toast.error('Failed to load workflow', {
        description: error instanceof Error ? error.message : 'Unable to load workflow from Supabase'
      })
      return null
    }
  }, [])

  // Reset workflow state
  const resetWorkflowState = useCallback(() => {
    setWorkflowState({
      ...defaultWorkflowState,
      id: '' // Clear ID - let Supabase generate UUID when saving
    })
    setLastValidation(null)
  }, [])

  // Load workflow state (for future backend integration)
  const loadWorkflowState = useCallback((state: WorkflowState) => {
    setWorkflowState(state)
  }, [])

  // Create new workflow
  const createNewWorkflow = useCallback((name?: string) => {
    const newState: WorkflowState = {
      ...defaultWorkflowState,
      id: '', // Let Supabase generate UUID when saving
      name: name || 'Untitled Workflow'
    }
    setWorkflowState(newState)
    setLastValidation(null)
    return newState
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  return {
    // State
    workflowState: { ...workflowState, lastValidation },
    lastValidation,
    autoSaveEnabled,
    isSaving,
    syncStatus,
    
    // Actions
    updateWorkflowState,
    validateCurrentWorkflow,
    handleRunTest,
    handleSave,
    handleAutoSave,
    handleToggleStatus,
    loadWorkflowFromStorage,
    resetWorkflowState,
    loadWorkflowState,
    createNewWorkflow,
    
    // Settings
    setAutoSaveEnabled
  }
}