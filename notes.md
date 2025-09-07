# Workflow Data Structure Analysis

## Overview
This document traces the workflow data structure and flow starting from `DashboardContent.tsx` to understand how the system currently functions before creating a database schema for seamless integration.

## 1. Entry Point: DashboardContent.tsx

### Key State Management
```typescript
// Core React Flow state
const [nodes, setNodes] = useState<Node[]>(initialNodes)
const [edges, setEdges] = useState<Edge[]>(initialEdges)

// Workflow state management via custom hook
const {
  workflowState,
  updateWorkflowState,
  handleSave,
  handleAutoSave,
  handleToggleStatus,
  validateCurrentWorkflow,
  createNewWorkflow,
} = useWorkflowState({
  name: 'Untitled Workflow',
})
```

### Data Flow
1. **Node/Edge Changes** → `onNodesChange`/`onEdgesChange` → State updates
2. **Auto-save** → Triggers after 5 seconds of inactivity
3. **Validation** → Runs on every node/edge change
4. **Execution** → Via `WorkflowExecutionWrapper`

## 2. Workflow State Structure

### WorkflowState Interface (from WorkflowToolbar.tsx)
```typescript
export interface WorkflowState {
  id?: string                    // UUID from Supabase (optional for new workflows)
  name: string                   // Workflow name
  status: WorkflowStatus         // 'draft' | 'active' | 'paused' | 'testing'
  isValid: boolean               // Validation status
  validationErrors: string[]     // Array of error messages
  lastValidation?: unknown       // ValidationResult type
}

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'testing'
```

### useWorkflowState Hook Features
- **Auto-save**: 5-second debounced saves to Supabase
- **Validation**: Real-time workflow validation
- **Status Management**: Draft → Active → Paused transitions
- **Supabase Integration**: Direct save/load from database

## 3. Node Structure Analysis

### NodeTypeDefinition (from NodeLibrary.tsx)
```typescript
export interface NodeTypeDefinition {
  id: string                    // Unique identifier
  type: 'trigger' | 'action' | 'logic' | 'ai'  // Node category
  subtype: string               // Specific type (e.g., 'email-trigger')
  label: string                 // Display name
  icon: string                  // Icon identifier
  description: string           // Tooltip description
  color: string                 // Node color
}
```

### Current Node Types
```typescript
const nodeTypes: NodeTypeDefinition[] = [
  // Triggers
  {
    id: 'email-trigger',
    type: 'trigger',
    subtype: 'email-trigger',
    label: 'New Email',
    icon: 'Mail',
    description: 'Triggers when a new email is received',
    color: '#10b981',
  },
  
  // Actions
  {
    id: 'trello-action',
    type: 'action',
    subtype: 'trello-action',
    label: 'Create Trello Card',
    icon: 'TrelloSVG',
    description: 'Creates a new card in Trello',
    color: '#0052cc',
  },
  {
    id: 'asana-action',
    type: 'action',
    subtype: 'asana-action',
    label: 'Create Asana Task',
    icon: 'AsanaSVG',
    description: 'Creates a new task in Asana',
    color: '#f95d8f',
  },
  
  // Logic
  {
    id: 'condition-logic',
    type: 'logic',
    subtype: 'condition-logic',
    label: 'If Condition',
    icon: 'Ampersand',
    description: 'Conditional branching logic',
    color: '#f59e0b',
  },
  
  // AI Nodes
  {
    id: 'ai-tagging',
    type: 'ai',
    subtype: 'ai-tagging',
    label: 'AI Tagging',
    icon: 'Tag',
    description: 'AI-powered content tagging',
    color: '#8b5cf6',
  },
  {
    id: 'ai-classification',
    type: 'ai',
    subtype: 'ai-classification',
    label: 'AI Classification',
    icon: 'Group',
    description: 'AI-powered content classification',
    color: '#8b5cf6',
  },
]
```

