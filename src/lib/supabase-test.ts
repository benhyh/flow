import { supabase } from './supabase-client'

/**
 * Test Supabase connection and configuration
 */
export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...')
  
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
  
  try {
    // Test basic connection
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Supabase connection error:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection successful')
    console.log('Current session:', data.session ? 'Authenticated' : 'Not authenticated')
    
    // Test database connection
    try {
      const { data: _testData, error: dbError } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      if (dbError) {
        console.warn('⚠️ Database access error (this is normal if schema not applied):', dbError.message)
      } else {
        console.log('✅ Database connection successful')
      }
    } catch (dbError) {
      console.warn('⚠️ Database test failed:', dbError)
    }
    
    return true
  } catch (error) {
    console.error('❌ Supabase test failed:', error)
    return false
  }
}

/**
 * Test authentication methods
 */
export async function testAuthMethods() {
  console.log('🔍 Testing authentication methods...')
  
  try {
    // Test sign up (this will fail if user exists, which is expected)
    const testEmail = 'test@example.com'
    const testPassword = 'testpassword123'
    
    console.log('Testing sign up method...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    })
    
    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('✅ Sign up method working (user already exists)')
      } else {
        console.log('Sign up error:', signUpError.message)
      }
    } else {
      console.log('✅ Sign up method working')
      console.log('Needs email confirmation:', !signUpData.session && signUpData.user)
    }
    
    // Test sign in (this will fail if user doesn't exist, which is expected)
    console.log('Testing sign in method...')
    const { data: _signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    if (signInError) {
      console.log('Sign in error (expected if user not confirmed):', signInError.message)
    } else {
      console.log('✅ Sign in method working')
      
      // Sign out the test user
      await supabase.auth.signOut()
    }
    
  } catch (error) {
    console.error('❌ Auth methods test failed:', error)
  }
}

/**
 * Run all Supabase tests
 */
export async function runSupabaseTests() {
  console.log('🚀 Running Supabase tests...')
  console.log('=====================================')
  
  const connectionOk = await testSupabaseConnection()
  
  if (connectionOk) {
    await testAuthMethods()
  }
  
  console.log('=====================================')
  console.log('✅ Supabase tests completed')
}