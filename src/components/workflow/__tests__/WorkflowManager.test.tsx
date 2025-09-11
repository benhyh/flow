/**
 * WorkflowManager Component Tests
 * Tests the workflow listing and management functionality
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WorkflowManager } from '../WorkflowManager'
import { AuthProvider } from '@/providers/AuthProvider'
import WorkflowDatabaseClient from '@/lib/database-client'
import type { Workflow } from '@/types/database'

// Mock the database client
jest.mock('@/lib/database-client')
const mockWorkflowDatabaseClient = WorkflowDatabaseClient as jest.Mocked<typeof WorkflowDatabaseClient>

// Mock the auth provider
jest.mock('@/providers/AuthProvider', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    loading: false,
    isAuthenticated: true
  }))
}))

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

const mockWorkflows: Workflow[] = [
  {
    id: 'workflow-1',
    user_id: 'test-user-id',
    name: 'Test Workflow 1',
    description: 'A test workflow',
    is_active: true,
    last_modified_at: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'workflow-2',
    user_id: 'test-user-id',
    name: 'Test Workflow 2',
    description: 'Another test workflow',
    is_active: false,
    last_modified_at: '2024-01-02T00:00:00Z',
    created_at: '2024-01-02T00:00:00Z'
  }
]

const mockOnLoadWorkflow = jest.fn()
const mockOnCreateNew = jest.fn()

describe('WorkflowManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful workflow fetch
    mockWorkflowDatabaseClient.getUserWorkflows.mockResolvedValue({
      data: mockWorkflows,
      error: null
    })
    
    // Mock successful workflow fetch
    mockWorkflowDatabaseClient.getWorkflow.mockResolvedValue({
      data: mockWorkflows[0],
      error: null
    })
    
    // Mock successful nodes fetch
    mockWorkflowDatabaseClient.getWorkflowNodes.mockResolvedValue({
      data: [],
      error: null
    })
    
    // Mock successful delete
    mockWorkflowDatabaseClient.deleteWorkflow.mockResolvedValue({
      data: undefined,
      error: null
    })
  })

  it('renders workflow manager button', () => {
    render(
      <WorkflowManager
        currentNodes={[]}
        currentEdges={[]}
        currentWorkflowState={{
          id: '',
          name: 'Test',
          status: 'draft',
          isValid: true,
          validationErrors: []
        }}
        onLoadWorkflow={mockOnLoadWorkflow}
        onCreateNew={mockOnCreateNew}
      />
    )

    expect(screen.getByText('Manage Workflows')).toBeInTheDocument()
  })

  it('opens dialog when button is clicked', async () => {
    render(
      <WorkflowManager
        currentNodes={[]}
        currentEdges={[]}
        currentWorkflowState={{
          id: '',
          name: 'Test',
          status: 'draft',
          isValid: true,
          validationErrors: []
        }}
        onLoadWorkflow={mockOnLoadWorkflow}
        onCreateNew={mockOnCreateNew}
      />
    )

    const button = screen.getByText('Manage Workflows')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Workflow Manager')).toBeInTheDocument()
    })
  })

  it('loads and displays workflows', async () => {
    render(
      <WorkflowManager
        currentNodes={[]}
        currentEdges={[]}
        currentWorkflowState={{
          id: '',
          name: 'Test',
          status: 'draft',
          isValid: true,
          validationErrors: []
        }}
        onLoadWorkflow={mockOnLoadWorkflow}
        onCreateNew={mockOnCreateNew}
        open={true}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test Workflow 1')).toBeInTheDocument()
      expect(screen.getByText('Test Workflow 2')).toBeInTheDocument()
    })

    expect(mockWorkflowDatabaseClient.getUserWorkflows).toHaveBeenCalledWith('test-user-id')
  })

  it('handles workflow loading', async () => {
    render(
      <WorkflowManager
        currentNodes={[]}
        currentEdges={[]}
        currentWorkflowState={{
          id: '',
          name: 'Test',
          status: 'draft',
          isValid: true,
          validationErrors: []
        }}
        onLoadWorkflow={mockOnLoadWorkflow}
        onCreateNew={mockOnCreateNew}
        open={true}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test Workflow 1')).toBeInTheDocument()
    })

    const loadButton = screen.getAllByTitle('Load workflow')[0]
    fireEvent.click(loadButton)

    await waitFor(() => {
      expect(mockOnLoadWorkflow).toHaveBeenCalled()
    })

    expect(mockWorkflowDatabaseClient.getWorkflow).toHaveBeenCalledWith('workflow-1', 'test-user-id')
    expect(mockWorkflowDatabaseClient.getWorkflowNodes).toHaveBeenCalledWith('workflow-1')
  })

  it('handles workflow deletion with confirmation', async () => {
    render(
      <WorkflowManager
        currentNodes={[]}
        currentEdges={[]}
        currentWorkflowState={{
          id: '',
          name: 'Test',
          status: 'draft',
          isValid: true,
          validationErrors: []
        }}
        onLoadWorkflow={mockOnLoadWorkflow}
        onCreateNew={mockOnCreateNew}
        open={true}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test Workflow 1')).toBeInTheDocument()
    })

    const deleteButton = screen.getAllByTitle('Delete workflow')[0]
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByText('Delete Workflow')).toBeInTheDocument()
    })

    const confirmDeleteButton = screen.getByText('Delete')
    fireEvent.click(confirmDeleteButton)

    await waitFor(() => {
      expect(mockWorkflowDatabaseClient.deleteWorkflow).toHaveBeenCalledWith('workflow-1', 'test-user-id')
    })
  })

  it('handles search functionality', async () => {
    render(
      <WorkflowManager
        currentNodes={[]}
        currentEdges={[]}
        currentWorkflowState={{
          id: '',
          name: 'Test',
          status: 'draft',
          isValid: true,
          validationErrors: []
        }}
        onLoadWorkflow={mockOnLoadWorkflow}
        onCreateNew={mockOnCreateNew}
        open={true}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test Workflow 1')).toBeInTheDocument()
      expect(screen.getByText('Test Workflow 2')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search workflows...')
    fireEvent.change(searchInput, { target: { value: 'Workflow 1' } })

    await waitFor(() => {
      expect(screen.getByText('Test Workflow 1')).toBeInTheDocument()
      expect(screen.queryByText('Test Workflow 2')).not.toBeInTheDocument()
    })
  })

  it('handles error states', async () => {
    mockWorkflowDatabaseClient.getUserWorkflows.mockResolvedValue({
      data: null,
      error: 'Database error'
    })

    render(
      <WorkflowManager
        currentNodes={[]}
        currentEdges={[]}
        currentWorkflowState={{
          id: '',
          name: 'Test',
          status: 'draft',
          isValid: true,
          validationErrors: []
        }}
        onLoadWorkflow={mockOnLoadWorkflow}
        onCreateNew={mockOnCreateNew}
        open={true}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('No workflows found.')).toBeInTheDocument()
    })
  })
})
