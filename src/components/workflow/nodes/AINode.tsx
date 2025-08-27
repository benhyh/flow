'use client'

import React from 'react'
import { Position, type NodeProps } from '@xyflow/react'
import { BaseNode, type BaseNodeData } from './BaseNode'

interface AINodeData extends BaseNodeData {
  aiType?: 'tagging' | 'classification' | 'sentiment' | 'extraction'
  config?: {
    // AI Tagging
    tags?: string[]
    // AI Classification
    categories?: string[]
  }
}

export function AINode(props: NodeProps) {
  const { data } = props
  const nodeData = data as unknown as AINodeData

  return (
    <BaseNode
      {...props}
      handlePosition={{ source: Position.Right, target: Position.Left }}
    >
      {/* AI-specific content */}
      <div className="mt-2">
        <div className="text-xs text-gray-400 mb-1">AI Configuration</div>
        
        {/* AI Processing Indicator */}
        <div className="flex items-center mb-2">
          <div className="w-2 h-2 rounded-full bg-[#8b5cf6] animate-pulse mr-2" />
          <span className="text-xs text-[#8b5cf6]">AI Processing</span>
        </div>
        
        {/* Display AI Tagging configuration */}
        {nodeData.config?.tags && (
          <div className="space-y-1">
            <div className="text-xs text-gray-300">
              <span className="text-gray-500">Tags:</span> {nodeData.config.tags.join(', ')}
            </div>
          </div>
        )}
        
        {/* Display AI Classification configuration */}
        {nodeData.config?.categories && (
          <div className="space-y-1">
            <div className="text-xs text-gray-300">
              <span className="text-gray-500">Categories:</span> {nodeData.config.categories.join(', ')}
            </div>
          </div>
        )}
        
        {!nodeData.config?.tags && !nodeData.config?.categories && (
          <div className="text-xs text-gray-500 italic">Select node to configure</div>
        )}
      </div>
    </BaseNode>
  )
}