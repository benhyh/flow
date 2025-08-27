/**
 * Workflow Validation System
 * Comprehensive validation for workflow structure and configuration
 */

import { type Node, type Edge } from '@xyflow/react'

export interface ValidationError {
  id: string
  type: 'error' | 'warning' | 'info'
  category: 'structure' | 'configuration' | 'connection' | 'logic'
  message: string
  nodeId?: string
  edgeId?: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  suggestion?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  info: ValidationError[]
  score: number // 0-100 quality score
}

/**
 * Validate entire workflow
 */
export function validateWorkflow(nodes: Node[], edges: Edge[]): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  const _info: ValidationError[] = []

  // Structure validation
  validateWorkflowStructure(nodes, edges, errors, warnings, _info)
  
  // Node configuration validation
  validateNodeConfigurations(nodes, errors, warnings, _info)
  
  // Connection validation
  validateConnections(nodes, edges, errors, warnings, _info)
  
  // Logic flow validation
  validateLogicFlow(nodes, edges, errors, warnings, _info)
  
  // Performance validation
  validatePerformance(nodes, edges, errors, warnings, _info)

  // Calculate quality score
  const score = calculateQualityScore(errors, warnings, _info)

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    info: _info,
    score
  }
}

/**
 * Validate workflow structure
 */
function validateWorkflowStructure(
  nodes: Node[], 
  edges: Edge[], 
  errors: ValidationError[], 
  warnings: ValidationError[], 
  _info: ValidationError[]
): void {
  // Check for empty workflow
  if (nodes.length === 0) {
    warnings.push({
      id: 'empty-workflow',
      type: 'warning',
      category: 'structure',
      message: 'Workflow is empty',
      severity: 'medium',
      suggestion: 'Add at least one trigger node to start building your workflow'
    })
    return
  }

  // Check for trigger nodes
  const triggerNodes = nodes.filter(node => node.type === 'trigger')
  if (triggerNodes.length === 0) {
    errors.push({
      id: 'no-triggers',
      type: 'error',
      category: 'structure',
      message: 'Workflow must have at least one trigger node',
      severity: 'critical',
      suggestion: 'Add an email trigger or other trigger node to start your workflow'
    })
  }

  // Check for action nodes
  const actionNodes = nodes.filter(node => node.type === 'action')
  if (actionNodes.length === 0) {
    warnings.push({
      id: 'no-actions',
      type: 'warning',
      category: 'structure',
      message: 'Workflow has no action nodes',
      severity: 'high',
      suggestion: 'Add action nodes to perform tasks when the workflow is triggered'
    })
  }

  // Check for isolated nodes (nodes with no connections)
  const connectedNodeIds = new Set([
    ...edges.map(edge => edge.source),
    ...edges.map(edge => edge.target)
  ])
  
  const isolatedNodes = nodes.filter(node => !connectedNodeIds.has(node.id))
  isolatedNodes.forEach(node => {
    warnings.push({
      id: `isolated-${node.id}`,
      type: 'warning',
      category: 'structure',
      message: `Node "${node.data.label}" is not connected to any other nodes`,
      nodeId: node.id,
      severity: 'medium',
      suggestion: 'Connect this node to other nodes or remove it if not needed'
    })
  })

  // Check for unreachable nodes (nodes not reachable from triggers)
  const reachableNodes = findReachableNodes(nodes, edges, triggerNodes)
  const unreachableNodes = nodes.filter(node => 
    !reachableNodes.has(node.id) && node.type !== 'trigger'
  )
  
  unreachableNodes.forEach(node => {
    errors.push({
      id: `unreachable-${node.id}`,
      type: 'error',
      category: 'structure',
      message: `Node "${node.data.label}" is not reachable from any trigger`,
      nodeId: node.id,
      severity: 'high',
      suggestion: 'Connect this node to a path that starts from a trigger node'
    })
  })

  // Check for circular dependencies
  const cycles = findCircularDependencies(nodes, edges)
  cycles.forEach(cycle => {
    errors.push({
      id: `cycle-${cycle.join('-')}`,
      type: 'error',
      category: 'structure',
      message: `Circular dependency detected: ${cycle.join(' → ')}`,
      severity: 'critical',
      suggestion: 'Remove connections that create circular dependencies'
    })
  })
}

/**
 * Validate node configurations
 */
