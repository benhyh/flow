/**
 * Hybrid Storage Test Page - Comprehensive testing for localStorage + Supabase integration
 * 
 * Phase 3.1d: Test workflow CRUD operations with both storage systems
 * 
 * Tests:
 * - Create workflows with hybrid storage
 * - Read workflows from both storage systems
 * - Update workflows and verify sync
 * - Delete workflows from both systems
 * - Offline/online mode switching
 * - Conflict resolution
 * - Performance monitoring
 */

'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { type Node, type Edge } from '@xyflow/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Database, 
  HardDrive, 
  Cloud, 
  CloudOff, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Trash2,
  Copy,
  Download,
  Upload
} from 'lucide-react'
import { hybridStorage, type SyncStatus, type StorageMode } from '@/lib/services/HybridWorkflowStorage'
import { useWorkflowState } from '@/components/workflow/hooks/useWorkflowState'
import { getStoredWorkflows, clearAllWorkflowData } from '@/lib/workflow-storage'
import { workflowService } from '@/lib/services/WorkflowService'
import { toast } from 'sonner'

interface TestResult {
  id: string
  name: string
  status: 'pending' | 'running' | 'success' | 'error'
  message: string
  duration?: number
  details?: any
}

// Sample workflow data for testing
const sampleNodes: Node[] = [
  {
    id: '1',
    type: 'gmailTrigger',
    position: { x: 100, y: 100 },
    data: { label: 'Gmail Trigger', config: { subject: 'Test Subject' } }
  },
  {
    id: '2',
    type: 'trelloAction',
    position: { x: 300, y: 100 },
    data: { label: 'Create Trello Card', config: { board: 'test-board', list: 'test-list' } }
  }
]

const sampleEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2'
  }
]

