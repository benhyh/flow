/**
 * Database Types for Workflow Execution Manager
 * Generated to match the Supabase database schema
 */

// =============================================================================
// CORE WORKFLOW TYPES
// =============================================================================

export interface Workflow {
  id: string
  user_id: string
  name: string
  description?: string
  is_active: boolean
  last_modified_at: string
  last_executed_at?: string
  created_at: string
  // DAG representation (optional for backwards compatibility)
  dag_structure?: string[][]
  execution_order?: string[]
}

export interface Node {
  id: string
  workflow_id: string
  node_type: NodeType
  name: string
  position_x: number
  position_y: number
  created_at: string
}

export interface NodeConnection {
  id: string
  workflow_id: string
  source_node_id: string
  target_node_id: string
  created_at: string
}

// =============================================================================
// NODE TYPE DEFINITIONS
// =============================================================================

export type NodeType = 
  | 'trigger'
  | 'trello-action'
  | 'asana-action'
  | 'logic'
  | 'ai-tagging'
  | 'ai-classification'

export type TriggerType = 'email' | 'webhook' | 'schedule'
export type TrelloAction = 'create_card' | 'get_cards' | 'update_card' | 'delete_card'
export type AsanaAction = 'create_task' | 'get_tasks' | 'update_task' | 'delete_task'
export type GmailAction = 'send_email' | 'get_emails' | 'create_draft' | 'reply_to_email'
export type AIAction = 'generate_text' | 'analyze_content' | 'summarize' | 'classify' | 'tag'
export type LogicType = 'condition' | 'filter' | 'delay' | 'split'
export type OperatorType = 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan'

// =============================================================================
// NODE CONFIGURATION TYPES
// =============================================================================

export interface TriggerNodeConfig {
  id: string
  node_id: string
  trigger_type: TriggerType
  email_filters: EmailFilters
  webhook_url?: string
  schedule_cron?: string
  created_at: string
}

export interface EmailFilters {
  sender?: string
  subject?: string
  keywords?: string[]
  from_date?: string
  to_date?: string
}

export interface TrelloNodeConfig {
  id: string
  node_id: string
  action: TrelloAction
  board_id?: string
  list_id?: string
  card_name?: string
  description?: string
  due_date?: string
  labels?: string[]
  created_at: string
}

export interface AsanaNodeConfig {
  id: string
  node_id: string
  action: AsanaAction
  project_gid?: string
  task_name?: string
  notes?: string
  assignee_email?: string
  due_date?: string
  tags?: string[]
  created_at: string
}

export interface GmailNodeConfig {
  id: string
  node_id: string
  action: GmailAction
  to_email?: string
  cc_email?: string
  subject?: string
  body?: string
  attachments?: string[]
  created_at: string
}

export interface AINodeConfig {
  id: string
  node_id: string
  ai_type: 'ai-tagging' | 'ai-classification'
  action: AIAction
  prompt_template: string
  model: string
  max_tokens: number
  temperature: number
  created_at: string
}

export interface LogicNodeConfig {
  id: string
  node_id: string
  logic_type: LogicType
  field?: string
  operator?: OperatorType
  value?: string
  delay_seconds?: number
  created_at: string
}

// =============================================================================
// CREDENTIAL TYPES
// =============================================================================

export type ServiceType = 'trello' | 'asana' | 'gmail'

export interface UserCredential {
  id: string
  user_id: string
  service_type: ServiceType
  encrypted_access_token: string
  encrypted_refresh_token?: string
  expires_at?: string
  created_at: string
  updated_at: string
}

// =============================================================================
// EXECUTION TYPES
// =============================================================================

export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'cancelled'

export interface WorkflowExecution {
  id: string
  workflow_id: string
  user_id: string
  status: ExecutionStatus
  started_at: string
  completed_at?: string
  trigger_data: Record<string, any>
  final_output: Record<string, any>
  error_message?: string
  total_execution_time_ms?: number
}

export interface NodeExecutionResult {
  id: string
  workflow_execution_id: string
  node_id: string
  execution_order: number
  output_data: Record<string, any>
  execution_time_ms?: number
  created_at: string
}

// =============================================================================
// COMPOSITE TYPES
// =============================================================================

export interface CompleteWorkflow {
  workflow: Workflow
  nodes: Node[]
  connections: NodeConnection[]
  nodeConfigs: {
    triggers: TriggerNodeConfig[]
    trello: TrelloNodeConfig[]
    asana: AsanaNodeConfig[]
    gmail: GmailNodeConfig[]
    ai: AINodeConfig[]
    logic: LogicNodeConfig[]
  }
}

