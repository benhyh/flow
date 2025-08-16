'use client'

import React, { useState, useCallback } from 'react'
import { BookOpen, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TemplateGallery } from './TemplateGallery'
import { useTemplates } from './useTemplates'
import { type WorkflowTemplate } from './workflowTemplates'
import { type Node, type Edge } from '@xyflow/react'
import { type WorkflowState } from '../toolbar/WorkflowToolbar'

interface TemplateButtonProps {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: (nodes: Node[]) => void
  onEdgesChange: (edges: Edge[]) => void
  onWorkflowStateChange: (updates: Partial<WorkflowState>) => void
  variant?: 'primary' | 'secondary'
  showLabel?: boolean
  className?: string
}

export function TemplateButton({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onWorkflowStateChange,
  variant = 'secondary',
  showLabel = true,
  className = '',
}: TemplateButtonProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const { loadTemplate, addTemplateToWorkflow } = useTemplates({
    onNodesChange,
    onEdgesChange,
    onWorkflowStateChange,
  })

  const handleTemplateSelect = useCallback(
    (template: WorkflowTemplate) => {
      // If workflow is empty, load template directly
      // If workflow has nodes, ask user if they want to replace or add
      if (nodes.length === 0) {
        loadTemplate(template)
      } else {
        // For now, we'll add to existing workflow
        // In the future, we could show a dialog asking user preference
        addTemplateToWorkflow(template, nodes, edges)
      }
    },
    [loadTemplate, addTemplateToWorkflow, nodes, edges]
  )

  const buttonVariant = variant === 'primary' ? 'default' : 'outline'
  const buttonClass =
    variant === 'primary'
      ? 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white cursor-pointer'
      : 'text-white/50 hover:text-white hover:bg-[#3d3d3d]'

  return (
    <>
      <Button
        variant={buttonVariant}
        size="sm"
        onClick={() => setIsGalleryOpen(true)}
        className={`${buttonClass} ${className}`}
      >
        {variant === 'primary' ? (
          <Plus size={16} className="mr-2" />
        ) : (
          <BookOpen size={16} className="mr-2" />
        )}
        {showLabel &&
          (variant === 'primary' ? 'New from Template' : 'Templates')}
      </Button>

      <TemplateGallery
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </>
  )
}
