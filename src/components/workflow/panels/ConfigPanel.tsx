'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useReactFlow, type Node } from '@xyflow/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'

// Type for our custom node data
interface CustomNodeData {
  label: string
  nodeType: string
  icon: string
  color: string
  status?: 'idle' | 'running' | 'success' | 'error'
  config?: Record<string, unknown>
}

// State to track which node is being configured (double-clicked)
let configuredNodeId: string | null = null

// Function to set the configured node
export const setConfiguredNode = (nodeId: string | null) => {
  configuredNodeId = nodeId
}

// Function to get the configured node
export const getConfiguredNode = () => configuredNodeId

export function ConfigPanel() {
  const { updateNodeData, getNodes } = useReactFlow()
  const [configuredNode, setConfiguredNodeState] = useState<Node | null>(null)
  
  // Check for configured node changes
  React.useEffect(() => {
    const checkConfiguredNode = () => {
      const nodeId = getConfiguredNode()
      if (nodeId) {
        const nodes = getNodes()
        const node = nodes.find(n => n.id === nodeId)
        setConfiguredNodeState(node || null)
      } else {
        setConfiguredNodeState(null)
      }
    }
    
    // Check immediately and set up polling (simple approach)
    checkConfiguredNode()
    const interval = setInterval(checkConfiguredNode, 100)
    
    return () => clearInterval(interval)
  }, [getNodes])
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const panelRef = useRef<HTMLDivElement>(null)
  
  const handleConfigUpdate = useCallback((selectedNodeId: string, nodeData: CustomNodeData, newConfig: Record<string, unknown>) => {
    updateNodeData(selectedNodeId, {
      ...nodeData,
      config: { ...nodeData.config, ...newConfig }
    })
  }, [updateNodeData])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect()
      setIsDragging(true)
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Add event listeners for drag
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleClose = useCallback(() => {
    // Clear the configured node
    setConfiguredNode(null)
    setConfiguredNodeState(null)
  }, [])
  
  // Only show panel if a node was double-clicked
  if (!configuredNode) {
    return null
  }

  const nodeData = configuredNode.data as unknown as CustomNodeData

  const renderConfigForm = (nodeId: string, nodeData: CustomNodeData, onUpdate: (nodeId: string, nodeData: CustomNodeData, config: Record<string, unknown>) => void) => {
    const updateHandler = (newConfig: Record<string, unknown>) => onUpdate(nodeId, nodeData, newConfig)
    
    switch (nodeData.nodeType) {
      case 'email-trigger':
        return <EmailTriggerConfig config={nodeData.config} onUpdate={updateHandler} />
      case 'trello-action':
        return <TrelloActionConfig config={nodeData.config} onUpdate={updateHandler} />
      case 'asana-action':
        return <AsanaActionConfig config={nodeData.config} onUpdate={updateHandler} />
      case 'condition-logic':
        return <ConditionLogicConfig config={nodeData.config} onUpdate={updateHandler} />
      case 'ai-tagging':
        return <AITaggingConfig config={nodeData.config} onUpdate={updateHandler} />
      case 'ai-classification':
        return <AIClassificationConfig config={nodeData.config} onUpdate={updateHandler} />
      default:
        return <div className="text-gray-400 text-sm">No configuration available for this node type.</div>
    }
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <Card 
        ref={panelRef}
        className="bg-[#2d2d2d] border-[#3d3d3d] w-80 pointer-events-auto shadow-2xl absolute"
        style={{
          left: position.x || '50%',
          top: position.y || '50%',
          transform: position.x || position.y ? 'none' : 'translate(-50%, -50%)',
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        {/* Draggable Header */}
        <div 
          className="flex items-center justify-between p-4 pb-2 cursor-grab active:cursor-grabbing border-b border-[#3d3d3d]"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center">
            <span className="text-lg mr-2">{nodeData.icon}</span>
            <h3 className="text-white font-medium">{nodeData.label}</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-[#3d3d3d]"
            title="Close configuration panel"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-gray-400 text-sm capitalize mb-4">{nodeData.nodeType.replace('-', ' ')} Configuration</p>
          <div className="space-y-4">
            {renderConfigForm(configuredNode.id, nodeData, handleConfigUpdate)}
          </div>
        </div>
      </Card>
    </div>
  )
}

// Email Trigger Configuration Component
interface EmailTriggerConfigProps {
  config?: Record<string, unknown>
  onUpdate: (config: Record<string, unknown>) => void
}

function EmailTriggerConfig({ config = {}, onUpdate }: EmailTriggerConfigProps) {
  const emailFilters = config.emailFilters as { sender?: string; subject?: string; keywords?: string[] } | undefined
  const [sender, setSender] = useState(emailFilters?.sender || '')
  const [subject, setSubject] = useState(emailFilters?.subject || '')
  const [keywords, setKeywords] = useState(emailFilters?.keywords?.join(', ') || '')

  const handleSave = () => {
    onUpdate({
      emailFilters: {
        sender: sender.trim(),
        subject: subject.trim(),
        keywords: keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k)
      }
    })
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="sender" className="text-gray-300 text-sm">Sender Email</Label>
        <Input
          id="sender"
          value={sender}
          onChange={(e) => setSender(e.target.value)}
          placeholder="example@domain.com"
          className="mt-1 bg-[#1d1d1d] border-[#3d3d3d] text-white nodrag h-8"
        />
      </div>
      
      <div>
        <Label htmlFor="subject" className="text-gray-300 text-sm">Subject Contains</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Important, Urgent, etc."
          className="mt-1 bg-[#1d1d1d] border-[#3d3d3d] text-white nodrag h-8"
        />
      </div>
      
      <div>
        <Label htmlFor="keywords" className="text-gray-300 text-sm">Keywords (comma-separated)</Label>
        <Input
          id="keywords"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="task, project, deadline"
          className="mt-1 bg-[#1d1d1d] border-[#3d3d3d] text-white nodrag h-8"
        />
      </div>
      
      <Button 
        onClick={handleSave}
        className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white h-8 text-sm"
      >
        Save Configuration
      </Button>
    </div>
  )
}

// Trello Action Configuration Component
interface TrelloActionConfigProps {
  config?: Record<string, unknown>
  onUpdate: (config: Record<string, unknown>) => void
}

function TrelloActionConfig({ config = {}, onUpdate }: TrelloActionConfigProps) {
  const [boardId, setBoardId] = useState((config.boardId as string) || '')
  const [listId, setListId] = useState((config.listId as string) || '')
  const [cardTitle, setCardTitle] = useState((config.cardTitle as string) || '')

  const handleSave = () => {
    onUpdate({
      boardId: boardId.trim(),
      listId: listId.trim(),
      cardTitle: cardTitle.trim()
    })
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="boardId" className="text-gray-300 text-sm">Trello Board ID</Label>
        <Input
          id="boardId"
          value={boardId}
          onChange={(e) => setBoardId(e.target.value)}
          placeholder="Board ID from Trello"
          className="mt-1 bg-[#1d1d1d] border-[#3d3d3d] text-white nodrag h-8"
        />
      </div>
      
      <div>
        <Label htmlFor="listId" className="text-gray-300 text-sm">List ID</Label>
        <Input
          id="listId"
          value={listId}
          onChange={(e) => setListId(e.target.value)}
          placeholder="List ID from Trello"
          className="mt-1 bg-[#1d1d1d] border-[#3d3d3d] text-white nodrag h-8"
        />
      </div>
      
      <div>
        <Label htmlFor="cardTitle" className="text-gray-300 text-sm">Card Title Template</Label>
        <Input
          id="cardTitle"
          value={cardTitle}
          onChange={(e) => setCardTitle(e.target.value)}
          placeholder="Task: {email.subject}"
          className="mt-1 bg-[#1d1d1d] border-[#3d3d3d] text-white nodrag h-8"
        />
      </div>
      
      <Button 
        onClick={handleSave}
        className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white h-8 text-sm"
      >
        Save Configuration
      </Button>
    </div>
  )
}

// Asana Action Configuration Component
interface AsanaActionConfigProps {
  config?: Record<string, unknown>
  onUpdate: (config: Record<string, unknown>) => void
}

function AsanaActionConfig({ config = {}, onUpdate }: AsanaActionConfigProps) {
  const [projectId, setProjectId] = useState((config.projectId as string) || '')
  const [taskName, setTaskName] = useState((config.taskName as string) || '')

  const handleSave = () => {
    onUpdate({
      projectId: projectId.trim(),
      taskName: taskName.trim()
    })
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="projectId" className="text-gray-300 text-sm">Asana Project ID</Label>
        <Input
          id="projectId"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="Project ID from Asana"
          className="mt-1 bg-[#1d1d1d] border-[#3d3d3d] text-white nodrag h-8"
        />
      </div>
      
      <div>
        <Label htmlFor="taskName" className="text-gray-300 text-sm">Task Name Template</Label>
        <Input
          id="taskName"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="Task: {email.subject}"
          className="mt-1 bg-[#1d1d1d] border-[#3d3d3d] text-white nodrag h-8"
        />
      </div>
      
      <Button 
        onClick={handleSave}
        className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white h-8 text-sm"
      >
        Save Configuration
      </Button>
    </div>
  )
}

// Condition Logic Configuration Component
interface ConditionLogicConfigProps {
  config?: Record<string, unknown>
  onUpdate: (config: Record<string, unknown>) => void
}

function ConditionLogicConfig({ config = {}, onUpdate }: ConditionLogicConfigProps) {
  const [condition, setCondition] = useState((config.condition as string) || '')
  const [operator, setOperator] = useState((config.operator as string) || 'contains')

  const handleSave = () => {
    onUpdate({
      condition: condition.trim(),
      operator
    })
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="condition" className="text-gray-300 text-sm">Condition</Label>
        <Input
          id="condition"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          placeholder="email.subject"
          className="mt-1 bg-[#1d1d1d] border-[#3d3d3d] text-white nodrag h-8"
        />
      </div>
      
      <div>
        <Label htmlFor="operator" className="text-gray-300 text-sm">Operator</Label>
        <select
          id="operator"
          value={operator}
          onChange={(e) => setOperator(e.target.value)}
          className="mt-1 w-full bg-[#1d1d1d] border border-[#3d3d3d] text-white rounded-md px-3 py-1 nodrag h-8 text-sm"
        >
          <option value="contains">Contains</option>
          <option value="equals">Equals</option>
          <option value="startsWith">Starts With</option>
          <option value="endsWith">Ends With</option>
        </select>
      </div>
      
      <Button 
        onClick={handleSave}
        className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white h-8 text-sm"
      >
        Save Configuration
      </Button>
    </div>
  )
}

// AI Tagging Configuration Component
interface AITaggingConfigProps {
  config?: Record<string, unknown>
  onUpdate: (config: Record<string, unknown>) => void
}

function AITaggingConfig({ config = {}, onUpdate }: AITaggingConfigProps) {
  const [tags, setTags] = useState((config.tags as string[])?.join(', ') || '')

  const handleSave = () => {
    onUpdate({
      tags: tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
    })
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="tags" className="text-gray-300 text-sm">Available Tags (comma-separated)</Label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="urgent, important, personal, work"
          className="mt-1 bg-[#1d1d1d] border-[#3d3d3d] text-white nodrag h-8"
        />
      </div>
      
      <Button 
        onClick={handleSave}
        className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white h-8 text-sm"
      >
        Save Configuration
      </Button>
    </div>
  )
}

// AI Classification Configuration Component
interface AIClassificationConfigProps {
  config?: Record<string, unknown>
  onUpdate: (config: Record<string, unknown>) => void
}

function AIClassificationConfig({ config = {}, onUpdate }: AIClassificationConfigProps) {
  const [categories, setCategories] = useState((config.categories as string[])?.join(', ') || '')

  const handleSave = () => {
    onUpdate({
      categories: categories.split(',').map((c: string) => c.trim()).filter((c: string) => c)
    })
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="categories" className="text-gray-300 text-sm">Classification Categories (comma-separated)</Label>
        <Input
          id="categories"
          value={categories}
          onChange={(e) => setCategories(e.target.value)}
          placeholder="support, sales, marketing, technical"
          className="mt-1 bg-[#1d1d1d] border-[#3d3d3d] text-white nodrag h-8"
        />
      </div>
      
      <Button 
        onClick={handleSave}
        className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white h-8 text-sm"
      >
        Save Configuration
      </Button>
    </div>
  )
}