export interface WorkflowWithExecution {
  workflow: Workflow
  execution?: WorkflowExecution
  nodeResults?: NodeExecutionResult[]
}

export interface ExecutionOrder {
  node_id: string
  execution_level: number
}

// =============================================================================
// REQUEST/RESPONSE TYPES
// =============================================================================

export interface CreateWorkflowRequest {
  name: string
  description?: string
}

export interface UpdateWorkflowRequest {
  name?: string
  description?: string
  is_active?: boolean
  // Allow updating DAG structure and execution order on manual save
  dag_structure?: string[][]
  execution_order?: string[]
}

export interface CreateNodeRequest {
  workflow_id: string
  node_type: NodeType
  name: string
  position_x: number
  position_y: number
}

export interface UpdateNodeRequest {
  name?: string
  position_x?: number
  position_y?: number
}

export interface CreateConnectionRequest {
  workflow_id: string
  source_node_id: string
  target_node_id: string
}

export interface SaveCredentialsRequest {
  service_type: ServiceType
  access_token: string
  refresh_token?: string
  expires_at?: string
}

export interface StartExecutionRequest {
  workflow_id: string
  trigger_data?: Record<string, any>
}

// =============================================================================
// VALIDATION TYPES
// =============================================================================

export interface WorkflowValidation {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  type: 'error'
  message: string
  node_id?: string
  field?: string
}

export interface ValidationWarning {
  type: 'warning'
  message: string
  node_id?: string
  field?: string
}

export interface WorkflowStats {
  total_workflows: number
  active_workflows: number
  executed_workflows: number
  last_workflow_activity?: string
}

export interface ExecutionStats {
  total_executions: number
  successful_executions: number
  failed_executions: number
  avg_execution_time_ms?: number
  last_execution?: string
}

// =============================================================================
// TEMPLATE VARIABLE TYPES
// =============================================================================

export interface TemplateContext {
  trigger: Record<string, any>
  previous: Record<string, any>
  user: {
    id: string
    email?: string
  }
  workflow: {
    id: string
    name: string
  }
}

export interface ResolvedTemplate {
  original: string
  resolved: string
  variables: string[]
}

// =============================================================================
// DATABASE RESPONSE TYPES
// =============================================================================

export interface DatabaseResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  hasMore: boolean
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type NodeConfig = 
  | TriggerNodeConfig
  | TrelloNodeConfig
  | AsanaNodeConfig
  | GmailNodeConfig
  | AINodeConfig
  | LogicNodeConfig

export type NodeConfigMap = {
  [K in NodeType]: NodeConfig
}

export interface NodeWithConfig extends Node {
  config?: NodeConfig
}

export interface WorkflowSummary {
  id: string
  name: string
  description?: string
  is_active: boolean
  node_count: number
  connection_count: number
  last_modified_at: string
  last_executed_at?: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const NODE_TYPES: NodeType[] = [
  'trigger',
  'trello-action',
  'asana-action',
  'logic',
  'ai-tagging',
  'ai-classification'
]

export const SERVICE_TYPES: ServiceType[] = [
  'trello',
  'asana',
  'gmail'
]

export const EXECUTION_STATUSES: ExecutionStatus[] = [
  'running',
  'completed',
  'failed',
  'cancelled'
]

export const TRIGGER_TYPES: TriggerType[] = [
  'email',
  'webhook',
  'schedule'
]

export const TRELLO_ACTIONS: TrelloAction[] = [
  'create_card',
  'get_cards',
  'update_card',
  'delete_card'
]

export const ASANA_ACTIONS: AsanaAction[] = [
  'create_task',
  'get_tasks',
  'update_task',
  'delete_task'
]

export const GMAIL_ACTIONS: GmailAction[] = [
  'send_email',
  'get_emails',
  'create_draft',
  'reply_to_email'
]

export const AI_ACTIONS: AIAction[] = [
  'generate_text',
  'analyze_content',
  'summarize',
  'classify',
  'tag'
]

export const LOGIC_TYPES: LogicType[] = [
  'condition',
  'filter',
  'delay',
  'split'
]

export const OPERATOR_TYPES: OperatorType[] = [
  'contains',
  'equals',
  'startsWith',
  'endsWith',
  'greaterThan',
  'lessThan'
]
