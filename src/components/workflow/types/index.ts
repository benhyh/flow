// Node and edge type definitions
export * from './nodeTypes'
export * from './edgeTypes'

// Create a workflow types file for shared types
export interface WorkflowState {
  name: string
  description?: string
  isEnabled: boolean
  lastSaved?: Date
  lastRun?: Date
  runCount: number
  successCount: number
  errorCount: number
  tags: string[]
  version: string
}

export type NodeExecutionStatus = 'idle' | 'running' | 'success' | 'error' | 'warning'

export interface NodeExecutionState {
  [nodeId: string]: {
    status: NodeExecutionStatus
    startTime?: Date
    endTime?: Date
    error?: string
  }
}