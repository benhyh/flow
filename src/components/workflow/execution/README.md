# Workflow Execution Manager

This directory contains the dedicated workflow execution system that handles the testing and running of workflows.

## Files

- `WorkflowExecutionManager.tsx` - Main execution manager with comprehensive debugging
- `WorkflowExecutionWrapper.tsx` - Wrapper component to ensure proper React Flow context
- `index.ts` - Clean exports for the execution manager

## Features

- **Comprehensive Console Logging**: All execution steps are logged with `[EXECUTION MANAGER]` prefix
- **Real Gmail Integration**: Actual Gmail API calls for email trigger nodes
- **Node Status Updates**: Visual feedback with node color changes (idle → running → success/error)
- **Toast Notifications**: User-friendly notifications for execution results
- **Error Handling**: Detailed error reporting and early exit detection
- **Topological Execution**: Nodes are executed in proper dependency order

## Usage

```typescript
import { useWorkflowExecutionManager } from '@/components/workflow'

function MyComponent() {
  const { executeWorkflow, isExecuting, nodeExecutionState } = useWorkflowExecutionManager()
  
  // Call executeWorkflow() to run the workflow
  const handleTest = () => {
    executeWorkflow()
  }
}
```

## Console Debugging

When you run a workflow test, look for these console patterns:

1. **Startup**: `[EXECUTION MANAGER] ========== STARTING WORKFLOW EXECUTION ==========`
2. **Node Execution**: `[EXECUTION MANAGER] ========== EXECUTING NODE ==========`
3. **Gmail Trigger**: `[EXECUTION MANAGER] ========== GMAIL TRIGGER EXECUTION ==========`
4. **Early Exits**: 
   - `[EXECUTION MANAGER] EARLY EXIT: No emailFilters in config`
   - `[EXECUTION MANAGER] EARLY EXIT: No Gmail access`

## Integration

This execution manager is integrated directly into the dashboard using the `WorkflowExecutionWrapper` to ensure proper React Flow context. This solves the "Seems like you have not used zustand provider as an ancestor" error by ensuring `useReactFlow()` is called within the `ReactFlowProvider`.

```typescript
<ReactFlowProvider>
  <WorkflowExecutionWrapper>
    {({ executeWorkflow, isExecuting }) => (
      <YourComponent executeWorkflow={executeWorkflow} isExecuting={isExecuting} />
    )}
  </WorkflowExecutionWrapper>
</ReactFlowProvider>
```
