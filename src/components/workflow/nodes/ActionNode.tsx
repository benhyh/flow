'use client'

import React from 'react'
import { Position, type NodeProps } from '@xyflow/react'
import { BaseNode, type BaseNodeData } from './BaseNode'

interface ActionNodeData extends BaseNodeData {
  actionType?: 'trello' | 'asana' | 'email' | 'webhook'
  config?: {
    // Trello config
    boardId?: string
    listId?: string
    cardTitle?: string
    // Asana config  
    projectId?: string
    taskName?: string
  }
}

export function ActionNode(props: NodeProps) {
  const { data } = props
  const nodeData = data as unknown as ActionNodeData

  return (
    <BaseNode
      {...props}
      handlePosition={{ source: Position.Right, target: Position.Left }}
    >
      {/* Action-specific content */}
      <div className="mt-2">
        <div className="text-xs text-gray-400 mb-1">Action Configuration</div>
        
        {/* Display Trello configuration */}
        {nodeData.config?.boardId && (
          <div className="space-y-1">
            <div className="text-xs text-gray-300">
              <span className="text-gray-500">Board:</span> {nodeData.config.boardId}
            </div>
            {nodeData.config.listId && (
              <div className="text-xs text-gray-300">
                <span className="text-gray-500">List:</span> {nodeData.config.listId}
              </div>
            )}
            {nodeData.config.cardTitle && (
              <div className="text-xs text-gray-300">
                <span className="text-gray-500">Title:</span> {nodeData.config.cardTitle}
              </div>
            )}
          </div>
        )}
        
        {/* Display Asana configuration */}
        {nodeData.config?.projectId && (
          <div className="space-y-1">
            <div className="text-xs text-gray-300">
              <span className="text-gray-500">Project:</span> {nodeData.config.projectId}
            </div>
            {nodeData.config.taskName && (
              <div className="text-xs text-gray-300">
                <span className="text-gray-500">Task:</span> {nodeData.config.taskName}
              </div>
            )}
          </div>
        )}
        
        {!nodeData.config?.boardId && !nodeData.config?.projectId && (
          <div className="text-xs text-gray-500 italic">Select node to configure</div>
        )}
      </div>
    </BaseNode>
  )
}