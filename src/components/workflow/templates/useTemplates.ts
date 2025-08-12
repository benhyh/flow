import { useCallback } from 'react'
import { type Node, type Edge } from '@xyflow/react'
import { type WorkflowTemplate, getTemplateById } from './workflowTemplates'

interface UseTemplatesProps {
  onNodesChange: (nodes: Node[]) => void
  onEdgesChange: (edges: Edge[]) => void
  onWorkflowStateChange: (updates: Record<string, unknown>) => void
}

export function useTemplates({ onNodesChange, onEdgesChange, onWorkflowStateChange }: UseTemplatesProps) {
  
  // Load a template into the current workflow
  const loadTemplate = useCallback((template: WorkflowTemplate) => {
    // Generate new unique IDs for nodes to avoid conflicts
    const nodeIdMap = new Map<string, string>()
    
    // Create new nodes with unique IDs
    const newNodes: Node[] = template.nodes.map((node) => {
      const newId = `${node.data.nodeType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      nodeIdMap.set(node.id, newId)
      
      return {
        ...node,
        id: newId,
        // Ensure the node has all required properties
        data: {
          ...node.data,
          status: 'idle' // Reset status for new template
        }
      }
    })

    // Create new edges with updated node references
    const newEdges: Edge[] = template.edges.map((edge) => {
      const newSourceId = nodeIdMap.get(edge.source) || edge.source
      const newTargetId = nodeIdMap.get(edge.target) || edge.target
      
      return {
        ...edge,
        id: `${newSourceId}-${newTargetId}-${Date.now()}`,
        source: newSourceId,
        target: newTargetId
      }
    })

    // Update the workflow with template data
    onNodesChange(newNodes)
    onEdgesChange(newEdges)
    
    // Update workflow state with template information
    onWorkflowStateChange({
      name: template.name,
      status: 'draft',
      isValid: false, // Will need validation
      validationErrors: [],
      templateId: template.id,
      templateName: template.name
    })

    return { nodes: newNodes, edges: newEdges }
  }, [onNodesChange, onEdgesChange, onWorkflowStateChange])

  // Add template to existing workflow (append mode)
  const addTemplateToWorkflow = useCallback((template: WorkflowTemplate, currentNodes: Node[], currentEdges: Edge[]) => {
    // Calculate offset position to avoid overlapping with existing nodes
    const maxX = currentNodes.length > 0 ? Math.max(...currentNodes.map(n => n.position.x)) : 0
    const offsetX = maxX + 300 // Add some spacing

    const nodeIdMap = new Map<string, string>()
    
    // Create new nodes with offset positions and unique IDs
    const templateNodes: Node[] = template.nodes.map((node) => {
      const newId = `${node.data.nodeType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      nodeIdMap.set(node.id, newId)
      
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + offsetX,
          y: node.position.y
        },
        data: {
          ...node.data,
          status: 'idle'
        }
      }
    })

    // Create new edges with updated node references
    const templateEdges: Edge[] = template.edges.map((edge) => {
      const newSourceId = nodeIdMap.get(edge.source) || edge.source
      const newTargetId = nodeIdMap.get(edge.target) || edge.target
      
      return {
        ...edge,
        id: `${newSourceId}-${newTargetId}-${Date.now()}`,
        source: newSourceId,
        target: newTargetId
      }
    })

    // Combine with existing nodes and edges
    const allNodes = [...currentNodes, ...templateNodes]
    const allEdges = [...currentEdges, ...templateEdges]

    onNodesChange(allNodes)
    onEdgesChange(allEdges)

    // Reset validation since workflow changed
    onWorkflowStateChange({
      isValid: false,
      validationErrors: []
    })

    return { nodes: allNodes, edges: allEdges }
  }, [onNodesChange, onEdgesChange, onWorkflowStateChange])

  // Create a new workflow from template (replaces current workflow)
  const createFromTemplate = useCallback((templateId: string) => {
    const template = getTemplateById(templateId)
    if (!template) {
      console.error(`Template with id "${templateId}" not found`)
      return null
    }

    return loadTemplate(template)
  }, [loadTemplate])

  // Export current workflow as a template format
  const exportAsTemplate = useCallback((
    nodes: Node[], 
    edges: Edge[], 
    templateInfo: {
      name: string
      description: string
      category: WorkflowTemplate['category']
      difficulty: WorkflowTemplate['difficulty']
      tags: string[]
    }
  ): WorkflowTemplate => {
    // Reset positions to start from origin for template
    const minX = Math.min(...nodes.map(n => n.position.x))
    const minY = Math.min(...nodes.map(n => n.position.y))

    const normalizedNodes = nodes.map(node => ({
      ...node,
      position: {
        x: node.position.x - minX,
        y: node.position.y - minY
      },
      data: {
        ...node.data,
        status: 'idle' // Reset status for template
      }
    }))

    return {
      id: `custom-${Date.now()}`,
      name: templateInfo.name,
      description: templateInfo.description,
      category: templateInfo.category,
      icon: '🔧', // Default icon for custom templates
      difficulty: templateInfo.difficulty,
      estimatedSetupTime: 'Custom',
      nodes: normalizedNodes,
      edges: edges,
      tags: templateInfo.tags
    }
  }, [])

  return {
    loadTemplate,
    addTemplateToWorkflow,
    createFromTemplate,
    exportAsTemplate
  }
}