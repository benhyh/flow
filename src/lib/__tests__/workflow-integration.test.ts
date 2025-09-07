// Integration tests for complete workflow scenarios
import {
  WorkflowData,
  processWorkflowData,
  createMockEmailData
} from '../workflow-data-flow'

describe('Workflow Integration Tests', () => {
  describe('Email → Logic → Action Flow', () => {
    it('should process complete urgent email workflow', () => {
      // Create mock urgent email
      const emailData = createMockEmailData(
        'Urgent: Payment system is down',
        'Hi support, our payment system has been down for 20 minutes. Customers cannot complete purchases. Please help ASAP!',
        'urgent@customer.com'
      )

      // Step 1: Process through logic node (check if urgent)
      const logicConfig = {
        field: 'email.subject',
        operator: 'contains',
        value: 'urgent'
      }

      const afterLogic = processWorkflowData(
        emailData,
        'logic-urgent-check',
        'condition-logic',
        logicConfig
      )

      // Verify logic result
      expect(afterLogic.conditions?.['logic-urgent-check']).toBe(true)

      // Step 2: Process through AI tagging (if urgent path)
      if (afterLogic.conditions?.['logic-urgent-check']) {
        const aiTaggingConfig = {
          selectedTags: ['urgent', 'technical', 'payment'],
          tagKeywords: {
            urgent: 'urgent, asap, immediate, critical',
            technical: 'system, technical, api, integration',
            payment: 'payment, billing, purchase, transaction'
          }
        }

        const afterAI = processWorkflowData(
          afterLogic,
          'ai-tagging',
          'ai-tagging',
          aiTaggingConfig
        )

        // Verify AI tagging results
        expect(afterAI.tags).toContain('urgent')
        expect(afterAI.tags).toContain('technical')
        expect(afterAI.tags).toContain('payment')

        // Verify processing trail
        expect(afterAI.processedBy).toEqual(['logic-urgent-check', 'ai-tagging'])

        // This would normally go to a high-priority action (like Trello urgent board)
        console.log('✅ Urgent email would be routed to high-priority action')
        console.log('📧 Email:', afterAI.trigger.data.subject)
        console.log('🏷️ Tags:', afterAI.tags)
        console.log('🎯 Condition:', afterAI.conditions)
      }
    })

    it('should process normal email workflow differently', () => {
      // Create mock normal email
      const emailData = createMockEmailData(
        'Question about pricing plans',
        'Hello, I would like to learn more about your premium pricing plans and features. Could you send me more information?',
        'customer@company.com'
      )

      // Step 1: Process through logic node (check if urgent)
      const logicConfig = {
        field: 'email.subject',
        operator: 'contains',
        value: 'urgent'
      }

      const afterLogic = processWorkflowData(
        emailData,
        'logic-urgent-check',
        'condition-logic',
        logicConfig
      )

      // Verify logic result (should be false for normal email)
      expect(afterLogic.conditions?.['logic-urgent-check']).toBe(false)

      // Step 2: Process through AI classification for normal path
      const aiClassificationConfig = {
        selectedCategories: ['sales', 'inquiry'],
        categoryKeywords: {
          sales: 'pricing, plans, purchase, buy, upgrade',
          inquiry: 'question, information, learn more, details'
        }
      }

      const afterAI = processWorkflowData(
        afterLogic,
        'ai-classification',
        'ai-classification',
        aiClassificationConfig
      )

      // Verify AI classification results
      expect(afterAI.categories).toContain('sales')
      expect(afterAI.categories).toContain('inquiry')

      // This would go to sales team action
      console.log('✅ Normal email would be routed to sales team')
      console.log('📧 Email:', afterAI.trigger.data.subject)
      console.log('🏷️ Categories:', afterAI.categories)
      console.log('🎯 Condition:', afterAI.conditions)
    })
  })

  describe('Complex Multi-Node Flow', () => {
    it('should handle sequential processing through multiple nodes', () => {
      const emailData = createMockEmailData(
        'Urgent Technical Issue: API Integration Problem',
        'Hi team, we are experiencing critical issues with the API integration. Our production system is down and affecting all customers. Please escalate to technical team immediately!',
        'admin@client.com'
      )

      let workflowData = emailData

      // Node 1: Logic - Check if urgent
      workflowData = processWorkflowData(
        workflowData,
        'logic-1',
        'condition-logic',
        {
          field: 'email.subject',
          operator: 'contains',
          value: 'urgent'
        }
      )

      // Node 2: AI Tagging - Add priority tags
      workflowData = processWorkflowData(
        workflowData,
        'ai-tagging-1',
        'ai-tagging',
        {
          selectedTags: ['urgent', 'technical'],
          tagKeywords: {
            urgent: 'urgent, critical, immediate',
            technical: 'technical, api, integration, system'
          }
        }
      )

      // Node 3: AI Classification - Classify issue type
      workflowData = processWorkflowData(
        workflowData,
        'ai-classification-1',
        'ai-classification',
        {
          selectedCategories: ['technical', 'critical'],
          categoryKeywords: {
            technical: 'api, integration, technical, system',
            critical: 'critical, production, down, affecting'
          }
        }
      )

      // Node 4: Another logic check for escalation
      workflowData = processWorkflowData(
        workflowData,
        'logic-2',
        'condition-logic',
        {
          field: 'email.body',
          operator: 'contains',
          value: 'production'
        }
      )

      // Verify final state
      expect(workflowData.processedBy).toEqual([
        'logic-1',
        'ai-tagging-1',
        'ai-classification-1',
        'logic-2'
      ])

      expect(workflowData.conditions?.['logic-1']).toBe(true) // Is urgent
      expect(workflowData.conditions?.['logic-2']).toBe(true) // Mentions production

      expect(workflowData.tags).toContain('urgent')
      expect(workflowData.tags).toContain('technical')

      expect(workflowData.categories).toContain('technical')
      expect(workflowData.categories).toContain('critical')

      console.log('✅ Complex workflow processed successfully')
      console.log('📧 Subject:', workflowData.trigger.data.subject)
      console.log('🏷️ Tags:', workflowData.tags)
      console.log('📁 Categories:', workflowData.categories)
      console.log('⚡ Conditions:', workflowData.conditions)
      console.log('🔄 Processing trail:', workflowData.processedBy)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty email content gracefully', () => {
      const emptyEmailData = createMockEmailData('', '', '')

      const result = processWorkflowData(
        emptyEmailData,
        'logic-test',
        'condition-logic',
        {
          field: 'email.subject',
          operator: 'contains',
          value: 'test'
        }
      )

      expect(result.conditions?.['logic-test']).toBe(false)
    })

    it('should handle nodes with no matching keywords', () => {
      const emailData = createMockEmailData(
        'Simple greeting',
        'Hello, how are you?',
        'friend@example.com'
      )

      const result = processWorkflowData(
        emailData,
        'ai-test',
        'ai-tagging',
        {
          selectedTags: ['urgent', 'technical'],
          tagKeywords: {
            urgent: 'urgent, critical',
            technical: 'api, system'
          }
        }
      )

      expect(result.tags).toEqual([]) // No tags should be applied
    })
  })
})
