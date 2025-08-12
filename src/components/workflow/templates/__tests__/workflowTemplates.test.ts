import { 
  workflowTemplates, 
  getFeaturedTemplates, 
  getTemplatesByCategory, 
  getTemplateById, 
  searchTemplates 
} from '../workflowTemplates'

describe('Workflow Templates', () => {
  test('should have valid template structure', () => {
    expect(workflowTemplates.length).toBeGreaterThan(0)
    
    workflowTemplates.forEach(template => {
      expect(template).toHaveProperty('id')
      expect(template).toHaveProperty('name')
      expect(template).toHaveProperty('description')
      expect(template).toHaveProperty('category')
      expect(template).toHaveProperty('nodes')
      expect(template).toHaveProperty('edges')
      expect(template.nodes.length).toBeGreaterThan(0)
    })
  })

  test('should return featured templates', () => {
    const featured = getFeaturedTemplates()
    expect(featured.length).toBeGreaterThan(0)
    featured.forEach(template => {
      expect(template.featured).toBe(true)
    })
  })

  test('should filter templates by category', () => {
    const emailTemplates = getTemplatesByCategory('email-automation')
    expect(emailTemplates.length).toBeGreaterThan(0)
    emailTemplates.forEach(template => {
      expect(template.category).toBe('email-automation')
    })
  })

  test('should find template by id', () => {
    const template = getTemplateById('email-to-trello')
    expect(template).toBeDefined()
    expect(template?.id).toBe('email-to-trello')
  })

  test('should search templates by query', () => {
    const results = searchTemplates('email')
    expect(results.length).toBeGreaterThan(0)
    results.forEach(template => {
      const matchesName = template.name.toLowerCase().includes('email')
      const matchesDescription = template.description.toLowerCase().includes('email')
      const matchesTags = template.tags.some(tag => tag.toLowerCase().includes('email'))
      expect(matchesName || matchesDescription || matchesTags).toBe(true)
    })
  })

  test('should return empty array for non-existent search', () => {
    const results = searchTemplates('nonexistentquery123')
    expect(results).toEqual([])
  })
})