import { useState, useCallback, useEffect, useRef } from 'react'
import { type Node, type Edge } from '@xyflow/react'
import { type WorkflowState, type WorkflowStatus } from '../toolbar/WorkflowToolbar'
import { saveWorkflow, loadWorkflow } from '@/lib/workflow-storage'
import { validateWorkflow, type ValidationResult } from '../utils/workflowValidation'
import { toast } from 'sonner'

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
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const mountedRef = useRef(true)

  // Generate ID if not provided (only once on mount)
  useEffect(() => {
    if (!workflowState.id) {
      const id = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setWorkflowState(prev => ({ ...prev, id }))
    }
  }, []) // Empty dependency array to run only once

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

  // Handle save with validation and storage
  const handleSave = useCallback(async (
    nodes: Node[], 
    edges: Edge[], 
    description?: string,
    showToast: boolean = true
  ) => {
    try {
      // Validate before saving
      const validation = validateCurrentWorkflow(nodes, edges)
      
      if (validation.errors.length > 0 && showToast) {
        toast.error('Cannot save workflow with errors', {
          description: `${validation.errors.length} error(s) need to be fixed first`
        })
        return false
      }

      // Save to localStorage
      const savedWorkflow = saveWorkflow(nodes, edges, workflowState, description)
      
      // Update state with saved workflow info
      updateWorkflowState({ 
        lastSaved: new Date(),
        id: savedWorkflow.id,
        name: savedWorkflow.name
      })

      if (showToast) {
        toast.success('Workflow saved successfully!', {
          description: `Saved "${savedWorkflow.name}" v${savedWorkflow.version}`
        })
      }

      return true
    } catch (error) {
      console.error('Error saving workflow:', error)
      if (showToast) {
        toast.error('Failed to save workflow', {
          description: error instanceof Error ? error.message : 'Unknown error occurred'
        })
      }
      return false
    }
  }, [workflowState, updateWorkflowState, validateCurrentWorkflow])

  // Auto-save functionality
  const handleAutoSave = useCallback(async (
    nodes: Node[], 
    edges: Edge[]
  ) => {
    if (!autoSaveEnabled || !workflowState.id) return

    try {
      await handleSave(nodes, edges, undefined, false) // Silent save
    } catch (error) {
      console.error('Auto-save failed:', error)
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

  // Load workflow from storage
  const loadWorkflowFromStorage = useCallback((workflowId: string) => {
    try {
      const storedWorkflow = loadWorkflow(workflowId)
      if (storedWorkflow) {
        setWorkflowState(storedWorkflow.state)
        toast.success('Workflow loaded successfully!', {
          description: `Loaded "${storedWorkflow.name}" v${storedWorkflow.version}`
        })
        return {
          nodes: storedWorkflow.nodes,
          edges: storedWorkflow.edges,
          state: storedWorkflow.state
        }
      }
      return null
    } catch (error) {
      console.error('Error loading workflow:', error)
      toast.error('Failed to load workflow', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      })
      return null
    }
  }, [])

  // Reset workflow state
  const resetWorkflowState = useCallback(() => {
    setWorkflowState({
      ...defaultWorkflowState,
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    })
    setLastValidation(null)
  }, [])

  // Load workflow state (for future backend integration)
  const loadWorkflowState = useCallback((state: WorkflowState) => {
    setWorkflowState(state)
  }, [])

  // Create new workflow
  const createNewWorkflow = useCallback((name?: string) => {
    const id = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newState: WorkflowState = {
      ...defaultWorkflowState,
      id,
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