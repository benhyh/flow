# Design Document

## Overview

Flow is a web-based visual workflow automation platform built as a Single Page Application (SPA) with a Node.js backend. The system enables users to create email-to-task automation workflows through a drag-and-drop interface, leveraging OAuth integrations with Gmail, Trello, and Asana, enhanced by AI-powered content analysis and workflow optimization.

## Architecture

### High-Level Architecture

```mermaid
graph TB
    A[Web Client - Next.js + React Flow] --> B[Vercel Edge Functions]
    B --> C[Supabase Auth]
    B --> D[Workflow Engine]
    B --> E[Integration Service]
    B --> F[AI Service]
    
    C --> G[OAuth Providers]
    D --> H[Upstash Redis Queue]
    E --> I[External APIs]
    F --> J[OpenAI API]
    
    D --> K[Supabase Database]
    H --> K
    E --> K
    
    K --> L[Real-time Subscriptions]
    L --> A
```

### React Flow Canvas Architecture

The visual workflow editor is built using React Flow (@xyflow/react) with:
- **Node Library Sidebar** - Draggable node types (Triggers, Actions, Logic, AI)
- **Canvas Area** - Grid-based drop zone with zoom/pan capabilities
- **Configuration Panel** - Dynamic side panel for selected node settings
- **Toolbar** - Workflow controls (Run, Save, Enable/Disable)
- **Debug Panel** - Execution logs and status feedback

### Technology Stack

**Frontend:**
- React 18 with TypeScript for type safety
- React Flow for visual workflow canvas
- Tailwind CSS for responsive design
- React Query for state management and API caching
- React Hook Form for form handling

**Backend (Serverless):**
- Next.js API routes for serverless functions
- TypeScript for type safety
- Supabase for database, authentication, and real-time features
- Vercel for hosting and edge functions
- Upstash Redis for job queuing and caching
- Supabase Auth for OAuth authentication

**External Services:**
- Supabase for database, auth, and real-time subscriptions
- Upstash Redis for job queuing and caching
- Gmail API for email monitoring
- Trello API for task creation
- Asana API for project management
- OpenAI API for AI assistance

## Components and Interfaces

### Frontend Components

#### 1. Authentication Module
- **LoginPage**: OAuth provider selection and authentication flow
- **AuthCallback**: Handles OAuth redirect and token exchange
- **ConnectionStatus**: Displays connected services and health status

#### 2. Workflow Editor Module (React Flow Implementation)
- **WorkflowCanvas**: React Flow-based drag-and-drop interface with grid background
- **NodeLibrary**: Sidebar with draggable node types:
  - Triggers (⚡): New Email Received
  - Actions (✅): Create Task (Trello/Asana)  
  - Logic/Filters (🔍): If Condition (branching)
  - AI Nodes (✨): AI Tagging/Classification
- **NodeConfigPanel**: Dynamic configuration forms for selected nodes
- **WorkflowToolbar**: Run Test, Enable/Disable, Save Workflow buttons
- **DebugPanel**: Execution logs, status indicators, error messages

#### 3. Dashboard Module
- **WorkflowList**: Overview of all user workflows with status
- **ExecutionLogs**: Detailed execution history and debugging
- **HealthMonitor**: Real-time workflow performance metrics

#### 4. AI Assistant Module
- **PatternSuggestions**: Recommended workflow templates
- **ContentAnalyzer**: Real-time email content analysis
- **OptimizationTips**: Performance improvement suggestions

### Backend Services

#### 1. Authentication Service
```typescript
interface AuthService {
  initiateOAuth(provider: string): Promise<string>
  handleCallback(code: string, provider: string): Promise<TokenSet>
  refreshToken(userId: string, provider: string): Promise<TokenSet>
  validateToken(token: string): Promise<boolean>
}
```

#### 2. Workflow Engine
```typescript
interface WorkflowEngine {
  createWorkflow(userId: string, config: WorkflowConfig): Promise<Workflow>
  activateWorkflow(workflowId: string): Promise<void>
  executeWorkflow(workflowId: string, trigger: TriggerData): Promise<ExecutionResult>
  scheduleMonitoring(workflowId: string): Promise<void>
}
```

#### 3. Integration Service
```typescript
interface IntegrationService {
  monitorEmails(userId: string, criteria: EmailCriteria): Promise<Email[]>
  createTask(provider: string, taskData: TaskData): Promise<Task>
  validateConnection(userId: string, provider: string): Promise<boolean>
}
```

