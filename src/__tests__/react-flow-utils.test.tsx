import React from 'react'
import { screen } from '@testing-library/react'
import { renderWithReactFlow, mockReactFlow } from './utils/react-flow-test-utils'

// Simple test component
const TestComponent = () => <div>Test Component</div>

describe('React Flow Test Utils', () => {
  test('mockReactFlow initializes without errors', () => {
    expect(() => mockReactFlow()).not.toThrow()
  })

  test('renderWithReactFlow renders components', () => {
    renderWithReactFlow(<TestComponent />)
    expect(screen.getByText('Test Component')).toBeInTheDocument()
  })

  test('renderWithReactFlow works without provider', () => {
    renderWithReactFlow(<TestComponent />, { withProvider: false })
    expect(screen.getByText('Test Component')).toBeInTheDocument()
  })

  test('global mocks are available', () => {
    expect(global.ResizeObserver).toBeDefined()
    expect(global.DOMMatrixReadOnly).toBeDefined()
  })
})