/**
 * Basic setup test to verify the development environment
 */

describe('Development Environment Setup', () => {
  it('should have Node.js environment', () => {
    expect(process.env.NODE_ENV).toBeDefined()
  })

  it('should load environment variables', () => {
    // These should be defined in test environment
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined()
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined()
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
