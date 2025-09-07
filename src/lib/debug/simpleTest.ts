/**
 * Simple Database Test
 * Tests basic table access without RLS complexity
 */

import { supabase } from '@/lib/supabase-client'

export async function runSimpleDatabaseTest() {
  console.log('🧪 Running Simple Database Test...')
  console.log('=====================================')

  try {
    // Test 1: Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('❌ Auth Error:', authError.message)
      return false
    }
    
    if (!user) {
      console.log('❌ User not authenticated')
      return false
    }
    
    console.log('✅ User authenticated:', user.id)
    console.log('✅ User email:', user.email)

    // Test 2: Try to access profiles table directly
    console.log('\n📋 Testing profiles table...')
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)

      if (profilesError) {
        console.log('❌ Profiles error:', profilesError.message)
        console.log('❌ Error code:', profilesError.code)
        console.log('❌ Error details:', profilesError.details)
      } else {
        console.log('✅ Profiles table accessible')
      }
    } catch (error) {
      console.log('❌ Profiles table error:', error)
    }

    // Test 3: Try to access workflows table directly
    console.log('\n📋 Testing workflows table...')
    try {
      const { data: workflows, error: workflowsError } = await supabase
        .from('workflows')
        .select('count')
        .limit(1)

      if (workflowsError) {
        console.log('❌ Workflows error:', workflowsError.message)
        console.log('❌ Error code:', workflowsError.code)
        console.log('❌ Error details:', workflowsError.details)
        
        // Check if it's specifically RLS
        if (workflowsError.code === '42501') {
          console.log('🔍 This is a permission error (42501)')
          console.log('💡 RLS might still be enabled or policies exist')
        }
      } else {
        console.log('✅ Workflows table accessible')
      }
    } catch (error) {
      console.log('❌ Workflows table error:', error)
    }

    // Test 4: Check environment variables
    console.log('\n🔧 Environment Check...')
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
    console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')

    return true

  } catch (error) {
    console.log('❌ Test failed:', error)
    return false
  }
}

// Export for use in components
export default runSimpleDatabaseTest