function validateNodeConfigurations(
  nodes: Node[], 
  errors: ValidationError[], 
  warnings: ValidationError[], 
  info: ValidationError[]
): void {
  nodes.forEach(node => {
    const config: Record<string, unknown> = (node.data.config as Record<string, unknown>) || {}
    
    switch (node.data.nodeType) {
      case 'email-trigger':
        validateEmailTriggerConfig(node, config, errors, warnings, info)
        break
      case 'trello-action':
        validateTrelloActionConfig(node, config, errors, warnings, info)
        break
      case 'asana-action':
        validateAsanaActionConfig(node, config, errors, warnings, info)
        break
      case 'condition':
        validateConditionConfig(node, config, errors, warnings, info)
        break
      case 'ai-classification':
        validateAIClassificationConfig(node, config, errors, warnings, info)
        break
      default:
        info.push({
          id: `unknown-type-${node.id}`,
          type: 'info',
          category: 'configuration',
          message: `Unknown node type: ${node.data.nodeType}`,
          nodeId: node.id,
          severity: 'low'
        })
    }
  })
}

/**
 * Validate email trigger configuration
 */
function validateEmailTriggerConfig(
  node: Node,
  config: Record<string, unknown>,
  errors: ValidationError[],
  warnings: ValidationError[],
  _info: ValidationError[]
): void {
  if (!config.emailFilters) {
    errors.push({
      id: `email-config-${node.id}`,
      type: 'error',
      category: 'configuration',
      message: `Email trigger "${node.data.label}" is not configured`,
      nodeId: node.id,
      severity: 'high',
      suggestion: 'Configure email filters (subject, sender, or keywords)'
    })
    return
  }

  const emailFilters = config.emailFilters as Record<string, unknown>
  const subject = emailFilters.subject as string
  const sender = emailFilters.sender as string
  const keywords = emailFilters.keywords as string[]
  
  if (!subject && !sender && (!keywords || keywords.length === 0)) {
    warnings.push({
      id: `email-filters-${node.id}`,
      type: 'warning',
      category: 'configuration',
      message: `Email trigger "${node.data.label}" has no filters configured`,
      nodeId: node.id,
      severity: 'medium',
      suggestion: 'Add at least one filter to avoid processing all emails'
    })
  }

  // Check for overly broad filters
  if (keywords && keywords.length > 10) {
    warnings.push({
      id: `too-many-keywords-${node.id}`,
      type: 'warning',
      category: 'configuration',
      message: `Email trigger "${node.data.label}" has too many keywords`,
      nodeId: node.id,
      severity: 'low',
      suggestion: 'Consider reducing keywords for better performance'
    })
  }
}

/**
 * Validate Trello action configuration
 */
function validateTrelloActionConfig(
  node: Node,
  config: Record<string, unknown>,
  errors: ValidationError[],
  warnings: ValidationError[],
  _info: ValidationError[]
): void {
  if (!config.board) {
    errors.push({
      id: `trello-board-${node.id}`,
      type: 'error',
      category: 'configuration',
      message: `Trello action "${node.data.label}" has no board selected`,
      nodeId: node.id,
      severity: 'high',
      suggestion: 'Select a Trello board for card creation'
    })
  }

  if (!config.list) {
    errors.push({
      id: `trello-list-${node.id}`,
      type: 'error',
      category: 'configuration',
      message: `Trello action "${node.data.label}" has no list selected`,
      nodeId: node.id,
      severity: 'high',
      suggestion: 'Select a list within the Trello board'
    })
  }

  const cardTemplate = config.cardTemplate as Record<string, unknown>
  if (!cardTemplate || !cardTemplate.title) {
    warnings.push({
      id: `trello-template-${node.id}`,
      type: 'warning',
      category: 'configuration',
      message: `Trello action "${node.data.label}" has no card title template`,
      nodeId: node.id,
      severity: 'medium',
      suggestion: 'Configure a title template for created cards'
    })
  }
}

/**
 * Validate Asana action configuration
 */
function validateAsanaActionConfig(
  node: Node,
  config: Record<string, unknown>,
  errors: ValidationError[],
  warnings: ValidationError[],
  _info: ValidationError[]
): void {
  // Check for task name template (required)
  if (!config.taskName) {
    errors.push({
      id: `asana-task-name-${node.id}`,
      type: 'error',
      category: 'configuration',
      message: `Asana action "${node.data.label}" has no task name template`,
      nodeId: node.id,
      severity: 'high',
      suggestion: 'Configure a task name template for created tasks'
    })
  }

  // Warn if no project is selected (optional but helpful)
  if (!config.projectId) {
    warnings.push({
      id: `asana-project-${node.id}`,
      type: 'warning',
      category: 'configuration',
      message: `Asana action "${node.data.label}" has no project selected`,
      nodeId: node.id,
      severity: 'low',
      suggestion: 'Consider selecting a project, or tasks will be created in the main dashboard'
    })
  }
}

