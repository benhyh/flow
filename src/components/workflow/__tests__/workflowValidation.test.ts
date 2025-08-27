import { 
  validateWorkflow, 
  getValidationSummary, 
  validateNodeConfiguration,
  validateWorkflowStructure,
  type ValidationResult 
} from '../index'
import { type Node, type Edge } from '@xyflow/react'

describe('workflowValidation', () => {
  const validNodes: Node[] = [
    {
      id: '1',
      type: 'trigger',
      position: { x: 0, y: 0 },
      data: { 
        subtype: 'email-trigger', 
        label: 'Email Trigger',
        config: {
          subject: 'Test Subject',
          sender: 'test@example.com'
        }
      }
    },
    {
      id: '2',
      type: 'action',
      position: { x: 200, y: 0 },
      data: { 
        subtype: 'trello-action', 
        label: 'Create Trello Card',
        config: {
          boardId: 'board-123',
          listId: 'list-456',
          title: 'New Card'
        }
      }
    }
  ]

  const validEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2' }
  ]

  describe('validateWorkflow', () => {
    test('validates complete valid workflow', () => {
      const result = validateWorkflow(validNodes, validEdges)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
      expect(result.nodeValidations).toHaveLength(2)
    })

    test('detects empty workflow', () => {
      const result = validateWorkflow([], [])
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Workflow cannot be empty')
    })

    test('detects workflow without triggers', () => {
      const noTriggerNodes = validNodes.filter(node => node.type !== 'trigger')
      const result = validateWorkflow(noTriggerNodes, validEdges)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Workflow must have at least one trigger node')
    })

    test('detects disconnected nodes', () => {
      const disconnectedNodes: Node[] = [
        ...validNodes,
        {
          id: '3',
          type: 'action',
          position: { x: 400, y: 0 },
          data: { 
            subtype: 'asana-action', 
            label: 'Disconnected Action',
            config: {}
          }
        }
      ]
      
      const result = validateWorkflow(disconnectedNodes, validEdges)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Node 3 (Disconnected Action) is not connected to any other nodes')
    })

    test('detects invalid node configurations', () => {
      const invalidNodes: Node[] = [
        {
          id: '1',
          type: 'trigger',
          position: { x: 0, y: 0 },
          data: { 
            subtype: 'email-trigger', 
            label: 'Email Trigger',
            config: {} // Missing required config
          }
        },
        validNodes[1]
      ]
      
      const result = validateWorkflow(invalidNodes, validEdges)
      
      expect(result.isValid).toBe(false)
      expect(result.nodeValidations[0].isValid).toBe(false)
    })

    test('detects circular dependencies', () => {
      const circularNodes: Node[] = [
        ...validNodes,
        {
          id: '3',
          type: 'logic',
          position: { x: 100, y: 100 },
          data: { 
            subtype: 'if-condition', 
            label: 'If Condition',
            config: { condition: 'true' }
          }
        }
      ]
      
      const circularEdges: Edge[] = [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' },
        { id: 'e3-1', source: '3', target: '1' } // Creates circle
      ]
      
      const result = validateWorkflow(circularNodes, circularEdges)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Circular dependency detected in workflow')
    })

    test('provides warnings for potential issues', () => {
      const singleNodeWorkflow: Node[] = [validNodes[0]]
      const result = validateWorkflow(singleNodeWorkflow, [])
      
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings).toContain('Workflow has only one node - consider adding actions')
    })
  })

  describe('validateNodeConfiguration', () => {
    test('validates email trigger configuration', () => {
      const result = validateNodeConfiguration(validNodes[0])
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('detects missing email trigger configuration', () => {
      const invalidNode: Node = {
        ...validNodes[0],
        data: {
          ...validNodes[0].data,
          config: {}
        }
      }
      
      const result = validateNodeConfiguration(invalidNode)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Subject filter is required')
    })

    test('validates trello action configuration', () => {
      const result = validateNodeConfiguration(validNodes[1])
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('detects missing trello action configuration', () => {
      const invalidNode: Node = {
        ...validNodes[1],
        data: {
          ...validNodes[1].data,
          config: {}
        }
      }
      
      const result = validateNodeConfiguration(invalidNode)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Board ID is required')
      expect(result.errors).toContain('List ID is required')
    })

    test('validates asana action configuration', () => {
      const asanaNode: Node = {
        id: '3',
        type: 'action',
        position: { x: 0, y: 0 },
        data: {
          subtype: 'asana-action',
          label: 'Asana Task',
          config: {
            projectId: 'project-123',
            title: 'Task Title'
          }
        }
      }
      
      const result = validateNodeConfiguration(asanaNode)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('validates logic node configuration', () => {
      const logicNode: Node = {
        id: '4',
        type: 'logic',
        position: { x: 0, y: 0 },
        data: {
          subtype: 'if-condition',
          label: 'If Condition',
          config: {
            condition: 'subject.contains("urgent")',
            operator: 'contains'
          }
        }
      }
      
      const result = validateNodeConfiguration(logicNode)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('validates AI node configuration', () => {
      const aiNode: Node = {
        id: '5',
        type: 'ai',
        position: { x: 0, y: 0 },
        data: {
          subtype: 'ai-tagging',
          label: 'AI Tagging',
          config: {
            model: 'gpt-3.5-turbo',
            prompt: 'Tag this content'
          }
        }
      }
      
      const result = validateNodeConfiguration(aiNode)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('handles unknown node types', () => {
      const unknownNode: Node = {
        id: '6',
        type: 'unknown' as any,
        position: { x: 0, y: 0 },
        data: {
          subtype: 'unknown-type',
          label: 'Unknown Node',
          config: {}
        }
      }
      
      const result = validateNodeConfiguration(unknownNode)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Unknown node type: unknown')
    })

    test('validates email format in sender field', () => {
      const invalidEmailNode: Node = {
        ...validNodes[0],
        data: {
          ...validNodes[0].data,
          config: {
            subject: 'Test',
            sender: 'invalid-email'
          }
        }
      }
      
      const result = validateNodeConfiguration(invalidEmailNode)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid email format for sender')
    })
  })

  describe('validateWorkflowStructure', () => {
    test('validates proper workflow structure', () => {
      const result = validateWorkflowStructure(validNodes, validEdges)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('detects missing trigger nodes', () => {
      const noTriggerNodes = validNodes.filter(node => node.type !== 'trigger')
      const result = validateWorkflowStructure(noTriggerNodes, validEdges)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Workflow must have at least one trigger node')
    })

    test('detects orphaned nodes', () => {
      const orphanedNodes: Node[] = [
        ...validNodes,
        {
          id: '3',
          type: 'action',
          position: { x: 400, y: 0 },
          data: { subtype: 'asana-action', label: 'Orphaned', config: {} }
        }
      ]
      
      const result = validateWorkflowStructure(orphanedNodes, validEdges)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Node 3 (Orphaned) is not connected to any other nodes')
    })

    test('allows multiple trigger nodes', () => {
      const multiTriggerNodes: Node[] = [
        ...validNodes,
        {
          id: '3',
          type: 'trigger',
          position: { x: 0, y: 200 },
          data: { 
            subtype: 'email-trigger', 
            label: 'Second Trigger',
            config: { subject: 'Another', sender: 'test2@example.com' }
          }
        }
      ]
      
      const multiTriggerEdges: Edge[] = [
        ...validEdges,
        { id: 'e3-2', source: '3', target: '2' }
      ]
      
      const result = validateWorkflowStructure(multiTriggerNodes, multiTriggerEdges)
      
      expect(result.isValid).toBe(true)
    })
  })

  describe('getValidationSummary', () => {
    test('creates summary for valid workflow', () => {
      const validationResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        nodeValidations: [
          { nodeId: '1', isValid: true, errors: [], warnings: [] },
          { nodeId: '2', isValid: true, errors: [], warnings: [] }
        ]
      }
      
      const summary = getValidationSummary(validationResult)
      
      expect(summary.status).toBe('valid')
      expect(summary.totalErrors).toBe(0)
      expect(summary.totalWarnings).toBe(0)
      expect(summary.validNodes).toBe(2)
      expect(summary.invalidNodes).toBe(0)
    })

    test('creates summary for invalid workflow', () => {
      const invalidationResult: ValidationResult = {
        isValid: false,
        errors: ['Workflow error 1', 'Workflow error 2'],
        warnings: ['Workflow warning 1'],
        nodeValidations: [
          { nodeId: '1', isValid: false, errors: ['Node error'], warnings: [] },
          { nodeId: '2', isValid: true, errors: [], warnings: ['Node warning'] }
        ]
      }
      
      const summary = getValidationSummary(invalidationResult)
      
      expect(summary.status).toBe('invalid')
      expect(summary.totalErrors).toBe(3) // 2 workflow + 1 node
      expect(summary.totalWarnings).toBe(2) // 1 workflow + 1 node
      expect(summary.validNodes).toBe(1)
      expect(summary.invalidNodes).toBe(1)
    })

    test('creates summary for workflow with warnings only', () => {
      const warningResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: ['Minor issue'],
        nodeValidations: [
          { nodeId: '1', isValid: true, errors: [], warnings: ['Node warning'] }
        ]
      }
      
      const summary = getValidationSummary(warningResult)
      
      expect(summary.status).toBe('warning')
      expect(summary.totalErrors).toBe(0)
      expect(summary.totalWarnings).toBe(2)
    })
  })

  describe('edge cases', () => {
    test('handles null nodes array', () => {
      const result = validateWorkflow(null as any, validEdges)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid workflow data')
    })

    test('handles null edges array', () => {
      const result = validateWorkflow(validNodes, null as any)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid workflow data')
    })

    test('handles node without data', () => {
      const nodeWithoutData: Node = {
        id: '1',
        type: 'trigger',
        position: { x: 0, y: 0 },
        data: null as any
      }
      
      const result = validateNodeConfiguration(nodeWithoutData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Node data is missing')
    })

    test('handles node without config', () => {
      const nodeWithoutConfig: Node = {
        id: '1',
        type: 'trigger',
        position: { x: 0, y: 0 },
        data: {
          subtype: 'email-trigger',
          label: 'Test'
        } as any
      }
      
      const result = validateNodeConfiguration(nodeWithoutConfig)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Node configuration is missing')
    })
  })
})