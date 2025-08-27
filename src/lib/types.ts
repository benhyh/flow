// Core data types for the application
export interface User {
  id: string
  email: string
  createdAt: Date
  updatedAt: Date
}

export interface Connection {
  id: string
  userId: string
  provider: 'gmail' | 'trello' | 'asana'
  accessToken: string
  refreshToken: string
  expiresAt: Date
  isActive: boolean
}

export interface WorkflowNode {
  id: string
  type: 'trigger' | 'action' | 'condition'
  nodeType: string
  config: Record<string, unknown>
  position: { x: number; y: number }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

export interface Workflow {
  id: string
  userId: string
  name: string
  description: string
  isActive: boolean
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  createdAt: Date
  updatedAt: Date
}

export interface ExecutionLog {
  id: string
  workflowId: string
  status: 'success' | 'failed' | 'running'
  triggerData: Record<string, unknown>
  result: Record<string, unknown>
  error?: string
  executedAt: Date
  duration: number
}
