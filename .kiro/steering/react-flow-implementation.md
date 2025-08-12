# React Flow Implementation Plan

## Overview

This document outlines the step-by-step implementation plan for integrating React Flow into the Flow automation tool, based on the visual storyboard and features documentation.

## Phase 1: Basic React Flow Setup

### 1.1 Install Dependencies

```bash
npm install @xyflow/react
```

### 1.2 Create Basic Canvas Component

- Location: `src/components/workflow/WorkflowCanvas.tsx`
- Features:
  - Basic ReactFlow wrapper
  - Grid background
  - Zoom and pan controls
  - Initial empty state

### 1.3 Update Dashboard to Include Canvas Route

- Add `/workflow/new` route
- Add `/workflow/:id` route for editing
- Update dashboard with "Create New Workflow" button

## Phase 2: Node Library and Drag-and-Drop

### 2.1 Create Node Library Sidebar

- Location: `src/components/workflow/NodeLibrary.tsx`
- Node Categories:
  - **Triggers** (⚡): New Email Received
  - **Actions** (✅): Create Task (Trello/Asana)
  - **Logic/Filters** (🔍): If Condition
  - **AI Nodes** (✨): AI Tagging/Classification

### 2.2 Implement Drag-and-Drop

- Use React Flow's drag-and-drop example as reference
- Handle `onDrop` events on canvas
- Generate unique node IDs
- Position nodes at drop coordinates

### 2.3 Node Type Definitions

```typescript
export type NodeType = 'trigger' | 'action' | 'logic' | 'ai'

export interface FlowNode {
  id: string
  type: NodeType
  subtype: string // 'email-trigger', 'trello-action', etc.
  position: { x: number; y: number }
  data: {
    label: string
    icon: string
    config: Record<string, any>
    status?: 'idle' | 'running' | 'success' | 'error'
  }
}
```

## Phase 3: Custom Node Components

### 3.1 Base Node Component

- Location: `src/components/workflow/nodes/BaseNode.tsx`
- Features:
  - Flow branding and styling
  - Connection handles (input/output)
  - Status indicators
  - Selection highlighting

### 3.2 Specific Node Types

- `TriggerNode.tsx` - Email triggers
- `ActionNode.tsx` - Task creation actions
- `LogicNode.tsx` - Conditional branching
- `AINode.tsx` - AI processing nodes

### 3.3 Node Styling

- Use Tailwind classes consistent with Flow design
- Purple accent colors (`#8b5cf6`)
- Dark theme compatibility
- Hover and selection states

## Phase 4: Node Configuration Panel

### 4.1 Configuration Panel Component

- Location: `src/components/workflow/ConfigPanel.tsx`
- Dynamic content based on selected node type
- Form validation with React Hook Form + Zod

### 4.2 Configuration Forms

- **Email Trigger Config**: Subject filters, sender filters, OAuth connection
- **Trello Action Config**: Board selection, list selection, field mapping
- **AI Node Config**: Classification type, tagging rules

### 4.3 OAuth Integration

- Gmail OAuth for email triggers
- Trello/Asana OAuth for action nodes
- Connection status indicators

## Phase 5: Edge Connections and Validation

### 5.1 Edge Creation

- Handle `onConnect` events
- Validate connection compatibility
- Visual feedback for valid/invalid connections

### 5.2 Connection Rules

- Triggers can only connect to Actions or Logic nodes
- Actions can connect to other Actions or Logic nodes
- Logic nodes can have multiple outputs
- Prevent circular connections

### 5.3 Visual Feedback

- Green highlight for valid connections
- Red highlight and shake animation for invalid
- Connection handles show/hide on hover

## Phase 6: Workflow Controls and Testing

### 6.1 Workflow Toolbar

- Location: `src/components/workflow/WorkflowToolbar.tsx`
- Controls:
  - Run Test button (▶️)
  - Enable/Disable toggle
  - Save Workflow button
  - Workflow name input

### 6.2 Test Execution

- Mock data for testing workflows
- Node status updates during execution
- Visual feedback (green/red highlighting)

### 6.3 Debug Panel

- Location: `src/components/workflow/DebugPanel.tsx`
- Execution logs
- Error messages
- Last run information

## Phase 7: Template System

### 7.1 Template Definitions

- Pre-built workflow configurations
- "Email → Task" starter template
- Template selection UI

### 7.2 Template Loading

- Initialize canvas with template nodes and edges
- Minimal configuration required
- Quick setup flow

## Implementation Order

1. **Start with Phase 1** - Basic canvas setup
2. **Phase 2** - Node library and drag-and-drop
3. **Phase 3** - Custom node components
4. **Phase 4** - Configuration panel
5. **Phase 5** - Edge connections
6. **Phase 6** - Workflow controls
7. **Phase 7** - Templates

## Key React Flow APIs to Use

- `ReactFlow` - Main component
- `Node` and `Edge` types
- `useNodesState` and `useEdgesState` hooks
- `onNodesChange` and `onEdgesChange` handlers
- `onConnect` for edge creation
- `onDrop` for drag-and-drop
- Custom node types registration

## File Structure

```
src/components/workflow/
├── WorkflowCanvas.tsx          # Main React Flow wrapper
├── NodeLibrary.tsx             # Draggable node sidebar
├── ConfigPanel.tsx             # Node configuration panel
├── WorkflowToolbar.tsx         # Workflow controls
├── DebugPanel.tsx              # Execution logs and status
├── nodes/
│   ├── BaseNode.tsx            # Base node component
│   ├── TriggerNode.tsx         # Email trigger nodes
│   ├── ActionNode.tsx          # Task action nodes
│   ├── LogicNode.tsx           # Conditional logic nodes
│   └── AINode.tsx              # AI processing nodes
├── edges/
│   └── CustomEdge.tsx          # Custom edge styling
└── types/
    ├── workflow.ts             # Workflow type definitions
    └── nodes.ts                # Node type definitions
```

This implementation plan provides a clear roadmap for building the React Flow-based workflow editor according to the visual storyboard and feature requirements.
