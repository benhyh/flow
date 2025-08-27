'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useReactFlow, type Node } from '@xyflow/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, RotateCcw } from 'lucide-react'
import { useTrelloIntegration } from '../hooks/useTrelloIntegration'
import { useAsanaIntegration } from '../hooks/useAsanaIntegration'
import { type TrelloList, getTrelloTokenFromStorage } from '@/lib/trello-api'
import { getAsanaTokensFromStorage } from '@/lib/asana-api'
import { toast } from 'sonner'

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
        return <EmailTriggerConfig config={nodeData.config} onUpdate={updateHandler} onClose={handleClose} />
      case 'trello-action':
        return <TrelloActionConfig config={nodeData.config} onUpdate={updateHandler} onClose={handleClose} />
      case 'asana-action':
        return <AsanaActionConfig config={nodeData.config} onUpdate={updateHandler} onClose={handleClose} />
      case 'condition-logic':
        return <ConditionLogicConfig config={nodeData.config} onUpdate={updateHandler} onClose={handleClose} />
      case 'ai-tagging':
        return <AITaggingConfig config={nodeData.config} onUpdate={updateHandler} onClose={handleClose} />
      case 'ai-classification':
        return <AIClassificationConfig config={nodeData.config} onUpdate={updateHandler} onClose={handleClose} />
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
  onClose: () => void
}

function EmailTriggerConfig({ config = {}, onUpdate, onClose }: EmailTriggerConfigProps) {
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
    onClose() // Close the panel after saving
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
  onClose: () => void
}

