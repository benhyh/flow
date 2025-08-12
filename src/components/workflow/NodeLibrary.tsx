'use client'

import React from 'react'
import { Zap, CheckSquare, Filter, Sparkles } from 'lucide-react'

// Node type definitions based on our storyboard
export interface NodeTypeDefinition {
  id: string
  type: 'trigger' | 'action' | 'logic' | 'ai'
  subtype: string
  label: string
  icon: string
  description: string
  color: string
}

// Node library data - categorized by type
const nodeTypes: NodeTypeDefinition[] = [
  // Triggers
  {
    id: 'email-trigger',
    type: 'trigger',
    subtype: 'email-trigger',
    label: 'New Email',
    icon: '⚡',
    description: 'Triggers when a new email is received',
    color: '#10b981', // green
  },
  
  // Actions
  {
    id: 'trello-action',
    type: 'action',
    subtype: 'trello-action',
    label: 'Create Trello Card',
    icon: '✅',
    description: 'Creates a new card in Trello',
    color: '#3b82f6', // blue
  },
  {
    id: 'asana-action',
    type: 'action',
    subtype: 'asana-action',
    label: 'Create Asana Task',
    icon: '✅',
    description: 'Creates a new task in Asana',
    color: '#3b82f6', // blue
  },
  
  // Logic/Filters
  {
    id: 'condition-logic',
    type: 'logic',
    subtype: 'condition-logic',
    label: 'If Condition',
    icon: '🔍',
    description: 'Conditional branching logic',
    color: '#f59e0b', // amber
  },
  
  // AI Nodes
  {
    id: 'ai-tagging',
    type: 'ai',
    subtype: 'ai-tagging',
    label: 'AI Tagging',
    icon: '✨',
    description: 'AI-powered content tagging',
    color: '#8b5cf6', // purple (Flow brand color)
  },
  {
    id: 'ai-classification',
    type: 'ai',
    subtype: 'ai-classification',
    label: 'AI Classification',
    icon: '✨',
    description: 'AI-powered content classification',
    color: '#8b5cf6', // purple
  },
]

// Group nodes by category
const nodeCategories = {
  trigger: nodeTypes.filter(node => node.type === 'trigger'),
  action: nodeTypes.filter(node => node.type === 'action'),
  logic: nodeTypes.filter(node => node.type === 'logic'),
  ai: nodeTypes.filter(node => node.type === 'ai'),
}

interface NodeLibraryProps {
  className?: string
  collapsed?: boolean
}

