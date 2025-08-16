import { CustomEdge } from '../edges/CustomEdge'

// Register custom edge types with React Flow
export const edgeTypes = {
  default: CustomEdge,
  custom: CustomEdge,
}

// Export for type safety
export type CustomEdgeType = keyof typeof edgeTypes