// Tests for the enhanced tag formatting system with target type support

import {
  formatWorkflowTags,
  formatTagsForTrello,
  formatTagsForAsana,
  createTrelloLabelMapping,
  convertTagsToTrelloLabelIds,
  mergeTagsIntoTaskData,
  previewTagFormatting
} from '../workflow-tag-formatting'

describe('Workflow Tag Formatting', () => {
  const sampleTags = ['urgent', 'support', 'technical']
  const sampleCategories = ['billing', 'question']

  describe('formatTagsForTrello', () => {
    it('should format tags for Trello labels', () => {
      const result = formatTagsForTrello(sampleTags, sampleCategories)
      
      expect(result.labelNames).toContain('Urgent')
      expect(result.labelNames).toContain('Support')
      expect(result.labelNames).toContain('Technical')
      expect(result.labelNames).toContain('Billing')
      expect(result.labelNames).toContain('Question')
      
      expect(result.description).toContain('Tags:')
      expect(result.description).toContain('#urgent')
      expect(result.description).toContain('#billing')
    })

    it('should handle empty tags gracefully', () => {
      const result = formatTagsForTrello([], [])
      
      expect(result.labelNames).toEqual([])
      expect(result.description).toBe('')
    })

    it('should remove duplicate labels', () => {
      const result = formatTagsForTrello(['urgent', 'urgent'], ['support'])
      
      expect(result.labelNames).toEqual(['Urgent', 'Support'])
    })
  })

  describe('formatTagsForAsana', () => {
    it('should format tags for Asana custom fields', () => {
      const result = formatTagsForAsana(sampleTags, sampleCategories)
      
      expect(result.customFields['tag_urgent']).toBe(true)
      expect(result.customFields['tag_support']).toBe(true)
      expect(result.customFields['tag_technical']).toBe(true)
      expect(result.customFields['category_billing']).toBe(true)
      expect(result.customFields['category_question']).toBe(true)
      
      expect(result.customFields['workflow_tags']).toBe('urgent,support,technical,billing,question')
      
      expect(result.notes).toContain('Workflow Tags:')
      expect(result.notes).toContain('#urgent')
      expect(result.notes).toContain('#billing')
    })

    it('should handle empty tags gracefully', () => {
      const result = formatTagsForAsana([], [])
      
      expect(result.customFields).toEqual({})
      expect(result.notes).toBe('')
    })
  })

  describe('formatWorkflowTags', () => {
    it('should format for both systems when targetType is "both"', () => {
      const result = formatWorkflowTags(sampleTags, sampleCategories, 'both')
      
      expect(result.trello).toBeDefined()
      expect(result.asana).toBeDefined()
      
      expect(result.trello?.labelNames).toContain('Urgent')
      expect(result.asana?.customFields['tag_urgent']).toBe(true)
    })

    it('should format only for Trello when targetType is "trello"', () => {
      const result = formatWorkflowTags(sampleTags, sampleCategories, 'trello')
      
      expect(result.trello).toBeDefined()
      expect(result.asana).toBeUndefined()
    })

    it('should format only for Asana when targetType is "asana"', () => {
      const result = formatWorkflowTags(sampleTags, sampleCategories, 'asana')
      
      expect(result.trello).toBeUndefined()
      expect(result.asana).toBeDefined()
    })
  })

  describe('createTrelloLabelMapping', () => {
    it('should create correct label mapping', () => {
      const boardLabels = [
        { id: 'label1', name: 'Urgent', color: 'red' },
        { id: 'label2', name: 'Support', color: 'blue' },
        { id: 'label3', name: 'High Priority', color: 'red' },
        { id: 'label4', name: 'Customer Support', color: 'green' }
      ]
      
      const mapping = createTrelloLabelMapping(boardLabels)
      
      expect(mapping['urgent']).toBe('label1')
      expect(mapping['support']).toBe('label2')
      // Test variations
      expect(mapping['urgent']).toBe('label3') // High Priority maps to urgent
      expect(mapping['support']).toBe('label4') // Customer Support maps to support
    })
  })

  describe('convertTagsToTrelloLabelIds', () => {
    it('should convert tag names to label IDs', () => {
      const labelMapping = {
        'urgent': 'label1',
        'support': 'label2',
        'technical': 'label3'
      }
      
      const labelIds = convertTagsToTrelloLabelIds(['urgent', 'support', 'unknown'], labelMapping)
      
      expect(labelIds).toContain('label1')
      expect(labelIds).toContain('label2')
      expect(labelIds).not.toContain('unknown')
      expect(labelIds).toHaveLength(2)
    })

    it('should remove duplicate IDs', () => {
      const labelMapping = {
        'urgent': 'label1',
        'critical': 'label1', // Maps to same ID
        'support': 'label2'
      }
      
      const labelIds = convertTagsToTrelloLabelIds(['urgent', 'critical'], labelMapping)
      
      expect(labelIds).toEqual(['label1'])
    })
  })

  describe('mergeTagsIntoTaskData', () => {
    it('should merge Trello tags into task data', () => {
      const baseData = {
        name: 'Test Task',
        idList: 'list123'
      }
      
      const labelMapping = {
        'urgent': 'label1',
        'support': 'label2'
      }
      
      const result = mergeTagsIntoTaskData(
        baseData,
        ['urgent', 'support'],
        [],
        'trello',
        labelMapping
      )
      
      expect(result.name).toBe('Test Task')
      expect(result.idList).toBe('list123')
      expect(result.idLabels).toContain('label1')
      expect(result.idLabels).toContain('label2')
      expect(result.desc).toContain('Tags:')
    })

    it('should merge Asana tags into task data', () => {
      const baseData = {
        name: 'Test Task',
        notes: 'Original notes'
      }
      
      const result = mergeTagsIntoTaskData(
        baseData,
        ['urgent'],
        ['support'],
        'asana'
      )
      
      expect(result.name).toBe('Test Task')
      expect(result.custom_fields['tag_urgent']).toBe(true)
      expect(result.custom_fields['category_support']).toBe(true)
      expect(result.notes).toContain('Workflow Tags:')
      expect(result.notes).toContain('Original notes')
    })

    it('should merge both systems when targetType is "both"', () => {
      const baseData = { name: 'Test Task' }
      const labelMapping = { 'urgent': 'label1' }
      
      const result = mergeTagsIntoTaskData(
        baseData,
        ['urgent'],
        [],
        'both',
        labelMapping
      )
      
      expect(result.idLabels).toContain('label1') // Trello
      expect(result.custom_fields['tag_urgent']).toBe(true) // Asana
    })
  })

  describe('previewTagFormatting', () => {
    it('should generate correct preview for both systems', () => {
      const { preview, details } = previewTagFormatting(
        ['urgent', 'support'],
        ['technical'],
        'both'
      )
      
      expect(preview).toContain('urgent, support, technical → Both systems')
      expect(details).toHaveLength(2)
      expect(details[0]).toContain('Trello:')
      expect(details[1]).toContain('Asana:')
    })

    it('should generate correct preview for single system', () => {
      const { preview, details } = previewTagFormatting(
        ['urgent'],
        [],
        'trello'
      )
      
      expect(preview).toContain('urgent → Trello labels')
      expect(details).toHaveLength(1)
      expect(details[0]).toContain('Trello:')
    })
  })
})
