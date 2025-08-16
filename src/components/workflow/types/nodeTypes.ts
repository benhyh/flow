import { TriggerNode } from '../nodes/TriggerNode'
import { ActionNode } from '../nodes/ActionNode'
import { LogicNode } from '../nodes/LogicNode'
import { AINode } from '../nodes/AINode'


// Register custom node types with React Flow
export const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  logic: LogicNode,
  ai: AINode,
}

// Export for type safety
export type CustomNodeType = keyof typeof nodeTypes
