/**
 * Debug script to test authentication in app context
 * Run this in your browser console when logged in
 */

import { supabase } from '@/lib/supabase-client'

export async function testAuth() {
  console.log('=== Testing Authentication ===')
  
  try {
    // Test 1: Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError)
      return
    }
    
    if (!session) {
      console.error('❌ No session found - user not authenticated')
      return
    }
    
    console.log('✅ Session found:', {
      user_id: session.user.id,
      email: session.user.email,
      role: session.user.role
    })
    
    // Test 2: Test RLS policies with authenticated user
    const { data: workflows, error: workflowsError } = await supabase
      .from('workflows')
      .select('id, name, user_id')
      .limit(1)
    
    if (workflowsError) {
      console.error('❌ Workflows query error:', workflowsError)
    } else {
      console.log('✅ Workflows query successful:', workflows)
    }
    
    // Test 3: Test INSERT permission
    const testWorkflow = {
      user_id: session.user.id,
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
      console.error('❌ Insert test failed:', insertError)
    } else {
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
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testAuth = testAuth
}
