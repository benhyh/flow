/**
 * WorkflowService Test Suite
 * 
 * Basic tests to validate WorkflowService functionality
 * Phase 1.3: Basic tests for CRUD operations and integration management
 */

import { WorkflowService } from '../WorkflowService'

// Mock Supabase client for testing
jest.mock('@/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      })
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'test-workflow-id',
              user_id: 'test-user-id',
              name: 'Test Workflow',
              description: 'Test Description',
              nodes: [],
              edges: [],
              is_active: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            error: null
          })
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null
            }))
          })),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null
              })
            }))
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        }))
      })),
      upsert: jest.fn().mockResolvedValue({
        error: null
      })
    }))
  }
}))

describe('WorkflowService', () => {
  let workflowService: WorkflowService

  beforeEach(() => {
    workflowService = new WorkflowService()
  })

  describe('Workflow CRUD Operations', () => {
    test('should create a workflow', async () => {
      const input = {
        name: 'Test Workflow',
        description: 'Test Description',
        nodes: [],
        edges: [],
        is_active: false
      }

      const result = await workflowService.createWorkflow(input)
      
      expect(result).not.toBeNull()
      expect(result?.name).toBe('Test Workflow')
    })

    test('should get user workflows', async () => {
      const workflows = await workflowService.getUserWorkflows()
      
      expect(Array.isArray(workflows)).toBe(true)
    })

    test('should get a specific workflow', async () => {
      const workflow = await workflowService.getWorkflow('test-id')
      
      // Should handle the mock gracefully
      expect(workflow).toBeNull() // Based on our mock
    })

    test('should update a workflow', async () => {
      const update = { name: 'Updated Name' }
      const result = await workflowService.updateWorkflow('test-id', update)
      
      // Should handle the mock gracefully
      expect(result).toBeNull() // Based on our mock
    })

    test('should delete a workflow', async () => {
      const result = await workflowService.deleteWorkflow('test-id')
      
      expect(result).toBe(true)
    })
  })

  describe('Integration Token Management', () => {
    test('should save integration tokens', async () => {
      const tokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(),
        scopes: ['read', 'write']
      }

      const result = await workflowService.saveIntegrationTokens('gmail', tokens)
      
      expect(result).toBe(true)
    })

    test('should get integration tokens', async () => {
      const tokens = await workflowService.getIntegrationTokens('gmail')
      
      // Should handle the mock gracefully
      expect(tokens).toBeNull() // Based on our mock
    })
  })

  describe('Data Mapping', () => {
    test('should map StoredWorkflow to SupabaseWorkflow format', () => {
      const storedWorkflow = {
        id: 'test-id',
        name: 'Test Workflow',
        description: 'Test Description',
        nodes: [],
        edges: [],
        state: { status: 'idle', lastModified: Date.now() } as any,
        version: 1
      }

      const result = workflowService.mapToSupabaseWorkflow(storedWorkflow)
      
      expect(result.name).toBe('Test Workflow')
      expect(result.description).toBe('Test Description')
      expect(result.is_active).toBe(false)
    })

    test('should map SupabaseWorkflow to StoredWorkflow format', () => {
      const supabaseWorkflow = {
        id: 'test-id',
        user_id: 'user-id',
        name: 'Test Workflow',
        description: 'Test Description',
        nodes: [],
        edges: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const result = workflowService.mapToStoredWorkflow(supabaseWorkflow)
      
      expect(result.name).toBe('Test Workflow')
      expect(result.state.status).toBe('running')
    })
  })
})
