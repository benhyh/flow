import { useState, useCallback } from 'react'
import { type WorkflowState, type WorkflowStatus } from './WorkflowToolbar'

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

  // Update workflow state
  const updateWorkflowState = useCallback((updates: Partial<WorkflowState>) => {
    setWorkflowState(prev => ({ ...prev, ...updates }))
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

  // Handle save
  const handleSave = useCallback(() => {
    // Here you would typically save to backend/localStorage
    console.log('Saving workflow:', workflowState)
    
    // For now, just update the last saved time
    updateWorkflowState({ lastSaved: new Date() })
  }, [workflowState, updateWorkflowState])

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

  // Reset workflow state
  const resetWorkflowState = useCallback(() => {
    setWorkflowState(defaultWorkflowState)
  }, [])

  // Load workflow state (for future backend integration)
  const loadWorkflowState = useCallback((state: WorkflowState) => {
    setWorkflowState(state)
  }, [])

  return {
    workflowState,
    updateWorkflowState,
    handleRunTest,
    handleSave,
    handleToggleStatus,
    resetWorkflowState,
    loadWorkflowState
  }
}