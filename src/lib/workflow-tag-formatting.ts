// Tag formatting utilities for different action types (Trello/Asana)
// Converts AI tags and categories to appropriate formats for each platform

export type TargetActionType = 'trello' | 'asana' | 'both'

export interface TagFormatResult {
  trello?: {
    labelNames: string[]  // Will need to be converted to IDs via board mapping
    description: string   // Can include tags in description
  }
  asana?: {
    customFields: Record<string, any>
    notes: string        // Can include tags in notes
  }
}

/**
 * Format tags for Trello labels
 * Trello uses predefined labels on boards, so we create a mapping strategy
 */
export function formatTagsForTrello(
  tags: string[],
  categories: string[] = []
): TagFormatResult['trello'] {
  const allTags = [...tags, ...categories]
  
  // Create label names that can be matched to board labels
  const labelNames = allTags.map(tag => {
    // Standardize tag names for Trello label matching
    switch (tag.toLowerCase()) {
      case 'urgent': return 'Urgent'
      case 'support': return 'Support'
      case 'technical': return 'Technical'
      case 'billing': return 'Billing'
      case 'sales': return 'Sales'
      case 'marketing': return 'Marketing'
      case 'question': return 'Question'
      case 'complaint': return 'Issue'
      case 'request': return 'Request'
      case 'feedback': return 'Feedback'
      default: return tag.charAt(0).toUpperCase() + tag.slice(1)
    }
  })

  // Create description text that includes tags
  const description = allTags.length > 0 
    ? `Tags: ${allTags.map(tag => `#${tag}`).join(' ')}\n\n`
    : ''

  return {
    labelNames: [...new Set(labelNames)], // Remove duplicates
    description
  }
}

/**
 * Format tags for Asana custom fields
 * Asana allows custom fields, so we can be more flexible
 */
export function formatTagsForAsana(
  tags: string[],
  categories: string[] = []
): TagFormatResult['asana'] {
  const customFields: Record<string, any> = {}
  
  // Add tags as boolean custom fields
  tags.forEach(tag => {
    customFields[`tag_${tag}`] = true
  })
  
  // Add categories as enum/text custom fields
  categories.forEach(category => {
    customFields[`category_${category}`] = true
  })
  
  // If we have many tags, also add a summary field
  if (tags.length > 0 || categories.length > 0) {
    const allTags = [...tags, ...categories]
    customFields['workflow_tags'] = allTags.join(', ')
  }

  // Create notes text that includes tags
  const notes = (tags.length > 0 || categories.length > 0)
    ? `Workflow Tags: ${[...tags, ...categories].map(tag => `#${tag}`).join(' ')}\n\n`
    : ''

  return {
    customFields,
    notes
  }
}

/**
 * Main formatting function that handles all target types
 */
export function formatWorkflowTags(
  tags: string[],
  categories: string[] = [],
  targetType: TargetActionType = 'both'
): TagFormatResult {
  const result: TagFormatResult = {}

  if (targetType === 'trello' || targetType === 'both') {
    result.trello = formatTagsForTrello(tags, categories)
  }

  if (targetType === 'asana' || targetType === 'both') {
    result.asana = formatTagsForAsana(tags, categories)
  }

  return result
}

/**
 * Create a label mapping for Trello boards
 * This helps match our tag names to existing board labels
 */
export function createTrelloLabelMapping(boardLabels: Array<{id: string, name: string, color: string}>) {
  const mapping: Record<string, string> = {}
  
  boardLabels.forEach(label => {
    const normalizedName = label.name.toLowerCase()
    mapping[normalizedName] = label.id
    
    // Add common variations
    const variations: Record<string, string[]> = {
      'urgent': ['high priority', 'critical', 'emergency'],
      'support': ['help', 'customer support', 'assistance'],
      'technical': ['tech', 'api', 'integration', 'bug'],
      'billing': ['payment', 'invoice', 'subscription'],
      'sales': ['lead', 'prospect', 'business'],
      'marketing': ['campaign', 'promotion', 'content'],
      'question': ['inquiry', 'ask', 'help'],
      'issue': ['problem', 'complaint', 'bug'],
      'request': ['feature request', 'enhancement'],
      'feedback': ['review', 'comment', 'suggestion']
    }
    
    Object.entries(variations).forEach(([key, alts]) => {
      if (alts.includes(normalizedName)) {
        mapping[key] = label.id
      }
    })
  })
  
  return mapping
}

/**
 * Convert tag names to Trello label IDs using board label mapping
 */
export function convertTagsToTrelloLabelIds(
  tagNames: string[],
  labelMapping: Record<string, string>
): string[] {
  const labelIds: string[] = []
  
  tagNames.forEach(tagName => {
    const normalizedTag = tagName.toLowerCase()
    const labelId = labelMapping[normalizedTag]
    
    if (labelId) {
      labelIds.push(labelId)
    }
  })
  
  return [...new Set(labelIds)] // Remove duplicates
}

/**
 * Merge tag formatting into existing task data
 */
export function mergeTagsIntoTaskData(
  baseTaskData: Record<string, any>,
  tags: string[],
  categories: string[] = [],
  targetType: TargetActionType = 'both',
  labelMapping?: Record<string, string>
): Record<string, any> {
  const formatted = formatWorkflowTags(tags, categories, targetType)
  const result = { ...baseTaskData }
  
  if (formatted.trello && (targetType === 'trello' || targetType === 'both')) {
    // For Trello cards
    if (labelMapping) {
      const labelIds = convertTagsToTrelloLabelIds(formatted.trello.labelNames, labelMapping)
      if (labelIds.length > 0) {
        result.idLabels = [...(result.idLabels || []), ...labelIds]
      }
    }
    
    // Add tags to description
    if (formatted.trello.description) {
      result.desc = (formatted.trello.description + (result.desc || '')).trim()
    }
  }
  
  if (formatted.asana && (targetType === 'asana' || targetType === 'both')) {
    // For Asana tasks
    result.custom_fields = {
      ...(result.custom_fields || {}),
      ...formatted.asana.customFields
    }
    
    // Add tags to notes
    if (formatted.asana.notes) {
      result.notes = (formatted.asana.notes + (result.notes || '')).trim()
    }
  }
  
  return result
}

/**
 * Preview how tags will appear in each system
 */
export function previewTagFormatting(
  tags: string[],
  categories: string[] = [],
  targetType: TargetActionType = 'both'
): { preview: string; details: string[] } {
  const formatted = formatWorkflowTags(tags, categories, targetType)
  const details: string[] = []
  
  if (formatted.trello) {
    details.push(`Trello: ${formatted.trello.labelNames.length} labels + description`)
  }
  
  if (formatted.asana) {
    const fieldCount = Object.keys(formatted.asana.customFields).length
    details.push(`Asana: ${fieldCount} custom fields + notes`)
  }
  
  const allTags = [...tags, ...categories]
  const preview = targetType === 'both' 
    ? `${allTags.join(', ')} → Both systems`
    : targetType === 'trello'
    ? `${allTags.join(', ')} → Trello labels`
    : `${allTags.join(', ')} → Asana fields`
  
  return { preview, details }
}
