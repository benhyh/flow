# Workflow Component Testing Suite

This directory contains comprehensive tests for the React Flow-based workflow editor components. The testing suite covers unit tests, integration tests, accessibility compliance, and performance validation.

## Test Structure

### Unit Tests
- **NodeLibrary.test.tsx** - Tests for the draggable node library sidebar
- **WorkflowToolbar.test.tsx** - Tests for workflow controls and state management
- **ConfigPanel.test.tsx** - Tests for node configuration modal
- **DebugPanel.test.tsx** - Tests for execution debugging and logs
- **connectionValidation.test.ts** - Tests for edge connection validation logic
- **workflowValidation.test.ts** - Tests for workflow structure validation
- **useWorkflowExecution.test.ts** - Tests for workflow execution hook
- **useWorkflowState.test.ts** - Tests for workflow state management hook

### Integration Tests
- **WorkflowEditor.integration.test.tsx** - End-to-end workflow creation and editing flows

### Accessibility Tests
- **accessibility.test.tsx** - WCAG compliance and screen reader compatibility

### Performance Tests
- **performance.test.tsx** - Render performance and memory usage validation

## Test Utilities

### React Flow Test Utils
Located in `src/__tests__/utils/react-flow-test-utils.ts`, provides:
- React Flow mocking utilities for testing environment
- Mock node and edge data
- Drag and drop event helpers
- Custom render function with ReactFlowProvider

## Running Tests

### All Tests
```bash
npm test
```

### Workflow-Specific Tests
```bash
npm run test:workflow
```

### Integration Tests Only
```bash
npm run test:integration
```

### Accessibility Tests Only
```bash
npm run test:accessibility
```

### Performance Tests Only
```bash
npm run test:performance
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Coverage Goals

- **Unit Tests**: 90%+ line coverage for all workflow components
- **Integration Tests**: Complete user workflows from start to finish
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Components render within performance budgets

## Key Testing Patterns

### React Flow Component Testing
```typescript
import { renderWithReactFlow } from '@/__tests__/utils/react-flow-test-utils'

test('renders workflow component', () => {
  renderWithReactFlow(<WorkflowComponent />)
  expect(screen.getByText('Expected Content')).toBeInTheDocument()
})
```

### Drag and Drop Testing
```typescript
import { createMockDragEvent } from '@/__tests__/utils/react-flow-test-utils'

test('handles drag and drop', () => {
  const dragEvent = createMockDragEvent({ 'application/reactflow': 'node-data' })
  fireEvent.dragStart(element, dragEvent)
  expect(dragEvent.dataTransfer.setData).toHaveBeenCalled()
})
```

### Accessibility Testing
```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

test('meets accessibility standards', async () => {
  const { container } = render(<Component />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### Performance Testing
```typescript
test('renders within performance budget', () => {
  const startTime = performance.now()
  render(<Component />)
  const endTime = performance.now()
  expect(endTime - startTime).toBeLessThan(100) // 100ms budget
})
```

## Mock Strategy

### External Dependencies
- **React Flow**: Mocked with custom utilities for measurement and DOM APIs
- **Supabase**: Mocked for authentication and storage operations
- **Toast Notifications**: Mocked to prevent side effects
- **File System**: Mocked for import/export operations

### Internal Dependencies
- **Workflow Storage**: Mocked with predictable data
- **Validation Functions**: Mocked with configurable return values
- **Execution Engine**: Mocked with simulated timing

## Continuous Integration

Tests are designed to run in CI environments with:
- Headless browser support
- Deterministic timing
- No external dependencies
- Consistent cross-platform behavior

## Debugging Tests

### Common Issues
1. **React Flow Measurement Errors**: Ensure `mockReactFlow()` is called
2. **Async State Updates**: Use `waitFor()` for state changes
3. **Event Timing**: Use `act()` for React state updates
4. **Mock Cleanup**: Clear mocks between tests

### Debug Commands
```bash
# Run specific test file
npm test -- NodeLibrary.test.tsx

# Run tests with verbose output
npm test -- --verbose

# Run tests in debug mode
npm test -- --runInBand --detectOpenHandles
```

## Test Data

### Mock Nodes
```typescript
const mockNodes = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 0, y: 0 },
    data: { label: 'Email Trigger', subtype: 'email-trigger', config: {} }
  }
]
```

### Mock Edges
```typescript
const mockEdges = [
  { id: 'e1-2', source: '1', target: '2' }
]
```

### Mock Workflow State
```typescript
const mockWorkflowState = {
  name: 'Test Workflow',
  status: 'draft',
  isValid: true,
  validationErrors: []
}
```

## Contributing

When adding new tests:
1. Follow existing na`Cming conventions
2. Include both positive and negative test cases
3. Test error conditions and edge cases
4. Maintain accessibility compliance
5. Update this documentation for new patterns

## Performance Benchmarks

- **Component Render**: < 100ms
- **Large Workflow (100+ nodes)**: < 200ms
- **Drag Operations**: < 50ms per operation
- **State Updates**: < 10ms per update
- **Memory Usage**: Stable across re-renders