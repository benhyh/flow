// Data flow types and utilities for workflow processing
// Following the TODO plan for simple data structure

export interface WorkflowData {
  // Original trigger data
  trigger: {
    type: 'email' | 'webhook' | 'schedule'
    data: Record<string, any>
  }
  
  // Added by logic nodes
  conditions?: {
    [nodeId: string]: boolean
  }
  
  // Added by AI nodes  
  tags?: string[]
  categories?: string[]
  
  // Target system for formatting
  targetType?: string
  
  // Processing metadata
  processedBy: string[]
  timestamp: string
}

// Logic node evaluation functions
export const evaluateLogicCondition = (
  field: string,
  operator: string,
  value: string,
  data: WorkflowData
): boolean => {
  // Extract the field value from workflow data
  const fieldValue = getFieldValue(field, data)
  
  if (fieldValue === undefined || fieldValue === null) {
    return false
  }
  
  const fieldStr = String(fieldValue).toLowerCase()
  const checkValue = value.toLowerCase()
  
  switch (operator) {
    case 'contains':
      return fieldStr.includes(checkValue)
    case 'equals':
      return fieldStr === checkValue
    case 'startsWith':
      return fieldStr.startsWith(checkValue)
    case 'endsWith':
      return fieldStr.endsWith(checkValue)
    default:
      return false
  }
}

// Helper function to extract field values from workflow data
const getFieldValue = (field: string, data: WorkflowData): any => {
  const parts = field.split('.')
  
  switch (parts[0]) {
    case 'email':
      return data.trigger.data[parts[1]]
    case 'trigger':
      return data.trigger.data
    default:
      return data.trigger.data[field]
  }
}

// AI tagging function with keyword matching and target type support
export const applyAITagging = (
  selectedTags: string[],
  tagKeywords: Record<string, string>,
  data: WorkflowData,
  targetType: string = 'both'
): { tags: string[]; targetType: string } => {
  const appliedTags: string[] = []
  
  // Get text content to analyze (email subject + body for now)
  const emailContent = [
    data.trigger.data.subject || '',
    data.trigger.data.body || '',
    data.trigger.data.sender || ''
  ].join(' ').toLowerCase()
  
  // Check each selected tag
  selectedTags.forEach(tagName => {
    const keywords = tagKeywords[tagName]
    if (keywords) {
      const keywordList = keywords.split(',').map(k => k.trim().toLowerCase())
      
      // Check if any keyword matches the content
      const hasMatch = keywordList.some(keyword => 
        keyword && emailContent.includes(keyword)
      )
      
      if (hasMatch) {
        appliedTags.push(tagName)
      }
    }
  })
  
  return { tags: appliedTags, targetType }
}

// AI classification function with keyword matching and target type support
export const applyAIClassification = (
  selectedCategories: string[],
  categoryKeywords: Record<string, string>,
  data: WorkflowData,
  targetType: string = 'both'
): { categories: string[]; targetType: string } => {
  const appliedCategories: string[] = []
  
  // Get text content to analyze
  const emailContent = [
    data.trigger.data.subject || '',
    data.trigger.data.body || '',
    data.trigger.data.sender || ''
  ].join(' ').toLowerCase()
  
  // Check each selected category
  selectedCategories.forEach(categoryName => {
    const keywords = categoryKeywords[categoryName]
    if (keywords) {
      const keywordList = keywords.split(',').map(k => k.trim().toLowerCase())
      
      // Check if any keyword matches the content
      const hasMatch = keywordList.some(keyword => 
        keyword && emailContent.includes(keyword)
      )
      
      if (hasMatch) {
        appliedCategories.push(categoryName)
      }
    }
  })
  
  return { categories: appliedCategories, targetType }
}

// Workflow processing utilities
export const processWorkflowData = (
  initialData: WorkflowData,
  nodeId: string,
  nodeType: string,
  nodeConfig: Record<string, any>
): WorkflowData => {
  const updatedData = {
    ...initialData,
    processedBy: [...initialData.processedBy, nodeId],
    timestamp: new Date().toISOString()
  }
  
  switch (nodeType) {
    case 'condition-logic':
      const conditionResult = evaluateLogicCondition(
        nodeConfig.field,
        nodeConfig.operator,
        nodeConfig.value,
        updatedData
      )
      return {
        ...updatedData,
        conditions: {
          ...updatedData.conditions,
          [nodeId]: conditionResult
        }
      }
      
    case 'ai-tagging':
      const taggingResult = applyAITagging(
        nodeConfig.selectedTags,
        nodeConfig.tagKeywords,
        updatedData,
        nodeConfig.targetType
      )
      return {
        ...updatedData,
        tags: [...(updatedData.tags || []), ...taggingResult.tags],
        targetType: nodeConfig.targetType
      }
      
    case 'ai-classification':
      const classificationResult = applyAIClassification(
        nodeConfig.selectedCategories,
        nodeConfig.categoryKeywords,
        updatedData,
        nodeConfig.targetType
      )
      return {
        ...updatedData,
        categories: [...(updatedData.categories || []), ...classificationResult.categories],
        targetType: nodeConfig.targetType
      }
      
    default:
      return updatedData
  }
}

// Create initial workflow data from trigger
export const createWorkflowData = (
  triggerType: 'email' | 'webhook' | 'schedule',
  triggerData: Record<string, any>
): WorkflowData => {
  return {
    trigger: {
      type: triggerType,
      data: triggerData
    },
    processedBy: [],
    timestamp: new Date().toISOString()
  }
}

// Example mock data for testing
export const createMockEmailData = (
  subject: string = 'Test Email Subject',
  body: string = 'Test email body content',
  sender: string = 'test@example.com'
): WorkflowData => {
  return createWorkflowData('email', {
    subject,
    body,
    sender,
    to: 'support@company.com',
    receivedAt: new Date().toISOString()
  })
}
