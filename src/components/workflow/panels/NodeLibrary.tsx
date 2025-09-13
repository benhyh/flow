'use client'

import React, { useState } from 'react'
import { Mail, Zap, CheckSquare, Filter, Sparkles, LogOut, User, Ampersand, Tag, Group } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// SVG Components for Trello and Asana
function TrelloIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 73.323 64" className="text-white">
      <defs>
        <linearGradient id="trello-gradient" x1="31.52" y1="64.56" x2="31.52" y2="1.51" gradientUnits="userSpaceOnUse">
          <stop offset=".18" stopColor="#0052cc"/>
          <stop offset="1" stopColor="#2684ff"/>
        </linearGradient>
      </defs>
      <path d="M55.16 1.5H7.88a7.88 7.88 0 0 0-5.572 2.308A7.88 7.88 0 0 0 0 9.39v47.28a7.88 7.88 0 0 0 7.88 7.88h47.28A7.88 7.88 0 0 0 63 56.67V9.4a7.88 7.88 0 0 0-7.84-7.88zM27.42 49.26A3.78 3.78 0 0 1 23.64 53H12a3.78 3.78 0 0 1-3.8-3.74V13.5A3.78 3.78 0 0 1 12 9.71h11.64a3.78 3.78 0 0 1 3.78 3.78zM54.85 33.5a3.78 3.78 0 0 1-3.78 3.78H39.4a3.78 3.78 0 0 1-3.78-3.78v-20a3.78 3.78 0 0 1 3.78-3.79h11.67a3.78 3.78 0 0 1 3.78 3.78z" fill="url(#trello-gradient)" fillRule="evenodd" transform="matrix(1.163111 0 0 1.163111 .023263 -6.417545)"/>
    </svg>
  )
}

function AsanaIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="781.361 0 944.893 873.377">
      <defs>
        <radialGradient id="asana-gradient" cx="943.992" cy="1221.416" r=".663" gradientTransform="matrix(944.8934 0 0 -873.3772 -890717.875 1067234.75)" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffb900"/>
          <stop offset=".6" stopColor="#f95d8f"/>
          <stop offset=".999" stopColor="#f95353"/>
        </radialGradient>
      </defs>
      <path fill="url(#asana-gradient)" d="M1520.766 462.371c-113.508 0-205.508 92-205.508 205.488 0 113.499 92 205.518 205.508 205.518 113.489 0 205.488-92.019 205.488-205.518 0-113.488-91.999-205.488-205.488-205.488zm-533.907.01c-113.489.01-205.498 91.99-205.498 205.488 0 113.489 92.009 205.498 205.498 205.498 113.498 0 205.508-92.009 205.508-205.498 0-113.499-92.01-205.488-205.518-205.488h.01zm472.447-256.883c0 113.489-91.999 205.518-205.488 205.518-113.508 0-205.508-92.029-205.508-205.518S1140.31 0 1253.817 0c113.489 0 205.479 92.009 205.479 205.498h.01z"/>
    </svg>
  )
}

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
    icon: 'Mail',
    description: 'Triggers when a new email is received',
    color: '#10b981', // green
  },
  
  // Actions
  {
    id: 'trello-action',
    type: 'action',
    subtype: 'trello-action',
    label: 'Create Trello Card',
    icon: 'TrelloSVG',
    description: 'Creates a new card in Trello',
    color: '#0052cc', // Trello blue
  },
  {
    id: 'asana-action',
    type: 'action',
    subtype: 'asana-action',
    label: 'Create Asana Task',
    icon: 'AsanaSVG',
    description: 'Creates a new task in Asana',
    color: '#f95d8f', // Asana pink
  },
  
  // Logic/Filters
  {
    id: 'condition-logic',
    type: 'logic',
    subtype: 'condition-logic',
    label: 'If Condition',
    icon: 'Ampersand',
    description: 'Conditional branching logic',
    color: '#f59e0b', // amber
  },
  
  // Utility Nodes
  {
    id: 'manual-tagging',
    type: 'ai',
    subtype: 'ai-tagging',
    label: 'Content Tagging',
    icon: 'Tag',
    description: 'Manually tag content with labels',
    color: '#8b5cf6', // purple (Flow brand color)
  },
  {
    id: 'manual-classification',
    type: 'ai',
    subtype: 'ai-classification',
    label: 'Content Classification',
    icon: 'Group',
    description: 'Manually classify content into categories',
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
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [imageError, setImageError] = useState(false)

  // Function to render the appropriate icon
  const renderIcon = (iconName: string, size = 18) => {
    switch (iconName) {
      case 'Mail':
        return <Mail size={size} className="text-white" />
      case 'TrelloSVG':
        return <TrelloIcon size={size} />
      case 'AsanaSVG':
        return <AsanaIcon size={size} />
      case 'Ampersand':
        return <Ampersand size={size} className="text-white" />
      case 'Tag':
        return <Tag size={size} className="text-white" />
      case 'Group':
        return <Group size={size} className="text-white" />
      default:
        return <span className="text-lg">{iconName}</span>
    }
  }

  // Handle drag start - set the node type data for drop handling
  const onDragStart = (event: React.DragEvent, nodeType: NodeTypeDefinition) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType))
    event.dataTransfer.effectAllowed = 'move'
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth')
  }

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div className={`bg-[#242424] ${collapsed ? 'p-2' : 'p-4'} overflow-y-auto chat-scrollbar smooth-scroll flex flex-col h-full ${className}`}>
      {/* Node Library Content - Takes available space */}
      <div className="flex-1">
        {!collapsed && (
          <div className="mb-6">
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
              className={`flex items-center ${collapsed ? 'p-2 justify-center' : 'p-3'} bg-[#2d2d2d] rounded-lg hover:bg-[#3d3d3d]/80 cursor-grab active:cursor-grabbing transition-all duration-200`}
              title={collapsed ? `${node.label}: ${node.description}` : undefined}
              role="button"
              tabIndex={0}
              aria-label={`Drag ${node.label} node to canvas`}
            >
              <div className={`${collapsed ? '' : 'mr-3'}`}>{renderIcon(node.icon)}</div>
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
              className={`flex items-center ${collapsed ? 'p-2 justify-center' : 'p-3'} bg-[#2d2d2d] rounded-lg hover:bg-[#3d3d3d]/80 cursor-grab active:cursor-grabbing transition-all duration-200`}
              title={collapsed ? `${node.label}: ${node.description}` : undefined}
              role="button"
              tabIndex={0}
              aria-label={`Drag ${node.label} node to canvas`}
            >
              <div className={`${collapsed ? '' : 'mr-3'}`}>{renderIcon(node.icon)}</div>
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
              className={`flex items-center ${collapsed ? 'p-2 justify-center' : 'p-3'} bg-[#2d2d2d] rounded-lg hover:bg-[#3d3d3d]/80 cursor-grab active:cursor-grabbing transition-all duration-200`}
              title={collapsed ? `${node.label}: ${node.description}` : undefined}
              role="button"
              tabIndex={0}
              aria-label={`Drag ${node.label} node to canvas`}
            >
              <div className={`${collapsed ? '' : 'mr-3'}`}>{renderIcon(node.icon)}</div>
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

      {/* Utility Nodes Section */}
      <div className="mb-6">
        <h3 className={`text-sm font-medium text-gray-300 mb-3 flex items-center ${collapsed ? 'justify-center' : ''}`}>
          <Sparkles size={16} className={collapsed ? '' : 'mr-2'} />
          {!collapsed && 'Utility Nodes'}
        </h3>
        <div className="space-y-2">
          {nodeCategories.ai.map((node) => (
            <div
              key={node.id}
              draggable
              onDragStart={(event) => onDragStart(event, node)}
              className={`flex items-center ${collapsed ? 'p-2 justify-center' : 'p-3'} bg-[#2d2d2d] rounded-lg hover:bg-[#3d3d3d]/80 cursor-grab active:cursor-grabbing transition-all duration-200`}
              title={collapsed ? `${node.label}: ${node.description}` : undefined}
              role="button"
              tabIndex={0}
              aria-label={`Drag ${node.label} node to canvas`}
            >
              <div className={`${collapsed ? '' : 'mr-3'}`}>{renderIcon(node.icon)}</div>
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

      {/* User Profile Section - Always at bottom */}
      {user && (
        <div className="mt-auto pt-3">
          {!collapsed ? (
            <div className="space-y-3">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-[#2d2d2d] rounded-lg">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#3d3d3d] flex items-center justify-center">
                  {user.user_metadata?.avatar_url && !imageError ? (
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt="Profile"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                      unoptimized={user.user_metadata.avatar_url.includes('googleusercontent.com')}
                    />
                  ) : (
                    <User size={20} className="text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {user.user_metadata?.full_name || 
                     user.user_metadata?.preferred_username || 
                     user.email?.split('@')[0] || 
                     'User'}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {user.email}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 p-2.5 bg-[#8b5cf6]/20 hover:bg-[#8b5cf6]/30 text-[#8b5cf6] hover:text-[#7c3aed] rounded-lg transition-all duration-200 text-sm font-medium"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          ) : (
            /* Collapsed view */
            <div>
              {/* User Avatar */}
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[#3d3d3d] flex items-center justify-center mx-auto">
                {user.user_metadata?.avatar_url && !imageError ? (
                  <Image
                    src={user.user_metadata.avatar_url}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                    unoptimized={user.user_metadata.avatar_url.includes('googleusercontent.com')}
                  />
                ) : (
                  <User size={16} className="text-gray-400" />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}