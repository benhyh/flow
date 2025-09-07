/**
 * WorkflowService - Core service for managing workflows with Supabase
 * 
 * Phase 1.3a: Basic WorkflowService Foundation
 * Source: DATABASE.md Enhanced Implementation Code Structure
 * 
 * Provides:
 * - Basic workflow CRUD operations
 * - Integration token management  
 * - Simple encryption/decryption
 * - localStorage migration utilities
 */

import { type Node, type Edge } from '@xyflow/react'
import { supabase } from '@/lib/supabase-client'
import { type WorkflowState } from '@/components/workflow/toolbar/WorkflowToolbar'
import { type StoredWorkflow } from '@/lib/workflow-storage'
import { validateWorkflow, type ValidationResult } from '@/components/workflow/utils/workflowValidation'

// React Flow type definitions for better type safety
export type ReactFlowNode = Node
export type ReactFlowEdge = Edge

// ===================
// Type Definitions
// ===================

export interface SupabaseWorkflow {
  id: string
  user_id: string // Use user_id to match simplified schema
  name: string
  description?: string
  nodes: ReactFlowNode[] // React Flow Node array
  edges: ReactFlowEdge[] // React Flow Edge array
  is_active: boolean
  validation_result?: ValidationResult
  quality_score?: number
  last_executed_at?: string
  execution_count?: number
  node_count?: number // Generated column for performance
  edge_count?: number // Generated column for performance
  created_at: string
  updated_at: string
}

export interface WorkflowCreateInput {
  name: string
  description?: string
  nodes: ReactFlowNode[] // React Flow Node array
  edges: ReactFlowEdge[] // React Flow Edge array
  is_active?: boolean
  validate?: boolean // Auto-validate on creation
}

export interface WorkflowUpdateInput {
  name?: string
  description?: string
  nodes?: ReactFlowNode[] // React Flow Node array
  edges?: ReactFlowEdge[] // React Flow Edge array
  is_active?: boolean
}

export interface IntegrationTokens {
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  scopes?: string[]
}

export interface UserIntegration {
  id: string
  user_id: string
  provider: 'gmail' | 'google' | 'trello' | 'asana'
  access_token: string
  refresh_token?: string
  token_expires_at?: string
  provider_user_id?: string
  provider_email?: string
  scopes?: string[]
  is_active: boolean
  last_used_at?: string
  error_count: number
  last_error?: string
  created_at: string
  updated_at: string
}

export interface WorkflowExecution {
  id: string
  workflow_id: string
  status: 'running' | 'success' | 'failed' | 'cancelled'
  started_at: string
  completed_at?: string
  duration?: number
  trigger_data?: any
  result?: any
  error?: string
  node_results?: Record<string, any>
}

export interface ExecutionMetrics {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  averageDuration: number
  lastExecutedAt?: string
  successRate: number
}

// ===================
// WorkflowService Class
// ===================

export class WorkflowService {
  private supabase = supabase

  // ===================
  // Workflow CRUD Operations (Phase 1.3b)
  // ===================

