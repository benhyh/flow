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
    config: Record<string, unknown>
    status?: 'idle' | 'running' | 'success' | 'error'
  }
}

export interface FlowEdge extends Edge {
  animated?: boolean
  style?: Record<string, unknown>
}