/**
 * Validate condition configuration
 */
function validateConditionConfig(
  node: Node,
  config: Record<string, unknown>,
  errors: ValidationError[],
  _warnings: ValidationError[],
  _info: ValidationError[]
): void {
  const conditions = config.conditions as unknown[]
  if (!conditions || conditions.length === 0) {
    errors.push({
      id: `condition-empty-${node.id}`,
      type: 'error',
      category: 'configuration',
      message: `Condition node "${node.data.label}" has no conditions configured`,
      nodeId: node.id,
      severity: 'high',
      suggestion: 'Add at least one condition to evaluate'
    })
  }
}

/**
 * Validate AI classification configuration
 */
function validateAIClassificationConfig(
  node: Node,
  config: Record<string, unknown>,
  _errors: ValidationError[],
  warnings: ValidationError[],
  _info: ValidationError[]
): void {
  const classificationRules = config.classificationRules as unknown[]
  if (!classificationRules || classificationRules.length === 0) {
    warnings.push({
      id: `ai-rules-${node.id}`,
      type: 'warning',
      category: 'configuration',
      message: `AI classification "${node.data.label}" has no rules configured`,
      nodeId: node.id,
      severity: 'medium',
      suggestion: 'Configure classification rules for better accuracy'
    })
  }
}

/**
 * Validate connections between nodes
 */
function validateConnections(
  nodes: Node[], 
  edges: Edge[], 
  errors: ValidationError[], 
  warnings: ValidationError[], 
  _info: ValidationError[]
): void {
  const nodeMap = new Map(nodes.map(node => [node.id, node]))

  edges.forEach(edge => {
    const sourceNode = nodeMap.get(edge.source)
    const targetNode = nodeMap.get(edge.target)

    if (!sourceNode || !targetNode) {
      errors.push({
        id: `invalid-connection-${edge.id}`,
        type: 'error',
        category: 'connection',
        message: 'Connection references non-existent nodes',
        edgeId: edge.id,
        severity: 'critical',
        suggestion: 'Remove invalid connections'
      })
      return
    }

    // Validate connection types
    if (sourceNode.type === 'action' && targetNode.type === 'trigger') {
      errors.push({
        id: `invalid-flow-${edge.id}`,
        type: 'error',
        category: 'connection',
        message: 'Actions cannot connect to triggers',
        edgeId: edge.id,
        severity: 'high',
        suggestion: 'Connect triggers to actions, not the reverse'
      })
    }

    // Check for multiple connections from single-output nodes
    const outgoingEdges = edges.filter(e => e.source === sourceNode.id)
    if (sourceNode.type === 'trigger' && outgoingEdges.length > 3) {
      warnings.push({
        id: `many-connections-${sourceNode.id}`,
        type: 'warning',
        category: 'connection',
        message: `Trigger "${sourceNode.data.label}" has many outgoing connections`,
        nodeId: sourceNode.id,
        severity: 'low',
        suggestion: 'Consider using condition nodes to organize complex flows'
      })
    }
  })
}

/**
 * Validate logic flow
 */
function validateLogicFlow(
  nodes: Node[], 
  edges: Edge[], 
  _errors: ValidationError[], 
  warnings: ValidationError[], 
  info: ValidationError[]
): void {
  // Check for dead ends (action nodes with no follow-up)
  const actionNodes = nodes.filter(node => node.type === 'action')
  const hasOutgoingConnection = (nodeId: string) => 
    edges.some(edge => edge.source === nodeId)

  actionNodes.forEach(node => {
    if (!hasOutgoingConnection(node.id)) {
      info.push({
        id: `dead-end-${node.id}`,
        type: 'info',
        category: 'logic',
        message: `Action "${node.data.label}" has no follow-up actions`,
        nodeId: node.id,
        severity: 'low',
        suggestion: 'This is fine if this action completes your workflow'
      })
    }
  })

  // Check for condition nodes without both branches
  const conditionNodes = nodes.filter(node => node.data.nodeType === 'condition')
  conditionNodes.forEach(node => {
    const outgoingEdges = edges.filter(edge => edge.source === node.id)
    if (outgoingEdges.length < 2) {
      warnings.push({
        id: `incomplete-condition-${node.id}`,
        type: 'warning',
        category: 'logic',
        message: `Condition "${node.data.label}" should have both true and false branches`,
        nodeId: node.id,
        severity: 'medium',
        suggestion: 'Add connections for both condition outcomes'
      })
    }
  })
}