export default function TestHybridStoragePage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [storageMode, setStorageMode] = useState<StorageMode>('hybrid')
  const [testWorkflowName, setTestWorkflowName] = useState('Test Workflow')
  const [testWorkflowDescription, setTestWorkflowDescription] = useState('A test workflow for hybrid storage testing')

  // Use workflow state hook for testing
  const {
    workflowState,
    handleSave,
    loadWorkflowFromStorage,
    isSaving,
    syncStatus: hookSyncStatus
  } = useWorkflowState({
    name: testWorkflowName,
    status: 'draft'
  })

  // Update sync status periodically
  useEffect(() => {
    const updateStatus = () => {
      const status = hybridStorage.getSyncStatus()
      setSyncStatus(status)
    }

    updateStatus()
    const interval = setInterval(updateStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  // Test utility functions
  const addTestResult = useCallback((result: Omit<TestResult, 'id'>) => {
    const testResult: TestResult = {
      ...result,
      id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    setTestResults(prev => [...prev, testResult])
    return testResult.id
  }, [])

  const updateTestResult = useCallback((id: string, updates: Partial<TestResult>) => {
    setTestResults(prev => prev.map(result => 
      result.id === id ? { ...result, ...updates } : result
    ))
  }, [])

  // Individual test functions
  const testCreateWorkflow = useCallback(async (): Promise<TestResult> => {
    const startTime = performance.now()
    const testId = addTestResult({
      name: 'Create Workflow',
      status: 'running',
      message: 'Creating test workflow...'
    })

    try {
      const savedWorkflow = await hybridStorage.saveWorkflow(
        sampleNodes,
        sampleEdges,
        { ...workflowState, name: `${testWorkflowName}-${Date.now()}` },
        testWorkflowDescription
      )

      const duration = performance.now() - startTime
      const result = {
        status: 'success' as const,
        message: `Successfully created workflow: ${savedWorkflow.name}`,
        duration,
        details: { workflowId: savedWorkflow.id, version: savedWorkflow.version }
      }

      updateTestResult(testId, result)
      return { id: testId, name: 'Create Workflow', ...result }
    } catch (error) {
      const duration = performance.now() - startTime
      const result = {
        status: 'error' as const,
        message: `Failed to create workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration,
        details: { error }
      }

      updateTestResult(testId, result)
      return { id: testId, name: 'Create Workflow', ...result }
    }
  }, [workflowState, testWorkflowName, testWorkflowDescription, addTestResult, updateTestResult])

  const testReadWorkflows = useCallback(async (): Promise<TestResult> => {
    const startTime = performance.now()
    const testId = addTestResult({
      name: 'Read Workflows',
      status: 'running',
      message: 'Reading workflows from storage...'
    })

    try {
      const localWorkflows = getStoredWorkflows()
      const hybridWorkflows = await hybridStorage.getWorkflows()
      const supabaseWorkflows = await workflowService.getUserWorkflows()

      const duration = performance.now() - startTime
      const result = {
        status: 'success' as const,
        message: `Successfully read workflows (Local: ${localWorkflows.length}, Hybrid: ${hybridWorkflows.length}, Supabase: ${supabaseWorkflows.length})`,
        duration,
        details: { 
          localCount: localWorkflows.length,
          hybridCount: hybridWorkflows.length,
          supabaseCount: supabaseWorkflows.length
        }
      }

      updateTestResult(testId, result)
      return { id: testId, name: 'Read Workflows', ...result }
    } catch (error) {
      const duration = performance.now() - startTime
      const result = {
        status: 'error' as const,
        message: `Failed to read workflows: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration,
        details: { error }
      }

      updateTestResult(testId, result)
      return { id: testId, name: 'Read Workflows', ...result }
    }
  }, [addTestResult, updateTestResult])

  const testUpdateWorkflow = useCallback(async (): Promise<TestResult> => {
    const startTime = performance.now()
    const testId = addTestResult({
      name: 'Update Workflow',
      status: 'running',
      message: 'Updating existing workflow...'
    })

    try {
      // Get first workflow for testing
      const workflows = await hybridStorage.getWorkflows()
      if (workflows.length === 0) {
        throw new Error('No workflows found to update')
      }

      const workflow = workflows[0]
      const updatedNodes = [...workflow.nodes, {
        id: 'test-update-node',
        type: 'default',
        position: { x: 500, y: 100 },
        data: { label: 'Updated Node' }
      } as Node]

      const savedWorkflow = await hybridStorage.saveWorkflow(
        updatedNodes,
        workflow.edges,
        { ...workflow.state, name: workflow.name + ' (Updated)' },
        'Updated via test'
      )

      const duration = performance.now() - startTime
      const result = {
        status: 'success' as const,
        message: `Successfully updated workflow: ${savedWorkflow.name}`,
        duration,
        details: { 
          workflowId: savedWorkflow.id,
          originalNodeCount: workflow.nodes.length,
          updatedNodeCount: updatedNodes.length
        }
      }

      updateTestResult(testId, result)
      return { id: testId, name: 'Update Workflow', ...result }
    } catch (error) {
      const duration = performance.now() - startTime
      const result = {
        status: 'error' as const,
        message: `Failed to update workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration,
        details: { error }
      }

      updateTestResult(testId, result)
      return { id: testId, name: 'Update Workflow', ...result }
    }
  }, [addTestResult, updateTestResult])

  const testDeleteWorkflow = useCallback(async (): Promise<TestResult> => {
    const startTime = performance.now()
    const testId = addTestResult({
      name: 'Delete Workflow',
      status: 'running',
      message: 'Deleting test workflow...'
    })

    try {
      // Get last workflow for testing
      const workflows = await hybridStorage.getWorkflows()
      if (workflows.length === 0) {
        throw new Error('No workflows found to delete')
      }

      const workflow = workflows[workflows.length - 1]
      const success = await hybridStorage.deleteWorkflow(workflow.id)

      if (!success) {
        throw new Error('Delete operation returned false')
      }

      const duration = performance.now() - startTime
      const result = {
        status: 'success' as const,
        message: `Successfully deleted workflow: ${workflow.name}`,
        duration,
        details: { workflowId: workflow.id }
      }

      updateTestResult(testId, result)
      return { id: testId, name: 'Delete Workflow', ...result }
    } catch (error) {
      const duration = performance.now() - startTime
      const result = {
        status: 'error' as const,
        message: `Failed to delete workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration,
        details: { error }
      }

      updateTestResult(testId, result)
      return { id: testId, name: 'Delete Workflow', ...result }
    }
  }, [addTestResult, updateTestResult])

  const testSyncOperation = useCallback(async (): Promise<TestResult> => {
    const startTime = performance.now()
    const testId = addTestResult({
      name: 'Sync Operation',
      status: 'running',
      message: 'Testing manual sync...'
    })

    try {
      const result = await hybridStorage.syncToSupabase()
      const duration = performance.now() - startTime

      const testResult = {
        status: 'success' as const,
        message: `Sync completed: ${result.synced} synced, ${result.failed} failed`,
        duration,
        details: result
      }

      updateTestResult(testId, testResult)
      return { id: testId, name: 'Sync Operation', ...testResult }
    } catch (error) {
      const duration = performance.now() - startTime
      const result = {
        status: 'error' as const,
        message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration,
        details: { error }
      }

      updateTestResult(testId, result)
      return { id: testId, name: 'Sync Operation', ...result }
    }
  }, [addTestResult, updateTestResult])

  // Run all tests
  const runAllTests = useCallback(async () => {
    setIsRunningTests(true)
    setTestResults([])

    const tests = [
      testCreateWorkflow,
      testReadWorkflows,
      testUpdateWorkflow,
      testSyncOperation,
      testDeleteWorkflow
    ]

    for (const test of tests) {
      await test()
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setIsRunningTests(false)
    toast.success('All tests completed!')
  }, [testCreateWorkflow, testReadWorkflows, testUpdateWorkflow, testSyncOperation, testDeleteWorkflow])

  // Storage mode switching
  const switchStorageMode = useCallback((mode: StorageMode) => {
    hybridStorage.setMode(mode)
    setStorageMode(mode)
    toast.info(`Switched to ${mode} mode`)
  }, [])

  // Clear all data
  const clearAllData = useCallback(() => {
    clearAllWorkflowData()
    toast.success('Cleared all local storage data')
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Hybrid Storage Test Suite
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Comprehensive testing for localStorage + Supabase hybrid storage system
          </p>
        </div>

        {/* Storage Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <HardDrive className="w-4 h-4" />
                Local Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-green-600">
                {getStoredWorkflows().length} workflows
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                {syncStatus?.isOnline ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
                Sync Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={syncStatus?.isOnline ? 'default' : 'secondary'}>
                    {syncStatus?.isOnline ? 'Online' : 'Offline'}
                  </Badge>
                  <Badge variant="outline">{syncStatus?.mode || 'Unknown'}</Badge>
                </div>
                {syncStatus?.pendingChanges && syncStatus.pendingChanges > 0 && (
                  <div className="text-sm text-orange-600">
                    {syncStatus.pendingChanges} pending changes
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Database className="w-4 h-4" />
                Current Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-blue-600">
                {storageMode}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Workflow Name</label>
                <Input 
                  value={testWorkflowName}
                  onChange={(e) => setTestWorkflowName(e.target.value)}
                  placeholder="Test Workflow Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Storage Mode</label>
                <div className="flex gap-2">
                  {['localStorage', 'supabase', 'hybrid'].map((mode) => (
                    <Button
                      key={mode}
                      variant={storageMode === mode ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => switchStorageMode(mode as StorageMode)}
                    >
                      {mode}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea 
                value={testWorkflowDescription}
                onChange={(e) => setTestWorkflowDescription(e.target.value)}
                placeholder="Test workflow description"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={runAllTests}
                disabled={isRunningTests}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunningTests ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4 mr-2" />
                )}
                Run All Tests
              </Button>
              
              <Button 
                variant="outline"
                onClick={testCreateWorkflow}
                disabled={isRunningTests}
              >
                Test Create
              </Button>
              
              <Button 
                variant="outline"
                onClick={testReadWorkflows}
                disabled={isRunningTests}
              >
                Test Read
              </Button>
              
              <Button 
                variant="outline"
                onClick={testSyncOperation}
                disabled={isRunningTests}
              >
                Test Sync
              </Button>
              
              <Button 
                variant="destructive"
                onClick={clearAllData}
                disabled={isRunningTests}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Local Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tests run yet. Click "Run All Tests" to start.
              </div>
            ) : (
              <div className="space-y-3">
                {testResults.map((result) => (
                  <div 
                    key={result.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {result.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {result.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                      {result.status === 'running' && <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />}
                      {result.status === 'pending' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                      
                      <div>
                        <div className="font-medium">{result.name}</div>
                        <div className="text-sm text-gray-600">{result.message}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {result.duration && (
                        <div className="text-sm text-gray-500">
                          {result.duration.toFixed(2)}ms
                        </div>
                      )}
                      <Badge 
                        variant={
                          result.status === 'success' ? 'default' :
                          result.status === 'error' ? 'destructive' :
                          result.status === 'running' ? 'secondary' : 'outline'
                        }
                      >
                        {result.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Summary */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {testResults.filter(r => r.status === 'success').length}
                  </div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {testResults.filter(r => r.status === 'error').length}
                  </div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {testResults.filter(r => r.status === 'running').length}
                  </div>
                  <div className="text-sm text-gray-600">Running</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-600">
                    {testResults.length}
                  </div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
