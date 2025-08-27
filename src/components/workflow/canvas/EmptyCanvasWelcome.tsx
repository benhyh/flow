'use client'

import React from 'react'
import { Zap, Plus, ArrowRight } from 'lucide-react'

import { Card } from '@/components/ui/card'

import { type Node, type Edge } from '@xyflow/react'

interface EmptyCanvasWelcomeProps {
  onNodesChange: (nodes: Node[]) => void
  onEdgesChange: (edges: Edge[]) => void
  onWorkflowStateChange: (updates: Record<string, unknown>) => void
  className?: string
}

export function EmptyCanvasWelcome({
  onNodesChange: _onNodesChange,
  onEdgesChange: _onEdgesChange,
  onWorkflowStateChange: _onWorkflowStateChange,
  className = '',
}: EmptyCanvasWelcomeProps) {


  return (
    <>
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none ${className}`}
      >
        <div className="text-center max-w-2xl mx-auto p-8 pointer-events-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="w-16 h-16 bg-[#8b5cf6] rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome to Flow
            </h2>
            <p className="text-white/50 text-lg">
              Create your first workflow automation in minutes
            </p>
          </div>

          {/* Quick Start Options */}
          <div className="grid grid-cols-1 gap-4 mb-8">

            {/* Start from Scratch */}
            <Card className="bg-[#2d2d2d] hover:bg-[#3d3d3d] transition-all duration-200 cursor-pointer group p-6">
              <div>
                <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-lg mb-4 mx-auto group-hover:bg-green-500/30 transition-colors">
                  <Plus size={24} className="text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-green-500 transition-colors">
                  Start from Scratch
                </h3>
                <p className="text-white/50 text-sm mb-4">
                  Build your workflow from the ground up using our drag-and-drop
                  editor
                </p>
                <div className="flex items-center justify-center text-green-500 text-sm font-medium">
                  Drag nodes from sidebar
                  <ArrowRight
                    size={16}
                    className="ml-1 group-hover:translate-x-1 transition-transform"
                  />
                </div>
              </div>
            </Card>
          </div>


        </div>
      </div>


    </>
  )
}
