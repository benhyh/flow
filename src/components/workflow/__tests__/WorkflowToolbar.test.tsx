import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WorkflowToolbar, type WorkflowState } from '../toolbar/WorkflowToolbar'
import { renderWithReactFlow, mockNodes, mockEdges } from '@/__tests__/utils/react-flow-test-utils'

// Mock the template button component
jest.mock('../templates/TemplateButton', () => ({
  TemplateButton: ({ onLoadTemplate }: { onLoadTemplate: () => void }) => (
    <button onClick={onLoadTemplate} data-testid="template-button">
      Load Template
    </button>
  ),
}))

describe('WorkflowToolbar', () => {
  const mockWorkflowState: WorkflowState = {
    id: 'test-workflow',
    name: 'Test Workflow',
    status: 'draft',
    isValid: true,
    validationErrors: [],
    lastSaved: new Date('2024-01-01'),
  }

  const mockProps = {
    workflowState: mockWorkflowState,
    onWorkflowStateChange: jest.fn(),
    onRunTest: jest.fn(),
    onSave: jest.fn(),
    onToggleStatus: jest.fn(),
    nodes: mockNodes,
    edges: mockEdges,
    onNodesChange: jest.fn(),
    onEdgesChange: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders workflow name input', () => {
    renderWithReactFlow(<WorkflowToolbar {...mockProps} />)
    
    const nameInput = screen.getByDisplayValue('Test Workflow')
    expect(nameInput).toBeInTheDocument()
    expect(nameInput).toHaveAttribute('type', 'text')
  })

  test('allows editing workflow name', async () => {
    renderWithReactFlow(<WorkflowToolbar {...mockProps} />)
    
    const nameInput = screen.getByDisplayValue('Test Workflow')
    
    fireEvent.change(nameInput, { target: { value: 'Updated Workflow' } })
    
    await waitFor(() => {
      expect(mockProps.onWorkflowStateChange).toHaveBeenCalledWith({
        name: 'Updated Workflow'
      })
    })
  })

  test('renders run test button', () => {
    renderWithReactFlow(<WorkflowToolbar {...mockProps} />)
    
    const runButton = screen.getByRole('button', { name: /run test/i })
    expect(runButton).toBeInTheDocument()
    expect(runButton).not.toBeDisabled()
  })

  test('disables run test button for invalid workflows', () => {
    const invalidWorkflowState = {
      ...mockWorkflowState,
      isValid: false,
      validationErrors: ['Missing required connection']
    }
    
    renderWithReactFlow(
      <WorkflowToolbar {...mockProps} workflowState={invalidWorkflowState} />
    )
    
    const runButton = screen.getByRole('button', { name: /run test/i })
    expect(runButton).toBeDisabled()
  })

  test('calls onRunTest when run button is clicked', () => {
    renderWithReactFlow(<WorkflowToolbar {...mockProps} />)
    
    const runButton = screen.getByRole('button', { name: /run test/i })
    fireEvent.click(runButton)
    
    expect(mockProps.onRunTest).toHaveBeenCalledTimes(1)
  })

  test('renders save button', () => {
    renderWithReactFlow(<WorkflowToolbar {...mockProps} />)
    
    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toBeInTheDocument()
  })

  test('calls onSave when save button is clicked', () => {
    renderWithReactFlow(<WorkflowToolbar {...mockProps} />)
    
    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)
    
    expect(mockProps.onSave).toHaveBeenCalledTimes(1)
  })

  test('renders status toggle button for draft workflow', () => {
    renderWithReactFlow(<WorkflowToolbar {...mockProps} />)
    
    const toggleButton = screen.getByRole('button', { name: /enable/i })
    expect(toggleButton).toBeInTheDocument()
  })

  test('renders status toggle button for active workflow', () => {
    const activeWorkflowState = {
      ...mockWorkflowState,
      status: 'active' as const
    }
    
    renderWithReactFlow(
      <WorkflowToolbar {...mockProps} workflowState={activeWorkflowState} />
    )
    
    const toggleButton = screen.getByRole('button', { name: /disable/i })
    expect(toggleButton).toBeInTheDocument()
  })

  test('calls onToggleStatus when status button is clicked', () => {
    renderWithReactFlow(<WorkflowToolbar {...mockProps} />)
    
    const toggleButton = screen.getByRole('button', { name: /enable/i })
    fireEvent.click(toggleButton)
    
    expect(mockProps.onToggleStatus).toHaveBeenCalledTimes(1)
  })

  test('disables enable button for invalid workflows', () => {
    const invalidWorkflowState = {
      ...mockWorkflowState,
      isValid: false,
      validationErrors: ['Missing required connection']
    }
    
    renderWithReactFlow(
      <WorkflowToolbar {...mockProps} workflowState={invalidWorkflowState} />
    )
    
    const toggleButton = screen.getByRole('button', { name: /enable/i })
    expect(toggleButton).toBeDisabled()
  })

  test('shows testing status correctly', () => {
    const testingWorkflowState = {
      ...mockWorkflowState,
      status: 'testing' as const
    }
    
    renderWithReactFlow(
      <WorkflowToolbar {...mockProps} workflowState={testingWorkflowState} />
    )
    
    // Should show testing indicator
    expect(screen.getByText(/testing/i)).toBeInTheDocument()
  })

  test('shows paused status correctly', () => {
    const pausedWorkflowState = {
      ...mockWorkflowState,
      status: 'paused' as const
    }
    
    renderWithReactFlow(
      <WorkflowToolbar {...mockProps} workflowState={pausedWorkflowState} />
    )
    
    const resumeButton = screen.getByRole('button', { name: /resume/i })
    expect(resumeButton).toBeInTheDocument()
  })

  test('displays validation errors when workflow is invalid', () => {
    const invalidWorkflowState = {
      ...mockWorkflowState,
      isValid: false,
      validationErrors: ['Missing required connection', 'Invalid node configuration']
    }
    
    renderWithReactFlow(
      <WorkflowToolbar {...mockProps} workflowState={invalidWorkflowState} />
    )
    
    // Should show validation error indicator
    expect(screen.getByRole('button', { name: /validation errors/i })).toBeInTheDocument()
  })

  test('shows last saved time when available', () => {
    renderWithReactFlow(<WorkflowToolbar {...mockProps} />)
    
    // Should show some indication of last saved time
    expect(screen.getByText(/saved/i)).toBeInTheDocument()
  })

  test('renders template button', () => {
    renderWithReactFlow(<WorkflowToolbar {...mockProps} />)
    
    const templateButton = screen.getByTestId('template-button')
    expect(templateButton).toBeInTheDocument()
  })

  test('handles template loading', () => {
    renderWithReactFlow(<WorkflowToolbar {...mockProps} />)
    
    const templateButton = screen.getByTestId('template-button')
    fireEvent.click(templateButton)
    
    // Template button should trigger node/edge changes
    expect(mockProps.onNodesChange).toHaveBeenCalled()
    expect(mockProps.onEdgesChange).toHaveBeenCalled()
  })

  test('applies correct styling based on workflow status', () => {
    const { rerender } = renderWithReactFlow(<WorkflowToolbar {...mockProps} />)
    
    // Draft status
    expect(screen.getByRole('button', { name: /enable/i })).toBeInTheDocument()
    
    // Active status
    const activeState = { ...mockWorkflowState, status: 'active' as const }
    rerender(<WorkflowToolbar {...mockProps} workflowState={activeState} />)
    expect(screen.getByRole('button', { name: /disable/i })).toBeInTheDocument()
  })

  test('maintains accessibility standards', () => {
    renderWithReactFlow(<WorkflowToolbar {...mockProps} />)
    
    // All buttons should have accessible names
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toHaveAccessibleName()
    })
    
    // Input should have accessible label
    const nameInput = screen.getByDisplayValue('Test Workflow')
    expect(nameInput).toHaveAccessibleName()
  })
})