### React Flow Node Structure
```typescript
// When a node is dropped, it becomes a React Flow Node
const newNode: Node = {
  id: `${nodeType.subtype}-${Date.now()}`,  // Unique ID
  type: nodeType.type,                      // 'trigger', 'action', etc.
  position,                                 // { x: number, y: number }
  data: {
    label: nodeType.label,                  // Display name
    nodeType: nodeType.subtype,             // Specific type
    icon: nodeType.icon,                    // Icon identifier
    color: nodeType.color,                  // Node color
    status: 'idle',                         // Execution status
    addedAt: Date.now(),                    // Creation timestamp
    config: {},                             // Node configuration (empty initially)
  },
}
```

## 4. Node Data Structure

### BaseNodeData Interface
```typescript
export interface BaseNodeData {
  label: string                              // Display name
  nodeType: string                           // Specific node type
  icon: string                               // Icon identifier
  color: string                              // Node color
  status?: 'idle' | 'running' | 'success' | 'error'  // Execution status
  config?: Record<string, unknown>           // Node configuration
}
```

### Node Configuration Examples
```typescript
// Email Trigger Configuration
{
  emailFilters: {
    sender: 'tasks@company.com',
    subject: 'New Task',
    keywords: ['urgent', 'priority']
  }
}

// Trello Action Configuration
{
  boardId: 'board-123',
  listId: 'list-456',
  title: '{{email.subject}}',
  description: '{{email.body}}'
}

// AI Classification Configuration
{
  classificationRules: [
    { category: 'urgent', keywords: ['urgent', 'asap'] },
    { category: 'normal', keywords: ['update', 'info'] }
  ]
}
```

## 5. Edge Structure

### React Flow Edge
```typescript
// Standard React Flow Edge
{
  id: 'e1-2',                    // Unique edge ID
  source: 'node-1',              // Source node ID
  target: 'node-2',              // Target node ID
  sourceHandle: 'output',        // Source handle (optional)
  targetHandle: 'input',         // Target handle (optional)
  type: 'default',               // Edge type
  animated: false,               // Animation flag
  style: { stroke: '#8b5cf6' }   // Visual styling
}
```

## 6. Validation System

### ValidationResult Interface
```typescript
export interface ValidationResult {
  isValid: boolean               // Overall validation status
  errors: ValidationError[]      // Critical errors
  warnings: ValidationError[]    // Warning messages
  info: ValidationError[]        // Informational messages
  score: number                  // Quality score (0-100)
}

export interface ValidationError {
  id: string                     // Error identifier
  type: 'error' | 'warning' | 'info'
  category: 'structure' | 'configuration' | 'connection' | 'logic' | 'execution'
  message: string                // Error message
  nodeId?: string                // Related node ID
  nodeLabel?: string             // Related node label
  edgeId?: string                // Related edge ID
  severity: 'critical' | 'high' | 'medium' | 'low'
  suggestion?: string            // Suggested fix
}
```

### Validation Categories
1. **Structure**: Workflow must have triggers, actions, etc.
2. **Configuration**: Node-specific configuration validation
3. **Connection**: Valid connections between nodes
4. **Logic**: Workflow logic validation
5. **Execution**: Runtime execution validation

## 7. Execution System

### WorkflowExecutionManager
```typescript
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

type NodeExecutionState = Record<string, 'idle' | 'running' | 'success' | 'error'>
```

### Execution Flow
1. **Topological Sort**: Execute nodes in dependency order
2. **Node Execution**: Each node type has specific execution logic
3. **Status Updates**: Visual feedback during execution
4. **Error Handling**: Comprehensive error reporting

### Node Execution Examples
```typescript
// Gmail Trigger Execution
const executeGmailTriggerNode = async (node: Node) => {
  const config = node.data.config
  const emailFilters = config.emailFilters
  
  // Real Gmail API call
  const result = await executeGmailTrigger({
    senderFilter: emailFilters.sender,
    subjectContains: emailFilters.subject,
    keywords: emailFilters.keywords
  })
  
  return {
    success: result.success,
    duration: Date.now() - startTime,
    data: result.data
  }
}

// Trello Action Execution
const executeTrelloActionNode = async (node: Node) => {
  const config = node.data.config
  
  // Real Trello API call
  const result = await createTrelloCard({
    boardId: config.boardId,
    listId: config.listId,
    title: config.title,
    description: config.description
  })
  
  return {
    success: result.success,
    duration: Date.now() - startTime,
    data: result.data
  }
}
```

