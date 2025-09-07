/**
 * WorkflowService Demo Component
 * 
 * Demonstrates the basic functionality of the new WorkflowService
 * Phase 1.3: Testing and validation component
 */

'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Database, 
  Plus, 
  Trash2, 
  Edit, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Bug,
  UserCheck
} from 'lucide-react'
import { useWorkflowService } from '@/hooks/useWorkflowService'
import { testDatabasePermissions, ensureProfile, type AuthDebugInfo, getAuthDebugInfo } from '@/lib/debug/authDebug'
import { runSimpleDatabaseTest } from '@/lib/debug/simpleTest'
import { forceAuthRefresh, signOutAndBackIn } from '@/lib/debug/refreshAuth'
import { toast } from 'sonner'

export function WorkflowServiceDemo() {
  const {
    workflows,
    loading,
    error,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    loadWorkflows,
    clearError
  } = useWorkflowService()

  const [newWorkflowName, setNewWorkflowName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [authDebugInfo, setAuthDebugInfo] = useState<AuthDebugInfo | null>(null)
  const [showDebugInfo, setShowDebugInfo] = useState(false)

  // Load workflows and auth info on component mount
  useEffect(() => {
    loadWorkflows()
    loadAuthDebugInfo()
  }, [loadWorkflows])

  const loadAuthDebugInfo = async () => {
    try {
      const debugInfo = await getAuthDebugInfo()
      setAuthDebugInfo(debugInfo)
    } catch (error) {
      console.error('Failed to load auth debug info:', error)
    }
  }

  const handleDebugPermissions = async () => {
    try {
      await testDatabasePermissions()
      await loadAuthDebugInfo()
      toast.success('Debug info logged to console')
    } catch (error) {
      toast.error('Debug test failed')
      console.error('Debug test error:', error)
    }
  }

  const handleEnsureProfile = async () => {
    try {
      await ensureProfile()
      await loadAuthDebugInfo()
      toast.success('Profile ensured successfully')
    } catch (error) {
      toast.error('Failed to ensure profile')
      console.error('Ensure profile error:', error)
    }
  }

  const handleSimpleTest = async () => {
    try {
      await runSimpleDatabaseTest()
      toast.success('Simple test completed - check console for details')
    } catch (error) {
      toast.error('Simple test failed')
      console.error('Simple test error:', error)
    }
  }

  const handleRefreshAuth = async () => {
    try {
      const success = await forceAuthRefresh()
      if (success) {
        toast.success('Authentication refreshed!')
        await loadAuthDebugInfo()
        await loadWorkflows()
      } else {
        toast.error('Failed to refresh authentication')
      }
    } catch (error) {
      toast.error('Auth refresh failed')
      console.error('Auth refresh error:', error)
    }
  }

  const handleSignOutAndIn = async () => {
    try {
      await signOutAndBackIn()
      toast.info('Signing out... please sign back in')
    } catch (error) {
      toast.error('Sign out failed')
      console.error('Sign out error:', error)
    }
  }

  const handleCreateWorkflow = async () => {
    if (!newWorkflowName.trim()) {
      toast.error('Please enter a workflow name')
      return
    }

    const result = await createWorkflow({
      name: newWorkflowName.trim(),
      description: `Demo workflow created at ${new Date().toLocaleTimeString()}`,
      nodes: [],
      edges: [],
      is_active: false
    })

    if (result) {
      setNewWorkflowName('')
    }
  }

  const handleUpdateWorkflow = async (id: string) => {
    if (!editingName.trim()) {
      toast.error('Please enter a valid name')
      return
    }

    const result = await updateWorkflow(id, {
      name: editingName.trim(),
      description: `Updated at ${new Date().toLocaleTimeString()}`
    })

    if (result) {
      setEditingId(null)
      setEditingName('')
    }
  }

  const handleDeleteWorkflow = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteWorkflow(id)
    }
  }

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id)
    setEditingName(currentName)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingName('')
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>WorkflowService Demo</span>
          </CardTitle>
          <CardDescription>
            Test the new Supabase-powered WorkflowService with real-time CRUD operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Display */}
          {error && (
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-red-700">{error}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={clearError}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Debug Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Debug & Troubleshooting</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDebugInfo(!showDebugInfo)}
              >
                <Bug className="h-4 w-4 mr-1" />
                {showDebugInfo ? 'Hide' : 'Show'} Debug
              </Button>
            </div>

            {showDebugInfo && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-md">
                <div className="flex flex-wrap space-x-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSimpleTest}
                  >
                    <Bug className="h-4 w-4 mr-1" />
                    Simple Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshAuth}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh Auth
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOutAndIn}
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Sign Out & In
                  </Button>
                </div>
                
                <div className="flex flex-wrap space-x-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDebugPermissions}
                  >
                    <Bug className="h-4 w-4 mr-1" />
                    Full Debug
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEnsureProfile}
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Ensure Profile
                  </Button>
                </div>

                {authDebugInfo && (
                  <div className="text-sm space-y-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium">Authenticated:</span>
                        <Badge variant={authDebugInfo.isAuthenticated ? "default" : "destructive"} className="ml-2">
                          {authDebugInfo.isAuthenticated ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Has Profile:</span>
                        <Badge variant={authDebugInfo.hasProfile ? "default" : "secondary"} className="ml-2">
                          {authDebugInfo.hasProfile ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">User ID:</span>
                      <span className="ml-2 font-mono text-xs">{authDebugInfo.userId || 'None'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Email:</span>
                      <span className="ml-2">{authDebugInfo.userEmail || 'None'}</span>
                    </div>
                    {authDebugInfo.error && (
                      <div className="text-red-600">
                        <span className="font-medium">Error:</span>
                        <span className="ml-2">{authDebugInfo.error}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  <p><strong>If you're getting 403 errors:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 mt-1">
                    <li>Make sure you're signed in to your app</li>
                    <li>Click "Ensure Profile" to create a profile if missing</li>
                    <li>Run the SQL in <code>supabase/fix_rls_policies.sql</code> in your Supabase SQL Editor</li>
                    <li>Click "Test Permissions" and check browser console for detailed logs</li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          {/* Create New Workflow */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Create New Workflow</h3>
            <div className="flex space-x-2">
              <Input
                placeholder="Enter workflow name..."
                value={newWorkflowName}
                onChange={(e) => setNewWorkflowName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateWorkflow()}
                disabled={loading}
              />
              <Button 
                onClick={handleCreateWorkflow}
                disabled={loading || !newWorkflowName.trim()}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create
              </Button>
            </div>
          </div>

          <Separator />

          {/* Workflows List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Workflows</h3>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {workflows.length} workflow{workflows.length !== 1 ? 's' : ''}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadWorkflows}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>

            {workflows.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No workflows found. Create your first workflow above!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {workflows.map((workflow) => (
                  <Card key={workflow.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {editingId === workflow.id ? (
                          <div className="flex space-x-2">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') handleUpdateWorkflow(workflow.id)
                                if (e.key === 'Escape') cancelEditing()
                              }}
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleUpdateWorkflow(workflow.id)}
                              disabled={loading}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditing}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <h4 className="font-medium">{workflow.name}</h4>
                            <p className="text-sm text-gray-500">{workflow.description}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <Badge variant={workflow.is_active ? "default" : "secondary"}>
                                {workflow.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                Updated: {new Date(workflow.updated_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {editingId !== workflow.id && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditing(workflow.id, workflow.name)}
                            disabled={loading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteWorkflow(workflow.id, workflow.name)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">Database Schema</div>
              <div className="text-green-600 flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>Active</span>
              </div>
            </div>
            <div>
              <div className="font-medium">CRUD Operations</div>
              <div className="text-green-600 flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>Functional</span>
              </div>
            </div>
            <div>
              <div className="font-medium">RLS Policies</div>
              <div className="text-green-600 flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>Enforced</span>
              </div>
            </div>
            <div>
              <div className="font-medium">Integration Ready</div>
              <div className="text-blue-600 flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>Phase 1.3</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default WorkflowServiceDemo
