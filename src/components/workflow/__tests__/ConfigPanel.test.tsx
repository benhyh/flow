import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { ConfigPanel, setConfiguredNode } from '../panels/ConfigPanel'
import { renderWithReactFlow } from '@/__tests__/utils/react-flow-test-utils'
import { ReactFlowProvider } from '@xyflow/react'

// Mock the toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock useReactFlow hook
const mockUpdateNodeData = jest.fn()
const mockGetNodes = jest.fn()

jest.mock('@xyflow/react', () => ({
  ...jest.requireActual('@xyflow/react'),
  useReactFlow: () => ({
    updateNodeData: mockUpdateNodeData,
    getNodes: mockGetNodes,
  }),
}))

describe('ConfigPanel', () => {
  const mockNode = {
    id: '1',
    type: 'trigger',
    position: { x: 100, y: 100 },
    data: {
      label: 'Email Trigger',
      nodeType: 'email-trigger',
      icon: '📧',
      color: '#8b5cf6',
      config: {
        emailFilters: {
          subject: 'Test Subject',
          sender: 'test@example.com',
        },
      },
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetNodes.mockReturnValue([mockNode])
    // Clear any configured node
    setConfiguredNode(null)
  })

  test('renders config panel when node is configured', async () => {
    // Set the configured node
    setConfiguredNode('1')

    renderWithReactFlow(<ConfigPanel />)

    // Wait for the panel to appear
    await waitFor(() => {
      expect(screen.getByText('Email Trigger')).toBeInTheDocument()
    })

    expect(screen.getByText('email trigger Configuration')).toBeInTheDocument()
  })

  test('does not render when no node is configured', () => {
    renderWithReactFlow(<ConfigPanel />)

    expect(screen.queryByText('Email Trigger')).not.toBeInTheDocument()
  })

  test('renders email trigger configuration form', async () => {
    setConfiguredNode('1')

    renderWithReactFlow(<ConfigPanel />)

    await waitFor(() => {
      expect(screen.getByLabelText(/sender email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/subject contains/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/keywords/i)).toBeInTheDocument()
    })
  })

  test('renders trello action configuration form', async () => {
    const trelloNode = {
      ...mockNode,
      data: {
        label: 'Create Trello Card',
        nodeType: 'trello-action',
        icon: '📋',
        color: '#0079bf',
        config: {
          boardId: 'board-123',
          listId: 'list-456',
          cardTitle: 'New Card',
        },
      },
    }

    mockGetNodes.mockReturnValue([trelloNode])
    setConfiguredNode('1')

    renderWithReactFlow(<ConfigPanel />)

    await waitFor(() => {
      expect(screen.getByLabelText(/trello board id/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/list id/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/card title template/i)).toBeInTheDocument()
    })
  })

  test('renders asana action configuration form', async () => {
    const asanaNode = {
      ...mockNode,
      data: {
        label: 'Create Asana Task',
        nodeType: 'asana-action',
        icon: '✅',
        color: '#f06a6a',
        config: {
          projectId: 'project-123',
          taskName: 'New Task',
        },
      },
    }

    mockGetNodes.mockReturnValue([asanaNode])
    setConfiguredNode('1')

    renderWithReactFlow(<ConfigPanel />)

    await waitFor(() => {
      expect(screen.getByLabelText(/asana project id/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/task name template/i)).toBeInTheDocument()
    })
  })

  test('renders logic node configuration form', async () => {
    const logicNode = {
      ...mockNode,
      data: {
        label: 'If Condition',
        nodeType: 'condition-logic',
        icon: '🔍',
        color: '#10b981',
        config: {
          condition: 'email.subject',
          operator: 'contains',
        },
      },
    }

    mockGetNodes.mockReturnValue([logicNode])
    setConfiguredNode('1')

    renderWithReactFlow(<ConfigPanel />)

    await waitFor(() => {
      expect(screen.getByLabelText(/condition/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/operator/i)).toBeInTheDocument()
    })
  })

  test('renders AI node configuration form', async () => {
    const aiNode = {
      ...mockNode,
      data: {
        label: 'AI Tagging',
        nodeType: 'ai-tagging',
        icon: '✨',
        color: '#f59e0b',
        config: {
          tags: ['urgent', 'work', 'personal'],
        },
      },
    }

    mockGetNodes.mockReturnValue([aiNode])
    setConfiguredNode('1')

    renderWithReactFlow(<ConfigPanel />)

    await waitFor(() => {
      expect(screen.getByLabelText(/available tags/i)).toBeInTheDocument()
    })
  })

  test('handles form submission correctly', async () => {
    setConfiguredNode('1')

    renderWithReactFlow(<ConfigPanel />)

    await waitFor(() => {
      expect(screen.getByLabelText(/subject contains/i)).toBeInTheDocument()
    })

    const subjectInput = screen.getByLabelText(/subject contains/i)
    fireEvent.change(subjectInput, { target: { value: 'Updated Subject' } })

    const saveButton = screen.getByRole('button', {
      name: /save configuration/i,
    })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdateNodeData).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          config: expect.objectContaining({
            emailFilters: expect.objectContaining({
              subject: 'Updated Subject',
            }),
          }),
        })
      )
    })
  })

  test('handles empty form fields correctly', async () => {
    setConfiguredNode('1')

    renderWithReactFlow(<ConfigPanel />)

    await waitFor(() => {
      expect(screen.getByLabelText(/subject contains/i)).toBeInTheDocument()
    })

    const subjectInput = screen.getByLabelText(/subject contains/i)
    fireEvent.change(subjectInput, { target: { value: '' } })

    const saveButton = screen.getByRole('button', {
      name: /save configuration/i,
    })
    fireEvent.click(saveButton)

    // Should still call updateNodeData with empty values
    await waitFor(() => {
      expect(mockUpdateNodeData).toHaveBeenCalled()
    })
  })

  test('handles close button click', async () => {
    setConfiguredNode('1')

    renderWithReactFlow(<ConfigPanel />)

    await waitFor(() => {
      expect(
        screen.getByTitle(/close configuration panel/i)
      ).toBeInTheDocument()
    })

    const closeButton = screen.getByTitle(/close configuration panel/i)
    fireEvent.click(closeButton)

    // Panel should disappear
    await waitFor(() => {
      expect(screen.queryByText('Email Trigger')).not.toBeInTheDocument()
    })
  })

  test('positions panel correctly', async () => {
    setConfiguredNode('1')

    renderWithReactFlow(<ConfigPanel />)

    await waitFor(() => {
      expect(screen.getByText('Email Trigger')).toBeInTheDocument()
    })

    // Panel should be positioned absolutely
    const panel = screen
      .getByText('Email Trigger')
      .closest('.bg-\\[\\#2d2d2d\\]')
    expect(panel).toHaveClass('absolute')
  })

  test('is draggable', async () => {
    setConfiguredNode('1')

    renderWithReactFlow(<ConfigPanel />)

    await waitFor(() => {
      expect(screen.getByText('Email Trigger')).toBeInTheDocument()
    })

    const dragHandle = screen.getByText('Email Trigger').closest('.cursor-grab')
    expect(dragHandle).toHaveClass('cursor-grab')

    // Test drag start
    fireEvent.mouseDown(dragHandle!, { clientX: 200, clientY: 150 })

    // Should change cursor to grabbing
    expect(dragHandle).toHaveClass('active:cursor-grabbing')
  })

  test('shows configuration form for different node types', async () => {
    setConfiguredNode('1')

    renderWithReactFlow(<ConfigPanel />)

    await waitFor(() => {
      expect(
        screen.getByText('email trigger Configuration')
      ).toBeInTheDocument()
    })

    // Should show email-specific configuration
    expect(screen.getByLabelText(/sender email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/subject contains/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/keywords/i)).toBeInTheDocument()
  })

  test('maintains form state during editing', async () => {
    setConfiguredNode('1')

    renderWithReactFlow(<ConfigPanel />)

    await waitFor(() => {
      expect(screen.getByLabelText(/subject contains/i)).toBeInTheDocument()
    })

    const subjectInput = screen.getByLabelText(/subject contains/i)
    fireEvent.change(subjectInput, { target: { value: 'New Subject' } })

    expect(subjectInput).toHaveValue('New Subject')

    // Value should persist until save
    const senderInput = screen.getByLabelText(/sender email/i)
    fireEvent.focus(senderInput)

    expect(subjectInput).toHaveValue('New Subject')
  })

  test('handles unknown node types gracefully', async () => {
    const unknownNode = {
      ...mockNode,
      data: {
        label: 'Unknown Node',
        nodeType: 'unknown-type',
        icon: '❓',
        color: '#gray',
        config: {},
      },
    }

    mockGetNodes.mockReturnValue([unknownNode])
    setConfiguredNode('1')

    renderWithReactFlow(<ConfigPanel />)

    await waitFor(() => {
      expect(
        screen.getByText('No configuration available for this node type.')
      ).toBeInTheDocument()
    })
  })

  test('maintains accessibility standards', async () => {
    setConfiguredNode('1')

    renderWithReactFlow(<ConfigPanel />)

    await waitFor(() => {
      expect(screen.getByText('Email Trigger')).toBeInTheDocument()
    })

    // Form inputs should have proper labels
    const inputs = screen.getAllByRole('textbox')
    inputs.forEach(input => {
      expect(input).toHaveAccessibleName()
    })

    // Buttons should have accessible names
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toHaveAccessibleName()
    })
  })

  test('handles AI classification node configuration', async () => {
    const aiClassificationNode = {
      ...mockNode,
      data: {
        label: 'AI Classification',
        nodeType: 'ai-classification',
        icon: '🤖',
        color: '#f59e0b',
        config: {
          categories: ['support', 'sales', 'marketing'],
        },
      },
    }

    mockGetNodes.mockReturnValue([aiClassificationNode])
    setConfiguredNode('1')

    renderWithReactFlow(<ConfigPanel />)

    await waitFor(() => {
      expect(
        screen.getByLabelText(/classification categories/i)
      ).toBeInTheDocument()
    })

    const categoriesInput = screen.getByLabelText(/classification categories/i)
    expect(categoriesInput).toHaveValue('support, sales, marketing')
  })
})