## 8. Storage Systems

### Current Storage: localStorage (StoredWorkflow)
```typescript
export interface StoredWorkflow {
  id: string                     // Unique identifier
  name: string                   // Workflow name
  description?: string           // Optional description
  nodes: Node[]                  // React Flow nodes
  edges: Edge[]                  // React Flow edges
  state: WorkflowState           // Workflow state
  version: number                // Version number
}
```

### Target Storage: Supabase (SupabaseWorkflow)
```typescript
export interface SupabaseWorkflow {
  id: string                     // UUID from Supabase
  user_id: string                // User ID (from auth.users)
  name: string                   // Workflow name
  description?: string           // Optional description
  nodes: ReactFlowNode[]         // React Flow nodes (JSONB)
  edges: ReactFlowEdge[]         // React Flow edges (JSONB)
  is_active: boolean             // Active status
  validation_result?: ValidationResult  // Validation results (JSONB)
  quality_score?: number         // Quality score (0-100)
  last_executed_at?: string      // Last execution timestamp
  execution_count?: number       // Total executions
  node_count?: number            // Computed node count
  edge_count?: number            // Computed edge count
  created_at: string             // Creation timestamp
  updated_at: string             // Last update timestamp
}
```

## 9. Integration Points

### OAuth Integrations
```typescript
export interface UserIntegration {
  id: string                     // Integration ID
  user_id: string                // User ID
  provider: 'gmail' | 'google' | 'trello' | 'asana'
  access_token: string           // OAuth access token
  refresh_token?: string         // OAuth refresh token
  token_expires_at?: string      // Token expiration
  provider_user_id?: string      // Provider user ID
  provider_email?: string        // Provider email
  scopes?: string[]              // Granted scopes
  is_active: boolean             // Integration status
  last_used_at?: string          // Last usage timestamp
  error_count: number            // Error tracking
  last_error?: string            // Last error message
  created_at: string             // Creation timestamp
  updated_at: string             // Last update timestamp
}
```

### Execution Tracking
```typescript
export interface WorkflowExecution {
  id: string                     // Execution ID
  workflow_id: string            // Workflow ID
  status: 'running' | 'success' | 'failed' | 'cancelled'
  started_at: string             // Start timestamp
  completed_at?: string          // Completion timestamp
  duration?: number              // Execution duration (ms)
  trigger_data?: any             // Trigger data (JSONB)
  result?: any                   // Execution result (JSONB)
  error?: string                 // Error message
  node_results?: Record<string, any>  // Node-level results (JSONB)
}
```

## 10. Key Data Flow Patterns

### 1. Workflow Creation
```
User drops node → React Flow Node created → Validation triggered → Auto-save to Supabase
```

### 2. Workflow Execution
```
User clicks "Run Test" → WorkflowExecutionManager → Topological sort → Node execution → Status updates → Results stored
```

### 3. Data Persistence
```
Node/Edge changes → Validation → Auto-save (5s debounce) → Supabase → Success/Error feedback
```

### 4. OAuth Integration
```
User connects service → OAuth flow → Tokens stored in Supabase → Available for workflow execution
```

## 11. Database Schema Requirements

Based on this analysis, the database schema needs to support:

### Core Tables
1. **workflows** - Main workflow storage with React Flow data
2. **execution_logs** - Execution tracking and results
3. **user_integrations** - OAuth token storage
4. **workflow_versions** - Version control and audit trail
5. **workflow_metrics** - Performance analytics

### Key Features
- **JSONB Storage**: For React Flow nodes/edges and validation results
- **Computed Columns**: For node_count, edge_count, quality_score
- **Row Level Security**: User data isolation
- **Indexing**: For efficient queries on user_id, status, etc.
- **Triggers**: For automatic execution count updates
- **Views**: For analytics and reporting

### Data Types
- **UUID**: For all primary keys
- **JSONB**: For complex data structures
- **TIMESTAMPTZ**: For all timestamps
- **TEXT[]**: For arrays (tags, scopes)
- **INTEGER**: For counts and scores

This analysis shows that the current system is well-structured and ready for seamless database integration. The existing interfaces and data structures can be directly mapped to the database schema with minimal changes to the application code.

#