import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { NodeLibrary } from '../panels/NodeLibrary'
import { createMockDragEvent } from '@/__tests__/utils/react-flow-test-utils'

// Mock the drag and drop functionality
const mockOnDragStart = jest.fn()

describe('NodeLibrary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders all node categories', () => {
    render(<NodeLibrary />)
    
    // Check for category headers
    expect(screen.getByText('Triggers')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
    expect(screen.getByText('Logic/Filters')).toBeInTheDocument()
    expect(screen.getByText('AI Nodes')).toBeInTheDocument()
  })

  test('renders trigger nodes correctly', () => {
    render(<NodeLibrary />)
    
    // Check for email trigger
    expect(screen.getByText('New Email')).toBeInTheDocument()
    expect(screen.getByText('Triggers when a new email is received')).toBeInTheDocument()
  })

  test('renders action nodes correctly', () => {
    render(<NodeLibrary />)
    
    // Check for Trello and Asana actions
    expect(screen.getByText('Create Trello Card')).toBeInTheDocument()
    expect(screen.getByText('Create Asana Task')).toBeInTheDocument()
    expect(screen.getByText('Creates a new card in Trello')).toBeInTheDocument()
    expect(screen.getByText('Creates a new task in Asana')).toBeInTheDocument()
  })

  test('renders logic nodes correctly', () => {
    render(<NodeLibrary />)
    
    // Check for conditional logic
    expect(screen.getByText('If Condition')).toBeInTheDocument()
    expect(screen.getByText('Conditional branching logic')).toBeInTheDocument()
  })

  test('renders AI nodes correctly', () => {
    render(<NodeLibrary />)
    
    // Check for AI nodes
    expect(screen.getByText('AI Tagging')).toBeInTheDocument()
    expect(screen.getByText('AI Classification')).toBeInTheDocument()
  })

  test('node items are draggable', () => {
    render(<NodeLibrary />)
    
    const emailTriggerNode = screen.getByText('New Email').closest('[draggable="true"]')
    expect(emailTriggerNode).toBeInTheDocument()
    expect(emailTriggerNode).toHaveAttribute('draggable', 'true')
  })

  test('drag start sets correct data transfer', () => {
    render(<NodeLibrary />)
    
    const emailTriggerNode = screen.getByText('New Email').closest('[draggable="true"]')
    
    const dragEvent = createMockDragEvent()
    fireEvent.dragStart(emailTriggerNode!, dragEvent)
    
    // Verify that setData was called with correct node type information
    expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith(
      'application/reactflow',
      expect.stringContaining('email-trigger')
    )
  })

  test('applies correct styling to different node types', () => {
    render(<NodeLibrary />)
    
    // Check that nodes have appropriate styling classes
    const triggerNode = screen.getByText('New Email').closest('.cursor-grab')
    const actionNode = screen.getByText('Create Trello Card').closest('.cursor-grab')
    
    expect(triggerNode).toBeInTheDocument()
    expect(actionNode).toBeInTheDocument()
  })

  test('shows node icons correctly', () => {
    render(<NodeLibrary />)
    
    // Check for emoji icons in nodes
    expect(screen.getByText('⚡')).toBeInTheDocument() // Trigger icon
    expect(screen.getByText('✅')).toBeInTheDocument() // Action icon
    expect(screen.getByText('🔍')).toBeInTheDocument() // Logic icon
    expect(screen.getByText('✨')).toBeInTheDocument() // AI icon
  })

  test('node descriptions are accessible', () => {
    render(<NodeLibrary />)
    
    // Check that descriptions provide helpful context
    const descriptions = [
      'Triggers when a new email is received',
      'Creates a new card in Trello',
      'Creates a new task in Asana',
      'Conditional branching logic',
      'Automatically tags content using AI',
      'Classifies content using AI'
    ]
    
    descriptions.forEach(description => {
      expect(screen.getByText(description)).toBeInTheDocument()
    })
  })

  test('handles drag events without errors', () => {
    render(<NodeLibrary />)
    
    const nodeElement = screen.getByText('New Email').closest('[draggable="true"]')
    
    // Test drag start
    expect(() => {
      fireEvent.dragStart(nodeElement!, createMockDragEvent())
    }).not.toThrow()
    
    // Test drag end
    expect(() => {
      fireEvent.dragEnd(nodeElement!, createMockDragEvent())
    }).not.toThrow()
  })

  test('maintains consistent node structure', () => {
    render(<NodeLibrary />)
    
    // All node items should have consistent structure
    const nodeItems = screen.getAllByText(/New Email|Create Trello Card|Create Asana Task|If Condition|AI Tagging|AI Classification/)
    
    nodeItems.forEach(item => {
      const nodeContainer = item.closest('[draggable="true"]')
      expect(nodeContainer).toBeInTheDocument()
      expect(nodeContainer).toHaveClass('cursor-grab')
    })
  })
})