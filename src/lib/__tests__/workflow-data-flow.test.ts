// Jest is configured for this project
import {
  WorkflowData,
  evaluateLogicCondition,
  applyAITagging,
  applyAIClassification,
  processWorkflowData,
  createMockEmailData
} from '../workflow-data-flow'

describe('Workflow Data Flow', () => {
  // Mock email data for testing
  const mockEmailData: WorkflowData = createMockEmailData(
    'Urgent: Server is down - need immediate help',
    'Hi support team, we have a critical issue with our API integration. The server has been down for 30 minutes and our customers are unable to access our service. Please help us resolve this ASAP!',
    'john@company.com'
  )

  describe('Logic Condition Evaluation', () => {
    it('should evaluate "contains" condition correctly', () => {
      const result = evaluateLogicCondition(
        'email.subject',
        'contains',
        'urgent',
        mockEmailData
      )
      expect(result).toBe(true)
    })

    it('should evaluate "equals" condition correctly', () => {
      const result = evaluateLogicCondition(
        'email.sender',
        'equals',
        'john@company.com',
        mockEmailData
      )
      expect(result).toBe(true)
    })

    it('should evaluate "startsWith" condition correctly', () => {
      const result = evaluateLogicCondition(
        'email.subject',
        'startsWith',
        'urgent',
        mockEmailData
      )
      expect(result).toBe(true)
    })

    it('should evaluate "endsWith" condition correctly', () => {
      const result = evaluateLogicCondition(
        'email.subject',
        'endsWith',
        'help',
        mockEmailData
      )
      expect(result).toBe(true)
    })

    it('should return false for non-matching conditions', () => {
      const result = evaluateLogicCondition(
        'email.subject',
        'contains',
        'billing',
        mockEmailData
      )
      expect(result).toBe(false)
    })

    it('should handle case insensitive matching', () => {
      const result = evaluateLogicCondition(
        'email.subject',
        'contains',
        'URGENT',
        mockEmailData
      )
      expect(result).toBe(true)
    })
  })

  describe('AI Tagging', () => {
    it('should apply tags based on keyword matching', () => {
      const selectedTags = ['urgent', 'technical', 'support']
      const tagKeywords = {
        urgent: 'urgent, asap, critical, immediate',
        technical: 'technical, api, server, integration',
        support: 'support, help, issue, problem'
      }

      const appliedTags = applyAITagging(selectedTags, tagKeywords, mockEmailData)
      
      expect(appliedTags).toContain('urgent')
      expect(appliedTags).toContain('technical')
      expect(appliedTags).toContain('support')
      expect(appliedTags).toHaveLength(3)
    })

    it('should not apply tags when keywords do not match', () => {
      const selectedTags = ['billing', 'sales']
      const tagKeywords = {
        billing: 'billing, invoice, payment',
        sales: 'sales, purchase, pricing'
      }

      const appliedTags = applyAITagging(selectedTags, tagKeywords, mockEmailData)
      
      expect(appliedTags).toHaveLength(0)
    })

    it('should handle partial keyword matches', () => {
      const selectedTags = ['priority']
      const tagKeywords = {
        priority: 'server, critical' // 'server' is in the email body
      }

      const appliedTags = applyAITagging(selectedTags, tagKeywords, mockEmailData)
      
      expect(appliedTags).toContain('priority')
    })
  })

  describe('AI Classification', () => {
    it('should classify content based on keyword matching', () => {
      const selectedCategories = ['technical', 'support']
      const categoryKeywords = {
        technical: 'api, server, integration, technical',
        support: 'support, help, issue, problem'
      }

      const appliedCategories = applyAIClassification(selectedCategories, categoryKeywords, mockEmailData)
      
      expect(appliedCategories).toContain('technical')
      expect(appliedCategories).toContain('support')
      expect(appliedCategories).toHaveLength(2)
    })

    it('should not classify when keywords do not match', () => {
      const selectedCategories = ['sales', 'marketing']
      const categoryKeywords = {
        sales: 'sales, purchase, pricing',
        marketing: 'marketing, campaign, newsletter'
      }

      const appliedCategories = applyAIClassification(selectedCategories, categoryKeywords, mockEmailData)
      
      expect(appliedCategories).toHaveLength(0)
    })
  })

  describe('Workflow Processing', () => {
    it('should process logic node correctly', () => {
      const nodeConfig = {
        field: 'email.subject',
        operator: 'contains',
        value: 'urgent'
      }

      const result = processWorkflowData(
        mockEmailData,
        'logic-1',
        'condition-logic',
        nodeConfig
      )

      expect(result.conditions).toBeDefined()
      expect(result.conditions!['logic-1']).toBe(true)
      expect(result.processedBy).toContain('logic-1')
    })

    it('should process AI tagging node correctly', () => {
      const nodeConfig = {
        selectedTags: ['urgent', 'technical'],
        tagKeywords: {
          urgent: 'urgent, critical',
          technical: 'api, server'
        }
      }

      const result = processWorkflowData(
        mockEmailData,
        'ai-1',
        'ai-tagging',
        nodeConfig
      )

      expect(result.tags).toBeDefined()
      expect(result.tags).toContain('urgent')
      expect(result.tags).toContain('technical')
      expect(result.processedBy).toContain('ai-1')
    })

    it('should process AI classification node correctly', () => {
      const nodeConfig = {
        selectedCategories: ['technical', 'support'],
        categoryKeywords: {
          technical: 'api, server',
          support: 'support, help'
        }
      }

      const result = processWorkflowData(
        mockEmailData,
        'ai-2',
        'ai-classification',
        nodeConfig
      )

      expect(result.categories).toBeDefined()
      expect(result.categories).toContain('technical')
      expect(result.categories).toContain('support')
      expect(result.processedBy).toContain('ai-2')
    })

    it('should handle sequential processing', () => {
      // First process with logic node
      const logicConfig = {
        field: 'email.subject',
        operator: 'contains',
        value: 'urgent'
      }

      let result = processWorkflowData(
        mockEmailData,
        'logic-1',
        'condition-logic',
        logicConfig
      )

      // Then process with AI tagging
      const aiConfig = {
        selectedTags: ['urgent'],
        tagKeywords: {
          urgent: 'urgent, critical'
        }
      }

      result = processWorkflowData(
        result,
        'ai-1',
        'ai-tagging',
        aiConfig
      )

      expect(result.conditions!['logic-1']).toBe(true)
      expect(result.tags).toContain('urgent')
      expect(result.processedBy).toEqual(['logic-1', 'ai-1'])
    })
  })

  describe('Mock Data Creation', () => {
    it('should create valid mock email data', () => {
      const mockData = createMockEmailData()
      
      expect(mockData.trigger.type).toBe('email')
      expect(mockData.trigger.data.subject).toBeDefined()
      expect(mockData.trigger.data.body).toBeDefined()
      expect(mockData.trigger.data.sender).toBeDefined()
      expect(mockData.processedBy).toEqual([])
      expect(mockData.timestamp).toBeDefined()
    })

    it('should create mock data with custom content', () => {
      const mockData = createMockEmailData(
        'Custom Subject',
        'Custom Body',
        'custom@email.com'
      )
      
      expect(mockData.trigger.data.subject).toBe('Custom Subject')
      expect(mockData.trigger.data.body).toBe('Custom Body')
      expect(mockData.trigger.data.sender).toBe('custom@email.com')
    })
  })
})