/**
 * Validate performance considerations
 */
function validatePerformance(
  nodes: Node[], 
  edges: Edge[], 
  _errors: ValidationError[], 
  warnings: ValidationError[], 
  _info: ValidationError[]
): void {
  // Check workflow complexity
  if (nodes.length > 20) {
    warnings.push({
      id: 'complex-workflow',
      type: 'warning',
      category: 'structure',
      message: 'Workflow is quite complex with many nodes',
      severity: 'low',
      suggestion: 'Consider breaking into smaller workflows for better maintainability'
    })
  }

  // Check for too many parallel actions
  const triggerNodes = nodes.filter(node => node.type === 'trigger')
  triggerNodes.forEach(trigger => {
    const directActions = edges
      .filter(edge => edge.source === trigger.id)
      .map(edge => nodes.find(node => node.id === edge.target))
      .filter(node => node?.type === 'action')

    if (directActions.length > 5) {
      warnings.push({
        id: `many-parallel-${trigger.id}`,
        type: 'warning',
        category: 'logic',
        message: `Trigger "${trigger.data.label}" has many parallel actions`,
        nodeId: trigger.id,
        severity: 'medium',
        suggestion: 'Consider using condition nodes to sequence actions'
      })
    }
  })
}

/**
 * Find nodes reachable from triggers
 */
function findReachableNodes(nodes: Node[], edges: Edge[], triggerNodes: Node[]): Set<string> {
  const reachable = new Set<string>()
  const visited = new Set<string>()
  
  function dfs(nodeId: string) {
    if (visited.has(nodeId)) return
    visited.add(nodeId)
    reachable.add(nodeId)
    
    const outgoingEdges = edges.filter(edge => edge.source === nodeId)
    outgoingEdges.forEach(edge => dfs(edge.target))
  }
  
  triggerNodes.forEach(trigger => dfs(trigger.id))
  return reachable
}

/**
 * Find circular dependencies
 */
function findCircularDependencies(nodes: Node[], edges: Edge[]): string[][] {
  const cycles: string[][] = []
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  const path: string[] = []
  
  function dfs(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) {
      // Found cycle, extract it from path
      const cycleStart = path.indexOf(nodeId)
      if (cycleStart !== -1) {
        cycles.push([...path.slice(cycleStart), nodeId])
      }
      return true
    }
    
    if (visited.has(nodeId)) return false
    
    visited.add(nodeId)
    recursionStack.add(nodeId)
    path.push(nodeId)
    
    const outgoingEdges = edges.filter(edge => edge.source === nodeId)
    for (const edge of outgoingEdges) {
      if (dfs(edge.target)) {
        return true
      }
    }
    
    recursionStack.delete(nodeId)
    path.pop()
    return false
  }
  
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id)
    }
  })
  
  return cycles
}

/**
 * Calculate workflow quality score
 */
function calculateQualityScore(
  errors: ValidationError[], 
  warnings: ValidationError[], 
  _info: ValidationError[]
): number {
  let score = 100
  
  // Deduct points for errors
  errors.forEach(error => {
    switch (error.severity) {
      case 'critical': score -= 25; break
      case 'high': score -= 15; break
      case 'medium': score -= 10; break
      case 'low': score -= 5; break
    }
  })
  
  // Deduct points for warnings
  warnings.forEach(warning => {
    switch (warning.severity) {
      case 'critical': score -= 15; break
      case 'high': score -= 10; break
      case 'medium': score -= 5; break
      case 'low': score -= 2; break
    }
  })
  
  return Math.max(0, Math.min(100, score))
}

/**
 * Get validation summary
 */
export function getValidationSummary(result: ValidationResult): string {
  const { errors, warnings, info: _info, score } = result
  
  if (errors.length === 0 && warnings.length === 0) {
    return `Workflow is valid (Score: ${score}/100)`
  }
  
  const parts = []
  if (errors.length > 0) {
    parts.push(`${errors.length} error${errors.length > 1 ? 's' : ''}`)
  }
  if (warnings.length > 0) {
    parts.push(`${warnings.length} warning${warnings.length > 1 ? 's' : ''}`)
  }
  if (_info.length > 0) {
    parts.push(`${_info.length} info`)
  }
  
  return `${parts.join(', ')} (Score: ${score}/100)`
}