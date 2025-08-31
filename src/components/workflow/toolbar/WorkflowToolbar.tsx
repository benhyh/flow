'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Play, 
  Power, 
  Pause,
  FileText,
  Save
} from 'lucide-react'
import { useReactFlow } from '@xyflow/react'


// Workflow state types
export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'testing'

export interface WorkflowState {
  id?: string
  name: string
  status: WorkflowStatus
  isValid: boolean
  validationErrors: string[]
  lastValidation?: unknown // ValidationResult type - using unknown to avoid circular imports
}

interface WorkflowToolbarProps {
  workflowState: WorkflowState
  onWorkflowStateChange: (state: Partial<WorkflowState>) => void
  onRunTest: () => void
  onSave: () => void
  onToggleStatus: () => void
  onManageWorkflows: () => void
}

export function WorkflowToolbar({
  workflowState,
  onWorkflowStateChange,
  onRunTest,
  onSave,
  onToggleStatus,
  onManageWorkflows
}: WorkflowToolbarProps) {
  const { getNodes, getEdges } = useReactFlow()
  const [isNameEditing, setIsNameEditing] = useState(false)
  const [tempName, setTempName] = useState(workflowState.name)

  // Handle name editing
  const handleNameEdit = useCallback(() => {
    setTempName(workflowState.name)
    setIsNameEditing(true)
  }, [workflowState.name])

  const handleNameSave = useCallback(() => {
    if (tempName.trim()) {
      onWorkflowStateChange({ name: tempName.trim() })
    }
    setIsNameEditing(false)
  }, [tempName, onWorkflowStateChange])

  const handleNameCancel = useCallback(() => {
    setTempName(workflowState.name)
    setIsNameEditing(false)
  }, [workflowState.name])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave()
    } else if (e.key === 'Escape') {
      handleNameCancel()
    }
  }, [handleNameSave, handleNameCancel])

  // Validate workflow before actions
  const validateWorkflow = useCallback((): { isValid: boolean; errors: string[] } => {
    const nodes = getNodes()
    const edges = getEdges()
    const errors: string[] = []

    // Check if workflow has nodes
    if (nodes.length === 0) {
      errors.push('Workflow must have at least one node')
    }

    // Check if workflow has a trigger
    const hasTrigger = nodes.some(node => 
      node.type === 'trigger' || 
      (node.data as Record<string, unknown>)?.nodeType?.toString().includes('trigger')
    )
    if (!hasTrigger && nodes.length > 0) {
      errors.push('Workflow must have at least one trigger node')
    }

    // Check if workflow has an action
    const hasAction = nodes.some(node => 
      node.type === 'action' || 
      (node.data as Record<string, unknown>)?.nodeType?.toString().includes('action')
    )
    if (!hasAction && nodes.length > 0) {
      errors.push('Workflow must have at least one action node')
    }

    // Check for disconnected nodes (nodes with no connections)
    if (nodes.length > 1) {
      const connectedNodeIds = new Set([
        ...edges.map(e => e.source),
        ...edges.map(e => e.target)
      ])
      
      const disconnectedNodes = nodes.filter(node => !connectedNodeIds.has(node.id))
      if (disconnectedNodes.length > 0) {
        errors.push(`${disconnectedNodes.length} node(s) are not connected to the workflow`)
      }
    }

    // Check for nodes without configuration
    const unconfiguredNodes = nodes.filter(node => {
      const nodeData = node.data as Record<string, unknown>
      const config = nodeData?.config as Record<string, unknown> | undefined
      return !config || Object.keys(config).length === 0
    })
    if (unconfiguredNodes.length > 0) {
      errors.push(`${unconfiguredNodes.length} node(s) need configuration`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }, [getNodes, getEdges])

  // Handle test run
  const handleRunTest = useCallback(() => {
    const validation = validateWorkflow()
    onWorkflowStateChange({ 
      isValid: validation.isValid, 
      validationErrors: validation.errors 
    })
    
    // Always call onRunTest for testing - let the execution manager handle validation
    // This makes the button behave the same as the keyboard shortcut
    onRunTest()
  }, [validateWorkflow, onWorkflowStateChange, onRunTest])

  // Handle save
  const handleSave = useCallback(() => {
    const validation = validateWorkflow()
    onWorkflowStateChange({ 
      isValid: validation.isValid, 
      validationErrors: validation.errors
    })
    onSave()
  }, [validateWorkflow, onWorkflowStateChange, onSave])

  // Handle status toggle
  const handleToggleStatus = useCallback(() => {
    const validation = validateWorkflow()
    
    if (workflowState.status === 'draft' && !validation.isValid) {
      onWorkflowStateChange({ 
        isValid: validation.isValid, 
        validationErrors: validation.errors 
      })
      return
    }
    
    onToggleStatus()
  }, [validateWorkflow, workflowState.status, onWorkflowStateChange, onToggleStatus])

  const canActivate = workflowState.status === 'draft' || workflowState.status === 'paused'



  return (
    <div className="bg-[#2d2d2d] px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Workflow name and buttons */}
        <div className="flex items-center gap-2">
          {/* Workflow name */}
          <div className="flex items-center gap-2">
            {isNameEditing ? (
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={handleKeyPress}
                className="bg-[#1d1d1d] text-white h-8 w-48 text-sm"
                autoFocus
              />
            ) : (
              <h1 
                className="text-white font-medium text-lg cursor-pointer hover:text-[#8b5cf6] transition-colors"
                onClick={handleNameEdit}
                title="Click to edit workflow name"
              >
                {workflowState.name || 'Untitled Workflow'}
              </h1>
            )}
          </div>
          
          {/* Management buttons inline with title */}
          <div className="flex items-center">
            <Button
              onClick={onManageWorkflows}
              variant="ghost"
              className="h-8 px-2 text-white hover:text-[#8b5cf6] hover:bg-transparent cursor-pointer"
              title="Manage Workflows"
            >
              <FileText size={16}/>
            </Button>
            <Button
              onClick={handleSave}
              variant="ghost"
              className="h-8 px-2 text-white hover:text-[#8b5cf6] hover:bg-transparent cursor-pointer"
              title="Save Workflow"
            >
              <Save size={16} />
            </Button>
          </div>
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-2">
          {/* Run Test button */}
          <Button
            onClick={handleRunTest}
            disabled={workflowState.status === 'testing'}
            className="bg-[#3d3d3d] hover:bg-[#3d3d3d]/80 text-white h-8 px-3 text-sm cursor-pointer"
          >
            <Play size={14} className="mr-1" />
            {workflowState.status === 'testing' ? 'Testing...' : 'Run Test'}
          </Button>

          {/* Enable/Disable toggle */}
          <Button
            onClick={handleToggleStatus}
            disabled={workflowState.status === 'testing' || (!workflowState.isValid && canActivate)}
            className={`h-8 px-3 text-sm ${
              canActivate 
                ? 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white' 
                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
            }`}
          >
            {canActivate ? (
              <>
                <Power size={14} className="mr-1" />
                Activate
              </>
            ) : (
              <>
                <Pause size={14} className="mr-1" />
                Pause
              </>
            )}
          </Button>
        </div>
      </div>


    </div>
  )
}