  /**
   * Create a new workflow with optional validation
   */
  async createWorkflow(input: WorkflowCreateInput): Promise<SupabaseWorkflow> {
    console.log('[WorkflowService] createWorkflow called with input:', {
      name: input.name,
      description: input.description,
      nodeCount: input.nodes.length,
      edgeCount: input.edges.length,
      isActive: input.is_active,
      validate: input.validate
    })

    const { data: { user }, error: authError } = await this.supabase.auth.getUser()
    
    if (authError) {
      console.error('[WorkflowService] Auth error:', authError)
      throw new Error(`Authentication error: ${authError.message}`)
    }
    
    if (!user) {
      console.error('[WorkflowService] User not authenticated')
      throw new Error('User not authenticated')
    }

    console.log('[WorkflowService] User authenticated:', {
      id: user.id,
      email: user.email,
      role: user.role
    })

    // Validate workflow if requested (default: true for enhanced experience)
    let validationResult: ValidationResult | null = null
    let qualityScore: number | null = null

    if (input.validate !== false) {
      console.log('[WorkflowService] Running workflow validation...')
      validationResult = validateWorkflow(input.nodes, input.edges)
      qualityScore = validationResult.score
      
      // Log validation results for debugging
      console.log(`[WorkflowService] Workflow validation score: ${qualityScore}/100`)
      if (validationResult.errors.length > 0) {
        console.warn('[WorkflowService] Workflow validation errors:', validationResult.errors)
      }
    } else {
      console.log('[WorkflowService] Skipping validation (validate: false)')
    }

    const workflowData = {
      user_id: user.id, // Use user_id to match simplified schema
      name: input.name,
      description: input.description,
      nodes: input.nodes,
      edges: input.edges,
      is_active: input.is_active ?? false,
      validation_result: validationResult,
      quality_score: qualityScore,
      execution_count: 0
    }

    console.log('[WorkflowService] Inserting workflow data into Supabase:', {
      user_id: workflowData.user_id,
      name: workflowData.name,
      nodeCount: workflowData.nodes.length,
      edgeCount: workflowData.edges.length,
      is_active: workflowData.is_active
    })

    const { data, error } = await this.supabase
      .from('workflows')
      .insert([workflowData])
      .select()
      .single()

    if (error) {
      console.error('[WorkflowService] Supabase error creating workflow:', error)
      throw new Error(`Failed to create workflow: ${error.message}`)
    }

    if (!data) {
      console.error('[WorkflowService] Supabase returned null data when creating workflow')
      throw new Error('Supabase returned null data when creating workflow')
    }

    console.log('[WorkflowService] Workflow created successfully:', {
      id: data.id,
      name: data.name,
      created_at: data.created_at
    })

    return data as SupabaseWorkflow
  }

  /**
   * Get user's workflows
   */
  async getUserWorkflows(): Promise<SupabaseWorkflow[]> {
    console.log('[WorkflowService] getUserWorkflows called')

    const { data: { user } } = await this.supabase.auth.getUser()
    
    if (!user) {
      console.error('[WorkflowService] User not authenticated')
      throw new Error('User not authenticated')
    }

    console.log('[WorkflowService] User authenticated:', user.id)

    const { data, error } = await this.supabase
      .from('workflows')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[WorkflowService] Supabase error fetching workflows:', error)
      throw new Error(`Failed to fetch workflows: ${error.message}`)
    }

    console.log('[WorkflowService] Retrieved workflows:', {
      count: data?.length || 0,
      workflows: data?.map(w => ({ id: w.id, name: w.name, is_active: w.is_active }))
    })

