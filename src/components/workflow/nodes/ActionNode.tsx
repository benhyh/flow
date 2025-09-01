'use client'

import React, { useState } from 'react'
import { Handle, Position, type NodeProps, useReactFlow } from '@xyflow/react'
import { X } from 'lucide-react'
import { setConfiguredNode } from '../panels/ConfigPanel'

export interface BaseNodeData {
  label: string
  nodeType: string
  icon: string
  color: string
  status?: 'idle' | 'running' | 'success' | 'error'
  config?: Record<string, unknown>
}

interface ActionNodeData extends BaseNodeData {
  actionType?: 'trello' | 'asana'
  config?: {
    board?: string
    list?: string
    project?: string
    team?: string
  }
}

// SVG Components for Trello and Asana
function TrelloIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 73.323 64">
      <defs>
        <linearGradient id="trello-gradient-node" x1="31.52" y1="64.56" x2="31.52" y2="1.51" gradientUnits="userSpaceOnUse">
          <stop offset=".18" stopColor="#0052cc"/>
          <stop offset="1" stopColor="#2684ff"/>
        </linearGradient>
      </defs>
      <path d="M55.16 1.5H7.88a7.88 7.88 0 0 0-5.572 2.308A7.88 7.88 0 0 0 0 9.39v47.28a7.88 7.88 0 0 0 7.88 7.88h47.28A7.88 7.88 0 0 0 63 56.67V9.4a7.88 7.88 0 0 0-7.84-7.88zM27.42 49.26A3.78 3.78 0 0 1 23.64 53H12a3.78 3.78 0 0 1-3.8-3.74V13.5A3.78 3.78 0 0 1 12 9.71h11.64a3.78 3.78 0 0 1 3.78 3.78zM54.85 33.5a3.78 3.78 0 0 1-3.78 3.78H39.4a3.78 3.78 0 0 1-3.78-3.78v-20a3.78 3.78 0 0 1 3.78-3.79h11.67a3.78 3.78 0 0 1 3.78 3.78z" fill="url(#trello-gradient-node)" fillRule="evenodd" transform="matrix(1.163111 0 0 1.163111 .023263 -6.417545)"/>
    </svg>
  )
}

function AsanaIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="781.361 0 944.893 873.377">
      <defs>
        <radialGradient id="asana-gradient-node" cx="943.992" cy="1221.416" r=".663" gradientTransform="matrix(944.8934 0 0 -873.3772 -890717.875 1067234.75)" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffb900"/>
          <stop offset=".6" stopColor="#f95d8f"/>
          <stop offset=".999" stopColor="#f95353"/>
        </radialGradient>
      </defs>
      <path fill="url(#asana-gradient-node)" d="M1520.766 462.371c-113.508 0-205.508 92-205.508 205.488 0 113.499 92 205.518 205.508 205.518 113.489 0 205.488-92.019 205.488-205.518 0-113.488-91.999-205.488-205.488-205.488zm-533.907.01c-113.489.01-205.498 91.99-205.498 205.488 0 113.489 92.009 205.498 205.498 205.498 113.498 0 205.508-92.009 205.508-205.498 0-113.499-92.01-205.488-205.518-205.488h.01zm472.447-256.883c0 113.489-91.999 205.518-205.488 205.518-113.508 0-205.508-92.029-205.508-205.518S1140.31 0 1253.817 0c113.489 0 205.479 92.009 205.479 205.498h.01z"/>
    </svg>
  )
}

export function ActionNode(props: NodeProps) {
  const { data, id, selected } = props
  const nodeData = data as unknown as ActionNodeData
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
    if (nodeData.nodeType === 'trello-action') {
      return <TrelloIcon size={20} />
    }
    if (nodeData.nodeType === 'asana-action') {
      return <AsanaIcon size={20} />
    }
    // Default fallback
    return <TrelloIcon size={20} />
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

      {/* Action Icon - Trello or Asana based on type */}
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