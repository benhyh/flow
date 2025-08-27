import React from 'react'
import { screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WorkflowManager } from '../index'
import { renderWithReactFlow } from '@/__tests__/utils/react-flow-test-utils'

// Mock all the dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}))

jest.mock('@/lib/workflow-storage', () => ({
  getStoredWorkflows: jest.fn(() => Promise.resolve([])),
  saveWorkflow: jest.fn(() => Promise.resolve('saved-id')),
  deleteWorkflow: jest.fn(() => Promise.resolve()),
  duplicateWorkflow: jest.fn(() => Promise.resolve('duplicate-id')),
  getRecentWorkflows: jest.fn(() => Promise.resolve([])),
  searchWorkflows: jest.fn(() => Promise.resolve([])),
  getWorkflowStats: jest.fn(() => Promise.resolve({ total: 0, active: 0, draft: 0 })),
}))

jest.mock('../utils/workflowValidation', () => ({
  validateWorkflow: jest.fn(() => ({
    isValid: true,
    errors: [],
    warnings: [],
    nodeValidations: []
  })),
  getValidationSummary: jest.fn(() => ({
    status: 'valid',
    totalErrors: 0,
    totalWarnings: 0,
    validNodes: 2,
    invalidNodes: 0
  }))
}))

// Mock the workflow execution
jest.mock('../hooks/useWorkflowExecution', () => ({
  useWorkflowExecution: () => ({
    isExecuting: false,
    executionHistory: [],
    currentExecution: null,
    nodeStatuses: {},
    executeWorkflow: jest.fn(),
    stopExecution: jest.fn(),
    clearHistory: jest.fn(),
  })
}))