#### 4. AI Service
```typescript
interface AIService {
  analyzeEmailContent(content: string): Promise<ContentAnalysis>
  suggestWorkflowPatterns(userContext: UserContext): Promise<WorkflowTemplate[]>
  extractTaskData(email: Email): Promise<TaskData>
  optimizeWorkflow(workflow: Workflow, metrics: ExecutionMetrics): Promise<OptimizationSuggestions>
}
```

## Data Models

### Core Entities

#### User
```typescript
interface User {
  id: string
  email: string
  createdAt: Date
  updatedAt: Date
  connections: Connection[]
  workflows: Workflow[]
}
```

#### Connection
```typescript
interface Connection {
  id: string
  userId: string
  provider: 'gmail' | 'trello' | 'asana'
  accessToken: string
  refreshToken: string
  expiresAt: Date
  isActive: boolean
}
```

#### Workflow
```typescript
interface Workflow {
  id: string
  userId: string
  name: string
  description: string
  isActive: boolean
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  createdAt: Date
  updatedAt: Date
}
```

#### WorkflowNode
```typescript
interface WorkflowNode {
  id: string
  type: 'trigger' | 'action' | 'condition'
  nodeType: string // 'email-trigger', 'create-task', etc.
  config: Record<string, any>
  position: { x: number; y: number }
}
```

#### ExecutionLog
```typescript
interface ExecutionLog {
  id: string
  workflowId: string
  status: 'success' | 'failed' | 'running'
  triggerData: any
  result: any
  error?: string
  executedAt: Date
  duration: number
}
```

## Error Handling

### Error Categories

1. **Authentication Errors**
   - OAuth token expiration
   - Invalid credentials
   - Service unavailable

2. **Integration Errors**
   - API rate limiting
   - Network timeouts
   - Invalid API responses

3. **Workflow Errors**
   - Invalid node configuration
   - Missing required data
   - Execution timeouts

4. **System Errors**
   - Database connection issues
   - Queue processing failures
   - Memory/resource constraints

### Error Handling Strategy

```typescript
class ErrorHandler {
  static handleAuthError(error: AuthError): ErrorResponse {
    // Implement token refresh logic
    // Provide user-friendly error messages
    // Log security-related issues
  }
  
  static handleIntegrationError(error: IntegrationError): ErrorResponse {
    // Implement retry logic with exponential backoff
    // Handle rate limiting gracefully
    // Provide fallback mechanisms
  }
  
  static handleWorkflowError(error: WorkflowError): ErrorResponse {
    // Pause workflow execution
    // Notify user of issues
    // Provide debugging information
  }
}
```

## Testing Strategy

### Unit Testing
- **Frontend**: Jest + React Testing Library for component testing
- **Backend**: Jest + Supertest for API endpoint testing
- **Services**: Mock external APIs for isolated testing
- **Coverage Target**: 80% code coverage minimum

### Integration Testing
- **API Integration**: Test OAuth flows with real providers in staging
- **Workflow Execution**: End-to-end workflow testing with test accounts
- **Database Operations**: Test data persistence and retrieval
- **Queue Processing**: Test background job execution

### End-to-End Testing
- **User Flows**: Playwright for complete user journey testing
- **Cross-Browser**: Test on Chrome, Firefox, Safari
- **Mobile Responsive**: Test on various device sizes
- **Performance**: Load testing for concurrent workflow executions

### Testing Environment Setup
```yaml
# docker-compose.test.yml
version: '3.8'
services:
  test-db:
    image: postgres:14
    environment:
      POSTGRES_DB: flow_test
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
  
  test-redis:
    image: redis:7-alpine
  
  test-app:
    build: .
    environment:
      NODE_ENV: test
      DATABASE_URL: postgresql://test:test@test-db:5432/flow_test
      REDIS_URL: redis://test-redis:6379
```

## Security Considerations

### Authentication & Authorization
- OAuth 2.0 with PKCE for secure authentication
- JWT tokens with short expiration times
- Refresh token rotation for enhanced security
- Role-based access control for future team features

### Data Protection
- Encryption at rest for sensitive data
- TLS 1.3 for data in transit
- Secure token storage with encryption
- Regular security audits and dependency updates

### API Security
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration for cross-origin requests
- API key rotation for external service access

## Performance Optimization

### Frontend Performance
- Code splitting for reduced initial bundle size
- React.memo for component optimization
- Virtual scrolling for large workflow lists
- Service worker for offline capability

### Backend Performance
- Database indexing for query optimization
- Connection pooling for database efficiency
- Caching strategies with Redis
- Background job processing for non-blocking operations

### Monitoring & Observability
- Application performance monitoring (APM)
- Error tracking and alerting
- Workflow execution metrics
- User behavior analytics