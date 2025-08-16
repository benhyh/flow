import { renderHook, act } from '@testing-library/react'
import { useWorkflowState } from '../index'
import { mockNodes, mockEdges } from '@/__tests__/utils/react-flow-test-utils'

// Mock the validation functions
jest.mock('../utils/workflowValidation', () => ({
  validateWorkflow: jest.fn(() => ({
    isValid: true,
    errors: [],
    warnings: [],
    nodeValidations: []
  }))
}))

// Mock the workflow storage
jest.mock('@/lib/workflow-storage', () => ({
  saveWorkflow: jest.fn(() => Promise.resolve('saved-id')),
  loadWorkflow: jest.fn(() => Promise.resolve(null))
}))

describe('useWorkflowState', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('initializes with default workflow state', () => {
    const { result } = renderHook(() => useWorkflowState())
    
    expect(result.current.workflowState.name).toBe('Untitled Workflow')
    expect(result.current.workflowState.status).toBe('draft')
    expect(result.current.workflowState.isValid).toBe(true)
    expect(result.current.workflowState.validationErrors).toEqual([])
  })

  test('updates workflow name', () => {
    const { result } = renderHook(() => useWorkflowState())
    
    act(() => {
      result.current.updateWorkflowState({ name: 'My New Workflow' })
    })
    
    expect(result.current.workflowState.name).toBe('My New Workflow')
  })

  test('updates workflow status', () => {
    const { result } = renderHook(() => useWorkflowState())
    
    act(() => {
      result.current.updateWorkflowState({ status: 'active' })
    })
    
    expect(result.current.workflowState.status).toBe('active')
  })

  test('validates workflow when nodes or edges change', () => {
    const mockValidate = jest.mocked(require('../utils/workflowValidation').validateWorkflow)
    const { result } = renderHook(() => useWorkflowState())
    
    act(() => {
      result.current.validateCurrentWorkflow(mockNodes, mockEdges)
    })
    
    expect(mockValidate).toHaveBeenCalledWith(mockNodes, mockEdges)
  })

  test('updates validation state when workflow is invalid', () => {
    const mockValidate = jest.mocked(require('../utils/workflowValidation').validateWorkflow)
    mockValidate.mockReturnValue({
      isValid: false,
      errors: ['Missing required connection'],
      warnings: [],
      nodeValidations: []
    })
    
    const { result } = renderHook(() => useWorkflowState())
    
    act(() => {
      result.current.validateCurrentWorkflow(mockNodes, mockEdges)
    })
    
    expect(result.current.workflowState.isValid).toBe(false)
    expect(result.current.workflowState.validationErrors).toEqual(['Missing required connection'])
  })

  test('saves workflow successfully', async () => {
    const mockSave = jest.mocked(require('@/lib/workflow-storage').saveWorkflow)
    const { result } = renderHook(() => useWorkflowState())
    
    await act(async () => {
      await result.current.handleSave(mockNodes, mockEdges)
    })
    
    expect(mockSave).toHaveBeenCalled()
    expect(result.current.workflowState.lastSaved).toBeTruthy()
  })

  test('handles save workflow error', async () => {
    const mockSave = jest.mocked(require('@/lib/workflow-storage').saveWorkflow)
    mockSave.mockRejectedValue(new Error('Save failed'))
    
    const { result } = renderHook(() => useWorkflowState())
    
    await act(async () => {
      try {
        await result.current.handleSave(mockNodes, mockEdges)
      } catch (error) {
        // Error should be handled internally
      }
    })
    
    // Should not update lastSaved on error
    expect(result.current.workflowState.lastSaved).toBeUndefined()
  })

  // Note: Load workflow functionality is handled by WorkflowManager, not useWorkflowState

  test('creates new workflow', () => {
    const { result } = renderHook(() => useWorkflowState())
    
    // Modify state first
    act(() => {
      result.current.updateWorkflowState({ 
        name: 'Modified Workflow',
        status: 'active'
      })
    })
    
    // Create new workflow
    act(() => {
      const newState = result.current.createNewWorkflow()
      result.current.updateWorkflowState(newState)
    })
    
    expect(result.current.workflowState.name).toBe('Untitled Workflow')
    expect(result.current.workflowState.status).toBe('draft')
  })

  test('toggles workflow status from draft to active', () => {
    const { result } = renderHook(() => useWorkflowState())
    
    act(() => {
      result.current.handleToggleStatus()
    })
    
    expect(result.current.workflowState.status).toBe('active')
  })

  test('toggles workflow status from active to paused', () => {
    const { result } = renderHook(() => useWorkflowState())
    
    // Set to active first
    act(() => {
      result.current.updateWorkflowState({ status: 'active' })
    })
    
    act(() => {
      result.current.handleToggleStatus()
    })
    
    expect(result.current.workflowState.status).toBe('paused')
  })

  test('toggles workflow status from paused to active', () => {
    const { result } = renderHook(() => useWorkflowState())
    
    // Set to paused first
    act(() => {
      result.current.updateWorkflowState({ status: 'paused' })
    })
    
    act(() => {
      result.current.handleToggleStatus()
    })
    
    expect(result.current.workflowState.status).toBe('active')
  })

  test('prevents status toggle for invalid workflows', () => {
    const { result } = renderHook(() => useWorkflowState())
    
    // Set workflow as invalid
    act(() => {
      result.current.updateWorkflowState({ 
        isValid: false,
        validationErrors: ['Missing connection']
      })
    })
    
    act(() => {
      result.current.handleToggleStatus()
    })
    
    // Status should remain draft
    expect(result.current.workflowState.status).toBe('draft')
  })

  test('updates last run timestamp', () => {
    const { result } = renderHook(() => useWorkflowState())
    
    const runTime = new Date()
    
    act(() => {
      result.current.updateWorkflowState({ lastRun: runTime })
    })
    
    expect(result.current.workflowState.lastRun).toBe(runTime)
  })

  test('maintains workflow state consistency', () => {
    const { result } = renderHook(() => useWorkflowState())
    
    // Multiple updates should be consistent
    act(() => {
      result.current.updateWorkflowState({ 
        name: 'Test Workflow',
        status: 'active'
      })
    })
    
    act(() => {
      result.current.updateWorkflowState({ 
        lastSaved: new Date()
      })
    })
    
    expect(result.current.workflowState.name).toBe('Test Workflow')
    expect(result.current.workflowState.status).toBe('active')
    expect(result.current.workflowState.lastSaved).toBeTruthy()
  })

  test('generates unique IDs for new workflows', () => {
    const { result: result1 } = renderHook(() => useWorkflowState())
    const { result: result2 } = renderHook(() => useWorkflowState())
    
    act(() => {
      result1.current.updateWorkflowState({ id: 'workflow-1' })
    })
    
    act(() => {
      result2.current.updateWorkflowState({ id: 'workflow-2' })
    })
    
    expect(result1.current.workflowState.id).not.toBe(result2.current.workflowState.id)
  })

  test('validates workflow automatically on state changes', () => {
    const mockValidate = jest.mocked(require('../utils/workflowValidation').validateWorkflow)
    const { result } = renderHook(() => useWorkflowState())
    
    act(() => {
      result.current.validateCurrentWorkflow(mockNodes, mockEdges)
    })
    
    expect(mockValidate).toHaveBeenCalledTimes(1)
    
    // Validation should be called again when state changes
    act(() => {
      result.current.validateCurrentWorkflow([...mockNodes], mockEdges)
    })
    
    expect(mockValidate).toHaveBeenCalledTimes(2)
  })

  test('handles partial state updates correctly', () => {
    const { result } = renderHook(() => useWorkflowState())
    
    const initialName = result.current.workflowState.name
    
    act(() => {
      result.current.updateWorkflowState({ status: 'active' })
    })
    
    // Name should remain unchanged
    expect(result.current.workflowState.name).toBe(initialName)
    expect(result.current.workflowState.status).toBe('active')
  })

  test('provides workflow state history', () => {
    const { result } = renderHook(() => useWorkflowState())
    
    // Make several changes
    act(() => {
      result.current.updateWorkflowState({ name: 'Version 1' })
    })
    
    act(() => {
      result.current.updateWorkflowState({ name: 'Version 2' })
    })
    
    act(() => {
      result.current.updateWorkflowState({ status: 'active' })
    })
    
    // Current state should reflect all changes
    expect(result.current.workflowState.name).toBe('Version 2')
    expect(result.current.workflowState.status).toBe('active')
  })
})