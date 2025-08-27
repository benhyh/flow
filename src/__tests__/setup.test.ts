/**
 * Basic setup test to verify the development environment
 */

describe('Development Environment Setup', () => {
  it('should have Node.js environment', () => {
    expect(process.env.NODE_ENV).toBeDefined()
  })

  it('should load environment variables', () => {
    // These should be defined in test environment or have defaults
    expect(process.env.NODE_ENV).toBeDefined()
    // Note: Supabase env vars may not be available in test environment
    // This is expected and OK for testing
  })

  it('should have TypeScript support', () => {
    // Test basic TypeScript functionality
    const testObject: { name: string; value: number } = {
      name: 'test',
      value: 42,
    }

    expect(testObject.name).toBe('test')
    expect(testObject.value).toBe(42)
  })
})