export function NodeLibrary({ className = '', collapsed = false }: NodeLibraryProps) {
  // Handle drag start - set the node type data for drop handling
  const onDragStart = (event: React.DragEvent, nodeType: NodeTypeDefinition) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType))
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className={`bg-[#242424] ${collapsed ? 'p-2' : 'p-4'} overflow-y-auto chat-scrollbar smooth-scroll ${className}`}>
      {!collapsed && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-2">Node Library</h2>
          <p className="text-sm text-white/60">Drag nodes onto the canvas to build your workflow</p>
        </div>
      )}

      {/* Triggers Section */}
      <div className="mb-6">
        <h3 className={`text-sm font-medium text-gray-300 mb-3 flex items-center ${collapsed ? 'justify-center' : ''}`}>
          <Zap size={16} className={collapsed ? '' : 'mr-2'} />
          {!collapsed && 'Triggers'}
        </h3>
        <div className="space-y-2">
          {nodeCategories.trigger.map((node) => (
            <div
              key={node.id}
              draggable
              onDragStart={(event) => onDragStart(event, node)}
              className={`flex items-center ${collapsed ? 'p-2 justify-center' : 'p-3'} bg-[#2d2d2d] rounded-lg hover:border-[#10b981] hover:bg-[#2d2d2d]/80 cursor-grab active:cursor-grabbing transition-all duration-200`}
              style={{ borderLeftColor: node.color, borderLeftWidth: '3px' }}
              title={collapsed ? `${node.label}: ${node.description}` : undefined}
              role="button"
              tabIndex={0}
              aria-label={`Drag ${node.label} node to canvas`}
            >
              <span className={`text-lg ${collapsed ? '' : 'mr-3'}`}>{node.icon}</span>
              {!collapsed && (
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{node.label}</div>
                  <div className="text-xs text-white/50">{node.description}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions Section */}
      <div className="mb-6">
        <h3 className={`text-sm font-medium text-gray-300 mb-3 flex items-center ${collapsed ? 'justify-center' : ''}`}>
          <CheckSquare size={16} className={collapsed ? '' : 'mr-2'} />
          {!collapsed && 'Actions'}
        </h3>
        <div className="space-y-2">
          {nodeCategories.action.map((node) => (
            <div
              key={node.id}
              draggable
              onDragStart={(event) => onDragStart(event, node)}
              className={`flex items-center ${collapsed ? 'p-2 justify-center' : 'p-3'} bg-[#2d2d2d] rounded-lg hover:border-[#3b82f6] hover:bg-[#2d2d2d]/80 cursor-grab active:cursor-grabbing transition-all duration-200`}
              style={{ borderLeftColor: node.color, borderLeftWidth: '3px' }}
              title={collapsed ? `${node.label}: ${node.description}` : undefined}
              role="button"
              tabIndex={0}
              aria-label={`Drag ${node.label} node to canvas`}
            >
              <span className={`text-lg ${collapsed ? '' : 'mr-3'}`}>{node.icon}</span>
              {!collapsed && (
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{node.label}</div>
                  <div className="text-xs text-white/50">{node.description}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Logic/Filters Section */}
      <div className="mb-6">
        <h3 className={`text-sm font-medium text-gray-300 mb-3 flex items-center ${collapsed ? 'justify-center' : ''}`}>
          <Filter size={16} className={collapsed ? '' : 'mr-2'} />
          {!collapsed && 'Logic & Filters'}
        </h3>
        <div className="space-y-2">
          {nodeCategories.logic.map((node) => (
            <div
              key={node.id}
              draggable
              onDragStart={(event) => onDragStart(event, node)}
              className={`flex items-center ${collapsed ? 'p-2 justify-center' : 'p-3'} bg-[#2d2d2d] rounded-lg hover:border-[#f59e0b] hover:bg-[#2d2d2d]/80 cursor-grab active:cursor-grabbing transition-all duration-200`}
              style={{ borderLeftColor: node.color, borderLeftWidth: '3px' }}
              title={collapsed ? `${node.label}: ${node.description}` : undefined}
              role="button"
              tabIndex={0}
              aria-label={`Drag ${node.label} node to canvas`}
            >
              <span className={`text-lg ${collapsed ? '' : 'mr-3'}`}>{node.icon}</span>
              {!collapsed && (
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{node.label}</div>
                  <div className="text-xs text-white/50">{node.description}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Nodes Section */}
      <div className="mb-6">
        <h3 className={`text-sm font-medium text-gray-300 mb-3 flex items-center ${collapsed ? 'justify-center' : ''}`}>
          <Sparkles size={16} className={collapsed ? '' : 'mr-2'} />
          {!collapsed && 'AI Nodes'}
        </h3>
        <div className="space-y-2">
          {nodeCategories.ai.map((node) => (
            <div
              key={node.id}
              draggable
              onDragStart={(event) => onDragStart(event, node)}
              className={`flex items-center ${collapsed ? 'p-2 justify-center' : 'p-3'} bg-[#2d2d2d] rounded-lg hover:border-[#8b5cf6] hover:bg-[#2d2d2d]/80 cursor-grab active:cursor-grabbing transition-all duration-200`}
              style={{ borderLeftColor: node.color, borderLeftWidth: '3px' }}
              title={collapsed ? `${node.label}: ${node.description}` : undefined}
              role="button"
              tabIndex={0}
              aria-label={`Drag ${node.label} node to canvas`}
            >
              <span className={`text-lg ${collapsed ? '' : 'mr-3'}`}>{node.icon}</span>
              {!collapsed && (
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{node.label}</div>
                  <div className="text-xs text-white/50">{node.description}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}