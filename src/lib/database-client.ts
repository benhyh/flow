/**
 * Database Client for Workflow Execution Manager
 * Provides type-safe access to Supabase database operations
 */

import { supabase } from './supabase-client'
import type {
  Workflow,
  Node,
  NodeConnection,
  UserCredential,
  WorkflowExecution,
  NodeExecutionResult,
  CompleteWorkflow,
  WorkflowWithExecution,
  ExecutionOrder,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  CreateNodeRequest,
  UpdateNodeRequest,
  CreateConnectionRequest,
  SaveCredentialsRequest,
  StartExecutionRequest,
  WorkflowValidation,
  WorkflowStats,
  ExecutionStats,
  DatabaseResponse,
  PaginatedResponse,
  NodeType,
  ServiceType,
  ExecutionStatus,
  TriggerNodeConfig,
  TrelloNodeConfig,
  AsanaNodeConfig,
  GmailNodeConfig,
  AINodeConfig,
  LogicNodeConfig
} from '@/types/database'

// =============================================================================
// WORKFLOW OPERATIONS
// =============================================================================

export class WorkflowDatabaseClient {
  /**
   * Get all workflows for a user
   */
  static async getUserWorkflows(userId: string): Promise<DatabaseResponse<Workflow[]>> {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('user_id', userId)
        .order('last_modified_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Get a specific workflow
   */
  static async getWorkflow(workflowId: string, userId: string): Promise<DatabaseResponse<Workflow>> {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Create a new workflow
   */
  static async createWorkflow(
    userId: string,
    request: CreateWorkflowRequest
  ): Promise<DatabaseResponse<Workflow>> {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .insert({
          user_id: userId,
          name: request.name,
          description: request.description
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Update a workflow
   */
  static async updateWorkflow(
    workflowId: string,
    userId: string,
    request: UpdateWorkflowRequest
  ): Promise<DatabaseResponse<Workflow>> {
    try {
      console.log('🔍 [DATABASE CLIENT] Updating workflow with request:', {
        workflowId,
        userId,
        request
      })
      
      const { data, error } = await supabase
        .from('workflows')
        .update(request)
        .eq('id', workflowId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('❌ [DATABASE CLIENT] Supabase error updating workflow:', {
          error: JSON.stringify(error, null, 2),
          workflowId,
          userId,
          request: JSON.stringify(request, null, 2),
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint
        })
        throw error
      }
      
      console.log('✅ [DATABASE CLIENT] Workflow updated successfully:', data)
      return { data, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const fullError = error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error
      
      console.error('💥 [DATABASE CLIENT] Workflow update failed:', {
        error: fullError,
        workflowId,
        userId,
        request
      })
      
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Delete a workflow
   */
  static async deleteWorkflow(workflowId: string, userId: string): Promise<DatabaseResponse<void>> {
    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', workflowId)
        .eq('user_id', userId)

      if (error) throw error
      return { data: undefined, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // =============================================================================
  // NODE OPERATIONS
  // =============================================================================

  /**
   * Get all nodes for a workflow
   */
  static async getWorkflowNodes(workflowId: string): Promise<DatabaseResponse<Node[]>> {
    try {
      const { data, error } = await supabase
        .from('nodes')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('created_at')

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Create a new node
   */
  static async createNode(request: CreateNodeRequest): Promise<DatabaseResponse<Node>> {
    try {
      console.log('🔍 [DATABASE CLIENT] Creating node with request:', request)
      
      const { data, error } = await supabase
        .from('nodes')
        .insert(request)
        .select()
        .single()

      if (error) {
        console.error('❌ [DATABASE CLIENT] Supabase error creating node:', {
          error,
          request,
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint
        })
        throw error
      }
      
      console.log('✅ [DATABASE CLIENT] Node created successfully:', data)
      return { data, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const fullError = error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error
      
      console.error('💥 [DATABASE CLIENT] Node creation failed:', {
        error: fullError,
        request
      })
      
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Update a node
   */
  static async updateNode(
    nodeId: string,
    request: UpdateNodeRequest
  ): Promise<DatabaseResponse<Node>> {
    try {
      const { data, error } = await supabase
        .from('nodes')
        .update(request)
        .eq('id', nodeId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Delete a node
   */
  static async deleteNode(nodeId: string): Promise<DatabaseResponse<void>> {
    try {
      const { error } = await supabase
        .from('nodes')
        .delete()
        .eq('id', nodeId)

      if (error) throw error
      return { data: undefined, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // =============================================================================
  // CONNECTION OPERATIONS
  // =============================================================================

  /**
   * Get all connections for a workflow
   */
  static async getWorkflowConnections(workflowId: string): Promise<DatabaseResponse<NodeConnection[]>> {
    // Connections are deprecated; return empty list to avoid 404s when endpoint removed
    return { data: [], error: null }
  }

  /**
   * Create a new connection
   */
  static async createConnection(request: CreateConnectionRequest): Promise<DatabaseResponse<NodeConnection>> {
    // No-op for deprecated connections API
    return { data: null as any, error: null }
  }

  /**
   * Delete a connection
   */
  static async deleteConnection(connectionId: string): Promise<DatabaseResponse<void>> {
    // No-op for deprecated connections API
    return { data: undefined, error: null }
  }

  // =============================================================================
  // NODE CONFIGURATION OPERATIONS
  // =============================================================================

  /**
   * Save Trello node configuration
   */
  static async saveTrelloConfig(config: Omit<TrelloNodeConfig, 'id' | 'created_at'>): Promise<DatabaseResponse<TrelloNodeConfig>> {
    try {
      const { data, error } = await supabase
        .from('trello_node_configs')
        .upsert(config, { onConflict: 'node_id' })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Save Asana node configuration
   */
  static async saveAsanaConfig(config: Omit<AsanaNodeConfig, 'id' | 'created_at'>): Promise<DatabaseResponse<AsanaNodeConfig>> {
    try {
      const { data, error } = await supabase
        .from('asana_node_configs')
        .upsert(config, { onConflict: 'node_id' })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Save Gmail node configuration
   */
  static async saveGmailConfig(config: Omit<GmailNodeConfig, 'id' | 'created_at'>): Promise<DatabaseResponse<GmailNodeConfig>> {
    try {
      const { data, error } = await supabase
        .from('gmail_node_configs')
        .upsert(config, { onConflict: 'node_id' })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Save AI node configuration
   */
  static async saveAIConfig(config: Omit<AINodeConfig, 'id' | 'created_at'>): Promise<DatabaseResponse<AINodeConfig>> {
    try {
      const { data, error } = await supabase
        .from('ai_node_configs')
        .upsert(config, { onConflict: 'node_id' })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Save Logic node configuration
   */
  static async saveLogicConfig(config: Omit<LogicNodeConfig, 'id' | 'created_at'>): Promise<DatabaseResponse<LogicNodeConfig>> {
    try {
      const { data, error } = await supabase
        .from('logic_node_configs')
        .upsert(config, { onConflict: 'node_id' })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Save Trigger node configuration
   */
  static async saveTriggerConfig(config: Omit<TriggerNodeConfig, 'id' | 'created_at'>): Promise<DatabaseResponse<TriggerNodeConfig>> {
    try {
      const { data, error } = await supabase
        .from('trigger_node_configs')
        .upsert(config, { onConflict: 'node_id' })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Create Trigger node configuration
   */
  static async createTriggerConfig(config: Omit<TriggerNodeConfig, 'id' | 'created_at'>): Promise<DatabaseResponse<TriggerNodeConfig>> {
    try {
      const { data, error } = await supabase
        .from('trigger_node_configs')
        .insert(config)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Update Trigger node configuration
   */
  static async updateTriggerConfig(nodeId: string, config: Partial<Omit<TriggerNodeConfig, 'id' | 'node_id' | 'created_at'>>): Promise<DatabaseResponse<TriggerNodeConfig>> {
    try {
      const { data, error } = await supabase
        .from('trigger_node_configs')
        .update(config)
        .eq('node_id', nodeId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Get Trigger node configuration
   */
  static async getTriggerConfig(nodeId: string): Promise<DatabaseResponse<TriggerNodeConfig>> {
    try {
      const { data, error } = await supabase
        .from('trigger_node_configs')
        .select('*')
        .eq('node_id', nodeId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Create Trello node configuration
   */
  static async createTrelloConfig(config: Omit<TrelloNodeConfig, 'id' | 'created_at'>): Promise<DatabaseResponse<TrelloNodeConfig>> {
    try {
      const { data, error } = await supabase
        .from('trello_node_configs')
        .insert(config)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Update Trello node configuration
   */
  static async updateTrelloConfig(nodeId: string, config: Partial<Omit<TrelloNodeConfig, 'id' | 'node_id' | 'created_at'>>): Promise<DatabaseResponse<TrelloNodeConfig>> {
    try {
      const { data, error } = await supabase
        .from('trello_node_configs')
        .update(config)
        .eq('node_id', nodeId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Get Trello node configuration
   */
  static async getTrelloConfig(nodeId: string): Promise<DatabaseResponse<TrelloNodeConfig>> {
    try {
      const { data, error } = await supabase
        .from('trello_node_configs')
        .select('*')
        .eq('node_id', nodeId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Create Asana node configuration
   */
  static async createAsanaConfig(config: Omit<AsanaNodeConfig, 'id' | 'created_at'>): Promise<DatabaseResponse<AsanaNodeConfig>> {
    try {
      const { data, error } = await supabase
        .from('asana_node_configs')
        .insert(config)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Update Asana node configuration
   */
  static async updateAsanaConfig(nodeId: string, config: Partial<Omit<AsanaNodeConfig, 'id' | 'node_id' | 'created_at'>>): Promise<DatabaseResponse<AsanaNodeConfig>> {
    try {
      const { data, error } = await supabase
        .from('asana_node_configs')
        .update(config)
        .eq('node_id', nodeId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Get Asana node configuration
   */
  static async getAsanaConfig(nodeId: string): Promise<DatabaseResponse<AsanaNodeConfig>> {
    try {
      const { data, error } = await supabase
        .from('asana_node_configs')
        .select('*')
        .eq('node_id', nodeId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Create Gmail node configuration
   */
  static async createGmailConfig(config: Omit<GmailNodeConfig, 'id' | 'created_at'>): Promise<DatabaseResponse<GmailNodeConfig>> {
    try {
      const { data, error } = await supabase
        .from('gmail_node_configs')
        .insert(config)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Update Gmail node configuration
   */
  static async updateGmailConfig(nodeId: string, config: Partial<Omit<GmailNodeConfig, 'id' | 'node_id' | 'created_at'>>): Promise<DatabaseResponse<GmailNodeConfig>> {
    try {
      const { data, error } = await supabase
        .from('gmail_node_configs')
        .update(config)
        .eq('node_id', nodeId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Get Gmail node configuration
   */
  static async getGmailConfig(nodeId: string): Promise<DatabaseResponse<GmailNodeConfig>> {
    try {
      const { data, error } = await supabase
        .from('gmail_node_configs')
        .select('*')
        .eq('node_id', nodeId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Create AI node configuration
   */
  static async createAIConfig(config: Omit<AINodeConfig, 'id' | 'created_at'>): Promise<DatabaseResponse<AINodeConfig>> {
    try {
      const { data, error } = await supabase
        .from('ai_node_configs')
        .insert(config)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Update AI node configuration
   */
  static async updateAIConfig(nodeId: string, config: Partial<Omit<AINodeConfig, 'id' | 'node_id' | 'created_at'>>): Promise<DatabaseResponse<AINodeConfig>> {
    try {
      const { data, error } = await supabase
        .from('ai_node_configs')
        .update(config)
        .eq('node_id', nodeId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Get AI node configuration
   */
  static async getAIConfig(nodeId: string): Promise<DatabaseResponse<AINodeConfig>> {
    try {
      const { data, error } = await supabase
        .from('ai_node_configs')
        .select('*')
        .eq('node_id', nodeId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Create Logic node configuration
   */
  static async createLogicConfig(config: Omit<LogicNodeConfig, 'id' | 'created_at'>): Promise<DatabaseResponse<LogicNodeConfig>> {
    try {
      const { data, error } = await supabase
        .from('logic_node_configs')
        .insert(config)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Update Logic node configuration
   */
  static async updateLogicConfig(nodeId: string, config: Partial<Omit<LogicNodeConfig, 'id' | 'node_id' | 'created_at'>>): Promise<DatabaseResponse<LogicNodeConfig>> {
    try {
      const { data, error } = await supabase
        .from('logic_node_configs')
        .update(config)
        .eq('node_id', nodeId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Get Logic node configuration
   */
  static async getLogicConfig(nodeId: string): Promise<DatabaseResponse<LogicNodeConfig>> {
    try {
      const { data, error } = await supabase
        .from('logic_node_configs')
        .select('*')
        .eq('node_id', nodeId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // =============================================================================
  // CREDENTIAL OPERATIONS
  // =============================================================================

  /**
   * Save user credentials
   */
  static async saveCredentials(
    userId: string,
    request: SaveCredentialsRequest
  ): Promise<DatabaseResponse<UserCredential>> {
    try {
      // In a real implementation, you would encrypt the tokens here
      const { data, error } = await supabase
        .from('user_credentials')
        .upsert({
          user_id: userId,
          service_type: request.service_type,
          encrypted_access_token: request.access_token, // Should be encrypted
          encrypted_refresh_token: request.refresh_token, // Should be encrypted
          expires_at: request.expires_at
        }, { onConflict: 'user_id,service_type' })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Get user credentials for a service
   */
  static async getCredentials(
    userId: string,
    serviceType: ServiceType
  ): Promise<DatabaseResponse<UserCredential>> {
    try {
      const { data, error } = await supabase
        .from('user_credentials')
        .select('*')
        .eq('user_id', userId)
        .eq('service_type', serviceType)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Delete user credentials
   */
  static async deleteCredentials(
    userId: string,
    serviceType: ServiceType
  ): Promise<DatabaseResponse<void>> {
    try {
      const { error } = await supabase
        .from('user_credentials')
        .delete()
        .eq('user_id', userId)
        .eq('service_type', serviceType)

      if (error) throw error
      return { data: undefined, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // =============================================================================
  // EXECUTION OPERATIONS
  // =============================================================================

  /**
   * Check if user has a running execution
   */
  static async hasRunningExecution(userId: string): Promise<DatabaseResponse<boolean>> {
    try {
      const { data, error } = await supabase
        .rpc('has_running_execution', { user_uuid: userId })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Start a workflow execution
   */
  static async startExecution(
    userId: string,
    request: StartExecutionRequest
  ): Promise<DatabaseResponse<WorkflowExecution>> {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .insert({
          workflow_id: request.workflow_id,
          user_id: userId,
          trigger_data: request.trigger_data || {}
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Update execution status
   */
  static async updateExecutionStatus(
    executionId: string,
    status: ExecutionStatus,
    finalOutput?: Record<string, any>,
    errorMessage?: string,
    executionTimeMs?: number
  ): Promise<DatabaseResponse<WorkflowExecution>> {
    try {
      const updateData: any = { status }
      
      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        updateData.completed_at = new Date().toISOString()
      }
      
      if (finalOutput) updateData.final_output = finalOutput
      if (errorMessage) updateData.error_message = errorMessage
      if (executionTimeMs) updateData.total_execution_time_ms = executionTimeMs

      const { data, error } = await supabase
        .from('workflow_executions')
        .update(updateData)
        .eq('id', executionId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Save node execution result
   */
  static async saveNodeResult(
    executionId: string,
    nodeId: string,
    executionOrder: number,
    outputData: Record<string, any>,
    executionTimeMs?: number
  ): Promise<DatabaseResponse<NodeExecutionResult>> {
    try {
      const { data, error } = await supabase
        .from('node_execution_results')
        .insert({
          workflow_execution_id: executionId,
          node_id: nodeId,
          execution_order: executionOrder,
          output_data: outputData,
          execution_time_ms: executionTimeMs
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Get execution history for a user
   */
  static async getExecutionHistory(
    userId: string,
    limit: number = 50
  ): Promise<DatabaseResponse<WorkflowWithExecution[]>> {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select(`
          *,
          workflows!inner(name),
          node_execution_results(*)
        `)
        .eq('user_id', userId)
        .gte('started_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('started_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // =============================================================================
  // UTILITY OPERATIONS
  // =============================================================================

  /**
   * Get execution order for a workflow
   */
  static async getExecutionOrder(workflowId: string): Promise<DatabaseResponse<ExecutionOrder[]>> {
    try {
      const { data, error } = await supabase
        .rpc('get_workflow_execution_order', { workflow_uuid: workflowId })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Run cleanup of old executions
   */
  static async cleanupOldExecutions(): Promise<DatabaseResponse<void>> {
    try {
      const { error } = await supabase.rpc('cleanup_old_executions')
      if (error) throw error
      return { data: undefined, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Get workflow statistics for a user
   */
  static async getWorkflowStats(userId: string): Promise<DatabaseResponse<WorkflowStats>> {
    try {
      const { data, error } = await supabase
        .rpc('get_workflow_stats', { user_uuid: userId })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Get execution statistics for a user
   */
  static async getExecutionStats(userId: string): Promise<DatabaseResponse<ExecutionStats>> {
    try {
      const { data, error } = await supabase
        .rpc('get_execution_stats', { user_uuid: userId })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

// =============================================================================
// EXPORT DEFAULT INSTANCE
// =============================================================================

export default WorkflowDatabaseClient
