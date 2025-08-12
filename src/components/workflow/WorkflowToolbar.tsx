'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Play, 
  Save, 
  Power, 
  PowerOff, 
  Pause, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useReactFlow, type Node, type Edge } from '@xyflow/react'
import { TemplateButton } from './templates/TemplateButton'

// Workflow state types
export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'testing'

export interface WorkflowState {
  id?: string
  name: string
  status: WorkflowStatus
  lastSaved?: Date
  lastRun?: Date
  isValid: boolean
  validationErrors: string[]
}

interface WorkflowToolbarProps {
  workflowState: WorkflowState
  onWorkflowStateChange: (state: Partial<WorkflowState>) => void
  onRunTest: () => void
  onSave: () => void
  onToggleStatus: () => void
  // Template integration props
  nodes?: Node[]
  edges?: Edge[]
  onNodesChange?: (nodes: Node[]) => void
  onEdgesChange?: (edges: Edge[]) => void
}

export function WorkflowToolbar({
  workflowState,
  onWorkflowStateChange,
  onRunTest,
  onSave,
  onToggleStatus,
  nodes = [],
  edges = [],
  onNodesChange,
  onEdgesChange
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
    
    if (validation.isValid) {
      onRunTest()
    }
  }, [validateWorkflow, onWorkflowStateChange, onRunTest])

  // Handle save
  const handleSave = useCallback(() => {
    const validation = validateWorkflow()
    onWorkflowStateChange({ 
      isValid: validation.isValid, 
      validationErrors: validation.errors,
      lastSaved: new Date()
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

  // Get status display info
  const getStatusInfo = () => {
    switch (workflowState.status) {
      case 'active':
        return {
          icon: <Power size={16} className="text-green-500" />,
          text: 'Active',
          color: 'text-green-500'
        }
      case 'paused':
        return {
          icon: <Pause size={16} className="text-yellow-500" />,
          text: 'Paused',
          color: 'text-yellow-500'
        }
      case 'testing':
        return {
          icon: <Clock size={16} className="text-blue-500" />,
          text: 'Testing',
          color: 'text-blue-500'
        }
      default:
        return {
          icon: <PowerOff size={16} className="text-white/20" />,
          text: 'Draft',
          color: 'text-white/20'
        }
    }
  }

  const statusInfo = getStatusInfo()
  const canActivate = workflowState.status === 'draft' || workflowState.status === 'paused'

  return (
    <div className="bg-[#2d2d2d] px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Workflow name and status */}
        <div className="flex items-center gap-4">
          {/* Workflow name */}
          <div className="flex items-center gap-2">
            {isNameEditing ? (
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={handleKeyPress}
                className="bg-[#1d1d1d] border-[#3d3d3d] text-white h-8 w-48 text-sm"
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

          {/* Status indicator */}
          <div className="flex items-center gap-2">
            {statusInfo.icon}
            <span className={`text-sm text-white/20 font-medium`}>
              {statusInfo.text}
            </span>
          </div>

          {/* Validation status */}
          {!workflowState.isValid && workflowState.validationErrors.length > 0 && (
            <div className="flex items-center gap-1 text-red-400" title={workflowState.validationErrors.join(', ')}>
              <AlertTriangle size={16} />
              <span className="text-sm">{workflowState.validationErrors.length} issue(s)</span>
            </div>
          )}

          {workflowState.isValid && workflowState.status !== 'draft' && (
            <div className="flex items-center gap-1 text-green-400">
              <CheckCircle size={16} />
              <span className="text-sm">Valid</span>
            </div>
          )}
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-2">
          {/* Template button */}
          {onNodesChange && onEdgesChange && (
            <TemplateButton
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onWorkflowStateChange={onWorkflowStateChange}
              variant="secondary"
              showLabel={true}
              className="h-8"
            />
          )}

          {/* Run Test button */}
          <Button
            onClick={handleRunTest}
            disabled={workflowState.status === 'testing'}
            className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white h-8 px-3 text-sm cursor-pointer"
          >
            <Play size={14} className="mr-1" />
            {workflowState.status === 'testing' ? 'Testing...' : 'Run Test'}
          </Button>

          {/* Save button */}
          <Button
            onClick={handleSave}
            className=" text-white hover:bg-[#3d3d3d]/80 bg-[#3d3d3d] h-8 px-3 text-sm cursor-pointer"
          >
            <Save size={14} className="mr-1" />
            Save
          </Button>

          {/* Enable/Disable toggle */}
          <Button
            onClick={handleToggleStatus}
            disabled={workflowState.status === 'testing' || (!workflowState.isValid && canActivate)}
            className={`h-8 px-3 text-sm ${
              canActivate 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
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

      {/* Last saved/run info */}
      {(workflowState.lastSaved || workflowState.lastRun) && (
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
          {workflowState.lastSaved && (
            <span>Last saved: {workflowState.lastSaved.toLocaleTimeString()}</span>
          )}
          {workflowState.lastRun && (
            <span>Last run: {workflowState.lastRun.toLocaleTimeString()}</span>
          )}
        </div>
      )}
    </div>
  )
}