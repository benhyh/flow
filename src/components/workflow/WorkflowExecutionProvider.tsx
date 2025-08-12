'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useWorkflowExecution } from './useWorkflowExecution'
import { type ExecutionRun } from './DebugPanel'

interface WorkflowExecutionContextType {
  executionRuns: ExecutionRun[]
  currentRun: ExecutionRun | null
  executeWorkflow: () => Promise<void>
  clearLogs: () => void
  isExecuting: boolean
}

const WorkflowExecutionContext = createContext<WorkflowExecutionContextType | null>(null)

export function WorkflowExecutionProvider({ children }: { children: ReactNode }) {
  const executionState = useWorkflowExecution()

  return (
    <WorkflowExecutionContext.Provider value={executionState}>
      {children}
    </WorkflowExecutionContext.Provider>
  )
}

export function useWorkflowExecutionContext() {
  const context = useContext(WorkflowExecutionContext)
  if (!context) {
    // Return default values when not in context (SSR)
    return {
      executionRuns: [],
      currentRun: null,
      executeWorkflow: async () => {},
      clearLogs: () => {},
      isExecuting: false
    }
  }
  return context
}