'use client'

import { ReactNode } from 'react'
import { useWorkflowExecutionManager } from './WorkflowExecutionManager'

interface WorkflowExecutionWrapperProps {
  children: (executionManager: ReturnType<typeof useWorkflowExecutionManager>) => ReactNode
}

/**
 * This wrapper component ensures that useWorkflowExecutionManager is called
 * within the ReactFlowProvider context, avoiding the zustand provider error.
 */
export function WorkflowExecutionWrapper({ children }: WorkflowExecutionWrapperProps) {
  const executionManager = useWorkflowExecutionManager()
  return <>{children(executionManager)}</>
}
