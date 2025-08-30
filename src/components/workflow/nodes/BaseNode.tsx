'use client'

import React, { useState } from 'react'
import { Handle, Position, type NodeProps, useReactFlow } from '@xyflow/react'
import { X } from 'lucide-react'
import { setConfiguredNode } from '../panels/ConfigPanel'
import { useNodeOperationsContext } from '../contexts/NodeOperationsContext'

export interface BaseNodeData {
  label: string
  nodeType: string
  icon: string
  color: string
  status?: 'idle' | 'running' | 'success' | 'error'
  config?: Record<string, unknown>
}

interface BaseNodeProps extends NodeProps {
  showSourceHandle?: boolean
  showTargetHandle?: boolean
  handlePosition?: {
    source?: Position
    target?: Position
  }
  children?: React.ReactNode
}

export function BaseNode({ 
  data, 
  selected, 
  showSourceHandle = true, 
  showTargetHandle = true,
  handlePosition = { source: Position.Right, target: Position.Left },
  children,
  id
}: BaseNodeProps) {
  // Type assertion to ensure data has the expected properties
  const nodeData = data as unknown as BaseNodeData
  const { deleteElements, getNodes, getEdges } = useReactFlow()
  const { recordNodeDeletion } = useNodeOperationsContext()
  const [isHovered, setIsHovered] = useState(false)
  const getStatusColor = () => {
    switch (nodeData.status) {
      case 'running':
        return 'border-yellow-500 bg-yellow-500/10'
      case 'success':
        return 'border-green-500 bg-green-500/10'
      case 'error':
        return 'border-red-500 bg-red-500/10'
      default:
        return 'border-[#3d3d3d] bg-[#2d2d2d]'
    }
  }

  const getSelectionStyle = () => {
    if (selected) {
      return 'ring-2 ring-[#8b5cf6] ring-opacity-50 border-[#8b5cf6]'
    }
    return ''
  }

  const handleDoubleClick = () => {
    if (id) {
      setConfiguredNode(id)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering other node events
    if (id) {
      // Get current node and connected edges before deletion
      const nodes = getNodes()
      const edges = getEdges()
      const nodeToDelete = nodes.find(n => n.id === id)
      const connectedEdges = edges.filter(edge => 
        edge.source === id || edge.target === id
      )
      
      if (nodeToDelete) {
        // Record the deletion operation
        recordNodeDeletion(nodeToDelete, connectedEdges)
      }
      
      // Delete the node and its connections
      deleteElements({ nodes: [{ id }] })
    }
  }

  return (
    <div 
      className={`
        relative min-w-[180px] rounded-lg border-2 transition-all duration-200
        ${getStatusColor()}
        ${getSelectionStyle()}
        hover:border-[#8b5cf6] hover:ring-2 hover:ring-[#8b5cf6] hover:ring-opacity-30
        shadow-lg hover:shadow-xl
      `}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Delete Button - Top Right Corner */}
      {isHovered && (
        <button
          onClick={handleDelete}
          className="absolute -top-2 -right-2 w-6 h-6 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-full flex items-center justify-center transition-all duration-200 z-10 shadow-lg hover:shadow-xl"
          title="Delete node"
        >
          <X size={12} className="text-white" />
        </button>
      )}

      {/* Target Handle (Input) */}
      {showTargetHandle && (
        <Handle
          type="target"
          position={handlePosition.target!}
          className="w-3 h-3 !bg-[#8b5cf6]  hover:!bg-[#7c3aed] transition-colors"
        />
      )}

      {/* Node Content */}
      <div className="p-4">
        {/* Header with Icon and Label */}
        <div className="flex items-center mb-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3"
            style={{ backgroundColor: nodeData.color }}
          >
            {nodeData.icon}
          </div>
          <div className="flex-1">
            <div className="text-white font-medium text-sm">{nodeData.label}</div>
            <div className="text-gray-400 text-xs capitalize">{nodeData.nodeType?.replace('-', ' ')}</div>
          </div>
        </div>

        {/* Status Indicator */}
        {nodeData.status && nodeData.status !== 'idle' && (
          <div className="flex items-center mb-2">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              nodeData.status === 'running' ? 'bg-yellow-500 animate-pulse' :
              nodeData.status === 'success' ? 'bg-green-500' :
              nodeData.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
            }`} />
            <span className={`text-xs capitalize ${
              nodeData.status === 'running' ? 'text-yellow-400' :
              nodeData.status === 'success' ? 'text-green-400' :
              nodeData.status === 'error' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {nodeData.status}
            </span>
          </div>
        )}

        {/* Custom Content */}
        {children}
      </div>

      {/* Source Handle (Output) */}
      {showSourceHandle && (
        <Handle
          type="source"
          position={handlePosition.source!}
          className="w-3 h-3 !bg-[#8b5cf6]  hover:!bg-[#7c3aed] transition-colors"
        />
      )}
    </div>
  )
}