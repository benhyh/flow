/**
 * Workflow Type Definitions
 * Core types for React Flow workflow system
 */

import { Node, Edge } from '@xyflow/react'

export type NodeType = 'trigger' | 'action' | 'logic' | 'ai'

export interface FlowNode extends Node {
  type: NodeType
  data: {
    label: string
    icon: string
    config: Record<string, any>
    status?: 'idle' | 'running' | 'success' | 'error'
  }
}

export interface FlowEdge extends Edge {
  // Add custom edge properties if needed
}