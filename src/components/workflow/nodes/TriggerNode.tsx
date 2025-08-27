'use client'

import React from 'react'
import { Position, type NodeProps } from '@xyflow/react'
import { BaseNode, type BaseNodeData } from './BaseNode'

interface TriggerNodeData extends BaseNodeData {
  triggerType?: 'email' | 'webhook' | 'schedule'
  config?: {
    emailFilters?: {
      sender?: string
      subject?: string
      keywords?: string[]
    }
  }
}

export function TriggerNode(props: NodeProps) {
  const { data } = props
  const nodeData = data as unknown as TriggerNodeData

  return (
    <BaseNode
      {...props}
      showTargetHandle={false} // Triggers don't have inputs
      handlePosition={{ source: Position.Right }}
    >
      {/* Trigger-specific content */}
      <div className="mt-2">
        <div className="text-xs text-gray-400 mb-1">Trigger Configuration</div>
        
        {nodeData.config?.emailFilters && (
          <div className="space-y-1">
            {nodeData.config.emailFilters.sender && (
              <div className="text-xs text-gray-300 truncate">
                <span className="text-gray-500">From:</span> {nodeData.config.emailFilters.sender}
              </div>
            )}
            {nodeData.config.emailFilters.subject && (
              <div className="text-xs text-gray-300 truncate">
                <span className="text-gray-500">Subject:</span> {nodeData.config.emailFilters.subject}
              </div>
            )}
            {nodeData.config.emailFilters.keywords && nodeData.config.emailFilters.keywords.length > 0 && (
              <div className="text-xs text-gray-300 truncate">
                <span className="text-gray-500">Keywords:</span> {nodeData.config.emailFilters.keywords.join(', ')}
              </div>
            )}
          </div>
        )}
        
        {!nodeData.config?.emailFilters && (
          <div className="text-xs text-gray-500 italic">Select node to configure</div>
        )}
      </div>
    </BaseNode>
  )
}