/// <reference types="jest" />
import '@testing-library/jest-dom'

// Extend Jest matchers with jest-dom custom matchers
import '@testing-library/jest-dom'

// Global test environment types
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveTextContent(text: string | RegExp): R
      toBeDisabled(): R
      toHaveValue(value: string | number): R
      toHaveClass(className: string): R
      toBeVisible(): R
      toHaveAttribute(attr: string, value?: string): R
      toHaveStyle(style: Record<string, unknown> | string): R
    }
  }

  // React Flow test environment globals
  var ResizeObserver: {
    new (callback: ResizeObserverCallback): ResizeObserver
    prototype: ResizeObserver
  }

  var DOMMatrixReadOnly: {
    new (transform?: string): DOMMatrixReadOnly
    prototype: DOMMatrixReadOnly
  }

  interface Window {
    matchMedia: jest.MockedFunction<typeof window.matchMedia>
  }
}

export {}