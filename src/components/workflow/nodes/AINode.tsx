'use client'

import React, { useState } from 'react'
import { Handle, Position, type NodeProps, useReactFlow } from '@xyflow/react'
import { Tag, Group, X } from 'lucide-react'
import { setConfiguredNode } from '../panels/ConfigPanel'

export interface BaseNodeData {
  label: string
  nodeType: string
  icon: string
  color: string
  status?: 'idle' | 'running' | 'success' | 'error'
  config?: Record<string, unknown>
}

interface AINodeData extends BaseNodeData {
  utilityType?: 'tagging' | 'classification'
  config?: {
    // Manual Tagging
    selectedTags?: string[]
    // Manual Classification
    selectedCategories?: string[]
    targetType?: string
  }
}

export function AINode(props: NodeProps) {
  const { data, id, selected } = props
  const nodeData = data as unknown as AINodeData
  const { deleteElements } = useReactFlow()
  const [isHovered, setIsHovered] = useState(false)

  const handleDoubleClick = () => {
    if (id) {
      setConfiguredNode(id)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (id) {
      deleteElements({ nodes: [{ id }] })
    }
  }

  const getStatusColor = () => {
    switch (nodeData.status) {
      case 'running':
        return 'border-yellow-500 bg-yellow-500/20'
      case 'success':
        return 'border-green-500 bg-green-500/20'
      case 'error':
        return 'border-red-500 bg-red-500/20'
      default:
        return 'border-[#3d3d3d]'
    }
  }

  // Determine which icon to show based on nodeType
  const getIcon = () => {
    if (nodeData.nodeType === 'ai-tagging') {
      return <Tag size={20} className="text-white" />
    }
    if (nodeData.nodeType === 'ai-classification') {
      return <Group size={20} className="text-white" />
    }
    // Default fallback
    return <Tag size={20} className="text-white" />
  }

  return (
    <div 
      className={`
        relative w-12 h-12 rounded-full bg-[#2d2d2d] border-2 transition-all duration-200
        ${selected ? 'ring-2 ring-[#8b5cf6] ring-opacity-50 border-[#8b5cf6]' : getStatusColor()}
        hover:border-[#8b5cf6] hover:ring-2 hover:ring-[#8b5cf6] hover:ring-opacity-30
        shadow-lg hover:shadow-xl flex items-center justify-center cursor-pointer
      `}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Delete Button */}
      {isHovered && (
        <button
          onClick={handleDelete}
          className="absolute -top-1 -right-1 w-4 h-4 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-full flex items-center justify-center transition-all duration-200 z-10 shadow-lg"
          title="Delete node"
        >
          <X size={8} className="text-white" />
        </button>
      )}

      {/* Utility Icon - Tag or Group based on type */}
      {getIcon()}

      {/* Target Handle (Input) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 !bg-[#8b5cf6] hover:!bg-[#7c3aed] transition-colors !border-0"
      />

      {/* Source Handle (Output) */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 !bg-[#8b5cf6] hover:!bg-[#7c3aed] transition-colors !border-0"
      />
    </div>
  )
}