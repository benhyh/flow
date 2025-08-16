'use client'

import React, { useState } from 'react'
import { Zap, BookOpen, Plus, ArrowRight } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { TemplateGallery } from '../templates/TemplateGallery'
import {
  getFeaturedTemplates,
  type WorkflowTemplate,
} from '../templates/workflowTemplates'
import { useTemplates } from '../templates/useTemplates'
import { type Node, type Edge } from '@xyflow/react'

interface EmptyCanvasWelcomeProps {
  onNodesChange: (nodes: Node[]) => void
  onEdgesChange: (edges: Edge[]) => void
  onWorkflowStateChange: (updates: Record<string, unknown>) => void
  className?: string
}

export function EmptyCanvasWelcome({
  onNodesChange,
  onEdgesChange,
  onWorkflowStateChange,
  className = '',
}: EmptyCanvasWelcomeProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const { loadTemplate } = useTemplates({
    onNodesChange,
    onEdgesChange,
    onWorkflowStateChange,
  })

  const featuredTemplates = getFeaturedTemplates().slice(0, 3) // Show top 3 featured

  const handleTemplateSelect = (template: WorkflowTemplate) => {
    loadTemplate(template)
    setIsGalleryOpen(false)
  }

  const handleQuickTemplate = (template: WorkflowTemplate) => {
    loadTemplate(template)
  }

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Start from Template */}
            <Card className="bg-[#2d2d2d] hover:bg-[#3d3d3d] transition-all duration-200 cursor-pointer group p-6">
              <div onClick={() => setIsGalleryOpen(true)}>
                <div className="flex items-center justify-center w-12 h-12 bg-[#8b5cf6]/20 rounded-lg mb-4 mx-auto group-hover:bg-[#8b5cf6]/30 transition-colors">
                  <BookOpen size={24} className="text-[#8b5cf6]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#8b5cf6] transition-colors">
                  Start from Template
                </h3>
                <p className="text-white/50 text-sm mb-4">
                  Choose from pre-built workflows and customize them to your
                  needs
                </p>
                <div className="flex items-center justify-center text-[#8b5cf6] text-sm font-medium">
                  Browse Templates
                  <ArrowRight
                    size={16}
                    className="ml-1 group-hover:translate-x-1 transition-transform"
                  />
                </div>
              </div>
            </Card>

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

          {/* Featured Templates Quick Access */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">
              Popular Templates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {featuredTemplates.map(template => (
                <Card
                  key={template.id}
                  className="bg-[#2d2d2d] hover:bg-[#3d3d3d] transition-all duration-200 cursor-pointer group p-4"
                  onClick={() => handleQuickTemplate(template)}
                >
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">{template.icon}</span>
                    <h4 className="font-medium text-white text-sm group-hover:text-[#8b5cf6] transition-colors">
                      {template.name}
                    </h4>
                  </div>
                  <p className="text-xs text-white/50 mb-2 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{template.estimatedSetupTime}</span>
                    <span className="text-[#8b5cf6]">
                      {template.difficulty}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Template Gallery Modal */}
      <TemplateGallery
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </>
  )
}