describe('Workflow Editor Integration', () => {
  const mockProps = {
    currentNodes: [],
    currentEdges: [],
    currentWorkflowState: {
      name: 'Test Workflow',
      status: 'draft' as const,
      isValid: true,
      validationErrors: [],
    },
    onLoadWorkflow: jest.fn(),
    onCreateNew: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('complete workflow creation flow', async () => {
    const user = userEvent.setup()
    renderWithReactFlow(<WorkflowManager {...mockProps} />)
    
    // 1. Start by creating a new workflow
    const createButton = screen.getByRole('button', { name: /create new workflow/i })
    await user.click(createButton)
    
    expect(mockProps.onCreateNew).toHaveBeenCalled()
  })

  test('workflow editing and validation flow', async () => {
    const user = userEvent.setup()
    
    // Start with some nodes and edges
    const workflowWithNodes = {
      ...mockProps,
      currentNodes: [
        {
          id: '1',
          type: 'trigger',
          position: { x: 0, y: 0 },
          data: { 
            label: 'Email Trigger',
            subtype: 'email-trigger',
            config: { subject: 'Test', sender: 'test@example.com' }
          }
        },
        {
          id: '2',
          type: 'action',
          position: { x: 200, y: 0 },
          data: { 
            label: 'Create Task',
            subtype: 'trello-action',
            config: { boardId: 'board-1', listId: 'list-1', title: 'New Task' }
          }
        }
      ],
      currentEdges: [
        { id: 'e1-2', source: '1', target: '2' }
      ]
    }
    
    renderWithReactFlow(<WorkflowManager {...workflowWithNodes} />)
    
    // Should show workflow information
    expect(screen.getByText('Test Workflow')).toBeInTheDocument()
    expect(screen.getByText(/2 nodes/i)).toBeInTheDocument()
    expect(screen.getByText(/1 connection/i)).toBeInTheDocument()
  })

  test('workflow search and filtering', async () => {
    const user = userEvent.setup()
    
    // Mock some workflows in storage
    const mockWorkflows = [
      {
        id: '1',
        name: 'Email to Trello',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        nodes: [],
        edges: []
      },
      {
        id: '2',
        name: 'AI Classification',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        nodes: [],
        edges: []
      }
    ]
    
    jest.mocked(require('@/lib/workflow-storage').getStoredWorkflows).mockResolvedValue(mockWorkflows)
    jest.mocked(require('@/lib/workflow-storage').searchWorkflows).mockResolvedValue([mockWorkflows[0]])
    
    renderWithReactFlow(<WorkflowManager {...mockProps} />)
    
    // Wait for workflows to load
    await waitFor(() => {
      expect(screen.getByText('Email to Trello')).toBeInTheDocument()
      expect(screen.getByText('AI Classification')).toBeInTheDocument()
    })
    
    // Test search functionality
    const searchInput = screen.getByPlaceholderText(/search workflows/i)
    await user.type(searchInput, 'Email')
    
    await waitFor(() => {
      expect(screen.getByText('Email to Trello')).toBeInTheDocument()
      expect(screen.queryByText('AI Classification')).not.toBeInTheDocument()
    })
  })

  test('workflow import and export flow', async () => {
    const user = userEvent.setup()
    renderWithReactFlow(<WorkflowManager {...mockProps} />)
    
    // Test export functionality
    const exportButton = screen.getByRole('button', { name: /export/i })
    await user.click(exportButton)
    
    // Should trigger download (mocked)
    expect(screen.getByText(/exported/i)).toBeInTheDocument()
    
    // Test import functionality
    const importButton = screen.getByRole('button', { name: /import/i })
    const fileInput = screen.getByLabelText(/import workflow/i)
    
    const mockFile = new File(['{"name":"Imported Workflow"}'], 'workflow.json', {
      type: 'application/json'
    })
    
    await user.upload(fileInput, mockFile)
    
    await waitFor(() => {
      expect(mockProps.onLoadWorkflow).toHaveBeenCalled()
    })
  })

  test('workflow duplication flow', async () => {
    const user = userEvent.setup()
    
    const mockWorkflows = [
      {
        id: '1',
        name: 'Original Workflow',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        nodes: [],
        edges: []
      }
    ]
    
    jest.mocked(require('@/lib/workflow-storage').getStoredWorkflows).mockResolvedValue(mockWorkflows)
    
    renderWithReactFlow(<WorkflowManager {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Original Workflow')).toBeInTheDocument()
    })
    
    // Find and click duplicate button
    const workflowCard = screen.getByText('Original Workflow').closest('[data-testid="workflow-card"]')
    const duplicateButton = within(workflowCard!).getByRole('button', { name: /duplicate/i })
    
    await user.click(duplicateButton)
    
    await waitFor(() => {
      expect(require('@/lib/workflow-storage').duplicateWorkflow).toHaveBeenCalledWith('1')
    })
  })

  test('workflow deletion flow', async () => {
    const user = userEvent.setup()
    
    const mockWorkflows = [
      {
        id: '1',
        name: 'Workflow to Delete',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        nodes: [],
        edges: []
      }
    ]
    
    jest.mocked(require('@/lib/workflow-storage').getStoredWorkflows).mockResolvedValue(mockWorkflows)
    
    renderWithReactFlow(<WorkflowManager {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Workflow to Delete')).toBeInTheDocument()
    })
    
    // Find and click delete button
    const workflowCard = screen.getByText('Workflow to Delete').closest('[data-testid="workflow-card"]')
    const deleteButton = within(workflowCard!).getByRole('button', { name: /delete/i })
    
    await user.click(deleteButton)
    
    // Confirm deletion in dialog
    const confirmButton = screen.getByRole('button', { name: /confirm delete/i })
    await user.click(confirmButton)
    
    await waitFor(() => {
      expect(require('@/lib/workflow-storage').deleteWorkflow).toHaveBeenCalledWith('1')
    })
  })

  test('workflow statistics display', async () => {
    const mockStats = {
      total: 5,
      active: 2,
      draft: 2,
      paused: 1
    }
    
    jest.mocked(require('@/lib/workflow-storage').getWorkflowStats).mockResolvedValue(mockStats)
    
    renderWithReactFlow(<WorkflowManager {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument() // Total workflows
      expect(screen.getByText('2')).toBeInTheDocument() // Active workflows
    })
  })

  test('workflow version history', async () => {
    const user = userEvent.setup()
    
    const mockVersions = [
      {
        id: 'v1',
        workflowId: '1',
        version: 1,
        createdAt: new Date(),
        nodes: [],
        edges: [],
        changes: 'Initial version'
      },
      {
        id: 'v2',
        workflowId: '1',
        version: 2,
        createdAt: new Date(),
        nodes: [],
        edges: [],
        changes: 'Added email trigger'
      }
    ]
    
    // Mock version history functionality if it exists
    
    renderWithReactFlow(<WorkflowManager {...mockProps} />)
    
    // Open version history
    const historyButton = screen.getByRole('button', { name: /version history/i })
    await user.click(historyButton)
    
    await waitFor(() => {
      expect(screen.getByText('Version 1')).toBeInTheDocument()
      expect(screen.getByText('Version 2')).toBeInTheDocument()
      expect(screen.getByText('Initial version')).toBeInTheDocument()
      expect(screen.getByText('Added email trigger')).toBeInTheDocument()
    })
  })

  test('workflow validation feedback', async () => {
    const user = userEvent.setup()
    
    // Mock invalid workflow
    jest.mocked(require('../utils/workflowValidation').validateWorkflow).mockReturnValue({
      isValid: false,
      errors: ['Missing required connection', 'Invalid node configuration'],
      warnings: ['Consider adding error handling'],
      nodeValidations: []
    })
    
    jest.mocked(require('../utils/workflowValidation').getValidationSummary).mockReturnValue({
      status: 'invalid',
      totalErrors: 2,
      totalWarnings: 1,
      validNodes: 1,
      invalidNodes: 1
    })
    
    const invalidWorkflow = {
      ...mockProps,
      currentWorkflowState: {
        ...mockProps.currentWorkflowState,
        isValid: false,
        validationErrors: ['Missing required connection', 'Invalid node configuration']
      }
    }
    
    renderWithReactFlow(<WorkflowManager {...invalidWorkflow} />)
    
    // Should show validation errors
    expect(screen.getByText(/2 errors/i)).toBeInTheDocument()
    expect(screen.getByText(/1 warning/i)).toBeInTheDocument()
    
    // Click to see details
    const validationButton = screen.getByRole('button', { name: /validation/i })
    await user.click(validationButton)
    
    await waitFor(() => {
      expect(screen.getByText('Missing required connection')).toBeInTheDocument()
      expect(screen.getByText('Invalid node configuration')).toBeInTheDocument()
      expect(screen.getByText('Consider adding error handling')).toBeInTheDocument()
    })
  })

  test('responsive layout behavior', async () => {
    const user = userEvent.setup()
    
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    })
    
    renderWithReactFlow(<WorkflowManager {...mockProps} />)
    
    // Should show mobile layout
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument()
    
    // Test mobile menu toggle
    const menuButton = screen.getByRole('button', { name: /menu/i })
    await user.click(menuButton)
    
    // Menu should be visible
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  test('keyboard shortcuts functionality', async () => {
    const user = userEvent.setup()
    renderWithReactFlow(<WorkflowManager {...mockProps} />)
    
    // Test save shortcut (Ctrl+S)
    await user.keyboard('{Control>}s{/Control}')
    
    // Should trigger save action
    expect(screen.getByText(/saved/i)).toBeInTheDocument()
    
    // Test new workflow shortcut (Ctrl+N)
    await user.keyboard('{Control>}n{/Control}')
    
    expect(mockProps.onCreateNew).toHaveBeenCalled()
  })

  test('accessibility compliance', () => {
    renderWithReactFlow(<WorkflowManager {...mockProps} />)
    
    // Check for proper ARIA labels
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toHaveAccessibleName()
    })
    
    // Check for proper heading structure
    const headings = screen.getAllByRole('heading')
    expect(headings.length).toBeGreaterThan(0)
    
    // Check for proper form labels
    const inputs = screen.getAllByRole('textbox')
    inputs.forEach(input => {
      expect(input).toHaveAccessibleName()
    })
  })

  test('error handling and recovery', async () => {
    const user = userEvent.setup()
    
    // Mock storage error
    jest.mocked(require('@/lib/workflow-storage').getStoredWorkflows).mockRejectedValue(
      new Error('Storage unavailable')
    )
    
    renderWithReactFlow(<WorkflowManager {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText(/error loading workflows/i)).toBeInTheDocument()
    })
    
    // Test retry functionality
    const retryButton = screen.getByRole('button', { name: /retry/i })
    await user.click(retryButton)
    
    // Should attempt to reload
    expect(require('@/lib/workflow-storage').getStoredWorkflows).toHaveBeenCalledTimes(2)
  })
})