    return (data || []) as SupabaseWorkflow[]
  }

  /**
   * Get a specific workflow by ID
   */
  async getWorkflow(id: string): Promise<SupabaseWorkflow> {
    const { data: { user } } = await this.supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await this.supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Supabase error fetching workflow:', error)
      throw new Error(`Failed to fetch workflow: ${error.message}`)
    }

    if (!data) {
      throw new Error(`Workflow with ID ${id} not found`)
    }

    return data as SupabaseWorkflow
  }

  /**
   * Update a workflow
   */
  async updateWorkflow(id: string, input: WorkflowUpdateInput): Promise<SupabaseWorkflow> {
    console.log('[WorkflowService] updateWorkflow called with:', {
      id,
      input: {
        name: input.name,
        description: input.description,
        nodeCount: input.nodes?.length,
        edgeCount: input.edges?.length,
        isActive: input.is_active
      }
    })

    const { data: { user } } = await this.supabase.auth.getUser()
    
    if (!user) {
      console.error('[WorkflowService] User not authenticated')
      throw new Error('User not authenticated')
    }

    console.log('[WorkflowService] User authenticated:', user.id)

    const { data, error } = await this.supabase
      .from('workflows')
      .update(input)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('[WorkflowService] Supabase error updating workflow:', error)
      throw new Error(`Failed to update workflow: ${error.message}`)
    }

    if (!data) {
      console.error(`[WorkflowService] Workflow with ID ${id} not found or could not be updated`)
      throw new Error(`Workflow with ID ${id} not found or could not be updated`)
    }

    console.log('[WorkflowService] Workflow updated successfully:', {
      id: data.id,
      name: data.name,
      updated_at: data.updated_at
    })

    return data as SupabaseWorkflow
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(id: string): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { error } = await this.supabase
      .from('workflows')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Supabase error deleting workflow:', error)
      throw new Error(`Failed to delete workflow: ${error.message}`)
    }

    return true
  }

  // ===================
  // Integration Token Management (Phase 1.3c)
  // ===================

  /**
   * Save OAuth integration tokens (encrypted)
   */
  async saveIntegrationTokens(
    provider: 'gmail' | 'google' | 'trello' | 'asana',
    tokens: IntegrationTokens,
    metadata?: {
      providerUserId?: string
      providerEmail?: string
    }
  ): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { error } = await this.supabase
        .from('user_integrations')
        .upsert({
          user_id: user.id, // This should stay as user_id since schema uses user_id
          provider,
          access_token: await this.encrypt(tokens.accessToken),
          refresh_token: tokens.refreshToken ? await this.encrypt(tokens.refreshToken) : null,
          token_expires_at: tokens.expiresAt?.toISOString(),
          provider_user_id: metadata?.providerUserId,
          provider_email: metadata?.providerEmail,
          scopes: tokens.scopes,
          is_active: true,
          last_used_at: new Date().toISOString(),
          error_count: 0,
          last_error: null
        })

      if (error) {
        console.error('Error saving integration tokens:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in saveIntegrationTokens:', error)
      return false
    }
  }

  /**
   * Get OAuth integration tokens (decrypted)
   */
  async getIntegrationTokens(provider: 'gmail' | 'google' | 'trello' | 'asana'): Promise<IntegrationTokens | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await this.supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id) // This is correct - user_integrations uses user_id
        .eq('provider', provider)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        return null
      }

      const integration = data as UserIntegration

      return {
        accessToken: await this.decrypt(integration.access_token),
        refreshToken: integration.refresh_token ? await this.decrypt(integration.refresh_token) : undefined,
        expiresAt: integration.token_expires_at ? new Date(integration.token_expires_at) : undefined,
        scopes: integration.scopes || []
      }
    } catch (error) {
      console.error('Error in getIntegrationTokens:', error)
      return null
    }
  }

  // ===================
  // Simple Encryption/Decryption (Phase 1.3d)
  // ===================

  /**
   * Simple encryption for tokens (MVP implementation)
   * Note: In production, use Supabase Vault or proper encryption
   */
  private async encrypt(text: string): Promise<string> {
    // MVP: Simple base64 encoding (NOT secure for production)
    // TODO: Replace with proper encryption in production
    return btoa(text)
  }

  /**
   * Simple decryption for tokens (MVP implementation)
   */
  private async decrypt(encryptedText: string): Promise<string> {
    // MVP: Simple base64 decoding (NOT secure for production)
    // TODO: Replace with proper decryption in production
    return atob(encryptedText)
  }

  // ===================
  // Phase 2.1b: Execution Tracking & Analytics
  // ===================

  /**
   * Record workflow execution start
   */
  async startExecution(workflowId: string, triggerData?: any): Promise<string | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await this.supabase
        .from('execution_logs')
        .insert([{
          workflow_id: workflowId,
          status: 'running',
          trigger_data: triggerData,
          executed_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Error starting execution:', error)
        return null
      }

      return data.id
    } catch (error) {
      console.error('Error in startExecution:', error)
      return null
    }
  }

  /**
   * Complete workflow execution
   */
  async completeExecution(
    executionId: string, 
    status: 'success' | 'failed' | 'cancelled',
    result?: any,
    error?: string,
    nodeResults?: Record<string, any>
  ): Promise<boolean> {
    try {
      const startTime = new Date()
      const duration = Date.now() - startTime.getTime()

      const { error: updateError } = await this.supabase
        .from('execution_logs')
        .update({
          status,
          result: { ...result, nodeResults },
          error,
          duration
        })
        .eq('id', executionId)

      if (updateError) {
        console.error('Error completing execution:', updateError)
        return false
      }

      // Update workflow execution count and last executed time
      const { data: executionLog } = await this.supabase
        .from('execution_logs')
        .select('workflow_id')
        .eq('id', executionId)
        .single()

      if (executionLog) {
        // Update execution count manually since Supabase client doesn't have sql method
        const { data: currentWorkflow } = await this.supabase
          .from('workflows')
          .select('execution_count')
          .eq('id', executionLog.workflow_id)
          .single()
        
        if (currentWorkflow) {
          await this.supabase
            .from('workflows')
            .update({
              last_executed_at: new Date().toISOString(),
              execution_count: (currentWorkflow.execution_count || 0) + 1
            })
            .eq('id', executionLog.workflow_id)
        }
      }

      return true
    } catch (error) {
      console.error('Error in completeExecution:', error)
      return false
    }
  }

  /**
   * Get execution metrics for a workflow
   */
  async getExecutionMetrics(workflowId: string): Promise<ExecutionMetrics | null> {
    try {
      const { data: executions, error } = await this.supabase
        .from('execution_logs')
        .select('status, duration, executed_at')
        .eq('workflow_id', workflowId)
        .order('executed_at', { ascending: false })

      if (error) {
        console.error('Error fetching execution metrics:', error)
        return null
      }

      const totalExecutions = executions.length
      const successfulExecutions = executions.filter(e => e.status === 'success').length
      const failedExecutions = executions.filter(e => e.status === 'failed').length
      
      const durations = executions
        .filter(e => e.duration && e.duration > 0)
        .map(e => e.duration!)
      
      const averageDuration = durations.length > 0 
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
        : 0

      const successRate = totalExecutions > 0 
        ? (successfulExecutions / totalExecutions) * 100 
        : 0

      const lastExecutedAt = executions.length > 0 ? executions[0].executed_at : undefined

      return {
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        averageDuration,
        lastExecutedAt,
        successRate
      }
    } catch (error) {
      console.error('Error in getExecutionMetrics:', error)
      return null
    }
  }

  /**
   * Get recent executions for a workflow
   */
  async getRecentExecutions(workflowId: string, limit: number = 10): Promise<WorkflowExecution[]> {
    try {
      const { data: executions, error } = await this.supabase
        .from('execution_logs')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('executed_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching recent executions:', error)
        return []
      }

      return executions.map(execution => ({
        id: execution.id,
        workflow_id: execution.workflow_id,
        status: execution.status,
        started_at: execution.executed_at,
        completed_at: execution.status !== 'running' ? execution.executed_at : undefined,
        duration: execution.duration,
        trigger_data: execution.trigger_data,
        result: execution.result?.result || execution.result,
        error: execution.error,
        node_results: execution.result?.nodeResults
      }))
    } catch (error) {
      console.error('Error in getRecentExecutions:', error)
      return []
    }
  }

  /**
   * Validate and update workflow quality score
   */
  async updateWorkflowValidation(workflowId: string): Promise<ValidationResult | null> {
    try {
      // Get current workflow
      const workflow = await this.getWorkflow(workflowId)
      if (!workflow) {
        return null
      }

      // Run validation
      const validationResult = validateWorkflow(workflow.nodes, workflow.edges)

      // Update workflow with new validation results
      const { error } = await this.supabase
        .from('workflows')
        .update({
          validation_result: validationResult,
          quality_score: validationResult.score
        })
        .eq('id', workflowId)

      if (error) {
        console.error('Error updating workflow validation:', error)
        return null
      }

      return validationResult
    } catch (error) {
      console.error('Error in updateWorkflowValidation:', error)
      return null
    }
  }

  // ===================
  // Utility Methods
  // ===================

  /**
   * Map StoredWorkflow (localStorage) to SupabaseWorkflow format
   */
  mapToSupabaseWorkflow(storedWorkflow: StoredWorkflow): WorkflowCreateInput {
    return {
      name: storedWorkflow.name,
      description: storedWorkflow.description,
      nodes: storedWorkflow.nodes,
      edges: storedWorkflow.edges,
      is_active: storedWorkflow.state?.status === 'active'
    }
  }

  /**
   * Map SupabaseWorkflow to StoredWorkflow format
   */
  mapToStoredWorkflow(supabaseWorkflow: SupabaseWorkflow): StoredWorkflow {
    return {
      id: supabaseWorkflow.id,
      name: supabaseWorkflow.name,
      description: supabaseWorkflow.description,
      nodes: supabaseWorkflow.nodes,
      edges: supabaseWorkflow.edges,
      state: {
        id: supabaseWorkflow.id,
        name: supabaseWorkflow.name,
        status: supabaseWorkflow.is_active ? 'active' : 'draft',
        isValid: true,
        validationErrors: []
      } as WorkflowState,
      version: 1 // Will be enhanced in later phases
    }
  }
}

// ===================
// Export singleton instance
// ===================

export const workflowService = new WorkflowService()