function TrelloActionConfig({ config = {}, onUpdate, onClose }: TrelloActionConfigProps) {
  const { hasTrelloAccess } = useTrelloIntegration()
  
  // Form state
  const [boardId, setBoardId] = useState((config.boardId as string) || '')
  const [selectedListId, setSelectedListId] = useState((config.listId as string) || '')
  const [cardTitle, setCardTitle] = useState((config.cardTitle as string) || '')
  
  // Step tracking - if we have existing config data, start at lists step
  const [step, setStep] = useState<'board' | 'lists'>(
    (config.boardId && config.listId) ? 'lists' : 'board'
  )
  
  // Lists state
  const [lists, setLists] = useState<TrelloList[]>([])
  const [isLoadingLists, setIsLoadingLists] = useState(false)
  const [boardIdError, setBoardIdError] = useState('')

  // If we have existing config, auto-load the lists
  React.useEffect(() => {
    if (config.boardId && config.listId && step === 'lists' && lists.length === 0) {
      fetchTrelloListsForExistingConfig()
    }
  }, [config.boardId, config.listId, step])

  const fetchTrelloListsForExistingConfig = async () => {
    if (!boardId.trim() || !hasTrelloAccess) return

    setIsLoadingLists(true)
    try {
      const token = getTrelloTokenFromStorage()
      if (!token) return

      const response = await fetch(`/api/trello/boards/${boardId.trim()}/lists`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const fetchedLists = await response.json()
        setLists(fetchedLists)
      }
    } catch (error) {
      console.error('Error loading existing board lists:', error)
    } finally {
      setIsLoadingLists(false)
    }
  }

  // Trello Board ID validation regex from documentation
  const TRELLO_ID_PATTERN = /^[0-9a-fA-F]{24}$/

  const validateBoardId = (id: string): boolean => {
    return TRELLO_ID_PATTERN.test(id)
  }

  const handleBoardIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setBoardId(value)
    
    if (value && !validateBoardId(value)) {
      setBoardIdError('Please provide a valid Trello Board ID')
    } else {
      setBoardIdError('')
    }
  }

  const fetchTrelloLists = async () => {
    if (!boardId.trim() || !validateBoardId(boardId.trim())) {
      setBoardIdError('Please provide a valid Trello Board ID')
      return
    }

    if (!hasTrelloAccess) {
      toast.error('Trello Authorization Required', {
        description: 'Please authorize Trello integration first.',
        duration: 5000
      })
      return
    }

    setIsLoadingLists(true)
    setBoardIdError('')

    try {
      // Get the Trello token from storage
      const token = getTrelloTokenFromStorage()
      if (!token) {
        throw new Error('Trello token not found. Please authorize Trello first.')
      }

      // Use the Trello API to fetch board lists
      const response = await fetch(`/api/trello/boards/${boardId.trim()}/lists`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch board lists: ${response.status} ${response.statusText}`)
      }

      const fetchedLists = await response.json()
      setLists(fetchedLists)
      setStep('lists')
      toast.success('Board lists loaded successfully!', {
        description: `Found ${fetchedLists.length} lists in the board.`,
        duration: 3000
      })
    } catch (error) {
      console.error('Error fetching Trello lists:', error)
      setBoardIdError('Failed to fetch board lists. Please check the Board ID and try again.')
      toast.error('Failed to fetch board lists', {
        description: 'Please check your Board ID and ensure you have access to this board.',
        duration: 5000
      })
    } finally {
      setIsLoadingLists(false)
    }
  }

  const handleReset = () => {
    setBoardId('')
    setSelectedListId('')
    setCardTitle('')
    setLists([])
    setBoardIdError('')
    setStep('board')
  }

  const handleSave = () => {
    if (!boardId.trim() || !validateBoardId(boardId.trim())) {
      setBoardIdError('Please provide a valid Trello Board ID')
      return
    }
    
    if (!selectedListId.trim()) {
      toast.error('Please select a list for the card')
      return
    }
    
    if (!cardTitle.trim()) {
      toast.error('Please provide a card title')
      return
    }

    onUpdate({
      boardId: boardId.trim(),
      listId: selectedListId.trim(),
      cardTitle: cardTitle.trim()
    })
    onClose()
  }

  return (
    <div className="space-y-4">
      {/* Step 1: Board ID Input */}
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="boardId" className="text-gray-300 text-sm">
            Trello Board ID <span className="text-red-400">*</span>
          </Label>
          {step === 'lists' && (
            <button
              onClick={handleReset}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-[#3d3d3d]"
              title="Reset configuration"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
        <Input
          id="boardId"
          value={boardId}
          onChange={handleBoardIdChange}
          placeholder="e.g., 6MsO0uNG"
          className={`mt-1 bg-[#1d1d1d] border-[#3d3d3d] text-white nodrag h-8 ${
            boardIdError ? 'border-red-500' : ''
          }`}
          disabled={step === 'lists'}
        />
        <p className="text-xs text-gray-500 mt-1">
          Find this in your Trello board URL: trello.com/b/<strong>BOARD_ID</strong>/board-name
        </p>
        {boardIdError && (
          <p className="text-xs text-red-400 mt-1">{boardIdError}</p>
        )}
      </div>

      {/* Fetch Lists Button */}
      {step === 'board' && (
        <Button 
          onClick={fetchTrelloLists}
          disabled={!boardId.trim() || !validateBoardId(boardId.trim()) || isLoadingLists}
          className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white h-8 text-sm disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isLoadingLists ? 'Fetching Lists...' : 'Fetch Trello Lists'}
        </Button>
      )}

      {/* Step 2: List Selection and Card Title (shown after successful fetch) */}
      {step === 'lists' && (
        <>
          <div>
            <Label htmlFor="listSelect" className="text-gray-300 text-sm">
              Select List <span className="text-red-400">*</span>
            </Label>
            <select
              id="listSelect"
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="mt-1 w-full bg-[#1d1d1d] border border-[#3d3d3d] text-white rounded-md px-3 py-2 nodrag h-8 text-sm"
            >
              <option value="">Select a list...</option>
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Choose which list to create the card in
            </p>
          </div>

          <div>
            <Label htmlFor="cardTitle" className="text-gray-300 text-sm">
              Card Title <span className="text-red-400">*</span>
            </Label>
            <Input
              id="cardTitle"
              value={cardTitle}
              onChange={(e) => setCardTitle(e.target.value)}
              placeholder="e.g., Task: {email.subject}"
              className="mt-1 bg-[#1d1d1d] border-[#3d3d3d] text-white nodrag h-8"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use variables like {"{email.subject}"} or {"{email.sender}"}
            </p>
          </div>

          <Button 
            onClick={handleSave}
            disabled={!selectedListId.trim() || !cardTitle.trim()}
            className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white h-8 text-sm disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Save Configuration
          </Button>

          {(!selectedListId.trim() || !cardTitle.trim()) && (
            <p className="text-xs text-red-400 text-center">
              List selection and Card Title are required
            </p>
          )}
        </>
      )}
    </div>
  )
}

// Asana Action Configuration Component
interface AsanaActionConfigProps {
  config?: Record<string, unknown>
  onUpdate: (config: Record<string, unknown>) => void
  onClose: () => void
}

function AsanaActionConfig({ config = {}, onUpdate, onClose }: AsanaActionConfigProps) {
  const { hasAsanaAccess } = useAsanaIntegration()
  
  // Form state - simple like Trello
  const [selectedProjectId, setSelectedProjectId] = useState((config.projectId as string) || '')
  const [taskName, setTaskName] = useState((config.taskName as string) || '')
  
  // Projects state
  const [projects, setProjects] = useState<Array<{ gid: string; name: string }>>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [error, setError] = useState('')

  // Define fetchProjects first
  const fetchProjects = React.useCallback(async () => {
    if (!hasAsanaAccess) return

    setIsLoadingProjects(true)
    setError('')

    try {
      const tokens = getAsanaTokensFromStorage()
      if (!tokens) {
        setError('Please re-authorize Asana')
        return
      }

      // Fetch all projects across all workspaces
      const response = await fetch('/api/asana/projects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.accessToken}`
        }
      })

      if (response.ok) {
        const fetchedProjects = await response.json()
        setProjects(fetchedProjects)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch projects')
      }
    } catch (error) {
      console.error('Error fetching Asana projects:', error)
      setError('Failed to load projects')
    } finally {
      setIsLoadingProjects(false)
    }
  }, [hasAsanaAccess])

  // Load projects on mount if authenticated
  React.useEffect(() => {
    if (hasAsanaAccess) {
      fetchProjects()
    }
  }, [hasAsanaAccess, fetchProjects])

  // Listen for auth updates
  React.useEffect(() => {
    const handleAuthUpdate = () => {
      if (hasAsanaAccess) {
        fetchProjects()
      }
    }

    window.addEventListener('asana-auth-updated', handleAuthUpdate)
    return () => window.removeEventListener('asana-auth-updated', handleAuthUpdate)
  }, [hasAsanaAccess, fetchProjects])

  const handleSave = () => {
    const configData = {
      projectId: selectedProjectId.trim(),
      taskName: taskName.trim()
    }

    onUpdate(configData)
    onClose()
  }

  const canSave = taskName.trim() // Project is optional

  return (
    <div className="space-y-3">
      {/* Project Selection - Optional */}
      <div>
        <Label htmlFor="projectSelect" className="text-gray-300 text-sm">
          Asana Project (Optional)
        </Label>
        <p className="text-xs text-gray-400 mt-1">
          Leave empty to create task in main dashboard
        </p>
        
        {error && (
          <div className="p-2 bg-red-900/20 border border-red-500/20 rounded mt-1">
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        {isLoadingProjects ? (
          <div className="mt-1 p-2 bg-[#1d1d1d] border border-[#3d3d3d] rounded text-gray-400 text-sm">
            Loading projects...
          </div>
        ) : (
          <select
            id="projectSelect"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="mt-1 w-full bg-[#1d1d1d] border border-[#3d3d3d] text-white nodrag h-8 text-sm rounded px-2"
          >
            <option value="">No project (create in dashboard)</option>
            {projects.map((project) => (
              <option key={project.gid} value={project.gid}>
                {project.name}
              </option>
            ))}
          </select>
        )}
      </div>
      
      {/* Task Name - Required */}
      <div>
        <Label htmlFor="taskName" className="text-gray-300 text-sm">Task Name Template *</Label>
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
        disabled={!canSave}
        className="w-full bg-[#f06a6a] hover:bg-[#e55a5a] text-white h-8 text-sm"
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
  onClose: () => void
}

function ConditionLogicConfig({ config = {}, onUpdate, onClose }: ConditionLogicConfigProps) {
  const [condition, setCondition] = useState((config.condition as string) || '')
  const [operator, setOperator] = useState((config.operator as string) || 'contains')

  const handleSave = () => {
    onUpdate({
      condition: condition.trim(),
      operator
    })
    onClose() // Close the panel after saving
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
  onClose: () => void
}

function AITaggingConfig({ config = {}, onUpdate, onClose }: AITaggingConfigProps) {
  const [tags, setTags] = useState((config.tags as string[])?.join(', ') || '')

  const handleSave = () => {
    onUpdate({
      tags: tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
    })
    onClose() // Close the panel after saving
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
  onClose: () => void
}

function AIClassificationConfig({ config = {}, onUpdate, onClose }: AIClassificationConfigProps) {
  const [categories, setCategories] = useState((config.categories as string[])?.join(', ') || '')

  const handleSave = () => {
    onUpdate({
      categories: categories.split(',').map((c: string) => c.trim()).filter((c: string) => c)
    })
    onClose() // Close the panel after saving
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