import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { mockReactFlow } from './utils/react-flow-test-utils'

// Simple test component
const TestComponent = ({ message }: { message: string }) => (
  <div data-testid="test-message">{message}</div>
)

describe('Basic Functionality Tests', () => {
  test('renders test component correctly', () => {
    render(<TestComponent message="Hello, Testing!" />)
    
    const element = screen.getByTestId('test-message')
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Hello, Testing!')
  })

  test('Jest DOM matchers work correctly', () => {
    render(
      <div>
        <button disabled>Disabled Button</button>
        <input type="text" value="test value" readOnly />
        <div className="test-class">Styled Element</div>
      </div>
    )

    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByRole('textbox')).toHaveValue('test value')
    expect(screen.getByText('Styled Element')).toHaveClass('test-class')
  })

  test('React Flow test environment is ready', () => {
    // Initialize React Flow mocks
    mockReactFlow()
    
    // Test that our environment can handle React Flow-related testing
    expect(global.ResizeObserver).toBeDefined()
    expect(global.DOMMatrixReadOnly).toBeDefined()
    expect(window.matchMedia).toBeDefined()
  })
})