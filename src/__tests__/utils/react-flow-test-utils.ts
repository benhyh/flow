/**
 * React Flow Testing Utilities
 * Based on React Flow testing documentation and best practices
 */

import { ReactFlowProvider } from '@xyflow/react'
import { render, RenderOptions } from '@testing-library/react'
import React, { ReactElement } from 'react'

// Mock React Flow's measurement dependencies for testing
class ResizeObserver {
  callback: globalThis.ResizeObserverCallback

  constructor(callback: globalThis.ResizeObserverCallback) {
    this.callback = callback
  }

  observe(target: Element) {
    this.callback([{ target } as globalThis.ResizeObserverEntry], this)
  }

  unobserve() {}

  disconnect() {}
}

class DOMMatrixReadOnly {
  m22: number
  constructor(transform: string) {
    const scale = transform?.match(/scale\(([1-9.])\)/)?.[1]
    this.m22 = scale !== undefined ? +scale : 1
  }
}

// Only run the shim once when requested
let init = false

export const mockReactFlow = () => {
  if (init) return
  init = true

  global.ResizeObserver = ResizeObserver

  // @ts-expect-error - Mocking ResizeObserver for tests
  global.DOMMatrixReadOnly = DOMMatrixReadOnly

  Object.defineProperties(global.HTMLElement.prototype, {
    offsetHeight: {
      get() {
        return parseFloat(this.style.height) || 1
      },
    },
    offsetWidth: {
      get() {
        return parseFloat(this.style.width) || 1
      },
    },
  })

  ;(global.SVGElement as unknown as { prototype: { getBBox: () => unknown } }).prototype.getBBox = () => ({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  })
}

// Custom render function that includes ReactFlowProvider
interface ReactFlowRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  withProvider?: boolean
}

export function renderWithReactFlow(
  ui: ReactElement,
  options: ReactFlowRenderOptions = {}
) {
  const { withProvider = true, ...renderOptions } = options

  // Initialize React Flow mocks
  mockReactFlow()

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    if (withProvider) {
      return React.createElement(ReactFlowProvider, null, children)
    }
    return React.createElement(React.Fragment, null, children)
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Mock node and edge data for testing
export const mockNodes = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 0, y: 0 },
    data: { 
      label: 'Email Trigger',
      subtype: 'email-trigger',
      config: {}
    },
    width: 150,
    height: 80,
  },
  {
    id: '2',
    type: 'action',
    position: { x: 200, y: 0 },
    data: { 
      label: 'Create Task',
      subtype: 'trello-action',
      config: {}
    },
    width: 150,
    height: 80,
  },
]

export const mockEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'default',
  },
]

// Mock workflow state for testing
export const mockWorkflowState = {
  id: 'test-workflow',
  name: 'Test Workflow',
  status: 'draft' as const,
  isValid: true,
  validationErrors: [],
}

// Helper to create mock drag events
export const createMockDragEvent = (dataTransfer: Record<string, string> = {}) => {
  const mockDataTransfer = {
    getData: jest.fn((key: string) => dataTransfer[key] || ''),
    setData: jest.fn(),
    clearData: jest.fn(),
    dropEffect: 'none',
    effectAllowed: 'all',
    files: [],
    items: [],
    types: Object.keys(dataTransfer),
  }

  return {
    dataTransfer: mockDataTransfer,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
  }
}

// Helper to simulate React Flow events
export const createMockReactFlowEvent = (nodeId: string, position = { x: 0, y: 0 }) => ({
  target: { id: nodeId },
  clientX: position.x,
  clientY: position.y,
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
})