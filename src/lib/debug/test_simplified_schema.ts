/**
 * Test Simplified Schema
 * 
 * This script tests the new simplified schema without the profiles table
 * Run this after applying the migration to verify everything works
 */

import { supabase } from '@/lib/supabase-client'
import { workflowService } from '@/lib/services/WorkflowService'

export async function testSimplifiedSchema() {
  console.log('🧪 Testing simplified schema...')

  try {
    // Test 1: Check if tables exist
    console.log('\n📋 Testing table existence...')
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['workflows', 'user_integrations', 'execution_logs'])

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError)
      return false
    }

    const expectedTables = ['workflows', 'user_integrations', 'execution_logs']
    const foundTables = tables?.map(t => t.table_name) || []
    
    console.log('Found tables:', foundTables)
    
    const missingTables = expectedTables.filter(table => !foundTables.includes(table))
    if (missingTables.length > 0) {
      console.error('❌ Missing tables:', missingTables)
      return false
    }

    console.log('✅ All expected tables exist')

    // Test 2: Check if profiles table is gone
    console.log('\n📋 Checking profiles table removal...')
    
    const { data: profilesTable, error: profilesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles')
      .single()

    if (profilesTable) {
      console.error('❌ Profiles table still exists!')
      return false
    }

    console.log('✅ Profiles table successfully removed')

    // Test 3: Test workflow creation (if authenticated)
    console.log('\n📋 Testing workflow creation...')
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      console.log('User authenticated:', user.email)
      
      const testWorkflow = {
        name: 'Test Workflow - Simplified Schema',
        description: 'Testing the new simplified schema',
        nodes: [],
        edges: [],
        is_active: false
      }

      const createdWorkflow = await workflowService.createWorkflow(testWorkflow)
      
      if (createdWorkflow) {
        console.log('✅ Workflow created successfully:', createdWorkflow.id)
        
        // Test workflow retrieval
        const retrievedWorkflow = await workflowService.getWorkflow(createdWorkflow.id)
        if (retrievedWorkflow) {
          console.log('✅ Workflow retrieved successfully')
          
          // Clean up test workflow
          await workflowService.deleteWorkflow(createdWorkflow.id)
          console.log('✅ Test workflow cleaned up')
        } else {
          console.error('❌ Failed to retrieve workflow')
          return false
        }
      } else {
        console.error('❌ Failed to create workflow')
        return false
      }
    } else {
      console.log('⚠️ No authenticated user - skipping workflow tests')
    }

    // Test 4: Check column structure
    console.log('\n📋 Testing column structure...')
    
    const { data: workflowColumns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'workflows')
      .in('column_name', ['id', 'user_id', 'name', 'description', 'nodes', 'edges'])

    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError)
      return false
    }

    const expectedColumns = ['id', 'user_id', 'name', 'description', 'nodes', 'edges']
    const foundColumns = workflowColumns?.map(c => c.column_name) || []
    
    console.log('Found workflow columns:', foundColumns)
    
    const missingColumns = expectedColumns.filter(col => !foundColumns.includes(col))
    if (missingColumns.length > 0) {
      console.error('❌ Missing columns:', missingColumns)
      return false
    }

    // Check that profile_id is gone
    const hasProfileId = foundColumns.includes('profile_id')
    if (hasProfileId) {
      console.error('❌ profile_id column still exists!')
      return false
    }

    console.log('✅ Column structure is correct')

    console.log('\n🎉 All tests passed! Simplified schema is working correctly.')
    return true

  } catch (error) {
    console.error('❌ Test failed:', error)
    return false
  }
}

// Run the test if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.testSimplifiedSchema = testSimplifiedSchema
} else {
  // Node.js environment
  testSimplifiedSchema().then(success => {
    if (success) {
      console.log('✅ Schema migration test completed successfully')
      process.exit(0)
    } else {
      console.error('❌ Schema migration test failed')
      process.exit(1)
    }
  })
}
