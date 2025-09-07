/**
 * Test Database Connection
 * Simple test to verify if database operations are working
 */

import { supabase } from './supabase-client'
import WorkflowDatabaseClient from './database-client'

/**
 * Test basic Supabase connection
 */
export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...')
  
  try {
    // Check environment variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('Environment variables:')
    console.log('- SUPABASE_URL:', url ? '✅ Set' : '❌ Missing')
    console.log('- SUPABASE_ANON_KEY:', key ? '✅ Set' : '❌ Missing')
    
    if (!url || !key) {
      console.error('❌ Missing Supabase environment variables')
      return false
    }
    
    // Test basic connection
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Supabase connection error:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection successful')
    console.log('Current session:', data.session ? 'Authenticated' : 'Not authenticated')
    
    return true
  } catch (error) {
    console.error('❌ Supabase test failed:', error)
    return false
  }
}

/**
 * Test database operations
 */
export async function testDatabaseOperations() {
  console.log('🔍 Testing database operations...')
  
  try {
    // Test 1: Check if workflows table exists
    console.log('📝 Test 1: Checking workflows table...')
    const { data: tableCheck, error: tableError } = await supabase
      .from('workflows')
      .select('count')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Workflows table error:', tableError.message)
      if (tableError.message.includes('does not exist')) {
        console.error('💡 Solution: Run the database migration in Supabase SQL Editor')
        console.error('   File: supabase/migrations/001_initial_workflow_schema.sql')
      }
      return false
    }
    
    console.log('✅ Workflows table exists')
    
    // Test 2: Check if user is authenticated
    console.log('📝 Test 2: Checking authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('❌ Authentication error:', authError.message)
      return false
    }
    
    if (!user) {
      console.error('❌ No authenticated user')
      console.error('💡 Solution: User needs to be logged in to save workflows')
      return false
    }
    
    console.log('✅ User authenticated:', user.id)
    
    // Test 3: Try to get user workflows
    console.log('📝 Test 3: Testing getUserWorkflows...')
    const { data: workflows, error: workflowsError } = await WorkflowDatabaseClient.getUserWorkflows()
    
    if (workflowsError) {
      console.error('❌ getUserWorkflows error:', workflowsError)
      return false
    }
    
    console.log('✅ getUserWorkflows successful, found', workflows?.length || 0, 'workflows')
    
    return true
  } catch (error) {
    console.error('❌ Database operations test failed:', error)
    return false
  }
}

/**
 * Test creating a simple workflow
 */
export async function testCreateWorkflow() {
  console.log('🔍 Testing workflow creation...')
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ No authenticated user for test')
      return false
    }
    
    // Create a test workflow
    const testWorkflow = {
      name: 'Test Workflow - ' + new Date().toISOString(),
      description: 'This is a test workflow created by the database test'
    }
    
    console.log('📝 Creating test workflow:', testWorkflow.name)
    
    const { data: workflow, error: createError } = await WorkflowDatabaseClient.createWorkflow(
      user.id,
      testWorkflow
    )
    
    if (createError) {
      console.error('❌ Create workflow error:', createError)
      return false
    }
    
    console.log('✅ Test workflow created successfully:', workflow?.id)
    
    // Clean up - delete the test workflow
    if (workflow?.id) {
      console.log('🧹 Cleaning up test workflow...')
      const { error: deleteError } = await WorkflowDatabaseClient.deleteWorkflow(
        workflow.id,
        user.id
      )
      
      if (deleteError) {
        console.warn('⚠️ Failed to delete test workflow:', deleteError)
      } else {
        console.log('✅ Test workflow cleaned up')
      }
    }
    
    return true
  } catch (error) {
    console.error('❌ Create workflow test failed:', error)
    return false
  }
}

/**
 * Run all database tests
 */
export async function runAllDatabaseTests() {
  console.log('🚀 Running All Database Tests...')
  console.log('=' .repeat(50))
  
  const results = {
    connection: false,
    operations: false,
    createWorkflow: false
  }
  
  // Test connection
  results.connection = await testSupabaseConnection()
  
  if (results.connection) {
    // Test operations
    results.operations = await testDatabaseOperations()
    
    if (results.operations) {
      // Test creating workflow
      results.createWorkflow = await testCreateWorkflow()
    }
  }
  
  console.log('=' .repeat(50))
  console.log('📊 Test Results:')
  console.log('- Connection:', results.connection ? '✅ PASS' : '❌ FAIL')
  console.log('- Operations:', results.operations ? '✅ PASS' : '❌ FAIL')
  console.log('- Create Workflow:', results.createWorkflow ? '✅ PASS' : '❌ FAIL')
  
  const allPassed = Object.values(results).every(result => result === true)
  console.log('=' .repeat(50))
  console.log(allPassed ? '🎉 All database tests passed!' : '❌ Some database tests failed')
  
  if (!allPassed) {
    console.log('')
    console.log('💡 Troubleshooting:')
    if (!results.connection) {
      console.log('- Check your Supabase environment variables')
    }
    if (!results.operations) {
      console.log('- Run the database migration: supabase/migrations/001_initial_workflow_schema.sql')
      console.log('- Make sure you are logged in to the application')
    }
  }
  
  return allPassed
}

// Export for use in development
if (typeof window !== 'undefined') {
  (window as any).testDatabase = runAllDatabaseTests
}
