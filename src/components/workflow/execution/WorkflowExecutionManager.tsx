'use client'

import { useCallback } from 'react'
import { useReactFlow, type Node, type Edge } from '@xyflow/react'
import { useGmailIntegration, type GmailExecutionResult } from '../hooks/useGmailIntegration'
import { useTrelloIntegration } from '../hooks/useTrelloIntegration'
import { useAsanaIntegration } from '../hooks/useAsanaIntegration'
import { toast } from 'sonner'

// Node execution state type
type NodeExecutionState = Record<string, 'idle' | 'running' | 'success' | 'error'>

export interface WorkflowExecutionManagerReturn {
  executeWorkflow: (onExecutionError?: (error: {
    nodeId: string
    nodeLabel: string
    message: string
    suggestion?: string
  }) => void) => Promise<void>
  isExecuting: boolean
  nodeExecutionState: NodeExecutionState
}

export function useWorkflowExecutionManager(): WorkflowExecutionManagerReturn {
  const { getNodes, getEdges, setNodes } = useReactFlow()
  const { executeGmailTrigger, hasGmailAccess } = useGmailIntegration()
  const { hasTrelloAccess, generateTrelloAuthUrl, createTrelloCard } = useTrelloIntegration()
  const { hasAsanaAccess, generateAsanaAuthUrl, createAsanaTask } = useAsanaIntegration()

  // Update node status visually
  const updateNodeStatus = useCallback((nodeId: string, status: 'idle' | 'running' | 'success' | 'error', error?: string) => {
    
    setNodes((nodes: Node[]) => nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            status: status === 'idle' ? 'idle' : 
                   status === 'running' ? 'running' :
                   status === 'success' ? 'success' : 'error',
            error: status === 'error' ? error : undefined
          }
        }
      }
      return node
    }))
  }, [setNodes])

  // Execute Gmail trigger node with real Gmail API
  const executeGmailTriggerNode = useCallback(async (
    node: Node
  ): Promise<{ success: boolean; duration: number; error?: string; data?: GmailExecutionResult }> => {
    const startTime = Date.now()
    console.log(`[EXECUTION MANAGER] ========== GMAIL TRIGGER EXECUTION ==========`)
    console.log(`[EXECUTION MANAGER] Starting Gmail trigger execution for node:`, node.id)
    
    const nodeData = node.data as Record<string, unknown>
    console.log(`[EXECUTION MANAGER] Node data:`, nodeData)
    
    const config = nodeData.config as Record<string, unknown> | undefined
    console.log(`[EXECUTION MANAGER] Node config:`, config)
    
    // CHECK 1: Configuration validation
    if (!config?.emailFilters) {
      console.error(`[EXECUTION MANAGER] EARLY EXIT: No emailFilters in config`)
      console.error(`[EXECUTION MANAGER] Config structure:`, JSON.stringify(config, null, 2))
      return {
        success: false,
        duration: Date.now() - startTime,
        error: 'Gmail trigger not configured. Please set sender, subject, or keywords.'
      }
    }

    console.log(`[EXECUTION MANAGER] Email filters found:`, config.emailFilters)

    // CHECK 2: Gmail access validation
    console.log(`[EXECUTION MANAGER] Checking Gmail access... hasGmailAccess:`, hasGmailAccess)
    if (!hasGmailAccess) {
      console.error(`[EXECUTION MANAGER] EARLY EXIT: No Gmail access`)
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



    // Convert to EmailTriggerConfig format
    const triggerConfig = {
      senderFilter: emailFilters.sender,
      subjectContains: emailFilters.subject,
      keywords: emailFilters.keywords
    }



    try {

      const result = await executeGmailTrigger(triggerConfig)

      
      return {
        success: result.success,
        duration: result.duration,
        error: result.error,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Gmail execution failed'
      }
    }
  }, [executeGmailTrigger, hasGmailAccess])

  // Execute Trello action node with real API calls
  const executeTrelloActionNode = useCallback(async (
    node: Node
  ): Promise<{ success: boolean; duration: number; error?: string; data?: any }> => {
    const startTime = Date.now()
    console.log(`[EXECUTION MANAGER] ========== TRELLO ACTION EXECUTION ==========`)
    console.log(`[EXECUTION MANAGER] Starting Trello action execution for node:`, node.id)
    
    const nodeData = node.data as Record<string, unknown>
    console.log(`[EXECUTION MANAGER] Node data:`, nodeData)
    
    const config = nodeData.config as Record<string, unknown> | undefined
    console.log(`[EXECUTION MANAGER] Node config:`, config)
    
    // CHECK 1: Configuration validation
    if (!config?.listId) {
      console.error(`[EXECUTION MANAGER] EARLY EXIT: No listId in config`)
      return {
        success: false,
        duration: Date.now() - startTime,
        error: 'Trello action not configured. Please select a board and list.'
      }
    }

    if (!config?.cardTitle) {
      console.error(`[EXECUTION MANAGER] EARLY EXIT: No cardTitle in config`)
      return {
        success: false,
        duration: Date.now() - startTime,
        error: 'Card title is required for Trello card creation.'
      }
    }

    console.log(`[EXECUTION MANAGER] List ID found:`, config.listId)
    console.log(`[EXECUTION MANAGER] Card title found:`, config.cardTitle)

    // CHECK 2: Trello access validation
    console.log(`[EXECUTION MANAGER] Checking Trello access... hasTrelloAccess:`, hasTrelloAccess)
    if (!hasTrelloAccess) {
      console.error(`[EXECUTION MANAGER] EARLY EXIT: No Trello access`)
      return {
        success: false,
        duration: Date.now() - startTime,
        error: 'Trello access not available. Please authorize Trello first.'
      }
    }

    // Prepare card data for Trello API
    const cardData: { name: string; idList: string; desc?: string } = {
      name: config.cardTitle as string,
      idList: config.listId as string
    }
    
    // Add description if available (legacy support)
    if (config.cardDescription) {
      cardData.desc = config.cardDescription as string
    }

    console.log(`[EXECUTION MANAGER] Card data prepared:`, cardData)

    try {
      console.log(`[EXECUTION MANAGER] Calling createTrelloCard...`)
      const result = await createTrelloCard(cardData)
      console.log(`[EXECUTION MANAGER] Trello card creation result:`, result)
      
      return {
        success: result.success,
        duration: result.duration,
        error: result.error,
        data: {
          cardId: result.cardId,
          cardUrl: result.cardUrl,
          cardName: result.cardName
        }
      }
    } catch (error) {
      console.error(`[EXECUTION MANAGER] Trello card creation failed:`, error)
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown Trello API error'
      }
    }
  }, [createTrelloCard, hasTrelloAccess])

  // Execute Asana action node with real API calls
  const executeAsanaActionNode = useCallback(async (
    node: Node
  ): Promise<{ success: boolean; duration: number; error?: string; data?: any }> => {
    const startTime = Date.now()
    console.log(`[EXECUTION MANAGER] ========== ASANA ACTION EXECUTION ==========`)
    console.log(`[EXECUTION MANAGER] Starting Asana action execution for node:`, node.id)
    
    const nodeData = node.data as Record<string, unknown>
    console.log(`[EXECUTION MANAGER] Node data:`, nodeData)
    
    const config = nodeData.config as Record<string, unknown> | undefined
    console.log(`[EXECUTION MANAGER] Node config:`, config)
    
    // CHECK 1: Configuration validation
    if (!config?.taskName) {
      console.error(`[EXECUTION MANAGER] EARLY EXIT: No taskName in config`)
      return {
        success: false,
        duration: Date.now() - startTime,
        error: 'Task name is required for Asana task creation.'
      }
    }

    console.log(`[EXECUTION MANAGER] Task name found:`, config.taskName)
    if (config.projectId) {
      console.log(`[EXECUTION MANAGER] Project ID found:`, config.projectId)
    } else {
      console.log(`[EXECUTION MANAGER] No project specified - will create in dashboard`)
    }

    // CHECK 2: Asana access validation
    console.log(`[EXECUTION MANAGER] Checking Asana access... hasAsanaAccess:`, hasAsanaAccess)
    if (!hasAsanaAccess) {
      console.error(`[EXECUTION MANAGER] EARLY EXIT: No Asana access`)
      return {
        success: false,
        duration: Date.now() - startTime,
        error: 'Asana access not available. Please authorize Asana first.'
      }
    }

    // Prepare task data for Asana API
    const taskData: { name: string; projects?: string[]; notes?: string } = {
      name: config.taskName as string
    }
    
    // Add project if specified (optional)
    if (config.projectId) {
      taskData.projects = [config.projectId as string]
    }
    
    // Add description if available
    if (config.taskDescription) {
      taskData.notes = config.taskDescription as string
    }

    console.log(`[EXECUTION MANAGER] Task data prepared:`, taskData)

    try {
      console.log(`[EXECUTION MANAGER] Calling createAsanaTask...`)
      const result = await createAsanaTask(taskData)
      console.log(`[EXECUTION MANAGER] Asana task creation result:`, result)
      
      return {
        success: result.success,
        duration: result.duration,
        error: result.error,
        data: {
          taskId: result.taskId,
          taskUrl: result.taskUrl,
          taskName: result.taskName
        }
      }
    } catch (error) {
      console.error(`[EXECUTION MANAGER] Asana task creation failed:`, error)
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown Asana API error'
      }
    }
  }, [createAsanaTask, hasAsanaAccess])

  // Simulate node execution for non-Gmail, non-Trello, non-Asana nodes
  const simulateNodeExecution = useCallback(async (
    node: Node
  ): Promise<{ success: boolean; duration: number; error?: string }> => {
    const nodeData = node.data as Record<string, unknown>
    const nodeType = (nodeData.nodeType as string) || node.type || 'default'
    
    console.log(`[EXECUTION MANAGER] Simulating execution for node type: ${nodeType}`)

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

    // Wait for the simulated duration
    await new Promise(resolve => setTimeout(resolve, duration))

    // Check if node has configuration
    const config = nodeData.config as Record<string, unknown> | undefined
    if (!config || Object.keys(config).length === 0) {
      console.log(`[EXECUTION MANAGER] Node ${node.id} has no configuration`)
      return {
        success: false,
        duration: 100,
        error: 'Node is not configured'
      }
    }

    // Simulate success/failure based on success rate
    const isSuccess = Math.random() < params.successRate

    if (!isSuccess) {
      const errors = [
        'Simulated network timeout',
        'Simulated API rate limit',
        'Simulated configuration error',
        'Simulated temporary failure'
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
  ): Promise<{ success: boolean; duration: number; error?: string; data?: any }> => {
    const nodeData = node.data as Record<string, unknown>
    const nodeType = nodeData.nodeType as string

    console.log(`[EXECUTION MANAGER] Executing node ${node.id} of type: ${nodeType}`)

    // Real execution for Gmail triggers
    if (nodeType === 'email-trigger') {
      return await executeGmailTriggerNode(node)
    }
    
    // Real execution for Trello actions
    if (nodeType === 'trello-action') {
      return await executeTrelloActionNode(node)
    }
    
    // Real execution for Asana actions
    if (nodeType === 'asana-action') {
      return await executeAsanaActionNode(node)
    }
    
    // Simulate other node types
    return await simulateNodeExecution(node)
  }, [executeGmailTriggerNode, executeTrelloActionNode, executeAsanaActionNode, simulateNodeExecution])

  // Main workflow execution function
  const executeWorkflow = useCallback(async (onExecutionError?: (error: {
    nodeId: string
    nodeLabel: string
    message: string
    suggestion?: string
  }) => void) => {
    const executionStartTime = Date.now()
    
    const nodes = getNodes()
    const edges = getEdges()



    if (nodes.length === 0) {
      toast.info('No nodes to execute', { description: 'Add some nodes to your workflow first' })
      return
    }

    // Check for Trello nodes and authentication
    const requiresTrello = nodes.some(node => {
      const nodeData = node.data as Record<string, unknown>
      const nodeType = (nodeData.nodeType as string) || node.type || 'default'
      return nodeType === 'trello-action'
    })

    // Check for Asana nodes and authentication
    const requiresAsana = nodes.some(node => {
      const nodeData = node.data as Record<string, unknown>
      const nodeType = (nodeData.nodeType as string) || node.type || 'default'
      return nodeType === 'asana-action'
    })

    if (requiresTrello && !hasTrelloAccess) {
      console.log('[EXECUTION MANAGER] EARLY EXIT: Trello nodes present but user not authenticated')
      try {
        const authUrl = await generateTrelloAuthUrl()
        toast.error('Trello Authorization Required', {
          description: 'Your workflow contains Trello nodes. Click to authorize Trello integration.',
          duration: Infinity,
          action: {
            label: 'Authorize Trello',
            onClick: () => {
              // Open popup similar to Google OAuth
              const popup = window.open(
                authUrl,
                'trello-oauth',
                'width=500,height=600,scrollbars=yes,resizable=yes,top=100,left=100'
              )
              
              if (!popup) {
                toast.error('Popup blocked. Please allow popups for this site.')
                return
              }

              // Listen for messages from the popup
              const messageListener = (event: MessageEvent) => {
                if (event.origin !== window.location.origin) return

                if (event.data.type === 'TRELLO_OAUTH_SUCCESS') {
                  window.removeEventListener('message', messageListener)
                  popup.close()
                  toast.dismiss()
                  toast.success('Trello successfully authorized!', {
                    description: 'You can now run your workflow.',
                    duration: 3000
                  })
                } else if (event.data.type === 'TRELLO_OAUTH_ERROR') {
                  window.removeEventListener('message', messageListener)
                  popup.close()
                  toast.error('Trello authorization failed', {
                    description: event.data.error || 'Please try again.',
                    duration: 5000
                  })
                }
              }

              window.addEventListener('message', messageListener)

              // Clean up if popup is closed manually
              const popupCheckInterval = setInterval(() => {
                if (popup.closed) {
                  clearInterval(popupCheckInterval)
                  window.removeEventListener('message', messageListener)
                }
              }, 1000)
            }
          }
        })
      } catch (error) {
        console.error('Failed to generate Trello auth URL:', error)
        toast.error('Trello Authorization Error', {
          description: 'Failed to generate authorization URL. Please try again.',
          duration: 5000
        })
      }
      return
    }

    if (requiresAsana && !hasAsanaAccess) {
      console.log('[EXECUTION MANAGER] EARLY EXIT: Asana nodes present but user not authenticated')
      try {
        const authUrl = await generateAsanaAuthUrl()
        toast.error('Asana Authorization Required', {
          description: 'Your workflow contains Asana nodes. Click to authorize Asana integration.',
          duration: Infinity,
          action: {
            label: 'Authorize Asana',
            onClick: () => {
              // Open popup similar to Google OAuth
              const popup = window.open(
                authUrl,
                'asana-oauth',
                'width=500,height=600,scrollbars=yes,resizable=yes,top=100,left=100'
              )
              
              if (!popup) {
                toast.error('Popup blocked. Please allow popups for this site.')
                return
              }

              // Listen for messages from the popup
              const messageListener = (event: MessageEvent) => {
                if (event.origin !== window.location.origin) return

                if (event.data.type === 'ASANA_OAUTH_SUCCESS') {
                  window.removeEventListener('message', messageListener)
                  popup.close()
                  toast.dismiss()
                  toast.success('Asana successfully authorized!', {
                    description: 'You can now run your workflow.',
                    duration: 3000
                  })
                } else if (event.data.type === 'ASANA_OAUTH_ERROR') {
                  window.removeEventListener('message', messageListener)
                  popup.close()
                  toast.error('Asana authorization failed', {
                    description: event.data.error || 'Please try again.',
                    duration: 5000
                  })
                }
              }

              window.addEventListener('message', messageListener)

              // Clean up if popup is closed manually
              const popupCheckInterval = setInterval(() => {
                if (popup.closed) {
                  clearInterval(popupCheckInterval)
                  window.removeEventListener('message', messageListener)
                }
              }, 1000)
            }
          }
        })
      } catch (error) {
        console.error('Failed to generate Asana auth URL:', error)
        toast.error('Asana Authorization Error', {
          description: 'Failed to generate authorization URL. Please try again.',
          duration: 5000
        })
      }
      return
    }

    // Reset all node statuses
    nodes.forEach(node => {

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
        const fromNodes = adjList.get(edge.source) || []
        fromNodes.push(edge.target)
        adjList.set(edge.source, fromNodes)
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
      })

      // Topological sort
      const queue: string[] = []
      const result: Node[] = []

      // Start with trigger nodes only (nodes that have no dependencies AND are actual triggers)
      inDegree.forEach((degree, nodeId) => {
        if (degree === 0) {
          const node = nodes.find(n => n.id === nodeId)
          if (node) {
            const nodeData = node.data as Record<string, unknown>
            const nodeType = (nodeData.nodeType as string) || node.type || 'default'
            
            // Only start execution from actual trigger nodes, not disconnected action nodes
            if (nodeType.includes('trigger') || node.type === 'trigger') {
              queue.push(nodeId)
            }
          }
        }
      })

      while (queue.length > 0) {
        const nodeId = queue.shift()!
        const node = nodes.find(n => n.id === nodeId)
        if (node) {
          result.push(node)
        }

        const neighbors = adjList.get(nodeId) || []
        neighbors.forEach(neighbor => {
          const newDegree = (inDegree.get(neighbor) || 0) - 1
          inDegree.set(neighbor, newDegree)
          if (newDegree === 0) {
            queue.push(neighbor)
          }
        })
      }

      return result
    }

    const executionOrder = getExecutionOrder(nodes, edges)
    
    // Validate that action nodes (Trello/Asana) are connected to trigger nodes
    const disconnectedActionNodes = nodes.filter(node => {
      const nodeData = node.data as Record<string, unknown>
      const nodeType = (nodeData.nodeType as string) || node.type || 'default'
      
      // Check if this is an action node
      if (nodeType === 'trello-action' || nodeType === 'asana-action' || node.type === 'action') {
        // Check if this node has any incoming connections
        const hasIncomingConnection = edges.some(edge => edge.target === node.id)
        return !hasIncomingConnection
      }
      return false
    })

    // If there are disconnected action nodes, prevent execution
    if (disconnectedActionNodes.length > 0) {
      const disconnectedNames = disconnectedActionNodes.map(node => {
        const nodeData = node.data as Record<string, unknown>
        return nodeData.label as string || node.id
      }).join(', ')
      
      toast.error('Disconnected Action Nodes Found', {
        description: `These action nodes are not connected to any trigger: ${disconnectedNames}. Please connect them or remove them from the workflow.`,
        duration: 8000
      })
      
      console.log(`[EXECUTION MANAGER] EARLY EXIT: Disconnected action nodes found:`, disconnectedActionNodes.map(n => n.id))
      return
    }

    let completedNodes = 0
    let errorCount = 0

    // Execute nodes in order
    for (const node of executionOrder) {
      const nodeData = node.data as Record<string, unknown>
      const nodeName = nodeData.label as string || node.id
      const nodeType = (nodeData.nodeType as string) || node.type || 'default'
      
      // Start node execution
      updateNodeStatus(node.id, 'running')
      
      try {
        const result = await executeNode(node)
        
        if (result.success) {
          updateNodeStatus(node.id, 'success')
          
          // Add detailed logging for Gmail triggers
          if (nodeType === 'email-trigger' && result.data) {
            const gmailResult = result.data as GmailExecutionResult
            const emailCount = gmailResult.emailCount || 0
            const processedEmails = gmailResult.processedEmails || []
            
            if (emailCount > 0) {
              toast.success(`📧 Gmail Trigger: Found ${emailCount} matching emails`, {
                description: `Processed emails: ${processedEmails.slice(0, 3).map(email => email.extractedInfo.category).join(', ')}${emailCount > 3 ? ` and ${emailCount - 3} more...` : ''}`,
                duration: 5000
              })
            } else {
              console.error(`[EXECUTION MANAGER] Gmail trigger found 0 emails - stopping workflow execution`)
              updateNodeStatus(node.id, 'error', 'No emails found matching criteria')
              toast.error('📧 Gmail Trigger: No emails found', {
                description: 'No sender emails found in your Gmail inbox matching the criteria. Please check your email filters and try again.',
                duration: 6000
              })
              
              // Add execution error to validation panel
              if (onExecutionError) {
                onExecutionError({
                  nodeId: node.id,
                  nodeLabel: nodeName,
                  message: 'No sender emails found in your Gmail inbox matching the criteria',
                  suggestion: 'Please check your email filters and try again'
                })
              }
              
              // Stop workflow execution when 0 emails are found
              console.log(`[EXECUTION MANAGER] Stopping execution due to 0 emails found`)
              break
            }
          } else if (nodeType === 'trello-action' && result.data) {
            // Add detailed logging for Trello actions
            const trelloResult = result.data
            toast.success(`📋 Trello Card Created: ${trelloResult.cardName}`, {
              description: `Card ID: ${trelloResult.cardId}`,
              duration: 5000,
              action: {
                label: 'View Card',
                onClick: () => {
                  if (trelloResult.cardUrl) {
                    window.open(trelloResult.cardUrl, '_blank')
                  }
                }
              }
            })
          } else if (nodeType === 'asana-action' && result.data) {
            // Add detailed logging for Asana actions
            const asanaResult = result.data
            toast.success(`📊 Asana Task Created: ${asanaResult.taskName}`, {
              description: `Task ID: ${asanaResult.taskId}`,
              duration: 5000,
              action: {
                label: 'View Task',
                onClick: () => {
                  if (asanaResult.taskUrl) {
                    window.open(asanaResult.taskUrl, '_blank')
                  }
                }
              }
            })
          } else {
            // Node completed successfully - no notification needed
          }
          completedNodes++
        } else {
          updateNodeStatus(node.id, 'error', result.error)
          errorCount++
          
          // Handle specific Gmail permission errors
          if (result.error?.includes('GMAIL_SCOPE_ERROR')) {
            toast.error('Gmail Permission Error', {
              description: 'Gmail metadata scope does not support search queries. Please re-authorize with gmail.readonly scope for full access.',
              duration: 6000
            })
          } else {
            toast.error(`❌ Node: ${nodeName} failed`, { 
              description: result.error, 
              duration: 4000 
            })
          }
          
          // Stop execution on error
          break
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unexpected error'
        updateNodeStatus(node.id, 'error', errorMessage)
        errorCount++
        toast.error(`❌ Node: ${nodeName} unexpected error`, { description: errorMessage, duration: 3000 })
        break
      }
    }

    const finalStatus = errorCount > 0 ? 'error' : 'success'
    
    // Return execution summary
    const _executionSummary = {
      status: finalStatus,
      completedNodes,
      totalNodes: nodes.length,
      errorCount,
      duration: Date.now() - executionStartTime
    }
    
    if (finalStatus === 'error') {
      toast.error('❌ Workflow Test Failed', {
        description: `${errorCount} error(s) occurred during execution`,
        duration: 5000
      })
    }

    // Reset node statuses after a delay
    setTimeout(() => {
      nodes.forEach(node => {
        updateNodeStatus(node.id, 'idle')
      })
    }, 3000)

  }, [getNodes, getEdges, updateNodeStatus, executeNode, generateTrelloAuthUrl, hasTrelloAccess, generateAsanaAuthUrl, hasAsanaAccess])

  return {
    executeWorkflow,
    isExecuting: false, // TODO: Add proper isExecuting state
    nodeExecutionState: {} // TODO: Add proper node execution state tracking
  }
}
