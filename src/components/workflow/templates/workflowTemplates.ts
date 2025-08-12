import { type Node, type Edge } from '@xyflow/react'

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: 'email-automation' | 'ai-processing' | 'task-management' | 'advanced'
  icon: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedSetupTime: string
  nodes: Node[]
  edges: Edge[]
  tags: string[]
  featured?: boolean
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'email-to-trello',
    name: 'Email → Trello Card',
    description: 'Automatically create Trello cards from new emails with specific keywords or from specific senders.',
    category: 'email-automation',
    icon: '📧',
    difficulty: 'beginner',
    estimatedSetupTime: '2 minutes',
    featured: true,
    tags: ['email', 'trello', 'automation', 'productivity'],
    nodes: [
      {
        id: 'email-trigger-1',
        type: 'trigger',
        position: { x: 100, y: 150 },
        data: {
          label: 'New Email',
          nodeType: 'email-trigger',
          icon: '⚡',
          color: '#10b981',
          status: 'idle',
          config: {
            filters: {
              subject: 'project',
              sender: '',
              keywords: ['urgent', 'important']
            }
          }
        }
      },
      {
        id: 'trello-action-1',
        type: 'action',
        position: { x: 450, y: 150 },
        data: {
          label: 'Create Trello Card',
          nodeType: 'trello-action',
          icon: '✅',
          color: '#3b82f6',
          status: 'idle',
          config: {
            board: 'Work Projects',
            list: 'To Do',
            cardTitle: '{{email.subject}}',
            cardDescription: '{{email.body}}'
          }
        }
      }
    ],
    edges: [
      {
        id: 'email-to-trello-edge',
        source: 'email-trigger-1',
        target: 'trello-action-1'
      }
    ]
  },
  {
    id: 'email-to-asana',
    name: 'Email → Asana Task',
    description: 'Convert important emails into Asana tasks with automatic priority detection and project assignment.',
    category: 'email-automation',
    icon: '📋',
    difficulty: 'beginner',
    estimatedSetupTime: '2 minutes',
    featured: true,
    tags: ['email', 'asana', 'tasks', 'project-management'],
    nodes: [
      {
        id: 'email-trigger-2',
        type: 'trigger',
        position: { x: 100, y: 150 },
        data: {
          label: 'New Email',
          nodeType: 'email-trigger',
          icon: '⚡',
          color: '#10b981',
          status: 'idle',
          config: {
            filters: {
              subject: '',
              sender: 'client@company.com',
              keywords: ['task', 'todo', 'action']
            }
          }
        }
      },
      {
        id: 'asana-action-1',
        type: 'action',
        position: { x: 450, y: 150 },
        data: {
          label: 'Create Asana Task',
          nodeType: 'asana-action',
          icon: '✅',
          color: '#3b82f6',
          status: 'idle',
          config: {
            project: 'Client Requests',
            taskName: '{{email.subject}}',
            taskNotes: '{{email.body}}',
            priority: 'normal'
          }
        }
      }
    ],
    edges: [
      {
        id: 'email-to-asana-edge',
        source: 'email-trigger-2',
        target: 'asana-action-1'
      }
    ]
  },
  {
    id: 'ai-email-classification',
    name: 'AI Email Classification',
    description: 'Use AI to automatically classify and route emails to different task management systems based on content.',
    category: 'ai-processing',
    icon: '🤖',
    difficulty: 'intermediate',
    estimatedSetupTime: '5 minutes',
    featured: true,
    tags: ['ai', 'email', 'classification', 'automation'],
    nodes: [
      {
        id: 'email-trigger-3',
        type: 'trigger',
        position: { x: 50, y: 200 },
        data: {
          label: 'New Email',
          nodeType: 'email-trigger',
          icon: '⚡',
          color: '#10b981',
          status: 'idle',
          config: {
            filters: {
              subject: '',
              sender: '',
              keywords: []
            }
          }
        }
      },
      {
        id: 'ai-classification-1',
        type: 'ai',
        position: { x: 300, y: 200 },
        data: {
          label: 'AI Classification',
          nodeType: 'ai-classification',
          icon: '✨',
          color: '#8b5cf6',
          status: 'idle',
          config: {
            categories: ['urgent', 'project', 'meeting', 'general'],
            confidence: 0.8
          }
        }
      },
      {
        id: 'condition-logic-1',
        type: 'logic',
        position: { x: 550, y: 200 },
        data: {
          label: 'If Condition',
          nodeType: 'condition-logic',
          icon: '🔍',
          color: '#f59e0b',
          status: 'idle',
          config: {
            condition: 'category === "urgent"'
          }
        }
      },
      {
        id: 'trello-urgent-1',
        type: 'action',
        position: { x: 750, y: 100 },
        data: {
          label: 'Urgent Trello Card',
          nodeType: 'trello-action',
          icon: '✅',
          color: '#3b82f6',
          status: 'idle',
          config: {
            board: 'Urgent Tasks',
            list: 'High Priority',
            cardTitle: '🚨 {{email.subject}}',
            cardDescription: '{{email.body}}'
          }
        }
      },
      {
        id: 'asana-regular-1',
        type: 'action',
        position: { x: 750, y: 300 },
        data: {
          label: 'Regular Asana Task',
          nodeType: 'asana-action',
          icon: '✅',
          color: '#3b82f6',
          status: 'idle',
          config: {
            project: 'General Tasks',
            taskName: '{{email.subject}}',
            taskNotes: '{{email.body}}',
            priority: 'normal'
          }
        }
      }
    ],
    edges: [
      {
        id: 'email-to-ai-edge',
        source: 'email-trigger-3',
        target: 'ai-classification-1'
      },
      {
        id: 'ai-to-condition-edge',
        source: 'ai-classification-1',
        target: 'condition-logic-1'
      },
      {
        id: 'condition-to-urgent-edge',
        source: 'condition-logic-1',
        target: 'trello-urgent-1',
        sourceHandle: 'true'
      },
      {
        id: 'condition-to-regular-edge',
        source: 'condition-logic-1',
        target: 'asana-regular-1',
        sourceHandle: 'false'
      }
    ]
  },
  {
    id: 'budget-detection',
    name: 'High-Value Email Detection',
    description: 'Automatically detect emails mentioning budgets over $5,000 and create high-priority tasks with special tagging.',
    category: 'ai-processing',
    icon: '💰',
    difficulty: 'intermediate',
    estimatedSetupTime: '4 minutes',
    tags: ['ai', 'budget', 'high-priority', 'detection'],
    nodes: [
      {
        id: 'email-trigger-4',
        type: 'trigger',
        position: { x: 50, y: 150 },
        data: {
          label: 'New Email',
          nodeType: 'email-trigger',
          icon: '⚡',
          color: '#10b981',
          status: 'idle',
          config: {
            filters: {
              subject: '',
              sender: '',
              keywords: ['$', 'budget', 'cost', 'price']
            }
          }
        }
      },
      {
        id: 'ai-tagging-1',
        type: 'ai',
        position: { x: 300, y: 150 },
        data: {
          label: 'AI Budget Detection',
          nodeType: 'ai-tagging',
          icon: '✨',
          color: '#8b5cf6',
          status: 'idle',
          config: {
            extractBudget: true,
            threshold: 5000,
            tags: ['high-value', 'budget-review']
          }
        }
      },
      {
        id: 'trello-budget-1',
        type: 'action',
        position: { x: 550, y: 150 },
        data: {
          label: 'High Priority Card',
          nodeType: 'trello-action',
          icon: '✅',
          color: '#3b82f6',
          status: 'idle',
          config: {
            board: 'Budget Reviews',
            list: 'High Priority',
            cardTitle: '💰 {{email.subject}}',
            cardDescription: 'Budget: {{ai.extractedBudget}}\n\n{{email.body}}',
            labels: ['high-priority', 'budget-review']
          }
        }
      }
    ],
    edges: [
      {
        id: 'email-to-ai-budget-edge',
        source: 'email-trigger-4',
        target: 'ai-tagging-1'
      },
      {
        id: 'ai-to-trello-budget-edge',
        source: 'ai-tagging-1',
        target: 'trello-budget-1'
      }
    ]
  },
  {
    id: 'multi-platform-sync',
    name: 'Multi-Platform Task Sync',
    description: 'Advanced workflow that creates tasks in both Trello and Asana based on email priority and content analysis.',
    category: 'advanced',
    icon: '🔄',
    difficulty: 'advanced',
    estimatedSetupTime: '8 minutes',
    tags: ['multi-platform', 'sync', 'advanced', 'conditional'],
    nodes: [
      {
        id: 'email-trigger-5',
        type: 'trigger',
        position: { x: 50, y: 250 },
        data: {
          label: 'New Email',
          nodeType: 'email-trigger',
          icon: '⚡',
          color: '#10b981',
          status: 'idle'
        }
      },
      {
        id: 'ai-classification-2',
        type: 'ai',
        position: { x: 250, y: 250 },
        data: {
          label: 'Priority Analysis',
          nodeType: 'ai-classification',
          icon: '✨',
          color: '#8b5cf6',
          status: 'idle'
        }
      },
      {
        id: 'condition-priority',
        type: 'logic',
        position: { x: 450, y: 250 },
        data: {
          label: 'Priority Check',
          nodeType: 'condition-logic',
          icon: '🔍',
          color: '#f59e0b',
          status: 'idle'
        }
      },
      {
        id: 'trello-high-priority',
        type: 'action',
        position: { x: 650, y: 150 },
        data: {
          label: 'Trello (High)',
          nodeType: 'trello-action',
          icon: '✅',
          color: '#3b82f6',
          status: 'idle'
        }
      },
      {
        id: 'asana-normal-priority',
        type: 'action',
        position: { x: 650, y: 350 },
        data: {
          label: 'Asana (Normal)',
          nodeType: 'asana-action',
          icon: '✅',
          color: '#3b82f6',
          status: 'idle'
        }
      }
    ],
    edges: [
      {
        id: 'email-to-ai-multi-edge',
        source: 'email-trigger-5',
        target: 'ai-classification-2'
      },
      {
        id: 'ai-to-condition-multi-edge',
        source: 'ai-classification-2',
        target: 'condition-priority'
      },
      {
        id: 'condition-to-trello-multi-edge',
        source: 'condition-priority',
        target: 'trello-high-priority',
        sourceHandle: 'true'
      },
      {
        id: 'condition-to-asana-multi-edge',
        source: 'condition-priority',
        target: 'asana-normal-priority',
        sourceHandle: 'false'
      }
    ]
  }
]

// Helper functions for template management
export function getTemplatesByCategory(category: WorkflowTemplate['category']) {
  return workflowTemplates.filter(template => template.category === category)
}

export function getFeaturedTemplates() {
  return workflowTemplates.filter(template => template.featured)
}

export function getTemplateById(id: string) {
  return workflowTemplates.find(template => template.id === id)
}

export function searchTemplates(query: string) {
  const lowercaseQuery = query.toLowerCase()
  return workflowTemplates.filter(template => 
    template.name.toLowerCase().includes(lowercaseQuery) ||
    template.description.toLowerCase().includes(lowercaseQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  )
}