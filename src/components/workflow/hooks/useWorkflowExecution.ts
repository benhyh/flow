import { useState, useCallback } from 'react'
import { useReactFlow, type Node, type Edge } from '@xyflow/react'
import { useGmailIntegration, type GmailExecutionResult } from './useGmailIntegration'
import { useTrelloIntegration, type TrelloExecutionResult } from './useTrelloIntegration'
import { toast } from 'sonner'

// Node execution status
export type NodeExecutionStatus = 'idle' | 'running' | 'success' | 'error'

export interface NodeExecutionState {
  [nodeId: string]: {
    status: NodeExecutionStatus
    startTime?: Date
    endTime?: Date
    error?: string
  }
}

export function useWorkflowExecution() {
  const { getNodes, getEdges, setNodes } = useReactFlow()
  const { executeGmailTrigger, hasGmailAccess } = useGmailIntegration()
  const { createTrelloCard, hasTrelloAccess, generateTrelloAuthUrl } = useTrelloIntegration()
  const [nodeExecutionState, setNodeExecutionState] = useState<NodeExecutionState>({})



  // Update node visual status
  const updateNodeStatus = useCallback((nodeId: string, status: NodeExecutionStatus, error?: string) => {
    setNodeExecutionState(prev => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        status,
        error,
        endTime: status !== 'running' ? new Date() : prev[nodeId]?.endTime
      }
    }))

    // Update node visual appearance
    setNodes(nodes => nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            status: status === 'idle' ? 'idle' : 
                   status === 'running' ? 'running' :
                   status === 'success' ? 'success' : 'error'
          }
        }
      }
      return node
    }))
  }, [setNodes])

  // Check if workspace has nodes requiring authentication
  const checkAuthenticationRequirements = useCallback(() => {
    const nodes = getNodes()
    const requiresTrello = nodes.some(node => {
      const nodeData = node.data as Record<string, unknown>
      const nodeType = (nodeData.nodeType as string) || node.type || 'default'
      return nodeType === 'trello-action'
    })

    return { requiresTrello }
  }, [getNodes])

  // Show authentication toast notifications
  const showAuthToast = useCallback(async (service: 'trello') => {
    if (service === 'trello') {
      try {
        const authUrl = await generateTrelloAuthUrl()
        toast.error('Trello Authorization Required', {
          description: 'Click to authorize Trello integration for your workflow',
          duration: 10000,
          action: {
            label: 'Authorize Trello',
            onClick: () => {
              window.open(authUrl, '_blank')
            }
          }
        })
      } catch {
        toast.error('Trello Authorization Error', {
          description: 'Failed to generate Trello authorization URL',
          duration: 5000
        })
      }
    }
  }, [generateTrelloAuthUrl])

  // Execute Trello action node
  const executeTrelloActionNode = useCallback(async (
    node: Node
  ): Promise<{ success: boolean; duration: number; error?: string; data?: TrelloExecutionResult }> => {
    const startTime = Date.now()
    console.log(`[WORKFLOW DEBUG] Starting Trello action execution for node:`, node.id)
    
    const nodeData = node.data as Record<string, unknown>
    console.log(`[WORKFLOW DEBUG] Node data:`, nodeData)
    
    const config = nodeData.config as Record<string, unknown> | undefined
    console.log(`[WORKFLOW DEBUG] Node config:`, config)
    
    // CHECK 1: Configuration validation
    if (!config?.boardId) {
      console.error(`[WORKFLOW DEBUG] EARLY EXIT: No boardId in config`)
      return {
        success: false,
        duration: Date.now() - startTime,
        error: 'Trello Board ID is required. Please configure the node with a valid Board ID.'
      }
    }

    if (!config?.cardTitle) {
      console.error(`[WORKFLOW DEBUG] EARLY EXIT: No cardTitle in config`)
      return {
        success: false,
        duration: Date.now() - startTime,
        error: 'Card title is required. Please configure the node with a card title template.'
      }
    }

    // CHECK 2: Trello access validation
    console.log(`[WORKFLOW DEBUG] Checking Trello access... hasTrelloAccess:`, hasTrelloAccess)
    if (!hasTrelloAccess) {
      console.error(`[WORKFLOW DEBUG] EARLY EXIT: No Trello access`)
      return {
        success: false,
        duration: Date.now() - startTime,
        error: 'Trello access not available. Please authorize Trello integration.'
      }
    }

    try {
      console.log(`[WORKFLOW DEBUG] Creating Trello card...`)
      
      // Prepare card data
      const cardData = {
        name: config.cardTitle as string,
        desc: config.cardDescription as string || '',
        idList: config.listId as string || config.boardId as string, // Use listId if available, fallback to boardId
        pos: 'top' as const
      }

      console.log(`[WORKFLOW DEBUG] Card data:`, cardData)

      const result = await createTrelloCard(cardData)
      console.log(`[WORKFLOW DEBUG] Trello card creation result:`, result)
      
      return {
        success: result.success,
        duration: result.duration,
        error: result.error,
        data: result
      }
    } catch (error) {
      console.error(`[WORKFLOW DEBUG] Trello action threw exception:`, error)
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Trello card creation failed'
      }
    }
  }, [createTrelloCard, hasTrelloAccess])

  // Execute Gmail trigger node with real Gmail API
  const executeGmailTriggerNode = useCallback(async (
    node: Node
  ): Promise<{ success: boolean; duration: number; error?: string; data?: GmailExecutionResult }> => {
    const startTime = Date.now()
    console.log(`[WORKFLOW DEBUG] Starting Gmail trigger execution for node:`, node.id)
    
    const nodeData = node.data as Record<string, unknown>
    console.log(`[WORKFLOW DEBUG] Node data:`, nodeData)
    
    const config = nodeData.config as Record<string, unknown> | undefined
    console.log(`[WORKFLOW DEBUG] Node config:`, config)
    
    // CHECK 1: Configuration validation
    if (!config?.emailFilters) {
      console.error(`[WORKFLOW DEBUG] EARLY EXIT: No emailFilters in config`)
      console.error(`[WORKFLOW DEBUG] Config structure:`, JSON.stringify(config, null, 2))
      return {
        success: false,
        duration: Date.now() - startTime,
        error: 'Gmail trigger not configured. Please set sender, subject, or keywords.'
      }
    }

    console.log(`[WORKFLOW DEBUG] Email filters found:`, config.emailFilters)

    // CHECK 2: Gmail access validation
    console.log(`[WORKFLOW DEBUG] Checking Gmail access... hasGmailAccess:`, hasGmailAccess)
    if (!hasGmailAccess) {
      console.error(`[WORKFLOW DEBUG] EARLY EXIT: No Gmail access`)
      return {
        success: false,
        duration: Date.now() - startTime,
        error: 'Gmail access not available. Please sign in with Google.'
      }
    }

    const emailFilters = config.emailFilters as {
      sender?: string
      subject?: string
      keywords?: string[]
    }

    console.log(`[WORKFLOW DEBUG] Email filters parsed:`, emailFilters)

    // Convert to EmailTriggerConfig format
    const triggerConfig = {
      senderFilter: emailFilters.sender,
      subjectContains: emailFilters.subject,
      keywords: emailFilters.keywords
    }

    console.log(`[WORKFLOW DEBUG] Trigger config created:`, triggerConfig)

    try {
      console.log(`[WORKFLOW DEBUG] Calling executeGmailTrigger...`)
      const result = await executeGmailTrigger(triggerConfig)
      console.log(`[WORKFLOW DEBUG] Gmail trigger result:`, result)
      
      return {
        success: result.success,
        duration: result.duration,
        error: result.error,
        data: result
      }
    } catch (error) {
      console.error(`[WORKFLOW DEBUG] Gmail trigger threw exception:`, error)
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Gmail execution failed'
      }
    }
  }, [executeGmailTrigger, hasGmailAccess])

  // Simulate node execution for non-Gmail nodes
  const simulateNodeExecution = useCallback(async (
    node: Node
  ): Promise<{ success: boolean; duration: number; error?: string }> => {
    const nodeData = node.data as Record<string, unknown>
    const nodeType = (nodeData.nodeType as string) || node.type || 'default'
    
    // Simulate different execution times and success rates based on node type
    const getExecutionParams = (type: string) => {
      switch (true) {
        case type.includes('trigger'):
          return { minTime: 500, maxTime: 1500, successRate: 0.95 }
        case type.includes('action'):
          return { minTime: 1000, maxTime: 3000, successRate: 0.90 }
        case type.includes('logic'):
          return { minTime: 200, maxTime: 800, successRate: 0.98 }
        case type.includes('ai'):
          return { minTime: 2000, maxTime: 5000, successRate: 0.85 }
        default:
          return { minTime: 500, maxTime: 2000, successRate: 0.92 }
      }
    }

    const params = getExecutionParams(nodeType)
    const duration = Math.random() * (params.maxTime - params.minTime) + params.minTime
    const success = Math.random() < params.successRate

    // Check if node is configured
    const config = nodeData.config as Record<string, unknown> | undefined
    const isConfigured = config && Object.keys(config).length > 0

    if (!isConfigured) {
      return {
        success: false,
        duration: 100,
        error: 'Node is not configured'
      }
    }

    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, duration))

    if (!success) {
      const errors = [
        'Connection timeout',
        'Authentication failed',
        'Rate limit exceeded',
        'Invalid configuration',
        'Service unavailable'
      ]
      return {
        success: false,
        duration,
        error: errors[Math.floor(Math.random() * errors.length)]
      }
    }

    return { success: true, duration }
  }, [])

  // Execute node (real execution for Gmail triggers and Trello actions, simulation for others)
  const executeNode = useCallback(async (
    node: Node
  ): Promise<{ success: boolean; duration: number; error?: string; data?: unknown }> => {
    const nodeData = node.data as Record<string, unknown>
    const nodeType = (nodeData.nodeType as string) || node.type || 'default'
    
    // Handle Gmail trigger nodes with real execution
    if (nodeType === 'email-trigger') {
      return await executeGmailTriggerNode(node)
    }
    
    // Handle Trello action nodes with real execution
    if (nodeType === 'trello-action') {
      return await executeTrelloActionNode(node)
    }
    
    // Simulate other node types
    return await simulateNodeExecution(node)
  }, [executeGmailTriggerNode, executeTrelloActionNode, simulateNodeExecution])

  // Execute workflow simulation
  const executeWorkflow = useCallback(async () => {
    console.log(`[WORKFLOW DEBUG] ========== STARTING WORKFLOW EXECUTION ==========`)
    
    const nodes = getNodes()
    const edges = getEdges()

    console.log(`[WORKFLOW DEBUG] Found ${nodes.length} nodes:`, nodes.map(n => ({id: n.id, type: n.type, nodeType: n.data?.nodeType})))
    console.log(`[WORKFLOW DEBUG] Found ${edges.length} edges:`, edges)

    if (nodes.length === 0) {
      console.log('[Workflow] No nodes to execute')
      toast.info('No nodes to execute', { description: 'Add some nodes to your workflow first' })
      return
    }

    // Check authentication requirements before execution
    const { requiresTrello } = checkAuthenticationRequirements()
    
    if (requiresTrello && !hasTrelloAccess) {
      console.log('[WORKFLOW DEBUG] Trello authentication required but not available')
      await showAuthToast('trello')
      return
    }

    console.log(`[Workflow] Starting execution with ${nodes.length} nodes`)

    // Reset all node statuses
    nodes.forEach(node => {
      console.log(`[WORKFLOW DEBUG] Resetting node ${node.id} to idle`)
      updateNodeStatus(node.id, 'idle')
    })

    // Build execution order (topological sort)
    const getExecutionOrder = (nodes: Node[], edges: Edge[]): Node[] => {
      const inDegree = new Map<string, number>()
      const adjList = new Map<string, string[]>()
      
      // Initialize
      nodes.forEach(node => {
        inDegree.set(node.id, 0)
        adjList.set(node.id, [])
      })
      
      // Build adjacency list and calculate in-degrees
      edges.forEach(edge => {
        const targets = adjList.get(edge.source) || []
        targets.push(edge.target)
        adjList.set(edge.source, targets)
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
      })
      
      // Find nodes with no dependencies (triggers)
      const queue: Node[] = []
      nodes.forEach(node => {
        if (inDegree.get(node.id) === 0) {
          queue.push(node)
        }
      })

      const result: Node[] = []
      
      while (queue.length > 0) {
        const current = queue.shift()!
        result.push(current)
        
        const neighbors = adjList.get(current.id) || []
        neighbors.forEach(neighborId => {
          const newInDegree = (inDegree.get(neighborId) || 0) - 1
          inDegree.set(neighborId, newInDegree)
          
          if (newInDegree === 0) {
            const neighborNode = nodes.find(n => n.id === neighborId)
            if (neighborNode) {
              queue.push(neighborNode)
            }
          }
        })
      }
      
      return result
    }

    const executionOrder = getExecutionOrder(nodes, edges)
    let completedNodes = 0
    let errorCount = 0

    // Execute nodes in order
    for (const node of executionOrder) {
      const nodeData = node.data as Record<string, unknown>
      const nodeName = nodeData.label as string || node.id
      const nodeType = (nodeData.nodeType as string) || node.type || 'default'
      
      console.log(`[WORKFLOW DEBUG] ========== EXECUTING NODE ==========`)
      console.log(`[WORKFLOW DEBUG] Node ID: ${node.id}`)
      console.log(`[WORKFLOW DEBUG] Node Name: ${nodeName}`)
      console.log(`[WORKFLOW DEBUG] Node Type: ${nodeType}`)
      console.log(`[WORKFLOW DEBUG] Node Data:`, nodeData)
      
      // Start node execution
      console.log(`[WORKFLOW DEBUG] Setting node ${node.id} status to 'running'`)
      updateNodeStatus(node.id, 'running')
      console.log(`[Workflow] Executing node: ${nodeName} (${nodeType})`)
      
      try {
        console.log(`[WORKFLOW DEBUG] Calling executeNode...`)
        const result = await executeNode(node)
        console.log(`[WORKFLOW DEBUG] executeNode result:`, result)
        
        if (result.success) {
          console.log(`[WORKFLOW DEBUG] Node succeeded - setting status to 'success'`)
          updateNodeStatus(node.id, 'success')
          
          // Add detailed logging for Gmail triggers
          if (nodeType === 'email-trigger' && result.data) {
            const gmailResult = result.data as GmailExecutionResult
            const emailCount = gmailResult.emailCount || 0
            const processedEmails = gmailResult.processedEmails || []
            
            console.log(`[Workflow] Gmail trigger found ${emailCount} matching emails`)
            if (emailCount > 0) {
              console.log('[Workflow] Processed emails with categories:', processedEmails.map(email => `${email.extractedInfo.category} (${email.extractedInfo.priority})`))
              toast.success(`📧 Gmail Trigger: Found ${emailCount} matching emails`, {
                description: `Processed emails: ${processedEmails.slice(0, 3).map(email => email.extractedInfo.category).join(', ')}${emailCount > 3 ? ` and ${emailCount - 3} more...` : ''}`,
                duration: 5000
              })
            } else {
              console.error(`[Workflow] Gmail trigger found 0 emails - stopping workflow execution`)
              updateNodeStatus(node.id, 'error', 'No emails found matching criteria')
              toast.error('📧 Gmail Trigger: No emails found', {
                description: 'No sender emails found in your Gmail inbox matching the criteria. Please check your email filters and try again.',
                duration: 6000
              })
              // Stop workflow execution when 0 emails are found
              console.log(`[WORKFLOW DEBUG] Stopping execution due to 0 emails found`)
              break
            }
          } else if (nodeType === 'trello-action' && result.data) {
            // Add detailed logging for Trello actions
            const trelloResult = result.data as TrelloExecutionResult
            console.log(`[Workflow] Trello card created: ${trelloResult.cardName}`)
            
            toast.success(`🗂️ Trello Card Created`, {
              description: `"${trelloResult.cardName}" was added to your board`,
              duration: 5000,
              action: trelloResult.cardUrl ? {
                label: 'View Card',
                onClick: () => {
                  window.open(trelloResult.cardUrl, '_blank')
                }
              } : undefined
            })
          } else {
            console.log(`[Workflow] Node ${nodeName} completed successfully`)
            // Node completed successfully - no notification needed
          }
          completedNodes++
        } else {
          console.error(`[WORKFLOW DEBUG] Node failed - setting status to 'error'`)
          console.error(`[WORKFLOW DEBUG] Error details:`, result.error)
          updateNodeStatus(node.id, 'error', result.error)
          console.error(`[Workflow] Node execution failed: ${result.error}`)
          errorCount++
          
          // Handle specific error types with appropriate toast notifications
          if (result.error?.includes('Trello access not available')) {
            await showAuthToast('trello')
          } else if (result.error?.includes('Board ID is required')) {
            toast.error(`❌ Node: ${nodeName} configuration error`, { 
              description: 'Trello Board ID is required. Please configure the node.',
              duration: 6000
            })
          } else {
            toast.error(`❌ Node: ${nodeName} failed`, { 
              description: result.error, 
              duration: 4000 
            })
          }
          
          // Stop execution on error (you could make this configurable)
          console.log(`[WORKFLOW DEBUG] Stopping execution due to error`)
          break
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unexpected error'
        console.error(`[WORKFLOW DEBUG] Exception during node execution:`, error)
        console.error(`[WORKFLOW DEBUG] Setting node status to 'error' with message:`, errorMessage)
        updateNodeStatus(node.id, 'error', errorMessage)
        console.error(`[Workflow] Unexpected error in node: ${nodeName} - ${errorMessage}`)
        errorCount++
        console.log(`[WORKFLOW DEBUG] Stopping execution due to exception`)
        break
      }
    }

    const finalStatus = errorCount > 0 ? 'error' : 'success'
    console.log(`[Workflow] Execution ${finalStatus}. Completed ${completedNodes}/${nodes.length} nodes${errorCount > 0 ? ` with ${errorCount} errors` : ''}`)

    // Reset node statuses after a delay
    setTimeout(() => {
      nodes.forEach(node => {
        updateNodeStatus(node.id, 'idle')
      })
    }, 3000)

  }, [getNodes, getEdges, updateNodeStatus, executeNode, checkAuthenticationRequirements, showAuthToast, hasTrelloAccess])

  return {
    nodeExecutionState,
    executeWorkflow,
    checkAuthenticationRequirements,
    showAuthToast,
    isExecuting: false
  }
}