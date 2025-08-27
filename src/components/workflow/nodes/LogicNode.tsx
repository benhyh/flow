'use client'

import React from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { type BaseNodeData } from './BaseNode'
import { setConfiguredNode } from '../panels/ConfigPanel'

interface LogicNodeData extends BaseNodeData {
  logicType?: 'condition' | 'filter' | 'delay' | 'split'
  config?: {
    condition?: string
    operator?: 'contains' | 'equals' | 'startsWith' | 'endsWith'
  }
}

export function LogicNode(props: NodeProps) {
  const { data, id } = props
  const nodeData = data as unknown as LogicNodeData

  const handleDoubleClick = () => {
    if (id) {
      setConfiguredNode(id)
    }
  }

  return (
    <div 
      className={`
        relative min-w-[180px] rounded-lg border-2 transition-all duration-200
        ${props.selected ? 'ring-2 ring-[#8b5cf6] ring-opacity-50 border-[#8b5cf6]' : 'border-[#3d3d3d]'}
        bg-[#2d2d2d] hover:border-[#8b5cf6] hover:ring-2 hover:ring-[#8b5cf6] hover:ring-opacity-30 shadow-lg hover:shadow-xl
      `}
      onDoubleClick={handleDoubleClick}
    >
      {/* Target Handle (Input) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-[#8b5cf6] !border-2 !border-white hover:!bg-[#7c3aed] transition-colors"
      />

      {/* Node Content */}
      <div className="p-4">
        {/* Header */}
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

        {/* Logic-specific content */}
        <div className="mt-2">
          <div className="text-xs text-gray-400 mb-1">Logic Configuration</div>
          
          {nodeData.config?.condition && nodeData.config?.operator && (
            <div className="space-y-1">
              <div className="text-xs text-gray-300">
                <span className="text-gray-500">If:</span> {nodeData.config.condition} {nodeData.config.operator}
              </div>
            </div>
          )}
          
          {!nodeData.config?.condition && (
            <div className="text-xs text-gray-500 italic">Select node to configure</div>
          )}
        </div>
      </div>

      {/* Multiple Source Handles for branching */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ top: '40%' }}
        className="w-3 h-3 !bg-green-500 !border-2 !border-white hover:!bg-green-400 transition-colors"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ top: '60%' }}
        className="w-3 h-3 !bg-red-500 !border-2 !border-white hover:!bg-red-400 transition-colors"
      />
      
      {/* Handle Labels */}
      <div className="absolute right-[-30px] top-[35%] text-xs text-green-400">✓</div>
      <div className="absolute right-[-30px] top-[55%] text-xs text-red-400">✗</div>
    </div>
  )
}