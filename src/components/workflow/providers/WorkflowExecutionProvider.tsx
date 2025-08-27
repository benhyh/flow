'use client'

import React, { createContext, useContext, ReactNode, useEffect } from 'react'
import { useWorkflowExecution } from '../hooks/useWorkflowExecution'

interface WorkflowExecutionContextType {
  nodeExecutionState: Record<string, {
    status: 'idle' | 'running' | 'success' | 'error'
    startTime?: Date
    endTime?: Date
    error?: string
  }>
  executeWorkflow: () => Promise<void>
  checkAuthenticationRequirements: () => { requiresTrello: boolean }
  showAuthToast: (service: 'trello') => Promise<void>
  isExecuting: boolean
}

const WorkflowExecutionContext = createContext<WorkflowExecutionContextType | null>(null)

export function WorkflowExecutionProvider({ children }: { children: ReactNode }) {
  console.log('[WORKFLOW PROVIDER] WorkflowExecutionProvider mounting...')
  
  const executionState = useWorkflowExecution()
  
  // Log when execution state changes
  useEffect(() => {
    console.log('[WORKFLOW PROVIDER] Execution state updated:', {
      isExecuting: executionState.isExecuting,
      nodeExecutionStateKeys: Object.keys(executionState.nodeExecutionState),
      executeWorkflowFunction: typeof executionState.executeWorkflow
    })
  }, [executionState.isExecuting, executionState.nodeExecutionState, executionState.executeWorkflow])

  // Log provider mount/unmount
  useEffect(() => {
    console.log('[WORKFLOW PROVIDER] Provider mounted successfully')
    return () => {
      console.log('[WORKFLOW PROVIDER] Provider unmounting...')
    }
  }, [])

  return (
    <WorkflowExecutionContext.Provider value={executionState}>
      {children}
    </WorkflowExecutionContext.Provider>
  )
}

export function useWorkflowExecutionContext() {
  console.log('[WORKFLOW PROVIDER] useWorkflowExecutionContext called')
  
  const context = useContext(WorkflowExecutionContext)
  if (!context) {
    console.log('[WORKFLOW PROVIDER] No context found - returning default values (likely SSR or outside provider)')
    // Return default values when not in context (SSR)
    return {
      nodeExecutionState: {},
      executeWorkflow: async () => {
        console.log('[WORKFLOW PROVIDER] Default executeWorkflow called (no-op)')
      },
      checkAuthenticationRequirements: () => ({ requiresTrello: false }),
      showAuthToast: async () => {
        console.log('[WORKFLOW PROVIDER] Default showAuthToast called (no-op)')
      },
      isExecuting: false
    }
  }
  
  console.log('[WORKFLOW PROVIDER] Context found - returning execution state:', {
    isExecuting: context.isExecuting,
    nodeExecutionStateKeys: Object.keys(context.nodeExecutionState),
    executeWorkflowFunction: typeof context.executeWorkflow
  })
  
  return context
}