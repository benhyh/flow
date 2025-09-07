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
import { validateEmail } from '@/lib/utils'
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
  const [senderError, setSenderError] = useState('')

  // Handle sender email change with validation
  const handleSenderChange = (value: string) => {
    setSender(value)
    if (value.trim() && !validateEmail(value)) {
      setSenderError('Please enter a valid email address')
    } else {
      setSenderError('')
    }
  }

  const handleSave = () => {
    // Validate email before saving
    if (sender.trim() && !validateEmail(sender)) {
      setSenderError('Please enter a valid email address')
      return
    }

    // Check if at least one filter is provided
    const hasFilters = sender.trim() || subject.trim() || keywords.split(',').some((k: string) => k.trim())
    if (!hasFilters) {
      toast.error('At least one filter is required', {
        description: 'Please provide a sender email, subject, or keywords'
      })
      return
    }

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
      <div className="mb-2">
        <p className="text-xs text-gray-400">
          Configure at least one filter to trigger the workflow
        </p>
      </div>
      
      <div>
        <Label htmlFor="sender" className="text-gray-300 text-sm">Sender Email</Label>
        <Input
          id="sender"
          value={sender}
          onChange={(e) => handleSenderChange(e.target.value)}
          placeholder="example@domain.com"
          className={`mt-1 bg-[#1d1d1d] border-[#3d3d3d] text-white nodrag h-8 ${
            senderError ? 'border-red-500' : ''
          }`}
        />
        {senderError && (
          <p className="text-red-400 text-xs mt-1">{senderError}</p>
        )}
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
        <p className="text-xs text-gray-500 mt-1">Optional: Filter emails by subject line</p>
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
        <p className="text-xs text-gray-500 mt-1">Optional: Filter emails containing these keywords</p>
      </div>
      
      <Button 
        onClick={handleSave}
        disabled={!!senderError}
        className={`w-full h-8 text-sm ${
          senderError 
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
            : 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white'
        }`}
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
  const [field, setField] = useState((config.field as string) || 'email.subject')
  const [operator, setOperator] = useState((config.operator as string) || 'contains')
  const [value, setValue] = useState((config.value as string) || '')

  // Available fields for condition checking
  const availableFields = [
    { value: 'email.subject', label: 'Email Subject' },
    { value: 'email.body', label: 'Email Body' },
    { value: 'email.sender', label: 'Email Sender' },
    { value: 'email.to', label: 'Email To' },
    { value: 'trigger.data', label: 'Trigger Data' },
  ]

  // Available operators
  const operators = [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'startsWith', label: 'Starts With' },
    { value: 'endsWith', label: 'Ends With' },
  ]

  const handleSave = () => {
    if (!value.trim()) {
      toast.error('Please enter a value to check against')
      return
    }

    onUpdate({
      field: field.trim(),
      operator,
      value: value.trim()
    })
    onClose() // Close the panel after saving
    toast.success('Logic condition configured successfully!')
  }

  // Generate preview text
  const getPreviewText = () => {
    if (!value.trim()) return 'Enter a value to see preview'
    const fieldLabel = availableFields.find(f => f.value === field)?.label || field
    const operatorLabel = operators.find(o => o.value === operator)?.label || operator
    return `If "${fieldLabel}" ${operatorLabel.toLowerCase()} "${value}"`
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="field" className="text-gray-300 text-sm">Field to Check</Label>
        <select
          id="field"
          value={field}
          onChange={(e) => setField(e.target.value)}
          className="mt-1 w-full bg-[#1d1d1d] border border-[#3d3d3d] text-white rounded-md px-3 py-2 nodrag h-9 text-sm"
        >
          {availableFields.map((fieldOption) => (
            <option key={fieldOption.value} value={fieldOption.value}>
              {fieldOption.label}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <Label htmlFor="operator" className="text-gray-300 text-sm">Condition</Label>
        <select
          id="operator"
          value={operator}
          onChange={(e) => setOperator(e.target.value)}
          className="mt-1 w-full bg-[#1d1d1d] border border-[#3d3d3d] text-white rounded-md px-3 py-2 nodrag h-9 text-sm"
        >
          {operators.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="value" className="text-gray-300 text-sm">Value</Label>
        <Input
          id="value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter value to check for..."
          className="mt-1 bg-[#1d1d1d] border-[#3d3d3d] text-white nodrag h-9"
        />
      </div>

      {/* Preview */}
      <div className="p-3 bg-[#1a1a1a] border border-[#3d3d3d] rounded-md">
        <Label className="text-gray-400 text-xs">Preview</Label>
        <div className="text-sm text-gray-300 mt-1">
          {getPreviewText()}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          → True path (green) | → False path (red)
        </div>
      </div>
      
      <Button 
        onClick={handleSave}
        className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white h-9 text-sm"
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
  const [selectedTags, setSelectedTags] = useState<string[]>((config.selectedTags as string[]) || [])
  const [tagKeywords, setTagKeywords] = useState<Record<string, string>>((config.tagKeywords as Record<string, string>) || {})
  const [targetType, setTargetType] = useState<string>((config.targetType as string) || 'both')

  // Pre-defined tag library organized by category
  const tagLibrary = {
    priority: [
      { name: 'urgent', label: 'Urgent', keywords: 'urgent, asap, emergency, critical, immediate' },
      { name: 'normal', label: 'Normal', keywords: 'normal, regular, standard' },
      { name: 'low', label: 'Low Priority', keywords: 'low, later, whenever' }
    ],
    department: [
      { name: 'support', label: 'Support', keywords: 'support, help, issue, problem, bug' },
      { name: 'sales', label: 'Sales', keywords: 'sales, purchase, buy, pricing, quote' },
      { name: 'marketing', label: 'Marketing', keywords: 'marketing, campaign, newsletter, promotion' },
      { name: 'technical', label: 'Technical', keywords: 'technical, api, integration, development' }
    ],
    type: [
      { name: 'question', label: 'Question', keywords: 'question, how, what, why, when, where' },
      { name: 'complaint', label: 'Complaint', keywords: 'complaint, unhappy, dissatisfied, terrible' },
      { name: 'request', label: 'Request', keywords: 'request, please, could you, need' },
      { name: 'feedback', label: 'Feedback', keywords: 'feedback, suggestion, improve, better' }
    ]
  }

  const allTags = [
    ...tagLibrary.priority,
    ...tagLibrary.department,
    ...tagLibrary.type
  ]

  const handleTagToggle = (tagName: string) => {
    const newSelectedTags = selectedTags.includes(tagName)
      ? selectedTags.filter(t => t !== tagName)
      : [...selectedTags, tagName]
    
    setSelectedTags(newSelectedTags)

    // Set default keywords if not already set
    if (!selectedTags.includes(tagName) && !tagKeywords[tagName]) {
      const tag = allTags.find(t => t.name === tagName)
      if (tag) {
        setTagKeywords(prev => ({ ...prev, [tagName]: tag.keywords }))
      }
    }
  }

  const handleKeywordChange = (tagName: string, keywords: string) => {
    setTagKeywords(prev => ({ ...prev, [tagName]: keywords }))
  }

  const handleSave = () => {
    if (selectedTags.length === 0) {
      toast.error('Please select at least one tag')
      return
    }

    // Validate that all selected tags have keywords
    const missingKeywords = selectedTags.filter(tag => !tagKeywords[tag]?.trim())
    if (missingKeywords.length > 0) {
      toast.error(`Please set keywords for: ${missingKeywords.join(', ')}`)
      return
    }

    onUpdate({
      selectedTags,
      tagKeywords,
      targetType
    })
    onClose()
    toast.success('AI tagging configured successfully!')
  }

  const renderTagCategory = (categoryName: string, tags: typeof tagLibrary.priority) => (
    <div key={categoryName} className="space-y-2">
      <Label className="text-gray-400 text-xs uppercase">{categoryName}</Label>
      <div className="grid grid-cols-2 gap-2">
        {tags.map((tag) => (
          <label
            key={tag.name}
            className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${
              selectedTags.includes(tag.name)
                ? 'border-[#8b5cf6] bg-[#8b5cf6]/10'
                : 'border-[#3d3d3d] hover:border-[#5d5d5d]'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedTags.includes(tag.name)}
              onChange={() => handleTagToggle(tag.name)}
              className="w-4 h-4 text-[#8b5cf6] bg-[#1d1d1d] border-[#3d3d3d] rounded focus:ring-[#8b5cf6]"
            />
            <span className="text-sm text-gray-300">{tag.label}</span>
          </label>
        ))}
      </div>
    </div>
  )

  // Get formatted preview based on target type
  const getTargetPreview = () => {
    if (selectedTags.length === 0) return 'No tags selected'
    
    switch (targetType) {
      case 'trello':
        return `Trello Labels: ${selectedTags.map(tag => `[${tag}]`).join(' ')}`
      case 'asana':
        return `Asana Custom Fields: ${selectedTags.map(tag => `${tag}=true`).join(', ')}`
      case 'both':
        return `Both Systems: ${selectedTags.join(', ')}`
      default:
        return selectedTags.join(', ')
    }
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {/* Target Type Selection */}
      <div>
        <Label className="text-gray-300 text-sm">Target Action Type</Label>
        <select
          value={targetType}
          onChange={(e) => setTargetType(e.target.value)}
          className="mt-1 w-full bg-[#1d1d1d] border border-[#3d3d3d] text-white rounded-md px-3 py-2 nodrag h-9 text-sm"
        >
          <option value="both">Both (Trello & Asana)</option>
          <option value="trello">Trello Only</option>
          <option value="asana">Asana Only</option>
        </select>
        <div className="text-xs text-gray-500 mt-1">
          {targetType === 'trello' && 'Tags will be converted to Trello labels'}
          {targetType === 'asana' && 'Tags will be stored as Asana custom fields'}
          {targetType === 'both' && 'Tags will be formatted for both systems'}
        </div>
      </div>

      <div>
        <Label className="text-gray-300 text-sm">Select Tags to Apply</Label>
        <div className="mt-2 space-y-4">
          {Object.entries(tagLibrary).map(([categoryName, tags]) =>
            renderTagCategory(categoryName, tags)
          )}
        </div>
      </div>

      {/* Keyword Configuration for Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="space-y-3">
          <Label className="text-gray-300 text-sm">Keyword Rules</Label>
          {selectedTags.map((tagName) => {
            const tag = allTags.find(t => t.name === tagName)
            return (
              <div key={tagName} className="space-y-1">
                <Label className="text-gray-400 text-xs">{tag?.label} Keywords</Label>
                <Input
                  value={tagKeywords[tagName] || ''}
                  onChange={(e) => handleKeywordChange(tagName, e.target.value)}
                  placeholder="Enter keywords separated by commas..."
                  className="bg-[#1d1d1d] border-[#3d3d3d] text-white nodrag h-8 text-sm"
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Preview */}
      {selectedTags.length > 0 && (
        <div className="p-3 bg-[#1a1a1a] border border-[#3d3d3d] rounded-md">
          <Label className="text-gray-400 text-xs">Preview</Label>
          <div className="text-sm text-gray-300 mt-1">
            Will apply tags: {selectedTags.map(tag => allTags.find(t => t.name === tag)?.label).join(', ')}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Based on keyword matching in email content
          </div>
          <div className="text-xs text-blue-400 mt-2 p-2 bg-blue-900/20 rounded border border-blue-700/30">
            <strong>Target Format:</strong> {getTargetPreview()}
          </div>
        </div>
      )}
      
      <Button 
        onClick={handleSave}
        className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white h-9 text-sm"
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>((config.selectedCategories as string[]) || [])
  const [categoryKeywords, setCategoryKeywords] = useState<Record<string, string>>((config.categoryKeywords as Record<string, string>) || {})
  const [targetType, setTargetType] = useState<string>((config.targetType as string) || 'both')

  // Pre-defined classification categories
  const categoryLibrary = {
    support: [
      { name: 'technical', label: 'Technical Support', keywords: 'technical, api, bug, error, code, integration' },
      { name: 'billing', label: 'Billing Support', keywords: 'billing, invoice, payment, charge, subscription' },
      { name: 'general', label: 'General Support', keywords: 'help, question, issue, problem, support' }
    ],
    sales: [
      { name: 'lead', label: 'New Lead', keywords: 'interested, pricing, demo, trial, purchase' },
      { name: 'existing-customer', label: 'Existing Customer', keywords: 'upgrade, renewal, additional, expand' },
      { name: 'inquiry', label: 'General Inquiry', keywords: 'information, learn more, features, capabilities' }
    ],
    content: [
      { name: 'email', label: 'Email Content', keywords: 'email, message, correspondence' },
      { name: 'document', label: 'Document', keywords: 'document, file, attachment, pdf' },
      { name: 'link', label: 'Link/URL', keywords: 'link, url, website, http, www' }
    ]
  }

  const allCategories = [
    ...categoryLibrary.support,
    ...categoryLibrary.sales,
    ...categoryLibrary.content
  ]

  const handleCategoryToggle = (categoryName: string) => {
    const newSelectedCategories = selectedCategories.includes(categoryName)
      ? selectedCategories.filter(c => c !== categoryName)
      : [...selectedCategories, categoryName]
    
    setSelectedCategories(newSelectedCategories)

    // Set default keywords if not already set
    if (!selectedCategories.includes(categoryName) && !categoryKeywords[categoryName]) {
      const category = allCategories.find(c => c.name === categoryName)
      if (category) {
        setCategoryKeywords(prev => ({ ...prev, [categoryName]: category.keywords }))
      }
    }
  }

  const handleKeywordChange = (categoryName: string, keywords: string) => {
    setCategoryKeywords(prev => ({ ...prev, [categoryName]: keywords }))
  }

  const handleSave = () => {
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one category')
      return
    }

    // Validate that all selected categories have keywords
    const missingKeywords = selectedCategories.filter(category => !categoryKeywords[category]?.trim())
    if (missingKeywords.length > 0) {
      toast.error(`Please set keywords for: ${missingKeywords.join(', ')}`)
      return
    }

    onUpdate({
      selectedCategories,
      categoryKeywords,
      targetType
    })
    onClose()
    toast.success('AI classification configured successfully!')
  }

  const renderCategoryGroup = (groupName: string, categories: typeof categoryLibrary.support) => (
    <div key={groupName} className="space-y-2">
      <Label className="text-gray-400 text-xs uppercase">{groupName}</Label>
      <div className="space-y-2">
        {categories.map((category) => (
          <label
            key={category.name}
            className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${
              selectedCategories.includes(category.name)
                ? 'border-[#8b5cf6] bg-[#8b5cf6]/10'
                : 'border-[#3d3d3d] hover:border-[#5d5d5d]'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedCategories.includes(category.name)}
              onChange={() => handleCategoryToggle(category.name)}
              className="w-4 h-4 text-[#8b5cf6] bg-[#1d1d1d] border-[#3d3d3d] rounded focus:ring-[#8b5cf6]"
            />
            <span className="text-sm text-gray-300">{category.label}</span>
          </label>
        ))}
      </div>
    </div>
  )

  // Get formatted preview based on target type
  const getTargetPreview = () => {
    if (selectedCategories.length === 0) return 'No categories selected'
    
    switch (targetType) {
      case 'trello':
        return `Trello Labels: ${selectedCategories.map(cat => `[${cat}]`).join(' ')}`
      case 'asana':
        return `Asana Custom Fields: ${selectedCategories.map(cat => `category_${cat}=true`).join(', ')}`
      case 'both':
        return `Both Systems: ${selectedCategories.join(', ')}`
      default:
        return selectedCategories.join(', ')
    }
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {/* Target Type Selection */}
      <div>
        <Label className="text-gray-300 text-sm">Target Action Type</Label>
        <select
          value={targetType}
          onChange={(e) => setTargetType(e.target.value)}
          className="mt-1 w-full bg-[#1d1d1d] border border-[#3d3d3d] text-white rounded-md px-3 py-2 nodrag h-9 text-sm"
        >
          <option value="both">Both (Trello & Asana)</option>
          <option value="trello">Trello Only</option>
          <option value="asana">Asana Only</option>
        </select>
        <div className="text-xs text-gray-500 mt-1">
          {targetType === 'trello' && 'Categories will be converted to Trello labels'}
          {targetType === 'asana' && 'Categories will be stored as Asana custom fields'}
          {targetType === 'both' && 'Categories will be formatted for both systems'}
        </div>
      </div>

      <div>
        <Label className="text-gray-300 text-sm">Select Categories</Label>
        <div className="mt-2 space-y-4">
          {Object.entries(categoryLibrary).map(([groupName, categories]) =>
            renderCategoryGroup(groupName, categories)
          )}
        </div>
      </div>

      {/* Keyword Configuration for Selected Categories */}
      {selectedCategories.length > 0 && (
        <div className="space-y-3">
          <Label className="text-gray-300 text-sm">Classification Rules</Label>
          {selectedCategories.map((categoryName) => {
            const category = allCategories.find(c => c.name === categoryName)
            return (
              <div key={categoryName} className="space-y-1">
                <Label className="text-gray-400 text-xs">{category?.label} Keywords</Label>
                <Input
                  value={categoryKeywords[categoryName] || ''}
                  onChange={(e) => handleKeywordChange(categoryName, e.target.value)}
                  placeholder="Enter keywords separated by commas..."
                  className="bg-[#1d1d1d] border-[#3d3d3d] text-white nodrag h-8 text-sm"
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Preview */}
      {selectedCategories.length > 0 && (
        <div className="p-3 bg-[#1a1a1a] border border-[#3d3d3d] rounded-md">
          <Label className="text-gray-400 text-xs">Preview</Label>
          <div className="text-sm text-gray-300 mt-1">
            Will classify into: {selectedCategories.map(cat => allCategories.find(c => c.name === cat)?.label).join(', ')}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Based on keyword matching in email content
          </div>
          <div className="text-xs text-blue-400 mt-2 p-2 bg-blue-900/20 rounded border border-blue-700/30">
            <strong>Target Format:</strong> {getTargetPreview()}
          </div>
        </div>
      )}
      
      <Button 
        onClick={handleSave}
        className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white h-9 text-sm"
      >
        Save Configuration
      </Button>
    </div>
  )
}