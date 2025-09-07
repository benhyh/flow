'use client'

import { useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AuthDebugger() {
  const { user, session, isAuthenticated } = useAuth()
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runAuthTest = async () => {
    setLoading(true)
    setTestResults(null)

    try {
      console.log('=== Running Authentication Test ===')
      
      // Test 1: Check current session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        setTestResults({ error: `Session error: ${sessionError.message}` })
        return
      }
      
      if (!currentSession) {
        setTestResults({ error: 'No session found - user not authenticated' })
        return
      }

      const sessionInfo = {
        user_id: currentSession.user.id,
        email: currentSession.user.email,
        role: currentSession.user.role
      }

      console.log('✅ Session found:', sessionInfo)

      // Test 2: Test RLS policies with authenticated user
      const { data: workflows, error: workflowsError } = await supabase
        .from('workflows')
        .select('id, name, user_id')
        .limit(1)

      if (workflowsError) {
        setTestResults({ 
          session: sessionInfo,
          error: `Workflows query error: ${workflowsError.message}` 
        })
        return
      }

      console.log('✅ Workflows query successful:', workflows)

      // Test 3: Test INSERT permission
      const testWorkflow = {
        user_id: currentSession.user.id,
        name: 'Test Workflow',
        description: 'Testing authentication',
        nodes: [],
        edges: [],
        is_active: false
      }

      const { data: insertData, error: insertError } = await supabase
        .from('workflows')
        .insert([testWorkflow])
        .select('id, name, user_id')
        .single()

      if (insertError) {
        setTestResults({ 
          session: sessionInfo,
          workflows: workflows,
          error: `Insert test failed: ${insertError.message}` 
        })
        return
      }

      console.log('✅ Insert test successful:', insertData)

      // Clean up - delete the test workflow
      const { error: deleteError } = await supabase
        .from('workflows')
        .delete()
        .eq('id', insertData.id)

      if (deleteError) {
        console.error('⚠️ Cleanup failed:', deleteError)
      } else {
        console.log('✅ Test workflow cleaned up')
      }

      setTestResults({ 
        session: sessionInfo,
        workflows: workflows,
        insert: insertData,
        cleanup: deleteError ? `Cleanup failed: ${deleteError.message}` : 'Success'
      })

    } catch (error) {
      console.error('❌ Test failed:', error)
      setTestResults({ error: `Test failed: ${error}` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Authentication Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Auth State */}
        <div className="space-y-2">
          <h3 className="font-semibold">Current Auth State:</h3>
          <div className="text-sm space-y-1">
            <div>Authenticated: {isAuthenticated ? '✅ Yes' : '❌ No'}</div>
            {user && (
              <>
                <div>User ID: {user.id}</div>
                <div>Email: {user.email}</div>
              </>
            )}
            {session && (
              <div>Session Role: {session.user.role}</div>
            )}
          </div>
        </div>

        {/* Test Button */}
        <Button 
          onClick={runAuthTest} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Running Test...' : 'Run Authentication Test'}
        </Button>

        {/* Test Results */}
        {testResults && (
          <div className="space-y-2">
            <h3 className="font-semibold">Test Results:</h3>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-60">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
