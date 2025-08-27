import { 
  validateConnection,
  getConnectionFeedback 
} from '../utils/connectionValidation'
import { type Node, type Edge, type Connection } from '@xyflow/react'

describe('connectionValidation', () => {
  const mockNodes: Node[] = [
    {
      id: '1',
      type: 'trigger',
      position: { x: 0, y: 0 },
      data: { subtype: 'email-trigger', label: 'Email Trigger' }
    },
    {
      id: '2',
      type: 'action',
      position: { x: 200, y: 0 },
      data: { subtype: 'trello-action', label: 'Create Trello Card' }
    },
    {
      id: '3',
      type: 'logic',
      position: { x: 100, y: 100 },
      data: { subtype: 'if-condition', label: 'If Condition' }
    },
    {
      id: '4',
      type: 'ai',
      position: { x: 300, y: 100 },
      data: { subtype: 'ai-tagging', label: 'AI Tagging' }
    }
  ]

  const mockEdges: Edge[] = [
    { id: 'e1-3', source: '1', target: '3' }
  ]

  describe('validateConnection', () => {
    test('allows trigger to action connection', () => {
      const connection: Connection = { source: '1', target: '2', sourceHandle: null, targetHandle: null }
      const result = validateConnection(connection, mockNodes, mockEdges)
      
      expect(result.isValid).toBe(true)
    })

    test('allows trigger to logic connection', () => {
      // Use a different target that doesn't already have a connection
      const connection: Connection = { source: '1', target: '4', sourceHandle: null, targetHandle: null }
      const result = validateConnection(connection, mockNodes, mockEdges)
      
      expect(result.isValid).toBe(true)
    })

    test('allows action to action connection', () => {
      const connection: Connection = { source: '2', target: '4', sourceHandle: null, targetHandle: null }
      const result = validateConnection(connection, mockNodes, mockEdges)
      
      expect(result.isValid).toBe(true)
    })

    test('allows logic to action connection', () => {
      const connection: Connection = { source: '3', target: '2', sourceHandle: null, targetHandle: null }
      const result = validateConnection(connection, mockNodes, mockEdges)
      
      expect(result.isValid).toBe(true)
    })

    test('prevents action to trigger connection', () => {
      const connection: Connection = { source: '2', target: '1', sourceHandle: null, targetHandle: null }
      const result = validateConnection(connection, mockNodes, mockEdges)
      
      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('cannot connect to')
    })

    test('prevents logic to trigger connection', () => {
      const connection: Connection = { source: '3', target: '1', sourceHandle: null, targetHandle: null }
      const result = validateConnection(connection, mockNodes, mockEdges)
      
      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('cannot connect to')
    })

    test('prevents duplicate connections', () => {
      const connection: Connection = { source: '1', target: '3', sourceHandle: null, targetHandle: null }
      const result = validateConnection(connection, mockNodes, mockEdges)
      
      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('already exists')
    })

    test('prevents self-connections', () => {
      const connection: Connection = { source: '1', target: '1', sourceHandle: null, targetHandle: null }
      const result = validateConnection(connection, mockNodes, mockEdges)
      
      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('cannot connect to themselves')
    })

    test('prevents circular connections', () => {
      const edgesWithCircle: Edge[] = [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' },
        { id: 'e3-4', source: '3', target: '4' }
      ]
      
      // This would create a circle: 1 -> 2 -> 3 -> 4 -> 2 (back to action node)
      const connection: Connection = { source: '4', target: '2', sourceHandle: null, targetHandle: null }
      const result = validateConnection(connection, mockNodes, edgesWithCircle)
      
      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('circular')
    })

    test('handles missing source node', () => {
      const connection: Connection = { source: 'nonexistent', target: '2', sourceHandle: null, targetHandle: null }
      const result = validateConnection(connection, mockNodes, mockEdges)
      
      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('not found')
    })

    test('handles missing target node', () => {
      const connection: Connection = { source: '1', target: 'nonexistent', sourceHandle: null, targetHandle: null }
      const result = validateConnection(connection, mockNodes, mockEdges)
      
      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('not found')
    })
  })



  describe('getConnectionFeedback', () => {
    test('returns success feedback for valid connections', () => {
      const connection: Connection = { source: '1', target: '2', sourceHandle: null, targetHandle: null }
      const feedback = getConnectionFeedback(connection, mockNodes, mockEdges)
      
      expect(feedback.isValid).toBe(true)
      expect(feedback.color).toBe('#10b981')
      expect(feedback.message).toBe('Valid connection')
    })

    test('returns error feedback for invalid connections', () => {
      const connection: Connection = { source: '2', target: '1', sourceHandle: null, targetHandle: null }
      const feedback = getConnectionFeedback(connection, mockNodes, mockEdges)
      
      expect(feedback.isValid).toBe(false)
      expect(feedback.color).toBe('#ef4444')
      expect(feedback.message).toContain('cannot connect to')
    })

    test('returns error feedback for duplicate connections', () => {
      const connection: Connection = { source: '1', target: '3', sourceHandle: null, targetHandle: null }
      const feedback = getConnectionFeedback(connection, mockNodes, mockEdges)
      
      expect(feedback.isValid).toBe(false)
      expect(feedback.color).toBe('#ef4444')
      expect(feedback.message).toContain('already exists')
    })
  })

  describe('edge cases', () => {
    test('handles empty nodes array', () => {
      const connection: Connection = { source: '1', target: '2', sourceHandle: null, targetHandle: null }
      const result = validateConnection(connection, [], [])
      
      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('not found')
    })

    test('handles empty edges array', () => {
      const connection: Connection = { source: '1', target: '2', sourceHandle: null, targetHandle: null }
      const result = validateConnection(connection, mockNodes, [])
      
      expect(result.isValid).toBe(true)
    })

    test('handles null connection', () => {
      const result = validateConnection(null as unknown as Connection, mockNodes, mockEdges)
      
      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('not found')
    })

    test('handles connection without source', () => {
      const connection: Connection = { target: '2', sourceHandle: null, targetHandle: null } as Connection
      const result = validateConnection(connection, mockNodes, mockEdges)
      
      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('not found')
    })

    test('handles connection without target', () => {
      const connection: Connection = { source: '1', sourceHandle: null, targetHandle: null } as Connection
      const result = validateConnection(connection, mockNodes, mockEdges)
      
      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('not found')
    })
  })
})